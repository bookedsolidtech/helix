import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixButtonGroupStyles } from './hx-button-group.styles.js';

/**
 * A container component that groups related hx-button elements into a cohesive
 * horizontal or vertical action set. Eliminates double borders between adjacent
 * buttons and squares off inner border-radius for a unified visual appearance.
 *
 * @summary Groups hx-button elements into a horizontal or vertical action set with shared borders.
 *
 * @tag hx-button-group
 *
 * @slot - Default slot accepting hx-button and hx-icon-button children.
 *
 * @csspart group - The container div element wrapping all slotted buttons.
 *
 * @cssprop [--hx-button-group-size=md] - Size token forwarded to child buttons. Accepts 'sm', 'md', or 'lg'.
 */
@customElement('hx-button-group')
export class HelixButtonGroup extends LitElement {
  static override styles = [tokenStyles, helixButtonGroupStyles];

  /**
   * Layout orientation of the button group.
   * @attr orientation
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Size applied to the button group and cascaded to child buttons via
   * the --hx-button-group-size CSS custom property.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  // ─── Lifecycle ───

  override updated(changedProperties: Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('size')) {
      this.style.setProperty('--hx-button-group-size', this.size);
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.style.setProperty('--hx-button-group-size', this.size);
  }

  // ─── Event Handling ───

  private _handleSlotChange(): void {
    // Notify the component that the slot content has changed so Lit can
    // re-evaluate slot-dependent CSS selectors (::slotted pseudo-elements).
    this.requestUpdate();
  }

  // ─── Render ───

  override render() {
    return html`
      <div
        part="group"
        class="group group--${this.orientation}"
        role="group"
      >
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button-group': HelixButtonGroup;
  }
}
