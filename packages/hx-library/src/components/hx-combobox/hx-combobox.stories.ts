import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-combobox.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Combobox',
  component: 'hx-combobox',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the combobox.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown in the input when empty.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value of the combobox.',
      table: {
        category: 'State',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the combobox.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the combobox is required for form submission.',
      table: {
        category: 'Validation',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the combobox is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    clearable: {
      control: 'boolean',
      description: 'Whether to show a clear button when a value is set.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Whether the combobox shows a loading spinner.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    filterDebounce: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Debounce delay in milliseconds for filter input events.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the field enters an error state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the combobox.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Select a fruit',
    placeholder: 'Type to filter...',
    value: '',
    size: 'md',
    required: false,
    disabled: false,
    clearable: false,
    loading: false,
    filterDebounce: 0,
    error: '',
    helpText: '',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Default
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-combobox
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      hx-size=${args.size}
      ?required=${args.required}
      ?disabled=${args.disabled}
      ?clearable=${args.clearable}
      ?loading=${args.loading}
      filter-debounce=${args.filterDebounce}
      error=${args.error}
      help-text=${args.helpText}
    >
      <option slot="option" value="apple">Apple</option>
      <option slot="option" value="banana">Banana</option>
      <option slot="option" value="cherry">Cherry</option>
      <option slot="option" value="date">Date</option>
      <option slot="option" value="elderberry">Elderberry</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// With Options
// ─────────────────────────────────────────────────

export const WithOptions: Story = {
  render: () => html`
    <hx-combobox label="Country" placeholder="Search countries...">
      <option slot="option" value="us">United States</option>
      <option slot="option" value="ca">Canada</option>
      <option slot="option" value="gb">United Kingdom</option>
      <option slot="option" value="au">Australia</option>
      <option slot="option" value="de">Germany</option>
      <option slot="option" value="fr">France</option>
      <option slot="option" value="jp">Japan</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// Clearable
// ─────────────────────────────────────────────────

export const Clearable: Story = {
  render: () => html`
    <hx-combobox label="Favorite Fruit" placeholder="Type to filter..." value="banana" clearable>
      <option slot="option" value="apple">Apple</option>
      <option slot="option" value="banana">Banana</option>
      <option slot="option" value="cherry">Cherry</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────

export const Loading: Story = {
  render: () => html`
    <hx-combobox label="Search Users" placeholder="Type to search..." loading>
      <option slot="option" value="alice">Alice</option>
      <option slot="option" value="bob">Bob</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// Disabled
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => html`
    <hx-combobox label="Status" placeholder="Disabled..." value="active" disabled>
      <option slot="option" value="active">Active</option>
      <option slot="option" value="inactive">Inactive</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// Async (simulated)
// ─────────────────────────────────────────────────

export const Async: Story = {
  render: () => html`
    <hx-combobox
      label="Search Patients"
      placeholder="Type to search..."
      filter-debounce="300"
      loading
    >
      <option slot="option" value="p1">John Doe — MRN 001234</option>
      <option slot="option" value="p2">Jane Smith — MRN 005678</option>
      <option slot="option" value="p3">Bob Johnson — MRN 009012</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// With Help Text
// ─────────────────────────────────────────────────

export const WithHelpText: Story = {
  render: () => html`
    <hx-combobox
      label="Medication"
      placeholder="Search medications..."
      help-text="Start typing to filter available medications."
    >
      <option slot="option" value="aspirin">Aspirin 81mg</option>
      <option slot="option" value="metformin">Metformin 500mg</option>
      <option slot="option" value="lisinopril">Lisinopril 10mg</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// With Error
// ─────────────────────────────────────────────────

export const WithError: Story = {
  render: () => html`
    <hx-combobox
      label="Department"
      placeholder="Select department..."
      error="Please select a valid department."
      required
    >
      <option slot="option" value="cardiology">Cardiology</option>
      <option slot="option" value="neurology">Neurology</option>
      <option slot="option" value="oncology">Oncology</option>
    </hx-combobox>
  `,
};

// ─────────────────────────────────────────────────
// Size Variants
// ─────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-combobox label="Small" placeholder="Small combobox" hx-size="sm">
        <option slot="option" value="a">Option A</option>
        <option slot="option" value="b">Option B</option>
      </hx-combobox>
      <hx-combobox label="Medium (default)" placeholder="Medium combobox" hx-size="md">
        <option slot="option" value="a">Option A</option>
        <option slot="option" value="b">Option B</option>
      </hx-combobox>
      <hx-combobox label="Large" placeholder="Large combobox" hx-size="lg">
        <option slot="option" value="a">Option A</option>
        <option slot="option" value="b">Option B</option>
      </hx-combobox>
    </div>
  `,
};
