import { defineNuxtModule, addComponent } from '@nuxt/kit'

/**
 * Nuxt 3 module for @helixds/vue.
 *
 * Registers all Helix Vue wrapper components as auto-imports so they can be
 * used in Nuxt templates without explicit import statements.
 *
 * @example
 * // nuxt.config.ts
 * export default defineNuxtConfig({
 *   modules: ['@helixds/vue/nuxt'],
 * })
 */
export default defineNuxtModule({
  meta: {
    name: '@helixds/vue',
    configKey: 'helixVue',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  setup() {
    const components = [
      'HxAlert',
      'HxAvatar',
      'HxBadge',
      'HxBreadcrumb',
      'HxBreadcrumbItem',
      'HxButton',
      'HxButtonGroup',
      'HxCard',
      'HxCheckbox',
      'HxContainer',
      'HxField',
      'HxForm',
      'HxIconButton',
      'HxProse',
      'HxRadio',
      'HxRadioGroup',
      'HxSelect',
      'HxSlider',
      'HxSwitch',
      'HxTextInput',
      'HxTextarea',
    ] as const

    for (const name of components) {
      addComponent({
        name,
        export: name,
        filePath: '@helixds/vue',
      })
    }
  },
})
