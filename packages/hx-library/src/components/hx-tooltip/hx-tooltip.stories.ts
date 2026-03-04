import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-tooltip.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Tooltip',
  component: 'hx-tooltip',
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: 'The tooltip text content displayed in the popup.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    placement: {
      control: { type: 'select' },
      options: ['top', 'right', 'bottom', 'left', 'auto'],
      description:
        "Preferred placement of the tooltip relative to the trigger. When set to 'auto', the component flips to the best-fitting placement based on available viewport space.",
      table: {
        category: 'Layout',
        defaultValue: { summary: "'top'" },
        type: { summary: "'top' | 'right' | 'bottom' | 'left' | 'auto'" },
      },
    },
    delay: {
      control: { type: 'number', min: 0, max: 3000, step: 100 },
      description:
        'Milliseconds to wait before showing the tooltip on hover. Focus-triggered display is always immediate.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '300' },
        type: { summary: 'number' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'When true, the tooltip will not display under any circumstances.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    content: 'Contextual help text',
    placement: 'top',
    delay: 300,
    disabled: false,
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 4rem;">
      <hx-tooltip
        content=${args.content}
        placement=${args.placement}
        delay=${args.delay}
        ?disabled=${args.disabled}
      >
        <button type="button">Hover or focus me</button>
      </hx-tooltip>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/**
 * Default tooltip providing contextual help text above a trigger button.
 * Appears on hover (after 300 ms) and immediately on keyboard focus.
 */
export const Default: Story = {
  args: {
    content: 'Additional context for this action.',
    placement: 'top',
  },
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();
    await expect(tooltip?.shadowRoot).toBeTruthy();

    // Verify the tooltip popup element exists in shadow DOM
    const popup = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(popup).toBeTruthy();

    // Verify the popup has the correct ARIA role
    await expect(popup?.getAttribute('role')).toBe('tooltip');

    // Verify the arrow element exists
    const arrow = tooltip?.shadowRoot?.querySelector('[part="arrow"]');
    await expect(arrow).toBeTruthy();

    // Verify default property values
    await expect(tooltip?.placement).toBe('top');
    await expect(tooltip?.delay).toBe(300);
    await expect(tooltip?.disabled).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 2. PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

/**
 * Tooltip placed above the trigger — the default placement.
 * Flips to `bottom` automatically when insufficient space exists above.
 */
export const PlacementTop: Story = {
  name: 'Placement — Top',
  args: {
    content: 'Tooltip appears above the trigger.',
    placement: 'top',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 5rem;">
      <hx-tooltip content=${args.content} placement="top" delay=${args.delay}>
        <button type="button">Top placement</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.placement).toBe('top');
  },
};

/**
 * Tooltip placed to the right of the trigger.
 * Flips to `left` automatically when insufficient space exists to the right.
 */
export const PlacementRight: Story = {
  name: 'Placement — Right',
  args: {
    content: 'Tooltip appears to the right of the trigger.',
    placement: 'right',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 5rem;">
      <hx-tooltip content=${args.content} placement="right" delay=${args.delay}>
        <button type="button">Right placement</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.placement).toBe('right');
  },
};

/**
 * Tooltip placed below the trigger.
 * Flips to `top` automatically when insufficient space exists below.
 */
export const PlacementBottom: Story = {
  name: 'Placement — Bottom',
  args: {
    content: 'Tooltip appears below the trigger.',
    placement: 'bottom',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 5rem;">
      <hx-tooltip content=${args.content} placement="bottom" delay=${args.delay}>
        <button type="button">Bottom placement</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.placement).toBe('bottom');
  },
};

/**
 * Tooltip placed to the left of the trigger.
 * Flips to `right` automatically when insufficient space exists to the left.
 */
export const PlacementLeft: Story = {
  name: 'Placement — Left',
  args: {
    content: 'Tooltip appears to the left of the trigger.',
    placement: 'left',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 5rem;">
      <hx-tooltip content=${args.content} placement="left" delay=${args.delay}>
        <button type="button">Left placement</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.placement).toBe('left');
  },
};

// ─────────────────────────────────────────────────
// 3. ALL PLACEMENTS OVERVIEW
// ─────────────────────────────────────────────────

/**
 * Visual overview of all four explicit placement directions side by side.
 * Controls are disabled for this composite story.
 */
