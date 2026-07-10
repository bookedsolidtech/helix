#!/usr/bin/env node
/**
 * check-version-drift.mjs — preflight gate that refuses push on docs with
 * stale `@helixui/*` version pins.
 *
 * Reads the canonical versions from the four published workspace packages
 * (`@helixui/library`, `@helixui/icons`, `@helixui/tokens`, `@helixui/react`)
 * and walks every consumer-facing markdown surface for stale
 * `@helixui/<pkg>@<version>` references:
 *
 *   - `apps/docs/src/content/docs/**` (Starlight docs site)
 *   - `apps/storybook/stories/**` (Storybook MDX surface)
 *   - `packages/** /README.md` (every workspace package README — these are
 *     the pages consumers see on npmjs.com and on GitHub package pages,
 *     and they ship install snippets pinned to the current library version)
 *
 * Fails with exit 1 if any exact-version pin or caret/tilde-range floor
 * diverges from the current package version.
 *
 * Background:
 *   The Phase 1 docs sync (PR #1711) shipped phases 2-5 but left ~17 docs
 *   files with `@helixui/library@3.0.0` / `@helixui/tokens@0.3.4` /
 *   `@1.0.0` / `@2.1.1` references. This gate exists so a future release
 *   bump cannot silently leave docs pointing at an outdated CDN URL.
 *
 * Archive policy:
 *   Anything under `migration/**` is archival — those docs literally
 *   describe transitions between versions, so historical version refs are
 *   expected. The gate skips those paths.
 *
 * Usage:
 *   node scripts/check-version-drift.mjs              # gate mode
 *   HELIX_ALLOW_VERSION_DRIFT=1 node scripts/...      # emergency bypass
 */

import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};

// Map package short name (used in `@helixui/<name>`) → workspace package.json path.
const PACKAGES = {
  library: 'packages/hx-library/package.json',
  icons: 'packages/hx-icons/package.json',
  tokens: 'packages/hx-tokens/package.json',
  react: 'packages/hx-react/package.json',
};

// Scan roots — relative to REPO_ROOT. Markdown surfaces that contain
// consumer-facing install snippets or CDN URLs must all be scanned, or
// version pins added there will go stale silently after a release.
const SCAN_ROOTS = [
  'apps/docs/src/content/docs',
  'apps/storybook/stories',
  // Workspace package READMEs — drupal-starter, hx-library, hx-react etc. all
  // ship install snippets pinned to the current library version. The /apps
  // scans don't cover these, and they're the docs consumers see on
  // npmjs.com / GitHub package pages.
  'packages',
];
const SCAN_EXTS = new Set(['.md', '.mdx']);
// Within `packages/`, only scan README files — the source code, fixtures,
// changelogs, and CHANGELOG/migration archives are intentionally excluded.
const PACKAGES_NAME_ALLOWLIST = new Set(['README.md', 'README.mdx']);

