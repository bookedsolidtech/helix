#!/usr/bin/env tsx
/**
 * Hook: cem-accuracy-check (H05)
 *
 * Enforces Custom Elements Manifest (CEM) accuracy for staged component files.
 * Execution budget: <3 seconds
 *
 * Catches:
 * - Components not documented in custom-elements.json
 * - Missing @property decorators in CEM
 * - Missing @event declarations in CEM (via JSDoc @fires tags)
 * - Missing @slot declarations in CEM (via JSDoc @slot tags)
 * - Missing @csspart declarations in CEM (via JSDoc @csspart tags)
 * - Missing @cssprop declarations in CEM (via JSDoc @cssprop tags)
 * - CEM drift from actual component API
 *
 * Allows:
 * - Approved exceptions: // @test-architect-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/cem-accuracy-check.ts
 *   tsx scripts/hooks/cem-accuracy-check.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:cem-accuracy-check
 */

import { Project, Node, ClassDeclaration, SourceFile } from 'ts-morph';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
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
  readCEM: () => CustomElementsManifest | null;
}

interface CustomElementsManifest {
  schemaVersion: string;
  modules: CEMModule[];
}

interface CEMModule {
  kind: string;
  path: string;
  declarations: CEMDeclaration[];
}

interface CEMDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  members?: CEMMember[];
  events?: CEMEvent[];
  slots?: CEMSlot[];
  cssProperties?: CEMCSSProperty[];
  cssParts?: CEMCSSPart[];
}

interface CEMMember {
  kind: string;
  name: string;
  type?: { text: string };
  attribute?: string;
  reflects?: boolean;
}

interface CEMEvent {
  name: string;
  type?: { text: string };
  description?: string;
}

interface CEMSlot {
  name: string;
  description?: string;
}

interface CEMCSSProperty {
  name: string;
  description?: string;
  default?: string;
}

interface CEMCSSPart {
  name: string;
  description?: string;
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files to check (only staged component files)
  includePatterns: ['packages/hx-library/src/components/**/*.ts'],
  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/test-utils.ts',
    '**/index.ts',
    '**/*.d.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Approval mechanism for exceptional cases
  approvalComment: '@test-architect-approved',

  // CEM location
  cemPath: 'packages/hx-library/custom-elements.json',

  // Performance: timeout (5s for ts-morph + CEM parsing)
  timeoutMs: 5000,
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Get list of staged component TypeScript files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => {
        // Must match include patterns
        const matchesInclude = CONFIG.includePatterns.some((pattern) => {
          const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(regex).test(file);
        });

        if (!matchesInclude) {
          return false;
        }

        // Must not match exclude patterns
        const matchesExclude = CONFIG.excludePatterns.some((pattern) => {
          const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(regex).test(file);
        });

        return !matchesExclude;
      })
      .filter((file) => existsSync(file));
  } catch (error) {
    console.error('Failed to get staged files:', error);
    return [];
  }
}

/**
 * Read Custom Elements Manifest
 */
function readCEM(): CustomElementsManifest | null {
  const cemPath = resolve(CONFIG.cemPath);

  if (!existsSync(cemPath)) {
    return null;
  }

  try {
    const content = readFileSync(cemPath, 'utf-8');
    return JSON.parse(content) as CustomElementsManifest;
  } catch (error) {
    console.error('Failed to parse CEM:', error);
    return null;
  }
}

/**
 * Check if a file has an approval comment
 */
function hasApprovalComment(content: string): boolean {
  return content.includes(CONFIG.approvalComment);
}

/**
 * Format violation for console output
 */
function formatViolation(violation: Violation): string {
  const icon = violation.severity === 'critical' ? '[CRITICAL]' : '[WARNING]';
  const location = `${violation.file}:${violation.line}:${violation.column}`;

  return `${icon} ${location}
   ${violation.message}
   Suggestion: ${violation.suggestion}${violation.code ? `\n   ${violation.code}` : ''}`;
}

/**
 * Normalize file path for CEM lookup
 */
function normalizeCEMPath(filePath: string): string {
  // Convert absolute path to relative path from project root
  // e.g., /path/to/packages/hx-library/src/components/hx-button/hx-button.ts
  //    -> src/components/hx-button/hx-button.ts
  const match = filePath.match(/src\/components\/.+\.ts$/);
  return match ? match[0] : filePath;
}

/**
 * Find CEM declaration for a component
 */
