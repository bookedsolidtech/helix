import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-badge.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Badge',
  component: 'hx-badge',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'error', 'neutral', 'info'],
      description: 'Visual style variant that determines the badge color scheme.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: {
          summary:
            "'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'error' | 'neutral' | 'info'",
        },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Controls the font size and padding of the badge.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    pill: {
      control: 'boolean',
      description: 'Applies fully rounded (pill) border-radius styling.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    pulse: {
      control: 'boolean',
      description: 'Enables an animated pulse effect to draw user attention.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    removable: {
      control: 'boolean',
      description: 'Renders a dismiss button. Fires hx-remove when clicked.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Badge label text passed via the default slot.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    pill: false,
    pulse: false,
    removable: false,
    label: 'Badge',
  },
  render: (args) => html`
    <hx-badge
      variant=${args.variant}
      hx-size=${args.size}
      ?pill=${args.pill}
      ?pulse=${args.pulse}
      ?removable=${args.removable}
    >
      ${args.label}
    </hx-badge>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ════════════════════════════════════════════════════════════════════════════
// 1. DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Primary use case: a standard badge with default settings and verification. */
export const Default: Story = {
  args: {
    variant: 'primary',
    label: 'New',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();

    const shadowSpan = badge?.shadowRoot?.querySelector('span');
    await expect(shadowSpan).toBeTruthy();
    await expect(shadowSpan?.classList.contains('badge')).toBe(true);
    await expect(shadowSpan?.classList.contains('badge--primary')).toBe(true);
    await expect(shadowSpan?.classList.contains('badge--md')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 2. VARIANT STORIES
// ════════════════════════════════════════════════════════════════════════════

/** Primary variant used for general-purpose status indicators. */
export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Active',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--primary')).toBe(true);
  },
};

/** Success variant for positive outcomes such as completed procedures or stable vitals. */
export const Success: Story = {
  args: {
    variant: 'success',
    label: 'Verified',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--success')).toBe(true);
  },
};

/** Warning variant for conditions requiring clinical attention. */
export const Warning: Story = {
  args: {
    variant: 'warning',
    label: 'Review',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--warning')).toBe(true);
  },
};

/** Error variant for critical alerts, abnormal results, or system failures. */
export const Error: Story = {
  args: {
    variant: 'error',
    label: 'Critical',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--error')).toBe(true);
  },
};

/** Neutral variant for informational labels without urgency. */
export const Neutral: Story = {
  args: {
    variant: 'neutral',
    label: 'Archived',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--neutral')).toBe(true);
  },
};

/** Secondary variant for supplementary status labels with reduced visual weight. */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Draft',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--secondary')).toBe(true);
  },
};

/** Danger variant for destructive actions and high-risk clinical conditions. */
export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Do Not Administer',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--danger')).toBe(true);
  },
};

/** Info variant for neutral informational notices and guidance messages. */
export const Info: Story = {
  args: {
    variant: 'info',
    label: 'Note',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--info')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 3. SIZE STORIES
// ════════════════════════════════════════════════════════════════════════════

/** Small badge for compact layouts such as table cells or inline indicators. */
export const Small: Story = {
  args: {
    size: 'sm',
    label: 'SM',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--sm')).toBe(true);
  },
};

/** Medium badge (default) for standard use across the interface. */
export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Medium',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--md')).toBe(true);
  },
};

/** Large badge for prominent status callouts and dashboard indicators. */
export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Large',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--lg')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 4. SPECIAL MODES
// ════════════════════════════════════════════════════════════════════════════

/** Pill mode applies fully rounded corners, ideal for notification counts. */
export const Pill: Story = {
  args: {
    pill: true,
    label: '42',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--pill')).toBe(true);
  },
};

/** Pulsing badge draws immediate attention to time-sensitive clinical alerts. */
export const Pulsing: Story = {
  args: {
    pulse: true,
    variant: 'error',
    label: '3 Stat',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span?.classList.contains('badge--pulse')).toBe(true);
  },
};

/** Dot indicator: an empty badge with pulse renders as a small notification dot. */
export const DotIndicator: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="position: relative; display: inline-block;">
        <span
          style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
          >Messages</span
        >
        <hx-badge
          variant="error"
          pulse
          style="position: absolute; top: -4px; right: -10px;"
        ></hx-badge>
      </div>
      <div style="position: relative; display: inline-block;">
        <span
          style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
          >Lab Results</span
        >
        <hx-badge
          variant="success"
          pulse
          style="position: absolute; top: -4px; right: -10px;"
        ></hx-badge>
      </div>
      <div style="position: relative; display: inline-block;">
        <span
          style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
          >Orders</span
        >
        <hx-badge
          variant="warning"
          pulse
          style="position: absolute; top: -4px; right: -10px;"
        ></hx-badge>
      </div>
      <div style="position: relative; display: inline-block;">
        <span
          style="font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
          >Alerts</span
        >
        <hx-badge
          variant="primary"
          pulse
          style="position: absolute; top: -4px; right: -10px;"
        ></hx-badge>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(4);

    for (const badge of badges) {
      const span = badge.shadowRoot?.querySelector('span');
      await expect(span?.classList.contains('badge--dot')).toBe(true);
      await expect(span?.classList.contains('badge--pulse')).toBe(true);
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 5. KITCHEN SINKS
// ════════════════════════════════════════════════════════════════════════════

/** All eight variants displayed side by side for visual comparison. */
export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
      <hx-badge variant="primary">Primary</hx-badge>
      <hx-badge variant="secondary">Secondary</hx-badge>
      <hx-badge variant="success">Success</hx-badge>
      <hx-badge variant="warning">Warning</hx-badge>
      <hx-badge variant="danger">Danger</hx-badge>
      <hx-badge variant="error">Error</hx-badge>
      <hx-badge variant="neutral">Neutral</hx-badge>
      <hx-badge variant="info">Info</hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(8);
  },
};

/** All three sizes displayed side by side for visual comparison. */
export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <hx-badge hx-size="sm">Small</hx-badge>
      <hx-badge hx-size="md">Medium</hx-badge>
      <hx-badge hx-size="lg">Large</hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(3);
  },
};

/** Complete matrix of every variant at every size for comprehensive visual review. */
export const AllCombinations: Story = {
  render: () => {
    const variants = [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
      'error',
      'neutral',
      'info',
    ] as const;
    const sizes = ['sm', 'md', 'lg'] as const;

    return html`
      <div
        style="display: grid; grid-template-columns: auto repeat(3, 1fr); gap: 1rem; align-items: center; font-family: var(--hx-font-family-sans, sans-serif);"
      >
        <div></div>
        <div
          style="font-weight: 600; color: var(--hx-color-neutral-500, #6b7280); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Small
        </div>
        <div
          style="font-weight: 600; color: var(--hx-color-neutral-500, #6b7280); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Medium
        </div>
        <div
          style="font-weight: 600; color: var(--hx-color-neutral-500, #6b7280); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;"
        >
          Large
        </div>
        ${variants.map(
          (variant) => html`
            <div
              style="font-weight: 600; color: var(--hx-color-neutral-700, #374151); text-transform: capitalize;"
            >
              ${variant}
            </div>
            ${sizes.map(
              (size) => html`
                <div><hx-badge variant=${variant} hx-size=${size}>${variant}</hx-badge></div>
              `,
            )}
          `,
        )}
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(24);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 6. COMPOSITION
// ════════════════════════════════════════════════════════════════════════════

