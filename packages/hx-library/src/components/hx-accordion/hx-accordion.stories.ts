import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-accordion.js';
import './hx-accordion-item.js';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Accordion',
  component: 'hx-accordion',
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'multi'],
      description:
        'Expand mode. In single mode only one item can be open at a time. In multi mode any number of items can be open.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'single' },
        type: { summary: "'single' | 'multi'" },
      },
    },
  },
  args: {
    mode: 'single',
  },
  render: (args) => html`
    <hx-accordion mode=${args.mode} style="max-width: 600px;">
      <hx-accordion-item item-id="item-1">
        <span slot="trigger">What are the clinic hours?</span>
        <p>The clinic is open Monday through Friday, 8:00 AM to 6:00 PM, and Saturday 9:00 AM to 1:00 PM. We are closed on Sundays and major holidays.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="item-2">
        <span slot="trigger">How do I request a prescription refill?</span>
        <p>Prescription refills can be requested through the patient portal, by calling our pharmacy line at (555) 867-5309, or by asking your provider during your next scheduled visit.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="item-3">
        <span slot="trigger">What insurance plans are accepted?</span>
        <p>We accept most major insurance plans including Medicare, Medicaid, Blue Cross Blue Shield, Aetna, UnitedHealth, and Cigna. Please contact our billing department to verify your specific plan coverage.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <hx-accordion mode=${args.mode} style="max-width: 600px;">
      <hx-accordion-item item-id="item-1">
        <span slot="trigger">What are the clinic hours?</span>
        <p>The clinic is open Monday through Friday, 8:00 AM to 6:00 PM, and Saturday 9:00 AM to 1:00 PM. We are closed on Sundays and major holidays.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="item-2">
        <span slot="trigger">How do I request a prescription refill?</span>
        <p>Prescription refills can be requested through the patient portal, by calling our pharmacy line at (555) 867-5309, or by asking your provider during your next scheduled visit.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="item-3">
        <span slot="trigger">What insurance plans are accepted?</span>
        <p>We accept most major insurance plans including Medicare, Medicaid, Blue Cross Blue Shield, Aetna, UnitedHealth, and Cigna. Please contact our billing department to verify your specific plan coverage.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');
    await expect(accordion).toBeTruthy();
    await expect(accordion?.shadowRoot?.querySelector('.accordion')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. SINGLE MODE
// ─────────────────────────────────────────────────

export const SingleMode: Story = {
  name: 'Mode: Single',
  args: { mode: 'single' },
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;">
        In single mode, opening one item automatically closes any previously open item.
      </p>
      <hx-accordion mode="single">
        <hx-accordion-item item-id="single-1" open>
          <span slot="trigger">Patient Rights &amp; Responsibilities</span>
          <p>Every patient has the right to receive respectful, considerate care that preserves their dignity and autonomy. You may request information about your diagnosis, treatment options, and prognosis in terms you can understand.</p>
        </hx-accordion-item>
        <hx-accordion-item item-id="single-2">
          <span slot="trigger">Privacy &amp; Confidentiality</span>
          <p>Your health information is protected under HIPAA. We will not disclose your information to third parties without your written consent except as required by law or for treatment purposes.</p>
        </hx-accordion-item>
        <hx-accordion-item item-id="single-3">
          <span slot="trigger">Billing &amp; Financial Assistance</span>
          <p>We offer a financial assistance program for patients who qualify based on income. Please contact our billing department to complete a financial assistance application and discuss payment plan options.</p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');
    const items = canvasElement.querySelectorAll('hx-accordion-item');

    await expect(accordion).toBeTruthy();
    await expect(items.length).toBe(3);

    // First item should be open by default
    await expect(items[0]?.hasAttribute('open')).toBe(true);
    await expect(items[1]?.hasAttribute('open')).toBe(false);

    // Click second item trigger
    const secondTrigger = items[1]?.shadowRoot?.querySelector('summary') as HTMLElement;
    if (secondTrigger) {
      secondTrigger.click();
      await new Promise((r) => setTimeout(r, 50));
      // In single mode, first should close, second should open
      await expect(items[0]?.hasAttribute('open')).toBe(false);
      await expect(items[1]?.hasAttribute('open')).toBe(true);
    }
  },
};

// ─────────────────────────────────────────────────
// 3. MULTI MODE
// ─────────────────────────────────────────────────

export const MultiMode: Story = {
  name: 'Mode: Multi',
  args: { mode: 'multi' },
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;">
        In multi mode, multiple items can be open simultaneously.
      </p>
      <hx-accordion mode="multi">
        <hx-accordion-item item-id="multi-1" open>
          <span slot="trigger">Current Medications</span>
          <div>
            <ul>
              <li>Metoprolol succinate 50 mg — once daily</li>
              <li>Lisinopril 10 mg — once daily</li>
              <li>Atorvastatin 40 mg — once daily at bedtime</li>
            </ul>
          </div>
        </hx-accordion-item>
        <hx-accordion-item item-id="multi-2" open>
          <span slot="trigger">Known Allergies</span>
          <div>
            <ul>
              <li><strong>Penicillin</strong> — anaphylaxis (severe)</li>
              <li><strong>Sulfa drugs</strong> — rash (moderate)</li>
            </ul>
          </div>
        </hx-accordion-item>
        <hx-accordion-item item-id="multi-3">
          <span slot="trigger">Recent Lab Results</span>
          <div>
            <p>CBC (2026-02-14): Within normal limits. HbA1c (2026-01-30): 6.8% (controlled).</p>
          </div>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');

    // Both first and second items should start open
    await expect(items[0]?.hasAttribute('open')).toBe(true);
    await expect(items[1]?.hasAttribute('open')).toBe(true);
    await expect(items[2]?.hasAttribute('open')).toBe(false);

    // Click third item trigger
    const thirdTrigger = items[2]?.shadowRoot?.querySelector('summary') as HTMLElement;
    if (thirdTrigger) {
      thirdTrigger.click();
      await new Promise((r) => setTimeout(r, 50));
      // In multi mode, first and second should remain open
      await expect(items[0]?.hasAttribute('open')).toBe(true);
      await expect(items[1]?.hasAttribute('open')).toBe(true);
      await expect(items[2]?.hasAttribute('open')).toBe(true);
    }
  },
};

// ─────────────────────────────────────────────────
// 4. WITH DISABLED ITEM
// ─────────────────────────────────────────────────

export const WithDisabledItem: Story = {
  name: 'With Disabled Item',
  render: () => html`
    <hx-accordion mode="single" style="max-width: 600px;">
      <hx-accordion-item item-id="dis-1" open>
        <span slot="trigger">General Appointment Information</span>
        <p>Appointments can be scheduled online, by phone, or in person. Please arrive 15 minutes early to complete check-in paperwork.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="dis-2" disabled>
        <span slot="trigger">Restricted: Provider-Only Content (Disabled)</span>
        <p>This section requires provider-level access. Contact your system administrator to request elevated permissions.</p>
      </hx-accordion-item>
      <hx-accordion-item item-id="dis-3">
        <span slot="trigger">Emergency Contact Information</span>
        <p>In case of a medical emergency, call 911 immediately. For urgent but non-emergency situations, contact our after-hours nurse line at (555) 123-4567.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');
    const disabledItem = items[1];
    await expect(disabledItem?.hasAttribute('disabled')).toBe(true);

    const disabledTrigger = disabledItem?.shadowRoot?.querySelector('summary') as HTMLElement;
    if (disabledTrigger) {
      await expect(disabledTrigger.getAttribute('aria-disabled')).toBe('true');
      // Clicking disabled trigger should not open it
      disabledTrigger.click();
      await new Promise((r) => setTimeout(r, 50));
      await expect(disabledItem?.hasAttribute('open')).toBe(false);
    }
  },
};

