import {
  computeDimensionAverages,
  computeGradeDistribution,
  computeLibraryScore,
  scoreToGrade,
} from './scorer.js';
import type {
  A11yReport,
  ComponentA11yProfile,
  Recommendation,
  ReportSummary,
  Severity,
} from './types.js';

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  info: 3,
};

/**
 * Generate a full A11yReport from analyzed component profiles.
 */
export function generateReport(components: ComponentA11yProfile[]): A11yReport {
  const libraryScore = computeLibraryScore(components);
  const libraryGrade = scoreToGrade(libraryScore);

  // Collect and deduplicate recommendations across all components
  const allRecommendations = collectRecommendations(components);

  const summary = buildSummary(components, allRecommendations);

  return {
    libraryScore,
    libraryGrade,
    componentCount: components.length,
    components,
    recommendations: allRecommendations,
    summary,
  };
}

/**
 * Collect all recommendations from component profiles, sorted by severity.
 */
function collectRecommendations(components: ComponentA11yProfile[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const component of components) {
    recommendations.push(...component.recommendations);
  }

  // Sort by severity (critical first), then by component name
  recommendations.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.component.localeCompare(b.component);
  });

  return recommendations;
}

/**
 * Build summary statistics for the report.
 */
function buildSummary(
  components: ComponentA11yProfile[],
  recommendations: Recommendation[],
): ReportSummary {
  const gradeDistribution = computeGradeDistribution(components);
  const dimensionAverages = computeDimensionAverages(components);
  const averageScore = computeLibraryScore(components);

  // Top issues: unique critical/major recommendations, limited to 10
  const topIssues = recommendations
    .filter((r) => r.severity === 'critical' || r.severity === 'major')
    .slice(0, 10);

  return {
    totalComponents: components.length,
    averageScore,
    gradeDistribution,
    dimensionAverages,
    topIssues,
  };
}
