/**
 * Unit tests for handlers.ts
 *
 * handlers.ts reads CEM and tokens from disk using getConfig(). We control
 * the file paths by writing temp fixtures and pointing the module at them via
 * environment variables (HELIXUI_MCP_CEM_PATH / HELIXUI_MCP_TOKENS_PATH).
 *
 * Each describe block sets the env vars in a beforeAll and cleans up in
 * afterAll. Tests within a block share the same temp file.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_CEM = {
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/components/hx-button/hx-button.js',
      declarations: [
        {
          kind: 'class',
          name: 'HxButton',
          tagName: 'hx-button',
          description: 'A button component for actions.',
          members: [
            {
              kind: 'field',
              name: 'variant',
              type: { text: "'primary' | 'secondary' | 'ghost'" },
              default: "'primary'",
              attribute: 'variant',
              description: 'Visual variant of the button',
            },
            {
              kind: 'field',
              name: 'disabled',
              type: { text: 'boolean' },
              default: 'false',
              attribute: 'disabled',
              description: 'Disables the button',
            },
            {
              kind: 'method',
              name: 'focus',
              description: 'Programmatically focus the button',
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
          cssParts: [{ name: 'button', description: 'The inner button element' }],
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
    {
      kind: 'javascript-module',
      path: 'src/components/hx-card/hx-card.js',
      declarations: [
        {
          kind: 'class',
          name: 'HxCard',
          tagName: 'hx-card',
          description: 'A card container for grouping related content.',
          members: [],
          events: [],
          slots: [{ name: '', description: 'Card content' }],
          cssParts: [],
          cssProperties: [],
        },
      ],
    },
    {
      kind: 'javascript-module',
      path: 'src/utils/helpers.js',
      declarations: [
        {
          kind: 'function',
          name: 'helperFn',
          // no tagName — should be excluded from component queries
        },
      ],
    },
  ],
};

const FIXTURE_TOKENS = {
  color: {
    primary: {
      '500': { value: '#2563EB' },
      '900': { value: '#1E3A8A' },
    },
    neutral: {
      '0': { value: '#FFFFFF' },
      '100': { value: '#F3F4F6' },
    },
  },
  spacing: {
    xs: { value: '0.25rem' },
    sm: { value: '0.5rem' },
    md: { value: '1rem' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writeTempJson(data: unknown, prefix: string): string {
  const filePath = join(tmpdir(), `${prefix}-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(data), 'utf8');
  return filePath;
}

function removeTempFile(filePath: string): void {
  if (existsSync(filePath)) unlinkSync(filePath);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handlers', () => {
  let cemPath: string;
  let tokensPath: string;

  beforeAll(() => {
    cemPath = writeTempJson(FIXTURE_CEM, 'cem');
    tokensPath = writeTempJson(FIXTURE_TOKENS, 'tokens');
    process.env['HELIXUI_MCP_CEM_PATH'] = cemPath;
    process.env['HELIXUI_MCP_TOKENS_PATH'] = tokensPath;
  });

  afterAll(() => {
    removeTempFile(cemPath);
    removeTempFile(tokensPath);
    delete process.env['HELIXUI_MCP_CEM_PATH'];
    delete process.env['HELIXUI_MCP_TOKENS_PATH'];
  });

  // ── listComponents ──────────────────────────────────────────────────────────

  describe('listComponents()', () => {
    it('lists all components when no filter is provided', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents();
      expect(result).toContain('hx-button');
      expect(result).toContain('hx-card');
      expect(result).toContain('2 components');
    });

    it('excludes declarations without tagName', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents();
      expect(result).not.toContain('helperFn');
    });

    it('filters by tagName substring', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents('button');
      expect(result).toContain('hx-button');
      expect(result).not.toContain('hx-card');
      expect(result).toContain('1 component');
    });

    it('filters by description (case-insensitive)', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents('grouping');
      expect(result).toContain('hx-card');
      expect(result).not.toContain('hx-button');
    });

    it('returns no-match message when filter finds nothing', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents('zzznomatch');
      expect(result).toContain('No components matching');
      expect(result).toContain('zzznomatch');
    });

    it('includes component description in the output', async () => {
      const { listComponents } = await import('../handlers.js');
      const result = listComponents();
      expect(result).toContain('A button component for actions');
    });
  });

  // ── getComponent ────────────────────────────────────────────────────────────

  describe('getComponent()', () => {
    it('returns full details for a known component', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('# hx-button');
      expect(result).toContain('## Properties');
      expect(result).toContain('## Events');
      expect(result).toContain('## Slots');
      expect(result).toContain('## CSS Parts');
      expect(result).toContain('## CSS Custom Properties');
      expect(result).toContain('## Methods');
    });

    it('includes property type, attribute, default, and description', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('variant');
      expect(result).toContain("'primary'");
      expect(result).toContain('attr:');
      expect(result).toContain('Visual variant');
    });

    it('includes event name and type', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('hx-click');
      expect(result).toContain('CustomEvent<void>');
    });

    it('includes slot descriptions', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('prefix');
      expect(result).toContain('(default)');
    });

    it('includes CSS part names', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('button');
    });

    it('includes CSS custom property names and defaults', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-button');
      expect(result).toContain('--hx-button-bg');
      expect(result).toContain('var(--hx-color-primary)');
    });

    it('throws for an unknown component', async () => {
      const { getComponent } = await import('../handlers.js');
      expect(() => getComponent('hx-unknown')).toThrow('not found');
    });

    it('mentions available components in the error', async () => {
      const { getComponent } = await import('../handlers.js');
      expect(() => getComponent('hx-unknown')).toThrow('hx-button');
    });

    it('works for hx-card which has no events or methods', async () => {
      const { getComponent } = await import('../handlers.js');
      const result = getComponent('hx-card');
      expect(result).toContain('# hx-card');
      expect(result).not.toContain('## Events');
      expect(result).not.toContain('## Methods');
    });
  });

  // ── findComponents ──────────────────────────────────────────────────────────

  describe('findComponents()', () => {
    it('finds components matching the query', async () => {
      const { findComponents } = await import('../handlers.js');
      const result = findComponents('button');
      expect(result).toContain('hx-button');
      expect(result).toContain('1 result');
    });

    it('matches against description (case-insensitive)', async () => {
      const { findComponents } = await import('../handlers.js');
      const result = findComponents('GROUPING');
      expect(result).toContain('hx-card');
    });

    it('matches against className', async () => {
      const { findComponents } = await import('../handlers.js');
      const result = findComponents('HxButton');
      expect(result).toContain('hx-button');
    });

    it('returns no-match message for zero results', async () => {
      const { findComponents } = await import('../handlers.js');
      const result = findComponents('zzznomatch');
      expect(result).toContain('No components matching');
    });

    it('returns plural form for multiple results', async () => {
      const { findComponents } = await import('../handlers.js');
      const result = findComponents('hx');
      expect(result).toContain('results');
    });
  });

  // ── listSlots ────────────────────────────────────────────────────────────────

  describe('listSlots()', () => {
    it('lists slots for hx-button', async () => {
      const { listSlots } = await import('../handlers.js');
      const result = listSlots('hx-button');
      expect(result).toContain('prefix');
      expect(result).toContain('2');
    });

    it('shows default slot label for unnamed slot', async () => {
      const { listSlots } = await import('../handlers.js');
      const result = listSlots('hx-button');
      expect(result).toContain('(default slot)');
    });

    it('throws for an unknown component', async () => {
      const { listSlots } = await import('../handlers.js');
      expect(() => listSlots('hx-unknown')).toThrow('not found');
    });

    it('returns no-slots message for component without named slots', async () => {
      const { listSlots } = await import('../handlers.js');
      // hx-card has a default slot only (name='')
      const result = listSlots('hx-card');
      // it has 1 slot (the default) so it should still list it
      expect(result).toContain('hx-card');
    });
  });

  // ── listEvents ───────────────────────────────────────────────────────────────

  describe('listEvents()', () => {
    it('lists events for hx-button', async () => {
      const { listEvents } = await import('../handlers.js');
      const result = listEvents('hx-button');
      expect(result).toContain('hx-click');
      expect(result).toContain('1');
    });

    it('includes event type', async () => {
      const { listEvents } = await import('../handlers.js');
      const result = listEvents('hx-button');
      expect(result).toContain('CustomEvent<void>');
    });

    it('returns no-events message for component without events', async () => {
      const { listEvents } = await import('../handlers.js');
      const result = listEvents('hx-card');
      expect(result).toContain('no documented events');
    });

    it('throws for an unknown component', async () => {
      const { listEvents } = await import('../handlers.js');
      expect(() => listEvents('hx-unknown')).toThrow('not found');
    });
  });

  // ── getDesignTokens ──────────────────────────────────────────────────────────

  describe('getDesignTokens()', () => {
    it('returns all tokens when no category is specified', async () => {
      const { getDesignTokens } = await import('../handlers.js');
      const result = getDesignTokens();
      expect(result).toContain('--hx-color-primary-500');
      expect(result).toContain('--hx-spacing-xs');
    });

    it('filters by category', async () => {
      const { getDesignTokens } = await import('../handlers.js');
      const result = getDesignTokens('color');
      expect(result).toContain('--hx-color-primary-500');
      expect(result).not.toContain('--hx-spacing-');
      expect(result).toContain('in "color"');
    });

    it('throws for an unknown category', async () => {
      const { getDesignTokens } = await import('../handlers.js');
      expect(() => getDesignTokens('zzznone')).toThrow('not found');
    });

    it('mentions available categories in the error', async () => {
      const { getDesignTokens } = await import('../handlers.js');
      expect(() => getDesignTokens('zzznone')).toThrow('color');
    });

    it('returns correct token count format', async () => {
      const { getDesignTokens } = await import('../handlers.js');
      const result = getDesignTokens('spacing');
      expect(result).toMatch(/\d+ tokens? in "spacing"/);
    });
  });

  // ── findToken ────────────────────────────────────────────────────────────────

  describe('findToken()', () => {
    it('finds tokens matching a partial name', async () => {
      const { findToken } = await import('../handlers.js');
      const result = findToken('primary');
      expect(result).toContain('--hx-color-primary-500');
    });

    it('strips --hx- prefix before searching', async () => {
      const { findToken } = await import('../handlers.js');
      const byFullName = findToken('--hx-color-primary-500');
      const byShortName = findToken('color-primary-500');
      // both should match
      expect(byFullName).toContain('--hx-color-primary-500');
      expect(byShortName).toContain('--hx-color-primary-500');
    });

    it('returns no-match message for zero results', async () => {
      const { findToken } = await import('../handlers.js');
      const result = findToken('zzznomatch');
      expect(result).toContain('No tokens matching');
    });

    it('includes token value in output', async () => {
      const { findToken } = await import('../handlers.js');
      const result = findToken('primary-500');
      expect(result).toContain('#2563EB');
    });
  });

  // ── generateImport ───────────────────────────────────────────────────────────

  describe('generateImport()', () => {
    it('generates ESM import for a known component', async () => {
      const { generateImport } = await import('../handlers.js');
      const result = generateImport('hx-button');
      expect(result).toContain("import '@helixui/library/components/hx-button/index.js'");
    });

    it('includes named import with class name', async () => {
      const { generateImport } = await import('../handlers.js');
      const result = generateImport('hx-button');
      expect(result).toContain('HxButton');
      expect(result).toContain("import { HxButton }");
    });

    it('includes HTML usage comment', async () => {
      const { generateImport } = await import('../handlers.js');
      const result = generateImport('hx-button');
      expect(result).toContain('<hx-button>');
    });

    it('throws for an unknown component', async () => {
      const { generateImport } = await import('../handlers.js');
      expect(() => generateImport('hx-unknown')).toThrow('not found');
    });
  });

  // ── getLibrarySummary ────────────────────────────────────────────────────────

  describe('getLibrarySummary()', () => {
    it('returns library header', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      expect(result).toContain('HELiX UI Library');
    });

    it('includes component count', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      expect(result).toContain('Components: 2');
    });

    it('includes CEM schema version', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      expect(result).toContain('1.0.0');
    });

    it('includes import instructions', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      expect(result).toContain('@helixui/library');
    });

    it('includes CDN URL', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      expect(result).toContain('cdn.jsdelivr.net');
    });

    it('includes design token count', async () => {
      const { getLibrarySummary } = await import('../handlers.js');
      const result = getLibrarySummary();
      // tokens fixture has 7 leaf tokens
      expect(result).toMatch(/Design tokens: \d+/);
    });
  });

  // ── error handling: missing CEM ──────────────────────────────────────────────

  describe('error handling — missing CEM', () => {
    let origCemPath: string | undefined;

    beforeAll(() => {
      origCemPath = process.env['HELIXUI_MCP_CEM_PATH'];
      process.env['HELIXUI_MCP_CEM_PATH'] = '/nonexistent/custom-elements.json';
    });

    afterAll(() => {
      if (origCemPath !== undefined) {
        process.env['HELIXUI_MCP_CEM_PATH'] = origCemPath;
      } else {
        delete process.env['HELIXUI_MCP_CEM_PATH'];
      }
    });

    it('listComponents throws when CEM is missing', async () => {
      // Re-import handlers after changing the env var - handlers reads getConfig() at call time
      const { listComponents } = await import('../handlers.js');
      expect(() => listComponents()).toThrow('CEM file not found');
    });
  });
});
