import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './index.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ProgressBar',
  component: 'hx-progress-bar',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100 },
      description:
        'Current progress value (0–max). Set to null for indeterminate state.',
      table: {
        category: 'State',
        defaultValue: { summary: 'null' },
        type: { summary: 'number | null' },
      },
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum value for the progress bar.',
      table: {
        category: 'State',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the progress bar (maps to aria-label).',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the progress bar track.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Visual variant controlling the indicator color.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'success' | 'warning' | 'danger'" },
      },
    },
  },
  args: {
    value: 60,
    max: 100,
    label: 'Upload progress',
    size: 'md',
    variant: 'default',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-progress-bar
      .value=${args.value}
      .max=${args.max}
      label=${args.label}
      hx-size=${args.size}
      variant=${args.variant}
    >
      <span slot="label">${args.label}</span>
    </hx-progress-bar>
  `,
};

export const Indeterminate: Story = {
  args: {
    value: null,
    label: 'Loading…',
  },
  render: (args) => html`
    <hx-progress-bar
      .value=${args.value}
      label=${args.label}
      hx-size=${args.size}
      variant=${args.variant}
    >
      <span slot="label">${args.label}</span>
    </hx-progress-bar>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 400px;">
      <hx-progress-bar value="75" label="Default" variant="default">
        <span slot="label">Default — 75%</span>
      </hx-progress-bar>
      <hx-progress-bar value="100" label="Success" variant="success">
        <span slot="label">Success — 100%</span>
      </hx-progress-bar>
      <hx-progress-bar value="50" label="Warning" variant="warning">
        <span slot="label">Warning — 50%</span>
      </hx-progress-bar>
      <hx-progress-bar value="25" label="Danger" variant="danger">
        <span slot="label">Danger — 25%</span>
      </hx-progress-bar>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 400px;">
      <hx-progress-bar value="60" label="Small" hx-size="sm">
        <span slot="label">Small</span>
      </hx-progress-bar>
      <hx-progress-bar value="60" label="Medium" hx-size="md">
        <span slot="label">Medium (default)</span>
      </hx-progress-bar>
      <hx-progress-bar value="60" label="Large" hx-size="lg">
        <span slot="label">Large</span>
      </hx-progress-bar>
    </div>
  `,
};

export const ZeroProgress: Story = {
  args: {
    value: 0,
    label: 'Not started',
  },
  render: (args) => html`
    <hx-progress-bar value=${args.value} label=${args.label} hx-size=${args.size}>
      <span slot="label">${args.label}</span>
    </hx-progress-bar>
  `,
};

export const Complete: Story = {
  args: {
    value: 100,
    variant: 'success',
    label: 'Upload complete',
  },
  render: (args) => html`
    <hx-progress-bar
      value=${args.value}
      variant=${args.variant}
      label=${args.label}
      hx-size=${args.size}
    >
      <span slot="label">${args.label}</span>
    </hx-progress-bar>
  `,
};
