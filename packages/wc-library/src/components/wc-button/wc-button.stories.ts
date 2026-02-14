import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './wc-button.js';

const meta = {
  title: 'Components/Button',
  component: 'wc-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
      description: 'Visual style variant of the button.',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button.',
      table: {
        defaultValue: { summary: 'md' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'The type attribute for the underlying button element.',
      table: {
        defaultValue: { summary: 'button' },
      },
    },
    label: {
      control: 'text',
      description: 'Button label text (passed via default slot).',
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    type: 'button',
    label: 'Click Me',
  },
  render: (args) => html`
    <wc-button
      variant=${args.variant}
      size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${args.label}
    </wc-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Primary Variant ───

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Primary Button',
  },
};

// ─── Secondary Variant ───

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Secondary Button',
  },
};

// ─── Ghost Variant ───

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Ghost Button',
  },
};

// ─── Sizes ───

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Small Button',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large Button',
  },
};

// ─── Disabled State ───

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled Button',
  },
};

// ─── All Variants ───

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <wc-button variant="primary">Primary</wc-button>
      <wc-button variant="secondary">Secondary</wc-button>
      <wc-button variant="ghost">Ghost</wc-button>
      <wc-button variant="primary" disabled>Disabled</wc-button>
    </div>
  `,
};

// ─── All Sizes ───

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <wc-button size="sm">Small</wc-button>
      <wc-button size="md">Medium</wc-button>
      <wc-button size="lg">Large</wc-button>
    </div>
  `,
};
