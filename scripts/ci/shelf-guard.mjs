#!/usr/bin/env node

/**
 * Shelf Guard — HELiX 3.0-shelf enforcement (the H18 + H23 CI gate)
 *
 * Enforces the release contract: a breaking public-API change must carry a
 * `@helixui/library: major` changeset. On the 3.x shelf an *accidental* breaking
 * change (a removed prop, renamed attribute, dropped method, or narrowed enum
 * labeled `patch`/`minor`) is blocked at PR time — the gap the audit found
 * (AUDIT-3x-register.md §1, B1–B3, B5): the breaking-change detector (H18) and
 * semver validator (H23) existed but ran in NO automated path.
 *
 * Detection compares the base-vs-head Custom Elements Manifests directly. It
 * flags, with high confidence and zero false positives:
 *   - removed components
 *   - removed attributes (so an attribute RENAME is caught — the old name is gone)
 *   - removed public properties, INCLUDING JS-only `attribute: false` props
 *     (e.g. hx-phi-field.data, hx-tabs.selectedIndex)
 *   - removed public methods (e.g. hx-dialog.show), a new required parameter, or
 *     a dropped parameter
 *   - removed events, and removed event-detail object fields / slots (incl. the
 *     default slot) / CSS parts / CSS props
 *   - removed/renamed named public exports AND removed barrel side-effect imports
 *     (e.g. the token-adoption prelude) — incl. non-component exports (mixins like
 *     FocusMixin, utilities like ensureDocumentTokens, the HelixElement base
 *     class) — diffed from the generated barrel (src/index.ts), the package's
 *     allowlist-gated export surface
 *   - removed public package subpath exports (package.json `exports`, e.g.
 *     ./fouc.css, ./custom-elements.json)
 *   - a settable property made readonly
 *   - a NARROWED settable type — attribute, settable property, or method
 *     parameter — for simple top-level unions of literals/identifiers
 *     (e.g. `'sm' | 'md' | 'lg'` → `'sm' | 'md'`). Widening (adding a `variant`
 *     value) is additive and passes. Readonly (output-only) properties are not
 *     narrowing-checked — tightening a value consumers only read is compatible.
 *
 * SCOPE / known limitations — by design, NOT defects:
 *   - Non-component exports are diffed by NAME (removal/rename), not by deep
 *     signature: the CEM analyzes only `src/components`, so a member/parameter
 *     change inside a non-component export (a mixin interface, an exported type
 *     alias, or a HelixAuditController method not inherited by a component) is not
 *     inspected here. Base-class/mixin members that a component DOES inherit are
 *     inlined into that component's manifest, so their removal IS caught.
 *   - Beyond field REMOVAL, it does not classify type changes INSIDE nested type
 *     strings (event-detail field type changes, generic type arguments, return
 *     types) — that needs TypeScript-compiler-level variance analysis
 *     (input-contravariant vs output-covariant); string heuristics there risk
 *     false positives that would erode trust in a required gate.
 * Both are surfaced for human judgement by the informational "CEM API Diff" PR
 * comment (scripts/cem-diff.js), the react-wrapper-drift gate, type-check, and
 * review; any outright removal is still caught above.
 *
 * Why not wire the H18/H23 hooks directly: they gate on git-STAGED files and read
 * the previous CEM from HEAD (a commit-time model). On a PR runner nothing is
 * staged and HEAD is the merge commit, so a naive wiring no-ops. This gate
 * compares two explicitly-generated CEM files instead.
 *
 * Usage:
 *   node scripts/ci/shelf-guard.mjs --base-cem <b.json> --head-cem <h.json> \
 *     [--base-barrel <b.ts> --head-barrel <h.ts>] [--base-pkg <b.json> --head-pkg <h.json>] \
 *     [--changesets <dir>] [--base-ref <ref>] [--label-bypass]
 *
 * Exit codes:
 *   0 — no breaking changes, OR declared `@helixui/library: major`, OR an explicit
 *       `breaking-change-approved` label bypass.
 *   1 — breaking public-API change(s) without a major library changeset.
 *   2 — usage / IO error.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const LIBRARY_PKG = '@helixui/library';

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}
const baseCemPath = getArg('--base-cem');
const headCemPath = getArg('--head-cem');
// Generated barrels (src/index.ts) — the package's allowlist-gated named-export
// surface. Optional; when both are given, removed public exports are flagged.
const baseBarrelPath = getArg('--base-barrel');
const headBarrelPath = getArg('--head-barrel');
// package.json snapshots — to diff the public subpath `exports` map. Optional.
const basePkgPath = getArg('--base-pkg');
const headPkgPath = getArg('--head-pkg');
const changesetsDir = getArg('--changesets') ?? '.changeset';
// Base ref to scope changeset discovery to THIS PR (so a pre-existing/queued
// changeset on the base branch can't satisfy the gate for a new change).
const baseRef = getArg('--base-ref');
const labelBypass = args.includes('--label-bypass');

if (!baseCemPath || !headCemPath) {
  console.error('::error::shelf-guard: --base-cem and --head-cem are required');
  console.error(
    'Usage: shelf-guard.mjs --base-cem <base.json> --head-cem <head.json> [--changesets <dir>] [--base-ref <ref>] [--label-bypass]',
  );
  process.exit(2);
}

function readCem(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (err) {
    console.error(`::error::shelf-guard: failed to read CEM at ${path}: ${err.message}`);
    process.exit(2);
  }
}

/**
 * Parse a generated barrel (src/index.ts) into its value and type export name
 * sets — `export { … } from` (values, plus inline `type X` → types) and
 * `export type { … } from` (types). The barrel uses no `export *`. This is the
 * package's true, allowlist-gated public export surface: it includes
 * non-component exports (FocusMixin, ensureDocumentTokens, HelixElement) and
 * excludes internal helpers. Tracking the value/type KIND matters: demoting a
 * value export to type-only breaks runtime consumers.
 */
