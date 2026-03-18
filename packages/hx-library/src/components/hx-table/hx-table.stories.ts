import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, fn } from 'storybook/test';
import './hx-table.js';
import './hx-thead.js';
import './hx-tbody.js';
import './hx-tfoot.js';
import './hx-tr.js';
import './hx-th.js';
import './hx-td.js';

// ─────────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────────

const PATIENTS = [
  {
    id: 'P-00142',
    name: 'Jane Doe',
    dob: '1985-04-12',
    ward: '4B',
    status: 'Active',
    provider: 'Dr. Smith',
    admitDate: '2026-03-10',
  },
  {
    id: 'P-00198',
    name: 'John Smith',
    dob: '1972-09-03',
    ward: '2A',
    status: 'Discharged',
    provider: 'Dr. Patel',
    admitDate: '2026-03-08',
  },
  {
    id: 'P-00231',
    name: 'Emily Chen',
    dob: '1990-11-27',
    ward: '3C',
    status: 'Active',
    provider: 'Dr. Johnson',
    admitDate: '2026-03-12',
  },
  {
    id: 'P-00304',
    name: 'Carlos Rivera',
    dob: '1964-06-15',
    ward: '1A',
    status: 'Pending',
    provider: 'Dr. Smith',
    admitDate: '2026-03-14',
  },
  {
    id: 'P-00417',
    name: 'Aisha Okafor',
    dob: '2001-02-08',
    ward: '4B',
    status: 'Active',
    provider: 'Dr. Lee',
    admitDate: '2026-03-15',
  },
];

