import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixStepStyles } from './hx-step.styles.js';

/**
 * An individual step, designed to be used inside an `<hx-steps>` container.
 * Represents a single step in a multi-step wizard or progress indicator.
 *
 * @summary Individual step item within an `<hx-steps>` progress indicator.
 *
 * @tag hx-step
 *
 * @slot icon - Custom icon for the step indicator. Shown when status is `pending` or `active`.
 * @slot label - Step label text. Falls back to the `label` property.
 * @slot description - Step description text. Falls back to the `description` property.
 *
 * @csspart base - The outermost wrapper element.
 * @csspart indicator - The circular step indicator.
 * @csspart connector - The line connecting this step to the next.
 * @csspart label - The step label element.
 * @csspart description - The step description element.
 *
 * @cssprop [--hx-steps-indicator-size=2rem] - Indicator circle diameter.
 * @cssprop [--hx-steps-indicator-font-size=var(--hx-font-size-sm)] - Indicator text size.
 * @cssprop [--hx-steps-indicator-icon-size=1rem] - Indicator icon size.
 * @cssprop [--hx-steps-label-font-size=var(--hx-font-size-sm)] - Label font size.
 * @cssprop [--hx-steps-description-font-size=var(--hx-font-size-xs)] - Description font size.
 * @cssprop [--hx-steps-connector-color=var(--hx-color-neutral-200)] - Connector line color.
 * @cssprop [--hx-steps-label-color=var(--hx-color-neutral-600)] - Label text color.
 * @cssprop [--hx-steps-description-color=var(--hx-color-neutral-500)] - Description text color.
 */
@customElement('hx-step')
export class HelixStep extends LitElement {
  static override styles = [tokenStyles, helixStepStyles];

  // ─── Public Properties ───

  /**
   * The step label text.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = '';

  /**
   * Current status of the step.
   * @attr status
   */
  @property({ type: String, reflect: true })
  status: 'pending' | 'active' | 'complete' | 'error' = 'pending';

  /**
   * Optional description text shown below the label.
   * @attr description
   */
  @property({ type: String, reflect: true })
  description = '';

  // ─── Internal Properties (set by parent hx-steps) ───

  /**
   * Layout orientation. Set by the parent `<hx-steps>` container.
   * @internal
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Size variant. Set by the parent `<hx-steps>` container.
   * @internal
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Zero-based index of this step. Set by the parent `<hx-steps>` container.
   * @internal
   */
  @property({ type: Number })
  index = 0;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
  }

  // ─── Event Handling ───

  private _handleClick(): void {
    /**
     * Internal event dispatched to signal step click to the parent container.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent('hx-step-click-internal', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ─── Render Helpers ───

  private _renderCheckmark() {
    return html`
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    `;
  }

  private _renderXMark() {
    return html`
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    `;
  }

  private _renderIndicatorContent() {
    if (this.status === 'complete') {
      return this._renderCheckmark();
    }
    if (this.status === 'error') {
      return this._renderXMark();
    }
    return html`<slot name="icon">${this.index + 1}</slot>`;
  }

  // ─── Render ───

  override render() {
    const isActive = this.status === 'active';

    return html`
      <div part="base" class="step" @click=${this._handleClick}>
        <div class="step__track">
          <div part="indicator" class="step__indicator" aria-current=${isActive ? 'step' : nothing}>
            ${this._renderIndicatorContent()}
          </div>
          <div part="connector" class="step__connector" aria-hidden="true"></div>
        </div>
        <div class="step__label-area">
          <div part="label" class="step__label">
            <slot name="label">${this.label}</slot>
          </div>
          <div part="description" class="step__description">
            <slot name="description">${this.description}</slot>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-step': HelixStep;
  }
}
