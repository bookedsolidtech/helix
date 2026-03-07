import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { helixPopoverStyles } from './hx-popover.styles.js';

let _popoverCounter = 0;

type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

type TriggerMode = 'click' | 'hover' | 'focus' | 'manual';

/**
 * A popover that displays rich floating content attached to a trigger element.
 *
 * @summary Rich floating overlay attached to a trigger element.
 *
 * @tag hx-popover
 *
 * @slot anchor - The trigger element that opens the popover.
 * @slot - Default slot for popover body content.
 *
 * @csspart body - The popover body container element.
 * @csspart arrow - The arrow indicator element.
 *
 * @cssprop [--hx-popover-bg=var(--hx-color-neutral-0)] - Popover background color.
 * @cssprop [--hx-popover-color=var(--hx-color-neutral-900)] - Popover text color.
 * @cssprop [--hx-popover-font-size=var(--hx-font-size-sm)] - Popover font size.
 * @cssprop [--hx-popover-max-width=320px] - Maximum popover width.
 * @cssprop [--hx-popover-padding] - Popover padding.
 * @cssprop [--hx-popover-border-color=var(--hx-color-neutral-200)] - Popover border color.
 * @cssprop [--hx-popover-border-radius=var(--hx-border-radius-md)] - Popover border radius.
 * @cssprop [--hx-popover-shadow] - Popover box shadow.
 * @cssprop [--hx-popover-z-index=9999] - Popover z-index.
 * @cssprop [--hx-popover-transition-duration=0.2s] - Show/hide transition duration.
 * @cssprop [--hx-popover-arrow-size=10px] - Size of the arrow indicator.
 *
 * @fires hx-show - Dispatched when the popover begins to show.
 * @fires hx-after-show - Dispatched after the popover is fully visible.
 * @fires hx-hide - Dispatched when the popover begins to hide.
 * @fires hx-after-hide - Dispatched after the popover is fully hidden.
 *
 * @example
 * ```html
 * <hx-popover placement="bottom" trigger="click">
 *   <button slot="anchor">Open Popover</button>
 *   <p>Rich popover content here.</p>
 * </hx-popover>
 * ```
 */
@customElement('hx-popover')
export class HelixPopover extends LitElement {
  static override styles = [tokenStyles, helixPopoverStyles];

  /**
   * Whether the popover is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Preferred placement of the popover relative to the anchor.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: PopoverPlacement = 'bottom';

  /**
   * How the popover is triggered.
   * @attr trigger
   */
  @property({ type: String, reflect: true })
  trigger: TriggerMode = 'click';

  /**
   * Distance in pixels between the popover and the anchor.
   * @attr distance
   */
  @property({ type: Number, reflect: true })
  distance = 8;

  /**
   * Alignment offset in pixels along the anchor.
   * @attr skidding
   */
  @property({ type: Number, reflect: true })
  skidding = 0;

  /**
   * Whether to show an arrow pointing to the anchor.
   * @attr arrow
   */
  @property({ type: Boolean, reflect: true })
  arrow = false;

  @state() private _visible = false;

