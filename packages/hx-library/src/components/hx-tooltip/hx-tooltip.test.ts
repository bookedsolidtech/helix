import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTooltip } from './hx-tooltip.js';
import './index.js';

afterEach(cleanup);

describe('hx-tooltip', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders trigger wrapper', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery(el, '.trigger-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('renders tooltip with role=tooltip', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[role="tooltip"]');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
    });

    it('tooltip is hidden by default', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "tooltip" part', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const part = shadowQuery(el, '[part="tooltip"]');
      expect(part).toBeTruthy();
    });

    it('exposes "arrow" part', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const part = shadowQuery(el, '[part="arrow"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: placement (2) ───

  describe('Property: placement', () => {
    it('defaults to "top"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.placement).toBe('top');
    });

    it('reflects placement attribute', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip placement="bottom"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.placement).toBe('bottom');
      expect(el.getAttribute('placement')).toBe('bottom');
    });
  });

  // ─── Property: showDelay / hideDelay (2) ───

  describe('Property: showDelay / hideDelay', () => {
    it('defaults showDelay to 300', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.showDelay).toBe(300);
    });

    it('defaults hideDelay to 100', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.hideDelay).toBe(100);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot accepts trigger content', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button id="my-btn">Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const trigger = el.querySelector('#my-btn');
      expect(trigger).toBeTruthy();
      expect(trigger?.textContent).toBe('Trigger');
    });

    it('content slot accepts tooltip text', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">My tip text</span></hx-tooltip>',
      );
      const content = el.querySelector('[slot="content"]');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe('My tip text');
    });
  });

  // ─── Accessibility: ARIA (3) ───

  describe('ARIA', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('sets aria-describedby on trigger element pointing to tooltip id', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button id="trig">Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      const trigger = el.querySelector('#trig');
      const tooltipEl = shadowQuery(el, '[role="tooltip"]');
      const describedById = trigger?.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      expect(tooltipEl?.id).toBe(describedById);
    });

    it('tooltip has aria-hidden="true" when not visible', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });

    it('tooltip aria-hidden becomes "false" when shown', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Behavior: Show/Hide (4) ───

  describe('Behavior: Show/Hide', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('shows tooltip on mouseenter', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(true);
    });

    it('hides tooltip on mouseleave', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;

      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(false);
    });

    it('shows tooltip on focusin', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(true);
    });

    it('hides tooltip on Escape key', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(false);
    });

    it('hides tooltip on focusout', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(true);

      wrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(false);
    });

    it('respects custom show-delay and hide-delay', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="500" hide-delay="200"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.showDelay).toBe(500);
      expect(el.hideDelay).toBe(200);

      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Advance less than show-delay — tooltip should not be visible yet
      vi.advanceTimersByTime(200);
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(false);

      // Advance past show-delay
      vi.advanceTimersByTime(300);
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(true);
    });

    it('cleans up timers on disconnectedCallback', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="500"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Disconnect before timer fires
      el.remove();

      // Timers should have been cleared — no errors
      vi.runAllTimers();
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Help</button><span slot="content">Helpful context</span></hx-tooltip>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in visible state', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Help</button><span slot="content">Helpful context</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      // Allow microtask queue to flush so the show-delay=0 timer fires and Lit reactive updates complete
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;
      await page.screenshot();
      // Disable color-contrast: axe cannot compute the visual background for slotted
      // light-DOM content inside a shadow DOM tooltip — it detects the page background
      // instead of the tooltip's dark background. This is a known axe limitation with
      // shadow DOM, not an actual contrast failure.
      const { violations } = await checkA11y(el, {
        rules: { 'color-contrast': { enabled: false } },
      });
      expect(violations).toEqual([]);
    });
  });
});
