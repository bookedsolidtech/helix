#!/usr/bin/env tsx
/**
 * Hook: vrt-critical-paths (H14)
 *
 * Enforces visual regression testing for critical user paths before commits.
 * Execution budget: <3 seconds, timeout: 5 seconds
 *
 * Catches:
 * - Component render() method changes without VRT snapshots
 * - Component styles changes without VRT snapshots
 * - Stale VRT snapshots (older than component modifications)
 * - Missing VRT-tagged stories for critical components
 * - VRT snapshots older than 1 hour (warning)
 *
 * Allows:
 * - Test files, index.ts re-exports
 * - Approved exceptions: // @vrt-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/vrt-critical-paths.ts
 *   tsx scripts/hooks/vrt-critical-paths.ts --json
 *   tsx scripts/hooks/vrt-critical-paths.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:vrt-critical-paths
 */

import {
  Project,
  Node,
  SourceFile,
  MethodDeclaration,
  PropertyDeclaration,
  SyntaxKind,
} from 'ts-morph';
import { execSync } from 'child_process';
import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join, dirname, sep as pathSep } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code?: string;
  severity: 'critical' | 'warning';
  category?: 'missing-vrt' | 'stale-vrt' | 'missing-story' | 'render-change' | 'style-change';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    componentsWithRenderChanges: number;
    componentsWithVRT: number;
    executionTimeMs: number;
  };
}

interface HookDependencies {
  getStagedFiles: () => string[];
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
  getFileTimestamp: (path: string) => number;
  createProject: (configPath: string) => Project;
}

interface RenderChange {
  type: 'render-method' | 'styles-property';
  line: number;
  column: number;
  methodName?: string;
}

interface VRTStory {
  name: string;
  hasVRTTag: boolean;
}

interface SnapshotInfo {
  path: string;
  timestamp: number;
  age: number;
}

/**
 * P1 FIX: Snapshot search cache to avoid O(n) recursive search per component
 * Cache persists for entire hook invocation (cleared between commits)
 */
interface SnapshotCache {
  snapshots: Map<string, string[]>; // componentName -> snapshot paths
  lastBuilt: number;
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly approvalCommentSearchDepth: number;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
  readonly snapshotMaxAgeHours: number;
  readonly snapshotDir: string;
  readonly storyFilePattern: string;
}

export const CONFIG: HookConfig = {
  // Files to check (only component implementation files)
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
  approvalComment: '@vrt-approved',

  // Approval comment search depth (check up to N parent nodes)
  approvalCommentSearchDepth: 5,

  // Performance: timeout and budget
  timeoutMs: 5000,
  performanceBudgetMs: 3000, // <3s budget

  // Snapshot freshness threshold
  snapshotMaxAgeHours: 1,

  // Snapshot directory (from playwright.config.ts)
  snapshotDir: 'packages/hx-library/__screenshots__',

  // Story file pattern
  storyFilePattern: '.stories.ts',
};

// ─── Utility Functions ────────────────────────────────────────────────────

/**
 * Pre-compiled regex cache for performance
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
 * Read file contents
 */
