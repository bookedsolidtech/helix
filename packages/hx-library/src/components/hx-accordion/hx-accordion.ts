import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionStyles } from './hx-accordion.styles.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';

/**
 * A container that manages a set of `<hx-accordion-item>` children.
 * Supports both single-open and multiple-open modes with full keyboard navigation.
 *
 * @summary Accordion container managing expandable sections with keyboard navigation.
 *
 * @tag hx-accordion
 *
 * @slot - `<hx-accordion-item>` elements.
 *
 * @fires {CustomEvent<{item: HelixAccordionItem, open: boolean}>} hx-accordion-change - Dispatched when any item's open state changes.
 *
 * @csspart accordion - The outer accordion container.
 *
 * @cssprop [--hx-accordion-border-color=var(--hx-color-neutral-200, #e9ecef)] - Border color of the accordion container.
 */
@customElement('hx-accordion')
export class HelixAccordion extends LitElement {
  static override styles = [tokenStyles, helixAccordionStyles];

  // ─── Properties ───

  /**
   * Allow multiple items to be open simultaneously. When false (default),
   * opening one item will close all others.
   * @attr multiple
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Disables all accordion items, preventing interaction.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener(
      'hx-accordion-item-toggle',
      this._handleItemToggle as EventListener,
    );
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener(
      'hx-accordion-item-toggle',
      this._handleItemToggle as EventListener,
    );
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('disabled')) {
      this._syncDisabledToChildren();
    }
  }

  // ─── Item Management ───

  private _getItems(): HelixAccordionItem[] {
    return Array.from(this.querySelectorAll('hx-accordion-item')) as HelixAccordionItem[];
  }

  private _getEnabledItems(): HelixAccordionItem[] {
    return this._getItems().filter((item) => !item.disabled);
  }

  private _syncDisabledToChildren(): void {
    if (this.disabled) {
      this._getItems().forEach((item) => {
        item.disabled = true;
      });
    }
  }

  // ─── Event Handling ───

  private _handleItemToggle = (e: CustomEvent<{ item: HelixAccordionItem; open: boolean }>): void => {
    e.stopPropagation();

    const { item, open } = e.detail;

    // In single mode, close all other items when one opens.
    if (!this.multiple && open) {
      this._getItems().forEach((otherItem) => {
        if (otherItem !== item && otherItem.open) {
          otherItem.open = false;
        }
      });
    }

    /**
     * Dispatched when any accordion item's open state changes.
     * @event hx-accordion-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-accordion-change', {
        bubbles: true,
        composed: true,
        detail: { item, open },
      }),
    );
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
      return;
    }

    const enabledItems = this._getEnabledItems();
    if (enabledItems.length === 0) {
      return;
    }

    // Identify which item currently contains the focused trigger.
    const activeElement = this.ownerDocument.activeElement;
    const currentItemIndex = enabledItems.findIndex((item) => item.contains(activeElement));

    if (currentItemIndex === -1) {
      return;
    }

    e.preventDefault();

    let nextIndex: number;
    if (e.key === 'ArrowDown') {
      nextIndex = (currentItemIndex + 1) % enabledItems.length;
    } else {
      nextIndex = currentItemIndex <= 0 ? enabledItems.length - 1 : currentItemIndex - 1;
    }

    const nextItem = enabledItems[nextIndex];
    if (nextItem) {
      const trigger = nextItem.shadowRoot?.querySelector<HTMLButtonElement>('.trigger');
      trigger?.focus();
    }
  };

  private _handleSlotChange(): void {
    this._syncDisabledToChildren();
  }

  // ─── Render ───

  override render() {
    return html`
      <div part="accordion" class="accordion">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion': HelixAccordion;
  }
}
