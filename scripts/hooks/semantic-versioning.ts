#!/usr/bin/env tsx
/**
 * Hook: semantic-versioning (H23)
 *
 * Auto-generate changeset files for versioned releases.
 * Execution budget: <2 seconds
 *
 * Detects:
 * - Public API changes (components, exports in index.ts)
 * - Missing changeset files when public APIs change
 * - Malformed changeset files
 * - Breaking changes requiring major version bump
 * - Removed CSS parts, slots, events, methods
 * - Property type changes
 *
 * Validates:
 * - Changeset files are well-formed YAML frontmatter + markdown
 * - Breaking changes have "major" bump indicator
 * - Package names match workspace packages
 * - Approval comments include ticket ID and reason
 * - Changeset scope matches changed packages
 *
 * Allows:
 * - Approved exceptions: // @changeset-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/semantic-versioning.ts
 *   tsx scripts/hooks/semantic-versioning.ts --json
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:semantic-versioning
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as YAML from 'yaml';

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
    changesetFiles: number;
    publicAPIChanges: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    executionTimeMs: number;
  };
}

interface ChangesetContent {
  packages: string[];
  bump: 'major' | 'minor' | 'patch';
  summary: string;
}

interface CEMComponent {
  kind: string;
  name: string;
  members?: Array<{
    kind: string;
    name: string;
    type?: { text?: string };
    privacy?: string;
  }>;
  cssParts?: Array<{ name: string }>;
  slots?: Array<{ name: string }>;
  events?: Array<{ name: string }>;
}

interface CEMModule {
  kind: string;
  path: string;
  declarations?: CEMComponent[];
}

interface CustomElementsManifest {
  modules?: CEMModule[];
}

interface ApprovalInfo {
  ticketId: string;
  reason: string;
}

// ─── Configuration ────────────────────────────────────────────────────────

const CONFIG = {
  // Files that indicate public API changes
  publicAPIPatterns: [
    'packages/hx-library/src/index.ts', // Main export file
    'packages/hx-library/src/components/**/index.ts', // Component exports
    'packages/hx-library/src/components/**/*.ts', // Component implementations
  ],

  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Changeset directory
  changesetDir: '.changeset',

  // Workspace packages
  workspacePackages: ['@helixui/library', '@helixui/tokens'],

  // Package directory mapping
  packageDirs: {
    '@helixui/library': 'packages/hx-library',
    '@helixui/tokens': 'packages/hx-tokens',
  } as Record<string, string>,

  // Approval mechanism
  approvalCommentPattern: /@changeset-approved:\s*([A-Z]+-\d+)\s+(.+)/,

  // Execution timeout
  timeoutMs: 2000,

  // CEM file location
  cemPath: 'packages/hx-library/custom-elements.json',
} as const;

// Pre-compile regex patterns for performance (Issue #6 from claude-code-guide)
const COMPILED_PATTERNS = {
  publicAPI: CONFIG.publicAPIPatterns.map(compileGlobPattern),
  exclude: CONFIG.excludePatterns.map(compileGlobPattern),
};

// ─── Utilities ────────────────────────────────────────────────────────────

function compileGlobPattern(pattern: string): RegExp {
  // Fixed glob-to-regex conversion (Issue #4 from claude-code-guide)
  // Escape special regex characters except * and **
  const DOUBLE_STAR_PLACEHOLDER = '§DOUBLESTAR§';
  const regex = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER) // Temporarily replace **
    .replace(/\*/g, '[^/]*') // * matches anything except /
    .replace(new RegExp(DOUBLE_STAR_PLACEHOLDER, 'g'), '.*'); // ** matches anything including /

  return new RegExp(`^${regex}$`);
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });
    return output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

function matchesPattern(file: string, patterns: RegExp[]): boolean {
  return patterns.some((regex) => regex.test(file));
}

function parseApprovalComment(content: string): ApprovalInfo | null {
  // Issue #8 from claude-code-guide: Validate approval format
  const match = content.match(CONFIG.approvalCommentPattern);
  if (!match) return null;

  return {
    ticketId: match[1],
    reason: match[2].trim(),
  };
}

function isApproved(content: string): boolean {
  return parseApprovalComment(content) !== null;
}

