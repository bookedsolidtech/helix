import * as React from 'react';

/**
 * Stat card — 56px tabular numerals with optional trailing unit, mono label.
 * Lifted from /Users/himerus/Downloads/dist/foundation/01-overview.html:104-130.
 *
 * Use inside a `<div className="hx-docs-stats">…</div>` row container so the
 * 4-column grid + dividers apply.
 */
export interface StatCardProps {
  /** Primary number (e.g. `3`, `240`, `4.5`). */
  num: string;
  /** Optional small trailing unit (e.g. `tiers`, `+`, `:1`, `px`). */
  unit?: string;
  /** Mono uppercase label below the number. */
  label: string;
  /** Optional sub-label rendered in small mono below the main label. */
  sub?: string;
}

export function StatCard({ num, unit, label, sub }: StatCardProps) {
  return (
    <div className="hx-docs-stat">
      <div className="hx-docs-stat-num">
        {num}
        {unit ? <small>{unit}</small> : null}
      </div>
      <div className="hx-docs-stat-label">{label}</div>
      {sub ? <div className="hx-docs-stat-sub">{sub}</div> : null}
    </div>
  );
}
