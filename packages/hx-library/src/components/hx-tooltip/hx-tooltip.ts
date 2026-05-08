import { html } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';

import { HelixElement, createIdCounter } from '../../base/index.js';
import { helixTooltipStyles } from './hx-tooltip.styles.js';
import { forcedColorsSurface } from '../../styles/forced-colors.js';

const _nextTooltipId = createIdCounter('hx-tooltip');

/**
 * A tooltip that displays contextual help text on hover or focus.
 *
 * ## Architecture Note: Light-DOM Description Shim (group-4 round-1)
 *
 * `aria-describedby` IDREFs cannot resolve across the Shadow DOM boundary —
 * the trigger lives in the consumer's light DOM and references a tooltip
 * whose body is in this component's shadow root. The tooltip text must
 * therefore be exposed in DOCUMENT scope.
 *
 * The shim is a single visually-hidden `<span>` appended to `document.body`
 * with the `_tooltipId` as its `id`. The trigger's `aria-describedby` points
 * at this span. The text content is mirrored from the slotted `content`
 * slot on every relevant signal:
 *
 *   1. `firstUpdated` (initial wiring)
 *   2. `slotchange` on the default slot AND the `content` slot (the slotted
 *      element list changes)
 *   3. **Text-content mutations on the assigned `content` slot elements**
 *      (round-23 P2 pattern). Without this observer a framework that
 *      rewrites the slotted `<span slot="content">` `textContent` IN PLACE
 *      (Vue / React keyed text rerender) would leave the shim stale.
 *
 * Cleanup: `disconnectedCallback` removes the shim from `document.body`,
 * disconnects the slot-text observer, and clears the timers. SSR is
 * sidestepped by guarding `document` access — the shim is created lazily
 * the first time `_setupTriggerAria()` runs in a browser environment.
 *
 * `role="tooltip"` is the correct APG role and is NEVER promoted to
 * `role="dialog"` — APG explicitly forbids tooltips from holding focus and
 * the tooltip body is not a focus target. No host-canonical `_internals`
 * work is owed: the trigger is the announced surface, and it correctly
 * references the tooltip via `aria-describedby`.
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
 * @cssprop [--hx-tooltip-font-family=var(--hx-font-family-sans)] - CSS custom property.
 * @cssprop [--hx-z-index-tooltip] - Z-index layer.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-color-neutral-900] - Color.
 * @cssprop [--hx-color-neutral-50] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-font-size-xs] - Font size.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-border-radius-sm] - CSS custom property.
 * @cssprop [--hx-shadow-sm] - Box shadow.
 * @cssprop [--hx-overlay-black-20] - Overlay color.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @aaa-certified 2026-05-08
 * @aaa-criteria 1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12, 2.4.13, 2.5.5, 3.2.5, 3.3.6, forced-colors, apg-keyboard
 * @aaa-audit src/components/hx-tooltip/AAA-AUDIT.md
 * @keyboard-contract dismiss=Escape
 * @aria-pattern tooltip
 * @aria-pattern-source https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 * @forced-colors-supported true
 * @stability stable
 * @since 3.7.0
 * @form-associated false
 * @theme-aware true
 * @brand-aware true
 * @drupal-sdc-eligible true
 * @react-wrapper-status complete
 * @figma-component-name hx-tooltip
 * @priority-tier P0
 * @phi-handles false
 * @clinical-context none
 */

@customElement('hx-tooltip')
export class HelixTooltip extends HelixElement {
  static override styles = [helixTooltipStyles, forcedColorsSurface];

  /**
   * Preferred placement of the tooltip relative to the trigger.
   * Supports all Floating UI placement values including alignment variants
   * (e.g. 'top-start', 'bottom-end') and 'auto'.
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
    | 'left-end' = 'top';

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
  private readonly _tooltipId = _nextTooltipId();

  /** @internal */
  @query('slot:not([name])') private _defaultSlot!: HTMLSlotElement | null;
  /** @internal */
  @query('slot[name="content"]') private _contentSlot!: HTMLSlotElement | null;
  /** @internal */
  @query('.trigger-wrapper') private _triggerWrapper!: HTMLElement | null;
  /** @internal */
  @query('[part="tooltip"]') private _tooltipEl!: HTMLElement | null;
  /** @internal */
  @query('[part="arrow"]') private _arrowEl!: HTMLElement | null;

  /**
   * Visually-hidden description element in light DOM.
   * Necessary because aria-describedby cannot cross Shadow DOM boundaries —
   * ARIA ID references are scoped to the element's root node. This element
   * lives in the document scope so the trigger's aria-describedby resolves correctly.
   * @internal
   */
  private _lightDomDescription: HTMLSpanElement | null = null;

