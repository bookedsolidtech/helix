import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixToast } from './hx-toast.js';
import type { HelixToastStack, ToastStackPlacement } from './hx-toast-stack.js';
import { toast } from './toast-factory.js';
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
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const icon = shadowQuery(el, '[part~="icon"]');
      expect(icon).toBeTruthy();
    });

    it('exposes "message" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const msg = shadowQuery(el, '[part~="message"]');
      expect(msg).toBeTruthy();
    });

    it('exposes "action" CSS part', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const action = shadowQuery(el, '[part~="action"]');
      expect(action).toBeTruthy();
    });

    it('renders no close button when closable is false', async () => {
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const btn = shadowQuery(el, '[part~="close-button"]');
      expect(btn).toBeNull();
    });

    it('renders close button when closable is true', async () => {
      const el = await fixture<HelixToast>('<hx-toast open closable>Test</hx-toast>');
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
    it('uses role="status" for non-danger variants (host via internals)', async () => {
      // (group-6) Role lives on the host via ElementInternals — the inner
      // base div no longer carries `role` (host-canonical migration).
      const el = await fixture<HelixToast>('<hx-toast variant="success">Test</hx-toast>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('status');
    });

    it('uses role="alert" for danger variant (host via internals)', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('alert');
    });

    it('does NOT set explicit aria-live on host or inner base (role implies live)', async () => {
      // (group-6 §5.1) Avoid double-announce on older NVDA/JAWS. role implies
      // aria-live; setting both was the primary double-announce risk.
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      expect(el.hasAttribute('aria-live')).toBe(false);
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.hasAttribute('aria-live')).toBe(false);
    });

    it('does NOT place role on the inner base div (regression guard)', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.hasAttribute('role')).toBe(false);
    });

    it('mirrors role on the host as a legacy attribute fallback (group-6 codex round-1)', async () => {
      // (group-6 codex round-1) Some AT+browser combos still ignore
      // ElementInternals-backed ARIA on custom elements; without an attribute
      // fallback they would stop announcing toasts entirely. role is mirrored
      // to the host attribute in addition to internals (harmonized with
      // hx-alert/hx-banner). aria-live is NOT mirrored — role implies it.
      const status = await fixture<HelixToast>('<hx-toast variant="success">Test</hx-toast>');
      expect(status.getAttribute('role')).toBe('status');
      const danger = await fixture<HelixToast>('<hx-toast variant="danger">Test</hx-toast>');
      expect(danger.getAttribute('role')).toBe('alert');
    });

    it('keeps host role attribute in sync with variant changes', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="info">Test</hx-toast>');
      expect(el.getAttribute('role')).toBe('status');
      el.variant = 'danger';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('close button has aria-label', async () => {
      const el = await fixture<HelixToast>('<hx-toast open closable>Test</hx-toast>');
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="close-button"]')!;
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });

    it('has aria-atomic on the host live region (P1-02, host-canonical)', async () => {
      // (group-6) aria-atomic moved to host via internals. role implies
      // aria-atomic for status/alert per ARIA, but we set it explicitly
      // for cross-AT consistency.
      const el = await fixture<HelixToast>('<hx-toast open>Test</hx-toast>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.ariaAtomic).toBe('true');
    });

    it('updates host role when variant changes', async () => {
      const el = await fixture<HelixToast>('<hx-toast variant="info">Test</hx-toast>');
      const internals = (el as unknown as { _internals: ElementInternals })._internals;
      expect(internals.role).toBe('status');
      el.variant = 'danger';
      await el.updateComplete;
      expect(internals.role).toBe('alert');
    });

    it('sets aria-hidden="true" on host when closed (P1-01)', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      await el.updateComplete;
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes aria-hidden from host when opened (P1-01)', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Test</hx-toast>');
      el.show();
      await el.updateComplete;
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });

    it('supports custom labelClose for localization (P2-06)', async () => {
      const el = await fixture<HelixToast>(
        '<hx-toast open closable label-close="Cerrar notificación">Test</hx-toast>',
      );
      const btn = shadowQuery<HTMLButtonElement>(el, '[part~="close-button"]')!;
      expect(btn.getAttribute('aria-label')).toBe('Cerrar notificación');
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

    it('does NOT auto-dismiss when prefers-reduced-motion is reduce (WCAG 2.2.1)', async () => {
      // Mock matchMedia to report reduced-motion preference
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const el = await fixture<HelixToast>('<hx-toast duration="1000">Test</hx-toast>');
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);

      // Advance well past the duration — toast must remain open
      vi.advanceTimersByTime(5000);
      await el.updateComplete;
      expect(el.open).toBe(true);

      vi.restoreAllMocks();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders message text', async () => {
      const el = await fixture<HelixToast>('<hx-toast>Hello World</hx-toast>');
      expect(el.textContent?.trim()).toBe('Hello World');
    });

    it('icon slot accepts content', async () => {
      const el = await fixture<HelixToast>('<hx-toast><span slot="icon">★</span>Test</hx-toast>');
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

  // ─── (group-6 §5.3) WCAG 2.2.3 minimum-display-time devWarn ───

  describe('WCAG 2.2.3 devWarn (group-6 §5.3)', () => {
    it('warns when danger variant has duration shorter than 6s', async () => {
      const original = console.warn;
      let warned = false;
      let warnMsg = '';
      console.warn = (...args: unknown[]) => {
        warned = true;
        warnMsg = String(args[0] ?? '');
      };
      try {
        const el = await fixture<HelixToast>(
          '<hx-toast open variant="danger" duration="3000">Critical</hx-toast>',
        );
        await el.updateComplete;
        expect(warned).toBe(true);
        expect(warnMsg).toContain('hx-toast');
        expect(warnMsg).toContain('WCAG 2.2.3');
      } finally {
        console.warn = original;
      }
    });

    it('does NOT warn when danger duration meets the 6s minimum', async () => {
      const original = console.warn;
      let warned = false;
      console.warn = () => {
        warned = true;
      };
      try {
        const el = await fixture<HelixToast>(
          '<hx-toast open variant="danger" duration="8000">Critical</hx-toast>',
        );
        await el.updateComplete;
        expect(warned).toBe(false);
      } finally {
        console.warn = original;
      }
    });

    it('does NOT warn when duration=0 (persistent toast)', async () => {
      const original = console.warn;
      let warned = false;
      console.warn = () => {
        warned = true;
      };
      try {
        const el = await fixture<HelixToast>(
          '<hx-toast open variant="danger" duration="0">Persistent critical</hx-toast>',
        );
        await el.updateComplete;
        expect(warned).toBe(false);
      } finally {
        console.warn = original;
      }
    });

    it('warns when warning variant has duration shorter than 4s', async () => {
      const original = console.warn;
      let warned = false;
      console.warn = () => {
        warned = true;
      };
      try {
        const el = await fixture<HelixToast>(
          '<hx-toast open variant="warning" duration="2000">Caution</hx-toast>',
        );
        await el.updateComplete;
        expect(warned).toBe(true);
      } finally {
        console.warn = original;
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

  // ─── (group-6 §3.2 / §5.9) No-container-role audit ───

  describe('No container role (group-6 §3.2 / §5.9)', () => {
    it('host has no role attribute (each child toast is its own live region)', async () => {
      const placements: ToastStackPlacement[] = [
        'top-start',
        'top-center',
        'top-end',
        'bottom-start',
        'bottom-center',
        'bottom-end',
      ];
      for (const placement of placements) {
        const el = await fixture<HelixToastStack>(
          `<hx-toast-stack placement="${placement}"></hx-toast-stack>`,
        );
        expect(el.hasAttribute('role')).toBe(false);
        const internals = (el as unknown as { _internals: ElementInternals })._internals;
        expect(internals.role).toBeNull();
        el.remove();
      }
    });

    it('host has no aria-live, aria-atomic, or aria-relevant', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      expect(el.hasAttribute('aria-live')).toBe(false);
      expect(el.hasAttribute('aria-atomic')).toBe(false);
      expect(el.hasAttribute('aria-relevant')).toBe(false);
    });

    it('inner base div has no role or aria-live attributes', async () => {
      const el = await fixture<HelixToastStack>('<hx-toast-stack></hx-toast-stack>');
      const base = shadowQuery(el, '[part~="base"]')!;
      expect(base.hasAttribute('role')).toBe(false);
      expect(base.hasAttribute('aria-live')).toBe(false);
    });
  });

  // ─── Stack limit enforcement (P2-02) ───

  describe('Stack limit enforcement', () => {
    afterEach(() => {
      document.querySelectorAll('hx-toast-stack').forEach((s) => s.remove());
    });

    it('hides the oldest open toast when stack limit is exceeded via toast()', async () => {
      // Use a unique placement so this test gets its own isolated stack
      const placement = 'top-center';
      const first = toast({ message: 'First', placement });
      await first.updateComplete;

      const second = toast({ message: 'Second', placement });
      await second.updateComplete;

      // Both within the default stackLimit=3, so both are open
      expect(first.open).toBe(true);
      expect(second.open).toBe(true);

      const third = toast({ message: 'Third', placement });
      await third.updateComplete;

      // Stack is now at capacity (3). Next call should hide the oldest.
      // (group-6 §5.5) MIN_DISPLAY_MS=1500 may defer the hide if the oldest
      // hasn't been on screen long enough. Wait the full minimum-display
      // window plus a small buffer before asserting displacement.
      const fourth = toast({ message: 'Fourth', placement });
      await fourth.updateComplete;
      await new Promise((r) => setTimeout(r, 1700));
      await first.updateComplete;

      // First toast should now be hidden
      expect(first.open).toBe(false);
      // Most recently added should be open
      expect(fourth.open).toBe(true);
    });

    it('does not hide any toast when under the stack limit', async () => {
      const placement = 'top-start';
      const first = toast({ message: 'First', placement });
      await first.updateComplete;

      const second = toast({ message: 'Second', placement });
      await second.updateComplete;

      // Two toasts, default limit is 3 — neither should be hidden
      expect(first.open).toBe(true);
      expect(second.open).toBe(true);
    });
  });
});

// ─── toast() utility (P1-03) ───

describe('toast() utility', () => {
  afterEach(() => {
    cleanup();
    document.querySelectorAll('hx-toast-stack').forEach((s) => s.remove());
  });

  it('creates an hx-toast-stack on document.body when none exists', async () => {
    // Ensure clean slate for this placement
    document
      .querySelectorAll('hx-toast-stack[placement="bottom-start"]')
      .forEach((s) => s.remove());

    const el = toast({ message: 'Hello', placement: 'bottom-start' });
    await el.updateComplete;

    const stack = document.querySelector('hx-toast-stack[placement="bottom-start"]');
    expect(stack).toBeTruthy();
    expect(document.body.contains(stack)).toBe(true);
  });

  it('reuses an existing hx-toast-stack for the same placement', async () => {
    const placement = 'bottom-center';
    document
      .querySelectorAll(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    const first = toast({ message: 'First', placement });
    await first.updateComplete;

    const second = toast({ message: 'Second', placement });
    await second.updateComplete;

    const stacks = document.querySelectorAll(`hx-toast-stack[placement="${placement}"]`);
    expect(stacks.length).toBe(1);
  });

  it('returns the created hx-toast element', async () => {
    const el = toast({ message: 'Test', placement: 'top-end' });
    await el.updateComplete;

    expect(el.tagName.toLowerCase()).toBe('hx-toast');
    expect(el.open).toBe(true);
  });

  it('enforces stack limit: oldest open toast is hidden when at capacity', async () => {
    const placement = 'bottom-end';
    document
      .querySelectorAll(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    // Default stackLimit is 3. Fill to capacity.
    const t1 = toast({ message: 'Toast 1', placement });
    await t1.updateComplete;
    const t2 = toast({ message: 'Toast 2', placement });
    await t2.updateComplete;
    const t3 = toast({ message: 'Toast 3', placement });
    await t3.updateComplete;

    // All three should be open at this point
    expect(t1.open).toBe(true);
    expect(t2.open).toBe(true);
    expect(t3.open).toBe(true);

    // Fourth call exceeds limit — oldest (t1) should be hidden.
    // (group-6 §5.5) Wait MIN_DISPLAY_MS+buffer for the deferred hide so AT
    // has finished announcing the displaced toast before it is removed.
    const t4 = toast({ message: 'Toast 4', placement });
    await t4.updateComplete;
    await new Promise((r) => setTimeout(r, 1700));
    await t1.updateComplete;

    expect(t1.open).toBe(false);
    expect(t4.open).toBe(true);
  });

  it('keeps visible count bounded by stackLimit during the deferred-hide window (codex p2)', async () => {
    // Regression: previously, when a `toast()` call overflowed the stack
    // while the oldest was still inside its MIN_DISPLAY_MS window, the
    // displaced toast's hide was deferred but the new toast was appended
    // and shown IMMEDIATELY — leaving 4 visible toasts on a limit-3 stack
    // for up to MIN_DISPLAY_MS. Fix queues the new toast (open=false in
    // the DOM) until the displaced slot actually frees up.
    const placement = 'top-start';
    document
      .querySelectorAll<HelixToastStack>(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    const t1 = toast({ message: 'Q1', placement });
    await t1.updateComplete;
    const t2 = toast({ message: 'Q2', placement });
    await t2.updateComplete;
    const t3 = toast({ message: 'Q3', placement });
    await t3.updateComplete;
    // Burst: appends a 4th toast while the stack is at capacity and t1 is
    // well inside its MIN_DISPLAY_MS window.
    const t4 = toast({ message: 'Q4', placement });
    await t4.updateComplete;

    // Mid-window: BEFORE the deferred displacement fires, visible count
    // (t.open === true) must equal `stackLimit`, not stackLimit+1.
    const stack = document.querySelector<HelixToastStack>(
      `hx-toast-stack[placement="${placement}"]`,
    )!;
    const midWindowVisible = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter(
      (t) => t.open,
    );
    expect(midWindowVisible.length).toBeLessThanOrEqual(stack.stackLimit);
    expect(midWindowVisible.length).toBe(stack.stackLimit);
    // The queued toast (t4) is in the DOM but not yet open.
    expect(t4.open).toBe(false);
    expect(t4.isConnected).toBe(true);

    // After the deferred-hide window elapses the queued toast should be
    // shown and the displaced toast hidden.
    await new Promise((r) => setTimeout(r, 1700));
    await t1.updateComplete;
    await t4.updateComplete;
    expect(t1.open).toBe(false);
    expect(t4.open).toBe(true);
    const settledVisible = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter(
      (t) => t.open,
    );
    expect(settledVisible.length).toBe(stack.stackLimit);
  });

  it('hides queued toast from layout flow during the deferred-show window (codex p2)', async () => {
    // Regression: even after the queued toast was kept `open=false` to
    // protect the visible-count cap, the element was still attached to
    // the DOM with the natural `:host { display: block }` rule applying
    // — so its outer wrapper occupied layout space, briefly pushed
    // earlier toasts out of position, and could be announced by some
    // ATs on insertion. Fix sets inline `display: none` on the queued
    // toast for the duration of the defer window.
    const placement = 'bottom-start';
    document
      .querySelectorAll<HelixToastStack>(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    const t1 = toast({ message: 'L1', placement });
    await t1.updateComplete;
    const t2 = toast({ message: 'L2', placement });
    await t2.updateComplete;
    const t3 = toast({ message: 'L3', placement });
    await t3.updateComplete;

    // Snapshot the height of the stack at capacity, BEFORE the queued
    // toast is appended. This is the layout footprint we expect to hold
    // for the entire defer window.
    const stack = document.querySelector<HelixToastStack>(
      `hx-toast-stack[placement="${placement}"]`,
    )!;
    const heightAtCapacity = stack.getBoundingClientRect().height;

    // Burst: 4th toast triggers the deferred-show path because t1 is
    // still well inside its MIN_DISPLAY_MS window.
    const t4 = toast({ message: 'L4', placement });
    await t4.updateComplete;

    // Mid-window assertions:
    // 1. The queued toast is in the DOM (so `t.updateComplete` and
    //    `isConnected` checks resolve).
    // 2. It is `display: none` so it contributes zero layout.
    // 3. Its own `getBoundingClientRect()` returns a 0×0 box.
    // 4. The stack's overall height has not grown — the layout footprint
    //    matches the at-capacity snapshot.
    expect(t4.isConnected).toBe(true);
    expect(t4.open).toBe(false);
    expect(t4.style.display).toBe('none');
    const t4Box = t4.getBoundingClientRect();
    expect(t4Box.width).toBe(0);
    expect(t4Box.height).toBe(0);
    expect(stack.getBoundingClientRect().height).toBe(heightAtCapacity);

    // After the deferred-show timer fires, the inline display style is
    // cleared so the natural `:host { display: block }` rule applies
    // and the toast joins the layout as the displaced one drops out.
    await new Promise((r) => setTimeout(r, 1700));
    await t1.updateComplete;
    await t4.updateComplete;
    expect(t4.open).toBe(true);
    expect(t4.style.display).toBe('');
    // The newly-shown toast must now occupy real layout space.
    const t4PostBox = t4.getBoundingClientRect();
    expect(t4PostBox.height).toBeGreaterThan(0);
  });

  it('enforces stack limit under a rapid burst within MIN_DISPLAY_MS (group-6 codex round-1)', async () => {
    // (group-6 codex round-1 burst-fix) When more than one toast() call
    // arrives inside the 1500ms minimum-display window after the stack is
    // at capacity, every call must hide a DIFFERENT successive oldest —
    // not pile multiple deferred hides on the same target. Previously the
    // factory only inspected the single oldest toast, so a 5-call burst
    // against a limit-3 stack settled at 4 visible toasts after the
    // deferred hide fired.
    const placement = 'top-end';
    document
      .querySelectorAll(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    // Fill to capacity (default stackLimit = 3).
    const t1 = toast({ message: 'Burst 1', placement });
    await t1.updateComplete;
    const t2 = toast({ message: 'Burst 2', placement });
    await t2.updateComplete;
    const t3 = toast({ message: 'Burst 3', placement });
    await t3.updateComplete;

    // Burst two more in quick succession, well inside MIN_DISPLAY_MS.
    const t4 = toast({ message: 'Burst 4', placement });
    await t4.updateComplete;
    const t5 = toast({ message: 'Burst 5', placement });
    await t5.updateComplete;

    // Wait for the deferred displacement window to elapse.
    // (need MIN_DISPLAY_MS + buffer for both deferred hides scheduled at
    // call 4 and call 5, where call 5's elapsed is slightly higher)
    await new Promise((r) => setTimeout(r, 1900));
    await t1.updateComplete;
    await t2.updateComplete;

    // The two oldest must be displaced (one per overflow slot), leaving
    // exactly stackLimit (3) toasts visible.
    expect(t1.open).toBe(false);
    expect(t2.open).toBe(false);
    expect(t3.open).toBe(true);
    expect(t4.open).toBe(true);
    expect(t5.open).toBe(true);

    const stack = document.querySelector<HelixToastStack>(
      `hx-toast-stack[placement="${placement}"]`,
    )!;
    const stillOpen = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter((t) => t.open);
    expect(stillOpen.length).toBeLessThanOrEqual(3);
  });

  it('caps visible toasts at stackLimit across a longer burst (codex p1 round-2)', async () => {
    // (codex p1 round-2 longer-burst gap) The round-1 fix solved the
    // 5-call-against-3 case by walking each survivor and queueing a
    // deferred hide per overflow slot. But for bursts longer than
    // (initial fill + stackLimit), every visible toast lands in
    // `_pendingDisplacements` after the first batch of overflow calls;
    // the next caller's `survivors[i]` returns undefined and the loop
    // exits early — leaving the new toast on the immediate-show path
    // and breaking the cap. Fix: when survivors are exhausted, the new
    // toast must still be queued for the next free slot, taken from the
    // pending-hide timeline.
    const placement = 'top-start';
    document
      .querySelectorAll(`hx-toast-stack[placement="${placement}"]`)
      .forEach((s) => s.remove());

    // Burst of 6 against stackLimit = 3 (the default).
    const burst: HelixToast[] = [];
    for (let i = 1; i <= 6; i++) {
      const el = toast({ message: `Burst ${i}`, placement });
      burst.push(el);
      // eslint-disable-next-line no-await-in-loop
      await el.updateComplete;
    }

    // Mid-burst sample: visible count must NEVER exceed stackLimit, even
    // before any deferred-hide timer fires. This is the key invariant
    // the round-2 fix protects.
    const stack = document.querySelector<HelixToastStack>(
      `hx-toast-stack[placement="${placement}"]`,
    )!;
    const midBurstVisible = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter(
      (t) => t.open,
    );
    expect(
      midBurstVisible.length,
      `mid-burst: expected ≤${stack.stackLimit} visible, got ${midBurstVisible.length}`,
    ).toBeLessThanOrEqual(stack.stackLimit);

    // Wait long enough for ALL deferred displacements + queued appends
    // to settle. The last queued append fires at most ~MIN_DISPLAY_MS
    // after its scheduling, and scheduling drifts forward across the
    // burst — give it a generous buffer.
    await new Promise((r) => setTimeout(r, 2500));
    for (const el of burst) {
      // eslint-disable-next-line no-await-in-loop
      await el.updateComplete;
    }

    // Settled: the three oldest are hidden; the three newest are visible.
    const settledVisible = [...stack.querySelectorAll<HelixToast>('hx-toast')].filter(
      (t) => t.open,
    );
    expect(
      settledVisible.length,
      `settled: expected exactly ${stack.stackLimit} visible, got ${settledVisible.length}`,
    ).toBe(stack.stackLimit);
    expect(burst[0]!.open).toBe(false);
    expect(burst[1]!.open).toBe(false);
    expect(burst[2]!.open).toBe(false);
    expect(burst[3]!.open).toBe(true);
    expect(burst[4]!.open).toBe(true);
    expect(burst[5]!.open).toBe(true);
  });

  it('removes the toast element from DOM after hx-after-hide fires', async () => {
    const el = toast({ message: 'Remove me', duration: 0, placement: 'top-start' });
    await el.updateComplete;
    expect(document.body.contains(el)).toBe(true);

    const afterHidePromise = oneEvent(el, 'hx-after-hide');
    el.hide();
    await afterHidePromise;

    expect(document.body.contains(el)).toBe(false);
  });
});

// ─── disconnectedCallback timer cleanup (P2-03) ───

describe('hx-toast disconnectedCallback timer cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('cancels auto-dismiss timer when element is removed from DOM', async () => {
    const duration = 5000;
    const el = await fixture<HelixToast>(`<hx-toast duration="${duration}">Test</hx-toast>`);
    el.show();
    await el.updateComplete;
    expect(el.open).toBe(true);

    const hideSpy = vi.spyOn(el, 'hide');

    // Detach from DOM — disconnectedCallback should clear the timer
    el.remove();

    // Advance well past the duration
    vi.advanceTimersByTime(duration * 2);

    // hide() should not have been called by the timer after disconnection
    expect(hideSpy).not.toHaveBeenCalled();
  });

  it('does not throw when removed from DOM before timer fires', async () => {
    const el = await fixture<HelixToast>('<hx-toast duration="2000">Test</hx-toast>');
    el.show();
    await el.updateComplete;

    // Remove mid-flight — should be a no-op with no errors
    expect(() => {
      el.remove();
      vi.advanceTimersByTime(5000);
    }).not.toThrow();
  });
});
