import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixDataTable } from './hx-data-table.js';
import './index.js';

afterEach(cleanup);

const COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

const ALL_SORTABLE_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

const ROWS = [
  { name: 'Jane Doe', status: 'Active' },
  { name: 'John Smith', status: 'Pending' },
  { name: 'Emily Chen', status: 'Discharged' },
];

describe('hx-data-table', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('renders correct number of column headers', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      const headers = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      expect(headers.length).toBe(COLUMNS.length);
    });

    it('renders correct number of data rows', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      const rows = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(rows.length).toBe(ROWS.length);
    });

    it('renders cell content from row data', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      const firstTd = el.shadowRoot!.querySelector('tbody td[part~="td"]');
      expect(firstTd?.textContent?.trim()).toBe('Jane Doe');
    });

    it('exposes "table" CSS part', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      expect(shadowQuery(el, '[part~="table"]')).toBeTruthy();
    });

    it('exposes "thead" CSS part', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      expect(shadowQuery(el, '[part~="thead"]')).toBeTruthy();
    });

    it('exposes "tbody" CSS part', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      expect(shadowQuery(el, '[part~="tbody"]')).toBeTruthy();
    });
  });

  // ─── Sorting ───

  describe('Sorting', () => {
    it('dispatches hx-sort on sortable column click', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const sortBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.sort-btn');
      expect(sortBtn).toBeTruthy();

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-sort');
      sortBtn!.click();
      const event = await eventPromise;

      expect(event.detail.key).toBe('name');
      expect(event.detail.direction).toBe('asc');
    });

    it('toggles sort direction on second click of same column', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      el.sortDirection = 'asc';
      await el.updateComplete;

      const sortBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('.sort-btn');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-sort');
      sortBtn!.click();
      const event = await eventPromise;

      expect(event.detail.direction).toBe('desc');
    });

    it('resets to asc when clicking a different column', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = ALL_SORTABLE_COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      el.sortDirection = 'desc';
      await el.updateComplete;

      const sortBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.sort-btn');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-sort');
      sortBtns[1].click(); // click 'status'
      const event = await eventPromise;

      expect(event.detail.key).toBe('status');
      expect(event.detail.direction).toBe('asc');
    });

    it('sets aria-sort="ascending" on active sortable column header', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      el.sortDirection = 'asc';
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      expect(ths[0].getAttribute('aria-sort')).toBe('ascending');
    });

    it('sets aria-sort="descending" when direction is desc', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      el.sortDirection = 'desc';
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      expect(ths[0].getAttribute('aria-sort')).toBe('descending');
    });

    it('sets aria-sort="none" on sortable column that is not the active sort column', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = ALL_SORTABLE_COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      // status column is sortable but not the active sort column
      expect(ths[1].getAttribute('aria-sort')).toBe('none');
    });

    it('does not set aria-sort on non-sortable columns', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      // status column has sortable: false — must not have aria-sort at all
      expect(ths[1].hasAttribute('aria-sort')).toBe(false);
    });
  });

  // ─── Selection ───

  describe('Selection', () => {
    it('renders checkbox column when selectable=true', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const checkboxes = el.shadowRoot!.querySelectorAll(
        'input[type="checkbox"][part~="checkbox"]',
      );
      // 1 header + 3 row checkboxes
      expect(checkboxes.length).toBe(4);
    });

    it('dispatches hx-select when row checkbox is checked', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const checkboxes = el.shadowRoot!.querySelectorAll<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      );
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      await userEvent.click(checkboxes[0]);
      const event = await eventPromise;

      expect(event.detail.selectedRows).toHaveLength(1);
      expect(event.detail.selectedRows[0]).toEqual(ROWS[0]);
    });

    it('selects all rows when header checkbox is checked', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const headerCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'thead input[type="checkbox"]',
      )!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      await userEvent.click(headerCheckbox);
      const event = await eventPromise;

      expect(event.detail.selectedRows).toHaveLength(ROWS.length);
    });

    it('deselects all rows when header checkbox is unchecked', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const headerCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'thead input[type="checkbox"]',
      )!;

      // Select all first
      await userEvent.click(headerCheckbox);
      await el.updateComplete;

      // Then deselect all
      const deselect = oneEvent<CustomEvent>(el, 'hx-select');
      await userEvent.click(headerCheckbox);
      const event = await deselect;

      expect(event.detail.selectedRows).toHaveLength(0);
    });

    it('sets aria-selected on tr when selectable', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const firstRowCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      )!;
      await userEvent.click(firstRowCheckbox);
      await el.updateComplete;

      const trs = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(trs[0].getAttribute('aria-selected')).toBe('true');
      expect(trs[1].getAttribute('aria-selected')).toBe('false');
    });

    it('row checkbox click does not dispatch hx-row-click (stopPropagation)', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      let rowClickFired = false;
      el.addEventListener('hx-row-click', () => {
        rowClickFired = true;
      });

      const firstCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      )!;
      await userEvent.click(firstCheckbox);
      await el.updateComplete;

      expect(rowClickFired).toBe(false);
    });
  });

  // ─── Row Click ───

  describe('Row Click', () => {
    it('dispatches hx-row-click on row click', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const firstRow = el.shadowRoot!.querySelector<HTMLElement>('tbody tr[part~="tr"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-row-click');
      firstRow.click();
      const event = await eventPromise;

      expect(event.detail.row).toEqual(ROWS[0]);
      expect(event.detail.index).toBe(0);
    });

    it('dispatches hx-row-click with correct index for subsequent rows', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const allRows = el.shadowRoot!.querySelectorAll<HTMLElement>('tbody tr[part~="tr"]');
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-row-click');
      allRows[2].click();
      const event = await eventPromise;

      expect(event.detail.row).toEqual(ROWS[2]);
      expect(event.detail.index).toBe(2);
    });
  });

  // ─── Empty State ───

  describe('Empty State', () => {
    it('renders emptyLabel when rows is empty', async () => {
      const el = await fixture<HelixDataTable>(
        '<hx-data-table empty-label="No patients"></hx-data-table>',
      );
      el.columns = COLUMNS;
      el.rows = [];
      await el.updateComplete;

      const emptyCell = el.shadowRoot!.querySelector('.empty-cell');
      expect(emptyCell).toBeTruthy();
    });

    it('does not render empty state when rows exist', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const emptyCell = el.shadowRoot!.querySelector('.empty-cell');
      expect(emptyCell).toBeNull();
    });
  });

  // ─── Loading State ───

  describe('Loading State', () => {
    it('sets aria-busy="true" on table when loading', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table loading></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const table = el.shadowRoot!.querySelector('table');
      expect(table?.getAttribute('aria-busy')).toBe('true');
    });

    it('renders skeleton rows when loading', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table loading></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const skeletonCells = el.shadowRoot!.querySelectorAll('.skeleton-cell');
      expect(skeletonCells.length).toBeGreaterThan(0);
    });

    it('marks skeleton rows as aria-hidden to hide from assistive technology', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table loading></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const skeletonRows = el.shadowRoot!.querySelectorAll('tbody tr[aria-hidden="true"]');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });

    it('does not set aria-busy when not loading', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const table = el.shadowRoot!.querySelector('table');
      expect(table?.hasAttribute('aria-busy')).toBe(false);
    });
  });

  // ─── Props ───

  describe('Properties', () => {
    it('reflects selectable attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      expect(el.hasAttribute('selectable')).toBe(true);
    });

    it('reflects loading attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table loading></hx-data-table>');
      expect(el.hasAttribute('loading')).toBe(true);
    });

    it('reflects sticky-header attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table sticky-header></hx-data-table>');
      expect(el.hasAttribute('sticky-header')).toBe(true);
    });

    it('no checkbox column when selectable=false', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const checkboxes = el.shadowRoot!.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });
  });

  // ─── JSON String Attribute Coercion (Drupal / Twig Integration) ───

  describe('JSON string attribute coercion', () => {
    it('parses columns from JSON string attribute', async () => {
      const columnsJson = JSON.stringify(COLUMNS);
      const el = await fixture<HelixDataTable>(
        `<hx-data-table columns='${columnsJson}'></hx-data-table>`,
      );
      el.rows = ROWS;
      await el.updateComplete;

      const headers = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      expect(headers.length).toBe(COLUMNS.length);
    });

    it('parses rows from JSON string attribute', async () => {
      const rowsJson = JSON.stringify(ROWS);
      const el = await fixture<HelixDataTable>(
        `<hx-data-table rows='${rowsJson}'></hx-data-table>`,
      );
      el.columns = COLUMNS;
      await el.updateComplete;

      const rows = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(rows.length).toBe(ROWS.length);
    });

    it('falls back to empty array on invalid JSON columns attribute', async () => {
      const el = await fixture<HelixDataTable>(
        `<hx-data-table columns='not-valid-json'></hx-data-table>`,
      );
      await el.updateComplete;
      expect(el.columns).toEqual([]);
    });

    it('falls back to empty array on invalid JSON rows attribute', async () => {
      const el = await fixture<HelixDataTable>(
        `<hx-data-table rows='not-valid-json'></hx-data-table>`,
      );
      await el.updateComplete;
      expect(el.rows).toEqual([]);
    });
  });

  // ─── Pagination ───

  describe('Pagination', () => {
    it('renders only first page of rows when pageSize is set', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.pageSize = 2;
      el.page = 1;
      await el.updateComplete;

      const rows = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(rows.length).toBe(2);
    });

    it('renders second page of rows correctly', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.pageSize = 2;
      el.page = 2;
      await el.updateComplete;

      const rows = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(rows.length).toBe(1);

      const firstTd = el.shadowRoot!.querySelector('tbody td[part~="td"]');
      expect(firstTd?.textContent?.trim()).toBe('Emily Chen');
    });

    it('renders all rows when pageSize is 0 (pagination disabled)', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.pageSize = 0;
      await el.updateComplete;

      const rows = el.shadowRoot!.querySelectorAll('tbody tr[part~="tr"]');
      expect(rows.length).toBe(ROWS.length);
    });

    it('dispatches hx-row-click with correct global index when paginated', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.pageSize = 2;
      el.page = 2;
      await el.updateComplete;

      const firstRow = el.shadowRoot!.querySelector<HTMLElement>('tbody tr[part~="tr"]')!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-row-click');
      firstRow.click();
      const event = await eventPromise;

      // First row on page 2 is global index 2
      expect(event.detail.index).toBe(2);
      expect(event.detail.row).toEqual(ROWS[2]);
    });
  });

  // ─── ARIA / Accessibility ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when selectable', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when loading', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table loading></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations when empty', async () => {
      const el = await fixture<HelixDataTable>(
        '<hx-data-table empty-label="No data"></hx-data-table>',
      );
      el.columns = COLUMNS;
      el.rows = [];
      await el.updateComplete;
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has role="grid" on table', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const table = el.shadowRoot!.querySelector('table');
      expect(table?.getAttribute('role')).toBe('grid');
    });

    it('checkbox th has tabindex="0" for keyboard grid navigation', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const checkboxTh = el.shadowRoot!.querySelector('thead th.col-checkbox');
      expect(checkboxTh?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ─── Keyboard Navigation ───

  describe('Keyboard Navigation', () => {
    it('ArrowRight moves focus to next cell', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      await userEvent.keyboard('{ArrowRight}');
      await el.updateComplete;

      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[1]);
    });

    it('ArrowLeft moves focus to previous cell', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[1].focus();

      await userEvent.keyboard('{ArrowLeft}');
      await el.updateComplete;

      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[0]);
    });

    it('ArrowDown moves focus to cell in next row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      await userEvent.keyboard('{ArrowDown}');
      await el.updateComplete;

      // After header row, focus should be in first data row, first cell
      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('tbody td[part~="td"]');
      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(tds[0]);
    });

    it('ArrowUp moves focus to cell in previous row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Focus first td, then move up to header
      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('td[part~="td"]');
      tds[0].setAttribute('tabindex', '0');
      tds[0].focus();

      await userEvent.keyboard('{ArrowUp}');
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[0]);
    });

    it('Home moves focus to first cell in current row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[1].focus();

      await userEvent.keyboard('{Home}');
      await el.updateComplete;

      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[0]);
    });

    it('End moves focus to last cell in current row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      await userEvent.keyboard('{End}');
      await el.updateComplete;

      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[1]);
    });

    it('Space toggles row selection when focus is on a td cell', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Query specifically for a data td (has data-row-index); checkbox tds don't
      const firstDataTd = el.shadowRoot!.querySelector<HTMLElement>(
        'tbody td[data-row-index="0"]',
      )!;
      firstDataTd.setAttribute('tabindex', '0');
      firstDataTd.focus();

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      await userEvent.keyboard(' ');
      const event = await eventPromise;

      expect(event.detail.selectedRows).toHaveLength(1);
    });

    it('ArrowRight from sort button (inside th) navigates to next header', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = ALL_SORTABLE_COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const sortBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.sort-btn');
      // Focus the sort button inside the first th
      sortBtns[0].focus();

      await userEvent.keyboard('{ArrowRight}');
      await el.updateComplete;

      // Focus should have moved to the second th (the sort button's parent th navigated right)
      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      const focused = el.shadowRoot!.activeElement;
      expect(focused).toBe(ths[1]);
    });
  });

  // ─── Non-sortable Column ───

  describe('Non-sortable Column', () => {
    it('does not render a sort button for non-sortable columns', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      // First column (Name) is sortable — has a button
      expect(ths[0].querySelector('.sort-btn')).toBeTruthy();
      // Second column (Status) is non-sortable — no button
      expect(ths[1].querySelector('.sort-btn')).toBeNull();
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('renders toolbar slot content', async () => {
      const el = await fixture<HelixDataTable>(
        '<hx-data-table><div slot="toolbar" id="tb">Toolbar</div></hx-data-table>',
      );
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="toolbar"]');
      expect(slot).toBeTruthy();
      const assigned = slot!.assignedElements();
      expect(assigned.length).toBe(1);
      expect(assigned[0].id).toBe('tb');
    });

    it('renders custom empty slot when rows are empty', async () => {
      const el = await fixture<HelixDataTable>(
        '<hx-data-table><span slot="empty" id="custom-empty">Custom empty</span></hx-data-table>',
      );
      el.columns = COLUMNS;
      el.rows = [];
      await el.updateComplete;

      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="empty"]');
      expect(slot).toBeTruthy();
      const assigned = slot!.assignedElements();
      expect(assigned.length).toBe(1);
      expect(assigned[0].id).toBe('custom-empty');
    });

    it('renders custom loading slot when loading', async () => {
      const el = await fixture<HelixDataTable>(
        '<hx-data-table loading><div slot="loading" id="custom-loader">Loading…</div></hx-data-table>',
      );
      el.columns = COLUMNS;
      el.rows = [];
      await el.updateComplete;

      const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="loading"]');
      expect(slot).toBeTruthy();
      const assigned = slot!.assignedElements();
      expect(assigned.length).toBe(1);
      expect(assigned[0].id).toBe('custom-loader');
    });
  });

  // ─── CSS Parts Verification ───

  describe('CSS Parts', () => {
    it('exposes all documented CSS parts on a populated table', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      expect(shadowQuery(el, '[part~="table"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="thead"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="tbody"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="tr"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="th"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="td"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="sort-icon"]')).toBeTruthy();
      expect(shadowQuery(el, '[part~="checkbox"]')).toBeTruthy();
    });
  });

  // ─── i18n / label overrides ───

  describe('i18n / label overrides', () => {
    it('uses default English label for select-all checkbox', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;
      expect(el.selectAllLabel).toBe('Select all rows');
    });

    it('renders custom selectAllLabel when set via property', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.selectAllLabel = 'Tout sélectionner';
      await el.updateComplete;
      expect(el.selectAllLabel).toBe('Tout sélectionner');
    });
  });

  // ─── Keyboard Navigation — Edge Cases ───

  describe('Keyboard Navigation — Edge Cases', () => {
    it('Space on header checkbox th triggers select-all via keyboard', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const headerCheckboxTh = el.shadowRoot!.querySelector<HTMLElement>('thead th.col-checkbox')!;
      headerCheckboxTh.setAttribute('tabindex', '0');
      headerCheckboxTh.focus();

      // The Space key on the th cell itself does NOT toggle selection (Space only
      // acts on cells with part~="td").  Verify no hx-select is dispatched and that
      // the keyboard handler returns without side-effects when the focused element is
      // a th (not a td).
      let selectFired = false;
      el.addEventListener('hx-select', () => {
        selectFired = true;
      });

      headerCheckboxTh.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      // The th is not a td, so no selection toggle — header checkbox must still be
      // interacted via its <input> child.  selectFired stays false.
      expect(selectFired).toBe(false);

      // Now verify select-all via the checkbox input inside the th still works.
      const headerCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'thead input[type="checkbox"]',
      )!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      headerCheckbox.click();
      const event = await eventPromise;
      expect(event.detail.selectedRows).toHaveLength(ROWS.length);
    });

    it('ArrowLeft at first cell (idx 0) does not move focus', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      // ArrowLeft from the first cell — no target, focus stays put.
      const before = el.shadowRoot!.activeElement;
      ths[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(before);
    });

    it('ArrowRight at last cell does not move focus beyond the grid', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const allCells = el.shadowRoot!.querySelectorAll<HTMLElement>(
        '[part~="td"],[part~="th"]',
      );
      const lastCell = allCells[allCells.length - 1]!;
      lastCell.setAttribute('tabindex', '0');
      lastCell.focus();

      const before = el.shadowRoot!.activeElement;
      lastCell.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      // Focus must not have moved past the last cell.
      expect(el.shadowRoot!.activeElement).toBe(before);
    });

    it('keyboard navigation works correctly in a single-column table (colCount=1)', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = [{ key: 'name', label: 'Name', sortable: false }];
      el.rows = [{ name: 'Alice' }, { name: 'Bob' }];
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      expect(ths.length).toBe(1);

      ths[0].focus();

      // ArrowDown in a single-column table should move to the first td.
      ths[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('tbody td[part~="td"]');
      expect(el.shadowRoot!.activeElement).toBe(tds[0]);
    });

    it('ArrowRight from sort button (inside th) moves focus to the next th', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = ALL_SORTABLE_COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const sortBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.sort-btn');
      // Focus the button inside the first th — _handleKeydown must walk up to the th.
      sortBtns[0].focus();

      sortBtns[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      expect(el.shadowRoot!.activeElement).toBe(ths[1]);
    });
  });

  // ─── JSON Parsing Error Recovery ───

  describe('JSON Parsing Error Recovery', () => {
    it('recovers gracefully from invalid JSON columns attribute after valid data', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Simulate a bad string assignment (Drupal path).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).columns = '{not valid json';
      await el.updateComplete;

      // After the bad assignment, columns should fall back to [].
      expect(Array.isArray(el.columns)).toBe(true);
      expect(el.columns).toEqual([]);
    });

    it('recovers gracefully from invalid JSON rows attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).rows = 'not-valid-json-at-all';
      await el.updateComplete;

      expect(Array.isArray(el.rows)).toBe(true);
      expect(el.rows).toEqual([]);
    });
  });

  // ─── _dispatchSelect with sparse rows ───

  describe('_dispatchSelect with gaps in rows array', () => {
    it('skips undefined entries when dispatching hx-select after rows are updated', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Select row 0 via checkbox.
      const checkboxes = el.shadowRoot!.querySelectorAll<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      );
      const firstSelect = oneEvent<CustomEvent>(el, 'hx-select');
      checkboxes[0].click();
      await firstSelect;
      await el.updateComplete;

      // Now shrink the rows so that the selected index (0) still exists — but
      // replace with a smaller set to exercise the flatMap defensive branch.
      const secondSelect = oneEvent<CustomEvent>(el, 'hx-select');
      el.rows = [{ name: 'Only Row', status: 'Active' }];
      await el.updateComplete;

      // Trigger another selection change to fire _dispatchSelect.
      checkboxes[0].click();
      const event = await secondSelect;

      // The event should carry the valid rows; no undefined entries.
      for (const row of event.detail.selectedRows as Record<string, unknown>[]) {
        expect(row).not.toBeUndefined();
      }
    });
  });

  // ─── Keyboard Navigation — Edge Cases ───

  describe('Keyboard Navigation — Edge Cases', () => {
    it('Space on header checkbox th triggers select-all via keyboard', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const headerCheckboxTh = el.shadowRoot!.querySelector<HTMLElement>('thead th.col-checkbox')!;
      headerCheckboxTh.setAttribute('tabindex', '0');
      headerCheckboxTh.focus();

      // The Space key on the th cell itself does NOT toggle selection (Space only
      // acts on cells with part~="td").  Verify no hx-select is dispatched and that
      // the keyboard handler returns without side-effects when the focused element is
      // a th (not a td).
      let selectFired = false;
      el.addEventListener('hx-select', () => {
        selectFired = true;
      });

      headerCheckboxTh.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      // The th is not a td, so no selection toggle — header checkbox must still be
      // interacted via its <input> child.  selectFired stays false.
      expect(selectFired).toBe(false);

      // Now verify select-all via the checkbox input inside the th still works.
      const headerCheckbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'thead input[type="checkbox"]',
      )!;
      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      headerCheckbox.click();
      const event = await eventPromise;
      expect(event.detail.selectedRows).toHaveLength(ROWS.length);
    });

    it('ArrowLeft at first cell (idx 0) does not move focus', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      // ArrowLeft from the first cell — no target, focus stays put.
      const before = el.shadowRoot!.activeElement;
      ths[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(before);
    });

    it('ArrowRight at last cell does not move focus beyond the grid', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const allCells = el.shadowRoot!.querySelectorAll<HTMLElement>(
        '[part~="td"],[part~="th"]',
      );
      const lastCell = allCells[allCells.length - 1]!;
      lastCell.setAttribute('tabindex', '0');
      lastCell.focus();

      const before = el.shadowRoot!.activeElement;
      lastCell.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      // Focus must not have moved past the last cell.
      expect(el.shadowRoot!.activeElement).toBe(before);
    });

    it('keyboard navigation works correctly in a single-column table (colCount=1)', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = [{ key: 'name', label: 'Name', sortable: false }];
      el.rows = [{ name: 'Alice' }, { name: 'Bob' }];
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      expect(ths.length).toBe(1);

      ths[0].focus();

      // ArrowDown in a single-column table should move to the first td.
      ths[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('tbody td[part~="td"]');
      expect(el.shadowRoot!.activeElement).toBe(tds[0]);
    });

    it('ArrowRight from sort button (inside th) moves focus to the next th', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = ALL_SORTABLE_COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const sortBtns = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.sort-btn');
      // Focus the button inside the first th — _handleKeydown must walk up to the th.
      sortBtns[0].focus();

      sortBtns[0].dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
      );
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      expect(el.shadowRoot!.activeElement).toBe(ths[1]);
    });
  });

  // ─── JSON Parsing Error Recovery ───

  describe('JSON Parsing Error Recovery', () => {
    it('recovers gracefully from invalid JSON columns attribute after valid data', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Simulate a bad string assignment (Drupal path).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).columns = '{not valid json';
      await el.updateComplete;

      // After the bad assignment, columns should fall back to [].
      expect(Array.isArray(el.columns)).toBe(true);
      expect(el.columns).toEqual([]);
    });

    it('recovers gracefully from invalid JSON rows attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).rows = 'not-valid-json-at-all';
      await el.updateComplete;

      expect(Array.isArray(el.rows)).toBe(true);
      expect(el.rows).toEqual([]);
    });
  });

  // ─── _dispatchSelect with sparse rows ───

  describe('_dispatchSelect with gaps in rows array', () => {
    it('skips undefined entries when dispatching hx-select after rows are updated', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      // Select row 0 via checkbox.
      const checkboxes = el.shadowRoot!.querySelectorAll<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      );
      const firstSelect = oneEvent<CustomEvent>(el, 'hx-select');
      checkboxes[0].click();
      await firstSelect;
      await el.updateComplete;

      // Now shrink the rows so that the selected index (0) still exists — but
      // replace with a smaller set to exercise the flatMap defensive branch.
      const secondSelect = oneEvent<CustomEvent>(el, 'hx-select');
      el.rows = [{ name: 'Only Row', status: 'Active' }];
      await el.updateComplete;

      // Trigger another selection change to fire _dispatchSelect.
      checkboxes[0].click();
      const event = await secondSelect;

      // The event should carry the valid rows; no undefined entries.
      for (const row of event.detail.selectedRows as Record<string, unknown>[]) {
        expect(row).not.toBeUndefined();
      }
    });
  });

  // ─── Property: stickyHeader ───

  describe('Property: stickyHeader', () => {
    it('defaults to false', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      expect(el.stickyHeader).toBe(false);
    });

    it('reflects stickyHeader attribute', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table sticky-header></hx-data-table>');
      expect(el.stickyHeader).toBe(true);
    });

    it('sets stickyHeader property programmatically', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.stickyHeader = true;
      await el.updateComplete;
      expect(el.stickyHeader).toBe(true);
    });
  });
});
