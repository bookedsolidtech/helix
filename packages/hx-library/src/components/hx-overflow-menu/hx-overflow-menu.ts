import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { HelixElement, createIdCounter } from '../../base/index.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import { helixOverflowMenuStyles } from './hx-overflow-menu.styles.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextOverflowMenuId = createIdCounter('hx-overflow-menu');

/**
 * An overflow menu (kebab/meatball menu) that reveals hidden actions via a
 * floating panel. Composed from a trigger button and a slotted menu panel.
 *
 * ## Architecture Note: Host-Attribute Trigger Label Mirror (group-5b)
 *
 * The composite has TWO ARIA-bearing surfaces inside its shadow DOM: the
 * trigger button (`role` defaulted from `<button>`, with `aria-haspopup`,
 * `aria-expanded`, `aria-controls`) and the panel (`role="menu"` on the
 * inner div). The host wraps both — it cannot carry either canonical role
 * itself, so role placement remains on the inner elements.
 *
 * What Group 5b adds:
 * - **Roving tabindex** on slotted menu items (only the focused item has
 *   tabindex=0; arrow keys move focus and rewrite tabindex). Closing-Tab
 *   path is preserved (Tab moves focus past the menu and closes it).
 * - **First-character typeahead** with 500ms timeout matching `hx-menu`.
 * - **Host-attribute label mirror**: consumer-supplied `aria-label` /
 *   `aria-labelledby` on the host flow to the trigger button's
 *   `aria-label` (the trigger is the announced surface of the disclosure
 *   pattern; consumer override wins over the `label` property). The panel
 *   continues to use `labelMenu` for its own slot label.
 *
 * @summary "..." or kebab icon button that reveals hidden actions.
 *
 * @tag hx-overflow-menu
 *
 * @slot - Menu items (e.g. `<button role="menuitem">` or `<hx-menu-item>` elements).
 *
 * @fires {CustomEvent<{value: string}>} hx-select - Dispatched when a menu item is selected.
 * @fires {CustomEvent<void>} hx-show - Dispatched when the panel opens.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the panel closes.
 *
 * @csspart button - The trigger icon button element.
 * @csspart trigger - Alias for button — the trigger icon button element.
 * @csspart panel - The floating menu panel container.
 * @csspart menu - Alias for panel — the floating menu panel container.
 *
 * @cssprop [--hx-overflow-menu-panel-bg=var(--hx-color-neutral-0,#fff)] - Panel background color.
 * @cssprop [--hx-overflow-menu-panel-border=1px solid var(--hx-color-neutral-200,#e5e7eb)] - Panel border.
 * @cssprop [--hx-overflow-menu-panel-border-radius=var(--hx-border-radius-md)] - Panel border radius.
 * @cssprop [--hx-overflow-menu-panel-shadow=0 4px 16px rgba(0,0,0,0.12)] - Panel box shadow.
 * @cssprop [--hx-overflow-menu-panel-min-width=160px] - Minimum panel width.
 * @cssprop [--hx-overflow-menu-panel-z-index=1000] - Panel z-index.
 * @cssprop [--hx-overflow-menu-button-color=var(--hx-color-neutral-600)] - Trigger icon color.
 *
 * @example
 * ```html
 * <hx-overflow-menu>
 *   <button role="menuitem">Edit</button>
 *   <button role="menuitem">Delete</button>
 * </hx-overflow-menu>
 * ```
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-overflow-menu-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-size-touch-target] - Size token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-overlay-black-12] - Overlay color.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 */
@customElement('hx-overflow-menu')
export class HelixOverflowMenu extends HelixElement {
  static override styles = [helixOverflowMenuStyles, forcedColorsInteractive];

  /**
   * Preferred placement of the floating panel relative to the trigger.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end' = 'bottom-end';

  /**
   * Size of the trigger button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the trigger button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Icon orientation: vertical (kebab ⋮) or horizontal (meatball ···).
   * @attr icon
   */
  @property({ type: String, reflect: true })
  icon: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Accessible label for the trigger button. Used as a fallback when no
   * consumer-supplied `aria-label` / `aria-labelledby` is present on the
   * host. Consumer host attributes win in the AccName 1.2 §4.3.1 cascade.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'More actions';

  /**
   * Accessible label for the menu panel. Reflected as `label-menu`.
   * @attr label-menu
   */
  @property({ type: String, reflect: true, attribute: 'label-menu' })
  labelMenu = 'Actions';

  /**
   * Tracks whether the overflow menu panel is currently open and visible.
   * @internal
   */
  @state() private _open = false;

  /**
   * Resolved accessible name for the trigger button — written to the inner
   * button's `aria-label`. Recomputed via the host-attribute mirror on
   * every aria-* mutation. AccName 1.2 §4.3.1 precedence: host
   * `aria-labelledby` (flattened) > host `aria-label` > `label` property.
   * @internal
   */
  @state() private _resolvedTriggerLabel = '';

