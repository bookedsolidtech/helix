import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-structured-list.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/StructuredList',
  component: 'hx-structured-list',
  tags: ['autodocs'],
  argTypes: {
    bordered: {
      control: { type: 'boolean' },
      description: 'Renders a border around the entire list.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    condensed: {
      control: { type: 'boolean' },
      description: 'Reduces row padding for denser layouts.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    striped: {
      control: { type: 'boolean' },
      description: 'Alternates row background colors.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    bordered: false,
    condensed: false,
    striped: false,
  },
  render: (args) => html`
    <hx-structured-list
      ?bordered=${args.bordered}
      ?condensed=${args.condensed}
      ?striped=${args.striped}
    >
      <hx-structured-list-row>
        <span slot="label">Full name</span>
        Jane Doe
      </hx-structured-list-row>
      <hx-structured-list-row>
        <span slot="label">Date of birth</span>
        March 15, 1982
      </hx-structured-list-row>
      <hx-structured-list-row>
        <span slot="label">MRN</span>
        885521
      </hx-structured-list-row>
    </hx-structured-list>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-structured-list');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. BORDERED
// ─────────────────────────────────────────────────

export const Bordered: Story = {
  args: {
    bordered: true,
  },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-structured-list');
    await expect(el?.hasAttribute('bordered')).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 3. CONDENSED
// ─────────────────────────────────────────────────

export const Condensed: Story = {
  args: {
    condensed: true,
  },
};

// ─────────────────────────────────────────────────
// 4. STRIPED
// ─────────────────────────────────────────────────

export const Striped: Story = {
  args: {
    striped: true,
  },
};

// ─────────────────────────────────────────────────
// 5. BORDERED + CONDENSED
// ─────────────────────────────────────────────────

export const BorderedCondensed: Story = {
  args: {
    bordered: true,
    condensed: true,
  },
};

// ─────────────────────────────────────────────────
// 6. WITH ACTIONS — User Profile
// ─────────────────────────────────────────────────

export const UserProfile: Story = {
  render: () => html`
    <hx-structured-list bordered>
      <hx-structured-list-row>
        <span slot="label">Full name</span>
        Jane Doe
        <button slot="actions" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; cursor: pointer;">
          Edit
        </button>
      </hx-structured-list-row>
      <hx-structured-list-row>
        <span slot="label">Email</span>
        jane.doe@example.com
        <button slot="actions" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; cursor: pointer;">
          Edit
        </button>
      </hx-structured-list-row>
      <hx-structured-list-row>
        <span slot="label">Role</span>
        Registered Nurse — Floor 3
      </hx-structured-list-row>
      <hx-structured-list-row>
        <span slot="label">Department</span>
        Internal Medicine
      </hx-structured-list-row>
    </hx-structured-list>
  `,
};

// ─────────────────────────────────────────────────
// 7. SETTINGS PANEL
// ─────────────────────────────────────────────────

export const SettingsPanel: Story = {
  render: () => html`
    <div style="max-width: 560px; font-family: sans-serif;">
      <h3 style="margin: 0 0 1rem; font-size: 1rem;">Account Settings</h3>
      <hx-structured-list bordered striped>
        <hx-structured-list-row>
          <span slot="label">Username</span>
          jdoe_rn
          <button
            slot="actions"
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem; cursor: pointer;"
          >
            Change
          </button>
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Password</span>
          ••••••••
          <button
            slot="actions"
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem; cursor: pointer;"
          >
            Reset
          </button>
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Two-factor auth</span>
          Enabled (Authenticator App)
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Session timeout</span>
          15 minutes
          <button
            slot="actions"
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem; cursor: pointer;"
          >
            Edit
          </button>
        </hx-structured-list-row>
      </hx-structured-list>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. PATIENT DETAIL VIEW
// ─────────────────────────────────────────────────

export const PatientDetail: Story = {
  render: () => html`
    <div style="max-width: 560px; font-family: sans-serif;">
      <h3 style="margin: 0 0 1rem; font-size: 1rem;">Patient Demographics</h3>
      <hx-structured-list bordered condensed>
        <hx-structured-list-row>
          <span slot="label">Patient name</span>
          Jane Doe
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Date of birth</span>
          March 15, 1982 (Age 44)
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">MRN</span>
          885521
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Primary physician</span>
          Dr. Anil Patel
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Insurance</span>
          BlueCross PPO — ID: BCX-448821
        </hx-structured-list-row>
        <hx-structured-list-row>
          <span slot="label">Admission date</span>
          February 20, 2026
        </hx-structured-list-row>
      </hx-structured-list>
    </div>
  `,
};
