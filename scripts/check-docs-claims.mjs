#!/usr/bin/env node
// Programmatic fact-check for HELiX docs.
// Walks consumer-facing files, validates structural claims against source of truth.
// Pairs with the codex campaign (deeper editorial/conceptual review).
//
// Validates:
//   1. <hx-*> tags referenced -> must exist in CEM
//   2. CSS custom property *prefixes* (--hx-<head>-*) — checks the leading segment
//      is a known global prefix (color/space/font/…) OR resolves to a real component
//      tag. Does NOT validate the full token name; full-name validation (typos like
//      --hx-color-action-primary-text vs --hx-color-text-on-primary) is left to the
//      codex campaign because exhaustive enumeration drives too many false positives.
//   3. @helixui/* package names -> must be a real workspace package or npm-resolved
//   4. Version pins on @helixui/* -> must match workspace current (drift gate already catches; we'll surface anyway)
//   5. Internal links /<slug>/ -> must resolve to a surviving content file
//   6. Stale repo refs (github.com/himerus/wc-2026) -> flag
//   7. WCAG 2.1 AA conformance claims in non-archival files -> flag (should be 2.2 AAA on P0)
//
// Output: JSONL findings to .reports/docs-fact-check/programmatic-findings.jsonl + a markdown rollup.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = join(REPO_ROOT, '.reports', 'docs-fact-check');
const FINDINGS_PATH = join(REPORT_DIR, 'programmatic-findings.jsonl');
const ROLLUP_PATH = join(REPORT_DIR, 'programmatic-findings.md');

// ---- helpers ----

async function walk(dir, accept) {
  const out = [];
  async function recurse(d) {
    let entries;
    try {
      entries = await readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (
          e.name === 'node_modules' ||
          e.name === '.git' ||
          e.name === '.worktrees' ||
          e.name.startsWith('.')
        ) {
          continue;
        }
        await recurse(full);
      } else if (accept(full)) {
        out.push(full);
      }
    }
  }
  await recurse(dir);
  return out;
}

