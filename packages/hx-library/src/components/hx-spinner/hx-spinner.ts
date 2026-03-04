import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSpinnerStyles } from './hx-spinner.styles.js';

/**
 * A circular loading indicator for communicating in-progress state.
 * Designed for healthcare interfaces where loading state clarity is critical.
 *
 * @summary Circular spinner for communicating loading and in-progress state.
 *
 * @tag hx-spinner
 *
 * @csspart spinner - The outer container element with role="status".
 * @csspart track - The full-circle background track.
 * @csspart indicator - The animated arc that rotates to indicate progress.
 *
 * @cssprop [--hx-spinner-size] - Override width and height. Defaults are set per size variant.
 * @cssprop [--hx-spinner-border-width=2px] - Thickness of the spinner ring.
 * @cssprop [--hx-spinner-duration=0.75s] - Duration of one full rotation.
 * @cssprop [--hx-spinner-track-color=var(--hx-color-primary-200)] - Color of the static track ring.
 * @cssprop [--hx-spinner-indicator-color=var(--hx-color-primary-500)] - Color of the rotating arc.
 */
@customElement('hx-spinner')
export class HelixSpinner extends LitElement {
  static override styles = [tokenStyles, helixSpinnerStyles];

  // ─── Properties ───

  /**
   * Size of the spinner.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible label announced by screen readers.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Loading';

  /**
   * Visual color variant of the spinner.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'neutral' = 'primary';

  // ─── Render ───

  override render() {
    const classes = {
      spinner: true,
      [`spinner--${this.size}`]: true,
      [`spinner--${this.variant}`]: true,
    };

    return html`
      <span
        part="spinner"
        class=${classMap(classes)}
        role="status"
        aria-label=${this.label}
        aria-live="polite"
      >
        <span part="track" class="spinner__track"></span>
        <span part="indicator" class="spinner__indicator"></span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-spinner': HelixSpinner;
  }
}
