import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixDatePickerStyles } from './hx-date-picker.styles.js';

let _instanceCounter = 0;

/**
 * Date picker component for selecting dates with keyboard-accessible calendar popup.
 *
 * @summary Form-associated date picker with calendar popup and WCAG 2.1 AA accessibility.
 *
 * @tag hx-date-picker
 *
 * @slot label - Custom label content (overrides the label property).
 * @slot help-text - Custom help text content (overrides the helpText property).
 * @slot error - Custom error content (overrides the error property).
 *
 * @fires {CustomEvent<{value: string, date: Date | null}>} hx-change - Emitted when the selected date changes.
 *
 * @csspart field - The outer field container.
 * @csspart label - The label element.
 * @csspart input-wrapper - The wrapper around input and trigger.
 * @csspart input - The readonly text input displaying the formatted date.
 * @csspart trigger - The calendar icon button.
 * @csspart calendar - The calendar popup dialog.
 * @csspart month-nav - The month navigation header.
 * @csspart day - An individual day button in the calendar grid.
 * @csspart help-text - The help text container.
 * @csspart error - The error message container.
 *
 * @cssprop [--hx-date-picker-bg=var(--hx-color-neutral-0)] - Input background color.
 * @cssprop [--hx-date-picker-color=var(--hx-color-neutral-800)] - Input text color.
 * @cssprop [--hx-date-picker-border-color=var(--hx-color-neutral-300)] - Border color.
 * @cssprop [--hx-date-picker-border-radius=var(--hx-border-radius-md)] - Border radius.
 * @cssprop [--hx-date-picker-font-family=var(--hx-font-family-sans)] - Font family.
 * @cssprop [--hx-date-picker-focus-ring-color=var(--hx-focus-ring-color)] - Focus ring color.
 * @cssprop [--hx-date-picker-error-color=var(--hx-color-error-500)] - Error state color.
 * @cssprop [--hx-date-picker-label-color=var(--hx-color-neutral-700)] - Label text color.
 * @cssprop [--hx-date-picker-trigger-color=var(--hx-color-neutral-500)] - Trigger icon color.
 * @cssprop [--hx-date-picker-calendar-bg=var(--hx-color-neutral-0)] - Calendar background color.
 * @cssprop [--hx-date-picker-calendar-border-color=var(--hx-color-neutral-200)] - Calendar border color.
 * @cssprop [--hx-date-picker-calendar-min-width=18rem] - Calendar minimum width.
 * @cssprop [--hx-date-picker-selected-bg=var(--hx-color-primary-500)] - Selected day background.
 * @cssprop [--hx-date-picker-selected-color=var(--hx-color-neutral-0)] - Selected day text color.
 * @cssprop [--hx-date-picker-today-color=var(--hx-color-primary-600)] - Today indicator color.
 * @cssprop [--hx-date-picker-calendar-shadow=0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)] - Calendar popup box shadow.
 */
@customElement('hx-date-picker')
export class HelixDatePicker extends LitElement {
  static override styles = [tokenStyles, helixDatePickerStyles];

  // ─── Form Association ───

  /**
   * Marks this component as form-associated for native form participation.
   * @internal
   */
  static formAssociated = true;

  /**
   * ElementInternals instance for form association.
   * @internal
   */
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The name of the field, used for form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * The current value as an ISO 8601 date string (e.g. 2026-03-04).
   * @attr value
   */
  @property({ type: String })
  value = '';

  /**
   * The minimum selectable date as an ISO 8601 string.
   * @attr min
   */
  @property({ type: String })
  min = '';

  /**
   * The maximum selectable date as an ISO 8601 string.
   * @attr max
   */
  @property({ type: String })
  max = '';

  /**
   * The visible label text.
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
   * Help text displayed below the field for guidance.
   * @attr help-text
   */
  @property({ type: String, attribute: 'help-text' })
  helpText = '';

  /**
   * Display format hint shown as placeholder (e.g. MM/DD/YYYY).
   * @attr format
   */
  @property({ type: String })
  format = 'MM/DD/YYYY';

  /**
   * Locale string used for formatting the display value.
   * @attr locale
   */
  @property({ type: String })
  locale = 'en-US';

