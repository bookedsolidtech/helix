import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type {
  IssuesIndex,
  TrackedIssue,
  Severity,
  IssueStatus,
  ReviewsIndex,
} from '@/types/issues';

const ISSUES_DIR = join(process.cwd(), '../../.claude/issues');
const ISSUES_PATH = join(ISSUES_DIR, 'issues.json');
const REVIEWS_DIR = join(ISSUES_DIR, 'reviews');
const REVIEWS_INDEX_PATH = join(REVIEWS_DIR, 'index.json');

/**
 * Compute aggregate statistics from the issues list.
 */
export function computeStats(issues: TrackedIssue[]): IssuesIndex['stats'] {
  const bySeverity: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

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
 * Load and parse the issues index from disk.
 */
export function loadIssues(): IssuesIndex {
  if (!existsSync(ISSUES_PATH)) {
    return {
      version: '1.0.0',
      issues: [],
      stats: computeStats([]),
      lastUpdated: new Date().toISOString(),
    };
  }
  const content = readFileSync(ISSUES_PATH, 'utf-8');
  return JSON.parse(content) as IssuesIndex;
}

/**
 * Recompute stats, set lastUpdated, and write the issues index back to disk.
 */
export function saveIssues(data: IssuesIndex): void {
  const dir = dirname(ISSUES_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  data.stats = computeStats(data.issues);
  data.lastUpdated = new Date().toISOString();

  writeFileSync(ISSUES_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Load the reviews index (list of all review snapshots).
 */
export function loadReviewsIndex(): ReviewsIndex {
  if (!existsSync(REVIEWS_INDEX_PATH)) {
    return { reviews: [] } as ReviewsIndex;
  }
  const content = readFileSync(REVIEWS_INDEX_PATH, 'utf-8');
  return JSON.parse(content) as ReviewsIndex;
}

/**
 * Load a single review by date (e.g. "2026-02-15").
 * Returns null if the file does not exist.
 */
export function loadReview(date: string): unknown | null {
  const reviewPath = join(REVIEWS_DIR, `${date}.json`);
  if (!existsSync(reviewPath)) {
    return null;
  }
  const content = readFileSync(reviewPath, 'utf-8');
  return JSON.parse(content) as unknown;
}
