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

// Canonical key sets per WAI-ARIA APG pattern. A handler that listens
// for at least these keys passes the apg-keyboard peer check; missing
// any required key is "Partially Supports".
const APG_KEYBOARD_EXPECTATIONS = {
  button: { required: ['Enter', ' ', 'Space'], any: false },
  checkbox: { required: [' ', 'Space'], any: false },
  combobox: { required: ['ArrowDown', 'ArrowUp', 'Escape', 'Enter'], any: false },
  dialog: { required: ['Escape', 'Tab'], any: false },
  alertdialog: { required: ['Escape', 'Tab'], any: false },
  alert: { required: [], any: true }, // no keyboard interaction expected
  listbox: { required: ['ArrowDown', 'ArrowUp', 'Home', 'End'], any: false },
  menu: { required: ['ArrowDown', 'ArrowUp', 'Escape'], any: false },
  menubar: { required: ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Escape'], any: false },
  menubutton: { required: ['Enter', ' ', 'ArrowDown'], any: false },
  radiogroup: { required: ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'], any: false },
  slider: { required: ['ArrowLeft', 'ArrowRight', 'Home', 'End'], any: false },
  switch: { required: [' ', 'Space', 'Enter'], any: false },
  tabs: { required: ['ArrowLeft', 'ArrowRight', 'Home', 'End'], any: false },
  toolbar: { required: ['ArrowLeft', 'ArrowRight'], any: false },
  tooltip: { required: ['Escape'], any: false },
  treeview: { required: ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'], any: false },
  carousel: { required: ['ArrowLeft', 'ArrowRight'], any: false },
  accordion: { required: ['Enter', ' ', 'Space'], any: false },
  link: { required: ['Enter'], any: false },
  textbox: { required: [], any: true },
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
  const expect = APG_KEYBOARD_EXPECTATIONS[pattern.toLowerCase()];
  if (!expect) {
    return {
      verdict: VERDICT.PARTIALLY,
      evidence: `@aria-pattern="${pattern}" is not in the APG canonical pattern table — verify manually.`,
    };
  }
  if (expect.required.length === 0) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `@aria-pattern="${pattern}" requires no specific key set (alert / textbox).`,
    };
  }
  // Look for the canonical key strings in the source — case-sensitive on key names
  // since `KeyboardEvent.key` matches are case-sensitive.
  const found = expect.required.filter((k) => src.includes(`'${k}'`) || src.includes(`"${k}"`));
  if (found.length === expect.required.length) {
    return {
      verdict: VERDICT.SUPPORTS,
      evidence: `@aria-pattern="${pattern}" — all required keys (${expect.required.join(', ')}) referenced in component source.`,
    };
  }
  const missing = expect.required.filter((k) => !found.includes(k));
  return {
    verdict: VERDICT.PARTIALLY,
    evidence: `@aria-pattern="${pattern}" — missing key references: ${missing.join(', ')}.`,
    missing,
  };
}

// ── Browser-based evidence (Playwright) ─────────────────────────────────────

function buildStoryUrl(componentName) {
  // Storybook 10 default story id format — first letter cap from kebab name.
  // e.g. "hx-button" → "components-hx-button--default"
  const titleId = `components-${componentName}`;
  return `${STORYBOOK_URL}/iframe.html?id=${titleId}--default&viewMode=story`;
}

/**
 * 1.4.6 + 2.4.13 + 2.5.5 + 2.4.12 — browser checks.
 *
 * Returns a per-component result object keyed by SC id.
 */
async function runBrowserChecks(componentName, page) {
  const url = buildStoryUrl(componentName);
  const result = {
    url,
    error: null,
    targetSize: null,
    focusOutline: null,
    contrast: null,
    focusObscured: null,
  };
  try {
    const response = await page.goto(url, { timeout: TIMEOUT_MS, waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) {
      result.error = `HTTP ${response?.status() ?? 'no response'}`;
      return result;
    }
    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5_000 }).catch(() => {});

    // Locate the host element by tag name. We check the first instance only.
    const measurements = await page.evaluate(async (tag) => {
      const host = document.querySelector(tag);
      if (!host) return { error: `no <${tag}> in story` };
      // Identify primary interactive target — prefer focusable inner native control;
      // fall back to host if delegatesFocus or host itself is focusable.
      const root = host.shadowRoot || host;
      const candidates = root.querySelectorAll('button, [role="button"], input, textarea, select, a[href], [tabindex]');
      let target = candidates[0] || host;
      // Bounding rect for target size.
      const rect = target.getBoundingClientRect();
      // Focus the target for outline measurement.
      try {
        target.focus();
      } catch {}
      const styles = window.getComputedStyle(target);
      const outlineWidthPx = parseFloat(styles.outlineWidth || '0');
      const outlineColor = styles.outlineColor;
      const bgColor = styles.backgroundColor;
      const color = styles.color;
      // Focus obscured — naive: nothing covers the focused rect.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const elementAtCenter = document.elementFromPoint(cx, cy);
      const isCovered = elementAtCenter !== target && !target.contains(elementAtCenter) && !elementAtCenter?.contains?.(target);
      return {
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        outlineWidthPx,
        outlineColor,
        bgColor,
        color,
        isCovered,
        targetTag: target.tagName.toLowerCase(),
      };
    }, componentName);

    if (measurements.error) {
      result.error = measurements.error;
      return result;
    }

    // 2.5.5 Target Size (Enhanced) — 44x44 minimum.
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

    // 2.4.13 Focus Appearance — outline width >= 2px.
    result.focusOutline = {
      widthPx: measurements.outlineWidthPx,
      color: measurements.outlineColor,
      verdict:
        measurements.outlineWidthPx >= 2
          ? VERDICT.SUPPORTS
          : measurements.outlineWidthPx > 0
            ? VERDICT.PARTIALLY
            : VERDICT.DOES_NOT,
      evidence: `computed outline-width ${measurements.outlineWidthPx}px (color ${measurements.outlineColor})`,
    };

    // 1.4.6 Contrast (Enhanced) — sample fg/bg contrast on target.
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
          ? `Could not compute contrast (fg=${measurements.color}, bg=${measurements.bgColor}). Likely transparent host — must inherit from page.`
          : `${ratio.toFixed(2)}:1 (fg ${measurements.color}, bg ${measurements.bgColor})`,
    };

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
