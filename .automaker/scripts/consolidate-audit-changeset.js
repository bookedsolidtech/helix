/**
 * consolidate-audit-changeset.js — Changeset Consolidation for Audit Batches
 *
 * Collects all component audit findings from a batch branch and generates a
 * single changeset entry covering all audited components. Prevents multiple
 * changeset files and ensures a single version bump for the entire batch.
 *
 * Usage:
 *   node .automaker/scripts/consolidate-audit-changeset.js --date 20260326
 *   node .automaker/scripts/consolidate-audit-changeset.js --metadata path/to/metadata.json
 *
 * Output:
 *   Creates .changeset/audit-batch-YYYYMMDD-TIMESTAMP.md with consolidated entry
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

const REPO_ROOT = process.cwd();
const CHANGESET_DIR = join(REPO_ROOT, '.changeset');
const RULES_PATH = join(
  REPO_ROOT,
  '.automaker/config/changeset-consolidation-rules.json'
);

/**
 * Load consolidation rules
 */
function loadRules() {
  if (!existsSync(RULES_PATH)) {
    console.warn('[WARN] Consolidation rules not found, using defaults');
    return {
      consolidation: {
        enabled: true,
        strategy: 'merge-to-single',
        filenamePattern: 'audit-batch-{date}-{timestamp}.md',
      },
      bumpRules: { default: 'patch' },
      packages: {
        primary: '@helixui/library',
        linked: ['@helixui/tokens'],
      },
    };
  }
  return JSON.parse(readFileSync(RULES_PATH, 'utf-8'));
}

/**
 * Load batch metadata
 */
function loadMetadata(metadataPath) {
  if (!existsSync(metadataPath)) {
    console.error('[ERROR] Metadata not found:', metadataPath);
    process.exit(1);
  }
  return JSON.parse(readFileSync(metadataPath, 'utf-8'));
}

/**
 * Find existing individual changesets (non-config, non-README)
 */
function findExistingChangesets() {
  if (!existsSync(CHANGESET_DIR)) return [];

  return readdirSync(CHANGESET_DIR)
    .filter(
      (f) =>
        f.endsWith('.md') && f !== 'README.md' && !f.startsWith('audit-batch-')
    )
    .map((f) => join(CHANGESET_DIR, f));
}

/**
 * Generate consolidated changeset content
 */
function consolidateAuditChanges(metadata, rules) {
  const bumpType = rules.bumpRules.default || 'patch';
  const primaryPackage = rules.packages.primary || '@helixui/library';
  const components = metadata.components.completed || [];
  const failed = metadata.components.failed || [];
  const skipped = metadata.components.skipped || [];

  const componentSummaries = components
    .map((c) => {
      const timing = metadata.timing.perComponent[c];
      const duration = timing ? `${timing.durationMinutes || '?'}min` : '';
      return `- ${c}${duration ? ' (' + duration + ')' : ''}`;
    })
    .join('\n');

  const content = [
    '---',
    `'${primaryPackage}': ${bumpType}`,
    '---',
    '',
    `audit: deep quality batch covering ${components.length} components`,
    '',
    'Components audited:',
    componentSummaries,
  ];

  if (failed.length > 0) {
    content.push('', 'Components failed:', failed.map((c) => `- ${c}`).join('\n'));
  }

  if (skipped.length > 0) {
    content.push(
      '',
      'Components skipped:',
      skipped.map((c) => `- ${c}`).join('\n')
    );
  }

  content.push('', `Batch ID: ${metadata.batchId}`);

  return content.join('\n') + '\n';
}

/**
 * Generate unique changeset filename
 */
function generateFilename(date, rules) {
  const timestamp = Math.floor(Date.now() / 1000);
  const pattern =
    rules.consolidation.filenamePattern || 'audit-batch-{date}-{timestamp}.md';
  return pattern
    .replace('{date}', date)
    .replace('{timestamp}', String(timestamp));
}

/**
 * Remove individual changesets that were consolidated
 */
function cleanupIndividualChangesets(changesets, rules) {
  if (!rules.validation || !rules.validation.cleanupIndividualChangesets) return;

  for (const changeset of changesets) {
    const name = basename(changeset);
    console.log(`[INFO] Removing individual changeset: ${name}`);
    unlinkSync(changeset);
  }
}

// ── CLI Entry Point ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(
    'Usage: node consolidate-audit-changeset.js [--date YYYYMMDD] [--metadata PATH]'
  );
  console.log('');
  console.log('Options:');
  console.log('  --date YYYYMMDD      Batch date (default: today)');
  console.log('  --metadata PATH      Direct path to metadata file');
  console.log('  --dry-run            Show what would be generated without writing');
  console.log('  --cleanup            Remove individual changesets after consolidation');
  process.exit(0);
}

const dateIndex = args.indexOf('--date');
const metadataIndex = args.indexOf('--metadata');
const dryRun = args.includes('--dry-run');
const cleanup = args.includes('--cleanup');

let metadataPath;
let date;

if (metadataIndex >= 0 && args[metadataIndex + 1]) {
  metadataPath = args[metadataIndex + 1];
  date = basename(metadataPath).match(/batch-(\d{8})/)?.[1] || 'unknown';
} else {
  date =
    dateIndex >= 0 && args[dateIndex + 1]
      ? args[dateIndex + 1]
      : new Date().toISOString().replace(/-/g, '').slice(0, 8);
  metadataPath = join(
    REPO_ROOT,
    `.automaker/audits/batch-${date}-metadata.json`
  );
}

const rules = loadRules();
const metadata = loadMetadata(metadataPath);

if (!rules.consolidation.enabled) {
  console.log('[INFO] Changeset consolidation is disabled in rules');
  process.exit(0);
}

// Generate consolidated content
const content = consolidateAuditChanges(metadata, rules);
const filename = generateFilename(date, rules);
const outputPath = join(CHANGESET_DIR, filename);

if (dryRun) {
  console.log('[DRY RUN] Would create:', filename);
  console.log('');
  console.log(content);
  process.exit(0);
}

// Check for existing consolidated changeset
const existingConsolidated = readdirSync(CHANGESET_DIR).filter(
  (f) => f.startsWith(`audit-batch-${date}`) && f.endsWith('.md')
);

if (existingConsolidated.length > 0) {
  console.log(
    `[WARN] Consolidated changeset already exists: ${existingConsolidated[0]}`
  );
  console.log('[INFO] Overwriting with updated content');
}

// Write consolidated changeset
writeFileSync(outputPath, content);
console.log(`[OK] Consolidated changeset created: ${filename}`);
console.log(
  `[INFO] Covers ${metadata.components.completed.length} components`
);

// Cleanup individual changesets if requested
if (cleanup) {
  const individuals = findExistingChangesets();
  if (individuals.length > 0) {
    cleanupIndividualChangesets(individuals, rules);
    console.log(`[OK] Cleaned up ${individuals.length} individual changesets`);
  }
}

export { consolidateAuditChanges, loadRules, generateFilename };
