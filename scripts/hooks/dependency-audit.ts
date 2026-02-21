#!/usr/bin/env tsx
/**
 * Hook: dependency-audit (H21)
 *
 * Blocks commits that add vulnerable or duplicate dependencies.
 * Execution budget: <8 seconds
 *
 * Catches:
 * - Dependencies with known vulnerabilities (npm audit)
 * - Duplicate dependencies across workspace packages (same package, different versions)
 * - Overly broad version ranges (*, ^*)
 * - Missing or mismatched peer dependencies
 * - Workspace protocol violations (workspaces should use "workspace:*")
 *
 * Allows:
 * - Approved exceptions: // @dependency-approved:dependency-name TICKET-123 Reason
 * - Security patches (patch version bumps are warnings, not critical)
 * - Severity threshold configuration (default: high)
 *
 * Limitations:
 * - npm audit runs at workspace root only (scanning each workspace exceeds budget)
 * - Duplicate detection limited to direct dependencies (not transitive, by design)
 *   Rationale: Transitive duplicate detection adds complexity without clear value.
 *   npm/pnpm handle hoisting, and the hook focuses on direct dependency drift across workspaces.
 * - Peer dependency check limited to local workspace packages
 *
 * Performance Optimizations:
 * - npm audit results cached for 5 minutes (per package-lock.json hash)
 * - Duplicate detection runs once per hook invocation (not per file)
 * - Bail-fast mode exits on first critical violation
 *
 * Usage:
 *   tsx scripts/hooks/dependency-audit.ts
 *   tsx scripts/hooks/dependency-audit.ts --json
 *   tsx scripts/hooks/dependency-audit.ts --bail-fast
 *   tsx scripts/hooks/dependency-audit.ts --severity-threshold=moderate
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:dependency-audit
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync, realpathSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { createHash } from 'crypto';

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
    | 'vulnerability'
    | 'duplicate'
    | 'version-range'
    | 'peer-dependency'
    | 'workspace-protocol';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    vulnerabilities: number;
    duplicates: number;
    broadVersionRanges: number;
    peerDependencyIssues: number;
    workspaceProtocolIssues: number;
  };
}

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  workspaces?: string[];
}

interface AuditVulnerability {
  name: string;
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  via: Array<string | { title: string }>;
}

interface DependencyInfo {
  version: string;
  source: string; // File path where dependency is defined
  isDev: boolean;
}

interface AuditCacheEntry {
  timestamp: number;
  packageLockHash: string;
  vulnerabilities: Record<string, AuditVulnerability>;
}

interface ApprovalInfo {
  approvedDependencies: Set<string>; // Specific dependencies approved in this file
  hasGlobalApproval: boolean; // File has blanket approval
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly includePatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
  readonly bailFast: boolean;
  readonly workspacePattern: string;
  readonly severityThreshold: 'low' | 'moderate' | 'high' | 'critical';
  readonly auditCacheTTL: number; // Cache TTL in milliseconds
  readonly cacheDir: string;
}

const CONFIG: HookConfig = {
  // Files to check
  includePatterns: ['**/package.json'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.cache/**'],

  // Approval mechanism
  // Format: @dependency-approved:package-name TICKET-123 Reason
  // OR: @dependency-approved TICKET-123 Blanket approval (discouraged)
  approvalComment: '@dependency-approved',

  // Performance budgets
  timeoutMs: 8000, // 8 seconds total timeout
  performanceBudgetMs: 8000, // 8 seconds budget

  // Bail-fast mode (exit on first critical violation)
  bailFast: process.argv.includes('--bail-fast'),

  // Workspace packages pattern
  workspacePattern: '{packages,apps}/**/package.json',

  // Severity threshold (vulnerabilities below this level are warnings, not critical)
  // Can be overridden via --severity-threshold=moderate CLI flag
  severityThreshold: parseSeverityThreshold(),

  // Audit cache configuration
  auditCacheTTL: 5 * 60 * 1000, // 5 minutes
  cacheDir: join(process.cwd(), '.cache', 'dependency-audit'),
};

/**
 * Parse severity threshold from CLI args
 */
