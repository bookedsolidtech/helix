import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixImageStyles } from './hx-image.styles.js';

/**
 * An accessible image wrapper with lazy loading, fallback support, and aspect ratio control.
 * Handles decorative images (empty alt) and informative images (alt text provided).
 *
 * @summary Accessible image wrapper with lazy loading, fallback, and aspect ratio control.
 *
 * @tag hx-image
 *
 * @slot fallback - Custom content shown when the image fails to load and no fallback-src is set.
 *
 * @csspart base - The inner img element.
 *
 * @cssprop [--hx-image-object-fit] - Controls how the image fills its container. Maps to object-fit.
 * @cssprop [--hx-image-border-radius] - Border radius of the image. Overridden by the `rounded` prop.
 * @cssprop [--hx-image-aspect-ratio] - Aspect ratio of the image container. Overridden by the `ratio` prop.
 *
 * @fires hx-load - Dispatched when the image has successfully loaded.
 * @fires hx-error - Dispatched when the image fails to load.
 */
@customElement('hx-image')
export class HelixImage extends LitElement {
  static override styles = [tokenStyles, helixImageStyles];

  /**
   * The URL of the image to display.
   * @attr src
   */
  @property({ type: String })
  src = '';

  /**
   * Accessible text description of the image.
   * Set to an empty string for decorative images (role="presentation" will be applied).
   * @attr alt
   */
  @property({ type: String })
  alt = '';

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
  @property({ type: String })
  loading: 'lazy' | 'eager' = 'lazy';

  /**
   * How the image should be resized to fit its container.
   * Maps to CSS object-fit.
   * @attr fit
   */
  @property({ type: String })
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' | undefined = undefined;

  /**
   * CSS aspect-ratio value (e.g. "16/9", "1", "4/3").
   * When set, the container maintains this ratio.
   * @attr ratio
   */
  @property({ type: String })
  ratio: string | undefined = undefined;

  /**
   * Border radius for the image.
   * Boolean true applies the theme's medium radius token.
   * A string value is used directly as a CSS border-radius value.
   * @attr rounded
   */
  @property()
  rounded: boolean | string | undefined = undefined;

  /**
   * Fallback image URL shown when the primary src fails to load.
   * @attr fallback-src
   */
  @property({ type: String, attribute: 'fallback-src' })
  fallbackSrc: string | undefined = undefined;

  @state()
  private _error = false;

  @state()
  private _usedFallbackSrc = false;

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

  private _computeBorderRadius(): string | undefined {
    if (this.rounded === true || this.rounded === '') {
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
    const isDecorative = this.alt === '';
    const borderRadius = this._computeBorderRadius();

    const containerStyles = {
      ...(this.ratio ? { '--_ratio': this.ratio } : {}),
      ...(this.fit ? { '--_fit': this.fit } : {}),
      ...(borderRadius ? { '--_radius': borderRadius } : {}),
      ...(this.width != null ? { width: typeof this.width === 'number' ? `${this.width}px` : this.width } : {}),
      ...(this.height != null ? { height: typeof this.height === 'number' ? `${this.height}px` : this.height } : {}),
    };

    if (this._error) {
      return html`
        <div
          class="image__container image__container--error"
          style=${styleMap(containerStyles)}
        >
          <slot name="fallback"></slot>
        </div>
      `;
    }

    return html`
      <div class="image__container" style=${styleMap(containerStyles)}>
        <img
          part="base"
          class="image__img"
          src=${this._currentSrc() || nothing}
          alt=${this.alt}
          role=${isDecorative ? 'presentation' : nothing}
          loading=${this.loading}
          width=${this.width != null ? this.width : nothing}
          height=${this.height != null ? this.height : nothing}
          @load=${this._handleLoad}
          @error=${this._handleError}
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-image': HelixImage;
  }
}
