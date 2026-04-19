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

const requirePackageVersion = (packagePath, packageName) => {
  const pkg = readJson(packagePath);
  if (!pkg?.version) {
    throw new Error(`Missing required version for ${packageName} at ${packagePath}`);
  }
  return pkg;
};

const libraryPkg = requirePackageVersion(
  join(REPO_ROOT, 'packages/hx-library/package.json'),
  '@helixui/library',
);
const tokensPkg = requirePackageVersion(
  join(REPO_ROOT, 'packages/hx-tokens/package.json'),
  '@helixui/tokens',
);
const reactPkg = requirePackageVersion(
  join(REPO_ROOT, 'packages/hx-react/package.json'),
  '@helixui/react',
);

const libraryVersion = libraryPkg.version;
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

const publishedPackages = (() => {
  const raw = process.env.PUBLISHED_PACKAGES;
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `PUBLISHED_PACKAGES is set but not valid JSON — refusing to write an ` +
        `incomplete release manifest. Raw value (first 200 chars): ` +
        `${raw.slice(0, 200)} — original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      `PUBLISHED_PACKAGES parsed but is not an array — expected the output ` +
        `shape from changesets/action. Got: ${typeof parsed}`,
    );
  }
  return parsed;
})();

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
  published_packages: publishedPackages,
  merged_prs_since_last_tag: mergedPrs,
  last_tag: lastTag,
  cem_sha256: cemSha,
  cdn_budget_snapshot: cdnBudget,
  coderabbit_final_review_sha: process.env.CODERABBIT_FINAL_REVIEW_SHA ?? null,
  notes:
    'Emitted by scripts/generate-release-manifest.mjs during the publish workflow ' +
    'after changesets/action publishes to npm. Committed back to main via a ' +
    'dedicated step in publish.yml — not part of the version-bump PR.',
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
