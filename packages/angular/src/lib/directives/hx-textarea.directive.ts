import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-input` event from `hx-textarea`. */
export type HxTextareaHxInputEventDetail = { value: string };

/** Detail shape for the `hx-change` event from `hx-textarea`. */
export type HxTextareaHxChangeEventDetail = { value: string };

/**
 * A multi-line text area component with label, validation, and form association.
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixTextareaValueAccessor`.
 */
@Directive({
  selector: 'hx-textarea',
  standalone: true,
})
export class HxTextareaDirective {
  /** The visible label text for the textarea. */
  @Input() label: string = '';

  /** Placeholder text shown when the textarea is empty. */
  @Input() placeholder: string = '';

  /** The current value of the textarea. */
  @Input() value: string = '';

  /** Whether the textarea is required for form submission. */
  @Input() required: boolean = false;

  /** Whether the textarea is disabled. */
  @Input() disabled: boolean = false;

  /** Error message to display. When set, the textarea enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the textarea for guidance. */
  @Input('help-text') helpText: string = '';

  /** The name of the textarea, used for form submission. */
  @Input() name: string = '';

  /** The number of visible text rows. */
  @Input() rows: number = 4;

  /** Maximum number of characters allowed. */
  @Input() maxlength: number | undefined = undefined;

  /** Controls how the textarea can be resized. Use 'auto' for auto-grow behavior. */
  @Input() resize: 'none' | 'vertical' | 'both' | 'auto' = 'vertical';

  /** Whether to show a character count below the textarea. */
  @Input('show-count') showCount: boolean = false;

  /** Accessible name for screen readers, if different from the visible label. */
  @Input('aria-label') ariaLabel: string | null = null;

  /** Dispatched on every keystroke as the user types. */
  @Output('hx-input') hxInput = new EventEmitter<CustomEvent<HxTextareaHxInputEventDetail>>();

  /** Dispatched when the textarea loses focus after its value changed. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxTextareaHxChangeEventDetail>>();
}
