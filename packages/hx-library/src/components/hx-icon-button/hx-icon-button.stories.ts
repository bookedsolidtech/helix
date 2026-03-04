import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-icon-button.js';

// ─────────────────────────────────────────────────
// Shared SVG icon helpers
// ─────────────────────────────────────────────────

const iconClose = html`
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
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
`;

const iconAdd = html`
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
    <path d="M12 5v14M5 12h14" />
  </svg>
`;

const iconEdit = html`
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
    <path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
    />
  </svg>
`;

const iconSettings = html`
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
    <circle cx="12" cy="12" r="3" />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
    />
  </svg>
`;

const iconDelete = html`
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
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
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
        'Required accessible name. Rendered as `aria-label` and `title` on the underlying element. A console warning is emitted when absent.',
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
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description:
        'Size of the button. Controls the square dimensions, padding, and icon scale. Maps to the `hx-size` attribute.',
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
        category: 'Form',
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
        'When set, renders an `<a>` element instead of a `<button>`. The `type`, `name`, and `value` attributes are ignored.',
      table: {
        category: 'Navigation',
        type: { summary: 'string | undefined' },
      },
    },
    name: {
      control: 'text',
      description: 'Name submitted with form data. Only applicable when rendering as a button.',
      table: {
        category: 'Form',
        type: { summary: 'string | undefined' },
      },
    },
    value: {
      control: 'text',
      description: 'Value submitted with form data. Only applicable when rendering as a button.',
      table: {
        category: 'Form',
        type: { summary: 'string | undefined' },
      },
    },
  },
  args: {
    label: 'Close',
    variant: 'ghost',
    size: 'md',
    disabled: false,
    type: 'button',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
      href=${ifDefined(args.href)}
      name=${ifDefined(args.name)}
      value=${ifDefined(args.value)}
    >
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
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </hx-icon-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Ghost variant with close icon; verifies hx-click fires
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Close',
    variant: 'ghost',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const innerButton = hxIconButton?.shadowRoot?.querySelector('button');
    if (!innerButton) {
      throw new Error('Inner button not found');
    }
    await expect(innerButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxIconButton?.addEventListener('hx-click', handler);

    await userEvent.click(innerButton);
    await expect(eventFired).toBe(true);

    hxIconButton?.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    label: 'Add patient',
    variant: 'primary',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${iconAdd}
    </hx-icon-button>
  `,
};

