import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-button.js';

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
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
    <hx-button
      variant=${args.variant}
      wc-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${args.label}
    </hx-button>
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
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const button = canvasElement.querySelector('hx-button');
    expect(button).toBeTruthy();
    expect(button?.shadowRoot?.querySelector('button')).toBeTruthy();
    await userEvent.click(button!);
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
      <hx-button variant="primary">Primary</hx-button>
      <hx-button variant="secondary">Secondary</hx-button>
      <hx-button variant="ghost">Ghost</hx-button>
      <hx-button variant="primary" disabled>Disabled</hx-button>
    </div>
  `,
};

// ─── All Sizes ───

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-button wc-size="sm">Small</hx-button>
      <hx-button wc-size="md">Medium</hx-button>
      <hx-button wc-size="lg">Large</hx-button>
    </div>
  `,
};
