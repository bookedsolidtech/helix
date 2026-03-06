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
      const cols = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
      ];
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = cols;
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

    it('sets aria-sort="ascending" on active column header', async () => {
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

    it('does not set aria-sort on non-sortable column', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      el.sortKey = 'name';
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll('th[part~="th"]');
      // COLUMNS[1] (Status) has sortable: false
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

  // ─── Checkbox StopPropagation ───

  describe('Checkbox StopPropagation', () => {
    it('clicking checkbox does not fire hx-row-click', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      let rowClickFired = false;
      el.addEventListener('hx-row-click', () => {
        rowClickFired = true;
      });

      const checkbox = el.shadowRoot!.querySelector<HTMLInputElement>(
        'tbody input[type="checkbox"]',
      )!;
      await userEvent.click(checkbox);
      await el.updateComplete;

      expect(rowClickFired).toBe(false);
    });
  });

  // ─── JSON String Coercion ───

  describe('JSON String Coercion', () => {
    it('parses columns from JSON string attribute', async () => {
      const colsJson = JSON.stringify(COLUMNS);
      const el = await fixture<HelixDataTable>(
        `<hx-data-table columns='${colsJson}'></hx-data-table>`,
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

    it('falls back to empty array on invalid JSON columns', async () => {
      const el = await fixture<HelixDataTable>(
        `<hx-data-table columns='not-valid-json'></hx-data-table>`,
      );
      await el.updateComplete;

      expect(el.columns).toEqual([]);
    });

    it('falls back to empty array on invalid JSON rows', async () => {
      const el = await fixture<HelixDataTable>(
        `<hx-data-table rows='not-valid-json'></hx-data-table>`,
      );
      await el.updateComplete;

      expect(el.rows).toEqual([]);
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
      ths[1].setAttribute('tabindex', '0');
      ths[1].focus();

      await userEvent.keyboard('{ArrowLeft}');
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(ths[0]);
    });

    it('ArrowDown moves focus to cell below', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('td[part~="td"]');
      ths[0].focus();

      await userEvent.keyboard('{ArrowDown}');
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(tds[0]);
    });

    it('ArrowUp moves focus to cell above', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('td[part~="td"]');
      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      tds[0].setAttribute('tabindex', '0');
      tds[0].focus();

      await userEvent.keyboard('{ArrowUp}');
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(ths[0]);
    });

    it('Home moves focus to first cell in the row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[1].setAttribute('tabindex', '0');
      ths[1].focus();

      await userEvent.keyboard('{Home}');
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(ths[0]);
    });

    it('End moves focus to last cell in the row', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const ths = el.shadowRoot!.querySelectorAll<HTMLElement>('th[part~="th"]');
      ths[0].focus();

      await userEvent.keyboard('{End}');
      await el.updateComplete;

      expect(el.shadowRoot!.activeElement).toBe(ths[COLUMNS.length - 1]);
    });

    it('Space toggles row selection when focused on a selectable cell', async () => {
      const el = await fixture<HelixDataTable>('<hx-data-table selectable></hx-data-table>');
      el.columns = COLUMNS;
      el.rows = ROWS;
      await el.updateComplete;

      const tds = el.shadowRoot!.querySelectorAll<HTMLElement>('td[part~="td"][data-row-index]');
      tds[0].setAttribute('tabindex', '0');
      tds[0].focus();

      const eventPromise = oneEvent<CustomEvent>(el, 'hx-select');
      await userEvent.keyboard('{ }');
      const event = await eventPromise;

      expect(event.detail.selectedRows).toHaveLength(1);
    });
  });
});
