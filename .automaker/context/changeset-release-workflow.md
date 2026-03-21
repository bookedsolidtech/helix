# Changeset Release Workflow

Every component change that touches `packages/hx-library/src/` or `packages/hx-tokens/` **must** include a changeset. This is enforced at push time — you cannot push without one.

---

## What Is a Changeset?

A changeset is a small markdown file in `.changeset/` that declares:
1. Which packages changed
2. What kind of change it is (`patch` / `minor` / `major`)
3. A human-readable summary of what changed

When pushed to `main`, the CI publish pipeline reads these files, bumps the version numbers in `package.json`, updates `CHANGELOG.md`, and publishes to npm automatically.

---

## The Full Cycle

```
feature work → changeset created → pushed → main merged → publish fires → npm updated
```

### Step 1 — Create a changeset while working on a feature

```bash
npx changeset
```

Interactive prompt:
1. Select which packages changed (spacebar to select, enter to confirm)
   - `@helixui/library` — for any component source changes
   - `@helixui/tokens` — only if token values changed
2. Select bump type:
   - `patch` — bug fix, internal refactor, no new API surface (e.g., `0.2.0 → 0.2.1`)
   - `minor` — new feature, new prop, new component, additive change (e.g., `0.2.0 → 0.3.0`)
   - `major` — breaking change, removed prop, renamed event (e.g., `0.2.0 → 1.0.0`)
3. Write a 1-2 sentence summary of what changed

This creates `.changeset/random-words.md`. Commit it with your work.

### Step 2 — Commit the changeset with your changes

```bash
git add .changeset/
git commit -m "feat: add hx-tooltip component"
```

The pre-push hook will verify the changeset exists before allowing the push.

### Step 3 — Push and open PR normally

The changeset file travels with the branch into the PR. No special action needed.

### Step 4 — Merge to main

When the staging→main PR merges:
- The publish workflow detects the changeset file
- Bumps `package.json` version (linked: `@helixui/library` and `@helixui/tokens` always version together)
- Updates `CHANGELOG.md` with your summary
- Publishes both packages to npm under `@helixui` scope
- Pushes the version bump commit to main

---

## Bypass (Infra-Only Changes)

For changes that don't affect the public API (CI config, scripts, docs, tests only):

```bash
SKIP_CHANGESET=1 git push
```

Or add label `skip-changeset` to the PR on GitHub.

When NOT to bypass:
- Any change to `packages/hx-library/src/components/`
- Any change to component public properties, events, slots, or CSS parts
- Any change to `packages/hx-tokens/src/`

When it IS okay to bypass:
- `.github/workflows/` changes
- `scripts/` changes
- `apps/` changes (Storybook, docs, admin)
- Test-only changes (`*.test.ts`)

---

## Bump Type Guide

| Change | Type |
|--------|------|
| Fix a bug in an existing component | `patch` |
| Add a new prop to an existing component | `minor` |
| Add a new component | `minor` |
| Fix accessibility (ARIA, keyboard) | `patch` |
| CSS token audit / refactor | `patch` |
| Rename a prop (breaking) | `major` |
| Remove a slot (breaking) | `major` |
| Change an event name (breaking) | `major` |

**Rule of thumb:** If consumers need to change their code, it's `major`. If consumers get new things they can optionally use, it's `minor`. Everything else is `patch`.

---

## Linked Packages

`@helixui/library` and `@helixui/tokens` are **linked** — they always publish at the same version. If you bump `@helixui/library` to `0.3.0`, `@helixui/tokens` also becomes `0.3.0` automatically. This simplifies consumer dependency management.

---

## CI Enforcement

Two gates enforce changesets:

1. **Pre-push hook** (`scripts/pre-push-check.sh`) — blocks the push immediately at the terminal
2. **CI gate** (`changeset` job in `.github/workflows/ci.yml`) — blocks the PR if the hook was somehow bypassed

The pre-push hook is the primary enforcement — it catches the problem at development time, not after a full CI run.

---

## HELiXiR / Other Teams — Adaptation Guide

To implement this same system in another repo:

### Requirements
- `@changesets/cli` installed: `npm install --save-dev @changesets/cli`
- `@changesets/action` in CI: `uses: changesets/action@v1`
- npm org scope registered and token in GitHub secrets as `NPM_TOKEN`

### Files to copy from HELiX
1. `.changeset/config.json` — update package names and `linked` array
2. `.github/workflows/publish.yml` — update package filter in turbo build command
3. The changeset section of `scripts/pre-push-check.sh` — Gate 4 block
4. The `changeset` job in `.github/workflows/ci.yml`

### `.changeset/config.json` for a new repo

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.2/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [["@your-scope/library", "@your-scope/tokens"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@your-scope/storybook", "@your-scope/docs", "@your-scope/admin"]
}
```

### `package.json` scripts required

```json
{
  "scripts": {
    "changeset": "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "changeset publish"
  }
}
```

### npm Authentication

The publish workflow uses **OIDC trusted publishing** (no token needed at CI level) combined with `NODE_AUTH_TOKEN` for the npm publish step. Ensure:
- The npm package is configured to allow OIDC from your GitHub org
- `NPM_TOKEN` secret is set in GitHub repo settings (automation token from npmjs.com)
- `id-token: write` permission is set on the publish job

---

## Version History

| Version | Date | What shipped |
|---------|------|-------------|
| 0.1.0 | 2026-03 | Initial public release |
| 0.1.3 | 2026-03 | Infrastructure, CI improvements |
| 0.2.0 | 2026-03 | Full WCAG 2.1 AA accessibility audit, CSS token audit, prettier enforcement, VRT fix |
