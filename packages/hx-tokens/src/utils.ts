import type { TokenEntry } from './types.js';

/** Filter tokens by CSS custom property prefix */
export function getTokensByPrefix(tokens: TokenEntry[], prefix: string): TokenEntry[] {
  return tokens.filter((t) => t.name.startsWith(prefix));
}

/** Group color tokens into subgroups (primary, neutral, error, etc.) */
export function getColorSubgroups(tokens: TokenEntry[]): { label: string; tokens: TokenEntry[] }[] {
  const colorTokens = tokens.filter((t) => t.category === 'color');
  const subgroupMap = new Map<string, TokenEntry[]>();

  for (const token of colorTokens) {
    const group = token.path[1] ?? 'default';
    const existing = subgroupMap.get(group);
    if (existing) {
      existing.push(token);
    } else {
      subgroupMap.set(group, [token]);
    }
  }

  return Array.from(subgroupMap.entries()).map(([label, toks]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    tokens: toks,
  }));
}

/** Get summary statistics about a token set */
export function getTokenStats(tokens: TokenEntry[]): {
  total: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  for (const token of tokens) {
    byCategory[token.category] = (byCategory[token.category] ?? 0) + 1;
  }
  return { total: tokens.length, byCategory };
}

/** Check if a value looks like a hex color */
export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(value.trim());
}

/** Resolve a token value that may contain var() references to its underlying raw value */
export function resolveTokenRef(
  value: string,
  tokenMap: Record<string, string>,
  maxDepth = 5,
): string {
  let resolved = value;
  for (let i = 0; i < maxDepth; i++) {
    const match = resolved.match(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/);
    if (!match) break;
    const [fullMatch, varName, fallback] = match;
    const replacement = (varName ? tokenMap[varName] : undefined) ?? fallback?.trim() ?? fullMatch;
    resolved = resolved.replace(fullMatch, replacement);
  }
  return resolved;
}

/** Get a contrasting text color (black or white) for a given hex background */
export function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
