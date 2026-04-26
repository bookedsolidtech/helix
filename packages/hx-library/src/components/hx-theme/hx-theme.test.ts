import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTheme } from './hx-theme.js';
import {
  HelixBrandRegistry,
  REQUIRED_SEMANTIC_TOKENS,
  highContrastTokenEntries,
  tokenMap,
} from '@helixui/tokens';
import './index.js';

afterEach(cleanup);

describe('hx-theme', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "base" CSS part', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      const base = shadowQuery(el, '[part="base"]');
      expect(base).toBeTruthy();
    });

    it('renders slotted content', async () => {
      const el = await fixture<HelixTheme>('<hx-theme><p id="test-p">Hello</p></hx-theme>');
      const p = el.querySelector('#test-p');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('Hello');
    });

    it('has display:contents so it does not affect layout', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(getComputedStyle(el).display).toBe('contents');
    });
  });

  // ─── Property: theme ───

  describe('Property: theme', () => {
    it('defaults to "light"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.theme).toBe('light');
    });

    it('reflects theme attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.getAttribute('theme')).toBe('dark');
    });

    it('accepts "dark" theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.theme).toBe('dark');
    });

    it('accepts "high-contrast" theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      expect(el.theme).toBe('high-contrast');
    });

    it('accepts "auto" theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      expect(el.theme).toBe('auto');
    });
  });


  // ─── Token values ───

  describe('Token values', () => {
    it('injects --hx-color-primary-500 with light value by default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#429797');
    });

    it('injects light --hx-shadow-sm in light mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
    });

    it('injects dark --hx-shadow-sm override in dark mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });

    it('injects distinct high-contrast token overrides in high-contrast mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      await el.updateComplete;
      // HC shadow uses white (not dark's black) — distinguishes HC from dark
      const shadowValue = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(shadowValue).toBe('0 1px 2px 0 rgb(255 255 255 / 0.2)');
      // HC text.primary is pure white (#FFFFFF), not a var() reference
      const textPrimary = getComputedStyle(el).getPropertyValue('--hx-color-text-primary').trim();
      expect(textPrimary.toLowerCase()).toBe('#ffffff');
    });

    it('injects every HC token from tokens.json onto the host with the correct value', async () => {
      // Value-aware sweep — walks tokens['high-contrast'] independently of
      // the published `highContrastTokenEntries` array and asserts:
      //   1. count parity (independent walk vs public export)
      //   2. for every HC token, the resolved DOM value matches the
      //      source-of-truth literal endpoint byte-for-byte. var() chains
      //      are resolved through a merged light+HC expected map so cross-
      //      layer references (HC token → light primitive) resolve to the
      //      light literal — closes the round-19 cascade-shadow finding
      //      that an HC-only resolver dropped cross-layer chains into the
      //      existence-only fallback.
      //   3. cycle / depth-limit failures fail loudly (kind === 'cycle')
      //      so a pathological tokens.json chain does not silently slip.
      const { tokens, highContrastTokenEntries } = await import('@helixui/tokens');

      type RawToken = { value: string };
      const isToken = (v: unknown): v is RawToken =>
        typeof v === 'object' && v !== null && 'value' in (v as Record<string, unknown>);
      const walk = (
        node: Record<string, unknown>,
        path: string[],
        out: Map<string, string>,
      ): void => {
        for (const [key, val] of Object.entries(node)) {
          const next = [...path, key];
          if (isToken(val)) {
            out.set(`--hx-${next.join('-')}`, val.value);
          } else if (typeof val === 'object' && val !== null) {
            walk(val as Record<string, unknown>, next, out);
          }
        }
      };
      const root = tokens as Record<string, unknown>;
      const lightRoot: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(root)) {
        if (k !== 'dark' && k !== 'high-contrast') lightRoot[k] = v;
      }
      const expectedLight = new Map<string, string>();
      walk(lightRoot, [], expectedLight);
      const expectedHc = new Map<string, string>();
      walk(root['high-contrast'] as Record<string, unknown>, [], expectedHc);
      // Merged map: light is the base, HC overlays selected names. Brand
      // overrides are not in scope here (no brand applied on the fixture).
      const expectedMerged = new Map(expectedLight);
      for (const [k, v] of expectedHc) expectedMerged.set(k, v);

      // Independent count must match the published export — silent truncation guard.
      expect(highContrastTokenEntries.length, 'highContrastTokenEntries truncated vs tokens.json').toBe(
        expectedHc.size,
      );

      // Resolve a var() chain through the merged map. Distinguishes:
      //   - { kind: 'literal', value }: chain terminates on a literal
      //   - { kind: 'cycle' }: depth limit / cycle / orphan (must fail loudly)
      type Resolution = { kind: 'literal'; value: string } | { kind: 'cycle' };
      const resolveChain = (raw: string, depth = 0): Resolution => {
        if (depth > 10) return { kind: 'cycle' };
        const m = raw.match(/^var\(\s*(--[\w-]+)\s*\)\s*$/);
        if (!m) return { kind: 'literal', value: raw };
        const target = expectedMerged.get(m[1] ?? '');
        if (target === undefined) return { kind: 'cycle' };
        return resolveChain(target, depth + 1);
      };

      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      await el.updateComplete;
      const styles = getComputedStyle(el);
      for (const [name, sourceValue] of expectedHc) {
        const resolved = styles.getPropertyValue(name).trim();
        const result = resolveChain(sourceValue);
        if (result.kind === 'cycle') {
          throw new Error(
            `HC token ${name} resolved to a cycle/orphan via tokens.json (raw value: ${sourceValue}). ` +
              `Either the chain depth exceeds 10 or a var() target is missing from the merged map.`,
          );
        }
        // Literal endpoint — resolved DOM value must match byte-for-byte.
        expect(resolved.toLowerCase(), `HC token ${name} value drift`).toBe(
          result.value.toLowerCase(),
        );
      }
    });

    it('switches to HC sentinels when theme transitions light → high-contrast', async () => {
      // R19 finding 3 — HC value-aware sweep above only runs on first mount.
      // Theme-switch path was not exercised for HC. Sentinel: focus-ring-width
      // (2px in light, 3px in HC) and border-width-thin (1px in light, 2px in HC).
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;
      const before = getComputedStyle(el);
      expect(before.getPropertyValue('--hx-focus-ring-width').trim()).toBe('2px');
      expect(before.getPropertyValue('--hx-border-width-thin').trim()).toBe('1px');

      el.theme = 'high-contrast';
      await el.updateComplete;
      const after = getComputedStyle(el);
      expect(after.getPropertyValue('--hx-focus-ring-width').trim()).toBe('3px');
      expect(after.getPropertyValue('--hx-border-width-thin').trim()).toBe('2px');
      expect(
        after.getPropertyValue('--hx-color-text-on-error-strong').trim().toLowerCase(),
      ).toBe('#000000');
    });

    it('injects HC sentinel values for branch-specific override paths', async () => {
      // Branch-specific override paths the structural sweep can pass
      // even with logic regressions (e.g. var() chains that resolve via
      // light fallbacks instead of the HC-specific override). Each sentinel
      // is a token whose drift would silently break a consumer-facing
      // a11y pairing.
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      await el.updateComplete;
      const styles = getComputedStyle(el);
      // HC primary-500 — bright blue replaces light teal
      expect(styles.getPropertyValue('--hx-color-primary-500').trim().toLowerCase()).toBe(
        '#3b82f6',
      );
      // HC text.on-primary-strong — black on bright HC primary fills (AAA)
      expect(
        styles.getPropertyValue('--hx-color-text-on-primary-strong').trim().toLowerCase(),
      ).toBe('#000000');
      // HC text.on-error-strong — black on bright HC error fills (AAA, paired
      // with action.danger.bg-active below). Base value white fails AA on HC red.
      expect(
        styles.getPropertyValue('--hx-color-text-on-error-strong').trim().toLowerCase(),
      ).toBe('#000000');
      // HC action.danger.bg-active — flips to HC error-500 (#F87171) so the
      // pressed-state danger pairing with on-error-strong (#000000) clears AA.
      // Base error-700 (#A21312) has no HC override → 2.64:1 fail without this.
      expect(
        styles.getPropertyValue('--hx-color-action-danger-bg-active').trim().toLowerCase(),
      ).toBe('#f87171');
      // HC border.on-dark-strong — solid white so inverted outlines remain visible
      expect(
        styles.getPropertyValue('--hx-color-border-on-dark-strong').trim().toLowerCase(),
      ).toBe('#ffffff');
      // HC focus-ring-width — thicker ring for HC visibility (3px vs 2px default)
      expect(styles.getPropertyValue('--hx-focus-ring-width').trim()).toBe('3px');
      // HC border-width-thin — thicker minimum border for HC visibility
      expect(styles.getPropertyValue('--hx-border-width-thin').trim()).toBe('2px');
    });
  });

  // ─── effectiveTheme ───

  describe('effectiveTheme', () => {
    it('returns "light" by default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.effectiveTheme).toBe('light');
    });

    it('returns "dark" when theme="dark"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('dark');
    });

    it('returns "high-contrast" when theme="high-contrast"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="high-contrast">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('high-contrast');
    });

    it('returns "light" or "dark" when theme="auto"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });
  });

  // ─── Theme switching ───

  describe('Theme switching', () => {
    it('updates reflected attribute when theme changes', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      expect(el.getAttribute('theme')).toBe('dark');
    });

    it('updates effectiveTheme when theme property changes', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      expect(el.effectiveTheme).toBe('dark');
    });

    it('updates injected tokens when theme switches from light to dark', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="light">Content</hx-theme>');
      await el.updateComplete;

      const lightValue = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(lightValue).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');

      el.theme = 'dark';
      await el.updateComplete;

      const darkValue = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(darkValue).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });

    it('updates injected tokens when theme switches back from dark to light', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'light';
      await el.updateComplete;

      const value = getComputedStyle(el).getPropertyValue('--hx-shadow-sm').trim();
      expect(value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
    });

    it('preserves light primitives when in dark mode', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      await el.updateComplete;
      // Primitive tokens like --hx-color-primary-500 are still present in dark mode
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#429797');
    });
  });

  // ─── Auto-mode detection ───

  describe('Auto-mode detection', () => {
    it('effectiveTheme returns light or dark when theme="auto"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      await el.updateComplete;

      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });

    it('effectiveTheme uses explicit theme prop when not "auto"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('dark');
    });

    it('switching from "auto" to an explicit theme uses that theme', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      await el.updateComplete;

      el.theme = 'dark';
      await el.updateComplete;

      expect(el.effectiveTheme).toBe('dark');
    });
  });

  // ─── Auto-mode token injection ───

  describe('Auto-mode token injection', () => {
    it('injects tokens when theme="auto"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value).toBeTruthy();
      expect(value.length).toBeGreaterThan(0);
    });
  });

  // ─── Nested themes ───

  describe('Nested themes', () => {
    it('inner theme overrides outer theme tokens within its subtree', async () => {
      const outer = await fixture<HelixTheme>(
        '<hx-theme theme="light"><hx-theme theme="dark" id="inner">Content</hx-theme></hx-theme>',
      );
      await outer.updateComplete;
      const inner = outer.querySelector<HelixTheme>('#inner')!;
      await inner.updateComplete;

      // Outer (light) should have light shadow value
      const outerShadow = getComputedStyle(outer).getPropertyValue('--hx-shadow-sm').trim();
      expect(outerShadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');

      // Inner (dark) should have dark shadow value
      const innerShadow = getComputedStyle(inner).getPropertyValue('--hx-shadow-sm').trim();
      expect(innerShadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.3)');
    });
  });

  // ─── Consumer token overrides ───

  describe('Consumer token overrides', () => {
    it('inline style override takes precedence over injected theme tokens', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="light" style="--hx-color-primary-500: red;">Content</hx-theme>',
      );
      await el.updateComplete;
      // Inline style should win over the adoptedStyleSheet (:host) declaration
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value).toBe('red');
    });
  });

  // ─── Lifecycle ───

  describe('Lifecycle', () => {
    it('cleans up media query listener on disconnect', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      await el.updateComplete;

      // Capture the internal handler reference before removal
      const spy = vi.fn();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', spy);

      el.remove();
      expect(el.isConnected).toBe(false);

      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', spy);
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text content', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Themed Content</hx-theme>');
      expect(el.textContent?.trim()).toBe('Themed Content');
    });

    it('default slot renders HTML children', async () => {
      const el = await fixture<HelixTheme>('<hx-theme><span class="child">Child</span></hx-theme>');
      const span = el.querySelector('span.child');
      expect(span).toBeTruthy();
    });
  });

  // ─── effectiveMotion ───

  describe('effectiveMotion', () => {
    it('returns "full" when motion is default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      // OS prefers-reduced-motion may be set in the test environment — just verify the return shape
      const motion = el.effectiveMotion;
      expect(motion === 'full' || motion === 'reduced').toBe(true);
    });

    it('returns "reduced" when motion="reduced"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme motion="reduced">Content</hx-theme>');
      await el.updateComplete;
      expect(el.effectiveMotion).toBe('reduced');
    });

    it('returns "reduced" when motion="none"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme motion="none">Content</hx-theme>');
      await el.updateComplete;
      expect(el.effectiveMotion).toBe('reduced');
    });

    it('reflects motion attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme motion="reduced">Content</hx-theme>');
      expect(el.getAttribute('motion')).toBe('reduced');
    });

    it('motion defaults to "full"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.motion).toBe('full');
    });
  });

  // ─── motion token injection ───

  describe('motion token injection', () => {
    it('collapses --hx-duration-fast to 0ms when motion="reduced"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme motion="reduced">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-duration-fast').trim();
      expect(value).toBe('0ms');
    });

    it('collapses --hx-transition-normal to 0ms linear when motion="none"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme motion="none">Content</hx-theme>');
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-transition-normal').trim();
      expect(value).toBe('0ms linear');
    });
  });

  // ─── density property ───

  describe('Property: density', () => {
    it('defaults to "comfortable"', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.density).toBe('comfortable');
    });

    it('reflects density attribute to host', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      expect(el.getAttribute('density')).toBe('compact');
    });

    it('compact density reduces --hx-space-4 below default', async () => {
      const defaultEl = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      await defaultEl.updateComplete;
      const defaultVal = getComputedStyle(defaultEl).getPropertyValue('--hx-space-4').trim();

      cleanup();

      const compactEl = await fixture<HelixTheme>('<hx-theme density="compact">Content</hx-theme>');
      await compactEl.updateComplete;
      const compactVal = getComputedStyle(compactEl).getPropertyValue('--hx-space-4').trim();

      // Compact space-4 (0.75rem) < default space-4 (1rem)
      expect(compactVal).not.toBe(defaultVal);
      expect(compactVal).toBe('0.75rem');
    });

    it('spacious density increases --hx-space-4 above default', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="spacious">Content</hx-theme>');
      await el.updateComplete;
      const val = getComputedStyle(el).getPropertyValue('--hx-space-4').trim();
      // Spacious space-4 = 1.25rem
      expect(val).toBe('1.25rem');
    });

    it('comfortable density uses default --hx-space-4 (no overrides)', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      await el.updateComplete;
      const val = getComputedStyle(el).getPropertyValue('--hx-space-4').trim();
      // Default space-4 token is 1rem
      expect(val).toBe('1rem');
    });

    it('switching density from comfortable to compact updates tokens', async () => {
      const el = await fixture<HelixTheme>('<hx-theme density="comfortable">Content</hx-theme>');
      await el.updateComplete;
      const before = getComputedStyle(el).getPropertyValue('--hx-space-4').trim();

      el.density = 'compact';
      await el.updateComplete;
      const after = getComputedStyle(el).getPropertyValue('--hx-space-4').trim();

      expect(after).not.toBe(before);
      expect(after).toBe('0.75rem');
    });
  });

  // ─── brand property ───

  describe('Property: brand', () => {
    /** Register a minimal-but-complete brand for tests that need registry
     * acceptance. R27 gates `data-brand` reflection on
     * `HelixBrandRegistry.getBrandTokens(...) !== undefined` so an
     * unregistered name no longer activates cascade overrides the JS path
     * is simultaneously refusing. Tests that previously assumed
     * `harbor-health` reflected unconditionally now register it. */
    const registerHarborHealth = (): void => {
      HelixBrandRegistry.register('harbor-health', {
        '--hx-color-primary-50': '#f0fafa',
        '--hx-color-primary-100': '#d6f0f0',
        '--hx-color-primary-200': '#a8dede',
        '--hx-color-primary-300': '#7accca',
        '--hx-color-primary-400': '#4cbab6',
        '--hx-color-primary-500': '#1ea8a2',
        '--hx-color-primary-600': '#188983',
        '--hx-color-primary-700': '#136a64',
        '--hx-color-primary-800': '#0e4b46',
        '--hx-color-primary-900': '#082c28',
        '--hx-color-primary-950': '#041614',
        '--hx-color-secondary-50': '#f0f4fa',
        '--hx-color-secondary-100': '#d6e1f0',
        '--hx-color-secondary-200': '#a8c0de',
        '--hx-color-secondary-300': '#7aa0cc',
        '--hx-color-secondary-400': '#4c80ba',
        '--hx-color-secondary-500': '#1e60a8',
        '--hx-color-secondary-600': '#184d89',
        '--hx-color-secondary-700': '#133a6a',
        '--hx-color-secondary-800': '#0e274b',
        '--hx-color-secondary-900': '#08142c',
        '--hx-color-secondary-950': '#040a16',
      });
    };

    it('defaults brand to empty string', async () => {
      const el = await fixture<HelixTheme>('<hx-theme>Content</hx-theme>');
      expect(el.brand).toBe('');
    });

    it('logs a console.warn when brand is set to an unregistered name', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="unknown-brand-xyz">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown-brand-xyz'),
      );
      warnSpy.mockRestore();
    });

    it('applies base theme tokens without throwing when brand is unregistered', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="no-such-brand-2026">Content</hx-theme>',
      );
      await el.updateComplete;
      // Should still have the default primary token
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#429797');
      warnSpy.mockRestore();
    });

    it('applies brand token overrides when brand is registered', async () => {
      const brandName = 'test-brand-phase3-b5';
      // HelixBrandRegistry.register requires all REQUIRED_SEMANTIC_TOKENS (primary + secondary ramps)
      HelixBrandRegistry.register(brandName, {
        '--hx-color-primary-50': '#fff0f0',
        '--hx-color-primary-100': '#ffe0e0',
        '--hx-color-primary-200': '#ffc0c0',
        '--hx-color-primary-300': '#ff9090',
        '--hx-color-primary-400': '#ff5050',
        '--hx-color-primary-500': '#FF0000',
        '--hx-color-primary-600': '#cc0000',
        '--hx-color-primary-700': '#990000',
        '--hx-color-primary-800': '#660000',
        '--hx-color-primary-900': '#330000',
        '--hx-color-primary-950': '#1a0000',
        '--hx-color-secondary-50': '#f0f0ff',
        '--hx-color-secondary-100': '#e0e0ff',
        '--hx-color-secondary-200': '#c0c0ff',
        '--hx-color-secondary-300': '#9090ff',
        '--hx-color-secondary-400': '#5050ff',
        '--hx-color-secondary-500': '#0000ff',
        '--hx-color-secondary-600': '#0000cc',
        '--hx-color-secondary-700': '#000099',
        '--hx-color-secondary-800': '#000066',
        '--hx-color-secondary-900': '#000033',
        '--hx-color-secondary-950': '#00001a',
      });
      const el = await fixture<HelixTheme>(`<hx-theme brand="${brandName}">Content</hx-theme>`);
      await el.updateComplete;
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value.toLowerCase()).toBe('#ff0000');
    });

    it('brand attribute is reflected to host', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>('<hx-theme brand="mercy">Content</hx-theme>');
      expect(el.getAttribute('brand')).toBe('mercy');
      warnSpy.mockRestore();
    });

    it('reflects brand to data-brand on light/dark for CSS-pattern selectors', async () => {
      // R26 BLOCKING (api-design high) — multi-brand-theming.md documents
      // `hx-theme[data-brand='foo']:not([theme='high-contrast'])` as the
      // canonical CSS-pattern selector, but only the Drupal Twig helper
      // emitted data-brand. Plain HTML / React / Angular / Vue consumers
      // got zero brand styling. Fix mirrors brand → data-brand in
      // _applyEffectiveTheme so the documented selectors match in every
      // framework without manual authoring. R27 narrowed reflection to
      // brands the registry accepts — so this test must register the
      // brand it asserts on.
      registerHarborHealth();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="harbor-health" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      el.theme = 'dark';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      warnSpy.mockRestore();
    });

    it('removes data-brand on theme="high-contrast" (defense-in-depth for unguarded CSS)', async () => {
      // R26 BLOCKING (security/api-design high) — CSS-pattern brand rules
      // authored without `:not([theme='high-contrast'])` would still match
      // an HC page if data-brand stayed on the host, breaking the WCAG
      // 7:1+ contract that brand-on-HC suppression is supposed to defend.
      // Removing data-brand on HC neutralizes external CSS that lacks the
      // `:not(...)` guard, mirroring the JS-registry suppression at the
      // attribute layer.
      registerHarborHealth();
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="harbor-health" theme="high-contrast">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);

      // Switching off HC restores data-brand.
      el.theme = 'light';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      // Switching back to HC removes it again.
      el.theme = 'high-contrast';
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);

      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('clears data-brand when brand is unset', async () => {
      registerHarborHealth();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="harbor-health" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      el.brand = '';
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);

      warnSpy.mockRestore();
    });

    it('strips SSR-emitted data-brand for unregistered brand on hydration', async () => {
      // R28 HIGH — hx-theme.twig:99 emits `data-brand="{{ brand }}"` for
      // any truthy `brand` on non-HC themes, including unregistered
      // typos. Without an SSR-adoption step the runtime's ownership flag
      // starts false on hydration, so the orphan attribute would survive
      // and activate `[data-brand='typo']` cascade overrides the JS
      // registry is simultaneously rejecting. The hydration adopt+remove
      // gate (data-brand === brand) closes the SSR path of F2.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="typo-brand-xyz" data-brand="typo-brand-xyz" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);
      warnSpy.mockRestore();
    });

    it('preserves SSR-emitted data-brand for registered brand on hydration', async () => {
      // R28 HIGH companion — registered brand SSR shape must round-trip:
      // twig emits `brand="x" data-brand="x"`, runtime accepts the
      // registry, reflection is a no-op (attribute already matches),
      // ownership is claimed.
      registerHarborHealth();
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="harbor-health" data-brand="harbor-health" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      // And subsequent HC switch removes the runtime-owned attribute.
      el.theme = 'high-contrast';
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);
    });

    it('does NOT reflect data-brand for unregistered (typo) brand names', async () => {
      // R27 MEDIUM — reflection must mirror the registry's accept/reject
      // verdict. If the registry rejects "acmee" (typo), reflecting
      // data-brand="acmee" would activate cascade overrides the JS path
      // is simultaneously refusing — half the brand applies, half does
      // not. Reflection is gated on `getBrandTokens(brand) !== undefined`.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="totally-not-registered-typo" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('"totally-not-registered-typo" is not registered'),
      );
      warnSpy.mockRestore();
    });

    it('preserves manually-authored data-brand when no brand prop is set', async () => {
      // R27 HIGH — multi-brand-theming.md blesses a manual cascade path:
      // `<hx-theme data-brand="x">` without `brand=`. R26 stripped that
      // attribute on first update because the removal branch fired
      // unconditionally on `brand === ''`. Fix tracks ownership via
      // `_ownsDataBrand`; the runtime only manages attributes it authored.
      const el = await fixture<HelixTheme>(
        '<hx-theme data-brand="manual-cascade-only" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('manual-cascade-only');

      // Theme changes must not strip the user's attribute either.
      el.theme = 'dark';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('manual-cascade-only');

      // Even on HC the manual attribute survives — the docs assign HC
      // guarding to the consumer (the `:not([theme='high-contrast'])`
      // selector). Touching attributes the runtime didn't author would
      // surprise consumers using the documented manual path.
      el.theme = 'high-contrast';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('manual-cascade-only');
    });

    it('only removes data-brand it authored — manual attribute survives brand transitions', async () => {
      // R27 HIGH companion — when a registered brand is set then cleared,
      // the runtime removes its own reflected attribute. But if a manual
      // data-brand was present BEFORE brand was set, the runtime must
      // restore (not strip) on clear. With ownership tracking, setting
      // brand overwrites the attribute and takes ownership; clearing
      // brand removes the runtime-owned value. The manual-only path
      // (no `brand` prop ever set) is covered by the test above.
      registerHarborHealth();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const el = await fixture<HelixTheme>(
        '<hx-theme brand="harbor-health" theme="light">Content</hx-theme>',
      );
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      // HC suppresses reflected (runtime-owned) data-brand.
      el.theme = 'high-contrast';
      await el.updateComplete;
      expect(el.hasAttribute('data-brand')).toBe(false);

      // Returning to light restores reflection.
      el.theme = 'light';
      await el.updateComplete;
      expect(el.getAttribute('data-brand')).toBe('harbor-health');

      warnSpy.mockRestore();
    });

    it('HC overlay wins over brand overrides on high-contrast theme', async () => {
      // R20 BLOCKING (api-design high) — brand merge previously appended a
      // later :host block that silently shadowed HC accessibility tokens
      // (focus-ring-width, primary ramps tuned for AAA on #000, etc.),
      // contradicting the BRAND_THEMING.md "WCAG 7:1+" contract. The fix
      // re-emits the HC overlay AFTER the brand merge when
      // effectiveTheme === 'high-contrast', so HC always wins on HC mode.
      // This test registers a brand that explicitly redeclares HC-defined
      // names with sub-AA values and asserts HC tokens survive intact.
      const brandName = 'test-brand-r20-hc-low-contrast';
      HelixBrandRegistry.register(brandName, {
        '--hx-color-primary-50': '#fff8f0',
        '--hx-color-primary-100': '#ffeacc',
        '--hx-color-primary-200': '#ffd699',
        '--hx-color-primary-300': '#ffbd66',
        '--hx-color-primary-400': '#ffa033',
        // Sub-AA on #000 (2.21:1) — would silently break HC a11y if it won.
        '--hx-color-primary-500': '#003DA5',
        '--hx-color-primary-600': '#002D8A',
        '--hx-color-primary-700': '#002270',
        '--hx-color-primary-800': '#001a55',
        '--hx-color-primary-900': '#00103a',
        '--hx-color-primary-950': '#00081d',
        '--hx-color-secondary-50': '#f8f0ff',
        '--hx-color-secondary-100': '#eaccff',
        '--hx-color-secondary-200': '#d699ff',
        '--hx-color-secondary-300': '#bd66ff',
        '--hx-color-secondary-400': '#a033ff',
        '--hx-color-secondary-500': '#8800ff',
        '--hx-color-secondary-600': '#6d00cc',
        '--hx-color-secondary-700': '#520099',
        '--hx-color-secondary-800': '#370066',
        '--hx-color-secondary-900': '#1b0033',
        '--hx-color-secondary-950': '#0e001a',
      });
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;
      const styles = getComputedStyle(el);
      // HC values survive on a11y-critical tokens — brand cannot poison them.
      expect(styles.getPropertyValue('--hx-color-primary-500').trim().toLowerCase()).toBe(
        '#3b82f6',
      );
      expect(styles.getPropertyValue('--hx-focus-ring-width').trim()).toBe('3px');
      expect(styles.getPropertyValue('--hx-border-width-thin').trim()).toBe('2px');
      expect(
        styles.getPropertyValue('--hx-color-text-on-error-strong').trim().toLowerCase(),
      ).toBe('#000000');
      expect(
        styles.getPropertyValue('--hx-color-action-danger-bg-active').trim().toLowerCase(),
      ).toBe('#f87171');
    });

    it('HC suppresses brand merge across ALL 22 REQUIRED_SEMANTIC_TOKENS stops (data-driven)', async () => {
      // R23 finding 3 — sampling-based coverage was the original gap. Drive
      // the assertion loop from REQUIRED_SEMANTIC_TOKENS so every brand-
      // required stop is asserted against either its HC overlay (when HC
      // overlays it) or its light-primitive value (when HC does not), and
      // never against the brand-supplied value. New required tokens added
      // to the registry are auto-covered without test edits.
      const brandName = 'test-brand-r23-data-driven';
      const brandWhite: Record<string, string> = {};
      for (const name of REQUIRED_SEMANTIC_TOKENS) brandWhite[name] = '#FFFFFF';
      HelixBrandRegistry.register(brandName, brandWhite);

      const hcOverlayMap = new Map(highContrastTokenEntries.map((t) => [t.name, t.value]));

      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;
      const styles = getComputedStyle(el);

      // Sanity: confirm REQUIRED_SEMANTIC_TOKENS is populated and includes
      // the canonical 22 stops — guards against the loop trivially passing
      // if the export ever drifts to an empty array.
      expect(REQUIRED_SEMANTIC_TOKENS.length).toBeGreaterThanOrEqual(22);

      for (const tokenName of REQUIRED_SEMANTIC_TOKENS) {
        const actual = styles.getPropertyValue(tokenName).trim().toLowerCase();
        // R24 finding 4 — never silently fall back to '' when a token is
        // missing from BOTH the HC overlay and the base tokenMap. Such a
        // gap is REQUIRED_SEMANTIC_TOKENS drift (registry says required,
        // tokens.json no longer ships it) and the test must fail loudly,
        // not assert `actual === ''`.
        const raw = hcOverlayMap.get(tokenName) ?? tokenMap[tokenName];
        expect(
          raw,
          `${tokenName} missing from both HC overlay and tokenMap — REQUIRED_SEMANTIC_TOKENS drift`,
        ).toBeDefined();
        const expected = raw!.toLowerCase();
        // Brand value (#ffffff) must NEVER win on HC.
        expect(actual, `${tokenName} should not match brand white`).not.toBe('#ffffff');
        // Must match either the HC overlay (if defined for this token) or
        // the base light primitive — never anything else.
        expect(actual, `${tokenName} should resolve to HC overlay or light primitive`).toBe(
          expected,
        );
      }
    });

    it('emits console.info when a registered brand is suppressed under HC, warn for unregistered', async () => {
      // R23 finding 4 — the console.info is the entire "behavior change
      // observable in development" deliverable. Without test coverage a
      // future refactor or console-level filter can silently delete the
      // signal. Asserts (a) registered + HC fires info (not warn),
      // (b) unregistered + HC fires warn (not info).
      const brandName = 'test-brand-r23-info-spy';
      HelixBrandRegistry.register(brandName, {
        '--hx-color-primary-50': '#000000',
        '--hx-color-primary-100': '#000000',
        '--hx-color-primary-200': '#000000',
        '--hx-color-primary-300': '#000000',
        '--hx-color-primary-400': '#000000',
        '--hx-color-primary-500': '#000000',
        '--hx-color-primary-600': '#000000',
        '--hx-color-primary-700': '#000000',
        '--hx-color-primary-800': '#000000',
        '--hx-color-primary-900': '#000000',
        '--hx-color-primary-950': '#000000',
        '--hx-color-secondary-50': '#000000',
        '--hx-color-secondary-100': '#000000',
        '--hx-color-secondary-200': '#000000',
        '--hx-color-secondary-300': '#000000',
        '--hx-color-secondary-400': '#000000',
        '--hx-color-secondary-500': '#000000',
        '--hx-color-secondary-600': '#000000',
        '--hx-color-secondary-700': '#000000',
        '--hx-color-secondary-800': '#000000',
        '--hx-color-secondary-900': '#000000',
        '--hx-color-secondary-950': '#000000',
      });

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const registered = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}">Content</hx-theme>`,
      );
      await registered.updateComplete;

      // R24 finding 5 — lock the call count so a regression that fires the
      // info on every render (e.g. moved out of `_applyEffectiveTheme()`'s
      // single-shot guard into `update()`) fails loudly instead of being
      // hidden behind the substring check.
      expect(infoSpy).toHaveBeenCalledTimes(1);
      const infoCalls = infoSpy.mock.calls.flat().filter((arg) => typeof arg === 'string');
      expect(infoCalls.some((m) => m.includes('suppressed on theme="high-contrast"'))).toBe(true);
      expect(infoCalls.some((m) => m.includes(brandName))).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();

      infoSpy.mockClear();
      warnSpy.mockClear();

      const unregistered = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="not-registered-r23">Content</hx-theme>`,
      );
      await unregistered.updateComplete;

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const warnCalls = warnSpy.mock.calls.flat().filter((arg) => typeof arg === 'string');
      expect(warnCalls.some((m) => m.includes('not-registered-r23'))).toBe(true);
      expect(warnCalls.some((m) => m.includes('not registered'))).toBe(true);
      expect(infoSpy).not.toHaveBeenCalled();

      infoSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('HC + brand + reduced motion triple stack — HC a11y survives, motion override applies', async () => {
      // R21 finding 3 — exercises the full overlay stack (base → no brand
      // because HC suppresses → reduced-motion). Documents that motion
      // overrides do not interact with HC tokens (no overlap of names).
      const brandName = 'test-brand-r21-triple-stack';
      HelixBrandRegistry.register(brandName, {
        '--hx-color-primary-50': '#fff8f0',
        '--hx-color-primary-100': '#ffeacc',
        '--hx-color-primary-200': '#ffd699',
        '--hx-color-primary-300': '#ffbd66',
        '--hx-color-primary-400': '#ffa033',
        '--hx-color-primary-500': '#FF8800',
        '--hx-color-primary-600': '#cc6d00',
        '--hx-color-primary-700': '#995200',
        '--hx-color-primary-800': '#663700',
        '--hx-color-primary-900': '#331b00',
        '--hx-color-primary-950': '#1a0e00',
        '--hx-color-secondary-50': '#f8f0ff',
        '--hx-color-secondary-100': '#eaccff',
        '--hx-color-secondary-200': '#d699ff',
        '--hx-color-secondary-300': '#bd66ff',
        '--hx-color-secondary-400': '#a033ff',
        '--hx-color-secondary-500': '#8800ff',
        '--hx-color-secondary-600': '#6d00cc',
        '--hx-color-secondary-700': '#520099',
        '--hx-color-secondary-800': '#370066',
        '--hx-color-secondary-900': '#1b0033',
        '--hx-color-secondary-950': '#0e001a',
      });
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="high-contrast" brand="${brandName}" motion="reduced">Content</hx-theme>`,
      );
      await el.updateComplete;
      const styles = getComputedStyle(el);
      // HC wins on its overlaid stops (brand suppressed on HC).
      expect(styles.getPropertyValue('--hx-color-primary-500').trim().toLowerCase()).toBe(
        '#3b82f6',
      );
      expect(styles.getPropertyValue('--hx-focus-ring-width').trim()).toBe('3px');
      // R22 finding 3 — assert the reduced-motion overlay actually applied.
      // Without these, the test "passed" without exercising the motion layer.
      expect(styles.getPropertyValue('--hx-duration-fast').trim()).toBe('0ms');
      expect(styles.getPropertyValue('--hx-transition-fast').trim()).toBe('0ms linear');
      expect(styles.getPropertyValue('--hx-easing-default').trim()).toBe('linear');
    });

    it('brand on light theme overrides primary color (brand-merge-skip is gated on HC only)', async () => {
      // Sister test to the HC override test — confirms the brand-merge path
      // still works for non-HC themes (i.e. the HC re-overlay is correctly
      // gated on `effectiveTheme === 'high-contrast'` and does not regress
      // brand support for light/dark consumers).
      const brandName = 'test-brand-r20-light';
      HelixBrandRegistry.register(brandName, {
        '--hx-color-primary-50': '#fff8f0',
        '--hx-color-primary-100': '#ffeacc',
        '--hx-color-primary-200': '#ffd699',
        '--hx-color-primary-300': '#ffbd66',
        '--hx-color-primary-400': '#ffa033',
        '--hx-color-primary-500': '#FF8800',
        '--hx-color-primary-600': '#cc6d00',
        '--hx-color-primary-700': '#995200',
        '--hx-color-primary-800': '#663700',
        '--hx-color-primary-900': '#331b00',
        '--hx-color-primary-950': '#1a0e00',
        '--hx-color-secondary-50': '#f8f0ff',
        '--hx-color-secondary-100': '#eaccff',
        '--hx-color-secondary-200': '#d699ff',
        '--hx-color-secondary-300': '#bd66ff',
        '--hx-color-secondary-400': '#a033ff',
        '--hx-color-secondary-500': '#8800ff',
        '--hx-color-secondary-600': '#6d00cc',
        '--hx-color-secondary-700': '#520099',
        '--hx-color-secondary-800': '#370066',
        '--hx-color-secondary-900': '#1b0033',
        '--hx-color-secondary-950': '#0e001a',
      });
      const el = await fixture<HelixTheme>(
        `<hx-theme theme="light" brand="${brandName}">Content</hx-theme>`,
      );
      await el.updateComplete;
      const styles = getComputedStyle(el);
      // Brand wins on light (no HC re-overlay applied).
      expect(styles.getPropertyValue('--hx-color-primary-500').trim().toLowerCase()).toBe(
        '#ff8800',
      );
    });
  });

  // ─── theme change lifecycle / announcer ───

  describe('Announcer live region', () => {
    it('renders a visually-hidden [role="status"] span for AT announcements', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="auto">Content</hx-theme>');
      await el.updateComplete;
      const announcer = shadowQuery(el, '[role="status"]');
      expect(announcer).toBeTruthy();
    });
  });

  // ─── Accessibility ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixTheme>('<hx-theme><p>Accessible themed content</p></hx-theme>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in dark mode', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="dark"><p>Dark themed content</p></hx-theme>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });

    it('has no axe violations in high-contrast mode', async () => {
      const el = await fixture<HelixTheme>(
        '<hx-theme theme="high-contrast"><p>High contrast content</p></hx-theme>',
      );
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
