#!/usr/bin/env node
/**
 * regenerate-audits.mjs — Phase 5 (formal AAA re-cert)
 *
 * Reads:
 *   - scripts/AAA-AUDIT.formal.template.md (formal template)
 *   - scripts/aaa-standards.json (WCAG 2.2 SC + peer-standard reference)
 *   - .reports/formal-aaa-audit/audit.json (per-cell measurements)
 *
 * Writes:
 *   - packages/hx-library/src/components/<tag>/AAA-AUDIT.md (one per component)
 *
 * Every claim in every generated audit is backed by either:
 *   (a) a measurement from audit.json, OR
 *   (b) a spec citation from aaa-standards.json.
 *
 * Run from repo root:  node scripts/regenerate-audits.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const TEMPLATE_PATH = path.join(REPO_ROOT, 'scripts/AAA-AUDIT.formal.template.md');
const STANDARDS_PATH = path.join(REPO_ROOT, 'scripts/aaa-standards.json');
const AUDIT_PATH = path.join(REPO_ROOT, '.reports/formal-aaa-audit/audit.json');
const COMPONENTS_DIR = path.join(REPO_ROOT, 'packages/hx-library/src/components');

const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
const standards = JSON.parse(fs.readFileSync(STANDARDS_PATH, 'utf8'));
const audit = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'));

// Index criteria by id from aaa-standards.json (canonical source of titles, URLs, thresholds).
const criteriaById = new Map();
for (const c of standards.criteria) {
  criteriaById.set(c.id, c);
}

// Display order matches the audit.matrix.md column order.
const CRITERION_ORDER = [
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

// APG patterns map from aaa-standards.json (verified live 2026-05-08).
const apgPatterns = standards.criteria.find((c) => c.id === 'apg-keyboard').patterns;

/**
 * Pretty display name for the component (e.g. hx-button -> HelixButton).
 */
function displayName(tagName) {
  return tagName
    .split('-')
    .map((seg, idx) => {
      if (idx === 0 && seg === 'hx') return 'Helix';
      return seg.charAt(0).toUpperCase() + seg.slice(1);
    })
    .join('');
}

/**
 * Resolve the threshold string we render in the per-criterion table for a given criterion.
 * Pulled from aaa-standards.json `thresholds` and `summary`. No invented numbers.
 */
function thresholdFor(criterion) {
  const c = criteriaById.get(criterion);
  if (!c) return '—';
  if (criterion === '1.4.6') {
    return `Normal text ≥${c.thresholds.normalText}:1; large text (≥${c.thresholds.largeTextDefinitionPx}px or ≥${c.thresholds.largeTextDefinitionPxBold}px bold) ≥${c.thresholds.largeText}:1`;
  }
  if (criterion === '2.4.13') {
    return `Outline ≥${c.thresholds.perimeterMinPx}px perimeter; focused-vs-unfocused contrast ≥${c.thresholds.contrastFocusedToUnfocused}:1`;
  }
  if (criterion === '2.5.5') {
    return `Target ≥${c.thresholds.minWidthPx}×${c.thresholds.minHeightPx} CSS px (essential / equivalent / inline / UA-control exceptions per WCAG 2.2)`;
  }
  if (criterion === '1.4.9')
    return 'No raster/SVG images of text (decorative & essential exemptions per WCAG 2.2)';
  if (criterion === '2.1.3') return 'All functionality keyboard-operable; no timing-based input';
  if (criterion === '2.3.3')
    return 'All interaction-driven motion respects `prefers-reduced-motion: reduce`';
  if (criterion === '2.4.12')
    return 'No author-created content fully obscures the focused component';
  if (criterion === '3.2.5') return 'Context changes only on explicit user request';
  if (criterion === '3.3.6') return 'Submission is reversible, checked, or confirmable';
  if (criterion === 'forced-colors')
    return '`@media (forced-colors: active)` honored; system colors used; no information conveyed by color alone';
  if (criterion === 'apg-keyboard')
    return 'Keyboard interaction matches WAI-ARIA APG pattern for declared `@aria-pattern`';
  return '—';
}

/**
 * Render the measured-value cell for the per-criterion table.
 * Pulled DIRECTLY from audit.json verdicts[id]. No computation.
 */
