import { describe, it, expect, vi } from 'vitest';
import { Project, SourceFile } from 'ts-morph';
import {
  validateDocumentationCompleteness,
  checkClassJSDoc,
  checkPropertyJSDoc,
  checkMethodJSDoc,
  checkMethodParams,
  checkMethodReturns,
  checkGetAccessorJSDoc,
  checkSetAccessorJSDoc,
  hasApprovalComment,
  getJSDocTags,
  hasJSDocTag,
  getJSDocDescription,
  CONFIG,
} from './documentation-completeness';
import type { Violation, HookDependencies, JSDocStats } from './documentation-completeness';

// ─── Test Helpers ─────────────────────────────────────────────────────────

function createTestProject(): Project {
  return new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      strict: true,
    },
  });
}

function createTestFile(project: Project, content: string, fileName = 'test.ts'): SourceFile {
  return project.createSourceFile(fileName, content);
}

// ─── Unit Tests: Utility Functions ───────────────────────────────────────

describe('hasApprovalComment', () => {
  it('should detect approval comment on node', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-123 Reason
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    expect(classDecl).toBeDefined();
    expect(hasApprovalComment(classDecl!)).toBe(true);
  });

  it('should detect approval comment on parent node', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-456 Parent approval
      export class TestClass {
        public prop: string = '';
      }
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];
    expect(prop).toBeDefined();
    expect(hasApprovalComment(prop!)).toBe(true);
  });

  it('should return false when no approval comment', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    expect(classDecl).toBeDefined();
    expect(hasApprovalComment(classDecl!)).toBe(false);
  });
});

describe('getJSDocTags', () => {
  it('should extract @param tags', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Test method
         * @param name - The name
         * @param age - The age
         */
        public test(name: string, age: number): void {}
      }
    `,
    );

    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];
    const paramTags = getJSDocTags(jsDocs, 'param');

    expect(paramTags).toHaveLength(2);
    expect(paramTags[0]).toContain('name');
    expect(paramTags[1]).toContain('age');
  });

  it('should return empty array when tag not found', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Test method
         */
        public test(): void {}
      }
    `,
    );

    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];
    const paramTags = getJSDocTags(jsDocs, 'param');

    expect(paramTags).toHaveLength(0);
  });
});

describe('hasJSDocTag', () => {
  it('should return true when tag exists', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Test method
         * @returns The result
         */
        public test(): boolean { return true; }
      }
    `,
    );

    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];

    expect(hasJSDocTag(jsDocs, 'returns')).toBe(true);
  });

  it('should return false when tag does not exist', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Test method
         */
        public test(): void {}
      }
    `,
    );

    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];

    expect(hasJSDocTag(jsDocs, 'returns')).toBe(false);
  });
});

describe('getJSDocDescription', () => {
  it('should extract JSDoc description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * This is a test class
       * with multiple lines
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];
    const description = getJSDocDescription(jsDocs);

    expect(description).toContain('test class');
  });

  it('should return empty string when no JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];
    const description = getJSDocDescription(jsDocs);

    expect(description).toBe('');
  });
});

// ─── Unit Tests: Validators ──────────────────────────────────────────────

describe('checkClassJSDoc', () => {
  it('should flag class missing JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];

    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('should flag class with JSDoc but missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * @tag test-class
       */
      export class TestClass {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];

    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should pass for properly documented class', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * A test class for demonstration
       */
      export class TestClass {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];

    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should skip class with approval comment', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-123 Legacy code
      export class TestClass {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];

    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });
});

