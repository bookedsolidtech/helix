#!/usr/bin/env node
/**
 * Storybook test runner: invokes vitest once per story file so each file
 * runs in a fresh Chromium process.
 *
 * Why:
 *   Vitest 3.x browser mode (Playwright/Chromium) reuses a single
 *   long-lived BrowserContext + Page across every test file in one
 *   invocation. As Lit reactive controllers, Storybook preview runtime
 *   state, the custom-element registry, event listeners, and observers
 *   accumulate in the tab, it crashes deterministically — sometimes after
 *   as few as 5 files, sometimes after 60+, depending on the specific
 *   stories that happen to execute together. Vitest surfaces this as
 *   `Error: [vitest] Browser connection was closed while running tests`.
 *
 *   Empirically confirmed:
 *     - running 28 files in one chromium process → crashes at file 24–28
 *     - running  7 files in one chromium process → crashes at file 5
 *     - running  2 files in one chromium process → still crashes on
 *       specific pairings (e.g. hx-text-input + hx-link)
 *   No file count is safe: the trigger is cumulative in-page state, so
 *   the only robust guarantee is "exactly one story file per process".
 *
 * How:
 *   We enumerate every `*.stories.ts` file under
 *   `packages/hx-library/src/components/` and run
 *   `vitest run <one-file>` sequentially for each. A fresh Chromium
 *   process means zero carry-over. Per-invocation wall time is ~4–5s
 *   (cold vite + playwright page open), giving ~5–7 min total for 84
 *   files — well under the 15 min CI budget.
 *
 * Env:
 *   STORYBOOK_STORY_GLOB  glob pattern for story files, relative to the
 *                         monorepo root (default:
 *                         `packages/hx-library/src/components/**\/*.stories.ts`)
 *   STORYBOOK_EXTRA_ARGS  space-separated extra args forwarded to each
 *                         `vitest run` invocation
 *   VITEST_SHARD_INDEX    1-based shard index — when set together with
 *                         VITEST_SHARDS, runs only the Nth equal slice of
 *                         the file list (for CI matrix parallelism)
 *   VITEST_SHARDS         total shard count (required if SHARD_INDEX set)
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, '..');
// Walk up from apps/storybook/ to the monorepo root. When checked out as a
// git worktree, this still resolves to the worktree's own root — the story
// files are under packages/ inside that tree.
const repoRoot = path.resolve(cwd, '../..');

const STORY_GLOB =
  process.env.STORYBOOK_STORY_GLOB ?? 'packages/hx-library/src/components/**/*.stories.ts';

// Pass extra args through to vitest (e.g. --coverage, --reporter=json).
const extraArgs = (process.env.STORYBOOK_EXTRA_ARGS ?? '')
  .split(/\s+/)
  .filter((arg) => arg.length > 0);

// Optional CI matrix parallelism: slice the file list into N equal chunks.
const SHARD_TOTAL = process.env.VITEST_SHARDS
  ? Number.parseInt(process.env.VITEST_SHARDS, 10)
  : null;
const SHARD_INDEX = process.env.VITEST_SHARD_INDEX
  ? Number.parseInt(process.env.VITEST_SHARD_INDEX, 10)
  : null;
if (
  SHARD_TOTAL !== null &&
  (!Number.isInteger(SHARD_TOTAL) || SHARD_TOTAL < 1 || SHARD_TOTAL > 128)
) {
  console.error(`[storybook-test] VITEST_SHARDS must be 1..128, got: ${process.env.VITEST_SHARDS}`);
  process.exit(2);
}
if (SHARD_INDEX !== null) {
  if (SHARD_TOTAL === null) {
    console.error('[storybook-test] VITEST_SHARD_INDEX requires VITEST_SHARDS to be set');
    process.exit(2);
  }
  if (!Number.isInteger(SHARD_INDEX) || SHARD_INDEX < 1 || SHARD_INDEX > SHARD_TOTAL) {
    console.error(
      `[storybook-test] VITEST_SHARD_INDEX must be 1..${SHARD_TOTAL}, got: ${process.env.VITEST_SHARD_INDEX}`,
    );
    process.exit(2);
  }
}

