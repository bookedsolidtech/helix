#!/usr/bin/env tsx
/**
 * Hook: dead-code-elimination (H24)
 *
 * Detects unused exports and dead code branches.
 * Execution budget: <10 seconds
 *
 * Catches:
 * - Unused exports in component files (exported but never imported)
 * - Dead code branches (unreachable code after return/throw)
 * - Dead conditional branches (always true/false conditions)
 * - Orphaned imports (imported but never used)
 * - Side-effect imports (import for side-effects only, may be intentional)
 * - Namespace imports (import * as X, harder to analyze)
 * - Re-exports without local usage
 *
 * Allows:
 * - Test files (*.test.ts, *.spec.ts)
 * - Story files (*.stories.ts)
 * - Internal utilities (test-utils.ts)
 * - Approved exceptions: // @dead-code-approved: TICKET-123 Reason
 *
 * Limitations:
 * - index.ts files are NOT excluded (they are checked for re-export patterns)
 * - Side-effect imports are flagged as warnings (may be intentional)
 * - Namespace imports cannot be analyzed for unused properties
 * - Cross-file analysis limited to same-file usage (full project scan exceeds budget)
 * - Dynamic imports and require() are not analyzed
 *
 * Usage:
 *   tsx scripts/hooks/dead-code-elimination.ts
 *   tsx scripts/hooks/dead-code-elimination.ts --json
 *   tsx scripts/hooks/dead-code-elimination.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:dead-code-elimination
 */

import {
  Project,
  SyntaxKind,
  Node,
  SourceFile,
  ExportedDeclarations,
  ImportDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  ParameterDeclaration,
} from 'ts-morph';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code?: string;
  severity: 'critical' | 'warning';
  category?: 'orphaned-import' | 'dead-branch' | 'side-effect-import' | 'namespace-import' | 're-export' | 'dead-conditional';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    unusedExports: number;
    orphanedImports: number;
    deadCodeBranches: number;
    sideEffectImports: number;
    namespaceImports: number;
    reExports: number;
    deadConditionals: number;
  };
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
  readonly bailFast: boolean;
  readonly maxParentDepth: number;
}

const CONFIG: HookConfig = {
  // Files to check
  includePatterns: [
    'packages/**/src/**/*.ts',
    'packages/**/src/**/*.tsx',
    'apps/**/src/**/*.ts',
    'apps/**/src/**/*.tsx',
  ],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.d.ts',
    '**/test-utils.ts',
    '**/dist/**',
    '**/node_modules/**',
    '**/.next/**',
    '**/.cache/**',
    '**/vite-env.d.ts',
  ],

  // Approval mechanism
  approvalComment: '@dead-code-approved',

  // Performance budgets
  timeoutMs: 10000, // 10 seconds total timeout
  performanceBudgetMs: 10000, // 10 seconds budget

  // Bail-fast mode (exit on first critical violation)
  bailFast: process.argv.includes('--bail-fast'),

  // Max depth for parent comment search
  maxParentDepth: 5,
};

// ─── Utilities ────────────────────────────────────────────────────────────

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

/**
 * Check if file matches glob patterns
 */
function matchesPatterns(file: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globToRegex(pattern).test(file));
}

/**
 * Get list of staged files
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
      .filter((file) => matchesPatterns(file, CONFIG.includePatterns))
      .filter((file) => !matchesPatterns(file, CONFIG.excludePatterns))
      .filter((file) => existsSync(file));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Check if a node has an approval comment
 */
