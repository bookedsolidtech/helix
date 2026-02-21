#!/usr/bin/env tsx
/**
 * Hook: api-breaking-change-detection (H18)
 *
 * Detects breaking changes to public component APIs using CEM.
 * Execution budget: <5 seconds
 *
 * Detects:
 * - Removed properties, methods, events, CSS parts, slots, CSS custom properties
 * - Changed property types
 * - Changed method signatures (parameter count/types)
 * - Changed event detail payload types
 * - Stale CEM (component files modified after CEM generation)
 *
 * Source of Truth:
 * - Custom Elements Manifest (packages/hx-library/custom-elements.json)
 * - Compares current vs previous commit's CEM
 *
 * Allows:
 * - New properties/methods/events (non-breaking)
 * - Internal changes (private/protected members)
 * - Approved exceptions: // @breaking-change-approved: TICKET-123 Reason
 *
 * Usage:
 *   tsx scripts/hooks/api-breaking-change-detection.ts
 *   tsx scripts/hooks/api-breaking-change-detection.ts --json
 *   tsx scripts/hooks/api-breaking-change-detection.ts --bail-fast
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh:
 *   npm run hooks:api-breaking-change-detection
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
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
  category?: 'removed-property' | 'removed-method' | 'removed-event' | 'removed-css-part' | 'removed-slot' | 'removed-css-property' | 'removed-component' | 'type-change' | 'signature-change' | 'event-detail-change';
}

interface ValidationResult {
  hook_id: string;
  hook_name: string;
  passed: boolean;
  violations: Violation[];
  stats: {
    componentsChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    executionTimeMs: number;
  };
}

interface CEMMember {
  kind: string;
  name: string;
  type?: { text?: string };
  privacy?: string;
  parameters?: Array<{ name: string; type?: { text?: string } }>;
  return?: { type?: { text?: string } };
}

interface CEMEvent {
  name: string;
  type?: { text?: string };
}

interface CEMDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  members?: CEMMember[];
  events?: CEMEvent[];
  cssParts?: Array<{ name: string; description?: string }>;
  slots?: Array<{ name: string; description?: string }>;
  cssProperties?: Array<{ name: string; description?: string; default?: string }>;
}

interface CEMModule {
  kind: string;
  path: string;
  declarations?: CEMDeclaration[];
}

interface CEM {
  schemaVersion: string;
  modules?: CEMModule[];
}

interface ComponentAPI {
  tagName: string;
  className: string;
  filePath: string;
  properties: Map<string, string>; // name -> type
  methods: Map<string, string>; // name -> signature
  events: Map<string, string>; // name -> detail type
  cssParts: Set<string>;
  slots: Set<string>;
  cssProperties: Set<string>;
}

interface ApprovalInfo {
  ticketId: string;
  reason: string;
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly cemPath: string;
  readonly componentPatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalCommentPattern: RegExp;
  readonly timeoutMs: number;
  readonly performanceBudgetMs: number;
  readonly bailFast: boolean;
}

const CONFIG: HookConfig = {
  // CEM location
  cemPath: 'packages/hx-library/custom-elements.json',

  // Component file patterns
  componentPatterns: [
    'packages/hx-library/src/components/**/*.ts',
  ],

  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/dist/**',
    '**/node_modules/**',
  ],

  // Approval mechanism: // @breaking-change-approved: TICKET-123 Reason
  approvalCommentPattern: /@breaking-change-approved:\s*([A-Z]+-\d+)\s+(.+)/,

  // Performance budgets
  timeoutMs: 5000, // 5 seconds total timeout
  performanceBudgetMs: 5000, // 5 seconds budget

  // Bail-fast mode (exit on first critical violation)
  bailFast: process.argv.includes('--bail-fast'),
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
  return new RegExp(`^${escaped}$`);
}

/**
 * Check if file matches glob patterns
 */
function matchesPatterns(file: string, patterns: readonly string[]): boolean {
  return patterns.some(pattern => globToRegex(pattern).test(file));
}

/**
 * Get staged files from git
 */
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
      .filter(f => f.length > 0);
  } catch (error) {
    return [];
  }
}

/**
 * Get file content from specific commit
 */
