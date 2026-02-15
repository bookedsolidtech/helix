import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcAlert } from './wc-alert.js';
import './index.js';

afterEach(cleanup);

describe('wc-alert', () => {

  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test</wc-alert>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the alert container', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test message</wc-alert>');
      const alert = shadowQuery(el, '.alert');
      expect(alert).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Hello world</wc-alert>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is visible by default (open=true)', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Visible</wc-alert>');
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Default variant</wc-alert>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="error">Error</wc-alert>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="success">Success</wc-alert>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="warning">Warning</wc-alert>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="error">Error</wc-alert>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: closable (3) ───

  describe('Property: closable', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Not closable</wc-alert>');
      expect(el.closable).toBe(false);
    });

    it('renders close button when closable', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeTruthy();
    });

    it('does not render close button when not closable', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Not closable</wc-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button');
      expect(closeBtn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to true', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Open</wc-alert>');
      expect(el.open).toBe(true);
    });

    it('hides alert when open is false', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Hidden</wc-alert>');
      el.open = false;
      await el.updateComplete;
      const computedStyle = getComputedStyle(el);
      expect(computedStyle.display).toBe('none');
    });

    it('reflects open attribute', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Open</wc-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches wc-close when close button is clicked', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('wc-close event has detail.reason = "user"', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.detail.reason).toBe('user');
    });

    it('wc-close bubbles and is composed', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches wc-after-close after close', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'wc-after-close');
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
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      expect(el.hasAttribute('open')).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Alert message here</wc-alert>');
      expect(el.textContent?.trim()).toContain('Alert message here');
    });

    it('icon slot renders custom icon', async () => {
      const el = await fixture<WcAlert>(
        '<wc-alert><span slot="icon">ICON</span>Message</wc-alert>'
      );
      const iconSlot = el.querySelector('[slot="icon"]');
      expect(iconSlot).toBeTruthy();
      expect(iconSlot?.textContent).toBe('ICON');
    });

    it('actions slot renders action content', async () => {
      const el = await fixture<WcAlert>(
        '<wc-alert>Message<button slot="actions">Action</button></wc-alert>'
      );
      const actionSlot = el.querySelector('[slot="actions"]');
      expect(actionSlot).toBeTruthy();
      expect(actionSlot?.textContent).toBe('Action');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "alert" part', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test</wc-alert>');
      const part = shadowQuery(el, '[part="alert"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test</wc-alert>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test</wc-alert>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when closable', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Test</wc-alert>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });

    it('exposes "actions" part', async () => {
      const el = await fixture<WcAlert>('<wc-alert>Test</wc-alert>');
      const part = shadowQuery(el, '[part="actions"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (6) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="info">Info</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for success variant', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="success">Success</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for warning variant', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="warning">Warning</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('uses role="alert" for error variant', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="error">Error</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('uses aria-live="polite" for info/success variants', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="info">Info</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('aria-live')).toBe('polite');
    });

    it('uses aria-live="assertive" for warning/error variants', async () => {
      const el = await fixture<WcAlert>('<wc-alert variant="error">Error</wc-alert>');
      const alert = shadowQuery(el, '.alert')!;
      expect(alert.getAttribute('aria-live')).toBe('assertive');
    });
  });

  // ─── Close Button Accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Close"', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.alert__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Close');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable</wc-alert>');
      const closeBtn = shadowQuery(el, '.alert__close-button')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per variant', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<WcAlert>(`<wc-alert variant="${variant}">Test</wc-alert>`);
        const iconContainer = shadowQuery(el, '[part="icon"]')!;
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      }
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<WcAlert>('<wc-alert>This is an alert</wc-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['info', 'success', 'warning', 'error']) {
        const el = await fixture<WcAlert>(`<wc-alert variant="${variant}">Alert message</wc-alert>`);
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when closable', async () => {
      const el = await fixture<WcAlert>('<wc-alert closable>Closable alert</wc-alert>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

});
