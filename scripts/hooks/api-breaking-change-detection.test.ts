import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('api-breaking-change-detection (H18)', () => {
  // Find project root by looking for scripts/hooks directory
  const cwd = process.cwd();
  const PROJECT_ROOT =
    cwd.endsWith('scripts/hooks') || cwd.endsWith('scripts\\hooks') ? join(cwd, '../..') : cwd;
  const TMP_DIR = join(PROJECT_ROOT, '.tmp-api-breaking-change-test');
  const hookScript = join(PROJECT_ROOT, 'scripts/hooks/api-breaking-change-detection.ts');

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

  describe('CEM-based detection', () => {
    it('should pass when no breaking changes are present', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      mkdirSync(join(TMP_DIR, 'packages/hx-library'), { recursive: true });

      const cem = {
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
                  {
                    kind: 'field',
                    name: 'variant',
                    type: { text: 'string' },
                  },
                ],
                events: [{ name: 'hx-click' }],
                cssParts: [{ name: 'button' }],
                slots: [{ name: '' }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(cem, null, 2));
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // No changes
      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('No staged files to check');
    });

    it('should detect removed property', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      // Initial CEM with property
      const initialCEM = {
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
                  { kind: 'field', name: 'size', type: { text: 'string' } },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove property from CEM
      const updatedCEM = {
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
                  // size removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected breaking change');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('Property `size` was removed');
      }
    });

    it('should detect property type change', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      // Initial CEM
      const initialCEM = {
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
                members: [{ kind: 'field', name: 'count', type: { text: 'number' } }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Change type
      const updatedCEM = {
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
                  { kind: 'field', name: 'count', type: { text: 'string' } }, // type changed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected type change');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('type changed from `number` to `string`');
      }
    });

    it('should detect removed method', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                  { kind: 'method', name: 'focus', return: { type: { text: 'void' } } },
                  { kind: 'method', name: 'click', return: { type: { text: 'void' } } },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove method
      const updatedCEM = {
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
                  { kind: 'method', name: 'focus', return: { type: { text: 'void' } } },
                  // click removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected removed method');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('Method `click` was removed');
      }
    });

    it('should detect method signature change', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                  {
                    kind: 'method',
                    name: 'setValue',
                    parameters: [{ name: 'value', type: { text: 'string' } }],
                    return: { type: { text: 'void' } },
                  },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Change parameter type
      const updatedCEM = {
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
                  {
                    kind: 'method',
                    name: 'setValue',
                    parameters: [{ name: 'value', type: { text: 'number' } }], // changed
                    return: { type: { text: 'void' } },
                  },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected signature change');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('signature changed');
      }
    });

    it('should detect removed event', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                events: [{ name: 'hx-click' }, { name: 'hx-focus' }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove event
      const updatedCEM = {
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
                events: [
                  { name: 'hx-click' },
                  // hx-focus removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected removed event');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('Event `hx-focus` was removed');
      }
    });

    it('should detect event detail type change', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                events: [{ name: 'hx-click', type: { text: 'CustomEvent<{ value: string }>' } }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Change event detail type
      const updatedCEM = {
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
                events: [
                  { name: 'hx-click', type: { text: 'CustomEvent<{ value: number }>' } }, // changed string -> number
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should have detected event detail type change');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('Event `hx-click` detail type changed');
        expect(output).toContain('{ value: string }');
        expect(output).toContain('{ value: number }');
      }
    });

    it('should detect removed CSS part (warning)', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                cssParts: [{ name: 'button' }, { name: 'icon' }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove CSS part
      const updatedCEM = {
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
                cssParts: [
                  { name: 'button' },
                  // icon removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      // CSS part removal is warning, not critical - should pass but show warning
      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('CSS part `icon` was removed');
      expect(result).toContain('⚠️');
    });

    it('should detect removed slot (warning)', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                slots: [{ name: '' }, { name: 'icon' }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove slot
      const updatedCEM = {
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
                slots: [
                  { name: '' },
                  // icon removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('Slot `icon` was removed');
      expect(result).toContain('⚠️');
    });

    it('should ignore private/protected members', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                  {
                    kind: 'field',
                    name: '_internal',
                    privacy: 'private',
                    type: { text: 'string' },
                  },
                  { kind: 'field', name: 'public', type: { text: 'string' } },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove private member
      const updatedCEM = {
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
                  // _internal removed (private)
                  { kind: 'field', name: 'public', type: { text: 'string' } },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('No breaking changes detected');
    });
  });

  describe('Approval mechanism', () => {
    it('should allow approved breaking changes', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'packages/hx-library/src/components/hx-button/hx-button.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixButton',
                tagName: 'hx-button',
                members: [
                  { kind: 'field', name: 'variant', type: { text: 'string' } },
                  { kind: 'field', name: 'size', type: { text: 'string' } },
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove property but add approval comment
      const updatedCEM = {
        schemaVersion: '1.0.0',
        modules: [
          {
            kind: 'javascript-module',
            path: 'packages/hx-library/src/components/hx-button/hx-button.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixButton',
                tagName: 'hx-button',
                members: [
                  { kind: 'field', name: 'variant', type: { text: 'string' } },
                  // size removed
                ],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(
        componentPath,
        '// @breaking-change-approved: HELIX-123 Removing deprecated size property\n// Updated component',
      );
      execSync('git add -A', { cwd: TMP_DIR });

      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('No breaking changes detected');
    });
  });

  describe('Performance', () => {
    it('should complete within 5 second budget', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      mkdirSync(join(TMP_DIR, 'packages/hx-library'), { recursive: true });

      // Create CEM with multiple components
      const cem = {
        schemaVersion: '1.0.0',
        modules: Array.from({ length: 10 }, (_, i) => ({
          kind: 'javascript-module',
          path: `src/components/hx-component-${i}/hx-component-${i}.ts`,
          declarations: [
            {
              kind: 'class',
              name: `HelixComponent${i}`,
              tagName: `hx-component-${i}`,
              members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              events: [{ name: `hx-event-${i}` }],
              cssParts: [{ name: 'container' }],
            },
          ],
        })),
      };

      writeFileSync(cemPath, JSON.stringify(cem, null, 2));
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Make a small change and stage it
      writeFileSync(cemPath, JSON.stringify(cem, null, 2) + '\n');
      execSync('git add -A', { cwd: TMP_DIR });

      const start = Date.now();
      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
      expect(result).toContain('Execution time');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing CEM file', () => {
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      writeFileSync(componentPath, '// Component without CEM');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should fail when CEM is missing');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('CEM file not found');
        expect(output).toContain('npm run cem');
      }
    });

    it('should handle new CEM file (no previous version)', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      mkdirSync(join(TMP_DIR, 'packages/hx-library'), { recursive: true });

      const cem = {
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
                members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              },
            ],
          },
        ],
      };

      // No initial commit, CEM is new
      writeFileSync(cemPath, JSON.stringify(cem, null, 2));
      execSync('git add -A', { cwd: TMP_DIR });

      const result = execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      expect(result).toContain('No breaking changes detected');
    });

    it('should handle component removal', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      const componentPath = join(
        TMP_DIR,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
      );
      mkdirSync(join(TMP_DIR, 'packages/hx-library/src/components/hx-button'), { recursive: true });

      const initialCEM = {
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
                members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              },
            ],
          },
          {
            kind: 'javascript-module',
            path: 'src/components/hx-card/hx-card.ts',
            declarations: [
              {
                kind: 'class',
                name: 'HelixCard',
                tagName: 'hx-card',
                members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(initialCEM, null, 2));
      writeFileSync(componentPath, '// Initial component');
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Remove hx-card component
      const updatedCEM = {
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
                members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              },
            ],
          },
          // hx-card removed
        ],
      };

      writeFileSync(cemPath, JSON.stringify(updatedCEM, null, 2));
      writeFileSync(componentPath, '// Updated component');
      execSync('git add -A', { cwd: TMP_DIR });

      try {
        execSync(`npx tsx ${hookScript}`, { cwd: TMP_DIR, encoding: 'utf-8' });
        expect.fail('Should detect component removal');
      } catch (error: unknown) {
        const output = (error as { stdout?: Buffer }).stdout?.toString() || '';
        expect(output).toContain('Breaking change');
        expect(output).toContain('Component <hx-card> was completely removed');
      }
    });

    it('should support --json flag', () => {
      const cemPath = join(TMP_DIR, 'packages/hx-library/custom-elements.json');
      mkdirSync(join(TMP_DIR, 'packages/hx-library'), { recursive: true });

      const cem = {
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
                members: [{ kind: 'field', name: 'variant', type: { text: 'string' } }],
              },
            ],
          },
        ],
      };

      writeFileSync(cemPath, JSON.stringify(cem, null, 2));
      execSync('git add -A && git commit -m "Initial commit"', { cwd: TMP_DIR });

      // Make a change and stage it
      writeFileSync(cemPath, JSON.stringify(cem, null, 2) + '\n');
      execSync('git add -A', { cwd: TMP_DIR });

      const result = execSync(`npx tsx ${hookScript} --json`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
      });

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('passed');
      expect(parsed).toHaveProperty('violations');
      expect(parsed).toHaveProperty('stats');
    });
  });
});
