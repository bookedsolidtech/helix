/**
 * AAA contrast report generator.
 *
 * Iterates the canonical PAIRS matrix from `src/__tests__/contrast-helpers.ts`
 * across all three modes (light, dark, high-contrast) and persists:
 *
 *   - `CONTRAST-REPORT.md` — human-readable Markdown with a per-mode table
 *     and an AAA pass/fail/sub-AA summary.
 *   - `src/__generated__/contrast-report.ts` — committed TypeScript module
 *     that is the canonical, importable source of truth for tooling. Wired
 *     through the package's `exports` map as `@helixui/tokens/contrast-data`
 *     so consumers (Storybook docs, Admin Dashboard) can import strongly
 *     typed contrast data without relying on a gitignored cache file.
 *   - `.cache/contrast-report.json` — machine-readable JSON for ad-hoc
 *     inspection (Figma plugin diffing, audit pipelines, manual review).
 *     Gitignored — derived artefact only; never imported by code that
 *     ships to CI.
 *
 * AAA classification is **role-aware**, mapping to WCAG 2.1 1.4.6 + 1.4.11:
 *   - `body-text`  → AAA pass at ≥ 7.0:1 (small text, body prose, inline
 *                    links, button labels, badge labels, status callouts —
 *                    everything below the strict large-text floor of 24px
 *                    regular / 18.66px true-bold weight ≥700)
 *   - `large-text` → AAA pass at ≥ 4.5:1 (reserved for explicitly large
 *                    headings or display copy at ≥24px regular / ≥18.66px
 *                    weight-700 bold; this codebase has no pairs in this
 *                    tier — 16px semibold button labels do NOT qualify)
 *   - `ui-element` → AAA pass at ≥ 3.0:1 (focus rings, borders, status fills,
 *                    placeholder backgrounds — 1.4.6 has no AAA tier above
 *                    1.4.11 for non-text contrast)
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
    '- `body` — body text, prose, inline links, **button labels, badge labels, status callouts**: AA ≥ 4.5:1 (1.4.3), **AAA ≥ 7.0:1** (1.4.6). 16px semibold does NOT qualify for the large-text carve-out under WCAG 2.1 1.4.6 (which requires 24px regular OR 18.66px weight-700 bold).',
  );
  lines.push(
    '- `large` — explicitly large headings or display copy at ≥24px regular / ≥18.66px true-bold (CSS weight ≥700): AA ≥ 3.0:1, **AAA ≥ 4.5:1** (1.4.6 large-text branch). This codebase intentionally has no pairs in this tier today.',
  );
  lines.push(
    '- `ui` — focus rings, borders, status fills, non-text indicators: AA ≥ 3.0:1 (1.4.11), **AAA ≥ 3.0:1** (1.4.6 has no AAA tier above 1.4.11 for non-text)',
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

function renderTypeScriptModule(report: FullReport): string {
  // Keep the committed module deterministic across regenerations. The
  // `generatedAt` wall-clock timestamp lives only in the human-facing
  // Markdown report and the gitignored JSON cache — it is intentionally
  // omitted from the committed TS module so regenerations produce no diff
  // unless the underlying token values actually changed. Consumers that
  // need a per-build freshness signal should read `tokenVersion` (which
  // bumps with each token release) or the JSON cache directly.
  //
  // Stripping `generatedAt` here is the deterministic-build fix for the
  // P2 codex finding: every regen previously emitted a fresh ISO string,
  // so even a no-op `pnpm run contrast:report` produced a noisy diff.
  const { generatedAt: _omitWallClock, ...stableReport } = report;
  void _omitWallClock;
  // Emit a strongly-typed, deterministic module. The committed file is the
  // canonical import path (`@helixui/tokens/contrast-data`) for consumers
  // that need contrast telemetry at build time — Storybook docs, Admin
  // Dashboard, audit pipelines. Generated via `pnpm run contrast:report`;
  // do not hand-edit (the script overwrites on every run).
  //
  // Output uses single-quoted, unquoted-key style so prettier's default
  // configuration is a no-op against this file — otherwise the formatter
  // reformats every regen and reintroduces diff churn through a different
  // door (the very thing the determinism fix above is meant to eliminate).
  const lines: string[] = [];
  lines.push('/**');
  lines.push(' * AUTOGENERATED — DO NOT EDIT BY HAND.');
  lines.push(' *');
  lines.push(' * Regenerate via `pnpm --filter=@helixui/tokens run contrast:report`.');
  lines.push(' *');
  lines.push(' * Canonical source of WCAG contrast pair telemetry for `@helixui/tokens`.');
  lines.push(' * Imported through the package `./contrast-data` export. The contents are');
  lines.push(' * deterministic for a given (tokens.json, contrast-helpers.ts) tuple — the');
  lines.push(' * generator emits this file and the gitignored `.cache/contrast-report.json`');
  lines.push(' * artefact in lockstep, so the JSON cache stays available for ad-hoc');
  lines.push(' * inspection without becoming a build-time dependency.');
  lines.push(' *');
  lines.push(' * The `generatedAt` wall-clock field is intentionally absent from this');
  lines.push(' * module; consult `tokenVersion` (or the gitignored JSON cache) for');
  lines.push(' * regeneration freshness signals.');
  lines.push(' */');
  lines.push('');
  lines.push("export type ContrastClassification = 'aaa' | 'aa' | 'subAA';");
  lines.push('');
  lines.push("export type ContrastPairRole = 'body-text' | 'large-text' | 'ui-element';");
  lines.push('');
  lines.push("export type ContrastModeKey = 'light' | 'dark' | 'high-contrast';");
  lines.push('');
  lines.push('export interface ContrastPair {');
  lines.push('  readonly text: string;');
  lines.push('  readonly surface: string;');
  lines.push('  readonly label: string;');
  lines.push('  readonly textHex: string;');
  lines.push('  readonly surfaceHex: string;');
  lines.push('  readonly ratio: number;');
  lines.push('  readonly threshold: number;');
  lines.push('  readonly aaaThreshold: number;');
  lines.push('  readonly role: ContrastPairRole;');
  lines.push('  readonly classification: ContrastClassification;');
  lines.push('}');
  lines.push('');
  lines.push('export interface ContrastModeSummary {');
  lines.push('  readonly aaa: number;');
  lines.push('  readonly aa: number;');
  lines.push('  readonly subAA: number;');
  lines.push('  readonly total: number;');
  lines.push('}');
  lines.push('');
  lines.push('export interface ContrastModeReport {');
  lines.push('  readonly summary: ContrastModeSummary;');
  lines.push('  readonly pairs: readonly ContrastPair[];');
  lines.push('}');
  lines.push('');
  lines.push('export interface ContrastReport {');
  lines.push('  readonly tokenVersion: string;');
  lines.push('  readonly modes: Readonly<Record<ContrastModeKey, ContrastModeReport>>;');
  lines.push('}');
  lines.push('');
  lines.push(
    `export const contrastReport: ContrastReport = ${formatAsTsLiteral(stableReport)} as const;`,
  );
  lines.push('');
  lines.push('export default contrastReport;');
  lines.push('');
  return lines.join('\n');
}