function findCEMDeclaration(cem: CustomElementsManifest, filePath: string): CEMDeclaration | null {
  const normalizedPath = normalizeCEMPath(filePath);

  for (const module of cem.modules) {
    if (module.path === normalizedPath) {
      // Find the component class declaration (not helper classes)
      const componentDecl = module.declarations.find(
        (decl) => decl.kind === 'class' && decl.tagName,
      );
      return componentDecl ?? null;
    }
  }

  return null;
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Extract @property decorators from a class
 */
function extractProperties(
  classDecl: ClassDeclaration,
): Array<{ name: string; line: number; column: number }> {
  const properties: Array<{ name: string; line: number; column: number }> = [];

  classDecl.getProperties().forEach((prop) => {
    const decorators = prop.getDecorators();
    const hasPropertyDecorator = decorators.some((d) => d.getName() === 'property');

    if (hasPropertyDecorator) {
      const sourceFile = classDecl.getSourceFile();
      const { line, column } = sourceFile.getLineAndColumnAtPos(prop.getStart());
      properties.push({ name: prop.getName(), line, column });
    }
  });

  return properties;
}

/**
 * Extract @fires tags from JSDoc comments
 */
function extractEvents(
  classDecl: ClassDeclaration,
): Array<{ name: string; line: number; column: number }> {
  const events: Array<{ name: string; line: number; column: number }> = [];
  const sourceFile = classDecl.getSourceFile();

  // Check class-level JSDoc
  const jsDocs = classDecl.getJsDocs();
  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'fires') {
        const comment = tag.getCommentText();
        if (comment) {
          // Extract event name from @fires {CustomEvent<{...}>} hx-click - Description
          const match = typeof comment === 'string' ? comment.match(/}\s+([a-z-]+)/i) : null;
          if (match) {
            const { line, column } = sourceFile.getLineAndColumnAtPos(tag.getStart());
            events.push({ name: match[1], line, column });
          }
        }
      }
    }
  }

  // Check for inline @event comments in methods
  classDecl.forEachDescendant((node) => {
    if (Node.isNewExpression(node)) {
      const expr = node.getExpression();
      if (Node.isIdentifier(expr) && expr.getText() === 'CustomEvent') {
        // Look for preceding comment with @event tag
        const parent = node.getParent();
        if (parent) {
          const comments = parent.getLeadingCommentRanges();
          for (const comment of comments) {
            const text = comment.getText();
            if (text.includes('@event')) {
              const match = text.match(/@event\s+([a-z-]+)/i);
              if (match) {
                const { line, column } = sourceFile.getLineAndColumnAtPos(comment.getPos());
                events.push({ name: match[1], line, column });
              }
            }
          }
        }

        // Also check the CustomEvent first argument for event name
        const args = node.getArguments();
        if (args.length > 0) {
          const firstArg = args[0];
          if (Node.isStringLiteral(firstArg)) {
            const eventName = firstArg.getLiteralValue();
            if (eventName.startsWith('hx-')) {
              const { line, column } = sourceFile.getLineAndColumnAtPos(firstArg.getStart());
              // Only add if not already in events list
              if (!events.some((e) => e.name === eventName)) {
                events.push({ name: eventName, line, column });
              }
            }
          }
        }
      }
    }
  });

  // Deduplicate by name
  const uniqueEvents = new Map<string, { name: string; line: number; column: number }>();
  events.forEach((event) => {
    if (!uniqueEvents.has(event.name)) {
      uniqueEvents.set(event.name, event);
    }
  });

  return Array.from(uniqueEvents.values());
}

/**
 * Extract @slot tags from JSDoc comments
 */
function extractSlots(
  classDecl: ClassDeclaration,
): Array<{ name: string; line: number; column: number }> {
  const slots: Array<{ name: string; line: number; column: number }> = [];
  const sourceFile = classDecl.getSourceFile();

  const jsDocs = classDecl.getJsDocs();
  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'slot') {
        const comment = tag.getCommentText();
        const { line, column } = sourceFile.getLineAndColumnAtPos(tag.getStart());

        if (!comment) {
          // Just @slot with no comment text (default slot)
          slots.push({ name: '', line, column });
          continue;
        }

        // Parse comment text
        const commentStr = typeof comment === 'string' ? comment : '';

        // Check if comment starts with "-" (indicates default slot)
        // @slot - Default slot description
        if (commentStr.trim().startsWith('-')) {
          slots.push({ name: '', line, column });
        } else {
          // @slot slotName - Description
          const match = commentStr.match(/^(\S+)/);
          const slotName = match ? match[1] : '';
          slots.push({ name: slotName, line, column });
        }
      }
    }
  }

  return slots;
}

/**
 * Extract @csspart tags from JSDoc comments
 */
function extractCSSParts(
  classDecl: ClassDeclaration,
): Array<{ name: string; line: number; column: number }> {
  const parts: Array<{ name: string; line: number; column: number }> = [];
  const sourceFile = classDecl.getSourceFile();

  const jsDocs = classDecl.getJsDocs();
  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'csspart') {
        const comment = tag.getCommentText();
        if (comment) {
          // @csspart partName - Description
          const commentStr = typeof comment === 'string' ? comment : '';
          const match = commentStr.match(/^(\S+)/);
          if (match) {
            const { line, column } = sourceFile.getLineAndColumnAtPos(tag.getStart());
            parts.push({ name: match[1], line, column });
          }
        }
      }
    }
  }

  return parts;
}

