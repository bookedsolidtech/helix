import { describe, it, expect } from 'vitest';
import {
  template,
  generateComponentTs,
  generateComponentCss,
  generateComponentTwig,
  generateComponentTest,
} from './template-engine.js';
import type { ComponentTemplateData } from './template-engine.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_DATA: ComponentTemplateData = {
  tagName: 'hx-badge',
  className: 'HxBadge',
  description: 'A badge component for status indicators.',
  properties: [
    {
      name: 'variant',
      type: 'string',
      default: "'default'",
      description: 'Visual variant of the badge',
    },
    {
      name: 'size',
      type: 'string',
      default: "'md'",
      description: 'Size of the badge',
    },
  ],
  events: [{ name: 'hx-dismiss', description: 'Fired when badge is dismissed' }],
  slots: [
    { name: '', description: 'Badge label text' },
    { name: 'icon', description: 'Optional icon slot' },
  ],
  cssParts: [{ name: 'badge', description: 'The root badge element' }],
  cssProperties: [
    { name: '--hx-badge-bg', default: 'var(--hx-color-neutral-100)', description: 'Background' },
    { name: '--hx-badge-color', default: 'var(--hx-color-neutral-900)', description: 'Text color' },
  ],
};

// ─── template tagged literal ──────────────────────────────────────────────────

describe('template tagged literal', () => {
  it('strips leading and trailing blank lines', () => {
    const result = template`
      hello world
    `;
    expect(result.startsWith('\n')).toBe(false);
    expect(result.endsWith('\n')).toBe(false);
    expect(result.trim()).toBe('hello world');
  });

  it('strips common leading indentation', () => {
    const result = template`
      line one
      line two
    `;
    const lines = result.split('\n');
    expect(lines[0]).toBe('line one');
    expect(lines[1]).toBe('line two');
  });

  it('preserves relative indentation', () => {
    const result = template`
      outer
        inner
      outer again
    `;
    const lines = result.split('\n');
    expect(lines[0]).toBe('outer');
    expect(lines[1]).toBe('  inner');
    expect(lines[2]).toBe('outer again');
  });

  it('replaces undefined interpolation with empty string', () => {
    const val: string | undefined = undefined;
    const result = template`hello ${val} world`;
    expect(result).toBe('hello  world');
  });

  it('replaces null interpolation with empty string', () => {
    const val: string | null = null;
    const result = template`hello ${val} world`;
    expect(result).toBe('hello  world');
  });

  it('handles string interpolations', () => {
    const name = 'HxButton';
    const result = template`class ${name} extends LitElement {}`;
    expect(result).toContain('HxButton');
  });

  it('handles array interpolations by joining with newline', () => {
    const items = ['line1', 'line2', 'line3'];
    const result = template`${items}`;
    expect(result).toBe('line1\nline2\nline3');
  });

  it('produces empty string for blank template', () => {
    const result = template`

    `;
    expect(result).toBe('');
  });
});

// ─── generateComponentTs ──────────────────────────────────────────────────────

describe('generateComponentTs()', () => {
  it('returns a non-empty string', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the tagName', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain('hx-badge');
  });

  it('contains the className', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain('HxBadge');
  });

  it('contains LitElement import', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain("from 'lit'");
  });

  it('contains @customElement decorator', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain("@customElement('hx-badge')");
  });

  it('contains property declarations', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain('variant');
    expect(result).toContain('size');
  });

  it('contains HTMLElementTagNameMap declaration', () => {
    const result = generateComponentTs(FIXTURE_DATA);
    expect(result).toContain('HTMLElementTagNameMap');
  });

  it('works with minimal data (no optional fields)', () => {
    const minimal: ComponentTemplateData = { tagName: 'hx-test', className: 'HxTest' };
    const result = generateComponentTs(minimal);
    expect(result).toContain('hx-test');
    expect(result).toContain('HxTest');
  });
});

// ─── generateComponentCss ─────────────────────────────────────────────────────

describe('generateComponentCss()', () => {
  it('returns a non-empty string', () => {
    const result = generateComponentCss(FIXTURE_DATA);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the className styles export', () => {
    const result = generateComponentCss(FIXTURE_DATA);
    expect(result).toContain('HxBadgeStyles');
  });

  it('contains css tagged template', () => {
    const result = generateComponentCss(FIXTURE_DATA);
    expect(result).toContain('css`');
  });

  it('contains CSS custom property defaults', () => {
    const result = generateComponentCss(FIXTURE_DATA);
    expect(result).toContain('--hx-badge-bg');
    expect(result).toContain('--hx-badge-color');
  });

  it('contains :host selector', () => {
    const result = generateComponentCss(FIXTURE_DATA);
    expect(result).toContain(':host');
  });
});

// ─── generateComponentTwig ────────────────────────────────────────────────────

describe('generateComponentTwig()', () => {
  it('returns a non-empty string', () => {
    const result = generateComponentTwig(FIXTURE_DATA);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains the opening tag', () => {
    const result = generateComponentTwig(FIXTURE_DATA);
    expect(result).toContain('<hx-badge');
  });

  it('contains the closing tag', () => {
    const result = generateComponentTwig(FIXTURE_DATA);
    expect(result).toContain('</hx-badge>');
  });

  it('works with minimal data', () => {
    const minimal: ComponentTemplateData = { tagName: 'hx-test', className: 'HxTest' };
    const result = generateComponentTwig(minimal);
    expect(result).toContain('<hx-test');
    expect(result).toContain('</hx-test>');
  });
});

// ─── generateComponentTest ────────────────────────────────────────────────────

describe('generateComponentTest()', () => {
  it('returns a non-empty string', () => {
    const result = generateComponentTest(FIXTURE_DATA);
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains describe block with tagName', () => {
    const result = generateComponentTest(FIXTURE_DATA);
    expect(result).toContain("describe('hx-badge'");
  });

  it('contains vitest imports', () => {
    const result = generateComponentTest(FIXTURE_DATA);
    expect(result).toContain("from 'vitest'");
  });

  it('contains a renders test', () => {
    const result = generateComponentTest(FIXTURE_DATA);
    expect(result).toContain("'renders'");
  });

  it('contains property tests', () => {
    const result = generateComponentTest(FIXTURE_DATA);
    expect(result).toContain('variant');
    expect(result).toContain('size');
  });

  it('works with minimal data', () => {
    const minimal: ComponentTemplateData = { tagName: 'hx-test', className: 'HxTest' };
    const result = generateComponentTest(minimal);
    expect(result).toContain('hx-test');
    expect(result).toContain('HxTest');
  });
});
