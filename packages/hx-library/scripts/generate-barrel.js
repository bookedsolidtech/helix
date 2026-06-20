#!/usr/bin/env node
/* global console, process */

// Auto-generates src/index.ts from component directories.
// Scans src/components/<name>/index.ts and re-exports component-level symbols.
// Eliminates merge conflicts on the barrel file when multiple component PRs
// target main simultaneously.
//
// Public-API surface policy (HELiX 3.0.0 API freeze):
// -----------------------------------------------------------------------------
// Top-level re-exports from base/, mixins/, controllers/, and utilities/ are
// governed by an explicit ALLOWLIST (see PUBLIC_API below). Internals are the
// default — exposure through the public barrel must be opted into by adding
// the symbol to the allowlist. Any symbol present in source but absent from
// the allowlist is dropped from the generated barrel and flagged on stderr so
// regressions are visible.
//
// Component-level exports (./components/*/index.ts) are auto-scanned and
// forwarded as-is; component authors are expected to keep their own
// index.ts minimal and public by construction.
//
// Usage: node scripts/generate-barrel.js

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const componentsDir = join(rootDir, 'src', 'components');
const outputFile = join(rootDir, 'src', 'index.ts');

// ─── Public-API allowlist ────────────────────────────────────────────────────
// Every top-level symbol re-exported from the barrel must be listed here.
// Adding a new public symbol: append to the relevant module group.
// Removing a public symbol: delete it here; the generator will omit it.
// Keep internal helpers (id-counter reset, aria delegation mixin,
// style-registry utilities, etc.) OUT of this list. Consumers that
// need them must use a deep import path — that contract is intentional.
/** @type {Record<string, { values: string[]; types: string[] }>} */
const PUBLIC_API = {
  './utilities/document-token-adoption.js': {
    values: ['ensureDocumentTokens'],
    types: [],
  },
  './base/index.js': {
    // resetIdCounter is intentionally excluded — it is a test-only helper
    // re-exported from ./test-utils.ts. Exposing it publicly would let
    // consumers reset the ID counter mid-run and break ARIA relationships.
    // mergeTokenStyles was removed in 3.0.0 — tokens adopt at the document
    // level via ensureDocumentTokens() (auto-invoked on first import).
    values: ['HelixElement', 'createIdCounter'],
    types: [],
  },
  './mixins/index.js': {
    // FocusMixin, FormMixin, and mixinDelegatesAria are public so downstream
    // consumers can extend HELiX elements (wrapper components, custom controls)
    // with the same focus/form/ARIA-delegation behavior the library uses.
    values: ['FocusMixin', 'FormMixin', 'mixinDelegatesAria'],
    types: [
      'FocusMixinInterface',
      'FormMixinInterface',
      'AriaDelegationMixinInterface',
      'AriaAttribute',
    ],
  },
  './controllers/helix-audit-controller.js': {
    // HelixAuditController is the public HIPAA audit-trail controller.
    // It captures hx-* CustomEvents and re-dispatches as hx-audit events
    // that bubble to the document for enterprise audit-log wiring.
    values: ['HelixAuditController'],
    types: ['AuditEventDetail', 'AuditControllerOptions'],
  },
};

// ─── Component barrel scan ───────────────────────────────────────────────────
const components = readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
  .map((d) => d.name)
  .sort();

const exportLines = [];

for (const component of components) {
  const indexPath = join(componentsDir, component, 'index.ts');
  if (!existsSync(indexPath)) continue;

  const content = readFileSync(indexPath, 'utf-8');

  // Match `export { Foo }` or `export type { Foo }` patterns.
  const exportMatch = content.match(/export\s+(?:type\s+)?\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g);
  if (!exportMatch) continue;

  for (const line of exportMatch) {
    const isTypeExport = /^export\s+type\s+\{/.test(line);
    const names = line.match(/\{([^}]+)\}/)?.[1];
    if (!names) continue;

    const cleanNames = names
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .join(', ');

    const keyword = isTypeExport ? 'export type' : 'export';
    exportLines.push(`${keyword} { ${cleanNames} } from './components/${component}/index.js';`);
  }
}

// ─── Allowlist materialization with leak detection ───────────────────────────
// For each module in PUBLIC_API, read the source index and verify every
// allowlisted symbol actually exists. Additionally, warn about symbols that
// are exported from the source module but not allowlisted — these are
// potential internal leaks that future work may need to audit.
/**
 * Extract the set of value and type identifiers exported from an index.ts-like
 * source file. Handles:
 *   - `export { A, B as C } from '...'` (value re-export)
 *   - `export type { T } from '...'` (type re-export)
 *   - `export { A, B } ;` (local value re-export)
 *   - `export type { T } ;` (local type re-export)
 *   - `export function foo()` / `export class Foo` / `export const foo =` (value)
 *   - `export type Foo = ...` / `export interface Foo` (type)
 */
function scanModuleExports(sourcePath) {
  if (!existsSync(sourcePath)) return { values: new Set(), types: new Set() };
  const content = readFileSync(sourcePath, 'utf-8');
  const values = new Set();
  const types = new Set();

  const stripAlias = (name) =>
    name
      .split(/\s+as\s+/)
      .pop()
      ?.trim() ?? name;

  // Re-exports with or without a `from '...'` clause.
  const reexportPattern = /export\s+(type\s+)?\{([^}]+)\}\s*(?:from\s*['"][^'"]+['"])?\s*;?/g;
  let match;
  while ((match = reexportPattern.exec(content)) !== null) {
    const isType = Boolean(match[1]);
    const names = match[2]
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .map(stripAlias);
    for (const name of names) {
      (isType ? types : values).add(name);
    }
  }

  // Direct value declarations: export function / class / const / let / var.
  const valueDeclPattern =
    /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  while ((match = valueDeclPattern.exec(content)) !== null) {
    values.add(match[1]);
  }

  // Direct type declarations: export type / interface / enum.
  const typeDeclPattern = /^\s*export\s+(?:type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm;
  while ((match = typeDeclPattern.exec(content)) !== null) {
    types.add(match[1]);
  }

  return { values, types };
}

