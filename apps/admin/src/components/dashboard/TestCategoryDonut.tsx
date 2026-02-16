'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import type { CategorySummary } from '@/lib/test-categories';

interface TestCategoryDonutProps {
  categories: CategorySummary[];
  totalTests: number;
  passRate: number;
}

export function TestCategoryDonut({ categories, totalTests, passRate }: TestCategoryDonutProps) {
  const donutData = categories
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.label,
      value: c.total,
      color: c.color,
    }));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Donut Chart */}
      <div className="relative">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={800}
            >
              {donutData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold tabular-nums text-foreground">{totalTests}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">tests</span>
        </div>
      </div>

      {/* Pass rate indicator */}
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              passRate === 100 ? 'bg-emerald-400' : passRate >= 80 ? 'bg-amber-400' : 'bg-red-400',
            )}
            style={{ width: `${passRate}%` }}
          />
        </div>
        <span
          className={cn(
            'text-xs font-bold tabular-nums',
            passRate === 100
              ? 'text-emerald-400'
              : passRate >= 80
                ? 'text-amber-400'
                : 'text-red-400',
          )}
        >
          {passRate}% pass
        </span>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
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
  );
}
