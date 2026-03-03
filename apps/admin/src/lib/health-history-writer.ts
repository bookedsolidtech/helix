/**
 * Health History Writer.
 * Saves daily snapshots of component health scores for trend tracking.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentHealth } from './health-scorer';
import { syncToMcpHealthHistory } from './mcp-health-writer';

export interface HealthSnapshot {
  date: string; // ISO 8601 date: YYYY-MM-DD
  timestamp: number; // Unix timestamp
  components: ComponentHealth[];
  summary: {
    totalComponents: number;
    averageScore: number;
    averageGrade: string;
    gradeDistribution: Record<string, number>;
  };
}

function getHistoryDir(): string {
  return resolve(process.cwd(), '../../.claude/health-history');
}

function calculateSummary(components: ComponentHealth[]): HealthSnapshot['summary'] {
  const totalComponents = components.length;
  const averageScore =
    totalComponents > 0
      ? Math.round(components.reduce((sum, c) => sum + c.overallScore, 0) / totalComponents)
      : 0;

  const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const component of components) {
    gradeDistribution[component.grade] = (gradeDistribution[component.grade] ?? 0) + 1;
  }

  // Calculate average grade (weighted by count)
  const gradeWeights = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const totalGradeWeight = Object.entries(gradeDistribution).reduce(
    (sum, [grade, count]) => sum + gradeWeights[grade as keyof typeof gradeWeights] * count,
    0,
  );
  const avgGradeValue = totalComponents > 0 ? totalGradeWeight / totalComponents : 0;
  const averageGrade =
    avgGradeValue >= 3.5
      ? 'A'
      : avgGradeValue >= 2.5
        ? 'B'
        : avgGradeValue >= 1.5
          ? 'C'
          : avgGradeValue >= 0.5
            ? 'D'
            : 'F';

  return {
    totalComponents,
    averageScore,
    averageGrade,
    gradeDistribution,
  };
}

/**
 * Save a health snapshot to the history directory.
 * Filename format: YYYY-MM-DD.json
 */
export function saveHealthSnapshot(components: ComponentHealth[], date?: Date): void {
  const now = date ?? new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const snapshot: HealthSnapshot = {
    date: dateStr,
    timestamp: now.getTime(),
    components,
    summary: calculateSummary(components),
  };

  const historyDir = getHistoryDir();
  if (!existsSync(historyDir)) {
    mkdirSync(historyDir, { recursive: true });
  }

  const filePath = resolve(historyDir, `${dateStr}.json`);
  writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

  // Fire-and-forget: push admin scores to wc-tools history format
  try {
    syncToMcpHealthHistory(components, now);
  } catch {
    // Never block admin history saving
  }
}

/**
 * Save health snapshot with current timestamp.
 * Convenience method for manual snapshots.
 */
export function saveCurrentHealthSnapshot(components: ComponentHealth[]): string {
  const now = new Date();
  saveHealthSnapshot(components, now);
  return now.toISOString().split('T')[0];
}
