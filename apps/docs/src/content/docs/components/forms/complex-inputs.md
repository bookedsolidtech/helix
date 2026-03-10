---
title: Complex Form Components
description: Deep dive into building complex form patterns with wc-2026 components. Learn multi-value inputs, date pickers, file upload, rich text, form arrays, nested forms, and advanced validation strategies for enterprise healthcare applications.
sidebar:
  order: 4
---

# Complex Form Components

Real-world healthcare applications demand more than simple text inputs and checkboxes. You need dynamic field groups, repeating sections, conditional validation, nested data structures, date pickers, file uploads, and complex user interactions. This guide covers advanced form patterns using wc-2026 components: multi-value inputs, date/time handling, file management, form arrays, nested forms, dynamic field management, and strategies for handling complex state in enterprise applications.

By the end of this guide, you'll understand how to build sophisticated form interfaces that maintain accessibility, validation integrity, and developer ergonomics at scale.

## Table of Contents

1. [Overview](#overview)
2. [Multi-Value Input Patterns](#multi-value-input-patterns)
3. [Date and Time Pickers](#date-and-time-pickers)
4. [File Upload with ElementInternals](#file-upload-with-elementinternals)
5. [Rich Text Editor Integration](#rich-text-editor-integration)
6. [Form Arrays and Repeating Fields](#form-arrays-and-repeating-fields)
7. [Nested Form Structures](#nested-form-structures)
8. [Dynamic Field Management](#dynamic-field-management)
9. [Complex Validation Strategies](#complex-validation-strategies)
10. [State Management Approaches](#state-management-approaches)
11. [Performance Optimization](#performance-optimization)
12. [Accessibility Considerations](#accessibility-considerations)
13. [Real-World Examples](#real-world-examples)

---

## Overview

Complex forms arise from complex data models. In healthcare applications, you might encounter:

- **Patient medication lists** — Arrays of medications with dose, frequency, start/end dates
- **Care team assignments** — Nested objects with role, provider, contact information
- **Multi-step workflows** — Conditional field groups based on previous selections
- **Dynamic questionnaires** — Questions added/removed based on answers
- **Bulk data entry** — Repeating row patterns for lab results or vital signs
- **Document attachments** — File uploads with metadata (document type, date, description)
- **Clinical notes** — Rich text editing with formatting, templates, and macros

wc-2026 components provide the primitives. This guide shows you how to compose them into complex, maintainable patterns.

### Prerequisites

Before diving into complex patterns, ensure you understand:

- [Form Participation Fundamentals](/components/forms/fundamentals) — ElementInternals, form association, lifecycle
- [Form Validation Patterns](/components/forms/validation) — Constraint validation, custom validators
- [Accessibility Fundamentals](/components/forms/accessibility) — ARIA patterns, keyboard navigation

### Design Principles for Complex Forms

1. **Start simple, compose complex** — Build complex forms from simple, tested primitives
2. **Validate early, validate often** — Real-time feedback prevents submission errors
3. **Preserve user input** — Never lose data on validation failure or navigation
4. **Announce changes** — Screen readers must understand dynamic field changes
5. **Optimize for performance** — Minimize re-renders, debounce validation
6. **Keep data normalized** — Separate presentation state from form data
7. **Test edge cases** — Complex forms have complex failure modes

---

## Multi-Value Input Patterns

Multi-value inputs allow users to select or enter multiple discrete values. Common patterns include multi-select dropdowns, tag inputs, checkbox groups, and token fields.

### Multi-Select with `hx-checkbox`

For a small, known set of options, a checkbox group provides the most accessible multi-select experience.

```html
<form>
  <fieldset>
    <legend>Allergies</legend>
    <hx-checkbox name="allergies[]" value="penicillin" label="Penicillin"></hx-checkbox>
    <hx-checkbox name="allergies[]" value="latex" label="Latex"></hx-checkbox>
    <hx-checkbox name="allergies[]" value="shellfish" label="Shellfish"></hx-checkbox>
    <hx-checkbox name="allergies[]" value="peanuts" label="Peanuts"></hx-checkbox>
  </fieldset>

  <hx-button type="submit">Save Allergies</hx-button>
</form>
```

**Key Points:**

- Use array notation `name="allergies[]"` for multi-value submission
- Native `FormData` automatically collects all checked values
- Screen readers announce each checkbox independently
- No JavaScript required for basic functionality

**Collecting Values:**

```typescript
const form = document.querySelector('form') as HTMLFormElement;
const formData = new FormData(form);

// Get all checked allergies
const allergies = formData.getAll('allergies[]');
console.log(allergies); // ['penicillin', 'peanuts']
```

### Multi-Select with `hx-select`

For longer lists, a native `<select multiple>` inside `hx-select` provides a compact multi-select:

```html
<hx-select
  label="Care Team Members"
  name="careTeam"
  help-text="Hold Ctrl (Cmd on Mac) to select multiple"
>
  <select multiple size="5">
    <option value="dr-chen">Dr. Sarah Chen (Primary)</option>
    <option value="rn-patel">Nurse Patel (Care Coordinator)</option>
    <option value="pt-johnson">PT Johnson (Physical Therapy)</option>
    <option value="sw-martinez">SW Martinez (Social Work)</option>
    <option value="pharm-lee">Pharm. Lee (Pharmacy)</option>
  </select>
</hx-select>
```

**Limitations:**

- Native multi-select UX is suboptimal (Ctrl+Click pattern)
- Consider building a custom multi-select component for better UX
- For now, use checkbox groups for critical multi-value selections

### Tag Input Pattern (Custom Component)

For free-text multi-value input (e.g., medication names, keywords), build a tag input wrapper:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

/**
 * Tag input for entering multiple free-text values.
 * @summary Form-associated tag input with keyboard support.
 * @tag wc-tag-input
 */
@customElement('hx-tag-input')
export class WcTagInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: Array }) value: string[] = [];
  @property({ type: Number }) maxTags?: number;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _inputValue = '';
  @state() private _error = '';

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      // Serialize array as comma-separated string for form submission
      this._internals.setFormValue(this.value.join(','));
      this._updateValidity();
    }
  }

  private _updateValidity(): void {
    if (this.required && this.value.length === 0) {
      this._internals.setValidity({ valueMissing: true }, 'At least one value is required.');
    } else {
      this._internals.setValidity({});
    }
  }

  private _addTag(tag: string): void {
    const trimmed = tag.trim();
    if (!trimmed) return;

    if (this.value.includes(trimmed)) {
      this._error = 'Tag already exists';
      return;
    }

    if (this.maxTags && this.value.length >= this.maxTags) {
      this._error = `Maximum ${this.maxTags} tags allowed`;
      return;
    }

    this.value = [...this.value, trimmed];
    this._inputValue = '';
    this._error = '';

    this.dispatchEvent(
      new CustomEvent('hx-tag-add', {
        bubbles: true,
        composed: true,
        detail: { tag: trimmed, tags: this.value },
      }),
    );
  }

  private _removeTag(tag: string): void {
    this.value = this.value.filter((t) => t !== tag);
    this._error = '';

    this.dispatchEvent(
      new CustomEvent('hx-tag-remove', {
        bubbles: true,
        composed: true,
        detail: { tag, tags: this.value },
      }),
    );
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      this._addTag(this._inputValue);
    } else if (e.key === 'Backspace' && !this._inputValue && this.value.length > 0) {
      // Delete last tag on backspace when input is empty
      const lastTag = this.value[this.value.length - 1];
      this._removeTag(lastTag!);
    }
  }

  formResetCallback(): void {
    this.value = [];
    this._inputValue = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state ? state.split(',') : [];
  }

  render() {
    return html`
      <div class="tag-input">
        ${this.label ? html`<label>${this.label}</label>` : ''}
        <div class="tag-input__container">
          ${repeat(
            this.value,
            (tag) => tag,
            (tag) => html`
              <span class="tag">
                ${tag}
                <button
                  type="button"
                  @click=${() => this._removeTag(tag)}
                  aria-label="Remove ${tag}"
                  ?disabled=${this.disabled}
                >
                  ×
                </button>
              </span>
            `,
          )}
          <input
            type="text"
            .value=${this._inputValue}
            @input=${(e: Event) => (this._inputValue = (e.target as HTMLInputElement).value)}
            @keydown=${this._handleKeyDown}
            placeholder="Type and press Enter"
            ?disabled=${this.disabled}
          />
        </div>
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .tag-input__container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-md);
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--hx-color-primary-100);
      border-radius: var(--hx-border-radius-sm);
      font-size: 0.875rem;
    }
    .tag button {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
      color: var(--hx-color-neutral-600);
    }
    .tag button:hover {
      color: var(--hx-color-error-500);
    }
    input {
      flex: 1;
      min-width: 150px;
      border: none;
      outline: none;
      font-size: 1rem;
    }
    .error {
      color: var(--hx-color-error-500);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-tag-input': WcTagInput;
  }
}
```

**Usage:**

```html
<wc-tag-input
  name="medications"
  label="Current Medications"
  .value=${['Lisinopril', 'Metformin', 'Atorvastatin']}
  maxTags="10"
  required
></wc-tag-input>
```

**Considerations:**

- Serialize to comma-separated string or JSON for form submission
- Provide clear keyboard affordances (Enter to add, Backspace to delete)
- Announce tag additions/removals with custom events
- Validate each tag individually (e.g., max length, allowed characters)
- Consider max tags limit to prevent abuse

---

## Date and Time Pickers

Date and time inputs are ubiquitous in healthcare: appointment scheduling, medication start/end dates, birth dates, lab collection times. While native `<input type="date">` and `<input type="time">` exist, they have inconsistent UX across browsers.

### Native Date Input (Recommended for MVP)

Start with native date inputs wrapped in `hx-text-input`:

```html
<hx-text-input
  label="Date of Birth"
  name="dateOfBirth"
  type="date"
  required
  max="2026-02-16"
></hx-text-input>

<hx-text-input label="Appointment Time" name="appointmentTime" type="time" required></hx-text-input>
```

**Pros:**

- Native browser date picker (mobile-optimized)
- Automatic validation for date format
- Zero JavaScript required

**Cons:**

- Inconsistent UX across browsers
- Limited styling options
- No advanced features (date ranges, disabled dates)

### Custom Date Picker (Advanced)

For enterprise applications, build a custom date picker with Lit:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Custom date picker with calendar UI.
 * @summary Form-associated date picker with accessible calendar.
 * @tag wc-date-picker
 */
@customElement('hx-date-picker')
export class WcDatePicker extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value = ''; // ISO 8601: YYYY-MM-DD
  @property({ type: String }) min?: string;
  @property({ type: String }) max?: string;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @state() private _isOpen = false;
  @state() private _viewMonth = new Date().getMonth();
  @state() private _viewYear = new Date().getFullYear();

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this._internals.setFormValue(this.value);
      this._updateValidity();
    }
  }

  private _updateValidity(): void {
    if (this.required && !this.value) {
      this._internals.setValidity({ valueMissing: true }, 'Date is required.');
      return;
    }

    if (this.min && this.value && this.value < this.min) {
      this._internals.setValidity(
        { rangeUnderflow: true },
        `Date must be on or after ${this._formatDate(this.min)}.`,
      );
      return;
    }

    if (this.max && this.value && this.value > this.max) {
      this._internals.setValidity(
        { rangeOverflow: true },
        `Date must be on or before ${this._formatDate(this.max)}.`,
      );
      return;
    }

    this._internals.setValidity({});
  }

  private _formatDate(isoDate: string): string {
    const date = new Date(isoDate + 'T00:00:00');
    return date.toLocaleDateString();
  }

  private _selectDate(date: Date): void {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.value = `${year}-${month}-${day}`;
    this._isOpen = false;

    this.dispatchEvent(
      new CustomEvent('hx-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _getDaysInMonth(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = new Date(year, month, -i);
      days.push(prevDay);
    }

    // Add days in current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add padding days from next month
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }

    return days;
  }

  private _isDateDisabled(date: Date): boolean {
    const isoDate = date.toISOString().split('T')[0];
    if (this.min && isoDate! < this.min) return true;
    if (this.max && isoDate! > this.max) return true;
    return false;
  }

  private _isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  private _isSelected(date: Date): boolean {
    if (!this.value) return false;
    const isoDate = date.toISOString().split('T')[0];
    return isoDate === this.value;
  }

  formResetCallback(): void {
    this.value = '';
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
  }

  render() {
    const days = this._getDaysInMonth(this._viewYear, this._viewMonth);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return html`
      <div class="date-picker">
        ${this.label ? html`<label>${this.label}</label>` : ''}

        <button
          type="button"
          class="date-picker__trigger"
          @click=${() => (this._isOpen = !this._isOpen)}
          ?disabled=${this.disabled}
        >
          ${this.value ? this._formatDate(this.value) : 'Select date'}
        </button>

        ${this._isOpen
          ? html`
              <div class="date-picker__calendar" role="dialog" aria-modal="true">
                <div class="calendar__header">
                  <button
                    type="button"
                    @click=${() => {
                      if (this._viewMonth === 0) {
                        this._viewMonth = 11;
                        this._viewYear--;
                      } else {
                        this._viewMonth--;
                      }
                    }}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <span> ${monthNames[this._viewMonth]} ${this._viewYear} </span>
                  <button
                    type="button"
                    @click=${() => {
                      if (this._viewMonth === 11) {
                        this._viewMonth = 0;
                        this._viewYear++;
                      } else {
                        this._viewMonth++;
                      }
                    }}
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div class="calendar__weekdays">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                <div class="calendar__days">
                  ${days.map(
                    (date) => html`
                      <button
                        type="button"
                        class="calendar__day ${this._isToday(date)
                          ? 'calendar__day--today'
                          : ''} ${this._isSelected(date)
                          ? 'calendar__day--selected'
                          : ''} ${date.getMonth() !== this._viewMonth
                          ? 'calendar__day--other-month'
                          : ''}"
                        @click=${() => this._selectDate(date)}
                        ?disabled=${this._isDateDisabled(date)}
                        aria-label=${date.toLocaleDateString()}
                      >
                        ${date.getDate()}
                      </button>
                    `,
                  )}
                </div>
              </div>
            `
          : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
    }
    .date-picker__trigger {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-md);
      background: var(--hx-color-neutral-0);
      text-align: left;
      cursor: pointer;
    }
    .date-picker__calendar {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1000;
      margin-top: 0.25rem;
      padding: 1rem;
      background: var(--hx-color-neutral-0);
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-md);
      box-shadow: var(--hx-shadow-lg);
    }
    .calendar__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .calendar__header button {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .calendar__weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      text-align: center;
    }
    .calendar__days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }
    .calendar__day {
      aspect-ratio: 1;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: var(--hx-border-radius-sm);
    }
    .calendar__day:hover {
      background: var(--hx-color-primary-100);
    }
    .calendar__day--today {
      font-weight: 700;
      color: var(--hx-color-primary-500);
    }
    .calendar__day--selected {
      background: var(--hx-color-primary-500);
      color: var(--hx-color-neutral-0);
    }
    .calendar__day--other-month {
      color: var(--hx-color-neutral-400);
    }
    .calendar__day:disabled {
      color: var(--hx-color-neutral-300);
      cursor: not-allowed;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-date-picker': WcDatePicker;
  }
}
```

**Usage:**

```html
<wc-date-picker
  name="appointmentDate"
  label="Appointment Date"
  min="2026-02-17"
  max="2026-12-31"
  required
></wc-date-picker>
```

**Features:**

- Calendar UI with month/year navigation
- Min/max date validation
- Disabled dates
- Today indicator
- Keyboard navigation (can be enhanced)
- ARIA attributes for accessibility

### Date Range Pattern

For date ranges (e.g., prescription start/end dates), use two date pickers with cross-validation:

```html
<wc-date-picker
  name="startDate"
  label="Start Date"
  .value="${this.startDate}"
  @hx-change="${(e:"
  CustomEvent)=""
>
  { this.startDate = e.detail.value; this._validateDateRange(); }} required ></wc-date-picker
>

<wc-date-picker
  name="endDate"
  label="End Date"
  .value="${this.endDate}"
  .min="${this.startDate}"
  @hx-change="${(e:"
  CustomEvent)=""
>
  { this.endDate = e.detail.value; this._validateDateRange(); }} required ></wc-date-picker
>
```

---

## File Upload with ElementInternals

File uploads are critical for healthcare applications: medical records, lab results, imaging files, consent forms. Build a form-associated file input that integrates seamlessly with ElementInternals.

### Form-Associated File Input

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

/**
 * File input with drag-and-drop and preview.
 * @summary Form-associated file input with validation.
 * @tag wc-file-input
 */
@customElement('hx-file-input')
export class WcFileInput extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: String }) accept = ''; // e.g., "image/*,.pdf"
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Number }) maxSize = 10 * 1024 * 1024; // 10MB default

  @state() private _files: File[] = [];
  @state() private _error = '';
  @state() private _isDragging = false;

  @query('input[type="file"]')
  private _inputEl!: HTMLInputElement;

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('_files')) {
      this._updateFormValue();
      this._updateValidity();
    }
  }

  private _updateFormValue(): void {
    if (this._files.length === 0) {
      this._internals.setFormValue(null);
      return;
    }

    if (this.multiple) {
      const formData = new FormData();
      this._files.forEach((file, index) => {
        formData.append(`${this.name}[${index}]`, file);
      });
      this._internals.setFormValue(formData);
    } else {
      this._internals.setFormValue(this._files[0]!);
    }
  }

  private _updateValidity(): void {
    if (this.required && this._files.length === 0) {
      this._internals.setValidity({ valueMissing: true }, 'Please select a file.');
      return;
    }

    // Validate file sizes
    for (const file of this._files) {
      if (file.size > this.maxSize) {
        this._internals.setValidity(
          { customError: true },
          `File "${file.name}" exceeds maximum size of ${this._formatBytes(this.maxSize)}.`,
        );
        return;
      }
    }

    // Validate file types if accept is specified
    if (this.accept) {
      const acceptedTypes = this.accept.split(',').map((t) => t.trim());
      for (const file of this._files) {
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(`${category}/`);
          }
          return file.type === type || file.name.endsWith(type);
        });

        if (!isAccepted) {
          this._internals.setValidity(
            { typeMismatch: true },
            `File "${file.name}" is not an accepted file type.`,
          );
          return;
        }
      }
    }

    this._internals.setValidity({});
  }

  private _formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private _handleFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      this._files = Array.from(input.files);
    }
  }

  private _handleDragOver(e: DragEvent): void {
    e.preventDefault();
    this._isDragging = true;
  }

  private _handleDragLeave(): void {
    this._isDragging = false;
  }

  private _handleDrop(e: DragEvent): void {
    e.preventDefault();
    this._isDragging = false;

    if (e.dataTransfer?.files) {
      this._files = Array.from(e.dataTransfer.files);
      // Sync with native input
      const dt = new DataTransfer();
      this._files.forEach((file) => dt.items.add(file));
      this._inputEl.files = dt.files;
    }
  }

  private _removeFile(index: number): void {
    this._files = this._files.filter((_, i) => i !== index);
    // Sync with native input
    const dt = new DataTransfer();
    this._files.forEach((file) => dt.items.add(file));
    this._inputEl.files = dt.files;
  }

  formResetCallback(): void {
    this._files = [];
    this._inputEl.value = '';
    this._internals.setFormValue(null);
  }

  override focus(options?: FocusOptions): void {
    this._inputEl?.focus(options);
  }

  render() {
    return html`
      <div class="file-input">
        ${this.label ? html`<label>${this.label}</label>` : ''}

        <div
          class="file-input__dropzone ${this._isDragging ? 'file-input__dropzone--dragging' : ''}"
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}
        >
          <input
            type="file"
            id="file-input"
            ?multiple=${this.multiple}
            accept=${this.accept}
            ?required=${this.required}
            ?disabled=${this.disabled}
            @change=${this._handleFileSelect}
            style="display: none;"
          />

          ${this._files.length === 0
            ? html`
                <label for="file-input" class="file-input__prompt">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <polyline
                      points="17 8 12 3 7 8"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>Click to upload or drag and drop</span>
                  <span class="file-input__hint">
                    ${this.accept ? `Accepted: ${this.accept}` : 'Any file type'} · Max
                    ${this._formatBytes(this.maxSize)}
                  </span>
                </label>
              `
            : html`
                <div class="file-input__files">
                  ${this._files.map(
                    (file, index) => html`
                      <div class="file-item">
                        <div class="file-item__info">
                          <span class="file-item__name">${file.name}</span>
                          <span class="file-item__size"> ${this._formatBytes(file.size)} </span>
                        </div>
                        <button
                          type="button"
                          @click=${() => this._removeFile(index)}
                          aria-label="Remove ${file.name}"
                          ?disabled=${this.disabled}
                        >
                          ×
                        </button>
                      </div>
                    `,
                  )}
                </div>
                <label for="file-input" class="file-input__add-more">
                  ${this.multiple ? '+ Add more files' : 'Replace file'}
                </label>
              `}
        </div>

        ${this._error ? html`<div class="file-input__error">${this._error}</div>` : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .file-input__dropzone {
      border: 2px dashed var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-md);
      padding: 2rem;
      text-align: center;
      transition: border-color 0.2s;
    }
    .file-input__dropzone--dragging {
      border-color: var(--hx-color-primary-500);
      background: var(--hx-color-primary-50);
    }
    .file-input__prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: var(--hx-color-neutral-600);
    }
    .file-input__hint {
      font-size: 0.875rem;
      color: var(--hx-color-neutral-500);
    }
    .file-input__files {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--hx-color-neutral-50);
      border-radius: var(--hx-border-radius-sm);
    }
    .file-item__info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .file-item__name {
      font-weight: 500;
    }
    .file-item__size {
      font-size: 0.875rem;
      color: var(--hx-color-neutral-600);
    }
    .file-item button {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--hx-color-neutral-500);
    }
    .file-item button:hover {
      color: var(--hx-color-error-500);
    }
    .file-input__add-more {
      display: inline-block;
      margin-top: 1rem;
      color: var(--hx-color-primary-500);
      cursor: pointer;
      text-decoration: underline;
    }
    .file-input__error {
      margin-top: 0.5rem;
      color: var(--hx-color-error-500);
      font-size: 0.875rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-file-input': WcFileInput;
  }
}
```

**Usage:**

```html
<wc-file-input
  name="labResults"
  label="Upload Lab Results"
  accept=".pdf,.jpg,.png"
  multiple
  maxSize="5242880"
  required
></wc-file-input>
```

**Features:**

- Drag-and-drop support
- File type validation
- File size validation
- Multiple file support
- File preview list
- Integrates with FormData for submission

---

## Rich Text Editor Integration

Clinical notes, care plans, and discharge summaries often require formatted text. Integrate a rich text editor while maintaining form association.

### Using TinyMCE or Quill

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Rich text editor with form association.
 * @summary Form-associated rich text editor powered by Quill.
 * @tag wc-rich-text-editor
 */
@customElement('hx-rich-text-editor')
export class WcRichTextEditor extends LitElement {
  static formAssociated = true;
  private _internals: ElementInternals;
  private _quill?: Quill;

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  @property({ type: String }) name = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value = '';
  @property({ type: Boolean, reflect: true }) required = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Number }) minLength?: number;

  @state() private _error = '';

  @query('.editor-container')
  private _editorContainer!: HTMLDivElement;

  override firstUpdated(): void {
    this._quill = new Quill(this._editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
    });

    // Set initial value
    if (this.value) {
      this._quill.root.innerHTML = this.value;
    }

    // Listen for changes
    this._quill.on('text-change', () => {
      this.value = this._quill!.root.innerHTML;
      this._internals.setFormValue(this.value);
      this._updateValidity();

      this.dispatchEvent(
        new CustomEvent('hx-input', {
          bubbles: true,
          composed: true,
          detail: { value: this.value },
        }),
      );
    });
  }

  private _updateValidity(): void {
    const textContent = this._quill?.getText().trim() || '';

    if (this.required && !textContent) {
      this._internals.setValidity({ valueMissing: true }, 'This field is required.');
      return;
    }

    if (this.minLength && textContent.length < this.minLength) {
      this._internals.setValidity(
        { tooShort: true },
        `Please enter at least ${this.minLength} characters.`,
      );
      return;
    }

    this._internals.setValidity({});
  }

  formResetCallback(): void {
    this.value = '';
    if (this._quill) {
      this._quill.setText('');
    }
    this._internals.setFormValue('');
  }

  formStateRestoreCallback(state: string): void {
    this.value = state;
    if (this._quill) {
      this._quill.root.innerHTML = state;
    }
  }

  render() {
    return html`
      <div class="rich-text-editor">
        ${this.label ? html`<label>${this.label}</label>` : ''}
        <div class="editor-container"></div>
        ${this._error ? html`<div class="error">${this._error}</div>` : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .editor-container {
      min-height: 200px;
    }
    .error {
      margin-top: 0.5rem;
      color: var(--hx-color-error-500);
      font-size: 0.875rem;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-rich-text-editor': WcRichTextEditor;
  }
}
```

**Usage:**

```html
<wc-rich-text-editor
  name="clinicalNotes"
  label="Clinical Notes"
  required
  minLength="50"
></wc-rich-text-editor>
```

**Considerations:**

- Store HTML in form value
- Sanitize HTML on server to prevent XSS
- Consider storing plain text separately for search/indexing
- Provide templates/macros for common notes
- Keyboard shortcuts for power users

---

## Form Arrays and Repeating Fields

Form arrays represent a collection of similar items (e.g., emergency contacts, medication schedules, lab results). Users need to add, remove, and reorder items dynamically.

### Basic Repeating Field Group

Let's build a medication list where users can add multiple medications, each with name, dose, and frequency.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
}