  /**
   * Watches in-place text mutations on the elements assigned to the
   * `<slot name="content">`. Without this observer, a framework that
   * rewrites the slotted `<span slot="content">` `textContent` in place
   * would leave the document-scope shim stale — the `slotchange` event
   * does NOT fire on descendant text mutations.
   *
   * The observer is reinstalled on every `_setupTriggerAria()` call against
   * the deduped current set of assigned elements; it is fully torn down in
   * `disconnectedCallback` to prevent leaks on SSR teardown.
   * @internal
   */
  private _contentSlotTextObserver: MutationObserver | null = null;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeydown);
    // Re-run ARIA setup on reconnection (firstUpdated does not re-run).
    // hasUpdated is true after the first update cycle completes.
    if (this.hasUpdated) {
      this._setupTriggerAria();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeydown);
    this._clearTimers();
    this._lightDomDescription?.remove();
    this._lightDomDescription = null;
    // Round-23 P2: tear down the slotted-content text observer so a
    // disconnect-then-reconnect cycle never leaks observers and the
    // observed light-DOM nodes do not retain a reference to this host.
    this._contentSlotTextObserver?.disconnect();
    this._contentSlotTextObserver = null;
  }

  override firstUpdated(): void {
    this._setupTriggerAria();
  }

  // ─── ARIA setup ───

  /** @internal */
  private _setupTriggerAria(): void {
    const slot = this._defaultSlot;
    if (!slot) return;
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;

    // Sync content from the content slot into a visually-hidden light DOM element.
    // aria-describedby cannot cross Shadow DOM boundaries, so the referenced element
    // must live in the document scope (light DOM), not inside the shadow root.
    const contentSlot = this._contentSlot;
    const contentEls = contentSlot?.assignedElements() ?? [];
    const contentText = contentEls
      .map((el) => el.textContent)
      .join(' ')
      .trim();

    // Guard for SSR — document is unavailable server-side
    if (!this._lightDomDescription && typeof document !== 'undefined') {
      this._lightDomDescription = document.createElement('span');
      this._lightDomDescription.id = this._tooltipId;
      // Visually hidden but accessible to screen readers via aria-describedby.
      // Appended to document.body (not this element) so that the ID is in the
      // document scope and resolves correctly across shadow DOM boundaries.
      // Web components must not mutate their own light DOM children.
      this._lightDomDescription.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
      document.body.appendChild(this._lightDomDescription);
    }
    if (this._lightDomDescription) {
      this._lightDomDescription.textContent = contentText;
    }

    if (trigger) {
      trigger.setAttribute('aria-describedby', this._tooltipId);
    }

    // Round-23 P2 pattern: observe in-place text mutations on the assigned
    // content elements so a framework-driven `textContent` rewrite re-syncs
    // the document-scope shim. `slotchange` fires only on the assignment
    // list itself, never on descendant text/attribute mutations.
    this._installContentSlotTextObserver(contentEls);
  }

  /**
   * (Re-)installs the slotted-content text observer over the deduped union
   * of assigned `content` slot elements. Disconnects any previous observer
   * before re-attaching so observer count is bounded by component lifetime,
   * not by `slotchange` event count.
   * @internal
   */
  private _installContentSlotTextObserver(elements: Element[]): void {
    if (this._contentSlotTextObserver) {
      this._contentSlotTextObserver.disconnect();
      this._contentSlotTextObserver = null;
    }
    if (elements.length === 0) return;
    if (typeof MutationObserver === 'undefined') return;
    const unique = new Set<Element>(elements);
    const observer = new MutationObserver(() => {
      // Re-flatten the current assignment and write the fresh text into the
      // shim. We deliberately do NOT call `_setupTriggerAria()` here — that
      // would reinstall this very observer in a tight loop. The trigger's
      // `aria-describedby` and the shim element are already wired; only the
      // text mirror needs to be refreshed.
      if (!this._lightDomDescription) return;
      const contentSlot = this._contentSlot;
      const fresh =
        contentSlot
          ?.assignedElements()
          .map((el) => el.textContent)
          .join(' ')
          .trim() ?? '';
      if (this._lightDomDescription.textContent !== fresh) {
        this._lightDomDescription.textContent = fresh;
      }
    });
    for (const el of unique) {
      observer.observe(el, {
        characterData: true,
        subtree: true,
        childList: true,
      });
    }
    this._contentSlotTextObserver = observer;
  }

  // ─── Show/Hide ───

  /** @internal */
  private _scheduleShow(): void {
    this._clearTimers();
    this._showTimer = setTimeout(() => {
      void this._show();
    }, this.showDelay);
  }

  /** @internal */
  private _scheduleHide(): void {
    this._clearTimers();
    this._hideTimer = setTimeout(() => {
      this._hide();
    }, this.hideDelay);
  }

  /** @internal */
  private async _show(): Promise<void> {
    this._visible = true;
    await this.updateComplete;
    await this._updatePosition();
  }

  /** @internal */
  private _hide(): void {
    this._visible = false;
  }

  /** @internal */
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

  /** @internal */
  private async _updatePosition(): Promise<void> {
    const reference = this._triggerWrapper;
    const tooltipEl = this._tooltipEl;
    const arrowEl = this._arrowEl;

    if (!reference || !tooltipEl || !arrowEl) return;

    const { computePosition, flip, shift, offset, arrow } = await import('@floating-ui/dom');
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
    const oppositeSide: Record<string, string> = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    };
    const staticSide = oppositeSide[basePlacement] ?? 'bottom';

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
  private _handleKeydown = (e: Event): void => {
    if (!(e instanceof KeyboardEvent)) return;
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
    const slot = this._defaultSlot;
    const trigger = slot?.assignedElements()[0] as HTMLElement | undefined;
    // Guard for SSR — document is unavailable server-side
    const active = typeof document !== 'undefined' ? document.activeElement : null;
    if (trigger && (trigger === active || trigger.contains(active))) {
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
