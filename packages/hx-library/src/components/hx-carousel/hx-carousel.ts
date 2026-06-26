import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import '../hx-icon/hx-icon.js';
import { HelixElement } from '../../base/index.js';
import { helixCarouselStyles } from './hx-carousel.styles.js';
import { forcedColorsInteractive } from '../../styles/forced-colors.js';
import type { HelixCarouselItem } from './hx-carousel-item.js';

// ─── Module-level icon templates (helix glyphs; play/pause from FA Free) ───

const _svgChevronLeft = html`<hx-icon
  class="carousel__nav-glyph"
  library="helix"
  name="chevron-left"
  aria-hidden="true"
></hx-icon>`;

const _svgChevronUp = html`<hx-icon
  class="carousel__nav-glyph"
  library="helix"
  name="chevron-up"
  aria-hidden="true"
></hx-icon>`;

const _svgChevronRight = html`<hx-icon
  class="carousel__nav-glyph"
  library="helix"
  name="chevron-right"
  aria-hidden="true"
></hx-icon>`;

const _svgChevronDown = html`<hx-icon
  class="carousel__nav-glyph"
  library="helix"
  name="chevron-down"
  aria-hidden="true"
></hx-icon>`;

// Play / pause aren't part of the curated 32-glyph helix vocabulary, so the
// carousel's autoplay toggle falls back to FA Free Solid.
const _svgPlay = html`<hx-icon
  class="carousel__autoplay-glyph"
  library="fa-free"
  name="play"
  aria-hidden="true"
></hx-icon>`;

const _svgPause = html`<hx-icon
  class="carousel__autoplay-glyph"
  library="fa-free"
  name="pause"
  aria-hidden="true"
></hx-icon>`;

/**
 * A scrollable carousel/slider for images or content slides.
 *
 * @summary Scrollable carousel with navigation, pagination, autoplay, and an accessible label.
 *
 * @tag hx-carousel
 *
 * @slot - `hx-carousel-item` elements (the slides).
 * @slot next-button - Custom next navigation button.
 * @slot previous-button - Custom previous navigation button.
 *
 * @fires {CustomEvent<{index: number, slide?: HelixCarouselItem}>} hx-slide-change - Dispatched when the active slide changes. `detail.index` is the active slide index and `detail.slide` the active `hx-carousel-item`. When the carousel becomes empty (all slides removed at runtime), `detail.index` is `-1` and `detail.slide` is `undefined`.
 *
 * @csspart base - The outer wrapper element.
 * @csspart slide-viewport - The slide viewport/overflow container.
 * @csspart pagination - The pagination dot container.
 * @csspart pagination-item - Individual pagination dot button.
 * @csspart navigation - The previous/next button wrapper.
 * @csspart prev-button - The previous navigation button.
 * @csspart next-button - The next navigation button.
 * @csspart play-pause-btn - The autoplay play/pause toggle button.
 *
 * @cssprop [--hx-carousel-gap=0px] - Gap between slides on the track. Defaults to 0 (flush slides).
 * @cssprop [--hx-carousel-slide-width] - Width override for each slide. Defaults to the per-page width computed from slides-per-page (100% / slides-per-page).
 * @cssprop [--hx-carousel-nav-btn-size=2.5rem] - Size of previous/next navigation buttons.
 * @cssprop [--hx-carousel-pagination-dot-size=0.5rem] - Size of pagination dots.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-touch-target-min] - Minimum touch target size.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-full] - CSS custom property.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-carousel-focus-ring-color=var(--hx-focus-ring-color)] - Color.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-color-neutral-100] - Color.
 * @cssprop [--hx-transition-base] - Transition timing.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-color-primary-600] - Color.
 */
@customElement('hx-carousel')
export class HelixCarousel extends HelixElement {
  static override styles = [helixCarouselStyles, forcedColorsInteractive];

  /**
   * Accessible label identifying this carousel to assistive technology.
   * When multiple carousels appear on the same page, each must have a unique label.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Carousel';

  /**
   * Whether the carousel wraps around from last to first slide and vice-versa.
   * @attr loop
   */
  @property({ type: Boolean, reflect: true })
  loop = false;

  /**
   * Whether the carousel auto-advances slides.
   * Automatically pauses on hover, focus, and when prefers-reduced-motion is active.
   * @attr autoplay
   */
  @property({ type: Boolean, reflect: true })
  autoplay = false;

  /**
   * Milliseconds between auto-advance transitions.
   * @attr autoplay-interval
   */
  @property({ type: Number, attribute: 'autoplay-interval' })
  autoplayInterval = 3000;

  /**
   * Number of slides visible at once.
   * @attr slides-per-page
   */
  @property({ type: Number, attribute: 'slides-per-page' })
  slidesPerPage = 1;

  /**
   * Number of slides to advance per navigation action.
   * @attr slides-per-move
   */
  @property({ type: Number, attribute: 'slides-per-move' })
  slidesPerMove = 1;

  /**
   * Scroll axis of the carousel.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Whether click-drag scrolling is enabled.
   * @attr mouse-dragging
   */
  @property({ type: Boolean, attribute: 'mouse-dragging', reflect: true })
  mouseDragging = false;

  /**
   * Accessible label for the previous slide button.
   * @attr label-prev-slide
   */
  @property({ type: String, attribute: 'label-prev-slide' })
  labelPrevSlide = 'Previous slide';

