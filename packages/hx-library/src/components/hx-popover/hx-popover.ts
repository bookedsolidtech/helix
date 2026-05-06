import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, state } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixPopoverStyles } from './hx-popover.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';
import { flattenAccName } from '../../utils/aria-flatten.js';
import {
  installAriaIdrefMirror,
  resolveIdrefTokens,
  type AriaIdrefMirrorHandle,
} from '../../utils/aria-idref.js';

const _nextPopoverId = createIdCounter('hx-popover');

/**
 * A popover that displays rich floating content attached to a trigger element.
 *
 * ## Architecture Note: Host-Attribute Label Mirror (group-4 round-1)
 *
 * Unlike modal dialogs (`hx-dialog` / `hx-drawer`) where the HOST is the
 * announced surface and `ElementInternals` projects consumer IDREFs across
 * the shadow boundary, `hx-popover`'s announced surface is the inner
 * `[part="body"]` element which carries `role="dialog"`. The host does not
 * claim a role — it is a structural wrapper around an anchor slot and a
 * separate floating panel.
 *
 * IDL element references on `internals.ariaLabelledByElements` therefore
 * cannot help: AT walks the inner body's accessibility node, and IDL refs
 * declared on the host are not visible from a shadow-internal descendant
 * looking up. The viable cross-shadow path is the host-attribute mirror:
 *
 *   1. The host observes `aria-label` / `aria-labelledby` mutations.
 *   2. On every sync, `aria-labelledby` IDREFs are resolved via
 *      `resolveIdrefTokens` (composed-tree walk: host root → ancestor
 *      shadow hosts → owner document) and **text-flattened** via
 *      `flattenAccName` (AccName 1.2 §4.3.10 hidden-aware).
 *   3. The flattened name is written to the inner body's `aria-label`,
 *      overriding the `label` property only when consumer naming is set.
 *
 * Naming precedence (W3C AccName 1.2 §4.3.1):
 *
 *   1. Host `aria-labelledby` (resolved IDREFs, text-flattened)
 *   2. Host `aria-label`
 *   3. `label` property
 *   4. Hard-coded literal `"Popover"` (last-resort accessible name)
 *
 * The text-flatten approach forfeits live IDL-ref tracking (mutating a
 * referenced element's text re-fires through the shared root observer; see
 * `installAriaIdrefMirror`). `aria-controls` is intentionally omitted on
 * the trigger — the body lives in shadow DOM and consumer IDREFs cannot
 * resolve cross-root from light-DOM (axe-core flags this as a critical
 * violation if attempted; see line documenting this exception below).
 *
 * Slotted label support (e.g. `<slot name="title">`) is deliberately NOT
 * added in this round — it would expand the public API surface and is
 * tracked as a follow-up enhancement.
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
 * @cssprop [--hx-popover-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color when the popover body receives focus.
 *
 * @fires {CustomEvent} hx-show - Emitted when the popover begins to show.
 * @fires {CustomEvent} hx-after-show - Emitted after the popover is fully visible.
 * @fires {CustomEvent} hx-hide - Emitted when the popover begins to hide.
 * @fires {CustomEvent} hx-after-hide - Emitted after the popover is fully hidden.
 *
 * @example
 * ```html
 * <hx-popover placement="bottom" trigger="click">
 *   <button slot="anchor">Open Popover</button>
 *   <p>Rich popover content here.</p>
 * </hx-popover>
 * ```
 * @cssprop [--hx-popover-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-neutral-200] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-shadow-md] - Box shadow.
 * @cssprop [--hx-overlay-black-12] - Overlay color.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-focus-ring-offset] - CSS custom property.
 */

@customElement('hx-popover')
export class HelixPopover extends HelixElement {
  static override styles = [helixPopoverStyles, forcedColorsSurface];

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
  placement:
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
    | 'left-end' = 'bottom';

  /**
   * How the popover is triggered.
   * @attr trigger
   */
  @property({ type: String, reflect: true })
  trigger: 'click' | 'hover' | 'focus' | 'manual' = 'click';

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

  /**
   * Tracks whether the popover body is currently visible.
   * @internal
   */
  @state() private _visible = false;

  /**
   * Resolved accessible name for the popover body — the value written to
   * the inner `[part="body"]` `aria-label`. Recomputed on every sync per
   * the AccName 1.2 §4.3.1 precedence: host `aria-labelledby` (flattened)
   * > host `aria-label` > `label` property > literal `"Popover"`.
   *
   * Stored as state so render reads the current resolution synchronously.
   * @internal
   */
  @state() private _resolvedLabel = '';

