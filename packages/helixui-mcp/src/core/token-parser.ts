import { readFileSync, existsSync } from 'node:fs';
import { getConfig } from '../config.js';

// ─── Token Types ──────────────────────────────────────────────────────────────

export interface TokenEntry {
  cssVar: string;
  value: string;
  path: string[];
  tier: 'primitive' | 'semantic' | 'component';
  description?: string;
}

interface TokenLeaf {
  value: string;
  description?: string;
}

interface TokenGroup {
  [key: string]: TokenNode;
}

type TokenNode = TokenLeaf | TokenGroup;

type TokensFile = { [category: string]: TokenGroup };

// ─── Tier Detection ───────────────────────────────────────────────────────────

const PRIMITIVE_CATEGORIES = new Set([
  'color',
  'spacing',
  'size',
  'typography',
  'font',
  'shadow',
  'border',
  'radius',
  'animation',
  'transition',
  'z-index',
]);

function detectTier(path: string[]): 'primitive' | 'semantic' | 'component' {
  const category = path[0];
  if (category === undefined) return 'primitive';
  if (PRIMITIVE_CATEGORIES.has(category)) return 'primitive';
  if (category === 'semantic') return 'semantic';
  return 'component';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTokenLeaf(node: TokenNode): node is TokenLeaf {
  return typeof (node as { value?: unknown }).value === 'string';
}

function flattenNode(
  node: TokenGroup,
  pathSoFar: string[],
  results: TokenEntry[],
): void {
  for (const [key, child] of Object.entries(node)) {
    const currentPath = [...pathSoFar, key];
    if (isTokenLeaf(child)) {
      const cssVar = `--hx-${currentPath.join('-')}`;
      const tier = detectTier(currentPath);
      const entry: TokenEntry = {
        cssVar,
        value: child.value,
        path: currentPath,
        tier,
      };
      if (child.description !== undefined) {
        entry.description = child.description;
      }
      results.push(entry);
    } else {
      flattenNode(child as TokenGroup, currentPath, results);
    }
  }
}

function parseTokensFile(data: TokensFile): TokenEntry[] {
  const results: TokenEntry[] = [];
  for (const [category, group] of Object.entries(data)) {
    if (group !== null && typeof group === 'object') {
      flattenNode(group, [category], results);
    }
  }
  return results;
}

// ─── TokenParser ──────────────────────────────────────────────────────────────

export class TokenParser {
  private readonly tokensPath: string;

  constructor(tokensPath?: string) {
    this.tokensPath = tokensPath ?? getConfig().tokensPath;
  }

  load(): TokenEntry[] {
    if (!existsSync(this.tokensPath)) {
      throw new Error(
        `Tokens file not found at ${this.tokensPath}. Set HELIXUI_MCP_TOKENS_PATH to override.`,
      );
    }
    const data = JSON.parse(readFileSync(this.tokensPath, 'utf8')) as TokensFile;
    return parseTokensFile(data);
  }

  loadSafe(): TokenEntry[] {
    if (!existsSync(this.tokensPath)) {
      return [];
    }
    try {
      const data = JSON.parse(readFileSync(this.tokensPath, 'utf8')) as TokensFile;
      return parseTokensFile(data);
    } catch {
      return [];
    }
  }

  find(query: string): TokenEntry[] {
    const q = query.toLowerCase();
    return this.load().filter((t) => t.cssVar.toLowerCase().includes(q));
  }

  getByTier(tier: 'primitive' | 'semantic' | 'component'): TokenEntry[] {
    return this.load().filter((t) => t.tier === tier);
  }

  getByCategory(category: string): TokenEntry[] {
    return this.load().filter((t) => t.path[0] === category);
  }

  getCategories(): string[] {
    const tokens = this.load();
    const seen = new Set<string>();
    for (const t of tokens) {
      const cat = t.path[0];
      if (cat !== undefined) seen.add(cat);
    }
    return Array.from(seen);
  }
}
