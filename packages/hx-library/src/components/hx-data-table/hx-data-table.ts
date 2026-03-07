import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDataTableStyles } from './hx-data-table.styles.js';

/**
 * Column definition for `hx-data-table`.
 */
export interface HxDataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Sort state exported for TypeScript consumers and CEM event types.
 */
export interface HxDataTableSortState {
  key: string;
  direction: 'asc' | 'desc';
}

/**
 * An enterprise data table with sorting, row selection, and keyboard navigation.
 *
 * @summary Enterprise data table with sorting, selection, and responsive scroll.
 *
 * @tag hx-data-table
 *
 * @slot toolbar - Content rendered above the table (e.g., search, actions).
 * @slot empty - Custom empty-state content rendered when `rows` is empty and not loading.
 * @slot loading - Custom loading content rendered when `loading` is true.
 *
 * @fires {CustomEvent<HxDataTableSortState>} hx-sort - Dispatched when a sortable column header is clicked.
 * @fires {CustomEvent<{selectedRows: Record<string, unknown>[]}>} hx-select - Dispatched when row selection changes.
 * @fires {CustomEvent<{row: Record<string, unknown>, index: number}>} hx-row-click - Dispatched when a data row is clicked.
 *
 * @csspart table - The `<table>` element.
 * @csspart thead - The `<thead>` element.
 * @csspart tbody - The `<tbody>` element.
 * @csspart tr - Each `<tr>` element.
 * @csspart th - Each `<th>` element.
 * @csspart td - Each `<td>` element.
 * @csspart sort-icon - The sort indicator icon `<span>` inside sortable headers.
 * @csspart checkbox - Each `<input type="checkbox">` element.
 *
 * @cssprop [--hx-data-table-header-bg=var(--hx-color-neutral-50)] - Header background color.
 * @cssprop [--hx-data-table-header-color=var(--hx-color-neutral-700)] - Header text color.
 * @cssprop [--hx-data-table-cell-color=var(--hx-color-neutral-900)] - Cell text color.
 * @cssprop [--hx-data-table-border-color=var(--hx-color-neutral-200)] - Row border color.
 * @cssprop [--hx-data-table-row-hover-bg=var(--hx-color-neutral-50)] - Row hover background.
 * @cssprop [--hx-data-table-row-selected-bg=var(--hx-color-primary-50)] - Selected row background.
 * @cssprop [--hx-data-table-empty-color=var(--hx-color-neutral-600)] - Empty state text color.
 * @cssprop [--hx-data-table-min-width=600px] - Minimum table width before horizontal scrolling.
 */
@customElement('hx-data-table')
export class HelixDataTable extends LitElement {
  static override styles = [tokenStyles, helixDataTableStyles];

  // ─── Public Properties ───

  /**
   * Column definitions. Each item: `{ key, label, sortable?, width? }`.
   * Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute).
   * @attr columns
   */
  @property({ type: Array })
  columns: HxDataTableColumn[] = [];

  /**
   * Row data. Each item is a plain object keyed by column `key` values.
   * Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute).
   * @attr rows
   */
  @property({ type: Array })
  rows: Record<string, unknown>[] = [];

  /**
   * When true, renders a checkbox column for row selection.
   * @attr selectable
   */
  @property({ type: Boolean, reflect: true })
  selectable = false;

  /**
   * The column key currently used for sorting.
   * @attr sort-key
   */
  @property({ type: String, attribute: 'sort-key' })
  sortKey = '';

  /**
   * Current sort direction.
   * @attr sort-direction
   */
  @property({ type: String, attribute: 'sort-direction' })
  sortDirection: 'asc' | 'desc' = 'asc';

  /**
   * When true, renders a loading skeleton and sets `aria-busy="true"` on the host.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Text displayed in the default empty state when `rows` is empty and not loading.
   * @attr empty-label
   */
  @property({ type: String, attribute: 'empty-label' })
  emptyLabel = 'No data';

  /**
   * When true, the header row is sticky (position: sticky; top: 0).
   * @attr sticky-header
   */
  @property({ type: Boolean, reflect: true, attribute: 'sticky-header' })
  stickyHeader = false;

  /**
   * Current page (1-based). Set to 0 or leave at default (0) to disable pagination.
   * @attr page
   */
  @property({ type: Number })
  page = 1;

  /**
   * Number of rows per page. Set to 0 to disable pagination (show all rows).
   * @attr page-size
   */
  @property({ type: Number, attribute: 'page-size' })
  pageSize = 0;

  // ─── Internal State ───

  @state()
  private _selectedRows: Set<number> = new Set();

  // ─── Lifecycle ───

