#!/usr/bin/env node
/**
 * Story-audit harness — runs across every Storybook story and surfaces
 * accessibility, contrast, invisibility, target-size, and blank-canvas
 * findings. Read-only. Does not modify Storybook source.
 *
 * Usage:
 *   node scripts/audit-stories.mjs [--storybook-url=http://localhost:3151]
 *                                  [--concurrency=4]
 *                                  [--filter=<substring of storyId>]
 *                                  [--limit=<n>]
 *
 * Outputs:
 *   .reports/story-audit/findings.jsonl
 *   .reports/story-audit/summary.md
 *   .reports/story-audit/scoreboard.json
 *   .reports/story-audit/screenshots/<storyId>.png  (only when blank-canvas flagged)
 *
 * Exit codes:
 *   0 — no findings, or only moderate/minor findings
 *   1 — at least one critical or serious finding
 */

import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ----- args -----
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const STORYBOOK_URL = (args['storybook-url'] || 'http://localhost:3151').replace(/\/$/, '');
const CONCURRENCY = Number(args['concurrency'] || 4);
const FILTER = args['filter'] || '';
const LIMIT = args['limit'] ? Number(args['limit']) : Infinity;
const PER_STORY_TIMEOUT_MS = 30_000;
const SETTLE_MS = 500;
// Optional theme override — passed to Storybook iframe via globals query
// param, e.g. --theme=dark or --theme=high-contrast. Empty = default.
const THEME = args['theme'] || '';

const REPORT_DIR = resolve(REPO_ROOT, '.reports/story-audit');
const SCREENSHOT_DIR = resolve(REPORT_DIR, 'screenshots');
const FINDINGS_PATH = resolve(REPORT_DIR, 'findings.jsonl');
const SUMMARY_PATH = resolve(REPORT_DIR, 'summary.md');
const SCOREBOARD_PATH = resolve(REPORT_DIR, 'scoreboard.json');

const AXE_PATH = resolve(REPO_ROOT, 'node_modules/axe-core/axe.min.js');

// ----- helpers -----
function nowMs() {
  return Date.now();
}

function logf(line) {
  process.stderr.write(`${line}\n`);
}

async function fetchIndex() {
  const res = await fetch(`${STORYBOOK_URL}/index.json`);
  if (!res.ok) throw new Error(`Storybook index.json HTTP ${res.status}`);
  const j = await res.json();
  return Object.values(j.entries);
}

function classifyComponent(title) {
  if (!title) return 'Unknown';
  const segs = title.split('/');
  // Storybook organizes most components under "Components/<Name>". Use the
  // second segment for a useful per-component rollup; everything else
  // (Foundations, Drupal, Infrastructure, …) keeps its top-level bucket.
  if (segs[0] === 'Components' && segs[1]) return `Components/${segs[1]}`;
  return segs[0] || 'Unknown';
}

// ----- writer -----
async function ensureClean() {
  if (existsSync(REPORT_DIR)) {
    await rm(REPORT_DIR, { recursive: true, force: true });
  }
  await mkdir(REPORT_DIR, { recursive: true });
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await writeFile(FINDINGS_PATH, '');
}

// ----- collapsible-opener (in-page) -----
// Best-effort: try to open every closed disclosure on the page so the second
// audit pass can see content that was hidden behind a trigger. Returns the
// number of elements actually opened (0 means second pass is unnecessary).
const OPEN_COLLAPSIBLES_FN = `
(() => {
  let opened = 0;
  // 1. <details>
  for (const el of document.querySelectorAll('details:not([open])')) {
    el.open = true;
    opened++;
  }
  // 2. aria-expanded="false" triggers — click them. Includes hx-dropdown
  //    triggers, popover triggers, accordion headers, etc.
  const triggers = Array.from(document.querySelectorAll('[aria-expanded="false"]'));
  // Also include slot=trigger inside hx-* hosts (which may set aria-expanded
  //    on the host rather than the slotted element).
  for (const host of document.querySelectorAll('hx-dropdown, hx-popover, hx-menu, hx-tooltip')) {
    if (host.getAttribute('aria-expanded') === 'false' || host.hasAttribute('open') === false) {
      triggers.push(host);
    }
  }
  for (const el of triggers) {
    try {
      // Prefer click on focusable trigger; fall back to setting open prop.
      if ('open' in el && typeof el.open === 'boolean' && !el.open) {
        el.open = true;
        opened++;
        continue;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        el.click();
        opened++;
      }
    } catch {}
  }
  return opened;
})
`;

