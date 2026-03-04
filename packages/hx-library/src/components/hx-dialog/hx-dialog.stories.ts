import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-dialog.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Dialog',
  component: 'hx-dialog',
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description:
        'Controls dialog visibility. Set to true to open, false to close.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    modal: {
      control: 'boolean',
      description:
        'When true (default), renders as a modal dialog with backdrop and focus trap. When false, renders as a non-modal dialog.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible title for the dialog, referenced by aria-labelledby. Displayed in the header.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    closeOnOverlay: {
      control: 'boolean',
      description:
        'When true, clicking the backdrop overlay closes the dialog.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'When true (default), pressing Escape closes the dialog.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    noCloseButton: {
      control: 'boolean',
      description:
        'When true, hides the X close button in the dialog header. Users must use footer actions to dismiss.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    open: true,
    modal: true,
    label: 'Dialog Title',
    closeOnOverlay: false,
    closeOnEscape: true,
    noCloseButton: false,
  },
  render: (args) => html`
    <hx-dialog
      ?open=${args.open}
      ?modal=${args.modal}
      label=${args.label ?? ''}
      ?close-on-overlay=${args.closeOnOverlay}
      ?close-on-escape=${args.closeOnEscape}
      ?no-close-button=${args.noCloseButton}
      @hx-close=${(e: Event) => {
        const dialog = e.target as HTMLElement & { open: boolean };
        dialog.open = false;
      }}
    >
      <p>This is the dialog body content. Use this space to provide context or additional information to the user.</p>
      <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button
          @click=${(e: Event) => {
            const dialog = (e.target as HTMLElement)
              .closest('hx-dialog') as HTMLElement & { open: boolean };
            if (dialog) dialog.open = false;
          }}
        >Cancel</button>
        <button
          @click=${(e: Event) => {
            const dialog = (e.target as HTMLElement)
              .closest('hx-dialog') as HTMLElement & { open: boolean };
            if (dialog) dialog.open = false;
          }}
        >Confirm</button>
      </div>
    </hx-dialog>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/**
 * The standard modal dialog. Opens with a title in the header, body content,
 * and Cancel / Confirm action buttons in the footer. The built-in X button
 * and the Escape key both close the dialog.
 */
export const Default: Story = {
  args: {
    open: true,
    label: 'Patient Record — Confirm Action',
  },
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Open Dialog
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${args.modal}
        label=${args.label ?? 'Dialog Title'}
        ?close-on-overlay=${args.closeOnOverlay}
        ?close-on-escape=${args.closeOnEscape}
        ?no-close-button=${args.noCloseButton}
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
      >
        <p>
          You are about to discharge patient <strong>Jane Doe (MRN 48821)</strong>.
          This action will update the patient status in the EHR and notify the
          care team. Are you sure you want to proceed?
        </p>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Cancel
          </button>
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Confirm Discharge
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.shadowRoot).toBeTruthy();

    const nativeDialog = dialog?.shadowRoot?.querySelector('[part="dialog"]');
    await expect(nativeDialog).toBeTruthy();

    const header = dialog?.shadowRoot?.querySelector('[part="header"]');
    await expect(header).toBeTruthy();

    const body = dialog?.shadowRoot?.querySelector('[part="body"]');
    await expect(body).toBeTruthy();

    const footer = dialog?.shadowRoot?.querySelector('[part="footer"]');
    await expect(footer).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. NON-MODAL
// ─────────────────────────────────────────────────

/**
 * A non-modal dialog rendered as a floating panel that does not block interaction
 * with the rest of the page. Suitable for supplementary information panels,
 * contextual help, or secondary workflows that should not interrupt the user.
 */
export const NonModal: Story = {
  args: {
    open: true,
    modal: false,
    label: 'Clinical Notes — Quick View',
  },
  render: (args) => html`
    <div style="min-height: 300px; position: relative;">
      <p style="margin: 0 0 1rem;">
        The dialog below is non-modal. You can still interact with this text and
        other page elements while it is open.
      </p>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Open Panel
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${false}
        label=${args.label ?? 'Panel Title'}
        ?close-on-overlay=${args.closeOnOverlay}
        ?close-on-escape=${args.closeOnEscape}
        ?no-close-button=${args.noCloseButton}
        style="--hx-dialog-width: 320px;"
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
      >
        <p>
          Last updated: <strong>2026-03-04 09:14</strong><br />
          Provider: Dr. Chen<br />
          Note: Patient reports improvement in respiratory symptoms. Oxygen
          saturation stable at 98%. Continue current treatment plan.
        </p>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Close
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.modal).toBe(false);

    const nativeDialog = dialog?.shadowRoot?.querySelector('[part="dialog"]');
    await expect(nativeDialog).toBeTruthy();

    // Non-modal dialogs must not carry aria-modal
    await expect(nativeDialog?.getAttribute('aria-modal')).toBeNull();

    // Non-modal dialogs render no overlay element
    const overlay = dialog?.shadowRoot?.querySelector('[part="overlay"]');
    await expect(overlay).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 3. WITH FORM
