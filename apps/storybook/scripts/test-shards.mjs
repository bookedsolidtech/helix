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
 *   This is an isolation strategy, not a leak fix — if any single story
 *   file ever grows large enough to trigger the same cumulative state
 *   crash on its own, the underlying Vitest/Playwright page-reuse leak
 *   will resurface. Tracked separately; for now per-file isolation gives
 *   deterministic CI while the upstream issue remains open.
 *
 * How:
 *   We read `STORYBOOK_STORY_GLOBS` (or derive the patterns from the same
 *   source of truth Storybook uses) and enumerate every matching file,
 *   then run `vitest run <one-file>` sequentially for each. A fresh
 *   Chromium process means zero carry-over. Per-invocation wall time is
 *   ~4–5s (cold vite + playwright page open), giving ~6–7 min total for
 *   84 files — well under the 15 min CI budget.
 *
 * Env:
 *   STORYBOOK_STORY_GLOBS space-separated globs, each relative to the
 *                         monorepo root. Overrides the default patterns
 *                         below. Example:
 *                           STORYBOOK_STORY_GLOBS="packages/hx-library/src/**\/*.stories.ts apps/storybook/stories/**\/*.stories.tsx"
 *   STORYBOOK_STORY_GLOB  (deprecated, singular) back-compat alias for
 *                         STORYBOOK_STORY_GLOBS. Ignored if the plural
 *                         form is also set.
 *   STORYBOOK_EXTRA_ARGS  space-separated extra args forwarded to each
 *                         `vitest run` invocation. Merged with any extra
 *                         args passed on the command line (see below).
 *   VITEST_SHARD_INDEX    1-based shard index — when set together with
 *                         VITEST_SHARDS, runs only the Nth equal slice of
 *                         the file list (for CI matrix parallelism)
 *   VITEST_SHARDS         total shard count (required if SHARD_INDEX set)
 *
 * CLI:
 *   Additional args passed on the command line are forwarded to every
 *   vitest invocation, e.g.
 *       pnpm run test:storybook -- --reporter=json --coverage
 *   is equivalent to
 *       STORYBOOK_EXTRA_ARGS="--reporter=json --coverage" pnpm run test:storybook
 *   Both sources are merged (env first, then CLI) — last-flag-wins applies
 *   per vitest's own argument parsing.
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

// Default patterns mirror the `stories` array in .storybook/main.ts so that
// anything Storybook renders is also tested by CI. Keep these in sync — the
// CI check below will fail closed if Storybook's config adds new roots that
// this runner hasn't been taught about.
const DEFAULT_STORY_GLOBS = [
  'packages/hx-library/src/**/*.stories.@(ts|tsx)',
  'apps/storybook/stories/**/*.stories.@(ts|tsx)',
];

// Accept either the new plural env var or the legacy singular one for
// back-compat with scripts that pinned to the old name.
const envGlobsRaw = process.env.STORYBOOK_STORY_GLOBS ?? process.env.STORYBOOK_STORY_GLOB ?? '';
const STORY_GLOBS = envGlobsRaw
  ? envGlobsRaw.split(/\s+/).filter((g) => g.length > 0)
  : DEFAULT_STORY_GLOBS;

