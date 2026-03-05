import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixButtonStyles } from './hx-button.styles.js';

/**
 * A production-grade button component for user interaction. Supports multiple
 * visual variants, sizes, loading state, prefix/suffix slots, anchor rendering,
 * and full ElementInternals form association.
 *
 * @summary Primary interactive element for triggering actions and form submission.
 *
 * @tag hx-button
 *
 * @slot - Default slot for button label text or content.
 * @slot prefix - Icon or content rendered before the label.
 * @slot suffix - Icon or content rendered after the label.
 *
 * @fires {CustomEvent<{originalEvent: MouseEvent}>} hx-click - Dispatched when
 *   the button is clicked and is neither disabled nor loading.
 *
 * @csspart button - The native button or anchor element.
 * @csspart label - The label text wrapper span.
 * @csspart prefix - The prefix slot container span.
 * @csspart suffix - The suffix slot container span.
 * @csspart spinner - The loading spinner SVG element.
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

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Public Properties ───

  /**
   * Visual style variant of the button.
   * @attr variant
   */
  @property({ type: String, reflect: true })
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' = 'primary';

  /**
   * Size of the button.
   * @attr hx-size
   */
  @property({ type: String, reflect: true, attribute: 'hx-size' })
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether the button is disabled. Prevents all interaction and form actions.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the button is in a loading state. Shows spinner, prevents interaction,
   * and sets aria-busy. Does not set the disabled attribute.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * The type attribute for the underlying button element. Ignored when href is set.
   * @attr type
   */
  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * When set, renders an anchor element instead of a button.
   * @attr href
   */
  @property({ type: String })
  href: string | undefined = undefined;

  /**
   * Anchor target attribute. Only used when href is set.
   * @attr target
   */
  @property({ type: String })
  target: string | undefined = undefined;

  /**
   * Form field name submitted via ElementInternals.setFormValue on submit.
   * @attr name
   */
  @property({ type: String })
  name: string | undefined = undefined;

  /**
   * Form field value submitted via ElementInternals.setFormValue on submit.
   * @attr value
   */
  @property({ type: String })
  value: string | undefined = undefined;

  // ─── Form API ───

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  // ─── Event Handling ───

  private _handleClick(e: MouseEvent): void {
    if (this.disabled || this.loading) {
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

    // Handle form submission/reset if form-associated and not in anchor mode
    if (this.href === undefined && this.type === 'submit' && this._internals.form) {
      if (this.name !== undefined && this.value !== undefined) {
        this._internals.setFormValue(this.value);
      }
      this._internals.form.requestSubmit();
    } else if (this.href === undefined && this.type === 'reset' && this._internals.form) {
      this._internals.form.reset();
    }
  }

  // ─── Render Helpers ───

  private _renderSpinner() {
    return html`
      <svg
        class="button__spinner"
        part="spinner"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          class="button__spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          opacity="0.3"
        />
        <path
          class="button__spinner-arc"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    `;
  }

  private _renderInner() {
    return html`
      ${this.loading ? this._renderSpinner() : nothing}
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
      [`button--${this.hxSize}`]: true,
      'button--loading': this.loading,
    };

    if (this.href !== undefined) {
      return html`
        <a
          part="button"
          class=${classMap(classes)}
          href=${this.disabled ? nothing : ifDefined(this.href)}
          target=${ifDefined(this.target)}
          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-busy=${this.loading ? 'true' : nothing}
          @click=${this._handleClick}
        >
          ${this._renderInner()}
        </a>
      `;
    }

    return html`
      <button
        part="button"
        class=${classMap(classes)}
        ?disabled=${this.disabled}
        type=${this.type}
        aria-busy=${this.loading ? 'true' : nothing}
        @click=${this._handleClick}
      >
        ${this._renderInner()}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HelixButton;
  }
}

/** @deprecated Use HelixButton */
export type WcButton = HelixButton;
