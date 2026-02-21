import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('dead-code-elimination (H24)', () => {
  // Find project root by looking for scripts/hooks directory
  // This works whether tests run from project root or scripts/hooks directory
  const cwd = process.cwd();
  const PROJECT_ROOT =
    cwd.endsWith('scripts/hooks') || cwd.endsWith('scripts\\hooks') ? join(cwd, '../..') : cwd;
  const TMP_DIR = join(PROJECT_ROOT, '.tmp-dead-code-elimination-test');
  const hookScript = join(PROJECT_ROOT, 'scripts/hooks/dead-code-elimination.ts');

  beforeEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TMP_DIR, { recursive: true });
    execSync('git init', { cwd: TMP_DIR });
    execSync('git config user.email "test@example.com"', { cwd: TMP_DIR });
    execSync('git config user.name "Test User"', { cwd: TMP_DIR });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it('should pass when no dead code is present', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/button.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const validCode = `
      import { LitElement } from 'lit';
      import { customElement } from 'lit/decorators.js';

      @customElement('my-button')
      export class MyButton extends LitElement {
        render() {
          return html\`<button>Click me</button>\`;
        }
      }
    `;

    writeFileSync(componentPath, validCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should detect orphaned imports', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/card.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const codeWithOrphanedImport = `
      import { LitElement, html } from 'lit';
      import { customElement } from 'lit/decorators.js';
      import { nothing } from 'lit'; // Imported but never used

      @customElement('my-card')
      export class MyCard extends LitElement {
        render() {
          return html\`<div>Card content</div>\`;
        }
      }
    `;

    writeFileSync(componentPath, codeWithOrphanedImport);
    execSync(`git add -A`, { cwd: TMP_DIR });

    // Orphaned imports are warnings, not critical - hook should pass but show warnings
    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Orphaned import');
    expect(result).toContain('nothing');
  });

  it('should detect unreachable code after return', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/form.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const codeWithDeadBranch = `
      export class FormHandler {
        handleSubmit(): void {
          console.log('Submitting');
          return;
          console.log('This will never execute'); // Dead code
        }
      }
    `;

    writeFileSync(componentPath, codeWithDeadBranch);
    execSync(`git add -A`, { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Will exit with code 1 due to critical violation
  });

  it('should detect unreachable code after throw', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/validator.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const codeWithDeadBranch = `
      export function validate(value: string): void {
        if (!value) {
          throw new Error('Invalid value');
          console.log('This is unreachable'); // Dead code
        }
      }
    `;

    writeFileSync(componentPath, codeWithDeadBranch);
    execSync(`git add -A`, { cwd: TMP_DIR });

    let didThrow = false;
    let output = '';
    try {
      output = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    } catch (error) {
      didThrow = true;
      output = error.stdout || error.stderr || '';
    }

    // Either should throw OR contain unreachable code detection
    expect(didThrow || output.includes('Unreachable code detected')).toBe(true);
  });

  it('should pass when dead code is approved', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/legacy.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const approvedCode = `
      export class LegacyHandler {
        handleData(): void {
          return;
          // @dead-code-approved: TICKET-456 Temporary workaround
          console.log('Intentionally unreachable - will be refactored');
        }
      }
    `;

    writeFileSync(componentPath, approvedCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should skip test files', () => {
    const testPath = join(TMP_DIR, 'packages/lib/src/components/button.test.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const testCode = `
      import { expect } from 'vitest';
      import { SomethingUnused } from './utils'; // Unused import

      it('should work', () => {
        const x = 1;
        return;
        console.log('Dead code in test');
      });
    `;

    writeFileSync(testPath, testCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('No staged files to check');
  });

  it('should skip story files', () => {
    const storyPath = join(TMP_DIR, 'packages/lib/src/components/button.stories.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const storyCode = `
      import type { Meta } from '@storybook/web-components';
      import { UnusedImport } from './button'; // Unused

      export default {
        title: 'Components/Button',
      } as Meta;

      export const Primary = () => {
        return;
        console.log('Dead code');
      };
    `;

    writeFileSync(storyPath, storyCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('No staged files to check');
  });

  it('should detect multiple types of violations in one file', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/multi.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const problematicCode = `
      import { LitElement } from 'lit';
      import { customElement } from 'lit/decorators.js';
      import { nothing } from 'lit'; // Orphaned import

      @customElement('multi-component')
      export class MultiComponent extends LitElement {
        handleClick(): void {
          console.log('Clicked');
          return;
          console.log('Unreachable'); // Dead code
        }
      }
    `;

    writeFileSync(componentPath, problematicCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Will fail due to both warnings and critical violations
  });

  it('should handle arrow functions with dead code', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/helpers.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const arrowFunctionCode = `
      export const processData = (data: string) => {
        console.log(data);
        return data.toUpperCase();
        console.log('This is unreachable in arrow function');
      };
    `;

    writeFileSync(componentPath, arrowFunctionCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Critical violation
  });

  it('should handle JSON output mode', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/test.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const validCode = `
      import { LitElement } from 'lit';

      export class TestComponent extends LitElement {
        render() {
          return html\`<div>Test</div>\`;
        }
      }
    `;

    writeFileSync(componentPath, validCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript} --json`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('passed');
    expect(parsed).toHaveProperty('violations');
    expect(parsed).toHaveProperty('stats');
  });

  it('should not flag web components as unused exports', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/widget.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const webComponentCode = `
      import { LitElement, html } from 'lit';
      import { customElement } from 'lit/decorators.js';

      @customElement('my-widget')
      export class MyWidget extends LitElement {
        render() {
          return html\`<div>Widget</div>\`;
        }
      }
    `;

    writeFileSync(componentPath, webComponentCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should detect side-effect imports', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/styles.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const sideEffectCode = `
      import './global-styles.css'; // Side-effect import
      import 'some-polyfill'; // Another side-effect import

      export const Component = () => 'test';
    `;

    writeFileSync(componentPath, sideEffectCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Side-effect import detected');
  });

  it('should detect namespace imports', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/namespace.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const namespaceCode = `
      import * as Utils from './helpers';

      export const process = () => {
        Utils.doSomething();
      };
    `;

    writeFileSync(componentPath, namespaceCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Namespace import detected');
  });

  it('should detect unused namespace imports', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/unused-namespace.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const unusedNamespaceCode = `
      import * as UnusedUtils from './helpers'; // Never used

      export const process = () => {
        return 'test';
      };
    `;

    writeFileSync(componentPath, unusedNamespaceCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Orphaned namespace import');
    expect(result).toContain('UnusedUtils');
  });

  it('should detect re-exports in index.ts files', () => {
    const indexPath = join(TMP_DIR, 'packages/lib/src/components/index.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const reExportCode = `
      export { MyButton } from './button';
      export { MyCard } from './card';
      export * from './utils';
    `;

    writeFileSync(indexPath, reExportCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Re-export detected');
  });

  it('should detect dead conditional branches', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/conditionals.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const deadConditionalCode = `
      export function checkValue(value: string): string {
        if (true) {
          return 'always executed';
        } else {
          return 'never executed';
        }
      }

      export function anotherCheck(): void {
        if (false) {
          console.log('never runs');
        }
      }
    `;

    writeFileSync(componentPath, deadConditionalCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Dead conditional branch');
  });

  it('should support bail-fast mode', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/bail.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const criticalCode = `
      export class Handler {
        process(): void {
          return;
          console.log('Dead code 1');
        }

        another(): void {
          return;
          console.log('Dead code 2');
        }
      }
    `;

    writeFileSync(componentPath, criticalCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript} --bail-fast`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Should exit with error

    // In bail-fast mode, it should stop after first critical violation
    // So we expect only one violation to be reported
  });

  it('should check index.ts files for re-exports', () => {
    const indexPath = join(TMP_DIR, 'packages/lib/src/components/index.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const indexCode = `
      export { Button } from './button';
      export type { ButtonProps } from './button';
    `;

    writeFileSync(indexPath, indexCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    // Should check index.ts and flag re-exports
    expect(result).toContain('Re-export detected');
  });

  it('should approve side-effect imports with approval comment', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/components/approved-side-effect.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/components'), { recursive: true });

    const approvedSideEffectCode = `
      // @dead-code-approved: TICKET-789 Polyfill required for IE11
      import 'core-js/stable';

      export const Component = () => 'test';
    `;

    writeFileSync(componentPath, approvedSideEffectCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should approve namespace imports with approval comment', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/approved-namespace.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const approvedNamespaceCode = `
      // @dead-code-approved: TICKET-101 Namespace import required for dynamic access
      import * as DynamicUtils from './utils';

      export const process = (key: string) => {
        return DynamicUtils[key]?.();
      };
    `;

    writeFileSync(componentPath, approvedNamespaceCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should approve re-exports with approval comment', () => {
    const indexPath = join(TMP_DIR, 'packages/lib/src/approved-index/index.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/approved-index'), { recursive: true });

    const approvedReExportCode = `
      // @dead-code-approved: TICKET-202 Public API surface
      export { MyButton } from './button';
      export { MyCard } from './card';
    `;

    writeFileSync(indexPath, approvedReExportCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });

  it('should approve dead conditionals with approval comment', () => {
    const componentPath = join(TMP_DIR, 'packages/lib/src/utils/approved-conditional.ts');
    mkdirSync(join(TMP_DIR, 'packages/lib/src/utils'), { recursive: true });

    const approvedConditionalCode = `
      export function debugMode(): void {
        // @dead-code-approved: TICKET-303 Feature flag for debugging
        if (true) {
          console.log('Debug mode enabled');
        }
      }
    `;

    writeFileSync(componentPath, approvedConditionalCode);
    execSync(`git add -A`, { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All files passed');
  });
});
