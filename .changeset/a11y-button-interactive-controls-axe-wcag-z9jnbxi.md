---
'@helixui/library': patch
---

add axe-core a11y tests and fix wcag 2.1 aa compliance for hx-button, hx-icon-button, hx-toggle-button, hx-copy-button, hx-split-button

- hx-icon-button: fix aria-prohibited-attr violation — disabled anchor (href removed) loses implicit link role, making aria-label prohibited; add explicit role="link" on disabled anchor so aria-label is valid (WCAG 4.1.2)
- hx-split-button: fix empty aria-label="" on primary button when ariaLabel property is empty string (default) and no label prop set; slot content now correctly provides the accessible name
- hx-icon-button: add axe-core tests for all three sizes (sm/md/lg) and href/anchor mode including disabled state
- hx-split-button: add axe-core tests for all six variants (primary/secondary/tertiary/danger/ghost/outline), all three sizes (sm/md/lg), and menu-open state
