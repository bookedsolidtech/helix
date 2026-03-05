import { Directive, Input } from '@angular/core';

/**
 * A layout container that constrains content width and provides
 */
@Directive({
  selector: 'hx-container',
  standalone: true,
})
export class HxContainerDirective {
  /** Controls the max-width of the inner content wrapper. */
  @Input() width: 'full' | 'content' | 'narrow' | 'sm' | 'md' | 'lg' | 'xl' = 'content';

  /** Vertical padding applied to the outer wrapper. */
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'none';
}
