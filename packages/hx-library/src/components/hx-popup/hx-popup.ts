import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import {
  computePosition,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  offset as offsetMiddleware,
  arrow as arrowMiddleware,
  autoUpdate,
  size as sizeMiddleware,
  autoPlacement as autoPlacementMiddleware,
} from '@floating-ui/dom';
import type { Placement, Middleware } from '@floating-ui/dom';
import { helixPopupStyles } from './hx-popup.styles.js';

type PopupPlacement =
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
  | 'left-end'
  | 'auto';

type ArrowPlacement = 'start' | 'center' | 'end';

// More precise type matching @floating-ui/dom's arrow middleware data structure
type ArrowData = { x?: number; y?: number; centerOffset: number };

/**
 * A low-level positioning primitive that anchors a floating panel to a reference element.
 * This is the base that hx-tooltip, hx-dropdown, and hx-popover build upon.
 *
 * @summary Low-level popup positioning utility.
 *
 * @tag hx-popup
 *
 * @slot anchor - The reference element the popup is anchored to.
 * @slot - Default slot for popup content.
 *
 * @csspart popup - The popup container element.
 * @csspart arrow - The arrow indicator element (only present when `arrow` is true).
 *
 * @cssprop [--hx-popup-z-index=9000] - Z-index of the popup container.
 * @cssprop [--hx-popup-transition=none] - Transition applied to the popup element.
 *   Consumers who need enter/exit animations can set this property AND override the
 *   default `display: none` hide mechanism via `::part(popup)`. Example:
 *   ```css
 *   hx-popup { --hx-popup-transition: opacity 0.2s ease; }
 *   hx-popup:not([active])::part(popup) { display: block; opacity: 0; pointer-events: none; }
 *   hx-popup[active]::part(popup) { opacity: 1; }
 *   ```
 * @cssprop [--hx-arrow-size=8px] - Size of the arrow element.
 * @cssprop [--hx-arrow-color=var(--hx-color-surface-overlay, #ffffff)] - Color of the arrow element.
 * @cssprop --hx-auto-size-available-width - Available width set by auto-size middleware (on :host).
 * @cssprop --hx-auto-size-available-height - Available height set by auto-size middleware (on :host).
 *
 * @fires {CustomEvent} hx-reposition - Emitted after the popup is repositioned.
 *
 * ## Accessibility Contract
 *
 * `hx-popup` is a **positioning utility**, not an interactive widget. It does not provide
 * ARIA semantics. Consumers are responsible for all accessibility:
 *
 * - **Popup role**: Add `role="tooltip"`, `role="dialog"`, `role="listbox"`, etc. to the
 *   slotted popup content depending on its purpose.
 * - **Trigger state**: The element that triggers the popup MUST set `aria-expanded="true/false"`.
 * - **Association**: Use `aria-controls` on the trigger to reference the popup content element,
 *   and `aria-labelledby` / `aria-describedby` as appropriate.
 * - **Focus management**: `hx-popup` does NOT trap focus. Consumers building dialogs or menus
 *   MUST implement focus trapping and keyboard dismiss (Escape key) themselves.
 * - **Visibility**: The popup is hidden via `display: none` (CSS) and the `inert` attribute
 *   when inactive. Both are reliable accessibility-tree hiding mechanisms.
 *
 * @example
 * ```html
 * <!-- Tooltip pattern -->
 * <hx-popup id="my-tooltip" placement="bottom" distance="8">
 *   <button
 *     slot="anchor"
 *     aria-describedby="tooltip-content"
 *     aria-expanded="false"
 *     aria-controls="my-tooltip"
 *   >
 *     Trigger
 *   </button>
 *   <div id="tooltip-content" role="tooltip">Tooltip text</div>
 * </hx-popup>
 * ```
 *
 * ## Drupal Integration
 *
 * `hx-popup` is a JS utility — Twig provides markup only. No Drupal behavior file is
 * required for basic usage, since the `anchor` slot and `active` attribute are sufficient.
 *
 * ```twig
 * {# Basic Twig usage — prefer anchor slot in server-rendered contexts #}
 * <hx-popup id="my-popup" placement="bottom" distance="8">
 *   <button
 *     slot="anchor"
 *     aria-expanded="false"
 *     aria-controls="popup-content"
 *   >Open</button>
 *   <div id="popup-content" role="dialog" aria-label="Popup content">...</div>
 * </hx-popup>
 * ```
 *
 * ```js
 * // Drupal behavior for toggle interaction
 * Drupal.behaviors.helixPopup = {
 *   attach(context) {
 *     context.querySelectorAll('hx-popup').forEach((popup) => {
 *       const trigger = popup.querySelector('[slot="anchor"]');
 *       if (!trigger) return;
 *       trigger.addEventListener('click', () => {
 *         popup.active = !popup.active;
 *         trigger.setAttribute('aria-expanded', String(popup.active));
 *       });
 *     });
 *   },
 * };
 * ```
 *
 * For Drupal-generated dynamic IDs, prefer the anchor **slot** over the `anchor` CSS selector
 * attribute, since slot-based anchoring does not require knowing the element's ID at render time.
 * If you must use the CSS selector form with dynamic IDs, pass the ID via a Twig variable:
 * ```twig
 * <hx-popup anchor="#{{ element['#id'] }}" placement="bottom">...</hx-popup>
 * ```
 */
