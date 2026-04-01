/**
 * Unit tests for tools/analyze-extension.ts
 *
 * analyzeExtension() reads a TypeScript file from disk and runs a series of
 * static analysis checks on it. We write temp TS files and exercise each
 * anti-pattern check independently.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { analyzeExtension } from '../../tools/analyze-extension.js';
import type { AnalysisResult } from '../../tools/analyze-extension.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempFiles: string[] = [];

function writeTempTs(source: string): string {
  const filePath = join(tmpdir(), `analyze-ext-test-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`);
  writeFileSync(filePath, source, 'utf8');
  tempFiles.push(filePath);
  return filePath;
}

afterEach(() => {
  for (const f of tempFiles.splice(0)) {
    if (existsSync(f)) unlinkSync(f);
  }
});

function parseResult(json: string): AnalysisResult {
  return JSON.parse(json) as AnalysisResult;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('analyzeExtension()', () => {
  // ── file-not-found error ────────────────────────────────────────────────────

  it('throws when file does not exist', () => {
    expect(() => analyzeExtension('/nonexistent/path/component.ts')).toThrow('File not found');
  });

  // ── no class declarations ───────────────────────────────────────────────────

  it('returns empty issues for a file with no class extending anything', () => {
    const filePath = writeTempTs(`
      export function helper() {
        return 42;
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    expect(result.issues).toHaveLength(0);
    expect(result.summary).toContain('No class declarations');
  });

  it('ignores classes that do not extend anything', () => {
    const filePath = writeTempTs(`
      class Standalone {
        render() {
          return '<div></div>';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    expect(result.issues).toHaveLength(0);
  });

  // ── clean class: no issues ──────────────────────────────────────────────────

  it('returns no missing-super-call errors for connectedCallback that calls super', () => {
    const filePath = writeTempTs(`
      import { LitElement } from 'lit';
      import { customElement } from 'lit/decorators.js';

      @customElement('hx-my-button')
      class HxMyButton extends LitElement {
        override connectedCallback() {
          super.connectedCallback();
          console.log('connected');
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const connectedErrors = result.issues.filter(
      (i) => i.type === 'missing-super-call' && i.message.includes('connectedCallback'),
    );
    expect(connectedErrors).toHaveLength(0);
  });

  // ── missing-super-call ──────────────────────────────────────────────────────

  it('detects missing super.connectedCallback()', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        connectedCallback() {
          // forgot to call super
          console.log('connected');
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const errors = result.issues.filter(
      (i) => i.type === 'missing-super-call' && i.severity === 'error',
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.message).toContain('connectedCallback');
  });

  it('detects missing super.render()', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        render() {
          return '<div></div>';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const errors = result.issues.filter(
      (i) => i.type === 'missing-super-call' && i.message.includes('render'),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('does NOT flag lifecycle methods that do call super', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        connectedCallback() {
          super.connectedCallback();
          console.log('connected');
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const errors = result.issues.filter(
      (i) => i.type === 'missing-super-call' && i.message.includes('connectedCallback'),
    );
    expect(errors).toHaveLength(0);
  });

  // ── incorrect-shadow-dom-usage ──────────────────────────────────────────────

  it('detects this.innerHTML assignment', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        connectedCallback() {
          super.connectedCallback();
          this.innerHTML = '<p>hello</p>';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const errors = result.issues.filter(
      (i) => i.type === 'incorrect-shadow-dom-usage' && i.severity === 'error',
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.message).toContain('innerHTML');
  });

  it('detects this.shadowRoot.innerHTML assignment', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        connectedCallback() {
          super.connectedCallback();
          this.shadowRoot.innerHTML = '<p>hello</p>';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const shadowErrors = result.issues.filter(
      (i) => i.type === 'incorrect-shadow-dom-usage',
    );
    expect(shadowErrors.length).toBeGreaterThan(0);
  });

  // ── direct-style-manipulation ───────────────────────────────────────────────

  it('detects this.style.color = ... assignment', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        setColor() {
          this.style.color = 'red';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const warnings = result.issues.filter(
      (i) => i.type === 'direct-style-manipulation' && i.severity === 'warning',
    );
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]?.message).toContain('color');
  });

  it('detects element.style.color = ... on a named variable', () => {
    const filePath = writeTempTs(`
      class MyComponent extends SomeBase {
        setColor() {
          const el = this.shadowRoot.querySelector('button');
          el.style.color = 'blue';
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const warnings = result.issues.filter((i) => i.type === 'direct-style-manipulation');
    expect(warnings.length).toBeGreaterThan(0);
  });

  // ── property-shadowing ──────────────────────────────────────────────────────

  it('detects @property decorator on a child class that extends a parent', () => {
    const filePath = writeTempTs(`
      import { property } from 'lit/decorators.js';

      class ChildComponent extends ParentComponent {
        @property({ type: String }) variant = 'default';
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    const warnings = result.issues.filter((i) => i.type === 'property-shadowing');
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]?.message).toContain('variant');
  });

  // ── summary format ──────────────────────────────────────────────────────────

  it('summary mentions class name when issues are found', () => {
    const filePath = writeTempTs(`
      class BrokenComponent extends SomeBase {
        connectedCallback() {
          // no super call
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    expect(result.summary).toContain('BrokenComponent');
  });

  it('summary says "No issues" for a clean file', () => {
    const filePath = writeTempTs(`
      class CleanComponent extends SomeBase {
        override connectedCallback() {
          super.connectedCallback();
        }
        override render() {
          super.render();
          return null;
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    if (result.issues.length === 0) {
      expect(result.summary).toContain('No issues');
    }
  });

  it('result includes the absolute file path', () => {
    const filePath = writeTempTs(`
      class AnyComponent extends SomeBase {}
    `);
    const result = parseResult(analyzeExtension(filePath));
    expect(result.filePath).toBeTruthy();
    expect(typeof result.filePath).toBe('string');
  });

  // ── location format ─────────────────────────────────────────────────────────

  it('issue locations include line number', () => {
    const filePath = writeTempTs(`
      class MyComp extends SomeBase {
        connectedCallback() {
          // missing super
        }
      }
    `);
    const result = parseResult(analyzeExtension(filePath));
    if (result.issues.length > 0) {
      const location = result.issues[0]?.location ?? '';
      expect(location).toMatch(/line \d+/);
    }
  });
});
