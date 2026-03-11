import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixSelectStyles } from './hx-select.styles.js';

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
let _hxSelectIdCounter = 0;

// ─── Internal option model ───

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

/**
 * A form-associated select component with custom styling, label, error, and
 * help text. Options are provided via slotted `<option>` (and `<optgroup>`)
 * elements in the light DOM. The component wraps a hidden native `<select>`
 * for form participation and provides a combobox trigger for consistent
 * cross-browser styling.
 *
 * @remarks Multi-select is intentionally not supported. This component
 * implements a single-value select (combobox) pattern only. For multi-value
 * selection use a separate multi-select component.
 *
 * @remarks The listbox panel uses `position: absolute` and may be clipped by
 * ancestor elements with `overflow: hidden` or `overflow: auto`. This is a
 * known limitation when embedding the component inside cards, tables, or
 * dialogs. Use the CSS custom property `--hx-select-listbox-shadow` or
 * restructure the containing layout to avoid clipping.
 *
 * @summary Form-associated custom select with label, error, and help text.
 *
 * @tag hx-select
 *
 * @slot - Default slot for `<option>` and `<optgroup>` elements.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected option changes.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart select-wrapper - The wrapper containing the trigger and listbox.
 * @csspart select - The hidden native select element (kept for form participation).
 * @csspart trigger - The button that opens/closes the dropdown.
 * @csspart listbox - The dropdown panel containing options.
 * @csspart option - Individual option items in the listbox.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-select-bg=var(--hx-color-neutral-0)] - Select background color.
 * @cssprop [--hx-select-color=var(--hx-color-neutral-800)] - Select text color.
 * @cssprop [--hx-select-border-color=var(--hx-color-neutral-300)] - Select border color.
 * @cssprop [--hx-select-border-radius=var(--hx-border-radius-md)] - Select border radius.
 * @cssprop [--hx-select-font-family=var(--hx-font-family-sans)] - Select font family.
 * @cssprop [--hx-select-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-select-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-select-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-select-chevron-color=var(--hx-color-neutral-500)] - Chevron indicator color.
 * @cssprop [--hx-select-listbox-bg=var(--hx-color-neutral-0)] - Listbox panel background color.
 * @cssprop [--hx-select-option-hover-bg=var(--hx-color-primary-50)] - Option hover background color.
 * @cssprop [--hx-select-option-selected-bg=var(--hx-color-primary-100)] - Selected option background color.
 * @cssprop [--hx-select-placeholder-color=var(--hx-color-neutral-400)] - Placeholder text color.
 */
@customElement('hx-select')
export class HelixSelect extends LitElement {
  static override styles = [tokenStyles, helixSelectStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Stable IDs ───

  private _selectId = `hx-select-${++_hxSelectIdCounter}`;
  private _listboxId = `${this._selectId}-listbox`;
  private _labelId = `${this._selectId}-label`;
  private _helpTextId = `${this._selectId}-help`;
  private _errorId = `${this._selectId}-error`;

  // ─── Public Properties ───

  /**
   * The visible label text for the select.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Placeholder text shown in the trigger when no option is selected.
   * @attr placeholder
   */
  @property({ type: String })
  placeholder = '';

  /**
   * The current value of the select.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * Whether the select is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the select is disabled.
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
   * Help text displayed below the select for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Size variant of the select trigger.
   * @attr hx-size
   */
  @property({ type: String, attribute: 'hx-size', reflect: true })
  size: 'sm' | 'md' | 'lg' = 'md';

  /**
   * Accessible name for screen readers, if different from the visible label.
   * @attr aria-label
   */
  @property({ type: String, attribute: 'aria-label' })
  override ariaLabel: string | null = null;

  /**
   * Controls whether the dropdown listbox is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  // ─── Internal State ───

  @state() private _options: SelectOption[] = [];
  @state() private _hasErrorSlot = false;
  @state() private _focusedOptionIndex = -1;

  // ─── Queries ───

  @query('.field__select')
  private _select!: HTMLSelectElement;

  @query('.field__trigger')
  private _trigger!: HTMLElement;

  // ─── Computed helpers ───

  private get _displayValue(): string {
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this._syncNativeSelect();
      this._updateFormValue();
      this._updateValidity();
    }
    if (changedProperties.has('size')) {
      const validSizes: string[] = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.size)) {
        console.warn(
          `[hx-select] Invalid size "${this.size}". Expected one of: ${validSizes.join(', ')}.`,
        );
      }
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

  /** Checks whether the select satisfies its constraints. */
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
        this._trigger ?? this._select,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  /** Called by the browser when the owning form resets. */
  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue(null);
  }

