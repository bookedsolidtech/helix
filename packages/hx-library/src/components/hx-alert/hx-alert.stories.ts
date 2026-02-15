import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-alert.js';

const meta = {
  title: 'Components/Alert',
  component: 'hx-alert',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
      description: 'Visual variant that determines colors and ARIA semantics.',
      table: {
        defaultValue: { summary: 'info' },
      },
    },
    closable: {
      control: 'boolean',
      description: 'Whether the alert can be dismissed by the user.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the alert is visible.',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    message: {
      control: 'text',
      description: 'Alert message text (passed via default slot).',
    },
  },
  args: {
    variant: 'info',
    closable: false,
    open: true,
    message: 'This is an informational alert message.',
  },
  render: (args) => html`
    <hx-alert
      variant=${args.variant}
      ?closable=${args.closable}
      ?open=${args.open}
    >
      ${args.message}
    </hx-alert>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─── Info ───

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Your session will expire in 15 minutes. Please save your work.',
  },
  play: async ({ canvasElement }) => {
    const alert = canvasElement.querySelector('hx-alert');
    expect(alert).toBeTruthy();
    expect(alert?.shadowRoot?.querySelector('.alert')).toBeTruthy();
  },
};

// ─── Success ───

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Patient record saved successfully.',
  },
};

// ─── Warning ───

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'This patient has a known drug allergy. Please review before prescribing.',
  },
};

// ─── Error ───

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Failed to submit the order. Please check your connection and try again.',
  },
};

// ─── Closable ───

export const Closable: Story = {
  args: {
    variant: 'info',
    closable: true,
    message: 'This alert can be dismissed by clicking the close button.',
  },
};

// ─── With Actions ───

export const WithActions: Story = {
  render: () => html`
    <hx-alert variant="warning" closable>
      This patient has a pending lab result that may affect treatment.
      <hx-button slot="actions" variant="ghost" wc-size="sm">View Results</hx-button>
      <hx-button slot="actions" variant="ghost" wc-size="sm">Dismiss</hx-button>
    </hx-alert>
  `,
};

// ─── With Custom Icon ───

export const WithCustomIcon: Story = {
  render: () => html`
    <hx-alert variant="info">
      <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a2 2 0 01-2-2h4a2 2 0 01-2 2z"/>
      </svg>
      You have 3 new notifications pending review.
    </hx-alert>
  `,
};

// ─── All Variants ───

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
      <hx-alert variant="info">
        Information: Your session will expire in 15 minutes.
      </hx-alert>
      <hx-alert variant="success">
        Success: Patient record has been updated.
      </hx-alert>
      <hx-alert variant="warning">
        Warning: This patient has a known drug allergy.
      </hx-alert>
      <hx-alert variant="error">
        Error: Unable to retrieve patient records. Please try again.
      </hx-alert>
    </div>
  `,
};

// ─── Non-Closable ───

export const NonClosable: Story = {
  args: {
    variant: 'error',
    closable: false,
    message: 'Critical system alert: This message cannot be dismissed.',
  },
};
