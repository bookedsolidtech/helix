import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-checkbox-group.js';
import '../hx-checkbox/hx-checkbox.js';

// ─────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Checkbox Group',
  component: 'hx-checkbox-group',
  subcomponents: { 'hx-checkbox': 'hx-checkbox' },
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
    name: {
      control: 'text',
      description: 'The name used for form submission. Passed to child `hx-checkbox` elements.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether at least one checkbox must be checked for form submission.',
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
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'Layout orientation of the checkbox items.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'vertical'" },
        type: { summary: "'vertical' | 'horizontal'" },
      },
    },
    // ── Events ──
    'hx-change': {
      action: 'hx-change',
      description: 'Dispatched when any child checkbox changes. Detail: `{ values: string[] }`.',
      table: {
        category: 'Events',
        type: { summary: 'CustomEvent<{ values: string[] }>' },
      },
    },
    // ── Slots ──
    defaultSlot: {
      name: '',
      description: '`<hx-checkbox>` elements.',
      table: {
        category: 'Slots',
        type: { summary: 'hx-checkbox' },
      },
      control: false,
    },
    labelSlot: {
      name: 'label',
      description: 'Rich HTML group label (overrides the label property when used).',
      table: {
        category: 'Slots',
        type: { summary: 'HTMLElement' },
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
    helpSlot: {
      name: 'help',
      description: 'Group-level help text.',
      table: {
        category: 'Slots',
        type: { summary: 'HTMLElement' },
      },
      control: false,
    },
    // ── CSS Custom Properties ──
    '--hx-checkbox-group-gap': {
      description: 'Gap between checkbox items.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-space-3, 0.75rem)' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-checkbox-group-label-color': {
      description: 'Label text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-700, #343a40)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-checkbox-group-error-color': {
      description: 'Error message color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-error-500, #dc3545)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    // ── CSS Parts ──
    group: {
      description: 'The fieldset wrapper.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(group)' },
      },
      control: false,
    },
    labelPart: {
      description: 'The legend/label.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(label)' },
      },
      control: false,
    },
    'help-text': {
      description: 'The help text container.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(help-text)' },
      },
      control: false,
    },
    'error-message': {
      description: 'The error message container.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(error-message)' },
      },
      control: false,
    },
  },
  args: {
    label: 'Select all that apply',
    name: 'demo',
    required: false,
    disabled: false,
    error: '',
    orientation: 'vertical',
  },
  render: (args) => html`
    <hx-checkbox-group
      label=${args.label}
      name=${args.name}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      orientation=${args.orientation}
    >
      <hx-checkbox value="option-1" label="Option 1"></hx-checkbox>
      <hx-checkbox value="option-2" label="Option 2"></hx-checkbox>
      <hx-checkbox value="option-3" label="Option 3"></hx-checkbox>
    </hx-checkbox-group>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────

/** Resolves after the next animation frame to allow Lit updates to flush. */
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

/** Queries the first hx-checkbox-group in the canvas and verifies it exists. */
function getGroup(canvasElement: HTMLElement): HTMLElement & {
  name: string;
  label: string;
  required: boolean;
  disabled: boolean;
  error: string;
  orientation: string;
  checkValidity: () => boolean;
} {
  const group = canvasElement.querySelector('hx-checkbox-group');
  if (!group) throw new Error('hx-checkbox-group not found in canvas');
  return group as HTMLElement & {
    name: string;
    label: string;
    required: boolean;
    disabled: boolean;
    error: string;
    orientation: string;
    checkValidity: () => boolean;
  };
}

/** Clicks the visual control inside an hx-checkbox shadow root. */
async function clickCheckbox(checkbox: Element): Promise<void> {
  const control = checkbox.shadowRoot?.querySelector('.checkbox__control');
  if (!control) throw new Error('.checkbox__control not found in hx-checkbox shadow root');
  await userEvent.click(control);
  await nextFrame();
}

// ─────────────────────────────────────────────────
//  1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Pre-Existing Conditions',
    name: 'conditions',
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} name=${args.name}>
      <hx-checkbox value="diabetes" label="Diabetes"></hx-checkbox>
      <hx-checkbox value="hypertension" label="Hypertension"></hx-checkbox>
      <hx-checkbox value="heart-disease" label="Heart Disease"></hx-checkbox>
      <hx-checkbox value="asthma" label="Asthma"></hx-checkbox>
      <hx-checkbox value="arthritis" label="Arthritis"></hx-checkbox>
    </hx-checkbox-group>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the group renders with label text
    await expect(canvas.getByText('Pre-Existing Conditions')).toBeTruthy();

    // Verify all checkboxes render
    const checkboxes = canvasElement.querySelectorAll('hx-checkbox');
    await expect(checkboxes.length).toBe(5);

    // Click "Diabetes" and verify it becomes checked
    const diabetesCheckbox = canvasElement.querySelector('hx-checkbox[value="diabetes"]');
    if (!diabetesCheckbox) throw new Error('Diabetes checkbox not found');
    await expect(diabetesCheckbox).toBeTruthy();
    await clickCheckbox(diabetesCheckbox);

    const diabetesHost = diabetesCheckbox as HTMLElement & { checked: boolean };
    await expect(diabetesHost.checked).toBe(true);

    // Click again to uncheck
    await clickCheckbox(diabetesCheckbox);
    await expect(diabetesHost.checked).toBe(false);
  },
};

// ─────────────────────────────────────────────────
//  2. ORIENTATIONS
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: {
    label: 'Current Symptoms',
    orientation: 'vertical',
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} orientation=${args.orientation} name="symptoms">
      <hx-checkbox value="fever" label="Fever"></hx-checkbox>
      <hx-checkbox value="cough" label="Cough"></hx-checkbox>
      <hx-checkbox value="shortness-of-breath" label="Shortness of Breath"></hx-checkbox>
    </hx-checkbox-group>
  `,
};

