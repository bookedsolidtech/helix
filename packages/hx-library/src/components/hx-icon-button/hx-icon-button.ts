import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
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
   * `title` on the underlying element. The component renders nothing when absent,
   * and a console warning is emitted to alert developers during authoring.
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
      // P1-03 fix: disabled anchor must set tabindex="-1" explicitly — an <a>
      // without href is non-focusable by default in most browsers, but this is
      // browser-dependent. Explicit tabindex="-1" guarantees keyboard exclusion
      // across all conforming browsers.
      // P1-07 note: aria-disabled IS required on the anchor branch because
      // <a> elements have no native disabled attribute; aria-disabled is the
      // only AT signal available.
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

    // P1-07 fix: aria-disabled is redundant on a natively disabled <button>.
    // The native disabled attribute already exposes aria-disabled="true"
    // implicitly in the accessibility tree. Duplicate explicit aria-disabled
    // creates ambiguity about design intent. Keep only native ?disabled.
    return html`
      <button
        part="button"
        class=${classMap(this._classes())}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-label=${normalizedLabel}
        title=${normalizedLabel}
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
