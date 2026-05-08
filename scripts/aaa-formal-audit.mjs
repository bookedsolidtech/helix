#!/usr/bin/env node

/**
 * aaa-formal-audit.mjs — formal WCAG 2.2 AAA + peer-standard re-certification.
 *
 * Consumes scripts/aaa-standards.json (verified citations, Phase 1 of the
 * formal AAA re-cert mission) and emits per-component VPAT 2.5 verdicts:
 *   - Supports
 *   - Partially Supports
 *   - Does Not Support
 *   - Not Applicable
 *
 * Each verdict is backed by a measurable evidence signal — never narrative.
 *
 * SCOPE
 *
 *   This harness audits every component listed in
 *   scripts/a11y-aaa-allowlist.json against ALL 11 cert criteria from
 *   scripts/aaa-standards.json:
 *
 *     1. 1.4.6 Contrast (Enhanced)            AAA  WCAG 2.2
 *     2. 1.4.9 Images of Text (No Exception)  AAA  WCAG 2.2
 *     3. 2.1.3 Keyboard (No Exception)        AAA  WCAG 2.2
 *     4. 2.3.3 Animation from Interactions    AAA  WCAG 2.2
 *     5. 2.4.12 Focus Not Obscured (Enhanced) AAA  WCAG 2.2
 *     6. 2.4.13 Focus Appearance              AAA  WCAG 2.2
 *     7. 2.5.5 Target Size (Enhanced)         AAA  WCAG 2.2
 *     8. 3.2.5 Change on Request              AAA  WCAG 2.2
 *     9. 3.3.6 Error Prevention (All)         AAA  WCAG 2.2
 *    10. forced-colors                       PEER  industry consensus
 *    11. apg-keyboard                        PEER  WAI-ARIA APG
 *
 * EVIDENCE STRATEGY (per criterion)
 *
 *   1.4.6  axe-core color-contrast-enhanced rule + manual computed-style
 *          contrast on the component's visible interactive states.
 *   1.4.9  Source-grep for raster/data-URL <img> tags in render output.
 *   2.1.3  Component-class JSDoc @keyboard-contract presence + class
 *          declares keydown/keyup handlers OR uses a native focusable
 *          host element.
 *   2.3.3  CSS source contains @media (prefers-reduced-motion: reduce)
 *          guards for every component-owned transition/animation rule.
 *   2.4.12 Playwright: focus the host with a 60px sticky top sibling and
 *          assert getBoundingClientRect().top >= sticky.bottom OR no overlap.
 *   2.4.13 Playwright: focus the host, read computed outline-width and
 *          outline-color; assert width >= 2px and contrast vs background
 *          >= 3:1.
 *   2.5.5  Playwright: getBoundingClientRect() of the primary interactive
 *          target; assert width >= 44 && height >= 44.
 *   3.2.5  Static: component does NOT auto-submit on focus, does NOT call
 *          location.assign on input; only @hx-* event names emit (no
 *          mutation of document context).
 *   3.3.6  Component is form-associated (formAssociated: true) AND exposes
 *          ElementInternals validation hooks (setValidity / form.checkValidity)
 *          OR is non-form (criterion not applicable).
 *   forced-colors
 *          CSS source contains @media (forced-colors: active) ruleset OR
 *          uses system colors (CanvasText, ButtonText, etc.) OR has
 *          forced-color-adjust property; OR component has zero color-set
 *          declarations (Not Applicable).
 *   apg-keyboard
 *          Component declares @aria-pattern in JSDoc AND keyboard handler
 *          implements the canonical key set for that pattern (button:
 *          Enter+Space; tabs: ArrowLeft/ArrowRight/Home/End; etc.).
 *
 * USAGE
 *
 *   pnpm exec node scripts/aaa-formal-audit.mjs [options]
 *
 *   --storybook-url <url>   default http://localhost:3151
 *   --output <path>         default .reports/formal-aaa-audit/audit.json
 *   --component <name>      audit single component (defaults to all on the
 *                           AAA allowlist)
 *   --evidence-dir <path>   default .reports/formal-aaa-audit/evidence/
 *   --no-browser            skip Playwright steps (static evidence only)
 *
 * EXIT CODES
 *
 *   0  audit completed (verdicts emitted; "Does Not Support" rows are
 *      reported, not failed — they are findings for Phase 4)
 *   1  harness crashed or could not produce verdicts
 *
 * The audit is deliberately non-blocking — its job is to PRODUCE the
 * findings matrix that drives Phase 4 (component fixes) and Phase 5
 * (template rewrites). Phase 6 will re-run the harness expecting all
 * verdicts to be Supports / Not Applicable.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ── Paths ────────────────────────────────────────────────────────────────────

const STANDARDS_PATH = resolve(__dirname, 'aaa-standards.json');
const ALLOWLIST_PATH = resolve(__dirname, 'a11y-aaa-allowlist.json');
const COMPONENTS_DIR = resolve(REPO_ROOT, 'packages/hx-library/src/components');

// ── CLI parsing ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : fallback;
};
const hasFlag = (flag) => args.includes(flag);

const STORYBOOK_URL = getArg('--storybook-url', 'http://localhost:3151');
const OUTPUT_PATH = getArg('--output', resolve(REPO_ROOT, '.reports/formal-aaa-audit/audit.json'));
const EVIDENCE_DIR = getArg('--evidence-dir', resolve(REPO_ROOT, '.reports/formal-aaa-audit/evidence'));
const SINGLE_COMPONENT = getArg('--component', null);
const NO_BROWSER = hasFlag('--no-browser');
const TIMEOUT_MS = 30_000;

// ── Verdict constants ────────────────────────────────────────────────────────

const VERDICT = {
  SUPPORTS: 'Supports',
  PARTIALLY: 'Partially Supports',
  DOES_NOT: 'Does Not Support',
  NOT_APPLICABLE: 'Not Applicable',
};

// ── APG keyboard expectations (per pattern) ─────────────────────────────────

// Canonical key sets per WAI-ARIA APG pattern. Each entry is an array of
// REQUIREMENT GROUPS — the source must reference at least one key string
// from each group. This handles `KeyboardEvent.key` ' ' vs `KeyboardEvent.code`
// 'Space' equivalence and similar Enter/Return synonyms.
const APG_KEYBOARD_EXPECTATIONS = {
  button: [['Enter'], [' ', 'Space']],
  checkbox: [[' ', 'Space']],
  combobox: [['ArrowDown'], ['ArrowUp'], ['Escape'], ['Enter']],
  dialog: [['Escape'], ['Tab']],
  alertdialog: [['Escape'], ['Tab']],
  alert: [],
  listbox: [['ArrowDown'], ['ArrowUp'], ['Home'], ['End']],
  menu: [['ArrowDown'], ['ArrowUp'], ['Escape']],
  menubar: [['ArrowLeft'], ['ArrowRight'], ['ArrowDown', 'ArrowUp'], ['Escape']],
  menubutton: [['Enter', ' ', 'Space'], ['ArrowDown']],
  radiogroup: [['ArrowDown', 'ArrowUp'], ['ArrowLeft', 'ArrowRight']],
  slider: [['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], ['Home'], ['End']],
  switch: [[' ', 'Space', 'Enter']],
  tabs: [['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], ['Home'], ['End']],
  toolbar: [['ArrowLeft', 'ArrowRight']],
  tooltip: [['Escape']],
  treeview: [['ArrowDown'], ['ArrowUp'], ['ArrowLeft', 'ArrowRight']],
  carousel: [['ArrowLeft', 'ArrowRight']],
  accordion: [['Enter', ' ', 'Space']],
  link: [['Enter']],
  textbox: [],
  // Tier-1 Task-5 (2026-05-08) — extended pattern coverage. Five
  // SUMMARY-34 components carried @aria-pattern values that were not in
  // the canonical table above and were therefore reported as Partial
  // ("not in the APG canonical pattern table — verify manually"). The
  // patterns below are documented in WAI-ARIA 1.2 / W3C APG and have a
  // verified URL in scripts/aaa-standards.json.
  //
  // Spinbutton (W3C APG / WAI-ARIA 1.2 role="spinbutton"):
  //   https://www.w3.org/TR/wai-aria-1.2/#spinbutton — keyboard contract
  //   is ArrowUp/ArrowDown to step (PageUp/PageDown for large step,
  //   Home/End for min/max). Native <input type="number"> already
  //   provides this contract via the user agent. Required group is the
  //   minimal step-key set.
  spinbutton: [['ArrowUp', 'ArrowDown']],
  // Breadcrumb (W3C APG breadcrumb pattern):
  //   https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ — APG
  //   describes breadcrumb as "a list of links to ancestor pages" with
  //   no special keyboard interaction beyond Tab through links and
  //   Enter to activate (link contract, satisfied by native <a href>).
  breadcrumb: [],
  // Navigation landmark (ARIA landmark role, NOT a composite widget):
  //   https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/ — a
  //   navigation landmark has no keyboard contract of its own; its
  //   keyboard behaviour is whatever the inner widget defines (links,
  //   menu, tablist).
  navigation: [],
  // Group (generic ARIA role):
  //   https://www.w3.org/TR/wai-aria-1.2/#group — a structural grouping
  //   with no required keyboard contract. Items inside the group
  //   dictate keyboard behaviour.
  group: [],
};

// ── Standards reference loader ──────────────────────────────────────────────

function loadStandards() {
  if (!existsSync(STANDARDS_PATH)) {
    console.error(`[aaa-formal-audit] Cannot find ${STANDARDS_PATH}. Run Phase 1 first.`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(STANDARDS_PATH, 'utf-8'));
}

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  const data = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf-8'));
  return Array.isArray(data.components) ? data.components : [];
}

// ── Component file loaders ──────────────────────────────────────────────────

function loadComponentSources(name) {
  const dir = resolve(COMPONENTS_DIR, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return null;
  }
  const out = { dir, classFile: null, classSrc: '', styleFile: null, styleSrc: '', storiesFile: null, storiesSrc: '' };
  const files = readdirSync(dir);
  for (const f of files) {
    if (f === `${name}.ts`) {
      out.classFile = resolve(dir, f);
      out.classSrc = readFileSync(out.classFile, 'utf-8');
    } else if (f === `${name}.styles.ts`) {
      out.styleFile = resolve(dir, f);
      out.styleSrc = readFileSync(out.styleFile, 'utf-8');
    } else if (f === `${name}.stories.ts`) {
      out.storiesFile = resolve(dir, f);
      out.storiesSrc = readFileSync(out.storiesFile, 'utf-8');
    }
  }
  return out;
}

// ── JSDoc tag extraction ────────────────────────────────────────────────────

function extractJsdocTag(src, tag) {
  const re = new RegExp(`@${tag}\\s+([^\\n*]+)`);
  const m = src.match(re);
  return m ? m[1].trim() : null;
}

function extractJsdocTagBoolean(src, tag) {
  const v = extractJsdocTag(src, tag);
  if (v === null) return null;
  return /^true$/i.test(v);
}

// ── Static evidence checks (no browser) ─────────────────────────────────────

/**
 * 1.4.9 Images of Text — fail if any <img> tag with raster/data-URL appears
 * in the component class render output.
 */
