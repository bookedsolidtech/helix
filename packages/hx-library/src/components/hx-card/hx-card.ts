import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixCardStyles } from './hx-card.styles.js';

/**
 * A flexible card component for displaying grouped content.
 *
 * @summary Content container with image, heading, body, footer, and action slots.
 *
 * @tag hx-card
 *
 * @slot image - Optional image or media content at the top of the card.
 * @slot heading - The card heading/title content.
 * @slot - Default slot for the card body content.
 * @slot footer - Optional footer content below the body.
 * @slot actions - Optional action buttons, rendered with a top border separator.
 *
 * @fires {CustomEvent<{url: string, originalEvent: MouseEvent}>} hx-card-click - Dispatched when an interactive card (with hx-href) is clicked.
 *
 * @csspart card - The outer card container element.
 * @csspart image - The image slot container.
 * @csspart heading - The heading slot container.
 * @csspart body - The body slot container.
 * @csspart footer - The footer slot container.
 * @csspart actions - The actions slot container.
 *
 * @cssprop [--hx-card-bg=var(--hx-color-neutral-0)] - Card background color.
 * @cssprop [--hx-card-color=var(--hx-color-neutral-800)] - Card text color.
 * @cssprop [--hx-card-border-color=var(--hx-color-neutral-200)] - Card border color.
 * @cssprop [--hx-card-border-radius=var(--hx-border-radius-lg)] - Card border radius.
 * @cssprop [--hx-card-padding=var(--hx-space-6)] - Internal padding for card sections.
 * @cssprop [--hx-card-gap=var(--hx-space-4)] - Gap between card sections.
 */
@customElement('hx-card')
export class HelixCard extends LitElement {
  static override styles = [tokenStyles, helixCardStyles];

  /**
   * Visual style variant of the card.
   * @attr variant
   * @default 'default'
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  /**
   * Elevation (shadow depth) of the card.
   * @attr elevation
   * @default 'flat'
   */
  @property({ type: String, reflect: true })
  elevation: 'flat' | 'raised' | 'floating' = 'flat';

  /**
   * Optional URL. When set, the card becomes interactive (clickable)
   * and navigates to this URL on click.
   * Uses hx-href to avoid conflicting with the native HTML href attribute.
   * @attr hx-href
   * @default ''
   */
  @property({ type: String, attribute: 'hx-href' })
  wcHref = '';

  // ─── Slot Detection ───

  private _hasSlotContent: Record<string, boolean> = {
    image: false,
    heading: false,
    footer: false,
    actions: false,
  };

  private _handleSlotChange(slotName: string) {
    return (e: Event) => {
      const slot = e.target as HTMLSlotElement;
      this._hasSlotContent[slotName] = slot.assignedNodes({ flatten: true }).length > 0;
      this.requestUpdate();
    };
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (!this.wcHref) return;

    /**
     * Dispatched when an interactive card is clicked.
     * Includes the target href in the detail.
     * @event hx-card-click
     */
    this.dispatchEvent(
      new CustomEvent('hx-card-click', {
        bubbles: true,
        composed: true,
        detail: { url: this.wcHref, originalEvent: e },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this.wcHref) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._handleClick(e as unknown as MouseEvent);
    }
  }

  // ─── Render ───

  override render() {
    const isInteractive = !!this.wcHref;

    const classes = {
      card: true,
      [`card--${this.variant}`]: true,
      [`card--${this.elevation}`]: true,
      'card--interactive': isInteractive,
    };

    return html`
      <div
        part="card"
        class=${classMap(classes)}
        role=${isInteractive ? 'link' : nothing}
        tabindex=${isInteractive ? '0' : nothing}
        aria-label=${isInteractive ? `Navigate to ${this.wcHref}` : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        <div class="card__image" part="image" ?hidden=${!this._hasSlotContent['image']}>
          <slot name="image" @slotchange=${this._handleSlotChange('image')}></slot>
        </div>

        <div class="card__heading" part="heading" ?hidden=${!this._hasSlotContent['heading']}>
          <slot name="heading" @slotchange=${this._handleSlotChange('heading')}></slot>
        </div>

        <div class="card__body" part="body">
          <slot></slot>
        </div>

        <div class="card__footer" part="footer" ?hidden=${!this._hasSlotContent['footer']}>
          <slot name="footer" @slotchange=${this._handleSlotChange('footer')}></slot>
        </div>

        <div class="card__actions" part="actions" ?hidden=${!this._hasSlotContent['actions']}>
          <slot name="actions" @slotchange=${this._handleSlotChange('actions')}></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-card': HelixCard;
  }
}
