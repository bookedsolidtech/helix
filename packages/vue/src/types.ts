/**
 * Shared TypeScript interfaces and types for the @helixds/vue package.
 * These mirror the design token constraint values used across Helix components.
 */

/** Size variants shared across multiple components */
export type HxSize = 'sm' | 'md' | 'lg'

/** Extended size variants that include xl */
export type HxSizeXl = 'sm' | 'md' | 'lg' | 'xl'

/** Button variant options */
export type HxButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'danger'
  | 'ghost'
  | 'outline'

/** Button type attribute values */
export type HxButtonType = 'button' | 'submit' | 'reset'

/** Alert severity variants */
export type HxAlertVariant = 'info' | 'success' | 'warning' | 'error'

/** Badge display variants */
export type HxBadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error'

/** Avatar shape options */
export type HxAvatarShape = 'circle' | 'square'

/** ButtonGroup layout orientation */
export type HxOrientation = 'horizontal' | 'vertical'

/** Text input type attribute values */
export type HxInputType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'url'
  | 'search'
  | 'number'
  | 'date'

/** Textarea resize behavior */
export type HxTextareaResize = 'none' | 'vertical' | 'horizontal' | 'both'

/**
 * Base event detail shape for hx-input events on text-like components.
 */
export interface HxInputEventDetail {
  value: string
}

/**
 * Base event detail shape for hx-change events on text-like components.
 */
export interface HxChangeStringEventDetail {
  value: string
}

/**
 * Event detail shape for hx-change on numeric components (e.g. hx-slider).
 */
export interface HxChangeNumberEventDetail {
  value: number
}

/**
 * Event detail shape for hx-change on boolean/toggle components (e.g. hx-checkbox, hx-switch).
 */
export interface HxChangeBooleanEventDetail {
  checked: boolean
  value: string
}

/**
 * Event detail shape for hx-click events on button components.
 */
export interface HxClickEventDetail {
  originalEvent: MouseEvent
}

/**
 * Event detail shape for hx-dismiss on dismissible components.
 */
export type HxDismissEventDetail = Record<string, never>
