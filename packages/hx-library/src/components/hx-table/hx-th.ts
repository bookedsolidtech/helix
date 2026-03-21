import { LitElement, html, nothing, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

/**
 * Detail type for `hx-sort` events dispatched from `hx-th`.
 */
export interface HxTableSortDetail {
  direction: 'asc' | 'desc';
}

/**
 * Semantic table header cell. Must be a child of `hx-tr`.
 * Supports sortable columns with accessible sort state.
 *
 * @summary Table header cell (`<th>`) with optional sort support.
 *
 * @tag hx-th
 *
 * @slot - Default slot for header label content.
 *
 * @fires {CustomEvent<HxTableSortDetail>} hx-sort - Dispatched when a sortable header is activated.
 *
 * @csspart header - The `<th>` element.
 * @csspart sort-icon - The sort indicator icon `<span>` inside sortable headers.
 */
@customElement('hx-th')
export class HelixTableHeader extends LitElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      th {
        padding: var(--_hx-table-cell-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
        text-align: left;
        font-weight: var(--hx-font-weight-semibold, 600);
        color: var(--hx-table-header-color, var(--hx-color-neutral-700, #334155));
        background-color: var(
          --_hx-table-cell-bg,
          var(--hx-table-header-bg, var(--hx-color-neutral-50, #f8fafc))
        );
        border-bottom: var(--hx-border-width-thin, 1px) solid
          var(--hx-table-border-color, var(--hx-color-neutral-200, #e2e8f0));
        white-space: nowrap;
        vertical-align: middle;
        position: var(--_hx-table-th-position, static);
        top: var(--_hx-table-th-top, auto);
        z-index: var(--_hx-table-th-z-index, auto);
      }

      :host([sortable]) th {
        cursor: pointer;
      }

      /* ─── Sort Button ─── */

      .sort-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--hx-space-1, 0.25rem);
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        font-weight: inherit;
        color: inherit;
        cursor: pointer;
        white-space: nowrap;
        width: 100%;
      }

      .sort-btn:focus-visible {
        outline: var(--hx-focus-ring-width, 2px) solid
          var(--hx-focus-ring-color, var(--hx-color-primary-500, #2563eb));
        outline-offset: var(--hx-focus-ring-offset, 2px);
        border-radius: var(--hx-border-radius-sm, 2px);
      }

      /* ─── Sort Icon ─── */

      .sort-icon {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        width: 1em;
        height: 1em;
        opacity: 0.4;
        transition:
          opacity var(--hx-transition-fast, 150ms ease),
          transform var(--hx-transition-fast, 150ms ease);
      }

      .sort-icon--active {
        opacity: 1;
        color: var(--hx-color-primary-500, #2563eb);
      }

      .sort-icon--desc {
        transform: rotate(180deg);
      }

      @media (prefers-reduced-motion: reduce) {
        .sort-icon {
          transition: none;
        }
      }

      /* ─── Mobile card layout ─── */

      @media (max-width: 768px) {
        /*
         * Visually hide the header cell on mobile while keeping it in the
         * accessibility tree. Screen readers can then associate column
         * headers with data cells via the semantic table structure
         * (scope="col", role="columnheader"), satisfying WCAG 2.1 AA.
         * Using display:none would remove headers from the a11y tree entirely.
         */
        th {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      }
    `,
  ];

  /**
   * When true, the header renders a sort button and emits `hx-sort` on activation.
   * @attr sortable
   */
  @property({ type: Boolean, reflect: true })
  sortable = false;

  /**
   * Current sort direction. Reflected for CSS targeting.
   * @attr sort-direction
   */
  @property({ type: String, reflect: true, attribute: 'sort-direction' })
  sortDirection: 'asc' | 'desc' | 'none' = 'none';

  /**
   * The `scope` attribute for the underlying `<th>` element.
   * @attr scope
   */
  @property({ type: String })
  scope: 'col' | 'row' | 'colgroup' | 'rowgroup' = 'col';

  /**
   * Number of columns this header spans.
   * @attr colspan
   */
  @property({ type: Number })
  colspan = 0;

  /**
   * Number of rows this header spans.
   * @attr rowspan
   */
  @property({ type: Number })
  rowspan = 0;

  // ─── Event Handlers ───

  /** @internal */
  private _handleSort(): void {
    const next: 'asc' | 'desc' = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortDirection = next;
    this.dispatchEvent(
      new CustomEvent<HxTableSortDetail>('hx-sort', {
        bubbles: true,
        composed: true,
        detail: { direction: next },
      }),
    );
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderSortIcon() {
    const isActive = this.sortDirection !== 'none';
    const iconClass = [
      'sort-icon',
      isActive ? 'sort-icon--active' : '',
      this.sortDirection === 'desc' ? 'sort-icon--desc' : '',
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

  /** @internal */
  private _ariaSort(): 'ascending' | 'descending' | 'none' | typeof nothing {
    if (!this.sortable) return nothing;
    if (this.sortDirection === 'asc') return 'ascending';
    if (this.sortDirection === 'desc') return 'descending';
    return 'none';
  }

  /** @internal */
  private _sortLabel(): string {
    if (this.sortDirection === 'asc') return 'Sort descending';
    if (this.sortDirection === 'desc') return 'Sort ascending';
    return 'Sort';
  }

  override render() {
    return html`
      <th
        part="header"
        role="columnheader"
        scope=${this.scope}
        colspan=${ifDefined(this.colspan > 0 ? this.colspan : undefined)}
        rowspan=${ifDefined(this.rowspan > 0 ? this.rowspan : undefined)}
        aria-sort=${this._ariaSort()}
      >
        ${this.sortable
          ? html`
              <button class="sort-btn" @click=${this._handleSort} aria-label=${this._sortLabel()}>
                <slot></slot>
                ${this._renderSortIcon()}
              </button>
            `
          : html`<slot></slot>`}
      </th>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-th': HelixTableHeader;
  }
}
