---
'@helixui/library': patch
---

fix(a11y): resolve aria-required-parent violation in hx-breadcrumb

Adds `role="list"` to the `hx-breadcrumb` host element and `role="presentation"` to the shadow DOM `<ol>` so axe-core flat-tree traversal sees a valid ARIA list ancestor for `hx-breadcrumb-item[role="listitem"]` children. Previously the `<ol>` lived in shadow DOM while the list items lived in light DOM, so axe-core's `@axe-core/playwright` could not bridge the shadow boundary to establish the required list/listitem parent–child relationship in the composed accessibility tree.
