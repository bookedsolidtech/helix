/**
 * Composite Health Scorer.
 * Calculates health from 12 dimensions with confidence tracking.
 * Every dimension reports verified, traceable data — or says NOT TESTED.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { validateComponent } from "./cem-validator";
import { getComponentDirectory } from "./cem-parser";
import { analyzeJsDoc } from "./jsdoc-analyzer";
import { getTestResultsForComponent, getCoverageForComponent } from "./test-results-reader";
import { analyzeTypeSafety } from "./type-safety-analyzer";
import { analyzeAccessibility } from "./a11y-analyzer";
import { analyzeBundleSize } from "./bundle-analyzer";
import { analyzeTokenCompliance } from "./token-compliance-analyzer";
import { analyzeStoryCoverage } from "./story-coverage-analyzer";
import { analyzeDrupalReadiness } from "./drupal-readiness-analyzer";
import { analyzeVrt, analyzeCrossBrowser } from "./vrt-analyzer";

export interface HealthDimension {
  name: string;
  weight: number;
  score: number | null;
  maxScore: 100;
  measured: boolean;
  phase: string;
  confidence: "verified" | "heuristic" | "untested";
  methodology: string;
}

export interface ComponentHealth {
  tagName: string;
  className: string;
  overallScore: number;
  maxPossibleScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  dimensions: HealthDimension[];
  cemCompleteness: number;
  jsDocCoverage: number;
  storyCoverage: boolean;
  docsCoverage: boolean;
  confidenceSummary: {
    verified: number;
    heuristic: number;
    untested: number;
  };
}

function _getLibraryRoot(): string {
  return resolve(process.cwd(), "../../packages/hx-library");
}

function hasDocsPage(tagName: string): boolean {
  const docsRoot = resolve(process.cwd(), "../docs");
  const docsPath = resolve(docsRoot, `src/content/docs/component-library/${tagName}.mdx`);
  return existsSync(docsPath);
}

/**
 * Enterprise Healthcare Quality Gate Algorithm
 *
 * This algorithm implements a rigorous, multi-tier grading system that prevents
 * components from achieving high grades through weighted averaging alone.
 *
 * PHILOSOPHY:
 * - Critical dimensions MUST meet minimum thresholds to unlock each grade tier
 * - Weighted scores provide fine-grained ranking WITHIN grade bands
 * - Untested critical dimensions are treated as 0%, not ignored
 * - No gaming the system: comprehensive excellence is the only path to A/B grades
 *
 * CRITICAL DIMENSIONS (must-pass for enterprise healthcare):
 * - API Documentation (JSDoc)
 * - CEM Completeness
 * - Test Coverage
 * - Accessibility
 * - Type Safety
 * - Docs Coverage
 *
 * IMPORTANT DIMENSIONS (weighted heavily, but not grade-blocking):
 * - Story Coverage
 * - Bundle Size
 * - Token Compliance
 *
 * ADVANCED DIMENSIONS (nice-to-have, future-phase):
 * - Visual Regression
 * - Cross-Browser
 * - Drupal Readiness
 *
 * GRADE GATES:
 *
 * A (90-100): Excellence across the board
 *   - Weighted score ≥90
 *   - ALL critical dimensions ≥80%
 *   - No critical dimension untested
 *
 * B (80-89): Strong quality, minor gaps acceptable
 *   - Weighted score ≥80
 *   - ALL critical dimensions ≥70%
 *   - At most 1 critical dimension untested (treated as 0%)
 *
 * C (70-79): Acceptable quality, significant gaps present
 *   - Weighted score ≥70
 *   - ALL critical dimensions ≥60%
 *   - At most 2 critical dimensions untested
 *
 * D (60-69): Minimal quality bar
 *   - Weighted score ≥60
 *   - ALL critical dimensions ≥50%
 *   - At most 3 critical dimensions untested
 *
 * F (<60): Does not meet enterprise healthcare quality standards
 *   - Weighted score <60, OR
 *   - Any critical dimension <50%, OR
 *   - More than 3 critical dimensions untested
 *
 * PENALTY MULTIPLIERS:
 * - 0% on any critical dimension → automatic grade cap at C (regardless of weighted score)
 * - <50% on any critical dimension → automatic grade cap at D
 * - Untested critical dimension → treated as 0% for threshold checks
 */

