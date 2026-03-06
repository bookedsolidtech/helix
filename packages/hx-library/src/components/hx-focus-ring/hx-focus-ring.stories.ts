import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
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
      color=${ifDefined(args['color'] || undefined)}
      width=${ifDefined(args['width'] || undefined)}
      offset=${ifDefined(args['offset'] || undefined)}
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
    <hx-focus-ring
      visible
      shape="box"
      color=${ifDefined(args['color'] || undefined)}
      style="margin: 1rem;"
    >
      <button>Custom red ring</button>
    </hx-focus-ring>
  `,
};

export const WrappingInput: Story = {
  name: 'Wrapping Input',
  render: () => html`
    <hx-focus-ring visible shape="box" style="margin: 1rem;">
      <input type="text" placeholder="Text input" style="padding: 0.5rem;" />
    </hx-focus-ring>
  `,
};

export const WrappingLink: Story = {
  name: 'Wrapping Link',
  render: () => html`
    <hx-focus-ring visible shape="pill" style="margin: 1rem;">
      <a href="#" style="padding: 0.25rem 0.5rem;">Learn more</a>
    </hx-focus-ring>
  `,
};

export const OffsetVariations: Story = {
  name: 'Offset Variations',
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center; margin: 1rem;">
      <hx-focus-ring visible shape="box" offset="0px">
        <button>0px offset</button>
      </hx-focus-ring>
      <hx-focus-ring visible shape="box" offset="2px">
        <button>2px offset</button>
      </hx-focus-ring>
      <hx-focus-ring visible shape="box" offset="4px">
        <button>4px offset</button>
      </hx-focus-ring>
      <hx-focus-ring visible shape="box" offset="8px">
        <button>8px offset</button>
      </hx-focus-ring>
    </div>
  `,
};

export const DarkModePreview: Story = {
  name: 'Dark Mode Preview',
  render: () => html`
    <div
      style="background: #111827; padding: 2rem; border-radius: 0.5rem; display: flex; gap: 2rem; align-items: center;"
    >
      <hx-focus-ring visible shape="box" style="--hx-focus-ring-color: #93c5fd;">
        <button
          style="background: #374151; color: #f9fafb; border: 1px solid #4b5563; padding: 0.5rem 1rem; border-radius: 0.375rem;"
        >
          Dark mode button
        </button>
      </hx-focus-ring>
      <hx-focus-ring visible shape="pill" style="--hx-focus-ring-color: #93c5fd;">
        <a href="#" style="color: #93c5fd; padding: 0.25rem 0.5rem;">Dark mode link</a>
      </hx-focus-ring>
    </div>
  `,
};

export const WrappingHelixButton: Story = {
  name: 'Wrapping hx-button',
  render: () => {
    import('../hx-button/index.js').catch((e: unknown) =>
      console.error('[hx-focus-ring story] Failed to load hx-button:', e),
    );
    return html`
      <hx-focus-ring visible shape="box" style="margin: 1rem;">
        <hx-button>Click Me</hx-button>
      </hx-focus-ring>
    `;
  },
};

export const AutoFocusDetection: Story = {
  name: 'Auto Focus Detection',
  render: () => html`
    <p style="margin-bottom: 1rem;">
      Tab to the elements below to see the focus ring appear automatically:
    </p>
    <div style="display: flex; gap: 2rem; align-items: center; margin: 1rem;">
      <hx-focus-ring shape="box">
        <button>Tab to me</button>
      </hx-focus-ring>
      <hx-focus-ring shape="box">
        <input type="text" placeholder="Or tab here" style="padding: 0.5rem;" />
      </hx-focus-ring>
      <hx-focus-ring shape="pill">
        <a href="#">Or here</a>
      </hx-focus-ring>
    </div>
  `,
};