export const AllPlacements: Story = {
  render: () => html`
    <div
      style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        padding: 5rem 2rem;
        align-items: center;
        justify-items: center;
      "
    >
      <hx-tooltip content="Top tooltip" placement="top">
        <button type="button">Top</button>
      </hx-tooltip>
      <hx-tooltip content="Right tooltip" placement="right">
        <button type="button">Right</button>
      </hx-tooltip>
      <hx-tooltip content="Bottom tooltip" placement="bottom">
        <button type="button">Bottom</button>
      </hx-tooltip>
      <hx-tooltip content="Left tooltip" placement="left">
        <button type="button">Left</button>
      </hx-tooltip>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. AUTO PLACEMENT
// ─────────────────────────────────────────────────

/**
 * Auto placement lets the component determine the best position based on
 * available viewport space. Resize the canvas to see it adapt.
 * Defaults to top when space permits, flipping as needed.
 */
export const AutoPlacement: Story = {
  args: {
    content: 'Placed automatically based on available viewport space.',
    placement: 'auto',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 4rem;">
      <hx-tooltip content=${args.content} placement="auto" delay=${args.delay}>
        <button type="button">Auto placement — resize canvas</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.placement).toBe('auto');
  },
};

// ─────────────────────────────────────────────────
// 5. DELAYED
// ─────────────────────────────────────────────────

/**
 * Tooltip with a 1000 ms hover delay to avoid accidental display during
 * cursor traversal. Focus-triggered display remains immediate.
 */
export const Delayed: Story = {
  args: {
    content: 'This tooltip waits 1 second before appearing on hover.',
    placement: 'top',
    delay: 1000,
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 4rem;">
      <hx-tooltip content=${args.content} placement=${args.placement} delay="1000">
        <button type="button">Hover (1 s delay)</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.delay).toBe(1000);

    // Popup should be hidden before any interaction
    const popup = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(popup?.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 6. DISABLED
// ─────────────────────────────────────────────────

/**
 * When `disabled` is set the tooltip will not display on hover or focus.
 * Use this to suppress contextual help when the trigger itself is in a
 * read-only or locked state.
 */
export const Disabled: Story = {
  args: {
    content: 'This tooltip is disabled and will never appear.',
    placement: 'top',
    disabled: true,
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 4rem;">
      <hx-tooltip content=${args.content} placement=${args.placement} ?disabled=${args.disabled}>
        <button type="button">Tooltip is disabled</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip?.disabled).toBe(true);

    // Popup should remain hidden even after focus
    const triggerBtn = canvasElement.querySelector('button');
    triggerBtn?.focus();

    const popup = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(popup?.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 7. LONG CONTENT
// ─────────────────────────────────────────────────

/**
 * Tooltip containing longer medical text to verify max-width wrapping.
 * The popup is constrained to `--hx-tooltip-max-width` (default 17.5 rem)
 * and text wraps naturally within that boundary.
 */
export const LongContent: Story = {
  args: {
    content:
      'Creatinine clearance (CrCl) is calculated using the Cockcroft-Gault equation. Values below 30 mL/min indicate severe renal impairment. Dose adjustment required before prescribing nephrotoxic agents.',
    placement: 'top',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 6rem 2rem;">
      <hx-tooltip content=${args.content} placement=${args.placement} delay=${args.delay}>
        <button type="button">CrCl — hover for reference</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();

    const popup = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(popup).toBeTruthy();
    await expect(popup?.getAttribute('role')).toBe('tooltip');
  },
};

// ─────────────────────────────────────────────────
// 8. ON ABBREVIATION — HEALTHCARE USE CASE
// ─────────────────────────────────────────────────

/**
 * Healthcare-specific pattern: a tooltip wrapping an `<abbr>` element
 * to expose the full expansion of a clinical abbreviation on focus or hover.
 * Screen readers announce the expanded form via `aria-describedby`.
 */
export const OnAbbreviation: Story = {
  render: () => html`
    <div
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
        padding: 4rem;
        flex-wrap: wrap;
      "
    >
      <p style="font-size: 1rem; line-height: 1.6; max-width: 40rem;">
        The patient's
        <hx-tooltip
          content="Medical Record Number — unique patient identifier assigned at registration."
          placement="top"
        >
          <abbr
            tabindex="0"
            style="cursor: help; text-decoration: underline dotted; text-underline-offset: 2px;"
            >MRN</abbr
          >
        </hx-tooltip>
        was verified against the
        <hx-tooltip
          content="Electronic Health Record — the digital version of a patient's medical history."
          placement="top"
        >
          <abbr
            tabindex="0"
            style="cursor: help; text-decoration: underline dotted; text-underline-offset: 2px;"
            >EHR</abbr
          >
        </hx-tooltip>
        before the
        <hx-tooltip
          content="Computerized Physician Order Entry — system for entering medical orders electronically."
          placement="top"
        >
          <abbr
            tabindex="0"
            style="cursor: help; text-decoration: underline dotted; text-underline-offset: 2px;"
            >CPOE</abbr
          >
        </hx-tooltip>
        order was placed.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltips = canvasElement.querySelectorAll('hx-tooltip');
    await expect(tooltips.length).toBe(3);

    // Verify the MRN abbreviation tooltip
    const mrnTooltip = tooltips[0];
    await expect(mrnTooltip?.content).toContain('Medical Record Number');

    const mrnAbbr = mrnTooltip?.querySelector('abbr');
    await expect(mrnAbbr).toBeTruthy();

    const mrnPopup = mrnTooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(mrnPopup?.getAttribute('role')).toBe('tooltip');

    // Verify aria-describedby wiring on the abbr element after slot assignment
    await expect(mrnAbbr?.getAttribute('aria-describedby')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 9. INTERACTIVE PLAY TEST — FOCUS, KEYBOARD, ESCAPE
// ─────────────────────────────────────────────────

/**
 * Interaction test verifying the full keyboard interaction model:
 *
 * - Tab focus on the trigger causes immediate tooltip display
 * - The popup transitions to `aria-hidden="false"` on focusin
 * - Pressing Escape while the tooltip is open hides it
 * - The popup returns to `aria-hidden="true"` after dismiss
 *
 * This story is the canonical accessibility verification story for CI.
 */
export const InteractionTest: Story = {
  name: 'Interaction Test — Focus and Escape',
  args: {
    content: 'Keyboard interaction test: focus to show, Escape to hide.',
    placement: 'top',
    delay: 0,
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; justify-content: center; padding: 5rem;">
      <hx-tooltip content=${args.content} placement=${args.placement} delay="0">
        <button type="button" data-testid="tooltip-trigger">Focus me with Tab</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();

    const popup = tooltip?.shadowRoot?.querySelector('[part="tooltip"]') as HTMLElement | null;
    await expect(popup).toBeTruthy();

    // ── Initial state: tooltip is hidden ──────────────────────────────
    await expect(popup?.getAttribute('aria-hidden')).toBe('true');

    // ── Focus trigger via keyboard Tab ────────────────────────────────
    const triggerBtn = canvas.getByTestId('tooltip-trigger');
    await userEvent.tab();
    triggerBtn.focus();

    // After focusin the tooltip should become visible immediately (delay=0)
    await expect(popup?.getAttribute('aria-hidden')).toBe('false');

    // ── Press Escape to dismiss ───────────────────────────────────────
    await userEvent.keyboard('{Escape}');

    // Tooltip should be hidden again
    await expect(popup?.getAttribute('aria-hidden')).toBe('true');

    // ── Verify trigger button has aria-describedby pointing to popup ──
    await expect(triggerBtn.getAttribute('aria-describedby')).toBeTruthy();
    const describedById = triggerBtn.getAttribute('aria-describedby');
    const referencedEl = tooltip?.shadowRoot?.querySelector(`#${describedById}`);
    await expect(referencedEl).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 10. CSS CUSTOM PROPERTIES — TOKEN OVERRIDES
// ─────────────────────────────────────────────────

/**
 * Demonstrates overriding the component-level CSS custom properties to adapt
 * the tooltip to a custom design language. All tokens follow the `--hx-tooltip-*`
 * namespace and fall back to semantic `--hx-*` primitives when not set.
 */
export const CustomTokens: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; justify-content: center; padding: 5rem;"
    >
      <hx-tooltip content="Default token appearance" placement="top">
        <button type="button">Default tokens</button>
      </hx-tooltip>

      <hx-tooltip
        content="Custom background and text color via CSS tokens"
        placement="top"
        style="
          --hx-tooltip-bg: #1e3a5f;
          --hx-tooltip-color: #e0f0ff;
          --hx-tooltip-border-radius: 0.5rem;
          --hx-tooltip-font-size: 0.875rem;
          --hx-tooltip-max-width: 12rem;
        "
      >
        <button type="button">Custom tokens</button>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltips = canvasElement.querySelectorAll('hx-tooltip');
    await expect(tooltips.length).toBe(2);

    const customTooltip = tooltips[1] as HTMLElement;
    await expect(customTooltip.style.getPropertyValue('--hx-tooltip-bg')).toBe('#1e3a5f');
  },
};
