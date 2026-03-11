import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, fn, within } from 'storybook/test';
import './hx-list.js';
import './hx-list-item.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/List',
  component: 'hx-list',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['plain', 'bulleted', 'numbered', 'description', 'interactive'],
      description: 'Visual style variant of the list.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'plain' },
        type: { summary: "'plain' | 'bulleted' | 'numbered' | 'description' | 'interactive'" },
      },
    },
    divided: {
      control: 'boolean',
      description: 'Whether to show dividers between list items.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    variant: 'plain',
    divided: false,
  },
  render: (args) => html`
    <hx-list variant=${args.variant} ?divided=${args.divided}>
      <hx-list-item>Schedule Appointment</hx-list-item>
      <hx-list-item>View Lab Results</hx-list-item>
      <hx-list-item>Request Prescription Refill</hx-list-item>
    </hx-list>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    variant: 'plain',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const list = canvasElement.querySelector('hx-list');
    await expect(list).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Plain: Story = {
  args: { variant: 'plain' },
};

export const Bulleted: Story = {
  args: { variant: 'bulleted' },
  render: () => html`
    <hx-list variant="bulleted">
      <hx-list-item>Complete intake form</hx-list-item>
      <hx-list-item>Verify insurance coverage</hx-list-item>
      <hx-list-item>Schedule follow-up appointment</hx-list-item>
      <hx-list-item>Upload supporting documents</hx-list-item>
    </hx-list>
  `,
};

export const Numbered: Story = {
  args: { variant: 'numbered' },
  render: () => html`
    <hx-list variant="numbered">
      <hx-list-item>Check in at reception</hx-list-item>
      <hx-list-item>Confirm personal details</hx-list-item>
      <hx-list-item>Wait for nurse to call your name</hx-list-item>
      <hx-list-item>Proceed to examination room</hx-list-item>
    </hx-list>
  `,
};

export const Interactive: Story = {
  args: { variant: 'interactive' },
  render: () => html`
    <hx-list variant="interactive" label="Patient actions" @hx-select=${fn()}>
      <hx-list-item value="schedule">Schedule Appointment</hx-list-item>
      <hx-list-item value="labs">View Lab Results</hx-list-item>
      <hx-list-item value="refill">Request Prescription Refill</hx-list-item>
      <hx-list-item value="message">Message Your Doctor</hx-list-item>
    </hx-list>
  `,
};

// ─────────────────────────────────────────────────
// 3. DIVIDED
// ─────────────────────────────────────────────────

export const Divided: Story = {
  args: { variant: 'plain', divided: true },
  render: () => html`
    <hx-list variant="plain" divided>
      <hx-list-item>John Smith — Primary Care</hx-list-item>
      <hx-list-item>Dr. Emily Chen — Cardiologist</hx-list-item>
      <hx-list-item>Dr. Marcus Williams — Orthopedics</hx-list-item>
    </hx-list>
  `,
};

export const InteractiveDivided: Story = {
  name: 'Interactive + Divided',
  render: () => html`
    <hx-list variant="interactive" label="Account menu" divided style="max-width: 320px;">
      <hx-list-item value="profile">My Profile</hx-list-item>
      <hx-list-item value="settings">Settings</hx-list-item>
      <hx-list-item value="notifications">Notifications</hx-list-item>
      <hx-list-item value="logout">Sign Out</hx-list-item>
    </hx-list>
  `,
};

// ─────────────────────────────────────────────────
// 4. SLOTS — prefix, suffix, description
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  name: 'With Prefix Icons',
  render: () => html`
    <hx-list variant="interactive" label="Health records" divided style="max-width: 360px;">
      <hx-list-item value="appointments">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Upcoming Appointments
      </hx-list-item>
      <hx-list-item value="records">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Medical Records
      </hx-list-item>
    </hx-list>
  `,
};

export const WithDescriptionSlot: Story = {
  name: 'With Description',
  render: () => html`
    <hx-list variant="interactive" label="Care providers" divided style="max-width: 400px;">
      <hx-list-item value="john">
        John Smith
        <span slot="description">Primary Care · Last visit: Jan 15, 2026</span>
      </hx-list-item>
      <hx-list-item value="emily">
        Dr. Emily Chen
        <span slot="description">Cardiology · Next appointment: Mar 22, 2026</span>
      </hx-list-item>
      <hx-list-item value="marcus">
        Dr. Marcus Williams
        <span slot="description">Orthopedics · Awaiting referral</span>
      </hx-list-item>
    </hx-list>
  `,
};

export const WithSuffixSlot: Story = {
  name: 'With Suffix Badges',
  render: () => html`
    <hx-list variant="interactive" label="Notifications" divided style="max-width: 360px;">
      <hx-list-item value="messages">
        Messages
        <span
          slot="suffix"
          style="background: #dc2626; color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; font-weight: 600;"
        >
          3
        </span>
      </hx-list-item>
      <hx-list-item value="alerts">
        Alerts
        <span
          slot="suffix"
          style="background: #f59e0b; color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; font-weight: 600;"
        >
          1
        </span>
      </hx-list-item>
      <hx-list-item value="labs">Lab Results</hx-list-item>
    </hx-list>
  `,
};

export const RichItems: Story = {
  name: 'Rich Items (prefix + description + suffix)',
  render: () => html`
    <hx-list variant="interactive" label="Patient records" divided style="max-width: 460px;">
      <hx-list-item value="smith">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="color: var(--hx-color-neutral-400, #94a3b8);"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        John Smith
        <span slot="description">DOB: 03/14/1965 · MRN: 100293847</span>
        <svg
          slot="suffix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="color: var(--hx-color-neutral-400, #94a3b8);"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </hx-list-item>
      <hx-list-item value="doe">
        <svg
          slot="prefix"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="color: var(--hx-color-neutral-400, #94a3b8);"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Jane Doe
        <span slot="description">DOB: 07/22/1980 · MRN: 200847361</span>
        <svg
          slot="suffix"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="color: var(--hx-color-neutral-400, #94a3b8);"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </hx-list-item>
    </hx-list>
  `,
};

// ─────────────────────────────────────────────────
// 5. STATE STORIES — disabled, selected, href
// ─────────────────────────────────────────────────

export const DisabledItem: Story = {
  name: 'Disabled Item',
  render: () => html`
    <hx-list variant="interactive" label="Actions" divided style="max-width: 320px;">
      <hx-list-item value="available">Available Action</hx-list-item>
      <hx-list-item value="disabled" disabled>Restricted Action</hx-list-item>
      <hx-list-item value="another">Another Action</hx-list-item>
    </hx-list>
  `,
};

export const SelectedItem: Story = {
  name: 'Selected Item',
  render: () => html`
    <hx-list variant="interactive" label="Navigation" style="max-width: 320px;">
      <hx-list-item value="appointments" selected>Appointments</hx-list-item>
      <hx-list-item value="records">Medical Records</hx-list-item>
      <hx-list-item value="billing">Billing</hx-list-item>
    </hx-list>
  `,
};

export const LinkItems: Story = {
  name: 'Link Items (href)',
  render: () => html`
    <hx-list variant="plain" divided style="max-width: 320px;">
      <hx-list-item href="https://example.com/appointments">Schedule Appointment</hx-list-item>
      <hx-list-item href="https://example.com/records">View Medical Records</hx-list-item>
      <hx-list-item href="https://example.com/billing">Billing & Insurance</hx-list-item>
    </hx-list>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientNavigationMenu: Story = {
  name: 'Patient Navigation Menu',
  render: () => html`
    <nav aria-label="Patient portal navigation" style="max-width: 280px;">
      <hx-list variant="interactive" label="Patient portal" divided>
        <hx-list-item value="overview" selected>
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Overview
        </hx-list-item>
        <hx-list-item value="appointments">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Appointments
          <span
            slot="suffix"
            style="background: #2563eb; color: white; border-radius: 9999px; padding: 0 0.375rem; font-size: 0.75rem; font-weight: 600;"
            >2</span
          >
        </hx-list-item>
        <hx-list-item value="messages">
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Messages
        </hx-list-item>
        <hx-list-item value="records" disabled>
          <svg
            slot="prefix"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Records (Restricted)
        </hx-list-item>
      </hx-list>
    </nav>
  `,
};

// ─────────────────────────────────────────────────
// 7. DESCRIPTION LIST
// ─────────────────────────────────────────────────

export const DescriptionList: Story = {
  name: 'Description List',
  render: () => html`
    <hx-list variant="description" style="max-width: 400px;">
      <hx-list-item type="term">Allergies</hx-list-item>
      <hx-list-item type="definition">Penicillin, Sulfa drugs</hx-list-item>
      <hx-list-item type="term">Blood Type</hx-list-item>
      <hx-list-item type="definition">O positive</hx-list-item>
      <hx-list-item type="term">Primary Diagnosis</hx-list-item>
      <hx-list-item type="definition">Type 2 Diabetes Mellitus (E11.9)</hx-list-item>
    </hx-list>
  `,
};

// ─────────────────────────────────────────────────
// 8. NESTED LISTS
// ─────────────────────────────────────────────────

export const NestedList: Story = {
  name: 'Nested Lists',
  render: () => html`
    <hx-list variant="bulleted">
      <hx-list-item>
        Pre-operative checklist
        <hx-list variant="bulleted" slot="description">
          <hx-list-item>NPO after midnight</hx-list-item>
          <hx-list-item>Remove jewelry and piercings</hx-list-item>
          <hx-list-item>Arrange transportation home</hx-list-item>
        </hx-list>
      </hx-list-item>
      <hx-list-item>
        Post-operative instructions
        <hx-list variant="numbered" slot="description">
          <hx-list-item>Rest for 24 hours</hx-list-item>
          <hx-list-item>Take prescribed medications</hx-list-item>
          <hx-list-item>Follow-up in 2 weeks</hx-list-item>
        </hx-list>
      </hx-list-item>
    </hx-list>
  `,
};

export const MedicationList: Story = {
  name: 'Medication List',
  render: () => html`
    <hx-list variant="plain" divided style="max-width: 480px;">
      <hx-list-item>
        Amoxicillin 500mg
        <span slot="description">3x daily · Prescribed by Dr. Chen · Expires May 2026</span>
        <span
          slot="suffix"
          style="background: #dcfce7; color: #166534; border-radius: 0.25rem; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 600;"
          >Active</span
        >
      </hx-list-item>
      <hx-list-item>
        Lisinopril 10mg
        <span slot="description">1x daily · Prescribed by Dr. Williams · Expires Dec 2026</span>
        <span
          slot="suffix"
          style="background: #dcfce7; color: #166534; border-radius: 0.25rem; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 600;"
          >Active</span
        >
      </hx-list-item>
      <hx-list-item>
        Metformin 850mg
        <span slot="description">2x daily · Prescribed by Dr. Smith · Expired Jan 2026</span>
        <span
          slot="suffix"
          style="background: #fee2e2; color: #991b1b; border-radius: 0.25rem; padding: 0.125rem 0.5rem; font-size: 0.75rem; font-weight: 600;"
          >Expired</span
        >
      </hx-list-item>
    </hx-list>
  `,
};
