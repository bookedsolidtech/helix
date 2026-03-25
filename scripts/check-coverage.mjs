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
 * Exit codes:
 *   0 — all non-exempt components meet threshold
 *   1 — one or more non-exempt components below threshold
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COVERAGE_DIR = resolve(ROOT, 'packages/hx-library/.cache/coverage');
const COVERAGE_JSON = resolve(COVERAGE_DIR, 'coverage-final.json');
const COVERAGE_SUMMARY = resolve(COVERAGE_DIR, 'coverage-summary.json');
const CONFIG_PATH = resolve(ROOT, 'packages/hx-library/coverage-config.json');

const THRESHOLD = 80;

const args = process.argv.slice(2);
const isMarkdown = args.includes('--markdown');
const isJSON = args.includes('--json');

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

  const coverageData = loadCoverageData();
  const components = aggregateByComponent(coverageData);

  if (components.size === 0) {
    console.warn('No component coverage data found — did tests run with --coverage.enabled?');
    process.exit(0);
  }

  const passing = [];
  const failing = [];
  const exempt = [];

  for (const [name, metrics] of [...components.entries()].sort()) {
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
  console.log(
    `Summary: ${passing.length} passing, ${failing.length} failing, ${exempt.length} exempt (${components.size} total)\n`,
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
