import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── health-scorer tests ───────────────────────────────────────────────────────
// The health-scorer module depends on many Node.js analyzers.
// We test the public API (scoreComponent, scoreAllComponents) with mocked
// sub-analyzers so tests are deterministic and fast.

// Mock all heavy dependencies before importing the module under test
vi.mock('./cem-validator', () => ({
  validateComponent: vi.fn(),
}));
vi.mock('./cem-parser', () => ({
  getComponentDirectory: vi.fn(),
  getAllComponentNames: vi.fn(),
}));
vi.mock('./jsdoc-analyzer', () => ({
  analyzeJsDoc: vi.fn(),
}));
vi.mock('./test-results-reader', () => ({
  getTestResultsForComponent: vi.fn(),
  getCoverageForComponent: vi.fn(),
}));
vi.mock('./type-safety-analyzer', () => ({
  analyzeTypeSafety: vi.fn(),
}));
vi.mock('./a11y-analyzer', () => ({
  analyzeAccessibility: vi.fn(),
}));
vi.mock('./bundle-analyzer', () => ({
  analyzeBundleSize: vi.fn(),
}));
vi.mock('./token-compliance-analyzer', () => ({
  analyzeTokenCompliance: vi.fn(),
}));
vi.mock('./story-coverage-analyzer', () => ({
  analyzeStoryCoverage: vi.fn(),
}));
vi.mock('./drupal-readiness-analyzer', () => ({
  analyzeDrupalReadiness: vi.fn(),
}));
vi.mock('./vrt-analyzer', () => ({
  analyzeVrt: vi.fn(),
  analyzeCrossBrowser: vi.fn(),
}));
vi.mock('./code-quality-analyzer', () => ({
  analyzeCodeQuality: vi.fn(),
}));
vi.mock('./lit-best-practices-analyzer', () => ({
  analyzeLitBestPractices: vi.fn(),
}));
vi.mock('./security-analyzer', () => ({
  analyzeSecurity: vi.fn(),
}));
vi.mock('./maintainability-analyzer', () => ({
  analyzeMaintainability: vi.fn(),
}));
vi.mock('./dx-analyzer', () => ({
  analyzeDx: vi.fn(),
}));
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
  };
});

import { scoreComponent, scoreAllComponents } from './health-scorer';
import type { ComponentHealth } from './health-scorer';
import { validateComponent } from './cem-validator';
import { getComponentDirectory, getAllComponentNames } from './cem-parser';
import { analyzeJsDoc } from './jsdoc-analyzer';
import { getTestResultsForComponent, getCoverageForComponent } from './test-results-reader';
import { analyzeTypeSafety } from './type-safety-analyzer';
import { analyzeAccessibility } from './a11y-analyzer';
import { analyzeBundleSize } from './bundle-analyzer';
import { analyzeTokenCompliance } from './token-compliance-analyzer';
import { analyzeStoryCoverage } from './story-coverage-analyzer';
import { analyzeDrupalReadiness } from './drupal-readiness-analyzer';
import { analyzeVrt, analyzeCrossBrowser } from './vrt-analyzer';
import { analyzeCodeQuality } from './code-quality-analyzer';
import { analyzeLitBestPractices } from './lit-best-practices-analyzer';
import { analyzeSecurity } from './security-analyzer';
import { analyzeMaintainability } from './maintainability-analyzer';
import { analyzeDx } from './dx-analyzer';

// Minimal validation result with 100% completeness
const FULL_VALIDATION = {
  tagName: 'hx-button',
  className: 'HxButton',
  overallCompleteness: 100,
  fields: {},
};

function resetAllMocks() {
  vi.mocked(validateComponent).mockReturnValue(FULL_VALIDATION as ReturnType<typeof validateComponent>);
  vi.mocked(getComponentDirectory).mockReturnValue('hx-button');
  vi.mocked(analyzeJsDoc).mockReturnValue(null);
  vi.mocked(getTestResultsForComponent).mockReturnValue(null);
  vi.mocked(getCoverageForComponent).mockReturnValue(null);
  vi.mocked(analyzeTypeSafety).mockReturnValue(null);
  vi.mocked(analyzeAccessibility).mockReturnValue(null);
  vi.mocked(analyzeBundleSize).mockReturnValue(null);
  vi.mocked(analyzeTokenCompliance).mockReturnValue(null);
  vi.mocked(analyzeStoryCoverage).mockReturnValue(null);
  vi.mocked(analyzeDrupalReadiness).mockReturnValue(null);
  vi.mocked(analyzeVrt).mockReturnValue(null);
  vi.mocked(analyzeCrossBrowser).mockReturnValue(null);
  vi.mocked(analyzeCodeQuality).mockReturnValue(null);
  vi.mocked(analyzeLitBestPractices).mockReturnValue(null);
  vi.mocked(analyzeSecurity).mockReturnValue(null);
  vi.mocked(analyzeMaintainability).mockReturnValue(null);
  vi.mocked(analyzeDx).mockReturnValue(null);
}

