import { LitElement, html, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSplitButtonStyles } from './hx-split-button.styles.js';
import type { HelixMenuItem } from './hx-menu-item.js';

/**
 * A split button combining a primary action button with an attached dropdown
 * menu for secondary actions. Implements the ARIA menu button pattern for
 * full keyboard and screen reader support.
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
 * @cssprop [--hx-split-button-bg=var(--hx-color-primary-500)] - Background color for both buttons.
 * @cssprop [--hx-split-button-color=var(--hx-color-neutral-0)] - Text/icon color for both buttons.
 * @cssprop [--hx-split-button-border-color=transparent] - Border color.
 * @cssprop [--hx-split-button-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-split-button-divider-color=var(--hx-color-primary-400)] - Color of the divider between primary and trigger.
 * @cssprop [--hx-split-button-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-split-button-font-weight=var(--hx-font-weight-semibold)] - Font weight.
 * @cssprop [--hx-split-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-split-button-menu-bg=var(--hx-color-neutral-0)] - Dropdown menu background.
 * @cssprop [--hx-split-button-menu-border-color=var(--hx-color-neutral-200)] - Dropdown menu border color.
 * @cssprop [--hx-split-button-menu-border-radius=var(--hx-border-radius-md)] - Dropdown menu border radius.
 * @cssprop [--hx-split-button-menu-shadow] - Dropdown menu box shadow.
 */
@customElement('hx-split-button')
export class HelixSplitButton extends LitElement {
  static override styles = [tokenStyles, helixSplitButtonStyles];

  // ─── Internal References ───

  @query('.split-button__menu')
  private _menuPanel!: HTMLElement;

  @query('.split-button__trigger')
  private _triggerButton!: HTMLButtonElement;

  @query('.split-button__primary')
  private _primaryButton!: HTMLButtonElement;

  // ─── Internal State ───

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

  // ─── Unique IDs ───

  private readonly _menuId = `hx-split-button-menu-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleDocumentKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
  }

  // ─── Outside-click / document keydown ───

  private readonly _handleOutsideClick = (e: MouseEvent): void => {
    if (!this._open) return;
    const target = e.target as Node;
    if (!this.contains(target) && target !== this) {
      this._closeMenu();
    }
  };

  private readonly _handleDocumentKeydown = (e: KeyboardEvent): void => {
    if (!this._open) return;
    if (e.key === 'Tab') {
      this._closeMenu();
    }
  };

  // ─── Primary Button Handlers ───

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

  private _handlePrimaryKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._openMenu();
    }
  }

  // ─── Trigger Button Handlers ───

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

  private _handleTriggerKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._openMenu();
    }
  }

  // ─── Menu Key Navigation ───

  private _handleMenuKeydown(e: KeyboardEvent): void {
    const items = this._getMenuItems();
    if (items.length === 0) return;

    const focused = this.shadowRoot?.activeElement as HTMLElement | null;
    // The shadow activeElement is the menu panel; actual focus is in light DOM.
    // Use document.activeElement to find which item has focus.
    const lightActive = document.activeElement as HTMLElement | null;
    const currentIndex = items.findIndex((item) => item === lightActive);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev]?.focus();
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
        items[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      }
      default:
        // Suppress the unused-variable warning for the focused variable
        void focused;
        break;
    }
  }

  // ─── Menu Item Selection ───

  private _handleMenuItemSelect(e: Event): void {
    const custom = e as CustomEvent<{ value: string; label: string }>;
    this._closeMenu();
    this._triggerButton?.focus();

    /**
     * Dispatched when a menu item is selected.
     * @event hx-select
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string; label: string }>('hx-select', {
        bubbles: true,
        composed: true,
        detail: { value: custom.detail.value, label: custom.detail.label },
      }),
    );
  }

  // ─── Menu Helpers ───

  private _openMenu(): void {
    if (this._open) return;
    this._open = true;
    // Focus the first enabled menu item after the panel renders
    this.updateComplete
      .then(() => {
        const items = this._getMenuItems();
        items[0]?.focus();
      })
      .catch(() => undefined);
  }

  private _closeMenu(): void {
    this._open = false;
  }

  private _toggleMenu(): void {
    if (this._open) {
      this._closeMenu();
    } else {
      this._openMenu();
    }
  }

  /**
   * Returns the focusable inner button elements of enabled hx-menu-item children
   * assigned to the `menu` slot.
   */
  private _getMenuItems(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="menu"]');
    if (!slot) return [];

    return slot
      .assignedElements({ flatten: true })
      .filter(
        (el): el is HelixMenuItem =>
          el.tagName.toLowerCase() === 'hx-menu-item' && !(el as HelixMenuItem).disabled,
      )
      .map((item) => item.shadowRoot?.querySelector<HTMLElement>('button') ?? null)
      .filter((btn): btn is HTMLElement => btn !== null);
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
          aria-disabled=${this.disabled ? 'true' : nothing}
          type="button"
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
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-haspopup="menu"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-controls=${this._menuId}
          aria-label="More actions"
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
          aria-label="Secondary actions"
          @keydown=${this._handleMenuKeydown}
          @hx-menu-item-select=${this._handleMenuItemSelect}
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
