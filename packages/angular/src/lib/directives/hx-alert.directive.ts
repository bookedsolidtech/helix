import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-dismiss` event from `hx-alert`. */
export type HxAlertHxDismissEventDetail = { reason: string };

/** Detail shape for the `hx-after-dismiss` event from `hx-alert`. */
export type HxAlertHxAfterDismissEventDetail = Record<string, unknown>;

/**
 * A feedback component for communicating status messages, warnings, and errors.
 */
@Directive({
  selector: 'hx-alert',
  standalone: true,
})
export class HxAlertDirective {
  /** Visual variant of the alert that determines colors and ARIA semantics. */
  @Input() variant: string = 'info';

  /** Whether the alert can be dismissed by the user. */
  @Input() dismissible: boolean = false;

  /** Whether the alert is visible. Set to false to hide the alert. */
  @Input() open: boolean = true;

  /** Whether to show the default variant icon. Set to false to hide the icon container entirely. */
  @Input() icon: boolean = true;

  /** Dispatched when the user dismisses the alert. */
  @Output('hx-dismiss') hxDismiss = new EventEmitter<CustomEvent<HxAlertHxDismissEventDetail>>();

  /** Dispatched after the alert is dismissed. */
  @Output('hx-after-dismiss') hxAfterDismiss = new EventEmitter<
    CustomEvent<HxAlertHxAfterDismissEventDetail>
  >();
}
