---
"@helixui/library": patch
---

fix(release): widen the `@helixui/icons` peer range so a same-cycle icons bump no longer forces a spurious major

`@helixui/library` declared `"@helixui/icons": "workspace:*"` as a peer dependency. Because `workspace:*` resolves to the icons package's exact current version at publish time (an exact pin such as `1.0.4`), any release cycle that bumped `@helixui/icons` (even a minor) caused Changesets' `shouldBumpMajor` peer-dependent rule to fire: the incremented icons version left library's exact-pinned peer range, so library was force-bumped to a **major**. Through the `[@helixui/library, @helixui/tokens, @helixui/react]` linked group and library's downstream dependents, that spurious major cascaded (library/react → 4.0.0, drupal packages → 5.0.0) even though every changeset in the cycle was minor/patch.

Changing the peer specifier to `workspace:^` publishes a caret range (`^1.1.0`) that a compatible icons minor satisfies, so a same-cycle icons bump no longer leaves the range and library versions on its own changeset severity. The change is specifier-only — the resolved workspace link is unchanged and the lockfile is unaffected. The published peer range moves from an exact `icons` pin to a caret range, which is the intended, less-brittle contract.
