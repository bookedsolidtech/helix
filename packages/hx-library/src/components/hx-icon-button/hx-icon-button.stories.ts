import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-icon-button.js';

// ─────────────────────────────────────────────────
// SVG Icon Helpers
// ─────────────────────────────────────────────────

const gearIcon = html`
  <svg
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
    <circle cx="12" cy="12" r="3"></circle>
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    ></path>
  </svg>
`;

const checkIcon = html`
  <svg
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
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

const pencilIcon = html`
  <svg
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
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
`;

const infoIcon = html`
  <svg
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
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
`;

const trashIcon = html`
  <svg
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
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6l-1 14H6L5 6"></path>
    <path d="M10 11v6M14 11v6"></path>
    <path d="M9 6V4h6v2"></path>
  </svg>
`;

const lockIcon = html`
  <svg
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
`;

const printIcon = html`
  <svg
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
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
`;

const archiveIcon = html`
  <svg
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
    <polyline points="21 8 21 21 3 21 3 8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
`;

const plusIcon = html`
  <svg
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
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
`;

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/IconButton',
  component: 'hx-icon-button',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'Accessible name for the button. Required. Rendered as `aria-label` and `title` on the underlying element. The component suppresses render and emits a console warning when absent.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost'],
      description: 'Visual style variant of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'ghost' },
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'" },
      },
    },
    size: {
      name: 'size',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size of the button. Controls the square dimensions and icon scale. Bound to the `hx-size` attribute on the element.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description:
        'The type attribute for the underlying button element. Has no effect when `href` is set.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'button' },
        type: { summary: "'button' | 'submit' | 'reset'" },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled. Prevents interaction and fires no events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    href: {
      control: 'text',
      description:
        'When set, the component renders as an `<a>` element instead of a `<button>`. Navigates to the given URL on click.',
      table: {
        category: 'Behavior',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    label: 'Settings',
    variant: 'ghost',
    size: 'md',
    disabled: false,
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      type=${args.type ?? 'button'}
      ?disabled=${args.disabled}
      href=${ifDefined(args.href)}
    >
      ${gearIcon}
    </hx-icon-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies render and accessible label
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Settings',
    variant: 'ghost',
    size: 'md',
  },
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const innerButton = hxIconButton!.shadowRoot!.querySelector('[part="button"]');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton!.getAttribute('aria-label')).toBe('Settings');
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    label: 'Save',
    variant: 'primary',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="primary" hx-size=${args.size ?? 'md'}>
      ${checkIcon}
    </hx-icon-button>
  `,
};