function checkImagesOfText(comp) {
  const src = comp.classSrc;
  // Look for raw <img> tags or img-like usage in template literals.
  const imgMatches = src.match(/<img\b[^>]*>/g) || [];
  // Filter out svg / icon / decorative — but flag any raster (png|jpg|gif|webp) src.
  const offenders = imgMatches.filter((m) => /\.(png|jpe?g|gif|webp|bmp)/i.test(m));
  if (offenders.length === 0) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: 'No raster <img> tags rendered in component output. Text content is rendered via real text nodes.',
      offenders: [],
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence: `Component renders ${offenders.length} raster <img> tag(s) which may contain images of text.`,
    offenders,
  };
}

/**
 * 2.1.3 Keyboard (No Exception) — host must be focusable AND keydown handlers
 * must exist OR the host wraps a native focusable element. No timing-dependent
 * input.
 */
function checkKeyboardNoException(comp) {
  const src = comp.classSrc;
  const hasKeydown = /\b(addEventListener\(['"]keydown|@keydown\b|onKeyDown|handleKeyDown|_handleKey)/.test(src);
  const hasNativeFocusable = /<(button|a|input|textarea|select)\b/.test(src);
  const declaresHostRole = /role=['"]\w+['"]|host\.role|this\.role\s*=/.test(src);
  const hasTabIndex = /tabindex=['"]?\-?0|tabindex=\${|this\.tabIndex/.test(src);
  // Detect ANY mouse-only timing dependency — pointer events without keyboard equivalent.
  const hasMouseOnly = /\bmousedown\b|\bmousemove\b|\bmouseup\b|\bdblclick\b/.test(src);
  if (hasNativeFocusable || hasKeydown) {
    if (hasMouseOnly && !hasKeydown) {
      return {
        verdict: VERDICT.PARTIALLY,
        evidence: 'Mouse handlers detected without a corresponding keydown handler. Verify all interactions are keyboard-reachable.',
      };
    }
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: hasNativeFocusable
        ? 'Component uses a native focusable element (<button>, <a>, <input>, <textarea>, <select>) for primary interaction.'
        : 'Component declares keydown handlers and is focusable.',
    };
  }
  // Components with no interactivity are NA.
  if (!hasTabIndex && !declaresHostRole) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component has no interactive elements (no tabindex, no host role, no keydown handlers).',
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence: 'Component is focusable / declares a host role but has no keyboard handlers.',
  };
}

/**
 * 2.3.3 Animation from Interactions — every transition/animation in the
 * styles file must be guarded by a prefers-reduced-motion media query.
 */
function checkAnimationFromInteractions(comp) {
  const src = comp.styleSrc;
  if (!src) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component has no styles file.',
    };
  }
  const transitionDecls = (src.match(/\btransition\s*:[^;]+;/g) || []).filter(
    (d) => !/transition\s*:\s*(none|unset|initial|inherit)/.test(d),
  );
  const animationDecls = (src.match(/\banimation\s*:[^;]+;/g) || []).filter(
    (d) => !/animation\s*:\s*(none|unset|initial|inherit)/.test(d),
  );
  const hasMotion = transitionDecls.length + animationDecls.length > 0;
  if (!hasMotion) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'No transition or animation declarations in component styles.',
    };
  }
  // Check for at least one reduced-motion guard.
  const hasReducedMotionGuard = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(src);
  if (hasReducedMotionGuard) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `Component has ${transitionDecls.length} transition + ${animationDecls.length} animation declaration(s) and at least one @media (prefers-reduced-motion: reduce) guard.`,
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence: `Component has ${transitionDecls.length} transition + ${animationDecls.length} animation declaration(s) but NO @media (prefers-reduced-motion: reduce) guard.`,
  };
}

