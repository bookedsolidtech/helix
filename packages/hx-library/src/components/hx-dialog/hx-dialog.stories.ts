import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-dialog.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Dialog',
  component: 'hx-dialog',
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls whether the dialog is open.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    modal: {
      control: 'boolean',
      description:
        'When true, renders as a modal dialog with a backdrop and focus trap. When false, renders as a non-modal dialog.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    closeOnBackdrop: {
      name: 'close-on-backdrop',
      control: 'boolean',
      description: 'When true, clicking the backdrop closes the dialog.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    heading: {
      control: 'text',
      description:
        'Text content for the dialog heading. Used as the accessible label via aria-labelledby.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    open: false,
    modal: true,
    closeOnBackdrop: true,
    heading: '',
  },
  render: (args) => html`
    <hx-dialog
      ?open=${args.open}
      ?modal=${args.modal}
      ?close-on-backdrop=${args.closeOnBackdrop}
      heading=${args.heading}
    >
      <p>Dialog body content goes here.</p>
    </hx-dialog>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT — Closed state
// ════════════════════════════════════════════════════════════════════════════

/**
 * Default closed state of the dialog. The `hx-dialog` element is present in the DOM
 * but not visible. No `open` attribute is set. This is the baseline rendering
 * for an unactivated dialog component.
 */
export const Default: Story = {
  args: {
    open: false,
    modal: true,
    closeOnBackdrop: true,
    heading: 'Patient Record',
  },
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. MODAL OPEN — Open modal dialog with heading, body, and footer actions
// ════════════════════════════════════════════════════════════════════════════

/**
 * A fully open modal dialog with a heading, body content, and footer action buttons.
 * The dialog renders with an accessible heading via `aria-labelledby` and a visible
 * backdrop. The Cancel and Confirm buttons are slotted into the `footer` slot.
 *
 * In healthcare workflows this pattern is used for high-stakes confirmations such as
 * medication orders, discharge approvals, and prior authorization submissions.
 */
export const ModalOpen: Story = {
  render: () => html`
    <hx-dialog open modal heading="Confirm Medication Order">
      <p style="margin: 0 0 0.5rem; font-weight: 600;">Amoxicillin 500mg — 3x daily for 7 days</p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Please review the prescription details before confirming. This order will be sent to the
        pharmacy immediately upon confirmation.
      </p>
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer; font-weight: 600;"
        >
          Confirm Order
        </button>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);
    await expect(dialog?.hasAttribute('modal')).toBe(true);
    await expect(dialog?.getAttribute('heading')).toBe('Confirm Medication Order');

    const dialogPart = dialog?.shadowRoot?.querySelector('[part="dialog"]');
    await expect(dialogPart).toBeTruthy();

    const headerPart = dialog?.shadowRoot?.querySelector('[part="header"]');
    await expect(headerPart).toBeTruthy();

    const bodyPart = dialog?.shadowRoot?.querySelector('[part="body"]');
    await expect(bodyPart).toBeTruthy();

    const footerSlotContent = canvasElement.querySelector('[slot="footer"]');
    await expect(footerSlotContent).toBeTruthy();

    const footerButtons = footerSlotContent?.querySelectorAll('button');
    await expect(footerButtons?.length).toBe(2);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. NON-MODAL — Open non-modal dialog
// ════════════════════════════════════════════════════════════════════════════

/**
 * A non-modal dialog (`modal="false"`) that overlays without capturing focus or
 * blocking interaction with the rest of the page. A backdrop element is rendered
 * separately and does not use the native `<dialog>` modal layer.
 *
 * Useful for contextual panels, inline help, or secondary info drawers in
 * healthcare applications where the user needs to reference the underlying UI.
 */
