import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-progress-ring.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ProgressRing',
  component: 'hx-progress-ring',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Progress value (0–100). Clear the field for indeterminate mode.',
      table: {
        category: 'State',
        type: { summary: 'number | null' },
        defaultValue: { summary: 'null' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the ring. Controls SVG diameter.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    strokeWidth: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Stroke width of the ring circles in SVG user units.',
      table: {
        category: 'Visual',
        defaultValue: { summary: '4' },
        type: { summary: 'number' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Semantic color variant.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'success' | 'warning' | 'danger'" },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label exposed as aria-label on the host element.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    value: 65,
    size: 'md',
    strokeWidth: 4,
    variant: 'default',
    label: 'Loading progress',
  },
  render: (args) => html`
    <hx-progress-ring
      .value=${args.value != null ? args.value : null}
      size=${args.size}
      stroke-width=${args.strokeWidth}
      variant=${args.variant}
      label=${args.label}
    >
      ${args.value != null ? html`<span>${args.value}%</span>` : ''}
    </hx-progress-ring>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    value: 65,
    label: 'Task completion: 65%',
  },
  render: (args) => html`
    <hx-progress-ring
      value=${args.value}
      size=${args.size}
      stroke-width=${args.strokeWidth}
      variant=${args.variant}
      label=${args.label}
    >
      <span style="font-size: 0.75rem; font-weight: 600;">${args.value}%</span>
    </hx-progress-ring>
  `,
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const ring = canvasElement.querySelector('hx-progress-ring');
    await expect(ring).toBeTruthy();
    await expect(ring!.getAttribute('role')).toBe('progressbar');
    await expect(ring!.getAttribute('aria-valuenow')).toBe('65');
  },
};

// ─────────────────────────────────────────────────
// 2. INDETERMINATE
// ─────────────────────────────────────────────────

export const Indeterminate: Story = {
  name: 'Indeterminate (value=null)',
  render: () => html`
    <hx-progress-ring size="md" label="Loading, please wait"></hx-progress-ring>
  `,
  play: async ({ canvasElement }) => {
    const ring = canvasElement.querySelector('hx-progress-ring');
    await expect(ring).toBeTruthy();
    await expect(ring!.hasAttribute('indeterminate')).toBe(true);
    await expect(ring!.hasAttribute('aria-valuenow')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 3. VALUE VARIANTS — 0%, 25%, 50%, 75%, 100%
// ─────────────────────────────────────────────────

export const ValueVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
      ${[0, 25, 50, 75, 100].map(
        (v) => html`
          <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <hx-progress-ring value=${v} label=${`${v}% complete`}>
              <span style="font-size: 0.75rem; font-weight: 600;">${v}%</span>
            </hx-progress-ring>
            <span style="font-size: 0.75rem; color: #6b7280;">${v}%</span>
          </div>
        `,
      )}
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. SIZE VARIANTS
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: { size: 'sm', value: 65 },
};

export const Medium: Story = {
  args: { size: 'md', value: 65 },
};

export const Large: Story = {
  args: { size: 'lg', value: 65 },
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring size="sm" value="65" label="Small progress ring"></hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring size="md" value="65" label="Medium progress ring">
          <span style="font-size: 0.75rem; font-weight: 600;">65%</span>
        </hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring size="lg" value="65" label="Large progress ring">
          <span style="font-size: 0.875rem; font-weight: 600;">65%</span>
        </hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. VARIANT COLORS
// ─────────────────────────────────────────────────

export const VariantDefault: Story = {
  args: { variant: 'default', value: 65 },
};

export const VariantSuccess: Story = {
  args: { variant: 'success', value: 100, label: 'Complete' },
  render: (args) => html`
    <hx-progress-ring value=${args.value} variant="success" label=${args.label}>
      <span style="font-size: 0.75rem; font-weight: 600; color: #16a34a;">100%</span>
    </hx-progress-ring>
  `,
};

export const VariantWarning: Story = {
  args: { variant: 'warning', value: 45, label: 'Approaching limit' },
  render: (args) => html`
    <hx-progress-ring value=${args.value} variant="warning" label=${args.label}>
      <span style="font-size: 0.75rem; font-weight: 600; color: #d97706;">${args.value}%</span>
    </hx-progress-ring>
  `,
};

export const VariantDanger: Story = {
  args: { variant: 'danger', value: 90, label: 'Critical threshold' },
  render: (args) => html`
    <hx-progress-ring value=${args.value} variant="danger" label=${args.label}>
      <span style="font-size: 0.75rem; font-weight: 600; color: #dc2626;">${args.value}%</span>
    </hx-progress-ring>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring variant="default" value="65" label="Default variant"></hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">default</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring variant="success" value="100" label="Success variant"></hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">success</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring variant="warning" value="45" label="Warning variant"></hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">warning</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-progress-ring variant="danger" value="90" label="Danger variant"></hx-progress-ring>
        <span style="font-size: 0.75rem; color: #6b7280;">danger</span>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientFormCompletion: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 320px;">
      <p style="margin: 0; font-weight: 600;">Patient Intake Form</p>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <hx-progress-ring value="40" size="lg" variant="default" label="Form completion: 40%">
          <span style="font-size: 0.875rem; font-weight: 700;">40%</span>
        </hx-progress-ring>
        <div>
          <p style="margin: 0; font-weight: 600;">2 of 5 sections complete</p>
          <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Demographics, Insurance</p>
        </div>
      </div>
    </div>
  `,
};

export const LabResultUpload: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 280px; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <p style="margin: 0; font-weight: 600;">Uploading Lab Results</p>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <hx-progress-ring size="md" label="Uploading, please wait"></hx-progress-ring>
        <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Processing...</p>
      </div>
    </div>
  `,
};

export const MedicationAdherence: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; min-width: 100px;"
      >
        <hx-progress-ring value="92" variant="success" size="lg" label="Adherence: 92%">
          <span style="font-size: 0.875rem; font-weight: 700; color: #16a34a;">92%</span>
        </hx-progress-ring>
        <span style="font-size: 0.75rem; font-weight: 600; color: #16a34a;">Excellent</span>
        <span style="font-size: 0.75rem; color: #6b7280;">Metformin</span>
      </div>
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; min-width: 100px;"
      >
        <hx-progress-ring value="67" variant="warning" size="lg" label="Adherence: 67%">
          <span style="font-size: 0.875rem; font-weight: 700; color: #d97706;">67%</span>
        </hx-progress-ring>
        <span style="font-size: 0.75rem; font-weight: 600; color: #d97706;">Fair</span>
        <span style="font-size: 0.75rem; color: #6b7280;">Lisinopril</span>
      </div>
      <div
        style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; min-width: 100px;"
      >
        <hx-progress-ring value="28" variant="danger" size="lg" label="Adherence: 28%">
          <span style="font-size: 0.875rem; font-weight: 700; color: #dc2626;">28%</span>
        </hx-progress-ring>
        <span style="font-size: 0.75rem; font-weight: 600; color: #dc2626;">Poor</span>
        <span style="font-size: 0.75rem; color: #6b7280;">Atorvastatin</span>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. EDGE CASES
// ─────────────────────────────────────────────────

export const ZeroValue: Story = {
  args: { value: 0, label: 'Not started' },
};

export const FullValue: Story = {
  args: { value: 100, variant: 'success', label: 'Complete' },
};

export const CustomStrokeWidth: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <hx-progress-ring value="65" stroke-width="2" label="Thin stroke"></hx-progress-ring>
      <hx-progress-ring value="65" stroke-width="4" label="Default stroke"></hx-progress-ring>
      <hx-progress-ring value="65" stroke-width="8" label="Thick stroke"></hx-progress-ring>
      <hx-progress-ring value="65" stroke-width="12" label="Very thick stroke"></hx-progress-ring>
    </div>
  `,
};
