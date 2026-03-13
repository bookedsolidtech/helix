import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-accordion.js';
import './hx-accordion-item.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Accordion',
  component: 'hx-accordion',
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: { type: 'select' },
      options: ['single', 'multi'],
      description:
        "Expansion mode: 'single' collapses others when one expands; 'multi' allows multiple open.",
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
      <hx-accordion-item>
        <span slot="trigger">What is the patient intake process?</span>
        <p>
          Patient intake begins with registration at the front desk. Staff will verify insurance
          information, collect demographic data, and assign a medical record number before directing
          the patient to the appropriate department.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">How do I access lab results?</span>
        <p>
          Lab results are available through the patient portal within 24-48 hours of collection.
          Critical values are communicated directly to the ordering physician via secure message and
          phone notification.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">What are the visiting hours?</span>
        <p>
          General visiting hours are 8:00 AM to 8:00 PM daily. ICU visiting hours are 10:00 AM to
          12:00 PM and 4:00 PM to 6:00 PM. Special arrangements can be made through the nursing
          station for end-of-life care situations.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT (single mode)
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <hx-accordion style="max-width: 600px;">
      <hx-accordion-item>
        <span slot="trigger">What is the patient intake process?</span>
        <p>
          Patient intake begins with registration at the front desk. Staff will verify insurance
          information, collect demographic data, and assign a medical record number.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">How do I access lab results?</span>
        <p>
          Lab results are available through the patient portal within 24-48 hours of collection.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">What are the visiting hours?</span>
        <p>General visiting hours are 8:00 AM to 8:00 PM daily.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('hx-accordion');
    await expect(accordion).toBeTruthy();

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    await expect(items.length).toBe(3);

    // Initially all collapsed
    items.forEach((item) => {
      expect(item.getAttribute('expanded')).toBeNull();
    });
  },
};

// ─────────────────────────────────────────────────
// 2. SINGLE MODE
// ─────────────────────────────────────────────────

