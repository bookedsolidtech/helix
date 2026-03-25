/**
 * A map of CSS custom property names to their values.
 * Keys must use the --hx- prefix following the HELiX token convention.
 *
 * @example
 * const tokens: BrandTokenMap = {
 *   '--hx-color-primary-500': '#003DA5',
 *   '--hx-color-primary-600': '#002D8A',
 * };
 */
export type BrandTokenMap = Record<string, string>;

/**
 * Result of a brand token validation operation.
 * When `valid` is false, `missingTokens` lists all required tokens
 * that were absent from the submitted token map.
 */
export interface BrandValidationResult {
  valid: boolean;
  missingTokens: string[];
}
