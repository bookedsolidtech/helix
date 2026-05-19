// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  site: 'https://helix.bookedsolid.tech',
  vite: {
    resolve: {
      alias: {
        '@helixui/library/components/': path.resolve(
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
    sitemap(),
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
            {
              label: 'create-helix CLI',
              slug: 'getting-started/create-helix',
              badge: { text: 'New', variant: 'tip' },
            },
            { label: 'Project Structure', slug: 'getting-started/project-structure' },
            { label: 'Release Policy', slug: 'getting-started/release-policy' },
          ],
        },
        {
          label: 'Migration',
          collapsed: false,
          badge: { text: '3.0.0', variant: 'tip' },
          items: [
            {
              label: 'Upgrading to 3.0.0',
              slug: 'migration/upgrading-to-3',
              badge: { text: 'New', variant: 'tip' },
            },
          ],
        },
        {
          label: 'Component Reference',
          link: 'https://storybook.helix.bookedsolid.tech/',
          attrs: { target: '_blank', rel: 'noopener noreferrer' },
          badge: { text: 'Storybook', variant: 'success' },
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
                  label: 'Shadow DOM',
                  collapsed: true,
                  items: [
                    { label: 'Slots', slug: 'components/shadow-dom/slots' },
                    { label: 'CSS Parts', slug: 'components/shadow-dom/parts' },
                    { label: 'Part Forwarding', slug: 'components/shadow-dom/part-forwarding' },
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
                    {
                      label: 'AdoptedStylesheets Showcase',
                      link: '/adopted-stylesheets',
                      badge: { text: 'New', variant: 'tip' },
                    },
                    { label: 'Dark Mode', slug: 'components/styling/dark-mode' },
                    { label: 'Animations & Transitions', slug: 'components/styling/animations' },
                    { label: 'CSS Performance', slug: 'components/styling/performance' },
                  ],
                },
                {
                  label: 'Events',
                  collapsed: true,
                  items: [{ label: 'Custom Events', slug: 'components/events/custom-events' }],
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
                  ],
                },
                {
                  label: 'Performance',
                  collapsed: true,
                  items: [
                    { label: 'Bundle Size', slug: 'components/performance/bundle-size' },
                    { label: 'SSR Considerations', slug: 'components/performance/ssr' },
                  ],
                },
                {
                  label: 'Testing',
                  collapsed: true,
                  items: [
                    { label: 'Vitest Setup', slug: 'components/testing/vitest-setup' },
                    { label: 'Writing Tests', slug: 'components/testing/vitest' },
                    { label: 'Event Testing', slug: 'components/testing/event-testing' },
                    { label: 'Form Testing', slug: 'components/testing/form-testing' },
                    { label: 'Visual Regression', slug: 'components/testing/visual-regression' },
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
                { label: 'Best Practices', slug: 'drupal/best-practices' },
                { label: 'Library System', slug: 'drupal/library-system' },
                { label: 'Per-Component Loading', slug: 'drupal/per-component-loading' },
                {
                  label: 'Installation',
                  collapsed: true,
                  items: [
                    { label: 'Getting Started', slug: 'drupal/installation/getting-started' },
                    { label: 'Via npm', slug: 'drupal/installation/npm' },
                    { label: 'Via CDN', slug: 'drupal/installation/cdn' },
                    { label: 'Drupal Module', slug: 'drupal/installation/module' },
                  ],
                },
                {
                  label: 'Twig Templates',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'drupal/twig-templates/fundamentals' },
                    { label: 'Properties', slug: 'drupal/twig-templates/properties' },
                    { label: 'Slots', slug: 'drupal/twig-templates/slots' },
                    { label: 'Attributes', slug: 'drupal/twig-templates/attributes' },
                    { label: 'Debugging', slug: 'drupal/twig-templates/debugging' },
                  ],
                },
                {
                  label: 'Drupal Behaviors',
                  collapsed: true,
                  items: [
                    { label: 'Fundamentals', slug: 'drupal/behaviors/fundamentals' },
                    { label: 'Patterns', slug: 'drupal/behaviors/patterns' },
                    { label: 'Once API', slug: 'drupal/behaviors/once-api' },
                    { label: 'With Web Components', slug: 'drupal/behaviors/web-components' },
                  ],
                },
                {
                  label: 'Forms',
                  collapsed: true,
                  items: [
                    { label: 'Form API', slug: 'drupal/forms/form-api' },
                    { label: 'Element Plugin', slug: 'drupal/forms/element-plugin' },
                  ],
                },
                {
                  label: 'SDC',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: 'drupal/sdc/overview' },
                    {
                      label: 'Composition',
                      slug: 'drupal/sdc/composition',
                      badge: { text: 'New', variant: 'tip' },
                    },
                    { label: 'Variants', slug: 'drupal/sdc/variants' },
                  ],
                },
                {
                  label: 'Performance',
                  collapsed: true,
                  items: [
                    { label: 'Overview', slug: 'drupal/performance/overview' },
                    { label: 'Lazy Loading', slug: 'drupal/performance/lazy-loading' },
                  ],
                },
                { label: 'Theming', slug: 'drupal/theming' },
                { label: 'Views', slug: 'drupal/views' },
                { label: 'Paragraphs', slug: 'drupal/paragraphs' },
                { label: 'AJAX', slug: 'drupal/ajax' },
                { label: 'Migration', slug: 'drupal/migration' },
                { label: 'Security (XSS)', slug: 'drupal/security-xss' },
                { label: 'Troubleshooting', slug: 'drupal/troubleshooting' },
                { label: 'Common Issues', slug: 'drupal/common-issues' },
              ],
            },
            {
              label: 'Theming',
              slug: 'guides/theming',
            },
            {
              label: 'Adopted Stylesheets',
              slug: 'guides/adopted-stylesheets',
            },
            {
              label: 'Boolean Attributes',
              slug: 'guides/boolean-attributes',
            },
            {
              label: 'Troubleshooting',
              slug: 'guides/troubleshooting',
            },
            {
              label: 'Best Practices',
              slug: 'guides/best-practices',
            },
            {
              label: 'Local CI with act',
              slug: 'guides/local-ci',
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
            { label: 'Astro 5', slug: 'framework-integration/astro' },
            { label: 'Svelte', slug: 'framework-integration/svelte' },
            { label: 'Plain HTML / CDN', slug: 'framework-integration/html' },
            { label: 'Drupal', slug: 'framework-integration/drupal' },
          ],
        },
        {
          label: 'Extending Components',
          collapsed: true,
          badge: { text: 'New', variant: 'tip' },
          items: [
            { label: 'Overview', slug: 'extending' },
            { label: 'Architecture Overview', slug: 'extending/overview' },
            { label: 'Theming Quick Start', slug: 'extending/theming-quick-start' },
            { label: 'PatientCard Example', slug: 'extending/patient-card' },
            {
              label: 'Styling with CSS Parts',
              slug: 'extending/style-components-with-css-parts',
              badge: { text: 'Deep Dive', variant: 'tip' },
            },
            {
              label: 'Register, Bundle & Publish',
              slug: 'extending/register-bundle-publish',
              badge: { text: 'Distribution', variant: 'tip' },
            },
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
            {
              label: 'Decision Records',
              collapsed: true,
              items: [
                { label: 'ADRs Overview', slug: 'architecture/adrs' },
                { label: 'Slots vs Props', slug: 'architecture/adrs/slots-vs-props' },
                { label: 'Component Loading', slug: 'architecture/adrs/component-loading' },
                { label: 'Attribute Naming', slug: 'architecture/adrs/attribute-naming' },
                { label: 'Light DOM Rendering', slug: 'architecture/adrs/light-dom' },
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