  /** Accessible label for the calendar grid/dialog. */
  @property({ type: String, attribute: 'label-choose-date' })
  labelChooseDate = 'Choose a date';

  /** Accessible label for the "previous month" button. */
  @property({ type: String, attribute: 'label-prev-month' })
  labelPrevMonth = 'Previous month';

  /** Accessible label for the "next month" button. */
  @property({ type: String, attribute: 'label-next-month' })
  labelNextMonth = 'Next month';

  /** Accessible label for the calendar trigger button when calendar is closed. */
  @property({ type: String, attribute: 'label-open-calendar' })
  labelOpenCalendar = 'Open calendar';

  /** Accessible label for the calendar trigger button when calendar is open. */
  @property({ type: String, attribute: 'label-close-calendar' })
  labelCloseCalendar = 'Close calendar';

  // ─── Internal State ───

  /**
   * Tracks whether the calendar popup is currently visible.
   * @internal
   */
  @state() private _isOpen = false;
  /**
   * The year currently displayed in the calendar view.
   * @internal
   */
  @state() private _viewYear: number = new Date().getFullYear();
  /**
   * The month (0-indexed) currently displayed in the calendar view.
   * @internal
   */
  @state() private _viewMonth: number = new Date().getMonth();
  /**
   * The day number currently focused within the calendar grid, or null when the calendar is closed.
   * @internal
   */
  @state() private _focusedDay: number | null = null;
  /**
   * The message announced to screen readers when the calendar month changes.
   * @internal
   */
  @state() private _liveMessage = '';

  // ─── Internal References ───

  /**
   * Reference to the readonly text input element displaying the formatted date.
   * @internal
   */
  @query('.field__input')
  private _input: HTMLInputElement | undefined;

  /**
   * Reference to the calendar icon button that opens and closes the popup.
   * @internal
   */
  @query('.field__trigger')
  private _trigger: HTMLButtonElement | undefined;

  /**
   * Reference to the calendar popup dialog element.
   * @internal
   */
  @query('.calendar')
  private _calendar: HTMLElement | undefined;

  // ─── Unique IDs ───

  /**
   * Unique base ID for this component instance, used to generate all child element IDs.
   * @internal
   */
  private _id = `hx-date-picker-${++_instanceCounter}`;
  /**
   * Unique ID for the text input element, used for label association.
   * @internal
   */
  private _inputId = `${this._id}-input`;
  /**
   * Unique ID for the help text element, used for aria-describedby association.
   * @internal
   */
  private _helpTextId = `${this._id}-help`;
  /**
   * Unique ID for the error message element, used for aria-describedby association.
   * @internal
   */
  private _errorId = `${this._id}-error`;
  /**
   * Unique ID for the calendar popup dialog element, used for aria-controls association.
   * @internal
   */
  private _calendarId = `${this._id}-calendar`;
  /**
   * Unique ID for the ARIA live region element that announces month navigation changes.
   * @internal
   */
  private _liveRegionId = `${this._id}-live`;

  // ─── Slot Tracking ───

  /**
   * Whether the label slot has any assigned elements, used to switch between slotted and property-based label rendering.
   * @internal
   */
  private _hasLabelSlot = false;
  /**
   * Whether the error slot has any assigned elements, used to switch between slotted and property-based error rendering.
   * @internal
   */
  private _hasErrorSlot = false;

