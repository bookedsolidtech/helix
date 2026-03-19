import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixCarouselItemStyles } from './hx-carousel-item.styles.js';

/**
 * A wrapper for individual carousel slides.
 *
 * @summary Individual slide wrapper for use inside hx-carousel.
 *
 * @tag hx-carousel-item
 *
 * @slot - Slide content.
 *
 * @csspart slide - The slide wrapper element.
 */
@customElement('hx-carousel-item')
export class HelixCarouselItem extends LitElement {
  static override styles = [tokenStyles, helixCarouselItemStyles];

  /**
   * The 0-based index of this slide within the carousel. Set by hx-carousel.
   * @attr slide-index
   */
  @property({ type: Number, attribute: 'slide-index' })
  slideIndex = 0;

  /**
   * Total number of slides in the carousel. Set by hx-carousel.
   * @attr total-slides
   */
  @property({ type: Number, attribute: 'total-slides' })
  totalSlides = 0;

  override render() {
    const label = `Slide ${this.slideIndex + 1} of ${this.totalSlides}`;
    return html`
      <div class="slide-group" part="slide" role="group" aria-label=${label} tabindex="-1">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-carousel-item': HelixCarouselItem;
  }
}
