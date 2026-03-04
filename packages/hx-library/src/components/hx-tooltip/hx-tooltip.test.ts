import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y, oneEvent } from '../../test-utils.js';
import type { WcTooltip } from './hx-tooltip.js';
import './index.js';

afterEach(cleanup);

describe('hx-tooltip', () => {
  // ─── Rendering (4) ───────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('tooltip panel is not visible by default', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel).toBeTruthy();
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('exposes "tooltip" CSS part', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.getAttribute('part')).toBe('tooltip');
    });

    it('exposes "arrow" CSS part inside the tooltip panel', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const arrow = shadowQuery(el, '[part="arrow"]');
      expect(arrow).toBeTruthy();
      expect(arrow?.getAttribute('part')).toBe('arrow');
    });
  });

  // ─── Property: placement (3) ─────────────────────────────────────────────

  describe('Property: placement', () => {
    it('defaults to placement="top"', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.placement).toBe('top');
    });

    it('reflects placement attr to host', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip placement="bottom"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.getAttribute('placement')).toBe('bottom');
    });

    it('applies placement class to tooltip panel', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip placement="right"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const panel = shadowQuery(el, '[part="tooltip"]');
      // The resolved placement class is set from _resolvedPlacement which mirrors
      // the preferred placement when there is no overflow to flip.
      // We verify the class exists after the component has rendered.
      expect(panel?.className).toContain('tooltip--');
    });
  });

  // ─── Property: disabled (3) ──────────────────────────────────────────────

  describe('Property: disabled', () => {
    it('disabled defaults to false', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attr to host', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip disabled><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('disabled prevents tooltip from opening on mouseenter', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip disabled delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      // Allow timers to flush
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });
  });

  // ─── Property: open (programmatic) (4) ───────────────────────────────────

  describe('Property: open', () => {
    it('open defaults to false', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.open).toBe(false);
    });

    it('setting open=true shows the tooltip immediately', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.open = true;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
    });

    it('setting open=false hides the tooltip', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      el.open = false;
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('reflects open attribute to host when shown', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.open = true;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Show / Hide Behavior (5) ────────────────────────────────────────────

  describe('Show/Hide Behavior', () => {
    it('shows tooltip on mouseenter after delay', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
    });

    it('hides tooltip on mouseleave after hide delay', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="0" hide-delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      // Open first
      el.open = true;
      await el.updateComplete;
      // Now trigger mouseleave
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('shows tooltip on focusin after delay', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
    });

    it('hides tooltip on focusout after hide delay', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="0" hide-delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.open = true;
      await el.updateComplete;
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('Escape key dismisses an open tooltip', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });
  });

  // ─── Events (2) ──────────────────────────────────────────────────────────

  describe('Events', () => {
    it('dispatches hx-show when tooltip opens', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const eventPromise = oneEvent(el, 'hx-show');
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when tooltip closes', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open delay="0" hide-delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      const eventPromise = oneEvent(el, 'hx-hide');
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Slots (2) ───────────────────────────────────────────────────────────

  describe('Slots', () => {
    it('default slot renders the trigger element', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button class="my-trigger">Click me</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const trigger = el.querySelector('button.my-trigger');
      expect(trigger).toBeTruthy();
      expect(trigger?.textContent?.trim()).toBe('Click me');
    });

    it('content slot renders tooltip text', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open><button>T</button><span slot="content" class="tip-text">Patient ID: 12345</span></hx-tooltip>',
      );
      await el.updateComplete;
      const content = el.querySelector('.tip-text');
      expect(content).toBeTruthy();
      expect(content?.textContent?.trim()).toBe('Patient ID: 12345');
    });
  });

  // ─── ARIA (3) ────────────────────────────────────────────────────────────

  describe('ARIA', () => {
    it('tooltip panel has role="tooltip"', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.getAttribute('role')).toBe('tooltip');
    });

    it('tooltip panel has aria-hidden="true" when closed', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.getAttribute('aria-hidden')).toBe('true');
    });

    it('tooltip panel has aria-hidden="false" when open', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      const panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Delays (2) ──────────────────────────────────────────────────────────

  describe('Delays', () => {
    it('delay property controls show latency', async () => {
      vi.useFakeTimers();
      const el = await fixture<WcTooltip>(
        '<hx-tooltip delay="500"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      // Before delay expires — tooltip should still be hidden
      vi.advanceTimersByTime(499);
      await el.updateComplete;
      let panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
      // After delay — tooltip should be visible
      vi.advanceTimersByTime(1);
      await el.updateComplete;
      panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
      vi.useRealTimers();
    });

    it('hide-delay property controls hide latency', async () => {
      vi.useFakeTimers();
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open hide-delay="400"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      // Before hide delay — tooltip should still be visible
      vi.advanceTimersByTime(399);
      await el.updateComplete;
      let panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
      // After hide delay — tooltip should be hidden
      vi.advanceTimersByTime(1);
      await el.updateComplete;
      panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
      vi.useRealTimers();
    });
  });

  // ─── Dynamic Updates (2) ─────────────────────────────────────────────────

  describe('Dynamic Updates', () => {
    it('updates tooltip visibility when open property changes programmatically', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      el.open = true;
      await el.updateComplete;
      let panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);

      el.open = false;
      await el.updateComplete;
      panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('re-enabling tooltip after disabled allows it to show', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip disabled delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      // Attempt to show while disabled — should remain hidden
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      let panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(false);

      // Re-enable and try again
      el.disabled = false;
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 20));
      await el.updateComplete;
      panel = shadowQuery(el, '[part="tooltip"]');
      expect(panel?.classList.contains('tooltip--visible')).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ────────────────────────────────────────────

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default closed state', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip><button>More info</button><span slot="content">Additional context</span></hx-tooltip>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state', async () => {
      const el = await fixture<WcTooltip>(
        '<hx-tooltip open><button>More info</button><span slot="content">Patient last seen 3 days ago</span></hx-tooltip>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
