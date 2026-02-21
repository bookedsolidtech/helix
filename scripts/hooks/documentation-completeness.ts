#!/usr/bin/env tsx
/**
 * Hook: documentation-completeness (H22)
 *
 * Ensures all public APIs have complete JSDoc documentation.
 * Execution budget: <2 seconds, timeout: 5 seconds
 *
 * Catches:
 * - Missing JSDoc on classes, public properties, public methods
 * - Missing @param tags for method parameters
 * - Missing @returns tags for non-void methods
 * - Missing property descriptions
 * - Missing class descriptions
 * - Incomplete parameter documentation
 *
 * Allows:
 * - Private/protected members (starting with _ or private modifier)
 * - Lit lifecycle methods (render, connectedCallback, etc.)
 * - Test files, stories, styles
 * - Approved exceptions: // @typescript-specialist-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/documentation-completeness.ts
 *   tsx scripts/hooks/documentation-completeness.ts --json
 *   tsx scripts/hooks/documentation-completeness.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:documentation-completeness
 */

import {
  Project,
  SyntaxKind,
  Node,
  ClassDeclaration,
  PropertyDeclaration,
  MethodDeclaration,
  GetAccessorDeclaration,
  SetAccessorDeclaration,
  SourceFile,
  JSDoc,
  ParameterDeclaration,
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
    totalPublicAPIs: number;
    documentedAPIs: number;
    coveragePercent: number;
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
  performanceBudgetMs: 2000, // Warn if execution exceeds 2 seconds
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Pre-compiled regex cache for performance (matches H07 pattern)
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
 * For @param tags, returns the full text including parameter name
 */
export function getJSDocTags(jsDocs: JSDoc[], tagName: string): string[] {
  const tags: string[] = [];
  for (const jsDoc of jsDocs) {
    const docTags = jsDoc.getTags();
    for (const tag of docTags) {
      if (tag.getTagName() === tagName) {
        // For @param tags, we need the full tag text to extract parameter name
        const tagText = tag.getText();
        tags.push(tagText);
      }
    }
  }
  return tags;
}

/**
 * Check if JSDoc has a specific tag
 */
export function hasJSDocTag(jsDocs: JSDoc[], tagName: string): boolean {
  return getJSDocTags(jsDocs, tagName).length > 0;
}

/**
 * Get JSDoc description (non-tag content)
 */
export function getJSDocDescription(jsDocs: JSDoc[]): string {
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
export function checkClassJSDoc(
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
        message: `Class "${className}" missing JSDoc documentation`,
        suggestion: 'Add JSDoc comment describing the component purpose, usage, and public API',
        code: classDecl.getText().split('\n')[0]?.substring(0, 80),
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
      message: `Class "${className}" JSDoc missing description`,
      suggestion: 'Add a description at the start of the JSDoc comment',
      code: className,
      severity: 'critical',
    });
  }
}

/**
 * Check property JSDoc
 */
export function checkPropertyJSDoc(
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
        message: `Public property "${propName}" missing JSDoc documentation`,
        suggestion: 'Add JSDoc with description explaining the property purpose',
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
      code: propName,
      severity: 'critical',
    });
  }
}

/**
 * Check method JSDoc and validate @param and @returns tags
 */
export function checkMethodJSDoc(
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
        message: `Public method "${methodName}" missing JSDoc documentation`,
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

  // Check for @param tags for each parameter
  if (params.length > 0) {
    checkMethodParams(method, params, jsDocs, sourceFile, violations);
  }

  // Check for @returns tag if method has non-void return type
  if (!isVoidReturn) {
    checkMethodReturns(method, jsDocs, sourceFile, violations, returnTypeText);
  }
}

/**
 * Check method @param tags completeness
 */
