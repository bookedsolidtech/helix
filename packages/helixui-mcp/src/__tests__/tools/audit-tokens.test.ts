/**
 * Unit tests for tools/audit-tokens.ts
 *
 * auditTokens() scans CSS files for --hx-* token declarations and flags
 * unknown, deprecated, and tier-violation usages. We write minimal CSS
 * temp files and wire up a temp tokens.json so the TokenParser has a schema
 * to validate against.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { auditTokens, formatAuditReport } from '../../tools/audit-tokens.js';

// ─── Token schema fixture ─────────────────────────────────────────────────────
//
// Matches the structure expected by TokenParser:
//   category → group → leaf({ value })
//
// Tier classification:
//   color, spacing → primitive
//   semantic       → semantic
//   button, card   → component

const FIXTURE_TOKENS = {
  color: {
    primary: {
      '500': { value: '#2563EB' },
      '900': { value: '#1E3A8A' },
    },
    neutral: {
      '0': { value: '#FFFFFF' },
    },
  },
  spacing: {
    md: { value: '1rem' },
  },
  semantic: {
    'color-primary': { value: 'var(--hx-color-primary-500)' },
  },
  button: {
    bg: { value: 'var(--hx-color-primary-500)' },
    color: { value: '#FFFFFF' },
    'text-deprecated': { value: 'red', description: 'deprecated: use --hx-button-color instead' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];
let tokensPath: string;

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `audit-tokens-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function writeCss(dir: string, filename: string, content: string): string {
  const fullPath = join(dir, filename);
  writeFileSync(fullPath, content, 'utf8');
  return fullPath;
}

beforeEach(() => {
  // Write temp tokens file and point env var at it so TokenParser picks it up
  const dir = makeTempDir();
  tokensPath = join(dir, 'tokens.json');
  writeFileSync(tokensPath, JSON.stringify(FIXTURE_TOKENS), 'utf8');
  process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
});

afterEach(() => {
  delete process.env['HELIXUI_MCP_TOKENS_PATH'];
  for (const d of tempDirs.splice(0)) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('auditTokens()', () => {
  // ── error handling ──────────────────────────────────────────────────────────

  it('throws when the path does not exist', () => {
    expect(() => auditTokens({ path: '/nonexistent/path/styles.css' })).toThrow();
  });

  it('throws when a file path is not a CSS file', () => {
    const dir = makeTempDir();
    const tsFile = join(dir, 'app.ts');
    writeFileSync(tsFile, 'const x = 1;', 'utf8');
    expect(() => auditTokens({ path: tsFile })).toThrow();
  });

  // ── no issues ───────────────────────────────────────────────────────────────

  it('returns zero findings for a CSS file with only valid tokens', () => {
    const dir = makeTempDir();
    writeCss(
      dir,
      'styles.css',
      `.btn { --hx-color-primary-500: #1234; }`,
    );
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.unknown).toHaveLength(0);
    expect(report.findings.deprecated).toHaveLength(0);
    expect(report.findings.tierViolations).toHaveLength(0);
  });

  it('reports all-valid summary for clean CSS', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.btn { --hx-color-primary-500: #new; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.summary).toContain('valid');
  });

  // ── unknown tokens ──────────────────────────────────────────────────────────

  it('flags unknown --hx-* tokens not in the schema', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.foo { --hx-nonexistent-token: red; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.unknown.length).toBeGreaterThan(0);
    expect(report.findings.unknown[0]?.token).toBe('--hx-nonexistent-token');
    expect(report.findings.unknown[0]?.category).toBe('unknown');
  });

  it('unknown finding includes suggestion', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.foo { --hx-made-up: blue; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.unknown[0]?.suggestion).toBeTruthy();
  });

  it('unknown finding includes file and line number', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.foo { --hx-made-up: blue; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(typeof report.findings.unknown[0]?.line).toBe('number');
    expect(report.findings.unknown[0]?.file).toContain('styles.css');
  });

  // ── deprecated tokens ────────────────────────────────────────────────────────

  it('flags tokens with "deprecated" in their description', () => {
    const dir = makeTempDir();
    // --hx-button-text-deprecated has description containing "deprecated" in our fixture
    writeCss(dir, 'styles.css', `.foo { --hx-button-text-deprecated: orange; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.deprecated.length).toBeGreaterThan(0);
    expect(report.findings.deprecated[0]?.category).toBe('deprecated');
  });

  it('deprecated finding includes suggestion', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.foo { --hx-button-text-deprecated: orange; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.deprecated[0]?.suggestion).toBeTruthy();
  });

  // ── tier violations ──────────────────────────────────────────────────────────

  it('flags component-tier tokens overridden at :root level', () => {
    const dir = makeTempDir();
    // --hx-button-bg is a component-tier token in our fixture
    writeCss(dir, 'styles.css', `:root { --hx-button-bg: blue; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.tierViolations.length).toBeGreaterThan(0);
    expect(report.findings.tierViolations[0]?.category).toBe('tier-violation');
  });

  it('flags component-tier tokens overridden at html level', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `html { --hx-button-bg: pink; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.tierViolations.length).toBeGreaterThan(0);
  });

  it('does NOT flag component-tier tokens inside a scoped selector', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.my-theme { --hx-button-bg: blue; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.tierViolations).toHaveLength(0);
  });

  it('does NOT flag semantic tokens at :root (valid pattern)', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `:root { --hx-color-primary-500: #ff0000; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.findings.tierViolations).toHaveLength(0);
  });

  // ── directory scanning ───────────────────────────────────────────────────────

  it('scans all CSS files in a directory', () => {
    const dir = makeTempDir();
    writeCss(dir, 'a.css', `.a { --hx-made-up-1: red; }`);
    writeCss(dir, 'b.css', `.b { --hx-made-up-2: blue; }`);
    const report = auditTokens({ path: dir });
    expect(report.filesScanned).toBe(2);
    expect(report.findings.unknown.length).toBeGreaterThanOrEqual(2);
  });

  it('counts total declarations correctly', () => {
    const dir = makeTempDir();
    writeCss(
      dir,
      'styles.css',
      `.a { --hx-color-primary-500: red; --hx-made-up: blue; }`,
    );
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.totalDeclarations).toBe(2);
    expect(report.validTokens).toBe(1);
  });

  it('counts valid tokens separately from findings', () => {
    const dir = makeTempDir();
    writeCss(
      dir,
      'styles.css',
      `.a { --hx-color-primary-500: ok; --hx-color-neutral-0: ok; --hx-unknown-token: bad; }`,
    );
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(report.validTokens).toBe(2);
    expect(report.findings.unknown).toHaveLength(1);
  });

  // ── report shape ─────────────────────────────────────────────────────────────

  it('report has correct structure', () => {
    const dir = makeTempDir();
    writeCss(dir, 'styles.css', `.x { --hx-color-primary-500: ok; }`);
    const report = auditTokens({ path: join(dir, 'styles.css') });
    expect(typeof report.path).toBe('string');
    expect(typeof report.filesScanned).toBe('number');
    expect(typeof report.totalDeclarations).toBe('number');
    expect(typeof report.validTokens).toBe('number');
    expect(typeof report.summary).toBe('string');
    expect(report.findings).toHaveProperty('unknown');
    expect(report.findings).toHaveProperty('deprecated');
    expect(report.findings).toHaveProperty('tierViolations');
  });
});

// ─── formatAuditReport ────────────────────────────────────────────────────────

describe('formatAuditReport()', () => {
  it('includes report header', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 1,
      totalDeclarations: 0,
      validTokens: 0,
      findings: { unknown: [], deprecated: [], tierViolations: [] },
      summary: 'All valid.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('Token Audit Report');
  });

  it('includes path, files scanned, declarations, and valid counts', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 3,
      totalDeclarations: 10,
      validTokens: 8,
      findings: { unknown: [], deprecated: [], tierViolations: [] },
      summary: 'Found 2 issues.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('3');
    expect(text).toContain('10');
    expect(text).toContain('8');
  });

  it('includes unknown token section when findings exist', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 1,
      totalDeclarations: 1,
      validTokens: 0,
      findings: {
        unknown: [
          {
            token: '--hx-fake',
            file: '/tmp/styles.css',
            line: 5,
            value: 'red',
            category: 'unknown' as const,
            message: 'Token "--hx-fake" is not in the schema.',
            suggestion: 'Check the token name.',
          },
        ],
        deprecated: [],
        tierViolations: [],
      },
      summary: 'Found 1 issue.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('Unknown Tokens');
    expect(text).toContain('--hx-fake');
    expect(text).toContain('[UNKNOWN]');
  });

  it('includes deprecated section when findings exist', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 1,
      totalDeclarations: 1,
      validTokens: 0,
      findings: {
        unknown: [],
        deprecated: [
          {
            token: '--hx-old-token',
            file: '/tmp/styles.css',
            line: 2,
            value: 'blue',
            category: 'deprecated' as const,
            message: 'Token is deprecated.',
          },
        ],
        tierViolations: [],
      },
      summary: 'Found 1 issue.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('Deprecated Tokens');
    expect(text).toContain('[DEPRECATED]');
    expect(text).toContain('--hx-old-token');
  });

  it('includes tier-violation section when findings exist', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 1,
      totalDeclarations: 1,
      validTokens: 0,
      findings: {
        unknown: [],
        deprecated: [],
        tierViolations: [
          {
            token: '--hx-button-bg',
            file: '/tmp/styles.css',
            line: 8,
            value: 'pink',
            category: 'tier-violation' as const,
            message: 'Tier violation.',
          },
        ],
      },
      summary: 'Found 1 issue.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('Tier Violations');
    expect(text).toContain('[TIER-VIOLATION]');
    expect(text).toContain('--hx-button-bg');
  });

  it('summary line appears in formatted output', () => {
    const report = {
      path: '/tmp/test',
      filesScanned: 0,
      totalDeclarations: 0,
      validTokens: 0,
      findings: { unknown: [], deprecated: [], tierViolations: [] },
      summary: 'All 0 declarations are valid.',
    };
    const text = formatAuditReport(report);
    expect(text).toContain('All 0 declarations are valid.');
  });
});