/** Badge positioned on a button to indicate a notification count. */
export const OnAButton: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center;">
      <div style="position: relative; display: inline-block;">
        <hx-button variant="secondary"> Inbox </hx-button>
        <hx-badge
          variant="error"
          pill
          hx-size="sm"
          style="position: absolute; top: -6px; right: -8px;"
          >7</hx-badge
        >
      </div>
      <div style="position: relative; display: inline-block;">
        <hx-button variant="primary"> Orders </hx-button>
        <hx-badge
          variant="warning"
          pill
          pulse
          hx-size="sm"
          style="position: absolute; top: -6px; right: -8px;"
          >3</hx-badge
        >
      </div>
      <div style="position: relative; display: inline-block;">
        <hx-button variant="ghost"> Notifications </hx-button>
        <hx-badge
          variant="error"
          pulse
          style="position: absolute; top: -2px; right: -4px;"
        ></hx-badge>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(3);
    const buttons = canvasElement.querySelectorAll('hx-button');
    await expect(buttons.length).toBe(3);
  },
};

/** Badge used in a card heading area for status indication. */
export const InCardHeader: Story = {
  render: () => html`
    <hx-card style="max-width: 400px;">
      <div
        slot="heading"
        style="display: flex; justify-content: space-between; align-items: center;"
      >
        <span>Patient Record #4821</span>
        <hx-badge variant="success" hx-size="sm">Active</hx-badge>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
        >
          <strong>Name:</strong> Jane Doe
        </p>
        <p
          style="margin: 0 0 0.5rem; font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
        >
          <strong>DOB:</strong> 1985-03-12
        </p>
        <p
          style="margin: 0; font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-700, #374151);"
        >
          <strong>MRN:</strong> MRN-0048210
        </p>
      </div>
    </hx-card>
  `,
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();
  },
};

