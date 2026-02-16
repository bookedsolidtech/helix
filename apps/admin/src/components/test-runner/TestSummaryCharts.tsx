'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/lib/test-categories';
import type { AllTestResults } from '@/lib/test-results-reader';

interface TestSummaryChartsProps {
  results: AllTestResults;
}

function CategoryCard({ category }: { category: CategorySummary }) {
  const passRate = category.total > 0 ? Math.round((category.passed / category.total) * 100) : 0;
  const isEmpty = category.total === 0;

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        isEmpty
          ? 'bg-white/[0.01] border-white/[0.04] opacity-40'
          : 'bg-white/[0.03] border-white/[0.06]',
      )}
    >
      {/* Top row: colored dot + label + count */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: isEmpty ? '#71717a' : category.color }}
          />
          <span className="text-sm font-semibold text-foreground truncate">{category.label}</span>
        </div>
        <span className="text-sm font-medium tabular-nums text-muted-foreground shrink-0">
          {category.total}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{category.description}</p>

      {/* Pass rate bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {category.passed}/{category.total} passed
          </span>
          {!isEmpty && (
            <span
              className={cn(
                'text-[10px] font-medium tabular-nums',
                passRate === 100
                  ? 'text-emerald-400'
                  : passRate >= 80
                    ? 'text-amber-400'
                    : 'text-red-400',
              )}
            >
              {passRate}%
            </span>
          )}
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          {!isEmpty && (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                passRate === 100 ? 'bar-pass' : passRate >= 80 ? 'bar-warn' : 'bar-fail',
              )}
              style={{ width: `${passRate}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function TestSummaryCharts({ results }: TestSummaryChartsProps) {
  const categories = results.byCategory;

  // Donut data: one segment per category, sized by total test count
  const donutData = categories
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.label,
      value: c.total,
      color: c.color,
    }));

  return (
    <div>
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Test Coverage by Category
      </h4>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 items-start">
        {/* Donut Chart — by category */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {results.totalTests}
              </span>
              <span className="text-[10px] text-muted-foreground">tests</span>
            </div>
          </div>

          {/* Legend below donut */}
          <div className="flex flex-col gap-1.5 w-full">
            {categories.map((c) => (
              <div
                key={c.category}
                className={cn('flex items-center gap-2 text-xs', c.total === 0 && 'opacity-40')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: c.total > 0 ? c.color : '#71717a',
                  }}
                />
                <span className="text-muted-foreground truncate flex-1">{c.label}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">{c.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Summary Cards — 3x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {categories.map((c) => (
            <CategoryCard key={c.category} category={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
