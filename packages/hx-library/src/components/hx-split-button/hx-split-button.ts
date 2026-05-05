import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixSplitButtonStyles } from './hx-split-button.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import type { HelixMenuItem } from '../hx-menu/hx-menu-item.js';
import { devWarn } from '../../utils/dev-warn.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import { getMenuItemTypeaheadLabel } from '../../utils/menu-label.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextSplitButtonId = createIdCounter('hx-split-button');

/**
 * A split button combining a primary action button with an attached dropdown
 * menu for secondary actions. Implements the ARIA menu button pattern for
 * full keyboard and screen reader support.
 *
 * ## Architecture Note: Composite host with two interactive children (Group 5b)
 *
 * The host wraps a primary `<button>`, a dropdown trigger `<button>`, and a
 * panel `<div role="menu">` — three ARIA-bearing surfaces that cannot all
 * collapse onto the host. Group 5b keeps role placement on the inner
 * elements (consistent with `hx-overflow-menu`). The host carries no role.
 *
 * What Group 5b adds:
 * - **Host-attribute label mirror** via `installAriaIdrefMirror`: consumer
 *   `aria-label` / `aria-labelledby` on the host flow to the inner primary
 *   button's `aria-label`. Replaces the legacy `accessible-label` shim,
 *   which was a workaround for ARIAMixin shadowing on the host. The shim
 *   is preserved with a one-time devWarn for one minor version of back-
 *   compat; new code should use the standard `aria-label` attribute.
 * - **Roving tabindex** on slotted `hx-menu-item` children inside the
 *   panel. Only the focused item carries `tabindex=0`; arrow key
 *   navigation rewrites the tabindex map via `_applyRovingTabIndex()`.
 *   `setRovingTabIndex` is the same setter used by `hx-menu` for cross-
 *   family pattern alignment.
 * - **First-character typeahead** with 500ms timeout matching `hx-menu`.
 *
 * @summary Primary action button with attached dropdown menu for secondary actions.
 *
 * @tag hx-split-button
 *
 * @slot - Primary button label text.
 * @slot menu - `hx-menu-item` children rendered in the dropdown panel.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the primary button is clicked and is not disabled.
 * @fires {CustomEvent<{value: string; label: string}>} hx-select - Dispatched when
 *   a menu item is selected from the dropdown.
 *
 * @csspart button - The primary action button element.
 * @csspart trigger - The dropdown trigger button element.
 * @csspart menu - The dropdown menu panel.
 *
 * @cssprop [--hx-split-button-menu-max-height=18rem] - Maximum height of the dropdown menu panel before scrolling.
 * @cssprop [--hx-split-button-bg=var(--hx-color-primary-500)] - Background color for both buttons.
 * @cssprop [--hx-split-button-color=var(--hx-color-neutral-0)] - Text/icon color for both buttons.
 * @cssprop [--hx-split-button-border-color=transparent] - Border color.
 * @cssprop [--hx-split-button-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-split-button-divider-color=var(--hx-color-primary-900)] - Color of the divider between primary and trigger.
 * @cssprop [--hx-split-button-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-split-button-font-weight=var(--hx-font-weight-semibold)] - Font weight.
 * @cssprop [--hx-split-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-split-button-menu-bg=var(--hx-color-neutral-0)] - Dropdown menu background.
 * @cssprop [--hx-split-button-menu-border-color=var(--hx-color-neutral-200)] - Dropdown menu border color.
 * @cssprop [--hx-split-button-menu-border-radius=var(--hx-border-radius-md)] - Dropdown menu border radius.
 * @cssprop [--hx-split-button-menu-shadow] - Dropdown menu box shadow.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-filter-brightness-hover] - CSS filter.
 * @cssprop [--hx-filter-brightness-active] - CSS filter.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-color-primary-300] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-error-400] - Color.
 * @cssprop [--hx-color-error-600] - Color.
 * @cssprop [--hx-color-primary-200] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-overlay-black-10] - Overlay color.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 */
@customElement('hx-split-button')
export class HelixSplitButton extends HelixElement {
  static override styles = [helixSplitButtonStyles, forcedColorsInteractive];

  // ─── Internal References ───

  /**
   * Reference to the dropdown menu panel element, used for positioning and focus management.
   * @internal
   */
  @query('.split-button__menu')
  private _menuPanel: HTMLElement | undefined;

  /**
   * Reference to the dropdown trigger button element, used to return focus after menu closes.
   * @internal
   */
  @query('.split-button__trigger')
  private _triggerButton: HTMLButtonElement | undefined;

  // ─── Internal State ───

  /**
   * Tracks whether the dropdown menu is currently open.
   * @internal
   */
  @state() private _open = false;

  // ─── Public Properties ───

  /**
   * Visual style variant of the split button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' = 'primary';

  /**
   * Size of the split button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the split button is disabled. Both the primary button and the
   * trigger are disabled when this is true.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Primary button label text. When set, overrides the default slot content.
   * @attr label
   */
  @property({ type: String })
  label: string | undefined = undefined;

