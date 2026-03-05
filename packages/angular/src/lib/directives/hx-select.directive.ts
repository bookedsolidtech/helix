import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-change` event from `hx-select`. */
export type HxSelectHxChangeEventDetail = { value: string };

/** Detail shape for the `hx-input` event from `hx-select`. */
export type HxSelectHxInputEventDetail = { value: string };

/**
 * A select component with a fully custom dropdown UI, providing combobox
 *
 * For two-way binding with Angular forms, pair this directive with
 * `HelixSelectValueAccessor`.
 */
@Directive({
  selector: 'hx-select',
  standalone: true,
})
export class HxSelectDirective {
  /** The visible label text for the select. */
  @Input() label: string = '';

  /** Placeholder text shown in the trigger when no option is selected. */
  @Input() placeholder: string = '';

  /** The current value of the select (single mode). */
  @Input() value: string = '';

  /** Whether the select is required for form submission. */
  @Input() required: boolean = false;

  /** Whether the select is disabled. */
  @Input() disabled: boolean = false;

  /** The name used for form submission. */
  @Input() name: string = '';

  /** Error message to display. When set, the field enters an error state. */
  @Input() error: string = '';

  /** Help text displayed below the select for guidance. */
  @Input('help-text') helpText: string = '';

  /** Size variant of the select trigger. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Accessible name for screen readers, if different from the visible label. */
  @Input('aria-label') ariaLabel: string | null = null;

  /** Enables multi-select mode. Selected values are stored internally as a Set */
  @Input() multiple: boolean = false;

  /** Enables a search/filter input inside the listbox. */
  @Input() searchable: boolean = false;

  /** Controls whether the dropdown listbox is open. */
  @Input() open: boolean = false;

  /** Dispatched when the selected option changes. */
  @Output('hx-change') hxChange = new EventEmitter<CustomEvent<HxSelectHxChangeEventDetail>>();

  /** Dispatched when the search input value changes (searchable mode only). */
  @Output('hx-input') hxInput = new EventEmitter<CustomEvent<HxSelectHxInputEventDetail>>();
}