@customElement('hx-popup')
export class HelixPopup extends LitElement {
  static override styles = [tokenStyles, helixPopupStyles];

  private _anchorSlotEl: Element | null = null;
  private _cleanupAutoUpdate: (() => void) | null = null;

  /**
   * The reference element to anchor the popup to.
   *
   * - **Attribute form** (`anchor="#selector"`): Accepts a CSS selector string resolved via
   *   `querySelector` from the component's root node. Use this in HTML/Twig markup.
   * - **Property form** (`el.anchor = element`): Accepts an `Element` reference directly.
   *   Setting an Element via JS property does NOT reflect to the attribute.
   *
   * If not set, the element in the `anchor` slot is used.
   *
   * @attr anchor
   */
  @property({ attribute: 'anchor' })
  anchor: string | Element | null = null;

  /**
   * Preferred placement of the popup relative to the anchor.
   * @attr placement
   */
  @property({ type: String, reflect: true })
  placement: PopupPlacement = 'bottom';

  /**
   * Whether the popup is visible.
   * @attr active
   */
  @property({ type: Boolean, reflect: true })
  active = false;

  /**
   * Gap in pixels between the popup and the anchor element.
   * @attr distance
   */
  @property({ type: Number, reflect: true })
  distance = 0;

  /**
   * Offset in pixels along the anchor element's axis.
   * @attr skidding
   */
  @property({ type: Number, reflect: true })
  skidding = 0;

  /**
   * Whether to show an arrow pointing to the anchor element.
   * @attr arrow
   */
  @property({ type: Boolean, reflect: true })
  arrow = false;

  /**
   * Manual placement of the arrow along the popup edge.
   * When not set, floating-ui calculates the optimal position.
   * @attr arrow-placement
   */
  @property({ attribute: 'arrow-placement', reflect: true })
  arrowPlacement: ArrowPlacement | null = null;

  /**
   * Minimum padding in pixels from the popup edge to the arrow.
   * @attr arrow-padding
   */
  @property({ type: Number, attribute: 'arrow-padding' })
  arrowPadding = 10;

  /**
   * When true, flips the popup to the opposite side to avoid overflow.
   * @attr flip
   */
  @property({ type: Boolean, reflect: true })
  flip = false;

