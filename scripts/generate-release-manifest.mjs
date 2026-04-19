#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const REPO_ROOT = process.cwd();
const MANIFEST_DIR = join(REPO_ROOT, 'docs', 'releases');

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', cwd: REPO_ROOT }).trim();

const sha256OfFile = (path) => {
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
};

const readJson = (path) => {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
};

const libraryPkg = readJson(join(REPO_ROOT, 'packages/hx-library/package.json')) ?? {};
const tokensPkg = readJson(join(REPO_ROOT, 'packages/hx-tokens/package.json')) ?? {};
const reactPkg = readJson(join(REPO_ROOT, 'packages/hx-react/package.json')) ?? {};

const libraryVersion = libraryPkg.version ?? 'unknown';
const tag = `@helixui/library@${libraryVersion}`;

const commitSha = process.env.GITHUB_SHA ?? sh('git rev-parse HEAD');
const ciRunId = process.env.GITHUB_RUN_ID ?? null;
const publishActor = process.env.GITHUB_ACTOR ?? sh('git config user.name || echo unknown');
const repository = process.env.GITHUB_REPOSITORY ?? 'bookedsolidtech/helix';
const ref = process.env.GITHUB_REF ?? null;

const changesetDir = join(REPO_ROOT, '.changeset');
const changesetFiles = existsSync(changesetDir)
  ? readdirSync(changesetDir).filter((f) => f.endsWith('.md') && f !== 'README.md')
  : [];

const cdnBudget = readJson(join(REPO_ROOT, '.cdn-budget.json'));

const cemPath = join(REPO_ROOT, 'packages/hx-library/custom-elements.json');
const cemSha = sha256OfFile(cemPath);

const lastTag = (() => {
  try {
    return sh('git describe --tags --abbrev=0 HEAD^ 2>/dev/null');
  } catch {
    return null;
  }
})();

const mergedPrs = (() => {
  if (!lastTag) return [];
  try {
    const log = sh(`git log ${lastTag}..HEAD --oneline --grep='Merge pull request'`);
    return log
      .split('\n')
      .map((line) => {
        const match = line.match(/#(\d+)/);
        return match ? Number(match[1]) : null;
      })
      .filter((n) => n !== null);
  } catch {
    return [];
  }
})();

const manifest = {
  tag,
  commit_sha: commitSha,
  ref,
  repository,
  published_at: new Date().toISOString(),
  publisher: publishActor,
  ci_run_id: ciRunId,
  ci_run_url: ciRunId ? `https://github.com/${repository}/actions/runs/${ciRunId}` : null,
  packages: {
    '@helixui/library': libraryVersion,
    '@helixui/tokens': tokensPkg.version ?? null,
    '@helixui/react': reactPkg.version ?? null,
  },
  changeset_files: changesetFiles,
  merged_prs_since_last_tag: mergedPrs,
  last_tag: lastTag,
  cem_sha256: cemSha,
  cdn_budget_snapshot: cdnBudget,
  coderabbit_final_review_sha: process.env.CODERABBIT_FINAL_REVIEW_SHA ?? null,
  notes:
    'Emitted by scripts/generate-release-manifest.mjs during the publish workflow. ' +
    'Committed to the repo as part of the version-bump PR that changesets/action creates.',
};

if (!existsSync(MANIFEST_DIR)) {
  mkdirSync(MANIFEST_DIR, { recursive: true });
}

const outPath = join(MANIFEST_DIR, `${libraryVersion}-manifest.json`);
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');

const relOut = relative(REPO_ROOT, outPath);
console.log(`Release manifest written: ${relOut}`);
console.log(`  tag: ${tag}`);
console.log(`  commit: ${commitSha}`);
console.log(`  cem_sha256: ${cemSha ?? '(missing)'}`);
console.log(`  changesets: ${changesetFiles.length}`);
console.log(`  merged PRs since ${lastTag ?? '(no prior tag)'}: ${mergedPrs.length}`);
