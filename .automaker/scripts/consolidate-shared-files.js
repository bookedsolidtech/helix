/**
 * consolidate-shared-files.js — Shared File Consolidation for Audit Batches
 *
 * Manages modifications to shared files (coverage-config.json, ci.yml, etc.)
 * during batch audit execution. Ensures sequential commits consolidate changes
 * rather than creating conflicts.
 *
 * Usage:
 *   node .automaker/scripts/consolidate-shared-files.js --check
 *   node .automaker/scripts/consolidate-shared-files.js --consolidate coverage-config.json
 *
 * Strategies:
 *   - coverage-config.json: JSON deep merge (union of component entries)
 *   - ci.yml: Sequential apply (read current state, apply on top)
 *   - index.ts barrel files: Alphabetical sort, deduplicate exports
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const CONFIG_PATH = join(
  REPO_ROOT,
  '.automaker/config/shared-files-batch-management.json'
);

/**
 * Load shared file management configuration
 */
function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error('[ERROR] Config not found:', CONFIG_PATH);
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

/**
 * Deep merge two JSON objects (union strategy)
 * For arrays: concatenate and deduplicate
 * For objects: recursive merge, last-write-wins for primitives
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (Array.isArray(source[key])) {
      result[key] = [...new Set([...(result[key] || []), ...source[key]])];
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Consolidate coverage-config.json entries
 * Takes the union of all component entries, last-write-wins for duplicates
 */
function consolidateCoverageConfig(filePath) {
  if (!existsSync(filePath)) {
    console.log('[INFO] coverage-config.json not found — nothing to consolidate');
    return null;
  }

  const content = JSON.parse(readFileSync(filePath, 'utf-8'));

  // Validate structure
  if (!content.components && !content.thresholds) {
    console.log('[INFO] coverage-config.json has no components/thresholds — skipping');
    return content;
  }

  // Sort component entries alphabetically for deterministic output
  if (content.components) {
    const sorted = {};
    for (const key of Object.keys(content.components).sort()) {
      sorted[key] = content.components[key];
    }
    content.components = sorted;
  }

  return content;
}

/**
 * Consolidate barrel file exports
 * Sort alphabetically, remove exact duplicates
 */
function consolidateBarrelFile(filePath) {
  if (!existsSync(filePath)) {
    console.log(`[INFO] ${filePath} not found — nothing to consolidate`);
    return null;
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Separate export lines from non-export lines
  const exportLines = [];
  const otherLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('export')) {
      exportLines.push(line);
    } else {
      otherLines.push(line);
    }
  }

  // Deduplicate and sort export lines
  const uniqueExports = [...new Set(exportLines)].sort();

  // Reconstruct file: other lines first (comments, imports), then sorted exports
  const preamble = otherLines.filter(
    (l) => l.trim().length > 0 && !l.trim().startsWith('//')
  );
  const comments = otherLines.filter((l) => l.trim().startsWith('//'));

  const result = [...comments, ...preamble, ...uniqueExports, ''].join('\n');

  return result;
}

/**
 * Check shared files for potential issues
 */
function checkSharedFiles(config) {
  const issues = [];

  for (const fileConfig of config.sharedFiles) {
    const filePath = join(REPO_ROOT, fileConfig.path);

    if (!existsSync(filePath)) {
      continue;
    }

    if (fileConfig.mergeStrategy === 'json-deep-merge') {
      try {
        JSON.parse(readFileSync(filePath, 'utf-8'));
      } catch {
        issues.push({
          file: fileConfig.path,
          issue: 'Invalid JSON syntax',
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

// ── CLI Entry Point ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(
    'Usage: node consolidate-shared-files.js [--check] [--consolidate FILE]'
  );
  console.log('');
  console.log('Options:');
  console.log('  --check              Validate all shared files');
  console.log('  --consolidate FILE   Consolidate a specific shared file');
  console.log('  --dry-run            Show changes without writing');
  process.exit(0);
}

const config = loadConfig();
const dryRun = args.includes('--dry-run');

if (args.includes('--check')) {
  console.log('[INFO] Checking shared files...');
  const issues = checkSharedFiles(config);

  if (issues.length === 0) {
    console.log('[OK] All shared files are valid');
  } else {
    for (const issue of issues) {
      console.error(`[${issue.severity.toUpperCase()}] ${issue.file}: ${issue.issue}`);
    }
    process.exit(1);
  }
} else if (args.includes('--consolidate')) {
  const fileIndex = args.indexOf('--consolidate');
  const targetFile = args[fileIndex + 1];

  if (!targetFile) {
    console.error('[ERROR] No file specified for consolidation');
    process.exit(1);
  }

  const filePath = join(REPO_ROOT, targetFile);
  const fileConfig = config.sharedFiles.find((f) => targetFile.includes(f.path.split('/').pop()));

  if (!fileConfig) {
    console.error(`[ERROR] No consolidation rules for: ${targetFile}`);
    process.exit(1);
  }

  console.log(`[INFO] Consolidating: ${targetFile} (strategy: ${fileConfig.mergeStrategy})`);

  let result;
  if (fileConfig.mergeStrategy === 'json-deep-merge') {
    result = consolidateCoverageConfig(filePath);
    if (result && !dryRun) {
      writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n');
      console.log('[OK] Consolidated successfully');
    }
  } else if (fileConfig.mergeStrategy === 'alphabetical-sort') {
    result = consolidateBarrelFile(filePath);
    if (result && !dryRun) {
      writeFileSync(filePath, result);
      console.log('[OK] Consolidated successfully');
    }
  } else {
    console.log(`[INFO] Strategy ${fileConfig.mergeStrategy} — manual consolidation required`);
  }

  if (dryRun && result) {
    console.log('[DRY RUN] Would write:');
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  }
}

export { deepMerge, consolidateCoverageConfig, consolidateBarrelFile, checkSharedFiles };
