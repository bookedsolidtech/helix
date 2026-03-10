import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';

/**
 * A wrapper for individual carousel slides.
 *
 * @summary Individual slide wrapper for use inside hx-carousel.
 *
 * @tag hx-carousel-item
 *
 * @slot - Slide content.
 */
@customElement('hx-carousel-item')
export class HelixCarouselItem extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host {
        display: block;
        flex-shrink: 0;
        width: var(--_hx-carousel-slide-width, 100%);
        box-sizing: border-box;
      }

      .slide-group {
        height: 100%;
        outline: none;
      }

      .slide-group:focus-visible {
        outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
        outline-offset: var(--hx-focus-ring-offset, 2px);
      }
    `,
  ];

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
      <div class="slide-group" role="group" aria-label=${label} tabindex="-1">
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