  override willUpdate(changed: Map<string, unknown>): void {
    // Coerce JSON strings to arrays — this is the Drupal/Twig integration path.
    // Lit does not JSON-parse array attributes automatically, so we do it here.
    if (changed.has('columns') && typeof (this.columns as unknown) === 'string') {
      try {
        this.columns = JSON.parse(this.columns as unknown as string) as HxDataTableColumn[];
      } catch {
        this.columns = [];
      }
    }
    if (changed.has('rows') && typeof (this.rows as unknown) === 'string') {
      try {
        this.rows = JSON.parse(this.rows as unknown as string) as Record<string, unknown>[];
      } catch {
        this.rows = [];
      }
    }
    // Only warn when rows actually changes to avoid noise on every property update.
    if (changed.has('rows') && this.rows.length > 500) {
      console.warn(
        '[hx-data-table] Rendering more than 500 rows may impact performance. Consider server-side pagination.',
      );
    }
  }

  // ─── Event Handlers ───

  private _handleSort(key: string): void {
    const direction =
      this.sortKey === key ? (this.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
    this.sortKey = key;
    this.sortDirection = direction;
    this.dispatchEvent(
      new CustomEvent<HxDataTableSortState>('hx-sort', {
        bubbles: true,
        composed: true,
        detail: { key, direction },
      }),
    );
  }

  private _handleRowClick(row: Record<string, unknown>, index: number): void {
    this.dispatchEvent(
      new CustomEvent('hx-row-click', {
        bubbles: true,
        composed: true,
        detail: { row, index },
      }),
    );
  }

  private _handleSelect(index: number, checked: boolean): void {
    const next = new Set(this._selectedRows);
    if (checked) {
      next.add(index);
    } else {
      next.delete(index);
    }
    this._selectedRows = next;
    this._dispatchSelect();
  }

  private _handleSelectAll(checked: boolean): void {
    this._selectedRows = checked ? new Set(this.rows.map((_, i) => i)) : new Set<number>();
    this._dispatchSelect();
  }

  private _dispatchSelect(): void {
    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: {
          selectedRows: [...this._selectedRows].map((i) => this.rows[i]),
        },
      }),
    );
  }

  // ─── Keyboard Navigation ───

  private _handleKeydown(e: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(e.key))
      return;

    const root = this.shadowRoot;
    if (!root) return;

    const cells = Array.from(root.querySelectorAll<HTMLElement>('[part~="td"],[part~="th"]'));

    // When focus is inside a child element (e.g., the sort <button> inside a <th>),
    // shadowRoot.activeElement returns the child, not the cell. Walk up to find the cell.
    let focused = root.activeElement as HTMLElement | null;
    if (!focused) return;

    if (cells.indexOf(focused) === -1) {
      let ancestor = focused.parentElement;
      while (ancestor) {
        if (cells.includes(ancestor as HTMLElement)) {
          focused = ancestor as HTMLElement;
          break;
        }
        ancestor = ancestor.parentElement;
      }
    }

    const colCount = this.columns.length + (this.selectable ? 1 : 0);
    const idx = cells.indexOf(focused);
    if (idx === -1) return;

    let target: HTMLElement | null = null;

    if (e.key === 'ArrowRight' && idx + 1 < cells.length) {
      target = cells[idx + 1] ?? null;
    } else if (e.key === 'ArrowLeft' && idx - 1 >= 0) {
      target = cells[idx - 1] ?? null;
    } else if (e.key === 'ArrowDown' && idx + colCount < cells.length) {
      target = cells[idx + colCount] ?? null;
    } else if (e.key === 'ArrowUp' && idx - colCount >= 0) {
      target = cells[idx - colCount] ?? null;
    } else if (e.key === 'Home') {
      // First cell of the current row
      const rowStart = idx - (idx % colCount);
      target = cells[rowStart] ?? null;
    } else if (e.key === 'End') {
      // Last cell of the current row
      const rowEnd = Math.min(idx - (idx % colCount) + colCount - 1, cells.length - 1);
      target = cells[rowEnd] ?? null;
    } else if (e.key === ' ' && focused.getAttribute('part')?.includes('td')) {
      // Toggle selection on Space in a data row
      const rowIdx = Number(focused.dataset['rowIndex']);
      if (this.selectable && !isNaN(rowIdx)) {
        e.preventDefault();
        this._handleSelect(rowIdx, !this._selectedRows.has(rowIdx));
      }
      return;
    }

    if (target) {
      e.preventDefault();
      target.setAttribute('tabindex', '0');
      target.focus();
      focused.setAttribute('tabindex', '-1');
    }
  }

  // ─── Render Helpers ───

  private _renderSortIcon(key: string) {
    const isActive = this.sortKey === key;
    const iconClass = [
      'sort-icon',
      isActive ? 'sort-icon--active' : '',
      isActive && this.sortDirection === 'desc' ? 'sort-icon--desc' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <span part="sort-icon" class=${iconClass} aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          width="16"
          height="16"
        >
          <path d="M8 3L5 7h6L8 3zM8 13l3-4H5l3 4z" fill-rule="evenodd" />
        </svg>
      </span>
    `;
  }

  private _renderHeaderRow() {
    return html`
      <tr part="tr">
        ${this.selectable
          ? html`
              <th part="th" class="col-checkbox" tabindex="0">
                <input
                  type="checkbox"
                  part="checkbox"
                  aria-label="Select all rows"
                  .indeterminate=${this._selectedRows.size > 0 &&
                  this._selectedRows.size < this.rows.length}
                  .checked=${this._selectedRows.size === this.rows.length && this.rows.length > 0}
                  @change=${(e: Event) =>
                    this._handleSelectAll((e.target as HTMLInputElement).checked)}
                />
              </th>
            `
          : nothing}
        ${this.columns.map(
          (col) => html`
            <th
              part="th"
              tabindex="0"
              style=${col.width ? `width: ${col.width}` : ''}
              aria-sort=${col.sortable
                ? this.sortKey === col.key
                  ? this.sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : nothing}
            >
              ${col.sortable
                ? html`
                    <button
                      class="sort-btn"
                      @click=${() => this._handleSort(col.key)}
                      aria-label=${this.sortKey === col.key
                        ? `Sort by ${col.label}, currently sorted ${this.sortDirection === 'asc' ? 'ascending' : 'descending'}`
                        : `Sort by ${col.label}`}
                    >
                      ${col.label} ${this._renderSortIcon(col.key)}
                    </button>
                  `
                : col.label}
            </th>
          `,
        )}
      </tr>
    `;
  }

  private _renderSkeletonRows() {
    return Array.from(
      { length: 3 },
      (_, i) => html`
        <tr part="tr" aria-hidden="true" key=${i}>
          ${this.selectable
            ? html`<td part="td" class="col-checkbox">
                <span class="skeleton-cell" style="width:1rem;margin:auto"></span>
              </td>`
            : nothing}
          ${this.columns.map(
            () => html`
              <td part="td">
                <span class="skeleton-cell"></span>
              </td>
            `,
          )}
        </tr>
      `,
    );
  }

  private _renderEmptyRow() {
    const colSpan = this.columns.length + (this.selectable ? 1 : 0);
    return html`
      <tr part="tr">
        <td part="td" colspan=${colSpan} class="empty-cell">
          <slot name="empty">${this.emptyLabel}</slot>
        </td>
      </tr>
    `;
  }

  private _renderDataRows() {
    let displayRows = this.rows;

    // Client-side pagination when pageSize > 0
    if (this.pageSize > 0) {
      const start = (this.page - 1) * this.pageSize;
      displayRows = this.rows.slice(start, start + this.pageSize);
    }

    return displayRows.map((row, pageIndex) => {
      // The global row index for selection and events
      const globalIndex =
        this.pageSize > 0 ? (this.page - 1) * this.pageSize + pageIndex : pageIndex;
      return html`
        <tr
          part="tr"
          aria-selected=${this.selectable ? String(this._selectedRows.has(globalIndex)) : nothing}
          @click=${() => this._handleRowClick(row, globalIndex)}
        >
          ${this.selectable
            ? html`
                <td part="td" class="col-checkbox">
                  <input
                    type="checkbox"
                    part="checkbox"
                    aria-label=${`Select row ${globalIndex + 1}`}
                    .checked=${this._selectedRows.has(globalIndex)}
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${(e: Event) =>
                      this._handleSelect(globalIndex, (e.target as HTMLInputElement).checked)}
                  />
                </td>
              `
            : nothing}
          ${this.columns.map(
            (col) => html`
              <td part="td" tabindex="-1" data-row-index=${globalIndex}>
                ${row[col.key] != null ? String(row[col.key]) : ''}
              </td>
            `,
          )}
        </tr>
      `;
    });
  }

  // ─── Render ───

  override render() {
    return html`
      <slot name="toolbar"></slot>
      <div class="table-wrapper">
        <table
          part="table"
          role="grid"
          aria-busy=${this.loading ? 'true' : nothing}
          @keydown=${this._handleKeydown}
        >
          <thead part="thead">
            ${this._renderHeaderRow()}
          </thead>
          <tbody part="tbody">
            ${this.loading
              ? html`<slot name="loading">${this._renderSkeletonRows()}</slot>`
              : this.rows.length === 0
                ? this._renderEmptyRow()
                : this._renderDataRows()}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-data-table': HelixDataTable;
  }
}
