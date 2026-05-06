import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { HelixElement } from '../../base/index.js';
import { helixListItemStyles } from './hx-list-item.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * A rich list item for use inside `hx-list`.
 *
 * Group 7 host-canonical: `role="option"` (interactive listbox mode) is
 * mirrored onto the **host** via `_internals.role` AND the legacy
 * setAttribute('role',...) path. The dual-surface pattern preserves the
 * existing imperative host-attribute behaviour (so consumers querying
 * `host.getAttribute('role')` still work) while adding cross-shadow IDREF
 * wiring through `internals.ariaLabelledByElements` for engines that
 * support it.
 *
 * @summary Individual list item with optional prefix, suffix, description, link, and disabled/selected states.
 *
 * @tag hx-list-item
 *
 * @slot - Default slot for the item label text.
 * @slot prefix - Icon, avatar, or content rendered before the label.
 * @slot suffix - Icon, badge, or text rendered after the label.
 * @slot description - Secondary descriptive text rendered below the label.
 *
 * @fires {CustomEvent<{item: HelixListItem, value: string | undefined}>} hx-list-item-click -
 *   Dispatched when the item is clicked and not disabled.
 *
 * @csspart base - The root item element (li, dt, dd, or wrapper).
 * @csspart prefix - The prefix slot container.
 * @csspart label - The label slot container.
 * @csspart description - The description slot container.
 * @csspart suffix - The suffix slot container.
 *
 * @cssprop [--hx-list-item-padding=var(--hx-space-3)] - Item padding.
 * @cssprop [--hx-list-item-color=var(--hx-color-neutral-900)] - Item text color.
 * @cssprop [--hx-list-item-bg-hover=var(--hx-color-neutral-50)] - Item hover background.
 * @cssprop [--hx-list-item-bg-selected=var(--hx-color-primary-50)] - Selected item background.
 * @cssprop [--hx-list-item-color-selected=var(--hx-color-primary-700)] - Selected item text color.
 * @cssprop [--hx-list-item-description-color=var(--hx-color-neutral-500)] - Description text color.
 */
@customElement('hx-list-item')
export class HelixListItem extends HelixElement {
  static override styles = [helixListItemStyles, forcedColorsSurface];

  /**
   * Test seam (Group 7 host-canonical migration): see other Group 7 components.
   * Production code MUST NOT touch this field.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * Whether the item is disabled. Prevents interaction.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the item is selected (used in interactive mode).
   * @attr selected
   */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /**
   * When set, renders the item as a link (only in non-interactive variants).
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * The value associated with this item (used with hx-select).
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * Set by the parent hx-list to indicate this item is part of an interactive listbox.
   * Controls CSS styling and ARIA role via host attributes.
   * @attr interactive
   */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  /**
   * Item type for description list variant. Use 'term' for <dt> and 'definition' for <dd>.
   * @attr type
   */
  @property({ type: String, reflect: true })
  type: 'default' | 'term' | 'definition' = 'default';

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /** @internal */
  private _resolvedAccessibleName = '';

