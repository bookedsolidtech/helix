import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixIconButtonStyles } from './hx-icon-button.styles.js';

/**
 * An icon-only button component for compact, accessible actions.
 * Renders a square button or anchor element containing a single icon.
 * The `label` property is required and provides the accessible name
 * via `aria-label` and a native tooltip via the `title` attribute.
 *
 * @summary Icon-only action button with full accessibility support.
 *
 * @tag hx-icon-button
 *
 * @slot - Icon element to display (hx-icon, svg, or img).
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when the button is clicked (not disabled).
 *
 * @csspart button - The native button or anchor element.
 * @csspart icon - The icon container span wrapping the default slot.
 *
 * @cssprop [--hx-icon-button-bg=transparent] - Button background color.
 * @cssprop [--hx-icon-button-color=var(--hx-color-primary-500)] - Icon color.
 * @cssprop [--hx-icon-button-border-color=transparent] - Button border color.
 * @cssprop [--hx-icon-button-border-radius=var(--hx-border-radius-md)] - Button border radius.
 * @cssprop [--hx-icon-button-size] - Explicit width and height override for the button.
 * @cssprop [--hx-icon-button-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 */
@customElement('hx-icon-button')
export class HelixIconButton extends LitElement {
  static override styles = [tokenStyles, helixIconButtonStyles];

  /**
   * Accessible name for the button. Required. Rendered as `aria-label` and
   * `title` on the underlying element. A console warning is emitted when absent.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' = 'ghost';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * The type attribute for the underlying button element.
   * Has no effect when `href` is set.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Whether the button is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * When set, renders an `<a>` element instead of a `<button>`.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Name submitted with form data. Only applicable when rendering as a button.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Value submitted with form data. Only applicable when rendering as a button.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

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

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    // Label validation now happens in render() which enforces it by rendering nothing
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
     * @event hx-click
     */
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        bubbles: true,
        composed: true,
        detail: { originalEvent: e },
      }),
    );

    // Handle form submission/reset if form-associated and not in href/link mode
    if (!this.href) {
      if (this.type === 'submit' && this._internals.form) {
        this._internals.form.requestSubmit();
      } else if (this.type === 'reset' && this._internals.form) {
        this._internals.form.reset();
      }
    }
  }

  // ─── Render Helpers ───

  private _normalizedLabel(): string {
    return this.label.trim();
  }

  private _classes() {
    return {
      button: true,
      [`button--${this.variant}`]: true,
      [`button--${this.size}`]: true,
    };
  }

  private _iconSlot() {
    return html`<span part="icon" class="icon"><slot></slot></span>`;
  }

  // ─── Render ───

  override render() {
    const normalizedLabel = this._normalizedLabel();
    if (!normalizedLabel) {
      console.warn(
        '[hx-icon-button] The `label` property is required for accessibility. Render suppressed.',
      );
      return nothing;
    }

    if (this.href !== undefined) {
      return html`
        <a
          part="button"
          class=${classMap(this._classes())}
          href=${ifDefined(this.disabled ? undefined : this.href)}
          aria-label=${normalizedLabel}
          title=${normalizedLabel}
          aria-disabled=${this.disabled ? 'true' : nothing}
          tabindex=${this.disabled ? '-1' : nothing}
          @click=${this._handleClick}
        >
          ${this._iconSlot()}
        </a>
      `;
    }

    return html`
      <button
        part="button"
        class=${classMap(this._classes())}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-label=${normalizedLabel}
        title=${normalizedLabel}
        aria-disabled=${this.disabled ? 'true' : nothing}
        name=${ifDefined(this.name)}
        value=${ifDefined(this.value)}
        @click=${this._handleClick}
      >
        ${this._iconSlot()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-icon-button': HelixIconButton;
  }
}
