import tokensJson from './tokens.json';
import type { TokenDefinition, TokenEntry } from './types.js';

export type { TokenDefinition, TokenEntry } from './types.js';

function isTokenDefinition(obj: unknown): obj is TokenDefinition {
  return typeof obj === 'object' && obj !== null && 'value' in obj;
}

function flattenTokens(obj: Record<string, unknown>, prefix: string[] = []): TokenEntry[] {
  const entries: TokenEntry[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const path = [...prefix, key];

    if (isTokenDefinition(val)) {
      const def = val as TokenDefinition;
      entries.push({
        name: `--hx-${path.join('-')}`,
        value: def.value,
        category: path[0],
        group: path.length > 2 ? path.slice(1, -1).join('-') : path[0],
        key: path[path.length - 1],
        path,
        description: def.description,
      });
    } else if (typeof val === 'object' && val !== null) {
      entries.push(...flattenTokens(val as Record<string, unknown>, path));
    }
  }

  return entries;
}

function groupBy(entries: TokenEntry[], field: keyof TokenEntry): Record<string, TokenEntry[]> {
  const result: Record<string, TokenEntry[]> = {};
  for (const entry of entries) {
    const key = entry[field] as string;
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(entry);
  }
  return result;
}

/** The raw token JSON source of truth */
export const tokens = tokensJson;

/** Light-mode tokens (excludes the "dark" key) */
const { dark: darkJson, ...lightJson } = tokensJson as Record<string, unknown>;

/** Flattened array of all light-mode token entries with metadata */
export const tokenEntries: TokenEntry[] = flattenTokens(lightJson);

/** Flattened array of dark-mode override entries */
export const darkTokenEntries: TokenEntry[] = darkJson
  ? flattenTokens(darkJson as Record<string, unknown>)
  : [];

/** Token entries grouped by top-level category */
export const tokensByCategory: Record<string, TokenEntry[]> = groupBy(tokenEntries, 'category');

/** Quick lookup: token name -> value */
export const tokenMap: Record<string, string> = Object.fromEntries(
  tokenEntries.map((t) => [t.name, t.value]),
);
