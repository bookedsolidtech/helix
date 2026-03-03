import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-accordion.js';
import './hx-accordion-item.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/AccordionItem',
  component: 'hx-accordion-item',
  tags: ['autodocs'],
  argTypes: {
    heading: {
      control: 'text',
      description:
        'Text content for the trigger heading. Use the `heading` slot instead when rich HTML is required.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    open: {
      control: 'boolean',
      description: 'Whether the accordion item panel is expanded.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Prevents user interaction. The trigger button becomes non-clickable.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    heading: 'Accordion Item Heading',
    open: false,
    disabled: false,
  },
  render: (args) => html`
    <hx-accordion-item
      heading=${args.heading}
      ?open=${args.open}
      ?disabled=${args.disabled}
    >
      <p style="margin: 0;">
        This is the panel content for the accordion item. Place any HTML content here.
      </p>
    </hx-accordion-item>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/**
 * A single accordion item in its default closed state.
 * The trigger button has `aria-expanded="false"` and the content panel is hidden.
 */
export const Default: Story = {
  args: {
    heading: 'What are my patient rights?',
    open: false,
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const item = canvasElement.querySelector('hx-accordion-item');

    await expect(item).toBeTruthy();
    await expect(item?.open).toBe(false);
    await expect(item?.disabled).toBe(false);

    const trigger = item?.shadowRoot?.querySelector('[part="trigger"]');
    await expect(trigger).toBeTruthy();
    await expect(trigger?.getAttribute('aria-expanded')).toBe('false');

    const content = item?.shadowRoot?.querySelector('[part="content"]');
    await expect(content).toBeTruthy();
    await expect(content?.getAttribute('aria-hidden')).toBe('true');

    // Verify heading part is rendered
    const headingPart = item?.shadowRoot?.querySelector('[part="heading"]');
    await expect(headingPart).toBeTruthy();

    // Verify icon part is rendered
    const iconPart = item?.shadowRoot?.querySelector('[part="icon"]');
    await expect(iconPart).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. OPEN
// ─────────────────────────────────────────────────

/**
 * A single accordion item in its expanded state via the `open` attribute.
 * The trigger has `aria-expanded="true"` and the content panel is visible.
 */
export const Open: Story = {
  args: {
    heading: 'How do I access my medical records?',
    open: true,
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('hx-accordion-item');

    await expect(item).toBeTruthy();
    await expect(item?.open).toBe(true);

    const trigger = item?.shadowRoot?.querySelector('[part="trigger"]');
    await expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    const content = item?.shadowRoot?.querySelector('[part="content"]');
    await expect(content?.getAttribute('aria-hidden')).toBe('false');
  },
};

// ─────────────────────────────────────────────────
// 3. DISABLED
// ─────────────────────────────────────────────────

/**
 * A single accordion item with the `disabled` attribute. The trigger button is
 * non-interactive and receives `aria-disabled="true"`. Clicking has no effect.
 */
export const Disabled: Story = {
  args: {
    heading: 'Billing information (currently unavailable)',
    open: false,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('hx-accordion-item');

    await expect(item).toBeTruthy();
    await expect(item?.disabled).toBe(true);

    const trigger = item?.shadowRoot?.querySelector('[part="trigger"]');
    await expect(trigger).toBeTruthy();
    await expect(trigger?.getAttribute('aria-disabled')).toBe('true');

    // Clicking a disabled trigger must not open the item
    if (trigger) {
      await userEvent.click(trigger as Element);
      await new Promise((r) => setTimeout(r, 50));
      await expect(item?.open).toBe(false);
    }
  },
};

// ─────────────────────────────────────────────────
// 4. WITH HEADING SLOT
// ─────────────────────────────────────────────────

/**
 * Uses the named `heading` slot to supply rich HTML content in the trigger.
 * The slotted element overrides the `heading` property. Suitable for labels
 * that include icons, badges, or other inline elements.
 */
export const WithHeadingSlot: Story = {
  render: () => html`
    <hx-accordion-item open>
      <span
        slot="heading"
        style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          width="16"
          height="16"
          aria-hidden="true"
          style="flex-shrink: 0;"
        >
          <path
            fill-rule="evenodd"
            d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
            clip-rule="evenodd"
          />
        </svg>
        Secure Patient Portal Access
        <span
          style="
            font-size: 0.6875rem;
            font-weight: 700;
            padding: 0.125rem 0.5rem;
            border-radius: 9999px;
            background: #dbeafe;
            color: #1d4ed8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          "
        >
          Verified
        </span>
      </span>
      <p style="margin: 0;">
        Access your lab results, appointment history, and secure messages with your care team
        through the patient portal at myhealth.example.org.
      </p>
    </hx-accordion-item>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('hx-accordion-item');
    await expect(item).toBeTruthy();
    await expect(item?.open).toBe(true);

    // Verify the heading slot content is present in the light DOM
    const slottedHeading = canvasElement.querySelector('[slot="heading"]');
    await expect(slottedHeading).toBeTruthy();

    // Verify the badge span inside the slotted heading
    const badge = slottedHeading?.querySelector('span');
    await expect(badge).toBeTruthy();

    // Verify the icon SVG is present
    const icon = slottedHeading?.querySelector('svg');
    await expect(icon).toBeTruthy();
    await expect(icon?.getAttribute('aria-hidden')).toBe('true');
  },
};