function getFileFromCommit(filePath: string, commit: string): string | null {
  try {
    return execSync(`git show ${commit}:${filePath}`, {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });
  } catch {
    return null; // File didn't exist in previous commit (new file)
  }
}

function getChangedPackages(stagedFiles: string[]): string[] {
  const packages = new Set<string>();

  for (const file of stagedFiles) {
    for (const [pkg, dir] of Object.entries(CONFIG.packageDirs)) {
      if (file.startsWith(dir + '/')) {
        packages.add(pkg);
        break;
      }
    }
  }

  return Array.from(packages);
}

// ─── Changeset Detection ──────────────────────────────────────────────────

function getStagedChangesets(stagedFiles: string[]): string[] {
  return stagedFiles.filter(
    (file) =>
      file.startsWith(CONFIG.changesetDir + '/') &&
      file.endsWith('.md') &&
      !file.endsWith('README.md'),
  );
}

function getAllChangesets(): string[] {
  const changesetPath = join(process.cwd(), CONFIG.changesetDir);

  if (!existsSync(changesetPath)) {
    return [];
  }

  try {
    return readdirSync(changesetPath)
      .filter((file) => file.endsWith('.md') && file !== 'README.md')
      .map((file) => join(CONFIG.changesetDir, file));
  } catch {
    return [];
  }
}

function parseChangeset(filePath: string): ChangesetContent | null {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Changeset format:
    // ---
    // "@helixui/library": minor
    // ---
    //
    // Summary text here

    const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    if (!frontmatterMatch) {
      return null;
    }

    const frontmatterText = frontmatterMatch[1];
    const summary = content.slice(frontmatterMatch[0].length).trim();

    // Issue #2 from claude-code-guide: Use yaml library for robust parsing
    let frontmatter: Record<string, string>;
    try {
      frontmatter = YAML.parse(frontmatterText);
      if (!frontmatter || typeof frontmatter !== 'object') {
        return null;
      }
    } catch {
      return null;
    }

    const packages: string[] = [];
    let bump: 'major' | 'minor' | 'patch' = 'patch';

    for (const [pkg, bumpType] of Object.entries(frontmatter)) {
      if (typeof bumpType !== 'string') continue;
      if (!['major', 'minor', 'patch'].includes(bumpType)) continue;

      packages.push(pkg);
      const lineBump = bumpType as 'major' | 'minor' | 'patch';

      // Highest bump wins
      if (lineBump === 'major' || (lineBump === 'minor' && bump === 'patch')) {
        bump = lineBump;
      }
    }

    if (packages.length === 0) {
      return null;
    }

    return { packages, bump, summary };
  } catch {
    return null;
  }
}

// ─── CEM Analysis ─────────────────────────────────────────────────────────