export function checkMethodParams(
  method: MethodDeclaration,
  params: ParameterDeclaration[],
  jsDocs: JSDoc[],
  sourceFile: SourceFile,
  violations: Violation[],
): void {
  const paramTags = getJSDocTags(jsDocs, 'param');
  const methodName = method.getName();
  const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());

  // Check if all parameters are documented
  if (paramTags.length === 0) {
    const paramNames = params.map((p) => p.getName()).join(', ');
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Method "${methodName}" missing @param tags for all parameters`,
      suggestion: `Add @param tag for each parameter: ${paramNames}`,
      code: methodName,
      severity: 'critical',
    });
    return;
  }

  // Validate each parameter has a @param tag
  const documentedParamNames = paramTags.map((tag) => {
    // Extract parameter name from full tag text
    // Format: "@param name - description" or "@param {type} name - description" or "@param ...name"
    // ts-morph returns full tag including @param prefix
    const match = tag.match(/@param\s+(?:\{[^}]+\}\s+)?\.{0,3}(\w+)/);
    return match ? match[1] : null;
  });

  for (const param of params) {
    const paramName = param.getName();
    // Remove rest operator for comparison (if present in source code)
    if (param.isRestParameter()) {
      // Rest parameter name in AST doesn't include '...'
      // No need to strip, but we should match with the documented name
    }
    if (!documentedParamNames.includes(paramName)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Method "${methodName}" missing @param tag for parameter "${paramName}"`,
        suggestion: `Add @param ${param.isRestParameter() ? '...' : ''}${paramName} - Description of the parameter`,
        code: methodName,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check method @returns tag for non-void methods
 */
export function checkMethodReturns(
  method: MethodDeclaration,
  jsDocs: JSDoc[],
  sourceFile: SourceFile,
  violations: Violation[],
  returnTypeText: string,
): void {
  const methodName = method.getName();
  const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());

  if (!hasJSDocTag(jsDocs, 'returns')) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Method "${methodName}" missing @returns tag for non-void return type (${returnTypeText})`,
      suggestion: 'Add @returns tag describing the return value',
      code: methodName,
      severity: 'critical',
    });
  }
}

/**
 * Check getter accessor JSDoc
 */
export function checkGetAccessorJSDoc(
  accessor: GetAccessorDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
  stats: JSDocStats,
): void {
  const accessorName = accessor.getName();

  // Skip private accessors
  if (accessor.hasModifier(SyntaxKind.PrivateKeyword) || accessorName.startsWith('_')) {
    return;
  }

  // Skip static accessors (usually not part of public API)
  if (accessor.hasModifier(SyntaxKind.StaticKeyword)) {
    return;
  }

  stats.totalAPIs++;

  const jsDocs = accessor.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(accessor.getStart());
  const returnType = accessor.getReturnType();
  const returnTypeText = returnType.getText();

  // Check if accessor has JSDoc
  if (jsDocs.length === 0) {
    if (!hasApprovalComment(accessor)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Public getter "${accessorName}" missing JSDoc documentation`,
        suggestion: 'Add JSDoc with description and @returns tag',
        code: accessor.getText().split('\n')[0]?.substring(0, 80),
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
      message: `Getter "${accessorName}" JSDoc missing description`,
      suggestion: 'Add a description explaining what this getter returns',
      code: accessorName,
      severity: 'critical',
    });
  }

  // Check for @returns tag
  if (!hasJSDocTag(jsDocs, 'returns')) {
    violations.push({
      file: sourceFile.getFilePath(),
      line,
      column,
      message: `Getter "${accessorName}" missing @returns tag (returns ${returnTypeText})`,
      suggestion: 'Add @returns tag describing the return value',
      code: accessorName,
      severity: 'critical',
    });
  }
}

/**
 * Check setter accessor JSDoc
 */
