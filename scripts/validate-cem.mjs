#!/usr/bin/env node

/**
 * CEM Validation Gate — HELiX
 *
 * Validates that the Custom Elements Manifest (custom-elements.json) accurately
 * reflects the public API defined in TypeScript source files. Prevents CEM drift
 * by comparing source-extracted @property, @fires, CSS parts, and slots against
 * what is documented in the manifest.
 *
 * Checks performed per component:
 *   1. @property decorators → CEM members (fields)
 *   2. @fires JSDoc tags     → CEM events
 *   3. part="..." in templates → CEM cssParts
 *   4. <slot> elements       → CEM slots (named and default)
 *   5. Class declaration     → CEM declarations
 *
 * Usage:
 *   node scripts/validate-cem.mjs              # Run from repo root
 *
 * Exits with code 1 if any mismatches are found, 0 if all valid.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CEM_PATH = resolve(ROOT, 'packages/hx-library/custom-elements.json');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readCem() {
  try {
    return JSON.parse(readFileSync(CEM_PATH, 'utf8'));
  } catch (err) {
    console.error(`Error: could not read ${CEM_PATH}`);
    console.error(`  Run "pnpm run cem" in packages/hx-library first to generate the manifest.`);
    console.error(`  Details: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Recursively collect component source files.
 * Includes hx-*.ts files, excludes .test.ts, .stories.ts, .styles.ts, index.ts.
 */
function collectSourceFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (
      entry.startsWith('hx-') &&
      entry.endsWith('.ts') &&
      !entry.endsWith('.test.ts') &&
      !entry.endsWith('.stories.ts') &&
      !entry.endsWith('.styles.ts') &&
      entry !== 'index.ts'
    ) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Build a lookup map from the CEM: tagName → declaration object.
 * Searches all modules in the manifest.
 */
function buildCemIndex(cem) {
  const index = new Map();
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl.tagName) {
        index.set(decl.tagName, decl);
      }
      // Also index by class name for class-only lookup
      if (decl.name) {
        index.set(decl.name, decl);
      }
    }
  }
  return index;
}

// ── Source extraction ─────────────────────────────────────────────────────────

/**
 * Extract property names from @property decorators in TypeScript source.
 * Handles multi-line decorator patterns.
 */
function extractProperties(source) {
  const props = new Set();

  // Pattern 1: @property(...) on its own line, property declaration on next line(s)
  // Matches: @property({ ... })\n  [modifiers] [get|set] propertyName
  // Handles accessor properties: @property(...)\n  get propName() { ... }
  const pattern1 =
    /@property\s*\([^)]*\)\s*\n\s*(?:(?:readonly|public|protected|private|override)\s+)*(?:(get|set)\s+)?(\w+)/g;
  let match;
  while ((match = pattern1.exec(source)) !== null) {
    // match[1] is optional 'get'|'set' accessor keyword, match[2] is the property name
    const name = match[2];
    // Skip internal/lifecycle property names and TS keywords
    if (!name.startsWith('_') && name !== 'override' && name !== 'static') {
      props.add(name);
    }
  }

  // Pattern 2: @property on same line as declaration (rare but possible)
  // e.g., @property({ type: String }) variant: string = 'primary';
  const pattern2 =
    /@property\s*\([^)]*\)\s+(?:(?:readonly|public|protected|private)\s+)*(\w+)[?!]?\s*[=:]/g;
  while ((match = pattern2.exec(source)) !== null) {
    const name = match[1];
    if (!name.startsWith('_') && name !== 'override' && name !== 'static') {
      props.add(name);
    }
  }

  return props;
}

/**
 * Extract event names from @fires JSDoc tags.
 * Handles both:
 *   @fires hx-click
 *   @fires {CustomEvent} hx-click - Description
 */
function extractFires(source) {
  const events = new Set();
  // Match @fires optionally followed by {Type} then the event name
  const pattern = /@fires\s+(?:\{[^}]*\}\s+)?([\w-]+)/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    events.add(match[1]);
  }
  return events;
}

/**
 * Extract CSS part names from part="..." attributes in template literals.
 */
function extractCssParts(source) {
  const parts = new Set();
  const pattern = /part="([\w-]+(?:\s+[\w-]+)*)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    // A single element can expose multiple parts (space-separated)
    for (const part of match[1].split(/\s+/)) {
      if (part) parts.add(part);
    }
  }
  return parts;
}

/**
 * Extract slot names from <slot> elements in template literals.
 * Returns { named: Set<string>, hasDefault: boolean }
 */
function extractSlots(source) {
  const named = new Set();
  let hasDefault = false;

  // Named slots: <slot name="foo">
  const namedPattern = /<slot\b[^>]*\bname="([\w-]+)"/g;
  let match;
  while ((match = namedPattern.exec(source)) !== null) {
    named.add(match[1]);
  }

  // Default (unnamed) slots: <slot> or <slot ...> without name="..."
  // Look for <slot that does NOT have name= anywhere before the closing > or />
  const defaultPattern = /<slot\b(?![^>]*\bname=)[^>]*>/g;
  if (defaultPattern.test(source)) {
    hasDefault = true;
  }

  return { named, hasDefault };
}

