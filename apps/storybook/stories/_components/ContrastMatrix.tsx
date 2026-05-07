import * as React from 'react';
/*
 * Contrast telemetry imported from `@helixui/tokens/contrast-data` — a
 * committed, strongly-typed module emitted by the contrast:report script
 * alongside the gitignored `.cache/contrast-report.json` inspection
 * artefact. Importing the committed TS module (instead of the cache JSON)
 * means Storybook builds in CI work without first running the generator,
 * which is the only way the docs site can reliably ship.
 *
 * Regenerate via `pnpm --filter=@helixui/tokens run contrast:report` —
 * the script writes both `src/__generated__/contrast-report.ts` (committed)
 * and `.cache/contrast-report.json` (ad-hoc inspection only) in lockstep.
 *
 * This static report is the *extraction-quality contract* downstream
 * consumers depend on — it's deterministic for a given (tokens.json,
 * contrast-helpers.ts) tuple and lives in the published package. When
 * the matrix is rendered in `live` mode the static report is still used
 * as the *pair list*, but every pair's `surfaceHex`, `textHex`, `ratio`,
 * and `classification` is recomputed against the active CSS cascade so
 * brand swaps in the Storybook toolbar reflect immediately.
 */
import { contrastReport } from '@helixui/tokens/contrast-data';
import { TokenRef } from './TokenRef';
import { contrastRatio, cssColorToHex } from './contrast';
import { useResolvedTokens } from './useResolvedToken';

/**
 * ContrastMatrix — renders the Phase 1 contrast-report data as a
 * styled table, color-graded with AAA / AA / sub-AA pills.
 *
 * Source:
 *   @helixui/tokens/contrast-data — committed TS module
 *   (regenerate via `pnpm --filter=@helixui/tokens run contrast:report`)
 *
 * Each row pairs a text token with a surface token across the active
 * mode. The classification field comes from the generator and reflects
 * the WCAG 2.1 thresholds:
 *   aaa     — ratio >= 7.0
 *   aa      — ratio >= 4.5
 *   subAA   — below 4.5 (none ship; presence here is a defect signal)
 *
 * Two render modes:
 *   static (default) — all modes side by side, values from the committed
 *     report. This is the contract published with the tokens package.
 *   live             — only the currently active mode (read from
 *     `data-theme` on `<html>`), pairs recomputed from `getComputedStyle`
 *     so brand swaps in the toolbar reflect immediately.
 */

type Classification = 'aaa' | 'aa' | 'subAA';

interface Pair {
  text: string;
  surface: string;
  label: string;
  textHex: string;
  surfaceHex: string;
  ratio: number;
  threshold: number;
  aaaThreshold: number;
  classification: Classification;
}

interface ModeData {
  summary: { aaa: number; aa: number; subAA: number; total: number };
  pairs: Pair[];
}

interface Report {
  generatedAt: string;
  tokenVersion: string;
  modes: { light: ModeData; dark: ModeData; 'high-contrast': ModeData };
}

const report = contrastReport as unknown as Report;

const MODE_LABELS: Record<keyof Report['modes'], string> = {
  light: 'Light',
  dark: 'Dark',
  'high-contrast': 'High contrast',
};

const ALL_MODES: Array<keyof Report['modes']> = ['light', 'dark', 'high-contrast'];

function gradeForClassification(c: Classification): 'AAA' | 'AA' | 'Fail' {
  if (c === 'aaa') return 'AAA';
  if (c === 'aa') return 'AA';
  return 'Fail';
}

function classifyRatio(ratio: number, aaaThreshold: number, threshold: number): Classification {
  if (ratio >= aaaThreshold) return 'aaa';
  if (ratio >= threshold) return 'aa';
  return 'subAA';
}

/**
 * Read the active theme/brand attributes from <html>, with SSR guards
 * and a MutationObserver subscription so the component re-renders when
 * the toolbar flips them.
 */
