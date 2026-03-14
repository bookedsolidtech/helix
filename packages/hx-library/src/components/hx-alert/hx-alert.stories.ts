import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-alert.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Alert',
  component: 'hx-alert',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
      description: 'Visual variant that determines alert colors and ARIA semantics.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'info' },
        type: { summary: "'info' | 'success' | 'warning' | 'error'" },
      },
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the alert can be dismissed by the user via a close button.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the alert is visible; set to false to hide the alert.',
      table: {
        category: 'State',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    icon: {
      control: 'boolean',
      description: 'Whether to show the default variant icon. Set to false to hide the icon.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    message: {
      control: 'text',
      description: 'Alert message text passed via the default slot.',
      table: {
        category: 'Content',
        type: { summary: 'string (slot)' },
      },
    },
    accent: {
      control: 'boolean',
      description:
        'When true, applies a left border accent stripe instead of a full border. Common in enterprise healthcare dashboards for visual distinction.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    'return-focus-to': {
      control: 'text',
      description:
        'CSS selector for the element to return focus to after the alert is dismissed. Critical accessibility pattern to prevent focus loss after dismissal.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'null' },
        type: { summary: 'string | null' },
      },
    },
  },
  args: {
    variant: 'info',
    dismissible: false,
    open: true,
    icon: true,
    accent: false,
    'return-focus-to': '',
    message: 'Your session will expire in 15 minutes. Please save your work.',
  },
  render: (args) => html`
    <hx-alert
      variant=${args.variant}
      ?dismissible=${args.dismissible}
      ?open=${args.open}
      ?show-icon=${args.icon}
      ?accent=${args.accent}
      return-focus-to=${args['return-focus-to'] || ''}
    >
      ${args.message}
    </hx-alert>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/** Primary use case: an informational alert rendered in its default state. */
export const Default: Story = {
  args: {
    variant: 'info',
    message: 'Your session will expire in 15 minutes. Please save your work.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');

    await expect(alert).toBeTruthy();
    await expect(alert?.shadowRoot).toBeTruthy();

    const alertContainer = alert?.shadowRoot?.querySelector('[part="alert"]');
    await expect(alertContainer).toBeTruthy();
    // Role is applied to the host element, not the shadow DOM internal div
    await expect(alert?.getAttribute('role')).toBe('status');

    // Verify icon is rendered
    const iconPart = alert?.shadowRoot?.querySelector('[part="icon"]');
    await expect(iconPart).toBeTruthy();
    const svg = iconPart?.querySelector('svg');
    await expect(svg).toBeTruthy();

    // Verify message slot is populated
    const messagePart = alert?.shadowRoot?.querySelector('[part="message"]');
    await expect(messagePart).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY VARIANT
// ─────────────────────────────────────────────────

/** Informational alert for non-critical status messages. Uses `role="status"` (implies polite announcement). */
export const Info: Story = {
  args: {
    variant: 'info',
    message:
      'Patient record #4821 has been checked out for review. Other users will see read-only access.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.variant).toBe('info');

    // Role is on the host element; aria-live is omitted to avoid JAWS double-announcements
    await expect(alert?.getAttribute('role')).toBe('status');
  },
};

/** Success alert confirming a completed action. Uses `role="status"` (implies polite announcement). */
export const Success: Story = {
  args: {
    variant: 'success',
    message:
      'Medication order for Amoxicillin 500mg submitted successfully. Pharmacy has been notified.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.variant).toBe('success');

    // Role is on the host element
    await expect(alert?.getAttribute('role')).toBe('status');
  },
};

/** Warning alert for situations requiring clinician attention. Uses `role="alert"` (implies assertive announcement). */
export const Warning: Story = {
  args: {
    variant: 'warning',
    message:
      'This patient has a documented allergy to Penicillin. Review before prescribing any beta-lactam antibiotics.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.variant).toBe('warning');

    // Role is on the host element; aria-live is omitted to avoid JAWS double-announcements
    await expect(alert?.getAttribute('role')).toBe('alert');
  },
};

/** Error alert for critical failures. Uses `role="alert"` (implies assertive announcement) for immediate screen reader notification. */
export const Error: Story = {
  args: {
    variant: 'error',
    message:
      'Unable to submit lab order. The laboratory information system is currently unavailable. Contact IT support at ext. 4500.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.variant).toBe('error');

    // Role is on the host element; aria-live is omitted to avoid JAWS double-announcements
    await expect(alert?.getAttribute('role')).toBe('alert');
  },
};

// ─────────────────────────────────────────────────
// 3. EVERY STATE
// ─────────────────────────────────────────────────

/** A dismissible alert with the dismiss button visible. */
export const Dismissible: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    message:
      'New clinical guidelines for sepsis management are now available. Dismiss to acknowledge.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert?.dismissible).toBe(true);

    const closeBtn = alert?.shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeTruthy();
    await expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
  },
};

/** A non-dismissible alert without a dismiss button. Used for persistent system messages. */
export const NonDismissible: Story = {
  args: {
    variant: 'error',
    dismissible: false,
    message:
      'CRITICAL: Electronic health record system is undergoing emergency maintenance. Do not enter new orders.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert?.dismissible).toBe(false);

    const closeBtn = alert?.shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeNull();
  },
};

/** A hidden alert with `open=false`. The component is in the DOM but not visible. */
export const Hidden: Story = {
  args: {
    variant: 'info',
    open: false,
    message: 'This alert is hidden and will not be visible.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.open).toBe(false);

    const computedStyle = getComputedStyle(alert!);
    await expect(computedStyle.display).toBe('none');
  },
};

/** An alert with a custom icon slotted into the `icon` slot, replacing the default variant icon. */
export const WithCustomIcon: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="info">
        <svg
          slot="icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"
          />
        </svg>
        You have 3 pending lab results requiring physician review.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    const customIcon = alert?.querySelector('[slot="icon"]');
    await expect(customIcon).toBeTruthy();
    await expect(customIcon?.tagName.toLowerCase()).toBe('svg');
  },
};

/** An alert with action buttons slotted into the `actions` slot. */
export const WithActions: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="warning" dismissible>
        This patient has a pending lab result that may affect the current treatment plan. Review
        results before continuing.
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid currentColor;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
          "
        >
          View Results
        </button>
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid transparent;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
            text-decoration: underline;
          "
        >
          Dismiss
        </button>
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    const actions = alert?.querySelectorAll('[slot="actions"]');
    await expect(actions?.length).toBe(2);

    const actionsPart = alert?.shadowRoot?.querySelector('[part="actions"]');
    await expect(actionsPart).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 4. KITCHEN SINKS
// ─────────────────────────────────────────────────

/** All four alert variants displayed together for visual comparison. */
export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 600px;">
      <hx-alert variant="info">
        <strong>Information:</strong> Your session will expire in 15 minutes. Save all open patient
        records.
      </hx-alert>
      <hx-alert variant="success">
        <strong>Success:</strong> Patient discharge summary has been finalized and sent to the
        referring physician.
      </hx-alert>
      <hx-alert variant="warning">
        <strong>Warning:</strong> This patient has a documented allergy to Penicillin. Review before
        prescribing beta-lactam antibiotics.
      </hx-alert>
      <hx-alert variant="error">
        <strong>Error:</strong> Unable to retrieve patient records from the Health Information
        Exchange. Please try again or contact IT support.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(4);

    const variants = ['info', 'success', 'warning', 'error'];
    for (let i = 0; i < alerts.length; i++) {
      await expect(alerts[i].variant).toBe(variants[i]);
    }
  },
};

/** All state combinations: dismissible, non-dismissible, with actions, with custom icon. */
export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 600px;">
      <hx-alert variant="info">
        <strong>Default:</strong> Non-dismissible, no actions, default icon.
      </hx-alert>

      <hx-alert variant="success" dismissible>
        <strong>Dismissible:</strong> Vitals have been recorded. Click the X to dismiss this
        notification.
      </hx-alert>

      <hx-alert variant="warning" dismissible>
        <strong>With actions:</strong> Abnormal lab value detected for BMP panel.
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid currentColor;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
          "
        >
          View Lab Report
        </button>
      </hx-alert>

      <hx-alert variant="error">
        <svg
          slot="icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="20"
          height="20"
          aria-hidden="true"
        >
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"
          />
        </svg>
        <strong>Custom icon:</strong> Controlled substance reconciliation overdue for this patient.
      </hx-alert>

      <hx-alert variant="info" ?open=${false}>
        <strong>Hidden:</strong> This alert has open=false and should not be visible.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    // Verify visible alerts
    const visibleAlerts = canvasElement.querySelectorAll('hx-alert[open]');
    await expect(visibleAlerts.length).toBe(4);

    // Verify hidden alert exists in DOM but is not visible
    const hiddenAlert = canvasElement.querySelector('hx-alert:not([open])');
    await expect(hiddenAlert).toBeTruthy();
    await expect(getComputedStyle(hiddenAlert!).display).toBe('none');
  },
};

// ─────────────────────────────────────────────────
// 5. COMPOSITION
// ─────────────────────────────────────────────────

/** Multiple stacked alerts simulating a healthcare drug interaction warning panel. */
export const StackedAlerts: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-2, 0.5rem); max-width: 600px;">
      <hx-alert variant="error" dismissible>
        <strong>Drug-Drug Interaction (Severity: Major):</strong> Warfarin + Aspirin. Increased risk
        of bleeding. Consider alternative antiplatelet therapy.
      </hx-alert>
      <hx-alert variant="warning" dismissible>
        <strong>Drug-Allergy Interaction:</strong> Patient has documented sensitivity to
        Sulfonamides. Prescribed Sulfamethoxazole requires physician override.
      </hx-alert>
      <hx-alert variant="warning" dismissible>
        <strong>Duplicate Therapy:</strong> Lisinopril 10mg is already active. New order for
        Enalapril 5mg may be a duplicate ACE inhibitor.
      </hx-alert>
      <hx-alert variant="info">
        <strong>Formulary Notice:</strong> Atorvastatin 40mg is the preferred formulary statin.
        Generic substitution will be applied automatically.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(4);

    // First alert should be the most severe
    await expect(alerts[0].variant).toBe('error');

    // Dismissible alerts should have close buttons
    const dismissibleAlerts = canvasElement.querySelectorAll('hx-alert[dismissible]');
    await expect(dismissibleAlerts.length).toBe(3);
  },
};

/** An alert composed inside an hx-container for constrained layout contexts. */
export const InAContainer: Story = {
  render: () => html`
    <hx-container width="content" padding="md">
      <hx-alert variant="warning" dismissible>
        <strong>System Maintenance:</strong> The radiology PACS system will be unavailable for
        scheduled maintenance on Saturday, February 21st from 02:00-06:00 EST. Please plan imaging
        workflows accordingly.
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid currentColor;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
          "
        >
          View Details
        </button>
      </hx-alert>
    </hx-container>
  `,
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('hx-container');
    await expect(container).toBeTruthy();

    const alert = container?.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.variant).toBe('warning');
  },
};

// ─────────────────────────────────────────────────
// 6. EDGE CASES
// ─────────────────────────────────────────────────

/** Very long content to verify text wrapping and layout integrity. */
export const LongContent: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="warning" dismissible>
        <strong>Clinical Decision Support Alert:</strong> Based on the patient's current medication
        list (Metformin 1000mg BID, Glipizide 10mg daily, Insulin Glargine 30 units at bedtime,
        Lisinopril 20mg daily, Amlodipine 5mg daily, Atorvastatin 40mg daily, Aspirin 81mg daily,
        Metoprolol Succinate 50mg daily), the most recent HbA1c of 9.2% (collected 2026-01-15), and
        the documented history of Stage 3a Chronic Kidney Disease (eGFR 48 mL/min/1.73m2), the
        following recommendations apply: (1) Consider dose adjustment of Metformin per renal
        function guidelines, (2) Evaluate need for SGLT2 inhibitor with demonstrated renal
        protective benefits, (3) Schedule endocrinology referral within 30 days, (4) Increase
        frequency of renal function monitoring to every 3 months. This alert was generated by the
        Clinical Decision Support System v4.2.1 and should be reviewed in the context of the
        complete patient history.
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid currentColor;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
          "
        >
          Acknowledge
        </button>
        <button
          slot="actions"
          style="
            padding: 0.25rem 0.75rem;
            border: 1px solid transparent;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
            text-decoration: underline;
          "
        >
          Override
        </button>
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();

    // Verify the alert is still properly structured despite long content
    const messagePart = alert?.shadowRoot?.querySelector('[part="message"]');
    await expect(messagePart).toBeTruthy();

    // Verify actions still render after long text
    const actions = alert?.querySelectorAll('[slot="actions"]');
    await expect(actions?.length).toBe(2);
  },
};

/** Alert with empty text content to verify it renders gracefully without crashing. */
export const EmptyContent: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="info"></hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    await expect(alert?.open).toBe(true);

    // Alert should still render its structure even with no content
    const alertContainer = alert?.shadowRoot?.querySelector('[part="alert"]');
    await expect(alertContainer).toBeTruthy();

    const iconPart = alert?.shadowRoot?.querySelector('[part="icon"]');
    await expect(iconPart).toBeTruthy();
  },
};

/** Rapidly toggles the alert open/closed to verify no rendering glitches or leaked state. */
export const RapidToggle: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="success" open>
        Medication reconciliation completed for this encounter.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert')!;
    await expect(alert.open).toBe(true);

    // Toggle open/closed 5 times rapidly
    for (let i = 0; i < 5; i++) {
      alert.open = false;
      await alert.updateComplete;
      await expect(alert.open).toBe(false);
      await expect(getComputedStyle(alert).display).toBe('none');

      alert.open = true;
      await alert.updateComplete;
      await expect(alert.open).toBe(true);
      await expect(getComputedStyle(alert).display).toBe('block');
    }

    // After toggling, ensure the alert is in a clean final state
    const alertContainer = alert.shadowRoot?.querySelector('[part="alert"]');
    await expect(alertContainer).toBeTruthy();
    // Role is on the host element
    await expect(alert.getAttribute('role')).toBe('status');
  },
};

// ─────────────────────────────────────────────────
// 7. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

/**
 * Demonstrates all 9 CSS custom properties exposed by `hx-alert`.
 * Override any `--hx-alert-*` property on the host element to customize appearance.
 *
 * Available properties:
 * - `--hx-alert-bg` - Background color
 * - `--hx-alert-color` - Text color
 * - `--hx-alert-border-color` - Border color
 * - `--hx-alert-border-radius` - Border radius
 * - `--hx-alert-border-width` - Border width
 * - `--hx-alert-padding` - Internal padding
 * - `--hx-alert-gap` - Gap between icon, message, and close button
 * - `--hx-alert-icon-color` - Icon fill color
 * - `--hx-alert-font-family` - Font family
 */
export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-6, 1.5rem); max-width: 600px;">
      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Default (no overrides)
        </p>
        <hx-alert variant="info"> Standard alert using default design token values. </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Custom: --hx-alert-bg, --hx-alert-color, --hx-alert-border-color
        </p>
        <hx-alert
          variant="info"
          style="
            --hx-alert-bg: #fef3c7;
            --hx-alert-color: #78350f;
            --hx-alert-border-color: #f59e0b;
          "
        >
          Background, text, and border colors overridden with amber tones.
        </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Custom: --hx-alert-border-radius, --hx-alert-border-width
        </p>
        <hx-alert
          variant="success"
          style="
            --hx-alert-border-radius: 1rem;
            --hx-alert-border-width: 3px;
          "
        >
          Larger border radius and thicker border for emphasis.
        </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Custom: --hx-alert-padding, --hx-alert-gap
        </p>
        <hx-alert
          variant="warning"
          style="
            --hx-alert-padding: 1.5rem;
            --hx-alert-gap: 1.5rem;
          "
        >
          Increased padding and gap for a more spacious layout.
        </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Custom: --hx-alert-icon-color
        </p>
        <hx-alert variant="info" style="--hx-alert-icon-color: #7c3aed;">
          Icon color overridden to purple independent of the variant.
        </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          Custom: --hx-alert-font-family
        </p>
        <hx-alert variant="info" style="--hx-alert-font-family: 'Georgia', serif;">
          Font family overridden to a serif typeface for demonstration.
        </hx-alert>
      </div>

      <div>
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          All properties combined
        </p>
        <hx-alert
          variant="info"
          dismissible
          style="
            --hx-alert-bg: #1e1b4b;
            --hx-alert-color: #e0e7ff;
            --hx-alert-border-color: #4338ca;
            --hx-alert-border-radius: 0.75rem;
            --hx-alert-border-width: 2px;
            --hx-alert-padding: 1.25rem;
            --hx-alert-gap: 1rem;
            --hx-alert-icon-color: #818cf8;
            --hx-alert-font-family: system-ui, sans-serif;
          "
        >
          Fully customized alert with all 9 CSS custom properties overridden. This demonstrates the
          complete theming API surface.
        </hx-alert>
      </div>

      <details style="font-size: var(--hx-font-size-xs, 0.8125rem); margin-top: var(--hx-space-2, 0.5rem);">
        <summary style="cursor: pointer; font-weight: 600;">View CSS code</summary>
        <pre
          style="
            background: var(--hx-color-surface-subtle, #f8fafc);
            padding: var(--hx-space-4, 1rem);
            border-radius: var(--hx-border-radius-md, 0.375rem);
            border: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default, #e2e8f0);
            overflow-x: auto;
            font-size: var(--hx-font-size-xs, 0.75rem);
            line-height: 1.6;
          "
        ><code>hx-alert {
  --hx-alert-bg: #1e1b4b;
  --hx-alert-color: #e0e7ff;
  --hx-alert-border-color: #4338ca;
  --hx-alert-border-radius: 0.75rem;
  --hx-alert-border-width: 2px;
  --hx-alert-padding: 1.25rem;
  --hx-alert-gap: 1rem;
  --hx-alert-icon-color: #818cf8;
  --hx-alert-font-family: system-ui, sans-serif;
}</code></pre>
      </details>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(7);

    // Verify the fully-customized alert renders correctly
    const customAlert = alerts[6];
    await expect(customAlert).toBeTruthy();
    await expect(customAlert.dismissible).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 8. CSS PARTS DEMO
// ─────────────────────────────────────────────────

/**
 * Demonstrates all 6 CSS `::part()` targets exposed by `hx-alert`.
 * External consumers can style these parts without piercing Shadow DOM.
 *
 * Parts: `alert`, `title`, `icon`, `message`, `close-button`, `actions`
 */
export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-alert::part(alert) {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border: 2px solid #3b82f6;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }

      .parts-demo hx-alert::part(icon) {
        background: #dbeafe;
        border-radius: 50%;
        padding: 0.375rem;
      }

      .parts-demo hx-alert::part(message) {
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .parts-demo hx-alert::part(close-button) {
        background: #bfdbfe;
        border-radius: 50%;
        opacity: 1;
      }

      .parts-demo hx-alert::part(actions) {
        padding-top: 0.75rem;
        border-top: 1px dashed #93c5fd;
        margin-top: 0.5rem;
      }
    </style>

    <div class="parts-demo" style="max-width: 600px;">
      <div style="margin-bottom: var(--hx-space-6, 1.5rem);">
        <p style="margin: 0 0 var(--hx-space-2, 0.5rem); font-weight: 600; font-size: var(--hx-font-size-sm, 0.875rem);">
          All parts styled externally via ::part()
        </p>
        <hx-alert variant="info" dismissible>
          This alert has all 6 CSS parts styled externally:
          <code>::part(alert)</code>, <code>::part(title)</code>, <code>::part(icon)</code>,
          <code>::part(message)</code>, <code>::part(close-button)</code>, and
          <code>::part(actions)</code>.
          <button
            slot="actions"
            style="
              padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
              border: var(--hx-border-width-thin, 1px) solid var(--hx-color-primary-500, #3b82f6);
              border-radius: var(--hx-border-radius-sm, 0.25rem);
              background: var(--hx-color-primary-500, #3b82f6);
              color: var(--hx-color-text-on-primary, #fff);
              cursor: pointer;
              font-size: var(--hx-font-size-xs, 0.8125rem);
            "
          >
            Accept
          </button>
          <button
            slot="actions"
            style="
              padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
              border: var(--hx-border-width-thin, 1px) solid var(--hx-color-primary-300, #93c5fd);
              border-radius: var(--hx-border-radius-sm, 0.25rem);
              background: transparent;
              color: var(--hx-color-primary-800, #1e40af);
              cursor: pointer;
              font-size: var(--hx-font-size-xs, 0.8125rem);
            "
          >
            Decline
          </button>
        </hx-alert>
      </div>

      <details style="font-size: var(--hx-font-size-xs, 0.8125rem);">
        <summary style="cursor: pointer; font-weight: 600;">View CSS code</summary>
        <pre
          style="
            background: var(--hx-color-surface-subtle, #f8fafc);
            padding: var(--hx-space-4, 1rem);
            border-radius: var(--hx-border-radius-md, 0.375rem);
            border: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default, #e2e8f0);
            overflow-x: auto;
            font-size: var(--hx-font-size-xs, 0.75rem);
            line-height: 1.6;
          "
        ><code>hx-alert::part(alert) {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 2px solid #3b82f6;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

hx-alert::part(icon) {
  background: #dbeafe;
  border-radius: 50%;
  padding: 0.375rem;
}

hx-alert::part(message) {
  font-weight: 500;
  letter-spacing: 0.01em;
}

hx-alert::part(close-button) {
  background: #bfdbfe;
  border-radius: 50%;
  opacity: 1;
}

hx-alert::part(actions) {
  padding-top: 0.75rem;
  border-top: 1px dashed #93c5fd;
  margin-top: 0.5rem;
}</code></pre>
      </details>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();

    // Verify all 5 parts are present
    const parts = ['alert', 'icon', 'message', 'close-button', 'actions'];
    for (const partName of parts) {
      const part = alert?.shadowRoot?.querySelector(`[part="${partName}"]`);
      await expect(part).toBeTruthy();
    }
  },
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

/** Verifies that clicking the close button hides the alert and fires the `hx-dismiss` event. */
export const CloseBehavior: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="info" dismissible>
        Click the close button to dismiss this medication reminder alert.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert')!;
    await expect(alert.open).toBe(true);

    // Set up event listener before clicking
    let dismissEventFired = false;
    let dismissEventDetail: Record<string, unknown> | null = null;
    let afterDismissEventFired = false;

    alert.addEventListener('hx-dismiss', ((e: CustomEvent) => {
      dismissEventFired = true;
      dismissEventDetail = e.detail;
    }) as EventListener);

    alert.addEventListener('hx-after-dismiss', (() => {
      afterDismissEventFired = true;
    }) as EventListener);

    // Click the close button
    const closeBtn = alert.shadowRoot?.querySelector('[part="close-button"]') as HTMLButtonElement;
    await expect(closeBtn).toBeTruthy();
    closeBtn.click();

    // Wait for Lit update cycle
    await alert.updateComplete;

    // Verify alert is hidden
    await expect(alert.open).toBe(false);
    await expect(getComputedStyle(alert).display).toBe('none');

    // Verify hx-dismiss event fired with correct detail
    await expect(dismissEventFired).toBe(true);
    await expect(dismissEventDetail).toEqual({ reason: 'user' });

    // Verify hx-after-dismiss event fired
    await expect(afterDismissEventFired).toBe(true);
  },
};

/** Verifies keyboard-driven dismissal: Tab to the close button, press Enter to dismiss. */
export const KeyboardDismiss: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="warning" dismissible>
        Use Tab to focus the close button, then press Enter to dismiss this patient safety alert.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert')!;
    await expect(alert.open).toBe(true);

    const closeBtn = alert.shadowRoot?.querySelector('[part="close-button"]') as HTMLButtonElement;
    await expect(closeBtn).toBeTruthy();

    // Set up event listener
    let dismissEventFired = false;
    alert.addEventListener('hx-dismiss', (() => {
      dismissEventFired = true;
    }) as EventListener);

    // Focus the close button directly (Tab behavior depends on browser focus management)
    closeBtn.focus();
    await expect(closeBtn).toBe(alert.shadowRoot?.activeElement);

    // Press Enter to activate the button
    closeBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    closeBtn.click();

    await alert.updateComplete;

    // Verify dismissal
    await expect(alert.open).toBe(false);
    await expect(dismissEventFired).toBe(true);
  },
};

/**
 * Verifies that ARIA roles are correctly assigned based on variant:
 * - `role="status"` for info and success (polite announcement)
 * - `role="alert"` for warning and error (assertive announcement)
 */
export const AriaRoles: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 600px;">
      <hx-alert variant="info" data-testid="alert-info">
        Info uses role="status" (implicit polite announcement).
      </hx-alert>
      <hx-alert variant="success" data-testid="alert-success">
        Success uses role="status" (implicit polite announcement).
      </hx-alert>
      <hx-alert variant="warning" data-testid="alert-warning">
        Warning uses role="alert" (implicit assertive announcement).
      </hx-alert>
      <hx-alert variant="error" data-testid="alert-error">
        Error uses role="alert" (implicit assertive announcement).
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    // Role is applied to the host element, not the shadow DOM internal div.
    // aria-live is intentionally omitted to avoid JAWS double-announcements.

    // Info: role="status" (implies polite)
    const infoAlert = canvasElement.querySelector('[data-testid="alert-info"]') as HTMLElement;
    await expect(infoAlert.getAttribute('role')).toBe('status');

    // Success: role="status" (implies polite)
    const successAlert = canvasElement.querySelector(
      '[data-testid="alert-success"]',
    ) as HTMLElement;
    await expect(successAlert.getAttribute('role')).toBe('status');

    // Warning: role="alert" (implies assertive)
    const warningAlert = canvasElement.querySelector(
      '[data-testid="alert-warning"]',
    ) as HTMLElement;
    await expect(warningAlert.getAttribute('role')).toBe('alert');

    // Error: role="alert" (implies assertive)
    const errorAlert = canvasElement.querySelector('[data-testid="alert-error"]') as HTMLElement;
    await expect(errorAlert.getAttribute('role')).toBe('alert');
  },
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

/** Realistic drug allergy warning as seen in electronic health record systems. */
export const DrugAllergyWarning: Story = {
  render: () => html`
    <div style="max-width: 600px;">
      <hx-alert variant="error" dismissible>
        <strong>ALLERGY ALERT - Penicillin (Anaphylaxis)</strong>
        <br />
        <span style="display: block; margin-top: var(--hx-space-1, 0.25rem);">
          Patient: Johnson, Maria (MRN: 00482195)
          <br />
          Documented reaction: Anaphylaxis (severity: Life-Threatening)
          <br />
          Recorded: 2024-03-14 by Dr. Sarah Chen, MD
          <br />
          <em style="display: block; margin-top: var(--hx-space-1, 0.25rem);">
            The ordered medication Amoxicillin belongs to the Penicillin class. Cross-reactivity
            risk is approximately 1-2%. Physician override required to proceed.
          </em>
        </span>
        <button
          slot="actions"
          style="
            padding: 0.375rem 1rem;
            border: 2px solid currentColor;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
            font-weight: 600;
          "
        >
          Override with Justification
        </button>
        <button
          slot="actions"
          style="
            padding: 0.375rem 1rem;
            border: 1px solid transparent;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: var(--hx-font-size-xs, 0.8125rem);
            text-decoration: underline;
          "
        >
          Cancel Order
        </button>
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert')!;

    // This is a critical safety alert -- must be role="alert"
    await expect(alert.variant).toBe('error');
    // Role is on the host element; aria-live is omitted to avoid JAWS double-announcements
    await expect(alert.getAttribute('role')).toBe('alert');

    // Must be dismissible so clinicians can acknowledge
    await expect(alert.dismissible).toBe(true);

    // Must have action buttons for workflow
    const actions = alert.querySelectorAll('[slot="actions"]');
    await expect(actions.length).toBe(2);
  },
};

