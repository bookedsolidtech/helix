import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import type { HelixField } from './hx-field.js';
import './hx-field.js';

// ─────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────

function getShadowRoot(host: HTMLElement | null): HTMLElement {
  if (!host) {
    throw new Error('hx-field element not found');
  }
  if (!host.shadowRoot) {
    throw new Error('shadowRoot not available on hx-field');
  }
  return host.shadowRoot as unknown as HTMLElement;
}

function getFieldHost(canvasElement: Element): HTMLElement {
  const host = canvasElement.querySelector('hx-field');
  if (!host) {
    throw new Error('hx-field element not found');
  }
  return host as HTMLElement;
}

function getInputElement(canvasElement: Element): HTMLInputElement {
  const input = canvasElement.querySelector('input');
  if (!input) {
    throw new Error('input element not found');
  }
  return input;
}

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Field',
  component: 'hx-field',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'Visible label text rendered above the slotted control. Omit if using the label slot for custom label content.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description:
        'Supplementary guidance displayed below the control. Hidden when an error is active. Use the help slot for rich content.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    error: {
      control: 'text',
      description:
        'Error message text. When set the field enters an error state: label turns error-red and the message appears below the control with role="alert". Replaces help text while active. Use the error slot for rich error content.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description:
        'Renders a required (*) indicator next to the label. Does not add required validation to the slotted control — set required on the control itself.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Applies a visual disabled state (opacity + pointer-events: none) to the entire field. Set disabled on the slotted control separately to prevent interaction.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    hxSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size variant controlling label and help text font sizes. The slotted control is not resized — size it independently.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: "'md'" },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    layout: {
      control: { type: 'select' },
      options: ['column', 'inline'],
      description:
        "Layout variant. 'column' stacks label above control; 'inline' places them side-by-side.",
      table: {
        category: 'Appearance',
        defaultValue: { summary: "'column'" },
        type: { summary: "'column' | 'inline'" },
      },
    },
  },
  args: {
    label: 'Email Address',
    helpText: '',
    error: '',
    required: false,
    disabled: false,
    hxSize: 'md',
    layout: 'column',
  },
  render: (args) => html`
    <hx-field
      label=${args.label}
      help-text=${args.helpText}
      error=${args.error}
      ?required=${args.required}
      ?disabled=${args.disabled}
      hx-size=${args.hxSize}
      layout=${args.layout}
    >
      <input
        type="email"
        placeholder="user@example.com"
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5;"
      />
    </hx-field>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  args: {
    label: 'Email Address',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));
    const label = shadow.getByText('Email Address');
    await expect(label).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. WITH HELP TEXT
// ─────────────────────────────────────────────────

export const WithHelpText: Story = {
  name: 'With Help Text',
  args: {
    label: 'Insurance ID',
    helpText: 'Found on the front of your insurance card, typically 9–12 digits.',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));
    const helpText = shadow.getByText(/9–12 digits/i);
    await expect(helpText).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 3. REQUIRED
// ─────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required',
  args: {
    label: 'Medical Record Number',
    required: true,
    helpText: 'Required. Used for patient identification across all care settings.',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();
    await expect(host.hasAttribute('required')).toBe(true);

    const shadow = within(getShadowRoot(host));
    const indicator = shadow.getByText('*');
    await expect(indicator).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. ERROR STATE
// ─────────────────────────────────────────────────

export const ErrorState: Story = {
  name: 'Error State',
  args: {
    label: 'Email Address',
    error: 'This field is required. Please enter a valid email address.',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));
    const errorMsg = shadow.getByText(/This field is required/i);
    await expect(errorMsg).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 5. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  name: 'Disabled',
  args: {
    label: 'System-Generated Patient ID',
    disabled: true,
    helpText: 'This value is assigned by the system and cannot be modified.',
  },
  render: (args) => html`
    <hx-field label=${args.label} help-text=${args.helpText} ?disabled=${args.disabled}>
      <input
        type="text"
        value="PAT-2026-00482"
        disabled
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5; background: var(--hx-color-neutral-100, #f8f9fa);"
      />
    </hx-field>
  `,
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();
    await expect(host.hasAttribute('disabled')).toBe(true);

    const input = getInputElement(canvasElement);
    await expect(input.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 6. SIZE VARIANTS — Individual stories
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  name: 'Size: Small',
  args: {
    label: 'Compact Field Label',
    helpText: 'Small label and help text font size.',
    hxSize: 'sm',
  },
};

export const SizeMedium: Story = {
  name: 'Size: Medium (Default)',
  args: {
    label: 'Standard Field Label',
    helpText: 'Medium label and help text font size (default).',
    hxSize: 'md',
  },
};

export const SizeLarge: Story = {
  name: 'Size: Large',
  args: {
    label: 'Large Field Label',
    helpText: 'Large label and help text font size.',
    hxSize: 'lg',
  },
};

// ─────────────────────────────────────────────────
// 7. SLOTTED LABEL
// ─────────────────────────────────────────────────

export const SlottedLabel: Story = {
  name: 'Slotted Label',
  render: () => html`
    <hx-field>
      <label
        slot="label"
        for="known-allergies"
        style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #343a40);"
      >
        Known Allergies
        <span
          style="color: var(--hx-color-error-500, #dc3545); font-weight: 700;"
          aria-hidden="true"
          >*</span
        >
        <span
          style="font-size: 0.75rem; font-weight: 400; color: var(--hx-color-neutral-500, #6c757d); padding: 0.125rem 0.375rem; background: var(--hx-color-neutral-100, #f8f9fa); border-radius: 0.25rem;"
          >Required for admission</span
        >
      </label>
      <input
        id="known-allergies"
        type="text"
        placeholder="List known drug, food, or environmental allergies"
        required
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5;"
      />
    </hx-field>
  `,
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('[slot="label"]') as HTMLLabelElement;
    const input = canvasElement.querySelector('input');
    await expect(label.htmlFor).toBe(input?.id);
    await expect(label.htmlFor).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 8. SLOTTED ERROR
// ─────────────────────────────────────────────────

export const SlottedError: Story = {
  name: 'Slotted Error',
  render: () => html`
    <hx-field label="Insurance ID">
      <input
        type="text"
        value="ABC"
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-error-500, #dc3545); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5;"
      />
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.375rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem;"
        role="alert"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Insurance ID must be between 9 and 12 digits. You entered 3.
      </div>
    </hx-field>
  `,
};

// ─────────────────────────────────────────────────
// 9. WRAPPING NATIVE SELECT
// ─────────────────────────────────────────────────

export const WrappingNativeSelect: Story = {
  name: 'Wrapping Native Select',
  render: () => html`
    <hx-field
      label="Department"
      required
      help-text="Select the department where the patient will be admitted."
    >
      <select
        required
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5; background: white; cursor: pointer;"
      >
        <option value="">Select a department</option>
        <option value="cardiology">Cardiology</option>
        <option value="emergency">Emergency Medicine</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
        <option value="orthopedics">Orthopedics</option>
        <option value="pediatrics">Pediatrics</option>
        <option value="radiology">Radiology</option>
      </select>
    </hx-field>
  `,
};

// ─────────────────────────────────────────────────
// 10. WRAPPING NATIVE TEXTAREA
// ─────────────────────────────────────────────────

export const WrappingTextarea: Story = {
  name: 'Wrapping Native Textarea',
  render: () => html`
    <hx-field
      label="Clinical Notes"
      help-text="Document relevant observations, symptoms, or care instructions. Plain text only."
    >
      <textarea
        rows="4"
        placeholder="Enter clinical notes here..."
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5; resize: vertical; font-family: inherit;"
      ></textarea>
    </hx-field>
  `,
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();
    const textarea = canvasElement.querySelector('textarea');
    await expect(textarea?.getAttribute('aria-label')).toBe('Clinical Notes');
  },
};

// ─────────────────────────────────────────────────
// 11. WRAPPING CUSTOM ELEMENT + DESCRIPTION SLOT
// ─────────────────────────────────────────────────

export const WrappingCustomElement: Story = {
  name: 'Wrapping Custom Element with Description',
  render: () => html`
    <hx-field
      label="Medication Dosage"
      help-text="Enter the prescribed dosage in milligrams per administration."
    >
      <div
        slot="description"
        style="font-size: 0.75rem; color: var(--hx-color-neutral-600, #495057); padding: 0.5rem 0.75rem; background: var(--hx-color-neutral-50, #f8f9fa); border-left: 3px solid var(--hx-color-primary-400, #74c0fc); border-radius: 0 0.25rem 0.25rem 0; margin-bottom: 0.25rem;"
      >
        <strong>Clinical guidance:</strong> Adult maximum single dose is 1000 mg. Pediatric dosing
        must be weight-based. Consult prescribing physician before exceeding 4000 mg/day total.
      </div>
      <input
        type="number"
        placeholder="0"
        min="0"
        max="1000"
        step="50"
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5;"
      />
    </hx-field>
  `,
};

// ─────────────────────────────────────────────────
// INLINE LAYOUT
// ─────────────────────────────────────────────────

export const InlineLayout: Story = {
  name: 'Layout: Inline',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 520px;">
      <hx-field label="Patient Name" layout="inline">
        <input
          type="text"
          placeholder="First Last"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>
      <hx-field label="Date of Birth" layout="inline" required>
        <input
          type="date"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>
      <hx-field label="Department" layout="inline" help-text="Select the admitting department.">
        <select
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; background: white;"
        >
          <option value="">Select...</option>
          <option value="cardiology">Cardiology</option>
          <option value="emergency">Emergency Medicine</option>
        </select>
      </hx-field>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// ALL SIZES — Kitchen sink comparison
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  name: 'All Sizes',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          hx-size="sm"
        </p>
        <hx-field
          label="Small Field Label"
          help-text="Small variant — compact label and help text."
          hx-size="sm"
        >
          <input
            type="text"
            placeholder="Small input"
            style="width: 100%; padding: 0.375rem 0.625rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.8125rem; line-height: 1.5;"
          />
        </hx-field>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          hx-size="md" (default)
        </p>
        <hx-field
          label="Medium Field Label"
          help-text="Medium variant — standard label and help text."
          hx-size="md"
        >
          <input
            type="text"
            placeholder="Medium input"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; line-height: 1.5;"
          />
        </hx-field>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          hx-size="lg"
        </p>
        <hx-field
          label="Large Field Label"
          help-text="Large variant — prominent label and help text."
          hx-size="lg"
        >
          <input
            type="text"
            placeholder="Large input"
            style="width: 100%; padding: 0.625rem 1rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 1rem; line-height: 1.5;"
          />
        </hx-field>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// ALL STATES — Kitchen sink
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  name: 'All States',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <hx-field label="Default State">
        <input
          type="text"
          placeholder="No validation applied"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field
        label="With Help Text"
        help-text="Supplementary guidance for the clinician entering this data."
      >
        <input
          type="text"
          placeholder="Enter patient data"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field
        label="Required"
        required
        help-text="This field is mandatory for patient identification."
      >
        <input
          type="text"
          placeholder="Enter MRN"
          required
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field
        label="Error State"
        error="Invalid format. Please enter a valid email address (e.g., clinician@hospital.org)."
      >
        <input
          type="email"
          value="not-an-email"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-error-500, #dc3545); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field
        label="Disabled State"
        disabled
        help-text="System-generated. Contact administration to change."
      >
        <input
          type="text"
          value="PAT-2026-00482"
          disabled
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; background: var(--hx-color-neutral-100, #f8f9fa);"
        />
      </hx-field>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Default (all tokens at defaults)
        </h4>
        <hx-field label="Standard Appearance" help-text="All CSS custom properties at defaults.">
          <input
            type="text"
            placeholder="Default field"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
          />
        </hx-field>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-label-color
        </h4>
        <hx-field
          label="Branded Label Color"
          help-text="Label rendered in a custom brand color."
          style="--hx-field-label-color: #2563eb;"
        >
          <input
            type="text"
            placeholder="Custom label color"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
          />
        </hx-field>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-error-color
        </h4>
        <hx-field
          label="Custom Error Color"
          error="Custom amber error color instead of default red."
          style="--hx-field-error-color: #d97706;"
        >
          <input
            type="text"
            value="invalid"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d97706; border-radius: 0.375rem; font-size: 0.875rem;"
          />
        </hx-field>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-font-family
        </h4>
        <hx-field
          label="Monospace Font Family"
          help-text="Useful for code or ID entry fields."
          style="--hx-field-font-family: 'Courier New', Courier, monospace;"
        >
          <input
            type="text"
            value="PAT-2026-00482"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; font-family: 'Courier New', Courier, monospace;"
          />
        </hx-field>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          All properties combined (dark theme)
        </h4>
        <hx-field
          label="Fully Themed Field"
          help-text="Every custom property overridden for dark theme."
          style="
            --hx-field-label-color: #94a3b8;
            --hx-field-error-color: #f87171;
            --hx-field-font-family: 'Inter', system-ui, sans-serif;
            background: #0f172a;
            padding: 1rem;
            border-radius: 0.5rem;
          "
        >
          <input
            type="text"
            placeholder="Dark themed input"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #334155; border-radius: 0.375rem; font-size: 0.875rem; background: #1e293b; color: #f1f5f9;"
          />
        </hx-field>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .css-parts-demo hx-field::part(field) {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #dee2e6;
      }

      .css-parts-demo hx-field::part(label) {
        color: #0d6efd;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.6875rem;
      }

      .css-parts-demo hx-field::part(control) {
        padding: 0.125rem 0;
      }

      .css-parts-demo hx-field::part(help-text) {
        color: #0d6efd;
        font-style: italic;
      }

      .css-parts-demo hx-field::part(error-message) {
        background: #fff5f5;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        border-left: 3px solid #dc3545;
        font-weight: 500;
      }

      .css-parts-demo hx-field::part(required-indicator) {
        font-size: 1rem;
        color: #dc3545;
      }
    </style>

    <div
      class="css-parts-demo"
      style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;"
    >
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057);"
        >
          Styled via ::part() — field, label, control, help-text, required-indicator
        </h4>
        <hx-field
          label="Styled Field"
          required
          help-text="This help text is styled via ::part(help-text)."
        >
          <input
            type="text"
            placeholder="Parts customized"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #0d6efd; border-radius: 0.5rem; font-size: 0.875rem;"
          />
        </hx-field>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057);"
        >
          Error state with ::part(error-message) left-border styling
        </h4>
        <hx-field
          label="Field with Error Part"
          error="This error is styled with a left-border accent via ::part(error-message)."
        >
          <input
            type="text"
            value="Invalid entry"
            style="width: 100%; padding: 0.5rem 0.75rem; border: 2px solid #dc3545; border-radius: 0.5rem; font-size: 0.875rem;"
          />
        </hx-field>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientIntakeForm: Story = {
  name: 'Healthcare: Patient Intake Form',
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 520px;">
      <hx-field
        label="Full Name"
        required
        help-text="Enter legal name as it appears on government-issued ID."
      >
        <input
          type="text"
          name="fullName"
          placeholder="First Middle Last"
          required
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field label="Date of Birth" required>
        <input
          type="date"
          name="dob"
          required
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field label="Primary Care Provider" help-text="Optional. Leave blank if not established.">
        <select
          name="pcp"
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem; background: white;"
        >
          <option value="">Select a provider</option>
          <option value="dr-vance">Dr. Eleanor Vance, MD</option>
          <option value="dr-mitchell">Dr. Robert Mitchell, DO</option>
          <option value="dr-chen">Dr. Grace Chen, NP</option>
        </select>
      </hx-field>

      <hx-field
        label="Insurance ID"
        required
        error="Insurance ID must be 9–12 digits. Please verify and re-enter."
      >
        <input
          type="text"
          name="insuranceId"
          value="ABC"
          required
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-error-500, #dc3545); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>

      <hx-field
        label="Emergency Contact Phone"
        required
        help-text="US phone number with area code. Used only in medical emergencies."
      >
        <input
          type="tel"
          name="emergencyPhone"
          placeholder="(555) 123-4567"
          required
          style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </hx-field>
    </form>
  `,
};

