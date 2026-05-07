import { addons } from 'storybook/manager-api';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';
import {
  helixChromeThemes,
  helixLightTheme,
  coerceThemeMode,
  type HelixThemeMode,
} from './manager-theme';

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

addons.setConfig({
  theme: helixLightTheme,
});

let currentMode: HelixThemeMode = 'light';

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
