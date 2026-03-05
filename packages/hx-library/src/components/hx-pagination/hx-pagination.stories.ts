import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { fn } from 'storybook/test';
import './hx-pagination.js';

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Components/Pagination',
  component: 'hx-pagination',
  tags: ['autodocs'],
  argTypes: {
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages.',
      table: {
        category: 'State',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    currentPage: {
      control: { type: 'number', min: 1 },
      description: 'The currently active page (1-based).',
      table: {
        category: 'State',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    siblingCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of page buttons shown on each side of the current page.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    boundaryCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of pages always shown at the start and end.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    showFirstLast: {
      control: { type: 'boolean' },
      description: 'Whether to show First and Last page buttons.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: { type: 'text' },
      description: 'Accessible label for the nav element.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Pagination' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    totalPages: 10,
    currentPage: 1,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: false,
    label: 'Pagination',
  },
  render: (args) => html`
    <hx-pagination
      total-pages=${args.totalPages}
      current-page=${args.currentPage}
      sibling-count=${args.siblingCount}
      boundary-count=${args.boundaryCount}
      ?show-first-last=${args.showFirstLast}
      label=${args.label}
    ></hx-pagination>
  `,
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    totalPages: 10,
    currentPage: 5,
  },
};

// ─────────────────────────────────────────────────
// 2. FIRST PAGE
// ─────────────────────────────────────────────────

export const FirstPage: Story = {
  name: 'First Page',
  args: {
    totalPages: 10,
    currentPage: 1,
  },
};

// ─────────────────────────────────────────────────
// 3. LAST PAGE
// ─────────────────────────────────────────────────

export const LastPage: Story = {
  name: 'Last Page',
  args: {
    totalPages: 10,
    currentPage: 10,
  },
};

// ─────────────────────────────────────────────────
// 4. WITH FIRST/LAST BUTTONS
// ─────────────────────────────────────────────────

export const WithFirstLast: Story = {
  name: 'With First/Last Buttons',
  args: {
    totalPages: 20,
    currentPage: 10,
    showFirstLast: true,
  },
};

// ─────────────────────────────────────────────────
// 5. FEW PAGES (no ellipsis)
// ─────────────────────────────────────────────────

export const FewPages: Story = {
  name: 'Few Pages (no ellipsis)',
  args: {
    totalPages: 5,
    currentPage: 3,
  },
};

// ─────────────────────────────────────────────────
// 6. MANY PAGES
// ─────────────────────────────────────────────────

export const ManyPages: Story = {
  name: 'Many Pages',
  args: {
    totalPages: 50,
    currentPage: 25,
  },
};

// ─────────────────────────────────────────────────
// 7. WIDE SIBLINGS
// ─────────────────────────────────────────────────

export const WideSiblings: Story = {
  name: 'Wide Sibling Count',
  args: {
    totalPages: 20,
    currentPage: 10,
    siblingCount: 2,
    boundaryCount: 2,
  },
};

// ─────────────────────────────────────────────────
// 8. EVENTS
// ─────────────────────────────────────────────────

const pageChangeHandler = fn();

export const EventHandling: Story = {
  name: 'Test: Events',
  render: () => html`
    <hx-pagination
      total-pages="10"
      current-page="5"
      @hx-page-change=${pageChangeHandler}
    ></hx-pagination>
  `,
};

// ─────────────────────────────────────────────────
// 9. CSS PARTS
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .parts-demo hx-pagination::part(nav) {
        padding: 1rem;
        background: #f8fafc;
        border-radius: 0.5rem;
      }
      .parts-demo hx-pagination::part(button) {
        border-color: #6366f1;
        color: #4338ca;
      }
      .parts-demo hx-pagination::part(button):hover {
        background: #ede9fe;
      }
    </style>
    <div class="parts-demo">
      <hx-pagination total-pages="10" current-page="5"></hx-pagination>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 10. HEALTHCARE SCENARIO
// ─────────────────────────────────────────────────

export const PatientList: Story = {
  name: 'Healthcare: Patient List',
  render: () => html`
    <div style="max-width: 800px;">
      <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead style="background: #f9fafb;">
            <tr>
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Patient ID</th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Name</th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Department</th>
              <th style="padding: 0.75rem 1rem; text-align: left; font-weight: 600;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 0.75rem 1rem;">P-00123</td>
              <td style="padding: 0.75rem 1rem;">Johnson, Mary</td>
              <td style="padding: 0.75rem 1rem;">Cardiology</td>
              <td style="padding: 0.75rem 1rem;">Admitted</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 0.75rem 1rem;">P-00124</td>
              <td style="padding: 0.75rem 1rem;">Williams, Robert</td>
              <td style="padding: 0.75rem 1rem;">Neurology</td>
              <td style="padding: 0.75rem 1rem;">Discharged</td>
            </tr>
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 0.75rem 1rem;">P-00125</td>
              <td style="padding: 0.75rem 1rem;">Davis, Helen</td>
              <td style="padding: 0.75rem 1rem;">Orthopedics</td>
              <td style="padding: 0.75rem 1rem;">Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">
          Showing 1–25 of 2,341 patients
        </p>
        <hx-pagination
          total-pages="94"
          current-page="1"
          show-first-last
          label="Patient list pagination"
        ></hx-pagination>
      </div>
    </div>
  `,
};
