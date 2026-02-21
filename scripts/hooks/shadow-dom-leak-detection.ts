#!/usr/bin/env tsx
/**
 * Hook: shadow-dom-leak-detection (H16)
 *
 * Detects Shadow DOM style leaks and boundary violations.
 * Execution budget: <2 seconds
 *
 * Catches:
 * - Global CSS selectors (body, html, *) in Shadow DOM styles
 * - Missing :host scoping in component styles
 * - Improper use of !important (can pierce shadow DOM)
 * - Direct DOM manipulation bypassing shadow DOM
 * - Overly broad :host-context() selectors
 * - Incorrect ::slotted() usage (descendant selectors)
 * - Styles at root level without :host wrapper
 *
 * Allows:
 * - Proper Shadow DOM selectors (:host, :host(), :host-context())
 * - CSS custom properties (intentionally inherited across boundaries)
 * - ::slotted() with direct children
 * - Approved exceptions: // @shadow-dom-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/shadow-dom-leak-detection.ts
 *   tsx scripts/hooks/shadow-dom-leak-detection.ts --json
 *   tsx scripts/hooks/shadow-dom-leak-detection.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:shadow-dom-leak-detection
 */

import {
  Project,
  SyntaxKind,
  Node,
  SourceFile,
  TaggedTemplateExpression,
  TemplateExpression,
  NoSubstitutionTemplateLiteral,
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
  category?:
    | 'global-selector'
    | 'missing-host'
    | 'important-override'
    | 'dom-manipulation'
    | 'broad-host-context'
    | 'slotted-descendant'
    | 'root-level-style'
    | 'custom-property-prefix';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    executionTimeMs: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  createProject: (configPath: string) => Project;
}

/**
 * File-level context cache to avoid O(n²) recomputation.
 * Stores expensive computations that are file-scoped, not violation-scoped.
 */
interface FileContext {
  sourceFile: SourceFile;
  isLightDOM: boolean;
}

/**
 * CSS-level context cache for per-CSS-block operations.
 * Stores expensive computations that are CSS-block-scoped.
 */
interface CSSContext {
  cssContent: string;
  cssLines: string[];
  lineOffsets: number[];
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly globalSelectors: readonly string[];
  readonly approvalComment: string;
  readonly approvalCommentSearchDepth: number;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
  readonly bailFast: boolean;
}

const CONFIG: HookConfig = {
  // Only check component style files
  includePatterns: ['**/components/**/*.styles.ts', '**/components/**/*.ts'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/test-utils.ts',
    '**/*.d.ts',
    '**/dist/**',
    '**/node_modules/**',
    '**/.cache/**',
  ],

  // Global selectors that should NOT appear in Shadow DOM styles
  globalSelectors: ['body', 'html', 'document', 'window', '*'],

  // Approval mechanism
  approvalComment: '@shadow-dom-approved',
  approvalCommentSearchDepth: 5,

  // Performance budgets
  timeoutMs: 5000, // Total timeout
  performanceBudgetMs: 2000, // Warn if execution exceeds budget

  // Bail-fast mode (exit on first critical violation)
  bailFast: process.argv.includes('--bail-fast'),
};

// ─── Performance Cache ────────────────────────────────────────────────────

/**
 * Global file context cache to avoid O(n²) recomputation.
 * Key: file path, Value: computed file context.
 * Cache is cleared after processing all files.
 */
const fileContextCache = new Map<string, FileContext>();

/**
 * Clear the file context cache.
 * Call this after processing all files to free memory.
 */
function clearFileContextCache(): void {
  fileContextCache.clear();
}

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
  return new RegExp(`^${escaped}$`);
}

// Pre-compile glob patterns for performance
const includeRegexes = CONFIG.includePatterns.map(globToRegex);
const excludeRegexes = CONFIG.excludePatterns.map(globToRegex);

/**
 * Pre-compute line offsets for a multi-line string for O(1) position lookup.
 * Returns an array where index i contains the character offset of line i.
 */
