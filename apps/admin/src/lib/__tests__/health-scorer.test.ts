import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/cem-validator', () => ({ validateComponent: vi.fn() }));
vi.mock('@/lib/cem-parser', () => ({
  getComponentDirectory: vi.fn(),
  getAllComponentNames: vi.fn(),
}));
vi.mock('@/lib/jsdoc-analyzer', () => ({ analyzeJsDoc: vi.fn() }));
vi.mock('@/lib/test-results-reader', () => ({
  getTestResultsForComponent: vi.fn(),
  getCoverageForComponent: vi.fn(),
}));
vi.mock('@/lib/type-safety-analyzer', () => ({ analyzeTypeSafety: vi.fn() }));
vi.mock('@/lib/a11y-analyzer', () => ({ analyzeAccessibility: vi.fn() }));
vi.mock('@/lib/bundle-analyzer', () => ({ analyzeBundleSize: vi.fn() }));
vi.mock('@/lib/token-compliance-analyzer', () => ({ analyzeTokenCompliance: vi.fn() }));
vi.mock('@/lib/story-coverage-analyzer', () => ({ analyzeStoryCoverage: vi.fn() }));
vi.mock('@/lib/drupal-readiness-analyzer', () => ({ analyzeDrupalReadiness: vi.fn() }));
vi.mock('@/lib/vrt-analyzer', () => ({
  analyzeVrt: vi.fn(),
  analyzeCrossBrowser: vi.fn(),
}));
vi.mock('@/lib/code-quality-analyzer', () => ({ analyzeCodeQuality: vi.fn() }));
vi.mock('@/lib/lit-best-practices-analyzer', () => ({ analyzeLitBestPractices: vi.fn() }));
vi.mock('@/lib/security-analyzer', () => ({ analyzeSecurity: vi.fn() }));
vi.mock('@/lib/maintainability-analyzer', () => ({ analyzeMaintainability: vi.fn() }));
vi.mock('@/lib/dx-analyzer', () => ({ analyzeDx: vi.fn() }));
vi.mock('node:fs', () => ({ existsSync: vi.fn() }));

import { scoreComponent } from '@/lib/health-scorer';
import { validateComponent } from '@/lib/cem-validator';
import { getComponentDirectory } from '@/lib/cem-parser';
import { analyzeJsDoc } from '@/lib/jsdoc-analyzer';
import { getTestResultsForComponent, getCoverageForComponent } from '@/lib/test-results-reader';
import { analyzeTypeSafety } from '@/lib/type-safety-analyzer';
import { analyzeAccessibility } from '@/lib/a11y-analyzer';
import { analyzeBundleSize } from '@/lib/bundle-analyzer';
import { analyzeTokenCompliance } from '@/lib/token-compliance-analyzer';
import { analyzeStoryCoverage } from '@/lib/story-coverage-analyzer';
import { analyzeDrupalReadiness } from '@/lib/drupal-readiness-analyzer';
import { analyzeVrt, analyzeCrossBrowser } from '@/lib/vrt-analyzer';
import { analyzeCodeQuality } from '@/lib/code-quality-analyzer';
import { analyzeLitBestPractices } from '@/lib/lit-best-practices-analyzer';
import { analyzeSecurity } from '@/lib/security-analyzer';
import { analyzeMaintainability } from '@/lib/maintainability-analyzer';
import { analyzeDx } from '@/lib/dx-analyzer';
import { existsSync } from 'node:fs';