@customElement('medication-list-form')
export class MedicationListForm extends LitElement {
  @state() private medications: Medication[] = [
    { id: crypto.randomUUID(), name: '', dose: '', frequency: '' },
  ];

  private _addMedication(): void {
    this.medications = [
      ...this.medications,
      { id: crypto.randomUUID(), name: '', dose: '', frequency: '' },
    ];

    // Announce to screen readers
    this.dispatchEvent(
      new CustomEvent('hx-medication-added', {
        bubbles: true,
        composed: true,
        detail: { count: this.medications.length },
      }),
    );
  }

  private _removeMedication(id: string): void {
    this.medications = this.medications.filter((m) => m.id !== id);

    this.dispatchEvent(
      new CustomEvent('hx-medication-removed', {
        bubbles: true,
        composed: true,
        detail: { count: this.medications.length },
      }),
    );
  }

  private _updateMedication(id: string, field: keyof Medication, value: string): void {
    this.medications = this.medications.map((m) => (m.id === id ? { ...m, [field]: value } : m));
  }

  private _handleSubmit(e: Event): void {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    // Validate all fields
    const inputs = form.querySelectorAll('hx-text-input, hx-select');
    let isValid = true;
    inputs.forEach((input: any) => {
      if (!input.checkValidity()) {
        isValid = false;
        input.reportValidity();
      }
    });

    if (isValid) {
      console.log('Medications:', this.medications);
      // Submit to server
    }
  }