const MEDICATIONS = [
  {
    drug: 'Lisinopril',
    dose: '10 mg',
    route: 'PO',
    frequency: 'Daily',
    prescriber: 'Dr. Smith',
    nextDue: '08:00',
  },
  {
    drug: 'Metformin',
    dose: '1000 mg',
    route: 'PO',
    frequency: 'BID',
    prescriber: 'Dr. Smith',
    nextDue: '12:00',
  },
  {
    drug: 'Atorvastatin',
    dose: '40 mg',
    route: 'PO',
    frequency: 'Nightly',
    prescriber: 'Dr. Patel',
    nextDue: '22:00',
  },
  {
    drug: 'Aspirin',
    dose: '81 mg',
    route: 'PO',
    frequency: 'Daily',
    prescriber: 'Dr. Johnson',
    nextDue: '08:00',
  },
  {
    drug: 'Heparin',
    dose: '5000 units',
    route: 'SQ',
    frequency: 'Q8H',
    prescriber: 'Dr. Lee',
    nextDue: '16:00',
  },
];

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Table',
  component: 'hx-table',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'Accessible aria-label for the table. Required for screen reader identification.',
      table: {
        category: 'Accessibility',
        type: { summary: 'string' },
      },
    },
    caption: {
      control: 'text',
      description: 'Visible caption rendered above the table content.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'striped', 'hover', 'compact'],
      description: 'Visual style variant controlling row appearance and density.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'default' },
        type: { summary: "'default' | 'striped' | 'hover' | 'compact'" },
      },
    },
    stickyHeader: {
      control: 'boolean',
      description: 'Pins the thead to the top of the scrollable container during vertical scroll.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Stretches the table to fill its container width.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    label: 'Patient list',
    caption: '',
    variant: 'default',
    stickyHeader: false,
    fullWidth: true,
  },
  render: (args) => html`
    <hx-table
      label=${args.label}
      caption=${args.caption ?? ''}
      variant=${args.variant}
      ?sticky-header=${args.stickyHeader}
      ?full-width=${args.fullWidth}
    >
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Patient ID</hx-th>
          <hx-th scope="col">Name</hx-th>
          <hx-th scope="col">Date of Birth</hx-th>
          <hx-th scope="col">Ward</hx-th>
          <hx-th scope="col">Status</hx-th>
          <hx-th scope="col">Provider</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        ${PATIENTS.map(
          (p) => html`
            <hx-tr>
              <hx-td>${p.id}</hx-td>
              <hx-td>${p.name}</hx-td>
              <hx-td>${p.dob}</hx-td>
              <hx-td>${p.ward}</hx-td>
              <hx-td>${p.status}</hx-td>
              <hx-td>${p.provider}</hx-td>
            </hx-tr>
          `,
        )}
      </hx-tbody>
    </hx-table>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. Default
// ─────────────────────────────────────────────────

export const Default: Story = {};

// ─────────────────────────────────────────────────
// 2. Striped
// ─────────────────────────────────────────────────

export const Striped: Story = {
  name: 'Variant: Striped',
  args: { variant: 'striped' },
};

// ─────────────────────────────────────────────────
// 3. Hover
// ─────────────────────────────────────────────────

export const Hover: Story = {
  name: 'Variant: Hover',
  args: { variant: 'hover' },
};

// ─────────────────────────────────────────────────
// 4. Compact
// ─────────────────────────────────────────────────

export const Compact: Story = {
  name: 'Variant: Compact',
  args: { variant: 'compact' },
};

// ─────────────────────────────────────────────────
// 5. Sortable
// ─────────────────────────────────────────────────

const sortHandler = fn();

export const Sortable: Story = {
  name: 'Sortable Columns',
  render: () => html`
    <hx-table label="Medication schedule — sortable" variant="hover" @hx-sort=${sortHandler}>
      <hx-thead>
        <hx-tr>
          <hx-th scope="col" sortable sort-direction="asc">Drug</hx-th>
          <hx-th scope="col" sortable sort-direction="none">Dose</hx-th>
          <hx-th scope="col">Route</hx-th>
          <hx-th scope="col" sortable sort-direction="none">Frequency</hx-th>
          <hx-th scope="col" sortable sort-direction="none">Next Due</hx-th>
          <hx-th scope="col">Prescriber</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        ${MEDICATIONS.map(
          (m) => html`
            <hx-tr>
              <hx-td>${m.drug}</hx-td>
              <hx-td>${m.dose}</hx-td>
              <hx-td>${m.route}</hx-td>
              <hx-td>${m.frequency}</hx-td>
              <hx-td>${m.nextDue}</hx-td>
              <hx-td>${m.prescriber}</hx-td>
            </hx-tr>
          `,
        )}
      </hx-tbody>
    </hx-table>
  `,
  play: async ({ canvasElement }) => {
    sortHandler.mockClear();

    const table = canvasElement.querySelector('hx-table');
    await expect(table).toBeTruthy();

    // Locate the first sortable hx-th (Drug column, currently "asc")
    const sortableHeaders = canvasElement.querySelectorAll('hx-th[sortable]');
    await expect(sortableHeaders.length).toBeGreaterThan(0);

    const drugHeader = sortableHeaders[0] as HTMLElement;
    await expect(drugHeader).toBeTruthy();

    // Click the sort button inside the header to trigger sort cycle (asc -> desc)
    const sortBtn = drugHeader.shadowRoot?.querySelector('.sort-btn') as HTMLElement | null;
    await expect(sortBtn).toBeTruthy();
    await userEvent.click(sortBtn!);
    await new Promise((r) => setTimeout(r, 50));

    // hx-sort event must have fired
    await expect(sortHandler).toHaveBeenCalledTimes(1);

    const event = sortHandler.mock.calls[0][0] as CustomEvent<{ direction: 'asc' | 'desc' }>;
    await expect(event.type).toBe('hx-sort');
    await expect(['asc', 'desc']).toContain(event.detail.direction);

    // aria-sort is set on the inner <th> in shadow DOM — not on the host hx-th element
    const thElement = drugHeader.shadowRoot?.querySelector('th');
    await expect(thElement).toBeTruthy();
    const ariaSort = thElement?.getAttribute('aria-sort');
    await expect(ariaSort).toBe('descending');
  },
};

// ─────────────────────────────────────────────────
// 6. With Caption
// ─────────────────────────────────────────────────

export const WithCaption: Story = {
  name: 'With Caption',
  render: () => html`
    <hx-table
      label="Active inpatient list"
      caption="Active Inpatients — Ward 4B as of 2026-03-17"
      variant="default"
    >
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Patient ID</hx-th>
          <hx-th scope="col">Name</hx-th>
          <hx-th scope="col">Admit Date</hx-th>
          <hx-th scope="col">Provider</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        ${PATIENTS.filter((p) => p.ward === '4B').map(
          (p) => html`
            <hx-tr>
              <hx-td>${p.id}</hx-td>
              <hx-td>${p.name}</hx-td>
              <hx-td>${p.admitDate}</hx-td>
              <hx-td>${p.provider}</hx-td>
            </hx-tr>
          `,
        )}
      </hx-tbody>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 7. Sticky Header
// ─────────────────────────────────────────────────

