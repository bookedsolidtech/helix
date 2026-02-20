#!/usr/bin/env tsx
/**
 * Example Hook: no-any-types
 *
 * Demonstrates how to implement a Git hook that prevents `any` types from being committed.
 * This is a reference implementation showing the pattern for all other hooks.
 *
 * Usage:
 *   tsx scripts/hooks/example-no-any-types.ts
 *
 * Integration:
 *   Add to .husky/pre-commit:
 *   npm run hooks:no-any-types
 */

import {
  Project,
  SyntaxKind,
  Node,
  MethodDeclaration,
  FunctionDeclaration,
  SourceFile,
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
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
  };
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files to check (only staged files)
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['**/*.test.ts', '**/*.spec.ts', '**/*.stories.ts', '**/test-utils.ts'],

  // Approval mechanism for exceptional cases
  approvalComment: '@typescript-specialist-approved',

  // Severity levels
  severity: {
    explicitAny: 'critical',
    implicitAny: 'critical',
    functionType: 'critical',
    missingReturnType: 'warning',
  },
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
          !CONFIG.excludePatterns.some((pattern) => file.includes(pattern.replace('**/', ''))),
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

  // Check parent nodes (up to 3 levels)
  let parent = node.getParent();
  let depth = 0;
  while (parent && depth < 3) {
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
  const icon = violation.message.includes('critical') ? '🔴' : '⚠️';
  return `${icon} ${violation.file}:${violation.line}:${violation.column}
   ${violation.message}
   💡 ${violation.suggestion}
   ${violation.code ? `   ${violation.code}` : ''}`;
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
        message: 'Explicit "any" type detected (critical)',
        suggestion: 'Use "unknown" and narrow with type guards, or define a proper type',
        code: parent?.getText().substring(0, 100),
      });
    }
  });
}

/**
 * Check for Function type (equivalent to any)
 */
function checkFunctionType(sourceFile: SourceFile, violations: Violation[]): void {
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
          message: '"Function" type is equivalent to "any" (critical)',
          suggestion: 'Use specific function signature: (param: Type) => ReturnType',
          code: parent.getText(),
        });
      }
    }
  });
}

/**
 * Check for missing return types on public methods
 */
function checkMissingReturnTypes(sourceFile: SourceFile, violations: Violation[]): void {
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

      // Skip if approved
      if (hasApprovalComment(method)) {
        return;
      }

      // Check if return type is explicit
      if (!method.getReturnTypeNode()) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());

        // Only warn if return type is not void
        const returnType = method.getReturnType().getText();
        if (returnType !== 'void' && returnType !== 'undefined') {
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Public method "${method.getName()}" missing explicit return type (warning)`,
            suggestion: `Add return type: ${method.getName()}(): ${returnType}`,
            code: method.getText().split('\n')[0],
          });
        }
      }
    });
  });

  // Also check standalone functions
  sourceFile.getFunctions().forEach((func: FunctionDeclaration) => {
    if (!func.getReturnTypeNode() && !func.isExported()) {
      return; // Skip non-exported functions
    }

    if (hasApprovalComment(func)) {
      return;
    }

    const returnType = func.getReturnType().getText();
    if (returnType !== 'void' && returnType !== 'undefined') {
      const { line, column } = sourceFile.getLineAndColumnAtPos(func.getStart());

      violations.push({
        file: sourceFile.getFilePath(),
        line,
        column,
        message: `Exported function "${func.getName()}" missing explicit return type (warning)`,
        suggestion: `Add return type: ${func.getName()}(): ${returnType}`,
        code: func.getText().split('\n')[0],
      });
    }
  });
}

/**
 * Check for missing parameter types
 */
function checkMissingParameterTypes(sourceFile: SourceFile, violations: Violation[]): void {
  sourceFile.forEachDescendant((node: Node) => {
    // Check functions and methods
    if (
      node.getKind() === SyntaxKind.FunctionDeclaration ||
      node.getKind() === SyntaxKind.MethodDeclaration
    ) {
      const func = node as MethodDeclaration | FunctionDeclaration;

      func.getParameters().forEach((param) => {
        if (!param.getTypeNode()) {
          // Allow destructured params without types in test files
          if (sourceFile.getFilePath().includes('.test.')) {
            return;
          }

          if (hasApprovalComment(func)) {
            return;
          }

          const { line, column } = sourceFile.getLineAndColumnAtPos(param.getStart());

          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Parameter "${param.getName()}" missing type annotation (critical)`,
            suggestion: 'Add type annotation: param: Type',
            code: func.getText().split('\n')[0],
          });
        }
      });
    }
  });
}

// ─── Main Validation ──────────────────────────────────────────────────────

async function validateNoAnyTypes(): Promise<ValidationResult> {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No TypeScript files staged for commit');
    return {
      passed: true,
      violations: [],
      stats: {
        filesChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
      },
    };
  }

  console.log(`📁 Checking ${stagedFiles.length} file(s) for 'any' types...`);
  console.log('');

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: './tsconfig.base.json',
    skipAddingFilesFromTsConfig: true,
  });

  const violations: Violation[] = [];

  // Analyze each staged file
  for (const filePath of stagedFiles) {
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
      console.error(`Failed to analyze ${filePath}:`, error);
    }
  }

  const criticalViolations = violations.filter((v) => v.message.includes('critical'));

  return {
    passed: criticalViolations.length === 0,
    violations,
    stats: {
      filesChecked: stagedFiles.length,
      totalViolations: violations.length,
      criticalViolations: criticalViolations.length,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main() {
  console.log('🔍 TypeScript Hook: no-any-types');
  console.log('━'.repeat(60));
  console.log('');

  const result = await validateNoAnyTypes();

  if (result.violations.length === 0) {
    console.log('✅ No violations found');
    console.log('');
    process.exit(0);
  }

  // Print violations
  console.log(`Found ${result.stats.totalViolations} violation(s):`);
  console.log('');

  result.violations.forEach((violation) => {
    console.log(formatViolation(violation));
    console.log('');
  });

  // Summary
  console.log('━'.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   Files checked: ${result.stats.filesChecked}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical violations: ${result.stats.criticalViolations}`);
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
    console.log('   2. Replace "Function" with explicit function signatures');
    console.log('   3. Add type annotations to all parameters');
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

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

// Export for testing
export { validateNoAnyTypes, checkExplicitAny, checkFunctionType, checkMissingReturnTypes };
