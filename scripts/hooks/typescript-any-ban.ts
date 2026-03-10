#!/usr/bin/env tsx
/**
 * Hook: typescript-any-ban (H17)
 *
 * Blocks TypeScript `any` types in component code.
 * Execution budget: <1 second
 *
 * Catches:
 * - Explicit `any` types: `const foo: any = ...`
 * - Function parameters: `function bar(param: any)`
 * - Return types: `function baz(): any`
 * - Generic type arguments: `Array<any>`, `Promise<any>`, `Record<string, any>`
 * - Type assertions: `as any`
 * - Function type (equivalent to any): `Function`
 * - Missing parameter types (implicit any)
 * - Missing return types on public methods/functions (implicit any)
 *
 * Allows:
 * - Test files (*.test.ts, *.spec.ts)
 * - Story files (*.stories.ts)
 * - Type definition files (*.d.ts)
 * - Explicit approvals: // @any-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/typescript-any-ban.ts
 *   tsx scripts/hooks/typescript-any-ban.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:typescript-any-ban
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
    '**/.next/**',
    '**/.cache/**',
  ],

  // Approval mechanism for exceptional cases
  approvalComment: '@any-approved',

  // Performance: execution budget
  timeoutMs: 1000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Convert glob pattern to regex
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
const excludeRegexes = CONFIG.excludePatterns.map(globToRegex);

/**
 * Get list of staged TypeScript files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'))
      .filter((file) => !excludeRegexes.some((regex) => regex.test(file)))
      .filter((file) => existsSync(file));
  } catch (error) {
    console.error('[ERROR] Failed to get staged files:', error);
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

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check for explicit 'any' types
 */
export function checkExplicitAny(sourceFile: SourceFile, violations: Violation[]): void {
  sourceFile.forEachDescendant((node: Node) => {
    if (node.getKind() === SyntaxKind.AnyKeyword) {
      const parent = node.getParent();

      // Skip if approved
      if (hasApprovalComment(parent ?? node)) {
        return;
      }

      const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

      // Determine context for better error messages
      let context = 'type annotation';
      let suggestion = 'Use "unknown" and narrow with type guards, or define a specific type';

      if (parent) {
        const parentKind = parent.getKind();

        if (parentKind === SyntaxKind.Parameter) {
          context = 'function parameter';
          suggestion = 'Add explicit parameter type (e.g., string, number, CustomType)';
        } else {
          const grandParent = parent.getParent();
          const grandParentText = grandParent?.getText() ?? parent.getText();

          if (grandParentText.includes('Array<any>')) {
            context = 'Array type';
            suggestion = 'Use specific array type: Array<Type> or Type[]';
          } else if (grandParentText.includes('Promise<any>')) {
            context = 'Promise type';
            suggestion = 'Use specific Promise type: Promise<Type>';
          } else if (grandParentText.includes('Record<')) {
            context = 'Record type';
            suggestion = 'Use specific Record type: Record<string, Type>';
          } else if (grandParent && grandParent.getKind() === SyntaxKind.AsExpression) {
            context = 'type assertion';
            suggestion = 'Remove "as any" and use proper typing with type guards';
          }
        }
      }

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Explicit "any" type in ${context}`,
        suggestion,
        code: parent?.getText().substring(0, 80),
        severity: 'critical',
      });
    }
  });
}

/**
 * Check for Function type (equivalent to any)
 */
export function checkFunctionType(sourceFile: SourceFile, violations: Violation[]): void {
  sourceFile.forEachDescendant((node: Node) => {
    const text = node.getText();

    // Match standalone "Function" type (not "FunctionComponent" etc.)
    if (text === 'Function' && node.getKind() === SyntaxKind.Identifier) {
      const parent = node.getParent();

      // Only flag if it's used as a type annotation
      if (parent?.getKind() === SyntaxKind.TypeReference) {
        if (hasApprovalComment(parent)) {
          return;
        }

        const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: '"Function" type is equivalent to "any"',
          suggestion: 'Use specific function signature: (param: Type) => ReturnType',
          code: parent.getText().substring(0, 80),
          severity: 'critical',
        });
      }
    }
  });
}

/**
 * Check for missing return types on public methods/functions
 */
export function checkMissingReturnTypes(sourceFile: SourceFile, violations: Violation[]): void {
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

      // Skip Lit lifecycle methods (known return types)
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
export function checkMissingParameterTypes(sourceFile: SourceFile, violations: Violation[]): void {
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

        // Skip destructured params with object binding pattern (common in tests)
        if (param.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern) {
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
      // Skip private methods
      if (method.hasModifier(SyntaxKind.PrivateKeyword)) {
        return;
      }
      if (method.getName().startsWith('_')) {
        return;
      }

      checkParameters(method.getParameters(), method, `method "${method.getName()}"`);
    });
  });

  // Check exported functions
  sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
    if (!func.isExported()) {
      return;
    }

    const funcName = func.getName() ?? '<anonymous>';
    checkParameters(func.getParameters(), func, `function "${funcName}"`);
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

export async function validateTypeScriptAnyBan(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const allStagedFiles = deps.getStagedFiles();

  // Apply filtering (exclude test files, stories, etc.)
  const stagedFiles = allStagedFiles.filter(
    (file) => !excludeRegexes.some((regex) => regex.test(file)),
  );

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('[INFO] No TypeScript files staged for commit');
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
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for "any" types...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  const violations: Violation[] = [];

  // Analyze each staged file
  for (const filePath of stagedFiles) {
    // Timeout check
    if (Date.now() - startTime > CONFIG.timeoutMs) {
      console.warn(
        `[WARNING] Timeout reached (${CONFIG.timeoutMs}ms). Remaining files not checked.`,
      );
      break;
    }

    try {
      const sourceFile = project.addSourceFileAtPath(filePath);

      // Run all checks
      checkExplicitAny(sourceFile, violations);
      checkFunctionType(sourceFile, violations);
      checkMissingReturnTypes(sourceFile, violations);
      checkMissingParameterTypes(sourceFile, violations);

      // Remove from project to free memory
      sourceFile.forget();
    } catch (error) {
      console.error(`[ERROR] Failed to analyze ${filePath}:`, error);
    }
  }

  const criticalViolations = violations.filter((v) => v.severity === 'critical');
  const warningViolations = violations.filter((v) => v.severity === 'warning');

  const elapsedTime = Date.now() - startTime;
  if (!silent) {
    console.log(`[INFO] Completed in ${elapsedTime}ms`);
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
    console.log('[HOOK] typescript-any-ban (H17)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateTypeScriptAnyBan(defaultDeps, outputJson);

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
    console.log('[PASS] No "any" types detected');
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
    console.log('   1. Replace "any" with "unknown" and add type guards');
    console.log('   2. Replace "Function" with explicit function signatures');
    console.log('   3. Add type annotations to all parameters');
    console.log('   4. Add explicit return types to public methods/functions');
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
    console.error('[ERROR] Unexpected error:', error);
    process.exit(1);
  });
}

// Export for testing
export type { Violation, ValidationResult, HookDependencies };
