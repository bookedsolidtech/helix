import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { HelixElement } from '../../base/index.js';
import { helixDataTableStyles } from './hx-data-table.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';

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

/** Detail for the hx-select event dispatched by hx-data-table. */
export interface HxDataTableSelectDetail {
  selectedRows: Record<string, unknown>[];
}

/** Detail for the hx-row-click event dispatched by hx-data-table. */
export interface HxDataTableRowClickDetail {
  row: Record<string, unknown>;
  index: number;
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
 * @cssprop [--hx-data-table-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-data-table-shimmer-duration=1.5s] - CSS custom property.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-opacity-25] - Opacity.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-opacity-100] - Opacity.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-size-4] - Size token.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-opacity-50] - Opacity.
 * @cssprop [--hx-space-8] - Spacing token.
 */
@customElement('hx-data-table')
export class HelixDataTable extends HelixElement {
  static override styles = [helixDataTableStyles, forcedColorsSurface];

  // ─── Public Properties ───

  /**
   * Column definitions. Each item: `{ key, label, sortable?, width? }`.
   * Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute).
   * @attr columns
   */
  @property({
    type: Array,
    converter: {
      fromAttribute(value: string | null) {
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
    },
  })
  columns: HxDataTableColumn[] = [];

  /**
   * Row data. Each item is a plain object keyed by column `key` values.
   * Can be set as a JS array or a JSON string (e.g., from a Drupal Twig attribute).
   * @attr rows
   */
  @property({
    type: Array,
    converter: {
      fromAttribute(value: string | null) {
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
    },
  })
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
   * Accessible name for the table. Exposed via `aria-label` on the `<table>` element.
   * Required when the table has columns — a missing label is a WCAG 4.1.2 violation.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Accessible label for the "select all rows" checkbox in the table header.
   * @attr select-all-label
   */
  @property({ attribute: 'select-all-label' })
  selectAllLabel = 'Select all rows';

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

  /** @internal */
  @state()
  private _selectedRows: Set<number> = new Set();

  /**
   * Cached flat list of all td/th cells in the shadow DOM.
   * Invalidated (set to null) whenever rows or columns change so the next keydown
   * re-queries the DOM and re-caches. Avoids repeated querySelectorAll on every keypress.
   * @internal
   */
  private _cachedCells: HTMLElement[] | null = null;

  /**
   * Index (within the columns array) of the sortable header that currently holds
   * roving tabindex focus. -1 means no sortable header has been focused yet;
   * the first sortable column will receive tabindex="0" by default.
   * @internal
   */
  @state() private _focusedHeaderIndex = -1;

  /**
   * Resolved columns array. Computed in willUpdate from the public `columns`
   * property which may be a JSON string (Drupal/Twig path) or a JS array.
   * All internal reads use this field to avoid mutating reactive properties
   * inside willUpdate (which would trigger extra update cycles).
   * @internal
   */
  @state() private _resolvedColumns: HxDataTableColumn[] = [];

  /**
   * Resolved rows array. Computed in willUpdate from the public `rows`
   * property which may be a JSON string (Drupal/Twig path) or a JS array.
   * @internal
   */
  @state() private _resolvedRows: Record<string, unknown>[] = [];

  // ─── Lifecycle ───

  override willUpdate(changed: PropertyValues<this>): void {
    // Coerce JSON strings to arrays — this is the Drupal/Twig integration path.
    // Lit does not JSON-parse array attributes automatically, so we do it here.
    // Note: Lit's defaultConverter returns null (not a string) when JSON.parse fails for
    // type: Array — so we guard against both string and any non-array value.
    //
    // We write to private @state() resolved fields instead of mutating the public
    // reactive properties. Mutating @property fields inside willUpdate triggers an
    // additional update cycle; writing to separate @state fields does not because
    // Lit batches all changes within the same willUpdate into a single render.
    if (changed.has('columns')) {
      const rawColumns: unknown = this.columns;
      if (typeof rawColumns === 'string') {
        try {
          this._resolvedColumns = JSON.parse(rawColumns) as HxDataTableColumn[];
        } catch {
          this._resolvedColumns = [];
        }
      } else if (Array.isArray(this.columns)) {
        this._resolvedColumns = this.columns;
      } else {
        this._resolvedColumns = [];
      }
    }
    if (changed.has('rows')) {
      const rawRows: unknown = this.rows;
      if (typeof rawRows === 'string') {
        try {
          this._resolvedRows = JSON.parse(rawRows) as Record<string, unknown>[];
        } catch {
          this._resolvedRows = [];
        }
      } else if (Array.isArray(this.rows)) {
        this._resolvedRows = this.rows;
      } else {
        this._resolvedRows = [];
      }
    }
    // Only warn when rows actually changes to avoid noise on every property update.
    if (changed.has('rows') && this._resolvedRows.length > 500) {
      devWarn(
        'hx-data-table',
        'Rendering more than 500 rows may impact performance. Consider server-side pagination.',
      );
    }
    // WCAG 4.1.2: data tables must have an accessible name so screen readers can identify them.
    if (
      (changed.has('label') || changed.has('columns')) &&
      this._resolvedColumns.length > 0 &&
      !this.label
    ) {
      devWarn(
        'hx-data-table',
        'No accessible name provided. Set the `label` attribute so screen readers can identify this table (WCAG 4.1.2).',
      );
    }
  }

  override updated(changed: PropertyValues<this>): void {
    // Invalidate cell cache when rows or columns change so the next keyboard
    // navigation re-queries and re-caches the updated DOM. We check the public
    // properties because _resolvedColumns/_resolvedRows are derived from them
    // in willUpdate and always change in lockstep.
    if (changed.has('rows') || changed.has('columns')) {
      this._cachedCells = null;
    }
  }

  // ─── Event Handlers ───

  /** @internal */
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

  /** @internal */
  private _handleRowClick(row: Record<string, unknown>, index: number): void {
    this.dispatchEvent(
      new CustomEvent<{ row: Record<string, unknown>; index: number }>('hx-row-click', {
        bubbles: true,
        composed: true,
        detail: { row, index },
      }),
    );
  }

  /** @internal */
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

  /** @internal */
  private _handleSelectAll(checked: boolean): void {
    this._selectedRows = checked ? new Set(this._resolvedRows.map((_, i) => i)) : new Set<number>();
    this._dispatchSelect();
  }

  /** @internal */
  private _dispatchSelect(): void {
    this.dispatchEvent(
      new CustomEvent<{ selectedRows: Record<string, unknown>[] }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: {
          selectedRows: [...this._selectedRows].flatMap((i) => {
            const row = this._resolvedRows[i];
            return row !== undefined ? [row] : [];
          }),
        },
      }),
    );
  }