// ─────────────────────────────────────────────────
// 5. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Keyboard Navigation',
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-size: 0.875rem; color: var(--hx-color-neutral-600, #495057); margin-bottom: 1rem;">
        Use <strong>Enter</strong> or <strong>Space</strong> to toggle items.
        Use <strong>Arrow Up/Down</strong> to navigate between items.
      </p>
      <hx-accordion mode="single">
        <hx-accordion-item item-id="kb-1">
          <span slot="trigger">Keyboard: Item 1 — Medication Administration</span>
          <p>All medications must be administered as prescribed. Report any adverse reactions to the charge nurse immediately.</p>
        </hx-accordion-item>
        <hx-accordion-item item-id="kb-2">
          <span slot="trigger">Keyboard: Item 2 — Vital Signs Protocol</span>
          <p>Vital signs should be recorded every 4 hours for general med/surg patients, every 2 hours for step-down, and continuously for ICU patients.</p>
        </hx-accordion-item>
        <hx-accordion-item item-id="kb-3">
          <span slot="trigger">Keyboard: Item 3 — Documentation Requirements</span>
          <p>All clinical documentation must be completed within 4 hours of patient encounter. Use only approved abbreviations listed in the clinical reference guide.</p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');
    const firstTrigger = items[0]?.shadowRoot?.querySelector('summary') as HTMLElement;

    if (firstTrigger) {
      firstTrigger.focus();
      await expect(firstTrigger).toHaveFocus();

      // Press Enter to open
      await userEvent.keyboard('{Enter}');
      await new Promise((r) => setTimeout(r, 50));
      await expect(items[0]?.hasAttribute('open')).toBe(true);

      // Press Space to close
      await userEvent.keyboard(' ');
      await new Promise((r) => setTimeout(r, 50));
      await expect(items[0]?.hasAttribute('open')).toBe(false);
    }
  },
};

