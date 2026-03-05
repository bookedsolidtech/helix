import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-input` event from `hx-slider`. */
export type HxSliderHxInputEventDetail = { value: number };

/** Detail shape for the `hx-change` event from `hx-slider`. */
export type HxSliderHxChangeEventDetail = { value: number };

/**
 * A range slider component for selecting a numeric value within a min/max boundary.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixSliderValueAccessor`.
 */
@Directive({
  selector: 'hx-slider',
  standalone: true,
})
export class HxSliderDirective {
  /** The name submitted with the form. */
  @Input() name: string = '';

  /** The current numeric value of the slider. */
  @Input() value: number = 0;

  /** The minimum allowed value. */
  @Input() min: number = 0;

  /** The maximum allowed value. */
  @Input() max: number = 100;

  /** The stepping interval between values. */
  @Input() step: number = 1;

  /** Whether the slider is disabled. */
  @Input() disabled: boolean = false;

  /** The visible label text for the slider. */
  @Input() label: string = '';

  /** Help text displayed below the slider for guidance. */
  @Input('help-text') helpText: string = '';

  /** When true, the current value is shown next to the label. */
  @Input('show-value') showValue: boolean = false;

  /** When true, tick marks are rendered at each step interval. */
  @Input('show-ticks') showTicks: boolean = false;

  /** The size variant of the slider. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Dispatched continuously while the user drags. */
  @Output('hx-input') hxInput = new EventEmitter<CustomEvent<HxSliderHxInputEventDetail>>();

  /** Dispatched when the user releases the thumb. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxSliderHxChangeEventDetail>>();
}
