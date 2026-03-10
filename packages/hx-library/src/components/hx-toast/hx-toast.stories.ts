import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';
import './hx-toast.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Toast',
  component: 'hx-toast',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger', 'info'],
      description: 'Visual style variant of the toast.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'success' | 'warning' | 'danger' | 'info'" },
      },
    },
    duration: {
      control: { type: 'number' },
      description: 'Auto-dismiss duration in ms. 0 = persistent.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '3000' },
        type: { summary: 'number' },
      },
    },
    closable: {
      control: 'boolean',
      description: 'Whether to show a close button.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the toast is currently visible.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    message: {
      control: 'text',
      description: 'Notification message (default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'default',
    duration: 0,
    closable: true,
    open: true,
    message: 'Patient record has been saved successfully.',
  },
  render: (args) => html`
    <hx-toast
      variant=${args.variant}
      duration=${args.duration}
      ?closable=${args.closable}
      ?open=${args.open}
    >
      ${args.message}
    </hx-toast>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    variant: 'default',
    message: 'Patient record has been saved.',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const toast = canvasElement.querySelector('hx-toast');
    await expect(toast).toBeTruthy();
    await expect(toast!.open).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Lab results uploaded successfully.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'Medication interaction detected. Please review before proceeding.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    message: 'Critical alert: Patient vitals outside normal range.',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Appointment reminder: Dr. Smith at 2:00 PM.',
  },
};

// ─────────────────────────────────────────────────
// 3. CLOSABLE BEHAVIOR
// ─────────────────────────────────────────────────

export const Closable: Story = {
  args: {
    closable: true,
    message: 'Click X to dismiss this notification.',
  },
  play: async ({ canvasElement }) => {
    const toast = canvasElement.querySelector('hx-toast');
    await expect(toast).toBeTruthy();
    await expect(toast!.open).toBe(true);

    const closeBtn = toast!.shadowRoot!.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeTruthy();
  },
};

export const Persistent: Story = {
  args: {
    closable: true,
    duration: 0,
    message: 'This toast will not auto-dismiss. Use the close button.',
  },
};

// ─────────────────────────────────────────────────
// 4. SLOTS
// ─────────────────────────────────────────────────

export const WithIcon: Story = {
  render: () => html`
    <hx-toast variant="success" ?open=${true} ?closable=${true}>
      <svg
        slot="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      Prescription submitted to pharmacy.
    </hx-toast>
  `,
};

export const WithAction: Story = {
  render: () => html`
    <hx-toast variant="info" ?open=${true} ?closable=${true}>
      Lab results are ready for review.
      <button
        slot="action"
        style="background: transparent; border: 1px solid currentColor; border-radius: 0.25rem; color: inherit; cursor: pointer; font-size: 0.75rem; padding: 0.125rem 0.5rem;"
      >
        View
      </button>
    </hx-toast>
  `,
};

export const WithIconAndAction: Story = {
  render: () => html`
    <hx-toast variant="warning" ?open=${true} ?closable=${true}>
      <svg
        slot="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
      </svg>
      Drug interaction warning detected.
      <button
        slot="action"
        style="background: transparent; border: 1px solid currentColor; border-radius: 0.25rem; color: inherit; cursor: pointer; font-size: 0.75rem; padding: 0.125rem 0.5rem;"
      >
        Review
      </button>
    </hx-toast>
  `,
};

// ─────────────────────────────────────────────────
// 5. ALL VARIANTS
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 24rem;">
      <hx-toast variant="default" ?open=${true} ?closable=${true}>
        Default notification message.
      </hx-toast>
      <hx-toast variant="success" ?open=${true} ?closable=${true}>
        Record saved successfully.
      </hx-toast>
      <hx-toast variant="warning" ?open=${true} ?closable=${true}>
        Medication interaction detected.
      </hx-toast>
      <hx-toast variant="danger" ?open=${true} ?closable=${true}>
        Critical alert: action required.
      </hx-toast>
      <hx-toast variant="info" ?open=${true} ?closable=${true}>
        Appointment reminder at 2:00 PM.
      </hx-toast>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. TOAST STACK
// ─────────────────────────────────────────────────

export const StackDemo: Story = {
  render: () => html`
    <div
      style="position: relative; height: 300px; border: 1px dashed #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <p style="padding: 1rem; color: #6b7280; font-size: 0.875rem; margin: 0;">
        Toast stack demo (bottom-end placement)
      </p>
      <hx-toast-stack placement="bottom-end" stack-limit="3" style="position: absolute;">
        <hx-toast variant="success" ?open=${true} ?closable=${true}> Record saved. </hx-toast>
        <hx-toast variant="info" ?open=${true} ?closable=${true}> New message received. </hx-toast>
        <hx-toast variant="warning" ?open=${true} ?closable=${true}>
          Session expiring soon.
        </hx-toast>
      </hx-toast-stack>
    </div>
  `,
};

export const StackTopCenter: Story = {
  render: () => html`
    <div
      style="position: relative; height: 200px; border: 1px dashed #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <p style="padding: 1rem; color: #6b7280; font-size: 0.875rem; margin: 0;">
        Top-center placement
      </p>
      <hx-toast-stack placement="top-center" style="position: absolute; left: 0; right: 0; top: 0;">
        <hx-toast variant="info" ?open=${true} ?closable=${true}
          >Appointment confirmed for 3:00 PM.</hx-toast
        >
      </hx-toast-stack>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const CriticalAlert: Story = {
  render: () => html`
    <hx-toast variant="danger" ?open=${true} ?closable=${true}>
      <svg
        slot="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      CRITICAL: Patient O2 saturation below 90%. Immediate intervention required.
      <button
        slot="action"
        style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); border-radius: 0.25rem; color: white; cursor: pointer; font-size: 0.75rem; padding: 0.125rem 0.5rem; white-space: nowrap;"
      >
        Acknowledge
      </button>
    </hx-toast>
  `,
};

export const SaveConfirmation: Story = {
  render: () => html`
    <hx-toast variant="success" duration="5000" ?open=${true} ?closable=${true}>
      <svg
        slot="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Patient chart saved. Auto-dismisses in 5 seconds.
    </hx-toast>
  `,
};
