import { type CSSResultOrNative } from 'lit';

/**
 * Merges token CSS custom properties into component styles.
 *
 * Accepts either a single style or an array for each argument and returns
 * a flat merged array suitable for use as `static override styles`.
 *
 * @deprecated Use document-level adopted stylesheets instead. Import
 * `'@helixui/library'` (which auto-adopts tokens) or call
 * `ensureDocumentTokens()` directly. Per-component token merging is no
 * longer necessary because tokens are now adopted at the document level
 * and cascade into Shadow DOM via CSS inheritance.
 *
 * @param componentStyles - The component's own styles
 * @param tokenStyles - Additional token CSS to merge in
 * @returns Merged styles array
 * @public
 *
 * @example
 * ```ts
 * // Preferred: tokens are auto-adopted at the document level
 * import '@helixui/library';
 *
 * // Legacy usage (deprecated):
 * static override styles = mergeTokenStyles(myStyles, extraStyles);
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
