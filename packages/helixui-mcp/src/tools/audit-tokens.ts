import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { TokenParser, type TokenEntry } from '../core/token-parser.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditFinding {
  token: string;
  file: string;
  line: number;
  value: string;
  category: 'unknown' | 'deprecated' | 'tier-violation';
  message: string;
  suggestion?: string;
}

export interface AuditReport {
  path: string;
  filesScanned: number;
  totalDeclarations: number;
  validTokens: number;
  findings: {
    unknown: AuditFinding[];
    deprecated: AuditFinding[];
    tierViolations: AuditFinding[];
  };
  summary: string;
}

// ─── CSS extraction ───────────────────────────────────────────────────────────

interface CssDeclaration {
  token: string;
  value: string;
  file: string;
  line: number;
  /** True if this declaration is inside a :root or html selector (global override) */
  isGlobal: boolean;
}

const HX_VAR_RE = /--hx-[\w-]+/g;
const DECLARATION_RE = /(--hx-[\w-]+)\s*:\s*([^;}\n]+?)(?:\s*;|\s*})/g;

function extractDeclarations(source: string, filePath: string): CssDeclaration[] {
  const results: CssDeclaration[] = [];
  const lines = source.split('\n');

  // Build a line → isGlobal map by tracking selector context.
  // We look for :root, html, or [data-theme] as global scope indicators.
  const globalSelectorRe = /(?:^|\s)(?::root|html)(?:\s*[{,])/;

  // Simple single-pass approach: track brace depth and whether we entered a global block
  let depth = 0;
  let inGlobalBlock = false;
  const lineIsGlobal: boolean[] = new Array(lines.length).fill(false);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const openCount = (line.match(/\{/g) ?? []).length;
    const closeCount = (line.match(/\}/g) ?? []).length;

    // Check if this line opens a global selector block
    if (openCount > 0 && depth === 0 && globalSelectorRe.test(line)) {
      inGlobalBlock = true;
    }

    lineIsGlobal[i] = inGlobalBlock;

    depth += openCount - closeCount;

    // Exiting a top-level block resets global context
    if (depth <= 0) {
      depth = 0;
      inGlobalBlock = false;
    }
  }

  // Now extract all --hx-* declarations with line numbers
  let match: RegExpExecArray | null;
  DECLARATION_RE.lastIndex = 0;

  while ((match = DECLARATION_RE.exec(source)) !== null) {
    const token = match[1];
    const value = match[2]?.trim() ?? '';
    if (token === undefined) continue;

    // Determine line number (1-indexed) from match offset
    const beforeMatch = source.slice(0, match.index);
    const lineNum = beforeMatch.split('\n').length;
    const isGlobal = lineIsGlobal[lineNum - 1] ?? false;

    results.push({ token, value, file: filePath, line: lineNum, isGlobal });
  }

  return results;
}

// ─── File collection ──────────────────────────────────────────────────────────

const CSS_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less']);

