#!/usr/bin/env tsx
/**
 * Hook: type-check-strict (H01)
 *
 * Enforces TypeScript strict mode compliance on staged files.
 * Execution budget: <3 seconds
 *
 * Catches:
 * - Explicit `any` types
 * - `@ts-ignore` comments without approval
 * - Non-null assertions (`!`) without justification
 * - Missing return type annotations on public methods/functions
 * - Missing parameter type annotations
 *
 * Usage:
 *   tsx scripts/hooks/type-check-strict.ts
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:type-check-strict
 */

import {
  Project,
  SyntaxKind,
  Node,
  MethodDeclaration,
  FunctionDeclaration,
  SourceFile,
  ClassDeclaration,
  ArrowFunction,
  FunctionExpression,
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
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files to check (only staged files)
  includePatterns: ['**/*.ts', '**/*.tsx'],
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
  approvalComment: '@typescript-specialist-approved',

  // Performance: incremental checking
  maxFilesPerBatch: 20,
  timeoutMs: 3000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Get list of staged TypeScript files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
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

  // Check parent nodes (up to 5 levels)
  let parent = node.getParent();
  let depth = 0;
  while (parent && depth < 5) {
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
  const icon = violation.severity === 'critical' ? '🔴' : '⚠️';
  const location = `${violation.file}:${violation.line}:${violation.column}`;

  return `${icon} ${location}
   ${violation.message}
   💡 ${violation.suggestion}${violation.code ? `\n   ${violation.code}` : ''}`;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check for explicit 'any' types
 */
function checkExplicitAny(sourceFile: SourceFile, violations: Violation[]): void {
  sourceFile.forEachDescendant((node: Node) => {
    if (node.getKind() === SyntaxKind.AnyKeyword) {
      const parent = node.getParent();

      // Skip if approved
      if (hasApprovalComment(parent ?? node)) {
        return;
      }

      const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: 'Explicit "any" type detected',
        suggestion: 'Use "unknown" and narrow with type guards, or define a proper type',
        code: parent?.getText().substring(0, 80),
        severity: 'critical',
      });
    }
  });
}

/**
 * Check for @ts-ignore comments without approval
 */
function checkTsIgnore(sourceFile: SourceFile, violations: Violation[]): void {
  const processedComments = new Set<number>();

  sourceFile.forEachDescendant((node: Node) => {
    const leadingComments = node.getLeadingCommentRanges();

    for (const comment of leadingComments) {
      const commentPos = comment.getPos();

      // Skip if we've already processed this comment
      if (processedComments.has(commentPos)) {
        continue;
      }

      const text = comment.getText();
      if (text.includes('@ts-ignore')) {
        processedComments.add(commentPos);

        // Skip if approved
        if (hasApprovalComment(node)) {
          continue;
        }

        const { line, column } = sourceFile.getLineAndColumnAtPos(commentPos);

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: '@ts-ignore without approval',
          suggestion: `Use @ts-expect-error with explanation, or add approval: // ${CONFIG.approvalComment}: TICKET-123 Reason`,
          code: text.trim().substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });
}

/**
 * Check for non-null assertions (!) without justification
 */
function checkNonNullAssertions(sourceFile: SourceFile, violations: Violation[]): void {
  sourceFile.forEachDescendant((node: Node) => {
    if (node.getKind() === SyntaxKind.NonNullExpression) {
      // Skip if approved
      if (hasApprovalComment(node)) {
        return;
      }

      const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: 'Non-null assertion (!) without justification',
        suggestion:
          'Use optional chaining (?.) and nullish coalescing (??), or add approval comment',
        code: node.getText().substring(0, 80),
        severity: 'critical',
      });
    }
  });
}

/**
 * Check for missing return types on public methods/functions
 */
