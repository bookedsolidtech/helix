import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-ripple.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Ripple',
  component: 'hx-ripple',
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'color',
      description: 'Color of the ripple wave. Overrides --hx-ripple-color.',
      table: {
        category: 'Visual',
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, disables ripple creation on pointer events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    disabled: false,
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Button with ripple
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <hx-ripple>
      <hx-button variant="primary">Click for Ripple</hx-button>
    </hx-ripple>
  `,
};

// ─────────────────────────────────────────────────
// 2. CUSTOM COLOR
// ─────────────────────────────────────────────────

export const CustomColor: Story = {
  render: () => html`
    <hx-ripple color="#ffffff">
      <hx-button variant="primary">White Ripple</hx-button>
    </hx-ripple>
  `,
};

// ─────────────────────────────────────────────────
// 3. DISABLED — No ripple
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => html`
    <hx-ripple disabled>
      <hx-button variant="primary">No Ripple</hx-button>
    </hx-ripple>
  `,
};

// ─────────────────────────────────────────────────
// 4. ON CARD — Demonstrates ripple on a larger surface
// ─────────────────────────────────────────────────

export const OnCard: Story = {
  render: () => html`
    <hx-ripple style="border-radius: 0.5rem;">
      <div
        style="padding: 1.5rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 0.5rem; cursor: pointer; user-select: none;"
      >
        <strong>Patient Summary Card</strong>
        <p style="margin: 0.5rem 0 0; color: #0369a1; font-size: 0.875rem;">
          Click anywhere on this card to see the ripple effect.
        </p>
      </div>
    </hx-ripple>
  `,
};

// ─────────────────────────────────────────────────
// 5. MULTIPLE BUTTONS
// ─────────────────────────────────────────────────

export const MultipleButtons: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-ripple>
        <hx-button variant="primary">Save Record</hx-button>
      </hx-ripple>
      <hx-ripple color="rgba(0,0,0,0.15)">
        <hx-button variant="secondary">Review</hx-button>
      </hx-ripple>
      <hx-ripple color="rgba(0,0,0,0.1)">
        <hx-button variant="ghost">Discard</hx-button>
      </hx-ripple>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-ripple-color: #059669</code>
        <div style="margin-top: 0.5rem;">
          <hx-ripple style="--hx-ripple-color: #059669;">
            <hx-button variant="primary">Green Ripple</hx-button>
          </hx-ripple>
        </div>
      </div>
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-ripple-duration: 1200ms</code>
        <div style="margin-top: 0.5rem;">
          <hx-ripple style="--hx-ripple-duration: 1200ms;">
            <hx-button variant="primary">Slow Ripple</hx-button>
          </hx-ripple>
        </div>
      </div>
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-ripple-opacity: 0.5</code>
        <div style="margin-top: 0.5rem;">
          <hx-ripple style="--hx-ripple-opacity: 0.5;">
            <hx-button variant="primary">High Opacity Ripple</hx-button>
          </hx-ripple>
        </div>
      </div>
    </div>
  `,
};
