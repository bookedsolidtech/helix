---
'@helixui/library': patch
---

fix: add runtime deprecation warning to hx-action-bar sticky property

The deprecated `sticky` property on `hx-action-bar` now emits a `console.warn()` when set, directing consumers to use `position="sticky"` instead. All other TypeScript type safety findings across hx-combobox (#791), hx-time-picker (#828), hx-card (#788), and hx-meter (#801) were already resolved in the codebase.
