import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import {
  BREAKING_CHANGES_MANIFEST,
  type BreakingChange,
  type BreakingChangeType,
} from '../breaking-changes-manifest.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MigrateVersionOptions {
  /** Semver string for the version the consumer is currently on (e.g. "0.1.3"). */
  fromVersion: string;
  /** Semver string for the version the consumer is migrating to (e.g. "0.2.0"). */
  toVersion: string;
  /** Absolute or relative path to the consumer project root. */
  projectRoot: string;
}

export interface AffectedFile {
  /** Relative path from project root. */
  path: string;
  /** Number of pattern matches in this file. */
  occurrences: number;
  /** 1-indexed line numbers where matches were found. */
  lines: number[];
}

export interface MigrationStep {
  changeId: string;
  version: string;
  type: BreakingChangeType;
  component: string | undefined;
  description: string;
  before: string;
  after: string;
  replacePattern: string | undefined;
  affectedFiles: AffectedFile[];
  totalOccurrences: number;
}

export interface MigrationPlan {
  fromVersion: string;
  toVersion: string;
  projectRoot: string;
  applicableChanges: number;
  filesScanned: number;
  steps: MigrationStep[];
  summary: string;
}

// ─── Semver utilities ─────────────────────────────────────────────────────────

type SemverTuple = [number, number, number];

function parseSemver(version: string): SemverTuple {
  const cleaned = version.replace(/^[~^v]/, '');
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (match === null) {
    throw new Error(
      `Invalid semver string: "${version}". Expected format: MAJOR.MINOR.PATCH (e.g. "0.2.0")`,
    );
  }
  const major = parseInt(match[1] ?? '0', 10);
  const minor = parseInt(match[2] ?? '0', 10);
  const patch = parseInt(match[3] ?? '0', 10);
  return [major, minor, patch];
}

/** Returns true if a > b. */
function semverGt(a: SemverTuple, b: SemverTuple): boolean {
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  return a[2] > b[2];
}

/** Returns true if a <= b. */
function semverLte(a: SemverTuple, b: SemverTuple): boolean {
  return !semverGt(a, b);
}

/**
 * Returns true if the breaking change version is strictly greater than fromVersion
 * and less than or equal to toVersion — i.e., it applies to this migration range.
 */
function isInRange(changeVersion: string, from: SemverTuple, to: SemverTuple): boolean {
  let changeVer: SemverTuple;
  try {
    changeVer = parseSemver(changeVersion);
  } catch {
    return false;
  }
  return semverGt(changeVer, from) && semverLte(changeVer, to);
}

// ─── File scanning ────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.next',
  '.nuxt',
  '.turbo',
  'vendor',
]);

function collectSourceFiles(dir: string, extensions: Set<string>, depth = 0): string[] {
  if (depth > 10 || !existsSync(dir)) return [];
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...collectSourceFiles(full, extensions, depth + 1));
    } else if (stat.isFile()) {
      const ext = extname(entry).toLowerCase().slice(1); // strip leading dot
      if (extensions.has(ext)) {
        results.push(full);
      }
    }
  }
  return results;
}

interface ScanResult {
  occurrences: number;
  lines: number[];
}

function scanFile(filePath: string, pattern: RegExp): ScanResult {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return { occurrences: 0, lines: [] };
  }

  const lineStarts: number[] = [];
  lineStarts.push(0);
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') lineStarts.push(i + 1);
  }

  const lines = new Set<number>();
  let match: RegExpExecArray | null;
  pattern.lastIndex = 0;

  while ((match = pattern.exec(content)) !== null) {
    const offset = match.index;
    // Binary search for the line number
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      const startOffset = lineStarts[mid];
      if (startOffset !== undefined && startOffset <= offset) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    lines.add(lo + 1); // 1-indexed
  }

  return { occurrences: lines.size, lines: Array.from(lines).sort((a, b) => a - b) };
}

// ─── Migration plan builder ───────────────────────────────────────────────────

