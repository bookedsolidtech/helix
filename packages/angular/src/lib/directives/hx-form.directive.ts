import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `wc-submit` event from `hx-form`. */
export type HxFormWcSubmitEventDetail = {
  valid: boolean;
  values: Record<string, FormDataEntryValue>;
};

/** Detail shape for the `wc-invalid` event from `hx-form`. */
export type HxFormWcInvalidEventDetail = { errors: Array<{ name: string; message: string }> };

/** Detail shape for the `wc-reset` event from `hx-form`. */
export type HxFormWcResetEventDetail = Record<string, unknown>;

/**
 * A Light DOM form wrapper that styles native HTML form elements and
 */
@Directive({
  selector: 'hx-form',
  standalone: true,
})
export class HxFormDirective {
  /** The URL to submit the form to. When empty, the form handles */
  @Input() action: string = '';

  /** The HTTP method used when submitting the form. */
  @Input() method: 'get' | 'post' = 'post';

  /** When true, disables the browser's built-in constraint validation */
  @Input() novalidate: boolean = false;

  /** Identifies the form for scripting and form discovery. */
  @Input() name: string = '';

  /** Dispatched on valid client-side submit when no action is set. */
  @Output('wc-submit') wcSubmit = new EventEmitter<CustomEvent<HxFormWcSubmitEventDetail>>();

  /** Dispatched when validation fails on submit. */
  @Output('wc-invalid') wcInvalid = new EventEmitter<CustomEvent<HxFormWcInvalidEventDetail>>();

  /** Dispatched when the form is reset. */
  @Output('wc-reset') wcReset = new EventEmitter<CustomEvent<HxFormWcResetEventDetail>>();
}
