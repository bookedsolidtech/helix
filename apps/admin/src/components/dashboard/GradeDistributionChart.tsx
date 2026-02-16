'use client';

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GradeDistributionChartProps {
  distribution: Record<string, number>;
  avgScore: number;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#34d399',
  B: '#60a5fa',
  C: '#fbbf24',
  D: '#fb923c',
  F: '#f87171',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { grade: string; count: number; fill: string } }>;
}

function CustomGradeTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a2e] px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: data.fill }}>
          Grade {data.grade}
        </span>
        <span className="text-xs text-foreground font-bold tabular-nums">
          {data.count} {data.count === 1 ? 'component' : 'components'}
        </span>
      </div>
    </div>
  );
}

export function GradeDistributionChart({ distribution, avgScore }: GradeDistributionChartProps) {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  const data = grades.map((grade) => ({
    grade,
    count: distribution[grade] ?? 0,
    fill: GRADE_COLORS[grade],
  }));

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Average score hero number */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-xl text-2xl font-black"
          style={{
            backgroundColor:
              avgScore >= 90
                ? 'rgba(52,211,153,0.15)'
                : avgScore >= 80
                  ? 'rgba(96,165,250,0.15)'
                  : avgScore >= 70
                    ? 'rgba(251,191,36,0.15)'
                    : 'rgba(248,113,113,0.15)',
            color:
              avgScore >= 90
                ? '#34d399'
                : avgScore >= 80
                  ? '#60a5fa'
                  : avgScore >= 70
                    ? '#fbbf24'
                    : '#f87171',
          }}
        >
          {avgScore}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">Avg Health Score</div>
          <div className="text-xs text-muted-foreground">Across all components</div>
        </div>
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="grade"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#a1a1aa',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
          <YAxis hide domain={[0, maxCount + 1]} />
          <Tooltip content={<CustomGradeTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={entry.count > 0 ? 1 : 0.15} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Grade pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <span
              key={d.grade}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
              style={{
                backgroundColor: `${d.fill}15`,
                color: d.fill,
              }}
            >
              {d.grade}
              <span className="font-medium opacity-80">{d.count}</span>
            </span>
          ))}
      </div>
    </div>
  );
}
