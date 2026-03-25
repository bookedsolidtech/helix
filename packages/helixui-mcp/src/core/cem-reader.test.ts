import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CemReader } from './cem-reader.js';
import type { Cem } from './cem-reader.js';

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
          name: 'HxButton',
          tagName: 'hx-button',
          description: 'A button component for actions.',
          members: [
            {
              kind: 'field',
              name: 'variant',
              type: { text: 'string' },
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
              description: 'Background color',
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
          description: 'A card container component.',
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
          // no tagName — should be excluded from getComponents
        },
      ],
    },
  ],
};

// ─── Test setup ───────────────────────────────────────────────────────────────

let tempFilePath: string | null = null;

function writeTempCem(data: Cem): string {
  const filePath = join(tmpdir(), `cem-reader-test-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(data), 'utf8');
  tempFilePath = filePath;
  return filePath;
}

afterEach(() => {
  if (tempFilePath && existsSync(tempFilePath)) {
    unlinkSync(tempFilePath);
  }
  tempFilePath = null;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CemReader', () => {
  describe('load()', () => {
    it('parses a valid CEM file', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const cem = reader.load();
      expect(cem.schemaVersion).toBe('1.0.0');
      expect(cem.modules).toHaveLength(3);
    });

    it('throws when file is missing', () => {
      const reader = new CemReader('/nonexistent/path/custom-elements.json');
      expect(() => reader.load()).toThrow('CEM file not found');
    });
  });

  describe('loadSafe()', () => {
    it('returns parsed CEM for a valid file', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const cem = reader.loadSafe();
      expect(cem).not.toBeNull();
      expect(cem?.schemaVersion).toBe('1.0.0');
    });

    it('returns null when file is missing', () => {
      const reader = new CemReader('/nonexistent/path/custom-elements.json');
      const result = reader.loadSafe();
      expect(result).toBeNull();
    });
  });

  describe('getComponents()', () => {
    it('returns only declarations with tagName', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const components = reader.getComponents();
      expect(components).toHaveLength(2);
      expect(components.map((c) => c.tagName)).toEqual(['hx-button', 'hx-card']);
    });
  });

  describe('getComponent()', () => {
    it('returns the matching component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const component = reader.getComponent('hx-button');
      expect(component).toBeDefined();
      expect(component?.name).toBe('HxButton');
      expect(component?.tagName).toBe('hx-button');
    });

    it('returns undefined for unknown tagName', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const component = reader.getComponent('hx-unknown');
      expect(component).toBeUndefined();
    });
  });

  describe('getProperties()', () => {
    it('returns only field members', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const props = reader.getProperties('hx-button');
      expect(props).toHaveLength(2);
      expect(props.every((p) => p.kind === 'field')).toBe(true);
      expect(props.map((p) => p.name)).toEqual(['variant', 'disabled']);
    });

    it('returns empty array for unknown component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getProperties('hx-unknown')).toEqual([]);
    });
  });

  describe('getMethods()', () => {
    it('returns only method members', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const methods = reader.getMethods('hx-button');
      expect(methods).toHaveLength(1);
      expect(methods[0]?.name).toBe('focus');
      expect(methods[0]?.kind).toBe('method');
    });
  });

  describe('getEvents()', () => {
    it('returns events for a component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const events = reader.getEvents('hx-button');
      expect(events).toHaveLength(1);
      expect(events[0]?.name).toBe('hx-click');
    });

    it('returns empty array for component with no events', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getEvents('hx-card')).toEqual([]);
    });

    it('returns empty array for unknown component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getEvents('hx-unknown')).toEqual([]);
    });
  });

  describe('getSlots()', () => {
    it('returns slots for a component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const slots = reader.getSlots('hx-button');
      expect(slots).toHaveLength(2);
      expect(slots[0]?.name).toBe('');
      expect(slots[1]?.name).toBe('prefix');
    });

    it('returns empty array for unknown component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getSlots('hx-unknown')).toEqual([]);
    });
  });

  describe('getCssParts()', () => {
    it('returns CSS parts for a component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const parts = reader.getCssParts('hx-button');
      expect(parts).toHaveLength(1);
      expect(parts[0]?.name).toBe('button');
    });

    it('returns empty array for unknown component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getCssParts('hx-unknown')).toEqual([]);
    });
  });

  describe('getCssProperties()', () => {
    it('returns CSS custom properties for a component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const cssProps = reader.getCssProperties('hx-button');
      expect(cssProps).toHaveLength(1);
      expect(cssProps[0]?.name).toBe('--hx-button-bg');
    });

    it('returns empty array for unknown component', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      expect(reader.getCssProperties('hx-unknown')).toEqual([]);
    });
  });

  describe('search()', () => {
    it('matches by tagName', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const results = reader.search('button');
      expect(results.map((c) => c.tagName)).toContain('hx-button');
    });

    it('matches by description (case-insensitive)', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const results = reader.search('container');
      expect(results.map((c) => c.tagName)).toContain('hx-card');
    });

    it('matches by className', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const results = reader.search('HxButton');
      expect(results.map((c) => c.tagName)).toContain('hx-button');
    });

    it('returns empty array for no matches', () => {
      const path = writeTempCem(FIXTURE_CEM);
      const reader = new CemReader(path);
      const results = reader.search('zzznomatch');
      expect(results).toHaveLength(0);
    });
  });
});
