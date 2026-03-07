import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSpinnerStyles } from './hx-spinner.styles.js';

/**
 * A circular loading indicator for inline and overlay loading states.
 * Purely visual — no slots. Announces loading state to screen readers via
 * `role="status"` and an `aria-label` (customizable via the `label` prop).
 *
 * When `decorative` is set, the spinner becomes accessibility-silent
 * (`role="presentation"`, no `aria-label`), suitable for use alongside
 * text that already conveys loading state.
 *
 * @summary Circular loading indicator component.
 *
 * @tag hx-spinner
 *
 * @csspart base - The spinner wrapper element.
 *
 * @cssprop [--hx-spinner-color] - Spinner arc color. Defaults per variant.
 * @cssprop [--hx-spinner-track-color] - Spinner track color. Defaults per variant.
 * @cssprop [--hx-duration-spinner=750ms] - Rotation speed of the spinner animation.
 */
@customElement('hx-spinner')
export class HelixSpinner extends LitElement {
  static override styles = [tokenStyles, helixSpinnerStyles];

  /**
   * Size of the spinner. Accepts 'sm' | 'md' | 'lg' token values, or any
   * valid CSS size string (e.g. "3rem", "48px").
   * @attr size
   */
  @property({ type: String, reflect: true })
  size: 'sm' | 'md' | 'lg' | string = 'md';

  /**
   * Visual variant of the spinner.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'default' | 'primary' | 'inverted' = 'default';

  /**
   * Accessible label announced to screen readers. Defaults to "Loading".
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Loading';

  /**
   * When true, the spinner is purely decorative — no screen reader
   * announcement. Use when surrounding text already conveys loading state.
   * @attr decorative
   */
  @property({ type: Boolean, reflect: true })
  decorative = false;

  /**
   * Checks whether the current size value is a known token size.
   * @internal
   */
  private _isTokenSize(): boolean {
    return this.size === 'sm' || this.size === 'md' || this.size === 'lg';
  }

  override render() {
    const customSizeStyle =
      !this._isTokenSize() && this.size ? styleMap({ '--_spinner-size': this.size }) : styleMap({});

    return html`
      <div
        class="spinner"
        part="base"
        style=${customSizeStyle}
        role=${this.decorative ? 'presentation' : 'status'}
        aria-label=${this.decorative ? nothing : this.label}
      >
        <svg
          class="spinner__svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <circle class="spinner__track" cx="12" cy="12" r="10" stroke-width="2.5" fill="none" />
          <path
            class="spinner__arc"
            d="M12 2a10 10 0 0 1 10 10"
            stroke-width="2.5"
            stroke-linecap="round"
            fill="none"
          />
        </svg>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-spinner': HelixSpinner;
  }
}
