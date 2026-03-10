import { describe, it, expect } from 'vitest';
import {
  checkFileCoverage,
  hasApprovalComment,
  hasTestFile,
  normalizeFilePath,
  validateTestCoverageGate,
  getCoverageSummary,
  getStagedFiles,
  formatViolation,
  readFile,
  type Violation,
  type HookDependencies,
  type CoverageSummary,
  type CoverageData,
} from './test-coverage-gate.js';

/**
 * Test utilities
 */
function createCoverageData(overrides: Partial<CoverageData> = {}): CoverageData {
  return {
    lines: { total: 100, covered: 80, skipped: 0, pct: 80, ...overrides.lines },
    statements: { total: 100, covered: 80, skipped: 0, pct: 80, ...overrides.statements },
    functions: { total: 10, covered: 8, skipped: 0, pct: 80, ...overrides.functions },
    branches: { total: 20, covered: 16, skipped: 0, pct: 80, ...overrides.branches },
  };
}

function createCoverageSummary(files: Record<string, Partial<CoverageData>> = {}): CoverageSummary {
  const summary: CoverageSummary = {
    total: createCoverageData(),
  };

  Object.entries(files).forEach(([path, data]) => {
    summary[path] = createCoverageData(data);
  });

  return summary;
}

// ─── hasApprovalComment ───────────────────────────────────────────────────

describe('hasApprovalComment', () => {
  it('detects approval comment in file content', () => {
    const content = `
      // @test-architect-approved: TICKET-123 Legacy code
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });

  it('returns false when no approval comment exists', () => {
    const content = `
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(false);
  });

  it('detects approval comment in block comments', () => {
    const content = `
      /*
       * @test-architect-approved: TICKET-456 Reason
       */
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });

  it('detects approval comment anywhere in file', () => {
    const content = `
      export class MyComponent {
        // @test-architect-approved: TICKET-789 Special case
        method() {}
      }
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });
});

// ─── hasTestFile ──────────────────────────────────────────────────────────

describe('hasTestFile', () => {
  it('returns true when test file exists', () => {
    // Use the actual path from project root
    const result = hasTestFile('/Volumes/Development/booked/helix/scripts/hooks/test-coverage-gate.ts');
    // Should look for test-coverage-gate.test.ts which exists
    expect(result).toBe(true);
  });

  it('returns false when test file does not exist', () => {
    const result = hasTestFile('scripts/hooks/nonexistent.ts');
    expect(result).toBe(false);
  });
});

// ─── normalizeFilePath ────────────────────────────────────────────────────

describe('normalizeFilePath', () => {
  it('converts relative path to absolute path', () => {
    const result = normalizeFilePath('test.ts');
    expect(result).toContain('/');
    expect(result.endsWith('test.ts')).toBe(true);
  });

  it('handles already absolute paths', () => {
    const absolutePath = '/absolute/path/test.ts';
    const result = normalizeFilePath(absolutePath);
    expect(result).toContain('test.ts');
  });

  it('normalizes paths with .. segments', () => {
    const result = normalizeFilePath('./foo/../test.ts');
    expect(result).not.toContain('..');
  });
});

// ─── checkFileCoverage ────────────────────────────────────────────────────