describe('checkPropertyJSDoc', () => {
  it('should flag public @property without JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement, property } from 'lit';

      export class TestClass extends LitElement {
        @property({ type: String })
        public label: string = '';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('should flag property with JSDoc but missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement, property } from 'lit';

      export class TestClass extends LitElement {
        /**
         * @attr label
         */
        @property({ type: String })
        public label: string = '';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should pass for properly documented property', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement, property } from 'lit';

      export class TestClass extends LitElement {
        /**
         * The button label text
         */
        @property({ type: String })
        public label: string = '';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should skip private properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement, property } from 'lit';

      export class TestClass extends LitElement {
        @property({ type: String })
        private _internal: string = '';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip @state properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement, state } from 'lit';

      export class TestClass extends LitElement {
        @state()
        public internalState: boolean = false;
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip non-decorated properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        public regularProp: string = '';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const prop = classDecl?.getProperties()[0];

    checkPropertyJSDoc(prop!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });
});

describe('checkMethodJSDoc', () => {
  it('should flag public method without JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        public doSomething(): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('should flag method with JSDoc but missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * @returns Nothing
         */
        public doSomething(): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should skip private methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        private _internal(): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip Lit lifecycle methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestClass extends LitElement {
        connectedCallback(): void {}
        render() { return null; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];

    classDecl?.getMethods().forEach((method) => {
      checkMethodJSDoc(method, sourceFile, violations, stats);
    });

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip static methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        static staticMethod(): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });
});

describe('checkMethodParams', () => {
  it('should flag method missing all @param tags', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Does something
         */
        public doSomething(name: string, age: number): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @param tags for all parameters');
  });

  it('should flag method missing specific @param tag', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Does something
         * @param name - The name
         */
        public doSomething(name: string, age: number): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @param tag for parameter "age"');
  });

  it('should pass when all parameters documented', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Does something
         * @param name - The name
         * @param age - The age
         */
        public doSomething(name: string, age: number): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});

describe('checkMethodReturns', () => {
  it('should flag non-void method missing @returns', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Gets something
         */
        public getSomething(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodReturns(method!, jsDocs, sourceFile, violations, 'string');

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @returns');
  });

  it('should pass when @returns tag present', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Gets something
         * @returns The result
         */
        public getSomething(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodReturns(method!, jsDocs, sourceFile, violations, 'string');

    expect(violations).toHaveLength(0);
  });
});

describe('checkMethodParams - Advanced Cases', () => {
  it('should handle rest parameters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Handle items
         * @param items - The items to handle
         */
        public handleItems(...items: string[]): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('should flag missing rest parameter documentation', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Handle items
         */
        public handleItems(...items: string[]): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.message).toContain('missing @param tags for all parameters');
  });

  it('should handle optional parameters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Handle event
         * @param event - The event
         * @param options - Optional options
         */
        public handle(event: Event, options?: object): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('should flag destructured parameters missing documentation', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Handle config
         */
        public handle({ x, y }: { x: number; y: number }): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const method = sourceFile.getClasses()[0]?.getMethods()[0];
    const params = method?.getParameters() ?? [];
    const jsDocs = method?.getJsDocs() ?? [];

    checkMethodParams(method!, params, jsDocs, sourceFile, violations);

    // Destructured params are internally named param0, param1, etc. by ts-morph
    // Should flag missing documentation for the destructured parameter
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe('checkGetAccessorJSDoc', () => {
  it('should flag getter missing JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        get value(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('should flag getter with JSDoc but missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * @returns The value
         */
        get value(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should flag getter missing @returns tag', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Gets the current value
         */
        get value(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @returns');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should pass for properly documented getter', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Gets the current value
         * @returns The current value
         */
        get value(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should skip private getters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        private get _internal(): string { return ''; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip static getters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        static get config(): object { return {}; }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const getter = classDecl?.getGetAccessors()[0];

    checkGetAccessorJSDoc(getter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });
});

describe('checkSetAccessorJSDoc', () => {
  it('should flag setter missing JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        set value(val: string) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('should flag setter with JSDoc but missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * @param val - The value to set
         */
        set value(val: string) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should flag setter missing @param tag', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Sets the current value
         */
        set value(val: string) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @param');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should pass for properly documented setter', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Sets the current value
         * @param val - The value to set
         */
        set value(val: string) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('should skip private setters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        private set _internal(val: string) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('should skip static setters', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        static set config(val: object) {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const classDecl = sourceFile.getClasses()[0];
    const setter = classDecl?.getSetAccessors()[0];

    checkSetAccessorJSDoc(setter!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });
});

describe('checkMethodReturns - Advanced Cases', () => {
  it('should handle Promise<void> return type', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Async method
         */
        public async doSomething(): Promise<void> {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const method = sourceFile.getClasses()[0]?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    // Should not flag missing @returns for Promise<void>
    expect(violations.every((v) => !v.message.includes('@returns'))).toBe(true);
  });

  it('should handle never return type', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestClass {
        /**
         * Throws always
         */
        public throwError(): never {
          throw new Error('Always throws');
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };
    const method = sourceFile.getClasses()[0]?.getMethods()[0];

    checkMethodJSDoc(method!, sourceFile, violations, stats);

    // Should flag missing @returns for never (as it's not in the void list)
    expect(violations.some((v) => v.message.includes('@returns'))).toBe(true);
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────

describe('validateDocumentationCompleteness', () => {
  it('should return no violations for empty staged files', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => []),
      createProject: vi.fn(() => createTestProject()),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('should validate complete documentation', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      import { LitElement, property } from 'lit';

      /**
       * A test component
       */
      export class TestComponent extends LitElement {
        /**
         * The label text
         */
        @property({ type: String })
        label = '';

        /**
         * Handle click events
         * @param event - The mouse event
         * @returns True if handled
         */
        public handleClick(event: MouseEvent): boolean {
          return true;
        }
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.totalPublicAPIs).toBe(3); // class, property, method
    expect(result.stats.documentedAPIs).toBe(3);
    expect(result.stats.coveragePercent).toBe(100);
  });

  it('should detect missing JSDoc on class', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      export class TestComponent {}
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.message).toContain('missing JSDoc');
  });

  it('should detect missing @param tags', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      /**
       * Test component
       */
      export class TestComponent {
        /**
         * Handle event
         */
        public handle(event: MouseEvent): void {}
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.message.includes('@param'))).toBe(true);
  });

  it('should detect missing @returns tag', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      /**
       * Test component
       */
      export class TestComponent {
        /**
         * Get value
         * @param key - The key
         */
        public getValue(key: string): string {
          return '';
        }
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.message.includes('@returns'))).toBe(true);
  });

  it('should support bail-fast mode', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      export class TestComponent1 {}
      export class TestComponent2 {}
      export class TestComponent3 {}
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true, true);

    expect(result.passed).toBe(false);
    // Should have at least 1 violation (bail fast after first)
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle Git errors gracefully', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => {
        throw new Error('Git command failed');
      }),
      createProject: vi.fn(() => createTestProject()),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]?.message).toContain('Failed to get staged files');
  });

  it('should handle parse errors gracefully', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      export class InvalidSyntax {
        // Missing closing brace
    `,
      'invalid.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['invalid.ts']),
      createProject: vi.fn(() => {
        const p = createTestProject();
        // Mock addSourceFileAtPath to throw
        p.addSourceFileAtPath = vi.fn(() => {
          throw new Error('Parse error');
        });
        return p;
      }),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.message.includes('Failed to parse'))).toBe(true);
  });

  it('should validate getters and setters', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      /**
       * A test component with accessors
       */
      export class TestComponent extends LitElement {
        /**
         * Gets the form element
         * @returns The associated form
         */
        get form(): HTMLFormElement | null {
          return null;
        }

        /**
         * Sets the disabled state
         * @param value - Whether the component is disabled
         */
        set disabled(value: boolean) {}
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.totalPublicAPIs).toBe(3); // class, getter, setter
    expect(result.stats.documentedAPIs).toBe(3);
    expect(result.stats.coveragePercent).toBe(100);
  });

  it('should detect missing JSDoc on getters', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      /**
       * Test component
       */
      export class TestComponent {
        get value(): string { return ''; }
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.message.includes('getter'))).toBe(true);
  });

  it('should detect missing JSDoc on setters', async () => {
    const project = createTestProject();
    const _testFile = createTestFile(
      project,
      `
      /**
       * Test component
       */
      export class TestComponent {
        set value(val: string) {}
      }
    `,
      'test-component.ts',
    );

    const mockDeps: HookDependencies = {
      getStagedFiles: vi.fn(() => ['test-component.ts']),
      createProject: vi.fn(() => project),
    };

    const result = await validateDocumentationCompleteness(mockDeps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.message.includes('setter'))).toBe(true);
  });
});

// ─── Configuration Tests ──────────────────────────────────────────────────

describe('CONFIG', () => {
  it('should have correct approval comment', () => {
    expect(CONFIG.approvalComment).toBe('@typescript-specialist-approved');
  });

  it('should have performance budget of 2000ms', () => {
    expect(CONFIG.performanceBudgetMs).toBe(2000);
  });

  it('should include all Lit lifecycle methods', () => {
    expect(CONFIG.litLifecycleMethods).toContain('render');
    expect(CONFIG.litLifecycleMethods).toContain('connectedCallback');
    expect(CONFIG.litLifecycleMethods).toContain('updated');
  });

  it('should exclude test files', () => {
    expect(CONFIG.excludePatterns).toContain('**/*.test.ts');
    expect(CONFIG.excludePatterns).toContain('**/*.stories.ts');
  });
});