/**
 * Serialize a JSON-shaped value as a TypeScript object literal using
 * single-quoted strings and unquoted keys — i.e. the canonical prettier
 * shape. Avoids the format churn that JSON.stringify would otherwise
 * trigger on every prettier pass.
 */
function formatAsTsLiteral(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${padInner}${formatAsTsLiteral(v, indent + 1)}`);
    return `[\n${items.join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const items = entries.map(
      ([k, v]) => `${padInner}${formatKey(k)}: ${formatAsTsLiteral(v, indent + 1)}`,
    );
    return `{\n${items.join(',\n')},\n${pad}}`;
  }
  return 'undefined';
}

const SAFE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function formatKey(key: string): string {
  return SAFE_KEY.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
}

function main(): void {
  const report = buildReport();

  const cacheDir = resolve(PKG_ROOT, '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const jsonPath = resolve(cacheDir, 'contrast-report.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  // Committed TypeScript module — the canonical import path for tooling.
  // Storybook builds in CI cannot rely on `.cache/` (gitignored), so the
  // contrast data ships through src/__generated__ instead.
  const generatedDir = resolve(PKG_ROOT, 'src', '__generated__');
  mkdirSync(generatedDir, { recursive: true });
  const tsPath = resolve(generatedDir, 'contrast-report.ts');
  writeFileSync(tsPath, renderTypeScriptModule(report), 'utf8');

  const mdPath = resolve(PKG_ROOT, 'CONTRAST-REPORT.md');
  writeFileSync(mdPath, renderMarkdown(report), 'utf8');

  // Console summary so CI logs surface the headline numbers without needing
  // to crack the file open.
  const totalAaa = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.aaa, 0);
  const totalPairs = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.total, 0);
  const totalSub = ALL_MODES.reduce((s, m) => s + report.modes[m].summary.subAA, 0);
  // eslint-disable-next-line no-console
  console.info(
    `[contrast:report] ${totalAaa}/${totalPairs} pair-instances AAA-pass; ${totalSub} sub-AA. Wrote ${mdPath}, ${tsPath}, and ${jsonPath}.`,
  );
}

main();
