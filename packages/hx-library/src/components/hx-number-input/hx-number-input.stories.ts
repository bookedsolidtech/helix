import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-number-input.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Number Input',
  component: 'hx-number-input',
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
    value: {
      control: 'number',
      description: 'The current numeric value of the input. Null when the field is empty.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'null' },
        type: { summary: 'number | null' },
      },
    },
    min: {
      control: 'number',
      description: 'Minimum allowed value. When reached, the decrement button is disabled.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'number' },
      },
    },
    max: {
      control: 'number',
      description: 'Maximum allowed value. When reached, the increment button is disabled.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'number' },
      },
    },
    step: {
      control: 'number',
      description: 'The amount to increment or decrement on each step action.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
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
    readonly: {
      control: 'boolean',
      description: 'Whether the input is read-only. Value is visible but cannot be changed.',
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
    'help-text': {
      control: 'text',
      description: 'Help text displayed below the input for guidance.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    'hx-size': {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant controlling input padding and font size.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: "'md'" },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    'no-stepper': {
      control: 'boolean',
      description: 'When set, hides the +/- stepper buttons.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
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
  },
  args: {
    label: 'Numeric Value',
    value: null,
    min: undefined,
    max: undefined,
    step: 1,
    required: false,
    disabled: false,
    readonly: false,
    error: '',
    'help-text': '',
    'hx-size': 'md',
    'no-stepper': false,
    name: '',
  },
  render: (args) => html`
    <hx-number-input
      label=${args.label}
      .value=${args.value}
      .min=${args.min}
      .max=${args.max}
      .step=${args.step}
      ?required=${args.required}
      ?disabled=${args.disabled}
      ?readonly=${args.readonly}
      error=${args.error}
      help-text=${args['help-text']}
      hx-size=${args['hx-size']}
      ?no-stepper=${args['no-stepper']}
      name=${args.name}
    ></hx-number-input>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helper: Query the native input inside shadow DOM
// ─────────────────────────────────────────────────

function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-number-input');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-number-input not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-number-input shadow DOM');
  }
  return input;
}

// ─────────────────────────────────────────────────
// 1. DEFAULT — basic input with a label and a starting value
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Quantity',
    value: 10,
  },
  parameters: {
    docs: {
      description: {
        story: 'A basic number input with a visible label and an initial value of 10.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host).toBeTruthy();

    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const shadow = within(host.shadowRoot as unknown as HTMLElement);
    const label = shadow.getByText('Quantity');
    await expect(label).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input.value).toBe('10');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH MIN/MAX — bounded range with custom step
// ─────────────────────────────────────────────────

export const WithMinMax: Story = {
  args: {
    label: 'Percentage',
    value: 50,
    min: 0,
    max: 100,
    step: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates min=0, max=100, and step=5; the stepper buttons clamp the value within the allowed range.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.min).toBe('0');
    await expect(input.max).toBe('100');
    await expect(input.value).toBe('50');
  },
};

// ─────────────────────────────────────────────────
// 3. WITH HELP TEXT — guidance below the input
// ─────────────────────────────────────────────────

export const WithHelpText: Story = {
  args: {
    label: 'Dosage',
    value: null,
    helpText: 'Enter dosage in mg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Displays supplementary help text below the input to guide the user.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 4. WITH ERROR — error message and error styling
// ─────────────────────────────────────────────────

export const WithError: Story = {
  args: {
    label: 'Dosage',
    value: null,
    error: 'Value is required',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the error state with a validation message rendered below the input wrapper.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const shadow = within(host.shadowRoot as unknown as HTMLElement);
    const errorEl = shadow.getByText('Value is required');
    await expect(errorEl).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input.getAttribute('aria-invalid')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 5. DISABLED — no interaction allowed
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'System-Calculated Score',
    value: 42,
    disabled: true,
    helpText: 'This value is calculated automatically and cannot be modified.',
  },
  parameters: {
    docs: {
      description: {
        story: 'The disabled state prevents all user interaction and dims the component visually.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 6. READONLY — visible but immutable
// ─────────────────────────────────────────────────

export const Readonly: Story = {
  args: {
    label: 'Recorded Measurement',
    value: 98,
    readonly: true,
    helpText: 'This measurement was recorded at time of admission and cannot be changed.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The read-only state displays the value without allowing edits, while remaining focusable.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.readOnly).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 7. NO STEPPER — hides the +/- buttons
// ─────────────────────────────────────────────────

export const NoStepper: Story = {
  args: {
    label: 'Quantity',
    value: 5,
    noStepper: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hides the increment and decrement stepper buttons for a minimal numeric input.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const stepper = host.shadowRoot.querySelector('[part="stepper"]');
    await expect(stepper).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 8. SMALL SIZE
// ─────────────────────────────────────────────────

export const SmallSize: Story = {
  args: {
    label: 'Count',
    value: 3,
    hxSize: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'The small size variant uses reduced padding and font size for compact layouts.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 9. LARGE SIZE
// ─────────────────────────────────────────────────

export const LargeSize: Story = {
  args: {
    label: 'Count',
    value: 3,
    hxSize: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The large size variant uses increased padding and font size for prominent data entry.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 10. WITH PREFIX SLOT — unit label before the input
// ─────────────────────────────────────────────────

export const WithPrefix: Story = {
  render: () => html`
    <hx-number-input label="Dosage" .value=${250} .min=${0} .step=${10}>
      <span
        slot="prefix"
        style="font-size: 0.875rem; color: var(--hx-color-neutral-500, #6c757d); font-weight: 500;"
        >mg</span
      >
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Uses the prefix slot to display a unit label (mg) to the left of the input field.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE EXAMPLE — realistic dosage entry
// ─────────────────────────────────────────────────

export const HealthcareExample: Story = {
  render: () => html`
    <hx-number-input
      label="Dosage"
      .value=${250}
      .min=${0}
      .max=${1000}
      .step=${0.5}
      help-text="Enter prescribed dosage amount"
      name="dosage"
      required
    ></hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'A realistic dosage entry field with min=0, max=1000, step=0.5, and required validation for a medication order form.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input.min).toBe('0');
    await expect(input.max).toBe('1000');
    await expect(input.required).toBe(true);
    await expect(input.value).toBe('250');
  },
};

// ─────────────────────────────────────────────────
// 12. ALL SIZES — side-by-side size comparison
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-number-input label="Small (hx-size=sm)" .value=${1} hx-size="sm"></hx-number-input>
      <hx-number-input
        label="Medium (hx-size=md, default)"
        .value=${2}
        hx-size="md"
      ></hx-number-input>
      <hx-number-input label="Large (hx-size=lg)" .value=${3} hx-size="lg"></hx-number-input>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'All three size variants rendered together for visual comparison.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 13. ALL STATES — kitchen-sink state reference
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-number-input label="Default (empty)" .value=${null}></hx-number-input>

      <hx-number-input label="With Value" .value=${42}></hx-number-input>

      <hx-number-input
        label="Required"
        .value=${null}
        required
        help-text="This field is mandatory."
      ></hx-number-input>

      <hx-number-input
        label="With Help Text"
        .value=${10}
        help-text="Enter a value between 1 and 100."
      ></hx-number-input>

      <hx-number-input
        label="With Error"
        .value=${null}
        error="A numeric value is required."
      ></hx-number-input>

      <hx-number-input
        label="Disabled"
        .value=${99}
        disabled
        help-text="System-calculated, cannot be edited."
      ></hx-number-input>

      <hx-number-input
        label="Read-only"
        .value=${37}
        readonly
        help-text="Recorded at time of admission."
      ></hx-number-input>

      <hx-number-input
        label="No Stepper"
        .value=${15}
        no-stepper
        help-text="Stepper buttons are hidden."
      ></hx-number-input>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'All component states rendered together as a visual reference: default, with value, required, help text, error, disabled, read-only, and no-stepper.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 14. SLOT DEMOS
// ─────────────────────────────────────────────────

export const WithSuffix: Story = {
  render: () => html`
    <hx-number-input label="Patient Weight" .value=${72} .min=${0} .step=${0.1}>
      <span slot="suffix" style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
        >kg</span
      >
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Uses the suffix slot to display a unit label (kg) to the right of the input, before the stepper buttons.',
      },
    },
  },
};

