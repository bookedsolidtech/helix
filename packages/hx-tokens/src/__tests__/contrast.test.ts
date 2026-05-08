/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest';
import { aaaThresholdForRole } from '../aaa-thresholds.js';
import tokens from '../tokens.json';
import {
  ALL_MODES,
  PAIRS,
  buildModeMap,
  contrastRatio,
  resolveToHex,
} from './contrast-helpers.js';

/**
 * Contrast regression matrix.
 *
 * Permanent CI net for WCAG 2.1 AA compliance of every semantically valid
 * `text.* × surface.*` pairing across all three modes (light, dark,
 * high-contrast).
 *
 * Motivation: the 3.2.0 palette flip surfaced an AA failure where
 * `text.on-success` was rendering white-on-success-500 at 2.8:1 — well below
 * the 4.5:1 body-text floor. That bug class (a palette tweak silently breaks
 * an on-color pairing) is exactly what this matrix gates against. Any future
 * palette change that drops a semantic pair below AA fails this test before
 * it can land.
 *
 * Algorithm
 * ---------
 * 1. Build a flat token map per mode by merging the base `color.*` block with
 *    the mode-specific override block (`dark.color.*` for dark,
 *    `high-contrast.color.*` for HC). HC overrides take precedence over dark
 *    overrides over base.
 * 2. For each mode, walk a curated list of semantically valid
 *    `(textToken, surfaceToken, threshold)` triples (see PAIRS in
 *    contrast-helpers.ts). "Surface" can be either a real `surface.*` token
 *    or the brand `*-500` background that an `on-*` text is meant to sit on
 *    (e.g. `on-success` pairs with `success-500`).
 * 3. Resolve both ends of the pair to a hex literal by following
 *    `var(--hx-color-...)` references through the mode's flat token map.
 * 4. Compute WCAG 2.0 contrast ratio. Assert ratio >= threshold (4.5 for body
 *    text, 3.0 for large text / UI components).
 *
 * AAA pass/fail (7.0 body, 4.5 large) is logged via `console.info` for
 * informational purposes but does not gate the test. AA is the floor;
 * dropping AAA is acceptable when there's a design tradeoff, dropping AA is
 * never acceptable. The persisted machine-readable AAA report lives in
 * `.cache/contrast-report.json` and `CONTRAST-REPORT.md` (run
 * `pnpm --filter=@helixui/tokens run contrast:report`).
 *
 * If a pair fails unexpectedly, that is a real palette bug — investigate the
 * resolved hex values, do not just relax the threshold.
 */

// ---------------------------------------------------------------------------
// Test bodies
// ---------------------------------------------------------------------------

interface AaaResult {
  mode: string;
  label: string;
  threshold: number;
  ratio: number;
  aaaThreshold: number;
}

const aaaMisses: AaaResult[] = [];

