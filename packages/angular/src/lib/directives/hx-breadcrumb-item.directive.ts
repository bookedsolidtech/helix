import { Directive, Input } from '@angular/core';

/**
 * A single breadcrumb navigation item.
 */
@Directive({
  selector: 'hx-breadcrumb-item',
  standalone: true,
})
export class HxBreadcrumbItemDirective {
  /** The URL for this breadcrumb link. Omit for the current page (last item). */
  @Input() href: string | undefined = undefined;
}