/** Healthcare-specific patient status badges used in clinical dashboards. */
export const PatientStatusBadges: Story = {
  render: () => html`
    <div style="font-family: var(--hx-font-family-sans, sans-serif);">
      <h3 style="margin: 0 0 1rem; color: var(--hx-color-neutral-800, #1f2937);">Patient Census</h3>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div
          style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Rm 204 - Thompson, R.</span>
          <hx-badge variant="error" pulse>Critical</hx-badge>
        </div>
        <div
          style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Rm 207 - Garcia, M.</span>
          <hx-badge variant="success">Stable</hx-badge>
        </div>
        <div
          style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Rm 210 - Patel, S.</span>
          <hx-badge variant="neutral">Discharged</hx-badge>
        </div>
        <div
          style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem;"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Rm 215 - Chen, L.</span>
          <hx-badge variant="warning">Pending Review</hx-badge>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(4);

    const variants = ['error', 'success', 'neutral', 'warning'];
    badges.forEach((badge, i) => {
      expect(badge.getAttribute('variant')).toBe(variants[i]);
    });
  },
};

/** Badges composed with other components: alerts, cards, and headings. */
export const WithOtherComponents: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 600px;">
      <!-- Badge in a heading -->
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <h2
          style="margin: 0; font-family: var(--hx-font-family-sans, sans-serif); color: var(--hx-color-neutral-800, #1f2937);"
        >
          Lab Results
        </h2>
        <hx-badge variant="error" pill pulse>5 New</hx-badge>
      </div>

      <!-- Badge inside an alert -->
      <hx-alert variant="warning" open>
        Patient has <hx-badge variant="error" hx-size="sm">3</hx-badge> overdue medication orders
        requiring physician review.
      </hx-alert>

      <!-- Badges inside a card -->
      <hx-card>
        <span slot="heading">Department Overview</span>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <hx-badge variant="primary" pill>ICU: 12</hx-badge>
          <hx-badge variant="success" pill>Med-Surg: 28</hx-badge>
          <hx-badge variant="warning" pill>ED: 15</hx-badge>
          <hx-badge variant="error" pill pulse>NICU: 4</hx-badge>
          <hx-badge variant="neutral" pill>Rehab: 8</hx-badge>
        </div>
      </hx-card>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(9);
    const alert = canvasElement.querySelector('hx-alert');
    await expect(alert).toBeTruthy();
    const card = canvasElement.querySelector('hx-card');
    await expect(card).toBeTruthy();
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 7. EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

/** Demonstrates badge behavior with long text content. */
export const LongContent: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 400px;">
      <hx-badge variant="primary">Pending Physician Authorization Required</hx-badge>
      <hx-badge variant="warning">Multi-Drug Resistant Organism Precautions</hx-badge>
      <hx-badge variant="error">Critical Lab Value Outside Normal Range</hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(3);
  },
};

/** Single-character badges used for compact indicators and counters. */
export const SingleCharacter: Story = {
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <hx-badge variant="primary" pill>1</hx-badge>
      <hx-badge variant="error" pill>A</hx-badge>
      <hx-badge variant="success" pill>3</hx-badge>
      <hx-badge variant="warning" pill>!</hx-badge>
      <hx-badge variant="neutral" pill>0</hx-badge>
      <hx-badge variant="primary" pill>9</hx-badge>
      <hx-badge variant="error" pill hx-size="sm">2</hx-badge>
      <hx-badge variant="success" pill hx-size="lg">7</hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(8);
  },
};

/** Empty badge with pulse renders as a dot indicator; without pulse it is an empty span. */
export const EmptyBadge: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 1.5rem; align-items: center; font-family: var(--hx-font-family-sans, sans-serif);"
    >
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="color: var(--hx-color-neutral-600, #4b5563);">With pulse (dot):</span>
        <hx-badge variant="error" pulse></hx-badge>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="color: var(--hx-color-neutral-600, #4b5563);">Without pulse (empty):</span>
        <hx-badge variant="primary"></hx-badge>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(2);

    const dotBadge = badges[0].shadowRoot?.querySelector('span');
    await expect(dotBadge?.classList.contains('badge--dot')).toBe(true);

    const emptyBadge = badges[1].shadowRoot?.querySelector('span');
    await expect(emptyBadge?.classList.contains('badge--dot')).toBe(false);
  },
};

/** Stress test: many badges in a row demonstrating wrapping behavior. */
export const ManyBadges: Story = {
  render: () => {
    const departments = [
      'Cardiology',
      'Neurology',
      'Oncology',
      'Pediatrics',
      'Radiology',
      'Orthopedics',
      'Dermatology',
      'Gastroenterology',
      'Pulmonology',
      'Nephrology',
      'Endocrinology',
      'Rheumatology',
      'Urology',
      'Hematology',
      'Ophthalmology',
      'Psychiatry',
      'Pathology',
      'Anesthesiology',
      'Emergency',
      'Surgery',
      'Internal Medicine',
      'Family Medicine',
      'Geriatrics',
      'Infectious Disease',
    ];
    const variants = [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
      'error',
      'neutral',
      'info',
    ] as const;

    return html`
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; max-width: 700px;">
        ${departments.map(
          (dept, i) => html`
            <hx-badge variant=${variants[i % variants.length]} hx-size="sm">${dept}</hx-badge>
          `,
        )}
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(24);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 8. CSS CUSTOM PROPERTIES DEMO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates overriding all `--hx-badge-*` CSS custom properties.
 *
 * Available properties:
 * - `--hx-badge-bg` — Badge background color
 * - `--hx-badge-color` — Badge text color
 * - `--hx-badge-font-size` — Badge font size
 * - `--hx-badge-font-weight` — Badge font weight
 * - `--hx-badge-font-family` — Badge font family
 * - `--hx-badge-border-radius` — Badge border radius
 * - `--hx-badge-padding-x` — Badge horizontal padding
 * - `--hx-badge-padding-y` — Badge vertical padding
 * - `--hx-badge-pulse-color` — Pulse animation color
 * - `--hx-badge-dot-size` — Dot indicator size
 */
export const CSSCustomProperties: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1.5rem; font-family: var(--hx-font-family-sans, sans-serif);"
    >
      <!-- Custom background and text color -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-bg / --hx-badge-color
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <hx-badge style="--hx-badge-bg: #7c3aed; --hx-badge-color: #ffffff;"
            >Custom Purple</hx-badge
          >
          <hx-badge style="--hx-badge-bg: #0891b2; --hx-badge-color: #ecfeff;"
            >Custom Teal</hx-badge
          >
          <hx-badge style="--hx-badge-bg: #1e1e1e; --hx-badge-color: #fbbf24;">Dark Gold</hx-badge>
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-bg: #7c3aed; --hx-badge-color: #ffffff;"
        </code>
      </div>

      <!-- Custom font size -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-font-size
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <hx-badge style="--hx-badge-font-size: 0.625rem;">0.625rem</hx-badge>
          <hx-badge style="--hx-badge-font-size: 1rem;">1rem</hx-badge>
          <hx-badge style="--hx-badge-font-size: 1.25rem;">1.25rem</hx-badge>
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-font-size: 1rem;"
        </code>
      </div>

      <!-- Custom font weight and family -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-font-weight / --hx-badge-font-family
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <hx-badge style="--hx-badge-font-weight: 400;">Normal Weight</hx-badge>
          <hx-badge style="--hx-badge-font-weight: 800;">Extra Bold</hx-badge>
          <hx-badge
            style="--hx-badge-font-family: 'Courier New', monospace; --hx-badge-font-weight: 700;"
            >Monospace</hx-badge
          >
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-font-family: 'Courier New', monospace;"
        </code>
      </div>

      <!-- Custom border radius -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-border-radius
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <hx-badge style="--hx-badge-border-radius: 0;">Square</hx-badge>
          <hx-badge style="--hx-badge-border-radius: 0.25rem;">Subtle</hx-badge>
          <hx-badge style="--hx-badge-border-radius: 9999px;">Full Round</hx-badge>
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-border-radius: 0;"
        </code>
      </div>

      <!-- Custom padding -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-padding-x / --hx-badge-padding-y
        </p>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <hx-badge style="--hx-badge-padding-x: 0.25rem; --hx-badge-padding-y: 0;"
            >Compact</hx-badge
          >
          <hx-badge>Default</hx-badge>
          <hx-badge style="--hx-badge-padding-x: 1.5rem; --hx-badge-padding-y: 0.5rem;"
            >Spacious</hx-badge
          >
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-padding-x: 1.5rem; --hx-badge-padding-y: 0.5rem;"
        </code>
      </div>

      <!-- Custom dot size -->
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          --hx-badge-dot-size
        </p>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <hx-badge variant="error" pulse style="--hx-badge-dot-size: 0.375rem;"></hx-badge>
          <hx-badge variant="error" pulse></hx-badge>
          <hx-badge variant="error" pulse style="--hx-badge-dot-size: 1rem;"></hx-badge>
          <hx-badge variant="error" pulse style="--hx-badge-dot-size: 1.5rem;"></hx-badge>
        </div>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          style="--hx-badge-dot-size: 1rem;"
        </code>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBeGreaterThan(0);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 9. CSS PARTS DEMO
// ════════════════════════════════════════════════════════════════════════════

/**
 * Demonstrates styling the `::part(badge)` CSS part from outside the shadow DOM.
 *
 * The `hx-badge` component exposes one part:
 * - `badge` — The outer `<span>` element that contains the badge content.
 *
 * Use `hx-badge::part(badge)` in a stylesheet to apply external styling.
 */
export const CSSParts: Story = {
  render: () => html`
    <style>
      .css-parts-demo hx-badge.outlined::part(badge) {
        background: transparent;
        border: 2px solid var(--hx-color-primary-500, #2563eb);
        color: var(--hx-color-primary-500, #2563eb);
      }
      .css-parts-demo hx-badge.gradient::part(badge) {
        background: linear-gradient(135deg, #6366f1, #ec4899);
        color: #ffffff;
        border: none;
      }
      .css-parts-demo hx-badge.elevated::part(badge) {
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -2px rgba(0, 0, 0, 0.1);
      }
      .css-parts-demo hx-badge.large-text::part(badge) {
        font-size: 1rem;
        padding: 0.5rem 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    </style>
    <div
      class="css-parts-demo"
      style="display: flex; flex-direction: column; gap: 1.5rem; font-family: var(--hx-font-family-sans, sans-serif);"
    >
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          Outlined (::part(badge) with border and transparent bg)
        </p>
        <hx-badge class="outlined">Outlined Badge</hx-badge>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          hx-badge::part(badge) { background: transparent; border: 2px solid ...; }
        </code>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          Gradient (::part(badge) with background gradient)
        </p>
        <hx-badge class="gradient">Gradient Badge</hx-badge>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          hx-badge::part(badge) { background: linear-gradient(135deg, #6366f1, #ec4899); }
        </code>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          Elevated (::part(badge) with box-shadow)
        </p>
        <hx-badge class="elevated">Elevated Badge</hx-badge>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          hx-badge::part(badge) { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        </code>
      </div>
      <div>
        <p
          style="margin: 0 0 0.5rem; font-weight: 600; color: var(--hx-color-neutral-700, #374151);"
        >
          Large text (::part(badge) with font overrides)
        </p>
        <hx-badge class="large-text">Uppercase Badge</hx-badge>
        <code
          style="display: block; margin-top: 0.5rem; font-size: 0.75rem; color: var(--hx-color-neutral-500, #6b7280);"
        >
          hx-badge::part(badge) { font-size: 1rem; text-transform: uppercase; }
        </code>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(4);

    for (const badge of badges) {
      const part = badge.shadowRoot?.querySelector('[part="badge"]');
      await expect(part).toBeTruthy();
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 10. INTERACTION TESTS
// ════════════════════════════════════════════════════════════════════════════

/** Verifies that the badge renders correctly with the expected variant class. */
export const InteractionRendering: Story = {
  args: {
    variant: 'success',
    size: 'md',
    label: 'Verified',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();
    await expect(badge?.getAttribute('variant')).toBe('success');

    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span).toBeTruthy();
    await expect(span?.classList.contains('badge')).toBe(true);
    await expect(span?.classList.contains('badge--success')).toBe(true);
    await expect(span?.classList.contains('badge--md')).toBe(true);
    await expect(span?.classList.contains('badge--pulse')).toBe(false);
    await expect(span?.classList.contains('badge--pill')).toBe(false);

    const part = span?.getAttribute('part');
    await expect(part).toBe('badge');
  },
};

/** Verifies that the pulse animation class is correctly applied when enabled. */
export const InteractionPulse: Story = {
  args: {
    variant: 'error',
    pulse: true,
    label: 'STAT',
  },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();
    await expect(badge?.getAttribute('pulse')).not.toBeNull();

    const span = badge?.shadowRoot?.querySelector('span');
    await expect(span).toBeTruthy();
    await expect(span?.classList.contains('badge--pulse')).toBe(true);
    await expect(span?.classList.contains('badge--error')).toBe(true);

    // Dot mode should NOT be active since content is present
    await expect(span?.classList.contains('badge--dot')).toBe(false);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 11. HEALTHCARE SCENARIOS
// ════════════════════════════════════════════════════════════════════════════

/** Emergency department triage priority levels following ESI (Emergency Severity Index). */
export const TriagePriority: Story = {
  render: () => html`
    <div style="font-family: var(--hx-font-family-sans, sans-serif);">
      <h3 style="margin: 0 0 1rem; color: var(--hx-color-neutral-800, #1f2937);">
        Emergency Triage Board
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0;">
        <div
          style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; background: var(--hx-color-neutral-50, #f9fafb); font-weight: 600; color: var(--hx-color-neutral-500, #6b7280); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span>Time</span>
          <span>Patient</span>
          <span>Priority</span>
        </div>
        <div
          style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >08:14</span
          >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Anderson, K. - Chest pain, diaphoresis</span
          >
          <hx-badge variant="error" pulse>Immediate</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >08:32</span
          >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Brooks, T. - Open fracture, right tibia</span
          >
          <hx-badge variant="warning">Urgent</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >09:05</span
          >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Davis, M. - Laceration, left forearm</span
          >
          <hx-badge variant="primary">Standard</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 100px 1fr auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem;"
        >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >09:41</span
          >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Evans, J. - Sore throat, 2 days</span
          >
          <hx-badge variant="success">Non-urgent</hx-badge>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(4);

    // Verify triage priority order
    const expectedVariants = ['error', 'warning', 'primary', 'success'];
    const expectedLabels = ['Immediate', 'Urgent', 'Standard', 'Non-urgent'];

    for (let i = 0; i < badges.length; i++) {
      await expect(badges[i].getAttribute('variant')).toBe(expectedVariants[i]);
      await expect(badges[i].textContent?.trim()).toBe(expectedLabels[i]);
    }

    // Immediate priority should pulse
    const immediateSpan = badges[0].shadowRoot?.querySelector('span');
    await expect(immediateSpan?.classList.contains('badge--pulse')).toBe(true);
  },
};

/** Lab result workflow statuses as seen in a clinical laboratory information system. */
export const LabResultStatus: Story = {
  render: () => html`
    <div style="font-family: var(--hx-font-family-sans, sans-serif);">
      <h3 style="margin: 0 0 1rem; color: var(--hx-color-neutral-800, #1f2937);">
        Lab Results - Patient: Chen, L. (MRN-0092451)
      </h3>
      <div style="display: flex; flex-direction: column; gap: 0;">
        <div
          style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; background: var(--hx-color-neutral-50, #f9fafb); font-weight: 600; color: var(--hx-color-neutral-500, #6b7280); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span>Test</span>
          <span>Result</span>
          <span>Status</span>
        </div>
        <div
          style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Complete Blood Count (CBC)</span
          >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;">--</span>
          <hx-badge variant="neutral">Pending</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);"
            >Basic Metabolic Panel (BMP)</span
          >
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >Processing</span
          >
          <hx-badge variant="primary" pulse>In Progress</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--hx-color-neutral-200, #e5e7eb);"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Hemoglobin A1c</span>
          <span style="color: var(--hx-color-neutral-500, #6b7280); font-size: 0.875rem;"
            >5.4%</span
          >
          <hx-badge variant="success">Complete</hx-badge>
        </div>
        <div
          style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 0.75rem 1rem;"
        >
          <span style="color: var(--hx-color-neutral-700, #374151);">Troponin I</span>
          <span
            style="font-weight: 600; color: var(--hx-color-error-500, #dc2626); font-size: 0.875rem;"
            >0.89 ng/mL</span
          >
          <hx-badge variant="error" pulse>Abnormal</hx-badge>
        </div>
      </div>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(4);

    // Verify status progression
    const expectedVariants = ['neutral', 'primary', 'success', 'error'];
    const expectedLabels = ['Pending', 'In Progress', 'Complete', 'Abnormal'];

    for (let i = 0; i < badges.length; i++) {
      await expect(badges[i].getAttribute('variant')).toBe(expectedVariants[i]);
      await expect(badges[i].textContent?.trim()).toBe(expectedLabels[i]);
    }

    // Abnormal result should pulse to draw clinical attention
    const abnormalSpan = badges[3].shadowRoot?.querySelector('span');
    await expect(abnormalSpan?.classList.contains('badge--pulse')).toBe(true);

    // In Progress should also pulse
    const inProgressSpan = badges[1].shadowRoot?.querySelector('span');
    await expect(inProgressSpan?.classList.contains('badge--pulse')).toBe(true);
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 12. REMOVABLE BADGE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Removable badge renders a dismiss button inside the component.
 * Clicking the button fires the `hx-remove` custom event, allowing the
 * host application to remove the badge from the DOM.
 */
export const Removable: StoryObj<typeof meta> = {
  args: { label: 'Dismiss me', variant: 'primary', removable: true },
  play: async ({ canvasElement }) => {
    const badge = canvasElement.querySelector('hx-badge');
    await expect(badge).toBeTruthy();
    const removeBtn = badge?.shadowRoot?.querySelector('[part="remove-button"]');
    await expect(removeBtn).toBeTruthy();
  },
};

/** Removable badges across multiple variants demonstrating dismiss affordance at scale. */
export const RemovableVariants: StoryObj<typeof meta> = {
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
      <hx-badge variant="primary" removable>Primary</hx-badge>
      <hx-badge variant="secondary" removable>Secondary</hx-badge>
      <hx-badge variant="success" removable>Success</hx-badge>
      <hx-badge variant="warning" removable>Warning</hx-badge>
      <hx-badge variant="danger" removable>Danger</hx-badge>
      <hx-badge variant="error" removable>Error</hx-badge>
      <hx-badge variant="neutral" removable>Neutral</hx-badge>
      <hx-badge variant="info" removable>Info</hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(8);

    for (const badge of badges) {
      const removeBtn = badge.shadowRoot?.querySelector('[part="remove-button"]');
      await expect(removeBtn).toBeTruthy();
    }
  },
};

// ════════════════════════════════════════════════════════════════════════════
// 13. PREFIX SLOT
// ════════════════════════════════════════════════════════════════════════════

/**
 * The `prefix` named slot accepts icon content rendered before the badge text.
 * Use any inline SVG or icon component; set `aria-hidden="true"` to keep
 * screen-reader announcements clean since the badge label provides context.
 */
export const WithPrefix: StoryObj<typeof meta> = {
  render: () => html`
    <hx-badge variant="success">
      <svg
        slot="prefix"
        viewBox="0 0 16 16"
        width="12"
        height="12"
        aria-hidden="true"
        fill="currentColor"
      >
        <circle cx="8" cy="8" r="8" />
      </svg>
      Active
    </hx-badge>
  `,
};

/** Prefix slot with icons across multiple variants for visual alignment review. */
export const WithPrefixAllVariants: StoryObj<typeof meta> = {
  render: () => html`
    <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
      <hx-badge variant="primary">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="8" />
        </svg>
        Primary
      </hx-badge>
      <hx-badge variant="secondary">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <circle cx="8" cy="8" r="8" />
        </svg>
        Secondary
      </hx-badge>
      <hx-badge variant="success">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <path
            d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"
          />
        </svg>
        Verified
      </hx-badge>
      <hx-badge variant="warning">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <path
            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7.25 4.5h1.5v5h-1.5v-5zm0 6.5h1.5v1.5h-1.5V11z"
          />
        </svg>
        Review
      </hx-badge>
      <hx-badge variant="danger">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <path
            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7.25 4.5h1.5v5h-1.5v-5zm0 6.5h1.5v1.5h-1.5V11z"
          />
        </svg>
        Danger
      </hx-badge>
      <hx-badge variant="info">
        <svg
          slot="prefix"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          fill="currentColor"
        >
          <path
            d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 3.5h-1.5v1.5h1.5V4.5zm0 3h-1.5v5h1.5v-5z"
          />
        </svg>
        Info
      </hx-badge>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const badges = canvasElement.querySelectorAll('hx-badge');
    await expect(badges.length).toBe(6);
  },
};