/**
 * Resolve an import specifier like './base/index.js' to an absolute source
 * path, accounting for the .js → .ts mapping used by TypeScript projects.
 */
function resolveModulePath(spec) {
  // Start from src/index.ts location (i.e., src/)
  const srcDir = join(rootDir, 'src');
  const asTs = join(srcDir, spec.replace(/\.js$/, '.ts'));
  return existsSync(asTs) ? asTs : join(srcDir, spec);
}

const warnings = [];
const renderedGroups = [];

for (const [spec, allow] of Object.entries(PUBLIC_API)) {
  const sourcePath = resolveModulePath(spec);
  const { values: availableValues, types: availableTypes } = scanModuleExports(sourcePath);

  // Detect allowlist entries that no longer exist in source (typos, deletions).
  for (const name of allow.values) {
    if (!availableValues.has(name)) {
      warnings.push(
        `[allowlist] ${spec}: value "${name}" is in PUBLIC_API but not exported by source.`,
      );
    }
  }
  for (const name of allow.types) {
    if (!availableTypes.has(name)) {
      warnings.push(
        `[allowlist] ${spec}: type "${name}" is in PUBLIC_API but not exported by source.`,
      );
    }
  }

  // Detect symbols exported from source but not allowlisted — potential leaks
  // that the generator is intentionally suppressing.
  const droppedValues = [...availableValues].filter((n) => !allow.values.includes(n));
  const droppedTypes = [...availableTypes].filter((n) => !allow.types.includes(n));
  for (const name of droppedValues) {
    warnings.push(
      `[gated] ${spec}: value "${name}" is exported from source but NOT in PUBLIC_API (dropped from barrel).`,
    );
  }
  for (const name of droppedTypes) {
    warnings.push(
      `[gated] ${spec}: type "${name}" is exported from source but NOT in PUBLIC_API (dropped from barrel).`,
    );
  }

  const lines = [];
  if (allow.values.length > 0) {
    lines.push(`export { ${allow.values.join(', ')} } from '${spec}';`);
  }
  if (allow.types.length > 0) {
    lines.push(`export type { ${allow.types.join(', ')} } from '${spec}';`);
  }
  if (lines.length > 0) {
    renderedGroups.push({ spec, lines });
  }
}

// Compose the prelude sections in a stable, readable order.
const utilitySpec = './utilities/document-token-adoption.js';
const baseSpec = './base/index.js';
const mixinsSpec = './mixins/index.js';
const controllersSpec = './controllers/helix-audit-controller.js';

const utilityGroup = renderedGroups.find((g) => g.spec === utilitySpec);
const baseGroup = renderedGroups.find((g) => g.spec === baseSpec);
const mixinsGroup = renderedGroups.find((g) => g.spec === mixinsSpec);
const controllersGroup = renderedGroups.find((g) => g.spec === controllersSpec);

const utilityBlock = utilityGroup ? utilityGroup.lines.join('\n') : '';
const baseBlock = baseGroup ? baseGroup.lines.join('\n') : '';
const mixinsBlock = mixinsGroup ? mixinsGroup.lines.join('\n') : '';
const controllersBlock = controllersGroup ? controllersGroup.lines.join('\n') : '';

// ─── Render ──────────────────────────────────────────────────────────────────
const output = `/**
 * @helixui/library - Enterprise Healthcare Web Component Library
 *
 * Built with Lit 3.x. All components are custom elements that can be used
 * in any framework or vanilla HTML.
 *
 * AUTO-GENERATED — Do not edit manually.
 * Run \`npm run generate:barrel\` to regenerate.
 *
 * Public-API surface is gated by an allowlist in scripts/generate-barrel.js.
 * Internals (resetIdCounter, mixinDelegatesAria, etc.)
 * are intentionally excluded and must be imported via deep paths if needed.
 */

// ─── Document-level token adoption ──────────────────────────────────────────
// Ensures --hx-* design tokens are adopted into document.adoptedStyleSheets
// once, enabling CSS inheritance through Shadow DOM boundaries.
import './utilities/document-token-adoption.js';

// ─── Exported API for document-level token adoption ─────────────────────────
${utilityBlock}

// ─── Base infrastructure ────────────────────────────────────────────────────
${baseBlock}

// ─── Mixins ───────────────────────────────────────────────────────────────────
${mixinsBlock}

// ─── HIPAA audit-trail controller ───────────────────────────────────────────
${controllersBlock}

// ─── Components ──────────────────────────────────────────────────────────────
${exportLines.join('\n')}
`;

writeFileSync(outputFile, output);

const componentCount = exportLines.length;
console.log(`Generated src/index.ts with ${componentCount} component export lines.`);

if (warnings.length > 0) {
  console.log(
    `\nPublic-API allowlist report (${warnings.length} notice${warnings.length === 1 ? '' : 's'}):`,
  );
  for (const warning of warnings) {
    console.log(`  ${warning}`);
  }
  // Notices are informational only — `[gated]` entries are the expected
  // internal-suppression behavior. `[allowlist]` entries are real problems
  // (allowlist points at a symbol that no longer exists) and fail the build.
  const allowlistErrors = warnings.filter((w) => w.startsWith('[allowlist]'));
  if (allowlistErrors.length > 0) {
    console.error(`\n${allowlistErrors.length} allowlist entries reference missing symbols.`);
    process.exit(1);
  }
}
