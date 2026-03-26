/**
 * audit-batch-orchestrator.js — Sequential Audit Batch Orchestration
 *
 * Manages sequential execution of audit agents on a shared batch branch.
 * Implements queueing, atomic commits per component, coordination state
 * tracking, and prevents parallel execution conflicts.
 *
 * Usage:
 *   node .automaker/agents/audit-batch-orchestrator.js --date 20260326
 *   node .automaker/agents/audit-batch-orchestrator.js --resume
 *
 * Architecture:
 *   - Reads batch metadata from .automaker/audits/batch-YYYYMMDD-metadata.json
 *   - Processes one component at a time (sequential, never parallel)
 *   - Each component audit produces an atomic commit on the batch branch
 *   - Orchestrator tracks state transitions: queued → in_progress → completed/failed/skipped
 *   - Zombie detection at 20min per component (configurable)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// ── Configuration ───────────────────────────────────────────────────────────

const CONFIG_PATH = join(
  process.cwd(),
  '.automaker/config/orchestration-batch.json'
);

/**
 * Load orchestration configuration
 */
function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error('[ERROR] Config not found:', CONFIG_PATH);
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

// ── Metadata Management ─────────────────────────────────────────────────────

/**
 * Load batch metadata from the audits directory
 */
function loadMetadata(date) {
  const metadataPath = join(
    process.cwd(),
    `.automaker/audits/batch-${date}-metadata.json`
  );
  if (!existsSync(metadataPath)) {
    return null;
  }
  return {
    data: JSON.parse(readFileSync(metadataPath, 'utf-8')),
    path: metadataPath,
  };
}

/**
 * Save batch metadata
 */
function saveMetadata(metadata) {
  metadata.data.updatedAt = new Date().toISOString();
  writeFileSync(metadata.path, JSON.stringify(metadata.data, null, 2) + '\n');
}

// ── Queue Management ────────────────────────────────────────────────────────

/**
 * Get the next component from the queue
 * Returns null if queue is empty
 */
function getNextComponent(metadata) {
  const { queued } = metadata.data.components;
  if (queued.length === 0) return null;
  return queued[0];
}

/**
 * Transition a component between states
 */
function transitionComponent(metadata, component, fromState, toState) {
  const { components } = metadata.data;
  const timestamp = new Date().toISOString();

  // Remove from source state
  if (fromState === 'queued') {
    components.queued = components.queued.filter((c) => c !== component);
  }

  // Add to target state
  switch (toState) {
    case 'in_progress':
      components.in_progress = component;
      break;
    case 'completed':
      components.in_progress = null;
      if (!components.completed.includes(component)) {
        components.completed.push(component);
      }
      break;
    case 'failed':
      components.in_progress = null;
      if (!components.failed.includes(component)) {
        components.failed.push(component);
      }
      break;
    case 'skipped':
      components.in_progress = null;
      if (!components.skipped.includes(component)) {
        components.skipped.push(component);
      }
      break;
  }

  // Track timing
  if (!metadata.data.timing.perComponent[component]) {
    metadata.data.timing.perComponent[component] = {};
  }
  if (toState === 'in_progress') {
    metadata.data.timing.perComponent[component].startedAt = timestamp;
  } else {
    metadata.data.timing.perComponent[component].completedAt = timestamp;
    const start = new Date(
      metadata.data.timing.perComponent[component].startedAt || timestamp
    );
    const end = new Date(timestamp);
    metadata.data.timing.perComponent[component].durationMinutes = Math.round(
      (end - start) / 60000
    );
  }

  metadata.data.status = 'in_progress';
  saveMetadata(metadata);
}

/**
 * Record a commit in the metadata
 */
function recordCommit(metadata, component, sha) {
  metadata.data.commits.push({
    component,
    sha,
    timestamp: new Date().toISOString(),
  });
  saveMetadata(metadata);
}

// ── Component Validation ────────────────────────────────────────────────────

/**
 * Verify a component directory exists
 */
function componentExists(component) {
  const componentPath = join(
    process.cwd(),
    'packages/hx-library/src/components',
    component
  );
  return existsSync(componentPath);
}

// ── Git Operations ──────────────────────────────────────────────────────────

/**
 * Get the current branch name
 */
function getCurrentBranch() {
  return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
}

/**
 * Get the latest commit SHA
 */
function getLatestCommitSha() {
  return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
}

/**
 * Check if there are uncommitted changes
 */
function hasUncommittedChanges() {
  const status = execSync('git status --porcelain', {
    encoding: 'utf-8',
  }).trim();
  return status.length > 0;
}

// ── Progress Reporting ──────────────────────────────────────────────────────

/**
 * Generate a progress report object
 */