  render() {
    return html`
      <form @submit=${this._handleSubmit}>
        <h2>Medication List</h2>

        <div aria-live="polite" aria-atomic="false" class="sr-only">
          ${this.medications.length} medication(s) in list
        </div>

        ${repeat(
          this.medications,
          (med) => med.id,
          (med, index) => html`
            <fieldset class="medication-item">
              <legend>Medication ${index + 1}</legend>

              <hx-text-input
                label="Medication Name"
                name="medications[${index}][name]"
                .value=${med.name}
                @hx-input=${(e: CustomEvent) =>
                  this._updateMedication(med.id, 'name', e.detail.value)}
                required
              ></hx-text-input>

              <hx-text-input
                label="Dose"
                name="medications[${index}][dose]"
                .value=${med.dose}
                @hx-input=${(e: CustomEvent) =>
                  this._updateMedication(med.id, 'dose', e.detail.value)}
                placeholder="e.g., 10mg"
                required
              ></hx-text-input>

              <hx-select
                label="Frequency"
                name="medications[${index}][frequency]"
                .value=${med.frequency}
                @hx-change=${(e: CustomEvent) =>
                  this._updateMedication(med.id, 'frequency', e.detail.value)}
                required
              >
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="twice-daily">Twice Daily</option>
                <option value="three-times-daily">Three Times Daily</option>
                <option value="as-needed">As Needed</option>
              </hx-select>

              ${this.medications.length > 1
                ? html`
                    <hx-button
                      type="button"
                      variant="secondary"
                      @click=${() => this._removeMedication(med.id)}
                    >
                      Remove
                    </hx-button>
                  `
                : ''}
            </fieldset>
          `,
        )}

        <hx-button type="button" @click=${this._addMedication}> Add Medication </hx-button>

        <hx-button type="submit">Save Medication List</hx-button>
      </form>
    `;
  }

