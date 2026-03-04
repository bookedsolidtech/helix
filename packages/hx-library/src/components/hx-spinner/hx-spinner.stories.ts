import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-spinner.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Spinner',
  component: 'hx-spinner',
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Controls the width and height of the spinner. Mapped to the `hx-size` attribute on the element.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'neutral'],
      description:
        'Visual color variant. Primary uses brand blue tones; neutral uses grey tones for use on colored or busy backgrounds.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'neutral'" },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label announced by screen readers via `aria-label` on the status element. Should describe what is loading.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Loading' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    size: 'md',
    variant: 'primary',
    label: 'Loading',
  },
  render: (args) => html`
    <hx-spinner hx-size=${args.size} variant=${args.variant} label=${args.label}></hx-spinner>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Primary use case: medium spinner with default primary variant and default accessible label. */
export const Default: Story = {
  args: {
    size: 'md',
    variant: 'primary',
    label: 'Loading',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. SIZES
// ════════════════════════════════════════════════════════════════════════════

/** All three size variants displayed side by side. Use sm for inline contexts, lg for full-page overlays. */
export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner hx-size="sm" label="Loading small"></hx-spinner>
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner hx-size="md" label="Loading medium"></hx-spinner>
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner hx-size="lg" label="Loading large"></hx-spinner>
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 3. VARIANTS
// ════════════════════════════════════════════════════════════════════════════

/** Primary and neutral variants side by side. Neutral is suited for colored or high-contrast surfaces. */
export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 3rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner variant="primary" label="Loading"></hx-spinner>
        <span style="font-size: 0.75rem; color: #6b7280;">primary</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-spinner variant="neutral" label="Loading"></hx-spinner>
        <span style="font-size: 0.75rem; color: #6b7280;">neutral</span>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 4. CUSTOM LABEL
// ════════════════════════════════════════════════════════════════════════════

/** Demonstrates a meaningful healthcare-context label announced to assistive technology. */
export const CustomLabel: Story = {
  args: {
    label: 'Loading patient records',
    size: 'md',
    variant: 'primary',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. INLINE
// ════════════════════════════════════════════════════════════════════════════

/** Spinner used inline with text — a common pattern for save or submit feedback in healthcare forms. */
export const Inline: Story = {
  render: () => html`
    <div
      style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151;"
    >
      <hx-spinner hx-size="sm" variant="primary" label="Saving"></hx-spinner>
      <span>Saving...</span>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 6. SIZE + VARIANT GRID
// ════════════════════════════════════════════════════════════════════════════

/** Full matrix of all size and variant combinations for visual regression baseline. */
export const AllCombinations: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: auto 1fr 1fr 1fr; gap: 1.5rem; align-items: center;"
    >
      <!-- Header row -->
      <span></span>
      <strong style="font-size: 0.875rem;">sm</strong>
      <strong style="font-size: 0.875rem;">md</strong>
      <strong style="font-size: 0.875rem;">lg</strong>

      <!-- Primary row -->
      <strong style="font-size: 0.875rem; color: #6b7280;">primary</strong>
      <hx-spinner hx-size="sm" variant="primary" label="Loading small primary"></hx-spinner>
      <hx-spinner hx-size="md" variant="primary" label="Loading medium primary"></hx-spinner>
      <hx-spinner hx-size="lg" variant="primary" label="Loading large primary"></hx-spinner>

      <!-- Neutral row -->
      <strong style="font-size: 0.875rem; color: #6b7280;">neutral</strong>
      <hx-spinner hx-size="sm" variant="neutral" label="Loading small neutral"></hx-spinner>
      <hx-spinner hx-size="md" variant="neutral" label="Loading medium neutral"></hx-spinner>
      <hx-spinner hx-size="lg" variant="neutral" label="Loading large neutral"></hx-spinner>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 7. CSS CUSTOM PROPERTIES
// ════════════════════════════════════════════════════════════════════════════