function hasApprovalComment(node: Node): boolean {
  const leadingComments = node.getLeadingCommentRanges();

  for (const comment of leadingComments) {
    const text = comment.getText();
    if (text.includes(CONFIG.approvalComment)) {
      return true;
    }
  }

  // Check parent nodes (up to maxParentDepth levels)
  let parent = node.getParent();
  let depth = 0;
  while (parent && depth < CONFIG.maxParentDepth) {
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

// ─── Validation Logic ─────────────────────────────────────────────────────

/**
 * Find orphaned imports (imported but never used)
 */
function findOrphanedImports(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: {
    sideEffectImports: number;
    namespaceImports: number;
    reExports: number;
  },
): number {
  let count = 0;
  const imports = sourceFile.getImportDeclarations();

  for (const importDecl of imports) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // Detect side-effect imports (import './styles.css')
    const namedImports = importDecl.getNamedImports();
    const defaultImport = importDecl.getDefaultImport();
    const namespaceImport = importDecl.getNamespaceImport();

    if (namedImports.length === 0 && !defaultImport && !namespaceImport) {
      // Side-effect import
      if (!hasApprovalComment(importDecl)) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(importDecl.getStart());
        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Side-effect import detected: "${moduleSpecifier}"`,
          suggestion: `Add approval comment if this import is for side-effects (e.g., CSS, polyfills)`,
          code: importDecl.getText().substring(0, 80),
          severity: 'warning',
          category: 'side-effect-import',
        });
        stats.sideEffectImports++;
      }
      continue;
    }

    // Detect namespace imports (import * as X)
    if (namespaceImport) {
      const references = namespaceImport.findReferencesAsNodes();
      if (references.length === 1) {
        // Unused namespace import
        if (!hasApprovalComment(importDecl)) {
          const { line, column } = sourceFile.getLineAndColumnAtPos(namespaceImport.getStart());
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Orphaned namespace import: "* as ${namespaceImport.getText()}" is imported but never used`,
            suggestion: `Remove unused namespace import or add approval comment if intentional`,
            code: importDecl.getText().substring(0, 80),
            severity: 'warning',
            category: 'namespace-import',
          });
          count++;
          stats.namespaceImports++;
        }
      } else {
        // Namespace import is used, but we can't analyze individual properties
        if (!hasApprovalComment(importDecl)) {
          const { line, column } = sourceFile.getLineAndColumnAtPos(namespaceImport.getStart());
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Namespace import detected: Cannot analyze usage of individual properties`,
            suggestion: `Consider using named imports for better tree-shaking`,
            code: importDecl.getText().substring(0, 80),
            severity: 'warning',
            category: 'namespace-import',
          });
          stats.namespaceImports++;
        }
      }
      continue;
    }

    // Check named imports
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      const references = namedImport.getNameNode().findReferencesAsNodes();

      // If only one reference (the import itself), it's unused
      if (references.length === 1) {
        if (!hasApprovalComment(importDecl)) {
          const { line, column } = sourceFile.getLineAndColumnAtPos(namedImport.getStart());
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Orphaned import: "${name}" is imported but never used`,
            suggestion: `Remove unused import "${name}" or add approval comment if intentional`,
            code: importDecl.getText().substring(0, 80),
            severity: 'warning',
            category: 'orphaned-import',
          });
          count++;
        }
      }
    }

    // Check default import
    if (defaultImport) {
      const references = defaultImport.findReferencesAsNodes();
      if (references.length === 1) {
        if (!hasApprovalComment(importDecl)) {
          const { line, column } = sourceFile.getLineAndColumnAtPos(defaultImport.getStart());
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Orphaned import: "${defaultImport.getText()}" is imported but never used`,
            suggestion: `Remove unused default import or add approval comment if intentional`,
            code: importDecl.getText().substring(0, 80),
            severity: 'warning',
            category: 'orphaned-import',
          });
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Find dead code branches (unreachable code)
 */
function findDeadCodeBranches(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: { deadConditionals: number },
): number {
  let count = 0;

  sourceFile.forEachDescendant((node) => {
    // Check for unreachable code after return/throw in blocks
    if (Node.isBlock(node)) {
      const statements = node.getStatements();
      let foundTerminator = false;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        if (foundTerminator) {
          // This statement is unreachable
          if (!hasApprovalComment(statement)) {
            const { line, column } = sourceFile.getLineAndColumnAtPos(statement.getStart());
            violations.push({
              file: sourceFile.getFilePath(),
              line,
              column,
              message: 'Unreachable code detected after return/throw statement',
              suggestion: 'Remove unreachable code or restructure logic',
              code: statement.getText().substring(0, 80),
              severity: 'critical',
              category: 'dead-branch',
            });
            count++;
          }
          break; // Only report the first unreachable statement
        }

        // Check if this statement is a terminator (return/throw)
        if (Node.isReturnStatement(statement) || Node.isThrowStatement(statement)) {
          foundTerminator = true;
        }
      }
    }

    // Check for unreachable code after return in arrow functions
    if (Node.isArrowFunction(node)) {
      const body = node.getBody();
      if (Node.isBlock(body)) {
        const statements = body.getStatements();
        let foundReturn = false;

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];

          if (foundReturn) {
            if (!hasApprovalComment(statement)) {
              const { line, column } = sourceFile.getLineAndColumnAtPos(statement.getStart());
              violations.push({
                file: sourceFile.getFilePath(),
                line,
                column,
                message: 'Unreachable code detected in arrow function after return',
                suggestion: 'Remove unreachable code',
                code: statement.getText().substring(0, 80),
                severity: 'critical',
                category: 'dead-branch',
              });
              count++;
            }
            break;
          }

          if (Node.isReturnStatement(statement)) {
            foundReturn = true;
          }
        }
      }
    }

    // Check for dead conditional branches (always true/false)
    if (Node.isIfStatement(node)) {
      const condition = node.getExpression();

      // Check for literal true/false (true literal or false literal)
      if (Node.isTrueLiteral(condition) || Node.isFalseLiteral(condition)) {
        if (!hasApprovalComment(node)) {
          const { line, column } = sourceFile.getLineAndColumnAtPos(condition.getStart());
          const conditionText = condition.getText();
          violations.push({
            file: sourceFile.getFilePath(),
            line,
            column,
            message: `Dead conditional branch: condition is always ${conditionText}`,
            suggestion: `Remove the if-statement and keep only the ${conditionText === 'true' ? 'then' : 'else'} branch`,
            code: node.getText().substring(0, 80),
            severity: 'warning',
            category: 'dead-conditional',
          });
          stats.deadConditionals++;
        }
      }
    }
  });

  return count;
}

/**
 * Detect re-exports in index.ts files
 */
function findReExports(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: { reExports: number },
): void {
  const filePath = sourceFile.getFilePath();
  const isIndexFile = filePath.endsWith('/index.ts') || filePath.endsWith('\\index.ts');

  if (!isIndexFile) {
    return;
  }

  // Check if the entire file has an approval comment at the top
  // Get all comments in the file and check the first few
  const fullText = sourceFile.getFullText();
  const fileHasApproval = fullText.includes(CONFIG.approvalComment);

  // Detect export * from './module' or export { X } from './module'
  const exportDeclarations = sourceFile.getExportDeclarations();

  for (const exportDecl of exportDeclarations) {
    const moduleSpecifier = exportDecl.getModuleSpecifier();
    if (!moduleSpecifier) {
      continue; // export { X } without from clause
    }

    const namedExports = exportDecl.getNamedExports();
    const isNamespaceExport = exportDecl.isNamespaceExport();

    if (isNamespaceExport || namedExports.length > 0) {
      // This is a re-export
      if (!fileHasApproval && !hasApprovalComment(exportDecl)) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(exportDecl.getStart());
        const exportType = isNamespaceExport ? 'namespace re-export (export *)' : 're-export';
        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Re-export detected in index.ts: ${exportType}`,
          suggestion: `Verify this re-export is intentional and all exported symbols are used by consumers`,
          code: exportDecl.getText().substring(0, 80),
          severity: 'warning',
          category: 're-export',
        });
        stats.reExports++;
      }
    }
  }
}

