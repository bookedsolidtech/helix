import type { BrandTokenMap, BrandValidationResult } from './types/brand.js';

/**
 * The minimum set of semantic token names a brand definition must supply.
 * These cover the primary and secondary color ramps — the tokens most likely
 * to differ between hospital system white-label implementations.
 *
 * All other HELiX tokens inherit their values from the base theme; a brand
 * only needs to override what makes it visually distinct.
 *
 * Token names follow the `--hx-color-<scale>-<shade>` convention defined in
 * `packages/hx-tokens/src/tokens.json`.
 */
export const REQUIRED_SEMANTIC_TOKENS: readonly string[] = [
  // Primary color ramp — used for interactive elements, focus rings, links
  '--hx-color-primary-50',
  '--hx-color-primary-100',
  '--hx-color-primary-200',
  '--hx-color-primary-300',
  '--hx-color-primary-400',
  '--hx-color-primary-500',
  '--hx-color-primary-600',
  '--hx-color-primary-700',
  '--hx-color-primary-800',
  '--hx-color-primary-900',
  '--hx-color-primary-950',
  // Secondary color ramp — used for accents, visited links, secondary actions
  '--hx-color-secondary-50',
  '--hx-color-secondary-100',
  '--hx-color-secondary-200',
  '--hx-color-secondary-300',
  '--hx-color-secondary-400',
  '--hx-color-secondary-500',
  '--hx-color-secondary-600',
  '--hx-color-secondary-700',
  '--hx-color-secondary-800',
  '--hx-color-secondary-900',
  '--hx-color-secondary-950',
] as const;

/**
 * Registry that manages named brand token sets for white-label hospital system
 * implementations. Brands are registered once at application bootstrap and then
 * applied by setting the `brand` attribute on `<hx-theme>`.
 *
 * This is a singleton — import and use the exported `HelixBrandRegistry` instance
 * directly; do not construct new instances.
 *
 * @example Bootstrap registration
 * ```ts
 * import { HelixBrandRegistry } from '@helixui/tokens';
 *
 * HelixBrandRegistry.register('mercy-health', {
 *   '--hx-color-primary-500': '#003DA5',
 *   '--hx-color-primary-600': '#002D8A',
 *   // ... all REQUIRED_SEMANTIC_TOKENS
 * });
 * ```
 *
 * @example Applying via hx-theme
 * ```html
 * <hx-theme brand="mercy-health">
 *   <!-- All content inherits Mercy Health brand tokens -->
 * </hx-theme>
 * ```
 */
export class HelixBrandRegistryClass {
  /** @internal */
  private readonly _brands = new Map<string, BrandTokenMap>();

  /**
   * Registers a named brand token set. If a brand with the same name is already
   * registered, the new token map replaces it (last write wins).
   *
   * @param brandName - Unique identifier for the brand (e.g. `'mercy-health'`).
   * @param tokens - Map of CSS custom property names to values. Must include all
   *   tokens listed in `REQUIRED_SEMANTIC_TOKENS`. Keys must be non-empty strings;
   *   values must be non-empty strings.
   * @throws {Error} When required tokens are missing or when any token name or
   *   value is an empty string.
   *
   * @example
   * ```ts
   * HelixBrandRegistry.register('lakeside-medical', {
   *   '--hx-color-primary-500': '#007878',
   *   // ... remaining required tokens
   * });
   * ```
   */
  register(brandName: string, tokens: BrandTokenMap): void {
    if (!brandName || brandName.trim() === '') {
      throw new Error('[HelixBrandRegistry] Brand name must be a non-empty string.');
    }

    const result = this.validateTokens(tokens);

    if (!result.valid) {
      throw new Error(
        `[HelixBrandRegistry] Brand "${brandName}" is missing required semantic tokens:\n` +
          result.missingTokens.map((t) => `  - ${t}`).join('\n') +
          '\n\nAll tokens listed in REQUIRED_SEMANTIC_TOKENS must be provided.',
      );
    }

    this._brands.set(brandName, { ...tokens });
  }

  /**
   * Retrieves the token map for a registered brand.
   *
   * @param brandName - The brand identifier to look up.
   * @returns The token map, or `undefined` if the brand is not registered.
   */
  getBrandTokens(brandName: string): BrandTokenMap | undefined {
    const tokens = this._brands.get(brandName);
    return tokens !== undefined ? { ...tokens } : undefined;
  }

  /**
   * Returns `true` if a brand with the given name has been registered.
   *
   * @param brandName - The brand identifier to check.
   */
  isRegistered(brandName: string): boolean {
    return this._brands.has(brandName);
  }

  /**
   * Validates a token map against the required semantic token list.
   * Does not throw — use the returned result for programmatic checks.
   *
   * @param tokens - The token map to validate.
   * @returns A `BrandValidationResult` with `valid` and `missingTokens`.
   */
  validateTokens(tokens: BrandTokenMap): BrandValidationResult {
    const missingTokens: string[] = [];

    for (const required of REQUIRED_SEMANTIC_TOKENS) {
      const value = tokens[required];
      if (value === undefined || value === null || value.trim() === '') {
        missingTokens.push(required);
      }
    }

    return {
      valid: missingTokens.length === 0,
      missingTokens,
    };
  }

  /**
   * Removes all registered brands. Primarily useful in tests.
   * @internal
   */
  _clear(): void {
    this._brands.clear();
  }
}

/**
 * Singleton instance of the brand registry.
 * Import this directly — do not construct `HelixBrandRegistryClass` manually.
 *
 * @example
 * ```ts
 * import { HelixBrandRegistry } from '@helixui/tokens';
 * HelixBrandRegistry.register('my-brand', { ... });
 * ```
 */
export const HelixBrandRegistry = new HelixBrandRegistryClass();
