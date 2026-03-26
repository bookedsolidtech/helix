---
'@helixui/library': patch
---

audit(hx-status-indicator): deep quality audit — a11y, tokens, css parts, tests, stories

- Fixed CSS size variant selectors from `[size]` to `[hx-size]` (broken since hx-size migration)
- Added default `--_indicator-size` on `:host` so the dot never collapses to 0×0 when no size is set
- Added `show-label` boolean property rendering a visible `part="label"` text element to satisfy WCAG 1.4.1 (Use of Color) when the indicator is not accompanied by adjacent status text
- Added `aria-live="polite" aria-atomic="true"` visually-hidden region inside shadow DOM so dynamic status changes are announced to screen readers
- Documented new `part="label"` and `--hx-status-indicator-label-color` / `--hx-status-indicator-label-font-size` css custom properties
- Added tests: show-label rendering for all statuses, live region presence and dynamic update, all status dynamic label cycle
- Added Storybook stories: ShowLabel, AllStatusesWithLabel, showLabel argType control
