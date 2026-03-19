import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
let _popoverCounter = 0;

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

  /** @internal */
  @state() private _visible = false;

  /** @internal */
  private _previousFocus: HTMLElement | null = null;

  /** @internal */
  private readonly _popoverId = `hx-popover-${++_popoverCounter}`;

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
  }

  override firstUpdated(): void {
    // HIGH-02: set aria-haspopup="dialog" once on the anchor so assistive technology
    // announces the control's popup type before it is ever opened.
    this._setAnchorAriaAttributes(false);
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

  // HIGH-02: set aria-haspopup="dialog" on firstUpdated and keep aria-expanded in sync
  private _setAnchorAriaAttributes(expanded: boolean): void {
    const anchorSlot = this.shadowRoot?.querySelector(
      'slot[name="anchor"]',
    ) as HTMLSlotElement | null;
    if (!anchorSlot) return;
    const anchorEl = anchorSlot.assignedElements()[0] as HTMLElement | undefined;
    if (anchorEl) {
      anchorEl.setAttribute('aria-expanded', String(expanded));
      anchorEl.setAttribute('aria-haspopup', 'dialog');
      // aria-controls is omitted: the body lives in Shadow DOM and axe-core
      // cannot resolve cross-root IDREF values, which causes a critical violation.
    }
  }

  // ─── Focus helpers ───

  /** Return all keyboard-focusable elements inside the popover body's slotted content. */
  private _getFocusableElements(): HTMLElement[] {
    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    if (!bodyEl) return [];

    // Gather focusable elements from the default slot's assigned nodes
    const defaultSlot = bodyEl.querySelector('slot:not([name])') as HTMLSlotElement | null;
    if (!defaultSlot) return [];

    const assigned = defaultSlot.assignedElements({ flatten: true });
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const result: HTMLElement[] = [];
    for (const el of assigned) {
      if (el.matches(focusableSelector)) {
        result.push(el as HTMLElement);
      }
      const nested = el.querySelectorAll<HTMLElement>(focusableSelector);
      result.push(...nested);
    }
    return result;
  }

  /** Trap Tab/Shift+Tab focus within the popover body when it contains interactive elements. */
  private _handleFocusTrap = (e: Event): void => {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Tab' || !this._visible) return;

    const focusable = this._getFocusableElements();
    // If no interactive children, keep focus on the body itself — no cycling needed.
    if (focusable.length === 0) return;

    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    const allFocusable = bodyEl ? [bodyEl, ...focusable] : focusable;
    if (allFocusable.length === 0) return;

    const first = allFocusable[0] as HTMLElement;
    const last = allFocusable[allFocusable.length - 1] as HTMLElement;

    if (ke.shiftKey) {
      if (document.activeElement === first || this.shadowRoot?.activeElement === first) {
        ke.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || this.shadowRoot?.activeElement === last) {
        ke.preventDefault();
        first.focus();
      }
    }
  };

  // ─── Show/Hide ───

  private async _show(): Promise<void> {
    if (this._visible) return;
    // P0-02: save focus target before moving focus into dialog
    this._previousFocus = document.activeElement as HTMLElement | null;
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
    this._visible = true;
    this.open = true;
    this._setAnchorAriaAttributes(true);
    // P1-03: add Escape listener synchronously before any await so it is registered
    // by the time the test fires an Escape keydown after a single await el.updateComplete.
    document.addEventListener('keydown', this._handleDocumentKeydown);
    // HIGH-01: focus trap listener active while popover is open
    document.addEventListener('keydown', this._handleFocusTrap);
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

  // HIGH-03: _hideWithFocusRestore controls whether _previousFocus is restored.
  // Escape and programmatic close restore focus; click-outside does not.
  private async _hide(restoreFocus = true): Promise<void> {
    if (!this._visible) return;
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
    document.removeEventListener('keydown', this._handleFocusTrap);
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
    this._visible = false;
    this.open = false;
    this._setAnchorAriaAttributes(false);
    // HIGH-03: only restore focus on Escape / programmatic close
    if (restoreFocus) {
      this._previousFocus?.focus();
    }
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
  /** @internal */
  private _handleDocumentKeydown = (e: Event): void => {
    if ((e as KeyboardEvent).key === 'Escape' && this._visible) {
      // HIGH-03: Escape always restores focus to the prior element
      void this._hide(true);
    }
  };

  // P0-01: close when click target is outside this component
  /** @internal */
  private _handleDocumentClick = (e: Event): void => {
    // Shadow DOM retargets events from within to the host at document level,
    // so a click on the trigger wrapper appears as e.target === this.
    if (e.target !== this && !this.contains(e.target as Node)) {
      // HIGH-03: click-outside does NOT restore focus — let browser handle naturally
      void this._hide(false);
    }
  };

  /** @internal */
  private _handleAnchorClick = (): void => {
    if (this.trigger !== 'click') return;
    if (this._visible) {
      void this._hide(true);
    } else {
      void this._show();
    }
  };

  /** @internal */
  private _handleAnchorMouseEnter = (): void => {
    if (this.trigger !== 'hover') return;
    void this._show();
  };

  /** @internal */
  private _handleAnchorMouseLeave = (): void => {
    if (this.trigger !== 'hover') return;
    void this._hide(false);
  };

  // CRITICAL-02: body hover handlers so moving the pointer from anchor into
  // the popover content does not trigger a hide.
  /** @internal */
  private _handleBodyMouseEnter = (): void => {
    // Cancel a pending hide that would have fired from the anchor's mouseleave
    // by re-showing (no-op if already visible).
    if (this.trigger !== 'hover') return;
    void this._show();
  };

  /** @internal */
  private _handleBodyMouseLeave = (): void => {
    if (this.trigger !== 'hover') return;
    void this._hide(false);
  };

  /** @internal */
  private _handleAnchorFocusIn = (): void => {
    // CRITICAL-02: keyboard users trigger hover-mode popovers via focusin
    if (this.trigger !== 'focus' && this.trigger !== 'hover') return;
    void this._show();
  };

  /** @internal */
  private _handleAnchorFocusOut = (e: FocusEvent): void => {
    // CRITICAL-02: for hover mode, only hide when focus leaves both the anchor
    // and the popover body (i.e. relatedTarget is outside the component).
    if (this.trigger !== 'focus' && this.trigger !== 'hover') return;
    const related = e.relatedTarget as Node | null;
    // If focus is moving into the shadow root (body element), keep popover open
    if (related && (this.contains(related) || this.shadowRoot?.contains(related))) return;
    void this._hide(true);
  };

  private _handleAnchorSlotChange(): void {
    this._setAnchorAriaAttributes(this._visible);
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
        aria-label=${this.label}
        aria-hidden="${!this._visible ? 'true' : 'false'}"
        tabindex="-1"
        ?inert=${!this._visible}
        class=${this._visible ? 'visible' : ''}
        @mouseenter=${this._handleBodyMouseEnter}
        @mouseleave=${this._handleBodyMouseLeave}
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
