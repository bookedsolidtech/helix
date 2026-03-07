import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSplitPanelStyles } from './hx-split-panel.styles.js';

/**
 * A resizable two-pane layout with a draggable divider.
 * The divider uses `role="separator"` with full ARIA support including
 * `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.
 * Keyboard navigation via arrow keys, Home, and End.
 *
 * @summary Resizable split panel with start and end panes.
 *
 * @tag hx-split-panel
 *
 * @slot start - The first (start) panel content.
 * @slot end - The second (end) panel content.
 *
 * @csspart start - The start panel container.
 * @csspart divider - The draggable divider element.
 * @csspart end - The end panel container.
 *
 * @fires hx-reposition - Fired when the divider is moved. Detail: `{ position: number }`.
 *
 * @cssprop [--hx-split-panel-divider-size=4px] - Width (horizontal) or height (vertical) of the divider.
 * @cssprop [--hx-split-panel-divider-color=var(--hx-color-neutral-200)] - Default divider color.
 * @cssprop [--hx-split-panel-divider-hover-color=var(--hx-color-primary-500)] - Divider color on hover/focus.
 */
@customElement('hx-split-panel')
export class HelixSplitPanel extends LitElement {
  static override styles = [tokenStyles, helixSplitPanelStyles];

  /**
   * Position of the divider as a percentage (0–100) of the start panel.
   * @attr position
   */
  @property({ type: Number, reflect: true })
  position = 50;

  /**
   * Position of the divider in pixels (alternative to `position`).
   * When set, takes precedence over `position` until the host is measured.
   * @attr position-in-pixels
   */
  @property({ type: Number, attribute: 'position-in-pixels' })
  positionInPixels: number | undefined;

  /**
   * Orientation of the split.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Snap points as an array of percentages. The divider snaps to the
   * nearest point within a 5% threshold.
   * @attr snap
   */
  @property({ type: Array })
  snap: number[] = [];

  /**
   * When true, the divider cannot be dragged.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Accessible label for the divider. Describes what the separator controls.
   * @attr label
   */
  @property({ type: String })
  label = 'Resize panels';

  /** @internal */
  private readonly _minPercent = 0;
  /** @internal */
  private readonly _maxPercent = 100;

  /** @internal */
  private _dragging = false;
  /** @internal */
  private _dragStart = 0;
  /** @internal */
  private _positionAtDragStart = 0;

  private _clamp(value: number): number {
    return Math.min(this._maxPercent, Math.max(this._minPercent, value));
  }

  private _snapToPoint(value: number): number {
    if (!this.snap.length) return value;
    const threshold = 5;
    for (const point of this.snap) {
      if (Math.abs(value - point) <= threshold) return point;
    }
    return value;
  }

  private _setPosition(percent: number): void {
    const clamped = this._clamp(this._snapToPoint(percent));
    if (clamped === this.position) return;
    this.position = clamped;
    this.dispatchEvent(
      new CustomEvent<{ position: number }>('hx-reposition', {
        detail: { position: this.position },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _getHostSize(): number {
    if (this.orientation === 'horizontal') {
      return this.offsetWidth;
    }
    return this.offsetHeight;
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (this.disabled) return;
    const divider = e.currentTarget as HTMLElement;
    divider.setPointerCapture(e.pointerId);
    this._dragging = true;
    this._dragStart = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    this._positionAtDragStart = this.position;
    e.preventDefault();
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragging) return;
    const current = this.orientation === 'horizontal' ? e.clientX : e.clientY;
    const delta = current - this._dragStart;
    const hostSize = this._getHostSize();
    if (hostSize === 0) return;
    const deltaPercent = (delta / hostSize) * 100;
    this._setPosition(this._positionAtDragStart + deltaPercent);
  };

  private _onPointerUp = (): void => {
    this._dragging = false;
  };

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (this.disabled) return;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        this._setPosition(this.position - 1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        this._setPosition(this.position + 1);
        break;
      case 'Home':
        e.preventDefault();
        this._setPosition(this._minPercent);
        break;
      case 'End':
        e.preventDefault();
        this._setPosition(this._maxPercent);
        break;
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.positionInPixels !== undefined) {
      // Convert pixel position to percentage after first paint
      requestAnimationFrame(() => {
        if (this.positionInPixels !== undefined) {
          const hostSize = this._getHostSize();
          if (hostSize > 0) {
            this.position = this._clamp((this.positionInPixels / hostSize) * 100);
          }
        }
      });
    }
  }

  private _startPanelStyle(): string {
    if (this.orientation === 'horizontal') {
      return `width: ${this.position}%;`;
    }
    return `height: ${this.position}%;`;
  }

  override render() {
    return html`
      <div part="start" class="panel panel--start" style=${this._startPanelStyle()}>
        <slot name="start"></slot>
      </div>
      <div
        part="divider"
        class="divider"
        role="separator"
        aria-orientation=${this.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        aria-valuenow=${this.position}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label=${this.label}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        tabindex=${this.disabled ? '-1' : '0'}
        @pointerdown=${this._onPointerDown}
        @pointermove=${this._onPointerMove}
        @pointerup=${this._onPointerUp}
        @keydown=${this._onKeyDown}
      ></div>
      <div part="end" class="panel panel--end">
        <slot name="end"></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-split-panel': HelixSplitPanel;
  }
}
