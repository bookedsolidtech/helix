import '@helixui/tokens/tokens.css';
import './docs/helix-docs.css';
import './docs/force-states.css';
import type { Preview } from '@storybook/web-components';
import { setCustomElementsManifest } from '@storybook/web-components';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { html } from 'lit';
import customElements from '@helixui/library/custom-elements.json';
import { helixBackgroundsForMode, HELIX_THEME_MODES } from './manager-theme';

// Register the Custom Elements Manifest so autodocs API tables
// are populated with properties, events, slots, CSS parts, and
// CSS custom properties.
setCustomElementsManifest(customElements);

/**
 * Viewport breakpoints sourced from @helixui/tokens (`breakpoint.{sm,md,lg,xl,2xl}`),
 * extended with two below-`sm` mobile points (`xs`, `mobile`) and an `xxl` ultrawide
 * point. The token values (sm/md/lg/xl/2xl) are load-bearing — anything outside the
 * documented scale is convenience for responsive testing.
 */
const helixViewports = {
  xs: {
    name: 'xs (mobile small, 360px)',
    styles: { width: '360px', height: '780px' },
    type: 'mobile' as const,
  },
  mobile: {
    name: 'mobile (375px)',
    styles: { width: '375px', height: '812px' },
    type: 'mobile' as const,
  },
  sm: {
    name: 'sm (token, 640px)',
    styles: { width: '640px', height: '900px' },
    type: 'mobile' as const,
  },
  md: {
    name: 'md (token, 768px)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet' as const,
  },
  lg: {
    name: 'lg (token, 1024px)',
    styles: { width: '1024px', height: '768px' },
    type: 'desktop' as const,
  },
  xl: {
    name: 'xl (token, 1280px)',
    styles: { width: '1280px', height: '900px' },
    type: 'desktop' as const,
  },
  '2xl': {
    name: '2xl (token, 1536px)',
    styles: { width: '1536px', height: '960px' },
    type: 'desktop' as const,
  },
  xxl: {
    name: 'xxl (ultrawide, 1920px)',
    styles: { width: '1920px', height: '1080px' },
    type: 'desktop' as const,
  },
};

const preview: Preview = {
  parameters: {
    beforeEach: async () => {
      document.body.removeAttribute('style');
    },
    controls: {
      expanded: true,
      sort: 'requiredFirst',
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: {
        headingSelector: 'h2, h3',
        title: 'Table of Contents',
      },
    },
    options: {
      storySort: {
        order: [
          'Welcome Center',
          ['Introduction', '*'],
          'Design Tokens',
          ['Colors', 'Spacing', 'Typography', 'Borders', 'Shadows'],
          'Components',
          ['Button', 'Card', 'Text Input', '*'],
          '*',
        ],
      },
    },
    a11y: {
      // axe-core configuration. The default `color-contrast` rule covers WCAG
      // 2.1 AA (4.5:1 normal, 3:1 large). Per-story AAA opt-in pattern: a story
      // upgrading to AAA-cert overrides this rule on its own `parameters.a11y`
      // by switching `color-contrast` to `color-contrast-enhanced` (7:1/4.5:1).
      // No central registry yet — that lands in Phase C/D.
      //
      // Example per-story override:
      //   parameters: {
      //     a11y: {
      //       config: {
      //         rules: [{ id: 'color-contrast', enabled: false },
      //                 { id: 'color-contrast-enhanced', enabled: true }],
      //       },
      //     },
      //   }
      config: {
        rules: [
          {
            // Default: WCAG AA color-contrast on every story.
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
    // Backgrounds map sourced from @helixui/tokens. Each entry resolves to
    // the hex value of `surface.{default,raised,sunken}` in the named mode,
    // so the canvas background tracks the active theme's surface palette
    // even before the theme decorator applies the data-theme attribute.
    backgrounds: {
      options: {
        ...helixBackgroundsForMode('light'),
        ...helixBackgroundsForMode('dark'),
        ...helixBackgroundsForMode('high-contrast'),
      },
    },
    // Viewport addon (Storybook 10 core-bundled). Surfaces the responsive
    // viewport toolbar with helix's documented breakpoints.
    viewport: {
      options: helixViewports,
    },
    // Actions addon (Storybook 10 core-bundled). Auto-detects any arg whose
    // name starts with `hx-` (helix custom events) and surfaces it in the
    // Actions panel as `hx-click`, `hx-input`, `hx-change`, etc.
    actions: {
      argTypesRegex: '^hx-.*',
    },
  },

  initialGlobals: {
    backgrounds: {
      // Matches the helixBackgroundsForMode('light') key for surface.default.
      value: 'surface-default-light',
    },
    theme: 'light',
    viewport: { value: undefined, isRotated: false },
  },

  decorators: [
    // Global padding so stories do not render edge-to-edge.
    (story) => html`<div style="padding: 2rem;">${story()}</div>`,

    // Theme switching via data-theme attribute on <html>.
    // @helixui/tokens/tokens.css defines :root[data-theme="dark"] and
    // :root[data-theme="high-contrast"] overrides, so this decorator
    // activates them automatically. HELIX_THEME_MODES is the single
    // source of truth — kept in sync with the manager chrome theme map.
    withThemeByDataAttribute({
      themes: Object.fromEntries(HELIX_THEME_MODES.map((m) => [m, m])) as Record<
        (typeof HELIX_THEME_MODES)[number],
        (typeof HELIX_THEME_MODES)[number]
      >,
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
