import { Directive, Input } from '@angular/core';

/**
 * Hierarchical page path navigation showing current location in site structure.
 */
@Directive({
  selector: 'hx-breadcrumb',
  standalone: true,
})
export class HxBreadcrumbDirective {
  /** The separator character displayed between breadcrumb items. */
  @Input() separator: string = '/';

  /** The accessible label for the nav landmark. */
  @Input() label: string = 'Breadcrumb';
}