export const MedicationDosageField: Story = {
  name: 'Healthcare: Medication Dosage Entry',
  render: () => html`
    <div style="max-width: 400px;">
      <hx-field
        label="Acetaminophen Dosage"
        required
        help-text="Adult max: 1000 mg per dose, 4000 mg per day."
      >
        <div
          slot="description"
          style="font-size: 0.75rem; padding: 0.5rem 0.75rem; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 0.375rem; color: #92400e; margin-bottom: 0.25rem;"
        >
          <strong>Warning:</strong> Doses above 1000 mg require attending physician authorization.
          See pharmacy protocol OP-MED-042 for dosing table.
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="number"
            name="dosageMg"
            placeholder="500"
            min="0"
            max="1000"
            step="50"
            required
            style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
          />
          <span
            style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-600, #495057); white-space: nowrap;"
            >mg</span
          >
        </div>
      </hx-field>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// INTERACTION TESTS
// ─────────────────────────────────────────────────

export const LabelRendered: Story = {
  name: 'Interaction: Label Renders from Property',
  args: {
    label: 'Diagnosis Code',
    helpText: 'Enter ICD-10 code for primary diagnosis.',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));

    const label = shadow.getByText('Diagnosis Code');
    await expect(label).toBeTruthy();

    const helpText = shadow.getByText(/ICD-10 code/i);
    await expect(helpText).toBeTruthy();
  },
};

export const ErrorSuppressesHelpText: Story = {
  name: 'Interaction: Error Suppresses Help Text',
  args: {
    label: 'Patient Email',
    helpText: 'Enter your hospital-issued email address.',
    error: 'Email format is invalid. Correct example: clinician@hospital.org',
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));

    // Error message should be present
    const errorEl = shadow.getByText(/Email format is invalid/i);
    await expect(errorEl).toBeTruthy();

    // Help text should not appear in shadow DOM when error is active
    const helpTextEl = shadow.queryByText(/hospital-issued email/i);
    await expect(helpTextEl).toBeNull();
  },
};

export const RequiredIndicatorPresent: Story = {
  name: 'Interaction: Required Indicator',
  args: {
    label: 'Medical Record Number',
    required: true,
  },
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();
    await expect((host as HelixField).required).toBe(true);

    const shadow = within(getShadowRoot(host));
    const asterisk = shadow.getByText('*');
    await expect(asterisk).toBeTruthy();
  },
};

export const DisabledStateVerification: Story = {
  name: 'Interaction: Disabled State',
  args: {
    label: 'System ID',
    disabled: true,
  },
  render: (args) => html`
    <hx-field label=${args.label} ?disabled=${args.disabled}>
      <input
        type="text"
        value="LOCKED-VALUE"
        disabled
        style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
      />
    </hx-field>
  `,
  play: async ({ canvasElement }) => {
    const host = getFieldHost(canvasElement);
    await expect(host).toBeTruthy();
    await expect(host.hasAttribute('disabled')).toBe(true);

    const input = getInputElement(canvasElement);
    await expect(input.disabled).toBe(true);
    await expect(input.value).toBe('LOCKED-VALUE');
  },
};