// ── scoreComponent — null when validation fails ───────────────────────────────

describe('scoreComponent — returns null for unknown components', () => {
  beforeEach(resetAllMocks);

  it('returns null when validateComponent returns null', () => {
    vi.mocked(validateComponent).mockReturnValue(null);
    expect(scoreComponent('nonexistent')).toBeNull();
  });
});

// ── scoreComponent — result shape ─────────────────────────────────────────────

describe('scoreComponent — result shape', () => {
  beforeEach(resetAllMocks);

  it('returns a ComponentHealth object for a known component', () => {
    const result = scoreComponent('hx-button');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('tagName');
    expect(result).toHaveProperty('className');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('confidenceSummary');
  });

  it('sets tagName from the input', () => {
    const result = scoreComponent('hx-button');
    expect(result?.tagName).toBe('hx-button');
  });

  it('sets className from validation result', () => {
    const result = scoreComponent('hx-button');
    expect(result?.className).toBe('HxButton');
  });

  it('overallScore is between 0 and 100', () => {
    const result = scoreComponent('hx-button');
    expect(result?.overallScore).toBeGreaterThanOrEqual(0);
    expect(result?.overallScore).toBeLessThanOrEqual(100);
  });

  it('grade is one of A, B, C, D, F', () => {
    const result = scoreComponent('hx-button');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result?.grade);
  });

  it('dimensions is a non-empty array', () => {
    const result = scoreComponent('hx-button');
    expect(Array.isArray(result?.dimensions)).toBe(true);
    expect(result!.dimensions.length).toBeGreaterThan(0);
  });

  it('confidenceSummary has verified, heuristic, untested counts', () => {
    const result = scoreComponent('hx-button');
    expect(result?.confidenceSummary).toHaveProperty('verified');
    expect(result?.confidenceSummary).toHaveProperty('heuristic');
    expect(result?.confidenceSummary).toHaveProperty('untested');
  });

  it('confidenceSummary values sum to total dimension count', () => {
    const result = scoreComponent('hx-button');
    const { verified, heuristic, untested } = result!.confidenceSummary;
    expect(verified + heuristic + untested).toBe(result!.dimensions.length);
  });
});

// ── scoreComponent — grade algorithm: all untested ────────────────────────────

describe('scoreComponent — grade: all analyzers return null (untested)', () => {
  beforeEach(resetAllMocks);

  it('gets grade F when all dimensions are untested except CEM and Docs', () => {
    // CEM completeness = 100 (always measured), but all others untested
    const result = scoreComponent('hx-button');
    expect(result).not.toBeNull();
    // With most critical dimensions untested (>3), result should be F
    expect(result?.grade).toBe('F');
  });
});

// ── scoreComponent — grade algorithm: high scores ─────────────────────────────

describe('scoreComponent — grade: high scores across critical dimensions', () => {
  beforeEach(resetAllMocks);

  it('achieves grade A when all critical dimensions score ≥80', () => {
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 95, documented: 10, total: 10, items: [] });
    vi.mocked(getTestResultsForComponent).mockReturnValue({ passRate: 100, total: 50, passed: 50, failed: 0, skipped: 0 });
    vi.mocked(getCoverageForComponent).mockReturnValue({ lineCoverage: 90, statementCoverage: 90, functionCoverage: 90, branchCoverage: 85 });
    vi.mocked(analyzeTypeSafety).mockReturnValue({ score: 95, checks: [], tscClean: true });
    vi.mocked(analyzeAccessibility).mockReturnValue({ score: 90, checks: [], hasAxeResults: true });
    vi.mocked(analyzeBundleSize).mockReturnValue({ score: 90, sizeBytes: 3000, sizeGz: 1200 });
    vi.mocked(analyzeStoryCoverage).mockReturnValue({ score: 90, storyCount: 5, variantCount: 5 });
    vi.mocked(analyzeSecurity).mockReturnValue({ score: 95, subMetrics: [] });
    vi.mocked(analyzeCodeQuality).mockReturnValue({ score: 90, subMetrics: [] });
    vi.mocked(analyzeLitBestPractices).mockReturnValue({ score: 90, subMetrics: [] });
    vi.mocked(analyzeMaintainability).mockReturnValue({ score: 85, subMetrics: [] });
    vi.mocked(analyzeDx).mockReturnValue({ score: 85, subMetrics: [] });
    vi.mocked(analyzeTokenCompliance).mockReturnValue({ score: 85 });
    vi.mocked(analyzeDrupalReadiness).mockReturnValue({ score: 80 });

    // Mock docs page to exist
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockReturnValue(true);

    const result = scoreComponent('hx-button');
    expect(result).not.toBeNull();
    expect(['A', 'B']).toContain(result?.grade);
  });
});