  /**
   * Fallback placements to try when flipping. Accepts a JSON array string.
   *
   * @example
   * ```html
   * <!-- Try "top" then "left" before giving up -->
   * <hx-popup flip flip-fallback-placements='["top","left"]'>...</hx-popup>
   * ```
   *
   * @attr flip-fallback-placements
   */
  @property({
    attribute: 'flip-fallback-placements',
    converter: {
      fromAttribute(value: string | null): PopupPlacement[] {
        if (!value) return [];
        try {
          return JSON.parse(value) as PopupPlacement[];
        } catch {
          return [];
        }
      },
      toAttribute(value: PopupPlacement[]): string {
        return JSON.stringify(value);
      },
    },
  })
  flipFallbackPlacements: PopupPlacement[] = [];

  /**
   * When true, shifts the popup along the axis to remain in the viewport.
   * @attr shift
   */
  @property({ type: Boolean, reflect: true })
  shift = false;

  /**
   * When true, resizes the popup to fit within the viewport.
   * Sets --hx-auto-size-available-width and --hx-auto-size-available-height CSS custom
   * properties on `:host` so they cascade into shadow DOM and are readable from light DOM.
   * @attr auto-size
   */
  @property({ type: Boolean, attribute: 'auto-size', reflect: true })
  autoSize = false;

