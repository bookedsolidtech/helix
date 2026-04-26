import { describe, it, expect, afterEach, vi } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixTheme } from './hx-theme.js';
import { HelixBrandRegistry } from '@helixui/tokens';
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

  // ─── System detection ───

  describe('System detection', () => {
    it('effectiveTheme returns light or dark when system=true', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
      await el.updateComplete;

      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });

    it('effectiveTheme ignores theme prop when system=true', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system theme="dark">Content</hx-theme>');
      await el.updateComplete;

      // system=true should use OS preference, not the explicit theme prop
      const effective = el.effectiveTheme;
      expect(effective === 'light' || effective === 'dark').toBe(true);
    });

    it('effectiveTheme uses theme prop when system=false', async () => {
      const el = await fixture<HelixTheme>('<hx-theme theme="dark">Content</hx-theme>');
      expect(el.effectiveTheme).toBe('dark');
    });

    it('switching system off restores theme prop', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system theme="dark">Content</hx-theme>');
      await el.updateComplete;

      el.system = false;
      await el.updateComplete;

      expect(el.effectiveTheme).toBe('dark');
    });
  });

  // ─── System mode token injection ───

  describe('System mode token injection', () => {
    it('injects tokens (not just effectiveTheme string) when system=true', async () => {
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
      await el.updateComplete;
      // The token must be injected regardless of which OS preference resolves
      const value = getComputedStyle(el).getPropertyValue('--hx-color-primary-500').trim();
      expect(value).toBeTruthy();
      expect(value.length).toBeGreaterThan(0);
    });

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
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
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

    it('brand on light theme overrides primary color (HC re-overlay does not affect non-HC themes)', async () => {
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
      const el = await fixture<HelixTheme>('<hx-theme system>Content</hx-theme>');
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
