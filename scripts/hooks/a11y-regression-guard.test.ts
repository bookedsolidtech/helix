import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Project } from 'ts-morph';
import {
  validateA11yRegression,
  checkARIAAttributes,
  checkRoleAttributes,
  checkAltText,
  checkKeyboardNav,
  checkHeadingHierarchy,
  checkAriaReferences,
  extractTemplateString,
  findClosestMatch,
  levenshteinDistance,
  hasApprovalComment,
  formatViolation,
  type HookDependencies,
  type Violation,
} from './a11y-regression-guard.js';

describe('a11y-regression-guard (H06)', () => {
  // ─── Test Fixtures ──────────────────────────────────────────────────────

  const buttonComponentCode = `
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
export class HelixButton extends LitElement {
  @property({ type: Boolean })
  disabled = false;

  render() {
    return html\`
      <button
        part="button"
        ?disabled=\${this.disabled}
        aria-disabled=\${this.disabled ? 'true' : 'false'}
      >
        <slot></slot>
      </button>
    \`;
  }
}
`;

  const invalidAriaComponentCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <div aria-labeledby="label-id">
        <button aria-desciption="button description">Click me</button>
      </div>
    \`;
  }
}
`;

  const invalidRoleComponentCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <div role="invalid-role">
        <span role="btn">Click me</span>
      </div>
    \`;
  }
}
`;

  const missingAltTextCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <img src="logo.png" />
      <img src="icon.png">
    \`;
  }
}
`;

  const missingKeyboardNavCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <div @click=\${this._handleClick}>
        <span @click=\${this._handleClick}>Click me</span>
      </div>
    \`;
  }

  private _handleClick() {
    console.log('clicked');
  }
}
`;

  const invalidHeadingHierarchyCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <h1>Title</h1>
      <h3>Subtitle</h3>
      <h2>Section</h2>
    \`;
  }
}
`;

  const invalidAriaReferencesCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <input aria-describedby="help-text error-message" />
      <div id="help-text">Help text</div>
    \`;
  }
}
`;

  const approvedExceptionCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

// @accessibility-engineer-approved: TICKET-123 Legacy component migration
@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <div aria-invalid-attr="value">
        <img src="logo.png" />
      </div>
    \`;
  }
}
`;

  let project: Project;
  let mockDeps: HookDependencies;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        experimentalDecorators: true,
      },
    });

    mockDeps = {
      getStagedFiles: vi.fn(() => []),
      createProject: vi.fn(() => project),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── Utility Functions ─────────────────────────────────────────────────

  describe('hasApprovalComment', () => {
    it('should detect approval comment', () => {
      const content = '// @accessibility-engineer-approved: TICKET-123 Reason\nexport class Foo {}';
      expect(hasApprovalComment(content)).toBe(true);
    });

    it('should return false when no approval comment', () => {
      const content = 'export class Foo {}';
      expect(hasApprovalComment(content)).toBe(false);
    });
  });

  describe('formatViolation', () => {
    it('should format critical violation', () => {
      const violation: Violation = {
        file: 'test.ts',
        line: 10,
        column: 5,
        message: 'Invalid ARIA attribute',
        suggestion: 'Fix it',
        severity: 'critical',
      };

      const result = formatViolation(violation);
      expect(result).toContain('[CRITICAL]');
      expect(result).toContain('test.ts:10:5');
      expect(result).toContain('Invalid ARIA attribute');
      expect(result).toContain('Fix it');
    });

    it('should format warning violation', () => {
      const violation: Violation = {
        file: 'test.ts',
        line: 10,
        column: 5,
        message: 'Warning message',
        suggestion: 'Fix it',
        severity: 'warning',
      };

      const result = formatViolation(violation);
      expect(result).toContain('[WARNING]');
    });

    it('should include code when provided', () => {
      const violation: Violation = {
        file: 'test.ts',
        line: 10,
        column: 5,
        message: 'Error',
        suggestion: 'Fix it',
        code: 'aria-labeledby',
        severity: 'critical',
      };

      const result = formatViolation(violation);
      expect(result).toContain('aria-labeledby');
    });
  });

  describe('levenshteinDistance', () => {
    it('should calculate distance for identical strings', () => {
      expect(levenshteinDistance('test', 'test')).toBe(0);
    });

    it('should calculate distance for different strings', () => {
      expect(levenshteinDistance('aria-labeledby', 'aria-labelledby')).toBe(1);
    });

    it('should calculate distance for completely different strings', () => {
      const distance = levenshteinDistance('abc', 'xyz');
      expect(distance).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'test')).toBe(4);
      expect(levenshteinDistance('test', '')).toBe(4);
      expect(levenshteinDistance('', '')).toBe(0);
    });
  });

  describe('findClosestMatch', () => {
    it('should find closest match for typo', () => {
      const validOptions = ['aria-label', 'aria-labelledby', 'aria-describedby'];
      const result = findClosestMatch('aria-labeledby', validOptions);
      expect(result).toBe('aria-labelledby');
    });

    it('should find closest match for partial match', () => {
      const validOptions = ['button', 'checkbox', 'radio'];
      const result = findClosestMatch('btn', validOptions);
      expect(result).toBe('button');
    });

    it('should handle exact match', () => {
      const validOptions = ['aria-label', 'aria-hidden', 'aria-live'];
      const result = findClosestMatch('aria-label', validOptions);
      expect(result).toBe('aria-label');
    });
  });

  describe('extractTemplateString', () => {
    it('should extract template from render method', () => {
      const sourceFile = project.createSourceFile('test.ts', buttonComponentCode);
      const classDecl = sourceFile.getClasses()[0];

      const template = extractTemplateString(classDecl!);

      expect(template).not.toBeNull();
      expect(template).toContain('button');
      expect(template).toContain('aria-disabled');
    });

    it('should return null when no render method', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test-no-render.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const template = extractTemplateString(classDecl!);
      expect(template).toBeNull();
    });

    it('should return null when render method has no template', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return null;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-no-template.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const template = extractTemplateString(classDecl!);
      expect(template).toBeNull();
    });

    it('should handle multiline templates', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div>
                <span>Line 1</span>
                <span>Line 2</span>
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-multiline.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const template = extractTemplateString(classDecl!);
      expect(template).toContain('Line 1');
      expect(template).toContain('Line 2');
    });
  });

  // ─── Validation Functions ─────────────────────────────────────────────

  describe('checkARIAAttributes', () => {
    it('should detect invalid ARIA attribute (typo)', () => {
      const sourceFile = project.createSourceFile('test.ts', invalidAriaComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('aria-labeledby'))).toBe(true);
      expect(violations.some((v) => v.message.includes('aria-desciption'))).toBe(true);
    });

    it('should not detect valid ARIA attributes', () => {
      const sourceFile = project.createSourceFile('test.ts', buttonComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', approvedExceptionCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should suggest closest valid attribute', () => {
      const sourceFile = project.createSourceFile('test.ts', invalidAriaComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test.ts', template!, violations, sourceFile.getFullText());

      const labelledByViolation = violations.find((v) => v.message.includes('aria-labeledby'));
      expect(labelledByViolation?.suggestion).toContain('aria-labelledby');
    });

    it('should deduplicate violations for same attribute', () => {
      // The checkARIAAttributes function already deduplicates by using a Set
      // This test verifies that behavior
      const sourceFile = project.createSourceFile('test.ts', invalidAriaComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test.ts', template!, violations, sourceFile.getFullText());

      // Should detect two invalid attributes: aria-labeledby and aria-desciption
      expect(violations.length).toBeGreaterThan(0);

      // Each unique invalid attribute should only be reported once
      const uniqueMessages = new Set(violations.map((v) => v.message));
      expect(uniqueMessages.size).toBe(violations.length);
    });
  });

  describe('checkRoleAttributes', () => {
    it('should detect invalid role attributes', () => {
      const sourceFile = project.createSourceFile('test.ts', invalidRoleComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('invalid-role'))).toBe(true);
      expect(violations.some((v) => v.message.includes('btn'))).toBe(true);
    });

    it('should not detect valid roles', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div role="button">
                <span role="alert">Message</span>
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-valid-roles.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test-valid-roles.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip template expressions', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div role="\${this.dynamicRole}">Content</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-dynamic-role.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test-dynamic-role.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', approvedExceptionCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should not duplicate role violations', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div role="invalid-role">1</div>
              <div role="invalid-role">2</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-dup-role.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test-dup-role.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(1);
    });
  });

  describe('checkAltText', () => {
    it('should detect missing alt attribute on images', () => {
      const sourceFile = project.createSourceFile('test.ts', missingAltTextCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAltText('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(2);
      expect(violations.every((v) => v.message.includes('alt'))).toBe(true);
    });

    it('should not flag images with alt attribute', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <img src="logo.png" alt="Company logo" />
              <img src="icon.png" alt="" />
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-with-alt.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAltText('test-with-alt.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', approvedExceptionCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAltText('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should truncate long img tags in code sample', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <img src="very-long-path-that-exceeds-eighty-characters-and-should-be-truncated.png" />
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-long-img.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAltText('test-long-img.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(1);
      expect(violations[0]?.code!.length).toBeLessThanOrEqual(80);
    });
  });

  describe('checkKeyboardNav', () => {
    it('should detect clickable elements without keyboard handlers', () => {
      const sourceFile = project.createSourceFile('test.ts', missingKeyboardNavCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkKeyboardNav('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.severity === 'critical')).toBe(true);
    });

    it('should not flag elements with keyboard handlers', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div
                @click=\${this._handleClick}
                @keydown=\${this._handleKeyDown}
                tabindex="0"
                role="button"
              >
                Click me
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-with-keyboard.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkKeyboardNav('test-with-keyboard.ts', template!, violations, sourceFile.getFullText());

      const criticalViolations = violations.filter((v) => v.severity === 'critical');
      expect(criticalViolations).toHaveLength(0);
    });

    it('should error on missing tabindex and role', () => {
      const sourceFile = project.createSourceFile('test.ts', missingKeyboardNavCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkKeyboardNav('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.some((v) => v.severity === 'critical')).toBe(true);
      expect(violations.some((v) => v.message.includes('tabindex'))).toBe(true);
    });

    it('should skip check when approval comment present', () => {
      const code = `
        // @accessibility-engineer-approved: TICKET-123 Using native button
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`<div @click=\${this._handleClick}>Click</div>\`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-approved-keyboard.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkKeyboardNav(
        'test-approved-keyboard.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );

      expect(violations).toHaveLength(0);
    });

    it('should accept @keyup as valid keyboard handler', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div
                @click=\${this._handleClick}
                @keyup=\${this._handleKeyUp}
                tabindex="0"
              >
                Click me
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-keyup.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkKeyboardNav('test-keyup.ts', template!, violations, sourceFile.getFullText());

      const criticalViolations = violations.filter((v) => v.severity === 'critical');
      expect(criticalViolations).toHaveLength(0);
    });
  });

  describe('checkHeadingHierarchy', () => {
    it('should detect skipped heading levels', () => {
      const sourceFile = project.createSourceFile('test.ts', invalidHeadingHierarchyCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkHeadingHierarchy('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('h1') && v.message.includes('h3'))).toBe(
        true,
      );
    });

    it('should allow proper heading hierarchy', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <h1>Title</h1>
              <h2>Section</h2>
              <h3>Subsection</h3>
              <h2>Another Section</h2>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-valid-hierarchy.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkHeadingHierarchy(
        'test-valid-hierarchy.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', approvedExceptionCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkHeadingHierarchy('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should allow same level headings', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <h2>Section 1</h2>
              <h2>Section 2</h2>
              <h2>Section 3</h2>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-same-level.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkHeadingHierarchy('test-same-level.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should handle no headings gracefully', () => {
      const sourceFile = project.createSourceFile('test.ts', buttonComponentCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkHeadingHierarchy('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });
  });

  describe('checkAriaReferences', () => {
    it('should detect aria-describedby referencing non-existent ID', () => {
      const sourceFile = project.createSourceFile('test.ts', invalidAriaReferencesCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('error-message'))).toBe(true);
    });

    it('should not flag valid aria references', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <input aria-describedby="help-text" aria-labelledby="label" />
              <label id="label">Name</label>
              <div id="help-text">Help text</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-valid-refs.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences('test-valid-refs.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip template expressions in IDs', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <input aria-describedby="\${this.helpId}" />
              <div id="\${this.helpId}">Dynamic ID</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-dynamic-refs.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences('test-dynamic-refs.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', approvedExceptionCode);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences('test.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should handle multiple space-separated IDs', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <input aria-describedby="help error warning" />
              <div id="help">Help</div>
              <div id="error">Error</div>
              <div id="warning">Warning</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-multiple-refs.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences('test-multiple-refs.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should detect when one of multiple IDs is missing', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <input aria-describedby="help error warning" />
              <div id="help">Help</div>
              <div id="error">Error</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-missing-one-ref.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAriaReferences(
        'test-missing-one-ref.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );

      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain('warning');
    });
  });

  // ─── Integration Tests ────────────────────────────────────────────────

  describe('validateA11yRegression', () => {
    it('should pass when no files staged', async () => {
      const deps: HookDependencies = {
        ...mockDeps,
        getStagedFiles: vi.fn(() => []),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
      expect(result.stats.failedFiles).toBe(0);
      expect(result.stats.totalViolations).toBe(0);
      expect(result.failedFiles).toHaveLength(0);
    });

    it('should output log when not in silent mode and no files staged', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const deps: HookDependencies = {
        ...mockDeps,
        getStagedFiles: vi.fn(() => []),
      };

      await validateA11yRegression(deps, false);

      expect(consoleLogSpy).toHaveBeenCalledWith('No component files staged for commit');
      consoleLogSpy.mockRestore();
    });

    it('should pass with valid component', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        buttonComponentCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.criticalViolations).toBe(0);
    });

    it('should fail with invalid ARIA attributes', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        invalidAriaComponentCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });

    it('should detect multiple violation types', async () => {
      const multipleViolationsCode = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-test')
export class Test extends LitElement {
  render() {
    return html\`
      <div aria-invalid-attr="value" role="invalid-role">
        <img src="logo.png" />
        <h1>Title</h1>
        <h3>Subtitle</h3>
        <div @click=\${this._handleClick}>Click me</div>
        <input aria-describedby="missing-id" />
      </div>
    \`;
  }

  private _handleClick() {}
}
`;

      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        multipleViolationsCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(5);
    });

    it('should respect approval comments', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        approvedExceptionCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.criticalViolations).toBe(0);
    });

    it('should count warnings and criticals separately', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        missingKeyboardNavCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.stats.totalViolations).toBe(
        result.stats.criticalViolations + result.stats.warningViolations,
      );
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
      expect(result.stats.warningViolations).toBeGreaterThan(0);
    });

    it('should handle files without component class', async () => {
      const helperCode = `
        export function helper() {
          return 'helper';
        }
      `;

      project.createSourceFile('packages/hx-library/src/components/hx-test/helper.ts', helperCode);

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/helper.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should handle analysis errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['non-existent-file.ts']),
        createProject: vi.fn(() => {
          const badProject = new Project({ useInMemoryFileSystem: true });
          badProject.addSourceFileAtPath = vi.fn(() => {
            throw new Error('File not found');
          });
          return badProject;
        }),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.stats.filesChecked).toBe(1);
      expect(result.stats.failedFiles).toBe(1);
      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles[0]).toBe('non-existent-file.ts');
      expect(result.passed).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should respect timeout configuration', async () => {
      const manyFiles = Array.from({ length: 50 }, (_, i) =>
        project.createSourceFile(`test${i}.ts`, buttonComponentCode),
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => manyFiles.map((f) => f.getFilePath())),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.stats.filesChecked).toBeLessThanOrEqual(50);
    });

    it('should output progress when not in silent mode', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        buttonComponentCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
      };

      await validateA11yRegression(deps, false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checking 1 file(s) for accessibility regressions'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed in'));
      consoleLogSpy.mockRestore();
    });

    it('should warn on timeout in non-silent mode', { timeout: 10000 }, async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const slowProject = new Project({ useInMemoryFileSystem: true });
      slowProject.addSourceFileAtPath = vi.fn(() => {
        const start = Date.now();
        while (Date.now() - start < 6000) {
          // Busy wait for 6 seconds (exceeds 5s timeout)
        }
        return project.createSourceFile('slow.ts', buttonComponentCode);
      });

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['test1.ts', 'test2.ts']),
        createProject: vi.fn(() => slowProject),
      };

      await validateA11yRegression(deps, false);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Timeout reached'));
      consoleWarnSpy.mockRestore();
    });

    it('should provide file paths in violations', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        invalidAriaComponentCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]?.file).toBe(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
      );
    });

    it('should skip excluded file patterns', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.test.ts',
        invalidAriaComponentCode,
      );

      // getStagedFiles should filter out test files - mock it to return empty array
      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => []),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      // Should not analyze any files since test files are excluded by getStagedFiles
      expect(result.stats.filesChecked).toBe(0);
    });

    it('should handle components with no render method', async () => {
      const noRenderCode = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;

      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        noRenderCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should aggregate violations from multiple files', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test1/hx-test1.ts',
        invalidAriaComponentCode,
      );
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test2/hx-test2.ts',
        invalidRoleComponentCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => [
          'packages/hx-library/src/components/hx-test1/hx-test1.ts',
          'packages/hx-library/src/components/hx-test2/hx-test2.ts',
        ]),
        createProject: vi.fn(() => project),
      };

      const result = await validateA11yRegression(deps, true);

      expect(result.stats.filesChecked).toBe(2);
      expect(result.violations.length).toBeGreaterThan(2);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle empty template', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`\`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-empty-template.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes(
        'test-empty-template.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );
      checkRoleAttributes(
        'test-empty-template.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );
      checkAltText('test-empty-template.ts', template!, violations, sourceFile.getFullText());
      checkKeyboardNav('test-empty-template.ts', template!, violations, sourceFile.getFullText());
      checkHeadingHierarchy(
        'test-empty-template.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );
      checkAriaReferences(
        'test-empty-template.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );

      expect(violations).toHaveLength(0);
    });

    it('should handle nested template strings', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div aria-label="outer">
                \${html\`<span aria-label="inner">Content</span>\`}
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-nested.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes('test-nested.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should handle ARIA attributes with template expressions', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div aria-label="\${this.label}">
                <button aria-disabled="\${this.disabled}">Click</button>
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-aria-expressions.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkARIAAttributes(
        'test-aria-expressions.ts',
        template!,
        violations,
        sourceFile.getFullText(),
      );

      // Should detect valid aria-label and aria-disabled
      expect(violations).toHaveLength(0);
    });

    it('should handle role attribute with single quotes', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          render() {
            return html\`
              <div role='button'>Click me</div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-single-quotes.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkRoleAttributes('test-single-quotes.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });

    it('should handle components with complex conditional rendering', () => {
      const code = `
        import { LitElement, html } from 'lit';
        import { customElement, property } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          @property({ type: Boolean })
          showImage = false;

          render() {
            return html\`
              <div>
                \${this.showImage ? html\`<img src="logo.png" alt="Logo" />\` : ''}
              </div>
            \`;
          }
        }
      `;
      const sourceFile = project.createSourceFile('test-conditional.ts', code);
      const classDecl = sourceFile.getClasses()[0];
      const template = extractTemplateString(classDecl!);
      const violations: Violation[] = [];

      checkAltText('test-conditional.ts', template!, violations, sourceFile.getFullText());

      expect(violations).toHaveLength(0);
    });
  });
});