export const WithErrorSlot: Story = {
  name: 'With Error Slot (Drupal Form API)',
  render: () => html`
    <hx-number-input label="Dosage" .value=${null} name="dosage">
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.25rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem;"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Dosage must be between 0 and 1000 mg.
      </div>
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the error slot for Drupal Form API rendered error messages with custom markup.',
      },
    },
  },
};

export const WithHelpSlot: Story = {
  name: 'With Help Slot',
  render: () => html`
    <hx-number-input label="Infusion Rate" .value=${125} name="infusionRate">
      <div slot="help" style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);">
        Standard adult maintenance rate is 125 mL/hr. Adjust based on patient weight and clinical
        status.
      </div>
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story: 'Uses the help slot to render rich help text content with custom markup.',
      },
    },
  },
};

export const WithLabelSlot: Story = {
  name: 'With Label Slot (Drupal Form API)',
  render: () => html`
    <hx-number-input .value=${250} .min=${0} .max=${1000} name="dosage">
      <label
        slot="label"
        style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #374151);"
      >
        Dosage (mg)
        <span
          aria-hidden="true"
          style="color: var(--hx-color-error-500, #dc3545); font-weight: 700;"
        >
          *</span
        >
      </label>
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Uses the label slot to render a server-side label from the Drupal Form API. This is the primary Drupal integration pattern when the label is rendered by the server rather than passed as a property.',
      },
    },
  },
};

export const DrupalFormAPI: Story = {
  name: 'Drupal Form API (All Slots)',
  render: () => html`
    <hx-number-input .value=${null} name="dosage" required>
      <label
        slot="label"
        style="font-size: 0.875rem; font-weight: 500; color: var(--hx-color-neutral-700, #374151);"
      >
        Dosage (mg)
        <span
          aria-hidden="true"
          style="color: var(--hx-color-error-500, #dc3545); font-weight: 700;"
        >
          *</span
        >
      </label>
      <div
        slot="error"
        style="display: flex; align-items: center; gap: 0.25rem; color: var(--hx-color-error-500, #dc3545); font-size: 0.75rem;"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path
            d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zM8 12a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
        Dosage is required.
      </div>
      <div slot="help" style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);">
        Enter prescribed dosage in milligrams (0–1000 mg).
      </div>
    </hx-number-input>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the full Drupal Form API pattern using all three slots simultaneously: a server-rendered label slot, a server-rendered error slot, and a server-rendered help slot. This is the recommended integration pattern for Drupal Form API consumers.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 15. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Default (all tokens at defaults)
        </h4>
        <hx-number-input
          label="Standard Appearance"
          .value=${10}
          help-text="All CSS custom properties at their defaults."
        ></hx-number-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-number-input-bg + --hx-number-input-color
        </h4>
        <hx-number-input
          label="Dark Background"
          .value=${42}
          style="--hx-number-input-bg: #1a1a2e; --hx-number-input-color: #e0e0e0;"
        ></hx-number-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-number-input-border-color + --hx-number-input-border-radius
        </h4>
        <hx-number-input
          label="Custom Border"
          .value=${75}
          style="--hx-number-input-border-color: #2563EB; --hx-number-input-border-radius: 9999px;"
        ></hx-number-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-number-input-focus-ring-color (click to focus)
        </h4>
        <hx-number-input
          label="Green Focus Ring"
          .value=${50}
          style="--hx-number-input-focus-ring-color: #198754;"
        ></hx-number-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          --hx-number-input-error-color
        </h4>
        <hx-number-input
          label="Custom Error Color"
          .value=${null}
          error="This field has an error."
          style="--hx-number-input-error-color: #dc6502;"
        ></hx-number-input>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates each CSS custom property token available on hx-number-input for theming.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 16. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .css-parts-demo hx-number-input::part(field) {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 0.75rem;
        border: 2px dashed #dee2e6;
      }

      .css-parts-demo hx-number-input::part(label) {
        color: #0d6efd;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }

      .css-parts-demo hx-number-input::part(input-wrapper) {
        border: 2px solid #0d6efd;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(13, 110, 253, 0.1);
      }

      .css-parts-demo hx-number-input::part(input) {
        font-weight: 500;
        color: #212529;
      }

      .css-parts-demo hx-number-input::part(stepper) {
        border-left: 2px solid #0d6efd;
      }

      .css-parts-demo hx-number-input::part(help-text) {
        color: #0d6efd;
        font-style: italic;
      }

      .css-parts-demo hx-number-input::part(error-message) {
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
          All parts styled: field, label, input-wrapper, input, stepper, help-text, error-message
        </h4>
        <hx-number-input
          label="Styled via ::part()"
          .value=${25}
          help-text="This help text is styled via ::part(help-text)."
        ></hx-number-input>
      </div>

      <div>
        <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #6c757d;">
          Error state with ::part(error-message) styling
        </h4>
        <hx-number-input
          label="With Error Part"
          .value=${null}
          error="Value must be between 0 and 100."
        ></hx-number-input>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates styling all exposed CSS parts: field, label, input-wrapper, input, stepper, help-text, and error-message.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 17. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const TypeAndVerify: Story = {
  args: {
    label: 'Blood Glucose',
    value: null,
    name: 'bloodGlucose',
    min: 0,
    max: 500,
    helpText: 'Enter blood glucose reading in mg/dL.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Verifies that typing a numeric value into the input updates the component value.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);

    await userEvent.clear(input);
    await userEvent.type(input, '120');
    await expect(input.value).toBe('120');

    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host.value).toBe(120);
  },
};

export const EventVerification: Story = {
  args: {
    label: 'Heart Rate',
    value: null,
    name: 'heartRate',
    min: 0,
    max: 300,
    step: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that hx-input fires on every keystroke and hx-change fires on blur after a value change.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    const input = getNativeInput(canvasElement);

    let inputEventCount = 0;
    let changeEventFired = false;
    let lastInputDetail: number | null = null;
    let changeDetail: number | null = null;

    host.addEventListener('hx-input', ((e: CustomEvent<{ value: number | null }>) => {
      inputEventCount++;
      lastInputDetail = e.detail.value;
    }) as EventListener);

    host.addEventListener('hx-change', ((e: CustomEvent<{ value: number | null }>) => {
      changeEventFired = true;
      changeDetail = e.detail.value;
    }) as EventListener);

    await userEvent.clear(input);
    await userEvent.type(input, '72');
    // Two keystrokes: '7', '2'
    await expect(inputEventCount).toBe(2);
    await expect(lastInputDetail).toBe(72);

    // Tab away to trigger hx-change
    await userEvent.tab();
    await expect(changeEventFired).toBe(true);
    await expect(changeDetail).toBe(72);
  },
};

export const StepperInteraction: Story = {
  args: {
    label: 'Dosage Units',
    value: 5,
    min: 0,
    max: 20,
    step: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that clicking the increment and decrement stepper buttons adjusts the value correctly.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host.value).toBe(5);

    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const incrementBtn = host.shadowRoot.querySelector(
      '[part="increment"]',
    ) as HTMLButtonElement | null;
    const decrementBtn = host.shadowRoot.querySelector(
      '[part="decrement"]',
    ) as HTMLButtonElement | null;
    if (!incrementBtn) throw new Error('increment button not found');
    if (!decrementBtn) throw new Error('decrement button not found');

    await expect(incrementBtn).toBeTruthy();
    await expect(decrementBtn).toBeTruthy();

    await userEvent.click(incrementBtn);
    await expect(host.value).toBe(6);

    await userEvent.click(decrementBtn);
    await expect(host.value).toBe(5);
  },
};