async function readJsonSafe(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

// ---- load sources of truth ----

const cem = await readJsonSafe(join(REPO_ROOT, 'packages/hx-library/custom-elements.json'));
if (!cem) {
  console.error(`No CEM at packages/hx-library/custom-elements.json. Run 'pnpm cem' first.`);
  process.exit(2);
}

// Build a set of valid tag names from CEM
const validTags = new Set();
const tagToCssProps = new Map(); // tag -> Set of CSS custom property names

for (const mod of cem.modules ?? []) {
  for (const decl of mod.declarations ?? []) {
    if (decl.tagName) {
      validTags.add(decl.tagName);
      const props = new Set();
      for (const c of decl.cssProperties ?? []) {
        if (c.name) props.add(c.name);
      }
      tagToCssProps.set(decl.tagName, props);
    }
  }
}

// All known CSS custom properties across all components
const allCssProps = new Set();
for (const set of tagToCssProps.values()) {
  for (const p of set) allCssProps.add(p);
}

// Global token prefixes loaded from @helixui/tokens. We strip the "--hx-" prefix
// and capture the first hyphen-separated segment (e.g. "color", "space", "focus",
// "line") to use as the legal global-prefix set. Anything starting with a head
// not in this set AND not matching a component tag is flagged as fabricated.
const HX_GLOBAL_PREFIXES = new Set();
{
  const tokensCss = await readFile(
    join(REPO_ROOT, 'packages/hx-tokens/dist/tokens.css'),
    'utf8',
  ).catch(() => '');
  for (const m of tokensCss.matchAll(/--hx-([a-z]+)-/g)) {
    HX_GLOBAL_PREFIXES.add(m[1]);
  }
  // Aliases for prefixes consumers reasonably use (Tailwind/MUI muscle memory):
  HX_GLOBAL_PREFIXES.add('spacing'); // alias for "space"
  HX_GLOBAL_PREFIXES.add('radius'); // sub-prefix of "border"
  HX_GLOBAL_PREFIXES.add('animation'); // sub-prefix of "transition"
}

// Workspace package versions (walks BOTH packages/ and apps/ — @helixui/storybook
// and other app-level workspace packages count as canonical names).
async function loadWorkspaceVersions() {
  const versions = new Map();
  for (const root of ['packages', 'apps']) {
    const pkgs = await walk(join(REPO_ROOT, root), (p) => basename(p) === 'package.json');
    for (const p of pkgs) {
      const pkg = await readJsonSafe(p);
      if (pkg?.name?.startsWith('@helixui/')) {
        versions.set(pkg.name, pkg.version);
      }
    }
  }
  // Add any non-scoped published packages of interest. `create-helix` is the
  // HELiX scaffolder published on npm (its source lives in a separate repo).
  // Query npm for the canonical version so docs pinned to e.g.
  // `create-helix@0.8.0` are flagged once npm has a newer version.
  try {
    const { execSync } = await import('node:child_process');
    // Hard timeout — Gate 12 runs on every push, so a slow / offline npm
    // registry must NOT hang preflight. 3s is generous for a successful
    // `npm view` (~300ms typical); anything beyond that we treat as offline
    // and fall back to the sentinel.
    const v = execSync('npm view create-helix version --silent 2>/dev/null', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim();
    versions.set('create-helix', v || 'npm-resolved');
  } catch {
    // network failure (offline / restricted CI / timeout) — fall back to
    // sentinel so package-name validation still works but version-drift
    // skips for the create-helix arm.
    versions.set('create-helix', 'npm-resolved');
  }
  return versions;
}
const workspaceVersions = await loadWorkspaceVersions();

// ---- collect surface ----

const targetFiles = [];

// apps/docs content
for (const f of await walk(join(REPO_ROOT, 'apps/docs/src/content/docs'), (p) =>
  /\.(md|mdx)$/.test(p),
)) {
  targetFiles.push(f);
}
// apps/storybook MDX
for (const f of await walk(join(REPO_ROOT, 'apps/storybook/stories'), (p) => p.endsWith('.mdx'))) {
  targetFiles.push(f);
}
// package READMEs + CHANGELOGs
for (const f of await walk(join(REPO_ROOT, 'packages'), (p) =>
  /\/(README|CHANGELOG)\.md$/.test(p),
)) {
  targetFiles.push(f);
}
// root docs
for (const f of ['README.md', 'CONTRIBUTING.md', 'CLAUDE.md']) {
  const abs = join(REPO_ROOT, f);
  if (existsSync(abs)) targetFiles.push(abs);
}

// ---- build surviving content slug set for internal-link validation ----

const survivingSlugs = new Set();
for (const f of targetFiles) {
  if (f.includes('apps/docs/src/content/docs/')) {
    const rel = relative(join(REPO_ROOT, 'apps/docs/src/content/docs'), f);
    let slug = rel.replace(/\.(md|mdx)$/, '');
    if (slug.endsWith('/index')) slug = slug.replace(/\/index$/, '');
    survivingSlugs.add('/' + slug + '/');
    survivingSlugs.add('/' + slug);
  }
}
survivingSlugs.add('/');

// ---- per-file checks ----

const findings = [];

function add({ file, line, severity, category, issue, evidence, fix }) {
  findings.push({
    campaign: 'docs-fact-check-programmatic',
    file: relative(REPO_ROOT, file),
    line,
    severity,
    category,
    issue,
    evidence,
    fix,
  });
}

// Match <hx-something>  (open tag, may be self-closing or have attrs)
const tagRegex = /<(hx-[a-z][a-z0-9-]*)\b/g;
// Match standalone --hx-... custom property references in CSS / inline contexts
const cssPropRegex = /(--hx-[a-z0-9-]+)/g;
// Internal Markdown links: [text](/slug/) or [text](/slug)
const internalLinkRegex = /\]\((\/[^)#?]+)(?:[?#][^)]*)?\)/g;
// Stale repo refs
const staleRepoRegex = /github\.com\/himerus\/wc-2026/g;
// Any @helixui/* package reference (with or without a version) — used to
// catch typos in unpinned install / import snippets like:
//   npm install @helixui/libray
//   import {...} from '@helixui/icns';
const packageRefRegex = /@helixui\/([a-z0-9][a-z0-9-]*)/g;

// Old version pins on @helixui/* AND on the unscoped `create-helix` CLI
// (drift gate handles @helixui/*; we surface anyway. The create-helix arm is
// drift-gate's blind spot today, so this checker is the only thing flagging
// stale `create-helix@<version>` pins until the drift gate's PACKAGES set is
// extended to cover unscoped packages.)
const versionPinRegex =
  /(?:@helixui\/(library|icons|tokens|react|drupal-behaviors)|(create-helix))@([0-9]+\.[0-9]+\.[0-9]+|\^[0-9]+(?:\.[0-9]+)?|~[0-9]+(?:\.[0-9]+)?)/g;
// CLI name fabrications
const cliFabricationRegex = /(npx|npm\s+(?:create|x))\s+create-helix-app\b/g;
// WCAG 2.1 AA claims (vs the canonical 2.2 AAA)
const wcag21Regex = /WCAG\s+2\.1\s+(?:Level\s+)?AA(?:\s+baseline)?/gi;

for (const file of targetFiles) {
  const content = await readFile(file, 'utf8');
  const isArchival = /\/migration\//.test(file) || /CHANGELOG\.md$/.test(file);

  // Lines for line-number reporting
  const lines = content.split(/\r?\n/);

  // --- 1. unknown <hx-*> tags ---
  let m;
  tagRegex.lastIndex = 0;
  while ((m = tagRegex.exec(content)) !== null) {
    const tag = m[1];
    if (!validTags.has(tag)) {
      const idx = content.slice(0, m.index).split(/\r?\n/).length;
      const lineText = lines[idx - 1] ?? '';

      // Skip pedagogical "this is wrong" examples — explicit negative markers
      // near the tag indicate the doc is *correcting* readers, not pointing them
      // at a real component.
      const surroundingLines = lines.slice(Math.max(0, idx - 3), idx + 2).join(' ');
      const isPedagogical =
        /BAD:|don['']t|wrong|incorrect|❌|not\s+a\s+valid|no\s+such\s+(?:element|component|tag)|there\s+is\s+no\s+\S*\s*<?hx-/i.test(
          surroundingLines,
        );
      if (isPedagogical) continue;

      // Skip prose tokens that aren't real tag references:
      //  - completion stubs / typing examples (`<hx-bu...`, `<hx-…>`, `<hx-foo*`)
      //  - obvious placeholder tag names (`<hx-some-component>`, `<hx-tag-name>`,
      //    `<hx-foo>`, `<hx-bar>`, `<hx-example>`, `<hx-…>`)
      const charAfter = content[m.index + m[0].length] ?? '';
      const isStub = charAfter === '.' || charAfter === '…' || charAfter === '*';
      if (isStub) continue;
      const placeholderTagNames = new Set([
        'hx-some-component',
        'hx-some-element',
        'hx-tag-name',
        'hx-foo',
        'hx-bar',
        'hx-baz',
        'hx-example',
        'hx-component',
        'hx-element',
      ]);
      if (placeholderTagNames.has(tag)) continue;

      // Skip correction-context prose, with or without backticks. The tag is a
      // reference to something that does NOT exist — negation language earlier
      // on the same line or its immediate predecessor.
      const correctionRegex =
        /(no such|there is no|there's no|no separate|doesn['']t exist|do[es]*\s+not\s+exist|isn['']t a real|fabricated|phantom|fake|fictional|imaginary|placeholder|removed|renamed|stale|deprecated|not\s+a\s+valid)/i;
      const looksLikeCorrection =
        correctionRegex.test(lineText) || correctionRegex.test(lines[idx - 2] ?? '');
      if (looksLikeCorrection) continue;

      add({
        file,
        line: idx,
        severity: 'high',
        category: 'component-name',
        issue: `Reference to <${tag}> but no such component in CEM`,
        evidence: lineText.slice(0, 120),
        fix: `Replace with a real component, or remove the reference.`,
      });
    }
  }

  // --- 2. unknown --hx-* custom properties ---
  cssPropRegex.lastIndex = 0;
  const seenProps = new Set();
  while ((m = cssPropRegex.exec(content)) !== null) {
    const prop = m[1];
    if (seenProps.has(prop)) continue;
    seenProps.add(prop);

    // Built-in tokens have a prefix like --hx-color-*, --hx-space-*, --hx-font-*, etc.
    // (loaded dynamically from @helixui/tokens into HX_GLOBAL_PREFIXES).
    // Component-level tokens follow --hx-<component>-<slot> and are matched against validTags below.
    const parts = prop.slice(5).split('-'); // strip "--hx-"
    if (parts.length === 0) continue;
    const head = parts[0];
    if (HX_GLOBAL_PREFIXES.has(head)) continue;
    // Could be a component-level token: --hx-<tag>-<slot>
    const possibleTags = [
      `hx-${parts.slice(0, 1).join('-')}`,
      `hx-${parts.slice(0, 2).join('-')}`,
      `hx-${parts.slice(0, 3).join('-')}`,
    ];
    if (possibleTags.some((t) => validTags.has(t))) continue;
    // Unknown prefix AND not a known component tag — fabricated.
    // Surface as low severity; full-name typos within a known prefix are left to codex.
    const lineNo = content.slice(0, content.indexOf(prop)).split(/\r?\n/).length;
    add({
      file,
      line: lineNo,
      severity: 'low',
      category: 'token',
      issue: `Unknown --hx-* token prefix: ${prop} (head "${head}" is not a global token namespace and does not match any registered hx-* component tag)`,
      evidence: lines[lineNo - 1]?.slice(0, 160) ?? '',
      fix: 'Verify the token name against @helixui/tokens (global tokens) or the component CEM (component-level tokens).',
    });
  }

  // --- 3. stale repo references ---
  staleRepoRegex.lastIndex = 0;
  while ((m = staleRepoRegex.exec(content)) !== null) {
    const idx = content.slice(0, m.index).split(/\r?\n/).length;
    add({
      file,
      line: idx,
      severity: 'medium',
      category: 'url',
      issue: 'Stale repo reference (github.com/himerus/wc-2026)',
      evidence: lines[idx - 1]?.slice(0, 120) ?? '',
      fix: 'Replace with github.com/bookedsolidtech/helix',
    });
  }

  // --- 4. CLI name fabrications ---
  cliFabricationRegex.lastIndex = 0;
  while ((m = cliFabricationRegex.exec(content)) !== null) {
    const idx = content.slice(0, m.index).split(/\r?\n/).length;
    add({
      file,
      line: idx,
      severity: 'high',
      category: 'package-version',
      issue: 'Runnable CLI command is `npx create-helix`, not `npx create-helix-app`',
      evidence: lines[idx - 1]?.slice(0, 120) ?? '',
      fix: 'Replace `npx create-helix-app` with `npx create-helix`. The repo/directory name `create-helix-app/` is fine; only the runnable command is `create-helix`.',
    });
  }

  // --- 5. WCAG 2.1 AA claims (non-archival) ---
  // Goal: flag prose that ASSERTS HELiX itself ships WCAG 2.1 AA (stale —
  // current posture is WCAG 2.2 AAA on P0 / AA baseline elsewhere). Don't flag
  // legitimate historical / external-baseline references like:
  //   - "exceeds the WCAG 2.1 AA floor referenced by ADA / Section 504"
  //   - the W3C Understanding-page URLs (already filtered)
  //   - USWDS comparison context (already filtered)
  //   - CHANGELOG entries discussing pre-3.8 posture (archival filter)
  if (!isArchival) {
    wcag21Regex.lastIndex = 0;
    while ((m = wcag21Regex.exec(content)) !== null) {
      const idx = content.slice(0, m.index).split(/\r?\n/).length;
      const lineText = lines[idx - 1] ?? '';

      // Skip legitimate W3C URLs
      if (/WCAG21\/Understanding\//.test(lineText)) continue;

      // Skip USWDS comparison context
      if (/USWDS/i.test(lineText) && /work(?:s)? to/i.test(lineText)) continue;

      // Skip external-baseline references — language that frames WCAG 2.1 AA as
      // a regulatory floor HELiX EXCEEDS, not the HELiX standard itself. The
      // surrounding sentence will mention HHS / ADA / Section 504/508 / contract
      // / exceeds / minimum / external / regulatory / legal / baseline.
      const surroundingLines = lines.slice(Math.max(0, idx - 2), idx + 2).join(' ');
      const isExternalBaselineContext =
        /HHS|ADA|Section\s+50[48]|exceeds?|minimum|external|regulatory|legal|baseline|floor|contract|jurisdiction/i.test(
          surroundingLines,
        );
      if (isExternalBaselineContext) continue;

      // Skip lines that pair WCAG 2.1 with an explicit acknowledgement that
      // HELiX itself is WCAG 2.2 AAA (the two appear together in honest framing).
      if (/WCAG\s*2\.2\s*AAA/i.test(surroundingLines)) continue;

      // Skip axe-core literal references — `axe-core` itself ships rules with
      // a WCAG 2.1 AA default, so doc prose describing what axe-core checks
      // is intentionally literal, not a HELiX claim.
      if (/axe-core/i.test(surroundingLines)) continue;

      // Skip external-link references where the URL itself contains "wcag-2-1-aa"
      // or "wcag2-1aa" — those are third-party reference docs / checklists.
      if (/wcag[-_]?2[-_.]?1[-_]?aa/i.test(lineText)) continue;

      // Skip VPAT 2.5 conformance-claim cells that explicitly note the gated
      // posture alongside the targeted AAA on P0.
      if (/AAA[-_\s]?targeted/i.test(lineText)) continue;

      // Skip prose describing what an axe-core audit (or other consumer tool)
      // configures by default, where the WCAG 2.1 AA mention is the tool's
      // own default rather than a HELiX assertion.
      if (
        /audit|Default\s*=/i.test(lineText) &&
        !/HELiX\s+(?:meets|ships|claims|guarantees)/i.test(lineText)
      ) {
        continue;
      }

      // Skip cons/limitation-style bullets that frame WCAG 2.1 AA as a failure
      // condition — same external-baseline rationale.
      if (/^\s*-\s*.+\bfails?\s+WCAG\s+2\.1\s+AA\b/i.test(lineText)) continue;

      add({
        file,
        line: idx,
        severity: 'medium',
        category: 'aaa',
        issue:
          'Claims WCAG 2.1 AA without framing as external baseline — current HELiX posture is WCAG 2.2 AAA on P0 surface',
        evidence: lineText.slice(0, 120),
        fix: 'Either frame WCAG 2.1 AA as an external regulatory floor that HELiX exceeds, or update to "WCAG 2.2 AAA on P0 surface, AA baseline elsewhere".',
      });
    }
  }

  // --- 5b. @helixui/* package-name typos / fabrications ---
  // Catch references like `@helixui/libray`, `@helixui/iconz`, etc. — any
  // bare scoped name that isn't one of the workspace packages (or the
  // historical `drupal-behaviors-react` etc. that may still appear in
  // archival snapshots).
  const knownPackageNames = new Set(
    [...workspaceVersions.keys()].filter((n) => n.startsWith('@helixui/')),
  );
  // Aspirational packages that surface in docs as planned-future deliverables.
  // (Adopted-stylesheets is NOT here — `guides/adopted-stylesheets.md` explicitly
  //  says no such package exists, and any consumer-facing example that pretends
  //  it does should be flagged.)
  knownPackageNames.add('@helixui/storybook-preset'); // planned future package
  packageRefRegex.lastIndex = 0;
  const seenBadRefs = new Set();
  while ((m = packageRefRegex.exec(content)) !== null) {
    const name = `@helixui/${m[1]}`;
    if (knownPackageNames.has(name)) continue;

    const lineText = lines[content.slice(0, m.index).split(/\r?\n/).length - 1] ?? '';
    const surroundingLines = lines
      .slice(
        Math.max(0, content.slice(0, m.index).split(/\r?\n/).length - 2),
        content.slice(0, m.index).split(/\r?\n/).length + 1,
      )
      .join(' ');

    // Skip if explicitly framed as a typo / fabrication / non-existent /
    // example — the surrounding text identifies the package name as something
    // that DOES NOT exist on npm or in the workspace. Markdown emphasis
    // markers (`**no standalone`) can sit between "is" and the negation, so
    // patterns are written tolerant of intervening markup chars.
    if (
      /typo|misspelled|fabricated|fictional|fictitious|example|hypothetical|imagined|no separate|no standalone|none of those (exports )?exist|doesn['']t exist|do[es]*\s+not\s+exist|there is no|no such/i.test(
        surroundingLines,
      )
    )
      continue;

    // Skip forward-looking "Planned" / "future" / "coming" roadmap rows.
    if (/Planned|Future|Coming|Proposed|Roadmap|TBD/i.test(surroundingLines)) continue;

    // Skip Twig SDC include namespace references: `{{ include('@module/component', ...) }}`
    // or `extends '@module/component'`. Drupal SDC routes use the `@<namespace>`
    // form inside Twig template-loader calls, NOT npm package specifiers.
    if (/(?:include|extends|embed|import)\s*\(?\s*['"]@helixui\//.test(lineText)) continue;

    if (seenBadRefs.has(`${file}:${name}`)) continue;
    seenBadRefs.add(`${file}:${name}`);

    const idx = content.slice(0, m.index).split(/\r?\n/).length;
    add({
      file,
      line: idx,
      severity: 'high',
      category: 'package-version',
      issue: `Unknown @helixui/* package: ${name} (not in workspace)`,
      evidence: lineText.slice(0, 120),
      fix: `Replace with a real workspace package (e.g. ${[...workspaceVersions.keys()].slice(0, 3).join(', ')}) or remove the reference.`,
    });
  }

  // --- 6. @helixui/* package name + version-pin drift ---
  // The drift CI gate (`scripts/check-version-drift.mjs`) is the authoritative
  // blocker. This pass mirrors a subset so the programmatic report surfaces
  // mispelled package names and obviously stale exact pins in the same rollup
  // as the other findings.
  versionPinRegex.lastIndex = 0;
  while ((m = versionPinRegex.exec(content)) !== null) {
    // m[1] is the @helixui/* arm; m[2] is the create-helix arm (unscoped).
    // Exactly one of them is non-empty per match.
    const pkgName = m[1] ? `@helixui/${m[1]}` : m[2];
    const pin = m[3];
    const idx = content.slice(0, m.index).split(/\r?\n/).length;
    const lineText = lines[idx - 1] ?? '';

    // Skip changelog / archival files — historical pins are not drift
    if (isArchival) continue;

    // Skip lines that explicitly mark the pin as deprecated/unpublished/cosmetic,
    // or that frame the pin as a hypothetical / illustrative / future-major example.
    const surroundingLines = lines.slice(Math.max(0, idx - 2), idx + 2).join(' ');
    if (
      /deprecated|unpublished|cosmetic|artifact|placeholder|hypothetical|illustrative|illustration|example major|future major|don['']t try|do not try/i.test(
        surroundingLines,
      )
    ) {
      continue;
    }

    const canonical = workspaceVersions.get(pkgName);
    if (!canonical) continue; // package not in the workspace; can't compare
    if (canonical === 'npm-resolved') continue; // sentinel — offline / fetch failed; package-name check still ran

    // Extract the floor of caret/tilde ranges and the exact value of exact pins
    const exactMatch = pin.match(/^[0-9]+\.[0-9]+\.[0-9]+$/);
    const rangeMatch = pin.match(/^[\^~]([0-9]+(?:\.[0-9]+)?)/);
    const floor = exactMatch ? pin : rangeMatch?.[1];
    if (!floor) continue;

    // Compare numerically against the canonical workspace version with
    // semver-aware range semantics:
    //   - Caret `^X.Y.Z` accepts >=X.Y.Z <(X+1).0.0 — stale only if majors differ
    //   - Tilde `~X.Y.Z` accepts >=X.Y.Z <X.(Y+1).0 — stale if majors differ or
    //     floor minor < canonical minor (i.e., the canonical has moved past the
    //     tilde-pinned minor)
    //   - Exact `X.Y.Z` — stale on any segment diff (CDN URLs / install
    //     snippets drift on patch bumps too)
    const [floorMajorRaw, floorMinorRaw = '0', floorPatchRaw = '0'] = floor.split('.');
    const [canonMajorRaw, canonMinorRaw = '0', canonPatchRaw = '0'] = canonical.split('.');
    const floorMajor = Number(floorMajorRaw);
    const floorMinor = Number(floorMinorRaw);
    const floorPatch = Number(floorPatchRaw);
    const canonMajor = Number(canonMajorRaw);
    const canonMinor = Number(canonMinorRaw);
    const canonPatch = Number(canonPatchRaw);
    const isCaret = pin.startsWith('^');
    const isTilde = pin.startsWith('~');
    const stale = exactMatch
      ? floorMajor !== canonMajor || floorMinor !== canonMinor || floorPatch < canonPatch
      : isCaret
        ? floorMajor !== canonMajor
        : isTilde
          ? floorMajor !== canonMajor || floorMinor < canonMinor
          : floorMajor !== canonMajor || floorMinor < canonMinor;
    if (stale) {
      add({
        file,
        line: idx,
        severity: 'medium',
        category: 'package-version',
        issue: `Stale ${pkgName} pin: ${pin} (workspace ships ${canonical})`,
        evidence: lineText.slice(0, 120),
        fix: `Update to a range covering ${canonical} (e.g. ^${canonical}) or mark this entry as historical / deprecated.`,
      });
    }
  }

  // --- 7. internal link 404s (apps/docs only) ---
  if (file.includes('apps/docs/src/content/docs/')) {
    internalLinkRegex.lastIndex = 0;
    while ((m = internalLinkRegex.exec(content)) !== null) {
      let target = m[1];
      if (!target.startsWith('/')) continue;
      // Trim trailing slash for normalization
      const candidates = [target, target + '/', target.replace(/\/$/, '')];
      if (candidates.some((c) => survivingSlugs.has(c))) continue;

      // Skip known-external pseudo-paths that aren't routed by Starlight
      if (/^\/llms(?:-full)?\.txt/.test(target)) continue;
      if (/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(target)) continue;

      const idx = content.slice(0, m.index).split(/\r?\n/).length;
      add({
        file,
        line: idx,
        severity: 'medium',
        category: 'url',
        issue: `Internal link to ${target} — no surviving content file at that slug`,
        evidence: lines[idx - 1]?.slice(0, 120) ?? '',
        fix: 'Repoint to a real slug or remove the link.',
      });
    }
  }
}

// ---- write findings ----

await mkdir(REPORT_DIR, { recursive: true });
await writeFile(FINDINGS_PATH, findings.map((f) => JSON.stringify(f)).join('\n') + '\n');

// Group + write markdown rollup
const bySeverity = { critical: [], high: [], medium: [], low: [], info: [] };
for (const f of findings) (bySeverity[f.severity] ?? bySeverity.low).push(f);

const md = [];
md.push('# Docs Fact-Check — Programmatic Findings');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push(`Files scanned: ${targetFiles.length}`);
md.push(`Total findings: ${findings.length}`);
md.push('');
md.push('## Severity counts');
md.push('');
for (const [s, arr] of Object.entries(bySeverity)) {
  md.push(`- **${s}**: ${arr.length}`);
}
md.push('');
md.push('## Category counts');
md.push('');
const byCat = new Map();
for (const f of findings) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1);
for (const [c, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
  md.push(`- **${c}**: ${n}`);
}
md.push('');
md.push('## Findings (grouped by file)');
md.push('');
const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file).push(f);
}
for (const [file, arr] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  md.push(`### \`${file}\``);
  md.push('');
  for (const f of arr) {
    md.push(`- **${f.severity}** [${f.category}] line ${f.line}: ${f.issue}`);
    if (f.evidence) md.push(`  - Evidence: \`${f.evidence.replace(/`/g, '\\`')}\``);
    if (f.fix) md.push(`  - Fix: ${f.fix}`);
  }
  md.push('');
}

await writeFile(ROLLUP_PATH, md.join('\n'));

console.log(`Scanned ${targetFiles.length} files; ${findings.length} findings.`);
console.log(`Findings: ${FINDINGS_PATH}`);
console.log(`Rollup:   ${ROLLUP_PATH}`);
for (const [s, arr] of Object.entries(bySeverity)) {
  if (arr.length > 0) console.log(`  ${s}: ${arr.length}`);
}

// Preflight Gate 12 keys off process exit status — emit non-zero when there
// are findings so the gate actually blocks pushes. `low`-severity findings
// (currently used only for fabricated --hx-* token prefixes) are advisory and
// do not fail the gate by default; set HELIX_DOCS_CLAIMS_STRICT=1 to fail on
// any finding including `low`.
const blockingSeverities = ['critical', 'high', 'medium'];
const blockingFindings = findings.filter((f) => blockingSeverities.includes(f.severity));
const strict = process.env.HELIX_DOCS_CLAIMS_STRICT === '1';
if (blockingFindings.length > 0 || (strict && findings.length > 0)) {
  const failedCount = strict ? findings.length : blockingFindings.length;
  console.error('');
  console.error(`✗ docs-claims: ${failedCount} blocking finding(s).`);
  console.error(`  Review ${ROLLUP_PATH} and fix, or set HELIX_DOCS_CLAIMS_STRICT=0 if you`);
  console.error(
    `  want to opt out of strict-mode (low-severity findings are advisory by default).`,
  );
  process.exit(1);
}