function checkMissingReturnTypes(sourceFile: SourceFile, violations: Violation[]): void {
  // Check class methods
  sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
    classDecl.getMethods().forEach((method: MethodDeclaration) => {
      // Skip private methods
      if (method.hasModifier(SyntaxKind.PrivateKeyword)) {
        return;
      }

      // Skip methods starting with _ (private by convention)
      if (method.getName().startsWith('_')) {
        return;
      }

      // Skip lifecycle methods (Lit)
      const litLifecycleMethods = [
        'connectedCallback',
        'disconnectedCallback',
        'firstUpdated',
        'updated',
        'willUpdate',
        'render',
      ];
      if (litLifecycleMethods.includes(method.getName())) {
        return;
      }

      // Skip if approved
      if (hasApprovalComment(method)) {
        return;
      }

      // Check if return type is explicit
      if (!method.getReturnTypeNode()) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());
        const returnType = method.getReturnType().getText();

        // Only flag if return type is not void
        if (returnType !== 'void' && returnType !== 'undefined') {
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Public method "${method.getName()}" missing explicit return type`,
            suggestion: `Add return type: ${method.getName()}(): ${returnType}`,
            code: method.getText().split('\n')[0].substring(0, 80),
            severity: 'critical',
          });
        }
      }
    });
  });

  // Check standalone exported functions
  sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
    if (!func.isExported()) {
      return;
    }

    if (hasApprovalComment(func)) {
      return;
    }

    if (!func.getReturnTypeNode()) {
      const returnType = func.getReturnType().getText();
      if (returnType !== 'void' && returnType !== 'undefined') {
        const { line, column } = sourceFile.getLineAndColumnAtPos(func.getStart());
        const funcName = func.getName() ?? '<anonymous>';

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Exported function "${funcName}" missing explicit return type`,
          suggestion: `Add return type: ${funcName}(): ${returnType}`,
          code: func.getText().split('\n')[0].substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });

  // Check exported arrow functions and function expressions
  sourceFile.getVariableDeclarations().forEach((varDecl) => {
    const initializer = varDecl.getInitializer();
    if (!initializer) {
      return;
    }

    const isArrowOrFunction =
      Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer);

    if (isArrowOrFunction) {
      const func = initializer as ArrowFunction | FunctionExpression;

      // Check if exported
      const parent = varDecl.getParent()?.getParent();
      if (!parent || !Node.isVariableStatement(parent) || !parent.isExported()) {
        return;
      }

      if (hasApprovalComment(func)) {
        return;
      }

      if (!func.getReturnTypeNode()) {
        const returnType = func.getReturnType().getText();
        if (returnType !== 'void' && returnType !== 'undefined') {
          const { line, column } = sourceFile.getLineAndColumnAtPos(func.getStart());
          const varName = varDecl.getName();

          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Exported function "${varName}" missing explicit return type`,
            suggestion: `Add return type: const ${varName}: (...) => ${returnType}`,
            code: varDecl.getText().split('\n')[0].substring(0, 80),
            severity: 'critical',
          });
        }
      }
    }
  });
}

/**
 * Check for missing parameter types
 */
function checkMissingParameterTypes(sourceFile: SourceFile, violations: Violation[]): void {
  const checkParameters = (
    params: ParameterDeclaration[],
    funcNode: MethodDeclaration | FunctionDeclaration | ArrowFunction | FunctionExpression,
    funcName: string,
  ): void => {
    params.forEach((param) => {
      if (!param.getTypeNode()) {
        // Skip if parameter has default value (type can be inferred)
        if (param.hasInitializer()) {
          return;
        }

        // Skip if approved
        if (hasApprovalComment(funcNode)) {
          return;
        }

        const { line, column } = sourceFile.getLineAndColumnAtPos(param.getStart());

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Parameter "${param.getName()}" in ${funcName} missing type annotation`,
          suggestion: 'Add type annotation: param: Type',
          code: funcNode.getText().split('\n')[0].substring(0, 80),
          severity: 'critical',
        });
      }
    });
  };

  // Check class methods
  sourceFile.getClasses().forEach((classDecl: ClassDeclaration) => {
    classDecl.getMethods().forEach((method: MethodDeclaration) => {
      checkParameters(method.getParameters(), method, `method "${method.getName()}"`);
    });
  });

  // Check functions
  sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
    const funcName = func.getName() ?? '<anonymous>';
    checkParameters(func.getParameters(), func, `function "${funcName}"`);
  });

  // Check arrow functions and function expressions
  sourceFile.getVariableDeclarations().forEach((varDecl) => {
    const initializer = varDecl.getInitializer();
    if (!initializer) {
      return;
    }

    const isArrowOrFunction =
      Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer);

    if (isArrowOrFunction) {
      const func = initializer as ArrowFunction | FunctionExpression;
      const varName = varDecl.getName();
      checkParameters(func.getParameters(), func, `function "${varName}"`);
    }
  });
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