  private _handleLabelSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLabelSlot = slot.assignedElements().length > 0;
    if (this._hasLabelSlot) {
      const slottedLabel = slot.assignedElements()[0];
      if (slottedLabel && !slottedLabel.id) {
        slottedLabel.id = `${this._inputId}-slotted-label`;
      }
    }
    this.requestUpdate();
  }

  private _handleErrorSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasErrorSlot = slot.assignedElements().length > 0;
    this.requestUpdate();
  }

  // ─── Bound Handler References ───

  /**
   * Bound reference to the outside-click handler, stored so the same function reference can be removed from document listeners.
   * @internal
   */
  private _boundHandleOutsideClick: (e: MouseEvent) => void = () => undefined;
  /**
   * Bound reference to the document keydown handler, stored so the same function reference can be removed from document listeners.
   * @internal
   */
  private _boundHandleDocumentKeydown: (e: KeyboardEvent) => void = () => undefined;

  // ─── Lifecycle ───

  override connectedCallback(): void {
    super.connectedCallback();
    this._boundHandleOutsideClick = this._handleOutsideClick.bind(this);
    this._boundHandleDocumentKeydown = this._handleDocumentKeydown.bind(this);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleOutsideClick);
    document.removeEventListener('keydown', this._boundHandleDocumentKeydown);
  }

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);

    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }

    if ((changedProperties as Map<PropertyKey, unknown>).has('_isOpen')) {
      if (this._isOpen) {
        // Sync view to the currently selected date when opening.
        const selected = this._parseISODate(this.value);
        if (selected) {
          this._viewYear = selected.getFullYear();
          this._viewMonth = selected.getMonth();
        }
        document.addEventListener('click', this._boundHandleOutsideClick);
        document.addEventListener('keydown', this._boundHandleDocumentKeydown);
        // Focus the calendar after it renders.
        this.updateComplete.then(() => {
          this._focusActiveDay();
        });
      } else {
        document.removeEventListener('click', this._boundHandleOutsideClick);
        document.removeEventListener('keydown', this._boundHandleDocumentKeydown);
        this._focusedDay = null;
      }
    }

    if (
      (changedProperties as Map<PropertyKey, unknown>).has('_viewMonth') ||
      (changedProperties as Map<PropertyKey, unknown>).has('_viewYear')
    ) {
      if (this._isOpen) {
        const monthName = this._getMonthName(this._viewMonth);
        this._liveMessage = `${monthName} ${this._viewYear}`;
        this.updateComplete.then(() => {
          this._focusActiveDay();
        });
      }
    }
  }

  private _handleOutsideClick(e: MouseEvent): void {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this._closeCalendar();
    }
  }

  private _handleDocumentKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._isOpen) {
      this._closeCalendar();
    }
  }

  // ─── Form Integration ───

  /** The form element associated with this component, or null if not in a form. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** The current validation message, or an empty string if the field is valid. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** The current validity state of the field. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity(
        { valueMissing: true },
        this.error || 'This field is required.',
        this._input,
      );
    } else {
      this._internals.setValidity({});
    }
  }

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue(null);
    this._isOpen = false;
  }

  formStateRestoreCallback(
    state: string | File | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (typeof state === 'string') {
      this.value = state;
    }
  }

  // ─── Public Methods ───

  override focus(options?: FocusOptions): void {
    this._trigger?.focus(options);
  }

  // ─── Date Utilities ───

  private _parseISODate(iso: string): Date | null {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  private _toISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private _formatForDisplay(iso: string): string {
    const date = this._parseISODate(iso);
    if (!date) return '';
    return date.toLocaleDateString(this.locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private _isDateDisabled(date: Date): boolean {
    const iso = this._toISO(date);
    if (this.min && iso < this.min) return true;
    if (this.max && iso > this.max) return true;
    return false;
  }

  private _isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private _isToday(date: Date): boolean {
    return this._isSameDay(date, new Date());
  }

  private _getMonthName(month: number): string {
    return new Date(2000, month, 1).toLocaleDateString(this.locale, { month: 'long' });
  }

  private _getDayName(dayIndex: number): string {
    // dayIndex: 0=Sun, 1=Mon, ...
    return new Date(2000, 0, 2 + dayIndex).toLocaleDateString(this.locale, {
      weekday: 'short',
    });
  }

  // ─── Calendar Grid ───

  /**
   * Returns an array of Date objects (or null for padding cells) representing
   * the 6-week grid for the current view month.
   */
  private _getDaysInGrid(): (Date | null)[] {
    const firstOfMonth = new Date(this._viewYear, this._viewMonth, 1);
    const leadingBlanks = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];

    // Leading blank cells for days before the 1st
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(null);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(this._viewYear, this._viewMonth, d));
    }

    // Trailing blank cells to complete a full 7-column row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
    }

    return cells;
  }

  // ─── Calendar Open/Close ───

  private _openCalendar(): void {
    if (this.disabled) return;
    this._isOpen = true;
  }

  private _closeCalendar(): void {
    this._isOpen = false;
    // Return focus to trigger after calendar closes.
    this.updateComplete.then(() => {
      this._trigger?.focus();
    });
  }

  private _toggleCalendar(): void {
    if (this._isOpen) {
      this._closeCalendar();
    } else {
      this._openCalendar();
    }
  }

  // ─── Focus Management ───

  private _focusActiveDay(): void {
    if (!this._calendar) return;

    const selectedISO = this.value;
    const selected = this._parseISODate(selectedISO);

    // Try to focus: selected day > today (if in view) > first enabled day
    let targetDay: number | null = null;

    if (
      selected &&
      selected.getFullYear() === this._viewYear &&
      selected.getMonth() === this._viewMonth
    ) {
      targetDay = selected.getDate();
    } else {
      const today = new Date();
      if (today.getFullYear() === this._viewYear && today.getMonth() === this._viewMonth) {
        const todayDate = new Date(this._viewYear, this._viewMonth, today.getDate());
        if (!this._isDateDisabled(todayDate)) {
          targetDay = today.getDate();
        }
      }
    }

    if (targetDay === null) {
      // Find first enabled day in the month
      const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(this._viewYear, this._viewMonth, d);
        if (!this._isDateDisabled(date)) {
          targetDay = d;
          break;
        }
      }
    }

    if (targetDay !== null) {
      this._focusedDay = targetDay;
      this.updateComplete.then(() => {
        const btn = this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${targetDay}"]`);
        btn?.focus();
      });
    }
  }

  // ─── Month Navigation ───

  private _prevMonth(): void {
    if (this._viewMonth === 0) {
      this._viewMonth = 11;
      this._viewYear = this._viewYear - 1;
    } else {
      this._viewMonth = this._viewMonth - 1;
    }
  }

  private _nextMonth(): void {
    if (this._viewMonth === 11) {
      this._viewMonth = 0;
      this._viewYear = this._viewYear + 1;
    } else {
      this._viewMonth = this._viewMonth + 1;
    }
  }

  // ─── Day Selection ───

  private _selectDay(date: Date): void {
    if (this._isDateDisabled(date)) return;

    const iso = this._toISO(date);
    this.value = iso;
    this._internals.setFormValue(iso);
    this._updateValidity();

    this.dispatchEvent(
      new CustomEvent<{ value: string; date: Date }>('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: iso, date },
      }),
    );

    this._closeCalendar();
  }

  // ─── Calendar Keyboard Navigation ───

  private _handleCalendarKeydown(e: KeyboardEvent): void {
    const { key } = e;

    if (key === 'Tab') {
      this._handleCalendarTab(e);
      return;
    }

    // Explicit Escape handler on the calendar container provides a reliable
    // exit path even when the document-level handler does not fire (e.g. when
    // the event is stopped by a descendant or the shadow boundary interferes).
    if (key === 'Escape') {
      e.stopPropagation();
      this._closeCalendar();
      return;
    }

    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'ArrowUp' &&
      key !== 'ArrowDown' &&
      key !== 'Enter' &&
      key !== ' ' &&
      key !== 'Home' &&
      key !== 'End' &&
      key !== 'PageUp' &&
      key !== 'PageDown'
    ) {
      return;
    }

    e.preventDefault();

    const currentFocused = this._focusedDay ?? 1;
    const daysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();

    if (key === 'Enter' || key === ' ') {
      const date = new Date(this._viewYear, this._viewMonth, currentFocused);
      if (!this._isDateDisabled(date)) {
        this._selectDay(date);
      }
      return;
    }

    if (key === 'PageUp') {
      this._prevMonth();
      return;
    }

    if (key === 'PageDown') {
      this._nextMonth();
      return;
    }

    if (key === 'Home') {
      // Move to start of current week (Sunday)
      const currentDate = new Date(this._viewYear, this._viewMonth, currentFocused);
      const dayOfWeek = currentDate.getDay();
      const newDay = currentFocused - dayOfWeek;
      if (newDay >= 1) {
        this._focusedDay = newDay;
        this.updateComplete.then(() => {
          this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
        });
      }
      return;
    }

    if (key === 'End') {
      // Move to end of current week (Saturday)
      const currentDate = new Date(this._viewYear, this._viewMonth, currentFocused);
      const dayOfWeek = currentDate.getDay();
      const daysToSaturday = 6 - dayOfWeek;
      const newDay = currentFocused + daysToSaturday;
      if (newDay <= daysInMonth) {
        this._focusedDay = newDay;
        this.updateComplete.then(() => {
          this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
        });
      }
      return;
    }

    let newDay = currentFocused;

    if (key === 'ArrowLeft') newDay = currentFocused - 1;
    if (key === 'ArrowRight') newDay = currentFocused + 1;
    if (key === 'ArrowUp') newDay = currentFocused - 7;
    if (key === 'ArrowDown') newDay = currentFocused + 7;

    if (newDay < 1) {
      // Wrap to previous month
      this._prevMonth();
      const prevDaysInMonth = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      this._focusedDay = prevDaysInMonth + newDay;
      this.updateComplete.then(() => {
        const day = this._focusedDay;
        this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
      });
      return;
    }

    if (newDay > daysInMonth) {
      // Wrap to next month
      const overflow = newDay - daysInMonth;
      this._nextMonth();
      this._focusedDay = overflow;
      this.updateComplete.then(() => {
        const day = this._focusedDay;
        this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
      });
      return;
    }

    this._focusedDay = newDay;
    this.updateComplete.then(() => {
      this._calendar?.querySelector<HTMLButtonElement>(`[data-day="${newDay}"]`)?.focus();
    });
  }

  // ─── Navigation Boundary Checks ───

  private _isPrevMonthDisabled(): boolean {
    if (!this.min) return false;
    const firstOfCurrentView = new Date(this._viewYear, this._viewMonth, 1);
    const minDate = this._parseISODate(this.min);
    if (!minDate) return false;
    return firstOfCurrentView <= minDate;
  }

  private _isNextMonthDisabled(): boolean {
    if (!this.max) return false;
    const lastOfCurrentView = new Date(this._viewYear, this._viewMonth + 1, 0);
    const maxDate = this._parseISODate(this.max);
    if (!maxDate) return false;
    return lastOfCurrentView >= maxDate;
  }

  // ─── Focus Trap ───

  private _handleCalendarTab(e: KeyboardEvent): void {
    if (e.key !== 'Tab' || !this._isOpen) return;

    const focusableEls = this._calendar?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex="0"]',
    );
    if (!focusableEls || focusableEls.length === 0) return;

    const first = focusableEls[0];
    const last = focusableEls[focusableEls.length - 1];

    // In shadow DOM, document.activeElement returns the host element, not the
    // focused inner element. Use shadowRoot.activeElement exclusively so the
    // comparison is accurate and the trap cannot malfunction and strand users.
    const shadowActive = this.shadowRoot?.activeElement;

    if (e.shiftKey) {
      if (shadowActive === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (shadowActive === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  // ─── Render Helpers ───

  private _renderWeekdayHeaders() {
    const headers = Array.from(
      { length: 7 },
      (_, i) =>
        html`<div class="calendar__weekday" role="columnheader" aria-label=${this._getDayName(i)}>
          ${this._getDayName(i).slice(0, 2)}
        </div>`,
    );
    return html`<div class="calendar__row" role="row">${headers}</div>`;
  }

  private _renderDayGrid() {
    const cells = this._getDaysInGrid();
    const selectedDate = this._parseISODate(this.value);

    const rows: ReturnType<typeof html>[] = [];

    for (let rowStart = 0; rowStart < cells.length; rowStart += 7) {
      const rowCells = cells.slice(rowStart, rowStart + 7).map((date) => {
        if (date === null) {
          return html`<div class="calendar__day-cell" role="gridcell" aria-hidden="true"></div>`;
        }

        const isSelected = selectedDate ? this._isSameDay(date, selectedDate) : false;
        const isToday = this._isToday(date);
        const isDisabled = this._isDateDisabled(date);
        const isFocused = this._focusedDay === date.getDate();
        const dayNumber = date.getDate();

        const ariaLabel = date.toLocaleDateString(this.locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const dayClasses = {
          calendar__day: true,
          'calendar__day--selected': isSelected,
          'calendar__day--today': isToday,
          'calendar__day--disabled': isDisabled,
        };

        return html`<div class="calendar__day-cell">
          <button
            part="day"
            class=${classMap(dayClasses)}
            type="button"
            role="gridcell"
            data-day=${dayNumber}
            aria-label=${ariaLabel}
            aria-selected=${isSelected ? 'true' : nothing}
            aria-disabled=${isDisabled ? 'true' : nothing}
            aria-current=${isToday ? 'date' : nothing}
            tabindex=${isFocused ? '0' : '-1'}
            ?disabled=${isDisabled}
            @click=${() => {
              this._selectDay(date);
            }}
          >
            ${dayNumber}
          </button>
        </div>`;
      });

      rows.push(html`<div class="calendar__row" role="row">${rowCells}</div>`);
    }

    return rows;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error || this._hasErrorSlot;
    const displayValue = this._formatForDisplay(this.value);
    const monthName = this._getMonthName(this._viewMonth);

    const fieldClasses = {
      field: true,
      'field--error': hasError,
      'field--disabled': this.disabled,
      'field--required': this.required,
    };

    const describedBy =
      [hasError ? this._errorId : null, this.helpText ? this._helpTextId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    return html`
      <div part="field" class=${classMap(fieldClasses)}>
        <!-- Label -->
        <div class="field__label-wrapper">
          <slot name="label" @slotchange=${this._handleLabelSlotChange}>
            ${this.label
              ? html`
                  <label part="label" class="field__label" for=${this._inputId}>
                    ${this.label}
                    ${this.required
                      ? html`<span class="field__required-marker" aria-hidden="true">*</span>`
                      : nothing}
                  </label>
                `
              : nothing}
          </slot>
        </div>

        <!-- Input + Trigger -->
        <div part="input-wrapper" class="field__input-wrapper">
          <input
            part="input"
            class="field__input"
            id=${this._inputId}
            type="text"
            readonly
            .value=${displayValue}
            placeholder=${ifDefined(this.format || undefined)}
            ?disabled=${this.disabled}
            aria-labelledby=${ifDefined(
              this._hasLabelSlot ? `${this._inputId}-slotted-label` : undefined,
            )}
            aria-invalid=${hasError ? 'true' : nothing}
            aria-describedby=${ifDefined(describedBy)}
            aria-required=${this.required ? 'true' : nothing}
            aria-haspopup="dialog"
            @click=${this._openCalendar}
          />
          <button
            part="trigger"
            class="field__trigger"
            type="button"
            aria-label=${this._isOpen ? this.labelCloseCalendar : this.labelOpenCalendar}
            aria-haspopup="dialog"
            aria-expanded=${this._isOpen ? 'true' : nothing}
            aria-controls=${this._calendarId}
            ?disabled=${this.disabled}
            @click=${this._toggleCalendar}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>

        <!-- Calendar Popup -->
        ${this._isOpen
          ? html`
              <div
                part="calendar"
                class="calendar"
                id=${this._calendarId}
                role="dialog"
                aria-modal="true"
                aria-label=${this.labelChooseDate}
                @keydown=${this._handleCalendarKeydown}
              >
                <!-- Screen reader live region -->
                <div
                  id=${this._liveRegionId}
                  class="calendar__live-region"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  ${this._liveMessage}
                </div>

                <!-- Month Navigation -->
                <div part="month-nav" class="calendar__nav">
                  <button
                    class="calendar__nav-btn"
                    type="button"
                    aria-label=${this.labelPrevMonth}
                    ?disabled=${this._isPrevMonthDisabled()}
                    @click=${this._prevMonth}
                  >
                    &#8249;
                  </button>
                  <span class="calendar__month-label" aria-hidden="true">
                    ${monthName} ${this._viewYear}
                  </span>
                  <button
                    class="calendar__nav-btn"
                    type="button"
                    aria-label=${this.labelNextMonth}
                    ?disabled=${this._isNextMonthDisabled()}
                    @click=${this._nextMonth}
                  >
                    &#8250;
                  </button>
                </div>

                <!-- Day Grid -->
                <div class="calendar__grid" role="grid" aria-label="${monthName} ${this._viewYear}">
                  ${this._renderWeekdayHeaders()} ${this._renderDayGrid()}
                </div>
              </div>
            `
          : nothing}

        <!-- Error -->
        <slot name="error" @slotchange=${this._handleErrorSlotChange}>
          ${this.error
            ? html`
                <div part="error" class="field__error" id=${this._errorId} role="alert">
                  ${this.error}
                </div>
              `
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
    'hx-date-picker': HelixDatePicker;
  }
}
