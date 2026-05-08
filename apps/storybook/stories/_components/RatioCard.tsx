import * as React from 'react';

/**
 * Contrast ratio card — pair label, big numeric ratio, color-coded grade pill.
 * Lifted from /Users/himerus/Downloads/dist/patterns/13-a11y.html:23-49.
 *
 * Wrap in `<div className="hx-docs-ratio-grid">…</div>` for the auto-fit grid.
 */
export type ContrastGrade = 'AAA' | 'AA' | 'AA-large' | 'Fail';

export interface RatioCardProps {
  /** Token pair label (e.g. `text.primary on surface.default`). */
  pair: string;
  /** Computed contrast ratio (e.g. `19.6`). */
  ratio: number;
  /** WCAG grade — drives the pill color. */
  grade: ContrastGrade;
  /** Optional context line below the ratio (e.g. `body text · 14px`). */
  context?: string;
}

export function RatioCard({ pair, ratio, grade, context }: RatioCardProps) {
  return (
    <div className="hx-docs-ratio-card">
      <span className="hx-docs-grade-pill" data-grade={grade}>
        {grade}
      </span>
      <div className="hx-docs-ratio-num">
        {ratio.toFixed(ratio >= 10 ? 1 : 2)}
        <small>:1</small>
      </div>
      <div className="hx-docs-ratio-pair">{pair}</div>
      {context ? <div className="hx-docs-ratio-pair">{context}</div> : null}
    </div>
  );
}
