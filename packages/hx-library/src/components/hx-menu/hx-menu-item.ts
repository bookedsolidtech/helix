import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixMenuItemStyles } from './hx-menu-item.styles.js';
import { devWarn } from '../../utils/dev-warn.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  supportsIdrefElementReferences,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';
import { flattenAccName } from '../../utils/aria-flatten.js';

/**
 * A single interactive item for use inside `hx-menu`. Supports normal, checkbox,
 * and radio types, loading state, prefix/suffix slots, and submenu nesting.
 *
 * Group 5b host-canonical: `role="menuitem"` (or `menuitemcheckbox` /
 * `menuitemradio` based on `type`) lives on the **host** via
 * `_internals.role`. The roving tabindex is written to the host, so the host
 * is the focusable surface and lands directly under the parent `<hx-menu>`
 * (which carries `role="menu"`) in the AT walked tree. The inner element is
 * presentational on the modern path — no role, no aria-* attributes — and
 * carries only click/keyboard event handlers. Keyboard activation
 * (Enter/Space) is owned by the host's `keydown` handler.
 *
 * Cross-shadow naming: consumer-supplied `aria-label` / `aria-labelledby` on
 * the host project to `internals.ariaLabel` / `internals.ariaLabelledByElements`
 * via the shared IDREF mirror. The slotted text content is used as the default
 * accessible name when no override is set (AT walks slotted children
 * automatically through the host's role).
 *
 * @summary Interactive item within an hx-menu.
 *
 * @tag hx-menu-item
 *
 * @slot - Default slot for the item label.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Shortcut text or icon rendered after the label.
 * @slot submenu - A nested hx-menu for submenu content.
 *
 * @fires {CustomEvent<{item: HelixMenuItem, value: string}>} hx-item-select - Dispatched when the item is activated via click, Enter, or Space.
 * @fires {CustomEvent<{item: HelixMenuItem}>} hx-item-submenu-open - Dispatched when ArrowRight is pressed on an item with a submenu.
 * @fires {CustomEvent<{item: HelixMenuItem}>} hx-item-submenu-close - Dispatched when ArrowLeft is pressed on an item, signaling the parent to close the submenu and return focus.
 *
 * @csspart base - The root item element.
 * @csspart prefix - Prefix slot wrapper.
 * @csspart label - Label slot wrapper.
 * @csspart suffix - Suffix slot wrapper.
 * @csspart submenu-icon - The chevron icon indicating a submenu.
 * @csspart checked-icon - The checkmark icon for checkbox-type items.
 *
 * @cssprop [--hx-menu-item-color=var(--hx-color-neutral-900)] - Item text color.
 * @cssprop [--hx-menu-item-hover-bg=var(--hx-color-neutral-100)] - Item hover/focus background.
 */
@customElement('hx-menu-item')
export class HelixMenuItem extends HelixElement {
  static override styles = [helixMenuItemStyles, forcedColorsInteractive];

  /**
   * Test seam (codex push-gate round-1 finding 3 mirror of hx-select
   * pattern): when set to `true` or `false`, overrides the platform
   * `supportsIdrefElementReferences` probe before `connectedCallback`
   * seeds `_supportsIdrefRefs`. Tests that need to exercise the fallback
   * path must select it BEFORE the host connects so tabindex / role
   * placement matches a legacy engine for the entire lifecycle.
   *
   * Production code MUST NOT touch this field. It is `static` so the test
   * stub cleanup is global and obvious.
   * @internal
   */
  static __testSupportsIdrefRefsOverride: boolean | null = null;

  /**
   * @internal Managed by parent hx-menu for roving tabindex.
   * Only the active item in the menu has tabindex=0; all others have -1.
   */
  @state()
  private _rovingTabIndex = -1;

  /** @internal Set the roving tabindex value. Called by parent hx-menu. */
  setRovingTabIndex(value: number): void {
    this._rovingTabIndex = value;
    this._applyHostTabIndex();
  }

  /** Set whether the nested submenu is open. Called by the component managing submenu visibility. */
  setSubmenuOpen(open: boolean): void {
    this._submenuOpen = open;
  }

  /**
   * The value associated with this item, emitted in the hx-select event.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Whether the item is disabled. Prevents interaction and event dispatch.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the item is checked. Only meaningful when type="checkbox".
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  /**
   * The type of menu item. "checkbox" renders a checkmark and toggles checked state.
   * "radio" renders a checkmark and emits selection for radio-group behavior.
   * @attr type
   */
  @property({ type: String, reflect: true })
  type: 'normal' | 'checkbox' | 'radio' = 'normal';

