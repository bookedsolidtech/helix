---
'@helixui/library': patch
---

fix(a11y): hx-tabs — aria-disabled keyboard discovery, selected-index attribute reflection, pointer-events

- disabled tabs are now keyboard-discoverable via arrow keys per the ARIA APG tab pattern; focus moves to disabled tabs but activation is prevented
- space/enter on a focused disabled tab does nothing
- added `selected-index` HTML attribute support so server-rendered pages (e.g. drupal twig) can pre-select a tab without javascript
- added `pointer-events: none` to disabled tab button to prevent mouse activation; `cursor: not-allowed` moved to `:host([disabled])` so the cursor remains visible
- `--hx-opacity-disabled` fallback value `0.5` was already present
