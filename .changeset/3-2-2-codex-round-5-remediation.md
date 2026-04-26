---
'@helixui/library': patch
---

3.2.2 codex round-5 remediation — residual focus-ring fallback drift + override-path test

Cleanup of three concerns surfaced by codex deep review on the staging→main candidate. Rolls into the same 3.2.2 patch — no new tokens, no API change.

- `hx-combobox` — 2 focus-ring fallback chains (clear button + focused option) still resolved to `primary-500` on cold-start. Aligned to canonical `var(--hx-focus-ring-color, #0f7078)`.
- `hx-file-upload` — 3 focus-ring fallback chains (dropzone outline + dropzone border-color + file-item__remove outline) had the same drift. Same fix.
- `dark-mode-resolution.test.ts` — added a positive assertion that consumer-tier override of `--hx-color-action-primary-bg-inverted-rest` reaches the painted pixel in dark mode, proving the documented override contract end-to-end.
