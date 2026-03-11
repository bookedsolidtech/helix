/**
 * Token API — Shared response builder for /api/tokens endpoints.
 *
 * Builds enriched token payloads by combining the raw @helixui/tokens data
 * with resolved color values and contrast information. Used by both the
 * main /api/tokens route and the per-category /api/tokens/[category] route.
 */
import { tokenEntries, darkTokenEntries, tokensByCategory, tokenMap } from '@helixui/tokens';
import type { TokenEntry } from '@helixui/tokens';
import {
  getTokenStats,
  isHexColor,
  resolveTokenRef,
  getColorSubgroups,
  getContrastColor,
} from '@helixui/tokens/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenMeta {
  totalTokens: number;
  categories: string[];
  generatedAt: string;
  prefix: '--hx-';
}

export interface TokenStats {
  total: number;
  byCategory: Record<string, number>;
}

export interface TokenResponse {
  meta: TokenMeta;
  tokens: TokenEntry[];
  dark: TokenEntry[];
  byCategory: Record<string, TokenEntry[]>;
  stats: TokenStats;
}

export interface EnrichedColorToken extends TokenEntry {
  resolvedValue: string;
  contrastColor: string;
}

export interface ColorSubgroup {
  label: string;
  tokens: EnrichedColorToken[];
}

export interface ColorCategoryResponse {
  category: 'color';
  tokens: EnrichedColorToken[];
  subgroups: ColorSubgroup[];
  stats: TokenStats;
}

export interface GenericCategoryResponse {
  category: string;
  tokens: TokenEntry[];
  stats: TokenStats;
}

export type CategoryResponse = ColorCategoryResponse | GenericCategoryResponse;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Enrich a color token with its fully-resolved hex value and a
 * contrasting foreground color suitable for text overlays.
 */
function enrichColorToken(entry: TokenEntry): EnrichedColorToken {
  const resolvedValue = resolveTokenRef(entry.value, tokenMap);
  const contrastColor = isHexColor(resolvedValue) ? getContrastColor(resolvedValue) : '#000000';

  return {
    ...entry,
    resolvedValue,
    contrastColor,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the full token response payload returned by GET /api/tokens.
 */
export function buildTokenResponse(): TokenResponse {
  const categories = Object.keys(tokensByCategory);
  const stats = getTokenStats(tokenEntries);

  return {
    meta: {
      totalTokens: tokenEntries.length,
      categories,
      generatedAt: new Date().toISOString(),
      prefix: '--hx-',
    },
    tokens: tokenEntries,
    dark: darkTokenEntries,
    byCategory: tokensByCategory,
    stats,
  };
}

/**
 * Build an enriched response for a single token category.
 *
 * Color tokens receive additional `resolvedValue` and `contrastColor`
 * fields. All other categories return the raw TokenEntry data.
 *
 * Returns `null` if the requested category does not exist.
 */
export function buildCategoryResponse(category: string): CategoryResponse | null {
  const categoryTokens = tokensByCategory[category];

  if (!categoryTokens) {
    return null;
  }

  const stats = getTokenStats(categoryTokens);

  if (category === 'color') {
    const enrichedTokens = categoryTokens.map(enrichColorToken);
    const rawSubgroups = getColorSubgroups(categoryTokens);

    const subgroups: ColorSubgroup[] = rawSubgroups.map((sg) => ({
      label: sg.label,
      tokens: sg.tokens.map(enrichColorToken),
    }));

    return {
      category: 'color',
      tokens: enrichedTokens,
      subgroups,
      stats,
    };
  }

  return {
    category,
    tokens: categoryTokens,
    stats,
  };
}
