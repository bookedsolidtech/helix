# Helix LTS Policy

## Overview

Helix is infrastructure for enterprise healthcare organizations. Stability and security are non-negotiable. This document defines the Long-Term Support (LTS) policy, release schedule, and security backport process for all Helix packages.

## Release Schedule

| Release Type | Cadence     | Support Window | Security Fixes |
|--------------|-------------|----------------|----------------|
| Major (N.0)  | 12 months   | 18 months      | Yes            |
| Minor (N.M)  | 6 weeks     | Until next LTS | Yes            |
| Patch (N.M.P)| As needed   | Current minor  | Yes            |
| LTS          | Every major | 18 months      | Backported     |

## LTS Versions

A release is designated LTS when it is a major version that has reached production stability. LTS status is declared at the time of the major release and is maintained for **18 months** from the release date.

### LTS Lifecycle Phases

```
Release date                    +12 months              +18 months
     |                               |                       |
     ▼                               ▼                       ▼
[   Active LTS — full support    ][  Maintenance LTS   ][  EOL  ]
     - Bug fixes                    - Security only
     - Security patches             - Critical regressions
     - Minor feature additions      - No new features
```

**Active LTS (0 – 12 months):** Full support including bug fixes, security patches, and minor enhancements that do not introduce breaking changes.

**Maintenance LTS (12 – 18 months):** Security patches and critical regression fixes only. No new features or non-critical bug fixes.

**End of Life (18 months+):** No further updates. Organizations must upgrade to the next LTS before this date.

## Security Backport Process

### Severity Definitions

| Severity | CVSS Score | Response SLA    | Backport Policy          |
|----------|------------|-----------------|--------------------------|
| Critical | 9.0–10.0   | 24 hours        | All active + maintenance |
| High     | 7.0–8.9    | 72 hours        | All active + maintenance |
| Medium   | 4.0–6.9    | 14 days         | Active LTS only          |
| Low      | 0.1–3.9    | Next patch      | Current major only       |

### Backport Workflow

1. **Triage** — Security issue filed against `main`. Severity assessed using CVSS v3.1.
2. **Fix on main** — Fix developed, reviewed, and merged to `main` first.
3. **Backport branch** — For each eligible LTS version, create a backport branch:
   ```
   git checkout -b security/CVE-YYYY-NNNNN-lts-N.x lts/N.x
   git cherry-pick <fix-commit-sha>
   ```
4. **Review** — Backport PR reviewed by the security team (minimum: 1 approval).
5. **Release** — Patch release cut from the LTS branch with changelog entry.
6. **Disclosure** — Security advisory published 14 days after patch release (coordinated disclosure).

### LTS Branch Naming

```
lts/1.x   — LTS for Helix v1
lts/2.x   — LTS for Helix v2
main      — Current development
```

### Responsible Disclosure

Report security vulnerabilities to: **security@helix.design** (or via GitHub Security Advisories on the repository).

Do not open public issues for security vulnerabilities. We follow a 90-day coordinated disclosure window.

## Upgrade Path

When an LTS version reaches End of Life, a migration guide is published covering:
- Breaking API changes between versions
- Component rename/deprecation table
- Automated codemods (where available)
- Estimated migration effort per component

Migration guides are in `docs/migration/`.

## Version Support Matrix

| Version | Status           | Release Date | EOL Date      |
|---------|------------------|--------------|---------------|
| 1.x LTS | Planned          | TBD          | TBD (+18 mo)  |
| 0.x     | Development      | 2026-01      | —             |

> This table is updated with each major release.

## Compatibility Commitments

During an LTS window, Helix guarantees:

- **No breaking changes** to public component APIs (attributes, properties, events, CSS parts, CSS custom properties)
- **No removal** of documented public APIs
- **No change** to the Custom Elements Manifest schema for existing components
- **Shadow DOM encapsulation** — internal structure may change but CSS parts and tokens remain stable
- **Drupal compatibility** — Twig template interfaces remain stable
- **TypeScript types** — Public type exports do not change signatures

Changes to `@internal` APIs, private implementation details, or `@experimental` APIs are exempt.

## Deprecation Policy

APIs are deprecated with a minimum of **one full minor release** of warning before removal. Deprecation notices appear in:
- TypeScript types (`@deprecated` JSDoc tag)
- Browser console warnings (once, per page load, in development mode only)
- Changelog and migration guide

Deprecated APIs are removed only in the **next major** version, never during an LTS window.
