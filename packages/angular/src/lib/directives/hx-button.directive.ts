import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-click` event from `hx-button`. */
export type HxButtonHxClickEventDetail = { originalEvent: MouseEvent };

/**
 * A production-grade button component for user interaction. Supports multiple
 */
@Directive({
  selector: 'hx-button',
  standalone: true,
})
export class HxButtonDirective {
  /** Visual style variant of the button. */
  @Input() variant: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline' =
    'primary';

  /** Size of the button. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Whether the button is disabled. Prevents all interaction and form actions. */
  @Input() disabled: boolean = false;

  /** Whether the button is in a loading state. Shows spinner, prevents interaction, */
  @Input() loading: boolean = false;

  /** The type attribute for the underlying button element. Ignored when href is set. */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** When set, renders an anchor element instead of a button. */
  @Input() href: string | undefined = undefined;

  /** Anchor target attribute. Only used when href is set. */
  @Input() target: string | undefined = undefined;

  /** Form field name submitted via ElementInternals.setFormValue on submit. */
  @Input() name: string | undefined = undefined;

  /** Form field value submitted via ElementInternals.setFormValue on submit. */
  @Input() value: string | undefined = undefined;

  /** Dispatched when the button is clicked and is neither disabled nor loading. */
  @Output('hx-click') hxClick = new EventEmitter<CustomEvent<HxButtonHxClickEventDetail>>();
}