  /**
   * Accessible label for the next slide button.
   * @attr label-next-slide
   */
  @property({ type: String, attribute: 'label-next-slide' })
  labelNextSlide = 'Next slide';

  /**
   * Accessible label for the autoplay pause button.
   * @attr label-pause-autoplay
   */
  @property({ type: String, attribute: 'label-pause-autoplay' })
  labelPauseAutoplay = 'Pause autoplay';

  /**
   * Accessible label for the autoplay play button.
   * @attr label-play-autoplay
   */
  @property({ type: String, attribute: 'label-play-autoplay' })
  labelPlayAutoplay = 'Play autoplay';

  /**
   * Generates the live-region text for a slide position.
   * @param index - 1-based slide index
   * @param total - total slide count
   */
  @property({ attribute: false })
  labelSlideOf: (index: number, total: number) => string = (index, total) =>
    `Slide ${index} of ${total}`;

  /**
   * Index of the currently visible slide.
   * @internal
   */
  @state() private _currentIndex = 0;
  /**
   * Array of carousel item elements assigned to the default slot.
   * @internal
   */
  @state() private _slides: HelixCarouselItem[] = [];
  /**
   * Whether the autoplay is currently active and advancing slides.
   * @internal
   */
  @state() private _isPlaying = false;
  /**
   * Text content for the ARIA live region announcing slide changes.
   * @internal
   */
  @state() private _liveText = '';
  /** @internal */
  @state() private _livePolite = true;
  /**
   * Whether geometry-measured px navigation is active (decoupled selection vs.
   * scroll). True for a genuine horizontal "peek" (custom slide-width that does
   * not exactly fill the viewport) AND for every measurable vertical carousel
   * (whose block-axis percentage transform is unreliable). `false` keeps the
   * legacy slidesPerPage model byte-for-byte. Set by `_recomputeBounds`.
   * @internal
   */
  @state() private _measuredNav = false;
  /**
   * Per-slide leading-edge offset within the track in px (measured from real
   * rects, so variable-size slides are handled correctly). `_measuredOffsets[i]`
   * is the track translate that brings slide `i` to the viewport's leading edge.
   * Used only in measured-nav mode.
   * @internal
   */
  @state() private _measuredOffsets: number[] = [];
  /**
   * Measured maximum scroll distance in px (total content extent − viewport),
   * used only in measured-nav mode to saturate the track at the trailing edge.
   * @internal
   */
  @state() private _measuredMaxScroll = 0;
  /**
   * Measured maximum selectable index: the FIRST index whose offset reaches
   * `_measuredMaxScroll`. Indices beyond it would clamp to the same translate
   * (visually identical), so they are excluded — no duplicate no-op end states,
   * while every visually-distinct position stays reachable. Used only in
   * measured-nav mode.
   * @internal
   */
  @state() private _measuredMaxIndex = 0;
  /**
   * True (within the measured path) when the track fits entirely in the viewport
   * and cannot scroll. The carousel is then a single static page: `_maxIndex` is
   * 0, prev/next are both disabled, the translate is 0, and navigation is a no-op
   * — so it never advertises slides the track cannot reveal.
   * @internal
   */
  @state() private _singlePage = false;

  /**
   * Reference to the active autoplay interval timer, or null when stopped.
   * @internal
   */
  private _autoplayTimer: ReturnType<typeof setInterval> | null = null;
  /**
   * Observes viewport and slide-size changes so the measured navigation bound
   * stays correct for custom slide widths and the gap. Null until connected.
   * @internal
   */
  private _resizeObserver: ResizeObserver | null = null;
  /**
   * Becomes true after the first render/sync completes. Gates the
   * `hx-slide-change` emitted when a recompute clamps the active index, so the
   * event never fires during initial setup.
   * @internal
   */
  private _initialized = false;
  /**
   * Becomes true once the first `updated()` callback has run. `firstUpdated`
   * already recomputes bounds on mount, so the first `updated()` skips its
   * recompute to avoid a redundant mount-time reflow.
   * @internal
   */
  private _firstUpdateComplete = false;
  /**
   * Whether the user has requested reduced motion via the OS media preference.
   * @internal
   */
  private _reducedMotion = false;
  /**
   * MediaQueryList instance for monitoring the prefers-reduced-motion media feature.
   * @internal
   */
  private _mql: MediaQueryList | null = null;
  /**
   * Whether the carousel is currently being hovered, used to pause autoplay on hover.
   * @internal
   */
  private _isHovered = false;
  /**
   * Whether a descendant of the carousel currently has focus, used to pause autoplay on focus.
   * @internal
   */
  private _isFocused = false;

  // ─── Drag state ───
  /**
   * Pointer coordinate at the start of a mouse drag gesture.
   * @internal
   */
  private _dragStartCoord = 0;
  /**
   * Whether a mouse drag gesture is currently in progress.
   * @internal
   */
  private _isDragging = false;
  /**
   * Whether the pointer has moved beyond the drag threshold during the current drag gesture.
   * @internal
   */
  private _dragMoved = false;
  /**
   * Touch coordinate at the start of a touch swipe gesture.
   * @internal
   */
  private _touchStartCoord = 0;
  /**
   * Whether the touch has moved beyond the swipe threshold during the current touch gesture.
   * @internal
   */
  private _touchMoved = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();