function readFile(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read file ${path}: ${errorMessage}`);
  }
}

/**
 * Check if file exists
 */
function fileExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Get file modification timestamp (milliseconds since epoch)
 */
function getFileTimestamp(path: string): number {
  try {
    const stats = statSync(path);
    return stats.mtimeMs;
  } catch (error) {
    return 0;
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
 * Extract component name from file path
 * Example: packages/hx-library/src/components/hx-button/hx-button.ts -> hx-button
 */
export function extractComponentName(filePath: string): string {
  const match = filePath.match(/\/components\/([^/]+)\/\1\.ts$/);
  return match ? match[1] : '';
}

/**
 * Check if render() method has actual changes in git diff
 * Uses git diff --numstat for reliable change detection instead of fragile hunk parsing
 *
 * P1 FIX: Replaced manual hunk parsing with --numstat for robustness
 * - Old approach: Regex-based hunk parsing broke on merge commits, multi-line changes
 * - New approach: Use --numstat to check if file has ANY changes (additions or deletions)
 * - Rationale: If file has changes in git diff, and we detected render() method in AST,
 *   it's safer to require VRT coverage than risk false negatives from fragile parsing
 */
export function hasRenderChangesInDiff(
  filePath: string,
  renderChange: RenderChange,
): boolean {
  try {
    // Use --numstat for reliable change detection
    // Output format: "added\tdeleted\tfilename"
    // Example: "5\t2\tpackages/hx-library/src/components/hx-button/hx-button.ts"
    const diffOutput = execSync(`git diff --cached --numstat "${filePath}"`, {
      encoding: 'utf-8',
      timeout: 5000,
    });

    if (!diffOutput.trim()) {
      return false; // No changes in this file
    }

    // Parse numstat output
    const parts = diffOutput.trim().split('\t');
    if (parts.length < 2) {
      // Unexpected format, assume changes exist (conservative approach)
      return true;
    }

    const added = parts[0];
    const removed = parts[1];

    // Check if there are any additions or deletions
    // Use '-' for binary files or untrackable changes
    if (added === '-' || removed === '-') {
      return true; // Binary or complex changes, assume render changed
    }

    const addedLines = parseInt(added ?? '0', 10);
    const removedLines = parseInt(removed ?? '0', 10);

    // If file has any changes (additions or deletions), require VRT coverage
    // This is a conservative approach: we know render() method exists (from AST),
    // and we know file changed (from git diff), so we require VRT coverage
    return addedLines > 0 || removedLines > 0;
  } catch (error) {
    // If git diff fails, assume changes exist (conservative approach)
    return true;
  }
}

// ─── Validators ───────────────────────────────────────────────────────────

/**
 * Extract render() method and styles property changes from a component file
 */
export function extractRenderChanges(sourceFile: SourceFile): RenderChange[] {
  const changes: RenderChange[] = [];

  sourceFile.forEachDescendant((node) => {
    // Check for render() method declaration
    if (Node.isMethodDeclaration(node)) {
      const method = node as MethodDeclaration;
      const methodName = method.getName();

      if (methodName === 'render') {
        const { line, column } = sourceFile.getLineAndColumnAtPos(method.getStart());
        changes.push({
          type: 'render-method',
          line,
          column,
          methodName,
        });
      }
    }

    // Check for static styles property declaration
    if (Node.isPropertyDeclaration(node)) {
      const prop = node as PropertyDeclaration;
      const propName = prop.getName();

      if (propName === 'styles' && prop.hasModifier(SyntaxKind.StaticKeyword)) {
        const { line, column } = sourceFile.getLineAndColumnAtPos(prop.getStart());
        changes.push({
          type: 'styles-property',
          line,
          column,
        });
      }
    }
  });

  return changes;
}

/**
 * Extract VRT stories from a Storybook story file
 * VRT stories are tagged with 'vrt' in the meta tags array or individual story tags
 *
 * P1 FIX: Replaced fragile brace counting with regex-based extraction
 * - Old approach: Manual brace depth tracking broke on nested objects, template strings
 * - New approach: Use regex to match story export patterns directly
 * - Handles: nested objects, template literals, JSX, multiline stories
 */
export function extractVRTStories(storyFileContent: string): VRTStory[] {
  const stories: VRTStory[] = [];

  // Extract meta object specifically (before "export default meta")
  const metaMatch = storyFileContent.match(
    /const\s+meta\s*=\s*\{[\s\S]*?\}\s*satisfies\s+Meta/,
  );
  const metaBlock = metaMatch ? metaMatch[0] : '';

  // Check if meta has tags: ['vrt'] or tags: ['autodocs', 'vrt']
  const hasMetaVRTTag = /tags:\s*\[[^\]]*['"]vrt['"][^\]]*\]/.test(metaBlock);

  if (hasMetaVRTTag) {
    stories.push({
      name: 'meta-level-vrt',
      hasVRTTag: true,
    });
  }

  // P1 FIX: Use regex-based story extraction instead of brace counting
  // Match story export pattern: export const StoryName: Story = { ... }
  // This regex captures:
  // - Story name (capture group 1)
  // - Story type annotation (: Story or : Story<...>)
  // - Everything until the next export or end of file
  const storyExportRegex = /export\s+const\s+(\w+):\s*Story(?:<[^>]*>)?\s*=\s*\{([\s\S]*?)(?=export\s+const\s+\w+:|export\s+default|$)/g;

  let match;
  while ((match = storyExportRegex.exec(storyFileContent)) !== null) {
    const storyName = match[1];
    const storyBody = match[2];

    if (!storyName || !storyBody) {
      continue;
    }

    // Check if story has VRT tag
    const hasStoryVRTTag = /tags:\s*\[[^\]]*['"]vrt['"][^\]]*\]/.test(storyBody);

    stories.push({
      name: storyName,
      hasVRTTag: hasStoryVRTTag || hasMetaVRTTag,
    });
  }

  return stories;
}

/**
 * P1 FIX: Snapshot cache to avoid O(n) recursive search per component
 * Cache is built once per hook invocation and reused for all components
 */
let snapshotCache: SnapshotCache | null = null;

/**
 * Build snapshot cache by scanning entire snapshot directory once
 * Maps component names to their snapshot file paths
 *
 * P1 FIX: Cache snapshot search results per hook invocation
 * - Old approach: Recursive search entire snapshot dir for every component (O(n))
 * - New approach: Build cache once, reuse for all components (O(1) lookup)
 */
function buildSnapshotCache(deps: HookDependencies = defaultDeps): SnapshotCache {
  const cache: SnapshotCache = {
    snapshots: new Map(),
    lastBuilt: Date.now(),
  };

  const snapshotBaseDir = CONFIG.snapshotDir;

  if (!deps.fileExists(snapshotBaseDir)) {
    return cache;
  }

  try {
    // Recursively scan snapshot directory
    const searchDir = (dir: string): void => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            searchDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.png')) {
            // Extract component name from snapshot filename
            // Format: hx-button--primary.png or hx-button.png
            const match = entry.name.match(/^(hx-[a-z-]+?)(?:--|\.).*\.png$/);
            if (match) {
              const componentName = match[1];
              if (componentName) {
                const existing = cache.snapshots.get(componentName) ?? [];
                existing.push(fullPath);
                cache.snapshots.set(componentName, existing);
              }
            }
          }
        }
      } catch (error) {
        // Ignore errors during directory traversal
      }
    };

    searchDir(snapshotBaseDir);
  } catch (error) {
    // Ignore errors during snapshot search
  }

  return cache;
}

/**
 * Find snapshot files for a component in the Playwright snapshot directory
 * Returns array of snapshot file paths
 *
 * Playwright stores snapshots in: __screenshots__/vrt.spec.ts/
 * Naming format: hx-button--primary.png, hx-button--secondary.png
 *
 * P1 FIX: Uses snapshot cache to avoid O(n) recursive search per component
 */
export function findSnapshotFiles(
  componentName: string,
  deps: HookDependencies = defaultDeps,
): string[] {
  // Build cache on first access
  if (snapshotCache === null) {
    snapshotCache = buildSnapshotCache(deps);
  }

  // Return cached snapshots for this component
  return snapshotCache.snapshots.get(componentName) ?? [];
}

/**
 * Clear snapshot cache (used for testing and between hook invocations)
 */
export function clearSnapshotCache(): void {
  snapshotCache = null;
}

/**
 * Check if snapshot is fresh (newer than component modification time)
 */
export function isSnapshotFresh(
  snapshotPath: string,
  componentModifiedTime: number,
  deps: HookDependencies = defaultDeps,
): boolean {
  const snapshotTime = deps.getFileTimestamp(snapshotPath);

  if (snapshotTime === 0) {
    return false;
  }

  // Snapshot must be newer than component
  return snapshotTime > componentModifiedTime;
}

/**
 * Get snapshot age in hours
 */
export function getSnapshotAge(
  snapshotPath: string,
  deps: HookDependencies = defaultDeps,
): number {
  const snapshotTime = deps.getFileTimestamp(snapshotPath);

  if (snapshotTime === 0) {
    return Infinity;
  }

  const now = Date.now();
  const ageMs = now - snapshotTime;
  const ageHours = ageMs / (1000 * 60 * 60);

  return ageHours;
}

/**
 * Validate VRT coverage for a component file
 */
export function validateVRTCoverage(
  sourceFile: SourceFile,
  filePath: string,
  violations: Violation[],
  deps: HookDependencies = defaultDeps,
): void {
  // Extract component name
  const componentName = extractComponentName(filePath);

  if (!componentName) {
    // Not a standard component file, skip
    return;
  }

  // Check if component has render changes
  const renderChanges = extractRenderChanges(sourceFile);

  if (renderChanges.length === 0) {
    // No render changes in this commit, skip VRT check
    return;
  }

  // Filter render changes to only those with actual git diff changes
  const actualRenderChanges = renderChanges.filter((change) =>
    hasRenderChangesInDiff(filePath, change),
  );

  if (actualRenderChanges.length === 0) {
    // render() method exists but wasn't modified in this commit
    return;
  }

  // Check for approval comment
  const classes = sourceFile.getClasses();
  if (classes.length > 0 && hasApprovalComment(classes[0]!)) {
    return;
  }

  // Find story file
  const componentDir = dirname(filePath);
  const storyFilePath = join(componentDir, `${componentName}${CONFIG.storyFilePattern}`);

  if (!deps.fileExists(storyFilePath)) {
    // No story file, report critical violation
    actualRenderChanges.forEach((change) => {
      violations.push({
        file: filePath,
        line: change.line,
        column: change.column,
        message: `Component ${change.type} modified but no Storybook story file found`,
        suggestion: `Create ${componentName}${CONFIG.storyFilePattern} with VRT-tagged stories`,
        code: change.methodName ?? change.type,
        severity: 'critical',
        category: 'missing-story',
      });
    });
    return;
  }

  // Read story file and check for VRT tags
  const storyContent = deps.readFile(storyFilePath);
  const vrtStories = extractVRTStories(storyContent);

  if (vrtStories.length === 0 || !vrtStories.some((s) => s.hasVRTTag)) {
    // No VRT-tagged stories, report warning
    actualRenderChanges.forEach((change) => {
      violations.push({
        file: filePath,
        line: change.line,
        column: change.column,
        message: `Component ${change.type} modified but no VRT-tagged stories found`,
        suggestion: `Add tags: ['vrt'] to story meta in ${componentName}${CONFIG.storyFilePattern}`,
        code: change.methodName ?? change.type,
        severity: 'warning',
        category: 'missing-vrt',
      });
    });
  }

  // Find snapshot files
  const snapshots = findSnapshotFiles(componentName, deps);

  if (snapshots.length === 0) {
    // No snapshots found, report critical violation
    actualRenderChanges.forEach((change) => {
      violations.push({
        file: filePath,
        line: change.line,
        column: change.column,
        message: `Component ${change.type} modified but no VRT snapshots found`,
        suggestion: 'Run: npm run test:vrt -- --update-snapshots',
        code: change.methodName ?? change.type,
        severity: 'critical',
        category: 'missing-vrt',
      });
    });
    return;
  }

  // Check snapshot freshness
  const componentModifiedTime = deps.getFileTimestamp(filePath);
  const staleSnapshots: SnapshotInfo[] = [];
  const oldSnapshots: SnapshotInfo[] = [];

  for (const snapshotPath of snapshots) {
    const age = getSnapshotAge(snapshotPath, deps);

    if (!isSnapshotFresh(snapshotPath, componentModifiedTime, deps)) {
      staleSnapshots.push({
        path: snapshotPath,
        timestamp: deps.getFileTimestamp(snapshotPath),
        age,
      });
    } else if (age > CONFIG.snapshotMaxAgeHours) {
      oldSnapshots.push({
        path: snapshotPath,
        timestamp: deps.getFileTimestamp(snapshotPath),
        age,
      });
    }
  }

  // Report stale snapshots (critical)
  if (staleSnapshots.length > 0) {
    actualRenderChanges.forEach((change) => {
      violations.push({
        file: filePath,
        line: change.line,
        column: change.column,
        message: `Component ${change.type} modified but VRT snapshots are stale (older than component)`,
        suggestion: 'Run: npm run test:vrt -- --update-snapshots',
        code: change.methodName ?? change.type,
        severity: 'critical',
        category: 'stale-vrt',
      });
    });
  }

  // Report old snapshots (warning)
  if (oldSnapshots.length > 0 && staleSnapshots.length === 0) {
    actualRenderChanges.forEach((change) => {
      violations.push({
        file: filePath,
        line: change.line,
        column: change.column,
        message: `Component ${change.type} modified and VRT snapshots are older than ${CONFIG.snapshotMaxAgeHours} hour(s)`,
        suggestion: 'Consider running: npm run test:vrt -- --update-snapshots',
        code: change.methodName ?? change.type,
        severity: 'warning',
        category: 'stale-vrt',
      });
    });
  }
}

// ─── Default Dependencies ─────────────────────────────────────────────────

const defaultDeps: HookDependencies = {
  getStagedFiles,
  readFile,
  fileExists,
  getFileTimestamp,
  createProject: (configPath: string) =>
    new Project({
      tsConfigFilePath: configPath,
      skipAddingFilesFromTsConfig: true,
    }),
};

// ─── Main Validation ──────────────────────────────────────────────────────

/**
 * Run VRT critical paths validation.
 * @param deps - Dependency injection for testing (getStagedFiles, readFile, etc.)
 * @param silent - Suppress console output (useful for JSON mode or testing)
 * @param bailFast - Exit on first critical violation
 */
export async function validateVRTCriticalPaths(
  deps: HookDependencies = defaultDeps,
  silent = false,
  bailFast = false,
): Promise<ValidationResult> {
  const startTime = Date.now();
  const violations: Violation[] = [];
  let componentsWithRenderChanges = 0;
  let componentsWithVRT = 0;

  // P1 FIX: Clear snapshot cache at start of validation to ensure fresh data
  clearSnapshotCache();

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
        componentsWithRenderChanges: 0,
        componentsWithVRT: 0,
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
        componentsWithRenderChanges: 0,
        componentsWithVRT: 0,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  if (!silent) {
    console.log(`[INFO] Checking ${stagedFiles.length} file(s) for VRT coverage...`);
    console.log('');
  }

  // Initialize ts-morph project
  const project = deps.createProject('./tsconfig.base.json');

  // Analyze each staged file
  let filesChecked = 0;
  let budgetExceeded = false;

  for (let i = 0; i < stagedFiles.length; i++) {
    const filePath = stagedFiles[i];
    const elapsedTime = Date.now() - startTime;

    // Performance budget check (soft limit - warn but continue)
    if (!budgetExceeded && elapsedTime > CONFIG.performanceBudgetMs) {
      budgetExceeded = true;
      if (!silent) {
        console.warn(
          `[PERFORMANCE] Budget exceeded: ${elapsedTime}ms > ${CONFIG.performanceBudgetMs}ms`,
        );
      }
    }

    // Timeout check (hard limit - stop execution)
    if (elapsedTime > CONFIG.timeoutMs) {
      const remaining = stagedFiles.slice(i);
      if (!silent) {
        console.warn(`[WARNING] Timeout reached (${CONFIG.timeoutMs}ms).`);
        console.warn(`[WARNING] Skipped ${remaining.length} file(s):`);
        remaining.forEach((f) => console.warn(`  - ${f}`));
      }
      break;
    }

    let sourceFile: SourceFile | undefined;
    try {
      sourceFile = project.addSourceFileAtPath(filePath);

      // Check if component has render changes
      const renderChanges = extractRenderChanges(sourceFile);
      if (renderChanges.length > 0) {
        componentsWithRenderChanges++;

        // Check VRT coverage
        validateVRTCoverage(sourceFile, filePath, violations, deps);

        // Count components with VRT (no critical violations)
        const hasCriticalVRTViolations = violations.some(
          (v) => v.file === filePath && v.severity === 'critical',
        );
        if (!hasCriticalVRTViolations) {
          componentsWithVRT++;
        }
      }

      filesChecked++;

      // Bail fast if enabled and critical violation found
      if (bailFast && violations.some((v) => v.severity === 'critical')) {
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

  const criticalViolations = violations.filter((v) => v.severity === 'critical').length;
  const warningViolations = violations.filter((v) => v.severity === 'warning').length;

  const elapsedTime = Date.now() - startTime;
  const exceededBudget = elapsedTime > CONFIG.performanceBudgetMs;

  if (!silent) {
    console.log(`[INFO] Completed in ${elapsedTime}ms`);
    if (exceededBudget) {
      console.warn(
        `[PERFORMANCE] Hook exceeded ${CONFIG.performanceBudgetMs}ms budget: ${elapsedTime}ms`,
      );
    }
    console.log('');
  }

  // Add performance warning in JSON mode if budget exceeded
  const performanceViolations: Violation[] = [];
  if (silent && exceededBudget) {
    performanceViolations.push({
      file: '<performance>',
      line: 0,
      column: 0,
      message: `Performance budget exceeded: ${elapsedTime}ms > ${CONFIG.performanceBudgetMs}ms`,
      suggestion: 'Consider optimizing hook or increasing budget',
      severity: 'warning',
    });
  }

  return {
    passed: criticalViolations === 0,
    violations: [...violations, ...performanceViolations],
    stats: {
      filesChecked,
      totalViolations: violations.length + performanceViolations.length,
      criticalViolations,
      warningViolations: warningViolations + performanceViolations.length,
      componentsWithRenderChanges,
      componentsWithVRT,
      executionTimeMs: elapsedTime,
    },
  };
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const bailFast = args.includes('--bail-fast');

  if (!outputJson) {
    console.log('[HOOK] vrt-critical-paths (H14)');
    console.log('━'.repeat(60));
    console.log('');
  }

  const result = await validateVRTCriticalPaths(defaultDeps, outputJson, bailFast);

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
    console.log('[PASS] All components with render changes have VRT coverage');
    console.log(
      `[INFO] Components with render changes: ${result.stats.componentsWithRenderChanges}`,
    );
    console.log(`[INFO] Components with VRT: ${result.stats.componentsWithVRT}`);
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
  console.log(
    `   Components with render changes: ${result.stats.componentsWithRenderChanges}`,
  );
  console.log(`   Components with VRT: ${result.stats.componentsWithVRT}`);
  console.log(`   Total violations: ${result.stats.totalViolations}`);
  console.log(`   Critical: ${result.stats.criticalViolations}`);
  console.log(`   Warnings: ${result.stats.warningViolations}`);
  console.log(
    `   Performance: ${result.stats.executionTimeMs}ms (budget: ${CONFIG.performanceBudgetMs}ms)`,
  );
  console.log('');

  if (result.passed) {
    console.log('[WARNING] Warnings found, but commit allowed');
    console.log('   Please address these warnings in a follow-up commit');
    console.log('');
    process.exit(0);
  } else {
    console.log('[FAIL] Commit blocked due to critical violations');
    console.log('');
    console.log('[FIX] To resolve:');
    console.log('   1. Run VRT tests: npm run test:vrt');
    console.log('   2. Update snapshots: npm run test:vrt -- --update-snapshots');
    console.log('   3. Add tags: [\'vrt\'] to story meta for critical user paths');
    console.log('   4. Ensure snapshots are newer than component modifications');
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
export type {
  Violation,
  ValidationResult,
  HookDependencies,
  RenderChange,
  VRTStory,
  SnapshotInfo,
};