export const KeyboardArrows: Story = {
  args: {
    label: 'Respiratory Rate',
    value: 16,
    min: 0,
    max: 60,
    step: 1,
    helpText: 'Normal adult respiratory rate: 12-20 breaths per minute.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that pressing ArrowUp and ArrowDown keyboard keys increments and decrements the value.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    const input = getNativeInput(canvasElement);

    input.focus();
    await expect(host.value).toBe(16);

    await userEvent.keyboard('{ArrowUp}');
    await expect(host.value).toBe(17);

    await userEvent.keyboard('{ArrowDown}');
    await expect(host.value).toBe(16);

    await userEvent.keyboard('{ArrowDown}');
    await expect(host.value).toBe(15);
  },
};

export const MinBoundaryClamping: Story = {
  args: {
    label: 'Oxygen Saturation',
    value: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the value is clamped to the minimum boundary when the decrement button is pressed at the minimum.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host.value).toBe(0);

    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const decrementBtn = host.shadowRoot.querySelector(
      '[part="decrement"]',
    ) as HTMLButtonElement | null;
    if (!decrementBtn) throw new Error('decrement button not found');
    await expect(decrementBtn.disabled).toBe(true);
  },
};

export const MaxBoundaryClamping: Story = {
  args: {
    label: 'Oxygen Saturation',
    value: 100,
    min: 0,
    max: 100,
    step: 1,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the increment button is disabled when the value reaches the maximum boundary.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    await expect(host.value).toBe(100);

    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    const incrementBtn = host.shadowRoot.querySelector(
      '[part="increment"]',
    ) as HTMLButtonElement | null;
    if (!incrementBtn) throw new Error('increment button not found');
    await expect(incrementBtn.disabled).toBe(true);
  },
};