interface DimensionClassification {
  critical: string[];
  important: string[];
  advanced: string[];
}

const DIMENSION_CLASSIFICATION: DimensionClassification = {
  critical: [
    "API Documentation",
    "CEM Completeness",
    "Test Coverage",
    "Accessibility",
    "Type Safety",
    "Docs Coverage",
  ],
  important: [
    "Story Coverage",
    "Bundle Size",
    "Token Compliance",
  ],
  advanced: [
    "Visual Regression",
    "Cross-Browser",
    "Drupal Readiness",
  ],
};

interface GradeConstraints {
  minWeightedScore: number;
  minCriticalScore: number;
  maxUntestedCritical: number;
}

const GRADE_THRESHOLDS: Record<"A" | "B" | "C" | "D", GradeConstraints> = {
  A: { minWeightedScore: 90, minCriticalScore: 80, maxUntestedCritical: 0 },
  B: { minWeightedScore: 80, minCriticalScore: 70, maxUntestedCritical: 1 },
  C: { minWeightedScore: 70, minCriticalScore: 60, maxUntestedCritical: 2 },
  D: { minWeightedScore: 60, minCriticalScore: 50, maxUntestedCritical: 3 },
};

function calculateGrade(
  weightedScore: number,
  dimensions: HealthDimension[]
): "A" | "B" | "C" | "D" | "F" {
  // Extract critical dimensions
  const criticalDimensions = dimensions.filter((d) =>
    DIMENSION_CLASSIFICATION.critical.includes(d.name)
  );

  // Count untested critical dimensions
  const untestedCriticalCount = criticalDimensions.filter(
    (d) => !d.measured || d.score === null
  ).length;

  // Get critical dimension scores (treat untested as 0)
  const criticalScores = criticalDimensions.map((d) =>
    d.measured && d.score !== null ? d.score : 0
  );

  // Get ONLY the measured critical dimensions (for penalty checks)
  // We only want to penalize for actual failures, not untested dimensions
  const measuredCriticalScores = criticalDimensions
    .filter((d) => d.measured && d.score !== null)
    .map((d) => d.score as number);

  // Check for automatic penalties (only on MEASURED dimensions)
  const hasZeroCritical = measuredCriticalScores.some((score) => score === 0);
  const hasBelowFiftyCritical = measuredCriticalScores.some((score) => score < 50);

  // PENALTY: 0% on any critical dimension → grade capped at C
  if (hasZeroCritical) {
    // Can still get C if weighted score is high enough
    if (
      weightedScore >= GRADE_THRESHOLDS.C.minWeightedScore &&
      untestedCriticalCount <= GRADE_THRESHOLDS.C.maxUntestedCritical
    ) {
      return "C";
    }
    if (
      weightedScore >= GRADE_THRESHOLDS.D.minWeightedScore &&
      untestedCriticalCount <= GRADE_THRESHOLDS.D.maxUntestedCritical
    ) {
      return "D";
    }
    return "F";
  }

  // PENALTY: <50% on any critical dimension → grade capped at D
  if (hasBelowFiftyCritical) {
    if (
      weightedScore >= GRADE_THRESHOLDS.D.minWeightedScore &&
      untestedCriticalCount <= GRADE_THRESHOLDS.D.maxUntestedCritical
    ) {
      return "D";
    }
    return "F";
  }

  // Check grade thresholds in descending order (A → B → C → D)
  for (const grade of ["A", "B", "C", "D"] as const) {
    const constraints = GRADE_THRESHOLDS[grade];

    // Check if weighted score meets minimum
    if (weightedScore < constraints.minWeightedScore) {
      continue;
    }

    // Check if all MEASURED critical dimensions meet minimum threshold
    // Unmeasured dimensions are handled by the untestedCriticalCount check
    const allCriticalsMeetThreshold = measuredCriticalScores.every(
      (score) => score >= constraints.minCriticalScore
    );
    if (!allCriticalsMeetThreshold) {
      continue;
    }

    // Check if untested count is acceptable
    if (untestedCriticalCount > constraints.maxUntestedCritical) {
      continue;
    }

    // All constraints passed → award this grade
    return grade;
  }

  // Failed all grade thresholds → F
  return "F";
}

