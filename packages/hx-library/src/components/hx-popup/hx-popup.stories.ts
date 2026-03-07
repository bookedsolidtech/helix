import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
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
    strategy: {
      control: { type: 'select' },
      options: ['fixed', 'absolute'],
      description:
        'Positioning strategy. Use "absolute" inside overflow:hidden/scroll containers.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'fixed' },
        type: { summary: "'fixed' | 'absolute'" },
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
// 2. INTERACTIVE TOGGLE
// ─────────────────────────────────────────────────

export const Interactive: Story = {
  name: 'Interactive (Toggle)',
  render: () => html`
    <div style="padding: 8rem; display: flex; justify-content: center; align-items: center;">
      <hx-popup id="interactive-popup" placement="bottom" distance="8">
        <button
          id="interactive-trigger"
          slot="anchor"
          aria-expanded="false"
          aria-controls="interactive-popup"
          style="padding: 0.5rem 1rem;"
          onclick="
            const popup = this.closest('hx-popup') || this.parentElement?.closest('hx-popup');
            if (popup) {
              popup.active = !popup.active;
              this.setAttribute('aria-expanded', String(popup.active));
            }
          "
        >
          Toggle Popup
        </button>
        <div
          role="dialog"
          aria-label="Example popup"
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem; min-width: 12rem;"
        >
          <p style="margin: 0 0 0.5rem;">Popup is open!</p>
          <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">
            Click the trigger again to close.
          </p>
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('#interactive-trigger') as HTMLButtonElement;
    const popup = canvasElement.querySelector('hx-popup') as HTMLElement & { active: boolean };

    await expect(popup.active).toBe(false);
    await expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(trigger);
    await expect(popup.active).toBe(true);
    await expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await userEvent.click(trigger);
    await expect(popup.active).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 3. PLACEMENT VARIANTS
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
// 4. AUTO PLACEMENT
// ─────────────────────────────────────────────────

export const AutoPlacement: Story = {
  name: 'Auto Placement',
  render: () => html`
    <div
      style="padding: 6rem; display: flex; gap: 4rem; justify-content: space-between; align-items: center;"
    >
      <hx-popup active placement="auto" distance="8">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Auto (left side)</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem; white-space: nowrap;"
        >
          Auto-placed popup
        </div>
      </hx-popup>
      <hx-popup active placement="auto" distance="8">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Auto (right side)</button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem; white-space: nowrap;"
        >
          Auto-placed popup
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popups = canvasElement.querySelectorAll('hx-popup');
    for (const popup of popups) {
      await expect(popup.getAttribute('placement')).toBe('auto');
      // Both popups should have run positioning and have left/top set
      const popupEl = popup.shadowRoot?.querySelector<HTMLElement>('[part="popup"]');
      await expect(popupEl?.style.left).toBeTruthy();
    }
  },
};

// ─────────────────────────────────────────────────
// 5. WITH ARROW
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
      <hx-popup active placement="left" distance="8" arrow style="--hx-arrow-color: #374151;">
        <button slot="anchor" style="padding: 0.5rem 1rem;">Left arrow</button>
        <div
          style="background: #374151; color: white; border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem;"
        >
          Arrow left
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
    const popups = canvasElement.querySelectorAll('hx-popup');
    for (const popup of popups) {
      await expect(popup.shadowRoot?.querySelector('[part="arrow"]')).toBeTruthy();
    }
  },
};

// ─────────────────────────────────────────────────
// 6. ARROW PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

