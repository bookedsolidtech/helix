#!/usr/bin/env tsx
/**
 * Consolidate a campaign's findings.jsonl into:
 *   - findings.md       — human-readable rollup (severity, then file)
 *   - scoreboard.json   — per-target verdict counts (dashboard ingestion)
 *
 * The JSONL is canonical. This script is purely a view generator — it must
 * never mutate findings.jsonl. Re-run idempotently after every batch.
 *
 * Usage:
 *   tsx scripts/codex-campaigns/lib/consolidate-findings.ts <campaign-name>
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import {
  validateFinding,
  type Finding,
  type Severity,
  type Verdict,
  SEVERITY_ORDER,
} from './finding-schema.js';

const campaign = process.argv[2];
if (!campaign) {
  console.error('usage: consolidate-findings.ts <campaign-name>');
  process.exit(2);
}

const campaignDir = resolve(`.reports/codex/campaigns/${campaign}`);
const jsonlPath = resolve(campaignDir, 'findings.jsonl');
const targetsPath = resolve(`scripts/codex-campaigns/campaign-${campaign}`, 'targets.txt');

if (!existsSync(jsonlPath)) {
  console.error(`findings file not found: ${jsonlPath}`);
  process.exit(2);
}

// Seed the scoreboard with the full target manifest so targets that produced
// zero findings (clean passes) still appear with verdict="pass". Without
// this, the scoreboard only surfaces targets with at least one finding and
// cannot distinguish "passed cleanly" from "never ran."
function loadTargetManifest(): string[] {
  if (!existsSync(targetsPath)) return [];
  return readFileSync(targetsPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
}

const findings: Finding[] = [];
const lines = readFileSync(jsonlPath, 'utf8').split('\n');
let invalid = 0;

lines.forEach((raw, index) => {
  const line = raw.trim();
  if (line.length === 0) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    invalid += 1;
    console.error(`L${index + 1}: invalid JSON, skipping`);
    return;
  }
  const result = validateFinding(parsed);
  if (!result.ok) {
    invalid += 1;
    console.error(`L${index + 1}: ${result.errors.join('; ')}`);
    return;
  }
  findings.push(parsed as Finding);
});

if (invalid > 0) {
  console.error(`\n${invalid} invalid findings skipped`);
}

const scoreboard = buildScoreboard(findings, loadTargetManifest());
const markdown = buildMarkdown(campaign, findings, invalid);

writeFileSync(resolve(campaignDir, 'scoreboard.json'), JSON.stringify(scoreboard, null, 2));
writeFileSync(resolve(campaignDir, 'findings.md'), markdown);

console.log(
  `wrote ${campaignDir}/findings.md and scoreboard.json — ${findings.length} valid findings across ${scoreboard.targets.length} targets`,
);

interface TargetScore {
  target: string;
  tag?: string;
  finding_count: number;
  by_severity: Record<Severity, number>;
  verdict: Verdict;
}

interface Scoreboard {
  campaign: string;
  generated_at: string;
  total_findings: number;
  invalid_lines: number;
  by_severity: Record<Severity, number>;
  by_verdict: Record<Verdict, number>;
  targets: TargetScore[];
}

function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function emptyVerdictMap(): Record<Verdict, number> {
  return { pass: 0, concerns: 0, blocking: 0, error: 0 };
}

function buildScoreboard(items: Finding[], manifest: string[]): Scoreboard {
  const targets = new Map<string, TargetScore>();
  const bySeverity = emptySeverityMap();

  // Pre-seed every target from the manifest with a default pass entry so
  // zero-finding runs register as passes rather than disappearing.
  for (const target of manifest) {
    targets.set(target, {
      target,
      finding_count: 0,
      by_severity: emptySeverityMap(),
      verdict: 'pass',
    });
  }

  for (const f of items) {
    bySeverity[f.severity] += 1;

    let entry = targets.get(f.target);
    if (!entry) {
      entry = {
        target: f.target,
        tag: f.tag,
        finding_count: 0,
        by_severity: emptySeverityMap(),
        verdict: 'pass',
      };
      targets.set(f.target, entry);
    }
    if (f.tag && !entry.tag) entry.tag = f.tag;
    entry.finding_count += 1;
    entry.by_severity[f.severity] += 1;
    entry.verdict = escalate(entry.verdict, f.verdict_for_target);
  }

  const byVerdict = emptyVerdictMap();
  for (const t of targets.values()) byVerdict[t.verdict] += 1;

  return {
    campaign,
    generated_at: new Date().toISOString(),
    total_findings: items.length,
    invalid_lines: invalid,
    by_severity: bySeverity,
    by_verdict: byVerdict,
    targets: [...targets.values()].sort((a, b) => a.target.localeCompare(b.target)),
  };
}

function escalate(current: Verdict, next: Verdict): Verdict {
  const rank: Record<Verdict, number> = {
    pass: 0,
    concerns: 1,
    blocking: 2,
    error: 3,
  };
  return rank[next] > rank[current] ? next : current;
}

function buildMarkdown(name: string, items: Finding[], invalidCount: number): string {
  const sorted = [...items].sort((a, b) => {
    const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sev !== 0) return sev;
    const file = a.file.localeCompare(b.file);
    if (file !== 0) return file;
    return a.line - b.line;
  });

  const out: string[] = [];
  out.push(`# ${name} — Codex Campaign Findings`);
  out.push('');
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push(`Source: \`.reports/codex/campaigns/${name}/findings.jsonl\` (canonical)`);
  out.push('');
  out.push(`Total findings: **${items.length}**`);
  if (invalidCount > 0) {
    out.push(`Invalid lines skipped: **${invalidCount}** (see stderr)`);
  }
  out.push('');
  out.push(severityTable(items));
  out.push('');
  out.push(targetTable(items));
  out.push('');
  out.push('## Findings');
  out.push('');

  let lastSeverity: Severity | undefined;
  let lastFile: string | undefined;
  for (const f of sorted) {
    if (f.severity !== lastSeverity) {
      out.push(`### ${f.severity.toUpperCase()}`);
      out.push('');
      lastSeverity = f.severity;
      lastFile = undefined;
    }
    if (f.file !== lastFile) {
      out.push(`#### \`${f.file}\``);
      out.push('');
      lastFile = f.file;
    }
    out.push(
      `- **${f.category}** — \`${f.file}:${f.line}\`${f.public_surface ? ` (\`${f.public_surface}\`)` : ''}`,
    );
    out.push(`  - **Issue:** ${f.issue}`);
    out.push(`  - **Evidence:** \`${escapeBackticks(f.evidence)}\``);
    out.push(`  - **Fix:** ${f.fix}`);
    out.push('');
  }

  return out.join('\n');
}

function escapeBackticks(s: string): string {
  return s.replace(/`/g, '\\`');
}

function severityTable(items: Finding[]): string {
  const counts = emptySeverityMap();
  for (const f of items) counts[f.severity] += 1;
  const rows = (Object.keys(counts) as Severity[]).map((s) => `| ${s} | ${counts[s]} |`).join('\n');
  return `| Severity | Count |\n| --- | --- |\n${rows}`;
}

function targetTable(items: Finding[]): string {
  const map = new Map<string, { verdict: Verdict; count: number; tag?: string }>();
  for (const f of items) {
    let row = map.get(f.target);
    if (!row) {
      row = { verdict: 'pass', count: 0, tag: f.tag };
      map.set(f.target, row);
    }
    row.count += 1;
    row.verdict = escalate(row.verdict, f.verdict_for_target);
  }
  const rows = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([target, r]) =>
        `| ${r.tag ?? basename(target)} | ${r.verdict} | ${r.count} | \`${target}\` |`,
    )
    .join('\n');
  return `| Tag | Verdict | Findings | Target |\n| --- | --- | --- | --- |\n${rows}`;
}

void dirname;
