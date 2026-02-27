import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-radio-group.js';
import './hx-radio.js';

// Composition imports
import '../hx-button/hx-button.js';
import '../hx-text-input/hx-text-input.js';
import '../hx-card/hx-card.js';
import '../hx-checkbox/hx-checkbox.js';

// ─────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Radio Group',
  component: 'hx-radio-group',
  subcomponents: { 'hx-radio': 'hx-radio' },
  tags: ['autodocs'],
  argTypes: {
    // ── Properties ──
    label: {
      control: 'text',
      description: 'The fieldset legend/label text.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The selected radio value.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'The name used for form submission.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether a selection is required for form submission.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the entire group is disabled.',
      table: {
        category: 'Properties',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display. When set, the group enters an error state.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the group for guidance.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Layout orientation of the radio items.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'vertical'" },
        type: { summary: "'vertical' | 'horizontal'" },
      },
    },
    // ── Events ──
    'hx-change': {
      action: 'hx-change',
      description: 'Dispatched when the selected radio changes. Detail: `{ value: string }`.',
      table: {
        category: 'Events',
        type: { summary: 'CustomEvent<{ value: string }>' },
      },
    },
    // ── Slots ──
    defaultSlot: {
      name: '',
      description: '`<hx-radio>` elements.',
      table: {
        category: 'Slots',
        type: { summary: 'hx-radio' },
      },
      control: false,
    },
    errorSlot: {
      name: 'error',
      description: 'Custom error content (overrides the error property).',
      table: {
        category: 'Slots',
        type: { summary: 'HTMLElement' },
      },
      control: false,
    },
    helpTextSlot: {
      name: 'help-text',
      description: 'Custom help text content (overrides the helpText property).',
      table: {
        category: 'Slots',
        type: { summary: 'HTMLElement' },
      },
      control: false,
    },
    // ── CSS Custom Properties ──
    '--hx-radio-group-gap': {
      description: 'Gap between radio items.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-space-3, 0.75rem)' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-radio-group-label-color': {
      description: 'Label text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-700, #343a40)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-radio-group-error-color': {
      description: 'Error message color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-error-500, #dc3545)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    // ── CSS Parts ──
    fieldset: {
      description: 'The fieldset wrapper.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(fieldset)' },
      },
      control: false,
    },
    legend: {
      description: 'The legend/label.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(legend)' },
      },
      control: false,
    },
    group: {
      description: 'The container for radio items.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(group)' },
      },
      control: false,
    },
    errorPart: {
      description: 'The error message.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(error)' },
      },
      control: false,
    },
    helpTextPart: {
      description: 'The help text.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(help-text)' },
      },
      control: false,
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
    >
      <hx-radio value="option-1" label="Option 1"></hx-radio>
      <hx-radio value="option-2" label="Option 2"></hx-radio>
      <hx-radio value="option-3" label="Option 3"></hx-radio>
    </hx-radio-group>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
//  1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Preferred Contact Method',
    helpText: 'Choose how you would like us to reach you.',
  },
  render: (args) => html`
    <hx-radio-group label=${args.label} help-text=${args.helpText} name="contact">
      <hx-radio value="email" label="Email"></hx-radio>
      <hx-radio value="phone" label="Phone"></hx-radio>
      <hx-radio value="mail" label="Mail"></hx-radio>
      <hx-radio value="patient-portal" label="Patient Portal"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('hx-radio');
    expect(radios.length).toBe(4);

    // Select "Phone" and verify
    const phoneRadio = canvasElement.querySelector('hx-radio[value="phone"]');
    expect(phoneRadio).toBeTruthy();
    await userEvent.click(phoneRadio!);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.getAttribute('value') === 'phone' || group!.value === 'phone').toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
//  2. ORIENTATIONS
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: {
    label: 'Appointment Type',
    orientation: 'vertical',
    helpText: 'Vertical layout is the default orientation.',
  },
  render: (args) => html`
    <hx-radio-group
      label=${args.label}
      orientation=${args.orientation}
      help-text=${args.helpText}
      name="appt-type"
    >
      <hx-radio value="in-person" label="In-Person Visit"></hx-radio>
      <hx-radio value="telehealth" label="Telehealth"></hx-radio>
      <hx-radio value="phone" label="Phone Consultation"></hx-radio>
    </hx-radio-group>
  `,
};

export const Horizontal: Story = {
  args: {
    label: 'Visit Urgency',
    orientation: 'horizontal',
  },
  render: (args) => html`
    <hx-radio-group label=${args.label} orientation=${args.orientation} name="urgency">
      <hx-radio value="routine" label="Routine"></hx-radio>
      <hx-radio value="urgent" label="Urgent"></hx-radio>
      <hx-radio value="emergency" label="Emergency"></hx-radio>
    </hx-radio-group>
  `,
};

// ─────────────────────────────────────────────────
//  3. EVERY STATE
// ─────────────────────────────────────────────────

export const PreSelected: Story = {
  args: {
    label: 'Primary Language',
    value: 'english',
  },
  render: (args) => html`
    <hx-radio-group label=${args.label} value=${args.value} name="language">
      <hx-radio value="english" label="English"></hx-radio>
      <hx-radio value="spanish" label="Spanish"></hx-radio>
      <hx-radio value="mandarin" label="Mandarin"></hx-radio>
      <hx-radio value="other" label="Other"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const englishRadio = canvasElement.querySelector('hx-radio[value="english"]');
    expect(englishRadio).toBeTruthy();
    expect(englishRadio!.getAttribute('aria-checked')).toBe('true');
  },
};

