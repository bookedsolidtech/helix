import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { computePosition, flip, shift, offset, arrow, type Placement } from '@floating-ui/dom';
import { helixTooltipStyles } from './hx-tooltip.styles.js';

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
 *
 * @example Drupal/Twig usage
 * ```twig
 * <hx-tooltip>
 *   <button type="button">{{ trigger_label }}</button>
 *   <span slot="content">{{ tooltip_text }}</span>
 * </hx-tooltip>
 * ```
 */
@customElement('hx-tooltip')
export class HelixTooltip extends LitElement {
  static override styles = [tokenStyles, helixTooltipStyles];

  /**
   * Preferred placement of the tooltip relative to the trigger.
   * Supports all Floating UI placement values including alignment variants
   * (e.g. 'top-start', 'bottom-end') and 'auto'.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: Placement = 'top';

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

  /**
   * Unique ID for this tooltip instance.
   * Uses crypto.randomUUID() to prevent SSR hydration ID collisions.
   * @internal
   */
  private readonly _tooltipId = `hx-tooltip-${crypto.randomUUID()}`;

  /**
   * Visually-hidden description element in light DOM.
   * Necessary because aria-describedby cannot cross Shadow DOM boundaries —
   * ARIA ID references are scoped to the element's root node. This element
   * lives in the document scope so the trigger's aria-describedby resolves correctly.
   * @internal
   */
  private _lightDomDescription: HTMLSpanElement | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown as EventListener);
    this._clearTimers();
    this._lightDomDescription?.remove();
    this._lightDomDescription = null;
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  // ─── ARIA setup ───

  private _setupTriggerAria(): void {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;

    // Sync content from the content slot into a visually-hidden light DOM element.
    // aria-describedby cannot cross Shadow DOM boundaries, so the referenced element
    // must live in the document scope (light DOM), not inside the shadow root.
    const contentSlot = this.shadowRoot?.querySelector(
      'slot[name="content"]',
    ) as HTMLSlotElement | null;
    const contentText =
      contentSlot
        ?.assignedElements()
        .map((el) => el.textContent)
        .join(' ')
        .trim() ?? '';

    if (!this._lightDomDescription) {
      this._lightDomDescription = document.createElement('span');
      this._lightDomDescription.id = this._tooltipId;
      // Visually hidden but accessible to screen readers via aria-describedby
      this._lightDomDescription.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
      this.appendChild(this._lightDomDescription);
    }
    this._lightDomDescription.textContent = contentText;

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

    // Offset is derived from the arrow element's actual size so that custom
    // --hx-tooltip-arrow-size values position the arrow correctly.
    Object.assign(arrowEl.style, {
      left: arrowData?.x != null ? `${arrowData.x}px` : '',
      top: arrowData?.y != null ? `${arrowData.y}px` : '',
      right: '',
      bottom: '',
      [staticSide]: `${-(arrowEl.offsetWidth / 2)}px`,
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

  /**
   * Handle mouseleave on the trigger wrapper.
   * Does not schedule hide if keyboard focus is still on the trigger element,
   * preventing mixed keyboard+mouse interactions from dismissing the tooltip
   * while the user is still navigating by keyboard.
   * @internal
   */
  private _handleTriggerMouseleave(): void {
    const slot = this.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
    if (
      trigger &&
      (trigger === document.activeElement || trigger.contains(document.activeElement))
    ) {
      return;
    }
    this._scheduleHide();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        class="trigger-wrapper"
        @mouseenter=${this._scheduleShow}
        @mouseleave=${this._handleTriggerMouseleave}
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
        @mouseenter=${this._clearTimers}
        @mouseleave=${this._scheduleHide}
      >
        <slot name="content" @slotchange=${this._setupTriggerAria}></slot>
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
