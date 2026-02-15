// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://wc-2026.dev',
  vite: {
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
    build: {
      rollupOptions: {
        external: [/^@helix\/tokens/],
      },
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
      description: 'Healthcare Elements Library for Interactive eXperiences - Enterprise Web Components for Drupal CMS',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/himerus/wc-2026',
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
            integrity: 'sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==',
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
          badge: { text: 'Live', variant: 'success' },
          items: [
            { label: 'Overview', slug: 'component-library/overview' },
            { label: 'hx-button', slug: 'component-library/hx-button' },
            { label: 'hx-card', slug: 'component-library/hx-card' },
            { label: 'hx-text-input', slug: 'component-library/hx-text-input' },
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
              ],
            },
            {
              label: 'Drupal Integration',
              collapsed: true,
              items: [
                { label: 'Overview', slug: 'drupal-integration/overview' },
                { label: 'Installation', slug: 'drupal-integration/installation' },
                { label: 'Twig Patterns', slug: 'drupal-integration/twig' },
                { label: 'Behaviors', slug: 'drupal-integration/behaviors' },
                { label: 'Troubleshooting', slug: 'drupal-integration/troubleshooting' },
                { label: 'Loading Strategy', slug: 'guides/drupal-component-loading-strategy' },
                { label: 'Integration Architecture', slug: 'guides/drupal-integration-architecture' },
              ],
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
                { label: 'Interview Prep', slug: 'prototype/interview-prep' },
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
          items: [
            { label: 'Overview', slug: 'api-reference/overview' },
          ],
        },
      ],
    }),
  ],
});