const mockValidateComponent = vi.mocked(validateComponent);
const mockGetComponentDirectory = vi.mocked(getComponentDirectory);
const mockAnalyzeJsDoc = vi.mocked(analyzeJsDoc);
const mockGetTestResultsForComponent = vi.mocked(getTestResultsForComponent);
const mockGetCoverageForComponent = vi.mocked(getCoverageForComponent);
const mockAnalyzeTypeSafety = vi.mocked(analyzeTypeSafety);
const mockAnalyzeAccessibility = vi.mocked(analyzeAccessibility);
const mockAnalyzeBundleSize = vi.mocked(analyzeBundleSize);
const mockAnalyzeTokenCompliance = vi.mocked(analyzeTokenCompliance);
const mockAnalyzeStoryCoverage = vi.mocked(analyzeStoryCoverage);
const mockAnalyzeDrupalReadiness = vi.mocked(analyzeDrupalReadiness);
const mockAnalyzeVrt = vi.mocked(analyzeVrt);
const mockAnalyzeCrossBrowser = vi.mocked(analyzeCrossBrowser);
const mockAnalyzeCodeQuality = vi.mocked(analyzeCodeQuality);
const mockAnalyzeLitBestPractices = vi.mocked(analyzeLitBestPractices);
const mockAnalyzeSecurity = vi.mocked(analyzeSecurity);
const mockAnalyzeMaintainability = vi.mocked(analyzeMaintainability);
const mockAnalyzeDx = vi.mocked(analyzeDx);
const mockExistsSync = vi.mocked(existsSync);

function setupMocksWithScore(score: number) {
  mockValidateComponent.mockReturnValue({
    overallCompleteness: score,
    className: 'TestComponent',
    tagName: 'hx-test',
    missingFields: [],
  } as ReturnType<typeof validateComponent>);
  mockGetComponentDirectory.mockReturnValue('hx-test');
  mockAnalyzeJsDoc.mockReturnValue({ coveragePercent: score } as ReturnType<typeof analyzeJsDoc>);
  mockGetTestResultsForComponent.mockReturnValue({ passRate: score } as ReturnType<typeof getTestResultsForComponent>);
  mockGetCoverageForComponent.mockReturnValue({ lineCoverage: score } as ReturnType<typeof getCoverageForComponent>);
  mockAnalyzeTypeSafety.mockReturnValue({ score, tscClean: true, checks: [] } as ReturnType<typeof analyzeTypeSafety>);
  mockAnalyzeAccessibility.mockReturnValue({ score, hasAxeResults: true, checks: [] } as ReturnType<typeof analyzeAccessibility>);
  mockAnalyzeBundleSize.mockReturnValue({ score } as ReturnType<typeof analyzeBundleSize>);
  mockAnalyzeTokenCompliance.mockReturnValue({ score } as ReturnType<typeof analyzeTokenCompliance>);
  mockAnalyzeStoryCoverage.mockReturnValue({ score, storyCount: 3 } as ReturnType<typeof analyzeStoryCoverage>);
  mockAnalyzeDrupalReadiness.mockReturnValue({ score } as ReturnType<typeof analyzeDrupalReadiness>);
  mockAnalyzeVrt.mockReturnValue({ score, hasBaselines: true, browserResults: [1] } as ReturnType<typeof analyzeVrt>);
  mockAnalyzeCrossBrowser.mockReturnValue({ score, browsers: ['chromium'] } as ReturnType<typeof analyzeCrossBrowser>);
  mockAnalyzeCodeQuality.mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeCodeQuality>);
  mockAnalyzeLitBestPractices.mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeLitBestPractices>);
  mockAnalyzeSecurity.mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeSecurity>);
  mockAnalyzeMaintainability.mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeMaintainability>);
  mockAnalyzeDx.mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeDx>);
  mockExistsSync.mockReturnValue(true);
}

