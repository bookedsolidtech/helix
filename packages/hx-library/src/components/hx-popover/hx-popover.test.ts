import { describe, it, expect, afterEach } from 'vitest';
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

    it('renders body with role=region', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const body = shadowQuery(el, '[role="region"]');
      expect(body).toBeTruthy();
      expect(body?.getAttribute('role')).toBe('region');
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

    it('body has aria-hidden="false" when visible', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover open><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.getAttribute('aria-hidden')).toBe('false');
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

      // Wait for the deferred document listener to be attached
      await new Promise((r) => setTimeout(r, 10));

      // Simulate click on an unrelated element outside the component
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await el.updateComplete;
      expect(body?.classList.contains('visible')).toBe(false);
    });

    // P1-05: hover trigger — mouseleave hides the popover
    it('hides on mouseleave when trigger="hover"', async () => {
      const el = await fixture<HelixPopover>(
        '<hx-popover trigger="hover"><button slot="anchor">Trigger</button><p>Content</p></hx-popover>',
      );
      const wrapper = shadowQuery<HTMLElement>(el, '.trigger-wrapper')!;
      wrapper.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="body"]')?.classList.contains('visible')).toBe(true);

      wrapper.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
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
});