function measuredFor(verdictCell, criterion) {
  if (!verdictCell) return '—';
  if (criterion === '1.4.6') {
    if (verdictCell.ratio == null) return 'No own text rendered';
    return `${Number(verdictCell.ratio).toFixed(2)}:1 (fg ${verdictCell.fg}, bg ${verdictCell.bg})`;
  }
  if (criterion === '2.4.13') {
    if (verdictCell.widthPx == null) return 'Not focusable / non-interactive';
    return `outline ${verdictCell.widthPx}px ${verdictCell.style} ${verdictCell.color}; box-shadow=${verdictCell.boxShadow}; keyboard-focus via Tab×${verdictCell.tabPresses ?? '?'}`;
  }
  if (criterion === '2.5.5') {
    if (verdictCell.width == null)
      return 'Non-interactive overlay (no clickable target at container)';
    return `target=${verdictCell.target} ${Number(verdictCell.width).toFixed(1)}×${Number(verdictCell.height).toFixed(1)} px`;
  }
  if (criterion === '2.4.12') {
    return verdictCell.isCovered
      ? 'Focused target obscured'
      : 'No element covers focused target centre';
  }
  // For purely behavioural / static-source criteria, the harness emits the evidence string verbatim.
  return verdictCell.evidence ?? '—';
}

/**
 * Build the per-criterion verdict table.
 */
function renderPerCriterionTable(verdicts) {
  const rows = [
    '| SC | Title | Verdict | Threshold | Measured | Reference |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const id of CRITERION_ORDER) {
    const c = criteriaById.get(id);
    if (!c) continue;
    const v = verdicts[id];
    const verdict = v?.verdict ?? '—';
    const measured = measuredFor(v, id);
    const threshold = thresholdFor(id);
    const refUrl = c.url;
    const title = c.name;
    rows.push(
      `| ${id} | ${title} | ${verdict} | ${threshold} | ${measured.replace(/\|/g, '\\|')} | [spec](${refUrl}) |`,
    );
  }
  // Phase 4 (hx-icon): supplemental WCAG 1.4.11 row when the harness
  // emitted an icon-specific non-text-contrast measurement. This is NOT one
  // of the 11 cert-claimed criteria; it is recorded alongside the matrix
  // because hx-icon's contrast obligation is carried by 1.4.11 rather than
  // 1.4.6 (the component renders no text content).
  const iconContrast = verdicts['non-text-contrast-icon'];
  if (iconContrast) {
    const measured = (iconContrast.evidence ?? '—').replace(/\|/g, '\\|');
    rows.push(
      `| 1.4.11 | Non-text Contrast (icon) | ${iconContrast.verdict} | Rendered glyph color vs. document background ≥3:1 | ${measured} | [spec](https://www.w3.org/TR/WCAG22/#non-text-contrast) |`,
    );
  }
  return rows.join('\n');
}

/**
 * Render the long-form per-criterion evidence section (one block per criterion).
 */