  static styles = css`
    .medication-item {
      border: 1px solid var(--hx-color-neutral-300);
      border-radius: var(--hx-border-radius-md);
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'medication-list-form': MedicationListForm;
  }
}
```

**Key Patterns:**

1. **Unique IDs** — Use `crypto.randomUUID()` to key each item for efficient re-rendering
2. **`repeat()` directive** — Lit's `repeat()` optimizes list rendering by item identity
3. **Indexed naming** — Use array notation `medications[0][name]` for structured submission
4. **State immutability** — Always create new arrays/objects to trigger reactive updates
5. **Minimum one item** — Prevent empty arrays by always showing at least one row
6. **Accessibility** — Announce changes with `aria-live` regions

**Collecting Values:**

```typescript
const form = document.querySelector('medication-list-form')!;
const formData = new FormData(form.querySelector('form')!);

// Parse structured data
const medications: Medication[] = [];
let index = 0;
while (formData.has(`medications[${index}][name]`)) {
  medications.push({
    id: crypto.randomUUID(),
    name: formData.get(`medications[${index}][name]`) as string,
    dose: formData.get(`medications[${index}][dose]`) as string,
    frequency: formData.get(`medications[${index}][frequency]`) as string,
  });
  index++;
}
```

### Advanced: Reorderable Lists

For lists where order matters (e.g., priority-ranked care goals), add drag-and-drop or up/down buttons:

```typescript
private _moveUp(id: string): void {
  const index = this.medications.findIndex((m) => m.id === id);
  if (index <= 0) return;

  const newMeds = [...this.medications];
  [newMeds[index - 1], newMeds[index]] = [newMeds[index]!, newMeds[index - 1]!];
  this.medications = newMeds;
}

private _moveDown(id: string): void {
  const index = this.medications.findIndex((m) => m.id === id);
  if (index >= this.medications.length - 1) return;

  const newMeds = [...this.medications];
  [newMeds[index], newMeds[index + 1]] = [newMeds[index + 1]!, newMeds[index]!];
  this.medications = newMeds;
}
```

**Render buttons:**

```html
<hx-button type="button" @click="${()" ="">
  this._moveUp(med.id)} ?disabled=${index === 0} aria-label="Move medication up" > ↑
</hx-button>
<hx-button type="button" @click="${()" ="">
  this._moveDown(med.id)} ?disabled=${index === this.medications.length - 1} aria-label="Move
  medication down" > ↓
</hx-button>
```

---

## Nested Form Structures

Nested forms represent hierarchical data (e.g., patient demographics with nested address, emergency contact with nested phone numbers).

### Nested Object Pattern

```typescript
interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Patient {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: Address;
}

@customElement('patient-demographics-form')
export class PatientDemographicsForm extends LitElement {
  @state() private patient: Patient = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    },
  };

  private _updateField(path: string, value: string): void {
    // Use dot notation to update nested fields
    const keys = path.split('.');
    const updated = { ...this.patient };
    let target: any = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      target[keys[i]!] = { ...target[keys[i]!] };
      target = target[keys[i]!];
    }

    target[keys[keys.length - 1]!] = value;
    this.patient = updated;
  }

  render() {
    return html`
      <form>
        <fieldset>
          <legend>Patient Information</legend>