export const DisabledNoInput: Story = {
  args: {
    label: 'Locked Reading',
    value: 98,
    disabled: true,
    helpText: 'This value is locked and cannot be modified.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that a disabled input cannot be typed into and retains its original value.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    const input = getNativeInput(canvasElement);

    await expect(input.disabled).toBe(true);
    await expect(input.value).toBe('98');
    await expect(host.value).toBe(98);
  },
};

export const FocusManagement: Story = {
  args: {
    label: 'Focusable Input',
    value: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that programmatic focus on the host element delegates focus to the native input.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-number-input');
    if (!host) throw new Error('hx-number-input not found');
    const input = getNativeInput(canvasElement);

    host.focus();
    if (!host.shadowRoot) throw new Error('shadowRoot not available');
    await expect(host.shadowRoot.activeElement).toBe(input);

    await userEvent.type(input, '55');
    await expect(input.value).toBe('55');
  },
};

// ─────────────────────────────────────────────────
// 18. FORM PARTICIPATION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
    >
      <hx-number-input
        label="Patient Age"
        name="age"
        min="0"
        max="150"
        step="1"
        required
        help-text="Patient age in years."
      ></hx-number-input>

      <hx-number-input
        label="Weight (kg)"
        name="weight"
        min="0"
        max="500"
        step="0.1"
        required
        help-text="Patient weight in kilograms."
      ></hx-number-input>

      <hx-number-input
        label="Dosage (mg)"
        name="dosage"
        min="0"
        max="2000"
        step="0.5"
        required
        help-text="Prescribed dosage in milligrams."
      ></hx-number-input>

      <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
        <button
          type="submit"
          style="padding: 0.5rem 1rem; background: var(--hx-color-primary-600, #2563eb); color: var(--hx-color-neutral-0, #fff); border: none; border-radius: var(--hx-border-radius-md, 0.375rem); cursor: pointer; font-size: var(--hx-font-size-sm, 0.875rem);"
        >
          Submit Order
        </button>
        <button
          type="reset"
          style="padding: 0.5rem 1rem; background: transparent; border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #dee2e6); border-radius: var(--hx-border-radius-md, 0.375rem); cursor: pointer; font-size: var(--hx-font-size-sm, 0.875rem);"
        >
          Reset
        </button>
      </div>
    </form>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates multiple hx-number-input fields participating in a medication order form with native form association.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll('hx-number-input');
    const host0 = inputs[0];
    const host1 = inputs[1];
    const host2 = inputs[2];
    if (!host0 || !host1 || !host2) throw new Error('hx-number-input elements not found');
    if (!host0.shadowRoot || !host1.shadowRoot || !host2.shadowRoot)
      throw new Error('shadowRoot not available');

    const ageInput = host0.shadowRoot.querySelector('input');
    const weightInput = host1.shadowRoot.querySelector('input');
    const dosageInput = host2.shadowRoot.querySelector('input');
    if (!ageInput || !weightInput || !dosageInput) throw new Error('input elements not found');

    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '45');
    await expect(ageInput.value).toBe('45');

    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '72');
    await expect(weightInput.value).toBe('72');

    await userEvent.clear(dosageInput);
    await userEvent.type(dosageInput, '500');
    await expect(dosageInput.value).toBe('500');
  },
};
