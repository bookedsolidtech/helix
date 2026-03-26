#!/usr/bin/env node

/**
 * CEM Validation Gate — HELiX
 *
 * Validates that the Custom Elements Manifest (custom-elements.json) accurately
 * reflects the public API defined in TypeScript source files. Prevents CEM drift
 * by comparing source-extracted @property, @fires, CSS parts, and slots against
 * what is documented in the manifest.
 *
 * Checks performed per component class:
 *   1. @property decorators (non-@internal) → CEM members (fields)
 *   2. @fires JSDoc tags                    → CEM events
 *   3. part="..." in HTML templates         → CEM cssParts
 *   4. <slot> elements                      → CEM slots (named and default)
 *   5. Class declaration                    → CEM declarations
 *
 * Design notes:
 *   - Files with multiple component classes (e.g. hx-grid.ts defining HelixGrid +
 *     HelixGridItem) are split into per-class sections so each class is validated
 *     against its own CEM entry.
 *   - @internal JSDoc tag on a @property block causes the property to be excluded
 *     from validation (the CEM analyzer also excludes @internal members).
 *   - part="..." matches are restricted to HTML template context; matches inside
 *     comment lines and JavaScript querySelector strings are skipped.
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
      if (decl.name) {
        index.set(decl.name, decl);
      }
    }
  }
  return index;
}

/**
 * Split a source file into per-class sections.
 *
 * Files may define more than one component class (e.g. hx-grid.ts exports
 * HelixGrid and HelixGridItem). This function returns an array of objects, one
 * per class, each containing only the source text from that class boundary to
 * the start of the next class (or end-of-file). This scopes all extraction
 * (properties, parts, slots, etc.) to the correct class.
 *
 * Returns: Array<{ className, tagName, classSource }>
 */
function splitIntoClassSections(fullSource) {
  // Find all class declarations: export class Helix* extends or export class Hx* extends
  const classPattern = /export\s+class\s+((?:Helix|Hx)\w+)\s+extends/g;
  const sections = [];
  let match;

  while ((match = classPattern.exec(fullSource)) !== null) {
    sections.push({ className: match[1], start: match.index });
  }

  if (sections.length === 0) return [];

  return sections.map((section, i) => {
    const end = i + 1 < sections.length ? sections[i + 1].start : fullSource.length;
    const classSource = fullSource.slice(section.start, end);

    // Extract the @customElement tag from the source preceding this class.
    // The decorator sits just above the class keyword, but may be arbitrarily
    // far from the class start (e.g. separated by JSDoc blocks). Search all
    // source text before the class and take the last match.
    const prefix = fullSource.slice(0, section.start);
    const decoratorPattern = /@customElement\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let decoratorMatch = null;
    let dm;
    while ((dm = decoratorPattern.exec(prefix)) !== null) {
      decoratorMatch = dm;
    }
    const tagName = decoratorMatch ? decoratorMatch[1] : null;

    return { className: section.className, tagName, classSource };
  });
}

// ── Source extraction ─────────────────────────────────────────────────────────

/**
 * Strip single-line (//) and block (/* ... *\/) comments from source so that
 * part="..." and other patterns inside comments are not matched.
 * Also strips template literal content that looks like JavaScript calls
 * (querySelector('[part="..."]')) to avoid matching JS strings as template parts.
 */
function stripComments(source) {
  // Remove block comments
  let stripped = source.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
  // Remove single-line comments
  stripped = stripped.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
  return stripped;
}

/**
 * Returns true if the position in source is inside a JavaScript CSS attribute
 * selector string, e.g. '[part="trigger"]' passed to querySelector.
 *
 * The tell: in HTML templates, part="..." appears as a bare attribute.
 * In JS, it appears as [part="..."] — the regex match is immediately preceded
 * by `[` (the CSS attribute selector bracket).
 */
