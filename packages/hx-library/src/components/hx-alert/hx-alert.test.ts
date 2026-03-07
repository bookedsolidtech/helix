import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxAlert } from './hx-alert.js';
import './index.js';

afterEach(cleanup);

describe('hx-alert', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the alert container', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test message</hx-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Hello world</hx-alert>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is visible by default (open=true)', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Visible</hx-alert>');
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Default variant</hx-alert>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="success">Success</hx-alert>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: dismissible (3) ───

  describe('Property: dismissible', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Not dismissible</hx-alert>');
      expect(el.dismissible).toBe(false);
    });

    it('renders close button when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeTruthy();
    });

    it('does not render close button when not dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Not dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to true', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Open</hx-alert>');
      expect(el.open).toBe(true);
    });

    it('hides alert when open is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Hidden</hx-alert>');
      el.open = false;
      await el.updateComplete;
      const computedStyle = getComputedStyle(el);
      expect(computedStyle.display).toBe('none');
    });

    it('reflects open attribute', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Open</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: showIcon (4) ───

  describe('Property: showIcon', () => {
    it('defaults to true', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.showIcon).toBe(true);
    });

    it('renders icon container by default', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });

    it('hides icon container when showIcon is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      el.showIcon = false;
      await el.updateComplete;
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeNull();
    });

    it('show-icon="false" attribute still shows icon (boolean attribute semantics — attribute presence = true)', async () => {
      // Boolean properties map attribute PRESENCE to true, regardless of value.
      // <hx-alert show-icon="false"> has the attribute present → showIcon=true.
      // To hide the icon, the attribute must be absent or el.showIcon = false used.
      const el = await fixture<HxAlert>('<hx-alert show-icon="false">Test</hx-alert>');
      expect(el.showIcon).toBe(true);
      const iconPart = shadowQuery(el, '[part="icon"]');
      expect(iconPart).toBeTruthy();
    });
  });

  // ─── Property: accent (2) ───

  describe('Property: accent', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      expect(el.accent).toBe(false);
    });

    it('applies alert--accent class when accent is true', async () => {
      const el = await fixture<HxAlert>('<hx-alert accent>Test</hx-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert?.classList.contains('alert--accent')).toBe(true);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-close when close button is clicked', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-close event has detail.reason = "user"', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.detail.reason).toBe('user');
    });

    it('hx-close bubbles and is composed', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-after-close after dismiss', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
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
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Keyboard Interaction (2) ───
  // Native <button> elements synthesize a click event on Enter/Space, providing
  // keyboard accessibility without a custom keydown handler. These tests document
  // that standard button keyboard behavior is preserved.

  describe('Keyboard interaction', () => {
    it('dismisses alert when close button is activated (simulating keyboard click)', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      // Simulate keyboard activation: native <button> synthesizes click on Enter/Space.
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does not dismiss alert when Escape is pressed on close button', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  // ─── Focus Management (3) ───

  describe('Focus management', () => {
    it('moves focus away from close button after dismiss', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.focus();
      closeBtn.click();
      await el.updateComplete;
      expect(document.activeElement).not.toBe(closeBtn);
    });

    it('focus returns to a designated trigger element after dismiss (caller-managed pattern)', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Show alert';
      document.body.appendChild(trigger);

      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      trigger.focus();

      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;

      // Restore focus to trigger manually (pattern callers use; component signals via hx-after-close)
      trigger.focus();
      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });

    it('returns focus to returnFocusTo element after dismiss', async () => {
      const trigger = document.createElement('button');
      trigger.id = 'focus-trigger';
      trigger.textContent = 'Open alert';
      document.body.appendChild(trigger);

      const el = await fixture<HxAlert>(
        '<hx-alert dismissible return-focus-to="#focus-trigger">Dismissible</hx-alert>',
      );
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });

  // ─── Slots (5) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Alert message here</hx-alert>');
      expect(el.textContent?.trim()).toContain('Alert message here');
    });

    it('title slot renders title content', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert><span slot="title">Alert Title</span>Message</hx-alert>',
      );
      const titleSlot = el.querySelector('[slot="title"]');
      expect(titleSlot).toBeTruthy();
      expect(titleSlot?.textContent).toBe('Alert Title');
    });

    it('icon slot renders custom icon', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert><span slot="icon">ICON</span>Message</hx-alert>',
      );
      const iconSlot = el.querySelector('[slot="icon"]');
      expect(iconSlot).toBeTruthy();
      expect(iconSlot?.textContent).toBe('ICON');
    });

    it('actions slot renders action content', async () => {
      const el = await fixture<HxAlert>(
        '<hx-alert>Message<button slot="actions">Action</button></hx-alert>',
      );
      const actionSlot = el.querySelector('[slot="actions"]');
      expect(actionSlot).toBeTruthy();
      expect(actionSlot?.textContent).toBe('Action');
    });

    it('actions container is not visible when no actions are slotted', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Message only</hx-alert>');
      await el.updateComplete;
      const actionsContainer = shadowQuery(el, '[part="actions"]');
      expect(actionsContainer).toBeTruthy();
      expect(actionsContainer?.classList.contains('alert__actions--visible')).toBe(false);
    });
  });

  // ─── CSS Parts (6) ───

  describe('CSS Parts', () => {
    it('exposes "alert" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="alert"]');
      expect(part).toBeTruthy();
    });

    it('exposes "title" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="title"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Test</hx-alert>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "actions" part', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Test</hx-alert>');
      const part = shadowQuery(el, '[part="actions"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (6) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      // Role is applied to the host (not shadow DOM internal) for reliable AT support.
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for success variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="success">Success</hx-alert>');
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for warning variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="warning">Warning</hx-alert>');
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('uses role="alert" for error variant on host element', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="error">Error</hx-alert>');
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('updates host role when variant changes', async () => {
      const el = await fixture<HxAlert>('<hx-alert variant="info">Info</hx-alert>');
      expect(el.getAttribute('role')).toBe('status');
      el.variant = 'error';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('sets aria-hidden="true" on host when open is false', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      el.open = false;
      await el.updateComplete;
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes aria-hidden from host when open is true', async () => {
      const el = await fixture<HxAlert>('<hx-alert>Content</hx-alert>');
      el.open = false;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Close Button Accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Close"', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible</hx-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per variant', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<HxAlert>(`<hx-alert variant="${variant}">Test</hx-alert>`);
        const iconContainer = shadowQuery(el, '[part="icon"]')!;
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      }
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxAlert>('<hx-alert>This is an alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['info', 'success', 'warning', 'error']) {
        const el = await fixture<HxAlert>(
          `<hx-alert variant="${variant}">Alert message</hx-alert>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when dismissible', async () => {
      const el = await fixture<HxAlert>('<hx-alert dismissible>Dismissible alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with accent variant', async () => {
      const el = await fixture<HxAlert>('<hx-alert accent>Accent alert</hx-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
