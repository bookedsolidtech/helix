#!/usr/bin/env tsx
/**
 * Hook: bundle-size-guard (H04)
 *
 * Enforces bundle size budgets on staged component files.
 * Execution budget: <3 seconds
 *
 * Catches:
 * - Component bundles exceeding 5KB (minified + gzipped)
 * - Full library bundle exceeding 50KB (minified + gzipped)
 * - Missing build artifacts (warns but doesn't block)
 *
 * Allows:
 * - Approved exceptions: // @performance-engineer-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/bundle-size-guard.ts
 *   tsx scripts/hooks/bundle-size-guard.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:bundle-size-guard
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { minimatch } from 'minimatch';
import { resolve, join, basename, dirname } from 'path';
import { tmpdir } from 'os';

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

/**
 * Dependency injection interface for testing
 * Allows mocking of file system operations and git commands
 */
interface HookDependencies {
  getStagedFiles: () => string[];
  readFile: (path: string) => string;
  getFileSize: (path: string) => number;
  getGzipSize: (path: string) => number;
  getBuildArtifactPath: (componentPath: string) => string | null;
}

interface BundleSizeInfo {
  raw: number;
  minified: number;
  gzipped: number;
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

  // Bundle size thresholds (minified + gzipped)
  thresholds: {
    perComponent: 5 * 1024, // 5KB
    fullBundle: 50 * 1024, // 50KB
  },

  // Approval mechanism for exceptional cases
  approvalComment: '@performance-engineer-approved',

  // Library paths
  libraryRoot: 'packages/hx-library',
  distDir: 'packages/hx-library/dist',

  // Performance: execution timeout
  timeoutMs: 3000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Get list of staged TypeScript files
 */
export function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((file) => normalizeFilePath(file));
  } catch {
    return [];
  }
}

/**
 * Normalize file path to absolute path
 */
export function normalizeFilePath(filePath: string): string {
  if (filePath.startsWith('/')) {
    return filePath;
  }
  return resolve(process.cwd(), filePath);
}

/**
 * Read file contents
 */
export function readFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Get gzipped file size in bytes
 */
export function getGzipSize(filePath: string): number {
  try {
    // Create a temporary gzipped file
    const tmpFile = join(tmpdir(), `bundle-size-guard-${Date.now()}.gz`);
    execSync(`gzip -c "${filePath}" > "${tmpFile}"`, { encoding: 'utf-8' });
    const size = getFileSize(tmpFile);
    // Clean up
    try {
      execSync(`rm "${tmpFile}"`, { encoding: 'utf-8' });
    } catch {
      // Ignore cleanup errors
    }
    return size;
  } catch {
    return 0;
  }
}

/**
 * Get build artifact path for a component source file
 *
 * Maps: packages/hx-library/src/components/hx-button/hx-button.ts
 *    -> packages/hx-library/dist/shared/hx-button-*.js
 */
export function getBuildArtifactPath(componentPath: string): string | null {
  try {
    // Extract component name from path
    // e.g., packages/hx-library/src/components/hx-button/hx-button.ts -> hx-button
    const componentMatch = componentPath.match(/\/components\/([^/]+)\/\1\.ts$/);
    if (!componentMatch) {
      return null;
    }

    const componentName = componentMatch[1];
    const distDir = resolve(process.cwd(), CONFIG.distDir);
    const sharedDir = join(distDir, 'shared');

    if (!existsSync(sharedDir)) {
      return null;
    }

    // Find the hashed chunk file for this component
    // e.g., hx-button-Drd1Q6qC.js
    const files = execSync(`ls "${sharedDir}"`, { encoding: 'utf-8' })
      .split('\n')
      .filter((f) => f.trim().length > 0);

    const pattern = `${componentName}-*.js`;
    const matchingFile = files.find((f) => minimatch(f, pattern));

    if (matchingFile) {
      return join(sharedDir, matchingFile);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if file has approval comment
 */
export function hasApprovalComment(filePath: string, content: string): boolean {
  const approvalPattern = new RegExp(`@performance-engineer-approved`, 'i');
  return approvalPattern.test(content);
}

/**
 * Get bundle size information for a build artifact
 */
export function getBundleSizeInfo(
  artifactPath: string,
  deps: HookDependencies = defaultDependencies,
): BundleSizeInfo | null {
  const raw = deps.getFileSize(artifactPath);
  const gzipped = deps.getGzipSize(artifactPath);

  // If both sizes are 0, file doesn't exist
  if (raw === 0 && gzipped === 0) {
    return null;
  }

  return {
    raw,
    minified: raw, // Vite already minifies with esbuild
    gzipped,
  };
}

/**
 * Format bundle size in human-readable format
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  return `${(bytes / 1024).toFixed(2)}KB`;
}

/**
 * Check if component bundle size is within budget
 */
export function checkComponentBundleSize(
  filePath: string,
  violations: Violation[],
  content: string,
  deps: HookDependencies = defaultDependencies,
): void {
  // Skip if file has approval comment
  if (hasApprovalComment(filePath, content)) {
    return;
  }

  const artifactPath = deps.getBuildArtifactPath(filePath);

  if (!artifactPath) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: 'Build artifact not found',
      suggestion: 'Run npm run build to generate build artifacts before committing',
      severity: 'warning',
    });
    return;
  }

  const sizeInfo = getBundleSizeInfo(artifactPath, deps);

  if (!sizeInfo) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: 'Cannot read build artifact size',
      suggestion: 'Run npm run build to regenerate build artifacts',
      severity: 'warning',
    });
    return;
  }

  const budget = CONFIG.thresholds.perComponent;
  const actual = sizeInfo.gzipped;

  if (actual > budget) {
    const componentName = basename(dirname(filePath));
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Component bundle exceeds size budget: ${formatSize(actual)} > ${formatSize(budget)} (gzipped)`,
      suggestion: `Reduce component size or add approval comment: // ${CONFIG.approvalComment}: TICKET-XXX Justification`,
      code: componentName,
      severity: 'critical',
    });
  }
}