// ─────────────────────────────────────────────────
// 5. WITH RICH CONTENT
// ─────────────────────────────────────────────────

/**
 * Panel content using structured HTML elements — headings, lists, tables, and
 * inline styles. Demonstrates that the default slot accepts arbitrary HTML
 * and that the panel renders it without modification.
 */
export const WithRichContent: Story = {
  render: () => html`
    <hx-accordion-item heading="Current Medications — Full Review" open>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <p style="margin: 0; color: #374151; font-size: 0.875rem;">
          Last reconciled by clinical pharmacist on <strong>2025-12-01</strong>. Next review due
          before the upcoming nephrology consultation.
        </p>

        <table
          style="
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
            color: #111827;
          "
        >
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb;">
                Medication
              </th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb;">
                Dose
              </th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb;">
                Frequency
              </th>
              <th style="padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb;">
                Prescriber
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Metformin</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">500 mg</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Twice daily with meals</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Dr. Patel</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Lisinopril</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">10 mg</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Once daily (morning)</td>
              <td style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb;">Dr. Patel</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem 0.75rem;">Atorvastatin</td>
              <td style="padding: 0.5rem 0.75rem;">40 mg</td>
              <td style="padding: 0.5rem 0.75rem;">Once daily (evening)</td>
              <td style="padding: 0.5rem 0.75rem;">Dr. Nakamura</td>
            </tr>
          </tbody>
        </table>

        <div
          style="
            padding: 0.75rem 1rem;
            background: #fefce8;
            border: 1px solid #fde047;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: #713f12;
          "
        >
          <strong>Pharmacist note:</strong> Monitor renal function quarterly while on Lisinopril +
          Metformin combination. Next eGFR scheduled 2026-03-15.
        </div>
      </div>
    </hx-accordion-item>
  `,
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('hx-accordion-item');

    await expect(item).toBeTruthy();
    await expect(item?.open).toBe(true);

    // Verify the panel content is present in the light DOM
    const table = canvasElement.querySelector('table');
    await expect(table).toBeTruthy();

    const rows = canvasElement.querySelectorAll('tbody tr');
    await expect(rows.length).toBe(3);

    const noteDiv = canvasElement.querySelector('div[style*="background: #fefce8"]');
    await expect(noteDiv).toBeTruthy();

    // Verify ARIA state reflects the open panel
    const trigger = item?.shadowRoot?.querySelector('[part="trigger"]');
    await expect(trigger?.getAttribute('aria-expanded')).toBe('true');

    const content = item?.shadowRoot?.querySelector('[part="content"]');
    await expect(content?.getAttribute('aria-hidden')).toBe('false');
  },
};
