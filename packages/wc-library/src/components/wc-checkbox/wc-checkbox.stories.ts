import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './wc-checkbox.js';

const meta = {
  title: 'Components/Checkbox',
  component: 'wc-checkbox',
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    indeterminate: {
      control: 'boolean',
      description: 'Whether the checkbox is in an indeterminate state.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the checkbox is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    label: {
      control: 'text',
      description: 'The visible label text for the checkbox.',
    },
    value: {
      control: 'text',
      description: 'The value submitted when the checkbox is checked.',
      table: {
        defaultValue: { summary: 'on' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the checkbox enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the checkbox for guidance.',
    },
    name: {
      control: 'text',
      description: 'The name of the checkbox, used for form submission.',
    },
  },
  args: {
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    label: 'Checkbox label',
    value: 'on',
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <wc-checkbox
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
      .indeterminate=${args.indeterminate}
      label=${args.label}
      value=${args.value}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    ></wc-checkbox>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {
  args: {
    label: 'I agree to the terms and conditions',
  },
  play: async ({ canvasElement }) => {
    const checkbox = canvasElement.querySelector('wc-checkbox');
    expect(checkbox).toBeTruthy();
    const control = checkbox?.shadowRoot?.querySelector('.checkbox__control');
    expect(control).toBeTruthy();
    await userEvent.click(control!);
  },
};

// ─── Checked ───

export const Checked: Story = {
  args: {
    label: 'Receive email notifications',
    checked: true,
  },
};

// ─── Indeterminate ───

export const Indeterminate: Story = {
  args: {
    label: 'Select all items',
    indeterminate: true,
  },
};

// ─── With Help Text ───

export const WithHelpText: Story = {
  args: {
    label: 'Subscribe to newsletter',
    helpText: 'We send updates once a week. Unsubscribe at any time.',
  },
};

// ─── With Error ───

export const WithError: Story = {
  args: {
    label: 'I accept the privacy policy',
    required: true,
    error: 'You must accept the privacy policy to continue.',
  },
};

// ─── Disabled ───

export const Disabled: Story = {
  args: {
    label: 'This option is unavailable',
    disabled: true,
  },
};

// ─── Required ───

export const Required: Story = {
  args: {
    label: 'I confirm the information is accurate',
    required: true,
    helpText: 'This checkbox is required.',
  },
};

// ─── All States ───

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <wc-checkbox label="Default (unchecked)"></wc-checkbox>

      <wc-checkbox label="Checked" checked></wc-checkbox>

      <wc-checkbox label="Indeterminate" .indeterminate=${true}></wc-checkbox>

      <wc-checkbox
        label="Required"
        required
      ></wc-checkbox>

      <wc-checkbox
        label="With help text"
        help-text="Additional guidance for the user."
      ></wc-checkbox>

      <wc-checkbox
        label="With error"
        error="This field is required."
        required
      ></wc-checkbox>

      <wc-checkbox label="Disabled (unchecked)" disabled></wc-checkbox>

      <wc-checkbox label="Disabled (checked)" disabled checked></wc-checkbox>
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
      <wc-checkbox
        label="I agree to the terms of service"
        name="terms"
        value="accepted"
        required
        help-text="You must agree to continue."
      ></wc-checkbox>

      <wc-checkbox
        label="I accept the privacy policy"
        name="privacy"
        value="accepted"
        required
      ></wc-checkbox>

      <wc-checkbox
        label="Subscribe to marketing emails"
        name="marketing"
        value="subscribed"
        help-text="Optional. We won't spam you."
      ></wc-checkbox>

      <wc-button type="submit">Submit Form</wc-button>
    </form>
  `,
};
