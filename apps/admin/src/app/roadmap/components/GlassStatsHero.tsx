'use client';

import { cn } from '@/lib/utils';
import { SEVERITY_COLORS } from '@/lib/severity-colors';
import type { IssuesIndex, Severity } from '@/types/issues';
import { AlertTriangle, Flame, AlertCircle, Info, CheckCircle2, BarChart3 } from 'lucide-react';

interface GlassStatsHeroProps {
  stats: IssuesIndex['stats'];
  reviewDate: string;
}

const GLASS_CARD =
  'bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300';

interface StatCardData {
  label: string;
  value: number | string;
  severity?: Severity;
  icon: React.ReactNode;
  description?: string;
}

function SeverityIcon({ severity }: { severity: Severity }) {
  switch (severity) {
    case 'critical':
      return <Flame className="w-5 h-5 text-red-400" />;
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'medium':
      return <AlertCircle className="w-5 h-5 text-blue-400" />;
    case 'low':
      return <Info className="w-5 h-5 text-emerald-400" />;
  }
}

function getValueColor(severity?: Severity): string {
  if (!severity) return 'text-foreground';
  return SEVERITY_COLORS[severity].text;
}

export function GlassStatsHero({ stats, reviewDate }: GlassStatsHeroProps) {
  const resolutionPercent = Math.round(stats.resolutionRate * 100);

  const formattedDate = new Date(reviewDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const cards: StatCardData[] = [
    {
      label: 'Total Issues',
      value: stats.total,
      icon: <BarChart3 className="w-5 h-5 text-zinc-400" />,
      description: `Review: ${formattedDate}`,
    },
    {
      label: 'Critical',
      value: stats.bySeverity.critical,
      severity: 'critical',
      icon: <SeverityIcon severity="critical" />,
      description: 'v1.0 blockers',
    },
    {
      label: 'High',
      value: stats.bySeverity.high,
      severity: 'high',
      icon: <SeverityIcon severity="high" />,
      description: 'Pre-production',
    },
    {
      label: 'Medium',
      value: stats.bySeverity.medium,
      severity: 'medium',
      icon: <SeverityIcon severity="medium" />,
      description: 'Polish items',
    },
    {
      label: 'Low',
      value: stats.bySeverity.low,
      severity: 'low',
      icon: <SeverityIcon severity="low" />,
      description: 'Nice-to-have',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={GLASS_CARD}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {card.label}
            </span>
            {card.icon}
          </div>
          <div
            className={cn('text-4xl font-black tabular-nums mb-1', getValueColor(card.severity))}
          >
            {card.value}
          </div>
          {card.description && <p className="text-xs text-zinc-500">{card.description}</p>}
        </div>
      ))}

      {/* Resolution Rate Card */}
      <div className={GLASS_CARD}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Resolved
          </span>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-4xl font-black tabular-nums text-emerald-400 mb-2">
          {resolutionPercent}%
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
            style={{ width: `${resolutionPercent}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {stats.resolvedCount} of {stats.total} resolved
        </p>
      </div>
    </div>
  );
}
