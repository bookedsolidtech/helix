import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-button.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'ghost'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button. Controls padding, font-size, and min-height.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled. Prevents interaction and fires no events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description:
        'The type attribute for the underlying button element. Use "submit" or "reset" for form-associated behavior.',
      table: {
        category: 'Form',
        defaultValue: { summary: 'button' },
        type: { summary: "'button' | 'submit' | 'reset'" },
      },
    },
    label: {
      control: 'text',
      description: 'Button label text (passed via the default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    type: 'button',
    label: 'Schedule Appointment',
  },
  render: (args) => html`
    <hx-button
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${args.label}
    </hx-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies click interaction and hx-click event
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Schedule Appointment',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxButton!.addEventListener('hx-click', handler);

    await userEvent.click(innerButton!);
    await expect(eventFired).toBe(true);

    hxButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES — Primary, Secondary, Ghost
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Confirm Order',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'View Details',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Cancel',
  },
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES — Small, Medium, Large
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Edit',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Submit Request',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Begin Assessment',
  },
};

// ─────────────────────────────────────────────────
// 4. STATE STORIES — Disabled
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Unavailable',
  },
};

// ─────────────────────────────────────────────────
// 5. BUTTON TYPES — button, submit, reset
// ─────────────────────────────────────────────────

export const TypeButton: Story = {
  args: {
    type: 'button',
    label: 'Standard Action',
  },
};

export const TypeSubmit: Story = {
  args: {
    type: 'submit',
    variant: 'primary',
    label: 'Submit Referral',
  },
};

export const TypeReset: Story = {
  args: {
    type: 'reset',
    variant: 'secondary',
    label: 'Reset Form',
  },
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-button variant="primary">Primary</hx-button>
      <hx-button variant="secondary">Secondary</hx-button>
      <hx-button variant="ghost">Ghost</hx-button>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-button hx-size="sm">Small</hx-button>
      <hx-button hx-size="md">Medium</hx-button>
      <hx-button hx-size="lg">Large</hx-button>
    </div>
  `,
};

export const AllCombinations: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, auto); gap: 1rem; align-items: center; justify-items: start;"
    >
      <!-- Header row -->
      <strong>Small</strong>
      <strong>Medium</strong>
      <strong>Large</strong>

      <!-- Primary -->
      <hx-button variant="primary" hx-size="sm">Primary SM</hx-button>
      <hx-button variant="primary" hx-size="md">Primary MD</hx-button>
      <hx-button variant="primary" hx-size="lg">Primary LG</hx-button>

      <!-- Secondary -->
      <hx-button variant="secondary" hx-size="sm">Secondary SM</hx-button>
      <hx-button variant="secondary" hx-size="md">Secondary MD</hx-button>
      <hx-button variant="secondary" hx-size="lg">Secondary LG</hx-button>

      <!-- Ghost -->
      <hx-button variant="ghost" hx-size="sm">Ghost SM</hx-button>
      <hx-button variant="ghost" hx-size="md">Ghost MD</hx-button>
      <hx-button variant="ghost" hx-size="lg">Ghost LG</hx-button>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, auto); gap: 1rem; align-items: center; justify-items: start;"
    >
      <strong>Primary</strong>
      <strong>Secondary</strong>
      <strong>Ghost</strong>

      <!-- Default -->
      <hx-button variant="primary">Default</hx-button>
      <hx-button variant="secondary">Default</hx-button>
      <hx-button variant="ghost">Default</hx-button>

      <!-- Disabled -->
      <hx-button variant="primary" disabled>Disabled</hx-button>
      <hx-button variant="secondary" disabled>Disabled</hx-button>
      <hx-button variant="ghost" disabled>Disabled</hx-button>
    </div>
    <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
      Hover and focus states are visible on interaction. Disabled buttons render at reduced opacity.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 7. COMPOSITION STORIES
// ─────────────────────────────────────────────────

