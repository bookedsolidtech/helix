import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './wc-radio-group.js';
import './wc-radio.js';

const meta = {
  title: 'Components/Radio Group',
  component: 'wc-radio-group',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The fieldset legend/label text.',
    },
    value: {
      control: 'text',
      description: 'The selected radio value.',
    },
    name: {
      control: 'text',
      description: 'The name used for form submission.',
    },
    required: {
      control: 'boolean',
      description: 'Whether a selection is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the entire group is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the group enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the group for guidance.',
    },
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Layout orientation of the radio items.',
      table: {
        defaultValue: { summary: 'vertical' },
      },
    },
  },
  args: {
    label: 'Select an option',
    value: '',
    name: 'demo',
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    orientation: 'vertical',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      value=${args.value}
      name=${args.name}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      orientation=${args.orientation}
      @wc-change=${(e: CustomEvent) => console.log('wc-change:', e.detail)}
    >
      <wc-radio value="option-1" label="Option 1"></wc-radio>
      <wc-radio value="option-2" label="Option 2"></wc-radio>
      <wc-radio value="option-3" label="Option 3"></wc-radio>
    </wc-radio-group>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Default ───

export const Default: Story = {
  args: {
    label: 'Preferred Contact Method',
    helpText: 'Choose how you would like us to reach you.',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      help-text=${args.helpText}
      name="contact"
      @wc-change=${(e: CustomEvent) => console.log('wc-change:', e.detail)}
    >
      <wc-radio value="email" label="Email"></wc-radio>
      <wc-radio value="phone" label="Phone"></wc-radio>
      <wc-radio value="mail" label="Mail"></wc-radio>
    </wc-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('wc-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('wc-radio');
    expect(radios.length).toBeGreaterThan(0);
  },
};

// ─── Horizontal ───

export const Horizontal: Story = {
  args: {
    label: 'Size',
    orientation: 'horizontal',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      orientation=${args.orientation}
      name="size"
      @wc-change=${(e: CustomEvent) => console.log('wc-change:', e.detail)}
    >
      <wc-radio value="sm" label="Small"></wc-radio>
      <wc-radio value="md" label="Medium"></wc-radio>
      <wc-radio value="lg" label="Large"></wc-radio>
      <wc-radio value="xl" label="Extra Large"></wc-radio>
    </wc-radio-group>
  `,
};

// ─── With Error ───

export const WithError: Story = {
  args: {
    label: 'Priority Level',
    error: 'Please select a priority level.',
    required: true,
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      error=${args.error}
      ?required=${args.required}
      name="priority"
    >
      <wc-radio value="low" label="Low"></wc-radio>
      <wc-radio value="medium" label="Medium"></wc-radio>
      <wc-radio value="high" label="High"></wc-radio>
    </wc-radio-group>
  `,
};

// ─── Disabled ───

export const Disabled: Story = {
  args: {
    label: 'Notification Preference',
    disabled: true,
    value: 'email',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      ?disabled=${args.disabled}
      value=${args.value}
      name="notification"
    >
      <wc-radio value="email" label="Email"></wc-radio>
      <wc-radio value="sms" label="SMS"></wc-radio>
      <wc-radio value="push" label="Push Notification"></wc-radio>
    </wc-radio-group>
  `,
};

// ─── Required ───

export const Required: Story = {
  args: {
    label: 'Appointment Type',
    required: true,
    helpText: 'Required. Select the type of appointment.',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      ?required=${args.required}
      help-text=${args.helpText}
      name="appointment"
    >
      <wc-radio value="in-person" label="In-Person Visit"></wc-radio>
      <wc-radio value="telehealth" label="Telehealth"></wc-radio>
      <wc-radio value="phone" label="Phone Consultation"></wc-radio>
    </wc-radio-group>
  `,
};

// ─── Pre-Selected ───

export const PreSelected: Story = {
  args: {
    label: 'Insurance Type',
    value: 'private',
  },
  render: (args) => html`
    <wc-radio-group
      label=${args.label}
      value=${args.value}
      name="insurance"
      @wc-change=${(e: CustomEvent) => console.log('wc-change:', e.detail)}
    >
      <wc-radio value="medicare" label="Medicare"></wc-radio>
      <wc-radio value="medicaid" label="Medicaid"></wc-radio>
      <wc-radio value="private" label="Private Insurance"></wc-radio>
      <wc-radio value="none" label="Uninsured"></wc-radio>
    </wc-radio-group>
  `,
};

// ─── All Orientations ───

export const AllOrientations: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <wc-radio-group
        label="Vertical (Default)"
        orientation="vertical"
        name="vert"
      >
        <wc-radio value="a" label="Option A"></wc-radio>
        <wc-radio value="b" label="Option B"></wc-radio>
        <wc-radio value="c" label="Option C"></wc-radio>
      </wc-radio-group>

      <wc-radio-group
        label="Horizontal"
        orientation="horizontal"
        name="horiz"
      >
        <wc-radio value="a" label="Option A"></wc-radio>
        <wc-radio value="b" label="Option B"></wc-radio>
        <wc-radio value="c" label="Option C"></wc-radio>
      </wc-radio-group>
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
      style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 400px;"
    >
      <wc-radio-group
        label="Department"
        name="department"
        required
        help-text="Select your department for routing."
      >
        <wc-radio value="cardiology" label="Cardiology"></wc-radio>
        <wc-radio value="neurology" label="Neurology"></wc-radio>
        <wc-radio value="orthopedics" label="Orthopedics"></wc-radio>
        <wc-radio value="primary-care" label="Primary Care"></wc-radio>
      </wc-radio-group>

      <wc-radio-group
        label="Urgency"
        name="urgency"
        required
        orientation="horizontal"
      >
        <wc-radio value="routine" label="Routine"></wc-radio>
        <wc-radio value="urgent" label="Urgent"></wc-radio>
        <wc-radio value="emergency" label="Emergency"></wc-radio>
      </wc-radio-group>

      <wc-button type="submit">Submit Referral</wc-button>
    </form>
  `,
};
