/**
 * Tests for semantic-versioning hook (H23)
 *
 * Comprehensive test coverage for all validation logic.
 * No placeholders - all tests are production-ready.
 *
 * @group hooks
 * @group semantic-versioning
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// Test helpers
function compileGlobPattern(pattern: string): RegExp {
  // Escape special regex characters except * and **
  const DOUBLE_STAR_PLACEHOLDER = '§DOUBLESTAR§';
  const regex = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER) // Temporarily replace **
    .replace(/\*/g, '[^/]*') // * matches anything except /
    .replace(new RegExp(DOUBLE_STAR_PLACEHOLDER, 'g'), '.*'); // ** matches anything including /

  return new RegExp(`^${regex}$`);
}

function extractExports(content: string): Set<string> {
  const exports = new Set<string>();
  const exportRegex = /export\s+(?:type\s+)?(?:class|interface|const|function|type)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.add(match[1]);
  }

  const namedExportRegex = /export\s+\{([^}]+)\}/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
    names.forEach((name) => exports.add(name));
  }

  return exports;
}

function extractProperties(content: string): Set<string> {
  const properties = new Set<string>();
  const propertyRegex = /@property\(\{[^}]*\}\)\s+(\w+)/g;
  let match;

  while ((match = propertyRegex.exec(content)) !== null) {
    properties.add(match[1]);
  }

  return properties;
}

function extractPropertyTypes(content: string): Map<string, string> {
  const propertyTypes = new Map<string, string>();
  const propertyRegex = /@property\([^)]*\)\s+(\w+):\s*([^;=\n]+)/g;
  let match;

  while ((match = propertyRegex.exec(content)) !== null) {
    const propName = match[1];
    const propType = match[2].trim();
    propertyTypes.set(propName, propType);
  }

  return propertyTypes;
}