function barrelExports(path) {
  let src;
  try {
    src = readFileSync(resolve(path), 'utf8');
  } catch (err) {
    console.error(`::error::shelf-guard: failed to read barrel at ${path}: ${err.message}`);
    process.exit(2);
  }
  const values = new Set();
  const types = new Set();
  // Side-effect imports (`import './x.js';`, no binding) are part of the runtime
  // contract — e.g. the token-adoption prelude; dropping one breaks consumers.
  const sideEffects = new Set();
  const seRe = /^\s*import\s+['"]([^'"]+)['"]\s*;?\s*$/gm;
  let s;
  while ((s = seRe.exec(src))) sideEffects.add(s[1]);
  const re = /export\s+(type\s+)?\{([^}]*)\}\s*from/g;
  let m;
  while ((m = re.exec(src))) {
    const allType = Boolean(m[1]); // `export type { … }`
    for (let entry of m[2].split(',')) {
      entry = entry.trim();
      if (!entry) continue;
      // Inline `type Foo` is type-only even inside a value `export { … }`.
      let isType = allType;
      if (/^type\s+/.test(entry)) {
        isType = true;
        entry = entry.replace(/^type\s+/, '');
      }
      const parts = entry.split(/\s+as\s+/); // `X as Y` exports Y
      const name = parts[parts.length - 1].trim();
      if (name) (isType ? types : values).add(name);
    }
  }
  return { values, types, sideEffects };
}

/** Set of public subpath keys from a package.json `exports` map. */
function pkgExportKeys(path) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (err) {
    console.error(`::error::shelf-guard: failed to read package.json at ${path}: ${err.message}`);
    process.exit(2);
  }
  const exp = pkg.exports;
  if (!exp || typeof exp === 'string') return new Set(['.']);
  return new Set(Object.keys(exp));
}

// ── CEM comparison ──────────────────────────────────────────────────────────

/** Map tagName -> custom-element declaration. */
function componentMap(cem) {
  const map = new Map();
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl.tagName) map.set(decl.tagName, decl);
    }
  }
  return map;
}

/**
 * Map item.name -> item for any named CEM array. The default (unnamed) slot is
 * represented with a null/empty name in the CEM (hx-button, hx-dialog, hx-tabs,
 * …); it is keyed on '' so its removal is still detected.
 */
function byName(arr) {
  const map = new Map();
  for (const item of arr ?? []) if (item) map.set(item.name ?? '', item);
  return map;
}

// Public = not private/protected and not underscore-prefixed (the CEM marks
// HELiX's protected lifecycle hooks both ways; either signal excludes them).
const isPublic = (m) =>
  m && m.privacy !== 'private' && m.privacy !== 'protected' && !String(m.name).startsWith('_');

const publicFields = (decl) =>
  byName((decl.members ?? []).filter((m) => m.kind === 'field' && isPublic(m)));
const publicMethods = (decl) =>
  byName((decl.members ?? []).filter((m) => m.kind === 'method' && isPublic(m)));

const typeText = (x) => x?.type?.text ?? '';

