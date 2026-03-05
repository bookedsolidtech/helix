import { Directive, Input } from '@angular/core';

/**
 * An individual radio button, designed to be used inside a `<hx-radio-group>`.
 */
@Directive({
  selector: 'hx-radio',
  standalone: true,
})
export class HxRadioDirective {
  /** The value this radio represents. */
  @Input() value: string = '';

  /** Visible label text for the radio. */
  @Input() label: string = '';

  /** Whether this radio is disabled. */
  @Input() disabled: boolean = false;

  /** Whether this radio is checked. Managed by the parent group. */
  @Input() checked: boolean = false;
}
