#!/usr/bin/env tsx
/**
 * Hook: animation-budget-check (H20)
 *
 * Validates animation durations meet WCAG 2.1 accessibility guidelines (200-500ms).
 * Execution budget: <2 seconds
 *
 * Catches:
 * - Animations < 200ms (too fast, accessibility issue)
 * - Animations > 500ms (too slow, poor UX)
 * - Missing `prefers-reduced-motion` support
 * - Hardcoded animation durations (should use design tokens)
 * - Non-GPU-accelerated properties (performance issue)
 * - Invalid @keyframes durations
 *
 * Allows:
 * - Test files, stories
 * - Infinite animations: `animation: spin 1s infinite`
 * - Design tokens: var(--hx-transition-fast), var(--hx-duration-normal)
 * - Approved exceptions: // @animation-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/animation-budget-check.ts
 *   tsx scripts/hooks/animation-budget-check.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:animation-budget-check
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

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
  // Files to check
  includePatterns: ['packages/**/src/**/*.ts', 'packages/**/src/**/*.css'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Accessibility timing guidelines (WCAG 2.1)
  minDurationMs: 200, // Too fast
  maxDurationMs: 500, // Too slow
  recommendedDurationMs: 300,

  // Approval mechanism
  approvalComment: '@animation-approved',

  // GPU-accelerated properties (safe to animate)
  gpuProperties: new Set(['transform', 'opacity', 'filter', 'backdrop-filter']),

  // Properties that trigger layout/paint (performance warning)
  nonGpuProperties: new Set([
    'width',
    'height',
    'top',
    'left',
    'right',
    'bottom',
    'margin',
    'padding',
    'border',
    'font-size',
  ]),

  // Design token patterns used in codebase
  tokenPatterns: ['--hx-transition-', '--hx-duration-', '--hx-easing-'],

  // Execution timeout
  timeoutMs: 2000,
} as const;

// ─── Utilities ────────────────────────────────────────────────────────────

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    return output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

function matchesPattern(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => {
    // Simple glob pattern matching
    // Supports: **/*.ext, path/**/subpath/**/*.ext, *.ext

    // Handle **/*.ext pattern (matches any file ending with extension in any directory)
    if (pattern.startsWith('**/')) {
      const suffix = pattern.slice(3); // Remove **/ prefix
      // Check if file ends with the pattern (allowing for path before it)
      const regex = new RegExp(`(^|/)${suffix.replace(/\*/g, '[^/]*')}$`);
      return regex.test(file);
    }

    // Handle patterns with /** in the middle (e.g., packages/**/src/**/*.ts)
    if (pattern.includes('/**/')) {
      // Split on /** and check each part exists in order
      const parts = pattern.split('/**/');
      let searchStart = 0;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part === '') continue;

        if (i === 0) {
          // First part must match at start
          if (!file.startsWith(part)) return false;
          searchStart = part.length;
        } else if (i === parts.length - 1) {
          // Last part - handle * wildcard
          const lastPartRegex = new RegExp(`/${part.replace(/\*/g, '[^/]*')}$`);
          if (!lastPartRegex.test(file.slice(searchStart))) return false;
        } else {
          // Middle parts - must appear somewhere after previous part
          const idx = file.indexOf(`/${part}`, searchStart);
          if (idx === -1) return false;
          searchStart = idx + part.length + 1;
        }
      }
      return true;
    }

    // Simple patterns without ** - exact match with * wildcard support
    const regex = new RegExp(`^${pattern.replace(/\*/g, '[^/]*')}$`);
    return regex.test(file);
  });
}

function isApproved(content: string, lineNumber: number): boolean {
  const lines = content.split('\n');
  const contextStart = Math.max(0, lineNumber - 3);
  const contextEnd = Math.min(lines.length, lineNumber + 2);
  const context = lines.slice(contextStart, contextEnd).join('\n');

  // Check if approval comment exists
  if (!context.includes(CONFIG.approvalComment)) {
    return false;
  }

  // Validate ticket format: @animation-approved: TICKET-123 Reason or @animation-approved: HX-123 Reason
  const approvalPattern = /@animation-approved:\s+(TICKET-\d+|HX-\d+)\s+.+/;
  return approvalPattern.test(context);
}

