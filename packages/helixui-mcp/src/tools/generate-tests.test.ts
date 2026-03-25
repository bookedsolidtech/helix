import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateTests } from './generate-tests.js';
import type { Cem } from '../core/cem-reader.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_CEM: Cem = {
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/components/hx-button/hx-button.js',
      declarations: [
        {
          kind: 'class',
          name: 'HelixButton',
          tagName: 'hx-button',
          description: 'A button component for actions.',
          members: [
            {
              kind: 'field',
              name: 'variant',
              type: { text: "'primary' | 'secondary' | 'ghost'" },
              default: "'primary'",
              attribute: 'variant',
              reflects: true,
              description: 'Visual variant',
            },
            {
              kind: 'field',
              name: 'disabled',
              type: { text: 'boolean' },
              default: 'false',
              attribute: 'disabled',
              description: 'Disabled state',
            },
            {
              kind: 'field',
              name: 'label',
              type: { text: 'string' },
              default: "''",
              attribute: 'label',
              description: 'Accessible label',
            },
            {
              kind: 'field',
              name: '_internal',
              type: { text: 'string' },
              privacy: 'private',
              description: 'Private field — should be excluded',
            },
          ],
          events: [
            {
              name: 'hx-click',
              type: { text: 'CustomEvent<void>' },
              description: 'Fired when the button is clicked',
            },
          ],
          slots: [
            { name: '', description: 'Default slot for button label' },
            { name: 'prefix', description: 'Slot for prefix icon' },
          ],
          cssParts: [
            { name: 'button', description: 'The inner button element' },
            { name: 'label', description: 'The label wrapper' },
          ],
          cssProperties: [
            {
              name: '--hx-button-bg',
              default: 'var(--hx-color-primary)',
              description: 'Background color',
            },
          ],
        },
      ],
    },
  ],
};

const FIXTURE_CEM_NO_EVENTS: Cem = {
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/components/hx-card/hx-card.js',
      declarations: [
        {
          kind: 'class',
          name: 'HelixCard',
          tagName: 'hx-card',
          members: [],
          events: [],
          slots: [{ name: '', description: 'Card content' }],
          cssParts: [],
          cssProperties: [],
        },
      ],
    },
  ],
};

// ─── Test setup ───────────────────────────────────────────────────────────────

let tempCemPath: string | null = null;
let tempComponentDir: string | null = null;

function writeTempCem(data: Cem): string {
  const filePath = join(tmpdir(), `generate-tests-cem-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(data), 'utf8');
  tempCemPath = filePath;
  return filePath;
}

function writeTempComponent(tagName: string, source: string): string {
  const dir = join(tmpdir(), `generate-tests-component-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  tempComponentDir = dir;
  const filePath = join(dir, `${tagName}.ts`);
  writeFileSync(filePath, source, 'utf8');
  return filePath;
}

afterEach(() => {
  if (tempCemPath && existsSync(tempCemPath)) {
    unlinkSync(tempCemPath);
    tempCemPath = null;
  }
  if (tempComponentDir && existsSync(tempComponentDir)) {
    rmSync(tempComponentDir, { recursive: true, force: true });
    tempComponentDir = null;
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateTests', () => {
  // ─── CEM-driven generation ───

  describe('CEM-driven generation', () => {
    it('returns tagName and className resolved from CEM', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.tagName).toBe('hx-button');
      expect(result.className).toBe('HelixButton');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('testFilePath is co-located with the component', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testFilePath).toMatch(/hx-button\.test\.ts$/);
      expect(result.testFilePath).toContain(tempComponentDir!);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes vitest imports', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("from 'vitest'");
      expect(result.testContent).toContain('describe');
      expect(result.testContent).toContain('it(');
      expect(result.testContent).toContain('expect(');
      expect(result.testContent).toContain('afterEach(cleanup)');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports test-utils helpers', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain('test-utils.js');
      expect(result.testContent).toContain('fixture');
      expect(result.testContent).toContain('cleanup');
      expect(result.testContent).toContain('checkA11y');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Rendering describe block', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Rendering'");
      expect(result.testContent).toContain('renders with shadow DOM');
      expect(result.testContent).toContain('el.shadowRoot');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates property block for enum-like variant property', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Property: variant'");
      expect(result.testContent).toContain("'primary'");
      expect(result.testContent).toContain("'secondary'");
      expect(result.testContent).toContain("'ghost'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates property block for boolean disabled property', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Property: disabled'");
      expect(result.testContent).toContain('toBe(false)');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Events describe block', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Events'");
      expect(result.testContent).toContain('hx-click');
      expect(result.testContent).toContain('oneEvent');
      expect(result.testContent).toContain('event.bubbles');
      expect(result.testContent).toContain('event.composed');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Slots describe block with default and named slots', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Slots'");
      expect(result.testContent).toContain('default slot renders');
      expect(result.testContent).toContain('prefix');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates CSS Parts describe block', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('CSS Parts'");
      expect(result.testContent).toContain('"button"');
      expect(result.testContent).toContain('[part~=');
      expect(result.testContent).toContain('shadowQuery');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Keyboard describe block when click event exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Keyboard'");
      expect(result.testContent).toContain('Enter');
      expect(result.testContent).toContain('Space');
      expect(result.testContent).toContain('userEvent');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Accessibility describe block', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('Accessibility (axe-core)'");
      expect(result.testContent).toContain('checkA11y');
      expect(result.testContent).toContain('violations');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('excludes private fields from generated tests', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).not.toContain('_internal');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('skips Keyboard block when no click or change event exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM_NO_EVENTS);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-card', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).not.toContain("describe('Keyboard'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('returns empty warnings when CEM is found and component is in CEM', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.warnings).toHaveLength(0);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── TypeScript source fallback ───

  describe('TypeScript source fallback', () => {
    const MINIMAL_TS_SOURCE = `
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * @summary A simple widget.
 * @fires {CustomEvent} hx-change - Fired when value changes
 * @slot - Default content
 * @csspart widget - The inner widget element
 */
@customElement('hx-widget')
export class HelixWidget extends LitElement {
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  @property({ type: Boolean, reflect: true })
  disabled: boolean = false;
}
`;

    it('falls back to TS source parsing when CEM is missing', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
      const componentPath = writeTempComponent('hx-widget', MINIMAL_TS_SOURCE);

      const result = generateTests({ componentPath });

      expect(result.tagName).toBe('hx-widget');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CEM manifest not found');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates test content from TS source when CEM is absent', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
      const componentPath = writeTempComponent('hx-widget', MINIMAL_TS_SOURCE);

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain('hx-widget');
      expect(result.testContent).toContain("describe('Rendering'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates minimal scaffold when component path does not exist', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';

      const result = generateTests({
        componentPath: '/nonexistent/hx-missing/hx-missing.ts',
      });

      expect(result.testContent).toContain('hx-missing');
      expect(result.testContent).toContain("describe('Rendering'");
      expect(result.warnings.length).toBeGreaterThan(0);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── CEM component not found — warnings ───

  describe('CEM component not found', () => {
    it('warns when component is not in CEM', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-unknown', '');

      const result = generateTests({ componentPath });

      expect(result.warnings.some((w) => w.includes('not found in CEM'))).toBe(true);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── Output structure ───

  describe('output structure', () => {
    it('wraps all tests in a top-level describe block for the tagName', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("describe('hx-button'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports component class as type', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("import type { HelixButton }");
      expect(result.testContent).toContain("from './hx-button.js'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports component registration from index.js', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("import './index.js'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes page import from @vitest/browser/context', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateTests({ componentPath });

      expect(result.testContent).toContain("@vitest/browser/context");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });
});
