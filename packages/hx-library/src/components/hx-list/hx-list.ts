import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixListStyles } from './hx-list.styles.js';
import { HelixListItem } from './hx-list-item.js';

/**
 * A styled list container supporting plain, bulleted, numbered, and interactive variants.
 *
 * @summary Container for list items with optional dividers and interactive selection.
 * When variant is "interactive", uses `role="listbox"` with full ARIA keyboard navigation
 * (ArrowUp/Down, Home/End) per ARIA Authoring Practices Guide.
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
 */
@customElement('hx-list')
export class HelixList extends LitElement {
  static override styles = [tokenStyles, helixListStyles];

  /**
   * Visual variant of the list.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'plain' | 'bulleted' | 'numbered' | 'interactive' = 'plain';

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

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('variant')) {
      this._syncChildInteractiveState();

      if (this.variant === 'interactive' && !this.label) {
        console.warn(
          '[hx-list] The "label" property is required when variant is "interactive" to provide an accessible name for the listbox.',
        );
      }
    }
  }

  private _handleSlotChange(): void {
    this._syncChildInteractiveState();
  }

  private _syncChildInteractiveState(): void {
    const isInteractive = this.variant === 'interactive';
    const items = this._getItems();
    for (const item of items) {
      item._interactive = isInteractive;
    }
  }

  private _getItems(): HelixListItem[] {
    return Array.from(this.querySelectorAll('hx-list-item')).filter(
      (item): item is HelixListItem => item instanceof HelixListItem,
    );
  }

  private _getEnabledItems(): HelixListItem[] {
    return this._getItems().filter((item) => !item.disabled);
  }

  private _handleItemClick(e: Event): void {
    if (this.variant !== 'interactive') return;

    const composedPath = e.composedPath();
    const item = composedPath.find((el): el is HelixListItem => el instanceof HelixListItem);
    if (!item || item.disabled) return;

    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item, value: item.value },
      }),
    );
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.variant !== 'interactive') return;

    const enabledItems = this._getEnabledItems();
    if (enabledItems.length === 0) return;

    // With delegatesFocus, document.activeElement is the hx-list-item host
    const active = document.activeElement;
    const currentFocus = active instanceof HelixListItem && this.contains(active) ? active : null;
    const currentIndex = currentFocus ? enabledItems.indexOf(currentFocus) : -1;

    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }

    const target = enabledItems[targetIndex];
    if (target) {
      target.focus();
    }
  }

  override render() {
    const isInteractive = this.variant === 'interactive';
    const isNumbered = this.variant === 'numbered';

    // Use role="list" for non-interactive variants to ensure axe recognizes
    // custom element children as valid list items via their shadow DOM <li> elements.
    // Use role="listbox" for interactive variant per ARIA APG.
    const role = isInteractive ? 'listbox' : 'list';

    if (isNumbered) {
      return html`
        <ol
          part="base"
          class="list list--${this.variant}"
          role=${role}
          aria-label=${ifDefined(this.label)}
          @hx-list-item-click=${this._handleItemClick}
        >
          <slot @slotchange=${this._handleSlotChange}></slot>
        </ol>
      `;
    }

    return html`
      <ul
        part="base"
        class="list list--${this.variant}"
        role=${role}
        aria-label=${ifDefined(this.label)}
        aria-multiselectable=${isInteractive ? 'false' : nothing}
        @hx-list-item-click=${this._handleItemClick}
        @keydown=${this._handleKeydown}
      >
        <slot @slotchange=${this._handleSlotChange}></slot>
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList;
  }
}
