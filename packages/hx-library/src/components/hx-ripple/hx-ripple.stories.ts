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
      description:
        'When true, the ripple wave expands beyond the component bounds. Useful for icon buttons.',
      table: {
        category: 'Behavior',
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
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-ripple-scale: 6</code>
        <div style="margin-top: 0.5rem;">
          <hx-ripple style="--hx-ripple-scale: 6;">
            <hx-button variant="primary">Large Scale Ripple</hx-button>
          </hx-ripple>
        </div>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. ON ICONS — Ripple on icon-only buttons
// ─────────────────────────────────────────────────

export const OnIcons: Story = {
  name: 'On Icons',
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-ripple style="border-radius: 50%;">
          <button
            aria-label="Add patient"
            style="
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              border: none;
              background: #2563eb;
              color: white;
              font-size: 1.25rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            +
          </button>
        </hx-ripple>
        <code style="font-size: 0.7rem; color: #6b7280;">icon button</code>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-ripple style="border-radius: 50%;" color="rgba(0,0,0,0.2)">
          <button
            aria-label="Delete record"
            style="
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              border: 1px solid #d1d5db;
              background: white;
              color: #374151;
              font-size: 1rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            ✕
          </button>
        </hx-ripple>
        <code style="font-size: 0.7rem; color: #6b7280;">outlined icon</code>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-ripple unbounded style="border-radius: 50%;" color="rgba(37,99,235,0.3)">
          <button
            aria-label="Search patients"
            style="
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              border: none;
              background: transparent;
              color: #2563eb;
              font-size: 1.1rem;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            &#128269;
          </button>
        </hx-ripple>
        <code style="font-size: 0.7rem; color: #6b7280;">unbounded icon</code>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. UNBOUNDED — Ripple expands beyond element bounds
// ─────────────────────────────────────────────────

export const Unbounded: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center; padding: 2rem;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-ripple style="border-radius: 50%;" color="rgba(37,99,235,0.3)">
          <button
            aria-label="Bounded ripple example"
            style="
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              border: 2px solid #2563eb;
              background: white;
              color: #2563eb;
              cursor: pointer;
            "
          >
            B
          </button>
        </hx-ripple>
        <code style="font-size: 0.7rem; color: #6b7280;">bounded (default)</code>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-ripple unbounded style="border-radius: 50%;" color="rgba(37,99,235,0.3)">
          <button
            aria-label="Unbounded ripple example"
            style="
              width: 2.5rem;
              height: 2.5rem;
              border-radius: 50%;
              border: 2px solid #2563eb;
              background: white;
              color: #2563eb;
              cursor: pointer;
            "
          >
            U
          </button>
        </hx-ripple>
        <code style="font-size: 0.7rem; color: #6b7280;">unbounded</code>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. REDUCED MOTION — Accessibility behavior demo
// ─────────────────────────────────────────────────

export const ReducedMotion: Story = {
  name: 'Reduced Motion (Accessibility)',
  parameters: {
    docs: {
      description: {
        story: `
**Reduced Motion Behavior**

When the user has enabled \`prefers-reduced-motion: reduce\` in their operating system settings,
\`hx-ripple\` suppresses all animation. No ripple wave is created on interaction — the component
becomes a transparent pass-through wrapper, preserving full interactivity of the slotted element.

This story simulates the reduced-motion state by applying the CSS override inline. In a real
\`prefers-reduced-motion: reduce\` environment, the behavior is identical.

**Healthcare context:** Motion sensitivity can affect users with vestibular disorders. Respecting
this preference is a WCAG 2.1 AA requirement (Success Criterion 2.3.3 Animation from Interactions).
        `,
      },
    },
  },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 480px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #374151; font-weight: 600;">
          Normal (ripple active):
        </p>
        <hx-ripple>
          <hx-button variant="primary">Click — ripple plays</hx-button>
        </hx-ripple>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.875rem; color: #374151; font-weight: 600;">
          Reduced motion simulation (no ripple):
        </p>
        <style>
          .reduced-motion-demo hx-ripple .ripple__wave {
            animation: none !important;
            opacity: 0 !important;
          }
        </style>
        <div class="reduced-motion-demo">
          <hx-ripple>
            <hx-button variant="primary">Click — no ripple plays</hx-button>
          </hx-ripple>
        </div>
        <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #6b7280;">
          In a real reduced-motion environment, the JS handler also suppresses ripple creation
          entirely (via <code>prefers-reduced-motion</code> media query check).
        </p>
      </div>
    </div>
  `,
};