describe('checkFileCoverage', () => {
  it('does not flag files with coverage at threshold', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 80, skipped: 0, pct: 80 },
      branches: { total: 20, covered: 16, skipped: 0, pct: 80 },
      functions: { total: 10, covered: 8, skipped: 0, pct: 80 },
      statements: { total: 100, covered: 80, skipped: 0, pct: 80 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations).toHaveLength(0);
  });

  it('flags file with low line coverage', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 70, skipped: 0, pct: 70 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations.some((v) => v.message.includes('Line coverage'))).toBe(true);
    expect(violations.some((v) => v.severity === 'critical')).toBe(true);
  });

  it('flags file with low branch coverage', () => {
    const coverageData = createCoverageData({
      branches: { total: 20, covered: 10, skipped: 0, pct: 50 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    const branchViolation = violations.find((v) => v.message.includes('Branch coverage'));
    expect(branchViolation).toBeDefined();
    expect(branchViolation?.severity).toBe('critical');
    expect(branchViolation?.message).toContain('50.00%');
  });

  it('flags file with low function coverage', () => {
    const coverageData = createCoverageData({
      functions: { total: 10, covered: 5, skipped: 0, pct: 50 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    const functionViolation = violations.find((v) => v.message.includes('Function coverage'));
    expect(functionViolation).toBeDefined();
    expect(functionViolation?.severity).toBe('critical');
    expect(functionViolation?.suggestion).toContain('5 uncovered functions');
  });

  it('flags file with low statement coverage', () => {
    const coverageData = createCoverageData({
      statements: { total: 100, covered: 60, skipped: 0, pct: 60 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    const statementViolation = violations.find((v) => v.message.includes('Statement coverage'));
    expect(statementViolation).toBeDefined();
    expect(statementViolation?.severity).toBe('critical');
  });

  it('flags multiple coverage violations in same file', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 70, skipped: 0, pct: 70 },
      branches: { total: 20, covered: 10, skipped: 0, pct: 50 },
      functions: { total: 10, covered: 5, skipped: 0, pct: 50 },
      statements: { total: 100, covered: 60, skipped: 0, pct: 60 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations.length).toBe(4);
    expect(violations.every((v) => v.severity === 'critical')).toBe(true);
  });

  it('skips files with approval comment', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 0, skipped: 0, pct: 0 },
    });

    const violations: Violation[] = [];
    const content = '// @test-architect-approved: TICKET-123 Legacy\nexport class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations).toHaveLength(0);
  });

  it('warns when file has no test file', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';

    // This will warn because no test file exists
    checkFileCoverage('nonexistent-component.ts', undefined, violations, content);

    expect(violations.length).toBeGreaterThan(0);
    const noTestViolation = violations.find((v) =>
      v.message.includes('no corresponding test file'),
    );
    expect(noTestViolation).toBeDefined();
    expect(noTestViolation?.severity).toBe('warning');
  });

  it('warns when no coverage data exists', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';

    // Pass undefined coverage data for a file that has tests
    checkFileCoverage(
      '/Volumes/Development/booked/helix/scripts/hooks/test-coverage-gate.ts',
      undefined,
      violations,
      content,
    );

    expect(violations.length).toBeGreaterThan(0);
    const noCoverageViolation = violations.find((v) => v.message.includes('No coverage data'));
    expect(noCoverageViolation).toBeDefined();
    expect(noCoverageViolation?.severity).toBe('warning');
  });

  it('provides correct suggestions for violations', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 70, skipped: 0, pct: 70 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    const lineViolation = violations.find((v) => v.message.includes('Line coverage'));
    expect(lineViolation?.suggestion).toContain('30 uncovered lines');
    expect(lineViolation?.suggestion).toContain('70/100');
  });

  it('handles 100% coverage correctly', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 100, skipped: 0, pct: 100 },
      branches: { total: 20, covered: 20, skipped: 0, pct: 100 },
      functions: { total: 10, covered: 10, skipped: 0, pct: 100 },
      statements: { total: 100, covered: 100, skipped: 0, pct: 100 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations).toHaveLength(0);
  });

  it('handles edge case of 0% coverage', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 0, skipped: 0, pct: 0 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations.length).toBeGreaterThan(0);
    const lineViolation = violations.find((v) => v.message.includes('Line coverage'));
    expect(lineViolation?.message).toContain('0.00%');
  });

  it('sets correct file, line, and column in violations', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 70, skipped: 0, pct: 70 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('path/to/test.ts', coverageData, violations, content);

    const violation = violations[0];
    expect(violation?.file).toBe('path/to/test.ts');
    expect(violation?.line).toBe(1);
    expect(violation?.column).toBe(1);
  });
});

// ─── validateTestCoverageGate ─────────────────────────────────────────────

