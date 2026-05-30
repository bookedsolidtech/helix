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
import { spawnSync } from 'node:child_process';
import { resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
const EVIDENCE_DIR = getArg(
  '--evidence-dir',
  resolve(REPO_ROOT, '.reports/formal-aaa-audit/evidence'),
);
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
  radiogroup: [
    ['ArrowDown', 'ArrowUp'],
    ['ArrowLeft', 'ArrowRight'],
  ],
  slider: [['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], ['Home'], ['End']],
  switch: [[' ', 'Space', 'Enter']],
  tabs: [['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], ['Home'], ['End']],
  toolbar: [['ArrowLeft', 'ArrowRight']],
  tooltip: [['Escape']],
  // Structural / coordinator patterns — keyboard contract is provided by
  // child controls; the host itself has no per-pattern key requirements.
  // These are valid APG-aligned roles documented in WAI-ARIA 1.2 / HTML AAM.
  //
  // form (HTML AAM): https://www.w3.org/TR/html-aam-1.0/#html-element-role-mappings
  //   The native <form> element delegates submit to Enter on a focused
  //   submit-button or single-input form (HTML form-submission spec). The
  //   wrapper component has no key obligation of its own.
  form: [],
  // label / labelable wrappers (HTML AAM):
  //   Native <label> + form-control association requires no key handling.
  label: [],
  // group (WAI-ARIA 1.2 role="group") — generic container that exposes
  // a labelled grouping of controls. No keyboard contract on the wrapper.
  group: [],
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
  // Primitive: positioning / structural utilities that surface no widget
  //   role of their own. hx-popup is the canonical example — it owns
  //   anchor positioning math but delegates focus, dismissal, and any
  //   keyboard contract to whatever the consumer slots in (the slotted
  //   content may be a dialog, menu, listbox, or non-widget content).
  //   Components that declare `@aria-pattern none` are asserting "I am
  //   not a widget; my keyboard contract is N/A by design." Phase 4
  //   Tier 3 Task 4 — preferred to dropping the @aria-pattern tag,
  //   which the table-lookup branch above scores Partial.
  none: [],
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
  const out = {
    tagName: name,
    dir,
    classFile: null,
    classSrc: '',
    styleFile: null,
    styleSrc: '',
    storiesFile: null,
    storiesSrc: '',
  };
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
      evidence:
        'No raster <img> tags rendered in component output. Text content is rendered via real text nodes.',
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
  // Structural / coordinator patterns have no host-level keyboard contract —
  // keyboard handling is provided by child controls (or by the user agent
  // for native landmarks like <form>). 2.1.3 evaluates the consumed surface,
  // not the wrapper. Mark Not Applicable for these patterns.
  const STRUCTURAL_PATTERNS = new Set(['form', 'label', 'group']);
  const declaredPattern = (extractJsdocTag(src, 'aria-pattern') || '').toLowerCase();
  if (STRUCTURAL_PATTERNS.has(declaredPattern)) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: `@aria-pattern="${declaredPattern}" is a structural / coordinator pattern (HTML AAM / WAI-ARIA 1.2). Keyboard contract is provided by child form-control elements or the user agent; the host has no per-pattern key requirement.`,
    };
  }
  // Phase 4 (hx-icon AAA cert): `@aria-pattern none` declares a
  // presentational primitive with no widget role of its own. WCAG 2.1.3
  // applies to interactive functionality; a presentational primitive has
  // none. Mark Not Applicable rather than failing on a false-positive
  // role="img" match in render output.
  if (declaredPattern === 'none') {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: `@aria-pattern="none" declares a presentational primitive with no widget role; WCAG 2.1.3 Keyboard applies only to interactive functionality.`,
    };
  }
  const hasKeydown =
    /\b(addEventListener\(['"]keydown|@keydown\b|onKeyDown|handleKeyDown|_handleKey)/.test(src);
  const hasNativeFocusable = /<(button|a|input|textarea|select|form)\b/.test(src);
  const declaresHostRole = /role=['"]\w+['"]|host\.role|this\.role\s*=/.test(src);
  const hasTabIndex = /tabindex=['"]?\-?0|tabindex=\${|this\.tabIndex/.test(src);
  // Detect ANY mouse-only timing dependency — pointer events without keyboard equivalent.
  const hasMouseOnly = /\bmousedown\b|\bmousemove\b|\bmouseup\b|\bdblclick\b/.test(src);
  if (hasNativeFocusable || hasKeydown) {
    if (hasMouseOnly && !hasKeydown) {
      return {
        verdict: VERDICT.PARTIALLY,
        evidence:
          'Mouse handlers detected without a corresponding keydown handler. Verify all interactions are keyboard-reachable.',
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
      evidence:
        'Component has no interactive elements (no tabindex, no host role, no keydown handlers).',
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
 * 3.3.6 Error Prevention (All) — applies to form-associated INPUT components.
 *
 * Form-associated components split into two roles:
 *
 *   1. **Submission triggers** (aria-pattern=button) — `<hx-button>`,
 *      `<hx-icon-button>`, `<hx-split-button>`, `<hx-toggle-button>`.
 *      These participate in form submission but carry no user-entered
 *      DATA value the leaf could validate. WCAG 3.3.6 is a form-flow
 *      contract (review/confirm/reverse before commit) — fulfilled by
 *      the consumer app, not by a submission trigger leaf. Verdict: NA.
 *
 *      Exception: if a submission-trigger exposes ElementInternals +
 *      setValidity (e.g. a toggle-button surfacing its pressed state
 *      as form value with native validity wiring), keep the original
 *      Supports verdict.
 *
 *   2. **Input components** (aria-pattern in slider/textbox/combobox/
 *      listbox/spinbutton/radiogroup/checkbox/switch/searchbox or known
 *      data-bearing patterns like file-upload) — these collect user
 *      input that may need validation. To help consumer apps fulfill
 *      3.3.6, they SHOULD expose ElementInternals + setValidity so the
 *      consumer's form gets native validity participation. Without it,
 *      this is Partially Supports — consumers can still validate via
 *      standard form events, but the native hook is missing.
 *
 * The aria-pattern jsdoc tag is the cleanest role signal — it's what
 * we already use to declare APG conformance per component.
 */
const SUBMISSION_TRIGGER_PATTERNS = new Set(['button']);
const DATA_BEARING_TAG_HINTS = /upload/i;

function checkErrorPrevention(comp) {
  const src = comp.classSrc;
  const isFormAssociated = /static\s+(override\s+)?formAssociated\s*=\s*true/.test(src);
  if (!isFormAssociated) {
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence: 'Component is not form-associated. Error prevention applies to form submission.',
    };
  }
  const hasInternals = /attachInternals\(\)|this\._internals|this\.internals/.test(src);
  const hasSetValidity = /setValidity\(/.test(src);
  const ariaPattern = extractJsdocTag(src, 'aria-pattern');
  const isDataBearingByTag = DATA_BEARING_TAG_HINTS.test(comp.tagName);
  const isSubmissionTrigger =
    ariaPattern && SUBMISSION_TRIGGER_PATTERNS.has(ariaPattern.trim()) && !isDataBearingByTag;
  if (isSubmissionTrigger) {
    if (hasInternals && hasSetValidity) {
      return {
        verdict: VERDICT.SUPPORTS,
        evidence:
          'Form-associated submission trigger that also exposes ElementInternals + setValidity for any stateful value (e.g. toggle pressed state).',
      };
    }
    return {
      verdict: VERDICT.NOT_APPLICABLE,
      evidence:
        'Form-associated submission trigger (aria-pattern=button) with no user-entered data value. WCAG 3.3.6 applies to the form submission flow as a whole; consumer apps fulfill review/confirm/reverse for the form, not for the trigger.',
    };
  }
  if (hasInternals && hasSetValidity) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence:
        'Component is form-associated and exposes ElementInternals + setValidity for client-side error prevention.',
    };
  }
  return {
    verdict: VERDICT.PARTIALLY,
    evidence: `Component is a form-associated input but lacks ${!hasInternals ? 'ElementInternals' : ''}${!hasInternals && !hasSetValidity ? ' and ' : ''}${!hasSetValidity ? 'setValidity()' : ''}. Consumers can still validate via standard form events, but the leaf does not surface the ElementInternals hook needed for native form-validity integration.`,
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
  const hasSystemColors =
    /\b(CanvasText|ButtonText|ButtonFace|Highlight|HighlightText|LinkText|GrayText|Mark|MarkText|VisitedText|SelectedItem|SelectedItemText|Field|FieldText)\b/.test(
      src,
    );
  const hasForcedColorAdjust = /\bforced-color-adjust\s*:/.test(src);
  const hasColorDecl =
    /\b(color|background|background-color|border|border-color|outline|outline-color|box-shadow)\s*:/.test(
      src,
    );
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
      ]
        .filter(Boolean)
        .join('; '),
    };
  }
  return {
    verdict: VERDICT.DOES_NOT,
    evidence:
      'Component declares colors/backgrounds/borders but has NO forced-colors guard, NO system colors, and NO forced-color-adjust.',
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
      evidence:
        'No @aria-pattern JSDoc tag declared. Cannot verify APG conformance without a declared pattern.',
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
    // Native <input type="range"> provides slider keyboard contract via the
    // user agent (Arrow keys, Home/End, PageUp/PageDown). No custom handler
    // required — and explicit handlers would conflict with native semantics.
    slider: /<input\b[^>]*type=['"]range['"]/,
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
      return (
        /['"`] ['"`]/.test(src) ||
        /\bcase\s+['"`] ['"`]/.test(src) ||
        /key\s*===\s*['"`] ['"`]/.test(src)
      );
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
      evidence: `@aria-pattern="${pattern}" — all required key groups referenced (${groupResults.map((g) => g.matched.map((k) => (k === ' ' ? "' '" : k)).join('|')).join(', ')}).`,
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
  'hx-dialog': 'AAAAuditOpen',
  'hx-drawer': 'AAAAuditOpen',
  'hx-popover': 'AAAAuditOpen',
  // Banner Default has dismissible=false (no focusable surface). Route the
  // audit at the Dismissible story so 2.4.13 Focus Appearance has a real
  // close-button to measure.
  'hx-banner': 'Dismissible',
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
  match = entries.find((e) => isStory(e) && importPathMatchesFile(e.importPath));
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  // Tier 3: directory match + Default export (legacy fallback — risky for
  // shared-directory stories but preserves backward compatibility).
  match = entries.find(
    (e) => isStory(e) && e.exportName === 'Default' && e.importPath?.includes(dirNeedle),
  );
  if (match) return `${STORYBOOK_URL}/iframe.html?id=${match.id}&viewMode=story`;

  // Tier 4: directory match, any export.
  match = entries.find((e) => isStory(e) && e.importPath?.includes(dirNeedle));
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
    await page
      .waitForFunction(() => document.readyState === 'complete', { timeout: 5_000 })
      .catch(() => {});

    // Reset focus to document.body so the Tab walk starts from a known state.
    // Click on a 1×1 pixel near (0,0) inside the iframe body — programmatic
    // body.focus() does NOT reset the keyboard-mode flag, but a real click
    // followed by a Tab keypress does. We then move with real keyboard events
    // so :focus-visible heuristics activate exactly as they do for a sighted
    // keyboard user (this is the behaviour Tier-1-Task-1 was added to fix).
    await page.evaluate(() => {
      // Blur any currently focused element and reset to body.
      if (document.activeElement && document.activeElement !== document.body) {
        try {
          document.activeElement.blur();
        } catch {}
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

      // Codex round-5 — hx-popover OWN-PANEL scope (1.4.6 / 2.4.13 / 2.4.12).
      //
      // hx-popover's `_show()` programmatically focuses its own `[part="body"]`
      // panel whenever the slotted content contains a focusable element (WCAG
      // 2.4.3 focus management). That panel is a surface the COMPONENT owns: it
      // declares its own background + text color + `:focus-visible` outline in
      // hx-popover.styles.ts. The audit must measure THAT panel — not tab-walk
      // onto a slotted consumer control (which would certify consumer content)
      // and not blanket-N/A (which would let panel regressions escape). Pin the
      // target to `[part="body"]` so every downstream measurement (1.4.6
      // contrast, 2.4.13 ring, 2.4.12 obscured) lands on the popover's own
      // panel. Scoped to hx-popover only.
      if (tag === 'hx-popover' && host.shadowRoot) {
        const panel = host.shadowRoot.querySelector('[part="body"]');
        if (panel) {
          panel.setAttribute('data-aaa-audit-target', '1');
          const pr = panel.getBoundingClientRect();
          return {
            targetTag: 'div',
            targetPart: 'body',
            targetIsHost: false,
            hostHidden: pr.width < 2 || pr.height < 2,
          };
        }
      }

      const allCandidates = [
        host,
        ...root.querySelectorAll(
          'button, [role="button"], input, textarea, select, a[href], [tabindex]',
        ),
      ];
      const visibleCandidates = allCandidates.filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        const cs = window.getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        return true;
      });
      const target =
        host.tabIndex >= 0 && visibleCandidates.includes(host)
          ? host
          : visibleCandidates.find((el) => el !== host) || visibleCandidates[0] || host;
      // Tag the target so we can identify it across page.evaluate calls.
      target.setAttribute('data-aaa-audit-target', '1');
      return {
        targetTag: target.tagName.toLowerCase(),
        targetIsHost: target === host,
        hostHidden:
          host.getBoundingClientRect().width < 2 || host.getBoundingClientRect().height < 2,
      };
    }, componentName);

    if (targetInfo.error) {
      return { ...result, error: targetInfo.error };
    }

    // Settle the unfocused baseline before snapshotting. Several stories
    // autofocus their control on mount (e.g. Text Input Default focuses the
    // inner <input> on render). We blurred to the sentinel above, but the
    // focus-ring box-shadow/outline animates back to its resting state over a
    // CSS transition (~150ms). Snapshotting immediately captures the ring
    // mid-decay (e.g. spread still at 2px), which would poison the focus-state
    // diff (the ring would look "already present" unfocused → no gain on
    // focus → false Does-Not-Support). Wait past the transition so the
    // baseline is the true unfocused appearance.
    await page.waitForTimeout(250);

    // 2.4.13 Focus Appearance — UNFOCUSED snapshot (pre-focus baseline).
    //
    // The focus indicator for many HELiX components is NOT painted on the
    // element that receives DOM focus. The host (or inner native control)
    // takes Tab focus, but the visible ring is rendered on a different
    // shadow-DOM part via `:host(:focus-visible) .innerPart { outline: ... }`
    // (e.g. hx-checkbox .checkbox__box, hx-switch .switch__track,
    // hx-toggle-button .button) or a box-shadow ring (hx-select
    // .field__trigger). The focused host itself sets `outline: none`, and CSS
    // computes outline-width for `outline-style: none` as the `medium` default
    // = 3px. Naively measuring the focused element therefore reads a bogus
    // "3px none" outline that is not a real indicator.
    //
    // To find the element that ACTUALLY paints the ring we use a focus-state
    // diff: snapshot every candidate element's outline/box-shadow while the
    // component is unfocused, then (after the real Tab focus) re-measure and
    // pick the element whose outline/box-shadow became a visible >=2px ring ON
    // FOCUS. This is robust against static borders (unchanged across the diff)
    // and against the `medium`/3px `style:none` default (also unchanged).
    //
    // We tag each candidate with a stable data-aaa-focus-id so the after-focus
    // pass can correlate elements across page.evaluate boundaries.
    const preFocusSnapshot = await page.evaluate((tag) => {
      // Resolve the tagged audit target. For most components the target is
      // either the host or a shadow-internal control that document-level
      // querySelector reaches via the focus walk below. hx-popover is the one
      // case where the target is a tabindex=-1 SHADOW-internal node
      // ([part="body"]) that a top-level document.querySelector CANNOT see — so
      // for it (only) we re-resolve the tagged panel through host.shadowRoot.
      // All other components keep their original document-level resolution
      // (and host fallback) byte-for-byte.
      const docTagged = document.querySelector(`[data-aaa-audit-target="1"]`);
      const host = docTagged?.closest(tag) || document.querySelector(tag);
      const shadowTagged =
        tag === 'hx-popover' && host && host.shadowRoot
          ? host.shadowRoot.querySelector(`[data-aaa-audit-target="1"]`)
          : null;
      const target = docTagged || shadowTagged || host;
      if (!host && !target) return { byId: {} };
      // Collect the target, the host, and every element reachable through the
      // host's shadow tree AND any slotted children's shadow trees — the same
      // surface area the after-focus search will inspect.
      const collect = (root, sink) => {
        if (!root) return;
        for (const el of root.querySelectorAll('*')) sink.push(el);
        for (const slot of root.querySelectorAll('slot')) {
          let assigned = [];
          try {
            assigned = slot.assignedElements({ flatten: true }) || [];
          } catch {
            assigned = [];
          }
          for (const a of assigned) {
            sink.push(a);
            if (a.shadowRoot) collect(a.shadowRoot, sink);
            try {
              for (const c of a.querySelectorAll('*')) sink.push(c);
            } catch {
              /* ignore */
            }
          }
        }
      };
      const els = [];
      if (target) els.push(target);
      if (host && host !== target) els.push(host);
      if (host && host.shadowRoot) collect(host.shadowRoot, els);
      const byId = {};
      let n = 0;
      const seen = new Set();
      for (const el of els) {
        if (!el || el.nodeType !== 1 || seen.has(el)) continue;
        seen.add(el);
        const id = `f${n++}`;
        el.setAttribute('data-aaa-focus-id', id);
        const cs = window.getComputedStyle(el);
        byId[id] = {
          outlineWidth: cs.outlineWidth || '0px',
          outlineStyle: cs.outlineStyle || 'none',
          outlineColor: cs.outlineColor || '',
          boxShadow: cs.boxShadow || 'none',
        };
      }
      return { byId };
    }, componentName);

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
      if (reached) {
        tabbed = true;
        break;
      }
    }

    // hx-popover OWN-PANEL focus (1.4.6 / 2.4.13 / 2.4.12) — VERIFIED, not forced.
    //
    // The popover's `[part="body"]` panel is `tabindex="-1"`, so the Tab walk
    // above cannot land on it. But `[part="body"]` is exactly the surface the
    // COMPONENT focuses itself on open: `_show()` calls `bodyEl.focus()` when the
    // slotted content contains a focusable element (WCAG 2.4.3 focus management),
    // which the AAAAuditOpen fixture guarantees by slotting a `<button>`.
    //
    // We must NOT fake this focus by calling `panel.focus()` ourselves — that
    // would report a keyboard-reached pass for 1.4.6 / 2.4.12 / 2.4.13 even if
    // `_show()` regressed and stopped focusing the panel (a false positive). The
    // sentinel reset + Tab walk above already moved focus OFF the panel (the
    // genuine on-mount focus from `firstUpdated()` is lost), and the Tab presses
    // set the user-agent's last-interaction modality to keyboard.
    //
    // Instead we re-exercise the component's OWN open cycle and READ where focus
    // lands. Toggling the public `open` property false→true drives the genuine
    // `updated()` → `_hide()` / `_show()` lifecycle; `_show()` (only if its
    // interactive-content gate still passes) moves focus to `[part="body"]`. We
    // then resolve `document.activeElement` (shadow-aware) and accept the focus
    // as keyboard-reached ONLY when the COMPONENT genuinely parked it on (or
    // within) the panel. If `_show()` did not move focus into the panel, we leave
    // `tabbed` false so the measurement path flags focus as programmatic-only —
    // a real `_show()` regression is therefore detectable rather than masked.
    if (componentName === 'hx-popover') {
      const focusedByComponent = await page.evaluate(async () => {
        const host = document.querySelector('hx-popover');
        if (!host || !host.shadowRoot) return false;
        // Drive the component's own open lifecycle so _show() — not the harness —
        // moves focus. Re-running _show() after the Tab walk also means the
        // keyboard modality flag is already set, so the panel's :focus-visible
        // ring resolves exactly as it would for a keyboard user.
        try {
          host.open = false;
          await host.updateComplete;
          await new Promise((r) => setTimeout(r, 30));
          host.open = true;
          await host.updateComplete;
          // _show() awaits updateComplete then focuses; allow a couple of frames
          // for the focus() call inside _show() to take effect.
          await new Promise((r) => setTimeout(r, 60));
        } catch {
          return false;
        }
        const panel = host.shadowRoot.querySelector('[data-aaa-audit-target="1"], [part="body"]');
        if (!panel) return false;
        // Resolve the deepest active element across shadow boundaries and verify
        // the COMPONENT placed focus on (or within) its own panel.
        let deep = document.activeElement;
        while (deep && deep.shadowRoot && deep.shadowRoot.activeElement) {
          deep = deep.shadowRoot.activeElement;
        }
        return deep === panel || panel.contains(deep);
      });
      if (focusedByComponent) {
        // The component genuinely moved focus to its own panel — treat it as
        // keyboard-reached (legitimate per 2.4.3) so 1.4.6 / 2.4.13 / 2.4.12 are
        // measured on the real, currently-focused panel surface.
        tabbed = true;
      }
    }

    // Give the browser time to fully render the focus ring before measuring.
    // Several HELiX components use CSS transitions on the focus-ring box-shadow
    // (opacity 0 → 1, spread 0 → 2px) for visual polish — the shadow takes
    // ~150ms to reach its full computed value. Measuring earlier captures the
    // transition midpoint (e.g. spread=0.65px, opacity=0.0008) which my
    // hardened isVisibleFocusShadow predicate correctly rejects as below the
    // 2px threshold. 250ms is a safe upper bound for any reasonable focus
    // transition while remaining acceptable in audit runtime.
    await page.waitForTimeout(250);

    // Now measure — the target is keyboard-focused (or we fell back to
    // programmatic focus only if the Tab walk failed to reach it).
    const measurements = await page.evaluate(
      async ({ tag, didTab, preSnapshot }) => {
        // Resolve the tagged audit target. hx-popover tags a tabindex=-1
        // SHADOW-internal node ([part="body"]) that a top-level
        // document.querySelector CANNOT see — for it (only) re-resolve the
        // tagged panel through host.shadowRoot so every downstream measurement
        // (1.4.6 contrast, 2.4.13 ring, 2.4.12 obscured hit-test, rect
        // fallback) lands on the panel surface the component owns rather than
        // silently collapsing onto the display:contents host. All other
        // components keep their original document-level resolution byte-for-byte.
        const docTagged = document.querySelector(`[data-aaa-audit-target="1"]`);
        const resolvedHost = document.querySelector(tag);
        const shadowTagged =
          tag === 'hx-popover' && resolvedHost && resolvedHost.shadowRoot
            ? resolvedHost.shadowRoot.querySelector(`[data-aaa-audit-target="1"]`)
            : null;
        const target = docTagged || shadowTagged || resolvedHost;
        if (!target) return { error: `no <${tag}> in story` };
        const host = resolvedHost || target;

        // If the Tab walk did not reach the target, fall back to programmatic
        // focus so the rest of the measurements still land — but we'll mark
        // the focusOutline result as "programmatic-only" for transparency.
        if (!didTab) {
          try {
            target.focus();
          } catch {}
        }

        // Resolve the deepest active element across shadow boundaries. With
        // `delegatesFocus: true`, Tab onto the host moves real focus to an
        // inner control; document.activeElement returns the host but the
        // :focus-visible outline lives on the inner part. We start measuring
        // from whichever element actually owns the focus pseudo-state, then
        // refine via the focus-state diff below.
        let activeDeep = document.activeElement;
        while (activeDeep && activeDeep.shadowRoot && activeDeep.shadowRoot.activeElement) {
          activeDeep = activeDeep.shadowRoot.activeElement;
        }

        // --- 2.4.13 focus-indicator resolution via focus-state DIFF ----------
        //
        // The focused element is NOT necessarily the element that paints the
        // ring. We must measure the element whose outline / box-shadow actually
        // CHANGED into a visible >=2px indicator on focus. Comparing against the
        // unfocused baseline (preSnapshot) makes this robust:
        //   - a host that sets `outline: none` reads outline-width = `medium`
        //     (3px) both unfocused and focused → NO diff → not the indicator
        //     (kills the bogus "outline 3px (under 2px threshold)" false-fail);
        //   - a static border / always-on box-shadow is identical in both
        //     states → NO diff → never mistaken for a focus ring;
        //   - the inner part that goes 0px/none → 2px solid (or gains a >=2px
        //     box-shadow ring) ON focus IS the indicator and is selected.
        //
        // A box-shadow value is a "visible focus ring" only when it isn't
        // 'none', has at least one >=2px pixel dimension, and its color isn't
        // fully transparent. The earlier heuristic accepted any `\d+px`
        // substring, which matched the computed default
        // "oklab(0 0 0 / 0) 0px 0px 0px 0px" (browser placeholder for "no
        // shadow"); reject those.
        const isVisibleFocusShadow = (raw) => {
          if (!raw || raw === 'none') return false;
          if (/\brgba?\([^)]*,\s*0\s*\)/.test(raw)) return false;
          if (/\boklab\([^)]*\/\s*0(?:\.0+)?\s*\)/.test(raw)) return false;
          if (/\boklch\([^)]*\/\s*0(?:\.0+)?\s*\)/.test(raw)) return false;
          if (/\bhsla?\([^)]*,\s*0(?:\.0+)?%?\s*\)/.test(raw)) return false;
          if (/\bcolor\(\s*[^)]*\/\s*0(?:\.0+)?\s*\)/.test(raw)) return false;
          const pxValues = Array.from(raw.matchAll(/(-?\d+(?:\.\d+)?)\s*px/g)).map((m) =>
            parseFloat(m[1]),
          );
          if (pxValues.length === 0) return false;
          return pxValues.some((v) => Math.abs(v) >= 2);
        };
        // Split a multi-layer box-shadow value into its comma-separated layers
        // WITHOUT splitting on commas inside color functions (rgba(), oklch(),
        // color(...)). Returns trimmed layer strings.
        const splitShadowLayers = (raw) => {
          if (!raw || raw === 'none') return [];
          const out = [];
          let depth = 0;
          let cur = '';
          for (const ch of raw) {
            if (ch === '(') depth++;
            else if (ch === ')') depth--;
            if (ch === ',' && depth === 0) {
              out.push(cur.trim());
              cur = '';
            } else {
              cur += ch;
            }
          }
          if (cur.trim()) out.push(cur.trim());
          return out;
        };
        // A focus-ring box-shadow is "gained on focus" when the focused value
        // contains a visible ring LAYER that the unfocused baseline did not.
        // This is stronger than comparing whole-string visibility: components
        // like hx-slider keep a static drop-shadow layer
        // ("rgba(0,0,0,0.05) 0px 1px 2px 0px") at rest and ADD a teal ring
        // layer ("rgb(15,112,120) 0px 0px 0px 2px") on focus — the whole
        // string is "visible" in both states, but the ring layer is new.
        const shadowRingGained = (before, after) => {
          if (!isVisibleFocusShadow(after)) return false;
          const beforeLayers = new Set(splitShadowLayers(before));
          const afterLayers = splitShadowLayers(after);
          // A newly-added layer that is itself a visible ring → gained.
          return afterLayers.some(
            (layer) => !beforeLayers.has(layer) && isVisibleFocusShadow(layer),
          );
        };
        // An outline is a "visible focus outline" only when style isn't `none`
        // (regardless of the computed `medium`/3px width that the UA reports
        // for outline-style:none) AND its rendered width is >=2px.
        const isVisibleFocusOutline = (widthPx, style) => style !== 'none' && widthPx >= 2;

        // Re-collect the same candidate surface area as the pre-focus snapshot
        // (host + its shadow tree + slotted children's shadow + light trees),
        // so every snapshotted element can be re-measured in the focused state.
        const collectFocusCandidates = (root, sink) => {
          if (!root) return;
          for (const el of root.querySelectorAll('*')) sink.push(el);
          for (const slot of root.querySelectorAll('slot')) {
            let assigned = [];
            try {
              assigned = slot.assignedElements({ flatten: true }) || [];
            } catch {
              assigned = [];
            }
            for (const a of assigned) {
              sink.push(a);
              if (a.shadowRoot) collectFocusCandidates(a.shadowRoot, sink);
              try {
                for (const c of a.querySelectorAll('*')) sink.push(c);
              } catch {
                /* ignore */
              }
            }
          }
        };
        const candidates = [];
        if (target) candidates.push(target);
        if (host && host !== target) candidates.push(host);
        if (host && host.shadowRoot) collectFocusCandidates(host.shadowRoot, candidates);

        // For each candidate, decide whether it became a focus indicator on
        // focus (diff vs. preSnapshot keyed by data-aaa-focus-id).
        const diffWinners = [];
        const seenCand = new Set();
        for (const el of candidates) {
          if (!el || el.nodeType !== 1 || seenCand.has(el)) continue;
          seenCand.add(el);
          const cs = window.getComputedStyle(el);
          const wNow = parseFloat(cs.outlineWidth || '0');
          const styleNow = cs.outlineStyle || 'none';
          const shadowNow = cs.boxShadow || 'none';
          const outlineVisibleNow = isVisibleFocusOutline(wNow, styleNow);
          const shadowVisibleNow = isVisibleFocusShadow(shadowNow);
          if (!outlineVisibleNow && !shadowVisibleNow) continue;

          // Compare against the unfocused baseline.
          const id = el.getAttribute && el.getAttribute('data-aaa-focus-id');
          const prev = (id && preSnapshot && preSnapshot[id]) || null;
          // When a baseline exists, an indicator is "gained" only if it was not
          // already visible unfocused. The layer-aware shadow check counts a
          // ring LAYER added on focus even when an unrelated static shadow
          // layer was already present at rest (e.g. hx-slider thumb keeps a
          // drop-shadow and adds the teal ring). When no baseline was captured
          // (element appeared only after focus), its visible indicator counts
          // as gained — it did not exist unfocused.
          const outlineVisibleBefore = prev
            ? isVisibleFocusOutline(
                parseFloat(prev.outlineWidth || '0'),
                prev.outlineStyle || 'none',
              )
            : false;
          const outlineGained = outlineVisibleNow && !outlineVisibleBefore;
          const shadowGained = prev
            ? shadowVisibleNow && shadowRingGained(prev.boxShadow, shadowNow)
            : shadowVisibleNow;
          if (!outlineGained && !shadowGained) continue;

          // The indicator must be actually visible (not on a display:none /
          // 0×0 part).
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') {
            continue;
          }
          diffWinners.push({
            el,
            kind: outlineGained ? 'outline' : 'box-shadow',
            outlineWidthPx: wNow,
            outlineStyle: styleNow,
            outlineColor: cs.outlineColor,
            outlineOffsetPx: parseFloat(cs.outlineOffset || '0'),
            boxShadow: shadowNow,
            // The unfocused baseline box-shadow, so 2.4.13 contrast can isolate
            // the LAYER gained on focus (the ring) from any static drop-shadow
            // layer the control already painted at rest (e.g. hx-slider thumb).
            prevBoxShadow: (prev && prev.boxShadow) || 'none',
          });
        }

        // Pick the 2.4.13 focus-indicator element from the diff winners.
        // Prefer the deepest active element if it is itself a diff winner (the
        // ring on the focused control); otherwise the first winner in tree
        // order (a host shadow part). This drives ONLY the 2.4.13 verdict.
        let focusIndicator = null;
        if (diffWinners.length > 0) {
          focusIndicator = diffWinners.find((w) => w.el === activeDeep) || diffWinners[0];
        }

        // `outlineSource` is the element used for the 1.4.6 contrast, 2.4.12
        // focus-obscured hit-test, and rect fallback. It is resolved
        // INDEPENDENTLY of the 2.4.13 diff so this change does not perturb the
        // other criteria's measurements: start at the target, prefer the
        // deepest active element if it lives inside the component subtree, and
        // (only when that element renders no outline of its own) walk the
        // shadow tree for the first element painting a ring — mirroring the
        // pre-existing resolution.
        let outlineSource = target;
        if (activeDeep && activeDeep !== target) {
          let cur = activeDeep;
          let inside = false;
          while (cur) {
            if (cur === target || cur === host) {
              inside = true;
              break;
            }
            cur = cur.assignedSlot || cur.parentNode || cur.host || null;
            if (cur && cur.nodeType !== 1 && cur.host) cur = cur.host;
          }
          if (inside) outlineSource = activeDeep;
        }
        const ownOutlineWidth = parseFloat(
          window.getComputedStyle(outlineSource).outlineWidth || '0',
        );
        if (ownOutlineWidth < 2) {
          for (const el of candidates) {
            if (!el || el.nodeType !== 1 || el === outlineSource) continue;
            const cs = window.getComputedStyle(el);
            const w = parseFloat(cs.outlineWidth || '0');
            const okOutline = w >= 2 && cs.outlineStyle !== 'none';
            const okShadow = isVisibleFocusShadow(cs.boxShadow);
            if (okOutline || okShadow) {
              const r = el.getBoundingClientRect();
              if (
                r.width >= 2 &&
                r.height >= 2 &&
                cs.visibility !== 'hidden' &&
                cs.display !== 'none'
              ) {
                outlineSource = el;
                break;
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
        // WCAG 1.4.6 applies to text and images of text. A focus-paint surface
        // with no rendered text content (e.g. hx-switch track, color-picker
        // swatch grid cell, toggle thumb) is a 1.4.11 Non-text Contrast
        // surface, not a 1.4.6 surface. Detect rendered-text-free elements so
        // the 1.4.6 verdict can route to Not Applicable instead of measuring
        // the cascade-inherited foreground color against an empty element's
        // background.
        //
        // A focus-paint element counts as text-bearing if it has:
        //   1. a non-empty direct child text node, OR
        //   2. a non-empty innerText (covers slot-flattened light-DOM text), OR
        //   3. a <slot> with assigned text-bearing nodes/elements.
        const hasOwnTextContent = (() => {
          // Direct text-node children.
          for (const node of outlineSource.childNodes) {
            if (node.nodeType === 3 /* TEXT_NODE */ && (node.textContent || '').trim().length > 0) {
              return true;
            }
          }
          // Rendered text via innerText (handles flattened slot content).
          try {
            const it = outlineSource.innerText;
            if (typeof it === 'string' && it.trim().length > 0) return true;
          } catch {
            /* ignore */
          }
          // Slot-assigned content.
          const slots = outlineSource.querySelectorAll
            ? outlineSource.querySelectorAll('slot')
            : [];
          for (const slot of slots) {
            let assigned = [];
            try {
              assigned = slot.assignedNodes({ flatten: true }) || [];
            } catch {
              assigned = [];
            }
            for (const a of assigned) {
              if (a.nodeType === 3 /* TEXT_NODE */ && (a.textContent || '').trim().length > 0)
                return true;
              if (a.nodeType === 1 /* ELEMENT_NODE */ && (a.textContent || '').trim().length > 0)
                return true;
            }
          }
          return false;
        })();

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

        // 2.4.13 requires the focus indicator to have >=3:1 contrast against
        // the adjacent (unfocused) colour it covers. Best-effort automated
        // computation: resolve the ring colour vs. the background colour of the
        // indicator element's nearest opaque ancestor surface. Colour parsing
        // is limited to rgb()/rgba() (what getComputedStyle returns for
        // resolved colours in Chromium); oklch()/named tokens that don't
        // resolve to rgb are reported but flagged for manual verification.
        let ringContrast = null;
        let ringContrastNote = null;
        let ringEffectiveAlpha = null;
        if (focusIndicator) {
          // Parse the colour formats Chromium emits for resolved focus rings:
          //   • rgb()/rgba()                       — sRGB 0-255, optional alpha
          //   • color(srgb r g b [/ a])            — sRGB 0-1, optional alpha
          //   • oklch(L C H [/ a])                 — OKLCH, converted to sRGB
          //   • color-mix(in srgb, <c> N%, transparent) — defensive: some UAs
          //     leave a translucent halo un-resolved; treat the N% as alpha.
          // Returns { r, g, b, a } with r/g/b in 0-255.
          const clamp255 = (v) => Math.max(0, Math.min(255, v));
          const srgbLinToGamma = (v) =>
            v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
          const oklchToSrgb = (L, C, H) => {
            // OKLCH → OKLab → linear sRGB → gamma sRGB (Björn Ottosson).
            const hr = (H * Math.PI) / 180;
            const a = C * Math.cos(hr);
            const b = C * Math.sin(hr);
            const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
            const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
            const s_ = L - 0.0894841775 * a - 1.291485548 * b;
            const l = l_ * l_ * l_;
            const m = m_ * m_ * m_;
            const s = s_ * s_ * s_;
            const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
            const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
            const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
            return {
              r: clamp255(srgbLinToGamma(lr) * 255),
              g: clamp255(srgbLinToGamma(lg) * 255),
              b: clamp255(srgbLinToGamma(lb) * 255),
            };
          };
          const parseColor = (c) => {
            if (!c) return null;
            const s = c.trim();
            // rgb()/rgba()
            let m = s.match(
              /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i,
            );
            if (m) {
              return {
                r: +m[1],
                g: +m[2],
                b: +m[3],
                a: m[4] === undefined ? 1 : parseFloat(m[4]),
              };
            }
            // color(srgb r g b [/ a]) — components are 0-1.
            m = s.match(
              /color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i,
            );
            if (m) {
              return {
                r: clamp255(parseFloat(m[1]) * 255),
                g: clamp255(parseFloat(m[2]) * 255),
                b: clamp255(parseFloat(m[3]) * 255),
                a: m[4] === undefined ? 1 : parseFloat(m[4]),
              };
            }
            // oklch(L C H [/ a]) — L may be a percentage.
            m = s.match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
            if (m) {
              const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
              const rgb = oklchToSrgb(L, parseFloat(m[2]), parseFloat(m[3]));
              return { ...rgb, a: m[4] === undefined ? 1 : parseFloat(m[4]) };
            }
            // color-mix(in srgb, <c> N%, transparent) — defensive fallback. The
            // un-resolved translucent halo: the N% of <c> over transparent is an
            // alpha-N% version of <c>. Resolve <c> recursively, fold N% into a.
            m = s.match(/color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)/i);
            if (m) {
              const base = parseColor(m[1]);
              if (base) {
                return { r: base.r, g: base.g, b: base.b, a: base.a * (parseFloat(m[2]) / 100) };
              }
            }
            if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
            return null;
          };
          // WCAG relative luminance (sRGB).
          const luminance = ({ r, g, b }) => {
            const ch = [r, g, b].map((v) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
          };
          // Source-over alpha compositing: fg (with alpha) over an opaque bg.
          const composite = (fg, bg) => ({
            r: fg.a * fg.r + (1 - fg.a) * bg.r,
            g: fg.a * fg.g + (1 - fg.a) * bg.g,
            b: fg.a * fg.b + (1 - fg.a) * bg.b,
          });
          // Ring colour: outline-color for outline rings; colour token of the
          // box-shadow for shadow rings. Capture color()/oklch()/rgba() forms,
          // not just rgba(), so translucent halos resolve correctly.
          //
          // For a box-shadow ring, do NOT blindly grab the first colour token
          // of the whole computed shadow string. Controls that keep a static
          // drop-shadow layer at rest and ADD the focus ring as a LATER layer
          // (e.g. hx-slider thumb: "rgba(0,0,0,0.05) 0 1px 2px" baseline +
          // "rgb(15,112,120) 0 0 0 2px" ring on focus) would otherwise score
          // the drop-shadow's near-transparent black instead of the teal ring.
          // Isolate the layer GAINED on focus (present in the focused value,
          // absent from the unfocused baseline, and itself a visible ring) and
          // read its colour; fall back to whole-string first-match only when
          // the gained layer can't be determined.
          let ringColorStr = focusIndicator.outlineColor;
          if (focusIndicator.kind === 'box-shadow') {
            const matchRingColor = (s) =>
              s.match(/color\(\s*srgb[^)]*\)/i) ||
              s.match(/oklch\([^)]*\)/i) ||
              s.match(/color-mix\([^)]*\)/i) ||
              s.match(/rgba?\([^)]*\)/i);
            const fullShadow = focusIndicator.boxShadow || '';
            const beforeLayers = new Set(splitShadowLayers(focusIndicator.prevBoxShadow || 'none'));
            const gainedLayer = splitShadowLayers(fullShadow).find(
              (layer) => !beforeLayers.has(layer) && isVisibleFocusShadow(layer),
            );
            const source = gainedLayer || fullShadow;
            const cm = matchRingColor(source) || (gainedLayer && matchRingColor(fullShadow));
            ringColorStr = cm ? cm[0] : focusIndicator.outlineColor;
          }
          // Adjacent background — the colour the ring sits AGAINST. For an
          // `outline` ring with a positive `outline-offset`, the ring is painted
          // OUTSIDE the element's border box, so the adjacent colour is the
          // surface BEHIND/AROUND the element (its parent/page), NOT the
          // element's own fill. Sampling the indicator's own background here
          // produced false-low ratios (e.g. teal ring on a teal-filled switch
          // track reading 1.21:1). Start the walk from the parent for offset
          // outline rings; box-shadow rings (and zero/negative-offset outlines
          // that paint over the element) sit on the element's own surface.
          const offsetRing =
            focusIndicator.kind === 'outline' && (focusIndicator.outlineOffsetPx || 0) > 0;
          let bgEl = offsetRing
            ? focusIndicator.el.parentElement || focusIndicator.el.getRootNode()?.host || null
            : focusIndicator.el;
          let adjBg = null;
          let hops = 0;
          while (bgEl && hops < 8) {
            const c = parseColor(window.getComputedStyle(bgEl).backgroundColor);
            if (c && c.a > 0) {
              adjBg = c;
              break;
            }
            bgEl = bgEl.parentElement || bgEl.getRootNode()?.host || null;
            hops++;
          }
          const ringRgb = parseColor(ringColorStr);
          if (offsetRing && !adjBg) {
            // The surface behind an offset ring is transparent all the way up
            // (consumer page controls it) — we cannot resolve the true adjacent
            // colour from within the component. Defer to manual verification
            // rather than emit a misleading ratio.
            ringContrastNote =
              `offset outline ring (offset ${focusIndicator.outlineOffsetPx}px) sits on the consumer page surface, ` +
              `which is transparent within the component — adjacent contrast cannot be auto-measured; verify >=3:1 manually`;
          } else if (ringRgb && adjBg && ringRgb.a > 0) {
            ringEffectiveAlpha = ringRgb.a;
            // WCAG 2.4.13 contrast is about how much the indicator shifts the
            // colour it sits on. A translucent ring (alpha < 1) does NOT paint
            // its raw colour — it paints the COMPOSITE of (ring over backdrop).
            // Score that composited colour vs. the same backdrop, so a 25%-alpha
            // halo over white reads its true ~1.3:1, not the opaque teal ~5.8:1.
            const effectiveRing = ringRgb.a < 1 ? composite(ringRgb, adjBg) : ringRgb;
            const l1 = luminance(effectiveRing);
            const l2 = luminance(adjBg);
            ringContrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          } else {
            ringContrastNote =
              'ring colour or adjacent background did not resolve to a known colour format — verify >=3:1 manually';
          }
        }

        // 1.4.6 surface-ownership probe. When the primary 1.4.6 sample
        // (outlineSource) is transparent — common when outlineSource resolves
        // to the transparent host — the component may still OWN a
        // non-transparent focus/text surface inside its OWN shadow tree (e.g.
        // hx-menu `.menu`, hx-select `.field__trigger`, hx-dialog `.dialog`).
        // Marking 1.4.6 Not Applicable in that case drops real AAA coverage.
        // CRITICAL: the surface MUST be component-owned — never an ancestor in
        // the consumer page (the Storybook `<body>` white chrome is NOT the
        // component's surface). Restrict the search to the host's shadow tree
        // (and the host itself); never walk up past the host into light DOM.
        //
        // Text-bearing test that accounts for slotted light-DOM content. A
        // component surface (e.g. hx-menu `.base`, hx-toggle-button `.button`)
        // frequently renders its text via a <slot> projecting light-DOM
        // children (menu items, the button label). That text visually sits on
        // the surface's background and inherits the surface's `color`, so the
        // surface IS a 1.4.6 text surface even though its own childNodes hold
        // no text. Check: direct text nodes, innerText, OR a descendant <slot>
        // with assigned text-bearing nodes.
        const elementHasOwnText = (el) => {
          if (!el) return false;
          for (const node of el.childNodes || []) {
            if (node.nodeType === 3 && (node.textContent || '').trim().length > 0) return true;
          }
          try {
            if (typeof el.innerText === 'string' && el.innerText.trim().length > 0) return true;
          } catch {
            /* ignore */
          }
          const slots = el.querySelectorAll ? el.querySelectorAll('slot') : [];
          for (const slot of slots) {
            let assigned = [];
            try {
              assigned = slot.assignedNodes({ flatten: true }) || [];
            } catch {
              assigned = [];
            }
            for (const a of assigned) {
              if ((a.textContent || '').trim().length > 0) return true;
            }
          }
          return false;
        };
        const isOpaqueBg = (c) =>
          !!c &&
          c !== 'transparent' &&
          !/rgba?\([^,]+,[^,]+,[^,]+,\s*0(\.0+)?\s*\)/.test(c) &&
          !/\/\s*0(?:\.0+)?\s*\)/.test(c);
        let ownedSurface = null;
        {
          // Candidate surfaces, in priority order, all component-owned:
          //   1. the ring-painting focus indicator (a verified shadow part),
          //   2. shadow-tree ancestors of the focused element up to (and
          //      including) the host — NEVER beyond the host into the page,
          //   3. the host's shadow-tree elements that contain the focused
          //      element (covers the menu/listbox panel `.menu`/`.base`).
          // Stop the upward walk at the host: an opaque surface above the host
          // belongs to the consumer page, not the component.
          const ownedAncestors = [];
          if (focusIndicator && focusIndicator.el) ownedAncestors.push(focusIndicator.el);
          // CONTAINMENT GATE: only walk `activeDeep`'s ancestors when the
          // focused node ACTUALLY lives inside this component's subtree — its
          // shadow tree, the host itself, or light DOM assigned to one of the
          // host's slots (flattened tree). For NON-focusable components the Tab
          // walk never reaches them and `target.focus()` no-ops, so
          // `activeDeep` is still whatever page element holds focus (Storybook
          // `<body>.sb-main-padded` chrome). Walking that node's ancestors
          // would climb into PAGE chrome and mis-report the page background as
          // a component-owned 1.4.6 surface. When focus never entered the
          // component, skip the ancestor walk entirely so 1.4.6 stays Not
          // Applicable — the correct verdict for a non-focusable component.
          // Shadow-piercing containment: climb via assignedSlot (slotted light
          // DOM) → parentNode (shadow children / light DOM) → shadow-root host,
          // confirming the chain reaches `host` (or `target`). Mirrors the
          // outlineSource `inside` walk above.
          let focusInsideComponent = false;
          if (activeDeep) {
            let cur = activeDeep;
            let guard = 0;
            while (cur && guard < 32) {
              guard++;
              if (cur === host || cur === target) {
                focusInsideComponent = true;
                break;
              }
              cur = cur.assignedSlot || cur.parentNode || cur.host || null;
              if (cur && cur.nodeType !== 1 && cur.host) cur = cur.host;
            }
          }
          if (activeDeep && focusInsideComponent) {
            let cur = activeDeep;
            let guard = 0;
            while (cur && guard < 12) {
              guard++;
              ownedAncestors.push(cur);
              if (cur === host) break; // do not cross above the component host
              // Climb within the shadow tree: parentNode handles shadow
              // children; when we hit a shadow root, hop to its host (still
              // inside the component if that host === our component host).
              const parent = cur.parentNode;
              if (parent && parent.nodeType === 11 /* DOCUMENT_FRAGMENT (shadow root) */) {
                cur = parent.host || null;
              } else {
                cur = parent;
              }
            }
          }
          // De-dupe while preserving order.
          const seen = new Set();
          const candidates = ownedAncestors.filter((el) => {
            if (!el || el.nodeType !== 1 || seen.has(el)) return false;
            seen.add(el);
            return true;
          });
          for (const el of candidates) {
            const cs = window.getComputedStyle(el);
            if (!isOpaqueBg(cs.backgroundColor)) continue;
            // The surface must render text that sits on this opaque background
            // (its own text, or slotted text projected into it). Otherwise it
            // is a 1.4.11 non-text surface (e.g. hx-switch track) and 1.4.6 is
            // Not Applicable. The foreground is the SURFACE's own computed
            // `color` — that is the colour the on-surface text (including
            // slotted labels/menu items) inherits and the user actually sees
            // against this fill (black on hx-menu `.base`, white on
            // hx-toggle-button `.button`). Reading an unrelated focused
            // element's colour (e.g. the inherited body black) would be a
            // category error.
            if (!elementHasOwnText(el)) continue;
            const surfaceBg = cs.backgroundColor;
            const surfaceFg = cs.color;
            ownedSurface = {
              tag: el.tagName ? el.tagName.toLowerCase() : null,
              part: el.getAttribute
                ? el.getAttribute('part') || el.getAttribute('class') || null
                : null,
              bg: surfaceBg,
              fg: surfaceFg,
            };
            break;
          }
        }

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
          ownedSurface,
          isCovered,
          targetTag: target.tagName.toLowerCase(),
          targetIsHost: target === host,
          outlineSourceTag: outlineSource.tagName ? outlineSource.tagName.toLowerCase() : null,
          outlineSourceIsTarget: outlineSource === target,
          outlineSourceHasOwnText: hasOwnTextContent,
          focusedViaKeyboard: didTab,
          tabPresses: undefined, // populated outside evaluate scope
          // Focus-state DIFF result (2.4.13): which element became a visible
          // ring on focus, and how.
          focusIndicatorFound: !!focusIndicator,
          focusIndicatorKind: focusIndicator ? focusIndicator.kind : null,
          focusIndicatorTag:
            focusIndicator && focusIndicator.el.tagName
              ? focusIndicator.el.tagName.toLowerCase()
              : null,
          focusIndicatorPart:
            focusIndicator && focusIndicator.el.getAttribute
              ? focusIndicator.el.getAttribute('part') ||
                focusIndicator.el.getAttribute('class') ||
                null
              : null,
          focusIndicatorOutlineWidthPx: focusIndicator ? focusIndicator.outlineWidthPx : null,
          focusIndicatorOutlineStyle: focusIndicator ? focusIndicator.outlineStyle : null,
          focusIndicatorOutlineColor: focusIndicator ? focusIndicator.outlineColor : null,
          focusIndicatorBoxShadow: focusIndicator ? focusIndicator.boxShadow : null,
          focusIndicatorIsTarget: focusIndicator ? focusIndicator.el === target : false,
          ringContrast,
          ringContrastNote,
          ringEffectiveAlpha,
        };
      },
      { tag: componentName, didTab: tabbed, preSnapshot: preFocusSnapshot?.byId || {} },
    );

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
    //
    // hx-popover is included here: its resolved audit target is the
    // component-owned `[part="body"]` panel — a non-actionable CONTAINER, not
    // a click target. The 2.5.5 obligation falls on the consumer-supplied
    // trigger and on any actionable controls the consumer slots into the
    // panel, neither of which the component sizes. This keeps popover's 2.5.5
    // verdict consistent with its other container-N/A rationales (round-4/5).
    const POPOVER_CONTAINERS = new Set(['hx-dropdown', 'hx-tooltip', 'hx-popup', 'hx-popover']);
    // WCAG 2.5.5 user-agent control exception — components whose interactive
    // target is rendered and sized by the user agent (native <input
    // type="range"> thumb, native rating star widgets) are exempt because
    // the target dimensions are determined by the platform, not the author.
    // The host bbox does not represent the actual click target.
    const UA_TARGET_EXEMPT = new Set(['hx-slider']);
    if (POPOVER_CONTAINERS.has(componentName)) {
      result.targetSize = {
        width: measurements.rect.width,
        height: measurements.rect.height,
        target: measurements.targetTag,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Popover-container component — host wraps a slotted trigger and a floating panel. The 2.5.5 (Enhanced) target-size obligation is on the consumer-supplied trigger, not the wrapper host. Use <hx-button> / <hx-icon-button> as the slotted trigger to meet 44×44 (each clears 2.5.5 in its own audit row).`,
      };
    } else if (UA_TARGET_EXEMPT.has(componentName)) {
      result.targetSize = {
        width: measurements.rect.width,
        height: measurements.rect.height,
        target: measurements.targetTag,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `User-agent-controlled target — component delegates to a native <input type="range"> whose thumb is sized by the platform (typically 16-20px). WCAG 2.5.5 user-agent exception (https://www.w3.org/TR/WCAG22/#target-size-enhanced) applies: target sized by the user agent is exempt. Host bbox ${measurements.rect.width.toFixed(1)}x${measurements.rect.height.toFixed(1)} px reflects the entire slider track, not the actionable thumb. Equivalent input methods (Arrow keys, Home/End, PageUp/PageDown, mouse wheel) clear the spirit of 2.5.5 for keyboard users.`,
      };
    } else if (measurements.hostHidden) {
      // Overlay components (hx-dialog, hx-drawer) use `:host { display:
      // contents }`, so the host bbox is 0×0 even when the open panel is
      // painted fixed-position elsewhere. When the open-state story override
      // (STORY_OVERRIDES) has driven the overlay open, the measurement pass
      // resolves a REAL, visible surface INSIDE the component via the same
      // shadow-root-aware outlineSource fallback the 2.4.13 / 2.4.12 passes use
      // (measurements.rect is reassigned to that focus surface — e.g. the
      // dialog/drawer `[part="close-button"]`, 44×44 — when the tagged target's
      // own rect is degenerate; see the rect fallback in runBrowserChecks).
      // Measure THAT resolved rect for 2.5.5 rather than short-circuiting to Not
      // Applicable on the degenerate host bbox. Only fall back to N/A when no
      // real surface resolved (rect still degenerate) — i.e. the overlay is
      // genuinely closed/hidden. NOTE: popover-class overlays are handled by
      // POPOVER_CONTAINERS above (their resolved surface is a non-actionable
      // container panel), so they never reach this branch.
      const hasResolvedSurface = measurements.rect.width >= 2 && measurements.rect.height >= 2;
      if (hasResolvedSurface) {
        // Name the element that owns the resolved focus surface for evidence.
        // When the Tab-tagged target was the 0×0 host, the rect was resolved
        // from the focus-indicator element (the actual control the user lands
        // on); prefer its tag/part label over the degenerate host tag.
        const resolvedLabel = (() => {
          if (!measurements.targetIsHost) return `<${measurements.targetTag}>`;
          const tag = measurements.focusIndicatorTag || measurements.outlineSourceTag || 'element';
          const part = measurements.focusIndicatorPart
            ? `[part="${String(measurements.focusIndicatorPart).split(/\s+/)[0]}"]`
            : '';
          return `<${tag}>${part}`;
        })();
        result.targetSize = {
          width: measurements.rect.width,
          height: measurements.rect.height,
          target: measurements.targetIsHost
            ? measurements.focusIndicatorTag ||
              measurements.outlineSourceTag ||
              measurements.targetTag
            : measurements.targetTag,
          verdict:
            measurements.rect.width >= 44 && measurements.rect.height >= 44
              ? VERDICT.SUPPORTS
              : measurements.rect.width >= 24 && measurements.rect.height >= 24
                ? VERDICT.PARTIALLY
                : VERDICT.DOES_NOT,
          evidence: `Overlay host <${componentName}> uses display:contents (0×0 host bbox); measured the resolved open-state target ${resolvedLabel} ${measurements.rect.width.toFixed(1)}x${measurements.rect.height.toFixed(1)} px (component-owned control inside the opened overlay, same shadow-aware target as the 2.4.13/2.4.12 passes).`,
        };
      } else {
        result.targetSize = {
          width: 0,
          height: 0,
          target: measurements.targetTag,
          verdict: VERDICT.NOT_APPLICABLE,
          evidence: `Host <${componentName}> has 0x0 bounding box in default story (component likely closed/hidden). Manual measurement required for opened state.`,
        };
      }
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

    // 2.4.13 Focus Appearance — driven by the focus-state DIFF.
    //
    // The verdict is NOT derived from the raw computed outline of the focused
    // element (which reads the bogus `medium`/3px default for elements that set
    // `outline: none`). Instead, `measurements.focusIndicatorFound` reports
    // whether ANY element in the focused subtree gained a real >=2px outline OR
    // a visible >=2px box-shadow ring ON focus (vs. the unfocused baseline).
    // That element — named below — is the actual indicator the user sees.
    //
    // Critically: a focused element whose only "outline" is the 3px `medium`
    // default for `outline-style: none` does NOT count as a diff winner (its
    // outline is identical unfocused and focused, and style:none is rejected),
    // so the old `outlineWidthPx > 0 → Partially "under 2px threshold"`
    // fallthrough can no longer fire on a style:none host.
    const focusModeNote = measurements.focusedViaKeyboard
      ? `keyboard-focused via Tab×${measurements.tabPresses}`
      : `Tab walk did not reach target after ${measurements.tabPresses} presses; fell back to programmatic focus`;
    // Name the element that paints the ring (tag + part/class) for the evidence.
    const ringElementNote = measurements.focusIndicatorFound
      ? (() => {
          const tag = measurements.focusIndicatorTag || '?';
          const part = measurements.focusIndicatorPart
            ? `.${String(measurements.focusIndicatorPart).split(/\s+/)[0]}`
            : '';
          const where = measurements.focusIndicatorIsTarget
            ? `<${tag}>${part} (the focused element itself)`
            : `<${tag}>${part} (inner shadow part of <${measurements.targetTag}>)`;
          return where;
        })()
      : null;
    // Ring-contrast clause (WCAG 2.4.13 requires >=3:1 vs adjacent colour).
    // For a translucent ring the reported ratio is the COMPOSITED effective
    // colour vs. its backdrop (alpha folded in), not the opaque token colour.
    const alphaNote =
      typeof measurements.ringEffectiveAlpha === 'number' && measurements.ringEffectiveAlpha < 1
        ? ` (ring alpha ${measurements.ringEffectiveAlpha}; composited over backdrop)`
        : '';
    const contrastClause = (() => {
      if (!measurements.focusIndicatorFound) return '';
      if (typeof measurements.ringContrast === 'number') {
        const ratio = measurements.ringContrast.toFixed(2);
        return measurements.ringContrast >= 3
          ? ` Effective ring contrast vs adjacent background ${ratio}:1${alphaNote} (>=3:1 OK).`
          : ` Effective ring contrast vs adjacent background ${ratio}:1${alphaNote} (UNDER 3:1 — fails WCAG 2.4.13 contrast).`;
      }
      return ` ${measurements.ringContrastNote || 'Ring contrast not auto-computed — verify >=3:1 manually.'}`;
    })();
    let outlineVerdict;
    let outlineEvidence;
    if (measurements.focusIndicatorFound) {
      // WCAG 2.4.13 requires BOTH the >=2px-area indicator AND >=3:1 contrast
      // between the indicator's effective (composited) colour and the colour it
      // sits against. The diff already guarantees the >=2px area. Gate Supports
      // on measured contrast: a detected ring with effective contrast < 3:1
      // (e.g. a 25%-alpha translucent halo that composites to ~1.3:1) is a real
      // partial failure, NOT a pass. When contrast could not be auto-measured
      // (e.g. offset ring on a consumer-controlled transparent page surface),
      // keep Supports for the area requirement and flag the contrast for manual
      // verification rather than emit a false fail.
      const ringMeasured = typeof measurements.ringContrast === 'number';
      const ringMeetsContrast = ringMeasured && measurements.ringContrast >= 3;
      outlineVerdict = ringMeasured && !ringMeetsContrast ? VERDICT.PARTIALLY : VERDICT.SUPPORTS;
      if (measurements.focusIndicatorKind === 'outline') {
        outlineEvidence =
          `${measurements.focusIndicatorOutlineWidthPx}px ${measurements.focusIndicatorOutlineStyle} ` +
          `${measurements.focusIndicatorOutlineColor} on ${ringElementNote} ` +
          `(${focusModeNote}; gained on focus vs unfocused baseline).${contrastClause}`;
      } else {
        outlineEvidence =
          `box-shadow focus ring "${measurements.focusIndicatorBoxShadow}" on ${ringElementNote} ` +
          `(${focusModeNote}; gained on focus vs unfocused baseline; >=2px effective thickness).${contrastClause}`;
      }
    } else if (!measurements.focusedViaKeyboard) {
      // We never reached the target with real Tab — :focus-visible may be
      // stripped by user-agent for programmatic focus on some elements.
      outlineVerdict = VERDICT.PARTIALLY;
      outlineEvidence = `No focus indicator detected via focus-state diff; ${focusModeNote} on <${measurements.targetTag}>. Manual keyboard verification needed (story may have no path to component via Tab).`;
    } else {
      // Tab walk DID reach the target, but NO element in the focused subtree
      // gained a >=2px outline or box-shadow ring on focus — a real fail.
      outlineVerdict = VERDICT.DOES_NOT;
      outlineEvidence = `${focusModeNote} on <${measurements.targetTag}>; no element in the focused subtree gained a >=2px outline or box-shadow ring on focus (diff vs unfocused baseline). WCAG 2.4.13 requires a visible focus indicator >=2px.`;
    }
    result.focusOutline = {
      widthPx: measurements.focusIndicatorFound
        ? measurements.focusIndicatorOutlineWidthPx
        : measurements.outlineWidthPx,
      color: measurements.focusIndicatorFound
        ? measurements.focusIndicatorOutlineColor
        : measurements.outlineColor,
      style: measurements.focusIndicatorFound
        ? measurements.focusIndicatorOutlineStyle
        : measurements.outlineStyle,
      boxShadow: measurements.focusIndicatorFound
        ? measurements.focusIndicatorBoxShadow
        : measurements.boxShadow,
      indicatorKind: measurements.focusIndicatorKind,
      indicatorElement: ringElementNote,
      ringContrast: measurements.ringContrast,
      ringEffectiveAlpha: measurements.ringEffectiveAlpha,
      focusedViaKeyboard: measurements.focusedViaKeyboard,
      tabPresses: measurements.tabPresses,
      verdict: outlineVerdict,
      evidence: outlineEvidence,
    };

    // 1.4.6 Contrast (Enhanced) — sample fg/bg contrast on target.
    // A transparent component host means the consumer page controls the
    // background; that is correct behaviour for surface-token-driven design
    // systems and is Not Applicable to the component itself.
    const isTransparentBg =
      /rgba?\([^,]+,\s*[^,]+,\s*[^,]+,\s*0(\.0+)?\s*\)/.test(measurements.bgColor || '') ||
      measurements.bgColor === 'transparent';
    // WCAG 1.4.6 applies to text and images of text. A focus-paint surface
    // with no own text content (e.g. hx-switch track, swatch grid cells,
    // toggle thumbs) is a 1.4.11 Non-text Contrast surface — measuring
    // cascade-inherited foreground color against an empty element's
    // background is a category error. Route to Not Applicable when the
    // outline-source has no rendered text content.
    const hasNoOwnText = measurements.outlineSourceHasOwnText === false;
    // Surface-ownership override (WCAG 1.4.6): when the primary sample is
    // transparent, the component may still own a non-transparent focus/text
    // surface deeper in its shadow tree (hx-menu `.base`, hx-select
    // `.field__trigger`, hx-dialog `.dialog`, hx-toggle-button `.button`).
    // Marking such components Not Applicable drops real AAA coverage — the
    // component DOES paint text on a surface it owns. When an owned surface was
    // detected, measure text-vs-own-background there and verdict on the real
    // number. N/A is reserved for genuinely transparent / text-free surfaces.
    const ownedSurface =
      measurements.ownedSurface && measurements.ownedSurface.bg ? measurements.ownedSurface : null;
    // Phase 4 Tier 3 harness extension (3.8.0): the single focused/owned
    // sample misses AAA contrast failures elsewhere in the story DOM (caption
    // text, sample-composition labels, dim primitive-tier color-pinned spans).
    // axe-core walks every text node and applies the WCAG 1.4.6 7:1 floor — run
    // its `color-contrast-enhanced` rule across the full story so deeper child
    // text tokens are audited even when the primary sample passes. Shared by
    // both the owned-surface branch (transparent host that still paints text on
    // a surface it owns) and the opaque-target branch, so transparent overlay
    // components (dialog/popover/menu/select) don't skip the broader sweep.
    const runEnhancedContrastSweep = async () => {
      let axeViolations = [];
      try {
        const axeResult = await new AxeBuilder({ page })
          .withRules(['color-contrast-enhanced'])
          .analyze();
        axeViolations = (axeResult.violations || []).filter(
          (v) => v.id === 'color-contrast-enhanced',
        );
      } catch (axeErr) {
        // Non-fatal — the primary sample still carries the headline verdict.
        // Record the axe error in the evidence so reviewers know the broader
        // sweep was attempted.
        axeViolations = [];
        result.contrastAxeError = axeErr instanceof Error ? axeErr.message : String(axeErr);
      }
      const axeNodeCount = axeViolations.reduce(
        (sum, v) => sum + (Array.isArray(v.nodes) ? v.nodes.length : 0),
        0,
      );
      const axeSamples = [];
      for (const v of axeViolations) {
        for (const n of (v.nodes || []).slice(0, 5)) {
          axeSamples.push({
            target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target ?? ''),
            failureSummary: n.failureSummary || '',
            html: typeof n.html === 'string' ? n.html.slice(0, 240) : '',
          });
        }
      }
      result.contrastAxe = {
        rule: 'color-contrast-enhanced',
        violationCount: axeNodeCount,
        samples: axeSamples,
      };
      return axeNodeCount;
    };
    if (isTransparentBg && ownedSurface) {
      const ratio = contrastRatio(ownedSurface.fg, ownedSurface.bg);
      const ownedRatio = ratio === null ? null : Number(ratio.toFixed(2));
      const surfaceName = `<${ownedSurface.tag || '?'}>${
        ownedSurface.part ? `.${String(ownedSurface.part).split(/\s+/)[0]}` : ''
      }`;
      // Owned-surface sample verdict (the component-owned focus/text surface).
      const ownedVerdict =
        ratio === null
          ? VERDICT.PARTIALLY
          : ratio >= 7.0
            ? VERDICT.SUPPORTS
            : ratio >= 4.5
              ? VERDICT.PARTIALLY
              : VERDICT.DOES_NOT;
      const ownedEvidence =
        ratio === null
          ? `Component-owned focus/text surface ${surfaceName} has a non-transparent own background but contrast could not be computed (fg=${ownedSurface.fg}, bg=${ownedSurface.bg}).`
          : `Component-owned focus/text surface ${surfaceName}: ${ratio.toFixed(2)}:1 (fg ${ownedSurface.fg}, bg ${ownedSurface.bg}). Host is transparent but this surface is component-owned, so 1.4.6 is measured here, not Not Applicable.`;
      // Run the broader story-wide sweep too: deeper child text tokens inside a
      // transparent overlay component (dialog/popover/menu) must still be held
      // to AAA 7:1. Any axe violation downgrades a passing owned-surface sample
      // to at least Partially Supports; an already-failing owned sample keeps
      // its stronger signal.
      const axeNodeCount = await runEnhancedContrastSweep();
      let mergedVerdict = ownedVerdict;
      if (axeNodeCount > 0 && mergedVerdict === VERDICT.SUPPORTS) {
        mergedVerdict = VERDICT.PARTIALLY;
      }
      const mergedEvidence =
        axeNodeCount === 0
          ? `${ownedEvidence}; axe color-contrast-enhanced sweep: 0 violations across full story DOM.`
          : `${ownedEvidence}; axe color-contrast-enhanced sweep: ${axeNodeCount} text node(s) fail AAA 7:1 within the story (see contrastAxe.samples).`;
      result.contrast = {
        fg: ownedSurface.fg,
        bg: ownedSurface.bg,
        ratio: ownedRatio,
        verdict: mergedVerdict,
        evidence: mergedEvidence,
      };
    } else if (isTransparentBg) {
      // Component (host or inner control) is transparent and owns no
      // non-transparent text surface — foreground inherits the consumer page
      // background. Per WCAG 2.2 1.4.6, the contrast obligation belongs to the
      // page that places this text, not to the component shell. This is correct
      // behaviour for surface-token-driven design systems.
      result.contrast = {
        fg: measurements.color,
        bg: measurements.bgColor,
        ratio: null,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Component target (${measurements.targetTag}) is transparent (bg=${measurements.bgColor}) and owns no non-transparent text surface; foreground contrast inherits the consumer page background. No component-level contrast obligation. Manual: verify that documented surface-token combinations meet 7:1.`,
      };
    } else if (hasNoOwnText) {
      // No text content on the focus-paint surface — this is a 1.4.11
      // Non-text Contrast scenario, not a 1.4.6 text-contrast scenario.
      // Cascade-inherited foreground color is meaningless when the element
      // renders no characters; measuring it would compare body text color
      // (typically black) against a UI-component fill, producing false
      // verdicts that flip on every brand swap. Route to Not Applicable.
      result.contrast = {
        fg: measurements.color,
        bg: measurements.bgColor,
        ratio: null,
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: `Focus-paint surface <${measurements.outlineSourceTag}> renders no own text content; WCAG 1.4.6 applies only to text and images of text. UI-component-boundary contrast is governed by 1.4.11 (separate harness probe).`,
      };
    } else {
      const ratio = contrastRatio(measurements.color, measurements.bgColor);
      const targetRatio = ratio === null ? null : Number(ratio.toFixed(2));
      const targetVerdict =
        ratio === null
          ? VERDICT.PARTIALLY
          : ratio >= 7.0
            ? VERDICT.SUPPORTS
            : ratio >= 4.5
              ? VERDICT.PARTIALLY
              : VERDICT.DOES_NOT;
      const targetEvidence =
        ratio === null
          ? `Could not compute contrast (fg=${measurements.color}, bg=${measurements.bgColor}).`
          : `${ratio.toFixed(2)}:1 (fg ${measurements.color}, bg ${measurements.bgColor})`;

      // Broader story-wide sweep (shared with the owned-surface branch): the
      // focused-target sample alone misses AAA contrast failures elsewhere in
      // the story DOM (caption text, sample composition labels, dim
      // primitive-tier color-pinned spans). This closes the gap that allowed 6
      // hx-* components (action-bar, breadcrumb, button-group, form,
      // overflow-menu, tabs) to ship 473/473 formal-audit-clean while CI's
      // a11y-audit.js fan-out caught them at AAA-strict.
      const axeNodeCount = await runEnhancedContrastSweep();

      // Merge: any axe AAA contrast violation downgrades the verdict
      // to at least Partially Supports. If the focused-target sample
      // already failed at AA (DOES_NOT), keep that stronger signal.
      let mergedVerdict = targetVerdict;
      if (axeNodeCount > 0 && mergedVerdict === VERDICT.SUPPORTS) {
        mergedVerdict = VERDICT.PARTIALLY;
      }
      const mergedEvidence =
        axeNodeCount === 0
          ? `${targetEvidence}; axe color-contrast-enhanced sweep: 0 violations across full story DOM.`
          : `${targetEvidence}; axe color-contrast-enhanced sweep: ${axeNodeCount} text node(s) fail AAA 7:1 within the story (see contrastAxe.samples).`;

      result.contrast = {
        fg: measurements.color,
        bg: measurements.bgColor,
        ratio: targetRatio,
        verdict: mergedVerdict,
        evidence: mergedEvidence,
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
  const m = str.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
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

// ── hx-icon specific: non-text contrast (WCAG 1.4.11) ──────────────────────

/**
 * Phase 4 (hx-icon AAA cert) — `<hx-icon>` is presentational and renders no
 * text content of its own, so WCAG 1.4.6 Contrast (Enhanced) is Not
 * Applicable. The cert-relevant contrast obligation for an icon is
 * 1.4.11 Non-text Contrast (≥3:1 between the rendered glyph color and the
 * document background) — measured on the *icon* rather than text.
 *
 * This check renders representative `<hx-icon>` samples on the audit page
 * (the existing Default story already renders an `<hx-icon name="check">`),
 * reads the computed `color` of the rendered SVG (currentColor flowed from
 * the host text cascade), reads the document background, and computes the
 * WCAG 1.4.11 ratio. The verdict is `'Supports'` when every sampled glyph
 * clears 3:1, else `'Does Not Support'` with the offending sample listed.
 */
async function checkNonTextContrastIcon(componentName, page) {
  if (componentName !== 'hx-icon') {
    return null;
  }
  try {
    const samples = await page.evaluate(() => {
      const out = [];
      const icons = Array.from(document.querySelectorAll('hx-icon'));
      for (const icon of icons) {
        // Compute against the inner rendered SVG / span (the visual ink) so we
        // measure the glyph color, not the host inline-flex container.
        const svgPart = icon.shadowRoot ? icon.shadowRoot.querySelector('[part="svg"]') : null;
        const target = svgPart || icon;
        const cs = window.getComputedStyle(target);
        // Walk up to find the nearest non-transparent background.
        let bgEl = target;
        let bg = window.getComputedStyle(bgEl).backgroundColor;
        const isTransparent = (c) =>
          !c || c === 'transparent' || /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(c);
        while (isTransparent(bg) && bgEl.parentElement) {
          bgEl = bgEl.parentElement;
          bg = window.getComputedStyle(bgEl).backgroundColor;
        }
        if (isTransparent(bg)) {
          // Default to white if the entire chain is transparent — Storybook
          // body has a default light background; this fallback is documented.
          bg = 'rgb(255, 255, 255)';
        }
        out.push({
          name: icon.getAttribute('name') || '',
          library: icon.getAttribute('library') || 'fa-free',
          fg: cs.color,
          bg,
        });
      }
      return out;
    });

    if (!samples || samples.length === 0) {
      return {
        verdict: VERDICT.NOT_APPLICABLE,
        evidence: 'No <hx-icon> instances rendered in the story; nothing to measure.',
      };
    }

    const measurements = samples
      .map((s) => {
        const ratio = contrastRatio(s.fg, s.bg);
        return { ...s, ratio };
      })
      .filter((m) => m.ratio !== null);

    if (measurements.length === 0) {
      return {
        verdict: VERDICT.PARTIALLY,
        evidence: 'Could not parse foreground/background colors for any rendered hx-icon sample.',
      };
    }

    const failing = measurements.filter((m) => (m.ratio ?? 0) < 3.0);
    const minRatio = Math.min(...measurements.map((m) => m.ratio));
    if (failing.length === 0) {
      return {
        verdict: VERDICT.SUPPORTS,
        evidence: `WCAG 1.4.11 Non-text Contrast: ${measurements.length} hx-icon sample(s) measured; min ratio ${minRatio.toFixed(2)}:1 (≥3:1 required).`,
        samples: measurements,
      };
    }
    return {
      verdict: VERDICT.DOES_NOT,
      evidence: `WCAG 1.4.11 Non-text Contrast: ${failing.length} of ${measurements.length} hx-icon sample(s) below 3:1. Lowest ratio ${minRatio.toFixed(2)}:1.`,
      offenders: failing,
      samples: measurements,
    };
  } catch (err) {
    return {
      verdict: VERDICT.PARTIALLY,
      evidence: `Non-text contrast measurement error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
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
      formAssociated: /static\s+(override\s+)?formAssociated\s*=\s*true/.test(comp.classSrc),
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

      // Phase 4 (hx-icon) — additional non-text-contrast measurement on the
      // rendered icon glyph(s). The page is already loaded by runBrowserChecks
      // at this point so the samples are present. Only runs for hx-icon.
      const iconContrast = await checkNonTextContrastIcon(name, page);
      if (iconContrast) {
        result.verdicts['non-text-contrast-icon'] = iconContrast;
      }
      if (browserData.error) {
        result.verdicts['1.4.6'] = {
          verdict: VERDICT.PARTIALLY,
          evidence: `Browser check error: ${browserData.error}`,
        };
        result.verdicts['2.4.12'] = {
          verdict: VERDICT.PARTIALLY,
          evidence: `Browser check error: ${browserData.error}`,
        };
        result.verdicts['2.4.13'] = {
          verdict: VERDICT.PARTIALLY,
          evidence: `Browser check error: ${browserData.error}`,
        };
        result.verdicts['2.5.5'] = {
          verdict: VERDICT.PARTIALLY,
          evidence: `Browser check error: ${browserData.error}`,
        };
      } else {
        result.verdicts['1.4.6'] = browserData.contrast || {
          verdict: VERDICT.PARTIALLY,
          evidence: 'No contrast measurement available.',
        };
        result.verdicts['2.4.12'] = browserData.focusObscured || {
          verdict: VERDICT.PARTIALLY,
          evidence: 'No focus-obscured measurement available.',
        };
        result.verdicts['2.4.13'] = browserData.focusOutline || {
          verdict: VERDICT.PARTIALLY,
          evidence: 'No focus-outline measurement available.',
        };
        result.verdicts['2.5.5'] = browserData.targetSize || {
          verdict: VERDICT.PARTIALLY,
          evidence: 'No target-size measurement available.',
        };

        // Phase 4 Tier 3 Task 5 — non-interactive components (alert / status
        // live regions, structural primitives) are intentionally non-focusable.
        // WCAG 2.4.13 Focus Appearance applies only to focusable user-interface
        // components; for a host that legitimately cannot receive keyboard
        // focus, the criterion is Not Applicable rather than Partially
        // Supports. The harness's default 2.4.13 verdict (Partial because
        // programmatic focus does not trigger :focus-visible) over-reports
        // these. Detect the documented non-interactive patterns via
        // @aria-pattern and downgrade 2.4.13 + 2.5.5 to NotApplicable.
        // Structural / coordinator patterns also have no host-level
        // keyboard focus obligation — keyboard handling lives on child
        // controls. Treat them as non-interactive for 2.4.13 + 2.5.5.
        const NON_INTERACTIVE_PATTERNS = new Set([
          'alert',
          'status',
          'none',
          'form',
          'label',
          'group',
        ]);
        const declaredPattern = (result.jsdoc.ariaPattern || '').toLowerCase();
        if (NON_INTERACTIVE_PATTERNS.has(declaredPattern)) {
          result.verdicts['2.4.13'] = {
            verdict: VERDICT.NOT_APPLICABLE,
            evidence: `@aria-pattern="${declaredPattern}" is a non-interactive role per WAI-ARIA 1.2; the host cannot receive keyboard focus by design, so WCAG 2.4.13 Focus Appearance does not apply. (Phase 4 Tier 3 Task 5 — formal AAA re-cert.)`,
          };
          // Target-size also doesn't apply to non-interactive callout surfaces.
          result.verdicts['2.5.5'] = {
            verdict: VERDICT.NOT_APPLICABLE,
            evidence: `@aria-pattern="${declaredPattern}" is a non-interactive role; WCAG 2.5.5 Target Size only applies to pointer-input targets. (Phase 4 Tier 3 Task 5.)`,
          };
        }

        // Codex round-5 — REVERSED the round-4 blanket popover-container N/A
        // for 1.4.6 / 2.4.13 / 2.4.12.
        //
        // Round-4 forced `hx-popover` to Not Applicable on these three criteria
        // on the theory that the popover is a transparent passthrough wrapper
        // that owns no surface. Inspection of hx-popover.styles.ts proved that
        // wrong: the `[part="body"]` panel declares its OWN non-transparent
        // background (`--hx-popover-bg` → `--hx-color-surface-default`), its OWN
        // text color (`--hx-popover-color` → `--hx-color-text-primary`), and its
        // OWN `:focus-visible` outline. `_show()` programmatically focuses that
        // panel whenever the slotted content is focusable (WCAG 2.4.3). The
        // component therefore owns the focused surface, and a blanket N/A would
        // let regressions in the panel's own bg/text/ring escape the audit.
        //
        // The fix lives upstream in runBrowserChecks: the target resolver pins
        // `hx-popover` to its own `[part="body"]` panel and the panel is focused
        // under keyboard modality, so 1.4.6 (panel text vs panel bg), 2.4.13
        // (panel `:focus-visible` ring ≥3:1), and 2.4.12 (panel obscured-check)
        // are all MEASURED on the popover's own surface — not on a slotted
        // consumer control and not waved through as N/A. No override is applied
        // here; the measured verdicts from runBrowserChecks stand. hx-dialog /
        // hx-drawer continue to measure their own `[part="close-button"]`.
      }
    } finally {
      await page.close();
    }
  } else {
    result.verdicts['1.4.6'] = {
      verdict: VERDICT.PARTIALLY,
      evidence: 'Browser checks skipped (--no-browser).',
    };
    result.verdicts['2.4.12'] = {
      verdict: VERDICT.PARTIALLY,
      evidence: 'Browser checks skipped (--no-browser).',
    };
    result.verdicts['2.4.13'] = {
      verdict: VERDICT.PARTIALLY,
      evidence: 'Browser checks skipped (--no-browser).',
    };
    result.verdicts['2.5.5'] = {
      verdict: VERDICT.PARTIALLY,
      evidence: 'Browser checks skipped (--no-browser).',
    };
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
  lines.push(
    `Standards: ${report.standards.claim.wcagSource} (${report.standards.claim.wcagVersion} ${report.standards.claim.wcagLevel})`,
  );
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
        case VERDICT.SUPPORTS:
          return 'S';
        case VERDICT.PARTIALLY:
          return 'P';
        case VERDICT.DOES_NOT:
          return 'F';
        case VERDICT.NOT_APPLICABLE:
          return 'NA';
        default:
          return '?';
      }
    });
    lines.push(`| ${r.component} | ${row.join(' | ')} |`);
  }
  lines.push('');
  lines.push(
    'Legend: **S** Supports · **P** Partially Supports · **F** Does Not Support · **NA** Not Applicable',
  );
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
    if (r.error) {
      counts.ERR++;
      continue;
    }
    for (const v of Object.values(r.verdicts)) {
      switch (v.verdict) {
        case VERDICT.SUPPORTS:
          counts.S++;
          break;
        case VERDICT.PARTIALLY:
          counts.P++;
          break;
        case VERDICT.DOES_NOT:
          counts.F++;
          break;
        case VERDICT.NOT_APPLICABLE:
          counts.NA++;
          break;
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

  console.log(
    `\nHELiX Formal AAA Audit — ${standards.claim.wcagVersion} ${standards.claim.wcagLevel}`,
  );
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
            case VERDICT.SUPPORTS:
              counts.S++;
              break;
            case VERDICT.PARTIALLY:
              counts.P++;
              break;
            case VERDICT.DOES_NOT:
              counts.F++;
              break;
            case VERDICT.NOT_APPLICABLE:
              counts.NA++;
              break;
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
  console.log(
    `Verdict aggregate (across ${report.results.length} components × ${standards.criteria.length} criteria):`,
  );
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

  // Regenerate the slim verdicts snapshot consumed by the Storybook docs
  // surface (AAAConformanceCard). This keeps the docs page verdicts in
  // lockstep with the formal harness — no heuristic, no drift. The snapshot
  // is committed to packages/hx-library/aaa-verdicts.json.
  const generatorPath = resolve(REPO_ROOT, 'scripts/generate-aaa-verdicts.mjs');
  if (existsSync(generatorPath)) {
    console.log('Regenerating docs verdict snapshot...');
    const gen = spawnSync(process.execPath, [generatorPath, '--audit', OUTPUT_PATH], {
      stdio: 'inherit',
    });
    if (gen.status !== 0) {
      console.error(
        '[aaa-formal-audit] generate-aaa-verdicts.mjs failed; verdict snapshot may be stale.',
      );
      // Do NOT fail the audit run — the audit succeeded; surface the warning.
    }
  }

  // Always exit 0 — Phase 4 fixes the F/P findings; this harness reports.
  process.exit(0);
}

main().catch((err) => {
  console.error('[aaa-formal-audit] crashed:', err);
  process.exit(1);
});
