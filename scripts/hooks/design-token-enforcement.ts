#!/usr/bin/env tsx
/**
 * Hook: design-token-enforcement (H13)
 *
 * Enforces design token architecture and best practices.
 * Execution budget: <2 seconds
 *
 * Catches:
 * - Primitive tokens used directly (should use semantic tokens)
 * - Missing semantic fallbacks in component tokens
 * - Non-existent tokens (typos, undefined)
 * - Token naming violations (missing --hx- prefix)
 * - Invalid fallback chains (wrong tier order)
 *
 * Allows:
 * - Semantic tokens: --hx-color-primary, --hx-spacing-md
 * - Component tokens with fallbacks: var(--hx-button-bg, var(--hx-color-primary))
 * - Internal component tokens: --_internal-state
 * - Approved exceptions: // @design-token-approved: TICKET-123 Reason
 *
 * Three-tier cascade:
 * 1. Primitive (raw values) → --hx-color-neutral-900, --hx-space-4
 * 2. Semantic (design tokens) → --hx-color-primary, --hx-spacing-md
 * 3. Component (overrides) → --hx-button-bg, --hx-card-padding
 *
 * Usage:
 *   tsx scripts/hooks/design-token-enforcement.ts
 *   tsx scripts/hooks/design-token-enforcement.ts --json
 *   tsx scripts/hooks/design-token-enforcement.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:design-token-enforcement
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
    tokensChecked: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
}

interface TokenUsage {
  token: string;
  fallback: string | null;
  line: number;
  column: number;
  code: string;
  allTokens: string[]; // All tokens in the fallback chain (for recursive validation)
}

interface TokenRegistry {
  primitive: {
    patterns: string[];
    tokens: string[];
  };
  semantic: {
    patterns: string[];
    tokens: string[];
  };
  component: {
    patterns: string[];
    tokens: string[];
  };
  all: string[];
}

// ─── Token Registry Loading ───────────────────────────────────────────────

/**
 * Load token registry generated from packages/hx-tokens/dist/tokens.css
 * This ensures validation against actual token definitions, not hardcoded patterns.
 */
function loadTokenRegistry(): TokenRegistry {
  const registryPath = join(process.cwd(), 'scripts/hooks/token-registry.json');

  if (!existsSync(registryPath)) {
    throw new Error(
      `Token registry not found at ${registryPath}. Run: npm run hooks:generate-token-registry`,
    );
  }

  const content = readFileSync(registryPath, 'utf-8');
  return JSON.parse(content) as TokenRegistry;
}

// Load registry at module initialization (cached for performance)
const TOKEN_REGISTRY: TokenRegistry = loadTokenRegistry();

// Convert pattern strings to RegExp objects
const PRIMITIVE_PATTERNS: RegExp[] = TOKEN_REGISTRY.primitive.patterns.map((p) => new RegExp(p));
const SEMANTIC_PATTERNS: RegExp[] = TOKEN_REGISTRY.semantic.patterns.map((p) => new RegExp(p));
const COMPONENT_PATTERNS: RegExp[] = TOKEN_REGISTRY.component.patterns.map((p) => new RegExp(p));

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly RegExp[];
  readonly excludePatterns: readonly RegExp[];
  readonly approvalCommentPattern: RegExp;
  readonly tokenPrefix: string;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
}

export const CONFIG: HookConfig = {
  // Files to check (only .styles.ts files in components)
  includePatterns: [/components\/.*\.styles\.ts$/, /styles\/.*\.css$/],
  excludePatterns: [
    /\.test\.ts$/,
    /\.spec\.ts$/,
    /\.stories\.ts$/,
    /\.d\.ts$/,
    /\/dist\//,
    /\/node_modules\//,
    /\/styles\/tokens\//, // Token definition files exempt
  ],

  // Approval mechanism - requires ticket ID for traceability
  // Format: // @design-token-approved: TICKET-123 Reason for approval
  approvalCommentPattern: /@design-token-approved:\s*([A-Z]+-\d+)\s+(.+)/,

  // Required prefix for all tokens
  tokenPrefix: '--hx-',

  // Performance
  timeoutMs: 5000,
  performanceBudgetMs: 2000,
};

// Export for testing
export { TOKEN_REGISTRY };

// ─── Utility Functions ────────────────────────────────────────────────────

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
      .filter((file) => CONFIG.includePatterns.some((pattern) => pattern.test(file)))
      .filter((file) => !CONFIG.excludePatterns.some((pattern) => pattern.test(file)))
      .filter((file) => existsSync(file));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Check if a line has an approval comment with ticket ID
 * Format: // @design-token-approved: TICKET-123 Reason
 */