  /**
   * @deprecated Use the standard host `aria-label` attribute instead. Group
   * 5b replaces the `accessible-label` shim with a host-attribute mirror
   * driven by `installAriaIdrefMirror` — consumer host `aria-label` /
   * `aria-labelledby` flow to the inner primary button's `aria-label`,
   * which is the same composed-tree result as the legacy shim without
   * the ARIAMixin shadowing concern.
   *
   * The attribute remains observed for one minor version so existing
   * consumers do not regress; setting it logs a devWarn pointing them to
   * the standard `aria-label` path.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel = '';

  /**
   * Accessible label for the dropdown trigger button. Override for localization.
   * @attr label-trigger
   */
  @property({ type: String, attribute: 'label-trigger' })
  labelTrigger = 'More actions';

  /**
   * Accessible label for the dropdown menu panel. Override for localization.
   * @attr label-menu
   */
  @property({ type: String, attribute: 'label-menu' })
  labelMenu = 'Secondary actions';

  // ─── Unique IDs ───

  /**
   * Stable unique ID for the dropdown menu panel element, used to wire aria-controls on the trigger button.
   * @internal
   */
  private readonly _menuId = `${_nextSplitButtonId()}-menu`;

  // ─── Host-attribute label mirror state ───

  /**
   * Resolved accessible name for the primary action button — written to
   * the inner primary button's `aria-label` on render. AccName 1.2 §4.3.1
   * precedence: host `aria-labelledby` (resolved IDREFs, flattened) >
   * host `aria-label` > deprecated `accessible-label` (with devWarn) >
   * `label` property > slotted text content (no aria-label set when this
   * branch is taken so AT walks the inner content for the name).
   * @internal
   */
  @state() private _resolvedPrimaryLabel: string | null = null;

  /** @internal */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  // ─── Roving tabindex + typeahead state ───

  /** @internal */
  private _rovingIndex = -1;

  /** @internal */
  private _typeaheadBuffer = '';

