'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TrackedIssue, IssuesIndex, Severity, IssueStatus } from '@/types/issues';
import { GlassStatsHero } from './GlassStatsHero';
import { FilterBar } from './FilterBar';
import { SeverityTabs } from './SeverityTabs';
import { IssueGrid } from './IssueGrid';
import { IssueDetailPanel } from './IssueDetailPanel';
import { ChartsSection } from './ChartsSection';
import { RoadmapTimeline } from './RoadmapTimeline';
import { ReviewHistory } from './ReviewHistory';

interface Phase {
  phase: string;
  focus: string;
  items: string[];
  totalEffort: string;
  outcome: string;
}

interface IssueTrackerShellProps {
  issues: TrackedIssue[];
  stats: IssuesIndex['stats'];
  reviewDate: string;
  phases: Phase[];
}

export function IssueTrackerShell({
  issues: initialIssues,
  stats,
  reviewDate,
  phases,
}: IssueTrackerShellProps) {
  // --- State ---
  const [issues, setIssues] = useState<TrackedIssue[]>(initialIssues);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReporter, setSelectedReporter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<TrackedIssue | null>(null);

  // --- Derived: severity counts ---
  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const issue of issues) {
      counts[issue.severity]++;
    }
    return counts;
  }, [issues]);

  // --- Filtering ---
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Severity tab
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && issue.status !== selectedStatus) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
        return false;
      }

      // Reporter filter
      if (selectedReporter !== 'all' && issue.reporter !== selectedReporter) {
        return false;
      }

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          issue.title.toLowerCase().includes(q) ||
          issue.description.toLowerCase().includes(q) ||
          issue.reporter.toLowerCase().includes(q) ||
          issue.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [issues, selectedSeverity, selectedStatus, selectedCategory, selectedReporter, searchQuery]);

  // --- Handlers ---
  const handleIssueClick = useCallback((issue: TrackedIssue) => {
    setSelectedIssue(issue);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedIssue(null);
  }, []);

  const handleStatusUpdate = useCallback((id: string, newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((issue) => {
        if (issue.id !== id) return issue;
        return {
          ...issue,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          resolvedAt: newStatus === 'complete' ? new Date().toISOString() : undefined,
          statusHistory: [
            ...issue.statusHistory,
            {
              from: issue.status,
              to: newStatus,
              date: new Date().toISOString(),
              changedBy: 'manual',
            },
          ],
        };
      }),
    );
    // Update the selected issue panel too
    setSelectedIssue((prev) => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        resolvedAt: newStatus === 'complete' ? new Date().toISOString() : undefined,
        statusHistory: [
          ...prev.statusHistory,
          {
            from: prev.status,
            to: newStatus,
            date: new Date().toISOString(),
            changedBy: 'manual',
          },
        ],
      };
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Review date context */}
      <ReviewHistory currentReviewDate={reviewDate} />

      {/* Stats hero */}
      <GlassStatsHero stats={stats} reviewDate={reviewDate} />

      {/* Filter bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedReporter={selectedReporter}
        onReporterChange={setSelectedReporter}
        issues={issues}
        filteredCount={filteredIssues.length}
        totalCount={issues.length}
      />

      {/* Severity tabs */}
      <SeverityTabs
        activeTab={selectedSeverity}
        onTabChange={setSelectedSeverity}
        counts={severityCounts}
        total={issues.length}
      />

      {/* Issue grid */}
      <IssueGrid issues={filteredIssues} onIssueClick={handleIssueClick} />

      {/* Detail panel (slide-out) */}
      <IssueDetailPanel
        issue={selectedIssue}
        onClose={handleCloseDetail}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Charts */}
      <ChartsSection issues={issues} />

      {/* Roadmap timeline */}
      <RoadmapTimeline phases={phases} />
    </div>
  );
}
