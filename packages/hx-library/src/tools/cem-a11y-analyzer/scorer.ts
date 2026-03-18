import type {
  A11yDimension,
  AnalyzerResult,
  ComponentA11yProfile,
  DimensionScore,
  Grade,
  Recommendation,
} from './types.js';

const ALL_DIMENSIONS: A11yDimension[] = [
  'ariaSupport',
  'formAssociation',
  'keyboardAccess',
  'focusManagement',
  'labelSupport',
  'motionSafety',
];

/**
 * Compute a letter grade from a numeric score (0–100).
 */
export function scoreToGrade(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Clamp a score to the valid 0–100 range.
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Build a ComponentA11yProfile from a set of analyzer results.
 */
export function buildComponentProfile(
  tagName: string,
  className: string,
  results: AnalyzerResult[],
): ComponentA11yProfile {
  const dimensions = {} as Record<A11yDimension, DimensionScore>;
  const recommendations: Recommendation[] = [];

  // Initialize all dimensions with zero scores
  for (const dim of ALL_DIMENSIONS) {
    dimensions[dim] = {
      dimension: dim,
      score: 0,
      maxScore: 100,
      findings: [],
      recommendations: [],
    };
  }

  // Populate from analyzer results
  for (const result of results) {
    const score = clampScore(result.score);
    dimensions[result.dimension] = {
      dimension: result.dimension,
      score,
      maxScore: result.maxScore,
      findings: result.findings,
      recommendations: result.recommendations.map((r) => r.message),
    };
    recommendations.push(...result.recommendations);
  }

  // Compute overall score as weighted average of all dimensions
  const overallScore = computeOverallScore(dimensions);

  return {
    tagName,
    className,
    overallScore,
    grade: scoreToGrade(overallScore),
    dimensions,
    recommendations,
  };
}

/**
 * Compute overall component score from dimension scores.
 * All dimensions weighted equally.
 */
function computeOverallScore(dimensions: Record<A11yDimension, DimensionScore>): number {
  const scores = ALL_DIMENSIONS.map((d) => dimensions[d].score);
  const total = scores.reduce((sum, s) => sum + s, 0);
  return clampScore(total / ALL_DIMENSIONS.length);
}

/**
 * Compute an aggregate library score from component profiles.
 */
export function computeLibraryScore(components: ComponentA11yProfile[]): number {
  if (components.length === 0) return 0;
  const total = components.reduce((sum, c) => sum + c.overallScore, 0);
  return clampScore(total / components.length);
}

/**
 * Compute average scores per dimension across all components.
 */
export function computeDimensionAverages(
  components: ComponentA11yProfile[],
): Record<A11yDimension, number> {
  const averages = {} as Record<A11yDimension, number>;

  for (const dim of ALL_DIMENSIONS) {
    if (components.length === 0) {
      averages[dim] = 0;
    } else {
      const total = components.reduce((sum, c) => sum + c.dimensions[dim].score, 0);
      averages[dim] = clampScore(total / components.length);
    }
  }

  return averages;
}

/**
 * Compute grade distribution across components.
 */
export function computeGradeDistribution(
  components: ComponentA11yProfile[],
): Record<Grade, number> {
  const distribution: Record<Grade, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  for (const component of components) {
    distribution[component.grade]++;
  }

  return distribution;
}