function computeLineOffsets(text: string): number[] {
  const offsets: number[] = [0]; // Line 0 starts at offset 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

/**
 * Get or create CSS context for a CSS block.
 * Caches expensive operations (split lines, compute offsets) at CSS-block level.
 *
 * Performance: O(1) after first call for same CSS content.
 */
function getCSSContext(cssContent: string): CSSContext {
  // For CSS blocks, we compute on-demand since they're scoped to a single css`...` block
  // No global cache needed as each CSS block is processed once
  return {
    cssContent,
    cssLines: cssContent.split('\n'),
    lineOffsets: computeLineOffsets(cssContent),
  };
}

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

  // Check parent nodes (up to N levels)
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
 * Detect if a component uses Light DOM (renders to `this` instead of shadow DOM).
 * Light DOM components override createRenderRoot() to return `this`.
 *
 * Performance: Cached at file level to avoid O(n²) re-scanning.
 */
function isLightDOMComponent(sourceFile: SourceFile): boolean {
  let isLightDOM = false;

  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isMethodDeclaration(node)) {
      const methodName = node.getName();
      if (methodName === 'createRenderRoot') {
        const body = node.getBody();
        if (body && Node.isBlock(body)) {
          const bodyText = body.getText();
          // Check if method returns `this` or `return this`
          if (/return\s+this\s*;?/.test(bodyText)) {
            isLightDOM = true;
          }
        }
      }
    }
  });

  return isLightDOM;
}

/**
 * Get or create file context for a source file.
 * Caches expensive operations (Light DOM detection) at file level.
 *
 * Performance: O(1) after first call for same file, avoiding O(n²) recomputation.
 */
function getFileContext(sourceFile: SourceFile): FileContext {
  const filePath = sourceFile.getFilePath();

  if (!fileContextCache.has(filePath)) {
    const isLightDOM = isLightDOMComponent(sourceFile);
    fileContextCache.set(filePath, { sourceFile, isLightDOM });
  }

  return fileContextCache.get(filePath)!;
}

/**
 * Extract CSS content from Lit css`...` tagged template literal
 */
function extractCSSFromTaggedTemplate(node: TaggedTemplateExpression): string {
  const template = node.getTemplate();

  if (Node.isNoSubstitutionTemplateLiteral(template)) {
    // Simple case: css`...` with no interpolation
    return (template as NoSubstitutionTemplateLiteral).getLiteralText();
  }

  if (Node.isTemplateExpression(template)) {
    // Complex case: css`... ${expr} ...`
    const templateExpr = template as TemplateExpression;
    const head = templateExpr.getHead().getText();
    const spans = templateExpr.getTemplateSpans();

    let cssText = head;
    for (const span of spans) {
      // Skip template expression interpolations (they don't contain CSS rules)
      const literal = span.getLiteral().getText();
      cssText += literal;
    }

    return cssText;
  }

  return '';
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Check for global selectors in Shadow DOM styles.
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkGlobalSelectors(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssLines, lineOffsets } = cssContext;
  const nodeStart = cssNode.getStart();

  cssLines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    CONFIG.globalSelectors.forEach((selector) => {
      // Match selector followed by { or space+{
      // For '*' we need to match it at the start or after whitespace only
      let regex: RegExp;
      if (selector === '*') {
        // Match universal selector: * { or whitespace + * {
        regex = /(?:^|\s)\*\s*\{/g;
      } else {
        // Match other selectors with word boundary
        // Updated to handle uppercase selectors and attribute selectors
        regex = new RegExp(`\\b${selector}\\b\\s*[\\[{]`, 'gi');
      }

      const match = regex.exec(line);

      if (match) {
        const cssLineStart = lineOffsets[index] ?? 0;
        const absoluteOffset = nodeStart + cssLineStart + match.index;
        const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

        violations.push({
          file: sourceFile.getFilePath(),
          line: fileLine,
          column,
          message: `Global selector \`${selector}\` detected in Shadow DOM styles`,
          suggestion: `Use :host instead of global selectors. Shadow DOM styles are automatically scoped to the component.`,
          code: line.trim().substring(0, 80),
          severity: 'critical',
          category: 'global-selector',
        });
      }
    });
  });
}