/** Depth-aware split of a type string into top-level union members. */
function splitUnion(text) {
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(text)) {
    if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth++;
    else if (ch === '>' || ch === ')' || ch === '}' || ch === ']') depth--;
    if (depth === 0 && ch === '|') {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/**
 * Field names of the outermost object literal in a type string, or null if there
 * is none. Used for event-detail payloads (e.g. `CustomEvent<{value, date}>`).
 * Optionality and field types are intentionally ignored — see the events check.
 */
function objectFieldNames(text) {
  const t = String(text);
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  const names = new Set();
  for (const field of splitTopLevelChars(t.slice(start + 1, end), [';', ','])) {
    const idx = topLevelColon(field);
    if (idx === -1) continue; // index/call signature — skip
    const name = field.slice(0, idx).trim().replace(/\?$/, '').trim();
    if (name) names.add(name);
  }
  return names.size ? names : null;
}

/** Split on top-level occurrences of any char in `seps`, respecting nesting. */
function splitTopLevelChars(text, seps) {
  const sep = new Set(seps);
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(text)) {
    if (ch === '<' || ch === '(' || ch === '{' || ch === '[') depth++;
    else if (ch === '>' || ch === ')' || ch === '}' || ch === ']') depth--;
    if (depth === 0 && sep.has(ch)) {
      if (cur.trim()) parts.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** Index of the first top-level `:`, else -1. */
function topLevelColon(text) {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '<' || c === '(' || c === '{' || c === '[') depth++;
    else if (c === '>' || c === ')' || c === '}' || c === ']') depth--;
    else if (depth === 0 && c === ':') return i;
  }
  return -1;
}

// A leaf `base` is still accepted by leaf `head` when head is strictly wider:
// `unknown`/`any` accept everything; a primitive accepts its own literals.
const isLeafWidening = (b, h) => {
  if (h === 'unknown' || h === 'any') return true;
  if (h === 'string' && /^(['"]).*['"]$/.test(b)) return true;
  if (h === 'number' && /^-?[\d.]/.test(b)) return true;
  if (h === 'boolean' && (b === 'true' || b === 'false')) return true;
  return false;
};

/**
 * Breaking iff an INPUT type (attribute / settable property / method parameter)
 * NARROWS — the head no longer accepts a value the base did. Applied only to
 * SIMPLE top-level unions of literals/identifiers, where narrowing is
 * unambiguous; widening is additive. Nested/complex types are out of scope (see
 * the header scope note) and are treated as non-breaking here.
 */
const NARROWING_PRIMS = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'never',
  'unknown',
  'any',
  'object',
  'symbol',
  'bigint',
  'true',
  'false',
]);
// A member is comparable only if it is a primitive or a literal — NOT a bare
// type-alias identifier (e.g. `ButtonVariant`), which the CEM string can't
// expand, so extracting a union into a named alias must not read as narrowing.
const isResolvable = (m) =>
  NARROWING_PRIMS.has(m) || /^(['"]).*['"]$/.test(m) || /^-?[\d.]/.test(m);

function isInputNarrowing(baseT, headT) {
  const b = String(baseT ?? '').trim();
  const h = String(headT ?? '').trim();
  if (b === h || !b || !h) return false;
  const bU = splitUnion(b);
  const hU = splitUnion(h);
  const simple = (arr) => arr.every((m) => !/[<>(){}[\];|&]/.test(m));
  if (!simple(bU) || !simple(hU)) return false;
  if (!bU.every(isResolvable) || !hU.every(isResolvable)) return false;
  const head = new Set(hU);
  return bU.some((m) => !head.has(m) && !hU.some((hm) => isLeafWidening(m, hm)));
}

/**
 * Compare base vs head CEM and return a flat list of breaking-change
 * descriptions. See the header for the precise, intentionally-bounded scope.
 */
function detectBreaking(baseCem, headCem) {
  const out = [];
  const base = componentMap(baseCem);
  const head = componentMap(headCem);

  for (const tag of base.keys()) {
    if (!head.has(tag)) out.push(`${tag}: component removed`);
  }

  for (const [tag, headDecl] of head) {
    const baseDecl = base.get(tag);
    if (!baseDecl) continue; // new component — additive

    // Removal-only named surfaces.
    for (const [arr, label] of [
      ['slots', 'slot'],
      ['cssParts', 'CSS part'],
      ['cssProperties', 'CSS custom property'],
    ]) {
      const b = byName(baseDecl[arr]);
      const h = byName(headDecl[arr]);
      for (const name of b.keys()) {
        if (!h.has(name)) out.push(`${tag}: removed ${label} \`${name || '(default)'}\``);
      }
    }

    // Events (output / covariant). A removed event is breaking; so is a removed
    // event-detail FIELD (a reader loses it). Field ADDITIONS and field-type
    // changes are NOT classified: additions are additive for readers, and an
    // output narrowing is consumer-compatible while a widening would need full
    // variance analysis (see the header scope note) — those are surfaced by the
    // informational CEM diff. Field removal is checked only when BOTH details are
    // object literals, so extracting a detail into a named type is not flagged.
    {
      const b = byName(baseDecl.events);
      const h = byName(headDecl.events);
      for (const [name, be] of b) {
        const he = h.get(name);
        if (!he) {
          out.push(`${tag}: removed event \`${name}\``);
          continue;
        }
        const bf = objectFieldNames(typeText(be));
        const hf = objectFieldNames(typeText(he));
        if (bf && hf) {
          for (const f of bf) {
            if (!hf.has(f)) out.push(`${tag}: event \`${name}\` detail field \`${f}\` removed`);
          }
        }
      }
    }

    // Attributes (input) — removal (catches renames) + narrowing.
    {
      const b = byName(baseDecl.attributes);
      const h = byName(headDecl.attributes);
      for (const [name, ba] of b) {
        const ha = h.get(name);
        if (!ha) out.push(`${tag}: removed attribute \`${name}\``);
        else if (isInputNarrowing(typeText(ba), typeText(ha)))
          out.push(
            `${tag}: attribute \`${name}\` type narrowed (\`${typeText(ba)}\` → \`${typeText(ha)}\`)`,
          );
      }
    }

    // Public properties (incl. JS-only attribute:false). Removal is breaking.
    // Narrowing is breaking only for SETTABLE props — a readonly (output-only)
    // property can narrow its value type compatibly; making a settable property
    // readonly is breaking (consumers can no longer set it).
    {
      const b = publicFields(baseDecl);
      const h = publicFields(headDecl);
      for (const [name, bf] of b) {
        const hf = h.get(name);
        if (!hf) {
          out.push(`${tag}: removed property \`${name}\``);
          continue;
        }
        if (bf.readonly) continue; // output-only — narrowing is consumer-compatible
        if (hf.readonly) out.push(`${tag}: property \`${name}\` became readonly`);
        else if (isInputNarrowing(typeText(bf), typeText(hf)))
          out.push(
            `${tag}: property \`${name}\` type narrowed (\`${typeText(bf)}\` → \`${typeText(hf)}\`)`,
          );
      }
    }

    // Public methods — removal, arity tightening, parameter narrowing.
    {
      const b = publicMethods(baseDecl);
      const h = publicMethods(headDecl);
      const requiredCount = (m) => (m.parameters ?? []).filter((p) => !p.optional).length;
      for (const [name, bm] of b) {
        const hm = h.get(name);
        if (!hm) {
          out.push(`${tag}: removed method \`${name}\``);
          continue;
        }
        const bp = bm.parameters ?? [];
        const hp = hm.parameters ?? [];
        if (requiredCount(hm) > requiredCount(bm)) {
          out.push(
            `${tag}: method \`${name}\` now requires more parameters (${requiredCount(bm)} → ${requiredCount(hm)})`,
          );
        }
        if (bp.length > hp.length) {
          out.push(`${tag}: method \`${name}\` dropped a parameter (${bp.length} → ${hp.length})`);
        }
        for (let i = 0; i < Math.min(bp.length, hp.length); i++) {
          if (isInputNarrowing(typeText(bp[i]), typeText(hp[i]))) {
            out.push(
              `${tag}: method \`${name}\` parameter \`${hp[i].name ?? i}\` type narrowed (\`${typeText(bp[i])}\` → \`${typeText(hp[i])}\`)`,
            );
          }
        }
      }
    }
  }

  return out;
}

const breaking = detectBreaking(readCem(baseCemPath), readCem(headCemPath));

// Named public exports (from the barrel). A removed value export breaks runtime
// consumers — and demoting a value export to type-only is the same break. A
// removed type export breaks type consumers unless the name still exists as a
// value (which `import type` resolves). Promoting type→value, or adding either,
// is additive.
if (baseBarrelPath && headBarrelPath) {
  const base = barrelExports(baseBarrelPath);
  const head = barrelExports(headBarrelPath);
  for (const name of base.values) {
    if (!head.values.has(name)) breaking.push(`removed value export \`${name}\``);
  }
  for (const name of base.types) {
    if (!head.types.has(name) && !head.values.has(name))
      breaking.push(`removed type export \`${name}\``);
  }
  for (const se of base.sideEffects) {
    if (!head.sideEffects.has(se)) breaking.push(`removed barrel side-effect import \`${se}\``);
  }
}

// Public package subpath exports (package.json `exports`). Removing or renaming a
// subpath (e.g. ./fouc.css, ./custom-elements.json) breaks consumers importing it.
if (basePkgPath && headPkgPath) {
  const baseKeys = pkgExportKeys(basePkgPath);
  const headKeys = pkgExportKeys(headPkgPath);
  for (const k of baseKeys) {
    if (!headKeys.has(k)) breaking.push(`removed package export subpath \`${k}\``);
  }
}

// ── No breaking changes → the shelf holds ───────────────────────────────────

if (breaking.length === 0) {
  console.log('✓ shelf-guard: no breaking public-API changes detected. 3.0 shelf intact.');
  process.exit(0);
}

// ── Breaking changes detected → require a major library changeset ────────────

/**
 * The changeset `.md` files INTRODUCED by this PR. With a base ref we diff
 * against it (three-dot, i.e. since the merge-base) so a pre-existing/queued
 * changeset on the base branch can't satisfy the gate for a NEW breaking change.
 * Falls back to every changeset in the directory if git is unavailable.
 */
function prChangesetFiles(dir, base) {
  if (base) {
    try {
      const out = execFileSync(
        'git',
        ['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', dir],
        { encoding: 'utf8' },
      );
      return out
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.endsWith('.md') && !l.endsWith('/README.md'));
    } catch (err) {
      console.error(
        `::warning::shelf-guard: could not diff changesets against ${base} (${err.message}); scanning all changesets in ${dir}.`,
      );
    }
  }
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => join(dir, f));
}

/**
 * Highest bump this PR's changesets declare specifically for @helixui/library
 * (the package whose CEM produced the breaking diff). Package-specific: a `major`
 * on some OTHER package does not satisfy the gate. Frontmatter is the standard
 * changesets format:
 *   ---
 *   '@helixui/library': major
 *   ---
 */
function libraryBump(files) {
  const order = { patch: 0, minor: 1, major: 2 };
  let best = null;
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); // tolerate CRLF
    } catch {
      continue;
    }
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    for (const line of fm[1].split('\n')) {
      const m = line.match(/^\s*['"]?([^'":]+?)['"]?\s*:\s*(major|minor|patch)\s*$/);
      if (!m || m[1].trim() !== LIBRARY_PKG) continue;
      const bump = m[2];
      if (best === null || order[bump] > order[best]) best = bump;
    }
  }
  return best;
}