// ----- in-page harness body -----
// This runs INSIDE the iframe document. Passed as a function literal to
// page.evaluate. Keeps deps zero (axe injected separately).
const IN_PAGE_AUDIT_FN = `
(async (opts) => {
  const { axeTags, contrastOnly } = opts || {};
  const findings = [];

  // ---------- helpers (in page) ----------
  function rgbStringToRgba(s) {
    if (!s) return null;
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
    if (parts.length < 3) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length === 4 ? parts[3] : 1 };
  }

  function relLum({ r, g, b }) {
    const conv = (v) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * conv(r) + 0.7152 * conv(g) + 0.0722 * conv(b);
  }

  function contrast(fg, bg) {
    if (!fg || !bg) return null;
    const lf = relLum(fg);
    const lb = relLum(bg);
    const a = Math.max(lf, lb);
    const b = Math.min(lf, lb);
    return (a + 0.05) / (b + 0.05);
  }

  function compositeOver(fg, bg) {
    // Alpha-composite fg over bg → opaque rgba.
    const a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  }

  function effectiveBackground(el) {
    let cur = el;
    let acc = null; // accumulating fg-on-bg from element upward
    const root = document.documentElement;
    while (cur && cur.nodeType === 1) {
      const cs = getComputedStyle(cur);
      const bg = rgbStringToRgba(cs.backgroundColor);
      if (bg && bg.a > 0) {
        if (!acc) acc = bg;
        else acc = compositeOver(acc, bg);
        if (acc.a >= 0.999) return acc;
      }
      if (cur === root) break;
      cur = cur.parentElement || cur.parentNode?.host || null;
    }
    // default: white canvas
    if (!acc) return { r: 255, g: 255, b: 255, a: 1 };
    if (acc.a < 1) acc = compositeOver(acc, { r: 255, g: 255, b: 255, a: 1 });
    return acc;
  }

  function nearestTextBearing(node) {
    let p = node.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') return p;
      p = p.parentElement;
    }
    return null;
  }

  function isVisible(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    return true;
  }

  function elementSelector(el) {
    if (!el) return '';
    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && cur.nodeType === 1 && depth < 5) {
      const tag = cur.tagName.toLowerCase();
      let s = tag;
      if (cur.id) {
        s += '#' + cur.id;
        parts.unshift(s);
        break;
      }
      if (cur.className && typeof cur.className === 'string') {
        const cls = cur.className.trim().split(/\\s+/).slice(0, 2).join('.');
        if (cls) s += '.' + cls;
      }
      parts.unshift(s);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function isInsideShadow(el) {
    let cur = el;
    while (cur) {
      const root = cur.getRootNode && cur.getRootNode();
      if (root && root instanceof ShadowRoot) return root.host?.tagName?.toLowerCase() || 'shadow';
      cur = cur.parentElement || cur.parentNode;
      if (cur === document) return false;
    }
    return false;
  }

  function classifyRoot(el) {
    const shadowHost = isInsideShadow(el);
    if (shadowHost && shadowHost.startsWith && shadowHost.startsWith('hx-')) return 'broken-component';
    return 'broken-sample';
  }

  function truncate(s, n) {
    s = (s || '').replace(/\\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n) + '...' : s;
  }

  // ---------- A. axe-core ----------
  let axeResult = { violations: [] };
  if (!contrastOnly) try {
    axeResult = await window.axe.run(document, {
      runOnly: { type: 'tag', values: axeTags },
      resultTypes: ['violations'],
    });
  } catch (e) {
    findings.push({
      severity: 'moderate',
      category: 'axe',
      rootCause: 'unknown',
      summary: 'axe-core run failed: ' + (e.message || String(e)),
      details: { error: String(e) },
    });
  }
  for (const v of axeResult.violations || []) {
    const sev = v.impact === 'critical' ? 'critical'
      : v.impact === 'serious' ? 'serious'
      : v.impact === 'moderate' ? 'moderate'
      : 'minor';
    for (const node of v.nodes.slice(0, 3)) {
      findings.push({
        severity: sev,
        category: 'axe',
        rootCause: 'unknown',
        summary: v.id + ': ' + (v.help || v.description || ''),
        details: {
          ruleId: v.id,
          impact: v.impact,
          tags: v.tags,
          target: node.target,
          html: truncate(node.html, 240),
          failureSummary: truncate(node.failureSummary || '', 400),
          helpUrl: v.helpUrl,
        },
      });
    }
  }

  // ---------- B/C. text walker — contrast + invisible text ----------
  // Walk only nodes within document.body. Limit to 800 text nodes to bound work.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('script,style,noscript,template')) return NodeFilter.FILTER_REJECT;
      if (!isVisible(p)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let textCount = 0;
  while (walker.nextNode() && textCount < 800) {
    textCount++;
    const node = walker.currentNode;
    const parent = node.parentElement;
    const cs = getComputedStyle(parent);
    const fg = rgbStringToRgba(cs.color);
    if (!fg) continue;
    const bg = effectiveBackground(parent);
    if (!bg) continue;
    const fgComposed = fg.a < 1 ? compositeOver(fg, bg) : fg;
    const cr = contrast(fgComposed, bg);
    if (cr == null) continue;

    const fontSizePx = parseFloat(cs.fontSize) || 16;
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
    const aaaThreshold = isLarge ? 4.5 : 7;
    const aaThreshold = isLarge ? 3 : 4.5;

    const luminanceDelta = Math.abs(relLum(fgComposed) - relLum(bg));

    // C. invisible text — flag first
    if (luminanceDelta < 0.05 || cr < 1.3) {
      findings.push({
        severity: 'critical',
        category: 'invisible-text',
        rootCause: classifyRoot(parent),
        summary: 'Text is effectively invisible against its background (contrast ' + cr.toFixed(2) + ':1, lum delta ' + luminanceDelta.toFixed(3) + ')',
        details: {
          text: truncate(node.nodeValue, 60),
          fg: cs.color,
          bg: 'rgba(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ',' + bg.a + ')',
          contrast: Number(cr.toFixed(2)),
          luminanceDelta: Number(luminanceDelta.toFixed(3)),
          fontSizePx,
          fontWeight,
          selector: elementSelector(parent),
          inShadow: isInsideShadow(parent),
        },
      });
      continue;
    }

    // B. AAA contrast
    if (cr < aaaThreshold) {
      const sev = cr < aaThreshold ? 'serious' : 'moderate';
      findings.push({
        severity: sev,
        category: 'contrast',
        rootCause: classifyRoot(parent),
        summary: 'Contrast ' + cr.toFixed(2) + ':1 below AAA threshold ' + aaaThreshold + ':1 (' + (isLarge ? 'large' : 'body') + ' text)',
        details: {
          text: truncate(node.nodeValue, 60),
          fg: cs.color,
          bg: 'rgba(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ',' + bg.a + ')',
          contrast: Number(cr.toFixed(2)),
          fontSizePx,
          fontWeight,
          aaaThreshold,
          aaThreshold,
          selector: elementSelector(parent),
          inShadow: isInsideShadow(parent),
        },
      });
    }
  }

  // ---------- D. target-size ----------
  if (contrastOnly) return findings;
  const interactiveSelectors = [
    '[role="button"]','button','[role="menuitem"]','a[href]','[role="tab"]',
    '[role="checkbox"]','[role="radio"]','[role="switch"]','[role="option"]',
    'input:not([type="hidden"])','select',
  ];
  const interactiveEls = Array.from(document.querySelectorAll(interactiveSelectors.join(',')));
  for (const el of interactiveEls) {
    if (!isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const min = Math.min(r.width, r.height);
    if (min < 24) {
      findings.push({
        severity: 'serious',
        category: 'target-size',
        rootCause: classifyRoot(el),
        summary: 'Interactive target ' + Math.round(r.width) + '×' + Math.round(r.height) + 'px below WCAG 2.5.8 AA minimum (24×24)',
        details: {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || null,
          width: Math.round(r.width),
          height: Math.round(r.height),
          selector: elementSelector(el),
          inShadow: isInsideShadow(el),
        },
      });
    } else if (min < 44) {
      findings.push({
        severity: 'minor',
        category: 'target-size',
        rootCause: classifyRoot(el),
        summary: 'Interactive target ' + Math.round(r.width) + '×' + Math.round(r.height) + 'px below WCAG 2.5.5 Enhanced (44×44)',
        details: {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || null,
          width: Math.round(r.width),
          height: Math.round(r.height),
          selector: elementSelector(el),
          inShadow: isInsideShadow(el),
        },
      });
    }
  }

  return findings;
})
`;