  /** Called when the browser restores form state (e.g., bfcache navigation). */
  formStateRestoreCallback(
    state: string | File | FormData,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  // ─── Native Select Sync ───

  private _syncNativeSelect(): void {
    if (!this._select) return;
    if (this.value) {
      this._select.value = this.value;
    }
  }

  // ─── Option Syncing from Slot ───

  private _parseOption(el: HTMLOptionElement): SelectOption {
    return { value: el.value, label: el.textContent?.trim() ?? el.value, disabled: el.disabled };
  }

  /**
   * Single-pass slot handler: reads options into _options for the custom
   * listbox AND clones them into the native <select> for form participation.
   * Handles both top-level <option> and <optgroup> children.
   */
  private _handleSlotChange(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const parsed: SelectOption[] = [];

    // Remove previously cloned options from native select
    if (this._select) {
      this._select.querySelectorAll('option[data-cloned]').forEach((opt) => opt.remove());
    }

    const cloneIntoSelect = (optEl: HTMLOptionElement): void => {
      if (!this._select) return;
      const clone = optEl.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    };

    for (const el of slot.assignedElements({ flatten: true })) {
      if (el instanceof HTMLOptionElement) {
        parsed.push(this._parseOption(el));
        cloneIntoSelect(el);
      } else if (el instanceof HTMLOptGroupElement) {
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLOptionElement) {
            parsed.push(this._parseOption(child));
            cloneIntoSelect(child);
          }
        }
      }
    }

    this._options = parsed;

