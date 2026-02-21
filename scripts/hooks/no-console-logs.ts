#!/usr/bin/env tsx
/**
 * Pre-commit Hook: no-console-logs (H12)
 *
 * Prevents console.log, console.debug, console.warn, and console.error
 * statements from being committed to production code.
 *
 * Allows:
 * - console statements in test files (*.test.ts, *.spec.ts)
 * - console statements in story files (*.stories.ts)
 * - Approved usage with @console-approved comment
 *
 * @owner Code Reviewer
 * @priority P1
 * @phase 2
 * @executionBudget <1s
 */

import { execSync } from 'node:child_process';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly consolePatterns: readonly RegExp[];
  readonly timeoutMs: number;
}

const CONFIG: HookConfig = {
  // Only check TypeScript/JavaScript source files
  includePatterns: [
    'packages/**/src/**/*.ts',
    'packages/**/src/**/*.tsx',
    'packages/**/src/**/*.js',
    'packages/**/src/**/*.jsx',
    'apps/**/src/**/*.ts',
    'apps/**/src/**/*.tsx',
    'apps/**/src/**/*.js',
    'apps/**/src/**/*.jsx',
  ],

  // Exclude test files, story files, and config files
  excludePatterns: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.stories.ts',
    '**/*.stories.tsx',
    '**/test-utils.ts',
    '**/vitest.config.ts',
    '**/vite.config.ts',
    '**/*.config.ts',
    '**/*.config.js',
  ],

  approvalComment: '@console-approved',

  // Console methods to detect
  consolePatterns: [
    /console\.log\s*\(/,
    /console\.debug\s*\(/,
    /console\.warn\s*\(/,
    /console\.error\s*\(/,
    /console\.info\s*\(/,
    /console\.trace\s*\(/,
  ],

  timeoutMs: 5000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    consolesFound: number;
    approvedConsoles: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Git Integration
// ─────────────────────────────────────────────────────────────────────────────

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });

    const allFiles = output
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    // Filter by include patterns
    const includeRegexes = CONFIG.includePatterns.map(globToRegex);
    const excludeRegexes = CONFIG.excludePatterns.map(globToRegex);

    const filtered = allFiles.filter((file) => {
      const matchesInclude = includeRegexes.some((regex) => regex.test(file));
      const matchesExclude = excludeRegexes.some((regex) => regex.test(file));
      return matchesInclude && !matchesExclude;
    });

    return filtered;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§GLOBSTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§GLOBSTAR§/g, '.*');
  return new RegExp(`^${escaped}$`);
}

// ─────────────────────────────────────────────────────────────────────────────
// File Analysis
// ─────────────────────────────────────────────────────────────────────────────

function checkFileForConsoles(filePath: string): Violation[] {
  const violations: Violation[] = [];

  try {
    const content = execSync(`git show :${filePath}`, {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });

    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check if line has approval comment
      const hasApproval = line.includes(CONFIG.approvalComment);

      // Check for console patterns
      for (const pattern of CONFIG.consolePatterns) {
        const match = pattern.exec(line);
        if (match) {
          if (!hasApproval) {
            // Check if approval is on previous line
            const prevLine = i > 0 ? lines[i - 1] : '';
            const hasPrevApproval = prevLine.includes(CONFIG.approvalComment);

            if (!hasPrevApproval) {
              violations.push({
                file: filePath,
                line: lineNumber,
                column: match.index + 1,
                message: `Console statement found: ${match[0]}`,
                suggestion: `Remove console statement or add approval comment: // ${CONFIG.approvalComment}: REASON`,
                code: line.trim(),
                severity: 'critical',
              });
            }
          }
        }
      }
    }
  } catch (error) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      suggestion: 'Ensure file is properly staged and accessible',
      code: '',
      severity: 'warning',
    });
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateNoConsoleLogs(): Promise<ValidationResult> {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    return {
      passed: true,
      violations: [],
      stats: {
        filesChecked: 0,
        consolesFound: 0,
        approvedConsoles: 0,
      },
    };
  }

  const allViolations: Violation[] = [];

  for (const file of stagedFiles) {
    const violations = checkFileForConsoles(file);
    allViolations.push(...violations);
  }

  const consolesFound = allViolations.length;
  const approvedConsoles = 0; // Not tracked in this implementation

  return {
    passed: allViolations.length === 0,
    violations: allViolations,
    stats: {
      filesChecked: stagedFiles.length,
      consolesFound,
      approvedConsoles,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatOutput(result: ValidationResult): void {
  console.log('\n[HOOK] no-console-logs (H12)');
  console.log('━'.repeat(60));

  if (result.stats.filesChecked === 0) {
    console.log('\n[INFO] No source files staged for commit');
    console.log('[PASS] No console statement violations found\n');
    return;
  }

  console.log(`\n[INFO] Checked ${result.stats.filesChecked} file(s)`);

  if (result.passed) {
    console.log('[PASS] No console statement violations found\n');
    return;
  }

  console.log(`\n[FAIL] Found ${result.violations.length} console statement(s)\n`);

  // Group violations by file
  const byFile = new Map<string, Violation[]>();
  for (const v of result.violations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, violations] of byFile) {
    console.log(`\n📄 ${file}`);
    for (const v of violations) {
      console.log(`   Line ${v.line}:${v.column}`);
      console.log(`   ❌ ${v.message}`);
      if (v.code) {
        console.log(`   Code: ${v.code}`);
      }
      console.log(`   💡 ${v.suggestion}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Console statements are not allowed in production code.');
  console.log('Use proper logging libraries or remove debug statements.');
  console.log('For exceptional cases, add approval comment:');
  console.log(`  // ${CONFIG.approvalComment}: Reason for exception`);
  console.log('─'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const result = await validateNoConsoleLogs();
    formatOutput(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('\n[ERROR] Hook execution failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