const bump = libraryBump(prChangesetFiles(changesetsDir, baseRef));

console.error('::group::Breaking public-API changes detected');
for (const line of breaking) console.error(`  • ${line}`);
console.error('::endgroup::');

if (bump === 'major') {
  console.log(
    `✓ shelf-guard: ${breaking.length} breaking change(s) detected AND this PR declares \`${LIBRARY_PKG}: major\`.`,
  );
  console.log(
    '::warning::This PR declares a MAJOR (4.0) release. Confirm this is intentional — the 3.0 shelf is being broken on purpose.',
  );
  process.exit(0);
}

if (labelBypass) {
  console.log(
    `✓ shelf-guard: ${breaking.length} breaking change(s) detected but overridden by the \`breaking-change-approved\` label.`,
  );
  console.log(
    '::warning::Breaking-change gate bypassed by label. Ensure a 4.0 backlog entry exists.',
  );
  process.exit(0);
}

console.error(
  `::error::3.0 shelf violated — ${breaking.length} breaking public-API change(s) without a \`${LIBRARY_PKG}: major\` changeset (this PR declares for ${LIBRARY_PKG}: ${bump ?? 'no bump'}).`,
);
console.error('');
console.error('Resolve one of these ways:');
console.error(
  '  1. Make the change non-breaking (add a compat shim / dual-name alias — see docs/audit/BREAKING-CHANGES-4.0.md), OR',
);
console.error(
  `  2. If this is deliberate 4.0 work, set this PR's changeset to \`${LIBRARY_PKG}: major\`, OR`,
);
console.error(
  '  3. For a documented false-positive, add the `breaking-change-approved` PR label, then',
);
console.error('     re-run this job (a label change does not by itself re-trigger CI).');
process.exit(1);