export const Required: Story = {
  args: {
    label: 'Appointment Type',
    required: true,
    helpText: 'Required. Please select how you would like to be seen.',
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
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const legend = group!.shadowRoot!.querySelector('.fieldset__legend');
    expect(legend).toBeTruthy();
    const marker = legend!.querySelector('.fieldset__required-marker');
    expect(marker).toBeTruthy();
    expect(marker!.textContent).toBe('*');
  },
};

export const WithError: Story = {
  args: {
    label: 'Blood Type',
    error: 'Please select your blood type for medical records.',
    required: true,
  },
  render: (args) => html`
    <hx-radio-group
      label=${args.label}
      error=${args.error}
      ?required=${args.required}
      name="blood-type"
    >
      <hx-radio value="a-pos" label="A+"></hx-radio>
      <hx-radio value="a-neg" label="A-"></hx-radio>
      <hx-radio value="b-pos" label="B+"></hx-radio>
      <hx-radio value="b-neg" label="B-"></hx-radio>
      <hx-radio value="o-pos" label="O+"></hx-radio>
      <hx-radio value="o-neg" label="O-"></hx-radio>
      <hx-radio value="ab-pos" label="AB+"></hx-radio>
      <hx-radio value="ab-neg" label="AB-"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const errorEl = group!.shadowRoot!.querySelector('.fieldset__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl!.textContent!.trim()).toBe('Please select your blood type for medical records.');
    expect(errorEl!.getAttribute('role')).toBe('alert');
  },
};

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
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    expect(group!.hasAttribute('disabled')).toBeTruthy();
  },
};

export const SingleDisabledOption: Story = {
  args: {
    label: 'Scheduling Preference',
  },
  render: (args) => html`
    <hx-radio-group
      label=${args.label}
      name="scheduling"
      help-text="Weekend appointments are currently unavailable."
    >
      <hx-radio value="weekday-morning" label="Weekday Morning (8am - 12pm)"></hx-radio>
      <hx-radio value="weekday-afternoon" label="Weekday Afternoon (12pm - 5pm)"></hx-radio>
      <hx-radio value="weekday-evening" label="Weekday Evening (5pm - 8pm)"></hx-radio>
      <hx-radio value="weekend" label="Weekend" disabled></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const disabledRadio = canvasElement.querySelector('hx-radio[value="weekend"]');
    expect(disabledRadio).toBeTruthy();
    expect(disabledRadio!.hasAttribute('disabled')).toBeTruthy();

    // Enabled radios should still be clickable
    const morningRadio = canvasElement.querySelector('hx-radio[value="weekday-morning"]');
    expect(morningRadio).toBeTruthy();
    await userEvent.click(morningRadio!);
    await new Promise((r) => setTimeout(r, 50));
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group!.value).toBe('weekday-morning');
  },
};

