import { html, nothing, type PropertyValues } from 'lit';
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
 * Scoped light-DOM CSS for WRAPPED mode. `::slotted()` in the shadow sheet
 * already sizes a directly-slotted `<img>`/`<picture>`; the ONE case it cannot
 * reach is the `<img>` nested inside a slotted `<picture>` (a light-DOM
 * descendant of the picture, not a directly-assigned node). This sheet,
 * injected once into `document.head` and scoped to
 * `[data-hx-styled="hx-image"]`, sizes only that descendant so responsive-image
 * markup (`<picture><source><img></picture>`) fills the framed figure.
 *
 * The selector uses a leading child combinator so it targets ONLY the inner
 * `<img>` of a DEFAULT-slot `<picture>` (a direct child of the host with no
 * `slot=` attribute). `generateScopedSelectors` prepends the scope attribute
 * with a descendant combinator, yielding
 * `[data-hx-styled="hx-image"] > picture:not([slot]) img`. This deliberately
 * excludes `<img slot="fallback">` / `<img slot="caption">` (named-slot media)
 * and any non-picture descendant `<img>`, so caption/fallback images are never
 * stretched to fill the frame.
 */
const WRAPPED_LIGHT_CSS = `
> picture:not([slot]) img {
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
   * Whether the pre-render WRAPPED seed has run. `slotchange` fires AFTER the
   * first render, so `_hasSlottedMedia` is seeded synchronously (before the
   * first `render()`) from the host's light-DOM children destined for the
   * default slot. This flag ensures that seed runs exactly once — subsequent
   * dynamic changes are owned by `_onDefaultSlotChange`, so the pre-render
   * computation never fights the authoritative slotchange handler.
   * @internal
   */
  private _seededSlottedMedia = false;

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
    // A successful (re)load recovers the WRAPPED error state. This covers the
    // same-node repair case (the broken `<img>`'s `src` is fixed and it
    // re-loads without a `slotchange`), where the still-attached `load` listener
    // is the only recovery signal. Recovery is independent of the emit guard so
    // a repaired image always clears the fallback even if it re-fires `load`.
    if (this._error) {
      this._error = false;
      this._usedFallbackSrc = false;
      this._erroredImg = null;
    }
    // At most one hx-load per resolved SOURCE: a load for a source we already
    // emitted for (native + synthetic cached-load path racing on the same
    // initial source) is suppressed, but a genuinely new source on the same
    // reused node (src/srcset change, or a new <picture> candidate) re-emits.
    const img = this._slottedImg;
    if (img) {
      // `currentSrc` is the resolved candidate the browser actually loaded;
      // fall back to `src` when it isn't populated (some cached/SSR cases).
      const source = img.currentSrc || img.src;
      if (this._lastEmittedSrc === source) return;
      this._lastEmittedSrc = source;
    }
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
    this._erroredImg = this._slottedImg;
    this.dispatchEvent(new CustomEvent<void>('hx-error', { bubbles: true, composed: true }));
  };

  /**
   * The image SOURCE for which an `hx-load` has already been emitted for the
   * currently-attached slotted `<img>`. Keyed by `currentSrc` (the resolved
   * candidate the browser actually loaded) rather than node identity, so:
   *  - a cached image whose native `load` also fires does NOT double-dispatch
   *    (same source → suppressed), preserving the exactly-one-per-cached-image
   *    guarantee; and
   *  - a consumer that reuses one `<img>` and updates `src`/`srcset` (or a
   *    slotted `<picture>` whose nested `<img>` loads a new candidate) DOES get
   *    a fresh `hx-load` — the new source differs from the last emitted one.
   * `null` when nothing has been emitted for the attached node. Reset on detach
   * so a freshly resolved image can emit its own `hx-load`.
   * @internal
   */
  private _lastEmittedSrc: string | null = null;

  /**
   * The slotted `<img>` that last drove the WRAPPED error state. Retained so a
   * `slotchange` that merely re-projects the same still-broken node (e.g. the
   * error template re-rendering the default slot) does NOT clear `_error`, while
   * a genuine replacement (a different node, or the same node repaired) does.
   * @internal
   */
  private _erroredImg: HTMLImageElement | null = null;

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
    // WRAPPED mode is entered ONLY for a DIRECTLY-slotted `<img>` or `<picture>`.
    // Any other default-slot content — wrapper markup (`<a><img></a>`), a
    // `<div>`, loose text — leaves the component in OWNED mode so the owned
    // `<img>` still renders and the `src` fetch is not suppressed.
    this._hasSlottedMedia = this._resolveImgCandidate(elements) !== null;

    if (this._hasSlottedMedia) {
      this._ensureWrappedLightStyles();
    }

    // WRAPPED recovery: while in the error state the default `<slot>` stays in
    // the DOM (hidden) so replacing the broken media re-fires `slotchange`. A
    // `slotchange` clears `_error` only when a *different* node is now resolved
    // (a genuine replacement). This deliberately ignores the same-node case:
    //  - the error template's freshly-rendered slot re-projects the same broken
    //    node and must NOT bounce out of the error state (no node change), and
    //  - a same-node repair (its `src` is fixed and it re-loads) does not fire
    //    `slotchange` at all — it recovers via the still-attached `load`
    //    listener (see _handleSlottedLoad).
    if (this._error) {
      const nextImg = this._resolveImgCandidate(elements);
      if (nextImg !== this._erroredImg) {
        this._error = false;
        this._usedFallbackSrc = false;
        this._erroredImg = null;
      }
    }

    this._resolveSlottedImg(elements);
  }

  /**
   * Resolves the `<img>` candidate from assigned elements. The WRAPPED contract
   * is deliberately narrow — only a DIRECTLY-slotted `<img>` or `<picture>`
   * qualifies:
   *  1. a directly-slotted `<img>` → itself;
   *  2. a directly-slotted `<picture>` → its inner `<img>`.
   * Wrapper markup (`<a><img></a>`, `<div>`, `<figure>`, …) is intentionally NOT
   * matched: the wrapper element is never sized by the framing rules, so its
   * nested `<img>`'s `100%/100%` would resolve against the auto-sized wrapper
   * rather than the framed figure and render wrong. Such content leaves the
   * component in OWNED mode. To frame a linked image, wrap the `<hx-image>`
   * element in the `<a>` and slot a bare `<img>`/`<picture>` inside it. `null`
   * when no directly-slotted `<img>`/`<picture>` is present.
   * @internal
   */
  private _resolveImgCandidate(elements: readonly Element[]): HTMLImageElement | null {
    for (const node of elements) {
      // Match on `tagName` (uppercase for HTML) rather than
      // `instanceof HTMLImageElement`/`HTMLPictureElement` for consistency with
      // the SSR-safe pre-render seed (`_hasDefaultSlotLightChildren`). This path
      // is client-only (driven by `slotchange`), so a real DOM always exists,
      // but keeping one detection idiom avoids divergence between seed and
      // slotchange.
      if (node.tagName === 'IMG') return node as HTMLImageElement;
      if (node.tagName === 'PICTURE') {
        const inner = node.querySelector('img');
        if (inner) return inner;
      }
    }
    return null;
  }

  /**
   * Resolves the slotted `<img>` from assigned elements and (re)attaches
   * load/error listeners. A direct `<img>` is used as-is; a `<picture>` resolves
   * to its inner `<img>`. Detaches any prior listeners first.
   * @internal
   */
  private _resolveSlottedImg(elements: readonly Element[]): void {
    const next = this._resolveImgCandidate(elements);

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

      // Cached/SSR slotted media can already be resolved by the time slotchange
      // runs (the native `load`/`error` fired before we attached listeners).
      // Surface the terminal state synthetically so the WRAPPED load/error
      // contract holds on first paint:
      //  - complete + naturalWidth > 0 → loaded → emit exactly one hx-load
      //    (deferred to a microtask so it dispatches after this render, and
      //    guarded per-image so a later native `load` can't double-dispatch).
      //  - complete + naturalWidth === 0 + currentSrc → already broken → hx-error.
      if (next.complete) {
        if (next.naturalWidth > 0) {
          const resolved = next;
          queueMicrotask(() => {
            // Ignore if the slot changed again before the microtask ran. The
            // shared handler's per-source guard suppresses a double-dispatch if
            // a native `load` for the same source already emitted.
            if (this._slottedImg !== resolved) return;
            // Route through the shared handler so the one-per-source guard applies.
            this._handleSlottedLoad();
          });
        } else if (next.naturalWidth === 0 && next.currentSrc) {
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
    // Clear the per-source load-emit guard so a newly resolved image can emit
    // its own hx-load.
    this._lastEmittedSrc = null;
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

  /**
   * Seeds WRAPPED-mode detection SYNCHRONOUSLY before the first render. The
   * default slot's `slotchange` only fires AFTER the first render, so without
   * this a caller providing BOTH `src` and default-slot media (WRAPPED wins)
   * would briefly render the owned `<img>` — kicking off a wasted `src` fetch
   * that can paint the wrong image before the re-render drops it. Computing the
   * initial `_hasSlottedMedia` from the host's light-DOM children here means the
   * owned `<img>` is never produced when default-slot media exists.
   *
   * This runs once (guarded by `_seededSlottedMedia`); `_onDefaultSlotChange`
   * remains authoritative for every subsequent dynamic change.
   * @internal
   */
  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (!this._seededSlottedMedia) {
      this._seededSlottedMedia = true;
      this._hasSlottedMedia = this._hasDefaultSlotLightChildren();
    }
  }

  /**
   * Seeds WRAPPED mode before the first render by detecting whether the host has
   * a DIRECT default-slot child that IS an `<img>` or a `<picture>` (a light-DOM
   * element child without a `slot=` attribute). Children with
   * `slot="fallback"` / `slot="caption"` are named-slot content and are ignored,
   * as is any other default-slot content — wrapper markup (`<a><img></a>`), a
   * bare `<span>text</span>`, or loose text — which leaves the component in
   * OWNED mode so the owned `<img>` / `src` fetch is not suppressed. This mirrors
   * the runtime `slotchange` gate (`_resolveImgCandidate`), keeping the
   * pre-render seed and the authoritative slotchange handler in agreement.
   * @internal
   */
  private _hasDefaultSlotLightChildren(): boolean {
    for (const node of this.childNodes) {
      // ELEMENT_NODE === 1. The numeric literal is used instead of
      // `Node.ELEMENT_NODE` because this method runs on the SSR render path
      // (via `willUpdate`), where the `Node` DOM global is `undefined` and any
      // reference to it throws a `TypeError`.
      if (node.nodeType !== 1) continue;
      const el = node as Element;
      if (el.hasAttribute('slot')) continue; // named-slot content — not default slot
      // Resolvable only for a DIRECT <img> or <picture> default-slot child.
      // Detected via `tagName` (uppercase for HTML) rather than
      // `instanceof HTMLImageElement`/`HTMLPictureElement`: under server
      // rendering those DOM-global constructors are `undefined`, so `instanceof`
      // throws and breaks SSR. `tagName` comparison is DOM-free and identical in
      // behaviour for real IMG/PICTURE elements.
      if (el.tagName === 'IMG' || el.tagName === 'PICTURE') {
        return true;
      }
    }
    return false;
  }

  /**
   * In WRAPPED mode the slotted `<img>`/`<picture> img` live in LIGHT DOM, so
   * they are NOT descendants of the shadow `<figure>` that carries `--_fit` /
   * `--_radius`. Both the `::slotted(...)` shadow rules and the injected
   * `[data-hx-styled="hx-image"]` light-DOM sheet resolve those vars against the
   * slotted element's light-DOM cascade (the HOST and up) — where nothing sets
   * them — so per-instance `fit`/`rounded` would silently fall back to defaults.
   * Mirroring them onto the HOST lets the light-DOM slotted descendants inherit
   * the intended values. OWNED mode never touches these host vars (its shadow
   * `<img>` already inherits from the figure), so existing behaviour is
   * unchanged; they are cleared whenever WRAPPED mode is not active.
   * @internal
   */
  override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);

    if (this._hasSlottedMedia) {
      const fit = this.fit;
      const radius = this._computeBorderRadius();
      if (fit) {
        this.style.setProperty('--_fit', fit);
      } else {
        this.style.removeProperty('--_fit');
      }
      if (radius) {
        this.style.setProperty('--_radius', radius);
      } else {
        this.style.removeProperty('--_radius');
      }
    } else {
      this.style.removeProperty('--_fit');
      this.style.removeProperty('--_radius');
    }
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
      // In WRAPPED mode the default `<slot>` must remain in the DOM even while
      // the fallback is shown, so replacing/repairing the broken slotted media
      // still fires `slotchange` (which clears `_error` and re-resolves). It is
      // visually removed via `hidden` so only the fallback is seen. OWNED mode
      // has no slotted media to recover, so it omits the slot as before.
      return html`
        <figure
          class="image__container image__container--error"
          style=${styleMap(containerStyles)}
          role="alert"
        >
          <slot name="fallback"></slot>
          ${wrapped ? html`<slot hidden @slotchange=${this._onDefaultSlotChange}></slot>` : nothing}
        </figure>
      `;
    }

    // The default slot is ALWAYS rendered — as a single STABLE `<slot>` element
    // whose identity does not change between modes — so `slotchange` can drive
    // mode detection (including a dynamic OWNED→WRAPPED switch when a consumer
    // adds media later) without the slot being torn down and recreated (which
    // would re-fire slotchange and re-run the cached-load synthetic path). In
    // WRAPPED mode it projects the slotted media directly into the figure. In
    // OWNED mode the `image__owned-slot` class (display:none) is toggled onto
    // it, rendering it INERT: `slotchange` still fires but any stray non-media
    // default-slot content (e.g. a `<span>` alongside `src`) is hidden and never
    // shown alongside the owned `<img>`. In OWNED mode the `<img>` path below is
    // byte-identical to the pre-WRAPPED template.
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
        <slot
          class=${classMap({ 'image__owned-slot': !wrapped })}
          @slotchange=${this._onDefaultSlotChange}
        ></slot>
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
