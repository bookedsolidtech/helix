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

    it('sets direction to vertical when attribute is "vertical"', async () => {
      const el = await fixture<HelixStack>('<hx-stack direction="vertical"></hx-stack>');
      expect(el.direction).toBe('vertical');
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
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders default slot content', async () => {
      const el = await fixture<HelixStack>(
        '<hx-stack><div id="child">content</div></hx-stack>',
      );
      expect(el.querySelector('#child')).toBeTruthy();
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
