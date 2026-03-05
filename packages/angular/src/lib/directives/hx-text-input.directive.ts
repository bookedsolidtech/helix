import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-input` event from `hx-text-input`. */
export type HxTextInputHxInputEventDetail = { value: string };

/** Detail shape for the `hx-change` event from `hx-text-input`. */
export type HxTextInputHxChangeEventDetail = { value: string };

/**
 * A text input component with label, validation, and form association.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixTextInputValueAccessor`.
 */
@Directive({
  selector: 'hx-text-input',
  standalone: true,
})
export class HxTextInputDirective {
  /** The visible label text for the input. */
  @Input() label: string = '';

  /** Placeholder text shown when the input is empty. */
  @Input() placeholder: string = '';

  /** The current value of the input. */
  @Input() value: string = '';

  /** The type of the native input element. */
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' =
    'text';

  /** Whether the input is required for form submission. */
  @Input() required: boolean = false;

  /** Whether the input is disabled. */
  @Input() disabled: boolean = false;

  /** Error message to display. When set, the input enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the input for guidance. */
  @Input('help-text') helpText: string = '';

  /** The name of the input, used for form submission. */
  @Input() name: string = '';

  /** Accessible name for screen readers, if different from the visible label. */
  @Input('aria-label') ariaLabel: string | null = null;

  /** Whether the input is read-only. */
  @Input() readonly: boolean = false;

  /** Minimum number of characters allowed. */
  @Input() minlength: number | undefined = undefined;

  /** Maximum number of characters allowed. */
  @Input() maxlength: number | undefined = undefined;

  /** A regular expression pattern the value must match for form validation. */
  @Input() pattern: string = '';

  /** Hint for the browser's autocomplete feature. Accepts standard HTML autocomplete values. */
  @Input() autocomplete: string = '';

  /** Visual size of the input field. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Dispatched on every keystroke as the user types. */
  @Output('hx-input') hxInput = new EventEmitter<CustomEvent<HxTextInputHxInputEventDetail>>();

  /** Dispatched when the input loses focus after its value changed. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxTextInputHxChangeEventDetail>>();
}