export const SingleMode: Story = {
  name: 'Mode: Single',
  render: () => html`
    <hx-accordion mode="single" style="max-width: 600px;">
      <hx-accordion-item expanded>
        <span slot="trigger">Medication Protocols</span>
        <p>
          All medication orders must be verified by a licensed pharmacist before administration.
          Double-check the five rights: patient, drug, dose, route, and time.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Infection Control Guidelines</span>
        <p>
          Hand hygiene must be performed before and after every patient contact. Standard
          precautions apply to all patients regardless of diagnosis.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Emergency Procedures</span>
        <p>
          In case of cardiac arrest, activate the rapid response team immediately by calling the
          emergency line and initiating CPR per current AHA guidelines.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');

    // First item starts expanded
    await expect(items[0].getAttribute('expanded')).not.toBeNull();

    // Click second item trigger
    const secondTrigger = items[1].shadowRoot?.querySelector('summary');
    await expect(secondTrigger).toBeTruthy();
    if (!secondTrigger) return;
    await userEvent.click(secondTrigger);

    // Wait for state update
    await new Promise((r) => setTimeout(r, 50));

    // First should collapse, second should expand (single mode)
    await expect(items[0].getAttribute('expanded')).toBeNull();
    await expect(items[1].getAttribute('expanded')).not.toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 3. MULTI MODE
// ─────────────────────────────────────────────────

export const MultiMode: Story = {
  name: 'Mode: Multi',
  render: () => html`
    <hx-accordion mode="multi" style="max-width: 600px;">
      <hx-accordion-item expanded>
        <span slot="trigger">Patient History</span>
        <p>
          Review the comprehensive patient history including prior admissions, surgical history, and
          chronic condition management plans.
        </p>
      </hx-accordion-item>
      <hx-accordion-item expanded>
        <span slot="trigger">Current Medications</span>
        <p>
          Lisinopril 10mg daily, Metformin 1000mg twice daily, Atorvastatin 40mg nightly. Verify
          allergies before administration.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Upcoming Appointments</span>
        <p>
          Cardiology follow-up: March 15, 2026. Primary care: March 28, 2026. Lab work ordered for
          March 10, 2026.
        </p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');

    // First two items start expanded (multi mode allows this)
    await expect(items[0].getAttribute('expanded')).not.toBeNull();
    await expect(items[1].getAttribute('expanded')).not.toBeNull();
    await expect(items[2].getAttribute('expanded')).toBeNull();

    // Click third item
    const thirdTrigger = items[2].shadowRoot?.querySelector('summary');
    await expect(thirdTrigger).toBeTruthy();
    if (!thirdTrigger) return;
    await userEvent.click(thirdTrigger);
    await new Promise((r) => setTimeout(r, 50));

    // In multi mode, first two remain expanded
    await expect(items[0].getAttribute('expanded')).not.toBeNull();
    await expect(items[1].getAttribute('expanded')).not.toBeNull();
    await expect(items[2].getAttribute('expanded')).not.toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 4. PRE-EXPANDED ITEM
// ─────────────────────────────────────────────────

export const PreExpanded: Story = {
  name: 'Pre-Expanded Item',
  render: () => html`
    <hx-accordion style="max-width: 600px;">
      <hx-accordion-item>
        <span slot="trigger">Closed by Default</span>
        <p>This item starts collapsed.</p>
      </hx-accordion-item>
      <hx-accordion-item expanded>
        <span slot="trigger">Open by Default</span>
        <p>This item starts expanded via the expanded attribute.</p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Also Closed</span>
        <p>This item also starts collapsed.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
};

// ─────────────────────────────────────────────────
// 5. DISABLED ITEM
// ─────────────────────────────────────────────────

export const DisabledItem: Story = {
  name: 'Disabled Item',
  render: () => html`
    <hx-accordion style="max-width: 600px;">
      <hx-accordion-item>
        <span slot="trigger">Available Section</span>
        <p>This section can be expanded normally.</p>
      </hx-accordion-item>
      <hx-accordion-item disabled>
        <span slot="trigger">Restricted Section (Disabled)</span>
        <p>This content is not accessible — the item is disabled.</p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Another Available Section</span>
        <p>This section is also available.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const items = canvasElement.querySelectorAll('hx-accordion-item');
    const disabledItem = items[1];

    await expect(disabledItem.getAttribute('disabled')).not.toBeNull();

    const disabledTrigger = disabledItem.shadowRoot?.querySelector('summary');
    await expect(disabledTrigger).toBeTruthy();
    if (!disabledTrigger) return;
    await userEvent.click(disabledTrigger);
    await new Promise((r) => setTimeout(r, 50));

    // Should remain collapsed
    await expect(disabledItem.getAttribute('expanded')).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 6. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

const keyboardExpandHandler = fn();
const keyboardCollapseHandler = fn();

export const KeyboardNavigation: Story = {
  name: 'Test: Keyboard Navigation',
  render: () => html`
    <hx-accordion
      style="max-width: 600px;"
      @hx-expand=${keyboardExpandHandler}
      @hx-collapse=${keyboardCollapseHandler}
    >
      <hx-accordion-item>
        <span slot="trigger">Press Enter or Space to expand</span>
        <p>Content revealed via keyboard interaction.</p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Second Item</span>
        <p>Second item content.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    keyboardExpandHandler.mockClear();
    keyboardCollapseHandler.mockClear();

    const items = canvasElement.querySelectorAll('hx-accordion-item');
    const firstTrigger = items[0].shadowRoot?.querySelector('summary');

    await expect(firstTrigger).toBeTruthy();
    if (!firstTrigger) return;

    // Focus trigger and press Enter
    firstTrigger.focus();
    await expect(firstTrigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await new Promise((r) => setTimeout(r, 50));

    await expect(keyboardExpandHandler).toHaveBeenCalledTimes(1);
    await expect(items[0].getAttribute('expanded')).not.toBeNull();

    // Press Space to collapse
    await userEvent.keyboard(' ');
    await new Promise((r) => setTimeout(r, 50));

    await expect(keyboardCollapseHandler).toHaveBeenCalledTimes(1);
    await expect(items[0].getAttribute('expanded')).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 7. EVENTS
// ─────────────────────────────────────────────────

const expandEventHandler = fn();
const collapseEventHandler = fn();

export const EventHandling: Story = {
  name: 'Test: Events',
  render: () => html`
    <hx-accordion
      style="max-width: 600px;"
      @hx-expand=${expandEventHandler}
      @hx-collapse=${collapseEventHandler}
    >
      <hx-accordion-item>
        <span slot="trigger">Track expand/collapse events</span>
        <p>Open the Actions panel to see hx-expand and hx-collapse events fire.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    expandEventHandler.mockClear();
    collapseEventHandler.mockClear();

    const item = canvasElement.querySelector('hx-accordion-item');
    const trigger = item?.shadowRoot?.querySelector('summary');
    await expect(trigger).toBeTruthy();
    if (!trigger) return;

    await userEvent.click(trigger);
    await new Promise((r) => setTimeout(r, 50));
    await expect(expandEventHandler).toHaveBeenCalledTimes(1);

    await userEvent.click(trigger);
    await new Promise((r) => setTimeout(r, 50));
    await expect(collapseEventHandler).toHaveBeenCalledTimes(1);
  },
};

// ─────────────────────────────────────────────────
// 8. PROGRESSIVE ENHANCEMENT
// ─────────────────────────────────────────────────

export const ProgressiveEnhancement: Story = {
  name: 'Progressive Enhancement',
  render: () => html`
    <div style="max-width: 600px;">
      <p style="font-size: 0.875rem; color: #6c757d; margin-bottom: 1rem;">
        Each item uses native &lt;details&gt;/&lt;summary&gt; in its shadow DOM. Without JavaScript,
        native browser disclosure behavior still works. With JavaScript, smooth animations and
        single-expand coordination are applied.
      </p>
      <hx-accordion mode="single">
        <hx-accordion-item>
          <span slot="trigger">Informed Consent</span>
          <p>
            All patients must provide informed consent before procedures. Consent forms must be
            signed, witnessed, and placed in the medical record prior to any intervention.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">Privacy Notice (HIPAA)</span>
          <p>
            Protected health information (PHI) is safeguarded under HIPAA. Access is limited to
            authorized personnel on a need-to-know basis only.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">Advance Directives</span>
          <p>
            Patients have the right to provide advance directives including living wills and
            healthcare proxy designations. These must be documented and accessible to care teams.
          </p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-accordion-item::part(item) {
        border-color: #6366f1;
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
        color: #4338ca;
      }
    </style>
    <div class="parts-demo" style="max-width: 600px;">
      <hx-accordion>
        <hx-accordion-item expanded>
          <span slot="trigger">::part(trigger) styled externally</span>
          <p>::part(content) styled externally — demonstrates full CSS parts theming surface.</p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">Second item with same parts styling</span>
          <p>All items in this demo share the same externally applied parts styles.</p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <hx-accordion
      style="
        max-width: 600px;
        --hx-accordion-border-color: #6366f1;
        --hx-accordion-trigger-bg: #f5f3ff;
        --hx-accordion-trigger-hover-bg: #ede9fe;
        --hx-accordion-trigger-color: #4338ca;
        --hx-accordion-icon-color: #6366f1;
        --hx-accordion-content-color: #312e81;
      "
    >
      <hx-accordion-item expanded>
        <span slot="trigger">Custom Themed Accordion</span>
        <p>
          This accordion overrides CSS custom properties to apply a purple theme, demonstrating the
          full theming surface available to consumer applications.
        </p>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Second Themed Item</span>
        <p>The custom properties apply to all items within the accordion.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const FAQSection: Story = {
  name: 'Healthcare: FAQ Section',
  render: () => html`
    <div style="max-width: 700px;">
      <h2 style="margin: 0 0 1.5rem; font-size: 1.5rem; font-weight: 700;">
        Patient Resources — Frequently Asked Questions
      </h2>
      <hx-accordion mode="single">
        <hx-accordion-item>
          <span slot="trigger">How do I prepare for my surgery?</span>
          <p>
            Follow your surgeon's pre-operative instructions carefully. Typically this includes
            fasting for 8 hours before surgery, discontinuing certain medications, and arranging
            transportation home. Contact your surgical team with any questions.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">What should I bring to my appointment?</span>
          <p>
            Bring a government-issued photo ID, your insurance cards, a list of current medications
            including dosages, and any referral paperwork from your primary care physician. Arrive
            15 minutes early for registration.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">How do I request medical records?</span>
          <p>
            Submit a signed Medical Records Release Authorization form to the Health Information
            Management department. Processing takes 5-7 business days. Urgent requests can be
            accommodated with physician authorization.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">What is your billing and payment policy?</span>
          <p>
            We accept most major insurance plans and offer a financial assistance program for
            qualifying patients. Payment plans are available. Contact Patient Financial Services at
            extension 4400 for billing inquiries.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">How do I contact my care team after hours?</span>
          <p>
            For non-urgent questions, use the patient portal secure messaging feature. For urgent
            medical concerns, call our 24-hour nurse advice line. For emergencies, call 911 or go to
            the nearest emergency department.
          </p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
};

export const ClinicalProtocols: Story = {
  name: 'Healthcare: Clinical Protocols',
  render: () => html`
    <div style="max-width: 700px;">
      <h2 style="margin: 0 0 1.5rem; font-size: 1.5rem; font-weight: 700;">
        ICU Clinical Reference Protocols
      </h2>
      <hx-accordion mode="multi">
        <hx-accordion-item expanded>
          <span slot="trigger">Ventilator Management Bundle</span>
          <ul style="margin: 0; padding-left: 1.5rem;">
            <li>Head of bed elevation 30-45 degrees</li>
            <li>Daily sedation interruption and spontaneous breathing trials</li>
            <li>DVT prophylaxis unless contraindicated</li>
            <li>Peptic ulcer disease prophylaxis</li>
            <li>Oral care with chlorhexidine every 4 hours</li>
          </ul>
        </hx-accordion-item>
        <hx-accordion-item expanded>
          <span slot="trigger">Sepsis Recognition Criteria (Sepsis-3)</span>
          <p>
            Sepsis: life-threatening organ dysfunction caused by dysregulated host response to
            infection. SOFA score increase ≥2 from baseline. Quick SOFA (qSOFA): altered mental
            status, respiratory rate ≥22, systolic BP ≤100.
          </p>
        </hx-accordion-item>
        <hx-accordion-item>
          <span slot="trigger">Vasopressor Escalation Protocol</span>
          <p>
            First-line: Norepinephrine 0.01-3 mcg/kg/min. Add vasopressin 0.03 units/min when
            norepinephrine dose exceeds 0.25 mcg/kg/min. Third-line: Epinephrine. Target MAP ≥65
            mmHg.
          </p>
        </hx-accordion-item>
      </hx-accordion>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. ALL COMBINATIONS
// ─────────────────────────────────────────────────

// ─────────────────────────────────────────────────
// 13. NESTED ACCORDIONS
// ─────────────────────────────────────────────────

export const NestedAccordions: Story = {
  name: 'Nested Accordions',
  render: () => html`
    <hx-accordion mode="single" style="max-width: 600px;">
      <hx-accordion-item>
        <span slot="trigger">Clinical Departments</span>
        <div style="padding-top: 0.5rem;">
          <hx-accordion mode="single">
            <hx-accordion-item>
              <span slot="trigger">Cardiology</span>
              <p>Cardiac care unit on the 4th floor. Contact extension 4-2200 for consultations.</p>
            </hx-accordion-item>
            <hx-accordion-item>
              <span slot="trigger">Neurology</span>
              <p>Neurology clinic on the 3rd floor. Accepts referrals Monday through Friday.</p>
            </hx-accordion-item>
            <hx-accordion-item>
              <span slot="trigger">Oncology</span>
              <p>Cancer care center in the south wing. Chemotherapy suite on level 2.</p>
            </hx-accordion-item>
          </hx-accordion>
        </div>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Administrative Services</span>
        <div style="padding-top: 0.5rem;">
          <hx-accordion mode="single">
            <hx-accordion-item>
              <span slot="trigger">Medical Records</span>
              <p>Request records through the patient portal or call extension 2-1400.</p>
            </hx-accordion-item>
            <hx-accordion-item>
              <span slot="trigger">Billing & Insurance</span>
              <p>
                Billing inquiries: Monday–Friday 8 AM to 5 PM. Accepts all major insurance plans.
              </p>
            </hx-accordion-item>
          </hx-accordion>
        </div>
      </hx-accordion-item>
      <hx-accordion-item>
        <span slot="trigger">Patient Resources</span>
        <p>Educational materials, support groups, and discharge planning are available on request.</p>
      </hx-accordion-item>
    </hx-accordion>
  `,
  play: async ({ canvasElement }) => {
    const accordions = canvasElement.querySelectorAll('hx-accordion');
    await expect(accordions.length).toBe(3);

    const outerItems = accordions[0].querySelectorAll(':scope > hx-accordion-item');
    await expect(outerItems.length).toBe(3);
  },
};

// ─────────────────────────────────────────────────
// 14. DYNAMIC ADD / REMOVE
// ─────────────────────────────────────────────────

export const DynamicAddRemove: Story = {
  name: 'Dynamic Add / Remove',
  render: () => {
    let count = 3;

    const addItem = () => {
      count += 1;
      const accordion = document.getElementById('dynamic-accordion');
      if (!accordion) return;
      const item = document.createElement('hx-accordion-item');
      const trigger = document.createElement('span');
      trigger.slot = 'trigger';
      trigger.textContent = `Item ${count}`;
      const content = document.createElement('p');
      content.textContent = `Content for dynamically added item ${count}.`;
      item.appendChild(trigger);
      item.appendChild(content);
      accordion.appendChild(item);
      const counter = document.getElementById('dynamic-count');
      if (counter) counter.textContent = String(accordion.querySelectorAll('hx-accordion-item').length);
    };

    const removeItem = () => {
      const accordion = document.getElementById('dynamic-accordion');
      if (!accordion) return;
      const items = accordion.querySelectorAll('hx-accordion-item');
      if (items.length > 0) items[items.length - 1].remove();
      const counter = document.getElementById('dynamic-count');
      if (counter) counter.textContent = String(accordion.querySelectorAll('hx-accordion-item').length);
    };

    return html`
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 600px;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button
            @click=${addItem}
            style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
          >
            Add Item
          </button>
          <button
            @click=${removeItem}
            style="padding: var(--hx-space-1-5, 0.375rem) var(--hx-space-3, 0.75rem); border: var(--hx-border-width-thin, 1px) solid var(--hx-color-neutral-200, #d1d5db); border-radius: var(--hx-border-radius-md, 0.375rem); background: var(--hx-color-neutral-0, white); cursor: pointer;"
          >
            Remove Last
          </button>
          <span style="font-size: var(--hx-text-sm, 0.875rem); color: var(--hx-color-neutral-500, #6b7280);">
            Items: <strong id="dynamic-count">3</strong>
          </span>
        </div>
        <hx-accordion id="dynamic-accordion" mode="single">
          <hx-accordion-item>
            <span slot="trigger">Item 1</span>
            <p>Content for item 1. Click "Add Item" to append new accordion items dynamically.</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 2</span>
            <p>Content for item 2. Newly added items are appended and participate in single-mode.</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Item 3</span>
            <p>Content for item 3. Click "Remove Last" to remove items from the end.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const accordion = canvasElement.querySelector('#dynamic-accordion');
    await expect(accordion).toBeTruthy();

    const initialItems = accordion?.querySelectorAll('hx-accordion-item');
    await expect(initialItems?.length).toBe(3);

    const addBtn = canvasElement.querySelector<HTMLButtonElement>('button:first-of-type');
    await expect(addBtn).toBeTruthy();
    addBtn?.click();

    const afterAddItems = accordion?.querySelectorAll('hx-accordion-item');
    await expect(afterAddItems?.length).toBe(4);
  },
};

