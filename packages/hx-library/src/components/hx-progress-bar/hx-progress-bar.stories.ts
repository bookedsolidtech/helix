import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-progress-bar.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ProgressBar',
  component: 'hx-progress-bar',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description:
        'Current progress value. Must be between 0 and the `max` property. Clamped automatically.',
      table: {
        category: 'State',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    max: {
      control: { type: 'number', min: 1, step: 1 },
      description:
        'Maximum value for the progress bar. Determines the 100% threshold. Must be greater than 0.',
      table: {
        category: 'State',
        defaultValue: { summary: '100' },
        type: { summary: 'number' },
      },
    },
    indeterminate: {
      control: 'boolean',
      description:
        'When true, displays an animated indeterminate loading state. `aria-valuenow` is omitted in this mode. Overrides `value` visually.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'success', 'warning', 'danger'],
      description: 'Visual variant that determines the fill color of the progress bar.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'success' | 'warning' | 'danger'" },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label text. Used when the `label` slot is not populated. Sets `aria-label` on the `progressbar` role element.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    showValue: {
      control: 'boolean',
      description:
        'When true, displays the calculated percentage value next to the label. Has no effect when `indeterminate` is true.',
      table: {
        category: 'Content',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    value: 50,
    max: 100,
    indeterminate: false,
    variant: 'primary',
    label: '',
    showValue: false,
  },
  render: (args) => html`
    <hx-progress-bar
      value=${args.value}
      max=${args.max}
      variant=${args.variant}
      label=${args.label}
      ?indeterminate=${args.indeterminate}
      ?show-value=${args.showValue}
    ></hx-progress-bar>
  `,
} satisfies Meta;

export default meta;

export type { Story };

type Story = StoryObj;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Default progress bar at 50% with no label — the baseline rendering state. */
export const Default: Story = {
  args: {
    value: 50,
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar).toBeTruthy();
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('50');
    await expect(progressbar?.getAttribute('aria-valuemin')).toBe('0');
    await expect(progressbar?.getAttribute('aria-valuemax')).toBe('100');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. WITH LABEL
// ════════════════════════════════════════════════════════════════════════════

/** Progress bar with a visible label and percentage value for fully labelled reporting. */
export const WithLabel: Story = {
  args: {
    value: 65,
    label: 'Intake Progress',
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar?.getAttribute('aria-label')).toBe('Intake Progress');
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('65');

    const labelEl = bar?.shadowRoot?.querySelector('[part="label"]');
    await expect(labelEl).toBeTruthy();

    const valueEl = bar?.shadowRoot?.querySelector('[part="value"]');
    await expect(valueEl).toBeTruthy();
    await expect(valueEl?.textContent?.trim()).toBe('65%');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. VARIANTS
// ════════════════════════════════════════════════════════════════════════════

/** All four variants displayed in a stacked grid for visual comparison. */
export const Variants: Story = {
  render: () => html`
    <div style="display: grid; gap: 1.25rem; font-family: var(--hx-font-family-sans, sans-serif);">
      <div>
        <p
          style="margin: 0 0 0.375rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Primary
        </p>
        <hx-progress-bar variant="primary" value="60" label="Primary" show-value></hx-progress-bar>
      </div>
      <div>
        <p
          style="margin: 0 0 0.375rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Success
        </p>
        <hx-progress-bar variant="success" value="80" label="Success" show-value></hx-progress-bar>
      </div>
      <div>
        <p
          style="margin: 0 0 0.375rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Warning
        </p>
        <hx-progress-bar variant="warning" value="45" label="Warning" show-value></hx-progress-bar>
      </div>
      <div>
        <p
          style="margin: 0 0 0.375rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--hx-color-neutral-500, #6b7280);"
        >
          Danger
        </p>
        <hx-progress-bar variant="danger" value="25" label="Danger" show-value></hx-progress-bar>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const bars = canvasElement.querySelectorAll('hx-progress-bar');
    await expect(bars.length).toBe(4);

    const variants = ['primary', 'success', 'warning', 'danger'] as const;
    for (let i = 0; i < bars.length; i++) {
      const progressbar = bars[i]?.shadowRoot?.querySelector('[role="progressbar"]');
      await expect(progressbar?.classList.contains(`bar--${variants[i]}`)).toBe(true);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. INDETERMINATE
// ════════════════════════════════════════════════════════════════════════════

/** Indeterminate mode for in-progress operations where completion time is unknown. */
export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    label: 'Loading patient record…',
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar).toBeTruthy();

    // aria-valuenow must be absent in indeterminate mode per WAI-ARIA spec
    await expect(progressbar?.hasAttribute('aria-valuenow')).toBe(false);

    const fill = bar?.shadowRoot?.querySelector('[part="fill"]');
    await expect(fill?.classList.contains('bar__fill--indeterminate')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. SHOW VALUE
// ════════════════════════════════════════════════════════════════════════════

/** Progress bar with the percentage value explicitly shown alongside the label. */
export const ShowValue: Story = {
  args: {
    value: 75,
    label: 'Upload Progress',
    showValue: true,
    variant: 'primary',
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const valueEl = bar?.shadowRoot?.querySelector('[part="value"]');
    await expect(valueEl).toBeTruthy();
    await expect(valueEl?.textContent?.trim()).toBe('75%');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. ZERO PROGRESS
// ════════════════════════════════════════════════════════════════════════════

/** Zero-value state — the bar is empty, representing the start of an operation. */
export const ZeroProgress: Story = {
  args: {
    value: 0,
    label: 'Not started',
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('0');

    const valueEl = bar?.shadowRoot?.querySelector('[part="value"]');
    await expect(valueEl?.textContent?.trim()).toBe('0%');

    const fill = bar?.shadowRoot?.querySelector('[part="fill"]') as HTMLElement | null;
    await expect(fill?.style.width).toBe('0%');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. COMPLETE
// ════════════════════════════════════════════════════════════════════════════

/** Fully completed progress at 100% with the success variant and percentage displayed. */
export const Complete: Story = {
  args: {
    value: 100,
    variant: 'success',
    label: 'All Steps Complete',
    showValue: true,
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('100');
    await expect(progressbar?.classList.contains('bar--success')).toBe(true);

    const valueEl = bar?.shadowRoot?.querySelector('[part="value"]');
    await expect(valueEl?.textContent?.trim()).toBe('100%');

    const fill = bar?.shadowRoot?.querySelector('[part="fill"]') as HTMLElement | null;
    await expect(fill?.style.width).toBe('100%');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. LABEL SLOT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Custom label content via the named `label` slot. Replaces the `label` property text
 * and allows rich HTML such as icons or formatted text in the label area.
 */
export const LabelSlot: Story = {
  render: () => html`
    <hx-progress-bar value="55" variant="primary" show-value>
      <span slot="label" style="display: flex; align-items: center; gap: 0.375rem;">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
        <strong>Vitals Sync</strong>
      </span>
    </hx-progress-bar>
  `,
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const slottedContent = bar?.querySelector('[slot="label"]');
    await expect(slottedContent).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('55');
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. HEALTHCARE USE CASE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Healthcare workflow: care plan milestone tracking with a custom `max` value.
 * Demonstrates using a non-100 maximum to model milestone-based progress
 * (e.g., 3 of 8 care plan milestones completed).
 */
export const Healthcare: Story = {
  args: {
    value: 3,
    max: 8,
    label: 'Care Plan Milestones',
    showValue: true,
    variant: 'primary',
  },
  render: (args) => html`
    <div style="max-width: 480px; font-family: var(--hx-font-family-sans, sans-serif);">
      <hx-progress-bar
        value=${args.value}
        max=${args.max}
        label=${args.label}
        variant=${args.variant}
        ?show-value=${args.showValue}
      ></hx-progress-bar>
      <p
        style="margin: 0.5rem 0 0; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
      >
        ${args.value} of ${args.max} milestones completed
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('hx-progress-bar');
    await expect(bar).toBeTruthy();

    const progressbar = bar?.shadowRoot?.querySelector('[role="progressbar"]');
    await expect(progressbar?.getAttribute('aria-valuenow')).toBe('3');
    await expect(progressbar?.getAttribute('aria-valuemax')).toBe('8');

    // 3/8 = 37.5 → rounds to 38%
    const valueEl = bar?.shadowRoot?.querySelector('[part="value"]');
    await expect(valueEl?.textContent?.trim()).toBe('38%');
  },
};
