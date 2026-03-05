/**
 * @helixds/angular
 *
 * Angular directive wrappers for Helix Design System web components.
 *
 * ## NgModule usage
 * ```typescript
 * import { HelixAngularModule } from '@helixds/angular';
 *
 * @NgModule({ imports: [HelixAngularModule] })
 * export class AppModule {}
 * ```
 *
 * ## Standalone component usage
 * ```typescript
 * import { HELIX_DIRECTIVES, HELIX_VALUE_ACCESSORS } from '@helixds/angular';
 *
 * @Component({
 *   standalone: true,
 *   imports: [...HELIX_DIRECTIVES, ...HELIX_VALUE_ACCESSORS],
 * })
 * export class MyComponent {}
 * ```
 *
 * ## Importing @helix/library side-effects
 * Ensure the web components are registered before use:
 * ```typescript
 * // main.ts
 * import '@helix/library'; // registers all hx-* custom elements
 * ```
 */

// Module + convenience arrays
export {
  HelixAngularModule,
  HELIX_DIRECTIVES,
  HELIX_VALUE_ACCESSORS,
} from './lib/helix-angular.module.js';

// Directives + all auto-generated event detail types (codegen-managed)
export * from './lib/directives/index.js';

// Value accessors (codegen-managed)
export * from './lib/value-accessors/index.js';
