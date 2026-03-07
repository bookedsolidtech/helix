import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-spinner.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Spinner',
  component: 'hx-spinner',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'text',
      description:
        "Size of the spinner. Use token values 'sm' | 'md' | 'lg' for standard sizing, or any valid CSS size string (e.g. '3rem', '48px') for custom sizes.",
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg' | string" },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'primary', 'inverted'],
      description: 'Visual color variant of the spinner.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'primary' | 'inverted'" },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label announced to screen readers.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Loading' },
        type: { summary: 'string' },
      },
    },
    decorative: {
      control: 'boolean',
      description:
        'When true, suppresses all ARIA announcements (role="presentation", no aria-label). Use when the spinner appears alongside visible loading text.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    size: 'md',
    variant: 'default',
    label: 'Loading',
    decorative: false,
  },
  render: (args) => html`
    <hx-spinner
      size=${args.size}
      variant=${args.variant}
      label=${args.label}
      ?decorative=${args.decorative}
    ></hx-spinner>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const spinner = canvasElement.querySelector('hx-spinner');
    await expect(spinner).toBeTruthy();
    const base = spinner!.shadowRoot!.querySelector('[part="base"]');
    await expect(base).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. SIZE STORIES
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: { size: 'sm' },
};

export const Medium: Story = {
  args: { size: 'md' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const CustomSize: Story = {
  name: 'Custom Size (3rem)',
  args: { size: '3rem' },
};

// ─────────────────────────────────────────────────
// 3. VARIANT STORIES
// ─────────────────────────────────────────────────

export const DefaultVariant: Story = {
  name: 'Variant: Default',
  args: { variant: 'default' },
};

export const PrimaryVariant: Story = {
  name: 'Variant: Primary',
  args: { variant: 'primary' },
};

export const InvertedVariant: Story = {
  name: 'Variant: Inverted',
  render: () => html`
    <div
      style="background: var(--hx-color-primary-500, #2563eb); padding: 1.5rem; border-radius: 0.5rem; display: inline-flex;"
    >
      <hx-spinner variant="inverted" label="Loading"></hx-spinner>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. ALL SIZES × VARIANTS
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <hx-spinner size="sm" label="Loading small"></hx-spinner>
      <hx-spinner size="md" label="Loading medium"></hx-spinner>
      <hx-spinner size="lg" label="Loading large"></hx-spinner>
    </div>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner variant="default" label="Loading"></hx-spinner>
        <small>default</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner variant="primary" label="Loading"></hx-spinner>
        <small>primary</small>
      </div>
      <div
        style="background: var(--hx-color-primary-500, #2563eb); padding: 0.75rem; border-radius: 0.375rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;"
      >
        <hx-spinner variant="inverted" label="Loading"></hx-spinner>
        <small style="color: white;">inverted</small>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. CUSTOM LABEL
// ─────────────────────────────────────────────────

export const CustomLabel: Story = {
  args: { label: 'Saving patient record' },
};

export const Decorative: Story = {
  name: 'Decorative (with visible text)',
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; max-width: 320px;"
    >
      <hx-spinner size="sm" variant="primary" decorative></hx-spinner>
      <span style="color: #374151; font-size: 0.875rem;">Saving patient record...</span>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const InlineLoading: Story = {
  name: 'Inline Loading State',
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; max-width: 320px;"
    >
      <hx-spinner size="sm" variant="primary" label="Loading patient data"></hx-spinner>
      <span style="color: #374151; font-size: 0.875rem;">Fetching patient records...</span>
    </div>
  `,
};

export const OverlayLoading: Story = {
  name: 'Overlay Loading State',
  render: () => html`
    <div
      style="position: relative; width: 320px; height: 160px; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <div style="padding: 1.5rem; filter: blur(2px);">
        <h3 style="margin: 0 0 0.5rem;">Patient Chart</h3>
        <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Loading clinical data...</p>
      </div>
      <div
        style="position: absolute; inset: 0; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;"
      >
        <hx-spinner size="lg" variant="primary" label="Loading patient chart"></hx-spinner>
      </div>
    </div>
  `,
};

export const ButtonWithSpinner: Story = {
  name: 'Alongside hx-button (loading state)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <hx-spinner size="sm" variant="primary" label="Submitting form"></hx-spinner>
        <span style="font-size: 0.875rem; color: #374151;">Submitting prior authorization...</span>
      </div>
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">
        The spinner can be used standalone or alongside other components to indicate loading.
      </p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner
          style="--hx-spinner-color: #059669; --hx-spinner-track-color: #d1fae5;"
          label="Loading"
        ></hx-spinner>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-spinner-color: #059669</code>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner
          style="--hx-spinner-color: #7c3aed; --hx-spinner-track-color: #ede9fe;"
          label="Loading"
        ></hx-spinner>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-spinner-color: #7c3aed</code>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner
          style="--hx-spinner-color: #dc2626; --hx-spinner-track-color: #fee2e2;"
          label="Loading"
        ></hx-spinner>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-spinner-color: #dc2626</code>
      </div>
    </div>
  `,
};
