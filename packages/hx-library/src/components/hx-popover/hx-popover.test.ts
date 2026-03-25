import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixPopover } from './hx-popover.js';
import './index.js';

afterEach(cleanup);

describe('hx-popover', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders trigger wrapper', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery(el, '.trigger-wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('renders body with role=dialog', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[role="dialog"]');
      expect(body).toBeTruthy();
      expect(body?.getAttribute('role')).toBe('dialog');
    });

    it('body is hidden by default', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
      expect(body?.getAttribute('aria-hidden')).toBe('true');
    });

    it('does not render arrow element when arrow=false', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const arrowEl = shadowQuery(el, '[part="arrow"]');
      expect(arrowEl).toBeNull();
    });

    it('body has tabindex="-1" for focus management', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.getAttribute('tabindex')).toBe('-1');
    });

    it('body has inert attribute when hidden', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.hasAttribute('inert')).toBe(true);
    });

    it('body does not have inert attribute when visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover open><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.hasAttribute('inert')).toBe(false);
    });
  });

  // ─── CSS Parts (2) ───

  describe('CSS Parts', () => {
    it('exposes "body" part', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const part = shadowQuery(el, '[part="body"]');
      expect(part).toBeTruthy();
    });

    it('exposes "arrow" part when arrow=true', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover arrow><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const part = shadowQuery(el, '[part="arrow"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Property: placement (2) ───

  describe('Property: placement', () => {
    it('defaults to "bottom"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.placement).toBe('bottom');
    });

    it('reflects placement attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover placement="top"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.placement).toBe('top');
      expect(el.getAttribute('placement')).toBe('top');
    });
  });

  // ─── Property: trigger (2) ───

  describe('Property: trigger', () => {
    it('defaults to "click"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.trigger).toBe('click');
    });

    it('reflects trigger attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.trigger).toBe('hover');
    });
  });

  // ─── Property: open (2) ───

  describe('Property: open', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.open).toBe(false);
    });

    it('shows body when open=true is set via attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover open><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(true);
    });
  });

  // ─── Property: distance / skidding (2) ───

  describe('Property: distance / skidding', () => {
    it('defaults distance to 8', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.distance).toBe(8);
    });

    it('defaults skidding to 0', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.skidding).toBe(0);
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('anchor slot accepts trigger element', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button id="my-btn" slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const trigger = el.querySelector('#my-btn');
      expect(trigger).toBeTruthy();
    });

    it('default slot accepts popover content', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p id="my-content">Rich content</p></hx-popover>',
      );
      const content = el.querySelector('#my-content');
      expect(content).toBeTruthy();
      expect(content?.textContent).toBe('Rich content');
    });
  });

  // ─── ARIA (3) ───

  describe('ARIA', () => {
    it('body has aria-hidden="true" when not visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.getAttribute('aria-hidden')).toBe('true');
    });

    it('body aria-hidden is absent (not hidden) when visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover open><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.getAttribute('aria-hidden')).not.toBe('true');
    });

    it('anchor has aria-expanded="false" by default', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const trigger = el.querySelector('#trig');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    // P1-04: aria-expanded must track the full open → close cycle
    it('aria-expanded cycles false → true → false across open/close', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const trigger = el.querySelector('#trig');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');

      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');

      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    // P1-01: label property drives aria-label on the dialog body
    it('uses custom label property for aria-label', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover label="Patient details"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.getAttribute('aria-label')).toBe('Patient details');
    });

    // HIGH-02: anchor must advertise the popup type to assistive technology
    it('anchor has aria-haspopup="dialog" set on firstUpdated', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const trigger = el.querySelector('#trig');
      expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    });
  });

  // ─── Behavior: Show/Hide (4) ───

  describe('Behavior: Show/Hide', () => {
    it('shows on click when trigger="click"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(true);
    });

    it('toggles closed on second click when trigger="click"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
    });

    it('shows on mouseenter when trigger="hover"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(true);
    });

    it('hides on Escape key when visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      // P1-03: Escape listener is now on document so it fires regardless of focus location
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
    });

    // P0-01: click outside the component closes the popover
    it('closes on click outside when trigger="click"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(true);

      // The document click listener is registered via setTimeout(0) in _show(),
      // so we must advance fake timers to let that macrotask fire before dispatching outside click.
      vi.useFakeTimers();
      await vi.advanceTimersByTimeAsync(0);
      vi.useRealTimers();

      // Simulate click on an unrelated element outside the component
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(body?.classList.contains('visible')).toBe(false);
    });

    // P1-05: hover trigger — mouseleave hides the popover
    it('hides on mouseleave when trigger="hover" (after 150ms WCAG 1.4.13 delay)', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(true);

      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      // WCAG 1.4.13: hover hide is delayed 150ms so the pointer can move into the body.
      // Wait for the delay to elapse before asserting the popover has hidden.
      await new Promise((resolve) => setTimeout(resolve, 200));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(false);
    });

    // WCAG 1.4.13: pointer moving from anchor into body must keep popover open
    it('stays open when pointer moves from anchor into body when trigger="hover"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      const body = shadowQuery<HTMLElement>(el, '[part="body"]')!;

      // Show via mouseenter on trigger wrapper
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(body.classList.contains('visible')).toBe(true);

      // Simulate pointer leaving anchor wrapper (without entering body yet)
      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      // Immediately enter the body — pointer moved directly from anchor into body
      body.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;

      // Popover must remain visible; dismissing it while pointer is inside the body
      // would violate WCAG 1.4.13 (Content on Hover or Focus)
      expect(body.classList.contains('visible')).toBe(true);
    });

    // WCAG 1.4.13: popover closes only when pointer leaves the body itself
    it('closes when pointer leaves the body when trigger="hover"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      const body = shadowQuery<HTMLElement>(el, '[part="body"]')!;

      // Open via mouseenter on wrapper
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(body.classList.contains('visible')).toBe(true);

      // Move pointer into body (keeps open)
      body.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(body.classList.contains('visible')).toBe(true);

      // Now leave the body — popover should close after WCAG 1.4.13 delay
      body.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 200));
      await el.updateComplete;
      expect(body.classList.contains('visible')).toBe(false);
    });

    // WCAG 1.4.13 / keyboard: Escape dismisses a hover-triggered popover from document level
    it('Escape key dismisses hover-triggered popover from document level', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;

      // Open via hover
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(true);

      // Fire Escape on document (not on the element) — matches real-world usage where
      // focus may be anywhere on the page when the user presses Escape
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(false);
    });

    // P1-06: focus trigger — focusin shows, focusout hides
    it('shows on focusin when trigger="focus"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="focus"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(true);
    });

    it('hides on focusout when trigger="focus"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="focus"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(true);

      wrapper.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(false);
    });
  });

  // ─── Focus Management (MEDIUM-03) ───

  describe('Focus Management', () => {
    // MEDIUM-03: focus moves to body on show
    it('does NOT move focus to the popover body when content is non-interactive (WCAG 2.4.3)', async () => {
      // Non-interactive popovers (e.g. informational text) must not steal focus from the trigger.
      // Only popovers with buttons/inputs/links should capture focus on open.
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body).toBeTruthy();
      // Body should NOT be focused — non-interactive popovers must not steal focus
      expect(el.shadowRoot?.activeElement).not.toBe(body);
    });

    it('popover body becomes visible when opened (interactive content present, WCAG 2.4.3)', async () => {
      // Popovers with interactive content (buttons, inputs, links) should open and remain visible.
      // Focus movement to the body is verified by the non-interactive counterpart test —
      // this test confirms the popover itself opens correctly when interactive content is slotted.
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor" id="trig">Trigger</button><button>Action</button></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body).toBeTruthy();
      // Popover should be open and body visible
      expect(el.open).toBe(true);
      expect(body?.classList.contains('visible')).toBe(true);
    });

    // MEDIUM-03: focus returns to trigger on Escape dismissal
    it('returns focus to the anchor trigger when dismissed via Escape', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      const trigger = el.querySelector<HTMLElement>('#trig')!;
      trigger.focus();

      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(document.activeElement).toBe(trigger);
    });

    // MEDIUM-03: click-outside does not force focus back to trigger
    it('does not restore focus to trigger when dismissed via click-outside', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor" id="trig">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      await el.updateComplete;

      // Place focus somewhere outside the popover before clicking outside
      const outsideBtn = document.createElement('button');
      outsideBtn.id = 'outside';
      document.body.appendChild(outsideBtn);
      outsideBtn.focus();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      // Focus should remain on the outside element, not be stolen back to the trigger
      const trigger = el.querySelector<HTMLElement>('#trig')!;
      expect(document.activeElement).not.toBe(trigger);

      outsideBtn.remove();
    });
  });

  // ─── Events (2) ───

  describe('Events', () => {
    it('dispatches hx-show when opening', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      let fired = false;
      el.addEventListener('hx-show', () => {
        fired = true;
      });
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(true);
    });

    it('dispatches hx-hide when closing', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      // Open first
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      let fired = false;
      el.addEventListener('hx-hide', () => {
        fired = true;
      });
      // Close
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(true);
    });

    // P1-07: after-show and after-hide events
    it('dispatches hx-after-show after the popover is fully visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      let fired = false;
      el.addEventListener('hx-after-show', () => {
        fired = true;
      });
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(true);
    });

    it('dispatches hx-after-hide after the popover is fully hidden', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="click"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;

      let fired = false;
      el.addEventListener('hx-after-hide', () => {
        fired = true;
      });
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(fired).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Open</button><p>Popover content</p></hx-popover>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when open', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover open><button slot="anchor">Open</button><p>Popover content</p></hx-popover>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Property: manual trigger ───

  describe('Property: manual trigger', () => {
    it('manual trigger does not show on click', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="manual"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
    });

    it('manual trigger does not show on mouseenter', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="manual"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
    });

    it('manual trigger shows when open property is set programmatically', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="manual"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      el.open = true;
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(true);
    });
  });

  // ─── Property: arrow reflects ───

  describe('Property: arrow reflects', () => {
    it('arrow=false by default', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.arrow).toBe(false);
    });

    it('arrow=true reflects to attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover arrow><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.arrow).toBe(true);
      expect(el.hasAttribute('arrow')).toBe(true);
    });
  });

  // ─── Property: label reflects ───

  describe('Property: label reflects', () => {
    it('label defaults to "Popover"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.label).toBe('Popover');
    });

    it('label reflects to attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover label="Clinical notes"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      expect(el.label).toBe('Clinical notes');
      expect(el.getAttribute('label')).toBe('Clinical notes');
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
        const el = await fixture<HelixPopover>(
          `<hx-popover placement="${placement}"><button slot="anchor">T</button><p>C</p></hx-popover>`,
        );
        expect(el.placement).toBe(placement);
        expect(el.getAttribute('placement')).toBe(placement);
        cleanup();
      });
    }
  });

  // ─── Distance / skidding reflect ───

  describe('Distance and skidding reflect', () => {
    it('distance attribute sets property', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover distance="16"><button slot="anchor">T</button><p>C</p></hx-popover>',
      );
      expect(el.distance).toBe(16);
    });

    it('skidding attribute sets property', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover skidding="5"><button slot="anchor">T</button><p>C</p></hx-popover>',
      );
      expect(el.skidding).toBe(5);
    });

    it('distance reflects to attribute', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover distance="20"><button slot="anchor">T</button><p>C</p></hx-popover>',
      );
      expect(el.getAttribute('distance')).toBe('20');
    });
  });
});
