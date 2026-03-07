import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixToast, HelixToastStack } from './hx-toast.js';
import './index.js';

afterEach(cleanup);

describe('hx-toast', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test message</hx-toast>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('exposes "icon" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const icon = shadowQuery(el, '[part~="icon"]');
      expect(icon).toBeTruthy();
    });

    it('exposes "message" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const msg = shadowQuery(el, '[part~="message"]');
      expect(msg).toBeTruthy();
    });

    it('exposes "action" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const action = shadowQuery(el, '[part~="action"]');
      expect(action).toBeTruthy();
    });

    it('renders no close button when closable is false', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const btn = shadowQuery(el, '[part~="close-button"]');
      expect(btn).toBeNull();
    });

    it('renders close button when closable is true', async () => {
      const el = await fixture<HelixToast>('<hx-toast closable>Test</hx-toast>');
      const btn = shadowQuery(el, '[part~="close-button"]');
      expect(btn).toBeTruthy();
    });
  });

  // ─── Property: open ───

  describe('Property: open', () => {
    it('defaults to closed (open=false)', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      expect(el.open).toBe(false);
    });

    it('reflects open attr to host', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('show() sets open to true', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('hide() sets open to false', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      el.hide();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Property: variant ───

  describe('Property: variant', () => {
    it('defaults to "default" variant', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      expect(el.variant).toBe('default');
    });

    it('reflects variant attr to host', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="success">Test</hx-toast>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies variant class to base element', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.classList.contains('toast--danger')).toBe(true);
    });

    it('applies success variant class', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="success">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.classList.contains('toast--success')).toBe(true);
    });

    it('applies warning variant class', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="warning">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.classList.contains('toast--warning')).toBe(true);
    });

    it('applies info variant class', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="info">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.classList.contains('toast--info')).toBe(true);
    });
  });

  // ─── ARIA: roles ───

  describe('ARIA', () => {
    it('uses role="status" for non-danger variants', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="success">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for danger variant', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('role')).toBe('alert');
    });

    it('uses aria-live="polite" for non-danger variants', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="info">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-live')).toBe('polite');
    });

    it('uses aria-live="assertive" for danger variant', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.getAttribute('aria-live')).toBe('assertive');
    });

    it('close button has aria-label', async () => {
      const el = await fixture<HelixToast>('<hx-toast closable>Test</hx-toast>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="close-button"]')!;
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ─── Events ───

  describe('Events', () => {
    it('dispatches hx-show when opened', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const eventPromise = oneEvent(el, 'hx-show');
      el.show();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-show bubbles and is composed', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      el.show();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when closed', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const eventPromise = oneEvent(el, 'hx-hide');
      el.hide();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-hide bubbles and is composed', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hide');
      el.hide();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-after-hide after closing', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const eventPromise = oneEvent(el, 'hx-after-hide');
      el.hide();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('close button click hides toast', async () => {
      const el = await fixture<HelixToast>('<hx-toast open closable>Test</hx-toast>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="close-button"]')!;
      const eventPromise = oneEvent(el, 'hx-hide');
      btn.click();
      await eventPromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── Auto-dismiss ───

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('auto-dismisses after duration ms', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);

      vi.advanceTimersByTime(1000);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does NOT auto-dismiss when duration=0', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="0">Test</hx-toast>');
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);

      vi.advanceTimersByTime(10000);
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('pauses timer on mouseenter', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;

      const base = shadowQuery(el, '[part~="base"]')!;
      base.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      vi.advanceTimersByTime(2000);
      await el.updateComplete;
      // Should still be open because timer was paused
      expect(el.open).toBe(true);
    });

    it('resumes timer on mouseleave', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;

      const base = shadowQuery(el, '[part~="base"]')!;
      base.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.advanceTimersByTime(500);

      base.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.advanceTimersByTime(1000);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('pauses timer on focusin', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;

      const base = shadowQuery(el, '[part~="base"]')!;
      base.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

      vi.advanceTimersByTime(2000);
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('resumes timer on focusout', async () => {
      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;

      const base = shadowQuery(el, '[part~="base"]')!;
      base.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.advanceTimersByTime(500);

      base.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      vi.advanceTimersByTime(1000);
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders message text', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Hello World</hx-toast>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('icon slot accepts content', async () => {
      const el = await fixture<HelixToast>(
        '<hx-toast><span slot="icon">★</span>Test</hx-toast>',
      );
      const icon = el.querySelector('[slot="icon"]');
      expect(icon).toBeTruthy();
    });

    it('action slot accepts content', async () => {
      const el = await fixture<HelixToast>(
        '<hx-toast><button slot="action">Undo</button>Test</hx-toast>',
      );
      const action = el.querySelector('[slot="action"]');
      expect(action).toBeTruthy();
    });
  });

  // ─── Property: closable ───

  describe('Property: closable', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      expect(el.closable).toBe(false);
    });

    it('reflects closable attr to host', async () => {
      const el = await fixture<HelixToast>('<hx-toast closable>Test</hx-toast>');
      expect(el.hasAttribute('closable')).toBe(true);
    });
  });

  // ─── Accessibility ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Notification message</hx-toast>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when closable', async () => {
      const el = await fixture<HelixToast>(
        '<hx-toast open closable>Notification message</hx-toast>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for danger variant', async () => {
      const el = await fixture<HelixToast>(
        '<hx-toast open variant="danger">Critical alert</hx-toast>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['default', 'success', 'warning', 'danger', 'info'] as const) {
        const el = await fixture<HelixToast>(
          `<hx-toast open variant="${variant}">Test notification</hx-toast>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });
  });
});

// ─── hx-toast-stack ───

describe('hx-toast-stack', () => {
  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      const base = shadowQuery(el, '[part~="base"]');
      expect(base).toBeTruthy();
    });

    it('defaults placement to "bottom-end"', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      expect(el.placement).toBe('bottom-end');
    });

    it('reflects placement attr to host', async () => {
      const el = await fixture<HelixToastStack>(
        '<hx-toast-stack placement="top-start"></hx-toast-stack>',
      );
      expect(el.getAttribute('placement')).toBe('top-start');
    });

    it('defaults stackLimit to 3', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      expect(el.stackLimit).toBe(3);
    });

    it('accepts stack-limit attribute', async () => {
      const el = await fixture<HelixToastStack>(
        '<hx-toast-stack stack-limit="5"></hx-toast-stack>',
      );
      expect(el.stackLimit).toBe(5);
    });
  });

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