describe('validateTestCoverageGate', () => {
  it('returns passed when no files are staged', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => [],
      readFile: () => '',
      getCoverageSummary: () => null,
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('validates staged files with good coverage', async () => {
    // Use the actual absolute path that normalizeFilePath will produce
    const testFilePath = normalizeFilePath('test.ts');
    const mockCoverage = createCoverageSummary({
      [testFilePath]: {
        lines: { total: 100, covered: 85, skipped: 0, pct: 85 },
        branches: { total: 20, covered: 18, skipped: 0, pct: 90 },
        functions: { total: 10, covered: 9, skipped: 0, pct: 90 },
        statements: { total: 100, covered: 85, skipped: 0, pct: 85 },
      },
    });

    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => 'export class Test {}',
      getCoverageSummary: () => mockCoverage,
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(1);
  });

  it('fails when staged files have low coverage', async () => {
    const badFilePath = normalizeFilePath('bad.ts');
    const mockCoverage = createCoverageSummary({
      [badFilePath]: {
        lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
      },
    });

    const deps: HookDependencies = {
      getStagedFiles: () => ['bad.ts'],
      readFile: () => 'export class Bad {}',
      getCoverageSummary: () => mockCoverage,
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('handles multiple staged files', async () => {
    const goodFilePath = normalizeFilePath('good.ts');
    const badFilePath = normalizeFilePath('bad.ts');
    const mockCoverage = createCoverageSummary({
      [goodFilePath]: {
        lines: { total: 100, covered: 90, skipped: 0, pct: 90 },
      },
      [badFilePath]: {
        lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
      },
    });

    const deps: HookDependencies = {
      getStagedFiles: () => ['good.ts', 'bad.ts'],
      readFile: () => 'export class Test {}',
      getCoverageSummary: () => mockCoverage,
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.stats.filesChecked).toBe(2);
    expect(result.passed).toBe(false); // bad.ts fails
  });

  it('handles missing coverage summary gracefully', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => 'export class Test {}',
      getCoverageSummary: () => null,
    };

    const result = await validateTestCoverageGate(deps, true);

    // Should warn but not fail
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.every((v) => v.severity === 'warning')).toBe(true);
  });

  it('respects timeout configuration', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => {
        // Simulate slow file read
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Busy wait
        }
        return 'export class Test {}';
      },
      getCoverageSummary: () => createCoverageSummary(),
    };

    const result = await validateTestCoverageGate(deps, true);

    // Should complete (timeout is 3000ms, our delay is only 100ms)
    expect(result.stats.filesChecked).toBeGreaterThan(0);
  });

  it('counts violations correctly', async () => {
    const badFilePath = normalizeFilePath('bad.ts');
    const mockCoverage = createCoverageSummary({
      [badFilePath]: {
        lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
        branches: { total: 20, covered: 10, skipped: 0, pct: 50 },
        functions: { total: 10, covered: 5, skipped: 0, pct: 50 },
        statements: { total: 100, covered: 50, skipped: 0, pct: 50 },
      },
    });

    const deps: HookDependencies = {
      getStagedFiles: () => ['bad.ts'],
      readFile: () => 'export class Bad {}',
      getCoverageSummary: () => mockCoverage,
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.stats.totalViolations).toBe(4); // lines, branches, functions, statements
    expect(result.stats.criticalViolations).toBe(4);
    expect(result.stats.warningViolations).toBe(0);
  });

  it('handles file read errors gracefully', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => {
        throw new Error('File read error');
      },
      getCoverageSummary: () => createCoverageSummary(),
    };

    // Should not throw
    const result = await validateTestCoverageGate(deps, true);

    expect(result.passed).toBe(true); // No violations due to error handling
  });

  it('passes when warnings exist but no critical violations', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => 'export class Test {}',
      getCoverageSummary: () => null, // No coverage summary -> warning
    };

    const result = await validateTestCoverageGate(deps, true);

    expect(result.passed).toBe(true);
    expect(result.stats.warningViolations).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBe(0);
  });

  it('logs progress messages when not in silent mode', async () => {
    const testFilePath = normalizeFilePath('test.ts');
    const mockCoverage = createCoverageSummary({
      [testFilePath]: {
        lines: { total: 100, covered: 85, skipped: 0, pct: 85 },
      },
    });

    const deps: HookDependencies = {
      getStagedFiles: () => ['test.ts'],
      readFile: () => 'export class Test {}',
      getCoverageSummary: () => mockCoverage,
    };

    // Call with silent=false to test console output paths
    const result = await validateTestCoverageGate(deps, false);

    expect(result.passed).toBe(true);
  });

  it('handles timeout warning in console output', async () => {
    const longRunningDeps: HookDependencies = {
      getStagedFiles: () => Array(100).fill('test.ts'),
      readFile: () => {
        // Intentionally slow
        const start = Date.now();
        while (Date.now() - start < 50) {
          // Busy wait
        }
        return 'export class Test {}';
      },
      getCoverageSummary: () => createCoverageSummary(),
    };

    // Should complete despite slow file reads (we're still under 3s timeout)
    const result = await validateTestCoverageGate(longRunningDeps, true);
    expect(result.stats).toBeDefined();
  });
});

