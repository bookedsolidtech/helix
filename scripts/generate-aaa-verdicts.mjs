#!/usr/bin/env node
/**
 * generate-aaa-verdicts.mjs — build the per-component AAA verdicts snapshot
 * the Storybook docs surface (AAAConformanceCard) consumes.
 *
 * SINGLE SOURCE OF TRUTH for procurement-visible verdicts:
 *
 *     scripts/aaa-formal-audit.mjs
 *       → .reports/formal-aaa-audit/audit.json   (full audit, gitignored)
 *         → packages/hx-library/aaa-verdicts.json (slim snapshot, committed)
 *           → @helixui/library/aaa-verdicts.json  (consumed by docs)
 *
 * The full audit.json is gitignored (.reports/ is local-only). The slim
 * snapshot is committed so the Storybook build does not depend on running
 * the audit harness first — but it is regenerated automatically every time
 * `pnpm aaa:audit` runs, keeping the docs honest.
 *
 * Shape:
 *
 *   {
 *     "generatedAt": "ISO-8601",
 *     "standards": "WCAG 2.2 AAA",
 *     "components": {
 *       "<tag>": {
 *         "<criterionId>": { "verdict": "Supports" | "Partially Supports" |
 *                                       "Does Not Support" | "Not Applicable",
 *                            "evidence": "1-sentence summary" }
 *       }
 *     }
 *   }
 *
 * Evidence prose is truncated to a single sentence to keep the file lean —
 * the full multi-paragraph evidence stays in the audit.json + per-component
 * AAA-AUDIT.md. The card surfaces the short form; the audit link in the
 * card header opens the long form.
 *
 * EXCEPTION — 2.4.13 Focus Appearance: the harness appends a measured
 * ring-contrast clause (e.g. "… Effective ring contrast vs adjacent background
 * 5.82:1 (>=3:1 OK).") — or a manual-verification note — as a SECOND sentence
 * after the indicator description. WCAG 2.4.13 requires BOTH a >=2px indicator
 * AND >=3:1 contrast, so that clause is load-bearing evidence, not prose. First-
 * sentence truncation drops it, leaving the committed snapshot a strict prefix
 * of the harness output (which review tooling flags as a stale/mismatched
 * snapshot). For 2.4.13 we therefore keep the full evidence so the committed
 * cert is self-describing and matches the harness byte-for-byte.
 *
 * Usage:
 *   node scripts/generate-aaa-verdicts.mjs
 *     [--audit <path>]   default: .reports/formal-aaa-audit/audit.json
 *     [--output <path>]  default: packages/hx-library/aaa-verdicts.json
 *     [--quiet]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

function getArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const QUIET = process.argv.includes('--quiet');

const AUDIT_PATH = resolve(REPO_ROOT, getArg('--audit', '.reports/formal-aaa-audit/audit.json'));
const OUTPUT_PATH = resolve(REPO_ROOT, getArg('--output', 'packages/hx-library/aaa-verdicts.json'));

function log(...args) {
  if (!QUIET) console.log('[generate-aaa-verdicts]', ...args);
}

/**
 * Criteria whose evidence must be kept in FULL (no first-sentence truncation)
 * because a later sentence carries load-bearing measured data. 2.4.13 appends a
 * ring-contrast clause / manual-verification note that the contrast half of the
 * SC depends on; truncating it makes the committed snapshot a stale prefix of
 * the harness output.
 */
const FULL_EVIDENCE_CRITERIA = new Set(['2.4.13']);

/**
 * Trim a multi-sentence evidence string down to the first sentence so the
 * snapshot stays small. Falls back to the full string if no sentence
 * terminator is found within 200 chars.
 */
function firstSentence(evidence) {
  if (typeof evidence !== 'string') return '';
  const trimmed = evidence.trim();
  if (!trimmed) return '';
  // Match up to and including the first sentence terminator (. ! ?) that is
  // followed by whitespace or end-of-string. Avoid splitting on decimal
  // points like "7.03:1" by requiring a non-digit before the terminator.
  const match = trimmed.match(/^.*?(?:[^\d][.!?])(?:\s|$)/);
  if (match) return match[0].trim();
  // No terminator found — return at most 200 chars to keep snapshot lean.
  return trimmed.length > 200 ? `${trimmed.slice(0, 197).trim()}…` : trimmed;
}

function main() {
  if (!existsSync(AUDIT_PATH)) {
    console.error(
      `[generate-aaa-verdicts] ERROR: audit file not found: ${relative(REPO_ROOT, AUDIT_PATH)}`,
    );
    console.error('[generate-aaa-verdicts] Run `pnpm aaa:audit` first, or pass --audit <path>.');
    process.exit(1);
  }

  const audit = JSON.parse(readFileSync(AUDIT_PATH, 'utf-8'));
  if (!audit || !Array.isArray(audit.results)) {
    console.error('[generate-aaa-verdicts] ERROR: audit.json missing `results` array.');
    process.exit(1);
  }

  const components = {};
  for (const result of audit.results) {
    if (!result || typeof result.component !== 'string') continue;
    if (result.error) {
      // Surface error state so the docs card can render "Audit error" rather
      // than silently dropping the component.
      components[result.component] = { __error: result.error };
      continue;
    }
    const verdicts = result.verdicts ?? {};
    const slim = {};
    for (const [criterionId, payload] of Object.entries(verdicts)) {
      if (!payload || typeof payload !== 'object') continue;
      const verdict = typeof payload.verdict === 'string' ? payload.verdict : 'Unknown';
      // Keep the full evidence for criteria that carry measured data in a later
      // sentence (e.g. 2.4.13's ring-contrast clause); truncate everything else
      // to the first sentence to keep the snapshot lean.
      const rawEvidence = typeof payload.evidence === 'string' ? payload.evidence.trim() : '';
      const evidence = FULL_EVIDENCE_CRITERIA.has(criterionId)
        ? rawEvidence
        : firstSentence(rawEvidence);
      slim[criterionId] = { verdict, evidence };
    }
    components[result.component] = slim;
  }

  const standardsClaim = audit.standards?.claim ?? {};
  const standardsLabel = standardsClaim.wcagVersion
    ? `WCAG ${standardsClaim.wcagVersion} ${standardsClaim.wcagLevel ?? 'AAA'}`
    : 'WCAG 2.2 AAA';

  const snapshot = {
    generatedAt: new Date().toISOString(),
    sourceAuditRunAt: audit.runAt ?? null,
    standards: standardsLabel,
    standardsSource: standardsClaim.wcagSource ?? null,
    components,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf-8');

  log(`wrote ${relative(REPO_ROOT, OUTPUT_PATH)}`);
  log(`  source : ${relative(REPO_ROOT, AUDIT_PATH)}`);
  log(`  runAt  : ${audit.runAt ?? '(unknown)'}`);
  log(`  components: ${Object.keys(components).length}`);
}

main();
