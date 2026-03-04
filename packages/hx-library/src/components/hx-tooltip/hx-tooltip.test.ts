import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTooltip } from './hx-tooltip.js';
import './index.js';

afterEach(cleanup);

describe('hx-tooltip', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "tooltip" CSS part', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.getAttribute('part')).toBe('tooltip');
    });

    it('exposes "arrow" CSS part', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Trigger</button></hx-tooltip>',
      );
      const arrow = shadowQuery(el, '[part="arrow"]');
      expect(arrow).toBeTruthy();
      expect(arrow?.getAttribute('part')).toBe('arrow');
    });

    it('renders default slot', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Trigger</button></hx-tooltip>',
      );
      const slottedButton = el.querySelector('button');
      expect(slottedButton).toBeTruthy();
      expect(slottedButton?.textContent).toBe('Trigger');
    });

    it('tooltip element has role="tooltip"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('role')).toBe('tooltip');
    });
  });

  // ─── Property: content (2) ───

  describe('Property: content', () => {
    it('tooltip displays content text', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Patient allergy information"><button>Info</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.textContent?.trim()).toContain('Patient allergy information');
    });

    it('empty content renders empty tooltip', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content=""><button>Info</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      // The tooltip text node should be empty; only the arrow span child is present
      const textContent = Array.from(tooltip?.childNodes ?? [])
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
      expect(textContent).toBe('');
    });
  });

  // ─── Property: placement (5) ───

  describe('Property: placement', () => {
    it('defaults to "top"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.placement).toBe('top');
    });

    it('reflects placement attribute to host', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" placement="bottom"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.getAttribute('placement')).toBe('bottom');
    });

    it('accepts placement="bottom"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" placement="bottom"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.placement).toBe('bottom');
    });

    it('accepts placement="left"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" placement="left"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.placement).toBe('left');
    });

    it('accepts placement="right"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" placement="right"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.placement).toBe('right');
    });

    it('accepts placement="auto"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" placement="auto"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.placement).toBe('auto');
    });
  });

  // ─── Property: delay (2) ───

  describe('Property: delay', () => {
    it('defaults to 300', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.delay).toBe(300);
    });

    it('accepts custom delay value', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" delay="500"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.delay).toBe(500);
    });
  });

  // ─── Property: disabled (3) ───

  describe('Property: disabled', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.disabled).toBe(false);
    });

    it('reflects disabled attribute to host', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" disabled><button>Trigger</button></hx-tooltip>',
      );
      expect(el.hasAttribute('disabled')).toBe(true);
    });

    it('when disabled, tooltip stays hidden on focusin', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help" disabled><button>Trigger</button></hx-tooltip>',
      );
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('tooltip element has role="tooltip"', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[role="tooltip"]');
      expect(tooltip).toBeTruthy();
    });

    it('tooltip aria-hidden is "true" when closed', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });

    it('trigger gets aria-describedby set on slotchange', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Click</button></hx-tooltip>',
      );
      // Allow slotchange to fire and updateComplete to settle
      await el.updateComplete;
      const button = el.querySelector('button');
      expect(button?.hasAttribute('aria-describedby')).toBe(true);
      // The aria-describedby value must be a non-empty string matching the tooltip's id
      const describedBy = button?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.length).toBeGreaterThan(0);
      const tooltipEl = shadowQuery(el, '[part="tooltip"]');
      expect(tooltipEl?.id).toBe(describedBy);
    });

    it('axe-core has no violations in default state', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help text"><button>Info</button></hx-tooltip>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Interaction: hover (3) ───

  describe('Interaction: hover', () => {
    it('tooltip is hidden by default (aria-hidden="true", no tooltip--visible class)', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
    });

    it('tooltip shows on mouseenter after delay', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixTooltip>(
          '<hx-tooltip content="Help" delay="300"><button>Trigger</button></hx-tooltip>',
        );

        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));

        // Tooltip must still be hidden before delay elapses
        await el.updateComplete;
        const tooltip = shadowQuery(el, '[part="tooltip"]');
        expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);

        // Advance timers past the 300 ms delay
        vi.advanceTimersByTime(300);
        await el.updateComplete;

        expect(tooltip?.classList.contains('tooltip--visible')).toBe(true);
        expect(tooltip?.getAttribute('aria-hidden')).toBe('false');
      } finally {
        vi.useRealTimers();
      }
    });

    it('tooltip hides on mouseleave', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixTooltip>(
          '<hx-tooltip content="Help" delay="300"><button>Trigger</button></hx-tooltip>',
        );

        // Open the tooltip via mouseenter + advance timers
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));
        vi.advanceTimersByTime(300);
        await el.updateComplete;

        const tooltip = shadowQuery(el, '[part="tooltip"]');
        expect(tooltip?.classList.contains('tooltip--visible')).toBe(true);

        // Now fire mouseleave — tooltip should close immediately
        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
        expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ─── Interaction: focus (2) ───

  describe('Interaction: focus', () => {
    it('tooltip shows immediately on focusin (no delay)', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );

      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;

      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(true);
      expect(tooltip?.getAttribute('aria-hidden')).toBe('false');
    });

    it('tooltip hides on focusout', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );

      // Open via focusin
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;

      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(true);

      // Close via focusout
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
      await el.updateComplete;

      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Interaction: keyboard (2) ───

  describe('Interaction: keyboard', () => {
    it('Escape key hides open tooltip', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );

      // Open via focusin
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;

      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(true);

      // Dismiss with Escape
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });

    it('Escape key does nothing when tooltip is already closed', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );

      const tooltip = shadowQuery(el, '[part="tooltip"]');
      // Confirm starting state is closed
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);

      // Fire Escape on an already-closed tooltip — should not throw or change state
      el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('tooltip part is accessible for external styling', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.getAttribute('part')).toBe('tooltip');
    });

    it('arrow part is accessible for external styling', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      const arrow = shadowQuery(el, '[part="arrow"]');
      expect(arrow).toBeTruthy();
      expect(arrow?.getAttribute('part')).toBe('arrow');
    });
  });

  // ─── Dynamic Updates (3) ───

  describe('Dynamic Updates', () => {
    it('updates content text when property changes', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Original"><button>Info</button></hx-tooltip>',
      );
      el.content = 'Updated help text';
      await el.updateComplete;
      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.textContent?.trim()).toContain('Updated help text');
    });

    it('disabling an open tooltip hides it on next focus attempt', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );

      // Open via focusin
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;

      // Close it first so we can test disabled prevents re-opening
      el.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
      await el.updateComplete;

      // Now disable the tooltip
      el.disabled = true;
      await el.updateComplete;

      // Attempt to open via focusin — should be blocked
      el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      await el.updateComplete;

      const tooltip = shadowQuery(el, '[part="tooltip"]');
      expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
      expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
    });

    it('reflects placement attribute when property changes', async () => {
      const el = await fixture<HelixTooltip>(
        '<hx-tooltip content="Help"><button>Trigger</button></hx-tooltip>',
      );
      expect(el.getAttribute('placement')).toBe('top');

      el.placement = 'right';
      await el.updateComplete;
      expect(el.getAttribute('placement')).toBe('right');
    });
  });

  // ─── Hover disabled suppression (1) ───

  describe('Disabled: hover suppression', () => {
    it('when disabled, tooltip does not show on mouseenter after delay', async () => {
      vi.useFakeTimers();
      try {
        const el = await fixture<HelixTooltip>(
          '<hx-tooltip content="Help" disabled delay="300"><button>Trigger</button></hx-tooltip>',
        );

        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));
        vi.advanceTimersByTime(300);
        await el.updateComplete;

        const tooltip = shadowQuery(el, '[part="tooltip"]');
        expect(tooltip?.classList.contains('tooltip--visible')).toBe(false);
        expect(tooltip?.getAttribute('aria-hidden')).toBe('true');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
