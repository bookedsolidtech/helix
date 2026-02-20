import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import {
  checkExplicitAny,
  checkTsIgnore,
  checkNonNullAssertions,
  checkMissingReturnTypes,
  checkMissingParameterTypes,
  validateTypeCheckStrict,
  type Violation,
  type HookDependencies,
} from './type-check-strict.js';

/**
 * Test utilities
 */
function createTestFile(code: string): ReturnType<Project['createSourceFile']> {
  const project = new Project({ useInMemoryFileSystem: true });
  return project.createSourceFile('test.ts', code);
}

// ─── checkExplicitAny ─────────────────────────────────────────────────────

describe('checkExplicitAny', () => {
  it('detects explicit any in function parameters', () => {
    const sourceFile = createTestFile(`
      export function bad(param: any) {
        return param;
      }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('any');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('detects explicit any in variable declarations', () => {
    const sourceFile = createTestFile(`
      const bad: any = 123;
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('any');
  });

  it('detects explicit any in return types', () => {
    const sourceFile = createTestFile(`
      function bad(): any {
        return 123;
      }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(1);
  });

  it('skips any with approval comment', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Legacy integration
      export function approved(param: any) {
        return param;
      }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple any types in same file', () => {
    const sourceFile = createTestFile(`
      const a: any = 1;
      const b: any = 2;
      function c(x: any): any { return x; }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('provides correct line and column numbers', () => {
    const sourceFile = createTestFile(`
      export function test(
        param: any
      ) {
        return param;
      }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(3);
  });
});

// ─── checkTsIgnore ────────────────────────────────────────────────────────

describe('checkTsIgnore', () => {
  it('detects @ts-ignore without approval', () => {
    const sourceFile = createTestFile(`
      // @ts-ignore
      const bad = something;
    `);
    const violations: Violation[] = [];
    checkTsIgnore(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('@ts-ignore');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('skips @ts-ignore with approval comment', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Third-party types
      // @ts-ignore
      const approved = something;
    `);
    const violations: Violation[] = [];
    checkTsIgnore(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple @ts-ignore in same file', () => {
    const sourceFile = createTestFile(`
      // @ts-ignore
      const a = x;

      // @ts-ignore
      const b = y;
    `);
    const violations: Violation[] = [];
    checkTsIgnore(sourceFile, violations);

    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it('provides correct location for @ts-ignore', () => {
    const sourceFile = createTestFile(`
      const good = 1;
      // @ts-ignore
      const bad = something;
    `);
    const violations: Violation[] = [];
    checkTsIgnore(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(3);
  });
});

// ─── checkNonNullAssertions ───────────────────────────────────────────────

describe('checkNonNullAssertions', () => {
  it('detects non-null assertion without approval', () => {
    const sourceFile = createTestFile(`
      const value: string | undefined = getValue();
      const result = value!.toUpperCase();
    `);
    const violations: Violation[] = [];
    checkNonNullAssertions(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('Non-null assertion');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('skips non-null assertion with approval', () => {
    const sourceFile = createTestFile(`
      function test() {
        const value: string | undefined = getValue();
        // @typescript-specialist-approved: TICKET-123 Validated upstream
        const result = value!.toUpperCase();
        return result;
      }
    `);
    const violations: Violation[] = [];
    checkNonNullAssertions(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple non-null assertions', () => {
    const sourceFile = createTestFile(`
      const a = x!;
      const b = y!;
      const c = z!;
    `);
    const violations: Violation[] = [];
    checkNonNullAssertions(sourceFile, violations);

    expect(violations).toHaveLength(3);
  });

  it('provides correct location for non-null assertion', () => {
    const sourceFile = createTestFile(`
      const good = value;
      const bad = value!;
    `);
    const violations: Violation[] = [];
    checkNonNullAssertions(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(3);
  });
});

// ─── checkMissingReturnTypes ──────────────────────────────────────────────

describe('checkMissingReturnTypes', () => {
  it('detects missing return type on exported function', () => {
    const sourceFile = createTestFile(`
      export function test(a: number, b: number) {
        return a + b;
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing explicit return type');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('skips functions with explicit return type', () => {
    const sourceFile = createTestFile(`
      export function test(a: number, b: number): number {
        return a + b;
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips functions returning void', () => {
    const sourceFile = createTestFile(`
      export function test(): void {
        console.log('test');
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips private methods', () => {
    const sourceFile = createTestFile(`
      class Test {
        private helper() {
          return 123;
        }
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips methods starting with underscore', () => {
    const sourceFile = createTestFile(`
      class Test {
        _helper() {
          return 123;
        }
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips Lit lifecycle methods', () => {
    const sourceFile = createTestFile(`
      class MyElement {
        connectedCallback() {
          console.log('connected');
        }

        render() {
          return html\`<div></div>\`;
        }
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects missing return type on public method', () => {
    const sourceFile = createTestFile(`
      class Test {
        public calculate(a: number, b: number) {
          return a + b;
        }
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(1);
  });

  it('detects missing return type on exported arrow function', () => {
    const sourceFile = createTestFile(`
      export const calculate = (a: number, b: number) => {
        return a + b;
      };
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(1);
  });

  it('skips functions with approval comment', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Inferred type is correct
      export function test(a: number, b: number) {
        return a + b;
      }
    `);
    const violations: Violation[] = [];
    checkMissingReturnTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});

// ─── checkMissingParameterTypes ───────────────────────────────────────────

describe('checkMissingParameterTypes', () => {
  it('detects missing parameter type', () => {
    const sourceFile = createTestFile(`
      export function test(value) {
        return value;
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing type annotation');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('skips parameters with type annotations', () => {
    const sourceFile = createTestFile(`
      export function test(value: string) {
        return value;
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips parameters with default values', () => {
    const sourceFile = createTestFile(`
      export function test(value = 'default') {
        return value;
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects missing types on multiple parameters', () => {
    const sourceFile = createTestFile(`
      function test(a, b, c) {
        return a + b + c;
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(3);
  });

  it('detects missing type in arrow function', () => {
    const sourceFile = createTestFile(`
      export const test = (value) => {
        return value;
      };
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(1);
  });

  it('detects missing type in class method', () => {
    const sourceFile = createTestFile(`
      class Test {
        calculate(a, b) {
          return a + b;
        }
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(2);
  });

  it('skips functions with approval comment', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Generic handler
      export function test(value) {
        return value;
      }
    `);
    const violations: Violation[] = [];
    checkMissingParameterTypes(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});

// ─── hasApprovalComment ───────────────────────────────────────────────────

describe('hasApprovalComment', () => {
  it('detects approval comment on node', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Reason
      const test: any = 123;
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects approval comment on parent node', () => {
    const sourceFile = createTestFile(`
      // @typescript-specialist-approved: TICKET-123 Legacy code
      export function test(param: any) {
        return param;
      }
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('returns false when no approval comment exists', () => {
    const sourceFile = createTestFile(`
      const test: any = 123;
    `);
    const violations: Violation[] = [];
    checkExplicitAny(sourceFile, violations);

    expect(violations).toHaveLength(1);
  });
});

// ─── validateTypeCheckStrict (Integration) ────────────────────────────────

describe('validateTypeCheckStrict', () => {
  it('returns passed=true when no violations', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => [],
      createProject: () => new Project({ useInMemoryFileSystem: true }),
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('returns passed=false when critical violations exist', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      '/test.ts',
      `
      export const bad: any = 123;
    `,
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/test.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('calculates correct stats', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      '/test.ts',
      `
      export const a: any = 1;
      export const b: any = 2;
      // @ts-ignore
      export const c = x;
    `,
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/test.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.stats.filesChecked).toBe(1);
    expect(result.stats.totalViolations).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('handles timeout gracefully', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    // Create many files to potentially exceed timeout
    for (let i = 0; i < 50; i++) {
      project.createSourceFile(
        `/test${i}.ts`,
        `
        export const bad${i}: any = ${i};
      `,
      );
    }

    const mockDeps: HookDependencies = {
      getStagedFiles: () => Array.from({ length: 50 }, (_, i) => `/test${i}.ts`),
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    // Should not throw, should return result
    expect(result).toBeDefined();
    expect(result.passed).toBeDefined();
  });

  it('handles empty files gracefully', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('/empty.ts', '');

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/empty.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('handles files with only comments', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      '/comments.ts',
      `
      // This is a comment
      /* Multi-line
         comment */
    `,
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/comments.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('aggregates violations from multiple files', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('/file1.ts', `export const a: any = 1;`);
    project.createSourceFile('/file2.ts', `export const b: any = 2;`);

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/file1.ts', '/file2.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.stats.filesChecked).toBe(2);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });

  it('handles complex violations with correct severity', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      '/complex.ts',
      `
      // Multiple violation types in one file
      export const explicitAny: any = 123;

      // @ts-ignore
      export const ignoredCode = something;

      export function noReturnType(a: number, b: number) {
        const val: string | undefined = undefined;
        return val!.toUpperCase();
      }

      export function noParamTypes(x, y) {
        return x + y;
      }
    `,
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/complex.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(false);
    expect(result.stats.totalViolations).toBeGreaterThan(4);
    expect(result.violations.every((v) => v.severity === 'critical')).toBe(true);
    expect(result.violations.every((v) => v.file === '/complex.ts')).toBe(true);
    expect(result.violations.every((v) => v.suggestion)).toBeTruthy();
  });

  it('passes with approved violations', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(
      '/approved.ts',
      `
      // @typescript-specialist-approved: TICKET-123 Legacy integration
      export const legacyAny: any = externalLib.getValue();

      // @typescript-specialist-approved: TICKET-456 Third-party types
      // @ts-ignore
      export const ignoredImport = require('old-module');
    `,
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/approved.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('provides file path in violations', async () => {
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile('/test.ts', `export const bad: any = 1;`);

    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['/test.ts'],
      createProject: () => project,
    };

    const result = await validateTypeCheckStrict(mockDeps);

    expect(result.violations[0]?.file).toBe('/test.ts');
  });
});
