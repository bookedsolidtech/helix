import { LitElement, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSearchStyles } from './hx-search.styles.js';

/**
 * A search input component with built-in search icon, clear button,
 * debounced search dispatch, loading state, and form association.
 *
 * @summary Form-associated search input with debounce, clear button, and suggestions slot.
 *
 * @tag hx-search
 *
 * @slot - Default slot for custom label content.
 * @slot suggestions - Content rendered below the input for search suggestions.
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on every keystroke as the user types.
 * @fires {CustomEvent<{query: string}>} hx-search - Dispatched on Enter key or after 300ms debounce since last keystroke.
 * @fires {CustomEvent<Record<string, never>>} hx-clear - Dispatched when the clear button is clicked or clear() is called.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around search icon, input, and clear button.
 * @csspart input - The native input element.
 * @csspart search-icon - The search icon or loading spinner container.
 * @csspart clear-button - The clear button element.
 * @csspart suggestions - The suggestions slot wrapper.
 *
 * @cssprop [--hx-search-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-search-border-color=var(--hx-color-neutral-300)] - Input border color.
 * @cssprop [--hx-search-border-radius=var(--hx-border-radius-md)] - Input border radius.
 * @cssprop [--hx-search-font-family=var(--hx-font-family-sans)] - Input font family.
 * @cssprop [--hx-search-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-search-icon-color=var(--hx-color-neutral-500)] - Search icon color.
 * @cssprop [--hx-search-clear-color=var(--hx-color-neutral-400)] - Clear button icon color.
 */
@customElement('hx-search')
export class HelixSearch extends LitElement {
  static override styles = [tokenStyles, helixSearchStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name of the input, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The current value of the search input.
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * Placeholder text shown when the input is empty.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = 'Search...';

  /**
   * The visible label text for the input.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the input is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Whether the component is in a loading state. Replaces the search icon with a spinner.
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Controls the visual size of the component.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size' })
  hxSize: 'sm' | 'md' | 'lg' = 'md';

  // ─── Internal References ───

  @query('.field__input')
  private _input!: HTMLInputElement;

  // ─── Debounce Timer ───

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Unique IDs ───

  private _inputId = `hx-search-${Math.random().toString(36).slice(2, 9)}`;
  private _labelId = `hx-search-label-${Math.random().toString(36).slice(2, 9)}`;

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
    }
  }

  // ─── Form Integration ───

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** Returns the validation message. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Checks whether the input satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /** Called by the form when it resets. */
  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  /** Called when the form restores state (e.g., back/forward navigation). */
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Event Handling ───

  private _handleInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
    this._internals.setFormValue(this.value);

    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );

    this._scheduleDebouncedSearch();
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      if (this._debounceTimer !== null) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = null;
      }
      this._dispatchSearch();
    } else if (e.key === 'Escape') {
      if (this.value) {
        this._handleClear();
      }
    }
  }

  private _handleClear(): void {
    this.value = '';
    this._internals.setFormValue('');

    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    this.dispatchEvent(
      new CustomEvent('hx-clear', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );

    this._input?.focus();
  }

  private _scheduleDebouncedSearch(): void {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this._dispatchSearch();
    }, 300);
  }

  private _dispatchSearch(): void {
    this.dispatchEvent(
      new CustomEvent('hx-search', {
        bubbles: true,
        composed: true,
        detail: { query: this.value },
      }),
    );
  }

  // ─── Public Methods ───

  /** Moves focus to the internal input element. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  /** Clears the current value, dispatches hx-clear, and focuses the input. */
  clear(): void {
    if (this.disabled) return;
    this._handleClear();
  }

  // ─── SVG Templates ───

  private _renderSearchIcon() {
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 110-10 5 5 0 010 10z"
      />
    </svg>`;
  }

  private _renderSpinner() {
    return html`<svg
      class="field__spinner"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      aria-hidden="true"
    >
      <path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      />
    </svg>`;
  }

  private _renderClearIcon() {
    return html`<svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>`;
  }

  // ─── Render ───

  override render() {
    const fieldClasses = {
      field: true,
      [`field--${this.hxSize}`]: true,
      'field--loading': this.loading,
      'field--disabled': this.disabled,
    };

    return html`
      <div
        part="field"
        role="search"
        class=${classMap(fieldClasses)}
        aria-label=${ifDefined(this.label || 'Search')}
        aria-busy=${this.loading ? 'true' : nothing}
      >
        <div class="field__label-wrapper">
          ${this.label
            ? html`
                <label part="label" class="field__label" id=${this._labelId} for=${this._inputId}>
                  ${this.label}
                </label>
              `
            : nothing}
          <slot></slot>
        </div>

        <div part="input-wrapper" class="field__input-wrapper">
          <span part="search-icon" class="field__search-icon">
            ${this.loading ? this._renderSpinner() : this._renderSearchIcon()}
          </span>

          <input
            part="input"
            class="field__input"
            id=${this._inputId}
            type="search"
            .value=${live(this.value)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.label ? undefined : 'Search')}
            aria-labelledby=${ifDefined(this.label ? this._labelId : undefined)}
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
          />

          ${this.value && !this.disabled
            ? html`
                <button
                  part="clear-button"
                  class="field__clear-btn"
                  type="button"
                  aria-label="Clear search"
                  @click=${this._handleClear}
                >
                  ${this._renderClearIcon()}
                </button>
              `
            : nothing}
        </div>

        <div part="suggestions" class="field__suggestions">
          <slot name="suggestions"></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-search': HelixSearch;
  }
}
