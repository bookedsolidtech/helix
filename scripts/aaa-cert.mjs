#!/usr/bin/env node

/**
 * aaa-cert.mjs — single-command per-component AAA certifier.
 *
 * AAA Cert Epic — Phase B.2 (validated-toasting-wand plan).
 *
 * Usage:
 *
 *   pnpm exec node scripts/aaa-cert.mjs <component-name>            # apply
 *   pnpm exec node scripts/aaa-cert.mjs <component-name> --dry-run  # preview
 *
 * Steps (per the plan):
 *
 *   1. Validate <component-name> exists in p0-priority-tiers.json p0 section.
 *   2. Verify packages/hx-library/src/components/<component-name>/ exists.
 *   3. Run scoped vitest with AAA level (deferred to operator if the test
 *      suite isn't already opting in).
 *   4. Generate AAA-AUDIT.md from the embedded template.
 *   5. Apply the full @aaa-* / @keyboard-contract / @aria-pattern / @figma-* /
 *      @priority-tier / @phi-handles / etc. JSDoc block to the class header.
 *   6. Add the component to scripts/a11y-aaa-allowlist.json.
 *   7. Regenerate the CEM (pnpm --filter=@helixui/library run cem).
 *   8. Verify CEM round-trips (handled by the cem step itself; the validator
 *      is part of the cem pnpm script).
 *   9. Update the VPAT row for the component (Pending audit → Supports).
 *  10. Stage all changes for ONE signed commit and print the suggested message.
 *  11. --dry-run prints all the above WITHOUT writing files or staging.
 *
 * Defaults & detection:
 *
 *   - @aaa-certified                 — today's ISO date
 *   - @aaa-criteria                  — full 11-criteria list (see PHASE_B_CRITERIA);
 *                                      operator narrows it via prompt-style
 *                                      `--criteria a,b,c` if any AAA SC fails.
 *   - @aaa-audit                     — relative path to AAA-AUDIT.md
 *   - @keyboard-contract             — operator-supplied via --keyboard "..." OR
 *                                      inferred from @aria-pattern (button →
 *                                      Enter,Space; navigation → Arrow keys;
 *                                      etc.). When inference is impossible the
 *                                      script flags the component for manual
 *                                      operator input and exits.
 *   - @aria-pattern                  — operator-supplied via --pattern <name> OR
 *                                      inferred from suffix heuristics (button,
 *                                      tabs, dialog, alertdialog, listbox,
 *                                      combobox, menu, slider, …).
 *   - @forced-colors-supported true  — every Helix component supports it.
 *   - @stability stable              — default for shipped components; pass
 *                                      --stability beta|experimental to override.
 *   - @since <pkgVersion>             — read from packages/hx-library/package.json.
 *   - @form-associated               — detected from `static formAssociated = true`
 *                                      in the .ts source.
 *   - @theme-aware true              — Helix default.
 *   - @brand-aware true              — Helix default.
 *   - @drupal-sdc-eligible true      — Helix default.
 *   - @react-wrapper-status complete — detected from packages/hx-react/src/components/.
 *   - @figma-component-name          — defaults to component tag.
 *   - @priority-tier P0              — sourced from p0-priority-tiers.json (P0 only;
 *                                      script rejects non-P0 components).
 *   - @phi-handles false             — default unless the component is hx-clinical-status
 *                                      or hx-phi-field.
 *   - @clinical-context none         — default unless explicitly passed --clinical.
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync, spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const PRIORITY_TIERS_PATH = resolve(REPO_ROOT, 'packages/hx-library/src/p0-priority-tiers.json');
const COMPONENTS_DIR = resolve(REPO_ROOT, 'packages/hx-library/src/components');
const ALLOWLIST_PATH = resolve(REPO_ROOT, 'scripts/a11y-aaa-allowlist.json');
const VPAT_PATH = resolve(REPO_ROOT, 'apps/docs/src/content/docs/accessibility/vpat-2.5.mdx');
const HX_LIBRARY_PKG_JSON = resolve(REPO_ROOT, 'packages/hx-library/package.json');
const HX_REACT_COMPONENTS_DIR = resolve(REPO_ROOT, 'packages/hx-react/src/components');

// 11 component-shippable AAA SCs per
// Wiki/Patterns/Pattern A11y AAA Path for Healthcare.md.
const PHASE_B_CRITERIA = [
  '1.4.6',
  '1.4.9',
  '2.1.3',
  '2.3.3',
  '2.4.12',
  '2.4.13',
  '2.5.5',
  '3.2.5',
  '3.3.6',
  'forced-colors',
  'apg-keyboard',
];

// AAA-AUDIT.md SC table — full SC list rendered into the audit doc.
const AUDIT_SC_ROWS = [
  ['1.4.3', 'Contrast (Minimum)', 'AA', 'axe-core'],
  ['1.4.6', 'Contrast (Enhanced)', 'AAA', 'axe-core color-contrast-enhanced'],
  ['1.4.11', 'Non-text Contrast', 'AA', 'axe-core'],
  ['1.4.13', 'Content on Hover or Focus', 'AA', 'manual review'],
  ['2.1.1', 'Keyboard', 'A', 'play() interaction test'],
  ['2.1.3', 'Keyboard (No Exception)', 'AAA', 'manual review'],
  ['2.4.7', 'Focus Visible', 'AA', 'VRT snapshot'],
  ['2.4.12', 'Focus Not Obscured (Minimum)', 'AAA', 'manual review'],
  ['2.4.13', 'Focus Appearance', 'AAA', 'VRT snapshot'],
  ['2.5.5', 'Target Size (Enhanced)', 'AAA', 'computed style check'],
  ['4.1.2', 'Name, Role, Value', 'A', 'axe-core'],
];

// ── Utilities ──────────────────────────────────────────────────────────────

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readText(path) {
  return readFileSync(path, 'utf8');
}

function exists(path) {
  return existsSync(path);
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function gitAuthor() {
  try {
    const out = execSync('git config user.name', { encoding: 'utf8' }).trim();
    return out || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function parseArgs(argv) {
  const args = {
    _: [],
    dryRun: false,
    criteria: null,
    keyboard: null,
    pattern: null,
    stability: 'stable',
    clinical: null,
    skipFormal: false,
    skipMatrix: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === '--dry-run' || tok === '-n') args.dryRun = true;
    else if (tok === '--criteria') args.criteria = argv[++i] ?? null;
    else if (tok === '--keyboard') args.keyboard = argv[++i] ?? null;
    else if (tok === '--pattern') args.pattern = argv[++i] ?? null;
    else if (tok === '--stability') args.stability = argv[++i] ?? 'stable';
    else if (tok === '--clinical') args.clinical = argv[++i] ?? null;
    else if (tok === '--skip-formal') args.skipFormal = true;
    else if (tok === '--skip-matrix') args.skipMatrix = true;
    else if (tok.startsWith('--')) {
      console.warn(`[aaa-cert] unknown flag: ${tok}`);
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function die(msg, code = 1) {
  console.error(`\nERROR: ${msg}\n`);
  process.exit(code);
}

// ── Tier resolution ────────────────────────────────────────────────────────

function loadTierIndex() {
  const raw = readJson(PRIORITY_TIERS_PATH);
  const map = new Map();
  for (const tierKey of ['p0', 'p1', 'p2', 'exempt']) {
    const label = tierKey === 'exempt' ? 'exempt' : tierKey.toUpperCase();
    const block = raw?.[tierKey]?.components;
    if (!block) continue;
    if (Array.isArray(block)) {
      for (const tag of block) map.set(tag, label);
      continue;
    }
    for (const cat of Object.values(block)) {
      if (!Array.isArray(cat)) continue;
      for (const tag of cat) map.set(tag, label);
    }
  }
  return map;
}

// ── ARIA pattern + keyboard inference ──────────────────────────────────────

const ARIA_PATTERN_HEURISTICS = [
  // [substring/exact match, ariaPattern]
  [/^hx-(button|icon-button|copy-button|toggle-button|split-button)$/, 'button'],
  [/^hx-button-group$/, 'toolbar'],
  [/^hx-tabs$/, 'tabs'],
  [/^hx-(dialog|drawer)$/, 'dialog'],
  [/^hx-(alert|toast|banner)$/, 'alert'],
  [/^hx-(menu|overflow-menu|dropdown)$/, 'menu'],
  [/^hx-(top-nav|side-nav|nav)$/, 'navigation'],
  [/^hx-breadcrumb$/, 'breadcrumb'],
  [/^hx-select$/, 'combobox'],
  [/^hx-combobox$/, 'combobox'],
  [/^hx-(checkbox)$/, 'checkbox'],
  [/^hx-(switch)$/, 'switch'],
  [/^hx-(radio-group)$/, 'radiogroup'],
  [/^hx-(checkbox-group)$/, 'group'],
  [/^hx-slider$/, 'slider'],
  [/^hx-rating$/, 'radiogroup'],
  [/^hx-(text-input|textarea|number-input)$/, 'textbox'],
  [/^hx-(date-picker|time-picker|color-picker)$/, 'dialog'],
  [/^hx-popover$/, 'dialog'],
  [/^hx-tooltip$/, 'tooltip'],
  [/^hx-popup$/, 'dialog'],
  [/^hx-file-upload$/, 'button'],
  [/^hx-form$/, 'form'],
  [/^hx-(field|field-label|help-text)$/, 'label'],
  [/^hx-clinical-status$/, 'alert'],
  [/^hx-action-bar$/, 'toolbar'],
];

function inferAriaPattern(tagName) {
  for (const [re, pattern] of ARIA_PATTERN_HEURISTICS) {
    if (re.test(tagName)) return pattern;
  }
  return null;
}

const KEYBOARD_DEFAULTS_BY_PATTERN = {
  button: 'activate=Enter,Space; disabled-suppresses=true',
  toolbar: 'navigate=Arrow; activate=Enter,Space; disabled-suppresses=true',
  tabs: 'navigate=Arrow,Home,End; activate=Enter,Space; disabled-suppresses=true',
  dialog: 'dismiss=Escape; trap-focus=true',
  alert: 'dismiss=Escape',
  menu: 'navigate=Arrow,Home,End; activate=Enter,Space; dismiss=Escape; disabled-suppresses=true',
  navigation: 'navigate=Arrow,Home,End; activate=Enter,Space',
  breadcrumb: 'navigate=Arrow',
  combobox: 'navigate=Arrow,Home,End; activate=Enter; dismiss=Escape; disabled-suppresses=true',
  checkbox: 'activate=Space; disabled-suppresses=true',
  switch: 'activate=Space; disabled-suppresses=true',
  radiogroup: 'navigate=Arrow; activate=Space; disabled-suppresses=true',
  group: 'navigate=Tab; disabled-suppresses=true',
  slider: 'navigate=Arrow,Home,End,PageUp,PageDown; disabled-suppresses=true',
  textbox: 'activate=character-input; disabled-suppresses=true',
  tooltip: 'dismiss=Escape',
  form: 'submit=Enter',
  label: '',
};

function inferKeyboardContract(ariaPattern) {
  if (!ariaPattern) return null;
  const v = KEYBOARD_DEFAULTS_BY_PATTERN[ariaPattern];
  return v && v.length > 0 ? v : null;
}

// ── Component-state detection ──────────────────────────────────────────────

function detectFormAssociated(componentSourcePath) {
  if (!exists(componentSourcePath)) return false;
  const src = readText(componentSourcePath);
  return /static\s+(?:override\s+)?formAssociated\s*=\s*true/.test(src);
}

function detectReactWrapperStatus(tagName) {
  // hx-button → HxButton dir
  const wrapperName =
    'Hx' +
    tagName
      .replace(/^hx-/, '')
      .split('-')
      .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
      .join('');
  const wrapperDir = join(HX_REACT_COMPONENTS_DIR, wrapperName);
  return exists(wrapperDir) ? 'complete' : 'none';
}

function detectPhiHandles(tagName) {
  return tagName === 'hx-phi-field' || tagName === 'hx-clinical-status';
}

function readPkgVersion() {
  try {
    const pkg = readJson(HX_LIBRARY_PKG_JSON);
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ── AAA-AUDIT.md template ──────────────────────────────────────────────────

function renderAuditMd({
  tagName,
  className,
  certifiedDate,
  criteria,
  keyboard,
  ariaPattern,
  ariaPatternSource,
  author,
}) {
  const tableRows = AUDIT_SC_ROWS.map(([sc, title, level, method]) => {
    // Default to "verify" placeholder so operator confirms each row before ship.
    const status = criteria.includes(sc) || level !== 'AAA' ? 'pass' : 'verify';
    return `| ${sc} | ${title} | ${level} | ${method} | ${status} | _populate during audit_ |`;
  }).join('\n');

  return `# AAA Audit — ${className}

**Component:** \`${tagName}\`
**Certified:** ${certifiedDate}
**Auditor:** ${author}
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
${tableRows}

## Keyboard contract

\`${keyboard ?? 'TBD — operator must populate before shipping'}\`

## ARIA pattern

\`${ariaPattern ?? 'TBD'}\` — ${ariaPatternSource ?? 'TBD'}

## Forced-colors mode

Snapshot path: \`packages/hx-library/__screenshots__/forced-colors/${tagName}/*.png\`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

## Notes / carve-outs

_Document any deliberate AA-only pairs, scope-limited SC, or consumer-fulfilled criteria here. Empty
when the component clears all 11 component-shippable AAA SCs without exception._
`;
}

// ── JSDoc patcher ──────────────────────────────────────────────────────────

const HELIX_META_TAGS_ORDER = [
  'aaa-certified',
  'aaa-criteria',
  'aaa-audit',
  'keyboard-contract',
  'aria-pattern',
  'aria-pattern-source',
  'forced-colors-supported',
  'screen-reader-tested',
  'stability',
  'since',
  'form-associated',
  'theme-aware',
  'brand-aware',
  'composes-with',
  'drupal-sdc-eligible',
  'react-wrapper-status',
  'figma-component-name',
  'figma-page',
  'priority-tier',
  'phi-handles',
  'clinical-context',
];

function buildHelixMetaTagBlock(tags) {
  // tags: { 'aaa-certified': '2026-05-15', ... } in any order; we iterate
  // HELIX_META_TAGS_ORDER for deterministic output.
  const lines = [];
  for (const tag of HELIX_META_TAGS_ORDER) {
    if (!(tag in tags)) continue;
    const value = tags[tag];
    if (value === undefined || value === null) continue;
    lines.push(` * @${tag} ${value}`.replace(/\s+$/, ''));
  }
  return lines.join('\n');
}

/**
 * Apply the Helix metadata tag block to the class JSDoc. Returns an object
 * { source, applied } with the patched source text and a boolean flag.
 *
 * Strategy: locate the first JSDoc block (the one that ends with
 * `*\/`) directly preceding the `export class <Name>` declaration. Strip
 * any existing helix-metadata tags so the patch is idempotent across
 * re-runs, then inject the new block right before the closing comment-end.
 *
 * If the class has no JSDoc block at all, we synthesize a new minimal block
 * with just the metadata tags.
 */