/** Demonstrates all CSS custom properties available for theming the spinner beyond variant tokens. */
export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .css-prop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        max-width: 640px;
      }
      .css-prop-cell {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      .css-prop-cell code {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
    </style>
    <div class="css-prop-grid">
      <div class="css-prop-cell">
        <code>--hx-spinner-indicator-color: #059669</code>
        <hx-spinner
          style="--hx-spinner-indicator-color: #059669;"
          label="Loading with custom indicator color"
        ></hx-spinner>
      </div>

      <div class="css-prop-cell">
        <code>--hx-spinner-track-color: #fde68a</code>
        <hx-spinner
          style="--hx-spinner-track-color: #fde68a;"
          label="Loading with custom track color"
        ></hx-spinner>
      </div>

      <div class="css-prop-cell">
        <code>--hx-spinner-border-width: 4px</code>
        <hx-spinner
          style="--hx-spinner-border-width: 4px;"
          label="Loading with thick ring"
        ></hx-spinner>
      </div>

      <div class="css-prop-cell">
        <code>--hx-spinner-duration: 1.5s</code>
        <hx-spinner
          style="--hx-spinner-duration: 1.5s;"
          label="Loading with slow rotation"
        ></hx-spinner>
      </div>

      <div class="css-prop-cell">
        <code>--hx-spinner-size: 3rem</code>
        <hx-spinner style="--hx-spinner-size: 3rem;" label="Loading with custom size"></hx-spinner>
      </div>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
      <strong>Usage</strong>
      <pre
        style="margin: 0.5rem 0 0; font-size: 0.8125rem; white-space: pre-wrap;"
      ><code>/* Override via host selector or inline style */
hx-spinner {
  --hx-spinner-indicator-color: var(--hx-color-success-500);
  --hx-spinner-border-width: 3px;
  --hx-spinner-duration: 1s;
}</code></pre>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 8. CSS PARTS
// ════════════════════════════════════════════════════════════════════════════

/** Demonstrates styling the exposed CSS parts: spinner, track, and indicator. */
export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo-thick hx-spinner::part(track) {
        border-width: 4px;
        border-color: #e0f2fe;
      }
      .parts-demo-thick hx-spinner::part(indicator) {
        border-width: 4px;
        border-top-color: #0284c7;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 640px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">
          Exposed parts: <code>::part(spinner)</code>, <code>::part(track)</code>,
          <code>::part(indicator)</code>
        </p>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6b7280;">
          The spinner container, static track ring, and rotating indicator arc are each exposed as
          CSS parts for styling across Shadow DOM boundaries.
        </p>
      </div>

      <div class="parts-demo-thick">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-spinner::part(track) { border-width: 4px; border-color: #e0f2fe; }
          hx-spinner::part(indicator) { border-width: 4px; border-top-color: #0284c7; }
        </code>
        <hx-spinner label="Loading with custom part styles"></hx-spinner>
      </div>
    </div>
  `,
};

// ════════════════════════════════════════════════════════════════════════════
// 9. HEALTHCARE SCENARIOS
// ════════════════════════════════════════════════════════════════════════════

/** Full-page loading overlay pattern for blocking operations such as EHR record retrieval. */
export const FullPageOverlay: Story = {
  render: () => html`
    <div
      style="position: relative; width: 100%; min-height: 240px; background: rgba(255,255,255,0.9); border: 1px solid #e5e7eb; border-radius: 0.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;"
      role="status"
      aria-label="Loading patient chart"
    >
      <hx-spinner hx-size="lg" variant="primary" label="Loading patient chart"></hx-spinner>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">Loading patient chart...</p>
    </div>
  `,
};

/** Inline loading state inside a table cell — common in patient list views while data refreshes. */
export const TableCellInline: Story = {
  render: () => html`
    <table style="border-collapse: collapse; width: 100%; max-width: 640px; font-size: 0.875rem;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Patient</th>
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Status</th>
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Lab Results</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem;">Jane Doe</td>
          <td style="padding: 0.75rem 1rem;">Admitted</td>
          <td style="padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <hx-spinner hx-size="sm" variant="primary" label="Loading lab results"></hx-spinner>
            <span style="color: #6b7280;">Fetching...</span>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem;">John Smith</td>
          <td style="padding: 0.75rem 1rem;">Pending</td>
          <td style="padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <hx-spinner hx-size="sm" variant="neutral" label="Loading lab results"></hx-spinner>
            <span style="color: #6b7280;">Fetching...</span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
};

/** Button + spinner composition for a submit-in-progress state without using hx-button's loading prop. */
export const SubmissionInProgress: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <p style="margin: 0; font-weight: 600;">Submit Prior Authorization</p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Sending request to payer network. This may take a few seconds.
      </p>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <hx-spinner hx-size="sm" variant="primary" label="Submitting authorization"></hx-spinner>
        <span style="font-size: 0.875rem; color: #6b7280;">Submitting...</span>
      </div>
    </div>
  `,
};