    if (this._select) {
      if (this.value) {
        this._select.value = this.value;
      } else if (!this.placeholder && parsed.length > 0) {
        this.value = this._select.value;
        this._updateFormValue();
      }
    }
  }

  // ─── Slot Change Handlers ───

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Dropdown Control ───

  private _toggleDropdown(): void {
    if (!this.disabled) {
      this.open = !this.open;
      if (this.open) {
        // Pre-focus the currently selected option (or first enabled) when opening
        const selectedIndex = this._options.findIndex((o) => o.value === this.value);
        this._focusedOptionIndex = selectedIndex >= 0 ? selectedIndex : 0;
      } else {
        this._focusedOptionIndex = -1;
      }
    }
  }

  // ─── Keyboard Navigation ───

  private _handleKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const enabledIndices = this._options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled)
      .map(({ i }) => i);

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : 0;
          break;
        }
        const nextDown = enabledIndices.find((i) => i > this._focusedOptionIndex);
        this._focusedOptionIndex =
          nextDown !== undefined ? nextDown : (enabledIndices[0] ?? this._focusedOptionIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          const lastEnabled = enabledIndices[enabledIndices.length - 1];
          this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : 0;
          break;
        }
        const prevUp = [...enabledIndices].reverse().find((i) => i < this._focusedOptionIndex);
        const lastEnabledUp = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex =
          prevUp !== undefined ? prevUp : (lastEnabledUp ?? this._focusedOptionIndex);
        break;
      }
      case 'Home': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        }
        this._focusedOptionIndex = enabledIndices.length > 0 ? (enabledIndices[0] ?? 0) : 0;
        break;
      }
      case 'End': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
        }
        const lastEnabled = enabledIndices[enabledIndices.length - 1];
        this._focusedOptionIndex = lastEnabled !== undefined ? lastEnabled : 0;
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (!this.open) {
          this.open = true;
          const selIdx = this._options.findIndex((o) => o.value === this.value);
          this._focusedOptionIndex = selIdx >= 0 ? selIdx : (enabledIndices[0] ?? 0);
          break;
        }
        if (this._focusedOptionIndex >= 0 && this._focusedOptionIndex < this._options.length) {
          const opt = this._options[this._focusedOptionIndex];
          if (opt) this._selectOption(opt);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        this.open = false;
        this._focusedOptionIndex = -1;
        this._trigger?.focus();
        break;
      }
      case 'Tab': {
        // Close the dropdown but allow Tab to move focus naturally
        if (this.open) {
          this.open = false;
          this._focusedOptionIndex = -1;
        }
        break;
      }
      default: {
        // Typeahead: single printable character jumps to first matching option
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
          const char = e.key.toLowerCase();
          const startIndex = this.open ? this._focusedOptionIndex + 1 : 0;
          const matching = this._options
            .map((o, i) => ({ o, i }))
            .filter(({ o }) => !o.disabled && o.label.toLowerCase().startsWith(char));
          const afterCurrent = matching.find(({ i }) => i >= startIndex);
          const target = afterCurrent ?? matching[0];
          if (target) {
            if (!this.open) {
              this.open = true;
            }
            this._focusedOptionIndex = target.i;
            e.preventDefault();
          }
        }
        break;
      }
    }
  }

  // ─── Selection ───

  private _selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.value = option.value; // triggers updated() → sync + formValue + validity
    this._dispatchChange();
    this.open = false;
    this._focusedOptionIndex = -1;
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

  private _handleNativeChange(e: Event): void {
    this.value = (e.target as HTMLSelectElement).value; // triggers updated()
    this._dispatchChange();
  }

  // ─── Outside Click Handler ───

  private _handleOutsideClick = (e: MouseEvent): void => {
    if (this.open && !e.composedPath().includes(this)) {
      this.open = false;
    }
  };

  // ─── Public Methods ───

  /** Moves focus to the visible trigger button. */
  override focus(options?: FocusOptions): void {
    this._trigger?.focus(options);
  }

  // ─── Render Helpers ───

  private _optionId(index: number): string {
    return `hx-select-option-${this._selectId}-${index}`;
  }

  private _renderOptions() {
    if (this._options.length === 0) {
      return html`<div class="field__no-options">No options found</div>`;
    }

    return this._options.map((opt, index) => {
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

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
      'field--open': this.open,
    };

    const triggerClasses = {
      field__trigger: true,
      [`field__trigger--${this.size}`]: true,
      'field__trigger--placeholder': !this.value,
    };

    const selectClasses = {
      field__select: true,
      [`field__select--${this.size}`]: true,
    };

    const describedBy =
      [
        hasError || this._hasErrorSlot ? this._errorId : null,
        this.helpText ? this._helpTextId : null,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label">
          ${this.label
            ? html`<label
                part="label"
                class="field__label"
                id=${this._labelId}
                for=${this._selectId}
              >
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <!-- Select Wrapper: trigger + listbox -->
        <div part="select-wrapper" class="field__select-wrapper">
          <!-- Custom Trigger (combobox — div to avoid native role conflicts per APG) -->
          <div
            part="trigger"
            id=${this._selectId}
            class=${classMap(triggerClasses)}
            role="combobox"
            tabindex=${this.disabled ? '-1' : '0'}
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="listbox"
            aria-controls=${this._listboxId}
            aria-activedescendant=${this.open && this._focusedOptionIndex >= 0
              ? this._optionId(this._focusedOptionIndex)
              : nothing}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            aria-disabled=${this.disabled ? 'true' : nothing}
            aria-labelledby=${ifDefined(this.label ? this._labelId : undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            @click=${this._toggleDropdown}
            @keydown=${this._handleKeydown}
          >
            <span class="field__trigger-value"
              >${this._displayValue || this.placeholder || nothing}</span
            >
            <span class="field__chevron" aria-hidden="true"></span>
          </div>

          <!-- Custom Listbox Panel -->
          <div
            part="listbox"
            role="listbox"
            id=${this._listboxId}
            class="field__listbox"
            aria-label=${ifDefined(this.label || this.ariaLabel || undefined)}
            ?hidden=${!this.open}
          >
            <div class="field__options">${this._renderOptions()}</div>
          </div>

          <!-- Hidden native select (form participation + test compat) -->
          <select
            part="select"
            class=${classMap(selectClasses)}
            tabindex="-1"
            aria-hidden="true"
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-label=${ifDefined(this.ariaLabel ?? undefined)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            @change=${this._handleNativeChange}
          >
            ${this.placeholder
              ? html`<option value="" disabled selected>${this.placeholder}</option>`
              : nothing}
          </select>
        </div>

        <!-- Hidden slot (options are read from here) -->
        <slot @slotchange=${this._handleSlotChange} style="display:none;"></slot>

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${hasError
            ? html`<div part="error" class="field__error" id=${this._errorId} role="alert">
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
    'hx-select': HelixSelect;
  }
}

export type { HelixSelect as HxSelect };
/** @deprecated Use HxSelect instead */
export type { HelixSelect as WcSelect };