  /** @internal */
  private _typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleDocumentKeydown);
    this._syncResolvedPrimaryLabel();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncResolvedPrimaryLabel();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('label') || changedProperties.has('accessibleLabel')) {
      this._syncResolvedPrimaryLabel();
    }
  }

  /**
   * Resolve the primary button's accessible name from host attributes
   * and (deprecated) properties. See `_resolvedPrimaryLabel` jsdoc for
   * precedence rules.
   * @internal
   */
  private _syncResolvedPrimaryLabel(): void {
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    const consumerLabelEls = resolveIdrefTokens(this, liveLabelledBy);

    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    const flattenedFromIdrefs = consumerLabelEls
      .filter(isVisibleForAccName)
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() : '';

    let resolved: string | null = null;
    if (flattenedFromIdrefs) {
      resolved = flattenedFromIdrefs;
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else if (this.accessibleLabel) {
      // Deprecated path — emit a one-time devWarn pointing consumers at
      // the standard aria-label flow.
      if (!this._deprecatedAccessibleLabelWarned) {
        this._deprecatedAccessibleLabelWarned = true;
        devWarn(
          'hx-split-button',
          '`accessible-label` is deprecated; use the standard `aria-label` attribute on hx-split-button instead. The shim continues to work in this minor version but will be removed in a future release.',
        );
      }
      resolved = this.accessibleLabel;
    } else if (this.label) {
      resolved = this.label;
    } else {
      // No explicit name supplied — leave aria-label off the primary
      // button so AT walks the slotted content for the accessible name.
      resolved = null;
    }

    this._resolvedPrimaryLabel = resolved;
  }

  /** @internal */
  private _deprecatedAccessibleLabelWarned = false;

  // ─── Outside-click / document keydown ───

  /** @internal */
  private readonly _handleOutsideClick = (e: MouseEvent): void => {
    if (!this._open) return;
    const target = e.target as Node;
    if (!this.contains(target) && target !== this) {
      this._closeMenu();
    }
  };

  /** @internal */
  private readonly _handleDocumentKeydown = (e: KeyboardEvent): void => {
    if (!this._open) return;
    if (e.key === 'Tab') {
      this._closeMenu();
    }
  };

  // ─── Primary Button Handlers ───

  /** @internal */
  private _handlePrimaryClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the primary button is clicked.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent<{ originalEvent: MouseEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );
  }

  /** @internal */
  private _handlePrimaryKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._openMenu();
    }
  }

  // ─── Trigger Button Handlers ───

  /** @internal */
  private _handleTriggerClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Stop propagation so _handleOutsideClick does not immediately close.
    e.stopPropagation();
    this._toggleMenu();
  }

  /** @internal */
  private _handleTriggerKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._openMenu();
    }
  }

  // ─── Menu Key Navigation ───

  /** @internal */
  private _handleMenuKeydown(e: KeyboardEvent): void {
    const items = this._getMenuItems();
    if (items.length === 0) return;

    // document.activeElement returns the hx-menu-item host element when
    // host-canonical (post-Group-5b) — matches items[] directly. On the
    // legacy fallback path, focus delegates to the inner div but
    // document.activeElement still resolves to the host so the same
    // index works.
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        this._focusMenuItem(items, next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        this._focusMenuItem(items, prev);
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeMenu();
        this._triggerButton?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        this._focusMenuItem(items, 0);
        break;
      }
      case 'End': {
        e.preventDefault();
        this._focusMenuItem(items, items.length - 1);
        break;
      }
      default: {
        if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this._handleTypeahead(e.key, items);
        }
        break;
      }
    }
  }

  /** @internal */
  private _focusMenuItem(items: HelixMenuItem[], index: number): void {
    this._rovingIndex = index;
    this._applyRovingTabIndex(items);
    items[index]?.focus();
  }

  /**
   * Roving tabindex: only the focused item carries tabindex=0; the rest
   * are tabindex=-1. Tab from the panel exits the menu via document
   * keydown (line ~_handleDocumentKeydown), so the closing-Tab path
   * remains correct.
   * @internal
   */
  private _applyRovingTabIndex(items: HelixMenuItem[]): void {
    items.forEach((item, i) => {
      item.setRovingTabIndex(i === this._rovingIndex ? 0 : -1);
    });
  }

  /** @internal */
  private _handleTypeahead(char: string, items: HelixMenuItem[]): void {
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
    }
    this._typeaheadBuffer += char.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeaheadBuffer = '';
      this._typeaheadTimer = null;
    }, 500);

    // Codex push-gate round-7 finding 3: shared submenu-aware label
    // extractor — see hx-menu / hx-dropdown for rationale.
    const match = items.findIndex((item) => {
      const text = getMenuItemTypeaheadLabel(item).toLowerCase();
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._focusMenuItem(items, match);
    }
  }

  // ─── Menu Item Selection ───

  /** @internal */
  private _handleMenuItemSelect(e: Event): void {
    if (!(e instanceof CustomEvent)) return;
    const custom = e as CustomEvent<{ item: HelixMenuItem; value: string }>;
    this._closeMenu();
    this._triggerButton?.focus();

    const item = custom.detail.item;
    const label = item?.textContent?.trim() ?? '';

    /**
     * Dispatched when a menu item is selected.
     * @event hx-select
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string; label: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value: custom.detail.value, label },
      }),
    );
  }

  // ─── Menu Helpers ───

  /** @internal */
  private _openMenu(): void {
    if (this._open) return;
    this._open = true;
    // Focus the first enabled menu item after the panel renders;
    // initialize roving tabindex so Tab from outside lands on the same
    // item that has visual focus.
    void this.updateComplete
      .then(() => {
        const items = this._getMenuItems();
        this._rovingIndex = items.length > 0 ? 0 : -1;
        this._applyRovingTabIndex(items);
        items[0]?.focus();
      })
      .catch(() => undefined);
  }

  /** @internal */
  private _closeMenu(): void {
    this._open = false;
  }

  /** @internal */
  private _toggleMenu(): void {
    if (this._open) {
      this._closeMenu();
    } else {
      this._openMenu();
    }
  }

  /**
   * Returns the enabled hx-menu-item host elements assigned to the `menu` slot.
   * HelixMenuItem overrides focus() to delegate to its inner element, so calling
   * .focus() on hosts works correctly. document.activeElement returns the host
   * element when the inner shadow element has focus, enabling correct index tracking.
   */
  /** @internal */
  private _getMenuItems(): HelixMenuItem[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="menu"]');
    if (!slot) return [];

    return slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HelixMenuItem =>
          el.tagName.toLowerCase() === 'hx-menu-item' && !(el as HelixMenuItem).disabled,
      );
  }

  // ─── Render ───

  override render() {
    const containerClasses = {
      'split-button': true,
      [`split-button--${this.variant}`]: true,
      [`split-button--${this.size}`]: true,
    };

    const menuClasses = {
      'split-button__menu': true,
      'split-button__menu--open': this._open,
    };

    const chevronClasses = {
      'split-button__chevron': true,
      'split-button__chevron--open': this._open,
    };

    return html`
      <div class=${classMap(containerClasses)}>
        <!-- Primary action button -->
        <button
          part="button"
          class="split-button__primary"
          ?disabled=${this.disabled}
          type="button"
          aria-label=${this._resolvedPrimaryLabel ?? nothing}
          @click=${this._handlePrimaryClick}
          @keydown=${this._handlePrimaryKeydown}
        >
          ${this.label !== undefined ? this.label : html`<slot></slot>`}
        </button>

        <!-- Dropdown trigger button -->
        <button
          part="trigger"
          class="split-button__trigger"
          ?disabled=${this.disabled}
          aria-haspopup="menu"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-controls=${this._menuId}
          aria-label=${this.labelTrigger}
          type="button"
          @click=${this._handleTriggerClick}
          @keydown=${this._handleTriggerKeydown}
        >
          <span class=${classMap(chevronClasses)} aria-hidden="true">
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>

        <!-- Dropdown menu panel -->
        <div
          part="menu"
          id=${this._menuId}
          class=${classMap(menuClasses)}
          role="menu"
          aria-label=${this.labelMenu}
          @keydown=${this._handleMenuKeydown}
          @hx-item-select=${this._handleMenuItemSelect}
        >
          <slot name="menu"></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-split-button': HelixSplitButton;
  }
}
