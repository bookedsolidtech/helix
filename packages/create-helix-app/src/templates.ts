// @design-system-approved: CLI-001 Terminal colors (picocolors), not CSS values
import pc from 'picocolors';
import type { TemplateConfig, ComponentBundleConfig } from './types.js';

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'react-next',
    name: 'React + Next.js 15',
    description: 'App Router, SSR-ready, full HELiX integration',
    hint: 'recommended for new projects',
    color: pc.cyan,
    dependencies: {
      next: '^15.3.0',
      react: '^19.1.0',
      'react-dom': '^19.1.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
      '@lit/react': '^1.0.0',
    },
    devDependencies: {
      '@types/react': '^19.1.0',
      '@types/react-dom': '^19.1.0',
      typescript: '^5.7.0',
    },
    features: ['ssr', 'app-router', 'react-wrappers', 'form-integration'],
  },
  {
    id: 'react-vite',
    name: 'React + Vite',
    description: 'Lightning fast dev, SPA-first, HELiX with @lit/react',
    hint: 'best DX for SPAs',
    color: pc.magenta,
    dependencies: {
      react: '^19.1.0',
      'react-dom': '^19.1.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
      '@lit/react': '^1.0.0',
    },
    devDependencies: {
      '@types/react': '^19.1.0',
      '@types/react-dom': '^19.1.0',
      '@vitejs/plugin-react': '^4.5.0',
      vite: '^6.4.0',
      typescript: '^5.7.0',
    },
    features: ['hot-reload', 'react-wrappers', 'form-integration'],
  },
  {
    id: 'vue-nuxt',
    name: 'Vue + Nuxt 4',
    description: 'Full-stack Vue with SSR, native WC support',
    hint: 'Vue ecosystem, SSR built-in',
    color: pc.green,
    dependencies: {
      nuxt: '^4.0.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
    },
    devDependencies: {
      typescript: '^5.7.0',
    },
    features: ['ssr', 'native-wc-support', 'auto-imports'],
  },
  {
    id: 'vue-vite',
    name: 'Vue + Vite',
    description: 'Lightweight Vue 3 SPA with native WC binding',
    hint: 'minimal, fast',
    color: pc.green,
    dependencies: {
      vue: '^3.5.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.2.0',
      vite: '^6.4.0',
      typescript: '^5.7.0',
    },
    features: ['hot-reload', 'native-wc-support'],
  },
  {
    id: 'svelte-kit',
    name: 'SvelteKit',
    description: 'Svelte 5 + SvelteKit, native custom element support',
    hint: 'best native WC support',
    color: pc.red,
    dependencies: {
      '@sveltejs/kit': '^2.20.0',
      svelte: '^5.28.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
    },
    devDependencies: {
      '@sveltejs/adapter-auto': '^6.0.0',
      vite: '^6.4.0',
      typescript: '^5.7.0',
    },
    features: ['ssr', 'native-wc-support', 'runes'],
  },
  {
    id: 'angular',
    name: 'Angular 18',
    description: 'Enterprise Angular with CUSTOM_ELEMENTS_SCHEMA',
    hint: 'enterprise teams',
    color: pc.red,
    dependencies: {
      '@angular/core': '^18.0.0',
      '@angular/compiler': '^18.0.0',
      '@angular/platform-browser': '^18.0.0',
      '@angular/platform-browser-dynamic': '^18.0.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
      rxjs: '^7.8.0',
      'zone.js': '^0.15.0',
    },
    devDependencies: {
      '@angular/cli': '^18.0.0',
      '@angular/build': '^18.0.0',
      typescript: '^5.7.0',
    },
    features: ['signals', 'standalone-components', 'custom-elements-schema'],
  },
  {
    id: 'astro',
    name: 'Astro',
    description: 'Content-first with islands architecture, zero JS by default',
    hint: 'docs sites, marketing',
    color: pc.yellow,
    dependencies: {
      astro: '^5.7.0',
      '@helixui/library': '^1.0.0',
      '@helixui/tokens': '^0.3.0',
    },
    devDependencies: {
      typescript: '^5.7.0',
    },
    features: ['islands', 'zero-js-default', 'content-collections'],
  },
  {
    id: 'vanilla',
    name: 'Vanilla (HTML + CDN)',
    description: 'No framework, no build step, just HTML and HELiX via CDN',
    hint: 'prototyping, Drupal, CMS',
    color: pc.white,
    dependencies: {},
    devDependencies: {},
    features: ['zero-config', 'cdn', 'no-build-step'],
  },
];

