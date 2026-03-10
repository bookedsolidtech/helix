import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-text-input.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Text Input',
  component: 'hx-text-input',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the input.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the input is empty.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value of the input.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number', 'date'],
      description: 'The type of the native input element.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: "'text'" },
        type: {
          summary: "'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date'",
        },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required for form submission.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled. Prevents interaction and dims the component.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the input enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the input for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the input, used for form submission via ElementInternals.',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name for screen readers, if different from the visible label.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'null' },
        type: { summary: 'string | null' },
      },
    },
    readonly: {
      control: 'boolean',
      description: 'Whether the input is read-only.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Visual size of the input field.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: "'md'" },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    minlength: {
      control: 'number',
      description: 'Minimum number of characters allowed.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'number | undefined' },
      },
    },
    maxlength: {
      control: 'number',
      description: 'Maximum number of characters allowed.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'number | undefined' },
      },
    },
    pattern: {
      control: 'text',
      description: 'A regular expression pattern the value must match for form validation.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    autocomplete: {
      control: 'text',
      description:
        'Hint for the browser autocomplete feature. Accepts standard HTML autocomplete values.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient full name',
    value: '',
    type: 'text',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <hx-text-input
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      type=${args.type}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    ></hx-text-input>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helper: Query the native input inside shadow DOM
// ─────────────────────────────────────────────────

function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-text-input');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-text-input not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-text-input shadow DOM');
  }
  return input;
}

// ─────────────────────────────────────────────────
// 1. DEFAULT — Types text and verifies value
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Patient Name',
    placeholder: 'Enter patient full name',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host).toBeTruthy();

    // Use within() to query inside the shadow root
    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Patient Name');
    await expect(label).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'Jane Doe');
    await expect(input.value).toBe('Jane Doe');
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY INPUT TYPE
// ─────────────────────────────────────────────────

export const TypeText: Story = {
  name: 'Type: Text',
  args: {
    label: 'Full Name',
    placeholder: 'Enter full name',
    type: 'text',
  },
};

export const TypeEmail: Story = {
  name: 'Type: Email',
  args: {
    label: 'Email Address',
    placeholder: 'clinician@hospital.org',
    type: 'email',
    helpText: 'Enter your hospital-issued email address.',
  },
};

export const TypePassword: Story = {
  name: 'Type: Password',
  args: {
    label: 'Password',
    placeholder: 'Enter secure password',
    type: 'password',
    helpText: 'Minimum 12 characters. Must include uppercase, lowercase, and a number.',
  },
};

export const TypeNumber: Story = {
  name: 'Type: Number',
  args: {
    label: 'Dosage (mg)',
    placeholder: '0',
    type: 'number',
    helpText: 'Enter the prescribed dosage in milligrams.',
  },
};

export const TypeTel: Story = {
  name: 'Type: Tel',
  args: {
    label: 'Phone Number',
    placeholder: '(555) 123-4567',
    type: 'tel',
    helpText: 'US phone number with area code.',
  },
};

export const TypeUrl: Story = {
  name: 'Type: URL',
  args: {
    label: 'Provider Portal URL',
    placeholder: 'https://portal.hospital.org',
    type: 'url',
    helpText: 'Full URL including https:// protocol.',
  },
};

export const TypeSearch: Story = {
  name: 'Type: Search',
  args: {
    label: 'Search Records',
    placeholder: 'Search by name, MRN, or DOB',
    type: 'search',
  },
};

// ─────────────────────────────────────────────────
// 3. EVERY STATE
// ─────────────────────────────────────────────────

export const WithPlaceholder: Story = {
  args: {
    label: 'Date of Birth',
    placeholder: 'MM/DD/YYYY',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Patient Name',
    value: 'Dr. Sarah Mitchell',
  },
};

export const Required: Story = {
  args: {
    label: 'Medical Record Number',
    placeholder: 'Enter MRN',
    required: true,
    helpText: 'Required. This field is mandatory for patient identification.',
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Insurance ID',
    placeholder: 'Enter insurance ID number',
    helpText: 'Found on the front of your insurance card, typically 9-12 digits.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    value: 'invalid-email',
    type: 'email',
    error: 'Please enter a valid email address (e.g., clinician@hospital.org).',
  },
};

