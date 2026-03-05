import { LitElement, html, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionItemStyles } from './hx-accordion-item.styles.js';

/**
 * An individual accordion item with collapsible content.
 *
 * @summary Collapsible panel that can be expanded or collapsed.
 *
 * @tag hx-accordion-item
 *
 * @slot trigger - The heading/trigger content for this item.
 * @slot - Default slot for the collapsible body content.
 *
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-expand - Dispatched when the item is expanded.
 * @fires {CustomEvent<{expanded: boolean, itemId: string}>} hx-collapse - Dispatched when the item is collapsed.
 *
 * @csspart item - The outer details element container.
 * @csspart trigger - The summary/trigger element.
 * @csspart content - The collapsible content area.
 * @csspart icon - The expand/collapse icon.
 *
 * @cssprop [--hx-accordion-border-color=var(--hx-color-neutral-200)] - Border color between items.
 * @cssprop [--hx-accordion-trigger-padding=var(--hx-space-4)] - Trigger padding.
 * @cssprop [--hx-accordion-trigger-color=var(--hx-color-neutral-800)] - Trigger text color.
 * @cssprop [--hx-accordion-trigger-bg=transparent] - Trigger background color.
 * @cssprop [--hx-accordion-trigger-hover-bg=var(--hx-color-neutral-50)] - Trigger hover background.
 * @cssprop [--hx-accordion-icon-color=var(--hx-color-neutral-500)] - Icon color.
 * @cssprop [--hx-accordion-content-padding=0 var(--hx-space-4) var(--hx-space-4)] - Content padding.
 * @cssprop [--hx-accordion-content-color=var(--hx-color-neutral-600)] - Content text color.
 */
@customElement('hx-accordion-item')
export class HelixAccordionItem extends LitElement {
  static override styles = [tokenStyles, helixAccordionItemStyles];

  /**
   * Whether this item is expanded.
   * @attr expanded
   */
  @property({ type: Boolean, reflect: true })
  expanded = false;

  /**
   * Whether this item is disabled (cannot be toggled).
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Toggle Logic ───

  private _toggle(): void {
    if (this.disabled) return;

    const willExpand = !this.expanded;
    this.expanded = willExpand;

    const detail = { expanded: willExpand, itemId: this.id || '' };

    if (willExpand) {
      /**
       * Dispatched when the item is expanded.
       * @event hx-expand
       */
      this.dispatchEvent(
        new CustomEvent('hx-expand', {
          bubbles: true,
          composed: true,
          detail,
        }),
      );
    } else {
      /**
       * Dispatched when the item is collapsed.
       * @event hx-collapse
       */
      this.dispatchEvent(
        new CustomEvent('hx-collapse', {
          bubbles: true,
          composed: true,
          detail,
        }),
      );
    }
  }

  // ─── Event Handlers ───

  private _handleSummaryClick(e: MouseEvent): void {
    // Prevent native details toggle; we handle it programmatically for animation
    e.preventDefault();
    this._toggle();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._toggle();
    }
  }

  private _handleToggle(e: Event): void {
    // Prevent native <details> toggle from controlling state — Lit manages it
    e.preventDefault();
  }

  // ─── Render ───

  override render() {
    const itemClasses = {
      item: true,
      'item--expanded': this.expanded,
      'item--disabled': this.disabled,
    };

    const chevronIcon = svg`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    return html`
      <details
        part="item"
        class=${classMap(itemClasses)}
        ?open=${this.expanded}
        @toggle=${this._handleToggle}
      >
        <summary
          id="trigger"
          part="trigger"
          class="trigger"
          aria-expanded=${this.expanded ? 'true' : 'false'}
          aria-disabled=${this.disabled ? 'true' : 'false'}
          @click=${this._handleSummaryClick}
          @keydown=${this._handleKeyDown}
        >
          <slot name="trigger"></slot>
          <span part="icon" class="icon">${chevronIcon}</span>
        </summary>
        <div class="content-wrapper">
          <div class="content-inner">
            <div
              part="content"
              class="content"
              role="region"
              aria-labelledby="trigger"
              aria-hidden=${this.expanded ? nothing : 'true'}
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </details>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion-item': HelixAccordionItem;
  }
}
