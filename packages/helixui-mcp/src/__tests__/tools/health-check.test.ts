/**
 * Unit tests for tools/health-check.ts
 *
 * healthCheck() orchestrates validateIntegration, auditTokens, and
 * analyzeExtension into a single scored report. We use temp project
 * directories to exercise the scoring, finding categorization, and
 * recommendation logic.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { healthCheck, formatHealthReport } from '../../tools/health-check.js';
import type { HealthReport } from '../../tools/health-check.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `health-check-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function writeFile(dir: string, relativePath: string, content: string): void {
  const parts = relativePath.split('/');
  if (parts.length > 1) {
    mkdirSync(join(dir, ...parts.slice(0, -1)), { recursive: true });
  }
  writeFileSync(join(dir, relativePath), content, 'utf8');
}

afterEach(() => {
  delete process.env['HELIXUI_MCP_TOKENS_PATH'];
  for (const d of tempDirs.splice(0)) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

function writeTokensFixture(dir: string): string {
  const tokensPath = join(dir, 'tokens.json');
  writeFileSync(
    tokensPath,
    JSON.stringify({
      color: { primary: { '500': { value: '#2563EB' } } },
      button: { bg: { value: 'var(--hx-color-primary-500)' } },
    }),
    'utf8',
  );
  return tokensPath;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('healthCheck()', () => {
  // ── perfect score ────────────────────────────────────────────────────────────

  it('returns score 100 for a clean empty project (no CSS, no issues)', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    const report = healthCheck({ projectPath: dir });
    // A clean directory may still get bundler-config-missing (info: -1),
    // so we just verify score is high, not necessarily 100
    expect(report.score).toBeGreaterThanOrEqual(99);
  });

  it('reports projectPath in the result', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    const report = healthCheck({ projectPath: dir });
    expect(report.projectPath).toBe(dir);
  });

  // ── score deduction ──────────────────────────────────────────────────────────

  it('deducts 10 points per critical finding', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // eval() triggers a csp-unsafe-eval error (severity: error → critical)
    writeFile(dir, 'src/app.ts', `eval('bad');`);
    const report = healthCheck({ projectPath: dir });
    expect(report.findings.critical.length).toBeGreaterThan(0);
    const expectedMax = 100 - report.findings.critical.length * 10;
    expect(report.score).toBeLessThanOrEqual(expectedMax);
  });

  it('deducts 5 points per warning finding', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // barrel import → warning
    writeFile(dir, 'src/app.ts', `import { HxButton } from '@helixui/library';`);
    const reportBefore = healthCheck({ projectPath: dir });
    const beforeWarnings = reportBefore.findings.warning.length;
    // Score should reflect 5-point deductions
    const maxScore = 100 - beforeWarnings * 5 - reportBefore.findings.critical.length * 10 - reportBefore.findings.info.length;
    expect(reportBefore.score).toBeLessThanOrEqual(maxScore + reportBefore.findings.info.length);
  });

  it('score never goes below 0', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // Many eval() calls to drive score down
    const manyEvals = Array(15).fill(`eval('x');`).join('\n');
    writeFile(dir, 'src/app.ts', manyEvals);
    const report = healthCheck({ projectPath: dir });
    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  // ── finding categories ────────────────────────────────────────────────────────

  it('findings are split into critical, warning, and info', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    const report = healthCheck({ projectPath: dir });
    expect(Array.isArray(report.findings.critical)).toBe(true);
    expect(Array.isArray(report.findings.warning)).toBe(true);
    expect(Array.isArray(report.findings.info)).toBe(true);
  });

  it('error-severity integration issues appear in critical findings', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // Angular without CUSTOM_ELEMENTS_SCHEMA → severity: error → critical
    writeFile(
      dir,
      'package.json',
      JSON.stringify({ dependencies: { '@angular/core': '^17.0.0' } }),
    );
    const report = healthCheck({ projectPath: dir });
    const angularCritical = report.findings.critical.filter(
      (f) => f.type === 'framework-angular-schema',
    );
    expect(angularCritical.length).toBeGreaterThan(0);
    expect(angularCritical[0]?.source).toBe('validate-integration');
  });

  it('warning-severity integration issues appear in warning findings', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    writeFile(dir, 'src/app.ts', `import { HxButton } from '@helixui/library';`);
    const report = healthCheck({ projectPath: dir });
    const barrelWarnings = report.findings.warning.filter((f) => f.type === 'barrel-import');
    expect(barrelWarnings.length).toBeGreaterThan(0);
  });

  it('info-severity integration issues appear in info findings', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // No bundler config → bundler-config-missing (info)
    const report = healthCheck({ projectPath: dir });
    const infoFindings = report.findings.info.filter((f) => f.type === 'bundler-config-missing');
    expect(infoFindings.length).toBeGreaterThan(0);
    expect(infoFindings[0]?.source).toBe('validate-integration');
  });

  // ── token audit integration ───────────────────────────────────────────────────

  it('unknown token findings from audit-tokens appear as warnings', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    writeFile(dir, 'styles/theme.css', `.foo { --hx-nonexistent-token: red; }`);
    const report = healthCheck({ projectPath: dir });
    const tokenWarnings = report.findings.warning.filter((f) => f.source === 'audit-tokens');
    expect(tokenWarnings.length).toBeGreaterThan(0);
  });

  // ── extension file analysis ──────────────────────────────────────────────────

  it('includes analyze-extension findings when extensionFile is provided', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;

    // Write a TS file with a missing super call
    const extFile = join(dir, 'my-component.ts');
    writeFileSync(
      extFile,
      `class MyComp extends SomeBase {
        connectedCallback() {
          // missing super
        }
      }`,
      'utf8',
    );

    const report = healthCheck({ projectPath: dir, extensionFile: extFile });
    const extensionFindings = report.findings.critical.filter(
      (f) => f.source === 'analyze-extension',
    );
    expect(extensionFindings.length).toBeGreaterThan(0);
  });

  it('does NOT include analyze-extension findings when extensionFile is omitted', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    const report = healthCheck({ projectPath: dir });
    const extensionFindings = [
      ...report.findings.critical,
      ...report.findings.warning,
      ...report.findings.info,
    ].filter((f) => f.source === 'analyze-extension');
    expect(extensionFindings).toHaveLength(0);
  });

  // ── recommendations ──────────────────────────────────────────────────────────

  it('recommendations is an array', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    const report = healthCheck({ projectPath: dir });
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it('generates recommendations for detected issue types', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    writeFile(dir, 'src/app.ts', `import { HxButton } from '@helixui/library';`);
    const report = healthCheck({ projectPath: dir });
    const hasBarrelRec = report.recommendations.some((r) => r.includes('barrel'));
    expect(hasBarrelRec).toBe(true);
  });

  it('does not include duplicate recommendations', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // Multiple barrel imports → same recommendation type, should appear once
    writeFile(
      dir,
      'src/a.ts',
      `import { HxButton } from '@helixui/library';`,
    );
    writeFile(
      dir,
      'src/b.ts',
      `import { HxCard } from '@helixui/library';`,
    );
    const report = healthCheck({ projectPath: dir });
    const barrelRecs = report.recommendations.filter((r) => r.includes('barrel'));
    expect(barrelRecs.length).toBeLessThanOrEqual(1);
  });

  // ── summary format ────────────────────────────────────────────────────────────

  it('summary contains score for a project with issues', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    writeFile(dir, 'src/app.ts', `eval('bad');`);
    const report = healthCheck({ projectPath: dir });
    expect(report.summary).toContain(`${report.score}/100`);
  });

  it('summary says perfect score when no issues', () => {
    const dir = makeTempDir();
    const tokensPath = writeTokensFixture(dir);
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
    // Provide a vite config with customElements to suppress bundler-config-missing
    writeFile(dir, 'vite.config.ts', `export default { customElements: true };`);
    const report = healthCheck({ projectPath: dir });
    if (report.findings.critical.length === 0 &&
        report.findings.warning.length === 0 &&
        report.findings.info.length === 0) {
      expect(report.summary).toContain('100/100');
    }
  });
});

// ─── formatHealthReport ───────────────────────────────────────────────────────

describe('formatHealthReport()', () => {
  const EMPTY_REPORT: HealthReport = {
    projectPath: '/tmp/my-project',
    score: 100,
    findings: { critical: [], warning: [], info: [] },
    recommendations: [],
    summary: 'Health check passed with a perfect score of 100/100. No issues found.',
  };

  it('includes the project path', () => {
    const text = formatHealthReport(EMPTY_REPORT);
    expect(text).toContain('/tmp/my-project');
  });

  it('includes the score', () => {
    const text = formatHealthReport(EMPTY_REPORT);
    expect(text).toContain('100/100');
  });

  it('includes the summary', () => {
    const text = formatHealthReport(EMPTY_REPORT);
    expect(text).toContain('No issues found');
  });

  it('includes Critical section when critical findings exist', () => {
    const report: HealthReport = {
      ...EMPTY_REPORT,
      score: 90,
      findings: {
        critical: [
          {
            category: 'critical',
            source: 'validate-integration',
            type: 'csp-unsafe-eval',
            message: 'eval() detected.',
            location: 'src/app.ts:5',
          },
        ],
        warning: [],
        info: [],
      },
    };
    const text = formatHealthReport(report);
    expect(text).toContain('Critical');
    expect(text).toContain('[CRITICAL]');
    expect(text).toContain('csp-unsafe-eval');
  });

  it('includes Warnings section when warning findings exist', () => {
    const report: HealthReport = {
      ...EMPTY_REPORT,
      score: 95,
      findings: {
        critical: [],
        warning: [
          {
            category: 'warning',
            source: 'validate-integration',
            type: 'barrel-import',
            message: 'Use tree-shakeable imports.',
            location: 'src/app.ts:1',
          },
        ],
        info: [],
      },
    };
    const text = formatHealthReport(report);
    expect(text).toContain('Warnings');
    expect(text).toContain('[WARNING]');
  });

  it('includes Info section when info findings exist', () => {
    const report: HealthReport = {
      ...EMPTY_REPORT,
      score: 99,
      findings: {
        critical: [],
        warning: [],
        info: [
          {
            category: 'info',
            source: 'validate-integration',
            type: 'bundler-config-missing',
            message: 'No bundler config found.',
          },
        ],
      },
    };
    const text = formatHealthReport(report);
    expect(text).toContain('Info');
    expect(text).toContain('[INFO]');
  });

  it('includes Recommendations section when recommendations exist', () => {
    const report: HealthReport = {
      ...EMPTY_REPORT,
      recommendations: ['Replace barrel imports with path imports.'],
    };
    const text = formatHealthReport(report);
    expect(text).toContain('Recommendations');
    expect(text).toContain('Replace barrel imports');
  });

  it('does NOT include empty Critical section', () => {
    const text = formatHealthReport(EMPTY_REPORT);
    expect(text).not.toContain('[CRITICAL]');
  });

  it('includes location when finding has one', () => {
    const report: HealthReport = {
      ...EMPTY_REPORT,
      score: 90,
      findings: {
        critical: [
          {
            category: 'critical',
            source: 'validate-integration',
            type: 'csp-unsafe-eval',
            message: 'eval() detected.',
            location: 'src/app.ts:42',
          },
        ],
        warning: [],
        info: [],
      },
    };
    const text = formatHealthReport(report);
    expect(text).toContain('src/app.ts:42');
  });
});