describe('contrast regression matrix (WCAG 2.1 AA)', () => {
  for (const mode of ALL_MODES) {
    const modeMap = buildModeMap(mode);
    describe(`${mode} mode`, () => {
      for (const pair of PAIRS) {
        const modes = pair.modes ?? ALL_MODES;
        if (!modes.includes(mode)) continue;

        it(`${pair.label} in ${mode} meets ${pair.threshold}:1`, () => {
          const textHex = resolveToHex(pair.text, modeMap, mode);
          const surfaceHex = resolveToHex(pair.surface, modeMap, mode);
          const ratio = contrastRatio(textHex, surfaceHex);

          // Track AAA misses for an informational summary. Threshold is
          // role-aware per WCAG 2.1 1.4.6: body-text 7:1, large-text 4.5:1,
          // ui-element 3:1 (1.4.11 floor — no AAA tier above).
          const aaaThreshold = aaaThresholdForRole(pair.role ?? 'body-text');
          if (ratio < aaaThreshold) {
            aaaMisses.push({
              mode,
              label: pair.label,
              threshold: pair.threshold,
              ratio,
              aaaThreshold,
            });
          }

          expect(
            ratio,
            `${pair.label} in ${mode}: ${textHex} on ${surfaceHex} = ${ratio.toFixed(
              2,
            )}:1, below WCAG AA threshold ${pair.threshold}:1`,
          ).toBeGreaterThanOrEqual(pair.threshold);
        });
      }
    });
  }

  it('matrix coverage (sanity)', () => {
    // Pairs grow with the matrix; 70 is the floor (was originally 26
    // pair-specs => 77 assertions). Extending the matrix should never
    // shrink the assertion count below this floor.
    let total = 0;
    for (const pair of PAIRS) {
      total += (pair.modes ?? ALL_MODES).length;
    }
    expect(total).toBeGreaterThanOrEqual(70);
  });

  it('AAA summary (informational; never gates)', () => {
    // Logged as info — never fails, just visible in CI output. Useful as a
    // health signal: if AAA-miss count grows, we're drifting toward minimum
    // AA across the board.
    const total = PAIRS.reduce((sum, p) => sum + (p.modes ?? ALL_MODES).length, 0);
    const passing = total - aaaMisses.length;
    // eslint-disable-next-line no-console
    console.info(
      `[contrast matrix] AAA: ${passing}/${total} pairs meet WCAG AAA. ${aaaMisses.length} pairs at AA but below AAA (acceptable; AA is the gate).`,
    );
    if (aaaMisses.length > 0) {
      for (const m of aaaMisses) {
        // eslint-disable-next-line no-console
        console.info(
          `  - ${m.label} [${m.mode}]: ${m.ratio.toFixed(2)}:1 (AA ${m.threshold}:1, AAA ${m.aaaThreshold}:1)`,
        );
      }
    }
    expect(true).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Description-ratio drift gate.
  //
  // Token descriptions cite WCAG ratios as prose (e.g. "neutral-700 (#313E4B)
  // on surface.default (#FFFFFF) = 10.93:1"). Those strings ship to consumers
  // (Figma plugin, design tooling, contrast auditors that read tokens.json
  // directly) and drift silently when a palette stop or pairing changes. The
  // round-7 → round-8 codex loop caught five rounds of this exact bug class.
  //
  // This gate parses every "(#FG_HEX) ... (#BG_HEX) ... = N.NN:1" triple in
  // every description, computes the actual contrast, and asserts the cited
  // ratio matches within ±0.05 (one decimal of WCAG rounding tolerance).
  //
  // Triples are extracted only when both hexes appear in parens close to the
  // ratio — descriptions citing token names without explicit hex pairs are
  // skipped (no ground truth to check). The tolerance accounts for the fact
  // that descriptions are hand-rounded; anything off by more than 0.05 is
  // either a typo or a stale value from a prior palette generation.
  // -------------------------------------------------------------------------
  it('description ratios match computed contrast', () => {
    const tokensJson = JSON.stringify(tokens);
    type Cite = { fg: string; bg: string; cited: number; path: string };
    const cites: Cite[] = [];
    // Descriptions live as JSON-escaped strings in the stringified blob; walk
    // each "description": "..." entry to keep error messages tied to a path.
    const descRe = /"description":\s*"((?:\\"|[^"])*)"/g;
    let descMatch: RegExpExecArray | null;
    while ((descMatch = descRe.exec(tokensJson)) !== null) {
      const desc = descMatch[1];
      // Canonical citation form: "(#FG) on TOKEN (#BG) = N.NN:1" or
      // "(#FG) on TOKEN (TOKEN-NAME, #BG) = N.NN:1". Tightly anchored to
      // avoid matching prose like "(#FG-A) drops to N:1 and on (#FG-B) to N:1.
      // text on TOKEN = N.NN:1" where the regex would otherwise capture
      // FG-B as fg and the unrelated `= N.NN:1` as the ratio.
      //
      // The middle disallows parens and equals, so the BG hex must be the
      // first parenthesized hex after " on TOKEN " and the ratio must be the
      // first "= N.NN:1" after that. Prose mixing token-name and explicit-hex
      // citations (e.g. "neutral-0 on primary-600 = 5.82:1" without parens
      // around the FG) is correctly skipped — no parenthesized FG, no triple.
      const tripleRe =
        /\(#([0-9A-Fa-f]{6})\)\s+on\s+[^()=]+\([^()=]*?#([0-9A-Fa-f]{6})\s*\)\s*=\s*(\d+\.\d{1,2}):1/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tripleRe.exec(desc)) !== null) {
        cites.push({
          fg: '#' + tMatch[1].toUpperCase(),
          bg: '#' + tMatch[2].toUpperCase(),
          cited: parseFloat(tMatch[3]),
          path: desc.slice(0, 60).replace(/\s+/g, ' ') + '…',
        });
      }
    }

    expect(
      cites.length,
      'no description ratio triples extracted — regex broke or descriptions removed',
    ).toBeGreaterThan(0);

    const drift: string[] = [];
    for (const c of cites) {
      const actual = contrastRatio(c.fg, c.bg);
      if (Math.abs(actual - c.cited) > 0.05) {
        drift.push(
          `${c.fg} on ${c.bg}: cited ${c.cited.toFixed(2)}:1, actual ${actual.toFixed(2)}:1 (description: "${c.path}")`,
        );
      }
    }
    expect(drift, `description ratio drift:\n  ${drift.join('\n  ')}`).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // 3.2.2 round-8/12 structural lock for the on-dark border + overlay family.
  //
  // Codex round-8 finding #2: border.on-dark-default (overlay-white-30) and
  // border.on-dark-subtle (overlay-white-10) lived in the border.* namespace
  // but their alpha (≤30%) cannot honour the WCAG 1.4.11 3:1 floor against
  // either surface.default or surface.inverse — they were always used as
  // translucent FILLS (inverted-secondary/ghost/tertiary hover bg), never
  // as borders. They were renamed to surface.on-dark-overlay-{default,
  // subtle}; only the strong tier (overlay-white-70 ≈ 5:1) survived as a
  // genuine border that can stand on its own.
  //
  // Round-11 attempted to add deprecated *aliases* under border.on-dark-
  // {default,subtle} at the token tier so consumer overrides on the published
  // CSS variable names from 3.2.0/3.2.1 would still reach paint. Round-12
  // proved that approach broken: a :root-level alias `:root { --A: var(--B) }`
  // freezes --A to :root's --B at computed-value time per CSS Custom
  // Properties §3, so a host-scoped override on the canonical name (--B) is
  // shadowed by the :root-resolved value of --A. Backwards compatibility is
  // therefore preserved at the *consume sites* instead — every component rule
  // that paints with surface.on-dark-overlay-* reads
  //   var(--hx-color-border-on-dark-*, var(--hx-color-surface-on-dark-overlay-*, …))
  // so consumer overrides on either name reach paint.
  //
  // The structural lock therefore asserts:
  //   border.on-dark-* contains ONLY 'on-dark-strong' (the surviving genuine
  //     border with WCAG 1.4.11 headroom). The deprecated default/subtle
  //     names are NOT emitted at :root.
  //   surface.on-dark-overlay-* contains exactly the renamed translucent-
  //     fill pair across every tier.
  // -------------------------------------------------------------------------
  it('border.on-dark-* shape: strong-only (round-8/12 lock)', () => {
    type TokenLike = { value?: string };
    type TierShape = {
      border?: Record<string, TokenLike>;
      surface?: Record<string, TokenLike>;
    };
    const tiers: Array<{ name: string; tier: TierShape }> = [
      { name: 'base', tier: (tokens as { color: TierShape }).color },
      { name: 'dark', tier: (tokens as { dark: { color: TierShape } }).dark.color },
      {
        name: 'high-contrast',
        tier: (tokens as { 'high-contrast': { color: TierShape } })['high-contrast'].color,
      },
    ];

    for (const { name, tier } of tiers) {
      const onDarkBorderKeys = Object.keys(tier.border ?? {})
        .filter((k) => k.startsWith('on-dark-'))
        .sort();
      expect(onDarkBorderKeys, `${name}.color.border.on-dark-* shape`).toEqual([
        'on-dark-strong',
      ]);

      // surface.on-dark-overlay-{default,subtle}: both must exist in every
      // tier, since runtime mode-flip depends on the dark + HC overrides
      // being present (the base values resolve to overlay-white-* which
      // disappears against the now-light surface.inverse in dark mode and
      // collapses to invisible on the HC #000 canvas).
      const onDarkOverlayKeys = Object.keys(tier.surface ?? {})
        .filter((k) => k.startsWith('on-dark-overlay-'))
        .sort();
      expect(onDarkOverlayKeys, `${name}.color.surface.on-dark-overlay-* shape`).toEqual([
        'on-dark-overlay-default',
        'on-dark-overlay-subtle',
      ]);
    }
  });
});
