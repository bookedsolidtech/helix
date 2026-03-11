import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-tooltip.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Tooltip',
  component: 'hx-tooltip',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'left',
        'left-start',
        'left-end',
        'right',
        'right-start',
        'right-end',
      ],
      description: 'Preferred placement of the tooltip.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'top' },
        type: { summary: 'Placement' },
      },
    },
    showDelay: {
      control: { type: 'number' },
      description: 'Delay in ms before showing the tooltip.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '300' },
        type: { summary: 'number' },
      },
    },
    hideDelay: {
      control: { type: 'number' },
      description: 'Delay in ms before hiding the tooltip.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
  },
  args: {
    placement: 'top',
    showDelay: 300,
    hideDelay: 100,
  },
  render: (args) => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip
        placement=${args.placement}
        show-delay=${args.showDelay}
        hide-delay=${args.hideDelay}
      >
        <button>Hover or focus me</button>
        <span slot="content">Contextual help text</span>
      </hx-tooltip>
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
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip>
        <button>Hover me</button>
        <span slot="content">Contextual help text</span>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();
    await expect(tooltip?.shadowRoot?.querySelector('[role="tooltip"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

export const Placements: Story = {
  name: 'Placement Variants',
  render: () => html`
    <div
      style="padding: 6rem; display: flex; gap: 2rem; justify-content: center; align-items: center; flex-wrap: wrap;"
    >
      <hx-tooltip placement="top">
        <button>Top</button>
        <span slot="content">Appears above</span>
      </hx-tooltip>
      <hx-tooltip placement="bottom">
        <button>Bottom</button>
        <span slot="content">Appears below</span>
      </hx-tooltip>
      <hx-tooltip placement="left">
        <button>Left</button>
        <span slot="content">Appears to the left</span>
      </hx-tooltip>
      <hx-tooltip placement="right">
        <button>Right</button>
        <span slot="content">Appears to the right</span>
      </hx-tooltip>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. NO DELAY (instant)
// ─────────────────────────────────────────────────

export const NoDelay: Story = {
  name: 'No Delay',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip show-delay="0" hide-delay="0">
        <button>Instant tooltip</button>
        <span slot="content">Appears immediately on hover</span>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();

    const tooltipEl = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(tooltipEl).toBeTruthy();

    // Initially hidden
    await expect(tooltipEl?.classList.contains('visible')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 4. LONG CONTENT
// ─────────────────────────────────────────────────

export const LongContent: Story = {
  name: 'Long Content',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip>
        <button>View medication info</button>
        <span slot="content"
          >Lisinopril is an ACE inhibitor used to treat high blood pressure and heart failure.
          Monitor for cough, hyperkalemia, and renal impairment.</span
        >
      </hx-tooltip>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. WITH ICON BUTTON TRIGGER
// ─────────────────────────────────────────────────

export const IconTrigger: Story = {
  name: 'Icon Trigger',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip placement="right">
        <button
          aria-label="Help"
          style="width: 2rem; height: 2rem; border-radius: 50%; border: 1px solid #ccc; cursor: pointer; font-size: 0.875rem;"
        >
          ?
        </button>
        <span slot="content">Click for additional help resources</span>
      </hx-tooltip>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. ARIA ATTRIBUTES
// ─────────────────────────────────────────────────

export const ARIAAttributes: Story = {
  name: 'Test: ARIA Attributes',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip show-delay="0" hide-delay="0">
        <button id="trigger-btn">Check ARIA</button>
        <span slot="content">Accessible tooltip content</span>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    await expect(tooltip).toBeTruthy();

    const tooltipEl = tooltip?.shadowRoot?.querySelector('[role="tooltip"]');
    await expect(tooltipEl).toBeTruthy();
    await expect(tooltipEl?.getAttribute('role')).toBe('tooltip');

    const trigger = canvasElement.querySelector('#trigger-btn');
    await expect(trigger).toBeTruthy();
    const describedById = trigger?.getAttribute('aria-describedby');
    await expect(describedById).toBeTruthy();
    await expect(tooltipEl?.id).toBe(describedById);
  },
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE USE CASES
// ─────────────────────────────────────────────────

export const HealthcareUseCases: Story = {
  name: 'Healthcare: Contextual Help',
  render: () => html`
    <div style="padding: 4rem; max-width: 500px; margin: 0 auto;">
      <h3 style="margin: 0 0 1.5rem; font-size: 1.125rem; font-weight: 600;">
        Patient Vitals Entry
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="bp" style="font-size: 0.875rem; font-weight: 500;">Blood Pressure</label>
          <hx-tooltip placement="right">
            <button
              aria-label="Blood pressure help"
              style="width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 1px solid #6366f1; background: #ede9fe; color: #4338ca; font-size: 0.625rem; cursor: pointer;"
            >
              ?
            </button>
            <span slot="content"
              >Enter systolic/diastolic values (e.g., 120/80 mmHg). Normal range: below 120/80.
              Alert threshold: above 140/90.</span
            >
          </hx-tooltip>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="spo2" style="font-size: 0.875rem; font-weight: 500;">SpO2</label>
          <hx-tooltip placement="right">
            <button
              aria-label="SpO2 help"
              style="width: 1.25rem; height: 1.25rem; border-radius: 50%; border: 1px solid #6366f1; background: #ede9fe; color: #4338ca; font-size: 0.625rem; cursor: pointer;"
            >
              ?
            </button>
            <span slot="content"
              >Oxygen saturation percentage. Normal: 95–100%. Critical alert: below 90%. Initiate
              supplemental oxygen if below 92%.</span
            >
          </hx-tooltip>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="gfr" style="font-size: 0.875rem; font-weight: 500;">eGFR</label>
          <hx-tooltip placement="right">
            <abbr
              title="Estimated Glomerular Filtration Rate"
              tabindex="0"
              style="cursor: help; font-size: 0.875rem; border-bottom: 1px dashed #6366f1; text-decoration: none;"
            >
              eGFR
            </abbr>
            <span slot="content"
              >Estimated Glomerular Filtration Rate — measures kidney function. Normal: ≥60
              mL/min/1.73m². Stage 3 CKD: 30–59. Stage 4: 15–29.</span
            >
          </hx-tooltip>
        </div>
      </div>
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
      .parts-demo hx-tooltip::part(tooltip) {
        background: #4338ca;
        border: 1px solid #6366f1;
        font-size: 0.8125rem;
      }
      .parts-demo hx-tooltip::part(arrow) {
        background: #4338ca;
      }
    </style>
    <div
      class="parts-demo"
      style="padding: 4rem; display: flex; justify-content: center; align-items: center;"
    >
      <hx-tooltip>
        <button>Themed tooltip trigger</button>
        <span slot="content">Custom themed via ::part(tooltip)</span>
      </hx-tooltip>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. ESCAPE KEY DISMISS
// ─────────────────────────────────────────────────

export const EscapeDismiss: Story = {
  name: 'Test: Escape Key Dismiss',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: center;">
      <hx-tooltip show-delay="0" hide-delay="0">
        <button>Focus then press Escape</button>
        <span slot="content">Press Escape to dismiss this tooltip</span>
      </hx-tooltip>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const tooltip = canvasElement.querySelector('hx-tooltip');
    const button = canvasElement.querySelector('button');

    await expect(tooltip).toBeTruthy();
    await expect(button).toBeTruthy();

    const tooltipEl = tooltip?.shadowRoot?.querySelector('[part="tooltip"]');
    await expect(tooltipEl).toBeTruthy();

    // Focus button to show tooltip (with 0 delay)
    button?.focus();
    await new Promise((r) => setTimeout(r, 50));

    // Tooltip should be visible
    await expect(tooltipEl?.classList.contains('visible')).toBe(true);

    // Press Escape
    await userEvent.keyboard('{Escape}');
    await new Promise((r) => setTimeout(r, 50));

    // Tooltip should be hidden
    await expect(tooltipEl?.classList.contains('visible')).toBe(false);
  },
};