// ─────────────────────────────────────────────────
//  4. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllOrientations: Story = {
  render: () => html`
    <div style="display: flex; gap: 3rem; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 250px;">
        <hx-radio-group label="Vertical (Default)" orientation="vertical" name="vert-demo">
          <hx-radio value="cardiology" label="Cardiology"></hx-radio>
          <hx-radio value="neurology" label="Neurology"></hx-radio>
          <hx-radio value="orthopedics" label="Orthopedics"></hx-radio>
        </hx-radio-group>
      </div>
      <div style="flex: 1; min-width: 250px;">
        <hx-radio-group label="Horizontal" orientation="horizontal" name="horiz-demo">
          <hx-radio value="cardiology" label="Cardiology"></hx-radio>
          <hx-radio value="neurology" label="Neurology"></hx-radio>
          <hx-radio value="orthopedics" label="Orthopedics"></hx-radio>
        </hx-radio-group>
      </div>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <hx-radio-group label="Default (no selection)" name="state-default">
        <hx-radio value="a" label="Option A"></hx-radio>
        <hx-radio value="b" label="Option B"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Pre-selected" value="telehealth" name="state-preselected">
        <hx-radio value="in-person" label="In-Person"></hx-radio>
        <hx-radio value="telehealth" label="Telehealth"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="Required"
        required
        help-text="A selection is required."
        name="state-required"
      >
        <hx-radio value="yes" label="Yes"></hx-radio>
        <hx-radio value="no" label="No"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="With Error"
        error="This field is required."
        required
        name="state-error"
      >
        <hx-radio value="a" label="Option A"></hx-radio>
        <hx-radio value="b" label="Option B"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="Disabled (with selection)"
        disabled
        value="email"
        name="state-disabled"
      >
        <hx-radio value="email" label="Email"></hx-radio>
        <hx-radio value="phone" label="Phone"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Single Disabled Option" name="state-single-disabled">
        <hx-radio value="available" label="Available Slot"></hx-radio>
        <hx-radio value="unavailable" label="Unavailable Slot" disabled></hx-radio>
        <hx-radio value="waitlist" label="Waitlist"></hx-radio>
      </hx-radio-group>

      <hx-radio-group
        label="With Help Text"
        help-text="Additional guidance for the clinician."
        name="state-help"
      >
        <hx-radio value="low" label="Low Priority"></hx-radio>
        <hx-radio value="medium" label="Medium Priority"></hx-radio>
        <hx-radio value="high" label="High Priority"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Horizontal" orientation="horizontal" name="state-horizontal">
        <hx-radio value="yes" label="Yes"></hx-radio>
        <hx-radio value="no" label="No"></hx-radio>
        <hx-radio value="unsure" label="Unsure"></hx-radio>
      </hx-radio-group>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  5. COMPOSITION
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const handleSubmit = fn();
    return html`
      <form
        @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          handleSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 420px;"
      >
        <hx-radio-group
          label="Department"
          name="department"
          required
          help-text="Select the department for this referral."
        >
          <hx-radio value="cardiology" label="Cardiology"></hx-radio>
          <hx-radio value="neurology" label="Neurology"></hx-radio>
          <hx-radio value="orthopedics" label="Orthopedics"></hx-radio>
          <hx-radio value="primary-care" label="Primary Care"></hx-radio>
        </hx-radio-group>

        <hx-radio-group label="Visit Urgency" name="urgency" required orientation="horizontal">
          <hx-radio value="routine" label="Routine"></hx-radio>
          <hx-radio value="urgent" label="Urgent"></hx-radio>
          <hx-radio value="emergency" label="Emergency"></hx-radio>
        </hx-radio-group>

        <hx-button type="submit">Submit Referral</hx-button>
      </form>
    `;
  },
};

export const MultipleGroups: Story = {
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <hx-radio-group label="Insurance Provider" name="insurance" required>
        <hx-radio value="medicare" label="Medicare"></hx-radio>
        <hx-radio value="medicaid" label="Medicaid"></hx-radio>
        <hx-radio value="private" label="Private Insurance"></hx-radio>
        <hx-radio value="va" label="VA Benefits"></hx-radio>
        <hx-radio value="uninsured" label="Uninsured / Self-Pay"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Preferred Pharmacy" name="pharmacy" required>
        <hx-radio value="onsite" label="On-site Pharmacy"></hx-radio>
        <hx-radio value="mail-order" label="Mail-Order Pharmacy"></hx-radio>
        <hx-radio value="retail" label="Retail Pharmacy (CVS, Walgreens, etc.)"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Communication Preference" name="comm-pref" orientation="horizontal">
        <hx-radio value="email" label="Email"></hx-radio>
        <hx-radio value="phone" label="Phone"></hx-radio>
        <hx-radio value="portal" label="Patient Portal"></hx-radio>
      </hx-radio-group>

      <hx-button type="submit">Save Preferences</hx-button>
    </form>
  `,
};