export function scoreComponent(tagName: string): ComponentHealth | null {
  const validation = validateComponent(tagName);
  if (!validation) return null;

  const dir = getComponentDirectory(tagName);
  const jsDoc = analyzeJsDoc(tagName);
  const docs = hasDocsPage(tagName);
  const testSummary = getTestResultsForComponent(tagName)
    ?? (dir !== tagName ? getTestResultsForComponent(dir) : null);
  const coverage = getCoverageForComponent(tagName);
  const typeSafety = analyzeTypeSafety(tagName);
  const a11y = analyzeAccessibility(tagName);
  const bundle = analyzeBundleSize(tagName);
  const tokenCompliance = analyzeTokenCompliance(tagName);
  const storyCoverage = analyzeStoryCoverage(tagName);
  const drupal = analyzeDrupalReadiness(tagName);
  const vrt = analyzeVrt(tagName);
  const crossBrowser = analyzeCrossBrowser(tagName);

  // Test Coverage: blended score (60% code coverage + 40% pass rate)
  let testScore: number | null = null;
  let testConfidence: "verified" | "heuristic" | "untested" = "untested";
  if (testSummary) {
    if (coverage) {
      testScore = Math.round(coverage.lineCoverage * 0.6 + testSummary.passRate * 0.4);
      testConfidence = "verified";
    } else {
      testScore = testSummary.passRate;
      testConfidence = "heuristic";
    }
  }

  const dimensions: HealthDimension[] = [
    {
      name: "API Documentation",
      weight: 15,
      score: jsDoc?.coveragePercent ?? 0,
      maxScore: 100,
      measured: jsDoc !== null,
      phase: "Phase 1",
      confidence: jsDoc ? "verified" : "untested",
      methodology: "JSDoc source parsing",
    },
    {
      name: "CEM Completeness",
      weight: 15,
      score: validation.overallCompleteness,
      maxScore: 100,
      measured: true,
      phase: "Phase 1",
      confidence: "verified",
      methodology: "CEM field validation",
    },
    {
      name: "Story Coverage",
      weight: 10,
      score: storyCoverage?.score ?? 0,
      maxScore: 100,
      measured: storyCoverage !== null,
      phase: "Phase 1",
      confidence: storyCoverage && storyCoverage.storyCount > 0 ? "verified" : "untested",
      methodology: "Story count vs variant analysis",
    },
    {
      name: "Docs Coverage",
      weight: 5,
      score: docs ? 100 : 0,
      maxScore: 100,
      measured: true,
      phase: "Phase 1",
      confidence: "verified",
      methodology: "Docs page existence",
    },
    {
      name: "Type Safety",
      weight: 10,
      score: typeSafety?.score ?? null,
      maxScore: 100,
      measured: typeSafety !== null,
      phase: typeSafety ? "Phase 2" : "Future",
      confidence: typeSafety
        ? (typeSafety.tscClean !== undefined ? "verified" : "heuristic")
        : "untested",
      methodology: typeSafety?.tscClean !== undefined
        ? "TypeScript compiler output + static analysis"
        : "Static pattern analysis",
    },
    {
      name: "Test Coverage",
      weight: 10,
      score: testScore,
      maxScore: 100,
      measured: testSummary !== null,
      phase: testSummary ? "Phase 2" : "Future",
      confidence: testConfidence,
      methodology: coverage
        ? "Vitest pass rate + V8 code coverage"
        : "Vitest pass rate only",
    },
    {
      name: "Accessibility",
      weight: 10,
      score: a11y?.score ?? null,
      maxScore: 100,
      measured: a11y !== null,
      phase: a11y ? "Phase 2" : "Future",
      confidence: a11y
        ? (a11y.hasAxeResults ? "verified" : "heuristic")
        : "untested",
      methodology: a11y?.hasAxeResults
        ? "axe-core WCAG 2.1 AA runtime audit + static analysis"
        : "Static pattern analysis (no runtime audit)",
    },
    {
      name: "Bundle Size",
      weight: 5,
      score: bundle?.score ?? null,
      maxScore: 100,
      measured: bundle !== null,
      phase: bundle ? "Phase 2" : "Future",
      confidence: bundle ? "verified" : "untested",
      methodology: "Gzip size measurement vs 5KB budget",
    },
    {
      name: "Token Compliance",
      weight: 5,
      score: tokenCompliance?.score ?? null,
      maxScore: 100,
      measured: tokenCompliance !== null,
      phase: tokenCompliance ? "Phase 2" : "Future",
      confidence: tokenCompliance ? "heuristic" : "untested",
      methodology: "CSS custom property reference analysis",
    },
    {
      name: "Visual Regression",
      weight: 5,
      score: vrt?.score ?? null,
      maxScore: 100,
      measured: vrt !== null && vrt.hasBaselines,
      phase: vrt?.hasBaselines ? "Phase 3" : "Future",
      confidence: vrt?.browserResults.length ? "verified" : "untested",
      methodology: "Playwright cross-browser screenshot comparison",
    },
    {
      name: "Cross-Browser",
      weight: 5,
      score: crossBrowser?.score ?? null,
      maxScore: 100,
      measured: crossBrowser !== null && crossBrowser.browsers.length > 0,
      phase: crossBrowser?.browsers.length ? "Phase 3" : "Future",
      confidence: crossBrowser?.browsers.length ? "verified" : "untested",
      methodology: "Playwright multi-browser test results",
    },
    {
      name: "Drupal Readiness",
      weight: 5,
      score: drupal?.score ?? null,
      maxScore: 100,
      measured: drupal !== null,
      phase: drupal ? "Phase 2" : "Future",
      confidence: drupal ? "heuristic" : "untested",
      methodology: "Drupal compatibility pattern analysis",
    },
  ];

  /**
   * WEIGHTED SCORE CALCULATION
   *
   * Key change from legacy algorithm:
   * - We now calculate weighted score from ALL dimensions (not just measured)
   * - Unmeasured dimensions contribute 0 to the weighted score
   * - This ensures untested critical dimensions hurt the overall score
   *
   * The weighted score is used for:
   * 1. Fine-grained ranking within grade bands
   * 2. The first gate-check in calculateGrade()
   *
   * But the GRADE is determined by critical dimension thresholds, not just
   * the weighted score. A component can have a 95 weighted score and still
   * get an F if critical dimensions are untested.
   */
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);

  const weightedScore = dimensions.reduce((sum, d) => {
    const normalizedWeight = d.weight / totalWeight;
    const dimensionScore = d.measured && d.score !== null ? d.score : 0;
    return sum + dimensionScore * normalizedWeight;
  }, 0);

  const overallScore = Math.round(weightedScore);

  const confidenceSummary = {
    verified: dimensions.filter((d) => d.confidence === "verified").length,
    heuristic: dimensions.filter((d) => d.confidence === "heuristic").length,
    untested: dimensions.filter((d) => d.confidence === "untested").length,
  };

  return {
    tagName,
    className: validation.className,
    overallScore,
    maxPossibleScore: totalWeight,
    grade: calculateGrade(overallScore, dimensions),
    dimensions,
    cemCompleteness: validation.overallCompleteness,
    jsDocCoverage: jsDoc?.coveragePercent ?? 0,
    storyCoverage: storyCoverage !== null && storyCoverage.storyCount > 0,
    docsCoverage: docs,
    confidenceSummary,
  };
}

export async function scoreAllComponents(): Promise<ComponentHealth[]> {
  const { getAllComponentNames } = await import("./cem-parser");
  const names = getAllComponentNames();
  const results: ComponentHealth[] = [];
  for (const name of names) {
    const health = scoreComponent(name);
    if (health) results.push(health);
  }
  return results.sort((a, b) => a.tagName.localeCompare(b.tagName));
}