export const NonModal: Story = {
  render: () => html`
    <div style="min-height: 200px; position: relative;">
      <p style="color: #6b7280; font-size: 0.875rem;">
        Background content remains interactive in non-modal mode.
      </p>
      <hx-dialog open ?modal=${false} heading="Lab Results Reference">
        <p style="margin: 0; font-size: 0.875rem;">
          Reference range: Hemoglobin A1c — normal below 5.7%, prediabetes 5.7–6.4%, diabetes 6.5%
          and above.
        </p>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);
    await expect(dialog?.hasAttribute('modal')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. NO BACKDROP CLOSE — Modal with close-on-backdrop disabled
// ════════════════════════════════════════════════════════════════════════════

/**
 * A modal dialog where clicking the backdrop does NOT close the dialog.
 * Setting `close-on-backdrop="false"` forces the user to use an explicit
 * action button to dismiss the dialog.
 *
 * This pattern is critical in healthcare workflows where accidental dismissal
 * could result in data loss — for example, when completing a multi-step intake
 * form or submitting a referral that requires explicit confirmation.
 */
export const NoBackdropClose: Story = {
  render: () => html`
    <hx-dialog open modal .closeOnBackdrop=${false} heading="Required: Complete Patient Intake">
      <p style="margin: 0 0 0.75rem; font-size: 0.875rem;">
        This intake form must be completed before the patient's appointment can be confirmed. You
        cannot dismiss this dialog by clicking outside.
      </p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Please use the action buttons below to save or cancel.
      </p>
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer; font-weight: 600;"
        >
          Save and Continue
        </button>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);

    // close-on-backdrop is a reflected boolean — verify closeOnBackdrop is false
    const closeOnBackdrop = dialog?.getAttribute('close-on-backdrop');
    // When the attribute is explicitly "false", the prop is false
    await expect(dialog?.closeOnBackdrop ?? true).toBe(false);
    // Attribute presence check — the attribute string value is "false"
    await expect(closeOnBackdrop).toBe('false');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. WITH CUSTOM HEADER — Using the header slot
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates the `header` slot for fully custom header content.
 * When content is assigned to the `header` slot, it replaces the built-in
 * heading rendering. This allows consuming applications to compose richer
 * headers with icons, status badges, or multi-line titles.
 *
 * Common in healthcare dashboards where dialog headers must include
 * patient identifiers, alert severity indicators, or workflow step labels.
 */
export const WithCustomHeader: Story = {
  render: () => html`
    <hx-dialog open modal aria-label="Critical Alert">
      <div slot="header" style="display: flex; align-items: center; gap: 0.75rem; width: 100%;">
        <span
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            background: #fef2f2;
            color: #dc2626;
            font-size: 1rem;
            flex-shrink: 0;
          "
          aria-hidden="true"
        >
          !
        </span>
        <div>
          <div style="font-weight: 700; font-size: 1rem; color: #111827;">Critical Alert</div>
          <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem;">
            Patient: Jane Doe — Room 4B
          </div>
        </div>
      </div>
      <p style="margin: 0 0 0.5rem; font-weight: 600; color: #991b1b;">
        Allergy interaction detected
      </p>
      <p style="margin: 0; font-size: 0.875rem; color: #374151;">
        The prescribed medication Penicillin conflicts with the patient's documented allergy. Please
        review and select an alternative treatment before proceeding.
      </p>
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
        >
          Review Alternatives
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #dc2626; color: #ffffff; cursor: pointer; font-weight: 600;"
        >
          Override with Note
        </button>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);

    const customHeader = canvasElement.querySelector('[slot="header"]');
    await expect(customHeader).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. WITH FOOTER — Footer slot with action buttons
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates the `footer` slot for action buttons and supplementary footer content.
 * The footer region is only rendered when content is assigned to the slot.
 * A separator border is drawn above the footer to visually distinguish it from the body.
 *
 * The three-button pattern shown here (destructive / secondary / primary) is a
 * standard confirmation layout for high-stakes operations in healthcare workflows.
 */
export const WithFooter: Story = {
  render: () => html`
    <hx-dialog open modal heading="Discharge Patient">
      <p style="margin: 0 0 0.75rem; font-size: 0.875rem;">
        You are about to discharge
        <strong>John Smith</strong> from <strong>Ward 3, Bed 12</strong>. Please confirm the
        discharge summary has been completed and reviewed.
      </p>
      <ul
        style="margin: 0; padding: 0 0 0 1.25rem; font-size: 0.875rem; color: #374151; line-height: 1.75;"
      >
        <li>Discharge summary signed by attending physician</li>
        <li>Prescription instructions provided to patient</li>
        <li>Follow-up appointment scheduled within 7 days</li>
      </ul>
      <div
        slot="footer"
        style="display: flex; gap: 0.75rem; justify-content: space-between; align-items: center; width: 100%;"
      >
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #fca5a5; border-radius: 0.375rem; background: #fff7f7; color: #dc2626; cursor: pointer;"
        >
          Cancel Discharge
        </button>
        <div style="display: flex; gap: 0.75rem;">
          <button
            style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
          >
            Save Draft
          </button>
          <button
            style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer; font-weight: 600;"
          >
            Confirm Discharge
          </button>
        </div>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);
    await expect(dialog?.getAttribute('heading')).toBe('Discharge Patient');

    const footerSlotContent = canvasElement.querySelector('[slot="footer"]');
    await expect(footerSlotContent).toBeTruthy();

    const footerButtons = footerSlotContent?.querySelectorAll('button');
    await expect(footerButtons?.length).toBe(3);

    const footerPart = dialog?.shadowRoot?.querySelector('[part="footer"]');
    await expect(footerPart).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. TRIGGER BUTTON — Programmatic open via external button
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates opening the dialog programmatically using `showModal()` called
 * from an external trigger button. This is the standard interaction pattern for
 * dialogs in application-level code — the dialog starts closed and is opened
 * in response to a user action.
 *
 * The `play` function simulates the full open cycle by finding the trigger button
 * and clicking it, then asserting the dialog reaches the open state.
 */
