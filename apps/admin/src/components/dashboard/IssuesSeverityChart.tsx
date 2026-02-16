'use client';

import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Severity, IssueStatus } from '@/types/issues';

interface IssuesSeverityChartProps {
  bySeverity: Record<Severity, number>;
  byStatus: Record<IssueStatus, number>;
  total: number;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#f87171' },
  high: { label: 'High', color: '#fb923c' },
  medium: { label: 'Medium', color: '#fbbf24' },
  low: { label: 'Low', color: '#60a5fa' },
};

const STATUS_CONFIG: Record<IssueStatus, { label: string; color: string }> = {
  'not-started': { label: 'Not Started', color: '#71717a' },
  'in-progress': { label: 'In Progress', color: '#60a5fa' },
  blocked: { label: 'Blocked', color: '#f87171' },
  complete: { label: 'Complete', color: '#34d399' },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; fill: string } }>;
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a2e] px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.fill }} />
        <span className="text-xs text-foreground font-medium">{data.name}</span>
        <span className="text-xs text-foreground font-bold tabular-nums ml-auto">{data.value}</span>
      </div>
    </div>
  );
}

export function IssuesSeverityChart({ bySeverity, byStatus, total }: IssuesSeverityChartProps) {
  const severityData = (Object.keys(SEVERITY_CONFIG) as Severity[]).map((key) => ({
    name: SEVERITY_CONFIG[key].label,
    value: bySeverity[key],
    fill: SEVERITY_CONFIG[key].color,
  }));

  // Compute status bar widths
  const statusTotal = Object.values(byStatus).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-5">
      {/* Severity bar chart */}
      <div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          By Severity
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={severityData}
            layout="vertical"
            margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
            barCategoryGap={4}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={60}
              tick={{
                fill: '#a1a1aa',
                fontSize: 11,
              }}
            />
            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {severityData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status stacked bar */}
      <div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
          By Status
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-secondary">
          {(Object.keys(STATUS_CONFIG) as IssueStatus[]).map((status) => {
            const count = byStatus[status];
            if (count === 0) return null;
            const pct = statusTotal > 0 ? (count / statusTotal) * 100 : 0;
            return (
              <div
                key={status}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: STATUS_CONFIG[status].color,
                }}
                title={`${STATUS_CONFIG[status].label}: ${count}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {(Object.keys(STATUS_CONFIG) as IssueStatus[]).map((status) => {
            const count = byStatus[status];
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_CONFIG[status].color }}
                />
                <span className="text-muted-foreground">{STATUS_CONFIG[status].label}</span>
                <span className="text-foreground font-medium tabular-nums">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total footer */}
      <div className="text-xs text-muted-foreground pt-1 border-t border-white/[0.06]">
        <span className="text-foreground font-bold tabular-nums">{total}</span> tracked issues
      </div>
    </div>
  );
}