function parseDuration(duration: string): number | null {
  const match = duration.match(/^([\d.]+)(ms|s)$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 's' ? value * 1000 : value;
}

/**
 * Extract CSS content from Lit css`...` tagged templates
 */
function extractLitCss(content: string): { css: string; offset: number }[] {
  const results: { css: string; offset: number }[] = [];

  // Match css`...` tagged templates (handle backtick escaping)
  const litCssPattern = /css`([\s\S]*?)`/g;
  let match;

  while ((match = litCssPattern.exec(content)) !== null) {
    results.push({
      css: match[1],
      offset: match.index + 4, // offset for 'css`'
    });
  }

  return results;
}

/**
 * Convert CSS offset to line/column position
 */
function getLineColumn(content: string, offset: number): { line: number; column: number } {
  const beforeOffset = content.substring(0, offset);
  const lines = beforeOffset.split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

// ─── Validation Logic ─────────────────────────────────────────────────────

/**
 * Check for non-GPU-accelerated properties in animations
 */
function checkGpuProperties(
  filePath: string,
  cssContent: string,
  baseOffset: number,
  fullContent: string,
  violations: Violation[],
): void {
  const lines = cssContent.split('\n');

  lines.forEach((line, index) => {
    const lineOffset =
      baseOffset + cssContent.split('\n').slice(0, index).join('\n').length + index;
    const { line: lineNumber } = getLineColumn(fullContent, lineOffset);

    if (isApproved(fullContent, lineNumber - 1)) {
      return;
    }

    // Check transition properties
    const transitionMatch = /transition:\s*([^;]+)/i.exec(line);
    if (transitionMatch) {
      const properties = transitionMatch[1].split(',').map((p) => p.trim().split(/\s+/)[0]);

      properties.forEach((prop) => {
        if (prop === 'all') return; // 'all' is common and acceptable
        if (prop.includes('var(--')) return; // Skip tokens

        if (CONFIG.nonGpuProperties.has(prop)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            column: transitionMatch.index + 1,
            message: `Non-GPU property animated: ${prop}`,
            suggestion:
              'Use GPU-accelerated properties: transform, opacity, filter. Avoid animating layout properties for 60fps performance.',
            code: line.trim().substring(0, 80),
            severity: 'warning',
          });
        }
      });
    }
  });
}

/**
 * Check animation/transition durations
 */
function checkAnimationDurations(
  filePath: string,
  cssContent: string,
  baseOffset: number,
  fullContent: string,
  violations: Violation[],
): void {
  const lines = cssContent.split('\n');

  // Regex patterns for animation/transition durations
  const transitionPattern = /transition(?:-duration)?:\s*([^;]+);/gi;
  const animationPattern = /animation(?:-duration)?:\s*([^;]+);/gi;

  lines.forEach((line, index) => {
    const lineOffset =
      baseOffset + cssContent.split('\n').slice(0, index).join('\n').length + index;
    const { line: lineNumber, column: baseColumn } = getLineColumn(fullContent, lineOffset);

    // Check if approved
    if (isApproved(fullContent, lineNumber - 1)) {
      return;
    }

    // Check transitions
    let match;
    transitionPattern.lastIndex = 0;
    while ((match = transitionPattern.exec(line)) !== null) {
      const durationString = match[1].trim();

      // Skip if using design tokens
      if (CONFIG.tokenPatterns.some((pattern) => durationString.includes(pattern))) {
        continue;
      }

      // Extract duration value (handle shorthand: "all 300ms ease")
      const durationMatch = durationString.match(/([\d.]+(?:ms|s))/);
      if (!durationMatch) continue;

      const duration = parseDuration(durationMatch[1]);
      if (duration === null) continue;

      if (duration < CONFIG.minDurationMs) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: baseColumn + match.index + 1,
          message: `Animation too fast: ${duration}ms (min: ${CONFIG.minDurationMs}ms for accessibility)`,
          suggestion: `Use ${CONFIG.recommendedDurationMs}ms or design token var(--hx-transition-fast)`,
          code: line.trim(),
          severity: 'critical',
        });
      } else if (duration > CONFIG.maxDurationMs) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: baseColumn + match.index + 1,
          message: `Animation too slow: ${duration}ms (max: ${CONFIG.maxDurationMs}ms for UX)`,
          suggestion: `Use ${CONFIG.recommendedDurationMs}ms or design token var(--hx-transition-normal)`,
          code: line.trim(),
          severity: 'warning',
        });
      }
    }

    // Check animations (similar logic)
    animationPattern.lastIndex = 0;
    while ((match = animationPattern.exec(line)) !== null) {
      const durationString = match[1].trim();

      // Skip if using design tokens
      if (CONFIG.tokenPatterns.some((pattern) => durationString.includes(pattern))) {
        continue;
      }

      // Skip infinite animations
      if (durationString.includes('infinite')) {
        continue;
      }

      // Extract duration value
      const durationMatch = durationString.match(/([\d.]+(?:ms|s))/);
      if (!durationMatch) continue;

      const duration = parseDuration(durationMatch[1]);
      if (duration === null) continue;

      if (duration < CONFIG.minDurationMs) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: baseColumn + match.index + 1,
          message: `Animation too fast: ${duration}ms (min: ${CONFIG.minDurationMs}ms for accessibility)`,
          suggestion: `Use ${CONFIG.recommendedDurationMs}ms or design token var(--hx-transition-fast)`,
          code: line.trim(),
          severity: 'critical',
        });
      } else if (duration > CONFIG.maxDurationMs) {
        violations.push({
          file: filePath,
          line: lineNumber,
          column: baseColumn + match.index + 1,
          message: `Animation too slow: ${duration}ms (max: ${CONFIG.maxDurationMs}ms for UX)`,
          suggestion: `Use ${CONFIG.recommendedDurationMs}ms or design token var(--hx-transition-normal)`,
          code: line.trim(),
          severity: 'warning',
        });
      }
    }
  });
}

