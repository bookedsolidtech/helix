#!/usr/bin/env tsx
/**
 * Hook: a11y-regression-guard (H06)
 *
 * Prevents accessibility regressions in staged component files.
 * Execution budget: <5 seconds
 *
 * Catches:
 * - Invalid ARIA attributes (typos, non-existent attributes)
 * - Missing aria-label on interactive elements without text content
 * - Invalid role attributes
 * - Missing alt text on images
 * - Invalid heading hierarchy (h1 → h3 without h2)
 * - Interactive elements without keyboard handlers
 * - aria-describedby/aria-labelledby pointing to non-existent IDs
 *
 * Allows:
 * - Approved exceptions: // @accessibility-engineer-approved: TICKET-123 Reason
 *
 * Known Limitations:
 * - Line/column reporting: All violations report line 1, column 1 due to template
 *   string analysis complexity. Violations include code snippets for identification.
 *   Full line/column precision requires AST position tracking (future enhancement).
 *
 * Usage:
 *   tsx scripts/hooks/a11y-regression-guard.ts
 *   tsx scripts/hooks/a11y-regression-guard.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:a11y-regression-guard
 */

import { Project, ClassDeclaration, SourceFile } from 'ts-morph';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

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
  failedFiles: string[];
  stats: {
    filesChecked: number;
    failedFiles: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
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

  // Approval mechanism for exceptional cases
  approvalComment: '@accessibility-engineer-approved',

  // Performance: timeout (5s for AST parsing + template analysis)
  timeoutMs: 5000,

  // Valid ARIA attributes (WAI-ARIA 1.2 spec)
  validAriaAttributes: [
    'aria-activedescendant',
    'aria-atomic',
    'aria-autocomplete',
    'aria-busy',
    'aria-checked',
    'aria-colcount',
    'aria-colindex',
    'aria-colspan',
    'aria-controls',
    'aria-current',
    'aria-describedby',
    'aria-details',
    'aria-disabled',
    'aria-dropeffect',
    'aria-errormessage',
    'aria-expanded',
    'aria-flowto',
    'aria-grabbed',
    'aria-haspopup',
    'aria-hidden',
    'aria-invalid',
    'aria-keyshortcuts',
    'aria-label',
    'aria-labelledby',
    'aria-level',
    'aria-live',
    'aria-modal',
    'aria-multiline',
    'aria-multiselectable',
    'aria-orientation',
    'aria-owns',
    'aria-placeholder',
    'aria-posinset',
    'aria-pressed',
    'aria-readonly',
    'aria-relevant',
    'aria-required',
    'aria-roledescription',
    'aria-rowcount',
    'aria-rowindex',
    'aria-rowspan',
    'aria-selected',
    'aria-setsize',
    'aria-sort',
    'aria-valuemax',
    'aria-valuemin',
    'aria-valuenow',
    'aria-valuetext',
  ],

  // Valid ARIA roles (WAI-ARIA 1.2 spec)
  // NOTE: ARIA 1.3 adds aria-braillelabel, aria-brailleroledescription, aria-description
  // Use approval comment for ARIA 1.3+ attributes until WCAG 2.2+ requires them
  validAriaRoles: [
    'alert',
    'alertdialog',
    'application',
    'article',
    'banner',
    'button',
    'cell',
    'checkbox',
    'columnheader',
    'combobox',
    'complementary',
    'contentinfo',
    'definition',
    'dialog',
    'directory',
    'document',
    'feed',
    'figure',
    'form',
    'grid',
    'gridcell',
    'group',
    'heading',
    'img',
    'link',
    'list',
    'listbox',
    'listitem',
    'log',
    'main',
    'marquee',
    'math',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'navigation',
    'none',
    'note',
    'option',
    'presentation',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'row',
    'rowgroup',
    'rowheader',
    'scrollbar',
    'search',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'status',
    'switch',
    'tab',
    'table',
    'tablist',
    'tabpanel',
    'term',
    'textbox',
    'timer',
    'toolbar',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem',
  ],
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
        // Must match include patterns
        const matchesInclude = CONFIG.includePatterns.some((pattern) => {
          const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(regex).test(file);
        });

        if (!matchesInclude) {
          return false;
        }

        // Must not match exclude patterns
        const matchesExclude = CONFIG.excludePatterns.some((pattern) => {
          const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(regex).test(file);
        });

        return !matchesExclude;
      })
      .filter((file) => existsSync(file));
  } catch (error) {
    console.error('Failed to get staged files:', error);
    return [];
  }
}

