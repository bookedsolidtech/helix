import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect } from 'storybook/test';
import './hx-text.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Text',
  component: 'hx-text',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['body', 'body-sm', 'body-lg', 'label', 'label-sm', 'caption', 'code', 'overline'],
      description: 'Typography variant controlling font size, line height, and letter spacing.',
      table: {
        category: 'Typography',
        defaultValue: { summary: 'body' },
        type: {
          summary:
            "'body' | 'body-sm' | 'body-lg' | 'label' | 'label-sm' | 'caption' | 'code' | 'overline'",
        },
      },
    },
    weight: {
      control: { type: 'select' },
      options: [undefined, 'regular', 'medium', 'semibold', 'bold'],
      description: "Font weight override. When unset, uses the variant's default weight.",
      table: {
        category: 'Typography',
        type: { summary: "'regular' | 'medium' | 'semibold' | 'bold'" },
      },
    },
    color: {
      control: { type: 'select' },
      options: ['default', 'subtle', 'disabled', 'inverse', 'danger', 'success', 'warning'],
      description: 'Semantic color intent.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: {
          summary:
            "'default' | 'subtle' | 'disabled' | 'inverse' | 'danger' | 'success' | 'warning'",
        },
      },
    },
    truncate: {
      control: 'boolean',
      description: 'Clips text to a single line with an ellipsis overflow.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    lines: {
      control: { type: 'number', min: 0 },
      description: 'Maximum number of lines before clamping with ellipsis. 0 disables clamping.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    as: {
      control: { type: 'select' },
      options: ['span', 'p', 'strong', 'em', 'div'],
      description:
        'The HTML element to render as the inner base element. Use to produce semantically appropriate markup.',
      table: {
        category: 'Semantic',
        defaultValue: { summary: 'span' },
        type: { summary: "'span' | 'p' | 'strong' | 'em' | 'div'" },
      },
    },
    content: {
      control: 'text',
      description: 'Text content (passed via default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'body',
    color: 'default',
    truncate: false,
    lines: 0,
    as: 'span',
    content: 'The quick brown fox jumps over the lazy dog.',
  },
  render: (args) => html`
    <hx-text
      variant=${args.variant}
      ?truncate=${args.truncate}
      lines=${args.lines > 0 ? args.lines : 0}
      color=${args.color}
      weight=${ifDefined(args.weight)}
      as=${args.as}
    >
      ${args.content}
    </hx-text>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    content: 'Patient charts updated successfully.',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text')!;
    const base = host.shadowRoot!.querySelector('[part="base"]')!;
    await expect(base).toBeInTheDocument();
    await expect(base.textContent?.trim()).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. TYPE SCALE — All variants
// ─────────────────────────────────────────────────

export const TypeScale: Story = {
  name: 'Type Scale',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 640px;">
      <div>
        <hx-text variant="overline" color="subtle">Overline</hx-text>
        <br />
        <hx-text variant="overline">Section Label</hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">body-lg</hx-text>
        <br />
        <hx-text variant="body-lg">
          Patient information has been successfully updated in the system.
        </hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">body</hx-text>
        <br />
        <hx-text variant="body"
          >Review the patient's current medications before proceeding.</hx-text
        >
      </div>
      <div>
        <hx-text variant="caption" color="subtle">body-sm</hx-text>
        <br />
        <hx-text variant="body-sm">Last updated: March 6, 2026 at 9:41 AM</hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">label</hx-text>
        <br />
        <hx-text variant="label">Date of Birth</hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">label-sm</hx-text>
        <br />
        <hx-text variant="label-sm">Required field</hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">caption</hx-text>
        <br />
        <hx-text variant="caption">This field is used for insurance verification purposes.</hx-text>
      </div>
      <div>
        <hx-text variant="caption" color="subtle">code</hx-text>
        <br />
        <hx-text variant="code">ICD-10: J45.901</hx-text>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Body: Story = {
  args: { variant: 'body', content: "Review the patient's current medications before proceeding." },
};

export const BodySm: Story = {
  name: 'Body Small',
  args: { variant: 'body-sm', content: 'Last updated: March 6, 2026 at 9:41 AM' },
};

export const BodyLg: Story = {
  name: 'Body Large',
  args: {
    variant: 'body-lg',
    content: 'Patient information has been successfully updated in the system.',
  },
};

export const Label: Story = {
  args: { variant: 'label', content: 'Date of Birth' },
};

export const LabelSm: Story = {
  name: 'Label Small',
  args: { variant: 'label-sm', content: 'Required field' },
};

export const Caption: Story = {
  args: {
    variant: 'caption',
    content: 'This field is used for insurance verification purposes.',
  },
};

export const Code: Story = {
  args: { variant: 'code', content: 'ICD-10: J45.901' },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text')!;
    const base = host.shadowRoot!.querySelector('[part="base"]')!;
    await expect(base).toBeInTheDocument();
    await expect(base.classList.contains('text--code')).toBe(true);
  },
};

export const Overline: Story = {
  args: { variant: 'overline', content: 'Patient Summary' },
};

// ─────────────────────────────────────────────────
// 4. ALL COLORS
// ─────────────────────────────────────────────────

export const AllColors: Story = {
  name: 'All Colors',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <hx-text color="default">Default — Primary content text</hx-text>
      <hx-text color="subtle">Subtle — Secondary or supporting text</hx-text>
      <hx-text color="disabled">Disabled — Inactive or unavailable text</hx-text>
      <div style="background: #1e293b; padding: 0.5rem 0.75rem; border-radius: 0.25rem;">
        <hx-text color="inverse">Inverse — Text on dark backgrounds</hx-text>
      </div>
      <hx-text color="danger">Danger — Error or critical alert text</hx-text>
      <hx-text color="success">Success — Confirmation or positive status text</hx-text>
      <hx-text color="warning">Warning — Caution or advisory text</hx-text>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. WEIGHT OVERRIDES
// ─────────────────────────────────────────────────

export const WeightOverrides: Story = {
  name: 'Weight Overrides',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      <hx-text weight="regular">Regular (400) — Patient Name: Jane Doe</hx-text>
      <hx-text weight="medium">Medium (500) — Patient Name: Jane Doe</hx-text>
      <hx-text weight="semibold">Semibold (600) — Patient Name: Jane Doe</hx-text>
      <hx-text weight="bold">Bold (700) — Patient Name: Jane Doe</hx-text>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. TRUNCATION
// ─────────────────────────────────────────────────

export const Truncate: Story = {
  render: () => html`
    <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 1rem;">
      <hx-text truncate>
        Patient: John Alexander Smith — Admitted 2026-01-15 — Diagnosis: Acute respiratory failure
        with hypoxia
      </hx-text>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-text')!;
    const base = host.shadowRoot!.querySelector('[part="base"]')!;
    await expect(base).toBeInTheDocument();
    await expect(base.classList.contains('text--truncate')).toBe(true);
  },
};

