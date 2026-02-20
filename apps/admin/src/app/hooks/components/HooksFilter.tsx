'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';
import type { Priority, Phase } from '@/lib/hooks-data';

interface HooksFilterProps {
  selectedPriority: Priority | 'all';
  selectedPhase: Phase | 'all';
  selectedOwner: string | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  onPhaseChange: (phase: Phase | 'all') => void;
  onOwnerChange: (owner: string | 'all') => void;
  owners: string[];
}

export function HooksFilter({
  selectedPriority,
  selectedPhase,
  selectedOwner,
  onPriorityChange,
  onPhaseChange,
  onOwnerChange,
  owners,
}: HooksFilterProps) {
  const priorities: Array<Priority | 'all'> = ['all', 'P0', 'P1', 'P2'];
  const phases: Array<Phase | 'all'> = ['all', 1, 2, 3, 4];

  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filters</span>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
          Priority
        </label>
        <div className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <Badge
              key={priority}
              variant="outline"
              className={cn(
                'text-xs cursor-pointer transition-all',
                selectedPriority === priority
                  ? priority === 'P0'
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : priority === 'P1'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : priority === 'P2'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-white/10 border-white/30 text-foreground'
                  : 'hover:bg-white/5',
              )}
              onClick={() => onPriorityChange(priority)}
            >
              {priority === 'all' ? 'All' : priority}
            </Badge>
          ))}
        </div>
      </div>

      {/* Phase Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
          Phase
        </label>
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <Badge
              key={phase}
              variant="outline"
              className={cn(
                'text-xs cursor-pointer transition-all',
                selectedPhase === phase
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'hover:bg-white/5',
              )}
              onClick={() => onPhaseChange(phase)}
            >
              {phase === 'all' ? 'All' : `Phase ${phase}`}
            </Badge>
          ))}
        </div>
      </div>

      {/* Owner Filter */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
          Owner
        </label>
        <select
          value={selectedOwner}
          onChange={(e) => onOwnerChange(e.target.value)}
          className="w-full rounded-md bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-foreground hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="all">All Owners</option>
          {owners.map((owner) => (
            <option key={owner} value={owner}>
              {owner}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
