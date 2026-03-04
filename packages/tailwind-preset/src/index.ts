/**
 * @helixds/tailwind-preset
 *
 * Tailwind CSS v3 preset that maps Helix Design System tokens to utility
 * classes via CSS custom property references. All values resolve at runtime,
 * so consumers get full theming support by overriding `--hx-*` variables.
 *
 * Dark mode is activated with `data-theme="dark"` on any ancestor element
 * (typically `<html>` or `<body>`).
 *
 * Usage:
 *   // tailwind.config.ts
 *   import helixPreset from '@helixds/tailwind-preset';
 *   export default { presets: [helixPreset] };
 */

import type { Config } from 'tailwindcss';

// ---------------------------------------------------------------------------
// Internal type aliases
// ---------------------------------------------------------------------------

/** A flat or nested map of string keys to string CSS values. */
type TokenMap = Record<string, string>;

/** A nested color palette where each palette entry is a scale of token maps. */
type ColorPalette = Record<string, TokenMap | string>;

// ---------------------------------------------------------------------------
// Helper: produce a CSS var() reference string
// ---------------------------------------------------------------------------
function ref(token: string): string {
  return `var(${token})`;
}

// ---------------------------------------------------------------------------
// Colors
// Color scales reference `--hx-color-<name>-<step>` custom properties.
// Semantic aliases (text, surface, border) also map to their CSS vars so
// that the same dark-mode override mechanism applies automatically.
// ---------------------------------------------------------------------------

function colorScale(name: string, steps: number[]): TokenMap {
  return Object.fromEntries(steps.map((step) => [String(step), ref(`--hx-color-${name}-${step}`)]));
}

const colorSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const colors = {
  // Semantic palette scales
  primary: colorScale('primary', [...colorSteps]),
  secondary: colorScale('secondary', [...colorSteps]),
  accent: colorScale('accent', [...colorSteps]),
  neutral: {
    ...colorScale('neutral', [...colorSteps]),
    // neutral-0 is #FFFFFF — exposed as the base white step
    0: ref('--hx-color-neutral-0'),
  },
  success: colorScale('success', [...colorSteps]),
  warning: colorScale('warning', [...colorSteps]),
  error: colorScale('error', [...colorSteps]),
  info: colorScale('info', [...colorSteps]),

  // Semantic text aliases — consumers can use text-hx-text-primary etc.
  'hx-text': {
    primary: ref('--hx-color-text-primary'),
    secondary: ref('--hx-color-text-secondary'),
    muted: ref('--hx-color-text-muted'),
    disabled: ref('--hx-color-text-disabled'),
    inverse: ref('--hx-color-text-inverse'),
    'on-primary': ref('--hx-color-text-on-primary'),
    'on-secondary': ref('--hx-color-text-on-secondary'),
    'on-error': ref('--hx-color-text-on-error'),
    'on-success': ref('--hx-color-text-on-success'),
    'on-warning': ref('--hx-color-text-on-warning'),
    'on-info': ref('--hx-color-text-on-info'),
    link: ref('--hx-color-text-link'),
    'link-hover': ref('--hx-color-text-link-hover'),
    'link-visited': ref('--hx-color-text-link-visited'),
    'link-active': ref('--hx-color-text-link-active'),
  },

  // Semantic surface aliases
  'hx-surface': {
    default: ref('--hx-color-surface-default'),
    raised: ref('--hx-color-surface-raised'),
    sunken: ref('--hx-color-surface-sunken'),
    overlay: ref('--hx-color-surface-overlay'),
  },

  // Semantic border aliases
  'hx-border': {
    default: ref('--hx-color-border-default'),
    subtle: ref('--hx-color-border-subtle'),
    strong: ref('--hx-color-border-strong'),
    focus: ref('--hx-color-border-focus'),
  },

  // Focus ring colour — usable as ring-hx-focus-ring
  'hx-focus-ring': ref('--hx-color-focus-ring'),

  // Selection colours
  'hx-selection': {
    bg: ref('--hx-color-selection-bg'),
    color: ref('--hx-color-selection-color'),
  },
} satisfies ColorPalette;

// ---------------------------------------------------------------------------
// Spacing
// Maps `--hx-space-<key>` for every step present in tokens.json.
// ---------------------------------------------------------------------------