// ─────────────────────────────────────────────────

/**
 * A dialog containing a form. Demonstrates the pattern for collecting user input
 * inside a modal — commonly used for add/edit workflows in the EHR where the
 * user must provide data before the action can proceed.
 */
export const WithForm: Story = {
  args: {
    open: true,
    label: 'Add Medication Order',
  },
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Add Medication
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${args.modal}
        label=${args.label ?? 'Add Medication Order'}
        ?close-on-overlay=${args.closeOnOverlay}
        ?close-on-escape=${args.closeOnEscape}
        ?no-close-button=${args.noCloseButton}
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
      >
        <form
          id="medication-form"
          style="display: flex; flex-direction: column; gap: 1rem;"
          @submit=${(e: Event) => {
            e.preventDefault();
            const dialog = (e.target as HTMLElement)
              .closest('hx-dialog') as HTMLElement & { open: boolean };
            if (dialog) dialog.open = false;
          }}
        >
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="med-name" style="font-weight: 600; font-size: 0.875rem;">
              Medication Name <span aria-hidden="true">*</span>
            </label>
            <input
              id="med-name"
              type="text"
              name="medication"
              required
              placeholder="e.g. Amoxicillin 500mg"
              style="padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem;"
            />
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <label for="med-notes" style="font-weight: 600; font-size: 0.875rem;">
              Clinical Notes
            </label>
            <textarea
              id="med-notes"
              name="notes"
              rows="4"
              placeholder="Add dosing instructions, frequency, or clinical rationale…"
              style="padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; resize: vertical;"
            ></textarea>
          </div>
        </form>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            type="button"
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Cancel
          </button>
          <button type="submit" form="medication-form">
            Submit Order
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.open).toBe(true);

    const body = dialog?.shadowRoot?.querySelector('[part="body"]');
    await expect(body).toBeTruthy();

    // Verify slotted form content is present
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const nameInput = canvasElement.querySelector('#med-name');
    await expect(nameInput).toBeTruthy();

    const notesArea = canvasElement.querySelector('#med-notes');
    await expect(notesArea).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. NO CLOSE BUTTON
// ─────────────────────────────────────────────────

/**
 * A dialog with the header X button hidden via `no-close-button`. The user must
 * interact with a footer action to dismiss. Use this pattern when an explicit
 * decision is required — for example, confirming a destructive or irreversible
 * clinical action.
 */
export const NoCloseButton: Story = {
  args: {
    open: true,
    noCloseButton: true,
    label: 'Confirm Medication Discontinuation',
  },
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Open Dialog
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${args.modal}
        label=${args.label ?? 'Confirm Action'}
        ?close-on-overlay=${args.closeOnOverlay}
        ?close-on-escape=${args.closeOnEscape}
        no-close-button
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
      >
        <p>
          You are about to discontinue <strong>Metoprolol 25mg</strong> for patient
          Jane Doe. This is a cardiac medication. Discontinuing without a clinical
          order may pose patient safety risks.
        </p>
        <p>Please confirm your intent or cancel to return to the medication list.</p>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Cancel
          </button>
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Discontinue Medication
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.noCloseButton).toBe(true);

    // The X close button must not be rendered in shadow DOM
    const closeBtn = dialog?.shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeNull();

    // Footer actions must still be present
    const footer = dialog?.shadowRoot?.querySelector('[part="footer"]');
    await expect(footer).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 5. CLOSE ON OVERLAY
