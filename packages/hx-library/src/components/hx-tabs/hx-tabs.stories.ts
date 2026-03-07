import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-tabs.js';
import './hx-tab.js';
import './hx-tab-panel.js';

// ─────────────────────────────────────────────────
//  Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Tabs',
  component: 'hx-tabs',
  subcomponents: { 'hx-tab': 'hx-tab', 'hx-tab-panel': 'hx-tab-panel' },
  tags: ['autodocs'],
  argTypes: {
    // ── Properties ──
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The layout orientation of the tabs.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'horizontal'" },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    activation: {
      control: { type: 'select' },
      options: ['automatic', 'manual'],
      description:
        'Controls how keyboard navigation activates tabs. In `automatic` mode, focus also activates the tab. In `manual` mode, focus moves independently; Space or Enter activates.',
      table: {
        category: 'Properties',
        defaultValue: { summary: "'automatic'" },
        type: { summary: "'automatic' | 'manual'" },
      },
    },
    // ── Events ──
    'hx-tab-change': {
      description:
        'Dispatched when the active tab changes. Detail: `{ tabId: string, index: number }`.',
      table: {
        category: 'Events',
        type: { summary: 'CustomEvent<{ tabId: string; index: number }>' },
      },
    },
    // ── Slots ──
    tabSlot: {
      name: 'tab',
      description: 'Slot for `<hx-tab>` elements. Rendered inside the tablist.',
      table: {
        category: 'Slots',
        type: { summary: 'hx-tab' },
      },
      control: false,
    },
    defaultSlot: {
      name: '',
      description: 'Default slot for `<hx-tab-panel>` elements.',
      table: {
        category: 'Slots',
        type: { summary: 'hx-tab-panel' },
      },
      control: false,
    },
    // ── CSS Custom Properties ──
    '--hx-tabs-border-color': {
      description: 'Tablist border color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-200, #e9ecef)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-border-width': {
      description: 'Tablist border width.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: '1px' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-tabs-vertical-width': {
      description: 'Width of the tablist in vertical orientation.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: '12rem' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-tabs-tab-color': {
      description: 'Inactive tab text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-600, #495057)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-tab-active-color': {
      description: 'Active tab text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-primary-600, #1d4ed8)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-tab-hover-color': {
      description: 'Tab hover text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-800, #212529)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-tab-hover-bg': {
      description: 'Tab hover background.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-50, #f8f9fa)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-indicator-color': {
      description: 'Active tab indicator color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-primary-500, #2563eb)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    '--hx-tabs-indicator-size': {
      description: 'Active tab indicator thickness.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: '2px' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-tabs-panel-padding': {
      description: 'Panel inner padding.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-space-4, 1rem)' },
        type: { summary: 'CSS length' },
      },
      control: false,
    },
    '--hx-tabs-panel-color': {
      description: 'Panel text color.',
      table: {
        category: 'CSS Custom Properties',
        defaultValue: { summary: 'var(--hx-color-neutral-700, #343a40)' },
        type: { summary: 'CSS color' },
      },
      control: false,
    },
    // ── CSS Parts ──
    tablist: {
      description: 'The tablist container element.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(tablist)' },
      },
      control: false,
    },
    panels: {
      description: 'The panel content container element.',
      table: {
        category: 'CSS Parts',
        type: { summary: '::part(panels)' },
      },
      control: false,
    },
    tabPart: {
      description: 'The underlying button element on each `<hx-tab>`.',
      table: {
        category: 'CSS Parts',
        type: { summary: 'hx-tab::part(tab)' },
      },
      control: false,
    },
    panelPart: {
      description: 'The panel content wrapper on each `<hx-tab-panel>`.',
      table: {
        category: 'CSS Parts',
        type: { summary: 'hx-tab-panel::part(panel)' },
      },
      control: false,
    },
  },
  args: {
    orientation: 'horizontal',
    activation: 'automatic',
  },
  render: (args) => html`
    <hx-tabs orientation=${args.orientation} activation=${args.activation}>
      <hx-tab slot="tab" panel="tab1">Overview</hx-tab>
      <hx-tab slot="tab" panel="tab2">Details</hx-tab>
      <hx-tab slot="tab" panel="tab3">History</hx-tab>
      <hx-tab-panel name="tab1">
        <p>Overview panel content.</p>
      </hx-tab-panel>
      <hx-tab-panel name="tab2">
        <p>Details panel content.</p>
      </hx-tab-panel>
      <hx-tab-panel name="tab3">
        <p>History panel content.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
//  1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => html`
    <hx-tabs>
      <hx-tab slot="tab" panel="overview">Overview</hx-tab>
      <hx-tab slot="tab" panel="details">Details</hx-tab>
      <hx-tab slot="tab" panel="history">History</hx-tab>
      <hx-tab-panel name="overview">
        <p>Overview panel: summary information is displayed here.</p>
      </hx-tab-panel>
      <hx-tab-panel name="details">
        <p>Details panel: extended information and attributes are displayed here.</p>
      </hx-tab-panel>
      <hx-tab-panel name="history">
        <p>History panel: past records and audit trail are displayed here.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = canvasElement.querySelectorAll('hx-tabs');
    await expect(tabs.length).toBe(1);

    const tabEls = canvasElement.querySelectorAll('hx-tab');
    await expect(tabEls.length).toBe(3);

    // First tab should be selected by default
    await expect(tabEls[0].hasAttribute('selected')).toBeTruthy();

    // First panel should be visible; others should be hidden
    const panels = canvasElement.querySelectorAll('hx-tab-panel');
    await expect(panels[0].hasAttribute('hidden')).toBeFalsy();
    await expect(panels[1].hasAttribute('hidden')).toBeTruthy();
    await expect(panels[2].hasAttribute('hidden')).toBeTruthy();

    // Click the second tab and verify panel switches
    await userEvent.click(tabEls[1]);
    await new Promise((r) => setTimeout(r, 50));
    await expect(panels[0].hasAttribute('hidden')).toBeTruthy();
    await expect(panels[1].hasAttribute('hidden')).toBeFalsy();
  },
};

// ─────────────────────────────────────────────────
//  2. VERTICAL ORIENTATION
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => html`
    <hx-tabs orientation=${args.orientation}>
      <hx-tab slot="tab" panel="summary">Summary</hx-tab>
      <hx-tab slot="tab" panel="labs">Lab Results</hx-tab>
      <hx-tab slot="tab" panel="imaging">Imaging</hx-tab>
      <hx-tab-panel name="summary">
        <p>Summary panel: key patient metrics and status indicators.</p>
      </hx-tab-panel>
      <hx-tab-panel name="labs">
        <p>Lab Results panel: complete blood count, metabolic panels, and other ordered labs.</p>
      </hx-tab-panel>
      <hx-tab-panel name="imaging">
        <p>Imaging panel: radiology reports and DICOM study references.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const tabsEl = canvasElement.querySelector('hx-tabs');
    if (!tabsEl) throw new Error('hx-tabs element not found');
    await expect(tabsEl.getAttribute('orientation')).toBe('vertical');
  },
};

// ─────────────────────────────────────────────────
//  3. MANUAL ACTIVATION
// ─────────────────────────────────────────────────

export const ManualActivation: Story = {
  args: {
    activation: 'manual',
  },
  render: (args) => html`
    <div>
      <p style="margin-bottom: 1rem; font-size: 0.875rem; color: #6c757d;">
        In manual activation mode, arrow keys move focus without activating tabs. Press Space or
        Enter to activate the focused tab.
      </p>
      <hx-tabs activation=${args.activation}>
        <hx-tab slot="tab" panel="alerts">Alerts</hx-tab>
        <hx-tab slot="tab" panel="orders">Orders</hx-tab>
        <hx-tab slot="tab" panel="results">Results</hx-tab>
        <hx-tab-panel name="alerts">
          <p>Alerts panel: active clinical alerts and notifications requiring attention.</p>
        </hx-tab-panel>
        <hx-tab-panel name="orders">
          <p>Orders panel: pending, active, and completed provider orders.</p>
        </hx-tab-panel>
        <hx-tab-panel name="results">
          <p>Results panel: outstanding and finalized diagnostic results.</p>
        </hx-tab-panel>
      </hx-tabs>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const tabsEl = canvasElement.querySelector('hx-tabs');
    if (!tabsEl) throw new Error('hx-tabs element not found');
    await expect(tabsEl.getAttribute('activation')).toBe('manual');
  },
};

