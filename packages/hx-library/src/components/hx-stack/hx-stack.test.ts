import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixStack } from './hx-stack.js';
import './index.js';

afterEach(cleanup);

describe('hx-stack', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(shadowQuery(el, '[part~="base"]')).toBeTruthy();
    });

    it('has role="presentation" by default', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.getAttribute('role')).toBe('presentation');
    });

    it('preserves custom role set by consumer', async () => {
      const el = await fixture<HelixStack>('<hx-stack role="group"></hx-stack>');
      expect(el.getAttribute('role')).toBe('group');
    });

    it('preserves role="group" and aria-labelledby after connectedCallback', async () => {
      // P1-03: connectedCallback must not overwrite consumer-supplied ARIA attributes.
      // Healthcare components are frequently labelled by an adjacent heading via aria-labelledby.
      const el = await fixture<HelixStack>(
        '<hx-stack role="group" aria-labelledby="my-heading"></hx-stack>',
      );
      // role must remain "group" — NOT overwritten to "presentation"
      expect(el.getAttribute('role')).toBe('group');
      // aria-labelledby must be preserved exactly as supplied
      expect(el.getAttribute('aria-labelledby')).toBe('my-heading');
    });
  });

  // ─── Property: direction ───

  describe('Property: direction', () => {
    it('defaults to vertical', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.direction).toBe('vertical');
    });

    it('reflects direction attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack direction="horizontal"></hx-stack>');
      expect(el.direction).toBe('horizontal');
      expect(el.getAttribute('direction')).toBe('horizontal');
    });

    it('applies flex-direction: column for vertical', async () => {
      const el = await fixture<HelixStack>('<hx-stack direction="vertical"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).flexDirection).toBe('column');
    });

    it('applies flex-direction: row for horizontal', async () => {
      const el = await fixture<HelixStack>('<hx-stack direction="horizontal"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).flexDirection).toBe('row');
    });
  });

  // ─── Property: gap ───

  describe('Property: gap', () => {
    it('defaults to md', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.gap).toBe('md');
    });

    it('reflects gap attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack gap="lg"></hx-stack>');
      expect(el.gap).toBe('lg');
      expect(el.getAttribute('gap')).toBe('lg');
    });

    it('accepts all gap values', async () => {
      for (const gap of ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const) {
        const el = await fixture<HelixStack>(`<hx-stack gap="${gap}"></hx-stack>`);
        expect(el.gap).toBe(gap);
      }
    });

    it('applies zero gap for none', async () => {
      const el = await fixture<HelixStack>('<hx-stack gap="none"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      const styles = getComputedStyle(base);
      expect(styles.gap).toBe('0px');
    });

    it('applies non-zero gap for md', async () => {
      const el = await fixture<HelixStack>('<hx-stack gap="md"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      const styles = getComputedStyle(base);
      expect(styles.gap).not.toBe('0px');
    });
  });

  // ─── Property: align ───

  describe('Property: align', () => {
    it('defaults to stretch', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.align).toBe('stretch');
    });

    it('reflects align attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="center"></hx-stack>');
      expect(el.align).toBe('center');
      expect(el.getAttribute('align')).toBe('center');
    });

    it('applies align-items: center for align="center"', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="center"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).alignItems).toBe('center');
    });

    it('applies align-items: flex-start for align="start"', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="start"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).alignItems).toBe('flex-start');
    });

    it('applies align-items: flex-end for align="end"', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="end"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).alignItems).toBe('flex-end');
    });

    it('applies align-items: stretch for align="stretch"', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="stretch"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).alignItems).toBe('stretch');
    });

    it('applies align-items: baseline for align="baseline"', async () => {
      const el = await fixture<HelixStack>('<hx-stack align="baseline"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).alignItems).toBe('baseline');
    });
  });

  // ─── Property: justify ───

  describe('Property: justify', () => {
    it('defaults to start', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.justify).toBe('start');
    });

    it('reflects justify attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="between"></hx-stack>');
      expect(el.justify).toBe('between');
      expect(el.getAttribute('justify')).toBe('between');
    });

    it('applies justify-content: center for justify="center"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="center"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('center');
    });

    it('applies justify-content: space-between for justify="between"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="between"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('space-between');
    });

    it('applies justify-content: space-around for justify="around"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="around"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('space-around');
    });

    it('applies justify-content: space-evenly for justify="evenly"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="evenly"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('space-evenly');
    });

    it('applies justify-content: flex-start for justify="start"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="start"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('flex-start');
    });

    it('applies justify-content: flex-end for justify="end"', async () => {
      const el = await fixture<HelixStack>('<hx-stack justify="end"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).justifyContent).toBe('flex-end');
    });
  });

  // ─── Property: wrap ───

  describe('Property: wrap', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.wrap).toBe(false);
    });

    it('reflects wrap attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack wrap></hx-stack>');
      expect(el.wrap).toBe(true);
      expect(el.hasAttribute('wrap')).toBe(true);
    });

    it('applies flex-wrap: wrap when wrap is set', async () => {
      const el = await fixture<HelixStack>('<hx-stack wrap></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).flexWrap).toBe('wrap');
    });

    it('does not wrap by default', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).flexWrap).toBe('nowrap');
    });
  });

  // ─── Property: inline ───

  describe('Property: inline', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(el.inline).toBe(false);
    });

    it('reflects inline attribute', async () => {
      const el = await fixture<HelixStack>('<hx-stack inline></hx-stack>');
      expect(el.inline).toBe(true);
      expect(el.hasAttribute('inline')).toBe(true);
    });

    it('renders as block by default', async () => {
      const el = await fixture<HelixStack>('<hx-stack></hx-stack>');
      expect(getComputedStyle(el).display).toBe('block');
    });

    it('renders as inline-block when inline is set', async () => {
      const el = await fixture<HelixStack>('<hx-stack inline></hx-stack>');
      expect(getComputedStyle(el).display).toBe('inline-block');
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HelixStack>('<hx-stack><div id="child">content</div></hx-stack>');
      expect(el.querySelector('#child')).toBeTruthy();
    });
  });

  // ─── Nested Stacks ───

  describe('Nested Stacks', () => {
    it('renders nested stacks correctly', async () => {
      const el = await fixture<HelixStack>(`
        <hx-stack direction="vertical" gap="lg">
          <hx-stack direction="horizontal" gap="sm">
            <div id="inner-a">A</div>
            <div id="inner-b">B</div>
          </hx-stack>
          <div id="outer-c">C</div>
        </hx-stack>
      `);
      const outerBase = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(outerBase).flexDirection).toBe('column');

      const innerStack = el.querySelector('hx-stack') as HelixStack;
      expect(innerStack).toBeTruthy();
      const innerBase = shadowQuery(innerStack, '[part="base"]');
      expect(getComputedStyle(innerBase).flexDirection).toBe('row');

      expect(innerStack.querySelector('#inner-a')).toBeTruthy();
      expect(innerStack.querySelector('#inner-b')).toBeTruthy();
      expect(el.querySelector('#outer-c')).toBeTruthy();
    });
  });

  // ─── Reactivity ───

  describe('Reactivity', () => {
    it('updates flex-direction when direction property changes at runtime', async () => {
      const el = await fixture<HelixStack>('<hx-stack direction="vertical"></hx-stack>');
      const base = shadowQuery(el, '[part="base"]');
      expect(getComputedStyle(base).flexDirection).toBe('column');

      el.direction = 'horizontal';
      await el.updateComplete;
      expect(getComputedStyle(base).flexDirection).toBe('row');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations — default vertical', async () => {
      const el = await fixture<HelixStack>(
        '<hx-stack><div>Item 1</div><div>Item 2</div></hx-stack>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — horizontal', async () => {
      const el = await fixture<HelixStack>(
        '<hx-stack direction="horizontal"><div>Item 1</div><div>Item 2</div></hx-stack>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations — with align and justify', async () => {
      const el = await fixture<HelixStack>(
        '<hx-stack align="center" justify="between"><div>Item 1</div><div>Item 2</div></hx-stack>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