// ─────────────────────────────────────────────────

/**
 * A dialog that closes when the user clicks the backdrop overlay, controlled by
 * the `close-on-overlay` attribute. This is a lighter interaction model suitable
 * for informational or non-destructive dialogs where accidental dismissal is
 * an acceptable risk.
 */
export const CloseOnOverlay: Story = {
  args: {
    open: true,
    closeOnOverlay: true,
    label: 'Session Information',
  },
  render: (args) => html`
    <div>
      <button
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Open Dialog
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${args.modal}
        label=${args.label ?? 'Session Information'}
        close-on-overlay
        ?close-on-escape=${args.closeOnEscape}
        ?no-close-button=${args.noCloseButton}
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
      >
        <p>
          Your current session is active. You are logged in as
          <strong>Dr. Sarah Patel</strong> and your session expires in
          <strong>28 minutes</strong>.
        </p>
        <p>
          Click anywhere outside this dialog or press Escape to dismiss.
        </p>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Close
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.closeOnOverlay).toBe(true);

    // Overlay must be present on modal dialogs
    const overlay = dialog?.shadowRoot?.querySelector('[part="overlay"]');
    await expect(overlay).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 6. PLAYGROUND
// ─────────────────────────────────────────────────

/**
 * Fully interactive playground story. Toggle all controls in the Storybook
 * Controls panel and click the trigger button to test every configuration of
 * the dialog. This story renders both the trigger and the dialog so the full
 * open/close interaction can be exercised in the canvas.
 */
export const Playground: Story = {
  args: {
    open: false,
    modal: true,
    label: 'Playground Dialog',
    closeOnOverlay: false,
    closeOnEscape: true,
    noCloseButton: false,
  },
  render: (args) => html`
    <div style="padding: 2rem;">
      <p style="margin: 0 0 1rem; font-size: 0.875rem; color: #6b7280;">
        Use the Controls panel to configure the dialog, then click the button below to open it.
      </p>
      <button
        style="padding: 0.5rem 1.25rem; border-radius: 0.375rem; cursor: pointer;"
        @click=${(e: Event) => {
          const host = (e.target as HTMLElement).closest('div') as HTMLDivElement;
          const dialog = host?.querySelector('hx-dialog') as HTMLElement & {
            open: boolean;
          };
          if (dialog) dialog.open = true;
        }}
      >
        Open Dialog
      </button>
      <hx-dialog
        ?open=${args.open}
        ?modal=${args.modal}
        label=${args.label ?? 'Playground Dialog'}
        ?close-on-overlay=${args.closeOnOverlay}
        ?close-on-escape=${args.closeOnEscape}
        ?no-close-button=${args.noCloseButton}
        @hx-open=${() => {}}
        @hx-close=${(e: Event) => {
          const dialog = e.target as HTMLElement & { open: boolean };
          dialog.open = false;
        }}
        @hx-request-close=${() => {}}
      >
        <p>
          This is the playground dialog body. Configure properties using the
          Controls panel on the right to test different combinations of
          <code>modal</code>, <code>closeOnOverlay</code>,
          <code>closeOnEscape</code>, and <code>noCloseButton</code>.
        </p>
        <p>
          Slots: the header label is driven by the <code>label</code> property.
          Footer actions are slotted below.
        </p>
        <div slot="footer" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Cancel
          </button>
          <button
            @click=${(e: Event) => {
              const dialog = (e.target as HTMLElement)
                .closest('hx-dialog') as HTMLElement & { open: boolean };
              if (dialog) dialog.open = false;
            }}
          >
            Confirm
          </button>
        </div>
      </hx-dialog>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dialog = canvasElement.querySelector('hx-dialog');

    await expect(dialog).toBeTruthy();
    await expect(dialog?.shadowRoot).toBeTruthy();

    // Playground starts closed — verify open is false
    await expect(dialog?.open).toBe(false);

    // Trigger button must be present
    const triggerBtn = canvasElement.querySelector('button');
    await expect(triggerBtn).toBeTruthy();
  },
};