function getFileFromCommit(filePath: string, commit: string): string | null {
  try {
    return execSync(`git show ${commit}:${filePath}`, {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10MB for CEM file
    });
  } catch (error) {
    return null; // File didn't exist in previous commit
  }
}

/**
 * Parse approval comment from file content
 */
function parseApprovalComment(content: string): ApprovalInfo | null {
  const match = CONFIG.approvalCommentPattern.exec(content);
  if (!match) return null;

  return {
    ticketId: match[1],
    reason: match[2].trim(),
  };
}

/**
 * Check if file has approval comment
 */
function hasApprovalComment(filePath: string): ApprovalInfo | null {
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseApprovalComment(content);
  } catch (error) {
    return null;
  }
}

// ─── CEM Parsing ──────────────────────────────────────────────────────────

/**
 * Extract detail type from event type signature
 * Handles: CustomEvent<T>, CustomEvent<{...}>, Event
 */
function extractEventDetailType(eventType: string): string {
  if (!eventType || eventType === 'unknown') return 'unknown';

  // Match CustomEvent<DetailType> pattern
  const customEventMatch = eventType.match(/CustomEvent<(.+)>$/);
  if (customEventMatch) {
    return customEventMatch[1].trim();
  }

  // Plain Event has no detail
  if (eventType === 'Event') return 'void';

  // Unknown type format
  return eventType;
}

/**
 * Parse CEM and extract component API surfaces
 * Exported for testing
 */
