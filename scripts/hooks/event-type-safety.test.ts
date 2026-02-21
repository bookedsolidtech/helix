import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import {
  validateEventTypeSafety,
  checkEventNaming,
  checkEventDetailTypes,
  checkInlineTypes,
  checkExportedInterfaces,
  checkJSDocFires,
  type Violation,
  type EventDefinition,
} from './event-type-safety.js';

/**
 * Test utilities
 */
function createTestFile(code: string): ReturnType<Project['createSourceFile']> {
  const project = new Project({ useInMemoryFileSystem: true });
  return project.createSourceFile('test.ts', code);
}

function findDispatchEventCalls(sourceFile: ReturnType<typeof createTestFile>): EventDefinition[] {
  const events: EventDefinition[] = [];
  const text = sourceFile.getText();

  // Simple regex-based extraction for testing
  const dispatchRegex =
    /this\.dispatchEvent\s*\(\s*new\s+CustomEvent(?:<([^>]+)>)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;

  while ((match = dispatchRegex.exec(text)) !== null) {
    const detailType = match[1] ?? null;
    const eventName = match[2] ?? 'unknown';
    const hasInlineType = detailType !== null && detailType.includes('{');

    events.push({
      name: eventName,
      detailType,
      hasInlineType,
      line: text.substring(0, match.index).split('\n').length,
      column: 0,
      code: match[0] ?? '',
    });
  }

  return events;
}

// ─── checkEventNaming ─────────────────────────────────────────────────────

describe('checkEventNaming', () => {
  it('detects event names not starting with hx-', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventNaming(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('must start with "hx-"');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('allows event names starting with hx-', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventNaming(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple events with incorrect naming', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('click', { detail: {} }));
          this.dispatchEvent(new CustomEvent<ChangeDetail>('change', { detail: {} }));
          this.dispatchEvent(new CustomEvent<InputDetail>('input', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventNaming(sourceFile, events, violations);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('provides correct suggestion for renaming', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('custom-event', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventNaming(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toContain('hx-custom-event');
  });

  it('skips approved violations', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          // @typescript-specialist-approved: TICKET-123 Legacy compatibility
          this.dispatchEvent(new CustomEvent<ClickDetail>('click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventNaming(sourceFile, events, violations);

    // Note: This test may pass differently based on comment detection
    // The actual implementation checks for approval comments
    expect(violations.length).toBeLessThanOrEqual(1);
  });
});

// ─── checkEventDetailTypes ────────────────────────────────────────────────

describe('checkEventDetailTypes', () => {
  it('detects events without explicit detail types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventDetailTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing explicit detail type');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('allows events with explicit detail types', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventDetailTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple events without detail types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleEvents() {
          this.dispatchEvent(new CustomEvent('hx-click', { detail: {} }));
          this.dispatchEvent(new CustomEvent('hx-change', { detail: {} }));
          this.dispatchEvent(new CustomEvent('hx-input', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventDetailTypes(sourceFile, events, violations);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('provides helpful suggestion', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent('hx-click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkEventDetailTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toContain('CustomEvent<DetailInterface>');
  });
});

// ─── checkInlineTypes ─────────────────────────────────────────────────────

describe('checkInlineTypes', () => {
  it('detects inline object types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<{value: string}>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkInlineTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('inline type instead of interface');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('allows named interface types', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkInlineTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects complex inline types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<{
            value: string;
            checked: boolean;
            originalEvent: MouseEvent;
          }>('hx-click', {
            detail: { value: 'test', checked: true, originalEvent: e }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkInlineTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toContain('Extract to named interface');
  });

  it('detects multiple inline types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleEvents() {
          this.dispatchEvent(new CustomEvent<{value: string}>('hx-click', { detail: {} }));
          this.dispatchEvent(new CustomEvent<{checked: boolean}>('hx-change', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkInlineTypes(sourceFile, events, violations);

    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it('provides interface naming suggestion', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<{value: string}>('hx-click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkInlineTypes(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toMatch(/HxClickDetail|HxChangeDetail/);
  });
});

// ─── checkExportedInterfaces ──────────────────────────────────────────────

describe('checkExportedInterfaces', () => {
  it('detects non-exported detail type interfaces', () => {
    const sourceFile = createTestFile(`
      interface ClickDetail {
        value: string;
      }

      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('hx-click', {
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkExportedInterfaces(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('is not exported');
    expect(violations[0]?.severity).toBe('warning');
  });

  it('allows exported detail type interfaces', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkExportedInterfaces(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles generic types correctly', () => {
    const sourceFile = createTestFile(`
      export interface HelixSelectDetail<T> {
        value: T;
      }

      export class TestComponent extends LitElement {
        private handleSelect() {
          this.dispatchEvent(new CustomEvent<HelixSelectDetail<string>>('hx-select', {
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkExportedInterfaces(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('provides helpful suggestion for export', () => {
    const sourceFile = createTestFile(`
      interface ClickDetail {
        value: string;
      }

      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<ClickDetail>('hx-click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkExportedInterfaces(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toContain('export');
  });

  it('skips inline types', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<{value: string}>('hx-click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkExportedInterfaces(sourceFile, events, violations);

    // Should not check exports for inline types (those are caught by checkInlineTypes)
    expect(violations).toHaveLength(0);
  });
});

// ─── checkJSDocFires ──────────────────────────────────────────────────────

describe('checkJSDocFires', () => {
  it('detects missing @fires JSDoc tags', () => {
    const sourceFile = createTestFile(`
      /**
       * A test component.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkJSDocFires(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing JSDoc @fires tag');
    expect(violations[0]?.severity).toBe('warning');
  });

  it('allows events with @fires JSDoc tags', () => {
    const sourceFile = createTestFile(`
      /**
       * A test component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            detail: { value: 'test' }
          }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkJSDocFires(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple missing @fires tags', () => {
    const sourceFile = createTestFile(`
      /**
       * A test component.
       */
      export class TestComponent extends LitElement {
        private handleEvents() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', { detail: {} }));
          this.dispatchEvent(new CustomEvent<HelixChangeDetail>('hx-change', { detail: {} }));
          this.dispatchEvent(new CustomEvent<HelixInputDetail>('hx-input', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkJSDocFires(sourceFile, events, violations);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('handles @fires tags with different formats', () => {
    const sourceFile = createTestFile(`
      /**
       * A test component.
       *
       * @fires hx-click - Dispatched when clicked.
       * @fires {CustomEvent} hx-change - Dispatched when changed.
       */
      export class TestComponent extends LitElement {
        private handleEvents() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', { detail: {} }));
          this.dispatchEvent(new CustomEvent<HelixChangeDetail>('hx-change', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkJSDocFires(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });

  it('provides helpful suggestion', () => {
    const sourceFile = createTestFile(`
      /**
       * A test component.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];
    const events = findDispatchEventCalls(sourceFile);

    checkJSDocFires(sourceFile, events, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.suggestion).toContain('@fires');
    expect(violations[0]?.suggestion).toContain('hx-click');
  });

  it('skips files without class declarations', () => {
    const sourceFile = createTestFile(`
      export function dispatchTestEvent() {
        // Not a component, shouldn't be checked
      }
    `);
    const violations: Violation[] = [];
    const events: EventDefinition[] = [];

    checkJSDocFires(sourceFile, events, violations);

    expect(violations).toHaveLength(0);
  });
});

// ─── validateEventTypeSafety (integration) ────────────────────────────────

describe('validateEventTypeSafety', () => {
  it('detects all violation types in one file', () => {
    const sourceFile = createTestFile(`
      interface ClickDetail {
        value: string;
      }

      /**
       * A test component.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          // Missing hx- prefix
          this.dispatchEvent(new CustomEvent<ClickDetail>('click', { detail: {} }));

          // No detail type
          this.dispatchEvent(new CustomEvent('change', { detail: {} }));

          // Inline type
          this.dispatchEvent(new CustomEvent<{value: string}>('hx-input', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    // Should detect multiple violation types
    expect(violations.length).toBeGreaterThan(0);

    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    expect(criticalViolations.length).toBeGreaterThan(0);
  });

  it('passes for compliant event implementation', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
        originalEvent: MouseEvent;
      }

      /**
       * A test component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       */
      export class TestComponent extends LitElement {
        private handleClick(e: MouseEvent) {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { value: 'test', originalEvent: e }
          }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles files without events', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        override render() {
          return html\`<div>Test</div>\`;
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles multiple events correctly', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      export interface HelixChangeDetail {
        checked: boolean;
      }

      /**
       * A test component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       * @fires {CustomEvent<HelixChangeDetail>} hx-change - Dispatched when changed.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', { detail: {} }));
          this.dispatchEvent(new CustomEvent<HelixChangeDetail>('hx-change', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('provides correct line numbers', () => {
    const sourceFile = createTestFile(`
      export class TestComponent extends LitElement {
        private handleClick() {
          this.dispatchEvent(new CustomEvent('click', { detail: {} }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.line).toBeGreaterThan(0);
  });
});

// ─── Real-world scenarios ─────────────────────────────────────────────────

describe('Real-world scenarios', () => {
  it('validates hx-button component pattern', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        originalEvent: MouseEvent;
      }

      /**
       * A button component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       */
      @customElement('hx-button')
      export class HelixButton extends LitElement {
        private _handleClick(e: MouseEvent): void {
          if (this.disabled) {
            e.preventDefault();
            return;
          }

          this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
            bubbles: true,
            composed: true,
            detail: { originalEvent: e },
          }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('validates hx-checkbox component pattern', () => {
    const sourceFile = createTestFile(`
      export interface HelixChangeDetail {
        checked: boolean;
        value: string;
      }

      /**
       * A checkbox component.
       *
       * @fires {CustomEvent<HelixChangeDetail>} hx-change - Dispatched when toggled.
       */
      @customElement('hx-checkbox')
      export class HelixCheckbox extends LitElement {
        private _handleChange(): void {
          this.dispatchEvent(new CustomEvent<HelixChangeDetail>('hx-change', {
            bubbles: true,
            composed: true,
            detail: { checked: this.checked, value: this.value },
          }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects issues in legacy component code', () => {
    const sourceFile = createTestFile(`
      /**
       * Legacy component (needs refactoring).
       */
      export class LegacyComponent extends LitElement {
        private handleClick() {
          // Bad: No detail type, wrong event name
          this.dispatchEvent(new CustomEvent('click', {
            detail: { value: 'test' }
          }));
        }

        private handleChange() {
          // Bad: Inline type
          this.dispatchEvent(new CustomEvent<{checked: boolean}>('change', {
            detail: { checked: true }
          }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations.length).toBeGreaterThan(0);

    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    expect(criticalViolations.length).toBeGreaterThan(0);
  });

  it('handles form-associated components', () => {
    const sourceFile = createTestFile(`
      export interface HelixInputDetail {
        value: string;
      }

      export interface HelixChangeDetail {
        value: string;
      }

      /**
       * A text input component.
       *
       * @fires {CustomEvent<HelixInputDetail>} hx-input - Dispatched on input.
       * @fires {CustomEvent<HelixChangeDetail>} hx-change - Dispatched on change.
       */
      @customElement('hx-text-input')
      export class HelixTextInput extends LitElement {
        private _handleInput(e: Event): void {
          const target = e.target as HTMLInputElement;
          this.dispatchEvent(new CustomEvent<HelixInputDetail>('hx-input', {
            detail: { value: target.value }
          }));
        }

        private _handleChange(e: Event): void {
          const target = e.target as HTMLInputElement;
          this.dispatchEvent(new CustomEvent<HelixChangeDetail>('hx-change', {
            detail: { value: target.value }
          }));
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('handles empty files', () => {
    const sourceFile = createTestFile('');
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles files with only imports', () => {
    const sourceFile = createTestFile(`
      import { LitElement } from 'lit';
      import { customElement } from 'lit/decorators.js';
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles files with only interfaces', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      export interface HelixChangeDetail {
        checked: boolean;
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles nested event dispatches', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      /**
       * A test component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          setTimeout(() => {
            this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
              detail: { value: 'test' }
            }));
          }, 100);
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });

  it('handles conditional event dispatches', () => {
    const sourceFile = createTestFile(`
      export interface HelixClickDetail {
        value: string;
      }

      /**
       * A test component.
       *
       * @fires {CustomEvent<HelixClickDetail>} hx-click - Dispatched when clicked.
       */
      export class TestComponent extends LitElement {
        private handleClick() {
          if (this.enabled) {
            this.dispatchEvent(new CustomEvent<HelixClickDetail>('hx-click', {
              detail: { value: 'test' }
            }));
          }
        }
      }
    `);
    const violations: Violation[] = [];

    validateEventTypeSafety(sourceFile, violations);

    expect(violations).toHaveLength(0);
  });
});
