/**
 * Unit tests for tools/scaffold-component.ts
 *
 * scaffoldComponent() generates a complete set of component files. When
 * outputDir is omitted, it returns the generated file contents in-memory
 * without touching disk — making it ideal for unit testing.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { rmSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scaffoldComponent } from '../../tools/scaffold-component.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = join(tmpdir(), `scaffold-comp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const d of tempDirs.splice(0)) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('scaffoldComponent()', () => {
  // ── validation ──────────────────────────────────────────────────────────────

  it('throws for a name containing uppercase letters', () => {
    expect(() => scaffoldComponent({ name: 'MediaCard' })).toThrow();
  });

  it('throws for a name starting with a digit', () => {
    expect(() => scaffoldComponent({ name: '2button' })).toThrow();
  });

  it('throws for a name with invalid characters', () => {
    expect(() => scaffoldComponent({ name: 'my_card' })).toThrow();
  });

  it('throws when extends does not start with hx-', () => {
    expect(() => scaffoldComponent({ name: 'my-card', extends: 'card' })).toThrow();
  });

  // ── basic scaffolding ────────────────────────────────────────────────────────

  it('returns tagName with hx- prefix', () => {
    const result = scaffoldComponent({ name: 'media-card' });
    expect(result.tagName).toBe('hx-media-card');
  });

  it('converts kebab-case name to PascalCase className', () => {
    const result = scaffoldComponent({ name: 'media-card' });
    expect(result.className).toContain('MediaCard');
  });

  it('generates the expected set of files', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const fileNames = Object.keys(result.files);
    expect(fileNames).toContain('index.ts');
    expect(fileNames).toContain('hx-badge.ts');
    expect(fileNames).toContain('hx-badge.styles.ts');
    expect(fileNames).toContain('hx-badge.test.ts');
    expect(fileNames).toContain('hx-badge.stories.ts');
    expect(fileNames).toContain('hx-badge.twig');
  });

  it('generates 6 files total', () => {
    const result = scaffoldComponent({ name: 'badge' });
    expect(Object.keys(result.files)).toHaveLength(6);
  });

  // ── index.ts ────────────────────────────────────────────────────────────────

  it('index.ts re-exports the component class', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['index.ts'] ?? '';
    expect(content).toContain('export');
    expect(content).toContain('hx-badge.js');
  });

  // ── component .ts file ───────────────────────────────────────────────────────

  it('component .ts file contains @customElement decorator', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.ts'] ?? '';
    expect(content).toContain("@customElement('hx-badge')");
  });

  it('component .ts file contains HTMLElementTagNameMap declaration', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.ts'] ?? '';
    expect(content).toContain('HTMLElementTagNameMap');
    expect(content).toContain("'hx-badge'");
  });

  it('component .ts file imports tokenStyles', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.ts'] ?? '';
    expect(content).toContain('tokenStyles');
  });

  // ── styles .ts file ──────────────────────────────────────────────────────────

  it('styles .ts file exports a css`` styles constant', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.styles.ts'] ?? '';
    expect(content).toContain('export const');
    expect(content).toContain('css`');
    expect(content).toContain(':host');
  });

  it('styles .ts file contains component-tier CSS custom properties', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.styles.ts'] ?? '';
    expect(content).toContain('--hx-badge-');
  });

  // ── test .ts file ────────────────────────────────────────────────────────────

  it('test .ts file contains a describe block', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.test.ts'] ?? '';
    expect(content).toContain("describe('hx-badge'");
  });

  it('test .ts file imports from vitest', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.test.ts'] ?? '';
    expect(content).toContain("'vitest'");
  });

  it('test .ts file contains an accessibility test', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.test.ts'] ?? '';
    expect(content).toContain('checkA11y');
  });

  // ── stories .ts file ─────────────────────────────────────────────────────────

  it('stories .ts file contains Storybook meta object', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.stories.ts'] ?? '';
    expect(content).toContain("title: 'Components/");
    expect(content).toContain("component: 'hx-badge'");
  });

  it('stories .ts file exports a Default story', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.stories.ts'] ?? '';
    expect(content).toContain('export const Default');
  });

  // ── twig file ────────────────────────────────────────────────────────────────

  it('twig file contains the component tag', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.twig'] ?? '';
    expect(content).toContain('<hx-badge');
    expect(content).toContain('</hx-badge>');
  });

  it('twig file documents slot parameters', () => {
    const result = scaffoldComponent({ name: 'badge' });
    const content = result.files['hx-badge.twig'] ?? '';
    expect(content).toContain('content');
  });

  // ── extends: with CEM not present ────────────────────────────────────────────

  it('generates without CEM when extending (adds warning)', () => {
    // Point to a non-existent CEM so the reader returns null
    process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';

    try {
      const result = scaffoldComponent({ name: 'my-button', extends: 'hx-button' });
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CEM');
    } finally {
      delete process.env['HELIXUI_MCP_CEM_PATH'];
    }
  });

  it('component .ts file imports base class when extends is set', () => {
    process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';

    try {
      const result = scaffoldComponent({ name: 'my-button', extends: 'hx-button' });
      const content = result.files['hx-my-button.ts'] ?? '';
      // Should reference hx-button in import (the base tag)
      expect(content).toContain('hx-button');
    } finally {
      delete process.env['HELIXUI_MCP_CEM_PATH'];
    }
  });

  // ── outputDir: write to disk ─────────────────────────────────────────────────

  it('writes files to disk when outputDir is provided', () => {
    const outputDir = makeTempDir();
    const result = scaffoldComponent({ name: 'disk-badge', outputDir });
    expect(result.outputDir).toBeTruthy();
    const compDir = join(outputDir, 'hx-disk-badge');
    expect(existsSync(compDir)).toBe(true);
    expect(existsSync(join(compDir, 'index.ts'))).toBe(true);
    expect(existsSync(join(compDir, 'hx-disk-badge.ts'))).toBe(true);
  });

  it('written index.ts content matches in-memory content', () => {
    const outputDir = makeTempDir();
    const result = scaffoldComponent({ name: 'disk-badge', outputDir });
    const compDir = join(outputDir, 'hx-disk-badge');
    const diskContent = readFileSync(join(compDir, 'index.ts'), 'utf8');
    expect(diskContent).toBe(result.files['index.ts']);
  });

  it('throws when component directory already exists', () => {
    const outputDir = makeTempDir();
    // Create first — succeeds
    scaffoldComponent({ name: 'existing', outputDir });
    // Create again — should throw
    expect(() => scaffoldComponent({ name: 'existing', outputDir })).toThrow('already exists');
  });

  // ── no outputDir: does NOT write to disk ─────────────────────────────────────

  it('outputDir is undefined in result when not provided', () => {
    const result = scaffoldComponent({ name: 'no-disk' });
    expect(result.outputDir).toBeUndefined();
  });

  it('warnings is an empty array for a basic scaffold with no base', () => {
    const result = scaffoldComponent({ name: 'clean-badge' });
    expect(result.warnings).toEqual([]);
  });
});