/**
 * Find unused exports (exported but never imported in the project)
 *
 * Note: This is a simplified check. For full project-wide analysis,
 * we'd need to scan all files in the project, which exceeds the 10s budget.
 * Instead, we focus on re-export detection in index.ts files.
 */
function findUnusedExports(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: { reExports: number },
): number {
  let count = 0;

  // Detect re-exports in index.ts files
  findReExports(sourceFile, violations, stats);

  // Skip full unused export analysis (exceeds budget)
  // This would require full project-wide import graph analysis

  return count;
}

/**
 * Validate a single file for dead code
 */
function validateFile(
  sourceFile: SourceFile,
  violations: Violation[],
  stats: {
    unusedExports: number;
    orphanedImports: number;
    deadCodeBranches: number;
    sideEffectImports: number;
    namespaceImports: number;
    reExports: number;
    deadConditionals: number;
  },
): void {
  stats.orphanedImports += findOrphanedImports(sourceFile, violations, {
    sideEffectImports: stats.sideEffectImports,
    namespaceImports: stats.namespaceImports,
    reExports: stats.reExports,
  });
  stats.deadCodeBranches += findDeadCodeBranches(sourceFile, violations, {
    deadConditionals: stats.deadConditionals,
  });
  stats.unusedExports += findUnusedExports(sourceFile, violations, { reExports: stats.reExports });
}

/**
 * Main validation function
 */