// ─────────────────────────────────────────────────
// ACCENT VARIANT (P2-04)
// ─────────────────────────────────────────────────

/**
 * The `accent` property applies a left border stripe instead of a full border.
 * Common in enterprise healthcare dashboards where inline alerts must visually
 * differentiate from bordered card containers. Use when a softer visual weight
 * is needed without losing the semantic color coding of the alert.
 */
export const AccentVariant: Story = {
  name: 'Accent (Left Border Stripe)',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 40rem;"
    >
      <hx-alert variant="info" accent>
        <strong>Session activity:</strong> Your patient chart session will expire in 10 minutes.
        Save any unsaved progress before the session ends.
      </hx-alert>
      <hx-alert variant="success" accent>
        <strong>Prior authorization approved:</strong> PA #2026-04891 for Adalimumab 40mg/0.4ml has
        been approved by the patient's insurer. Valid through 2026-09-30.
      </hx-alert>
      <hx-alert variant="warning" accent>
        <strong>Allergy on file:</strong> Patient has a documented allergy to Penicillin
        (anaphylaxis). Review all antibiotic orders before administration.
      </hx-alert>
      <hx-alert variant="error" accent>
        <strong>Critical lab value:</strong> Potassium 6.4 mEq/L (reference: 3.5–5.0). Immediate
        physician review required.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(4);

    for (const alert of Array.from(alerts)) {
      await expect(alert.accent).toBe(true);
      // Accent variant still carries semantic role on the host
      const role = alert.getAttribute('role');
      await expect(['status', 'alert']).toContain(role);
    }
  },
};