export const WithOtherFields: Story = {
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <hx-text-input
        label="Patient Name"
        name="patient-name"
        required
        placeholder="Enter full legal name"
      ></hx-text-input>

      <hx-text-input label="Date of Birth" name="dob" type="date" required></hx-text-input>

      <hx-radio-group label="Sex Assigned at Birth" name="sex" required>
        <hx-radio value="male" label="Male"></hx-radio>
        <hx-radio value="female" label="Female"></hx-radio>
        <hx-radio value="intersex" label="Intersex"></hx-radio>
        <hx-radio value="prefer-not-to-say" label="Prefer not to say"></hx-radio>
      </hx-radio-group>

      <hx-radio-group label="Visit Type" name="visit-type" orientation="horizontal" required>
        <hx-radio value="new-patient" label="New Patient"></hx-radio>
        <hx-radio value="returning" label="Returning Patient"></hx-radio>
      </hx-radio-group>

      <hx-checkbox
        label="I confirm the above information is accurate"
        name="confirm"
        required
      ></hx-checkbox>

      <hx-button type="submit">Register Patient</hx-button>
    </form>
  `,
};

export const InACard: Story = {
  render: () => html`
    <hx-card>
      <div slot="header" style="font-weight: 600; font-size: 1.125rem;">Consent for Treatment</div>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <p
          style="margin: 0; color: var(--hx-color-neutral-600, #495057); font-size: 0.875rem; line-height: 1.6;"
        >
          Please review and acknowledge the following consent options before your appointment. Your
          responses will be recorded in your electronic health record.
        </p>

        <hx-radio-group label="Consent to Treat" name="consent-treat" required>
          <hx-radio value="consent" label="I consent to treatment"></hx-radio>
          <hx-radio value="decline" label="I decline treatment"></hx-radio>
          <hx-radio value="defer" label="I wish to defer to a legal representative"></hx-radio>
        </hx-radio-group>

        <hx-radio-group
          label="Research Participation"
          name="research"
          help-text="Participation is voluntary and will not affect your care."
        >
          <hx-radio value="opt-in" label="I agree to participate in clinical research"></hx-radio>
          <hx-radio value="opt-out" label="I do not wish to participate"></hx-radio>
        </hx-radio-group>

        <hx-button type="submit" style="align-self: flex-start;">Submit Consent</hx-button>
      </div>
    </hx-card>
  `,
};

// ─────────────────────────────────────────────────
//  6. EDGE CASES
// ─────────────────────────────────────────────────

export const ManyOptions: Story = {
  render: () => html`
    <hx-radio-group label="Primary Diagnosis (ICD-10 Category)" name="diagnosis" required>
      <hx-radio value="circulatory" label="Diseases of the circulatory system (I00-I99)"></hx-radio>
      <hx-radio value="respiratory" label="Diseases of the respiratory system (J00-J99)"></hx-radio>
      <hx-radio value="digestive" label="Diseases of the digestive system (K00-K95)"></hx-radio>
      <hx-radio
        value="musculoskeletal"
        label="Diseases of the musculoskeletal system (M00-M99)"
      ></hx-radio>
      <hx-radio value="nervous" label="Diseases of the nervous system (G00-G99)"></hx-radio>
      <hx-radio
        value="endocrine"
        label="Endocrine, nutritional, and metabolic diseases (E00-E89)"
      ></hx-radio>
      <hx-radio value="mental" label="Mental and behavioral disorders (F01-F99)"></hx-radio>
      <hx-radio value="neoplasms" label="Neoplasms (C00-D49)"></hx-radio>
      <hx-radio
        value="genitourinary"
        label="Diseases of the genitourinary system (N00-N99)"
      ></hx-radio>
      <hx-radio
        value="skin"
        label="Diseases of the skin and subcutaneous tissue (L00-L99)"
      ></hx-radio>
      <hx-radio
        value="infectious"
        label="Certain infectious and parasitic diseases (A00-B99)"
      ></hx-radio>
      <hx-radio value="injury" label="Injury, poisoning, and external causes (S00-T88)"></hx-radio>
    </hx-radio-group>
  `,
};

export const LongLabels: Story = {
  render: () => html`
    <hx-radio-group
      label="Advance Directive Preference"
      name="advance-directive"
      required
      help-text="Please indicate your advance directive preference. This will be documented in your medical record."
      style="max-width: 600px;"
    >
      <hx-radio
        value="full-code"
        label="Full Code: I want all life-sustaining treatments and interventions to be attempted, including CPR, mechanical ventilation, and defibrillation."
      ></hx-radio>
      <hx-radio
        value="dnr"
        label="Do Not Resuscitate (DNR): I do not want cardiopulmonary resuscitation (CPR) if my heart stops beating or if I stop breathing, but I want all other life-sustaining treatments."
      ></hx-radio>
      <hx-radio
        value="limited"
        label="Limited Interventions: I want treatments that maintain comfort and quality of life, including antibiotics and IV fluids, but I do not want mechanical ventilation or ICU admission."
      ></hx-radio>
      <hx-radio
        value="comfort-only"
        label="Comfort Measures Only: I want only treatments that ensure comfort and dignity. I do not want any life-prolonging treatments including IV fluids, antibiotics, or hospital transfer."
      ></hx-radio>
    </hx-radio-group>
  `,
};

export const SingleOption: Story = {
  render: () => html`
    <hx-radio-group
      label="Emergency Contact Consent"
      name="emergency-consent"
      required
      help-text="Your emergency contact will be notified in the event of a medical emergency."
    >
      <hx-radio
        value="acknowledged"
        label="I acknowledge and consent to emergency contact notification"
      ></hx-radio>
    </hx-radio-group>
  `,
};

export const TwoOptions: Story = {
  args: {
    label: 'Do you have a primary care physician?',
    orientation: 'horizontal',
  },
  render: (args) => html`
    <hx-radio-group label=${args.label} orientation=${args.orientation} name="has-pcp" required>
      <hx-radio value="yes" label="Yes"></hx-radio>
      <hx-radio value="no" label="No"></hx-radio>
    </hx-radio-group>
  `,
};

// ─────────────────────────────────────────────────
//  7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 3rem;">
      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio-group CSS Custom Properties
        </h3>
        <hx-radio-group
          label="Custom Gap and Label Color"
          name="css-group"
          help-text="--hx-radio-group-gap: 1.5rem, --hx-radio-group-label-color: #6366f1"
          style="
            --hx-radio-group-gap: 1.5rem;
            --hx-radio-group-label-color: #6366f1;
          "
        >
          <hx-radio value="a" label="Option A"></hx-radio>
          <hx-radio value="b" label="Option B"></hx-radio>
          <hx-radio value="c" label="Option C"></hx-radio>
        </hx-radio-group>
      </div>

      <div>
        <hx-radio-group
          label="Custom Error Color"
          name="css-error"
          error="Custom error color applied via --hx-radio-group-error-color"
          required
          style="
            --hx-radio-group-error-color: #ea580c;
          "
        >
          <hx-radio value="a" label="Option A"></hx-radio>
          <hx-radio value="b" label="Option B"></hx-radio>
        </hx-radio-group>
      </div>

      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio CSS Custom Properties
        </h3>
        <hx-radio-group
          label="Custom Radio Appearance"
          name="css-radio"
          value="b"
          style="
            --hx-radio-size: 1.5rem;
            --hx-radio-border-color: #9ca3af;
            --hx-radio-checked-bg: #059669;
            --hx-radio-checked-border-color: #059669;
            --hx-radio-dot-color: #ffffff;
            --hx-radio-focus-ring-color: #059669;
            --hx-radio-label-color: #1f2937;
          "
        >
          <hx-radio value="a" label="Larger radio with green theme"></hx-radio>
          <hx-radio value="b" label="Custom checked background"></hx-radio>
          <hx-radio value="c" label="Custom border and dot colors"></hx-radio>
        </hx-radio-group>
      </div>

      <div>
        <hx-radio-group
          label="Compact Variant"
          name="css-compact"
          orientation="horizontal"
          style="
            --hx-radio-group-gap: 0.25rem;
            --hx-radio-size: 0.875rem;
            --hx-radio-label-color: #6b7280;
          "
        >
          <hx-radio value="xs" label="XS"></hx-radio>
          <hx-radio value="sm" label="SM"></hx-radio>
          <hx-radio value="md" label="MD"></hx-radio>
          <hx-radio value="lg" label="LG"></hx-radio>
          <hx-radio value="xl" label="XL"></hx-radio>
        </hx-radio-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  8. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-radio-group::part(fieldset) {
        border: 2px dashed #6366f1;
        border-radius: 8px;
        padding: 1.5rem;
      }
      .parts-demo hx-radio-group::part(legend) {
        font-size: 1rem;
        font-weight: 700;
        color: #6366f1;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .parts-demo hx-radio-group::part(group) {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 6px;
      }
      .parts-demo-error hx-radio-group::part(error) {
        font-weight: 700;
        font-size: 0.875rem;
        padding: 0.5rem;
        background: #fef2f2;
        border-radius: 4px;
      }
      .parts-demo-help hx-radio-group::part(help-text) {
        font-style: italic;
        color: #6366f1;
        border-left: 3px solid #6366f1;
        padding-left: 0.75rem;
      }
      .parts-radio-demo hx-radio::part(radio) {
        border-width: 3px;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
      }
      .parts-radio-demo hx-radio::part(label) {
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 3px;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 2.5rem;">
      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio-group: ::part(fieldset), ::part(legend), ::part(group)
        </h3>
        <div class="parts-demo">
          <hx-radio-group label="Styled via CSS Parts" name="parts-basic">
            <hx-radio value="a" label="Option A"></hx-radio>
            <hx-radio value="b" label="Option B"></hx-radio>
            <hx-radio value="c" label="Option C"></hx-radio>
          </hx-radio-group>
        </div>
      </div>

      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio-group: ::part(error)
        </h3>
        <div class="parts-demo-error">
          <hx-radio-group
            label="Error Part Styling"
            name="parts-error"
            error="This error message is styled via ::part(error)"
            required
          >
            <hx-radio value="a" label="Option A"></hx-radio>
            <hx-radio value="b" label="Option B"></hx-radio>
          </hx-radio-group>
        </div>
      </div>

      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio-group: ::part(help-text)
        </h3>
        <div class="parts-demo-help">
          <hx-radio-group
            label="Help Text Part Styling"
            name="parts-help"
            help-text="This help text is styled via ::part(help-text)"
          >
            <hx-radio value="a" label="Option A"></hx-radio>
            <hx-radio value="b" label="Option B"></hx-radio>
          </hx-radio-group>
        </div>
      </div>

      <div>
        <h3 style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
          hx-radio: ::part(radio), ::part(label)
        </h3>
        <div class="parts-radio-demo">
          <hx-radio-group label="Radio Button Part Styling" name="parts-radio" value="b">
            <hx-radio value="a" label="Styled Radio Control"></hx-radio>
            <hx-radio value="b" label="Styled Radio Label (checked)"></hx-radio>
            <hx-radio value="c" label="Custom border and shadow"></hx-radio>
          </hx-radio-group>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickSelection: Story = {
  render: () => {
    const onChange = fn();
    return html`
      <hx-radio-group
        label="Select a department"
        name="click-test"
        @hx-change=${(e: CustomEvent) => onChange(e.detail)}
      >
        <hx-radio value="cardiology" label="Cardiology"></hx-radio>
        <hx-radio value="neurology" label="Neurology"></hx-radio>
        <hx-radio value="orthopedics" label="Orthopedics"></hx-radio>
      </hx-radio-group>
    `;
  },
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();

    // Initially no value selected
    expect(group!.value).toBe('');

    // Set up event listener before clicking
    let changeEventFired = false;
    let changeDetail: Record<string, string> = {};
    group!.addEventListener('hx-change', ((e: CustomEvent) => {
      changeEventFired = true;
      changeDetail = e.detail;
    }) as EventListener);

    // Click "Neurology"
    const neurologyRadio = canvasElement.querySelector('hx-radio[value="neurology"]');
    expect(neurologyRadio).toBeTruthy();
    await userEvent.click(neurologyRadio!);
    await new Promise((r) => setTimeout(r, 50));

    // Verify value changed
    expect(group!.value).toBe('neurology');

    // Verify event fired with correct detail
    expect(changeEventFired).toBeTruthy();
    expect(changeDetail.value).toBe('neurology');

    // Verify the radio is checked
    expect(neurologyRadio!.getAttribute('aria-checked')).toBe('true');

    // Click a different radio
    changeEventFired = false;
    const cardioRadio = canvasElement.querySelector('hx-radio[value="cardiology"]');
    await userEvent.click(cardioRadio!);
    await new Promise((r) => setTimeout(r, 50));

    expect(group!.value).toBe('cardiology');
    expect(changeEventFired).toBeTruthy();

    // Previous radio should be unchecked
    expect(neurologyRadio!.getAttribute('aria-checked')).toBe('false');
    expect(cardioRadio!.getAttribute('aria-checked')).toBe('true');
  },
};

export const KeyboardNavigation: Story = {
  render: () => html`
    <hx-radio-group label="Keyboard Navigation Test" name="keyboard-test">
      <hx-radio value="first" label="First Option"></hx-radio>
      <hx-radio value="second" label="Second Option"></hx-radio>
      <hx-radio value="third" label="Third Option"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();

    const radios = canvasElement.querySelectorAll('hx-radio');
    expect(radios.length).toBe(3);

    // First enabled radio should have tabindex 0 (roving tabindex)
    await new Promise((r) => setTimeout(r, 50));
    expect(radios[0].tabIndex).toBe(0);

    // Focus the first radio
    radios[0].focus();
    await new Promise((r) => setTimeout(r, 50));

    // Arrow Down should move to next and select it
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('second');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');

    // Arrow Down again
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('third');
    expect(radios[2].getAttribute('aria-checked')).toBe('true');

    // Arrow Up should move back
    await userEvent.keyboard('{ArrowUp}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('second');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  },
};

export const ArrowWrap: Story = {
  render: () => html`
    <hx-radio-group label="Arrow Key Wrapping Test" name="wrap-test">
      <hx-radio value="alpha" label="Alpha"></hx-radio>
      <hx-radio value="beta" label="Beta"></hx-radio>
      <hx-radio value="gamma" label="Gamma"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();

    const radios = canvasElement.querySelectorAll('hx-radio');
    await new Promise((r) => setTimeout(r, 50));

    // Focus the first radio and select it
    radios[0].focus();
    await userEvent.click(radios[0]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('alpha');

    // Navigate to last
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 50));
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('gamma');

    // Arrow Down from last should wrap to first
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('alpha');

    // Arrow Up from first should wrap to last
    await userEvent.keyboard('{ArrowUp}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('gamma');
  },
};

export const DisabledSkip: Story = {
  render: () => html`
    <hx-radio-group label="Disabled Option Skip Test" name="disabled-skip-test">
      <hx-radio value="first" label="First (enabled)"></hx-radio>
      <hx-radio value="second" label="Second (disabled)" disabled></hx-radio>
      <hx-radio value="third" label="Third (enabled)"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();

    const radios = canvasElement.querySelectorAll('hx-radio');
    await new Promise((r) => setTimeout(r, 50));

    // Focus first radio and select
    radios[0].focus();
    await userEvent.click(radios[0]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('first');

    // Arrow Down should skip disabled "second" and land on "third"
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('third');

    // Arrow Down from "third" should wrap and skip disabled, landing on "first"
    await userEvent.keyboard('{ArrowDown}');
    await new Promise((r) => setTimeout(r, 100));
    expect(group!.value).toBe('first');
  },
};

// ─────────────────────────────────────────────────
//  10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const InsuranceType: Story = {
  render: () => html`
    <hx-radio-group
      label="Insurance Type"
      name="insurance-type"
      required
      help-text="Select the patient's primary insurance coverage. This determines billing and referral pathways."
    >
      <hx-radio value="medicare" label="Medicare"></hx-radio>
      <hx-radio value="medicaid" label="Medicaid"></hx-radio>
      <hx-radio value="private" label="Private / Employer-Sponsored"></hx-radio>
      <hx-radio value="va" label="VA / TRICARE (Military)"></hx-radio>
      <hx-radio value="uninsured" label="Uninsured / Self-Pay"></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('hx-radio');
    expect(radios.length).toBe(5);

    // Select Medicare
    await userEvent.click(radios[0]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('medicare');
  },
};

export const PainScale: Story = {
  render: () => html`
    <hx-radio-group
      label="Current Pain Level"
      name="pain-scale"
      required
      orientation="horizontal"
      help-text="Select the number that best describes your current pain intensity."
      style="--hx-radio-group-gap: 0.5rem;"
    >
      <hx-radio value="0" label="0"></hx-radio>
      <hx-radio value="1" label="1"></hx-radio>
      <hx-radio value="2" label="2"></hx-radio>
      <hx-radio value="3" label="3"></hx-radio>
      <hx-radio value="4" label="4"></hx-radio>
      <hx-radio value="5" label="5"></hx-radio>
      <hx-radio value="6" label="6"></hx-radio>
      <hx-radio value="7" label="7"></hx-radio>
      <hx-radio value="8" label="8"></hx-radio>
      <hx-radio value="9" label="9"></hx-radio>
      <hx-radio value="10" label="10"></hx-radio>
    </hx-radio-group>
    <div
      style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);"
    >
      <span>No Pain</span>
      <span>Worst Possible Pain</span>
    </div>
  `,
};

export const TriageLevel: Story = {
  render: () => html`
    <hx-radio-group
      label="Emergency Triage Level (ESI)"
      name="triage-level"
      required
      help-text="Emergency Severity Index. Level 1 is most urgent."
      style="max-width: 600px;"
    >
      <hx-radio
        value="1"
        label="ESI Level 1 - Resuscitation: Immediate life-threatening condition requiring aggressive intervention"
      ></hx-radio>
      <hx-radio
        value="2"
        label="ESI Level 2 - Emergent: High-risk situation, confused/lethargic, severe pain, or distress"
      ></hx-radio>
      <hx-radio
        value="3"
        label="ESI Level 3 - Urgent: Requires two or more resources (labs, imaging, IV fluids, etc.)"
      ></hx-radio>
      <hx-radio
        value="4"
        label="ESI Level 4 - Less Urgent: Requires one resource (X-ray, blood test, or prescription)"
      ></hx-radio>
      <hx-radio
        value="5"
        label="ESI Level 5 - Non-Urgent: No resources required, simple exam or reassessment only"
      ></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('hx-radio');
    expect(radios.length).toBe(5);

    // Select ESI Level 3
    await userEvent.click(radios[2]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('3');
  },
};

