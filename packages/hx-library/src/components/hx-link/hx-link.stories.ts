import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, fn } from 'storybook/test';
import './hx-link.js';

const meta = {
  title: 'Components/Link',
  component: 'hx-link',
  tags: ['autodocs'],
  argTypes: {
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
      options: [undefined, '_self', '_blank', '_parent', '_top'],
      description: 'Where to display the linked URL.',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
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
    disabled: {
      control: 'boolean',
      description: 'Whether the link is disabled.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    download: {
      control: 'text',
      description: 'Prompts the user to download the linked URL.',
      table: {
        category: 'Navigation',
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Link label text (passed via the default slot).',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    href: 'https://example.com',
    variant: 'default',
    disabled: false,
    label: 'View Patient Record',
  },
  render: (args) => html`
    <hx-link
      href=${ifDefined(args.href)}
      target=${ifDefined(args.target)}
      variant=${ifDefined(args.variant)}
      ?disabled=${args.disabled}
      download=${ifDefined(args.download)}
    >
      ${args.label}
    </hx-link>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// --- Default ---

export const Default: Story = {
  args: {
    label: 'View Patient Record',
  },
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const anchor = hxLink!.shadowRoot!.querySelector('a');
    await expect(anchor).toBeTruthy();

    const eventSpy = fn();
    hxLink!.addEventListener('hx-click', eventSpy);
    anchor!.click();
    await expect(eventSpy).toHaveBeenCalledTimes(1);
    hxLink!.removeEventListener('hx-click', eventSpy);
  },
};

// --- Variants ---

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    label: 'View secondary info',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    label: 'Delete this record',
  },
};

// --- States ---

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Unavailable link',
  },
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const span = hxLink!.shadowRoot!.querySelector('span[role="link"]');
    await expect(span).toBeTruthy();
    await expect(span!.getAttribute('aria-disabled')).toBe('true');
    await expect(span!.getAttribute('tabindex')).toBe('0');

    const eventSpy = fn();
    hxLink!.addEventListener('hx-click', eventSpy);
    (span as HTMLElement).click();
    await expect(eventSpy).toHaveBeenCalledTimes(0);
    hxLink!.removeEventListener('hx-click', eventSpy);
  },
};

// --- External Link ---

export const ExternalLink: Story = {
  name: 'External (New Tab)',
  args: {
    href: 'https://example.com',
    target: '_blank',
    label: 'View Lab Results',
  },
  play: async ({ canvasElement }) => {
    const hxLink = canvasElement.querySelector('hx-link');
    await expect(hxLink).toBeTruthy();

    const anchor = hxLink!.shadowRoot!.querySelector('a');
    await expect(anchor!.getAttribute('rel')).toBe('noopener noreferrer');

    const icon = hxLink!.shadowRoot!.querySelector('[part~="external-icon"]');
    await expect(icon).toBeTruthy();

    const srOnly = hxLink!.shadowRoot!.querySelector('.sr-only');
    await expect(srOnly).toBeTruthy();
    await expect(srOnly!.textContent).toBe('(opens in new tab)');
  },
};

// --- Download ---

export const Download: Story = {
  args: {
    href: '/reports/discharge-summary.pdf',
    download: 'discharge-summary.pdf',
    label: 'Download Discharge Summary',
  },
};

// --- All Variants ---

export const AllVariants: Story = {
  render: () => html`
    <div style="display: flex; gap: 2rem; align-items: center; flex-wrap: wrap;">
      <hx-link href="https://example.com">Default</hx-link>
      <hx-link href="https://example.com" variant="subtle">Subtle</hx-link>
      <hx-link href="https://example.com" variant="danger">Danger</hx-link>
      <hx-link href="https://example.com" disabled>Disabled</hx-link>
    </div>
  `,
};

// --- All States ---

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <p>
        Internal link:
        <hx-link href="/patient/123">Patient Chart</hx-link>
      </p>
      <p>
        External link:
        <hx-link href="https://example.com" target="_blank">Lab Portal</hx-link>
      </p>
      <p>
        Disabled link:
        <hx-link href="/page" disabled>Restricted</hx-link>
      </p>
      <p>
        Download link:
        <hx-link href="/file.pdf" download="report.pdf">Report PDF</hx-link>
      </p>
      <p>
        Subtle variant:
        <hx-link href="/page" variant="subtle">Secondary info</hx-link>
      </p>
      <p>
        Danger variant:
        <hx-link href="/page" variant="danger">Delete action</hx-link>
      </p>
    </div>
  `,
};

// --- Inline Context ---

export const InlineContext: Story = {
  render: () => html`
    <p style="max-width: 600px; line-height: 1.6;">
      The patient's
      <hx-link href="/records/lab-results">lab results</hx-link>
      are available for review. Please consult the
      <hx-link href="https://example.com/guidelines" target="_blank">clinical guidelines</hx-link>
      before making any changes to the treatment plan. If you need assistance, contact the
      <hx-link href="/support" variant="subtle">support team</hx-link>.
    </p>
  `,
};

// --- CSS Custom Properties ---

export const CSSCustomProperties: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-link-color: #059669</code><br />
        <hx-link href="/page" style="--hx-link-color: #059669;">Custom green link</hx-link>
      </div>
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-link-text-decoration: none</code
        ><br />
        <hx-link href="/page" style="--hx-link-text-decoration: none;">No underline</hx-link>
      </div>
      <div>
        <code style="font-size: 0.75rem; color: #6b7280;">--hx-link-focus-ring-color: #7c3aed</code
        ><br />
        <hx-link href="/page" style="--hx-link-focus-ring-color: #7c3aed;"
          >Purple focus ring (tab to see)</hx-link
        >
      </div>
    </div>
  `,
};
