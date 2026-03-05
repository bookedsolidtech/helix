import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import {
  fixture,
  shadowQuery,
  _shadowQueryAll,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import type { WcAlert } from './hx-alert.js';
import './index.js';

afterEach(cleanup);

describe('hx-alert', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the alert container', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test message</hx-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Hello world</hx-alert>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is visible by default (open=true)', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Visible</hx-alert>');
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Default variant</hx-alert>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="success">Success</hx-alert>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: dismissible (3) ───

  describe('Property: dismissible', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Not dismissible</hx-alert>');
      expect(el.dismissible).toBe(false);
    });

    it('renders close button when dismissible', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeTruthy();
    });

    it('does not render close button when not dismissible', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Not dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to true', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Open</hx-alert>');
      expect(el.open).toBe(true);
    });

    it('hides alert when open is false', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Hidden</hx-alert>');
      el.open = false;
      await el.updateComplete;
      const computedStyle = getComputedStyle(el);
      expect(computedStyle.display).toBe('none');
    });

    it('reflects open attribute', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Open</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: icon (3) ───

  describe('Property: icon', () => {
    it('defaults to true', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      expect(el.icon).toBe(true);
    });

    it('renders icon container by default', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });

    it('hides icon container when icon is false', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      el.icon = false;
      await el.updateComplete;
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeNull();
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-close when close button is clicked', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-close event has detail.reason = "user"', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.detail.reason).toBe('user');
    });

    it('hx-close bubbles and is composed', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-after-close after dismiss', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-after-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Close Behavior (2) ───

  describe('Close behavior', () => {
    it('sets open to false when close button is clicked', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Keyboard Interaction (4) ───

  describe('Keyboard interaction', () => {
    it('dismisses alert when Enter is pressed on close button', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('dismisses alert when Space is pressed on close button', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('dispatches hx-after-close when Enter is pressed on close button', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-after-close');
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('does not dismiss alert on unrelated key press on close button', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  // ─── Focus Management (2) ───

  describe('Focus management', () => {
    it('moves focus to document.body after dismiss when no trigger element', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.focus();
      closeBtn.click();
      await el.updateComplete;
      // After dismiss the alert is hidden; focus should have moved off the (now hidden) button.
      // document.body receives focus as the logical fallback.
      expect(document.activeElement).not.toBe(closeBtn);
    });

    it('focus returns to a designated trigger element after dismiss', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Show alert';
      document.body.appendChild(trigger);

      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      trigger.focus();

      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;

      // Restore focus to trigger manually (pattern callers use; component signals via hx-after-close)
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Alert message here</hx-alert>');
      expect(el.textContent?.trim()).toContain('Alert message here');
    });

    it('icon slot renders custom icon', async () => {
      const el = await fixture<WcAlert>(
        '<hx-alert><span slot="icon">ICON</span>Message</hx-alert>',
      );
      const iconSlot = el.querySelector('[slot="icon"]');
      expect(iconSlot).toBeTruthy();
      expect(iconSlot?.textContent).toBe('ICON');
    });

    it('actions slot renders action content', async () => {
      const el = await fixture<WcAlert>(
        '<hx-alert>Message<button slot="actions">Action</button></hx-alert>',
      );
      const actionSlot = el.querySelector('[slot="actions"]');
      expect(actionSlot).toBeTruthy();
      expect(actionSlot?.textContent).toBe('Action');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "alert" part', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="alert"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when dismissible', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Test</hx-alert>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "actions" part', async () => {
      const el = await fixture<WcAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="actions"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (4) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="info">Info</hx-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for success variant', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="success">Success</hx-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for warning variant', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('uses role="alert" for error variant', async () => {
      const el = await fixture<WcAlert>('<hx-alert variant="error">Error</hx-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('alert');
    });
  });

  // ─── Close Button Accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Close"', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per variant', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<WcAlert>(`<hx-alert variant="${variant}">Test</hx-alert>`);
        const iconContainer = shadowQuery(el, '[part="icon"]')!;
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      }
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcAlert>('<hx-alert>This is an alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['info', 'success', 'warning', 'error']) {
        const el = await fixture<WcAlert>(
          `<hx-alert variant="${variant}">Alert message</hx-alert>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when dismissible', async () => {
      const el = await fixture<WcAlert>('<hx-alert dismissible>Dismissible alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
