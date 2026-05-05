import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixSelectStyles } from './hx-select.styles.js';
import { forcedColorsField } from '../../styles/forced-colors.js';
import { devWarn } from '../../utils/dev-warn.js';

// PERF: hx-select exceeds 5KB budget (6.31kb gzipped) -- custom listbox, keyboard navigation, grouped options

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
const _nextSelectId = createIdCounter('hx-select');

// ─── Internal option model ───

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
}

/** Detail for the hx-change event dispatched by hx-select. */
export interface HxSelectChangeDetail {
  value: string;
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
 * @fires {Event} invalid - Platform constraint-validation event fired when checkValidity() / reportValidity() determine the value is invalid (form-associated component contract via ElementInternals.setValidity).
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
 * @cssprop [--hx-select-chevron-size=0.5rem] - Chevron indicator size (width/height base unit).
 * @cssprop [--hx-select-listbox-bg=var(--hx-color-neutral-0)] - Listbox panel background color.
 * @cssprop [--hx-select-option-hover-bg=var(--hx-color-primary-50)] - Option hover background color.
 * @cssprop [--hx-select-option-selected-bg=var(--hx-color-primary-100)] - Selected option background color.
 * @cssprop [--hx-select-placeholder-color=var(--hx-color-neutral-400)] - Placeholder text color.
 * @cssprop [--hx-color-neutral-0] - Color.
 * @cssprop [--hx-color-neutral-800] - Color.
 * @cssprop [--hx-color-neutral-400] - Color.
 * @cssprop [--hx-color-neutral-700] - Color.
 * @cssprop [--hx-color-neutral-300] - Color.
 * @cssprop [--hx-border-radius-md] - CSS custom property.
 * @cssprop [--hx-focus-ring-color] - Color.
 * @cssprop [--hx-color-primary-400] - Color.
 * @cssprop [--hx-color-error-500] - Color.
 * @cssprop [--hx-color-neutral-500] - Color.
 * @cssprop [--hx-color-primary-50] - Color.
 * @cssprop [--hx-color-primary-100] - Color.
 * @cssprop [--hx-font-family-sans] - Font family.
 * @cssprop [--hx-opacity-disabled] - Opacity.
 * @cssprop [--hx-space-1] - Spacing token.
 * @cssprop [--hx-font-size-sm] - Font size.
 * @cssprop [--hx-font-weight-medium] - Font weight.
 * @cssprop [--hx-line-height-normal] - Line height.
 * @cssprop [--hx-color-error-text] - Color.
 * @cssprop [--hx-font-weight-bold] - Font weight.
 * @cssprop [--hx-space-2] - Spacing token.
 * @cssprop [--hx-input-height-md] - Height.
 * @cssprop [--hx-size-10] - Size token.
 * @cssprop [--hx-border-width-thin] - Width.
 * @cssprop [--hx-font-size-md] - Font size.
 * @cssprop [--hx-space-3] - Spacing token.
 * @cssprop [--hx-transition-fast] - Transition timing.
 * @cssprop [--hx-focus-ring-width] - Width.
 * @cssprop [--hx-focus-ring-opacity] - CSS custom property.
 * @cssprop [--hx-input-height-sm] - Height.
 * @cssprop [--hx-size-8] - Size token.
 * @cssprop [--hx-input-height-lg] - Height.
 * @cssprop [--hx-size-12] - Size token.
 * @cssprop [--hx-font-size-lg] - Font size.
 * @cssprop [--hx-space-4] - Spacing token.
 * @cssprop [--hx-space-px] - Spacing token.
 * @cssprop [--hx-z-index-dropdown] - Z-index layer.
 * @cssprop [--hx-select-listbox-shadow] - CSS custom property.
 * @cssprop [--hx-overlay-neutral-12] - Overlay color.
 * @cssprop [--hx-select-listbox-max-height=16rem] - Height.
 * @cssprop [--hx-color-primary-500] - Color.
 * @cssprop [--hx-select-option-focus-ring-offset=-2px] - Focus ring styling.
 * @cssprop [--hx-font-size-xs] - Font size.
 */
@customElement('hx-select')
export class HelixSelect extends FormMixin(HelixElement) {
  static override styles = [helixSelectStyles, forcedColorsField];

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  // ─── Stable IDs ───

  /** @internal */
  private _selectId = _nextSelectId();
  /** @internal */
  private _listboxId = `${this._selectId}-listbox`;
  /** @internal */
  private _labelId = `${this._selectId}-label`;
  /** @internal */
  private _helpTextId = `${this._selectId}-help`;
  /** @internal */
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
  @property({ type: String, reflect: true })
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
   * Uses `accessible-label` attribute instead of `aria-label` to avoid
   * ARIAMixin shadowing on the host element.
   *
   * Note: `mixinDelegatesAria` is not applied to this component because form
   * inputs with associated labels delegate accessible naming via `<label>`
   * association and `aria-labelledby`, not host-level ARIA delegation. The
   * `accessible-label` attribute is a fallback for label-free usage. The value is forwarded to the
   * internal trigger button's `aria-label`.
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string | null = null;

  /**
   * Controls whether the dropdown listbox is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Validation message when no option is selected. Override for i18n.
   * @attr label-required
   */
  @property({ attribute: 'label-required' }) labelRequired = 'Please select an option.';