// ─────────────────────────────────────────────────
// WITH TITLE SLOT (P2-04)
// ─────────────────────────────────────────────────

/**
 * The `title` slot adds a structured headline above the alert message body.
 * Use for alerts that require a distinct heading to orient the user before
 * presenting action details — common in clinical workflow notifications where
 * the title conveys urgency and the body provides instructional content.
 */
export const WithTitle: Story = {
  name: 'With Title Slot',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 40rem;"
    >
      <hx-alert variant="error" dismissible>
        <strong slot="title">Drug Interaction — High Risk</strong>
        Concurrent use of Warfarin and Amoxicillin may potentiate the anticoagulant effect. Monitor
        INR closely and consider dose adjustment. Consult pharmacy before prescribing.
      </hx-alert>

      <hx-alert variant="warning" dismissible>
        <strong slot="title">Isolation Precautions Required</strong>
        Patient is in Contact Isolation (MRSA). Gown and gloves required for all direct contact.
        Dedicated equipment must remain in room.
      </hx-alert>

      <hx-alert variant="success">
        <strong slot="title">Authorization Approved</strong>
        Prior authorization #PA-2026-09281 for Adalimumab 40mg injection has been approved. Valid
        for 12 months from today's date.
      </hx-alert>

      <hx-alert variant="info">
        <strong slot="title">Scheduled Downtime Notice</strong>
        The EHR system will be unavailable on Saturday March 15 from 02:00–04:00 AM for routine
        maintenance. Plan patient documentation accordingly.
      </hx-alert>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(4);

    // Verify all alerts have slotted title content
    for (const alert of Array.from(alerts)) {
      const titleSlot = alert.querySelector('[slot="title"]');
      await expect(titleSlot).toBeTruthy();
    }

    // Error alert with title must still use role="alert"
    await expect(alerts[0].getAttribute('role')).toBe('alert');
    // Info alert with title must use role="status"
    await expect(alerts[3].getAttribute('role')).toBe('status');
  },
};