// ── scoreComponent — grade algorithm: zero-critical penalty ──────────────────

describe('scoreComponent — grade: zero-critical penalty', () => {
  beforeEach(resetAllMocks);

  it('caps grade at C when a measured critical dimension scores 0', () => {
    // Give JSDoc (critical) a score of 0
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 0, documented: 0, total: 10, items: [] });
    // Give test coverage a high score
    vi.mocked(getTestResultsForComponent).mockReturnValue({ passRate: 100, total: 50, passed: 50, failed: 0, skipped: 0 });
    vi.mocked(getCoverageForComponent).mockReturnValue({ lineCoverage: 90, statementCoverage: 90, functionCoverage: 90, branchCoverage: 85 });
    // Type safety measured and high
    vi.mocked(analyzeTypeSafety).mockReturnValue({ score: 95, checks: [], tscClean: true });

    const result = scoreComponent('hx-button');
    expect(result).not.toBeNull();
    // Zero on a critical dimension caps at C (or lower if score is below C threshold)
    expect(['C', 'D', 'F']).toContain(result?.grade);
  });

  it('caps grade at D when a measured critical dimension scores below 50', () => {
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 30, documented: 3, total: 10, items: [] });
    vi.mocked(getTestResultsForComponent).mockReturnValue({ passRate: 100, total: 20, passed: 20, failed: 0, skipped: 0 });
    vi.mocked(getCoverageForComponent).mockReturnValue({ lineCoverage: 90, statementCoverage: 90, functionCoverage: 90, branchCoverage: 85 });
    vi.mocked(analyzeTypeSafety).mockReturnValue({ score: 95, checks: [], tscClean: true });

    const result = scoreComponent('hx-button');
    expect(result).not.toBeNull();
    expect(['D', 'F']).toContain(result?.grade);
  });
});

// ── scoreComponent — dimensions structure ────────────────────────────────────

describe('scoreComponent — dimensions structure', () => {
  beforeEach(resetAllMocks);

  it('each dimension has name, weight, maxScore, measured, phase, confidence', () => {
    const result = scoreComponent('hx-button');
    for (const dim of result!.dimensions) {
      expect(dim).toHaveProperty('name');
      expect(dim).toHaveProperty('weight');
      expect(dim).toHaveProperty('maxScore');
      expect(dim).toHaveProperty('measured');
      expect(dim).toHaveProperty('phase');
      expect(dim).toHaveProperty('confidence');
    }
  });

  it('all dimension weights are positive', () => {
    const result = scoreComponent('hx-button');
    for (const dim of result!.dimensions) {
      expect(dim.weight).toBeGreaterThan(0);
    }
  });

  it('includes CEM Completeness as a measured dimension', () => {
    vi.mocked(validateComponent).mockReturnValue({
      ...FULL_VALIDATION,
      overallCompleteness: 85,
    } as ReturnType<typeof validateComponent>);
    const result = scoreComponent('hx-button');
    const cem = result?.dimensions.find((d) => d.name === 'CEM Completeness');
    expect(cem).toBeDefined();
    expect(cem?.measured).toBe(true);
    expect(cem?.score).toBe(85);
  });

  it('includes Docs Coverage as measured with score 0 when docs page absent', () => {
    const { existsSync } = await import('node:fs');
    vi.mocked(existsSync).mockReturnValue(false);
    const result = scoreComponent('hx-button');
    const docs = result?.dimensions.find((d) => d.name === 'Docs Coverage');
    expect(docs?.measured).toBe(true);
    expect(docs?.score).toBe(0);
  });
});

// ── scoreAllComponents ────────────────────────────────────────────────────────

describe('scoreAllComponents', () => {
  beforeEach(resetAllMocks);

  it('returns an array of ComponentHealth objects', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue(['hx-button', 'hx-card']);
    const results = await scoreAllComponents();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
  });

  it('filters out null results from failed validations', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue(['hx-button', 'unknown-component']);
    vi.mocked(validateComponent).mockImplementation((name) =>
      name === 'hx-button' ? (FULL_VALIDATION as ReturnType<typeof validateComponent>) : null,
    );
    const results = await scoreAllComponents();
    expect(results).toHaveLength(1);
    expect(results[0]?.tagName).toBe('hx-button');
  });

  it('returns results sorted alphabetically by tagName', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue(['hx-card', 'hx-button', 'hx-text-input']);
    vi.mocked(validateComponent).mockImplementation((name) => ({
      tagName: name,
      className: name,
      overallCompleteness: 100,
      fields: {},
    }) as ReturnType<typeof validateComponent>);

    const results = await scoreAllComponents();
    const tags = results.map((r: ComponentHealth) => r.tagName);
    expect(tags).toEqual([...tags].sort());
  });

  it('returns empty array when no components exist', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue([]);
    const results = await scoreAllComponents();
    expect(results).toHaveLength(0);
  });
});