// ----- per-story audit -----
async function auditOne(browserContext, entry, axeSource) {
  const result = {
    storyId: entry.id,
    storyTitle: entry.title,
    storyName: entry.name,
    viewMode: entry.type === 'docs' ? 'docs' : 'story',
    findings: [],
    error: null,
    durationMs: 0,
  };
  const start = nowMs();
  const page = await browserContext.newPage();

  try {
    page.setDefaultTimeout(PER_STORY_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PER_STORY_TIMEOUT_MS);

    // Suppress console noise from the iframe.
    page.on('pageerror', () => {});
    page.on('console', () => {});

    const themeQuery = THEME ? `&globals=theme:${encodeURIComponent(THEME)}` : '';
    const url = `${STORYBOOK_URL}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${result.viewMode}${themeQuery}`;

    const navP = page.goto(url, { waitUntil: 'networkidle', timeout: PER_STORY_TIMEOUT_MS });
    await Promise.race([
      navP,
      new Promise((_, rej) => setTimeout(() => rej(new Error('nav-timeout')), PER_STORY_TIMEOUT_MS)),
    ]);
    await page.waitForTimeout(SETTLE_MS);

    // Inject axe-core directly (path-based — bundled with the project).
    await page.addScriptTag({ content: axeSource });

    // Run audits.
    const axeTags = [
      'wcag2a','wcag2aa','wcag2aaa',
      'wcag21a','wcag21aa','wcag21aaa',
      'wcag22aa','wcag22aaa',
      'best-practice',
    ];
    // page.evaluate(string) requires a single expression that evaluates to a
    // value. We pass the IIFE-style invocation so the body resolves to the
    // findings array.
    const evalSrc = `(${IN_PAGE_AUDIT_FN})({ axeTags: ${JSON.stringify(axeTags)} })`;
    const findings = await page.evaluate(evalSrc);

    // Second pass — open collapsible UI (popovers, menus, details, dropdowns)
    // and re-run the contrast + invisible-text checks. This surfaces text that
    // is hidden behind a closed trigger by default. Critical for catching the
    // hx-dropdown menu items class of finding (Edit/Duplicate invisible).
    if (result.viewMode === 'story') {
      try {
        const opened = await page.evaluate(`(${OPEN_COLLAPSIBLES_FN})()`);
        if (opened > 0) {
          await page.waitForTimeout(300);
          const evalSrc2 = `(${IN_PAGE_AUDIT_FN})({ axeTags: ${JSON.stringify(axeTags)}, contrastOnly: true })`;
          const more = await page.evaluate(evalSrc2);
          const seen = new Set(
            findings.map(
              (f) => `${f.category}|${f.summary}|${f.details && f.details.selector ? f.details.selector : ''}`,
            ),
          );
          for (const f of more) {
            const key = `${f.category}|${f.summary}|${f.details && f.details.selector ? f.details.selector : ''}`;
            if (!seen.has(key)) {
              seen.add(key);
              f.details = { ...f.details, afterOpenCollapsibles: true };
              findings.push(f);
            }
          }
        }
      } catch {
        // non-fatal — continue
      }
    }

    // E. blank-canvas detector — story view only.
    if (result.viewMode === 'story') {
      try {
        const buf = await page.screenshot({ type: 'png', fullPage: false, timeout: 10_000 });
        const blank = await analyzeBlankCanvas(buf);
        if (blank.flag) {
          const screenshotPath = resolve(SCREENSHOT_DIR, `${entry.id}.png`);
          await writeFile(screenshotPath, buf);
          findings.push({
            severity: 'serious',
            category: 'blank-canvas',
            rootCause: 'unknown',
            summary: `Blank canvas — only ${(blank.nonBgRatio * 100).toFixed(1)}% non-background pixels`,
            details: {
              nonBackgroundRatio: Number(blank.nonBgRatio.toFixed(4)),
              dominantBgLuminance: Number(blank.dominantLum.toFixed(2)),
              screenshot: screenshotPath.replace(REPO_ROOT + '/', ''),
            },
          });
        }
      } catch (e) {
        // non-fatal
      }
    }

    result.findings = findings;
  } catch (e) {
    result.error = e.message || String(e);
    result.findings.push({
      severity: 'serious',
      category: 'axe',
      rootCause: 'unknown',
      summary: `Story failed to audit: ${result.error}`,
      details: { error: result.error },
    });
  } finally {
    await page.close().catch(() => {});
  }
  result.durationMs = nowMs() - start;
  return result;
}