function isInsideJsAttributeSelector(source, matchIndex) {
  const before = source.slice(Math.max(0, matchIndex - 60), matchIndex);
  // If immediately preceded by [ it's inside a CSS attribute selector string
  if (/\[$/.test(before)) return true;
  return false;
}

/**
 * Extract property names from @property decorators in a class section.
 * Excludes properties tagged @internal in the preceding JSDoc comment block.
 */
function extractProperties(classSource) {
  const props = new Set();

  // Split into lines for context-aware processing
  const lines = classSource.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect @property decorator line
    if (!/@property\s*\(/.test(line)) continue;

    // Check if the JSDoc block immediately preceding this @property contains @internal.
    // Strategy: scan backward from the @property line to find the closest */ then /**,
    // and check if @internal appears between those two markers.
    const contextAbove = lines.slice(Math.max(0, i - 15), i).join('\n');
    const closeIdx = contextAbove.lastIndexOf('*/');
    if (closeIdx !== -1) {
      const openIdx = contextAbove.lastIndexOf('/**', closeIdx);
      if (openIdx !== -1) {
        const jsDocBlock = contextAbove.slice(openIdx, closeIdx + 2);
        if (/@internal/.test(jsDocBlock)) {
          // The immediately preceding JSDoc block marks this property @internal — skip it
          continue;
        }
      }
    }

    // Extract property name from: @property(...) [modifiers] [get|set] propName
    // Pattern 1: decorator on its own line, declaration on the next line(s)
    const remainingFromDecorator = lines.slice(i, i + 5).join('\n');
    const p1 =
      /@property\s*\([^)]*\)\s*\n\s*(?:(?:readonly|public|protected|private|override)\s+)*(?:(?:get|set)\s+)?(\w+)/.exec(
        remainingFromDecorator,
      );
    if (p1) {
      const name = p1[1];
      if (!name.startsWith('_') && name !== 'override' && name !== 'static') {
        props.add(name);
      }
      continue;
    }

    // Pattern 2: decorator and declaration on the same line
    const p2 =
      /@property\s*\([^)]*\)\s+(?:(?:readonly|public|protected|private)\s+)*(\w+)[?!]?\s*[=:]/.exec(
        line,
      );
    if (p2) {
      const name = p2[1];
      if (!name.startsWith('_') && name !== 'override' && name !== 'static') {
        props.add(name);
      }
    }
  }

  return props;
}

/**
 * Extract event names from @fires JSDoc tags.
 */
function extractFires(classSource) {
  const events = new Set();
  const pattern = /@fires\s+(?:\{[^}]*\}\s+)?([\w-]+)/g;
  let match;
  while ((match = pattern.exec(classSource)) !== null) {
    events.add(match[1]);
  }
  return events;
}

/**
 * Extract CSS part names from part="..." attributes in HTML template literals.
 * Skips matches inside comment lines and JS querySelector strings.
 */
function extractCssParts(classSource) {
  const parts = new Set();
  const stripped = stripComments(classSource);
  const pattern = /part="([\w-]+(?:\s+[\w-]+)*)"/g;
  let match;
  while ((match = pattern.exec(stripped)) !== null) {
    if (isInsideJsAttributeSelector(stripped, match.index)) continue;
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
function extractSlots(classSource) {
  const named = new Set();
  let hasDefault = false;

  const stripped = stripComments(classSource);

  // Named slots: <slot name="foo">
  const namedPattern = /<slot\b[^>]*\bname="([\w-]+)"/g;
  let match;
  while ((match = namedPattern.exec(stripped)) !== null) {
    named.add(match[1]);
  }

  // Default (unnamed) slots: <slot> or <slot ...> without name="..."
  const defaultPattern = /<slot\b(?![^>]*\bname=)[^>]*>/g;
  if (defaultPattern.test(stripped)) {
    hasDefault = true;
  }

  return { named, hasDefault };
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateSection(section, cemIndex, relPath) {
  const { className, tagName, classSource } = section;
  const errors = [];

  // Locate the CEM declaration — prefer tag name lookup, fall back to class name
  const decl = (tagName && cemIndex.get(tagName)) || cemIndex.get(className);

  if (!decl) {
    errors.push({
      file: relPath,
      message: `Class "${className}" (tag: ${tagName ?? 'unknown'}) not found in CEM declarations`,
    });
    return errors;
  }

  // ── 1. @property decorators → CEM members ──────────────────────────────

  const sourceProps = extractProperties(classSource);
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

  const sourceEvents = extractFires(classSource);
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

  const sourceParts = extractCssParts(classSource);
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

  const { named: sourceNamedSlots, hasDefault: sourceHasDefault } = extractSlots(classSource);
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

function validateFile(filePath, cemIndex) {
  const relPath = filePath.replace(ROOT + '/', '');
  const fullSource = readFileSync(filePath, 'utf8');

  const sections = splitIntoClassSections(fullSource);
  if (sections.length === 0) return [];

  const errors = [];
  for (const section of sections) {
    errors.push(...validateSection(section, cemIndex, relPath));
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
    const fullSource = readFileSync(file, 'utf8');
    const sections = splitIntoClassSections(fullSource);
    checkedComponents += sections.length;

    const errors = validateFile(file, cemIndex);
    if (errors.length > 0) {
      for (const err of errors) {
        console.error(`\n  [FAIL] ${err.file}`);
        console.error(`         ${err.message}`);
      }
      totalErrors += errors.length;
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
