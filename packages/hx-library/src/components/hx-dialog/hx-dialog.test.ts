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

    it('exposes "header" CSS part always (built-in close button renders header)', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open></hx-dialog>');
      await el.updateComplete;
      const headerPart = shadowQuery(el, '[part="header"]');
      expect(headerPart).toBeTruthy();
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
      // Wait for slotchange event to propagate so the footer part visibility is updated
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

    it('variant="alertdialog" — sets role="alertdialog" on native dialog element (D9/D12)', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Drug Interaction" variant="alertdialog"></hx-dialog>',
      );
      await el.updateComplete;
      const nativeDialog = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(nativeDialog?.getAttribute('role')).toBe('alertdialog');
    });

    it('variant="dialog" — does not set explicit role on native dialog element', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Confirm" variant="dialog"></hx-dialog>',
      );
      await el.updateComplete;
      const nativeDialog = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(nativeDialog?.hasAttribute('role')).toBe(false);
    });

    it('description — renders visually-hidden span with aria-describedby (D8)', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Test" description="Additional context for screen readers."></hx-dialog>',
      );
      await el.updateComplete;
      const descEl = shadowQuery(el, '.dialog__description');
      expect(descEl).toBeTruthy();
      expect(descEl?.textContent?.trim()).toBe('Additional context for screen readers.');

      const nativeDialog = shadowQuery<HTMLDialogElement>(el, 'dialog');
      expect(nativeDialog?.hasAttribute('aria-describedby')).toBe(true);
    });

    it('close(returnValue) — stores returnValue on native dialog (D11)', async () => {
      const el = await fixture<HelixDialog>('<hx-dialog open heading="Test"></hx-dialog>');
      await el.updateComplete;
      el.close('confirmed');
      await el.updateComplete;
      expect(el.returnValue).toBe('confirmed');
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
      // Wait for slotchange event to propagate and component to re-render with header slot content
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
      // Wait for slotchange event to propagate and component to re-render with footer slot content
      await new Promise((r) => setTimeout(r, 50));
      await el.updateComplete;
      const slottedFooter = el.querySelector('button.confirm-btn');
      expect(slottedFooter).toBeTruthy();
      expect(slottedFooter?.textContent).toBe('Confirm');
    });
  });

  // ─── CSS Parts (6) ───

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

    it('exposes "close-button" part in the header (D17)', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open heading="Close Button Test"></hx-dialog>',
      );
      await el.updateComplete;
      const part = shadowQuery(el, '[part="close-button"]');
      expect(part).toBeTruthy();
      expect(part?.getAttribute('part')).toBe('close-button');
    });

    it('exposes "footer" part in the shadow DOM', async () => {
      const el = await fixture<HelixDialog>(
        '<hx-dialog open><button slot="footer">OK</button></hx-dialog>',
      );
      // Wait for slotchange event to propagate so the footer CSS part is rendered
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
      // Allow brief settle time for the focus-trap focusable element cache to populate
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
      // Allow brief settle time for the focus-trap focusable element cache to populate
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

  // ─── Focus Management (D6, D7) ───

  describe('Focus Management', () => {
    it('D7 — sets initial focus on first focusable element when dialog opens', async () => {
      const trigger = document.createElement('button');
      trigger.textContent = 'Open Dialog';
      document.body.appendChild(trigger);
      trigger.focus();

      const el = await fixture<HelixDialog>(
        `<hx-dialog heading="Focus Test">
          <button id="first-focusable">First</button>
          <button slot="footer" id="last-focusable">Last</button>
        </hx-dialog>`,
      );

      el.showModal();
      await el.updateComplete;
      // Allow microtask queue to flush so the updateComplete.then() initial-focus callback runs
      await new Promise((r) => setTimeout(r, 50));

      const firstFocusable = el.querySelector('#first-focusable') as HTMLElement;
      expect(document.activeElement).toBe(firstFocusable);

      document.body.removeChild(trigger);
    });

    it('D6 — restores focus to trigger element when dialog closes (WCAG 2.4.3)', async () => {
      const trigger = document.createElement('button');
      trigger.id = 'trigger-btn';
      trigger.textContent = 'Open Dialog';
      document.body.appendChild(trigger);

      const el = await fixture<HelixDialog>(
        '<hx-dialog heading="Focus Restore Test"><button>OK</button></hx-dialog>',
      );

      // Focus the trigger, then open the dialog (as if trigger opened it)
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      el.showModal();
      await el.updateComplete;
      // Allow microtask queue to flush so the updateComplete.then() initial-focus callback runs
      await new Promise((r) => setTimeout(r, 50));

      // Close the dialog
      el.close();
      await el.updateComplete;

      // Focus should return to the trigger
      expect(document.activeElement).toBe(trigger);

      document.body.removeChild(trigger);
    });
  });

  // ─── Form Submission (D13) ───

  describe('Form Submission', () => {
    it('D13 — form inside dialog fires submit event and dialog remains open', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog open heading="Form Test">
          <form id="test-form">
            <input type="text" name="field" value="test" />
            <button type="submit">Submit</button>
          </form>
        </hx-dialog>`,
      );
      await el.updateComplete;

      let submitted = false;
      const form = el.querySelector<HTMLFormElement>('#test-form');
      form?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitted = true;
      });

      const submitBtn = el.querySelector<HTMLButtonElement>('button[type="submit"]');
      submitBtn?.click();

      await el.updateComplete;
      expect(submitted).toBe(true);
      // Dialog should remain open — form submission alone does not close the dialog
      expect(el.open).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) (3) ───

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

    it('D14 — has no axe violations with custom header slot and aria-label', async () => {
      const el = await fixture<HelixDialog>(
        `<hx-dialog open aria-label="Critical Alert">
          <div slot="header">
            <strong>Critical Alert</strong>
          </div>
          <p>Drug interaction detected.</p>
        </hx-dialog>`,
      );
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