// Deterministic file enumeration. We use a tiny recursive walk rather than
// pulling in a glob dep — the pattern is fixed (packages/hx-library/src/**)
// and we only need to match `*.stories.ts`.
function findStoryFiles(globRelative) {
  // Parse the two supported glob shapes:
  //   <prefix>/**/*.stories.ts       — recursive
  //   <prefix>/*.stories.ts          — single directory
  // Test recursive first — the flat regex would otherwise happily match
  // the recursive pattern (because `.+?/*.stories.ts` is a sub-string of
  // `.+?/**/*.stories.ts`) and produce zero results.
  const recursiveMatch = globRelative.match(/^(.+?)\/\*\*\/\*\.stories\.ts$/);
  const flatMatch = recursiveMatch ? null : globRelative.match(/^(.+?)\/\*\.stories\.ts$/);
  const prefix = recursiveMatch?.[1] ?? flatMatch?.[1] ?? globRelative;
  const recursive = !flatMatch; // default to recursive when nothing matched

  const rootDir = path.resolve(repoRoot, prefix);
  if (!fs.existsSync(rootDir)) {
    throw new Error(`[storybook-test] story root does not exist: ${rootDir}`);
  }

  const results = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.stories.ts')) {
        results.push(full);
      }
    }
  }
  // Sort so the order is stable across runs and platforms.
  results.sort();
  return results;
}

const allFiles = findStoryFiles(STORY_GLOB);
if (allFiles.length === 0) {
  console.error(`[storybook-test] no story files matched: ${STORY_GLOB}`);
  process.exit(2);
}

// Slice the file list for the current shard, if requested.
function sliceForShard(files, index, total) {
  // Ceil-division gives contiguous, stable slices and tolerates
  // non-divisible counts without crashing any single shard.
  const size = Math.ceil(files.length / total);
  const start = (index - 1) * size;
  return files.slice(start, start + size);
}
const filesToRun =
  SHARD_INDEX !== null && SHARD_TOTAL !== null
    ? sliceForShard(allFiles, SHARD_INDEX, SHARD_TOTAL)
    : allFiles;

// Resolve the vitest CLI through the local install rather than assuming
// PATH — works for pnpm workspaces, worktrees, and CI runners.
const require = (await import('node:module')).createRequire(import.meta.url);
const vitestPkg = require.resolve('vitest/package.json', { paths: [cwd] });
const vitestDir = path.dirname(vitestPkg);
const vitestCli = path.join(vitestDir, 'vitest.mjs');

function runOne(storyFile, index, total) {
  return new Promise((resolve, reject) => {
    const args = [vitestCli, 'run', ...extraArgs, storyFile];
    const rel = path.relative(repoRoot, storyFile);
    const label = `[storybook-test] ${index}/${total} ${rel}`;
    const startedAt = Date.now();
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code, signal) => {
      const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
      if (signal) {
        console.error(`${label} terminated by signal ${signal} after ${elapsedSec}s`);
        reject(new Error(`${rel} terminated by signal ${signal}`));
        return;
      }
      if (code === 0) {
        console.log(`${label} passed in ${elapsedSec}s`);
        resolve();
        return;
      }
      console.error(`${label} failed with exit code ${code} after ${elapsedSec}s`);
      reject(new Error(`${rel} exited with code ${code}`));
    });
  });
}

const scope =
  SHARD_INDEX !== null && SHARD_TOTAL !== null
    ? `shard ${SHARD_INDEX}/${SHARD_TOTAL} (${filesToRun.length} of ${allFiles.length} files)`
    : `${filesToRun.length} files`;
console.log(`[storybook-test] running ${scope}, one vitest process per file`);

const overallStart = Date.now();
const failures = [];
for (let i = 0; i < filesToRun.length; i++) {
  try {
    await runOne(filesToRun[i], i + 1, filesToRun.length);
  } catch (err) {
    failures.push({ file: filesToRun[i], err });
    console.error(String(err instanceof Error ? err.message : err));
    // Keep going — one failing file should report as a failure but not
    // mask other failing files. CI prefers a complete picture to
    // fail-fast noise.
  }
}
const overallSec = ((Date.now() - overallStart) / 1000).toFixed(1);

if (failures.length > 0) {
  console.error(`\n[storybook-test] FAILED: ${failures.length} file(s) in ${overallSec}s total`);
  for (const { file } of failures) {
    console.error(`  - ${path.relative(repoRoot, file)}`);
  }
  process.exit(1);
}
console.log(`\n[storybook-test] all ${filesToRun.length} file(s) passed in ${overallSec}s total`);
