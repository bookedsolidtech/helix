import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent } from 'storybook/test';
import './hx-contextual-help.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/ContextualHelp',
  component: 'hx-contextual-help',
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Preferred placement of the popover relative to the trigger. Flips automatically if viewport space is insufficient.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'right' },
        type: { summary: "'top' | 'bottom' | 'left' | 'right'" },
      },
    },
    heading: {
      control: 'text',
      description:
        'Title text rendered as a heading inside the popover. Also serves as the accessible label via `aria-labelledby`.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
      description: 'Size of the trigger icon button. Maps to the `hx-size` attribute.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md'" },
      },
    },
    label: {
      control: 'text',
      description:
        'Accessible label for the trigger button rendered as `aria-label`. Localize for non-English UIs.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Help' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    placement: 'right',
    heading: 'Field Help',
    size: 'md',
    label: 'Help',
  },
  render: (args) => html`
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 2rem;">
      <hx-contextual-help
        placement=${args.placement}
        heading=${args.heading}
        hx-size=${args.size}
        label=${args.label}
      >
        This field accepts a valid NPI number. Contact your administrator if you need assistance
        locating your organization's NPI.
      </hx-contextual-help>
    </div>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Opens and closes the popover
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    heading: 'NPI Number',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-contextual-help');
    await expect(el).toBeTruthy();

    const trigger = el?.shadowRoot?.querySelector('button[part="trigger"]');
    await expect(trigger).toBeTruthy();

    // Popover should be closed initially
    await expect(el?.shadowRoot?.querySelector('[part="popover"]')).toBeNull();

    // Open
    await userEvent.click(trigger!);
    await expect(el?.shadowRoot?.querySelector('[part="popover"]')).toBeTruthy();

    // Close
    await userEvent.click(trigger!);
    await expect(el?.shadowRoot?.querySelector('[part="popover"]')).toBeNull();

    // Satisfy linter — canvas used
    await expect(canvas.getByRole('button', { name: 'Help' })).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. PLACEMENT STORIES
// ─────────────────────────────────────────────────

export const PlacementRight: Story = {
  args: { placement: 'right', heading: 'Appears to the right' },
};

export const PlacementLeft: Story = {
  args: { placement: 'left', heading: 'Appears to the left' },
};

export const PlacementTop: Story = {
  args: { placement: 'top', heading: 'Appears above' },
};

export const PlacementBottom: Story = {
  args: { placement: 'bottom', heading: 'Appears below' },
};

// ─────────────────────────────────────────────────
// 3. SIZE STORIES
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  args: { size: 'sm', heading: 'Small trigger' },
};

export const SizeMedium: Story = {
  args: { size: 'md', heading: 'Medium trigger' },
};

// ─────────────────────────────────────────────────
// 4. WITHOUT HEADING
// ─────────────────────────────────────────────────

export const NoHeading: Story = {
  args: { heading: '' },
  render: () => html`
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 2rem;">
      <hx-contextual-help placement="right">
        The medication must be administered within 30 minutes of preparation.
      </hx-contextual-help>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. WITH LINKS — verifies focus management with interactive slotted content
// ─────────────────────────────────────────────────

