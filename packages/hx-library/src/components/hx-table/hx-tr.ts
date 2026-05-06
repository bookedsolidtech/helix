import { html, nothing, css, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { HelixElement } from '../../base/index.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * Semantic table row. Must be a child of `hx-thead`, `hx-tbody`, or `hx-tfoot`.
 * Contains `hx-th` or `hx-td` cells.
 *
 * Group 7 host-canonical: `role="row"` lives on the **host** via
 * `_internals.role`. The host carries `aria-selected` / `aria-disabled`
 * mirroring `selected` / `disabled` reflected attributes. Consumer-supplied
 * `aria-label` / `aria-labelledby` on the host project to the host's
 * announced surface so AT walks `<hx-tr>` (role=row) directly. Fallback
 * path keeps the inner `<tr role="row">` as the announced surface for
 * engines without IDL element references.
 *
 * @summary Table row (`<tr>`) for use inside `hx-thead`, `hx-tbody`, or `hx-tfoot`.
 *
 * @tag hx-tr
 *
 * @slot - Default slot for `hx-th` and `hx-td` elements.
 *
 * @csspart row - The `<tr>` element.
 */
@customElement('hx-tr')
export class HelixTableRow extends HelixElement {
  static override styles = [
    css`
      :host {
        display: contents;
      }

      tr {
        background-color: var(--_hx-table-row-bg, transparent);
        transition: background-color var(--hx-transition-fast, 150ms ease);
      }

      tr:hover {
        background-color: var(--_hx-table-row-hover-bg, var(--hx-table-row-hover-bg, transparent));
      }

      :host([selected]) tr {
        background-color: var(--hx-table-row-selected-bg, var(--hx-color-primary-50, #ebf8f8));
      }

      :host([disabled]) tr {
        opacity: 0.5;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        tr {
          transition: none;
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
   * When true, marks the row as selected and applies selected styling.
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * When true, the row is visually disabled and non-interactive.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixTableRow;
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
    if (changed.has('selected') || changed.has('disabled')) {
      this._syncHostAriaSemantics();
    }
  }

  /** @internal */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    if (!this._supportsIdrefRefs) {
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaSelected = null;
      internals.ariaDisabled = null;
    } else {
      internals.role = 'row';
      internals.ariaSelected = this.selected ? 'true' : null;
      internals.ariaDisabled = this.disabled ? 'true' : null;
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
    } else {
      // No override — let AT walk slotted cells for implicit row content.
      resolved = '';
      if (this._supportsIdrefRefs) {
        internals.ariaLabel = null;
      }
    }

    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      if (!this._supportsIdrefRefs) {
        this.requestUpdate();
      }
    }
  }

  override render() {
    // Dual-surface (Group 7 hx-progress-ring exemplar): inner <tr> keeps
    // role="row" + aria-selected / aria-disabled for legacy AT and
    // consumer queries. Host adds cross-shadow IDREF wiring via
    // internals.* in _syncHostAriaSemantics().
    return html`
      <tr
        part="row"
        role="row"
        aria-selected=${this.selected ? 'true' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
      >
        <slot></slot>
      </tr>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tr': HelixTableRow;
  }
}
