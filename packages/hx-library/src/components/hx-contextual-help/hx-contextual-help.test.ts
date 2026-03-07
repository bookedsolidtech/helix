import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixContextualHelp } from './hx-contextual-help.js';
import './index.js';

afterEach(cleanup);

describe('hx-contextual-help', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "trigger" CSS part on the button', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const trigger = shadowQuery(el, '[part="trigger"]');
      expect(trigger).toBeTruthy();
    });

    it('does not render popover by default (closed state)', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover).toBeNull();
    });

    it('renders the question-mark SVG icon inside the trigger', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const svg = shadowQuery(el, 'button[part="trigger"] svg');
      expect(svg).toBeTruthy();
    });
  });

  // ─── Properties (5) ───

  describe('Properties', () => {
    it('placement defaults to "right"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      expect(el.placement).toBe('right');
    });

    it('heading attribute sets the heading text', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help heading="Field Details"></hx-contextual-help>',
      );
      expect(el.heading).toBe('Field Details');
    });

    it('size defaults to "md"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      expect(el.size).toBe('md');
    });

    it('label defaults to "Help"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      expect(el.label).toBe('Help');
    });

    it('trigger has correct aria-label from label property', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help label="More information"></hx-contextual-help>',
      );
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      expect(trigger?.getAttribute('aria-label')).toBe('More information');
    });
  });

  // ─── Open / Close (6) ───

  describe('Open / Close', () => {
    it('show() opens the popover', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover).toBeTruthy();
    });

    it('hide() closes the popover', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      el.hide();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover).toBeNull();
    });

    it('clicking the trigger opens the popover', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover).toBeTruthy();
    });

    it('clicking the trigger again closes the popover', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      trigger?.click();
      await el.updateComplete;
      trigger?.click();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover).toBeNull();
    });

    it('trigger aria-expanded is "false" when closed', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('trigger aria-expanded is "true" when open', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-open when popover opens', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.show();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-close when popover closes', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.hide();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-open is composed and bubbles', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.show();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('hx-close is composed and bubbles', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.hide();
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });
  });

  // ─── Keyboard (3) ───

  describe('Keyboard', () => {
    it('Escape key closes the popover when open', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      expect(shadowQuery(el, '[part="popover"]')).toBeTruthy();

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(shadowQuery(el, '[part="popover"]')).toBeNull();
    });

    it('Escape key does nothing when popover is already closed', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;

      let closeFired = false;
      el.addEventListener('hx-close', () => {
        closeFired = true;
      });

      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await el.updateComplete;
      expect(closeFired).toBe(false);
    });

    it('hx-close fires when Escape key is pressed', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Slots (2) ───

  describe('Slots', () => {
    it('default slot renders help content', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help><p class="help-text">Help content here</p></hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      const slottedContent = el.querySelector('p.help-text');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Help content here');
    });

    it('default slot is inside the popover panel when open', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help>Help text</hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      const slot = popover?.querySelector('slot');
      expect(slot).toBeTruthy();
    });
  });

  // ─── CSS Parts (3) ───

  describe('CSS Parts', () => {
    it('exposes "trigger" part on the button element', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="trigger"]');
      expect(part?.getAttribute('part')).toBe('trigger');
    });

    it('exposes "popover" part on the panel element when open', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const part = shadowQuery(el, '[part="popover"]');
      expect(part?.getAttribute('part')).toBe('popover');
    });

    it('exposes "heading" part when heading prop is set and popover is open', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help heading="Test Heading"></hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      const part = shadowQuery(el, '[part="heading"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('heading');
      expect(part?.textContent?.trim()).toBe('Test Heading');
    });
  });

  // ─── ARIA (4) ───

  describe('ARIA', () => {
    it('popover has role="dialog"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover?.getAttribute('role')).toBe('dialog');
    });

    it('popover has aria-labelledby pointing to heading when heading is set', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help heading="Help Title"></hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      const headingId = popover?.getAttribute('aria-labelledby');
      expect(headingId).toBeTruthy();
      const heading = shadowQuery(el, `#${headingId}`);
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.trim()).toBe('Help Title');
    });

    it('popover has no aria-labelledby when heading is empty', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover?.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('popover has aria-label fallback from label property when heading is empty', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help label="Field assistance"></hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover?.getAttribute('aria-label')).toBe('Field assistance');
    });

    it('popover has aria-modal="true"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const popover = shadowQuery(el, '[part="popover"]');
      expect(popover?.getAttribute('aria-modal')).toBe('true');
    });

    it('popover has close button with part="close-button"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      const closeBtn = shadowQuery(el, '[part="close-button"]');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
    });

    it('trigger has type="button"', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      expect(trigger?.getAttribute('type')).toBe('button');
    });
  });

  // ─── Accessibility (axe-core) (3) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state with heading', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help heading="Help Information">This field requires a valid value.</hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state without heading', async () => {
      const el = await fixture<HelixContextualHelp>(
        '<hx-contextual-help>This field requires a valid value.</hx-contextual-help>',
      );
      el.show();
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });

  // ─── Focus Management (2) ───

  describe('Focus Management', () => {
    it('focus moves into the popover when show() is called', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      // Wait for hx-open event which fires after focus() inside _show()
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.show();
      await eventPromise;
      // Close button (first focusable element) should receive focus
      const closeBtn = shadowQuery(el, 'button[part="close-button"]');
      expect(el.shadowRoot?.activeElement).toBe(closeBtn);
    });

    it('focus returns to trigger after hide()', async () => {
      const el = await fixture<HelixContextualHelp>('<hx-contextual-help></hx-contextual-help>');
      el.show();
      await el.updateComplete;
      el.hide();
      await el.updateComplete;
      const trigger = shadowQuery<HTMLButtonElement>(el, 'button[part="trigger"]');
      expect(el.shadowRoot?.activeElement).toBe(trigger);
    });
  });
});
