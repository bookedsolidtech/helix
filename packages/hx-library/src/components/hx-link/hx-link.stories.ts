import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-link.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Link',
  component: 'hx-link',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'subtle', 'danger'],
      description: 'Visual style variant of the link.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'subtle' | 'danger'" },
      },
    },
    href: {
      control: 'text',
      description: 'The URL the link points to.',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
    target: {
      control: { type: 'select' },
      options: ['_self', '_blank', '_parent', '_top'],
      description: 'Where to open the linked URL.',
      table: {
        category: 'Navigation',
        type: { summary: "'_blank' | '_self' | '_parent' | '_top'" },
      },
    },
    rel: {
      control: 'text',
      description:
        'Custom rel attribute. Defaults to "noopener noreferrer" when target="_blank".',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
    download: {
      control: 'text',
      description:
        'Causes the browser to download the URL. Set to true for no filename or a string for a suggested filename.',
      table: {
        category: 'Navigation',
        type: { summary: 'string | boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'When true, renders as a span with role="link" aria-disabled="true". Prevents navigation and hx-click events.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Link label text (passed via default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'default',
    href: 'https://example.com',
    disabled: false,
    label: 'View Patient Record',
  },
  render: (args) => html`
    <hx-link
      variant=${args.variant}
      href=${args.href ?? ''}
      ?disabled=${args.disabled}
      target=${args.target ?? ''}
    >
      ${args.label}
    </hx-link>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Verifies click interaction and hx-click event
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'View Patient Record',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const anchor = hxLink!.shadowRoot!.querySelector('a');
    await expect(anchor).toBeTruthy();

    let eventFired = false;
    const handler = () => {
      eventFired = true;
    };
    hxLink!.addEventListener('hx-click', handler);

    await userEvent.click(anchor!);
    await expect(eventFired).toBe(true);

    hxLink!.removeEventListener('hx-click', handler);
  },
};

// ─────────────────────────────────────────────────
// 2. VARIANT STORIES
// ─────────────────────────────────────────────────

export const DefaultVariant: Story = {
  name: 'Variant: Default',
  args: {
    variant: 'default',
    label: 'Schedule Appointment',
  },
};

export const Subtle: Story = {
  name: 'Variant: Subtle',
  args: {
    variant: 'subtle',
    label: 'Learn more about this procedure',
  },
};

export const Danger: Story = {
  name: 'Variant: Danger',
  args: {
    variant: 'danger',
    label: 'Delete Patient Record',
  },
};

// ─────────────────────────────────────────────────
// 3. STATE STORIES
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Link Unavailable',
  },
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const span = hxLink!.shadowRoot!.querySelector('span[role="link"]');
    await expect(span).toBeTruthy();
    await expect(span!.getAttribute('aria-disabled')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 4. NEW TAB STORIES
// ─────────────────────────────────────────────────

export const NewTab: Story = {
  name: 'Opens in New Tab',
  render: () => html`
    <hx-link href="https://example.com" target="_blank">Open Lab Results</hx-link>
  `,
};

// ─────────────────────────────────────────────────
// 5. DOWNLOAD STORY
// ─────────────────────────────────────────────────

export const Download: Story = {
  name: 'Download Link',
  render: () => html`
    <hx-link href="/reports/patient-summary.pdf" download="patient-summary.pdf">
      Download Discharge Summary
    </hx-link>
  `,
};

// ─────────────────────────────────────────────────
// 6. PREFIX / SUFFIX SLOT STORIES
// ─────────────────────────────────────────────────

export const WithPrefixSlot: Story = {
  name: 'Prefix Slot',
  render: () => html`
    <hx-link href="https://example.com">
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
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      View Patient Portal
    </hx-link>
  `,
};

export const WithSuffixSlot: Story = {
  name: 'Suffix Slot',
  render: () => html`
    <hx-link href="https://example.com">
      Download Report
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
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </hx-link>
  `,
};

// ─────────────────────────────────────────────────
// 7. KITCHEN SINK
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
      <hx-link href="https://example.com" variant="default">Default Link</hx-link>
      <hx-link href="https://example.com" variant="subtle">Subtle Link</hx-link>
      <hx-link href="https://example.com" variant="danger">Danger Link</hx-link>
      <hx-link disabled>Disabled Link</hx-link>
    </div>
  `,
};

export const InParagraph: Story = {
  name: 'Inline in Paragraph',
  render: () => html`
    <p style="font-size: 1rem; line-height: 1.6; max-width: 480px;">
      Please review the
      <hx-link href="https://example.com">patient consent form</hx-link>
      before proceeding. You can also
      <hx-link href="https://example.com" variant="subtle">learn more about HIPAA compliance</hx-link>
      or
      <hx-link href="https://example.com" variant="danger">revoke access</hx-link>
      to this record.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. INTERACTION TESTS
// ─────────────────────────────────────────────────

export const ClickEvent: Story = {
  args: {
    label: 'Verify Prescription',
  },
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const eventSpy = fn();
    hxLink!.addEventListener('hx-click', eventSpy);

    const anchor = hxLink!.shadowRoot!.querySelector('a');
    await userEvent.click(anchor!);

    await expect(eventSpy).toHaveBeenCalledTimes(1);

    const callArg = eventSpy.mock.calls[0][0] as CustomEvent;
    await expect(callArg.type).toBe('hx-click');
    await expect(callArg.detail.originalEvent).toBeTruthy();
    await expect(callArg.bubbles).toBe(true);
    await expect(callArg.composed).toBe(true);

    hxLink!.removeEventListener('hx-click', eventSpy);
  },
};

export const DisabledNoEvent: Story = {
  render: () => html` <hx-link disabled>Restricted Link</hx-link> `,
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const eventSpy = fn();
    hxLink!.addEventListener('hx-click', eventSpy);

    const span = hxLink!.shadowRoot!.querySelector('span[role="link"]');
    await expect(span).toBeTruthy();
    await expect(span!.getAttribute('aria-disabled')).toBe('true');

    await expect(eventSpy).toHaveBeenCalledTimes(0);

    hxLink!.removeEventListener('hx-click', eventSpy);
  },
};

// ─────────────────────────────────────────────────
// 9. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const PatientPortalLinks: Story = {
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; max-width: 360px;"
    >
      <h3 style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #374151;">
        Patient Resources
      </h3>
      <hx-link href="https://example.com">View Lab Results</hx-link>
      <hx-link href="https://example.com">Medication History</hx-link>
      <hx-link href="https://example.com" target="_blank">
        Download Discharge Summary
      </hx-link>
      <hx-link href="https://example.com" variant="subtle">Privacy Policy</hx-link>
      <hx-link variant="danger" disabled>Request Record Deletion (Contact Admin)</hx-link>
    </div>
  `,
};
