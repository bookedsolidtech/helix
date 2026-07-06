---
"@helixui/library": patch
---

Decouple `hx-breadcrumb` item discovery and the `listitem` role from the literal
`hx-breadcrumb` / `hx-breadcrumb-item` tag names, so a subclass that renames the
host or item inherits both behaviors.

Previously the breadcrumb located its items by matching `tagName === 'hx-breadcrumb-item'`,
and each item self-assigned `role="listitem"` only when its parent (or shadow-root host)
`tagName` was exactly `'hx-breadcrumb'`. A consumer that extended `HelixBreadcrumb` /
`HelixBreadcrumbItem` and registered the subclass under a different tag name broke on both
counts: the renamed host discovered zero items (collapse logic and current-page marking
never ran), and the renamed items never received `role="listitem"`, producing an
`aria-required-children` accessibility violation.

Discovery now collects children that are `instanceof HelixBreadcrumbItem`, and an item
detects its breadcrumb ancestor structurally — `instanceof HelixBreadcrumb` against its
light-DOM parent and shadow-root host, plus a `closest('[role="list"]')` fallback — with
the literal tag names kept only as OR fast-paths. As a result, `HelixBreadcrumb` /
`HelixBreadcrumbItem` subclasses registered under different tags inherit item discovery,
collapse behavior, and the `listitem` role. Behavior for the stock `hx-breadcrumb` /
`hx-breadcrumb-item` elements (including JSON-LD and collapse) is unchanged.
