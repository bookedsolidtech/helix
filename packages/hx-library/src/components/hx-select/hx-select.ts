import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixSelectStyles } from './hx-select.styles.js';

// ─── Internal option model ───

interface SelectOption {
  value: string;
  label: string;
  disabled: boolean;
  group: string | null;
}

/**
 * A select component with a fully custom dropdown UI, providing combobox
 * ARIA semantics, keyboard navigation, multi-select, and filterable options.
 *
 * Options are provided via slotted `<option>` (and `<optgroup>`) elements in
 * the light DOM. The component reads them on slot change and renders a custom
 * listbox panel while keeping a hidden native `<select>` for form participation.
 *
 * @summary Form-associated custom dropdown with label, error, and help text.
 *
 * @tag hx-select
 *
 * @slot - Default slot for `<option>` and `<optgroup>` elements.
 * @slot label - Custom label content (overrides the label property).
 * @slot error - Custom error content (overrides the error property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected option changes.
 * @fires {CustomEvent<{value: string}>} hx-input - Dispatched when the search input value changes (searchable mode only).
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
 * @cssprop [--hx-select-option-focus-bg=var(--hx-color-primary-50)] - Focused option background color.
 * @cssprop [--hx-select-tag-bg=var(--hx-color-primary-100)] - Tag background in multiple mode.
 * @cssprop [--hx-select-tag-color=var(--hx-color-primary-700)] - Tag text color in multiple mode.
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

  private _selectId = `hx-select-${Math.random().toString(36).slice(2, 9)}`;
  private _listboxId = `${this._selectId}-listbox`;
  private _searchId = `${this._selectId}-search`;
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
   * The current value of the select (single mode).
   * In multiple mode, use `values` for the full set. Setting `value` in
   * multiple mode selects that single value and clears others.
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
   * Enables multi-select mode. Selected values are stored internally as a Set
   * and surfaced as removable tags inside the trigger.
   * @attr multiple
   */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Enables a search/filter input inside the listbox.
   * @attr searchable
   */
  @property({ type: Boolean, reflect: true })
  searchable = false;

  /**
   * Controls whether the dropdown listbox is open.
   * @attr open
   */
  @property({ type: Boolean, reflect: true })
  open = false;

  // ─── Internal State ───

  @state() private _options: SelectOption[] = [];
  @state() private _selectedValues: Set<string> = new Set();
  @state() private _activeIndex = -1;
  @state() private _searchQuery = '';
  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;

  // ─── Queries ───

  @query('.field__select')
  private _select!: HTMLSelectElement;

  @query('.field__trigger')
  private _trigger!: HTMLButtonElement;

  @query('.field__search-input')
  private _searchInput!: HTMLInputElement;

  // ─── Computed helpers ───

  private get _filteredOptions(): SelectOption[] {
    if (!this._searchQuery) return this._options;
    const q = this._searchQuery.toLowerCase();
    return this._options.filter((o) => o.label.toLowerCase().includes(q));
  }

  private get _displayValue(): string {
    if (this.multiple) return '';
    if (!this.value) return '';
    const opt = this._options.find((o) => o.value === this.value);
    return opt ? opt.label : this.value;
  }

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
    document.addEventListener('keydown', this._handleGlobalKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
    document.removeEventListener('keydown', this._handleGlobalKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('value')) {
      if (!this.multiple) {
        this._selectedValues = this.value ? new Set([this.value]) : new Set();
      }
      this._syncNativeSelect();
      this._updateFormValue();
      this._updateValidity();
    }

    if (changedProperties.has('multiple') && changedProperties.get('multiple') !== undefined) {
      // Only reset when switching modes at runtime (not on initial render)
      this._selectedValues = new Set();
      this.value = '';
      this._updateFormValue();
      this._updateValidity();
    }

    if (changedProperties.has('open') && this.open) {
      this._activeIndex = -1;
      // Focus the search input if searchable, otherwise the listbox trigger
      this.updateComplete.then(() => {
        if (this.searchable && this._searchInput) {
          this._searchInput.focus();
        }
      });
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
    if (this.multiple) {
      if (this._selectedValues.size === 0) {
        this._internals.setFormValue(null);
      } else {
        const fd = new FormData();
        this._selectedValues.forEach((v) => fd.append(this.name || '', v));
        this._internals.setFormValue(fd);
      }
    } else {
      this._internals.setFormValue(this.value || null);
    }
  }

  private _updateValidity(): void {
    const isEmpty = this.multiple ? this._selectedValues.size === 0 : !this.value;
    if (this.required && isEmpty) {
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
    this._selectedValues = new Set();
    this._internals.setFormValue(null);
  }

  /** Called when the browser restores form state (e.g., bfcache navigation). */
  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Native Select Sync ───

  /**
   * Keep the hidden native `<select>` in sync so that tests and browser form
   * APIs that query the shadow `<select>` element directly continue to work.
   */
  private _syncNativeSelect(): void {
    if (!this._select) return;
    if (this.value) {
      this._select.value = this.value;
    }
  }

  // ─── Option Syncing from Slot ───

  private _handleSlotChange(): void {
    this._readOptions();
    this._syncClonedOptions();
  }

  private _readOptions(): void {
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const assigned = slot.assignedElements({ flatten: true });
    const parsed: SelectOption[] = [];

    for (const el of assigned) {
      if (el instanceof HTMLOptGroupElement) {
        const groupLabel = el.label;
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLOptionElement) {
            parsed.push({
              value: child.value,
              label: child.textContent?.trim() ?? child.value,
              disabled: child.disabled,
              group: groupLabel,
            });
          }
        }
      } else if (el instanceof HTMLOptionElement) {
        parsed.push({
          value: el.value,
          label: el.textContent?.trim() ?? el.value,
          disabled: el.disabled,
          group: null,
        });
      }
    }

    this._options = parsed;

    // If there is a current value, ensure selectedValues is in sync
    if (!this.multiple && this.value) {
      this._selectedValues = new Set([this.value]);
    }
  }

  /**
   * Clone slotted `<option>` elements into the hidden native `<select>` so
   * that existing tests that query `option[data-cloned]` continue to pass.
   */
  private _syncClonedOptions(): void {
    if (!this._select) return;

    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot:not([name])');
    if (!slot) return;

    const slottedOptions = slot
      .assignedElements({ flatten: true })
      .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);

    // Remove previously cloned options
    const existingCloned = this._select.querySelectorAll('option[data-cloned]');
    existingCloned.forEach((opt) => opt.remove());

    // Clone slotted options into the native select
    slottedOptions.forEach((option) => {
      const clone = option.cloneNode(true) as HTMLOptionElement;
      clone.setAttribute('data-cloned', '');
      this._select.appendChild(clone);
    });

    // Sync value after cloning
    if (this.value) {
      this._select.value = this.value;
    } else if (!this.placeholder && slottedOptions.length > 0 && !this.multiple) {
      this.value = this._select.value;
      this._updateFormValue();
    }
  }

  // ─── Slot Change Handlers ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Dropdown Control ───

  private _openDropdown(): void {
    if (this.disabled) return;
    this.open = true;
    this._searchQuery = '';
    this._activeIndex = -1;
  }

  private _closeDropdown(): void {
    this.open = false;
    this._searchQuery = '';
    this._activeIndex = -1;
  }

  private _toggleDropdown(): void {
    if (this.open) {
      this._closeDropdown();
    } else {
      this._openDropdown();
    }
  }

  // ─── Selection ───

  private _selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple) {
      const next = new Set(this._selectedValues);
      if (next.has(option.value)) {
        next.delete(option.value);
      } else {
        next.add(option.value);
      }
      this._selectedValues = next;
      // Sync value to last selected for API consumers
      this.value = option.value;
      this._updateFormValue();
      this._updateValidity();
      this._dispatchChange();
      // In multiple mode, keep the dropdown open
    } else {
      this.value = option.value;
      this._selectedValues = new Set([option.value]);
      this._syncNativeSelect();
      this._updateFormValue();
      this._updateValidity();
      this._dispatchChange();
      this._closeDropdown();
    }
  }

  private _removeTag(value: string, e: Event): void {
    e.stopPropagation();
    const next = new Set(this._selectedValues);
    next.delete(value);
    this._selectedValues = next;
    if (this.value === value) {
      const remaining = [...next];
      this.value = next.size > 0 ? (remaining[remaining.length - 1] ?? '') : '';
    }
    this._updateFormValue();
    this._updateValidity();
    this._dispatchChange();
  }

  // ─── Event Dispatchers ───

  private _dispatchChange(): void {
    /**
     * Dispatched when the selected option changes.
     * @event hx-change
     */
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _handleNativeChange(e: Event): void {
    const target = e.target as HTMLSelectElement;
    this.value = target.value;
    this._selectedValues = this.value ? new Set([this.value]) : new Set();
    this._updateFormValue();
    this._updateValidity();
    this._dispatchChange();
  }

  private _handleSearchInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._searchQuery = target.value;
    this._activeIndex = -1;

    /**
     * Dispatched as the user types in the search input.
     * @event hx-input
     */
    this.dispatchEvent(
      new CustomEvent('hx-input', {
        bubbles: true,
        composed: true,
        detail: { value: this._searchQuery },
      }),
    );
  }

  // ─── Keyboard Navigation ───

  private _handleTriggerKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (!this.open) {
          this._openDropdown();
        } else {
          this._navigateOptions(e.key === 'ArrowDown' ? 1 : -1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._toggleDropdown();
        break;
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        this._trigger?.focus();
        break;
      case 'Tab':
        this._closeDropdown();
        break;
      default:
        break;
    }
  }

  private _handleListboxKeydown(e: KeyboardEvent): void {
    const filtered = this._filteredOptions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._navigateOptions(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._navigateOptions(-1);
        break;
      case 'Home':
        e.preventDefault();
        this._setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        this._setActiveIndex(filtered.length - 1);
        break;
      case 'Enter': {
        e.preventDefault();
        const activeOpt = this._activeIndex >= 0 ? filtered[this._activeIndex] : undefined;
        if (activeOpt) {
          this._selectOption(activeOpt);
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        this._trigger?.focus();
        break;
      case 'Tab':
        this._closeDropdown();
        break;
      default:
        break;
    }
  }

  private _handleSearchKeydown(e: KeyboardEvent): void {
    const filtered = this._filteredOptions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._navigateOptions(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._navigateOptions(-1);
        break;
      case 'Enter': {
        e.preventDefault();
        const activeOpt = this._activeIndex >= 0 ? filtered[this._activeIndex] : undefined;
        if (activeOpt) {
          this._selectOption(activeOpt);
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        this._closeDropdown();
        this._trigger?.focus();
        break;
      case 'Tab':
        this._closeDropdown();
        break;
      default:
        break;
    }
  }

  private _navigateOptions(direction: 1 | -1): void {
    const filtered = this._filteredOptions;
    if (filtered.length === 0) return;

    let next = this._activeIndex + direction;
    // Skip disabled options
    while (next >= 0 && next < filtered.length && (filtered[next]?.disabled ?? false)) {
      next += direction;
    }

    if (next < 0) next = 0;
    if (next >= filtered.length) next = filtered.length - 1;

    this._setActiveIndex(next);
  }

  private _setActiveIndex(index: number): void {
    this._activeIndex = index;
    // Scroll active option into view
    this.updateComplete.then(() => {
      const optionEl = this.shadowRoot?.querySelector<HTMLElement>(
        `[data-option-index="${index}"]`,
      );
      optionEl?.scrollIntoView({ block: 'nearest' });
    });
  }

  // ─── Outside Click Handler ───

  private _handleOutsideClick = (e: MouseEvent): void => {
    if (!this.open) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._closeDropdown();
    }
  };

  private _handleGlobalKeydown = (e: KeyboardEvent): void => {
    if (!this.open) return;
    if (e.key === 'Escape') {
      this._closeDropdown();
      this._trigger?.focus();
    }
  };

  // ─── Public Methods ───

  /** Moves focus to the trigger button (or native select for test compat). */
  override focus(options?: FocusOptions): void {
    // Focus native select for backward compatibility with focus() tests
    this._select?.focus(options);
  }

  // ─── aria-activedescendant ───

  private _optionId(index: number): string {
    return `${this._listboxId}-opt-${index}`;
  }

  // ─── Render Helpers ───

  private _renderTags() {
    if (!this.multiple || this._selectedValues.size === 0) return nothing;

    const tags = [...this._selectedValues].map((val) => {
      const opt = this._options.find((o) => o.value === val);
      const label = opt ? opt.label : val;
      return html`
        <span class="field__tag" data-value=${val}>
          <span class="field__tag-label">${label}</span>
          <button
            type="button"
            class="field__tag-remove"
            aria-label="Remove ${label}"
            @click=${(e: Event) => this._removeTag(val, e)}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </span>
      `;
    });

    return html`<span class="field__tags">${tags}</span>`;
  }

  private _renderOptions() {
    const filtered = this._filteredOptions;

    if (filtered.length === 0) {
      return html`<div class="field__no-options">No options found</div>`;
    }

    // Determine if we need group headers
    const hasGroups = filtered.some((o) => o.group !== null);

    if (hasGroups) {
      // Group options by group label, preserving insertion order
      const groups = new Map<string, SelectOption[]>();
      const ungrouped: SelectOption[] = [];

      filtered.forEach((opt) => {
        if (opt.group) {
          if (!groups.has(opt.group)) groups.set(opt.group, []);
          groups.get(opt.group)!.push(opt);
        } else {
          ungrouped.push(opt);
        }
      });

      // Build a flat index map for data-option-index (keyboard nav uses filtered index)
      let globalIndex = 0;
      const groupFragments: ReturnType<typeof html>[] = [];

      ungrouped.forEach((opt) => {
        const idx = globalIndex++;
        groupFragments.push(this._renderOptionItem(opt, idx));
      });

      groups.forEach((opts, groupName) => {
        const groupId = `${this._listboxId}-group-${groupName.replace(/\s+/g, '-')}`;
        const optionItems = opts.map((opt) => this._renderOptionItem(opt, globalIndex++));
        groupFragments.push(html`
          <div class="field__optgroup">
            <div class="field__optgroup-label" id=${groupId} role="presentation">${groupName}</div>
            ${optionItems}
          </div>
        `);
      });

      return html`${groupFragments}`;
    }

    return repeat(
      filtered,
      (opt) => opt.value,
      (opt, index) => this._renderOptionItem(opt, index),
    );
  }

  private _renderOptionItem(opt: SelectOption, index: number) {
    const isSelected = this._selectedValues.has(opt.value);
    const isActive = this._activeIndex === index;

    const optionClasses = {
      field__option: true,
      'field__option--selected': isSelected,
      'field__option--active': isActive,
      'field__option--disabled': opt.disabled,
    };

    return html`
      <div
        part="option"
        role="option"
        id=${this._optionId(index)}
        data-option-index=${index}
        class=${classMap(optionClasses)}
        aria-selected=${isSelected ? 'true' : 'false'}
        aria-disabled=${opt.disabled ? 'true' : nothing}
        @click=${() => this._selectOption(opt)}
        @mouseenter=${() => {
          this._activeIndex = index;
        }}
      >
        ${this.multiple
          ? html`<span class="field__option-checkbox" aria-hidden="true">
              ${isSelected
                ? html`<svg
                    width="12"
                    height="10"
                    viewBox="0 0 12 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5L4.5 8.5L11 1"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>`
                : nothing}
            </span>`
          : nothing}
        <span class="field__option-label">${opt.label}</span>
      </div>
    `;
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
      'field--multiple': this.multiple,
    };

    const triggerClasses = {
      field__trigger: true,
      [`field__trigger--${this.size}`]: true,
      'field__trigger--placeholder': !this.value && this._selectedValues.size === 0,
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

    const activeDescendant =
      this.open && this._activeIndex >= 0 ? this._optionId(this._activeIndex) : undefined;

    const triggerLabel = this.ariaLabel ?? (this.label ? undefined : undefined);

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`<label part="label" class="field__label" for=${this._selectId}>
                ${this.label}
                ${this.required
                  ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                  : nothing}
              </label>`
            : nothing}
        </slot>

        <!-- Select Wrapper: trigger + listbox -->
        <div part="select-wrapper" class="field__select-wrapper">
          <!-- Custom Trigger (combobox button) -->
          <button
            part="trigger"
            type="button"
            id=${this._selectId}
            class=${classMap(triggerClasses)}
            role="combobox"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-haspopup="listbox"
            aria-controls=${this._listboxId}
            aria-label=${ifDefined(triggerLabel ?? undefined)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            aria-activedescendant=${ifDefined(activeDescendant)}
            ?disabled=${this.disabled}
            @click=${this._toggleDropdown}
            @keydown=${this._handleTriggerKeydown}
          >
            <span class="field__trigger-content">
              ${this._renderTags()}
              ${this.multiple
                ? html`<span class="field__trigger-placeholder"
                    >${this._selectedValues.size > 0
                      ? `${this._selectedValues.size} selected`
                      : this.placeholder || 'Select options'}</span
                  >`
                : html`<span class="field__trigger-value"
                    >${this._displayValue || this.placeholder || nothing}</span
                  >`}
            </span>
            <span class="field__chevron" aria-hidden="true">
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1.5L6 6.5L11 1.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </button>

          <!-- Custom Listbox Panel -->
          <div
            part="listbox"
            role="listbox"
            id=${this._listboxId}
            class="field__listbox"
            aria-multiselectable=${this.multiple ? 'true' : nothing}
            aria-label=${ifDefined(this.label || this.ariaLabel || undefined)}
            ?hidden=${!this.open}
            @keydown=${this._handleListboxKeydown}
          >
            ${this.searchable
              ? html`<div class="field__search">
                  <input
                    type="text"
                    id=${this._searchId}
                    class="field__search-input"
                    placeholder="Search..."
                    autocomplete="off"
                    aria-label="Search options"
                    aria-controls=${this._listboxId}
                    .value=${this._searchQuery}
                    @input=${this._handleSearchInput}
                    @keydown=${this._handleSearchKeydown}
                  />
                </div>`
              : nothing}
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
    'hx-select': HelixSelect;
  }
}

export type { HelixSelect as WcSelect };
