---
title: Release Policy
description: HELiX release cadence, semantic versioning commitment, and breaking change communication process
---

HELiX follows a predictable release cadence so that consuming teams can plan upgrades with confidence. This page documents our versioning strategy, release schedule, and support commitments.

## Semantic Versioning

HELiX follows [Semantic Versioning 2.0.0](https://semver.org/) for canonical releases:

- **Patch** (`1.0.0` → `1.0.1`) — Bug fixes, documentation updates, internal refactors. No public API changes. Safe to adopt immediately.
- **Minor** (`1.0.0` → `1.1.0`) — New components, new properties, new CSS parts or slots. All changes are backward-compatible. Existing code continues to work without modification.
- **Major** (`1.0.0` → `2.0.0`) — Breaking changes to the public API: renamed properties, removed components, changed event signatures, or altered default behavior. Requires migration effort.

> **Note:** Versions in the `0.y.z` range are considered initial development. The public API is not yet stable and breaking changes may occur in any release during this phase.

> **`@helixui/library@4.0.0` is a deprecated accidental release** that shipped as a major during the 2026-05 icons epic without intentional breaking changes. The `3.x` line — currently `3.11.x` — is the supported current release; adopt the latest `3.x` and do **not** install `4.0.0`. A planned 4.x reset will follow once the affected packages republish from a known-clean state.

### What Counts as Public API

The following are considered part of a component's public API and are covered by semver guarantees:

- Custom element tag names (`hx-button`, `hx-card`, etc.)
- Public properties and attributes
- CSS custom properties (`--hx-*`)
- CSS parts (`::part()`)
- Slots (named and default)
- Custom events (`hx-*`)
- TypeScript type exports

Internal implementation details (private methods, internal DOM structure, undocumented CSS classes) are **not** covered by semver guarantees and may change in any release.

## Release Cadence

Releases are driven by accumulated changesets rather than a fixed calendar — `.github/workflows/publish.yml` opens a Release PR whenever unreleased changesets exist on `main`, and the team merges that PR when the changes are ready to ship. There is no enforced monthly/quarterly mechanism in CI today.

| Release Type | Trigger                                | Content                      |
| ------------ | -------------------------------------- | ---------------------------- |
| Patch        | As needed (bug fixes accumulated)      | Bug fixes, security patches  |
| Minor        | When new-feature changesets accumulate | New features, new components |
| Major        | When breaking-change changesets land   | Breaking changes, batched    |

### Pre-release Versions

Pre-release versions (e.g., `1.0.0-beta.1`) may be published for early testing of upcoming major releases. Pre-release versions carry no stability guarantees and should not be used in production.

## Breaking Change Process

Breaking changes are never introduced without advance notice. The process is:

1. **Deprecation** — The existing API is marked as deprecated in the current minor release. Deprecation warnings appear in the browser console during **development** builds; production bundles strip them to avoid runtime overhead in shipped sites. The property/method is annotated with `@deprecated` in the Custom Elements Manifest, which also surfaces the deprecation in IDE tooling and Storybook regardless of build mode.
2. **Migration guide** — A migration guide is published in the documentation describing the old API, the new API, and step-by-step migration instructions.
3. **Deprecation window** — Deprecated APIs remain functional for at least one full minor release cycle (minimum 30 days) before removal.
4. **Removal** — The deprecated API is removed in the next major release. The changelog and release notes clearly list all removals.

### Changelog

Every release includes a changelog generated via [changesets](https://github.com/changesets/changesets). Each PR that modifies a published package must include a changeset file describing the change type and summary. Changelogs are published:

- In the GitHub release notes
- In each package's `CHANGELOG.md`

## Release Process

HELiX uses a **three-branch promotion pipeline** to ensure changes are validated at each stage before reaching consumers.

```
feature/* → dev → staging → main
```

| Stage       | Branch    | Purpose                                                |
| ----------- | --------- | ------------------------------------------------------ |
| Development | `dev`     | Active integration; all feature PRs target this branch |
| Staging     | `staging` | Pre-release validation; promotion from `dev`           |
| Production  | `main`    | Published releases; promotion from `staging`           |

### How Releases Ship

1. **Feature work** lands on `dev` via PR. Each PR requires a changeset file (`.changeset/*.md`) declaring the bump type and change description.
2. **Promotion to staging** — `dev` is merged to `staging`. CI validates the full build and test suite.
3. **Promotion to main** — `staging` is merged to `main`. The CI publish pipeline detects changeset files, bumps `package.json` versions, updates `CHANGELOG.md`, and publishes packages to npm under the `@helixui` scope.
4. **GitHub Release** — A tagged release is created automatically with the generated changelog.

### Changeset Requirements

PRs that change source files in published packages are gated by the `changeset` CI job (see `.github/workflows/ci.yml`). The job checks for a `.changeset/*.md` file when the diff touches source paths under monitored packages. It can be bypassed by:

- adding the `skip-changeset` label (the canonical escape hatch for test-only, doc-only, or non-source PRs);
- audit-branch and non-source-PR detection via the `detect-changes` filter, which auto-skips the job when no monitored source changed.

Add a changeset with:

```bash
pnpm exec changeset
```

Verify the gate's exact monitored-path list in `.github/workflows/ci.yml` before assuming a PR is or is not covered — the enforced scope is narrower than "every published-package PR" in practice.

### Linked Package Versions

`@helixui/library` and `@helixui/tokens` are **linked** — they always publish at the same version number. Bumping one automatically bumps the other.

## Support Policy

| Version                                    | Support Level                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Current major (3.x for `@helixui/library`) | Full support — bug fixes, security patches, new features                                                                       |
| Previous major                             | Maintenance — critical bug fixes and security patches for a published support window (see migration guide for the active line) |
| Older majors                               | Unsupported — no fixes, no patches                                                                                             |

> See [Upgrading to 3](/migration/upgrading-to-3/) for the canonical support-window statement of the 2.x → 3.x line. Other package lines (`@helixui/drupal-starter`, `@helixui/drupal-behaviors` on 4.x; `@helixui/icons` on 1.x; `@helixui/mcp` on 0.x) version independently and their support windows follow the same pattern relative to each line's current major.

Security vulnerabilities in supported versions are patched as soon as possible, regardless of the regular release schedule.

## How to Stay Informed

- **GitHub Releases** — All releases are tagged and published with full release notes.
- **Changelog** — Every package contains a `CHANGELOG.md` file tracking all changes.
- **Deprecation warnings** — Development-build console warnings (stripped in production), plus `@deprecated` CEM annotations surfaced in IDE tooling and Storybook.