export const Horizontal: Story = {
  args: {
    label: 'Visit Type',
    orientation: 'horizontal',
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} orientation=${args.orientation} name="visit-type">
      <hx-checkbox value="in-person" label="In-Person"></hx-checkbox>
      <hx-checkbox value="telehealth" label="Telehealth"></hx-checkbox>
      <hx-checkbox value="phone" label="Phone"></hx-checkbox>
    </hx-checkbox-group>
  `,
};

// ─────────────────────────────────────────────────
//  3. EVERY STATE
// ─────────────────────────────────────────────────

export const Required: Story = {
  args: {
    label: 'Known Allergies',
    name: 'allergies',
    required: true,
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} name=${args.name} ?required=${args.required}>
      <hx-checkbox value="penicillin" label="Penicillin"></hx-checkbox>
      <hx-checkbox value="sulfa" label="Sulfa Drugs"></hx-checkbox>
      <hx-checkbox value="aspirin" label="Aspirin"></hx-checkbox>
      <hx-checkbox value="latex" label="Latex"></hx-checkbox>
      <hx-checkbox value="shellfish" label="Shellfish"></hx-checkbox>
    </hx-checkbox-group>
  `,
  play: async ({ canvasElement }) => {
    const group = getGroup(canvasElement);

    // Required and no items checked: invalid
    await expect(group.required).toBe(true);
    await expect(group.checkValidity()).toBe(false);

    // Check one item: group should become valid
    const penicillinCheckbox = canvasElement.querySelector('hx-checkbox[value="penicillin"]');
    if (!penicillinCheckbox) throw new Error('Penicillin checkbox not found');
    await clickCheckbox(penicillinCheckbox);

    await expect(group.checkValidity()).toBe(true);
  },
};

export const WithError: Story = {
  args: {
    label: 'Pre-Existing Conditions',
    name: 'conditions',
    required: true,
    error: 'Please select at least one pre-existing condition, or indicate none.',
  },
  render: (args) => html`
    <hx-checkbox-group
      label=${args.label}
      name=${args.name}
      ?required=${args.required}
      error=${args.error}
    >
      <hx-checkbox value="diabetes" label="Diabetes"></hx-checkbox>
      <hx-checkbox value="hypertension" label="Hypertension"></hx-checkbox>
      <hx-checkbox value="heart-disease" label="Heart Disease"></hx-checkbox>
      <hx-checkbox value="asthma" label="Asthma"></hx-checkbox>
      <hx-checkbox value="none" label="None of the above"></hx-checkbox>
    </hx-checkbox-group>
  `,
};

