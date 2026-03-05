import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  HxAlertDirective,
  HxAvatarDirective,
  HxBadgeDirective,
  HxBreadcrumbDirective,
  HxBreadcrumbItemDirective,
  HxButtonDirective,
  HxButtonGroupDirective,
  HxCardDirective,
  HxCheckboxDirective,
  HxContainerDirective,
  HxFieldDirective,
  HxFormDirective,
  HxIconButtonDirective,
  HxProseDirective,
  HxRadioDirective,
  HxRadioGroupDirective,
  HxSelectDirective,
  HxSliderDirective,
  HxSwitchDirective,
  HxTextInputDirective,
  HxTextareaDirective,
} from './directives/index.js';

import {
  HelixCheckboxValueAccessor,
  HelixRadioGroupValueAccessor,
  HelixSelectValueAccessor,
  HelixSliderValueAccessor,
  HelixSwitchValueAccessor,
  HelixTextInputValueAccessor,
  HelixTextareaValueAccessor,
} from './value-accessors/index.js';

/**
 * All standalone Angular directives wrapping Helix web components.
 * Import these individually in standalone Angular components or import
 * the `HelixAngularModule` in NgModule-based applications.
 */
export const HELIX_DIRECTIVES = [
  HxAlertDirective,
  HxAvatarDirective,
  HxBadgeDirective,
  HxBreadcrumbDirective,
  HxBreadcrumbItemDirective,
  HxButtonDirective,
  HxButtonGroupDirective,
  HxCardDirective,
  HxCheckboxDirective,
  HxContainerDirective,
  HxFieldDirective,
  HxFormDirective,
  HxIconButtonDirective,
  HxProseDirective,
  HxRadioDirective,
  HxRadioGroupDirective,
  HxSelectDirective,
  HxSliderDirective,
  HxSwitchDirective,
  HxTextInputDirective,
  HxTextareaDirective,
] as const;

/**
 * All standalone `ControlValueAccessor` directives for Helix form components.
 * These activate automatically when `formControlName`, `formControl`, or
 * `ngModel` is added to a Helix form element.
 */
export const HELIX_VALUE_ACCESSORS = [
  HelixCheckboxValueAccessor,
  HelixRadioGroupValueAccessor,
  HelixSelectValueAccessor,
  HelixSliderValueAccessor,
  HelixSwitchValueAccessor,
  HelixTextInputValueAccessor,
  HelixTextareaValueAccessor,
] as const;

/**
 * `HelixAngularModule` — NgModule entry point for the Helix Design System
 * Angular adapter.
 *
 * Import this module in NgModule-based Angular applications to register all
 * Helix component directives and `ControlValueAccessor` implementations.
 *
 * `CUSTOM_ELEMENTS_SCHEMA` is applied so Angular's template compiler does not
 * emit errors for unknown `hx-*` element names.
 *
 * @example
 * ```typescript
 * // app.module.ts
 * import { HelixAngularModule } from '@helixds/angular';
 *
 * @NgModule({
 *   imports: [HelixAngularModule],
 * })
 * export class AppModule {}
 * ```
 *
 * @example Standalone components
 * ```typescript
 * // my.component.ts
 * import { HELIX_DIRECTIVES, HELIX_VALUE_ACCESSORS } from '@helixds/angular';
 *
 * @Component({
 *   standalone: true,
 *   imports: [...HELIX_DIRECTIVES, ...HELIX_VALUE_ACCESSORS],
 *   template: `<hx-text-input label="Name" formControlName="name"></hx-text-input>`,
 * })
 * export class MyComponent {}
 * ```
 */
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ...HELIX_DIRECTIVES,
    ...HELIX_VALUE_ACCESSORS,
  ],
  exports: [...HELIX_DIRECTIVES, ...HELIX_VALUE_ACCESSORS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class HelixAngularModule {}
