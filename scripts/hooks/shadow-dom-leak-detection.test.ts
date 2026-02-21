import { describe, it, expect } from 'vitest';
import { Project, SourceFile } from 'ts-morph';
import {
  validateShadowDOMLeakDetection,
  validateShadowDOMLeaks,
} from './shadow-dom-leak-detection.js';
import type { Violation, HookDependencies } from './shadow-dom-leak-detection.js';

// ─── Test Utilities ───────────────────────────────────────────────────────

// Import internal types for testing (TypeScript-only, not exported)
interface FileContext {
  sourceFile: SourceFile;
  isLightDOM: boolean;
}

interface CSSContext {
  cssContent: string;
  cssLines: string[];
  lineOffsets: number[];
}

/**
 * Create a mock ts-morph project with a single source file
 */
function createMockProject(content: string): { project: Project; sourceFile: SourceFile } {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
    },
  });

  const sourceFile = project.createSourceFile('test.ts', content);
  return { project, sourceFile };
}

/**
 * Create mock dependencies for testing
 */
function createMockDeps(files: string[] = []): HookDependencies {
  return {
    getStagedFiles: () => files,
    createProject: () =>
      new Project({
        useInMemoryFileSystem: true,
      }),
  };
}

/**
 * Compute line offsets for CSS content (matches implementation)
 */
function computeLineOffsets(text: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Create CSS context for testing (matches implementation)
 */
function _createCSSContext(cssContent: string): CSSContext {
  return {
    cssContent,
    cssLines: cssContent.split('\n'),
    lineOffsets: computeLineOffsets(cssContent),
  };
}

/**
 * Detect if source file is Light DOM component (matches implementation)
 */
function isLightDOMComponent(sourceFile: SourceFile): boolean {
  let isLightDOM = false;
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === 177) {
      // MethodDeclaration
      const method = node as Record<string, unknown>;
      if (method.getName && method.getName() === 'createRenderRoot') {
        const body = method.getBody && method.getBody();
        if (body) {
          const bodyText = body.getText();
          if (/return\s+this\s*;?/.test(bodyText)) {
            isLightDOM = true;
          }
        }
      }
    }
  });
  return isLightDOM;
}

/**
 * Create file context for testing (matches implementation)
 */