export const WithHelpText: Story = {
  args: {
    label: 'Insurance Coverage',
    name: 'coverage',
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} name=${args.name}>
      <hx-checkbox value="medical" label="Medical"></hx-checkbox>
      <hx-checkbox value="dental" label="Dental"></hx-checkbox>
      <hx-checkbox value="vision" label="Vision"></hx-checkbox>
      <hx-checkbox value="mental-health" label="Mental Health"></hx-checkbox>
      <span slot="help">
        Select all insurance plans that apply to this patient. Contact billing if unsure.
      </span>
    </hx-checkbox-group>
  `,
};

export const Disabled: Story = {
  args: {
    label: 'Treatment History',
    name: 'treatment-history',
    disabled: true,
  },
  render: (args) => html`
    <hx-checkbox-group label=${args.label} name=${args.name} ?disabled=${args.disabled}>
      <hx-checkbox value="chemotherapy" label="Chemotherapy" checked></hx-checkbox>
      <hx-checkbox value="radiation" label="Radiation Therapy"></hx-checkbox>
      <hx-checkbox value="surgery" label="Surgery" checked></hx-checkbox>
      <hx-checkbox value="immunotherapy" label="Immunotherapy"></hx-checkbox>
    </hx-checkbox-group>
  `,
  play: async ({ canvasElement }) => {
    const group = getGroup(canvasElement);
    await expect(group.disabled).toBe(true);

    // All child checkboxes should be disabled
    const checkboxes = canvasElement.querySelectorAll('hx-checkbox') as NodeListOf<
      HTMLElement & { disabled: boolean }
    >;
    for (const cb of Array.from(checkboxes)) {
      await expect(cb.disabled).toBe(true);
    }
  },
};

// ─────────────────────────────────────────────────
//  4. KITCHEN SINK
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2.5rem; max-width: 560px;">
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Default (vertical)
        </h4>
        <hx-checkbox-group label="Current Symptoms" name="symptoms-default">
          <hx-checkbox value="fever" label="Fever"></hx-checkbox>
          <hx-checkbox value="cough" label="Cough"></hx-checkbox>
          <hx-checkbox value="fatigue" label="Fatigue" checked></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Horizontal orientation
        </h4>
        <hx-checkbox-group label="Visit Type" name="visit-type-demo" orientation="horizontal">
          <hx-checkbox value="in-person" label="In-Person"></hx-checkbox>
          <hx-checkbox value="telehealth" label="Telehealth"></hx-checkbox>
          <hx-checkbox value="phone" label="Phone"></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Required with help text
        </h4>
        <hx-checkbox-group label="Known Allergies" name="allergies-demo" required>
          <hx-checkbox value="penicillin" label="Penicillin"></hx-checkbox>
          <hx-checkbox value="latex" label="Latex"></hx-checkbox>
          <hx-checkbox value="none" label="None of the above"></hx-checkbox>
          <span slot="help">At least one selection is required.</span>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Error state
        </h4>
        <hx-checkbox-group
          label="Pre-Existing Conditions"
          name="conditions-demo"
          required
          error="Please select at least one condition, or choose 'None of the above'."
        >
          <hx-checkbox value="diabetes" label="Diabetes"></hx-checkbox>
          <hx-checkbox value="hypertension" label="Hypertension"></hx-checkbox>
          <hx-checkbox value="none" label="None of the above"></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Disabled group
        </h4>
        <hx-checkbox-group label="Treatment History (Read-only)" name="treatment-demo" disabled>
          <hx-checkbox value="surgery" label="Surgery" checked></hx-checkbox>
          <hx-checkbox value="radiation" label="Radiation Therapy"></hx-checkbox>
          <hx-checkbox value="chemotherapy" label="Chemotherapy" checked></hx-checkbox>
        </hx-checkbox-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  5. DRUPAL EXAMPLE
// ─────────────────────────────────────────────────

/**
 * Demonstrates the Drupal taxonomy use case — rendering a checkbox group driven
 * by a list of taxonomy terms (healthcare conditions). In Drupal, this pattern
 * is used with Twig templates where each term is an `hx-checkbox` child.
 */
export const DrupalExample: Story = {
  render: () => {
    // Simulates taxonomy terms passed from Drupal Twig template context
    const conditions = [
      { tid: '101', label: 'Type 2 Diabetes' },
      { tid: '102', label: 'Hypertension' },
      { tid: '103', label: 'Coronary Artery Disease' },
      { tid: '104', label: 'Chronic Obstructive Pulmonary Disease (COPD)' },
      { tid: '105', label: 'Chronic Kidney Disease' },
      { tid: '106', label: 'None of the above' },
    ];

    return html`
      <div style="max-width: 560px;">
        <p
          style="margin: 0 0 1rem; font-size: 0.8125rem; color: var(--hx-color-neutral-500, #6c757d);"
        >
          Simulates Drupal Twig rendering: each taxonomy term maps to an
          <code>hx-checkbox</code> child element.
        </p>
        <hx-checkbox-group label="Chronic Conditions" name="field_chronic_conditions" required>
          ${conditions.map(
            (term) => html`
              <hx-checkbox
                value=${term.tid}
                label=${term.label}
                name="field_chronic_conditions"
              ></hx-checkbox>
            `,
          )}
          <span slot="help">
            Select all conditions that apply. This information is used for care coordination.
          </span>
        </hx-checkbox-group>
      </div>
    `;
  },
};

// ─────────────────────────────────────────────────
//  6. FORM INTEGRATION
// ─────────────────────────────────────────────────

/**
 * Demonstrates `hx-checkbox-group` embedded in a native `<form>` element.
 * The group uses ElementInternals to submit multiple values under a single name,
 * producing an array of values in `FormData`.
 */
export const InAForm: Story = {
  render: () => {
    const handleSubmit = fn();
    return html`
      <form
        id="patient-intake-form"
        @submit=${(e: Event) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          // Collect all values for the multi-select checkbox group
          const conditions = data.getAll('conditions');
          handleSubmit({ conditions });
        }}
        style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;"
      >
        <hx-checkbox-group
          id="conditions-group"
          label="Pre-Existing Conditions"
          name="conditions"
          required
        >
          <hx-checkbox value="diabetes" label="Diabetes"></hx-checkbox>
          <hx-checkbox value="hypertension" label="Hypertension"></hx-checkbox>
          <hx-checkbox value="heart-disease" label="Heart Disease"></hx-checkbox>
          <hx-checkbox value="asthma" label="Asthma"></hx-checkbox>
          <hx-checkbox value="none" label="None of the above"></hx-checkbox>
          <span slot="help">
            Select all conditions that apply. Required for accurate care planning.
          </span>
        </hx-checkbox-group>

        <div style="display: flex; gap: 0.75rem;">
          <button
            type="submit"
            style="padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
          >
            Submit Intake
          </button>
          <button
            type="reset"
            style="padding: 0.5rem 1.5rem; background: transparent; color: var(--hx-color-neutral-600, #6c757d); border: 1px solid var(--hx-color-neutral-300, #ced4da); border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
          >
            Reset
          </button>
        </div>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form') as HTMLFormElement;
    const group = getGroup(canvasElement);

    // Required and unchecked: group is initially invalid
    await expect(group.required).toBe(true);
    await expect(group.checkValidity()).toBe(false);

    // Check "diabetes" and "hypertension"
    const diabetesCheckbox = canvasElement.querySelector('hx-checkbox[value="diabetes"]');
    const hypertensionCheckbox = canvasElement.querySelector('hx-checkbox[value="hypertension"]');

    if (!diabetesCheckbox) throw new Error('Diabetes checkbox not found');
    if (!hypertensionCheckbox) throw new Error('Hypertension checkbox not found');
    await clickCheckbox(diabetesCheckbox);
    await clickCheckbox(hypertensionCheckbox);

    // Group is now valid
    await expect(group.checkValidity()).toBe(true);

    // FormData should contain both selected values under the same name
    const formData = new FormData(form);
    const values = formData.getAll('conditions');
    await expect(values).toContain('diabetes');
    await expect(values).toContain('hypertension');
    await expect(values.length).toBe(2);
  },
};

