import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixImageStyles } from './hx-image.styles.js';

/**
 * An accessible image wrapper with lazy loading, fallback support, aspect ratio control,
 * and optional caption. Handles decorative images (via `decorative` prop) and informative
 * images (alt text required). Supports responsive images via `srcset` and `sizes`.
 *
 * @summary Accessible image wrapper with lazy loading, fallback, aspect ratio, and caption support.
 *
 * @tag hx-image
 *
 * @slot fallback - Custom content shown when the image fails to load and no fallback-src is set.
 * @slot caption - Optional caption content rendered inside a `<figcaption>`. When provided, the component wraps in `<figure>`.
 *
 * @csspart base - The inner img element.
 * @csspart container - The image container div.
 * @csspart caption - The figcaption element when a caption slot is used.
 *
 * @cssprop [--hx-image-object-fit] - Controls how the image fills its container. Maps to object-fit.
 * @cssprop [--hx-image-border-radius] - Border radius of the image. Overridden by the `rounded` prop.
 * @cssprop [--hx-image-aspect-ratio] - Aspect ratio of the image container. Overridden by the `ratio` prop.
 * @cssprop [--hx-image-fallback-min-height] - Minimum height for the error/fallback container. Prevents collapse when no ratio/height is set.
 * @cssprop [--hx-image-fallback-bg] - Background color for the error/fallback container.
 * @cssprop [--hx-image-fallback-color] - Text color for the error/fallback container.
 * @cssprop [--hx-image-caption-color] - Text color for the caption.
 * @cssprop [--hx-image-caption-font-size] - Font size for the caption.
 *
 * @fires hx-load - Dispatched when the image has successfully loaded.
 * @fires hx-error - Dispatched when the image fails to load (after all fallbacks exhausted).
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
   * Required for informative images. Ignored when `decorative` is true.
   * @attr alt
   */
  @property({ type: String, reflect: true })
  alt = '';

  /**
   * Marks the image as decorative. When true, the image is hidden from
   * assistive technology via role="presentation" and alt="".
   * @attr decorative
   */
  @property({ type: Boolean, reflect: true })
  decorative = false;

  /**
   * Width of the image element.
   * @attr width
   */
  @property()
  width: number | string | undefined = undefined;

  /**
   * Height of the image element.
   * @attr height
   */
  @property()
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
   * Boolean true applies the theme's medium radius token.
   * A string value is used directly as a CSS border-radius value.
   * @attr rounded
   */
  @property({ type: String, reflect: true })
  rounded: string | undefined = undefined;

  /**
   * Fallback image URL shown when the primary src fails to load.
   * @attr fallback-src
   */
  @property({ type: String, attribute: 'fallback-src' })
  fallbackSrc: string | undefined = undefined;

  /**
   * Responsive image source set. Passed directly to the img srcset attribute.
   * @attr srcset
   */
  @property({ type: String, reflect: true })
  srcset: string | undefined = undefined;

  /**
   * Responsive image sizes descriptor. Passed directly to the img sizes attribute.
   * @attr sizes
   */
  @property({ type: String, reflect: true })
  sizes: string | undefined = undefined;

  /** @internal */
  @state()
  private _error = false;

  /** @internal */
  @state()
  private _usedFallbackSrc = false;

  /** @internal */
  @state()
  private _hasCaption = false;

  private _handleLoad(): void {
    this.dispatchEvent(new CustomEvent('hx-load', { bubbles: true, composed: true }));
  }

  private _handleError(): void {
    if (!this._error && this.fallbackSrc && !this._usedFallbackSrc) {
      this._usedFallbackSrc = true;
      return;
    }
    this._error = true;
    this.dispatchEvent(new CustomEvent('hx-error', { bubbles: true, composed: true }));
  }

  private _computeBorderRadius(): string | undefined {
    if (this.rounded === '' || this.rounded === 'true') {
      return 'var(--hx-border-radius-md, 0.375rem)';
    }
    if (this.rounded && this.rounded !== 'false') {
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

  private _handleCaptionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasCaption = slot.assignedNodes({ flatten: true }).length > 0;
  }

  override render() {
    const isDecorative = this.decorative;
    const effectiveAlt = isDecorative ? '' : this.alt;
    const borderRadius = this._computeBorderRadius();

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

    let content;

    if (this._error) {
      content = html`
        <div
          part="container"
          class="image__container image__container--error"
          style=${styleMap(containerStyles)}
          role="status"
          aria-live="polite"
        >
          <slot name="fallback">
            <span class="image__fallback-text">Image unavailable</span>
          </slot>
        </div>
      `;
    } else if (!this.src) {
      content = html`
        <div
          part="container"
          class="image__container image__container--error"
          style=${styleMap(containerStyles)}
          role="status"
          aria-live="polite"
        >
          <slot name="fallback">
            <span class="image__fallback-text">No image source</span>
          </slot>
        </div>
      `;
    } else {
      content = html`
        <div part="container" class="image__container" style=${styleMap(containerStyles)}>
          <img
            part="base"
            class="image__img"
            src=${this._currentSrc()}
            alt=${effectiveAlt}
            role=${isDecorative ? 'presentation' : nothing}
            aria-hidden=${isDecorative ? 'true' : nothing}
            loading=${this.loading}
            srcset=${this.srcset || nothing}
            sizes=${this.sizes || nothing}
            width=${this.width != null ? this.width : nothing}
            height=${this.height != null ? this.height : nothing}
            @load=${this._handleLoad}
            @error=${this._handleError}
          />
        </div>
      `;
    }

    if (this._hasCaption || this.querySelector('[slot="caption"]')) {
      return html`
        <figure class="image__figure">
          ${content}
          <figcaption part="caption" class="image__caption">
            <slot name="caption" @slotchange=${this._handleCaptionSlotChange}></slot>
          </figcaption>
        </figure>
      `;
    }

    return html`
      ${content}
      <slot name="caption" @slotchange=${this._handleCaptionSlotChange} style="display:none"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-image': HelixImage;
  }
}