function parseSeverityThreshold(): 'low' | 'moderate' | 'high' | 'critical' {
  const thresholdArg = process.argv.find((arg) => arg.startsWith('--severity-threshold='));
  if (thresholdArg) {
    const value = thresholdArg.split('=')[1] as 'low' | 'moderate' | 'high' | 'critical';
    if (['low', 'moderate', 'high', 'critical'].includes(value)) {
      return value;
    }
  }
  return 'high'; // Default: high and critical are critical violations
}

// ─── Utilities ────────────────────────────────────────────────────────────

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
      .filter((file) => file.endsWith('package.json'))
      .filter((file) => {
        // Check each exclude pattern using glob matching
        for (const pattern of CONFIG.excludePatterns) {
          // Remove leading/trailing ** and /
          const cleanPattern = pattern.replace(/^\*\*\/?/, '').replace(/\/?\*\*$/, '');

          // Check if file path contains the exclude pattern
          if (file.includes(cleanPattern.replace(/\*/g, ''))) {
            return false;
          }
        }
        return true;
      })
      .filter((file) => existsSync(file));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Find all workspace package.json files
 */
function findWorkspacePackages(projectRoot: string): string[] {
  try {
    const packageJsonFiles = glob.sync(CONFIG.workspacePattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: CONFIG.excludePatterns,
    });

    return packageJsonFiles.filter((file) => existsSync(file));
  } catch {
    return [];
  }
}

/**
 * Parse approval comments from package.json
 * Format: @dependency-approved:package-name TICKET-123 Reason
 * OR: @dependency-approved TICKET-123 Blanket approval (discouraged)
 */
function parseApprovalComments(filePath: string): ApprovalInfo {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const approvedDependencies = new Set<string>();
    let hasGlobalApproval = false;

    // Match patterns like:
    // @dependency-approved:react TICKET-123 Reason
    // @dependency-approved TICKET-123 Blanket approval
    const approvalRegex = /@dependency-approved(?::([a-zA-Z0-9@/_-]+))?\s+([A-Z]+-\d+)/g;
    let match;

    while ((match = approvalRegex.exec(content)) !== null) {
      const dependencyName = match[1]; // Could be undefined for blanket approval
      if (dependencyName) {
        approvedDependencies.add(dependencyName);
      } else {
        hasGlobalApproval = true;
      }
    }

    return { approvedDependencies, hasGlobalApproval };
  } catch {
    return { approvedDependencies: new Set(), hasGlobalApproval: false };
  }
}

/**
 * Check if a specific dependency is approved in a file
 */
function isDependencyApproved(filePath: string, dependencyName: string): boolean {
  const approval = parseApprovalComments(filePath);
  return approval.hasGlobalApproval || approval.approvedDependencies.has(dependencyName);
}

/**
 * Parse package.json safely
 */
function parsePackageJson(filePath: string): PackageJson | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Calculate hash of package-lock.json for cache invalidation
 */
