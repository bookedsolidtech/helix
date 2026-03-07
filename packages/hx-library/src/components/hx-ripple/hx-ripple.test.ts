import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixRipple } from './hx-ripple.js';
import './index.js';

afterEach(cleanup);

describe('hx-ripple', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple></hx-ripple>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple></hx-ripple>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('renders default slot', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click</button></hx-ripple>',
      );
      const slotted = el.querySelector('button');
      expect(slotted).toBeTruthy();
    });
  });

  // ─── Properties ───

  describe('Properties', () => {
    it('defaults disabled to false', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple></hx-ripple>');
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple disabled></hx-ripple>');
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('reflects color attribute to host', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple color="#ff0000"></hx-ripple>');
      expect(el.getAttribute('color')).toBe('#ff0000');
    });
  });

  // ─── Ripple Creation ───

  describe('Ripple creation', () => {
    it('creates a ripple wave on pointerdown', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click</button></hx-ripple>',
      );
      const base = shadowQuery<HTMLElement>(el, '.ripple__base')!;

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 10, clientY: 10 }),
      );
      await el.updateComplete;

      const ripple = base.querySelector('.ripple__wave');
      expect(ripple).toBeTruthy();
    });

    it('does NOT create a ripple when disabled', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple disabled><button>Click</button></hx-ripple>',
      );
      const base = shadowQuery<HTMLElement>(el, '.ripple__base')!;

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 10, clientY: 10 }),
      );
      await el.updateComplete;

      const ripple = base.querySelector('.ripple__wave');
      expect(ripple).toBeNull();
    });

    it('does NOT create a ripple when prefers-reduced-motion is set', async () => {
      const mockMatchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList);

      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click</button></hx-ripple>',
      );
      const base = shadowQuery<HTMLElement>(el, '.ripple__base')!;

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 10, clientY: 10 }),
      );
      await el.updateComplete;

      const ripple = base.querySelector('.ripple__wave');
      expect(ripple).toBeNull();

      mockMatchMedia.mockRestore();
    });

    it('ripple wave has aria-hidden="true"', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click</button></hx-ripple>',
      );
      const base = shadowQuery<HTMLElement>(el, '.ripple__base')!;

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 10, clientY: 10 }),
      );
      await el.updateComplete;

      const ripple = base.querySelector('.ripple__wave');
      expect(ripple?.getAttribute('aria-hidden')).toBe('true');
    });

    it('ripple wave exposes "ripple" CSS part', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click</button></hx-ripple>',
      );
      const base = shadowQuery<HTMLElement>(el, '.ripple__base')!;

      el.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, composed: true, clientX: 10, clientY: 10 }),
      );
      await el.updateComplete;

      const ripple = base.querySelector('[part~="ripple"]');
      expect(ripple).toBeTruthy();
    });
  });

  // ─── CSS Parts ───

  describe('CSS Parts', () => {
    it('base has aria-hidden="true"', async () => {
      const el = await fixture<HelixRipple>('<hx-ripple></hx-ripple>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple><button>Click me</button></hx-ripple>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when disabled', async () => {
      const el = await fixture<HelixRipple>(
        '<hx-ripple disabled><button>Click me</button></hx-ripple>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