export function parseCEM(cemContent: string): Map<string, ComponentAPI> {
  const components = new Map<string, ComponentAPI>();

  try {
    const cem: CEM = JSON.parse(cemContent);

    if (!cem.modules) return components;

    for (const module of cem.modules) {
      if (!module.declarations) continue;

      for (const declaration of module.declarations) {
        // Only process component classes
        if (declaration.kind !== 'class') continue;
        if (!declaration.tagName) continue; // Not a custom element

        const api: ComponentAPI = {
          tagName: declaration.tagName,
          className: declaration.name,
          filePath: module.path,
          properties: new Map(),
          methods: new Map(),
          events: new Map(),
          cssParts: new Set(),
          slots: new Set(),
          cssProperties: new Set(),
        };

        // Extract public properties and methods
        if (declaration.members) {
          for (const member of declaration.members) {
            // Skip private/protected members
            if (member.privacy === 'private' || member.privacy === 'protected') {
              continue;
            }

            if (member.kind === 'field') {
              // Property
              const type = member.type?.text || 'unknown';
              api.properties.set(member.name, type);
            } else if (member.kind === 'method') {
              // Method - build signature
              const params = member.parameters
                ? member.parameters.map(p => `${p.name}: ${p.type?.text || 'any'}`).join(', ')
                : '';
              const returnType = member.return?.type?.text || 'void';
              const signature = `(${params}) => ${returnType}`;
              api.methods.set(member.name, signature);
            }
          }
        }

        // Extract events with detail types
        if (declaration.events) {
          for (const event of declaration.events) {
            // Extract detail type from CustomEvent<T> or Event type
            const eventType = event.type?.text ?? 'unknown';
            const detailType = extractEventDetailType(eventType);
            api.events.set(event.name, detailType);
          }
        }

        // Extract CSS parts
        if (declaration.cssParts) {
          for (const part of declaration.cssParts) {
            api.cssParts.add(part.name);
          }
        }

        // Extract slots
        if (declaration.slots) {
          for (const slot of declaration.slots) {
            api.slots.add(slot.name || '(default)');
          }
        }

        // Extract CSS custom properties
        if (declaration.cssProperties) {
          for (const prop of declaration.cssProperties) {
            api.cssProperties.add(prop.name);
          }
        }

        components.set(declaration.tagName, api);
      }
    }

    return components;
  } catch (error) {
    throw new Error(`Failed to parse CEM: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ─── Breaking Change Detection ────────────────────────────────────────────

/**
 * Detect breaking changes between two component API surfaces
 * Exported for testing
 */
export function detectBreakingChanges(
  tagName: string,
  current: ComponentAPI,
  previous: ComponentAPI,
): Violation[] {
  const violations: Violation[] = [];
  const file = current.filePath;

  // Check for removed properties
  for (const [propName, prevType] of previous.properties) {
    if (!current.properties.has(propName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: Property \`${propName}\` was removed from <${tagName}>`,
        suggestion: `Use @deprecated JSDoc tag and maintain property for at least one major version. Add changeset for major version bump.`,
        severity: 'critical',
        category: 'removed-property',
      });
    } else {
      // Check for type changes
      const currentType = current.properties.get(propName);
      if (currentType && currentType !== prevType) {
        violations.push({
          file,
          line: 1,
          column: 1,
          message: `Breaking change: Property \`${propName}\` type changed from \`${prevType}\` to \`${currentType}\` in <${tagName}>`,
          suggestion: `Type changes are breaking. Use union types for backward compatibility or add changeset for major version bump.`,
          severity: 'critical',
          category: 'type-change',
        });
      }
    }
  }

  // Check for removed methods
  for (const [methodName, prevSignature] of previous.methods) {
    if (!current.methods.has(methodName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: Method \`${methodName}\` was removed from <${tagName}>`,
        suggestion: `Use @deprecated JSDoc tag and maintain method for at least one major version. Add changeset for major version bump.`,
        severity: 'critical',
        category: 'removed-method',
      });
    } else {
      // Check for signature changes
      const currentSignature = current.methods.get(methodName);
      if (currentSignature && currentSignature !== prevSignature) {
        violations.push({
          file,
          line: 1,
          column: 1,
          message: `Breaking change: Method \`${methodName}\` signature changed in <${tagName}>\n   Previous: ${prevSignature}\n   Current:  ${currentSignature}`,
          suggestion: `Method signature changes are breaking. Add overload or add changeset for major version bump.`,
          severity: 'critical',
          category: 'signature-change',
        });
      }
    }
  }

  // Check for removed events and event detail type changes
  for (const [eventName, prevDetail] of previous.events) {
    if (!current.events.has(eventName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: Event \`${eventName}\` was removed from <${tagName}>`,
        suggestion: `Maintain event for backward compatibility. Add changeset for major version bump.`,
        severity: 'critical',
        category: 'removed-event',
      });
    } else {
      // Check for event detail type changes
      const currentDetail = current.events.get(eventName);
      if (currentDetail && currentDetail !== prevDetail && prevDetail !== 'unknown' && currentDetail !== 'unknown') {
        violations.push({
          file,
          line: 1,
          column: 1,
          message: `Breaking change: Event \`${eventName}\` detail type changed in <${tagName}>\n   Previous: ${prevDetail}\n   Current:  ${currentDetail}`,
          suggestion: `Event detail type changes are breaking. Consumers may depend on specific payload shapes. Add changeset for major version bump.\n   Note: CEM cannot detect changes within object literal types - manual review required for complex detail payloads.`,
          severity: 'critical',
          category: 'event-detail-change',
        });
      }
    }
  }

  // Check for removed CSS parts (warning)
  for (const partName of previous.cssParts) {
    if (!current.cssParts.has(partName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: CSS part \`${partName}\` was removed from <${tagName}>`,
        suggestion: `CSS parts are public styling API. Maintain for backward compatibility or add changeset for major version bump.`,
        severity: 'warning',
        category: 'removed-css-part',
      });
    }
  }

  // Check for removed slots (warning)
  for (const slotName of previous.slots) {
    if (!current.slots.has(slotName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: Slot \`${slotName}\` was removed from <${tagName}>`,
        suggestion: `Slots are public API. Maintain for backward compatibility or add changeset for major version bump.`,
        severity: 'warning',
        category: 'removed-slot',
      });
    }
  }

  // Check for removed CSS custom properties (warning)
  for (const propName of previous.cssProperties) {
    if (!current.cssProperties.has(propName)) {
      violations.push({
        file,
        line: 1,
        column: 1,
        message: `Breaking change: CSS custom property \`${propName}\` was removed from <${tagName}>`,
        suggestion: `CSS custom properties are public theming API. Maintain for backward compatibility or add changeset for major version bump.`,
        severity: 'warning',
        category: 'removed-css-property',
      });
    }
  }

  return violations;
}

/**
 * Check if CEM is stale (component files modified after CEM generation)
 * Uses filesystem timestamps to compare CEM with component files
 */
