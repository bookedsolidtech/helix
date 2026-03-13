---
"@helixui/library": patch
---

perf: resolve performance audit findings for hx-meter, hx-overflow-menu, and hx-radio-group

- hx-meter: confirmed bundle within 5KB budget — all runtime deps externalized (lit, @helixui/tokens); CI shared gate covers per-component size
- hx-overflow-menu: @floating-ui/dom correctly externalized as peerDependency and excluded from rollup output — no longer bundled into component chunk
- hx-radio-group: eliminated redundant double invocation of setFormValue/syncRadios/updateValidity per radio selection — _handleRadioSelect now delegates exclusively to updated() lifecycle hook, halving work per interaction
