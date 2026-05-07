/**
 * AAA contrast report generator.
 *
 * Iterates the canonical PAIRS matrix from `src/__tests__/contrast-helpers.ts`
 * across all three modes (light, dark, high-contrast) and persists:
 *
 *   - `CONTRAST-REPORT.md` — human-readable Markdown with a per-mode table
 *     and an AAA pass/fail/sub-AA summary.
 *   - `.cache/contrast-report.json` — machine-readable JSON for tooling
 *     (Figma plugin, Admin Dashboard, audit pipelines).
 *
 * AAA classification is **role-aware**, mapping to WCAG 2.1 1.4.6 + 1.4.11:
 *   - `body-text`  → AAA pass at ≥ 7.0:1 (small text, body prose, inline links)
 *   - `large-text` → AAA pass at ≥ 4.5:1 (button labels ≥1rem semibold, status
 *                    callouts, badge labels — WCAG large-text bold branch)
 *   - `ui-element` → AAA pass at ≥ 3.0:1 (focus rings, borders, status fills,
 *                    placeholder text — 1.4.6 has no AAA tier above 1.4.11)
 *
 * Each pair in `PAIRS` carries a `role` field documenting the carve-out.
 * Pairs without an explicit role default to `body-text` (the strictest tier)
 * so unannotated pairs are not silently downgraded.
 *
 * The AA gate (contrast.test.ts) is the floor; this report is the AAA telemetry
 * layer that surfaces ratios consumers and auditors can act on.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALL_MODES,
  PAIRS,
  aaaThresholdForRole,
  type ContrastMode,
  type PairRole,
  type PairSpec,
  buildModeMap,
  contrastRatio,
  resolveToHex,
} from '../src/__tests__/contrast-helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');

type Classification = 'aaa' | 'aa' | 'subAA';

interface PairResult {
  text: string;
  surface: string;
  label: string;
  textHex: string;
  surfaceHex: string;
  ratio: number;
  threshold: number;
  aaaThreshold: number;
  role: PairRole;
  classification: Classification;
}

interface ModeSummary {
  aaa: number;
  aa: number;
  subAA: number;
  total: number;
}

interface ModeReport {
  summary: ModeSummary;
  pairs: PairResult[];
}

interface FullReport {
  generatedAt: string;
  tokenVersion: string;
  modes: Record<ContrastMode, ModeReport>;
}

function classify(ratio: number, threshold: number, aaaThreshold: number): Classification {
  if (ratio >= aaaThreshold) return 'aaa';
  if (ratio >= threshold) return 'aa';
  return 'subAA';
}

function evaluatePair(
  pair: PairSpec,
  mode: ContrastMode,
  modeMap: Record<string, string>,
): PairResult {
  const textHex = resolveToHex(pair.text, modeMap, mode);
  const surfaceHex = resolveToHex(pair.surface, modeMap, mode);
  const ratio = contrastRatio(textHex, surfaceHex);
  // Default to body-text (the strictest 7:1 AAA tier) for any pair that
  // hasn't been explicitly classified. This errs on the side of honesty:
  // unannotated pairs surface as AA-only rather than silently being
  // promoted by a friendly default.
  const role: PairRole = pair.role ?? 'body-text';
  const aaaThreshold = aaaThresholdForRole(role);
  return {
    text: pair.text,
    surface: pair.surface,
    label: pair.label,
    textHex,
    surfaceHex,
    ratio,
    threshold: pair.threshold,
    aaaThreshold,
    role,
    classification: classify(ratio, pair.threshold, aaaThreshold),
  };
}

function buildReport(): FullReport {
  const pkgJsonPath = resolve(PKG_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { version: string };

  const modes = {} as Record<ContrastMode, ModeReport>;
  for (const mode of ALL_MODES) {
    const modeMap = buildModeMap(mode);
    const pairs: PairResult[] = [];
    for (const pair of PAIRS) {
      const applicable = pair.modes ?? ALL_MODES;
      if (!applicable.includes(mode)) continue;
      pairs.push(evaluatePair(pair, mode, modeMap));
    }
    const summary: ModeSummary = {
      aaa: pairs.filter((p) => p.classification === 'aaa').length,
      aa: pairs.filter((p) => p.classification === 'aa').length,
      subAA: pairs.filter((p) => p.classification === 'subAA').length,
      total: pairs.length,
    };
    modes[mode] = { summary, pairs };
  }

  return {
    generatedAt: new Date().toISOString(),
    tokenVersion: pkg.version,
    modes,
  };
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function gradeIcon(c: Classification): string {
  if (c === 'aaa') return '✅';
  if (c === 'aa') return '⚠️';
  return '❌';
}

function aaIcon(c: Classification): string {
  return c === 'subAA' ? '❌' : '✅';
}

function aaaIcon(c: Classification): string {
  return c === 'aaa' ? '✅' : c === 'aa' ? '⚠️' : '❌';
}

function shortToken(tokenName: string): string {
  // Strip the `--hx-color-` prefix so the table reads cleanly.
  return tokenName.replace(/^--hx-color-/, '');
}

function modeHeading(mode: ContrastMode): string {
  if (mode === 'high-contrast') return 'High-Contrast Mode';
  return mode === 'light' ? 'Light Mode' : 'Dark Mode';
}

function roleLabel(role: PairRole): string {
  if (role === 'body-text') return 'body';
  if (role === 'large-text') return 'large';
  return 'ui';
}

function renderModeSection(mode: ContrastMode, report: ModeReport): string {
  const { summary, pairs } = report;
  const lines: string[] = [];
  lines.push(`## ${modeHeading(mode)}`);
  lines.push('');
  lines.push(
    `**Summary:** ${summary.aaa} of ${summary.total} pairs AAA-pass · ${summary.aa} AA-only · ${summary.subAA} sub-AA`,
  );
  lines.push('');
  lines.push('| Status | Role | Text token | Surface token | Ratio | AAA min | AA | AAA |');
  lines.push('|---|---|---|---|---:|---:|:---:|:---:|');
  for (const p of pairs) {
    const ratioStr = `${p.ratio.toFixed(2)}:1`;
    const aaaMin = `${p.aaaThreshold.toFixed(1)}:1`;
    lines.push(
      `| ${gradeIcon(p.classification)} | ${roleLabel(p.role)} | \`${shortToken(p.text)}\` | \`${shortToken(p.surface)}\` | ${ratioStr} | ${aaaMin} | ${aaIcon(p.classification)} | ${aaaIcon(p.classification)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

function renderMarkdown(report: FullReport): string {
  const lines: string[] = [];
  lines.push('# WCAG Contrast Report — `@helixui/tokens`');
  lines.push('');
  lines.push(`_Generated ${report.generatedAt} from \`@helixui/tokens@${report.tokenVersion}\`._`);
  lines.push('');
  lines.push(
    'Per-mode pass/fail telemetry for every semantically valid `(text × surface)` pair declared in the contrast matrix. **AA is the published gate** (enforced by `contrast.test.ts`); **AAA is informational** and surfaces here so consumers and auditors can see the actual ceiling each pairing reaches.',
  );
  lines.push('');
  lines.push('Thresholds (WCAG 2.1, **role-aware**):');
  lines.push('');
  lines.push(
    '- `body` — body text, prose, inline links: AA ≥ 4.5:1 (1.4.3), **AAA ≥ 7.0:1** (1.4.6)',
  );
  lines.push(
    '- `large` — button labels (≥1rem semibold), status callouts: AA ≥ 3.0:1, **AAA ≥ 4.5:1** (1.4.6 large-text bold branch — `≥14pt bold`)',
  );
  lines.push(
    '- `ui` — focus rings, borders, status fills, placeholders: AA ≥ 3.0:1 (1.4.11), **AAA ≥ 3.0:1** (1.4.6 has no AAA tier above 1.4.11 for non-text)',
  );
  lines.push('');
  lines.push(
    'Legend: ✅ AAA pass · ⚠️ AA pass (sub-AAA) · ❌ sub-AA (gate failure). The `Role` column documents the WCAG carve-out applied to each pair; the `AAA min` column shows the role-specific AAA threshold the pair was scored against.',
  );
  lines.push('');

  // Top-level rollup
  const totalAaa = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.aaa, 0);
  const totalAa = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.aa, 0);
  const totalSub = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.subAA, 0);
  const totalPairs = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.total, 0);
  lines.push(`## Aggregate`);
  lines.push('');
  lines.push(
    `**Across all three modes:** ${totalAaa} of ${totalPairs} pair-instances AAA-pass · ${totalAa} AA-only · ${totalSub} sub-AA`,
  );
  lines.push('');

  for (const mode of ALL_MODES) {
    lines.push(renderModeSection(mode, report.modes[mode]));
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const report = buildReport();

  const cacheDir = resolve(PKG_ROOT, '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const jsonPath = resolve(cacheDir, 'contrast-report.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  const mdPath = resolve(PKG_ROOT, 'CONTRAST-REPORT.md');
  writeFileSync(mdPath, renderMarkdown(report), 'utf8');

  // Console summary so CI logs surface the headline numbers without needing
  // to crack the file open.
  const totalAaa = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.aaa, 0);
  const totalPairs = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.total, 0);
  const totalSub = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.subAA, 0);
  // eslint-disable-next-line no-console
  console.info(
    `[contrast:report] ${totalAaa}/${totalPairs} pair-instances AAA-pass; ${totalSub} sub-AA. Wrote ${mdPath} and ${jsonPath}.`,
  );
}

main();
