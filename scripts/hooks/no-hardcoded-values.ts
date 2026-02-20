#!/usr/bin/env tsx
/**
 * Hook: no-hardcoded-values (H02)
 *
 * Prevents hardcoded design values in component files.
 * Execution budget: <2 seconds
 *
 * Catches:
 * @design-system-approved: H02-DOC Documentation examples in JSDoc
 * - Hex colors not from design tokens (#FF0000, #000)
 * - Hardcoded pixel/rem values for spacing/sizing (16px, 1.5rem)
 * - Font-family strings not using design tokens
 * - Z-index numbers outside approved scale (0, 10, 20, ..., 100)
 * - Raw color names (color: red, background: blue)
 *
 * Allows:
 * - Design tokens: var(--hx-color-primary), var(--hx-spacing-md)
 * - Zero values: 0, 0px
 * - Percentage values: 100%, 50%
 * - Unitless numbers for line-height, flex, opacity
 * - Approved exceptions: // @design-system-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/no-hardcoded-values.ts
 *   tsx scripts/hooks/no-hardcoded-values.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:no-hardcoded-values
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

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
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files to check (only staged files)
  includePatterns: ['.css', '.ts', '.tsx', '.styles.ts'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/test-utils.ts',
    '**/*.d.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Approval mechanism for exceptional cases
  approvalComment: '@design-system-approved',

  // Approved z-index scale (0, 10, 20, ..., 100)
  approvedZIndexScale: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],

  // CSS properties that commonly use spacing values
  spacingProperties: [
    'padding',
    'margin',
    'gap',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'top',
    'right',
    'bottom',
    'left',
    'inset',
  ] as const,

  // Properties that can have unitless numeric values
  unitlessProperties: new Set([
    'line-height',
    'opacity',
    'flex',
    'flex-grow',
    'flex-shrink',
    'order',
    'z-index',
    'font-weight',
    'zoom',
    'animation-iteration-count',
    'column-count',
    'columns',
    'grid-column',
    'grid-row',
    'tab-size',
  ]),

  // CSS color keywords
  colorKeywords: new Set([
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
    'pink',
    'brown',
    'gray',
    'grey',
    'black',
    'white',
    'cyan',
    'magenta',
    'lime',
    'navy',
    'teal',
    'olive',
    'maroon',
    'silver',
    'aqua',
    'fuchsia',
  ]),

  // Performance: timeout
  timeoutMs: 2000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Get list of staged files for checking
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) =>
        CONFIG.includePatterns.some((pattern) => file.includes(pattern) || file.endsWith(pattern)),
      )
      .filter(
        (file) =>
          !CONFIG.excludePatterns.some((pattern) => {
            const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(regex).test(file);
          }),
      )
      .filter((file) => existsSync(file));
  } catch (error) {
    console.error('Failed to get staged files:', error);
    return [];
  }
}

/**
 * Check if a line has an approval comment above it or inline
 */
function hasApprovalComment(lines: string[], lineIndex: number): boolean {
  // Check current line for inline comment
  const currentLine = lines[lineIndex];
  if (currentLine?.includes(CONFIG.approvalComment)) {
    return true;
  }

  // Check up to 5 lines above for approval comment
  for (let i = Math.max(0, lineIndex - 5); i < lineIndex; i++) {
    const line = lines[i];
    if (line?.includes(CONFIG.approvalComment)) {
      return true;
    }
  }

  return false;
}

/**
 * Format violation for console output
 */
