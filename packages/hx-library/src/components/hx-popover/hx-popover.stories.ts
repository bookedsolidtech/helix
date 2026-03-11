import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-popover.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Popover',
  component: 'hx-popover',
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
      ],
      description: 'Preferred placement of the popover relative to the anchor.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'bottom' },
        type: {
          summary:
            "'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end'",
        },
      },
    },
    trigger: {
      control: { type: 'select' },
      options: ['click', 'hover', 'focus', 'manual'],
      description: 'How the popover is triggered.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'click' },
        type: { summary: "'click' | 'hover' | 'focus' | 'manual'" },
      },
    },
    open: {
      control: { type: 'boolean' },
      description: 'Whether the popover is open.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    distance: {
      control: { type: 'number' },
      description: 'Distance in pixels between the popover and the anchor.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: '8' },
        type: { summary: 'number' },
      },
    },
    skidding: {
      control: { type: 'number' },
      description: 'Alignment offset in pixels along the anchor.',
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
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    placement: 'bottom',
    trigger: 'click',
    open: false,
    distance: 8,
    skidding: 0,
    arrow: false,
  },
  render: (args) => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover
        placement=${args.placement}
        trigger=${args.trigger}
        distance=${args.distance}
        skidding=${args.skidding}
        ?open=${args.open}
        ?arrow=${args.arrow}
      >
        <button slot="anchor">Open Popover</button>
        <p style="margin: 0;">Popover body content goes here.</p>
      </hx-popover>
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
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover>
        <button slot="anchor">Open Popover</button>
        <p style="margin: 0;">Click the button to open this popover.</p>
      </hx-popover>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popover = canvasElement.querySelector('hx-popover');
    await expect(popover).toBeTruthy();
    await expect(popover?.shadowRoot?.querySelector('[role="region"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. WITH ARROW
// ─────────────────────────────────────────────────

export const WithArrow: Story = {
  name: 'With Arrow',
  render: () => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover arrow>
        <button slot="anchor">Open Popover (with arrow)</button>
        <p style="margin: 0;">This popover has an arrow pointing to the anchor.</p>
      </hx-popover>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

export const Placements: Story = {
  name: 'Placement Variants',
  render: () => html`
    <div
      style="padding: 8rem; display: flex; gap: 1rem; justify-content: center; align-items: center; flex-wrap: wrap;"
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
          <hx-popover placement=${p} arrow>
            <button slot="anchor">${p}</button>
            <p style="margin: 0;">Placed ${p}</p>
          </hx-popover>
        `,
      )}
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. TRIGGER MODES
// ─────────────────────────────────────────────────

export const TriggerModes: Story = {
  name: 'Trigger Modes',
  render: () => html`
    <div
      style="padding: 6rem; display: flex; gap: 2rem; justify-content: center; align-items: center; flex-wrap: wrap;"
    >
      <hx-popover trigger="click">
        <button slot="anchor">Click trigger</button>
        <p style="margin: 0;">Opens on click. Click again to close.</p>
      </hx-popover>
      <hx-popover trigger="hover">
        <button slot="anchor">Hover trigger</button>
        <p style="margin: 0;">Opens on mouse hover.</p>
      </hx-popover>
      <hx-popover trigger="focus">
        <button slot="anchor">Focus trigger</button>
        <p style="margin: 0;">Opens on keyboard focus.</p>
      </hx-popover>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. MANUAL TRIGGER (controlled)
// ─────────────────────────────────────────────────

export const ManualTrigger: Story = {
  name: 'Manual (Controlled)',
  render: () => html`
    <div
      style="padding: 6rem; display: flex; flex-direction: column; gap: 1rem; align-items: center;"
    >
      <div style="display: flex; gap: 1rem;">
        <button
          @click=${(e: Event) => {
            const popover = (e.target as HTMLElement)
              .closest('div')
              ?.parentElement?.querySelector('hx-popover');
            if (popover) popover.open = true;
          }}
        >
          Show
        </button>
        <button
          @click=${(e: Event) => {
            const popover = (e.target as HTMLElement)
              .closest('div')
              ?.parentElement?.querySelector('hx-popover');
            if (popover) popover.open = false;
          }}
        >
          Hide
        </button>
      </div>
      <hx-popover trigger="manual" arrow>
        <button slot="anchor">Anchor (manual control)</button>
        <p style="margin: 0;">Controlled externally via the open property.</p>
      </hx-popover>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. RICH CONTENT
// ─────────────────────────────────────────────────

export const RichContent: Story = {
  name: 'Rich Content',
  render: () => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover placement="bottom" arrow>
        <button slot="anchor">Patient Details</button>
        <div>
          <h4 style="margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600;">
            John Doe — MRN 12345678
          </h4>
          <p style="margin: 0 0 0.25rem; font-size: 0.8125rem;">DOB: 1965-03-14 (age 61)</p>
          <p style="margin: 0 0 0.25rem; font-size: 0.8125rem;">Allergies: Penicillin, Sulfa</p>
          <p style="margin: 0; font-size: 0.8125rem;">Provider: Dr. Sarah Kim</p>
        </div>
      </hx-popover>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. OPEN / CLOSE EVENTS
// ─────────────────────────────────────────────────

export const OpenCloseEvents: Story = {
  name: 'Test: Open/Close Events',
  render: () => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover>
        <button slot="anchor">Open Popover</button>
        <p style="margin: 0;">Check the browser console for events.</p>
      </hx-popover>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popover = canvasElement.querySelector('hx-popover');
    await expect(popover).toBeTruthy();

    const bodyEl = popover?.shadowRoot?.querySelector('[part="body"]');
    await expect(bodyEl).toBeTruthy();

    // Initially hidden
    await expect(bodyEl?.classList.contains('visible')).toBe(false);
    await expect(bodyEl?.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 8. ESCAPE KEY DISMISS
// ─────────────────────────────────────────────────

export const EscapeDismiss: Story = {
  name: 'Test: Escape Key Dismiss',
  render: () => html`
    <div style="padding: 6rem; display: flex; justify-content: center; align-items: center;">
      <hx-popover trigger="click">
        <button slot="anchor">Click to open, then press Escape</button>
        <p style="margin: 0;">Press Escape to dismiss this popover.</p>
      </hx-popover>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const popover = canvasElement.querySelector('hx-popover');
    const button = canvasElement.querySelector('button');

    await expect(popover).toBeTruthy();
    await expect(button).toBeTruthy();

    const bodyEl = popover?.shadowRoot?.querySelector('[part="body"]');
    await expect(bodyEl).toBeTruthy();

    // Click to open
    await userEvent.click(button!);
    await new Promise((r) => setTimeout(r, 50));
    await expect(bodyEl?.classList.contains('visible')).toBe(true);

    // Press Escape to close
    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 50));
    await expect(bodyEl?.classList.contains('visible')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-popover::part(body) {
        background: #1e1b4b;
        color: #e0e7ff;
        border-color: #4338ca;
      }
      .parts-demo hx-popover::part(arrow) {
        background: #1e1b4b;
        border-color: #4338ca;
      }
    </style>
    <div
      class="parts-demo"
      style="padding: 6rem; display: flex; justify-content: center; align-items: center;"
    >
      <hx-popover arrow>
        <button slot="anchor">Themed popover trigger</button>
        <p style="margin: 0;">Custom themed via ::part(body)</p>
      </hx-popover>
    </div>
  `,
};
