import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import type { HelixFieldLabel } from './hx-field-label.js';
import './hx-field-label.js';

// ─────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────

function getLabelHost(canvasElement: Element): HTMLElement {
  const host = canvasElement.querySelector('hx-field-label');
  if (!host) {
    throw new Error('hx-field-label element not found');
  }
  return host as HTMLElement;
}

function getShadowRoot(host: HTMLElement): HTMLElement {
  if (!host.shadowRoot) {
    throw new Error('shadowRoot not available on hx-field-label');
  }
  return host.shadowRoot as unknown as HTMLElement;
}

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/FieldLabel',
  component: 'hx-field-label',
  tags: ['autodocs'],
  argTypes: {
    for: {
      control: 'text',
      description:
        'ID of the associated form control. When set, renders a native `<label for="...">` element for direct label association. When unset, renders a `<span>` for aria-labelledby use.',
      table: {
        category: 'Association',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    required: {
      control: 'boolean',
      description:
        'Renders a required (*) indicator next to the label text. Does not add required validation to the associated control — set required on the control itself.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    optional: {
      control: 'boolean',
      description: 'Renders an "(optional)" indicator next to the label text.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    for: '',
    required: false,
    optional: false,
  },
  render: (args) => html`
    <hx-field-label ?required=${args.required} ?optional=${args.optional} for=${args.for || ''}>
      Email Address
    </hx-field-label>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — span (no for attribute)
// ─────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default (span)',
  args: {},
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));
    const base = shadow.getByRole('generic', { hidden: true });
    await expect(base.tagName.toLowerCase()).toBe('span');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH FOR — native label association
// ─────────────────────────────────────────────────

export const WithFor: Story = {
  name: 'With For Attribute (label)',
  render: () => html`
    <div>
      <hx-field-label for="patient-email">Patient Email</hx-field-label>
      <input
        id="patient-email"
        type="email"
        placeholder="clinician@hospital.org"
        style="display: block; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
      />
    </div>
  `,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    await expect(host).toBeTruthy();

    const shadow = within(getShadowRoot(host));
    const label = shadow.getByRole('generic', { hidden: true });
    await expect(label.tagName.toLowerCase()).toBe('label');
    await expect(label.getAttribute('for')).toBe('patient-email');
  },
};

// ─────────────────────────────────────────────────
// 3. REQUIRED
// ─────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required',
  args: {
    required: true,
  },
  render: () => html`
    <hx-field-label required for="mrn">Medical Record Number</hx-field-label>
  `,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    await expect(host.hasAttribute('required')).toBe(true);

    const shadow = within(getShadowRoot(host));
    const indicator = shadow.getByText('*');
    await expect(indicator).toBeTruthy();
    await expect(indicator.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 4. OPTIONAL
// ─────────────────────────────────────────────────

export const Optional: Story = {
  name: 'Optional',
  args: {
    optional: true,
  },
  render: () => html`
    <hx-field-label optional for="notes">Additional Notes</hx-field-label>
  `,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    await expect(host.hasAttribute('optional')).toBe(true);

    const shadow = within(getShadowRoot(host));
    const indicator = shadow.getByText('(optional)');
    await expect(indicator).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 5. CUSTOM REQUIRED INDICATOR (slot)
// ─────────────────────────────────────────────────

export const CustomRequiredIndicator: Story = {
  name: 'Custom Required Indicator (slot)',
  render: () => html`
    <hx-field-label required for="insurance-id">
      Insurance ID
      <span slot="required-indicator" style="color: var(--hx-color-error-500, #ef4444);">
        (required)
      </span>
    </hx-field-label>
  `,
};

// ─────────────────────────────────────────────────
// 6. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-field-label::part(base) {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0d6efd;
        font-weight: 700;
      }
      .parts-demo hx-field-label::part(required-indicator) {
        font-size: 1rem;
        color: #dc3545;
      }
      .parts-demo hx-field-label::part(optional-indicator) {
        font-style: italic;
        color: #6c757d;
      }
    </style>
    <div class="parts-demo" style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-field-label required for="demo-required">
        Required Field (styled via ::part)
      </hx-field-label>
      <hx-field-label optional for="demo-optional">
        Optional Field (styled via ::part)
      </hx-field-label>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const HealthcareFormLabels: Story = {
  name: 'Healthcare: Form Labels',
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 400px;">
      <div>
        <hx-field-label required for="patient-name">Full Name</hx-field-label>
        <input
          id="patient-name"
          type="text"
          placeholder="First Middle Last"
          required
          style="display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </div>

      <div>
        <hx-field-label required for="dob">Date of Birth</hx-field-label>
        <input
          id="dob"
          type="date"
          required
          style="display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </div>

      <div>
        <hx-field-label optional for="pcp">Primary Care Provider</hx-field-label>
        <input
          id="pcp"
          type="text"
          placeholder="Dr. Eleanor Vance, MD"
          style="display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: 0.375rem; font-size: 0.875rem;"
        />
      </div>
    </form>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Default
        </p>
        <hx-field-label required>Default label color</hx-field-label>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-label-color
        </p>
        <hx-field-label required style="--hx-field-label-color: #2563eb;">
          Custom brand label color
        </hx-field-label>
      </div>

      <div>
        <p
          style="margin: 0 0 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-color-danger (required indicator)
        </p>
        <hx-field-label required style="--hx-color-danger: #d97706;">
          Custom amber required indicator
        </hx-field-label>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// INTERACTION TESTS
// ─────────────────────────────────────────────────

export const SpanRenderedWithoutFor: Story = {
  name: 'Interaction: Renders span without for',
  render: () => html`<hx-field-label>Diagnosis Code</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    const shadow = host.shadowRoot!;
    const base = shadow.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('span');
  },
};

export const LabelRenderedWithFor: Story = {
  name: 'Interaction: Renders label with for',
  render: () => html`<hx-field-label for="some-input">Patient ID</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement);
    const shadow = host.shadowRoot!;
    const base = shadow.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('label');
    await expect(base?.getAttribute('for')).toBe('some-input');
  },
};

export const RequiredIndicatorPresent: Story = {
  name: 'Interaction: Required indicator present',
  render: () => html`<hx-field-label required>MRN</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement) as HelixFieldLabel;
    await expect(host.required).toBe(true);

    const shadow = host.shadowRoot!;
    const indicator = shadow.querySelector('[part="required-indicator"]');
    await expect(indicator).toBeTruthy();
    await expect(indicator?.getAttribute('aria-hidden')).toBe('true');
  },
};

export const OptionalIndicatorPresent: Story = {
  name: 'Interaction: Optional indicator present',
  render: () => html`<hx-field-label optional>Notes</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = getLabelHost(canvasElement) as HelixFieldLabel;
    await expect(host.optional).toBe(true);

    const shadow = host.shadowRoot!;
    const indicator = shadow.querySelector('[part="optional-indicator"]');
    await expect(indicator).toBeTruthy();
    await expect(indicator?.textContent?.trim()).toBe('(optional)');
  },
};
