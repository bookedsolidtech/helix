import { NextResponse } from 'next/server';
import { loadIssues } from '@/lib/issues-loader';
import type { TrackedIssue } from '@/types/issues';

export const dynamic = 'force-dynamic';

interface ReporterCount {
  reporter: string;
  count: number;
}

interface CategoryBreakdown {
  category: string;
  total: number;
  resolved: number;
}

interface IssueStats {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  resolvedCount: number;
  resolutionRate: number;
  topReporters: ReporterCount[];
  recentlyResolved: TrackedIssue[];
  categoryBreakdown: CategoryBreakdown[];
}

/**
 * GET /api/issues/stats
 * Returns comprehensive aggregate statistics for all tracked issues.
 *
 * Response includes:
 *  - total: total issue count
 *  - bySeverity: counts per severity level
 *  - byStatus: counts per status
 *  - byCategory: counts per category
 *  - resolvedCount: number of issues with status "complete"
 *  - resolutionRate: resolvedCount / total (0-1)
 *  - topReporters: top 10 reporters by issue count
 *  - recentlyResolved: last 10 resolved issues (sorted by resolvedAt desc)
 *  - categoryBreakdown: per-category total and resolved counts
 */
export async function GET(): Promise<NextResponse> {
  try {
    const data = loadIssues();
    const { issues } = data;

    // Use the pre-computed stats from the index as a base
    const { bySeverity, byStatus, byCategory, resolvedCount, resolutionRate } = data.stats;

    // Compute top reporters
    const reporterCounts = new Map<string, number>();
    for (const issue of issues) {
      reporterCounts.set(issue.reporter, (reporterCounts.get(issue.reporter) ?? 0) + 1);
    }
    const topReporters: ReporterCount[] = Array.from(reporterCounts.entries())
      .map(([reporter, count]) => ({ reporter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Compute recently resolved (last 10 by resolvedAt)
    const recentlyResolved: TrackedIssue[] = issues
      .filter((issue) => issue.status === 'complete' && issue.resolvedAt)
      .sort((a, b) => {
        const aDate = a.resolvedAt ?? '';
        const bDate = b.resolvedAt ?? '';
        return bDate.localeCompare(aDate);
      })
      .slice(0, 10);

    // Compute category breakdown
    const categoryMap = new Map<string, { total: number; resolved: number }>();
    for (const issue of issues) {
      const entry = categoryMap.get(issue.category) ?? {
        total: 0,
        resolved: 0,
      };
      entry.total++;
      if (issue.status === 'complete') {
        entry.resolved++;
      }
      categoryMap.set(issue.category, entry);
    }
    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, counts]) => ({
        category,
        total: counts.total,
        resolved: counts.resolved,
      }))
      .sort((a, b) => b.total - a.total);

    const stats: IssueStats = {
      total: issues.length,
      bySeverity,
      byStatus,
      byCategory,
      resolvedCount,
      resolutionRate,
      topReporters,
      recentlyResolved,
      categoryBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to compute issue stats', detail: message },
      { status: 500 },
    );
  }
}