export const Disabled: Story = {
  args: {
    label: 'System-Generated ID',
    value: 'PAT-2026-00482',
    disabled: true,
    helpText: 'This value is system-generated and cannot be modified.',
  },
};

export const Readonly: Story = {
  name: 'Read-only',
  render: () => html`
    <hx-text-input
      label="Assigned Physician"
      value="Dr. Eleanor Vance"
      help-text="Read-only. Contact administration to change assigned physician."
      readonly
    ></hx-text-input>
  `,
};

// ─────────────────────────────────────────────────
// 4. EVERY SIZE — Simulated via CSS custom properties (component has no size prop)
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  name: 'Size: Small',
  render: () => html`
    <hx-text-input label="Compact Input" placeholder="Small variant" hx-size="sm"></hx-text-input>
  `,
};

export const SizeMedium: Story = {
  name: 'Size: Medium (Default)',
  render: () => html`
    <hx-text-input
      label="Standard Input"
      placeholder="Medium variant (default)"
      hx-size="md"
    ></hx-text-input>
  `,
};

export const SizeLarge: Story = {
  name: 'Size: Large',
  render: () => html`
    <hx-text-input label="Large Input" placeholder="Large variant" hx-size="lg"></hx-text-input>
  `,
};

// ─────────────────────────────────────────────────
// 5. SLOT DEMOS (Critical for Drupal integration)
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  render: () => html`
    <hx-text-input label="Copay Amount" placeholder="0.00" type="number">
      <span
        slot="prefix"
        style="font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d); font-weight: 500;"
        >$</span
      >
    </hx-text-input>
  `,
};

export const WithSuffixSlot: Story = {
  render: () => html`
    <hx-text-input label="Patient Weight" placeholder="Enter weight" type="number">
      <span slot="suffix" style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
        >kg</span
      >
    </hx-text-input>
  `,
};

export const WithLabelSlot: Story = {
  name: 'With Label Slot (Drupal Form API)',
  render: () => html`
    <hx-text-input placeholder="Enter allergies" name="allergies">
      <label
        slot="label"
        style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
      >
        Known Allergies <span style="color: var(--hx-color-error-500, #dc3545);">*</span>
      </label>
    </hx-text-input>
  `,
};

export const WithErrorSlot: Story = {
  name: 'With Error Slot (Drupal Form API)',
  render: () => html`
    <hx-text-input label="Insurance ID" value="ABC" name="insuranceId">
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.25rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem;"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Insurance ID must be between 9 and 12 digits.
      </div>
    </hx-text-input>
  `,
};

