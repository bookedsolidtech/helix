#!/usr/bin/env node

/**
 * Story Coverage Audit — HELiX
 *
 * Scans all components in packages/hx-library/src/components/ and reports:
 * - Which components have .stories.ts files
 * - How many story variants each has
 * - Which stories have play() interaction test functions
 * - Whether storybook/test utilities are imported
 *
 * Usage:
 *   node scripts/audit-story-coverage.js [--output <path>]
 *
 * Defaults:
 *   --output  docs/stories-coverage.md
 *
 * Exit codes:
 *   0  All components have stories
 *   1  One or more components are missing story files
 */

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = join(ROOT, 'packages/hx-library/src/components');

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const OUTPUT_PATH = getArg('--output') ?? join(ROOT, 'docs/stories-coverage.md');

// Directories to exclude from the audit.
// '__tests__' is the shared test utilities directory (not a component).
// 'hx-style-scope' is an internal Drupal light-DOM style injection wrapper
//   with no user-visible UI — excluded by design per audit-workflow.md.
const EXCLUDED_DIRS = ['__tests__', 'hx-style-scope'];

async function analyzeStoryFile(filePath) {
  const content = await readFile(filePath, 'utf-8');

  // Count named story exports (export const Foo: Story = ...)
  const storyExports = (content.match(/^export const \w+:\s*Story/gm) ?? []).length;

  // Count play: function entries
  const playFunctions = (content.match(/^\s+play:/gm) ?? []).length;

  // Check for storybook/test import (interaction test indicator)
  const hasInteractionImport =
    content.includes("from 'storybook/test'") || content.includes('from "@storybook/test"');

  return { storyExports, playFunctions, hasInteractionImport };
}

async function auditComponents() {
  const entries = await readdir(COMPONENTS_DIR);
  const results = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.includes(entry)) continue;

    const componentDir = join(COMPONENTS_DIR, entry);
    const info = await stat(componentDir);
    if (!info.isDirectory()) continue;

    const files = await readdir(componentDir);
    const storyFiles = files.filter((f) => f.endsWith('.stories.ts'));

    if (storyFiles.length === 0) {
      results.push({
        component: entry,
        hasStory: false,
        storyCount: 0,
        playCount: 0,
        hasInteractionImport: false,
        status: 'MISSING',
      });
      continue;
    }

    let totalStories = 0;
    let totalPlay = 0;
    let hasInteractionImport = false;

    for (const storyFile of storyFiles) {
      const {
        storyExports,
        playFunctions,
        hasInteractionImport: hit,
      } = await analyzeStoryFile(join(componentDir, storyFile));
      totalStories += storyExports;
      totalPlay += playFunctions;
      hasInteractionImport = hasInteractionImport || hit;
    }

    let status;
    if (totalPlay === 0) {
      status = 'NO_PLAY';
    } else if (totalPlay >= totalStories) {
      status = 'COMPLETE';
    } else {
      status = 'PARTIAL';
    }

    results.push({
      component: entry,
      hasStory: true,
      storyCount: totalStories,
      playCount: totalPlay,
      hasInteractionImport,
      status,
    });
  }

  return results;
}

function generateReport(results) {
  const total = results.length;
  const missing = results.filter((r) => r.status === 'MISSING').length;
  const complete = results.filter((r) => r.status === 'COMPLETE').length;
  const noPlay = results.filter((r) => r.status === 'NO_PLAY').length;
  const partial = results.filter((r) => r.status === 'PARTIAL').length;
  const withInteraction = results.filter((r) => r.hasInteractionImport).length;
  const totalPlay = results.reduce((sum, r) => sum + r.playCount, 0);
  const totalStories = results.reduce((sum, r) => sum + r.storyCount, 0);
  const date = new Date().toISOString().split('T')[0];

  const pct = (n) => `${Math.round((n / total) * 100)}%`;

  let md = `# Story Coverage Report\n\n`;
  md += `> Generated: ${date} — ${total} components audited\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Count | % of Total |\n`;
  md += `|--------|------:|----------:|\n`;
  md += `| Total components | ${total} | 100% |\n`;
  md += `| Has story file | ${total - missing} | ${pct(total - missing)} |\n`;
  md += `| Complete (all stories have play) | ${complete} | ${pct(complete)} |\n`;
  md += `| Partial (some stories have play) | ${partial} | ${pct(partial)} |\n`;
  md += `| Stories file, no play functions | ${noPlay} | ${pct(noPlay)} |\n`;
  md += `| Missing story file | ${missing} | ${pct(missing)} |\n`;
  md += `| With interaction test imports | ${withInteraction} | ${pct(withInteraction)} |\n`;
  md += `| Total story variants | ${totalStories} | — |\n`;
  md += `| Total play functions | ${totalPlay} | — |\n\n`;

  md += `## Legend\n\n`;
  md += `| Status | Meaning |\n`;
  md += `|--------|---------|\n`;
  md += `| ✅ COMPLETE | Story file exists, all variants have play functions |\n`;
  md += `| 🔶 PARTIAL | Story file exists, some variants have play functions |\n`;
  md += `| ⚠️ NO_PLAY | Story file exists, no play functions defined |\n`;
  md += `| ❌ MISSING | No story file found for this component |\n\n`;

  md += `## Component Coverage\n\n`;
  md += `| Component | Stories | Play Fns | Interaction Import | Status |\n`;
  md += `|-----------|--------:|---------:|:-----------------:|--------|\n`;

  const STATUS_ORDER = { MISSING: 0, NO_PLAY: 1, PARTIAL: 2, COMPLETE: 3 };
  const STATUS_ICON = {
    COMPLETE: '✅',
    PARTIAL: '🔶',
    NO_PLAY: '⚠️',
    MISSING: '❌',
  };

  const sorted = [...results].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  for (const r of sorted) {
    const icon = STATUS_ICON[r.status];
    const interactionMark = r.hasInteractionImport ? '✅' : '—';
    md += `| \`${r.component}\` | ${r.storyCount} | ${r.playCount} | ${interactionMark} | ${icon} ${r.status} |\n`;
  }

  if (missing > 0) {
    md += `\n## Missing Story Files\n\n`;
    md += `The following components have no \`.stories.ts\` file. Add stories before merging any component changes.\n\n`;
    for (const r of results.filter((r) => r.status === 'MISSING')) {
      md += `- \`${r.component}\`\n`;
    }
  }

  return md;
}

async function main() {
  console.log('Auditing Storybook story coverage...\n');

  const results = await auditComponents();
  const report = generateReport(results);

  const outputDir = dirname(OUTPUT_PATH);
  await mkdir(outputDir, { recursive: true });
  await writeFile(OUTPUT_PATH, report, 'utf-8');

  const total = results.length;
  const missing = results.filter((r) => r.status === 'MISSING').length;
  const complete = results.filter((r) => r.status === 'COMPLETE').length;
  const totalPlay = results.reduce((sum, r) => sum + r.playCount, 0);

  console.log(`Components audited:          ${total}`);
  console.log(`With story files:            ${total - missing}/${total}`);
  console.log(`Complete play coverage:      ${complete}/${total}`);
  console.log(`Total play functions:        ${totalPlay}`);
  console.log(`\nReport written to: ${OUTPUT_PATH}`);

  if (missing > 0) {
    console.log(`\n⚠️  ${missing} component(s) missing story files`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
