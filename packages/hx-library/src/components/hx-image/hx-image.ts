import { html, nothing } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { HelixElement } from '../../base/index.js';
import { helixImageStyles } from './hx-image.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';
import { injectLightStyles } from '../../utilities/injectLightStyles.js';

/**
 * Scoped light-DOM CSS for WRAPPED mode. `::slotted()` in the shadow sheet can
 * size a directly-slotted `<img>`/`<picture>`, but it cannot reach the `<img>`
 * nested inside a slotted `<picture>` (a light-DOM descendant). This sheet,
 * injected once into `document.head` and scoped to
 * `[data-hx-styled="hx-image"]`, sizes those descendants so responsive-image
 * markup (`<picture><source><img></picture>`) fills the framed figure.
 */
const WRAPPED_LIGHT_CSS = `
:is(picture, img) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: var(--_fit, var(--hx-image-object-fit, cover));
  border-radius: var(--_radius, var(--hx-image-border-radius, 0));
}
`;

/**
 * An accessible image wrapper with lazy loading, fallback support, aspect ratio control,
 * responsive image (srcset/sizes) support, and optional caption.
 *
 * `hx-image` operates in one of two modes, selected automatically:
 *
 * - **OWNED mode** (default, attribute-driven): with `src` (and optional
 *   `srcset`/`sizes`) set and no default-slot content, the component renders and
 *   owns its own responsive `<img>`. Behaviour is unchanged from prior releases.
 * - **WRAPPED mode** (slotted): when the default (unnamed) slot has assigned
 *   element(s), `hx-image` becomes a pure framing/style/enhancement layer over
 *   consumer-supplied media (e.g. a Drupal responsive-image
 *   `<picture><source><img></picture>`). The same figure framing
 *   (ratio/fit/rounded/width/height), caption, error/fallback handling, and
 *   `hx-load`/`hx-error` events apply. In WRAPPED mode the slotted media owns its
 *   own `alt`; `fallback-src` does not apply.
 *
 * If both `src` and default-slot content are provided, WRAPPED mode wins (the
 * consumer explicitly supplied media) and a development warning is emitted.
 *
 * @summary Accessible image wrapper with lazy loading, fallback, srcset, aspect ratio control, and a slotted (WRAPPED) mode.
 *
 * @tag hx-image
 *
 * @slot - Default slot for consumer-supplied media (WRAPPED mode). Assigning an
 *   `<img>` or `<picture>` here switches the component to WRAPPED mode, where it
 *   frames and enhances the slotted media instead of rendering its own `<img>`.
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
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-neutral-600] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 */
@customElement('hx-image')
export class HelixImage extends HelixElement {
  static override styles = [helixImageStyles, forcedColorsSurface];

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
  @property({ type: String, reflect: true })
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

  /** @internal */
  @state()
  private _error = false;

  /** @internal */
  @state()
  private _usedFallbackSrc = false;

  /** @internal */
  @state()
  private _hasCaptionSlot = false;

  /**
   * Whether the default (unnamed) slot has assigned element content, which
   * switches the component into WRAPPED mode.
   * @internal
   */
  @state()
  private _hasSlottedMedia = false;

  /**
   * The slotted `<img>` currently wired for load/error re-dispatch in WRAPPED
   * mode (either a directly-slotted `<img>` or the `<img>` inside a slotted
   * `<picture>`), or `null` when none is attached.
   * @internal
   */
  private _slottedImg: HTMLImageElement | null = null;

  /** @internal */
  private _handleLoad(): void {
    this.dispatchEvent(new CustomEvent<void>('hx-load', { bubbles: true, composed: true }));
  }

  /** @internal */
  private _handleError(): void {
    if (!this._error && this.fallbackSrc && !this._usedFallbackSrc) {
      // Try the fallback-src before showing the fallback slot
      this._usedFallbackSrc = true;
      return;
    }
    this._error = true;
    this.dispatchEvent(new CustomEvent<void>('hx-error', { bubbles: true, composed: true }));
  }

  /**
   * Re-dispatches `hx-load` from slotted media (WRAPPED mode). Bound as an arrow
   * so it can be added/removed on the slotted `<img>` via addEventListener with a
   * stable `this` and stable identity.
   * @internal
   */
  private _handleSlottedLoad = (): void => {
    this.dispatchEvent(new CustomEvent<void>('hx-load', { bubbles: true, composed: true }));
  };

  /**
   * Handles native `error` on the slotted media (WRAPPED mode). `fallback-src`
   * does not apply here — the consumer owns the media — so we go straight to the
   * shared error state (fallback slot) and re-dispatch `hx-error`.
   * @internal
   */
  private _handleSlottedError = (): void => {
    if (this._error) return;
    this._error = true;
    this.dispatchEvent(new CustomEvent<void>('hx-error', { bubbles: true, composed: true }));
  };