    // Guard for SSR — window.matchMedia is unavailable server-side
    if (typeof window !== 'undefined') {
      this._mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      this._reducedMotion = this._mql.matches;
      this._mql.addEventListener('change', this._handleMotionChange);
    }

    // Keep the measured navigation bound fresh as the viewport or slides resize.
    // Guard for SSR / older runtimes where ResizeObserver is unavailable.
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => this._recomputeBounds());
    }

    this.addEventListener('mouseenter', this._handleMouseEnter);
    this.addEventListener('mouseleave', this._handleMouseLeave);
    this.addEventListener('focusin', this._handleFocusIn);
    this.addEventListener('focusout', this._handleFocusOut);
    this.addEventListener('keydown', this._handleKeydown);
    // Touch events are registered directly on the scroll-container in the template
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._mql?.removeEventListener('change', this._handleMotionChange);
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._stopAutoplay();
    this.removeEventListener('mouseenter', this._handleMouseEnter);
    this.removeEventListener('mouseleave', this._handleMouseLeave);
    this.removeEventListener('focusin', this._handleFocusIn);
    this.removeEventListener('focusout', this._handleFocusOut);
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override firstUpdated(): void {
    this._syncSlides();
    if (this.autoplay && !this._reducedMotion) {
      this._startAutoplay();
    }
    // Initial setup is complete; clamps from here on are real, post-init
    // corrections that should emit hx-slide-change.
    this._initialized = true;
  }

  override updated(changed: PropertyValues): void {
    // firstUpdated already ran the initial recompute in this same cycle, so the
    // first updated() skips its recompute to avoid a redundant mount reflow.
    if (!this._firstUpdateComplete) {
      this._firstUpdateComplete = true;
      return;
    }
    // slidesPerPage is baked into each item's --_carousel-computed-slide-width
    // (via _computedSlideWidthExpr) AND into the live transform step, so a runtime
    // change must re-sync the per-item width — _syncSlides re-applies it for the
    // new n and then re-derives bounds (running the index-clamp invariant), keeping
    // the slide width and the transform's step on the same slidesPerPage.
    // orientation only flips the navigation model (not the per-item width), so a
    // bounds recompute is enough. If both change, _syncSlides covers it (its
    // recompute reads the new orientation).
    if (changed.has('slidesPerPage')) {
      this._syncSlides();
    } else if (changed.has('orientation')) {
      this._recomputeBounds();
    }
  }

  // ─── Slide Management ───

  /** @internal */
  private _syncSlides(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const items = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === 'hx-carousel-item') as HelixCarouselItem[];

    const wasEmpty = this._slides.length === 0;
    this._slides = items;

    // Gap-aware computed per-page width, written to a private var so the public
    // --hx-carousel-slide-width hook can override it without losing the
    // slides-per-page default (see hx-carousel-item.styles.ts). The expression
    // references --hx-carousel-gap live, so slidesPerPage slides + (slidesPerPage
    // - 1) gaps always sum to 100% with no clipping.
    const computedSlideWidth = this._computedSlideWidthExpr();
    items.forEach((item, i) => {
      item.slideIndex = i;
      item.totalSlides = items.length;
      (item as HTMLElement).style.setProperty(
        '--_carousel-computed-slide-width',
        computedSlideWidth,
      );
    });

    // NOTE: the active index is NOT clamped here. A slot shrink / slidesPerPage
    // re-sync that drops the active slide out of range is clamped by the single
    // event-aware path in `_recomputeBounds()` below (gated by `_initialized`),
    // which both clamps to `_maxIndex` and emits `hx-slide-change` + updates the
    // live region on a real change. Clamping here would silently move the index
    // before that path runs.

    // The gap sentinel's width = (slides - 1) * --hx-carousel-gap, so observing
    // it lets a pure gap change (which resizes no laid-out box) fire the
    // ResizeObserver and reactively re-derive the bounds. Count is exposed as a
    // private custom property the sentinel's CSS multiplies by the gap.
    this.style.setProperty('--_carousel-gap-count', String(Math.max(0, items.length - 1)));

    // Observe the host (viewport resizes), each slide (slide-size changes, e.g. a
    // runtime --hx-carousel-slide-width override), the track (content-sized on the
    // block axis → vertical row-gap changes), and the gap sentinel (gap changes on
    // either axis). Then measure synchronously so the bound is correct after
    // updateComplete.
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver.observe(this);
      items.forEach((item) => this._resizeObserver?.observe(item));
      const track = this.shadowRoot?.querySelector<HTMLElement>('.track');
      if (track) this._resizeObserver.observe(track);
      const sentinel = this.shadowRoot?.querySelector<HTMLElement>('.gap-sentinel');
      if (sentinel) this._resizeObserver.observe(sentinel);
    }
    this._recomputeBounds();

    // Announce an emptiness transition once, post-init (the recompute's clamp
    // path is gated to slides > 0 so it doesn't fire here). Becoming empty clears
    // the live region and emits the "no active slide" event; repopulating
    // announces and notifies the restored slide 0. `_currentIndex` is already
    // clamped (to 0 when empty) by the recompute above.
    if (this._initialized && (items.length === 0) !== wasEmpty) {
      this._emitSlideChange(this._currentIndex);
    }
  }

  /**
   * Whether a consumer has set the public `--hx-carousel-slide-width` hook,
   * resolved from the first slide (the hook inherits from the host).
   * @internal
   */
  private _hasCustomSlideWidth(): boolean {
    const first = this._slides[0];
    if (!first) return false;
    return getComputedStyle(first).getPropertyValue('--hx-carousel-slide-width').trim() !== '';
  }

  /** Resets the measured-nav metrics, reverting to the legacy page model. @internal */
  private _resetMeasuredNav(): void {
    this._measuredNav = false;
    this._singlePage = false;
    this._measuredOffsets = [];
    this._measuredMaxScroll = 0;
    this._measuredMaxIndex = 0;
  }

  /**
   * Recomputes the measured-nav metrics and (for non-navigation callers) enforces
   * the index-clamp invariant: `_maxIndex` may have just changed (mode flip in
   * EITHER direction, slide count, or resize), so the active index is clamped back
   * into range and a render is triggered, keeping the transform, pagination dots,
   * prev/next disabled states, and ARIA in sync.
   *
   * `clampIndex` is `false` on the navigation path (`_refreshMeasuredBounds` from
   * `goTo`/`next`/`previous`/autoplay): the metrics are re-derived but the index is
   * left to the immediately-following `_navigateTo`, which emits exactly ONE
   * authoritative `hx-slide-change` for the destination — so a responsive mode
   * flip during navigation never produces a clamp event PLUS a navigation event.
   * The non-navigation callers (firstUpdated, slotchange, ResizeObserver,
   * `updated()`) clamp here and emit on a real post-init change, since they have no
   * following navigation.
   * @internal
   */
  private _recomputeBounds(clampIndex = true): void {
    this._deriveMeasuredNav();
    if (!clampIndex) return;
    const max = this._maxIndex;
    const clamped = Math.max(0, Math.min(this._currentIndex, max));
    if (clamped !== this._currentIndex) {
      this._currentIndex = clamped;
      // A post-init clamp (responsive mode flip or resize narrowing the bound)
      // is a real active-index change — notify hosts syncing thumbnails /
      // counters / analytics. Suppressed during initial setup. The empty case
      // (0 slides) is announced by `_syncSlides` (emptiness transition) instead,
      // so the index can't change to a no-slide state and emit twice.
      if (this._initialized && this._slides.length > 0) {
        this._emitSlideChange(clamped);
      }
    }
  }

  /**
   * Updates the ARIA live text and dispatches the `hx-slide-change` event for the
   * given (already-applied) active index. Single source of the event so a clamp
   * and a navigation emit identical detail.
   *
   * When there is no slide at `index` (the carousel is empty — e.g. a post-init
   * slot shrink to 0), the live region is cleared (never "Slide N of 0") and the
   * event reports a defined "no active slide" state: `{ index: -1, slide:
   * undefined }` (see the `hx-slide-change` @fires contract).
   * @internal
   */
  private _emitSlideChange(index: number): void {
    const slide = this._slides[index];
    this._liveText = slide ? this.labelSlideOf(index + 1, this._slides.length) : '';
    this.dispatchEvent(
      new CustomEvent<{ index: number; slide: HelixCarouselItem | undefined }>('hx-slide-change', {
        bubbles: true,
        composed: true,
        detail: slide ? { index, slide } : { index: -1, slide: undefined },
      }),
    );
  }

  /**
   * Derives whether measured-px navigation is active and, if so, the per-slide
   * `_measuredOffsets`/`_measuredMaxScroll`. Does NOT clamp the index (its caller
   * `_recomputeBounds` does).
   *
   * - **Horizontal** uses measured nav whenever a `--hx-carousel-slide-width` is
   *   active. The peek vs. single-page vs. legacy decision is then made from REAL
   *   rendered geometry (the track's scroll extent), not a first-slide estimate,
   *   so mixed-size slides are handled correctly. Default / gap-only horizontal
   *   keeps the legacy `calc()` percentage transform, which is correct because the
   *   track width equals the viewport.
   * - **Vertical** always uses measured nav when measurable: a transform
   *   percentage on the block axis is relative to the track's full height (≈ all
   *   slides), not one slide, so the legacy percentage over-scrolls. The measured
   *   per-slide offsets move exactly one slide per index.
   *
   * When the content does not overflow the viewport (`maxScroll <= EPS`), the
   * carousel is a single static page (no scrollable index). Size/viewport reads
   * are transform-immune (translate does not change box size), so no transition
   * settling is needed.
   * @internal
   */
  private _deriveMeasuredNav(): void {
    // Sub-pixel tolerance for the single-page (no-overflow) check.
    const EPS = 0.5;
    const slides = this._slides;
    const horizontal = this.orientation === 'horizontal';
    // Horizontal without a slide-width hook is handled correctly by the legacy
    // percentage transform — skip measurement entirely (keeps default cheap).
    if (slides.length === 0 || (horizontal && !this._hasCustomSlideWidth())) {
      this._resetMeasuredNav();
      return;
    }

    const track = this.shadowRoot?.querySelector<HTMLElement>('.track');
    const viewport = this.shadowRoot?.querySelector<HTMLElement>('[part="slide-viewport"]');
    const first = slides[0];
    if (!track || !viewport || !first) {
      this._resetMeasuredNav();
      return;
    }

    const rect = first.getBoundingClientRect();
    const viewportSize = horizontal ? viewport.clientWidth : viewport.clientHeight;
    if ((horizontal ? rect.width : rect.height) <= 0) {
      this._resetMeasuredNav();
      return;
    }

    // The peek vs. single-page vs. legacy decision is made from REAL geometry, not
    // a first-slide×slidesPerPage estimate (which is wrong for mixed-size slides).
    // The track's scroll size is the full extent of all slides + gaps; the
    // viewport is the clipping box.
    //   - maxScroll <= EPS  -> nothing overflows -> single static page.
    //   - otherwise         -> measured offset model (every slide reachable,
    //                          translate clamped to maxScroll).
    // For UNIFORM slides the offset model reduces exactly to the legacy per-page
    // translate (proven: offsets[i] = i * (slideSize + gap)), and an exact-fill
    // uniform layout yields maxScroll <= EPS -> single page — so no separate
    // first-slide exact-fill reset is needed. The default (no custom slide-width)
    // horizontal path never reaches here; it stays on the legacy model.
    const content = horizontal ? track.scrollWidth : track.scrollHeight;
    const maxScroll = Math.max(0, content - viewportSize);

    // Each slide's leading-edge offset within the track, from real rects. Both
    // rects sit under the same track transform, so the delta is transform-immune.
    // For uniform slides this reduces exactly to `i * (slideSize + gap)`.
    const offsets = slides.map((slide) => {
      const r = slide.getBoundingClientRect();
      return horizontal ? r.left - rect.left : r.top - rect.top;
    });

    this._measuredNav = true;
    this._measuredOffsets = offsets;

    // Single static page: the whole track fits in the viewport (no overflow), so
    // there is nothing to scroll. Without this, _maxIndex would be slides - 1 and
    // navigation would advance the active index to slides the track can't reveal.
    // Note this is NOT the legacy `n - slidesPerPage` fallback — that can still be
    // > 0 for narrow custom widths that all fit; the bound must be 0 here.
    if (maxScroll <= EPS) {
      this._singlePage = true;
      this._measuredMaxScroll = 0;
      this._measuredMaxIndex = 0;
      return;
    }

    // maxScroll is how far the track can translate before the trailing content
    // edge reaches the viewport's trailing edge — selecting a near-end slide
    // saturates here.
    this._singlePage = false;
    this._measuredMaxScroll = maxScroll;

    // Unified bound = max(pageBound, reachIndex):
    //   - pageBound = max(0, slides - slidesPerPage): the legacy page bound. For
    //     1-up this is n-1 (every slide reachable, as the docs promise); for 2-up
    //     exact-fill it is n-2 (excludes the truly-redundant trailing page).
    //   - reachIndex = the first index whose offset reaches maxScroll (or n-1 if
    //     none, e.g. a single slide wider than the viewport): handles mixed widths
    //     where a distinct-offset slide sits beyond the page bound.
    // The max keeps every distinct/last-slide position reachable while excluding
    // only the trailing page that would clamp to the same translate. Always <= n-1.
    const pageBound = Math.max(0, slides.length - this.slidesPerPage);
    const firstReach = offsets.findIndex((o) => o >= maxScroll - EPS);
    const reachIndex = firstReach === -1 ? slides.length - 1 : firstReach;
    this._measuredMaxIndex = Math.max(pageBound, reachIndex);
  }

  /** @internal */
  private _handleSlotChange(): void {
    this._syncSlides();
  }

  // ─── Navigation ───

  /**
   * Maximum selectable slide index.
   *
   * Single static page (measured path, no overflow) → `0`. In measured-nav mode
   * selection is decoupled from scroll: the bound is the first index whose offset
   * reaches `_measuredMaxScroll` (`_measuredMaxIndex`), so every visually-distinct
   * position is reachable without duplicate no-op end states. In the legacy
   * default model this is the slidesPerPage page bound
   * (`slides.length - slidesPerPage`).
   * @internal
   */
  private get _maxIndex(): number {
    if (this._singlePage) {
      return 0;
    }
    if (this._measuredNav) {
      return this._measuredMaxIndex;
    }
    return Math.max(0, this._slides.length - this.slidesPerPage);
  }

  /**
   * Lazily re-derives the measured-nav metrics at the moment they matter
   * (navigation).
   *
   * The measured step/maxScroll and the horizontal exact-fill verdict depend on
   * `--hx-carousel-gap` / the slide width, which can change at runtime without
   * resizing any observed box (theme toggle, media query, host class) — so the
   * `ResizeObserver` never fires. Re-deriving here flips `_measuredNav` in BOTH
   * directions (legacy ↔ measured) and refreshes the px metrics.
   *
   * Gated to stay cheap for pure-default horizontal carousels: vertical always
   * re-derives (its main axis is height, which the gap affects), horizontal only
   * when a `--hx-carousel-slide-width` is present. A pure-default horizontal
   * carousel pays a single property read and no measurement. Called once per
   * navigation path (never doubled).
   * @internal
   */
  private _refreshMeasuredBounds(): void {
    if (this.orientation !== 'horizontal' || this._hasCustomSlideWidth()) {
      // Derive only — the following _navigateTo applies + emits the single event.
      this._recomputeBounds(false);
    }
  }

  goTo(index: number): void {
    if (this._slides.length === 0) return;
    this._refreshMeasuredBounds();
    this._navigateTo(index);
  }

  /**
   * Applies a slide selection: updates the live region and dispatches
   * `hx-slide-change`. Assumes bounds are already fresh — callers run
   * `_refreshMeasuredBounds()` first, so this is not re-measured here.
   *
   * `wrap` distinguishes RELATIVE navigation (`next`/`previous`/autoplay advance),
   * which wraps over the reachable range `[0, _maxIndex]` in loop mode, from
   * ABSOLUTE navigation (`goTo`/`Home`/`End`/pagination dots), which always CLAMPS
   * to `[0, _maxIndex]` — even in loop mode, so e.g. `End` lands on the last
   * reachable index instead of wrapping `slides.length - 1` back to 0.
   * @internal
   */
  private _navigateTo(index: number, wrap = false): void {
    if (this._slides.length === 0) return;

    let next: number;
    if (this._singlePage) {
      // A single static page has nothing to scroll — collapse every target to 0.
      next = 0;
    } else if (this.loop && wrap) {
      // Relative loop wrap over the REACHABLE range, not the raw slide count: in
      // measured-nav mode indices beyond `_maxIndex` clamp to the same translate
      // (duplicate end states), so wrapping uses `_maxIndex + 1` so `next` from
      // `_maxIndex` → 0 and `previous` from 0 → `_maxIndex`. Default mode wraps
      // over the full slide count (unchanged).
      const wrapCount = this._measuredNav ? this._maxIndex + 1 : this._slides.length;
      next = ((index % wrapCount) + wrapCount) % wrapCount;
    } else {
      // Absolute clamp (goTo/Home/End/dots, and non-loop relative moves).
      next = Math.max(0, Math.min(index, this._maxIndex));
    }

    if (next === this._currentIndex) return;

    this._currentIndex = next;
    this._emitSlideChange(next);
  }

  next(): void {
    // Refresh BEFORE the guard so the legacy-block decision uses the current
    // _measuredNav verdict (a runtime gap change may have flipped an exact-fill
    // carousel into a genuine peek, or this may be a measured vertical carousel).
    this._refreshMeasuredBounds();
    const nextIndex = this._currentIndex + this.slidesPerMove;
    // Legacy/default mode blocks a move that would pass the page bound. In
    // measured-nav mode _navigateTo() clamps to the last slide instead, so the
    // final, possibly partial, slidesPerMove step can always land on n - 1.
    if (!this._measuredNav && !this.loop && nextIndex > this._maxIndex) {
      return;
    }
    this._livePolite = true;
    this._navigateTo(nextIndex, true); // relative -> loop-wraps over [0, _maxIndex]
  }

  previous(): void {
    this._refreshMeasuredBounds();
    const prevIndex = this._currentIndex - this.slidesPerMove;
    if (!this._measuredNav && !this.loop && prevIndex < 0) {
      return;
    }
    this._livePolite = true;
    this._navigateTo(prevIndex, true); // relative -> loop-wraps over [0, _maxIndex]
  }

  // ─── Autoplay ───

  /**
   * Callback invoked on each autoplay interval tick to advance to the next slide.
   * @internal
   */
  private _autoplayTick = (): void => {
    this._livePolite = false;
    // Refresh bounds BEFORE deciding whether to wrap — a runtime gap/width change
    // may have raised _maxIndex (legacy -> peek), making more slides reachable, so
    // a non-looping carousel at the old bound advances instead of wrapping to 0.
    // _navigateTo (not goTo) avoids a second redundant recompute this tick.
    this._refreshMeasuredBounds();
    if (this.loop || this._currentIndex < this._maxIndex) {
      // Relative advance -> loop-wraps over [0, _maxIndex] (clamps when not looping).
      this._navigateTo(this._currentIndex + this.slidesPerMove, true);
    } else {
      this._navigateTo(0);
    }
  };

  /** @internal */
  private _startAutoplay(): void {
    if (this._autoplayTimer !== null) return;
    this._isPlaying = true;
    this._autoplayTimer = setInterval(this._autoplayTick, this.autoplayInterval);
  }

  /** @internal */
  private _stopAutoplay(): void {
    if (this._autoplayTimer !== null) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
    this._isPlaying = false;
  }

  /** @internal */
  private _toggleAutoplay(): void {
    if (this._isPlaying) {
      this._stopAutoplay();
    } else if (!this._reducedMotion) {
      this._startAutoplay();
    }
  }

  /** @internal */
  private _pauseAutoplay(): void {
    if (!this._isPlaying || this._autoplayTimer === null) return;
    clearInterval(this._autoplayTimer);
    this._autoplayTimer = null;
  }

  /** @internal */
  private _resumeAutoplay(): void {
    if (!this.autoplay || !this._isPlaying || this._reducedMotion) return;
    if (this._autoplayTimer !== null) return;
    this._autoplayTimer = setInterval(this._autoplayTick, this.autoplayInterval);
  }

  // ─── Event Handlers ───

  /**
   * Handles changes to the prefers-reduced-motion media query, stopping or resuming autoplay accordingly.
   * @internal
   */
  private _handleMotionChange = (e: MediaQueryListEvent): void => {
    this._reducedMotion = e.matches;
    if (this._reducedMotion) {
      this._stopAutoplay();
    } else if (this.autoplay && !this._isHovered && !this._isFocused) {
      this._startAutoplay();
    }
  };

  /**
   * Handles the mouseenter event to pause autoplay while the user hovers over the carousel.
   * @internal
   */
  private _handleMouseEnter = (): void => {
    this._isHovered = true;
    this._pauseAutoplay();
  };

  /**
   * Handles the mouseleave event to resume autoplay when the user stops hovering.
   * @internal
   */
  private _handleMouseLeave = (): void => {
    this._isHovered = false;
    if (!this._isFocused) {
      this._resumeAutoplay();
    }
  };

  /**
   * Handles the focusin event to pause autoplay while a descendant has focus.
   * @internal
   */
  private _handleFocusIn = (): void => {
    this._isFocused = true;
    this._pauseAutoplay();
  };

  /**
   * Handles the focusout event to resume autoplay when focus leaves the carousel.
   * @internal
   */
  private _handleFocusOut = (): void => {
    this._isFocused = false;
    if (!this._isHovered) {
      this._resumeAutoplay();
    }
  };

  /**
   * Handles keyboard navigation to move between slides using arrow, Home, and End keys.
   * @internal
   */
  private _handleKeydown = (e: KeyboardEvent): void => {
    if (this.orientation === 'horizontal') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.previous();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    } else {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.previous();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.next();
      }
    }

    if (e.key === 'Home') {
      e.preventDefault();
      this.goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.goTo(this._slides.length - 1);
    }
  };

  // ─── Drag Handlers ───

  /** @internal */
  private _handleDragStart(e: MouseEvent): void {
    if (!this.mouseDragging) return;
    this._isDragging = true;
    this._dragMoved = false;
    this._dragStartCoord = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    e.preventDefault();
  }

  /** @internal */
  private _handleDragMove(e: MouseEvent): void {
    if (!this._isDragging) return;
    const current = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    const diff = current - this._dragStartCoord;
    if (Math.abs(diff) > 5) {
      this._dragMoved = true;
    }
  }

  /** @internal */
  private _handleDragEnd(e: MouseEvent): void {
    if (!this._isDragging) return;
    const current = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    const diff = current - this._dragStartCoord;
    const threshold = 50;
    if (this._dragMoved) {
      if (diff > threshold) {
        this.previous();
      } else if (diff < -threshold) {
        this.next();
      }
    }
    this._isDragging = false;
    this._dragMoved = false;
    (e.currentTarget as HTMLElement).style.cursor = '';
  }

  // ─── Touch Handlers ───

  /** @internal */
  private _handleTouchStart(e: TouchEvent): void {
    if (!this.mouseDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    this._isDragging = true;
    this._touchMoved = false;
    this._touchStartCoord = this.orientation === 'horizontal' ? touch.clientX : touch.clientY;
  }

  /** @internal */
  private _handleTouchMove(e: TouchEvent): void {
    if (!this._isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const current = this.orientation === 'horizontal' ? touch.clientX : touch.clientY;
    const diff = current - this._touchStartCoord;
    if (Math.abs(diff) > 5) {
      this._touchMoved = true;
    }
  }

  /** @internal */
  private _handleTouchEnd(e: TouchEvent): void {
    if (!this._isDragging) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const current = this.orientation === 'horizontal' ? touch.clientX : touch.clientY;
    const diff = current - this._touchStartCoord;
    const threshold = 50;
    if (this._touchMoved) {
      if (diff > threshold) {
        this.previous();
      } else if (diff < -threshold) {
        this.next();
      }
    }
    this._isDragging = false;
    this._touchMoved = false;
  }

  /** @internal */
  private _goToManual(index: number): void {
    this._livePolite = true;
    this.goTo(index);
  }

  // ─── Computed ───

  /**
   * CSS expression for the gap-aware per-page slide size.
   *
   * `slidesPerPage` slides plus `slidesPerPage - 1` gaps fill 100% exactly, so
   * adding a gap never clips the trailing slide. At gap `0px` this resolves to
   * `100% / slidesPerPage`, byte-identical to the legacy flush layout.
   * @internal
   */
  private _computedSlideWidthExpr(): string {
    const n = this.slidesPerPage;
    return `calc((100% - ${n - 1} * var(--hx-carousel-gap, 0px)) / ${n})`;
  }

  /**
   * CSS transform value applied to the slide track to scroll to the current index.
   *
   * Measured-nav model (genuine horizontal peek, or any measurable vertical
   * carousel): the translate is the active slide's measured leading-edge offset
   * (`_measuredOffsets[currentIndex]`, correct for variable-size slides) clamped
   * to `_measuredMaxScroll` (px) on the active axis. A near-end slide saturates
   * the track at the trailing edge — slides crowd into view with no blank space —
   * while the active index is still that slide.
   *
   * Legacy model (horizontal default / gap-only / exact-fill): a live `calc()` of
   * `currentIndex * (effective slide width + gap)`. The width and gap resolve as
   * custom properties against the same track box that sizes the slides, so each
   * step lands the active slide flush with the viewport's leading edge without
   * measuring; at gap `0px` with no override this is `currentIndex * (100% /
   * slidesPerPage)` — identical to the legacy value. The vertical `calc()` branch
   * is an unmeasurable (e.g. SSR) fallback only; a percentage on the block axis is
   * relative to the track's full height, so a measured vertical carousel uses the
   * px branch above instead.
   * @internal
   */
  private get _trackTransform(): string {
    if (this._measuredNav) {
      const raw = this._measuredOffsets[this._currentIndex] ?? 0;
      const offset = Math.min(raw, this._measuredMaxScroll);
      return this.orientation === 'horizontal'
        ? `translateX(-${offset}px)`
        : `translateY(-${offset}px)`;
    }

    const i = this._currentIndex;
    const gap = 'var(--hx-carousel-gap, 0px)';
    if (this.orientation === 'horizontal') {
      // The consumer's --hx-carousel-slide-width override wins over the
      // gap-aware computed width, mirroring the slide's resolved width.
      const slide = `var(--hx-carousel-slide-width, ${this._computedSlideWidthExpr()})`;
      return `translateX(calc(-1 * ${i} * (${slide} + ${gap})))`;
    }
    // Vertical fallback (unmeasurable only): the block-axis percentage is
    // unreliable, but it is the best we can do without layout measurement.
    return `translateY(calc(-1 * ${i} * (${this._computedSlideWidthExpr()} + ${gap})))`;
  }

  /**
   * Whether the previous navigation button should be enabled. A single static
   * page (no overflow) disables both directions regardless of `loop`.
   * @internal
   */
  private get _canGoPrev(): boolean {
    return !this._singlePage && (this.loop || this._currentIndex > 0);
  }

  /**
   * Whether the next navigation button should be enabled. A single static page
   * (no overflow) disables both directions regardless of `loop`.
   * @internal
   */
  private get _canGoNext(): boolean {
    return !this._singlePage && (this.loop || this._currentIndex < this._maxIndex);
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderNavigation() {
    return html`
      <div class="navigation" part="navigation">
        <slot name="previous-button">
          <button
            class="nav-btn"
            part="prev-button"
            type="button"
            aria-label=${this.labelPrevSlide}
            ?disabled=${!this._canGoPrev}
            @click=${() => this.previous()}
          >
            ${this._renderPrevIcon()}
          </button>
        </slot>
        ${this.autoplay
          ? html`
              <button
                class="play-pause-btn"
                part="play-pause-btn"
                type="button"
                aria-label=${this._isPlaying ? this.labelPauseAutoplay : this.labelPlayAutoplay}
                @click=${() => this._toggleAutoplay()}
              >
                ${this._isPlaying ? this._renderPauseIcon() : this._renderPlayIcon()}
              </button>
            `
          : nothing}
        <slot name="next-button">
          <button
            class="nav-btn"
            part="next-button"
            type="button"
            aria-label=${this.labelNextSlide}
            ?disabled=${!this._canGoNext}
            @click=${() => this.next()}
          >
            ${this._renderNextIcon()}
          </button>
        </slot>
      </div>
    `;
  }

  /** @internal */
  private _renderPagination() {
    // One dot per REACHABLE index. In measured-nav mode the reachable bound
    // (`_maxIndex`) can stop before the last slide (trailing indices clamp to the
    // same translate), so only `_maxIndex + 1` dots are rendered — no unreachable
    // trailing dot. Default mode keeps one dot per slide.
    const count = this._measuredNav ? this._maxIndex + 1 : this._slides.length;
    // A single static page (non-overflowing track) has nothing to page to — omit
    // the dots so pagination never advertises slides the track can't reveal.
    if (count <= 1 || this._singlePage) return nothing;
    const dots = Array.from({ length: count }, (_, i) => i);
    // The "of N" total uses the REAL slide count (not the dot count), so the dot
    // label agrees with the live-region announcement when you land on that index
    // (e.g. the last reachable dot in a 6-slide exact-fill layout reads
    // "Slide 5 of 6", matching the live region — not "Slide 5 of 5").
    const total = this._slides.length;
    return html`
      <div class="controls">
        <div class="pagination" part="pagination">
          ${dots.map(
            (i) => html`
              <button
                class=${classMap({
                  'pagination-item': true,
                  'is-active': i === this._currentIndex,
                })}
                part="pagination-item"
                type="button"
                aria-label=${this.labelSlideOf(i + 1, total)}
                aria-current=${i === this._currentIndex ? 'true' : nothing}
                @click=${() => this._goToManual(i)}
              >
                <span class="pagination-dot"></span>
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  /** @internal */
  private _renderPrevIcon() {
    return this.orientation === 'horizontal' ? _svgChevronLeft : _svgChevronUp;
  }

  /** @internal */
  private _renderNextIcon() {
    return this.orientation === 'horizontal' ? _svgChevronRight : _svgChevronDown;
  }

  /** @internal */
  private _renderPlayIcon() {
    return _svgPlay;
  }

  /** @internal */
  private _renderPauseIcon() {
    return _svgPause;
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        class="base"
        part="base"
        role="region"
        aria-label=${this.label}
        aria-roledescription="carousel"
      >
        <div
          class="live-region"
          role="status"
          aria-live=${this._livePolite ? 'polite' : 'off'}
          aria-atomic="true"
        >
          ${this._liveText}
        </div>
        ${this._renderNavigation()}
        <div class="scroll-container-wrapper">
          <div
            class="slide-viewport"
            part="slide-viewport"
            aria-live="polite"
            aria-atomic="false"
            @mousedown=${this._handleDragStart}
            @mousemove=${this._handleDragMove}
            @mouseup=${this._handleDragEnd}
            @mouseleave=${this._handleDragEnd}
            @touchstart=${this._handleTouchStart}
            @touchmove=${this._handleTouchMove}
            @touchend=${this._handleTouchEnd}
          >
            <div class="track" style="transform: ${this._trackTransform};">
              <slot @slotchange=${this._handleSlotChange}></slot>
            </div>
          </div>
          <div class="gap-sentinel" aria-hidden="true"></div>
        </div>
        ${this._renderPagination()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-carousel': HelixCarousel;
  }
}
