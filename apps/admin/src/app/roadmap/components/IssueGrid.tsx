'use client';

import { GlassIssueCard } from './GlassIssueCard';
import { Search } from 'lucide-react';
import type { TrackedIssue } from '@/types/issues';

interface IssueGridProps {
  issues: TrackedIssue[];
  onIssueClick: (issue: TrackedIssue) => void;
}

export function IssueGrid({ issues, onIssueClick }: IssueGridProps) {
  if (issues.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl py-16 px-6 text-center">
        <Search className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500 text-sm font-medium">No issues found matching your filters.</p>
        <p className="text-zinc-600 text-xs mt-1">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {issues.map((issue) => (
        <GlassIssueCard key={issue.id} issue={issue} onClick={() => onIssueClick(issue)} />
      ))}
    </div>
  );
}
