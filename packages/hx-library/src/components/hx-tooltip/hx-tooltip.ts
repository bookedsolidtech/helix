import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { helixTooltipStyles } from './hx-tooltip.styles.js';

let _tooltipCounter = 0;

/**
 * A tooltip that displays contextual help text on hover or focus.
 *
 * @summary Contextual help text and abbreviations with smart positioning.
 *
 * @tag hx-tooltip
 *
 * @slot - Default slot for the trigger element.
 * @slot content - Tooltip content to display.
 *
 * @csspart tooltip - The tooltip container element.
 * @csspart arrow - The arrow indicator element.
 *
 * @cssprop [--hx-tooltip-bg=var(--hx-color-neutral-900)] - Tooltip background color.
 * @cssprop [--hx-tooltip-color=var(--hx-color-neutral-50)] - Tooltip text color.
 * @cssprop [--hx-tooltip-font-size=var(--hx-font-size-xs)] - Tooltip font size.
 * @cssprop [--hx-tooltip-max-width=280px] - Maximum tooltip width.
 * @cssprop [--hx-tooltip-padding] - Tooltip padding.
 * @cssprop [--hx-tooltip-border-radius=var(--hx-border-radius-sm)] - Tooltip border radius.
 * @cssprop [--hx-tooltip-shadow] - Tooltip box shadow.
 * @cssprop [--hx-tooltip-z-index=9999] - Tooltip z-index.
 * @cssprop [--hx-tooltip-transition-duration=0.15s] - Show/hide transition duration.
 * @cssprop [--hx-tooltip-arrow-size=8px] - Size of the arrow indicator.
 *
 * @example
 * ```html
 * <hx-tooltip>
 *   <button>Hover me</button>
 *   <span slot="content">Helpful context here</span>
 * </hx-tooltip>
 * ```
 */
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  static override styles = [tokenStyles, helixTooltipStyles];

  /**
   * Preferred placement of the tooltip relative to the trigger.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: 'top' | 'bottom' | 'left' | 'right' = 'top';

  /**
   * Delay in milliseconds before the tooltip is shown.
   * @attr show-delay
   */
  @property({ type: Number, attribute: 'show-delay' })
  showDelay = 300;

  /**
   * Delay in milliseconds before the tooltip is hidden.
   * @attr hide-delay
   */
  @property({ type: Number, attribute: 'hide-delay' })
  hideDelay = 100;

  /** @internal */
  @state() private _visible = false;

  /** @internal */
  private _showTimer: ReturnType<typeof setTimeout> | null = null;
  /** @internal */
  private _hideTimer: ReturnType<typeof setTimeout> | null = null;

  /** @internal */
  private readonly _tooltipId = `hx-tooltip-${++_tooltipCounter}`;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown as EventListener);
    this._clearTimers();
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  // ─── ARIA setup ───

  private _setupTriggerAria(): void {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;
    if (trigger) {
      trigger.setAttribute('aria-describedby', this._tooltipId);
    }
  }

  // ─── Show/Hide ───

  private _scheduleShow(): void {
    this._clearTimers();
    this._showTimer = setTimeout(() => {
      void this._show();
    }, this.showDelay);
  }

  private _scheduleHide(): void {
    this._clearTimers();
    this._hideTimer = setTimeout(() => {
      this._hide();
    }, this.hideDelay);
  }

  private async _show(): Promise<void> {
    this._visible = true;
    await this.updateComplete;
    await this._updatePosition();
  }

  private _hide(): void {
    this._visible = false;
  }

  private _clearTimers(): void {
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
    if (this._hideTimer !== null) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }

  // ─── Positioning ───

  private async _updatePosition(): Promise<void> {
    const reference = this.shadowRoot?.querySelector('.trigger-wrapper') as HTMLElement | null;
    const tooltipEl = this.shadowRoot?.querySelector('[part="tooltip"]') as HTMLElement | null;
    const arrowEl = this.shadowRoot?.querySelector('[part="arrow"]') as HTMLElement | null;

    if (!reference || !tooltipEl || !arrowEl) return;

    const { x, y, placement, middlewareData } = await computePosition(reference, tooltipEl, {
      placement: this.placement,
      strategy: 'fixed',
      middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowEl })],
    });

    Object.assign(tooltipEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    const arrowData = middlewareData.arrow;
    const basePlacement = placement.split('-')[0] ?? 'top';
    const staticSide =
      ({ top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as Record<string, string>)[
        basePlacement
      ] ?? 'bottom';

    Object.assign(arrowEl.style, {
      left: arrowData?.x != null ? `${arrowData.x}px` : '',
      top: arrowData?.y != null ? `${arrowData.y}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px',
    });
  }

  // ─── Events ───

  /** @internal */
  private _handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._visible) {
      this._clearTimers();
      this._hide();
    }
  };

  // ─── Render ───

  override render() {
    return html`
      <div
        class="trigger-wrapper"
        @mouseenter=${this._scheduleShow}
        @mouseleave=${this._scheduleHide}
        @focusin=${this._scheduleShow}
        @focusout=${this._scheduleHide}
      >
        <slot @slotchange=${this._setupTriggerAria}></slot>
      </div>
      <div
        part="tooltip"
        id=${this._tooltipId}
        role="tooltip"
        aria-hidden=${String(!this._visible)}
        class=${this._visible ? 'visible' : ''}
      >
        <slot name="content"></slot>
        <div part="arrow"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tooltip': HelixTooltip;
  }
}
