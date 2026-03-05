import { describe, it, expect, afterEach } from 'vitest';
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
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Behavior: Show/Hide (4) ───

  describe('Behavior: Show/Hide', () => {
    it('shows tooltip on mouseenter', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
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
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;

      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));
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
      await new Promise((r) => setTimeout(r, 50));
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
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('visible')).toBe(false);
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
  });
});