  // ─── Keyboard Navigation ───

  /** @internal */
  private _handleKeydown(e: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(e.key))
      return;

    const root = this.shadowRoot;
    if (!root) return;

    // Use cached cell list; re-query only when invalidated by rows/columns change
    if (!this._cachedCells) {
      this._cachedCells = Array.from(
        root.querySelectorAll<HTMLElement>('[part~="td"],[part~="th"]'),
      );
    }
    const cells = this._cachedCells;

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

    const colCount = this._resolvedColumns.length + (this.selectable ? 1 : 0);
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

  /** @internal */
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

  /**
   * Returns the indices (within the columns array) of all sortable columns.
   * @internal
   */
  private get _sortableIndices(): number[] {
    return this._resolvedColumns.reduce<number[]>((acc, col, i) => {
      if (col.sortable) acc.push(i);
      return acc;
    }, []);
  }

  /**
   * Handles keyboard navigation between sortable column headers using the
   * roving tabindex pattern (ARIA Grid specification). Supports ArrowLeft/Right
   * to move between sortable headers, Home/End to jump to first/last, and
   * Enter/Space to trigger sort on the focused sortable header.
   * @internal
   */
  private _handleHeaderKeydown(e: KeyboardEvent): void {
    const sortable = this._sortableIndices;
    if (sortable.length === 0) return;

    // Enter/Space on a sortable header triggers sort
    if (e.key === 'Enter' || e.key === ' ') {
      const col = this._resolvedColumns[this._focusedHeaderIndex];
      if (col?.sortable) {
        e.preventDefault();
        this._handleSort(col.key);
      }
      return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;

    // Determine which sortable position is currently focused.
    // If no sortable header is focused (currentPos === -1), let the
    // table-level _handleKeydown handle grid navigation instead.
    const currentPos = sortable.indexOf(this._focusedHeaderIndex);
    if (currentPos === -1) return;
    let nextPos: number;

    if (e.key === 'ArrowRight') {
      nextPos = currentPos === -1 ? 0 : Math.min(currentPos + 1, sortable.length - 1);
    } else if (e.key === 'ArrowLeft') {
      nextPos = currentPos <= 0 ? 0 : currentPos - 1;
    } else if (e.key === 'Home') {
      nextPos = 0;
    } else {
      // End
      nextPos = sortable.length - 1;
    }

    const nextIndex = sortable[nextPos];
    if (nextIndex === undefined) return;

    e.preventDefault();
    this._focusedHeaderIndex = nextIndex;

    // Focus the <th> element for the target column
    const headers = this.shadowRoot?.querySelectorAll<HTMLElement>('thead th[data-col-index]');
    const target = headers?.[nextIndex] ?? null;
    if (target) {
      target.focus();
    }
  }

  /** @internal */
  private _renderHeaderRow() {
    // Determine which sortable header gets tabindex="0" (roving tabindex).
    // If _focusedHeaderIndex is -1 (initial), the first sortable column wins.
    const sortable = this._sortableIndices;
    const activeIndex =
      this._focusedHeaderIndex >= 0 ? this._focusedHeaderIndex : (sortable[0] ?? -1);

    return html`
      <tr part="tr" @keydown=${this._handleHeaderKeydown}>
        ${this.selectable
          ? html`
              <th part="th" class="col-checkbox" tabindex="0">
                <input
                  type="checkbox"
                  part="checkbox"
                  aria-label=${this.selectAllLabel}
                  .indeterminate=${this._selectedRows.size > 0 &&
                  this._selectedRows.size < this._resolvedRows.length}
                  .checked=${this._selectedRows.size === this._resolvedRows.length &&
                  this._resolvedRows.length > 0}
                  @change=${(e: Event) =>
                    this._handleSelectAll((e.target as HTMLInputElement).checked)}
                />
              </th>
            `
          : nothing}
        ${this._resolvedColumns.map(
          (col, i) => html`
            <th
              part="th"
              data-col-index=${i}
              tabindex=${col.sortable ? (i === activeIndex ? '0' : '-1') : '-1'}
              style=${col.width ? `width: ${col.width}` : ''}
              aria-sort=${col.sortable
                ? this.sortKey === col.key
                  ? this.sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : nothing}
              @focus=${col.sortable
                ? () => {
                    this._focusedHeaderIndex = i;
                  }
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

  /** @internal */
  private _renderSkeletonRows() {
    return Array.from(
      { length: 3 },
      (_) => html`
        <tr part="tr" aria-hidden="true">
          ${this.selectable
            ? html`<td part="td" class="col-checkbox">
                <span class="skeleton-cell" style="width:1rem;margin:auto"></span>
              </td>`
            : nothing}
          ${this._resolvedColumns.map(
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

  /** @internal */
  private _renderEmptyRow() {
    const colSpan = this._resolvedColumns.length + (this.selectable ? 1 : 0);
    return html`
      <tr part="tr">
        <td part="td" colspan=${colSpan} class="empty-cell">
          <slot name="empty">${this.emptyLabel}</slot>
        </td>
      </tr>
    `;
  }

  /** @internal */
  private _renderDataRows() {
    let displayRows = this._resolvedRows;

    // Client-side pagination when pageSize > 0
    if (this.pageSize > 0) {
      const start = (this.page - 1) * this.pageSize;
      displayRows = this._resolvedRows.slice(start, start + this.pageSize);
    }

    return repeat(
      displayRows,
      (_row, pageIndex) => {
        const globalIndex =
          this.pageSize > 0 ? (this.page - 1) * this.pageSize + pageIndex : pageIndex;
        return globalIndex;
      },
      (row, pageIndex) => {
        // The global row index for selection and events
        const globalIndex =
          this.pageSize > 0 ? (this.page - 1) * this.pageSize + pageIndex : pageIndex;
        return html`
          <tr
            part="tr"
            aria-selected=${this.selectable ? String(this._selectedRows.has(globalIndex)) : nothing}
            @click=${() => this._handleRowClick(row, globalIndex)}
            @keydown=${(e: KeyboardEvent) => {
              // WCAG 2.1.1: rows are keyboard-activatable via Enter and Space so that
              // the hx-row-click event fires equivalently for keyboard users.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._handleRowClick(row, globalIndex);
              }
            }}
          >
            ${this.selectable
              ? html`
                  <td part="td" class="col-checkbox" tabindex="-1" data-row-index=${globalIndex}>
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
            ${this._resolvedColumns.map(
              (col) => html`
                <td part="td" tabindex="-1" data-row-index=${globalIndex}>
                  ${row[col.key] != null ? String(row[col.key]) : ''}
                </td>
              `,
            )}
          </tr>
        `;
      },
    );
  }

  // ─── Render ───

  override render() {
    return html`
      <slot name="toolbar"></slot>
      <div class="table-wrapper">
        <table
          part="table"
          role="grid"
          aria-label=${this.label.trim() || 'Table'}
          aria-busy=${this.loading ? 'true' : nothing}
          @keydown=${this._handleKeydown}
        >
          <thead part="thead">
            ${this._renderHeaderRow()}
          </thead>
          <tbody part="tbody">
            ${this.loading
              ? html`<slot name="loading">${this._renderSkeletonRows()}</slot>`
              : this._resolvedRows.length === 0
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