function isCEMStale(cemPath: string, stagedFiles: string[]): boolean {
  if (!existsSync(cemPath)) return false; // Missing CEM is handled separately

  // Check if component files are staged
  const stagedComponentFiles = stagedFiles.filter(file =>
    matchesPatterns(file, CONFIG.componentPatterns) &&
    !matchesPatterns(file, CONFIG.excludePatterns)
  );

  if (stagedComponentFiles.length === 0) {
    // No component files staged, staleness doesn't matter
    return false;
  }

  // Check if CEM is also staged
  const cemStaged = stagedFiles.includes(CONFIG.cemPath);
  if (!cemStaged) {
    // CEM not staged but component files are - likely needs regeneration
    return true;
  }

  // Both CEM and components are staged - verify CEM is newer than components
  const cemStats = statSync(cemPath);
  const cemTime = cemStats.mtimeMs;

  // Find the newest component file timestamp
  let newestComponentTime = 0;
  for (const file of stagedComponentFiles) {
    const fullPath = resolve(file);
    if (!existsSync(fullPath)) continue;

    const fileStats = statSync(fullPath);
    newestComponentTime = Math.max(newestComponentTime, fileStats.mtimeMs);
  }

  // If CEM is older than the newest component file, it's stale
  // Use 100ms tolerance for filesystem timestamp precision
  if (newestComponentTime > 0 && cemTime < newestComponentTime - 100) {
    return true;
  }

  return false;
}

/**
 * Validate staged component files for breaking changes
 */
