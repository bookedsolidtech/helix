import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, fn } from 'storybook/test';
import './hx-patient-banner.js';
import '../hx-phi-field/hx-phi-field.js';
import '../hx-theme/hx-theme.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Healthcare/hx-patient-banner',
  component: 'hx-patient-banner',
  tags: ['autodocs'],
  argTypes: {
    patientId: {
      control: 'text',
      description:
        'Optional patient identifier used as context in identifier rule violation events.',
      table: {
        category: 'Identity',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    enforceIdentifierRule: {
      control: 'boolean',
      description:
        'When true, fires hx-identifier-rule-violation if fewer than 2 identifier slots (name, mrn, dob) are populated. Implements Joint Commission NPSG.01.01.01.',
      table: {
        category: 'Compliance',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    labelPatient: {
      control: 'text',
      description: 'Accessible label for the banner landmark region.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'Patient identification'" },
        type: { summary: 'string' },
      },
    },
    labelName: {
      control: 'text',
      description: 'Visible label for the patient name field.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'Patient name'" },
        type: { summary: 'string' },
      },
    },
    labelMrn: {
      control: 'text',
      description: 'Visible label for the MRN field.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'MRN'" },
        type: { summary: 'string' },
      },
    },
    labelDob: {
      control: 'text',
      description: 'Visible label for the date of birth field.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'Date of birth'" },
        type: { summary: 'string' },
      },
    },
    labelAllergies: {
      control: 'text',
      description: 'Visible label for the allergies field.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'Allergies'" },
        type: { summary: 'string' },
      },
    },
    labelCodeStatus: {
      control: 'text',
      description: 'Visible label for the code status field.',
      table: {
        category: 'Labels',
        defaultValue: { summary: "'Code status'" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    patientId: 'PT-000001',
    enforceIdentifierRule: true,
    labelPatient: 'Patient identification',
    labelName: 'Patient name',
    labelMrn: 'MRN',
    labelDob: 'Date of birth',
    labelAllergies: 'Allergies',
    labelCodeStatus: 'Code status',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Two identifiers (satisfies NPSG.01.01.01)
// ─────────────────────────────────────────────────

/** Basic banner with name and MRN slots populated. Satisfies the Joint Commission two-identifier rule. */
export const Default: Story = {
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">Jane Smith</span>
      <span slot="mrn">MRN-123456</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.getAttribute('role')).toBe('banner');
    await expect(banner?.getAttribute('aria-label')).toBe('Patient identification');
    // Two identifiers are present — no violation should be flagged
    await expect(banner?.getAttribute('aria-invalid')).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 2. WITH PHI FIELDS — MRN and DOB via hx-phi-field
// ─────────────────────────────────────────────────

/** Banner using hx-phi-field for masked HIPAA-compliant display of MRN and date of birth. Both identifiers are masked by default; click the eye icon to reveal. */
export const WithPhiFields: Story = {
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">Robert Johnson</span>
      <hx-phi-field
        slot="mrn"
        field-type="mrn"
        data="MRN-123456"
        field-id="banner-mrn"
      ></hx-phi-field>
      <hx-phi-field
        slot="dob"
        field-type="dob"
        data="03/22/1958"
        field-id="banner-dob"
      ></hx-phi-field>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();

    const mrnField = canvasElement.querySelector('hx-phi-field[field-id="banner-mrn"]');
    const dobField = canvasElement.querySelector('hx-phi-field[field-id="banner-dob"]');
    await expect(mrnField).toBeTruthy();
    await expect(dobField).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 3. WITH PHOTO — Photo slot populated
// ─────────────────────────────────────────────────

/** Banner with an avatar placeholder in the photo slot. In production, supply a patient photo or hx-avatar element. */
export const WithPhoto: Story = {
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <div
        slot="photo"
        style="
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          font-family: sans-serif;
        "
        aria-label="Patient photo placeholder"
        role="img"
      >
        MK
      </div>
      <span slot="name">Margaret Kim</span>
      <span slot="mrn">MRN-789012</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();
    const photoPlaceholder = canvasElement.querySelector('[slot="photo"]');
    await expect(photoPlaceholder).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. ALL FIELDS — All 6 slots populated
// ─────────────────────────────────────────────────

/** Kitchen sink: all six slots populated. Demonstrates full patient context with photo, identifiers, allergies, and code status. */
export const AllFields: Story = {
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <div
        slot="photo"
        style="
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e40af;
          font-family: sans-serif;
        "
        aria-label="Patient photo placeholder"
        role="img"
      >
        DL
      </div>
      <span slot="name">David Lee</span>
      <hx-phi-field
        slot="mrn"
        field-type="mrn"
        data="MRN-456789"
        field-id="all-fields-mrn"
      ></hx-phi-field>
      <hx-phi-field
        slot="dob"
        field-type="dob"
        data="07/04/1965"
        field-id="all-fields-dob"
      ></hx-phi-field>
      <span slot="allergies" style="color: #dc2626; font-weight: 600;">PCN, Sulfa</span>
      <span slot="code-status">Full code</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="name"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="mrn"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="dob"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="allergies"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="code-status"]')).toBeTruthy();
    await expect(canvasElement.querySelector('[slot="photo"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 5. IDENTIFIER RULE VIOLATION — Only name slot populated
// ─────────────────────────────────────────────────

/** Only the name slot is populated (1 of 2 required identifiers). With enforce-identifier-rule enabled, the component fires hx-identifier-rule-violation and sets aria-invalid="true". This story demonstrates the Joint Commission NPSG.01.01.01 enforcement. */
export const IdentifierRuleViolation: Story = {
  render: (args) => html`
    <div style="font-family: sans-serif;">
      <p
        style="
          margin: 0 0 0.75rem;
          padding: 0.5rem 0.75rem;
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          color: #991b1b;
        "
        id="violation-notice"
        role="alert"
        aria-live="assertive"
      >
        Waiting for identifier rule violation event...
      </p>
      <hx-patient-banner
        patient-id=${args.patientId}
        label-patient=${args.labelPatient}
        label-name=${args.labelName}
        label-mrn=${args.labelMrn}
        label-dob=${args.labelDob}
        label-allergies=${args.labelAllergies}
        label-code-status=${args.labelCodeStatus}
        .enforceIdentifierRule=${args.enforceIdentifierRule}
      >
        <span slot="name">Patricia Moore</span>
      </hx-patient-banner>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();

    const violationSpy = fn();
    banner!.addEventListener('hx-identifier-rule-violation', violationSpy);

    // Trigger a re-check by toggling enforceIdentifierRule
    (banner as HTMLElement & { enforceIdentifierRule: boolean }).enforceIdentifierRule = false;
    (banner as HTMLElement & { enforceIdentifierRule: boolean }).enforceIdentifierRule = true;
    await (banner as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;

    await expect(violationSpy).toHaveBeenCalled();

    const detail = (violationSpy.mock.calls[0][0] as CustomEvent).detail as {
      populatedIdentifiers: number;
      requiredIdentifiers: number;
    };
    const notice = canvasElement.querySelector('#violation-notice');
    if (notice) {
      notice.textContent = `NPSG violation: ${detail.populatedIdentifiers} of ${detail.requiredIdentifiers} required identifiers present.`;
    }

    banner!.removeEventListener('hx-identifier-rule-violation', violationSpy);
  },
};

// ─────────────────────────────────────────────────
// 6. RULE ENFORCEMENT DISABLED — One identifier, no violation
// ─────────────────────────────────────────────────

/** enforce-identifier-rule attribute is absent. Only name is populated but no hx-identifier-rule-violation fires and aria-invalid is not set. Useful for non-clinical contexts where the two-identifier rule does not apply. */
export const RuleEnforcementDisabled: Story = {
  args: {
    enforceIdentifierRule: false,
  },
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">Samuel Torres</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();

    const violationSpy = fn();
    banner!.addEventListener('hx-identifier-rule-violation', violationSpy);

    // Trigger slot re-evaluation
    const nameSlot = canvasElement.querySelector('[slot="name"]');
    await expect(nameSlot).toBeTruthy();

    // With enforcement disabled, aria-invalid must not be set
    await expect(banner?.getAttribute('aria-invalid')).toBeNull();
    await expect(violationSpy).not.toHaveBeenCalled();

    banner!.removeEventListener('hx-identifier-rule-violation', violationSpy);
  },
};

// ─────────────────────────────────────────────────
// 7. CUSTOM LABELS — Localized / overridden field labels
// ─────────────────────────────────────────────────

/** Demonstrates all label-* properties overridden. Useful for internationalisation or facility-specific terminology (e.g. "Chart #" instead of "MRN"). */
export const CustomLabels: Story = {
  args: {
    labelPatient: 'Identificación del paciente',
    labelName: 'Nombre del paciente',
    labelMrn: 'N.° de historia clínica',
    labelDob: 'Fecha de nacimiento',
    labelAllergies: 'Alergias',
    labelCodeStatus: 'Estado del código',
  },
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">María García</span>
      <span slot="mrn">HC-987654</span>
      <span slot="dob">12/05/1980</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement, args }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.getAttribute('aria-label')).toBe(args.labelPatient);
    await expect(banner?.labelName).toBe(args.labelName);
    await expect(banner?.labelMrn).toBe(args.labelMrn);
  },
};

// ─────────────────────────────────────────────────
// 8. IDENTIFIER RULE EVENT PAYLOAD — Audit verification
// ─────────────────────────────────────────────────

/** Verifies the hx-identifier-rule-violation event payload shape: populatedIdentifiers, requiredIdentifiers, and patientId. */
export const IdentifierRuleEventPayload: Story = {
  name: 'Compliance — Identifier Rule Event Payload',
  args: {
    patientId: 'PT-AUDIT-001',
  },
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">Test Patient</span>
    </hx-patient-banner>
  `,
  play: async ({ canvasElement, args }) => {
    const banner = canvasElement.querySelector('hx-patient-banner');
    await expect(banner).toBeTruthy();

    const violationSpy = fn();
    banner!.addEventListener('hx-identifier-rule-violation', violationSpy);

    // Toggle enforcement to trigger a fresh event
    (banner as HTMLElement & { enforceIdentifierRule: boolean }).enforceIdentifierRule = false;
    (banner as HTMLElement & { enforceIdentifierRule: boolean }).enforceIdentifierRule = true;
    await (banner as HTMLElement & { updateComplete: Promise<boolean> }).updateComplete;

    await expect(violationSpy).toHaveBeenCalled();

    const event = violationSpy.mock.calls[0][0] as CustomEvent;
    await expect(event.bubbles).toBe(true);
    await expect(event.composed).toBe(true);
    await expect(event.detail.populatedIdentifiers).toBe(1);
    await expect(event.detail.requiredIdentifiers).toBe(2);
    await expect(event.detail.patientId).toBe(args.patientId);

    banner!.removeEventListener('hx-identifier-rule-violation', violationSpy);
  },
};

// ─────────────────────────────────────────────────
// 9. DARK MODE
// ─────────────────────────────────────────────────

export const DarkMode: Story = {
  name: 'Dark Mode',
  decorators: [
    (story) =>
      html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`,
  ],
  render: (args) => html`
    <hx-patient-banner
      patient-id=${args.patientId}
      label-patient=${args.labelPatient}
      label-name=${args.labelName}
      label-mrn=${args.labelMrn}
      label-dob=${args.labelDob}
      label-allergies=${args.labelAllergies}
      label-code-status=${args.labelCodeStatus}
      .enforceIdentifierRule=${args.enforceIdentifierRule}
    >
      <span slot="name">Eleanor Voss</span>
      <hx-phi-field
        slot="mrn"
        field-type="mrn"
        data="MRN-333444"
        field-id="dark-mrn"
      ></hx-phi-field>
      <hx-phi-field
        slot="dob"
        field-type="dob"
        data="11/30/1947"
        field-id="dark-dob"
      ></hx-phi-field>
    </hx-patient-banner>
  `,
};