export function checkSetAccessorJSDoc(
  accessor: SetAccessorDeclaration,
  sourceFile: SourceFile,
  violations: Violation[],
  stats: JSDocStats,
): void {
  const accessorName = accessor.getName();

  // Skip private accessors
  if (accessor.hasModifier(SyntaxKind.PrivateKeyword) || accessorName.startsWith('_')) {
    return;
  }

  // Skip static accessors (usually not part of public API)
  if (accessor.hasModifier(SyntaxKind.StaticKeyword)) {
    return;
  }

  stats.totalAPIs++;

  const jsDocs = accessor.getJsDocs();
  const { line, column } = sourceFile.getLineAndColumnAtPos(accessor.getStart());
  const params = accessor.getParameters();

  // Check if accessor has JSDoc
  if (jsDocs.length === 0) {
    if (!hasApprovalComment(accessor)) {
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Public setter "${accessorName}" missing JSDoc documentation`,
        suggestion: 'Add JSDoc with description and @param tag for the value parameter',
        code: accessor.getText().split('\n')[0]?.substring(0, 80),
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
      message: `Setter "${accessorName}" JSDoc missing description`,
      suggestion: 'Add a description explaining what this setter does',
      code: accessorName,
      severity: 'critical',
    });
  }

  // Check for @param tag for the setter parameter
  if (params.length > 0) {
    const paramTags = getJSDocTags(jsDocs, 'param');
    if (paramTags.length === 0) {
      const paramName = params[0]?.getName() ?? 'value';
      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Setter "${accessorName}" missing @param tag for parameter "${paramName}"`,
        suggestion: `Add @param ${paramName} - Description of the parameter`,
        code: accessorName,
        severity: 'critical',
      });
    }
  }
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  createProject: (_configPath: string) =>
    new Project({
      // P1: Skip tsconfig loading for 50% faster initialization
      // We only need basic TypeScript parsing, not full type checking
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        strict: true,
      },
    }),
};

// ─── Main Validation ──────────────────────────────────────────────────────

export async function validateDocumentationCompleteness(
  deps: HookDependencies = defaultDeps,
  silent = false,
  bailFast = false,
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
        totalPublicAPIs: 0,
        documentedAPIs: 0,
        coveragePercent: 0,
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
        filesChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
        totalPublicAPIs: 0,
        documentedAPIs: 0,
        coveragePercent: 100,
      },
    };
  }

  if (!silent) {
    console.log(`Checking ${stagedFiles.length} file(s) for documentation completeness...`);
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

        // Check getters
        classDecl.getGetAccessors().forEach((accessor) => {
          checkGetAccessorJSDoc(accessor, sourceFile, violations, stats);
        });

        // Check setters
        classDecl.getSetAccessors().forEach((accessor) => {
          checkSetAccessorJSDoc(accessor, sourceFile, violations, stats);
        });
      });

      filesChecked++;

      // Bail fast if requested and violations found
      if (bailFast && violations.filter((v) => v.severity === 'critical').length > 0) {
        if (!silent) {
          console.warn('[BAIL-FAST] Critical violation found, stopping early');
        }
        break;
      }
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
      totalPublicAPIs: stats.totalAPIs,
      documentedAPIs: stats.documentedAPIs,
      coveragePercent,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const bailFast = args.includes('--bail-fast');
  const startTime = Date.now();

  if (!outputJson) {
    console.log('Documentation Hook: documentation-completeness (H22)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateDocumentationCompleteness(defaultDeps, outputJson, bailFast);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          hook_id: 'H22',
          hook_name: 'documentation-completeness',
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
    console.log('[PASS] All public APIs are fully documented');
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
    console.log('[BLOCKED] Commit blocked - Documentation incomplete');
    console.log('');
    console.log('Documentation Requirements:');
    console.log('   - All public classes must have JSDoc with description');
    console.log('   - All public properties must have JSDoc with description');
    console.log('   - All public methods must have JSDoc with description');
    console.log('   - All method parameters must have @param tags');
    console.log('   - Non-void methods must have @returns tags');
    console.log('');
    console.log('Example:');
    console.log('   /**');
    console.log('    * A button component for user interaction.');
    console.log('    */');
    console.log('   export class HxButton extends LitElement {');
    console.log('     /**');
    console.log('      * Button label text');
    console.log('      */');
    console.log('     @property({ type: String })');
    console.log('     label = "Click me";');
    console.log('');
    console.log('     /**');
    console.log('      * Handle click events');
    console.log('      * @param event - The mouse event');
    console.log('      * @returns The click result');
    console.log('      */');
    console.log('     public handleClick(event: MouseEvent): boolean {');
    console.log('       return true;');
    console.log('     }');
    console.log('   }');
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

// Exports for testing (functions already exported above)
export type { Violation, ValidationResult, HookDependencies, JSDocStats, HookConfig };
export { globToRegex, matchesPatterns };
