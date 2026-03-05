/**
 * Minimal type stubs for @nuxt/kit to avoid installing the full package
 * as a dev dependency. Only the symbols used in nuxt/module.ts are declared.
 */
declare module '@nuxt/kit' {
  export interface NuxtModuleMeta {
    name?: string
    configKey?: string
    compatibility?: { nuxt?: string }
  }

  export interface AddComponentOptions {
    name: string
    export?: string
    filePath: string
  }

  export interface NuxtModuleSetupOptions {
    meta?: NuxtModuleMeta
    setup?: () => void
  }

  export function defineNuxtModule(options: NuxtModuleSetupOptions): unknown
  export function addComponent(options: AddComponentOptions): void
}