/**
 * Check if full library bundle is within budget
 */
export function checkFullBundleSize(
  violations: Violation[],
  deps: HookDependencies = defaultDependencies,
): void {
  const distDir = resolve(process.cwd(), CONFIG.distDir);
  const indexPath = join(distDir, 'index.js');

  if (!existsSync(indexPath)) {
    violations.push({
      file: indexPath,
      line: 1,
      column: 1,
      message: 'Library index bundle not found',
      suggestion: 'Run npm run build to generate library bundle',
      severity: 'warning',
    });
    return;
  }

  // Calculate total bundle size (index.js + all shared chunks)
  const sharedDir = join(distDir, 'shared');
  let totalSize = deps.getGzipSize(indexPath);

  if (existsSync(sharedDir)) {
    try {
      const files = execSync(`ls "${sharedDir}"/*.js`, { encoding: 'utf-8' })
        .split('\n')
        .filter((f) => f.trim().length > 0);

      for (const file of files) {
        totalSize += deps.getGzipSize(file);
      }
    } catch {
      // No shared files
    }
  }

  const budget = CONFIG.thresholds.fullBundle;

  if (totalSize > budget) {
    violations.push({
      file: indexPath,
      line: 1,
      column: 1,
      message: `Full library bundle exceeds size budget: ${formatSize(totalSize)} > ${formatSize(budget)} (gzipped)`,
      suggestion: 'Optimize component sizes or review bundling strategy',
      severity: 'critical',
    });
  }
}

/**
 * Filter files by include/exclude patterns
 */
export function filterFiles(files: string[]): string[] {
  return files.filter((file) => {
    // Check exclude patterns first
    for (const pattern of CONFIG.excludePatterns) {
      if (minimatch(file, pattern) || minimatch(basename(file), pattern)) {
        return false;
      }
    }

    // Check include patterns
    for (const pattern of CONFIG.includePatterns) {
      if (minimatch(file, pattern)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Format violation for console output
 */
export function formatViolation(v: Violation): string {
  const icon = v.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
  const location = `${v.file}:${v.line}:${v.column}`;
  const codeHint = v.code ? ` (${v.code})` : '';
  return `${icon} ${location}${codeHint}\n  ${v.message}\n  Suggestion: ${v.suggestion}`;
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDependencies: HookDependencies = {
  getStagedFiles,
  readFile,
  getFileSize,
  getGzipSize,
  getBuildArtifactPath,
};

/**
 * Main validation function
 */
export function validateBundleSizeGuard(
  deps: HookDependencies = defaultDependencies,
): ValidationResult {
  const startTime = Date.now();
  const violations: Violation[] = [];

  const stagedFiles = deps.getStagedFiles();
  const componentFiles = filterFiles(stagedFiles);

  // Check each component's bundle size
  for (const file of componentFiles) {
    const content = deps.readFile(file);
    checkComponentBundleSize(file, violations, content, deps);

    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      violations.push({
        file: 'bundle-size-guard',
        line: 1,
        column: 1,
        message: `Execution timeout exceeded (${CONFIG.timeoutMs}ms)`,
        suggestion: `Reduce number of staged files (${componentFiles.length} currently) or run hook separately: tsx scripts/hooks/bundle-size-guard.ts`,
        severity: 'warning',
      });
      break;
    }
  }

  // Check full bundle size if any component files are staged
  if (componentFiles.length > 0) {
    checkFullBundleSize(violations, deps);
  }

  const stats = {
    filesChecked: componentFiles.length,
    totalViolations: violations.length,
    criticalViolations: violations.filter((v) => v.severity === 'critical').length,
    warningViolations: violations.filter((v) => v.severity === 'warning').length,
  };

  return {
    passed: stats.criticalViolations === 0,
    violations,
    stats,
  };
}

// ─── CLI ──────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');

  const result = validateBundleSizeGuard();

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.passed ? 0 : 1);
  }

  // Human-readable output
  console.log('\n=== Bundle Size Guard (H04) ===\n');

  if (result.violations.length === 0) {
    console.log('[PASS] All bundle sizes within budget');
    console.log(`\nChecked ${result.stats.filesChecked} files`);
  } else {
    console.log(`Found ${result.stats.totalViolations} violations:\n`);

    result.violations.forEach((v) => {
      console.log(formatViolation(v));
      console.log('');
    });

    console.log(`\nSummary:`);
    console.log(`  Files checked: ${result.stats.filesChecked}`);
    console.log(`  Critical violations: ${result.stats.criticalViolations}`);
    console.log(`  Warnings: ${result.stats.warningViolations}`);
  }

  process.exit(result.passed ? 0 : 1);
}
