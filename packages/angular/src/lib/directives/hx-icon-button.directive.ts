import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-click` event from `hx-icon-button`. */
export type HxIconButtonHxClickEventDetail = { originalEvent: MouseEvent };

/**
 * An icon-only button component for compact, accessible actions.
 */
@Directive({
  selector: 'hx-icon-button',
  standalone: true,
})
export class HxIconButtonDirective {
  /** Accessible name for the button. Required. Rendered as `aria-label` and */
  @Input() label: string = '';

  /** Visual style variant of the button. */
  @Input() variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' = 'ghost';

  /** Size of the button. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** The type attribute for the underlying button element. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Whether the button is disabled. */
  @Input() disabled: boolean = false;

  /** When set, renders an `<a>` element instead of a `<button>`. */
  @Input() href: string | undefined = undefined;

  /** Name submitted with form data. Only applicable when rendering as a button. */
  @Input() name: string | undefined = undefined;

  /** Value submitted with form data. Only applicable when rendering as a button. */
  @Input() value: string | undefined = undefined;

  /** Dispatched when the button is clicked (not disabled). */
  @Output('hx-click') hxClick = new EventEmitter<CustomEvent<HxIconButtonHxClickEventDetail>>();
}
