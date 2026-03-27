/**
 * audit-batch-monitor.js — Batch Progress Monitoring and Discord Notifications
 *
 * Tracks audit batch progress (components completed, in-progress, queued),
 * timing metrics, and estimated completion. Sends batch-level status updates
 * to Discord channels.
 *
 * Usage:
 *   node .automaker/services/audit-batch-monitor.js --date 20260326
 *   node .automaker/services/audit-batch-monitor.js --date 20260326 --notify
 *   node .automaker/services/audit-batch-monitor.js --date 20260326 --summary
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();

// ── Metadata Loading ────────────────────────────────────────────────────────

/**
 * Load batch metadata
 */
function loadMetadata(date) {
  const metadataPath = join(
    REPO_ROOT,
    `.automaker/audits/batch-${date}-metadata.json`
  );
  if (!existsSync(metadataPath)) {
    return null;
  }
  return JSON.parse(readFileSync(metadataPath, 'utf-8'));
}

/**
 * Load monitoring configuration
 */
function loadMonitoringConfig() {
  const configPath = join(
    REPO_ROOT,
    '.automaker/config/batch-monitoring-config.json'
  );
  if (!existsSync(configPath)) {
    return null;
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

// ── Progress Calculation ────────────────────────────────────────────────────

/**
 * Calculate batch progress metrics
 */
function batchProgress(metadata) {
  const { components, timing } = metadata;
  const total = components.total;
  const completed = components.completed.length;
  const failed = components.failed.length;
  const skipped = components.skipped.length;
  const queued = components.queued.length;
  const processed = completed + failed + skipped;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Calculate timing
  let elapsedMinutes = 0;
  let avgMinutesPerComponent = 0;
  let estimatedRemainingMinutes = 0;

  if (timing.startedAt) {
    elapsedMinutes = Math.round(
      (Date.now() - new Date(timing.startedAt).getTime()) / 60000
    );

    if (completed > 0) {
      // Calculate average from completed components
      const completedTimings = Object.values(timing.perComponent).filter(
        (t) => t.durationMinutes !== undefined
      );
      if (completedTimings.length > 0) {
        avgMinutesPerComponent =
          completedTimings.reduce((sum, t) => sum + t.durationMinutes, 0) /
          completedTimings.length;
      }

      estimatedRemainingMinutes = Math.round(
        avgMinutesPerComponent * (queued + (components.in_progress ? 1 : 0))
      );
    }
  }

  return {
    total,
    completed,
    failed,
    skipped,
    queued,
    processed,
    percentage,
    inProgress: components.in_progress,
    elapsedMinutes,
    avgMinutesPerComponent: Math.round(avgMinutesPerComponent),
    estimatedRemainingMinutes,
    estimatedTotalMinutes: elapsedMinutes + estimatedRemainingMinutes,
    isComplete: queued === 0 && components.in_progress === null,
    status: metadata.status,
  };
}

// ── Discord Notification ────────────────────────────────────────────────────

/**
 * Format a Discord notification message for batch progress
 */
function formatDiscordMessage(metadata, progress) {
  const { batchId, branch } = metadata;

  const statusEmoji = progress.isComplete
    ? '✅'
    : progress.failed > 0
      ? '⚠️'
      : '🔄';

  const progressBar = generateProgressBar(progress.percentage);

  let message = `${statusEmoji} **Audit Batch: ${batchId}**\n`;
  message += `Branch: \`${branch}\`\n\n`;
  message += `${progressBar} ${progress.percentage}%\n\n`;
  message += `**Progress:** ${progress.completed}/${progress.total} completed\n`;

  if (progress.inProgress) {
    message += `**Current:** \`${progress.inProgress}\`\n`;
  }

  if (progress.failed > 0) {
    message += `**Failed:** ${progress.failed}\n`;
  }

  if (progress.queued > 0) {
    message += `**Queued:** ${progress.queued}\n`;
  }

  message += `**Elapsed:** ${progress.elapsedMinutes}min`;

  if (progress.estimatedRemainingMinutes > 0) {
    message += ` | **ETA:** ~${progress.estimatedRemainingMinutes}min remaining`;
  }

  if (progress.isComplete) {
    message += `\n\n🎉 Batch complete! Ready for PR creation.`;
  }

  return message;
}

/**
 * Generate a text progress bar
 */
function generateProgressBar(percentage) {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

/**
 * Format component completion checkpoint message
 */
function formatCheckpointMessage(metadata, component, status) {
  const progress = batchProgress(metadata);
  const emoji =
    status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⏭️';

  return `${emoji} \`${component}\` ${status} (${progress.completed}/${progress.total}) — batch \`${metadata.batchId}\``;
}

// ── Summary Report ──────────────────────────────────────────────────────────

/**
 * Generate a full summary report for a completed batch
 */
function generateSummaryReport(metadata) {
  const progress = batchProgress(metadata);
  const { components, timing, commits } = metadata;

  let report = '# Audit Batch Summary Report\n\n';
  report += `**Batch ID:** ${metadata.batchId}\n`;
  report += `**Branch:** ${metadata.branch}\n`;
  report += `**Status:** ${metadata.status}\n`;
  report += `**Duration:** ${progress.elapsedMinutes} minutes\n\n`;

  report += '## Components\n\n';
  report += `| Component | Status | Duration |\n`;
  report += `|-----------|--------|----------|\n`;

  for (const comp of components.list) {
    let status = 'queued';
    if (components.completed.includes(comp)) status = 'completed';
    else if (components.failed.includes(comp)) status = 'failed';
    else if (components.skipped.includes(comp)) status = 'skipped';
    else if (components.in_progress === comp) status = 'in_progress';

    const t = timing.perComponent[comp];
    const duration = t && t.durationMinutes ? `${t.durationMinutes}min` : '-';

    report += `| ${comp} | ${status} | ${duration} |\n`;
  }

  report += '\n## Commits\n\n';
  for (const commit of commits) {
    report += `- \`${commit.sha.slice(0, 7)}\` ${commit.component} (${commit.timestamp})\n`;
  }

  report += '\n## CI Impact\n\n';
  report += `- Individual PRs would have created: ${components.total * 15} CI jobs\n`;
  report += `- Batch PR creates: 15 CI jobs\n`;
  report += `- Reduction: ${Math.round(((components.total * 15 - 15) / (components.total * 15)) * 100)}%\n`;

  return report;
}

// ── CLI Entry Point ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(
    'Usage: node audit-batch-monitor.js --date YYYYMMDD [--notify] [--summary] [--json]'
  );
  process.exit(0);
}

const dateIndex = args.indexOf('--date');
const date =
  dateIndex >= 0 && args[dateIndex + 1]
    ? args[dateIndex + 1]
    : new Date().toISOString().replace(/-/g, '').slice(0, 8);

const metadata = loadMetadata(date);

if (!metadata) {
  console.error(`[ERROR] No batch metadata found for date: ${date}`);
  process.exit(1);
}

const progress = batchProgress(metadata);

if (args.includes('--json')) {
  console.log(JSON.stringify(progress, null, 2));
} else if (args.includes('--summary')) {
  console.log(generateSummaryReport(metadata));
} else if (args.includes('--notify')) {
  const message = formatDiscordMessage(metadata, progress);
  console.log(message);
  console.log('');
  console.log('[INFO] To send to Discord, pipe this to curl:');
  console.log(
    '  node audit-batch-monitor.js --date ' +
      date +
      ' --notify | curl -s -X POST ...'
  );
} else {
  // Default: print progress
  console.log(`Batch: ${metadata.batchId}`);
  console.log(`Status: ${metadata.status}`);
  console.log(`Branch: ${metadata.branch}`);
  console.log('');
  console.log(
    `${generateProgressBar(progress.percentage)} ${progress.percentage}%`
  );
  console.log('');
  console.log(`  Completed:  ${progress.completed}/${progress.total}`);
  console.log(`  Failed:     ${progress.failed}`);
  console.log(`  Skipped:    ${progress.skipped}`);
  console.log(`  Queued:     ${progress.queued}`);
  if (progress.inProgress) {
    console.log(`  Current:    ${progress.inProgress}`);
  }
  console.log(`  Elapsed:    ${progress.elapsedMinutes}min`);
  if (progress.estimatedRemainingMinutes > 0) {
    console.log(`  ETA:        ~${progress.estimatedRemainingMinutes}min`);
  }
}

export {
  batchProgress,
  formatDiscordMessage,
  formatCheckpointMessage,
  generateSummaryReport,
  generateProgressBar,
};