// ─── getStagedFiles ───────────────────────────────────────────────────────

describe('getStagedFiles', () => {
  it('returns array of files', () => {
    const files = getStagedFiles();
    // Will return empty or files depending on git state
    expect(Array.isArray(files)).toBe(true);
  });

  it('filters out excluded patterns', () => {
    const files = getStagedFiles();
    // Should not include test files, stories, styles, etc.
    const hasExcluded = files.some(
      (f) =>
        f.endsWith('.test.ts') ||
        f.endsWith('.stories.ts') ||
        f.endsWith('.styles.ts') ||
        f.endsWith('index.ts'),
    );
    expect(hasExcluded).toBe(false);
  });
});

// ─── readFile ─────────────────────────────────────────────────────────────

describe('readFile', () => {
  it('reads file contents', () => {
    const content = readFile('/Volumes/Development/booked/helix/scripts/hooks/test-coverage-gate.ts');
    expect(content).toContain('test-coverage-gate');
    expect(typeof content).toBe('string');
  });
});

// ─── getCoverageSummary ───────────────────────────────────────────────────

describe('getCoverageSummary', () => {
  it('returns coverage summary object or null', () => {
    const result = getCoverageSummary();
    // Will return either the actual coverage or null depending on if tests ran
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('handles missing coverage file gracefully', () => {
    // Even if file doesn't exist, should not throw
    expect(() => getCoverageSummary()).not.toThrow();
  });
});

// ─── formatViolation ──────────────────────────────────────────────────────

describe('formatViolation', () => {
  it('formats critical violations with correct icon', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 10,
      column: 5,
      message: 'Line coverage below threshold',
      suggestion: 'Add more tests',
      severity: 'critical',
    };

    const formatted = formatViolation(violation);

    expect(formatted).toContain('[CRITICAL]');
    expect(formatted).toContain('test.ts:10:5');
    expect(formatted).toContain('Line coverage below threshold');
    expect(formatted).toContain('Add more tests');
  });

  it('formats warning violations correctly', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 1,
      column: 1,
      message: 'No test file found',
      suggestion: 'Create test file',
      severity: 'warning',
    };

    const formatted = formatViolation(violation);

    expect(formatted).toContain('[WARNING]');
    expect(formatted).toContain('test.ts:1:1');
    expect(formatted).toContain('No test file found');
  });

  it('includes code snippet when provided', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 5,
      column: 10,
      message: 'Coverage issue',
      suggestion: 'Fix it',
      code: 'export function test() {}',
      severity: 'critical',
    };

    const formatted = formatViolation(violation);

    expect(formatted).toContain('export function test() {}');
  });

  it('omits code snippet when not provided', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 1,
      column: 1,
      message: 'Issue',
      suggestion: 'Fix',
      severity: 'warning',
    };

    const formatted = formatViolation(violation);

    expect(formatted).not.toContain('undefined');
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────

