import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixSplitPanelStyles } from './hx-split-panel.styles.js';

/**
 * A resizable two-pane layout with a draggable divider.
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
 *
 * @example Drupal Twig usage:
 * ```twig
 * <hx-split-panel
 *   position="50"
 *   orientation="horizontal"
 *   min="10"
 *   max="90"
 *   collapsible
 * >
 *   <div slot="start">{{ start_content }}</div>
 *   <div slot="end">{{ end_content }}</div>
 * </hx-split-panel>
 *
 * Attribute-settable: position, position-in-pixels, orientation, disabled, min, max, collapsible, collapsed
 * JS-only (complex types): snap (use .snap=${[25, 50, 75]} in Lit templates,
 *   or snap="[25,50,75]" as JSON string in Twig)
 * ```
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
   * Minimum position as a percentage (0–100). Prevents full collapse of start panel.
   * @attr min
   */
  @property({ type: Number, reflect: true })
  min = 0;

  /**
   * Maximum position as a percentage (0–100). Prevents full expansion of start panel.
   * @attr max
   */
  @property({ type: Number, reflect: true })
  max = 100;

  /**
   * Snap points as an array of percentages. The divider snaps to the
   * nearest point within a 5% threshold.
   * Accepts JSON array string in HTML: snap="[25, 50, 75]"
   * @attr snap
   */
  @property({
    attribute: 'snap',
    converter: {
      fromAttribute(value: string | null): number[] {
        if (!value) return [];
        try {
          const parsed = JSON.parse(value) as unknown;
          if (Array.isArray(parsed)) return (parsed as unknown[]).map(Number);
          return [];
        } catch {
          return value
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !isNaN(n));
        }
      },
      toAttribute(value: number[]): string {
        return JSON.stringify(value);
      },
    },
  })
  snap: number[] = [];

  /**
   * When true, the divider cannot be dragged.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * When true, collapse/expand buttons appear on the divider.
   * @attr collapsible
   */
  @property({ type: Boolean, reflect: true })
  collapsible = false;

  /**
   * Which panel is collapsed: 'start', 'end', or null (not collapsed).
   * @attr collapsed
   */
  @property({ type: String, reflect: true })
  collapsed: 'start' | 'end' | null = null;

  private _dragging = false;
  private _dragStart = 0;
  private _positionAtDragStart = 0;
  private _positionBeforeCollapse = 50;

  private _clamp(value: number): number {
    return Math.min(this.max, Math.max(this.min, value));
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
      case 'PageUp':
        e.preventDefault();
        this._setPosition(this.position + 10);
        break;
      case 'PageDown':
        e.preventDefault();
        this._setPosition(this.position - 10);
        break;
      case 'Home':
        e.preventDefault();
        this._setPosition(this.min);
        break;
      case 'End':
        e.preventDefault();
        this._setPosition(this.max);
        break;
    }
  };

  private _collapseStart = (): void => {
    this.collapsed = 'start';
  };

  private _collapseEnd = (): void => {
    this.collapsed = 'end';
  };

  private _expand = (): void => {
    this.collapsed = null;
  };

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (!changedProperties.has('collapsed')) return;

    const prev = changedProperties.get('collapsed');

    if (this.collapsed === 'start') {
      // Save restore point when transitioning from non-collapsed state (or initial render)
      if (prev === null || prev === undefined) this._positionBeforeCollapse = this.position;
      this._setPosition(this.min);
    } else if (this.collapsed === 'end') {
      if (prev === null || prev === undefined) this._positionBeforeCollapse = this.position;
      this._setPosition(this.max);
    } else if (this.collapsed === null && prev !== null && prev !== undefined) {
      // Only expand when transitioning from an explicitly collapsed state (not first render)
      this._setPosition(this._positionBeforeCollapse);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.positionInPixels !== undefined) {
      // Convert pixel position to percentage after first paint
      requestAnimationFrame(() => {
        if (this.positionInPixels !== undefined) {
          const hostSize = this._getHostSize();
          if (hostSize > 0) {
            this._setPosition((this.positionInPixels / hostSize) * 100);
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
      <div class="divider-track">
        <div
          part="divider"
          class="divider"
          role="separator"
          aria-label="Resize panels"
          aria-orientation=${this.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
          aria-valuenow=${this.position}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-disabled=${this.disabled ? 'true' : nothing}
          tabindex=${this.disabled ? '-1' : '0'}
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @keydown=${this._onKeyDown}
        ></div>
        ${this.collapsible
          ? this.collapsed
            ? html`<div class="collapse-controls">
                <button
                  type="button"
                  class="collapse-btn"
                  aria-label=${`Expand ${this.collapsed} panel`}
                  @click=${this._expand}
                >
                  ${this.collapsed === 'start' ? '▶' : '◀'}
                </button>
              </div>`
            : html`<div class="collapse-controls">
                <button
                  type="button"
                  class="collapse-btn"
                  aria-label="Collapse start panel"
                  @click=${this._collapseStart}
                >
                  ◀
                </button>
                <button
                  type="button"
                  class="collapse-btn"
                  aria-label="Collapse end panel"
                  @click=${this._collapseEnd}
                >
                  ▶
                </button>
              </div>`
          : nothing}
      </div>
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