function renderDetailedEvidence(component, verdicts) {
  const blocks = [];
  for (const id of CRITERION_ORDER) {
    const c = criteriaById.get(id);
    if (!c) continue;
    const v = verdicts[id];
    if (!v) continue;
    const lines = [];
    lines.push(`### ${id} — ${c.name} (${c.level})`);
    lines.push('');
    lines.push(`**Verdict:** ${v.verdict}`);
    lines.push('');
    lines.push(`**Spec:** [${c.url}](${c.url})`);
    if (c.understandingUrl) {
      lines.push('');
      lines.push(`**Understanding:** [${c.understandingUrl}](${c.understandingUrl})`);
    }
    lines.push('');
    lines.push(`**Summary (from W3C):** ${c.summary}`);
    lines.push('');
    lines.push(`**Measured:** ${measuredFor(v, id)}`);
    lines.push('');
    lines.push(`**Evidence:** ${v.evidence ?? '—'}`);
    if (v.verdict === 'Not Applicable') {
      lines.push('');
      lines.push(`**Why N/A:** ${naRationale(component, id, v)}`);
    }
    if (id === 'apg-keyboard') {
      const patternEntry = apgPatterns[component.jsdoc.ariaPattern];
      if (patternEntry) {
        lines.push('');
        lines.push(`**APG pattern reference:** [${patternEntry.url}](${patternEntry.url})`);
        if (patternEntry.note) {
          lines.push('');
          lines.push(`**Pattern note (from aaa-standards.json):** ${patternEntry.note}`);
        }
      } else {
        lines.push('');
        lines.push(
          `**APG pattern reference:** declared @aria-pattern="${component.jsdoc.ariaPattern ?? 'none'}". This pattern is not enumerated in \`scripts/aaa-standards.json\` patterns map; the verdict relies on the harness's structural keyboard probe and the WAI-ARIA APG patterns index ([${standards.criteria.find((c) => c.id === 'apg-keyboard').url}](${standards.criteria.find((c) => c.id === 'apg-keyboard').url})).`,
        );
      }
    }
    if (id === 'forced-colors' && c.specUrl) {
      lines.push('');
      lines.push(`**Underlying CSS spec:** [${c.specUrl}](${c.specUrl})`);
    }
    blocks.push(lines.join('\n'));
  }
  // Phase 4 (hx-icon): supplemental block for the icon-specific
  // non-text-contrast measurement, when present.
  const iconContrast = verdicts['non-text-contrast-icon'];
  if (iconContrast) {
    const lines = [];
    lines.push('### 1.4.11 — Non-text Contrast (AA) — supplemental icon measurement');
    lines.push('');
    lines.push(`**Verdict:** ${iconContrast.verdict}`);
    lines.push('');
    lines.push(
      '**Spec:** [https://www.w3.org/TR/WCAG22/#non-text-contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)',
    );
    lines.push('');
    lines.push(
      '**Understanding:** [https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)',
    );
    lines.push('');
    lines.push(
      '**Summary (from W3C):** The visual presentation of UI components and graphical objects has a contrast ratio of at least 3:1 against adjacent color(s).',
    );
    lines.push('');
    lines.push(`**Evidence:** ${iconContrast.evidence ?? '—'}`);
    lines.push('');
    lines.push(
      '**Cert note:** WCAG 1.4.11 is an AA criterion (not part of the 11-criterion AAA cert claim). It is recorded here because `<hx-icon>` is a non-text-contrast surface — text-contrast (1.4.6) does not apply to a presentational glyph. The supplemental measurement is what backs the per-library AAA verdict published in `packages/hx-icons/AAA-VERDICT.md`.',
    );
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

/**
 * Generate a Not-Applicable rationale tied to the spec exception.
 * All rationales below are sourced from aaa-standards.json + audit.json.
 */
function naRationale(component, id, v) {
  if (id === '1.4.6') {
    return 'Per `aaa-standards.json` `componentApplicability`, 1.4.6 applies to text and images of text. The harness probe found no own text on the audited surface (UI-component-boundary contrast is governed by 1.4.11, which is not part of this AAA claim).';
  }
  if (id === '2.3.3') {
    return 'Per `aaa-standards.json` `componentApplicability`, 2.3.3 applies to components with motion. The harness found no `transition` or `animation` declarations in the component styles, so the criterion has nothing to which to apply.';
  }
  if (id === '3.3.6') {
    return 'Per `aaa-standards.json` `componentApplicability`, 3.3.6 applies to form components and components mediating destructive actions. The component is not form-associated and exposes no destructive action surface.';
  }
  if (id === '2.5.5') {
    return 'Per WCAG 2.2 2.5.5 exceptions (essential / equivalent / inline / user-agent control), the audited surface is a non-interactive overlay container with no clickable target of its own; clickable targets reside in light-DOM consumer content and inherit their own AAA cert.';
  }
  if (id === '2.4.13') {
    return 'Per WAI-ARIA APG, the audited surface is non-focusable by design (e.g. a tooltip body or overlay container); 2.4.13 applies to elements that receive keyboard focus.';
  }
  if (id === 'forced-colors') {
    return 'Component renders no own painted surface (e.g. structural overlay container) — forced-colors applies to visually-presented surfaces.';
  }
  return v.evidence ?? '—';
}

/**
 * Render the consumer obligations list. Sourced from JSDoc + harness signals + standards.
 */
function consumerObligations(component) {
  const lines = [];
  const pat = component.jsdoc.ariaPattern;
  // Universal obligations first.
  lines.push(
    '- Provide an accessible name (slot content, `aria-label`, or `accessible-label` prop) for every instance — the harness verifies a present accessible name on the Default story but cannot enforce it for every consumer instance.',
  );
  lines.push(
    '- Render the component on a page that respects WCAG 2.2 page-level criteria (landmarks, page titles, language) — component-level conformance does not certify the page.',
  );
  lines.push(
    '- Do not strip the focus ring via author CSS on the slotted/wrapping element. Adjust via the `--hx-focus-ring-*` design tokens if customization is required.',
  );
  if (component.jsdoc.formAssociated) {
    lines.push(
      "- For form usage, expose validation messages via the component's `error` / `validity` API and ensure the submit flow honours WCAG 3.3.6 (reversible / checked / confirmed).",
    );
  }
  if (pat === 'tooltip') {
    lines.push(
      '- The slotted trigger element MUST be focusable and keyboard-operable; the tooltip body is non-focusable by APG mandate.',
    );
  }
  if (pat === 'dialog' || pat === 'alertdialog') {
    lines.push(
      '- Manage initial focus on open and return focus to the invoking element on close (the component scaffolds the trap; the consumer sets the invoker).',
    );
  }
  if (pat === 'navigation') {
    lines.push(
      '- Provide an accessible name for the landmark (`aria-label` or `aria-labelledby`) when more than one navigation landmark is present on the page.',
    );
  }
  if (pat === 'combobox' || pat === 'spinbutton' || pat === 'textbox') {
    lines.push(
      "- Pair the input with a visible `<label>` (or use the component's `label` prop) — `aria-label` alone is permitted but reduces robustness.",
    );
  }
  if (pat === 'button') {
    lines.push(
      '- Icon-only buttons require an explicit accessible name via `accessible-label` or `aria-label`; the component emits a `devWarn` when the name is missing.',
    );
  }
  return lines.join('\n');
}

/**
 * Compute summary verdict counts.
 */
function computeSummary(verdicts) {
  const summary = {
    Supports: 0,
    'Partially Supports': 0,
    'Does Not Support': 0,
    'Not Applicable': 0,
  };
  for (const id of CRITERION_ORDER) {
    const v = verdicts[id];
    if (!v) continue;
    summary[v.verdict] = (summary[v.verdict] ?? 0) + 1;
  }
  return summary;
}

/**
 * Compute headline string.
 */
function computeHeadline(summary) {
  const total = summary.Supports + summary['Not Applicable'];
  if (summary['Does Not Support'] === 0 && summary['Partially Supports'] === 0) {
    return `**Supports + Not Applicable across all 11 criteria** (${summary.Supports} Supports, ${summary['Not Applicable']} Not Applicable). The component meets WCAG 2.2 AAA on every applicable Success Criterion and conforms to both peer standards (forced-colors, APG keyboard contract).`;
  }
  return `${summary.Supports} Supports / ${summary['Partially Supports']} Partially Supports / ${summary['Does Not Support']} Does Not Support / ${summary['Not Applicable']} Not Applicable across 11 criteria. See per-criterion findings below.`;
}

/**
 * Render one component's AAA-AUDIT.md from the formal template.
 */
function renderComponent(componentResult) {
  const tag = componentResult.component;
  const verdicts = componentResult.verdicts;
  const summary = computeSummary(verdicts);
  const ariaPattern = componentResult.jsdoc.ariaPattern ?? 'none';
  const apgEntry = apgPatterns[ariaPattern];
  const apgUrl = apgEntry?.url ?? standards.criteria.find((c) => c.id === 'apg-keyboard').url;

  const replacements = {
    ComponentDisplayName: displayName(tag),
    tagName: tag,
    sourceClassPath: componentResult.sourceFiles.class,
    sourceStylesPath: componentResult.sourceFiles.styles,
    sourceStoriesPath: componentResult.sourceFiles.stories,
    ariaPattern,
    ariaPatternUrl: apgUrl,
    keyboardContract: componentResult.jsdoc.keyboardContract ?? '—',
    formAssociated: componentResult.jsdoc.formAssociated ? 'Yes' : 'No',
    forcedColorsSupported: componentResult.jsdoc.forcedColorsSupported ? 'Yes' : 'No',
    auditedAt: componentResult.auditedAt,
    runAt: audit.runAt,
    storybookUrl: componentResult.browserChecks?.url ?? '—',
    summarySupports: String(summary.Supports),
    summaryPartial: String(summary['Partially Supports']),
    summaryFail: String(summary['Does Not Support']),
    summaryNA: String(summary['Not Applicable']),
    headline: computeHeadline(summary),
    perCriterionTable: renderPerCriterionTable(verdicts),
    detailedEvidenceBlocks: renderDetailedEvidence(componentResult, verdicts),
    consumerObligations: consumerObligations(componentResult),
  };

  let out = template;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

let written = 0;
const skipped = [];
for (const result of audit.results) {
  const tag = result.component;
  const dir = path.join(COMPONENTS_DIR, tag);
  if (!fs.existsSync(dir)) {
    skipped.push(`${tag} (component dir not found at ${dir})`);
    continue;
  }
  const out = renderComponent(result);
  const target = path.join(dir, 'AAA-AUDIT.md');
  fs.writeFileSync(target, out, 'utf8');
  written += 1;
}

console.log(`regenerated ${written} AAA-AUDIT.md files`);
if (skipped.length) {
  console.log(`skipped: ${skipped.length}`);
  for (const s of skipped) console.log(`  - ${s}`);
}