          <hx-text-input
            label="First Name"
            name="firstName"
            .value=${this.patient.firstName}
            @hx-input=${(e: CustomEvent) => this._updateField('firstName', e.detail.value)}
            required
          ></hx-text-input>

          <hx-text-input
            label="Last Name"
            name="lastName"
            .value=${this.patient.lastName}
            @hx-input=${(e: CustomEvent) => this._updateField('lastName', e.detail.value)}
            required
          ></hx-text-input>

          <hx-text-input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            .value=${this.patient.dateOfBirth}
            @hx-input=${(e: CustomEvent) => this._updateField('dateOfBirth', e.detail.value)}
            required
          ></hx-text-input>
        </fieldset>

        <fieldset>
          <legend>Address</legend>

          <hx-text-input
            label="Street Address"
            name="address.street"
            .value=${this.patient.address.street}
            @hx-input=${(e: CustomEvent) => this._updateField('address.street', e.detail.value)}
            required
          ></hx-text-input>

          <hx-text-input
            label="City"
            name="address.city"
            .value=${this.patient.address.city}
            @hx-input=${(e: CustomEvent) => this._updateField('address.city', e.detail.value)}
            required
          ></hx-text-input>

          <hx-text-input
            label="State"
            name="address.state"
            .value=${this.patient.address.state}
            @hx-input=${(e: CustomEvent) => this._updateField('address.state', e.detail.value)}
            required
          ></hx-text-input>