  /**
   * Most recently observed consumer-supplied `aria-labelledby` token list on
   * the host. Refreshed every sync via `getAttribute()`.
   * @internal
   */
  private _consumerLabelledBy: string | null = null;

  /**
   * Handle for the shared host attribute / root id observer.
   * @internal
   */
  private _ariaMirror: AriaIdrefMirrorHandle | null = null;

  /**
   * Watches in-place text / visibility mutations on consumer light-DOM
   * elements resolved from the host's `aria-labelledby`. Reinstalled on
   * every sync against the deduped resolved set so an in-place text change
   * to `<h2 id="x">Patient</h2>` flows into the inner body's `aria-label`.
   * @internal
   */
  private _externalRefsObserver: MutationObserver | null = null;

  /**
   * The element that held focus before the popover opened, used to restore focus on close.
   * @internal
   */
  private _previousFocus: HTMLElement | null = null;

  /**
   * Unique ID assigned to the popover body element.
   * @internal
   */
  private readonly _popoverId = _nextPopoverId();

  /**
   * Timer ID for the deferred document click listener registration in _show().
   * Stored so it can be cancelled in disconnectedCallback to prevent leaks.
   * @internal
   */
  private _showTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Timer ID for the hover-triggered hide delay.
   * WCAG 1.4.13: hoverable content must remain visible while the pointer is
   * over it. A 150 ms delay allows the pointer to move from the anchor into
   * the popover body without the content dismissing prematurely.
   * @internal
   */
  private _hoverHideTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Seed the host-attribute label mirror BEFORE first paint so the
    // resolved label is in place when render() reads `_resolvedLabel`.
    // The mirror's initial `sync()` fires synchronously inside
    // `installAriaIdrefMirror`.
    this._syncResolvedLabel();
    this._ariaMirror = installAriaIdrefMirror(this, () => {
      this._syncResolvedLabel();
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
      this._showTimer = null;
    }
    if (this._hoverHideTimer !== null) {
      clearTimeout(this._hoverHideTimer);
      this._hoverHideTimer = null;
    }
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
    this._ariaMirror?.disconnect();
    this._ariaMirror = null;
    this._externalRefsObserver?.disconnect();
    this._externalRefsObserver = null;
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

  override willUpdate(changedProperties: PropertyValues<this>): void {
    super.willUpdate(changedProperties);
    // `label` property changes must flow into the resolved name BEFORE
    // render so the new fallback is in place on the same paint. Running in
    // `updated()` would schedule a follow-up cycle (state-from-update is
    // re-render-triggering), making the cross-component contract: "one
    // updateComplete after `el.label = X` reflects the new aria-label".
    if (changedProperties.has('label')) {
      this._syncResolvedLabel();
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('open')) {
      if (this.open) {
        void this._show();
      } else {
        void this._hide();
      }
    }
  }

  // ─── Host-attribute label mirror ───

  /**
   * (Re-)installs a `MutationObserver` over the deduped union of
   * consumer-resolved label elements. Watches `characterData`, `childList`,
   * `subtree`, and `aria-hidden` / `hidden` attributes so any in-place
   * mutation on referenced light-DOM nodes triggers a fresh sync — keeping
   * the flattened `aria-label` aligned with the live consumer text.
   * @internal
   */
  private _installExternalRefsObserver(elements: Element[]): void {
    if (this._externalRefsObserver) {
      this._externalRefsObserver.disconnect();
      this._externalRefsObserver = null;
    }
    if (elements.length === 0) return;
    const unique = new Set<Element>(elements);
    const observer = new MutationObserver(() => {
      this._syncResolvedLabel();
    });
    for (const el of unique) {
      observer.observe(el, {
        characterData: true,
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['aria-hidden', 'hidden'],
      });
    }
    this._externalRefsObserver = observer;
  }

  /**
   * Resolves the popover body's accessible name from host attributes and
   * the `label` property, applying AccName 1.2 §4.3.1 precedence. Writes
   * the result to `_resolvedLabel` (state) so `render()` projects it onto
   * the inner body's `aria-label` on the next paint. The text-flatten
   * filters out top-level `aria-hidden="true"` / `[hidden]` subtrees per
   * AccName 1.2 §4.3.10 — matching the `flattenAccName` contract used by
   * every other host-canonical hx-* component.
   * @internal
   */
  private _syncResolvedLabel(): void {
    const liveLabelledBy = this.getAttribute('aria-labelledby');
    this._consumerLabelledBy = liveLabelledBy;
    const consumerLabelEls = resolveIdrefTokens(this, liveLabelledBy);

    // Observe in-place mutations on the resolved external IDREF targets so
    // text rewrites in the consumer's light DOM flow into the body's name.
    this._installExternalRefsObserver(consumerLabelEls);

    const isVisibleForAccName = (el: Element): boolean =>
      el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('hidden');

    const flattenedFromIdrefs = consumerLabelEls
      .filter(isVisibleForAccName)
      .map((el) => flattenAccName(el))
      .filter((t) => t.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const liveAriaLabel = this.getAttribute('aria-label');
    const hostAriaLabel = liveAriaLabel !== null ? liveAriaLabel.trim() : '';

    let resolved = '';
    if (flattenedFromIdrefs) {
      resolved = flattenedFromIdrefs;
    } else if (hostAriaLabel) {
      resolved = hostAriaLabel;
    } else if (this.label) {
      resolved = this.label;
    } else {
      // Last-resort literal — preserves the pre-mirror default so an
      // unlabeled popover still has SOME announced name.
      resolved = 'Popover';
    }

    this._resolvedLabel = resolved;
  }

  // ─── ARIA setup ───

  // HIGH-02: set aria-haspopup="dialog" on firstUpdated and keep aria-expanded in sync
  /** @internal */
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
  /** @internal */
  private _getFocusableElements(): HTMLElement[] {
    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    if (!bodyEl) return [];

    // Gather focusable elements from the default slot's assigned nodes
    const defaultSlot = bodyEl.querySelector('slot:not([name])') as HTMLSlotElement | null;
    if (!defaultSlot) return [];

    const assigned = defaultSlot.assignedElements({ flatten: true });
    const focusableSelector =
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary';

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

  // ─── Show/Hide ───

  /** @internal */
  private async _show(): Promise<void> {
    if (this._visible) return;
    // P0-02: save focus target before moving focus into dialog
    this._previousFocus = document.activeElement as HTMLElement | null;
    this.dispatchEvent(new CustomEvent<void>('hx-show', { bubbles: true, composed: true }));
    this._visible = true;
    this.open = true;
    this._setAnchorAriaAttributes(true);
    // P1-03 / HIGH-01: single keydown listener handles both Escape and focus trap.
    // Registered synchronously before any await so it is in place before the first
    // await el.updateComplete in tests.
    document.addEventListener('keydown', this._handleDocumentKeydown);
    await this.updateComplete;
    // hx-after-show fires after Lit has rendered the visible state. Dispatching here
    // (before _updatePosition) ensures it fires in the same microtask as the test's
    // await-continuation, so tests can rely on a single await el.updateComplete.
    this.dispatchEvent(new CustomEvent<void>('hx-after-show', { bubbles: true, composed: true }));
    // WCAG 2.4.3: only move focus into the popover when it contains interactive
    // content. For non-interactive (informational) popovers, stealing focus from
    // the trigger is unexpected and disruptive for keyboard users.
    const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
    if (bodyEl) {
      const hasInteractive = this._getFocusableElements().length > 0;
      if (hasInteractive) {
        bodyEl.focus();
      }
    }
    // P0-01: listen for outside clicks; deferred to avoid catching the opening click
    if (this._showTimer !== null) {
      clearTimeout(this._showTimer);
    }
    this._showTimer = setTimeout(() => {
      this._showTimer = null;
      document.addEventListener('click', this._handleDocumentClick);
    }, 0);
    await this._updatePosition();
  }

  // HIGH-03: _hideWithFocusRestore controls whether _previousFocus is restored.
  // Escape and programmatic close restore focus; click-outside does not.
  /** @internal */
  private async _hide(restoreFocus = true): Promise<void> {
    if (!this._visible) return;
    document.removeEventListener('click', this._handleDocumentClick);
    document.removeEventListener('keydown', this._handleDocumentKeydown);
    this.dispatchEvent(new CustomEvent<void>('hx-hide', { bubbles: true, composed: true }));
    this._visible = false;
    this.open = false;
    this._setAnchorAriaAttributes(false);
    // HIGH-03: only restore focus on Escape / programmatic close
    if (restoreFocus) {
      this._previousFocus?.focus();
    }
    this._previousFocus = null;
    await this.updateComplete;
    this.dispatchEvent(new CustomEvent<void>('hx-after-hide', { bubbles: true, composed: true }));
  }

  // ─── Positioning ───

  /** @internal */
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

    const { computePosition, flip, shift, offset, arrow } = await import('@floating-ui/dom');

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
      const oppositeSide: Record<string, string> = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      };
      const staticSide = oppositeSide[basePlacement] ?? 'bottom';

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

  // P1-03 / P0-01 / HIGH-01: single document-level keydown handler while popover is open.
  // Handles Escape (close) and Tab (focus trap) in one listener to reduce overhead.
  /**
   * Handles Escape to close the popover and Tab/Shift+Tab to trap focus within it.
   * @internal
   */
  private _handleDocumentKeydown = (e: KeyboardEvent): void => {
    if (!this._visible) return;

    if (e.key === 'Escape') {
      // HIGH-03: Escape always restores focus to the prior element
      void this._hide(true);
      return;
    }

    if (e.key === 'Tab') {
      // HIGH-01: trap Tab/Shift+Tab focus within the popover body
      const focusable = this._getFocusableElements();
      if (focusable.length === 0) return;

      const bodyEl = this.shadowRoot?.querySelector('[part="body"]') as HTMLElement | null;
      const allFocusable = bodyEl ? [bodyEl, ...focusable] : focusable;
      if (allFocusable.length === 0) return;

      const first = allFocusable[0] as HTMLElement;
      const last = allFocusable[allFocusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first || this.shadowRoot?.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last || this.shadowRoot?.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  // P0-01: close when click target is outside this component
  /**
   * Closes the popover when a click occurs outside the component boundary.
   * @internal
   */
  private _handleDocumentClick = (e: Event): void => {
    // Shadow DOM retargets events from within to the host at document level,
    // so a click on the trigger wrapper appears as e.target === this.
    if (e.target !== this && !this.contains(e.target as Node)) {
      // HIGH-03: click-outside does NOT restore focus — let browser handle naturally
      void this._hide(false);
    }
  };

  /**
   * Toggles the popover open/closed when the anchor is clicked in click trigger mode.
   * @internal
   */
  private _handleAnchorClick = (): void => {
    if (this.trigger !== 'click') return;
    if (this._visible) {
      void this._hide(true);
    } else {
      void this._show();
    }
  };

  /**
   * Opens the popover when the anchor receives a mouseenter event in hover trigger mode.
   * @internal
   */
  private _handleAnchorMouseEnter = (): void => {
    if (this.trigger !== 'hover') return;
    void this._show();
  };

  /**
   * Closes the popover when the anchor receives a mouseleave event in hover trigger mode.
   * WCAG 1.4.13: applies a 150 ms delay so the pointer can move from anchor
   * into the popover body without the content dismissing prematurely.
   * @internal
   */
  private _handleAnchorMouseLeave = (): void => {
    if (this.trigger !== 'hover') return;
    this._scheduleHoverHide();
  };

  // CRITICAL-02: body hover handlers so moving the pointer from anchor into
  // the popover content does not trigger a hide.
  /** @internal */
  private _handleBodyMouseEnter = (): void => {
    // Cancel a pending hide that would have fired from the anchor's mouseleave.
    if (this.trigger !== 'hover') return;
    this._cancelHoverHide();
  };

  /** @internal */
  private _handleBodyMouseLeave = (): void => {
    if (this.trigger !== 'hover') return;
    this._scheduleHoverHide();
  };

  /**
   * Schedules a hide with a 150 ms delay for hover-triggered dismissal.
   * WCAG 1.4.13: the delay allows the pointer to travel between the anchor
   * and the popover body without the content disappearing.
   * @internal
   */
  private _scheduleHoverHide(): void {
    this._cancelHoverHide();
    this._hoverHideTimer = setTimeout(() => {
      this._hoverHideTimer = null;
      void this._hide(false);
    }, 150);
  }

  /**
   * Cancels any pending hover-triggered hide.
   * @internal
   */
  private _cancelHoverHide(): void {
    if (this._hoverHideTimer !== null) {
      clearTimeout(this._hoverHideTimer);
      this._hoverHideTimer = null;
    }
  }

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

  /** @internal */
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
        aria-label=${this._resolvedLabel}
        aria-hidden=${!this._visible ? 'true' : nothing}
        tabindex="-1"
        ?inert=${!this._visible}
        class=${this._visible ? 'visible' : ''}
        @mouseenter=${this._handleBodyMouseEnter}
        @mouseleave=${this._handleBodyMouseLeave}
      >
        <slot></slot>
        ${this.arrow ? html`<div part="arrow"></div>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-popover': HelixPopover;
  }
}
