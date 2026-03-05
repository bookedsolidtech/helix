import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-change` event from `hx-switch`. */
export type HxSwitchHxChangeEventDetail = { checked: boolean };

/**
 * A toggle switch component for on/off states.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixSwitchValueAccessor`.
 */
@Directive({
  selector: 'hx-switch',
  standalone: true,
})
export class HxSwitchDirective {
  /** Whether the switch is toggled on. */
  @Input() checked: boolean = false;

  /** Whether the switch is disabled. */
  @Input() disabled: boolean = false;

  /** Whether the switch is required for form submission. */
  @Input() required: boolean = false;

  /** The name of the switch, used for form submission. */
  @Input() name: string = '';

  /** The value submitted when the switch is checked. */
  @Input() value: string = 'on';

  /** The visible label text for the switch. */
  @Input() label: string = '';

  /** Size variant of the switch. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Error message to display. When set, the switch enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the switch for guidance. */
  @Input('help-text') helpText: string = '';

  /** Dispatched when the switch is toggled. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxSwitchHxChangeEventDetail>>();
}
