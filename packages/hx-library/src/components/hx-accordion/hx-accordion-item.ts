import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionItemStyles } from './hx-accordion-item.styles.js';

/**
 * An individual expandable item within an `<hx-accordion>`.
 *
 * @summary Disclosure item with animated expand/collapse and full ARIA support.
 *
 * @tag hx-accordion-item
 *
 * @slot - Default slot for panel content.
 * @slot heading - Rich HTML content for the trigger heading (overrides the heading property).
 *
 * @fires {CustomEvent<{item: HxAccordionItem, open: boolean}>} hx-accordion-item-toggle - Dispatched when the item opens or closes. Used internally by hx-accordion.
 *
 * @csspart item - The outer item container.
 * @csspart heading - The heading wrapper element.
 * @csspart trigger - The button that toggles the panel.
 * @csspart icon - The chevron icon.
 * @csspart content - The content panel region.
 *
 * @cssprop [--hx-accordion-item-border-color=var(--hx-color-neutral-200, #e9ecef)] - Border color between items.
 * @cssprop [--hx-accordion-item-heading-bg=var(--hx-color-neutral-50, #f8f9fa)] - Heading background color.
 * @cssprop [--hx-accordion-item-heading-color=var(--hx-color-neutral-900, #212529)] - Heading text color.
 * @cssprop [--hx-accordion-item-content-bg=var(--hx-color-neutral-0, #ffffff)] - Content panel background color.
 * @cssprop [--hx-accordion-item-content-padding=var(--hx-space-4, 1rem)] - Content panel padding.
 */
@customElement('hx-accordion-item')
export class HelixAccordionItem extends LitElement {
  static override styles = [tokenStyles, helixAccordionItemStyles];

  // ─── Internal IDs ───

  private _triggerId = `hx-accordion-trigger-${Math.random().toString(36).slice(2, 9)}`;
  private _panelId = `hx-accordion-panel-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Properties ───

  /**
   * Whether the accordion item is expanded.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Whether the accordion item is disabled. Prevents user interaction.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Text content for the heading trigger. Use the `heading` slot for rich HTML.
   * @attr heading
   */
  @property({ type: String })
  heading = '';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  // ─── Event Handling ───

  private _handleTriggerClick(): void {
    if (this.disabled) {
      return;
    }
    this.open = !this.open;
    this._dispatchToggle();
  }

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) {
      return;
    }
    // Enter and Space are natively handled by <button>, but we guard here for completeness.
    // Arrow Up/Down are handled by the parent hx-accordion via event delegation.
    if (e.key === 'Enter' || e.key === ' ') {
      const target = e.target as Element;
      // Only act if the event target is our internal trigger button.
      if (target.closest(`[id="${this._triggerId}"]`) !== null) {
        e.preventDefault();
        this.open = !this.open;
        this._dispatchToggle();
      }
    }
  };

  private _dispatchToggle(): void {
    /**
     * Dispatched when the item's open state changes.
     * Consumed internally by the parent hx-accordion.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent('hx-accordion-item-toggle', {
        bubbles: true,
        composed: true,
        detail: { item: this, open: this.open },
      }),
    );
  }

  // ─── Render ───

  private _renderChevronIcon() {
    return html`
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          clip-rule="evenodd"
        />
      </svg>
    `;
  }

  override render() {
    return html`
      <div part="item" class="item">
        <h3 part="heading" class="heading">
          <button
            part="trigger"
            class="trigger"
            id=${this._triggerId}
            type="button"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls=${this._panelId}
            aria-disabled=${this.disabled ? 'true' : 'false'}
            @click=${this._handleTriggerClick}
          >
            <slot name="heading">${this.heading}</slot>
            <span part="icon" class="icon">${this._renderChevronIcon()}</span>
          </button>
        </h3>

        <div class="content-wrapper">
          <div class="content-inner">
            <div
              part="content"
              class="content"
              id=${this._panelId}
              role="region"
              aria-labelledby=${this._triggerId}
              aria-hidden=${this.open ? 'false' : 'true'}
            >
              <slot></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-accordion-item': HelixAccordionItem;
  }
}
