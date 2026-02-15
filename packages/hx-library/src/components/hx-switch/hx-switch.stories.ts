import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-switch.js';

const meta = {
  title: 'Components/Switch',
  component: 'hx-switch',
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the switch is toggled on.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the switch is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    label: {
      control: 'text',
      description: 'The visible label text for the switch.',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the switch.',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the switch enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the switch for guidance.',
    },
    value: {
      control: 'text',
      description: 'The value submitted when the switch is checked.',
      table: {
        defaultValue: { summary: 'on' },
      },
    },
    name: {
      control: 'text',
      description: 'The name of the switch, used for form submission.',
    },
  },
  args: {
    checked: false,
    disabled: false,
    required: false,
    label: 'Toggle',
    size: 'md',
    error: '',
    helpText: '',
    value: 'on',
    name: '',
  },
  render: (args) => html`
    <hx-switch
      label=${args.label}
      wc-size=${args.size}
      ?checked=${args.checked}
      ?disabled=${args.disabled}
      ?required=${args.required}
      error=${args.error}
      help-text=${args.helpText}
      value=${args.value}
      name=${args.name}
    ></hx-switch>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// --- Default ---

export const Default: Story = {
  args: {
    label: 'Dark Mode',
  },
  play: async ({ canvasElement }) => {
    const sw = canvasElement.querySelector('hx-switch');
    expect(sw).toBeTruthy();
    const track = sw?.shadowRoot?.querySelector('[role="switch"]');
    expect(track).toBeTruthy();
    await userEvent.click(track!);
  },
};

// --- Checked ---

export const Checked: Story = {
  args: {
    label: 'Notifications',
    checked: true,
  },
};

// --- Disabled ---

export const Disabled: Story = {
  args: {
    label: 'Disabled Switch',
    disabled: true,
  },
};

// --- Required ---

export const Required: Story = {
  args: {
    label: 'Accept Terms',
    required: true,
    helpText: 'You must accept the terms to continue.',
  },
};

// --- With Error ---

export const WithError: Story = {
  args: {
    label: 'Accept Terms',
    required: true,
    error: 'You must accept the terms and conditions.',
  },
};

// --- With Help Text ---

export const WithHelpText: Story = {
  args: {
    label: 'Email Notifications',
    helpText: 'Receive weekly digest emails about your account activity.',
  },
};

// --- Sizes ---

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <hx-switch label="Small" wc-size="sm"></hx-switch>
      <hx-switch label="Medium (default)" wc-size="md"></hx-switch>
      <hx-switch label="Large" wc-size="lg"></hx-switch>
    </div>
  `,
};

// --- All States ---

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;">
      <hx-switch label="Default (unchecked)"></hx-switch>
      <hx-switch label="Checked" checked></hx-switch>
      <hx-switch label="Disabled (unchecked)" disabled></hx-switch>
      <hx-switch label="Disabled (checked)" disabled checked></hx-switch>
      <hx-switch label="Required" required></hx-switch>
      <hx-switch label="With Error" error="This field is required."></hx-switch>
      <hx-switch label="With Help Text" help-text="Toggle to enable notifications."></hx-switch>
      <hx-switch label="Error hides help text" error="Must accept." help-text="Hidden help."></hx-switch>
    </div>
  `,
};

// --- In A Form ---

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
      <hx-switch
        label="Accept Terms and Conditions"
        name="acceptTerms"
        required
        help-text="You must accept to continue."
      ></hx-switch>

      <hx-switch
        label="Subscribe to Newsletter"
        name="newsletter"
        checked
      ></hx-switch>

      <hx-switch
        label="Enable Two-Factor Authentication"
        name="twoFactor"
        help-text="Recommended for healthcare accounts."
      ></hx-switch>

      <hx-button type="submit">Submit Form</hx-button>
    </form>
  `,
};
