import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixMenuItemStyles } from './hx-menu-item.styles.js';

/**
 * A menu item sub-component used inside `hx-split-button` dropdown menus.
 * Renders with `role="menuitem"` and fires an internal selection event that
 * the parent `hx-split-button` listens for.
 *
 * @summary Individual action item within an hx-split-button dropdown menu.
 *
 * @tag hx-menu-item
 *
 * @slot - The label text for this menu item.
 *
 * @fires {CustomEvent<{value: string; label: string}>} hx-menu-item-select - Dispatched when
 *   the item is activated via click or keyboard. Bubbles and is composed.
 *
 * @csspart item - The button element rendering the menu item.
 *
 * @cssprop [--hx-menu-item-bg=transparent] - Default background color.
 * @cssprop [--hx-menu-item-bg-hover=var(--hx-color-primary-50)] - Hover background color.
 * @cssprop [--hx-menu-item-bg-active=var(--hx-color-primary-100)] - Active background color.
 * @cssprop [--hx-menu-item-color=var(--hx-color-neutral-800)] - Text color.
 * @cssprop [--hx-menu-item-color-hover=var(--hx-color-primary-700)] - Hover text color.
 * @cssprop [--hx-menu-item-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-menu-item-font-size=var(--hx-font-size-md)] - Font size.
 * @cssprop [--hx-menu-item-font-weight=var(--hx-font-weight-normal)] - Font weight.
 * @cssprop [--hx-menu-item-border-radius=var(--hx-border-radius-sm)] - Border radius.
 * @cssprop [--hx-menu-item-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-menu-item')
export class HelixMenuItem extends LitElement {
  static override styles = [tokenStyles, helixMenuItemStyles];

  // ─── Public Properties ───

  /**
   * The value emitted in the `hx-menu-item-select` event detail when this item
   * is selected. Should be unique among siblings.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Whether this menu item is disabled. Prevents interaction and emits
   * `aria-disabled="true"` on the inner button.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._dispatchSelect();
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._dispatchSelect();
    }
  }

  private _dispatchSelect(): void {
    const label = this.textContent?.trim() ?? '';

    /**
     * Dispatched when this menu item is activated by click or keyboard.
     * @event hx-menu-item-select
     */
    this.dispatchEvent(
      new CustomEvent<{ value: string; label: string }>('hx-menu-item-select', {
        bubbles: true,
        composed: true,
        detail: { value: this.value, label },
      }),
    );
  }

  // ─── Render ───

  override render() {
    return html`
      <button
        part="item"
        class="menu-item"
        role="menuitem"
        tabindex="-1"
        ?disabled=${this.disabled}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeydown}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-menu-item': HelixMenuItem;
  }
}