  private readonly _popoverId = `hx-popover-${++_popoverCounter}`;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
  }

  override firstUpdated(): void {
    this._setupAnchorAria();
    // Sync initial open state
    if (this.open) {
      void this._show();
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open')) {
      if (this.open) {
        void this._show();
      } else {
        void this._hide();
      }
    }
  }

  // ─── ARIA setup ───

  private _setupAnchorAria(): void {
    const anchorSlot = this.shadowRoot?.querySelector(
      'slot[name="anchor"]',
    ) as HTMLSlotElement | null;
    if (!anchorSlot) return;
    const anchorEl = anchorSlot.assignedElements()[0] as HTMLElement | undefined;
    if (anchorEl) {
      anchorEl.setAttribute('aria-expanded', String(this._visible));
      // aria-controls is omitted: the body lives in Shadow DOM and axe-core
      // cannot resolve cross-root IDREF values, which causes a critical violation.
    }
  }

  private _updateAnchorAriaExpanded(): void {
    const anchorSlot = this.shadowRoot?.querySelector(
      'slot[name="anchor"]',
    ) as HTMLSlotElement | null;
    if (!anchorSlot) return;
    const anchorEl = anchorSlot.assignedElements()[0] as HTMLElement | undefined;
    if (anchorEl) {
      anchorEl.setAttribute('aria-expanded', String(this._visible));
    }
  }

  // ─── Show/Hide ───

  private async _show(): Promise<void> {
    if (this._visible) return;
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
    this._visible = true;
    this.open = true;
    this._updateAnchorAriaExpanded();
    await this.updateComplete;
    await this._updatePosition();
    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));
  }

  private async _hide(): Promise<void> {
    if (!this._visible) return;
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
    this._visible = false;
    this.open = false;
    this._updateAnchorAriaExpanded();
    await this.updateComplete;
    this.dispatchEvent(new CustomEvent('hx-after-hide', { bubbles: true, composed: true }));
  }

  // ─── Positioning ───

  private async _updatePosition(): Promise<void> {
    const anchorSlot = this.shadowRoot?.querySelector(
      'slot[name="anchor"]',
    ) as HTMLSlotElement | null;
    if (!anchorSlot) return;
    const anchorEl = anchorSlot.assignedElements()[0] as HTMLElement | undefined;
    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    const arrowEl = this.arrow
      ? (this.shadowRoot?.querySelector('[part="arrow"]') as HTMLElement | null)
      : null;

    if (!anchorEl || !bodyEl) return;

    const middleware = [
      offset({ mainAxis: this.distance, crossAxis: this.skidding }),
      flip(),
      shift({ padding: 8 }),
    ];

    if (arrowEl) {
      middleware.push(arrow({ element: arrowEl }));
    }

    const { x, y, placement, middlewareData } = await computePosition(anchorEl, bodyEl, {
      placement: this.placement,
      strategy: 'fixed',
      middleware,
    });

    Object.assign(bodyEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (arrowEl && middlewareData.arrow) {
      const arrowData = middlewareData.arrow;
      const basePlacement = placement.split('-')[0] ?? 'bottom';
      const staticSide =
        ({ top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as Record<string, string>)[
          basePlacement
        ] ?? 'bottom';

      Object.assign(arrowEl.style, {
        left: arrowData.x != null ? `${arrowData.x}px` : '',
        top: arrowData.y != null ? `${arrowData.y}px` : '',
        right: '',
        bottom: '',
        [staticSide]: '-5px',
      });
    }
  }

  // ─── Event Handlers ───

  private _handleKeydown = (e: Event): void => {
    if ((e as KeyboardEvent).key === 'Escape' && this._visible) {
      void this._hide();
    }
  };

  private _handleAnchorClick = (): void => {
    if (this.trigger !== 'click') return;
    if (this._visible) {
      void this._hide();
    } else {
      void this._show();
    }
  };

  private _handleAnchorMouseEnter = (): void => {
    if (this.trigger !== 'hover') return;
    void this._show();
  };

  private _handleAnchorMouseLeave = (): void => {
    if (this.trigger !== 'hover') return;
    void this._hide();
  };

  private _handleAnchorFocusIn = (): void => {
    if (this.trigger !== 'focus') return;
    void this._show();
  };

  private _handleAnchorFocusOut = (): void => {
    if (this.trigger !== 'focus') return;
    void this._hide();
  };

  private _handleAnchorSlotChange(): void {
    this._setupAnchorAria();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        class="trigger-wrapper"
        @click=${this._handleAnchorClick}
        @mouseenter=${this._handleAnchorMouseEnter}
        @mouseleave=${this._handleAnchorMouseLeave}
        @focusin=${this._handleAnchorFocusIn}
        @focusout=${this._handleAnchorFocusOut}
      >
        <slot name="anchor" @slotchange=${this._handleAnchorSlotChange}></slot>
      </div>
      <div
        part="body"
        id=${this._popoverId}
        role="dialog"
        aria-modal="false"
        aria-label="Popover"
        aria-hidden=${String(!this._visible)}
        class=${this._visible ? 'visible' : ''}
      >
        <slot></slot>
        ${this.arrow ? html`<div part="arrow"></div>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-popover': HelixPopover;
  }
}
