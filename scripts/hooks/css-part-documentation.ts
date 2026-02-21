#!/usr/bin/env tsx
/**
 * Hook: css-part-documentation (H25)
 *
 * Validates all CSS parts are documented with @csspart JSDoc tags.
 * Execution budget: <2 seconds, timeout: 5 seconds
 *
 * Catches:
 * - CSS parts in Shadow DOM (part="button") not documented with @csspart
 * - Orphaned @csspart tags (documented but not in code)
 * - Missing descriptions for CSS parts
 * - Parts defined but not exposed in template
 *
 * Allows:
 * - Test files, stories, styles
 * - Approved exceptions: // @css-part-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/css-part-documentation.ts
 *   tsx scripts/hooks/css-part-documentation.ts --json
 *   tsx scripts/hooks/css-part-documentation.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:css-part-documentation
 */

import {
  Project,
  Node,
  SourceFile,
  ClassDeclaration,
  JSDoc,
  TemplateExpression,
  NoSubstitutionTemplateLiteral,
  TaggedTemplateExpression,
} from 'ts-morph';
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
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    totalParts: number;
    documentedParts: number;
    coveragePercent: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
}

interface CSSPart {
  name: string;
  line: number;
  column: number;
}

interface PartStats {
  totalParts: number;
  documentedParts: number;
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly approvalCommentSearchDepth: number;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
}

export const CONFIG: HookConfig = {
  // Files to check (only component files)
  includePatterns: ['**/components/**/*.ts'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/test-utils.ts',
    '**/*.d.ts',
    '**/dist/**',
    '**/node_modules/**',
    '**/index.ts', // Re-export files
  ],

  // Approval mechanism for exceptional cases
  approvalComment: '@css-part-approved',

  // Approval comment search depth (check up to N parent nodes)
  approvalCommentSearchDepth: 5,

  // Performance: timeout and budget
  timeoutMs: 5000,
  performanceBudgetMs: 2000, // <2s budget
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Pre-compiled regex cache for performance
 */
const globRegexCache = new Map<string, RegExp>();

/**
 * Convert glob pattern to regex, escaping special regex characters
 */
function globToRegex(pattern: string): RegExp {
  const cached = globRegexCache.get(pattern);
  if (cached !== undefined) {
    return cached;
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§GLOBSTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§GLOBSTAR§/g, '.*');
  const regex = new RegExp(escaped);

  globRegexCache.set(pattern, regex);
  return regex;
}

/**
 * Check if file matches glob patterns
 */
function matchesPatterns(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globToRegex(pattern).test(file));
}

/**
 * Get list of staged component TypeScript files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => matchesPatterns(file, CONFIG.includePatterns))
      .filter((file) => !matchesPatterns(file, CONFIG.excludePatterns))
      .filter((file) => existsSync(file));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Check if a node or its parent has an approval comment
 */
export function hasApprovalComment(node: Node): boolean {
  const leadingComments = node.getLeadingCommentRanges();

  for (const comment of leadingComments) {
    const text = comment.getText();
    if (text.includes(CONFIG.approvalComment)) {
      return true;
    }
  }

  // Check parent nodes (configurable depth to cover class -> export -> module structure)
  let parent = node.getParent();
  let depth = 0;
  while (parent && depth < CONFIG.approvalCommentSearchDepth) {
    const parentComments = parent.getLeadingCommentRanges();
    for (const comment of parentComments) {
      const text = comment.getText();
      if (text.includes(CONFIG.approvalComment)) {
        return true;
      }
    }
    parent = parent.getParent();
    depth++;
  }

  return false;
}

/**
 * Get JSDoc @csspart tags from class declaration
 */
export function getJSDocCSSPartTags(classDecl: ClassDeclaration): Map<string, string> {
  const parts = new Map<string, string>();
  const jsDocs = classDecl.getJsDocs();

  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'csspart') {
        const tagText = tag.getText();
        // Parse @csspart button - The main button element
        const match = tagText.match(/@csspart\s+(\S+)(?:\s+-\s+(.+))?/);
        if (match && match[1]) {
          const partName = match[1];
          const description = match[2] ?? '';
          parts.set(partName, description.trim());
        }
      }
    }
  }

  return parts;
}