export const WithHelpTextSlot: Story = {
  name: 'With Help Text Slot',
  render: () => html`
    <hx-text-input label="Emergency Contact" placeholder="Full name" name="emergencyContact">
      <div
        slot="help-text"
        style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Provide the name of someone we can reach in case of a medical emergency.
      </div>
    </hx-text-input>
  `,
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllTypes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-text-input label="Text" placeholder="Standard text input" type="text"></hx-text-input>
      <hx-text-input
        label="Email"
        placeholder="clinician@hospital.org"
        type="email"
      ></hx-text-input>
      <hx-text-input label="Password" placeholder="Enter password" type="password"></hx-text-input>
      <hx-text-input label="Number" placeholder="0" type="number"></hx-text-input>
      <hx-text-input label="Telephone" placeholder="(555) 123-4567" type="tel"></hx-text-input>
      <hx-text-input
        label="URL"
        placeholder="https://portal.hospital.org"
        type="url"
      ></hx-text-input>
      <hx-text-input
        label="Search"
        placeholder="Search patient records"
        type="search"
      ></hx-text-input>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-text-input label="Small" placeholder="Compact input" hx-size="sm"></hx-text-input>
      <hx-text-input label="Medium (Default)" placeholder="Standard input" hx-size="md"></hx-text-input>
      <hx-text-input label="Large" placeholder="Spacious input" hx-size="lg"></hx-text-input>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-text-input label="Default" placeholder="Empty, no validation"></hx-text-input>

      <hx-text-input label="With Placeholder" placeholder="MM/DD/YYYY"></hx-text-input>

      <hx-text-input label="With Value" value="Dr. James Wilson"></hx-text-input>

      <hx-text-input label="Required" placeholder="Mandatory field" required></hx-text-input>

      <hx-text-input
        label="With Help Text"
        placeholder="Enter data"
        help-text="Supplementary guidance for the clinician."
      ></hx-text-input>

      <hx-text-input
        label="Error State"
        value="bad-data"
        error="Invalid format. Please correct this entry."
      ></hx-text-input>

      <hx-text-input label="Disabled" value="System-locked value" disabled></hx-text-input>

      <hx-text-input label="With Prefix and Suffix" placeholder="0.00" type="number">
        <span
          slot="prefix"
          style="font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d);"
          >$</span
        >
        <span slot="suffix" style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
          >USD</span
        >
      </hx-text-input>
    </div>
  `,
};

export const ValidationStates: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; max-width: 900px;">
      <div style="flex: 1; min-width: 250px;">
        <hx-text-input
          label="Default"
          placeholder="No validation applied"
          help-text="Standard input with no validation state."
        ></hx-text-input>
      </div>

      <div style="flex: 1; min-width: 250px;">
        <hx-text-input
          label="Error"
          value="invalid-mrn"
          error="MRN format must be PAT-YYYY-NNNNN."
        ></hx-text-input>
      </div>

      <div style="flex: 1; min-width: 250px;">
        <hx-text-input
          label="Success (via custom properties)"
          value="PAT-2026-00482"
          help-text="MRN format verified."
          style="--hx-input-border-color: var(--hx-color-success-500, #198754);"
        ></hx-text-input>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. COMPOSITION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const handleSubmit = fn();

    return html`
      <form
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          handleSubmit(Object.fromEntries(data.entries()));
        }}
        @reset=${(e: Event) => {
          // Allow native form reset to propagate to form-associated elements
          void e;
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-text-input
          label="First Name"
          name="firstName"
          placeholder="Jane"
          required
        ></hx-text-input>

        <hx-text-input label="Last Name" name="lastName" placeholder="Doe" required></hx-text-input>

        <hx-text-input
          label="Email"
          name="email"
          type="email"
          placeholder="jane.doe@hospital.org"
          required
          help-text="A confirmation will be sent to this address."
        ></hx-text-input>

        <hx-text-input
          label="Phone"
          name="phone"
          type="tel"
          placeholder="(555) 123-4567"
          help-text="Optional. For appointment reminders."
        ></hx-text-input>

        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <hx-button type="submit">Submit Registration</hx-button>
          <hx-button type="reset" variant="secondary">Reset Form</hx-button>
        </div>
      </form>
    `;
  },
};

export const WithOtherFields: Story = {
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 480px;">
      <hx-text-input
        label="Patient Name"
        name="patientName"
        placeholder="Enter patient name"
        required
      ></hx-text-input>

      <hx-select label="Department" name="department" required>
        <option value="">Select department</option>
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
        <option value="pediatrics">Pediatrics</option>
      </hx-select>

      <hx-checkbox label="Patient consents to treatment" name="consent" required></hx-checkbox>

      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <hx-button type="submit">Admit Patient</hx-button>
        <hx-button type="button" variant="ghost">Cancel</hx-button>
      </div>
    </form>
  `,
};

export const InACard: Story = {
  render: () => html`
    <hx-card variant="default" elevation="raised" style="max-width: 480px;">
      <span slot="heading" style="font-size: 1.125rem; font-weight: 600;">Patient Intake</span>
      <form style="display: flex; flex-direction: column; gap: 1rem;">
        <hx-text-input
          label="Full Name"
          name="fullName"
          placeholder="First and last name"
          required
        ></hx-text-input>

        <hx-text-input
          label="Date of Birth"
          name="dob"
          placeholder="MM/DD/YYYY"
          required
          help-text="Format: month/day/year"
        ></hx-text-input>

        <hx-text-input
          label="Insurance ID"
          name="insuranceId"
          placeholder="Enter ID from insurance card"
        ></hx-text-input>
      </form>
      <div slot="actions">
        <hx-button type="submit" style="width: 100%;">Begin Intake</hx-button>
      </div>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
// 8. EDGE CASES
// ─────────────────────────────────────────────────

export const LongPlaceholder: Story = {
  args: {
    label: 'Address',
    placeholder:
      'Enter the complete mailing address including street number, apartment or suite, city, state, and ZIP code for insurance billing purposes',
  },
};

export const LongValue: Story = {
  args: {
    label: 'Notes',
    value:
      'Patient reported intermittent chest pain radiating to left arm, shortness of breath upon exertion, and mild dizziness for the past 72 hours. No prior cardiac history. Family history includes paternal myocardial infarction at age 52.',
  },
};

export const LongLabel: Story = {
  args: {
    label:
      'Primary Emergency Contact Full Name (include middle name if applicable for positive identification)',
    placeholder: 'Enter full name',
  },
};

export const LongErrorMessage: Story = {
  args: {
    label: 'Medical Record Number',
    value: 'ABC',
    error:
      'The Medical Record Number (MRN) you entered does not match any record in the system. Please verify the number on the patient wristband or contact Health Information Management (HIM) at extension 4200 for assistance.',
  },
};

export const NoLabel: Story = {
  name: 'No Label (aria-label only)',
  render: () => html`
    <hx-text-input
      placeholder="Search patient records..."
      type="search"
      aria-label="Search patient records"
    ></hx-text-input>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Default (all tokens at defaults)
        </h4>
        <hx-text-input
          label="Standard Appearance"
          placeholder="Uses default token values"
          help-text="All 8 CSS custom properties at their defaults."
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-bg + --hx-input-color
        </h4>
        <hx-text-input
          label="Dark Background"
          value="Light text on dark surface"
          style="--hx-input-bg: #1a1a2e; --hx-input-color: #e0e0e0;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-border-color + --hx-input-border-radius
        </h4>
        <hx-text-input
          label="Custom Border"
          placeholder="Thick blue border, pill radius"
          style="--hx-input-border-color: #2563EB; --hx-input-border-radius: 9999px;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-font-family
        </h4>
        <hx-text-input
          label="Monospace Font"
          value="PAT-2026-00482"
          style="--hx-input-font-family: 'Courier New', Courier, monospace;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-focus-ring-color (click to focus)
        </h4>
        <hx-text-input
          label="Green Focus Ring"
          placeholder="Click to see focus ring"
          style="--hx-input-focus-ring-color: #198754;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-error-color
        </h4>
        <hx-text-input
          label="Custom Error Color"
          value="invalid data"
          error="This field has an error."
          style="--hx-input-error-color: #dc6502;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-input-label-color
        </h4>
        <hx-text-input
          label="Branded Label"
          placeholder="Label uses brand color"
          style="--hx-input-label-color: #2563EB;"
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          All Properties Combined (Themed)
        </h4>
        <hx-text-input
          label="Fully Themed Input"
          value="Enterprise Healthcare Theme"
          help-text="Every custom property overridden for a cohesive theme."
          style="
            --hx-input-bg: #0f172a;
            --hx-input-color: #f1f5f9;
            --hx-input-border-color: #334155;
            --hx-input-border-radius: 0.5rem;
            --hx-input-font-family: 'Inter', system-ui, sans-serif;
            --hx-input-focus-ring-color: #38bdf8;
            --hx-input-error-color: #f87171;
            --hx-input-label-color: #94a3b8;
          "
        ></hx-text-input>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .css-parts-demo hx-text-input::part(field) {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #dee2e6;
      }

      .css-parts-demo hx-text-input::part(label) {
        color: #0d6efd;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }

      .css-parts-demo hx-text-input::part(input-wrapper) {
        border: 2px solid #0d6efd;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
      }

      .css-parts-demo hx-text-input::part(input) {
        font-weight: 500;
        color: #212529;
        padding: 0.75rem 1rem;
      }

      .css-parts-demo hx-text-input::part(help-text) {
        color: #0d6efd;
        font-style: italic;
      }

      .css-parts-demo hx-text-input::part(error) {
        background: #fff5f5;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        border-left: 3px solid #dc3545;
        font-weight: 500;
      }
    </style>

    <div
      class="css-parts-demo"
      style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;"
    >
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          All 6 parts styled: field, label, input-wrapper, input, help-text, error
        </h4>
        <hx-text-input
          label="Styled via ::part()"
          placeholder="All parts are customized"
          help-text="This help text is styled via ::part(help-text)."
        ></hx-text-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Error state with ::part(error) styling
        </h4>
        <hx-text-input
          label="With Error Part"
          value="Invalid entry"
          error="This error message is styled with a left border accent via ::part(error)."
        ></hx-text-input>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const TypeAndVerify: Story = {
  args: {
    label: 'Diagnosis Code',
    placeholder: 'Enter ICD-10 code',
    name: 'diagnosisCode',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'J06.9');
    await expect(input.value).toBe('J06.9');

    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host.value).toBe('J06.9');
  },
};

export const EventVerification: Story = {
  args: {
    label: 'Medication Name',
    placeholder: 'Enter medication',
    name: 'medication',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = getNativeInput(canvasElement);

    let inputEventCount = 0;
    let changeEventFired = false;
    let lastInputDetail = '';
    let changeDetail = '';

    host.addEventListener('hx-input', ((e: CustomEvent<{ value: string }>) => {
      inputEventCount++;
      lastInputDetail = e.detail.value;
    }) as EventListener);

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: string }>) => {
      changeEventFired = true;
      changeDetail = e.detail.value;
    }) as EventListener);

    // Type each character — hx-input fires per keystroke
    await userEvent.type(input, 'Aspirin');
    await expect(inputEventCount).toBe(7); // A-s-p-i-r-i-n
    await expect(lastInputDetail).toBe('Aspirin');

    // Tab away to trigger hx-change
    await userEvent.tab();
    await expect(changeEventFired).toBe(true);
    await expect(changeDetail).toBe('Aspirin');
  },
};

