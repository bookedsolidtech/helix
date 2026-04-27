---
'@helixui/react': patch
---

3.2.2 — `HxThemeProps['effectiveTheme']` type narrowed from `'light' | 'dark' | 'high-contrast' | 'auto'` to `'light' | 'dark' | 'high-contrast'`.

The runtime getter on `<hx-theme>` resolves `theme="auto"` to either `'light'` or `'dark'` via `matchMedia`, so the wrapper type previously declared a value the runtime never returns. The wrapper has been regenerated from the corrected library types in 3.2.2.

**Consumer impact:** if you have an exhaustiveness check on `effectiveTheme` that handles `'auto'`, TypeScript will now flag that branch as unreachable. Remove it. The input `theme` prop still accepts `'auto'`; only the resolved `effectiveTheme` getter narrowed.

**Why patch (not minor).** The runtime never produced `'auto'` from `effectiveTheme` — the original type was misdocumented. No consumer relying on documented runtime behavior could have legitimately matched `'auto'` against an effective state, because the runtime always resolves `'auto'` into `'light'`/`'dark'` before the getter returns. HELiX classifies type-narrowings that bring declared types into alignment with documented and observable runtime behavior as patches; strict-mode TS consumers may need a one-line removal of the dead `'auto'` branch (called out above). Minor/major bumps are reserved for type changes that alter the runtime contract — this change does not.