export const COMPONENT_BUNDLES: ComponentBundleConfig[] = [
  {
    id: 'all',
    name: 'All Components',
    description: '98 components — the full HELiX library',
    components: ['*'],
  },
  {
    id: 'core',
    name: 'Core UI',
    description: 'button, card, badge, text, icon, avatar, divider, chip',
    components: [
      'hx-button',
      'hx-icon-button',
      'hx-button-group',
      'hx-split-button',
      'hx-card',
      'hx-badge',
      'hx-text',
      'hx-icon',
      'hx-avatar',
      'hx-divider',
      'hx-chip',
      'hx-tag',
      'hx-tooltip',
      'hx-popover',
    ],
  },
  {
    id: 'forms',
    name: 'Form Components',
    description: 'text-input, select, checkbox, radio, switch, textarea, field',
    components: [
      'hx-text-input',
      'hx-select',
      'hx-checkbox',
      'hx-checkbox-group',
      'hx-radio-group',
      'hx-switch',
      'hx-textarea',
      'hx-field',
      'hx-field-label',
      'hx-field-help-text',
      'hx-combobox',
      'hx-slider',
      'hx-range-slider',
      'hx-color-picker',
      'hx-date-picker',
      'hx-time-picker',
      'hx-file-upload',
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'nav, sidebar, tabs, breadcrumb, pagination, menu',
    components: [
      'hx-nav',
      'hx-side-nav',
      'hx-tabs',
      'hx-tab',
      'hx-tab-panel',
      'hx-breadcrumb',
      'hx-pagination',
      'hx-menu',
      'hx-menu-item',
      'hx-overflow-menu',
      'hx-tree-view',
      'hx-tree-item',
    ],
  },
  {
    id: 'data-display',
    name: 'Data Display',
    description: 'data-table, stat, progress, meter, counter, structured-list',
    components: [
      'hx-data-table',
      'hx-stat',
      'hx-counter',
      'hx-progress-bar',
      'hx-progress-ring',
      'hx-meter',
      'hx-structured-list',
      'hx-rating',
      'hx-code-snippet',
      'hx-status-indicator',
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback & Overlays',
    description: 'alert, toast, dialog, drawer, banner, skeleton',
    components: [
      'hx-alert',
      'hx-toast',
      'hx-dialog',
      'hx-drawer',
      'hx-banner',
      'hx-skeleton',
      'hx-spinner',
      'hx-loading-bar',
    ],
  },
  {
    id: 'layout',
    name: 'Layout',
    description: 'grid, stack, split-panel, accordion, carousel',
    components: [
      'hx-grid',
      'hx-stack',
      'hx-split-panel',
      'hx-accordion',
      'hx-accordion-item',
      'hx-carousel',
      'hx-carousel-item',
      'hx-container',
      'hx-visually-hidden',
      'hx-resize-observer',
      'hx-scroll-area',
    ],
  },
];

export function getTemplate(id: string): TemplateConfig | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getComponentsForBundles(bundles: string[]): string[] {
  if (bundles.includes('all')) return ['*'];
  const components = new Set<string>();
  for (const bundleId of bundles) {
    const bundle = COMPONENT_BUNDLES.find((b) => b.id === bundleId);
    if (bundle) {
      for (const component of bundle.components) {
        components.add(component);
      }
    }
  }
  return [...components];
}