// ----- blank-canvas analyzer -----
// Pure-JS minimal PNG decoder using node:zlib. Handles the only PNG variant
// Playwright emits: 8-bit RGBA non-interlaced (color type 6, bit depth 8).
import { inflateSync } from 'node:zlib';

function decodePngRgba8(buf) {
  // PNG signature
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return null;
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); off += 4;
    const type = buf.toString('ascii', off, off + 4); off += 4;
    const data = buf.subarray(off, off + len); off += len;
    off += 4; // CRC
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  if (interlace !== 0) return null;
  if (bitDepth !== 8) return null;
  // colorType: 6=RGBA, 2=RGB, 0=gray, 4=gray+alpha. We only need RGB/RGBA.
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 0 ? 1 : 0;
  if (channels === 0) return null;
  const raw = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  // un-filter scanlines
  const out = Buffer.alloc(stride * height);
  let prevLine = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const inOff = y * (stride + 1);
    const filter = raw[inOff];
    const line = raw.subarray(inOff + 1, inOff + 1 + stride);
    const dst = out.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? dst[x - channels] : 0;
      const b = prevLine[x];
      const c = x >= channels ? prevLine[x - channels] : 0;
      let v;
      switch (filter) {
        case 0: v = line[x]; break;
        case 1: v = line[x] + a; break;
        case 2: v = line[x] + b; break;
        case 3: v = line[x] + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = line[x] + pred;
          break;
        }
        default: return null;
      }
      dst[x] = v & 0xff;
    }
    prevLine = dst;
  }
  return { width, height, channels, data: out };
}

