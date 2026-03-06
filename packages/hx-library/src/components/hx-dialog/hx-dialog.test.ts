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
      const el = await fixture<HelixDialog>('<hx-dialog open modal="false"></hx-dialog>');
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
      dialogEl?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
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
      dialogEl?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
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
      const el = await fixture<HelixDialog>('<hx-dialog open heading="Dialog Title"></hx-dialog>');
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

  // ─── Focus Trap (3) ───

  describe('Focus Trap', () => {
    it('modal dialog wraps Tab from last focusable element to first', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog open heading="Test">
          <button id="first-btn">First</button>
          <button slot="footer" id="last-btn">Last</button>
        </hx-dialog>`,
      );
      el.modal = true;
      await el.updateComplete;
      // Wait for focus cache to populate
      await new Promise((r) => setTimeout(r, 50));

      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      const lastBtn = el.querySelector('#last-btn') as HTMLElement;
      const firstBtn = el.querySelector('#first-btn') as HTMLElement;

      lastBtn.focus();
      dialogEl?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      );
      await el.updateComplete;

      expect(document.activeElement).toBe(firstBtn);
    });

    it('modal dialog wraps Shift+Tab from first focusable element to last', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog open heading="Test">
          <button id="first-btn">First</button>
          <button slot="footer" id="last-btn">Last</button>
        </hx-dialog>`,
      );
      el.modal = true;
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      const lastBtn = el.querySelector('#last-btn') as HTMLElement;
      const firstBtn = el.querySelector('#first-btn') as HTMLElement;

      firstBtn.focus();
      dialogEl?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await el.updateComplete;

      expect(document.activeElement).toBe(lastBtn);
    });

    it('non-modal dialog does not trap Tab focus', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Non-modal"><button id="btn">OK</button></hx-dialog>',
      );
      el.modal = false;
      await el.updateComplete;

      const btn = el.querySelector('#btn') as HTMLElement;
      btn.focus();

      const preventedCount = 0;
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      dialogEl?.dispatchEvent(tabEvent);

      // The non-modal guard means _trapFocus is never called; preventDefault should not be called
      expect(tabEvent.defaultPrevented).toBe(false);
      expect(preventedCount).toBe(0);
    });
  });

  // ─── Focus Management (3) ───

  describe('Focus Management', () => {
    it('restores focus to trigger element after dialog closes (D1)', async () => {
      const wrapper = document.createElement('div');
      const triggerBtn = document.createElement('button');
      triggerBtn.id = 'trigger';
      triggerBtn.textContent = 'Open';
      wrapper.appendChild(triggerBtn);
      document.body.appendChild(wrapper);

      const el = await fixture<HelixDialog>(
        '<hx-dialog heading="Focus Test"><button id="inner">OK</button></hx-dialog>',
      );

      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      el.show();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      el.close();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(document.activeElement).toBe(triggerBtn);
      wrapper.remove();
    });

    it('sets initial focus on first focusable element after open (D3)', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog heading="Focus Test">
          <button id="first-focusable">First</button>
          <button id="second-focusable">Second</button>
        </hx-dialog>`,
      );

      el.show();
      await el.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const firstBtn = el.querySelector('#first-focusable');
      expect(document.activeElement).toBe(firstBtn);
    });

    it('locks body scroll when modal opens and restores on close (D4)', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog modal heading="Scroll Lock Test">Content</hx-dialog>',
      );

      const originalOverflow = document.body.style.overflow;
      el.show();
      await el.updateComplete;

      expect(document.body.style.overflow).toBe('hidden');

      el.close();
      await el.updateComplete;

      expect(document.body.style.overflow).toBe(originalOverflow);
    });
  });

  // ─── Backdrop Click (2) ───

  describe('Backdrop Click', () => {
    it('closes modal dialog when backdrop area is clicked and closeOnBackdrop is true', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open heading="Test"></hx-dialog>');
      await el.updateComplete;

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-cancel');
      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      // Simulate a click on the dialog element itself (the backdrop area in modal mode)
      dialogEl?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      const event = await eventPromise;
      expect(event).toBeTruthy();
      expect(el.open).toBe(false);
    });

    it('does not close dialog when backdrop is clicked and closeOnBackdrop is false', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open heading="Test"></hx-dialog>');
      el.closeOnBackdrop = false;
      await el.updateComplete;

      let cancelled = false;
      el.addEventListener('hx-cancel', () => {
        cancelled = true;
      });

      const dialogEl = shadowQuery<HTMLDialogElement>(el, 'dialog');
      dialogEl?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await el.updateComplete;
      expect(cancelled).toBe(false);
      expect(el.open).toBe(true);
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
