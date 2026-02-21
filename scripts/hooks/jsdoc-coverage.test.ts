import { describe, it, expect } from 'vitest';
import { Project, SourceFile } from 'ts-morph';
import {
  checkClassJSDoc,
  checkPropertyJSDoc,
  checkMethodJSDoc,
  checkEventDocumentation,
  validateJSDocCoverage,
  hasApprovalComment,
  getJSDocTags,
  hasJSDocTag,
  getJSDocDescription,
  CONFIG,
  type Violation,
  type HookDependencies,
  type JSDocStats,
} from './jsdoc-coverage.js';

/**
 * Test utilities
 */
function createTestProject(): Project {
  return new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
      strict: true,
    },
  });
}

function createTestFile(project: Project, code: string, fileName = 'test.ts'): SourceFile {
  return project.createSourceFile(fileName, code, { overwrite: true });
}

// ─── hasApprovalComment ───────────────────────────────────────────────────

describe('hasApprovalComment', () => {
  it('detects approval comment on node', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-123 Test approval
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    expect(classDecl).toBeDefined();
    expect(hasApprovalComment(classDecl!)).toBe(true);
  });

  it('detects approval comment on parent node', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-456 Parent approval
      export class TestClass {
        property = 'test';
      }
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    expect(property).toBeDefined();
    expect(hasApprovalComment(property!)).toBe(true);
  });

  it('returns false when no approval comment exists', () => {
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

// ─── getJSDocTags ─────────────────────────────────────────────────────────

describe('getJSDocTags', () => {
  it('extracts tags from JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * @summary Test summary
       * @tag test-tag
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];

    const summaryTags = getJSDocTags(jsDocs, 'summary');
    expect(summaryTags).toHaveLength(1);
    expect(summaryTags[0]).toContain('Test summary');

    const tagTags = getJSDocTags(jsDocs, 'tag');
    expect(tagTags).toHaveLength(1);
    expect(tagTags[0]).toContain('test-tag');
  });

  it('returns empty array for missing tags', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * Just a description
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];

    const summaryTags = getJSDocTags(jsDocs, 'summary');
    expect(summaryTags).toHaveLength(0);
  });
});

// ─── hasJSDocTag ──────────────────────────────────────────────────────────

describe('hasJSDocTag', () => {
  it('returns true when tag exists', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * @summary Test
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];

    expect(hasJSDocTag(jsDocs, 'summary')).toBe(true);
  });

  it('returns false when tag does not exist', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * Just a description
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];

    expect(hasJSDocTag(jsDocs, 'summary')).toBe(false);
  });
});

// ─── getJSDocDescription ──────────────────────────────────────────────────

