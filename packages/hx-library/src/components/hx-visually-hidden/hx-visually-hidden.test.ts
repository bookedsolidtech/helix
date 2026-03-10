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

  // ─── A11y contract (2) ───

  describe('A11y contract', () => {
    it('does NOT use display:none or visibility:hidden', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      const styles = getComputedStyle(el);
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');
    });
  });

  // ─── Focusable property (4) ───

  describe('Focusable property', () => {
    it('defaults focusable to false', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden>Hidden text</hx-visually-hidden>',
      );
      expect(el.focusable).toBe(false);
    });

    it('reflects focusable attribute to the host', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden focusable>Hidden text</hx-visually-hidden>',
      );
      expect(el.focusable).toBe(true);
      expect(el.hasAttribute('focusable')).toBe(true);
    });

    it('removes focusable attribute when set to false', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden focusable>Hidden text</hx-visually-hidden>',
      );
      el.focusable = false;
      await el.updateComplete;
      expect(el.hasAttribute('focusable')).toBe(false);
    });

    it('contains a focusable link that is keyboard accessible', async () => {
      const el = await fixture<HelixVisuallyHidden>(
        '<hx-visually-hidden focusable><a href="#main">Skip to main</a></hx-visually-hidden>',
      );
      const link = el.querySelector('a');
      expect(link).toBeTruthy();
      link?.focus();
      expect(document.activeElement).toBe(link);
    });
  });

  // ─── Nesting contexts (2) ───

  describe('Nesting contexts', () => {
    it('works inside a nav element', async () => {
      const container = await fixture<HTMLElement>(
        '<nav><hx-visually-hidden>Navigation label</hx-visually-hidden></nav>',
      );
      const el = container.querySelector('hx-visually-hidden');
      expect(el?.shadowRoot).toBeTruthy();
      const styles = getComputedStyle(el!);
      expect(styles.position).toBe('absolute');
    });

    it('works inside a list item', async () => {
      const container = await fixture<HTMLElement>(
        '<ul><li><hx-visually-hidden>List context</hx-visually-hidden></li></ul>',
      );
      const el = container.querySelector('hx-visually-hidden');
      expect(el?.shadowRoot).toBeTruthy();
      const styles = getComputedStyle(el!);
      expect(styles.position).toBe('absolute');
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