// Archival paths — historical version refs allowed.
const ARCHIVE_PATTERNS = [/(^|\/)migration\//];

async function readCurrentVersions() {
  const versions = {};
  for (const [shortName, relPath] of Object.entries(PACKAGES)) {
    const abs = resolve(REPO_ROOT, relPath);
    try {
      const raw = await readFile(abs, 'utf-8');
      const pkg = JSON.parse(raw);
      if (typeof pkg.version !== 'string') {
        throw new Error(`missing 'version' field`);
      }
      versions[shortName] = pkg.version;
    } catch (err) {
      console.error(
        `${ANSI.red}FAIL${ANSI.reset}: cannot read version from ${relPath}: ${err.message}`,
      );
      process.exit(2);
    }
  }
  return versions;
}

async function walkMarkdownFiles(rootAbs, opts = {}) {
  const { nameAllowlist } = opts;
  const out = [];
  let entries;
  try {
    entries = await readdir(rootAbs, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const entry of entries) {
    const fullPath = join(rootAbs, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules/dist/.turbo etc — they're build artifacts and
      // contain copies of upstream READMEs we don't own.
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.turbo' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      const sub = await walkMarkdownFiles(fullPath, opts);
      out.push(...sub);
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      const matchesExt = dot >= 0 && SCAN_EXTS.has(entry.name.slice(dot));
      const matchesAllowlist = !nameAllowlist || nameAllowlist.has(entry.name);
      if (matchesExt && matchesAllowlist) {
        out.push(fullPath);
      }
    }
  }
  return out;
}

function isArchive(relPath) {
  return ARCHIVE_PATTERNS.some((re) => re.test(relPath));
}

// Capture group 1 = pkg short name, group 2 = version string.
// Version string accepts:
//   - exact semver:  3.9.0, 3.9.0-alpha.1
//   - caret range:   ^3, ^3.9, ^3.9.0
//   - tilde range:   ~3.9, ~3.9.0
const VERSION_REF =
  /@helixui\/(library|icons|tokens|react)@(\^?\d+(?:\.\d+){0,2}(?:-[a-z0-9.]+)?|~\d+(?:\.\d+){0,2})/g;

function parseSemverParts(numericString) {
  // numericString is "3", "3.9", "3.9.0", optionally with "-pre.1".
  const [core] = numericString.split('-', 1);
  const [maj, min, pat] = core.split('.').map((n) => Number(n));
  return {
    major: Number.isFinite(maj) ? maj : 0,
    minor: Number.isFinite(min) ? min : 0,
    patch: Number.isFinite(pat) ? pat : 0,
  };
}

function cmpSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

/**
 * Returns null if the version-ref is current; returns a reason string if stale.
 */
function evaluateMatch(versionString, currentVersion) {
  const current = parseSemverParts(currentVersion);

  if (versionString.startsWith('^')) {
    const floor = parseSemverParts(versionString.slice(1));
    // Caret range: floor must be ≤ current AND major must match.
    if (floor.major !== current.major) {
      return `caret floor major ${floor.major} does not match current major ${current.major}`;
    }
    if (cmpSemver(floor, current) > 0) {
      return `caret floor ${versionString} exceeds current ${currentVersion}`;
    }
    return null;
  }

  if (versionString.startsWith('~')) {
    const floor = parseSemverParts(versionString.slice(1));
    // Tilde range: major+minor must match, patch floor ≤ current patch.
    if (floor.major !== current.major || floor.minor !== current.minor) {
      return `tilde range ${versionString} does not match current ${currentVersion}`;
    }
    if (floor.patch > current.patch) {
      return `tilde floor ${versionString} exceeds current ${currentVersion}`;
    }
    return null;
  }

  // Exact pin — must equal current.
  if (versionString !== currentVersion) {
    return `refs @helixui/<pkg>@${versionString}; current is ${currentVersion}`;
  }
  return null;
}

function findLineNumber(content, charOffset) {
  // Count newlines up to charOffset.
  let line = 1;
  for (let i = 0; i < charOffset; i++) {
    if (content.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

async function scanFile(absPath, relPath, versions) {
  const findings = [];
  let content;
  try {
    content = await readFile(absPath, 'utf-8');
  } catch (err) {
    console.error(`${ANSI.red}FAIL${ANSI.reset}: cannot read ${relPath}: ${err.message}`);
    return findings;
  }

  const archival = isArchive(relPath);
  const lines = content.split(/\r?\n/);
  VERSION_REF.lastIndex = 0;
  let match;
  while ((match = VERSION_REF.exec(content)) !== null) {
    const pkgShort = match[1];
    const versionString = match[2];
    const current = versions[pkgShort];
    const reason = evaluateMatch(versionString, current);
    if (reason === null) continue;

    const line = findLineNumber(content, match.index);
    // Pull the line plus its two neighbors for context-aware skipping.
    const surroundingLines = lines.slice(Math.max(0, line - 2), line + 1).join(' ');

    // Skip lines that explicitly mark the pin as deprecated / unpublished /
    // cosmetic / hypothetical / illustrative — these are walkthroughs and
    // intentional historical references, not stale CDN pins to update.
    if (
      /deprecated|unpublished|cosmetic|artifact|placeholder|hypothetical|illustrative|illustration|example major|future major|new major|don['']t try|do not try|reset|known-clean|accidental release/i.test(
        surroundingLines,
      )
    ) {
      continue;
    }

    // Skip explicit floating-major / floating-minor tag forms when they are
    // shown alongside a comment that this is the intended pinning pattern
    // (e.g. CDN guidance: "Pin to @<major> for floating patches" or
    // "Pinned to major 3, receives patch + minor updates").
    if (
      /floating[\s-]?major|floating[\s-]?minor|pin(?:ned)?\s+to\s+(?:@?\d|major\s*\d)|range covering|use\s+@\d\s+for|receives\s+patch/i.test(
        surroundingLines,
      )
    ) {
      continue;
    }

    // Skip migration / upgrade-guide references. Anything that mentions
    // "upgrading from" or "migration guide" near the pin is documenting a
    // historical version the reader is moving away from, not asserting a
    // currently-correct CDN target.
    if (
      /upgrad(?:e|ing)\s+(?:from|an existing)|migration guide|3\.\d+\s*→\s*3\.\d+/i.test(
        surroundingLines,
      )
    ) {
      continue;
    }

    // Skip bare floating-major forms (`@1`, `@3`, `@^4`) when they appear in
    // a CDN / import-map context — those are intentional "track the major
    // branch" pins, not stale exact pins. The context detector strips the
    // matched span itself so a literal `@helixui/<pkg>@<ver>` on the line
    // doesn't accidentally count as evidence of import-map shape.
    //
    // Deliberately NOT widened to `major.minor`. A `@3.10` in a production
    // install snippet is a real stale pin once the library moves on, and
    // exempting the whole shape would blind the gate to that class. Snippets
    // that need a floating minor — the "do not use floating ranges"
    // anti-pattern examples — annotate themselves with `illustrative`, which
    // the context skip above already honours.
    if (/^\^?\d+$/.test(versionString)) {
      const cleanedContext = surroundingLines
        .slice(0, surroundingLines.indexOf(match[0]))
        .concat(surroundingLines.slice(surroundingLines.indexOf(match[0]) + match[0].length));
      if (
        /cdn\.jsdelivr\.net|cdn\.skypack\.dev|unpkg\.com|import\s*map|importmap|"imports"\s*:|<script\s+type="module"\s+src=/i.test(
          cleanedContext,
        )
      ) {
        continue;
      }
    }

    findings.push({
      file: relPath,
      line,
      pkg: pkgShort,
      versionString,
      current,
      reason,
      archival,
    });
  }
  return findings;
}

async function main() {
  const versions = await readCurrentVersions();

  const allFiles = [];
  for (const root of SCAN_ROOTS) {
    const abs = resolve(REPO_ROOT, root);
    const opts = root === 'packages' ? { nameAllowlist: PACKAGES_NAME_ALLOWLIST } : {};
    const files = await walkMarkdownFiles(abs, opts);
    allFiles.push(...files);
  }

  const findings = [];
  for (const abs of allFiles) {
    const rel = relative(REPO_ROOT, abs);
    const fileFindings = await scanFile(abs, rel, versions);
    findings.push(...fileFindings);
  }

  const realFails = findings.filter((f) => !f.archival);
  const archivalInfos = findings.filter((f) => f.archival);

  if (realFails.length === 0) {
    console.log(
      `${ANSI.green}✓ version-drift: scanned ${allFiles.length} files across apps/docs + apps/storybook + packages/**/README.md; zero stale @helixui/* refs${ANSI.reset}`,
    );
    if (archivalInfos.length > 0) {
      console.log(
        `${ANSI.dim}  ${archivalInfos.length} version ref(s) in migration/ archives — informational, not a failure.${ANSI.reset}`,
      );
    }
    process.exit(0);
  }

  const allowDrift = process.env.HELIX_ALLOW_VERSION_DRIFT === '1';

  const filesAffected = new Set(realFails.map((f) => f.file));

  for (const f of realFails) {
    process.stderr.write(
      `${ANSI.red}FAIL${ANSI.reset}: ${f.file}:${f.line}: refs @helixui/${f.pkg}@${f.versionString}; current is ${f.current}\n`,
    );
  }

  process.stderr.write(
    `\nTotal: ${realFails.length} drift findings across ${filesAffected.size} files. Run \`HELIX_ALLOW_VERSION_DRIFT=1 pnpm preflight\` to bypass (emergency only).\n`,
  );

  if (allowDrift) {
    console.log(
      `${ANSI.yellow}⚠ HELIX_ALLOW_VERSION_DRIFT=1 — version-drift findings acknowledged; gate passes.${ANSI.reset}`,
    );
    process.exit(0);
  }

  process.exit(1);
}

main().catch((err) => {
  console.error(`${ANSI.red}FAIL${ANSI.reset}: unexpected error: ${err.stack ?? err.message}`);
  process.exit(2);
});