function hasApprovalComment(lines: string[], lineIndex: number): { approved: boolean; ticket?: string } {
  // Check current line for inline comment
  const currentLine = lines[lineIndex];
  if (currentLine) {
    const match = CONFIG.approvalCommentPattern.exec(currentLine);
    if (match) {
      return { approved: true, ticket: match[1] };
    }
  }

  // Check up to 5 lines above for approval comment
  for (let i = Math.max(0, lineIndex - 5); i < lineIndex; i++) {
    const line = lines[i];
    if (line) {
      const match = CONFIG.approvalCommentPattern.exec(line);
      if (match) {
        return { approved: true, ticket: match[1] };
      }
    }
  }

  return { approved: false };
}

/**
 * Extract CSS content from Lit's css`...` tagged template literals
 */
export function extractCSSContent(content: string): string {
  // Match css`...` tagged template literals
  const cssMatches = content.match(/css`([\s\S]*?)`/g);

  if (!cssMatches) {
    // Fallback to raw content for .css files
    return content;
  }

  // Extract content between backticks
  return cssMatches
    .map((match) => {
      // Remove css` prefix and ` suffix
      return match.slice(4, -1);
    })
    .join('\n');
}

/**
 * Extract all tokens from a var() expression recursively
 * Handles nested var() calls in fallback chains
 */
function extractAllTokensFromVar(varExpression: string): string[] {
  const tokens: string[] = [];
  const tokenRegex = /(--[\w-]+)/g;
  let match;

  while ((match = tokenRegex.exec(varExpression)) !== null) {
    const token = match[1];
    if (token && !tokens.includes(token)) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * Extract all var(--*) token usages from CSS content
 *
 * This extracts top-level var() calls AND recursively extracts all tokens
 * from nested fallback chains for validation.
 */
export function extractTokenUsages(cssContent: string): TokenUsage[] {
  const usages: TokenUsage[] = [];
  const lines = cssContent.split('\n');

  lines.forEach((line, index) => {
    // Find all var() calls manually to handle nested parentheses correctly
    let pos = 0;
    while (pos < line.length) {
      const varStart = line.indexOf('var(', pos);
      if (varStart === -1) break;

      // Find the matching closing paren
      let parenCount = 1;
      let i = varStart + 4; // Start after 'var('
      while (i < line.length && parenCount > 0) {
        if (line[i] === '(') parenCount++;
        if (line[i] === ')') parenCount--;
        i++;
      }

      if (parenCount === 0) {
        // Extract the var() content
        const varContent = line.substring(varStart + 4, i - 1);

        // Split on comma to separate token from fallback
        const commaIndex = varContent.indexOf(',');
        const token = commaIndex >= 0 ? varContent.substring(0, commaIndex).trim() : varContent.trim();
        const fallback = commaIndex >= 0 ? varContent.substring(commaIndex + 1).trim() : null;

        // Extract ALL tokens from the entire var() expression (for recursive validation)
        const allTokens = extractAllTokensFromVar(varContent);

        // Validate token format
        if (token.startsWith('--')) {
          usages.push({
            token,
            fallback,
            line: index + 1,
            column: varStart + 1,
            code: line.trim().substring(0, 100),
            allTokens,
          });
        }
      }

      pos = i;
    }
  });

  return usages;
}

/**
 * Check if a token is a semantic token (using generated registry)
 */
export function isSemanticToken(token: string): boolean {
  return SEMANTIC_PATTERNS.some((pattern) => pattern.test(token));
}

/**
 * Check if a token is a primitive token (using generated registry)
 */
export function isPrimitiveToken(token: string): boolean {
  return PRIMITIVE_PATTERNS.some((pattern) => pattern.test(token));
}

/**
 * Check if a token is a component token (using generated registry)
 */
export function isComponentToken(token: string): boolean {
  return COMPONENT_PATTERNS.some((pattern) => pattern.test(token));
}

/**
 * Check if a token is an internal token (starts with --_)
 */
export function isInternalToken(token: string): boolean {
  return token.startsWith('--_');
}

/**
 * Check if a token exists in the registry (is a known token)
 */
export function isKnownToken(token: string): boolean {
  return TOKEN_REGISTRY.all.includes(token);
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check that tokens have the correct prefix (--hx-)
 */
export function checkTokenPrefix(
  usage: TokenUsage,
  filePath: string,
  violations: Violation[],
): void {
  const { token, line, column, code } = usage;

  // Skip internal tokens
  if (isInternalToken(token)) {
    return;
  }

  // Check prefix
  if (!token.startsWith(CONFIG.tokenPrefix)) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Token "${token}" missing required prefix "${CONFIG.tokenPrefix}"`,
      suggestion: `Rename to "${CONFIG.tokenPrefix}${token.substring(2)}"`,
      code,
      severity: 'critical',
    });
  }
}

/**
 * Check that primitive tokens are not used directly
 */
export function checkPrimitiveUsage(
  usage: TokenUsage,
  filePath: string,
  violations: Violation[],
): void {
  const { token, line, column, code } = usage;

  // Skip internal tokens
  if (isInternalToken(token)) {
    return;
  }

  if (isPrimitiveToken(token)) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Primitive token "${token}" used directly (violates 3-tier cascade)`,
      suggestion: `Use semantic token instead (e.g., --hx-color-primary instead of --hx-color-neutral-900)`,
      code,
      severity: 'critical',
    });
  }
}