export const TriggerButton: Story = {
  render: () => html`
    <div>
      <button
        id="open-dialog-btn"
        style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer; font-weight: 600;"
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div');
          const dialog = host?.querySelector('hx-dialog') as
            | (HTMLElement & { showModal: () => void })
            | null;
          dialog?.showModal();
        }}
      >
        Schedule Appointment
      </button>

      <hx-dialog heading="Schedule Appointment" close-on-backdrop>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem;">
          Select a date and time for the patient's next appointment. All available slots are shown
          for the next 30 days.
        </p>
        <label
          style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; font-weight: 600;"
        >
          Preferred Date
          <input
            type="date"
            style="padding: 0.375rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem;"
          />
        </label>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
            @click=${(e: Event) => {
              const host = (e.target as HTMLElement)
                .closest('div[slot="footer"]')
                ?.closest('hx-dialog') as (HTMLElement & { close: () => void }) | null;
              host?.close();
            }}
          >
            Cancel
          </button>
          <button
            style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer; font-weight: 600;"
          >
            Book Appointment
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const triggerBtn = canvasElement.querySelector<HTMLButtonElement>('#open-dialog-btn');
    await expect(triggerBtn).toBeTruthy();

    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(false);

    if (!triggerBtn) throw new Error('Missing #open-dialog-btn');
    triggerBtn.click();

    // Allow Lit update cycle to complete
    await dialog?.updateComplete;

    await expect(dialog?.hasAttribute('open')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. EVENT FIRING — hx-open and hx-close event verification
// ════════════════════════════════════════════════════════════════════════════

/**
 * Verifies the `hx-open` and `hx-close` event contract. When the dialog is opened
 * and closed programmatically, the corresponding custom events must fire with
 * `bubbles: true` and `composed: true` to cross Shadow DOM boundaries.
 *
 * This test story is critical for consumers that rely on event-driven state
 * management in healthcare application shells.
 */
export const EventFiring: Story = {
  render: () => html`
    <div>
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1rem;">
        <button
          id="open-event-btn"
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #ffffff; cursor: pointer;"
          @click=${(e: Event) => {
            const host = (e.target as HTMLElement).closest('div');
            const dlg = host?.querySelector('hx-dialog') as
              | (HTMLElement & { showModal: () => void })
              | null;
            dlg?.showModal();
          }}
        >
          Open
        </button>
        <button
          id="close-event-btn"
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
          @click=${(e: Event) => {
            const host = (e.target as HTMLElement).closest('div');
            const dlg = host?.querySelector('hx-dialog') as
              | (HTMLElement & { close: () => void })
              | null;
            dlg?.close();
          }}
        >
          Close
        </button>
      </div>
      <div
        id="event-log"
        style="font-family: monospace; font-size: 0.75rem; color: #374151; padding: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.375rem; min-height: 2rem;"
      >
        No events fired yet.
      </div>

      <hx-dialog
        heading="Event Demo"
        @hx-open=${(e: Event) => {
          const log = (e.target as HTMLElement).closest('div')?.querySelector('#event-log');
          if (log) log.textContent = 'hx-open fired';
        }}
        @hx-close=${(e: Event) => {
          const log = (e.target as HTMLElement).closest('div')?.querySelector('#event-log');
          if (log) log.textContent = 'hx-close fired';
        }}
      >
        <p style="margin: 0; font-size: 0.875rem;">
          Open and close this dialog using the buttons above to observe the event log update.
        </p>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();

    let openFired = false;
    let closeFired = false;

    if (!dialog) throw new Error('Missing <hx-dialog>');
    dialog.addEventListener('hx-open', () => {
      openFired = true;
    });
    dialog.addEventListener('hx-close', () => {
      closeFired = true;
    });

    // Open the dialog
    const openBtn = canvasElement.querySelector<HTMLButtonElement>('#open-event-btn');
    await expect(openBtn).toBeTruthy();
    if (!openBtn) throw new Error('Missing #open-event-btn');
    openBtn.click();

    await dialog?.updateComplete;
    await expect(openFired).toBe(true);
    await expect(dialog?.hasAttribute('open')).toBe(true);

    // Close the dialog
    const closeBtn = canvasElement.querySelector<HTMLButtonElement>('#close-event-btn');
    await expect(closeBtn).toBeTruthy();
    if (!closeBtn) throw new Error('Missing #close-event-btn');
    closeBtn.click();

    await dialog?.updateComplete;
    await expect(closeFired).toBe(true);
    await expect(dialog?.hasAttribute('open')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. CSS CUSTOM PROPERTIES — Theming demonstration
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates theming via CSS custom properties exposed by `hx-dialog`.
 * All visual properties are overridable at the component level using `--hx-dialog-*`
 * tokens. No Shadow DOM penetration is required — consumers use these tokens
 * on the `:host` element.
 *
 * In healthcare design systems, consistent dialog theming across light/dark/high-contrast
 * modes is achieved by cascading semantic tokens through the `--hx-dialog-*` layer.
 */
export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .themed-dialog {
        --hx-dialog-bg: #1e293b;
        --hx-dialog-color: #f1f5f9;
        --hx-dialog-border-radius: 0.25rem;
        --hx-dialog-heading-color: #38bdf8;
        --hx-dialog-header-border-color: #334155;
        --hx-dialog-footer-border-color: #334155;
        --hx-dialog-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6);
        --hx-dialog-width: 28rem;
      }
    </style>
    <hx-dialog class="themed-dialog" open modal heading="Dark Theme Dialog">
      <p style="margin: 0 0 0.5rem; font-size: 0.875rem;">
        This dialog uses CSS custom properties to apply a dark theme without modifying the Shadow
        DOM. Semantic token overrides cascade correctly into the component.
      </p>
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #475569; border-radius: 0.375rem; background: transparent; color: #94a3b8; cursor: pointer;"
        >
          Dismiss
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #0284c7; color: #ffffff; cursor: pointer; font-weight: 600;"
        >
          Confirm
        </button>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);
    await expect(dialog?.classList.contains('themed-dialog')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 10. HEALTHCARE SCENARIO — Deletion confirmation
// ════════════════════════════════════════════════════════════════════════════

/**
 * A real-world healthcare scenario: a destructive action confirmation dialog.
 * The dialog heading, body copy, and footer buttons follow the danger confirmation
 * pattern used when a clinician initiates a permanently irreversible operation
 * such as deleting a patient record or voiding a signed order.
 *
 * The dialog is kept open (`open` attribute present) so that visual regression
 * baselines capture the full rendered state of this critical pattern.
 */
export const DangerConfirmation: Story = {
  render: () => html`
    <hx-dialog open modal .closeOnBackdrop=${false} heading="Delete Patient Record">
      <div
        style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 0.375rem; margin-bottom: 1rem;"
      >
        <span style="color: #dc2626; font-size: 1.25rem; line-height: 1; flex-shrink: 0;">!</span>
        <p style="margin: 0; font-size: 0.875rem; color: #991b1b; font-weight: 600;">
          This action is permanent and cannot be undone.
        </p>
      </div>
      <p style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #374151;">
        You are about to permanently delete the patient record for
        <strong>John Smith (DOB: 1965-04-12, MRN: 00482910)</strong>. All associated notes, orders,
        lab results, imaging reports, and attachments will be destroyed.
      </p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Please type the patient's MRN to confirm deletion.
      </p>
      <input
        type="text"
        placeholder="Enter MRN to confirm"
        aria-label="Enter MRN to confirm deletion"
        style="display: block; width: 100%; margin-top: 0.75rem; padding: 0.5rem; border: 1px solid #fca5a5; border-radius: 0.375rem; font-size: 0.875rem; box-sizing: border-box;"
      />
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #ffffff; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #dc2626; color: #ffffff; cursor: pointer; font-weight: 600;"
        >
          Delete Record Permanently
        </button>
      </div>
    </hx-dialog>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');
    await expect(dialog).toBeTruthy();
    await expect(dialog?.hasAttribute('open')).toBe(true);
    await expect(dialog?.getAttribute('heading')).toBe('Delete Patient Record');

    const mrnInput = canvasElement.querySelector<HTMLInputElement>(
      'input[aria-label="Enter MRN to confirm deletion"]',
    );
    await expect(mrnInput).toBeTruthy();

    const footerSlot = canvasElement.querySelector('[slot="footer"]');
    await expect(footerSlot).toBeTruthy();
  },
};