/**
 * Extract CSS parts from html`...` template literals using AST
 */
export function extractCSSPartsFromTemplate(sourceFile: SourceFile): CSSPart[] {
  const parts: CSSPart[] = [];
  const partRegex = /part=["']([^"']+)["']/g;

  // Find all tagged template expressions with tag name 'html'
  sourceFile.forEachDescendant((node) => {
    if (Node.isTaggedTemplateExpression(node)) {
      const tag = node.getTag();
      if (tag.getText() === 'html') {
        const template = node.getTemplate();
        let templateText = '';

        // Handle both template expressions and no-substitution literals
        if (Node.isTemplateExpression(template)) {
          templateText = template.getText();
        } else if (Node.isNoSubstitutionTemplateLiteral(template)) {
          templateText = template.getText();
        }

        // Extract part attributes from template text
        let match;
        while ((match = partRegex.exec(templateText)) !== null) {
          const partNames = match[1];
          if (partNames) {
            // Split on whitespace to support space-separated part names
            // e.g., part="button icon" becomes ["button", "icon"]
            const names = partNames.trim().split(/\s+/);
            const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

            for (const partName of names) {
              if (partName) {
                parts.push({
                  name: partName,
                  line,
                  column,
                });
              }
            }
          }
        }
      }
    }
  });

  return parts;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check that all CSS parts in code are documented with @csspart tags
 */
export function checkUndocumentedParts(
  sourceFile: SourceFile,
  codeParts: CSSPart[],
  documentedParts: Map<string, string>,
  violations: Violation[],
): void {
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    return;
  }

  const classDecl = classes[0];
  if (!classDecl) {
    return;
  }

  for (const part of codeParts) {
    if (!documentedParts.has(part.name)) {
      // Check if approved
      if (hasApprovalComment(classDecl)) {
        continue;
      }

      violations.push({
        file: sourceFile.getFilePath(),
        line: part.line,
        column: part.column,
        message: `CSS part "${part.name}" not documented in JSDoc`,
        suggestion: `Add @csspart ${part.name} - Description of the ${part.name} element to class JSDoc`,
        code: `part="${part.name}"`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check for orphaned @csspart tags (documented but not in code)
 */
export function checkOrphanedPartDocumentation(
  sourceFile: SourceFile,
  codeParts: CSSPart[],
  documentedParts: Map<string, string>,
  violations: Violation[],
): void {
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    return;
  }

  const classDecl = classes[0];
  if (!classDecl) {
    return;
  }

  // Skip if there are no code parts (component might not use parts at all)
  if (codeParts.length === 0 && documentedParts.size === 0) {
    return;
  }

  const codePartNames = new Set(codeParts.map((p) => p.name));

  for (const [partName] of documentedParts) {
    if (!codePartNames.has(partName)) {
      // Check if approved
      if (hasApprovalComment(classDecl)) {
        continue;
      }

      const { line, column } = sourceFile.getLineAndColumnAtPos(classDecl.getStart());

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Documented CSS part "${partName}" not found in component template`,
        suggestion: `Remove @csspart ${partName} from JSDoc or add part="${partName}" to template`,
        code: `@csspart ${partName}`,
        severity: 'warning',
      });
    }
  }
}

/**
 * Check that @csspart tags have descriptions
 */
export function checkPartDescriptions(
  sourceFile: SourceFile,
  documentedParts: Map<string, string>,
  violations: Violation[],
): void {
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    return;
  }

  const classDecl = classes[0];
  if (!classDecl) {
    return;
  }

  for (const [partName, description] of documentedParts) {
    if (!description || description.trim().length === 0) {
      // Check if approved
      if (hasApprovalComment(classDecl)) {
        continue;
      }

      const { line, column } = sourceFile.getLineAndColumnAtPos(classDecl.getStart());

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `CSS part "${partName}" missing description in @csspart tag`,
        suggestion: `Add description: @csspart ${partName} - Description of the ${partName} element`,
        code: `@csspart ${partName}`,
        severity: 'warning',
      });
    }
  }
}

/**
 * Check that CSS part names follow lowercase-hyphenated naming convention
 */
export function checkPartNamingConvention(
  sourceFile: SourceFile,
  codeParts: CSSPart[],
  violations: Violation[],
): void {
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    return;
  }

  const classDecl = classes[0];
  if (!classDecl) {
    return;
  }

  // Check if approved
  if (hasApprovalComment(classDecl)) {
    return;
  }

  // Naming convention: lowercase letters, numbers, and hyphens only
  // Must not start or end with hyphen, no consecutive hyphens
  const validNamePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  const seenParts = new Set<string>();

  for (const part of codeParts) {
    // Skip duplicates (only report once per unique part name)
    if (seenParts.has(part.name)) {
      continue;
    }
    seenParts.add(part.name);

    if (!validNamePattern.test(part.name)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line: part.line,
        column: part.column,
        message: `CSS part name "${part.name}" violates naming convention. Must be lowercase-hyphenated (e.g., "button", "input-wrapper")`,
        suggestion: `Rename to use lowercase letters, numbers, and hyphens only. Examples: "button", "input-wrapper", "icon-container"`,
        code: `part="${part.name}"`,
        severity: 'warning',
      });
    }
  }
}

/**
 * Validate CSS part documentation for a single file
 */
export function validateCSSPartDocumentation(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: PartStats,
): void {
  // Extract CSS parts from code (html`...` templates)
  const codeParts = extractCSSPartsFromTemplate(sourceFile);

  // Get documented parts from JSDoc @csspart tags
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    return;
  }

  const classDecl = classes[0];
  if (!classDecl) {
    return;
  }

  const documentedParts = getJSDocCSSPartTags(classDecl);

  // Update stats
  stats.totalParts += codeParts.length;
  const uniqueCodeParts = new Set(codeParts.map((p) => p.name));
  stats.documentedParts += Array.from(uniqueCodeParts).filter((name) =>
    documentedParts.has(name),
  ).length;

  // Run validators
  checkUndocumentedParts(sourceFile, codeParts, documentedParts, violations);
  checkOrphanedPartDocumentation(sourceFile, codeParts, documentedParts, violations);
  checkPartDescriptions(sourceFile, documentedParts, violations);
  checkPartNamingConvention(sourceFile, codeParts, violations);
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

async function validateCSSPartDocumentationHook(
  deps: HookDependencies = defaultDeps,
  silent = false,
  bailFast = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const violations: Violation[] = [];
  const stats: PartStats = {
    totalParts: 0,
    documentedParts: 0,
  };

  let stagedFiles: string[];
  try {
    stagedFiles = deps.getStagedFiles();
  } catch (error) {
    return {
      passed: false,
      violations: [
        {
          file: '<git>',
          line: 1,
          column: 1,
          message: 'Failed to get staged files from Git',
          suggestion: error instanceof Error ? error.message : String(error),
          severity: 'critical',
        },
      ],
      stats: {
        filesChecked: 0,
        totalViolations: 1,
        criticalViolations: 1,
        warningViolations: 0,
        totalParts: 0,
        documentedParts: 0,
        coveragePercent: 0,
      },
    };
  }

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('[INFO] No component files staged for commit');
    }
    return {
      passed: true,
      violations: [],
      stats: {
        filesChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
        totalParts: 0,
        documentedParts: 0,
        coveragePercent: 100,
      },
    };
  }

  if (!silent) {
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for CSS part documentation...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  // Analyze each staged file
  let filesChecked = 0;
  for (let i = 0; i < stagedFiles.length; i++) {
    const filePath = stagedFiles[i];

    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      const remaining = stagedFiles.slice(i);
      console.warn(`[WARNING] Timeout reached (${CONFIG.timeoutMs}ms).`);
      console.warn(`[WARNING] Skipped ${remaining.length} file(s):`);
      remaining.forEach((f) => console.warn(`  - ${f}`));
      break;
    }

    let sourceFile: SourceFile | undefined;
    try {
      sourceFile = project.addSourceFileAtPath(filePath);

      // Run validation
      validateCSSPartDocumentation(sourceFile, violations, stats);
      filesChecked++;

      // Bail fast on first critical violation
      if (bailFast && violations.some((v) => v.severity === 'critical')) {
        if (!silent) {
          console.warn('[INFO] Bail-fast enabled, stopping on first critical violation');
        }
        break;
      }
    } catch (error) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Fix TypeScript syntax errors in this file',
        severity: 'critical',
      });
    } finally {
      // Remove from project to free memory
      sourceFile?.forget();
    }
  }

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  const coveragePercent =
    stats.totalParts === 0 ? 100 : Math.round((stats.documentedParts / stats.totalParts) * 100);

  const elapsedTime = Date.now() - startTime;
  if (!silent) {
    console.log(`[INFO] Completed in ${elapsedTime}ms`);
    if (elapsedTime > CONFIG.performanceBudgetMs) {
      console.warn(
        `[PERFORMANCE] Hook exceeded ${CONFIG.performanceBudgetMs}ms budget: ${elapsedTime}ms`,
      );
    }
    console.log('');
  }

  return {
    passed: criticalViolations.length === 0,
    violations,
    stats: {
      filesChecked,
      totalViolations: violations.length,
      criticalViolations: criticalViolations.length,
      warningViolations: warningViolations.length,
      totalParts: stats.totalParts,
      documentedParts: stats.documentedParts,
      coveragePercent,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const bailFast = args.includes('--bail-fast');

  if (!outputJson) {
    console.log('[HOOK] css-part-documentation (H25)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateCSSPartDocumentationHook(defaultDeps, outputJson, bailFast);

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
    console.log('[PASS] No CSS part documentation violations found');
    console.log(
      `[INFO] Coverage: ${result.stats.documentedParts}/${result.stats.totalParts} parts documented (${result.stats.coveragePercent}%)`,
    );
    console.log('');
    process.exit(0);
  }

  // Print violations grouped by severity
  const criticalViolations = result.violations.filter((v) => v.severity === 'critical');
  const warningViolations = result.violations.filter((v) => v.severity === 'warning');

  if (criticalViolations.length > 0) {
    console.log(`[CRITICAL] Found ${criticalViolations.length} critical violation(s):`);
    console.log('');
    criticalViolations.forEach((violation) => {
      const location = `${violation.file}:${violation.line}:${violation.column}`;
      console.log(`${location}`);
      console.log(`   ${violation.message}`);
      console.log(`   Suggestion: ${violation.suggestion}`);
      if (violation.code) {
        console.log(`   Code: ${violation.code}`);
      }
      console.log('');
    });
  }

  if (warningViolations.length > 0) {
    console.log(`[WARNING] Found ${warningViolations.length} warning(s):`);
    console.log('');
    warningViolations.forEach((violation) => {
      const location = `${violation.file}:${violation.line}:${violation.column}`;
      console.log(`${location}`);
      console.log(`   ${violation.message}`);
      console.log(`   Suggestion: ${violation.suggestion}`);
      if (violation.code) {
        console.log(`   Code: ${violation.code}`);
      }
      console.log('');
    });
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('[SUMMARY]');
  console.log(`   Files checked: ${result.stats.filesChecked}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical: ${result.stats.criticalViolations}`);
  console.log(`   Warnings: ${result.stats.warningViolations}`);
  console.log(
    `   Coverage: ${result.stats.documentedParts}/${result.stats.totalParts} parts (${result.stats.coveragePercent}%)`,
  );
  console.log('');

  if (result.passed) {
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[FAIL] Commit blocked due to critical violations');
    console.log('');
    console.log('[FIX] To resolve:');
    console.log('   1. Add @csspart tags to class JSDoc for all CSS parts in templates');
    console.log('   2. Include descriptions: @csspart button - The main button element');
    console.log('   3. Remove orphaned @csspart tags that do not exist in code');
    console.log('   4. Use lowercase-hyphenated naming for parts');
    console.log('');
    console.log('[EXAMPLE] Class JSDoc:');
    console.log('   /**');
    console.log('    * A button component.');
    console.log('    * @summary Interactive button element.');
    console.log('    * @tag hx-button');
    console.log('    * @csspart button - The main button element');
    console.log('    * @csspart icon - The button icon (if slotted)');
    console.log('    */');
    console.log('');
    console.log('[BYPASS] Emergency bypass (NOT recommended):');
    console.log('   git commit --no-verify');
    console.log('');
    console.log('[APPROVED] Approved exceptions:');
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
export { validateCSSPartDocumentationHook };

export type { Violation, ValidationResult, HookDependencies, CSSPart, PartStats };