// Drift guard: assert every `.stories.*` glob in .storybook/main.ts is
// covered by STORY_GLOBS. A mismatch means Storybook renders stories the
// runner would silently skip — CI would stay green with reduced coverage.
// Skip the check when the caller has opted into a custom glob set via the
// env var; that's an intentional override (e.g. testing a single root).
if (!envGlobsRaw) {
  const mainTsPath = path.resolve(cwd, '.storybook/main.ts');
  if (fs.existsSync(mainTsPath)) {
    const mainTsSource = fs.readFileSync(mainTsPath, 'utf8');
    // Scope the regex to the `stories:` array only so quoted `.stories.*`
    // strings in comments, JSDoc examples, or unrelated config keys cannot
    // trigger false positives. We locate the `stories:` key, then extract
    // the bracketed array content with a balanced-bracket walk (the naive
    // `\[.*?\]` would stop at the first `]`, which is fine here because
    // story globs never contain brackets, but the walk is cheap and
    // future-proofs against nested config).
    const storiesKey = mainTsSource.search(/\bstories\s*:\s*\[/);
    let storiesArrayText = '';
    if (storiesKey !== -1) {
      const openIdx = mainTsSource.indexOf('[', storiesKey);
      let depth = 0;
      let closeIdx = -1;
      for (let i = openIdx; i < mainTsSource.length; i++) {
        const ch = mainTsSource[i];
        if (ch === '[') depth++;
        else if (ch === ']') {
          depth--;
          if (depth === 0) {
            closeIdx = i;
            break;
          }
        }
      }
      if (closeIdx !== -1) {
        storiesArrayText = mainTsSource.slice(openIdx + 1, closeIdx);
      }
    }
    // Extract quoted `.stories.<ext>` literals from the scoped array text.
    // `.mdx` entries are intentionally ignored — they are rendered by
    // Storybook docs but not under vitest interaction testing.
    const storyPatternRe = /['"]([^'"]+\.stories\.[^'"]+)['"]/g;
    const mainTsDir = path.dirname(mainTsPath);
    const configured = new Set();
    for (const match of storiesArrayText.matchAll(storyPatternRe)) {
      const raw = match[1];
      // Resolve main.ts-relative glob against .storybook/ then make it
      // repo-root relative so it's directly comparable to STORY_GLOBS.
      const absolute = path.resolve(mainTsDir, raw);
      const rel = path.relative(repoRoot, absolute);
      configured.add(rel);
    }
    const active = new Set(STORY_GLOBS);
    // Exact string equality is deliberate: equivalent-but-differently-
    // spelled globs (narrower prefix, single vs extglob extension,
    // reordered group) are treated as drift and must be explicitly mirrored
    // in DEFAULT_STORY_GLOBS. That is stricter than strictly necessary, but
    // it keeps the invariant obvious: whatever Storybook renders, the
    // runner runs, byte-for-byte. Loosening this to file-set equivalence
    // would require pulling in a glob engine and enumerating files twice,
    // which is not worth it for a guard that trips only on intentional
    // config edits.
    const missing = [...configured].filter((g) => !active.has(g));
    if (missing.length > 0) {
      console.error(
        '[storybook-test] DEFAULT_STORY_GLOBS drifted from .storybook/main.ts — the following story globs are configured in Storybook but not covered by the test runner:',
      );
      for (const m of missing) console.error(`    ${m}`);
      console.error(
        '[storybook-test] fix: either add the missing globs to DEFAULT_STORY_GLOBS verbatim, or update main.ts so its globs match DEFAULT_STORY_GLOBS byte-for-byte. The guard intentionally enforces exact-string match to keep the Storybook-config ↔ runner invariant unambiguous.',
      );
      process.exit(2);
    }
  }
}

// Merge env-provided extra args with CLI args. Any argv after `node
// test-shards.mjs` is forwarded to each vitest invocation. This restores
// the behavior of the previous `vitest run` target where `pnpm run
// test:storybook -- --coverage` flowed through untouched.
//
// Limitation: STORYBOOK_EXTRA_ARGS is split on whitespace with no quote
// handling, so tokens with embedded spaces (e.g. `--outputFile="path with
// spaces.xml"`) will be split incorrectly. Pass those via the CLI
// passthrough instead (`pnpm run test:storybook -- --outputFile="..."`),
// where the shell handles quoting before argv is parsed.
const envArgs = (process.env.STORYBOOK_EXTRA_ARGS ?? '')
  .split(/\s+/)
  .filter((arg) => arg.length > 0);
const cliArgs = process.argv.slice(2);
const extraArgs = [...envArgs, ...cliArgs];

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
// pulling in a glob dep — the pattern is fixed-shape and we only need to
// match `*.stories.{ts,tsx}`. Any I/O error during enumeration is fatal —
// a partial file list would silently drop coverage, which is worse for CI
// than a loud failure.
function findStoryFiles(globRelative) {
  // Parse the two supported glob shapes (with optional extension group):
  //   <prefix>/**/*.stories.@(ts|tsx)        — recursive, ts|tsx
  //   <prefix>/**/*.stories.ts               — recursive, ts only
  //   <prefix>/*.stories.@(ts|tsx)           — single dir, ts|tsx
  //   <prefix>/*.stories.ts                  — single dir, ts only
  // Check recursive first to avoid the flat regex swallowing it.
  const recursiveExt = globRelative.match(/^(.+?)\/\*\*\/\*\.stories\.@\(([^)]+)\)$/);
  const recursiveTs = recursiveExt
    ? null
    : globRelative.match(/^(.+?)\/\*\*\/\*\.stories\.(ts|tsx)$/);
  const flatExt =
    recursiveExt || recursiveTs ? null : globRelative.match(/^(.+?)\/\*\.stories\.@\(([^)]+)\)$/);
  const flatTs =
    recursiveExt || recursiveTs || flatExt
      ? null
      : globRelative.match(/^(.+?)\/\*\.stories\.(ts|tsx)$/);

  const match = recursiveExt ?? recursiveTs ?? flatExt ?? flatTs;
  if (!match) {
    throw new Error(`[storybook-test] unsupported glob pattern: ${globRelative}`);
  }

  const prefix = match[1];
  const extensionSpec = match[2];
  const extensions = extensionSpec.split('|').map((e) => '.stories.' + e);
  const recursive = Boolean(recursiveExt || recursiveTs);

  const rootDir = path.resolve(repoRoot, prefix);
  if (!fs.existsSync(rootDir)) {
    // A missing root is a common case for optional glob patterns (e.g.
    // apps/storybook/stories/ may or may not exist). Treat it as
    // "zero matches for this glob" rather than failing the whole run.
    return [];
  }

  const results = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      // Fail closed — a transient FS error or unreadable subtree must
      // not be papered over, otherwise CI could go green on a partial
      // run. The runner has no business fixing filesystem issues.
      throw new Error(
        `[storybook-test] failed to read ${dir}: ${err instanceof Error ? err.message : err}`,
      );
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) stack.push(full);
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(full);
      }
    }
  }
  return results;
}

const allFiles = [];
for (const glob of STORY_GLOBS) {
  allFiles.push(...findStoryFiles(glob));
}
// De-duplicate in case globs overlap, then sort so order is stable across
// runs and platforms.
const uniqueFiles = Array.from(new Set(allFiles)).sort();

if (uniqueFiles.length === 0) {
  console.error(`[storybook-test] no story files matched any of:`);
  for (const glob of STORY_GLOBS) console.error(`    ${glob}`);
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
    ? sliceForShard(uniqueFiles, SHARD_INDEX, SHARD_TOTAL)
    : uniqueFiles;

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
    ? `shard ${SHARD_INDEX}/${SHARD_TOTAL} (${filesToRun.length} of ${uniqueFiles.length} files)`
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
