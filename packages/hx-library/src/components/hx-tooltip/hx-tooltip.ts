import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTooltipStyles } from './hx-tooltip.styles.js';

/** Resolved placement direction, excluding 'auto'. */
type ResolvedPlacement = 'top' | 'right' | 'bottom' | 'left';

/** Public placement type including 'auto'. */
type TooltipPlacement = ResolvedPlacement | 'auto';

/** Monotonically-increasing counter for unique tooltip IDs. */
let tooltipIdCounter = 0;

/**
 * A contextual help tooltip that wraps a trigger element and shows
 * informational content on hover and keyboard focus.
 *
 * @summary Contextual tooltip for inline help text, fully keyboard and screen-reader accessible.
 *
 * @tag hx-tooltip
 *
 * @slot - Default slot for the trigger element (e.g., a button or icon).
 *
 * @csspart tooltip - The tooltip popup container.
 * @csspart arrow - The directional arrow on the tooltip.
 *
 * @cssprop [--hx-tooltip-bg=var(--hx-color-neutral-900,#111827)] - Tooltip background color.
 * @cssprop [--hx-tooltip-color=var(--hx-color-neutral-50,#f9fafb)] - Tooltip text color.
 * @cssprop [--hx-tooltip-border-radius=var(--hx-border-radius-sm,0.25rem)] - Tooltip border radius.
 * @cssprop [--hx-tooltip-padding=var(--hx-space-1-5,0.375rem) var(--hx-space-2-5,0.625rem)] - Tooltip padding.
 * @cssprop [--hx-tooltip-font-size=var(--hx-font-size-xs,0.75rem)] - Tooltip font size.
 * @cssprop [--hx-tooltip-max-width=17.5rem] - Maximum width of the tooltip popup.
 * @cssprop [--hx-tooltip-z-index=1000] - Stacking order of the tooltip popup.
 */
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  static override styles = [tokenStyles, helixTooltipStyles];

  // ─── Properties ───

  /**
   * The tooltip text content to display.
   * @attr content
   */
  @property({ type: String })
  content = '';

  /**
   * Preferred placement of the tooltip relative to the trigger.
   * When set to 'auto', the component flips to the best-fitting placement
   * based on available viewport space.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: TooltipPlacement = 'top';

  /**
   * Milliseconds to wait before showing the tooltip on hover.
   * Focus-triggered display is always immediate.
   * @attr delay
   */
  @property({ type: Number })
  delay = 300;

  /**
   * When true, the tooltip will not display under any circumstances.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  // ─── Internal State ───

  @state() private _open = false;
  @state() private _resolvedPlacement: ResolvedPlacement = 'top';

  @query('#tooltip')
  private _tooltip!: HTMLElement;

  // ─── Private Fields ───

  private readonly _tooltipId = `hx-tooltip-${++tooltipIdCounter}`;
  private _delayTimer: ReturnType<typeof setTimeout> | undefined;

  // ─── Lifecycle ───

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
    this._clearDelayTimer();
  }

  // ─── Slot Handling ───

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements({ flatten: true });
    assigned.forEach((el) => {
      el.setAttribute('aria-describedby', this._tooltipId);
    });
  }

  // ─── Event Handlers ───

  private _handleMouseEnter = (): void => {
    if (this.disabled) return;
    this._clearDelayTimer();
    this._delayTimer = setTimeout(() => {
      this._show();
    }, this.delay);
  };

  private _handleMouseLeave = (): void => {
    this._clearDelayTimer();
    this._hide();
  };

  private _handleFocusIn = (): void => {
    if (this.disabled) return;
    this._clearDelayTimer();
    this._show();
  };

  private _handleFocusOut = (): void => {
    this._clearDelayTimer();
    this._hide();
  };

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._open) {
      e.stopPropagation();
      this._hide();
    }
  };

  // ─── Show / Hide ───

  private _show(): void {
    this._resolvedPlacement = this._computePlacement();
    this._open = true;
  }

  private _hide(): void {
    this._open = false;
  }

  private _clearDelayTimer(): void {
    if (this._delayTimer !== undefined) {
      clearTimeout(this._delayTimer);
      this._delayTimer = undefined;
    }
  }

  // ─── Smart Positioning ───

  /**
   * Determines the best placement by checking if the preferred placement
   * would overflow the viewport. Falls back to the opposite axis when needed.
   */
  private _computePlacement(): ResolvedPlacement {
    const preferred: ResolvedPlacement = this.placement === 'auto' ? 'top' : this.placement;

    const hostRect = this.getBoundingClientRect();
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    // Estimated tooltip dimensions — use actual dimensions when available.
    const tooltipEl = this._tooltip;
    const tipWidth = tooltipEl ? tooltipEl.offsetWidth || 200 : 200;
    const tipHeight = tooltipEl ? tooltipEl.offsetHeight || 32 : 32;
    const gap = 8;

    const fits: Record<ResolvedPlacement, boolean> = {
      top: hostRect.top - tipHeight - gap >= 0,
      bottom: hostRect.bottom + tipHeight + gap <= vpHeight,
      left: hostRect.left - tipWidth - gap >= 0,
      right: hostRect.right + tipWidth + gap <= vpWidth,
    };

    if (fits[preferred]) return preferred;

    // Flip to opposite
    const opposites: Record<ResolvedPlacement, ResolvedPlacement> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    const flipped = opposites[preferred];
    if (fits[flipped]) return flipped;

    // Fall back to whichever axis has the most room
    const spaceMap: Record<ResolvedPlacement, number> = {
      top: hostRect.top,
      bottom: vpHeight - hostRect.bottom,
      left: hostRect.left,
      right: vpWidth - hostRect.right,
    };

    return (Object.keys(spaceMap) as ResolvedPlacement[]).reduce((best, dir) =>
      spaceMap[dir] > spaceMap[best] ? dir : best,
    );
  }

  // ─── Render ───

  override render() {
    const tooltipClasses = {
      tooltip: true,
      'tooltip--visible': this._open,
      [`tooltip--${this._resolvedPlacement}`]: true,
    };

    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <div
        id=${this._tooltipId}
        part="tooltip"
        class=${classMap(tooltipClasses)}
        role="tooltip"
        aria-hidden=${this._open ? 'false' : 'true'}
      >
        ${this.content}
        <span part="arrow" class="tooltip__arrow"></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tooltip': HelixTooltip;
  }
}