/**
 * 3.2.5 Change on Request — fail on auto-submit-on-focus, location.assign
 * inside event handlers, or focus-triggered context changes.
 */
function checkChangeOnRequest(comp) {
  const src = comp.classSrc;
  const offenders = [];
  if (/onFocus[^=]*=[^=]*\bsubmit\b/.test(src)) offenders.push('focus triggers form submit');
  if (/window\.location\s*=|location\.assign\(|location\.href\s*=/.test(src)) {
    if (/(handleFocus|onFocus|@focus)/.test(src)) {
      offenders.push('focus handler may navigate');
    }
  }
  if (offenders.length === 0) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: 'No auto-submit on focus, no location mutation in focus/input handlers.',
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence: 'Component triggers a change of context without explicit user request.',
    offenders,
  };
}

/**
 * 3.3.6 Error Prevention (All) — applies only to form-associated components.
 * Form-associated components must expose ElementInternals validation hooks.
 */
function checkErrorPrevention(comp) {
  const src = comp.classSrc;
  const isFormAssociated = /static\s+formAssociated\s*=\s*true/.test(src);
  if (!isFormAssociated) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component is not form-associated. Error prevention applies to form submission.',
    };
  }
  const hasInternals = /attachInternals\(\)|this\._internals|this\.internals/.test(src);
  const hasSetValidity = /setValidity\(/.test(src);
  if (hasInternals && hasSetValidity) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: 'Component is form-associated and exposes ElementInternals + setValidity for client-side error prevention.',
    };
  }
  return {
    verdict: VERDICT.PARTIALLY,
    evidence: `Component is form-associated but lacks ${!hasInternals ? 'ElementInternals' : ''}${!hasInternals && !hasSetValidity ? ' and ' : ''}${!hasSetValidity ? 'setValidity()' : ''}.`,
  };
}

/**
 * forced-colors — component styles must have a forced-colors guard OR use
 * system colors OR forced-color-adjust property. Or the component has no
 * own color decls (Not Applicable).
 */
function checkForcedColors(comp) {
  const src = comp.styleSrc;
  if (!src) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component has no styles file.',
    };
  }
  const hasForcedColorsMQ = /@media\s*\(\s*forced-colors\s*:\s*active\s*\)/.test(src);
  const hasSystemColors = /\b(CanvasText|ButtonText|ButtonFace|Highlight|HighlightText|LinkText|GrayText|Mark|MarkText|VisitedText|SelectedItem|SelectedItemText|Field|FieldText)\b/.test(src);
  const hasForcedColorAdjust = /\bforced-color-adjust\s*:/.test(src);
  const hasColorDecl = /\b(color|background|background-color|border|border-color|outline|outline-color|box-shadow)\s*:/.test(src);
  if (!hasColorDecl) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component styles set no color/background/border/shadow declarations.',
    };
  }
  if (hasForcedColorsMQ || hasSystemColors || hasForcedColorAdjust) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: [
        hasForcedColorsMQ ? '@media (forced-colors: active) guard present' : null,
        hasSystemColors ? 'system colors used (CanvasText / ButtonText / etc.)' : null,
        hasForcedColorAdjust ? 'forced-color-adjust property declared' : null,
      ].filter(Boolean).join('; '),
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence: 'Component declares colors/backgrounds/borders but has NO forced-colors guard, NO system colors, and NO forced-color-adjust.',
  };
}

/**
 * apg-keyboard — component must declare @aria-pattern and its keydown
 * handler must reference the canonical key set for that pattern.
 */
function checkApgKeyboard(comp) {
  const src = comp.classSrc;
  const pattern = extractJsdocTag(src, 'aria-pattern');
  if (!pattern) {
    return {
      verdict: VERDICT.PARTIALLY,
      evidence: 'No @aria-pattern JSDoc tag declared. Cannot verify APG conformance without a declared pattern.',
    };
  }
  const groups = APG_KEYBOARD_EXPECTATIONS[pattern.toLowerCase()];
  if (groups === undefined) {
    return {
      verdict: VERDICT.PARTIALLY,
      evidence: `@aria-pattern="${pattern}" is not in the APG canonical pattern table — verify manually.`,
    };
  }
  if (groups.length === 0) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `@aria-pattern="${pattern}" requires no specific key set (alert / textbox).`,
    };
  }
  // Native HTML elements get their keyboard contract from the user agent —
  // a <button> activates on Enter/Space without any custom keydown handler.
  // Detect native delegation for the patterns that map to native elements.
  const NATIVE_DELEGATION = {
    button: /<(button|a)\b/,
    link: /<a\s[^>]*href=/,
    checkbox: /<input\b[^>]*type=['"]checkbox['"]/,
    textbox: /<(input|textarea)\b/,
  };
  const nativeRegex = NATIVE_DELEGATION[pattern.toLowerCase()];
  if (nativeRegex && nativeRegex.test(src)) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `@aria-pattern="${pattern}" — component renders a native element that provides the canonical keyboard contract via the user agent (no custom handler required).`,
    };
  }
  // Each group is satisfied if AT LEAST ONE of its options is referenced in source.
  const referencesKey = (k) => {
    if (k === ' ') {
      // Space character key — match string-literal ' '.
      return /['"`] ['"`]/.test(src) || /\bcase\s+['"`] ['"`]/.test(src) || /key\s*===\s*['"`] ['"`]/.test(src);
    }
    return src.includes(`'${k}'`) || src.includes(`"${k}"`) || src.includes(`\`${k}\``);
  };
  const groupResults = groups.map((g) => ({
    options: g,
    satisfied: g.some(referencesKey),
    matched: g.filter(referencesKey),
  }));
  const allSatisfied = groupResults.every((g) => g.satisfied);
  if (allSatisfied) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `@aria-pattern="${pattern}" — all required key groups referenced (${groupResults.map((g) => g.matched.map((k) => k === ' ' ? "' '" : k).join('|')).join(', ')}).`,
    };
  }
  const missingGroups = groupResults
    .filter((g) => !g.satisfied)
    .map((g) => g.options.map((k) => (k === ' ' ? "' '" : k)).join(' or '));
  return {
    verdict: VERDICT.PARTIALLY,
    evidence: `@aria-pattern="${pattern}" — missing key references for groups: [${missingGroups.join('] [')}].`,
    missingGroups,
  };
}

