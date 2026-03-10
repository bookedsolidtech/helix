/**
 * Audit Report.
 * Types and aggregation logic for the one-shot library audit feature.
 */
import type { ComponentHealth } from './health-scorer';
import type { A11yResult } from './a11y-analyzer';
import type { ComponentValidation } from './cem-validator';
import type { BundleSizeResult } from './bundle-analyzer';
import type { McpComponentHealth, McpAccessibilityProfile } from './mcp-client';

export type ScoringTier = 'full' | 'cem-only';

export interface CriticalIssue {
  component: string;
  dimension: string;
  severity: 'critical' | 'warning';
  message: string;
  fix: string;
}

export interface ComponentGrade {
  tagName: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface HealthBreakdown {
  averageScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensionSummary: Array<{ name: string; averageScore: number; passed: boolean }>;
}

export interface AccessibilityBreakdown {
  averageScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalComponents: number;
  passedComponents: number;
}

export interface CemQuality {
  averageCompleteness: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  totalComponents: number;
  fullyDocumented: number;
}

export interface BundleSizeData {
  totalGzipBytes: number;
  underBudget: boolean;
  averageGzipBytes: number;
  componentCount: number;
}

export interface AuditReport {
  libraryId: string;
  libraryName: string;
  scoringTier: ScoringTier;
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  timestamp: string;
  health: HealthBreakdown;
  accessibility: AccessibilityBreakdown;
  cemQuality: CemQuality;
  bundleSize: BundleSizeData | null;
  criticalIssues: CriticalIssue[];
  componentGrades: ComponentGrade[];
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function aggregateLocalAudit(
  healthResults: ComponentHealth[],
  a11yResults: (A11yResult | null)[],
  cemValidations: (ComponentValidation | null)[],
  bundleResults: (BundleSizeResult | null)[],
  libraryId: string,
  libraryName: string,
): AuditReport {
  const timestamp = new Date().toISOString();

  // Health breakdown
  const healthScores = healthResults.map((c) => c.overallScore);
  const avgHealth = avg(healthScores);

  // Aggregate dimension summaries across all components
  const dimensionMap = new Map<string, number[]>();
  for (const comp of healthResults) {
    for (const dim of comp.dimensions) {
      if (dim.measured && dim.score !== null) {
        const existing = dimensionMap.get(dim.name) ?? [];
        existing.push(dim.score);
        dimensionMap.set(dim.name, existing);
      }
    }
  }
  const dimensionSummary = Array.from(dimensionMap.entries()).map(([name, scores]) => {
    const avgScore = avg(scores);
    return { name, averageScore: avgScore, passed: avgScore >= 70 };
  });

  const health: HealthBreakdown = {
    averageScore: avgHealth,
    grade: scoreToGrade(avgHealth),
    dimensionSummary,
  };

  // Accessibility breakdown
  const a11yValid = a11yResults.filter((r): r is A11yResult => r !== null);
  const a11yScores = a11yValid.map((r) => r.score);
  const avgA11y = avg(a11yScores);
  const a11yPassed = a11yValid.filter((r) => r.score >= 70).length;

  const accessibility: AccessibilityBreakdown = {
    averageScore: avgA11y,
    grade: scoreToGrade(avgA11y),
    totalComponents: a11yValid.length,
    passedComponents: a11yPassed,
  };

  // CEM quality
  const cemValid = cemValidations.filter((v): v is ComponentValidation => v !== null);
  const cemScores = cemValid.map((v) => v.overallCompleteness);
  const avgCem = avg(cemScores);
  const fullyDocumented = cemValid.filter((v) => v.overallCompleteness >= 90).length;

  const cemQuality: CemQuality = {
    averageCompleteness: avgCem,
    grade: scoreToGrade(avgCem),
    totalComponents: cemValid.length,
    fullyDocumented,
  };

  // Bundle size
  const bundleValid = bundleResults.filter((b): b is BundleSizeResult => b !== null);
  let bundleSize: BundleSizeData | null = null;
  if (bundleValid.length > 0) {
    const totalGzip = bundleValid.reduce((sum, b) => sum + b.gzipBytes, 0);
    bundleSize = {
      totalGzipBytes: totalGzip,
      underBudget: bundleValid.every((b) => b.underBudget),
      averageGzipBytes: Math.round(totalGzip / bundleValid.length),
      componentCount: bundleValid.length,
    };
  }

  // Critical issues — top 5 from lowest-scoring dimensions per component
  const criticalIssues: CriticalIssue[] = [];

  for (const comp of healthResults) {
    const failing = comp.dimensions
      .filter((d) => d.measured && d.score !== null && d.score < 60)
      .sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
      .slice(0, 2);

    for (const dim of failing) {
      if (criticalIssues.length >= 5) break;
      criticalIssues.push({
        component: comp.tagName,
        dimension: dim.name,
        severity: (dim.score ?? 100) < 40 ? 'critical' : 'warning',
        message: `${dim.name} score is ${dim.score ?? 0}% for ${comp.tagName}`,
        fix: `Improve ${dim.name.toLowerCase()} to meet the 60% minimum threshold.`,
      });
    }
    if (criticalIssues.length >= 5) break;
  }

  // Component grades
  const componentGrades: ComponentGrade[] = healthResults.map((c) => ({
    tagName: c.tagName,
    score: c.overallScore,
    grade: c.grade,
  }));

  // Overall score: weighted average of health (50%), a11y (30%), CEM (20%)
  const overallScore = Math.round(avgHealth * 0.5 + avgA11y * 0.3 + avgCem * 0.2);
  const overallGrade = scoreToGrade(overallScore);

  return {
    libraryId,
    libraryName,
    scoringTier: 'full',
    overallScore,
    overallGrade,
    timestamp,
    health,
    accessibility,
    cemQuality,
    bundleSize,
    criticalIssues,
    componentGrades,
  };
}

export function aggregateMcpAudit(
  healthScores: McpComponentHealth[],
  a11yProfiles: McpAccessibilityProfile[],
  libraryId: string,
  libraryName: string,
): AuditReport {
  const timestamp = new Date().toISOString();

  // Health breakdown from MCP data
  const healthNums = healthScores.map((c) => c.score);
  const avgHealth = avg(healthNums);

  const health: HealthBreakdown = {
    averageScore: avgHealth,
    grade: scoreToGrade(avgHealth),
    dimensionSummary: [],
  };

  // Accessibility from MCP profiles
  const a11yNums = a11yProfiles.map((p) => p.score);
  const avgA11y = avg(a11yNums);

  const accessibility: AccessibilityBreakdown = {
    averageScore: avgA11y,
    grade: scoreToGrade(avgA11y),
    totalComponents: a11yProfiles.length,
    passedComponents: a11yProfiles.filter((p) => p.score >= 70).length,
  };

  // CEM quality not directly available from MCP tier
  const cemQuality: CemQuality = {
    averageCompleteness: 0,
    grade: 'F',
    totalComponents: 0,
    fullyDocumented: 0,
  };

  // Critical issues from MCP issues arrays
  const criticalIssues: CriticalIssue[] = [];
  for (const comp of healthScores) {
    for (const issue of comp.issues.slice(0, 1)) {
      if (criticalIssues.length >= 5) break;
      criticalIssues.push({
        component: comp.tagName,
        dimension: 'Health',
        severity: comp.score < 60 ? 'critical' : 'warning',
        message: issue,
        fix: 'Review component implementation against health scoring criteria.',
      });
    }
    if (criticalIssues.length >= 5) break;
  }

  const componentGrades: ComponentGrade[] = healthScores.map((c) => ({
    tagName: c.tagName,
    score: c.score,
    grade: c.grade,
  }));

  const overallScore = Math.round(avgHealth * 0.7 + avgA11y * 0.3);
  const overallGrade = scoreToGrade(overallScore);

  return {
    libraryId,
    libraryName,
    scoringTier: 'cem-only',
    overallScore,
    overallGrade,
    timestamp,
    health,
    accessibility,
    cemQuality,
    bundleSize: null,
    criticalIssues,
    componentGrades,
  };
}