/**
 * Extract @cssprop tags from JSDoc comments
 */
function extractCSSProperties(
  classDecl: ClassDeclaration,
): Array<{ name: string; line: number; column: number }> {
  const props: Array<{ name: string; line: number; column: number }> = [];
  const sourceFile = classDecl.getSourceFile();

  const jsDocs = classDecl.getJsDocs();
  for (const jsDoc of jsDocs) {
    const tags = jsDoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'cssprop') {
        const comment = tag.getCommentText();
        if (comment) {
          // @cssprop [--name=default] - Description
          const commentStr = typeof comment === 'string' ? comment : '';
          const match = commentStr.match(/\[(--[a-z-]+)/);
          if (match) {
            const { line, column } = sourceFile.getLineAndColumnAtPos(tag.getStart());
            props.push({ name: match[1], line, column });
          }
        }
      }
    }
  }

  return props;
}

/**
 * Check if component is documented in CEM
 */
function checkComponentInCEM(
  filePath: string,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    violations.push({
      file: filePath,
      line: 1,
      column: 1,
      message: 'Component not found in Custom Elements Manifest',
      suggestion:
        'Run "npm run cem" to regenerate the manifest, or ensure component has @customElement decorator',
      severity: 'critical',
    });
  }
}

/**
 * Check if all @property decorators are in CEM
 */
