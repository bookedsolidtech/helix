import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-change` event from `hx-checkbox`. */
export type HxCheckboxHxChangeEventDetail = { checked: boolean; value: string };

/**
 * A checkbox component with label, validation, and form association.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixCheckboxValueAccessor`.
 */
@Directive({
  selector: 'hx-checkbox',
  standalone: true,
})
export class HxCheckboxDirective {
  /** Whether the checkbox is checked. */
  @Input() checked: boolean = false;

  /** Whether the checkbox is in an indeterminate state (e.g., for "select all" patterns). */
  @Input() indeterminate: boolean = false;

  /** Whether the checkbox is disabled. */
  @Input() disabled: boolean = false;

  /** Whether the checkbox is required for form submission. */
  @Input() required: boolean = false;

  /** The name of the checkbox, used for form submission. */
  @Input() name: string = '';

  /** The value submitted when the checkbox is checked. */
  @Input() value: string = 'on';

  /** The visible label text for the checkbox. */
  @Input() label: string = '';

  /** Error message to display. When set, the checkbox enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the checkbox for guidance. */
  @Input('help-text') helpText: string = '';

  /** The size of the checkbox. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Dispatched when the checkbox is toggled. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxCheckboxHxChangeEventDetail>>();
}
