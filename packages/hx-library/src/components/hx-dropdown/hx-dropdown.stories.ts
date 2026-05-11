import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-dropdown.js';
import '../hx-menu/hx-menu.js';
import '../hx-menu/hx-menu-item.js';
import '../hx-menu/hx-menu-divider.js';
import '../hx-button/hx-button.js';
import '../hx-icon-button/hx-icon-button.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Dropdown',
  component: 'hx-dropdown',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'start',
        'end',
      ],
      description: 'Preferred placement of the dropdown panel.',
      table: {
        category: 'Positioning',
        defaultValue: { summary: 'bottom-start' },
        type: {
          summary:
            "'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'start' | 'end'",
        },
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
        <hx-button slot="trigger" variant="secondary">Open Menu</hx-button>
        <hx-menu>
          <hx-menu-item value="edit">Edit</hx-menu-item>
          <hx-menu-item value="duplicate">Duplicate</hx-menu-item>
          <hx-menu-divider></hx-menu-divider>
          <hx-menu-item
            value="delete"
            style="color: var(--hx-color-text-error, var(--hx-color-error-700, #b91c1c));"
            >Delete</hx-menu-item
          >
        </hx-menu>
      </hx-dropdown>
    </div>
  `,
  parameters: {
    actions: {
      handles: ['hx-show', 'hx-hide', 'hx-select'],
    },
  },
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
        <hx-button slot="trigger" variant="secondary">Open Menu</hx-button>
        <hx-menu>
          <hx-menu-item value="edit">Edit</hx-menu-item>
          <hx-menu-item value="duplicate">Duplicate</hx-menu-item>
          <hx-menu-divider></hx-menu-divider>
          <hx-menu-item
            value="delete"
            style="color: var(--hx-color-text-error, var(--hx-color-error-700, #b91c1c));"
            >Delete</hx-menu-item
          >
        </hx-menu>
      </hx-dropdown>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dropdown = canvasElement.querySelector('hx-dropdown');
    await expect(dropdown).toBeTruthy();
    await expect(dropdown?.shadowRoot?.querySelector('[part="panel"]')).toBeTruthy();
    await expect(dropdown?.querySelector('hx-menu')).toBeTruthy();

    // Query the slotted hx-button directly. testing-library's getByRole walks
    // the accessibility tree but hx-button is a custom element whose internal
    // <button> role is exposed via ElementInternals; the helper doesn't
    // resolve slotted-into-custom-element trees reliably across Chromium
    // accessibility-tree timings. Direct DOM query is the stable pattern,
    // BUT we still verify the trigger upgraded to a real button (host
    // querySelector alone would pass even if hx-button failed to register)
    // by asserting the internal <button> exists with the correct accessible
    // name. Same pattern as Icon Trigger below.
    const trigger = dropdown?.querySelector('hx-button[slot="trigger"]') as
      | (HTMLElement & { updateComplete?: Promise<unknown> })
      | null;
    await expect(trigger).toBeTruthy();
    if (!trigger) return;
    if (trigger.updateComplete) await trigger.updateComplete;
    const innerButton = trigger.shadowRoot?.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton?.textContent?.trim()).toMatch(/open menu/i);
    await userEvent.click(trigger);
    await expect(dropdown?.open).toBe(true);

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
        <hx-icon-button slot="trigger" label="More actions">
          <hx-icon library="helix" name="ellipsis"></hx-icon>
        </hx-icon-button>
        <hx-menu>
          <hx-menu-item value="view">View details</hx-menu-item>
          <hx-menu-item value="export">Export</hx-menu-item>
          <hx-menu-item value="archive">Archive</hx-menu-item>
        </hx-menu>
      </hx-dropdown>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const dropdown = canvasElement.querySelector('hx-dropdown');
    if (!dropdown) return;
    const trigger = dropdown.querySelector('[slot="trigger"]') as HTMLElement | null;
    if (!trigger) return;
    await userEvent.click(trigger);
  },
};

// ─────────────────────────────────────────────────
// 3. CUSTOM TRIGGER
// ─────────────────────────────────────────────────

export const CustomTrigger: Story = {
  name: 'Custom Trigger',
  render: () => html`
    <div style="padding: 4rem; display: flex; justify-content: center; align-items: flex-start;">
      <hx-dropdown placement="bottom-start">
        <hx-button slot="trigger" variant="tertiary">
          Patient Actions
          <hx-icon slot="suffix" library="helix" name="chevron-down" hx-size="sm"></hx-icon>
        </hx-button>
        <hx-menu style="min-width: 180px;">
          <hx-menu-item value="schedule">Schedule Appointment</hx-menu-item>
          <hx-menu-item value="notes">Add Clinical Note</hx-menu-item>
          <hx-menu-item value="referral">Create Referral</hx-menu-item>
          <hx-menu-divider></hx-menu-divider>
          <hx-menu-item
            value="discharge"
            style="color: var(--hx-color-text-error, var(--hx-color-error-700, #b91c1c));"
            >Discharge Patient</hx-menu-item
          >
        </hx-menu>
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
        <hx-button slot="trigger" variant="secondary" disabled>Disabled Menu</hx-button>
        <hx-menu>
          <hx-menu-item value="action">Action</hx-menu-item>
        </hx-menu>
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
    <div
      style="padding: 8rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; align-items: center;"
    >
      ${(['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end'] as const).map(
        (p) => html`
          <hx-dropdown placement=${p}>
            <hx-button slot="trigger" variant="secondary">${p}</hx-button>
            <hx-menu>
              <hx-menu-item value="a">Option A</hx-menu-item>
              <hx-menu-item value="b">Option B</hx-menu-item>
            </hx-menu>
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
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid var(--hx-color-border-default, #e5e7eb); border-radius: 0.5rem;"
      >
        <div>
          <strong>John Smith</strong>
          <span style="color: var(--hx-color-text-muted, #4a5568); font-size: 0.875rem;">
            — DOB: 1968-04-12 | MRN: 00123456</span
          >
        </div>
        <hx-dropdown placement="bottom-end">
          <hx-button slot="trigger" variant="secondary" size="sm">
            Actions
            <hx-icon slot="suffix" library="helix" name="chevron-down" hx-size="sm"></hx-icon>
          </hx-button>
          <hx-menu style="min-width: 200px;">
            <hx-menu-item value="schedule">Schedule Appointment</hx-menu-item>
            <hx-menu-item value="notes">Add Clinical Note</hx-menu-item>
            <hx-menu-item value="labs">Order Labs</hx-menu-item>
            <hx-menu-item value="referral">Create Referral</hx-menu-item>
            <hx-menu-divider></hx-menu-divider>
            <hx-menu-item
              value="discharge"
              style="color: var(--hx-color-text-error, var(--hx-color-error-700, #b91c1c));"
              >Discharge Patient</hx-menu-item
            >
          </hx-menu>
        </hx-dropdown>
      </div>
    </div>
  `,
};

export const DarkMode: Story = {
  decorators: [
    (story) =>
      html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`,
  ],
};

// ─────────────────────────────────────────────────
// KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  render: () => html`
    <div style="padding: 1rem;">
      <p style="font-size: 0.875rem; color: var(--hx-color-text-muted, #4a5568); margin-bottom: 0.75rem;">
        Tab focuses the trigger button. Enter or Space opens the menu. Arrow Down/Up navigates menu
        items. Enter selects. Escape closes.
      </p>
      <hx-dropdown>
        <hx-button slot="trigger" variant="secondary">Keyboard Demo</hx-button>
        <hx-menu>
          <hx-menu-item value="a">First option</hx-menu-item>
          <hx-menu-item value="b">Second option</hx-menu-item>
          <hx-menu-item value="c">Third option</hx-menu-item>
        </hx-menu>
      </hx-dropdown>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-dropdown');
    await expect(el).toBeTruthy();
    await userEvent.tab();
  },
};