export const ButtonGroup: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 0.75rem; align-items: center;"
      role="group"
      aria-label="Patient actions"
    >
      <hx-button variant="primary">Save Record</hx-button>
      <hx-button variant="secondary">Review</hx-button>
      <hx-button variant="ghost">Discard</hx-button>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <hx-button variant="primary">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        style="vertical-align: middle;"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add Patient
    </hx-button>
  `,
};

export const IconOnly: Story = {
  render: () => html`
    <hx-button variant="ghost" aria-label="Close dialog">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </hx-button>
  `,
};

export const FullWidth: Story = {
  render: () => html`
    <div style="max-width: 480px;">
      <hx-button variant="primary" style="display: block; width: 100%;">
        Complete Registration
      </hx-button>
    </div>
  `,
};

export const InAForm: Story = {
  render: () => html`
    <form
      id="referral-form"
      @submit=${(e: Event) => {
        e.preventDefault();
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px;"
    >
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Patient Name</span>
        <input
          type="text"
          value="Jane Doe"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Referral Reason</span>
        <input
          type="text"
          value="Cardiology consult"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <div style="display: flex; gap: 0.75rem;">
        <hx-button type="submit" variant="primary">Submit Referral</hx-button>
        <hx-button type="reset" variant="secondary">Reset</hx-button>
      </div>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const submitButton = canvasElement.querySelector('hx-button[type="submit"]');
    await expect(submitButton).toBeTruthy();

    let formSubmitted = false;
    form!.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      formSubmitted = true;
    });

    const innerButton = submitButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);
    await expect(formSubmitted).toBe(true);
  },
};

export const InACard: Story = {
  render: () => html`
    <div
      style="max-width: 400px; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <div style="padding: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem;">Patient Summary</h3>
        <p style="margin: 0; color: #6b7280;">
          Review the patient chart before proceeding with the discharge process.
        </p>
      </div>
      <div
        style="padding: 1rem 1.5rem; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;"
      >
        <hx-button variant="ghost" hx-size="sm">Cancel</hx-button>
        <hx-button variant="secondary" hx-size="sm">Save Draft</hx-button>
        <hx-button variant="primary" hx-size="sm">Discharge</hx-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. EDGE CASES
// ─────────────────────────────────────────────────

export const LongLabel: Story = {
  render: () => html`
    <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 1rem;">
      <hx-button variant="primary">
        Submit Prior Authorization Request for Extended Inpatient Stay Approval
      </hx-button>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Button uses <code>white-space: nowrap</code> by default. Long labels will not wrap.
    </p>
  `,
};

export const DisabledInteraction: Story = {
  args: {
    disabled: true,
    label: 'Processing',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxButton!.addEventListener('hx-click', handler);

    // Attempt to click the disabled button via the inner button
    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton!.disabled).toBe(true);

    // Click should not fire hx-click on a disabled button
    innerButton!.click();
    await expect(eventFired).toBe(false);

    hxButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 9. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .css-prop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        max-width: 720px;
      }
      .css-prop-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .css-prop-cell code {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
    </style>
    <div class="css-prop-grid">
      <div class="css-prop-cell">
        <code>--hx-button-bg: #059669</code>
        <hx-button style="--hx-button-bg: #059669;">Custom Background</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-color: #fbbf24</code>
        <hx-button style="--hx-button-color: #fbbf24;">Custom Text Color</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-border-color: #dc2626</code>
        <hx-button
          variant="secondary"
          style="--hx-button-border-color: #dc2626; --hx-button-color: #dc2626;"
          >Custom Border</hx-button
        >
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-border-radius: 9999px</code>
        <hx-button style="--hx-button-border-radius: 9999px;">Pill Shape</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-font-family: Georgia, serif</code>
        <hx-button style="--hx-button-font-family: Georgia, serif;">Serif Font</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-font-weight: 400</code>
        <hx-button style="--hx-button-font-weight: 400;">Normal Weight</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-focus-ring-color: #7c3aed</code>
        <hx-button style="--hx-button-focus-ring-color: #7c3aed;"
          >Focus Ring (tab to see)</hx-button
        >
      </div>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
      <strong>Usage</strong>
      <pre
        style="margin: 0.5rem 0 0; font-size: 0.8125rem; white-space: pre-wrap;"
      ><code>/* Override via host selector or inline style */
hx-button {
  --hx-button-bg: var(--hx-color-success-500);
  --hx-button-border-radius: 9999px;
}</code></pre>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-button::part(button) {
        text-transform: uppercase;
        letter-spacing: 0.1em;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .parts-demo-gradient hx-button::part(button) {
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        border: none;
        color: white;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">
          Exposed part: <code>::part(button)</code>
        </p>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6b7280;">
          The inner native <code>&lt;button&gt;</code> is exposed via the <code>button</code> CSS
          part for external styling through Shadow DOM boundaries.
        </p>
      </div>

      <div class="parts-demo">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-button::part(button) { text-transform: uppercase; letter-spacing: 0.1em; box-shadow:
          ... }
        </code>
        <hx-button>Uppercase with Shadow</hx-button>
      </div>

      <div class="parts-demo-gradient">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-button::part(button) { background: linear-gradient(...); }
        </code>
        <hx-button>Gradient Background</hx-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  args: {
    label: 'Verify Prescription',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const eventSpy = fn();
    hxButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);

    await expect(eventSpy).toHaveBeenCalledTimes(1);

    const callArg = eventSpy.mock.calls[0][0] as CustomEvent;
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    hxButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const KeyboardActivation: Story = {
  args: {
    label: 'Approve Order',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Tab to focus the button
    await userEvent.tab();

    // Verify the inner button receives focus
    const activeEl = hxButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Press Enter and verify event fires
    const enterSpy = fn();
    hxButton!.addEventListener('hx-click', enterSpy);
    await userEvent.keyboard('{Enter}');
    await expect(enterSpy).toHaveBeenCalledTimes(1);
    hxButton!.removeEventListener('hx-click', enterSpy);

    // Press Space and verify event fires
    const spaceSpy = fn();
    hxButton!.addEventListener('hx-click', spaceSpy);
    await userEvent.keyboard(' ');
    await expect(spaceSpy).toHaveBeenCalledTimes(1);
    hxButton!.removeEventListener('hx-click', spaceSpy);
  },
};

export const FormSubmit: Story = {
  render: () => html`
    <form
      id="test-form"
      @submit=${(e: Event) => e.preventDefault()}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px;"
    >
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Medication Name</span>
        <input
          type="text"
          value="Amoxicillin 500mg"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <hx-button type="submit" variant="primary">Prescribe</hx-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const submitSpy = fn((e: Event) => e.preventDefault());
    form!.addEventListener('submit', submitSpy);

    const submitButton = canvasElement.querySelector('hx-button[type="submit"]');
    const innerButton = submitButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);

    await expect(submitSpy).toHaveBeenCalledTimes(1);

    form!.removeEventListener('submit', submitSpy);
  },
};