  /**
   * Whether the item is in a loading state. Shows a spinner and prevents interaction.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /** @internal */
  @state()
  private _hasSubmenu = false;

  /** @internal Tracks whether the nested submenu is currently open. */
  @state()
  private _submenuOpen = false;

  /** @internal */
  @query('.menu-item') private _menuItemEl!: HTMLElement | null;

  // ─── Host-canonical ARIA bookkeeping ───

  /** @internal */
  private _supportsIdrefRefs = true;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Resolved accessible name for the menu item — read by both
   * `_syncHostAriaSemantics()` (modern path: host `internals.ariaLabel`)
   * and the fallback `render()` branch (legacy path: inner
   * `div[role="menuitem*"]` `aria-label`). Empty string means "no
   * override" — slotted text content provides the implicit name through
   * the announced surface (host on modern; inner div on fallback). AccName
   * 1.2 §4.3.1 precedence: consumer host `aria-labelledby` (flattened) >
   * consumer host `aria-label` > implicit slotted text.
   * @internal
   */
  private _resolvedAccessibleName = '';

  /**
   * Focus the menu item. On the modern host-canonical path, focus lands on
   * the host (which carries the roving tabindex and announced role). On the
   * legacy fallback path, focus delegates to the inner element which still
   * carries the role.
   */
  override focus(options?: FocusOptions): void {
    if (this._supportsIdrefRefs) {
      // Host is the canonical Tab stop on the modern path.
      HTMLElement.prototype.focus.call(this, options);
    } else {
      this._menuItemEl?.focus(options);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Honour the static test override so synthetic environments choose the
    // path BEFORE connect runs (mirrors hx-select's seam — codex push-gate
    // round-1 finding 3 needs deterministic fallback-path entry to assert
    // host.tabIndex stays out of the tab order).
    const ctor = this.constructor as typeof HelixMenuItem;
    this._supportsIdrefRefs =
      ctor.__testSupportsIdrefRefsOverride !== null
        ? ctor.__testSupportsIdrefRefsOverride
        : supportsIdrefElementReferences(this._internals);
    // WCAG 4.1.2: menuitem role is only valid inside a role="menu" or role="menubar" container.
    // Check the closest ancestor with a menu role.
    const menuHost = this.closest('hx-menu, hx-split-button, [role="menu"], [role="menubar"]');
    if (!menuHost) {
      devWarn(
        'hx-menu-item',
        'hx-menu-item must be used inside an hx-menu or an element with role="menu". ' +
          'An orphaned menuitem violates WCAG 1.3.1 (Info and Relationships).',
      );
    }
    // Keyboard handling lives on the HOST so the active surface (the host
    // on the modern path; either the host or the inner div in delegating
    // engines) receives keydown events. Activation (Enter/Space) and
    // submenu navigation (ArrowLeft/ArrowRight) are routed here; the
    // parent hx-menu owns ArrowUp/ArrowDown/Home/End/typeahead.
    this.addEventListener('keydown', this._handleKeyDown);
    this.addEventListener('click', this._handleClick);
    this._syncHostAriaSemantics();
    this._applyHostTabIndex();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncHostAriaSemantics();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeyDown);
    this.removeEventListener('click', this._handleClick);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('checked') ||
      changedProperties.has('type') ||
      changedProperties.has('loading') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_hasSubmenu') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_submenuOpen')
    ) {
      this._syncHostAriaSemantics();
    }
    if (
      (changedProperties as Map<PropertyKey, unknown>).has('_rovingTabIndex') ||
      changedProperties.has('disabled')
    ) {
      this._applyHostTabIndex();
    }
  }

  /**
   * Apply the roving tabindex to the host (modern path) so the host is the
   * Tab stop. Disabled items are non-tabbable.
   *
   * Codex push-gate round-1 finding 3: on the fallback path
   * (`_supportsIdrefRefs === false`), the inner `.menu-item` element
   * carries `role="menuitem"` and the roving tabindex via the template
   * (see `render()`'s legacy branch). If we ALSO assign a non-negative
   * tabindex to the host, the user gets two focusable surfaces per item —
   * Tab can land on the host even though the AT-announced role/aria-* live
   * on the inner element. The host MUST be removed from the tab order on
   * the fallback path; the inner element is the canonical Tab stop.
   * @internal
   */
  private _applyHostTabIndex(): void {
    if (!this._supportsIdrefRefs) {
      // Fallback path: inner `.menu-item` is the focusable surface. Keep
      // the host out of the sequential focus order entirely.
      this.tabIndex = -1;
      return;
    }
    if (this.disabled) {
      this.tabIndex = -1;
    } else {
      this.tabIndex = this._rovingTabIndex;
    }
  }

  /**
   * Mirror menuitem semantics onto the host via ElementInternals. Role is
   * derived from `type` (normal → menuitem, checkbox → menuitemcheckbox,
   * radio → menuitemradio). aria-disabled, aria-checked, aria-haspopup,
   * aria-expanded, and aria-busy reactively follow component state.
   * Consumer-supplied `aria-label` / `aria-labelledby` on the host project
   * onto `internals.ariaLabel` / `internals.ariaLabelledByElements`.
   * @internal
   */
  private _syncHostAriaSemantics(): void {
    const internals = this._internals;
    const role = this._getRole();
    internals.role = role;
    internals.ariaDisabled = this.disabled ? 'true' : null;

    const hasCheckableRole = this.type === 'checkbox' || this.type === 'radio';
    internals.ariaChecked = hasCheckableRole ? (this.checked ? 'true' : 'false') : null;

    internals.ariaHasPopup = this._hasSubmenu ? 'menu' : null;
    internals.ariaExpanded = this._hasSubmenu ? (this._submenuOpen ? 'true' : 'false') : null;
    internals.ariaBusy = this.loading ? 'true' : null;

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

    // AccName 1.2 §4.3.1 precedence: consumer aria-labelledby (resolved) >
    // consumer aria-label > implicit slotted text (left to AccName
    // computation through the host's role). When neither override is
    // supplied, ariaLabel is cleared so AT walks slotted children for the
    // accessible name. The resolved string is cached on
    // `_resolvedAccessibleName` so the fallback render branch (legacy path:
    // AT reads inner div) can mirror the same override without duplicating
    // the precedence ladder.
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
        // Modern path: element refs win; clear ariaLabel so they aren't
        // shadowed by a stale string. Fallback branch reads
        // `_resolvedAccessibleName` for its inner-div mirror.
        internals.ariaLabel = null;
      } else {
        internals.ariaLabel = flattened || null;
      }
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
      internals.ariaLabel = hostAriaLabel;
    } else {
      // No override — leave the announced surface to walk slotted text.
      internals.ariaLabel = null;
    }

    // Codex push-gate round-2 finding 2: keep the resolved override
    // available for the legacy render branch. Request a re-render so the
    // fallback `<div role="menuitem*" aria-label=...>` picks up the new
    // value when host aria-* changes after first paint.
    if (this._resolvedAccessibleName !== resolved) {
      this._resolvedAccessibleName = resolved;
      if (!this._supportsIdrefRefs) {
        this.requestUpdate();
      }
    }
  }

  /** @internal */
  private _handleSubmenuSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSubmenu = slot.assignedElements().length > 0;
  }

  /** @internal */
  private _activate(): void {
    if (this.disabled || this.loading) return;

    if (this.type === 'checkbox') {
      this.checked = !this.checked;
    } else if (this.type === 'radio') {
      const menu = this.closest('hx-menu');
      if (menu) {
        menu
          .querySelectorAll<HelixMenuItem>(':scope > hx-menu-item[type="radio"]')
          .forEach((sibling) => {
            sibling.checked = sibling === this;
          });
      } else {
        this.checked = true;
      }
    }

    this.dispatchEvent(
      new CustomEvent<{ item: HelixMenuItem; value: string }>('hx-item-select', {
        bubbles: true,
        composed: true,
        detail: { item: this, value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleClick = (e: MouseEvent): void => {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._activate();
  };

  /** @internal */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    // Only handle keys whose target is THIS host (or its shadow). The
    // parent hx-menu's keydown handler runs first via bubbling and may
    // already have moved focus; we ignore events that aren't aimed at us.
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._activate();
      return;
    }

    if (e.key === 'ArrowRight' && this._hasSubmenu) {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent<{ item: HelixMenuItem }>('hx-item-submenu-open', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: { item: this },
        }),
      );
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent<{ item: HelixMenuItem }>('hx-item-submenu-close', {
          bubbles: true,
          composed: true,
          cancelable: true,
          detail: { item: this },
        }),
      );
    }
  };

  /** @internal */
  private _renderCheckedIcon() {
    return html`
      <span part="checked-icon" class="menu-item__checked-icon" aria-hidden="true">
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    `;
  }

  /** @internal */
  private _renderSubmenuIcon() {
    return html`
      <span part="submenu-icon" class="menu-item__submenu-icon" aria-hidden="true">
        <svg
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    `;
  }

  /** @internal */
  private _renderSpinner() {
    return html`
      <svg class="menu-item__spinner" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.3" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  /** @internal */
  private _getRole(): 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' {
    switch (this.type) {
      case 'checkbox':
        return 'menuitemcheckbox';
      case 'radio':
        return 'menuitemradio';
      default:
        return 'menuitem';
    }
  }

  override render() {
    const role = this._getRole();
    const hasCheckableRole = this.type === 'checkbox' || this.type === 'radio';
    const classes = {
      'menu-item': true,
      'menu-item--checked': this.checked,
    };

    // Modern host-canonical path: role/aria-* and tabindex live on the
    // host via `_internals` and the `_applyHostTabIndex()` helper. The
    // inner element is a presentational div (ARIA 1.2 forbids
    // role="presentation" on focusable elements; non-focusable plain div
    // is the cleanest strip). Click + keydown handlers stay on the host
    // via the wrapper div for delegation; this preserves keyboard
    // activation while leaving the host as the AT-announced surface.
    if (this._supportsIdrefRefs) {
      // Click + keydown handlers are bound on the host in
      // connectedCallback() — keydown does not propagate INTO shadow
      // DOM, so binding inside the template would miss host-focused
      // events on the modern path.
      return html`
        <div part="base" class=${classMap(classes)}>
          ${this.loading ? this._renderSpinner() : nothing}
          ${hasCheckableRole ? this._renderCheckedIcon() : nothing}
          <span part="prefix" class="menu-item__prefix">
            <slot name="prefix"></slot>
          </span>
          <span part="label" class="menu-item__label">
            <slot></slot>
          </span>
          <span part="suffix" class="menu-item__suffix">
            <slot name="suffix"></slot>
          </span>
          ${this._hasSubmenu ? this._renderSubmenuIcon() : nothing}
          <slot name="submenu" @slotchange=${this._handleSubmenuSlotChange}></slot>
        </div>
      `;
    }

    // Legacy fallback: keep role/aria-* on inner div for AT without IDL
    // element references on ElementInternals. Click + keydown still
    // listen on the host (see connectedCallback) so behaviour is uniform.
    //
    // Codex push-gate round-2 finding 2: AT on the fallback path
    // announces the inner div, so it MUST mirror the same accessible name
    // resolved by `_syncHostAriaSemantics()` (consumer host aria-label /
    // aria-labelledby flatten). Empty string means "no override" — let AT
    // walk slotted text content for the implicit name.
    const fallbackAriaLabel = this._resolvedAccessibleName || nothing;
    return html`
      <div
        part="base"
        class=${classMap(classes)}
        role=${role}
        tabindex=${this.disabled ? '-1' : String(this._rovingTabIndex)}
        aria-label=${fallbackAriaLabel}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-checked=${hasCheckableRole ? (this.checked ? 'true' : 'false') : nothing}
        aria-haspopup=${this._hasSubmenu ? 'menu' : nothing}
        aria-expanded=${this._hasSubmenu ? (this._submenuOpen ? 'true' : 'false') : nothing}
        aria-busy=${this.loading ? 'true' : nothing}
      >
        ${this.loading ? this._renderSpinner() : nothing}
        ${hasCheckableRole ? this._renderCheckedIcon() : nothing}
        <span part="prefix" class="menu-item__prefix">
          <slot name="prefix"></slot>
        </span>
        <span part="label" class="menu-item__label">
          <slot></slot>
        </span>
        <span part="suffix" class="menu-item__suffix">
          <slot name="suffix"></slot>
        </span>
        ${this._hasSubmenu ? this._renderSubmenuIcon() : nothing}
        <slot name="submenu" @slotchange=${this._handleSubmenuSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-menu-item': HelixMenuItem;
  }
}