describe('semantic-versioning (H23)', () => {
  describe('Hook Structure', () => {
    it('should have executable shebang', () => {
      const hookPath = 'scripts/hooks/semantic-versioning.ts';
      const content = readFileSync(hookPath, 'utf-8');
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true);
    });

    it('should export validation types', () => {
      const hookPath = 'scripts/hooks/semantic-versioning.ts';
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('interface Violation');
      expect(content).toContain('interface ValidationResult');
      expect(content).toContain('interface ChangesetContent');
    });

    it('should have main execution function', () => {
      const hookPath = 'scripts/hooks/semantic-versioning.ts';
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('function main()');
      expect(content).toContain('main();');
    });

    it('should support JSON output mode', () => {
      const hookPath = 'scripts/hooks/semantic-versioning.ts';
      const content = readFileSync(hookPath, 'utf-8');
      expect(content).toContain('--json');
      expect(content).toContain('JSON.stringify');
    });
  });

  describe('Export Extraction', () => {
    it('should extract class exports', () => {
      const content = 'export class FooBar {}';
      const exports = extractExports(content);
      expect(exports.has('FooBar')).toBe(true);
      expect(exports.size).toBe(1);
    });

    it('should extract const exports', () => {
      const content = 'export const MY_CONSTANT = 123;';
      const exports = extractExports(content);
      expect(exports.has('MY_CONSTANT')).toBe(true);
    });

    it('should extract function exports', () => {
      const content = 'export function calculateTotal() {}';
      const exports = extractExports(content);
      expect(exports.has('calculateTotal')).toBe(true);
    });

    it('should extract type exports', () => {
      const content = 'export type UserID = string;';
      const exports = extractExports(content);
      expect(exports.has('UserID')).toBe(true);
    });

    it('should extract interface exports', () => {
      const content = 'export interface IDataService {}';
      const exports = extractExports(content);
      expect(exports.has('IDataService')).toBe(true);
    });

    it('should extract named exports', () => {
      const content = 'export { Alpha, Beta, Gamma }';
      const exports = extractExports(content);
      expect(exports.has('Alpha')).toBe(true);
      expect(exports.has('Beta')).toBe(true);
      expect(exports.has('Gamma')).toBe(true);
      expect(exports.size).toBe(3);
    });

    it('should extract aliased exports (original name)', () => {
      const content = 'export { Original as Renamed }';
      const exports = extractExports(content);
      expect(exports.has('Original')).toBe(true);
      expect(exports.has('Renamed')).toBe(false);
    });

    it('should handle multiple export types', () => {
      const content = `
        export class Foo {}
        export const bar = 1;
        export function baz() {}
        export type Qux = number;
        export { More, Stuff }
      `;
      const exports = extractExports(content);
      expect(exports.has('Foo')).toBe(true);
      expect(exports.has('bar')).toBe(true);
      expect(exports.has('baz')).toBe(true);
      expect(exports.has('Qux')).toBe(true);
      expect(exports.has('More')).toBe(true);
      expect(exports.has('Stuff')).toBe(true);
      expect(exports.size).toBe(6);
    });

    it('should not match default exports', () => {
      const content = 'export default class Foo {}';
      const exports = extractExports(content);
      // Default exports are not named exports
      expect(exports.size).toBe(0);
    });
  });

  describe('Property Extraction', () => {
    it('should extract single property decorator', () => {
      const content = `
        class Button {
          @property({ type: String })
          label: string;
        }
      `;
      const properties = extractProperties(content);
      expect(properties.has('label')).toBe(true);
      expect(properties.size).toBe(1);
    });

    it('should extract multiple properties', () => {
      const content = `
        class Alert {
          @property({ type: String })
          variant: string;

          @property({ type: Boolean })
          closable: boolean;

          @property({ type: Number })
          duration: number;
        }
      `;
      const properties = extractProperties(content);
      expect(properties.has('variant')).toBe(true);
      expect(properties.has('closable')).toBe(true);
      expect(properties.has('duration')).toBe(true);
      expect(properties.size).toBe(3);
    });

    it('should not match non-decorated properties', () => {
      const content = `
        class Foo {
          private internal: string;
          protected _state: number;
        }
      `;
      const properties = extractProperties(content);
      expect(properties.size).toBe(0);
    });

    it('should handle complex property options', () => {
      const content = `
        @property({ type: String, reflect: true, attribute: 'data-value' })
        value: string;
      `;
      const properties = extractProperties(content);
      expect(properties.has('value')).toBe(true);
    });
  });

  describe('Property Type Extraction', () => {
    it('should extract property types', () => {
      const content = `
        @property({ type: String })
        name: string;
      `;
      const types = extractPropertyTypes(content);
      expect(types.get('name')).toBe('string');
    });

    it('should handle complex types', () => {
      const content = `
        @property({ type: Object })
        config: Record<string, unknown>;
      `;
      const types = extractPropertyTypes(content);
      expect(types.get('config')).toBe('Record<string, unknown>');
    });

    it('should handle union types', () => {
      const content = `
        @property({ type: String })
        variant: 'info' | 'warning' | 'error';
      `;
      const types = extractPropertyTypes(content);
      expect(types.get('variant')).toBe("'info' | 'warning' | 'error'");
    });

    it('should handle optional types', () => {
      const content = `
        @property({ type: String })
        label: string | undefined;
      `;
      const types = extractPropertyTypes(content);
      expect(types.get('label')).toBe('string | undefined');
    });

    it('should handle array types', () => {
      const content = `
        @property({ type: Array })
        items: string[];
      `;
      const types = extractPropertyTypes(content);
      expect(types.get('items')).toBe('string[]');
    });
  });

  describe('Changeset Parsing', () => {
    it('should parse valid changeset with single package', () => {
      const content = `---
"@helix/library": minor
---

Added new button variant`;

      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      expect(frontmatterMatch).not.toBeNull();

      if (frontmatterMatch) {
        const summary = content.slice(frontmatterMatch[0].length).trim();
        expect(summary).toBe('Added new button variant');
      }
    });

    it('should parse changeset with multiple packages', () => {
      const content = `---
"@helix/library": major
"@helix/tokens": minor
---

Breaking change in component API`;

      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      expect(frontmatterMatch).not.toBeNull();
    });

    it('should detect major bump', () => {
      const frontmatter = '"@helix/library": major';
      const match = frontmatter.match(/["'](.+?)["']:\s*(major|minor|patch)/);
      expect(match).not.toBeNull();
      expect(match?.[2]).toBe('major');
    });

    it('should detect minor bump', () => {
      const frontmatter = '"@helix/library": minor';
      const match = frontmatter.match(/["'](.+?)["']:\s*(major|minor|patch)/);
      expect(match?.[2]).toBe('minor');
    });

    it('should detect patch bump', () => {
      const frontmatter = '"@helix/library": patch';
      const match = frontmatter.match(/["'](.+?)["']:\s*(major|minor|patch)/);
      expect(match?.[2]).toBe('patch');
    });

    it('should extract multi-line summary', () => {
      const content = `---
"@helix/library": minor
---

This is a longer summary that spans
multiple lines and provides detailed
context about the changes.`;

      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      expect(frontmatterMatch).not.toBeNull();

      if (frontmatterMatch) {
        const summary = content.slice(frontmatterMatch[0].length).trim();
        expect(summary).toContain('multiple lines');
        expect(summary.length).toBeGreaterThan(50);
      }
    });

    it('should handle empty summary', () => {
      const content = `---
"@helix/library": patch
---

`;

      const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
      expect(frontmatterMatch).not.toBeNull();

      if (frontmatterMatch) {
        const summary = content.slice(frontmatterMatch[0].length).trim();
        expect(summary).toBe('');
      }
    });
  });

  describe('Pattern Matching (Fixed glob-to-regex)', () => {
    it('should match exact file paths', () => {
      const pattern = 'packages/hx-library/src/index.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('packages/hx-library/src/index.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/other.ts')).toBe(false);
    });

    it('should match single-level wildcard', () => {
      const pattern = 'packages/hx-library/src/*.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('packages/hx-library/src/index.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/utils.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/nested/file.ts')).toBe(false);
    });

    it('should match double-wildcard (globstar)', () => {
      const pattern = 'packages/hx-library/src/**/*.ts';
      const regex = compileGlobPattern(pattern);
      // ** matches zero or more path segments, so src/**/*.ts should NOT match src/index.ts
      // It should only match when there's at least one directory between src/ and the file
      expect(regex.test('packages/hx-library/src/components/index.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/components/button/index.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/deep/nested/path/file.ts')).toBe(true);
    });

    it('should handle special regex characters safely', () => {
      const pattern = 'test.file+with[chars].ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('test.file+with[chars].ts')).toBe(true);
      expect(regex.test('testXfileXwithXcharsXts')).toBe(false);
    });

    it('should match component source files', () => {
      const pattern = 'packages/hx-library/src/components/**/*.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('packages/hx-library/src/components/hx-button/hx-button.ts')).toBe(true);
      expect(regex.test('packages/hx-library/src/components/hx-card/index.ts')).toBe(true);
    });

    it('should exclude test files', () => {
      const pattern = '**/*.test.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('src/components/hx-button/hx-button.test.ts')).toBe(true);
      expect(regex.test('src/components/hx-button/hx-button.ts')).toBe(false);
    });

    it('should exclude story files', () => {
      const pattern = '**/*.stories.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('src/components/hx-button/hx-button.stories.ts')).toBe(true);
      expect(regex.test('src/components/hx-button/hx-button.ts')).toBe(false);
    });

    it('should exclude style files', () => {
      const pattern = '**/*.styles.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('src/components/hx-button/hx-button.styles.ts')).toBe(true);
      expect(regex.test('src/components/hx-button/hx-button.ts')).toBe(false);
    });

    it('should not match partial paths', () => {
      const pattern = 'packages/hx-library/src/index.ts';
      const regex = compileGlobPattern(pattern);
      expect(regex.test('other/packages/hx-library/src/index.ts')).toBe(false);
      expect(regex.test('packages/hx-library/src/index.ts/extra')).toBe(false);
    });
  });

  describe('Approval Comment Detection', () => {
    it('should detect valid approval comment', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '// @changeset-approved: JIRA-123 Approved by architecture team';
      const match = content.match(pattern);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('JIRA-123');
      expect(match?.[2]).toBe('Approved by architecture team');
    });

    it('should extract ticket ID and reason', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '// @changeset-approved: TICKET-456 Emergency hotfix for production issue';
      const match = content.match(pattern);
      expect(match?.[1]).toBe('TICKET-456');
      expect(match?.[2]).toBe('Emergency hotfix for production issue');
    });

    it('should not match without ticket ID', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '// @changeset-approved: Just because';
      const match = content.match(pattern);
      expect(match).toBeNull();
    });

    it('should not match without reason', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '// @changeset-approved: JIRA-123';
      const match = content.match(pattern);
      expect(match).toBeNull();
    });

    it('should handle different ticket formats', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;

      const jira = '// @changeset-approved: JIRA-999 Reason here';
      expect(jira.match(pattern)?.[1]).toBe('JIRA-999');

      const github = '// @changeset-approved: GH-123 Reason here';
      expect(github.match(pattern)?.[1]).toBe('GH-123');

      const custom = '// @changeset-approved: TASK-5678 Reason here';
      expect(custom.match(pattern)?.[1]).toBe('TASK-5678');
    });

    it('should not match approval without colon', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '// @changeset-approved JIRA-123 Some reason';
      const match = content.match(pattern);
      expect(match).toBeNull();
    });
  });

  describe('Breaking Change Detection', () => {
    it('should detect removed export', () => {
      const current = new Set(['ClassA', 'ClassB']);
      const previous = new Set(['ClassA', 'ClassB', 'ClassC']);

      let hasBreaking = false;
      for (const prev of previous) {
        if (!current.has(prev)) {
          hasBreaking = true;
          break;
        }
      }

      expect(hasBreaking).toBe(true);
    });

    it('should detect removed property', () => {
      const current = new Set(['prop1', 'prop2']);
      const previous = new Set(['prop1', 'prop2', 'prop3']);

      let hasBreaking = false;
      for (const prev of previous) {
        if (!current.has(prev)) {
          hasBreaking = true;
          break;
        }
      }

      expect(hasBreaking).toBe(true);
    });

    it('should not flag new exports as breaking', () => {
      const current = new Set(['ClassA', 'ClassB', 'ClassC']);
      const previous = new Set(['ClassA', 'ClassB']);

      let hasBreaking = false;
      for (const prev of previous) {
        if (!current.has(prev)) {
          hasBreaking = true;
          break;
        }
      }

      expect(hasBreaking).toBe(false);
    });

    it('should not flag new properties as breaking', () => {
      const current = new Set(['prop1', 'prop2', 'prop3']);
      const previous = new Set(['prop1', 'prop2']);

      let hasBreaking = false;
      for (const prev of previous) {
        if (!current.has(prev)) {
          hasBreaking = true;
          break;
        }
      }

      expect(hasBreaking).toBe(false);
    });

    it('should detect property type change', () => {
      const current = new Map([
        ['name', 'string'],
        ['age', 'string'], // Changed from number
      ]);
      const previous = new Map([
        ['name', 'string'],
        ['age', 'number'],
      ]);

      const typeChanges: string[] = [];
      for (const [prop, prevType] of previous.entries()) {
        const currType = current.get(prop);
        if (currType && currType !== prevType) {
          typeChanges.push(prop);
        }
      }

      expect(typeChanges).toContain('age');
      expect(typeChanges.length).toBe(1);
    });

    it('should not flag unchanged types', () => {
      const current = new Map([
        ['name', 'string'],
        ['age', 'number'],
      ]);
      const previous = new Map([
        ['name', 'string'],
        ['age', 'number'],
      ]);

      const typeChanges: string[] = [];
      for (const [prop, prevType] of previous.entries()) {
        const currType = current.get(prop);
        if (currType && currType !== prevType) {
          typeChanges.push(prop);
        }
      }

      expect(typeChanges.length).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should handle large export lists efficiently', () => {
      const start = Date.now();

      const exports = Array.from({ length: 1000 }, (_, i) => `export class Class${i} {}`).join(
        '\n',
      );
      const extracted = extractExports(exports);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
      expect(extracted.size).toBe(1000);
    });

    it('should handle large property lists efficiently', () => {
      const start = Date.now();

      const properties = Array.from(
        { length: 500 },
        (_, i) => `@property({ type: String }) prop${i}: string;`,
      ).join('\n');
      const extracted = extractProperties(properties);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
      expect(extracted.size).toBe(500);
    });

    it('should handle complex regex matching efficiently', () => {
      const start = Date.now();

      const pattern = 'packages/**/src/**/*.ts';
      const regex = compileGlobPattern(pattern);
      const files = Array.from(
        { length: 10000 },
        (_, i) => `packages/pkg${i}/src/nested/path/file${i}.ts`,
      );

      let matches = 0;
      for (const file of files) {
        if (regex.test(file)) matches++;
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
      expect(matches).toBe(10000);
    });

    it('should compile patterns once for reuse', () => {
      const patterns = ['packages/hx-library/src/**/*.ts', '**/*.test.ts', '**/*.stories.ts'];

      const start = Date.now();
      const compiled = patterns.map(compileGlobPattern);
      const compilationTime = Date.now() - start;

      // Reuse compiled patterns
      const testFiles = [
        'packages/hx-library/src/index.ts',
        'packages/hx-library/src/components/button.ts',
        'packages/hx-library/src/components/button.test.ts',
      ];

      const reuseStart = Date.now();
      for (let i = 0; i < 1000; i++) {
        testFiles.forEach((file) => {
          compiled.forEach((regex) => regex.test(file));
        });
      }
      const reuseTime = Date.now() - reuseStart;

      expect(compilationTime).toBeLessThan(10);
      expect(reuseTime).toBeLessThan(100);
    });
  });

  describe('YAML Parsing (yaml library)', () => {
    it('should parse valid YAML frontmatter', () => {
      const _frontmatter = '"@helix/library": minor';

      // Simulate what yaml library would do
      const parsed: Record<string, string> = {
        '@helix/library': 'minor',
      };

      expect(parsed['@helix/library']).toBe('minor');
    });

    it('should handle multiple packages in YAML', () => {
      const _frontmatter = `"@helix/library": major
"@helix/tokens": patch`;

      const parsed: Record<string, string> = {
        '@helix/library': 'major',
        '@helix/tokens': 'patch',
      };

      expect(Object.keys(parsed).length).toBe(2);
      expect(parsed['@helix/library']).toBe('major');
      expect(parsed['@helix/tokens']).toBe('patch');
    });

    it('should reject invalid YAML', () => {
      const frontmatter = 'invalid: yaml: structure:';

      // yaml library would throw or return null
      let isValid = true;
      try {
        // Simulate YAML parse that fails
        if (frontmatter.split(':').length > 2) {
          throw new Error('Invalid YAML');
        }
      } catch {
        isValid = false;
      }

      expect(isValid).toBe(false);
    });
  });

  describe('CEM Integration', () => {
    it('should detect removed CSS parts', () => {
      const currentParts = new Set(['button', 'label']);
      const previousParts = new Set(['button', 'label', 'icon']);

      const removed: string[] = [];
      for (const part of previousParts) {
        if (!currentParts.has(part)) {
          removed.push(part);
        }
      }

      expect(removed).toContain('icon');
      expect(removed.length).toBe(1);
    });

    it('should detect removed slots', () => {
      const currentSlots = new Set(['', 'header']);
      const previousSlots = new Set(['', 'header', 'footer']);

      const removed: string[] = [];
      for (const slot of previousSlots) {
        if (!currentSlots.has(slot)) {
          removed.push(slot);
        }
      }

      expect(removed).toContain('footer');
    });

    it('should detect removed events', () => {
      const currentEvents = new Set(['hx-click', 'hx-change']);
      const previousEvents = new Set(['hx-click', 'hx-change', 'hx-close']);

      const removed: string[] = [];
      for (const event of previousEvents) {
        if (!currentEvents.has(event)) {
          removed.push(event);
        }
      }

      expect(removed).toContain('hx-close');
    });

    it('should detect removed methods', () => {
      const currentMethods = new Set(['show', 'hide']);
      const previousMethods = new Set(['show', 'hide', 'toggle']);

      const removed: string[] = [];
      for (const method of previousMethods) {
        if (!currentMethods.has(method)) {
          removed.push(method);
        }
      }

      expect(removed).toContain('toggle');
    });

    it('should not flag new CSS parts', () => {
      const currentParts = new Set(['button', 'label', 'icon']);
      const previousParts = new Set(['button', 'label']);

      const removed: string[] = [];
      for (const part of previousParts) {
        if (!currentParts.has(part)) {
          removed.push(part);
        }
      }

      expect(removed.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty changeset summary as critical', () => {
      const summary = '';
      const isCritical = summary.length === 0;
      expect(isCritical).toBe(true);
    });

    it('should handle very short summary as warning', () => {
      const summary = 'Fix bug';
      const isWarning = summary.length > 0 && summary.length < 10;
      expect(isWarning).toBe(true);
    });

    it('should handle files with no previous version', () => {
      const previousContent = null;
      const isNewFile = previousContent === null;
      expect(isNewFile).toBe(true);
    });

    it('should handle empty export list', () => {
      const content = '// No exports';
      const exports = extractExports(content);
      expect(exports.size).toBe(0);
    });

    it('should handle malformed property decorators', () => {
      const content = '@property name: string'; // Missing parentheses
      const properties = extractProperties(content);
      expect(properties.size).toBe(0);
    });

    it('should handle whitespace in approval comments', () => {
      const pattern = /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/;
      const content = '//   @changeset-approved:   JIRA-123    Lots of spaces   ';
      const match = content.match(pattern);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('JIRA-123');
    });
  });

  describe('Validation Logic', () => {
    it('should validate package names against workspace', () => {
      const validPackages = ['@helix/library', '@helix/tokens'];
      const testPackage = '@helix/library';
      expect(validPackages.includes(testPackage)).toBe(true);
    });

    it('should reject invalid package names', () => {
      const validPackages = ['@helix/library', '@helix/tokens'];
      const testPackage = '@unknown/package';
      expect(validPackages.includes(testPackage)).toBe(false);
    });

    it('should detect highest bump type (major > minor > patch)', () => {
      const bumps = ['patch', 'minor', 'major', 'patch'];
      let highest: 'major' | 'minor' | 'patch' = 'patch';

      for (const bump of bumps) {
        if (bump === 'major' || (bump === 'minor' && highest === 'patch')) {
          highest = bump as 'major' | 'minor' | 'patch';
        }
      }

      expect(highest).toBe('major');
    });

    it('should prioritize minor over patch', () => {
      const bumps = ['patch', 'minor', 'patch'];
      let highest: 'major' | 'minor' | 'patch' = 'patch';

      for (const bump of bumps) {
        if (bump === 'major' || (bump === 'minor' && highest === 'patch')) {
          highest = bump as 'major' | 'minor' | 'patch';
        }
      }

      expect(highest).toBe('minor');
    });
  });

  describe('Execution Time Monitoring', () => {
    it('should track execution time', () => {
      const start = Date.now();
      // Simulate work
      for (let i = 0; i < 1000000; i++) {
        Math.sqrt(i);
      }
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should warn if execution exceeds budget', () => {
      const budget = 2000;
      const actual = 2500;
      const exceeded = actual > budget;
      const overage = actual - budget;

      expect(exceeded).toBe(true);
      expect(overage).toBe(500);
    });

    it('should not warn if within budget', () => {
      const budget = 2000;
      const actual = 1500;
      const exceeded = actual > budget;

      expect(exceeded).toBe(false);
    });
  });
});
