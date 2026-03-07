import { LitElement, html, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixDividerStyles } from './hx-divider.styles.js';

/**
 * A visual separator element for dividing content sections. Supports
 * horizontal and vertical orientations, configurable spacing, and an optional
 * centered label rendered between two lines.
 *
 * @summary Horizontal or vertical separator line with optional label.
 *
 * @tag hx-divider
 *
 * @slot - Optional label text rendered centered between two lines.
 *
 * @csspart base - The root divider element.
 * @csspart label - The optional centered label wrapper.
 *
 * @cssprop [--hx-divider-color=var(--hx-color-neutral-200)] - Line color.
 * @cssprop [--hx-divider-width=var(--hx-border-width-thin)] - Line thickness.
 * @cssprop [--hx-divider-label-color=var(--hx-color-neutral-500)] - Label text color.
 * @cssprop [--hx-divider-label-font-size=var(--hx-font-size-sm)] - Label font size.
 * @cssprop [--hx-divider-label-gap=var(--hx-space-3)] - Gap between lines and label.
 */
@customElement('hx-divider')
export class HelixDivider extends LitElement {
  static override styles = [tokenStyles, helixDividerStyles];

  /**
   * Orientation of the divider.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Spacing applied to the block axis (horizontal) or inline axis (vertical).
   * @attr spacing
   */
  @property({ type: String, reflect: true })
  spacing: 'none' | 'sm' | 'md' | 'lg' = 'md';

  @state()
  private _hasLabel = false;

  private _checkSlot(slot: HTMLSlotElement): void {
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasLabel = nodes.some((node) =>
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent ?? '').trim().length > 0
        : node.nodeType === Node.ELEMENT_NODE,
    );
  }

  private _slotChangeHandler = (e: Event): void => {
    this._checkSlot(e.target as HTMLSlotElement);
  };

  override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (slot) this._checkSlot(slot);
  }

  override render() {
    return html`
      <div part="base" class="divider" role="separator" aria-orientation=${this.orientation}>
        <span class="divider__line"></span>
        ${this._hasLabel
          ? html`<span part="label" class="divider__label">
              <slot @slotchange=${this._slotChangeHandler}></slot>
            </span>`
          : html`<slot @slotchange=${this._slotChangeHandler}></slot>`}
        <span class="divider__line"></span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-divider': HelixDivider;
  }
}
