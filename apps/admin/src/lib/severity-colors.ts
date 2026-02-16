import type { Severity, IssueStatus } from '@/types/issues';

export const SEVERITY_COLORS: Record<
  Severity,
  { bg: string; text: string; border: string; gradient: string }
> = {
  critical: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    gradient: 'from-red-500 to-red-600',
  },
  high: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500 to-amber-600',
  },
  medium: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500 to-blue-600',
  },
  low: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-emerald-600',
  },
};

export const STATUS_COLORS: Record<IssueStatus, { bg: string; text: string; icon: string }> = {
  'not-started': {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    icon: 'circle',
  },
  'in-progress': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'clock',
  },
  blocked: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'pause',
  },
  complete: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: 'check-circle',
  },
};
