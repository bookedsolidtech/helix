import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-message-bar.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/MessageBar',
  component: 'hx-message-bar',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
      description: 'Visual variant that determines colors and ARIA semantics.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'info' },
        type: { summary: "'info' | 'success' | 'warning' | 'error'" },
      },
    },
    closable: {
      control: 'boolean',
      description: 'Whether the message bar can be dismissed by the user.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the message bar is visible.',
      table: {
        category: 'State',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    sticky: {
      control: 'boolean',
      description: 'Whether the message bar sticks to the top of the scroll container.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    variant: 'info',
    closable: false,
    open: true,
    sticky: false,
  },
  render: (args) => html`
    <hx-message-bar
      variant=${args.variant}
      ?closable=${args.closable}
      ?open=${args.open}
      ?sticky=${args.sticky}
    >
      Your session will expire in 10 minutes. Please save your work.
    </hx-message-bar>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────

export const Default: Story = {};

export const Info: Story = {
  args: { variant: 'info' },
  render: () => html`
    <hx-message-bar variant="info">
      System maintenance is scheduled for tonight at 11 PM EST.
    </hx-message-bar>
  `,
};

export const Success: Story = {
  args: { variant: 'success' },
  render: () => html`
    <hx-message-bar variant="success">
      Patient record has been successfully updated.
    </hx-message-bar>
  `,
};

export const Warning: Story = {
  args: { variant: 'warning' },
  render: () => html`
    <hx-message-bar variant="warning">
      Your session will expire in 10 minutes. Please save your work.
    </hx-message-bar>
  `,
};

export const Error: Story = {
  args: { variant: 'error' },
  render: () => html`
    <hx-message-bar variant="error">
      Failed to sync patient data. Contact support if the problem persists.
    </hx-message-bar>
  `,
};

export const Closable: Story = {
  args: { closable: true },
  render: () => html`
    <hx-message-bar closable>
      This notification can be dismissed.
    </hx-message-bar>
  `,
};

export const WithAction: Story = {
  render: () => html`
    <hx-message-bar variant="warning" closable>
      Scheduled maintenance tonight at 11 PM. Some features may be unavailable.
      <a slot="action" href="#">Learn more</a>
    </hx-message-bar>
  `,
};

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <hx-message-bar variant="info">
        Info: System update scheduled for this weekend.
      </hx-message-bar>
      <hx-message-bar variant="success">
        Success: All records have been saved.
      </hx-message-bar>
      <hx-message-bar variant="warning" closable>
        Warning: Your session expires in 5 minutes.
      </hx-message-bar>
      <hx-message-bar variant="error" closable>
        Error: Unable to connect to the server. Please try again.
      </hx-message-bar>
    </div>
  `,
};

export const CustomIcon: Story = {
  render: () => html`
    <hx-message-bar variant="info">
      <svg slot="icon" viewBox="0 0 20 20" aria-hidden="true" style="width: 1.25rem; height: 1.25rem; fill: currentColor;">
        <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14a6 6 0 110-12 6 6 0 010 12z"/>
      </svg>
      Custom icon in the icon slot.
    </hx-message-bar>
  `,
};
