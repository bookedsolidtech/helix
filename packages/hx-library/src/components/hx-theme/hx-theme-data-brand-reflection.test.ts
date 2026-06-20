import { describe, it, expect, afterEach, vi } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import { HelixBrandRegistry, REQUIRED_SEMANTIC_TOKENS } from '@helixui/tokens';
import type { HelixTheme } from './hx-theme.js';
import './index.js';

// hx-theme — `brand` → `data-brand` reflection (3.3.0)
//
// The BRAND_REFLECTION_CONTRACT.md proposes that `hx-theme` mirror its `brand`
// property onto a `data-brand` attribute (with HC stripping, ownership
// tracking via `lastApplied`, and reconcile-boundary mutation-guard
// semantics). That reflection machinery does NOT ship in 3.x — `hx-theme.ts`
// never reads or writes `data-brand`, and there is no `lastApplied` state. The
// 24 case + 7 transition + 2 mutation-guard + R1 cases that asserted
// `data-brand` writes / removals / ownership were removed rather than left as
// permanent no-ops: pinning an unbuilt attribute contract gives no signal.
//
// What the runtime DOES deliver, and what these tests pin, are the
// observable console advisories that the contract folded into each case:
// the unregistered-brand warn, the HC-suppression info, and the dedupe of
// both across redundant reconciles. The data-brand non-management is asserted
// directly so a future reflection feature has to update these guards
// deliberately.

/** Builds the canonical 22-stop brand token map. */
function buildBrand(primary500 = '#AA0000'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of REQUIRED_SEMANTIC_TOKENS) map[token] = '#123456';
  map['--hx-color-primary-500'] = primary500;
  return map;
}

afterEach(() => {
  cleanup();
  HelixBrandRegistry._clear();
});

