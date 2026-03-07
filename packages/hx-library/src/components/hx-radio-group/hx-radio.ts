import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixRadioStyles } from './hx-radio.styles.js';

/**
 * An individual radio button, designed to be used inside a `<hx-radio-group>`.
 *
 * @summary Presentational radio button managed by its parent radio group.
 *
 * @tag hx-radio
 *
 * @slot - Custom label content (overrides the label property).
 *
 * @csspart radio - The visual radio circle.
 * @csspart label - The label text.
 *
 * @cssprop [--hx-radio-size=var(--hx-size-5, 1.25rem)] - Radio circle size.
 * @cssprop [--hx-radio-border-color=var(--hx-color-neutral-300, #ced4da)] - Radio border color.
 * @cssprop [--hx-radio-checked-bg=var(--hx-color-primary-500, #2563EB)] - Checked background color.
 * @cssprop [--hx-radio-checked-border-color=var(--hx-color-primary-500, #2563EB)] - Checked border color.
 * @cssprop [--hx-radio-dot-color=var(--hx-color-neutral-0, #ffffff)] - Inner dot color when checked.
 * @cssprop [--hx-radio-focus-ring-color=var(--hx-focus-ring-color, #2563EB)] - Focus ring color.
 * @cssprop [--hx-radio-label-color=var(--hx-color-neutral-700, #343a40)] - Label text color.
 */
@customElement('hx-radio')
export class HelixRadio extends LitElement {
  static override styles = [tokenStyles, helixRadioStyles];

  constructor() {
    super();
    // Set role statically in constructor to eliminate the window before connectedCallback
    this.setAttribute('role', 'radio');
  }

  // ─── Properties ───

  /**
   * The value this radio represents.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Visible label text for the radio.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether this radio is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether this radio is checked. Managed by the parent group.
   * @attr checked
   */
  @property({ type: Boolean, reflect: true })
  checked = false;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-checked', String(this.checked));
    this.setAttribute('aria-disabled', String(this.disabled));
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('checked')) {
      this.setAttribute('aria-checked', String(this.checked));
    }
    if (changedProperties.has('disabled')) {
      this.setAttribute('aria-disabled', String(this.disabled));
    }
  }

  // ─── Internal IDs ───

  private _inputId = `hx-radio-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Event Handling ───

  private _handleClick(): void {
    if (this.disabled) {
      return;
    }

    /**
     * Internal event dispatched to signal selection to the parent group.
     * Not part of the public API.
     * @internal
     */
    this.dispatchEvent(
      new CustomEvent('hx-radio-select', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  // ─── Render ───

  override render() {
    const classes = {
      radio: true,
      'radio--checked': this.checked,
      'radio--disabled': this.disabled,
    };

    return html`
      <div class=${classMap(classes)} @click=${this._handleClick}>
        <input
          class="radio__input"
          type="radio"
          id=${this._inputId}
          .checked=${this.checked}
          ?disabled=${this.disabled}
          tabindex="-1"
          aria-hidden="true"
        />
        <span part="radio" class="radio__control" aria-hidden="true">
          <span class="radio__dot"></span>
        </span>
        <span part="label" class="radio__label">
          <slot>${this.label}</slot>
        </span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-radio': HelixRadio;
  }
}

/** @public Type alias for use in test files and consumers. */
export type WcRadio = HelixRadio;
