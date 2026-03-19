import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixAccordionStyles } from './hx-accordion.styles.js';
import './hx-accordion-item.js';
import type { HelixAccordionItem } from './hx-accordion-item.js';
import { devWarn } from '../../utils/dev-warn.js';

/**
 * An accordion container that manages collapsible content sections.
 *
 * @summary Collapsible content sections with single or multi-expand modes.
 *
 * @tag hx-accordion
 *
 * @slot - Default slot for hx-accordion-item elements.
 *
 * @csspart accordion - The outer container wrapping all accordion items.
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
    this.addEventListener('hx-expand', this._handleChildExpand);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('hx-expand', this._handleChildExpand);
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

  /**
   * Handles expand events from child accordion items to enforce single-expand mode.
   * @internal
   */
  private _handleChildExpand = (e: Event): void => {
    if (this.mode !== 'single') return;

    const expandedItem = e.composedPath()[0] as HelixAccordionItem;
    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');

    items.forEach((item) => {
      if (item !== expandedItem && item.expanded) {
        item.expanded = false;
        item._dispatchToggleEvent(false);
      }
    });
  };

  // ─── Arrow key navigation (ARIA APG Accordion pattern) ───

  /**
   * Handles keyboard navigation between accordion triggers using arrow, Home, and End keys.
   * Because hx-accordion-item uses delegatesFocus, document.activeElement points to the
   * hx-accordion-item host when focus is inside its shadow root. We use that to find the
   * currently focused item.
   * @internal
   */
  private _handleKeyDown = (e: KeyboardEvent): void => {
    const items = Array.from(this.querySelectorAll<HelixAccordionItem>('hx-accordion-item'));
    if (items.length === 0) return;

    // With delegatesFocus, document.activeElement is the hx-accordion-item host when
    // its inner button has focus. We match against the item host elements directly.
    const activeEl = document.activeElement;
    const currentItem = items.find((item) => item === activeEl) ?? null;

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
    // With delegatesFocus, focusing the host element routes focus to the inner button.
    targetItem?.focus();
  };

  private _getTriggers(): HTMLElement[] {
    const items = this.querySelectorAll<HelixAccordionItem>('hx-accordion-item');
    const triggers: HTMLElement[] = [];
    items.forEach((item) => {
      const button = item.shadowRoot?.querySelector<HTMLElement>('button');
      if (button) triggers.push(button);
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
      devWarn(
        'hx-accordion',
        `Default slot expects <hx-accordion-item> elements. Found unexpected: ${invalid.map((el) => `<${el.tagName.toLowerCase()}>`).join(', ')}`,
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
