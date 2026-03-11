import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { z } from 'zod';
import { GitOperations, SafeFileOperations, MCPError, ErrorCategory } from '@helixui/mcp-shared';

const PROJECT_ROOT = resolve(process.cwd(), '../..');
const HEALTH_HISTORY_DIR = '.claude/health-history';

const git = new GitOperations(PROJECT_ROOT);
const fileOps = new SafeFileOperations(PROJECT_ROOT);

interface ComponentHealth {
  tagName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: Record<string, number>;
  issues: string[];
  timestamp: string;
}

interface HealthTrend {
  tagName: string;
  days: number;
  dataPoints: Array<{
    date: string;
    score: number;
    grade: string;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
}

interface HealthDiff {
  tagName: string;
  base: ComponentHealth;
  current: ComponentHealth;
  improved: boolean;
  regressed: boolean;
  scoreDelta: number;
  changedDimensions: Array<{
    dimension: string;
    before: number;
    after: number;
    delta: number;
  }>;
}

// Zod schema for health history files - allow optional fields but coerce to defaults
const ComponentHealthSchema = z
  .object({
    tagName: z.string(),
    score: z.number().optional(),
    grade: z.string().optional(),
    dimensions: z.record(z.number()).optional(),
    issues: z.array(z.string()).optional(),
  })
  .transform((data) => ({
    tagName: data.tagName,
    score: data.score ?? 0,
    grade: data.grade ?? 'F',
    dimensions: data.dimensions ?? {},
    issues: data.issues ?? [],
  }));

const HealthHistorySchema = z.object({
  timestamp: z.string(),
  components: z.array(ComponentHealthSchema),
});

export async function scoreComponent(tagName: string): Promise<ComponentHealth> {
  // Use the existing health-scorer logic
  // For now, we'll create a simplified version that reads from health history
  const latestHistory = getLatestHealthHistory();

  if (!latestHistory) {
    throw new MCPError(
      'No health history found. Run health scorer first.',
      ErrorCategory.UserInput,
    );
  }

  const component = latestHistory.components?.find(
    (c: { tagName: string }) => c.tagName === tagName,
  );

  if (!component) {
    throw new MCPError(`Component ${tagName} not found in health history`, ErrorCategory.UserInput);
  }

  return {
    tagName: component.tagName,
    score: component.score || 0,
    grade: (component.grade || 'F') as 'A' | 'B' | 'C' | 'D' | 'F',
    dimensions: component.dimensions || {},
    issues: component.issues || [],
    timestamp: latestHistory.timestamp || new Date().toISOString(),
  };
}

export async function scoreAllComponents(): Promise<ComponentHealth[]> {
  const latestHistory = getLatestHealthHistory();

  if (!latestHistory || !latestHistory.components) {
    throw new MCPError(
      'No health history found. Run health scorer first.',
      ErrorCategory.UserInput,
    );
  }

  return latestHistory.components.map(
    (c: {
      tagName: string;
      score: number;
      grade: string;
      dimensions: Record<string, number>;
      issues: string[];
    }) => ({
      tagName: c.tagName,
      score: c.score || 0,
      grade: (c.grade || 'F') as 'A' | 'B' | 'C' | 'D' | 'F',
      dimensions: c.dimensions || {},
      issues: c.issues || [],
      timestamp: latestHistory.timestamp || new Date().toISOString(),
    }),
  );
}

export async function getHealthTrend(tagName: string, days: number = 7): Promise<HealthTrend> {
  const historyDirPath = resolve(PROJECT_ROOT, HEALTH_HISTORY_DIR);

  if (!fileOps.fileExists(HEALTH_HISTORY_DIR)) {
    throw new MCPError(
      'Health history directory not found. Run health scorer first.',
      ErrorCategory.UserInput,
    );
  }

  const files = readdirSync(historyDirPath)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, days);

  if (files.length === 0) {
    throw new MCPError('No health history files found', ErrorCategory.UserInput);
  }

  const dataPoints: Array<{ date: string; score: number; grade: string }> = [];

  for (const file of files) {
    const filePath = join(HEALTH_HISTORY_DIR, file);
    const history = fileOps.readJSON(filePath, HealthHistorySchema);
    const component = history.components?.find((c) => c.tagName === tagName);

    if (component) {
      dataPoints.push({
        date: file.replace('.json', ''),
        score: component.score ?? 0,
        grade: component.grade ?? 'F',
      });
    }
  }

  if (dataPoints.length === 0) {
    throw new MCPError(
      `No history found for ${tagName} in the last ${days} days`,
      ErrorCategory.UserInput,
    );
  }

  // Calculate trend
  const firstScore = dataPoints[dataPoints.length - 1]?.score ?? 0;
  const lastScore = dataPoints[0]?.score ?? 0;
  const changePercent =
    firstScore === 0 ? (lastScore > 0 ? 100 : 0) : ((lastScore - firstScore) / firstScore) * 100;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (changePercent > 5) trend = 'improving';
  if (changePercent < -5) trend = 'declining';

  return {
    tagName,
    days: dataPoints.length,
    dataPoints: dataPoints.reverse(), // Oldest first
    trend,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

export async function getHealthDiff(tagName: string, baseBranch: string): Promise<HealthDiff> {
  // Get current health score
  const currentHealth = await scoreComponent(tagName);

  // Get base health score
  const baseHealth = await git.withBranch(baseBranch, async () => {
    try {
      return await scoreComponent(tagName);
    } catch {
      // Component might not exist in base branch
      return {
        tagName,
        score: 0,
        grade: 'F' as const,
        dimensions: {},
        issues: ['Component not found in base branch'],
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Calculate diff
  const scoreDelta = currentHealth.score - baseHealth.score;
  const improved = scoreDelta > 0;
  const regressed = scoreDelta < 0;

  const changedDimensions: Array<{
    dimension: string;
    before: number;
    after: number;
    delta: number;
  }> = [];

  // Compare each dimension
  const allDimensions = new Set([
    ...Object.keys(baseHealth.dimensions),
    ...Object.keys(currentHealth.dimensions),
  ]);

  for (const dim of allDimensions) {
    const before = baseHealth.dimensions[dim] || 0;
    const after = currentHealth.dimensions[dim] || 0;
    const delta = after - before;

    if (delta !== 0) {
      changedDimensions.push({
        dimension: dim,
        before,
        after,
        delta: Math.round(delta * 10) / 10,
      });
    }
  }

  return {
    tagName,
    base: baseHealth,
    current: currentHealth,
    improved,
    regressed,
    scoreDelta: Math.round(scoreDelta * 10) / 10,
    changedDimensions,
  };
}

// Helper function to get latest health history
function getLatestHealthHistory(): {
  timestamp: string;
  components: Array<{
    tagName: string;
    score: number;
    grade: string;
    dimensions: Record<string, number>;
    issues: string[];
  }>;
} | null {
  const historyDirPath = resolve(PROJECT_ROOT, HEALTH_HISTORY_DIR);

  if (!fileOps.fileExists(HEALTH_HISTORY_DIR)) {
    return null;
  }

  const files = readdirSync(historyDirPath)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  const latestFile = files[0];
  if (!latestFile) {
    return null;
  }

  const filePath = join(HEALTH_HISTORY_DIR, latestFile);
  const data = fileOps.readJSON(filePath, HealthHistorySchema);

  // Type assertion: after transformation, all fields have defaults
  return data as {
    timestamp: string;
    components: Array<{
      tagName: string;
      score: number;
      grade: string;
      dimensions: Record<string, number>;
      issues: string[];
    }>;
  };
}
