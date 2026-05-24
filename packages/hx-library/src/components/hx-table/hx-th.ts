import { html, nothing, css, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

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
 * Group 7 host-canonical: `role="columnheader"` lives on the **host** via
 * `_internals.role`. The host carries `aria-sort` reflecting the current
 * sort direction (when `sortable` is true). The sort `<button>` aria-label
 * incorporates the slotted column text so AT users hear "Sort by Patient
 * name, currently sorted ascending" rather than just "Sort ascending".
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
export class HelixTableHeader extends HelixElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      th {
        padding: var(--_hx-table-cell-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
        text-align: left;
        font-weight: var(--hx-font-weight-semibold, 600);
        color: var(--hx-table-header-color, var(--hx-color-neutral-700, #313e4b));
        background-color: var(
          --_hx-table-cell-bg,
          var(--hx-table-header-bg, var(--hx-color-neutral-50, #f5f8f3))
        );
        border-bottom: var(--hx-border-width-thin, 1px) solid
          var(--hx-table-border-color, var(--hx-color-neutral-200, #d6dbd5));
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
          var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797));
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
        color: var(--hx-color-primary-500, #429797);
      }

      .sort-icon--desc {
        transform: rotate(180deg);
      }

      @media (prefers-reduced-motion: reduce) {
        .sort-icon {
          transition: none;
        }
      }

      /* ─── Forced Colors (Windows High Contrast) ─── */

      @media (forced-colors: active) {
        th {
          border-bottom-color: CanvasText;
        }

        .sort-btn:focus-visible {
          outline: 2px solid Highlight;
          outline-offset: var(--hx-focus-ring-offset, 2px);
        }

        .sort-icon--active {
          forced-color-adjust: none;
          color: Highlight;
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
   * Test seam (Group 7 host-canonical migration): see other Group 7 components.
   * Production code MUST NOT touch this field.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

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

  /** @internal */
  @state() private _slotText = '';

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Resolved accessible name from the host precedence ladder
   * (aria-labelledby > aria-label > slotted column text). Surfaced to the
   * inner sort button's aria-label so AT users hear the same name on the
   * host columnheader and on the sort control. CodeRabbit SHOULD-FIX
   * (PR #1649 follow-up).
   * @internal
   */
  private _resolvedAccessibleName = '';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixTableHeader;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    this._syncHostAriaSemantics();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('sortable') || changed.has('sortDirection')) {
      this._syncHostAriaSemantics();
    }
  }

  /** @internal */
  private _onSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    let text = '';
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent ?? '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        text += flattenAccName(node as Element);
      }
    }
    const next = text.replace(/\s+/g, ' ').trim();
    if (next !== this._slotText) {
      this._slotText = next;
      // CodeRabbit SHOULD-FIX (PR #1649 follow-up): re-run host AccName
      // resolution so the precedence ladder picks up the new slotted text
      // when no consumer aria-* override is present.
      this._syncHostAriaSemantics();
    }
  }

  /** @internal */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const ariaSort = this._ariaSortValue();

    if (!this._supportsIdrefRefs) {
      internals.role = null;
      internals.ariaSort = null;
      internals.ariaLabel = null;
    } else {
      internals.role = 'columnheader';
      // ariaSort is only meaningful on sortable headers (per ARIA 1.2). For
      // non-sortable headers the host clears it so axe-core does not flag a
      // spurious "none" value as a state.
      internals.ariaSort = ariaSort;
    }

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
    }

    // CodeRabbit SHOULD-FIX (PR #1649 follow-up): compute the resolved
    // accessible name via the AccName 1.2 precedence ladder
    // (aria-labelledby flatten > aria-label > slotted column text) so the
    // inner sort button's aria-label tracks the columnheader's accessible
    // name. Without this, "Sort by <column>" diverges from the column's
    // actual announced name on engines that support aria-labelledby.
    let resolved: string;
    if (hasEffectiveLabelledBy) {
      const flattened = labelEls
        .map((el) => flattenAccName(el))
        .filter(Boolean)
        .join(' ');
      resolved = flattened || hostAriaLabel || this._slotText;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else {
      resolved = this._slotText;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      // Re-render so the sort button's aria-label picks up the new name.
      this.requestUpdate();
    }
  }

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
  protected _renderSortIcon() {
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
  private _ariaSortValue(): 'ascending' | 'descending' | 'none' | null {
    if (!this.sortable) return null;
    if (this.sortDirection === 'asc') return 'ascending';
    if (this.sortDirection === 'desc') return 'descending';
    return 'none';
  }

  /** @internal */
  private _ariaSortAttr(): 'ascending' | 'descending' | 'none' | typeof nothing {
    const value = this._ariaSortValue();
    return value === null ? nothing : value;
  }

  /**
   * Build the sort button's aria-label. Includes the slotted column text
   * when available so a blind user pressing Tab through 5 sortable columns
   * hears "Sort by Patient name, currently sorted ascending" instead of
   * just "Sort. Sort. Sort." (audit B-A2-style label disambiguation).
   * Promoted to `protected` so subclasses can override the i18n surface
   * without re-implementing the full sort cycle.
   * @internal
   */
  protected _sortLabel(): string {
    // CodeRabbit SHOULD-FIX (PR #1649 follow-up): prefer the resolved
    // accessible name (aria-labelledby > aria-label > slotted text) so
    // the sort button announces the same column name as the host
    // columnheader. Falls back to slotted text for backwards compat.
    const column = this._resolvedAccessibleName || this._slotText;
    let directionLabel: string;
    if (this.sortDirection === 'asc') {
      directionLabel = 'Sort descending';
    } else if (this.sortDirection === 'desc') {
      directionLabel = 'Sort ascending';
    } else {
      directionLabel = 'Sort';
    }
    if (!column) return directionLabel;
    if (this.sortDirection === 'asc') return `Sort ${column} descending`;
    if (this.sortDirection === 'desc') return `Sort ${column} ascending`;
    return `Sort by ${column}`;
  }

  override render() {
    // Dual-surface (Group 7 hx-progress-ring exemplar): inner <th> keeps
    // role="columnheader" + aria-sort for legacy AT and consumer queries.
    // Host adds cross-shadow IDREF wiring via internals.* in
    // _syncHostAriaSemantics().
    return html`
      <th
        part="header"
        role="columnheader"
        scope=${this.scope}
        colspan=${ifDefined(this.colspan > 0 ? this.colspan : undefined)}
        rowspan=${ifDefined(this.rowspan > 0 ? this.rowspan : undefined)}
        aria-sort=${this._ariaSortAttr()}
      >
        ${this.sortable
          ? html`
              <button class="sort-btn" @click=${this._handleSort} aria-label=${this._sortLabel()}>
                <slot @slotchange=${this._onSlotChange}></slot>
                ${this._renderSortIcon()}
              </button>
            `
          : html`<slot @slotchange=${this._onSlotChange}></slot>`}
      </th>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-th': HelixTableHeader;
  }
}