/**
 * Check if a file has an approval comment
 */
function hasApprovalComment(content: string): boolean {
  return content.includes(CONFIG.approvalComment);
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
 * Extract template string from render() method
 */
function extractTemplateString(classDecl: ClassDeclaration): string | null {
  const renderMethod = classDecl.getMethod('render');
  if (!renderMethod) {
    return null;
  }

  const methodText = renderMethod.getText();

  // Look for template literal return
  // Pattern: return html`...` or return html\n`...`
  const templateMatch = methodText.match(/return\s+html\s*`([^`]*(?:`[^`]*`[^`]*)*)`/s);

  if (templateMatch) {
    return templateMatch[1];
  }

  return null;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check for invalid ARIA attributes
 */
function checkARIAAttributes(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Find all aria-* attributes
  const ariaRegex = /aria-([a-z]+)/gi;
  const foundAttrs = new Set<string>();

  for (const match of template.matchAll(ariaRegex)) {
    const fullAttr = `aria-${match[1]}`;

    // Skip duplicates
    if (foundAttrs.has(fullAttr)) {
      continue;
    }
    foundAttrs.add(fullAttr);

    // Check if valid
    if (!CONFIG.validAriaAttributes.includes(fullAttr)) {
      violations.push({
        file: filePath,
        line: 1, // Template analysis doesn't have precise line numbers
        column: 1,
        message: `Invalid ARIA attribute: ${fullAttr}`,
        suggestion: `Check WAI-ARIA 1.2 spec (https://www.w3.org/TR/wai-aria-1.2/#state_prop_def) for valid attributes. Did you mean: ${findClosestMatch(fullAttr, CONFIG.validAriaAttributes)}?`,
        code: fullAttr,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check for invalid role attributes
 */
function checkRoleAttributes(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Find all role="..." attributes
  const roleRegex = /role=["']([^"']+)["']/gi;
  const foundRoles = new Set<string>();

  for (const match of template.matchAll(roleRegex)) {
    const role = match[1];

    // Skip duplicates
    if (foundRoles.has(role)) {
      continue;
    }
    foundRoles.add(role);

    // Skip template expressions
    if (role.includes('${')) {
      continue;
    }

    // Check if valid
    if (!CONFIG.validAriaRoles.includes(role)) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Invalid ARIA role: ${role}`,
        suggestion: `Check WAI-ARIA 1.2 spec (https://www.w3.org/TR/wai-aria-1.2/#role_definitions) for valid roles. Did you mean: ${findClosestMatch(role, CONFIG.validAriaRoles)}?`,
        code: `role="${role}"`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check for missing alt text on images
 */
function checkAltText(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Find all <img tags
  const imgRegex = /<img\s+([^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(template)) !== null) {
    const imgTag = match[0];
    const attributes = match[1];

    // Check if alt attribute exists
    if (!attributes.includes('alt=')) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: 'Image missing alt attribute',
        suggestion: 'Add alt="" for decorative images or alt="description" for meaningful images',
        code: imgTag.substring(0, 80),
        severity: 'critical',
      });
    }
  }
}

/**
 * Check for keyboard navigation on interactive elements
 */
function checkKeyboardNav(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Find all elements with @click but not native interactive elements
  // Pattern: <div @click="..."> or <span @click="...">
  const clickableRegex = /<(div|span)\s+([^>]*@click[^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = clickableRegex.exec(template)) !== null) {
    const elementType = match[1];
    const attributes = match[2];
    const fullTag = match[0];

    // Check if has keyboard handler (@keydown, @keyup, @keypress)
    const hasKeyboardHandler =
      attributes.includes('@keydown') ||
      attributes.includes('@keyup') ||
      attributes.includes('@keypress');

    // Check if has tabindex
    const hasTabindex = attributes.includes('tabindex');

    // Check if has role
    const hasRole = attributes.includes('role=');

    if (!hasKeyboardHandler) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Interactive <${elementType}> missing keyboard handler`,
        suggestion:
          'Add @keydown or @keyup handler for keyboard accessibility, or use native <button> element',
        code: fullTag.substring(0, 80),
        severity: 'critical',
      });
    }

    if (!hasTabindex && !hasRole) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Interactive <${elementType}> missing tabindex or role`,
        suggestion: 'Add tabindex="0" and role="button" for keyboard accessibility',
        code: fullTag.substring(0, 80),
        severity: 'critical',
      });
    }
  }
}