describe('getJSDocDescription', () => {
  it('extracts description from JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * This is a test description.
       * @summary Test
       */
      export class TestClass {}
    `,
    );

    const classDecl = sourceFile.getClasses()[0];
    const jsDocs = classDecl?.getJsDocs() ?? [];

    const description = getJSDocDescription(jsDocs);
    expect(description).toContain('This is a test description');
  });

  it('returns empty string for no description', () => {
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

// ─── checkClassJSDoc ──────────────────────────────────────────────────────

describe('checkClassJSDoc', () => {
  it('reports missing JSDoc on class', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      export class TestButton {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc comment');
    expect(violations[0]?.severity).toBe('critical');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('reports missing @summary tag', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * A button component.
       * @tag hx-button
       */
      export class TestButton {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @summary tag');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('reports missing @tag tag', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * A button component.
       * @summary Button component
       */
      export class TestButton {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @tag tag');
  });

  it('reports missing description', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * @summary Button component
       * @tag hx-button
       */
      export class TestButton {}
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    checkClassJSDoc(classDecl!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
  });

  it('passes with complete JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      /**
       * A button component for user interaction.
       * @summary Button component
       * @tag hx-button
       */
      export class TestButton {}
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

  it('skips class with approval comment', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      // @typescript-specialist-approved: TICKET-123 Legacy code
      export class TestButton {}
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

// ─── checkPropertyJSDoc ───────────────────────────────────────────────────

describe('checkPropertyJSDoc', () => {
  it('reports missing JSDoc on @property() decorated property', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        @property({ type: String })
        variant = 'primary';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc comment');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('reports missing description in JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        /**
         * @attr variant
         */
        @property({ type: String })
        variant = 'primary';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing description');
    expect(stats.documentedAPIs).toBe(1);
  });

  it('reports missing @attr tag for reflected property', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        /**
         * Visual style variant
         */
        @property({ type: String, reflect: true })
        variant = 'primary';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @attr tag');
  });

  it('passes with complete property documentation', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        /**
         * Visual style variant of the button
         * @attr variant
         */
        @property({ type: String, reflect: true })
        variant = 'primary';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('skips private properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        private _internalState = 'test';
        _conventionPrivate = 'test';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    classDecl?.getProperties().forEach((prop) => {
      checkPropertyJSDoc(prop, sourceFile, violations, stats);
    });

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('skips @state() decorated properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { state } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        @state()
        private _count = 0;
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('skips non-decorated properties', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        internalValue = 'test';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(0);
  });

  it('skips property with approval comment', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      export class TestButton extends LitElement {
        // @typescript-specialist-approved: TICKET-789 Legacy property
        @property({ type: String })
        variant = 'primary';
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const property = classDecl?.getProperties()[0];
    checkPropertyJSDoc(property!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });
});

// ─── checkMethodJSDoc ─────────────────────────────────────────────────────

describe('checkMethodJSDoc', () => {
  it('reports missing JSDoc on public method', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        public focus(): void {
          // focus implementation
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc comment');
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });

  it('reports missing description in method JSDoc', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        /**
         * @returns The button label
         */
        public getLabel(): string {
          return 'Button';
        }
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
    expect(stats.documentedAPIs).toBe(1);
  });

  it('reports missing @param tags', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        /**
         * Sets the button label
         */
        public setLabel(label: string): void {
          // implementation
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @param tags');
    expect(violations[0]?.suggestion).toContain('label');
  });

  it('reports missing @returns tag for non-void method', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        /**
         * Gets the button label
         */
        public getLabel(): string {
          return 'Button';
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing @returns tag');
  });

  it('passes with complete method documentation', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        /**
         * Sets the button label to the specified value
         * @param label - The new label text
         * @returns The updated label
         */
        public setLabel(label: string): string {
          return label;
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('skips private methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        private _handleClick(): void {}
        _conventionPrivate(): void {}
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

  it('skips Lit lifecycle methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        connectedCallback(): void {}
        disconnectedCallback(): void {}
        firstUpdated(): void {}
        updated(): void {}
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

  it('skips static methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        static get styles() { return []; }
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

  it('does not require @returns for void methods', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        /**
         * Focuses the button
         */
        public focus(): void {
          // implementation
        }
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(1);
  });

  it('skips method with approval comment', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {
        // @typescript-specialist-approved: TICKET-999 Legacy method
        public oldMethod(): void {}
      }
    `,
    );

    const violations: Violation[] = [];
    const stats: JSDocStats = { totalAPIs: 0, documentedAPIs: 0 };

    const classDecl = sourceFile.getClasses()[0];
    const method = classDecl?.getMethods()[0];
    checkMethodJSDoc(method!, sourceFile, violations, stats);

    expect(violations).toHaveLength(0);
    expect(stats.totalAPIs).toBe(1);
    expect(stats.documentedAPIs).toBe(0);
  });
});

// ─── checkEventDocumentation ──────────────────────────────────────────────

