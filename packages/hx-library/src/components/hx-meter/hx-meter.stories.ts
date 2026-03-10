import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, within } from 'storybook/test';
import './hx-meter.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Meter',
  component: 'hx-meter',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number' },
      description: 'Current value of the meter.',
      table: {
        category: 'Data',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum value of the range.',
      table: {
        category: 'Data',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value of the range.',
      table: {
        category: 'Data',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    low: {
      control: { type: 'number' },
      description: 'Threshold below which value is considered suboptimal.',
      table: {
        category: 'Thresholds',
        type: { summary: 'number' },
      },
    },
    high: {
      control: { type: 'number' },
      description: 'Threshold above which value is considered suboptimal.',
      table: {
        category: 'Thresholds',
        type: { summary: 'number' },
      },
    },
    optimum: {
      control: { type: 'number' },
      description: 'Optimal value. Determines which zone is considered "good".',
      table: {
        category: 'Thresholds',
        type: { summary: 'number' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label and visible label text.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    value: 60,
    min: 0,
    max: 100,
    label: 'Storage usage',
  },
  render: (args) => html`
    <hx-meter
      value=${args.value}
      min=${args.min}
      max=${args.max}
      label=${args.label ?? ''}
      low=${ifDefined(args.low)}
      high=${ifDefined(args.high)}
      optimum=${ifDefined(args.optimum)}
    ></hx-meter>
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
    const meter = canvasElement.querySelector('hx-meter');
    await expect(meter).toBeTruthy();
    const base = meter!.shadowRoot!.querySelector('[part="base"]');
    await expect(base).toBeTruthy();
    const indicator = meter!.shadowRoot!.querySelector('[part="indicator"]');
    await expect(indicator).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. VALUE RANGES
// ─────────────────────────────────────────────────

export const Empty: Story = {
  args: { value: 0, label: 'Empty (0%)' },
};

export const Half: Story = {
  args: { value: 50, label: 'Half full (50%)' },
};

export const Full: Story = {
  args: { value: 100, label: 'Full (100%)' },
};

// ─────────────────────────────────────────────────
// 3. THRESHOLD STORIES
// ─────────────────────────────────────────────────

export const OptimumState: Story = {
  name: 'State: Optimum',
  args: {
    value: 60,
    min: 0,
    max: 100,
    low: 25,
    high: 75,
    optimum: 50,
    label: 'Memory usage (optimal)',
  },
  render: (args) => html`
    <hx-meter
      value=${args.value}
      min=${args.min}
      max=${args.max}
      low=${args.low ?? 25}
      high=${args.high ?? 75}
      optimum=${args.optimum ?? 50}
      label=${args.label ?? ''}
    ></hx-meter>
  `,
};

export const WarningState: Story = {
  name: 'State: Warning',
  args: {
    value: 80,
    min: 0,
    max: 100,
    low: 25,
    high: 75,
    optimum: 50,
    label: 'Memory usage (warning)',
  },
  render: (args) => html`
    <hx-meter
      value=${args.value}
      min=${args.min}
      max=${args.max}
      low=${args.low ?? 25}
      high=${args.high ?? 75}
      optimum=${args.optimum ?? 50}
      label=${args.label ?? ''}
    ></hx-meter>
  `,
};

export const DangerState: Story = {
  name: 'State: Danger',
  args: {
    value: 15,
    min: 0,
    max: 100,
    low: 25,
    high: 75,
    optimum: 90,
    label: 'Battery level (danger)',
  },
  render: (args) => html`
    <hx-meter
      value=${args.value}
      min=${args.min}
      max=${args.max}
      low=${args.low ?? 25}
      high=${args.high ?? 75}
      optimum=${args.optimum ?? 90}
      label=${args.label ?? ''}
    ></hx-meter>
  `,
};

// ─────────────────────────────────────────────────
// 4. CUSTOM RANGE
// ─────────────────────────────────────────────────

export const CustomRange: Story = {
  name: 'Custom Range (0–10)',
  args: {
    value: 7,
    min: 0,
    max: 10,
    label: 'Pain scale (7/10)',
  },
  render: (args) => html`
    <hx-meter
      value=${args.value}
      min=${args.min}
      max=${args.max}
      label=${args.label ?? ''}
    ></hx-meter>
  `,
};

// ─────────────────────────────────────────────────
// 5. LABELED VIA SLOT
// ─────────────────────────────────────────────────

export const LabelSlot: Story = {
  name: 'Label via slot',
  render: () => html`
    <hx-meter value="45" min="0" max="200" label="Disk usage: 45 GB of 200 GB">
      <span slot="label">Disk usage: 45 GB of 200 GB</span>
    </hx-meter>
  `,
};

// ─────────────────────────────────────────────────
// 6. ARIA-LABEL ONLY (NO VISIBLE LABEL)
// ─────────────────────────────────────────────────

export const AriaLabelOnly: Story = {
  name: 'Aria-label only (no visible label)',
  render: () => html`
    <p style="font-family: sans-serif; font-size: 0.875rem; color: #374151;">
      Patient oxygen saturation:
      <hx-meter
        value="95"
        min="0"
        max="100"
        low="90"
        high="100"
        optimum="98"
        label="Oxygen saturation: 95%"
        style="display: inline-block; width: 120px; vertical-align: middle;"
      ></hx-meter>
      95%
    </p>
    <p style="font-family: sans-serif; font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
      Use the <code>label</code> attribute (without a visible label element) for inline meters
      embedded in running text. The label is announced to screen readers but not rendered visually.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const DiskUsage: Story = {
  name: 'Disk Usage',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
      <hx-meter
        value="25"
        min="0"
        max="100"
        low="70"
        high="90"
        optimum="30"
        label="System (/): 25 GB used"
      ></hx-meter>
      <hx-meter
        value="78"
        min="0"
        max="100"
        low="70"
        high="90"
        optimum="30"
        label="Data (/data): 78 GB used"
      ></hx-meter>
      <hx-meter
        value="95"
        min="0"
        max="100"
        low="70"
        high="90"
        optimum="30"
        label="Backup (/backup): 95 GB used"
      ></hx-meter>
    </div>
  `,
};

export const HealthScore: Story = {
  name: 'Patient Health Score',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
      <hx-meter
        value="85"
        min="0"
        max="100"
        low="40"
        high="60"
        optimum="100"
        label="Cardiovascular score: 85/100"
      ></hx-meter>
      <hx-meter
        value="55"
        min="0"
        max="100"
        low="40"
        high="60"
        optimum="100"
        label="Respiratory score: 55/100"
      ></hx-meter>
      <hx-meter
        value="30"
        min="0"
        max="100"
        low="40"
        high="60"
        optimum="100"
        label="Hydration score: 30/100"
      ></hx-meter>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. NO THRESHOLDS
// ─────────────────────────────────────────────────

export const NoThresholds: Story = {
  name: 'No Thresholds (default color)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
      <hx-meter value="30" label="Progress: 30%"></hx-meter>
      <hx-meter value="60" label="Progress: 60%"></hx-meter>
      <hx-meter value="90" label="Progress: 90%"></hx-meter>
    </div>
  `,
};
