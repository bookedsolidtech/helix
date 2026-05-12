# Codex Adversarial Review — Docs Fact-Check Campaign

You are running an adversarial fact-check against a single HELiX documentation
file. Your job is to verify every claim against the actual source code in
this monorepo. **Zero fabrications. Zero trust.** If the doc says it, the
source must back it up.

---

## Target

- **File:** `{TARGET}`

Read the entire file. Then verify every claim against:

- **Library source:** `packages/hx-library/src/`
- **Library CEM (canonical public API):** `packages/hx-library/custom-elements.json`
- **AAA cert verdicts (canonical):** `packages/hx-library/aaa-verdicts.json`
- **Workspace package.json versions** (under each `packages/*/package.json` and `package.json`)
- **Drupal behaviors source:** `packages/drupal-behaviors/`
- **React wrappers source:** `packages/hx-react/`
- **Icons source:** `packages/hx-icons/`
- **Tokens source:** `packages/hx-tokens/`
- **CLI scaffold (separate repo, referenced as `create-helix`):** package on npm; do NOT assume internal structure beyond what the published bin advertises.

---

## What to fact-check (in priority order)

### 1. Component names

Every `<hx-*>` tag mentioned (in prose, code samples, tables, or text) MUST
exist in `packages/hx-library/src/components/` AND in `custom-elements.json`.
Flag any mention of a component that does not exist (e.g. `<hx-page-layout>`,
`<hx-cards>` plural, etc.). For known pedagogical "this is wrong" examples
(error illustration), only flag if not clearly marked as such.

### 2. API surface claims

For every component property, event, slot, CSS part, or CSS custom property
referenced:

- Verify it exists in the CEM for that component.
- Verify the type matches (e.g. doc says `variant: 'primary' | 'secondary'`
  → check union members in CEM).
- Verify the event name matches (doc says `hx-toggle` but source emits
  `hx-change` → fabrication).
- Verify slot names are spelled correctly per CEM.
- Verify CSS custom properties exist (`--hx-*` pattern).

### 3. Package names + versions

Every `@helixui/*` package reference must use the canonical name AND a current
or migration-compatible version:

- `@helixui/library` — current per workspace
- `@helixui/icons` — current
- `@helixui/tokens` — current
- `@helixui/react` — current
- `@helixui/drupal-behaviors` — current
- `create-helix` (npm package; CLI command `npx create-helix`)

If the doc references `create-helix-app` as the COMMAND name, that's a
fabrication — the runnable command is `npx create-helix` (the package
`create-helix-app` exists separately but is the older legacy package; the
modern published CLI is `create-helix`). The directory name
`create-helix-app/` and the GitHub repo `bookedsolidtech/create-helix-app`
are LEGITIMATE; only `npx create-helix-app` or `npm create helix-app`
references in usage instructions are fabrications.

### 4. Code samples

For each fenced code block:

- Imports must resolve to real exports (`import { X } from '@helixui/library'`
  → X exists).
- Class names, function signatures, and decorator usage must match source.
- Syntax must be valid for the claimed language (typescript, javascript,
  html, twig, yaml, php, bash).
- For TypeScript/JavaScript: verify the API used (method names, property
  names, event names) against the source.

### 5. URLs and cross-links

- Internal links (e.g. `/architecture/adrs/`) must resolve to a surviving
  page in `apps/docs/src/content/docs/`.
- External links (storybook deep-links, npm, github, w3c) must use the
  canonical domain pattern (`storybook.helix.bookedsolid.tech`,
  `helix.bookedsolid.tech`, `npmjs.com/package/<pkg>`,
  `github.com/bookedsolidtech/helix`).
- Old repo references (`github.com/himerus/wc-2026` or any other historical
  org/repo) are stale.

### 6. AAA / accessibility claims

If the file makes accessibility claims, verify against
`packages/hx-library/aaa-verdicts.json`:

- Current cert posture: 44 P0 components × 11 criteria → 376 Supports / 0
  Partial / 0 Fail / 109 Not Applicable.
- WCAG version: 2.2 (not 2.1). Standard URL pattern is `WCAG22/` or
  `WCAG21/Understanding/<sc-name>.html` (the latter is acceptable since 2.2
  carries forward most 2.1 SC understanding pages).
- Claims like "WCAG 2.1 AA baseline" in non-archival contexts → stale, flag.

### 7. Drupal claims

If the file references Drupal behaviors, Twig integration, or `Drupal.behaviors`
patterns, verify against `packages/drupal-behaviors/`:

- Behaviors that exist: accordion, dialog, drawer, menu, popover, tabs,
  toast, tooltip (verify by `ls packages/drupal-behaviors/src/`).
- API contracts (`attach`, `detach`, `once()`) must match the package's
  actual exports.

### 8. Editorial fact-check

Flag any claim that is:

- **Marketing puffery** in docs (e.g. "best-in-class," "OSS enterprise
  alternative to USWDS") — belongs on the marketing site, not docs.
- **Internal tooling references** that consumers don't care about
  (protoMaker, internal CI workflows, build scripts).
- **Aspirational claims** stated as fact (e.g. claiming a package exists
  when it doesn't yet).
- **Forward references** to docs/files that don't exist (e.g. "see the
  detailed migration plan in /foo/bar/" when /foo/bar/ doesn't exist).

---

## How to output findings

You MUST emit each finding as a single JSON line conforming to this schema:

```json
{
  "campaign": "docs-fact-check",
  "target": "{TARGET}",
  "ts": "<ISO 8601>",
  "codex_run": "<short hash>",
  "severity": "critical | high | medium | low | info",
  "category": "component-name | api-surface | package-version | code-sample | url | aaa | drupal | editorial",
  "file": "<path:line>",
  "line": <int>,
  "issue": "<one-sentence description>",
  "evidence": "<quote from the doc + quote from the source>",
  "fix": "<concrete suggested fix>",
  "verdict_for_target": "pass | concerns | blocking"
}
```

Output ONE finding per line, JSONL. Do not wrap in arrays. Do not add markdown.

If the file is clean, emit a single "pass" finding anchored to **line 1** (the schema validator rejects any `line < 1`, so don't use `0`):

```json
{
  "campaign": "docs-fact-check",
  "target": "{TARGET}",
  "ts": "...",
  "codex_run": "...",
  "severity": "info",
  "category": "editorial",
  "file": "{TARGET}",
  "line": 1,
  "issue": "File passes fact-check with no findings.",
  "evidence": "",
  "fix": "",
  "verdict_for_target": "pass"
}
```

---

## What constitutes a "fabrication"

A fabrication is any claim in the doc that contradicts the source of truth:

- The doc says a component exists, the source doesn't have it.
- The doc says a prop is named X, the source has Y.
- The doc says version 3.0.0 in a non-archival file, the package.json says
  3.9.0.
- The doc says a feature works one way, the source implements it differently.
- The doc says a URL/path exists, it doesn't.

**Be precise. Quote both sides.** "The doc claims X on line N; the source
at packages/.../foo.ts line M shows Y." Without specific evidence, the
finding is not actionable.

---

## What is NOT a fabrication

- Historical/archival content in `migration/` — version refs can be old, by
  design.
- Pedagogical "wrong example" code blocks that explicitly mark themselves
  ("// BAD:", "// don't do this", etc.).
- Forward-looking roadmap items clearly marked as such.
- Marketing-tinted prose in `index.mdx` framing — flag for editorial but
  not as fabrication.