// ─────────────────────────────────────────────────
// 12. ALL COMBINATIONS
// ─────────────────────────────────────────────────

export const AllCombinations: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">
          Single Mode (default)
        </h3>
        <hx-accordion mode="single" style="max-width: 500px;">
          <hx-accordion-item expanded>
            <span slot="trigger">First Item (starts expanded)</span>
            <p>Opening another item will close this one automatically.</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Second Item</span>
            <p>Click to expand — first item will close.</p>
          </hx-accordion-item>
          <hx-accordion-item disabled>
            <span slot="trigger">Third Item (disabled)</span>
            <p>This item cannot be toggled.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>

      <div>
        <h3 style="margin: 0 0 0.75rem; font-size: 1rem; font-weight: 600;">Multi Mode</h3>
        <hx-accordion mode="multi" style="max-width: 500px;">
          <hx-accordion-item expanded>
            <span slot="trigger">First Item (starts expanded)</span>
            <p>Multiple items can be open simultaneously in multi mode.</p>
          </hx-accordion-item>
          <hx-accordion-item expanded>
            <span slot="trigger">Second Item (also expanded)</span>
            <p>Both items can remain open — this is multi mode.</p>
          </hx-accordion-item>
          <hx-accordion-item>
            <span slot="trigger">Third Item (closed)</span>
            <p>This one starts closed but can open without affecting the others.</p>
          </hx-accordion-item>
        </hx-accordion>
      </div>
    </div>
  `,
};