describe('scoreComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when validateComponent returns null', () => {
    mockValidateComponent.mockReturnValue(null);
    expect(scoreComponent('hx-test')).toBeNull();
  });

  describe('grade calculation', () => {
    it('achieves Grade A with score 95', () => {
      setupMocksWithScore(95);
      const result = scoreComponent('hx-test');
      expect(result).not.toBeNull();
      expect(result!.grade).toBe('A');
      expect(result!.overallScore).toBe(95);
    });

    it('achieves Grade B with score 85', () => {
      setupMocksWithScore(85);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('B');
      expect(result!.overallScore).toBe(85);
    });

    it('achieves Grade C with score 75', () => {
      setupMocksWithScore(75);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('C');
      expect(result!.overallScore).toBe(75);
    });

    it('achieves Grade D with score 65', () => {
      setupMocksWithScore(65);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('D');
      expect(result!.overallScore).toBe(65);
    });

    it('achieves Grade F with score 40', () => {
      setupMocksWithScore(40);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('F');
      expect(result!.overallScore).toBe(40);
    });
  });

  describe('penalty: zero critical dimension', () => {
    it('caps at C when a measured critical dimension is 0', () => {
      setupMocksWithScore(90);
      mockAnalyzeJsDoc.mockReturnValue({ coveragePercent: 0 } as ReturnType<typeof analyzeJsDoc>);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('C');
    });

    it('caps at D when zero critical and weighted score is below 70', () => {
      setupMocksWithScore(60);
      mockAnalyzeJsDoc.mockReturnValue({ coveragePercent: 0 } as ReturnType<typeof analyzeJsDoc>);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('D');
    });
  });

  describe('penalty: below-50 critical dimension', () => {
    it('caps at D when any measured critical dimension is below 50', () => {
      setupMocksWithScore(90);
      mockAnalyzeJsDoc.mockReturnValue({ coveragePercent: 30 } as ReturnType<typeof analyzeJsDoc>);
      const result = scoreComponent('hx-test');
      expect(result!.grade).toBe('D');
    });
  });

  describe('confidence tracking', () => {
    it('tracks verified confidence for fully measured components', () => {
      setupMocksWithScore(90);
      const result = scoreComponent('hx-test');
      expect(result!.confidenceSummary.verified).toBeGreaterThan(0);
      expect(result!.confidenceSummary.untested).toBe(0);
    });

    it('tracks untested confidence when analyzers return null', () => {
      setupMocksWithScore(90);
      mockAnalyzeBundleSize.mockReturnValue(null);
      mockAnalyzeVrt.mockReturnValue(null);
      const result = scoreComponent('hx-test');
      expect(result!.confidenceSummary.untested).toBeGreaterThanOrEqual(2);
    });
  });

  describe('docs coverage', () => {
    it('scores 100 when docs page exists', () => {
      setupMocksWithScore(90);
      mockExistsSync.mockReturnValue(true);
      const result = scoreComponent('hx-test');
      const docsDim = result!.dimensions.find((d) => d.name === 'Docs Coverage');
      expect(docsDim!.score).toBe(100);
    });

    it('scores 0 when docs page does not exist', () => {
      setupMocksWithScore(90);
      mockExistsSync.mockReturnValue(false);
      const result = scoreComponent('hx-test');
      const docsDim = result!.dimensions.find((d) => d.name === 'Docs Coverage');
      expect(docsDim!.score).toBe(0);
    });
  });

  describe('component data', () => {
    it('returns tagName and className from validation', () => {
      setupMocksWithScore(90);
      const result = scoreComponent('hx-test');
      expect(result!.tagName).toBe('hx-test');
      expect(result!.className).toBe('TestComponent');
    });

    it('returns 17 dimensions', () => {
      setupMocksWithScore(90);
      const result = scoreComponent('hx-test');
      expect(result!.dimensions).toHaveLength(17);
    });

    it('reports maxPossibleScore as totalWeight (125)', () => {
      setupMocksWithScore(90);
      const result = scoreComponent('hx-test');
      expect(result!.maxPossibleScore).toBe(125);
    });

    it('calculates blended test score (60% coverage + 40% pass rate)', () => {
      setupMocksWithScore(80);
      mockGetTestResultsForComponent.mockReturnValue({ passRate: 80 } as ReturnType<typeof getTestResultsForComponent>);
      mockGetCoverageForComponent.mockReturnValue({ lineCoverage: 80 } as ReturnType<typeof getCoverageForComponent>);
      const result = scoreComponent('hx-test');
      const testDim = result!.dimensions.find((d) => d.name === 'Test Coverage');
      expect(testDim!.score).toBe(80);
    });

    it('uses pass rate only when coverage is unavailable', () => {
      setupMocksWithScore(90);
      mockGetTestResultsForComponent.mockReturnValue({ passRate: 75 } as ReturnType<typeof getTestResultsForComponent>);
      mockGetCoverageForComponent.mockReturnValue(null);
      const result = scoreComponent('hx-test');
      const testDim = result!.dimensions.find((d) => d.name === 'Test Coverage');
      expect(testDim!.score).toBe(75);
    });
  });
});