function buildStep(
  change: BreakingChange,
  projectRoot: string,
  allFiles: Map<string, string[]>,
): MigrationStep {
  const extensions = new Set(change.fileExtensions);
  const flags = `${change.searchFlags ?? 'g'}`;

  let pattern: RegExp;
  try {
    pattern = new RegExp(change.searchPattern, flags);
  } catch {
    // Invalid regex in manifest — return step with no affected files
    return {
      changeId: change.id,
      version: change.version,
      type: change.type,
      component: change.component,
      description: change.description,
      before: change.before,
      after: change.after,
      replacePattern: change.replacePattern,
      affectedFiles: [],
      totalOccurrences: 0,
    };
  }

  const affectedFiles: AffectedFile[] = [];
  let totalOccurrences = 0;

  for (const ext of extensions) {
    const files = allFiles.get(ext) ?? [];
    for (const filePath of files) {
      // Reset lastIndex for each file scan since we reuse the pattern
      pattern.lastIndex = 0;
      const result = scanFile(filePath, pattern);
      if (result.occurrences > 0) {
        const relativePath = filePath.startsWith(projectRoot)
          ? filePath.slice(projectRoot.length + 1)
          : filePath;
        affectedFiles.push({
          path: relativePath,
          occurrences: result.occurrences,
          lines: result.lines,
        });
        totalOccurrences += result.occurrences;
      }
    }
  }

  // Sort affected files by occurrence count descending (highest impact first)
  affectedFiles.sort((a, b) => b.occurrences - a.occurrences);

  return {
    changeId: change.id,
    version: change.version,
    type: change.type,
    component: change.component,
    description: change.description,
    before: change.before,
    after: change.after,
    replacePattern: change.replacePattern,
    affectedFiles,
    totalOccurrences,
  };
}

// ─── Report formatting ────────────────────────────────────────────────────────

function typeLabel(type: BreakingChangeType): string {
  switch (type) {
    case 'renamed-property':
      return 'RENAMED PROPERTY';
    case 'renamed-event':
      return 'RENAMED EVENT';
    case 'renamed-slot':
      return 'RENAMED SLOT';
    case 'renamed-csspart':
      return 'RENAMED CSS PART';
    case 'renamed-token':
      return 'RENAMED TOKEN';
    case 'renamed-import':
      return 'RENAMED IMPORT';
    case 'removed-property':
      return 'REMOVED PROPERTY';
    case 'behavior-change':
      return 'BEHAVIOR CHANGE';
  }
}