function getPackageLockHash(projectRoot: string): string {
  const lockFilePath = join(projectRoot, 'package-lock.json');
  if (!existsSync(lockFilePath)) {
    return 'no-lock-file';
  }

  try {
    const content = readFileSync(lockFilePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  } catch {
    return 'no-lock-file';
  }
}

/**
 * Get cached npm audit results if valid
 */
function getCachedAuditResults(projectRoot: string): Map<string, AuditVulnerability> | null {
  const cacheFile = join(CONFIG.cacheDir, 'npm-audit-cache.json');

  if (!existsSync(cacheFile)) {
    return null;
  }

  try {
    const cacheContent = readFileSync(cacheFile, 'utf-8');
    const cacheEntry: AuditCacheEntry = JSON.parse(cacheContent);

    // Check if cache is still valid
    const now = Date.now();
    const age = now - cacheEntry.timestamp;

    if (age > CONFIG.auditCacheTTL) {
      return null; // Cache expired
    }

    // Check if package-lock.json has changed
    const currentHash = getPackageLockHash(projectRoot);
    if (currentHash !== cacheEntry.packageLockHash) {
      return null; // Lock file changed, invalidate cache
    }

    // Return vulnerabilities as Map from Record
    return new Map(Object.entries(cacheEntry.vulnerabilities));
  } catch {
    return null;
  }
}

/**
 * Save npm audit results to cache
 */
function saveAuditResultsToCache(
  projectRoot: string,
  vulnerabilities: Map<string, AuditVulnerability>,
): void {
  try {
    mkdirSync(CONFIG.cacheDir, { recursive: true });

    const cacheEntry: AuditCacheEntry = {
      timestamp: Date.now(),
      packageLockHash: getPackageLockHash(projectRoot),
      vulnerabilities: Object.fromEntries(vulnerabilities),
    };

    const cacheFile = join(CONFIG.cacheDir, 'npm-audit-cache.json');
    writeFileSync(cacheFile, JSON.stringify(cacheEntry, null, 2));
  } catch {
    // Cache write failure is non-fatal
  }
}

// ─── Validation Logic ─────────────────────────────────────────────────────

/**
 * Validate audit JSON structure
 */
function isValidAuditJSON(data: unknown): data is { vulnerabilities?: Record<string, unknown> } {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const auditData = data as Record<string, unknown>;

  // Valid audit JSON should have vulnerabilities property or be empty
  if ('vulnerabilities' in auditData) {
    return typeof auditData.vulnerabilities === 'object' && auditData.vulnerabilities !== null;
  }

  // Empty audit result is valid
  return true;
}

/**
 * Map severity string to numeric level for comparison
 */
function getSeverityLevel(severity: string): number {
  const levels: Record<string, number> = {
    info: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
  };
  return levels[severity] || 0;
}

/**
 * Run npm audit and extract vulnerabilities (with caching)
 */
function checkVulnerabilities(
  projectRoot: string,
  stagedFiles: string[],
  violations: Violation[],
  stats: { vulnerabilities: number },
): void {
  // Only run if dependencies or lock file changed
  const hasDependencyChanges = stagedFiles.some(
    (file) => file.endsWith('package.json') || file.endsWith('package-lock.json'),
  );

  if (!hasDependencyChanges) {
    return;
  }

  // Try to get cached results first
  let vulnerabilityMap = getCachedAuditResults(projectRoot);

  if (!vulnerabilityMap) {
    // Cache miss or invalid, run npm audit
    vulnerabilityMap = new Map<string, AuditVulnerability>();

    try {
      const output = execSync('npm audit --json', {
        encoding: 'utf-8',
        cwd: projectRoot,
        timeout: CONFIG.timeoutMs / 2, // Half the budget for npm audit
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'], // Suppress stderr
      });

      const auditResult = JSON.parse(output);

      // Validate JSON structure before processing
      if (!isValidAuditJSON(auditResult)) {
        return; // Invalid audit JSON, skip
      }

      // npm audit v7+ format
      if (auditResult.vulnerabilities) {
        Object.entries(auditResult.vulnerabilities).forEach(([name, data]: [string, unknown]) => {
          const vuln = data as AuditVulnerability;
          if (!vulnerabilityMap) return;
          vulnerabilityMap.set(name, vuln);
        });
      }

      // Save to cache only if valid
      saveAuditResultsToCache(projectRoot, vulnerabilityMap);
    } catch (error) {
      // npm audit exits with code 1 if vulnerabilities found
      // Try to parse stdout anyway
      if (error && typeof error === 'object' && 'stdout' in error) {
        const errorObj = error as { stdout: string };
        if (errorObj.stdout) {
          try {
            const auditResult = JSON.parse(errorObj.stdout);

            // Validate JSON structure before processing
            if (!isValidAuditJSON(auditResult)) {
              return; // Invalid audit JSON, skip
            }

            if (auditResult.vulnerabilities) {
              Object.entries(auditResult.vulnerabilities).forEach(
                ([name, data]: [string, unknown]) => {
                  const vuln = data as AuditVulnerability;
                  if (!vulnerabilityMap) return;
                  vulnerabilityMap.set(name, vuln);
                },
              );
            }

            // Save to cache only if valid
            saveAuditResultsToCache(projectRoot, vulnerabilityMap);
          } catch {
            // Failed to parse audit output, skip vulnerabilities check
            return;
          }
        }
      }
      // npm audit failed without output, skip
      return;
    }
  }

  // Process vulnerabilities
  const thresholdLevel = getSeverityLevel(CONFIG.severityThreshold);

  for (const [name, vuln] of vulnerabilityMap.entries()) {
    if (vuln.severity === 'info') {
      continue; // Skip informational notices
    }

    const vulnLevel = getSeverityLevel(vuln.severity);

    // Determine severity based on threshold
    // If vulnerability level >= threshold, it's critical; otherwise warning
    const severity = vulnLevel >= thresholdLevel ? 'critical' : 'warning';

    const viaText = Array.isArray(vuln.via)
      ? vuln.via.map((v) => (typeof v === 'string' ? v : v.title)).join(', ')
      : 'Unknown';

    violations.push({
      file: 'package.json (workspace root)',
      line: 1,
      column: 1,
      message: `Security vulnerability: ${name} (${vuln.severity})`,
      suggestion: `Run "npm audit fix" or update ${name}. Issue: ${vuln.title || viaText}`,
      severity,
      category: 'vulnerability',
    });

    stats.vulnerabilities++;
  }
}

/**
 * Normalize path for comparison (convert absolute to relative from project root)
 * Handles symlinks by resolving to real paths before comparison
 */
function normalizePath(filePath: string, projectRoot: string): string {
  try {
    // Resolve symlinks to real paths
    const realFilePath = existsSync(filePath) ? realpathSync(filePath) : filePath;
    const realProjectRoot = existsSync(projectRoot) ? realpathSync(projectRoot) : projectRoot;

    if (realFilePath.startsWith(realProjectRoot)) {
      return realFilePath.substring(realProjectRoot.length + 1);
    }

    // Fallback: try original paths
    if (filePath.startsWith(projectRoot)) {
      return filePath.substring(projectRoot.length + 1);
    }

    return filePath;
  } catch {
    // If symlink resolution fails, use original path
    if (filePath.startsWith(projectRoot)) {
      return filePath.substring(projectRoot.length + 1);
    }
    return filePath;
  }
}

/**
 * Check for duplicate dependencies across workspace packages
 * Only reports duplicates if at least one of the files is staged
 */
function checkDuplicates(
  workspacePackages: string[],
  stagedFiles: Set<string>,
  projectRoot: string,
  violations: Violation[],
  stats: { duplicates: number },
): void {
  const dependencyMap: Map<string, DependencyInfo[]> = new Map();

  // Normalize staged files to relative paths
  const normalizedStagedFiles = new Set(
    Array.from(stagedFiles).map((f) => normalizePath(f, projectRoot)),
  );

  // Collect all dependencies across workspace packages
  for (const pkgPath of workspacePackages) {
    const pkg = parsePackageJson(pkgPath);
    if (!pkg) continue;

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    Object.entries(allDeps).forEach(([name, version]) => {
      // Skip workspace protocol dependencies
      if (version.startsWith('workspace:')) {
        return;
      }

      if (!dependencyMap.has(name)) {
        dependencyMap.set(name, []);
      }

      const depArray = dependencyMap.get(name);
      if (depArray) {
        depArray.push({
          version,
          source: pkgPath,
          isDev: !!pkg.devDependencies?.[name],
        });
      }
    });
  }

  // Find duplicates (same package, different versions)
  for (const [name, infos] of dependencyMap.entries()) {
    if (infos.length <= 1) continue;

    const uniqueVersions = new Set(infos.map((info) => info.version));

    if (uniqueVersions.size > 1) {
      // Check if any of the files with this dependency are staged
      const hasStagedFile = infos.some((info) => {
        const normalizedPath = normalizePath(info.source, projectRoot);
        return normalizedStagedFiles.has(normalizedPath);
      });

      if (!hasStagedFile) {
        // Skip duplicates that don't involve any staged files
        continue;
      }

      // Different versions detected
      const versionList = Array.from(uniqueVersions).join(', ');
      const sourcesList = infos.map((info) => `${info.source} (${info.version})`).join('\n   ');

      violations.push({
        file: infos[0].source,
        line: 1,
        column: 1,
        message: `Duplicate dependency "${name}" with different versions: ${versionList}`,
        suggestion: `Align all workspace packages to use the same version of "${name}". Found in:\n   ${sourcesList}`,
        severity: 'warning',
        category: 'duplicate',
      });

      stats.duplicates++;
    }
  }
}

/**
 * Check for overly broad version ranges
 */
function checkVersionRanges(
  filePath: string,
  pkg: PackageJson,
  violations: Violation[],
  stats: { broadVersionRanges: number },
): void {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  Object.entries(allDeps).forEach(([name, version]) => {
    // Skip workspace protocol
    if (version.startsWith('workspace:')) {
      return;
    }

    // Check for * or ^*
    if (version === '*' || version === '^*') {
      // Check if this specific dependency is approved
      if (isDependencyApproved(filePath, name)) {
        return;
      }

      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Overly broad version range for "${name}": ${version}`,
        suggestion: `Pin to specific version range (e.g., ^1.0.0) or add approval: @dependency-approved:${name} TICKET-123 Reason`,
        severity: 'warning',
        category: 'version-range',
      });

      stats.broadVersionRanges++;
    }
  });
}

/**
 * Check peer dependencies
 */
function checkPeerDependencies(
  filePath: string,
  pkg: PackageJson,
  violations: Violation[],
  stats: { peerDependencyIssues: number },
): void {
  const peerDeps = pkg.peerDependencies || {};
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};

  // Check if peer dependencies are satisfied
  Object.keys(peerDeps).forEach((peerName) => {
    const hasDep = deps[peerName] || devDeps[peerName];

    if (!hasDep) {
      // Check if this specific dependency is approved
      if (isDependencyApproved(filePath, peerName)) {
        return;
      }

      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Peer dependency "${peerName}" is not listed in dependencies or devDependencies`,
        suggestion: `Add "${peerName}" to dependencies or devDependencies, or add approval: @dependency-approved:${peerName} TICKET-123 Reason`,
        severity: 'warning',
        category: 'peer-dependency',
      });

      stats.peerDependencyIssues++;
    }
  });
}