/**
 * Extract the exported class name from a component source file.
 * Matches both Helix* and Hx* class name conventions.
 */
function extractClassName(source) {
  const match = /export\s+class\s+((?:Helix|Hx)\w+)\s+extends/.exec(source);
  return match ? match[1] : null;
}

/**
 * Extract the @tag annotation if present (used as fallback for tagName lookup).
 */
function extractTagName(source) {
  // Try @customElement('hx-...') decorator
  const decoratorMatch = /@customElement\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(source);
  if (decoratorMatch) return decoratorMatch[1];

  // Try @tag JSDoc annotation
  const tagMatch = /@tag\s+(hx-[\w-]+)/.exec(source);
  if (tagMatch) return tagMatch[1];

  return null;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateFile(filePath, cemIndex) {
  const relPath = filePath.replace(ROOT + '/', '');
  const source = readFileSync(filePath, 'utf8');

  const errors = [];

  const className = extractClassName(source);
  if (!className) {
    // Not a component class file (could be a mixin, utility, etc.) — skip silently
    return errors;
  }

  const tagName = extractTagName(source);

  // Locate the CEM declaration — prefer tag name lookup, fall back to class name
  const decl = (tagName && cemIndex.get(tagName)) || cemIndex.get(className);

  if (!decl) {
    errors.push({
      file: relPath,
      message: `Class "${className}" (tag: ${tagName ?? 'unknown'}) not found in CEM declarations`,
    });
    // Cannot validate members/events/parts/slots without the declaration
    return errors;
  }

  // ── 1. @property decorators → CEM members ──────────────────────────────

  const sourceProps = extractProperties(source);
  const cemMembers = new Set(
    (decl.members ?? []).filter((m) => m.kind === 'field').map((m) => m.name),
  );

  for (const prop of sourceProps) {
    if (!cemMembers.has(prop)) {
      errors.push({
        file: relPath,
        message: `@property "${prop}" is missing from CEM members (tag: ${decl.tagName ?? className})`,
      });
    }
  }

  // ── 2. @fires events → CEM events ──────────────────────────────────────

  const sourceEvents = extractFires(source);
  const cemEvents = new Set((decl.events ?? []).map((e) => e.name));

  for (const event of sourceEvents) {
    if (!cemEvents.has(event)) {
      errors.push({
        file: relPath,
        message: `@fires "${event}" is missing from CEM events (tag: ${decl.tagName ?? className})`,
      });
    }
  }

  // ── 3. CSS parts → CEM cssParts ────────────────────────────────────────

  const sourceParts = extractCssParts(source);
  const cemParts = new Set((decl.cssParts ?? []).map((p) => p.name));

  for (const part of sourceParts) {
    if (!cemParts.has(part)) {
      errors.push({
        file: relPath,
        message: `CSS part "${part}" is missing from CEM cssParts (tag: ${decl.tagName ?? className})`,
      });
    }
  }

  // ── 4. <slot> elements → CEM slots ─────────────────────────────────────

  const { named: sourceNamedSlots, hasDefault: sourceHasDefault } = extractSlots(source);
  const cemSlots = decl.slots ?? [];
  const cemSlotNames = new Set(cemSlots.map((s) => s.name ?? ''));

  for (const slot of sourceNamedSlots) {
    if (!cemSlotNames.has(slot)) {
      errors.push({
        file: relPath,
        message: `Named slot "${slot}" is missing from CEM slots (tag: ${decl.tagName ?? className})`,
      });
    }
  }

  if (sourceHasDefault && !cemSlotNames.has('') && !cemSlotNames.has(undefined)) {
    errors.push({
      file: relPath,
      message: `Default (unnamed) slot is missing from CEM slots (tag: ${decl.tagName ?? className})`,
    });
  }

  return errors;
}

// ── Entry point ───────────────────────────────────────────────────────────────

function main() {
  console.log('Validating Custom Elements Manifest...\n');

  const cem = readCem();
  const cemIndex = buildCemIndex(cem);
  const sourceFiles = collectSourceFiles(COMPONENTS_DIR);

  if (sourceFiles.length === 0) {
    console.error(`Error: no component source files found in ${COMPONENTS_DIR}`);
    process.exit(1);
  }

  console.log(`  Scanning ${sourceFiles.length} source file(s) against CEM...`);

  let totalErrors = 0;
  let checkedComponents = 0;

  for (const file of sourceFiles) {
    const errors = validateFile(file, cemIndex);
    if (errors.length > 0) {
      for (const err of errors) {
        console.error(`\n  [FAIL] ${err.file}`);
        console.error(`         ${err.message}`);
      }
      totalErrors += errors.length;
    } else {
      // Only count files that actually contain a component class
      const source = readFileSync(file, 'utf8');
      if (extractClassName(source)) {
        checkedComponents++;
      }
    }
  }

  if (totalErrors > 0) {
    console.error(`\n  ${totalErrors} CEM validation error(s) found.`);
    console.error(`  Run "pnpm run cem" to regenerate the manifest and re-run this check.`);
    process.exit(1);
  }

  console.log(`\n  All ${checkedComponents} component(s) passed CEM validation.`);
}

main();
