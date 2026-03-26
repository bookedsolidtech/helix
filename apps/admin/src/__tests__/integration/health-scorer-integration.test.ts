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

import { scoreComponent, scoreAllComponents } from '@/lib/health-scorer';
import { validateComponent } from '@/lib/cem-validator';
import { getComponentDirectory, getAllComponentNames } from '@/lib/cem-parser';
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

function setupAllMocks(score: number) {
  vi.mocked(validateComponent).mockReturnValue({
    overallCompleteness: score,
    className: 'TestComponent',
    tagName: 'hx-test',
    missingFields: [],
  } as ReturnType<typeof validateComponent>);
  vi.mocked(getComponentDirectory).mockReturnValue('hx-test');
  vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: score } as ReturnType<typeof analyzeJsDoc>);
  vi.mocked(getTestResultsForComponent).mockReturnValue({ passRate: score } as ReturnType<typeof getTestResultsForComponent>);
  vi.mocked(getCoverageForComponent).mockReturnValue({ lineCoverage: score } as ReturnType<typeof getCoverageForComponent>);
  vi.mocked(analyzeTypeSafety).mockReturnValue({ score, tscClean: true, checks: [] } as ReturnType<typeof analyzeTypeSafety>);
  vi.mocked(analyzeAccessibility).mockReturnValue({ score, hasAxeResults: true, checks: [] } as ReturnType<typeof analyzeAccessibility>);
  vi.mocked(analyzeBundleSize).mockReturnValue({ score } as ReturnType<typeof analyzeBundleSize>);
  vi.mocked(analyzeTokenCompliance).mockReturnValue({ score } as ReturnType<typeof analyzeTokenCompliance>);
  vi.mocked(analyzeStoryCoverage).mockReturnValue({ score, storyCount: 3 } as ReturnType<typeof analyzeStoryCoverage>);
  vi.mocked(analyzeDrupalReadiness).mockReturnValue({ score } as ReturnType<typeof analyzeDrupalReadiness>);
  vi.mocked(analyzeVrt).mockReturnValue({ score, hasBaselines: true, browserResults: [1] } as ReturnType<typeof analyzeVrt>);
  vi.mocked(analyzeCrossBrowser).mockReturnValue({ score, browsers: ['chromium'] } as ReturnType<typeof analyzeCrossBrowser>);
  vi.mocked(analyzeCodeQuality).mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeCodeQuality>);
  vi.mocked(analyzeLitBestPractices).mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeLitBestPractices>);
  vi.mocked(analyzeSecurity).mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeSecurity>);
  vi.mocked(analyzeMaintainability).mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeMaintainability>);
  vi.mocked(analyzeDx).mockReturnValue({ score, subMetrics: [] } as ReturnType<typeof analyzeDx>);
  vi.mocked(existsSync).mockReturnValue(true);
}

describe('grade boundary conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('achieves A at exactly 90', () => {
    setupAllMocks(90);
    expect(scoreComponent('hx-test')!.grade).toBe('A');
  });

  it('achieves B at exactly 80', () => {
    setupAllMocks(80);
    expect(scoreComponent('hx-test')!.grade).toBe('B');
  });

  it('achieves C at exactly 70', () => {
    setupAllMocks(70);
    expect(scoreComponent('hx-test')!.grade).toBe('C');
  });

  it('achieves D at exactly 60', () => {
    setupAllMocks(60);
    expect(scoreComponent('hx-test')!.grade).toBe('D');
  });

  it('achieves F below 60', () => {
    setupAllMocks(40);
    expect(scoreComponent('hx-test')!.grade).toBe('F');
  });
});

describe('penalty cascade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('zero critical caps at C even with score ≥90', () => {
    setupAllMocks(95);
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 0 } as ReturnType<typeof analyzeJsDoc>);
    expect(scoreComponent('hx-test')!.grade).toBe('C');
  });

  it('below-50 critical caps at D even with score ≥90', () => {
    setupAllMocks(95);
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 40 } as ReturnType<typeof analyzeJsDoc>);
    expect(scoreComponent('hx-test')!.grade).toBe('D');
  });

  it('zero critical with low score falls to F', () => {
    setupAllMocks(40);
    vi.mocked(analyzeJsDoc).mockReturnValue({ coveragePercent: 0 } as ReturnType<typeof analyzeJsDoc>);
    expect(scoreComponent('hx-test')!.grade).toBe('F');
  });
});

describe('dimension structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAllMocks(80);
  });

  it('has exactly 17 dimensions', () => {
    const result = scoreComponent('hx-test');
    expect(result!.dimensions).toHaveLength(17);
  });

  it('total weight of all dimensions equals 125', () => {
    const result = scoreComponent('hx-test');
    const totalWeight = result!.dimensions.reduce((sum, d) => sum + d.weight, 0);
    expect(totalWeight).toBe(125);
  });

  it('contains all 7 critical dimension names', () => {
    const result = scoreComponent('hx-test');
    const names = result!.dimensions.map((d) => d.name);
    expect(names).toContain('API Documentation');
    expect(names).toContain('CEM Completeness');
    expect(names).toContain('Test Coverage');
    expect(names).toContain('Accessibility');
    expect(names).toContain('Type Safety');
    expect(names).toContain('Docs Coverage');
    expect(names).toContain('Security');
  });

  it('all dimensions have required fields', () => {
    const result = scoreComponent('hx-test');
    for (const dim of result!.dimensions) {
      expect(typeof dim.name).toBe('string');
      expect(typeof dim.weight).toBe('number');
      expect(dim.maxScore).toBe(100);
      expect(typeof dim.measured).toBe('boolean');
      expect(typeof dim.phase).toBe('string');
      expect(['verified', 'heuristic', 'untested']).toContain(dim.confidence);
      expect(typeof dim.methodology).toBe('string');
    }
  });

  it('confidenceSummary counts all 17 dimensions', () => {
    const result = scoreComponent('hx-test');
    const { verified, heuristic, untested } = result!.confidenceSummary;
    expect(verified + heuristic + untested).toBe(17);
  });
});

describe('scoreAllComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns alphabetically sorted results', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue(['hx-card', 'hx-button', 'hx-input']);
    vi.mocked(validateComponent).mockImplementation(
      (tag) =>
        ({
          overallCompleteness: 80,
          className: tag,
          tagName: tag,
          missingFields: [],
        }) as ReturnType<typeof validateComponent>,
    );
    vi.mocked(getComponentDirectory).mockImplementation((tag) => tag);
    setupAllMocks(80);

    const results = await scoreAllComponents();
    expect(results).toHaveLength(3);
    expect(results[0].tagName).toBe('hx-button');
    expect(results[1].tagName).toBe('hx-card');
    expect(results[2].tagName).toBe('hx-input');
  });

  it('filters out null results from invalid components', async () => {
    vi.mocked(getAllComponentNames).mockReturnValue(['hx-button', 'hx-invalid', 'hx-card']);
    vi.mocked(validateComponent).mockImplementation((tag) => {
      if (tag === 'hx-invalid') return null;
      return {
        overallCompleteness: 80,
        className: tag,
        tagName: tag,
        missingFields: [],
      } as ReturnType<typeof validateComponent>;
    });
    vi.mocked(getComponentDirectory).mockImplementation((tag) => tag);
    setupAllMocks(80);

    const results = await scoreAllComponents();
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.tagName)).not.toContain('hx-invalid');
  });
});