export const Secondary: Story = {
  args: {
    label: 'Edit record',
    variant: 'secondary',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${iconEdit}
    </hx-icon-button>
  `,
};

export const Tertiary: Story = {
  args: {
    label: 'Open settings',
    variant: 'tertiary',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${iconSettings}
    </hx-icon-button>
  `,
};

export const Danger: Story = {
  args: {
    label: 'Delete record',
    variant: 'danger',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${iconDelete}
    </hx-icon-button>
  `,
};

export const Ghost: Story = {
  args: {
    label: 'Close panel',
    variant: 'ghost',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      type=${args.type}
    >
      ${iconClose}
    </hx-icon-button>
  `,
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    label: 'Close',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    label: 'Close',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    label: 'Close',
    size: 'lg',
  },
};

// ─────────────────────────────────────────────────
// 4. DISABLED STATE — Verifies hx-click does NOT fire
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'Action unavailable',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const innerButton = hxIconButton?.shadowRoot?.querySelector('button');
    if (!innerButton) {
      throw new Error('Inner button not found');
    }
    await expect(innerButton).toBeTruthy();
    await expect(innerButton.disabled).toBe(true);

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxIconButton?.addEventListener('hx-click', handler);

    // Native click on a disabled button must not propagate hx-click
    innerButton.click();
    await expect(eventFired).toBe(false);

    hxIconButton?.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 5. AS LINK — href renders an <a> element
// ─────────────────────────────────────────────────

export const AsLink: Story = {
  args: {
    label: 'Go to settings',
    variant: 'ghost',
    href: '#',
  },
  render: (args) => html`
    <hx-icon-button
      label=${args.label}
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      href=${args.href!}
    >
      ${iconSettings}
    </hx-icon-button>
  `,
};

// ─────────────────────────────────────────────────
// 6. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Add patient" variant="primary">${iconAdd}</hx-icon-button>
        <span style="font-size: 0.75rem; color: #6b7280;">primary</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Edit record" variant="secondary">${iconEdit}</hx-icon-button>
        <span style="font-size: 0.75rem; color: #6b7280;">secondary</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Open settings" variant="tertiary">${iconSettings}</hx-icon-button>
        <span style="font-size: 0.75rem; color: #6b7280;">tertiary</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Delete record" variant="danger">${iconDelete}</hx-icon-button>
        <span style="font-size: 0.75rem; color: #6b7280;">danger</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Close panel" variant="ghost">${iconClose}</hx-icon-button>
        <span style="font-size: 0.75rem; color: #6b7280;">ghost</span>
      </div>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Small close" variant="ghost" hx-size="sm"
          >${iconClose}</hx-icon-button
        >
        <span style="font-size: 0.75rem; color: #6b7280;">sm</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Medium close" variant="ghost" hx-size="md"
          >${iconClose}</hx-icon-button
        >
        <span style="font-size: 0.75rem; color: #6b7280;">md</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <hx-icon-button label="Large close" variant="ghost" hx-size="lg"
          >${iconClose}</hx-icon-button
        >
        <span style="font-size: 0.75rem; color: #6b7280;">lg</span>
      </div>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(6, auto); gap: 1rem 1.5rem; align-items: center; justify-items: center;"
    >
      <!-- Header row -->
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">primary</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">secondary</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">tertiary</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">danger</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">ghost</span>
      <span style="font-size: 0.75rem; font-weight: 600; color: #374151;">state</span>

      <!-- Enabled row -->
      <hx-icon-button label="Add" variant="primary">${iconAdd}</hx-icon-button>
      <hx-icon-button label="Edit" variant="secondary">${iconEdit}</hx-icon-button>
      <hx-icon-button label="Settings" variant="tertiary">${iconSettings}</hx-icon-button>
      <hx-icon-button label="Delete" variant="danger">${iconDelete}</hx-icon-button>
      <hx-icon-button label="Close" variant="ghost">${iconClose}</hx-icon-button>
      <span style="font-size: 0.75rem; color: #6b7280;">enabled</span>

      <!-- Disabled row -->
      <hx-icon-button label="Add" variant="primary" disabled>${iconAdd}</hx-icon-button>
      <hx-icon-button label="Edit" variant="secondary" disabled>${iconEdit}</hx-icon-button>
      <hx-icon-button label="Settings" variant="tertiary" disabled>${iconSettings}</hx-icon-button>
      <hx-icon-button label="Delete" variant="danger" disabled>${iconDelete}</hx-icon-button>
      <hx-icon-button label="Close" variant="ghost" disabled>${iconClose}</hx-icon-button>
      <span style="font-size: 0.75rem; color: #6b7280;">disabled</span>
    </div>
    <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
      Hover and focus states are visible on interaction. Disabled buttons render at reduced opacity
      and fire no events.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const ToolbarExample: Story = {
  render: () => html`
    <div
      role="toolbar"
      aria-label="Patient record actions"
      style="display: flex; gap: 0.25rem; align-items: center; padding: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.5rem; width: fit-content;"
    >
      <hx-icon-button label="Admit patient" variant="primary">
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
          <path d="M12 5v14M5 12h14" />
        </svg>
      </hx-icon-button>
      <hx-icon-button label="Edit patient record" variant="ghost">
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
          <path
            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          />
        </svg>
      </hx-icon-button>
      <hx-icon-button label="Patient settings" variant="ghost">
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
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          />
        </svg>
      </hx-icon-button>
      <hx-icon-button label="Close patient record" variant="ghost">
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
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </hx-icon-button>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      The toolbar uses <code>role="toolbar"</code> with an <code>aria-label</code>. Each icon
      button's <code>label</code> attribute provides its accessible name.
    </p>
  `,
};

export const TableRowActions: Story = {
  render: () => html`
    <table style="border-collapse: collapse; width: 100%; max-width: 640px; font-size: 0.875rem;">
      <thead>
        <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151;">
            Patient
          </th>
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151;">
            Ward
          </th>
          <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600; color: #374151;">
            Status
          </th>
          <th
            style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #374151;"
            aria-label="Actions"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem; color: #111827;">Jane Doe</td>
          <td style="padding: 0.75rem 1rem; color: #6b7280;">Cardiology</td>
          <td style="padding: 0.75rem 1rem;">
            <span
              style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; background: #d1fae5; color: #065f46; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;"
              >Admitted</span
            >
          </td>
          <td style="padding: 0.5rem 1rem;">
            <div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
              <hx-icon-button label="Edit Jane Doe record" variant="ghost" hx-size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
              </hx-icon-button>
              <hx-icon-button label="Delete Jane Doe record" variant="danger" hx-size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </hx-icon-button>
            </div>
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 0.75rem 1rem; color: #111827;">John Smith</td>
          <td style="padding: 0.75rem 1rem; color: #6b7280;">Neurology</td>
          <td style="padding: 0.75rem 1rem;">
            <span
              style="display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;"
              >Pending</span
            >
          </td>
          <td style="padding: 0.5rem 1rem;">
            <div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
              <hx-icon-button label="Edit John Smith record" variant="ghost" hx-size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
              </hx-icon-button>
              <hx-icon-button
                label="Delete John Smith record"
                variant="danger"
                hx-size="sm"
                disabled
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </hx-icon-button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Each row action uses a unique <code>label</code> that includes the patient name so screen
      readers distinguish between identically-looking buttons.
    </p>
  `,
};

export const DialogClose: Story = {
  render: () => html`
    <div
      role="dialog"
      aria-labelledby="dialog-title"
      aria-modal="true"
      style="max-width: 480px; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); background: #fff; overflow: hidden;"
    >
      <header
        style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb;"
      >
        <h2 id="dialog-title" style="margin: 0; font-size: 1rem; font-weight: 600; color: #111827;">
          Patient Discharge Summary
        </h2>
        <hx-icon-button label="Close dialog" variant="ghost" hx-size="sm">
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
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </hx-icon-button>
      </header>
      <div style="padding: 1.25rem;">
        <p style="margin: 0 0 0.75rem; color: #374151;">
          Review and confirm the discharge summary for <strong>Jane Doe</strong> before finalizing.
        </p>
        <dl style="margin: 0; font-size: 0.875rem;">
          <dt style="font-weight: 600; color: #374151;">Discharge date</dt>
          <dd style="margin: 0 0 0.5rem; color: #6b7280;">March 3, 2026</dd>
          <dt style="font-weight: 600; color: #374151;">Attending physician</dt>
          <dd style="margin: 0; color: #6b7280;">Dr. A. Patel</dd>
        </dl>
      </div>
      <footer
        style="display: flex; gap: 0.75rem; justify-content: flex-end; padding: 0.75rem 1.25rem; background: #f9fafb; border-top: 1px solid #e5e7eb;"
      >
        <button
          style="padding: 0.5rem 1rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background: #fff; color: #374151; font-size: 0.875rem; cursor: pointer;"
        >
          Cancel
        </button>
        <button
          style="padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #fff; font-size: 0.875rem; font-weight: 500; cursor: pointer;"
        >
          Confirm Discharge
        </button>
      </footer>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      The close button in the dialog header uses <code>label="Close dialog"</code> so screen readers
      announce its purpose in context.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  args: {
    label: 'Verify prescription',
  },
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const eventSpy = fn();
    hxIconButton?.addEventListener('hx-click', eventSpy);

    const innerButton = hxIconButton?.shadowRoot?.querySelector('button');
    if (!innerButton) {
      throw new Error('Inner button not found');
    }
    await expect(innerButton).toBeTruthy();
    await userEvent.click(innerButton);

    await expect(eventSpy).toHaveBeenCalledTimes(1);

    const callArg = eventSpy.mock.calls[0]?.[0] as CustomEvent | undefined;
    if (!callArg) {
      throw new Error('Event not fired');
    }
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    hxIconButton?.removeEventListener('hx-click', eventSpy);
  },
};

export const KeyboardActivation: Story = {
  args: {
    label: 'Approve order',
  },
  play: async ({ canvasElement }) => {
    const hxIconButton = canvasElement.querySelector('hx-icon-button');
    await expect(hxIconButton).toBeTruthy();

    const innerButton = hxIconButton?.shadowRoot?.querySelector('button');
    if (!innerButton) {
      throw new Error('Inner button not found');
    }
    await expect(innerButton).toBeTruthy();

    // Tab to move focus onto the button
    await userEvent.tab();

    const activeEl = hxIconButton?.shadowRoot?.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Enter key must fire hx-click
    const enterSpy = fn();
    hxIconButton?.addEventListener('hx-click', enterSpy);
    await userEvent.keyboard('{Enter}');
    await expect(enterSpy).toHaveBeenCalledTimes(1);
    hxIconButton?.removeEventListener('hx-click', enterSpy);

    // Space key must also fire hx-click
    const spaceSpy = fn();
    hxIconButton?.addEventListener('hx-click', spaceSpy);
    await userEvent.keyboard(' ');
    await expect(spaceSpy).toHaveBeenCalledTimes(1);
    hxIconButton?.removeEventListener('hx-click', spaceSpy);
  },
};