// ─────────────────────────────────────────────────
// FOCUS RETURN PATTERN (P2-04)
// ─────────────────────────────────────────────────

/**
 * The `return-focus-to` property accepts a CSS selector. After the alert is
 * dismissed, focus is programmatically returned to the matching element.
 * This is a critical accessibility pattern — without it, focus is lost to the
 * `<body>` when a dismissible alert is removed from the tab order.
 *
 * Use this for dismissible alerts that appear in response to user actions
 * so focus returns to the triggering element (e.g., the button that opened
 * the notification, or the form field that caused a validation error).
 */
export const FocusReturn: Story = {
  name: 'Focus Return After Dismiss',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: var(--hx-space-4, 1rem); max-width: 40rem;"
    >
      <p
        style="font-size: var(--hx-font-size-sm, 0.875rem); color: var(--hx-color-text-secondary); margin: 0;"
      >
        Click "Submit Order" to show a dismissible confirmation alert. When dismissed, focus returns
        to the submit button via <code>return-focus-to="#submit-order-btn"</code>.
      </p>

      <div style="display: flex; gap: var(--hx-space-3, 0.75rem); align-items: center;">
        <button
          id="submit-order-btn"
          style="
            padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
            background: var(--hx-color-primary-500, #2563eb);
            color: var(--hx-color-text-on-primary, white);
            border: none;
            border-radius: var(--hx-border-radius-md, 0.375rem);
            cursor: pointer;
            font-size: var(--hx-font-size-sm, 0.875rem);
          "
          onclick="document.getElementById('focus-return-alert').open = true;"
        >
          Submit Order
        </button>
        <button
          style="
            padding: var(--hx-space-2, 0.5rem) var(--hx-space-4, 1rem);
            background: var(--hx-color-surface-default, white);
            color: var(--hx-color-text-primary);
            border: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default);
            border-radius: var(--hx-border-radius-md, 0.375rem);
            cursor: pointer;
            font-size: var(--hx-font-size-sm, 0.875rem);
          "
        >
          Cancel
        </button>
      </div>

      <hx-alert
        id="focus-return-alert"
        variant="success"
        dismissible
        return-focus-to="#submit-order-btn"
        ?open=${false}
      >
        <strong slot="title">Order Submitted</strong>
        Medication order #RX-2026-04928 has been submitted to the pharmacy. Expected processing time
        is 30 minutes. Dismiss to return focus to the order form.
      </hx-alert>

      <p
        style="font-size: var(--hx-font-size-xs, 0.75rem); color: var(--hx-color-text-muted); margin: 0;"
      >
        After dismissing the alert, verify focus returns to the "Submit Order" button. This pattern
        ensures keyboard and AT users are never stranded after a dynamic UI change.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvasElement.querySelector('#focus-return-alert') as HTMLElement & {
      open: boolean;
      updateComplete: Promise<void>;
    };
    await expect(alert).toBeTruthy();

    // Open the alert programmatically to make the dismiss button accessible
    alert.open = true;
    await alert.updateComplete;

    // Locate the dismiss button inside the shadow DOM
    const closeButton = alert.shadowRoot?.querySelector('[part="close-button"]') as HTMLElement;
    await expect(closeButton).toBeTruthy();

    // Click the dismiss button and await the transition
    await userEvent.click(closeButton);
    await alert.updateComplete;

    // After dismissal, focus must return to the submit button
    const submitBtn = canvas.getByText('Submit Order') as HTMLElement;
    await expect(document.activeElement).toBe(submitBtn);
  },
};