function validateFiles(stagedFiles: string[]): ValidationResult {
  const violations: Violation[] = [];
  const startTime = Date.now();
  const componentsChecked = new Set<string>();

  // Load current CEM
  const cemPath = resolve(CONFIG.cemPath);
  if (!existsSync(cemPath)) {
    return {
      hook_id: 'H18',
      hook_name: 'api-breaking-change-detection',
      passed: false,
      violations: [{
        file: CONFIG.cemPath,
        line: 1,
        column: 1,
        message: 'CEM file not found',
        suggestion: 'Run `npm run cem` to generate Custom Elements Manifest',
        severity: 'critical',
      }],
      stats: {
        componentsChecked: 0,
        totalViolations: 1,
        criticalViolations: 1,
        warningViolations: 0,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  // Check for stale CEM
  if (isCEMStale(cemPath, stagedFiles)) {
    return {
      hook_id: 'H18',
      hook_name: 'api-breaking-change-detection',
      passed: false,
      violations: [{
        file: CONFIG.cemPath,
        line: 1,
        column: 1,
        message: 'CEM is stale - component files modified after CEM generation',
        suggestion: 'Run `npm run cem` to regenerate Custom Elements Manifest',
        severity: 'critical',
      }],
      stats: {
        componentsChecked: 0,
        totalViolations: 1,
        criticalViolations: 1,
        warningViolations: 0,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  const currentCEM = readFileSync(cemPath, 'utf-8');
  const currentComponents = parseCEM(currentCEM);

  // Load previous CEM from HEAD
  const previousCEMContent = getFileFromCommit(CONFIG.cemPath, 'HEAD');
  if (!previousCEMContent) {
    // CEM is new - no breaking changes possible
    return {
      hook_id: 'H18',
      hook_name: 'api-breaking-change-detection',
      passed: true,
      violations: [],
      stats: {
        componentsChecked: 0,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  const previousComponents = parseCEM(previousCEMContent);

  // Check if CEM itself is staged (means we should check all components)
  const cemStaged = stagedFiles.includes(CONFIG.cemPath);

  // Check each component that exists in both versions
  for (const [tagName, previousAPI] of previousComponents) {
    const currentAPI = currentComponents.get(tagName);

    if (!currentAPI) {
      // Component was removed entirely - only report if CEM or component files are staged
      if (cemStaged || stagedFiles.some(f => f.includes('components'))) {
        // Check for approval comment in the previous component file
        const previousComponentFilePath = existsSync(previousAPI.filePath)
          ? previousAPI.filePath
          : resolve(previousAPI.filePath);
        const approval = hasApprovalComment(previousComponentFilePath);

        if (!approval) {
          violations.push({
            file: previousAPI.filePath,
            line: 1,
            column: 1,
            message: `Breaking change: Component <${tagName}> was completely removed`,
            suggestion: `Use @deprecated JSDoc tag and maintain component for at least one major version. Add changeset for major version bump.\n   Or add @breaking-change-approved: TICKET-123 Reason if intentional removal.`,
            severity: 'critical',
            category: 'removed-component',
          });
        }
        componentsChecked.add(tagName);
      }
      continue;
    }

    // Check if component file is in staged files or if CEM is staged
    const componentFileStaged = cemStaged || stagedFiles.some(file =>
      matchesPatterns(file, CONFIG.componentPatterns) &&
      !matchesPatterns(file, CONFIG.excludePatterns) &&
      file.includes(currentAPI.className.toLowerCase())
    );

    if (!componentFileStaged) {
      // Component not staged, skip
      continue;
    }

    // Check for approval comment in component file
    // Try: relative path, absolute path, and resolved path from project root
    const possiblePaths = [
      currentAPI.filePath,
      resolve(currentAPI.filePath),
      resolve(process.cwd(), currentAPI.filePath),
    ];

    let approval: ApprovalInfo | null = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        approval = hasApprovalComment(path);
        if (approval) break;
      }
    }

    if (approval) {
      // Approved breaking change, skip
      continue;
    }

    // Detect breaking changes
    const componentViolations = detectBreakingChanges(tagName, currentAPI, previousAPI);
    violations.push(...componentViolations);
    componentsChecked.add(tagName);

    // Bail fast if enabled and critical violation found
    if (CONFIG.bailFast && componentViolations.some(v => v.severity === 'critical')) {
      break;
    }
  }

  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const warningViolations = violations.filter(v => v.severity === 'warning').length;

  return {
    hook_id: 'H18',
    hook_name: 'api-breaking-change-detection',
    passed: criticalViolations === 0,
    violations,
    stats: {
      componentsChecked: componentsChecked.size,
      totalViolations: violations.length,
      criticalViolations,
      warningViolations,
      executionTimeMs: Date.now() - startTime,
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
  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║        🔄 API Breaking Change Detection (H18)                ║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');

  lines.push('📊 Stats:');
  lines.push(`   Components checked: ${result.stats.componentsChecked}`);
  lines.push(`   Critical violations: ${result.stats.criticalViolations}`);
  lines.push(`   Warnings: ${result.stats.warningViolations}`);
  lines.push('');

  if (result.violations.length > 0) {
    lines.push('❌ Violations:');
    lines.push('');

    result.violations.forEach((violation) => {
      const icon = violation.severity === 'critical' ? '🔴' : '⚠️';
      lines.push(`${icon} ${violation.file}`);
      lines.push(`   ${violation.message}`);
      lines.push(`   💡 ${violation.suggestion}`);
      lines.push('');
    });

    lines.push('');
    lines.push('💡 Breaking change guidelines:');
    lines.push('   - Use @deprecated JSDoc tag before removing APIs');
    lines.push('   - Create changeset for major version bump (npx changeset)');
    lines.push('   - Document breaking changes in changeset summary');
    lines.push('   - Add @breaking-change-approved: TICKET-123 Reason if intentional');
    lines.push('');
    lines.push('🔗 Cross-hook coordination:');
    lines.push('   - After approval, run semantic-versioning hook (H14) to ensure changeset exists');
    lines.push('   - Update CEM with `npm run cem` to reflect API changes');
    lines.push('   - Run full pre-commit check with `npm run pre-commit-check`');
    lines.push('');
  } else {
    lines.push('✅ No breaking changes detected!');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  const startTime = Date.now();
  const jsonMode = process.argv.includes('--json');

  try {
    const stagedFiles = getStagedFiles();

    if (stagedFiles.length === 0) {
      if (!jsonMode) {
        console.log('✅ No staged files to check.');
      }
      process.exit(0);
    }

    const result = validateFiles(stagedFiles);

    console.log(formatOutput(result, jsonMode));

    if (!jsonMode) {
      const duration = Date.now() - startTime;
      const budgetStatus = duration <= CONFIG.performanceBudgetMs ? '✅' : '⚠️';
      console.log(`⏱️  Execution time: ${duration}ms ${budgetStatus} (budget: <${CONFIG.performanceBudgetMs}ms)`);
      console.log('');
    }

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
