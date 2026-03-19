---
'@helixui/library': patch
---

feat(a11y): add accessible labels and roles to hx-progress-bar and hx-spinner

hx-progress-bar now exposes `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` on the track element, plus a `label` attribute that maps to `aria-label` when no visible label slot content is provided.

hx-spinner now exposes `role="status"` with `aria-label` (defaulting to `"Loading"`), a `label` attribute for custom accessible names, and a `decorative` boolean that switches to `role="presentation"` to suppress duplicate announcements when spinner appears alongside visible loading text.

Axe-core passes on both components in all states.