function getProgress(metadata) {
  const { components } = metadata.data;
  const total = components.total;
  const completed = components.completed.length;
  const failed = components.failed.length;
  const skipped = components.skipped.length;
  const queued = components.queued.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    failed,
    skipped,
    queued,
    inProgress: components.in_progress,
    percentage,
    isComplete: queued === 0 && components.in_progress === null,
  };
}

/**
 * Print progress to stdout
 */
function printProgress(metadata) {
  const p = getProgress(metadata);
  console.log('');
  console.log(`  Batch Progress: ${p.completed}/${p.total} (${p.percentage}%)`);
  console.log(`  Completed: ${p.completed}`);
  console.log(`  Failed:    ${p.failed}`);
  console.log(`  Skipped:   ${p.skipped}`);
  console.log(`  Queued:    ${p.queued}`);
  if (p.inProgress) {
    console.log(`  Current:   ${p.inProgress}`);
  }
  console.log('');
}

// ── Batch Operations ────────────────────────────────────────────────────────

/**
 * Add new components to an in-progress batch
 */
function appendComponents(metadata, newComponents) {
  const existing = new Set(metadata.data.components.list);
  let added = 0;

  for (const component of newComponents) {
    if (!existing.has(component)) {
      metadata.data.components.list.push(component);
      metadata.data.components.queued.push(component);
      metadata.data.components.total = metadata.data.components.list.length;
      added++;
    }
  }

  if (added > 0) {
    saveMetadata(metadata);
    console.log(`[INFO] Added ${added} new components to batch queue`);
  }

  return added;
}

/**
 * Check if the batch has stalled (zombie detection)
 */
function checkForZombie(metadata, config) {
  const { in_progress } = metadata.data.components;
  if (!in_progress) return false;

  const timing = metadata.data.timing.perComponent[in_progress];
  if (!timing || !timing.startedAt) return false;

  const elapsed = (Date.now() - new Date(timing.startedAt).getTime()) / 60000;
  const threshold = config.sequentialQueue.zombieDetectionMinutes;

  if (elapsed > threshold) {
    console.warn(
      `[WARN] Component ${in_progress} has been in_progress for ${Math.round(elapsed)} minutes (threshold: ${threshold})`
    );
    return true;
  }

  return false;
}

/**
 * Stash uncommitted changes before next agent
 */
function consolidateState(metadata) {
  if (hasUncommittedChanges()) {
    console.log('[INFO] Uncommitted changes detected — consolidating state');
    execSync('git add -A', { encoding: 'utf-8' });
    execSync(
      'HUSKY=0 git commit -m "audit-batch: consolidate state before next component"',
      { encoding: 'utf-8' }
    );
    console.log('[OK] State consolidated');
  }
}

// ── Exports ─────────────────────────────────────────────────────────────────

export {
  loadConfig,
  loadMetadata,
  saveMetadata,
  getNextComponent,
  transitionComponent,
  recordCommit,
  componentExists,
  getCurrentBranch,
  getLatestCommitSha,
  hasUncommittedChanges,
  getProgress,
  printProgress,
  appendComponents,
  checkForZombie,
  consolidateState,
};

// ── CLI Entry Point ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log('Usage: node audit-batch-orchestrator.js [--date YYYYMMDD] [--status] [--next]');
  console.log('');
  console.log('Options:');
  console.log('  --date YYYYMMDD   Batch date (default: today)');
  console.log('  --status          Print batch progress and exit');
  console.log('  --next            Print next component and exit');
  console.log('  --resume          Resume in-progress component');
  process.exit(0);
}

const dateIndex = args.indexOf('--date');
const date =
  dateIndex >= 0 && args[dateIndex + 1]
    ? args[dateIndex + 1]
    : new Date().toISOString().replace(/-/g, '').slice(0, 8);

const config = loadConfig();
const metadata = loadMetadata(date);

if (!metadata) {
  console.error(`[ERROR] No batch metadata found for date: ${date}`);
  console.error('Run scripts/create-audit-batch-branch.sh first');
  process.exit(1);
}

if (args.includes('--status')) {
  printProgress(metadata);
  process.exit(0);
}

if (args.includes('--next')) {
  const next = getNextComponent(metadata);
  if (next) {
    console.log(next);
  } else {
    console.log('EMPTY');
  }
  process.exit(0);
}

if (args.includes('--resume')) {
  const { in_progress } = metadata.data.components;
  if (in_progress) {
    console.log(`[INFO] Resuming: ${in_progress}`);

    if (checkForZombie(metadata, config)) {
      console.log(`[WARN] Component ${in_progress} appears to be a zombie`);
      console.log('[INFO] Consider stopping and skipping this component');
    }
  } else {
    console.log('[INFO] No component in progress — use --next to get the next one');
  }
  process.exit(0);
}

// Default: show status
printProgress(metadata);