          <hx-text-input
            label="ZIP Code"
            name="address.zip"
            .value=${this.patient.address.zip}
            @hx-input=${(e: CustomEvent) => this._updateField('address.zip', e.detail.value)}
            required
          ></hx-text-input>
        </fieldset>

        <hx-button type="submit">Save Demographics</hx-button>
      </form>
    `;
  }
}
```

**Naming Convention:**

Use dot notation (`address.street`) or bracket notation (`address[street]`) in `name` attributes. When serializing, parse into nested objects:

```typescript
function parseFormData(formData: FormData): any {
  const result: any = {};

  for (const [key, value] of formData.entries()) {
    const keys = key.split('.');
    let target = result;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]!]) target[keys[i]!] = {};
      target = target[keys[i]!];
    }

    target[keys[keys.length - 1]!] = value;
  }

  return result;
}
```

---

## Dynamic Field Management

Dynamic forms show/hide fields based on user input. Common patterns include conditional sections, dependent dropdowns, and progressive disclosure.

### Conditional Field Visibility

```typescript
@customElement('insurance-form')
export class InsuranceForm extends LitElement {
  @state() private hasInsurance = false;
  @state() private insuranceType = '';

  render() {
    return html`
      <form>
        <wc-radio-group
          label="Do you have health insurance?"
          name="hasInsurance"
          .value=${this.hasInsurance ? 'yes' : 'no'}
          @hx-change=${(e: CustomEvent) => {
            this.hasInsurance = e.detail.value === 'yes';
            if (!this.hasInsurance) this.insuranceType = '';
          }}
          required
        >
          <wc-radio value="yes" label="Yes"></wc-radio>
          <wc-radio value="no" label="No"></wc-radio>
        </wc-radio-group>

        ${this.hasInsurance
          ? html`
              <div aria-live="polite" aria-atomic="true" class="sr-only">
                Insurance details section now visible
              </div>

              <hx-select
                label="Insurance Type"
                name="insuranceType"
                .value=${this.insuranceType}
                @hx-change=${(e: CustomEvent) => (this.insuranceType = e.detail.value)}
                required
              >
                <option value="">Select type</option>
                <option value="private">Private Insurance</option>
                <option value="medicare">Medicare</option>
                <option value="medicaid">Medicaid</option>
                <option value="other">Other</option>
              </hx-select>

              ${this.insuranceType === 'private'
                ? html`
                    <hx-text-input
                      label="Insurance Provider"
                      name="insuranceProvider"
                      required
                    ></hx-text-input>

                    <hx-text-input
                      label="Policy Number"
                      name="policyNumber"
                      required
                    ></hx-text-input>
                  `
                : ''}
              ${this.insuranceType === 'medicare' || this.insuranceType === 'medicaid'
                ? html` <hx-text-input label="Member ID" name="memberId" required></hx-text-input> `
                : ''}
            `
          : ''}

        <hx-button type="submit">Continue</hx-button>
      </form>
    `;
  }
}
```

**Key Practices:**

1. **Clear state on hide** — Reset values when fields are hidden to prevent stale data
2. **Announce changes** — Use `aria-live` regions to announce field additions
3. **Preserve validation** — Hidden fields shouldn't block submission
4. **Maintain focus** — Don't lose focus when fields appear/disappear

### Dependent Dropdowns (Cascading Selects)

```typescript
@customElement('location-selector')
export class LocationSelector extends LitElement {
  @state() private selectedState = '';
  @state() private selectedCity = '';

  private readonly stateCities: Record<string, string[]> = {
    CA: ['Los Angeles', 'San Francisco', 'San Diego'],
    NY: ['New York City', 'Buffalo', 'Rochester'],
    TX: ['Houston', 'Austin', 'Dallas'],
  };

  render() {
    const cities = this.selectedState ? this.stateCities[this.selectedState] : [];

    return html`
      <hx-select
        label="State"
        name="state"
        .value=${this.selectedState}
        @hx-change=${(e: CustomEvent) => {
          this.selectedState = e.detail.value;
          this.selectedCity = ''; // Reset dependent field
        }}
        required
      >
        <option value="">Select state</option>
        <option value="CA">California</option>
        <option value="NY">New York</option>
        <option value="TX">Texas</option>
      </hx-select>

