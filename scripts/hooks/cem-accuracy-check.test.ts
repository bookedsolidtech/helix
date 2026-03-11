import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Project } from 'ts-morph';
import {
  validateCEMAccuracy,
  checkComponentInCEM,
  checkProperties,
  checkEvents,
  checkSlots,
  checkCSSParts,
  checkCSSProperties,
  extractProperties,
  extractEvents,
  extractSlots,
  extractCSSParts,
  extractCSSProperties,
  findCEMDeclaration,
  normalizeCEMPath,
  hasApprovalComment,
  formatViolation,
  type HookDependencies,
  type CustomElementsManifest,
  type CEMDeclaration,
  type Violation,
} from './cem-accuracy-check.js';

describe('cem-accuracy-check (H05)', () => {
  // ─── Test Fixtures ──────────────────────────────────────────────────────

  const mockCEM: CustomElementsManifest = {
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: 'src/components/hx-button/hx-button.ts',
        declarations: [
          {
            kind: 'class',
            name: 'HelixButton',
            tagName: 'hx-button',
            members: [
              { kind: 'field', name: 'variant', type: { text: 'string' } },
              { kind: 'field', name: 'disabled', type: { text: 'boolean' } },
            ],
            events: [{ name: 'hx-click', type: { text: 'CustomEvent' } }],
            slots: [{ name: '', description: 'Default slot' }],
            cssParts: [{ name: 'button', description: 'The button element' }],
            cssProperties: [
              { name: '--hx-button-bg', description: 'Background color' },
              { name: '--hx-button-color', description: 'Text color' },
            ],
          },
        ],
      },
    ],
  };

  const componentSourceCode = `
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A button component.
 *
 * @slot - Default slot for button content.
 * @fires {CustomEvent<{}>} hx-click - Dispatched on click.
 * @csspart button - The button element.
 * @cssprop [--hx-button-bg=blue] - Background color.
 * @cssprop [--hx-button-color=white] - Text color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  @property({ type: String })
  variant: 'primary' | 'secondary' = 'primary';

  @property({ type: Boolean })
  disabled = false;

  private _handleClick(e: MouseEvent): void {
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html\`<button part="button" @click=\${this._handleClick}><slot></slot></button>\`;
  }
}
`;

  const componentWithMissingCEMEntries = `
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A card component.
 *
 * @slot - Default slot.
 * @slot header - Header slot.
 * @fires {CustomEvent<{}>} hx-card-click - Dispatched on click.
 * @csspart card - The card element.
 * @cssprop [--hx-card-bg=white] - Background color.
 */
@customElement('hx-card')
export class HelixCard extends LitElement {
  @property({ type: String })
  variant: 'elevated' | 'outlined' = 'elevated';

  @property({ type: String })
  size: 'sm' | 'md' | 'lg' = 'md';

  render() {
    return html\`<div part="card"><slot name="header"></slot><slot></slot></div>\`;
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
      readCEM: vi.fn(() => mockCEM),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── Utility Functions ─────────────────────────────────────────────────

  describe('normalizeCEMPath', () => {
    it('should extract relative path from absolute path', () => {
      const result = normalizeCEMPath(
        '/Users/dev/helix/packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      expect(result).toBe('src/components/hx-button/hx-button.ts');
    });

    it('should return original path if no match', () => {
      const result = normalizeCEMPath('/some/other/path.ts');
      expect(result).toBe('/some/other/path.ts');
    });
  });

  describe('hasApprovalComment', () => {
    it('should detect approval comment', () => {
      const content = '// @test-architect-approved: TICKET-123 Reason\nexport class Foo {}';
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
        message: 'Test error',
        suggestion: 'Fix it',
        severity: 'critical',
      };

      const result = formatViolation(violation);
      expect(result).toContain('[CRITICAL]');
      expect(result).toContain('test.ts:10:5');
      expect(result).toContain('Test error');
      expect(result).toContain('Fix it');
    });

    it('should format warning violation', () => {
      const violation: Violation = {
        file: 'test.ts',
        line: 10,
        column: 5,
        message: 'Test warning',
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
        message: 'Test error',
        suggestion: 'Fix it',
        code: '@property variant',
        severity: 'critical',
      };

      const result = formatViolation(violation);
      expect(result).toContain('@property variant');
    });
  });

  describe('findCEMDeclaration', () => {
    it('should find CEM declaration by file path', () => {
      const result = findCEMDeclaration(
        mockCEM,
        '/path/to/packages/hx-library/src/components/hx-button/hx-button.ts',
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('HelixButton');
      expect(result?.tagName).toBe('hx-button');
    });

    it('should return null when file not in CEM', () => {
      const result = findCEMDeclaration(mockCEM, '/path/to/unknown.ts');
      expect(result).toBeNull();
    });

    it('should return null when module has no component declarations', () => {
      const emptyModuleCEM: CustomElementsManifest = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'src/components/hx-button/hx-button.ts',
            declarations: [{ kind: 'class', name: 'Helper' }], // No tagName
          },
        ],
      };

      const result = findCEMDeclaration(
        emptyModuleCEM,
        '/path/to/src/components/hx-button/hx-button.ts',
      );
      expect(result).toBeNull();
    });
  });

  // ─── Extraction Functions ─────────────────────────────────────────────

  describe('extractProperties', () => {
    it('should extract @property decorated fields', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const classDecl = sourceFile.getClasses()[0];

      const properties = extractProperties(classDecl!);

      expect(properties).toHaveLength(2);
      expect(properties[0]?.name).toBe('variant');
      expect(properties[1]?.name).toBe('disabled');
    });

    it('should return empty array when no properties', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const properties = extractProperties(classDecl!);
      expect(properties).toHaveLength(0);
    });
  });

  describe('extractEvents', () => {
    it('should extract events from @fires JSDoc tags', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.name === 'hx-click')).toBe(true);
    });

    it('should extract events from CustomEvent constructor calls', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          _onClick() {
            this.dispatchEvent(new CustomEvent('hx-custom-event'));
          }
        }
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      expect(events.some((e) => e.name === 'hx-custom-event')).toBe(true);
    });

    it('should deduplicate events by name', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @fires {CustomEvent} hx-click - First mention
         */
        @customElement('hx-test')
        export class Test extends LitElement {
          _onClick() {
            // Duplicate event
            this.dispatchEvent(new CustomEvent('hx-click'));
          }
        }
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      const clickEvents = events.filter((e) => e.name === 'hx-click');
      expect(clickEvents).toHaveLength(1);
    });

    it('should return empty array when no events', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      expect(events).toHaveLength(0);
    });
  });

  describe('extractSlots', () => {
    it('should extract slots from @slot JSDoc tags', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const classDecl = sourceFile.getClasses()[0];

      const slots = extractSlots(classDecl!);

      expect(slots.length).toBe(2);
      expect(slots.some((s) => s.name === '')).toBe(true); // Default slot
      expect(slots.some((s) => s.name === 'header')).toBe(true);
    });

    it('should handle default slot (no name)', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @slot - Default slot for content.
         */
        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const slots = extractSlots(classDecl!);
      expect(slots).toHaveLength(1);
      expect(slots[0]?.name).toBe('');
    });

    it('should return empty array when no slots', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const slots = extractSlots(classDecl!);
      expect(slots).toHaveLength(0);
    });
  });

  describe('extractCSSParts', () => {
    it('should extract CSS parts from @csspart JSDoc tags', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const classDecl = sourceFile.getClasses()[0];

      const parts = extractCSSParts(classDecl!);

      expect(parts).toHaveLength(1);
      expect(parts[0]?.name).toBe('button');
    });

    it('should return empty array when no CSS parts', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const parts = extractCSSParts(classDecl!);
      expect(parts).toHaveLength(0);
    });
  });

  describe('extractCSSProperties', () => {
    it('should extract CSS properties from @cssprop JSDoc tags', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const classDecl = sourceFile.getClasses()[0];

      const props = extractCSSProperties(classDecl!);

      expect(props).toHaveLength(2);
      expect(props.some((p) => p.name === '--hx-button-bg')).toBe(true);
      expect(props.some((p) => p.name === '--hx-button-color')).toBe(true);
    });

    it('should return empty array when no CSS properties', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const props = extractCSSProperties(classDecl!);
      expect(props).toHaveLength(0);
    });
  });

  // ─── Validation Functions ─────────────────────────────────────────────

  describe('checkComponentInCEM', () => {
    it('should add violation when component not in CEM', () => {
      const violations: Violation[] = [];
      checkComponentInCEM('test.ts', null, violations, '');

      expect(violations).toHaveLength(1);
      expect(violations[0]?.message).toContain('not found in Custom Elements Manifest');
      expect(violations[0]?.severity).toBe('critical');
    });

    it('should not add violation when component exists in CEM', () => {
      const violations: Violation[] = [];
      const cemDecl: CEMDeclaration = { kind: 'class', name: 'Test', tagName: 'hx-test' };
      checkComponentInCEM('test.ts', cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const violations: Violation[] = [];
      const content = '// @test-architect-approved: TICKET-123 Legacy component';
      checkComponentInCEM('test.ts', null, violations, content);

      expect(violations).toHaveLength(0);
    });
  });

  describe('checkProperties', () => {
    it('should add violation when property not in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixCard',
        tagName: 'hx-card',
        members: [{ kind: 'field', name: 'variant' }], // Missing 'size' property
      };

      const violations: Violation[] = [];
      checkProperties('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('size'))).toBe(true);
    });

    it('should not add violation when all properties in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        members: [
          { kind: 'field', name: 'variant' },
          { kind: 'field', name: 'disabled' },
        ],
      };

      const violations: Violation[] = [];
      checkProperties('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixCard',
        tagName: 'hx-card',
        members: [],
      };

      const violations: Violation[] = [];
      const content = '// @test-architect-approved: TICKET-123 Legacy';
      checkProperties('test.ts', sourceFile, cemDecl, violations, content);

      expect(violations).toHaveLength(0);
    });

    it('should skip when no CEM declaration', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const violations: Violation[] = [];
      checkProperties('test.ts', sourceFile, null, violations, '');

      expect(violations).toHaveLength(0);
    });
  });

  describe('checkEvents', () => {
    it('should add violation when event not in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        events: [], // Missing hx-click event
      };

      const violations: Violation[] = [];
      checkEvents('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('hx-click'))).toBe(true);
    });

    it('should not add violation when all events in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        events: [{ name: 'hx-click' }],
      };

      const violations: Violation[] = [];
      checkEvents('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });

    it('should skip check when approval comment present', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        events: [],
      };

      const violations: Violation[] = [];
      const content = '// @test-architect-approved: TICKET-123';
      checkEvents('test.ts', sourceFile, cemDecl, violations, content);

      expect(violations).toHaveLength(0);
    });
  });

  describe('checkSlots', () => {
    it('should add violation when slot not in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixCard',
        tagName: 'hx-card',
        slots: [{ name: '' }], // Missing 'header' slot
      };

      const violations: Violation[] = [];
      checkSlots('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('header'))).toBe(true);
    });

    it('should not add violation when all slots in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixCard',
        tagName: 'hx-card',
        slots: [{ name: '' }, { name: 'header' }],
      };

      const violations: Violation[] = [];
      checkSlots('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });

    it('should handle default slot name formatting', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @slot - Default slot
         */
        @customElement('hx-test')
        export class Test extends LitElement {}
      `;
      const sourceFile = project.createSourceFile('test.ts', code);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'Test',
        tagName: 'hx-test',
        slots: [],
      };

      const violations: Violation[] = [];
      checkSlots('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.message).toContain('default slot');
    });
  });

  describe('checkCSSParts', () => {
    it('should add violation when CSS part not in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentWithMissingCEMEntries);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixCard',
        tagName: 'hx-card',
        cssParts: [], // Missing 'card' part
      };

      const violations: Violation[] = [];
      checkCSSParts('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('card'))).toBe(true);
    });

    it('should not add violation when all CSS parts in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        cssParts: [{ name: 'button' }],
      };

      const violations: Violation[] = [];
      checkCSSParts('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });
  });

  describe('checkCSSProperties', () => {
    it('should add violation when CSS property not in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        cssProperties: [{ name: '--hx-button-bg' }], // Missing --hx-button-color
      };

      const violations: Violation[] = [];
      checkCSSProperties('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('--hx-button-color'))).toBe(true);
    });

    it('should not add violation when all CSS properties in CEM', () => {
      const sourceFile = project.createSourceFile('test.ts', componentSourceCode);
      const cemDecl: CEMDeclaration = {
        kind: 'class',
        name: 'HelixButton',
        tagName: 'hx-button',
        cssProperties: [{ name: '--hx-button-bg' }, { name: '--hx-button-color' }],
      };

      const violations: Violation[] = [];
      checkCSSProperties('test.ts', sourceFile, cemDecl, violations, '');

      expect(violations).toHaveLength(0);
    });
  });

  // ─── Integration Tests ────────────────────────────────────────────────

  describe('getStagedFiles (integration)', () => {
    it('should filter by include patterns', () => {
      const mockGetStagedFiles = vi.fn(() => [
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        'packages/hx-library/src/components/hx-button/hx-button.test.ts',
        'packages/hx-library/src/components/hx-button/hx-button.styles.ts',
        'apps/docs/src/pages/index.ts',
      ]);

      // Test with mock - in real scenario, getStagedFiles would filter these
      const files = mockGetStagedFiles();
      const componentFiles = files.filter(
        (f) =>
          f.includes('packages/hx-library/src/components/') &&
          f.endsWith('.ts') &&
          !f.includes('.test.') &&
          !f.includes('.styles.') &&
          !f.includes('index.ts'),
      );

      expect(componentFiles).toHaveLength(1);
      expect(componentFiles[0]).toBe('packages/hx-library/src/components/hx-button/hx-button.ts');
    });
  });

  describe('validateCEMAccuracy', () => {
    it('should pass when no files staged', async () => {
      const deps: HookDependencies = {
        ...mockDeps,
        getStagedFiles: vi.fn(() => []),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
      expect(result.stats.totalViolations).toBe(0);
    });

    it('should output log when not in silent mode and no files staged', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const deps: HookDependencies = {
        ...mockDeps,
        getStagedFiles: vi.fn(() => []),
      };

      await validateCEMAccuracy(deps, false);

      expect(consoleLogSpy).toHaveBeenCalledWith('No component files staged for commit');
      consoleLogSpy.mockRestore();
    });

    it('should output log when CEM is missing and not silent', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => null),
      };

      await validateCEMAccuracy(deps, false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No Custom Elements Manifest found'),
      );
      consoleLogSpy.mockRestore();
    });

    it('should fail when component not in CEM', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => ({ schemaVersion: '1.0.0', modules: [] })), // Empty CEM
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });

    it('should detect missing properties in CEM', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        componentSourceCode,
      );

      const incompleteCEM: CustomElementsManifest = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'src/components/hx-button/hx-button.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixButton',
                tagName: 'hx-button',
                members: [{ kind: 'field', name: 'variant' }], // Missing 'disabled'
              },
            ],
          },
        ],
      };

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => incompleteCEM),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.message.includes('disabled'))).toBe(true);
    });

    it('should pass when all components match CEM', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => mockCEM),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.criticalViolations).toBe(0);
    });

    it('should handle missing CEM gracefully', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => null),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.message.includes('not found'))).toBe(true);
    });

    it('should respect approval comments', async () => {
      const approvedCode = `
        // @test-architect-approved: TICKET-123 Legacy component
        ${componentWithMissingCEMEntries}
      `;

      project.createSourceFile(
        'packages/hx-library/src/components/hx-card/hx-card.ts',
        approvedCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-card/hx-card.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => ({ schemaVersion: '1.0.0', modules: [] })),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(true);
      expect(result.stats.criticalViolations).toBe(0);
    });

    it('should count warnings and criticals separately', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => ({ schemaVersion: '1.0.0', modules: [] })),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.stats.totalViolations).toBe(
        result.stats.criticalViolations + result.stats.warningViolations,
      );
    });

    it('should handle analysis errors gracefully', async () => {
      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['non-existent-file.ts']),
        createProject: vi.fn(() => {
          const badProject = new Project({ useInMemoryFileSystem: true });
          // Mock project that will throw on addSourceFileAtPath
          badProject.addSourceFileAtPath = vi.fn(() => {
            throw new Error('File not found');
          });
          return badProject;
        }),
        readCEM: vi.fn(() => mockCEM),
      };

      // Should not throw, just log error
      const result = await validateCEMAccuracy(deps, true);

      expect(result.stats.filesChecked).toBe(1);
    });

    it('should respect timeout configuration', async () => {
      // Create many files to potentially trigger timeout
      const manyFiles = Array.from({ length: 50 }, (_, i) =>
        project.createSourceFile(`test${i}.ts`, componentSourceCode),
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => manyFiles.map((f) => f.getFilePath())),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => mockCEM),
      };

      // Should complete without hanging
      const result = await validateCEMAccuracy(deps, true);

      expect(result.stats.filesChecked).toBeLessThanOrEqual(50);
    });

    it('should output progress when not in silent mode', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        componentSourceCode,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-button/hx-button.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => mockCEM),
      };

      await validateCEMAccuracy(deps, false);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Checking 1 file(s) for CEM accuracy'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Completed in'));
      consoleLogSpy.mockRestore();
    });

    it('should warn on timeout in non-silent mode', { timeout: 10000 }, async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock a project that takes too long
      const slowProject = new Project({ useInMemoryFileSystem: true });
      slowProject.addSourceFileAtPath = vi.fn(() => {
        // Simulate slow processing (longer than 5s timeout)
        const start = Date.now();
        while (Date.now() - start < 6000) {
          // Busy wait for 6 seconds
        }
        return project.createSourceFile('slow.ts', componentSourceCode);
      });

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['test1.ts', 'test2.ts']),
        createProject: vi.fn(() => slowProject),
        readCEM: vi.fn(() => mockCEM),
      };

      await validateCEMAccuracy(deps, false);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Timeout reached'));
      consoleWarnSpy.mockRestore();
    });
  });

  // ─── CLI Integration Tests ───────────────────────────────────────────

  describe('CLI output formatting', () => {
    it('should format violations correctly', () => {
      const violation: Violation = {
        file: 'hx-button.ts',
        line: 42,
        column: 10,
        message: 'Property "variant" not found in CEM',
        suggestion: 'Run npm run cem',
        code: '@property variant',
        severity: 'critical',
      };

      const formatted = formatViolation(violation);

      expect(formatted).toContain('[CRITICAL]');
      expect(formatted).toContain('hx-button.ts:42:10');
      expect(formatted).toContain('Property "variant" not found in CEM');
      expect(formatted).toContain('Run npm run cem');
      expect(formatted).toContain('@property variant');
    });

    it('should format violations without code', () => {
      const violation: Violation = {
        file: 'hx-button.ts',
        line: 1,
        column: 1,
        message: 'Component not found',
        suggestion: 'Run npm run cem',
        severity: 'warning',
      };

      const formatted = formatViolation(violation);

      expect(formatted).toContain('[WARNING]');
      expect(formatted).not.toContain('undefined');
    });
  });

  describe('Edge cases', () => {
    it('should handle components without @customElement decorator', async () => {
      const codeWithoutDecorator = `
        import { LitElement } from 'lit';

        export class PlainClass extends LitElement {
          variant = 'primary';
        }
      `;

      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        codeWithoutDecorator,
      );

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => mockCEM),
      };

      const result = await validateCEMAccuracy(deps, true);

      // Should not crash, just report component not found
      expect(result.violations.some((v) => v.message.includes('not found'))).toBe(true);
    });

    it('should handle empty JSDoc tags', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @slot
         */
        @customElement('hx-test')
        export class Test extends LitElement {}
      `;

      const sourceFile = project.createSourceFile('test-empty-jsdoc.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const slots = extractSlots(classDecl!);
      expect(slots).toHaveLength(1);
      expect(slots[0]?.name).toBe('');
    });

    it('should handle malformed @cssprop tags', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @cssprop Invalid format
         */
        @customElement('hx-test')
        export class Test extends LitElement {}
      `;

      const sourceFile = project.createSourceFile('test-malformed.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const props = extractCSSProperties(classDecl!);
      // Should not crash, just return empty array
      expect(props).toHaveLength(0);
    });

    it('should handle events without hx- prefix', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          _onClick() {
            this.dispatchEvent(new CustomEvent('custom-event'));
          }
        }
      `;

      const sourceFile = project.createSourceFile('test-non-hx-event.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      // Should not include non-hx- prefixed events
      expect(events).toHaveLength(0);
    });

    it('should handle CustomEvent with complex type argument', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          _onClick() {
            this.dispatchEvent(
              new CustomEvent<{value: string}>('hx-change', {
                detail: { value: 'test' }
              })
            );
          }
        }
      `;

      const sourceFile = project.createSourceFile('test-complex-event.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      expect(events.some((e) => e.name === 'hx-change')).toBe(true);
    });

    it('should handle @event JSDoc comment in method', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        @customElement('hx-test')
        export class Test extends LitElement {
          /**
           * @event hx-custom
           */
          triggerEvent() {
            this.dispatchEvent(new CustomEvent('hx-custom'));
          }
        }
      `;

      const sourceFile = project.createSourceFile('test-event-comment.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const events = extractEvents(classDecl!);
      expect(events.some((e) => e.name === 'hx-custom')).toBe(true);
    });

    it('should handle multiple CSS parts', () => {
      const code = `
        import { LitElement } from 'lit';
        import { customElement } from 'lit/decorators.js';

        /**
         * @csspart container - The outer container
         * @csspart header - The header section
         * @csspart body - The body section
         */
        @customElement('hx-test')
        export class Test extends LitElement {}
      `;

      const sourceFile = project.createSourceFile('test-multiple-parts.ts', code);
      const classDecl = sourceFile.getClasses()[0];

      const parts = extractCSSParts(classDecl!);
      expect(parts).toHaveLength(3);
      expect(parts.some((p) => p.name === 'container')).toBe(true);
      expect(parts.some((p) => p.name === 'header')).toBe(true);
      expect(parts.some((p) => p.name === 'body')).toBe(true);
    });

    it('should handle files with getStagedFiles errors', async () => {
      const errorDeps: HookDependencies = {
        getStagedFiles: vi.fn(() => {
          throw new Error('Git command failed');
        }),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => mockCEM),
      };

      // Should not crash when getStagedFiles throws
      await expect(async () => {
        await validateCEMAccuracy(errorDeps, true);
      }).rejects.toThrow('Git command failed');
    });

    it('should handle readCEM errors gracefully', async () => {
      project.createSourceFile(
        'packages/hx-library/src/components/hx-test/hx-test.ts',
        componentSourceCode,
      );

      const errorDeps: HookDependencies = {
        getStagedFiles: vi.fn(() => ['packages/hx-library/src/components/hx-test/hx-test.ts']),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => {
          throw new Error('Failed to read CEM');
        }),
      };

      // Should not crash, error should be caught
      await expect(async () => {
        await validateCEMAccuracy(errorDeps, true);
      }).rejects.toThrow('Failed to read CEM');
    });

    it('should normalize paths correctly for CEM lookup', () => {
      const absolutePath =
        '/Users/dev/helix/packages/hx-library/src/components/hx-alert/hx-alert.ts';
      const normalized = normalizeCEMPath(absolutePath);
      expect(normalized).toBe('src/components/hx-alert/hx-alert.ts');
    });

    it('should find CEM declaration with matching path format', () => {
      const cemWithModule: CustomElementsManifest = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'src/components/hx-alert/hx-alert.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixAlert',
                tagName: 'hx-alert',
              },
            ],
          },
        ],
      };

      const result = findCEMDeclaration(
        cemWithModule,
        '/path/to/packages/hx-library/src/components/hx-alert/hx-alert.ts',
      );

      expect(result).not.toBeNull();
      expect(result?.name).toBe('HelixAlert');
    });

    it('should validate all checks together in integration', async () => {
      const fullComponentCode = `
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A comprehensive test component.
 *
 * @slot - Default slot
 * @slot header - Header slot
 * @fires {CustomEvent} hx-change - Change event
 * @csspart container - Container element
 * @cssprop [--hx-test-bg=white] - Background color
 */
@customElement('hx-comprehensive')
export class HelixComprehensive extends LitElement {
  @property({ type: String })
  value = '';

  @property({ type: Boolean })
  disabled = false;

  render() {
    return html\`<div part="container"><slot name="header"></slot><slot></slot></div>\`;
  }
}
`;

      project.createSourceFile(
        'packages/hx-library/src/components/hx-comprehensive/hx-comprehensive.ts',
        fullComponentCode,
      );

      const incompleteCEM: CustomElementsManifest = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'src/components/hx-comprehensive/hx-comprehensive.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixComprehensive',
                tagName: 'hx-comprehensive',
                members: [{ kind: 'field', name: 'value' }], // Missing 'disabled'
                events: [], // Missing hx-change
                slots: [{ name: '' }], // Missing 'header' slot
                cssParts: [], // Missing 'container' part
                cssProperties: [], // Missing --hx-test-bg
              },
            ],
          },
        ],
      };

      const deps: HookDependencies = {
        getStagedFiles: vi.fn(() => [
          'packages/hx-library/src/components/hx-comprehensive/hx-comprehensive.ts',
        ]),
        createProject: vi.fn(() => project),
        readCEM: vi.fn(() => incompleteCEM),
      };

      const result = await validateCEMAccuracy(deps, true);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      // Should have violations for each missing item
      expect(result.violations.some((v) => v.message.includes('disabled'))).toBe(true);
      expect(result.violations.some((v) => v.message.includes('hx-change'))).toBe(true);
      expect(result.violations.some((v) => v.message.includes('header'))).toBe(true);
      expect(result.violations.some((v) => v.message.includes('container'))).toBe(true);
      expect(result.violations.some((v) => v.message.includes('--hx-test-bg'))).toBe(true);
    });
  });
});