async function validateTypeCheckStrict(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const stagedFiles = deps.getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('ℹ️  No TypeScript files staged for commit');
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
    console.log(`📁 Checking ${stagedFiles.length} file(s) for TypeScript strict violations...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  const violations: Violation[] = [];

  // Analyze each staged file
  for (const filePath of stagedFiles) {
    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      console.warn(`⚠️  Timeout reached (${CONFIG.timeoutMs}ms). Remaining files not checked.`);
      break;
    }

    try {
      const sourceFile = project.addSourceFileAtPath(filePath);

      // Run all checks
      checkExplicitAny(sourceFile, violations);
      checkTsIgnore(sourceFile, violations);
      checkNonNullAssertions(sourceFile, violations);
      checkMissingReturnTypes(sourceFile, violations);
      checkMissingParameterTypes(sourceFile, violations);

      // Remove from project to free memory
      sourceFile.forget();
    } catch (error) {
      console.error(`Failed to analyze ${filePath}:`, error);
    }
  }

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  const elapsedTime = Date.now() - startTime;
  if (!silent) {
    console.log(`⏱️  Completed in ${elapsedTime}ms`);
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

  if (!outputJson) {
    console.log('🔍 TypeScript Hook: type-check-strict (H01)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateTypeCheckStrict(defaultDeps, outputJson);

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
    console.log('✅ No TypeScript strict violations found');
    console.log('');
    process.exit(0);
  }

  // Print violations grouped by severity
  const criticalViolations = result.violations.filter((v) => v.severity === 'critical');
  const warningViolations = result.violations.filter((v) => v.severity === 'warning');

  if (criticalViolations.length > 0) {
    console.log(`🔴 Found ${criticalViolations.length} critical violation(s):`);
    console.log('');
    criticalViolations.forEach((violation) => {
      console.log(formatViolation(violation));
      console.log('');
    });
  }

  if (warningViolations.length > 0) {
    console.log(`⚠️  Found ${warningViolations.length} warning(s):`);
    console.log('');
    warningViolations.forEach((violation) => {
      console.log(formatViolation(violation));
      console.log('');
    });
  }

  // Summary
  console.log('━'.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Files checked: ${result.stats.filesChecked}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical: ${result.stats.criticalViolations}`);
  console.log(`   Warnings: ${result.stats.warningViolations}`);
  console.log('');

  if (result.passed) {
    console.log('⚠️  Warnings found, but commit allowed');
    console.log('   Please fix these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Commit blocked due to critical violations');
    console.log('');
    console.log('💡 To fix:');
    console.log('   1. Replace "any" with "unknown" and add type guards');
    console.log('   2. Replace "@ts-ignore" with "@ts-expect-error" and explanation');
    console.log('   3. Remove non-null assertions (!) or add justification');
    console.log('   4. Add explicit return types to public methods/functions');
    console.log('   5. Add type annotations to all parameters');
    console.log('');
    console.log('🚨 Emergency bypass (NOT recommended):');
    console.log('   git commit --no-verify');
    console.log('');
    console.log('✅ Approved exceptions:');
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
  validateTypeCheckStrict,
  checkExplicitAny,
  checkTsIgnore,
  checkNonNullAssertions,
  checkMissingReturnTypes,
  checkMissingParameterTypes,
  hasApprovalComment,
};

export type { Violation, ValidationResult, HookDependencies };
