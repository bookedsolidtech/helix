import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-banner.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Banner',
  component: 'hx-banner',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['info', 'success', 'warning', 'error'],
      description: 'Visual variant that determines banner colors and ARIA semantics.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'info' },
        type: { summary: "'info' | 'success' | 'warning' | 'error'" },
      },
    },
    position: {
      control: { type: 'select' },
      options: ['sticky', 'fixed'],
      description:
        'CSS positioning behavior. "sticky" keeps the banner in document flow; "fixed" pins it to the viewport regardless of scroll.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'sticky' },
        type: { summary: "'sticky' | 'fixed'" },
      },
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the banner can be dismissed by the user via a close button.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the banner is visible. Defaults to true.',
      table: {
        category: 'State',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
    actionLabel: {
      control: 'text',
      description: 'Label text for the optional action link. Requires action-href to render.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    actionHref: {
      control: 'text',
      description: 'URL for the optional action link. Requires action-label to render.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    message: {
      control: 'text',
      description: 'Banner message text passed via the default slot.',
      table: {
        category: 'Content',
        type: { summary: 'string (slot)' },
      },
    },
    heading: {
      control: 'text',
      description:
        'Heading text for the banner, used to provide context in the action link\'s and close button\'s accessible labels.',
      table: {
        category: 'Content',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    labelClose: {
      control: 'text',
      description: 'Accessible label for the close/dismiss button.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'Dismiss banner' },
        type: { summary: 'string' },
      },
    },
    severityLabel: {
      control: 'text',
      description:
        'Override for the severity prefix announced to screen readers. Defaults to the English label matching the current variant.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
      },
    },
  },
  args: {
    variant: 'info',
    position: 'sticky',
    dismissible: false,
    open: true,
    actionLabel: '',
    actionHref: '',
    message: 'System maintenance is scheduled for tonight at 10 PM. Save your work before then.',
  },
  render: (args) => html`
    <hx-banner
      variant=${args.variant}
      position=${args.position}
      ?dismissible=${args.dismissible}
      ?open=${args.open}
      action-label=${args.actionLabel}
      action-href=${args.actionHref}
    >
      ${args.message}
    </hx-banner>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/** Primary use case: an informational banner rendered in its default state. */
export const Default: Story = {
  args: {
    variant: 'info',
    message: 'System maintenance is scheduled for tonight at 10 PM. Save your work before then.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');

    await expect(banner).toBeTruthy();
    await expect(banner?.shadowRoot).toBeTruthy();

    const bannerContainer = banner?.shadowRoot?.querySelector('[part="banner"]');
    await expect(bannerContainer).toBeTruthy();
    // Role is applied to the host element, not the shadow DOM internal div
    await expect(banner?.getAttribute('role')).toBe('status');

    // Verify icon is rendered
    const iconPart = banner?.shadowRoot?.querySelector('[part="icon"]');
    await expect(iconPart).toBeTruthy();
    const svg = iconPart?.querySelector('svg');
    await expect(svg).toBeTruthy();

    // Verify message slot is populated
    const messagePart = banner?.shadowRoot?.querySelector('[part="message"]');
    await expect(messagePart).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. EVERY VARIANT
// ─────────────────────────────────────────────────

/** Informational banner for non-critical system messages. Uses `role="status"` (implies polite announcement). */
export const Info: Story = {
  args: {
    variant: 'info',
    message:
      'Patient record #4821 has been checked out for review. Other users will see read-only access.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.variant).toBe('info');

    // Role is on the host element; aria-live is omitted to avoid JAWS double-announcements
    await expect(banner?.getAttribute('role')).toBe('status');
  },
};

/** Success banner confirming a completed system-level action. Uses `role="status"` (implies polite announcement). */
export const Success: Story = {
  args: {
    variant: 'success',
    message:
      'EHR migration completed successfully. All patient records are now available in the new system.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.variant).toBe('success');

    await expect(banner?.getAttribute('role')).toBe('status');
  },
};

/** Warning banner for situations requiring immediate clinician or administrator attention. Uses `role="alert"` (assertive). */
export const Warning: Story = {
  args: {
    variant: 'warning',
    message:
      'Scheduled downtime in 30 minutes. Please save all open patient records before 3:00 PM.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.variant).toBe('warning');

    // Role is on the host element; assertive for warning
    await expect(banner?.getAttribute('role')).toBe('alert');
  },
};

/** Error banner for critical system failures. Uses `role="alert"` (assertive) for immediate screen reader notification. */
export const Error: Story = {
  args: {
    variant: 'error',
    message:
      'Critical: Lab results interface is unavailable. Contact IT support immediately at ext. 5000.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.variant).toBe('error');

    await expect(banner?.getAttribute('role')).toBe('alert');
  },
};

// ─────────────────────────────────────────────────
// 3. DISMISSIBLE
// ─────────────────────────────────────────────────

/** Banner with a dismiss button. The banner fires `hx-dismiss` on close and hides itself. */
export const Dismissible: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    message: 'New feature: Inline lab result annotations are now available. Click to learn more.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();

    const closeBtn = banner?.shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeTruthy();
    await expect(closeBtn?.getAttribute('aria-label')).toBe('Dismiss');
  },
};

// ─────────────────────────────────────────────────
// 4. WITH ACTION LINK
// ─────────────────────────────────────────────────

/** Banner with an action link for directing users to relevant documentation or pages. */
export const WithAction: Story = {
  args: {
    variant: 'info',
    actionLabel: 'Learn more',
    actionHref: '#',
    message: 'HELiX Design System v2.0 is now available with improved accessibility support.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();

    const actionLink = banner?.shadowRoot?.querySelector('[part="action"]');
    await expect(actionLink).toBeTruthy();
    await expect(actionLink?.tagName.toLowerCase()).toBe('a');
  },
};

// ─────────────────────────────────────────────────
// 5. DISMISSIBLE WITH ACTION
// ─────────────────────────────────────────────────

/** Fully-featured banner combining dismiss capability with an action link. */
export const DismissibleWithAction: Story = {
  args: {
    variant: 'warning',
    dismissible: true,
    actionLabel: 'View maintenance window',
    actionHref: '#',
    message: 'Scheduled maintenance in 2 hours may temporarily affect lab result access.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();

    const closeBtn = banner?.shadowRoot?.querySelector('[part="close-button"]');
    await expect(closeBtn).toBeTruthy();

    const actionLink = banner?.shadowRoot?.querySelector('[part="action"]');
    await expect(actionLink).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 6. DISMISS INTERACTION
// ─────────────────────────────────────────────────

/** Demonstrates the dismiss interaction: clicking the close button hides the banner. */
export const DismissInteraction: Story = {
  args: {
    variant: 'info',
    dismissible: true,
    message: 'Click the dismiss button to close this banner.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.open).toBe(true);

    const closeBtn = banner?.shadowRoot?.querySelector<HTMLButtonElement>('[part="close-button"]');
    await expect(closeBtn).toBeTruthy();

    await userEvent.click(closeBtn!);

    await expect(banner?.open).toBe(false);
    await expect(banner?.hasAttribute('open')).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 7. POSITION: FIXED
// ─────────────────────────────────────────────────

/** Banner with fixed positioning that stays anchored to the top of the viewport during scroll. */
export const PositionFixed: Story = {
  args: {
    variant: 'warning',
    position: 'fixed',
    dismissible: true,
    message: 'Fixed banner: always visible at the top of the viewport regardless of scroll.',
  },
  play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    await expect(banner?.position).toBe('fixed');
    await expect(banner?.getAttribute('position')).toBe('fixed');
  },
};

export const DarkMode: Story = {
  decorators: [(story) => html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`],
  args: {
    variant: 'info',
    message: 'System maintenance is scheduled for tonight at 10 PM. Save your work before then.',
  },
};

export const WithSlots: Story = {
  render: () => html`
    <hx-banner variant="info" open>
      Scheduled maintenance window begins at 10 PM tonight.
      <span slot="action">
        <a href="/status">View status page</a>
      </span>
    </hx-banner>
  `,
};

// ─────────────────────────────────────────────────
// KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  render: () => html`
    <div style="padding: 1rem;">
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">
        Banners are not focusable elements themselves. When dismissible, the close button receives Tab focus and can be activated with Enter or Space.
      </p>
      <hx-banner></hx-banner>
    </div>
  `,
    play: async ({ canvasElement }) => {
    const banner = canvasElement.querySelector('hx-banner');
    await expect(banner).toBeTruthy();
    // Tab to the close button if present
    await userEvent.tab();
  },
};