export const MultiLineClamp: Story = {
  name: 'Multi-line Clamp',
  render: () => html`
    <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 1rem;">
      <hx-text lines="3">
        Patient: John Alexander Smith — Admitted 2026-01-15 — Diagnosis: Acute respiratory failure
        with hypoxia. The patient was admitted via the emergency department following a rapid
        decline in oxygen saturation. Family has been notified and is present at bedside.
      </hx-text>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientRecord: Story = {
  name: 'Patient Record Label/Value',
  render: () => html`
    <div
      style="display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.5rem; max-width: 480px;"
    >
      <hx-text variant="label-sm" color="subtle">Patient Name</hx-text>
      <hx-text variant="body">Jane Marie Doe</hx-text>

      <hx-text variant="label-sm" color="subtle">Date of Birth</hx-text>
      <hx-text variant="body">March 12, 1985</hx-text>

      <hx-text variant="label-sm" color="subtle">MRN</hx-text>
      <hx-text variant="code">MRN-00123456</hx-text>

      <hx-text variant="label-sm" color="subtle">Admission Status</hx-text>
      <hx-text variant="body" color="success" weight="semibold">Active — Inpatient</hx-text>

      <hx-text variant="label-sm" color="subtle">Allergy Alert</hx-text>
      <hx-text variant="body" color="danger" weight="semibold">Penicillin — Severe</hx-text>

      <hx-text variant="label-sm" color="subtle">Notes</hx-text>
      <hx-text variant="caption" color="subtle">Last reviewed by Dr. Rivera on 2026-03-05</hx-text>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. SEMANTIC ELEMENT OVERRIDE (as prop)
// ─────────────────────────────────────────────────

export const SemanticAs: Story = {
  name: 'Semantic Element (as)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <hx-text as="span" variant="body">Default span — inline content</hx-text>
      <hx-text as="p" variant="body">Paragraph — block-level body text for prose content.</hx-text>
      <hx-text as="strong" variant="label" weight="semibold">Strong — important label text</hx-text>
      <hx-text as="em" variant="body" color="subtle">Em — emphasized supporting text</hx-text>
      <hx-text as="div" variant="body-lg">Div — block container for rich content areas</hx-text>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. DRUPAL / CDN INTEGRATION REFERENCE
// ─────────────────────────────────────────────────

/**
 * Drupal Twig integration reference.
 *
 * Load the component via CDN in your Drupal theme's page.html.twig or a library definition:
 *   <script type="module" src="https://cdn.example.com/@helixui/library/hx-text.js"></script>
 *
 * Basic usage in Twig:
 *   <hx-text variant="body" color="default">{{ patient.name }}</hx-text>
 *   <hx-text variant="label" weight="semibold">Date of Birth</hx-text>
 *   <hx-text variant="caption" color="subtle">{{ node.field_last_reviewed }}</hx-text>
 *
 * Boolean attributes (truncate) — include attribute to enable, omit to disable:
 *   <hx-text truncate>{{ long_patient_note }}</hx-text>
 *
 * Numeric attribute (lines) — pass as a string; the component coerces to number:
 *   <hx-text lines="3">{{ clinical_summary }}</hx-text>
 *
 * Semantic element override:
 *   <hx-text as="p" variant="body">{{ body_text }}</hx-text>
 *   <hx-text as="strong" variant="label">{{ field_label }}</hx-text>
 */
export const DrupalIntegration: Story = {
  name: 'Drupal / CDN Integration',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 560px;">
      <div>
        <hx-text variant="overline" color="subtle">Basic attribute usage</hx-text>
        <br />
        <hx-text variant="body" color="default">Patient: Jane Marie Doe</hx-text>
      </div>

      <div>
        <hx-text variant="overline" color="subtle">Boolean attribute (truncate)</hx-text>
        <br />
        <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 0.75rem;">
          <hx-text truncate>
            Long clinical summary that exceeds container width and clips with ellipsis
          </hx-text>
        </div>
      </div>

      <div>
        <hx-text variant="overline" color="subtle">Numeric attribute (lines="3")</hx-text>
        <br />
        <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 0.75rem;">
          <hx-text lines="3">
            Patient admitted via emergency department following rapid decline in oxygen saturation.
            Family has been notified and is present at bedside. Attending physician has ordered
            further tests.
          </hx-text>
        </div>
      </div>

      <div>
        <hx-text variant="overline" color="subtle">Semantic element (as="p")</hx-text>
        <br />
        <hx-text as="p" variant="body">
          This renders as a paragraph element for block-level prose content in Twig templates.
        </hx-text>
      </div>
    </div>
  `,
};
