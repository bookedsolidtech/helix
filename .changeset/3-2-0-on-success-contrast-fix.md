---
'@helixui/tokens': patch
---

Fix WCAG AA contrast failure on `--hx-color-text-on-success`.

The token resolved to `var(--hx-color-neutral-0)` (white) on `--hx-color-success-500` (#16A34A) — a contrast ratio of ~2.8:1, which fails WCAG AA for body text (4.5:1) and large text (3:1). Rebound to `var(--hx-color-neutral-900)` (dark), giving 11.2:1 on the same green — AAA pass. Matches the existing on-warning pattern, which paints dark text on amber for the same reason.

Dark mode and high-contrast overrides are unchanged: HC still emits `#000000` on bright HC success, dark mode now inherits the dark-on-light pattern via the cascade.

Components painting text against a success surface (e.g., success badges, toasts, inline alerts) will flip from white text to dark text. This is the intended visual change — every prior render at the AA failure was technically a defect.
