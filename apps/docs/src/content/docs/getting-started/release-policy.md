---
title: Release Policy
description: HELiX release cadence, semantic versioning commitment, and breaking change communication process
---

HELiX follows a predictable release cadence so that consuming teams can plan upgrades with confidence. This page documents our versioning strategy, release schedule, and support commitments.

## Semantic Versioning

HELiX strictly follows [Semantic Versioning 2.0.0](https://semver.org/):

- **Patch** (`0.1.0` → `0.1.1`) — Bug fixes, documentation updates, internal refactors. No public API changes. Safe to adopt immediately.
- **Minor** (`0.1.0` → `0.2.0`) — New components, new properties, new CSS parts or slots. All changes are backward-compatible. Existing code continues to work without modification.
- **Major** (`0.x` → `1.0`) — Breaking changes to the public API: renamed properties, removed components, changed event signatures, or altered default behavior. Requires migration effort.

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

| Release Type | Frequency | Content |
|-------------|-----------|---------|
| Patch | As needed | Bug fixes, security patches |
| Minor | Monthly | New features, new components |
| Major | Quarterly (at most) | Breaking changes, batched |

### Pre-release Versions

Pre-release versions (e.g., `1.0.0-beta.1`) may be published for early testing of upcoming major releases. Pre-release versions carry no stability guarantees and should not be used in production.

## Breaking Change Process

Breaking changes are never introduced without advance notice. The process is:

1. **Deprecation** — The existing API is marked as deprecated in the current minor release. Deprecation warnings appear in the browser console at runtime, and the property/method is annotated with `@deprecated` in the Custom Elements Manifest.
2. **Migration guide** — A migration guide is published in the documentation describing the old API, the new API, and step-by-step migration instructions.
3. **Deprecation window** — Deprecated APIs remain functional for at least one full minor release cycle (minimum 30 days) before removal.
4. **Removal** — The deprecated API is removed in the next major release. The changelog and release notes clearly list all removals.

### Changelog

Every release includes a changelog generated via [changesets](https://github.com/changesets/changesets). Changelogs are published:

- In the GitHub release notes
- In each package's `CHANGELOG.md`

## Support Policy

| Version | Support Level |
|---------|--------------|
| Current major | Full support — bug fixes, security patches, new features |
| Previous major | Maintenance — critical bug fixes and security patches only (12 months after next major release) |
| Older majors | Unsupported — no fixes, no patches |

Security vulnerabilities in supported versions are patched as soon as possible, regardless of the regular release schedule.

## How to Stay Informed

- **GitHub Releases** — All releases are tagged and published with full release notes.
- **Changelog** — Every package contains a `CHANGELOG.md` file tracking all changes.
- **Deprecation warnings** — Runtime console warnings alert you to deprecated APIs before they are removed.
