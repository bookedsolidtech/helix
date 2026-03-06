import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixComboboxStyles } from './hx-combobox.styles.js';

// ─── Internal option model ───

interface ComboboxOption {
  value: string;
  label: string;
  disabled: boolean;
}

/**
 * A form-associated combobox component combining a text input with a listbox
 * for autocomplete and typeahead. Supports filtering, free-text entry,
 * keyboard navigation, and async option loading.
 *
 * @summary Form-associated combobox with autocomplete, filtering, and keyboard navigation.
 *
 * @tag hx-combobox
 *
 * @slot option - Slot for `<option>` elements that populate the listbox.
 * @slot prefix - Content to display before the text input.
 * @slot suffix - Content to display after the text input.
 * @slot empty-label - Content shown when no options match the filter.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched on each keystroke as the user types.
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when an option is selected.
 * @fires {CustomEvent<void>} hx-clear - Dispatched when the clear button is activated.
 * @fires {CustomEvent<void>} hx-show - Dispatched when the listbox opens.
 * @fires {CustomEvent<void>} hx-hide - Dispatched when the listbox closes.
 *
 * @csspart input - The native text input element.
 * @csspart listbox - The dropdown panel containing options.
 * @csspart trigger - The input wrapper element acting as the combobox trigger.
 * @csspart clear-button - The button that clears the current value.
 * @csspart loading-indicator - The loading spinner shown during async operations.
 *
 * @cssprop [--hx-combobox-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-combobox-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-combobox-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-combobox-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-combobox-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-combobox-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-combobox-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-combobox-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-combobox-listbox-bg=var(--hx-color-neutral-0)] - Listbox background color.
 * @cssprop [--hx-combobox-option-hover-bg=var(--hx-color-primary-50)] - Option hover background.
 * @cssprop [--hx-combobox-option-selected-bg=var(--hx-color-primary-100)] - Selected option background.
 */
@customElement('hx-combobox')
export class HelixCombobox extends LitElement {
  static override styles = [tokenStyles, helixComboboxStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Stable IDs ───

  private _id = `hx-combobox-${Math.random().toString(36).slice(2, 9)}`;
  private _listboxId = `${this._id}-listbox`;
  private _helpTextId = `${this._id}-help`;
  private _errorId = `${this._id}-error`;

  // ─── Public Properties ───

  /**
   * The visible label text for the combobox.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown in the input when no value is entered.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the combobox.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Whether the combobox is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the combobox is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The name used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Help text displayed below the combobox for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Size variant of the combobox.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Whether multiple options can be selected.
   * @attr multiple
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Whether the combobox shows a clear button when a value is set.
   * @attr clearable
   */
  @property({ type: Boolean, reflect: true })
  clearable = false;

  /**
   * Whether the combobox is in a loading state (shows spinner).
   * @attr loading
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Debounce delay in milliseconds for the filter input event.
   * @attr filter-debounce
   */
  @property({ type: Number, attribute: 'filter-debounce' })
  filterDebounce = 0;

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  // ─── Internal State ───

  @state() private _options: ComboboxOption[] = [];
  @state() private _filterText = '';
  @state() private _open = false;
  @state() private _focusedOptionIndex = -1;
  @state() private _hasErrorSlot = false;

  // ─── Queries ───

  @query('.field__input')
  private _input!: HTMLInputElement;

  // ─── Debounce timer ───

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Filtered options ───

  private get _filteredOptions(): ComboboxOption[] {
    if (!this._filterText) return this._options;
    const lower = this._filterText.toLowerCase();
    return this._options.filter((o) => o.label.toLowerCase().includes(lower));
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this._updateFormValue();
      this._updateValidity();
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

  /** Checks whether the combobox satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateFormValue(): void {
    this._internals.setFormValue(this.value || null);
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select an option.',
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** Called by the browser when the owning form resets. */
  formResetCallback(): void {
    this.value = '';
    this._filterText = '';
    this._internals.setFormValue(null);
  }

  /** Called when the browser restores form state (e.g., bfcache navigation). */
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Option Syncing from Slot ───

  private _handleSlotChange(): void {
    this._readOptions();
  }

  private _parseOption(el: HTMLOptionElement): ComboboxOption {
    return { value: el.value, label: el.textContent?.trim() ?? el.value, disabled: el.disabled };
  }

  private _readOptions(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="option"]');
    if (!slot) return;

    const parsed: ComboboxOption[] = [];

    for (const el of slot.assignedElements({ flatten: true })) {
      if (el instanceof HTMLOptionElement) {
        parsed.push(this._parseOption(el));
      } else if (el instanceof HTMLOptGroupElement) {
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLOptionElement) parsed.push(this._parseOption(child));
        }
      }
    }