function getCEMForFile(filePath: string): CEMComponent | null {
  const cemPath = join(process.cwd(), CONFIG.cemPath);
  if (!existsSync(cemPath)) return null;

  try {
    const cemContent = readFileSync(cemPath, 'utf-8');
    const cem: CustomElementsManifest = JSON.parse(cemContent);

    if (!cem.modules) return null;

    for (const module of cem.modules) {
      if (module.path === filePath && module.declarations) {
        // Return first component declaration
        return module.declarations.find((d) => d.kind === 'class') || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function getPreviousCEM(filePath: string): CEMComponent | null {
  try {
    const previousCEMContent = getFileFromCommit(CONFIG.cemPath, 'HEAD');
    if (!previousCEMContent) return null;

    const cem: CustomElementsManifest = JSON.parse(previousCEMContent);
    if (!cem.modules) return null;

    for (const module of cem.modules) {
      if (module.path === filePath && module.declarations) {
        return module.declarations.find((d) => d.kind === 'class') || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Breaking Change Detection ────────────────────────────────────────────

interface BreakingChange {
  type: 'export' | 'property' | 'method' | 'part' | 'slot' | 'event' | 'property-type';
  name: string;
  details?: string;
}

function detectBreakingChanges(
  filePath: string,
  currentContent: string,
  previousContent: string,
): BreakingChange[] {
  const breakingChanges: BreakingChange[] = [];

  // Check for removed exports
  const currentExports = extractExports(currentContent);
  const previousExports = extractExports(previousContent);

  Array.from(previousExports).forEach((prevExport) => {
    if (!currentExports.has(prevExport)) {
      breakingChanges.push({ type: 'export', name: prevExport });
    }
  });

  // Check for removed @property decorators
  const currentProps = extractProperties(currentContent);
  const previousProps = extractProperties(previousContent);

  Array.from(previousProps).forEach((prevProp) => {
    if (!currentProps.has(prevProp)) {
      breakingChanges.push({ type: 'property', name: prevProp });
    }
  });

  // Priority 2: Property type changes (Issue #1.4 from principal-engineer)
  const currentPropTypes = extractPropertyTypes(currentContent);
  const previousPropTypes = extractPropertyTypes(previousContent);

  Array.from(previousPropTypes.entries()).forEach(([prop, prevType]) => {
    const currType = currentPropTypes.get(prop);
    if (currType && currType !== prevType) {
      breakingChanges.push({
        type: 'property-type',
        name: prop,
        details: `Type changed from ${prevType} to ${currType}`,
      });
    }
  });

  // Issue #3 from claude-code-guide + Issue #2.1, #2.2 from principal-engineer:
  // Detect CSS parts, slots, events, and methods using CEM
  const currentCEM = getCEMForFile(filePath);
  const previousCEM = getPreviousCEM(filePath);

  if (currentCEM && previousCEM) {
    // Check for removed CSS parts
    const currentParts = new Set((currentCEM.cssParts || []).map((p) => p.name));
    const previousParts = new Set((previousCEM.cssParts || []).map((p) => p.name));

    Array.from(previousParts).forEach((part) => {
      if (!currentParts.has(part)) {
        breakingChanges.push({ type: 'part', name: part });
      }
    });

    // Check for removed slots
    const currentSlots = new Set((currentCEM.slots || []).map((s) => s.name));
    const previousSlots = new Set((previousCEM.slots || []).map((s) => s.name));

    Array.from(previousSlots).forEach((slot) => {
      if (!currentSlots.has(slot)) {
        breakingChanges.push({ type: 'slot', name: slot });
      }
    });

    // Check for removed events
    const currentEvents = new Set((currentCEM.events || []).map((e) => e.name));
    const previousEvents = new Set((previousCEM.events || []).map((e) => e.name));

    Array.from(previousEvents).forEach((event) => {
      if (!currentEvents.has(event)) {
        breakingChanges.push({ type: 'event', name: event });
      }
    });

    // Check for removed public methods
    const currentMethods = new Set(
      (currentCEM.members || [])
        .filter((m) => m.kind === 'method' && m.privacy !== 'private' && m.privacy !== 'protected')
        .map((m) => m.name),
    );
    const previousMethods = new Set(
      (previousCEM.members || [])
        .filter((m) => m.kind === 'method' && m.privacy !== 'private' && m.privacy !== 'protected')
        .map((m) => m.name),
    );

    Array.from(previousMethods).forEach((method) => {
      if (!currentMethods.has(method)) {
        breakingChanges.push({ type: 'method', name: method });
      }
    });
  }

  return breakingChanges;
}

function extractExports(content: string): Set<string> {
  const exports = new Set<string>();
  const exportRegex = /export\s+(?:type\s+)?(?:class|interface|const|function|type)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(content)) !== null) {
    exports.add(match[1]);
  }

  // Also match: export { Foo, Bar }
  const namedExportRegex = /export\s+\{([^}]+)\}/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
    names.forEach((name) => exports.add(name));
  }

  return exports;
}

function extractProperties(content: string): Set<string> {
  const properties = new Set<string>();
  const propertyRegex = /@property\(\{[^}]*\}\)\s+(\w+)/g;
  let match;

  while ((match = propertyRegex.exec(content)) !== null) {
    properties.add(match[1]);
  }

  return properties;
}

function extractPropertyTypes(content: string): Map<string, string> {
  const propertyTypes = new Map<string, string>();
  // Match @property({ type: Type }) propertyName: ActualType
  const propertyRegex = /@property\([^)]*\)\s+(\w+):\s*([^;=\n]+)/g;
  let match;

  while ((match = propertyRegex.exec(content)) !== null) {
    const propName = match[1];
    const propType = match[2].trim();
    propertyTypes.set(propName, propType);
  }

  return propertyTypes;
}

// ─── Validation Logic ─────────────────────────────────────────────────────

function validateChangesets(stagedChangesets: string[]): Violation[] {
  const violations: Violation[] = [];

  for (const changesetFile of stagedChangesets) {
    if (!existsSync(changesetFile)) continue;

    const parsed = parseChangeset(changesetFile);

    if (!parsed) {
      violations.push({
        file: changesetFile,
        line: 1,
        column: 1,
        message: 'Malformed changeset file',
        suggestion:
          'Changeset must have YAML frontmatter with package and bump type. Run `npm run changeset` to create one.',
        severity: 'critical',
      });
      continue;
    }

    // Validate package names
    for (const pkg of parsed.packages) {
      if (!(CONFIG.workspacePackages as readonly string[]).includes(pkg)) {
        violations.push({
          file: changesetFile,
          line: 1,
          column: 1,
          message: `Invalid package name: ${pkg}`,
          suggestion: `Valid packages: ${CONFIG.workspacePackages.join(', ')}`,
          severity: 'critical',
        });
      }
    }

    // Issue #7 from claude-code-guide: Empty summary should be critical
    if (!parsed.summary || parsed.summary.length === 0) {
      violations.push({
        file: changesetFile,
        line: 1,
        column: 1,
        message: 'Changeset summary is missing',
        suggestion: 'Provide a clear summary of what changed',
        severity: 'critical',
      });
    } else if (parsed.summary.length < 10) {
      violations.push({
        file: changesetFile,
        line: 1,
        column: 1,
        message: 'Changeset summary is too short',
        suggestion: 'Provide a clear summary of what changed (at least 10 characters)',
        severity: 'warning',
      });
    }
  }

  return violations;
}

function validateChangesetScope(stagedFiles: string[], changesets: string[]): Violation[] {
  // Priority 2: Changeset scope validation (Issue #1.1 from principal-engineer)
  const violations: Violation[] = [];
  const changedPackages = getChangedPackages(stagedFiles);

  if (changedPackages.length === 0 || changesets.length === 0) {
    return violations;
  }

  const changesetPackages = new Set<string>();
  for (const changesetFile of changesets) {
    const parsed = parseChangeset(changesetFile);
    if (parsed) {
      parsed.packages.forEach((pkg) => changesetPackages.add(pkg));
    }
  }

  // Check if all changed packages are covered by changesets
  for (const pkg of changedPackages) {
    if (!changesetPackages.has(pkg)) {
      violations.push({
        file: changesets[0] || '.changeset',
        line: 1,
        column: 1,
        message: `Package ${pkg} was modified but not included in changeset`,
        suggestion: `Add "${pkg}" to changeset frontmatter or create a new changeset including this package`,
        severity: 'warning',
      });
    }
  }

  return violations;
}

function validateLinkedPackages(changesets: string[]): Violation[] {
  // Priority 2: Linked package enforcement (Issue #1.2 from principal-engineer)
  const violations: Violation[] = [];

  // If @helixui/library has breaking changes, @helixui/tokens should be included
  // (This is a simple heuristic; can be expanded based on actual dependencies)
  let hasLibraryMajor = false;
  const changesetPackages = new Set<string>();

  for (const changesetFile of changesets) {
    const parsed = parseChangeset(changesetFile);
    if (!parsed) continue;

    parsed.packages.forEach((pkg) => changesetPackages.add(pkg));

    if (parsed.packages.includes('@helixui/library') && parsed.bump === 'major') {
      hasLibraryMajor = true;
    }
  }

  if (hasLibraryMajor && !changesetPackages.has('@helixui/tokens')) {
    violations.push({
      file: changesets[0],
      line: 1,
      column: 1,
      message: 'Breaking change in @helixui/library may require @helixui/tokens update',
      suggestion:
        'Consider including @helixui/tokens in changeset if design token changes are needed',
      severity: 'warning',
    });
  }

  return violations;
}

function validatePublicAPIChanges(stagedFiles: string[]): Violation[] {
  const violations: Violation[] = [];

  // Filter to public API files
  const publicAPIFiles = stagedFiles.filter((file) => {
    if (matchesPattern(file, COMPILED_PATTERNS.exclude)) return false;
    return matchesPattern(file, COMPILED_PATTERNS.publicAPI);
  });

  if (publicAPIFiles.length === 0) {
    return violations; // No public API changes
  }

  // Check if any changeset exists
  const allChangesets = getAllChangesets();
  const stagedChangesets = getStagedChangesets(stagedFiles);
  const hasChangeset = allChangesets.length > 0 || stagedChangesets.length > 0;

  if (!hasChangeset) {
    // Check if any file has approval comment
    let hasApproval = false;
    let approvalInfo: ApprovalInfo | null = null;

    for (const file of publicAPIFiles) {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, 'utf-8');
      approvalInfo = parseApprovalComment(content);
      if (approvalInfo) {
        hasApproval = true;
        break;
      }
    }

    if (!hasApproval) {
      violations.push({
        file: publicAPIFiles[0],
        line: 1,
        column: 1,
        message: 'Public API changes detected but no changeset found',
        suggestion:
          'Run `npm run changeset` to create a changeset, or add approval comment: // @changeset-approved: TICKET-123 Reason for approval',
        severity: 'critical',
      });
    } else if (approvalInfo) {
      // Issue #2.4 from principal-engineer: Validate approval format
      if (approvalInfo.reason.length < 10) {
        violations.push({
          file: publicAPIFiles[0],
          line: 1,
          column: 1,
          message: 'Approval reason is too short',
          suggestion: 'Provide a detailed reason for skipping changeset (at least 10 characters)',
          severity: 'warning',
        });
      }
    }
  }

  // Check for breaking changes requiring major bump
  const allBreakingChanges: Array<{ file: string; changes: BreakingChange[] }> = [];

  for (const file of publicAPIFiles) {
    if (!existsSync(file)) continue;

    const currentContent = readFileSync(file, 'utf-8');
    const previousContent = getFileFromCommit(file, 'HEAD');

    if (!previousContent) continue; // New file, not breaking

    const breakingChanges = detectBreakingChanges(file, currentContent, previousContent);

    if (breakingChanges.length > 0) {
      allBreakingChanges.push({ file, changes: breakingChanges });
    }
  }

  if (allBreakingChanges.length > 0) {
    // Check if any changeset has major bump
    const hasMajorBump = [...allChangesets, ...stagedChangesets].some((changesetFile) => {
      const parsed = parseChangeset(changesetFile);
      return parsed?.bump === 'major';
    });

    if (!hasMajorBump) {
      // Check if approved
      const hasApproval = allBreakingChanges.some(({ file }) => {
        if (!existsSync(file)) return false;
        const content = readFileSync(file, 'utf-8');
        return isApproved(content);
      });

      if (!hasApproval) {
        for (const { file, changes } of allBreakingChanges) {
          const changeDescriptions = changes
            .map((c) => {
              switch (c.type) {
                case 'export':
                  return `Removed export: ${c.name}`;
                case 'property':
                  return `Removed property: ${c.name}`;
                case 'method':
                  return `Removed method: ${c.name}`;
                case 'part':
                  return `Removed CSS part: ${c.name}`;
                case 'slot':
                  return `Removed slot: ${c.name}`;
                case 'event':
                  return `Removed event: ${c.name}`;
                case 'property-type':
                  return `Property type change: ${c.name} (${c.details})`;
                default:
                  return `Unknown change: ${c.name}`;
              }
            })
            .join(', ');

          violations.push({
            file,
            line: 1,
            column: 1,
            message: `Breaking changes detected but no major version bump in changeset: ${changeDescriptions}`,
            suggestion:
              'Update changeset to use "major" bump, or add approval comment: // @changeset-approved: TICKET-123 Reason for approval',
            severity: 'critical',
          });
        }
      }
    }
  }

  return violations;
}

function validateFiles(files: string[]): ValidationResult {
  const startTime = Date.now();
  const violations: Violation[] = [];
  const stagedChangesets = getStagedChangesets(files);
  const allChangesets = getAllChangesets();

  // Validate changeset format
  const changesetViolations = validateChangesets(stagedChangesets);
  violations.push(...changesetViolations);

  // Validate changeset scope
  const scopeViolations = validateChangesetScope(files, [...allChangesets, ...stagedChangesets]);
  violations.push(...scopeViolations);

  // Validate linked packages
  const linkedViolations = validateLinkedPackages([...allChangesets, ...stagedChangesets]);
  violations.push(...linkedViolations);

  // Validate public API changes
  const apiViolations = validatePublicAPIChanges(files);
  violations.push(...apiViolations);

  // Count public API files
  const publicAPIFiles = files.filter((file) => {
    if (matchesPattern(file, COMPILED_PATTERNS.exclude)) return false;
    return matchesPattern(file, COMPILED_PATTERNS.publicAPI);
  });

  const criticalViolations = violations.filter((v) => v.severity === 'critical').length;
  const warningViolations = violations.filter((v) => v.severity === 'warning').length;
  const executionTimeMs = Date.now() - startTime;

  return {
    passed: criticalViolations === 0,
    violations,
    stats: {
      filesChecked: files.length,
      changesetFiles: stagedChangesets.length + allChangesets.length,
      publicAPIChanges: publicAPIFiles.length,
      totalViolations: violations.length,
      criticalViolations,
      warningViolations,
      executionTimeMs,
    },
  };
}

// ─── Output Formatting ────────────────────────────────────────────────────

function formatOutput(result: ValidationResult, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  lines.push('');
  lines.push('[HOOK] semantic-versioning (H23)');
  lines.push('━'.repeat(60));
  lines.push('');

  lines.push(`📊 Stats:`);
  lines.push(`   Files checked: ${result.stats.filesChecked}`);
  lines.push(`   Public API changes: ${result.stats.publicAPIChanges}`);
  lines.push(`   Changeset files: ${result.stats.changesetFiles}`);
  lines.push(
    `   Violations: ${result.stats.totalViolations} (${result.stats.criticalViolations} critical, ${result.stats.warningViolations} warnings)`,
  );
  lines.push('');

  if (result.violations.length > 0) {
    const critical = result.violations.filter((v) => v.severity === 'critical');
    const warnings = result.violations.filter((v) => v.severity === 'warning');

    if (critical.length > 0) {
      lines.push(`[FAIL] ${critical.length} critical violation(s):`);
      lines.push('');
      critical.forEach((violation) => {
        lines.push(`❌ ${violation.file}`);
        lines.push(`   ${violation.message}`);
        lines.push(`   💡 ${violation.suggestion}`);
        lines.push('');
      });
    }

    if (warnings.length > 0) {
      lines.push(`[WARN] ${warnings.length} warning(s):`);
      lines.push('');
      warnings.forEach((violation) => {
        lines.push(`⚠️  ${violation.file}`);
        lines.push(`   ${violation.message}`);
        lines.push(`   💡 ${violation.suggestion}`);
        lines.push('');
      });
    }

    lines.push('━'.repeat(60));
    lines.push('💡 Changeset workflow:');
    lines.push('   1. Run: npm run changeset');
    lines.push('   2. Select affected packages');
    lines.push('   3. Choose bump type (major/minor/patch)');
    lines.push('   4. Write summary of changes');
    lines.push('   5. Commit the generated .changeset/*.md file');
    lines.push('');
    lines.push('Breaking changes require "major" bump:');
    lines.push('   - Removed exports, properties, methods');
    lines.push('   - Changed method signatures');
    lines.push('   - Removed CSS parts, slots, events');
    lines.push('   - Changed property types');
    lines.push('');
    lines.push('Approval comment format:');
    lines.push('   // @changeset-approved: TICKET-123 Detailed reason for approval');
    lines.push('');
  } else {
    lines.push('[PASS] No semantic versioning violations found');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  const startTime = Date.now();
  const jsonMode = process.argv.includes('--json');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    if (!jsonMode) {
      console.log('[INFO] No staged files to check.');
    }
    process.exit(0);
  }

  const result = validateFiles(stagedFiles);
  const duration = Date.now() - startTime;

  console.log(formatOutput(result, jsonMode));

  if (!jsonMode) {
    console.log(`⏱️  Execution time: ${duration}ms (budget: <${CONFIG.timeoutMs}ms)`);
    console.log('');

    // Priority 3: Performance monitoring (Issue #2.3 from principal-engineer)
    if (duration > CONFIG.timeoutMs) {
      console.log(
        `⚠️  WARNING: Execution time exceeded budget by ${duration - CONFIG.timeoutMs}ms`,
      );
    }
  }

  process.exit(result.passed ? 0 : 1);
}

main();