      ${this.selectedState
        ? html`
            <hx-select
              label="City"
              name="city"
              .value=${this.selectedCity}
              @hx-change=${(e: CustomEvent) => (this.selectedCity = e.detail.value)}
              required
            >
              <option value="">Select city</option>
              ${cities!.map((city) => html` <option value=${city}>${city}</option> `)}
            </hx-select>
          `
        : ''}
    `;
  }
}
```

---

## Complex Validation Strategies

Complex forms require validation beyond simple `required` attributes. You need cross-field validation, async validation, conditional rules, and custom error messages.

### Cross-Field Validation

Validate relationships between fields (e.g., "end date must be after start date"):

```typescript
@customElement('date-range-form')
export class DateRangeForm extends LitElement {
  @state() private startDate = '';
  @state() private endDate = '';
  @state() private dateError = '';

  private _validateDateRange(): void {
    if (!this.startDate || !this.endDate) {
      this.dateError = '';
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (end <= start) {
      this.dateError = 'End date must be after start date';
    } else {
      this.dateError = '';
    }
  }

  render() {
    return html`
      <form>
        <hx-text-input
          label="Start Date"
          name="startDate"
          type="date"
          .value=${this.startDate}
          @hx-change=${(e: CustomEvent) => {
            this.startDate = e.detail.value;
            this._validateDateRange();
          }}
          required
        ></hx-text-input>

        <hx-text-input
          label="End Date"
          name="endDate"
          type="date"
          .value=${this.endDate}
          .error=${this.dateError}
          @hx-change=${(e: CustomEvent) => {
            this.endDate = e.detail.value;
            this._validateDateRange();
          }}
          required
        ></hx-text-input>

        <hx-button type="submit">Submit</hx-button>
      </form>
    `;
  }
}
```

### Async Validation

Validate against server data (e.g., check if username is available, verify insurance eligibility):

```typescript
@customElement('username-form')
export class UsernameForm extends LitElement {
  @state() private username = '';
  @state() private usernameError = '';
  @state() private isChecking = false;

  private _checkUsernameDebounced = this._debounce(this._checkUsername.bind(this), 500);

  private _debounce(fn: Function, delay: number) {
    let timeoutId: number;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fn(...args), delay);
    };
  }

  private async _checkUsername(): Promise<void> {
    if (!this.username || this.username.length < 3) {
      this.usernameError = '';
      return;
    }

    this.isChecking = true;

    try {
      const response = await fetch(`/api/check-username?username=${this.username}`);
      const data = await response.json();

      if (!data.available) {
        this.usernameError = 'Username is already taken';
      } else {
        this.usernameError = '';
      }
    } catch (err) {
      this.usernameError = 'Unable to verify username';
    } finally {
      this.isChecking = false;
    }
  }

  render() {
    return html`
      <hx-text-input
        label="Username"
        name="username"
        .value=${this.username}
        .error=${this.usernameError}
        @hx-input=${(e: CustomEvent) => {
          this.username = e.detail.value;
          this._checkUsernameDebounced();
        }}
        required
      >
        ${this.isChecking ? html` <span slot="suffix">Checking...</span> ` : ''}
      </hx-text-input>
    `;
  }
}
```

**Best Practices:**

- **Debounce** — Don't validate on every keystroke; wait 300-500ms after typing stops
- **Loading states** — Show visual feedback during async validation
- **Graceful degradation** — Don't block submission if validation request fails
- **Cache results** — Avoid redundant API calls for the same value

---

## State Management Approaches

Complex forms need robust state management. Choose an approach based on form complexity and team preferences.

### 1. Local Component State (Recommended for Simple Forms)

Use Lit's `@state()` decorator for component-local state:

```typescript
@state() private formData = { name: '', email: '' };
```

**Pros:** Simple, no dependencies, collocated with component
**Cons:** Hard to share state across components, no time-travel debugging

### 2. Context API (Recommended for Multi-Step Forms)

Use Lit's Context API to share state across form steps:

```typescript
import { createContext, provide, consume } from '@lit/context';

interface FormContextType {
  patient: Patient;
  updatePatient: (updates: Partial<Patient>) => void;
}

export const formContext = createContext<FormContextType>('form-context');

@customElement('patient-form-wizard')
export class PatientFormWizard extends LitElement {
  @provide({ context: formContext })
  private _formData: FormContextType = {
    patient: {
      /* ... */
    },
    updatePatient: (updates) => {
      this.patient = { ...this.patient, ...updates };
    },
  };
}

@customElement('step-one')
export class StepOne extends LitElement {
  @consume({ context: formContext })
  private _formContext!: FormContextType;

  // Use this._formContext.patient and this._formContext.updatePatient()
}
```

### 3. External State Library (For Large, Multi-Page Forms)

For enterprise-scale forms, consider Redux, MobX, or Zustand:

```typescript
// store.ts
import { createStore } from 'zustand/vanilla';

interface FormState {
  patient: Patient;
  medications: Medication[];
  updatePatient: (updates: Partial<Patient>) => void;
  addMedication: (med: Medication) => void;
}

export const formStore = createStore<FormState>((set) => ({
  patient: {
    /* ... */
  },
  medications: [],
  updatePatient: (updates) =>
    set((state) => ({
      patient: { ...state.patient, ...updates },
    })),
  addMedication: (med) =>
    set((state) => ({
      medications: [...state.medications, med],
    })),
}));
```

---

## Performance Optimization

Large, dynamic forms can suffer from performance issues. Optimize rendering and validation.

### Debounce Validation

```typescript
private _validateDebounced = this._debounce(this._validate.bind(this), 300);

private _debounce(fn: Function, delay: number) {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}
```

### Virtual Scrolling for Large Lists

For 100+ repeating fields, use virtual scrolling to render only visible items:

```typescript
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '@lit-labs/virtualizer';

@customElement('large-medication-list')
export class LargeMedicationList extends LitElement {
  @state() private medications: Medication[] = /* 500 items */ [];

  render() {
    return html`
      <lit-virtualizer
        .items=${this.medications}
        .renderItem=${(med: Medication) => html`
          <medication-row .medication=${med}></medication-row>
        `}
      ></lit-virtualizer>
    `;
  }
}
```

### Memoization

Avoid recalculating expensive derived values:

```typescript
import { memoize } from 'lodash-es';

private _getFilteredMedications = memoize(
  (medications: Medication[], filter: string) => {
    return medications.filter((m) => m.name.includes(filter));
  }
);
```

---

## Accessibility Considerations

Complex forms must remain accessible as they grow in complexity.

### Announce Dynamic Changes

Use `aria-live` regions to announce field additions/removals:

```html
<div aria-live="polite" aria-atomic="false" class="sr-only">
  ${this.justAdded ? 'Medication added' : ''} ${this.justRemoved ? 'Medication removed' : ''}
</div>
```

### Focus Management

When adding fields, move focus to the new field:

```typescript
private async _addMedication(): Promise<void> {
  this.medications = [
    ...this.medications,
    { id: crypto.randomUUID() /* ... */ },
  ];
  await this.updateComplete;

  // Focus first input in new row
  const newRow = this.shadowRoot?.querySelector(
    `.medication-item:last-child hx-text-input`
  );
  (newRow as HTMLElement)?.focus();
}
```

### Error Summaries

For multi-section forms, provide an error summary at the top:

```html
${this.errors.length > 0 ? html`
<div role="alert" class="error-summary">
  <h2>Please fix the following errors:</h2>
  <ul>
    ${this.errors.map( (err) => html`
    <li><a href="#${err.fieldId}">${err.message}</a></li>
    ` )}
  </ul>
</div>
` : ''}
```

---

## Real-World Examples

### Example 1: Patient Intake Form

Multi-step wizard with demographics, insurance, medical history, and medications.

```typescript
@customElement('patient-intake-wizard')
export class PatientIntakeWizard extends LitElement {
  @state() private step = 1;
  @state() private patient: Patient = {
    /* ... */
  };

  render() {
    return html`
      <div class="wizard">
        <div class="wizard__steps">
          <button ?disabled=${this.step === 1}>Demographics</button>
          <button ?disabled=${this.step === 2}>Insurance</button>
          <button ?disabled=${this.step === 3}>Medical History</button>
          <button ?disabled=${this.step === 4}>Medications</button>
        </div>