    this._options = parsed;
  }

  // ─── Slot Change Handlers ───

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Dropdown Control ───

  private _openDropdown(): void {
    if (this.disabled || this._open) return;
    this._open = true;
    this._focusedOptionIndex = -1;
    this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
  }

  private _closeDropdown(): void {
    if (!this._open) return;
    this._open = false;
    this._focusedOptionIndex = -1;
    this.dispatchEvent(new CustomEvent('hx-hide', { bubbles: true, composed: true }));
  }

  // ─── Input Handling ───

  private _handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this._filterText = input.value;

    if (!this._open) {
      this._openDropdown();
    }

    this._focusedOptionIndex = -1;

    if (this.filterDebounce > 0) {
      if (this._debounceTimer !== null) {
        clearTimeout(this._debounceTimer);
      }
      this._debounceTimer = setTimeout(() => {
        this._emitInput();
      }, this.filterDebounce);
    } else {
      this._emitInput();
    }
  }

  private _emitInput(): void {
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this._filterText },
      }),
    );
  }

  private _handleFocus(): void {
    this._openDropdown();
  }

  // ─── Keyboard Navigation ───

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const filtered = this._filteredOptions;
    const enabledIndices = filtered
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled)
      .map(({ i }) => i);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : -1;
          break;
        }
        const nextDown = enabledIndices.find((i) => i > this._focusedOptionIndex);
        this._focusedOptionIndex =
          nextDown !== undefined ? nextDown : (enabledIndices[0] ?? this._focusedOptionIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          const lastEnabled = enabledIndices[enabledIndices.length - 1];
          this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : -1;
          break;
        }
        const prevUp = [...enabledIndices].reverse().find((i) => i < this._focusedOptionIndex);
        const lastEnabledUp = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex =
          prevUp !== undefined ? prevUp : (lastEnabledUp ?? this._focusedOptionIndex);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (!this._open) {
          this._openDropdown();
          break;
        }
        if (this._focusedOptionIndex >= 0 && this._focusedOptionIndex < filtered.length) {
          const opt = filtered[this._focusedOptionIndex];
          if (opt) this._selectOption(opt);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this._closeDropdown();
        this._filterText = '';
        if (this._input) this._input.value = '';
        break;
      }
      case 'Tab': {
        this._closeDropdown();
        break;
      }
      default:
        break;
    }
  }

  // ─── Selection ───

  private _selectOption(option: ComboboxOption): void {
    if (option.disabled) return;
    this.value = option.value;
    this._filterText = '';
    if (this._input) this._input.value = '';
    this._dispatchChange();
    this._closeDropdown();
  }

  // ─── Clear ───

  private _handleClear(e: Event): void {
    e.stopPropagation();
    this.value = '';
    this._filterText = '';
    if (this._input) {
      this._input.value = '';
      this._input.focus();
    }
    this._internals.setFormValue(null);
    this._updateValidity();
    this.dispatchEvent(new CustomEvent('hx-clear', { bubbles: true, composed: true }));
  }

  // ─── Event Dispatchers ───

  private _dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  // ─── Outside Click Handler ───

  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this._open && !e.composedPath().includes(this)) {
      this._closeDropdown();
    }
  };

  // ─── Public Methods ───

  /** Moves focus to the text input. */
  override focus(options?: FocusOptions): void {
    this._input?.focus(options);
  }

  // ─── Render Helpers ───

  private _optionId(index: number): string {
    return `${this._id}-option-${index}`;
  }

  private get _displayValue(): string {
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  private _renderOptions() {
    const filtered = this._filteredOptions;

    if (filtered.length === 0) {
      return html`
        <slot name="empty-label">
          <div class="field__no-options">No options found</div>
        </slot>
      `;
    }

    return filtered.map((opt, index) => {
      const isSelected = opt.value === this.value;
      const isFocused = index === this._focusedOptionIndex;

      return html`
        <div
          id=${this._optionId(index)}
          part="option"
          role="option"
          class=${classMap({
            field__option: true,
            'field__option--selected': isSelected,
            'field__option--focused': isFocused,
            'field__option--disabled': opt.disabled,
          })}
          aria-selected=${isSelected ? 'true' : 'false'}
          aria-disabled=${opt.disabled ? 'true' : nothing}
          @click=${() => this._selectOption(opt)}
        >
          <span class="field__option-label">${opt.label}</span>
        </div>
      `;
    });
  }

  // ─── Main Render ───

  override render() {
    const hasError = !!this.error;
    const showClear = this.clearable && !!this.value && !this.disabled;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--open': this._open,
    };

    const inputClasses = {
      field__input: true,
      [`field__input--${this.size}`]: true,
    };

    const describedBy =
      [
        hasError || this._hasErrorSlot ? this._errorId : null,
        this.helpText ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const activedescendant =
      this._open && this._focusedOptionIndex >= 0
        ? this._optionId(this._focusedOptionIndex)
        : undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label">
          ${this.label
            ? html`<label part="label" class="field__label" for=${this._id}>
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <!-- Input Wrapper -->
        <div part="trigger" class="field__input-wrapper">
          <!-- Prefix Slot -->
          <slot name="prefix" class="field__prefix"></slot>

          <!-- Text Input (combobox role) -->
          <input
            part="input"
            type="text"
            id=${this._id}
            class=${classMap(inputClasses)}
            role="combobox"
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-autocomplete="list"
            aria-controls=${this._listboxId}
            aria-activedescendant=${ifDefined(activedescendant)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-multiselectable=${this.multiple ? 'true' : nothing}
            .value=${this._filterText || (this._open ? '' : this._displayValue)}
            placeholder=${ifDefined(this.placeholder || undefined)}
            ?disabled=${this.disabled}
            ?required=${this.required}
            name=${ifDefined(this.name || undefined)}
            autocomplete="off"
            @input=${this._handleInput}
            @focus=${this._handleFocus}
            @keydown=${this._handleKeydown}
          />

          <!-- Loading Indicator -->
          ${this.loading
            ? html`
                <div part="loading-indicator" class="field__loading-indicator" aria-hidden="true">
                  <div class="field__loading-spinner"></div>
                </div>
              `
            : nothing}

          <!-- Clear Button -->
          ${showClear
            ? html`
                <button
                  part="clear-button"
                  type="button"
                  class="field__clear-button"
                  aria-label="Clear"
                  tabindex="-1"
                  @click=${this._handleClear}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1 1L11 11M11 1L1 11"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              `
            : nothing}

          <!-- Suffix Slot -->
          <slot name="suffix" class="field__suffix"></slot>
        </div>

        <!-- Listbox -->
        <div
          part="listbox"
          role="listbox"
          id=${this._listboxId}
          class="field__listbox"
          aria-label=${ifDefined(this.label || this.ariaLabel || undefined)}
          aria-multiselectable=${this.multiple ? 'true' : nothing}
          ?hidden=${!this._open}
        >
          <div class="field__options">${this._renderOptions()}</div>
        </div>

        <!-- Hidden slot (options read from here) -->
        <slot name="option" @slotchange=${this._handleSlotChange} style="display:none;"></slot>

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div
                part="error"
                class="field__error"
                id=${this._errorId}
                role="alert"
                aria-live="polite"
              >
                ${this.error}
              </div>`
            : nothing}
        </slot>

        <!-- Help Text -->
        ${this.helpText && !hasError
          ? html`
              <div part="help-text" class="field__help-text" id=${this._helpTextId}>
                <slot name="help-text">${this.helpText}</slot>
              </div>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-combobox': HelixCombobox;
  }
}

export type { HelixCombobox as HxCombobox };
