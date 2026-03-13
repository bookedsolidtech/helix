---
"@helixui/library": patch
---

fix(css): resolve css audit findings for hx-help-text, hx-split-panel, hx-toast, hx-text, hx-text-input

- replace hardcoded hex colors with design tokens in hx-help-text FormFieldIntegration story
- document hx-split-panel p2-07 resolved: token-only cascade with no hex fallbacks
- document hx-toast p2-01 resolved: prefers-reduced-motion suppresses auto-dismiss timer
- document hx-toast p2-05 resolved: action slot wrapper has part="action"
- document hx-text p1-03 resolved: variant set deviation explained in jsDoc
