import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HxBanner } from './hx-banner.js';
import './index.js';

afterEach(cleanup);

describe('hx-banner', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the banner container', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test message</hx-banner>');
      const banner = shadowQuery(el, '.banner');
      expect(banner).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Hello world</hx-banner>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is visible by default (open=true)', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Visible</hx-banner>');
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Default variant</hx-banner>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="error">Error</hx-banner>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="success">Success</hx-banner>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="warning">Warning</hx-banner>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="error">Error</hx-banner>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: position (3) ───

  describe('Property: position', () => {
    it('defaults to "sticky"', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      expect(el.position).toBe('sticky');
    });

    it('reflects position attribute to property', async () => {
      const el = await fixture<HxBanner>('<hx-banner position="fixed">Test</hx-banner>');
      expect(el.position).toBe('fixed');
    });

    it('reflects position property to attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      el.position = 'fixed';
      await el.updateComplete;
      expect(el.getAttribute('position')).toBe('fixed');
    });
  });

  // ─── Property: dismissible (3) ───

  describe('Property: dismissible', () => {
    it('defaults to false', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Not dismissible</hx-banner>');
      expect(el.dismissible).toBe(false);
    });

    it('renders close button when dismissible', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery(el, '.banner__close-button');
      expect(closeBtn).toBeTruthy();
    });

    it('does not render close button when not dismissible', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Not dismissible</hx-banner>');
      const closeBtn = shadowQuery(el, '.banner__close-button');
      expect(closeBtn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to true', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Open</hx-banner>');
      expect(el.open).toBe(true);
    });

    it('hides banner when open is false', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Hidden</hx-banner>');
      el.open = false;
      await el.updateComplete;
      const computedStyle = getComputedStyle(el);
      expect(computedStyle.display).toBe('none');
    });

    it('reflects open attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Open</hx-banner>');
      expect(el.hasAttribute('open')).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: actionLabel / actionHref (4) ───

  describe('Property: actionLabel and actionHref', () => {
    it('does not render action link when actionLabel is empty', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Message</hx-banner>');
      const action = shadowQuery(el, '[part="action"]');
      expect(action).toBeNull();
    });

    it('does not render action link when only actionLabel is set', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Learn more">Message</hx-banner>',
      );
      const action = shadowQuery(el, '[part="action"]');
      expect(action).toBeNull();
    });

    it('renders action link when both actionLabel and actionHref are set', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Learn more" action-href="/docs">Message</hx-banner>',
      );
      const action = shadowQuery(el, '[part="action"]');
      expect(action).toBeTruthy();
    });

    it('action link is an <a> element', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Learn more" action-href="/docs">Message</hx-banner>',
      );
      const action = shadowQuery(el, '[part="action"]');
      expect(action?.tagName.toLowerCase()).toBe('a');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-dismiss when close button is clicked', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-dismiss event has detail.reason = "user"', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.detail.reason).toBe('user');
    });

    it('hx-dismiss bubbles and is composed', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-dismiss when dismiss() method is called', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      el.dismiss();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Dismiss Behavior (2) ───

  describe('Dismiss behavior', () => {
    it('sets open to false when close button is clicked', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed via close button', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      expect(el.hasAttribute('open')).toBe(true);
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
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
    it('dismisses banner when close button is activated (simulating keyboard click)', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-dismiss');
      // Simulate keyboard activation: native <button> synthesizes click on Enter/Space.
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('does not dismiss banner when Escape is pressed on close button', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(el.open).toBe(true);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Banner message here</hx-banner>');
      expect(el.textContent?.trim()).toContain('Banner message here');
    });

    it('action slot renders within the action link', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Details" action-href="/details"><span slot="action">Custom action</span>Message</hx-banner>',
      );
      const actionSlot = el.querySelector('[slot="action"]');
      expect(actionSlot).toBeTruthy();
      expect(actionSlot?.textContent).toBe('Custom action');
    });

    it('action slot falls back to actionLabel text when not slotted', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Learn more" action-href="/docs">Message</hx-banner>',
      );
      const action = shadowQuery(el, '[part="action"]');
      expect(action?.textContent?.trim()).toContain('Learn more');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "banner" part', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      const part = shadowQuery(el, '[part="banner"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "action" part when action-label and action-href are set', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="View" action-href="/view">Test</hx-banner>',
      );
      const part = shadowQuery(el, '[part="action"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when dismissible', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Test</hx-banner>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Accessibility (7) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant on host element', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="info">Info</hx-banner>');
      // Role is applied to the host (not shadow DOM internal) for reliable AT support.
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="status" for success variant on host element', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="success">Success</hx-banner>');
      expect(el.getAttribute('role')).toBe('status');
    });

    it('uses role="alert" for warning variant on host element', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="warning">Warning</hx-banner>');
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('uses role="alert" for error variant on host element', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="error">Error</hx-banner>');
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('updates host role when variant changes', async () => {
      const el = await fixture<HxBanner>('<hx-banner variant="info">Info</hx-banner>');
      expect(el.getAttribute('role')).toBe('status');
      el.variant = 'error';
      await el.updateComplete;
      expect(el.getAttribute('role')).toBe('alert');
    });

    it('sets aria-hidden="true" on host when open is false', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Content</hx-banner>');
      el.open = false;
      await el.updateComplete;
      expect(el.getAttribute('aria-hidden')).toBe('true');
    });

    it('removes aria-hidden from host when open is true', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Content</hx-banner>');
      el.open = false;
      await el.updateComplete;
      el.open = true;
      await el.updateComplete;
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  // ─── Close Button Accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Dismiss banner" (default when no heading set)', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '.banner__close-button')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Dismiss banner');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible</hx-banner>');
      const closeBtn = shadowQuery(el, '.banner__close-button')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Default Icons (1) ───

  describe('Default icons', () => {
    it('renders a default SVG icon per variant', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<HxBanner>(`<hx-banner variant="${variant}">Test</hx-banner>`);
        const iconContainer = shadowQuery(el, '[part="icon"]')!;
        const svg = iconContainer.querySelector('svg');
        expect(svg).toBeTruthy();
      }
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HxBanner>('<hx-banner>This is a banner</hx-banner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations for all variants', async () => {
      for (const variant of ['info', 'success', 'warning', 'error']) {
        const el = await fixture<HxBanner>(
          `<hx-banner variant="${variant}">Banner message</hx-banner>`,
        );
        await page.screenshot();
        const { violations } = await checkA11y(el);
        expect(violations, `variant="${variant}" should have no violations`).toEqual([]);
        el.remove();
      }
    });

    it('has no axe violations when dismissible', async () => {
      const el = await fixture<HxBanner>('<hx-banner dismissible>Dismissible banner</hx-banner>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with action link', async () => {
      const el = await fixture<HxBanner>(
        '<hx-banner action-label="Learn more" action-href="/docs">Banner with action</hx-banner>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('uses default English label for close button', async () => {
      const el = await fixture<HxBanner>('<hx-banner>Test</hx-banner>');
      expect(el.closeLabel).toBe('Dismiss banner');
    });

    it('renders custom closeLabel when set via attribute', async () => {
      const el = await fixture<HxBanner>('<hx-banner close-label="Cerrar">Test</hx-banner>');
      expect(el.closeLabel).toBe('Cerrar');
    });
  });
});
