import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-tooltip.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta: Meta = {
  title: 'Components/Tooltip',
  component: 'hx-tooltip',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Preferred placement of the tooltip relative to the trigger. Flips automatically when viewport space is insufficient.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'top' },
        type: { summary: "'top' | 'bottom' | 'left' | 'right'" },
      },
    },
    delay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Delay in milliseconds before the tooltip appears after mouseenter or focus.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '300' },
        type: { summary: 'number' },
      },
    },
    hideDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Delay in milliseconds before the tooltip disappears after mouseleave or blur.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, prevents the tooltip from appearing on interaction.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Programmatically controls tooltip visibility.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A tooltip overlay that reveals contextual information when the user hovers or focuses its trigger element. Positions itself using `getBoundingClientRect()` and flips automatically when it would overflow the viewport.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

/**
 * The default tooltip wraps any trigger element in its default slot and
 * renders tooltip content in the `content` slot.
 */
export const Default: Story = {
  args: {
    placement: 'top',
    delay: 300,
    hideDelay: 100,
    disabled: false,
  },
  render: (args) => html`
    <div style="display: flex; justify-content: center; padding: 4rem;">
      <hx-tooltip
        placement=${args['placement'] as string}
        .delay=${args['delay'] as number}
        .hideDelay=${args['hideDelay'] as number}
        ?disabled=${args['disabled'] as boolean}
      >
        <button type="button">Hover or focus me</button>
        <span slot="content">Patient record last updated 2 minutes ago</span>
      </hx-tooltip>
    </div>
  `,
};

/**
 * Demonstrates all four placement options. Each tooltip will flip to the
 * opposite side if it would overflow the viewport.
 */
export const Placement: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, auto); grid-template-rows: repeat(3, auto); gap: 1rem; place-items: center; padding: 4rem;"
    >
      <!-- Top row center -->
      <div style="grid-column: 2;">
        <hx-tooltip placement="top" delay="0">
          <button type="button">Top</button>
          <span slot="content">Tooltip above the trigger</span>
        </hx-tooltip>
      </div>

      <!-- Middle row: left and right -->
      <div style="grid-column: 1; grid-row: 2;">
        <hx-tooltip placement="left" delay="0">
          <button type="button">Left</button>
          <span slot="content">Tooltip to the left</span>
        </hx-tooltip>
      </div>
      <div style="grid-column: 3; grid-row: 2;">
        <hx-tooltip placement="right" delay="0">
          <button type="button">Right</button>
          <span slot="content">Tooltip to the right</span>
        </hx-tooltip>
      </div>

      <!-- Bottom row center -->
      <div style="grid-column: 2; grid-row: 3;">
        <hx-tooltip placement="bottom" delay="0">
          <button type="button">Bottom</button>
          <span slot="content">Tooltip below the trigger</span>
        </hx-tooltip>
      </div>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'All four placements shown together. The tooltip automatically flips when there is insufficient space.',
      },
    },
  },
};

/**
 * Configurable show/hide delays. Useful when the tooltip contains
 * interactive-adjacent content or when reduced distraction is desired.
 */
export const WithDelay: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; justify-content: center; padding: 4rem;">
      <hx-tooltip placement="top" delay="0" hide-delay="0">
        <button type="button">Instant (0ms / 0ms)</button>
        <span slot="content">No delay on show or hide</span>
      </hx-tooltip>

      <hx-tooltip placement="top" delay="300" hide-delay="100">
        <button type="button">Default (300ms / 100ms)</button>
        <span slot="content">Default show and hide delays</span>
      </hx-tooltip>

      <hx-tooltip placement="top" delay="800" hide-delay="400">
        <button type="button">Slow (800ms / 400ms)</button>
        <span slot="content">Longer delays reduce accidental triggers</span>
      </hx-tooltip>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Adjust `delay` and `hide-delay` to control how quickly the tooltip appears and disappears.',
      },
    },
  },
};

/**
 * When `disabled` is set, the tooltip never appears regardless of user
 * interaction. Use this when a UI element is conditionally disabled and
 * you do not want the tooltip interfering.
 */
export const Disabled: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; justify-content: center; padding: 4rem;">
      <hx-tooltip placement="top" delay="0">
        <button type="button">Enabled tooltip</button>
        <span slot="content">This tooltip is active</span>
      </hx-tooltip>

      <hx-tooltip placement="top" delay="0" disabled>
        <button type="button">Disabled tooltip</button>
        <span slot="content">This tooltip will never appear</span>
      </hx-tooltip>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story: 'A disabled tooltip never shows, regardless of hover or focus events.',
      },
    },
  },
};

/**
 * The `open` attribute allows programmatic control over tooltip visibility.
 * This story shows the tooltip in its open state on load.
 */
export const ProgrammaticOpen: Story = {
  render: () => html`
    <div style="display: flex; justify-content: center; padding: 6rem;">
      <hx-tooltip placement="top" open delay="0">
        <button type="button">Always visible trigger</button>
        <span slot="content">This tooltip is open programmatically</span>
      </hx-tooltip>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        story:
          'Setting the `open` attribute or property programmatically shows the tooltip immediately, bypassing the delay.',
      },
    },
  },
};
