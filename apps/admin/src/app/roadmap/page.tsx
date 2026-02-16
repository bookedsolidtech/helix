import { loadIssues } from '@/lib/issues-loader';
import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { IssueTrackerShell } from './components/IssueTrackerShell';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Phase {
  phase: string;
  focus: string;
  items: string[];
  totalEffort: string;
  outcome: string;
}

function loadPhases(): Phase[] {
  const reviewPath = join(process.cwd(), '../../.claude/issues/reviews/2026-02-15.json');
  if (!existsSync(reviewPath)) {
    return [];
  }
  try {
    const content = readFileSync(reviewPath, 'utf-8');
    const review = JSON.parse(content) as {
      productionReadiness?: { recommendedPhasing?: Phase[] };
    };
    return review.productionReadiness?.recommendedPhasing ?? [];
  } catch {
    return [];
  }
}

export default function RoadmapPage() {
  const issuesData = loadIssues();
  const phases = loadPhases();

  const categoryCount = Object.keys(issuesData.stats.byCategory).length;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumb items={getBreadcrumbItems('/roadmap')} />
        <h1 className="text-2xl font-bold tracking-tight">Issue Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage {issuesData.stats.total} platform issues from {categoryCount} categories
        </p>
      </div>
      <IssueTrackerShell
        issues={issuesData.issues}
        stats={issuesData.stats}
        reviewDate="2026-02-15"
        phases={phases}
      />
    </div>
  );
}
