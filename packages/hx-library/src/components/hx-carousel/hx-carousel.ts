import { html, nothing } from 'lit';
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
 * @fires {CustomEvent<{index: number, slide: HelixCarouselItem}>} hx-slide-change - Dispatched when the active slide changes.
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
   * Whether a custom `--hx-carousel-slide-width` is active. Gates the peek model
   * (decoupled selection vs. scroll); `false` keeps the legacy default model
   * byte-for-byte. Set by `_recomputeBounds`.
   * @internal
   */
  @state() private _customWidthActive = false;
  /**
   * Measured per-slide outer extent in px (slide size + gap), used only in
   * custom-width mode for the px-clamped track translate.
   * @internal
   */
  @state() private _measuredStep = 0;
  /**
   * Measured maximum scroll distance in px (total content extent − viewport),
   * used only in custom-width mode to saturate the track at the trailing edge.
   * @internal
   */
  @state() private _measuredMaxScroll = 0;

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
  }

  // ─── Slide Management ───

  /** @internal */
  private _syncSlides(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const items = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === 'hx-carousel-item') as HelixCarouselItem[];

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
        '--_hx-carousel-computed-slide-width',
        computedSlideWidth,
      );
    });

    // Clamp currentIndex if slides changed
    if (this._currentIndex >= items.length) {
      this._currentIndex = Math.max(0, items.length - 1);
    }

    // Observe the host (catches viewport resizes) and each slide (catches
    // slide-size changes, e.g. a runtime --hx-carousel-slide-width override),
    // then measure synchronously so the bound is correct after updateComplete.
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver.observe(this);
      items.forEach((item) => this._resizeObserver?.observe(item));
    }
    this._recomputeBounds();
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

  /**
   * Recomputes the geometry-measured scroll metrics used by the custom-width
   * "peek" model (decoupled slide selection vs. track scroll).
   *
   * When no custom `--hx-carousel-slide-width` is active, the metrics are reset
   * and `_customWidthActive` is `false`, so `_maxIndex`, the transform, and the
   * disabled states all fall back to the legacy slidesPerPage model byte-for-byte
   * (the gap-aware computed width makes `slidesPerPage` slides + their gaps fill
   * the viewport exactly, so the slidesPerPage-based bound stays exact for any
   * gap). When a custom width is active, every slide stays selectable while the
   * track translate is clamped to `_measuredMaxScroll`, so a near-end slide
   * saturates the viewport at the trailing edge with no blank space.
   *
   * Slide-size and viewport reads are transform-immune (translate does not change
   * box size), so no transition settling is required here.
   * @internal
   */
  private _recomputeBounds(): void {
    const slides = this._slides;
    if (slides.length === 0 || !this._hasCustomSlideWidth()) {
      this._customWidthActive = false;
      this._measuredStep = 0;
      this._measuredMaxScroll = 0;
      return;
    }

    const track = this.shadowRoot?.querySelector<HTMLElement>('.track');
    const viewport = this.shadowRoot?.querySelector<HTMLElement>('[part="slide-viewport"]');
    const first = slides[0];
    if (!track || !viewport || !first) {
      this._customWidthActive = false;
      this._measuredStep = 0;
      this._measuredMaxScroll = 0;
      return;
    }

    const horizontal = this.orientation === 'horizontal';
    const rect = first.getBoundingClientRect();
    const slideSize = horizontal ? rect.width : rect.height;
    const cs = getComputedStyle(track);
    const gap = parseFloat(horizontal ? cs.columnGap : cs.rowGap) || 0;
    const viewportSize = horizontal ? viewport.clientWidth : viewport.clientHeight;
    const step = slideSize + gap;
    if (step <= 0) {
      this._customWidthActive = false;
      this._measuredStep = 0;
      this._measuredMaxScroll = 0;
      return;
    }

    // Total extent of equal-size slides plus inter-slide gaps. maxScroll is how
    // far the track can translate before the trailing content edge reaches the
    // viewport's trailing edge — selecting any later slide saturates here.
    const content = slides.length * slideSize + (slides.length - 1) * gap;
    this._customWidthActive = true;
    this._measuredStep = step;
    this._measuredMaxScroll = Math.max(0, content - viewportSize);
  }

  /** @internal */
  private _handleSlotChange(): void {
    this._syncSlides();
  }

  // ─── Navigation ───

  /**
   * Maximum selectable slide index.
   *
   * In the legacy default model this is the slidesPerPage page bound
   * (`slides.length - slidesPerPage`). In custom-width mode selection is
   * decoupled from scroll: every slide is reachable, so the bound is the last
   * index (`slides.length - 1`) and the track translate is clamped separately
   * (see `_trackTransform` / `_measuredMaxScroll`).
   * @internal
   */
  private get _maxIndex(): number {
    if (this._customWidthActive) {
      return Math.max(0, this._slides.length - 1);
    }
    return Math.max(0, this._slides.length - this.slidesPerPage);
  }

  goTo(index: number): void {
    if (this._slides.length === 0) return;

    // In custom-width mode the measured step/maxScroll depend on
    // --hx-carousel-gap and the slide width, which can change at runtime without
    // resizing any observed box (theme toggle, media query, host class) — so the
    // ResizeObserver never fires. Navigation is the moment these matter, so
    // refresh them lazily here. Reads are transform-immune (no settle needed) and
    // navigation is user-triggered, so the forced reflow is cheap. Gated on
    // _customWidthActive so the default model adds no measurement and stays
    // byte-for-byte legacy. (Self-corrects out of custom mode too: if the width
    // hook was removed, _recomputeBounds flips _customWidthActive back to false.)
    if (this._customWidthActive) {
      this._recomputeBounds();
    }

    const next = this.loop
      ? ((index % this._slides.length) + this._slides.length) % this._slides.length
      : Math.max(0, Math.min(index, this._maxIndex));

    if (next === this._currentIndex) return;

    this._currentIndex = next;
    this._liveText = this.labelSlideOf(next + 1, this._slides.length);
    const slide = this._slides[next];
    if (!slide) return;
    this.dispatchEvent(
      new CustomEvent<{ index: number; slide: HelixCarouselItem | undefined }>('hx-slide-change', {
        bubbles: true,
        composed: true,
        detail: { index: next, slide },
      }),
    );
  }

  next(): void {
    const nextIndex = this._currentIndex + this.slidesPerMove;
    // Legacy/default mode blocks a move that would pass the page bound. In
    // custom-width mode goTo() clamps to the last slide instead, so the final,
    // possibly partial, slidesPerMove step can always land on slides.length - 1.
    if (!this._customWidthActive && !this.loop && nextIndex > this._maxIndex) {
      return;
    }
    this._livePolite = true;
    this.goTo(nextIndex);
  }

  previous(): void {
    const prevIndex = this._currentIndex - this.slidesPerMove;
    if (!this._customWidthActive && !this.loop && prevIndex < 0) {
      return;
    }
    this._livePolite = true;
    this.goTo(prevIndex);
  }

  // ─── Autoplay ───

  /**
   * Callback invoked on each autoplay interval tick to advance to the next slide.
   * @internal
   */
  private _autoplayTick = (): void => {
    this._livePolite = false;
    if (this.loop) {
      this.goTo(this._currentIndex + this.slidesPerMove);
    } else if (this._currentIndex < this._maxIndex) {
      this.goTo(this._currentIndex + this.slidesPerMove);
    } else {
      this.goTo(0);
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
   * Default model: a live `calc()` of `currentIndex * (effective slide width +
   * gap)`. Both the gap and the width resolve as custom properties against the
   * same track box that sizes the slides, so each step lands the active slide
   * flush with the viewport's leading edge without measuring geometry. At gap
   * `0px` with no width override this reduces to `currentIndex * (100% /
   * slidesPerPage)` — identical to the legacy value.
   *
   * Custom-width "peek" model: selection is decoupled from scroll, so the
   * translate is the measured `currentIndex * step` clamped to `_measuredMaxScroll`
   * (px). A near-end slide saturates the track at the trailing edge — multiple
   * slides crowd into view with no blank space — while the active index is still
   * that slide.
   * @internal
   */
  private get _trackTransform(): string {
    if (this._customWidthActive) {
      const offset = Math.min(this._currentIndex * this._measuredStep, this._measuredMaxScroll);
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
    // Vertical scrolls along the block axis; --hx-carousel-slide-width is a
    // cross-axis (width) hook and does not participate in the vertical step.
    return `translateY(calc(-1 * ${i} * (${this._computedSlideWidthExpr()} + ${gap})))`;
  }

  /**
   * Whether the previous navigation button should be enabled.
   * @internal
   */
  private get _canGoPrev(): boolean {
    return this.loop || this._currentIndex > 0;
  }

  /**
   * Whether the next navigation button should be enabled.
   * @internal
   */
  private get _canGoNext(): boolean {
    return this.loop || this._currentIndex < this._maxIndex;
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
    const count = this._slides.length;
    if (count <= 1) return nothing;
    const dots = Array.from({ length: count }, (_, i) => i);
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
                aria-label=${this.labelSlideOf(i + 1, count)}
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