// ─────────────────────────────────────────────────
//  7. RICH LABEL SLOT
// ─────────────────────────────────────────────────

/**
 * Demonstrates using the `label` slot to provide rich HTML content for the group
 * label, such as a label paired with a badge or tooltip trigger.
 */
export const RichLabelSlot: Story = {
  render: () => html`
    <hx-checkbox-group name="symptoms-rich">
      <span slot="label" style="display: flex; align-items: center; gap: 0.5rem;">
        Current Symptoms
        <span
          style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; background: var(--hx-color-warning-100, #fff3cd); color: var(--hx-color-warning-700, #856404); border-radius: 9999px; font-size: 0.75rem; font-weight: 600;"
        >
          Report All
        </span>
      </span>
      <hx-checkbox value="fever" label="Fever"></hx-checkbox>
      <hx-checkbox value="cough" label="Cough"></hx-checkbox>
      <hx-checkbox value="shortness-of-breath" label="Shortness of Breath"></hx-checkbox>
      <hx-checkbox value="fatigue" label="Fatigue"></hx-checkbox>
      <hx-checkbox value="headache" label="Headache"></hx-checkbox>
    </hx-checkbox-group>
  `,
};

// ─────────────────────────────────────────────────
//  8. RICH ERROR SLOT
// ─────────────────────────────────────────────────

