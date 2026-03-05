import { Directive, Input } from '@angular/core';

/**
 * A user avatar component that displays an image, initials, or a fallback icon.
 */
@Directive({
  selector: 'hx-avatar',
  standalone: true,
})
export class HxAvatarDirective {
  /** Image URL. When provided and successfully loaded, displays the image. */
  @Input() src: string | undefined = undefined;

  /** Accessible label for the image or avatar. */
  @Input() alt: string = '';

  /** Fallback initials text displayed when no image is available. */
  @Input() initials: string = '';

  /** Size variant of the avatar. */
  @Input('hx-size') hxSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /** Shape variant of the avatar. */
  @Input() shape: 'circle' | 'square' = 'circle';
}
