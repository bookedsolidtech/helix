import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDialog } from './hx-dialog.js';
import './index.js';

afterEach(cleanup);

describe('hx-dialog', () => {
  // ─── Rendering (5) ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "dialog" CSS part when open', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const dialogPart = shadowQuery(el, '[part="dialog"]');
      expect(dialogPart).toBeTruthy();
    });

    it('exposes "body" CSS part when open', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const bodyPart = shadowQuery(el, '[part="body"]');
      expect(bodyPart).toBeTruthy();
    });

    it('exposes "header" CSS part when heading is set', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Confirm Action"></hx-dialog>',
      );
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeTruthy();
    });

    it('exposes "footer" CSS part when footer slot has content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><button slot="footer">OK</button></hx-dialog>',
      );
      await el.updateComplete;
      // Allow slotchange event to fire
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const footerPart = shadowQuery(el, '[part="footer"]');
      expect(footerPart).toBeTruthy();
      expect(footerPart?.hasAttribute('hidden')).toBe(false);
    });
  });

  // ─── Properties (6) ───

  describe('Properties', () => {
    it('open=false — native dialog is not open by default', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(el.open).toBe(false);
      expect(dialogEl?.open).toBe(false);
    });

    it('open=true — native dialog is open', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(el.open).toBe(true);
      expect(dialogEl?.open).toBe(true);
    });

    it('modal=true — uses native dialog.showModal()', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open modal></hx-dialog>');
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      // When showModal() is used, dialog.open is true and it has aria-modal
      expect(dialogEl?.open).toBe(true);
      expect(dialogEl?.getAttribute('aria-modal')).toBe('true');
    });

    it('modal=false — uses native dialog.show() without aria-modal', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open modal="false"></hx-dialog>',
      );
      // Lit boolean attribute: presence means true; to set false, use property
      el.modal = false;
      await el.updateComplete;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(dialogEl?.open).toBe(true);
      expect(dialogEl?.hasAttribute('aria-modal')).toBe(false);
    });

    it('heading attribute — renders h2 with correct text', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Patient Confirmation"></hx-dialog>',
      );
      await el.updateComplete;
      const heading = shadowQuery<HTMLHeadingElement>(el, 'h2');
      expect(heading).toBeTruthy();
      expect(heading?.textContent?.trim()).toBe('Patient Confirmation');
    });

    it('close-on-backdrop attribute reflects on the element property', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog close-on-backdrop></hx-dialog>');
      await el.updateComplete;
      expect(el.closeOnBackdrop).toBe(true);
    });
  });

  // ─── Events (4) ───

  describe('Events', () => {
    it('dispatches hx-open when open is set to true', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.open = true;
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('dispatches hx-close when dialog is cancelled after being open', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      // _cancel() dispatches hx-close after setting open=false
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      dialogEl?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });

    it('hx-open is composed and bubbles', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-open');
      el.open = true;
      const event = await eventPromise;
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-cancel when Escape key is pressed on the native dialog', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-cancel');
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      dialogEl?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-close when close() is called', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.close();
      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(event.bubbles).toBe(true);
      expect(event.composed).toBe(true);
    });

    it('dispatches hx-close when open is set to false', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-close');
      el.open = false;
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Methods (3) ───

  describe('Methods', () => {
    it('show() sets open to true', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      expect(el.open).toBe(false);
      el.show();
      await el.updateComplete;
      expect(el.open).toBe(true);
    });

    it('showModal() sets open to true and modal to true', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      el.modal = false;
      await el.updateComplete;
      el.showModal();
      await el.updateComplete;
      expect(el.open).toBe(true);
      expect(el.modal).toBe(true);
    });

    it('close() sets open to false', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      expect(el.open).toBe(true);
      el.close();
      await el.updateComplete;
      expect(el.open).toBe(false);
    });
  });

  // ─── Slots (3) ───

  describe('Slots', () => {
    it('default slot renders body content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><p class="body-content">Body text</p></hx-dialog>',
      );
      await el.updateComplete;
      const slottedContent = el.querySelector('p.body-content');
      expect(slottedContent).toBeTruthy();
      expect(slottedContent?.textContent).toBe('Body text');
    });

    it('header slot renders custom header content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><span slot="header" class="custom-header">Custom</span></hx-dialog>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slottedHeader = el.querySelector('span.custom-header');
      expect(slottedHeader).toBeTruthy();
      expect(slottedHeader?.textContent).toBe('Custom');
    });

    it('footer slot renders action content', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><button slot="footer" class="confirm-btn">Confirm</button></hx-dialog>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slottedFooter = el.querySelector('button.confirm-btn');
      expect(slottedFooter).toBeTruthy();
      expect(slottedFooter?.textContent).toBe('Confirm');
    });
  });

  // ─── CSS Parts (5) ───

  describe('CSS Parts', () => {
    it('exposes "dialog" part on the inner content container', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="dialog"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('dialog');
    });

    it('exposes "body" part on the body region', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const part = shadowQuery(el, '[part="body"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('body');
    });

    it('exposes "header" part when heading is provided', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Dialog Title"></hx-dialog>',
      );
      await el.updateComplete;
      const part = shadowQuery(el, '[part="header"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('header');
    });

    it('exposes "footer" part in the shadow DOM', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><button slot="footer">OK</button></hx-dialog>',
      );
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const part = shadowQuery(el, '[part="footer"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('footer');
    });

    it('exposes "backdrop" part on non-modal open dialog', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      el.modal = false;
      await el.updateComplete;
      const part = shadowQuery(el, '[part="backdrop"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('backdrop');
    });
  });

  // ─── Accessibility (axe-core) (2) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in closed state', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog></hx-dialog>');
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in open state with heading', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Confirm Discharge">Are you sure?</hx-dialog>',
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