function createFileContext(sourceFile: SourceFile): FileContext {
  return {
    sourceFile,
    isLightDOM: isLightDOMComponent(sourceFile),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────

describe('shadow-dom-leak-detection (H16)', () => {
  // ─── Global Selectors ───────────────────────────────────────────────────

  describe('checkGlobalSelectors', () => {
    it('should detect body selector in Shadow DOM styles', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          body {
            margin: 0;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      // Detects both: global selector (critical) + missing :host (warning)
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some((v) => v.severity === 'critical')).toBe(true);
      expect(violations.some((v) => v.message.includes('Global selector `body`'))).toBe(true);
      expect(violations.some((v) => v.category === 'global-selector')).toBe(true);
    });

    it('should detect html selector in Shadow DOM styles', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          html {
            font-size: 16px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      // Detects both: global selector (critical) + missing :host (warning)
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some((v) => v.message.includes('Global selector `html`'))).toBe(true);
    });

    it('should detect * (universal) selector in Shadow DOM styles', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          * {
            box-sizing: border-box;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain('Global selector `*`');
    });

    it('should allow :host selector', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            display: block;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should allow component-scoped selectors', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            display: block;
          }

          .button {
            padding: 8px;
          }

          #container {
            margin: 0;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip approved global selectors', () => {
      const code = `
        import { css } from 'lit';
        // @shadow-dom-approved: TICKET-123 Legacy browser compatibility
        export const styles = css\`
          body {
            margin: 0;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });
  });

  // ─── !important Detection ───────────────────────────────────────────────

  describe('checkImportantOverrides', () => {
    it('should detect !important in Shadow DOM styles', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            color: red !important;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('!important');
      expect(violations[0]?.category).toBe('important-override');
    });

    it('should detect !important with whitespace variations', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            color: red ! important;
            font-size: 14px !  important;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(2);
      expect(violations.every((v) => v.message.includes('!important'))).toBe(true);
    });

    it('should allow styles without !important', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            color: red;
            font-size: 14px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip approved !important usage', () => {
      const code = `
        import { css } from 'lit';
        // @shadow-dom-approved: TICKET-456 Override framework styles
        export const styles = css\`
          :host {
            color: red !important;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });
  });

  // ─── :host-context() Detection ──────────────────────────────────────────

  describe('checkHostContext', () => {
    it('should detect overly broad :host-context(*)', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host-context(*) {
            display: block;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain(':host-context(*)');
      expect(violations[0]?.category).toBe('broad-host-context');
    });

    it('should detect :host-context(body)', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host-context(body) {
            margin: 0;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain(':host-context(body)');
    });

    it('should allow specific :host-context() selectors', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host-context(.theme-dark) {
            background: black;
          }

          :host-context([data-mode="compact"]) {
            padding: 4px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });
  });

  // ─── ::slotted() Detection ──────────────────────────────────────────────

  describe('checkSlottedUsage', () => {
    it('should detect ::slotted() with descendant selectors', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          ::slotted(.parent .child) {
            color: red;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('::slotted() with descendant selector');
      expect(violations[0]?.category).toBe('slotted-descendant');
    });

    it('should allow ::slotted() with direct children', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          ::slotted(span) {
            color: blue;
          }

          ::slotted(.button) {
            padding: 8px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should allow ::slotted() with [slot="name"]', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          ::slotted([slot="prefix"]) {
            margin-right: 8px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });
  });

  // ─── Missing :host Wrapper ──────────────────────────────────────────────

  describe('checkMissingHostWrapper', () => {
    it('should warn about root-level selectors without :host', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          .container {
            display: flex;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('warning');
      expect(violations[0]?.message).toContain('root level without :host scoping');
      expect(violations[0]?.category).toBe('root-level-style');
    });

    it('should not warn when :host is present', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            display: block;
          }

          .container {
            display: flex;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip @keyframes and CSS custom properties', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          @keyframes fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          --hx-custom-color: red;
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });
  });

  // ─── DOM Manipulation Detection ─────────────────────────────────────────

  describe('checkDOMManipulation', () => {
    it('should detect document.querySelector()', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            super.connectedCallback();
            const el = document.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('critical');
      expect(violations[0]?.message).toContain('document.querySelector()');
      expect(violations[0]?.category).toBe('dom-manipulation');
    });

    it('should detect document.getElementById()', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            const el = document.getElementById('app');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain('document.getElementById()');
    });

    it('should detect this.querySelector()', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            const el = this.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe('critical');
      expect(violations[0]?.message).toContain('this.querySelector()');
    });

    it('should allow this.shadowRoot.querySelector()', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            const el = this.shadowRoot?.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should allow this.renderRoot.querySelector()', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            const el = this.renderRoot.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip approved DOM manipulation', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyComponent extends LitElement {
          connectedCallback() {
            // @shadow-dom-approved: TICKET-789 Portal integration
            const el = document.querySelector('#portal-root');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should allow this.querySelector in Light DOM components', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyLightDOMComponent extends LitElement {
          createRenderRoot() {
            return this;
          }

          connectedCallback() {
            const el = this.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      // Should NOT flag this.querySelector for Light DOM components
      expect(violations).toHaveLength(0);
    });

    it('should still detect document.querySelector in Light DOM components', () => {
      const code = `
        import { LitElement } from 'lit';
        export class MyLightDOMComponent extends LitElement {
          createRenderRoot() {
            return this;
          }

          connectedCallback() {
            const el = document.querySelector('.button');
          }
        }
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      checkDOMManipulation(createFileContext(sourceFile), violations);

      // Should still flag document.querySelector even in Light DOM
      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain('document.querySelector()');
    });
  });

  // ─── Custom Property Prefix ─────────────────────────────────────────────

  describe('checkCustomPropertyPrefix', () => {
    it('should detect custom properties without --hx- prefix', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            --custom-color: red;
            --button-bg: blue;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations.length).toBeGreaterThanOrEqual(2);
      expect(violations.some((v) => v.message.includes('--custom-color'))).toBe(true);
      expect(violations.some((v) => v.message.includes('--button-bg'))).toBe(true);
      expect(violations.every((v) => v.severity === 'warning')).toBe(true);
      expect(violations.every((v) => v.category === 'custom-property-prefix')).toBe(true);
    });

    it('should allow custom properties with --hx- prefix', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            --hx-button-bg: var(--hx-color-primary, blue);
            --hx-spacing-md: 16px;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      // Should not flag --hx- prefixed properties
      expect(violations.filter((v) => v.category === 'custom-property-prefix')).toHaveLength(0);
    });

    it('should not flag custom property usages in var()', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            color: var(--some-external-property);
            background: var(--hx-color-primary);
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      // Should not flag property usages, only definitions
      expect(violations.filter((v) => v.category === 'custom-property-prefix')).toHaveLength(0);
    });

    it('should skip approved custom property definitions', () => {
      const code = `
        import { css } from 'lit';
        // @shadow-dom-approved: TICKET-999 Legacy design token
        export const styles = css\`
          :host {
            --legacy-color: red;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations.filter((v) => v.category === 'custom-property-prefix')).toHaveLength(0);
    });
  });

  // ─── Integration Tests ──────────────────────────────────────────────────

  describe('validateShadowDOMLeakDetection (full hook)', () => {
    it('should return passed=true when no files staged', async () => {
      const deps = createMockDeps([]);
      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.stats.filesChecked).toBe(0);
    });

    it('should detect multiple violation types in a single file', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      const code = `
        import { css, LitElement } from 'lit';

        export const styles = css\`
          body {
            margin: 0;
          }

          :host {
            color: red !important;
          }

          ::slotted(.parent .child) {
            display: block;
          }
        \`;

        export class MyComponent extends LitElement {
          connectedCallback() {
            const el = document.querySelector('.app');
          }
        }
      `;

      project.createSourceFile('test-component.styles.ts', code);

      const deps: HookDependencies = {
        getStagedFiles: () => ['test-component.styles.ts'],
        createProject: () => project,
      };

      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
      expect(result.stats.warningViolations).toBeGreaterThan(0);
      expect(result.violations.length).toBeGreaterThan(2);
    });

    it('should track execution time', async () => {
      const deps = createMockDeps([]);
      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.stats.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.executionTimeMs).toBeLessThan(5000); // Should be fast
    });

    it('should handle parse errors gracefully', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      // Invalid TypeScript syntax - ts-morph in-memory is forgiving
      // This test verifies we don't crash on malformed files
      project.createSourceFile('broken.ts', 'import { css from lit');

      const deps: HookDependencies = {
        getStagedFiles: () => ['broken.ts'],
        createProject: () => project,
      };

      const result = await validateShadowDOMLeakDetection(deps, true);

      // Should not crash - either passes or has violations
      expect(result.stats.filesChecked).toBe(1);
    });

    it('should categorize violations correctly', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      const code = `
        import { css } from 'lit';
        export const styles = css\`
          body {
            margin: 0;
          }

          :host {
            color: red !important;
          }
        \`;
      `;

      project.createSourceFile('test.styles.ts', code);

      const deps: HookDependencies = {
        getStagedFiles: () => ['test.styles.ts'],
        createProject: () => project,
      };

      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.violations.some((v) => v.category === 'global-selector')).toBe(true);
      expect(result.violations.some((v) => v.category === 'important-override')).toBe(true);
    });

    it('should bail fast when enabled and critical violation found', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      const code1 = `
        import { css } from 'lit';
        export const styles = css\`
          body { margin: 0; }
        \`;
      `;

      const code2 = `
        import { css } from 'lit';
        export const styles = css\`
          html { padding: 0; }
        \`;
      `;

      project.createSourceFile('file1.styles.ts', code1);
      project.createSourceFile('file2.styles.ts', code2);

      const deps: HookDependencies = {
        getStagedFiles: () => ['file1.styles.ts', 'file2.styles.ts'],
        createProject: () => project,
      };

      // Note: bailFast is controlled by process.argv in the real implementation
      // For testing, we verify that violations are found
      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty css`` templates', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`\`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should handle css`` with template expressions', () => {
      const code = `
        import { css } from 'lit';
        const color = 'red';
        export const styles = css\`
          :host {
            color: \${color};
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should handle CSS comments', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          /* This is a comment about body */
          // body { margin: 0; }
          :host {
            display: block;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should handle nested CSS selectors', () => {
      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            display: block;
          }

          :host(.active) .container {
            background: blue;
          }

          :host([disabled]) {
            opacity: 0.5;
          }
        \`;
      `;
      const { sourceFile } = createMockProject(code);
      const violations: Violation[] = [];

      validateShadowDOMLeaks(createFileContext(sourceFile), violations);

      expect(violations).toHaveLength(0);
    });

    it('should provide helpful suggestions', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      const code = `
        import { css, LitElement } from 'lit';
        export const styles = css\`
          body { margin: 0; }
        \`;

        export class Test extends LitElement {
          test() {
            const el = this.querySelector('.btn');
          }
        }
      `;

      project.createSourceFile('test.ts', code);

      const deps: HookDependencies = {
        getStagedFiles: () => ['test.ts'],
        createProject: () => project,
      };

      const result = await validateShadowDOMLeakDetection(deps, true);

      expect(result.violations.every((v) => v.suggestion.length > 0)).toBe(true);
      expect(result.violations.some((v) => v.suggestion.includes('shadowRoot'))).toBe(true);
    });

    it('should handle large CSS files efficiently (performance regression)', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      // Generate a large CSS file with 500+ lines
      const cssRules = Array.from({ length: 500 }, (_, i) => `.class-${i} { color: red; }`).join(
        '\n',
      );

      const code = `
        import { css } from 'lit';
        export const styles = css\`
          :host {
            display: block;
          }
          ${cssRules}
        \`;
      `;

      project.createSourceFile('large.styles.ts', code);

      const deps: HookDependencies = {
        getStagedFiles: () => ['large.styles.ts'],
        createProject: () => project,
      };

      const startTime = Date.now();
      const result = await validateShadowDOMLeakDetection(deps, true);
      const elapsedTime = Date.now() - startTime;

      // Should complete in under 2 seconds (performance budget)
      expect(elapsedTime).toBeLessThan(2000);
      expect(result.stats.filesChecked).toBe(1);
    });

    it('should detect Light DOM components and skip this.querySelector validation', async () => {
      const project = new Project({
        useInMemoryFileSystem: true,
      });

      const code = `
        import { LitElement } from 'lit';
        export class LightDOMForm extends LitElement {
          createRenderRoot() {
            return this; // Render to Light DOM
          }

          firstUpdated() {
            const input = this.querySelector('input'); // Should be allowed
          }
        }
      `;

      project.createSourceFile('light-dom-form.ts', code);

      const deps: HookDependencies = {
        getStagedFiles: () => ['light-dom-form.ts'],
        createProject: () => project,
      };

      const result = await validateShadowDOMLeakDetection(deps, true);

      // Should NOT flag this.querySelector for Light DOM components
      expect(
        result.violations.filter((v) => v.message.includes('this.querySelector')),
      ).toHaveLength(0);
    });
  });
});
