import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-data-table.js';

// ─────────────────────────────────────────────────
// Sample Data
// ─────────────────────────────────────────────────

const COLUMNS = [
  { key: 'name', label: 'Patient Name', sortable: true },
  { key: 'dob', label: 'Date of Birth', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'provider', label: 'Provider', sortable: true },
];

const ROWS = [
  { name: 'Jane Doe', dob: '1985-04-12', status: 'Active', provider: 'Dr. Smith' },
  { name: 'John Smith', dob: '1972-09-03', status: 'Discharged', provider: 'Dr. Patel' },
  { name: 'Emily Chen', dob: '1990-11-27', status: 'Active', provider: 'Dr. Johnson' },
  { name: 'Carlos Rivera', dob: '1964-06-15', status: 'Pending', provider: 'Dr. Smith' },
  { name: 'Aisha Okafor', dob: '2001-02-08', status: 'Active', provider: 'Dr. Lee' },
];

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/DataTable',
  component: 'hx-data-table',
  tags: ['autodocs'],
  argTypes: {
    selectable: {
      control: 'boolean',
      description: 'Enable row checkboxes for multi-row selection.',
      table: { category: 'Behavior', defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Show loading skeleton rows and set aria-busy.',
      table: { category: 'State', defaultValue: { summary: 'false' } },
    },
    sortKey: {
      control: 'text',
      description: 'Column key currently sorted.',
      table: { category: 'Sort' },
    },
    sortDirection: {
      control: { type: 'select' },
      options: ['asc', 'desc'],
      description: 'Current sort direction.',
      table: { category: 'Sort', defaultValue: { summary: 'asc' } },
    },
    emptyLabel: {
      control: 'text',
      description: 'Text shown when rows array is empty.',
      table: { category: 'Content', defaultValue: { summary: 'No data' } },
    },
    stickyHeader: {
      control: 'boolean',
      description: 'Stick the header row to the top during scroll.',
      table: { category: 'Layout', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    selectable: false,
    loading: false,
    sortKey: '',
    sortDirection: 'asc',
    emptyLabel: 'No data',
    stickyHeader: false,
  },
  render: (args) => html`
    <hx-data-table
      .columns=${COLUMNS}
      .rows=${ROWS}
      ?selectable=${args.selectable}
      ?loading=${args.loading}
      sort-key=${args.sortKey ?? ''}
      sort-direction=${args.sortDirection}
      empty-label=${args.emptyLabel}
      ?sticky-header=${args.stickyHeader}
    ></hx-data-table>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. Default
// ─────────────────────────────────────────────────

export const Default: Story = {};

// ─────────────────────────────────────────────────
// 2. Selectable
// ─────────────────────────────────────────────────

export const Selectable: Story = {
  args: { selectable: true },
};

// ─────────────────────────────────────────────────
// 3. Sorted
// ─────────────────────────────────────────────────

export const SortedAscending: Story = {
  name: 'Sorted — Ascending',
  args: { sortKey: 'name', sortDirection: 'asc' },
};

export const SortedDescending: Story = {
  name: 'Sorted — Descending',
  args: { sortKey: 'name', sortDirection: 'desc' },
};

// ─────────────────────────────────────────────────
// 4. Loading
// ─────────────────────────────────────────────────

export const Loading: Story = {
  args: { loading: true },
};

// ─────────────────────────────────────────────────
// 5. Empty State
// ─────────────────────────────────────────────────

export const Empty: Story = {
  render: () => html`
    <hx-data-table .columns=${COLUMNS} .rows=${[]} empty-label="No patients found"></hx-data-table>
  `,
};

export const EmptyCustomSlot: Story = {
  name: 'Empty — Custom Slot',
  render: () => html`
    <hx-data-table .columns=${COLUMNS} .rows=${[]}>
      <div
        slot="empty"
        style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:2rem;"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style="color:#64748b;font-size:0.875rem;">No patients match your search.</span>
      </div>
    </hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 6. Sticky Header
// ─────────────────────────────────────────────────

export const StickyHeader: Story = {
  name: 'Sticky Header',
  args: { stickyHeader: true },
  render: (args) => html`
    <div style="height:200px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:0.5rem;">
      <hx-data-table
        .columns=${COLUMNS}
        .rows=${[...ROWS, ...ROWS, ...ROWS]}
        ?sticky-header=${args.stickyHeader}
      ></hx-data-table>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. With Toolbar Slot
// ─────────────────────────────────────────────────

export const WithToolbar: Story = {
  name: 'With Toolbar Slot',
  render: () => html`
    <hx-data-table .columns=${COLUMNS} .rows=${ROWS}>
      <div
        slot="toolbar"
        style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;margin-bottom:0.25rem;"
      >
        <strong style="font-size:0.875rem;">Patient List</strong>
        <button
          style="padding:0.25rem 0.75rem;border:1px solid #e2e8f0;border-radius:0.375rem;background:#fff;font-size:0.875rem;cursor:pointer;"
        >
          Export
        </button>
      </div>
    </hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 8. Full-featured (selectable + sorted + toolbar)
// ─────────────────────────────────────────────────

export const FullFeatured: Story = {
  name: 'Full Featured',
  render: () => html`
    <hx-data-table
      .columns=${COLUMNS}
      .rows=${ROWS}
      selectable
      sort-key="name"
      sort-direction="asc"
    >
      <div
        slot="toolbar"
        style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;"
      >
        <strong style="font-size:0.875rem;">Active Patients</strong>
        <button
          style="padding:0.25rem 0.75rem;border:1px solid #e2e8f0;border-radius:0.375rem;background:#fff;font-size:0.875rem;cursor:pointer;"
        >
          Export CSV
        </button>
      </div>
    </hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 9. Custom Column Widths
// ─────────────────────────────────────────────────

export const CustomColumnWidths: Story = {
  name: 'Custom Column Widths',
  render: () => html`
    <hx-data-table
      .columns=${[
        { key: 'name', label: 'Patient Name', sortable: true, width: '200px' },
        { key: 'dob', label: 'DOB', sortable: true, width: '120px' },
        { key: 'status', label: 'Status', sortable: false, width: '100px' },
        { key: 'provider', label: 'Provider', sortable: true },
      ]}
      .rows=${ROWS}
    ></hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 10. Pagination
// ─────────────────────────────────────────────────

export const Paginated: Story = {
  name: 'Paginated',
  render: () => html`
    <hx-data-table
      .columns=${COLUMNS}
      .rows=${[...ROWS, ...ROWS, ...ROWS]}
      page-size="5"
      page="1"
    ></hx-data-table>
  `,
};

export const PaginatedPage2: Story = {
  name: 'Paginated — Page 2',
  render: () => html`
    <hx-data-table
      .columns=${COLUMNS}
      .rows=${[...ROWS, ...ROWS, ...ROWS]}
      page-size="5"
      page="2"
    ></hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 11. Custom Loading Slot
// ─────────────────────────────────────────────────

export const CustomLoadingSlot: Story = {
  name: 'Loading — Custom Slot',
  render: () => html`
    <hx-data-table .columns=${COLUMNS} .rows=${[]} loading>
      <div
        slot="loading"
        style="display:flex;justify-content:center;align-items:center;padding:2rem;gap:0.5rem;color:#64748b;font-size:0.875rem;"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="animation:spin 1s linear infinite;"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading patient records…
      </div>
    </hx-data-table>
  `,
};

// ─────────────────────────────────────────────────
// 12. JSON Attribute Usage (Drupal/Twig Path)
// ─────────────────────────────────────────────────

export const JsonAttributes: Story = {
  name: 'JSON String Attributes (Drupal)',
  render: () => {
    const columnsJson = JSON.stringify(COLUMNS);
    const rowsJson = JSON.stringify(ROWS);
    return html`
      <hx-data-table columns=${columnsJson} rows=${rowsJson} selectable></hx-data-table>
    `;
  },
};
