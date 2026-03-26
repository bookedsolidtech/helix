/**
 * Unit tests for tools/scaffold-theme.ts
 *
 * scaffoldTheme() reads design tokens via TokenParser and generates a CSS
 * scaffold. We wire a temp tokens.json so the output is deterministic.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scaffoldTheme } from '../../tools/scaffold-theme.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_TOKENS = {
  color: {
    primary: { '500': { value: '#2563EB' } },
    neutral: { '0': { value: '#FFFFFF' } },
  },
  spacing: {
    md: { value: '1rem' },
    lg: { value: '1.5rem' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `scaffold-theme-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

beforeEach(() => {
  const dir = makeTempDir();
  const tokensPath = join(dir, 'tokens.json');
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

describe('scaffoldTheme()', () => {
  // ── basic output ─────────────────────────────────────────────────────────────

  it('returns a non-empty css string', () => {
    const result = scaffoldTheme();
    expect(result.css.length).toBeGreaterThan(0);
  });

  it('uses ".hx-theme" as the default selector', () => {
    const result = scaffoldTheme();
    expect(result.css).toContain('.hx-theme {');
  });

  it('respects a custom selector', () => {
    const result = scaffoldTheme({ selector: ':root' });
    expect(result.css).toContain(':root {');
    expect(result.css).not.toContain('.hx-theme {');
  });

  it('respects a scoped class selector', () => {
    const result = scaffoldTheme({ selector: '.my-brand' });
    expect(result.css).toContain('.my-brand {');
  });

  // ── token content ─────────────────────────────────────────────────────────────

  it('includes all tokens from the fixture as commented-out declarations', () => {
    const result = scaffoldTheme();
    expect(result.css).toContain('--hx-color-primary-500');
    expect(result.css).toContain('--hx-color-neutral-0');
    expect(result.css).toContain('--hx-spacing-md');
    expect(result.css).toContain('--hx-spacing-lg');
  });

  it('tokens are commented out (not active declarations)', () => {
    const result = scaffoldTheme();
    // All --hx-* lines should be inside comments
    const lines = result.css.split('\n');
    const tokenLines = lines.filter((l) => l.includes('--hx-'));
    for (const line of tokenLines) {
      expect(line.trim()).toMatch(/^\/\*/);
    }
  });

  it('includes the token value alongside the property name', () => {
    const result = scaffoldTheme();
    expect(result.css).toContain('#2563EB');
    expect(result.css).toContain('1rem');
  });

  // ── token count ───────────────────────────────────────────────────────────────

  it('returns correct tokenCount', () => {
    const result = scaffoldTheme();
    // Our fixture has 4 leaf tokens
    expect(result.tokenCount).toBe(4);
  });

  // ── categories ────────────────────────────────────────────────────────────────

  it('returns categories array', () => {
    const result = scaffoldTheme();
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories).toContain('color');
    expect(result.categories).toContain('spacing');
  });

  it('does not include duplicate categories', () => {
    const result = scaffoldTheme();
    const unique = new Set(result.categories);
    expect(unique.size).toBe(result.categories.length);
  });

  // ── header comment ────────────────────────────────────────────────────────────

  it('includes a header comment explaining usage', () => {
    const result = scaffoldTheme();
    expect(result.css).toContain('HELiX UI Theme Scaffold');
    expect(result.css).toContain('@helixui/mcp scaffold-theme');
  });

  // ── outputPath: write to disk ─────────────────────────────────────────────────

  it('writes CSS to disk when outputPath is provided', () => {
    const dir = makeTempDir();
    const outputPath = join(dir, 'output', 'theme.css');
    const result = scaffoldTheme({ outputPath });
    expect(existsSync(outputPath)).toBe(true);
    expect(result.outputPath).toBe(outputPath);
  });

  it('written file content matches result.css', () => {
    const dir = makeTempDir();
    const outputPath = join(dir, 'theme.css');
    const result = scaffoldTheme({ outputPath });
    const diskContent = readFileSync(outputPath, 'utf8');
    expect(diskContent).toBe(result.css);
  });

  it('creates parent directories when outputPath is nested', () => {
    const dir = makeTempDir();
    const outputPath = join(dir, 'deeply', 'nested', 'theme.css');
    scaffoldTheme({ outputPath });
    expect(existsSync(outputPath)).toBe(true);
  });

  it('outputPath is undefined in result when not provided', () => {
    const result = scaffoldTheme();
    expect(result.outputPath).toBeUndefined();
  });

  // ── no tokens ─────────────────────────────────────────────────────────────────

  it('handles an empty tokens file gracefully', () => {
    const dir = makeTempDir();
    const emptyPath = join(dir, 'empty-tokens.json');
    writeFileSync(emptyPath, JSON.stringify({}), 'utf8');
    process.env['HELIXUI_MCP_TOKENS_PATH'] = emptyPath;
    const result = scaffoldTheme();
    expect(result.tokenCount).toBe(0);
    expect(result.categories).toHaveLength(0);
  });
});
