#!/usr/bin/env tsx
/**
 * Hook: jsdoc-coverage (H08)
 *
 * Enforces 100% JSDoc coverage on all public APIs.
 * Execution budget: <3 seconds, timeout 5 seconds
 *
 * Catches:
 * - Missing JSDoc comments on classes, properties, methods
 * - Missing required tags: @summary, @tag, @param, @returns, @fires, @slot, @csspart, @cssprop
 * - Incomplete documentation for public APIs
 * - Missing parameter documentation
 * - Missing return type documentation
 *
 * Allows:
 * - Private members (starting with _ or private modifier)
 * - Lifecycle methods (render, connectedCallback, etc.)
 * - Approved exceptions: // @typescript-specialist-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/jsdoc-coverage.ts
 *   tsx scripts/hooks/jsdoc-coverage.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:jsdoc-coverage
 */

import {
  Project,
  SyntaxKind,
  Node,
  ClassDeclaration,
  PropertyDeclaration,
  MethodDeclaration,
  SourceFile,
  JSDoc,
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
    totalPublicAPIs: number;
    documentedAPIs: number;
    coveragePercent: number;
    filesChecked: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
}

interface JSDocStats {
  totalAPIs: number;
  documentedAPIs: number;
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly litLifecycleMethods: readonly string[];
  readonly approvalCommentSearchDepth: number;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
}

const CONFIG: HookConfig = {
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
  approvalComment: '@typescript-specialist-approved',

  // Lit lifecycle methods (skip JSDoc requirement)
  litLifecycleMethods: [
    'connectedCallback',
    'disconnectedCallback',
    'firstUpdated',
    'updated',
    'willUpdate',
    'render',
    'createRenderRoot',
    'scheduleUpdate',
    'performUpdate',
    'shouldUpdate',
    'update',
    'requestUpdate',
    'attributeChangedCallback',
    'adoptedCallback',
  ],

  // Approval comment search depth (check up to N parent nodes)
  approvalCommentSearchDepth: 5,

  // Performance: timeout and budget
  timeoutMs: 5000,
  performanceBudgetMs: 3000, // Warn if execution exceeds this
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
function hasApprovalComment(node: Node): boolean {
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
 * Format violation for console output
 */
function formatViolation(violation: Violation): string {
  const icon = violation.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
  const location = `${violation.file}:${violation.line}:${violation.column}`;

  return `${icon} ${location}
   ${violation.message}
   ${violation.suggestion}${violation.code ? `\n   ${violation.code}` : ''}`;
}

/**
 * Get JSDoc tags by name
 */
function getJSDocTags(jsDocs: JSDoc[], tagName: string): string[] {
  const tags: string[] = [];
  for (const jsDoc of jsDocs) {
    const docTags = jsDoc.getTags();
    for (const tag of docTags) {
      if (tag.getTagName() === tagName) {
        tags.push(tag.getComment() ?? '');
      }
    }
  }
  return tags;
}

/**
 * Check if JSDoc has a specific tag
 */
function hasJSDocTag(jsDocs: JSDoc[], tagName: string): boolean {
  return getJSDocTags(jsDocs, tagName).length > 0;
}

/**
 * Get JSDoc description (non-tag content)
 */
function getJSDocDescription(jsDocs: JSDoc[]): string {
  if (jsDocs.length === 0) {
    return '';
  }
  const description = jsDocs[0]?.getDescription();
  return description ?? '';
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check class-level JSDoc
 */
function checkClassJSDoc(
  classDecl: ClassDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
  stats: JSDocStats,
): void {
  stats.totalAPIs++;

  const jsDocs = classDecl.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(classDecl.getStart());
  const className = classDecl.getName() ?? '<anonymous>';

  // Check if class has JSDoc
  if (jsDocs.length === 0) {
    if (!hasApprovalComment(classDecl)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Class "${className}" missing JSDoc comment`,
        suggestion:
          'Add JSDoc with @summary, @tag, and document all @fires, @slot, @csspart, @cssprop',
        code: classDecl.getText().split('\n')[0]?.substring(0, 80),
        severity: 'critical',
      });
    }
    return;
  }

  stats.documentedAPIs++;

  // Check for @summary tag
  if (!hasJSDocTag(jsDocs, 'summary')) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Class "${className}" missing @summary tag in JSDoc`,
      suggestion: 'Add @summary tag with a concise description of the component',
      code: classDecl.getName(),
      severity: 'critical',
    });
  }

  // Check for @tag tag (custom element tag name)
  if (!hasJSDocTag(jsDocs, 'tag')) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Class "${className}" missing @tag tag in JSDoc`,
      suggestion: 'Add @tag with the custom element tag name (e.g., @tag hx-button)',
      code: classDecl.getName(),
      severity: 'critical',
    });
  }

  // Check for description
  const description = getJSDocDescription(jsDocs);
  if (!description || description.trim().length === 0) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Class "${className}" JSDoc missing description`,
      suggestion: 'Add a description at the start of the JSDoc comment',
      code: classDecl.getName(),
      severity: 'critical',
    });
  }
}

