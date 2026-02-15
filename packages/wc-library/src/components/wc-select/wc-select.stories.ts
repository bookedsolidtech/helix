import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './wc-select.js';

const meta = {
  title: 'Components/Select',
  component: 'wc-select',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the select.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder option text shown as the first disabled option.',
    },
    value: {
      control: 'text',
      description: 'The current value of the select.',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the select.',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the select is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the select is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the select enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the select for guidance.',
    },
    name: {
      control: 'text',
      description: 'The name of the select, used for form submission.',
    },
  },
  args: {
    label: 'Label',
    placeholder: 'Select an option...',
    value: '',
    size: 'md',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      wc-size=${args.size}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    >
      <option value="opt1">Option 1</option>
      <option value="opt2">Option 2</option>
      <option value="opt3">Option 3</option>
    </wc-select>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {
  args: {
    label: 'Country',
    placeholder: 'Select a country...',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      wc-size=${args.size}
      ?required=${args.required}
      ?disabled=${args.disabled}
    >
      <option value="us">United States</option>
      <option value="ca">Canada</option>
      <option value="uk">United Kingdom</option>
      <option value="de">Germany</option>
      <option value="fr">France</option>
    </wc-select>
  `,
  play: async ({ canvasElement }) => {
    const select = canvasElement.querySelector('wc-select');
    expect(select).toBeTruthy();
    const nativeSelect = select?.shadowRoot?.querySelector('select');
    expect(nativeSelect).toBeTruthy();
  },
};

// ─── With Placeholder ───

export const WithPlaceholder: Story = {
  args: {
    label: 'Department',
    placeholder: 'Choose your department...',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
    >
      <option value="cardiology">Cardiology</option>
      <option value="neurology">Neurology</option>
      <option value="oncology">Oncology</option>
      <option value="pediatrics">Pediatrics</option>
    </wc-select>
  `,
};

// ─── With Help Text ───

export const WithHelpText: Story = {
  args: {
    label: 'Insurance Provider',
    placeholder: 'Select provider...',
    helpText: 'Choose the primary insurance provider for this patient.',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      help-text=${args.helpText}
    >
      <option value="aetna">Aetna</option>
      <option value="bcbs">Blue Cross Blue Shield</option>
      <option value="cigna">Cigna</option>
      <option value="united">UnitedHealthcare</option>
    </wc-select>
  `,
};

// ─── With Error ───

export const WithError: Story = {
  args: {
    label: 'Blood Type',
    placeholder: 'Select blood type...',
    error: 'Blood type is required for this procedure.',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      error=${args.error}
      required
    >
      <option value="a-pos">A+</option>
      <option value="a-neg">A-</option>
      <option value="b-pos">B+</option>
      <option value="b-neg">B-</option>
      <option value="o-pos">O+</option>
      <option value="o-neg">O-</option>
      <option value="ab-pos">AB+</option>
      <option value="ab-neg">AB-</option>
    </wc-select>
  `,
};

// ─── Disabled ───

export const Disabled: Story = {
  args: {
    label: 'Facility',
    placeholder: 'Not available',
    disabled: true,
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      ?disabled=${args.disabled}
    >
      <option value="main">Main Campus</option>
      <option value="north">North Wing</option>
    </wc-select>
  `,
};

// ─── Required ───

export const Required: Story = {
  args: {
    label: 'Priority Level',
    placeholder: 'Select priority...',
    required: true,
    helpText: 'Required. This determines the triage order.',
  },
  render: (args) => html`
    <wc-select
      label=${args.label}
      placeholder=${args.placeholder}
      ?required=${args.required}
      help-text=${args.helpText}
    >
      <option value="critical">Critical</option>
      <option value="urgent">Urgent</option>
      <option value="standard">Standard</option>
      <option value="low">Low</option>
    </wc-select>
  `,
};

// ─── Sizes ───

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <wc-select label="Small" wc-size="sm" placeholder="Select...">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="Medium (default)" wc-size="md" placeholder="Select...">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="Large" wc-size="lg" placeholder="Select...">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>
    </div>
  `,
};

// ─── All States ───

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <wc-select label="Default" placeholder="Select an option...">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="Required (empty)" placeholder="This is required" required>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="With Error" placeholder="Select..." error="This field is required.">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="With Help Text" placeholder="Select..." help-text="Additional guidance here.">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="Disabled" placeholder="Cannot select" disabled>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>

      <wc-select label="With Value" value="b">
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </wc-select>
    </div>
  `,
};

// ─── In a Form ───

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        console.log('Form data:', Object.fromEntries(data.entries()));
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;"
    >
      <wc-select
        label="Department"
        name="department"
        placeholder="Select department..."
        required
        help-text="Which department is this referral for?"
      >
        <option value="cardiology">Cardiology</option>
        <option value="neurology">Neurology</option>
        <option value="oncology">Oncology</option>
      </wc-select>

      <wc-select
        label="Priority"
        name="priority"
        placeholder="Select priority..."
        required
      >
        <option value="critical">Critical</option>
        <option value="urgent">Urgent</option>
        <option value="standard">Standard</option>
      </wc-select>

      <wc-select
        label="Insurance"
        name="insurance"
        placeholder="Select insurance..."
      >
        <option value="aetna">Aetna</option>
        <option value="bcbs">Blue Cross Blue Shield</option>
        <option value="cigna">Cigna</option>
      </wc-select>

      <wc-button type="submit">Submit Referral</wc-button>
    </form>
  `,
};
