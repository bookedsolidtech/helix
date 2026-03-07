import { LitElement, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixTimePickerStyles } from './hx-time-picker.styles.js';

// ─── Time Slot ───────────────────────────────────────────────────────────────

interface TimeSlot {
  /** HH:MM in 24-hour format — canonical internal value. */
  value: string;
  /** Display label respecting the component's `format` property. */
  label: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse "HH:MM" into { hours, minutes }. Returns null when the string is not valid. */
function parseHHMM(raw: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/** Format { hours, minutes } as zero-padded "HH:MM". */
function toHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Convert a 24-hour HH:MM value to a 12-hour display string (e.g. "02:30 PM"). */
function to12h(value: string): string {
  const parsed = parseHHMM(value);
  if (!parsed) return value;
  const { hours, minutes } = parsed;
  const period = hours < 12 ? 'AM' : 'PM';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Generate ordered time slots between `minTime` and `maxTime` (inclusive) at
 * `stepMinutes` intervals.  Both bounds are HH:MM strings; defaults fall back
 * to "00:00" / "23:59".
 */
function generateSlots(
  minTime: string,
  maxTime: string,
  stepMinutes: number,
  format: '12h' | '24h',
): TimeSlot[] {
  const minParsed = parseHHMM(minTime) ?? { hours: 0, minutes: 0 };
  const maxParsed = parseHHMM(maxTime) ?? { hours: 23, minutes: 59 };

  const minTotal = minParsed.hours * 60 + minParsed.minutes;
  const maxTotal = maxParsed.hours * 60 + maxParsed.minutes;

  // Guard against degenerate step values
  const step = Math.max(1, Math.round(stepMinutes));

  const slots: TimeSlot[] = [];
  for (let t = minTotal; t <= maxTotal; t += step) {
    const h = Math.floor(t / 60) % 24;
    const m = t % 60;
    const value = toHHMM(h, m);
    slots.push({
      value,
      label: format === '12h' ? to12h(value) : value,
    });
  }
  return slots;
}

/** Clamp a raw HH:MM value to the [min, max] range; return '' when value is empty. */
function clampValue(value: string, minTime: string, maxTime: string): string {
  if (!value) return '';
  const parsed = parseHHMM(value);
  if (!parsed) return '';

  const total = parsed.hours * 60 + parsed.minutes;
  const minParsed = parseHHMM(minTime) ?? { hours: 0, minutes: 0 };
  const maxParsed = parseHHMM(maxTime) ?? { hours: 23, minutes: 59 };
  const minTotal = minParsed.hours * 60 + minParsed.minutes;
  const maxTotal = maxParsed.hours * 60 + maxParsed.minutes;

  if (total < minTotal) return toHHMM(minParsed.hours, minParsed.minutes);
  if (total > maxTotal) return toHHMM(maxParsed.hours, maxParsed.minutes);
  return toHHMM(parsed.hours, parsed.minutes);
}

/**
 * Attempt to parse a user-typed string (12 h or 24 h) into an HH:MM value.
 * Returns null when the string cannot be resolved.
 */
function parseUserInput(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();

  // 24-hour "HH:MM" or "H:MM"
  const hhmm = parseHHMM(trimmed);
  if (hhmm) return toHHMM(hhmm.hours, hhmm.minutes);

  // 12-hour patterns: "2:30 PM", "2:30PM", "02:30 AM", "230 pm", "2 PM"
  const twelve =
    /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/.exec(trimmed) ??
    /^(\d{1,2})(\d{2})\s*(AM|PM)$/.exec(trimmed);

  if (twelve) {
    let hours = parseInt(twelve[1] ?? '0', 10);
    const minutes = twelve[2] !== undefined ? parseInt(twelve[2], 10) : 0;
    const period = twelve[3] ?? '';
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (period === 'AM') {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
    return toHHMM(hours, minutes);
  }

  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * A time-picker component with a combobox pattern: a text input with format
 * masking and a dropdown listbox of pre-generated time slots.
 *
 * @summary Form-associated time picker with 12h/24h format support and dropdown listbox.
 *
 * @tag hx-time-picker
 *
 * @slot label - Custom label content; overrides the rendered label element when used.
 * @slot help - Help text displayed below the field.
 * @slot error - Custom error content; overrides the `error` property.
 *
 * @fires {CustomEvent<{value: string}>} hx-change - Dispatched when the selected time changes. Detail value is HH:MM (24h).
 *
 * @csspart label - The label element.
 * @csspart input - The text input element.
 * @csspart listbox - The dropdown `<ul>` element.
 * @csspart option - Each `<li>` option in the listbox.
 *
 * @cssprop [--hx-time-picker-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-time-picker-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-time-picker-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-time-picker-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-time-picker-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-time-picker-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-time-picker-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-time-picker-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-time-picker-chevron-color=var(--hx-color-neutral-500)] - Toggle chevron color.
 * @cssprop [--hx-time-picker-listbox-bg=var(--hx-color-neutral-0)] - Listbox background.
 * @cssprop [--hx-time-picker-listbox-max-height=16rem] - Maximum height of the dropdown.
 * @cssprop [--hx-time-picker-option-color=var(--hx-color-neutral-800)] - Option text color.
 * @cssprop [--hx-time-picker-option-hover-bg=var(--hx-color-primary-50)] - Option hover background.
 * @cssprop [--hx-time-picker-option-hover-color=var(--hx-color-primary-700)] - Option hover text color.
 * @cssprop [--hx-time-picker-option-selected-bg=var(--hx-color-primary-100)] - Selected option background.
 * @cssprop [--hx-time-picker-option-selected-color=var(--hx-color-primary-800)] - Selected option text color.
 */
@customElement('hx-time-picker')
export class HelixTimePicker extends LitElement {
  static override styles = [tokenStyles, helixTimePickerStyles];

  // ─── Form Association ───

  static formAssociated = true;

  private readonly _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name submitted with the form. Value is always HH:MM (24-hour).
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The current value in HH:MM (24-hour) format.
   * @attr value
   */
  @property({ type: String, reflect: true })
  value = '';

  /**
   * The earliest selectable time in HH:MM format.
   * @attr min
   */
  @property({ type: String })
  min = '00:00';

  /**
   * The latest selectable time in HH:MM format.
   * @attr max
   */
  @property({ type: String })
  max = '23:59';

  /**
   * Step interval between dropdown options, in minutes. Defaults to 30.
   * @attr step
   */
  @property({ type: Number })
  step = 30;

  /**
   * The visible label text for the field.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the field is required for form submission.
   * @attr required
   */
  @property({ type: Boolean, reflect: true })
  required = false;

  /**
   * Whether the field is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message to display. When set, the field enters an error state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Display format for the time input. '12h' shows AM/PM; '24h' is bare HH:MM.
   * @attr format
   */
  @property({ type: String, reflect: true })
  format: '12h' | '24h' = '12h';

  // ─── Internal State ───

  @state() private _open = false;
  @state() private _activeIndex = -1;
  @state() private _inputDisplayValue = '';
  @state() private _hasLabelSlot = false;
  @state() private _hasErrorSlot = false;

  // ─── Stable IDs ───

  private readonly _id = `hx-time-picker-${Math.random().toString(36).slice(2, 9)}`;
  private readonly _listboxId = `${this._id}-listbox`;
  private readonly _errorId = `${this._id}-error`;
  private readonly _helpId = `${this._id}-help`;

  // ─── Query References ───

  @query('.field__input')
  private _inputEl!: HTMLInputElement;

  @query('.field__listbox')
  private _listboxEl!: HTMLUListElement;

  // ─── Computed Slots ───

  private get _slots(): TimeSlot[] {
    return generateSlots(this.min, this.max, this.step, this.format);
  }

  // ─── Outside-click handler (bound reference for add/removeEventListener) ───

  private readonly _handleOutsideClick = (e: MouseEvent): void => {
    if (!this.contains(e.target as Node) && !this.shadowRoot?.contains(e.target as Node)) {
      this._closeListbox();
    }
  };

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._handleOutsideClick);
  }

  override willUpdate(changed: Map<string, unknown>): void {
    // Keep display value in sync whenever the canonical value or format changes
    if (changed.has('value') || changed.has('format')) {
      this._inputDisplayValue = this.value
        ? this.format === '12h'
          ? to12h(this.value)
          : this.value
        : '';
    }
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('value')) {
      this._internals.setFormValue(this.value || null);
      this._updateValidity();
    }
    // When the listbox opens, scroll the selected (or active) option into view
    if (changed.has('_open') && this._open) {
      this._scrollActiveOptionIntoView();
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

  /** Checks whether the field satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'Please select a time.',
        this._inputEl ?? undefined,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.value = '';
    this._inputDisplayValue = '';
    this._internals.setFormValue(null);
    this._closeListbox();
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  // ─── Listbox helpers ───

  private _openListbox(): void {
    if (this._open) return;
    // Pre-set active index to currently selected slot (or 0)
    const selectedIndex = this._slots.findIndex((s) => s.value === this.value);
    this._activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this._open = true;
  }

  private _closeListbox(): void {
    if (!this._open) return;
    this._open = false;
    this._activeIndex = -1;
  }

  private _scrollActiveOptionIntoView(): void {
    if (!this._listboxEl) return;
    const active = this._listboxEl.querySelector<HTMLElement>('.field__option--active');
    active?.scrollIntoView({ block: 'nearest' });
  }

  private _selectSlot(slot: TimeSlot): void {
    const clamped = clampValue(slot.value, this.min, this.max);
    this.value = clamped;
    this._closeListbox();
    this._dispatchChange(clamped);
  }

  // ─── Slot tracking ───

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedNodes({ flatten: true }).length > 0;
  }

  // ─── Event Dispatch ───

  private _dispatchChange(value: string): void {
    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  // ─── Input Handlers ───

  private _handleInputClick(): void {
    if (!this.disabled) this._openListbox();
  }

  private _handleToggleClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.disabled) return;
    if (this._open) {
      this._closeListbox();
    } else {
      this._openListbox();
      this._inputEl?.focus();
    }
  }

  private _handleInputInput(e: Event): void {
    const target = e.target as HTMLInputElement;
    this._inputDisplayValue = target.value;
    // Open the listbox as the user types
    if (!this._open) this._openListbox();
  }

  private _handleInputChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const raw = target.value.trim();

    if (!raw) {
      // User cleared the field
      this.value = '';
      this._internals.setFormValue(null);
      this._updateValidity();
      this._dispatchChange('');
      return;
    }

    const parsed = parseUserInput(raw);
    if (parsed) {
      const clamped = clampValue(parsed, this.min, this.max);
      this.value = clamped;
      this._dispatchChange(clamped);
    } else {
      // Revert display to last known good value
      this._inputDisplayValue = this.value
        ? this.format === '12h'
          ? to12h(this.value)
          : this.value
        : '';
    }
  }

  private _handleInputKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._open) {
          this._openListbox();
        } else {
          this._activeIndex = Math.min(this._activeIndex + 1, this._slots.length - 1);
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this._open) {
          this._activeIndex = Math.max(this._activeIndex - 1, 0);
          this._scrollActiveOptionIntoView();
        }
        break;

      case 'Enter':
        if (this._open && this._activeIndex >= 0) {
          e.preventDefault();
          const slot = this._slots[this._activeIndex];
          if (slot) this._selectSlot(slot);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this._closeListbox();
        break;

      case 'Tab':
        this._closeListbox();
        break;
    }
  }

  private _handleOptionPointerDown(e: MouseEvent): void {
    // Prevent the input from losing focus when clicking an option
    e.preventDefault();
  }

  private _handleOptionClick(slot: TimeSlot): void {
    this._selectSlot(slot);
    this._inputEl?.focus();
  }

  private _handleOptionMouseEnter(index: number): void {
    this._activeIndex = index;
  }

  // ─── Public API ───

  /** Moves focus to the time input element. */
  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const slots = this._slots;

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    const activeDescendant =
      this._open && this._activeIndex >= 0
        ? `${this._listboxId}-option-${this._activeIndex}`
        : undefined;

    const placeholder = this.format === '12h' ? 'hh:mm AM' : 'hh:mm';

    const describedBy =
      [hasError ? this._errorId : null, this._helpId].filter(Boolean).join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <slot name="label" @slotchange=${this._handleLabelSlotChange}>
          ${this.label
            ? html`
                <label part="label" class="field__label" for=${this._id}>
                  ${this.label}
                  ${this.required
                    ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                    : nothing}
                </label>
              `
            : nothing}
        </slot>

        <!-- Combobox wrapper (role=combobox lives on the wrapper div) -->
        <div
          class="field__combobox"
          role="combobox"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-haspopup="listbox"
          aria-owns=${ifDefined(this._open ? this._listboxId : undefined)}
        >
          <input
            part="input"
            class="field__input"
            id=${this._id}
            type="text"
            inputmode="text"
            autocomplete="off"
            spellcheck="false"
            .value=${live(this._inputDisplayValue)}
            placeholder=${placeholder}
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-autocomplete="list"
            aria-controls=${ifDefined(this._open ? this._listboxId : undefined)}
            aria-activedescendant=${ifDefined(activeDescendant)}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            @click=${this._handleInputClick}
            @input=${this._handleInputInput}
            @change=${this._handleInputChange}
            @keydown=${this._handleInputKeyDown}
          />

          <!-- Toggle button -->
          <button
            type="button"
            class="field__toggle"
            tabindex="-1"
            aria-label=${this._open ? 'Close time picker' : 'Open time picker'}
            ?disabled=${this.disabled}
            @click=${this._handleToggleClick}
          >
            <!-- Clock icon -->
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.25" />
              <path
                d="M8 4.5V8L10.5 10"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <!-- Dropdown listbox -->
          ${this._open
            ? html`
                <ul
                  part="listbox"
                  class="field__listbox"
                  id=${this._listboxId}
                  role="listbox"
                  aria-label=${this.label || 'Time options'}
                >
                  ${repeat(
                    slots,
                    (slot) => slot.value,
                    (slot, index) => {
                      const isSelected = slot.value === this.value;
                      const isActive = index === this._activeIndex;
                      return html`
                        <li
                          part="option"
                          class=${classMap({
                            field__option: true,
                            'field__option--selected': isSelected,
                            'field__option--active': isActive,
                          })}
                          id="${this._listboxId}-option-${index}"
                          role="option"
                          aria-selected=${isSelected ? 'true' : 'false'}
                          @pointerdown=${this._handleOptionPointerDown}
                          @click=${() => this._handleOptionClick(slot)}
                          @mouseenter=${() => this._handleOptionMouseEnter(index)}
                        >
                          ${slot.label}
                        </li>
                      `;
                    },
                  )}
                </ul>
              `
            : nothing}
        </div>

        <!-- Error slot / property -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div
                  part="error"
                  class="field__error"
                  id=${this._errorId}
                  role="alert"
                  aria-live="polite"
                >
                  ${this.error}
                </div>
              `
            : nothing}
        </slot>

        <!-- Help slot -->
        <div part="help-text" class="field__help-text" id=${this._helpId}>
          <slot name="help"></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-time-picker': HelixTimePicker;
  }
}
