import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-side-nav.js';
import './hx-nav-item.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/SideNav',
  component: 'hx-side-nav',
  tags: ['autodocs'],
  argTypes: {
    collapsed: {
      control: 'boolean',
      description: 'When true, the nav collapses to icon-only mode.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the nav landmark.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Main Navigation' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    collapsed: false,
    label: 'Main Navigation',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <div style="height: 500px; display: flex;">
      <hx-side-nav
        ?collapsed=${args.collapsed}
        label=${args.label}
        style="height: 100%;"
      >
        <div slot="header" style="font-weight: bold; font-size: 1.125rem; color: white;">
          HelixUI
        </div>
        <hx-nav-item href="/dashboard">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-3a1 1 0 100 2 1 1 0 000-2zm-1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
          </svg>
          Dashboard
        </hx-nav-item>
        <hx-nav-item href="/patients" active>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Patients
        </hx-nav-item>
        <hx-nav-item href="/reports">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd" />
          </svg>
          Reports
        </hx-nav-item>
        <hx-nav-item href="/settings">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          Settings
        </hx-nav-item>
        <div slot="footer" style="display: flex; align-items: center; gap: 0.5rem; color: #d1d5db; font-size: 0.875rem; overflow: hidden;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #374151; flex-shrink: 0;"></div>
          <span style="white-space: nowrap;">Dr. Jane Smith</span>
        </div>
      </hx-side-nav>
      <div style="flex: 1; padding: 2rem; background: #f9fafb;">
        <h1 style="margin: 0; font-size: 1.5rem;">Page Content</h1>
      </div>
    </div>
  `,
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
  render: (args) => html`
    <div style="height: 500px; display: flex;">
      <hx-side-nav
        ?collapsed=${args.collapsed}
        label=${args.label}
        style="height: 100%;"
      >
        <div slot="header" style="font-weight: bold; font-size: 1.125rem; color: white;">H</div>
        <hx-nav-item href="/dashboard">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-3a1 1 0 100 2 1 1 0 000-2zm-1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
          </svg>
          Dashboard
        </hx-nav-item>
        <hx-nav-item href="/patients" active>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Patients
        </hx-nav-item>
      </hx-side-nav>
      <div style="flex: 1; padding: 2rem; background: #f9fafb;">
        <h1 style="margin: 0; font-size: 1.5rem;">Page Content</h1>
      </div>
    </div>
  `,
};

export const WithNestedNavigation: Story = {
  render: (args) => html`
    <div style="height: 600px; display: flex;">
      <hx-side-nav
        ?collapsed=${args.collapsed}
        label=${args.label}
        style="height: 100%;"
      >
        <div slot="header" style="font-weight: bold; font-size: 1.125rem; color: white;">
          HelixUI
        </div>
        <hx-nav-item href="/dashboard">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
          </svg>
          Dashboard
        </hx-nav-item>
        <hx-nav-item expanded>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Patients
          <hx-nav-item slot="children" href="/patients/list" active>All Patients</hx-nav-item>
          <hx-nav-item slot="children" href="/patients/new">New Patient</hx-nav-item>
          <hx-nav-item slot="children" href="/patients/schedule">Schedule</hx-nav-item>
        </hx-nav-item>
        <hx-nav-item href="/reports">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clip-rule="evenodd" />
          </svg>
          Reports
        </hx-nav-item>
        <hx-nav-item href="/admin" disabled>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
          </svg>
          Admin (disabled)
        </hx-nav-item>
      </hx-side-nav>
      <div style="flex: 1; padding: 2rem; background: #f9fafb;">
        <h1 style="margin: 0; font-size: 1.5rem;">Page Content</h1>
      </div>
    </div>
  `,
};

export const WithBadge: Story = {
  render: (args) => html`
    <div style="height: 500px; display: flex;">
      <hx-side-nav
        ?collapsed=${args.collapsed}
        label=${args.label}
        style="height: 100%;"
      >
        <div slot="header" style="font-weight: bold; font-size: 1.125rem; color: white;">
          HelixUI
        </div>
        <hx-nav-item href="/dashboard" active>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0z" />
          </svg>
          Dashboard
        </hx-nav-item>
        <hx-nav-item href="/notifications">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
          </svg>
          Notifications
          <span slot="badge" style="background: #ef4444; color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; font-weight: 700; min-width: 1.25rem; text-align: center; display: inline-block;">
            5
          </span>
        </hx-nav-item>
      </hx-side-nav>
      <div style="flex: 1; padding: 2rem; background: #f9fafb;">
        <h1 style="margin: 0; font-size: 1.5rem;">Page Content</h1>
      </div>
    </div>
  `,
};

export const WithSectionedNavigation: Story = {
  render: (args) => html`
    <div style="height: 600px; display: flex;">
      <hx-side-nav
        ?collapsed=${args.collapsed}
        label=${args.label}
        style="height: 100%;"
      >
        <div slot="header" style="font-weight: bold; font-size: 1.125rem; color: white;">
          HelixUI
        </div>

        <!-- Clinical section label -->
        <div style="padding: 0.5rem 1rem 0.25rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
          Clinical
        </div>
        <hx-nav-item href="/patients" active>
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Patients
        </hx-nav-item>
        <hx-nav-item href="/appointments">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
          </svg>
          Appointments
        </hx-nav-item>
        <hx-nav-item href="/records">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
          </svg>
          Records
        </hx-nav-item>

        <!-- Divider -->
        <div style="margin: 0.5rem 1rem; border-top: 1px solid #374151;"></div>

        <!-- Administration section label -->
        <div style="padding: 0.25rem 1rem 0.25rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
          Administration
        </div>
        <hx-nav-item href="/settings">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          Settings
        </hx-nav-item>
        <hx-nav-item href="/reports">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd" />
          </svg>
          Reports
        </hx-nav-item>
        <hx-nav-item href="/users">
          <svg slot="icon" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <circle cx="10" cy="10" r="7" />
          </svg>
          Users
        </hx-nav-item>

        <div slot="footer" style="display: flex; align-items: center; gap: 0.5rem; color: #d1d5db; font-size: 0.875rem; overflow: hidden;">
          <div style="width: 2rem; height: 2rem; border-radius: 50%; background: #374151; flex-shrink: 0;"></div>
          <span style="white-space: nowrap;">Dr. Jane Smith</span>
        </div>
      </hx-side-nav>
      <div style="flex: 1; padding: 2rem; background: #f9fafb;">
        <h1 style="margin: 0; font-size: 1.5rem;">Page Content</h1>
      </div>
    </div>
  `,
};
