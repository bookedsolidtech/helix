import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixGrid, HelixGridItem } from './hx-grid.js';
import './index.js';

afterEach(cleanup);

describe('hx-grid', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
    });

    it('base has role="presentation"', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base?.getAttribute('role')).toBe('presentation');
    });

    it('renders default slot', async () => {
      const el = await fixture<HelixGrid>('<hx-grid><div id="child">content</div></hx-grid>');
      expect(el.querySelector('#child')).toBeTruthy();
    });
  });

  // ─── Property: columns ───

  describe('Property: columns', () => {
    it('defaults to 1 column', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(el.columns).toBe(1);
    });

    it('reflects columns attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="3"></hx-grid>');
      expect(String(el.columns)).toBe('3');
      expect(el.getAttribute('columns')).toBe('3');
    });

    it('sets repeat(N, 1fr) for numeric columns', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="3"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.gridTemplateColumns).toContain('repeat(3, 1fr)');
    });

    it('sets 2-column grid', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="2"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.gridTemplateColumns).toContain('repeat(2, 1fr)');
    });

    it('sets 4-column grid', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="4"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.gridTemplateColumns).toContain('repeat(4, 1fr)');
    });

    it('sets 12-column grid', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="12"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.gridTemplateColumns).toContain('repeat(12, 1fr)');
    });

    it('passes raw string template for columns', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="1fr 2fr 1fr"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.gridTemplateColumns).toContain('1fr 2fr 1fr');
    });

    it('base element is an actual CSS grid container', async () => {
      const el = await fixture<HelixGrid>('<hx-grid columns="3"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.display).toBe('grid');
    });
  });

  // ─── Property: gap ───

  describe('Property: gap', () => {
    it('defaults to "md"', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(el.gap).toBe('md');
    });

    it('reflects gap attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid gap="lg"></hx-grid>');
      expect(el.gap).toBe('lg');
      expect(el.getAttribute('gap')).toBe('lg');
    });

    it('applies gap="none" (0)', async () => {
      const el = await fixture<HelixGrid>('<hx-grid gap="none"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      const rowGap = base?.style.rowGap ?? '';
      const colGap = base?.style.columnGap ?? '';
      expect(rowGap + colGap).toContain('0');
    });

    it('supports all gap variants without error', async () => {
      const variants = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const;
      for (const gap of variants) {
        const el = await fixture<HelixGrid>(`<hx-grid gap="${gap}"></hx-grid>`);
        expect(el.gap).toBe(gap);
      }
    });
  });

  // ─── Property: row-gap / column-gap ───

  describe('Property: row-gap / column-gap', () => {
    it('reflects row-gap attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid row-gap="xs"></hx-grid>');
      expect(el.rowGap).toBe('xs');
      expect(el.getAttribute('row-gap')).toBe('xs');
    });

    it('reflects column-gap attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid column-gap="xl"></hx-grid>');
      expect(el.columnGap).toBe('xl');
      expect(el.getAttribute('column-gap')).toBe('xl');
    });

    it('applies row-gap to base element inline style', async () => {
      const el = await fixture<HelixGrid>('<hx-grid row-gap="lg"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.rowGap).toContain('var(--hx-space-6');
    });

    it('applies column-gap to base element inline style', async () => {
      const el = await fixture<HelixGrid>('<hx-grid column-gap="sm"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.columnGap).toContain('var(--hx-space-2');
    });
  });

  // ─── Nested grids ───

  describe('Nested grids', () => {
    it('inner hx-grid establishes its own grid context independently', async () => {
      const outer = await fixture<HelixGrid>(
        '<hx-grid columns="2"><hx-grid columns="3" id="inner"><div>A</div><div>B</div><div>C</div></hx-grid><div>Right</div></hx-grid>',
      );
      const inner = outer.querySelector<HelixGrid>('#inner');
      expect(inner).toBeTruthy();
      const innerBase = shadowQuery<HTMLElement>(inner!, '[part="base"]');
      expect(innerBase?.style.gridTemplateColumns).toContain('repeat(3, 1fr)');
      // Outer base should remain 2-column
      const outerBase = shadowQuery<HTMLElement>(outer, '[part="base"]');
      expect(outerBase?.style.gridTemplateColumns).toContain('repeat(2, 1fr)');
    });
  });

  // ─── Property: align ───

  describe('Property: align', () => {
    it('defaults to "stretch"', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(el.align).toBe('stretch');
    });

    it('reflects align attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid align="center"></hx-grid>');
      expect(el.align).toBe('center');
      expect(el.getAttribute('align')).toBe('center');
    });

    it('applies align-items to base element', async () => {
      const el = await fixture<HelixGrid>('<hx-grid align="start"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.alignItems).toBe('start');
    });
  });

  // ─── Property: justify ───

  describe('Property: justify', () => {
    it('defaults to "stretch"', async () => {
      const el = await fixture<HelixGrid>('<hx-grid></hx-grid>');
      expect(el.justify).toBe('stretch');
    });

    it('reflects justify attribute', async () => {
      const el = await fixture<HelixGrid>('<hx-grid justify="end"></hx-grid>');
      expect(el.justify).toBe('end');
      expect(el.getAttribute('justify')).toBe('end');
    });

    it('applies justify-items to base element', async () => {
      const el = await fixture<HelixGrid>('<hx-grid justify="center"></hx-grid>');
      const base = shadowQuery<HTMLElement>(el, '[part="base"]');
      expect(base?.style.justifyItems).toBe('center');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — 2-column grid', async () => {
      const el = await fixture<HelixGrid>(
        '<hx-grid columns="2"><div>Item 1</div><div>Item 2</div></hx-grid>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — 3-column grid', async () => {
      const el = await fixture<HelixGrid>(
        '<hx-grid columns="3"><div>A</div><div>B</div><div>C</div></hx-grid>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — 4-column grid', async () => {
      const el = await fixture<HelixGrid>(
        '<hx-grid columns="4"><div>A</div><div>B</div><div>C</div><div>D</div></hx-grid>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});

// ─── hx-grid-item ───

describe('hx-grid-item', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item></hx-grid-item>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders default slot', async () => {
      const el = await fixture<HelixGridItem>(
        '<hx-grid-item><span id="c">content</span></hx-grid-item>',
      );
      expect(el.querySelector('#c')).toBeTruthy();
    });
  });

  describe('Property: span', () => {
    it('reflects span attribute', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item span="2"></hx-grid-item>');
      expect(el.span).toBe(2);
      expect(el.getAttribute('span')).toBe('2');
    });

    it('sets grid-column: span N on host', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item span="3"></hx-grid-item>');
      expect(el.style.gridColumn).toBe('span 3');
    });
  });

  describe('Property: column', () => {
    it('reflects column attribute', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item column="1 / 3"></hx-grid-item>');
      expect(el.column).toBe('1 / 3');
    });

    it('sets grid-column on host', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item column="2 / 4"></hx-grid-item>');
      expect(el.style.gridColumn).toBe('2 / 4');
    });
  });

  describe('Property: row', () => {
    it('reflects row attribute', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item row="1 / 2"></hx-grid-item>');
      expect(el.row).toBe('1 / 2');
    });

    it('sets grid-row on host', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item row="2 / 3"></hx-grid-item>');
      expect(el.style.gridRow).toBe('2 / 3');
    });
  });

  describe('Property: column takes precedence over span', () => {
    it('column attribute overrides span when both are set', async () => {
      const el = await fixture<HelixGridItem>(
        '<hx-grid-item column="1 / 4" span="2"></hx-grid-item>',
      );
      expect(el.style.gridColumn).toBe('1 / 4');
    });
  });

  describe('Dynamic updates', () => {
    it('updates grid-column when span changes', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item span="2"></hx-grid-item>');
      expect(el.style.gridColumn).toBe('span 2');
      el.span = 4;
      await el.updateComplete;
      expect(el.style.gridColumn).toBe('span 4');
    });

    it('updates grid-column when column changes', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item column="1 / 3"></hx-grid-item>');
      expect(el.style.gridColumn).toBe('1 / 3');
      el.column = '2 / 5';
      await el.updateComplete;
      expect(el.style.gridColumn).toBe('2 / 5');
    });

    it('updates grid-row when row changes', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item row="1 / 2"></hx-grid-item>');
      expect(el.style.gridRow).toBe('1 / 2');
      el.row = '2 / 4';
      await el.updateComplete;
      expect(el.style.gridRow).toBe('2 / 4');
    });

    it('clears grid-column when span is removed', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item span="2"></hx-grid-item>');
      expect(el.style.gridColumn).toBe('span 2');
      el.span = undefined;
      await el.updateComplete;
      expect(el.style.gridColumn).toBe('');
    });

    it('clears grid-row when row is removed', async () => {
      const el = await fixture<HelixGridItem>('<hx-grid-item row="1 / 2"></hx-grid-item>');
      expect(el.style.gridRow).toBe('1 / 2');
      el.row = undefined;
      await el.updateComplete;
      expect(el.style.gridRow).toBe('');
    });
  });

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations when used inside hx-grid', async () => {
      const grid = await fixture<HelixGrid>(
        '<hx-grid columns="3"><hx-grid-item span="2"><div>Content</div></hx-grid-item><div>Item 2</div></hx-grid>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(grid);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with multiple grid items and explicit placement', async () => {
      const grid = await fixture<HelixGrid>(
        '<hx-grid columns="4"><hx-grid-item column="1 / 3"><div>Wide</div></hx-grid-item><hx-grid-item><div>Normal</div></hx-grid-item><hx-grid-item row="2 / 3"><div>Row placed</div></hx-grid-item></hx-grid>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(grid);
      expect(violations).toEqual([]);
    });
  });
});
