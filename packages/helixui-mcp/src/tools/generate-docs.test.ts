import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateDocs } from './generate-docs.js';
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
          description: 'A button component for actions in the HELiX design system.',
          members: [
            {
              kind: 'field',
              name: 'variant',
              type: { text: "'primary' | 'secondary' | 'ghost'" },
              default: "'primary'",
              attribute: 'variant',
              reflects: true,
              description: 'Visual variant of the button',
            },
            {
              kind: 'field',
              name: 'disabled',
              type: { text: 'boolean' },
              default: 'false',
              attribute: 'disabled',
              description: 'Whether the button is disabled',
            },
            {
              kind: 'field',
              name: 'loading',
              type: { text: 'boolean' },
              default: 'false',
              attribute: 'loading',
              description: 'Whether the button is in a loading state',
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
            { name: 'suffix', description: 'Slot for suffix icon' },
          ],
          cssParts: [
            { name: 'button', description: 'The inner button element' },
            { name: 'label', description: 'The label wrapper' },
          ],
          cssProperties: [
            {
              name: '--hx-button-bg',
              default: 'var(--hx-color-primary)',
              description: 'Background color of the button',
            },
          ],
        },
      ],
    },
  ],
};

const FIXTURE_CEM_MINIMAL: Cem = {
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
  const filePath = join(tmpdir(), `generate-docs-cem-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(data), 'utf8');
  tempCemPath = filePath;
  return filePath;
}

function writeTempComponent(tagName: string, source: string): string {
  const dir = join(tmpdir(), `generate-docs-component-${Date.now()}`);
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

describe('generateDocs', () => {
  // ─── Return shape ───

  describe('return shape', () => {
    it('returns tagName and className from CEM', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.tagName).toBe('hx-button');
      expect(result.className).toBe('HelixButton');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('storiesFilePath is co-located with component', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesFilePath).toMatch(/hx-button\.stories\.ts$/);
      expect(result.storiesFilePath).toContain(tempComponentDir!);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('twigFilePath is co-located with component', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigFilePath).toMatch(/hx-button\.twig$/);
      expect(result.twigFilePath).toContain(tempComponentDir!);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('returns empty warnings when CEM is found and component exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.warnings).toHaveLength(0);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── Storybook stories content ───

  describe('storiesContent', () => {
    it('includes Storybook Meta import', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("from '@storybook/web-components'");
      expect(result.storiesContent).toContain("import type { Meta, StoryObj }");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports lit html template tag', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("import { html } from 'lit'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports component registration JS', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("import './hx-button.js'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('imports storybook/test when click event exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("from 'storybook/test'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Meta object with title, component, and tags', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("title: 'Components/Button'");
      expect(result.storiesContent).toContain("component: 'hx-button'");
      expect(result.storiesContent).toContain("tags: ['autodocs']");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes argTypes for each property', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('argTypes');
      expect(result.storiesContent).toContain('variant');
      expect(result.storiesContent).toContain('disabled');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates enum options for variant property', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain("'primary'");
      expect(result.storiesContent).toContain("'secondary'");
      expect(result.storiesContent).toContain("'ghost'");
      expect(result.storiesContent).toContain("type: 'select'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Default story export', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('export const Default: Story');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates Default story with play function when click event exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('play: async');
      expect(result.storiesContent).toContain('hx-click');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates variant stories for each enum value', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('export const Primary: Story');
      expect(result.storiesContent).toContain('export const Secondary: Story');
      expect(result.storiesContent).toContain('export const Ghost: Story');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates state stories for boolean properties', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('export const Disabled: Story');
      expect(result.storiesContent).toContain('export const Loading: Story');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates CSS parts demo story when cssParts exist', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('CssPartsDemo');
      expect(result.storiesContent).toContain('::part(');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates InteractionClick story when click event exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('InteractionClick');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes label argType when default slot exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('label');
      expect(result.storiesContent).toContain('Default slot content');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('does not import storybook/test when no click event', () => {
      const cemPath = writeTempCem(FIXTURE_CEM_MINIMAL);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-card', '');

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).not.toContain("from 'storybook/test'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── Twig template content ───

  describe('twigContent', () => {
    it('contains the component tag name in the template', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('<hx-button');
      expect(result.twigContent).toContain('</hx-button>');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('starts with a Twig block comment ({#)', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent.trim()).toMatch(/^\{#/);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes parameter documentation in the comment', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('Parameters:');
      expect(result.twigContent).toContain('variant');
      expect(result.twigContent).toContain('disabled');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes usage example in the comment', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('Usage:');
      expect(result.twigContent).toContain("{% include 'hx-button.twig'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes slot block for named slots', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('slot="prefix"');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes default slot block when default slot exists', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('content');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('outputs boolean attributes conditionally', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('{% if disabled');
      expect(result.twigContent).toContain('{% if loading');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('outputs string attributes with value interpolation', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('variant="{{ variant }}"');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('includes CSS parts documentation in comment when cssParts exist', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-button', '');

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('CSS Parts');
      expect(result.twigContent).toContain('button');
      expect(result.twigContent).toContain('label');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── TypeScript source fallback ───

  describe('TypeScript source fallback', () => {
    const MINIMAL_TS_SOURCE = `
import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * @summary A simple card component.
 * @slot - Default content
 * @csspart card - The inner card element
 * @cssprop [--hx-card-padding=1rem] - Inner padding
 */
@customElement('hx-card')
export class HelixCard extends LitElement {
  @property({ type: Boolean, reflect: true })
  elevated: boolean = false;
}
`;

    it('falls back to TS source when CEM is missing', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
      const componentPath = writeTempComponent('hx-card', MINIMAL_TS_SOURCE);

      const result = generateDocs({ componentPath });

      expect(result.tagName).toBe('hx-card');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CEM manifest not found');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates stories from TS source when CEM is absent', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
      const componentPath = writeTempComponent('hx-card', MINIMAL_TS_SOURCE);

      const result = generateDocs({ componentPath });

      expect(result.storiesContent).toContain('hx-card');
      expect(result.storiesContent).toContain("title: 'Components/Card'");

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });

    it('generates twig template from TS source when CEM is absent', () => {
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
      const componentPath = writeTempComponent('hx-card', MINIMAL_TS_SOURCE);

      const result = generateDocs({ componentPath });

      expect(result.twigContent).toContain('<hx-card');
      expect(result.twigContent).toContain('</hx-card>');

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });

  // ─── CEM component not found — warnings ───

  describe('CEM component not found', () => {
    it('warns when component tag is not in CEM', () => {
      const cemPath = writeTempCem(FIXTURE_CEM);
      process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
      const componentPath = writeTempComponent('hx-unknown', '');

      const result = generateDocs({ componentPath });

      expect(result.warnings.some((w) => w.includes('not found in CEM'))).toBe(true);

      delete process.env['HELIXUI_MCP_CEM_PATH'];
    });
  });
});
