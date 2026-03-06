import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixMenuStyles } from './hx-menu.styles.js';
import type { HelixMenuItem } from './hx-menu-item.js';

/**
 * A menu container that manages keyboard navigation over a list of menu items.
 * Use with `hx-menu-item` and `hx-menu-divider`.
 *
 * @summary Context/action menu with keyboard-navigable items.
 *
 * @tag hx-menu
 *
 * @slot - Default slot for hx-menu-item and hx-menu-divider elements.
 *
 * @fires {CustomEvent<{item: HelixMenuItem, value: string}>} hx-select - Dispatched when an item is selected.
 * @fires {CustomEvent<void>} hx-close - Dispatched when Escape is pressed.
 *
 * @csspart base - The root menu element.
 *
 * @cssprop [--hx-menu-bg=var(--hx-color-neutral-0)] - Menu background color.
 * @cssprop [--hx-menu-border-color=var(--hx-color-neutral-200)] - Menu border color.
 * @cssprop [--hx-menu-border-radius=var(--hx-border-radius-md)] - Menu border radius.
 * @cssprop [--hx-menu-shadow] - Menu box shadow.
 * @cssprop [--hx-menu-min-width=10rem] - Minimum menu width.
 */
@customElement('hx-menu')
export class HelixMenu extends LitElement {
  static override styles = [tokenStyles, helixMenuStyles];

  private _focusedIndex = -1;

  private _typeaheadBuffer = '';

  private _typeaheadTimeout: ReturnType<typeof setTimeout> | undefined;

  private _getItems(): HelixMenuItem[] {
    return Array.from(this.querySelectorAll<HelixMenuItem>('hx-menu-item')).filter(
      (item) => !item.disabled && !item.loading,
    );
  }

  /** Focus the first menu item. */
  focusFirst(): void {
    const items = this._getItems();
    const first = items[0];
    if (first !== undefined) {
      this._focusedIndex = 0;
      first.focus();
    }
  }

  /** Focus the last menu item. */
  focusLast(): void {
    const items = this._getItems();
    const last = items[items.length - 1];
    if (last !== undefined) {
      this._focusedIndex = items.length - 1;
      last.focus();
    }
  }

  private _focusItem(index: number): void {
    const items = this._getItems();
    if (items.length === 0) return;
    this._focusedIndex = Math.max(0, Math.min(index, items.length - 1));
    const target = items[this._focusedIndex];
    if (target !== undefined) target.focus();
  }

  private _updateFocusedIndex(): void {
    const items = this._getItems();
    const active = this.shadowRoot?.activeElement ?? document.activeElement;
    // Find the active item by checking if any item's shadow root contains the active element
    const idx = items.findIndex((item) => item.matches(':focus-within') || item === active);
    if (idx !== -1) this._focusedIndex = idx;
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    this._updateFocusedIndex();
    const items = this._getItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._focusItem(this._focusedIndex + 1 < items.length ? this._focusedIndex + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._focusItem(this._focusedIndex > 0 ? this._focusedIndex - 1 : items.length - 1);
        break;
      case 'Home':
        e.preventDefault();
        this._focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        this._focusItem(items.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('hx-close', { bubbles: true, composed: true }));
        break;
      default:
        if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this._handleTypeahead(e.key, items);
        }
        break;
    }
  }

  private _handleTypeahead(char: string, items: HelixMenuItem[]): void {
    clearTimeout(this._typeaheadTimeout);
    this._typeaheadBuffer += char.toLowerCase();
    this._typeaheadTimeout = setTimeout(() => {
      this._typeaheadBuffer = '';
    }, 500);

    const match = items.findIndex((item) => {
      const text = item.textContent?.trim().toLowerCase() ?? '';
      return text.startsWith(this._typeaheadBuffer);
    });

    if (match !== -1) {
      this._focusItem(match);
    }
  }

  private _handleItemSelect(e: Event): void {
    const detail = (e as CustomEvent<{ item: HelixMenuItem; value: string }>).detail;
    const items = this._getItems();
    this._focusedIndex = items.indexOf(detail.item);

    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item: detail.item, value: detail.value },
      }),
    );
  }

  override render() {
    return html`
      <div
        part="base"
        class="menu"
        role="menu"
        @keydown=${this._handleKeyDown}
        @hx-item-select=${this._handleItemSelect}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-menu': HelixMenu;
  }
}
