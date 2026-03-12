import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixToggleButtonStyles } from './hx-toggle-button.styles.js';

/**
 * A two-state toggle button that communicates a pressed/unpressed status to
 * assistive technology via `aria-pressed`. Supports multiple visual variants
 * and sizes, prefix/suffix slots, full ElementInternals form association, and
 * a distinct pressed visual state for every variant.
 *
 * @summary Two-state toggle button with pressed/unpressed ARIA semantics.
 *
 * @tag hx-toggle-button
 *
 * @slot - Default slot for the button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{pressed: boolean}>} hx-toggle - Dispatched when the
 *   toggle state changes. Not dispatched when the button is disabled.
 *
 * @csspart button - The native `<button>` element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 *
 * @cssprop [--hx-toggle-button-bg=var(--hx-color-primary-500)] - Button background color.
 * @cssprop [--hx-toggle-button-color=var(--hx-color-neutral-0)] - Button text color.
 * @cssprop [--hx-toggle-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-toggle-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-toggle-button-font-family=var(--hx-font-family-sans)] - Button font family.
 * @cssprop [--hx-toggle-button-font-weight=var(--hx-font-weight-semibold)] - Button font weight.
 * @cssprop [--hx-toggle-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-toggle-button-pressed-bg=var(--hx-color-primary-500)] - Background when pressed (variant-specific fallback applies).
 * @cssprop [--hx-toggle-button-pressed-color=var(--hx-color-neutral-0)] - Text color when pressed (variant-specific fallback applies).
 */
@customElement('hx-toggle-button')
export class HelixToggleButton extends LitElement {
  static override styles = [tokenStyles, helixToggleButtonStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Public Properties ───

  /**
   * Whether the toggle button is in the pressed state.
   * Reflected as an attribute so CSS selectors like `:host([pressed])` work.
   * @attr pressed
   */
  @property({ type: Boolean, reflect: true })
  pressed = false;

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline' = 'secondary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. Prevents all interaction and form actions.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Form field name submitted via ElementInternals when the button is pressed.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Form field value submitted via ElementInternals when the button is pressed.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  /**
   * Accessible label forwarded to the inner `<button>` as `aria-label`.
   * Required for icon-only toggle buttons where no visible text is present.
   * @attr label
   */
  @property({ type: String })
  label: string | undefined = undefined;

  // ─── Form API ───

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('pressed') || changedProperties.has('value')) {
      this._syncFormValue();
    }
  }

  /** Called by the browser when the associated form is reset. */
  formResetCallback(): void {
    this.pressed = false;
  }

  /** Called by the browser when restoring form state (e.g. bfcache). */
  formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    this.pressed = typeof state === 'string' && state === 'pressed';
  }

  // ─── Private Helpers ───

  private _syncFormValue(): void {
    if (this.pressed && this.value !== undefined) {
      // Pass explicit state 'pressed' so formStateRestoreCallback can reliably detect it.
      this._internals.setFormValue(this.value, 'pressed');
    } else {
      this._internals.setFormValue(null);
    }
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    this.pressed = !this.pressed;
    this._syncFormValue();

    /**
     * Dispatched when the toggle state changes.
     * @event hx-toggle
     */
    this.dispatchEvent(
      new CustomEvent('hx-toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: this.pressed },
      }),
    );
  }

  // ─── Render Helpers ───

  private _renderInner() {
    return html`
      <span part="prefix" class="button__prefix">
        <slot name="prefix"></slot>
      </span>
      <span part="label" class="button__label">
        <slot></slot>
      </span>
      <span part="suffix" class="button__suffix">
        <slot name="suffix"></slot>
      </span>
    `;
  }

  // ─── Render ───

  override render() {
    const classes = {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
      'button--pressed': this.pressed,
    };

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type="button"
        aria-pressed=${this.pressed ? 'true' : 'false'}
        aria-label=${this.label ?? nothing}
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-toggle-button': HelixToggleButton;
  }
}
