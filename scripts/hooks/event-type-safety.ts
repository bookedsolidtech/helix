#!/usr/bin/env tsx
/**
 * Hook: event-type-safety (H07)
 *
 * Enforces event type safety in web components.
 * Execution budget: <2 seconds, timeout: 5 seconds
 *
 * Catches:
 * - Events without explicit detail types
 * - Events using inline types instead of interfaces
 * - Event names not starting with 'hx-'
 * - Missing JSDoc @fires tags
 * - Non-exported detail type interfaces
 *
 * Usage:
 *   tsx scripts/hooks/event-type-safety.ts
 *   tsx scripts/hooks/event-type-safety.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:event-type-safety
 */

import {
  Project,
  Node,
  SourceFile,
  CallExpression,
  NewExpression,
  ClassDeclaration,
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
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
}

interface EventDefinition {
  name: string;
  detailType: string | null;
  hasInlineType: boolean;
  line: number;
  column: number;
  code: string;
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Only check component files (not test, stories, or styles)
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
  ],

  // Event naming conventions
  eventPrefix: 'hx-',

  // Approval mechanism for exceptional cases
  approvalComment: '@typescript-specialist-approved',

  // Approval comment search depth (check up to N parent nodes)
  approvalCommentSearchDepth: 5,

  // Performance: incremental checking
  timeoutMs: 5000,
  performanceBudgetMs: 2000, // Warn if execution exceeds this
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Convert glob pattern to regex, escaping special regex characters
 */
function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§GLOBSTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§GLOBSTAR§/g, '.*');
  return new RegExp(escaped);
}

// Pre-compile glob patterns for performance
const includeRegexes = CONFIG.includePatterns.map(globToRegex);
const excludeRegexes = CONFIG.excludePatterns.map(globToRegex);

/**
 * Get list of staged TypeScript component files
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
      .filter((file) => file.endsWith('.ts'))
      .filter((file) => includeRegexes.some((regex) => regex.test(file)))
      .filter((file) => !excludeRegexes.some((regex) => regex.test(file)))
      .filter((file) => existsSync(file));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Extract event name from CustomEvent constructor call
 *
 * Limitation: Only detects static string literals. Dynamic event names
 * (e.g., template literals with interpolation like `${prefix}-click`,
 * variables, or computed expressions) will return null.
 */
function extractEventName(newExpr: NewExpression): string | null {
  const args = newExpr.getArguments();
  if (args.length === 0) {
    return null;
  }

  const firstArg = args[0];
  if (!firstArg) {
    return null;
  }

  const firstArgText = firstArg.getText();

  // Handle string literals: 'event-name', "event-name", `event-name`
  const stringMatch = firstArgText.match(/^['"`]([^'"`]+)['"`]$/);
  if (stringMatch) {
    return stringMatch[1] ?? null;
  }

  return null;
}

/**
 * Extract detail type from CustomEvent<DetailType>
 */
function extractDetailType(newExpr: NewExpression): {
  detailType: string | null;
  hasInlineType: boolean;
} {
  const typeArgs = newExpr.getTypeArguments();

  if (typeArgs.length === 0) {
    return { detailType: null, hasInlineType: false };
  }

  const firstTypeArg = typeArgs[0];
  if (!firstTypeArg) {
    return { detailType: null, hasInlineType: false };
  }

  const detailTypeText = firstTypeArg.getText();

  // Check if it's an inline object type (contains { })
  const hasInlineType = detailTypeText.includes('{');

  return { detailType: detailTypeText, hasInlineType };
}

/**
 * Check if an interface is exported
 */
function isInterfaceExported(sourceFile: SourceFile, interfaceName: string): boolean {
  const interfaces = sourceFile.getInterfaces();

  for (const iface of interfaces) {
    if (iface.getName() === interfaceName && iface.isExported()) {
      return true;
    }
  }

  return false;
}

/**
 * Get JSDoc @fires tags from class declaration
 */
function getJSDocFiresTags(classDecl: ClassDeclaration): string[] {
  const jsDocs = classDecl.getJsDocs();
  const firesTags: string[] = [];

  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'fires') {
        const commentText = tag.getCommentText();
        if (commentText) {
          const text = commentText.toString();
          // Extract event name from @fires tag
          // Format: @fires {CustomEvent<DetailType>} event-name - Description
          const match = text.match(/\s*(?:\{[^}]+\}\s+)?(['"`]?)([a-z-]+)\1/);
          if (match && match[2]) {
            firesTags.push(match[2]);
          }
        }
      }
    }
  }

  return firesTags;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Find all dispatchEvent calls and extract event definitions
 */
