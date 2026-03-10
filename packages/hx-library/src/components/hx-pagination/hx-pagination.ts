import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixPaginationStyles } from './hx-pagination.styles.js';

/**
 * A pagination component for navigating content listings.
 *
 * @summary Page navigation with page numbers, prev/next, and ellipsis.
 *
 * @tag hx-pagination
 *
 * @csspart nav - The wrapping `<nav>` element.
 * @csspart list - The `<ul>` containing pagination items.
 * @csspart item - Each `<li>` item.
 * @csspart button - Each page button or prev/next control.
 * @csspart ellipsis - The ellipsis (`…`) span between page groups.
 * @csspart page-size-wrapper - The wrapper `<div>` around the page-size selector.
 * @csspart page-size-label - The `<label>` element for the page-size selector.
 * @csspart page-size-select - The `<select>` element for page-size.
 *
 * @cssprop [--hx-pagination-gap=0.25rem] - Gap between pagination buttons. Inherits from --hx-spacing-1.
 * @cssprop [--hx-pagination-button-size=2.25rem] - Minimum width and height of each button.
 * @cssprop [--hx-pagination-border-color] - Border color of buttons. Inherits from --hx-color-border (final fallback: #d1d5db).
 * @cssprop [--hx-pagination-border-radius] - Border radius of buttons. Inherits from --hx-border-radius-md (final fallback: 0.375rem).
 * @cssprop [--hx-pagination-bg] - Background color of buttons. Inherits from --hx-color-surface (final fallback: #ffffff).
 * @cssprop [--hx-pagination-color] - Text color of buttons. Inherits from --hx-color-text-primary (final fallback: #111827).
 * @cssprop [--hx-pagination-hover-bg] - Background color of buttons on hover. Inherits from --hx-color-surface-hover (final fallback: #f3f4f6).
 * @cssprop [--hx-pagination-hover-border-color] - Border color of buttons on hover. Inherits from --hx-color-primary (final fallback: #2563eb).
 * @cssprop [--hx-pagination-active-bg] - Background color of the active/current page button. Inherits from --hx-color-primary (final fallback: #2563eb).
 * @cssprop [--hx-pagination-active-color] - Text color of the active/current page button. Inherits from --hx-color-surface (final fallback: #ffffff).
 * @cssprop [--hx-pagination-active-border-color] - Border color of the active/current page button. Defaults to --hx-pagination-active-bg.
 * @cssprop [--hx-pagination-ellipsis-color] - Color of ellipsis characters. Inherits from --hx-color-text-secondary (final fallback: #6b7280).
 * @cssprop [--hx-transition-fast=150ms] - Duration used for hover/focus transitions.
 *
 * @fires {CustomEvent<{ page: number }>} hx-page-change - Fired when the user navigates to a new page.
 * @fires {CustomEvent<{ pageSize: number }>} hx-page-size-change - Fired when the user selects a new page size.
 *
 * @example
 * ```html
 * <hx-pagination total-pages="10" current-page="1"></hx-pagination>
 * ```
 *
 * @example Drupal / Twig integration
 * ```twig
 * {#
 *   Drupal's pager uses 0-based page index in the URL (?page=N).
 *   This component is 1-based, so add 1 to the Drupal page value.
 *   Listen to hx-page-change and update the URL query param:
 *     element.addEventListener('hx-page-change', (e) => {
 *       const params = new URLSearchParams(location.search);
 *       params.set('page', e.detail.page - 1); // convert back to 0-based
 *       history.pushState({}, '', '?' + params.toString());
 *     });
 * #}
 * <hx-pagination
 *   total-pages="{{ total_pages }}"
 *   current-page="{{ pager.current_page + 1 }}"
 *   label="{{ 'Pagination'|t }}"
 *   {{ show_first_last ? 'show-first-last' : '' }}
 * ></hx-pagination>
 * ```
 */
@customElement('hx-pagination')
export class HelixPagination extends LitElement {
  static override styles = [tokenStyles, helixPaginationStyles];

  /**
   * Total number of pages.
   * @attr total-pages
   */
  @property({ type: Number, attribute: 'total-pages', reflect: true })
  totalPages = 1;

  /**
   * The currently active page (1-based).
   * @attr current-page
   */
  @property({ type: Number, attribute: 'current-page' })
  currentPage = 1;