// ─────────────────────────────────────────────────
//  4. WITH DISABLED TAB
// ─────────────────────────────────────────────────

export const WithDisabledTab: Story = {
  render: () => html`
    <hx-tabs>
      <hx-tab slot="tab" panel="active">Active Medications</hx-tab>
      <hx-tab slot="tab" panel="discontinued" disabled>Discontinued</hx-tab>
      <hx-tab slot="tab" panel="allergies">Allergies</hx-tab>
      <hx-tab-panel name="active">
        <p>Active Medications panel: current prescribed and over-the-counter medications.</p>
      </hx-tab-panel>
      <hx-tab-panel name="discontinued">
        <p>Discontinued panel: previously prescribed medications that are no longer active.</p>
      </hx-tab-panel>
      <hx-tab-panel name="allergies">
        <p>Allergies panel: documented drug, food, and environmental allergies.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const disabledTab = canvasElement.querySelector('hx-tab[panel="discontinued"]');
    if (!disabledTab) throw new Error('disabled hx-tab element not found');
    await expect(disabledTab.hasAttribute('disabled')).toBeTruthy();

    // Clicking a disabled tab should not change the active panel
    const panels = canvasElement.querySelectorAll('hx-tab-panel');
    const activePanelBefore = Array.from(panels).find((p) => !p.hasAttribute('hidden'));
    await userEvent.click(disabledTab);
    await new Promise((r) => setTimeout(r, 50));
    const activePanelAfter = Array.from(panels).find((p) => !p.hasAttribute('hidden'));
    await expect(activePanelBefore).toBe(activePanelAfter);
  },
};

// ─────────────────────────────────────────────────
//  5. MANY TABS
// ─────────────────────────────────────────────────

export const ManyTabs: Story = {
  render: () => html`
    <hx-tabs>
      <hx-tab slot="tab" panel="demographics">Demographics</hx-tab>
      <hx-tab slot="tab" panel="insurance">Insurance</hx-tab>
      <hx-tab slot="tab" panel="vitals">Vitals</hx-tab>
      <hx-tab slot="tab" panel="medications">Medications</hx-tab>
      <hx-tab slot="tab" panel="diagnoses">Diagnoses</hx-tab>
      <hx-tab slot="tab" panel="procedures">Procedures</hx-tab>
      <hx-tab slot="tab" panel="labs">Lab Results</hx-tab>
      <hx-tab slot="tab" panel="imaging">Imaging</hx-tab>
      <hx-tab-panel name="demographics">
        <p>Demographics panel: patient name, date of birth, address, and contact information.</p>
      </hx-tab-panel>
      <hx-tab-panel name="insurance">
        <p>Insurance panel: primary and secondary coverage, authorization, and billing details.</p>
      </hx-tab-panel>
      <hx-tab-panel name="vitals">
        <p>Vitals panel: blood pressure, heart rate, temperature, weight, and height readings.</p>
      </hx-tab-panel>
      <hx-tab-panel name="medications">
        <p>Medications panel: active prescriptions and over-the-counter medication list.</p>
      </hx-tab-panel>
      <hx-tab-panel name="diagnoses">
        <p>Diagnoses panel: active, chronic, and resolved diagnosis codes (ICD-10).</p>
      </hx-tab-panel>
      <hx-tab-panel name="procedures">
        <p>Procedures panel: scheduled, pending, and completed procedure records (CPT).</p>
      </hx-tab-panel>
      <hx-tab-panel name="labs">
        <p>Lab Results panel: ordered, pending, and resulted laboratory studies.</p>
      </hx-tab-panel>
      <hx-tab-panel name="imaging">
        <p>Imaging panel: radiology orders, DICOM references, and interpretation reports.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const tabEls = canvasElement.querySelectorAll('hx-tab');
    await expect(tabEls.length).toBe(8);

    // Navigate to the last tab by clicking it
    const lastTab = tabEls[tabEls.length - 1];
    await userEvent.click(lastTab);
    await new Promise((r) => setTimeout(r, 50));
    await expect(lastTab.hasAttribute('selected')).toBeTruthy();

    const lastPanel = canvasElement.querySelector('hx-tab-panel[name="imaging"]');
    if (!lastPanel) throw new Error('hx-tab-panel[name="imaging"] not found');
    await expect(lastPanel.hasAttribute('hidden')).toBeFalsy();
  },
};

