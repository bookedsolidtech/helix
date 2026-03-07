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
    <hx-focus-ring visible shape="box" color=${args['color']} style="margin: 1rem;">
      <button>Custom red ring</button>
    </hx-focus-ring>
  `,
};

export const WrappingHelixButton: Story = {
  name: 'Wrapping hx-button',
  render: () => {
    // Lazily import hx-button for the story
    import('../hx-button/index.js').catch((e) =>
      console.error('[hx-focus-ring story] Failed to load hx-button:', e),
    );
    return html`
      <hx-focus-ring visible shape="box" style="margin: 1rem;">
        <hx-button>Click Me</hx-button>
      </hx-focus-ring>
    `;
  },
};

export const WrappingInput: Story = {
  name: 'Wrapping Input',
  render: () => html`
    <div style="margin: 1rem;">
      <hx-focus-ring visible shape="box">
        <input type="text" placeholder="Text input" style="padding: 0.5rem; font-size: 1rem;" />
      </hx-focus-ring>
    </div>
  `,
};

export const WrappingLink: Story = {
  name: 'Wrapping Link',
  render: () => html`
    <div style="margin: 1rem;">
      <hx-focus-ring visible shape="box">
        <a href="#">Accessible link</a>
      </hx-focus-ring>
    </div>
  `,
};

export const OffsetVariations: Story = {
  name: 'Offset Variations',
  render: () => html`
    <div style="display: flex; gap: 2rem; padding: 1rem; align-items: center;">
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">2px (default)</p>
        <hx-focus-ring visible shape="box" offset="2px">
          <button>Small offset</button>
        </hx-focus-ring>
      </div>
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">4px</p>
        <hx-focus-ring visible shape="box" offset="4px">
          <button>Medium offset</button>
        </hx-focus-ring>
      </div>
      <div>
        <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">8px</p>
        <hx-focus-ring visible shape="box" offset="8px">
          <button>Large offset</button>
        </hx-focus-ring>
      </div>
    </div>
  `,
};

export const DarkMode: Story = {
  name: 'Dark Mode Contrast',
  decorators: [
    (story) => html`
      <div
        data-theme="dark"
        style="background: #111827; padding: 2rem; border-radius: 0.5rem;"
      >
        ${story()}
      </div>
    `,
  ],
  render: () => html`
    <hx-focus-ring visible shape="box" data-theme="dark" style="margin: 0.5rem;">
      <button style="background: #1f2937; color: #f9fafb; border: 1px solid #374151; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">
        Button on dark surface
      </button>
    </hx-focus-ring>
  `,
};
