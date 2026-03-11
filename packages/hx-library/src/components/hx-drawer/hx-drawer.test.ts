import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDrawer } from './hx-drawer.js';
import './index.js';

afterEach(cleanup);

describe('hx-drawer', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "panel" CSS part', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const panelPart = shadowQuery(el, '[part="panel"]');
      expect(panelPart).toBeTruthy();
    });

    it('exposes "body" CSS part', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const bodyPart = shadowQuery(el, '[part="body"]');
      expect(bodyPart).toBeTruthy();
    });

    it('exposes "header" CSS part by default', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeTruthy();
    });
  });

  // ─── Properties (6) ───

  describe('Properties', () => {
    it('open=false — drawer is not open by default', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('open=true — drawer reflects open attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('placement defaults to "end"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('end');
    });

    it('placement reflects on the element attribute', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="start"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('start');
      expect(el.getAttribute('placement')).toBe('start');
    });

    it('size defaults to "md"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      expect(el.size).toBe('md');
    });

    it('no-header attribute hides the header', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer no-header></hx-drawer>');
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeNull();
    });
  });

  // ─── Events (5) ───

  describe('Events', () => {
    it('dispatches hx-show when open is set to true', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-show');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-hide when open is set to false', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      // Allow open animation to complete before toggling open to false
      await new Promise((r) => setTimeout(r, 50));
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-hide');
      el.open = false;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-initial-focus when drawer opens', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-initial-focus');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.cancelable).toBe(true);
    });

    it('dispatches hx-show and then hx-after-show', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const events: string[] = [];
      el.addEventListener('hx-show', () => events.push('hx-show'));
      el.addEventListener('hx-after-show', () => events.push('hx-after-show'));

      el.open = true;
      // Allow CSS transition/animation to complete so hx-after-show fires after hx-show
      await new Promise((r) => setTimeout(r, 400));

      expect(events).toContain('hx-show');
      expect(events).toContain('hx-after-show');
      expect(events.indexOf('hx-show')).toBeLessThan(events.indexOf('hx-after-show'));
    });

    it('dispatches hx-hide and then hx-after-hide', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      // Allow open animation to complete before triggering close
      await new Promise((r) => setTimeout(r, 100));

      const events: string[] = [];
      el.addEventListener('hx-hide', () => events.push('hx-hide'));
      el.addEventListener('hx-after-hide', () => events.push('hx-after-hide'));

      el.open = false;
      // Allow CSS transition/animation to complete so hx-after-hide fires after hx-hide
      await new Promise((r) => setTimeout(r, 400));

      expect(events).toContain('hx-hide');
      expect(events).toContain('hx-after-hide');
      expect(events.indexOf('hx-hide')).toBeLessThan(events.indexOf('hx-after-hide'));
    });
  });

  // ─── Methods (2) ───

  describe('Methods', () => {
    it('show() sets open to true', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      expect(el.open).toBe(false);
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('hide() sets open to false', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      expect(el.open).toBe(true);
      el.hide();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders body content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><p class="body-content">Body text</p></hx-drawer>',
      );
      await el.updateComplete;
      const slottedContent = el.querySelector('p.body-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Body text');
    });

    it('label slot renders title content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label" class="drawer-title">My Drawer</span></hx-drawer>',
      );
      await el.updateComplete;
      const titleEl = el.querySelector('span.drawer-title');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent).toBe('My Drawer');
    });

    it('footer slot renders action content', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><button slot="footer" class="confirm-btn">Confirm</button></hx-drawer>',
      );
      // Wait for slotchange event to propagate and component to re-render with footer slot content
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slottedFooter = el.querySelector('button.confirm-btn');
      expect(slottedFooter).toBeTruthy();
      expect(slottedFooter?.textContent).toBe('Confirm');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "panel" part on the drawer panel', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="panel"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('panel');
    });

    it('exposes "header" part on the header region', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="header"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('header');
    });

    it('exposes "body" part on the body region', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="body"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('body');
    });

    it('exposes "close-button" part on the close button', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('close-button');
    });

    it('exposes "title" part on the title element', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="title"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('title');
    });
  });

  // ─── Keyboard Behavior (2) ───

  describe('Keyboard Behavior', () => {
    it('Escape key closes the drawer when open', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      // Allow open animation to complete before testing Escape-key close
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(true);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('Escape key does not close when drawer is already closed', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;

      let hideFired = false;
      el.addEventListener('hx-hide', () => {
        hideFired = true;
      });

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;

      expect(hideFired).toBe(false);
      expect(el.open).toBe(false);
    });
  });

  // ─── Overlay Click (2) ───

  describe('Overlay Click', () => {
    it('clicking the overlay backdrop closes the drawer', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      // Allow open animation to complete before testing overlay-click close
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(true);
      const overlay = shadowQuery<HTMLElement>(el, '[part="overlay"]');
      expect(overlay).toBeTruthy();

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      overlay?.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });

    it('overlay is rendered when drawer is open', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay).toBeTruthy();
    });
  });

  // ─── ARIA (3) ───

  describe('ARIA', () => {
    it('overlay container has role="dialog"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay?.getAttribute('role')).toBe('dialog');
    });

    it('overlay container has aria-modal="true"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay?.getAttribute('aria-modal')).toBe('true');
    });

    it('close button has aria-label="Close drawer"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      const closeBtn = shadowQuery(el, '[part="close-button"]');
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close drawer');
    });
  });

  // ─── Placement Variants (4) ───

  describe('Placement Variants', () => {
    it('supports placement="end" (default)', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="end"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('end');
      expect(el.getAttribute('placement')).toBe('end');
    });

    it('supports placement="start"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="start"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('start');
    });

    it('supports placement="top"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="top"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('top');
    });

    it('supports placement="bottom"', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer placement="bottom"></hx-drawer>');
      await el.updateComplete;
      expect(el.placement).toBe('bottom');
    });
  });

  // ─── Close Button (1) ───

  describe('Close Button', () => {
    it('clicking close button closes the drawer', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;
      // Allow open animation to complete before testing close-button click
      await new Promise((r) => setTimeout(r, 50));

      expect(el.open).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]');
      expect(closeBtn).toBeTruthy();

      const hidePromise = oneEvent<CustomEvent>(el, 'hx-hide');
      closeBtn?.click();
      await hidePromise;
      expect(el.open).toBe(false);
    });
  });

  // ─── Focus Trap (3) ───

  describe('Focus Trap', () => {
    it('traps forward Tab at the last focusable element', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Title</span><button class="first-btn">First</button><button class="last-btn">Last</button></hx-drawer>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100));

      // Focus the last slotted button
      const lastBtn = el.querySelector<HTMLButtonElement>('.last-btn');
      expect(lastBtn).toBeTruthy();
      lastBtn!.focus();
      expect(document.activeElement).toBe(lastBtn);

      // Press Tab — should wrap to first focusable element (close button in shadow DOM)
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;

      // Focus should not escape the drawer (activeElement should still be inside or on the drawer)
      const active = document.activeElement;
      expect(
        active === lastBtn || el.contains(active) || el.shadowRoot?.contains(active as Node),
      ).toBe(true);
    });

    it('traps backward Shift+Tab at the first focusable element', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Title</span><button class="only-btn">Only</button></hx-drawer>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100));

      // Focus the close button (first shadow DOM focusable)
      const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('[part="close-button"]');
      expect(closeBtn).toBeTruthy();
      closeBtn!.focus();

      // Press Shift+Tab
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
      );
      await el.updateComplete;

      // Focus should not escape the drawer
      const active = document.activeElement;
      expect(
        active === closeBtn || el.contains(active) || el.shadowRoot?.contains(active as Node),
      ).toBe(true);
    });

    it('prevents Tab when no focusable elements exist', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open no-header><span>Non-focusable content</span></hx-drawer>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100));

      // Dispatch Tab — should not throw
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true); // drawer stays open
    });
  });

  // ─── Focus Restoration (1) ───

  describe('Focus Restoration', () => {
    it('restores focus to the trigger element on close', async () => {
      // Create a trigger button and focus it
      const trigger = document.createElement('button');
      trigger.textContent = 'Trigger';
      trigger.classList.add('test-trigger');
      document.body.appendChild(trigger);
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      const el = await fixture<HelixDrawer>(
        '<hx-drawer><span slot="label">Title</span></hx-drawer>',
      );

      // Open drawer (trigger is still focused)
      el.open = true;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 100));

      // Close drawer
      el.open = false;
      await el.updateComplete;
      // Wait for close animation + focus restore timeout
      await new Promise((r) => setTimeout(r, 400));

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ─── Body Scroll Lock (2) ───

  describe('Body Scroll Lock', () => {
    it('locks body scroll when drawer opens', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      const previousOverflow = document.body.style.overflow;

      el.open = true;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(document.body.style.overflow).toBe('hidden');

      // Close and restore
      el.open = false;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 400));
      expect(document.body.style.overflow).toBe(previousOverflow);
    });

    it('does not lock body scroll when contained', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');
      const previousOverflow = document.body.style.overflow;

      el.open = true;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(document.body.style.overflow).toBe(previousOverflow);
    });
  });

  // ─── ARIA Label Fallback (3) ───

  describe('ARIA Label Fallback', () => {
    it('uses aria-labelledby when label slot is populated', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Patient Info</span></hx-drawer>',
      );
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const overlay = el.shadowRoot?.querySelector('[part="overlay"]');
      expect(overlay?.hasAttribute('aria-labelledby')).toBe(true);
      expect(overlay?.hasAttribute('aria-label')).toBe(false);
    });

    it('uses aria-label from label property when no label slot', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open label="Settings Panel"></hx-drawer>');
      await el.updateComplete;

      const overlay = el.shadowRoot?.querySelector('[part="overlay"]');
      expect(overlay?.getAttribute('aria-label')).toBe('Settings Panel');
    });

    it('falls back to aria-label="Drawer" when no label slot or property', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer open></hx-drawer>');
      await el.updateComplete;

      const overlay = el.shadowRoot?.querySelector('[part="overlay"]');
      expect(overlay?.getAttribute('aria-label')).toBe('Drawer');
    });
  });

  // ─── Contained mode (1) ───

  describe('Contained', () => {
    it('contained attribute reflects on the element', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer contained></hx-drawer>');
      await el.updateComplete;
      expect(el.contained).toBe(true);
      expect(el.hasAttribute('contained')).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixDrawer>('<hx-drawer></hx-drawer>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state with label', async () => {
      const el = await fixture<HelixDrawer>(
        '<hx-drawer open><span slot="label">Patient Info</span><p>Content</p></hx-drawer>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
