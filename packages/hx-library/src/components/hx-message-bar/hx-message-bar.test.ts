import { describe, it, expect, afterEach } from 'vitest';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { WcMessageBar } from './hx-message-bar.js';
import './index.js';

afterEach(cleanup);

describe('hx-message-bar', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders the base container', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test message</hx-message-bar>');
      const base = shadowQuery(el, '.message-bar');
      expect(base).toBeTruthy();
    });

    it('renders default slot content', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Hello world</hx-message-bar>');
      expect(el.textContent?.trim()).toContain('Hello world');
    });

    it('is visible by default (open=true)', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Visible</hx-message-bar>');
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: variant (5) ───

  describe('Property: variant', () => {
    it('defaults to "info"', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Default</hx-message-bar>');
      expect(el.variant).toBe('info');
    });

    it('reflects variant attribute to property', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="error">Error</hx-message-bar>');
      expect(el.variant).toBe('error');
    });

    it('applies "success" variant via attribute', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="success">Success</hx-message-bar>');
      expect(el.getAttribute('variant')).toBe('success');
    });

    it('applies "warning" variant via attribute', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="warning">Warning</hx-message-bar>');
      expect(el.getAttribute('variant')).toBe('warning');
    });

    it('applies "error" variant via attribute', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="error">Error</hx-message-bar>');
      expect(el.getAttribute('variant')).toBe('error');
    });
  });

  // ─── Property: closable (3) ───

  describe('Property: closable', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      expect(el.closable).toBe(false);
    });

    it('renders close button when closable', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button');
      expect(btn).toBeTruthy();
    });

    it('does not render close button when not closable', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button');
      expect(btn).toBeNull();
    });
  });

  // ─── Property: open (3) ───

  describe('Property: open', () => {
    it('defaults to true', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      expect(el.open).toBe(true);
    });

    it('hides message bar when open is false', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar open="false">Test</hx-message-bar>');
      el.open = false;
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });

    it('reflects open attribute', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      expect(el.hasAttribute('open')).toBe(true);
    });
  });

  // ─── Property: sticky (2) ───

  describe('Property: sticky', () => {
    it('defaults to false', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      expect(el.sticky).toBe(false);
    });

    it('applies sticky class when sticky is true', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar sticky>Test</hx-message-bar>');
      const base = shadowQuery(el, '.message-bar--sticky');
      expect(base).toBeTruthy();
    });
  });

  // ─── Close behavior (2) ───

  describe('Close behavior', () => {
    it('sets open to false when close button is clicked', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });

    it('removes open attribute when closed', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button') as HTMLButtonElement;
      btn.click();
      await el.updateComplete;
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Events (3) ───

  describe('Events', () => {
    it('dispatches hx-close when close button is clicked', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const eventPromise = oneEvent(el, 'hx-close');
      const btn = shadowQuery(el, '.message-bar__close-button') as HTMLButtonElement;
      btn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-close bubbles and is composed', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const eventPromise = oneEvent(el, 'hx-close');
      const btn = shadowQuery(el, '.message-bar__close-button') as HTMLButtonElement;
      btn.click();
      const event = (await eventPromise) as CustomEvent;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-close event has detail.reason === "user"', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const eventPromise = oneEvent(el, 'hx-close');
      const btn = shadowQuery(el, '.message-bar__close-button') as HTMLButtonElement;
      btn.click();
      const event = (await eventPromise) as CustomEvent<{ reason: string }>;
      expect(event.detail.reason).toBe('user');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "base" part', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      const part = shadowQuery(el, '[part="base"]');
      expect(part).toBeTruthy();
    });

    it('exposes "icon" part', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      const part = shadowQuery(el, '[part="icon"]');
      expect(part).toBeTruthy();
    });

    it('exposes "message" part', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      const part = shadowQuery(el, '[part="message"]');
      expect(part).toBeTruthy();
    });

    it('exposes "action" part', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test</hx-message-bar>');
      const part = shadowQuery(el, '[part="action"]');
      expect(part).toBeTruthy();
    });

    it('exposes "close-button" part when closable', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
    });
  });

  // ─── Close button accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label "Close"', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button');
      expect(btn?.getAttribute('aria-label')).toBe('Close');
    });

    it('close button is a button element', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test</hx-message-bar>');
      const btn = shadowQuery(el, '.message-bar__close-button');
      expect(btn?.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── Accessibility (3) ───

  describe('Accessibility', () => {
    it('uses role="status" for info variant', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="info">Info</hx-message-bar>');
      const base = shadowQuery(el, '[role="status"]');
      expect(base).toBeTruthy();
    });

    it('uses role="status" for success variant', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="success">Success</hx-message-bar>');
      const base = shadowQuery(el, '[role="status"]');
      expect(base).toBeTruthy();
    });

    it('uses role="alert" for warning variant', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="warning">Warning</hx-message-bar>');
      const base = shadowQuery(el, '[role="alert"]');
      expect(base).toBeTruthy();
    });

    it('uses role="alert" for error variant', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar variant="error">Error</hx-message-bar>');
      const base = shadowQuery(el, '[role="alert"]');
      expect(base).toBeTruthy();
    });

    it('has no axe violations in default state', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>Test message</hx-message-bar>');
      await checkA11y(el);
    });

    it('has no axe violations when closable', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar closable>Test message</hx-message-bar>');
      await checkA11y(el);
    });

    it('has no axe violations for all variants', async () => {
      const variants = ['info', 'success', 'warning', 'error'] as const;
      for (const variant of variants) {
        const el = await fixture<WcMessageBar>(
          `<hx-message-bar variant="${variant}">Test message</hx-message-bar>`,
        );
        await checkA11y(el);
      }
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders message content', async () => {
      const el = await fixture<WcMessageBar>('<hx-message-bar>My message text</hx-message-bar>');
      expect(el.textContent?.trim()).toContain('My message text');
    });

    it('icon slot renders custom icon', async () => {
      const el = await fixture<WcMessageBar>(
        '<hx-message-bar><span slot="icon">★</span>Message</hx-message-bar>',
      );
      const slottedIcon = el.querySelector('[slot="icon"]');
      expect(slottedIcon).toBeTruthy();
    });

    it('action slot renders action content', async () => {
      const el = await fixture<WcMessageBar>(
        '<hx-message-bar>Message<a slot="action" href="#">Learn more</a></hx-message-bar>',
      );
      const slottedAction = el.querySelector('[slot="action"]');
      expect(slottedAction).toBeTruthy();
    });
  });
});