export const ClearAndRetype: Story = {
  args: {
    label: 'Patient ID',
    placeholder: 'Enter patient ID',
    value: 'OLD-VALUE',
    name: 'patientId',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.value).toBe('OLD-VALUE');

    // Clear existing value
    await userEvent.clear(input);
    await expect(input.value).toBe('');

    // Type new value
    await userEvent.type(input, 'PAT-2026-00999');
    await expect(input.value).toBe('PAT-2026-00999');

    const host = canvasElement.querySelector('hx-text-input')!;
    await expect(host.value).toBe('PAT-2026-00999');
  },
};

export const KeyboardNavigation: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <hx-text-input
        label="First Field"
        placeholder="Tab into this field"
        name="first"
      ></hx-text-input>
      <hx-text-input
        label="Second Field"
        placeholder="Tab to this field"
        name="second"
      ></hx-text-input>
      <hx-text-input
        label="Third Field"
        placeholder="And then this field"
        name="third"
      ></hx-text-input>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll('hx-text-input');
    const firstInput = inputs[0]!.shadowRoot!.querySelector('input')!;
    const secondInput = inputs[1]!.shadowRoot!.querySelector('input')!;

    // Focus first input
    firstInput.focus();
    await expect(
      document.activeElement === inputs[0] || firstInput === inputs[0]!.shadowRoot!.activeElement,
    ).toBe(true);

    // Type in first field
    await userEvent.type(firstInput, 'Cardiology');
    await expect(firstInput.value).toBe('Cardiology');

    // Tab to second field
    await userEvent.tab();
    await expect(secondInput === inputs[1]!.shadowRoot!.activeElement).toBe(true);

    // Type in second field
    await userEvent.type(secondInput, 'Ward 4B');
    await expect(secondInput.value).toBe('Ward 4B');
  },
};

