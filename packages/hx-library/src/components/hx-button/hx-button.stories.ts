import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-button.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'],
      description: 'Visual style variant of the button.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'" },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the button. Controls padding, font-size, and min-height.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
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
    loading: {
      control: 'boolean',
      description:
        'When true, shows an inline spinner and prevents double-click submission. The button remains in the DOM flow and retains its dimensions.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description:
        'The type attribute for the underlying button element. Use "submit" or "reset" for form-associated behavior.',
      table: {
        category: 'Form',
        defaultValue: { summary: 'button' },
        type: { summary: "'button' | 'submit' | 'reset'" },
      },
    },
    href: {
      control: 'text',
      description:
        'When set, the component renders as an anchor (<a>) element instead of a <button>. Navigates to the given URL on click.',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
    target: {
      control: 'text',
      description:
        'Anchor target attribute. Only applies when href is set. Use "_blank" to open in a new tab.',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
    name: {
      control: 'text',
      description: 'Form field name submitted with the form data.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'Form field value submitted with the form data.',
      table: {
        category: 'Form',
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Button label text (passed via the default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    type: 'button',
    label: 'Schedule Appointment',
  },
  render: (args) => html`
    <hx-button
      variant=${args.variant}
      hx-size=${args.size}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      type=${args.type}
    >
      ${args.label}
    </hx-button>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies click interaction and hx-click event
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Schedule Appointment',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxButton!.addEventListener('hx-click', handler);

    await userEvent.click(innerButton!);
    await expect(eventFired).toBe(true);

    hxButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES — Primary, Secondary, Tertiary, Danger, Ghost, Outline
// ─────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: 'Confirm Order',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'View Details',
  },
};

export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    label: 'Options',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Delete Record',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Cancel',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Export Report',
  },
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES — Small, Medium, Large
// ─────────────────────────────────────────────────

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Edit',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Submit Request',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Begin Assessment',
  },
};

// ─────────────────────────────────────────────────
// 4. STATE STORIES — Disabled, Loading
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Unavailable',
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    loading: true,
    label: 'Saving...',
  },
};

export const LoadingDanger: Story = {
  name: 'Loading (Danger)',
  args: {
    variant: 'danger',
    loading: true,
    label: 'Deleting...',
  },
};

// ─────────────────────────────────────────────────
// 5. BUTTON TYPES — button, submit, reset
// ─────────────────────────────────────────────────

export const TypeButton: Story = {
  args: {
    type: 'button',
    label: 'Standard Action',
  },
};

export const TypeSubmit: Story = {
  args: {
    type: 'submit',
    variant: 'primary',
    label: 'Submit Referral',
  },
};

export const TypeReset: Story = {
  args: {
    type: 'reset',
    variant: 'secondary',
    label: 'Reset Form',
  },
};

// ─────────────────────────────────────────────────
// 6. LINK / ANCHOR MODE
// ─────────────────────────────────────────────────

export const LinkDefault: Story = {
  name: 'Link (Same Tab)',
  render: () => html`
    <hx-button variant="primary" href="https://example.com">Open Patient Portal</hx-button>
  `,
};

export const LinkNewTab: Story = {
  name: 'Link (New Tab)',
  render: () => html`
    <hx-button variant="secondary" href="https://example.com" target="_blank">
      View Lab Results
    </hx-button>
  `,
};

export const LinkOutline: Story = {
  name: 'Link (Outline variant)',
  render: () => html`
    <hx-button variant="outline" href="https://example.com" target="_blank">
      Download Discharge Summary
    </hx-button>
  `,
};

// ─────────────────────────────────────────────────
// 7. PREFIX / SUFFIX SLOT STORIES
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  name: 'Prefix Slot (icon before label)',
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-button variant="primary">
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
        Add Patient
      </hx-button>

      <hx-button variant="secondary">
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
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Search Records
      </hx-button>

      <hx-button variant="danger">
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
      </hx-button>
    </div>
  `,
};

export const WithSuffixSlot: Story = {
  name: 'Suffix Slot (icon after label)',
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-button variant="primary">
        Continue
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
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </hx-button>

      <hx-button variant="outline">
        Export
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
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </hx-button>

      <hx-button variant="ghost">
        Open in Portal
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
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </hx-button>
    </div>
  `,
};

export const WithPrefixAndSuffixSlots: Story = {
  name: 'Prefix + Suffix Slots',
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-button variant="primary">
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
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
        Assign Clinician
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
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </hx-button>

      <hx-button variant="tertiary">
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
        Edit Note
        <svg
          slot="suffix"
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
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </hx-button>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. KITCHEN SINKS
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
      <hx-button variant="primary">Primary</hx-button>
      <hx-button variant="secondary">Secondary</hx-button>
      <hx-button variant="tertiary">Tertiary</hx-button>
      <hx-button variant="danger">Danger</hx-button>
      <hx-button variant="ghost">Ghost</hx-button>
      <hx-button variant="outline">Outline</hx-button>
    </div>
  `,
};

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-button hx-size="sm">Small</hx-button>
      <hx-button hx-size="md">Medium</hx-button>
      <hx-button hx-size="lg">Large</hx-button>
    </div>
  `,
};

export const AllCombinations: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(3, auto); gap: 1rem; align-items: center; justify-items: start;"
    >
      <!-- Header row -->
      <strong>Small</strong>
      <strong>Medium</strong>
      <strong>Large</strong>

      <!-- Primary -->
      <hx-button variant="primary" hx-size="sm">Primary SM</hx-button>
      <hx-button variant="primary" hx-size="md">Primary MD</hx-button>
      <hx-button variant="primary" hx-size="lg">Primary LG</hx-button>

      <!-- Secondary -->
      <hx-button variant="secondary" hx-size="sm">Secondary SM</hx-button>
      <hx-button variant="secondary" hx-size="md">Secondary MD</hx-button>
      <hx-button variant="secondary" hx-size="lg">Secondary LG</hx-button>

      <!-- Tertiary -->
      <hx-button variant="tertiary" hx-size="sm">Tertiary SM</hx-button>
      <hx-button variant="tertiary" hx-size="md">Tertiary MD</hx-button>
      <hx-button variant="tertiary" hx-size="lg">Tertiary LG</hx-button>

      <!-- Danger -->
      <hx-button variant="danger" hx-size="sm">Danger SM</hx-button>
      <hx-button variant="danger" hx-size="md">Danger MD</hx-button>
      <hx-button variant="danger" hx-size="lg">Danger LG</hx-button>

      <!-- Ghost -->
      <hx-button variant="ghost" hx-size="sm">Ghost SM</hx-button>
      <hx-button variant="ghost" hx-size="md">Ghost MD</hx-button>
      <hx-button variant="ghost" hx-size="lg">Ghost LG</hx-button>

      <!-- Outline -->
      <hx-button variant="outline" hx-size="sm">Outline SM</hx-button>
      <hx-button variant="outline" hx-size="md">Outline MD</hx-button>
      <hx-button variant="outline" hx-size="lg">Outline LG</hx-button>
    </div>
  `,
};

export const AllStates: Story = {
  render: () => html`
    <div
      style="display: grid; grid-template-columns: repeat(6, auto); gap: 1rem; align-items: center; justify-items: start;"
    >
      <strong>Primary</strong>
      <strong>Secondary</strong>
      <strong>Tertiary</strong>
      <strong>Danger</strong>
      <strong>Ghost</strong>
      <strong>Outline</strong>

      <!-- Default -->
      <hx-button variant="primary">Default</hx-button>
      <hx-button variant="secondary">Default</hx-button>
      <hx-button variant="tertiary">Default</hx-button>
      <hx-button variant="danger">Default</hx-button>
      <hx-button variant="ghost">Default</hx-button>
      <hx-button variant="outline">Default</hx-button>

      <!-- Disabled -->
      <hx-button variant="primary" disabled>Disabled</hx-button>
      <hx-button variant="secondary" disabled>Disabled</hx-button>
      <hx-button variant="tertiary" disabled>Disabled</hx-button>
      <hx-button variant="danger" disabled>Disabled</hx-button>
      <hx-button variant="ghost" disabled>Disabled</hx-button>
      <hx-button variant="outline" disabled>Disabled</hx-button>

      <!-- Loading -->
      <hx-button variant="primary" loading>Loading...</hx-button>
      <hx-button variant="secondary" loading>Loading...</hx-button>
      <hx-button variant="tertiary" loading>Loading...</hx-button>
      <hx-button variant="danger" loading>Loading...</hx-button>
      <hx-button variant="ghost" loading>Loading...</hx-button>
      <hx-button variant="outline" loading>Loading...</hx-button>
    </div>
    <p style="margin-top: 1rem; font-size: 0.875rem; color: #6b7280;">
      Hover and focus states are visible on interaction. Disabled buttons render at reduced opacity.
      Loading buttons show an inline spinner and suppress click events.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 9. COMPOSITION STORIES
// ─────────────────────────────────────────────────

export const ButtonGroup: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 0.75rem; align-items: center;"
      role="group"
      aria-label="Patient actions"
    >
      <hx-button variant="primary">Save Record</hx-button>
      <hx-button variant="secondary">Review</hx-button>
      <hx-button variant="ghost">Discard</hx-button>
    </div>
  `,
};

export const WithIcon: Story = {
  render: () => html`
    <hx-button variant="primary">
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
        style="vertical-align: middle;"
        aria-hidden="true"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Add Patient
    </hx-button>
  `,
};

export const IconOnly: Story = {
  render: () => html`
    <hx-button variant="ghost" aria-label="Close dialog">
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
    </hx-button>
  `,
};

export const FullWidth: Story = {
  render: () => html`
    <div style="max-width: 480px;">
      <hx-button variant="primary" style="display: block; width: 100%;">
        Complete Registration
      </hx-button>
    </div>
  `,
};

export const InAForm: Story = {
  render: () => html`
    <form
      id="referral-form"
      @submit=${(e: Event) => {
        e.preventDefault();
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px;"
    >
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Patient Name</span>
        <input
          type="text"
          value="Jane Doe"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Referral Reason</span>
        <input
          type="text"
          value="Cardiology consult"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <div style="display: flex; gap: 0.75rem;">
        <hx-button type="submit" variant="primary">Submit Referral</hx-button>
        <hx-button type="reset" variant="secondary">Reset</hx-button>
      </div>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const submitButton = canvasElement.querySelector('hx-button[type="submit"]');
    await expect(submitButton).toBeTruthy();

    let formSubmitted = false;
    form!.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      formSubmitted = true;
    });

    const innerButton = submitButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);
    await expect(formSubmitted).toBe(true);
  },
};

export const InACard: Story = {
  render: () => html`
    <div
      style="max-width: 400px; border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden;"
    >
      <div style="padding: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem;">Patient Summary</h3>
        <p style="margin: 0; color: #6b7280;">
          Review the patient chart before proceeding with the discharge process.
        </p>
      </div>
      <div
        style="padding: 1rem 1.5rem; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;"
      >
        <hx-button variant="ghost" hx-size="sm">Cancel</hx-button>
        <hx-button variant="secondary" hx-size="sm">Save Draft</hx-button>
        <hx-button variant="primary" hx-size="sm">Discharge</hx-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. EDGE CASES
// ─────────────────────────────────────────────────

export const LongLabel: Story = {
  render: () => html`
    <div style="max-width: 320px; border: 1px dashed #d1d5db; padding: 1rem;">
      <hx-button variant="primary">
        Submit Prior Authorization Request for Extended Inpatient Stay Approval
      </hx-button>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Button uses <code>white-space: nowrap</code> by default. Long labels will not wrap.
    </p>
  `,
};

export const DisabledInteraction: Story = {
  args: {
    disabled: true,
    label: 'Processing',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxButton!.addEventListener('hx-click', handler);

    // Attempt to click the disabled button via the inner button
    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();
    await expect(innerButton!.disabled).toBe(true);

    // Click should not fire hx-click on a disabled button
    innerButton!.click();
    await expect(eventFired).toBe(false);

    hxButton!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 11. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  render: () => html`
    <style>
      .css-prop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        max-width: 720px;
      }
      .css-prop-cell {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .css-prop-cell code {
        font-size: 0.75rem;
        color: #6b7280;
        font-family: monospace;
      }
    </style>
    <div class="css-prop-grid">
      <div class="css-prop-cell">
        <code>--hx-button-bg: #059669</code>
        <hx-button style="--hx-button-bg: #059669;">Custom Background</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-color: #fbbf24</code>
        <hx-button style="--hx-button-color: #fbbf24;">Custom Text Color</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-border-color: #dc2626</code>
        <hx-button
          variant="secondary"
          style="--hx-button-border-color: #dc2626; --hx-button-color: #dc2626;"
          >Custom Border</hx-button
        >
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-border-radius: 9999px</code>
        <hx-button style="--hx-button-border-radius: 9999px;">Pill Shape</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-font-family: Georgia, serif</code>
        <hx-button style="--hx-button-font-family: Georgia, serif;">Serif Font</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-font-weight: 400</code>
        <hx-button style="--hx-button-font-weight: 400;">Normal Weight</hx-button>
      </div>

      <div class="css-prop-cell">
        <code>--hx-button-focus-ring-color: #7c3aed</code>
        <hx-button style="--hx-button-focus-ring-color: #7c3aed;"
          >Focus Ring (tab to see)</hx-button
        >
      </div>
    </div>

    <div style="margin-top: 2rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem;">
      <strong>Usage</strong>
      <pre
        style="margin: 0.5rem 0 0; font-size: 0.8125rem; white-space: pre-wrap;"
      ><code>/* Override via host selector or inline style */
hx-button {
  --hx-button-bg: var(--hx-color-success-500);
  --hx-button-border-radius: 9999px;
}</code></pre>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  render: () => html`
    <style>
      .parts-demo hx-button::part(button) {
        text-transform: uppercase;
        letter-spacing: 0.1em;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .parts-demo-gradient hx-button::part(button) {
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        border: none;
        color: white;
      }
    </style>

    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-weight: 600;">
          Exposed part: <code>::part(button)</code>
        </p>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; color: #6b7280;">
          The inner native <code>&lt;button&gt;</code> is exposed via the <code>button</code> CSS
          part for external styling through Shadow DOM boundaries.
        </p>
      </div>

      <div class="parts-demo">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-button::part(button) { text-transform: uppercase; letter-spacing: 0.1em; box-shadow:
          ... }
        </code>
        <hx-button>Uppercase with Shadow</hx-button>
      </div>

      <div class="parts-demo-gradient">
        <code style="display: block; margin-bottom: 0.5rem; font-size: 0.75rem; color: #6b7280;">
          hx-button::part(button) { background: linear-gradient(...); }
        </code>
        <hx-button>Gradient Background</hx-button>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  args: {
    label: 'Verify Prescription',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const eventSpy = fn();
    hxButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);

    await expect(eventSpy).toHaveBeenCalledTimes(1);

    const callArg = eventSpy.mock.calls[0][0] as CustomEvent;
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    hxButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const KeyboardActivation: Story = {
  args: {
    label: 'Approve Order',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Tab to focus the button
    await userEvent.tab();

    // Verify the inner button receives focus
    const activeEl = hxButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Press Enter and verify event fires
    const enterSpy = fn();
    hxButton!.addEventListener('hx-click', enterSpy);
    await userEvent.keyboard('{Enter}');
    await expect(enterSpy).toHaveBeenCalledTimes(1);
    hxButton!.removeEventListener('hx-click', enterSpy);

    // Press Space and verify event fires
    const spaceSpy = fn();
    hxButton!.addEventListener('hx-click', spaceSpy);
    await userEvent.keyboard(' ');
    await expect(spaceSpy).toHaveBeenCalledTimes(1);
    hxButton!.removeEventListener('hx-click', spaceSpy);
  },
};

export const FormSubmit: Story = {
  render: () => html`
    <form
      id="test-form"
      @submit=${(e: Event) => e.preventDefault()}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px;"
    >
      <label style="display: flex; flex-direction: column; gap: 0.25rem;">
        <span style="font-weight: 600;">Medication Name</span>
        <input
          type="text"
          value="Amoxicillin 500mg"
          style="padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem;"
        />
      </label>
      <hx-button type="submit" variant="primary">Prescribe</hx-button>
    </form>
  `,
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form');
    await expect(form).toBeTruthy();

    const submitSpy = fn((e: Event) => e.preventDefault());
    form!.addEventListener('submit', submitSpy);

    const submitButton = canvasElement.querySelector('hx-button[type="submit"]');
    const innerButton = submitButton!.shadowRoot!.querySelector('button');
    await userEvent.click(innerButton!);

    await expect(submitSpy).toHaveBeenCalledTimes(1);

    form!.removeEventListener('submit', submitSpy);
  },
};

export const DisabledNoEvent: Story = {
  render: () => html` <hx-button variant="primary" disabled>Restricted Action</hx-button> `,
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const eventSpy = fn();
    hxButton!.addEventListener('hx-click', eventSpy);

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton!.disabled).toBe(true);

    // Native click on a disabled button should not fire the handler
    innerButton!.click();
    await expect(eventSpy).toHaveBeenCalledTimes(0);

    hxButton!.removeEventListener('hx-click', eventSpy);
  },
};

export const FocusRing: Story = {
  args: {
    label: 'Tab to Focus',
  },
  play: async ({ canvasElement }) => {
    const hxButton = canvasElement.querySelector('hx-button');
    await expect(hxButton).toBeTruthy();

    const innerButton = hxButton!.shadowRoot!.querySelector('button');
    await expect(innerButton).toBeTruthy();

    // Tab to the button to trigger :focus-visible
    await userEvent.tab();

    const activeEl = hxButton!.shadowRoot!.activeElement;
    await expect(activeEl).toBe(innerButton);

    // Verify the focus-visible outline is applied
    const styles = getComputedStyle(innerButton!);
    await expect(styles.outlineStyle).not.toBe('none');
  },
};

// ─────────────────────────────────────────────────
// 14. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientActions: Story = {
  render: () => html`
    <div
      style="display: flex; gap: 0.75rem; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;"
      role="toolbar"
      aria-label="Patient workflow actions"
    >
      <hx-button variant="primary">
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
          style="vertical-align: middle;"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Admit Patient
      </hx-button>
      <hx-button variant="secondary">
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
          style="vertical-align: middle;"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        Transfer
      </hx-button>
      <hx-button variant="ghost">
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
          style="vertical-align: middle;"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Discharge
      </hx-button>
    </div>
  `,
};

export const EmergencyAction: Story = {
  render: () => html`
    <hx-button
      variant="danger"
      hx-size="lg"
      style="--hx-button-focus-ring-color: var(--hx-color-error-500, #dc2626);"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        style="vertical-align: middle;"
      >
        <path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
        />
      </svg>
      Code Blue - Emergency Response
    </hx-button>
  `,
};

export const DangerConfirmationFlow: Story = {
  name: 'Danger — Confirmation Flow',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 420px; padding: 1.5rem; border: 1px solid #fca5a5; border-radius: 0.5rem; background: #fff7f7;"
    >
      <p style="margin: 0; font-weight: 600; color: #991b1b;">
        Permanently delete this patient record?
      </p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        This action cannot be undone. All associated notes, orders, and attachments will be removed.
      </p>
      <div style="display: flex; gap: 0.75rem;">
        <hx-button variant="danger">Delete Record</hx-button>
        <hx-button variant="ghost">Cancel</hx-button>
      </div>
    </div>
  `,
};

export const LoadingSubmissionFlow: Story = {
  name: 'Loading — Submission Flow',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 360px; padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 0.5rem;"
    >
      <p style="margin: 0; font-weight: 600;">Submit Prior Authorization</p>
      <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
        Sending request to payer network. This may take a few seconds.
      </p>
      <div style="display: flex; gap: 0.75rem;">
        <hx-button variant="primary" loading>Submitting...</hx-button>
        <hx-button variant="ghost" disabled>Cancel</hx-button>
      </div>
    </div>
  `,
};

export const OutlineInToolbar: Story = {
  name: 'Outline — Toolbar Actions',
  render: () => html`
    <div
      style="display: flex; gap: 0.5rem; padding: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0.375rem;"
      role="toolbar"
      aria-label="Chart actions"
    >
      <hx-button variant="outline" hx-size="sm">
        <svg
          slot="prefix"
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
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </hx-button>
      <hx-button variant="outline" hx-size="sm">
        <svg
          slot="prefix"
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
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        Print
      </hx-button>
      <hx-button variant="outline" hx-size="sm">
        <svg
          slot="prefix"
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
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </hx-button>
    </div>
  `,
};

export const TertiaryOptionsMenu: Story = {
  name: 'Tertiary — Options Pattern',
  render: () => html`
    <div
      style="display: flex; gap: 0.5rem; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;"
    >
      <hx-button variant="primary" hx-size="sm">Save Changes</hx-button>
      <hx-button variant="tertiary" hx-size="sm">
        More Options
        <svg
          slot="suffix"
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
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </hx-button>
    </div>
  `,
};
