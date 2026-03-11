import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import type { HelixFieldLabel } from './hx-field-label.js';
import './hx-field-label.js';

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
        'ID of the associated form control. Renders a native `<label for="...">` in shadow DOM. **Important:** Due to shadow DOM scoping, this only works for inputs in the same shadow root. For light-DOM inputs, use `aria-labelledby` on the input pointing to the `hx-field-label` host `id`.',
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
    const host = canvasElement.querySelector('hx-field-label')!;
    await expect(host).toBeTruthy();

    const base = host.shadowRoot!.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('span');
  },
};

// ─────────────────────────────────────────────────
// 2. ARIA-LABELLEDBY — correct cross-shadow-DOM pattern
// ─────────────────────────────────────────────────

export const AriaLabelledBy: Story = {
  name: 'aria-labelledby Pattern (recommended)',
  render: () => html`
    <div>
      <hx-field-label id="label-patient-email">Patient Email</hx-field-label>
      <input
        id="patient-email"
        type="email"
        placeholder="clinician@hospital.org"
        aria-labelledby="label-patient-email"
        style="display: block; margin-top: var(--hx-space-1, 0.25rem); padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem); border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: var(--hx-radius-md, 0.375rem); font-size: var(--hx-font-size-sm, 0.875rem);"
      />
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'The recommended pattern for associating `hx-field-label` with light-DOM inputs. Use `aria-labelledby` on the input, pointing to the `id` on the `hx-field-label` host element. This works correctly across the shadow DOM boundary.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')!;
    await expect(host).toBeTruthy();
    await expect(host.id).toBe('label-patient-email');

    const input = canvasElement.querySelector('input')!;
    await expect(input.getAttribute('aria-labelledby')).toBe('label-patient-email');
  },
};

// ─────────────────────────────────────────────────
// 3. WITH FOR — same-shadow-root label association
// ─────────────────────────────────────────────────

export const WithFor: Story = {
  name: 'With For Attribute (same shadow root only)',
  render: () => html`
    <div>
      <hx-field-label for="demo-input">Patient Email</hx-field-label>
      <p
        style="margin-top: var(--hx-space-2, 0.5rem); font-size: var(--hx-font-size-xs, 0.75rem); color: var(--hx-color-neutral-500, #6b7280);"
      >
        The <code>for</code> attribute renders a native
        <code>&lt;label&gt;</code> inside shadow DOM. This only creates a
        functional association when the target input is in the <strong>same shadow root</strong>. For
        light-DOM inputs, use the <code>aria-labelledby</code> pattern instead.
      </p>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'The `for` attribute renders a native `<label for="...">` inside shadow DOM. Due to shadow DOM scoping, this only creates a label-input association when the input is in the **same shadow root**. For light-DOM inputs (the typical deployment), use the `aria-labelledby` pattern.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')!;
    const base = host.shadowRoot!.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('label');
    await expect(base?.getAttribute('for')).toBe('demo-input');
  },
};

// ─────────────────────────────────────────────────
// 4. REQUIRED
// ─────────────────────────────────────────────────

export const Required: Story = {
  name: 'Required',
  args: {
    required: true,
  },
  render: () => html` <hx-field-label required>Medical Record Number</hx-field-label> `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')! as HelixFieldLabel;
    await expect(host.hasAttribute('required')).toBe(true);

    const indicator = host.shadowRoot!.querySelector('[part="required-indicator"]');
    await expect(indicator).toBeTruthy();

    // Visual asterisk is aria-hidden
    const ariaHidden = indicator!.querySelector('[aria-hidden="true"]');
    await expect(ariaHidden).toBeTruthy();

    // Visually-hidden "required" text is available to AT
    const srText = indicator!.querySelector('.visually-hidden');
    await expect(srText).toBeTruthy();
    await expect(srText!.textContent?.trim()).toBe('required');
  },
};

// ─────────────────────────────────────────────────
// 5. OPTIONAL
// ─────────────────────────────────────────────────

export const Optional: Story = {
  name: 'Optional',
  args: {
    optional: true,
  },
  render: () => html` <hx-field-label optional>Additional Notes</hx-field-label> `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')! as HelixFieldLabel;
    await expect(host.hasAttribute('optional')).toBe(true);

    const indicator = host.shadowRoot!.querySelector('[part="optional-indicator"]');
    await expect(indicator).toBeTruthy();
    await expect(indicator!.textContent?.trim()).toBe('(optional)');
  },
};

// ─────────────────────────────────────────────────
// 6. CUSTOM REQUIRED INDICATOR (slot)
// ─────────────────────────────────────────────────

export const CustomRequiredIndicator: Story = {
  name: 'Custom Required Indicator (slot)',
  render: () => html`
    <hx-field-label required>
      Insurance ID
      <span slot="required-indicator" style="color: var(--hx-color-error-500, #ef4444);">
        (required)
      </span>
    </hx-field-label>
  `,
};