function formatViolation(violation: Violation): string {
  const icon = violation.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
  const location = `${violation.file}:${violation.line}:${violation.column}`;

  return `${icon} ${location}
   ${violation.message}
   ${violation.suggestion}${violation.code ? `\n   ${violation.code}` : ''}`;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check for hardcoded hex colors
 */
function checkHexColors(
  file: string,
  content: string,
  lines: string[],
  violations: Violation[],
): void {
  // @design-system-approved: H02-DOC Documentation examples in code comments
  // Match hex colors: #FFF, #FFFFFF, #fff, #ffffff
  const hexColorPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

  lines.forEach((line, index) => {
    // Skip if line is inside var() or has approval
    if (line.includes('var(--') || hasApprovalComment(lines, index)) {
      return;
    }

    let match;
    while ((match = hexColorPattern.exec(line)) !== null) {
      violations.push({
        file,
        line: index + 1,
        column: match.index + 1,
        message: `Hardcoded hex color: ${match[0]}`,
        suggestion: 'Use design token: var(--hx-color-primary-500) or var(--hx-color-neutral-*)',
        code: line.trim().substring(0, 80),
        severity: 'critical',
      });
    }
  });
}

/**
 * Check for hardcoded spacing/sizing values
 */
function checkHardcodedSpacing(
  file: string,
  content: string,
  lines: string[],
  violations: Violation[],
): void {
  // Match px/rem values but not 0px, 0rem, or inside var()
  // Build regex from CONFIG.spacingProperties array for maintainability
  const spacingPattern = new RegExp(`(?:${CONFIG.spacingProperties.join('|')}):\\s*([^;{]*)`, 'gi');

  lines.forEach((line, index) => {
    // Skip if approved or inside var()
    if (hasApprovalComment(lines, index)) {
      return;
    }

    let match;
    while ((match = spacingPattern.exec(line)) !== null) {
      const value = match[1];
      const baseColumn = (match.index ?? 0) + (match[0]?.length ?? 0) - (value?.length ?? 0);

      // Skip if it's a CSS variable
      if (value?.includes('var(--')) {
        continue;
      }

      // Check for hardcoded pixel values (not 0px)
      const pxPattern = /\b([1-9]\d*(?:\.\d+)?px)\b/g;
      let pxMatch;
      while ((pxMatch = pxPattern.exec(value ?? '')) !== null) {
        violations.push({
          file,
          line: index + 1,
          column: baseColumn + (pxMatch.index ?? 0) + 1,
          message: `Hardcoded spacing value: ${pxMatch[0]}`,
          suggestion:
            'Use design token: var(--hx-space-*) or var(--hx-size-*) for sizing, var(--hx-spacing-*) for padding/margin',
          code: line.trim().substring(0, 80),
          severity: 'critical',
        });
      }

      // Check for hardcoded rem values (not 0rem)
      const remPattern = /\b([1-9]\d*(?:\.\d+)?rem)\b/g;
      let remMatch;
      while ((remMatch = remPattern.exec(value ?? '')) !== null) {
        violations.push({
          file,
          line: index + 1,
          column: baseColumn + (remMatch.index ?? 0) + 1,
          message: `Hardcoded spacing value: ${remMatch[0]}`,
          suggestion:
            'Use design token: var(--hx-space-*) or var(--hx-size-*) for sizing, var(--hx-spacing-*) for padding/margin',
          code: line.trim().substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });
}

/**
 * Check for hardcoded font-family strings
 */
function checkFontFamily(
  file: string,
  content: string,
  lines: string[],
  violations: Violation[],
): void {
  // Match font-family declarations with quoted strings
  const fontFamilyPattern = /font-family:\s*([^;{]+)/gi;

  lines.forEach((line, index) => {
    // Skip if approved
    if (hasApprovalComment(lines, index)) {
      return;
    }

    let match;
    while ((match = fontFamilyPattern.exec(line)) !== null) {
      const value = match[1];

      // Skip if it's a CSS variable
      if (value?.includes('var(--')) {
        continue;
      }

      // Check for quoted font names
      if (value?.includes("'") || value?.includes('"')) {
        violations.push({
          file,
          line: index + 1,
          column: (match.index ?? 0) + 1,
          message: `Hardcoded font-family: ${value.trim()}`,
          suggestion: 'Use design token: var(--hx-font-family-sans) or var(--hx-font-family-mono)',
          code: line.trim().substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });
}

/**
 * Check for z-index values outside approved scale
 */
function checkZIndex(
  file: string,
  content: string,
  lines: string[],
  violations: Violation[],
): void {
  const zIndexPattern = /z-index:\s*(-?\d+)/gi;

  lines.forEach((line, index) => {
    // Skip if approved
    if (hasApprovalComment(lines, index)) {
      return;
    }

    let match;
    while ((match = zIndexPattern.exec(line)) !== null) {
      const value = parseInt(match[1] ?? '0', 10);

      // Check if value is in approved scale
      if (!CONFIG.approvedZIndexScale.includes(value)) {
        violations.push({
          file,
          line: index + 1,
          column: (match.index ?? 0) + 1,
          message: `Z-index value ${value} not in approved scale`,
          suggestion: `Use approved scale: ${CONFIG.approvedZIndexScale.join(', ')}`,
          code: line.trim().substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });
}

/**
 * Check for raw color keywords
 */
function checkColorKeywords(
  file: string,
  content: string,
  lines: string[],
  violations: Violation[],
): void {
  // Match color properties
  const colorPattern = /(?:color|background|background-color|border-color):\s*([^;{]+)/gi;

  lines.forEach((line, index) => {
    // Skip if approved or inside var()
    if (hasApprovalComment(lines, index)) {
      return;
    }

    let match;
    while ((match = colorPattern.exec(line)) !== null) {
      const value = match[1]?.trim().toLowerCase() ?? '';

      // Skip if it's a CSS variable or transparent or inherit
      if (
        value.includes('var(--') ||
        value === 'transparent' ||
        value === 'inherit' ||
        value === 'currentcolor' ||
        value === 'initial' ||
        value === 'unset'
      ) {
        continue;
      }

      // Check if value contains a color keyword
      for (const keyword of CONFIG.colorKeywords) {
        // Match whole word only (e.g., don't match "red" in "fred")
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        const keywordMatch = regex.exec(value);
        if (keywordMatch) {
          // Calculate column: base position of match + offset to value + position within value
          const baseColumn = (match.index ?? 0) + (match[0]?.length ?? 0) - (value?.length ?? 0);
          const column = baseColumn + (keywordMatch.index ?? 0) + 1;

          violations.push({
            file,
            line: index + 1,
            column,
            message: `Hardcoded color keyword: ${keyword}`,
            suggestion:
              'Use design token: var(--hx-color-primary-*), var(--hx-color-neutral-*), or var(--hx-color-error-*)',
            code: line.trim().substring(0, 80),
            severity: 'critical',
          });
          break; // Only report first match per line
        }
      }
    }
  });
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  readFile: (path: string) => readFileSync(path, 'utf-8'),
};

// ─── Main Validation ──────────────────────────────────────────────────────

export async function validateNoHardcodedValues(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const stagedFiles = deps.getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('No files staged for commit');
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
    console.log(`Checking ${stagedFiles.length} file(s) for hardcoded design values...`);
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
      // Inject critical violation to block commit on timeout
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Hook timeout reached (${CONFIG.timeoutMs}ms). Unable to verify all files for hardcoded values.`,
        suggestion: 'Reduce the number of staged files or increase timeout in hook configuration.',
        code: '',
        severity: 'critical',
      });
      break;
    }

    try {
      const content = deps.readFile(filePath);
      const lines = content.split('\n');

      // Run all checks
      checkHexColors(filePath, content, lines, violations);
      checkHardcodedSpacing(filePath, content, lines, violations);
      checkFontFamily(filePath, content, lines, violations);
      checkZIndex(filePath, content, lines, violations);
      checkColorKeywords(filePath, content, lines, violations);
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
  const startTime = Date.now();

  if (!outputJson) {
    console.log('Design System Hook: no-hardcoded-values (H02)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateNoHardcodedValues(defaultDeps, outputJson);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          hook_id: 'H02',
          hook_name: 'no-hardcoded-values',
          timestamp: new Date().toISOString(),
          executionTime: Date.now() - startTime,
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
    console.log('[PASS] No hardcoded values found');
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
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[BLOCKED] Commit blocked due to critical violations');
    console.log('');
    console.log('Design Token Reference:');
    console.log('   Colors: var(--hx-color-primary-500), var(--hx-color-neutral-*)');
    console.log('   Spacing: var(--hx-space-1) to var(--hx-space-12)');
    console.log('   Sizing: var(--hx-size-8), var(--hx-size-10), etc.');
    console.log('   Typography: var(--hx-font-family-sans), var(--hx-font-size-md)');
    console.log('   Z-index: Use approved scale: 0, 10, 20, ..., 100');
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
  checkHexColors,
  checkHardcodedSpacing,
  checkFontFamily,
  checkZIndex,
  checkColorKeywords,
  hasApprovalComment,
};

export type { Violation, ValidationResult, HookDependencies };