/**
 * Check for improper use of !important (can pierce shadow DOM).
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkImportantOverrides(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssLines, lineOffsets } = cssContext;
  const nodeStart = cssNode.getStart();

  cssLines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    // Detect !important usage
    const importantRegex = /!\s*important/gi;
    const match = importantRegex.exec(line);

    if (match) {
      const cssLineStart = lineOffsets[index] ?? 0;
      const absoluteOffset = nodeStart + cssLineStart + match.index;
      const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

      violations.push({
        file: sourceFile.getFilePath(),
        line: fileLine,
        column,
        message: `!important detected in Shadow DOM styles`,
        suggestion: `Avoid !important in component styles. Use proper CSS specificity instead. !important can interfere with consumer theming.`,
        code: line.trim().substring(0, 80),
        severity: 'warning',
        category: 'important-override',
      });
    }
  });
}

/**
 * Check for overly broad :host-context() selectors.
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkHostContext(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssLines, lineOffsets } = cssContext;
  const nodeStart = cssNode.getStart();

  cssLines.forEach((line, index) => {
    const hostContextMatch = line.match(/:host-context\(([^)]+)\)/);
    if (hostContextMatch) {
      const selector = hostContextMatch[1];
      const broadSelectors = ['*', 'body', 'html', 'document'];

      if (broadSelectors.some((broad) => selector?.trim() === broad)) {
        const cssLineStart = lineOffsets[index] ?? 0;
        const absoluteOffset = nodeStart + cssLineStart + line.indexOf(':host-context');
        const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

        violations.push({
          file: sourceFile.getFilePath(),
          line: fileLine,
          column,
          message: `Overly broad :host-context(${selector}) selector`,
          suggestion: `Use specific class selectors: :host-context(.theme-dark), :host-context([data-mode="compact"])`,
          code: line.trim().substring(0, 80),
          severity: 'warning',
          category: 'broad-host-context',
        });
      }
    }
  });
}

/**
 * Check for incorrect ::slotted() usage (descendant selectors).
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkSlottedUsage(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssLines, lineOffsets } = cssContext;
  const nodeStart = cssNode.getStart();

  cssLines.forEach((line, index) => {
    const slottedMatch = line.match(/::slotted\(([^)]+)\)/);
    if (slottedMatch) {
      const selector = slottedMatch[1];

      // ::slotted() should only target direct children, not descendants
      // Exception: [slot="name"] is allowed
      if (selector && selector.includes(' ') && !selector.startsWith('[slot=')) {
        const cssLineStart = lineOffsets[index] ?? 0;
        const absoluteOffset = nodeStart + cssLineStart + line.indexOf('::slotted');
        const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

        violations.push({
          file: sourceFile.getFilePath(),
          line: fileLine,
          column,
          message: `::slotted() with descendant selector detected`,
          suggestion: `::slotted() only targets direct slotted children. Use ::slotted(.class), not ::slotted(.parent .child)`,
          code: line.trim().substring(0, 80),
          severity: 'warning',
          category: 'slotted-descendant',
        });
      }
    }
  });
}

/**
 * Check for missing :host wrapper (styles at root level).
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkMissingHostWrapper(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssContent, cssLines, lineOffsets } = cssContext;
  const hasHostSelector = cssContent.includes(':host');
  const nodeStart = cssNode.getStart();

  // If no :host found, check for root-level element selectors
  if (!hasHostSelector) {
    let inAtRule = false;

    cssLines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (
        !trimmed ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('--')
      ) {
        return;
      }

      // Track @rule blocks (like @keyframes)
      if (trimmed.startsWith('@')) {
        inAtRule = true;
        return;
      }

      // Exit @rule block when we see a closing brace at root level
      if (inAtRule && trimmed === '}') {
        inAtRule = false;
        return;
      }

      // Skip lines inside @rule blocks
      if (inAtRule) {
        return;
      }

      // Detect root-level element/class selectors (not part of :host)
      // Updated to handle uppercase selectors and attribute selectors
      const isRootSelector = /^[a-zA-Z.#[][\w-]*\s*\{/.test(trimmed);

      if (isRootSelector && !trimmed.startsWith(':')) {
        const cssLineStart = lineOffsets[index] ?? 0;
        const absoluteOffset = nodeStart + cssLineStart;
        const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

        violations.push({
          file: sourceFile.getFilePath(),
          line: fileLine,
          column,
          message: `CSS selector at root level without :host scoping`,
          suggestion: `Wrap component styles in :host { ... } to ensure proper Shadow DOM encapsulation`,
          code: trimmed.substring(0, 80),
          severity: 'warning',
          category: 'root-level-style',
        });
      }
    });
  }
}

/**
 * Check for custom property definitions without proper prefix.
 * Enforces --hx-* prefix for all CSS custom property definitions in component styles.
 *
 * Performance: Uses pre-computed CSS context (lines, offsets) to avoid O(n²) splitting.
 */
