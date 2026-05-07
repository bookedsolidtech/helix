import '@helixui/tokens/tokens.css';
import './docs/helix-docs.css';
import './docs/brand-overrides.css';
import './docs/force-states.css';
import './docs/code-editor.css';
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
      // Source block configuration. `format: 'dedent'` strips shared
      // leading whitespace so auto-generated story source aligns with
      // the gutter — matches the visual treatment of hand-written
      // <CodeBlock> usage in MDX. The dark editor chrome on the
      // rendered <pre> is provided by code-editor.css (.docblock-source
      // / .sbdocs-pre selectors) so visual continuity holds without
      // swapping the renderer.
      source: {
        format: 'dedent',
      },
    },
    options: {
      // Sidebar grouping for the phase-c MDX surface.
      //
      // IA model: designer/stakeholder-facing pages float to the top
      // (Overview → Accessibility → Foundations → Patterns →
      // Playground), engineering reference settles to the bottom
      // (Components → Tokens → Drupal). Accessibility is promoted to
      // the second slot — the WCAG 2.1 AA / AAA story is the headline
      // differentiator and must not be buried below the component fold.
      //
      // Top-level categories are stable; nested arrays pin the inner
      // order. Kept narrow on the leaf level — `*` = "any other entry"
      // (alphabetic) — so newly authored stories slot in without an
      // explicit edit here.
      //
      // Pairs with `sidebar.collapsedRoots` in `.storybook/manager.ts`
      // (Components, Tokens, Drupal collapsed by default) so a fresh
      // visitor reads top-down through the editorial story before the
      // engineering surface unrolls under them.
      storySort: {
        order: [
          'Overview',
          'Accessibility',
          [
            'Dashboard',
            'Forced Colors',
            'Keyboard Contracts',
            'Focus Management',
            'Contrast Deep-Dive',
            'Success Criteria',
            'Consumer Obligations',
            '*',
          ],
          'Foundations',
          [
            'Brand Registry',
            'Color',
            'Typography',
            'Spacing',
            'Borders',
            'Shadows',
            'Iconography',
            'Layout',
          ],
          'Patterns',
          ['Forms', 'Feedback', 'Data display', 'Patterns', 'Scenes'],
          'Playground',
          ['Tokens', '*'],
          'Components',
          '*', // alphabetic for component categories
          'Healthcare', // healthcare-domain components (e.g. hx-patient-banner)
          'Layout', // layout primitives (Container, etc.) — distinct from Foundations/Layout
          'Utilities', // engineering-leaf utilities (StyleScope, etc.)
          'Infrastructure', // engineering-leaf infrastructure (Popup, Theme, etc.)
          'Drupal',
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
    // Pseudo-states addon. The toolbar exposes `:hover`, `:focus`, `:focus-visible`,
    // `:active`, `:visited`, and `:target` toggles; this default enables the
    // selector-based fallback for consumers whose components don't use Shadow DOM
    // attributes for state. Components in @helixui/library already expose
    // forced-state hooks via `force-states.css`; the addon stacks on top.
    //
    // Per-story override pattern:
    //   parameters: { pseudo: { hover: true } }
    pseudo: {},
    // Designs addon (@storybook/addon-designs).
    //
    // Why a non-empty default: the addon's panel renderer switches on
    // `parameters.design.type`. An empty `{}` (or any object whose `type`
    // is not one of `iframe | figma | sketch | figspec | image | link`)
    // hits the switch's default branch and renders an "Invalid config
    // type" placeholder in the right rail. That placeholder is the
    // first thing a consumer sees when they open any story — it reads
    // as a defect even though the addon is technically working.
    //
    // The fix is a preview-level default that satisfies the schema. We
    // use the `link` config (no iframe / Figma frame, no design system
    // dependency yet) so the panel surfaces a meaningful pointer to the
    // component's source on GitHub until real Figma URLs land. Stories
    // (or whole component metas) override this with `{ type: 'figma',
    // url: '…' }` or `{ type: 'iframe', url: '…' }` as the design system
    // catches up.
    //
    // Per-story override pattern:
    //   parameters: {
    //     design: { type: 'figma', url: 'https://www.figma.com/file/…' },
    //   }
    //
    // Multi-frame override pattern (renders tabs in the panel):
    //   parameters: {
    //     design: [
    //       { name: 'Light',  type: 'figma', url: '…?node-id=1' },
    //       { name: 'Dark',   type: 'figma', url: '…?node-id=2' },
    //     ],
    //   }
    design: {
      type: 'link',
      name: 'HELiX component source',
      url: 'https://github.com/bookedsolidtech/helix/tree/main/packages/hx-library/src/components',
      label: 'View component source on GitHub',
      showArrow: true,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  },

  initialGlobals: {
    backgrounds: {
      // Matches the helixBackgroundsForMode('light') key for surface.default.
      value: 'surface-default-light',
    },
    theme: 'light',
    brand: '',
    viewport: { value: undefined, isRotated: false },
  },

  /**
   * Brand toolbar entry. Sets `data-brand` on <html>; the brand registry
   * documented at `Foundations/Brand Registry` toggles between the six
   * reference brands (Apex default + Meridian + Lumen + Verdant + Signal
   * + Ember).
   *
   * The data-brand attribute is read by `<hx-theme brand="…">` consumers
   * and by the brand-mock tile demonstrations in the Brand Registry MDX
   * page; it is not consumed by the published @helixui/tokens cascade
   * (brand registries are added by consumers themselves).
   *
   * Each entry maps 1:1 with a `[data-brand="…"]` block in
   * `.storybook/docs/brand-overrides.css`; new entries here without a
   * matching CSS block will toolbar-toggle but not visibly recolor.
   */
  globalTypes: {
    brand: {
      description: 'Active brand override (data-brand on :root)',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: '', title: 'Apex (default)' },
          { value: 'meridian', title: 'Meridian (indigo)' },
          { value: 'lumen', title: 'Lumen (violet)' },
          { value: 'verdant', title: 'Verdant (forest)' },
          { value: 'signal', title: 'Signal (cobalt)' },
          { value: 'ember', title: 'Ember (amber)' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    // Global padding so stories do not render edge-to-edge.
    (story) => html`<div style="padding: 2rem;">${story()}</div>`,

    // Theme switching via data-theme attribute on <html>.
    // @helixui/tokens/tokens.css defines :root[data-theme="dark"] and
    // :root[data-theme="high-contrast"] overrides (the latter shares the
    // token block with :root[data-hx-contrast="high"], so OS-level
    // forced-colors and the Storybook toolbar reach the same cascade).
    // HELIX_THEME_MODES is the single source of truth — kept in sync
    // with the manager chrome theme map.
    withThemeByDataAttribute({
      themes: Object.fromEntries(HELIX_THEME_MODES.map((m) => [m, m])) as Record<
        (typeof HELIX_THEME_MODES)[number],
        (typeof HELIX_THEME_MODES)[number]
      >,
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),

    // Brand switching via data-brand attribute on <html>. Six reference
    // brands ship with HELiX storybook (Apex default + Meridian, Lumen,
    // Verdant, Signal, Ember). Empty value clears the attribute so the
    // Apex / @helixui/tokens default cascade applies.
    //
    // The brand override stylesheet (`.storybook/docs/brand-overrides.css`)
    // defines `[data-brand="meridian|lumen|verdant|signal|ember"]` rules
    // that swap the primary/secondary primitive ramps; semantic tokens
    // recompute automatically because they reference the ramps via cascade.
    //
    // We also persist the resolved (theme, brand) tuple to localStorage
    // under `helix:storybook:globals` so the FOUC-prevention block in
    // preview-head.html and manager-head.html can apply them BEFORE
    // first paint on subsequent loads.
    (story, ctx) => {
      const brand = (ctx.globals.brand as string) ?? '';
      const theme = (ctx.globals.theme as string) ?? 'light';
      if (typeof document !== 'undefined') {
        if (brand) document.documentElement.setAttribute('data-brand', brand);
        else document.documentElement.removeAttribute('data-brand');
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('helix:storybook:globals', JSON.stringify({ theme, brand }));
        } catch {
          /* storage disabled — the URL globals param remains the source of truth */
        }
      }
      return story();
    },
  ],
};

export default preview;