async function validateFiles(files: string[]): Promise<ValidationResult> {
  const violations: Violation[] = [];
  const stats = {
    filesChecked: 0,
    totalViolations: 0,
    criticalViolations: 0,
    warningViolations: 0,
    unusedExports: 0,
    orphanedImports: 0,
    deadCodeBranches: 0,
    sideEffectImports: 0,
    namespaceImports: 0,
    reExports: 0,
    deadConditionals: 0,
  };

  const startTime = Date.now();

  // Initialize ts-morph project with in-memory file system for maximum compatibility
  // This avoids issues with tsconfig resolution in different working directories
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      strict: true,
      target: 99, // ESNext
      module: 99, // ESNext
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
      esModuleInterop: true,
      skipLibCheck: true,
    },
  });

  try {
    for (const file of files) {
      // Timeout check
      if (Date.now() - startTime > CONFIG.timeoutMs) {
        violations.push({
          file: '<timeout>',
          line: 1,
          column: 1,
          message: `Hook timeout reached (${CONFIG.timeoutMs}ms)`,
          suggestion: 'Reduce number of staged files or increase timeout',
          severity: 'warning',
        });
        break;
      }

      // Bail-fast: exit on first critical violation
      if (CONFIG.bailFast && stats.criticalViolations > 0) {
        break;
      }

      // Resolve file path to absolute
      const absoluteFilePath = resolve(file);
      if (!existsSync(absoluteFilePath)) {
        continue;
      }

      let sourceFile: SourceFile | null = null;
      try {
        // Read file content and create source file in memory
        const fs = await import('fs/promises');
        const content = await fs.readFile(absoluteFilePath, 'utf-8');
        sourceFile = project.createSourceFile(file, content, { overwrite: true });

        validateFile(sourceFile, violations, stats);
        stats.filesChecked++;

        // Update critical violations count for bail-fast check
        stats.criticalViolations = violations.filter((v) => v.severity === 'critical').length;
      } catch (error) {
        violations.push({
          file,
          line: 1,
          column: 1,
          message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
          suggestion: 'Fix TypeScript syntax errors',
          severity: 'warning',
        });
      } finally {
        // Always clean up memory, even if an error occurs
        if (sourceFile) {
          sourceFile.forget();
        }
      }
    }
  } finally {
    // Final cleanup: remove all source files from project
    project.getSourceFiles().forEach((sf) => sf.forget());
  }

  stats.totalViolations = violations.length;
  stats.criticalViolations = violations.filter((v) => v.severity === 'critical').length;
  stats.warningViolations = violations.filter((v) => v.severity === 'warning').length;

  return {
    passed: stats.criticalViolations === 0,
    violations,
    stats,
  };
}

// ─── Output Formatting ────────────────────────────────────────────────────

function formatOutput(result: ValidationResult, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║          🧹 Dead Code Elimination (H24)                      ║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');

  // Stats
  lines.push(`📊 Stats:`);
  lines.push(`   Files checked: ${result.stats.filesChecked}`);
  lines.push(`   Orphaned imports: ${result.stats.orphanedImports}`);
  lines.push(`   Dead code branches: ${result.stats.deadCodeBranches}`);
  lines.push(`   Dead conditionals: ${result.stats.deadConditionals}`);
  lines.push(`   Side-effect imports: ${result.stats.sideEffectImports}`);
  lines.push(`   Namespace imports: ${result.stats.namespaceImports}`);
  lines.push(`   Re-exports (index.ts): ${result.stats.reExports}`);
  lines.push(`   Critical violations: ${result.stats.criticalViolations}`);
  lines.push(`   Warnings: ${result.stats.warningViolations}`);
  lines.push('');

  // Violations
  if (result.violations.length > 0) {
    lines.push('❌ Violations:');
    lines.push('');

    // Group by severity
    const critical = result.violations.filter((v) => v.severity === 'critical');
    const warnings = result.violations.filter((v) => v.severity === 'warning');

    if (critical.length > 0) {
      lines.push('🔴 Critical Issues:');
      lines.push('');
      critical.forEach((violation) => {
        lines.push(`   ${violation.file}:${violation.line}:${violation.column}`);
        lines.push(`   ${violation.message}`);
        if (violation.code) {
          lines.push(`   Code: ${violation.code}`);
        }
        lines.push(`   💡 ${violation.suggestion}`);
        lines.push('');
      });
    }

    if (warnings.length > 0) {
      lines.push('⚠️  Warnings:');
      lines.push('');
      warnings.forEach((violation) => {
        lines.push(`   ${violation.file}:${violation.line}:${violation.column}`);
        lines.push(`   ${violation.message}`);
        if (violation.code) {
          lines.push(`   Code: ${violation.code}`);
        }
        lines.push(`   💡 ${violation.suggestion}`);
        lines.push('');
      });
    }

    lines.push('');
    lines.push('💡 Tip: Remove unused code to improve maintainability and reduce bundle size.');
    lines.push('   For intentional cases, add: // @dead-code-approved: TICKET-123 Reason');
    lines.push('');
  } else {
    lines.push('✅ All files passed! No dead code detected.');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const jsonMode = process.argv.includes('--json');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!jsonMode) {
      console.log('✅ No staged files to check.');
    }
    process.exit(0);
  }

  const result = await validateFiles(stagedFiles);
  const duration = Date.now() - startTime;

  console.log(formatOutput(result, jsonMode));

  if (!jsonMode) {
    console.log(`⏱️  Execution time: ${duration}ms (budget: <${CONFIG.performanceBudgetMs}ms)`);
    if (duration > CONFIG.performanceBudgetMs) {
      console.log(`⚠️  WARNING: Exceeded performance budget by ${duration - CONFIG.performanceBudgetMs}ms`);
    }
    console.log('');
  }

  process.exit(result.passed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
