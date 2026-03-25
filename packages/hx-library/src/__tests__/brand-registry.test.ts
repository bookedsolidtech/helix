import { describe, it, expect, beforeEach } from 'vitest';
import {
  HelixBrandRegistry,
  HelixBrandRegistryClass,
  REQUIRED_SEMANTIC_TOKENS,
} from '@helixui/tokens';
import type { BrandTokenMap } from '@helixui/tokens';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a complete, valid token map satisfying all REQUIRED_SEMANTIC_TOKENS. */
function buildCompleteTokenMap(overrides: BrandTokenMap = {}): BrandTokenMap {
  const base: BrandTokenMap = {};
  for (const token of REQUIRED_SEMANTIC_TOKENS) {
    base[token] = '#000000';
  }
  // Apply overrides individually to keep the return type as BrandTokenMap (not Partial)
  const result: BrandTokenMap = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = value;
  }
  return result;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HelixBrandRegistry', () => {
  // Use a fresh registry instance for each test to avoid cross-test contamination.
  let registry: HelixBrandRegistryClass;

  beforeEach(() => {
    registry = new HelixBrandRegistryClass();
  });

  // Verify the singleton is accessible and is an instance of the registry class
  it('exports a singleton HelixBrandRegistry instance', () => {
    expect(HelixBrandRegistry).toBeInstanceOf(HelixBrandRegistryClass);
  });

  // ─── register() ──────────────────────────────────────────────────────────

  describe('register()', () => {
    it('accepts a complete token map without throwing', () => {
      const tokens = buildCompleteTokenMap({ '--hx-color-primary-500': '#003DA5' });
      expect(() => registry.register('mercy-health', tokens)).not.toThrow();
    });

    it('stores the brand so isRegistered() returns true', () => {
      registry.register('mercy-health', buildCompleteTokenMap());
      expect(registry.isRegistered('mercy-health')).toBe(true);
    });

    it('throws when brand name is an empty string', () => {
      expect(() => registry.register('', buildCompleteTokenMap())).toThrow(
        '[HelixBrandRegistry] Brand name must be a non-empty string.',
      );
    });

    it('throws when brand name is only whitespace', () => {
      expect(() => registry.register('   ', buildCompleteTokenMap())).toThrow(
        '[HelixBrandRegistry] Brand name must be a non-empty string.',
      );
    });

    it('throws and lists missing tokens when required tokens are absent', () => {
      const incomplete: BrandTokenMap = {
        '--hx-color-primary-500': '#003DA5',
        // deliberately omit all others
      };
      let thrownError: Error | undefined;
      try {
        registry.register('incomplete-brand', incomplete);
      } catch (err) {
        thrownError = err as Error;
      }
      expect(thrownError).toBeInstanceOf(Error);
      // Should mention the brand name
      expect(thrownError?.message).toContain('incomplete-brand');
      // Should list at least one missing token explicitly
      const missingFromMap = REQUIRED_SEMANTIC_TOKENS.filter((t) => !(t in incomplete));
      for (const missing of missingFromMap.slice(0, 3)) {
        expect(thrownError?.message).toContain(missing);
      }
    });

    it('throws and lists ALL missing tokens in the error message', () => {
      // Submit only the first required token — the rest must appear in the error
      const partial: BrandTokenMap = { [REQUIRED_SEMANTIC_TOKENS[0] ?? '']: '#003DA5' };
      let thrownError: Error | undefined;
      try {
        registry.register('partial-brand', partial);
      } catch (err) {
        thrownError = err as Error;
      }
      const expectedMissing = REQUIRED_SEMANTIC_TOKENS.slice(1);
      for (const token of expectedMissing) {
        expect(thrownError?.message).toContain(token);
      }
    });

    it('overwrites an existing registration (last write wins)', () => {
      const first = buildCompleteTokenMap({ '--hx-color-primary-500': '#003DA5' });
      const second = buildCompleteTokenMap({ '--hx-color-primary-500': '#FF0000' });

      registry.register('overwrite-brand', first);
      registry.register('overwrite-brand', second);

      const stored = registry.getBrandTokens('overwrite-brand');
      expect(stored?.['--hx-color-primary-500']).toBe('#FF0000');
    });

    it('stores a defensive copy so mutations to the original map do not affect the registry', () => {
      const tokens = buildCompleteTokenMap({ '--hx-color-primary-500': '#003DA5' });
      registry.register('mutation-test', tokens);

      // Mutate after registration
      tokens['--hx-color-primary-500'] = '#MUTATED';

      const stored = registry.getBrandTokens('mutation-test');
      expect(stored?.['--hx-color-primary-500']).toBe('#003DA5');
    });
  });

  // ─── getBrandTokens() ─────────────────────────────────────────────────────

  describe('getBrandTokens()', () => {
    it('returns undefined for an unregistered brand', () => {
      expect(registry.getBrandTokens('not-registered')).toBeUndefined();
    });

    it('returns the registered token map', () => {
      const tokens = buildCompleteTokenMap({ '--hx-color-primary-500': '#AABBCC' });
      registry.register('retrieval-test', tokens);

      const result = registry.getBrandTokens('retrieval-test');
      expect(result?.['--hx-color-primary-500']).toBe('#AABBCC');
    });

    it('returns a defensive copy so mutations to the returned map do not affect the registry', () => {
      registry.register('copy-test', buildCompleteTokenMap({ '--hx-color-primary-500': '#111111' }));

      const copy = registry.getBrandTokens('copy-test');
      if (copy) {
        copy['--hx-color-primary-500'] = '#MUTATED';
      }

      const fresh = registry.getBrandTokens('copy-test');
      expect(fresh?.['--hx-color-primary-500']).toBe('#111111');
    });
  });

  // ─── isRegistered() ──────────────────────────────────────────────────────

  describe('isRegistered()', () => {
    it('returns false before any registration', () => {
      expect(registry.isRegistered('ghost-brand')).toBe(false);
    });

    it('returns true after a successful registration', () => {
      registry.register('real-brand', buildCompleteTokenMap());
      expect(registry.isRegistered('real-brand')).toBe(true);
    });

    it('returns false for a different brand name than what was registered', () => {
      registry.register('brand-a', buildCompleteTokenMap());
      expect(registry.isRegistered('brand-b')).toBe(false);
    });
  });

  // ─── validateTokens() ────────────────────────────────────────────────────

  describe('validateTokens()', () => {
    it('returns valid=true and empty missingTokens for a complete map', () => {
      const result = registry.validateTokens(buildCompleteTokenMap());
      expect(result.valid).toBe(true);
      expect(result.missingTokens).toEqual([]);
    });

    it('returns valid=false when required tokens are missing', () => {
      const result = registry.validateTokens({});
      expect(result.valid).toBe(false);
      expect(result.missingTokens.length).toBe(REQUIRED_SEMANTIC_TOKENS.length);
    });

    it('returns exactly the missing token names in missingTokens', () => {
      // Build a map that excludes the first and last required tokens
      const first = REQUIRED_SEMANTIC_TOKENS[0];
      const last = REQUIRED_SEMANTIC_TOKENS[REQUIRED_SEMANTIC_TOKENS.length - 1];
      const excluded = new Set([first, last]);

      const partial: BrandTokenMap = Object.fromEntries(
        REQUIRED_SEMANTIC_TOKENS
          .filter((t) => !excluded.has(t))
          .map((t) => [t, '#000000']),
      );

      const result = registry.validateTokens(partial);
      expect(result.valid).toBe(false);
      if (first) expect(result.missingTokens).toContain(first);
      // last is only distinct from first when the array has more than one element
      if (last && first !== last) expect(result.missingTokens).toContain(last);
    });

    it('treats a token with empty string value as missing', () => {
      const tokens = buildCompleteTokenMap({ '--hx-color-primary-500': '' });
      const result = registry.validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.missingTokens).toContain('--hx-color-primary-500');
    });

    it('treats a token with whitespace-only value as missing', () => {
      const tokens = buildCompleteTokenMap({ '--hx-color-primary-600': '   ' });
      const result = registry.validateTokens(tokens);
      expect(result.valid).toBe(false);
      expect(result.missingTokens).toContain('--hx-color-primary-600');
    });

    it('does not throw — returns a result object instead', () => {
      expect(() => registry.validateTokens({})).not.toThrow();
    });
  });

  // ─── REQUIRED_SEMANTIC_TOKENS ────────────────────────────────────────────

  describe('REQUIRED_SEMANTIC_TOKENS', () => {
    it('is a non-empty readonly array', () => {
      expect(REQUIRED_SEMANTIC_TOKENS.length).toBeGreaterThan(0);
    });

    it('contains only --hx- prefixed token names', () => {
      for (const token of REQUIRED_SEMANTIC_TOKENS) {
        expect(token.startsWith('--hx-')).toBe(true);
      }
    });

    it('covers primary color ramp tokens', () => {
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      for (const shade of shades) {
        expect(REQUIRED_SEMANTIC_TOKENS).toContain(`--hx-color-primary-${shade}`);
      }
    });

    it('covers secondary color ramp tokens', () => {
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      for (const shade of shades) {
        expect(REQUIRED_SEMANTIC_TOKENS).toContain(`--hx-color-secondary-${shade}`);
      }
    });
  });
});
