# Security Policy

HELiX is enterprise healthcare infrastructure. Software failures in this library
can affect systems that touch patient care, so we take security reports
seriously and aim to respond quickly. This document describes how to report a
vulnerability and what to expect after you do.

## Supported Versions

HELiX is currently published on the **3.x** line. Security fixes land on the
latest `3.x` release; older minors do not receive backports. Upgrade to the most
recent `3.x` release to stay covered.

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | :white_check_mark: |
| < 3.0   | :x:                |

Package: [`@helixui/library`](https://www.npmjs.com/package/@helixui/library)
(and the companion `@helixui/react` and `@helixui/icons` packages, which track
the same line).

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security reports.** Public issues
disclose the vulnerability before a fix is available and put consumers at risk.

Use one of the private channels below instead:

1. **GitHub Security Advisories (preferred).** Open a private advisory through
   the repository's **Security → Report a vulnerability** tab:
   <https://github.com/bookedsolidtech/helix/security/advisories/new>.
   This keeps the report private, lets us collaborate on a fix in a private
   fork, and coordinates the CVE/GHSA on disclosure.

2. **Email.** If you cannot use GitHub Security Advisories, contact the
   maintainers at **`security@helixui.dev`**
   <!-- TODO: confirm/replace with the real monitored security contact before publishing. -->.

When reporting, please include as much of the following as you can:

- A description of the vulnerability and its impact (what an attacker can do).
- The affected component(s), package version, and environment (browser, Drupal
  version, framework).
- Step-by-step reproduction instructions or a minimal proof of concept.
- Any known mitigations or workarounds.

Please give us a reasonable opportunity to remediate before any public
disclosure. We follow **coordinated vulnerability disclosure** and will work
with you on a disclosure timeline.

## Response Expectations

We aim to meet the following timelines (business days, best effort):

| Stage                     | Target                                              |
| ------------------------- | --------------------------------------------------- |
| Acknowledgement of report | Within **3 business days**                          |
| Initial triage / severity | Within **7 business days**                          |
| Fix or mitigation plan    | Communicated after triage, prioritized by severity  |
| Public disclosure         | Coordinated with the reporter once a fix is released |

For accepted reports we will keep you informed of progress, credit you in the
advisory (unless you prefer to remain anonymous), and publish a GitHub Security
Advisory (GHSA) when the fix ships. If a report is declined, we will explain
why.

## Scope

In scope:

- The published packages (`@helixui/library`, `@helixui/react`,
  `@helixui/icons`) and their distributed artifacts.
- The Drupal integration starter (`starters/drupal/`, `packages/drupal-starter/`)
  including the asset-loader/library definitions and Twig templates shipped with
  it.

Out of scope:

- Vulnerabilities in consuming applications caused by misuse documented as
  unsafe (e.g. passing unsanitized untrusted HTML to `hx-prose` without enabling
  the sanitizer, or using `|raw` on untrusted Twig input — see
  [XSS Prevention](apps/docs/src/content/docs/drupal/security-xss.md)).
- Vulnerabilities in third-party dependencies that have not yet shipped a fix
  (report those upstream; we will track and update once a patched release is
  available).

## Hardening Background

For the trust boundaries, attack surface, and the per-component mitigations this
project enforces, see [`THREAT_MODEL.md`](THREAT_MODEL.md). For Drupal-specific
XSS guidance (slot content, attribute escaping, CSP, and SRI), see
[XSS Prevention](apps/docs/src/content/docs/drupal/security-xss.md).
