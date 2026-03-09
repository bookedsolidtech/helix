import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-nav-item.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/NavItem',
  component: 'hx-nav-item',
  tags: ['autodocs'],
  argTypes: {
    href: {
      control: 'text',
      description: 'The URL this nav item links to. When set without children, renders as an anchor.',
      table: {
        category: 'Properties',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    active: {
      control: 'boolean',
      description: 'Whether this item is the current/active page. Sets aria-current="page" on the anchor.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether this nav item is disabled. Prevents interaction and sets aria-disabled="true".',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    expanded: {
      control: 'boolean',
      description: 'Whether the sub-navigation children are expanded. Only applies when the children slot is populated.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    href: '/example',
    active: false,
    disabled: false,
    expanded: false,
  },
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item
        href=${args.href}
        ?active=${args.active}
        ?disabled=${args.disabled}
        ?expanded=${args.expanded}
      >
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <circle cx="10" cy="10" r="7" />
        </svg>
        Nav Item
      </hx-nav-item>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item href=${args.href} ?active=${args.active}>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        Patients
      </hx-nav-item>
    </div>
  `,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item href=${args.href} ?disabled=${args.disabled}>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
        </svg>
        Admin (disabled)
      </hx-nav-item>
    </div>
  `,
};

export const WithIcon: Story = {
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item href=${args.href}>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        Settings
      </hx-nav-item>
    </div>
  `,
};

export const WithBadge: Story = {
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item href=${args.href}>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
        </svg>
        Notifications
        <span
          slot="badge"
          style="background: #ef4444; color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; font-weight: 700; min-width: 1.25rem; text-align: center; display: inline-block;"
        >
          5
        </span>
      </hx-nav-item>
    </div>
  `,
};

export const WithChildren: Story = {
  args: {
    expanded: true,
  },
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 220px;">
      <hx-nav-item ?expanded=${args.expanded}>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
        Patients
        <hx-nav-item slot="children" href="/patients/list" active>All Patients</hx-nav-item>
        <hx-nav-item slot="children" href="/patients/new">New Patient</hx-nav-item>
        <hx-nav-item slot="children" href="/patients/schedule">Schedule</hx-nav-item>
      </hx-nav-item>
    </div>
  `,
};

export const CollapsedMode: Story = {
  render: (args) => html`
    <div style="background: #111827; padding: 0.5rem; width: 56px;">
      <hx-nav-item href=${args.href} data-collapsed>
        <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-3a1 1 0 100 2 1 1 0 000-2zm-1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
        </svg>
        Dashboard
      </hx-nav-item>
    </div>
  `,
};
