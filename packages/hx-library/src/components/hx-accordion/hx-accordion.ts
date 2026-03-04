import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionStyles } from './hx-accordion.styles.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';

/**
 * A container component that manages a set of collapsible `hx-accordion-item` children.
 * Supports single-expand (only one item open at a time) and multi-expand modes.
 *
 * @summary Accessible accordion container supporting single and multi-expand modes.
 *
 * @tag hx-accordion
 *
 * @slot - One or more `<hx-accordion-item>` elements.
 *
 * @csspart accordion - The outer accordion container element.
 */
@customElement('hx-accordion')
export class HelixAccordion extends LitElement {
  static override styles = [tokenStyles, helixAccordionStyles];

  // ─── Properties ───

  /**
   * Expand mode. In `'single'` mode only one item may be open at a time.
   * In `'multi'` mode any number of items can be open simultaneously.
   * @attr mode
   */
  @property({ type: String, reflect: true })
  mode: 'single' | 'multi' = 'single';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-expand', this._handleItemExpand as EventListener);
    this.addEventListener('hx-accordion-nav', this._handleNavigation as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-expand', this._handleItemExpand as EventListener);
    this.removeEventListener('hx-accordion-nav', this._handleNavigation as EventListener);
  }

  // ─── Item Queries ───

  private _getItems(): HelixAccordionItem[] {
    return Array.from(this.querySelectorAll('hx-accordion-item')) as HelixAccordionItem[];
  }

  private _getEnabledItems(): HelixAccordionItem[] {
    return this._getItems().filter((item) => !item.disabled);
  }

  // ─── Event Handlers ───

  private _handleItemExpand = (e: CustomEvent<{ itemId: string }>): void => {
    if (this.mode !== 'single') return;

    // Collapse all other open items
    const expandedItem = e.target as HelixAccordionItem;
    this._getItems().forEach((item) => {
      if (item !== expandedItem && item.open) {
        item.collapse();
      }
    });
  };

  private _handleNavigation = (
    e: CustomEvent<{ direction: 'prev' | 'next'; source: HelixAccordionItem }>,
  ): void => {
    const enabledItems = this._getEnabledItems();
    if (enabledItems.length === 0) return;

    const { direction, source } = e.detail;
    const currentIndex = enabledItems.indexOf(source);
    if (currentIndex === -1) return;

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else {
      nextIndex = currentIndex <= 0 ? enabledItems.length - 1 : currentIndex - 1;
    }

    const nextItem = enabledItems[nextIndex];
    if (nextItem) {
      // Focus the summary inside the shadow root of the target item
      const summary = nextItem.shadowRoot?.querySelector<HTMLElement>('summary');
      summary?.focus();
    }
  };

  // ─── Render ───

  override render() {
    return html`
      <div part="accordion" class="accordion">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion': HelixAccordion;
  }
}