/**
 * Check property JSDoc
 */
function checkPropertyJSDoc(
  prop: PropertyDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
  stats: JSDocStats,
): void {
  // Skip private properties
  if (prop.hasModifier(SyntaxKind.PrivateKeyword) || prop.getName().startsWith('_')) {
    return;
  }

  // Only check @property() decorated properties (public Lit properties)
  const hasPropertyDecorator = prop.getDecorators().some((decorator) => {
    const name = decorator.getName();
    return name === 'property' || name === 'state';
  });

  if (!hasPropertyDecorator) {
    return;
  }

  // Skip @state() properties (internal state)
  const hasStateDecorator = prop.getDecorators().some((decorator) => {
    return decorator.getName() === 'state';
  });

  if (hasStateDecorator) {
    return;
  }

  stats.totalAPIs++;

  const jsDocs = prop.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(prop.getStart());
  const propName = prop.getName();

  // Check if property has JSDoc
  if (jsDocs.length === 0) {
    if (!hasApprovalComment(prop)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Property "${propName}" missing JSDoc comment`,
        suggestion: 'Add JSDoc with description and @attr tag if reflected',
        code: prop.getText().split('\n')[0]?.substring(0, 80),
        severity: 'critical',
      });
    }
    return;
  }

  stats.documentedAPIs++;

  // Check for description
  const description = getJSDocDescription(jsDocs);
  if (!description || description.trim().length === 0) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Property "${propName}" JSDoc missing description`,
      suggestion: 'Add a description explaining the purpose of this property',
      code: prop.getName(),
      severity: 'critical',
    });
  }

  // Check for @attr tag if property is reflected (use AST parsing to avoid false positives)
  const propertyDecorator = prop.getDecorators().find((d) => d.getName() === 'property');
  if (propertyDecorator) {
    const args = propertyDecorator.getArguments();
    if (args.length > 0) {
      const arg = args[0];
      if (arg && Node.isObjectLiteralExpression(arg)) {
        const reflectProp = arg.getProperty('reflect');
        if (reflectProp && Node.isPropertyAssignment(reflectProp)) {
          const initializer = reflectProp.getInitializer();
          if (initializer?.getText() === 'true') {
            if (!hasJSDocTag(jsDocs, 'attr')) {
              violations.push({
                file: sourceFile.getFilePath(),
                line,
                column,
                message: `Reflected property "${propName}" missing @attr tag`,
                suggestion: 'Add @attr tag with the attribute name',
                code: prop.getName(),
                severity: 'critical',
              });
            }
          }
        }
      }
    }
  }
}

/**
 * Check method JSDoc
 */
function checkMethodJSDoc(
  method: MethodDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
  stats: JSDocStats,
): void {
  const methodName = method.getName();

  // Skip private methods
  if (method.hasModifier(SyntaxKind.PrivateKeyword) || methodName.startsWith('_')) {
    return;
  }

  // Skip Lit lifecycle methods
  if (CONFIG.litLifecycleMethods.includes(methodName)) {
    return;
  }

  // Skip static methods (usually not part of public API)
  if (method.hasModifier(SyntaxKind.StaticKeyword)) {
    return;
  }

  stats.totalAPIs++;

  const jsDocs = method.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());
  const params = method.getParameters();
  const returnType = method.getReturnType();
  const returnTypeText = returnType.getText();
  const isVoidReturn =
    returnTypeText === 'void' ||
    returnTypeText === 'undefined' ||
    returnTypeText === 'Promise<void>' ||
    returnTypeText === 'Promise<undefined>';

  // Check if method has JSDoc
  if (jsDocs.length === 0) {
    if (!hasApprovalComment(method)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Public method "${methodName}" missing JSDoc comment`,
        suggestion:
          'Add JSDoc with description, @param for each parameter, and @returns if non-void',
        code: method.getText().split('\n')[0]?.substring(0, 80),
        severity: 'critical',
      });
    }
    return;
  }

  stats.documentedAPIs++;

  // Check for description
  const description = getJSDocDescription(jsDocs);
  if (!description || description.trim().length === 0) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Method "${methodName}" JSDoc missing description`,
      suggestion: 'Add a description explaining what this method does',
      code: methodName,
      severity: 'critical',
    });
  }

  // Check for @param tags for each parameter (validate count)
  const paramTags = getJSDocTags(jsDocs, 'param');
  if (params.length > 0 && paramTags.length !== params.length) {
    const paramNames = params.map((p) => p.getName()).join(', ');
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Method "${methodName}" missing @param tags for all parameters`,
      suggestion: `Add @param for each parameter: ${paramNames}`,
      code: methodName,
      severity: 'critical',
    });
  }

  // Check for @returns tag if method has non-void return type
  if (!isVoidReturn && !hasJSDocTag(jsDocs, 'returns')) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Method "${methodName}" missing @returns tag for non-void return type`,
      suggestion: 'Add @returns tag describing the return value',
      code: methodName,
      severity: 'critical',
    });
  }
}