/**
 * Demonstrates using the `error` slot to provide custom rich error markup,
 * such as a message with a link to a help resource.
 */
export const RichErrorSlot: Story = {
  render: () => html`
    <hx-checkbox-group label="Known Drug Allergies" name="drug-allergies" required>
      <hx-checkbox value="penicillin" label="Penicillin"></hx-checkbox>
      <hx-checkbox value="sulfa" label="Sulfa Drugs"></hx-checkbox>
      <hx-checkbox value="aspirin" label="Aspirin"></hx-checkbox>
      <hx-checkbox value="none" label="No known drug allergies"></hx-checkbox>
      <span slot="error" style="color: var(--hx-color-error-500, #dc3545); font-size: 0.875rem;">
        Allergy information is required.
        <a
          href="#help"
          style="color: inherit; text-decoration: underline;"
          @click=${(e: Event) => e.preventDefault()}
        >
          Why is this required?
        </a>
      </span>
    </hx-checkbox-group>
  `,
};

// ─────────────────────────────────────────────────
//  9. HEALTHCARE — PRE-EXISTING CONDITIONS
// ─────────────────────────────────────────────────

/**
 * Primary intake use case: patient-facing pre-existing conditions selection.
 * This is one of the most common healthcare intake form patterns and must be
 * fully accessible, clearly labeled, and integrate correctly with form submission.
 */