const spacing: Record<string, string> = {
  0: ref('--hx-space-0'),
  px: ref('--hx-space-px'),
  1: ref('--hx-space-1'),
  2: ref('--hx-space-2'),
  3: ref('--hx-space-3'),
  4: ref('--hx-space-4'),
  5: ref('--hx-space-5'),
  6: ref('--hx-space-6'),
  7: ref('--hx-space-7'),
  8: ref('--hx-space-8'),
  10: ref('--hx-space-10'),
  12: ref('--hx-space-12'),
  14: ref('--hx-space-14'),
  16: ref('--hx-space-16'),
  20: ref('--hx-space-20'),
  24: ref('--hx-space-24'),
  32: ref('--hx-space-32'),
  40: ref('--hx-space-40'),
  48: ref('--hx-space-48'),
  64: ref('--hx-space-64'),
};

// ---------------------------------------------------------------------------
// Font family
// ---------------------------------------------------------------------------

const fontFamily: Record<string, string[]> = {
  sans: [ref('--hx-font-family-sans')],
  serif: [ref('--hx-font-family-serif')],
  mono: [ref('--hx-font-family-mono')],
};

// ---------------------------------------------------------------------------
// Font size
// Tailwind v3 accepts a tuple [size, lineHeight] or a plain string.
// We supply just the size; line-height is mapped separately via lineHeight.
// ---------------------------------------------------------------------------

const fontSize: Record<string, string> = {
  '2xs': ref('--hx-font-size-2xs'),
  xs: ref('--hx-font-size-xs'),
  sm: ref('--hx-font-size-sm'),
  md: ref('--hx-font-size-md'),
  base: ref('--hx-font-size-md'), // alias for Tailwind users expecting "base"
  lg: ref('--hx-font-size-lg'),
  xl: ref('--hx-font-size-xl'),
  '2xl': ref('--hx-font-size-2xl'),
  '3xl': ref('--hx-font-size-3xl'),
  '4xl': ref('--hx-font-size-4xl'),
  '5xl': ref('--hx-font-size-5xl'),
};

// ---------------------------------------------------------------------------
// Font weight
// ---------------------------------------------------------------------------

const fontWeight: Record<string, string> = {
  light: ref('--hx-font-weight-light'),
  normal: ref('--hx-font-weight-normal'),
  medium: ref('--hx-font-weight-medium'),
  semibold: ref('--hx-font-weight-semibold'),
  bold: ref('--hx-font-weight-bold'),
  extrabold: ref('--hx-font-weight-extrabold'),
};

// ---------------------------------------------------------------------------
// Line height
// ---------------------------------------------------------------------------

const lineHeight: Record<string, string> = {
  tighter: ref('--hx-line-height-tighter'),
  tight: ref('--hx-line-height-tight'),
  normal: ref('--hx-line-height-normal'),
  relaxed: ref('--hx-line-height-relaxed'),
  loose: ref('--hx-line-height-loose'),
};

// ---------------------------------------------------------------------------
// Letter spacing
// ---------------------------------------------------------------------------

const letterSpacing: Record<string, string> = {
  tighter: ref('--hx-letter-spacing-tighter'),
  tight: ref('--hx-letter-spacing-tight'),
  normal: ref('--hx-letter-spacing-normal'),
  wide: ref('--hx-letter-spacing-wide'),
  wider: ref('--hx-letter-spacing-wider'),
  widest: ref('--hx-letter-spacing-widest'),
};

// ---------------------------------------------------------------------------
// Box shadow
// ---------------------------------------------------------------------------

const boxShadow: Record<string, string> = {
  sm: ref('--hx-shadow-sm'),
  md: ref('--hx-shadow-md'),
  DEFAULT: ref('--hx-shadow-md'),
  lg: ref('--hx-shadow-lg'),
  xl: ref('--hx-shadow-xl'),
  '2xl': ref('--hx-shadow-2xl'),
  inner: ref('--hx-shadow-inner'),
  none: ref('--hx-shadow-none'),
};

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------