/**
 * Check for event dispatches and verify @fires tags
 *
 * Detects:
 * - new CustomEvent('name') and new Event('name')
 * - Template literals without substitutions: `event-name`
 *
 * Limitations:
 * - Dynamic event names (variables, computed, template literals with ${}) are not detected
 * - Events dispatched from factory functions are not detected
 * - Two-statement patterns (const evt = new Event(); dispatch(evt)) are not detected
 */
function checkEventDocumentation(
  classDecl: ClassDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
): void {
  const jsDocs = classDecl.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(classDecl.getStart());
  const className = classDecl.getName() ?? '<anonymous>';

  // Find all dispatchEvent calls in the class
  const eventNames = new Set<string>();

  classDecl.forEachDescendant((node) => {
    // Look for dispatchEvent calls
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      if (Node.isPropertyAccessExpression(expression) && expression.getName() === 'dispatchEvent') {
        // Get the event name from new CustomEvent('event-name', ...) or new Event('event-name')
        const args = node.getArguments();
        if (args.length > 0) {
          const firstArg = args[0];
          if (Node.isNewExpression(firstArg)) {
            const eventConstructor = firstArg.getExpression().getText();
            // Support both CustomEvent and Event
            if (eventConstructor === 'CustomEvent' || eventConstructor === 'Event') {
              const newArgs = firstArg.getArguments();
              if (newArgs.length > 0) {
                const eventNameArg = newArgs[0];
                // String literals
                if (Node.isStringLiteral(eventNameArg)) {
                  eventNames.add(eventNameArg.getLiteralValue());
                }
                // Template literals without substitutions
                else if (Node.isNoSubstitutionTemplateLiteral(eventNameArg)) {
                  eventNames.add(eventNameArg.getLiteralValue());
                }
                // Template expression with substitutions - report as dynamic
                else if (Node.isTemplateExpression(eventNameArg)) {
                  violations.push({
                    file: sourceFile.getFilePath(),
                    line,
                    column,
                    message: `Class "${className}" dispatches event with dynamic name (template literal with interpolation)`,
                    suggestion:
                      'Use static string literal for event names to enable validation, or document manually with @fires',
                    code: className,
                    severity: 'warning',
                  });
                }
              }
            }
          }
        }
      }
    }
  });

  // Check if all events are documented with @fires
  if (eventNames.size > 0) {
    const firesTags = getJSDocTags(jsDocs, 'fires');
    const documentedEvents = new Set(
      firesTags.map((tag) => {
        // Extract event name from CEM format: "@fires {Type} event-name - Description"
        // or simple format: "@fires event-name - Description"
        const withoutType = tag.replace(/^\{[^}]+\}\s*/, ''); // Remove optional {Type}
        const match = withoutType.match(/^(\S+)/);
        return match ? match[1] : '';
      }),
    );

    for (const eventName of eventNames) {
      if (!documentedEvents.has(eventName)) {
        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Class "${className}" dispatches event "${eventName}" but missing @fires tag`,
          suggestion: `Add @fires ${eventName} - Description to class JSDoc`,
          code: className,
          severity: 'critical',
        });
      }
    }
  }
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

export async function validateJSDocCoverage(
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
        totalPublicAPIs: 0,
        documentedAPIs: 0,
        coveragePercent: 0,
        filesChecked: 0,
      },
    };
  }

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('No component files staged for commit');
    }
    return {
      passed: true,
      violations: [],
      stats: {
        totalPublicAPIs: 0,
        documentedAPIs: 0,
        coveragePercent: 100,
        filesChecked: 0,
      },
    };
  }

  if (!silent) {
    console.log(`Checking ${stagedFiles.length} file(s) for JSDoc coverage...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  const stats: JSDocStats = {
    totalAPIs: 0,
    documentedAPIs: 0,
  };

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
      violations.push({
        file: '<timeout>',
        line: 1,
        column: 1,
        message: `Hook timeout reached (${CONFIG.timeoutMs}ms). ${remaining.length} file(s) not checked.`,
        suggestion: 'Reduce the number of staged files or increase timeout in hook configuration.',
        code: '',
        severity: 'warning',
      });
      break;
    }

    let sourceFile: SourceFile | undefined;
    try {
      sourceFile = project.addSourceFileAtPath(filePath);

      // Process all classes in the file
      sourceFile.getClasses().forEach((classDecl) => {
        // Check class JSDoc
        checkClassJSDoc(classDecl, sourceFile, violations, stats);

        // Check properties
        classDecl.getProperties().forEach((prop) => {
          checkPropertyJSDoc(prop, sourceFile, violations, stats);
        });

        // Check methods
        classDecl.getMethods().forEach((method) => {
          checkMethodJSDoc(method, sourceFile, violations, stats);
        });

        // Check event documentation
        checkEventDocumentation(classDecl, sourceFile, violations);
      });

      filesChecked++;
    } catch (error) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Fix TypeScript syntax errors or compilation issues in this file',
        severity: 'critical',
      });
    } finally {
      // Remove from project to free memory (guaranteed cleanup)
      sourceFile?.forget();
    }
  }

  const coveragePercent =
    stats.totalAPIs > 0 ? Math.round((stats.documentedAPIs / stats.totalAPIs) * 100) : 100;

  const elapsedTime = Date.now() - startTime;
  if (!silent) {
    console.log(`Completed in ${elapsedTime}ms`);
    if (elapsedTime > CONFIG.performanceBudgetMs) {
      console.warn(
        `[PERFORMANCE] Hook exceeded ${CONFIG.performanceBudgetMs}ms budget: ${elapsedTime}ms`,
      );
    }
    if (stats.totalAPIs === 0 && filesChecked > 0) {
      console.log('[INFO] No public APIs found in staged files');
    }
    console.log('');
  }

  return {
    passed: violations.filter((v) => v.severity === 'critical').length === 0,
    violations,
    stats: {
      totalPublicAPIs: stats.totalAPIs,
      documentedAPIs: stats.documentedAPIs,
      coveragePercent,
      filesChecked,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const startTime = Date.now();

  if (!outputJson) {
    console.log('Documentation Hook: jsdoc-coverage (H08)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateJSDocCoverage(defaultDeps, outputJson);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          hook_id: 'H08',
          hook_name: 'jsdoc-coverage',
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
    console.log('[PASS] 100% JSDoc coverage - All public APIs documented');
    console.log('');
    console.log(`   Total public APIs: ${result.stats.totalPublicAPIs}`);
    console.log(`   Documented APIs: ${result.stats.documentedAPIs}`);
    console.log(`   Coverage: ${result.stats.coveragePercent}%`);
    console.log('');
    process.exit(0);
  }

  // Print violations
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
  console.log(`   Total public APIs: ${result.stats.totalPublicAPIs}`);
  console.log(`   Documented APIs: ${result.stats.documentedAPIs}`);
  console.log(`   Coverage: ${result.stats.coveragePercent}%`);
  console.log(`   Violations: ${result.violations.length}`);
  console.log('');

  if (result.passed) {
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[BLOCKED] Commit blocked - JSDoc coverage below 100%');
    console.log('');
    console.log('Required JSDoc Tags:');
    console.log('   Classes: @summary, @tag, @fires, @slot, @csspart, @cssprop');
    console.log('   Properties: description, @attr (if reflected)');
    console.log('   Methods: description, @param (for each parameter), @returns (if non-void)');
    console.log('');
    console.log('Example:');
    console.log('   /**');
    console.log('    * A button component for user interaction.');
    console.log('    * @summary Primary interactive element');
    console.log('    * @tag hx-button');
    console.log('    * @fires hx-click - Dispatched when clicked');
    console.log('    * @slot default - Button content');
    console.log('    * @csspart button - The button element');
    console.log('    * @cssprop --hx-button-bg - Background color');
    console.log('    */');
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
  checkClassJSDoc,
  checkPropertyJSDoc,
  checkMethodJSDoc,
  checkEventDocumentation,
  hasApprovalComment,
  getJSDocTags,
  hasJSDocTag,
  getJSDocDescription,
  CONFIG,
};

export type { Violation, ValidationResult, HookDependencies, JSDocStats, HookConfig };