export const TreatmentPreference: Story = {
  render: () => html`
    <hx-radio-group
      label="Preferred Treatment Approach"
      name="treatment-pref"
      required
      help-text="Discuss options with your physician. This preference will be noted in your care plan."
      style="max-width: 600px;"
    >
      <hx-radio
        value="conservative"
        label="Conservative Management: Physical therapy, lifestyle modifications, and medication management before considering surgical options"
      ></hx-radio>
      <hx-radio
        value="moderate"
        label="Moderate Intervention: Targeted procedures such as injections, minor outpatient procedures, or combination therapy"
      ></hx-radio>
      <hx-radio
        value="aggressive"
        label="Aggressive Treatment: Surgical intervention or advanced procedures as soon as clinically appropriate"
      ></hx-radio>
      <hx-radio
        value="palliative"
        label="Palliative / Comfort-Focused: Treatment focused on symptom management, quality of life, and comfort rather than curative intent"
      ></hx-radio>
      <hx-radio
        value="undecided"
        label="Undecided: I would like more information and time to discuss options with my care team before making a decision"
      ></hx-radio>
    </hx-radio-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('hx-radio-group');
    expect(group).toBeTruthy();
    const radios = canvasElement.querySelectorAll('hx-radio');
    expect(radios.length).toBe(5);

    // A patient selects palliative care
    await userEvent.click(radios[3]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('palliative');

    // Patient changes mind to undecided
    await userEvent.click(radios[4]);
    await new Promise((r) => setTimeout(r, 50));
    expect(group!.value).toBe('undecided');
  },
};

// ─────────────────────────────────────────────────
// THEME COMPARISON — Light and Dark side by side
// ─────────────────────────────────────────────────

export const ThemeComparison: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
  render: () => html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 200px;">
      <div
        data-theme="light"
        style="padding: 2rem; background: #ffffff; display: flex; flex-direction: column; gap: 1.5rem;"
      >
        <p style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">
          Light Theme
        </p>
        <hx-radio-group label="Appointment Type" name="appt-light">
          <hx-radio value="in-person" label="In-Person Visit" checked></hx-radio>
          <hx-radio value="telehealth" label="Telehealth"></hx-radio>
          <hx-radio value="phone" label="Phone Consultation"></hx-radio>
        </hx-radio-group>
        <hx-radio-group label="Discharge Status" name="discharge-light" disabled>
          <hx-radio value="ready" label="Ready for Discharge"></hx-radio>
          <hx-radio value="pending" label="Pending Clearance" checked></hx-radio>
        </hx-radio-group>
      </div>
      <div
        data-theme="dark"
        style="padding: 2rem; background: #1a1a2e; display: flex; flex-direction: column; gap: 1.5rem;"
      >
        <p style="margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">
          Dark Theme
        </p>
        <hx-radio-group label="Appointment Type" name="appt-dark">
          <hx-radio value="in-person" label="In-Person Visit" checked></hx-radio>
          <hx-radio value="telehealth" label="Telehealth"></hx-radio>
          <hx-radio value="phone" label="Phone Consultation"></hx-radio>
        </hx-radio-group>
        <hx-radio-group label="Discharge Status" name="discharge-dark" disabled>
          <hx-radio value="ready" label="Ready for Discharge"></hx-radio>
          <hx-radio value="pending" label="Pending Clearance" checked></hx-radio>
        </hx-radio-group>
      </div>
    </div>
  `,
};
