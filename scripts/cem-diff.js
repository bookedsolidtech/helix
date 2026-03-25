#!/usr/bin/env node

/**
 * CEM Diff — HELiX
 *
 * Compares custom-elements.json from a PR branch vs a base branch.
 * Reports added/removed/changed public API per component:
 *   - Properties (reactive attributes)
 *   - Events
 *   - Slots
 *   - CSS parts
 *   - CSS custom properties
 *
 * Breaking changes (removals, type changes) are flagged with warnings.
 * Non-breaking changes (additions) are noted separately.
 *
 * Usage:
 *   node scripts/cem-diff.js --base <path-to-base-cem.json> --head <path-to-head-cem.json>
 *   node scripts/cem-diff.js --base <path> --head <path> --output <path-to-output.md>
 *   node scripts/cem-diff.js --base <path> --head <path> --json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const VERSIONING_POLICY_URL =
  'https://github.com/bookedsolidtech/helix/blob/main/docs/versioning-policy.md';

// ── CLI argument parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

const baseArg = getArg('--base');
const headArg = getArg('--head');
const outputArg = getArg('--output');
const isJSON = args.includes('--json');

if (!baseArg || !headArg) {
  console.error(
    'Usage: cem-diff.js --base <base-cem.json> --head <head-cem.json> [--output <out.md>] [--json]',
  );
  process.exit(1);
}

const basePath = resolve(ROOT, baseArg);
const headPath = resolve(ROOT, headArg);

// ── CEM parsing ─────────────────────────────────────────────────────────────

/**
 * Build a map of { tagName -> declaration } from a CEM JSON.
 * Only includes entries with a `tagName` (custom elements).
 */
function buildComponentMap(cem) {
  const map = new Map();
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl.tagName) {
        map.set(decl.tagName, decl);
      }
    }
  }
  return map;
}

/**
 * Extract a keyed map from an array of CEM items using `name` as the key.
 */
function byName(arr) {
  const map = new Map();
  for (const item of arr ?? []) {
    map.set(item.name ?? '', item);
  }
  return map;
}

// ── Diff logic ───────────────────────────────────────────────────────────────

/**
 * Diff two maps of named items (properties, events, slots, cssParts, cssProperties).
 * Returns { added, removed, changed } arrays.
 *
 * @param {Map<string, object>} baseMap
 * @param {Map<string, object>} headMap
 * @param {(base: object, head: object) => string[]} detectChanges - returns list of change descriptions
 */
function diffNamedItems(baseMap, headMap, detectChanges) {
  const added = [];
  const removed = [];
  const changed = [];

  for (const [name, headItem] of headMap) {
    if (!baseMap.has(name)) {
      added.push(headItem);
    } else {
      const diffs = detectChanges(baseMap.get(name), headItem);
      if (diffs.length > 0) {
        changed.push({ item: headItem, changes: diffs });
      }
    }
  }

  for (const [name, baseItem] of baseMap) {
    if (!headMap.has(name)) {
      removed.push(baseItem);
    }
  }

  return { added, removed, changed };
}

/**
 * Detect changes to a property/field.
 */
function detectPropertyChanges(base, head) {
  const changes = [];
  const baseType = base.type?.text ?? '';
  const headType = head.type?.text ?? '';
  if (baseType !== headType) {
    changes.push(`type changed: \`${baseType || 'unknown'}\` → \`${headType || 'unknown'}\``);
  }
  if ((base.default ?? '') !== (head.default ?? '')) {
    changes.push(`default changed: \`${base.default ?? 'none'}\` → \`${head.default ?? 'none'}\``);
  }
  if (Boolean(base.reflects) !== Boolean(head.reflects)) {
    changes.push(`reflects changed: ${base.reflects ?? false} → ${head.reflects ?? false}`);
  }
  return changes;
}

/**
 * Detect changes to an event.
 */
function detectEventChanges(base, head) {
  const changes = [];
  const baseType = base.type?.text ?? '';
  const headType = head.type?.text ?? '';
  if (baseType !== headType) {
    changes.push(`type changed: \`${baseType || 'unknown'}\` → \`${headType || 'unknown'}\``);
  }
  return changes;
}

/**
 * Detect changes to a CSS custom property.
 */
