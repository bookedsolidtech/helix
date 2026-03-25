import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { TokenParser } from './token-parser.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXTURE_TOKENS = {
  color: {
    primary: {
      '50': { value: '#EFF6FF' },
      '500': { value: '#2563EB' },
      '900': { value: '#1E3A8A' },
    },
    neutral: {
      '0': { value: '#FFFFFF' },
      '900': { value: '#111827' },
    },
  },
  spacing: {
    xs: { value: '0.25rem' },
    sm: { value: '0.5rem' },
    md: { value: '1rem' },
    lg: { value: '1.5rem' },
  },
  semantic: {
    'color-primary': { value: 'var(--hx-color-primary-500)' },
    'color-surface': { value: 'var(--hx-color-neutral-0)' },
  },
  button: {
    bg: { value: 'var(--hx-color-primary-500)' },
    'text-color': { value: '#FFFFFF' },
  },
};

// ─── Test Setup ───────────────────────────────────────────────────────────────

let tempFilePath: string | null = null;

function writeTempTokens(data: unknown): string {
  const filePath = join(tmpdir(), `token-parser-test-${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(data), 'utf8');
  tempFilePath = filePath;
  return filePath;
}

afterEach(() => {
  if (tempFilePath && existsSync(tempFilePath)) {
    unlinkSync(tempFilePath);
  }
  tempFilePath = null;
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TokenParser', () => {
  describe('load()', () => {
    it('flattens nested tokens to TokenEntry array', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const tokens = parser.load();
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('produces correct cssVar names', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const tokens = parser.load();
      const cssVars = tokens.map((t) => t.cssVar);
      expect(cssVars).toContain('--hx-color-primary-50');
      expect(cssVars).toContain('--hx-color-primary-500');
      expect(cssVars).toContain('--hx-spacing-xs');
      expect(cssVars).toContain('--hx-semantic-color-primary');
      expect(cssVars).toContain('--hx-button-bg');
    });

    it('produces correct values', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const tokens = parser.load();
      const primary500 = tokens.find((t) => t.cssVar === '--hx-color-primary-500');
      expect(primary500?.value).toBe('#2563EB');
    });

    it('produces correct paths', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const tokens = parser.load();
      const primary500 = tokens.find((t) => t.cssVar === '--hx-color-primary-500');
      expect(primary500?.path).toEqual(['color', 'primary', '500']);
    });

    it('throws when file is missing', () => {
      const parser = new TokenParser('/nonexistent/path/tokens.json');
      expect(() => parser.load()).toThrow('Tokens file not found');
    });
  });

  describe('loadSafe()', () => {
    it('returns token entries for a valid file', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const tokens = parser.loadSafe();
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('returns empty array when file is missing', () => {
      const parser = new TokenParser('/nonexistent/path/tokens.json');
      const result = parser.loadSafe();
      expect(result).toEqual([]);
    });
  });

  describe('find()', () => {
    it('returns tokens matching query (case-insensitive)', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const results = parser.find('primary');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((t) => t.cssVar.toLowerCase().includes('primary'))).toBe(true);
    });

    it('returns empty array for no matches', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const results = parser.find('zzznomatch');
      expect(results).toEqual([]);
    });

    it('matches case-insensitively', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const lower = parser.find('spacing');
      const upper = parser.find('SPACING');
      expect(lower.length).toBe(upper.length);
    });
  });

  describe('getByTier()', () => {
    it('returns primitive tokens for color and spacing', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const primitives = parser.getByTier('primitive');
      expect(primitives.length).toBeGreaterThan(0);
      expect(primitives.every((t) => t.tier === 'primitive')).toBe(true);
      // color and spacing are primitive categories
      const categories = new Set(primitives.map((t) => t.path[0]));
      expect(categories.has('color')).toBe(true);
      expect(categories.has('spacing')).toBe(true);
    });

    it('returns semantic tokens for semantic category', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const semantics = parser.getByTier('semantic');
      expect(semantics.length).toBeGreaterThan(0);
      expect(semantics.every((t) => t.tier === 'semantic')).toBe(true);
      expect(semantics.every((t) => t.path[0] === 'semantic')).toBe(true);
    });

    it('returns component tokens for component categories', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const componentTokens = parser.getByTier('component');
      expect(componentTokens.length).toBeGreaterThan(0);
      expect(componentTokens.every((t) => t.tier === 'component')).toBe(true);
      expect(componentTokens.every((t) => t.path[0] === 'button')).toBe(true);
    });
  });

  describe('getByCategory()', () => {
    it('returns only tokens in the given category', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const colorTokens = parser.getByCategory('color');
      expect(colorTokens.length).toBeGreaterThan(0);
      expect(colorTokens.every((t) => t.path[0] === 'color')).toBe(true);
    });

    it('returns empty array for unknown category', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      expect(parser.getByCategory('zzznone')).toEqual([]);
    });
  });

  describe('getCategories()', () => {
    it('returns unique top-level categories', () => {
      const path = writeTempTokens(FIXTURE_TOKENS);
      const parser = new TokenParser(path);
      const categories = parser.getCategories();
      expect(categories).toContain('color');
      expect(categories).toContain('spacing');
      expect(categories).toContain('semantic');
      expect(categories).toContain('button');
      // no duplicates
      expect(new Set(categories).size).toBe(categories.length);
    });
  });
});
