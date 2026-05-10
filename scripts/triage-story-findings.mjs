#!/usr/bin/env node
/**
 * triage-story-findings.mjs
 *
 * Consumer of `.reports/story-audit/findings.jsonl` (emitted by
 * `scripts/audit-stories.mjs`). Strips Storybook-iframe noise, groups by
 * (component, severity, root-cause), and emits `.reports/story-audit/triage.md`
 * — a ranked playbook the fix-iteration agents work from.
 *
 * Usage:
 *   node scripts/triage-story-findings.mjs
 *   node scripts/triage-story-findings.mjs --in=.reports/story-audit/findings.jsonl --out=.reports/story-audit/triage.md
 *   node scripts/triage-story-findings.mjs --severity-floor=serious   # drop minor + moderate
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { argv } from 'node:process';

const args = Object.fromEntries(
  argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    }),
);

const IN = resolve(args.in || '.reports/story-audit/findings.jsonl');
const OUT = resolve(args.out || '.reports/story-audit/triage.md');
const SEVERITY_FLOOR = args['severity-floor'] || 'minor';

const SEVERITY_RANK = { critical: 4, serious: 3, moderate: 2, minor: 1 };
const FLOOR_RANK = SEVERITY_RANK[SEVERITY_FLOOR] ?? 1;

/**
 * Axe rules that always fire on Storybook iframes regardless of component
 * quality. Each story renders alone in an iframe with no <main>, no <h1>, no
 * landmarks — those are a Storybook architectural fact, not a component
 * failure. Drop them universally.
 */
const NOISE_RULES = new Set([
  'landmark-one-main',
  'page-has-heading-one',
  'region',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-banner-is-top-level',
  'landmark-contentinfo-is-top-level',
  'landmark-main-is-top-level',
  'landmark-complementary-is-top-level',
  'bypass',
  'html-has-lang',
  'html-lang-valid',
  'document-title',
]);

/**
 * For docs (MDX) pages: axe rules that legitimately could fire on docs but
 * are not actionable signal for an icons release — docs are content, and
 * landmarks/headings in docs are the docs author's responsibility, not
 * a per-story remediation.
 */
const DOCS_NOISE_RULES = new Set([...NOISE_RULES, 'heading-order', 'duplicate-id']);

/**
 * Parse component name from a story title like "Components/Dropdown" or
 * "Foundations/Iconography" — returns the first non-prefix segment.
 */
function componentFromTitle(title) {
  if (!title) return '_uncategorized';
  const parts = title.split('/');
  if (parts.length === 1) return parts[0].toLowerCase();
  if (parts[0].toLowerCase() === 'components' && parts[1]) return parts[1].toLowerCase();
  return parts.slice(0, 2).join('/').toLowerCase();
}

/**
 * Storybook chrome selectors — TOC nav, docblock surrounds, css-in-js hashed
 * classes from Storybook addons. Findings on these are NOT our components and
 * NOT actionable for the icons epic. Drop them.
 */
const STORYBOOK_CHROME_PATTERNS = [
  /\.toc-/,
  /\.sbdocs/,
  /\.docblock/,
  /nav\.css-[a-z0-9]+/,
  /\.css-[a-z0-9]+\b/, // CSS-in-JS hashed class from Storybook (NOT our hx-css-*)
  /sb-show-/,
  /sb-tab/,
  /sb-bar/,
  /sb-loader/,
  /sb-anchor/,
  /\.argstable/,
  /\.docs-story/,
  /\.css-1[a-z0-9]/,
  /aria-controls="storybook-/,
];

/**
 * Storybook addon UI text content — Source addon ("Show code"/"Copy code"),
 * a11y addon ("Hide Accessibility items"), argstable headers
 * ("Name"/"Description"/"Default"/"Control"). These are not our components.
 */
const STORYBOOK_CHROME_TEXTS = new Set([
  'Show code',
  'Copy code',
  'Hide Accessibility items',
  'Show Accessibility items',
  'Name',
  'Description',
  'Default',
  'Control',
  'Reset args',
  'Open canvas in new tab',
  'Open in new tab',
  'Sources',
  'Source',
  'Subcomponents',
  'Stories',
]);

/**
 * Storybook itself decides whether the autodocs page is a "Docs" view.
 * Findings on a Docs page are LESS likely to be component bugs and MORE
 * likely to be Storybook chrome rendering. We tighten the noise filter
 * for `viewMode: docs` accordingly.
 */
