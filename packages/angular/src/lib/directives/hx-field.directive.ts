import { Directive, Input } from '@angular/core';

/**
 * Layout wrapper providing consistent label + input + help text + validation
 */
@Directive({
  selector: 'hx-field',
  standalone: true,
})
export class HxFieldDirective {
  /** The visible label text for the field. */
  @Input() label: string = '';

  /** Whether the field is required. Shows a required indicator on the label. */
  @Input() required: boolean = false;

  /** Error message to display. When set, the field enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the control for guidance. */
  @Input('help-text') helpText: string = '';

  /** Visual disabled state applied via opacity. Does not affect slotted control */
  @Input() disabled: boolean = false;

  /** Size variant controlling label and help text font sizes. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';
}
