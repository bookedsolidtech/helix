import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixListStyles } from './hx-list.styles.js';
import { HelixListItem } from './hx-list-item.js'; // real import for instanceof check and property access

/**
 * A styled list container supporting plain, bulleted, numbered, description, and interactive variants.
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
  variant: 'plain' | 'bulleted' | 'numbered' | 'description' | 'interactive' = 'plain';

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

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProps: Map<string, unknown>): void {
    super.updated(changedProps);
    if (changedProps.has('variant')) {
      this._updateItemStates();
    }
    if (this.variant === 'interactive' && !this.label) {
      console.warn(
        '[hx-list] The "label" attribute is required when variant is "interactive". ' +
          'Add a label to provide an accessible name for the listbox (WCAG 2.1 SC 4.1.2).',
      );
    }
  }

  /**
   * Sets the `interactive` property on all child hx-list-item elements
   * so they can style and behave correctly without `:host-context()`.
   */
  private _updateItemStates(): void {
    const isInteractive = this.variant === 'interactive';
    const items = this.querySelectorAll('hx-list-item');
    for (const item of items) {
      (item as HelixListItem).interactive = isInteractive;
    }
  }

  private _handleSlotChange(): void {
    this._updateItemStates();
  }

  private readonly _handleKeydown = (e: KeyboardEvent): void => {
    if (this.variant !== 'interactive') return;

    const items = Array.from(this.querySelectorAll<HelixListItem>('hx-list-item:not([disabled])'));
    if (items.length === 0) return;

    const focused = this.querySelector<HelixListItem>('hx-list-item:focus');
    const currentIndex = focused ? items.indexOf(focused) : -1;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    items[nextIndex]?.focus();
  };

  private _handleItemClick(e: Event): void {
    if (this.variant !== 'interactive') return;

    if (!(e.target instanceof HelixListItem)) return;
    const item = e.target;
    if (item.disabled) return;

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
    const isDescription = this.variant === 'description';

    const slot = html`<slot @slotchange=${this._handleSlotChange}></slot>`;

    if (isDescription) {
      return html`
        <dl
          part="base"
          class="list list--${this.variant}"
          aria-label=${ifDefined(this.label)}
          @hx-list-item-click=${this._handleItemClick}
        >
          ${slot}
        </dl>
      `;
    }

    if (isNumbered) {
      return html`
        <ol
          part="base"
          class="list list--${this.variant}"
          aria-label=${ifDefined(this.label)}
          @hx-list-item-click=${this._handleItemClick}
        >
          ${slot}
        </ol>
      `;
    }

    return html`
      <ul
        part="base"
        class="list list--${this.variant}"
        role=${isInteractive ? 'listbox' : 'list'}
        aria-label=${ifDefined(this.label)}
        aria-multiselectable=${isInteractive ? 'false' : nothing}
        @hx-list-item-click=${this._handleItemClick}
      >
        ${slot}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-list': HelixList;
  }
}
