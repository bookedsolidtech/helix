'use client';

import { ComponentHealth } from '@/lib/health-scorer';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award } from 'lucide-react';

interface TeamLeaderboardProps {
  components: ComponentHealth[];
}

export function TeamLeaderboard({ components }: TeamLeaderboardProps) {
  // Sort by overall score (descending)
  const sorted = [...components].sort((a, b) => b.overallScore - a.overallScore);

  // Categorize
  const champions = sorted.filter((c) => c.grade === 'A');
  const solid = sorted.filter((c) => c.grade === 'B');
  const needsWork = sorted.filter((c) => c.grade === 'C');
  const critical = sorted.filter((c) => c.grade === 'D' || c.grade === 'F');

  const renderComponent = (component: ComponentHealth, rank: number) => {
    const Icon = rank === 1 ? Trophy : rank === 2 ? Medal : rank === 3 ? Award : null;

    const iconColor =
      rank === 1
        ? 'text-amber-400'
        : rank === 2
          ? 'text-gray-400'
          : rank === 3
            ? 'text-orange-600'
            : 'text-muted-foreground';

    return (
      <div
        key={component.tagName}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
      >
        <div className="w-6 text-center shrink-0">
          {Icon ? (
            <Icon className={cn('w-4 h-4 inline', iconColor)} />
          ) : (
            <span className="text-xs text-muted-foreground">{rank}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-foreground truncate">
            &lt;{component.tagName}&gt;
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                component.overallScore >= 90
                  ? 'bg-emerald-400'
                  : component.overallScore >= 70
                    ? 'bg-amber-400'
                    : 'bg-red-400',
              )}
              style={{ width: `${component.overallScore}%` }}
            />
          </div>
          <span
            className={cn(
              'text-sm font-bold tabular-nums w-10 text-right',
              component.grade === 'A'
                ? 'text-emerald-400'
                : component.grade === 'B'
                  ? 'text-blue-400'
                  : component.grade === 'C'
                    ? 'text-amber-400'
                    : 'text-red-400',
            )}
          >
            {component.grade}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Champions */}
      {champions.length > 0 && (
        <div>
          <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2">
            Champions ({champions.length})
          </div>
          <div className="space-y-1">
            {champions.map((c) =>
              renderComponent(c, sorted.findIndex((s) => s.tagName === c.tagName) + 1),
            )}
          </div>
        </div>
      )}

      {/* Solid */}
      {solid.length > 0 && (
        <div>
          <div className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-2">
            Solid ({solid.length})
          </div>
          <div className="space-y-1">
            {solid.map((c) =>
              renderComponent(c, sorted.findIndex((s) => s.tagName === c.tagName) + 1),
            )}
          </div>
        </div>
      )}

      {/* Needs Work */}
      {needsWork.length > 0 && (
        <div>
          <div className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">
            Needs Work ({needsWork.length})
          </div>
          <div className="space-y-1">
            {needsWork.map((c) =>
              renderComponent(c, sorted.findIndex((s) => s.tagName === c.tagName) + 1),
            )}
          </div>
        </div>
      )}

      {/* Critical */}
      {critical.length > 0 && (
        <div>
          <div className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">
            Critical ({critical.length})
          </div>
          <div className="space-y-1">
            {critical.map((c) =>
              renderComponent(c, sorted.findIndex((s) => s.tagName === c.tagName) + 1),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
