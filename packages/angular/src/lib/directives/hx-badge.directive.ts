import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-remove` event from `hx-badge`. */
export type HxBadgeHxRemoveEventDetail = Record<string, unknown>;

/**
 * A small status indicator for notifications, counts, and labels.
 */
@Directive({
  selector: 'hx-badge',
  standalone: true,
})
export class HxBadgeDirective {
  /** Visual style variant of the badge. */
  @Input() variant:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'neutral'
    | 'info' = 'primary';

  /** Size of the badge. */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';

  /** Whether the badge uses fully rounded (pill) styling. */
  @Input() pill: boolean = false;

  /** Whether the badge displays an animated pulse for attention. */
  @Input() pulse: boolean = false;

  /** Whether the badge renders a dismiss button. */
  @Input() removable: boolean = false;

  /** Dispatched when the user clicks the remove button. */
  @Output('hx-remove') hxRemove = new EventEmitter<CustomEvent<HxBadgeHxRemoveEventDetail>>();
}