function collectCssFiles(targetPath: string): string[] {
  if (!existsSync(targetPath)) {
    throw new Error(`Path not found: ${targetPath}`);
  }

  const stat = statSync(targetPath);

  if (stat.isFile()) {
    const ext = extname(targetPath).toLowerCase();
    if (!CSS_EXTENSIONS.has(ext)) {
      throw new Error(
        `File "${targetPath}" is not a CSS/SCSS/SASS/LESS file. ` +
          `Pass a directory to scan all stylesheets, or pass a valid CSS file.`,
      );
    }
    return [targetPath];
  }

  // Directory: recursively collect CSS files, skip node_modules and build dirs
  const files: string[] = [];
  collectCssFilesRecursive(targetPath, files);
  return files;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.turbo']);

function collectCssFilesRecursive(dir: string, results: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      collectCssFilesRecursive(fullPath, results);
    } else if (stat.isFile()) {
      const ext = extname(entry).toLowerCase();
      if (CSS_EXTENSIONS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
}

// ─── Token schema helpers ─────────────────────────────────────────────────────

function buildTokenIndex(tokens: TokenEntry[]): Map<string, TokenEntry> {
  const index = new Map<string, TokenEntry>();
  for (const t of tokens) {
    index.set(t.cssVar, t);
  }
  return index;
}

/**
 * Returns true if the token is a component-tier token.
 * Component tokens encode component names as the second path segment
 * (e.g. --hx-button-bg → path = ['button', 'bg'] → tier = 'component').
 *
 * The token-parser already detects tier; we also look for the `component`
 * tier label assigned by detectTier().
 */
function isComponentTierToken(entry: TokenEntry): boolean {
  return entry.tier === 'component';
}

// ─── Audit engine ─────────────────────────────────────────────────────────────

export interface AuditTokensOptions {
  path: string;
}

export function auditTokens(options: AuditTokensOptions): AuditReport {
  const { path: targetPath } = options;

  // Load token schema
  const parser = new TokenParser();
  const schemaTokens = parser.loadSafe();
  const tokenIndex = buildTokenIndex(schemaTokens);

  // Collect CSS files
  const cssFiles = collectCssFiles(targetPath);

  // Extract all declarations
  const allDeclarations: CssDeclaration[] = [];
  for (const file of cssFiles) {
    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    allDeclarations.push(...extractDeclarations(source, file));
  }

  // Categorize findings
  const unknownFindings: AuditFinding[] = [];
  const deprecatedFindings: AuditFinding[] = [];
  const tierViolationFindings: AuditFinding[] = [];
  let validCount = 0;

  for (const decl of allDeclarations) {
    const schemaEntry = tokenIndex.get(decl.token);

    if (schemaEntry === undefined) {
      // Token is not in the schema — unknown
      // Only flag tokens that look like intentional hx- tokens (not typos of non-hx vars)
      unknownFindings.push({
        token: decl.token,
        file: decl.file,
        line: decl.line,
        value: decl.value,
        category: 'unknown',
        message: `Token "${decl.token}" is not in the @helixui/tokens schema.`,
        suggestion:
          `Verify the token name is correct. Run the MCP tool "findToken" with a partial ` +
          `name to discover valid tokens (e.g. findToken with "${decl.token.replace(/^--hx-/, '').split('-')[0] ?? ''}").`,
      });
      continue;
    }

    // Check deprecated (tokens with description containing "deprecated")
    if (
      schemaEntry.description !== undefined &&
      schemaEntry.description.toLowerCase().includes('deprecated')
    ) {
      deprecatedFindings.push({
        token: decl.token,
        file: decl.file,
        line: decl.line,
        value: decl.value,
        category: 'deprecated',
        message: `Token "${decl.token}" is deprecated: ${schemaEntry.description}`,
        suggestion: `Replace "${decl.token}" with the updated token referenced in its description.`,
      });
      continue;
    }

    // Check tier violations:
    // A tier violation occurs when a consumer overrides a component-tier token
    // in a global scope (:root / html) rather than targeting it through the
    // semantic tier or a component-specific selector.
    if (isComponentTierToken(schemaEntry) && decl.isGlobal) {
      tierViolationFindings.push({
        token: decl.token,
        file: decl.file,
        line: decl.line,
        value: decl.value,
        category: 'tier-violation',
        message:
          `Token "${decl.token}" is a component-tier token but is overridden globally (:root or html). ` +
          `Component-tier tokens should be overridden on a theme selector or component selector, ` +
          `not at the root level.`,
        suggestion:
          `Move this override inside a scoping selector (e.g. ".my-theme { ${decl.token}: ${decl.value}; }") ` +
          `or override the semantic-tier token it references instead. ` +
          `Semantic tokens follow the pattern --hx-color-*, --hx-space-*, etc.`,
      });
      continue;
    }

    validCount++;
  }

  const totalFindings =
    unknownFindings.length + deprecatedFindings.length + tierViolationFindings.length;

  const summary =
    totalFindings === 0
      ? `All ${allDeclarations.length} --hx-* token declaration${allDeclarations.length === 1 ? '' : 's'} across ${cssFiles.length} file${cssFiles.length === 1 ? '' : 's'} are valid.`
      : `Found ${totalFindings} issue${totalFindings === 1 ? '' : 's'} across ${cssFiles.length} file${cssFiles.length === 1 ? '' : 's'}: ` +
        [
          unknownFindings.length > 0
            ? `${unknownFindings.length} unknown token${unknownFindings.length === 1 ? '' : 's'}`
            : '',
          deprecatedFindings.length > 0
            ? `${deprecatedFindings.length} deprecated token${deprecatedFindings.length === 1 ? '' : 's'}`
            : '',
          tierViolationFindings.length > 0
            ? `${tierViolationFindings.length} tier violation${tierViolationFindings.length === 1 ? '' : 's'}`
            : '',
        ]
          .filter(Boolean)
          .join(', ') +
        '.';

  return {
    path: targetPath,
    filesScanned: cssFiles.length,
    totalDeclarations: allDeclarations.length,
    validTokens: validCount,
    findings: {
      unknown: unknownFindings,
      deprecated: deprecatedFindings,
      tierViolations: tierViolationFindings,
    },
    summary,
  };
}

// ─── Report formatting ────────────────────────────────────────────────────────

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Token Audit Report`,
    `  Path:             ${report.path}`,
    `  Files scanned:    ${report.filesScanned}`,
    `  Total --hx-* declarations: ${report.totalDeclarations}`,
    `  Valid tokens:     ${report.validTokens}`,
    '',
    `Summary: ${report.summary}`,
  ];

  const { unknown, deprecated, tierViolations } = report.findings;

  if (unknown.length > 0) {
    lines.push('');
    lines.push(`Unknown Tokens (${unknown.length}):`);
    for (const f of unknown) {
      lines.push(`  [UNKNOWN] ${f.token}`);
      lines.push(`    File:       ${f.file}:${f.line}`);
      lines.push(`    Value:      ${f.value}`);
      lines.push(`    Message:    ${f.message}`);
      if (f.suggestion !== undefined) {
        lines.push(`    Suggestion: ${f.suggestion}`);
      }
    }
  }

  if (deprecated.length > 0) {
    lines.push('');
    lines.push(`Deprecated Tokens (${deprecated.length}):`);
    for (const f of deprecated) {
      lines.push(`  [DEPRECATED] ${f.token}`);
      lines.push(`    File:       ${f.file}:${f.line}`);
      lines.push(`    Value:      ${f.value}`);
      lines.push(`    Message:    ${f.message}`);
      if (f.suggestion !== undefined) {
        lines.push(`    Suggestion: ${f.suggestion}`);
      }
    }
  }

  if (tierViolations.length > 0) {
    lines.push('');
    lines.push(`Tier Violations (${tierViolations.length}):`);
    for (const f of tierViolations) {
      lines.push(`  [TIER-VIOLATION] ${f.token}`);
      lines.push(`    File:       ${f.file}:${f.line}`);
      lines.push(`    Value:      ${f.value}`);
      lines.push(`    Message:    ${f.message}`);
      if (f.suggestion !== undefined) {
        lines.push(`    Suggestion: ${f.suggestion}`);
      }
    }
  }

  return lines.join('\n');
}
