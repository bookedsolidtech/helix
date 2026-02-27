import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixButtonStyles } from './hx-button.styles.js';

/**
 * A button component for user interaction.
 *
 * @summary Primary interactive element for triggering actions.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked (not disabled).
 *
 * @csspart button - The native button element.
 *
 * @cssprop [--hx-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-button')
export class HelixButton extends LitElement {
  static override styles = [tokenStyles, helixButtonStyles];

  /**
   * Visual style variant of the button.
   * @attr variant
   * @default 'primary'
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'ghost' = 'primary';

  /**
   * Size of the button.
   * @attr hx-size
   * @default 'md'
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled.
   * @attr disabled
   * @default false
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The type attribute for the underlying button element.
   * @attr type
   * @default 'button'
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

    if (!this.shouldHandleClick(e)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    /**
     * Dispatched when the button is clicked.
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );

    // Handle form submission/reset if form-associated
    if (this.type === 'submit' && this._internals.form) {
      this._internals.form.requestSubmit();
    } else if (this.type === 'reset' && this._internals.form) {
      this._internals.form.reset();
    }

    this.afterClick(e);
  }

  // ─── Extension API ───

  /**
   * Override to customize the CSS classes applied to the native button element.
   * Called during render. Merge with super's result to preserve base styling.
   * @protected
   * @since 1.0.0
   */
  protected getButtonClasses(): Record<string, boolean> {
    return {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
    };
  }

  /**
   * Override to customize the content rendered inside the button.
   * @protected
   * @since 1.0.0
   */
  protected renderContent(): unknown {
    return html`<slot></slot>`;
  }

  /**
   * Called before the click is processed. Return false to cancel the click.
   * Only invoked when the button is not disabled.
   * @protected
   * @since 1.0.0
   */
  protected shouldHandleClick(_e: MouseEvent): boolean {
    return true;
  }

  /**
   * Called after the click is fully processed (event dispatched, form action taken).
   * @protected
   * @since 1.0.0
   */
  protected afterClick(_e: MouseEvent): void {
    // no-op — override to add post-click behavior
  }

  // ─── Render ───

  override render() {
    return html`
      <button
        part="button"
        class=${classMap(this.getButtonClasses())}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-disabled=${this.disabled ? 'true' : nothing}
        @click=${this._handleClick}
      >
        ${this.renderContent()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}