  /** @internal */
  private _onCaptionSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasCaptionSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  /**
   * Handles the default slot's `slotchange`. Detects WRAPPED mode, resolves the
   * slotted `<img>` (direct, or nested inside a slotted `<picture>`), and wires
   * native load/error listeners for re-dispatch. Previously-attached listeners
   * are always removed first so slot mutations never double-dispatch or leak.
   * @internal
   */
  private _onDefaultSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const elements = slot.assignedElements({ flatten: true });
    this._hasSlottedMedia = elements.length > 0;

    if (this._hasSlottedMedia) {
      this._ensureWrappedLightStyles();
    }

    this._resolveSlottedImg(elements);
  }

  /**
   * Resolves the slotted `<img>` from assigned elements and (re)attaches
   * load/error listeners. A direct `<img>` is used as-is; a `<picture>` resolves
   * to its inner `<img>`. Detaches any prior listeners first.
   * @internal
   */
  private _resolveSlottedImg(elements: readonly Element[]): void {
    let next: HTMLImageElement | null = null;
    for (const node of elements) {
      if (node instanceof HTMLImageElement) {
        next = node;
        break;
      }
      if (node instanceof HTMLPictureElement) {
        const inner = node.querySelector('img');
        if (inner) {
          next = inner;
          break;
        }
      }
    }

    if (next === this._slottedImg) return;

    this._detachSlottedListeners();

    if (next) {
      // Soft, minimal a11y hint: slotted media owns its own alt in WRAPPED mode,
      // but a missing alt with no presentation role is likely an oversight.
      if (!next.hasAttribute('alt') && next.getAttribute('role') !== 'presentation') {
        devWarn(
          'hx-image',
          'Slotted image has no `alt` attribute and is not marked presentational. ' +
            'Provide an `alt` value on the slotted <img>, or set role="presentation" if decorative (WCAG 1.1.1).',
        );
      }

      next.addEventListener('load', this._handleSlottedLoad);
      next.addEventListener('error', this._handleSlottedError);
      this._slottedImg = next;

      // If the slotted image already finished loading before we attached, do not
      // synthesize a duplicate hx-load — but do surface an already-broken image.
      if (next.complete) {
        if (next.naturalWidth === 0 && next.currentSrc) {
          this._handleSlottedError();
        }
      }
    }
  }

  /** @internal */
  private _detachSlottedListeners(): void {
    if (this._slottedImg) {
      this._slottedImg.removeEventListener('load', this._handleSlottedLoad);
      this._slottedImg.removeEventListener('error', this._handleSlottedError);
      this._slottedImg = null;
    }
  }

  /**
   * Stamps the host with `data-hx-styled` and injects the WRAPPED light-DOM
   * sheet once (deduped by injectLightStyles). No-op in SSR (injectLightStyles
   * guards for a missing `document`).
   * @internal
   */
  private _ensureWrappedLightStyles(): void {
    this.setAttribute('data-hx-styled', 'hx-image');
    injectLightStyles('hx-image', WRAPPED_LIGHT_CSS);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._detachSlottedListeners();
  }

  /** @internal */
  private _computeBorderRadius(): string | undefined {
    if (this.rounded === true || this.rounded === '' || this.rounded === 'true') {
      return 'var(--hx-border-radius-md, 0.375rem)';
    }
    if (typeof this.rounded === 'string' && this.rounded.length > 0 && this.rounded !== 'false') {
      return this.rounded;
    }
    return undefined;
  }

  /** @internal */
  private _currentSrc(): string {
    if (this._usedFallbackSrc && this.fallbackSrc) {
      return this.fallbackSrc;
    }
    return this.src;
  }

  override render() {
    // WRAPPED mode = the default slot has assigned element(s). When both `src`
    // and slotted media are present, WRAPPED wins (the consumer explicitly
    // supplied media) and we flag the ambiguity for the developer.
    const wrapped = this._hasSlottedMedia;
    if (wrapped && this.src) {
      devWarn(
        'hx-image',
        'Both `src` and slotted media were provided. Slotted media (WRAPPED mode) takes ' +
          'precedence and the `src` image is ignored. Remove one to resolve the ambiguity.',
      );
    }

    // OWNED mode owns the `alt` contract; WRAPPED media owns its own `alt`, so
    // the OWNED alt warning is suppressed there (a soft slotted-alt hint is
    // emitted at slot-resolution time instead).
    if (!wrapped && !this.decorative && !this.alt) {
      devWarn(
        'hx-image',
        'Informative images require an `alt` attribute for accessibility (WCAG 1.1.1). ' +
          'Provide a descriptive `alt` value, or set the `decorative` attribute if the image is decorative.',
      );
    }
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
        >
          <slot name="fallback"></slot>
        </figure>
      `;
    }

    // The default slot is always rendered so `slotchange` can drive mode
    // detection; in OWNED mode it is empty and renders nothing. In OWNED mode
    // the `<img>` path below is byte-identical to the pre-WRAPPED template.
    return html`
      <figure class="image__container" style=${styleMap(containerStyles)}>
        ${wrapped
          ? nothing
          : html`
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
            `}
        <slot @slotchange=${this._onDefaultSlotChange}></slot>
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
