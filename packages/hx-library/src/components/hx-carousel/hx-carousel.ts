import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixCarouselStyles } from './hx-carousel.styles.js';
import type { HelixCarouselItem } from './hx-carousel-item.js';

// ─── Module-level SVG icon constants ───

const _svgChevronLeft = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <polyline points="15 18 9 12 15 6"></polyline>
</svg>`;

const _svgChevronUp = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <polyline points="18 15 12 9 6 15"></polyline>
</svg>`;

const _svgChevronRight = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <polyline points="9 18 15 12 9 6"></polyline>
</svg>`;

const _svgChevronDown = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <polyline points="6 9 12 15 18 9"></polyline>
</svg>`;

const _svgPlay = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
  width="1em"
  height="1em"
>
  <polygon points="5 3 19 12 5 21 5 3"></polygon>
</svg>`;

const _svgPause = html`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="currentColor"
  aria-hidden="true"
  width="1em"
  height="1em"
>
  <rect x="6" y="4" width="4" height="16"></rect>
  <rect x="14" y="4" width="4" height="16"></rect>
</svg>`;

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
 * @csspart prev-btn - The previous navigation button.
 * @csspart next-btn - The next navigation button.
 * @csspart play-pause-btn - The autoplay play/pause toggle button.
 *
 * @cssprop [--hx-carousel-gap=0px] - Gap between slides.
 * @cssprop [--hx-carousel-slide-width=100%] - Width override for each slide.
 * @cssprop [--hx-carousel-nav-btn-size=2.5rem] - Size of previous/next navigation buttons.
 * @cssprop [--hx-carousel-pagination-dot-size=0.5rem] - Size of pagination dots.
 */
@customElement('hx-carousel')
export class HelixCarousel extends LitElement {
  static override styles = [tokenStyles, helixCarouselStyles];

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
  @state() private _livePolite = true;

  /**
   * Reference to the active autoplay interval timer, or null when stopped.
   * @internal
   */
  private _autoplayTimer: ReturnType<typeof setInterval> | null = null;
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
    this._mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reducedMotion = this._mql.matches;
    this._mql.addEventListener('change', this._handleMotionChange);

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

  private _syncSlides(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const items = slot
      .assignedElements({ flatten: true })
      .filter((el) => el.tagName.toLowerCase() === 'hx-carousel-item') as HelixCarouselItem[];

    this._slides = items;

    // Update aria labels on each item
    items.forEach((item, i) => {
      item.slideIndex = i;
      item.totalSlides = items.length;
      const slideWidth = `${100 / this.slidesPerPage}%`;
      (item as HTMLElement).style.setProperty('--_hx-carousel-slide-width', slideWidth);
    });

    // Clamp currentIndex if slides changed
    if (this._currentIndex >= items.length) {
      this._currentIndex = Math.max(0, items.length - 1);
    }
  }

  private _handleSlotChange(): void {
    this._syncSlides();
  }

  // ─── Navigation ───

  /**
   * Maximum valid slide index accounting for the number of slides visible per page.
   * @internal
   */
  private get _maxIndex(): number {
    return Math.max(0, this._slides.length - this.slidesPerPage);
  }

  goTo(index: number): void {
    if (this._slides.length === 0) return;

    let next = index;
    if (this.loop) {
      next = ((index % this._slides.length) + this._slides.length) % this._slides.length;
    } else {
      next = Math.max(0, Math.min(index, this._maxIndex));
    }

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
    if (!this.loop && nextIndex > this._maxIndex) {
      return;
    }
    this._livePolite = true;
    this.goTo(nextIndex);
  }

  previous(): void {
    const prevIndex = this._currentIndex - this.slidesPerMove;
    if (!this.loop && prevIndex < 0) {
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

  private _startAutoplay(): void {
    if (this._autoplayTimer !== null) return;
    this._isPlaying = true;
    this._autoplayTimer = setInterval(this._autoplayTick, this.autoplayInterval);
  }

  private _stopAutoplay(): void {
    if (this._autoplayTimer !== null) {
      clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
    this._isPlaying = false;
  }

  private _toggleAutoplay(): void {
    if (this._isPlaying) {
      this._stopAutoplay();
    } else if (!this._reducedMotion) {
      this._startAutoplay();
    }
  }

  private _pauseAutoplay(): void {
    if (!this._isPlaying || this._autoplayTimer === null) return;
    clearInterval(this._autoplayTimer);
    this._autoplayTimer = null;
  }

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

  private _handleDragStart(e: MouseEvent): void {
    if (!this.mouseDragging) return;
    this._isDragging = true;
    this._dragMoved = false;
    this._dragStartCoord = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    e.preventDefault();
  }

  private _handleDragMove(e: MouseEvent): void {
    if (!this._isDragging) return;
    const current = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    const diff = current - this._dragStartCoord;
    if (Math.abs(diff) > 5) {
      this._dragMoved = true;
    }
  }

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

  private _handleTouchStart(e: TouchEvent): void {
    if (!this.mouseDragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    this._isDragging = true;
    this._touchMoved = false;
    this._touchStartCoord = this.orientation === 'horizontal' ? touch.clientX : touch.clientY;
  }

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

  private _goToManual(index: number): void {
    this._livePolite = true;
    this.goTo(index);
  }

  // ─── Computed ───

  /**
   * CSS transform value applied to the slide track to scroll to the current index.
   * @internal
   */
  private get _trackTransform(): string {
    const slideSize = 100 / this.slidesPerPage;
    const offset = this._currentIndex * slideSize;
    return this.orientation === 'horizontal'
      ? `translateX(-${offset}%)`
      : `translateY(-${offset}%)`;
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

  private _renderNavigation() {
    return html`
      <div class="navigation" part="navigation">
        <slot name="previous-button">
          <button
            class="nav-btn"
            part="prev-btn"
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
            part="next-btn"
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

  private _renderPrevIcon() {
    return this.orientation === 'horizontal' ? _svgChevronLeft : _svgChevronUp;
  }

  private _renderNextIcon() {
    return this.orientation === 'horizontal' ? _svgChevronRight : _svgChevronDown;
  }

  private _renderPlayIcon() {
    return _svgPlay;
  }

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
