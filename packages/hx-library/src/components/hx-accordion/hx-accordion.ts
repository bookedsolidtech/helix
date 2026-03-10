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
    this.addEventListener('keydown', this._handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-expand', this._handleChildExpand as EventListener);
    this.removeEventListener('keydown', this._handleKeyDown);
  }

  protected override firstUpdated(): void {
    this._enforceSingleMode();
  }

  // ─── Single-expand coordination ───

  private _enforceSingleMode(): void {
    if (this.mode !== 'single') return;

    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
    let foundExpanded = false;

    items.forEach((item) => {
      if (item.expanded) {
        if (foundExpanded) {
          item.expanded = false;
        } else {
          foundExpanded = true;
        }
      }
    });
  }

  private _handleChildExpand(e: CustomEvent<{ expanded: boolean; itemId: string }>): void {
    if (this.mode !== 'single') return;

    const expandedItem = e.composedPath()[0] as HelixAccordionItem;
    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');

    items.forEach((item) => {
      if (item !== expandedItem && item.expanded) {
        item.expanded = false;
        item._dispatchToggleEvent(false);
      }
    });
  }

  // ─── Arrow key navigation (ARIA APG Accordion pattern) ───

  private _handleKeyDown = (e: KeyboardEvent): void => {
    const triggers = this._getTriggers();
    if (triggers.length === 0) return;

    const activeEl = this.shadowRoot?.activeElement ?? document.activeElement;
    let currentItem: HelixAccordionItem | null = null;

    const items = Array.from(this.querySelectorAll<HelixAccordionItem>('hx-accordion-item'));
    for (const item of items) {
      const summary = item.shadowRoot?.querySelector('summary');
      if (summary === activeEl || item.shadowRoot?.activeElement === summary) {
        currentItem = item;
        break;
      }
    }

    if (!currentItem) return;

    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.indexOf(currentItem);
    if (currentIndex === -1) return;

    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        targetIndex = (currentIndex + 1) % enabledItems.length;
        break;
      case 'ArrowUp':
        targetIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const targetItem = enabledItems[targetIndex];
    const targetSummary = targetItem?.shadowRoot?.querySelector('summary');
    targetSummary?.focus();
  };

  private _getTriggers(): HTMLElement[] {
    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
    const triggers: HTMLElement[] = [];
    items.forEach((item) => {
      const summary = item.shadowRoot?.querySelector<HTMLElement>('summary');
      if (summary) triggers.push(summary);
    });
    return triggers;
  }

  // ─── Slot validation ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target;
    if (!(slot instanceof HTMLSlotElement)) return;
    const invalid = slot
      .assignedElements()
      .filter((el) => el.tagName.toLowerCase() !== 'hx-accordion-item');
    if (invalid.length > 0) {
      console.warn(
        `[hx-accordion] Default slot expects <hx-accordion-item> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
      );
    }
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
