/**
 * Health History Reader.
 * Reads historical health snapshots and calculates trends.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentHealth } from './health-scorer';

export interface HealthSnapshot {
  date: string;
  timestamp: number;
  components: ComponentHealth[];
  summary: {
    totalComponents: number;
    averageScore: number;
    averageGrade: string;
    gradeDistribution: Record<string, number>;
  };
}

export interface TrendData {
  component: string;
  history: Array<{
    date: string;
    score: number;
    grade: string;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number; // % change over period
  currentScore: number;
  previousScore: number;
}

function getHistoryDir(): string {
  return resolve(process.cwd(), '../../.claude/health-history');
}

/**
 * Read a specific health snapshot by date.
 */
export function readHealthSnapshot(date: string): HealthSnapshot | null {
  const historyDir = getHistoryDir();
  const filePath = resolve(historyDir, `${date}.json`);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as HealthSnapshot;
  } catch {
    return null;
  }
}

/**
 * Get all available health snapshot dates (sorted newest first).
 */
export function getAvailableDates(): string[] {
  const historyDir = getHistoryDir();

  if (!existsSync(historyDir)) {
    return [];
  }

  const files = readdirSync(historyDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''))
    .sort()
    .reverse();

  return files;
}

/**
 * Get the most recent health snapshot.
 */
export function getLatestSnapshot(): HealthSnapshot | null {
  const dates = getAvailableDates();
  if (dates.length === 0) return null;
  return readHealthSnapshot(dates[0]);
}

/**
 * Get health snapshots for the last N days.
 */
export function getRecentSnapshots(days: number): HealthSnapshot[] {
  const dates = getAvailableDates();
  const snapshots: HealthSnapshot[] = [];

  for (let i = 0; i < Math.min(days, dates.length); i++) {
    const snapshot = readHealthSnapshot(dates[i]);
    if (snapshot) {
      snapshots.push(snapshot);
    }
  }

  return snapshots;
}

/**
 * Calculate trend data for a specific component over the last N days.
 */
export function getComponentTrend(componentName: string, days = 30): TrendData | null {
  const snapshots = getRecentSnapshots(days);
  if (snapshots.length === 0) return null;

  const history = snapshots
    .map((snapshot) => {
      const component = snapshot.components.find((c) => c.tagName === componentName);
      if (!component) return null;

      return {
        date: snapshot.date,
        score: component.overallScore,
        grade: component.grade,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .reverse(); // Oldest first for trend calculation

  if (history.length === 0) return null;

  const currentScore = history[history.length - 1].score;
  const previousScore = history[0].score;
  const changePercent =
    previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;

  const trend: TrendData['trend'] =
    Math.abs(changePercent) < 2 ? 'stable' : changePercent > 0 ? 'improving' : 'declining';

  return {
    component: componentName,
    history,
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
    currentScore,
    previousScore,
  };
}

/**
 * Get trend data for all components.
 */
export function getAllComponentTrends(days = 30): TrendData[] {
  const latest = getLatestSnapshot();
  if (!latest) return [];

  const componentNames = latest.components.map((c) => c.tagName);
  const trends: TrendData[] = [];

  for (const name of componentNames) {
    const trend = getComponentTrend(name, days);
    if (trend) {
      trends.push(trend);
    }
  }

  return trends.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * Get platform-wide trend (average score over time).
 */
export function getPlatformTrend(
  days = 30,
): Array<{ date: string; averageScore: number; averageGrade: string }> {
  const snapshots = getRecentSnapshots(days);

  return snapshots
    .map((snapshot) => ({
      date: snapshot.date,
      averageScore: snapshot.summary.averageScore,
      averageGrade: snapshot.summary.averageGrade,
    }))
    .reverse(); // Oldest first
}

/**
 * Compare two snapshots and identify components with significant changes.
 */
export function compareSnapshots(
  date1: string,
  date2: string,
): Array<{ component: string; oldScore: number; newScore: number; change: number }> {
  const snapshot1 = readHealthSnapshot(date1);
  const snapshot2 = readHealthSnapshot(date2);

  if (!snapshot1 || !snapshot2) return [];

  const comparisons: Array<{
    component: string;
    oldScore: number;
    newScore: number;
    change: number;
  }> = [];

  for (const comp1 of snapshot1.components) {
    const comp2 = snapshot2.components.find((c) => c.tagName === comp1.tagName);
    if (comp2) {
      const change = comp2.overallScore - comp1.overallScore;
      if (Math.abs(change) >= 5) {
        // Only show significant changes (5+ points)
        comparisons.push({
          component: comp1.tagName,
          oldScore: comp1.overallScore,
          newScore: comp2.overallScore,
          change,
        });
      }
    }
  }

  return comparisons.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
