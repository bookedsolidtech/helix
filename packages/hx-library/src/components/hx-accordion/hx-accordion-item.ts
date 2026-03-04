import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixAccordionItemStyles } from './hx-accordion.styles.js';

/**
 * An individual collapsible item within an `hx-accordion` container.
 * Uses `<details>`/`<summary>` for progressive enhancement with animated
 * open/close transitions managed via JS.
 *
 * @summary Collapsible accordion item with animated trigger and content panel.
 *
 * @tag hx-accordion-item
 *
 * @slot trigger - The trigger/heading content shown in the summary bar.
 * @slot - Default slot for the collapsible body content.
 *
 * @fires {CustomEvent<{itemId: string}>} hx-expand - Dispatched when this item opens.
 * @fires {CustomEvent<{itemId: string}>} hx-collapse - Dispatched when this item closes.
 *
 * @csspart item - The outer `<details>` element.
 * @csspart trigger - The `<summary>` trigger element.
 * @csspart icon - The animated chevron icon container.
 * @csspart content - The collapsible content panel.
 *
 * @cssprop [--hx-accordion-item-border-color=var(--hx-color-neutral-200)] - Item border color.
 * @cssprop [--hx-accordion-trigger-bg=var(--hx-color-neutral-0)] - Trigger background color.
 * @cssprop [--hx-accordion-trigger-bg-hover=var(--hx-color-neutral-50)] - Trigger hover background color.
 * @cssprop [--hx-accordion-trigger-color=var(--hx-color-neutral-800)] - Trigger text color.
 * @cssprop [--hx-accordion-content-bg=var(--hx-color-neutral-0)] - Content panel background color.
 * @cssprop [--hx-accordion-content-padding=var(--hx-space-5)] - Content panel padding.
 * @cssprop [--hx-accordion-icon-color=var(--hx-color-neutral-500)] - Chevron icon color.
 * @cssprop [--hx-accordion-border-radius=var(--hx-border-radius-md)] - Item border radius.
 */
@customElement('hx-accordion-item')
export class HelixAccordionItem extends LitElement {
  static override styles = [tokenStyles, helixAccordionItemStyles];

  // ─── Properties ───

  /**
   * Whether the accordion item is open (expanded).
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Whether the accordion item is disabled. Disabled items cannot be toggled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Optional identifier used in event detail payloads for programmatic control.
   * @attr item-id
   */
  @property({ type: String, attribute: 'item-id' })
  itemId = '';

  // ─── Internal state ───

  @state() private _triggerId = `hx-accordion-trigger-${Math.random().toString(36).slice(2, 9)}`;
  @state() private _contentId = `hx-accordion-content-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Ensure the host element does not receive focus itself — focus goes to summary
    this.setAttribute('role', 'none');
  }

  // ─── Toggle ───

  /**
   * Programmatically toggle the open state of this item.
   * Respects the disabled state and dispatches the appropriate event.
   */
  toggle(): void {
    if (this.disabled) return;

    if (this.open) {
      this._collapse();
    } else {
      this._expand();
    }
  }

  /** Expand this item. No-op if already open or disabled. */
  expand(): void {
    if (this.disabled || this.open) return;
    this._expand();
  }

  /** Collapse this item. No-op if already closed or disabled. */
  collapse(): void {
    if (this.disabled || !this.open) return;
    this._collapse();
  }

  private _expand(): void {
    this.open = true;

    /**
     * Dispatched when this accordion item opens.
     * @event hx-expand
     */
    this.dispatchEvent(
      new CustomEvent('hx-expand', {
        bubbles: true,
        composed: true,
        detail: { itemId: this.itemId },
      }),
    );
  }

  private _collapse(): void {
    this.open = false;

    /**
     * Dispatched when this accordion item closes.
     * @event hx-collapse
     */
    this.dispatchEvent(
      new CustomEvent('hx-collapse', {
        bubbles: true,
        composed: true,
        detail: { itemId: this.itemId },
      }),
    );
  }

  // ─── Event Handlers ───

  private _handleSummaryClick(e: MouseEvent): void {
    // Prevent the native <details> toggle — we manage state manually
    e.preventDefault();

    if (this.disabled) return;
    this.toggle();
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
      return;
    }

    // Arrow key navigation is handled by the parent hx-accordion container.
    // Re-dispatch as a named coordination event so the parent can intercept it.
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent('hx-accordion-nav', {
          bubbles: true,
          composed: true,
          detail: { direction: e.key === 'ArrowUp' ? 'prev' : 'next', source: this },
        }),
      );
    }
  }

  // ─── Render ───

  override render() {
    const ariaExpanded = this.open ? 'true' : 'false';
    const ariaHidden = this.open ? 'false' : 'true';

    return html`
      <details
        part="item"
        class=${classMap({ item: true, 'item--open': this.open, 'item--disabled': this.disabled })}
        ?open=${this.open}
      >
        <summary
          part="trigger"
          class="item__trigger"
          id=${this._triggerId}
          role="button"
          aria-expanded=${ariaExpanded}
          aria-controls=${this._contentId}
          aria-disabled=${this.disabled ? 'true' : nothing}
          tabindex=${this.disabled ? '-1' : '0'}
          @click=${this._handleSummaryClick}
          @keydown=${this._handleKeyDown}
        >
          <span class="item__trigger-label">
            <slot name="trigger"></slot>
          </span>
          <span part="icon" class="item__icon" aria-hidden="true">
            <!-- Chevron down SVG -->
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
              focusable="false"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </summary>

        <div
          part="content"
          class="item__content"
          id=${this._contentId}
          role="region"
          aria-labelledby=${this._triggerId}
          aria-hidden=${ariaHidden}
        >
          <div class="item__content-inner">
            <slot></slot>
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
