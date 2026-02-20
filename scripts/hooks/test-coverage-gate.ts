#!/usr/bin/env tsx
/**
 * Hook: test-coverage-gate (H03)
 *
 * Enforces test coverage requirements on staged component files.
 * Execution budget: <3 seconds
 *
 * Catches:
 * - Component files with <80% line coverage
 * - Component files with <80% branch coverage
 * - Component files with <80% function coverage
 * - Component files with <80% statement coverage
 * - Component files without corresponding test files
 *
 * Allows:
 * - Files without tests (warns but doesn't block)
 * - Approved exceptions: // @test-architect-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/test-coverage-gate.ts
 *   tsx scripts/hooks/test-coverage-gate.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:test-coverage-gate
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { minimatch } from 'minimatch';
import { resolve } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code?: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  readFile: (path: string) => string;
  getCoverageSummary: () => CoverageSummary | null;
}

interface CoverageData {
  lines: { total: number; covered: number; skipped: number; pct: number };
  statements: { total: number; covered: number; skipped: number; pct: number };
  functions: { total: number; covered: number; skipped: number; pct: number };
  branches: { total: number; covered: number; skipped: number; pct: number };
}

interface CoverageSummary {
  total: CoverageData;
  [filePath: string]: CoverageData;
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files to check (only staged component files)
  includePatterns: ['packages/hx-library/src/components/**/*.ts'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/test-utils.ts',
    '**/index.ts',
    '**/*.d.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Coverage thresholds (80% minimum)
  thresholds: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80,
  },

  // Approval mechanism for exceptional cases
  approvalComment: '@test-architect-approved',

  // Coverage summary location
  coverageSummaryPath: 'packages/hx-library/.cache/coverage/coverage-summary.json',

  // Performance: timeout
  timeoutMs: 3000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Get list of staged component TypeScript files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => {
        // Must match include patterns using minimatch
        const matchesInclude = CONFIG.includePatterns.some((pattern) => minimatch(file, pattern));

        if (!matchesInclude) {
          return false;
        }

        // Must not match exclude patterns using minimatch
        const matchesExclude = CONFIG.excludePatterns.some((pattern) => minimatch(file, pattern));

        return !matchesExclude;
      })
      .filter((file) => existsSync(file));
  } catch (error) {
    console.error('Failed to get staged files:', error);
    return [];
  }
}

/**
 * Read file contents
 */
function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

/**
 * Check if a file has an approval comment
 */
function hasApprovalComment(filePath: string, content: string): boolean {
  return content.includes(CONFIG.approvalComment);
}

/**
 * Get coverage summary from vitest output
 */
function getCoverageSummary(): CoverageSummary | null {
  const coveragePath = resolve(CONFIG.coverageSummaryPath);

  if (!existsSync(coveragePath)) {
    return null;
  }

  try {
    const content = readFileSync(coveragePath, 'utf-8');
    return JSON.parse(content) as CoverageSummary;
  } catch (error) {
    console.error('Failed to parse coverage summary:', error);
    return null;
  }
}

/**
 * Check if a test file exists for the component
 */
function hasTestFile(componentPath: string): boolean {
  // Convert hx-button.ts -> hx-button.test.ts
  const testPath = componentPath.replace(/\.ts$/, '.test.ts');
  return existsSync(testPath);
}

/**
 * Format violation for console output
 */
function formatViolation(violation: Violation): string {
  const icon = violation.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
  const location = `${violation.file}:${violation.line}:${violation.column}`;

  return `${icon} ${location}
   ${violation.message}
   Suggestion: ${violation.suggestion}${violation.code ? `\n   ${violation.code}` : ''}`;
}

/**
 * Normalize file path to absolute path for coverage lookup
 */
function normalizeFilePath(filePath: string): string {
  return resolve(filePath);
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check coverage for a single file
 */
function checkFileCoverage(
  filePath: string,
  coverageData: CoverageData | undefined,
  violations: Violation[],
  content: string,
): void {
  // Skip if file has approval comment
  if (hasApprovalComment(filePath, content)) {
    return;
  }

  // If no coverage data, file might not be included in coverage report
  if (!coverageData) {
    // Check if test file exists
    if (!hasTestFile(filePath)) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: 'Component file has no corresponding test file',
        suggestion: `Create ${filePath.replace(/\.ts$/, '.test.ts')} with tests for this component`,
        severity: 'warning',
      });
    } else {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: 'No coverage data found for this file',
        suggestion: 'Ensure tests exist and run "npm run test:library" to generate coverage report',
        severity: 'warning',
      });
    }
    return;
  }

  // Check line coverage
  if (coverageData.lines.pct < CONFIG.thresholds.lines) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Line coverage ${coverageData.lines.pct.toFixed(2)}% below threshold ${CONFIG.thresholds.lines}%`,
      suggestion: `Add tests to cover ${coverageData.lines.total - coverageData.lines.covered} uncovered lines (${coverageData.lines.covered}/${coverageData.lines.total} covered)`,
      severity: 'critical',
    });
  }

  // Check branch coverage
  if (coverageData.branches.pct < CONFIG.thresholds.branches) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Branch coverage ${coverageData.branches.pct.toFixed(2)}% below threshold ${CONFIG.thresholds.branches}%`,
      suggestion: `Add tests to cover ${coverageData.branches.total - coverageData.branches.covered} uncovered branches (${coverageData.branches.covered}/${coverageData.branches.total} covered)`,
      severity: 'critical',
    });
  }

  // Check function coverage
  if (coverageData.functions.pct < CONFIG.thresholds.functions) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Function coverage ${coverageData.functions.pct.toFixed(2)}% below threshold ${CONFIG.thresholds.functions}%`,
      suggestion: `Add tests to cover ${coverageData.functions.total - coverageData.functions.covered} uncovered functions (${coverageData.functions.covered}/${coverageData.functions.total} covered)`,
      severity: 'critical',
    });
  }

  // Check statement coverage
  if (coverageData.statements.pct < CONFIG.thresholds.statements) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Statement coverage ${coverageData.statements.pct.toFixed(2)}% below threshold ${CONFIG.thresholds.statements}%`,
      suggestion: `Add tests to cover ${coverageData.statements.total - coverageData.statements.covered} uncovered statements (${coverageData.statements.covered}/${coverageData.statements.total} covered)`,
      severity: 'critical',
    });
  }
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  readFile,
  getCoverageSummary,
};

