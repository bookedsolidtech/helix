#!/usr/bin/env node
/**
 * check-aaa-verdicts.mjs — preflight gate that refuses push on regressions.
 *
 * Reads the committed AAA verdicts snapshot (`packages/hx-library/aaa-verdicts.json`)
 * and fails with exit 1 if ANY (component × criterion) cell resolves to
 * `Partially Supports` or `Does Not Support`.
 *
 * The snapshot is regenerated automatically by every `pnpm aaa:audit` run
 * via `scripts/generate-aaa-verdicts.mjs`. After the regex/heuristic refine
 * in 3.9.0, only intentional Partial verdicts surface — and an intentional
 * Partial is still a cert regression for the docs claim, so we want it to
 * block merges until either (a) the underlying gap is fixed (move to
 * Supports) or (b) the verdict is consciously acknowledged via the env
 * override below.
 *
 * Usage:
 *   node scripts/check-aaa-verdicts.mjs            # gate mode (preflight)
 *   AAA_ALLOW_PARTIAL=1 node scripts/...           # acknowledge known Partials
 *   AAA_ALLOW_PARTIAL=hx-slider,hx-file-upload \
 *     node scripts/check-aaa-verdicts.mjs          # acknowledge specific cells
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const VERDICTS_PATH = resolve(REPO_ROOT, 'packages/hx-library/aaa-verdicts.json');

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};

function readVerdicts() {
  try {
    const raw = readFileSync(VERDICTS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`${ANSI.red}✗ AAA verdicts snapshot not found at ${VERDICTS_PATH}.${ANSI.reset}`);
    console.error(`  Run: pnpm aaa:audit (with Storybook running on port 3151).`);
    console.error(`  Underlying error: ${err.message}`);
    process.exit(1);
  }
}

function parseAllowList(raw) {
  if (!raw) return null;
  if (raw === '1' || raw.toLowerCase() === 'true') return 'all';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function main() {
  const data = readVerdicts();
  if (!data || typeof data !== 'object' || !data.components) {
    console.error(
      `${ANSI.red}✗ AAA verdicts file is malformed (missing 'components' key).${ANSI.reset}`,
    );
    process.exit(1);
  }

  const allow = parseAllowList(process.env.AAA_ALLOW_PARTIAL);

  const partial = [];
  const fail = [];

  for (const [tag, verdicts] of Object.entries(data.components)) {
    for (const [criterion, entry] of Object.entries(verdicts)) {
      if (entry?.verdict === 'Partially Supports') {
        partial.push({ tag, criterion, evidence: entry.evidence });
      } else if (entry?.verdict === 'Does Not Support') {
        fail.push({ tag, criterion, evidence: entry.evidence });
      }
    }
  }

  if (fail.length === 0 && partial.length === 0) {
    console.log(`${ANSI.green}✓ AAA verdicts: all cells Supports or Not Applicable.${ANSI.reset}`);
    console.log(
      `${ANSI.dim}  ${Object.keys(data.components).length} components × criteria checked. Source: ${data.generatedAt ?? 'unknown'}.${ANSI.reset}`,
    );
    process.exit(0);
  }

  if (fail.length > 0) {
    console.error(
      `${ANSI.red}✗ AAA verdicts: ${fail.length} cell(s) Does Not Support.${ANSI.reset}`,
    );
    for (const f of fail) {
      console.error(`  ${ANSI.red}FAIL${ANSI.reset} ${f.tag} · ${f.criterion} — ${f.evidence}`);
    }
    process.exit(1);
  }

  if (partial.length > 0) {
    const allowed =
      allow === 'all'
        ? partial
        : Array.isArray(allow)
          ? partial.filter((p) => allow.includes(p.tag))
          : [];
    const disallowed = partial.filter((p) => !allowed.includes(p));

    if (disallowed.length === 0) {
      console.log(
        `${ANSI.yellow}⚠ AAA verdicts: ${partial.length} acknowledged Partial cell(s) (AAA_ALLOW_PARTIAL).${ANSI.reset}`,
      );
      for (const p of partial) {
        console.log(
          `  ${ANSI.yellow}PARTIAL${ANSI.reset} ${p.tag} · ${p.criterion} — ${p.evidence}`,
        );
      }
      console.log(
        `${ANSI.dim}  Acknowledged; gate passes. Resolve by adding setValidity / refining harness.${ANSI.reset}`,
      );
      process.exit(0);
    }

    console.error(
      `${ANSI.red}✗ AAA verdicts: ${disallowed.length} unacknowledged Partial cell(s).${ANSI.reset}`,
    );
    for (const p of disallowed) {
      console.error(`  ${ANSI.red}PARTIAL${ANSI.reset} ${p.tag} · ${p.criterion} — ${p.evidence}`);
    }
    console.error('');
    console.error(`  To resolve, either:`);
    console.error(
      `    (a) fix the underlying gap (add setValidity, refine the component) so the next`,
    );
    console.error(
      `        ${ANSI.dim}pnpm aaa:audit${ANSI.reset} run flips the verdict to Supports, OR`,
    );
    console.error(
      `    (b) acknowledge known Partials with ${ANSI.dim}AAA_ALLOW_PARTIAL="hx-slider,hx-file-upload"${ANSI.reset}`,
    );
    console.error(
      `        (audited via the commit message — every acknowledgment is a paper trail).`,
    );
    process.exit(1);
  }
}

main();
