---
'@helixui/icons': patch
---

chore: migrate npm publishing to Trusted Publishing (OIDC)

Removes the long-lived NPM_TOKEN dependency from the publish workflow. The
publish job now authenticates to npm via GitHub Actions OIDC token federation
(Trusted Publishing), scoped through the `npm-publish` environment. Sigstore
provenance attestations are preserved. This is an infrastructure-only change
with no consumer-facing API impact.
