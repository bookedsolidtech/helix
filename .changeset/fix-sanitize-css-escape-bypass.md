---
'@helixui/library': patch
---

Fix CSS escape bypass in `sanitizeCss` url() validator. `isUrlSafe()` now decodes CSS hex escapes and line-continuations before applying scheme checks, closing a bypass where attacker-controlled light-DOM CSS could smuggle external-resource loads past the validator via `url(http\3a//evil.example/x)` and similar encoded forms.
