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

    it('keeps tooltip visible when hovering over tooltip content', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      const tooltipEl = shadowQuery<HTMLElement>(el, '[part="tooltip"]')!;

      // Show tooltip via mouseenter on trigger
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(tooltipEl.classList.contains('visible')).toBe(true);

      // Mouse leaves trigger
      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      // Mouse enters tooltip content — should cancel hide timer
      tooltipEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(tooltipEl.classList.contains('visible')).toBe(true);
    });

    it('hides tooltip when mouse leaves tooltip content', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      const tooltipEl = shadowQuery<HTMLElement>(el, '[part="tooltip"]')!;

      // Show tooltip
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;

      // Hover over tooltip, then leave
      tooltipEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      tooltipEl.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(tooltipEl.classList.contains('visible')).toBe(false);
    });

    it('does not hide on mouseleave when trigger is focused', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      const trigger = el.querySelector('button')!;

      // Focus trigger to show tooltip
      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(true);

      // Simulate focus on the trigger element
      trigger.focus();

      // Mouse leaves trigger — tooltip should stay because trigger is focused
      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(true);
    });
  });

  // ─── Disconnected cleanup ───

  describe('Disconnected cleanup', () => {
    it('removes light DOM description element on disconnect', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>Trigger</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;

      // The visually-hidden description span is appended to document.body (not el),
      // so we find it via the trigger's aria-describedby attribute.
      const trigger = el.querySelector('button') as HTMLElement;
      const descId = trigger.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      const descSpan = document.getElementById(descId!);
      expect(descSpan).toBeTruthy();

      el.remove();

      // The description should have been removed from document.body on disconnect
      expect(document.getElementById(descId!)).toBeNull();
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

  // ─── Placement variants ───

  describe('Placement variants', () => {
    const placements = [
      'top',
      'top-start',
      'top-end',
      'right',
      'right-start',
      'right-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'left',
      'left-start',
      'left-end',
    ] as const;

    for (const placement of placements) {
      it(`placement="${placement}" reflects to attribute`, async () => {
        const el = await fixture<HelixTooltip>(
          `<hx-tooltip placement="${placement}"><button>T</button><span slot="content">Tip</span></hx-tooltip>`,
        );
        expect(el.placement).toBe(placement);
        expect(el.getAttribute('placement')).toBe(placement);
        cleanup();
      });
    }
  });

  // ─── Show/hide delay attributes ───

  describe('show-delay and hide-delay attributes', () => {
    it('show-delay attribute sets showDelay property', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="750"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.showDelay).toBe(750);
    });

    it('hide-delay attribute sets hideDelay property', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip hide-delay="250"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(el.hideDelay).toBe(250);
    });
  });

  // ─── ARIA describedby light DOM ───

  describe('Light DOM description element', () => {
    it('inserts a visually-hidden span into document.body for aria-describedby', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button id="t">Trigger</button><span slot="content">Tooltip text</span></hx-tooltip>',
      );
      await el.updateComplete;
      // The visually-hidden description span is appended to document.body (not the host element),
      // so the ID resolves across shadow DOM boundaries.
      const trigger = el.querySelector('#t') as HTMLElement;
      const descId = trigger.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      const descSpan = document.getElementById(descId!) as HTMLElement | null;
      expect(descSpan).toBeTruthy();
      expect(descSpan?.textContent).toBe('Tooltip text');
    });

    it('aria-describedby on trigger resolves to the light DOM span id', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button id="t">Trigger</button><span slot="content">Tip text</span></hx-tooltip>',
      );
      await el.updateComplete;
      const trigger = el.querySelector('#t') as HTMLElement;
      const describedById = trigger.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      // The referenced element must live in document scope (not shadow root)
      const referencedEl = document.getElementById(describedById!);
      expect(referencedEl).toBeTruthy();
      expect(referencedEl?.textContent).toBe('Tip text');
    });
  });

  // ─── Escape key when not visible ───

  describe('Escape key guard', () => {
    it('Escape key when tooltip is hidden does not cause errors', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      // Tooltip is not visible — Escape should be a no-op
      expect(() => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });
  });

  // ─── Non-KeyboardEvent dispatched on keydown listener (1) ───

  describe('Keydown event type guard', () => {
    it('dispatching a non-KeyboardEvent on keydown listener does not throw', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      expect(() => {
        el.dispatchEvent(new Event('keydown', { bubbles: true }));
      }).not.toThrow();
    });
  });

  // ─── showDelay / hideDelay zero-value coverage (2) ───

  describe('Zero-value delay properties', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('show-delay="0" shows tooltip immediately after timer flush', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(true);
    });

    it('hide-delay="0" hides tooltip immediately after timer flush', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip show-delay="0" hide-delay="0"><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      vi.runAllTimers();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="tooltip"]')?.classList.contains('visible')).toBe(false);
    });
  });

  // ─── Content slot update re-runs ARIA setup (1) ───

  describe('Content slot change updates light DOM description', () => {
    it('light DOM description text matches content slot text', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Initial tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      // The description span is in document.body, not the host element.
      const trigger = el.querySelector('button') as HTMLElement;
      const descId = trigger.getAttribute('aria-describedby');
      const descSpan = descId ? document.getElementById(descId) : null;
      expect(descSpan?.textContent).toBe('Initial tip');
    });
  });

  // ─── Reconnect re-sets ARIA (1) ───

  describe('Reconnect re-sets ARIA', () => {
    it('does not throw when element is removed and re-appended', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Tip</span></hx-tooltip>',
      );
      await el.updateComplete;
      expect(() => {
        el.remove();
        document.body.appendChild(el);
      }).not.toThrow();
      el.remove();
    });
  });

  // ─── Slotted content text observer (group-4 round-1) ───

  describe('Slotted content text observer', () => {
    it('in-place text mutation on the slotted content updates the document-scope shim', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button id="tt-trigger-1">T</button><span slot="content" id="tt-content-1">Initial tip</span></hx-tooltip>',
      );
      await el.updateComplete;

      const trigger = el.querySelector<HTMLElement>('#tt-trigger-1')!;
      const descId = trigger.getAttribute('aria-describedby');
      expect(descId).toBeTruthy();
      let descSpan = descId ? document.getElementById(descId) : null;
      expect(descSpan?.textContent).toBe('Initial tip');

      // Simulate framework-style in-place text rewrite (Vue / React keyed text rerender).
      const slotted = el.querySelector<HTMLElement>('#tt-content-1')!;
      slotted.textContent = 'Updated tip';
      // MutationObserver runs in the next microtask.
      await new Promise((resolve) => setTimeout(resolve, 0));

      descSpan = descId ? document.getElementById(descId) : null;
      expect(descSpan?.textContent).toBe('Updated tip');
    });

    it('subtree text mutation (nested element) re-syncs the shim', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content"><strong id="tt-nested-1">Bold</strong> rest</span></hx-tooltip>',
      );
      await el.updateComplete;

      const trigger = el.querySelector<HTMLElement>('button')!;
      const descId = trigger.getAttribute('aria-describedby');
      const initialDescSpan = descId ? document.getElementById(descId) : null;
      expect(initialDescSpan?.textContent).toContain('Bold');

      const nested = el.querySelector<HTMLElement>('#tt-nested-1')!;
      nested.textContent = 'Heavy';
      await new Promise((resolve) => setTimeout(resolve, 0));

      const descSpan = descId ? document.getElementById(descId) : null;
      expect(descSpan?.textContent).toContain('Heavy');
    });

    it('shim is removed from document.body on disconnect', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content" id="tt-content-2">Cleanup tip</span></hx-tooltip>',
      );
      await el.updateComplete;

      const trigger = el.querySelector<HTMLElement>('button')!;
      const descId = trigger.getAttribute('aria-describedby')!;
      // Shim must exist BEFORE disconnect.
      expect(document.getElementById(descId)).toBeTruthy();

      el.remove();
      // Disconnect cleanup runs synchronously inside `disconnectedCallback`.
      expect(document.getElementById(descId)).toBeNull();
    });

    it('multiple tooltips have unique shim ids', async () => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <hx-tooltip><button>A</button><span slot="content">Tip A</span></hx-tooltip>
        <hx-tooltip><button>B</button><span slot="content">Tip B</span></hx-tooltip>
      `;
      document.body.appendChild(wrapper);
      const tooltips = wrapper.querySelectorAll<HelixTooltip>('hx-tooltip');
      for (const t of tooltips) {
        await t.updateComplete;
      }
      const triggers = wrapper.querySelectorAll<HTMLButtonElement>('button');
      const idA = triggers[0]?.getAttribute('aria-describedby');
      const idB = triggers[1]?.getAttribute('aria-describedby');
      expect(idA).toBeTruthy();
      expect(idB).toBeTruthy();
      expect(idA).not.toBe(idB);
      // Each shim is unique in document.body.
      expect(document.getElementById(idA!)?.textContent).toBe('Tip A');
      expect(document.getElementById(idB!)?.textContent).toBe('Tip B');
      wrapper.remove();
    });

    it('cross-shadow hosting: tooltip inside a host shadow root still creates a document-scope shim', async () => {
      // Define a one-off host element with a shadow root that contains hx-tooltip.
      class TooltipHost extends HTMLElement {
        connectedCallback(): void {
          if (this.shadowRoot) return;
          const root = this.attachShadow({ mode: 'open' });
          root.innerHTML =
            '<hx-tooltip><button>Inner</button><span slot="content">Nested tip</span></hx-tooltip>';
        }
      }
      if (!customElements.get('tooltip-host-x')) {
        customElements.define('tooltip-host-x', TooltipHost);
      }
      const host = document.createElement('tooltip-host-x');
      document.body.appendChild(host);
      const tooltip = host.shadowRoot!.querySelector<HelixTooltip>('hx-tooltip')!;
      await tooltip.updateComplete;
      const trigger = host.shadowRoot!.querySelector<HTMLElement>('button')!;
      const descId = trigger.getAttribute('aria-describedby')!;
      // Shim lives in document.body even when the tooltip is nested in a shadow root.
      const descSpan = document.getElementById(descId);
      expect(descSpan).toBeTruthy();
      expect(descSpan?.textContent).toBe('Nested tip');
      host.remove();
      // After disconnect, the shim is gone.
      expect(document.getElementById(descId)).toBeNull();
    });

    it('observer is reinstalled on slotchange — replaced content still tracked', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip><button>T</button><span slot="content">Original</span></hx-tooltip>',
      );
      await el.updateComplete;
      const trigger = el.querySelector<HTMLElement>('button')!;
      const descId = trigger.getAttribute('aria-describedby')!;

      // Replace the slotted content element entirely (slotchange fires).
      const oldContent = el.querySelector<HTMLElement>('span[slot="content"]')!;
      oldContent.remove();
      const newContent = document.createElement('span');
      newContent.setAttribute('slot', 'content');
      newContent.textContent = 'Replaced';
      el.appendChild(newContent);
      // Allow slotchange + sync to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));
      await el.updateComplete;
      let descSpan = document.getElementById(descId);
      expect(descSpan?.textContent).toBe('Replaced');

      // Now mutate the NEW content's text in place — the observer must follow the new node.
      newContent.textContent = 'Replaced again';
      await new Promise((resolve) => setTimeout(resolve, 0));
      descSpan = document.getElementById(descId);
      expect(descSpan?.textContent).toBe('Replaced again');
    });
  });
});
