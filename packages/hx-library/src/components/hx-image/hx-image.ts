import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixImageStyles } from './hx-image.styles.js';

/**
 * An accessible image wrapper with lazy loading, fallback support, aspect ratio control,
 * responsive image (srcset/sizes) support, and optional caption.
 *
 * @summary Accessible image wrapper with lazy loading, fallback, srcset, and aspect ratio control.
 *
 * @tag hx-image
 *
 * @slot fallback - Custom content shown when the image fails to load and no fallback-src is set.
 * @slot caption - Optional caption content rendered in a figcaption element below the image.
 *
 * @csspart base - The inner img element.
 * @csspart caption - The figcaption element (visible only when caption content is present).
 *
 * @cssprop [--hx-image-object-fit] - Controls how the image fills its container. Maps to object-fit.
 * @cssprop [--hx-image-border-radius] - Border radius of the image. Overridden by the `rounded` prop.
 * @cssprop [--hx-image-aspect-ratio] - Aspect ratio of the image container. Overridden by the `ratio` prop.
 * @cssprop [--hx-image-caption-color] - Text color for the caption.
 * @cssprop [--hx-image-caption-font-size] - Font size for the caption.
 * @cssprop [--hx-image-caption-padding] - Padding for the caption.
 * @cssprop [--hx-image-fallback-min-height] - Minimum height of the error/fallback container.
 *
 * @fires hx-load - Dispatched when the image has successfully loaded.
 * @fires hx-error - Dispatched when the image fails to load (including after fallback-src also fails).
 */
@customElement('hx-image')
export class HelixImage extends LitElement {
  static override styles = [tokenStyles, helixImageStyles];

  /**
   * The URL of the image to display.
   * @attr src
   */
  @property({ type: String, reflect: true })
  src = '';

  /**
   * Accessible text description of the image.
   * Required for informative images. Use the `decorative` prop for decorative images
   * instead of setting this to an empty string — explicit decorative intent is preferred.
   * @attr alt
   */
  @property({ type: String, reflect: true })
  alt: string | undefined = undefined;

  /**
   * Marks the image as decorative (hidden from screen readers).
   * Use this instead of `alt=""` to make decorative intent explicit in markup.
   * When set, the inner img receives `alt=""` and `role="presentation"`.
   * @attr decorative
   */
  @property({ type: Boolean, reflect: true })
  decorative = false;

  /**
   * Width of the image element.
   * @attr width
   */
  @property({ reflect: true })
  width: number | string | undefined = undefined;

  /**
   * Height of the image element.
   * @attr height
   */
  @property({ reflect: true })
  height: number | string | undefined = undefined;

  /**
   * Loading strategy for the image.
   * @attr loading
   */
  @property({ type: String, reflect: true })
  loading: 'lazy' | 'eager' = 'lazy';

  /**
   * How the image should be resized to fit its container.
   * Maps to CSS object-fit.
   * @attr fit
   */
  @property({ type: String, reflect: true })
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | undefined = undefined;

  /**
   * CSS aspect-ratio value (e.g. "16/9", "1", "4/3").
   * When set, the container maintains this ratio.
   * @attr ratio
   */
  @property({ type: String, reflect: true })
  ratio: string | undefined = undefined;

  /**
   * Border radius for the image.
   * Boolean attribute (or `true`) applies the theme's medium radius token.
   * A string value is used directly as a CSS border-radius value (e.g. "1rem", "50%").
   *
   * Note: When set as an HTML attribute (`<hx-image rounded>`), Lit receives the value as
   * an empty string (`''`). When set programmatically (`el.rounded = true`), it receives
   * a boolean. Both forms apply the theme radius token.
   *
   * @attr rounded
   */
  @property({ reflect: true })
  rounded: boolean | string | undefined = undefined;

  /**
   * Fallback image URL shown when the primary src fails to load.
   * @attr fallback-src
   */
  @property({ type: String, attribute: 'fallback-src', reflect: true })
  fallbackSrc: string | undefined = undefined;

  /**
   * A comma-separated list of image candidates for responsive images.
   * Passed directly to the inner img's srcset attribute.
   * Enables Drupal responsive image styles and browser-native image selection.
   * @attr srcset
   */
  @property({ type: String, reflect: true })
  srcset: string | undefined = undefined;

  /**
   * Media conditions indicating which image size to use alongside srcset.
   * Works in conjunction with the `srcset` attribute.
   * @attr sizes
   */
  @property({ type: String, reflect: true })
  sizes: string | undefined = undefined;

  @state()
  private _error = false;

  @state()
  private _usedFallbackSrc = false;

  @state()
  private _hasCaptionSlot = false;

  private _handleLoad(): void {
    this.dispatchEvent(new CustomEvent('hx-load', { bubbles: true, composed: true }));
  }

  private _handleError(): void {
    if (!this._error && this.fallbackSrc && !this._usedFallbackSrc) {
      // Try the fallback-src before showing the fallback slot
      this._usedFallbackSrc = true;
      return;
    }
    this._error = true;
    this.dispatchEvent(new CustomEvent('hx-error', { bubbles: true, composed: true }));
  }

  private _onCaptionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasCaptionSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _computeBorderRadius(): string | undefined {
    if (this.rounded === true || this.rounded === '' || this.rounded === 'true') {
      return 'var(--hx-border-radius-md, 0.375rem)';
    }
    if (typeof this.rounded === 'string' && this.rounded.length > 0 && this.rounded !== 'false') {
      return this.rounded;
    }
    return undefined;
  }

  private _currentSrc(): string {
    if (this._usedFallbackSrc && this.fallbackSrc) {
      return this.fallbackSrc;
    }
    return this.src;
  }

  override render() {
    const isDecorative = this.decorative || this.alt === '';
    const altText = isDecorative ? '' : (this.alt ?? '');
    const borderRadius = this._computeBorderRadius();
    const showCaption = this._hasCaptionSlot;

    const containerStyles = {
      ...(this.ratio ? { '--_ratio': this.ratio } : {}),
      ...(this.fit ? { '--_fit': this.fit } : {}),
      ...(borderRadius ? { '--_radius': borderRadius } : {}),
      ...(this.width != null
        ? { width: typeof this.width === 'number' ? `${this.width}px` : this.width }
        : {}),
      ...(this.height != null
        ? { height: typeof this.height === 'number' ? `${this.height}px` : this.height }
        : {}),
    };

    if (this._error) {
      return html`
        <figure
          class="image__container image__container--error"
          style=${styleMap(containerStyles)}
          role="alert"
          aria-live="polite"
        >
          <slot name="fallback"></slot>
        </figure>
      `;
    }

    return html`
      <figure class="image__container" style=${styleMap(containerStyles)}>
        <img
          part="base"
          class="image__img"
          src=${this._currentSrc() || nothing}
          alt=${altText}
          role=${isDecorative ? 'presentation' : nothing}
          loading=${this.loading}
          width=${this.width != null ? this.width : nothing}
          height=${this.height != null ? this.height : nothing}
          srcset=${this.srcset ?? nothing}
          sizes=${this.sizes ?? nothing}
          @load=${this._handleLoad}
          @error=${this._handleError}
        />
        <figcaption
          part="caption"
          class=${classMap({ image__caption: true, 'image__caption--visible': showCaption })}
        >
          <slot name="caption" @slotchange=${this._onCaptionSlotChange}></slot>
        </figcaption>
      </figure>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-image': HelixImage;
  }
}
