import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-focus-ring.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/FocusRing',
  component: 'hx-focus-ring',
  tags: ['autodocs'],
  argTypes: {
    visible: {
      control: 'boolean',
      description: 'Whether the focus ring is visible.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    shape: {
      control: { type: 'select' },
      options: ['box', 'circle', 'pill'],
      description: 'Shape of the focus ring.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'box' },
        type: { summary: "'box' | 'circle' | 'pill'" },
      },
    },
    color: {
      control: 'color',
      description: 'CSS color override for the ring. Falls back to --hx-focus-ring-color.',
      table: {
        category: 'Visual',
        type: { summary: 'string' },
      },
    },
    width: {
      control: 'text',
      description: 'Ring width override. Falls back to --hx-focus-ring-width.',
      table: {
        category: 'Visual',
        type: { summary: 'string' },
      },
    },
    offset: {
      control: 'text',
      description: 'Ring offset override. Falls back to --hx-focus-ring-offset.',
      table: {
        category: 'Visual',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    visible: true,
    shape: 'box',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    visible: true,
    shape: 'box',
  },
  render: (args) => html`
    <hx-focus-ring
      ?visible=${args['visible']}
      shape=${args['shape']}
      color=${args['color'] ?? ''}
      width=${args['width'] ?? ''}
      offset=${args['offset'] ?? ''}
      style="margin: 1rem;"
    >
      <button>Focused Button</button>
    </hx-focus-ring>
  `,
};

export const Hidden: Story = {
  args: {
    visible: false,
    shape: 'box',
  },
  render: (args) => html`
    <hx-focus-ring ?visible=${args['visible']} shape=${args['shape']} style="margin: 1rem;">
      <button>Button (ring hidden)</button>
    </hx-focus-ring>
  `,
};

export const ShapeBox: Story = {
  name: 'Shape: Box',
  args: { visible: true, shape: 'box' },
  render: () => html`
    <hx-focus-ring visible shape="box" style="margin: 1rem;">
      <button>Box shape</button>
    </hx-focus-ring>
  `,
};

export const ShapeCircle: Story = {
  name: 'Shape: Circle',
  args: { visible: true, shape: 'circle' },
  render: () => html`
    <hx-focus-ring visible shape="circle" style="margin: 1rem;">
      <button style="border-radius: 50%; width: 40px; height: 40px; padding: 0;">○</button>
    </hx-focus-ring>
  `,
};

export const ShapePill: Story = {
  name: 'Shape: Pill',
  args: { visible: true, shape: 'pill' },
  render: () => html`
    <hx-focus-ring visible shape="pill" style="margin: 1rem;">
      <button style="border-radius: 9999px; padding: 0.5rem 1.5rem;">Pill Button</button>
    </hx-focus-ring>
  `,
};

export const CustomColor: Story = {
  name: 'Custom Color',
  args: { visible: true, shape: 'box', color: '#dc2626' },
  render: (args) => html`
    <hx-focus-ring visible shape="box" color=${args['color']} style="margin: 1rem;">
      <button>Custom red ring</button>
    </hx-focus-ring>
  `,
};

export const WrappingHelixButton: Story = {
  name: 'Wrapping hx-button',
  render: () => {
    // Lazily import hx-button for the story
    import('../hx-button/index.js').catch(() => undefined);
    return html`
      <hx-focus-ring visible shape="box" style="margin: 1rem;">
        <hx-button>Click Me</hx-button>
      </hx-focus-ring>
    `;
  },
};
