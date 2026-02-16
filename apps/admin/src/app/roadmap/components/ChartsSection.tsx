'use client';

import { useMemo } from 'react';
import { BarChart3, Target } from 'lucide-react';
import type { TrackedIssue } from '@/types/issues';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartsSectionProps {
  issues: TrackedIssue[];
}

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(10, 10, 20, 0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: '#fafafa',
  backdropFilter: 'blur(12px)',
};

const GLASS_CARD = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden';

function formatLabel(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function ChartsSection({ issues }: ChartsSectionProps) {
  const reporterData = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      map.set(issue.reporter, (map.get(issue.reporter) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([reporter, count]) => ({
        reporter: formatLabel(reporter),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [issues]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      if (issue.category) {
        map.set(issue.category, (map.get(issue.category) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([category, count]) => ({
      name: formatLabel(category),
      value: count,
    }));
  }, [issues]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Issues by Reporter */}
      <div className={GLASS_CARD}>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Issues by Reporter
          </h3>
        </div>
        <div className="px-4 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reporterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="reporter"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#71717a', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues by Category */}
      <div className={GLASS_CARD}>
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Issues by Category
          </h3>
        </div>
        <div className="px-4 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