const borderRadius: Record<string, string> = {
  none: ref('--hx-border-radius-none'),
  sm: ref('--hx-border-radius-sm'),
  DEFAULT: ref('--hx-border-radius-md'),
  md: ref('--hx-border-radius-md'),
  lg: ref('--hx-border-radius-lg'),
  xl: ref('--hx-border-radius-xl'),
  '2xl': ref('--hx-border-radius-2xl'),
  full: ref('--hx-border-radius-full'),
};

// ---------------------------------------------------------------------------
// Border width
// ---------------------------------------------------------------------------

const borderWidth: Record<string, string> = {
  thin: ref('--hx-border-width-thin'),
  medium: ref('--hx-border-width-medium'),
  thick: ref('--hx-border-width-thick'),
  DEFAULT: ref('--hx-border-width-thin'),
};

// ---------------------------------------------------------------------------
// Opacity
// ---------------------------------------------------------------------------

const opacity: Record<string, string> = {
  0: ref('--hx-opacity-0'),
  5: ref('--hx-opacity-5'),
  10: ref('--hx-opacity-10'),
  25: ref('--hx-opacity-25'),
  50: ref('--hx-opacity-50'),
  75: ref('--hx-opacity-75'),
  90: ref('--hx-opacity-90'),
  100: ref('--hx-opacity-100'),
  disabled: ref('--hx-opacity-disabled'),
  overlay: ref('--hx-opacity-overlay'),
};

// ---------------------------------------------------------------------------
// Z-index
// ---------------------------------------------------------------------------

const zIndex: Record<string, string> = {
  base: ref('--hx-z-index-base'),
  dropdown: ref('--hx-z-index-dropdown'),
  sticky: ref('--hx-z-index-sticky'),
  fixed: ref('--hx-z-index-fixed'),
  backdrop: ref('--hx-z-index-backdrop'),
  modal: ref('--hx-z-index-modal'),
  popover: ref('--hx-z-index-popover'),
  tooltip: ref('--hx-z-index-tooltip'),
  toast: ref('--hx-z-index-toast'),
};

// ---------------------------------------------------------------------------
// Transition duration
// ---------------------------------------------------------------------------

const transitionDuration: Record<string, string> = {
  instant: ref('--hx-duration-instant'),
  fast: ref('--hx-duration-fast'),
  normal: ref('--hx-duration-normal'),
  slow: ref('--hx-duration-slow'),
  slower: ref('--hx-duration-slower'),
};

// ---------------------------------------------------------------------------
// Transition timing function (easing)
// ---------------------------------------------------------------------------

const transitionTimingFunction: Record<string, string> = {
  DEFAULT: ref('--hx-easing-default'),
  in: ref('--hx-easing-in'),
  out: ref('--hx-easing-out'),
  'in-out': ref('--hx-easing-in-out'),
  spring: ref('--hx-easing-spring'),
};

// ---------------------------------------------------------------------------
// Screens (breakpoints)
// ---------------------------------------------------------------------------

const screens: Record<string, string> = {
  sm: ref('--hx-breakpoint-sm'),
  md: ref('--hx-breakpoint-md'),
  lg: ref('--hx-breakpoint-lg'),
  xl: ref('--hx-breakpoint-xl'),
  '2xl': ref('--hx-breakpoint-2xl'),
};

// ---------------------------------------------------------------------------
// Preset definition
// ---------------------------------------------------------------------------

/**
 * Helix Design System Tailwind CSS v3 preset.
 *
 * Add to your `tailwind.config.ts`:
 * ```ts
 * import helixPreset from '@helixds/tailwind-preset';
 * export default { presets: [helixPreset] };
 * ```
 */
const helixPreset: Partial<Config> = {
  /**
   * Dark mode: activated via `data-theme="dark"` attribute on any ancestor.
   * This matches the Helix CSS variable dark-mode strategy where `:root[data-theme="dark"]`
   * overrides semantic token values, and Tailwind's `dark:` variant activates accordingly.
   */
  darkMode: ['selector', '[data-theme="dark"]'],

  theme: {
    extend: {
      colors,
      spacing,
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      boxShadow,
      borderRadius,
      borderWidth,
      opacity,
      zIndex,
      transitionDuration,
      transitionTimingFunction,
      screens,
    },
  },
};

export default helixPreset;
