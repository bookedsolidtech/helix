---
'@helixui/library': minor
---

hx-select: host-canonical combobox (ARIA Group 3 round 1) — option II architecture. The `<hx-select>` host element now carries `role="combobox"` (via ElementInternals + attribute mirror); the inner trigger is fully roleless. Modern engines use `internals.ariaLabelledByElements` / `ariaDescribedByElements` IDL element-array references; legacy fallback uses single-channel `internals.ariaDescription` text concatenation per W3C AccName 1.2 precedence. Consumer `aria-describedby` is preserved on the modern path and strictly shadows internal descriptions on fallback. Closes 11 codex review rounds (rounds 3 + 5 + 6 + 8 + 10 + r11 nit) including a principal-engineer architectural sign-off on the disconnect-during-strip MutationObserver pattern that resolves the round-9 counter-race vs bare-removeAttribute defect class. 149/149 tests green.
