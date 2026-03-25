import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { devWarn } from '../../utils/dev-warn.js';
import { customElement, property, state } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
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

  /**
   * When true, renders the divider as decorative only (role="presentation").
   * Screen readers will not announce decorative dividers.
   * @attr decorative
   */
  @property({ type: Boolean, reflect: true })
  decorative = false;

  /**
   * Optional text label rendered centered between the divider lines.
   * Also sets aria-label on the separator for assistive technologies.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label?: string;

  /** @internal */
  @state()
  private _hasLabel = false;

  /** @internal */
  private _checkSlot(slot: HTMLSlotElement): void {
    const nodes = slot.assignedNodes({ flatten: true });
    this._hasLabel = nodes.some((node) =>
      node.nodeType === Node.TEXT_NODE
        ? (node.textContent ?? '').trim().length > 0
        : node.nodeType === Node.ELEMENT_NODE,
    );
  }

  /** @internal */
  private _slotChangeHandler = (e: Event): void => {
    this._checkSlot(e.target as HTMLSlotElement);
  };

  override firstUpdated(_changedProperties: PropertyValues<this>): void {
    super.firstUpdated(_changedProperties);
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (slot) this._checkSlot(slot);
    if (!this.decorative && !this.label && !this._hasLabel) {
      devWarn(
        'hx-divider',
        'Non-decorative separator has no accessible name. Provide a `label` attribute or slot content, or set `decorative` to suppress this warning (WCAG 4.1.2).',
      );
    }
  }

  override render() {
    const isDecorative = this.decorative;
    const showLabel = this._hasLabel || !!this.label;

    return html`
      <div
        part="base"
        class="divider${showLabel ? ' divider--labeled' : ''}"
        role="${isDecorative ? 'presentation' : 'separator'}"
        aria-orientation="${isDecorative ? nothing : this.orientation}"
        aria-label="${!isDecorative && this.label ? this.label : nothing}"
      >
        <span class="divider__line"></span>
        ${showLabel
          ? html`<span part="label" class="divider__label">
              ${this.label ? html`${this.label}` : nothing}
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

/** Canonical type alias for the hx-divider component. */
export type HxDivider = HelixDivider;

/** @deprecated Use {@link HxDivider} instead. The `Wc` prefix was a legacy naming convention. */
export type WcDivider = HelixDivider;