  /**
   * Index within `_getMenuItems()` of the item currently holding the
   * roving tabindex (and thus visual focus). −1 means the panel has not
   * been keyboard-focused yet (first key press lands on item 0).
   * @internal
   */
  private _rovingIndex = -1;

  /**
   * Accumulated character buffer for typeahead search within menu items.
   * @internal
   */
  private _typeaheadBuffer = '';

  /**
   * Timer handle that clears the typeahead buffer after a period of inactivity.
   * @internal
   */
  private _typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Handle for the shared host attribute / root id observer.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Unique ID for the floating panel element, used to wire aria-controls on the trigger button.
   * @internal
   */
  private readonly _panelId = `${_nextOverflowMenuId()}-panel`;

  /** @internal */
  @query('[part~="button"]') private _buttonEl!: HTMLButtonElement | null;

  /** @internal */
  @query('[part~="panel"]') private _panelEl!: HTMLElement | null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleDocumentClick, true);
    this.addEventListener('keydown', this._handleKeydown);
    this._syncResolvedTriggerLabel();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncResolvedTriggerLabel();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick, true);
    this.removeEventListener('keydown', this._handleKeydown);
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
      this._typeaheadTimer = null;
    }
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
  }

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('label')) {
      this._syncResolvedTriggerLabel();
    }
  }

  // ─── Open / Close ───

  /** @internal */
  private async _show(): Promise<void> {
    if (this._open || this.disabled) return;
    this._open = true;
    await this.updateComplete;
    await this._updatePosition();
    this._initRovingTabIndex();
    this._focusFirstItem();
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _hide(): void {
    if (!this._open) return;
    this._open = false;
    this._rovingIndex = -1;
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _toggle(): void {
    if (this._open) {
      this._hide();
    } else {
      void this._show();
    }
  }

  // ─── Positioning (Floating UI) ───

  /** @internal */
  private async _updatePosition(): Promise<void> {
    const trigger = this._buttonEl as HTMLElement | null;
    const panel = this._panelEl;
    if (!trigger || !panel) return;

    const { computePosition, flip, shift, offset } = await import('@floating-ui/dom');
    const { x, y } = await computePosition(trigger, panel, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [offset(4), flip(), shift({ padding: 8 })],
    });

    Object.assign(panel.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  // ─── Focus management ───

  /** @internal */
  private _focusFirstItem(): void {
    const items = this._getMenuItems();
    if (items.length === 0) return;
    this._rovingIndex = 0;
    this._applyRovingTabIndex();
    items[0]?.focus();
  }

  /**
   * Initialize roving tabindex on all enabled menu items: only the first
   * receives tabindex=0; the rest are tabindex=-1. Maintains the closing-
   * Tab semantics required by APG (tabbing past the menu closes it via
   * the keydown handler below).
   * @internal
   */
  private _initRovingTabIndex(): void {
    const items = this._getMenuItems();
    items.forEach((item, i) => {
      item.tabIndex = i === 0 ? 0 : -1;
    });
    this._rovingIndex = items.length > 0 ? 0 : -1;
  }

  /** @internal */
  private _applyRovingTabIndex(): void {
    const items = this._getMenuItems();
    items.forEach((item, i) => {
      item.tabIndex = i === this._rovingIndex ? 0 : -1;
    });
  }

  /** @internal */
  private _getMenuItems(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    // Allow-list of host-canonical menu-item shapes — `hx-menu-item` carries
    // its `role` via `_internals.role` (AT-only, no DOM attribute), so the
    // role-attribute checks below would miss it. Restrict the wc allow-list
    // to known menu-item hosts so siblings like `hx-menu-divider`
    // (`role="separator"`) and decorative `hx-text` / `hx-icon` slotted into
    // the panel are NOT treated as focus / typeahead targets — APG mandates
    // separators stay non-focusable.
    const isHostCanonicalMenuItem = (el: Element): boolean => el.localName === 'hx-menu-item';
    return (
      (slot
        ?.assignedElements({ flatten: true })
        .filter(
          (el) =>
            el instanceof HTMLElement &&
            !el.hasAttribute('disabled') &&
            !(el as HTMLButtonElement).disabled &&
            (el.getAttribute('role') === 'menuitem' ||
              el.getAttribute('role') === 'menuitemcheckbox' ||
              el.getAttribute('role') === 'menuitemradio' ||
              isHostCanonicalMenuItem(el)),
        ) as HTMLElement[]) ?? []
    );
  }

  // ─── Event Handlers (arrow function class fields — stable reference, no bind needed) ───

  /** @internal */
  private readonly _handleTriggerClick = (e: MouseEvent): void => {
    e.stopPropagation();
    this._toggle();
  };

  /** @internal */
  private readonly _handleDocumentClick = (e: MouseEvent): void => {
    if (!this._open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._hide();
    }
  };

  /** @internal */
  private readonly _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._hide();
      this._buttonEl?.focus();
      return;
    }
    if (e.key === 'Tab') {
      // APG: Tab moves focus past the menu and closes it. Do not
      // preventDefault; let focus advance naturally.
      this._hide();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      const items = this._getMenuItems();
      if (items.length === 0) return;
      const focused = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (e.key === 'ArrowDown') {
        next = focused < 0 || focused >= items.length - 1 ? 0 : focused + 1;
      } else if (e.key === 'ArrowUp') {
        next = focused <= 0 ? items.length - 1 : focused - 1;
      } else if (e.key === 'Home') {
        next = 0;
      } else {
        next = items.length - 1;
      }
      this._rovingIndex = next;
      this._applyRovingTabIndex();
      items[next]?.focus();
      return;
    }
    // First-character typeahead — letters only, no modifier keys, ignore Space.
    if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this._handleTypeahead(e.key);
    }
  };

  /** @internal */
  private _handleTypeahead(char: string): void {
    if (this._typeaheadTimer !== null) {
      clearTimeout(this._typeaheadTimer);
    }
    this._typeaheadBuffer += char.toLowerCase();
    this._typeaheadTimer = setTimeout(() => {
      this._typeaheadBuffer = '';
      this._typeaheadTimer = null;
    }, 500);

    const items = this._getMenuItems();
    const match = items.findIndex((item) => {
      const text = item.textContent?.trim().toLowerCase() ?? '';
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._rovingIndex = match;
      this._applyRovingTabIndex();
      items[match]?.focus();
    }
  }

  /** @internal */
  private readonly _handleSlotClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    // Group 5b round-3 (codex): bail FIRST on host-canonical `hx-menu-item`,
    // independently of what `closest()` resolves with the legacy selectors.
    // If a consumer slots a `[role="menuitem*"]` descendant inside an
    // `hx-menu-item`, `closest()` would resolve to the descendant first
    // (nearest match) and the legacy localName guard would miss, double-firing
    // `hx-select` (once here, once from `_handleSlotItemSelect`). The host
    // owns its own dispatch path; descendants of the host must defer.
    if (target.closest('hx-menu-item')) return;
    const menuItem = target.closest(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ) as HTMLElement | null;
    if (!menuItem) return;
    if (menuItem.hasAttribute('disabled') || (menuItem as HTMLButtonElement).disabled) return;
    const value = menuItem.getAttribute('data-value') ?? menuItem.textContent?.trim() ?? '';
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._hide();
  };

  /**
   * Handle `hx-item-select` bubbling from slotted `hx-menu-item` children.
   * The host-canonical shape owns its own activation (click + Enter/Space),
   * so route its event through to the composite's `hx-select` contract and
   * close the panel. Disabled items never emit `hx-item-select`, so no
   * disabled-guard is needed here.
   * @internal
   */
  private readonly _handleSlotItemSelect = (e: Event): void => {
    const detail = (e as CustomEvent<{ value: string }>).detail;
    const value = detail?.value ?? '';
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
    this._hide();
  };

  /** @internal */
  private readonly _handleSlotChange = (): void => {
    if (this._open) {
      this._initRovingTabIndex();
    }
  };

  // ─── Host-attribute trigger label mirror ───

  /**
   * Resolves the trigger button's accessible name from host attributes and
   * the `label` property. AccName 1.2 §4.3.1 precedence:
   *   1. Host `aria-labelledby` (resolved IDREFs, flattened)
   *   2. Host `aria-label`
   *   3. `label` property
   * @internal
   */
  private _syncResolvedTriggerLabel(): void {
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

    let resolved = '';
    if (flattenedFromIdrefs) {
      resolved = flattenedFromIdrefs;
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else {
      resolved = this.label;
    }

    this._resolvedTriggerLabel = resolved;
  }

  // ─── SVG Icons ───

  /** @internal */
  private _renderIcon() {
    if (this.icon === 'horizontal') {
      return html`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      `;
    }
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    `;
  }

  // ─── Render ───

  override render() {
    const btnClasses = {
      trigger: true,
      [`trigger--${this.size}`]: true,
      'trigger--open': this._open,
    };

    return html`
      <button
        part="button trigger"
        class=${classMap(btnClasses)}
        type="button"
        aria-label=${this._resolvedTriggerLabel}
        aria-haspopup="menu"
        aria-expanded=${String(this._open)}
        aria-controls=${this._open ? this._panelId : nothing}
        ?disabled=${this.disabled}
        @click=${this._handleTriggerClick}
      >
        ${this._renderIcon()}
      </button>
      ${this._open
        ? html`
            <div
              id=${this._panelId}
              part="panel menu"
              role="menu"
              aria-label=${this.labelMenu}
              class="panel"
              @click=${this._handleSlotClick}
              @hx-item-select=${this._handleSlotItemSelect}
            >
              <slot @slotchange=${this._handleSlotChange}></slot>
            </div>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-overflow-menu': HelixOverflowMenu;
  }
}
