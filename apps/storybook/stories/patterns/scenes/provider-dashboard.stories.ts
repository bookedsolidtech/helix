import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within } from 'storybook/test';

// Scene composition imports — every component is documented + tested in its own
// Components/* tree. This story exercises layout density: stat tiles, a data
// table, and a card grid as a provider would see them on a daily-shift page.
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-stat';
import '@helixui/library/components/hx-data-table';
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-badge';
import '@helixui/library/components/hx-avatar';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Patterns/Scenes/Provider Dashboard',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Provider-facing dashboard composed from documented hx-* components. ' +
          'Demonstrates layout density: 4-up stat tiles, a sortable patient ' +
          "table, and a card grid for today's appointments. Every visible " +
          'control is a real component — no mock divs.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Sample data — never personally identifying
// ─────────────────────────────────────────────────

const PATIENT_COLUMNS = [
  { key: 'mrn', label: 'MRN', sortable: false },
  { key: 'name', label: 'Patient', sortable: true },
  { key: 'visit', label: 'Visit type', sortable: true },
  { key: 'time', label: 'Time', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

const PATIENT_ROWS = [
  { mrn: 'MRN-849172', name: 'Jordan Reyes', visit: 'Follow-up', time: '8:30 AM', status: 'Checked in' },
  { mrn: 'MRN-203418', name: 'Sam Patel', visit: 'New patient', time: '9:00 AM', status: 'Arrived' },
  { mrn: 'MRN-661205', name: 'Avery Chen', visit: 'Procedure', time: '9:30 AM', status: 'Pre-op' },
  { mrn: 'MRN-118390', name: 'Riley Okafor', visit: 'Follow-up', time: '10:00 AM', status: 'Scheduled' },
  { mrn: 'MRN-955017', name: 'Casey Nguyen', visit: 'Lab review', time: '10:30 AM', status: 'Scheduled' },
];

// ─────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────

const renderDashboard = () => html`
  <div
    style="
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: var(--hx-font-family-sans, system-ui);
    "
  >
    <header
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      "
    >
      <div>
        <h1
          style="
            margin: 0 0 4px;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: var(--hx-color-text-primary);
          "
        >
          Today, May 7
        </h1>
        <p
          style="
            margin: 0;
            font-size: 13px;
            color: var(--hx-color-text-secondary);
            font-family: var(--hx-font-family-mono);
          "
        >
          Dr. Park · Cardiology · Cohort 4
        </p>
      </div>
      <div style="display: flex; gap: 8px;">
        <hx-button variant="ghost" hx-size="sm" data-testid="dashboard-print"
          >Print roster</hx-button
        >
        <hx-button variant="primary" hx-size="sm" data-testid="dashboard-add"
          >+ Add visit</hx-button
        >
      </div>
    </header>

    <div
      data-testid="dashboard-stats"
      style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      "
    >
      <hx-card variant="default" elevation="flat" style="display: block;">
        <div style="padding: 16px;">
          <hx-stat label="Visits today" value="14" trend="up"></hx-stat>
        </div>
      </hx-card>
      <hx-card variant="default" elevation="flat" style="display: block;">
        <div style="padding: 16px;">
          <hx-stat label="Avg wait time" value="8m" trend="down"></hx-stat>
        </div>
      </hx-card>
      <hx-card variant="default" elevation="flat" style="display: block;">
        <div style="padding: 16px;">
          <hx-stat label="Open messages" value="3" trend="neutral"></hx-stat>
        </div>
      </hx-card>
      <hx-card variant="default" elevation="flat" style="display: block;">
        <div style="padding: 16px;">
          <hx-stat label="Labs to review" value="6" trend="up"></hx-stat>
        </div>
      </hx-card>
    </div>

    <hx-card variant="default" elevation="raised" style="display: block;">
      <span slot="heading">Patient roster</span>
      <div style="padding: 4px 0;">
        <hx-data-table
          data-testid="dashboard-roster"
          label="Patient roster for today's clinic"
          .columns=${PATIENT_COLUMNS}
          .rows=${PATIENT_ROWS}
          sort-key="time"
          sort-direction="asc"
        ></hx-data-table>
      </div>
    </hx-card>

    <h2
      style="
        margin: 24px 0 12px;
        font-size: 14px;
        font-family: var(--hx-font-family-mono);
        color: var(--hx-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 600;
      "
    >
      Awaiting your sign-off
    </h2>
    <div
      data-testid="dashboard-cards"
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;"
    >
      <hx-card variant="default" elevation="flat" style="display: block;">
        <span slot="heading">Lab result · TSH</span>
        <div style="padding: 12px 0; font-size: 13px; line-height: 1.5;">
          <p style="margin: 0 0 8px; color: var(--hx-color-text-secondary);">
            Patient MRN-118390 · Drawn yesterday at 4:12 PM. Within reference range.
          </p>
          <hx-button variant="secondary" hx-size="sm" data-testid="card-action-1"
            >Sign off</hx-button
          >
        </div>
      </hx-card>
      <hx-card variant="default" elevation="flat" style="display: block;">
        <span slot="heading">Imaging · ECG</span>
        <div style="padding: 12px 0; font-size: 13px; line-height: 1.5;">
          <p style="margin: 0 0 8px; color: var(--hx-color-text-secondary);">
            Patient MRN-661205 · Sinus rhythm, 72 bpm. Awaiting cardiologist review.
          </p>
          <hx-button variant="secondary" hx-size="sm" data-testid="card-action-2"
            >Sign off</hx-button
          >
        </div>
      </hx-card>
      <hx-card variant="default" elevation="flat" style="display: block;">
        <span slot="heading">Message · Pharmacy</span>
        <div style="padding: 12px 0; font-size: 13px; line-height: 1.5;">
          <p style="margin: 0 0 8px; color: var(--hx-color-text-secondary);">
            Refill request for atorvastatin 20 mg, MRN-849172. Last filled Apr 28.
          </p>
          <hx-button variant="secondary" hx-size="sm" data-testid="card-action-3"
            >Approve</hx-button
          >
        </div>
      </hx-card>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────
// 1. Default — visual + axe panel
// ─────────────────────────────────────────────────

/**
 * The dashboard rendered with no interaction. Cycle the toolbar theme +
 * brand to verify the layout holds across all 12 (3 × 4) combinations.
 */
export const Default: Story = {
  render: renderDashboard,
};

// ─────────────────────────────────────────────────
// 2. Renders Real Components — structural assertion
// ─────────────────────────────────────────────────

/**
 * Confirms every header, stat tile, table, and action card is an actual
 * hx-* component (not a fake div). If a component fails to register, the
 * story fails fast.
 */
export const RendersRealComponents: Story = {
  render: renderDashboard,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Stat tiles — 4 of them
    const statsRow = canvas.getByTestId('dashboard-stats');
    const stats = statsRow.querySelectorAll('hx-stat');
    await expect(stats.length).toBe(4);

    // Patient roster
    const roster = canvas.getByTestId('dashboard-roster') as HTMLElement;
    await expect(roster.tagName.toLowerCase()).toBe('hx-data-table');

    // Action cards — 3 of them
    const cardsRow = canvas.getByTestId('dashboard-cards');
    const cards = cardsRow.querySelectorAll('hx-card');
    await expect(cards.length).toBe(3);

    // Header buttons
    const print = canvas.getByTestId('dashboard-print');
    const add = canvas.getByTestId('dashboard-add');
    await expect(print.tagName.toLowerCase()).toBe('hx-button');
    await expect(add.tagName.toLowerCase()).toBe('hx-button');
  },
};

// ─────────────────────────────────────────────────
// 3. Action Card Click — buttons inside cards still emit events
// ─────────────────────────────────────────────────

/**
 * Clicks one of the action card buttons. Verifies the embedded hx-button
 * dispatches `hx-click` even when nested inside hx-card slots — a common
 * regression target for shadow-boundary event composition.
 */
export const ActionCardClick: Story = {
  render: renderDashboard,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const action = canvas.getByTestId('card-action-1') as HTMLElement;
    await expect(action.tagName.toLowerCase()).toBe('hx-button');

    let clicked = false;
    action.addEventListener('hx-click', () => {
      clicked = true;
    });

    const inner = action.shadowRoot?.querySelector('button') as HTMLButtonElement | null;
    await expect(inner).toBeTruthy();
    inner!.click();

    await expect(clicked).toBe(true);
  },
};