describe('hx-theme brand advisory + data-brand non-management (3.3.0)', () => {
  // ─── data-brand is not auto-managed in 3.x ───────────────────────────────
  describe('data-brand is left to the author (no auto-reflection in 3.x)', () => {
    it('brand set, registered, light: does not write data-brand', async () => {
      HelixBrandRegistry.register('acme', buildBrand());
      const el = await fixture<HelixTheme>('<hx-theme brand="acme">Content</hx-theme>');
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);
    });

    it('author-supplied data-brand is left untouched (runtime does not own it)', async () => {
      HelixBrandRegistry.register('acme', buildBrand());
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="acme" data-brand="acme">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('acme');
    });

    it('author-supplied mismatched data-brand is not overwritten by brand', async () => {
      HelixBrandRegistry.register('acme', buildBrand());
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="acme" data-brand="other">Content</hx-theme>',
      );
      await el.updateComplete;
      // Runtime does not reflect `brand` onto data-brand, so the author value wins.
      expect(el.getAttribute('data-brand')).toBe('other');
    });

    it('switching brand does not mutate an author-supplied data-brand', async () => {
      HelixBrandRegistry.register('acme', buildBrand('#CC0000'));
      HelixBrandRegistry.register('other', buildBrand('#0000CC'));
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="acme" data-brand="acme">Content</hx-theme>',
      );
      await el.updateComplete;

      el.brand = 'other';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('acme');
    });
  });

  // ─── Unregistered-brand warn advisory ────────────────────────────────────
  describe('Unregistered brand warn advisory', () => {
    it('light + unregistered brand: warns about the unregistered brand', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>('<hx-theme brand="ghost">Content</hx-theme>');
      await el.updateComplete;

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ghost'));
      expect(el.hasAttribute('data-brand')).toBe(false);
      warnSpy.mockRestore();
    });

    it('dark + unregistered brand: warns about the unregistered brand', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark" brand="ghost">Content</hx-theme>',
      );
      await el.updateComplete;

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ghost'));
      warnSpy.mockRestore();
    });

    it('high-contrast + unregistered brand: warns (not info)', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast" brand="ghost">Content</hx-theme>',
      );
      await el.updateComplete;

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ghost'));
      expect(infoSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });

  // ─── HC suppression info advisory ────────────────────────────────────────
  describe('High-contrast suppression info advisory', () => {
    it('high-contrast + registered brand: info-logs HC suppression (not warn)', async () => {
      HelixBrandRegistry.register('acme', buildBrand());
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast" brand="acme">Content</hx-theme>',
      );
      await el.updateComplete;

      const infoCalls = infoSpy.mock.calls.flat().filter((a): a is string => typeof a === 'string');
      expect(infoCalls.some((m) => m.includes('suppressed on theme="high-contrast"'))).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  // ─── State transitions (token-application side, not data-brand) ───────────
  describe('State transitions', () => {
    it('brand switch re-applies new brand tokens on the sheet', async () => {
      HelixBrandRegistry.register('acme', buildBrand('#CC0000'));
      HelixBrandRegistry.register('other', buildBrand('#0000CC'));
      const el = await fixture<HelixTheme>('<hx-theme brand="acme">Content</hx-theme>');
      await el.updateComplete;
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#cc0000');

      el.brand = 'other';
      await el.updateComplete;
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#0000cc');
    });

    it('clearing brand reverts to base theme tokens', async () => {
      HelixBrandRegistry.register('acme', buildBrand('#CC0000'));
      const el = await fixture<HelixTheme>('<hx-theme brand="acme">Content</hx-theme>');
      await el.updateComplete;

      el.brand = '';
      await el.updateComplete;
      // Base light theme precision-cool primary-500.
      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#429797');
    });
  });

  // ─── Advisory dedupe ─────────────────────────────────────────────────────
  // Pins `_lastBrandAdvisoryKey`: the advisory fires once per applied state,
  // not once per update() tick. A redundant reconcile (e.g. an unrelated
  // property change) must not re-emit the same advisory.
  describe('Advisory dedupe', () => {
    it('warn channel: unregistered brand re-reconciled at same brand/theme emits exactly one warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>('<hx-theme brand="ghost">Content</hx-theme>');
      await el.updateComplete;

      // A `motion` change re-runs `_applyEffectiveTheme()` with the same
      // brand/effectiveTheme — the advisory key is unchanged so the warn must
      // be deduped by `_lastBrandAdvisoryKey`.
      el.motion = 'reduced';
      await el.updateComplete;

      expect(warnSpy).toHaveBeenCalledTimes(1);
      warnSpy.mockRestore();
    });

    it('info channel: HC-suppressed registered brand re-reconciled at same brand/theme emits exactly one info', async () => {
      HelixBrandRegistry.register('acme', buildBrand());
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast" brand="acme">Content</hx-theme>',
      );
      await el.updateComplete;

      el.motion = 'reduced';
      await el.updateComplete;

      expect(infoSpy).toHaveBeenCalledTimes(1);
      infoSpy.mockRestore();
    });
  });

  // ─── Late registration ───────────────────────────────────────────────────
  describe('Late registration', () => {
    it('brand mounts unregistered then becomes registered: warn once, tokens apply only after a brand re-reconcile', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const el = await fixture<HelixTheme>('<hx-theme brand="late">Content</hx-theme>');
      await el.updateComplete;
      expect(warnSpy).toHaveBeenCalledTimes(1);

      // Registry has no subscription bus in 3.x, so registering after mount
      // does not auto-reconcile — the brand value must change for hx-theme to
      // re-read the registry. Round-trip through '' to force the brand-changed
      // reconcile that re-applies the now-registered tokens.
      HelixBrandRegistry.register('late', buildBrand('#CC0000'));
      el.brand = '';
      await el.updateComplete;
      el.brand = 'late';
      await el.updateComplete;

      expect(
        getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim().toLowerCase(),
      ).toBe('#cc0000');
      warnSpy.mockRestore();
    });
  });
});
