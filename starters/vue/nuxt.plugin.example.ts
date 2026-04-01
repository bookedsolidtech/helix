/**
 * Nuxt client-side plugin to register HELiX custom elements.
 * Save as ~/plugins/helix.client.ts in your Nuxt project.
 *
 * The .client.ts suffix ensures this only runs in the browser,
 * preventing SSR issues with custom element registration.
 */
export default defineNuxtPlugin(() => {
  // Dynamically import to keep it client-only
  import('@helixui/library');
});