  /**
   * Label shown when no options are available. Override for i18n.
   * @attr label-no-options
   */
  @property({ attribute: 'label-no-options' }) labelNoOptions = 'No options found';

  // ─── Internal State ───

  /** Parsed option models derived from slotted `<option>` and `<optgroup>` elements. @internal */
  @state() private _options: SelectOption[] = [];
  /** Whether the named error slot contains projected content. @internal */
  @state() private _hasErrorSlot = false;
  /** Zero-based index of the keyboard-focused option in the listbox; -1 means none. @internal */
  @state() private _focusedOptionIndex = -1;

  // ─── Queries ───

  /** Reference to the hidden native select element used for form participation. @internal */
  @query('.field__select')
  private _select: HTMLSelectElement | undefined;

  /** Reference to the visible combobox trigger element that receives keyboard focus. @internal */
  @query('.field__trigger')
  private _trigger: HTMLElement | undefined;

  // ─── Computed helpers ───

  /** @internal */
  private get _displayValue(): string {
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  // ─── Lifecycle ───

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Safety net: remove listener if component is removed while dropdown is open
    document.removeEventListener('click', this._handleOutsideClick);
    // Reset open state to prevent persisted open state on reconnect
    if (this.open) {
      this.open = false;
      this._focusedOptionIndex = -1;
    }
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('open')) {
      if (this.open) {
        document.addEventListener('click', this._handleOutsideClick);
      } else {
        document.removeEventListener('click', this._handleOutsideClick);
      }
    }
    if (changedProperties.has('value')) {
      this._syncNativeSelect();
      this._updateFormValue();
    }
    if (changedProperties.has('size')) {
      const validSizes: string[] = ['sm', 'md', 'lg'];
      if (!validSizes.includes(this.size)) {
        devWarn(
          'hx-select',
          `Invalid size "${this.size}". Expected one of: ${validSizes.join(', ')}.`,
        );
      }
    }
    // Force screen reader re-announcement when error text changes (a11y-v3-005)
    if (changedProperties.has('error') && this.error) {
      const errorEl = this.shadowRoot?.querySelector('[role="alert"]');
      if (errorEl) {
        const msg = this.error;
        requestAnimationFrame(() => {
          errorEl.textContent = '';
          requestAnimationFrame(() => {
            errorEl.textContent = msg;
          });
        });
      }
    }
  }

  // ─── Form Integration ───

  /** @internal */
  private _updateFormValue(): void {
    this._internals.setFormValue(this.value || null);
  }

  /** @internal */
  override _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || this.labelRequired,
        this._trigger ?? this._select,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // ─── Form Lifecycle Hooks ───

  protected override _onFormReset(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  protected override _onFormStateRestore(
    state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ─── Native Select Sync ───

  /** @internal */
  private _syncNativeSelect(): void {
    if (!this._select) return;
    if (this.value) {
      this._select.value = this.value;
    }
  }

  // ─── Option Syncing from Slot ───

  /** @internal */
  private _parseOption(el: HTMLOptionElement): SelectOption {
    return { value: el.value, label: el.textContent?.trim() ?? el.value, disabled: el.disabled };
  }

  /**
   * Single-pass slot handler: reads options into _options for the custom
   * listbox AND clones them into the native <select> for form participation.
   * Handles both top-level <option> and <optgroup> children.
   */
  /** @internal */
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

    if (parsed.length === 0) {
      devWarn(
        'hx-select',
        'hx-select has no options — add <option> or <optgroup> elements as children.',
      );
    }

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

  /** @internal */
  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Dropdown Control ───

  /** @internal */
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

  /** @internal */
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

  /** @internal */
  private _selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.value = option.value; // triggers updated() → sync + formValue + validity
    this._handleInteractionInput();
    this._handleInteractionBlur();
    this._dispatchChange();
    this.open = false;
    this._focusedOptionIndex = -1;
  }

  // ─── Event Dispatchers ───

  /** @internal */
  private _dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent<{ value: string }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  /** @internal */
  private _handleNativeChange(e: Event): void {
    this.value = (e.target as HTMLSelectElement).value; // triggers updated()
    this._handleInteractionInput();
    this._handleInteractionBlur();
    this._dispatchChange();
  }

  // ─── Outside Click Handler ───

  /** @internal */
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

  /** @internal */
  private _optionId(index: number): string {
    return `hx-select-option-${this._selectId}-${index}`;
  }

  /** @internal */
  private _renderOptions() {
    if (this._options.length === 0) {
      return html`<div class="field__no-options">${this.labelNoOptions}</div>`;
    }

    return repeat(
      this._options,
      (opt) => opt.value,
      (opt, index) => {
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
      },
    );
  }

  // ─── Main Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;

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
            aria-label=${ifDefined(this.accessibleLabel ?? undefined)}
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
            aria-label=${ifDefined(this.label || this.accessibleLabel || undefined)}
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
            aria-label=${ifDefined(this.accessibleLabel ?? undefined)}
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

/**
 * Per-component event map for type-safe addEventListener on hx-select.
 * The `hx-change` detail is `{ value: string }` only — no `checked` property.
 */
export interface HxSelectEventMap {
  'hx-change': CustomEvent<{ value: string }>;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-select': HelixSelect;
  }
}

export type { HelixSelect as HxSelect };