export const DisabledNoEvent: Story = {
  render: () => html` <hx-button variant="primary" disabled>Restricted Action</hx-button> `,
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const eventSpy = fn();
    hxButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton!.disabled).toBe(true);

    // Native click on a disabled button should not fire the handler
    innerButton!.click();
    await expect(eventSpy).toHaveBeenCalledTimes(0);

    hxButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const FocusRing: Story = {
  args: {
    label: 'Tab to Focus',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Tab to the button to trigger :focus-visible
    await userEvent.tab();

    const activeEl = hxButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Verify the focus-visible outline is applied
    const styles = getComputedStyle(innerButton!);
    await expect(styles.outlineStyle).not.toBe('none');
  },
};

// ─────────────────────────────────────────────────
// 12. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientActions: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 0.75rem; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;"
      role="toolbar"
      aria-label="Patient workflow actions"
    >
      <hx-button variant="primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="vertical-align: middle;"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Admit Patient
      </hx-button>
      <hx-button variant="secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="vertical-align: middle;"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        Transfer
      </hx-button>
      <hx-button variant="ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="vertical-align: middle;"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Discharge
      </hx-button>
    </div>
  `,
};

export const EmergencyAction: Story = {
  render: () => html`
    <hx-button
      variant="primary"
      hx-size="lg"
      style="--hx-button-bg: #dc2626; --hx-button-focus-ring-color: #dc2626;"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        style="vertical-align: middle;"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
        />
      </svg>
      Code Blue - Emergency Response
    </hx-button>
  `,
};

// ─────────────────────────────────────────────────
// THEME COMPARISON — Light and Dark side by side
// ─────────────────────────────────────────────────

export const ThemeComparison: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 200px;">
      <div
        data-theme="light"
        style="padding: 2rem; background: #ffffff; display: flex; flex-direction: column; gap: 1rem;"
      >
        <p
          style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;"
        >
          Light Theme
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
          <hx-button variant="primary">Admit Patient</hx-button>
          <hx-button variant="secondary">View Records</hx-button>
          <hx-button variant="ghost">Cancel</hx-button>
          <hx-button variant="primary" disabled>Processing...</hx-button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
          <hx-button variant="primary" hx-size="sm">Small</hx-button>
          <hx-button variant="primary" hx-size="md">Medium</hx-button>
          <hx-button variant="primary" hx-size="lg">Large</hx-button>
        </div>
      </div>
      <div
        data-theme="dark"
        style="padding: 2rem; background: #1a1a2e; display: flex; flex-direction: column; gap: 1rem;"
      >
        <p
          style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;"
        >
          Dark Theme
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
          <hx-button variant="primary">Admit Patient</hx-button>
          <hx-button variant="secondary">View Records</hx-button>
          <hx-button variant="ghost">Cancel</hx-button>
          <hx-button variant="primary" disabled>Processing...</hx-button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
          <hx-button variant="primary" hx-size="sm">Small</hx-button>
          <hx-button variant="primary" hx-size="md">Medium</hx-button>
          <hx-button variant="primary" hx-size="lg">Large</hx-button>
        </div>
      </div>
    </div>
  `,
};
