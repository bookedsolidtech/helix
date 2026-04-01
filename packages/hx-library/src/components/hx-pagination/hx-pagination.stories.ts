import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { fn, expect, userEvent } from 'storybook/test';
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
    pageSize: {
      control: { type: 'number', min: 1 },
      description: 'Number of items displayed per page. Used with show-page-size.',
      table: {
        category: 'State',
        defaultValue: { summary: '25' },
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
    showPageSize: {
      control: { type: 'boolean' },
      description: 'Whether to show the page-size selector.',
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
    labelRowsPerPage: {
      control: 'text',
      description: 'Label text for the rows-per-page selector.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'Rows per page' },
        type: { summary: 'string' },
      },
    },
    firstPageLabel: {
      control: 'text',
      description: 'Accessible label for the first page button.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'First page' },
        type: { summary: 'string' },
      },
    },
    previousPageLabel: {
      control: 'text',
      description: 'Accessible label for the previous page button.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'Previous page' },
        type: { summary: 'string' },
      },
    },
    nextPageLabel: {
      control: 'text',
      description: 'Accessible label for the next page button.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'Next page' },
        type: { summary: 'string' },
      },
    },
    lastPageLabel: {
      control: 'text',
      description: 'Accessible label for the last page button.',
      table: {
        category: 'Labels',
        defaultValue: { summary: 'Last page' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    totalPages: 10,
    currentPage: 1,
    pageSize: 25,
    siblingCount: 1,
    boundaryCount: 1,
    showFirstLast: false,
    showPageSize: false,
    label: 'Pagination',
  },
  render: (args) => html`
    <hx-pagination
      total-pages=${args.totalPages}
      current-page=${args.currentPage}
      page-size=${args.pageSize}
      sibling-count=${args.siblingCount}
      boundary-count=${args.boundaryCount}
      ?show-first-last=${args.showFirstLast}
      ?show-page-size=${args.showPageSize}
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
// 8. SINGLE PAGE (degenerate state)
// ─────────────────────────────────────────────────

export const SinglePage: Story = {
  name: 'Single Page',
  args: {
    totalPages: 1,
    currentPage: 1,
  },
};

// ─────────────────────────────────────────────────
// 9. WITH PAGE SIZE SELECTOR
// ─────────────────────────────────────────────────

export const WithPageSizeSelector: Story = {
  name: 'With Page Size Selector',
  args: {
    totalPages: 10,
    currentPage: 1,
    showPageSize: true,
    pageSize: 25,
  },
};

// ─────────────────────────────────────────────────
// 10. EVENTS
// ─────────────────────────────────────────────────

export const EventHandling: Story = {
  name: 'Test: Events',
  render: (args) => {
    const onPageChange = fn();
    const onPageSizeChange = fn();
    return html`
      <hx-pagination
        total-pages=${args.totalPages}
        current-page=${args.currentPage}
        page-size=${args.pageSize}
        sibling-count=${args.siblingCount}
        boundary-count=${args.boundaryCount}
        ?show-first-last=${args.showFirstLast}
        ?show-page-size=${args.showPageSize}
        label=${args.label}
        @hx-page-change=${onPageChange}
        @hx-page-size-change=${onPageSizeChange}
      ></hx-pagination>
    `;
  },
};

// ─────────────────────────────────────────────────
// 11. CSS PARTS
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
// 12. MULTIPLE CONTROLS (accessibility labeling)
// ─────────────────────────────────────────────────

export const MultipleControls: Story = {
  name: 'Multiple Pagination Controls',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 600px;">
      <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">
        Healthcare views often show pagination at both the top and bottom of a table. Each
        <code>&lt;hx-pagination&gt;</code> must have a distinct <code>label</code>
        so screen readers can differentiate them.
      </p>
      <div>
        <p style="font-size: 0.75rem; color: #9ca3af; margin: 0 0 0.5rem;">Top pagination</p>
        <hx-pagination
          total-pages="10"
          current-page="3"
          label="Patient list pagination, top"
        ></hx-pagination>
      </div>
      <div
        style="border: 1px dashed #e5e7eb; padding: 1rem; text-align: center; color: #9ca3af; font-size: 0.875rem;"
      >
        Table content here
      </div>
      <div>
        <p style="font-size: 0.75rem; color: #9ca3af; margin: 0 0 0.5rem;">Bottom pagination</p>
        <hx-pagination
          total-pages="10"
          current-page="3"
          label="Patient list pagination, bottom"
        ></hx-pagination>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. HEALTHCARE SCENARIO
// ─────────────────────────────────────────────────

export const PatientList: Story = {
  name: 'Healthcare: Patient List',
  render: () => html`
    <div style="max-width: 800px;">
      <div
        style="border: 1px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem;"
      >
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
          show-page-size
          page-size="25"
          label="Patient list pagination"
        ></hx-pagination>
      </div>
    </div>
  `,
};

export const DarkMode: Story = {
  decorators: [(story) => html`<hx-theme mode="dark" style="display: block; padding: 1rem;">${story()}</hx-theme>`],
  args: {
    totalPages: 10,
    currentPage: 5,
  },
};

// ─────────────────────────────────────────────────
// 14. CUSTOM LABELS (i18n)
// ─────────────────────────────────────────────────

export const CustomLabels: Story = {
  name: 'Custom Labels (i18n)',
  render: () => {
    // labelPageMessage and labelPageButton are @property({ attribute: false }) — set via JS.
    const el = document.createElement('hx-pagination');
    el.setAttribute('total-pages', '10');
    el.setAttribute('current-page', '5');
    el.setAttribute('show-first-last', '');
    el.setAttribute('label', 'Navigation de pagination');
    el.setAttribute('first-page-label', 'Première page');
    el.setAttribute('previous-page-label', 'Page précédente');
    el.setAttribute('next-page-label', 'Page suivante');
    el.setAttribute('last-page-label', 'Dernière page');
    el.labelPageMessage = (current, total) => `Page ${current} sur ${total}`;
    el.labelPageButton = (page) => `Page ${page}`;
    return html`
      <div style="padding: 1rem;">
        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">
          All button labels and announcements can be customised for i18n.
          <code>labelPageMessage</code> and <code>labelPageButton</code> are function properties
          (not attributes) — set them directly on the element. String attributes accept plain text
          for aria-labels.
        </p>
        ${el}
      </div>
    `;
  },
};

// ─────────────────────────────────────────────────
// 15. CSS CUSTOM PROPERTIES
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem;">
      <div>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #6c757d;">
          Emerald theme — override active color, border-radius, and button size
        </p>
        <hx-pagination
          total-pages="10"
          current-page="5"
          style="
            --hx-pagination-active-bg: #059669;
            --hx-pagination-hover-border-color: #059669;
            --hx-pagination-border-radius: 9999px;
            --hx-pagination-button-size: 2rem;
          "
        ></hx-pagination>
      </div>

      <div>
        <p style="margin: 0 0 0.75rem; font-size: 0.875rem; font-weight: 600; color: #6c757d;">
          Compact warm theme — smaller buttons, warm border color
        </p>
        <hx-pagination
          total-pages="10"
          current-page="3"
          show-first-last
          style="
            --hx-pagination-button-size: 1.75rem;
            --hx-pagination-bg: #fffbeb;
            --hx-pagination-border-color: #d97706;
            --hx-pagination-active-bg: #b45309;
            --hx-pagination-gap: 0.125rem;
          "
        ></hx-pagination>
      </div>

      <details style="max-width: 640px;">
        <summary style="cursor: pointer; font-weight: 600; margin-bottom: 0.5rem;">
          View CSS Custom Properties Reference
        </summary>
        <pre
          style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; font-size: 0.8125rem; overflow-x: auto; line-height: 1.6;"
        >
hx-pagination {
  /* Gap between pagination buttons */
  --hx-pagination-gap: var(--hx-spacing-1, 0.25rem);

  /* Minimum width and height of each button */
  --hx-pagination-button-size: 2.25rem;

  /* Border color of buttons */
  --hx-pagination-border-color: var(--hx-color-border, #d1d5db);

  /* Border radius of buttons */
  --hx-pagination-border-radius: var(--hx-border-radius-md, 0.375rem);

  /* Background color of buttons */
  --hx-pagination-bg: var(--hx-color-surface, #ffffff);

  /* Text color of buttons */
  --hx-pagination-color: var(--hx-color-text-primary, #111827);

  /* Hover background */
  --hx-pagination-hover-bg: var(--hx-color-surface-hover, #f3f4f6);

  /* Hover border color */
  --hx-pagination-hover-border-color: var(--hx-color-primary, #2563eb);

  /* Active/current page background */
  --hx-pagination-active-bg: var(--hx-color-primary, #2563eb);

  /* Active/current page text color */
  --hx-pagination-active-color: var(--hx-color-surface, #ffffff);

  /* Active/current page border color */
  --hx-pagination-active-border-color: var(--hx-pagination-active-bg);

  /* Ellipsis character color */
  --hx-pagination-ellipsis-color: var(--hx-color-text-secondary, #6b7280);

  /* Transition duration for hover/focus */
  --hx-transition-fast: 150ms;
}</pre
        >
      </details>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────

export const KeyboardNavigation: Story = {
  name: 'Test: Keyboard Navigation (ArrowLeft/ArrowRight)',
  args: {
    totalPages: 5,
    currentPage: 3,
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-pagination');
    await expect(host).toBeTruthy();

    const shadow = host!.shadowRoot!;

    // The current page button (page 3) starts with tabindex=0
    const currentBtn = shadow.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    await expect(currentBtn).toBeTruthy();
    await expect(currentBtn!.getAttribute('tabindex')).toBe('0');

    // Focus the current page button
    currentBtn!.focus();
    await expect(shadow.activeElement).toBe(currentBtn);

    // ArrowRight moves focus to the next button
    const list = shadow.querySelector('.list')!;
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await host!.updateComplete;

    const buttons = Array.from(shadow.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    const currentIdx = buttons.findIndex((b) => b.getAttribute('aria-label') === 'Page 3');
    await expect(shadow.activeElement).toBe(buttons[currentIdx + 1]);

    // ArrowLeft moves focus back to the current page button
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await host!.updateComplete;
    await expect(shadow.activeElement).toBe(buttons[currentIdx]);
  },
};

// ─────────────────────────────────────────────────
// INTERACTION TEST — hx-page-change events
// ─────────────────────────────────────────────────

const pageChangeHandler = fn();
const pageSizeChangeHandler = fn();

export const InteractionTest: Story = {
  name: 'Test: hx-page-change and hx-page-size-change Events',
  render: () => html`
    <hx-pagination
      total-pages="10"
      current-page="5"
      show-page-size
      page-size="25"
      @hx-page-change=${pageChangeHandler}
      @hx-page-size-change=${pageSizeChangeHandler}
    ></hx-pagination>
  `,
  play: async ({ canvasElement }) => {
    pageChangeHandler.mockClear();
    pageSizeChangeHandler.mockClear();

    const host = canvasElement.querySelector('hx-pagination');
    await expect(host).toBeTruthy();

    const shadow = host!.shadowRoot!;

    // Click the "Next page" button — expect hx-page-change to fire with page 6
    const nextBtn = shadow.querySelector<HTMLButtonElement>('button[aria-label="Next page"]');
    await expect(nextBtn).toBeTruthy();
    await expect(nextBtn!.disabled).toBe(false);

    await userEvent.click(nextBtn!);
    await expect(pageChangeHandler).toHaveBeenCalledTimes(1);
    const pageDetail = pageChangeHandler.mock.calls[0]?.[0]?.detail as { page: number };
    await expect(pageDetail?.page).toBe(6);

    // Click "Previous page" — expect hx-page-change to fire with page 5
    const prevBtn = shadow.querySelector<HTMLButtonElement>('button[aria-label="Previous page"]');
    await expect(prevBtn).toBeTruthy();
    await userEvent.click(prevBtn!);
    await expect(pageChangeHandler).toHaveBeenCalledTimes(2);
    const prevDetail = pageChangeHandler.mock.calls[1]?.[0]?.detail as { page: number };
    await expect(prevDetail?.page).toBe(5);

    // Change the page size select — expect hx-page-size-change to fire
    const select = shadow.querySelector<HTMLSelectElement>('select');
    await expect(select).toBeTruthy();
    await userEvent.selectOptions(select!, '50');
    await expect(pageSizeChangeHandler).toHaveBeenCalledTimes(1);
    const sizeDetail = pageSizeChangeHandler.mock.calls[0]?.[0]?.detail as { pageSize: number };
    await expect(sizeDetail?.pageSize).toBe(50);
  },
};