/**
 * Check that component tokens have semantic fallbacks
 */
export function checkComponentFallback(
  usage: TokenUsage,
  filePath: string,
  violations: Violation[],
): void {
  const { token, fallback, line, column, code } = usage;

  // Skip internal tokens
  if (isInternalToken(token)) {
    return;
  }

  // Only check component tokens
  if (!isComponentToken(token)) {
    return;
  }

  // Component token must have a fallback
  if (!fallback) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Component token "${token}" missing semantic fallback`,
      suggestion: `Add fallback: var(${token}, var(--hx-color-primary))`,
      code,
      severity: 'warning',
    });
    return;
  }

  // Fallback must be a var() call to a semantic token
  const fallbackTokenMatch = fallback.match(/var\((--[\w-]+)\)/);
  if (!fallbackTokenMatch) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Component token "${token}" fallback is not a semantic token`,
      suggestion: `Use semantic token in fallback: var(${token}, var(--hx-color-primary))`,
      code,
      severity: 'warning',
    });
    return;
  }

  const fallbackToken = fallbackTokenMatch[1];
  if (fallbackToken && !isSemanticToken(fallbackToken)) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Component token "${token}" fallback "${fallbackToken}" is not a semantic token`,
      suggestion: `Use semantic token in fallback chain (e.g., --hx-color-primary, --hx-spacing-md)`,
      code,
      severity: 'warning',
    });
  }
}

/**
 * Check for unknown tokens (typos, undefined tokens)
 */
export function checkUnknownToken(
  usage: TokenUsage,
  filePath: string,
  violations: Violation[],
): void {
  const { token, line, column, code } = usage;

  // Skip internal tokens (not in registry by design)
  if (isInternalToken(token)) {
    return;
  }

  // Check if token exists in registry
  if (!isKnownToken(token)) {
    violations.push({
      file: filePath,
      line,
      column,
      message: `Unknown token "${token}" (not defined in token system)`,
      suggestion: `Check for typos or define token in packages/hx-tokens/. Run: npm run hooks:generate-token-registry`,
      code,
      severity: 'critical',
    });
  }
}

/**
 * Check recursive fallback chains for primitive tokens
 * Allows primitive tokens as FINAL fallback (with raw value), but not in middle of chain.
 * Example violations:
 *   - var(--hx-button-bg, var(--hx-color-neutral-900, var(--hx-color-primary))) // primitive in middle
 * Example OK:
 *   - var(--hx-button-bg, var(--hx-color-primary-500, #2563eb)) // primitive with value OK
 *   - var(--hx-button-bg, var(--hx-color-primary)) // semantic only
 */
export function checkRecursiveFallbacks(
  usage: TokenUsage,
  filePath: string,
  violations: Violation[],
): void {
  const { token, allTokens, fallback, line, column, code } = usage;

  // Skip internal tokens
  if (isInternalToken(token)) {
    return;
  }

  // Only check if we have multiple tokens in the chain
  if (allTokens.length <= 1) {
    return;
  }

  // Check tokens in the middle (not first, not last)
  // First token is the one being checked, last is allowed to be primitive with raw fallback
  if (allTokens.length >= 3) {
    const middleTokens = allTokens.slice(1, -1);
    const primitivesInMiddle = middleTokens.filter((t) => isPrimitiveToken(t));

    if (primitivesInMiddle.length > 0) {
      violations.push({
        file: filePath,
        line,
        column,
        message: `Primitive tokens in middle of fallback chain: ${primitivesInMiddle.join(', ')}`,
        suggestion: `Fallback chains should go: Component → Semantic → Primitive (with value). Remove primitive tokens from middle layers.`,
        code,
        severity: 'critical',
      });
    }
  }
}

/**
 * Validate all tokens in a file
 */
export function validateTokens(
  filePath: string,
  content: string,
  lines: string[],
): Violation[] {
  const violations: Violation[] = [];

  // Extract CSS content
  const cssContent = extractCSSContent(content);

  // Extract all token usages
  const usages = extractTokenUsages(cssContent);

  // For approval checking, we need to map CSS line numbers back to original content
  const contentLines = content.split('\n');

  // Validate each usage
  for (const usage of usages) {
    // Find the line in the original content that contains this token
    // Use a more precise matching strategy: look for the actual code snippet
    let matchingLineIndex = -1;
    const codeSnippet = usage.code.substring(0, 30).trim();

    for (let i = 0; i < contentLines.length; i++) {
      const line = contentLines[i]?.trim() ?? '';
      if (line.includes(codeSnippet)) {
        matchingLineIndex = i;
        break;
      }
    }

    // Skip if approved (with ticket ID validation)
    if (matchingLineIndex >= 0) {
      const approval = hasApprovalComment(contentLines, matchingLineIndex);
      if (approval.approved) {
        continue; // Approved with ticket ID
      }
    }

    // Run all checks
    checkTokenPrefix(usage, filePath, violations);
    checkUnknownToken(usage, filePath, violations);
    checkPrimitiveUsage(usage, filePath, violations);
    checkComponentFallback(usage, filePath, violations);
    checkRecursiveFallbacks(usage, filePath, violations);
  }

  return violations;
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  readFile: (path: string) => readFileSync(path, 'utf-8'),
  fileExists: (path: string) => existsSync(path),
};

// ─── Main Validation ──────────────────────────────────────────────────────

export async function validateDesignTokens(
  deps: HookDependencies = defaultDeps,
  bailFast = false,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const violations: Violation[] = [];
  let tokensChecked = 0;

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
        tokensChecked: 0,
      },
    };
  }

  if (stagedFiles.length === 0) {
    if (!silent) {
      console.log('[INFO] No style files staged for commit');
    }
    return {
      passed: true,
      violations: [],
      stats: {
        filesChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
        tokensChecked: 0,
      },
    };
  }

  if (!silent) {
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for design token violations...`);
    console.log('');
  }

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

    try {
      if (!deps.fileExists(filePath)) {
        continue;
      }

      const content = deps.readFile(filePath);
      const lines = content.split('\n');

      // Validate tokens
      const fileViolations = validateTokens(filePath, content, lines);
      violations.push(...fileViolations);

      // Count tokens checked
      const cssContent = extractCSSContent(content);
      const usages = extractTokenUsages(cssContent);
      tokensChecked += usages.length;

      filesChecked++;

      // Bail fast if critical violation found
      if (bailFast && fileViolations.some((v) => v.severity === 'critical')) {
        if (!silent) {
          console.warn('[BAIL-FAST] Critical violation found, stopping validation');
        }
        break;
      }
    } catch (error) {
      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Failed to analyze file: ${error instanceof Error ? error.message : String(error)}`,
        suggestion: 'Fix file syntax errors or check file permissions',
        severity: 'critical',
      });
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
      tokensChecked,
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
    console.log('[HOOK] design-token-enforcement (H13)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateDesignTokens(defaultDeps, bailFast, outputJson);

  // JSON output mode
  if (outputJson) {
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          hook_id: 'H13',
          hook_name: 'design-token-enforcement',
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
    console.log('[PASS] All design tokens follow architecture guidelines');
    console.log('');
    console.log(`   Files checked: ${result.stats.filesChecked}`);
    console.log(`   Tokens validated: ${result.stats.tokensChecked}`);
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
  console.log(`   Tokens validated: ${result.stats.tokensChecked}`);
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
    console.log('[THREE-TIER CASCADE]');
    console.log('   1. Primitive (raw values) → --hx-color-neutral-900, --hx-space-4');
    console.log('   2. Semantic (design tokens) → --hx-color-primary, --hx-spacing-md');
    console.log('   3. Component (overrides) → --hx-button-bg, --hx-card-padding');
    console.log('');
    console.log('[FIX] To resolve:');
    console.log('   1. Use semantic tokens (--hx-color-primary, --hx-spacing-md)');
    console.log('   2. Component tokens must have semantic fallbacks');
    console.log('   3. Never use primitive tokens directly');
    console.log('   4. All tokens must start with --hx- prefix');
    console.log('');
    console.log('[EXAMPLE]');
    console.log('   ❌ color: var(--hx-color-neutral-900);');
    console.log('   ✅ color: var(--hx-color-primary);');
    console.log('');
    console.log('   ❌ background: var(--hx-button-bg);');
    console.log('   ✅ background: var(--hx-button-bg, var(--hx-color-primary));');
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

// Export types for testing
export type { Violation, ValidationResult, HookDependencies, TokenUsage };
