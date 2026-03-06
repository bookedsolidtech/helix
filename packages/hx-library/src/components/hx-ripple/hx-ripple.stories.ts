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
    unbounded: {
      control: 'boolean',
      description: 'When true, the ripple expands beyond the component bounds.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    disabled: false,
    unbounded: false,
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
// 5. UNBOUNDED — Ripple extends beyond bounds (icon buttons)
// ─────────────────────────────────────────────────

export const Unbounded: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center; padding: 2rem;">
      <div style="text-align: center;">
        <hx-ripple unbounded>
          <button
            style="width: 40px; height: 40px; border-radius: 50%; border: none; background: #e5e7eb; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
            aria-label="Settings"
          >
            &#9881;
          </button>
        </hx-ripple>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">unbounded</div>
      </div>
      <div style="text-align: center;">
        <hx-ripple>
          <button
            style="width: 40px; height: 40px; border-radius: 50%; border: none; background: #e5e7eb; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
            aria-label="Settings"
          >
            &#9881;
          </button>
        </hx-ripple>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">bounded (default)</div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. ON ICON BUTTONS
// ─────────────────────────────────────────────────

export const OnIconButtons: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-ripple unbounded>
        <button
          style="width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
          aria-label="Favorite"
        >
          &#9829;
        </button>
      </hx-ripple>
      <hx-ripple unbounded>
        <button
          style="width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
          aria-label="Share"
        >
          &#8599;
        </button>
      </hx-ripple>
      <hx-ripple unbounded>
        <button
          style="width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;"
          aria-label="More options"
        >
          &#8942;
        </button>
      </hx-ripple>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. MULTIPLE BUTTONS
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
// 8. CSS CUSTOM PROPERTIES DEMO
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
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-ripple-scale: 2</code>
        <div style="margin-top: 0.5rem;">
          <hx-ripple style="--hx-ripple-scale: 2;">
            <hx-button variant="primary">Small Scale Ripple</hx-button>
          </hx-ripple>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. REDUCED MOTION — Demonstrates prefers-reduced-motion behavior
// ─────────────────────────────────────────────────

export const ReducedMotion: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;">
      <p style="font-size: 0.875rem; color: #374151; margin: 0;">
        When <code>prefers-reduced-motion: reduce</code> is active in your OS settings, the ripple
        animation is completely suppressed. The component checks both the CSS media query (which
        sets <code>animation: none</code>) and the JavaScript <code>matchMedia</code> API (which
        prevents ripple DOM creation entirely).
      </p>
      <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">
        To test: enable "Reduce motion" in your OS accessibility settings, then click the button
        below. No ripple should appear.
      </p>
      <hx-ripple>
        <hx-button variant="primary">Click to Test Reduced Motion</hx-button>
      </hx-ripple>
    </div>
  `,
};
