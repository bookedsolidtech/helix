'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/severity-colors';
import type { TrackedIssue, IssueStatus } from '@/types/issues';
import { CheckCircle2, Clock, Circle, Pause, User, Timer, FolderOpen } from 'lucide-react';

interface GlassIssueCardProps {
  issue: TrackedIssue;
  onClick: () => void;
}

function StatusIcon({ status }: { status: IssueStatus }) {
  switch (status) {
    case 'complete':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'in-progress':
      return <Clock className="w-3.5 h-3.5 text-blue-400" />;
    case 'blocked':
      return <Pause className="w-3.5 h-3.5 text-red-400" />;
    case 'not-started':
      return <Circle className="w-3.5 h-3.5 text-zinc-500" />;
  }
}

function formatLabel(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getSeverityBadgeClass(severity: string): string {
  const colors = SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS];
  if (!colors) return '';
  return cn(colors.bg, colors.text, colors.border);
}

export function GlassIssueCard({ issue, onClick }: GlassIssueCardProps) {
  const isResolved = issue.status === 'complete';
  const sevColors = SEVERITY_COLORS[issue.severity];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl cursor-pointer group',
        'bg-white/[0.03] border border-white/[0.08]',
        'hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-px',
        'hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]',
        'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        isResolved && [
          'border-emerald-500/25',
          'bg-gradient-to-br from-emerald-500/[0.04] via-teal-500/[0.02] to-cyan-500/[0.03]',
        ],
      )}
      onClick={onClick}
    >
      {/* Severity left border bar */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full bg-gradient-to-b',
          isResolved ? 'from-emerald-400 via-teal-400 to-cyan-400' : sevColors.gradient,
        )}
      />

      {/* Card content */}
      <div className="pl-5 pr-5 py-5">
        {/* Header row: badges + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={cn(
                'border text-[10px] uppercase font-bold tracking-wider',
                getSeverityBadgeClass(issue.severity),
              )}
            >
              {issue.severity}
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-mono text-zinc-400 border-white/[0.08]"
            >
              {issue.id}
            </Badge>
            {isResolved && (
              <Badge className="border-0 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 animate-resolved-shimmer">
                Resolved
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <StatusIcon status={issue.status} />
            <span className={cn('text-xs font-medium', STATUS_COLORS[issue.status].text)}>
              {formatLabel(issue.status)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-semibold text-sm text-zinc-100 mb-2 leading-snug',
            'group-hover:text-white transition-colors',
            isResolved && 'line-through decoration-emerald-500/40 decoration-2',
          )}
        >
          {issue.title}
        </h3>

        {/* Description (truncated) */}
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mb-4">
          {issue.description}
        </p>

        {/* Footer metadata */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3" />
            <span>{formatLabel(issue.reporter)}</span>
          </div>
          {issue.effort && (
            <div className="flex items-center gap-1.5">
              <Timer className="w-3 h-3" />
              <span>{issue.effort}</span>
            </div>
          )}
          {issue.category && (
            <div className="flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3" />
              <span>{formatLabel(issue.category)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
