import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-accordion.js';
import './hx-accordion-item.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Accordion',
  component: 'hx-accordion',
  tags: ['autodocs'],
  argTypes: {
    multiple: {
      control: 'boolean',
      description:
        'Allow multiple accordion items to be open simultaneously. When false (default), opening one item closes all others.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all accordion items, preventing user interaction.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    multiple: false,
    disabled: false,
  },
  render: (args) => html`
    <hx-accordion ?multiple=${args.multiple} ?disabled=${args.disabled}>
      <hx-accordion-item heading="Section One" open>
        <p style="margin: 0;">
          This is the content for section one. It is open by default via the
          <code>open</code> attribute on the item.
        </p>
      </hx-accordion-item>
      <hx-accordion-item heading="Section Two">
        <p style="margin: 0;">
          Content for section two. Click the heading above to expand this panel.
        </p>
      </hx-accordion-item>
      <hx-accordion-item heading="Section Three">
        <p style="margin: 0;">
          Content for section three. Only one section can be open at a time in the default
          single-open mode.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

/**
 * Basic accordion with three items. The first item is open by default.
 * In single mode (default), opening one item automatically closes any other open item.
 */
export const Default: Story = {
  args: {
    multiple: false,
    disabled: false,
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const accordion = canvasElement.querySelector('hx-accordion');

    await expect(accordion).toBeTruthy();
    await expect(accordion?.shadowRoot).toBeTruthy();

    const accordionPart = accordion?.shadowRoot?.querySelector('[part="accordion"]');
    await expect(accordionPart).toBeTruthy();

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items.length).toBe(3);

    // First item should be open by default
    await expect(items[0].open).toBe(true);
    // Remaining items should be closed
    await expect(items[1].open).toBe(false);
    await expect(items[2].open).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 2. MULTIPLE
// ─────────────────────────────────────────────────

/**
 * Accordion with the `multiple` attribute set. Multiple items can be open simultaneously.
 * Opening a new item does not close any currently open items.
 */
export const Multiple: Story = {
  args: {
    multiple: true,
    disabled: false,
  },
  render: (args) => html`
    <hx-accordion ?multiple=${args.multiple} ?disabled=${args.disabled}>
      <hx-accordion-item heading="Section One" open>
        <p style="margin: 0;">Section one is open. Other sections can also be opened at the same time.</p>
      </hx-accordion-item>
      <hx-accordion-item heading="Section Two" open>
        <p style="margin: 0;">Section two is also open. Both sections remain open simultaneously.</p>
      </hx-accordion-item>
      <hx-accordion-item heading="Section Three">
        <p style="margin: 0;">
          Click to open section three. Sections one and two will remain open.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');

    await expect(accordion).toBeTruthy();
    await expect(accordion?.multiple).toBe(true);

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    // Both first and second items should be open simultaneously
    await expect(items[0].open).toBe(true);
    await expect(items[1].open).toBe(true);
    await expect(items[2].open).toBe(false);
  },
};

// ─────────────────────────────────────────────────
// 3. DISABLED
// ─────────────────────────────────────────────────

/**
 * Accordion with the `disabled` attribute. All items are non-interactive.
 * The disabled state is propagated from the parent accordion to all child items.
 */
export const Disabled: Story = {
  args: {
    multiple: false,
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');

    await expect(accordion).toBeTruthy();
    await expect(accordion?.disabled).toBe(true);

    // Allow time for disabled state to propagate to children
    await new Promise((r) => setTimeout(r, 50));

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    for (const item of items) {
      await expect(item.disabled).toBe(true);
    }
  },
};

// ─────────────────────────────────────────────────
// 4. WITH SLOTTED HEADINGS
// ─────────────────────────────────────────────────

/**
 * Uses the `heading` slot on each item to provide rich HTML content in the trigger.
 * This example shows headings that include a status badge alongside the label text.
 */
