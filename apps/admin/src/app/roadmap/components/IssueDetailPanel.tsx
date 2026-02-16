'use client';

import { useCallback, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SEVERITY_COLORS, STATUS_COLORS } from '@/lib/severity-colors';
import type { TrackedIssue, IssueStatus, StatusChange } from '@/types/issues';
import {
  X,
  CheckCircle2,
  Clock,
  Circle,
  Pause,
  AlertCircle,
  Target,
  User,
  Timer,
  FolderOpen,
  Tag,
  MessageSquare,
  ArrowRight,
  Link2,
  Loader2,
} from 'lucide-react';

interface IssueDetailPanelProps {
  issue: TrackedIssue | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: IssueStatus) => void;
}

const ALL_STATUSES: Array<{ value: IssueStatus; label: string }> = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

function StatusIcon({ status, size = 'sm' }: { status: IssueStatus; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  switch (status) {
    case 'complete':
      return <CheckCircle2 className={cn(cls, 'text-emerald-400')} />;
    case 'in-progress':
      return <Clock className={cn(cls, 'text-blue-400')} />;
    case 'blocked':
      return <Pause className={cn(cls, 'text-red-400')} />;
    case 'not-started':
      return <Circle className={cn(cls, 'text-zinc-500')} />;
  }
}

function formatLabel(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IssueDetailPanel({ issue, onClose, onStatusUpdate }: IssueDetailPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isOpen = issue !== null;

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleStatusChange = useCallback(
    async (newStatus: IssueStatus) => {
      if (!issue || newStatus === issue.status) return;
      setIsUpdating(true);
      try {
        const res = await fetch(`/api/issues/${issue.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          onStatusUpdate(issue.id, newStatus);
        }
      } catch {
        // Silently fail - user can retry
      } finally {
        setIsUpdating(false);
      }
    },
    [issue, onStatusUpdate],
  );

  const handleResolve = useCallback(() => {
    if (issue && issue.status !== 'complete') {
      handleStatusChange('complete');
    }
  }, [issue, handleStatusChange]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-[500px] max-w-full z-50',
          'bg-[#0a0a14]/95 backdrop-blur-xl border-l border-white/[0.08]',
          'transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {issue && (
          <div className="p-6 space-y-6">
            {/* Close button */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs font-mono text-zinc-400 border-white/[0.1]"
                >
                  {issue.id}
                </Badge>
                <Badge
                  className={cn(
                    'border text-[10px] uppercase font-bold tracking-wider',
                    SEVERITY_COLORS[issue.severity].bg,
                    SEVERITY_COLORS[issue.severity].text,
                    SEVERITY_COLORS[issue.severity].border,
                  )}
                >
                  {issue.severity}
                </Badge>
              </div>
              <button
                onClick={onClose}
                className="p-2 -m-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h2
              className={cn(
                'text-xl font-bold text-zinc-100 leading-tight',
                issue.status === 'complete' &&
                  'line-through decoration-emerald-500/40 decoration-2',
              )}
            >
              {issue.title}
            </h2>

            {/* Status section with dropdown */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                Status
              </label>
              <div className="flex items-center gap-3">
                <StatusIcon status={issue.status} size="md" />
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                  disabled={isUpdating}
                  className={cn(
                    'flex-1 bg-white/[0.03] border border-white/[0.1] rounded-lg px-3 py-2',
                    'text-sm text-zinc-200 appearance-none cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors',
                  )}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {isUpdating && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{issue.description}</p>
            </div>

            {/* Impact */}
            {issue.impact && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Impact
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{issue.impact}</p>
              </div>
            )}

            {/* Recommendation */}
            {issue.recommendation && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  Recommendation
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{issue.recommendation}</p>
              </div>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              {issue.effort && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                    <Timer className="w-3 h-3" />
                    Effort
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">{issue.effort}</p>
                </div>
              )}
              {issue.owner && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                    <User className="w-3 h-3" />
                    Owner
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">{formatLabel(issue.owner)}</p>
                </div>
              )}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                  <FolderOpen className="w-3 h-3" />
                  Category
                </div>
                <p className="text-sm text-zinc-300 font-medium">{formatLabel(issue.category)}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                  <User className="w-3 h-3" />
                  Reporter
                </div>
                <p className="text-sm text-zinc-300 font-medium">{formatLabel(issue.reporter)}</p>
              </div>
            </div>

            {/* Tags */}
            {issue.tags && issue.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  Tags
                </h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {issue.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px] text-zinc-400 border-white/[0.08]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {issue.notes && issue.notes.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Notes
                </h3>
                <div className="space-y-2">
                  {issue.notes.map((note, idx) => (
                    <p
                      key={idx}
                      className="text-sm text-zinc-400 bg-white/[0.02] border border-white/[0.06] rounded-lg p-3"
                    >
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Status history timeline */}
            {issue.statusHistory && issue.statusHistory.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Status History
                </h3>
                <div className="space-y-0">
                  {issue.statusHistory.map((change: StatusChange, idx: number) => (
                    <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                      {/* Timeline line */}
                      {idx < issue.statusHistory.length - 1 && (
                        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/[0.06]" />
                      )}
                      {/* Dot */}
                      <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      </div>
                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn('font-medium', STATUS_COLORS[change.from].text)}>
                            {formatLabel(change.from)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-600" />
                          <span className={cn('font-medium', STATUS_COLORS[change.to].text)}>
                            {formatLabel(change.to)}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          {formatDate(change.date)} by {formatLabel(change.changedBy)}
                        </p>
                        {change.note && <p className="text-xs text-zinc-500 mt-1">{change.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related / Blocking issues */}
            {((issue.blockedBy && issue.blockedBy.length > 0) ||
              (issue.blocks && issue.blocks.length > 0) ||
              (issue.relatedTo && issue.relatedTo.length > 0)) && (
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5" />
                  Related Issues
                </h3>
                <div className="space-y-2">
                  {issue.blockedBy && issue.blockedBy.length > 0 && (
                    <div className="text-xs">
                      <span className="text-red-400 font-medium">Blocked by: </span>
                      <span className="text-zinc-400">{issue.blockedBy.join(', ')}</span>
                    </div>
                  )}
                  {issue.blocks && issue.blocks.length > 0 && (
                    <div className="text-xs">
                      <span className="text-amber-400 font-medium">Blocks: </span>
                      <span className="text-zinc-400">{issue.blocks.join(', ')}</span>
                    </div>
                  )}
                  {issue.relatedTo && issue.relatedTo.length > 0 && (
                    <div className="text-xs">
                      <span className="text-blue-400 font-medium">Related to: </span>
                      <span className="text-zinc-400">{issue.relatedTo.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resolve button */}
            {issue.status !== 'complete' && (
              <button
                onClick={handleResolve}
                disabled={isUpdating}
                className={cn(
                  'w-full py-3 rounded-xl text-sm font-semibold',
                  'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400',
                  'hover:bg-emerald-500/20 hover:border-emerald-500/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'flex items-center justify-center gap-2',
                )}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Mark as Resolved
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
