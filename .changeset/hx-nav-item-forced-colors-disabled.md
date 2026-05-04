---
'@helixui/library': patch
---

`hx-nav-item`: scope forced-colors disabled opacity reset to `.nav-item__link`.

Previously the `:host([disabled]) { opacity: 1 }` rule inside `@media (forced-colors: active)` reset opacity on the host itself, which propagated to children and obscured the GrayText hint on the nav link in Windows High Contrast mode. The reset now lives on `.nav-item__link` directly so the GrayText override stays visible while the host remains opaque to layout. Adds a runtime regression test pinning forced-colors override source-order so a silent cascade regression cannot land.
