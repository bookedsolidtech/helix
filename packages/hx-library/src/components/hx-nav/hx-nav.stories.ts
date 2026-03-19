import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import type { NavItem } from './hx-nav.js';
import './hx-nav.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Nav',
  component: 'hx-nav',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of the navigation.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'horizontal'" },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible aria-label for the nav landmark.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'Main navigation'" },
        type: { summary: 'string' },
      },
    },
    items: {
      control: 'object',
      description: 'Array of navigation items.',
      table: {
        category: 'Properties',
        type: { summary: 'NavItem[]' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Primary and secondary navigation component. Supports horizontal menu bar and vertical sidebar patterns. Mobile responsive with hamburger toggle.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────────

const sampleItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', current: true },
  { label: 'Patients', href: '/patients' },
  { label: 'Appointments', href: '/appointments' },
  { label: 'Reports', href: '/reports' },
];

const itemsWithSubmenus: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', current: true },
  {
    label: 'Patients',
    children: [
      { label: 'All Patients', href: '/patients' },
      { label: 'New Intake', href: '/patients/new' },
      { label: 'Discharge', href: '/patients/discharge' },
    ],
  },
  {
    label: 'Clinical',
    children: [
      { label: 'Lab Results', href: '/clinical/lab' },
      { label: 'Medications', href: '/clinical/meds' },
      { label: 'Vitals', href: '/clinical/vitals' },
    ],
  },
  { label: 'Reports', href: '/reports' },
];

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

/**
 * Default horizontal navigation bar with active page indication.
 * Typical top-navigation for a healthcare dashboard application.
 */
export const Default: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: sampleItems,
  },
  render: (args) => html`
    <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-nav');
    await expect(nav).toBeTruthy();
    await expect(nav!.shadowRoot).toBeTruthy();

    // Verify the nav landmark renders with the correct accessible label
    const navEl = nav!.shadowRoot!.querySelector('[part="nav"]');
    await expect(navEl).toBeTruthy();
    await expect(navEl!.getAttribute('aria-label')).toBe('Main navigation');

    // Verify nav items are rendered
    const items = nav!.shadowRoot!.querySelectorAll('[part="item"]');
    await expect(items.length).toBe(sampleItems.length);
  },
};

/**
 * Horizontal navigation with nested submenus.
 * Hovering or pressing Enter on items with children reveals a dropdown menu.
 * Use arrow keys to navigate within submenus and Escape to close.
 */
export const WithSubmenus: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: itemsWithSubmenus,
  },
  render: (args) => html`
    <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
  `,
};

/**
 * Vertical sidebar navigation pattern common in healthcare admin panels.
 * Items stack vertically and submenus expand inline.
 */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    label: 'Sidebar navigation',
    items: itemsWithSubmenus,
  },
  render: (args) => html`
    <div style="width: 240px; height: 500px;">
      <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
    </div>
  `,
};

/**
 * Navigation in a narrow viewport simulating mobile display.
 * The hamburger toggle button appears and items collapse into a menu.
 */
export const MobileView: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: itemsWithSubmenus,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => html`
    <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
  `,
};

/**
 * Navigation with an active child inside a submenu.
 * The active item is highlighted with `current: true` within the nested children.
 */
export const ActiveSubItem: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      {
        label: 'Patients',
        children: [
          { label: 'All Patients', href: '/patients', current: true },
          { label: 'New Intake', href: '/patients/new' },
        ],
      },
      { label: 'Reports', href: '/reports' },
    ] as NavItem[],
  },
  render: (args) => html`
    <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
  `,
};

/**
 * Empty navigation with no items.
 * Renders the nav landmark but no list items.
 */
export const Empty: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: [] as NavItem[],
  },
  render: (args) => html`
    <hx-nav orientation=${args.orientation} label=${args.label} .items=${args.items}></hx-nav>
  `,
};

/**
 * Custom themed navigation using CSS custom properties.
 * Override token values to match your brand colors.
 */
export const CustomTheme: Story = {
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: sampleItems,
  },
  render: (args) => html`
    <hx-nav
      orientation=${args.orientation}
      label=${args.label}
      .items=${args.items}
      style="
        --hx-nav-bg: #1e3a5f;
        --hx-nav-link-hover-bg: #2d5986;
        --hx-nav-link-active-bg: #0ea5e9;
      "
    ></hx-nav>
  `,
};

/**
 * Demonstrates the `hx-nav-select` event dispatched when a navigation item is activated.
 * The event detail contains the selected `NavItem` object.
 * Consuming applications use this to handle client-side routing without full page reloads.
 */
export const NavSelectEventDemo: Story = {
  name: 'Events: hx-nav-select',
  args: {
    orientation: 'horizontal',
    label: 'Main navigation',
    items: sampleItems,
  },
  render: (args) => html`
    <div>
      <hx-nav
        id="event-nav"
        orientation=${args.orientation}
        label=${args.label}
        .items=${args.items}
      ></hx-nav>
      <p
        id="nav-event-output"
        style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280; font-family: sans-serif;"
      >
        Click a navigation item to see the hx-nav-select event fire.
      </p>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('hx-nav');
    await expect(nav).toBeTruthy();

    let eventFired = false;
    let selectedItem: NavItem | null = null;

    nav!.addEventListener('hx-nav-select', (e: Event) => {
      eventFired = true;
      selectedItem = (e as CustomEvent<{ item: NavItem }>).detail.item;
    });

    // Click the first nav link (Patients — no children, so fires hx-nav-select)
    const links = nav!.shadowRoot!.querySelectorAll<HTMLElement>('[part="link"]');
    // sampleItems[1] is "Patients" — a simple link with no children
    const patientsLink = links[1];
    await expect(patientsLink).toBeTruthy();

    await userEvent.click(patientsLink!);

    await expect(eventFired).toBe(true);
    await expect(selectedItem).toBeTruthy();
    await expect((selectedItem as NavItem).label).toBe('Patients');
  },
};
