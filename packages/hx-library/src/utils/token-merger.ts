import type { BrandTokenMap } from '@helixui/tokens';

/**
 * Merges brand token overrides on top of a base theme CSS string.
 *
 * Brand tokens are appended as a `:host` block after the base theme CSS,
 * which gives them higher cascade precedence within the adopted stylesheet.
 * This preserves all primitive and semantic tokens from the base theme while
 * allowing brand-specific values to override selectively.
 *
 * @param baseCSS - The base theme CSS string (from `_buildThemeCss`).
 * @param brandTokens - CSS custom property overrides for the active brand.
 * @returns Combined CSS string with brand overrides applied after the base theme.
 *
 * @example
 * ```ts
 * const merged = mergeBrandTokens(lightCSS, {
 *   '--hx-color-primary-500': '#003DA5',
 *   '--hx-color-primary-600': '#002D8A',
 * });
 * // merged === lightCSS + "\n\n:host {\n  --hx-color-primary-500: #003DA5;\n  ...}\n"
 * ```
 */
export function mergeBrandTokens(baseCSS: string, brandTokens: BrandTokenMap): string {
  if (Object.keys(brandTokens).length === 0) {
    return baseCSS;
  }

  const brandOverrides = Object.entries(brandTokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');

  return `${baseCSS}\n\n/* Brand token overrides */\n:host {\n${brandOverrides}\n}`;
}
