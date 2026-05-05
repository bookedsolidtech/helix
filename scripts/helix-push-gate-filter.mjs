#!/usr/bin/env node
/**
 * helix-push-gate-filter.mjs
 *
 * Post-process the rea push-gate verdict to filter out findings whose
 * `file` path resolves to a rea-managed file. The helix project cannot
 * patch rea-managed files locally (they are upstream-owned and refresh
 * on every `rea install`), so codex review findings against those paths
 * are out-of-scope for any helix PR — they belong upstream as bug
 * reports against `@bookedsolid/rea` itself.
 *
 * Why this exists
 * ---------------
 * The rea push-gate compares a feature branch against `origin/HEAD`
 * (typically `main`), which makes its diff the cumulative branch-vs-main
 * delta — including everything that landed in `dev` since the last
 * `dev → main` promotion. That diff includes rea-managed hook files
 * (e.g. `.claude/hooks/_lib/cmd-segments.sh`) merged via earlier rea
 * upgrade PRs (PR #1629 et al). When codex flags real defects in those
 * files, the helix push is blocked even though no helix code touches them.
 *
 * Without this filter, the only options are:
 *   (a) `REA_SKIP_PUSH_GATE=1` for every push — too coarse; suppresses
 *       legitimate findings in helix code as well.
 *   (b) Hold every PR until upstream rea releases a fix — blocks Group
 *       3-10 progress indefinitely.
 *   (c) Patch rea-managed files locally — violates upstream contract,
 *       gets overwritten on next install.
 *
 * This filter is the durable form of (a): targeted, audit-trailed,
 * no-bypass-for-helix-code.
 *
 * How it works
 * ------------
 *  1. Read `.rea/last-review.json` — the machine-readable verdict from
 *     the most recent rea push-gate run.
 *  2. Read `.rea/install-manifest.json` — the canonical list of rea-
 *     managed paths.
 *  3. Filter `findings[]`: drop any finding whose `file` path matches
 *     a rea-managed path (resolved to absolute, repo-relative compare).
 *  4. Recompute verdict on filtered findings (`pass` if empty, `concerns`
 *     if all P2/P3, `blocking` if any P0/P1).
 *  5. If filtered verdict is `pass` AND original verdict was non-pass,
 *     emit a SAFE-TO-RETRY signal AND log the filter decision to
 *     `.reports/codex/push-gate-filter-log.jsonl` (local audit trail).
 *
 * The filter is INVOKED MANUALLY by the operator after a push fails —
 * NOT automatically integrated into `.husky/pre-push` (that file is
 * rea-managed). Workflow:
 *
 *   $ git push -u origin feature-branch
 *   # rea push-gate exits non-zero
 *   $ node scripts/helix-push-gate-filter.mjs
 *   # If verdict says SAFE-TO-RETRY, you may then:
 *   $ REA_SKIP_PUSH_GATE=1 git push -u origin feature-branch
 *   # NOTE: Jake-only authority for the bypass; this filter explains
 *   # WHY the bypass is justified, not WHO can run it.
 *
 * Output
 * ------
 *   stdout: human-readable summary (verdict before/after, finding counts,
 *           list of filtered-out paths and remaining findings)
 *   exit code: 0 = SAFE-TO-RETRY (all blocking findings were in rea-
 *              managed paths)
 *              1 = NOT-SAFE-TO-RETRY (real findings remain in helix code)
 *              2 = error reading inputs (no last-review or no manifest)
 *
 * The filter is read-only with respect to `.rea/`. It only writes to
 * `.reports/codex/push-gate-filter-log.jsonl` (audit trail) which is
 * gitignored.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const REPO_ROOT = process.cwd();
const REVIEW_PATH = resolve(REPO_ROOT, '.rea/last-review.json');
const MANIFEST_PATH = resolve(REPO_ROOT, '.rea/install-manifest.json');
const LOG_DIR = resolve(REPO_ROOT, '.reports/codex');
const LOG_PATH = resolve(LOG_DIR, 'push-gate-filter-log.jsonl');

function fail(message, code = 2) {
  console.error(`helix-push-gate-filter: ${message}`);
  process.exit(code);
}

function readJsonOrFail(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(`invalid ${label}: ${err.message}`);
  }
  return undefined;
}

function loadReaManagedPaths(manifest) {
  // The manifest shape is `{ files: [{ path: "..." }, ...] }` per
  // `.rea/install-manifest.json` schema. Treat each entry as repo-relative.
  const entries = Array.isArray(manifest?.files) ? manifest.files : [];
  const paths = new Set();
  for (const entry of entries) {
    if (typeof entry?.path === 'string' && entry.path.length > 0) {
      paths.add(entry.path);
    }
  }
  return paths;
}

function findingPathRelativeToRepo(finding) {
  const filePath = finding?.file ?? '';
  if (!filePath) return '';
  // Push-gate findings carry absolute paths (e.g. /Volumes/Development/booked/helix/...).
  // Convert to repo-relative for comparison against the manifest.
  const abs = resolve(filePath);
  return relative(REPO_ROOT, abs);
}

function severityToPriority(severity) {
  // Higher number = more severe. Used to recompute the verdict after
  // filtering. Mirrors rea's own verdict ladder.
  switch ((severity ?? '').toUpperCase()) {
    case 'P0':
    case 'CRITICAL':
      return 4;
    case 'P1':
    case 'HIGH':
      return 3;
    case 'P2':
    case 'MEDIUM':
      return 2;
    case 'P3':
    case 'LOW':
      return 1;
    default:
      return 0;
  }
}

function recomputeVerdict(findings) {
  if (findings.length === 0) return 'pass';
  const maxPriority = findings.reduce((acc, f) => Math.max(acc, severityToPriority(f.severity)), 0);
  if (maxPriority >= 3) return 'blocking'; // P0/P1
  if (maxPriority >= 1) return 'concerns'; // P2/P3
  return 'pass';
}

function appendAuditLog(entry) {
  try {
    if (!existsSync(LOG_DIR)) {
      mkdirSync(LOG_DIR, { recursive: true });
    }
    appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
  } catch (err) {
    // Audit log is best-effort — never block on it.
    console.error(`helix-push-gate-filter: audit log write failed: ${err.message}`);
  }
}

function main() {
  const review = readJsonOrFail(REVIEW_PATH, '.rea/last-review.json');
  const manifest = readJsonOrFail(MANIFEST_PATH, '.rea/install-manifest.json');

  const reaManagedPaths = loadReaManagedPaths(manifest);
  const allFindings = Array.isArray(review.findings) ? review.findings : [];

  const filteredOut = [];
  const remaining = [];
  for (const finding of allFindings) {
    const repoRelative = findingPathRelativeToRepo(finding);
    if (reaManagedPaths.has(repoRelative)) {
      filteredOut.push({ ...finding, _repoRelative: repoRelative });
    } else {
      remaining.push(finding);
    }
  }

  const originalVerdict = review.verdict ?? 'unknown';
  const filteredVerdict = recomputeVerdict(remaining);

  const safeToRetry =
    (originalVerdict === 'concerns' || originalVerdict === 'blocking') &&
    filteredVerdict === 'pass';

  // Human-readable report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('helix push-gate filter — rea-managed path exclusion');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`base:                ${review.base_ref ?? '(unknown)'}`);
  console.log(`head:                ${review.head_sha ?? '(unknown)'}`);
  console.log(`original verdict:    ${originalVerdict}`);
  console.log(`filtered verdict:    ${filteredVerdict}`);
  console.log(`total findings:      ${allFindings.length}`);
  console.log(`filtered (rea-mgd):  ${filteredOut.length}`);
  console.log(`remaining (helix):   ${remaining.length}`);
  console.log('');

  if (filteredOut.length > 0) {
    console.log('Filtered-out findings (rea-managed paths — file upstream):');
    for (const f of filteredOut) {
      console.log(`  - [${f.severity}] ${f._repoRelative}:${f.line ?? '?'} — ${f.title ?? ''}`);
    }
    console.log('');
  }

  if (remaining.length > 0) {
    console.log('Remaining findings (helix code — must fix before push):');
    for (const f of remaining) {
      const path = findingPathRelativeToRepo(f);
      console.log(`  - [${f.severity}] ${path}:${f.line ?? '?'} — ${f.title ?? ''}`);
    }
    console.log('');
  }

  if (safeToRetry) {
    console.log('VERDICT: SAFE-TO-RETRY');
    console.log('All blocking findings are in rea-managed files — file upstream and');
    console.log('use the rea-sanctioned bypass:');
    console.log('');
    console.log('    REA_SKIP_PUSH_GATE=1 git push -u origin <branch>');
    console.log('');
    console.log("Authority: bypass requires Jake's explicit approval per project policy.");
    console.log('');
  } else if (remaining.length > 0) {
    console.log('VERDICT: NOT-SAFE-TO-RETRY');
    console.log('Real findings remain in helix code. Fix before pushing.');
    console.log('');
  } else {
    console.log('VERDICT: NO BYPASS NEEDED');
    console.log('Original push-gate already passed.');
    console.log('');
  }

  appendAuditLog({
    timestamp: new Date().toISOString(),
    base_ref: review.base_ref,
    head_sha: review.head_sha,
    original_verdict: originalVerdict,
    filtered_verdict: filteredVerdict,
    safe_to_retry: safeToRetry,
    total_findings: allFindings.length,
    filtered_out_count: filteredOut.length,
    remaining_count: remaining.length,
    filtered_out_paths: filteredOut.map((f) => f._repoRelative),
    remaining_paths: remaining.map((f) => findingPathRelativeToRepo(f)),
  });

  process.exit(safeToRetry ? 0 : remaining.length > 0 ? 1 : 0);
}

main();
