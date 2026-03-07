import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixVisuallyHidden } from './hx-visually-hidden.js';
import './index.js';

afterEach(cleanup);

describe('hx-visually-hidden', () => {
  // ─── Rendering (3) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders default slot', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Screen reader text</hx-visually-hidden>',
      );
      const slot = shadowQuery<HTMLSlotElement>(el, 'slot');
      expect(slot).toBeTruthy();
      const assigned = slot?.assignedNodes({ flatten: true });
      const textContent = assigned?.map((n) => n.textContent).join('');
      expect(textContent).toBe('Screen reader text');
    });
  });

  // ─── Visually Hidden (2) ───

  describe('Visually hidden styles', () => {
    it('host element is positioned absolutely', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      const styles = getComputedStyle(el);
      expect(styles.position).toBe('absolute');
    });

    it('host element has 1px width and height', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      const styles = getComputedStyle(el);
      expect(styles.width).toBe('1px');
      expect(styles.height).toBe('1px');
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden accessible text</hx-visually-hidden>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when used inside a button', async () => {
      const container = await fixture<HTMLButtonElement>(
        '<button><hx-visually-hidden>Close</hx-visually-hidden></button>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(container);
      expect(violations).toEqual([]);
    });
  });
});