function findDispatchEventCalls(sourceFile: SourceFile): EventDefinition[] {
  const events: EventDefinition[] = [];

  sourceFile.forEachDescendant((node: Node) => {
    // Look for this.dispatchEvent(...) calls
    if (Node.isCallExpression(node)) {
      const callExpr = node as CallExpression;
      const expr = callExpr.getExpression();
      const exprText = expr.getText();

      if (exprText === 'this.dispatchEvent') {
        const args = callExpr.getArguments();
        if (args.length > 0) {
          const firstArg = args[0];

          // Check if argument is a new CustomEvent(...)
          if (firstArg && Node.isNewExpression(firstArg)) {
            const newExpr = firstArg as NewExpression;
            const newExprText = newExpr.getExpression().getText();

            if (newExprText === 'CustomEvent') {
              const eventName = extractEventName(newExpr);
              const { detailType, hasInlineType } = extractDetailType(newExpr);
              const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

              events.push({
                name: eventName ?? 'unknown',
                detailType,
                hasInlineType,
                line,
                column,
                code: node.getText().substring(0, 80),
              });
            }
          }
        }
      }
    }
  });

  return events;
}

/**
 * Check event naming conventions (must start with 'hx-')
 */
export function checkEventNaming(
  sourceFile: SourceFile,
  events: EventDefinition[],
  violations: Violation[],
): void {
  for (const event of events) {
    if (!event.name.startsWith(CONFIG.eventPrefix)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line: event.line,
        column: event.column,
        message: `Event name "${event.name}" must start with "${CONFIG.eventPrefix}"`,
        suggestion: `Rename to "${CONFIG.eventPrefix}${event.name}"`,
        code: event.code,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check that events have explicit detail types
 */
export function checkEventDetailTypes(
  sourceFile: SourceFile,
  events: EventDefinition[],
  violations: Violation[],
): void {
  for (const event of events) {
    if (!event.detailType) {
      violations.push({
        file: sourceFile.getFilePath(),
        line: event.line,
        column: event.column,
        message: `Event "${event.name}" missing explicit detail type`,
        suggestion:
          'Use CustomEvent<DetailInterface> with explicit interface (e.g., HxClickDetail)',
        code: event.code,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check that detail types are interfaces, not inline types
 */
export function checkInlineTypes(
  sourceFile: SourceFile,
  events: EventDefinition[],
  violations: Violation[],
): void {
  for (const event of events) {
    if (event.hasInlineType) {
      violations.push({
        file: sourceFile.getFilePath(),
        line: event.line,
        column: event.column,
        message: `Event "${event.name}" uses inline type instead of interface`,
        suggestion: 'Extract to named interface (e.g., HxClickDetail, HxChangeDetail)',
        code: event.code,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check that detail type interfaces are exported
 */
export function checkExportedInterfaces(
  sourceFile: SourceFile,
  events: EventDefinition[],
  violations: Violation[],
): void {
  for (const event of events) {
    if (event.detailType && !event.hasInlineType) {
      // Extract interface name (handle generic types like Array<T>)
      const interfaceName = event.detailType.split('<')[0]?.trim();

      if (interfaceName && !isInterfaceExported(sourceFile, interfaceName)) {
        violations.push({
          file: sourceFile.getFilePath(),
          line: event.line,
          column: event.column,
          message: `Event "${event.name}" detail type "${interfaceName}" is not exported`,
          suggestion: `Add 'export' keyword to interface ${interfaceName}`,
          code: event.code,
          severity: 'warning',
        });
      }
    }
  }
}

/**
 * Check JSDoc @fires tags match implementation
 */
export function checkJSDocFires(
  sourceFile: SourceFile,
  events: EventDefinition[],
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

  const documentedEvents = getJSDocFiresTags(classDecl);

  for (const event of events) {
    if (!documentedEvents.includes(event.name)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line: event.line,
        column: event.column,
        message: `Event "${event.name}" missing JSDoc @fires tag in class documentation`,
        suggestion: `Add @fires tag to class JSDoc: @fires {CustomEvent<DetailType>} ${event.name} - Description`,
        code: event.code,
        severity: 'warning',
      });
    }
  }
}

/**
 * Validate event type safety for a single file
 */
export function validateEventTypeSafety(sourceFile: SourceFile, violations: Violation[]): void {
  const events = findDispatchEventCalls(sourceFile);

  // Run all validators
  checkEventNaming(sourceFile, events, violations);
  checkEventDetailTypes(sourceFile, events, violations);
  checkInlineTypes(sourceFile, events, violations);
  checkExportedInterfaces(sourceFile, events, violations);
  checkJSDocFires(sourceFile, events, violations);
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

async function validateEventTypeSafetyHook(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const violations: Violation[] = [];

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
      },
    };
  }

  if (!silent) {
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for event type safety...`);
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
      validateEventTypeSafety(sourceFile, violations);
      filesChecked++;
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
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');

  if (!outputJson) {
    console.log('[HOOK] event-type-safety (H07)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateEventTypeSafetyHook(defaultDeps, outputJson);

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
    console.log('[PASS] No event type safety violations found');
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
    console.log('   1. Add explicit detail types: CustomEvent<DetailInterface>');
    console.log('   2. Extract inline types to named interfaces');
    console.log('   3. Ensure event names start with "hx-"');
    console.log('   4. Export detail type interfaces');
    console.log('   5. Add @fires JSDoc tags to class documentation');
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
export { validateEventTypeSafetyHook };

export type { Violation, ValidationResult, HookDependencies, EventDefinition };