// ─────────────────────────────────────────────────
// 7. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-field-label::part(base) {
        font-size: var(--hx-font-size-xs, 0.6875rem);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--hx-color-primary-600, #0d6efd);
        font-weight: var(--hx-font-weight-bold, 700);
      }
      .parts-demo hx-field-label::part(required-indicator) {
        font-size: var(--hx-font-size-base, 1rem);
        color: var(--hx-color-error-600, #dc3545);
      }
      .parts-demo hx-field-label::part(optional-indicator) {
        font-style: italic;
        color: var(--hx-color-neutral-500, #6c757d);
      }
    </style>
    <div class="parts-demo" style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem);">
      <hx-field-label required>
        Required Field (styled via ::part)
      </hx-field-label>
      <hx-field-label optional>
        Optional Field (styled via ::part)
      </hx-field-label>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE SCENARIOS — aria-labelledby pattern
// ─────────────────────────────────────────────────

export const HealthcareFormLabels: Story = {
  name: 'Healthcare: Form Labels',
  render: () => html`
    <form style="display: flex; flex-direction: column; gap: var(--hx-space-5, 1.25rem); max-width: 400px;">
      <div>
        <hx-field-label id="label-patient-name" required>Full Name</hx-field-label>
        <input
          id="patient-name"
          type="text"
          placeholder="First Middle Last"
          required
          aria-labelledby="label-patient-name"
          style="display: block; width: 100%; margin-top: var(--hx-space-1, 0.25rem); padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem); border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: var(--hx-radius-md, 0.375rem); font-size: var(--hx-font-size-sm, 0.875rem);"
        />
      </div>

      <div>
        <hx-field-label id="label-dob" required>Date of Birth</hx-field-label>
        <input
          id="dob"
          type="date"
          required
          aria-labelledby="label-dob"
          style="display: block; width: 100%; margin-top: var(--hx-space-1, 0.25rem); padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem); border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: var(--hx-radius-md, 0.375rem); font-size: var(--hx-font-size-sm, 0.875rem);"
        />
      </div>

      <div>
        <hx-field-label id="label-pcp" optional>Primary Care Provider</hx-field-label>
        <input
          id="pcp"
          type="text"
          placeholder="Dr. Eleanor Vance, MD"
          aria-labelledby="label-pcp"
          style="display: block; width: 100%; margin-top: var(--hx-space-1, 0.25rem); padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem); border: 1px solid var(--hx-color-neutral-300, #dee2e6); border-radius: var(--hx-radius-md, 0.375rem); font-size: var(--hx-font-size-sm, 0.875rem);"
        />
      </div>
    </form>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Healthcare form labels using the `aria-labelledby` pattern — the correct approach when inputs are in light DOM outside the shadow root.',
      },
    },
  },
};

// ─────────────────────────────────────────────────
// 9. CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-6, 1.5rem);">
      <div>
        <p
          style="margin: 0 0 var(--hx-space-2, 0.5rem); font-size: var(--hx-font-size-xs, 0.75rem); color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Default
        </p>
        <hx-field-label required>Default label color</hx-field-label>
      </div>

      <div>
        <p
          style="margin: 0 0 var(--hx-space-2, 0.5rem); font-size: var(--hx-font-size-xs, 0.75rem); color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-label-color
        </p>
        <hx-field-label
          required
          style="--hx-field-label-color: var(--hx-color-primary-600, #2563eb);"
        >
          Custom brand label color
        </hx-field-label>
      </div>

      <div>
        <p
          style="margin: 0 0 var(--hx-space-2, 0.5rem); font-size: var(--hx-font-size-xs, 0.75rem); color: var(--hx-color-neutral-500, #6c757d); text-transform: uppercase; letter-spacing: 0.05em;"
        >
          --hx-field-label-required-color
        </p>
        <hx-field-label
          required
          style="--hx-field-label-required-color: var(--hx-color-warning-600, #d97706);"
        >
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
    const host = canvasElement.querySelector('hx-field-label')!;
    const base = host.shadowRoot!.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('span');
  },
};

export const LabelRenderedWithFor: Story = {
  name: 'Interaction: Renders label with for',
  render: () => html`<hx-field-label for="some-input">Patient ID</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')!;
    const base = host.shadowRoot!.querySelector('[part="base"]');
    await expect(base?.tagName.toLowerCase()).toBe('label');
    await expect(base?.getAttribute('for')).toBe('some-input');
  },
};

export const RequiredIndicatorPresent: Story = {
  name: 'Interaction: Required indicator present',
  render: () => html`<hx-field-label required>MRN</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')! as HelixFieldLabel;
    await expect(host.required).toBe(true);

    const indicator = host.shadowRoot!.querySelector('[part="required-indicator"]');
    await expect(indicator).toBeTruthy();

    // Visual asterisk is aria-hidden, with separate AT text
    const ariaHidden = indicator!.querySelector('[aria-hidden="true"]');
    await expect(ariaHidden).toBeTruthy();
  },
};

export const OptionalIndicatorPresent: Story = {
  name: 'Interaction: Optional indicator present',
  render: () => html`<hx-field-label optional>Notes</hx-field-label>`,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-field-label')! as HelixFieldLabel;
    await expect(host.optional).toBe(true);

    const indicator = host.shadowRoot!.querySelector('[part="optional-indicator"]');
    await expect(indicator).toBeTruthy();
    await expect(indicator!.textContent?.trim()).toBe('(optional)');
  },
};
