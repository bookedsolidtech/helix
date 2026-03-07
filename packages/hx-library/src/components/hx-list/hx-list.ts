import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixListStyles } from './hx-list.styles.js';
import type { HelixListItem } from './hx-list-item.js';

/**
 * A styled list container supporting plain, bulleted, numbered, and interactive variants.
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

  private _handleItemClick(e: Event): void {
    if (this.variant !== 'interactive') return;

    const item = e.target as HelixListItem;
    if (!item || item.disabled) return;

    this.dispatchEvent(
      new CustomEvent('hx-select', {
        bubbles: true,
        composed: true,
        detail: { item, value: item.value },
      }),
    );
  }

  override render() {
    const isInteractive = this.variant === 'interactive';
    const isNumbered = this.variant === 'numbered';
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
          <slot></slot>
        </ol>
      `;
    }

    return html`
      <ul
        part="base"
        class="list list--${this.variant}"
        role=${role}
        aria-label=${ifDefined(this.label)}
        @hx-list-item-click=${this._handleItemClick}
      >
        <slot></slot>
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList;
  }
}
