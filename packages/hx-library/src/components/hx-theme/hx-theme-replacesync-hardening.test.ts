import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import { HelixBrandRegistry, REQUIRED_SEMANTIC_TOKENS } from '@helixui/tokens';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

// hx-theme — replaceSync() application hardening (3.3.0)
//
// REPLACESYNC_HARDENING_CONTRACT.md proposes Path A (per-value CSS validation
// at registration time) plus a defense-in-depth try/catch around
// `replaceSync()` with a "validator false-negative" console.error and a
// last-good-state retention guard. Neither ships in 3.x: `HelixBrandRegistry`
// validates only PRESENCE of REQUIRED_SEMANTIC_TOKENS (no value-format
// validator — that lands in @helixui/tokens later, per this file's header),
// and `hx-theme._applyEffectiveTheme()` calls `replaceSync()` directly with no
// surrounding try/catch and no test hook to force a failure. The malformed-
// value rejection cases (oklch(invalid), 12pxx, null byte, unbalanced parens)
// and the forced-throw / false-negative cases were removed rather than left as
// permanent no-ops — they pin a validator and a catch that do not exist yet.
//
// What ships and is pinned here: valid brands register and apply across
// themes/density without throwing, and the registry's presence-validation
// throw does not partially pollute the registry.

/** Builds a brand whose 22 required colors are all valid hex. */
function buildValidBrand(primary500 = '#003DA5'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of REQUIRED_SEMANTIC_TOKENS) map[token] = '#000000';
  map['--hx-color-primary-500'] = primary500;
  return map;
}

afterEach(() => {
  cleanup();
  HelixBrandRegistry._clear();
});

describe('hx-theme replaceSync application hardening (3.3.0)', () => {
  // ─── Registration of valid brands ────────────────────────────────────────
  describe('Registration (presence validation)', () => {
    it('register a brand with all 22 required colors succeeds; isRegistered() is true', () => {
      HelixBrandRegistry.register('valid-brand', buildValidBrand());
      expect(HelixBrandRegistry.isRegistered('valid-brand')).toBe(true);
    });

    it('register a brand missing a required color throws; isRegistered() stays false', () => {
      const incomplete = buildValidBrand();
      delete incomplete['--hx-color-primary-500'];
      expect(() => HelixBrandRegistry.register('incomplete', incomplete)).toThrowError(
        /required semantic tokens/i,
      );
      expect(HelixBrandRegistry.isRegistered('incomplete')).toBe(false);
    });
  });

  // ─── Application happy path ───────────────────────────────────────────────
  describe('Application happy path (valid brands never throw)', () => {
    it('applying a registered brand under theme="light" does not throw and applies the sheet', async () => {
      HelixBrandRegistry.register('apply-light', buildValidBrand('#CC0000'));
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="light" brand="apply-light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#cc0000');
    });

    it('applying a registered brand under theme="high-contrast" does not throw; info advisory fires once', async () => {
      HelixBrandRegistry.register('apply-hc', buildValidBrand());
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast" brand="apply-hc">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(infoSpy).toHaveBeenCalledTimes(1);
      infoSpy.mockRestore();
    });

    it('applying a density change with a valid brand does not throw', async () => {
      HelixBrandRegistry.register('apply-density', buildValidBrand('#0000CC'));
      const el = await fixture<HelixTheme>('<hx-theme brand="apply-density">Content</hx-theme>');
      await el.updateComplete;

      el.density = 'compact';
      await el.updateComplete;
      // Density override applied without disturbing the brand color sheet.
      expect(getComputedStyle(el).getPropertyValue('--hx-space-4').trim()).toBe('0.75rem');
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#0000cc');
    });
  });

  // ─── Registry state invariants ───────────────────────────────────────────
  describe('Registry state invariants', () => {
    it('a presence-validation throw does not partially store the brand', () => {
      const incomplete = buildValidBrand();
      delete incomplete['--hx-color-secondary-950'];
      expect(() => HelixBrandRegistry.register('partial', incomplete)).toThrow();
      expect(HelixBrandRegistry.isRegistered('partial')).toBe(false);
      expect(HelixBrandRegistry.getBrandTokens('partial')).toBeUndefined();

      // A subsequent registration of a different, valid brand succeeds normally
      // — the failed attempt left no corrupt state behind.
      HelixBrandRegistry.register('recovered', buildValidBrand('#123456'));
      expect(HelixBrandRegistry.isRegistered('recovered')).toBe(true);
    });

    it('re-registration after a rejected attempt with a valid map succeeds and applies', async () => {
      const bad = buildValidBrand();
      delete bad['--hx-color-primary-700'];
      expect(() => HelixBrandRegistry.register('retry', bad)).toThrow();
      expect(HelixBrandRegistry.isRegistered('retry')).toBe(false);

      HelixBrandRegistry.register('retry', buildValidBrand('#CC0000'));
      const el = await fixture<HelixTheme>('<hx-theme brand="retry">Content</hx-theme>');
      await el.updateComplete;
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#cc0000');
    });
  });
});
