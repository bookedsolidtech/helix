import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect } from 'storybook/test';
import './hx-divider.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Divider',
  component: 'hx-divider',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the divider.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    spacing: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Block/inline spacing around the divider.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: 'md' },
        type: { summary: "'none' | 'sm' | 'md' | 'lg'" },
      },
    },
    decorative: {
      control: { type: 'boolean' },
      description: 'When true, the divider is purely decorative (role="presentation").',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    orientation: 'horizontal',
    spacing: 'md',
    decorative: false,
  },
  render: (args) => html`
    <div style="padding: 1rem; max-width: 480px;">
      <p style="margin: 0;">Section one content</p>
      <hx-divider
        orientation=${args.orientation}
        spacing=${args.spacing}
        ?decorative=${args.decorative}
      ></hx-divider>
      <p style="margin: 0;">Section two content</p>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-divider');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. HORIZONTAL (explicit)
// ─────────────────────────────────────────────────

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: () => html`
    <div style="padding: 1rem; max-width: 480px;">
      <p style="margin: 0;">Patient demographics</p>
      <hx-divider orientation="horizontal"></hx-divider>
      <p style="margin: 0;">Vitals summary</p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. VERTICAL
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: () => html`
    <div style="display: flex; align-items: center; gap: 0; height: 2rem;">
      <span>Patient ID: 10042</span>
      <hx-divider orientation="vertical" spacing="sm"></hx-divider>
      <span>DOB: 1982-03-15</span>
      <hx-divider orientation="vertical" spacing="sm"></hx-divider>
      <span>MRN: 885521</span>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. WITH LABEL
// ─────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => html`
    <div style="padding: 1rem; max-width: 480px;">
      <p style="margin: 0;">Prior authorization requests</p>
      <hx-divider>Or continue without authorization</hx-divider>
      <p style="margin: 0;">Emergency access bypass</p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-divider');
    await expect(el).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 5. DECORATIVE
// ─────────────────────────────────────────────────

export const Decorative: Story = {
  args: {
    decorative: true,
  },
  render: () => html`
    <div style="padding: 1rem; max-width: 480px;">
      <p style="margin: 0;">Content above</p>
      <hx-divider decorative></hx-divider>
      <p style="margin: 0;">Content below (divider hidden from screen readers)</p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. SPACING VARIANTS
// ─────────────────────────────────────────────────

export const SpacingVariants: Story = {
  render: () => html`
    <div style="padding: 1rem; max-width: 480px;">
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">spacing="none"</p>
      <hx-divider spacing="none"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">spacing="sm"</p>
      <hx-divider spacing="sm"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">spacing="md" (default)</p>
      <hx-divider spacing="md"></hx-divider>
      <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">spacing="lg"</p>
      <hx-divider spacing="lg"></hx-divider>
      <p style="margin: 0;">End</p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientRecordSections: Story = {
  render: () => html`
    <div style="padding: 1rem; max-width: 520px; font-family: sans-serif;">
      <h3 style="margin: 0 0 0.5rem;">Patient Overview</h3>
      <p style="margin: 0; color: #374151;">Jane Doe — MRN: 885521 — DOB: 1982-03-15</p>

      <hx-divider>Allergies</hx-divider>
      <ul style="margin: 0; padding-left: 1.25rem; color: #374151;">
        <li>Penicillin (severe)</li>
        <li>Shellfish (moderate)</li>
      </ul>

      <hx-divider>Current Medications</hx-divider>
      <ul style="margin: 0; padding-left: 1.25rem; color: #374151;">
        <li>Metformin 500mg — twice daily</li>
        <li>Lisinopril 10mg — once daily</li>
      </ul>

      <hx-divider>Recent Labs</hx-divider>
      <p style="margin: 0; color: #374151;">HbA1c: 6.8% — Collected 2026-02-15</p>
    </div>
  `,
};

export const InlinePatientMeta: Story = {
  render: () => html`
    <div
      style="display: flex; align-items: center; padding: 0.75rem 1rem; background: #f9fafb; border-radius: 0.5rem; gap: 0;"
    >
      <span style="font-size: 0.875rem; color: #374151;">Jane Doe</span>
      <hx-divider orientation="vertical" spacing="sm"></hx-divider>
      <span style="font-size: 0.875rem; color: #374151;">Age: 44</span>
      <hx-divider orientation="vertical" spacing="sm"></hx-divider>
      <span style="font-size: 0.875rem; color: #374151;">Room 214-B</span>
      <hx-divider orientation="vertical" spacing="sm"></hx-divider>
      <span style="font-size: 0.875rem; color: #374151;">Dr. Patel</span>
    </div>
  `,
};
