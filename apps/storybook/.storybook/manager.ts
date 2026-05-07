import { addons } from 'storybook/manager-api';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import { helixChromeThemes, coerceThemeMode, type HelixThemeMode } from './manager-theme';

/**
 * Resolve the active theme mode at manager boot from the same precedence
 * chain the FOUC-prevention block in `preview-head.html` walks (codex P2):
 *
 *   1. URL `globals` param (`?globals=theme:dark;…`) — AUTHORITATIVE when
 *      present. If `globals` is in the URL, missing keys default; we do
 *      not fall through to localStorage. This matches the URL-as-source
 *      contract that round 14 established for the preview iframe.
 *   2. `localStorage["helix:storybook:globals"]` — only consulted when
 *      the URL has NO `globals` parameter.
 *   3. Fallback: 'light'.
 *
 * Without this, manager chrome was hardcoded to `helixLightTheme` at
 * boot regardless of the persisted/URL theme, so reloading on a dark
 * page produced a one-frame chrome flash from light → dark when the
 * GLOBALS_UPDATED listener (registered below) caught up.
 */
function resolveBootThemeMode(): HelixThemeMode {
  if (typeof window === 'undefined') return 'light';

  // 1. URL globals — authoritative when the param is present at all.
  let urlHasGlobals = false;
  let urlTheme = '';
  try {
    const url = new URL(window.location.href);
    urlHasGlobals = url.searchParams.has('globals');
    if (urlHasGlobals) {
      const raw = url.searchParams.get('globals') ?? '';
      for (const pair of raw.split(';')) {
        const idx = pair.indexOf(':');
        if (idx === -1) continue;
        const k = pair.slice(0, idx).trim();
        const v = pair.slice(idx + 1).trim();
        if (k === 'theme') urlTheme = v;
      }
    }
  } catch {
    /* URL parse failure — fall through; treat as no URL hint */
    urlHasGlobals = false;
  }

  if (urlHasGlobals) {
    // URL is the source of truth. Missing/invalid theme key → default.
    return coerceThemeMode(urlTheme || undefined);
  }

  // 2. localStorage shadow maintained by the preview decorator.
  try {
    const raw = window.localStorage.getItem('helix:storybook:globals');
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const theme = (parsed as { theme?: unknown }).theme;
        return coerceThemeMode(theme);
      }
    }
  } catch {
    /* storage disabled or JSON broken — fall through to light */
  }

  // 3. Default.
  return 'light';
}

const bootMode: HelixThemeMode = resolveBootThemeMode();

/**
 * Storybook chrome (manager UI) theming.
 *
 * Three themes are derived from @helixui/tokens at build time and exposed
 * here as `helixLightTheme`, `helixDarkTheme`, `helixHighContrastTheme`.
 * The manager's initial theme matches the preview's `defaultTheme` (light);
 * on every globals update we pluck the current `theme` global (set by
 * `withThemeByDataAttribute`) and re-apply the matching chrome theme via
 * `addons.setConfig({ theme })`.
 *
 * This is the bridge that fixed the bug where switching the preview to
 * dark left the manager UI stuck on light. The previous manager.ts
 * shipped a single hardcoded theme with `colorPrimary: '#2563EB'` —
 * that hex was never a helix colour. The replacement reads
 * `--hx-color-primary-600` (#0F7078 in light, #60A5FA in HC) from the
 * tokens package directly, so brand-colour drift between chrome and
 * canvas is not possible.
 */

/**
 * Sidebar IA — collapsed roots.
 *
 * Engineering-reference roots collapse by default so a fresh visitor
 * reads the editorial story top-down (Overview → Accessibility →
 * Foundations → Patterns → Playground) before the engineering surface
 * unrolls beneath them. Pairs with `options.storySort.order` in
 * `.storybook/preview.ts`.
 *
 * Root IDs are derived from the top-level title segment by
 * Storybook's `sanitize()` helper — lowercased + hyphenated. Mapping:
 *   Components/*       → components
 *   Healthcare/*       → healthcare
 *   Layout/*           → layout       (the standalone root, not Foundations/Layout)
 *   Utilities/*        → utilities
 *   Infrastructure/*   → infrastructure
 *   Drupal/*           → drupal
 *
 * Typed surface: `API_SidebarOptions` (storybook 10.3.6) — confirmed
 * `collapsedRoots: string[]` is the official, supported API.
 */
addons.setConfig({
  theme: helixChromeThemes[bootMode],
  sidebar: {
    collapsedRoots: ['components', 'healthcare', 'layout', 'utilities', 'infrastructure', 'drupal'],
  },
});

let currentMode: HelixThemeMode = bootMode;

addons.register('helix/manager-theme-sync', (api) => {
  const channel = api.getChannel();
  if (!channel) return;

  channel.on(GLOBALS_UPDATED, (event: { globals?: Record<string, unknown> }) => {
    const next = coerceThemeMode(event?.globals?.theme);
    if (next === currentMode) return;
    currentMode = next;
    addons.setConfig({ theme: helixChromeThemes[next] });
  });
});
