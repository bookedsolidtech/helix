import { Directive, Input, Output, EventEmitter } from '@angular/core';

/** Detail shape for the `hx-card-click` event from `hx-card`. */
export type HxCardHxCardClickEventDetail = Record<string, unknown>;

/** Detail shape for the `wc-card-click` event from `hx-card`. */
export type HxCardWcCardClickEventDetail = { url: string; originalEvent: MouseEvent };

/**
 * A flexible card component for displaying grouped content.
 */
@Directive({
  selector: 'hx-card',
  standalone: true,
})
export class HxCardDirective {
  /** Visual style variant of the card. */
  @Input() variant: 'default' | 'featured' | 'compact' = 'default';

  /** Elevation (shadow depth) of the card. */
  @Input() elevation: 'flat' | 'raised' | 'floating' = 'flat';

  /** Optional URL. When set, the card becomes interactive (clickable) */
  @Input('hx-href') hxHref: string = '';

  /** Dispatched when an interactive card is clicked. */
  @Output('hx-card-click') hxCardClick = new EventEmitter<
    CustomEvent<HxCardHxCardClickEventDetail>
  >();

  /** Dispatched when an interactive card (with wc-href) is clicked. */
  @Output('wc-card-click') wcCardClick = new EventEmitter<
    CustomEvent<HxCardWcCardClickEventDetail>
  >();
}
