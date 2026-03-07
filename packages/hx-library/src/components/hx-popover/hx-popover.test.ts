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

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      const body = shadowQuery(el, '[part="body"]');
      expect(body?.classList.contains('visible')).toBe(false);
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
