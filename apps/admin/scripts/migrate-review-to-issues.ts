/**
 * Migration script: converts .claude/platform-review-2026-02-15.json
 * into the new .claude/issues/ tracked-issue format.
 *
 * Run with:  npx tsx apps/admin/scripts/migrate-review-to-issues.ts
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types (inlined so the script can run standalone without path aliases)
// ---------------------------------------------------------------------------

type Severity = 'critical' | 'high' | 'medium' | 'low';
type IssueStatus = 'not-started' | 'in-progress' | 'blocked' | 'complete';
type IssueSource = 'agent-review' | 'manual' | 'ci-failure';
type IssueCategory =
  | 'accessibility'
  | 'performance'
  | 'dx'
  | 'infrastructure'
  | 'testing'
  | 'design-system'
  | 'drupal'
  | 'build-system'
  | 'ci-cd'
  | 'version-management'
  | 'documentation';

interface StatusChange {
  from: IssueStatus;
  to: IssueStatus;
  date: string;
  changedBy: string;
  note?: string;
}

interface TrackedIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
  tags: string[];
  status: IssueStatus;
  statusHistory: StatusChange[];
  source: IssueSource;
  reporter: string;
  firstSeenIn: string;
  lastSeenIn: string;
  impact?: string;
  recommendation?: string;
  effort?: string;
  owner?: string;
  blockedBy?: string[];
  blocks?: string[];
  relatedTo?: string[];
  actionItemRef?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  notes?: string[];
}

interface IssuesIndex {
  version: '1.0.0';
  lastUpdated: string;
  stats: {
    total: number;
    bySeverity: Record<Severity, number>;
    byStatus: Record<IssueStatus, number>;
    byCategory: Record<string, number>;
    resolvedCount: number;
    resolutionRate: number;
  };
  issues: TrackedIssue[];
}

interface ReviewSnapshot {
  date: string;
  model: string;
  status: string;
  totalIssues: number;
  agentCount: number;
  bySeverity: Record<Severity, number>;
  filePath: string;
}

interface ReviewsIndex {
  reviews: ReviewSnapshot[];
}

// ---------------------------------------------------------------------------
// Source types (platform review JSON shape)
// ---------------------------------------------------------------------------

interface Finding {
  id: string;
  title: string;
  description: string;
  impact?: string;
  recommendation?: string;
  effort?: string;
  status?: string;
}

interface AgentEntry {
  status: string;
  scope: string;
  findings: {
    critical: Finding[];
    high: Finding[];
    medium: Finding[];
    low: Finding[];
  };
}

interface ActionItem {
  id: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  requirements: string[];
  owner: string;
  timeline: string;
  effort: string;
  blocking: string[];
  status: string;
}

interface PlatformReview {
  reviewDate: string;
  model: string;
  status: string;
  agents: Record<string, AgentEntry>;
  summary: {
    totalIssues: number;
    byPriority: Record<string, number>;
    actionItems: ActionItem[];
  };
  productionReadiness: {
    verdict: string;
    estimatedEffortToProduction: string;
  };
}

// ---------------------------------------------------------------------------
// Resolve paths from monorepo root
// ---------------------------------------------------------------------------

// The script is at apps/admin/scripts/ so monorepo root is 3 levels up
const MONOREPO_ROOT = join(__dirname, '..', '..', '..');
const SOURCE_PATH = join(MONOREPO_ROOT, '.claude', 'platform-review-2026-02-15.json');
const ISSUES_DIR = join(MONOREPO_ROOT, '.claude', 'issues');
const REVIEWS_DIR = join(ISSUES_DIR, 'reviews');
const ISSUES_PATH = join(ISSUES_DIR, 'issues.json');
const REVIEWS_INDEX_PATH = join(REVIEWS_DIR, 'index.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferCategory(agentName: string, title: string): IssueCategory {
  if (agentName.includes('accessibility')) return 'accessibility';
  if (agentName.includes('performance')) return 'performance';
  if (agentName.includes('design-system')) return 'design-system';
  if (agentName.includes('drupal')) return 'drupal';
  if (agentName.includes('devops')) return 'ci-cd';
  if (agentName.includes('test-architect') || agentName.includes('qa-engineer')) return 'testing';
  if (agentName.includes('typescript') || agentName.includes('staff-software'))
    return 'build-system';
  if (agentName.includes('storybook')) return 'dx';
  if (agentName.includes('lit-specialist')) return 'dx';
  if (agentName.includes('frontend')) return 'dx';
  if (title.toLowerCase().includes('changesets') || title.toLowerCase().includes('version'))
    return 'version-management';
  if (title.toLowerCase().includes('documentation') || title.toLowerCase().includes('onboarding'))
    return 'documentation';
  return 'dx';
}

function extractTags(finding: Finding, severity: Severity, agentName: string): string[] {
  const tags: string[] = [severity];

  if (finding.impact?.toLowerCase().includes('wcag')) tags.push('wcag');
  if (finding.impact?.toLowerCase().includes('enterprise')) tags.push('enterprise-blocker');
  if (
    finding.impact?.toLowerCase().includes('v1.0') ||
    finding.impact?.toLowerCase().includes('production')
  ) {
    tags.push('v1.0-blocker');
  }
  if (finding.impact?.toLowerCase().includes('enterprise') && !tags.includes('enterprise')) {
    tags.push('enterprise');
  }
  if (
    finding.title?.toLowerCase().includes('dark mode') ||
    finding.title?.toLowerCase().includes('light/dark')
  ) {
    tags.push('theming');
  }

  tags.push(agentName);

  return tags;
}

function normalizeStatus(raw: string | undefined): IssueStatus {
  if (!raw) return 'not-started';
  const normalized = raw.toLowerCase().trim();
  if (normalized === 'complete' || normalized === 'completed' || normalized === 'done')
    return 'complete';
  if (normalized === 'in-progress' || normalized === 'in progress') return 'in-progress';
  if (normalized === 'blocked') return 'blocked';
  return 'not-started';
}

function computeStats(issues: TrackedIssue[]): IssuesIndex['stats'] {
  const bySeverity: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byStatus: Record<IssueStatus, number> = {
    'not-started': 0,
    'in-progress': 0,
    blocked: 0,
    complete: 0,
  };
  const byCategory: Record<string, number> = {};

  for (const issue of issues) {
    bySeverity[issue.severity]++;
    byStatus[issue.status]++;
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }

  const resolvedCount = byStatus['complete'];
  const resolutionRate =
    issues.length > 0 ? Math.round((resolvedCount / issues.length) * 10000) / 10000 : 0;

  return {
    total: issues.length,
    bySeverity,
    byStatus,
    byCategory,
    resolvedCount,
    resolutionRate,
  };
}

/**
 * Try to match a TrackedIssue to an action item by comparing categories and
 * looking for keyword overlap in titles.
 */
