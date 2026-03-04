import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import {
  fixture,
  shadowQuery,
  oneEvent,
  cleanup,
  checkA11y,
} from '../../test-utils.js';
import type { HelixDialog } from './hx-dialog.js';
import './index.js';

afterEach(cleanup);

describe('hx-dialog', () => {
  // ─── Rendering (4) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders a native <dialog> element in shadow DOM', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const dialogEl = shadowQuery(el, 'dialog');
      expect(dialogEl).toBeTruthy();
      expect(dialogEl?.tagName.toLowerCase()).toBe('dialog');
    });

    it('renders header, body, and footer parts', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="header"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
      expect(shadowQuery(el, '[part="footer"]')).toBeTruthy();
    });

    it('renders close button by default', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const closeBtn = shadowQuery(el, '[part="close-button"]');
      expect(closeBtn).toBeTruthy();
    });
  });

  // ─── Property: open (4) ───

  describe('Property: open', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.open).toBe(false);
    });

    it('reflects open attribute when set via attribute', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('sets open=true when property is assigned true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.open = true;
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('sets open=false and removes attribute when property is assigned false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      expect(el.open).toBe(true);
      el.open = false;
      await el.updateComplete;
      expect(el.open).toBe(false);
      expect(el.hasAttribute('open')).toBe(false);
    });
  });

  // ─── Property: modal (3) ───

  describe('Property: modal', () => {
    it('defaults to true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.modal).toBe(true);
    });

    it('reflects modal attribute to property', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog modal label="Test">Content</hx-dialog>',
      );
      expect(el.modal).toBe(true);
      expect(el.hasAttribute('modal')).toBe(true);
    });

    it('modal=false sets the property and reflects attribute as absent', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.modal = false;
      await el.updateComplete;
      expect(el.modal).toBe(false);
    });
  });

  // ─── Property: label (3) ───

  describe('Property: label', () => {
    it('defaults to empty string', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog>Content</hx-dialog>');
      expect(el.label).toBe('');
    });

    it('renders label text in the header when set', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Patient Records">Content</hx-dialog>',
      );
      const labelSpan = shadowQuery(el, '.dialog__label');
      expect(labelSpan).toBeTruthy();
      expect(labelSpan?.textContent?.trim()).toBe('Patient Records');
    });

    it('sets aria-labelledby on the dialog element when label is present', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Confirm Action">Content</hx-dialog>',
      );
      const dialogEl = shadowQuery(el, 'dialog');
      expect(dialogEl?.getAttribute('aria-labelledby')).toBe('dialog-label');
    });

    it('omits aria-labelledby when label is empty', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog>Content</hx-dialog>');
      const dialogEl = shadowQuery(el, 'dialog');
      expect(dialogEl?.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  // ─── Property: noCloseButton (2) ───

  describe('Property: noCloseButton', () => {
    it('close button renders by default', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="close-button"]')).toBeTruthy();
    });

    it('no-close-button attribute hides the close button', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog no-close-button label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="close-button"]')).toBeNull();
    });
  });

  // ─── Property: closeOnOverlay (2) ───

  describe('Property: closeOnOverlay', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.closeOnOverlay).toBe(false);
    });

    it('overlay part renders when modal=true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.modal).toBe(true);
      const overlay = shadowQuery(el, '[part="overlay"]');
      expect(overlay).toBeTruthy();
    });

    it('overlay part is absent when modal=false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.modal = false;
      await el.updateComplete;
      expect(shadowQuery(el, '[part="overlay"]')).toBeNull();
    });

    it('reflects close-on-overlay attribute to property', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog close-on-overlay label="Test">Content</hx-dialog>',
      );
      expect(el.closeOnOverlay).toBe(true);
      expect(el.hasAttribute('close-on-overlay')).toBe(true);
    });
  });

  // ─── Property: closeOnEscape (2) ───

  describe('Property: closeOnEscape', () => {
    it('defaults to true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(el.closeOnEscape).toBe(true);
    });

    it('reflects close-on-escape attribute to property when set to false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.closeOnEscape = false;
      await el.updateComplete;
      expect(el.closeOnEscape).toBe(false);
      expect(el.hasAttribute('close-on-escape')).toBe(false);
    });
  });

  // ─── Events (6) ───

  describe('Events', () => {
    it('dispatches hx-open when opened', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-open event bubbles and is composed', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.open = true;
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-close when closed', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      const eventPromise = oneEvent<CustomEvent<{ returnValue: string }>>(el, 'hx-close');
      el.open = false;
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-close detail contains returnValue string', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      const eventPromise = oneEvent<CustomEvent<{ returnValue: string }>>(el, 'hx-close');
      el.open = false;
      const event = await eventPromise;
      expect(typeof event.detail.returnValue).toBe('string');
    });

    it('hx-close bubbles and is composed', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.open = false;
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('close button click dispatches hx-request-close', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      await el.updateComplete;
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-request-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-request-close is cancelable, bubbles, and is composed', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      await el.updateComplete;
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-request-close');
      closeBtn.click();
      const event = await eventPromise;
      expect(event.cancelable).toBe(true);
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('prevents close when hx-request-close is cancelled', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      await el.updateComplete;
      el.addEventListener('hx-request-close', (e) => e.preventDefault());
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('closes dialog when hx-request-close is not cancelled', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      await el.updateComplete;
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]')!;
      closeBtn.click();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── CSS Parts (6) ───

  describe('CSS Parts', () => {
    it('exposes "dialog" part', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="dialog"]')).toBeTruthy();
    });

    it('exposes "overlay" part when modal=true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="overlay"]')).toBeTruthy();
    });

    it('exposes "header" part', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="header"]')).toBeTruthy();
    });

    it('exposes "body" part', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="body"]')).toBeTruthy();
    });

    it('exposes "footer" part', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="footer"]')).toBeTruthy();
    });

    it('exposes "close-button" part when noCloseButton is false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="close-button"]')).toBeTruthy();
    });

    it('does not expose "close-button" part when noCloseButton is true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog no-close-button label="Test">Content</hx-dialog>',
      );
      expect(shadowQuery(el, '[part="close-button"]')).toBeNull();
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders body content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test"><p>Body content here</p></hx-dialog>',
      );
      const bodySlotContent = el.querySelector('p');
      expect(bodySlotContent).toBeTruthy();
      expect(bodySlotContent?.textContent).toBe('Body content here');
    });

    it('header slot renders header content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test"><span slot="header">Custom Header</span>Body</hx-dialog>',
      );
      const headerSlotContent = el.querySelector('[slot="header"]');
      expect(headerSlotContent).toBeTruthy();
      expect(headerSlotContent?.textContent).toBe('Custom Header');
    });

    it('footer slot renders footer content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Body<button slot="footer">Confirm</button></hx-dialog>',
      );
      const footerSlotContent = el.querySelector('[slot="footer"]');
      expect(footerSlotContent).toBeTruthy();
      expect(footerSlotContent?.textContent).toBe('Confirm');
    });
  });

  // ─── Close button accessibility (2) ───

  describe('Close button accessibility', () => {
    it('close button has aria-label="Close dialog"', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const closeBtn = shadowQuery<HTMLButtonElement>(el, '[part="close-button"]')!;
      expect(closeBtn.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('close button is a <button> element', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const closeBtn = shadowQuery(el, '[part="close-button"]')!;
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });
  });

  // ─── aria-modal (2) ───

  describe('aria-modal attribute', () => {
    it('sets aria-modal="true" on the dialog element when modal=true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      const dialogEl = shadowQuery(el, 'dialog');
      expect(dialogEl?.getAttribute('aria-modal')).toBe('true');
    });

    it('omits aria-modal when modal=false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.modal = false;
      await el.updateComplete;
      const dialogEl = shadowQuery(el, 'dialog');
      expect(dialogEl?.hasAttribute('aria-modal')).toBe(false);
    });
  });

  // ─── Open/close state on native dialog (2) ───

  describe('Native dialog open state', () => {
    it('native dialog element is open after el.open = true', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test">Content</hx-dialog>',
      );
      el.open = true;
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog')!;
      expect(dialogEl.open).toBe(true);
    });

    it('native dialog element is closed after el.open = false', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Test">Content</hx-dialog>',
      );
      await el.updateComplete;
      el.open = false;
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog')!;
      expect(dialogEl.open).toBe(false);
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed default state', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog label="Test dialog">Dialog content here</hx-dialog>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when open with label', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open label="Confirm Action">Please confirm this action.</hx-dialog>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations with header, body, and footer slots', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog open label="Full Dialog">
          <span slot="header">Custom Header</span>
          <p>Body content</p>
          <span slot="footer">Footer action</span>
        </hx-dialog>`,
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when no-close-button is set', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open no-close-button label="No Close Button">Content</hx-dialog>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
