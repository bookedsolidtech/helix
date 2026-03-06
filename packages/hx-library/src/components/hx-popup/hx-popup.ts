import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
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
 * @cssprop [--arrow-size=8px] - Size of the arrow element.
 * @cssprop [--arrow-color=currentColor] - Color of the arrow element.
 * @cssprop --auto-size-available-width - Available width set by auto-size middleware.
 * @cssprop --auto-size-available-height - Available height set by auto-size middleware.
 *
 * @fires {CustomEvent} hx-reposition - Emitted after the popup is repositioned.
 *
 * @example
 * ```html
 * <hx-popup active placement="bottom">
 *   <button slot="anchor">Trigger</button>
 *   <div>Popup content</div>
 * </hx-popup>
 * ```
 */
@customElement('hx-popup')
export class HelixPopup extends LitElement {
  static override styles = [tokenStyles, helixPopupStyles];

  private _anchorSlotEl: Element | null = null;
  private _cleanupAutoUpdate: (() => void) | null = null;

  /**
   * The reference element to anchor the popup to.
   * Accepts a CSS selector string or an Element reference.
   * If not set, the element in the `anchor` slot is used.
   * @attr anchor
   */
  @property()
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
   * @attr flip-fallback-placements
   */
  @property({
    attribute: 'flip-fallback-placements',
    converter: {
      fromAttribute(value: string | null): string[] {
        if (!value) return [];
        try {
          return JSON.parse(value) as string[];
        } catch {
          return [];
        }
      },
      toAttribute(value: string[]): string {
        return JSON.stringify(value);
      },
    },
  })
  flipFallbackPlacements: string[] = [];

  /**
   * When true, shifts the popup along the axis to remain in the viewport.
   * @attr shift
   */
  @property({ type: Boolean, reflect: true })
  shift = false;

  /**
   * When true, resizes the popup to fit within the viewport.
   * Sets --auto-size-available-width and --auto-size-available-height CSS custom properties.
   * @attr auto-size
   */
  @property({ type: Boolean, attribute: 'auto-size', reflect: true })
  autoSize = false;

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
      changedProperties.has('anchor');

    if (activeChanged) {
      if (this.active) {
        this._startAutoUpdate();
      } else {
        this._stopAutoUpdate();
      }
    } else if (positioningChanged && this.active) {
      void this._reposition();
    }
  }

  // ─── Anchor Resolution ───

  private _getAnchorElement(): Element | null {
    if (this.anchor instanceof Element) {
      return this.anchor;
    }
    if (typeof this.anchor === 'string') {
      return document.querySelector(this.anchor);
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
            popupEl.style.setProperty('--auto-size-available-width', `${availableWidth}px`);
            popupEl.style.setProperty('--auto-size-available-height', `${availableHeight}px`);
          },
        }),
      );
    }

    const effectivePlacement: Placement =
      this.placement === 'auto' ? 'bottom' : (this.placement as Placement);

    const { x, y, placement, middlewareData } = await computePosition(anchorEl, popupEl, {
      placement: effectivePlacement,
      strategy: 'fixed',
      middleware,
    });

    Object.assign(popupEl.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (arrowEl) {
      const arrowData = middlewareData.arrow as { x?: number; y?: number } | undefined;
      this._positionArrow(arrowEl, placement, arrowData);
    }

    this.dispatchEvent(new CustomEvent('hx-reposition', { bubbles: true, composed: true }));
  }

  private _positionArrow(
    arrowEl: HTMLElement,
    placement: Placement,
    arrowData: { x?: number; y?: number } | undefined,
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
      <div part="popup" aria-hidden=${String(!this.active)}>
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