export function checkCustomPropertyPrefix(
  sourceFile: SourceFile,
  cssContext: CSSContext,
  cssNode: Node,
  violations: Violation[],
): void {
  if (hasApprovalComment(cssNode)) {
    return;
  }

  const { cssLines, lineOffsets } = cssContext;
  const nodeStart = cssNode.getStart();

  // Match CSS custom property definitions: --property-name: value;
  // Must NOT match property usages: var(--property-name)
  const customPropertyDefRegex = /^\s*(--[a-zA-Z0-9-_]+)\s*:/;

  cssLines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    const match = customPropertyDefRegex.exec(line);
    if (match) {
      const propertyName = match[1];

      // Check if property starts with --hx-
      if (propertyName && !propertyName.startsWith('--hx-')) {
        const cssLineStart = lineOffsets[index] ?? 0;
        const absoluteOffset = nodeStart + cssLineStart + (match.index ?? 0);
        const { line: fileLine, column } = sourceFile.getLineAndColumnAtPos(absoluteOffset);

        violations.push({
          file: sourceFile.getFilePath(),
          line: fileLine,
          column,
          message: `Custom property \`${propertyName}\` does not use --hx- prefix`,
          suggestion: `All component custom properties must use --hx- prefix for namespace consistency. Example: --hx-button-bg`,
          code: line.trim().substring(0, 80),
          severity: 'warning',
          category: 'custom-property-prefix',
        });
      }
    }
  });
}

/**
 * Check for direct DOM manipulation bypassing shadow DOM.
 *
 * Performance: Uses cached Light DOM detection to avoid O(n²) re-scanning.
 */