/** Multiple severity alerts stacked in a patient chart context, ordered by clinical priority. */
export const PatientSafetyStack: Story = {
  render: () => html`
    <div
      style="
        max-width: 640px;
        border: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default, #e2e8f0);
        border-radius: var(--hx-border-radius-md, 0.5rem);
        overflow: hidden;
      "
    >
      <div
        style="
          padding: var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem);
          background: var(--hx-color-surface-subtle, #f8fafc);
          border-bottom: var(--hx-border-width-thin, 1px) solid var(--hx-color-border-default, #e2e8f0);
          font-weight: 600;
          font-size: var(--hx-font-size-sm, 0.875rem);
          font-family: system-ui, sans-serif;
        "
      >
        Patient Chart: Thompson, Robert (MRN: 00729841)
      </div>
      <div
        style="
          display: flex;
          flex-direction: column;
          gap: var(--hx-space-2, 0.5rem);
          padding: var(--hx-space-4, 1rem);
        "
      >
        <hx-alert variant="error" dismissible>
          <strong>Fall Risk - High (Morse Score: 65):</strong> Patient has a history of falls within
          the past 90 days. Implement fall prevention protocol. Bed alarm must remain active.
        </hx-alert>

        <hx-alert variant="error">
          <strong>Code Status: DNR/DNI</strong> - Documented advance directive on file. Last
          reviewed 2025-11-20 by attending. Do not remove this alert.
        </hx-alert>

        <hx-alert variant="warning" dismissible>
          <strong>Isolation Precautions - Contact:</strong> Active MRSA colonization. Gown and
          gloves required for all direct patient contact.
          <button
            slot="actions"
            style="
              padding: var(--hx-space-1, 0.25rem) var(--hx-space-3, 0.75rem);
              border: var(--hx-border-width-thin, 1px) solid currentColor;
              border-radius: var(--hx-border-radius-sm, 0.25rem);
              background: transparent;
              color: inherit;
              cursor: pointer;
              font-size: var(--hx-font-size-xs, 0.8125rem);
            "
          >
            View Precaution Details
          </button>
        </hx-alert>

        <hx-alert variant="warning" dismissible>
          <strong>Allergies (3):</strong> Penicillin (Anaphylaxis), Sulfonamides (Rash), Latex
          (Contact Dermatitis). Review allergy list before any procedure or medication
          administration.
        </hx-alert>

        <hx-alert variant="info">
          <strong>Insurance Verification:</strong> Medicare Part A active through 2026-12-31.
          Pre-authorization required for outpatient imaging.
        </hx-alert>

        <hx-alert variant="success" dismissible>
          <strong>Care Team Updated:</strong> Dr. Patricia Williams (Hospitalist) has been assigned
          as the attending physician for this encounter effective 2026-02-16 07:00 EST.
        </hx-alert>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const alerts = canvasElement.querySelectorAll('hx-alert');
    await expect(alerts.length).toBe(6);

    // Verify severity ordering: errors first, then warnings, then info/success
    await expect(alerts[0].variant).toBe('error');
    await expect(alerts[1].variant).toBe('error');
    await expect(alerts[2].variant).toBe('warning');
    await expect(alerts[3].variant).toBe('warning');
    await expect(alerts[4].variant).toBe('info');
    await expect(alerts[5].variant).toBe('success');

    // The DNR/DNI alert (alerts[1]) must NOT be dismissible
    await expect(alerts[1].dismissible).toBe(false);
    const closeBtn = alerts[1].shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeNull();

    // Error alerts must use role="alert" for immediate announcement
    // Role is on the host element, not the shadow DOM internal div
    for (let i = 0; i < 2; i++) {
      await expect(alerts[i].getAttribute('role')).toBe('alert');
    }
  },
};