function isStorybookChromeText(finding) {
  const text = finding.details?.text;
  if (!text) return false;
  if (finding.viewMode !== 'docs') return false;
  return STORYBOOK_CHROME_TEXTS.has(text.trim());
}

function isStorybookChrome(selector) {
  if (!selector) return false;
  return STORYBOOK_CHROME_PATTERNS.some((rx) => rx.test(selector));
}

function isNoise(finding) {
  // Axe rule noise (always-fire on Storybook iframes)
  if (finding.category === 'axe') {
    const rule = finding.details?.ruleId || finding.details?.rule || '';
    if (finding.viewMode === 'docs') return DOCS_NOISE_RULES.has(rule);
    if (NOISE_RULES.has(rule)) return true;
  }

  // Selector-based chrome noise (target-size, contrast, invisible-text against
  // Storybook's own UI elements that we don't ship). Two selector locations:
  // - `details.selector` for harness-emitted findings (target-size, contrast,
  //   invisible-text)
  // - `details.target[0]` for axe-emitted findings (axe categorizes targets
  //   as an array of CSS selectors)
  const sel =
    finding.details?.selector ||
    (Array.isArray(finding.details?.target) ? finding.details.target[0] : '') ||
    '';
  if (isStorybookChrome(sel)) return true;

  // Axe HTML-snippet check — Storybook injects empty `<button></button>`,
  // `<span><button></button></span>`, etc. for its own copy/source/anchor
  // controls. Drop those button-name false positives.
  if (finding.category === 'axe') {
    const html = finding.details?.html || '';
    const ruleId = finding.details?.ruleId || '';
    if (ruleId === 'button-name' && /^<button[^>]*>\s*<\/button>\s*$/.test(html.trim())) {
      return true; // empty button → Storybook chrome
    }
  }

  // Text-based chrome noise (Storybook addon labels rendered into stories)
  if (isStorybookChromeText(finding)) return true;

  return false;
}

function severityRank(s) {
  return SEVERITY_RANK[s] ?? 0;
}

const lines = readFileSync(IN, 'utf8').split('\n').filter(Boolean);
const all = lines.map((l) => JSON.parse(l));

const filtered = all.filter((f) => !isNoise(f) && severityRank(f.severity) >= FLOOR_RANK);

const dropped = all.length - filtered.length;

const byComponent = new Map();
for (const f of filtered) {
  const comp = componentFromTitle(f.storyTitle);
  if (!byComponent.has(comp)) byComponent.set(comp, []);
  byComponent.get(comp).push(f);
}

const sortedComponents = [...byComponent.entries()].sort((a, b) => {
  const aWeight = a[1].reduce((acc, f) => acc + severityRank(f.severity), 0);
  const bWeight = b[1].reduce((acc, f) => acc + severityRank(f.severity), 0);
  return bWeight - aWeight;
});

const buckets = { critical: 0, serious: 0, moderate: 0, minor: 0 };
const categories = {};
const rootCauses = {};
for (const f of filtered) {
  buckets[f.severity] = (buckets[f.severity] || 0) + 1;
  categories[f.category] = (categories[f.category] || 0) + 1;
  rootCauses[f.rootCause || 'unknown'] = (rootCauses[f.rootCause || 'unknown'] || 0) + 1;
}

const fixHints = {
  'invisible-text':
    'Component panel sets `background` but not `color` — slotted content inherits a foreign cascade. Anchor `color: var(--hx-color-text-primary)` on the slot container, OR rewrite the story to use design-system components instead of slotted native HTML.',
  contrast:
    'Either the rendered foreground/background pair fails WCAG AAA, OR the story uses a hardcoded inline color (`color: #xxx`). Replace inline colors with token references; for component-level failures shift the relevant text token.',
  'target-size':
    'Interactive element renders smaller than 24×24px (AA) or 44×44px (AAA Enhanced). For broken-sample: rewrite the story to use `<hx-button>` / `<hx-icon-button>` which already meet target-size. For broken-component: check component min-block-size / min-inline-size.',
  'blank-canvas':
    'Story renders mostly empty pixels. Either the component is in a closed/hidden default state (open it in `args` or `play`) or the migration broke its render.',
  axe: 'Address per axe-core rule guidance. Common fixes: ensure form labels (label rule), ensure buttons have accessible names (button-name), avoid duplicate IDs, run with `--theme=dark` to catch theme-specific contrast.',
};

