/**
 * MCP Health Writer.
 * Converts admin's 17-dimension ComponentHealth → wc-tools HistoryFileRaw format
 * and writes to .mcp-wc/health/{tagName}/{YYYY-MM-DD}.json.
 *
 * This bridges the admin's rich scoring into wc-tools' health history so that
 * MCP consumers (Claude Code, editors) get real 17-dimension data instead of
 * CEM-only fallback scores.
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { MCP_HEALTH_HISTORY_DIR } from './mcp-constants';
import type { ComponentHealth, HealthDimension } from './health-scorer';

/** wc-tools history file format (mirrors HistoryFileRaw in wc-tools) */
interface McpHistoryFile {
  component: string;
  date: string;
  score: number;
  breakdown: Record<string, { score: number; weight: number; details?: Record<string, unknown> }>;
  issues: Array<{ message: string }>;
}

function dimensionToBreakdown(d: HealthDimension): {
  score: number;
  weight: number;
  details?: Record<string, unknown>;
} {
  const entry: { score: number; weight: number; details?: Record<string, unknown> } = {
    score: d.score ?? 0,
    weight: d.weight,
  };

  // Include confidence as detail metadata
  const details: Record<string, unknown> = {
    confidence: d.confidence,
    methodology: d.methodology,
    measured: d.measured,
    phase: d.phase,
  };

  if (d.subMetrics && d.subMetrics.length > 0) {
    details.subMetrics = d.subMetrics.map((sm) => ({
      name: sm.name,
      score: sm.score,
      weight: sm.weight,
      passed: sm.passed,
    }));
  }

  entry.details = details;
  return entry;
}

function componentToHistoryFile(health: ComponentHealth, date: string): McpHistoryFile {
  const breakdown: McpHistoryFile['breakdown'] = {};
  for (const dim of health.dimensions) {
    breakdown[dim.name] = dimensionToBreakdown(dim);
  }

  const issues: McpHistoryFile['issues'] = health.dimensions
    .filter((d) => d.measured && d.score !== null && d.score < 70)
    .map((d) => ({
      message: `${d.name} below threshold: ${d.score}%`,
    }));

  return {
    component: health.tagName,
    date,
    score: health.overallScore,
    breakdown,
    issues,
  };
}

/**
 * Write a single component's health to the wc-tools history directory.
 */
function writeComponentHistory(health: ComponentHealth, date: string): void {
  const dir = resolve(MCP_HEALTH_HISTORY_DIR, health.tagName);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const file = componentToHistoryFile(health, date);
  const filePath = resolve(dir, `${date}.json`);
  writeFileSync(filePath, JSON.stringify(file, null, 2), 'utf-8');
}

/**
 * Sync all component health scores to wc-tools' history format.
 * Fire-and-forget — errors are caught and never propagated.
 */
export function syncToMcpHealthHistory(components: ComponentHealth[], date?: Date): void {
  try {
    const dateStr = (date ?? new Date()).toISOString().split('T')[0];
    for (const component of components) {
      writeComponentHistory(component, dateStr);
    }
  } catch {
    // Fire-and-forget: never block admin operations
  }
}