function detectCssPropChanges(base, head) {
  const changes = [];
  if ((base.default ?? '') !== (head.default ?? '')) {
    changes.push(`default changed: \`${base.default ?? 'none'}\` → \`${head.default ?? 'none'}\``);
  }
  return changes;
}

/**
 * Diff two component declarations. Returns a per-category result.
 */
function diffComponent(baseDecl, headDecl) {
  // Properties: fields that have an `attribute` (i.e., are reactive properties)
  const baseProps = byName(
    (baseDecl.members ?? []).filter((m) => m.kind === 'field' && m.attribute !== undefined),
  );
  const headProps = byName(
    (headDecl.members ?? []).filter((m) => m.kind === 'field' && m.attribute !== undefined),
  );

  return {
    properties: diffNamedItems(baseProps, headProps, detectPropertyChanges),
    events: diffNamedItems(byName(baseDecl.events), byName(headDecl.events), detectEventChanges),
    slots: diffNamedItems(byName(baseDecl.slots), byName(headDecl.slots), () => []),
    cssParts: diffNamedItems(byName(baseDecl.cssParts), byName(headDecl.cssParts), () => []),
    cssProperties: diffNamedItems(
      byName(baseDecl.cssProperties),
      byName(headDecl.cssProperties),
      detectCssPropChanges,
    ),
  };
}

/**
 * Determine if a per-category diff result contains any breaking changes.
 * Breaking = removals or type changes to properties/events.
 */
function hasBreakingChanges(componentDiff) {
  const categories = Object.values(componentDiff);
  for (const cat of categories) {
    if (cat.removed.length > 0) return true;
  }
  // Type changes on properties or events are also breaking
  if (componentDiff.properties.changed.length > 0) return true;
  if (componentDiff.events.changed.length > 0) return true;
  return false;
}

/**
 * Returns true if a diff result has any changes at all.
 */
function hasDiff(componentDiff) {
  return Object.values(componentDiff).some(
    (cat) => cat.added.length > 0 || cat.removed.length > 0 || cat.changed.length > 0,
  );
}

// ── Markdown generation ──────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  properties: 'Properties',
  events: 'Events',
  slots: 'Slots',
  cssParts: 'CSS Parts',
  cssProperties: 'CSS Custom Properties',
};

function renderCategoryDiff(label, diff, isBreakingCategory) {
  const lines = [];

  if (diff.removed.length > 0) {
    for (const item of diff.removed) {
      lines.push(`| ${label} | \`${item.name}\` | ⛔ Removed (**breaking**) |`);
    }
  }

  if (diff.changed.length > 0) {
    for (const { item, changes } of diff.changed) {
      const changeDesc = changes.join('; ');
      const flag = isBreakingCategory ? '⚠️ Changed (**breaking**)' : '✏️ Changed';
      lines.push(`| ${label} | \`${item.name}\` | ${flag}: ${changeDesc} |`);
    }
  }

  if (diff.added.length > 0) {
    for (const item of diff.added) {
      lines.push(`| ${label} | \`${item.name}\` | ✅ Added |`);
    }
  }

  return lines;
}

function renderComponentSection(tagName, componentDiff, isNew, isRemoved) {
  if (isRemoved) {
    return [`### \`${tagName}\` — ⛔ Component removed (**breaking**)`, ''];
  }

  if (isNew) {
    return [`### \`${tagName}\` — ✅ New component`, ''];
  }

  const breaking = hasBreakingChanges(componentDiff);
  const title = breaking ? `### \`${tagName}\` — ⚠️ Breaking changes` : `### \`${tagName}\``;

  const lines = [title];
  const tableRows = [];

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const isBreakingCategory = key === 'properties' || key === 'events';
    const catRows = renderCategoryDiff(label, componentDiff[key], isBreakingCategory);
    tableRows.push(...catRows);
  }

  if (tableRows.length > 0) {
    lines.push('');
    lines.push('| Category | Name | Change |');
    lines.push('| :--- | :--- | :--- |');
    lines.push(...tableRows);
  }

  lines.push('');
  return lines;
}

