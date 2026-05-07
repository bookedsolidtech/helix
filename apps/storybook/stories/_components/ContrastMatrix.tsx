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
 */
import { contrastReport } from '@helixui/tokens/contrast-data';
import { TokenRef } from './TokenRef';

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

function gradeForClassification(c: Classification): 'AAA' | 'AA' | 'Fail' {
  if (c === 'aaa') return 'AAA';
  if (c === 'aa') return 'AA';
  return 'Fail';
}

export interface ContrastMatrixProps {
  /** Mode to show. Defaults to all three rendered as separate sections. */
  mode?: keyof Report['modes'];
}

export function ContrastMatrix({ mode }: ContrastMatrixProps) {
  const modes = mode
    ? ([mode] as Array<keyof Report['modes']>)
    : (Object.keys(report.modes) as Array<keyof Report['modes']>);

  return (
    <div className="hx-docs-matrix-stack">
      {modes.map((m) => {
        const data = report.modes[m];
        return (
          <section key={m} className="hx-docs-matrix-section" data-mode={m}>
            <header className="hx-docs-matrix-header">
              <h3 className="hx-docs-matrix-title">{MODE_LABELS[m]}</h3>
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
      })}
    </div>
  );
}