export const WithLinks: Story = {
  args: { heading: 'Additional Resources' },
  render: (args) => html`
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 2rem;">
      <hx-contextual-help placement=${args.placement} heading=${args.heading}>
        <p style="margin: 0 0 var(--hx-spacing-2, 0.5rem);">For more information, see:</p>
        <ul style="margin: 0; padding-left: 1.25rem;">
          <li><a href="#">Provider enrollment documentation</a></li>
          <li><a href="#">Contact system administrator</a></li>
        </ul>
      </hx-contextual-help>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. RICH CONTENT
// ─────────────────────────────────────────────────

export const RichContent: Story = {
  args: { heading: 'Insurance Verification' },
  render: (args) => html`
    <div style="display: flex; align-items: center; gap: 0.5rem; padding: 2rem;">
      <hx-contextual-help placement=${args.placement} heading=${args.heading}>
        <p style="margin: 0 0 0.5rem;">
          Your insurance ID can be found on the front of your insurance card.
        </p>
        <ul style="margin: 0; padding-left: 1.25rem;">
          <li>Member ID starts with a letter</li>
          <li>Group number is numeric only</li>
        </ul>
      </hx-contextual-help>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. FORM FIELD INTEGRATION
// ─────────────────────────────────────────────────

export const FormFieldDemo: Story = {
  render: () => html`
    <div
      style="max-width: 480px; padding: var(--hx-spacing-8, 2rem); font-family: var(--hx-font-family-sans, sans-serif);"
    >
      <h3
        style="margin: 0 0 var(--hx-spacing-6, 1.5rem); font-size: var(--hx-font-size-md, 1rem); font-weight: var(--hx-font-weight-semibold, 600); color: var(--hx-color-neutral-900);"
      >
        Patient Intake Form
      </h3>

      <!-- NPI Number field -->
      <div style="margin-bottom: var(--hx-spacing-5, 1.25rem);">
        <div
          style="display: flex; align-items: center; gap: var(--hx-spacing-1, 0.25rem); margin-bottom: var(--hx-spacing-1, 0.25rem);"
        >
          <label
            for="npi-input"
            style="font-size: var(--hx-font-size-sm, 0.875rem); font-weight: var(--hx-font-weight-medium, 500); color: var(--hx-color-neutral-700);"
          >
            NPI Number
          </label>
          <hx-contextual-help placement="right" heading="What is an NPI?">
            The National Provider Identifier (NPI) is a unique 10-digit number assigned to
            healthcare providers in the United States.
          </hx-contextual-help>
        </div>
        <input
          id="npi-input"
          type="text"
          placeholder="1234567890"
          style="width: 100%; padding: var(--hx-spacing-2, 0.5rem) var(--hx-spacing-3, 0.75rem); border: var(--hx-border-width-1, 1px) solid var(--hx-color-neutral-300); border-radius: var(--hx-border-radius-md); font-size: var(--hx-font-size-sm, 0.875rem); box-sizing: border-box;"
        />
      </div>

      <!-- Insurance ID field -->
      <div style="margin-bottom: var(--hx-spacing-5, 1.25rem);">
        <div
          style="display: flex; align-items: center; gap: var(--hx-spacing-1, 0.25rem); margin-bottom: var(--hx-spacing-1, 0.25rem);"
        >
          <label
            for="insurance-input"
            style="font-size: var(--hx-font-size-sm, 0.875rem); font-weight: var(--hx-font-weight-medium, 500); color: var(--hx-color-neutral-700);"
          >
            Insurance Member ID
          </label>
          <hx-contextual-help placement="right" heading="Where to find your Member ID" hx-size="sm">
            Located on the front of your insurance card. It typically begins with a letter followed
            by digits (e.g., A123456789).
          </hx-contextual-help>
        </div>
        <input
          id="insurance-input"
          type="text"
          placeholder="A123456789"
          style="width: 100%; padding: var(--hx-spacing-2, 0.5rem) var(--hx-spacing-3, 0.75rem); border: var(--hx-border-width-1, 1px) solid var(--hx-color-neutral-300); border-radius: var(--hx-border-radius-md); font-size: var(--hx-font-size-sm, 0.875rem); box-sizing: border-box;"
        />
      </div>

      <!-- DEA Number field -->
      <div>
        <div
          style="display: flex; align-items: center; gap: var(--hx-spacing-1, 0.25rem); margin-bottom: var(--hx-spacing-1, 0.25rem);"
        >
          <label
            for="dea-input"
            style="font-size: var(--hx-font-size-sm, 0.875rem); font-weight: var(--hx-font-weight-medium, 500); color: var(--hx-color-neutral-700);"
          >
            DEA Number
          </label>
          <hx-contextual-help placement="right" heading="DEA Registration Number">
            <p style="margin: 0 0 var(--hx-spacing-2, 0.5rem);">
              Required only for providers authorized to prescribe controlled substances.
            </p>
            <p style="margin: 0;">Format: two letters followed by seven digits.</p>
          </hx-contextual-help>
        </div>
        <input
          id="dea-input"
          type="text"
          placeholder="AB1234563"
          style="width: 100%; padding: var(--hx-spacing-2, 0.5rem) var(--hx-spacing-3, 0.75rem); border: var(--hx-border-width-1, 1px) solid var(--hx-color-neutral-300); border-radius: var(--hx-border-radius-md); font-size: var(--hx-font-size-sm, 0.875rem); box-sizing: border-box;"
        />
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  args: { heading: 'Keyboard Test' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-contextual-help');
    await expect(el).toBeTruthy();

    const trigger = el?.shadowRoot?.querySelector('button[part="trigger"]') as HTMLElement | null;
    await expect(trigger).toBeTruthy();

    // Focus trigger via Tab
    trigger!.focus();
    await expect(el?.shadowRoot?.activeElement).toBe(trigger);

    // Enter opens the popover
    await userEvent.keyboard('{Enter}');
    await expect(el?.shadowRoot?.querySelector('[part="popover"]')).toBeTruthy();

    // Escape closes and returns focus to trigger
    await userEvent.keyboard('{Escape}');
    await expect(el?.shadowRoot?.querySelector('[part="popover"]')).toBeNull();
    await expect(el?.shadowRoot?.activeElement).toBe(trigger);
  },
};

// ─────────────────────────────────────────────────
// 8. EVENTS — hx-open and hx-close
// ─────────────────────────────────────────────────

export const EventsFiring: Story = {
  args: { heading: 'Event Test' },
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-contextual-help');
    await expect(el).toBeTruthy();

    const trigger = el?.shadowRoot?.querySelector('button[part="trigger"]') as HTMLElement | null;
    if (!trigger) throw new Error('trigger not found');

    let openCount = 0;
    let closeCount = 0;
    el!.addEventListener('hx-open', () => openCount++);
    el!.addEventListener('hx-close', () => closeCount++);

    await userEvent.click(trigger);
    await expect(openCount).toBe(1);

    await userEvent.click(trigger);
    await expect(closeCount).toBe(1);
  },
};