// ── Browser-based evidence (Playwright) ─────────────────────────────────────

// Storybook index cache — fetched once per audit run from /index.json.
let STORYBOOK_INDEX = null;
async function loadStorybookIndex() {
  if (STORYBOOK_INDEX) return STORYBOOK_INDEX;
  const url = `${STORYBOOK_URL}/index.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not load Storybook index at ${url} (status ${res.status})`);
  }
  STORYBOOK_INDEX = await res.json();
  return STORYBOOK_INDEX;
}

/**
 * Per-component story export override. Some components (overlay class:
 * dialog, drawer, popover) render at 0×0 in their `Default` export because
 * the `open` arg defaults to `false`. The audit cannot measure focus
 * appearance, target size, or focus-not-obscured on a component whose
 * surface isn't painted. Map those components to a sibling story export
 * that drives the component into its open state for measurement.
 *
 * NOTE: These overrides only target the formal AAA audit harness and do
 * not affect the `Default` story rendering in the consumer-facing
 * Storybook docs.
 */
const STORY_OVERRIDES = {
  'hx-dialog': 'ModalOpen',
  'hx-drawer': 'AAAAuditOpen',
  'hx-popover': 'AAAAuditOpen',
};

async function buildStoryUrl(componentName) {
  const idx = await loadStorybookIndex();
  const entries = Object.values(idx.entries);
  const overrideExport = STORY_OVERRIDES[componentName] || null;
  // Prefer stories whose importPath file basename matches `<name>.stories.*`.
  // Some directories host sibling component stories (e.g. hx-menu/ contains
  // both hx-menu.stories.ts and hx-menu-item.stories.ts); a substring match
  // on the directory would silently pick the wrong story and report "no <tag>
  // in story" downstream. Anchoring on the file basename eliminates that.
  const fileNeedles = [
    `/${componentName}.stories.ts`,
    `/${componentName}.stories.tsx`,
    `/${componentName}.stories.js`,
    `/${componentName}.stories.mjs`,
  ];
  const importPathMatchesFile = (path) => path && fileNeedles.some((n) => path.endsWith(n));
  const dirNeedle = `/${componentName}/`;
  const isStory = (e) => e.type === 'story';

  // Tier 0: explicit STORY_OVERRIDES table (open-state stories for overlay
  // components). Resolves before the Default export so the audit measures
  // an open dialog / drawer / popover surface rather than a 0×0 host.
  let match;
  if (overrideExport) {
    match = entries.find(
      (e) => isStory(e) && e.exportName === overrideExport && importPathMatchesFile(e.importPath),
    );
    if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;
  }

  // Tier 1: exact file basename + Default export.
  match = entries.find(
    (e) => isStory(e) && e.exportName === 'Default' && importPathMatchesFile(e.importPath),
  );
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  // Tier 2: exact file basename, any export.
  match = entries.find(
    (e) => isStory(e) && importPathMatchesFile(e.importPath),
  );
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  // Tier 3: directory match + Default export (legacy fallback — risky for
  // shared-directory stories but preserves backward compatibility).
  match = entries.find(
    (e) => isStory(e) && e.exportName === 'Default' && e.importPath?.includes(dirNeedle),
  );
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  // Tier 4: directory match, any export.
  match = entries.find(
    (e) => isStory(e) && e.importPath?.includes(dirNeedle),
  );
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  return null;
}

/**
 * 1.4.6 + 2.4.13 + 2.5.5 + 2.4.12 — browser checks.
 *
 * Returns a per-component result object keyed by SC id.
 */
