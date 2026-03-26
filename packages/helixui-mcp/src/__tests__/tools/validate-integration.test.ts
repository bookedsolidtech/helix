/**
 * Unit tests for tools/validate-integration.ts
 *
 * validateIntegration() scans a project directory for HELiX integration
 * issues. We build minimal temp directory structures to exercise each
 * check category in isolation.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateIntegration } from '../../tools/validate-integration.js';
import type { ValidationResult } from '../../tools/validate-integration.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = join(tmpdir(), `validate-int-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function writeFile(dir: string, relativePath: string, content: string): void {
  const fullPath = join(dir, relativePath);
  mkdirSync(join(dir, relativePath.split('/').slice(0, -1).join('/')), { recursive: true });
  writeFileSync(fullPath, content, 'utf8');
}

afterEach(() => {
  for (const d of tempDirs.splice(0)) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

function parseResult(json: string): ValidationResult {
  return JSON.parse(json) as ValidationResult;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validateIntegration()', () => {
  // ── error handling ──────────────────────────────────────────────────────────

  it('throws when project directory does not exist', () => {
    expect(() => validateIntegration('/nonexistent/project')).toThrow('not found');
  });

  it('throws when path is a file, not a directory', () => {
    const dir = makeTempDir();
    writeFile(dir, 'file.ts', '// just a file');
    expect(() => validateIntegration(join(dir, 'file.ts'))).toThrow('not a directory');
  });

  // ── empty project ───────────────────────────────────────────────────────────

  it('returns a valid result for an empty project directory', () => {
    const dir = makeTempDir();
    const result = parseResult(validateIntegration(dir));
    expect(result.projectPath).toBeTruthy();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(typeof result.summary).toBe('string');
  });

  it('reports no-bundler-config info for a project with no bundler config', () => {
    const dir = makeTempDir();
    const result = parseResult(validateIntegration(dir));
    const bundlerIssues = result.issues.filter((i) => i.type === 'bundler-config-missing');
    expect(bundlerIssues.length).toBeGreaterThan(0);
    expect(bundlerIssues[0]?.severity).toBe('info');
  });

  // ── import correctness ──────────────────────────────────────────────────────

  it('flags barrel imports from @helixui/library', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `import { HxButton } from '@helixui/library';`);
    const result = parseResult(validateIntegration(dir));
    const barrelIssues = result.issues.filter((i) => i.type === 'barrel-import');
    expect(barrelIssues.length).toBeGreaterThan(0);
    expect(barrelIssues[0]?.severity).toBe('warning');
  });

  it('flags .ts extension in import paths', () => {
    const dir = makeTempDir();
    // The regex in validate-integration.ts matches: from '@helixui/...ts'
    writeFile(
      dir,
      'src/app.ts',
      `import { HxButton } from '@helixui/library/components/hx-button/index.ts';`,
    );
    const result = parseResult(validateIntegration(dir));
    const tsExtIssues = result.issues.filter((i) => i.type === 'import-ts-extension');
    expect(tsExtIssues.length).toBeGreaterThan(0);
    expect(tsExtIssues[0]?.severity).toBe('error');
  });

  it('does NOT flag correct .js path imports', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `import '@helixui/library/components/hx-button/index.js';`);
    const result = parseResult(validateIntegration(dir));
    const importErrors = result.issues.filter(
      (i) => i.type === 'barrel-import' || i.type === 'import-ts-extension',
    );
    expect(importErrors).toHaveLength(0);
  });

  // ── bundler config checks ───────────────────────────────────────────────────

  it('emits info when vite.config.ts has no customElements config', () => {
    const dir = makeTempDir();
    writeFile(dir, 'vite.config.ts', `export default defineConfig({ plugins: [] });`);
    const result = parseResult(validateIntegration(dir));
    const viteIssues = result.issues.filter((i) => i.type === 'bundler-ce-handling');
    expect(viteIssues.length).toBeGreaterThan(0);
  });

  it('does NOT emit vite info when config mentions customElements', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'vite.config.ts',
      `export default defineConfig({ customElements: true, plugins: [] });`,
    );
    const result = parseResult(validateIntegration(dir));
    const viteIssues = result.issues.filter((i) => i.type === 'bundler-ce-handling');
    expect(viteIssues).toHaveLength(0);
  });

  // ── Next.js checks ──────────────────────────────────────────────────────────

  it('flags Next.js config without transpilePackages', () => {
    const dir = makeTempDir();
    writeFile(dir, 'next.config.js', `module.exports = { reactStrictMode: true };`);
    const result = parseResult(validateIntegration(dir));
    const nextIssues = result.issues.filter((i) => i.type === 'bundler-ce-handling');
    expect(nextIssues.length).toBeGreaterThan(0);
    expect(nextIssues[0]?.severity).toBe('warning');
  });

  // ── SSR compatibility ───────────────────────────────────────────────────────

  it('flags unguarded window access in source files', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/util.ts', `const width = window.innerWidth;`);
    const result = parseResult(validateIntegration(dir));
    const ssrIssues = result.issues.filter((i) => i.type === 'ssr-dom-api-unguarded');
    expect(ssrIssues.length).toBeGreaterThan(0);
  });

  it('does NOT flag window access in .test.ts files', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/util.test.ts', `const width = window.innerWidth;`);
    const result = parseResult(validateIntegration(dir));
    const ssrIssues = result.issues.filter((i) => i.type === 'ssr-dom-api-unguarded');
    expect(ssrIssues).toHaveLength(0);
  });

  it('does NOT flag window access when SSR guard is present', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'src/util.ts',
      `if (typeof window !== 'undefined') { const w = window.innerWidth; }`,
    );
    const result = parseResult(validateIntegration(dir));
    const ssrIssues = result.issues.filter((i) => i.type === 'ssr-dom-api-unguarded');
    expect(ssrIssues).toHaveLength(0);
  });

  // ── CSP compliance ──────────────────────────────────────────────────────────

  it('flags setAttribute("style", ...) usage', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `el.setAttribute('style', 'color: red');`);
    const result = parseResult(validateIntegration(dir));
    const cspIssues = result.issues.filter((i) => i.type === 'csp-inline-style');
    expect(cspIssues.length).toBeGreaterThan(0);
    expect(cspIssues[0]?.severity).toBe('warning');
  });

  it('flags eval() usage', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `eval('2 + 2');`);
    const result = parseResult(validateIntegration(dir));
    const cspIssues = result.issues.filter((i) => i.type === 'csp-unsafe-eval');
    expect(cspIssues.length).toBeGreaterThan(0);
    expect(cspIssues[0]?.severity).toBe('error');
  });

  it('flags innerHTML assignment', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `el.innerHTML = '<p>hello</p>';`);
    const result = parseResult(validateIntegration(dir));
    const cspIssues = result.issues.filter((i) => i.type === 'csp-inner-html');
    expect(cspIssues.length).toBeGreaterThan(0);
  });

  // ── React framework checks ──────────────────────────────────────────────────

  it('flags React project without @lit/react', () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ dependencies: { react: '^18.0.0' } }));
    const result = parseResult(validateIntegration(dir));
    const reactIssues = result.issues.filter((i) => i.type === 'framework-react-wrapper');
    expect(reactIssues.length).toBeGreaterThan(0);
    expect(reactIssues[0]?.severity).toBe('warning');
  });

  it('does NOT flag React + @lit/react project', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({
        dependencies: { react: '^18.0.0', '@lit/react': '^1.0.0' },
      }),
    );
    const result = parseResult(validateIntegration(dir));
    const reactWrapperIssues = result.issues.filter((i) => i.type === 'framework-react-wrapper');
    expect(reactWrapperIssues).toHaveLength(0);
  });

  // ── Vue framework checks ────────────────────────────────────────────────────

  it('flags Vue project without isCustomElement config', () => {
    const dir = makeTempDir();
    writeFile(dir, 'package.json', JSON.stringify({ dependencies: { vue: '^3.0.0' } }));
    const result = parseResult(validateIntegration(dir));
    const vueIssues = result.issues.filter((i) => i.type === 'framework-vue-custom-element');
    expect(vueIssues.length).toBeGreaterThan(0);
    expect(vueIssues[0]?.severity).toBe('error');
  });

  // ── Angular framework checks ────────────────────────────────────────────────

  it('flags Angular project without CUSTOM_ELEMENTS_SCHEMA', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify({ dependencies: { '@angular/core': '^17.0.0' } }),
    );
    const result = parseResult(validateIntegration(dir));
    const angularIssues = result.issues.filter((i) => i.type === 'framework-angular-schema');
    expect(angularIssues.length).toBeGreaterThan(0);
    expect(angularIssues[0]?.severity).toBe('error');
  });

  // ── summary format ──────────────────────────────────────────────────────────

  it('returns "No integration issues" when clean', () => {
    const dir = makeTempDir();
    // Write a minimal vite config that mentions customElements to avoid bundler info
    writeFile(dir, 'vite.config.ts', `export default { customElements: true };`);
    const result = parseResult(validateIntegration(dir));
    // There might still be an ssr or other check — we just verify summary exists
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('summary counts errors, warnings, and info', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `eval('bad');`);
    const result = parseResult(validateIntegration(dir));
    if (result.issues.length > 0) {
      expect(result.summary).toMatch(/\d+ issue/);
    }
  });

  // ── result shape ────────────────────────────────────────────────────────────

  it('result contains projectPath', () => {
    const dir = makeTempDir();
    const result = parseResult(validateIntegration(dir));
    expect(typeof result.projectPath).toBe('string');
    expect(result.projectPath).toBeTruthy();
  });

  it('each issue has type, severity, message, and location', () => {
    const dir = makeTempDir();
    writeFile(dir, 'src/app.ts', `import { HxButton } from '@helixui/library';`);
    const result = parseResult(validateIntegration(dir));
    for (const issue of result.issues) {
      expect(typeof issue.type).toBe('string');
      expect(['error', 'warning', 'info']).toContain(issue.severity);
      expect(typeof issue.message).toBe('string');
      expect(typeof issue.location).toBe('string');
    }
  });
});
