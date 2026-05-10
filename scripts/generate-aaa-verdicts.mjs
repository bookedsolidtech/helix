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
      const evidence = firstSentence(payload.evidence ?? '');
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
