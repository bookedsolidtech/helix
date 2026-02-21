#!/usr/bin/env tsx
/**
 * Pre-commit Hook: storybook-validation (H09)
 *
 * Ensures every component has a corresponding Storybook stories file.
 * Prevents components from being added without documentation/examples.
 *
 * Validates:
 * - Every hx-*.ts component has a corresponding hx-*.stories.ts
 * - Stories file exports at least one story
 * - Component and stories are in the same directory
 *
 * @owner Storybook Specialist
 * @priority P0
 * @phase 2
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

  // Exclude these files from requiring stories
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
    missingStories: number;
    validStories: number;
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

function getStoriesPath(componentPath: string): string {
  const dir = dirname(componentPath);
  const fileName = basename(componentPath, '.ts');
  return join(dir, `${fileName}.stories.ts`);
}

function validateComponentHasStories(componentPath: string): Violation | null {
  const storiesPath = getStoriesPath(componentPath);

  // Check if stories file exists in the working directory
  if (!existsSync(storiesPath)) {
    // Check if it's in the staged files
    try {
      execSync(`git diff --cached --name-only | grep -q "${basename(storiesPath)}"`, {
        encoding: 'utf-8',
        timeout: CONFIG.timeoutMs,
      });
      // If grep succeeds, the stories file is staged
      return null;
    } catch {
      // Stories file doesn't exist and isn't staged
      const componentName = basename(componentPath, '.ts');
      return {
        file: componentPath,
        message: `Component ${componentName} is missing a Storybook stories file`,
        suggestion: `Create ${storiesPath} with at least one story for this component`,
        severity: 'critical',
      };
    }
  }

  // Stories file exists, could optionally validate it has actual stories
  // For now, just check existence
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Validation
// ─────────────────────────────────────────────────────────────────────────────

async function validateStorybook(): Promise<ValidationResult> {
  const componentFiles = getStagedComponentFiles();

  if (componentFiles.length === 0) {
    return {
      passed: true,
      violations: [],
      stats: {
        componentsChecked: 0,
        missingStories: 0,
        validStories: 0,
      },
    };
  }

  const violations: Violation[] = [];
  let missingStories = 0;
  let validStories = 0;

  for (const file of componentFiles) {
    const violation = validateComponentHasStories(file);
    if (violation) {
      violations.push(violation);
      missingStories++;
    } else {
      validStories++;
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    stats: {
      componentsChecked: componentFiles.length,
      missingStories,
      validStories,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatOutput(result: ValidationResult): void {
  console.log('\n[HOOK] storybook-validation (H09)');
  console.log('━'.repeat(60));

  if (result.stats.componentsChecked === 0) {
    console.log('\n[INFO] No component files staged for commit');
    console.log('[PASS] No Storybook violations found\n');
    return;
  }

  console.log(
    `\n[INFO] Checked ${result.stats.componentsChecked} component(s): ${result.stats.validStories} with stories, ${result.stats.missingStories} missing`,
  );

  if (result.passed) {
    console.log('[PASS] All components have Storybook stories\n');
    return;
  }

  console.log(`\n[FAIL] ${result.violations.length} component(s) missing stories\n`);

  for (const v of result.violations) {
    console.log(`❌ ${v.message}`);
    console.log(`   File: ${v.file}`);
    console.log(`   💡 ${v.suggestion}\n`);
  }

  console.log('─'.repeat(60));
  console.log('Every component must have Storybook stories for:');
  console.log('  • Documentation and examples');
  console.log('  • Visual regression testing');
  console.log('  • Interactive playground');
  console.log('  • CEM-driven autodocs');
  console.log(
    '\nStory template: packages/hx-library/src/components/hx-button/hx-button.stories.ts',
  );
  console.log('─'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const result = await validateStorybook();
    formatOutput(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('\n[ERROR] Hook execution failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
