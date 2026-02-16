'use client';

import { cn } from '@/lib/utils';

interface ConfidenceBarProps {
  verified: number;
  heuristic: number;
  untested: number;
}

export function ConfidenceBar({ verified, heuristic, untested }: ConfidenceBarProps) {
  const total = verified + heuristic + untested;
  if (total === 0) return null;

  const verifiedPct = (verified / total) * 100;
  const heuristicPct = (heuristic / total) * 100;
  const untestedPct = (untested / total) * 100;

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
        {verifiedPct > 0 && (
          <div
            className="h-full bg-emerald-400 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            style={{ width: `${verifiedPct}%` }}
            title={`Verified: ${verified}`}
          />
        )}
        {heuristicPct > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            style={{ width: `${heuristicPct}%` }}
            title={`Heuristic: ${heuristic}`}
          />
        )}
        {untestedPct > 0 && (
          <div
            className="h-full bg-zinc-600 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            style={{ width: `${untestedPct}%` }}
            title={`Untested: ${untested}`}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex items-center gap-4">
        <ConfidenceLabel
          color="bg-emerald-400"
          label="Verified"
          count={verified}
          pct={verifiedPct}
        />
        <ConfidenceLabel
          color="bg-amber-400"
          label="Heuristic"
          count={heuristic}
          pct={heuristicPct}
        />
        <ConfidenceLabel
          color="bg-zinc-600"
          label="Untested"
          count={untested}
          pct={untestedPct}
          muted
        />
      </div>
    </div>
  );
}

function ConfidenceLabel({
  color,
  label,
  count,
  pct,
  muted,
}: {
  color: string;
  label: string;
  count: number;
  pct: number;
  muted?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', muted && 'opacity-60')}>
      <span className={cn('w-2 h-2 rounded-full shrink-0', color)} />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium tabular-nums">{count}</span>
      <span className="text-muted-foreground tabular-nums">({Math.round(pct)}%)</span>
    </div>
  );
}
