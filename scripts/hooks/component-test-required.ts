#!/usr/bin/env tsx
/**
 * Pre-commit Hook: component-test-required (H10)
 *
 * Ensures every component has a corresponding test file.
 * Prevents components from being added without tests.
 *
 * Validates:
 * - Every hx-*.ts component has a corresponding hx-*.test.ts
 * - Test file is in the same directory as the component
 * - New components cannot be committed without tests
 *
 * @owner QA Engineer (Automation)
 * @priority P0
 * @phase 1
 * @executionBudget <1s
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface HookConfig {
  readonly componentPattern: RegExp;
  readonly excludePatterns: readonly RegExp[];
  readonly componentsRoot: string;
  readonly timeoutMs: number;
}

const CONFIG: HookConfig = {
  // Match component files: hx-button.ts, hx-card.ts, etc.
  componentPattern: /^hx-[a-z-]+\.ts$/,

  // Exclude these files from requiring tests
  excludePatterns: [
    /\.test\.ts$/,
    /\.spec\.ts$/,
    /\.stories\.ts$/,
    /\.styles\.ts$/,
    /index\.ts$/,
    /types\.ts$/,
    /constants\.ts$/,
    /utils\.ts$/,
  ],

  componentsRoot: 'packages/hx-library/src/components',

  timeoutMs: 5000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  message: string;
  suggestion: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    componentsChecked: number;
    missingTests: number;
    validTests: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Git Integration
// ─────────────────────────────────────────────────────────────────────────────

function getStagedComponentFiles(): string[] {
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

    // Filter for component files only
    const componentFiles = allFiles.filter((file) => {
      // Must be in components directory
      if (!file.includes(CONFIG.componentsRoot)) {
        return false;
      }

      const fileName = basename(file);

      // Must match component pattern
      if (!CONFIG.componentPattern.test(fileName)) {
        return false;
      }

      // Must not match exclusion patterns
      if (CONFIG.excludePatterns.some((pattern) => pattern.test(fileName))) {
        return false;
      }

      return true;
    });

    return componentFiles;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function getTestPath(componentPath: string): string {
  const dir = dirname(componentPath);
  const fileName = basename(componentPath, '.ts');
  return join(dir, `${fileName}.test.ts`);
}

function validateComponentHasTest(componentPath: string): Violation | null {
  const testPath = getTestPath(componentPath);

  // Check if test file exists in the working directory
  if (!existsSync(testPath)) {
    // Check if it's in the staged files
    try {
      execSync(`git diff --cached --name-only | grep -q "${basename(testPath)}"`, {
        encoding: 'utf-8',
        timeout: CONFIG.timeoutMs,
      });
      // If grep succeeds, the test file is staged
      return null;
    } catch {
      // Test file doesn't exist and isn't staged
      const componentName = basename(componentPath, '.ts');
      return {
        file: componentPath,
        message: `Component ${componentName} is missing a test file`,
        suggestion: `Create ${testPath} with tests for this component`,
        severity: 'critical',
      };
    }
  }

  // Test file exists
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateComponentTests(): Promise<ValidationResult> {
  const componentFiles = getStagedComponentFiles();

  if (componentFiles.length === 0) {
    return {
      passed: true,
      violations: [],
      stats: {
        componentsChecked: 0,
        missingTests: 0,
        validTests: 0,
      },
    };
  }

  const violations: Violation[] = [];
  let missingTests = 0;
  let validTests = 0;

  for (const file of componentFiles) {
    const violation = validateComponentHasTest(file);
    if (violation) {
      violations.push(violation);
      missingTests++;
    } else {
      validTests++;
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    stats: {
      componentsChecked: componentFiles.length,
      missingTests,
      validTests,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatOutput(result: ValidationResult): void {
  console.log('\n[HOOK] component-test-required (H10)');
  console.log('━'.repeat(60));

  if (result.stats.componentsChecked === 0) {
    console.log('\n[INFO] No component files staged for commit');
    console.log('[PASS] No test violations found\n');
    return;
  }

  console.log(
    `\n[INFO] Checked ${result.stats.componentsChecked} component(s): ${result.stats.validTests} with tests, ${result.stats.missingTests} missing`,
  );

  if (result.passed) {
    console.log('[PASS] All components have test files\n');
    return;
  }

  console.log(`\n[FAIL] ${result.violations.length} component(s) missing tests\n`);

  for (const v of result.violations) {
    console.log(`❌ ${v.message}`);
    console.log(`   File: ${v.file}`);
    console.log(`   💡 ${v.suggestion}\n`);
  }

  console.log('─'.repeat(60));
  console.log('Every component must have tests for:');
  console.log('  • Rendering and properties');
  console.log('  • Events and interactions');
  console.log('  • Accessibility (WCAG 2.1 AA)');
  console.log('  • 80%+ code coverage');
  console.log('\nTest template: packages/hx-library/src/components/hx-button/hx-button.test.ts');
  console.log('Test utilities: packages/hx-library/src/test-utils.ts');
  console.log('─'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const result = await validateComponentTests();
    formatOutput(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('\n[ERROR] Hook execution failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
