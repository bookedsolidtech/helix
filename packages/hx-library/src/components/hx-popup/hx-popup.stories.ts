import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-popup.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Infrastructure/Popup',
  component: 'hx-popup',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: [
        'top',
        'top-start',
        'top-end',
        'right',
        'right-start',
        'right-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'auto',
      ],
      description: 'Preferred placement of the popup relative to the anchor.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'bottom' },
        type: {
          summary:
            "'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'auto'",
        },
      },
    },
    active: {
      control: { type: 'boolean' },
      description: 'Whether the popup is visible.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    distance: {
      control: { type: 'number' },
      description: 'Gap in pixels between popup and anchor.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    skidding: {
      control: { type: 'number' },
      description: 'Offset along the anchor axis in pixels.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    arrow: {
      control: { type: 'boolean' },
      description: 'Whether to show an arrow pointing to the anchor.',
      table: {
        category: 'Arrow',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    arrowPlacement: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Manual arrow placement along the popup edge.',
      table: {
        category: 'Arrow',
        type: { summary: "'start' | 'center' | 'end'" },
      },
    },
    arrowPadding: {
      control: { type: 'number' },
      description: 'Minimum padding from popup edge to arrow.',
      table: {
        category: 'Arrow',
        defaultValue: { summary: '10' },
        type: { summary: 'number' },
      },
    },
    flip: {
      control: { type: 'boolean' },
      description: 'Flip to opposite side to avoid overflow.',
      table: {
        category: 'Overflow',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    shift: {
      control: { type: 'boolean' },
      description: 'Shift along axis to remain in viewport.',
      table: {
        category: 'Overflow',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    autoSize: {
      control: { type: 'boolean' },
      description: 'Resize popup to fit within viewport.',
      table: {
        category: 'Overflow',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    strategy: {
      control: { type: 'select' },
      options: ['fixed', 'absolute'],
      description:
        'Positioning strategy. Use `fixed` for most cases, `absolute` when inside a scroll container with `overflow: hidden`.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'fixed' },
        type: { summary: "'fixed' | 'absolute'" },
      },
    },
  },
  args: {
    placement: 'bottom',
    active: true,
    distance: 8,
    skidding: 0,
    arrow: false,
    arrowPadding: 10,
    flip: false,
    shift: false,
    autoSize: false,
    strategy: 'fixed',
  },
  render: (args) => html`
    <div style="padding: 8rem; display: flex; justify-content: center; align-items: center;">
      <hx-popup
        placement=${args.placement}
        ?active=${args.active}
        distance=${args.distance}
        skidding=${args.skidding}
        ?arrow=${args.arrow}
        arrow-padding=${args.arrowPadding}
        ?flip=${args.flip}
        ?shift=${args.shift}
        ?auto-size=${args.autoSize}
        strategy=${args.strategy}
      >
        <button slot="anchor" style="padding: 0.5rem 1rem; cursor: default;">Anchor</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          Popup content
        </div>
      </hx-popup>
    </div>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <div style="padding: 8rem; display: flex; justify-content: center; align-items: center;">
      <hx-popup active distance="8">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Anchor button</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          Popup content
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await expect(popup).toBeTruthy();
    await expect(popup?.shadowRoot?.querySelector('[part="popup"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

export const Placements: Story = {
  name: 'Placement Variants',
  render: () => html`
    <div
      style="padding: 10rem; display: flex; gap: 2rem; justify-content: center; align-items: center; flex-wrap: wrap;"
    >
      ${(
        [
          'top',
          'top-start',
          'top-end',
          'right',
          'right-start',
          'right-end',
          'bottom',
          'bottom-start',
          'bottom-end',
          'left',
          'left-start',
          'left-end',
        ] as const
      ).map(
        (p) => html`
          <hx-popup active placement=${p} distance="8">
            <button slot="anchor" style="padding: 0.5rem 1rem; white-space: nowrap;">${p}</button>
            <div
              style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.5rem 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.75rem; white-space: nowrap;"
            >
              Placement: ${p}
            </div>
          </hx-popup>
        `,
      )}
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. WITH ARROW
// ─────────────────────────────────────────────────

export const WithArrow: Story = {
  name: 'With Arrow',
  render: () => html`
    <div
      style="padding: 8rem; display: flex; gap: 4rem; justify-content: center; align-items: center; flex-wrap: wrap;"
    >
      <hx-popup active placement="top" distance="8" arrow style="--hx-arrow-color: #374151;">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Top arrow</button>
        <div
          style="background: #374151; color: white; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem;"
        >
          Arrow above
        </div>
      </hx-popup>
      <hx-popup active placement="bottom" distance="8" arrow style="--hx-arrow-color: #374151;">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Bottom arrow</button>
        <div
          style="background: #374151; color: white; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem;"
        >
          Arrow below
        </div>
      </hx-popup>
      <hx-popup active placement="right" distance="8" arrow style="--hx-arrow-color: #374151;">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Right arrow</button>
        <div
          style="background: #374151; color: white; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem;"
        >
          Arrow right
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await expect(popup?.shadowRoot?.querySelector('[part="arrow"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. INACTIVE STATE
// ─────────────────────────────────────────────────

export const Inactive: Story = {
  name: 'Inactive (Hidden)',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-popup placement="bottom" distance="8">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Anchor (popup hidden)</button>
        <div style="background: white; border: 1px solid #e5e7eb; padding: 0.75rem;">
          This popup is hidden
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await expect(popup?.active).toBe(false);
    const popupEl = popup?.shadowRoot?.querySelector('[part="popup"]');
    await expect(popupEl?.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 5. FLIP BEHAVIOR
// ─────────────────────────────────────────────────

export const FlipBehavior: Story = {
  name: 'Flip to Avoid Overflow',
  render: () => html`
    <div
      style="padding: 2rem; display: flex; justify-content: flex-start; align-items: flex-start;"
    >
      <hx-popup active placement="top" distance="8" flip>
        <button slot="anchor" style="padding: 0.5rem 1rem;">Near top edge — flips to bottom</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          Flipped automatically
        </div>
      </hx-popup>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. SHIFT BEHAVIOR
// ─────────────────────────────────────────────────

export const ShiftBehavior: Story = {
  name: 'Shift to Stay in Viewport',
  render: () => html`
    <div style="padding: 2rem; display: flex; justify-content: flex-end; align-items: center;">
      <hx-popup active placement="bottom" distance="8" shift>
        <button slot="anchor" style="padding: 0.5rem 1rem;">Near edge — shifts inward</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem; white-space: nowrap;"
        >
          Shifted to stay visible
        </div>
      </hx-popup>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. EXTERNAL ANCHOR (CSS SELECTOR)
// ─────────────────────────────────────────────────

export const ExternalAnchor: Story = {
  name: 'External Anchor (CSS Selector)',
  render: () => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <button id="external-anchor" style="padding: 0.5rem 1rem;">External Anchor</button>
      <hx-popup active anchor="#external-anchor" placement="bottom" distance="8">
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          Anchored via CSS selector
        </div>
      </hx-popup>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. CSS PARTS
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-popup::part(popup) {
        background: #4338ca;
        color: white;
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        box-shadow: 0 4px 12px rgba(67, 56, 202, 0.4);
      }
      .parts-demo hx-popup::part(arrow) {
        --hx-arrow-color: #4338ca;
      }
    </style>
    <div
      class="parts-demo"
      style="padding: 8rem; display: flex; justify-content: center; align-items: center;"
    >
      <hx-popup active placement="bottom" distance="8" arrow>
        <button slot="anchor" style="padding: 0.5rem 1rem;">Themed via ::part()</button>
        Styled via CSS parts
      </hx-popup>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. AUTO PLACEMENT
// ─────────────────────────────────────────────────

/**
 * When `placement="auto"` is set, Floating UI's `autoPlacement` middleware
 * chooses the optimal side based on available space. The popup will
 * automatically reposition as the viewport or scroll container changes.
 */
export const AutoPlacement: Story = {
  name: 'Auto Placement',
  render: () => html`
    <div style="padding: 8rem; display: flex; justify-content: center; align-items: center;">
      <hx-popup active placement="auto" distance="8">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Auto-placed anchor</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          Floating UI picks the best side
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await expect(popup).toBeTruthy();
    await expect(popup?.placement).toBe('auto');
  },
};

// ─────────────────────────────────────────────────
// 10. AUTO SIZE
// ─────────────────────────────────────────────────

/**
 * When `auto-size` is enabled, the popup sets `--hx-auto-size-available-width`
 * and `--hx-auto-size-available-height` CSS custom properties. Use these in
 * popup content to constrain dimensions within the viewport.
 */
export const AutoSize: Story = {
  name: 'Auto Size',
  render: () => html`
    <div
      style="padding: 2rem; height: 300px; overflow: auto; border: 1px solid #e5e7eb; border-radius: 0.375rem; position: relative;"
    >
      <div style="padding: 6rem 2rem; display: flex; justify-content: center;">
        <hx-popup active placement="bottom" distance="8" auto-size>
          <button slot="anchor" style="padding: 0.5rem 1rem;">Auto-sized popup</button>
          <div
            style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem; max-width: var(--hx-auto-size-available-width); max-height: var(--hx-auto-size-available-height); overflow: auto;"
          >
            <p style="margin: 0 0 0.5rem;">
              This popup content is constrained by the available viewport space using
              <code>--hx-auto-size-available-width</code> and
              <code>--hx-auto-size-available-height</code>.
            </p>
            <p style="margin: 0 0 0.5rem;">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p style="margin: 0 0 0.5rem;">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
              officia deserunt mollit anim id est laborum.
            </p>
            <p style="margin: 0;">
              Resize the browser window or scroll the container to see the popup constrain itself
              within the available space.
            </p>
          </div>
        </hx-popup>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await expect(popup).toBeTruthy();
    await expect(popup?.autoSize).toBe(true);
  },
};
