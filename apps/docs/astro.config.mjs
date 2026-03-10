// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://wc-2026.dev',
  vite: {
    resolve: {
      alias: {
        '@helix/library/components/': path.resolve(
          __dirname,
          '../../packages/hx-library/dist/components/',
        ),
      },
    },
    optimizeDeps: {
      include: [
        'lit',
        'lit/decorators.js',
        'lit/directives/class-map.js',
        'lit/directives/if-defined.js',
        'lit/directives/live.js',
        '@lit/reactive-element',
        'lit-html',
        'lit-element/lit-element.js',
      ],
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'material-theme-palenight',
      wrap: false,
    },
  },
  integrations: [
    starlight({
      expressiveCode: {
        themes: ['material-theme-palenight'],
        styleOverrides: {
          borderRadius: '0.75rem',
          borderWidth: '1px',
        },
      },
      components: {
        PageTitle: './src/components/PageTitle.astro',
        Header: './src/components/Header.astro',
        SkipLink: './src/components/SkipLink.astro',
      },
      title: 'HELiX',
      description:
        'HTML Element Library for Interactive eXperiences - Enterprise Web Components for Drupal CMS',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/bookedsolidtech/helix',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: 'noindex, nofollow',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.googleapis.com',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preconnect',
            href: 'https://fonts.gstatic.com',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
            integrity:
              'sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==',
            crossorigin: 'anonymous',
            referrerpolicy: 'no-referrer',
          },
        },
        {
          tag: 'script',
          content: `
(function() {
  // Wait for page load
  function init() {

    // ===== SCROLLSPY WITH URL HASH UPDATE =====
    function initScrollspy() {
      var tocLinks = document.querySelectorAll('.right-sidebar .sl-toc a');
      if (!tocLinks.length) return;

      var headings = [];
      tocLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          var id = href.substring(1);
          var heading = document.getElementById(id);
          if (heading) {
            headings.push({ id: id, element: heading, link: link });
          }
        }
      });

      if (!headings.length) return;

      var currentActive = null;

      function updateActive() {
        var scrollPos = window.scrollY + 100;

        var current = null;
        for (var i = headings.length - 1; i >= 0; i--) {
          var heading = headings[i];
          if (heading.element.offsetTop <= scrollPos) {
            current = heading;
            break;
          }
        }

        if (current && current !== currentActive) {
          tocLinks.forEach(function(link) {
            link.removeAttribute('aria-current');
          });

          current.link.setAttribute('aria-current', 'true');
          currentActive = current;

          if (history.replaceState) {
            history.replaceState(null, null, '#' + current.id);
          }
        }
      }

      var ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(function() {
            updateActive();
            ticking = false;
          });
          ticking = true;
        }
      });

      updateActive();
    }

    initScrollspy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
          `,
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          collapsed: true,
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'Project Structure', slug: 'getting-started/project-structure' },
          ],
        },
        {
          label: 'Component Library',
          collapsed: true,
          badge: { text: '87', variant: 'success' },
          items: [
            { label: 'Overview', slug: 'component-library/overview' },
            {
              label: 'Actions',
              collapsed: true,
              items: [
                { label: 'hx-button', slug: 'component-library/hx-button' },
                { label: 'hx-button-group', slug: 'component-library/hx-button-group' },
                { label: 'hx-copy-button', slug: 'component-library/hx-copy-button' },
                { label: 'hx-link', slug: 'component-library/hx-link' },
                { label: 'hx-split-button', slug: 'component-library/hx-split-button' },
                { label: 'hx-toggle-button', slug: 'component-library/hx-toggle-button' },
              ],
            },
            {
              label: 'Navigation',
              collapsed: true,
              items: [
                { label: 'hx-accordion', slug: 'component-library/hx-accordion' },
                { label: 'hx-accordion-item', slug: 'component-library/hx-accordion-item' },
                { label: 'hx-breadcrumb', slug: 'component-library/hx-breadcrumb' },
                { label: 'hx-breadcrumb-item', slug: 'component-library/hx-breadcrumb-item' },
                { label: 'hx-nav', slug: 'component-library/hx-nav' },
                { label: 'hx-nav-item', slug: 'component-library/hx-nav-item' },
                { label: 'hx-pagination', slug: 'component-library/hx-pagination' },
                { label: 'hx-side-nav', slug: 'component-library/hx-side-nav' },
                { label: 'hx-step', slug: 'component-library/hx-step' },
                { label: 'hx-steps', slug: 'component-library/hx-steps' },
                { label: 'hx-tab', slug: 'component-library/hx-tab' },
                { label: 'hx-tab-panel', slug: 'component-library/hx-tab-panel' },
                { label: 'hx-tabs', slug: 'component-library/hx-tabs' },
                { label: 'hx-action-bar', slug: 'component-library/hx-action-bar' },
                { label: 'hx-top-nav', slug: 'component-library/hx-top-nav' },
              ],
            },
            {
              label: 'Form Controls',
              collapsed: true,
              items: [
                { label: 'hx-checkbox', slug: 'component-library/hx-checkbox' },
                { label: 'hx-checkbox-group', slug: 'component-library/hx-checkbox-group' },
                { label: 'hx-color-picker', slug: 'component-library/hx-color-picker' },
                { label: 'hx-combobox', slug: 'component-library/hx-combobox' },
                { label: 'hx-date-picker', slug: 'component-library/hx-date-picker' },
                { label: 'hx-field', slug: 'component-library/hx-field' },
                { label: 'hx-field-label', slug: 'component-library/hx-field-label' },
                { label: 'hx-file-upload', slug: 'component-library/hx-file-upload' },
                { label: 'hx-form', slug: 'component-library/hx-form' },
                { label: 'hx-help-text', slug: 'component-library/hx-help-text' },
                { label: 'hx-number-input', slug: 'component-library/hx-number-input' },
                { label: 'hx-radio', slug: 'component-library/hx-radio' },
                { label: 'hx-radio-group', slug: 'component-library/hx-radio-group' },
                { label: 'hx-select', slug: 'component-library/hx-select' },
                { label: 'hx-slider', slug: 'component-library/hx-slider' },
                { label: 'hx-switch', slug: 'component-library/hx-switch' },
                { label: 'hx-text-input', slug: 'component-library/hx-text-input' },
                { label: 'hx-textarea', slug: 'component-library/hx-textarea' },
                { label: 'hx-time-picker', slug: 'component-library/hx-time-picker' },
              ],
            },
            {
              label: 'Data Display',
              collapsed: true,
              items: [
                { label: 'hx-carousel', slug: 'component-library/hx-carousel' },
                { label: 'hx-carousel-item', slug: 'component-library/hx-carousel-item' },
                { label: 'hx-code-snippet', slug: 'component-library/hx-code-snippet' },
                { label: 'hx-data-table', slug: 'component-library/hx-data-table' },
                { label: 'hx-list', slug: 'component-library/hx-list' },
                { label: 'hx-list-item', slug: 'component-library/hx-list-item' },
                { label: 'hx-rating', slug: 'component-library/hx-rating' },
                { label: 'hx-structured-list', slug: 'component-library/hx-structured-list' },
                {
                  label: 'hx-structured-list-row',
                  slug: 'component-library/hx-structured-list-row',
                },
                { label: 'hx-tag', slug: 'component-library/hx-tag' },
                { label: 'hx-tree-item', slug: 'component-library/hx-tree-item' },
                { label: 'hx-tree-view', slug: 'component-library/hx-tree-view' },
              ],
            },
            {
              label: 'Feedback & Status',
              collapsed: true,
              items: [
                { label: 'hx-alert', slug: 'component-library/hx-alert' },
                { label: 'hx-badge', slug: 'component-library/hx-badge' },
                { label: 'hx-meter', slug: 'component-library/hx-meter' },
                { label: 'hx-progress-bar', slug: 'component-library/hx-progress-bar' },
                { label: 'hx-progress-ring', slug: 'component-library/hx-progress-ring' },
                { label: 'hx-skeleton', slug: 'component-library/hx-skeleton' },
                { label: 'hx-spinner', slug: 'component-library/hx-spinner' },
                { label: 'hx-status-indicator', slug: 'component-library/hx-status-indicator' },
                { label: 'hx-toast', slug: 'component-library/hx-toast' },
                { label: 'hx-toast-stack', slug: 'component-library/hx-toast-stack' },
              ],
            },
            {
              label: 'Content & Media',
              collapsed: true,
              items: [
                { label: 'hx-avatar', slug: 'component-library/hx-avatar' },
                { label: 'hx-card', slug: 'component-library/hx-card' },
                { label: 'hx-container', slug: 'component-library/hx-container' },
                { label: 'hx-divider', slug: 'component-library/hx-divider' },
                { label: 'hx-icon', slug: 'component-library/hx-icon' },
                { label: 'hx-image', slug: 'component-library/hx-image' },
                { label: 'hx-prose', slug: 'component-library/hx-prose' },
                { label: 'hx-text', slug: 'component-library/hx-text' },
              ],
            },
            {
              label: 'Overlays & Menus',
              collapsed: true,
              items: [
                { label: 'hx-dialog', slug: 'component-library/hx-dialog' },
                { label: 'hx-drawer', slug: 'component-library/hx-drawer' },
                { label: 'hx-dropdown', slug: 'component-library/hx-dropdown' },
                { label: 'hx-menu', slug: 'component-library/hx-menu' },
                { label: 'hx-menu-divider', slug: 'component-library/hx-menu-divider' },
                { label: 'hx-menu-item', slug: 'component-library/hx-menu-item' },
                { label: 'hx-overflow-menu', slug: 'component-library/hx-overflow-menu' },
                { label: 'hx-popover', slug: 'component-library/hx-popover' },
                { label: 'hx-popup', slug: 'component-library/hx-popup' },
                { label: 'hx-tooltip', slug: 'component-library/hx-tooltip' },
              ],
            },
            {
              label: 'Layout',
              collapsed: true,
              items: [
                { label: 'hx-grid', slug: 'component-library/hx-grid' },
                { label: 'hx-grid-item', slug: 'component-library/hx-grid-item' },
                { label: 'hx-split-panel', slug: 'component-library/hx-split-panel' },
                { label: 'hx-stack', slug: 'component-library/hx-stack' },
              ],
            },
            {
              label: 'Utility',
              collapsed: true,
              items: [
                { label: 'hx-format-date', slug: 'component-library/hx-format-date' },
                { label: 'hx-theme', slug: 'component-library/hx-theme' },
                { label: 'hx-visually-hidden', slug: 'component-library/hx-visually-hidden' },
              ],
            },
          ],
        },
        {
          label: 'Guides',
          collapsed: true,
          items: [
            {
              label: 'Building Components',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'components/overview' },
                { label: 'Building', slug: 'components/building' },
                { label: 'Component API', slug: 'components/api' },
                { label: 'Examples', slug: 'components/examples' },
                {
                  label: 'Building FOR Drupal',
                  collapsed: true,
                  items: [
                    { label: 'Twig Templates', slug: 'drupal-integration/twig/fundamentals' },
                    {
                      label: 'Properties & Attributes',
                      slug: 'drupal-integration/twig/properties',
                    },
                    { label: 'Slots in Twig', slug: 'drupal-integration/twig/slots' },
                    {
                      label: 'Drupal Behaviors',
                      slug: 'drupal-integration/behaviors/fundamentals',
                    },
                    {
                      label: 'Per-Component Loading',
                      slug: 'drupal-integration/per-component-loading',
                    },
                  ],
                },
                {
                  label: 'Fundamentals',
                  collapsed: true,
                  items: [
                    {
                      label: 'Your First Component',
                      slug: 'components/fundamentals/first-component',
                    },
                    {
                      label: 'Reactive Properties',
                      slug: 'components/fundamentals/reactive-properties',
                    },
                    {
                      label: 'Properties vs Attributes',
                      slug: 'components/fundamentals/properties-vs-attributes',
                    },
                    { label: 'The Update Cycle', slug: 'components/fundamentals/update-cycle' },
                    { label: 'Lifecycle', slug: 'components/fundamentals/lifecycle' },
                    { label: 'Template Syntax', slug: 'components/fundamentals/template-syntax' },
                    { label: 'Decorators', slug: 'components/fundamentals/decorators' },
                    { label: 'Built-in Directives', slug: 'components/fundamentals/directives' },
                    {
                      label: 'Custom Directives',
                      slug: 'components/fundamentals/custom-directives',
                    },
                  ],
                },
                {
                  label: 'Shadow DOM',
                  collapsed: true,
                  items: [
                    { label: 'Architecture', slug: 'components/shadow-dom/architecture' },
                    { label: 'Open vs Closed', slug: 'components/shadow-dom/open-closed' },
                    { label: 'Slots', slug: 'components/shadow-dom/slots' },
                    {
                      label: 'Advanced Slot Patterns',
                      slug: 'components/shadow-dom/advanced-slots',
                    },
                    { label: 'CSS Parts', slug: 'components/shadow-dom/parts' },
                    { label: 'Part Forwarding', slug: 'components/shadow-dom/part-forwarding' },
                    { label: 'Events', slug: 'components/shadow-dom/events' },
                  ],
                },
                {
                  label: 'Styling',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'components/styling/fundamentals' },
                    { label: 'Design Tokens', slug: 'components/styling/tokens' },
                    { label: 'Theming', slug: 'components/styling/theming' },
                    {
                      label: 'Constructable Stylesheets',
                      slug: 'components/styling/constructable-stylesheets',
                    },
                    { label: 'Responsive Components', slug: 'components/styling/responsive' },
                    { label: 'Dark Mode', slug: 'components/styling/dark-mode' },
                    { label: 'Animations & Transitions', slug: 'components/styling/animations' },
                    { label: 'CSS Performance', slug: 'components/styling/performance' },
                  ],
                },
                {
                  label: 'Events',
                  collapsed: true,
                  items: [
                    { label: 'Custom Events', slug: 'components/events/custom-events' },
                    { label: 'Shadow DOM Events', slug: 'components/shadow-dom/events' },
                    { label: 'Event Delegation', slug: 'components/events/delegation' },
                    { label: 'Event Bus & PubSub', slug: 'components/events/event-bus' },
                  ],
                },
                {
                  label: 'Forms',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'components/forms/fundamentals' },
                    { label: 'ElementInternals', slug: 'components/forms/element-internals' },
                    { label: 'Form Accessibility', slug: 'components/forms/accessibility' },
                    { label: 'Validation', slug: 'components/forms/validation' },
                    { label: 'Custom Validity', slug: 'components/forms/custom-validity' },
                    { label: 'Complex Inputs', slug: 'components/forms/complex-inputs' },
                  ],
                },
                {
                  label: 'TypeScript',
                  collapsed: true,
                  items: [
                    { label: 'Typing Components', slug: 'components/typescript/typing-components' },
                    { label: 'Strict Mode', slug: 'components/typescript/strict-mode' },
                    { label: 'Event Types', slug: 'components/typescript/event-types' },
                    { label: 'Generics', slug: 'components/typescript/generics' },
                    { label: 'Advanced Patterns', slug: 'components/typescript/advanced-types' },
                    { label: 'Declaration Files', slug: 'components/typescript/declarations' },
                  ],
                },
                {
                  label: 'Advanced',
                  collapsed: true,
                  items: [
                    {
                      label: 'Composition Patterns',
                      slug: 'components/advanced/composition-patterns',
                    },
                    { label: 'Reactive Controllers', slug: 'components/advanced/controllers' },
                    { label: 'State Management', slug: 'components/advanced/state-management' },
                    { label: 'Mixins', slug: 'components/advanced/mixins' },
                    { label: 'Async Tasks', slug: 'components/advanced/async-tasks' },
                    { label: 'Context Protocol', slug: 'components/advanced/context-protocol' },
                  ],
                },
                {
                  label: 'Performance',
                  collapsed: true,
                  items: [
                    { label: 'Bundle Size', slug: 'components/performance/bundle-size' },
                    { label: 'Rendering', slug: 'components/performance/rendering' },
                    { label: 'Lazy Loading', slug: 'components/performance/lazy-loading' },
                    { label: 'SSR Considerations', slug: 'components/performance/ssr' },
                  ],
                },
                {
                  label: 'Testing',
                  collapsed: true,
                  items: [
                    { label: 'Vitest Setup', slug: 'components/testing/vitest-setup' },
                    { label: 'Writing Tests', slug: 'components/testing/vitest' },
                    { label: 'Shadow DOM Testing', slug: 'components/testing/shadow-dom' },
                    { label: 'Async Testing', slug: 'components/testing/async' },
                    { label: 'Event Testing', slug: 'components/testing/event-testing' },
                    { label: 'Form Testing', slug: 'components/testing/form-testing' },
                    { label: 'Visual Regression', slug: 'components/testing/visual-regression' },
                  ],
                },
                {
                  label: 'Accessibility',
                  collapsed: true,
                  items: [
                    { label: 'WCAG 2.1 AA', slug: 'components/accessibility/wcag' },
                    { label: 'ARIA Patterns', slug: 'components/accessibility/aria' },
                    { label: 'Keyboard Navigation', slug: 'components/accessibility/keyboard' },
                    {
                      label: 'Focus Management',
                      slug: 'components/accessibility/focus-management',
                    },
                    { label: 'Screen Readers', slug: 'components/accessibility/screen-readers' },
                    { label: 'Accessibility Testing', slug: 'components/accessibility/testing' },
                  ],
                },
                {
                  label: 'Documentation',
                  collapsed: true,
                  items: [
                    {
                      label: 'Writing Storybook Stories',
                      slug: 'components/documentation/storybook',
                    },
                    {
                      label: 'Storybook Interaction Tests',
                      slug: 'components/documentation/storybook-interaction',
                    },
                    {
                      label: 'Custom Elements Manifest',
                      slug: 'components/documentation/cem-fundamentals',
                    },
                    { label: 'JSDoc for Components', slug: 'components/documentation/jsdoc' },
                  ],
                },
                {
                  label: 'Distribution',
                  collapsed: true,
                  items: [
                    { label: 'Packaging for npm', slug: 'components/distribution/packaging' },
                    {
                      label: 'Versioning & Changelogs',
                      slug: 'components/distribution/versioning',
                    },
                    { label: 'CDN Distribution', slug: 'components/distribution/cdn' },
                  ],
                },
              ],
            },
            {
              label: 'Design Tokens',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'design-tokens/overview' },
                { label: 'Token Tiers', slug: 'design-tokens/tiers' },
                { label: 'Theming', slug: 'design-tokens/theming' },
                { label: 'Customization', slug: 'design-tokens/customization' },
              ],
            },
            {
              label: 'Drupal Integration',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'drupal-integration/overview' },
                { label: 'Best Practices', slug: 'drupal-integration/best-practices' },
                { label: 'Library System', slug: 'drupal-integration/library-system' },
                {
                  label: 'Installation',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: 'drupal-integration/installation/overview' },
                    { label: 'Via npm', slug: 'drupal-integration/installation/npm' },
                    { label: 'Via CDN', slug: 'drupal-integration/installation/cdn' },
                    { label: 'Drupal Module', slug: 'drupal-integration/installation/module' },
                  ],
                },
                {
                  label: 'Twig Templates',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'drupal-integration/twig/fundamentals' },
                    { label: 'Properties', slug: 'drupal-integration/twig/properties' },
                    { label: 'Slots', slug: 'drupal-integration/twig/slots' },
                    { label: 'Attributes', slug: 'drupal-integration/twig/attributes' },
                    { label: 'Debugging', slug: 'drupal-integration/twig/debugging' },
                  ],
                },
                {
                  label: 'Drupal Behaviors',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'drupal-integration/behaviors/fundamentals' },
                    { label: 'Patterns', slug: 'drupal-integration/behaviors/patterns' },
                    { label: 'Once API', slug: 'drupal-integration/behaviors/once-api' },
                    {
                      label: 'With Web Components',
                      slug: 'drupal-integration/behaviors/web-components',
                    },
                  ],
                },
                {
                  label: 'Forms',
                  collapsed: true,
                  items: [
                    { label: 'Form API', slug: 'drupal-integration/forms/form-api' },
                    { label: 'Element Plugin', slug: 'drupal-integration/forms/element-plugin' },
                  ],
                },
                {
                  label: 'Performance',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: 'drupal-integration/performance/overview' },
                    { label: 'Lazy Loading', slug: 'drupal-integration/performance/lazy-loading' },
                    {
                      label: 'Per-Component Loading',
                      slug: 'drupal-integration/per-component-loading',
                    },
                  ],
                },
                {
                  label: 'Troubleshooting',
                  slug: 'drupal-integration/troubleshooting/common-issues',
                },
              ],
            },
            {
              label: 'Boolean Attributes',
              slug: 'guides/boolean-attributes',
            },
          ],
        },
        {
          label: 'Framework Integration',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'framework-integration' },
            { label: 'React', slug: 'framework-integration/react' },
            { label: 'Vue', slug: 'framework-integration/vue' },
            { label: 'Angular', slug: 'framework-integration/angular' },
            { label: 'Plain HTML / CDN', slug: 'framework-integration/html' },
            { label: 'Drupal', slug: 'framework-integration/drupal' },
          ],
        },
        {
          label: 'Architecture',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'architecture/overview' },
            { label: 'Monorepo Structure', slug: 'architecture/monorepo' },
            { label: 'Build Pipeline', slug: 'architecture/build-pipeline' },
            { label: 'Testing Strategy', slug: 'architecture/testing' },
          ],
        },
        {
          label: 'Planning',
          collapsed: true,
          items: [
            {
              label: 'Prototype',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'prototype/overview' },
                { label: 'Rapid Prototype', slug: 'prototype/rapid-prototype' },
                { label: 'Tech Stack Validation', slug: 'prototype/tech-stack-validation' },
              ],
            },
            {
              label: 'Discovery',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'pre-planning/overview' },
                { label: 'Architecture & System Design', slug: 'pre-planning/architecture' },
                { label: 'Components', slug: 'pre-planning/components' },
                { label: 'Design System & Tokens', slug: 'pre-planning/design-system' },
                { label: 'Documentation Hub', slug: 'pre-planning/docs-hub' },
                { label: 'Building Guide', slug: 'pre-planning/building-guide' },
                { label: 'Drupal Guide', slug: 'pre-planning/drupal-guide' },
              ],
            },
          ],
        },
        {
          label: 'API Reference',
          collapsed: true,
          items: [{ label: 'Overview', slug: 'api-reference/overview' }],
        },
      ],
    }),
  ],
});
