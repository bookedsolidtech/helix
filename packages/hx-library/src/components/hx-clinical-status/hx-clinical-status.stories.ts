import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-clinical-status.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Clinical Status',
  component: 'hx-clinical-status',
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: { type: 'select' },
      options: ['info', 'warning', 'critical', 'emergent'],
      description: 'Clinical severity level that determines visual styling and ARIA semantics.',
      table: {
        category: 'Clinical',
        defaultValue: { summary: 'info' },
        type: { summary: "'info' | 'warning' | 'critical' | 'emergent'" },
      },
    },
    message: {
      control: 'text',
      description: 'Status message text.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the status can be dismissed by the user.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    persistent: {
      control: 'boolean',
      description:
        'Whether the status survives page navigation. Defaults to true for critical/emergent.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode for dense clinical UIs.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    icon: {
      control: 'text',
      description: 'Optional custom icon name.',
      table: {
        category: 'Visual',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    severity: 'info',
    message: 'Patient vitals within normal range.',
    dismissible: false,
    persistent: false,
    compact: false,
    icon: '',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// RENDER HELPER
// ─────────────────────────────────────────────────

function renderClinicalStatus(args: Record<string, unknown>) {
  return html`
    <hx-clinical-status
      severity=${args.severity as string}
      message=${args.message as string}
      ?dismissible=${args.dismissible as boolean}
      ?persistent=${args.persistent as boolean}
      ?compact=${args.compact as boolean}
    ></hx-clinical-status>
  `;
}

// ─────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────

/** Default info severity status indicator. */
export const Default: Story = {
  render: renderClinicalStatus,
};

/** Informational clinical status. Non-urgent, routine communication. */
export const Info: Story = {
  args: {
    severity: 'info',
    message: 'Lab results received and within expected range.',
  },
  render: renderClinicalStatus,
};

/** Warning severity. Requires clinical attention but not immediate action. */
export const Warning: Story = {
  args: {
    severity: 'warning',
    message: 'Blood pressure reading slightly elevated. Continue monitoring.',
  },
  render: renderClinicalStatus,
};

/** Critical severity. Requires prompt clinical attention. */
export const Critical: Story = {
  args: {
    severity: 'critical',
    message: 'Abnormal lab values detected. Review required.',
  },
  render: renderClinicalStatus,
};

/** Emergent severity. Life-threatening, immediate action required. */
export const Emergent: Story = {
  args: {
    severity: 'emergent',
    message: 'STAT: Critical vital signs — immediate intervention required.',
  },
  render: renderClinicalStatus,
};

/** Dismissible status that can be closed by the user. */
export const Dismissible: Story = {
  args: {
    severity: 'info',
    message: 'Routine medication reminder scheduled.',
    dismissible: true,
  },
  render: renderClinicalStatus,
};

/** Compact mode for dense clinical dashboards and bedside displays. */
export const Compact: Story = {
  args: {
    severity: 'warning',
    message: 'SpO2 trending downward. Monitor closely.',
    compact: true,
  },
  render: renderClinicalStatus,
};

/** All four severity levels displayed together for visual comparison. */
export const AllSeverities: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-clinical-status
        severity="info"
        message="Lab results received and within expected range."
      ></hx-clinical-status>
      <hx-clinical-status
        severity="warning"
        message="Blood pressure reading slightly elevated. Continue monitoring."
      ></hx-clinical-status>
      <hx-clinical-status
        severity="critical"
        message="Abnormal lab values detected. Review required."
      ></hx-clinical-status>
      <hx-clinical-status
        severity="emergent"
        message="STAT: Critical vital signs — immediate intervention required."
      ></hx-clinical-status>
    </div>
  `,
};

/** All severities in compact mode for dense clinical UIs. */
export const AllSeveritiesCompact: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <hx-clinical-status
        severity="info"
        message="Labs normal"
        compact
      ></hx-clinical-status>
      <hx-clinical-status
        severity="warning"
        message="BP elevated"
        compact
      ></hx-clinical-status>
      <hx-clinical-status
        severity="critical"
        message="Abnormal labs"
        compact
      ></hx-clinical-status>
      <hx-clinical-status
        severity="emergent"
        message="STAT intervention"
        compact
      ></hx-clinical-status>
    </div>
  `,
};

/** Critical status requiring explicit acknowledgment before dismissal. */
export const RequiresAcknowledgment: Story = {
  args: {
    severity: 'critical',
    message: 'Fall risk assessment overdue. Acknowledge to confirm review.',
  },
  render: renderClinicalStatus,
};
