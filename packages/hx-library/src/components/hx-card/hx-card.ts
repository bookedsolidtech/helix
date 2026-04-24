import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixCardStyles } from './hx-card.styles.js';
import { devWarn } from '../../utils/dev-warn.js';

const _nextCardId = createIdCounter('hx-card');

/**
 * A flexible card component for displaying grouped content.
 *
 * @summary Content container with image, heading, body, footer, and action slots.
 *
 * @tag hx-card
 *
 * @slot image - Optional image or media content at the top of the card.
 * @slot heading - The card heading/title content. Use a semantic heading element (h2, h3, etc.) for proper accessibility.
 * @slot - Default slot for the card body content.
 * @slot footer - Optional footer content below the body.
 * @slot actions - Optional action buttons, rendered with a top border separator. Do NOT use together with hx-href (interactive card + focusable actions is an ARIA anti-pattern).
 *
 * @fires {CustomEvent<{href: string, originalEvent: MouseEvent | KeyboardEvent}>} hx-click - Dispatched when an interactive card (with hx-href) is clicked.
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
 * @cssprop [--hx-card-image-aspect-ratio=16/9] - Aspect ratio for the image slot.
 * @cssprop [--hx-border-radius-lg] - CSS custom property.
 * @cssprop [--hx-border-width-medium] - Width.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-card-focus-ring-color=var(--hx-focus-ring-color)] - Color.
 * @cssprop [--hx-card-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-font-size-xl] - Font size.
 * @cssprop [--hx-font-weight-semibold] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-line-height-tight] - Line height.
 * @cssprop [--hx-shadow-lg] - Box shadow.
 * @cssprop [--hx-shadow-md] - Box shadow.
 * @cssprop [--hx-shadow-xl] - Box shadow.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-6] - Spacing token.
 * @cssprop [--hx-transform-lift-md] - CSS custom property.
 * @cssprop [--hx-transition-normal] - Transition timing.
 */
@customElement('hx-card')
export class HelixCard extends HelixElement {
  /** @internal */
  static override shadowRootOptions = {
    ...HelixElement.shadowRootOptions,
    delegatesFocus: true,
  };

  static override styles = [helixCardStyles];

  /**
   * Visual style variant of the card.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'featured' | 'compact' = 'default';

  /**
   * Elevation (shadow depth) of the card.
   * @attr elevation
   */
  @property({ type: String, reflect: true })
  elevation: 'flat' | 'raised' | 'floating' = 'flat';

  /**
   * Optional URL. When set, the card becomes interactive (clickable)
   * and navigates to this URL on click.
   * Uses the hx-href attribute to avoid conflicting with the native HTML href attribute.
   * @attr hx-href
   */
  @property({ type: String, attribute: 'hx-href' })
  href: string | undefined = undefined;

  /**
   * Accessible label for interactive cards. Use this to provide a meaningful
   * description of the card's purpose rather than exposing the raw URL.
   * Only applies when hx-href is set.
   * @attr hx-label
   */
  @property({ type: String, attribute: 'hx-label' })
  label: string | undefined = undefined;

  // ─── Slot Detection ───

  /**
   * Tracks whether any content is assigned to the image slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasImage = false;

  /**
   * Tracks whether any content is assigned to the heading slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasHeading = false;

  /**
   * Tracks whether any content is assigned to the footer slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasFooter = false;

  /**
   * Tracks whether any content is assigned to the actions slot, controlling slot container visibility.
   * @internal
   */
  @state() private _hasActions = false;

  /**
   * Text content extracted from the heading slot, used as a fallback accessible
   * name for interactive cards when no explicit `hx-label` is provided.
   * @internal
   */
  @state() private _headingText = '';

  /**
   * Unique identifier for this card instance, used in ARIA attributes.
   * @internal
   */
  private _cardId = _nextCardId();
  /**
   * Unique identifier for the heading element, used in aria-labelledby.
   * @internal
   */
  private _headingId = `${this._cardId}-heading`;

  /** @internal */
  private _onImageSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasImage = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _onHeadingSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasHeading = nodes.length > 0;
    this._headingText = nodes
      .map((n) => n.textContent?.trim() ?? '')
      .join(' ')
      .trim();
  }

  /** @internal */
  private _onFooterSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFooter = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /** @internal */
  private _onActionsSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasActions = slot.assignedNodes({ flatten: true }).length > 0;
    if (this._hasActions && this.href) {
      devWarn(
        'hx-card',
        'Using hx-href (interactive card) together with the actions slot is an ARIA anti-pattern: ' +
          'interactive controls cannot be nested inside role="link". ' +
          'Use either hx-href or the actions slot, not both.',
      );
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    // WCAG 4.1.2: interactive cards (with hx-href) must have an accessible name
    if (
      (changedProperties.has('href') || changedProperties.has('label')) &&
      this.href &&
      !this.label &&
      !this._headingText
    ) {
      devWarn(
        'hx-card',
        "Interactive card (hx-href is set) is missing an accessible name. Set `hx-label` or provide heading slot content to describe the card's destination or purpose (WCAG 4.1.2).",
      );
    }
  }

  // ─── Event Handling ───

  /** @internal */
  private _dispatchCardClick(originalEvent: MouseEvent | KeyboardEvent): void {
    if (!this.href) return;

    /**
     * Dispatched when an interactive card is clicked.
     * Includes the target href in the detail.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent<{ href: string; originalEvent: MouseEvent | KeyboardEvent }>('hx-click', {
        bubbles: true,
        composed: true,
        detail: { href: this.href, originalEvent },
      }),
    );
  }

  /** @internal */
  private _handleClick(e: MouseEvent): void {
    this._dispatchCardClick(e);
  }

  /** @internal */
  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this.href) return;

    // WCAG 2.1.1 / ARIA APG: role="link" activates on Enter only.
    // Space is reserved for scrolling and must not activate links.
    if (e.key === 'Enter') {
      e.preventDefault();
      this._dispatchCardClick(e);
    }
  }

  // ─── Render ───

  override render() {
    const isInteractive = !!this.href;

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
        aria-label=${isInteractive && this.label ? this.label : nothing}
        aria-labelledby=${this._hasHeading && !this.label ? this._headingId : nothing}
        @click=${this._handleClick}
        @keydown=${this._handleKeyDown}
      >
        <div class="card__image" part="image" ?hidden=${!this._hasImage}>
          <slot name="image" @slotchange=${this._onImageSlotChange}></slot>
        </div>

        <div
          class="card__heading"
          part="heading"
          id=${this._headingId}
          ?hidden=${!this._hasHeading}
        >
          <slot name="heading" @slotchange=${this._onHeadingSlotChange}></slot>
        </div>

        <div class="card__body" part="body">
          <slot></slot>
        </div>

        <div class="card__footer" part="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._onFooterSlotChange}></slot>
        </div>

        <div class="card__actions" part="actions" ?hidden=${!this._hasActions}>
          <slot name="actions" @slotchange=${this._onActionsSlotChange}></slot>
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
