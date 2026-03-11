import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixSpinnerStyles } from './hx-spinner.styles.js';

/**
 * A circular loading indicator for inline and overlay loading states.
 * Purely visual — no slots. Announces loading state to screen readers via
 * `role="status"` and an `aria-label` (customizable via the `label` prop).
 *
 * When used alongside visible loading text, set `decorative` to suppress
 * duplicate AT announcements.
 *
 * @summary Circular loading indicator component.
 *
 * @tag hx-spinner
 *
 * @csspart base - The SVG spinner element.
 *
 * @cssprop [--hx-spinner-color] - Spinner arc color. Defaults per variant.
 * @cssprop [--hx-spinner-track-color] - Spinner track color. Defaults per variant.
 * @cssprop [--hx-duration-spinner] - Duration of the rotation animation. Defaults to 750ms.
 */
@customElement('hx-spinner')
export class HelixSpinner extends LitElement {
  static override styles = [tokenStyles, helixSpinnerStyles];

  /**
   * Size of the spinner. Accepts 'sm' | 'md' | 'lg' token values, or any
   * valid CSS size string (e.g. "3rem", "48px").
   *
   * Note: `'sm' | 'md' | 'lg' | string` intentionally degrades to `string`
   * at the TypeScript level to allow CSS size values as a convenience override.
   * This is a deliberate design choice — use token values for standard sizing.
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
   * Reflected as an attribute for Drupal/Twig compatibility.
   * @attr label
   */
  @property({ type: String, reflect: true })
  label = 'Loading';

  /**
   * When true, the spinner is decorative and suppresses all ARIA announcements.
   * Use this when the spinner appears alongside visible loading text to prevent
   * duplicate announcements. Sets `role="presentation"` and removes `aria-label`.
   * @attr decorative
   */
  @property({ type: Boolean, reflect: true })
  decorative = false;

  private _isTokenSize(): boolean {
    return this.size === 'sm' || this.size === 'md' || this.size === 'lg';
  }

  override render() {
    const customSizeStyle =
      !this._isTokenSize() && this.size ? styleMap({ '--_spinner-size': this.size }) : styleMap({});

    // Decorative spinners use role="presentation" to suppress AT announcements.
    // Non-decorative spinners use role="status" with aria-label for accessible naming.
    // Guard against empty label (aria-label="" is a WCAG failure).
    const role = this.decorative ? 'presentation' : 'status';
    const ariaLabel = this.decorative ? undefined : this.label || undefined;

    return html`
      <div
        class="spinner"
        part="base"
        style=${customSizeStyle}
        role=${role}
        aria-label=${ifDefined(ariaLabel)}
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
