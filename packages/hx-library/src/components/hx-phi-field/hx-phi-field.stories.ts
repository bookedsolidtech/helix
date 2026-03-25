import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-phi-field.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/PHI Field',
  component: 'hx-phi-field',
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'text',
      description: 'The Protected Health Information value to display or mask.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    fieldType: {
      control: { type: 'select' },
      options: ['ssn', 'mrn', 'dob', 'insurance'],
      description: 'The type of PHI field. Controls the masking pattern applied.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'ssn' },
        type: { summary: "'ssn' | 'mrn' | 'dob' | 'insurance'" },
      },
    },
    fieldId: {
      control: 'text',
      description: 'Identifier used in audit events. Falls back to the element id attribute.',
      table: {
        category: 'Audit',
        type: { summary: 'string' },
      },
    },
    clipboardTimeout: {
      control: { type: 'number' },
      description:
        'Milliseconds after clipboard write before the clipboard is automatically cleared. Default: 30000 (30s).',
      table: {
        category: 'Security',
        defaultValue: { summary: '30000' },
        type: { summary: 'number' },
      },
    },
  },
  args: {
    data: '123-45-6789',
    fieldType: 'ssn',
    fieldId: 'patient-ssn',
    clipboardTimeout: 30000,
  },
  render: (args) => html`
    <hx-phi-field
      data=${args.data}
      field-type=${args.fieldType}
      field-id=${args.fieldId}
      clipboard-timeout=${args.clipboardTimeout}
    ></hx-phi-field>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies hx-phi-access event fires on reveal
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    data: '123-45-6789',
    fieldType: 'ssn',
    fieldId: 'patient-ssn',
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('hx-phi-field');
    await expect(field).toBeTruthy();

    let eventFired = false;
    let eventDetail: unknown;
    const handler = (e: Event) => {
      eventFired = true;
      eventDetail = (e as CustomEvent).detail;
    };
    field!.addEventListener('hx-phi-access', handler);

    const toggle = field!.shadowRoot!.querySelector('[part="toggle"]') as HTMLButtonElement;
    await expect(toggle).toBeTruthy();
    await userEvent.click(toggle);

    await expect(eventFired).toBe(true);
    await expect((eventDetail as { action: string }).action).toBe('reveal');

    field!.removeEventListener('hx-phi-access', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. FIELD TYPE STORIES
// ─────────────────────────────────────────────────

export const SocialSecurityNumber: Story = {
  name: 'SSN — Social Security Number',
  args: {
    data: '123-45-6789',
    fieldType: 'ssn',
    fieldId: 'patient-ssn',
  },
};

export const MedicalRecordNumber: Story = {
  name: 'MRN — Medical Record Number',
  args: {
    data: 'MRN-00123456',
    fieldType: 'mrn',
    fieldId: 'patient-mrn',
  },
};

export const DateOfBirth: Story = {
  name: 'DOB — Date of Birth',
  args: {
    data: '01/15/1972',
    fieldType: 'dob',
    fieldId: 'patient-dob',
  },
};

export const InsuranceId: Story = {
  name: 'Insurance ID',
  args: {
    data: '1234-5678-9012-3456',
    fieldType: 'insurance',
    fieldId: 'patient-insurance',
  },
};

// ─────────────────────────────────────────────────
// 3. STATE STORIES
// ─────────────────────────────────────────────────

export const Revealed: Story = {
  name: 'Revealed State',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Click the toggle to reveal — shown here for documentation purposes.
      </p>
      <hx-phi-field
        data="123-45-6789"
        field-type="ssn"
        field-id="demo-ssn"
      ></hx-phi-field>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('hx-phi-field');
    await expect(field).toBeTruthy();
    const toggle = field!.shadowRoot!.querySelector('[part="toggle"]') as HTMLButtonElement;
    await userEvent.click(toggle);
    // Verify it is now revealed
    const value = field!.shadowRoot!.querySelector('[part="value"]');
    await expect(value?.classList.contains('phi-field__value--revealed')).toBe(true);
  },
};

export const EmptyValue: Story = {
  name: 'Empty Value',
  args: {
    data: '',
    fieldType: 'ssn',
    fieldId: 'empty-field',
  },
};

// ─────────────────────────────────────────────────
// 4. HIPAA COMPLIANCE KITCHEN SINK
// ─────────────────────────────────────────────────

export const HIPAACompliance: Story = {
  name: 'HIPAA Compliance — All Field Types',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 560px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-family: sans-serif;"
    >
      <div>
        <h3 style="margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600;">
          Patient Demographics
        </h3>
        <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
          PHI fields are masked by default. Click the eye icon to reveal. All access events are
          logged for HIPAA compliance.
        </p>
      </div>

      <div
        style="display: grid; grid-template-columns: 180px 1fr; gap: 0.75rem 1rem; align-items: center;"
      >
        <label
          style="font-size: 0.875rem; font-weight: 500; color: #374151;"
          for="phi-ssn"
        >Social Security Number</label>
        <hx-phi-field
          id="phi-ssn"
          data="123-45-6789"
          field-type="ssn"
          field-id="patient-ssn"
        ></hx-phi-field>

        <label
          style="font-size: 0.875rem; font-weight: 500; color: #374151;"
          for="phi-mrn"
        >Medical Record #</label>
        <hx-phi-field
          id="phi-mrn"
          data="MRN-00123456"
          field-type="mrn"
          field-id="patient-mrn"
        ></hx-phi-field>

        <label
          style="font-size: 0.875rem; font-weight: 500; color: #374151;"
          for="phi-dob"
        >Date of Birth</label>
        <hx-phi-field
          id="phi-dob"
          data="01/15/1972"
          field-type="dob"
          field-id="patient-dob"
        ></hx-phi-field>

        <label
          style="font-size: 0.875rem; font-weight: 500; color: #374151;"
          for="phi-ins"
        >Insurance ID</label>
        <hx-phi-field
          id="phi-ins"
          data="1234-5678-9012-3456"
          field-type="insurance"
          field-id="patient-insurance"
        ></hx-phi-field>
      </div>

      <div id="audit-log" style="border-top: 1px solid #e5e7eb; padding-top: 1rem;">
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
          PHI Access Audit Log
        </p>
        <ul
          id="audit-entries"
          style="margin: 0; padding: 0; list-style: none; font-family: monospace; font-size: 0.75rem; color: #374151; max-height: 120px; overflow-y: auto;"
        ></ul>
        <p
          id="audit-empty"
          style="margin: 0; font-size: 0.75rem; color: #9ca3af; font-style: italic;"
        >No access events yet.</p>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const auditEntries = canvasElement.querySelector('#audit-entries') as HTMLUListElement;
    const auditEmpty = canvasElement.querySelector('#audit-empty') as HTMLParagraphElement;

    const logEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        fieldId: string;
        action: string;
        timestamp: string;
        fieldType: string;
      };
      auditEmpty.style.display = 'none';
      const li = document.createElement('li');
      li.style.cssText = 'padding: 0.125rem 0; border-bottom: 1px solid #f3f4f6;';
      li.textContent = `[${new Date(detail.timestamp).toLocaleTimeString()}] ${detail.action.toUpperCase()} ${detail.fieldType} (${detail.fieldId})`;
      auditEntries.prepend(li);
    };

    const fields = canvasElement.querySelectorAll('hx-phi-field');
    fields.forEach((f) => f.addEventListener('hx-phi-access', logEvent));

    // Verify all fields rendered
    await expect(fields.length).toBe(4);
  },
};

// ─────────────────────────────────────────────────
// 5. INTERACTION TEST — Toggle emits correct events
// ─────────────────────────────────────────────────

export const AuditEventVerification: Story = {
  name: 'Audit — Event Payload Verification',
  args: {
    data: '123-45-6789',
    fieldType: 'ssn',
    fieldId: 'audit-test-ssn',
  },
  play: async ({ canvasElement }) => {
    const field = canvasElement.querySelector('hx-phi-field');
    await expect(field).toBeTruthy();

    const accessSpy = fn();
    field!.addEventListener('hx-phi-access', accessSpy);

    const toggle = field!.shadowRoot!.querySelector('[part="toggle"]') as HTMLButtonElement;

    // First click: reveal
    await userEvent.click(toggle);
    await expect(accessSpy).toHaveBeenCalledTimes(1);

    const revealCall = accessSpy.mock.calls[0][0] as CustomEvent;
    await expect(revealCall.detail.action).toBe('reveal');
    await expect(revealCall.detail.fieldId).toBe('audit-test-ssn');
    await expect(revealCall.detail.fieldType).toBe('ssn');
    await expect(revealCall.bubbles).toBe(true);
    await expect(revealCall.composed).toBe(true);

    // Second click: hide
    await userEvent.click(toggle);
    await expect(accessSpy).toHaveBeenCalledTimes(2);

    const hideCall = accessSpy.mock.calls[1][0] as CustomEvent;
    await expect(hideCall.detail.action).toBe('hide');

    field!.removeEventListener('hx-phi-access', accessSpy);
  },
};

// ─────────────────────────────────────────────────
// 6. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px; font-family: sans-serif;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; font-family: monospace;">
          default
        </p>
        <hx-phi-field data="123-45-6789" field-type="ssn"></hx-phi-field>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; font-family: monospace;">
          --hx-phi-field-masked-color: #dc2626; --hx-phi-field-toggle-color: #dc2626
        </p>
        <hx-phi-field
          data="123-45-6789"
          field-type="ssn"
          style="--hx-phi-field-masked-color: #dc2626; --hx-phi-field-toggle-color: #dc2626;"
        ></hx-phi-field>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; font-family: monospace;">
          --hx-phi-field-font-family: Georgia, serif
        </p>
        <hx-phi-field
          data="123-45-6789"
          field-type="ssn"
          style="--hx-phi-field-font-family: Georgia, serif;"
        ></hx-phi-field>
      </div>
    </div>
  `,
};