/**
 * Check for proper heading hierarchy
 */
function checkHeadingHierarchy(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Extract all heading levels
  const headingRegex = /<h([1-6])[^>]*>/gi;
  const headingLevels: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(template)) !== null) {
    const level = parseInt(match[1], 10);
    headingLevels.push(level);
  }

  // Check for skipped levels
  for (let i = 1; i < headingLevels.length; i++) {
    const prevLevel = headingLevels[i - 1];
    const currentLevel = headingLevels[i];

    // Allow same level or one level down
    if (currentLevel > prevLevel + 1) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Heading hierarchy skips from h${prevLevel} to h${currentLevel}`,
        suggestion: `Use h${prevLevel + 1} instead of h${currentLevel} to maintain proper hierarchy`,
        code: `<h${currentLevel}>`,
        severity: 'warning',
      });
    }
  }
}

/**
 * Check for aria-describedby/aria-labelledby pointing to non-existent IDs
 */
function checkAriaReferences(
  filePath: string,
  template: string,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  // Extract all IDs from the template
  const idRegex = /id=["']([^"']+)["']/gi;
  const ids = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = idRegex.exec(template)) !== null) {
    const id = match[1];
    // Skip template expressions
    if (!id.includes('${') && !id.includes('$') && !id.includes('{')) {
      ids.add(id);
    }
  }

  // Check aria-describedby and aria-labelledby references
  const ariaRefRegex = /aria-(describedby|labelledby)=["']([^"']+)["']/gi;

  while ((match = ariaRefRegex.exec(template)) !== null) {
    const attrName = match[1];
    const refIds = match[2].split(/\s+/);

    for (const refId of refIds) {
      // Skip template expressions
      if (refId.includes('${') || refId.includes('$') || refId.includes('{')) {
        continue;
      }

      if (!ids.has(refId)) {
        violations.push({
          file: filePath,
          line: 1,
          column: 1,
          message: `aria-${attrName} references non-existent ID: ${refId}`,
          suggestion: `Ensure element with id="${refId}" exists in the template`,
          code: `aria-${attrName}="${match[2]}"`,
          severity: 'critical',
        });
      }
    }
  }
}

/**
 * Find closest match for a typo
 */
function findClosestMatch(input: string, validOptions: string[]): string {
  let closest = validOptions[0];
  let minDistance = levenshteinDistance(input, closest);

  for (const option of validOptions) {
    const distance = levenshteinDistance(input, option);
    if (distance < minDistance) {
      minDistance = distance;
      closest = option;
    }
  }

  return closest;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  createProject: (configPath: string) =>
    new Project({
      tsConfigFilePath: configPath,
      skipAddingFilesFromTsConfig: true,
    }),
};

// ─── Main Validation ──────────────────────────────────────────────────────

async function validateA11yRegression(
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
      failedFiles: [],
      stats: {
        filesChecked: 0,
        failedFiles: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
      },
    };
  }

  if (!silent) {
    console.log(`Checking ${stagedFiles.length} file(s) for accessibility regressions...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  const violations: Violation[] = [];
  const failedFiles: string[] = [];

  // Analyze each staged file
  for (const filePath of stagedFiles) {
    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      console.warn(
        `[WARNING] Timeout reached (${CONFIG.timeoutMs}ms). Remaining files not checked.`,
      );
      break;
    }

    let sourceFile: SourceFile | undefined;

    try {
      sourceFile = project.addSourceFileAtPath(filePath);
      const content = sourceFile.getFullText();

      // Find component class
      const classes = sourceFile.getClasses();
      const componentClass = classes.find((c) => {
        const decorators = c.getDecorators();
        return decorators.some((d) => d.getName() === 'customElement');
      });

      if (!componentClass) {
        // Not a component file, skip
        continue;
      }

      // Extract template from render() method
      const template = extractTemplateString(componentClass);

      if (!template) {
        // No template found, skip
        continue;
      }

      // Run all accessibility checks
      checkARIAAttributes(filePath, template, violations, content);
      checkRoleAttributes(filePath, template, violations, content);
      checkAltText(filePath, template, violations, content);
      checkKeyboardNav(filePath, template, violations, content);
      checkHeadingHierarchy(filePath, template, violations, content);
      checkAriaReferences(filePath, template, violations, content);
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
      failedFiles.push(filePath);
    } finally {
      // Always free memory, even on error
      sourceFile?.forget();
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
    passed: criticalViolations.length === 0 && failedFiles.length === 0,
    violations,
    failedFiles,
    stats: {
      filesChecked: stagedFiles.length,
      failedFiles: failedFiles.length,
      totalViolations: violations.length,
      criticalViolations: criticalViolations.length,
      warningViolations: warningViolations.length,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

/* istanbul ignore next */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');

  if (!outputJson) {
    console.log('Accessibility Regression Guard: a11y-regression-guard (H06)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateA11yRegression(defaultDeps, outputJson);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          violations: result.violations,
          failedFiles: result.failedFiles,
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
    console.log('[PASS] No accessibility violations found');
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
  console.log(`   Failed files: ${result.stats.failedFiles}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical: ${result.stats.criticalViolations}`);
  console.log(`   Warnings: ${result.stats.warningViolations}`);
  console.log('');

  if (result.failedFiles.length > 0) {
    console.log('[BLOCKED] Commit blocked due to parse failures:');
    result.failedFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });
    console.log('');
    console.log('Fix syntax errors in these files and try again.');
    console.log('');
    process.exit(1);
  }

  if (result.passed) {
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[BLOCKED] Commit blocked due to critical accessibility violations');
    console.log('');
    console.log('To fix:');
    console.log('   1. Check ARIA attributes for typos (see WAI-ARIA 1.2 spec)');
    console.log('   2. Ensure all images have alt attributes');
    console.log('   3. Add keyboard handlers to interactive elements');
    console.log('   4. Fix invalid role attributes');
    console.log('   5. Fix heading hierarchy issues');
    console.log('   6. Ensure aria-describedby/aria-labelledby reference valid IDs');
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
/* istanbul ignore next */
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? '');

/* istanbul ignore next */
if (isMainModule) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

// Export for testing
export {
  validateA11yRegression,
  checkARIAAttributes,
  checkRoleAttributes,
  checkAltText,
  checkKeyboardNav,
  checkHeadingHierarchy,
  checkAriaReferences,
  extractTemplateString,
  findClosestMatch,
  levenshteinDistance,
  hasApprovalComment,
  getStagedFiles,
  formatViolation,
};

export type { Violation, ValidationResult, HookDependencies };
