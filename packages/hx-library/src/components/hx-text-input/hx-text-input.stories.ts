import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-text-input.js';

const meta = {
  title: 'Components/Text Input',
  component: 'hx-text-input',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the input.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the input is empty.',
    },
    value: {
      control: 'text',
      description: 'The current value of the input.',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number'],
      description: 'The type of the native input element.',
      table: {
        defaultValue: { summary: 'text' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the input is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the input enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the input for guidance.',
    },
    name: {
      control: 'text',
      description: 'The name of the input, used for form submission.',
    },
  },
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
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

// ─── Default ───

export const Default: Story = {
  args: {
    label: 'Full Name',
    placeholder: 'Enter your full name',
  },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector('hx-text-input');
    expect(input).toBeTruthy();
    const nativeInput = input?.shadowRoot?.querySelector('input');
    expect(nativeInput).toBeTruthy();
    await userEvent.type(nativeInput!, 'Hello');
    expect(nativeInput!.value).toBe('Hello');
  },
};

// ─── With Help Text ───

export const WithHelpText: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
    helpText: 'We will never share your email with anyone.',
  },
};

// ─── Required ───

export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Choose a username',
    required: true,
    helpText: 'Required field. 3-20 characters.',
  },
};

// ─── Error State ───

export const ErrorState: Story = {
  args: {
    label: 'Email Address',
    value: 'not-an-email',
    type: 'email',
    error: 'Please enter a valid email address.',
  },
};

// ─── Disabled ───

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    value: 'Cannot edit this',
    disabled: true,
  },
};

// ─── Password Type ───

export const Password: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    required: true,
  },
};

// ─── With Prefix and Suffix Slots ───

export const WithPrefixSuffix: Story = {
  render: () => html`
    <hx-text-input label="Website" placeholder="example.com" type="url">
      <span slot="prefix" style="font-size: 0.875rem; color: #6c757d;">https://</span>
      <span slot="suffix" style="font-size: 0.875rem; color: #6c757d;">.com</span>
    </hx-text-input>
  `,
};

// ─── All Validation States ───

export const ValidationStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <hx-text-input
        label="Default"
        placeholder="No validation state"
      ></hx-text-input>

      <hx-text-input
        label="Required (empty)"
        placeholder="This field is required"
        required
      ></hx-text-input>

      <hx-text-input
        label="With Error"
        value="bad value"
        error="This value is not valid."
      ></hx-text-input>

      <hx-text-input
        label="With Help Text"
        placeholder="Helpful guidance below"
        help-text="This is supplementary help text."
      ></hx-text-input>

      <hx-text-input
        label="Disabled"
        value="Read-only value"
        disabled
      ></hx-text-input>
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
      <hx-text-input
        label="First Name"
        name="firstName"
        placeholder="Jane"
        required
      ></hx-text-input>

      <hx-text-input
        label="Last Name"
        name="lastName"
        placeholder="Doe"
        required
      ></hx-text-input>

      <hx-text-input
        label="Email"
        name="email"
        type="email"
        placeholder="jane@example.com"
        required
        help-text="We'll send a confirmation to this address."
      ></hx-text-input>

      <hx-button type="submit">Submit Form</hx-button>
    </form>
  `,
};