        <div class="wizard__content">
          ${this.step === 1 ? html`<demographics-step></demographics-step>` : ''}
          ${this.step === 2 ? html`<insurance-step></insurance-step>` : ''}
          ${this.step === 3 ? html`<medical-history-step></medical-history-step>` : ''}
          ${this.step === 4 ? html`<medications-step></medications-step>` : ''}
        </div>

        <div class="wizard__actions">
          ${this.step > 1 ? html` <hx-button @click=${() => this.step--}>Back</hx-button> ` : ''}
          ${this.step < 4
            ? html` <hx-button @click=${() => this.step++}>Next</hx-button> `
            : html` <hx-button type="submit">Submit</hx-button> `}
        </div>
      </div>
    `;
  }
}
```

### Example 2: Lab Results Entry

Bulk data entry with repeating rows for test name, result, unit, reference range.

```typescript
@customElement('lab-results-form')
export class LabResultsForm extends LitElement {
  @state() private results: LabResult[] = [
    {
      id: crypto.randomUUID(),
      test: '',
      result: '',
      unit: '',
      refRange: '',
    },
  ];

  render() {
    return html`
      <form>
        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Result</th>
              <th>Unit</th>
              <th>Reference Range</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.results.map(
              (result, index) => html`
                <tr>
                  <td>
                    <hx-select name="results[${index}][test]" required>
                      <option value="">Select test</option>
                      <option value="glucose">Glucose</option>
                      <option value="hemoglobin">Hemoglobin</option>
                      <option value="wbc">WBC Count</option>
                    </hx-select>
                  </td>
                  <td>
                    <hx-text-input name="results[${index}][result]" required></hx-text-input>
                  </td>
                  <td>
                    <hx-text-input name="results[${index}][unit]" required></hx-text-input>
                  </td>
                  <td>
                    <hx-text-input name="results[${index}][refRange]"></hx-text-input>
                  </td>
                  <td>
                    <hx-button @click=${() => this._removeResult(result.id)}>Remove</hx-button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>

        <hx-button @click=${this._addResult}>Add Row</hx-button>
        <hx-button type="submit">Save Results</hx-button>
      </form>
    `;
  }
}
```

---

## Best Practices Summary

1. **Start with primitives** — Build complex forms from simple, tested wc-2026 components
2. **Use unique IDs** — Key repeating items with `crypto.randomUUID()` for stable rendering
3. **Immutable state updates** — Always create new arrays/objects to trigger reactivity
4. **Validate incrementally** — Real-time validation for individual fields, cross-field validation on blur/submit
5. **Debounce expensive operations** — Async validation, complex calculations
6. **Announce changes** — Use `aria-live` regions for dynamic field additions/removals
7. **Preserve user input** — Never lose data on validation failure or navigation
8. **Optimize for performance** — Virtual scrolling for large lists, memoization for derived state
9. **Test thoroughly** — Unit tests for validation logic, integration tests for workflows
10. **Document patterns** — Complex forms are maintainable when patterns are documented

---

## Related Documentation

- [Form Participation Fundamentals](/components/forms/fundamentals) — ElementInternals API, form association
- [Form Validation Patterns](/components/forms/validation) — Constraint validation, custom validators
- [Accessibility Fundamentals](/components/forms/accessibility) — ARIA patterns, keyboard navigation

---

## References

- [MDN: ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [MDN: Constraint Validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation)
- [MDN: Input Date](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [MDN: Input File](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
- [MDN: FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList)
- [MDN: DataTransfer](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)
- [Lit: Reactive properties](https://lit.dev/docs/components/properties/)
- [Lit: repeat() directive](https://lit.dev/docs/templates/directives/#repeat)
- [Lit: Context API](https://lit.dev/docs/data/context/)
- [WCAG 2.1: Forms](https://www.w3.org/WAI/WCAG21/Understanding/input-purposes.html)
- [Quill Rich Text Editor](https://quilljs.com/)
- [TinyMCE Rich Text Editor](https://www.tiny.cloud/)

---

**Document Status**: Active
**Last Updated**: 2026-02-16
**Word Count**: ~4,200 words