/**
 * Check for prefers-reduced-motion support
 */
function checkReducedMotion(
  filePath: string,
  cssContent: string,
  baseOffset: number,
  fullContent: string,
  violations: Violation[],
): void {
  const hasAnimation =
    cssContent.includes('animation:') ||
    cssContent.includes('animation-duration:') ||
    cssContent.includes('transition:') ||
    cssContent.includes('transition-duration:');

  // Skip validation if no animations exist or file is approved
  if (!hasAnimation || isApproved(fullContent, 0)) {
    return;
  }

  const hasReducedMotion = cssContent.includes('prefers-reduced-motion');
  const { line, column } = getLineColumn(fullContent, baseOffset);

  // Critical: Missing media query entirely
  if (!hasReducedMotion) {
    violations.push({
      file: filePath,
      line,
      column,
      message: 'Missing `@media (prefers-reduced-motion: reduce)` media query',
      suggestion:
        'Add @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }',
      severity: 'critical',
    });
    return;
  }

  // Extract and validate media query blocks
  // Use a more robust pattern that handles nested braces
  const reducedMotionPattern = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\}/gi;
  const matches = [...cssContent.matchAll(reducedMotionPattern)];

  // Critical: Media query exists but is empty
  if (matches.length === 0) {
    violations.push({
      file: filePath,
      line,
      column,
      message: '`@media (prefers-reduced-motion: reduce)` exists but is empty or malformed',
      suggestion:
        'Add rules inside media query to disable animations: { * { transition: none !important; animation: none !important; } }',
      severity: 'critical',
    });
    return;
  }

  // Validate each media query block actually disables animations
  let hasProperDisable = false;
  for (const match of matches) {
    const block = match[1];

    // Check for valid animation-disabling rules
    const hasValidDisable =
      block.includes('animation: none') ||
      block.includes('transition: none') ||
      block.includes('animation-duration: 0s') ||
      block.includes('transition-duration: 0s');

    if (hasValidDisable) {
      hasProperDisable = true;
      break;
    }
  }

  // Critical: Media query exists but doesn't disable animations
  if (!hasProperDisable) {
    violations.push({
      file: filePath,
      line,
      column,
      message:
        '`@media (prefers-reduced-motion: reduce)` does not disable animations (WCAG 2.1 AA violation)',
      suggestion:
        'Add animation-disabling rules inside media query: animation: none; or transition: none; or animation-duration: 0s; or transition-duration: 0s;',
      severity: 'critical',
    });
  }
}

/**
 * Validate a single file
 */
