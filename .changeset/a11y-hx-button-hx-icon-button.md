---
'@helixui/library': patch
---

fix: accessibility fixes for hx-button and hx-icon-button (WCAG 2.1 AA)

hx-button:
- Add `ariaLabel` property forwarded to inner `<button>` and `<a>` — fixes icon-only buttons lacking accessible name (WCAG 4.1.2 Level A)
- Remove redundant `aria-disabled` from native `<button>` branch — native disabled attribute already exposes this implicitly in the accessibility tree
- Fix double-opacity stacking on disabled state (was 0.25, now 0.5)
- Add `rel="noopener noreferrer"` for `target="_blank"` anchors

hx-icon-button (new component):
- Accessible name via `aria-label` and `title` from required `label` property
- No redundant `aria-disabled` on native `<button>` (P1-07)
- Explicit `tabindex="-1"` on disabled `<a>` (P1-03)
- Single opacity on `:host([disabled])` only — no double-stacking (P1-02)
- Real keyboard activation tests via `userEvent.keyboard` (P1-01)

Closes #786, #798
