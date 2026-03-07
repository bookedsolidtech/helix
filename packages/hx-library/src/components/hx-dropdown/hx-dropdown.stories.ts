import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-dropdown.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Dropdown',
  component: 'hx-dropdown',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'start', 'end'],
      description: 'Preferred placement of the dropdown panel.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'bottom-start' },
        type: { summary: "'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'start' | 'end'" },
      },
    },
    open: {
      control: { type: 'boolean' },
      description: 'Whether the dropdown is open.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the dropdown is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    distance: {
      control: { type: 'number' },
      description: 'Gap in pixels between the trigger and the panel.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: '4' },
        type: { summary: 'number' },
      },
    },
  },
  args: {
    placement: 'bottom-start',
    open: false,
    disabled: false,
    distance: 4,
  },
  render: (args) => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown
        placement=${args.placement}
        ?open=${args.open}
        ?disabled=${args.disabled}
        distance=${args.distance}
      >
        <button slot="trigger" type="button">Open Menu</button>
        <ul style="margin: 0; padding: 0.25rem 0; list-style: none;">
          <li data-value="edit" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Edit</li>
          <li data-value="duplicate" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Duplicate</li>
          <li data-value="delete" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer; color: #dc2626;">Delete</li>
        </ul>
      </hx-dropdown>
    </div>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Button Trigger
// ─────────────────────────────────────────────────

export const Default: Story = {
  name: 'Button Trigger',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown>
        <button slot="trigger" type="button">Open Menu</button>
        <ul style="margin: 0; padding: 0.25rem 0; list-style: none;">
          <li data-value="edit" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Edit</li>
          <li data-value="duplicate" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Duplicate</li>
          <li data-value="delete" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer; color: #dc2626;">Delete</li>
        </ul>
      </hx-dropdown>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dropdown = canvasElement.querySelector('hx-dropdown');
    await expect(dropdown).toBeTruthy();
    await expect(dropdown?.shadowRoot?.querySelector('[part="panel"]')).toBeTruthy();
    await expect(dropdown?.shadowRoot?.querySelector('[role="menu"]')).toBeTruthy();

    // Trigger opens dropdown
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
    await expect(dropdown?.open).toBe(true);

    // Click again closes
    await userEvent.click(trigger);
    await expect(dropdown?.open).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 2. ICON TRIGGER
// ─────────────────────────────────────────────────

export const IconTrigger: Story = {
  name: 'Icon Trigger',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown placement="bottom-end">
        <button
          slot="trigger"
          type="button"
          aria-label="More actions"
          style="width: 2rem; height: 2rem; border-radius: 50%; border: 1px solid #d1d5db; cursor: pointer; font-size: 1.25rem; display: inline-flex; align-items: center; justify-content: center;"
        >
          ⋯
        </button>
        <ul style="margin: 0; padding: 0.25rem 0; list-style: none;">
          <li data-value="view" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">View details</li>
          <li data-value="export" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Export</li>
          <li data-value="archive" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Archive</li>
        </ul>
      </hx-dropdown>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. CUSTOM TRIGGER
// ─────────────────────────────────────────────────

export const CustomTrigger: Story = {
  name: 'Custom Trigger',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown placement="bottom-start">
        <a
          slot="trigger"
          href="#"
          role="button"
          style="display: inline-flex; align-items: center; gap: 0.25rem; text-decoration: none; color: #4338ca; font-weight: 500;"
          @click=${(e: Event) => e.preventDefault()}
        >
          Patient Actions ▾
        </a>
        <ul style="margin: 0; padding: 0.25rem 0; list-style: none; min-width: 180px;">
          <li data-value="schedule" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Schedule Appointment</li>
          <li data-value="notes" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Add Clinical Note</li>
          <li data-value="referral" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Create Referral</li>
          <li data-value="discharge" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer; color: #dc2626;">Discharge Patient</li>
        </ul>
      </hx-dropdown>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  name: 'Disabled',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown disabled>
        <button slot="trigger" type="button" disabled>Disabled Menu</button>
        <ul style="margin: 0; padding: 0.25rem 0; list-style: none;">
          <li data-value="action" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Action</li>
        </ul>
      </hx-dropdown>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dropdown = canvasElement.querySelector('hx-dropdown');
    await expect(dropdown?.disabled).toBe(true);
    await expect(dropdown?.open).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 5. PLACEMENT VARIANTS
// ─────────────────────────────────────────────────

export const Placements: Story = {
  name: 'Placement Variants',
  render: () => html`
    <div style="padding: 8rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; align-items: center;">
      ${(['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end'] as const).map(
        (p) => html`
          <hx-dropdown placement=${p}>
            <button slot="trigger" type="button">${p}</button>
            <ul style="margin: 0; padding: 0.25rem 0; list-style: none;">
              <li role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Option A</li>
              <li role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Option B</li>
            </ul>
          </hx-dropdown>
        `,
      )}
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE USE CASE
// ─────────────────────────────────────────────────

export const HealthcareUseCases: Story = {
  name: 'Healthcare: Patient Actions',
  render: () => html`
    <div style="padding: 4rem; max-width: 600px; margin: 0 auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;">
        <div>
          <strong>John Smith</strong>
          <span style="color: #6b7280; font-size: 0.875rem;"> — DOB: 1968-04-12 | MRN: 00123456</span>
        </div>
        <hx-dropdown placement="bottom-end">
          <button slot="trigger" type="button" style="padding: 0.375rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;">
            Actions ▾
          </button>
          <ul style="margin: 0; padding: 0.25rem 0; list-style: none; min-width: 200px;">
            <li data-value="schedule" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Schedule Appointment</li>
            <li data-value="notes" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Add Clinical Note</li>
            <li data-value="labs" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Order Labs</li>
            <li data-value="referral" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer;">Create Referral</li>
            <hr style="margin: 0.25rem 0; border: none; border-top: 1px solid #e5e7eb;" />
            <li data-value="discharge" role="menuitem" tabindex="-1" style="padding: 0.5rem 1rem; cursor: pointer; color: #dc2626;">Discharge Patient</li>
          </ul>
        </hx-dropdown>
      </div>
    </div>
  `,
};
