import { Directive, Input } from '@angular/core';

/**
 * A Light DOM prose container that applies typographic styles to rich text
 */
@Directive({
  selector: 'hx-prose',
  standalone: true,
})
export class HxProseDirective {
  /** Typography scale for the prose content. */
  @Input() size: 'sm' | 'base' | 'lg' = 'base';

  /** Maximum content width. When set, overrides the --hx-prose-max-width token. */
  @Input('max-width') maxWidth: string = '';
}