  /**
   * Positioning strategy passed to floating-ui's `computePosition`.
   *
   * - `'fixed'` (default): works for most cases; positions relative to the viewport.
   * - `'absolute'`: use inside `overflow: hidden` / scroll containers where the popup is
   *   positioned relative to the nearest positioned ancestor instead of the viewport.
   *
   * @attr strategy
   */
  @property({ reflect: true })
  strategy: 'fixed' | 'absolute' = 'fixed';

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.active) {
      void this.updateComplete.then(() => this._startAutoUpdate());
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopAutoUpdate();
  }

  override updated(changedProperties: Map<string | symbol, unknown>): void {
    super.updated(changedProperties);

    const activeChanged = changedProperties.has('active');
    const positioningChanged =
      changedProperties.has('placement') ||
      changedProperties.has('distance') ||
      changedProperties.has('skidding') ||
      changedProperties.has('arrow') ||
      changedProperties.has('arrowPadding') ||
      changedProperties.has('arrowPlacement') ||
      changedProperties.has('flip') ||
      changedProperties.has('flipFallbackPlacements') ||
      changedProperties.has('shift') ||
      changedProperties.has('autoSize') ||
      changedProperties.has('anchor') ||
      changedProperties.has('strategy');

    if (activeChanged) {
      if (this.active) {
        this._startAutoUpdate();
      } else {
        this._stopAutoUpdate();
        // Clean up autoSize custom properties when popup goes inactive
        if (this.autoSize) {
          this.style.removeProperty('--hx-auto-size-available-width');
          this.style.removeProperty('--hx-auto-size-available-height');
        }
      }
    } else if (positioningChanged && this.active) {
      void this._reposition();
    }

    // Remove stale autoSize properties when autoSize is disabled
    if (changedProperties.has('autoSize') && !this.autoSize) {
      this.style.removeProperty('--hx-auto-size-available-width');
      this.style.removeProperty('--hx-auto-size-available-height');
    }
  }

  // ─── Anchor Resolution ───

  private _getAnchorElement(): Element | null {
    if (this.anchor instanceof Element) {
      return this.anchor;
    }
    if (typeof this.anchor === 'string') {
      return (this.getRootNode() as Document | ShadowRoot).querySelector(this.anchor);
    }
    return this._anchorSlotEl;
  }

  private _handleAnchorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const assigned = slot.assignedElements();
    this._anchorSlotEl = assigned[0] ?? null;
    if (this.active) {
      void this._reposition();
    }
  }

  // ─── Positioning ───

  private _startAutoUpdate(): void {
    this._stopAutoUpdate();
    const anchorEl = this._getAnchorElement();
    const popupEl = this.shadowRoot?.querySelector<HTMLElement>('[part="popup"]');
    if (!anchorEl || !popupEl) return;

    this._cleanupAutoUpdate = autoUpdate(anchorEl, popupEl, () => {
      void this._reposition();
    });
  }

  private _stopAutoUpdate(): void {
    this._cleanupAutoUpdate?.();
    this._cleanupAutoUpdate = null;
  }

  private async _reposition(): Promise<void> {
    const anchorEl = this._getAnchorElement();
    const popupEl = this.shadowRoot?.querySelector<HTMLElement>('[part="popup"]');
    if (!anchorEl || !popupEl) return;

    const arrowEl = this.arrow
      ? (this.shadowRoot?.querySelector<HTMLElement>('[part="arrow"]') ?? null)
      : null;

    const middleware: Middleware[] = [
      offsetMiddleware({ mainAxis: this.distance, crossAxis: this.skidding }),
    ];

    if (this.placement === 'auto') {
      middleware.push(autoPlacementMiddleware());
    } else if (this.flip) {
      middleware.push(
        flipMiddleware({
          fallbackPlacements: this.flipFallbackPlacements as Placement[],
        }),
      );
    }

    if (this.shift) {
      middleware.push(shiftMiddleware({ padding: 8 }));
    }

    if (arrowEl) {
      middleware.push(arrowMiddleware({ element: arrowEl, padding: this.arrowPadding }));
    }

    if (this.autoSize) {
      middleware.push(
        sizeMiddleware({
          apply: ({ availableWidth, availableHeight }) => {
            // Set on :host so the custom properties cascade into shadow DOM and
            // are accessible from light DOM consumers via CSS inheritance.
            this.style.setProperty('--hx-auto-size-available-width', `${availableWidth}px`);
            this.style.setProperty('--hx-auto-size-available-height', `${availableHeight}px`);
          },
        }),
      );
    }

    const effectivePlacement: Placement =
      this.placement === 'auto' ? 'bottom' : (this.placement as Placement);

    // Set position strategy before computing — inline style takes precedence over CSS
    popupEl.style.position = this.strategy;

    const { x, y, placement, middlewareData } = await computePosition(anchorEl, popupEl, {
      placement: effectivePlacement,
      strategy: this.strategy,
      middleware,
    });

    Object.assign(popupEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (arrowEl) {
      const arrowData = middlewareData.arrow as ArrowData | undefined;
      this._positionArrow(arrowEl, placement, arrowData);
    }

    this.dispatchEvent(new CustomEvent('hx-reposition', { bubbles: true, composed: true }));
  }

  private _positionArrow(
    arrowEl: HTMLElement,
    placement: Placement,
    arrowData: ArrowData | undefined,
  ): void {
    const basePlacement = placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
    const staticSides = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right',
    } as const;
    const staticSide = staticSides[basePlacement];

    const arrowStyle: Record<string, string> = {
      left: '',
      top: '',
      right: '',
      bottom: '',
    };

    if (this.arrowPlacement === 'start' || this.arrowPlacement === 'end') {
      const isVertical = basePlacement === 'top' || basePlacement === 'bottom';
      if (isVertical) {
        arrowStyle[this.arrowPlacement === 'start' ? 'left' : 'right'] = `${this.arrowPadding}px`;
      } else {
        arrowStyle[this.arrowPlacement === 'start' ? 'top' : 'bottom'] = `${this.arrowPadding}px`;
      }
    } else {
      // 'center' or null: use floating-ui computed position
      if (arrowData?.x != null) arrowStyle.left = `${arrowData.x}px`;
      if (arrowData?.y != null) arrowStyle.top = `${arrowData.y}px`;
    }

    arrowStyle[staticSide] = '-4px';
    arrowEl.setAttribute('data-placement', basePlacement);
    Object.assign(arrowEl.style, arrowStyle);
  }

  // ─── Public API ───

  /**
   * Forces the popup to recalculate its position.
   */
  async reposition(): Promise<void> {
    await this._reposition();
  }

  // ─── Render ───

  override render() {
    return html`
      <slot name="anchor" @slotchange=${this._handleAnchorSlotChange}></slot>
      <div part="popup" ?inert=${!this.active}>
        <slot></slot>
        ${this.arrow ? html`<div part="arrow"></div>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-popup': HelixPopup;
  }
}
