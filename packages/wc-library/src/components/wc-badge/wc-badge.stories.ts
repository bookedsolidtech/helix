import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './wc-badge.js';

const meta = {
  title: 'Components/Badge',
  component: 'wc-badge',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'success', 'warning', 'error', 'neutral'],
      description: 'Visual style variant of the badge.',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge.',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    pill: {
      control: 'boolean',
      description: 'Whether the badge uses fully rounded (pill) styling.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    pulse: {
      control: 'boolean',
      description: 'Whether the badge displays an animated pulse for attention.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    label: {
      control: 'text',
      description: 'Badge label text (passed via default slot).',
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    pill: false,
    pulse: false,
    label: 'Badge',
  },
  render: (args) => html`
    <wc-badge
      variant=${args.variant}
      wc-size=${args.size}
      ?pill=${args.pill}
      ?pulse=${args.pulse}
    >
      ${args.label}
    </wc-badge>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Primary Variant ───

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('wc-badge');
    expect(badge).toBeTruthy();
    expect(badge?.shadowRoot?.querySelector('span')).toBeTruthy();
  },
};

// ─── Success Variant ───

export const Success: Story = {
  args: {
    variant: 'success',
    label: 'Success',
  },
};

// ─── Warning Variant ───

export const Warning: Story = {
  args: {
    variant: 'warning',
    label: 'Warning',
  },
};

// ─── Error Variant ───

export const Error: Story = {
  args: {
    variant: 'error',
    label: 'Error',
  },
};

// ─── Neutral Variant ───

export const Neutral: Story = {
  args: {
    variant: 'neutral',
    label: 'Neutral',
  },
};

// ─── Small Size ───

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small',
  },
};

// ─── Large Size ───

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large',
  },
};

// ─── Pill Mode ───

export const Pill: Story = {
  args: {
    pill: true,
    label: '42',
  },
};

// ─── Pulsing ───

export const Pulsing: Story = {
  args: {
    pulse: true,
    variant: 'error',
    label: '3',
  },
};

// ─── Dot Indicator (empty + pulse) ───

export const DotIndicator: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <wc-badge variant="error" pulse></wc-badge>
      <wc-badge variant="success" pulse></wc-badge>
      <wc-badge variant="warning" pulse></wc-badge>
      <wc-badge variant="primary" pulse></wc-badge>
    </div>
  `,
};

// ─── All Variants ───

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <wc-badge variant="primary">Primary</wc-badge>
      <wc-badge variant="success">Success</wc-badge>
      <wc-badge variant="warning">Warning</wc-badge>
      <wc-badge variant="error">Error</wc-badge>
      <wc-badge variant="neutral">Neutral</wc-badge>
    </div>
  `,
};

// ─── All Sizes ───

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <wc-badge wc-size="sm">Small</wc-badge>
      <wc-badge wc-size="md">Medium</wc-badge>
      <wc-badge wc-size="lg">Large</wc-badge>
    </div>
  `,
};