function formatPlan(plan: MigrationPlan): string {
  const lines: string[] = [];

  lines.push(`Migration Plan: ${plan.fromVersion} → ${plan.toVersion}`);
  lines.push(`  Project: ${plan.projectRoot}`);
  lines.push(`  Files scanned: ${plan.filesScanned}`);
  lines.push(`  Applicable breaking changes: ${plan.applicableChanges}`);
  lines.push('');
  lines.push(`Summary: ${plan.summary}`);

  if (plan.steps.length === 0) {
    return lines.join('\n');
  }

  const stepsWithHits = plan.steps.filter((s) => s.totalOccurrences > 0);
  const stepsWithoutHits = plan.steps.filter((s) => s.totalOccurrences === 0);

  if (stepsWithHits.length > 0) {
    lines.push('');
    lines.push(
      `Action Required (${stepsWithHits.length} change${stepsWithHits.length === 1 ? '' : 's'} found in project):`,
    );

    for (const step of stepsWithHits) {
      lines.push('');
      lines.push(`  [${typeLabel(step.type)}] ${step.changeId} (introduced in v${step.version})`);
      if (step.component !== undefined) {
        lines.push(`    Component: ${step.component}`);
      }
      lines.push(`    Description: ${step.description}`);
      lines.push('');
      lines.push(`    Before:`);
      for (const bLine of step.before.split('\n')) {
        lines.push(`      ${bLine}`);
      }
      lines.push(`    After:`);
      for (const aLine of step.after.split('\n')) {
        lines.push(`      ${aLine}`);
      }
      if (step.replacePattern !== undefined) {
        const searchPat =
          BREAKING_CHANGES_MANIFEST.changes.find((c) => c.id === step.changeId)?.searchPattern ??
          '';
        lines.push('');
        lines.push(`    Automated migration (find-and-replace):`);
        lines.push(`      Search:  ${searchPat}`);
        lines.push(`      Replace: ${step.replacePattern}`);
      }
      lines.push('');
      lines.push(
        `    Affected files (${step.affectedFiles.length} file${step.affectedFiles.length === 1 ? '' : 's'}, ${step.totalOccurrences} occurrence${step.totalOccurrences === 1 ? '' : 's'}):`,
      );
      for (const file of step.affectedFiles) {
        const lineList = file.lines.slice(0, 5).join(', ');
        const more = file.lines.length > 5 ? ` +${file.lines.length - 5} more` : '';
        lines.push(`      ${file.path} (lines: ${lineList}${more})`);
      }
    }
  }

  if (stepsWithoutHits.length > 0) {
    lines.push('');
    lines.push(
      `No Action Needed (${stepsWithoutHits.length} applicable change${stepsWithoutHits.length === 1 ? '' : 's'} not found in project):`,
    );
    for (const step of stepsWithoutHits) {
      lines.push(`  - [${typeLabel(step.type)}] ${step.changeId} — no occurrences found`);
    }
  }

  return lines.join('\n');
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function migrateVersion(opts: MigrateVersionOptions): MigrationPlan {
  const absoluteRoot = resolve(opts.projectRoot);

  if (!existsSync(absoluteRoot)) {
    throw new Error(`Project root not found: ${absoluteRoot}`);
  }

  const rootStat = statSync(absoluteRoot);
  if (!rootStat.isDirectory()) {
    throw new Error(`Project root is not a directory: ${absoluteRoot}`);
  }

  // Validate and parse versions
  let from: SemverTuple;
  let to: SemverTuple;
  try {
    from = parseSemver(opts.fromVersion);
  } catch {
    throw new Error(`Invalid fromVersion: "${opts.fromVersion}". Expected semver (e.g. "0.1.0")`);
  }
  try {
    to = parseSemver(opts.toVersion);
  } catch {
    throw new Error(`Invalid toVersion: "${opts.toVersion}". Expected semver (e.g. "0.2.0")`);
  }

  if (!semverGt(to, from)) {
    throw new Error(
      `toVersion "${opts.toVersion}" must be greater than fromVersion "${opts.fromVersion}"`,
    );
  }

  // Filter applicable breaking changes
  const applicableChanges = BREAKING_CHANGES_MANIFEST.changes.filter((c) =>
    isInRange(c.version, from, to),
  );

  if (applicableChanges.length === 0) {
    return {
      fromVersion: opts.fromVersion,
      toVersion: opts.toVersion,
      projectRoot: absoluteRoot,
      applicableChanges: 0,
      filesScanned: 0,
      steps: [],
      summary: `No breaking changes found between v${opts.fromVersion} and v${opts.toVersion}.`,
    };
  }

  // Collect all unique file extensions needed by the applicable changes
  const neededExtensions = new Set<string>();
  for (const change of applicableChanges) {
    for (const ext of change.fileExtensions) {
      neededExtensions.add(ext);
    }
  }

  // Collect all files, grouped by extension, in a single pass
  const allFiles = new Map<string, string[]>();
  for (const ext of neededExtensions) {
    allFiles.set(ext, []);
  }

  const allCollected = collectSourceFiles(absoluteRoot, neededExtensions);
  let filesScanned = 0;
  for (const filePath of allCollected) {
    const ext = extname(filePath).toLowerCase().slice(1);
    const bucket = allFiles.get(ext);
    if (bucket !== undefined) {
      bucket.push(filePath);
      filesScanned++;
    }
  }

  // Build migration steps, ordered by total occurrences descending (highest impact first)
  const steps = applicableChanges.map((change) => buildStep(change, absoluteRoot, allFiles));
  steps.sort((a, b) => b.totalOccurrences - a.totalOccurrences);

  const totalOccurrences = steps.reduce((acc, s) => acc + s.totalOccurrences, 0);
  const stepsWithHits = steps.filter((s) => s.totalOccurrences > 0);
  const uniqueAffectedFiles = new Set<string>();
  for (const step of stepsWithHits) {
    for (const file of step.affectedFiles) {
      uniqueAffectedFiles.add(file.path);
    }
  }

  const summary =
    stepsWithHits.length === 0
      ? `${applicableChanges.length} breaking change${applicableChanges.length === 1 ? '' : 's'} in this range — none found in ${filesScanned} scanned files. Project appears already migrated.`
      : `${stepsWithHits.length} of ${applicableChanges.length} breaking change${applicableChanges.length === 1 ? '' : 's'} affect this project: ` +
        `${totalOccurrences} occurrence${totalOccurrences === 1 ? '' : 's'} across ` +
        `${uniqueAffectedFiles.size} file${uniqueAffectedFiles.size === 1 ? '' : 's'}.`;

  return {
    fromVersion: opts.fromVersion,
    toVersion: opts.toVersion,
    projectRoot: absoluteRoot,
    applicableChanges: applicableChanges.length,
    filesScanned,
    steps,
    summary,
  };
}

export function formatMigrationPlan(plan: MigrationPlan): string {
  return formatPlan(plan);
}