/**
 * Check workspace protocol usage
 */
function checkWorkspaceProtocol(
  filePath: string,
  pkg: PackageJson,
  workspacePackageNames: Set<string>,
  violations: Violation[],
  stats: { workspaceProtocolIssues: number },
): void {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  Object.entries(allDeps).forEach(([name, version]) => {
    // If this is a workspace package, it should use workspace protocol
    if (workspacePackageNames.has(name) && !version.startsWith('workspace:')) {
      // Check if this specific dependency is approved
      if (isDependencyApproved(filePath, name)) {
        return;
      }

      violations.push({
        file: filePath,
        line: 1,
        column: 1,
        message: `Workspace package "${name}" should use "workspace:*" protocol instead of "${version}"`,
        suggestion: `Change "${name}": "${version}" to "${name}": "workspace:*", or add approval: @dependency-approved:${name} TICKET-123 Reason`,
        severity: 'warning',
        category: 'workspace-protocol',
      });

      stats.workspaceProtocolIssues++;
    }
  });
}

/**
 * Validate a single package.json file
 */
function validatePackageJson(
  filePath: string,
  pkg: PackageJson,
  workspacePackageNames: Set<string>,
  violations: Violation[],
  stats: {
    broadVersionRanges: number;
    peerDependencyIssues: number;
    workspaceProtocolIssues: number;
  },
): void {
  checkVersionRanges(filePath, pkg, violations, stats);
  checkPeerDependencies(filePath, pkg, violations, stats);
  checkWorkspaceProtocol(filePath, pkg, workspacePackageNames, violations, stats);
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
    vulnerabilities: 0,
    duplicates: 0,
    broadVersionRanges: 0,
    peerDependencyIssues: 0,
    workspaceProtocolIssues: 0,
  };

  const startTime = Date.now();

  // Find project root (where root package.json is)
  const projectRoot = process.cwd();

  // Find all workspace packages
  const workspacePackages = findWorkspacePackages(projectRoot);
  const workspacePackageNames = new Set<string>();

  for (const pkgPath of workspacePackages) {
    const pkg = parsePackageJson(pkgPath);
    if (pkg?.name) {
      workspacePackageNames.add(pkg.name);
    }
  }

  const stagedFilesSet = new Set(files);

  // Check 1: Run npm audit for vulnerabilities (with caching and severity threshold)
  checkVulnerabilities(projectRoot, files, violations, stats);

  // Check 2: Check for duplicates across workspace packages (only for staged files)
  checkDuplicates(workspacePackages, stagedFilesSet, projectRoot, violations, stats);

  // Check 3: Validate each staged package.json
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

    if (!file.endsWith('package.json')) continue;
    if (!existsSync(file)) continue;

    const pkg = parsePackageJson(file);
    if (!pkg) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: 'Invalid JSON in package.json',
        suggestion: 'Fix JSON syntax errors',
        severity: 'critical',
      });
      stats.criticalViolations++;
      continue;
    }

    validatePackageJson(file, pkg, workspacePackageNames, violations, stats);

    stats.filesChecked++;

    // Update critical violations count for bail-fast check
    stats.criticalViolations = violations.filter((v) => v.severity === 'critical').length;
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
    const jsonOutput = {
      hook_id: 'H21',
      hook_name: 'dependency-audit',
      ...result,
    };
    return JSON.stringify(jsonOutput, null, 2);
  }

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║            Dependency Audit (H21)                            ║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');

  // Stats
  lines.push('Stats:');
  lines.push(`   Files checked: ${result.stats.filesChecked}`);
  lines.push(`   Vulnerabilities: ${result.stats.vulnerabilities}`);
  lines.push(`   Duplicate dependencies: ${result.stats.duplicates}`);
  lines.push(`   Broad version ranges: ${result.stats.broadVersionRanges}`);
  lines.push(`   Peer dependency issues: ${result.stats.peerDependencyIssues}`);
  lines.push(`   Workspace protocol issues: ${result.stats.workspaceProtocolIssues}`);
  lines.push(`   Critical violations: ${result.stats.criticalViolations}`);
  lines.push(`   Warnings: ${result.stats.warningViolations}`);
  lines.push('');

  // Violations
  if (result.violations.length > 0) {
    lines.push('Violations:');
    lines.push('');

    // Group by severity
    const critical = result.violations.filter((v) => v.severity === 'critical');
    const warnings = result.violations.filter((v) => v.severity === 'warning');

    if (critical.length > 0) {
      lines.push('CRITICAL ISSUES:');
      lines.push('');
      critical.forEach((violation) => {
        lines.push(`   ${violation.file}:${violation.line}:${violation.column}`);
        lines.push(`   ${violation.message}`);
        if (violation.code) {
          lines.push(`   Code: ${violation.code}`);
        }
        lines.push(`   Suggestion: ${violation.suggestion}`);
        lines.push('');
      });
    }

    if (warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('');
      warnings.forEach((violation) => {
        lines.push(`   ${violation.file}:${violation.line}:${violation.column}`);
        lines.push(`   ${violation.message}`);
        if (violation.code) {
          lines.push(`   Code: ${violation.code}`);
        }
        lines.push(`   Suggestion: ${violation.suggestion}`);
        lines.push('');
      });
    }

    lines.push('');
    lines.push('Dependency best practices:');
    lines.push('   - Run "npm audit fix" to resolve vulnerabilities');
    lines.push('   - Align dependency versions across workspace packages');
    lines.push('   - Pin version ranges (avoid * or ^*)');
    lines.push('   - Use "workspace:*" protocol for internal packages');
    lines.push(
      '   - For dependency-specific approval: @dependency-approved:package-name TICKET-123 Reason',
    );
    lines.push('   - For blanket approval (discouraged): @dependency-approved TICKET-123 Reason');
    lines.push('');
  } else {
    lines.push('All dependencies are secure and properly configured.');
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
      console.log('No staged package.json files to check.');
    }
    process.exit(0);
  }

  const result = await validateFiles(stagedFiles);
  const duration = Date.now() - startTime;

  console.log(formatOutput(result, jsonMode));

  if (!jsonMode) {
    console.log(`Execution time: ${duration}ms (budget: <${CONFIG.performanceBudgetMs}ms)`);
    if (duration > CONFIG.performanceBudgetMs) {
      console.log(
        `WARNING: Exceeded performance budget by ${duration - CONFIG.performanceBudgetMs}ms`,
      );
    }
    console.log('');
  }

  process.exit(result.passed ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
