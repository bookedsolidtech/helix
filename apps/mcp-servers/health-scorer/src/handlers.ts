import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

// Import the existing health scorer from admin app
// We'll use direct file reading to avoid complex imports
const HEALTH_HISTORY_DIR = resolve(process.cwd(), '../../.claude/health-history');

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

export async function scoreComponent(tagName: string): Promise<ComponentHealth> {
  // Use the existing health-scorer logic
  // For now, we'll create a simplified version that reads from health history
  const latestHistory = getLatestHealthHistory();

  if (!latestHistory) {
    throw new Error('No health history found. Run health scorer first.');
  }

  const component = latestHistory.components?.find(
    (c: { tagName: string }) => c.tagName === tagName,
  );

  if (!component) {
    throw new Error(`Component ${tagName} not found in health history`);
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
    throw new Error('No health history found. Run health scorer first.');
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
  if (!existsSync(HEALTH_HISTORY_DIR)) {
    throw new Error(`Health history directory not found at ${HEALTH_HISTORY_DIR}`);
  }

  const files = readdirSync(HEALTH_HISTORY_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, days);

  if (files.length === 0) {
    throw new Error('No health history files found');
  }

  const dataPoints: Array<{ date: string; score: number; grade: string }> = [];

  for (const file of files) {
    const content = readFileSync(join(HEALTH_HISTORY_DIR, file), 'utf-8');
    const history = JSON.parse(content);
    const component = history.components?.find((c: { tagName: string }) => c.tagName === tagName);

    if (component) {
      dataPoints.push({
        date: file.replace('.json', ''),
        score: component.score ?? 0,
        grade: component.grade ?? 'F',
      });
    }
  }

  if (dataPoints.length === 0) {
    throw new Error(`No history found for ${tagName} in the last ${days} days`);
  }

  // Calculate trend
  const firstScore = dataPoints[dataPoints.length - 1]?.score ?? 0;
  const lastScore = dataPoints[0]?.score ?? 0;
  const changePercent = ((lastScore - firstScore) / firstScore) * 100;

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
  try {
    // Get current branch name
    const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf-8',
    }).trim();

    // Get current health score
    const currentHealth = await scoreComponent(tagName);

    // Stash changes
    const stashResult = execSync('git stash push -u -m "MCP health-scorer temp stash"', {
      encoding: 'utf-8',
    });
    const hasStash = !stashResult.includes('No local changes');

    // Checkout base branch
    execSync(`git checkout ${baseBranch}`, { encoding: 'utf-8' });

    // Get base health score
    let baseHealth: ComponentHealth;
    try {
      baseHealth = await scoreComponent(tagName);
    } catch {
      // Component might not exist in base branch
      baseHealth = {
        tagName,
        score: 0,
        grade: 'F',
        dimensions: {},
        issues: ['Component not found in base branch'],
        timestamp: new Date().toISOString(),
      };
    }

    // Return to current branch
    execSync(`git checkout ${currentBranch}`, { encoding: 'utf-8' });

    // Restore stashed changes
    if (hasStash) {
      execSync('git stash pop', { encoding: 'utf-8' });
    }

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
  } catch (error) {
    throw new Error(
      `Health diff failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
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
  if (!existsSync(HEALTH_HISTORY_DIR)) {
    return null;
  }

  const files = readdirSync(HEALTH_HISTORY_DIR)
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

  const content = readFileSync(join(HEALTH_HISTORY_DIR, latestFile), 'utf-8');
  return JSON.parse(content);
}
