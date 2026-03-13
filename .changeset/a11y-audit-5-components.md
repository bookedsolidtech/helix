---
"@helixui/library": patch
---

fix: WCAG 2.1 AA accessibility audit for hx-split-panel, hx-field-label, hx-image, hx-progress-ring, and hx-structured-list

Closes #816, #796, #799, #807, #820

- hx-split-panel: focus-visible outline (not color-only), aria-label on divider, aria-disabled omitted when false, PageUp/PageDown keyboard support
- hx-image: alt defaults to undefined (no silent decorative), decorative prop added, role="alert" on error container
- hx-progress-ring: ARIA attributes moved to connectedCallback/willUpdate (SSR-safe), console.warn for missing label, aria-busy in indeterminate state
- hx-structured-list: role="list" on container, role="listitem" on row (fixes aria-required-children axe violation)
