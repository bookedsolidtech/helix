import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { helixListStyles } from './hx-list.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { HelixListItem } from './hx-list-item.js'; // real import for instanceof check and property access
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * A styled list container supporting plain, bulleted, numbered, description, and interactive variants.
 *
 * Group 7 host-canonical: `role="list"` (or `role="listbox"` in interactive
 * mode) lives on the **host** via `_internals.role`, harmonizing with
 * `hx-structured-list` (the gold-standard exemplar for Group 7). The `<dl>`
 * description variant keeps native semantics — no host role assigned, since
 * `<dl>` IS the semantic surface and AT walks it directly.
 *
 * @summary Container for list items with optional dividers and interactive selection.
 *
 * @tag hx-list
 *
 * @slot - Default slot for `hx-list-item` elements.
 *
 * @fires {CustomEvent<{item: HelixListItem, value: string | undefined}>} hx-select - Dispatched
 *   when an item is clicked in interactive mode.
 *
 * @csspart base - The root list element.
 *
 * @cssprop [--hx-list-gap=0] - Gap between list items.
 * @cssprop [--hx-list-divider-color=var(--hx-color-neutral-200)] - Divider line color.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 */
@customElement('hx-list')
export class HelixList extends HelixElement {
  static override styles = [helixListStyles, forcedColorsSurface];

  /**
   * Test seam (Group 7 host-canonical migration): see other Group 7 components.
   * Production code MUST NOT touch this field.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * Visual variant of the list.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'plain' | 'bulleted' | 'numbered' | 'description' | 'interactive' = 'plain';

  /**
   * Whether to show dividers between list items.
   * @attr divided
   */
  @property({ type: Boolean, reflect: true })
  divided = false;

  /**
   * Accessible label for the list. Required when variant is "interactive" (listbox role).
   * @attr label
   */
  @property({ type: String })
  label: string | undefined = undefined;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
    const ctor = this.constructor as typeof HelixList;
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
    this.removeEventListener('keydown', this._handleKeydown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);
    if (changedProps.has('variant')) {
      this._updateItemStates();
      this._syncHostAriaSemantics();
    }
    if (changedProps.has('label')) {
      this._syncHostAriaSemantics();
    }
    if (this.variant === 'interactive' && !this.label) {
      devWarn(
        'hx-list',
        'The "label" attribute is required when variant is "interactive". ' +
          'Add a label to provide an accessible name for the listbox (WCAG 2.1 SC 4.1.2).',
      );
    }
  }

  /**
   * Sets the `interactive` property on all child hx-list-item elements
   * so they can style and behave correctly without `:host-context()`.
   */
  /** @internal */
  private _updateItemStates(): void {
    const isInteractive = this.variant === 'interactive';
    const items = this.querySelectorAll('hx-list-item');
    for (const item of items) {
      (item as HelixListItem).interactive = isInteractive;
    }
  }

  /**
   * Resolve the host's role for the current variant. Description variant
   * uses native `<dl>` semantics (returns `null` so the host carries no
   * explicit role). Interactive variant becomes `listbox`. All other
   * variants are `list`.
   * @internal
   */
  private _hostRole(): 'list' | 'listbox' | null {
    if (this.variant === 'description') return null;
    if (this.variant === 'interactive') return 'listbox';
    return 'list';
  }

  /** @internal */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const role = this._hostRole();

    if (!this._supportsIdrefRefs || role === null) {
      // Either the engine lacks IDL element references, or the variant uses
      // native <dl> semantics — clear host role/state writes so we don't
      // duplicate AT surfaces.
      internals.role = null;
      internals.ariaLabel = null;
      internals.ariaMultiSelectable = null;
    } else {
      internals.role = role;
      // Listbox is single-select today (matches the prior hardcoded
      // aria-multiselectable="false" on the inner div). When multi-select
      // becomes a use case, parameterise via a property.
      internals.ariaMultiSelectable = role === 'listbox' ? 'false' : null;
    }

    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs && role !== null) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
    }

    let resolved: string;
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
      if (this._supportsIdrefRefs && role !== null) {
        internals.ariaLabel = null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      if (this._supportsIdrefRefs && role !== null) {
        internals.ariaLabel = hostAriaLabel;
      }
    } else if (this.label) {
      resolved = this.label;
      if (this._supportsIdrefRefs && role !== null) {
        internals.ariaLabel = this.label;
      }
    } else {
      resolved = '';
      if (this._supportsIdrefRefs && role !== null) {
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

  /** @internal */
  private _handleSlotChange(): void {
    this._updateItemStates();
  }

  /** @internal */
  private readonly _handleKeydown = (e: KeyboardEvent): void => {
    if (this.variant !== 'interactive') return;

    const items = Array.from(this.querySelectorAll<HelixListItem>('hx-list-item:not([disabled])'));
    if (items.length === 0) return;

    const focused = this.querySelector<HelixListItem>('hx-list-item:focus');
    const currentIndex = focused ? items.indexOf(focused) : -1;

    let nextIndex: number;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    items[nextIndex]?.focus();
  };

  /** @internal */
  private _handleItemClick(e: Event): void {
    if (this.variant !== 'interactive') return;

    if (!(e.target instanceof HelixListItem)) return;
    const item = e.target;
    if (item.disabled) return;

    this.dispatchEvent(
      new CustomEvent<{ item: HelixListItem; value: string | undefined }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item, value: item.value },
      }),
    );
  }

  override render() {
    const isInteractive = this.variant === 'interactive';
    const isNumbered = this.variant === 'numbered';
    const isDescription = this.variant === 'description';

    const slot = html`<slot @slotchange=${this._handleSlotChange}></slot>`;

    // Dual-surface (Group 7 hx-progress-ring exemplar / hx-structured-list
    // gold standard): inner element keeps role + label for legacy AT and
    // consumer queries. Host adds cross-shadow IDREF wiring via internals.*
    // in _syncHostAriaSemantics().
    if (isDescription) {
      return html`
        <dl
          part="base"
          class="list list--${this.variant}"
          aria-label=${ifDefined(this.label)}
          @hx-list-item-click=${this._handleItemClick}
        >
          ${slot}
        </dl>
      `;
    }

    if (isNumbered) {
      return html`
        <div
          part="base"
          role="list"
          class="list list--${this.variant}"
          aria-label=${ifDefined(this.label)}
          @hx-list-item-click=${this._handleItemClick}
        >
          ${slot}
        </div>
      `;
    }

    return html`
      <div
        part="base"
        class="list list--${this.variant}"
        role=${isInteractive ? 'listbox' : 'list'}
        aria-label=${isInteractive ? this.label || nothing : ifDefined(this.label)}
        aria-multiselectable=${isInteractive ? 'false' : nothing}
        @hx-list-item-click=${this._handleItemClick}
      >
        ${slot}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList;
  }
}
