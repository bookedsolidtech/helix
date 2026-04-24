#!/usr/bin/env tsx
/**
 * Validate every line in a campaign findings.jsonl against the canonical schema.
 *
 * Usage:
 *   tsx scripts/codex-campaigns/lib/validate-findings.ts <campaign-name>
 *   tsx scripts/codex-campaigns/lib/validate-findings.ts --file <path>
 *
 * Exit codes:
 *   0 — every line valid
 *   1 — one or more invalid lines (errors printed to stderr)
 *   2 — input file missing
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateFinding } from './finding-schema.js';

const args = process.argv.slice(2);
let path: string;

if (args[0] === '--file' && args[1]) {
  path = resolve(args[1]);
} else if (args[0] && !args[0].startsWith('--')) {
  path = resolve(`.reports/codex/campaigns/${args[0]}/findings.jsonl`);
} else {
  console.error('usage: validate-findings.ts <campaign-name> | --file <path-to-jsonl>');
  process.exit(2);
}

if (!existsSync(path)) {
  console.error(`findings file not found: ${path}`);
  process.exit(2);
}

const lines = readFileSync(path, 'utf8').split('\n');
let invalid = 0;
let total = 0;

lines.forEach((raw, index) => {
  const line = raw.trim();
  if (line.length === 0) return;
  total += 1;
  const lineNo = index + 1;

  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch (err) {
    invalid += 1;
    console.error(`L${lineNo}: invalid JSON — ${(err as Error).message}`);
    return;
  }

  const result = validateFinding(parsed);
  if (!result.ok) {
    invalid += 1;
    console.error(`L${lineNo}: ${result.errors.join('; ')}`);
  }
});

if (invalid > 0) {
  console.error(`\n${invalid}/${total} findings invalid in ${path}`);
  process.exit(1);
}

console.log(`OK: ${total} findings valid in ${path}`);
