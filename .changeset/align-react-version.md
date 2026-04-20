---
'@helixui/react': patch
---

chore(react): align version line with @helixui/library@2.1.2 in preparation for 3.0.0 lockstep

The `@helixui/react` package was introduced later than `@helixui/library` and had accumulated an independent version history (last release 1.1.4). This bookkeeping bump realigns it to the same 2.1.2 baseline as `@helixui/library` and `@helixui/tokens` so the 3.0.0 major aggregates to a coherent 3.0.0 across all three public packages (see `docs/UPGRADING-TO-3.md`). `@helixui/react` is now in the `linked` group with `@helixui/library` and `@helixui/tokens` to enforce lockstep in future releases.
