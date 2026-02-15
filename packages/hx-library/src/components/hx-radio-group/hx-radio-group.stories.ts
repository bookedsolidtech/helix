import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-radio-group.js';
import './hx-radio.js';

const meta = {
  title: 'Components/Radio Group',
  component: 'hx-radio-group',
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
    <hx-radio-group
      label=${args.label}
      value=${args.value}
      name=${args.name}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      orientation=${args.orientation}
      @wc-change=${(e: CustomEvent) => console.log('hx-change:', e.detail)}
    >
      <hx-radio value="option-1" label="Option 1"></hx-radio>
      <hx-radio value="option-2" label="Option 2"></hx-radio>
      <hx-radio value="option-3" label="Option 3"></hx-radio>
    </hx-radio-group>
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
    <hx-radio-group
      label=${args.label}
      help-text=${args.helpText}
      name="contact"
      @wc-change=${(e: CustomEvent) => console.log('hx-change:', e.detail)}
    >
      <hx-radio value="email" label="Email"></hx-radio>
      <hx-radio value="phone" label="Phone"></hx-radio>
      <hx-radio value="mail" label="Mail"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('hx-radio');
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
    <hx-radio-group
      label=${args.label}
      orientation=${args.orientation}
      name="size"
      @wc-change=${(e: CustomEvent) => console.log('hx-change:', e.detail)}
    >
      <hx-radio value="sm" label="Small"></hx-radio>
      <hx-radio value="md" label="Medium"></hx-radio>
      <hx-radio value="lg" label="Large"></hx-radio>
      <hx-radio value="xl" label="Extra Large"></hx-radio>
    </hx-radio-group>
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
    <hx-radio-group
      label=${args.label}
      error=${args.error}
      ?required=${args.required}
      name="priority"
    >
      <hx-radio value="low" label="Low"></hx-radio>
      <hx-radio value="medium" label="Medium"></hx-radio>
      <hx-radio value="high" label="High"></hx-radio>
    </hx-radio-group>
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
    <hx-radio-group
      label=${args.label}
      ?disabled=${args.disabled}
      value=${args.value}
      name="notification"
    >
      <hx-radio value="email" label="Email"></hx-radio>
      <hx-radio value="sms" label="SMS"></hx-radio>
      <hx-radio value="push" label="Push Notification"></hx-radio>
    </hx-radio-group>
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
    <hx-radio-group
      label=${args.label}
      ?required=${args.required}
      help-text=${args.helpText}
      name="appointment"
    >
      <hx-radio value="in-person" label="In-Person Visit"></hx-radio>
      <hx-radio value="telehealth" label="Telehealth"></hx-radio>
      <hx-radio value="phone" label="Phone Consultation"></hx-radio>
    </hx-radio-group>
  `,
};

// ─── Pre-Selected ───

export const PreSelected: Story = {
  args: {
    label: 'Insurance Type',
    value: 'private',
  },
  render: (args) => html`
    <hx-radio-group
      label=${args.label}
      value=${args.value}
      name="insurance"
      @wc-change=${(e: CustomEvent) => console.log('hx-change:', e.detail)}
    >
      <hx-radio value="medicare" label="Medicare"></hx-radio>
      <hx-radio value="medicaid" label="Medicaid"></hx-radio>
      <hx-radio value="private" label="Private Insurance"></hx-radio>
      <hx-radio value="none" label="Uninsured"></hx-radio>
    </hx-radio-group>
  `,
};

// ─── All Orientations ───

export const AllOrientations: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <hx-radio-group
        label="Vertical (Default)"
        orientation="vertical"
        name="vert"
      >
        <hx-radio value="a" label="Option A"></hx-radio>
        <hx-radio value="b" label="Option B"></hx-radio>
        <hx-radio value="c" label="Option C"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="Horizontal"
        orientation="horizontal"
        name="horiz"
      >
        <hx-radio value="a" label="Option A"></hx-radio>
        <hx-radio value="b" label="Option B"></hx-radio>
        <hx-radio value="c" label="Option C"></hx-radio>
      </hx-radio-group>
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
      <hx-radio-group
        label="Department"
        name="department"
        required
        help-text="Select your department for routing."
      >
        <hx-radio value="cardiology" label="Cardiology"></hx-radio>
        <hx-radio value="neurology" label="Neurology"></hx-radio>
        <hx-radio value="orthopedics" label="Orthopedics"></hx-radio>
        <hx-radio value="primary-care" label="Primary Care"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="Urgency"
        name="urgency"
        required
        orientation="horizontal"
      >
        <hx-radio value="routine" label="Routine"></hx-radio>
        <hx-radio value="urgent" label="Urgent"></hx-radio>
        <hx-radio value="emergency" label="Emergency"></hx-radio>
      </hx-radio-group>

      <hx-button type="submit">Submit Referral</hx-button>
    </form>
  `,
};
