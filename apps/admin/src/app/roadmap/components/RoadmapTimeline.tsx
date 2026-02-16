'use client';

import { cn } from '@/lib/utils';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface Phase {
  phase: string;
  focus: string;
  items: string[];
  totalEffort: string;
  outcome: string;
}

interface RoadmapTimelineProps {
  phases: Phase[];
}

const PHASE_COLORS = [
  {
    ring: 'border-red-500/30',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.06)]',
  },
  {
    ring: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.06)]',
  },
  {
    ring: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.06)]',
  },
  {
    ring: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.06)]',
  },
];

const GLASS_CARD = 'bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden';

export function RoadmapTimeline({ phases }: RoadmapTimelineProps) {
  if (phases.length === 0) return null;

  return (
    <div className={GLASS_CARD}>
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Roadmap Timeline
        </h3>
      </div>
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {phases.map((phase, index) => {
            const colors = PHASE_COLORS[index % PHASE_COLORS.length];

            return (
              <div
                key={index}
                className={cn(
                  'bg-white/[0.02] border rounded-xl p-5',
                  'hover:bg-white/[0.04] transition-all duration-300',
                  colors.ring,
                  colors.glow,
                )}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border text-sm font-bold shrink-0',
                      colors.bg,
                      colors.ring,
                      colors.text,
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-200 leading-tight">{phase.phase}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{phase.focus}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {phase.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                      <div className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {phase.totalEffort}
                  </div>
                  <div className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 className={cn('w-3 h-3 shrink-0 mt-0.5', colors.text)} />
                    <span className="text-zinc-300 font-medium">{phase.outcome}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
