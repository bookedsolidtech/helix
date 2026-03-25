import { type CSSResultOrNative } from 'lit';

/**
 * Merges token CSS custom properties into component styles.
 *
 * Accepts either a single style or an array for each argument and returns
 * a flat merged array suitable for use as `static override styles`.
 *
 * @param componentStyles - The component's own styles
 * @param tokenStyles - Additional token CSS to merge in (e.g. `tokenStyles` from `@helixui/tokens/lit`)
 * @returns Merged styles array
 * @public
 *
 * @example
 * ```ts
 * static override styles = mergeTokenStyles(helixButtonStyles, tokenStyles);
 * ```
 */
export function mergeTokenStyles(
  componentStyles: CSSResultOrNative | CSSResultOrNative[],
  tokenStyles: CSSResultOrNative | CSSResultOrNative[],
): CSSResultOrNative[] {
  const base = Array.isArray(componentStyles) ? componentStyles : [componentStyles];
  const tokens = Array.isArray(tokenStyles) ? tokenStyles : [tokenStyles];
  return [...base, ...tokens];
}
