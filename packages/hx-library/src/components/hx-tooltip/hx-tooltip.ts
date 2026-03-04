import { LitElement, html, nothing } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTooltipStyles } from './hx-tooltip.styles.js';

/** The resolved placement after smart flip logic is applied. */
type ResolvedPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * A tooltip overlay that reveals contextual information when the user hovers
 * or focuses its trigger element. Positions itself relative to the trigger
 * using `getBoundingClientRect()` and flips automatically when it would
 * overflow the viewport.
 *
 * @summary Contextual tooltip shown on hover/focus of a trigger element.
 *
 * @tag hx-tooltip
 *
 * @slot - The trigger element (button, icon, text, etc.) that activates the tooltip.
 * @slot content - The tooltip content (text or rich HTML).
 *
 * @fires {CustomEvent} hx-show - Dispatched immediately after the tooltip becomes visible.
 * @fires {CustomEvent} hx-hide - Dispatched immediately after the tooltip is hidden.
 *
 * @csspart tooltip - The tooltip panel overlay.
 * @csspart arrow  - The triangular directional arrow on the tooltip panel.
 *
 * @cssprop [--hx-tooltip-bg=var(--hx-color-neutral-900,#0f172a)] - Background color of the tooltip panel.
 * @cssprop [--hx-tooltip-color=var(--hx-color-neutral-0,#ffffff)] - Text color of the tooltip panel.
 * @cssprop [--hx-tooltip-font-size=var(--hx-font-size-sm,0.875rem)] - Font size of the tooltip text.
 * @cssprop [--hx-tooltip-padding=var(--hx-space-2,0.5rem) var(--hx-space-3,0.75rem)] - Padding inside the tooltip panel.
 * @cssprop [--hx-tooltip-border-radius=var(--hx-border-radius-md,0.375rem)] - Border radius of the tooltip panel.
 * @cssprop [--hx-tooltip-max-width=20rem] - Maximum width of the tooltip panel.
 * @cssprop [--hx-z-tooltip=9999] - z-index stack level for the tooltip.
 */
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  static override styles = [tokenStyles, helixTooltipStyles];

  // ─── Public Properties ───────────────────────────────────────────────────

  /**
   * Preferred placement of the tooltip relative to the trigger.
   * The tooltip will flip to the opposite side when viewport space is
   * insufficient for the requested placement.
   *
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

  /**
   * Delay in milliseconds before the tooltip appears after mouseenter or focus.
   *
   * @attr delay
   */
  @property({ type: Number })
  delay = 300;

  /**
   * Delay in milliseconds before the tooltip disappears after mouseleave or blur.
   *
   * @attr hide-delay
   */
  @property({ type: Number, attribute: 'hide-delay' })
  hideDelay = 100;

  /**
   * When true, the tooltip will not appear regardless of user interaction.
   *
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Controls tooltip visibility programmatically.
   * Setting this to `true` shows the tooltip; `false` hides it.
   * This mirrors the internal open state and is reflected as an attribute.
   *
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._isOpen;
  }
  set open(value: boolean) {
    if (value === this._isOpen) return;
    if (value) {
      this._show();
    } else {
      this._hide();
    }
  }

  // ─── Internal State ───────────────────────────────────────────────────────

  @state() private _isOpen = false;
  @state() private _resolvedPlacement: ResolvedPlacement = 'top';

  /** Inline position styles applied to the tooltip when visible. */
  @state() private _tooltipTop = '0px';
  @state() private _tooltipLeft = '0px';

  @query('.tooltip') private _tooltipEl!: HTMLElement;

  /** Unique ID for ARIA linkage. */
  private readonly _tooltipId = `hx-tooltip-${Math.random().toString(36).slice(2, 9)}`;

  /** Timer handles for show/hide delays. */
  private _showTimer: ReturnType<typeof setTimeout> | null = null;
  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('mouseenter', this._handleMouseEnter);
    this.addEventListener('mouseleave', this._handleMouseLeave);
    this.addEventListener('focusin', this._handleFocusIn);
    this.addEventListener('focusout', this._handleFocusOut);
    this.addEventListener('keydown', this._handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mouseenter', this._handleMouseEnter);
    this.removeEventListener('mouseleave', this._handleMouseLeave);
    this.removeEventListener('focusin', this._handleFocusIn);
    this.removeEventListener('focusout', this._handleFocusOut);
    this.removeEventListener('keydown', this._handleKeyDown);
    this._clearTimers();
  }

  // ─── Show / Hide Logic ────────────────────────────────────────────────────

  private _show(): void {
    if (this.disabled) return;
    this._clearTimers();
    this._resolvedPlacement = this._computePlacement();
    this._positionTooltip();
    this._isOpen = true;
    this.requestUpdate('open');
    this.dispatchEvent(
      new CustomEvent('hx-show', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _hide(): void {
    this._clearTimers();
    this._isOpen = false;
    this.requestUpdate('open');
    this.dispatchEvent(
      new CustomEvent('hx-hide', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _scheduleShow(): void {
    if (this.disabled) return;
    this._clearHideTimer();
    this._showTimer = setTimeout(() => {
      this._show();
    }, this.delay);
  }

  private _scheduleHide(): void {
    this._clearShowTimer();
    this._hideTimer = setTimeout(() => {
      this._hide();
    }, this.hideDelay);
  }

  private _clearShowTimer(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
  }

  private _clearHideTimer(): void {
    if (this._hideTimer !== null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }

  private _clearTimers(): void {
    this._clearShowTimer();
    this._clearHideTimer();
  }

  // ─── Smart Positioning ────────────────────────────────────────────────────

  /**
   * Determines the resolved placement by checking whether the preferred
   * placement would overflow the viewport and flipping to the opposite side
   * when needed.
   */
  private _computePlacement(): ResolvedPlacement {
    const hostRect = this.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Estimated tooltip dimensions used for overflow detection.
    // We use conservative estimates before the tooltip is rendered/measured.
    const estimatedHeight = 40;
    const estimatedWidth = 180;
    const gap = 8; // gap between trigger and tooltip panel

    const placement = this.placement;

    if (placement === 'top') {
      const spaceAbove = hostRect.top;
      if (spaceAbove < estimatedHeight + gap) return 'bottom';
      return 'top';
    }

    if (placement === 'bottom') {
      const spaceBelow = vh - hostRect.bottom;
      if (spaceBelow < estimatedHeight + gap) return 'top';
      return 'bottom';
    }

    if (placement === 'left') {
      const spaceLeft = hostRect.left;
      if (spaceLeft < estimatedWidth + gap) return 'right';
      return 'left';
    }

    if (placement === 'right') {
      const spaceRight = vw - hostRect.right;
      if (spaceRight < estimatedWidth + gap) return 'left';
      return 'right';
    }

    return 'top';
  }

  /**
   * Computes the `top` and `left` pixel values for the tooltip using
   * `position: fixed` coordinates relative to the host element's bounding rect.
   * Called every time the tooltip is about to show.
   */
  private _positionTooltip(): void {
    const hostRect = this.getBoundingClientRect();
    const gap = 8;
    const arrowSize = 6;
    const totalGap = gap + arrowSize;
    const resolvedPlacement = this._computePlacement();

    let top = 0;
    let left = 0;

    switch (resolvedPlacement) {
      case 'top':
        // Position above the host; center horizontally.
        // We cannot know the exact tooltip height before render, so we
        // position at the top of the host and subtract an estimated height.
        top = hostRect.top - totalGap;
        left = hostRect.left + hostRect.width / 2;
        break;

      case 'bottom':
        top = hostRect.bottom + totalGap;
        left = hostRect.left + hostRect.width / 2;
        break;

      case 'left':
        top = hostRect.top + hostRect.height / 2;
        left = hostRect.left - totalGap;
        break;

      case 'right':
        top = hostRect.top + hostRect.height / 2;
        left = hostRect.right + totalGap;
        break;
    }

    this._tooltipTop = `${top}px`;
    this._tooltipLeft = `${left}px`;
  }

  // ─── Event Handlers ───────────────────────────────────────────────────────

  private _handleMouseEnter = (): void => {
    this._scheduleShow();
  };

  private _handleMouseLeave = (): void => {
    this._scheduleHide();
  };

  private _handleFocusIn = (): void => {
    this._scheduleShow();
  };

  private _handleFocusOut = (): void => {
    this._scheduleHide();
  };

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._isOpen) {
      e.stopPropagation();
      this._hide();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  override render() {
    const tooltipClasses = {
      tooltip: true,
      'tooltip--visible': this._isOpen,
      [`tooltip--${this._resolvedPlacement}`]: true,
    };

    /**
     * For `top` and `bottom`, the CSS transform centers the tooltip
     * horizontally around the left anchor. For `left` and `right`, it
     * centers vertically around the top anchor.
     */
    const transformStyle =
      this._resolvedPlacement === 'top'
        ? `top: calc(${this._tooltipTop} - var(--hx-tooltip-estimated-height, 2.5rem)); left: ${this._tooltipLeft}; transform: translateX(-50%)${this._isOpen ? '' : ' translateY(4px)'};`
        : this._resolvedPlacement === 'bottom'
          ? `top: ${this._tooltipTop}; left: ${this._tooltipLeft}; transform: translateX(-50%)${this._isOpen ? '' : ' translateY(-4px)'};`
          : this._resolvedPlacement === 'left'
            ? `top: ${this._tooltipTop}; left: calc(${this._tooltipLeft} - var(--hx-tooltip-estimated-width, 10rem)); transform: translateY(-50%)${this._isOpen ? '' : ' translateX(4px)'};`
            : `top: ${this._tooltipTop}; left: ${this._tooltipLeft}; transform: translateY(-50%)${this._isOpen ? '' : ' translateX(-4px)'}; `;

    return html`
      <div
        class="trigger"
        aria-describedby=${this._isOpen ? this._tooltipId : nothing}
      >
        <slot></slot>
      </div>

      <div
        id=${this._tooltipId}
        part="tooltip"
        role="tooltip"
        class=${classMap(tooltipClasses)}
        style=${transformStyle}
        aria-hidden=${this._isOpen ? 'false' : 'true'}
      >
        <span part="arrow" class="arrow"></span>
        <slot name="content"></slot>
      </div>
    `;
  }
}

export type WcTooltip = HelixTooltip;

declare global {
  interface HTMLElementTagNameMap {
    'hx-tooltip': HelixTooltip;
  }
}