export const HealthcarePreExistingConditions: Story = {
  render: () => html`
    <div
      style="max-width: 560px; padding: 1.5rem; border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem;"
    >
      <h3
        style="margin: 0 0 0.25rem; font-size: 1.125rem; color: var(--hx-color-neutral-800, #212529);"
      >
        Patient Medical History
      </h3>
      <p
        style="margin: 0 0 1.25rem; font-size: 0.8125rem; color: var(--hx-color-neutral-500, #6c757d);"
      >
        Accurate history helps your care team provide the best possible treatment.
      </p>

      <hx-checkbox-group label="Pre-Existing Conditions" name="pre_existing_conditions" required>
        <hx-checkbox value="diabetes-type1" label="Diabetes (Type 1)"></hx-checkbox>
        <hx-checkbox value="diabetes-type2" label="Diabetes (Type 2)"></hx-checkbox>
        <hx-checkbox value="hypertension" label="Hypertension (High Blood Pressure)"></hx-checkbox>
        <hx-checkbox value="heart-disease" label="Coronary Heart Disease"></hx-checkbox>
        <hx-checkbox value="asthma" label="Asthma"></hx-checkbox>
        <hx-checkbox
          value="arthritis"
          label="Arthritis (Rheumatoid or Osteoarthritis)"
        ></hx-checkbox>
        <hx-checkbox
          value="copd"
          label="Chronic Obstructive Pulmonary Disease (COPD)"
        ></hx-checkbox>
        <hx-checkbox value="ckd" label="Chronic Kidney Disease"></hx-checkbox>
        <hx-checkbox value="none" label="None of the above"></hx-checkbox>
        <span slot="help">
          Select all conditions that have been diagnosed by a physician. Required for accurate care
          coordination and medication safety review.
        </span>
      </hx-checkbox-group>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const checkboxes = canvasElement.querySelectorAll('hx-checkbox');
    await expect(checkboxes.length).toBe(9);

    // Check two conditions
    const diabetesCheckbox = canvasElement.querySelector('hx-checkbox[value="diabetes-type2"]');
    const hypertensionCheckbox = canvasElement.querySelector('hx-checkbox[value="hypertension"]');
    if (!diabetesCheckbox) throw new Error('Diabetes checkbox not found');
    if (!hypertensionCheckbox) throw new Error('Hypertension checkbox not found');
    await clickCheckbox(diabetesCheckbox);
    await clickCheckbox(hypertensionCheckbox);

    const diabetesHost = diabetesCheckbox as HTMLElement & { checked: boolean };
    const hypertensionHost = hypertensionCheckbox as HTMLElement & { checked: boolean };
    await expect(diabetesHost.checked).toBe(true);
    await expect(hypertensionHost.checked).toBe(true);
  },
};

// ─────────────────────────────────────────────────
//  10. HEALTHCARE — SYMPTOMS CHECKLIST
// ─────────────────────────────────────────────────

export const HealthcareSymptomsChecklist: Story = {
  render: () => html`
    <div style="max-width: 480px;">
      <hx-checkbox-group label="Current Symptoms" name="symptoms" orientation="vertical">
        <hx-checkbox value="fever" label="Fever (temperature above 100.4°F / 38°C)"></hx-checkbox>
        <hx-checkbox value="cough" label="Persistent Cough"></hx-checkbox>
        <hx-checkbox
          value="shortness-of-breath"
          label="Shortness of Breath or Difficulty Breathing"
        ></hx-checkbox>
        <hx-checkbox value="fatigue" label="Unusual Fatigue or Weakness"></hx-checkbox>
        <hx-checkbox value="headache" label="Headache"></hx-checkbox>
        <hx-checkbox value="chest-pain" label="Chest Pain or Tightness"></hx-checkbox>
        <hx-checkbox value="loss-taste-smell" label="Loss of Taste or Smell"></hx-checkbox>
        <hx-checkbox value="none" label="I am not experiencing any symptoms"></hx-checkbox>
        <span slot="help">
          Select all symptoms you are currently experiencing. This information helps triage your
          visit.
        </span>
      </hx-checkbox-group>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  11. HEALTHCARE — ALLERGY SELECTION
// ─────────────────────────────────────────────────

export const HealthcareAllergySelection: Story = {
  render: () => html`
    <div
      style="max-width: 560px; padding: 1.5rem; border: 1px solid var(--hx-color-neutral-200, #dee2e6); border-radius: 0.5rem; background: var(--hx-color-neutral-50, #f8f9fa);"
    >
      <h3
        style="margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: var(--hx-color-neutral-800, #212529);"
      >
        Allergy Screening
      </h3>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <hx-checkbox-group label="Drug Allergies" name="drug_allergies" required>
          <hx-checkbox value="penicillin" label="Penicillin / Amoxicillin"></hx-checkbox>
          <hx-checkbox value="sulfa" label="Sulfa Drugs (Sulfonamides)"></hx-checkbox>
          <hx-checkbox value="aspirin" label="Aspirin / NSAIDs"></hx-checkbox>
          <hx-checkbox value="codeine" label="Codeine / Opioids"></hx-checkbox>
          <hx-checkbox value="no-drug-allergies" label="No known drug allergies"></hx-checkbox>
        </hx-checkbox-group>

        <hx-checkbox-group label="Environmental &amp; Other Allergies" name="other_allergies">
          <hx-checkbox value="latex" label="Latex"></hx-checkbox>
          <hx-checkbox value="shellfish" label="Shellfish"></hx-checkbox>
          <hx-checkbox value="peanuts" label="Peanuts / Tree Nuts"></hx-checkbox>
          <hx-checkbox value="contrast-dye" label="Contrast Dye (Iodine)"></hx-checkbox>
          <hx-checkbox value="none" label="None of the above"></hx-checkbox>
        </hx-checkbox-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  12. INTERACTION TEST — hx-change EVENT
// ─────────────────────────────────────────────────

export const ChangeEvent: Story = {
  render: () => html`
    <hx-checkbox-group
      id="change-event-group"
      label="Notification Preferences"
      name="notifications"
    >
      <hx-checkbox value="appointments" label="Appointment Reminders"></hx-checkbox>
      <hx-checkbox value="lab-results" label="Lab Result Notifications"></hx-checkbox>
      <hx-checkbox value="prescriptions" label="Prescription Refill Alerts"></hx-checkbox>
    </hx-checkbox-group>
  `,
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('#change-event-group') as HTMLElement & {
      name: string;
    };

    const changeSpy = fn();
    group.addEventListener('hx-change', changeSpy);

    // Check "appointments"
    const appointmentsCheckbox = canvasElement.querySelector('hx-checkbox[value="appointments"]');
    if (!appointmentsCheckbox) throw new Error('Appointments checkbox not found');
    await clickCheckbox(appointmentsCheckbox);

    await expect(changeSpy).toHaveBeenCalledTimes(1);
    const firstDetail = (changeSpy.mock.calls[0][0] as CustomEvent<{ values: string[] }>).detail;
    await expect(firstDetail.values).toContain('appointments');
    await expect(firstDetail.values.length).toBe(1);

    // Check "lab-results" as well
    const labCheckbox = canvasElement.querySelector('hx-checkbox[value="lab-results"]');
    if (!labCheckbox) throw new Error('Lab checkbox not found');
    await clickCheckbox(labCheckbox);

    await expect(changeSpy).toHaveBeenCalledTimes(2);
    const secondDetail = (changeSpy.mock.calls[1][0] as CustomEvent<{ values: string[] }>).detail;
    await expect(secondDetail.values).toContain('appointments');
    await expect(secondDetail.values).toContain('lab-results');
    await expect(secondDetail.values.length).toBe(2);

    // Uncheck "appointments"
    await clickCheckbox(appointmentsCheckbox);

    await expect(changeSpy).toHaveBeenCalledTimes(3);
    const thirdDetail = (changeSpy.mock.calls[2][0] as CustomEvent<{ values: string[] }>).detail;
    await expect(thirdDetail.values).not.toContain('appointments');
    await expect(thirdDetail.values).toContain('lab-results');
  },
};

// ─────────────────────────────────────────────────
//  13. INTERACTION TEST — FORM RESET
// ─────────────────────────────────────────────────

export const FormReset: Story = {
  render: () => html`
    <form
      id="reset-test-form"
      @submit=${(e: Event) => e.preventDefault()}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
    >
      <hx-checkbox-group label="Care Preferences" name="care_preferences">
        <hx-checkbox value="interpreter" label="Interpreter Needed"></hx-checkbox>
        <hx-checkbox value="wheelchair" label="Wheelchair Accessibility"></hx-checkbox>
        <hx-checkbox value="low-sodium" label="Low-Sodium Meal Required"></hx-checkbox>
      </hx-checkbox-group>

      <div style="display: flex; gap: 0.75rem;">
        <button
          type="submit"
          style="padding: 0.5rem 1.5rem; background: var(--hx-color-primary-500, #2563EB); color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Save Preferences
        </button>
        <button
          type="reset"
          style="padding: 0.5rem 1.5rem; background: transparent; color: var(--hx-color-neutral-600, #6c757d); border: 1px solid var(--hx-color-neutral-300, #ced4da); border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;"
        >
          Reset
        </button>
      </div>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const interpreterCheckbox = canvasElement.querySelector(
      'hx-checkbox[value="interpreter"]',
    ) as HTMLElement & { checked: boolean };
    const wheelchairCheckbox = canvasElement.querySelector(
      'hx-checkbox[value="wheelchair"]',
    ) as HTMLElement & { checked: boolean };

    // Check two items
    await clickCheckbox(interpreterCheckbox);
    await clickCheckbox(wheelchairCheckbox);

    await expect(interpreterCheckbox.checked).toBe(true);
    await expect(wheelchairCheckbox.checked).toBe(true);

    // Reset the form
    const resetButton = canvasElement.querySelector('button[type="reset"]') as HTMLButtonElement;
    await userEvent.click(resetButton);
    await nextFrame();

    // All checkboxes should be unchecked after reset
    await expect(interpreterCheckbox.checked).toBe(false);
    await expect(wheelchairCheckbox.checked).toBe(false);
  },
};