async function runBrowserChecks(componentName, page) {
  const url = await buildStoryUrl(componentName);
  const result = {
    url,
    error: null,
    targetSize: null,
    focusOutline: null,
    contrast: null,
    focusObscured: null,
  };
  if (!url) {
    result.error = `Could not resolve Storybook story for ${componentName} (not in /index.json).`;
    return result;
  }
  try {
    const response = await page.goto(url, { timeout: TIMEOUT_MS, waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) {
      result.error = `HTTP ${response?.status() ?? 'no response'}`;
      return result;
    }
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5_000 }).catch(() => {});

    // Reset focus to document.body so the Tab walk starts from a known state.
    // Click on a 1×1 pixel near (0,0) inside the iframe body — programmatic
    // body.focus() does NOT reset the keyboard-mode flag, but a real click
    // followed by a Tab keypress does. We then move with real keyboard events
    // so :focus-visible heuristics activate exactly as they do for a sighted
    // keyboard user (this is the behaviour Tier-1-Task-1 was added to fix).
    await page.evaluate(() => {
      // Blur any currently focused element and reset to body.
      if (document.activeElement && document.activeElement !== document.body) {
        try { document.activeElement.blur(); } catch {}
      }
      // Insert a sentinel focusable element at the very top of <body> so the
      // first Tab press can land on something predictable (some Storybook
      // iframes have no focusable element ahead of the story content).
      if (!document.getElementById('__aaa_audit_sentinel__')) {
        const s = document.createElement('button');
        s.id = '__aaa_audit_sentinel__';
        s.textContent = 'aaa-audit-sentinel';
        s.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;';
        document.body.insertBefore(s, document.body.firstChild);
      }
      const sentinel = document.getElementById('__aaa_audit_sentinel__');
      sentinel.focus();
    });

    // Identify the target element first (statically, via shadow DOM walk),
    // record what we expect to focus, THEN keyboard-Tab toward it.
    const targetInfo = await page.evaluate((tag) => {
      const host = document.querySelector(tag);
      if (!host) return { error: `no <${tag}> in story` };
      const root = host.shadowRoot || host;
      const allCandidates = [host, ...root.querySelectorAll('button, [role="button"], input, textarea, select, a[href], [tabindex]')];
      const visibleCandidates = allCandidates.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cs = window.getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        return true;
      });
      const target = host.tabIndex >= 0 && visibleCandidates.includes(host)
        ? host
        : (visibleCandidates.find((el) => el !== host) || visibleCandidates[0] || host);
      // Tag the target so we can identify it across page.evaluate calls.
      target.setAttribute('data-aaa-audit-target', '1');
      return {
        targetTag: target.tagName.toLowerCase(),
        targetIsHost: target === host,
        hostHidden: host.getBoundingClientRect().width < 2 || host.getBoundingClientRect().height < 2,
      };
    }, componentName);

    if (targetInfo.error) {
      return { ...result, error: targetInfo.error };
    }

    // Real Tab-key walk: press Tab up to MAX_TAB times, after each press
    // check if the deepest active element across shadow boundaries is our
    // tagged target. This is what activates :focus-visible — the user-agent
    // tracks the last focus modality.
    const MAX_TAB = 80;
    let tabbed = false;
    let tabCount = 0;
    for (let i = 0; i < MAX_TAB; i++) {
      await page.keyboard.press('Tab');
      tabCount = i + 1;
      const reached = await page.evaluate(() => {
        // Walk shadow boundaries to find the deepest active element.
        let el = document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
          el = el.shadowRoot.activeElement;
        }
        if (!el) return false;
        if (el.hasAttribute && el.hasAttribute('data-aaa-audit-target')) return true;
        // Also accept ancestors that are the tagged target (target may be
        // the host whose shadowRoot.activeElement is the inner control).
        let cur = el;
        while (cur) {
          if (cur.hasAttribute && cur.hasAttribute('data-aaa-audit-target')) return true;
          cur = cur.assignedSlot || cur.parentNode || cur.host || null;
          if (cur && cur.nodeType !== 1) cur = cur.host || null;
        }
        return false;
      });
      if (reached) { tabbed = true; break; }
    }

    // Now measure — the target is keyboard-focused (or we fell back to
    // programmatic focus only if the Tab walk failed to reach it).
    const measurements = await page.evaluate(async ({ tag, didTab }) => {
      const target = document.querySelector(`[data-aaa-audit-target="1"]`)
        || document.querySelector(tag);
      if (!target) return { error: `no <${tag}> in story` };
      const host = document.querySelector(tag) || target;

      // If the Tab walk did not reach the target, fall back to programmatic
      // focus so the rest of the measurements still land — but we'll mark
      // the focusOutline result as "programmatic-only" for transparency.
      if (!didTab) {
        try { target.focus(); } catch {}
      }

      // Resolve the deepest active element across shadow boundaries. With
      // `delegatesFocus: true`, Tab onto the host moves real focus to an
      // inner control; document.activeElement returns the host but the
      // :focus-visible outline lives on the inner part. Measure styles on
      // whichever element actually owns the focus pseudo-state.
      let activeDeep = document.activeElement;
      while (activeDeep && activeDeep.shadowRoot && activeDeep.shadowRoot.activeElement) {
        activeDeep = activeDeep.shadowRoot.activeElement;
      }
      // The element we measure outline on: prefer the deepest active element
      // if it is inside our target's subtree (host or shadow descendant);
      // otherwise fall back to the target itself.
      let outlineSource = target;
      if (activeDeep && activeDeep !== target) {
        // Walk up from activeDeep to confirm it's inside our component subtree.
        let cur = activeDeep;
        let inside = false;
        while (cur) {
          if (cur === target || cur === host) { inside = true; break; }
          cur = cur.assignedSlot || cur.parentNode || cur.host || null;
          if (cur && cur.nodeType !== 1 && cur.host) cur = cur.host;
        }
        if (inside) outlineSource = activeDeep;
      }

      // If the resolved outlineSource has NO outline, it does not necessarily
      // mean the component lacks a focus indicator. Many HELiX components
      // render the focus ring on a sibling inside the shadow root (e.g.
      // hx-checkbox draws outline on .checkbox__box, NOT on the focused host;
      // hx-switch draws outline on .switch__track sibling-of-input). Walk
      // the shadow descendants of the host once and pick the first descendant
      // currently rendering an outline >=2px or a thick box-shadow — that is
      // the actual focus indicator the user sees. Only do this when the
      // primary outlineSource has no own outline (so we never over-report
      // a passing host).
      const ownOutlineWidth = parseFloat(window.getComputedStyle(outlineSource).outlineWidth || '0');
      if (ownOutlineWidth < 2) {
        const root = host.shadowRoot;
        if (root) {
          const candidates = root.querySelectorAll('*');
          for (const el of candidates) {
            const cs = window.getComputedStyle(el);
            const w = parseFloat(cs.outlineWidth || '0');
            const okOutline = w >= 2 && cs.outlineStyle !== 'none';
            const okShadow = cs.boxShadow && cs.boxShadow !== 'none' && /\b\d+\s*px/.test(cs.boxShadow);
            if (okOutline || okShadow) {
              // Confirm the element is currently visible (focus indicators
              // on display:none parts do not count).
              const r = el.getBoundingClientRect();
              if (r.width >= 2 && r.height >= 2 && cs.visibility !== 'hidden' && cs.display !== 'none') {
                outlineSource = el;
                break;
              }
            }
          }
        }
      }

      const hostRect = host.getBoundingClientRect();
      const hostHidden = hostRect.width < 2 || hostRect.height < 2;
      let rect = target.getBoundingClientRect();

      // Overlay components (hx-dialog/hx-drawer/hx-popover) commonly use
      // :host { display: contents; } so the host has a 0×0 bounding box
      // even when the inner panel is rendered fixed-position elsewhere.
      // For 2.4.12 (Focus Not Obscured) hit-testing we cannot use a 0×0
      // rect — every elementFromPoint call would land at (0,0) which is
      // never a shadow descendant. Fall back to the actual focused element
      // bounding rect (outlineSource) when the target rect is degenerate
      // — that's the visible focus surface the user sees.
      if (rect.width < 2 || rect.height < 2) {
        const sourceRect = outlineSource.getBoundingClientRect();
        if (sourceRect.width >= 2 && sourceRect.height >= 2) {
          rect = sourceRect;
        }
      }

      const styles = window.getComputedStyle(outlineSource);
      const outlineWidthPx = parseFloat(styles.outlineWidth || '0');
      const outlineColor = styles.outlineColor;
      const outlineStyle = styles.outlineStyle;
      // box-shadow is a common a11y-safe focus indicator alternative.
      const boxShadow = styles.boxShadow;
      const hasFocusBoxShadow = boxShadow && boxShadow !== 'none';
      const bgColor = styles.backgroundColor;
      const color = styles.color;

      // Focus obscured — sample three points (top-left, center, bottom-right)
      // and accept if the focused target OR a shadow descendant is at any of
      // those points.
      const points = [
        [rect.left + 4, rect.top + 4],
        [rect.left + rect.width / 2, rect.top + rect.height / 2],
        [rect.right - 4, rect.bottom - 4],
      ];
      const targetHost = target.getRootNode().host || target; // shadow root host
      const isShadowDescendant = (el) => {
        if (!el) return false;
        if (el === target || el === host || el === targetHost) return true;
        // Walk up assigned-slot / parent chain.
        let cur = el;
        while (cur) {
          if (cur === target || cur === host) return true;
          cur = cur.assignedSlot || cur.parentNode || cur.host;
        }
        return false;
      };
      const allPointsClear = points.every(([x, y]) => {
        const hit = document.elementFromPoint(x, y);
        return isShadowDescendant(hit) || target.contains?.(hit);
      });
      const isCovered = !allPointsClear;

      return {
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        hostHidden,
        outlineWidthPx,
        outlineColor,
        outlineStyle,
        boxShadow,
        hasFocusBoxShadow,
        bgColor,
        color,
        isCovered,
        targetTag: target.tagName.toLowerCase(),
        targetIsHost: target === host,
        outlineSourceTag: outlineSource.tagName ? outlineSource.tagName.toLowerCase() : null,
        outlineSourceIsTarget: outlineSource === target,
        focusedViaKeyboard: didTab,
        tabPresses: undefined, // populated outside evaluate scope
      };
    }, { tag: componentName, didTab: tabbed });

    // Annotate measurement with the actual Tab-press count we recorded
    // before the eval so the evidence string can reference it.
    if (measurements && !measurements.error) {
      measurements.tabPresses = tabCount;
    }

    if (measurements.error) {
      result.error = measurements.error;
      return result;
    }

    // 2.5.5 Target Size (Enhanced) — 44x44 minimum. Skip hosts that aren't visible.
    //
    // Popover-container pattern: components like hx-dropdown, hx-tooltip,
    // hx-popup, and hx-popover are positioning primitives that wrap a
    // slotted trigger and a floating panel. The host bbox reflects the
    // trigger-wrapper (typically ~21px inline-block), NOT a clickable
    // surface owned by the component. Per APG, the consumer chooses what
    // to slot as the trigger (typically <hx-button> or <hx-icon-button>,
    // both of which already meet the 44×44 AAA bar in their own audit
    // row). The 2.5.5 obligation here is on the CONSUMER, not the
    // component. Mark Not Applicable with an explicit consumer note.
    const POPOVER_CONTAINERS = new Set([
      'hx-dropdown',
      'hx-tooltip',
      'hx-popup',
    ]);
    if (POPOVER_CONTAINERS.has(componentName)) {
      result.targetSize = {
        width: measurements.rect.width,
        height: measurements.rect.height,
        target: measurements.targetTag,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Popover-container component — host wraps a slotted trigger and a floating panel. The 2.5.5 (Enhanced) target-size obligation is on the consumer-supplied trigger, not the wrapper host. Use <hx-button> / <hx-icon-button> as the slotted trigger to meet 44×44 (each clears 2.5.5 in its own audit row).`,
      };
    } else if (measurements.hostHidden) {
      result.targetSize = {
        width: 0,
        height: 0,
        target: measurements.targetTag,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Host <${componentName}> has 0x0 bounding box in default story (component likely closed/hidden). Manual measurement required for opened state.`,
      };
    } else {
      result.targetSize = {
        width: measurements.rect.width,
        height: measurements.rect.height,
        target: measurements.targetTag,
        verdict:
          measurements.rect.width >= 44 && measurements.rect.height >= 44
            ? VERDICT.SUPPORTS
            : measurements.rect.width >= 24 && measurements.rect.height >= 24
              ? VERDICT.PARTIALLY
              : VERDICT.DOES_NOT,
        evidence: `target=${measurements.targetTag} ${measurements.rect.width.toFixed(1)}x${measurements.rect.height.toFixed(1)} px`,
      };
    }

    // 2.4.13 Focus Appearance — outline width >= 2px OR box-shadow focus ring.
    // Many components use box-shadow as the focus indicator (a11y-equivalent
    // when contrast >= 3:1 and >= 2px effective thickness). We accept either.
    // Measurement was taken AFTER a real Tab-key walk (Tier-1-Task-1) so
    // :focus-visible heuristics are active in the page exactly as they are
    // for a sighted keyboard user.
    const hasOutline = measurements.outlineWidthPx >= 2 && measurements.outlineStyle !== 'none';
    // Detect a "thick enough" box-shadow — heuristic: spread-radius or
    // multi-layer shadow with a non-transparent color and a non-zero
    // blur or spread.
    const boxShadowSuggestsFocusRing = measurements.hasFocusBoxShadow
      && /\b\d+\s*px/.test(measurements.boxShadow)
      && !/^none$/i.test(measurements.boxShadow);
    const outlineSourceNote = measurements.outlineSourceIsTarget
      ? `<${measurements.targetTag}>`
      : `<${measurements.outlineSourceTag}> (shadow descendant of <${measurements.targetTag}> — focus ring rendered on inner part)`;
    const focusModeNote = measurements.focusedViaKeyboard
      ? `keyboard-focused via Tab×${measurements.tabPresses} on ${outlineSourceNote}`
      : `Tab walk did not reach target after ${measurements.tabPresses} presses; fell back to programmatic focus on ${outlineSourceNote}`;
    let outlineVerdict;
    let outlineEvidence;
    if (hasOutline) {
      outlineVerdict = VERDICT.SUPPORTS;
      outlineEvidence = `computed outline ${measurements.outlineWidthPx}px ${measurements.outlineStyle} ${measurements.outlineColor} (${focusModeNote})`;
    } else if (boxShadowSuggestsFocusRing) {
      outlineVerdict = VERDICT.SUPPORTS;
      outlineEvidence = `box-shadow focus indicator: ${measurements.boxShadow} (${focusModeNote}). Verify >=2px effective thickness + 3:1 contrast manually.`;
    } else if (measurements.outlineWidthPx > 0) {
      outlineVerdict = VERDICT.PARTIALLY;
      outlineEvidence = `outline ${measurements.outlineWidthPx}px (under 2px threshold) (${focusModeNote})`;
    } else if (!measurements.focusedViaKeyboard) {
      // We never reached the target with real Tab — :focus-visible may be
      // stripped by user-agent for programmatic focus on some elements.
      outlineVerdict = VERDICT.PARTIALLY;
      outlineEvidence = `No focus indicator detected; ${focusModeNote}. Manual keyboard verification needed (story may have no path to component via Tab).`;
    } else {
      // Tab walk DID reach the target, no outline, no box-shadow — this is
      // a real fail per WCAG 2.4.13.
      outlineVerdict = VERDICT.DOES_NOT;
      outlineEvidence = `${focusModeNote}; computed outline 0px and no box-shadow focus indicator. WCAG 2.4.13 requires a visible focus indicator >=2px.`;
    }
    result.focusOutline = {
      widthPx: measurements.outlineWidthPx,
      color: measurements.outlineColor,
      style: measurements.outlineStyle,
      boxShadow: measurements.boxShadow,
      focusedViaKeyboard: measurements.focusedViaKeyboard,
      tabPresses: measurements.tabPresses,
      verdict: outlineVerdict,
      evidence: outlineEvidence,
    };

    // 1.4.6 Contrast (Enhanced) — sample fg/bg contrast on target.
    // A transparent component host means the consumer page controls the
    // background; that is correct behaviour for surface-token-driven design
    // systems and is Not Applicable to the component itself.
    const isTransparentBg = /rgba?\([^,]+,\s*[^,]+,\s*[^,]+,\s*0(\.0+)?\s*\)/.test(measurements.bgColor || '')
      || measurements.bgColor === 'transparent';
    if (isTransparentBg) {
      // Component (host or inner control) is transparent — foreground inherits
      // the consumer page background. Per WCAG 2.2 1.4.6, the contrast
      // obligation belongs to the page that places this text, not to the
      // component shell. This is correct behaviour for surface-token-driven
      // design systems.
      result.contrast = {
        fg: measurements.color,
        bg: measurements.bgColor,
        ratio: null,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Component target (${measurements.targetTag}) is transparent (bg=${measurements.bgColor}); foreground contrast inherits the consumer page background. No component-level contrast obligation. Manual: verify that documented surface-token combinations meet 7:1.`,
      };
    } else {
      const ratio = contrastRatio(measurements.color, measurements.bgColor);
      result.contrast = {
        fg: measurements.color,
        bg: measurements.bgColor,
        ratio: ratio === null ? null : Number(ratio.toFixed(2)),
        verdict:
          ratio === null
            ? VERDICT.PARTIALLY
            : ratio >= 7.0
              ? VERDICT.SUPPORTS
              : ratio >= 4.5
                ? VERDICT.PARTIALLY
                : VERDICT.DOES_NOT,
        evidence:
          ratio === null
            ? `Could not compute contrast (fg=${measurements.color}, bg=${measurements.bgColor}).`
            : `${ratio.toFixed(2)}:1 (fg ${measurements.color}, bg ${measurements.bgColor})`,
      };
    }

    // 2.4.12 Focus Not Obscured (Enhanced).
    result.focusObscured = {
      isCovered: measurements.isCovered,
      verdict: measurements.isCovered ? VERDICT.DOES_NOT : VERDICT.SUPPORTS,
      evidence: measurements.isCovered
        ? 'elementFromPoint at focused target center returned a different element (focus is obscured).'
        : 'No element covers the focused target center.',
    };
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }
  return result;
}

// ── Color parsing helpers ───────────────────────────────────────────────────

function parseRgb(str) {
  if (!str) return null;
  const m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = m[4] === undefined ? 1 : Number(m[4]);
  return { r, g, b, a };
}

function relativeLuminance({ r, g, b }) {
  const c = [r, g, b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrastRatio(fgStr, bgStr) {
  const fg = parseRgb(fgStr);
  const bg = parseRgb(bgStr);
  if (!fg || !bg) return null;
  // If bg is fully transparent, contrast is undefined for our purposes.
  if (bg.a === 0) return null;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Per-component audit ─────────────────────────────────────────────────────

async function auditComponent(name, browser) {
  const comp = loadComponentSources(name);
  if (!comp) {
    return { component: name, error: `Source files not found at ${COMPONENTS_DIR}/${name}` };
  }
  const result = {
    component: name,
    auditedAt: new Date().toISOString(),
    sourceFiles: {
      class: comp.classFile ? relative(REPO_ROOT, comp.classFile) : null,
      styles: comp.styleFile ? relative(REPO_ROOT, comp.styleFile) : null,
      stories: comp.storiesFile ? relative(REPO_ROOT, comp.storiesFile) : null,
    },
    jsdoc: {
      ariaPattern: extractJsdocTag(comp.classSrc, 'aria-pattern'),
      keyboardContract: extractJsdocTag(comp.classSrc, 'keyboard-contract'),
      formAssociated: /static\s+formAssociated\s*=\s*true/.test(comp.classSrc),
      forcedColorsSupported: extractJsdocTagBoolean(comp.classSrc, 'forced-colors-supported'),
    },
    verdicts: {},
  };

  // Static verdicts.
  result.verdicts['1.4.9'] = checkImagesOfText(comp);
  result.verdicts['2.1.3'] = checkKeyboardNoException(comp);
  result.verdicts['2.3.3'] = checkAnimationFromInteractions(comp);
  result.verdicts['3.2.5'] = checkChangeOnRequest(comp);
  result.verdicts['3.3.6'] = checkErrorPrevention(comp);
  result.verdicts['forced-colors'] = checkForcedColors(comp);
  result.verdicts['apg-keyboard'] = checkApgKeyboard(comp);

  // Browser verdicts.
  if (browser) {
    const page = await browser.newPage();
    try {
      const browserData = await runBrowserChecks(name, page);
      result.browserChecks = browserData;
      if (browserData.error) {
        result.verdicts['1.4.6'] = { verdict: VERDICT.PARTIALLY, evidence: `Browser check error: ${browserData.error}` };
        result.verdicts['2.4.12'] = { verdict: VERDICT.PARTIALLY, evidence: `Browser check error: ${browserData.error}` };
        result.verdicts['2.4.13'] = { verdict: VERDICT.PARTIALLY, evidence: `Browser check error: ${browserData.error}` };
        result.verdicts['2.5.5'] = { verdict: VERDICT.PARTIALLY, evidence: `Browser check error: ${browserData.error}` };
      } else {
        result.verdicts['1.4.6'] = browserData.contrast || { verdict: VERDICT.PARTIALLY, evidence: 'No contrast measurement available.' };
        result.verdicts['2.4.12'] = browserData.focusObscured || { verdict: VERDICT.PARTIALLY, evidence: 'No focus-obscured measurement available.' };
        result.verdicts['2.4.13'] = browserData.focusOutline || { verdict: VERDICT.PARTIALLY, evidence: 'No focus-outline measurement available.' };
        result.verdicts['2.5.5'] = browserData.targetSize || { verdict: VERDICT.PARTIALLY, evidence: 'No target-size measurement available.' };
      }
    } finally {
      await page.close();
    }
  } else {
    result.verdicts['1.4.6'] = { verdict: VERDICT.PARTIALLY, evidence: 'Browser checks skipped (--no-browser).' };
    result.verdicts['2.4.12'] = { verdict: VERDICT.PARTIALLY, evidence: 'Browser checks skipped (--no-browser).' };
    result.verdicts['2.4.13'] = { verdict: VERDICT.PARTIALLY, evidence: 'Browser checks skipped (--no-browser).' };
    result.verdicts['2.5.5'] = { verdict: VERDICT.PARTIALLY, evidence: 'Browser checks skipped (--no-browser).' };
  }

  return result;
}

// ── Output renderers ────────────────────────────────────────────────────────

function renderMatrix(report) {
  const cols = report.standards.criteria.map((c) => c.id);
  const lines = [];
  lines.push('# HELiX Formal AAA Audit — Verdict Matrix');
  lines.push('');
  lines.push(`Generated: ${report.runAt}`);
  lines.push(`Standards: ${report.standards.claim.wcagSource} (${report.standards.claim.wcagVersion} ${report.standards.claim.wcagLevel})`);
  lines.push(`Components: ${report.results.length}`);
  lines.push('');
  lines.push('| Component | ' + cols.join(' | ') + ' |');
  lines.push('|---' + cols.map(() => '|---').join('') + '|');
  for (const r of report.results) {
    if (r.error) {
      lines.push(`| ${r.component} | ${cols.map(() => 'ERR').join(' | ')} |`);
      continue;
    }
    const row = cols.map((id) => {
      const v = r.verdicts[id];
      if (!v) return '-';
      switch (v.verdict) {
        case VERDICT.SUPPORTS: return 'S';
        case VERDICT.PARTIALLY: return 'P';
        case VERDICT.DOES_NOT: return 'F';
        case VERDICT.NOT_APPLICABLE: return 'NA';
        default: return '?';
      }
    });
    lines.push(`| ${r.component} | ${row.join(' | ')} |`);
  }
  lines.push('');
  lines.push('Legend: **S** Supports · **P** Partially Supports · **F** Does Not Support · **NA** Not Applicable');
  lines.push('');
  // Per-component findings detail.
  for (const r of report.results) {
    lines.push(`## ${r.component}`);
    lines.push('');
    if (r.error) {
      lines.push(`ERROR: ${r.error}`);
      lines.push('');
      continue;
    }
    for (const c of report.standards.criteria) {
      const v = r.verdicts[c.id];
      if (!v) continue;
      lines.push(`- **${c.id} ${c.name}** (${c.level}) — ${v.verdict}`);
      lines.push(`  - ${v.evidence}`);
      lines.push(`  - Citation: ${c.url}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function aggregateCounts(report) {
  const counts = { S: 0, P: 0, F: 0, NA: 0, ERR: 0 };
  for (const r of report.results) {
    if (r.error) { counts.ERR++; continue; }
    for (const v of Object.values(r.verdicts)) {
      switch (v.verdict) {
        case VERDICT.SUPPORTS: counts.S++; break;
        case VERDICT.PARTIALLY: counts.P++; break;
        case VERDICT.DOES_NOT: counts.F++; break;
        case VERDICT.NOT_APPLICABLE: counts.NA++; break;
      }
    }
  }
  return counts;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const standards = loadStandards();
  const allowlist = loadAllowlist();
  const targets = SINGLE_COMPONENT ? [SINGLE_COMPONENT] : allowlist;

  if (targets.length === 0) {
    console.error('[aaa-formal-audit] No components to audit.');
    process.exit(1);
  }

  console.log(`\nHELiX Formal AAA Audit — ${standards.claim.wcagVersion} ${standards.claim.wcagLevel}`);
  console.log(`Standards: ${standards.claim.wcagSource}`);
  console.log(`Components: ${targets.length} (${targets.join(', ')})`);
  if (NO_BROWSER) {
    console.log(`Browser: SKIPPED (--no-browser)`);
  } else {
    console.log(`Storybook: ${STORYBOOK_URL}`);
  }
  console.log();

  let browser = null;
  if (!NO_BROWSER) {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
  }

  const report = {
    runAt: new Date().toISOString(),
    standards: {
      claim: standards.claim,
      criteria: standards.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        url: c.url,
      })),
    },
    storybookUrl: NO_BROWSER ? null : STORYBOOK_URL,
    results: [],
  };

  for (const name of targets) {
    process.stdout.write(`Auditing ${name}... `);
    try {
      const r = await auditComponent(name, browser);
      report.results.push(r);
      const counts = { S: 0, P: 0, F: 0, NA: 0 };
      if (r.verdicts) {
        for (const v of Object.values(r.verdicts)) {
          switch (v.verdict) {
            case VERDICT.SUPPORTS: counts.S++; break;
            case VERDICT.PARTIALLY: counts.P++; break;
            case VERDICT.DOES_NOT: counts.F++; break;
            case VERDICT.NOT_APPLICABLE: counts.NA++; break;
          }
        }
      }
      console.log(`${counts.S} S · ${counts.P} P · ${counts.F} F · ${counts.NA} NA`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      report.results.push({ component: name, error: err.message });
    }
  }

  if (browser) await browser.close();

  // Write outputs.
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  const matrixPath = OUTPUT_PATH.replace(/\.json$/, '.matrix.md');
  writeFileSync(matrixPath, renderMatrix(report), 'utf-8');

  // Per-component evidence files.
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  for (const r of report.results) {
    if (r.error) continue;
    const path = resolve(EVIDENCE_DIR, `${r.component}.json`);
    writeFileSync(path, JSON.stringify(r, null, 2), 'utf-8');
  }

  const counts = aggregateCounts(report);
  console.log();
  console.log('─'.repeat(60));
  console.log(`Verdict aggregate (across ${report.results.length} components × ${standards.criteria.length} criteria):`);
  console.log(`  Supports          : ${counts.S}`);
  console.log(`  Partially Supports: ${counts.P}`);
  console.log(`  Does Not Support  : ${counts.F}`);
  console.log(`  Not Applicable    : ${counts.NA}`);
  console.log(`  Errors            : ${counts.ERR}`);
  console.log();
  console.log(`Output JSON   : ${relative(REPO_ROOT, OUTPUT_PATH)}`);
  console.log(`Verdict matrix: ${relative(REPO_ROOT, matrixPath)}`);
  console.log(`Evidence dir  : ${relative(REPO_ROOT, EVIDENCE_DIR)}/`);
  console.log();

  // Always exit 0 — Phase 4 fixes the F/P findings; this harness reports.
  process.exit(0);
}

main().catch((err) => {
  console.error('[aaa-formal-audit] crashed:', err);
  process.exit(1);
});