// ─────────────────────────────────────────────────
// 6. ALL VARIANTS (initially open states)
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 700px;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          Single Mode — Collapsed (default)
        </h3>
        <hx-accordion mode="single">
          <hx-accordion-item item-id="v1-1">
            <span slot="trigger">Facility Visitor Policy</span>
            <p>Visitors are welcome during designated hours. No more than two visitors per patient at a time. Children under 12 must be accompanied by an adult.</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v1-2">
            <span slot="trigger">Discharge Planning</span>
            <p>Discharge planning begins upon admission. Social work and case management will coordinate post-discharge services, transportation, and follow-up appointments.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          Single Mode — First Item Open
        </h3>
        <hx-accordion mode="single">
          <hx-accordion-item item-id="v2-1" open>
            <span slot="trigger">Pre-operative Instructions</span>
            <p>Do not eat or drink anything after midnight before your surgery. Shower with antibacterial soap the night before and the morning of. Remove all nail polish and jewelry.</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v2-2">
            <span slot="trigger">Post-operative Care</span>
            <p>Follow all wound care instructions provided at discharge. Return to the emergency department immediately if you experience fever above 101.5°F, increased redness, or drainage from the wound site.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          Multi Mode — Multiple Open
        </h3>
        <hx-accordion mode="multi">
          <hx-accordion-item item-id="v3-1" open>
            <span slot="trigger">Blood Pressure Log</span>
            <p>Morning: 128/82 | Afternoon: 132/78 | Evening: 126/80</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v3-2" open>
            <span slot="trigger">Blood Glucose Log</span>
            <p>Fasting: 98 mg/dL | 2hr post-meal: 142 mg/dL | Bedtime: 110 mg/dL</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v3-3">
            <span slot="trigger">Weight &amp; BMI</span>
            <p>Current weight: 182 lbs | BMI: 27.4 | Target weight: 175 lbs</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          With Disabled Item
        </h3>
        <hx-accordion mode="single">
          <hx-accordion-item item-id="v4-1">
            <span slot="trigger">General Information</span>
            <p>Standard clinical information accessible to all authorized staff.</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v4-2" disabled>
            <span slot="trigger">Restricted: Administrative Override (Disabled)</span>
            <p>This content is not accessible at your current permission level.</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="v4-3">
            <span slot="trigger">Care Plan Summary</span>
            <p>Care plan established 2026-02-01. Next review scheduled for 2026-03-01.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. HEALTHCARE FAQ (Kitchen Sink)
// ─────────────────────────────────────────────────

const expandHandler = fn();
const collapseHandler = fn();

