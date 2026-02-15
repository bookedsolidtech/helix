import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@wc-2026/tokens/lit';
import { wcButtonStyles } from './wc-button.styles.js';

/**
 * A button component for user interaction.
 *
 * @summary Primary interactive element for triggering actions.
 *
 * @tag wc-button
 *
 * @slot - Default slot for button label text or content.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} wc-click - Dispatched when the button is clicked (not disabled).
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--wc-button-bg=var(--wc-color-primary-500)] - Button background color.
 * @cssprop [--wc-button-color=var(--wc-color-neutral-0)] - Button text color.
 * @cssprop [--wc-button-border-color=transparent] - Button border color.
 * @cssprop [--wc-button-border-radius=var(--wc-border-radius-md)] - Button border radius.
 * @cssprop [--wc-button-font-family=var(--wc-font-family-sans)] - Button font family.
 * @cssprop [--wc-button-font-weight=var(--wc-font-weight-semibold)] - Button font weight.
 * @cssprop [--wc-button-focus-ring-color=var(--wc-focus-ring-color)] - Focus ring color.
 */
@customElement('wc-button')
export class WcButton extends LitElement {
  static override styles = [tokenStyles, wcButtonStyles];

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  /**
   * Size of the button.
   * @attr wc-size
   */
  @property({ type: String, reflect: true, attribute: 'wc-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The type attribute for the underlying button element.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  // ─── Form Association via ElementInternals ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the button is clicked.
     * @event wc-click
     */
    this.dispatchEvent(
      new CustomEvent('wc-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      })
    );

    // Handle form submission/reset if form-associated
    if (this.type === 'submit' && this._internals.form) {
      this._internals.form.requestSubmit();
    } else if (this.type === 'reset' && this._internals.form) {
      this._internals.form.reset();
    }
  }

  // ─── Render ───

  override render() {
    const classes = {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
    };

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wc-button': WcButton;
  }
}