describe('checkEventDocumentation', () => {
  it('reports missing @fires tag for dispatched event', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      /**
       * A button component
       * @summary Button
       * @tag hx-button
       */
      export class TestButton extends LitElement {
        private _handleClick() {
          this.dispatchEvent(new CustomEvent('hx-click', {
            bubbles: true,
            composed: true,
          }));
        }
      }
    `,
    );

    const violations: Violation[] = [];

    const classDecl = sourceFile.getClasses()[0];
    checkEventDocumentation(classDecl!, sourceFile, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('hx-click');
    expect(violations[0]?.message).toContain('missing @fires tag');
  });

  it('passes when all dispatched events are documented', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      /**
       * A button component
       * @summary Button
       * @tag hx-button
       * @fires hx-click - Dispatched when clicked
       * @fires hx-focus - Dispatched when focused
       */
      export class TestButton extends LitElement {
        private _handleClick() {
          this.dispatchEvent(new CustomEvent('hx-click'));
        }

        private _handleFocus() {
          this.dispatchEvent(new CustomEvent('hx-focus'));
        }
      }
    `,
    );

    const violations: Violation[] = [];

    const classDecl = sourceFile.getClasses()[0];
    checkEventDocumentation(classDecl!, sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('reports multiple missing @fires tags', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      /**
       * A button component
       * @summary Button
       * @tag hx-button
       */
      export class TestButton extends LitElement {
        private _handleClick() {
          this.dispatchEvent(new CustomEvent('hx-click'));
          this.dispatchEvent(new CustomEvent('hx-focus'));
          this.dispatchEvent(new CustomEvent('hx-blur'));
        }
      }
    `,
    );

    const violations: Violation[] = [];

    const classDecl = sourceFile.getClasses()[0];
    checkEventDocumentation(classDecl!, sourceFile, violations);

    expect(violations).toHaveLength(3);
    expect(violations.some((v) => v.message.includes('hx-click'))).toBe(true);
    expect(violations.some((v) => v.message.includes('hx-focus'))).toBe(true);
    expect(violations.some((v) => v.message.includes('hx-blur'))).toBe(true);
  });

  it('handles no events gracefully', () => {
    const project = createTestProject();
    const sourceFile = createTestFile(
      project,
      `
      import { LitElement } from 'lit';

      /**
       * A simple component
       * @summary Simple
       * @tag hx-simple
       */
      export class TestSimple extends LitElement {}
    `,
    );

    const violations: Violation[] = [];

    const classDecl = sourceFile.getClasses()[0];
    checkEventDocumentation(classDecl!, sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});

// ─── validateJSDocCoverage ────────────────────────────────────────────────

describe('validateJSDocCoverage', () => {
  it('passes when no files are staged', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => [],
      createProject: () => createTestProject(),
    };

    const result = await validateJSDocCoverage(deps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
    expect(result.stats.coveragePercent).toBe(100);
  });

  it('calculates coverage correctly', async () => {
    const project = createTestProject();
    project.createSourceFile(
      '/test/components/test-button/test-button.ts',
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      /**
       * A button component
       * @summary Button
       * @tag test-button
       */
      export class TestButton extends LitElement {
        /**
         * Button variant
         * @attr variant
         */
        @property({ type: String, reflect: true })
        variant = 'primary';

        @property({ type: Boolean })
        disabled = false;

        /**
         * Focuses the button
         */
        public focus(): void {}

        public blur(): void {}
      }
    `,
    );

    const deps: HookDependencies = {
      getStagedFiles: () => ['/test/components/test-button/test-button.ts'],
      createProject: () => project,
    };

    const result = await validateJSDocCoverage(deps, true);

    // Expected: 5 total APIs (class + 2 properties + 2 methods)
    // Documented: 3 (class + 1 property + 1 method)
    expect(result.stats.totalPublicAPIs).toBe(5);
    expect(result.stats.documentedAPIs).toBe(3); // class + 1 property + 1 method
    expect(result.stats.coveragePercent).toBe(60); // 3/5 = 60%
    expect(result.passed).toBe(false); // Has violations
  });

  it('reports violations for incomplete documentation', async () => {
    const project = createTestProject();
    project.createSourceFile(
      '/test/components/test-button/test-button.ts',
      `
      import { LitElement } from 'lit';

      export class TestButton extends LitElement {}
    `,
    );

    const deps: HookDependencies = {
      getStagedFiles: () => ['/test/components/test-button/test-button.ts'],
      createProject: () => project,
    };

    const result = await validateJSDocCoverage(deps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.severity).toBe('critical');
  });

  it('handles timeout gracefully', async () => {
    const project = createTestProject();
    // Create a large file that will trigger timeout
    project.createSourceFile(
      '/test/components/test-button/test-button.ts',
      `export class TestButton {}`,
    );

    // Mock setTimeout to simulate immediate timeout
    const originalTimeout = CONFIG.timeoutMs;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CONFIG as Record<string, any>).timeoutMs = -1; // Force immediate timeout

    const deps: HookDependencies = {
      getStagedFiles: () => ['/test/components/test-button/test-button.ts'],
      createProject: () => project,
    };

    const result = await validateJSDocCoverage(deps, true);

    // Restore original timeout
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (CONFIG as Record<string, any>).timeoutMs = originalTimeout;

    expect(result.violations.some((v) => v.message.includes('timeout'))).toBe(true);
  });

  it('excludes test and story files', async () => {
    const deps: HookDependencies = {
      // Filtering happens in getStagedFiles, so return empty array to simulate files being filtered out
      getStagedFiles: () => [],
      createProject: () => createTestProject(),
    };

    const result = await validateJSDocCoverage(deps, true);

    expect(result.stats.filesChecked).toBe(0);
    expect(result.passed).toBe(true);
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────

describe('Integration: Full Component Validation', () => {
  it('validates a complete component with perfect documentation', async () => {
    const project = createTestProject();
    project.createSourceFile(
      '/test/components/hx-button/hx-button.ts',
      `
      import { LitElement, html } from 'lit';
      import { customElement, property } from 'lit/decorators.js';

      /**
       * A button component for user interaction.
       *
       * @summary Primary interactive element for triggering actions.
       *
       * @tag hx-button
       *
       * @slot default - Button label text or content.
       *
       * @fires hx-click - Dispatched when the button is clicked.
       *
       * @csspart button - The native button element.
       *
       * @cssprop --hx-button-bg - Button background color.
       */
      @customElement('hx-button')
      export class HelixButton extends LitElement {
        /**
         * Visual style variant of the button.
         * @attr variant
         */
        @property({ type: String, reflect: true })
        variant: 'primary' | 'secondary' = 'primary';

        /**
         * Size of the button.
         * @attr hx-size
         */
        @property({ type: String, reflect: true, attribute: 'hx-size' })
        size: 'sm' | 'md' | 'lg' = 'md';

        private _handleClick(e: MouseEvent): void {
          this.dispatchEvent(new CustomEvent('hx-click', {
            bubbles: true,
            composed: true,
            detail: { originalEvent: e },
          }));
        }

        override render() {
          return html\`<button @click=\${this._handleClick}><slot></slot></button>\`;
        }
      }
    `,
    );

    const deps: HookDependencies = {
      getStagedFiles: () => ['/test/components/hx-button/hx-button.ts'],
      createProject: () => project,
    };

    const result = await validateJSDocCoverage(deps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.coveragePercent).toBe(100);
  });

  it('catches all common documentation mistakes', async () => {
    const project = createTestProject();
    project.createSourceFile(
      '/test/components/bad-component/bad-component.ts',
      `
      import { LitElement } from 'lit';
      import { property } from 'lit/decorators.js';

      // Missing JSDoc entirely
      export class BadComponent extends LitElement {
        @property({ type: String })
        missingDocs = 'bad';

        public doSomething(param: string): string {
          this.dispatchEvent(new CustomEvent('undocumented-event'));
          return param;
        }
      }
    `,
    );

    const deps: HookDependencies = {
      getStagedFiles: () => ['/test/components/bad-component/bad-component.ts'],
      createProject: () => project,
    };

    const result = await validateJSDocCoverage(deps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(3);

    // Should catch: missing class JSDoc, missing property JSDoc, missing method JSDoc, undocumented event
    const violationMessages = result.violations.map((v) => v.message);
    expect(violationMessages.some((m) => m.includes('Class') && m.includes('missing JSDoc'))).toBe(
      true,
    );
    expect(
      violationMessages.some((m) => m.includes('Property') && m.includes('missing JSDoc')),
    ).toBe(true);
    expect(violationMessages.some((m) => m.includes('method') && m.includes('missing JSDoc'))).toBe(
      true,
    );
  });
});
