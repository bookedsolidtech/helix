import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { Project } from 'ts-morph';
import type { HookDependencies, ValidationResult } from './typescript-any-ban';

// Import the validator function
import { validateTypeScriptAnyBan, checkExplicitAny, checkFunctionType, checkMissingReturnTypes, checkMissingParameterTypes } from './typescript-any-ban';

describe('typescript-any-ban (H17)', () => {
  const TMP_DIR = join(process.cwd(), '.tmp-typescript-any-ban-test');

  beforeEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TMP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  // Helper to create mock dependencies
  function createMockDeps(files: string[]): HookDependencies {
    return {
      getStagedFiles: () => files,
      createProject: () =>
        new Project({
          compilerOptions: {
            target: 99, // ESNext
            module: 99, // ESNext
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          skipAddingFilesFromTsConfig: true,
        }),
    };
  }

  describe('checkExplicitAny', () => {
    it('should detect explicit any in type annotation', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public data: any = {};
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('Explicit "any" type');
    });

    it('should detect any in function parameter', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public handleData(param: any): void {
            console.log(param);
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('function parameter');
    });

    it('should detect any in Array<any>', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public items: Array<any> = [];
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('Explicit "any" type');
    });

    it('should detect any in Promise<any>', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public async fetchData(): Promise<any> {
            return {};
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
      const anyViolations = result.violations.filter(v => v.message.includes('any'));
      expect(anyViolations.length).toBeGreaterThan(0);
    });

    it('should detect any in Record<string, any>', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public data: Record<string, any> = {};
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
    });

    it('should allow approved any with comment', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          // @any-approved: TICKET-123 Third-party library compatibility
          public handleData(param: any): void {
            console.log(param);
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.criticalViolations).toBe(0);
    });
  });

  describe('checkFunctionType', () => {
    it('should detect Function type', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public callback: Function = () => {};
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('"Function" type is equivalent to "any"');
    });

    it('should not flag FunctionComponent', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export type FunctionComponent = () => void;
        export const MyComponent: FunctionComponent = () => {};
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });
  });

  describe('checkMissingReturnTypes', () => {
    it('should detect missing return type on public method', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public getData() {
            return { value: 42 };
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('missing explicit return type');
    });

    it('should skip private methods', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          private getData() {
            return { value: 42 };
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should skip underscore-prefixed methods', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public _getData() {
            return { value: 42 };
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should skip Lit lifecycle methods', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public connectedCallback() {
            console.log('connected');
          }
          public disconnectedCallback() {
            console.log('disconnected');
          }
          public render() {
            return '<div>Test</div>';
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should detect missing return type on exported function', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export function getData() {
          return { value: 42 };
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
    });

    it('should skip void return types', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public logData() {
            console.log('data');
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });
  });

  describe('checkMissingParameterTypes', () => {
    it('should detect missing parameter type', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export function processData(data) {
          console.log(data);
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
      expect(result.violations[0]?.message).toContain('missing type annotation');
    });

    it('should skip parameters with default values', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export function processData(count = 0) {
          console.log(count);
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should skip destructured parameters', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export function processData({ value }: { value: number }) {
          console.log(value);
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
    });
  });

  describe('file filtering', () => {
    it('should skip test files', async () => {
      const filePath = join(TMP_DIR, 'test.test.ts');
      const code = `
        it('should work', () => {
          const data: any = {};
          expect(data).toBeDefined();
        });
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
    });

    it('should skip story files', async () => {
      const filePath = join(TMP_DIR, 'component.stories.ts');
      const code = `
        export default {
          title: 'Component',
          args: {} as any,
        };
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
    });

    it('should skip declaration files', async () => {
      const filePath = join(TMP_DIR, 'types.d.ts');
      const code = `
        declare module 'module' {
          export const value: any;
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
    });
  });

  describe('integration', () => {
    it('should pass when no any types are used', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public label: string = 'Test';

          public getData(): { value: number } {
            return { value: 42 };
          }

          public handleClick(event: MouseEvent): void {
            console.log('Clicked:', event);
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.totalViolations).toBe(0);
    });

    it('should handle multiple violations in one file', async () => {
      const filePath = join(TMP_DIR, 'test.ts');
      const code = `
        export class TestClass {
          public data: any = {};
          public callback: Function = () => {};

          public getData() {
            return this.data;
          }

          public handleData(param) {
            console.log(param);
          }
        }
      `;
      writeFileSync(filePath, code);

      const deps = createMockDeps([filePath]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(2);
    });

    it('should handle no staged files', async () => {
      const deps = createMockDeps([]);
      const result = await validateTypeScriptAnyBan(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
    });
  });
});