// ─── Main Validation ──────────────────────────────────────────────────────

async function validateTestCoverageGate(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const stagedFiles = deps.getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('No component files staged for commit');
    }
    return {
      passed: true,
      violations: [],
      stats: {
        filesChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
      },
    };
  }

  if (!silent) {
    console.log(`Checking ${stagedFiles.length} file(s) for test coverage...`);
    console.log('');
  }

  // Get coverage summary
  const coverageSummary = deps.getCoverageSummary();

  if (!coverageSummary && !silent) {
    console.log(
      '⚠️  No coverage summary found. Run "npm run test:library" to generate coverage report.',
    );
    console.log('');
  }

  const violations: Violation[] = [];

  // Analyze each staged file
  for (const filePath of stagedFiles) {
    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      console.warn(
        `[WARNING] Timeout reached (${CONFIG.timeoutMs}ms). Remaining files not checked.`,
      );
      break;
    }

    try {
      const content = deps.readFile(filePath);
      const absolutePath = normalizeFilePath(filePath);

      // Get coverage data for this file
      // Try both absolute and relative paths to handle different coverage summary formats
      const coverageData = coverageSummary?.[absolutePath] ?? coverageSummary?.[filePath];

      // Check coverage
      checkFileCoverage(filePath, coverageData, violations, content);
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
    }
  }

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  const elapsedTime = Date.now() - startTime;
  if (!silent) {
    console.log(`Completed in ${elapsedTime}ms`);
    console.log('');
  }

  return {
    passed: criticalViolations.length === 0,
    violations,
    stats: {
      filesChecked: stagedFiles.length,
      totalViolations: violations.length,
      criticalViolations: criticalViolations.length,
      warningViolations: warningViolations.length,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');

  if (!outputJson) {
    console.log('Test Coverage Hook: test-coverage-gate (H03)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateTestCoverageGate(defaultDeps, outputJson);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          violations: result.violations,
          stats: result.stats,
        },
        null,
        2,
      ),
    );
    process.exit(result.passed ? 0 : 1);
  }

  // Human-readable output mode
  if (result.violations.length === 0) {
    console.log('[PASS] No test coverage violations found');
    console.log('');
    process.exit(0);
  }

  // Print violations grouped by severity
  const criticalViolations = result.violations.filter((v) => v.severity === 'critical');
  const warningViolations = result.violations.filter((v) => v.severity === 'warning');

  if (criticalViolations.length > 0) {
    console.log(`[FAIL] Found ${criticalViolations.length} critical violation(s):`);
    console.log('');
    criticalViolations.forEach((violation) => {
      console.log(formatViolation(violation));
      console.log('');
    });
  }

  if (warningViolations.length > 0) {
    console.log(`[WARNING] Found ${warningViolations.length} warning(s):`);
    console.log('');
    warningViolations.forEach((violation) => {
      console.log(formatViolation(violation));
      console.log('');
    });
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('Summary:');
  console.log(`   Files checked: ${result.stats.filesChecked}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical: ${result.stats.criticalViolations}`);
  console.log(`   Warnings: ${result.stats.warningViolations}`);
  console.log('');

  if (result.passed) {
    // Exit 0 allows commit even with warnings (intentional behavior)
    // Critical violations block (exit 1), but warnings are acceptable
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[BLOCKED] Commit blocked due to critical violations');
    console.log('');
    console.log('To fix:');
    console.log('   1. Run "npm run test:library" to see current coverage');
    console.log('   2. Add tests to bring coverage above 80% threshold');
    console.log('   3. Focus on uncovered lines, branches, and functions');
    console.log('   4. Ensure all component methods are tested');
    console.log('');
    console.log('Emergency bypass (NOT recommended):');
    console.log('   git commit --no-verify');
    console.log('');
    console.log('Approved exceptions:');
    console.log(`   Add comment: // ${CONFIG.approvalComment}: TICKET-123 Reason`);
    console.log('');
    process.exit(1);
  }
}

// Run if called directly (ES Module compatible)
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? '');

if (isMainModule) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

// Export for testing
export {
  validateTestCoverageGate,
  checkFileCoverage,
  hasApprovalComment,
  hasTestFile,
  normalizeFilePath,
  getCoverageSummary,
  getStagedFiles,
  formatViolation,
  readFile,
};

export type { Violation, ValidationResult, HookDependencies, CoverageSummary, CoverageData };
