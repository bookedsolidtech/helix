import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionStyles } from './hx-accordion.styles.js';
import './hx-accordion-item.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';

/**
 * An accordion container that manages collapsible content sections.
 *
 * @summary Collapsible content sections with single or multi-expand modes.
 *
 * @tag hx-accordion
 *
 * @slot - Default slot for hx-accordion-item elements.
 *
 * @cssprop [--hx-accordion-border-radius=var(--hx-border-radius-md)] - Outer border radius.
 *
 * @example
 * ```html
 * <hx-accordion mode="single">
 *   <hx-accordion-item>
 *     <span slot="trigger">What is this?</span>
 *     <p>Answer content here.</p>
 *   </hx-accordion-item>
 * </hx-accordion>
 * ```
 */
@customElement('hx-accordion')
export class HelixAccordion extends LitElement {
  static override styles = [tokenStyles, helixAccordionStyles];

  /**
   * Expansion mode: 'single' collapses all other items when one expands.
   * 'multi' allows multiple items open simultaneously.
   * @attr mode
   */
  @property({ type: String, reflect: true })
  mode: 'single' | 'multi' = 'single';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('hx-expand', this._handleChildExpand as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-expand', this._handleChildExpand as EventListener);
  }

  // ─── Single-expand coordination ───

  private _handleChildExpand(e: CustomEvent<{ expanded: boolean; itemId: string }>): void {
    if (this.mode !== 'single') return;

    const expandedItem = e.composedPath()[0] as HelixAccordionItem;
    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');

    items.forEach((item) => {
      if (item !== expandedItem && item.expanded) {
        item.expanded = false;
      }
    });
  }

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