export const ArrowPlacements: Story = {
  name: 'Arrow Placement (start / center / end)',
  render: () => html`
    <div
      style="padding: 8rem; display: flex; gap: 4rem; justify-content: center; align-items: center; flex-wrap: wrap;"
    >
      <hx-popup
        active
        placement="bottom"
        distance="8"
        arrow
        arrow-placement="start"
        style="--hx-arrow-color: #4338ca;"
      >
        <button slot="anchor" style="padding: 0.5rem 2rem;">start</button>
        <div
          style="background: #4338ca; color: white; border-radius: 0.375rem; padding: 0.5rem 1.5rem; font-size: 0.875rem; min-width: 10rem;"
        >
          arrow-placement="start"
        </div>
      </hx-popup>
      <hx-popup
        active
        placement="bottom"
        distance="8"
        arrow
        arrow-placement="center"
        style="--hx-arrow-color: #4338ca;"
      >
        <button slot="anchor" style="padding: 0.5rem 2rem;">center</button>
        <div
          style="background: #4338ca; color: white; border-radius: 0.375rem; padding: 0.5rem 1.5rem; font-size: 0.875rem; min-width: 10rem;"
        >
          arrow-placement="center"
        </div>
      </hx-popup>
      <hx-popup
        active
        placement="bottom"
        distance="8"
        arrow
        arrow-placement="end"
        style="--hx-arrow-color: #4338ca;"
      >
        <button slot="anchor" style="padding: 0.5rem 2rem;">end</button>
        <div
          style="background: #4338ca; color: white; border-radius: 0.375rem; padding: 0.5rem 1.5rem; font-size: 0.875rem; min-width: 10rem;"
        >
          arrow-placement="end"
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popups = canvasElement.querySelectorAll('hx-popup');
    for (const popup of popups) {
      const arrowEl = popup.shadowRoot?.querySelector<HTMLElement>('[part="arrow"]');
      await expect(arrowEl).toBeTruthy();
      await expect(arrowEl?.getAttribute('data-placement')).toBeTruthy();
    }
  },
};

// ─────────────────────────────────────────────────
// 7. INACTIVE STATE
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
    // When inactive, popup container should have inert attribute
    await expect(popupEl?.hasAttribute('inert')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 8. FLIP BEHAVIOR
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
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    // Wait for positioning to settle
    await new Promise((r) => setTimeout(r, 50));
    const popupEl = popup?.shadowRoot?.querySelector<HTMLElement>('[part="popup"]');
    // Popup should have been positioned (left/top set by floating-ui)
    await expect(popupEl?.style.left).toBeTruthy();
    await expect(popupEl?.style.top).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 9. SHIFT BEHAVIOR
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
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup');
    await new Promise((r) => setTimeout(r, 50));
    const popupEl = popup?.shadowRoot?.querySelector<HTMLElement>('[part="popup"]');
    await expect(popupEl?.style.left).toBeTruthy();
    await expect(popupEl?.style.top).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 10. FLIP FALLBACK PLACEMENTS
// ─────────────────────────────────────────────────

export const FlipFallbackPlacements: Story = {
  name: 'Flip Fallback Placements',
  render: () => html`
    <div
      style="padding: 2rem; display: flex; justify-content: flex-start; align-items: flex-start;"
    >
      <hx-popup
        active
        placement="top"
        distance="8"
        flip
        flip-fallback-placements='["right","bottom"]'
      >
        <button slot="anchor" style="padding: 0.5rem 1rem;">
          Tries: top → right → bottom
        </button>
        <div
          style="background: white; border: 1px solid #e5e7eb; border-radius: 0.375rem; padding: 0.75rem 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 0.875rem;"
        >
          <strong>flip-fallback-placements='["right","bottom"]'</strong>
          <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #6b7280;">
            When the preferred placement overflows, tries the fallbacks in order.
          </p>
        </div>
      </hx-popup>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. AUTO SIZE
// ─────────────────────────────────────────────────

export const AutoSize: Story = {
  name: 'Auto Size (Constrain to Viewport)',
  render: () => html`
    <div
      style="padding: 4rem; display: flex; justify-content: center; align-items: flex-end; height: 60vh;"
    >
      <hx-popup active placement="top" distance="8" auto-size>
        <button slot="anchor" style="padding: 0.5rem 1rem;">Auto Size</button>
        <div
          style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 0.75rem 1rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            font-size: 0.875rem;
            overflow-y: auto;
            max-height: var(--hx-auto-size-available-height, 300px);
          "
        >
          <p style="margin: 0 0 0.5rem;"><strong>autoSize is active.</strong></p>
          <p style="margin: 0 0 0.5rem;">
            <code>--hx-auto-size-available-height</code> is set on :host and consumed by this
            popup's <code>max-height</code>.
          </p>
          ${Array.from(
            { length: 10 },
            (_, i) => html`<p style="margin: 0.25rem 0;">List item ${i + 1}</p>`,
          )}
        </div>
      </hx-popup>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popup = canvasElement.querySelector('hx-popup') as HTMLElement;
    await new Promise((r) => setTimeout(r, 100));
    // autoSize sets custom properties on :host
    const height = popup.style.getPropertyValue('--hx-auto-size-available-height');
    await expect(height).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 12. EXTERNAL ANCHOR (CSS SELECTOR)
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
// 13. CSS PARTS
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
