import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-checkbox.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Checkbox',
  component: 'hx-checkbox',
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    indeterminate: {
      control: 'boolean',
      description:
        'Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns).',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the checkbox is required for form submission.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'The visible label text for the checkbox.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The value submitted when the checkbox is checked.',
      table: {
        category: 'Form',
        defaultValue: { summary: 'on' },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the checkbox, used for form submission.',
      table: {
        category: 'Form',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the checkbox enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the checkbox for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the checkbox.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    label: 'Acknowledge patient data handling policy',
    value: 'on',
    error: '',
    helpText: '',
    name: '',
    size: 'md',
  },
  render: (args) => html`
    <hx-checkbox
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
      .indeterminate=${args.indeterminate}
      label=${args.label}
      value=${args.value}
      error=${ifDefined(args.error || undefined)}
      help-text=${ifDefined(args.helpText || undefined)}
      name=${ifDefined(args.name || undefined)}
      hx-size=${args.size}
    ></hx-checkbox>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

/** Resolves after the next microtask to allow Lit updates to flush. */
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

/** Queries a checkbox element and its shadow root control for play functions. */
function getCheckboxParts(canvasElement: HTMLElement) {
  const host = canvasElement.querySelector('hx-checkbox');
  if (!host) throw new Error('hx-checkbox not found in canvas');
  const control = host.shadowRoot?.querySelector('.checkbox__control');
  if (!control) throw new Error('.checkbox__control not found in shadow root');
  return { host, control };
}

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'I agree to the patient data handling terms',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { host, control } = getCheckboxParts(canvasElement);

    // Verify component renders with label text
    await expect(canvas.getByText('I agree to the patient data handling terms')).toBeTruthy();

    // Initially unchecked
    await expect(host.checked).toBe(false);

    // Click to check
    await userEvent.click(control);
    await nextFrame();
    await expect(host.checked).toBe(true);

    // Click again to uncheck
    await userEvent.click(control);
    await nextFrame();
    await expect(host.checked).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY STATE
// ─────────────────────────────────────────────────

export const Unchecked: Story = {
  args: {
    label: 'Receive appointment reminders',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'Receive appointment reminders',
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all patient records',
    indeterminate: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'This option is currently unavailable',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Mandatory compliance training completed',
    disabled: true,
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'I confirm the patient information is accurate',
    required: true,
    helpText: 'This acknowledgement is required before submission.',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Subscribe to clinical trial updates',
    helpText:
      'You will receive periodic notifications about relevant clinical trials. You can unsubscribe at any time.',
  },
};

export const WithError: Story = {
  args: {
    label: 'I accept the HIPAA privacy notice',
    required: true,
    error: 'You must accept the HIPAA privacy notice to continue.',
  },
};

// ─────────────────────────────────────────────────
// 3. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-checkbox label="Default (unchecked)"></hx-checkbox>

      <hx-checkbox label="Checked" checked></hx-checkbox>

      <hx-checkbox label="Indeterminate" .indeterminate=${true}></hx-checkbox>

      <hx-checkbox label="Disabled (unchecked)" disabled></hx-checkbox>

      <hx-checkbox label="Disabled (checked)" disabled checked></hx-checkbox>

      <hx-checkbox label="Required" required></hx-checkbox>

      <hx-checkbox
        label="With help text"
        help-text="Additional guidance for the clinician."
      ></hx-checkbox>

      <hx-checkbox label="With error" error="This field is required." required></hx-checkbox>

      <hx-checkbox
        label="Error + checked"
        error="Selection conflicts with another field."
        checked
      ></hx-checkbox>

      <hx-checkbox
        label="Error hides help text"
        error="Validation failed."
        help-text="This help text is hidden."
        required
      ></hx-checkbox>
    </div>
  `,
};

export const CheckboxGroup: Story = {
  render: () => html`
    <fieldset
      style="border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem; padding: 1.5rem; max-width: 480px; font-family: sans-serif;"
    >
      <legend
        style="font-weight: 600; font-size: 0.875rem; color: var(--hx-color-neutral-700, #343a40);"
      >
        Notification Preferences
      </legend>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 0.75rem;">
        <hx-checkbox
          label="Appointment reminders"
          name="notifications"
          value="appointments"
          checked
        ></hx-checkbox>
        <hx-checkbox
          label="Lab result notifications"
          name="notifications"
          value="lab-results"
          checked
        ></hx-checkbox>
        <hx-checkbox
          label="Prescription refill alerts"
          name="notifications"
          value="prescriptions"
        ></hx-checkbox>
        <hx-checkbox
          label="Billing and payment updates"
          name="notifications"
          value="billing"
        ></hx-checkbox>
        <hx-checkbox
          label="Health tips and wellness content"
          name="notifications"
          value="wellness"
          help-text="Optional weekly digest of personalized health content."
        ></hx-checkbox>
      </div>
    </fieldset>
  `,
};

// ─────────────────────────────────────────────────
// 4. COMPOSITION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const handleSubmit = fn();
    return html`
      <form
        id="patient-consent-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          handleSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-checkbox
          label="I agree to the terms of service"
          name="terms"
          value="accepted"
          required
          help-text="Review our terms of service before agreeing."
        ></hx-checkbox>

        <hx-checkbox
          label="I accept the HIPAA privacy notice"
          name="privacy"
          value="accepted"
          required
        ></hx-checkbox>

        <hx-checkbox
          label="Subscribe to clinical research updates"
          name="research"
          value="subscribed"
          help-text="Optional. You may unsubscribe at any time."
        ></hx-checkbox>

        <button
          type="submit"
          style="align-self: flex-start; padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Submit Consent
        </button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const checkboxes = canvasElement.querySelectorAll('hx-checkbox');
    const termsCheckbox = checkboxes[0];
    const privacyCheckbox = checkboxes[1];
    const researchCheckbox = checkboxes[2];

    // Check required checkboxes
    const termsControl = termsCheckbox.shadowRoot?.querySelector('.checkbox__control');
    const privacyControl = privacyCheckbox.shadowRoot?.querySelector('.checkbox__control');
    const researchControl = researchCheckbox.shadowRoot?.querySelector('.checkbox__control');

    await userEvent.click(termsControl!);
    await nextFrame();
    await userEvent.click(privacyControl!);
    await nextFrame();
    await userEvent.click(researchControl!);
    await nextFrame();

    await expect(termsCheckbox.checked).toBe(true);
    await expect(privacyCheckbox.checked).toBe(true);
    await expect(researchCheckbox.checked).toBe(true);

    // Submit form and verify FormData
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    const formData = new FormData(form);
    await expect(formData.get('terms')).toBe('accepted');
    await expect(formData.get('privacy')).toBe('accepted');
    await expect(formData.get('research')).toBe('subscribed');
  },
};

export const SelectAllPattern: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 480px;">
      <hx-checkbox
        id="select-all-parent"
        label="Select all departments"
        .indeterminate=${false}
        @hx-change=${(e: CustomEvent) => {
          const parent = e.target as HTMLElement & {
            checked: boolean;
            indeterminate: boolean;
          };
          const container = parent.closest('div');
          const children = container?.querySelectorAll('.child-checkbox') as NodeListOf<
            HTMLElement & { checked: boolean; indeterminate: boolean }
          >;
          children?.forEach((child) => {
            child.checked = parent.checked;
          });
        }}
        style="font-weight: 600;"
      ></hx-checkbox>

      <div
        style="display: flex; flex-direction: column; gap: 0.5rem; padding-left: 1.5rem; border-left: 2px solid var(--hx-color-neutral-200, #dee2e6);"
      >
        ${['Cardiology', 'Radiology', 'Oncology', 'Neurology'].map(
          (dept) => html`
            <hx-checkbox
              class="child-checkbox"
              label=${dept}
              name="departments"
              value=${dept.toLowerCase()}
              @hx-change=${(e: CustomEvent) => {
                const target = e.target as HTMLElement;
                const container = target.closest('div')?.parentElement;
                const parent = container?.querySelector('#select-all-parent') as
                  | (HTMLElement & {
                      checked: boolean;
                      indeterminate: boolean;
                    })
                  | null;
                const children = container?.querySelectorAll('.child-checkbox') as NodeListOf<
                  HTMLElement & { checked: boolean; indeterminate: boolean }
                >;
                if (!parent || !children) return;
                const allChecked = Array.from(children).every((c) => c.checked);
                const noneChecked = Array.from(children).every((c) => !c.checked);
                parent.indeterminate = !allChecked && !noneChecked;
                parent.checked = allChecked;
              }}
            ></hx-checkbox>
          `,
        )}
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await nextFrame();

    const parent = canvasElement.querySelector('#select-all-parent') as HTMLElement & {
      checked: boolean;
      indeterminate: boolean;
    };
    const children = canvasElement.querySelectorAll('.child-checkbox') as NodeListOf<
      HTMLElement & { checked: boolean; indeterminate: boolean }
    >;

    // Click parent: all children should become checked
    const parentControl = parent.shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(parentControl!);
    await nextFrame();

    await expect(parent.checked).toBe(true);
    for (const child of Array.from(children)) {
      await expect(child.checked).toBe(true);
    }

    // Uncheck one child: parent should become indeterminate
    const firstChildControl = children[0].shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(firstChildControl!);
    await nextFrame();

    await expect(children[0].checked).toBe(false);
    await expect(parent.indeterminate).toBe(true);
  },
};

export const ConsentForm: Story = {
  render: () => html`
    <form
      style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 560px; padding: 1.5rem; border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem;"
      @submit=${(e: Event) => e.preventDefault()}
    >
      <h3 style="margin: 0; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);">
        Patient Consent Agreement
      </h3>
      <p style="margin: 0; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);">
        Please review and acknowledge each consent item below before proceeding with your care plan.
      </p>

      <hx-checkbox
        label="I have read and accept the Privacy Policy"
        name="privacy-consent"
        value="accepted"
        required
        help-text="Your data is protected under HIPAA and applicable state regulations."
      ></hx-checkbox>

      <hx-checkbox
        label="I consent to the sharing of my health records with authorized care providers"
        name="data-sharing"
        value="accepted"
        required
        help-text="Records are shared only with providers directly involved in your care."
      ></hx-checkbox>

      <hx-checkbox
        label="I consent to the proposed treatment plan as described by my care team"
        name="treatment-consent"
        value="accepted"
        required
      ></hx-checkbox>

      <hx-checkbox
        label="I agree to participate in anonymized clinical research"
        name="research-optin"
        value="accepted"
        help-text="Optional. Your identity is never disclosed in research publications."
      ></hx-checkbox>

      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <button
          type="submit"
          style="padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Confirm and Continue
        </button>
        <button
          type="reset"
          style="padding: 0.5rem 1.5rem; background: transparent; color: var(--hx-color-neutral-600, #6c757d); border: 1px solid var(--hx-color-neutral-300, #ced4da); border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Reset
        </button>
      </div>
    </form>
  `,
};

export const WithOtherFormFields: Story = {
  render: () => html`
    <form
      style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 480px;"
      @submit=${(e: Event) => e.preventDefault()}
    >
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <label
          for="patient-name"
          style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
          >Patient Full Name</label
        >
        <input
          id="patient-name"
          type="text"
          name="patientName"
          placeholder="Jane Doe"
          style="padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #ced4da); border-radius: 0.25rem; font-size: 0.875rem;"
        />
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <label
          for="department"
          style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
          >Department</label
        >
        <select
          id="department"
          name="department"
          style="padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #ced4da); border-radius: 0.25rem; font-size: 0.875rem;"
        >
          <option value="">Select department</option>
          <option value="cardiology">Cardiology</option>
          <option value="radiology">Radiology</option>
          <option value="neurology">Neurology</option>
          <option value="oncology">Oncology</option>
        </select>
      </div>

      <hx-checkbox
        label="Mark as urgent referral"
        name="urgent"
        value="true"
        help-text="Urgent referrals are prioritized within 24 hours."
      ></hx-checkbox>

      <hx-checkbox
        label="I have verified the patient identity"
        name="identity-verified"
        value="true"
        required
      ></hx-checkbox>

      <button
        type="submit"
        style="align-self: flex-start; padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
      >
        Submit Referral
      </button>
    </form>
  `,
};

// ─────────────────────────────────────────────────
// 5. EDGE CASES
// ─────────────────────────────────────────────────

export const LongLabel: Story = {
  args: {
    label:
      'I acknowledge that I have been informed of all potential risks, benefits, and alternatives associated with the proposed surgical procedure, including but not limited to infection, bleeding, adverse reactions to anesthesia, and the possibility that the desired outcome may not be achieved, and I voluntarily consent to proceed.',
  },
};

export const NoLabel: Story = {
  render: () => html`
    <hx-checkbox aria-label="Accept terms and conditions" name="accept" value="true"></hx-checkbox>
  `,
};

export const ManyCheckboxes: Story = {
  render: () => {
    const items = [
      'Allergies and adverse reactions',
      'Current medications',
      'Surgical history',
      'Family medical history',
      'Immunization records',
      'Mental health assessments',
      'Lab results (last 12 months)',
      'Radiology reports',
      'Pathology reports',
      'Discharge summaries',
      'Progress notes',
      'Rehabilitation records',
      'Nutrition and dietary plans',
      'Social work assessments',
      'Advance directives',
      'Insurance and billing records',
    ];

    return html`
      <fieldset
        style="border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem; padding: 1.5rem; max-width: 480px; font-family: sans-serif;"
      >
        <legend
          style="font-weight: 600; font-size: 0.875rem; color: var(--hx-color-neutral-700, #343a40);"
        >
          Select Records to Include in Transfer
        </legend>
        <div
          style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; max-height: 320px; overflow-y: auto; padding-right: 0.5rem;"
        >
          ${items.map(
            (item, i) => html`
              <hx-checkbox label=${item} name="records" value=${`record-${i}`}></hx-checkbox>
            `,
          )}
        </div>
      </fieldset>
    `;
  },
};

// ─────────────────────────────────────────────────
// 6. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Default Styling
        </h4>
        <hx-checkbox label="Default checkbox appearance" checked></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-size (2rem)
        </h4>
        <hx-checkbox
          label="Larger checkbox"
          checked
          style="--hx-checkbox-size: 2rem;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-border-color (#9333ea)
        </h4>
        <hx-checkbox
          label="Custom border color"
          style="--hx-checkbox-border-color: #9333ea;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-border-radius (50%)
        </h4>
        <hx-checkbox
          label="Circular checkbox"
          checked
          style="--hx-checkbox-border-radius: 50%;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-checked-bg / --hx-checkbox-checked-border-color (#059669)
        </h4>
        <hx-checkbox
          label="Green checked state"
          checked
          style="--hx-checkbox-checked-bg: #059669; --hx-checkbox-checked-border-color: #059669;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-checkmark-color (#fbbf24)
        </h4>
        <hx-checkbox
          label="Gold checkmark"
          checked
          style="--hx-checkbox-checkmark-color: #fbbf24;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-focus-ring-color (#f97316)
        </h4>
        <hx-checkbox
          label="Tab to this checkbox to see orange focus ring"
          style="--hx-checkbox-focus-ring-color: #f97316;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-label-color (#6d28d9)
        </h4>
        <hx-checkbox
          label="Purple label text"
          style="--hx-checkbox-label-color: #6d28d9;"
        ></hx-checkbox>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-error-color (#b91c1c)
        </h4>
        <hx-checkbox
          label="Dark red error styling"
          error="Custom error color applied."
          required
          style="--hx-checkbox-error-color: #b91c1c;"
        ></hx-checkbox>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-checkbox::part(checkbox) {
        border: 2px dashed #9333ea;
        background: #faf5ff;
      }
      .parts-demo hx-checkbox::part(label) {
        font-style: italic;
        color: #6d28d9;
      }
      .parts-demo hx-checkbox::part(control) {
        padding: 0.5rem;
        border-radius: 0.5rem;
        background: #f5f3ff;
      }
      .parts-demo-help hx-checkbox::part(help-text) {
        font-weight: 600;
        color: #0369a1;
      }
      .parts-demo-error hx-checkbox::part(error) {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(checkbox), ::part(label), ::part(control)
        </h4>
        <div class="parts-demo">
          <hx-checkbox label="Styled via CSS Parts" checked></hx-checkbox>
        </div>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(help-text)
        </h4>
        <div class="parts-demo-help">
          <hx-checkbox
            label="With styled help text"
            help-text="This help text is bold and blue via ::part(help-text)."
          ></hx-checkbox>
        </div>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(error)
        </h4>
        <div class="parts-demo-error">
          <hx-checkbox
            label="With styled error"
            error="Uppercase bold error via ::part(error)."
            required
          ></hx-checkbox>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickToggle: Story = {
  args: {
    label: 'Enable patient portal access',
    name: 'portal-access',
    value: 'enabled',
  },
  play: async ({ canvasElement }) => {
    const { host, control } = getCheckboxParts(canvasElement);
    const changeSpy = fn();
    host.addEventListener('hx-change', changeSpy);

    // Initially unchecked
    await expect(host.checked).toBe(false);

    // Click to check
    await userEvent.click(control);
    await nextFrame();

    await expect(host.checked).toBe(true);
    await expect(changeSpy).toHaveBeenCalledTimes(1);

    const firstCallDetail = changeSpy.mock.calls[0][0].detail;
    await expect(firstCallDetail.checked).toBe(true);
    await expect(firstCallDetail.value).toBe('enabled');

    // Click to uncheck
    await userEvent.click(control);
    await nextFrame();

    await expect(host.checked).toBe(false);
    await expect(changeSpy).toHaveBeenCalledTimes(2);

    const secondCallDetail = changeSpy.mock.calls[1][0].detail;
    await expect(secondCallDetail.checked).toBe(false);
  },
};

export const KeyboardToggle: Story = {
  args: {
    label: 'Enable two-factor authentication',
  },
  play: async ({ canvasElement }) => {
    const { host, control: _control } = getCheckboxParts(canvasElement);

    // Tab to the checkbox control
    await userEvent.tab();
    await nextFrame();

    // Initially unchecked
    await expect(host.checked).toBe(false);

    // Press Space to toggle
    await userEvent.keyboard(' ');
    await nextFrame();

    await expect(host.checked).toBe(true);

    // Press Space again to uncheck
    await userEvent.keyboard(' ');
    await nextFrame();

    await expect(host.checked).toBe(false);
  },
};

export const IndeterminateFlow: Story = {
  args: {
    label: 'Select all records',
    indeterminate: true,
  },
  play: async ({ canvasElement }) => {
    const { host, control } = getCheckboxParts(canvasElement);

    // Initially indeterminate and unchecked
    await expect(host.indeterminate).toBe(true);
    await expect(host.checked).toBe(false);

    // Click: should become checked and NOT indeterminate
    await userEvent.click(control);
    await nextFrame();

    await expect(host.checked).toBe(true);
    await expect(host.indeterminate).toBe(false);
  },
};

export const DisabledNoToggle: Story = {
  args: {
    label: 'Locked clinical protocol',
    disabled: true,
    checked: false,
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-checkbox') as HTMLElement & {
      checked: boolean;
      disabled: boolean;
    };

    // Verify initially unchecked and disabled
    await expect(host.checked).toBe(false);
    await expect(host.disabled).toBe(true);

    // Attempt to click (should be blocked by pointer-events: none and _handleChange guard)
    // Force the click through JavaScript to verify the guard
    const control = host.shadowRoot?.querySelector('.checkbox__control');
    control?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextFrame();

    // State should remain unchanged
    await expect(host.checked).toBe(false);
  },
};

export const FormDataParticipation: Story = {
  render: () => html`
    <form
      id="formdata-test-form"
      @submit=${(e: Event) => e.preventDefault()}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
    >
      <hx-checkbox
        label="Include allergy information"
        name="allergies"
        value="include"
      ></hx-checkbox>

      <hx-checkbox
        label="Include medication list"
        name="medications"
        value="include"
        checked
      ></hx-checkbox>

      <button
        type="submit"
        style="align-self: flex-start; padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
      >
        Generate Report
      </button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    const checkboxes = canvasElement.querySelectorAll('hx-checkbox') as NodeListOf<
      HTMLElement & { checked: boolean }
    >;

    // Medications checkbox is pre-checked; allergies is not
    await expect(checkboxes[0].checked).toBe(false);
    await expect(checkboxes[1].checked).toBe(true);

    // FormData should contain only checked checkbox values
    let formData = new FormData(form);
    await expect(formData.get('allergies')).toBeNull();
    await expect(formData.get('medications')).toBe('include');

    // Check the allergies checkbox
    const allergiesControl = checkboxes[0].shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(allergiesControl!);
    await nextFrame();

    // Now both should be in FormData
    formData = new FormData(form);
    await expect(formData.get('allergies')).toBe('include');
    await expect(formData.get('medications')).toBe('include');

    // Uncheck medications
    const medsControl = checkboxes[1].shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(medsControl!);
    await nextFrame();

    formData = new FormData(form);
    await expect(formData.get('allergies')).toBe('include');
    await expect(formData.get('medications')).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientConsentChecklist: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 560px; padding: 1.5rem; border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem;"
    >
      <h3 style="margin: 0; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);">
        Patient Consent Checklist
      </h3>
      <p
        style="margin: 0 0 0.5rem; font-size: 0.8125rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        All items must be acknowledged before proceeding to discharge.
      </p>

      <hx-checkbox
        id="consent-select-all"
        label="Select All"
        .indeterminate=${false}
        style="font-weight: 600; padding-bottom: 0.5rem; border-bottom: 1px solid var(--hx-color-neutral-200, #dee2e6);"
        @hx-change=${(e: CustomEvent) => {
          const parent = e.target as HTMLElement & {
            checked: boolean;
            indeterminate: boolean;
          };
          const container = parent.closest('div');
          const children = container?.querySelectorAll('.consent-item') as NodeListOf<
            HTMLElement & { checked: boolean; indeterminate: boolean }
          >;
          children?.forEach((child) => {
            child.checked = parent.checked;
          });
        }}
      ></hx-checkbox>

      ${[
        {
          label: 'I understand my diagnosis and treatment plan',
          value: 'diagnosis',
        },
        {
          label: 'I have been informed of all prescribed medications and their side effects',
          value: 'medications',
        },
        {
          label: 'I consent to follow-up appointments as scheduled',
          value: 'followup',
        },
        {
          label: 'I have received discharge instructions and educational materials',
          value: 'discharge',
        },
        {
          label: 'I authorize release of records to my primary care provider',
          value: 'records-release',
        },
      ].map(
        (item) => html`
          <hx-checkbox
            class="consent-item"
            label=${item.label}
            name="consent"
            value=${item.value}
            required
            @hx-change=${(e: CustomEvent) => {
              const target = e.target as HTMLElement;
              const container = target.closest('div');
              const parent = container?.querySelector('#consent-select-all') as
                | (HTMLElement & {
                    checked: boolean;
                    indeterminate: boolean;
                  })
                | null;
              const children = container?.querySelectorAll('.consent-item') as NodeListOf<
                HTMLElement & { checked: boolean; indeterminate: boolean }
              >;
              if (!parent || !children) return;
              const allChecked = Array.from(children).every((c) => c.checked);
              const noneChecked = Array.from(children).every((c) => !c.checked);
              parent.indeterminate = !allChecked && !noneChecked;
              parent.checked = allChecked;
            }}
          ></hx-checkbox>
        `,
      )}
    </div>
  `,
  play: async ({ canvasElement }) => {
    await nextFrame();

    const selectAll = canvasElement.querySelector('#consent-select-all') as HTMLElement & {
      checked: boolean;
      indeterminate: boolean;
    };
    const items = canvasElement.querySelectorAll('.consent-item') as NodeListOf<
      HTMLElement & { checked: boolean; indeterminate: boolean }
    >;

    // Verify 5 consent items
    await expect(items.length).toBe(5);

    // Click "Select All" -- all items should check
    const selectAllControl = selectAll.shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(selectAllControl!);
    await nextFrame();

    await expect(selectAll.checked).toBe(true);
    for (const item of Array.from(items)) {
      await expect(item.checked).toBe(true);
    }

    // Uncheck one item -- parent becomes indeterminate
    const firstItemControl = items[0].shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(firstItemControl!);
    await nextFrame();

    await expect(items[0].checked).toBe(false);
    await expect(selectAll.indeterminate).toBe(true);
    await expect(selectAll.checked).toBe(false);
  },
};

export const MedicationAcknowledgement: Story = {
  render: () => html`
    <div
      style="max-width: 560px; padding: 1.5rem; border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem; background: var(--hx-color-neutral-50, #f8f9fa);"
    >
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Medication Acknowledgement
      </h3>
      <p
        style="margin: 0 0 1rem; font-size: 0.8125rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Please confirm that you understand the following medication information. This
        acknowledgement is required by your care team.
      </p>

      <div
        style="padding: 1rem; margin-bottom: 1rem; border-radius: 0.375rem; background: white; border: 1px solid var(--hx-color-neutral-200, #dee2e6);"
      >
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; font-size: 0.875rem; color: var(--hx-color-neutral-800, #212529);"
        >
          Prescribed Medication: Metformin 500mg
        </p>
        <ul
          style="margin: 0; padding-left: 1.25rem; font-size: 0.8125rem; color: var(--hx-color-neutral-600, #6c757d); line-height: 1.8;"
        >
          <li>Take one tablet twice daily with meals</li>
          <li>Do not consume alcohol while taking this medication</li>
          <li>Report any gastrointestinal discomfort to your provider</li>
          <li>Regular blood glucose monitoring is required</li>
        </ul>
      </div>

      <form
        @submit=${(e: Event) => e.preventDefault()}
        style="display: flex; flex-direction: column; gap: 1rem;"
      >
        <hx-checkbox
          id="med-ack"
          label="I confirm that I understand the prescribed medication, its dosage, potential side effects, and interaction warnings as described above"
          name="medication-acknowledgement"
          value="confirmed"
          required
          error=""
        ></hx-checkbox>

        <button
          type="submit"
          id="med-ack-submit"
          style="align-self: flex-start; padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Confirm Acknowledgement
        </button>
      </form>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelector('#med-ack') as HTMLElement & {
      checked: boolean;
      required: boolean;
      checkValidity: () => boolean;
    };

    // Required and unchecked: invalid
    await expect(checkbox.required).toBe(true);
    await expect(checkbox.checked).toBe(false);
    await expect(checkbox.checkValidity()).toBe(false);

    // Check the acknowledgement
    const control = checkbox.shadowRoot?.querySelector('.checkbox__control');
    await userEvent.click(control!);
    await nextFrame();

    // Now valid
    await expect(checkbox.checked).toBe(true);
    await expect(checkbox.checkValidity()).toBe(true);
  },
};