export const StickyHeader: Story = {
  name: 'Sticky Header',
  args: { stickyHeader: true },
  render: (args) => html`
    <div style="height: 220px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 0.5rem;">
      <hx-table label="Full patient census" variant="striped" ?sticky-header=${args.stickyHeader}>
        <hx-thead>
          <hx-tr>
            <hx-th scope="col">Patient ID</hx-th>
            <hx-th scope="col">Name</hx-th>
            <hx-th scope="col">Ward</hx-th>
            <hx-th scope="col">Status</hx-th>
            <hx-th scope="col">Provider</hx-th>
          </hx-tr>
        </hx-thead>
        <hx-tbody>
          ${[...PATIENTS, ...PATIENTS, ...PATIENTS].map(
            (p, i) => html`
              <hx-tr>
                <hx-td>P-${String(i + 1).padStart(5, '0')}</hx-td>
                <hx-td>${p.name}</hx-td>
                <hx-td>${p.ward}</hx-td>
                <hx-td>${p.status}</hx-td>
                <hx-td>${p.provider}</hx-td>
              </hx-tr>
            `,
          )}
        </hx-tbody>
      </hx-table>
    </div>
    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280;">
      Scroll the container above — the header row remains pinned to the top.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. Colspan / Rowspan
// ─────────────────────────────────────────────────

export const ColspanRowspan: Story = {
  name: 'Colspan and Rowspan',
  render: () => html`
    <hx-table label="Lab results summary with grouped headers" variant="default">
      <hx-thead>
        <hx-tr>
          <hx-th scope="col" rowspan="2">Patient</hx-th>
          <hx-th scope="col" rowspan="2">Collected</hx-th>
          <hx-th scope="colgroup" colspan="3">Complete Blood Count</hx-th>
          <hx-th scope="colgroup" colspan="2">Metabolic Panel</hx-th>
        </hx-tr>
        <hx-tr>
          <hx-th scope="col">WBC (K/uL)</hx-th>
          <hx-th scope="col">RBC (M/uL)</hx-th>
          <hx-th scope="col">Hgb (g/dL)</hx-th>
          <hx-th scope="col">Na (mEq/L)</hx-th>
          <hx-th scope="col">K (mEq/L)</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        <hx-tr>
          <hx-td rowspan="2">Jane Doe</hx-td>
          <hx-td>2026-03-16 06:00</hx-td>
          <hx-td>7.2</hx-td>
          <hx-td>4.5</hx-td>
          <hx-td>13.8</hx-td>
          <hx-td>138</hx-td>
          <hx-td>4.1</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td>2026-03-17 06:00</hx-td>
          <hx-td>8.1</hx-td>
          <hx-td>4.4</hx-td>
          <hx-td>13.5</hx-td>
          <hx-td>140</hx-td>
          <hx-td>3.9</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td>Carlos Rivera</hx-td>
          <hx-td>2026-03-17 07:15</hx-td>
          <hx-td>5.9</hx-td>
          <hx-td>4.1</hx-td>
          <hx-td>12.2</hx-td>
          <hx-td>136</hx-td>
          <hx-td>4.5</hx-td>
        </hx-tr>
      </hx-tbody>
      <hx-tfoot>
        <hx-tr>
          <hx-td colspan="2" align="right">
            <strong>Reference ranges:</strong>
          </hx-td>
          <hx-td>4.5 – 11.0</hx-td>
          <hx-td>4.2 – 5.9</hx-td>
          <hx-td>12.0 – 17.5</hx-td>
          <hx-td>135 – 145</hx-td>
          <hx-td>3.5 – 5.0</hx-td>
        </hx-tr>
      </hx-tfoot>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 9. Empty
// ─────────────────────────────────────────────────

export const Empty: Story = {
  name: 'Empty State',
  render: () => html`
    <hx-table label="Patient search results" variant="default">
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Patient ID</hx-th>
          <hx-th scope="col">Name</hx-th>
          <hx-th scope="col">Date of Birth</hx-th>
          <hx-th scope="col">Status</hx-th>
          <hx-th scope="col">Provider</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        <hx-tr>
          <hx-td colspan="5" align="center">
            <div
              style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem 1rem; color: #64748b;"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style="font-size: 0.875rem; font-weight: 500;">No patients found</span>
              <span style="font-size: 0.8125rem;">
                Try adjusting your search filters or clearing the search term.
              </span>
            </div>
          </hx-td>
        </hx-tr>
      </hx-tbody>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 10. Selected Row
// ─────────────────────────────────────────────────

export const SelectedRow: Story = {
  name: 'Selected Row',
  render: () => html`
    <hx-table label="Patient list with selection" variant="hover">
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Patient ID</hx-th>
          <hx-th scope="col">Name</hx-th>
          <hx-th scope="col">Ward</hx-th>
          <hx-th scope="col">Status</hx-th>
          <hx-th scope="col">Provider</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        <hx-tr>
          <hx-td>${PATIENTS[0].id}</hx-td>
          <hx-td>${PATIENTS[0].name}</hx-td>
          <hx-td>${PATIENTS[0].ward}</hx-td>
          <hx-td>${PATIENTS[0].status}</hx-td>
          <hx-td>${PATIENTS[0].provider}</hx-td>
        </hx-tr>
        <hx-tr selected>
          <hx-td>${PATIENTS[1].id}</hx-td>
          <hx-td>${PATIENTS[1].name}</hx-td>
          <hx-td>${PATIENTS[1].ward}</hx-td>
          <hx-td>${PATIENTS[1].status}</hx-td>
          <hx-td>${PATIENTS[1].provider}</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td>${PATIENTS[2].id}</hx-td>
          <hx-td>${PATIENTS[2].name}</hx-td>
          <hx-td>${PATIENTS[2].ward}</hx-td>
          <hx-td>${PATIENTS[2].status}</hx-td>
          <hx-td>${PATIENTS[2].provider}</hx-td>
        </hx-tr>
      </hx-tbody>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 11. With Footer Totals
// ─────────────────────────────────────────────────

export const WithFooter: Story = {
  name: 'With Footer Totals',
  render: () => html`
    <hx-table label="Medication administration record" variant="striped">
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Drug</hx-th>
          <hx-th scope="col">Dose</hx-th>
          <hx-th scope="col">Route</hx-th>
          <hx-th scope="col">Frequency</hx-th>
          <hx-th scope="col">Prescriber</hx-th>
          <hx-th scope="col">Next Due</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        ${MEDICATIONS.map(
          (m) => html`
            <hx-tr>
              <hx-td>${m.drug}</hx-td>
              <hx-td>${m.dose}</hx-td>
              <hx-td>${m.route}</hx-td>
              <hx-td>${m.frequency}</hx-td>
              <hx-td>${m.prescriber}</hx-td>
              <hx-td>${m.nextDue}</hx-td>
            </hx-tr>
          `,
        )}
      </hx-tbody>
      <hx-tfoot>
        <hx-tr>
          <hx-td colspan="6" align="right">
            <span style="font-size: 0.8125rem; color: #64748b;">
              ${MEDICATIONS.length} active orders
            </span>
          </hx-td>
        </hx-tr>
      </hx-tfoot>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 12. Cell Alignment
// ─────────────────────────────────────────────────

export const CellAlignment: Story = {
  name: 'Cell Alignment',
  render: () => html`
    <hx-table label="Vital signs with numeric alignment" variant="default">
      <hx-thead>
        <hx-tr>
          <hx-th scope="col">Patient</hx-th>
          <hx-th scope="col">Time</hx-th>
          <hx-th scope="col">Temp (°F)</hx-th>
          <hx-th scope="col">HR (bpm)</hx-th>
          <hx-th scope="col">SpO2 (%)</hx-th>
          <hx-th scope="col">BP (mmHg)</hx-th>
          <hx-th scope="col">Assessment</hx-th>
        </hx-tr>
      </hx-thead>
      <hx-tbody>
        <hx-tr>
          <hx-td align="left">Jane Doe</hx-td>
          <hx-td align="center">08:00</hx-td>
          <hx-td align="right">98.6</hx-td>
          <hx-td align="right">72</hx-td>
          <hx-td align="right">99</hx-td>
          <hx-td align="center">118/76</hx-td>
          <hx-td align="left">Stable</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td align="left">Carlos Rivera</hx-td>
          <hx-td align="center">08:15</hx-td>
          <hx-td align="right">99.1</hx-td>
          <hx-td align="right">88</hx-td>
          <hx-td align="right">96</hx-td>
          <hx-td align="center">142/90</hx-td>
          <hx-td align="left">Monitor BP</hx-td>
        </hx-tr>
        <hx-tr>
          <hx-td align="left">Aisha Okafor</hx-td>
          <hx-td align="center">08:30</hx-td>
          <hx-td align="right">98.4</hx-td>
          <hx-td align="right">68</hx-td>
          <hx-td align="right">100</hx-td>
          <hx-td align="center">110/70</hx-td>
          <hx-td align="left">Stable</hx-td>
        </hx-tr>
      </hx-tbody>
    </hx-table>
  `,
};

// ─────────────────────────────────────────────────
// 13. All Variants
// ─────────────────────────────────────────────────

export const AllVariants: Story = {
  name: 'All Variants',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2.5rem;">
      ${(['default', 'striped', 'hover', 'compact'] as const).map(
        (variant) => html`
          <div>
            <h3
              style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;"
            >
              variant="${variant}"
            </h3>
            <hx-table label="Patient list — ${variant} variant" variant=${variant}>
              <hx-thead>
                <hx-tr>
                  <hx-th scope="col">Patient ID</hx-th>
                  <hx-th scope="col">Name</hx-th>
                  <hx-th scope="col">Ward</hx-th>
                  <hx-th scope="col">Status</hx-th>
                </hx-tr>
              </hx-thead>
              <hx-tbody>
                ${PATIENTS.slice(0, 3).map(
                  (p) => html`
                    <hx-tr>
                      <hx-td>${p.id}</hx-td>
                      <hx-td>${p.name}</hx-td>
                      <hx-td>${p.ward}</hx-td>
                      <hx-td>${p.status}</hx-td>
                    </hx-tr>
                  `,
                )}
              </hx-tbody>
            </hx-table>
          </div>
        `,
      )}
    </div>
  `,
};
