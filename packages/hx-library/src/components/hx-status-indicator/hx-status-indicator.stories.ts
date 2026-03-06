import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-status-indicator.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/StatusIndicator',
  component: 'hx-status-indicator',
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['online', 'offline', 'away', 'busy', 'unknown'],
      description: 'The status to display.',
      table: {
        category: 'Status',
        defaultValue: { summary: 'unknown' },
        type: { summary: "'online' | 'offline' | 'away' | 'busy' | 'unknown'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the indicator dot.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    pulse: {
      control: 'boolean',
      description: 'Whether to show an animated pulse ring.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Custom accessible label. Defaults to "Status: {Status}".',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    status: 'online',
    size: 'md',
    pulse: false,
    label: '',
  },
  render: (args) => html`
    <hx-status-indicator
      status=${args.status}
      size=${args.size}
      ?pulse=${args.pulse}
      label=${args.label ?? ''}
    ></hx-status-indicator>
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
    const el = canvasElement.querySelector('hx-status-indicator');
    await expect(el).toBeTruthy();
    const base = el!.shadowRoot!.querySelector('[part="base"]');
    await expect(base).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. STATUS STORIES
// ─────────────────────────────────────────────────

export const Online: Story = {
  args: { status: 'online' },
};

export const Offline: Story = {
  args: { status: 'offline' },
};

export const Away: Story = {
  args: { status: 'away' },
};

export const Busy: Story = {
  args: { status: 'busy' },
};

export const Unknown: Story = {
  args: { status: 'unknown' },
};

// ─────────────────────────────────────────────────
// 3. PULSE DEMO
// ─────────────────────────────────────────────────

export const PulseDemo: Story = {
  name: 'Pulse Animation',
  args: { status: 'online', pulse: true },
};

export const PulseBusy: Story = {
  name: 'Pulse: Busy',
  args: { status: 'busy', pulse: true },
};

// ─────────────────────────────────────────────────
// 4. ALL STATUSES
// ─────────────────────────────────────────────────

export const AllStatuses: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="online" size="md"></hx-status-indicator>
        <small>online</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="offline" size="md"></hx-status-indicator>
        <small>offline</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="away" size="md"></hx-status-indicator>
        <small>away</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="busy" size="md"></hx-status-indicator>
        <small>busy</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="unknown" size="md"></hx-status-indicator>
        <small>unknown</small>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. ALL SIZES
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="online" size="sm"></hx-status-indicator>
        <small>sm</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="online" size="md"></hx-status-indicator>
        <small>md</small>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="online" size="lg"></hx-status-indicator>
        <small>lg</small>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const SystemHealthDashboard: Story = {
  name: 'System Health Dashboard',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; max-width: 320px;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="online" size="sm" pulse></hx-status-indicator>
        <span style="font-size: 0.875rem;">EHR System — Online</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="away" size="sm"></hx-status-indicator>
        <span style="font-size: 0.875rem;">Lab Interface — Degraded</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="offline" size="sm"></hx-status-indicator>
        <span style="font-size: 0.875rem;">Imaging System — Offline</span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <hx-status-indicator status="busy" size="sm" pulse></hx-status-indicator>
        <span style="font-size: 0.875rem;">Claims Processing — Busy</span>
      </div>
    </div>
  `,
};

export const DecorativeUsage: Story = {
  name: 'Decorative (aria-hidden)',
  render: () => html`
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <hx-status-indicator status="online" size="sm" aria-hidden="true"></hx-status-indicator>
      <span>Provider is available</span>
    </div>
  `,
};
