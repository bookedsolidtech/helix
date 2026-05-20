---
'@helixui/icons': patch
---

chore: pin npm 11.5.1 in publish job for OIDC trusted publishing

The publish job authenticates to npm via GitHub Actions OIDC token federation
(Trusted Publishing), but `changeset publish` delegates the registry PUT to the
global `npm` binary. Node 22 bundles npm 10.x, which signs provenance but lacks
trusted-publishing OIDC auth, so the PUT went out unauthenticated and the
registry returned a misleading `E404 ... is not in this registry`. Pinning npm
to 11.5.1 before publish gives `changeset publish` a TP-capable npm. This is an
infrastructure-only change with no consumer-facing API impact.
