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
 *
 * @cssprop [--hx-pagination-gap=0.25rem] - Gap between pagination buttons.
 * @cssprop [--hx-pagination-button-size=2.25rem] - Minimum width and height of each button.
 * @cssprop [--hx-pagination-border-color=#d1d5db] - Border color of buttons.
 * @cssprop [--hx-pagination-border-radius=0.375rem] - Border radius of buttons.
 * @cssprop [--hx-pagination-bg=#ffffff] - Background color of buttons.
 * @cssprop [--hx-pagination-color=#111827] - Text color of buttons.
 * @cssprop [--hx-pagination-hover-bg=#f3f4f6] - Background color of buttons on hover.
 * @cssprop [--hx-pagination-hover-border-color=#2563eb] - Border color of buttons on hover.
 * @cssprop [--hx-pagination-active-bg=#2563eb] - Background color of the active/current page button.
 * @cssprop [--hx-pagination-active-color=#ffffff] - Text color of the active/current page button.
 * @cssprop [--hx-pagination-ellipsis-color=#6b7280] - Color of ellipsis characters.
 * @cssprop [--hx-transition-fast=150ms] - Duration used for hover/focus transitions.
 *
 * @fires {CustomEvent<{ page: number }>} hx-page-change - Fired when the user navigates to a new page.
 *
 * @example
 * ```html
 * <hx-pagination total-pages="10" current-page="1"></hx-pagination>
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
  @property({ type: Number, attribute: 'current-page', reflect: true })
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

  /** Tracks the roving tabindex target. Null means default to currentPage. */
  @state() private _rovingKey: number | string | null = null;

  // ─── Helpers ───

  private _buildPageRange(): Array<number | 'ellipsis'> {
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
      endPages.length > 0 ? (endPages[0] as number) - 2 : total - 1,
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
    this.dispatchEvent(
      new CustomEvent<{ page: number }>('hx-page-change', {
        detail: { page: clamped },
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
      <nav part="nav" aria-label=${this.label}>
        <ul
          part="list"
          class="list"
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
                    class=${classMap({ button: true, 'button--active': isCurrent })}
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-pagination': HelixPagination;
  }
}