export const Secondary: Story = {
  args: {
    label: 'Edit patient record',
    variant: 'secondary',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="secondary" hx-size=${args.size ?? 'md'}>
      ${pencilIcon}
    </hx-icon-button>
  `,
};

export const Tertiary: Story = {
  args: {
    label: 'More information',
    variant: 'tertiary',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="tertiary" hx-size=${args.size ?? 'md'}>
      ${infoIcon}
    </hx-icon-button>
  `,
};

export const Danger: Story = {
  args: {
    label: 'Delete record',
    variant: 'danger',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="danger" hx-size=${args.size ?? 'md'}>
      ${trashIcon}
    </hx-icon-button>
  `,
};

// ─────────────────────────────────────────────────
// 3. STATE STORIES
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'Action unavailable',
    variant: 'ghost',
    disabled: true,
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="ghost" hx-size=${args.size ?? 'md'} disabled>
      ${lockIcon}
    </hx-icon-button>
  `,
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const innerButton = hxIconButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton!.disabled).toBe(true);

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxIconButton!.addEventListener('hx-click', handler);
    innerButton!.click();
    await expect(eventFired).toBe(false);
    hxIconButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 4. SIZE STORIES
// ─────────────────────────────────────────────────

export const SmallSize: Story = {
  name: 'Size: Small',
  args: {
    label: 'Settings',
    size: 'sm',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant=${args.variant ?? 'ghost'} hx-size="sm">
      ${gearIcon}
    </hx-icon-button>
  `,
};

export const MediumSize: Story = {
  name: 'Size: Medium',
  args: {
    label: 'Settings',
    size: 'md',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant=${args.variant ?? 'ghost'} hx-size="md">
      ${gearIcon}
    </hx-icon-button>
  `,
};

export const LargeSize: Story = {
  name: 'Size: Large',
  args: {
    label: 'Settings',
    size: 'lg',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant=${args.variant ?? 'ghost'} hx-size="lg">
      ${gearIcon}
    </hx-icon-button>
  `,
};

// ─────────────────────────────────────────────────
// 5. KITCHEN SINK — All Variants
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-icon-button label="Edit patient record" variant="primary"> ${pencilIcon} </hx-icon-button>
      <hx-icon-button label="Save" variant="secondary"> ${checkIcon} </hx-icon-button>
      <hx-icon-button label="More information" variant="tertiary"> ${infoIcon} </hx-icon-button>
      <hx-icon-button label="Delete record" variant="danger"> ${trashIcon} </hx-icon-button>
      <hx-icon-button label="Settings" variant="ghost"> ${gearIcon} </hx-icon-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINK — All Sizes
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-icon-button label="Settings (small)" variant="ghost" hx-size="sm">
        ${gearIcon}
      </hx-icon-button>
      <hx-icon-button label="Settings (medium)" variant="ghost" hx-size="md">
        ${gearIcon}
      </hx-icon-button>
      <hx-icon-button label="Settings (large)" variant="ghost" hx-size="lg">
        ${gearIcon}
      </hx-icon-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. LINK MODE
// ─────────────────────────────────────────────────

export const LinkMode: Story = {
  name: 'Link Mode',
  render: () => html`
    <hx-icon-button label="Go to patient portal" variant="ghost" href="#">
      ${infoIcon}
    </hx-icon-button>
  `,
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const anchor = hxIconButton!.shadowRoot!.querySelector('a[part="button"]');
    await expect(anchor).toBeTruthy();
    await expect(anchor!.getAttribute('aria-label')).toBe('Go to patient portal');
  },
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE: ACTION BAR
// ─────────────────────────────────────────────────

export const HealthcareActions: Story = {
  name: 'Healthcare: Action Bar',
  render: () => html`
    <div
      style="display: flex; gap: 0.5rem; align-items: center; padding: 0.75rem 1rem; background: var(--hx-color-neutral-50, #f9fafb); border: 1px solid var(--hx-color-neutral-200, #e5e7eb); border-radius: 0.5rem;"
      role="toolbar"
      aria-label="Patient record actions"
    >
      <hx-icon-button label="Edit patient" variant="ghost" hx-size="md">
        ${pencilIcon}
      </hx-icon-button>
      <hx-icon-button label="Add note" variant="ghost" hx-size="md"> ${plusIcon} </hx-icon-button>
      <hx-icon-button label="Print record" variant="ghost" hx-size="md">
        ${printIcon}
      </hx-icon-button>
      <hx-icon-button label="Archive" variant="ghost" hx-size="md"> ${archiveIcon} </hx-icon-button>
      <hx-icon-button label="Delete record" variant="danger" hx-size="md">
        ${trashIcon}
      </hx-icon-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  args: {
    label: 'Save patient record',
    variant: 'primary',
  },
  render: (args) => html`
    <hx-icon-button label=${args.label} variant="primary" hx-size="md">
      ${checkIcon}
    </hx-icon-button>
  `,
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const eventSpy = fn();
    hxIconButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxIconButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await userEvent.click(innerButton!);

    await expect(eventSpy).toHaveBeenCalledTimes(1);

    const callArg = eventSpy.mock.calls[0][0] as CustomEvent;
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    hxIconButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const DisabledNoEvent: Story = {
  name: 'Disabled — No Event',
  render: () => html`
    <hx-icon-button label="Action unavailable" variant="ghost" disabled>
      ${lockIcon}
    </hx-icon-button>
  `,
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const eventSpy = fn();
    hxIconButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxIconButton!.shadowRoot!.querySelector('button');
    await expect(innerButton!.disabled).toBe(true);

    innerButton!.click();
    await expect(eventSpy).toHaveBeenCalledTimes(0);

    hxIconButton!.removeEventListener('hx-click', eventSpy);
  },
};