function useActiveCascade(): { theme: keyof Report['modes']; brand: string } {
  const [state, setState] = React.useState<{ theme: keyof Report['modes']; brand: string }>(() => {
    if (typeof window === 'undefined') return { theme: 'light', brand: 'apex' };
    const html = document.documentElement;
    const theme = (html.getAttribute('data-theme') as keyof Report['modes'] | null) ?? 'light';
    const brand = html.getAttribute('data-brand') ?? 'apex';
    return { theme, brand };
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const html = document.documentElement;
    const update = () => {
      const theme = (html.getAttribute('data-theme') as keyof Report['modes'] | null) ?? 'light';
      const brand = html.getAttribute('data-brand') ?? 'apex';
      setState((prev) => (prev.theme === theme && prev.brand === brand ? prev : { theme, brand }));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme', 'data-brand'] });
    return () => observer.disconnect();
  }, []);

  return state;
}

export interface ContrastMatrixProps {
  /**
   * Mode to show in static rendering. Defaults to all three rendered as
   * separate sections. Ignored when `live` is true.
   */
  mode?: keyof Report['modes'];
  /**
   * When true, render only the currently active mode and recompute each
   * pair's hex values, ratio, and classification from the live CSS
   * cascade. Defaults to false (static / extraction-quality contract).
   */
  live?: boolean;
}

interface MatrixSectionProps {
  modeKey: keyof Report['modes'];
  modeLabel: string;
  data: ModeData;
  badge?: React.ReactNode;
}

function MatrixSection({ modeKey, modeLabel, data, badge }: MatrixSectionProps) {
  return (
    <section className="hx-docs-matrix-section" data-mode={modeKey}>
      <header className="hx-docs-matrix-header">
        <h3 className="hx-docs-matrix-title">{modeLabel}</h3>
        <div className="hx-docs-matrix-summary">
          <span className="hx-docs-grade-pill" data-grade="AAA">
            AAA · {data.summary.aaa}
          </span>
          <span className="hx-docs-grade-pill" data-grade="AA">
            AA · {data.summary.aa}
          </span>
          {data.summary.subAA > 0 ? (
            <span className="hx-docs-grade-pill" data-grade="Fail">
              sub-AA · {data.summary.subAA}
            </span>
          ) : null}
          <span className="hx-docs-matrix-total">{data.summary.total} pairs</span>
          {badge}
        </div>
      </header>
      <div className="hx-docs-matrix-table-wrap">
        <table className="hx-docs-matrix-table">
          <thead>
            <tr>
              <th scope="col">Pair</th>
              <th scope="col">Text</th>
              <th scope="col">Surface</th>
              <th scope="col">Ratio</th>
              <th scope="col">Grade</th>
            </tr>
          </thead>
          <tbody>
            {data.pairs.map((p) => {
              const grade = gradeForClassification(p.classification);
              return (
                <tr key={`${p.text}__${p.surface}`}>
                  <td className="hx-docs-matrix-pair-cell">
                    <span
                      className="hx-docs-matrix-swatch"
                      style={{ background: p.surfaceHex, color: p.textHex }}
                      aria-hidden="true"
                    >
                      Aa
                    </span>
                    <span className="hx-docs-matrix-pair-label">{p.label}</span>
                  </td>
                  <td>
                    <TokenRef token={p.text} />
                  </td>
                  <td>
                    <TokenRef token={p.surface} />
                  </td>
                  <td className="hx-docs-matrix-ratio">
                    {p.ratio.toFixed(p.ratio >= 10 ? 1 : 2)}
                    <small>:1</small>
                  </td>
                  <td>
                    <span className="hx-docs-grade-pill" data-grade={grade}>
                      {grade}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

interface LiveMatrixSectionProps {
  modeKey: keyof Report['modes'];
  brand: string;
  baselinePairs: readonly Pair[];
}

function LiveMatrixSection({ modeKey, brand, baselinePairs }: LiveMatrixSectionProps) {
  // Build a stable, deduped list of every token referenced across the
  // baseline pairs (text + surface) so we can subscribe with a single
  // useResolvedTokens call. The order is referentially stable across
  // renders for a fixed pair list, which is what the hook expects.
  const tokenList = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const p of baselinePairs) {
      if (!seen.has(p.text)) {
        seen.add(p.text);
        list.push(p.text);
      }
      if (!seen.has(p.surface)) {
        seen.add(p.surface);
        list.push(p.surface);
      }
    }
    return list;
  }, [baselinePairs]);

  const resolvedValues = useResolvedTokens(tokenList);

  const livePairs = React.useMemo<Pair[]>(() => {
    const lookup = new Map<string, string>();
    tokenList.forEach((name, i) => lookup.set(name, resolvedValues[i] ?? ''));
    return baselinePairs.map((p) => {
      const surfaceRaw = lookup.get(p.surface) ?? '';
      const textRaw = lookup.get(p.text) ?? '';
      const surfaceHex = cssColorToHex(surfaceRaw) || p.surfaceHex;
      const textHex = cssColorToHex(textRaw) || p.textHex;
      const ratio = contrastRatio(surfaceRaw, textRaw);
      const safeRatio = Number.isFinite(ratio) && ratio >= 1 ? ratio : p.ratio;
      const classification = classifyRatio(safeRatio, p.aaaThreshold, p.threshold);
      return {
        ...p,
        surfaceHex,
        textHex,
        ratio: safeRatio,
        classification,
      };
    });
  }, [baselinePairs, resolvedValues, tokenList]);

  const summary = React.useMemo(() => {
    let aaa = 0;
    let aa = 0;
    let subAA = 0;
    for (const p of livePairs) {
      if (p.classification === 'aaa') aaa++;
      else if (p.classification === 'aa') aa++;
      else subAA++;
    }
    return { aaa, aa, subAA, total: livePairs.length };
  }, [livePairs]);

  const badge = (
    <span
      className="hx-docs-matrix-total"
      title="Recomputed from getComputedStyle on the active cascade"
    >
      Live · {brand}
    </span>
  );

  return (
    <MatrixSection
      modeKey={modeKey}
      modeLabel={`${MODE_LABELS[modeKey]} (live)`}
      data={{ summary, pairs: livePairs }}
      badge={badge}
    />
  );
}

export function ContrastMatrix({ mode, live = false }: ContrastMatrixProps) {
  const cascade = useActiveCascade();

  if (live) {
    // Live mode: only the active theme is reflected in the cascade, so
    // pin to it. The baseline pair list still comes from the committed
    // report so the row identity / token contract stays stable.
    const activeMode: keyof Report['modes'] = report.modes[cascade.theme] ? cascade.theme : 'light';
    const baselinePairs = report.modes[activeMode].pairs;
    return (
      <div className="hx-docs-matrix-stack">
        <LiveMatrixSection
          modeKey={activeMode}
          brand={cascade.brand}
          baselinePairs={baselinePairs}
        />
      </div>
    );
  }

  const modes = mode ? ([mode] as Array<keyof Report['modes']>) : ALL_MODES;
  return (
    <div className="hx-docs-matrix-stack">
      {modes.map((m) => (
        <MatrixSection key={m} modeKey={m} modeLabel={MODE_LABELS[m]} data={report.modes[m]} />
      ))}
    </div>
  );
}