// ─────────────────────────────────────────────────
//  14. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          Default Styling
        </h4>
        <hx-checkbox-group label="Symptoms" name="symptoms-default-css">
          <hx-checkbox value="fever" label="Fever" checked></hx-checkbox>
          <hx-checkbox value="cough" label="Cough"></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-group-gap (1.5rem)
        </h4>
        <hx-checkbox-group
          label="Symptoms"
          name="symptoms-gap"
          style="--hx-checkbox-group-gap: 1.5rem;"
        >
          <hx-checkbox value="fever" label="Fever" checked></hx-checkbox>
          <hx-checkbox value="cough" label="Cough"></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-group-label-color (#7c3aed)
        </h4>
        <hx-checkbox-group
          label="Symptoms"
          name="symptoms-label-color"
          style="--hx-checkbox-group-label-color: #7c3aed;"
        >
          <hx-checkbox value="fever" label="Fever"></hx-checkbox>
          <hx-checkbox value="cough" label="Cough"></hx-checkbox>
        </hx-checkbox-group>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          --hx-checkbox-group-error-color (#b91c1c)
        </h4>
        <hx-checkbox-group
          label="Symptoms"
          name="symptoms-error-color"
          required
          error="Custom error color applied."
          style="--hx-checkbox-group-error-color: #b91c1c;"
        >
          <hx-checkbox value="fever" label="Fever"></hx-checkbox>
          <hx-checkbox value="cough" label="Cough"></hx-checkbox>
        </hx-checkbox-group>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
//  15. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-checkbox-group::part(group) {
        border: 2px dashed #7c3aed;
        border-radius: 0.5rem;
        padding: 1rem;
      }
      .parts-demo hx-checkbox-group::part(label) {
        font-style: italic;
        color: #6d28d9;
        font-size: 1rem;
      }
      .parts-demo-help hx-checkbox-group::part(help-text) {
        font-weight: 600;
        color: #0369a1;
      }
      .parts-demo-error hx-checkbox-group::part(error-message) {
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    </style>
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 480px;">
      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(group) + ::part(label)
        </h4>
        <div class="parts-demo">
          <hx-checkbox-group label="Styled via CSS Parts" name="parts-demo-group">
            <hx-checkbox value="fever" label="Fever"></hx-checkbox>
            <hx-checkbox value="cough" label="Cough" checked></hx-checkbox>
          </hx-checkbox-group>
        </div>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(help-text)
        </h4>
        <div class="parts-demo-help">
          <hx-checkbox-group label="With Styled Help Text" name="parts-demo-help">
            <hx-checkbox value="fever" label="Fever"></hx-checkbox>
            <hx-checkbox value="cough" label="Cough"></hx-checkbox>
            <span slot="help">This help text is bold and blue via ::part(help-text).</span>
          </hx-checkbox-group>
        </div>
      </div>

      <div>
        <h4
          style="margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--hx-color-neutral-600, #6c757d);"
        >
          ::part(error-message)
        </h4>
        <div class="parts-demo-error">
          <hx-checkbox-group
            label="With Styled Error"
            name="parts-demo-error"
            required
            error="Uppercase bold error via ::part(error-message)."
          >
            <hx-checkbox value="fever" label="Fever"></hx-checkbox>
            <hx-checkbox value="cough" label="Cough"></hx-checkbox>
          </hx-checkbox-group>
        </div>
      </div>
    </div>
  `,
};