async function analyzeBlankCanvas(pngBuffer) {
  let img;
  try {
    img = decodePngRgba8(pngBuffer);
  } catch {
    return { flag: false, nonBgRatio: 1, dominantLum: 0 };
  }
  if (!img) return { flag: false, nonBgRatio: 1, dominantLum: 0 };
  const { width: w, height: h, channels: ch, data: bytes } = img;
  const buckets = new Map();
  let total = 0;
  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const i = (y * w + x) * ch;
      const r = bytes[i];
      const g = ch >= 3 ? bytes[i + 1] : r;
      const b = ch >= 3 ? bytes[i + 2] : r;
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
      buckets.set(lum, (buckets.get(lum) || 0) + 1);
      total++;
    }
  }
  let bestCount = 0;
  let bestLum = 255;
  for (const [lum] of buckets) {
    let agg = 0;
    for (let d = -5; d <= 5; d++) agg += buckets.get(lum + d) || 0;
    if (agg > bestCount) {
      bestCount = agg;
      bestLum = lum;
    }
  }
  const nonBg = total - bestCount;
  const nonBgRatio = total > 0 ? nonBg / total : 1;
  return { flag: nonBgRatio < 0.02, nonBgRatio, dominantLum: bestLum };
}

// ----- main -----
async function main() {
  // Sanity-check Storybook + axe.
  if (!existsSync(AXE_PATH)) {
    throw new Error(`axe-core missing: ${AXE_PATH}`);
  }
  const axeSource = await readFile(AXE_PATH, 'utf8');
  await ensureClean();

  let entries = await fetchIndex();
  if (FILTER) entries = entries.filter((e) => e.id.includes(FILTER) || (e.title || '').includes(FILTER));
  if (Number.isFinite(LIMIT)) entries = entries.slice(0, LIMIT);

  logf(`[story-audit] ${entries.length} entries (filter='${FILTER}', limit=${LIMIT})`);
  logf(`[story-audit] concurrency=${CONCURRENCY} timeout=${PER_STORY_TIMEOUT_MS}ms`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const queue = [...entries];
  const results = [];
  let completed = 0;
  const started = nowMs();

  // Open file in append mode for streaming finding writes.
  async function appendFindings(result) {
    if (!result.findings.length) return;
    const lines = result.findings.map((f) =>
      JSON.stringify({
        storyId: result.storyId,
        storyTitle: result.storyTitle,
        storyName: result.storyName,
        viewMode: result.viewMode,
        ...f,
      }),
    );
    const { appendFile } = await import('node:fs/promises');
    await appendFile(FINDINGS_PATH, lines.join('\n') + '\n');
  }

  async function worker(workerId) {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) return;
      try {
        const r = await auditOne(context, entry, axeSource);
        results.push(r);
        await appendFindings(r);
        completed++;
        if (completed % 25 === 0 || completed === entries.length) {
          const elapsed = (nowMs() - started) / 1000;
          const rate = completed / elapsed;
          const remaining = entries.length - completed;
          const eta = remaining / Math.max(rate, 0.1);
          logf(
            `[story-audit] ${completed}/${entries.length} (${(rate).toFixed(2)}/s, ETA ${(eta / 60).toFixed(1)}min, findings=${results.reduce((a, b) => a + b.findings.length, 0)})`,
          );
        }
      } catch (e) {
        logf(`[story-audit] worker ${workerId} unexpected: ${e.message}`);
        const r = {
          storyId: entry.id,
          storyTitle: entry.title,
          storyName: entry.name,
          viewMode: entry.type === 'docs' ? 'docs' : 'story',
          findings: [
            {
              severity: 'serious',
              category: 'axe',
              rootCause: 'unknown',
              summary: 'worker error: ' + e.message,
              details: { error: e.message },
            },
          ],
          error: e.message,
          durationMs: 0,
        };
        results.push(r);
        await appendFindings(r);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i));
  await Promise.all(workers);

  await context.close();
  await browser.close();

  // ----- aggregate -----
  const byComponent = new Map();
  let totalFindings = 0;
  let critical = 0;
  let serious = 0;
  let moderate = 0;
  let minor = 0;
  const categoryHistogram = {};
  const rootCauseHistogram = {};
  for (const r of results) {
    const comp = classifyComponent(r.storyTitle);
    if (!byComponent.has(comp)) byComponent.set(comp, { findings: [], stories: 0 });
    const slot = byComponent.get(comp);
    slot.stories += 1;
    for (const f of r.findings) {
      totalFindings++;
      slot.findings.push({ ...f, storyId: r.storyId, storyName: r.storyName, viewMode: r.viewMode });
      if (f.severity === 'critical') critical++;
      else if (f.severity === 'serious') serious++;
      else if (f.severity === 'moderate') moderate++;
      else minor++;
      categoryHistogram[f.category] = (categoryHistogram[f.category] || 0) + 1;
      rootCauseHistogram[f.rootCause] = (rootCauseHistogram[f.rootCause] || 0) + 1;
    }
  }

  // ----- scoreboard.json -----
  const scoreboard = {
    generatedAt: new Date().toISOString(),
    storybookUrl: STORYBOOK_URL,
    entriesAudited: results.length,
    durationSec: Math.round((nowMs() - started) / 1000),
    totalFindings,
    severity: { critical, serious, moderate, minor },
    categoryHistogram,
    rootCauseHistogram,
    components: Object.fromEntries(
      [...byComponent.entries()]
        .map(([comp, slot]) => [
          comp,
          {
            stories: slot.stories,
            findings: slot.findings.length,
            byCategory: slot.findings.reduce((acc, f) => {
              acc[f.category] = (acc[f.category] || 0) + 1;
              return acc;
            }, {}),
            bySeverity: slot.findings.reduce((acc, f) => {
              acc[f.severity] = (acc[f.severity] || 0) + 1;
              return acc;
            }, {}),
          },
        ])
        .sort((a, b) => b[1].findings - a[1].findings),
    ),
  };
  await writeFile(SCOREBOARD_PATH, JSON.stringify(scoreboard, null, 2));

  // ----- summary.md -----
  const lines = [];
  lines.push(`# Story Audit Summary`);
  lines.push('');
  lines.push(`- Generated: ${scoreboard.generatedAt}`);
  lines.push(`- Storybook: ${STORYBOOK_URL}`);
  lines.push(`- Stories audited: **${results.length}**`);
  lines.push(`- Duration: **${scoreboard.durationSec}s**`);
  lines.push(`- Total findings: **${totalFindings}**`);
  lines.push(`  - Critical: ${critical}`);
  lines.push(`  - Serious: ${serious}`);
  lines.push(`  - Moderate: ${moderate}`);
  lines.push(`  - Minor: ${minor}`);
  lines.push('');
  lines.push(`## Category histogram`);
  for (const [k, v] of Object.entries(categoryHistogram).sort((a, b) => b[1] - a[1])) {
    lines.push(`- \`${k}\`: ${v}`);
  }
  lines.push('');
  lines.push(`## Root-cause classification`);
  for (const [k, v] of Object.entries(rootCauseHistogram).sort((a, b) => b[1] - a[1])) {
    lines.push(`- \`${k}\`: ${v}`);
  }
  lines.push('');
  lines.push(`## Components (sorted by finding count)`);
  for (const [comp, slot] of [...byComponent.entries()].sort((a, b) => b[1].findings.length - a[1].findings.length)) {
    if (slot.findings.length === 0) continue;
    lines.push('');
    lines.push(`### ${comp} — ${slot.findings.length} finding(s) across ${slot.stories} stor${slot.stories === 1 ? 'y' : 'ies'}`);
    // Group by severity.
    for (const sev of ['critical', 'serious', 'moderate', 'minor']) {
      const subset = slot.findings.filter((f) => f.severity === sev);
      if (!subset.length) continue;
      lines.push('');
      lines.push(`#### ${sev} (${subset.length})`);
      for (const f of subset.slice(0, 30)) {
        const detail = (() => {
          if (f.category === 'invisible-text' || f.category === 'contrast') {
            return `text="${(f.details.text || '').replace(/"/g, '\\"')}" fg=${f.details.fg} bg=${f.details.bg} contrast=${f.details.contrast}`;
          }
          if (f.category === 'target-size') {
            return `${f.details.width}x${f.details.height}px ${f.details.tag}`;
          }
          if (f.category === 'axe') {
            return f.details.ruleId || '';
          }
          if (f.category === 'blank-canvas') {
            return `non-bg=${(f.details.nonBackgroundRatio * 100).toFixed(2)}%`;
          }
          return '';
        })();
        lines.push(`- [${f.rootCause}] \`${f.storyId}\` (${f.storyName}) — ${f.summary} — ${detail}`);
      }
      if (subset.length > 30) {
        lines.push(`- … ${subset.length - 30} more`);
      }
    }
  }
  await writeFile(SUMMARY_PATH, lines.join('\n') + '\n');

  // ----- exit code -----
  const exit = critical > 0 || serious > 0 ? 1 : 0;
  logf(`[story-audit] DONE — totalFindings=${totalFindings} critical=${critical} serious=${serious} moderate=${moderate} minor=${minor}`);
  logf(`[story-audit] reports written to ${REPORT_DIR}`);
  process.exit(exit);
}

main().catch((e) => {
  logf(`[story-audit] FATAL: ${e.stack || e.message || String(e)}`);
  process.exit(2);
});
