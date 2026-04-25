/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import tokens from '../tokens.json';
import {
  extractComponentTokens,
  extractTokenNamesFromSource,
} from '../../../../scripts/extract-component-tokens.ts';

/**
 * Sync gate between the per-component design tokens authored inline in
 * `@helixui/library`'s `.styles.ts` files and the `component:` manifest in
 * `packages/hx-tokens/src/tokens.json`.
 *
 * The `component:` block in tokens.json is documentation only — it is NOT
 * emitted to CSS (see `scripts/generate-css.ts`). Component tokens stay
 * authored inline so the cascade-driven "undefined unless overridden"
 * semantics are preserved. This test ensures the manifest never drifts from
 * the truth.
 *
 * Failure modes:
 *   - "in styles.ts but missing from manifest": developer added a new token
 *     in a component but didn't update `tokens.json` (re-run
 *     `pnpm exec tsx scripts/extract-component-tokens.ts > /tmp/m.json`
 *     and copy the relevant entries into the `component:` block).
 *   - "in manifest but missing from styles.ts": the manifest has stale
 *     entries that no component declares anymore. Either the inline token
 *     was removed/renamed (update the manifest) or the manifest was edited
 *     by hand without a corresponding code change.
 */

interface TokensJsonShape {
  component?: Record<string, Record<string, unknown> | string>;
}

function manifestFromJson(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const block = (tokens as TokensJsonShape).component;
  if (!block) return out;
  for (const [comp, tokensForComp] of Object.entries(block)) {
    if (comp.startsWith('_')) continue; // skip _comment
    if (typeof tokensForComp !== 'object' || tokensForComp === null) continue;
    out.set(comp, new Set(Object.keys(tokensForComp)));
  }
  return out;
}

function manifestFromStyles(): Map<string, Set<string>> {
  const live = extractComponentTokens();
  const out = new Map<string, Set<string>>();
  for (const [comp, list] of Object.entries(live)) {
    out.set(comp, new Set(list));
  }
  return out;
}

function diffSets<T>(a: Set<T>, b: Set<T>): { aOnly: T[]; bOnly: T[] } {
  const aOnly: T[] = [];
  const bOnly: T[] = [];
  for (const x of a) if (!b.has(x)) aOnly.push(x);
  for (const x of b) if (!a.has(x)) bOnly.push(x);
  return { aOnly: aOnly.sort(), bOnly: bOnly.sort() };
}

describe('component token manifest sync', () => {
  it('the set of components in tokens.json matches the set extracted from .styles.ts', () => {
    const fromJson = manifestFromJson();
    const fromStyles = manifestFromStyles();

    const jsonComps = new Set(fromJson.keys());
    const stylesComps = new Set(fromStyles.keys());
    const { aOnly: inStylesOnly, bOnly: inJsonOnly } = diffSets(stylesComps, jsonComps);

    if (inStylesOnly.length > 0 || inJsonOnly.length > 0) {
      const lines: string[] = [];
      if (inStylesOnly.length > 0) {
        lines.push(
          `Components in styles.ts but missing from tokens.json#component:\n  - ${inStylesOnly.join('\n  - ')}`,
        );
      }
      if (inJsonOnly.length > 0) {
        lines.push(
          `Components in tokens.json#component but missing from styles.ts:\n  - ${inJsonOnly.join('\n  - ')}`,
        );
      }
      throw new Error(`Component-manifest drift detected:\n${lines.join('\n\n')}`);
    }

    expect(inStylesOnly).toEqual([]);
    expect(inJsonOnly).toEqual([]);
  });

  it('every per-component token set in tokens.json matches the set declared in that component .styles.ts', () => {
    const fromJson = manifestFromJson();
    const fromStyles = manifestFromStyles();

    const allComps = new Set<string>([...fromJson.keys(), ...fromStyles.keys()]);
    const driftReports: string[] = [];

    for (const comp of [...allComps].sort()) {
      const jsonTokens = fromJson.get(comp) ?? new Set<string>();
      const styleTokens = fromStyles.get(comp) ?? new Set<string>();
      const { aOnly: inStylesOnly, bOnly: inJsonOnly } = diffSets(styleTokens, jsonTokens);
      if (inStylesOnly.length === 0 && inJsonOnly.length === 0) continue;

      const lines: string[] = [`  ${comp}:`];
      if (inStylesOnly.length > 0) {
        lines.push(`    in styles.ts but missing from manifest:`);
        for (const t of inStylesOnly) lines.push(`      - ${t}`);
      }
      if (inJsonOnly.length > 0) {
        lines.push(`    in manifest but missing from styles.ts:`);
        for (const t of inJsonOnly) lines.push(`      - ${t}`);
      }
      driftReports.push(lines.join('\n'));
    }

    if (driftReports.length > 0) {
      throw new Error(
        `Component-manifest token drift detected:\n${driftReports.join('\n\n')}\n\n` +
          `Run \`pnpm exec tsx scripts/extract-component-tokens.ts\` to print the live ` +
          `manifest, then sync the \`component:\` block in tokens.json.`,
      );
    }

    expect(driftReports).toEqual([]);
  });

  it('the manifest is non-empty (sanity)', () => {
    const fromJson = manifestFromJson();
    expect(fromJson.size).toBeGreaterThan(50);
    const totalTokens = [...fromJson.values()].reduce((sum, s) => sum + s.size, 0);
    expect(totalTokens).toBeGreaterThan(500);
  });
});

describe('extractTokenNamesFromSource — comment stripping', () => {
  it('does not extract tokens that appear only inside block comments', () => {
    const src = `
      /* TODO: future spec mentions var(--hx-toast-future-prop, 0) */
      .x { color: var(--hx-real-prop, red); }
    `;
    const found = extractTokenNamesFromSource(src);
    expect(found.has('--hx-real-prop')).toBe(true);
    expect(found.has('--hx-toast-future-prop')).toBe(false);
  });

  it('does not extract tokens that appear only inside line comments', () => {
    const src = `
      // legacy: var(--hx-old-prop, 0) — kept for archeology
      .y { background: var(--hx-actual-prop, blue); }
    `;
    const found = extractTokenNamesFromSource(src);
    expect(found.has('--hx-actual-prop')).toBe(true);
    expect(found.has('--hx-old-prop')).toBe(false);
  });

  it('still extracts token declarations outside comments', () => {
    const src = `
      /* docs: --hx-doc-only: foo; */
      :host { --hx-declared: 1px; }
    `;
    const found = extractTokenNamesFromSource(src);
    expect(found.has('--hx-declared')).toBe(true);
    expect(found.has('--hx-doc-only')).toBe(false);
  });
});
