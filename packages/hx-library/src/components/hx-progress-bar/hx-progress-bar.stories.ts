import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
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
      description: 'Current progress value (min–max). Set to null for indeterminate state.',
      table: {
        category: 'State',
        defaultValue: { summary: 'null' },
        type: { summary: 'number | null' },
      },
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum value for the progress bar.',
      table: {
        category: 'State',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
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
    indeterminate: {
      control: 'boolean',
      description: 'When true, shows an animated indeterminate loading state regardless of value.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label for the progress bar (maps to aria-label). Use when no visible label slot is provided.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: 'Additional description linked via aria-describedby (visually hidden).',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    'hx-size': {
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
    min: 0,
    max: 100,
    indeterminate: false,
    label: '',
    description: '',
    'hx-size': 'md',
    variant: 'default',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

/**
 * Default story using the label slot for visible text.
 * The component automatically links the slot to `aria-labelledby` — no need to
 * duplicate the label as an `aria-label` attribute when using the slot.
 */
export const Default: Story = {
  render: (args) => html`
    <hx-progress-bar
      .value=${args.value}
      .max=${args.max}
      hx-size=${args['hx-size']}
      variant=${args.variant}
    >
      <span slot="label">Upload progress</span>
    </hx-progress-bar>
  `,
};

export const Indeterminate: Story = {
  args: {
    value: null,
    indeterminate: false,
    label: 'Loading…',
  },
  render: (args) => html`
    <hx-progress-bar
      .value=${args.value}
      label=${args.label}
      hx-size=${args['hx-size']}
      variant=${args.variant}
    >
    </hx-progress-bar>
  `,
};

/**
 * Demonstrates the canonical `aria-labelledby` usage pattern:
 * use the label slot for the visible label and rely on the component's
 * built-in `aria-labelledby` wiring — no redundant `label` attribute needed.
 */
export const WithAriaLabelledBy: Story = {
  args: {
    value: 45,
    label: '',
  },
  render: (args) => html`
    <div style="width: 400px;">
      <hx-progress-bar .value=${args.value} hx-size=${args['hx-size']} variant=${args.variant}>
        <span slot="label">Files uploaded: ${args.value} of ${args.max}</span>
      </hx-progress-bar>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 400px;">
      <hx-progress-bar value="75" variant="default">
        <span slot="label">Default — 75%</span>
      </hx-progress-bar>
      <hx-progress-bar value="100" variant="success">
        <span slot="label">Success — 100%</span>
      </hx-progress-bar>
      <hx-progress-bar value="50" variant="warning">
        <span slot="label">Warning — 50%</span>
      </hx-progress-bar>
      <hx-progress-bar value="25" variant="danger">
        <span slot="label">Danger — 25%</span>
      </hx-progress-bar>
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 400px;">
      <hx-progress-bar value="60" hx-size="sm">
        <span slot="label">Small</span>
      </hx-progress-bar>
      <hx-progress-bar value="60" hx-size="md">
        <span slot="label">Medium (default)</span>
      </hx-progress-bar>
      <hx-progress-bar value="60" hx-size="lg">
        <span slot="label">Large</span>
      </hx-progress-bar>
    </div>
  `,
};

export const ZeroProgress: Story = {
  args: {
    value: 0,
  },
  render: (args) => html`
    <hx-progress-bar value=${args.value} hx-size=${args['hx-size']}>
      <span slot="label">Not started</span>
    </hx-progress-bar>
  `,
};

export const Complete: Story = {
  args: {
    value: 100,
    variant: 'success',
  },
  render: (args) => html`
    <hx-progress-bar value=${args.value} variant=${args.variant} hx-size=${args['hx-size']}>
      <span slot="label">Upload complete</span>
    </hx-progress-bar>
  `,
};

/**
 * Demonstrates the `hx-complete` event dispatched when the progress value reaches 100%.
 * Use this event to trigger downstream actions such as showing a confirmation toast,
 * enabling a submit button, or navigating to the next step in a workflow.
 */
export const CompleteEventDemo: Story = {
  name: 'Events: hx-complete',
  render: () => html`
    <div style="width: 400px;">
      <hx-progress-bar id="complete-demo" value="75" label="File upload progress">
        <span slot="label">File upload progress</span>
      </hx-progress-bar>
      <p
        id="complete-event-output"
        style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;"
      >
        The hx-complete event fires when value reaches 100%.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    let completeFired = false;
    bar!.addEventListener('hx-complete', () => {
      completeFired = true;
    });

    // Set value to 100 to trigger the hx-complete event
    (bar as { value: number }).value = 100;

    // Allow Lit's updated lifecycle to run
    await bar!.updateComplete;

    await expect(completeFired).toBe(true);
  },
};