const md = [];
md.push('# Story-Audit Triage Report');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push(`Source: \`${IN}\``);
md.push(`Severity floor: \`${SEVERITY_FLOOR}\``);
md.push('');
md.push('## Headline');
md.push('');
md.push(`- Raw findings: **${all.length}**`);
md.push(`- Dropped (Storybook-iframe noise + below floor): ${dropped}`);
md.push(`- Actionable: **${filtered.length}**`);
md.push('');
md.push('### Severity histogram');
md.push('');
md.push('| Severity | Count |');
md.push('|---|---|');
for (const sev of ['critical', 'serious', 'moderate', 'minor']) {
  md.push(`| ${sev} | ${buckets[sev] || 0} |`);
}
md.push('');
md.push('### Category histogram');
md.push('');
md.push('| Category | Count |');
md.push('|---|---|');
for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
  md.push(`| ${cat} | ${count} |`);
}
md.push('');
md.push('### Root-cause classification');
md.push('');
md.push('| Root cause | Count |');
md.push('|---|---|');
for (const [rc, count] of Object.entries(rootCauses).sort((a, b) => b[1] - a[1])) {
  md.push(`| ${rc} | ${count} |`);
}
md.push('');

md.push('## Components ranked by signal strength');
md.push('');
md.push(
  "Weight = sum of (4 × critical + 3 × serious + 2 × moderate + 1 × minor) across the component's stories. Highest weight = highest fix priority.",
);
md.push('');
md.push('| Rank | Component | Findings | Critical | Serious | Moderate | Minor | Weight |');
md.push('|---|---|---|---|---|---|---|---|');
for (let i = 0; i < sortedComponents.length; i++) {
  const [comp, findings] = sortedComponents[i];
  const c = findings.filter((f) => f.severity === 'critical').length;
  const s = findings.filter((f) => f.severity === 'serious').length;
  const m = findings.filter((f) => f.severity === 'moderate').length;
  const n = findings.filter((f) => f.severity === 'minor').length;
  const weight = c * 4 + s * 3 + m * 2 + n;
  md.push(
    `| ${i + 1} | \`${comp}\` | ${findings.length} | ${c} | ${s} | ${m} | ${n} | ${weight} |`,
  );
}
md.push('');

md.push('## Per-component findings');
md.push('');
for (const [comp, findings] of sortedComponents) {
  md.push(`### \`${comp}\` — ${findings.length} findings`);
  md.push('');
  const bySev = new Map();
  for (const f of findings) {
    if (!bySev.has(f.severity)) bySev.set(f.severity, []);
    bySev.get(f.severity).push(f);
  }
  for (const sev of ['critical', 'serious', 'moderate', 'minor']) {
    const list = bySev.get(sev);
    if (!list || list.length === 0) continue;
    md.push(`**${sev.toUpperCase()}** — ${list.length}`);
    md.push('');
    const seen = new Set();
    for (const f of list) {
      const key = `${f.category}|${f.summary}`;
      if (seen.has(key)) continue;
      seen.add(key);
      md.push(`- [${f.category}] \`${f.storyName || f.storyId}\` — ${f.summary}`);
      if (f.details?.text)
        md.push(`    text: \`${f.details.text}\` · contrast=${f.details.contrast ?? '?'}`);
      if (f.details?.element) md.push(`    element: \`${f.details.element}\``);
      if (f.details?.size) md.push(`    size: ${f.details.size}`);
      if (f.rootCause && f.rootCause !== 'unknown') md.push(`    root-cause: **${f.rootCause}**`);
    }
    md.push('');
  }
  const cats = new Set(findings.map((f) => f.category));
  md.push('**Recommended fixes:**');
  md.push('');
  for (const c of cats) {
    if (fixHints[c]) md.push(`- \`${c}\`: ${fixHints[c]}`);
  }
  md.push('');
  md.push('---');
  md.push('');
}

if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md.join('\n'), 'utf8');

console.log(`[triage] wrote ${OUT}`);
console.log(
  `[triage] raw=${all.length} actionable=${filtered.length} (dropped ${dropped} noise/floor)`,
);
console.log(`[triage] components=${sortedComponents.length}`);
console.log(`[triage] severity:`, buckets);
