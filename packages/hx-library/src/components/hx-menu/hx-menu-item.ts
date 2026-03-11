import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixMenuItemStyles } from './hx-menu-item.styles.js';

/**
 * A single interactive item for use inside `hx-menu`. Supports normal, checkbox,
 * and radio types, loading state, prefix/suffix slots, and submenu nesting.
 * Use `aria-label` on the parent `hx-menu` to provide an accessible name.
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
export class HelixMenuItem extends LitElement {
  static override styles = [tokenStyles, helixMenuItemStyles];

  /**
   * @internal Managed by parent hx-menu for roving tabindex.
   * Only the active item in the menu has tabindex=0; all others have -1.
   */
  @state()
  private _rovingTabIndex = -1;

  /** @internal Set the roving tabindex value. Called by parent hx-menu. */
  setRovingTabIndex(value: number): void {
    this._rovingTabIndex = value;
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

  @state()
  private _hasSubmenu = false;

  /** Focus the inner interactive element. */
  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector<HTMLElement>('.menu-item')?.focus(options);
  }

  private _handleSubmenuSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasSubmenu = slot.assignedElements().length > 0;
  }

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
      new CustomEvent('hx-item-select', {
        bubbles: true,
        composed: true,
        detail: { item: this, value: this.value },
      }),
    );
  }

  private _handleClick(e: MouseEvent): void {
    if (this.disabled || this.loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this._activate();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._activate();
      return;
    }

    if (e.key === 'ArrowRight' && this._hasSubmenu) {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent('hx-item-submenu-open', {
          bubbles: true,
          composed: true,
          detail: { item: this },
        }),
      );
    }
  }

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

  private _getRole(): string {
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

    return html`
      <div
        part="base"
        class=${classMap(classes)}
        role=${role}
        tabindex=${this.disabled ? '-1' : String(this._rovingTabIndex)}
        aria-disabled=${this.disabled ? 'true' : nothing}
        aria-checked=${hasCheckableRole ? (this.checked ? 'true' : 'false') : nothing}
        aria-haspopup=${this._hasSubmenu ? 'true' : nothing}
        aria-busy=${this.loading ? 'true' : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
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
