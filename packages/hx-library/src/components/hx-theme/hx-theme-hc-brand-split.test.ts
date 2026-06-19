import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import {
  HelixBrandRegistry,
  REQUIRED_SEMANTIC_TOKENS,
  highContrastTokenEntries,
  tokenMap,
} from '@helixui/tokens';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

// hx-theme — HC brand-token behavior (3.3.0)
//
// The R1 split contract (HC_BRAND_TOKEN_SPLIT_CONTRACT.md) layers a
// categorization model on top of brand registration: per-token color vs.
// non-color stratification, `--brand-*` allowlist boundaries, namespace-based
// rejection, and re-registration atomicity. None of that categorization
// machinery ships in 3.x — `HelixBrandRegistry.register()` validates only
// presence of REQUIRED_SEMANTIC_TOKENS, and `hx-theme` suppresses the WHOLE
// brand merge on HC rather than splitting it per-token. The cases below cover
// the behavior that the current runtime actually delivers: full brand merge on
// light/dark, full suppression on HC, the suppression advisory, and the
// presence-validation throw. Categorization, allowlist, and atomicity cases
// were removed rather than left as permanent no-ops — they pin a contract no
// code implements yet.

/** Builds the canonical 22-stop color-only brand token map. */
function buildColorOnlyBrand(primary500 = '#AA0000'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of REQUIRED_SEMANTIC_TOKENS) map[token] = '#123456';
  map['--hx-color-primary-500'] = primary500;
  return map;
}

afterEach(() => {
  cleanup();
  HelixBrandRegistry._clear();
});

describe('hx-theme HC brand-token behavior (3.3.0)', () => {
  // ─── Full brand merge on non-HC themes ───────────────────────────────────
  describe('Brand merge applies on light/dark', () => {
    it('light + color-only brand: brand color tokens merge onto the sheet', async () => {
      HelixBrandRegistry.register('split-light', buildColorOnlyBrand('#CC0000'));
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="light" brand="split-light">Content</hx-theme>',
      );
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#cc0000');
    });

    it('dark + color-only brand: brand color tokens merge onto the sheet', async () => {
      HelixBrandRegistry.register('split-dark', buildColorOnlyBrand('#0000CC'));
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" brand="split-dark">Content</hx-theme>',
      );
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#0000cc');
    });
  });

  // ─── Full suppression on high-contrast ───────────────────────────────────
  describe('Brand merge is fully suppressed on high-contrast', () => {
    it('high-contrast + color-only brand: every required stop resolves to HC overlay or light primitive, never the brand value', async () => {
      const brandName = 'split-hc';
      const brandWhite: Record<string, string> = {};
      for (const name of REQUIRED_SEMANTIC_TOKENS) brandWhite[name] = '#FFFFFF';
      HelixBrandRegistry.register(brandName, brandWhite);

      const hcOverlay = new Map(highContrastTokenEntries.map((t) => [t.name, t.value]));
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;
      const styles = getComputedStyle(el);

      for (const tokenName of REQUIRED_SEMANTIC_TOKENS) {
        const raw = hcOverlay.get(tokenName) ?? tokenMap[tokenName];
        expect(raw, `${tokenName} missing from HC overlay and base tokenMap`).toBeDefined();
        const actual = styles.getPropertyValue(tokenName).trim().toLowerCase();
        expect(actual, `${tokenName} should not match brand white`).not.toBe('#ffffff');
        expect(actual, `${tokenName} should resolve to HC overlay or light primitive`).toBe(
          raw!.toLowerCase(),
        );
      }
    });

    it('high-contrast + registered brand: emits the suppression info advisory once', async () => {
      const brandName = 'split-hc-info';
      HelixBrandRegistry.register(brandName, buildColorOnlyBrand());
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const infoCalls = infoSpy.mock.calls.flat().filter((a): a is string => typeof a === 'string');
      expect(infoCalls.some((m) => m.includes('suppressed on theme="high-contrast"'))).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();

      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  // ─── Presence validation runs before application ─────────────────────────
  describe('Presence validation', () => {
    it('registering a brand missing the 22 required color stops throws REQUIRED_SEMANTIC_TOKENS message', () => {
      // Non-color-only brand (typography/radius only, no required colors) is
      // rejected at register() time — presence validation gates registration.
      expect(() =>
        HelixBrandRegistry.register('split-non-color', {
          '--hx-font-family-body': 'Inter, sans-serif',
          '--hx-radius-md': '8px',
        }),
      ).toThrowError(/required semantic tokens/i);
      expect(HelixBrandRegistry.isRegistered('split-non-color')).toBe(false);
    });
  });

  // ─── State transitions ────────────────────────────────────────────────────
  describe('State transitions', () => {
    it('light → high-contrast with a color brand: brand color drops from the sheet, HC overlay wins', async () => {
      const brandName = 'split-transition';
      HelixBrandRegistry.register(brandName, buildColorOnlyBrand('#CC0000'));
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="light" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#cc0000');

      el.theme = 'high-contrast';
      await el.updateComplete;

      const hcPrimary = new Map(highContrastTokenEntries.map((t) => [t.name, t.value])).get(
        '--hx-color-primary-500',
      );
      const expected = (hcPrimary ?? tokenMap['--hx-color-primary-500'])!.toLowerCase();
      const actual = getComputedStyle(el)
        .getPropertyValue('--hx-color-primary-500')
        .trim()
        .toLowerCase();
      expect(actual).not.toBe('#cc0000');
      expect(actual).toBe(expected);
    });

    it('high-contrast → light with a color brand: brand color re-applies', async () => {
      const brandName = 'split-transition-back';
      HelixBrandRegistry.register(brandName, buildColorOnlyBrand('#0000CC'));
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;

      el.theme = 'light';
      await el.updateComplete;

      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#0000cc');
    });
  });
});