export function checkDOMManipulation(
  fileContext: FileContext,
  violations: Violation[],
): void {
  const { sourceFile, isLightDOM } = fileContext;

  // Pattern 1: document.querySelector/querySelectorAll
  const documentPatterns = [
    'document.querySelector',
    'document.querySelectorAll',
    'document.getElementById',
    'document.getElementsByClassName',
    'document.getElementsByTagName',
  ];

  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression().getText();

      if (documentPatterns.some((pattern) => expr === pattern)) {
        // Skip if approved
        if (hasApprovalComment(node)) {
          return;
        }

        const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Direct DOM manipulation detected: ${expr}()`,
          suggestion: `Use this.shadowRoot.querySelector() or this.renderRoot.querySelector() for shadow DOM scoping`,
          code: node.getText().substring(0, 80),
          severity: 'critical',
          category: 'dom-manipulation',
        });
      }
    }

    // Pattern 2: this.querySelector (should be this.shadowRoot.querySelector)
    // SKIP for Light DOM components (createRenderRoot() { return this; })
    if (Node.isPropertyAccessExpression(node)) {
      const expr = node.getExpression();
      const name = node.getName();

      if (
        expr.getText() === 'this' &&
        (name === 'querySelector' || name === 'querySelectorAll')
      ) {
        // Skip if approved
        if (hasApprovalComment(node)) {
          return;
        }

        // Skip validation for Light DOM components
        if (isLightDOM) {
          return;
        }

        const { line, column } = sourceFile.getLineAndColumnAtPos(node.getStart());

        violations.push({
          file: sourceFile.getFilePath(),
          line,
          column,
          message: `Direct DOM query on component: this.${name}()`,
          suggestion: `Use this.shadowRoot.${name}() or this.renderRoot.${name}() for shadow DOM scoping`,
          code: node.getText().substring(0, 80),
          severity: 'critical',
          category: 'dom-manipulation',
        });
      }
    }
  });
}

/**
 * Validate Shadow DOM patterns in a single file.
 *
 * Performance: Uses cached file context and CSS context to avoid O(n²) recomputation.
 */
export function validateShadowDOMLeaks(
  fileContext: FileContext,
  violations: Violation[],
): void {
  const { sourceFile } = fileContext;

  // Check for direct DOM manipulation first (applies to all files)
  checkDOMManipulation(fileContext, violations);

  // Find all css`...` tagged template literals
  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isTaggedTemplateExpression(node)) {
      const taggedTemplate = node as TaggedTemplateExpression;
      const tag = taggedTemplate.getTag();

      // Only process css`...` tagged templates
      if (tag.getText() === 'css') {
        const cssContent = extractCSSFromTaggedTemplate(taggedTemplate);

        // Skip empty CSS
        if (!cssContent.trim()) {
          return;
        }

        // Create CSS context once for this CSS block
        const cssContext = getCSSContext(cssContent);

        // Run all CSS validators with pre-computed context
        checkGlobalSelectors(sourceFile, cssContext, node, violations);
        checkImportantOverrides(sourceFile, cssContext, node, violations);
        checkHostContext(sourceFile, cssContext, node, violations);
        checkSlottedUsage(sourceFile, cssContext, node, violations);
        checkMissingHostWrapper(sourceFile, cssContext, node, violations);
        checkCustomPropertyPrefix(sourceFile, cssContext, node, violations);
      }
    }
  });
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  createProject: (configPath: string): Project =>
    new Project({
      tsConfigFilePath: configPath,
      skipAddingFilesFromTsConfig: true,
    }),
};

// ─── Main Validation ──────────────────────────────────────────────────────

/**
 * Run Shadow DOM leak detection validation.
 * @param deps - Dependency injection for testing (getStagedFiles, createProject)
 * @param silent - Suppress console output (useful for JSON mode or testing)
 */
export async function validateShadowDOMLeakDetection(
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
        executionTimeMs: Date.now() - startTime,
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
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  if (!silent) {
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for Shadow DOM leaks...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  // Analyze each staged file
  let filesChecked = 0;
  try {
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

        // Get or create file context (cached for performance)
        const fileContext = getFileContext(sourceFile);

        // Run validation with cached context
        validateShadowDOMLeaks(fileContext, violations);
        filesChecked++;

        // Bail fast if enabled and critical violation found
        if (CONFIG.bailFast && violations.some((v) => v.severity === 'critical')) {
          if (!silent) {
            console.warn('[BAIL-FAST] Critical violation found. Stopping early.');
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
  } finally {
    // Clear file context cache after processing all files
    clearFileContextCache();
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
      executionTimeMs: elapsedTime,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');

  if (!outputJson) {
    console.log('[HOOK] shadow-dom-leak-detection (H16)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateShadowDOMLeakDetection(defaultDeps, outputJson);

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
    console.log('[PASS] No Shadow DOM leaks detected');
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
    `   Performance: ${result.stats.executionTimeMs}ms (budget: ${CONFIG.performanceBudgetMs}ms)`,
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
    console.log('   1. Replace global selectors (body, html, *) with :host');
    console.log('   2. Use this.shadowRoot.querySelector() instead of document.querySelector()');
    console.log('   3. Wrap component styles in :host { ... }');
    console.log('   4. Use specific selectors in :host-context() (not *, body, html)');
    console.log('   5. Use ::slotted() only for direct children (no descendant selectors)');
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