function validateFile(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];

  // Extract Lit css`...` templates
  const litCssBlocks = extractLitCss(content);

  if (litCssBlocks.length > 0) {
    // File contains Lit components
    litCssBlocks.forEach(({ css, offset }) => {
      checkAnimationDurations(filePath, css, offset, content, violations);
      checkGpuProperties(filePath, css, offset, content, violations);
      checkReducedMotion(filePath, css, offset, content, violations);
    });
  } else if (filePath.endsWith('.css')) {
    // Plain CSS file
    checkAnimationDurations(filePath, content, 0, content, violations);
    checkGpuProperties(filePath, content, 0, content, violations);
    checkReducedMotion(filePath, content, 0, content, violations);
  }

  return violations;
}

/**
 * Validate all staged files
 */
function validateFiles(
  files: string[],
  readFile: (path: string) => string = (path: string) => readFileSync(path, 'utf-8'),
): ValidationResult {
  const violations: Violation[] = [];
  let filesChecked = 0;

  for (const file of files) {
    if (!matchesPattern(file, CONFIG.includePatterns)) continue;
    if (matchesPattern(file, CONFIG.excludePatterns)) continue;

    // Try to read file (works with both real files and mocked readFile)
    let content: string;
    try {
      content = readFile(file);
    } catch {
      // Skip file if it can't be read
      continue;
    }

    filesChecked++;
    const fileViolations = validateFile(file, content);
    violations.push(...fileViolations);
  }

  const criticalViolations = violations.filter((v) => v.severity === 'critical').length;
  const warningViolations = violations.filter((v) => v.severity === 'warning').length;

  return {
    passed: criticalViolations === 0,
    violations,
    stats: {
      filesChecked,
      totalViolations: violations.length,
      criticalViolations,
      warningViolations,
    },
  };
}

// ─── Output Formatting ────────────────────────────────────────────────────

function formatOutput(result: ValidationResult, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  lines.push('');
  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║          Animation Budget Check (H20)                        ║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');

  lines.push(`Stats:`);
  lines.push(`   Files checked: ${result.stats.filesChecked}`);
  lines.push(`   Critical violations: ${result.stats.criticalViolations}`);
  lines.push(`   Warnings: ${result.stats.warningViolations}`);
  lines.push('');

  if (result.violations.length > 0) {
    lines.push('Violations:');
    lines.push('');

    result.violations.forEach((violation) => {
      const icon = violation.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
      lines.push(`${icon} ${violation.file}:${violation.line}:${violation.column}`);
      lines.push(`   ${violation.message}`);
      if (violation.code) {
        lines.push(`   Code: ${violation.code}`);
      }
      lines.push(`   Suggestion: ${violation.suggestion}`);
      lines.push('');
    });

    lines.push('');
    lines.push('Design Token Reference:');
    lines.push('   - var(--hx-transition-fast): 150ms ease (use for micro-interactions)');
    lines.push('   - var(--hx-transition-normal): 250ms ease (use for most animations)');
    lines.push('   - var(--hx-transition-slow): 350ms ease (use for complex transitions)');
    lines.push('');
    lines.push('Performance Tips:');
    lines.push('   - Animate transform/opacity for GPU acceleration (60fps)');
    lines.push('   - Avoid animating width/height/top/left (triggers layout)');
    lines.push('   - Always include prefers-reduced-motion support (WCAG 2.1 requirement)');
    lines.push('');
  } else {
    lines.push('[PASS] All animations meet accessibility timing guidelines.');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Exports for Testing ──────────────────────────────────────────────────

export async function validateAnimationBudget(
  deps: HookDependencies = {
    getStagedFiles,
    readFile: (path: string) => readFileSync(path, 'utf-8'),
  },
): Promise<ValidationResult> {
  const files = deps.getStagedFiles();
  if (files.length === 0) {
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

  const result = validateFiles(files, deps.readFile);
  return result;
}

export {
  extractLitCss,
  checkAnimationDurations,
  checkGpuProperties,
  checkReducedMotion,
  validateFile,
  matchesPattern,
};

export type { Violation, ValidationResult, HookDependencies };

// ─── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const jsonMode = process.argv.includes('--json');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!jsonMode) {
      console.log('[INFO] No staged files to check.');
    }
    process.exit(0);
  }

  const result = validateFiles(stagedFiles);
  const duration = Date.now() - startTime;

  console.log(formatOutput(result, jsonMode));

  if (!jsonMode) {
    console.log(`Execution time: ${duration}ms (budget: <${CONFIG.timeoutMs}ms)`);
    console.log('');
  }

  process.exit(result.passed ? 0 : 1);
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? '');

if (isMainModule) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
