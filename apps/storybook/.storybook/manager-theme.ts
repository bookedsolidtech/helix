/**
 * Storybook manager + preview theme bridge.
 *
 * Single source of truth for the three helix theme modes (light, dark,
 * high-contrast) + the resolved hex values used by:
 *
 *  - `preview.ts` parameters.backgrounds  (per-mode surface tints)
 *  - `manager.ts`                          (Storybook chrome `create()` themes)
 *  - addon-themes preview decorator        (data-theme attribute)
 *
 * Token values are pulled at build time from @helixui/tokens (whose JSON
 * source is the load-bearing artifact). Var() chains are walked to a
 * concrete hex via `resolveTokenRef`, so anything that resolves to a
 * primitive ramp value lands as a real color in Storybook's theme keys
 * (Storybook's `create()` does not understand CSS custom properties).
 *
 * The hardcoded `colorPrimary: '#2563EB'` from the previous manager.ts
 * was wrong — helix's primary-600 resolves to `#0F7078`. This module
 * makes that drift impossible by sourcing from the package.
 */

import { tokenEntries, darkTokenEntries, highContrastTokenEntries } from '@helixui/tokens';
import { resolveTokenRef } from '@helixui/tokens/utils';
import { create, type ThemeVars } from 'storybook/theming';

export const HELIX_THEME_MODES = ['light', 'dark', 'high-contrast'] as const;
export type HelixThemeMode = (typeof HELIX_THEME_MODES)[number];

/** Light-mode token map: name → resolved value (hex, rgba, etc). */
const lightMap: Record<string, string> = Object.fromEntries(
  tokenEntries.map((t) => [t.name, t.value]),
);

/** Per-mode override maps, layered on top of `lightMap`. */
const darkOverrides: Record<string, string> = Object.fromEntries(
  darkTokenEntries.map((t) => [t.name, t.value]),
);
const highContrastOverrides: Record<string, string> = Object.fromEntries(
  highContrastTokenEntries.map((t) => [t.name, t.value]),
);

/**
 * Build the effective token map for a given mode. Light is the base; dark
 * and high-contrast layer their overrides on top, then every entry's value
 * is walked through `resolveTokenRef` so var() chains collapse to a concrete
 * primitive (or back to the original string if a chain ends up unresolved).
 */
function tokenMapForMode(mode: HelixThemeMode): Record<string, string> {
  const layered: Record<string, string> = { ...lightMap };
  if (mode === 'dark') Object.assign(layered, darkOverrides);
  if (mode === 'high-contrast') Object.assign(layered, highContrastOverrides);

  // Resolve every var() reference. Two passes are enough for helix's
  // semantic → primitive cascade (semantic tier never references another
  // semantic that itself references a third semantic).
  const resolved: Record<string, string> = {};
  for (const [name, value] of Object.entries(layered)) {
    resolved[name] = resolveTokenRef(value, layered);
  }
  return resolved;
}

const tokenMaps: Record<HelixThemeMode, Record<string, string>> = {
  light: tokenMapForMode('light'),
  dark: tokenMapForMode('dark'),
  'high-contrast': tokenMapForMode('high-contrast'),
};

/**
 * Read a resolved token, falling back if missing. Storybook's `create()` will
 * accept any string, so unresolved fallbacks degrade gracefully but should be
 * loud during development.
 */
function token(mode: HelixThemeMode, name: string, fallback: string): string {
  const v = tokenMaps[mode][name];
  if (!v) return fallback;
  // If the cascade ended at a `var(...)` — an unresolved reference — fall
  // back rather than feed an unparseable value to Storybook's chrome.
  if (v.startsWith('var(')) return fallback;
  return v;
}

/**
 * Per-mode background palette for `parameters.backgrounds`. Each mode
 * contributes three keys (default/raised/sunken) suffixed with the mode
 * name so the picker shows all 9 entries flat. Story authors who want
 * theme-tracking backgrounds should use the unsuffixed name on the
 * matching theme; this map exposes them all so cross-mode visual debug
 * is one click away.
 */
