---
'@helixui/library': patch
---

document axe-core elementinternals gap + project policy

The story-audit harness (`scripts/audit-stories.mjs`) now disables the
axe-core rules that are known to misreport FACE / `ElementInternals`
components — `aria-allowed-attr`, `aria-required-children`,
`aria-required-parent`, and `button-name`. axe-core 4.11.x cannot read
ARIA role / accessible-name semantics exposed via `ElementInternals`,
which produces false-positive violations against form-associated
HELiX components even when the live accessibility tree is correct.

The formal AAA audit (`pnpm aaa:audit`) is unchanged and remains the
cert authority — it sources verdicts from Playwright keyboard / role /
name probes that read the live accessibility tree directly. Manual
NVDA / JAWS / VoiceOver verification continues to gate every P0
component.

A new docs page at `accessibility/axe-element-internals-gap` describes
the gap, the affected components, the mitigation, and the resolution
path (axe-core 5.x or PR #5080 merged into a 4.x branch). The
per-component AAA-AUDIT.md template gains a "Tooling notes" section
that surfaces this gap on every FACE component's audit page.

This is a documentation + harness-tuning change. No component runtime
behaviour changes.
