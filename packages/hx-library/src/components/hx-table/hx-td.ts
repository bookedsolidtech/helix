import { html, css, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
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
 * Semantic table data cell. Must be a child of `hx-tr`.
 *
 * Group 7 host-canonical: `role="cell"` lives on the **host** via
 * `_internals.role`. The host carries the cell's accessible name (resolved
 * from the `label` property — fixing audit B-A1, where mobile screen reader
 * users lost column context because `data-label` was visual-only).
 *
 * @summary Table data cell (`<td>`) for use inside `hx-tr`.
 *
 * @tag hx-td
 *
 * @slot - Default slot for cell content.
 *
 * @csspart cell - The `<td>` element.
 *
 * @cssprop [--hx-table-cell-color=var(--hx-color-neutral-900, #0D1825)] - Cell text color.
 */
@customElement('hx-td')
export class HelixTableCell extends HelixElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      td {
        padding: var(--_hx-table-cell-padding, var(--hx-space-3, 0.75rem) var(--hx-space-4, 1rem));
        text-align: left;
        color: var(--hx-table-cell-color, var(--hx-color-neutral-900, #0d1825));
        border-bottom: var(--hx-border-width-thin, 1px) solid
          var(--hx-table-border-color, var(--hx-color-neutral-200, #d6dbd5));
        vertical-align: middle;
      }

      :host([align='center']) td {
        text-align: center;
      }

      :host([align='right']) td {
        text-align: right;
      }

      td:focus-visible {
        outline: var(--hx-focus-ring-width, 2px) solid
          var(--hx-focus-ring-color, var(--hx-color-primary-500, #429797));
        outline-offset: var(--hx-focus-ring-offset, -2px);
        border-radius: var(--hx-border-radius-sm, 2px);
      }

      /* ─── Forced Colors (Windows High Contrast) ─── */

      @media (forced-colors: active) {
        td {
          border-bottom-color: CanvasText;
        }

        td:focus-visible {
          outline: 2px solid Highlight;
          outline-offset: var(--hx-focus-ring-offset, -2px);
        }
      }

      /* ─── Mobile card layout ─── */

      @media (max-width: 768px) {
        :host {
          display: block;
        }

        td {
          display: block;
          text-align: right;
          padding: var(--hx-space-2, 0.5rem) var(--hx-space-3, 0.75rem);
          border-bottom: none;
          position: relative;
        }

        td::before {
          content: attr(data-label);
          font-weight: var(--hx-font-weight-semibold, 600);
          float: left;
          color: var(--hx-table-header-color, var(--hx-color-neutral-700, #313e4b));
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
   * Horizontal alignment for cell content.
   * @attr align
   */
  @property({ type: String, reflect: true })
  align: 'left' | 'center' | 'right' = 'left';

  /**
   * Number of columns this cell spans.
   * @attr colspan
   */
  @property({ type: Number })
  colspan = 0;

  /**
   * Number of rows this cell spans.
   * @attr rowspan
   */
  @property({ type: Number })
  rowspan = 0;

  /**
   * Column header label for this cell. Forwarded as `data-label` on the native
   * `<td>` for the mobile card layout (`td::before { content: attr(data-label) }`)
   * AND projected to `aria-label` so screen readers identify the column when
   * the header row is hidden via the mobile breakpoint. Group 7 audit B-A1
   * fix: prior to migration, the JSDoc claimed aria-label projection but the
   * implementation only set `data-label` — `::before { content: attr(...) }`
   * is not reliably announced by VoiceOver / NVDA across versions.
   * @attr label
   */
  @property({ type: String, attribute: 'label' })
  label = '';

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixTableCell;
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
    if (changed.has('label')) {
      this._syncHostAriaSemantics();
    }
  }

  /** @internal */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    if (!this._supportsIdrefRefs) {
      internals.role = null;
      internals.ariaLabel = null;
    } else {
      internals.role = 'cell';
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

    let resolved = '';
    if (hasEffectiveLabelledBy) {
      const flattened =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        this.label ||
        '';
      resolved = flattened;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else if (this.label) {
      // Group 7 B-A1 fix: derive aria-label from the `label` property when
      // no consumer override is supplied.
      resolved = this.label;
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = this.label;
      }
    } else {
      resolved = '';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      // CodeRabbit SHOULD-FIX (PR #1649 follow-up): the inner <td>'s
      // aria-label now mirrors `_resolvedAccessibleName`, so request a
      // render whenever the resolved name changes — not just on the
      // legacy fallback path. Without this, consumer mutations to host
      // `aria-label` / `aria-labelledby` would update host-internals but
      // not the inner cell's announced name.
      this.requestUpdate();
    }
  }

  override render() {
    // Dual-surface (Group 7 hx-progress-ring exemplar): inner <td> keeps
    // role="cell" + the audit B-A1 aria-label projection from `this.label`
    // for legacy AT and consumer queries. Host adds cross-shadow IDREF
    // wiring via internals.* in _syncHostAriaSemantics(). data-label still
    // feeds the mobile card layout's CSS pseudo-element.
    // CodeRabbit SHOULD-FIX (PR #1649 follow-up): the inner <td> previously
    // mirrored only the raw `label` property, so when a consumer set
    // `aria-label` or `aria-labelledby` on the host, the inner cell's
    // accessible name diverged from the host on legacy fallback engines.
    // Use the resolved name from the precedence ladder
    // (aria-labelledby > aria-label > label) so the inner surface tracks
    // the host. `data-label` keeps using `this.label` because it feeds the
    // mobile card layout's CSS pseudo-element, which only knows about the
    // explicit column label string.
    const innerAriaLabel = this._resolvedAccessibleName || this.label || undefined;
    return html`
      <td
        part="cell"
        role="cell"
        aria-label=${ifDefined(innerAriaLabel)}
        data-label=${ifDefined(this.label || undefined)}
        colspan=${ifDefined(this.colspan > 0 ? this.colspan : undefined)}
        rowspan=${ifDefined(this.rowspan > 0 ? this.rowspan : undefined)}
      >
        <slot></slot>
      </td>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-td': HelixTableCell;
  }
}