// ─────────────────────────────────────────────────
//  6. HEALTHCARE — PATIENT OVERVIEW
// ─────────────────────────────────────────────────

export const Healthcare: Story = {
  name: 'Healthcare — Patient Overview',
  render: () => html`
    <div style="max-width: 56rem; font-family: system-ui, sans-serif;">
      <header style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0 0 0.25rem; font-size: 1.25rem; font-weight: 600; color: #212529;">
          Jane Doe
        </h2>
        <p style="margin: 0; font-size: 0.875rem; color: #6c757d;">
          MRN: 00123456 &nbsp;|&nbsp; DOB: 04/12/1978 &nbsp;|&nbsp; PCP: Dr. A. Patel
        </p>
      </header>

      <hx-tabs>
        <hx-tab slot="tab" panel="patient-demographics">Demographics</hx-tab>
        <hx-tab slot="tab" panel="patient-vitals">Vitals</hx-tab>
        <hx-tab slot="tab" panel="patient-medications">Medications</hx-tab>
        <hx-tab slot="tab" panel="patient-notes">Clinical Notes</hx-tab>

        <hx-tab-panel name="patient-demographics">
          <dl
            style="display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.5rem; margin: 0;"
          >
            <dt style="font-weight: 600; color: #495057;">Full Name</dt>
            <dd style="margin: 0; color: #212529;">Jane Marie Doe</dd>
            <dt style="font-weight: 600; color: #495057;">Date of Birth</dt>
            <dd style="margin: 0; color: #212529;">April 12, 1978 (Age 47)</dd>
            <dt style="font-weight: 600; color: #495057;">Sex</dt>
            <dd style="margin: 0; color: #212529;">Female</dd>
            <dt style="font-weight: 600; color: #495057;">Address</dt>
            <dd style="margin: 0; color: #212529;">742 Evergreen Terrace, Springfield, IL 62701</dd>
            <dt style="font-weight: 600; color: #495057;">Phone</dt>
            <dd style="margin: 0; color: #212529;">(555) 867-5309</dd>
            <dt style="font-weight: 600; color: #495057;">Emergency Contact</dt>
            <dd style="margin: 0; color: #212529;">Homer Doe — (555) 742-0000</dd>
          </dl>
        </hx-tab-panel>

        <hx-tab-panel name="patient-vitals">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid #dee2e6;">
                <th
                  style="text-align: left; padding: 0.5rem 0.75rem; color: #495057; font-weight: 600;"
                >
                  Measurement
                </th>
                <th
                  style="text-align: left; padding: 0.5rem 0.75rem; color: #495057; font-weight: 600;"
                >
                  Value
                </th>
                <th
                  style="text-align: left; padding: 0.5rem 0.75rem; color: #495057; font-weight: 600;"
                >
                  Date
                </th>
                <th
                  style="text-align: left; padding: 0.5rem 0.75rem; color: #495057; font-weight: 600;"
                >
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f3f5;">
                <td style="padding: 0.5rem 0.75rem;">Blood Pressure</td>
                <td style="padding: 0.5rem 0.75rem; font-weight: 500;">118 / 76 mmHg</td>
                <td style="padding: 0.5rem 0.75rem;">2026-03-01</td>
                <td style="padding: 0.5rem 0.75rem;">R. Torres, RN</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f3f5;">
                <td style="padding: 0.5rem 0.75rem;">Heart Rate</td>
                <td style="padding: 0.5rem 0.75rem; font-weight: 500;">72 bpm</td>
                <td style="padding: 0.5rem 0.75rem;">2026-03-01</td>
                <td style="padding: 0.5rem 0.75rem;">R. Torres, RN</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f3f5;">
                <td style="padding: 0.5rem 0.75rem;">Temperature</td>
                <td style="padding: 0.5rem 0.75rem; font-weight: 500;">98.4 °F</td>
                <td style="padding: 0.5rem 0.75rem;">2026-03-01</td>
                <td style="padding: 0.5rem 0.75rem;">R. Torres, RN</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f3f5;">
                <td style="padding: 0.5rem 0.75rem;">Weight</td>
                <td style="padding: 0.5rem 0.75rem; font-weight: 500;">143 lbs (64.9 kg)</td>
                <td style="padding: 0.5rem 0.75rem;">2026-03-01</td>
                <td style="padding: 0.5rem 0.75rem;">R. Torres, RN</td>
              </tr>
              <tr>
                <td style="padding: 0.5rem 0.75rem;">Oxygen Saturation</td>
                <td style="padding: 0.5rem 0.75rem; font-weight: 500;">98%</td>
                <td style="padding: 0.5rem 0.75rem;">2026-03-01</td>
                <td style="padding: 0.5rem 0.75rem;">R. Torres, RN</td>
              </tr>
            </tbody>
          </table>
        </hx-tab-panel>

        <hx-tab-panel name="patient-medications">
          <ul
            style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.75rem;"
          >
            <li
              style="padding: 0.75rem; background: #f8f9fa; border-radius: 0.375rem; border-left: 4px solid #2563eb;"
            >
              <strong style="display: block; color: #212529;">Lisinopril 10 mg</strong>
              <span style="font-size: 0.875rem; color: #6c757d;"
                >Once daily — Hypertension management</span
              >
            </li>
            <li
              style="padding: 0.75rem; background: #f8f9fa; border-radius: 0.375rem; border-left: 4px solid #2563eb;"
            >
              <strong style="display: block; color: #212529;">Metformin 500 mg</strong>
              <span style="font-size: 0.875rem; color: #6c757d;"
                >Twice daily with meals — Type 2 Diabetes</span
              >
            </li>
            <li
              style="padding: 0.75rem; background: #f8f9fa; border-radius: 0.375rem; border-left: 4px solid #2563eb;"
            >
              <strong style="display: block; color: #212529;">Atorvastatin 20 mg</strong>
              <span style="font-size: 0.875rem; color: #6c757d;"
                >Once daily at bedtime — Hypercholesterolemia</span
              >
            </li>
            <li
              style="padding: 0.75rem; background: #fff3cd; border-radius: 0.375rem; border-left: 4px solid #f59e0b;"
            >
              <strong style="display: block; color: #212529;">Penicillin</strong>
              <span style="font-size: 0.875rem; color: #b45309;"
                >ALLERGY — Anaphylaxis. Do not administer.</span
              >
            </li>
          </ul>
        </hx-tab-panel>

        <hx-tab-panel name="patient-notes">
          <article style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="padding: 0.75rem; border: 1px solid #dee2e6; border-radius: 0.375rem;">
              <header style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong style="color: #212529;">Follow-Up Visit — Diabetes Management</strong>
                <time style="font-size: 0.875rem; color: #6c757d;">2026-02-18</time>
              </header>
              <p style="margin: 0; font-size: 0.9rem; color: #343a40; line-height: 1.6;">
                Patient reports improved adherence to dietary guidelines. HbA1c trending down from
                7.8% to 7.2%. Continue current Metformin dose. Follow up in 3 months for repeat
                labs.
              </p>
              <footer style="margin-top: 0.5rem; font-size: 0.8rem; color: #6c757d;">
                Dr. A. Patel, MD
              </footer>
            </div>
            <div style="padding: 0.75rem; border: 1px solid #dee2e6; border-radius: 0.375rem;">
              <header style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong style="color: #212529;">Annual Wellness Exam</strong>
                <time style="font-size: 0.875rem; color: #6c757d;">2025-11-05</time>
              </header>
              <p style="margin: 0; font-size: 0.9rem; color: #343a40; line-height: 1.6;">
                Routine annual exam. All preventive screenings up to date. Mammogram ordered. Flu
                and COVID boosters administered. No new concerns reported by patient.
              </p>
              <footer style="margin-top: 0.5rem; font-size: 0.8rem; color: #6c757d;">
                Dr. A. Patel, MD
              </footer>
            </div>
          </article>
        </hx-tab-panel>
      </hx-tabs>
    </div>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));

    const tabsEl = canvasElement.querySelector('hx-tabs');
    await expect(tabsEl).toBeTruthy();

    const tabEls = canvasElement.querySelectorAll('hx-tab');
    await expect(tabEls.length).toBe(4);

    // Demographics tab should be active by default
    await expect(tabEls[0].hasAttribute('selected')).toBeTruthy();
    const demographicsPanel = canvasElement.querySelector(
      'hx-tab-panel[name="patient-demographics"]',
    );
    if (!demographicsPanel) throw new Error('hx-tab-panel[name="patient-demographics"] not found');
    await expect(demographicsPanel.hasAttribute('hidden')).toBeFalsy();

    // Navigate to Vitals tab
    await userEvent.click(tabEls[1]);
    await new Promise((r) => setTimeout(r, 50));
    await expect(tabEls[1].hasAttribute('selected')).toBeTruthy();
    const vitalsPanel = canvasElement.querySelector('hx-tab-panel[name="patient-vitals"]');
    if (!vitalsPanel) throw new Error('hx-tab-panel[name="patient-vitals"] not found');
    await expect(vitalsPanel.hasAttribute('hidden')).toBeFalsy();
    await expect(demographicsPanel.hasAttribute('hidden')).toBeTruthy();

    // Navigate to Clinical Notes tab
    const notesTab = canvasElement.querySelector('hx-tab[panel="patient-notes"]');
    if (!notesTab) throw new Error('hx-tab[panel="patient-notes"] not found');
    await userEvent.click(notesTab);
    await new Promise((r) => setTimeout(r, 50));
    const notesPanel = canvasElement.querySelector('hx-tab-panel[name="patient-notes"]');
    if (!notesPanel) throw new Error('hx-tab-panel[name="patient-notes"] not found');
    await expect(notesPanel.hasAttribute('hidden')).toBeFalsy();
    await expect(vitalsPanel.hasAttribute('hidden')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
//  7. WITH ICONS (prefix/suffix slots)
// ─────────────────────────────────────────────────

export const WithIcons: Story = {
  name: 'With Icons (prefix/suffix slots)',
  render: () => html`
    <hx-tabs>
      <hx-tab slot="tab" panel="overview">
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
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Overview
      </hx-tab>
      <hx-tab slot="tab" panel="alerts">
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
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Alerts
        <span
          slot="suffix"
          style="display:inline-flex;align-items:center;justify-content:center;background:#dc3545;color:#fff;border-radius:9999px;font-size:0.7rem;font-weight:700;min-width:1.25rem;height:1.25rem;padding:0 0.25rem;"
          >3</span
        >
      </hx-tab>
      <hx-tab slot="tab" panel="documents">
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
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Documents
      </hx-tab>
      <hx-tab-panel name="overview">
        <p>Overview panel: summary information is displayed here.</p>
      </hx-tab-panel>
      <hx-tab-panel name="alerts">
        <p>Alerts panel: 3 active clinical alerts require attention.</p>
      </hx-tab-panel>
      <hx-tab-panel name="documents">
        <p>Documents panel: uploaded forms, consent documents, and referral letters.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));
    const tabs = canvasElement.querySelectorAll('hx-tab');
    await expect(tabs.length).toBe(3);

    // Verify prefix slots are populated
    const alertsTab = canvasElement.querySelector('hx-tab[panel="alerts"]');
    if (!alertsTab) throw new Error('hx-tab[panel="alerts"] not found');
    const prefixSlotContent = alertsTab.querySelector('[slot="prefix"]');
    await expect(prefixSlotContent).toBeTruthy();

    // Verify suffix badge is present on alerts tab
    const suffixBadge = alertsTab.querySelector('[slot="suffix"]');
    await expect(suffixBadge).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