export const WithSlottedHeadings: Story = {
  render: () => html`
    <hx-accordion>
      <hx-accordion-item open>
        <span
          slot="heading"
          style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;"
        >
          Patient Information
          <span
            style="
              font-size: 0.6875rem;
              font-weight: 700;
              padding: 0.125rem 0.5rem;
              border-radius: 9999px;
              background: #dcfce7;
              color: #15803d;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            "
          >
            Complete
          </span>
        </span>
        <p style="margin: 0;">
          Patient details including demographics, contact information, and primary care provider
          have all been verified and recorded.
        </p>
      </hx-accordion-item>

      <hx-accordion-item>
        <span
          slot="heading"
          style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;"
        >
          Insurance Verification
          <span
            style="
              font-size: 0.6875rem;
              font-weight: 700;
              padding: 0.125rem 0.5rem;
              border-radius: 9999px;
              background: #fef9c3;
              color: #854d0e;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            "
          >
            Pending
          </span>
        </span>
        <p style="margin: 0;">
          Insurance eligibility check is in progress. Estimated completion within 2 business days.
        </p>
      </hx-accordion-item>

      <hx-accordion-item>
        <span
          slot="heading"
          style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;"
        >
          Medical History
          <span
            style="
              font-size: 0.6875rem;
              font-weight: 700;
              padding: 0.125rem 0.5rem;
              border-radius: 9999px;
              background: #fee2e2;
              color: #991b1b;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            "
          >
            Action Required
          </span>
        </span>
        <p style="margin: 0;">
          Patient has not yet completed the medical history questionnaire. Please follow up before
          the scheduled appointment.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items.length).toBe(3);

    // Verify slotted heading content is present
    const headingSlots = canvasElement.querySelectorAll('[slot="heading"]');
    await expect(headingSlots.length).toBe(3);

    // Verify each heading contains a badge span
    for (const slotEl of headingSlots) {
      const badge = slotEl.querySelector('span');
      await expect(badge).toBeTruthy();
    }
  },
};

// ─────────────────────────────────────────────────
// 5. CONTROLLED
// ─────────────────────────────────────────────────

/**
 * Demonstrates programmatic open/close control. Buttons outside the accordion
 * toggle items by directly setting the `open` property on each `hx-accordion-item`.
 * Useful for "Expand All / Collapse All" patterns in complex forms.
 */
export const Controlled: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; gap: 0.5rem;">
        <button
          type="button"
          style="
            padding: 0.375rem 0.875rem;
            border: 1px solid #6366f1;
            border-radius: 0.375rem;
            background: #6366f1;
            color: #fff;
            cursor: pointer;
            font-size: 0.875rem;
          "
          @click=${() => {
            const items = document
              .querySelector('#controlled-accordion')
              ?.querySelectorAll('hx-accordion-item');
            items?.forEach((item) => {
              (item as HTMLElement & { open: boolean }).open = true;
            });
          }}
        >
          Expand All
        </button>
        <button
          type="button"
          style="
            padding: 0.375rem 0.875rem;
            border: 1px solid #6366f1;
            border-radius: 0.375rem;
            background: transparent;
            color: #6366f1;
            cursor: pointer;
            font-size: 0.875rem;
          "
          @click=${() => {
            const items = document
              .querySelector('#controlled-accordion')
              ?.querySelectorAll('hx-accordion-item');
            items?.forEach((item) => {
              (item as HTMLElement & { open: boolean }).open = false;
            });
          }}
        >
          Collapse All
        </button>
      </div>

      <hx-accordion id="controlled-accordion" multiple>
        <hx-accordion-item heading="Allergies & Adverse Reactions" open>
          <p style="margin: 0;">
            No known drug allergies. Environmental allergen: seasonal pollen (mild). Last reviewed
            2025-11-14.
          </p>
        </hx-accordion-item>
        <hx-accordion-item heading="Current Medications" open>
          <p style="margin: 0;">
            Metformin 500mg — twice daily with meals. Lisinopril 10mg — once daily in the morning.
            Last reconciled 2025-12-01.
          </p>
        </hx-accordion-item>
        <hx-accordion-item heading="Recent Procedures">
          <p style="margin: 0;">
            Routine colonoscopy (2025-09-22) — no polyps detected. Follow-up in 10 years per
            standard guidelines.
          </p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');
    await expect(accordion).toBeTruthy();
    await expect(accordion?.multiple).toBe(true);

    const [expandBtn, collapseBtn] = canvasElement.querySelectorAll('button');

    // Initially two items open
    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items[0].open).toBe(true);
    await expect(items[1].open).toBe(true);
    await expect(items[2].open).toBe(false);

    // Click Collapse All
    await userEvent.click(collapseBtn);
    await new Promise((r) => setTimeout(r, 50));
    for (const item of items) {
      await expect(item.open).toBe(false);
    }

    // Click Expand All
    await userEvent.click(expandBtn);
    await new Promise((r) => setTimeout(r, 50));
    for (const item of items) {
      await expect(item.open).toBe(true);
    }
  },
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE EXAMPLE
// ─────────────────────────────────────────────────

/**
 * Realistic healthcare FAQ accordion. Demonstrates the component in the context
 * of a patient portal or clinical intake form with realistic medical content.
 * Uses single-open mode so only one section is visible at a time.
 */
export const HealthcareExample: Story = {
  render: () => html`
    <div style="max-width: 680px;">
      <h2 style="margin: 0 0 1rem; font-size: 1.125rem; font-weight: 600; color: #111827;">
        Patient Intake — Frequently Asked Questions
      </h2>
      <hx-accordion>
        <hx-accordion-item heading="What do I need to bring to my appointment?" open>
          <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.6;">
            <li>Government-issued photo ID</li>
            <li>Insurance card(s) — primary and secondary if applicable</li>
            <li>List of current medications, including over-the-counter supplements</li>
            <li>Referral letter from your primary care provider (if required by your plan)</li>
            <li>Completed new patient forms (available in the patient portal)</li>
          </ul>
        </hx-accordion-item>

        <hx-accordion-item heading="How do I verify my insurance coverage?">
          <p style="margin: 0 0 0.75rem;">
            Insurance eligibility is verified electronically before your appointment. You will
            receive a notification in the patient portal with your estimated cost-share and any
            prior authorization requirements.
          </p>
          <p style="margin: 0;">
            If you have questions about your specific plan benefits, contact member services at the
            number on the back of your insurance card.
          </p>
        </hx-accordion-item>

        <hx-accordion-item heading="How is my medical history kept confidential?">
          <p style="margin: 0 0 0.75rem;">
            All patient information is protected under HIPAA. Access to your electronic health
            record (EHR) is restricted to authorized clinical and administrative staff directly
            involved in your care.
          </p>
          <p style="margin: 0;">
            You may request a copy of your records or an accounting of disclosures at any time
            through the medical records department or your patient portal.
          </p>
        </hx-accordion-item>

        <hx-accordion-item heading="What should I do in a medical emergency?">
          <p style="margin: 0 0 0.75rem; font-weight: 600; color: #b91c1c;">
            If you are experiencing a life-threatening emergency, call 911 immediately.
          </p>
          <p style="margin: 0;">
            For urgent but non-life-threatening concerns after hours, contact our nurse triage
            line at 1-800-555-0199. Triage nurses are available 24 hours a day, 7 days a week.
          </p>
        </hx-accordion-item>

        <hx-accordion-item heading="How do I request prescription refills?">
          <p style="margin: 0 0 0.75rem;">
            Prescription refills can be requested through the patient portal under
            <strong>Medications &gt; Request Refill</strong>, or by contacting your pharmacy
            directly. Allow 3–5 business days for processing.
          </p>
          <p style="margin: 0;">
            Controlled substances require an in-person visit and cannot be refilled via the portal
            per state and federal regulations.
          </p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');
    await expect(accordion).toBeTruthy();
    await expect(accordion?.multiple).toBe(false);

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items.length).toBe(5);

    // First item open by default
    await expect(items[0].open).toBe(true);

    // Clicking the second item should open it and close the first (single mode)
    const secondTrigger = items[1].shadowRoot?.querySelector<HTMLButtonElement>('.trigger');
    await expect(secondTrigger).toBeTruthy();
    if (secondTrigger) {
      await userEvent.click(secondTrigger);
      await new Promise((r) => setTimeout(r, 50));
      await expect(items[1].open).toBe(true);
      await expect(items[0].open).toBe(false);
    }
  },
};