  override connectedCallback(): void {
    super.connectedCallback();
    const ctor = this.constructor as typeof HelixListItem;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    this._syncHostAria();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAria();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps);
    if (
      changedProps.has('interactive') ||
      changedProps.has('selected') ||
      changedProps.has('disabled')
    ) {
      this._syncHostAria();
    }
  }

  /**
   * Syncs ARIA attributes to the host element when in interactive (listbox option) mode.
   * Preserves the prior imperative `setAttribute('role', 'option')` path so existing
   * consumer queries and tests continue to pass. ALSO mirrors the same surface onto
   * `internals.role` / `internals.ariaSelected` (modern path) so cross-shadow IDREF
   * resolution through `internals.ariaLabelledByElements` works on engines that
   * support it.
   */
  /** @internal */
  private _syncHostAria(): void {
    const internals = this._internals;
    const isInteractiveOption = this.interactive;

    if (isInteractiveOption) {
      this.setAttribute('role', 'option');
      this.setAttribute('aria-selected', String(this.selected));
      if (this.disabled) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
      if (!this.disabled) {
        this.setAttribute('tabindex', '0');
      } else {
        this.removeAttribute('tabindex');
      }

      if (this._supportsIdrefRefs) {
        internals.role = 'option';
        internals.ariaSelected = this.selected ? 'true' : 'false';
        internals.ariaDisabled = this.disabled ? 'true' : null;
      } else {
        internals.role = null;
        internals.ariaSelected = null;
        internals.ariaDisabled = null;
      }
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-selected');
      this.removeAttribute('aria-disabled');
      this.removeAttribute('tabindex');

      internals.role = null;
      internals.ariaSelected = null;
      internals.ariaDisabled = null;
    }

    // Cross-shadow IDREF wiring (independent of role placement). Consumer-
    // supplied `aria-labelledby` on the host resolves through the shared
    // mirror, projecting onto `ariaLabelledByElements` on engines that
    // support it.
    const hostAriaLabel = this.getAttribute('aria-label')?.trim() || '';
    const consumerLabelledBy = this.getAttribute('aria-labelledby');
    const labelEls = resolveIdrefTokens(this, consumerLabelledBy);
    const hasEffectiveLabelledBy = labelEls.length > 0;

    type InternalsWithRefs = ElementInternals & {
      ariaLabelledByElements: Element[] | null;
    };

    if (this._supportsIdrefRefs && isInteractiveOption) {
      const refsInternals = internals as InternalsWithRefs;
      refsInternals.ariaLabelledByElements = hasEffectiveLabelledBy ? labelEls : null;
      if (hasEffectiveLabelledBy) {
        // Element refs win on the modern path; clear ariaLabel so it isn't
        // shadowed by a stale string.
        internals.ariaLabel = null;
      } else if (hostAriaLabel) {
        internals.ariaLabel = hostAriaLabel;
      } else {
        internals.ariaLabel = null;
      }
    }

    let resolved = '';
    if (hasEffectiveLabelledBy) {
      resolved =
        labelEls
          .map((el) => flattenAccName(el))
          .filter(Boolean)
          .join(' ') ||
        hostAriaLabel ||
        '';
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    }
    this._resolvedAccessibleName = resolved;
  }

  /** @internal */
  private _dispatchListItemClick(): void {
    this.dispatchEvent(
      new CustomEvent<{ item: HelixListItem; value: string | undefined }>('hx-list-item-click', {
        bubbles: true,
        composed: true,
        detail: { item: this, value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this._dispatchListItemClick();
  }

  /** @internal */
  private _renderContent() {
    return html`
      <span part="prefix" class="list-item__prefix">
        <slot name="prefix"></slot>
      </span>
      <span class="list-item__body">
        <span part="label" class="list-item__label">
          <slot></slot>
        </span>
        <span part="description" class="list-item__description">
          <slot name="description"></slot>
        </span>
      </span>
      <span part="suffix" class="list-item__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  override render() {
    // Description list: render as <dt> (term) or <dd> (definition)
    if (this.type === 'term') {
      return html`
        <dt
          part="base"
          class=${classMap({ 'list-item': true, 'list-item--disabled': this.disabled })}
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          ${this._renderContent()}
        </dt>
      `;
    }

    if (this.type === 'definition') {
      return html`
        <dd
          part="base"
          class=${classMap({ 'list-item': true, 'list-item--disabled': this.disabled })}
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          ${this._renderContent()}
        </dd>
      `;
    }

    // Interactive mode: role is on the host element (ARIA ownership across shadow DOM).
    // Internal <li> uses role="presentation" so AT sees: listbox > option (host).
    if (this.interactive) {
      // In interactive mode, links are not rendered as <a> to avoid
      // invalid ARIA: focusable content inside role="option" is prohibited.
      return html`
        <li
          part="base"
          role="presentation"
          class=${classMap({
            'list-item': true,
            'list-item--selected': this.selected,
            'list-item--disabled': this.disabled,
          })}
          @click=${this._handleClick}
          @keydown=${this._handleKeydown}
        >
          ${this._renderContent()}
        </li>
      `;
    }

    // Non-interactive with href: render as link
    if (this.href !== undefined && !this.disabled) {
      return html`
        <li
          part="base"
          class="list-item"
          role="listitem"
          aria-disabled=${this.disabled ? 'true' : nothing}
        >
          <a class="list-item__link" href=${ifDefined(this.href)} @click=${this._handleClick}>
            ${this._renderContent()}
          </a>
        </li>
      `;
    }

    // Default non-interactive
    return html`
      <li
        part="base"
        class=${classMap({
          'list-item': true,
          'list-item--selected': this.selected,
          'list-item--disabled': this.disabled,
        })}
        role="listitem"
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeydown}
      >
        ${this._renderContent()}
      </li>
    `;
  }

  /** @internal */
  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.disabled) {
        this._dispatchListItemClick();
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list-item': HelixListItem;
  }
}
