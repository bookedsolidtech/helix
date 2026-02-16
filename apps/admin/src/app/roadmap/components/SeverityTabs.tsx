'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Severity } from '@/types/issues';

interface SeverityTabsProps {
  activeTab: Severity | 'all';
  onTabChange: (tab: Severity | 'all') => void;
  counts: Record<Severity, number>;
  total: number;
}

interface TabConfig {
  value: Severity | 'all';
  label: string;
  count: number;
  activeClass: string;
  badgeClass: string;
}

export function SeverityTabs({ activeTab, onTabChange, counts, total }: SeverityTabsProps) {
  const tabs: TabConfig[] = [
    {
      value: 'all',
      label: 'All',
      count: total,
      activeClass: 'bg-white/[0.06] border-white/[0.15] shadow-[0_0_20px_rgba(255,255,255,0.03)]',
      badgeClass: 'bg-white/[0.08] text-zinc-300',
    },
    {
      value: 'critical',
      label: 'Critical',
      count: counts.critical,
      activeClass: 'bg-red-500/10 border-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.08)]',
      badgeClass: 'bg-red-500/15 text-red-400',
    },
    {
      value: 'high',
      label: 'High',
      count: counts.high,
      activeClass: 'bg-amber-500/10 border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.08)]',
      badgeClass: 'bg-amber-500/15 text-amber-400',
    },
    {
      value: 'medium',
      label: 'Medium',
      count: counts.medium,
      activeClass: 'bg-blue-500/10 border-blue-500/25 shadow-[0_0_20px_rgba(59,130,246,0.08)]',
      badgeClass: 'bg-blue-500/15 text-blue-400',
    },
    {
      value: 'low',
      label: 'Low',
      count: counts.low,
      activeClass:
        'bg-emerald-500/10 border-emerald-500/25 shadow-[0_0_20px_rgba(16,185,129,0.08)]',
      badgeClass: 'bg-emerald-500/15 text-emerald-400',
    },
  ];

  return (
    <div className="sticky top-0 z-30 -mx-1 px-1 py-2 backdrop-blur-md bg-[#0a0a14]/80">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;

          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap',
                'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isActive
                  ? tab.activeClass
                  : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]',
              )}
            >
              {tab.label}
              <Badge
                className={cn(
                  'text-xs px-1.5 py-0 h-5 min-w-[1.25rem] justify-center border-0',
                  isActive ? tab.badgeClass : 'bg-white/[0.05] text-zinc-500',
                )}
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
