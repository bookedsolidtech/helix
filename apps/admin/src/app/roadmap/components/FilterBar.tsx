'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Search, Filter, X } from 'lucide-react';
import type { TrackedIssue, IssueStatus } from '@/types/issues';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: IssueStatus | 'all';
  onStatusChange: (status: IssueStatus | 'all') => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedReporter: string;
  onReporterChange: (reporter: string) => void;
  issues: TrackedIssue[];
  filteredCount: number;
  totalCount: number;
}

const INPUT_CLASS =
  'w-full bg-white/[0.03] border border-white/[0.1] rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-colors';

const ALL_STATUSES: Array<{ value: IssueStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'complete', label: 'Complete' },
];

function formatLabel(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  selectedReporter,
  onReporterChange,
  issues,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const issue of issues) {
      if (issue.category) cats.add(issue.category);
    }
    return Array.from(cats).sort();
  }, [issues]);

  const uniqueReporters = useMemo(() => {
    const reporters = new Set<string>();
    for (const issue of issues) {
      reporters.add(issue.reporter);
    }
    return Array.from(reporters).sort();
  }, [issues]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedReporter !== 'all';

  function clearAll() {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange('all');
    onReporterChange('all');
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(INPUT_CLASS, 'pl-10 pr-4 py-2.5')}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as IssueStatus | 'all')}
            className={cn(INPUT_CLASS, 'pl-10 pr-8 py-2.5 appearance-none cursor-pointer')}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={cn(INPUT_CLASS, 'pl-10 pr-8 py-2.5 appearance-none cursor-pointer')}
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {formatLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        {/* Reporter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select
            value={selectedReporter}
            onChange={(e) => onReporterChange(e.target.value)}
            className={cn(INPUT_CLASS, 'pl-10 pr-8 py-2.5 appearance-none cursor-pointer')}
          >
            <option value="all">All Reporters</option>
            {uniqueReporters.map((r) => (
              <option key={r} value={r}>
                {formatLabel(r)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count + clear */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          Showing <span className="text-zinc-300 font-medium">{filteredCount}</span> of{' '}
          <span className="text-zinc-300 font-medium">{totalCount}</span> issues
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
