---
'@helixui/library': patch
---

fix(barrel): restore HelixAuditController, AuditEventDetail, AuditControllerOptions to public barrel via generate-barrel.js allowlist

fix(publish): add CEM regeneration + verification step to publish job so both secret-scan and publish jobs independently verify CEM freshness

fix(publish): add @helixui/react to secret-scan package loop

fix(mixins): promote FormMixinProtectedHooks jsdoc from @internal to @protected

fix(changelog): add resetIdCounter test-utils migration note

fix(docs): correct CDN artifact URLs and floating-ui pre-warm import in migration guides
