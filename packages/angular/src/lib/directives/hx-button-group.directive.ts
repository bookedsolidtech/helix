import { Directive, Input } from '@angular/core';

/**
 * A container component that groups related hx-button elements into a cohesive
 */
@Directive({
  selector: 'hx-button-group',
  standalone: true,
})
export class HxButtonGroupDirective {
  /** Layout orientation of the button group. */
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Size applied to the button group and cascaded to child buttons via */
  @Input('hx-size') hxSize: 'sm' | 'md' | 'lg' = 'md';
}