  /**
   * Number of page buttons shown on each side of the current page.
   * @attr sibling-count
   */
  @property({ type: Number, attribute: 'sibling-count', reflect: true })
  siblingCount = 1;

  /**
   * Number of pages always shown at the start and end of the list.
   * @attr boundary-count
   */
  @property({ type: Number, attribute: 'boundary-count', reflect: true })
  boundaryCount = 1;

  /**
   * Whether to show First and Last page buttons.
   * @attr show-first-last
   */
  @property({ type: Boolean, attribute: 'show-first-last', reflect: true })
  showFirstLast = false;

  /**
   * Accessible label for the `<nav>` element.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Pagination';

  /**
   * The number of items displayed per page. When set, a page-size selector
   * `<select>` is rendered. Set `show-page-size` to display the selector.
   * @attr page-size
   */
  @property({ type: Number, attribute: 'page-size', reflect: true })
  pageSize = 25;

  /**
   * Whether to show the page-size selector UI.
   * @attr show-page-size
   */
  @property({ type: Boolean, attribute: 'show-page-size', reflect: true })
  showPageSize = false;

  /** Tracks the roving tabindex target. Null means default to currentPage. */
  @state() private _rovingKey: number | string | null = null;

  /** Text for the aria-live region, updated on navigation. */
  @state() private _liveMessage = '';

  /** Memoization cache for _buildPageRange. */
  private _pageRangeCache: { key: string; result: Array<number | 'ellipsis'> } | null = null;

  // ─── Helpers ───

  private _buildPageRange(): Array<number | 'ellipsis'> {
    const key = `${this.totalPages}-${this.currentPage}-${this.siblingCount}-${this.boundaryCount}`;
    if (this._pageRangeCache?.key === key) return this._pageRangeCache.result;

    const total = Math.max(1, this.totalPages);
    const current = Math.min(Math.max(1, this.currentPage), total);
    const boundary = Math.max(0, this.boundaryCount);
    const sibling = Math.max(0, this.siblingCount);

    const startPages = this._range(1, Math.min(boundary, total));
    const endPages = this._range(Math.max(total - boundary + 1, boundary + 1), total);

    const siblingStart = Math.max(
      Math.min(current - sibling, total - boundary - sibling * 2 - 1),
      boundary + 2,
    );
    const siblingEnd = Math.min(
      Math.max(current + sibling, boundary + sibling * 2 + 2),
      endPages.length > 0 ? endPages[0]! - 2 : total - 1,
    );

    const items: Array<number | 'ellipsis'> = [];

    for (const p of startPages) items.push(p);

    if (siblingStart > boundary + 2) {
      items.push('ellipsis');
    } else if (boundary + 1 < siblingStart) {
      items.push(boundary + 1);
    }

    for (const p of this._range(siblingStart, siblingEnd)) items.push(p);

    if (siblingEnd < total - boundary - 1) {
      items.push('ellipsis');
    } else if (siblingEnd < total - boundary) {
      items.push(total - boundary);
    }

    for (const p of endPages) items.push(p);

    this._pageRangeCache = { key, result: items };
    return items;
  }

  private _range(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }

  private _navigate(page: number): void {
    const clamped = Math.min(Math.max(1, page), this.totalPages);
    if (clamped === this.currentPage) return;

    this.currentPage = clamped;
    this._rovingKey = null; // reset so focus follows the new current page
    this._liveMessage = `Page ${clamped} of ${this.totalPages}`;
    this.dispatchEvent(
      new CustomEvent<{ page: number }>('hx-page-change', {
        detail: { page: clamped },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handlePageSizeChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const newSize = Number(select.value);
    if (newSize === this.pageSize) return;

    this.pageSize = newSize;
    this.dispatchEvent(
      new CustomEvent<{ pageSize: number }>('hx-page-size-change', {
        detail: { pageSize: newSize },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get _effectiveRovingKey(): number | string {
    return this._rovingKey ?? this.currentPage;
  }

  private _handleFocusin(e: FocusEvent): void {
    const btn = e.target as HTMLElement;
    if (btn.tagName !== 'BUTTON') return;
    const key = btn.dataset['rovingKey'];
    if (key === undefined) return;
    this._rovingKey = isNaN(Number(key)) ? key : Number(key);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();

    const list = this.shadowRoot?.querySelector('.list');
    if (!list) return;

    // Collect all non-disabled buttons (disabled prev/next excluded; aria-disabled current page included)
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    const focused = this.shadowRoot?.activeElement as HTMLButtonElement | null;
    const currentIdx = focused ? buttons.indexOf(focused) : 0;

    const nextIdx =
      e.key === 'ArrowLeft'
        ? Math.max(0, currentIdx - 1)
        : Math.min(buttons.length - 1, currentIdx + 1);

    if (nextIdx !== currentIdx) {
      const nextBtn = buttons[nextIdx];
      if (!nextBtn) return;
      const key = nextBtn.dataset['rovingKey'];
      if (key !== undefined) {
        this._rovingKey = isNaN(Number(key)) ? key : Number(key);
      }
      nextBtn.focus();
    }
  }

  // ─── Render ───

  override render() {
    const pages = this._buildPageRange();
    const isFirst = this.currentPage <= 1;
    const isLast = this.currentPage >= this.totalPages;
    const rovingKey = this._effectiveRovingKey;

    return html`
      <div class="pagination-root">
        ${this.showPageSize
          ? html`
              <div part="page-size-wrapper" class="page-size-wrapper">
                <label part="page-size-label" class="page-size-label">
                  Rows per page:
                  <select
                    part="page-size-select"
                    class="page-size-select"
                    @change=${this._handlePageSizeChange}
                  >
                    ${[10, 25, 50, 100].map(
                      (n) =>
                        html`<option value=${n} ?selected=${n === this.pageSize}>${n}</option>`,
                    )}
                  </select>
                </label>
              </div>
            `
          : nothing}

        <nav part="nav" aria-label=${this.label}>
          <span class="visually-hidden" aria-live="polite" aria-atomic="true"
            >${this._liveMessage}</span
          >
          <ul
            part="list"
            class="list"
            role="list"
            @keydown=${this._handleKeydown}
            @focusin=${this._handleFocusin}
          >
            ${this.showFirstLast
              ? html`
                  <li part="item" class="item">
                    <button
                      part="button"
                      class="button"
                      ?disabled=${isFirst}
                      tabindex=${rovingKey === 'first' ? 0 : -1}
                      data-roving-key="first"
                      aria-label="First page"
                      @click=${() => this._navigate(1)}
                    >
                      «
                    </button>
                  </li>
                `
              : nothing}

            <li part="item" class="item">
              <button
                part="button"
                class="button"
                ?disabled=${isFirst}
                tabindex=${rovingKey === 'prev' ? 0 : -1}
                data-roving-key="prev"
                aria-label="Previous page"
                @click=${() => this._navigate(this.currentPage - 1)}
              >
                ‹
              </button>
            </li>

            ${repeat(
              pages,
              (page, i) => (page === 'ellipsis' ? `ellipsis-${i}` : `page-${page}`),
              (page) => {
                if (page === 'ellipsis') {
                  return html`
                    <li part="item" class="item">
                      <span part="ellipsis" class="ellipsis" aria-hidden="true">…</span>
                    </li>
                  `;
                }
                const isCurrent = page === this.currentPage;
                return html`
                  <li part="item" class="item">
                    <button
                      part="button"
                      class=${classMap({ button: true })}
                      aria-disabled=${isCurrent ? 'true' : nothing}
                      tabindex=${rovingKey === page ? 0 : -1}
                      data-roving-key=${page}
                      aria-current=${isCurrent ? 'page' : nothing}
                      aria-label=${`Page ${page}`}
                      @click=${() => this._navigate(page)}
                    >
                      ${page}
                    </button>
                  </li>
                `;
              },
            )}

            <li part="item" class="item">
              <button
                part="button"
                class="button"
                ?disabled=${isLast}
                tabindex=${rovingKey === 'next' ? 0 : -1}
                data-roving-key="next"
                aria-label="Next page"
                @click=${() => this._navigate(this.currentPage + 1)}
              >
                ›
              </button>
            </li>

            ${this.showFirstLast
              ? html`
                  <li part="item" class="item">
                    <button
                      part="button"
                      class="button"
                      ?disabled=${isLast}
                      tabindex=${rovingKey === 'last' ? 0 : -1}
                      data-roving-key="last"
                      aria-label="Last page"
                      @click=${() => this._navigate(this.totalPages)}
                    >
                      »
                    </button>
                  </li>
                `
              : nothing}
          </ul>
        </nav>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-pagination': HelixPagination;
  }
}
