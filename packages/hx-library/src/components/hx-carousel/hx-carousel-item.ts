import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

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

      /*
       * Show focus ring for both keyboard-initiated focus (:focus-visible) and
       * programmatic focus (.focus() calls from JS). tabindex="-1" elements only
       * receive focus programmatically, so :focus-visible may not trigger in all
       * browsers — :focus-within on the host ensures the ring is always visible.
       */
      .slide-group:focus-visible,
      .slide-group:focus {
        outline: var(--hx-focus-ring-width) solid var(--hx-focus-ring-color);
        outline-offset: var(--hx-focus-ring-offset);
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