function generateMarkdown(result) {
  const { newComponents, removedComponents, changedComponents, hasAnyBreaking, totalChanges } =
    result;

  if (totalChanges === 0) {
    return ['## CEM API Diff', '', '> No public API changes detected.', ''].join('\n');
  }

  const lines = ['## CEM API Diff', ''];

  // Summary
  const summaryParts = [];
  if (newComponents.length > 0) {
    summaryParts.push(
      `${newComponents.length} new component${newComponents.length > 1 ? 's' : ''}`,
    );
  }
  if (removedComponents.length > 0) {
    summaryParts.push(
      `${removedComponents.length} removed component${removedComponents.length > 1 ? 's' : ''}`,
    );
  }
  if (changedComponents.length > 0) {
    summaryParts.push(
      `${changedComponents.length} modified component${changedComponents.length > 1 ? 's' : ''}`,
    );
  }
  lines.push(`**${summaryParts.join(' · ')}**`);
  lines.push('');

  if (hasAnyBreaking) {
    lines.push(
      `> ⚠️ **This PR contains breaking API changes.** Breaking changes require a \`major\` version bump.`,
    );
    lines.push(`> See the [versioning policy](${VERSIONING_POLICY_URL}) for guidance.`);
    lines.push('');
  }

  // Removed components (always breaking)
  for (const tagName of removedComponents) {
    lines.push(...renderComponentSection(tagName, null, false, true));
  }

  // Changed components with breaking changes first
  const breakingChanged = changedComponents.filter(({ diff }) => hasBreakingChanges(diff));
  const nonBreakingChanged = changedComponents.filter(({ diff }) => !hasBreakingChanges(diff));

  for (const { tagName, diff } of breakingChanged) {
    lines.push(...renderComponentSection(tagName, diff, false, false));
  }

  for (const { tagName, diff } of nonBreakingChanged) {
    lines.push(...renderComponentSection(tagName, diff, false, false));
  }

  // New components (non-breaking)
  for (const tagName of newComponents) {
    lines.push(...renderComponentSection(tagName, null, true, false));
  }

  return lines.join('\n');
}

// ── JSON output ──────────────────────────────────────────────────────────────

function generateJSON(result) {
  return JSON.stringify(result, null, 2);
}

// ── Main ─────────────────────────────────────────────────────────────────────

function run() {
  let baseCEM, headCEM;

  try {
    baseCEM = JSON.parse(readFileSync(basePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read base CEM: ${basePath}\n${err.message}`);
    process.exit(1);
  }

  try {
    headCEM = JSON.parse(readFileSync(headPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read head CEM: ${headPath}\n${err.message}`);
    process.exit(1);
  }

  const baseMap = buildComponentMap(baseCEM);
  const headMap = buildComponentMap(headCEM);

  const newComponents = [];
  const removedComponents = [];
  const changedComponents = [];
  let hasAnyBreaking = false;

  // Find new and changed components
  for (const [tagName, headDecl] of headMap) {
    if (!baseMap.has(tagName)) {
      newComponents.push(tagName);
    } else {
      const diff = diffComponent(baseMap.get(tagName), headDecl);
      if (hasDiff(diff)) {
        changedComponents.push({ tagName, diff });
        if (hasBreakingChanges(diff)) {
          hasAnyBreaking = true;
        }
      }
    }
  }

  // Find removed components
  for (const tagName of baseMap.keys()) {
    if (!headMap.has(tagName)) {
      removedComponents.push(tagName);
      hasAnyBreaking = true;
    }
  }

  const totalChanges = newComponents.length + removedComponents.length + changedComponents.length;

  const result = {
    generated: new Date().toISOString(),
    totalChanges,
    hasAnyBreaking,
    newComponents,
    removedComponents,
    changedComponents,
  };

  if (isJSON) {
    const output = generateJSON(result);
    if (outputArg) {
      writeFileSync(resolve(ROOT, outputArg), output, 'utf8');
      console.log(`CEM diff written to ${outputArg}`);
    } else {
      console.log(output);
    }
  } else {
    const markdown = generateMarkdown(result);
    if (outputArg) {
      writeFileSync(resolve(ROOT, outputArg), markdown, 'utf8');
      console.log(`CEM diff written to ${outputArg}`);
    } else {
      console.log(markdown);
    }
  }
}

run();
