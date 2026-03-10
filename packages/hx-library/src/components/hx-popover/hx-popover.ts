import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
import { helixPopoverStyles } from './hx-popover.styles.js';

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

  /**
   * Accessible label for the popover body (sets aria-label on the dialog).
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Popover';

  @state() private _visible = false;

  private _previousFocus: HTMLElement | null = null;

  // P2-06: use crypto.randomUUID() instead of module-level mutable counter
  private readonly _popoverId = `hx-popover-${crypto.randomUUID()}`;

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
  }

  override firstUpdated(): void {
    this._setAnchorAriaExpanded(false);
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

  // P2-03: collapsed _setupAnchorAria + _updateAnchorAriaExpanded into one method
  private _setAnchorAriaExpanded(value: boolean): void {
    const anchorSlot = this.shadowRoot?.querySelector(
      'slot[name="anchor"]',
    ) as HTMLSlotElement | null;
    if (!anchorSlot) return;
    const anchorEl = anchorSlot.assignedElements()[0] as HTMLElement | undefined;
    if (anchorEl) {
      anchorEl.setAttribute('aria-expanded', String(value));
      // aria-controls is omitted: the body lives in Shadow DOM and axe-core
      // cannot resolve cross-root IDREF values, which causes a critical violation.
    }
  }

  // ─── Show/Hide ───

  private async _show(): Promise<void> {
    if (this._visible) return;
    // P0-02: save focus target before moving focus into dialog
    this._previousFocus = document.activeElement as HTMLElement | null;
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
    this._visible = true;
    this.open = true;
    this._setAnchorAriaExpanded(true);
    // P1-03: add Escape listener synchronously before any await so it is registered
    // by the time the test fires an Escape keydown after a single await el.updateComplete.
    document.addEventListener('keydown', this._handleDocumentKeydown);
    await this.updateComplete;
    // hx-after-show fires after Lit has rendered the visible state. Dispatching here
    // (before _updatePosition) ensures it fires in the same microtask as the test's
    // await-continuation, so tests can rely on a single await el.updateComplete.
    this.dispatchEvent(new CustomEvent('hx-after-show', { bubbles: true, composed: true }));
    // P0-02: move focus into dialog body
    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    if (bodyEl) bodyEl.focus();
    // P0-01: listen for outside clicks; deferred to avoid catching the opening click
    setTimeout(() => {
      document.addEventListener('click', this._handleDocumentClick);
    }, 0);
    await this._updatePosition();
  }

  private async _hide(): Promise<void> {
    if (!this._visible) return;
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
    this._visible = false;
    this.open = false;
    this._setAnchorAriaExpanded(false);
    // P0-02: return focus to the element that was focused before the popover opened
    this._previousFocus?.focus();
    this._previousFocus = null;
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

      // P2-02: hide the two border sides facing the popover body so only
      // the outward-facing corner is visible (avoids the inner border line).
      // Reset all four sides first, then make the two inner-facing ones transparent.
      const borderSides = ['border-top', 'border-right', 'border-bottom', 'border-left'] as const;
      for (const side of borderSides) {
        arrowEl.style.setProperty(side, '');
      }
      // Maps base placement → the two sides that face inward toward the popover body
      const innerBorderMap: Record<string, readonly [string, string]> = {
        bottom: ['border-bottom', 'border-right'],
        top: ['border-top', 'border-left'],
        right: ['border-top', 'border-right'],
        left: ['border-bottom', 'border-left'],
      };
      const innerSides = innerBorderMap[basePlacement] ?? ['border-bottom', 'border-right'];
      arrowEl.style.setProperty(innerSides[0], '1px solid transparent');
      arrowEl.style.setProperty(innerSides[1], '1px solid transparent');
    }
  }

  // ─── Event Handlers ───

  // P1-03 / P0-01: document-level handlers active only while popover is open
  private _handleDocumentKeydown = (e: Event): void => {
    if ((e as KeyboardEvent).key === 'Escape' && this._visible) {
      void this._hide();
    }
  };

  // P0-01: close when click target is outside this component
  private _handleDocumentClick = (e: Event): void => {
    // Shadow DOM retargets events from within to the host at document level,
    // so a click on the trigger wrapper appears as e.target === this.
    if (e.target !== this && !this.contains(e.target as Node)) {
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
    this._setAnchorAriaExpanded(this._visible);
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
        role="region"
        aria-label=${this.label}
        aria-hidden="${!this._visible ? 'true' : 'false'}"
        tabindex="-1"
        ?inert=${!this._visible}
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