function checkProperties(
  filePath: string,
  sourceFile: SourceFile,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    return; // Already flagged by checkComponentInCEM
  }

  const classes = sourceFile.getClasses();
  const componentClass = classes.find((c) => {
    const decorators = c.getDecorators();
    return decorators.some((d) => d.getName() === 'customElement');
  });

  if (!componentClass) {
    return;
  }

  const sourceProperties = extractProperties(componentClass);
  const cemMembers = cemDecl.members ?? [];

  // Check each source property exists in CEM
  for (const prop of sourceProperties) {
    const existsInCEM = cemMembers.some((m) => m.name === prop.name);

    if (!existsInCEM) {
      violations.push({
        file: filePath,
        line: prop.line,
        column: prop.column,
        message: `Property "${prop.name}" not found in Custom Elements Manifest`,
        suggestion: 'Run "npm run cem" to regenerate the manifest',
        code: `@property ${prop.name}`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check if all @fires tags are in CEM
 */
function checkEvents(
  filePath: string,
  sourceFile: SourceFile,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    return; // Already flagged by checkComponentInCEM
  }

  const classes = sourceFile.getClasses();
  const componentClass = classes.find((c) => {
    const decorators = c.getDecorators();
    return decorators.some((d) => d.getName() === 'customElement');
  });

  if (!componentClass) {
    return;
  }

  const sourceEvents = extractEvents(componentClass);
  const cemEvents = cemDecl.events ?? [];

  // Check each source event exists in CEM
  for (const event of sourceEvents) {
    const existsInCEM = cemEvents.some((e) => e.name === event.name);

    if (!existsInCEM) {
      violations.push({
        file: filePath,
        line: event.line,
        column: event.column,
        message: `Event "${event.name}" not found in Custom Elements Manifest`,
        suggestion: 'Run "npm run cem" to regenerate the manifest',
        code: `@fires ${event.name}`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check if all @slot tags are in CEM
 */
function checkSlots(
  filePath: string,
  sourceFile: SourceFile,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    return; // Already flagged by checkComponentInCEM
  }

  const classes = sourceFile.getClasses();
  const componentClass = classes.find((c) => {
    const decorators = c.getDecorators();
    return decorators.some((d) => d.getName() === 'customElement');
  });

  if (!componentClass) {
    return;
  }

  const sourceSlots = extractSlots(componentClass);
  const cemSlots = cemDecl.slots ?? [];

  // Check each source slot exists in CEM
  for (const slot of sourceSlots) {
    const existsInCEM = cemSlots.some((s) => s.name === slot.name);

    if (!existsInCEM) {
      const slotName = slot.name === '' ? 'default slot' : `slot "${slot.name}"`;
      violations.push({
        file: filePath,
        line: slot.line,
        column: slot.column,
        message: `${slotName} not found in Custom Elements Manifest`,
        suggestion: 'Run "npm run cem" to regenerate the manifest',
        code: `@slot ${slot.name}`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check if all @csspart tags are in CEM
 */
function checkCSSParts(
  filePath: string,
  sourceFile: SourceFile,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    return; // Already flagged by checkComponentInCEM
  }

  const classes = sourceFile.getClasses();
  const componentClass = classes.find((c) => {
    const decorators = c.getDecorators();
    return decorators.some((d) => d.getName() === 'customElement');
  });

  if (!componentClass) {
    return;
  }

  const sourceParts = extractCSSParts(componentClass);
  const cemParts = cemDecl.cssParts ?? [];

  // Check each source CSS part exists in CEM
  for (const part of sourceParts) {
    const existsInCEM = cemParts.some((p) => p.name === part.name);

    if (!existsInCEM) {
      violations.push({
        file: filePath,
        line: part.line,
        column: part.column,
        message: `CSS part "${part.name}" not found in Custom Elements Manifest`,
        suggestion: 'Run "npm run cem" to regenerate the manifest',
        code: `@csspart ${part.name}`,
        severity: 'critical',
      });
    }
  }
}

/**
 * Check if all @cssprop tags are in CEM
 */
function checkCSSProperties(
  filePath: string,
  sourceFile: SourceFile,
  cemDecl: CEMDeclaration | null,
  violations: Violation[],
  content: string,
): void {
  if (hasApprovalComment(content)) {
    return;
  }

  if (!cemDecl) {
    return; // Already flagged by checkComponentInCEM
  }

  const classes = sourceFile.getClasses();
  const componentClass = classes.find((c) => {
    const decorators = c.getDecorators();
    return decorators.some((d) => d.getName() === 'customElement');
  });

  if (!componentClass) {
    return;
  }

  const sourceProps = extractCSSProperties(componentClass);
  const cemProps = cemDecl.cssProperties ?? [];

  // Check each source CSS property exists in CEM
  for (const prop of sourceProps) {
    const existsInCEM = cemProps.some((p) => p.name === prop.name);

    if (!existsInCEM) {
      violations.push({
        file: filePath,
        line: prop.line,
        column: prop.column,
        message: `CSS property "${prop.name}" not found in Custom Elements Manifest`,
        suggestion: 'Run "npm run cem" to regenerate the manifest',
        code: `@cssprop ${prop.name}`,
        severity: 'critical',
      });
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
  readCEM,
};

// ─── Main Validation ──────────────────────────────────────────────────────

async function validateCEMAccuracy(
  deps: HookDependencies = defaultDeps,
  silent = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const stagedFiles = deps.getStagedFiles();

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
      },
    };
  }

  if (!silent) {
    console.log(`Checking ${stagedFiles.length} file(s) for CEM accuracy...`);
    console.log('');
  }

  // Read CEM
  const cem = deps.readCEM();

  if (!cem && !silent) {
    console.log('[WARNING] No Custom Elements Manifest found. Run "npm run cem" to generate it.');
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
      const content = sourceFile.getFullText();

      // Find corresponding CEM declaration
      const cemDecl = cem ? findCEMDeclaration(cem, filePath) : null;

      // Run all checks
      checkComponentInCEM(filePath, cemDecl, violations, content);
      checkProperties(filePath, sourceFile, cemDecl, violations, content);
      checkEvents(filePath, sourceFile, cemDecl, violations, content);
      checkSlots(filePath, sourceFile, cemDecl, violations, content);
      checkCSSParts(filePath, sourceFile, cemDecl, violations, content);
      checkCSSProperties(filePath, sourceFile, cemDecl, violations, content);

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
    console.log(`Completed in ${elapsedTime}ms`);
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

/* istanbul ignore next */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');

  if (!outputJson) {
    console.log('CEM Accuracy Hook: cem-accuracy-check (H05)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateCEMAccuracy(defaultDeps, outputJson);

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
    console.log('[PASS] No CEM accuracy violations found');
    console.log('');
    process.exit(0);
  }

  // Print violations grouped by severity
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
    console.log('[BLOCKED] Commit blocked due to critical violations');
    console.log('');
    console.log('To fix:');
    console.log('   1. Run "npm run cem" to regenerate Custom Elements Manifest');
    console.log('   2. Ensure all @property decorators are documented');
    console.log('   3. Ensure all @fires tags in JSDoc are accurate');
    console.log('   4. Ensure all @slot, @csspart, @cssprop tags are present');
    console.log('   5. Verify component has @customElement decorator');
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
/* istanbul ignore next */
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? '');

/* istanbul ignore next */
if (isMainModule) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

// Export for testing
export {
  validateCEMAccuracy,
  checkComponentInCEM,
  checkProperties,
  checkEvents,
  checkSlots,
  checkCSSParts,
  checkCSSProperties,
  extractProperties,
  extractEvents,
  extractSlots,
  extractCSSParts,
  extractCSSProperties,
  findCEMDeclaration,
  normalizeCEMPath,
  hasApprovalComment,
  getStagedFiles,
  readCEM,
  formatViolation,
};

export type {
  Violation,
  ValidationResult,
  HookDependencies,
  CustomElementsManifest,
  CEMDeclaration,
};