export const FormDataParticipation: Story = {
  render: () => {
    const onSubmit = fn();

    return html`
      <form
        id="formdata-test"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          onSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-text-input
          label="Patient Name"
          name="patientName"
          placeholder="Enter name"
        ></hx-text-input>

        <hx-text-input label="MRN" name="mrn" placeholder="PAT-YYYY-NNNNN"></hx-text-input>

        <button
          type="submit"
          style="
          padding: 0.5rem 1rem;
          background: #2563EB;
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          align-self: flex-start;
        "
        >
          Submit
        </button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll('hx-text-input');
    const nameInput = inputs[0]!.shadowRoot!.querySelector('input')!;
    const mrnInput = inputs[1]!.shadowRoot!.querySelector('input')!;

    await userEvent.type(nameInput, 'Jane Doe');
    await userEvent.type(mrnInput, 'PAT-2026-00482');

    // Verify the form-associated values
    await expect(inputs[0]!.value).toBe('Jane Doe');
    await expect(inputs[1]!.value).toBe('PAT-2026-00482');

    // Submit the form
    const submitButton = canvasElement.querySelector('button[type="submit"]')!;
    await userEvent.click(submitButton);
  },
};

export const DisabledNoInput: Story = {
  args: {
    label: 'Locked Field',
    value: 'Original Value',
    disabled: true,
    helpText: 'This field is disabled. Interaction should be blocked.',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;

    // Verify the input is disabled
    await expect(input.disabled).toBe(true);

    // Value should remain unchanged
    await expect(input.value).toBe('Original Value');
    await expect(host.value).toBe('Original Value');
  },
};

export const FocusManagement: Story = {
  args: {
    label: 'Focusable Input',
    placeholder: 'Programmatic focus test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text-input')!;
    const input = host.shadowRoot!.querySelector('input')!;

    // Programmatically focus the component
    host.focus();

    // Verify the native input received focus
    await expect(host.shadowRoot!.activeElement).toBe(input);

    // Type while focused
    await userEvent.type(input, 'Focused');
    await expect(input.value).toBe('Focused');
  },
};

// ─────────────────────────────────────────────────
// 12. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientSearch: Story = {
  render: () => html`
    <hx-text-input
      label="Patient Search"
      placeholder="Search by name, MRN, or date of birth"
      type="search"
      help-text="Enter at least 3 characters to begin searching."
    >
      <svg
        slot="prefix"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="var(--hx-color-neutral-500, #6c757d)"
        aria-hidden="true"
      >
        <path
          d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 110-10 5 5 0 010 10z"
        />
      </svg>
    </hx-text-input>
  `,
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'Mitchell');
    await expect(input.value).toBe('Mitchell');
  },
};

export const MedicalRecordNumber: Story = {
  render: () => html`
    <hx-text-input
      label="Medical Record Number (MRN)"
      placeholder="PAT-YYYY-NNNNN"
      name="mrn"
      required
      help-text="Format: PAT followed by a dash, 4-digit year, dash, and 5-digit sequence number."
    ></hx-text-input>
  `,
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'PAT-2026-00482');
    await expect(input.value).toBe('PAT-2026-00482');
  },
};

export const PhoneNumber: Story = {
  render: () => html`
    <hx-text-input
      label="Emergency Contact Phone"
      placeholder="(555) 123-4567"
      type="tel"
      name="emergencyPhone"
      required
      help-text="US phone number with area code. This number will be called in case of a medical emergency."
    ></hx-text-input>
  `,
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, '5551234567');
    await expect(input.value).toBe('5551234567');
  },
};

export const SSNMasked: Story = {
  name: 'SSN (Masked)',
  render: () => html`
    <hx-text-input
      label="Social Security Number"
      placeholder="XXX-XX-XXXX"
      type="password"
      name="ssn"
      required
      help-text="Required for insurance verification. This value is encrypted and never stored in plain text."
    >
      <svg
        slot="prefix"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="var(--hx-color-neutral-500, #6c757d)"
        aria-hidden="true"
      >
        <path
          d="M8 1a4 4 0 00-4 4v2H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm-2 4a2 2 0 114 0v2H6V5z"
        />
      </svg>
    </hx-text-input>
  `,
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.type).toBe('password');

    await userEvent.type(input, '123456789');
    await expect(input.value).toBe('123456789');

    // Value should be masked (type=password)
    await expect(input.type).toBe('password');
  },
};