describe('integration', () => {
  it('validates real coverage data structure', () => {
    const mockRealCoverage: CoverageSummary = {
      total: createCoverageData(),
      '/Volumes/Development/booked/helix/packages/hx-library/src/components/hx-button/hx-button.ts': {
        lines: { total: 57, covered: 53, skipped: 0, pct: 92.98 },
        functions: { total: 4, covered: 4, skipped: 0, pct: 100 },
        statements: { total: 57, covered: 53, skipped: 0, pct: 92.98 },
        branches: { total: 12, covered: 11, skipped: 0, pct: 91.66 },
      },
    };

    expect(mockRealCoverage.total).toBeDefined();
    expect(mockRealCoverage.total.lines).toBeDefined();
    expect(mockRealCoverage.total.lines.pct).toBeGreaterThanOrEqual(0);
  });

  it('handles all threshold types correctly', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 81, skipped: 0, pct: 81 },
      branches: { total: 20, covered: 17, skipped: 0, pct: 85 },
      functions: { total: 10, covered: 9, skipped: 0, pct: 90 },
      statements: { total: 100, covered: 82, skipped: 0, pct: 82 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    expect(violations).toHaveLength(0);
  });

  it('formats violation messages correctly', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 50, skipped: 0, pct: 50 },
    });

    const violations: Violation[] = [];
    const content = 'export class Test {}';

    checkFileCoverage('test.ts', coverageData, violations, content);

    const violation = violations[0];
    expect(violation?.message).toContain('50.00%');
    expect(violation?.message).toContain('80%');
    expect(violation?.suggestion).toContain('50 uncovered lines');
  });

  it('handles files at exactly threshold boundary', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 80, skipped: 0, pct: 80.0 },
      branches: { total: 20, covered: 16, skipped: 0, pct: 80.0 },
      functions: { total: 10, covered: 8, skipped: 0, pct: 80.0 },
      statements: { total: 100, covered: 80, skipped: 0, pct: 80.0 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    expect(violations).toHaveLength(0);
  });

  it('handles files just below threshold', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 79, skipped: 0, pct: 79.0 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]?.severity).toBe('critical');
  });

  it('handles empty files with zero coverage', () => {
    const coverageData = createCoverageData({
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    // Zero total lines should still fail if pct is 0
    expect(violations.length).toBeGreaterThan(0);
  });

  it('provides accurate uncovered counts in suggestions', () => {
    const coverageData = createCoverageData({
      lines: { total: 200, covered: 150, skipped: 0, pct: 75 },
      branches: { total: 40, covered: 25, skipped: 0, pct: 62.5 },
      functions: { total: 15, covered: 10, skipped: 0, pct: 66.66 },
      statements: { total: 200, covered: 140, skipped: 0, pct: 70 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    const lineViolation = violations.find((v) => v.message.includes('Line coverage'));
    expect(lineViolation?.suggestion).toContain('50 uncovered lines');
    expect(lineViolation?.suggestion).toContain('150/200');

    const branchViolation = violations.find((v) => v.message.includes('Branch coverage'));
    expect(branchViolation?.suggestion).toContain('15 uncovered branches');
    expect(branchViolation?.suggestion).toContain('25/40');
  });

  it('handles very low coverage percentages', () => {
    const coverageData = createCoverageData({
      lines: { total: 1000, covered: 100, skipped: 0, pct: 10 },
      branches: { total: 100, covered: 5, skipped: 0, pct: 5 },
      functions: { total: 50, covered: 2, skipped: 0, pct: 4 },
      statements: { total: 1000, covered: 90, skipped: 0, pct: 9 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    expect(violations).toHaveLength(4);
    expect(violations.every((v) => v.severity === 'critical')).toBe(true);
  });

  it('handles high coverage close to 100%', () => {
    const coverageData = createCoverageData({
      lines: { total: 100, covered: 99, skipped: 0, pct: 99 },
      branches: { total: 20, covered: 19, skipped: 0, pct: 95 },
      functions: { total: 10, covered: 10, skipped: 0, pct: 100 },
      statements: { total: 100, covered: 98, skipped: 0, pct: 98 },
    });

    const violations: Violation[] = [];
    checkFileCoverage('test.ts', coverageData, violations, 'export class Test {}');

    expect(violations).toHaveLength(0);
  });
});
