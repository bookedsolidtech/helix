import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-menu.js';
import './hx-menu-item.js';
import './hx-menu-divider.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Menu',
  component: 'hx-menu',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A context/action menu with keyboard navigation. Use `hx-menu-item` for items and `hx-menu-divider` to separate groups.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Basic menu with items
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <hx-menu>
      <hx-menu-item value="view">View Chart</hx-menu-item>
      <hx-menu-item value="edit">Edit Record</hx-menu-item>
      <hx-menu-item value="print">Print Summary</hx-menu-item>
    </hx-menu>
  `,
  play: async ({ canvasElement }) => {
    const menu = canvasElement.querySelector('hx-menu');
    await expect(menu).toBeTruthy();
    const items = canvasElement.querySelectorAll('hx-menu-item');
    await expect(items.length).toBe(3);
  },
};

// ─────────────────────────────────────────────────
// 2. WITH DIVIDERS — Grouped items
// ─────────────────────────────────────────────────

export const WithDividers: Story = {
  name: 'With Dividers',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="view">View Patient</hx-menu-item>
      <hx-menu-item value="edit">Edit Record</hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="assign">Assign Clinician</hx-menu-item>
      <hx-menu-item value="transfer">Transfer Care</hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="discharge">Discharge</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 3. WITH PREFIX ICONS
// ─────────────────────────────────────────────────

export const WithPrefixIcons: Story = {
  name: 'With Prefix Icons',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="view">
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View Chart
      </hx-menu-item>
      <hx-menu-item value="edit">
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
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Record
      </hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="delete">
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
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
        Delete Record
      </hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 4. WITH SUFFIX SHORTCUTS
// ─────────────────────────────────────────────────

export const WithSuffixShortcuts: Story = {
  name: 'With Keyboard Shortcuts',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="copy">
        Copy
        <kbd slot="suffix" style="font-size: 0.75em; opacity: 0.7;">⌘C</kbd>
      </hx-menu-item>
      <hx-menu-item value="paste">
        Paste
        <kbd slot="suffix" style="font-size: 0.75em; opacity: 0.7;">⌘V</kbd>
      </hx-menu-item>
      <hx-menu-item value="cut">
        Cut
        <kbd slot="suffix" style="font-size: 0.75em; opacity: 0.7;">⌘X</kbd>
      </hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 5. CHECKBOX ITEMS
// ─────────────────────────────────────────────────

export const CheckboxItems: Story = {
  name: 'Checkbox Items',
  render: () => html`
    <hx-menu>
      <hx-menu-item type="checkbox" value="notifications" checked>
        Email Notifications
      </hx-menu-item>
      <hx-menu-item type="checkbox" value="sms">SMS Alerts</hx-menu-item>
      <hx-menu-item type="checkbox" value="push">Push Notifications</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 5b. RADIO GROUP ITEMS
// ─────────────────────────────────────────────────

export const RadioGroupItems: Story = {
  name: 'Radio Group Items',
  render: () => html`
    <hx-menu>
      <hx-menu-item type="radio" value="low" checked>Low Priority</hx-menu-item>
      <hx-menu-item type="radio" value="medium">Medium Priority</hx-menu-item>
      <hx-menu-item type="radio" value="high">High Priority</hx-menu-item>
      <hx-menu-item type="radio" value="urgent">Urgent</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 6. DISABLED ITEMS
// ─────────────────────────────────────────────────

export const DisabledItems: Story = {
  name: 'Disabled Items',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="view">View Chart</hx-menu-item>
      <hx-menu-item value="edit" disabled>Edit Record (No Permission)</hx-menu-item>
      <hx-menu-item value="print">Print Summary</hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="delete" disabled>Delete (Admin Only)</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 7. LOADING ITEM
// ─────────────────────────────────────────────────

export const LoadingItem: Story = {
  name: 'Loading State',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="save" loading>Saving...</hx-menu-item>
      <hx-menu-item value="cancel">Cancel</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 8. WITH SUBMENU
// ─────────────────────────────────────────────────

export const WithSubmenu: Story = {
  name: 'With Submenu',
  render: () => html`
    <hx-menu>
      <hx-menu-item value="file">
        Patient Actions
        <hx-menu slot="submenu">
          <hx-menu-item value="admit">Admit</hx-menu-item>
          <hx-menu-item value="transfer">Transfer</hx-menu-item>
          <hx-menu-item value="discharge">Discharge</hx-menu-item>
        </hx-menu>
      </hx-menu-item>
      <hx-menu-item value="print">Print</hx-menu-item>
    </hx-menu>
  `,
};

// ─────────────────────────────────────────────────
// 9. HX-SELECT EVENT
// ─────────────────────────────────────────────────

export const SelectEvent: Story = {
  name: 'Select Event',
  render: () => html`
    <div>
      <hx-menu id="demo-menu">
        <hx-menu-item value="view">View Chart</hx-menu-item>
        <hx-menu-item value="edit">Edit Record</hx-menu-item>
        <hx-menu-item value="archive">Archive</hx-menu-item>
      </hx-menu>
      <p id="demo-output" style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
        Click an item to see the selected value.
      </p>
    </div>
    <script>
      document.getElementById('demo-menu').addEventListener('hx-select', (e) => {
        document.getElementById('demo-output').textContent = 'Selected: ' + e.detail.value;
      });
    </script>
  `,
  play: async ({ canvasElement }) => {
    const menu = canvasElement.querySelector('hx-menu');
    await expect(menu).toBeTruthy();

    let selectedValue = '';
    menu!.addEventListener('hx-select', (e: Event) => {
      selectedValue = (e as CustomEvent).detail.value;
    });

    const items = canvasElement.querySelectorAll('hx-menu-item');
    const firstItem = items[0]!.shadowRoot!.querySelector('.menu-item') as HTMLElement;
    await userEvent.click(firstItem);
    await expect(selectedValue).toBe('view');
  },
};

// ─────────────────────────────────────────────────
// 10. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  render: () => html`
    <div>
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">
        Click the first item to focus, then use Arrow keys to navigate. Press Enter or Space to
        select. Press Escape to close.
      </p>
      <hx-menu>
        <hx-menu-item value="view">View Chart</hx-menu-item>
        <hx-menu-item value="edit">Edit Record</hx-menu-item>
        <hx-menu-item value="print">Print Summary</hx-menu-item>
        <hx-menu-divider></hx-menu-divider>
        <hx-menu-item value="archive">Archive</hx-menu-item>
      </hx-menu>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE CONTEXT MENU
// ─────────────────────────────────────────────────

export const HealthcareContextMenu: Story = {
  name: 'Healthcare Context Menu',
  render: () => html`
    <hx-menu style="--hx-menu-min-width: 14rem;">
      <hx-menu-item value="view-chart">
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        View Patient Chart
      </hx-menu-item>
      <hx-menu-item value="add-note">
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
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Clinical Note
      </hx-menu-item>
      <hx-menu-item value="order">
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
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        Place Order
      </hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="assign">
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
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Assign Clinician
      </hx-menu-item>
      <hx-menu-item value="transfer">Transfer Care</hx-menu-item>
      <hx-menu-divider></hx-menu-divider>
      <hx-menu-item value="discharge" disabled>Discharge (Pending Review)</hx-menu-item>
    </hx-menu>
  `,
};