export const HealthcareFAQ: Story = {
  name: 'Healthcare FAQ (Kitchen Sink)',
  render: () => html`
    <div style="max-width: 700px;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0 0 0.5rem;">
        Patient Frequently Asked Questions
      </h2>
      <p style="color: var(--hx-color-neutral-600, #495057); margin: 0 0 1.5rem; font-size: 0.9375rem;">
        Find answers to common questions about your care, appointments, and services.
      </p>

      <hx-accordion mode="single" @hx-expand=${expandHandler} @hx-collapse=${collapseHandler}>
        <hx-accordion-item item-id="faq-1">
          <span slot="trigger">How do I access my medical records?</span>
          <div>
            <p>You can access your medical records through several channels:</p>
            <ul>
              <li>Online via the patient portal at myhealth.example.com</li>
              <li>By submitting a written request to our Medical Records department</li>
              <li>In person at the Medical Records office, Monday–Friday 8 AM–4 PM</li>
            </ul>
            <p>Records are typically available within 5–7 business days. Expedited requests for active care coordination may be processed within 24 hours.</p>
          </div>
        </hx-accordion-item>

        <hx-accordion-item item-id="faq-2">
          <span slot="trigger">What should I bring to my appointment?</span>
          <div>
            <p>Please bring the following to every appointment:</p>
            <ul>
              <li>Valid government-issued photo ID</li>
              <li>Current insurance card(s)</li>
              <li>List of all current medications, including supplements and over-the-counter drugs</li>
              <li>Names and contact information for your other healthcare providers</li>
              <li>Any referral forms required by your insurance plan</li>
            </ul>
          </div>
        </hx-accordion-item>

        <hx-accordion-item item-id="faq-3">
          <span slot="trigger">How do I prepare for a procedure or surgery?</span>
          <div>
            <p>Preparation instructions vary by procedure. You will receive specific instructions from your care team. General guidelines include:</p>
            <ul>
              <li>Follow all dietary restrictions (NPO status if applicable)</li>
              <li>Continue taking prescribed medications unless instructed otherwise</li>
              <li>Arrange for a responsible adult to drive you home after sedation</li>
              <li>Wear comfortable, loose-fitting clothing</li>
            </ul>
            <p>Contact us at (555) 234-5678 if you have questions about your specific preparation instructions.</p>
          </div>
        </hx-accordion-item>

        <hx-accordion-item item-id="faq-4">
          <span slot="trigger">What is the grievance and complaint process?</span>
          <div>
            <p>We take all patient concerns seriously. To file a grievance:</p>
            <ol>
              <li>Speak with your nurse or charge nurse first</li>
              <li>Contact Patient Relations at (555) 345-6789 or patient.relations@example.com</li>
              <li>Submit a written complaint to the Patient Relations Office</li>
            </ol>
            <p>All grievances are acknowledged within 24 hours and resolved within 30 calendar days. You may also contact The Joint Commission at (800) 994-6610.</p>
          </div>
        </hx-accordion-item>

        <hx-accordion-item item-id="faq-5" disabled>
          <span slot="trigger">Provider Directory (Temporarily Unavailable)</span>
          <p>The provider directory is currently undergoing maintenance. Please call our scheduling line at (555) 456-7890 for provider availability.</p>
        </hx-accordion-item>

        <hx-accordion-item item-id="faq-6">
          <span slot="trigger">How is my health information protected?</span>
          <div>
            <p>Your health information is protected under the Health Insurance Portability and Accountability Act (HIPAA). We are committed to:</p>
            <ul>
              <li>Using your information only for treatment, payment, and healthcare operations</li>
              <li>Protecting electronic health information with industry-standard encryption</li>
              <li>Training all staff on privacy and security requirements</li>
              <li>Providing you with a copy of our Notice of Privacy Practices upon request</li>
            </ul>
            <p>To report a suspected privacy violation, contact our Privacy Officer at privacy@example.com.</p>
          </div>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
  play: async ({ canvasElement }) => {
    expandHandler.mockClear();
    collapseHandler.mockClear();

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items.length).toBe(6);

    // Open first item
    const firstTrigger = items[0]?.shadowRoot?.querySelector('summary') as HTMLElement;
    if (firstTrigger) {
      firstTrigger.click();
      await new Promise((r) => setTimeout(r, 100));
      await expect(expandHandler).toHaveBeenCalledTimes(1);
      await expect(items[0]?.hasAttribute('open')).toBe(true);

      // Open second item — first should close in single mode
      const secondTrigger = items[1]?.shadowRoot?.querySelector('summary') as HTMLElement;
      secondTrigger?.click();
      await new Promise((r) => setTimeout(r, 100));

      await expect(items[0]?.hasAttribute('open')).toBe(false);
      await expect(items[1]?.hasAttribute('open')).toBe(true);

      // Disabled item should not open
      const disabledTrigger = items[4]?.shadowRoot?.querySelector('summary') as HTMLElement;
      disabledTrigger?.click();
      await new Promise((r) => setTimeout(r, 50));
      await expect(items[4]?.hasAttribute('open')).toBe(false);
    }
  },
};

// ─────────────────────────────────────────────────
// 8. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 600px;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">Default Styling</h3>
        <hx-accordion mode="single">
          <hx-accordion-item item-id="css-default-1" open>
            <span slot="trigger">Standard accordion item</span>
            <p>This item uses all default design token values.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">Themed with Custom Properties</h3>
        <hx-accordion
          mode="single"
          style="
            --hx-accordion-item-border-color: #2563eb;
            --hx-accordion-trigger-bg: #eff6ff;
            --hx-accordion-trigger-bg-hover: #dbeafe;
            --hx-accordion-trigger-color: #1e40af;
            --hx-accordion-content-bg: #f8faff;
            --hx-accordion-content-padding: 1.5rem;
            --hx-accordion-icon-color: #2563eb;
            --hx-accordion-border-radius: 0.5rem;
          "
        >
          <hx-accordion-item item-id="css-themed-1" open>
            <span slot="trigger">Themed accordion item (all custom properties set)</span>
            <p>This item overrides all eight CSS custom properties to demonstrate the complete theming surface available to consumers of this component.</p>
          </hx-accordion-item>
          <hx-accordion-item item-id="css-themed-2">
            <span slot="trigger">Second themed item</span>
            <p>Theming is applied at the accordion container level and inherited by all child items.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Custom Properties Reference
        </summary>
        <pre style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;">
hx-accordion {
  /* Item border color */
  --hx-accordion-item-border-color: var(--hx-color-neutral-200);

  /* Trigger background */
  --hx-accordion-trigger-bg: var(--hx-color-neutral-0);

  /* Trigger hover background */
  --hx-accordion-trigger-bg-hover: var(--hx-color-neutral-50);

  /* Trigger text color */
  --hx-accordion-trigger-color: var(--hx-color-neutral-800);

  /* Content panel background */
  --hx-accordion-content-bg: var(--hx-color-neutral-0);

  /* Content padding */
  --hx-accordion-content-padding: var(--hx-space-5);

  /* Chevron icon color */
  --hx-accordion-icon-color: var(--hx-color-neutral-500);

  /* Item border radius */
  --hx-accordion-border-radius: var(--hx-border-radius-md);
}</pre>
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-accordion-item::part(item) {
        border: 2px dashed #6366f1;
      }
      .parts-demo hx-accordion-item::part(trigger) {
        background: #ede9fe;
        color: #4338ca;
      }
      .parts-demo hx-accordion-item::part(icon) {
        color: #6366f1;
      }
      .parts-demo hx-accordion-item::part(content) {
        background: #faf5ff;
      }
    </style>
    <div style="max-width: 600px;">
      <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
        All CSS Parts Styled Externally
      </h3>
      <hx-accordion class="parts-demo" mode="single">
        <hx-accordion-item item-id="parts-1" open>
          <span slot="trigger">::part(trigger) — custom background applied</span>
          <p>::part(content) — custom background applied to this content panel.</p>
        </hx-accordion-item>
        <hx-accordion-item item-id="parts-2">
          <span slot="trigger">::part(item) — dashed purple border around entire item</span>
          <p>The ::part(icon) chevron is also styled with a purple color.</p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
};