function findActionItemRef(issue: TrackedIssue, actionItems: ActionItem[]): string | undefined {
  const issueTitle = issue.title.toLowerCase();
  const issueCategory = issue.category;

  for (const action of actionItems) {
    const actionCategory = action.category.toLowerCase();
    const actionTitle = action.title.toLowerCase();
    const actionDesc = action.description.toLowerCase();

    // Check if the action item's description or title mentions this issue's title keywords
    const titleWords = issueTitle.split(/\s+/).filter((w) => w.length > 4); // only significant words

    const matchesCategory =
      actionCategory.includes(issueCategory) ||
      (issueCategory === 'design-system' && actionCategory.includes('design system')) ||
      (issueCategory === 'accessibility' && actionCategory.includes('accessibility')) ||
      (issueCategory === 'ci-cd' &&
        (actionCategory.includes('ci/cd') || actionCategory.includes('ci-cd'))) ||
      (issueCategory === 'build-system' && actionCategory.includes('build')) ||
      (issueCategory === 'testing' && actionCategory.includes('testing')) ||
      (issueCategory === 'drupal' && actionCategory.includes('drupal')) ||
      (issueCategory === 'version-management' && actionCategory.includes('version')) ||
      (issueCategory === 'performance' && actionCategory.includes('performance')) ||
      (issueCategory === 'documentation' && actionCategory.includes('documentation'));

    if (matchesCategory) {
      const keywordHits = titleWords.filter(
        (w) => actionTitle.includes(w) || actionDesc.includes(w),
      );
      if (keywordHits.length >= 1) {
        return action.id;
      }
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

function migrate(): void {
  console.log('=== Issue Tracker Migration ===\n');

  // 1. Read source
  if (!existsSync(SOURCE_PATH)) {
    console.error(`Source file not found: ${SOURCE_PATH}`);
    process.exit(1);
  }

  const raw = readFileSync(SOURCE_PATH, 'utf-8');
  const review: PlatformReview = JSON.parse(raw);
  console.log(`Source: ${SOURCE_PATH}`);
  console.log(`Review date: ${review.reviewDate}`);
  console.log(`Agents: ${Object.keys(review.agents).length}`);

  // 2. Convert findings to TrackedIssue[]
  const issues: TrackedIssue[] = [];
  const reviewDate = review.reviewDate; // "2026-02-15"
  const isoDate = `${reviewDate}T00:00:00Z`;

  const severityLevels: Severity[] = ['critical', 'high', 'medium', 'low'];

  for (const [agentName, agent] of Object.entries(review.agents)) {
    for (const severity of severityLevels) {
      const findings = agent.findings[severity];
      if (!findings) continue;

      for (const finding of findings) {
        const status = normalizeStatus(finding.status);
        const category = inferCategory(agentName, finding.title);
        const tags = extractTags(finding, severity, agentName);

        const statusHistory: StatusChange[] = [];
        let resolvedAt: string | undefined;

        if (status === 'complete') {
          statusHistory.push({
            from: 'not-started',
            to: 'complete',
            date: isoDate,
            changedBy: agentName,
          });
          resolvedAt = isoDate;
        }

        const tracked: TrackedIssue = {
          id: finding.id,
          title: finding.title,
          description: finding.description,
          severity,
          category,
          tags,
          status,
          statusHistory,
          source: 'agent-review',
          reporter: agentName,
          firstSeenIn: reviewDate,
          lastSeenIn: reviewDate,
          impact: finding.impact,
          recommendation: finding.recommendation,
          effort: finding.effort,
          createdAt: isoDate,
          updatedAt: isoDate,
          resolvedAt,
        };

        issues.push(tracked);
      }
    }
  }

  // 3. Match action item references
  const actionItems = review.summary?.actionItems ?? [];
  for (const issue of issues) {
    const ref = findActionItemRef(issue, actionItems);
    if (ref) {
      issue.actionItemRef = ref;
    }
  }

  console.log(
    `\nConverted ${issues.length} issues from ${Object.keys(review.agents).length} agents`,
  );

  // 4. Count by severity
  const bySev: Record<string, number> = {};
  for (const issue of issues) {
    bySev[issue.severity] = (bySev[issue.severity] ?? 0) + 1;
  }
  console.log(`  Critical: ${bySev['critical'] ?? 0}`);
  console.log(`  High:     ${bySev['high'] ?? 0}`);
  console.log(`  Medium:   ${bySev['medium'] ?? 0}`);
  console.log(`  Low:      ${bySev['low'] ?? 0}`);

  // 5. Create directories
  mkdirSync(REVIEWS_DIR, { recursive: true });
  console.log(`\nCreated: ${ISSUES_DIR}`);
  console.log(`Created: ${REVIEWS_DIR}`);

  // 6. Write issues.json
  const issuesIndex: IssuesIndex = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    stats: computeStats(issues),
    issues,
  };

  writeFileSync(ISSUES_PATH, JSON.stringify(issuesIndex, null, 2), 'utf-8');
  console.log(`\nWrote: ${ISSUES_PATH}`);
  console.log(`  Total issues: ${issuesIndex.stats.total}`);
  console.log(`  Resolved: ${issuesIndex.stats.resolvedCount}`);
  console.log(`  Resolution rate: ${(issuesIndex.stats.resolutionRate * 100).toFixed(1)}%`);

  // 7. Copy original review to reviews directory
  const reviewDest = join(REVIEWS_DIR, `${reviewDate}.json`);
  copyFileSync(SOURCE_PATH, reviewDest);
  console.log(`\nCopied review to: ${reviewDest}`);

  // 8. Write reviews index
  const agentCount = Object.keys(review.agents).length;
  const reviewSnapshot: ReviewSnapshot = {
    date: reviewDate,
    model: review.model ?? 'unknown',
    status: review.status ?? 'completed',
    totalIssues: issues.length,
    agentCount,
    bySeverity: issuesIndex.stats.bySeverity,
    filePath: `reviews/${reviewDate}.json`,
  };

  const reviewsIndex: ReviewsIndex = {
    reviews: [reviewSnapshot],
  };

  writeFileSync(REVIEWS_INDEX_PATH, JSON.stringify(reviewsIndex, null, 2), 'utf-8');
  console.log(`Wrote: ${REVIEWS_INDEX_PATH}`);

  // 9. Summary
  console.log('\n=== Migration Complete ===');
  console.log(`Issues index:   ${ISSUES_PATH}`);
  console.log(`Reviews index:  ${REVIEWS_INDEX_PATH}`);
  console.log(`Review archive: ${reviewDest}`);
  console.log(`\nStats:`);
  console.log(`  Total:          ${issuesIndex.stats.total}`);
  console.log(`  By severity:    ${JSON.stringify(issuesIndex.stats.bySeverity)}`);
  console.log(`  By status:      ${JSON.stringify(issuesIndex.stats.byStatus)}`);
  console.log(`  Categories:     ${Object.keys(issuesIndex.stats.byCategory).length}`);
  console.log(`  Resolved:       ${issuesIndex.stats.resolvedCount}/${issuesIndex.stats.total}`);

  // 10. Print action item matches
  const matched = issues.filter((i) => i.actionItemRef);
  if (matched.length > 0) {
    console.log(`\nAction item cross-references: ${matched.length}`);
    for (const m of matched) {
      console.log(`  ${m.id} -> ${m.actionItemRef}`);
    }
  }
}

migrate();
