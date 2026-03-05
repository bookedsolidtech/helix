import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-change` event from `hx-radio-group`. */
export type HxRadioGroupHxChangeEventDetail = { value: string };

/**
 * A form-associated radio group that manages a set of `<hx-radio>` children.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixRadioGroupValueAccessor`.
 */
@Directive({
  selector: 'hx-radio-group',
  standalone: true,
})
export class HxRadioGroupDirective {
  /** The selected radio's value. */
  @Input() value: string = '';

  /** The name used for form submission. */
  @Input() name: string = '';

  /** The fieldset legend/label text. */
  @Input() label: string = '';

  /** Whether a selection is required for form submission. */
  @Input() required: boolean = false;

  /** Whether the entire group is disabled. */
  @Input() disabled: boolean = false;

  /** Error message to display. When set, the group enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the group for guidance. */
  @Input('help-text') helpText: string = '';

  /** Layout orientation of the radio items. */
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';

  /** Dispatched when the selected radio changes. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxRadioGroupHxChangeEventDetail>>();
}