//  8. INTERACTION TEST — TAB CHANGE EVENT
// ─────────────────────────────────────────────────

export const InteractionTest: Story = {
  name: 'Interaction Test — Tab Change Event',
  args: {
    orientation: 'horizontal',
    activation: 'automatic',
  },
  render: (args) => html`
    <hx-tabs orientation=${args.orientation} activation=${args.activation} @hx-tab-change=${fn()}>
      <hx-tab slot="tab" panel="tab1">Appointments</hx-tab>
      <hx-tab slot="tab" panel="tab2">Messages</hx-tab>
      <hx-tab slot="tab" panel="tab3">Documents</hx-tab>
      <hx-tab-panel name="tab1">
        <p>Appointments panel: upcoming and past appointment records.</p>
      </hx-tab-panel>
      <hx-tab-panel name="tab2">
        <p>Messages panel: secure messages between patient and care team.</p>
      </hx-tab-panel>
      <hx-tab-panel name="tab3">
        <p>Documents panel: uploaded forms, consent documents, and referral letters.</p>
      </hx-tab-panel>
    </hx-tabs>
  `,
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 50));

    const tabEls = canvasElement.querySelectorAll('hx-tab');
    const panels = canvasElement.querySelectorAll('hx-tab-panel');

    // Verify initial state
    await expect(tabEls[0].hasAttribute('selected')).toBeTruthy();
    await expect(panels[0].hasAttribute('hidden')).toBeFalsy();
    await expect(panels[1].hasAttribute('hidden')).toBeTruthy();
    await expect(panels[2].hasAttribute('hidden')).toBeTruthy();

    // Click tab 2 — panel 2 should become visible
    await userEvent.click(tabEls[1]);
    await new Promise((r) => setTimeout(r, 50));
    await expect(tabEls[1].hasAttribute('selected')).toBeTruthy();
    await expect(tabEls[0].hasAttribute('selected')).toBeFalsy();
    const panel2 = canvasElement.querySelector('hx-tab-panel[name="tab2"]');
    await expect(panel2).not.toHaveAttribute('hidden');

    // Click tab 3 — panel 3 should become visible
    await userEvent.click(tabEls[2]);
    await new Promise((r) => setTimeout(r, 50));
    await expect(tabEls[2].hasAttribute('selected')).toBeTruthy();
    const panel3 = canvasElement.querySelector('hx-tab-panel[name="tab3"]');
    await expect(panel3).not.toHaveAttribute('hidden');
    await expect(panel2).toHaveAttribute('hidden');
  },
};
