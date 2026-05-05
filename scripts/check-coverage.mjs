#!/usr/bin/env node

/**
 * Coverage Threshold Enforcement — HELiX
 *
 * Reads the Vitest v8 per-file coverage JSON output and enforces 80% line/branch/function
 * thresholds per component. Components listed in coverage-config.json as "exemptions"
 * are skipped (with a printed warning). New or modified components without exemptions
 * will fail the gate if they fall below threshold.
 *
 * Usage:
 *   node scripts/check-coverage.mjs              # Default: reads packages/hx-library/.cache/coverage
 *   node scripts/check-coverage.mjs --markdown   # Markdown summary for PR comment
 *   node scripts/check-coverage.mjs --json       # JSON output
 *
 * Scoped enforcement (prevents false failures from transitive imports):
 *   HX_COVERAGE_COMPONENTS=hx-button,hx-badge node scripts/check-coverage.mjs
 *
 *   When HX_COVERAGE_COMPONENTS is set, only the listed components are subject to the
 *   coverage gate. All other components found in the coverage data (e.g., those loaded
 *   transitively during focused component tests) are silently skipped. This prevents
 *   0%-coverage failures on components that were loaded as barrel-import side-effects
 *   but were not explicitly under test.
 *
 * Exit codes:
 *   0 — all non-exempt components meet threshold
 *   0 — scoped run (HX_COVERAGE_COMPONENTS) with missing coverage artifacts (skip)
 *   1 — one or more non-exempt components below threshold, or missing artifacts in unscoped runs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COVERAGE_DIR = resolve(ROOT, 'packages/hx-library/.cache/coverage');
const COVERAGE_JSON = resolve(COVERAGE_DIR, 'coverage-final.json');
const COVERAGE_SUMMARY = resolve(COVERAGE_DIR, 'coverage-summary.json');
const TEST_RESULTS_PATH = resolve(ROOT, 'packages/hx-library/.cache/test-results.json');
const CONFIG_PATH = resolve(ROOT, 'packages/hx-library/coverage-config.json');

const THRESHOLD = 80;

const args = process.argv.slice(2);
const isMarkdown = args.includes('--markdown');
const isJSON = args.includes('--json');

// When set, only enforce thresholds for the listed components (comma-separated).
// All other components in the coverage data are treated as transitive-only and skipped.
// This prevents false failures when vitest instruments barrel-imported files that were
// not explicitly under test (e.g. hx-checkbox loaded transitively while testing hx-patient-banner).
const HX_COVERAGE_COMPONENTS = process.env.HX_COVERAGE_COMPONENTS
  ? new Set(
      process.env.HX_COVERAGE_COMPONENTS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null; // null = no scoping, check all components

// ── Identify components whose tests actually ran on this shard ─────────────
// Vitest's --shard partitions test files by hash. When a PR changes N
// components but only M of their tests land on the current shard, the other
// N-M components' coverage appears as 0% even though their code is healthy —
// their tests simply ran on a different shard. We intersect the scoped
// component list with "components whose test file was in this run" so the
// coverage gate only enforces on components the shard actually exercised.
function loadShardComponents() {
  if (!existsSync(TEST_RESULTS_PATH)) {
    // Treated as a hard error by the caller when scoped enforcement is on —
    // we cannot intersect against a list that does not exist, and silently
    // enforcing every scoped component on every shard would re-introduce
    // the false-failure that the shard-aware check exists to fix.
    return null;
  }
  try {
    const results = JSON.parse(readFileSync(TEST_RESULTS_PATH, 'utf8'));
    const names = (results.testResults || [])
      .map((tr) => tr.name)
      .filter(Boolean)
      .map(extractComponent)
      .filter(Boolean);
    return new Set(names);
  } catch (err) {
    console.error(`Failed to parse ${TEST_RESULTS_PATH}: ${err.message}`);
    return null;
  }
}

// ── Load coverage config (exemptions) ──────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.warn('Warning: coverage-config.json not found — no exemptions applied');
    return {
      exemptions: {},
      threshold: {
        lines: THRESHOLD,
        branches: THRESHOLD,
        functions: THRESHOLD,
        statements: THRESHOLD,
      },
    };
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse coverage-config.json: ${err.message}`);
    process.exit(1);
  }
}

// ── Load coverage data ──────────────────────────────────────────────────────

function loadCoverageData() {
  // Prefer coverage-summary.json (aggregated per-file), fall back to coverage-final.json
  const summaryPath = existsSync(COVERAGE_SUMMARY) ? COVERAGE_SUMMARY : null;
  const finalPath = existsSync(COVERAGE_JSON) ? COVERAGE_JSON : null;

  if (!summaryPath && !finalPath) {
    if (HX_COVERAGE_COMPONENTS) {
      // Coverage data missing in a scoped CI shard run. Previously this path
      // exited 0 to work around a vitest/V8 Chromium teardown hang, but that
      // silently hid real coverage regressions. Fail the job so CI flags it;
      // the watchdog kill is now a real gate failure the shard owner must
      // diagnose (rerun the shard or raise the watchdog timeout).
      const msg =
        `No coverage data found in ${COVERAGE_DIR}. ` +
        `Scoped components: ${[...HX_COVERAGE_COMPONENTS].join(', ')}. ` +
        `Most likely the vitest watchdog killed the run during V8 coverage ` +
        `collection (Chromium teardown hang). Rerun this shard; if it hangs ` +
        `again, raise HX_VITEST_STALE_TIMEOUT for the shard or fix the ` +
        `underlying teardown.`;
      if (process.env.GITHUB_ACTIONS === 'true') {
        console.log(`::error title=Coverage gate failed::${msg}`);
      }
      console.error(msg);
      process.exit(1);
    }
    console.error(
      `No coverage data found in ${COVERAGE_DIR}\n` +
        `Run: pnpm --filter=@helixui/library run test:coverage`,
    );
    process.exit(1);
  }

  if (summaryPath) {
    return JSON.parse(readFileSync(summaryPath, 'utf8'));
  }

  // Build a summary from coverage-final.json
  const raw = JSON.parse(readFileSync(finalPath, 'utf8'));
  const summary = {};
  for (const [filePath, data] of Object.entries(raw)) {
    const s = data.s ? Object.values(data.s) : [];
    const b = data.b ? Object.values(data.b).flat() : [];
    const f = data.f ? Object.values(data.f) : [];

    const statementsCovered = s.filter(Boolean).length;
    const statementsTotal = s.length;
    const branchesCovered = b.filter(Boolean).length;
    const branchesTotal = b.length;
    const functionsCovered = f.filter(Boolean).length;
    const functionsTotal = f.length;

    summary[filePath] = {
      statements: {
        covered: statementsCovered,
        total: statementsTotal,
        pct:
          statementsTotal === 0 ? 100 : +((statementsCovered / statementsTotal) * 100).toFixed(2),
      },
      branches: {
        covered: branchesCovered,
        total: branchesTotal,
        pct: branchesTotal === 0 ? 100 : +((branchesCovered / branchesTotal) * 100).toFixed(2),
      },
      functions: {
        covered: functionsCovered,
        total: functionsTotal,
        pct: functionsTotal === 0 ? 100 : +((functionsCovered / functionsTotal) * 100).toFixed(2),
      },
      lines: { covered: 0, total: 0, pct: 100 }, // lines not in coverage-final.json
    };
  }
  return summary;
}

// ── Extract component name from file path ──────────────────────────────────

function extractComponent(filePath) {
  const match = filePath.match(/src\/components\/(hx-[^/]+)\//);
  return match ? match[1] : null;
}

// ── Aggregate per-component metrics ────────────────────────────────────────

function aggregateByComponent(coverageData) {
  const components = new Map();

  for (const [filePath, data] of Object.entries(coverageData)) {
    if (filePath === 'total') continue;
    const component = extractComponent(filePath);
    if (!component) continue;

    if (!components.has(component)) {
      components.set(component, { lines: [], branches: [], functions: [], statements: [] });
    }
    const agg = components.get(component);
    agg.lines.push(data.lines?.pct ?? 100);
    agg.branches.push(data.branches?.pct ?? 100);
    agg.functions.push(data.functions?.pct ?? 100);
    agg.statements.push(data.statements?.pct ?? 100);
  }

  // Average across files in the component
  const result = new Map();
  for (const [name, metrics] of components.entries()) {
    const avg = (arr) =>
      arr.length === 0 ? 100 : +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    result.set(name, {
      lines: avg(metrics.lines),
      branches: avg(metrics.branches),
      functions: avg(metrics.functions),
      statements: avg(metrics.statements),
    });
  }

  return result;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const config = loadConfig();
  const threshold = {
    lines: config.threshold?.lines ?? THRESHOLD,
    branches: config.threshold?.branches ?? THRESHOLD,
    functions: config.threshold?.functions ?? THRESHOLD,
    statements: config.threshold?.statements ?? THRESHOLD,
  };
  const exemptions = config.exemptions ?? {};

  // Shard-level short-circuit. The "few test files" branch in ci.yml writes
  // an empty test-results.json and skips vitest entirely on shards 2-4 when
  // the changed-file set produces fewer test files than shards. With no
  // vitest run there is no coverage data — but the shard still has nothing
  // to enforce. Exit 0 before loadCoverageData() trips the missing-data
  // hard fail. Only applies when scoped enforcement is active; full runs
  // continue to require coverage data.
  if (HX_COVERAGE_COMPONENTS) {
    const shardComponentsEarly = loadShardComponents();
    if (shardComponentsEarly === null) {
      // test-results.json missing. Two cases:
      //   (a) Per-shard run that genuinely skipped vitest — no coverage
      //       data exists either, treat as "nothing to enforce".
      //   (b) Dedicated Coverage job whose vitest CLI `--reporter=json`
      //       didn't honor the config's outputFile — coverage data IS
      //       written, just the test-results manifest is missing. Fall
      //       through to coverage threshold check against the data we have.
      // Distinguish via coverage-data presence.
      if (existsSync(COVERAGE_JSON) || existsSync(COVERAGE_SUMMARY)) {
        console.log(
          `Coverage gate: test-results.json missing but coverage data found. ` +
            `Falling through to threshold check against scoped components ` +
            `[${[...HX_COVERAGE_COMPONENTS].join(', ')}] using coverage data only.`,
        );
        // Continue past the shard short-circuit — main logic below will
        // intersect HX_COVERAGE_COMPONENTS against components present in
        // the coverage data and enforce thresholds on the intersection.
      } else {
        console.log(
          `Coverage gate: test-results.json AND coverage data both missing — ` +
            `tests didn't run on this run. Scoped components ` +
            `[${[...HX_COVERAGE_COMPONENTS].join(', ')}] enforced on runs that did.`,
        );
        process.exit(0);
      }
    } else if (shardComponentsEarly.size === 0) {
      console.log(
        `Shard had no test files to run — nothing to enforce. ` +
          `Scoped components [${[...HX_COVERAGE_COMPONENTS].join(', ')}] are checked on the shards that ran their tests.`,
      );
      process.exit(0);
    }
  }

  const coverageData = loadCoverageData();
  const components = aggregateByComponent(coverageData);

  if (components.size === 0) {
    console.warn('No component coverage data found — did tests run with --coverage.enabled?');
    process.exit(1);
  }

  const passing = [];
  const failing = [];
  const exempt = [];
  const transitive = []; // components skipped because they were not explicitly under test
  const otherShard = []; // components in scope but whose tests ran on a different shard

  const shardComponents = HX_COVERAGE_COMPONENTS ? loadShardComponents() : null;

  if (HX_COVERAGE_COMPONENTS) {
    console.log(
      `Scoped enforcement: checking only [${[...HX_COVERAGE_COMPONENTS].join(', ')}] — other components in coverage data are transitive imports and will be skipped.`,
    );
    if (shardComponents) {
      console.log(
        `Shard ran tests for: [${[...shardComponents].sort().join(', ') || '(none)'}]. Scoped components not in this list are enforced on another shard.`,
      );
    }
    console.log('');
  }

  for (const [name, metrics] of [...components.entries()].sort()) {
    // If scoped enforcement is active, skip components not in the explicit test list
    if (HX_COVERAGE_COMPONENTS && !HX_COVERAGE_COMPONENTS.has(name)) {
      transitive.push({ name, metrics });
      continue;
    }

    // Scoped component whose test file did not run on this shard — skip.
    // Its coverage will be enforced by the shard that actually ran it.
    if (HX_COVERAGE_COMPONENTS && shardComponents && !shardComponents.has(name)) {
      otherShard.push({ name, metrics });
      continue;
    }

    const isExempt = Boolean(exemptions[name]);
    const belowThreshold =
      metrics.lines < threshold.lines ||
      metrics.branches < threshold.branches ||
      metrics.functions < threshold.functions ||
      metrics.statements < threshold.statements;

    if (isExempt) {
      exempt.push({ name, metrics, exemption: exemptions[name] });
    } else if (belowThreshold) {
      failing.push({ name, metrics });
    } else {
      passing.push({ name, metrics });
    }
  }

  if (isJSON) {
    console.log(
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          threshold,
          summary: {
            total: components.size,
            passing: passing.length,
            failing: failing.length,
            exempt: exempt.length,
          },
          passing,
          failing,
          exempt,
        },
        null,
        2,
      ),
    );
    process.exit(failing.length > 0 ? 1 : 0);
  }

  if (isMarkdown) {
    const lines = [];
    lines.push('## Coverage Report');
    lines.push('');

    const statusIcon = failing.length > 0 ? 'FAIL' : 'PASS';
    lines.push(
      `**Status:** ${statusIcon} | **Threshold:** ${threshold.lines}% lines / ${threshold.branches}% branches / ${threshold.functions}% functions`,
    );
    lines.push('');
    lines.push(
      `**${passing.length} passing** | **${failing.length} failing** | **${exempt.length} exempt**`,
    );
    lines.push('');

    if (failing.length > 0) {
      lines.push('### Components below threshold');
      lines.push('');
      lines.push('| Component | Lines | Branches | Functions | Statements |');
      lines.push('| :--- | ---: | ---: | ---: | ---: |');
      for (const { name, metrics } of failing) {
        const fmt = (v, t) => (v < t ? `**${v}%**` : `${v}%`);
        lines.push(
          `| \`${name}\` | ${fmt(metrics.lines, threshold.lines)} | ${fmt(metrics.branches, threshold.branches)} | ${fmt(metrics.functions, threshold.functions)} | ${fmt(metrics.statements, threshold.statements)} |`,
        );
      }
      lines.push('');
    }

    if (exempt.length > 0) {
      lines.push('<details>');
      lines.push('<summary>Exempt components</summary>');
      lines.push('');
      lines.push('| Component | Lines | Branches | Functions | Remediation |');
      lines.push('| :--- | ---: | ---: | ---: | :--- |');
      for (const { name, metrics, exemption } of exempt) {
        lines.push(
          `| \`${name}\` | ${metrics.lines}% | ${metrics.branches}% | ${metrics.functions}% | ${exemption.remediationDate} |`,
        );
      }
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }

    if (passing.length > 0) {
      lines.push('<details>');
      lines.push('<summary>Passing components</summary>');
      lines.push('');
      lines.push('| Component | Lines | Branches | Functions |');
      lines.push('| :--- | ---: | ---: | ---: |');
      for (const { name, metrics } of passing) {
        lines.push(
          `| \`${name}\` | ${metrics.lines}% | ${metrics.branches}% | ${metrics.functions}% |`,
        );
      }
      lines.push('');
      lines.push('</details>');
    }

    console.log(lines.join('\n'));
    process.exit(failing.length > 0 ? 1 : 0);
  }

  // Human-readable output
  console.log('=== HELiX Coverage Threshold Report ===\n');
  console.log(
    `Threshold: ${threshold.lines}% lines / ${threshold.branches}% branches / ${threshold.functions}% functions\n`,
  );

  if (failing.length > 0) {
    console.log(`FAIL — ${failing.length} component(s) below threshold:\n`);
    for (const { name, metrics } of failing) {
      const flags = [];
      if (metrics.lines < threshold.lines) flags.push(`lines: ${metrics.lines}%`);
      if (metrics.branches < threshold.branches) flags.push(`branches: ${metrics.branches}%`);
      if (metrics.functions < threshold.functions) flags.push(`functions: ${metrics.functions}%`);
      if (metrics.statements < threshold.statements)
        flags.push(`statements: ${metrics.statements}%`);
      console.log(`  FAIL  ${name.padEnd(30)} ${flags.join(', ')}`);
    }
    console.log('');
  }

  if (exempt.length > 0) {
    console.log(`EXEMPT — ${exempt.length} component(s) skipped (see coverage-config.json):\n`);
    for (const { name, exemption } of exempt) {
      console.log(`  SKIP  ${name.padEnd(30)} remediation: ${exemption.remediationDate}`);
    }
    console.log('');
  }

  console.log(`PASS — ${passing.length} component(s) meeting threshold`);
  console.log('');
  if (otherShard.length > 0) {
    console.log(
      `SHARD-SKIP — ${otherShard.length} scoped component(s) whose tests ran on a different shard: ${otherShard.map((o) => o.name).join(', ')}\n`,
    );
  }
  const transitiveNote = transitive.length > 0 ? `, ${transitive.length} transitive-skip` : '';
  const shardNote = otherShard.length > 0 ? `, ${otherShard.length} shard-skip` : '';
  console.log(
    `Summary: ${passing.length} passing, ${failing.length} failing, ${exempt.length} exempt${shardNote}${transitiveNote} (${components.size} total)\n`,
  );

  if (failing.length > 0) {
    console.error(
      `Coverage gate failed: ${failing.length} non-exempt component(s) below ${threshold.lines}% threshold.\n` +
        `Add tests or add the component to packages/hx-library/coverage-config.json with a remediation date.`,
    );
    process.exit(1);
  }

  process.exit(0);
}

main();
