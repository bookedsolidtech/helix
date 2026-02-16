'use client';

import { ComponentHealth, SubMetric } from '@/lib/health-scorer';
import { TrendData } from '@/lib/health-history-reader';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface ComponentDrillDownProps {
  component: ComponentHealth;
  trend?: TrendData;
}

export function ComponentDrillDown({ component, trend }: ComponentDrillDownProps) {
  const renderSubMetric = (subMetric: SubMetric) => {
    const Icon = subMetric.passed ? CheckCircle2 : subMetric.score >= 50 ? AlertTriangle : XCircle;
    const iconColor = subMetric.passed
      ? 'text-emerald-400'
      : subMetric.score >= 50
        ? 'text-amber-400'
        : 'text-red-400';

    return (
      <div
        key={subMetric.name}
        className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
      >
        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{subMetric.name}</span>
            <span className={cn('text-sm font-bold tabular-nums', iconColor)}>
              {subMetric.score}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{subMetric.detail}</div>
        </div>
      </div>
    );
  };

  const renderDimension = (dimension: ComponentHealth['dimensions'][0]) => {
    const hasSubMetrics = dimension.subMetrics && dimension.subMetrics.length > 0;

    return (
      <div key={dimension.name} className="space-y-3">
        {/* Dimension Header */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-semibold text-foreground">{dimension.name}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded font-medium',
                  dimension.confidence === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : dimension.confidence === 'heuristic'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-gray-500/10 text-gray-400',
                )}
              >
                {dimension.confidence}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{dimension.methodology}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
              {dimension.measured && dimension.score !== null && (
                <div
                  className={cn(
                    'h-full rounded-full',
                    dimension.score >= 90
                      ? 'bg-emerald-400'
                      : dimension.score >= 70
                        ? 'bg-amber-400'
                        : dimension.score >= 50
                          ? 'bg-orange-400'
                          : 'bg-red-400',
                  )}
                  style={{ width: `${dimension.score}%` }}
                />
              )}
            </div>
            <span
              className={cn(
                'text-xl font-bold tabular-nums w-12 text-right',
                !dimension.measured || dimension.score === null
                  ? 'text-muted-foreground'
                  : dimension.score >= 90
                    ? 'text-emerald-400'
                    : dimension.score >= 70
                      ? 'text-amber-400'
                      : dimension.score >= 50
                        ? 'text-orange-400'
                        : 'text-red-400',
              )}
            >
              {dimension.measured && dimension.score !== null ? `${dimension.score}%` : '—'}
            </span>
          </div>
        </div>

        {/* Sub-Metrics */}
        {hasSubMetrics && dimension.subMetrics && (
          <div className="ml-6 space-y-2">{dimension.subMetrics.map(renderSubMetric)}</div>
        )}
      </div>
    );
  };

  const TrendIcon = trend
    ? trend.trend === 'improving'
      ? TrendingUp
      : trend.trend === 'declining'
        ? TrendingDown
        : Minus
    : Minus;

  const trendColor = trend
    ? trend.trend === 'improving'
      ? 'text-emerald-400'
      : trend.trend === 'declining'
        ? 'text-red-400'
        : 'text-muted-foreground'
    : 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Component Summary */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-white/[0.06] border border-white/[0.08]">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">Overall Health Score</div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">{component.overallScore}%</span>
            <span
              className={cn(
                'text-2xl font-bold',
                component.grade === 'A'
                  ? 'text-emerald-400'
                  : component.grade === 'B'
                    ? 'text-blue-400'
                    : component.grade === 'C'
                      ? 'text-amber-400'
                      : 'text-red-400',
              )}
            >
              Grade {component.grade}
            </span>
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">30-Day Trend</div>
            <div className={cn('flex items-center gap-2 justify-end', trendColor)}>
              <TrendIcon className="w-5 h-5" />
              <span className="text-lg font-bold">
                {trend.changePercent > 0 ? '+' : ''}
                {trend.changePercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          All Dimensions ({component.dimensions.length})
        </div>
        {component.dimensions
          .sort((a, b) => {
            // Sort by score (lowest first to highlight issues)
            const scoreA = a.measured && a.score !== null ? a.score : 999;
            const scoreB = b.measured && b.score !== null ? b.score : 999;
            return scoreA - scoreB;
          })
          .map(renderDimension)}
      </div>

      {/* Actionable Fixes */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Recommended Actions
        </div>
        <div className="space-y-2">
          {component.dimensions
            .filter((d) => d.measured && d.score !== null && d.score < 70)
            .map((dimension) => (
              <div
                key={dimension.name}
                className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm"
              >
                <div className="font-medium text-amber-400 mb-1">
                  {dimension.name}: {dimension.score}%
                </div>
                <div className="text-muted-foreground">
                  {dimension.score !== null && dimension.score < 50
                    ? '🔴 Critical: Immediate attention required'
                    : '🟡 Warning: Improvement recommended'}
                </div>
                {dimension.subMetrics && (
                  <ul className="mt-2 space-y-1 ml-4">
                    {dimension.subMetrics
                      .filter((sm) => !sm.passed)
                      .map((sm) => (
                        <li key={sm.name} className="text-xs text-muted-foreground">
                          • {sm.name}: {sm.detail}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          {component.dimensions.every((d) => !d.measured || d.score === null || d.score >= 70) && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
              ✓ All measured dimensions meet quality thresholds
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