export function helixBackgroundsForMode(
  mode: HelixThemeMode,
): Record<string, { name: string; value: string }> {
  const def = token(mode, '--hx-color-surface-default', '#ffffff');
  const raised = token(mode, '--hx-color-surface-raised', '#f8f9fa');
  const sunken = token(mode, '--hx-color-surface-sunken', '#f1f3f5');
  return {
    [`surface-default-${mode}`]: {
      name: `surface.default · ${mode}`,
      value: def,
    },
    [`surface-raised-${mode}`]: {
      name: `surface.raised · ${mode}`,
      value: raised,
    },
    [`surface-sunken-${mode}`]: {
      name: `surface.sunken · ${mode}`,
      value: sunken,
    },
  };
}

/**
 * Build a Storybook chrome theme for the given helix mode. Each key is
 * mapped from a semantic token; primitive ramps act as fallbacks for the
 * keys Storybook needs that helix does not yet have a semantic name for
 * (toolbar selected color, for example).
 */
function buildHelixChromeTheme(mode: HelixThemeMode): ThemeVars {
  const isLight = mode === 'light';
  const surfaceDefault = token(mode, '--hx-color-surface-default', '#ffffff');
  const surfaceRaised = token(mode, '--hx-color-surface-raised', '#f8f9fa');
  const surfaceSunken = token(mode, '--hx-color-surface-sunken', '#f1f3f5');
  const textPrimary = token(mode, '--hx-color-text-primary', '#0d1825');
  const textInverse = token(mode, '--hx-color-text-inverse', '#ffffff');
  const textMuted = token(mode, '--hx-color-text-muted', '#6c757d');
  const borderDefault = token(mode, '--hx-color-border-default', '#dee2e6');
  // primary-600 is the canonical helix brand colour; in dark/HC modes the
  // semantic --hx-color-primary-600 is overridden, so reading it directly
  // gives the correct per-mode brand value (#0F7078 in light, #60A5FA in HC).
  const primary = token(mode, '--hx-color-primary-600', '#0F7078');
  const secondary = token(mode, '--hx-color-secondary-600', '#0F6B7E');

  return create({
    base: isLight ? 'light' : 'dark',

    // Brand
    brandTitle: 'HELIX Design System',
    brandUrl: '/',

    // Colors
    colorPrimary: primary,
    colorSecondary: secondary,

    // UI
    appBg: surfaceRaised,
    appContentBg: surfaceDefault,
    appPreviewBg: surfaceDefault,
    appBorderColor: borderDefault,
    appBorderRadius: 6,

    // Text
    textColor: textPrimary,
    textInverseColor: textInverse,
    textMutedColor: textMuted,

    // Toolbar
    barTextColor: textMuted,
    barSelectedColor: primary,
    barHoverColor: primary,
    barBg: surfaceSunken,

    // Inputs
    inputBg: surfaceDefault,
    inputBorder: borderDefault,
    inputTextColor: textPrimary,
    inputBorderRadius: 4,
  });
}

export const helixLightTheme = buildHelixChromeTheme('light');
export const helixDarkTheme = buildHelixChromeTheme('dark');
export const helixHighContrastTheme = buildHelixChromeTheme('high-contrast');

export const helixChromeThemes: Record<HelixThemeMode, ThemeVars> = {
  light: helixLightTheme,
  dark: helixDarkTheme,
  'high-contrast': helixHighContrastTheme,
};

/** Coerce an unknown theme global into a valid HelixThemeMode. */
export function coerceThemeMode(value: unknown): HelixThemeMode {
  if (typeof value === 'string' && (HELIX_THEME_MODES as readonly string[]).includes(value)) {
    return value as HelixThemeMode;
  }
  return 'light';
}