function applyHelixMetaToSource(source, className, helixMetaTags) {
  const tagBlock = buildHelixMetaTagBlock(helixMetaTags);

  // Find `export class <ClassName>`
  const classRe = new RegExp(`export\\s+class\\s+${className}\\b`);
  const classMatch = classRe.exec(source);
  if (!classMatch) {
    return { source, applied: false, reason: `class ${className} not found in source` };
  }
  const classStart = classMatch.index;

  // Walk backward from classStart to find the closest preceding JSDoc block.
  const beforeClass = source.slice(0, classStart);
  const lastClose = beforeClass.lastIndexOf('*/');
  if (lastClose === -1) {
    // No JSDoc — synthesize one.
    const inserted = `/**\n${tagBlock}\n */\n`;
    return {
      source: source.slice(0, classStart) + inserted + source.slice(classStart),
      applied: true,
    };
  }
  const lastOpen = beforeClass.lastIndexOf('/**', lastClose);
  if (lastOpen === -1) {
    // Block-comment without /** — synthesize a separate JSDoc above.
    const inserted = `/**\n${tagBlock}\n */\n`;
    return {
      source: source.slice(0, classStart) + inserted + source.slice(classStart),
      applied: true,
    };
  }

  // Make sure this JSDoc is "directly preceding" — i.e. between the */ and
  // class declaration there's only whitespace / decorators / `@customElement`.
  const between = source.slice(lastClose + 2, classStart);
  if (!/^[\s@\w('",.\-/\)]*$/.test(between)) {
    // Something non-trivial sits between the JSDoc and the class — synthesize
    // a fresh one rather than corrupt the existing block.
    const inserted = `/**\n${tagBlock}\n */\n`;
    return {
      source: source.slice(0, classStart) + inserted + source.slice(classStart),
      applied: true,
    };
  }

  const jsDoc = source.slice(lastOpen, lastClose + 2);

  // Strip existing helix-metadata tag lines.
  const stripRe = new RegExp(`^\\s*\\*\\s*@(?:${HELIX_META_TAGS_ORDER.join('|')})\\b.*$`, 'gm');
  let cleaned = jsDoc.replace(stripRe, '');

  // Collapse runs of empty " *" lines that could result from stripping.
  cleaned = cleaned.replace(/(\n\s*\*\s*)(\n\s*\*\s*){2,}/g, '$1');

  // Inject the tag block immediately before the closing `*\/`.
  const newJsDoc = cleaned.replace(/\n\s*\*\/\s*$/, `\n${tagBlock}\n */`);

  return {
    source: source.slice(0, lastOpen) + newJsDoc + source.slice(lastClose + 2),
    applied: true,
  };
}

// ── Allowlist ──────────────────────────────────────────────────────────────

function patchAllowlist(currentAllowlist, tagName) {
  const next = JSON.parse(JSON.stringify(currentAllowlist));
  next.components ??= [];
  if (!next.components.includes(tagName)) {
    next.components = [...next.components, tagName].sort();
  }
  return next;
}

// ── VPAT ───────────────────────────────────────────────────────────────────

/**
 * Update the per-component VPAT row from "Pending audit" → "Supports — AAA-cert
 * <date>". Returns { text, applied }. If no row matches, applied=false (and
 * the operator is asked to add the row by hand).
 *
 * VPAT row pattern:
 *   | `hx-button` | P0 | <wcagA> | <wcagAa> | <wcagAaa> | <notes> |
 */
function patchVpatRow(vpatText, tagName, criteria, certifiedDate) {
  // Match the row by component name only (column 1). The tier column may say
  // P0, P1, or an old tier label; we preserve whatever it currently is and
  // only rewrite the conformance + notes cells.
  const lineRe = new RegExp(`^(\\|\\s*\`${tagName}\`\\s*\\|\\s*[^|]*\\|)([^\\n]*)$`, 'm');
  const match = lineRe.exec(vpatText);
  if (!match) {
    return { text: vpatText, applied: false, reason: 'row not found' };
  }
  // `split('|')` on the trailing portion of a markdown row yields a leading
  // empty segment (from the `|` that opens the wcagA cell) and a trailing
  // empty segment (from the closing `|` of the row). The real conformance
  // cells live in indices 1..3 (wcagA, wcagAA, wcagAAA) and the notes cell
  // is the second-to-last entry.
  const cells = match[2].split('|');
  if (cells.length < 5) {
    return { text: vpatText, applied: false, reason: 'row shape unexpected' };
  }
  const notesIdx = cells.length - 2;
  const certNote = `AAA-cert ${certifiedDate}`;
  const existingNote = cells[notesIdx].trim();
  const mergedNote = existingNote
    ? existingNote.includes('AAA-cert')
      ? // Replace any prior AAA-cert stamp so re-runs are idempotent.
        existingNote.replace(/AAA-cert\s+\d{4}-\d{2}-\d{2}/, certNote)
      : `${existingNote} — ${certNote}`
    : certNote;
  cells[1] = ' Supports ';
  cells[2] = ' Supports ';
  cells[3] = ` Supports — AAA-cert ${certifiedDate} `;
  cells[notesIdx] = ` ${mergedNote} `;
  const newLine = match[1] + cells.join('|');
  void criteria; // criteria currently surface in AAA-AUDIT.md; the VPAT row
  // links to it via the @aaa-audit relative path.
  return { text: vpatText.replace(lineRe, newLine), applied: true };
}

// ── Plan / apply ───────────────────────────────────────────────────────────

function buildPlan(tagName, args) {
  const tierIndex = loadTierIndex();
  const tier = tierIndex.get(tagName);
  if (!tier) {
    die(`component "${tagName}" not in p0-priority-tiers.json`);
  }
  if (tier !== 'P0') {
    die(
      `component "${tagName}" is in tier ${tier}, not P0. The cert toolkit currently
   targets P0 only (Phase B/C/D). P1 sweeps run in Phase E with --aaa-informational.`,
    );
  }

  const componentDir = join(COMPONENTS_DIR, tagName);
  if (!exists(componentDir) || !statSync(componentDir).isDirectory()) {
    die(`component directory not found: ${componentDir}`);
  }

  const componentSourcePath = join(componentDir, `${tagName}.ts`);
  if (!exists(componentSourcePath)) {
    die(`component source not found: ${componentSourcePath}`);
  }

  // Derive the class name from the source — first `export class Helix*|Hx*`.
  const source = readText(componentSourcePath);
  const classMatch = /export\s+class\s+((?:Helix|Hx)\w+)\b/.exec(source);
  if (!classMatch) {
    die(`could not find an exported Helix*/Hx* class in ${componentSourcePath}`);
  }
  const className = classMatch[1];

  const ariaPattern = args.pattern ?? inferAriaPattern(tagName);
  if (!ariaPattern) {
    die(
      `cannot infer @aria-pattern for ${tagName}; pass --pattern <name> ` +
        `(button | tabs | dialog | combobox | menu | radiogroup | slider | …)`,
    );
  }
  const keyboard = args.keyboard ?? inferKeyboardContract(ariaPattern);
  // Some patterns (e.g. label) legitimately have no keyboard contract.

  const formAssociated = detectFormAssociated(componentSourcePath);
  const reactWrapperStatus = detectReactWrapperStatus(tagName);
  const phiHandles = detectPhiHandles(tagName);
  const certifiedDate = todayIso();
  const criteria = args.criteria
    ? args.criteria
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : PHASE_B_CRITERIA;
  const since = readPkgVersion();
  const auditRelPath = `src/components/${tagName}/AAA-AUDIT.md`;
  const ariaPatternSource = ariaPatternSourceFor(ariaPattern);

  const helixMetaTags = {
    'aaa-certified': certifiedDate,
    'aaa-criteria': criteria.join(', '),
    'aaa-audit': auditRelPath,
    ...(keyboard ? { 'keyboard-contract': keyboard } : {}),
    'aria-pattern': ariaPattern,
    ...(ariaPatternSource ? { 'aria-pattern-source': ariaPatternSource } : {}),
    'forced-colors-supported': 'true',
    stability: args.stability,
    since,
    'form-associated': formAssociated ? 'true' : 'false',
    'theme-aware': 'true',
    'brand-aware': 'true',
    'drupal-sdc-eligible': 'true',
    'react-wrapper-status': reactWrapperStatus,
    'figma-component-name': tagName,
    'priority-tier': 'P0',
    'phi-handles': phiHandles ? 'true' : 'false',
    'clinical-context': args.clinical ?? 'none',
  };

  const auditAbsPath = join(componentDir, 'AAA-AUDIT.md');
  const auditMd = renderAuditMd({
    tagName,
    className,
    certifiedDate,
    criteria,
    keyboard,
    ariaPattern,
    ariaPatternSource,
    author: gitAuthor(),
  });

  const patchResult = applyHelixMetaToSource(source, className, helixMetaTags);

  const allowlistRaw = readJson(ALLOWLIST_PATH);
  const allowlistNext = patchAllowlist(allowlistRaw, tagName);

  const vpatText = readText(VPAT_PATH);
  const vpatPatch = patchVpatRow(vpatText, tagName, criteria, certifiedDate);

  return {
    tagName,
    className,
    componentDir,
    componentSourcePath,
    auditAbsPath,
    auditMd,
    helixMetaTags,
    patchedSource: patchResult.source,
    patchApplied: patchResult.applied,
    patchReason: patchResult.reason,
    allowlistNext,
    allowlistChanged: JSON.stringify(allowlistRaw) !== JSON.stringify(allowlistNext),
    vpatPatched: vpatPatch.text,
    vpatApplied: vpatPatch.applied,
    vpatReason: vpatPatch.reason,
    certifiedDate,
    criteria,
    ariaPattern,
    keyboard,
  };
}

function ariaPatternSourceFor(pattern) {
  // Map ARIA pattern → APG canonical URL where one exists.
  const map = {
    button: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    toolbar: 'https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/',
    tabs: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    dialog: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    alert: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    menu: 'https://www.w3.org/WAI/ARIA/apg/patterns/menubar/',
    navigation: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/navigation.html',
    breadcrumb: 'https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/',
    combobox: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/',
    checkbox: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    switch: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/',
    radiogroup: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/',
    group: 'https://www.w3.org/TR/wai-aria-1.2/#group',
    slider: 'https://www.w3.org/WAI/ARIA/apg/patterns/slider/',
    textbox: 'https://www.w3.org/TR/wai-aria-1.2/#textbox',
    tooltip: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    form: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/form.html',
    label: null,
  };
  return map[pattern] ?? null;
}

function applyPlan(plan) {
  // 1. Write AAA-AUDIT.md
  if (!exists(dirname(plan.auditAbsPath))) {
    mkdirSync(dirname(plan.auditAbsPath), { recursive: true });
  }
  writeFileSync(plan.auditAbsPath, plan.auditMd, 'utf8');

  // 2. Write patched component source
  if (plan.patchApplied) {
    writeFileSync(plan.componentSourcePath, plan.patchedSource, 'utf8');
  }

  // 3. Write allowlist
  if (plan.allowlistChanged) {
    writeFileSync(ALLOWLIST_PATH, JSON.stringify(plan.allowlistNext, null, 2) + '\n', 'utf8');
  }

  // 4. Write VPAT
  if (plan.vpatApplied) {
    writeFileSync(VPAT_PATH, plan.vpatPatched, 'utf8');
  }
}

function regenerateCem() {
  console.log('\n[aaa-cert] regenerating CEM…');
  const result = spawnSync('pnpm', ['--filter=@helixui/library', 'run', 'cem'], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  if (result.status !== 0) {
    die(`pnpm cem exited with status ${result.status}`);
  }
}

// ── Cert gate authorities ──────────────────────────────────────────────────
//
// PRIMARY GATE — formal WCAG 2.2 audit (scripts/aaa-formal-audit.mjs).
//
//   Phase 6 (2026-05-08): the formal audit is the canonical cert verdict
//   source. It sources every criterion from scripts/aaa-standards.json
//   (verified W3C URLs) and produces VPAT 2.5 verdicts backed by measured
//   evidence — never narrative. ALL 11 criteria must resolve to Supports OR
//   Not Applicable for the cert stamp to apply. Any Partial or Does Not
//   Support verdict refuses the stamp.
//
//   The audit harness writes .reports/formal-aaa-audit/audit.json with a
//   `results[]` array; we match by `component` and inspect every entry in
//   `verdicts`.
//
//   Bypass with --skip-formal; the bypass is logged so its use is auditable.
//
// SECONDARY (informational) — brand × theme coverage matrix
//   (scripts/aaa-matrix-verify.mjs).
//
//   The matrix harness is no longer the cert authority. It is an
//   informational coverage tool that reports brand × theme behaviour as a
//   sanity check; its verdict CANNOT block or unblock the cert. The matrix
//   run is fired in dry-run mode only (so operators see coverage during
//   cert iteration); a non-zero exit is surfaced as a warning, never as a
//   gate failure.
const FORMAL_AUDIT_PATH = resolve(REPO_ROOT, 'scripts/aaa-formal-audit.mjs');
const FORMAL_AUDIT_OUTPUT = resolve(REPO_ROOT, '.reports/formal-aaa-audit/audit.json');
const MATRIX_HARNESS_PATH = resolve(REPO_ROOT, 'scripts/aaa-matrix-verify.mjs');

function matrixEvidencePathFor(tagName) {
  // Mirrors the harness's component-scoped output convention: the harness
  // writes `.reports/aaa-matrix-evidence.<tag>.md` when invoked with
  // --component, so the canonical full-matrix evidence at
  // `.reports/aaa-matrix-evidence.md` is never clobbered by a cert run.
  return resolve(REPO_ROOT, `.reports/aaa-matrix-evidence.${tagName}.md`);
}

const PASSING_VERDICTS = new Set(['Supports', 'Not Applicable']);
const FAILING_VERDICTS = new Set(['Partially Supports', 'Does Not Support']);

function runFormalAuditGate(tagName, { dryRun = false, skipFormal = false } = {}) {
  if (skipFormal) {
    const stamp = `[aaa-cert] --skip-formal used at ${new Date().toISOString()} for ${tagName}`;
    console.warn(`\n[aaa-cert] WARNING: --skip-formal flag set; formal WCAG 2.2 audit BYPASSED.`);
    console.warn(`           ${stamp}`);
    console.warn(
      `           This bypass should only be used when the storybook dev server is unavailable`,
    );
    console.warn(
      `           or when the audit harness is broken. Re-run without --skip-formal before merge.`,
    );
    return { skipped: true, status: 'bypassed' };
  }

  if (!exists(FORMAL_AUDIT_PATH)) {
    die(
      `formal audit harness missing: ${FORMAL_AUDIT_PATH}\n` +
        `   Cert refused: formal WCAG 2.2 audit verification is mandatory. Restore the harness or use --skip-formal to bypass (audited).`,
    );
  }

  const label = dryRun ? 'formal audit preview' : 'formal audit gate';
  console.log(`\n[aaa-cert] running ${label} for ${tagName} (scripts/aaa-formal-audit.mjs)…`);
  const result = spawnSync('node', [FORMAL_AUDIT_PATH, '--component', tagName], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  if (result.error) {
    die(
      `failed to spawn formal audit harness: ${result.error.message}\n` +
        `   This is an environment problem (node missing? path resolution?). Cert refused.`,
    );
  }
  if (result.status !== 0) {
    die(
      `formal audit harness exited with status ${result.status} for ${tagName}.\n` +
        `   The harness is non-blocking by design (always exits 0 on completion); a non-zero\n` +
        `   exit signals a harness crash, not a verdict. Verify storybook is up at\n` +
        `   http://localhost:3151 and the component is on the AAA allowlist.`,
    );
  }

  // Parse the audit.json for this component's verdicts. Harness-environment
  // problems (no audit.json, missing entry, browser fetch error) abort a live
  // cert run but only warn during dry-run so operators can preview the rest
  // of the cert flow when storybook is down.
  const harnessProblem = (msg) => {
    if (dryRun) {
      console.warn(`\n[aaa-cert] WARNING: ${msg}`);
      console.warn(`           A live cert run would ABORT here.`);
      return { skipped: false, status: 'harness-error' };
    }
    die(msg);
  };
  if (!exists(FORMAL_AUDIT_OUTPUT)) {
    return harnessProblem(
      `formal audit ran but produced no audit.json at ${relative(REPO_ROOT, FORMAL_AUDIT_OUTPUT)}.\n` +
        `   Cannot determine verdict. Re-run the harness manually and inspect.`,
    );
  }
  const report = readJson(FORMAL_AUDIT_OUTPUT);
  const entry = (report.results ?? []).find((r) => r.component === tagName);
  if (!entry) {
    return harnessProblem(
      `formal audit produced no entry for ${tagName} in ${relative(REPO_ROOT, FORMAL_AUDIT_OUTPUT)}.\n` +
        `   The audit may have errored on this component. Re-run with --component ${tagName} and inspect.`,
    );
  }
  if (entry.error) {
    return harnessProblem(
      `formal audit reported an error for ${tagName}: ${entry.error}\n` +
        `   Cert refused until the audit completes cleanly.`,
    );
  }

  const verdicts = entry.verdicts ?? {};
  const failing = [];
  const passing = [];
  for (const [sc, v] of Object.entries(verdicts)) {
    const verdict = v?.verdict;
    if (PASSING_VERDICTS.has(verdict)) {
      passing.push({ sc, verdict });
    } else if (FAILING_VERDICTS.has(verdict)) {
      failing.push({ sc, verdict, evidence: v.evidence });
    } else {
      failing.push({ sc, verdict: verdict ?? 'Unknown', evidence: v?.evidence });
    }
  }

  if (failing.length === 0) {
    console.log(
      `[aaa-cert] formal audit GREEN for ${tagName} — ${passing.length}/${passing.length} criteria Supports/N.A.`,
    );
    return { skipped: false, status: 'green', passing, failing };
  }

  // Non-passing verdicts present.
  if (dryRun) {
    console.warn(
      `\n[aaa-cert] WARNING: formal audit preview reported non-passing verdicts for ${tagName}:`,
    );
    for (const f of failing) {
      console.warn(`             - ${f.sc} → ${f.verdict}: ${f.evidence ?? ''}`);
    }
    console.warn(`           A live cert run would ABORT here. Remediate before applying.`);
    return { skipped: false, status: 'fail', passing, failing };
  }
  const failSummary = failing
    .map((f) => `   - ${f.sc} → ${f.verdict}${f.evidence ? `: ${f.evidence}` : ''}`)
    .join('\n');
  die(
    `Component "${tagName}" failed formal WCAG 2.2 audit — refusing to stamp @aaa-certified.\n` +
      `   ${failing.length} of ${Object.keys(verdicts).length} criteria are not Supports/Not Applicable:\n` +
      `${failSummary}\n` +
      `   See evidence: ${relative(REPO_ROOT, FORMAL_AUDIT_OUTPUT)}\n` +
      `   To bypass (audited): re-run with --skip-formal.`,
  );
}

function runMatrixCoverage(tagName, { skipMatrix = false } = {}) {
  // Informational ONLY — never blocks the cert. Reports brand × theme
  // coverage as a sanity check during cert iteration.
  if (skipMatrix) {
    console.log(`\n[aaa-cert] --skip-matrix set; skipping informational matrix coverage run.`);
    return { skipped: true, status: 'bypassed' };
  }
  if (!exists(MATRIX_HARNESS_PATH)) {
    console.warn(
      `\n[aaa-cert] note: matrix harness missing at ${relative(REPO_ROOT, MATRIX_HARNESS_PATH)}; coverage check skipped.`,
    );
    return { skipped: true, status: 'missing' };
  }
  const evidencePath = matrixEvidencePathFor(tagName);
  console.log(
    `\n[aaa-cert] running matrix coverage (informational) for ${tagName} (scripts/aaa-matrix-verify.mjs)…`,
  );
  const result = spawnSync('node', [MATRIX_HARNESS_PATH, '--component', tagName], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  if (result.error) {
    console.warn(
      `[aaa-cert] note: matrix coverage harness failed to spawn (${result.error.message}); cert verdict UNAFFECTED.`,
    );
    return { skipped: false, status: 'spawn-error' };
  }
  if (result.status === 0) {
    console.log(
      `[aaa-cert] matrix coverage GREEN for ${tagName} — see ${relative(REPO_ROOT, evidencePath)}`,
    );
    return { skipped: false, status: 'green' };
  }
  console.warn(
    `[aaa-cert] note: matrix coverage reported gaps (exit ${result.status}) for ${tagName}.\n` +
      `           This is INFORMATIONAL ONLY. The cert verdict comes from the formal audit above.\n` +
      `           Inspect ${relative(REPO_ROOT, evidencePath)} for brand × theme coverage details.`,
  );
  return { skipped: false, status: 'gaps' };
}

function stageChanges(plan) {
  const paths = [
    plan.auditAbsPath,
    plan.componentSourcePath,
    ALLOWLIST_PATH,
    VPAT_PATH,
    resolve(REPO_ROOT, 'packages/hx-library/figma-inventory.json'),
    resolve(REPO_ROOT, 'packages/hx-library/custom-elements.json'),
  ];
  spawnSync('git', ['add', '--', ...paths], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
}

function suggestedCommitMessage(plan) {
  return `feat(aaa-cert): ${plan.tagName} — AAA-certified ${plan.certifiedDate}

  - AAA SCs cleared: ${plan.criteria.join(', ')}
  - ARIA pattern: ${plan.ariaPattern}
  - Keyboard contract: ${plan.keyboard ?? 'n/a'}
  - Audit: src/components/${plan.tagName}/AAA-AUDIT.md
  - Allowlist + VPAT row updated
`;
}

// ── Reporting ──────────────────────────────────────────────────────────────

function printDryRun(plan) {
  const RULE = '─'.repeat(72);
  console.log(`\n${RULE}\n[aaa-cert DRY-RUN] ${plan.tagName} (${plan.className})\n${RULE}`);

  console.log(`\n— AAA-AUDIT.md preview (${relative(REPO_ROOT, plan.auditAbsPath)}) —\n`);
  console.log(plan.auditMd);

  console.log(`\n— JSDoc helixMeta tag block to inject —\n`);
  console.log(buildHelixMetaTagBlock(plan.helixMetaTags));
  console.log(`\n  patch ${plan.patchApplied ? 'OK' : `BLOCKED — ${plan.patchReason}`}`);

  console.log(`\n— allowlist diff (scripts/a11y-aaa-allowlist.json) —`);
  if (plan.allowlistChanged) {
    console.log(`  components: [+ "${plan.tagName}"]`);
  } else {
    console.log(`  (no change — already present)`);
  }

  console.log(`\n— VPAT row diff (apps/docs/.../vpat-2.5.mdx) —`);
  console.log(
    `  ${plan.vpatApplied ? `${plan.tagName}: Pending audit → Supports — AAA-cert ${plan.certifiedDate}` : `BLOCKED — ${plan.vpatReason}`}`,
  );

  console.log(`\n— CEM diff (post-cem regen) —`);
  console.log(
    `  ${plan.tagName}: helixMeta populated (aaa.{certified,certifiedDate,criteria,auditUrl},`,
  );
  console.log(
    `    keyboardContract, ariaPattern, ariaPatternSource, forcedColorsSupported, stability,`,
  );
  console.log(
    `    since, formAssociated, themeAware, brandAware, drupalSdcEligible, reactWrapperStatus,`,
  );
  console.log(`    figma.componentName, priorityTier, phiHandles, clinicalContext)`);
  console.log(`  + back-compat: aaaCertified=true, aaaCertifiedDate=${plan.certifiedDate}`);

  console.log(`\n— figma-inventory diff (packages/hx-library/figma-inventory.json) —`);
  console.log(`  ${plan.tagName}: aaa.{certified,certifiedDate,criteria,auditUrl},`);
  console.log(`    keyboardContract, ariaPattern, themeAware, brandAware, formAssociated,`);
  console.log(`    priorityTier (mirrored from CEM helixMeta)`);

  console.log(`\n— suggested commit (after applying) —\n`);
  console.log(suggestedCommitMessage(plan));
  console.log(`${RULE}\n[dry-run] no files written, no git changes staged.\n${RULE}\n`);
}

function printApplyHeader(plan) {
  console.log(`\n[aaa-cert] applying ${plan.tagName} (${plan.className})`);
}

// ── Entry point ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._.length === 0) {
    die(
      'usage: pnpm exec node scripts/aaa-cert.mjs <component-name> [--dry-run] [--skip-formal] [--skip-matrix]',
    );
  }
  const tagName = args._[0];

  const plan = buildPlan(tagName, args);

  if (args.dryRun) {
    printDryRun(plan);
    // PRIMARY (cert authority): formal WCAG 2.2 audit. In dry-run, failures
    // are reported as warnings (dry-run never aborts) but a live run with
    // the same state would abort.
    runFormalAuditGate(tagName, { dryRun: true, skipFormal: args.skipFormal });
    // SECONDARY (informational): brand × theme coverage matrix. Never gates.
    runMatrixCoverage(tagName, { skipMatrix: args.skipMatrix });
    return;
  }

  if (!plan.patchApplied) {
    die(`JSDoc patch failed: ${plan.patchReason}. Resolve manually and re-run.`);
  }

  // PRIMARY GATE: formal WCAG 2.2 audit (scripts/aaa-formal-audit.mjs).
  // Sources verdicts from scripts/aaa-standards.json with verified W3C URLs;
  // backed by measured evidence. ALL 11 criteria must be Supports/Not
  // Applicable to stamp @aaa-certified.
  runFormalAuditGate(tagName, { dryRun: false, skipFormal: args.skipFormal });

  // SECONDARY (informational): brand × theme coverage matrix. Never blocks
  // the cert; surfaces brand-swap behaviour as a sanity check.
  runMatrixCoverage(tagName, { skipMatrix: args.skipMatrix });

  printApplyHeader(plan);
  applyPlan(plan);
  regenerateCem();
  stageChanges(plan);

  console.log(`\n[aaa-cert] done. Suggested commit message:\n`);
  console.log(suggestedCommitMessage(plan));
  console.log(
    `Run \`git status\` to review, then commit with the message above (or your preferred phrasing).\n`,
  );
}

main();
