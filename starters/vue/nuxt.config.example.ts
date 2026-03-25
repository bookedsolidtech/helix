/**
 * Nuxt 4 configuration for HELiX web components.
 *
 * Copy relevant sections into your nuxt.config.ts to integrate HELiX.
 */
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // Nuxt 4 compatibility
  future: { compatibilityVersion: 4 },

  // Tell Vue's compiler to treat hx-* as native custom elements
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('hx-'),
    },
  },

  // Import HELiX library once, available everywhere
  // Registers all hx-* custom elements on the client
  plugins: ['~/plugins/helix.client.ts'],
});
