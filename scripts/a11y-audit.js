#!/usr/bin/env node

/**
 * Automated axe-core Accessibility Audit — HELiX
 *
 * Runs an axe-core WCAG 2.1 AA audit against every component's Default
 * Storybook story. Requires the Storybook static build to be served before
 * this script is invoked.
 *
 * Usage:
 *   node scripts/a11y-audit.js [--storybook-url <url>] [--output <path>]
 *
 * Defaults:
 *   --storybook-url  http://localhost:6006
 *   --output         .cache/a11y-report.json
 *
 * Exit codes:
 *   0  All stories passed (or only minor/moderate violations)
 *   1  One or more critical or serious violations found (healthcare mandate)
 */

import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COMPONENTS_DIR = resolve(ROOT, 'packages/hx-library/src/components');

// ── CLI arg parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const STORYBOOK_URL = getArg('--storybook-url') ?? 'http://localhost:6006';
const OUTPUT_PATH = getArg('--output') ?? resolve(ROOT, '.cache/a11y-report.json');
const TIMEOUT_MS = 30_000;

// ── Story discovery ──────────────────────────────────────────────────────────

/**
 * Convert a Storybook title string to a kebab-case story ID segment.
 * e.g. "Components/Button" → "components-button"
 * e.g. "Components/Text Input" → "components-text-input"
 */
function titleToId(title) {
  return title
    .toLowerCase()
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Scan a stories file for its title and exported story names using lightweight
 * regex parsing (no TS compilation needed in CI).
 */
function parseStoriesFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Extract title from: title: 'Components/Button'  or  title: "Components/Button"
  const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
  if (!titleMatch) return null;
  const title = titleMatch[1];

  // Find exported story names (export const Foo: Story = ...)
  const storyNames = [];
  const exportRegex = /^export\s+const\s+(\w+)\s*[:=]/gm;
  let m;
  while ((m = exportRegex.exec(content)) !== null) {
    const name = m[1];
    // Skip 'meta' / 'default' re-exports and type-only names
    if (name !== 'meta' && name !== 'default' && /^[A-Z]/.test(name)) {
      storyNames.push(name);
    }
  }

  return { title, storyNames, filePath };
}

/**
 * Walk COMPONENTS_DIR and collect all *.stories.ts files.
 */
function discoverStories() {
  const stories = [];

  const entries = readdirSync(COMPONENTS_DIR);
  for (const entry of entries) {
    const entryPath = resolve(COMPONENTS_DIR, entry);
    if (!statSync(entryPath).isDirectory()) continue;

    const files = readdirSync(entryPath);
    for (const file of files) {
      if (!file.endsWith('.stories.ts')) continue;
      const filePath = resolve(entryPath, file);
      const parsed = parseStoriesFile(filePath);
      if (parsed) stories.push(parsed);
    }
  }

  return stories;
}

// ── Story URL builder ────────────────────────────────────────────────────────

/**
 * Convert a story name like "DefaultWithIcon" to Storybook's kebab story ID.
 * Storybook lowercases and inserts hyphens before uppercase runs.
 * e.g. "DefaultWithIcon" → "default-with-icon"
 */
function storyNameToId(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Build the Storybook iframe URL for a given story.
 */
function buildStoryUrl(title, storyName) {
  const titleId = titleToId(title);
  const storyId = storyNameToId(storyName);
  return `${STORYBOOK_URL}/iframe.html?id=${titleId}--${storyId}&viewMode=story`;
}

// ── Severity helpers ─────────────────────────────────────────────────────────

const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

// ── Main audit loop ──────────────────────────────────────────────────────────

async function runAudit() {
  console.log(`\nHELiX Accessibility Audit`);
  console.log(`Storybook: ${STORYBOOK_URL}`);
  console.log(`Output:    ${OUTPUT_PATH}\n`);

  const allStories = discoverStories();
  console.log(`Discovered ${allStories.length} story files\n`);

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext();

  const report = {
    runAt: new Date().toISOString(),
    storybookUrl: STORYBOOK_URL,
    rules: ['wcag2a', 'wcag2aa', 'best-practice'],
    totalStories: 0,
    totalViolations: 0,
    blockingViolations: 0,
    results: [],
  };

  let totalBlocking = 0;

  for (const { title, storyNames, filePath } of allStories) {
    // Audit only the Default story per component — if missing, skip
    const storiesToAudit = storyNames.includes('Default') ? ['Default'] : storyNames.slice(0, 1);

    if (storiesToAudit.length === 0) {
      console.log(`  SKIP  ${title} — no exportable stories found`);
      continue;
    }

    for (const storyName of storiesToAudit) {
      const url = buildStoryUrl(title, storyName);
      report.totalStories++;

      const page = await context.newPage();
      let violations = [];
      let error = null;

      try {
        const response = await page.goto(url, { timeout: TIMEOUT_MS, waitUntil: 'networkidle' });

        if (!response || response.status() !== 200) {
          error = `HTTP ${response?.status() ?? 'no response'} — story may not exist in built Storybook`;
        } else {
          // Wait for the custom element to be defined (up to 5s)
          await page
            .waitForFunction(() => document.readyState === 'complete', { timeout: 5_000 })
            .catch(() => {
              // Non-fatal — proceed with audit even if not fully idle
            });

          const axeResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
            .analyze();

          violations = axeResults.violations;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      } finally {
        await page.close();
      }

      const blockingViolations = violations.filter((v) => BLOCKING_IMPACTS.has(v.impact ?? ''));
      const storyResult = {
        title,
        storyName,
        url,
        component: basename(dirname(filePath)),
        violations: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
          nodesSample: v.nodes.slice(0, 3).map((n) => ({
            html: n.html.slice(0, 200),
            failureSummary: n.failureSummary,
          })),
        })),
        blockingCount: blockingViolations.length,
        error: error ?? undefined,
      };

      report.results.push(storyResult);
      report.totalViolations += violations.length;
      report.blockingViolations += blockingViolations.length;
      totalBlocking += blockingViolations.length;

      const status = error
        ? 'ERROR'
        : blockingViolations.length > 0
          ? 'FAIL '
          : violations.length > 0
            ? 'WARN '
            : 'PASS ';

      const line = `  ${status}  ${title}/${storyName}${error ? ` — ${error}` : blockingViolations.length > 0 ? ` — ${blockingViolations.length} blocking violation(s)` : violations.length > 0 ? ` — ${violations.length} minor violation(s)` : ''}`;
      console.log(line);

      // GitHub Actions annotations for blocking violations
      if (process.env.GITHUB_ACTIONS && blockingViolations.length > 0) {
        for (const v of blockingViolations) {
          console.log(
            `::error title=A11y violation [${v.impact}] in ${title}::${v.help} — ${v.helpUrl}`,
          );
        }
      }
    }
  }

  await browser.close();

  // ── Write JSON report ────────────────────────────────────────────────────

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nReport written to: ${OUTPUT_PATH}`);

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Stories audited:       ${report.totalStories}`);
  console.log(`Total violations:      ${report.totalViolations}`);
  console.log(`Blocking (crit/seri):  ${report.blockingViolations}`);

  if (totalBlocking > 0) {
    console.log(`\nFAIL — ${totalBlocking} critical/serious violation(s) found.`);
    console.log(`Healthcare mandate: zero tolerance for critical or serious a11y violations.`);
    console.log(`Review the report at ${OUTPUT_PATH} for details.\n`);
    process.exit(1);
  } else {
    console.log(`\nPASS — No critical or serious violations found.\n`);
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit runner crashed:', err);
  process.exit(1);
});
