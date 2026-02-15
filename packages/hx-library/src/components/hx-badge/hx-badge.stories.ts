import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-badge.js';

const meta = {
  title: 'Components/Badge',
  component: 'hx-badge',
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
    <hx-badge
      variant=${args.variant}
      wc-size=${args.size}
      ?pill=${args.pill}
      ?pulse=${args.pulse}
    >
      ${args.label}
    </hx-badge>
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
    const badge = canvasElement.querySelector('hx-badge');
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
      <hx-badge variant="error" pulse></hx-badge>
      <hx-badge variant="success" pulse></hx-badge>
      <hx-badge variant="warning" pulse></hx-badge>
      <hx-badge variant="primary" pulse></hx-badge>
    </div>
  `,
};

// ─── All Variants ───

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-badge variant="primary">Primary</hx-badge>
      <hx-badge variant="success">Success</hx-badge>
      <hx-badge variant="warning">Warning</hx-badge>
      <hx-badge variant="error">Error</hx-badge>
      <hx-badge variant="neutral">Neutral</hx-badge>
    </div>
  `,
};

// ─── All Sizes ───

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-badge wc-size="sm">Small</hx-badge>
      <hx-badge wc-size="md">Medium</hx-badge>
      <hx-badge wc-size="lg">Large</hx-badge>
    </div>
  `,
};
