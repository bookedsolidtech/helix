---
'@helixui/library': patch
---

fix(a11y): remediate wcag 2.1 aa findings across 40+ components

Full remediation of the WF-01 accessibility compliance audit. Fixes 117 findings across
high, medium, and low severity. Key changes:

- aria-expanded now always 'true'/'false' (never absent) on accordion, nav, split-button, code-snippet, color-picker, date-picker
- touch targets increased to 44px minimum on overflow-menu, badge, split-panel, toast close, code-snippet buttons
- focus management: dialog close button fallback, popover conditional focus, color-picker panel focus on open
- hover delay (150ms) added to popover for WCAG 1.4.13 compliance
- dropdown panel gets role='menu' and aria-label
- radio-group describedBy combines error and help IDs simultaneously
- banner adds visually-hidden severity label (no color-only conveying)
- banner and alert consistent severity announcement
- aria-hidden uses nothing directive instead of string 'false'
- disabled anchor/link elements removed from tab order
- hx-toast default duration increased to 5000ms; pauses when action slot has content
- hx-image warns at development time when informative image lacks alt text
- hx-nav mobile toggle and submenu aria-expanded always 'true' or 'false'
- hx-steps dual aria-label announcement fixed with role=none on host
- hx-data-table clickable rows keyboard-activatable via Enter/Space
- hx-side-nav keyboard navigation uses public focus() method instead of shadow DOM piercing
- hx-stat value+label wrapped in role=group for screen reader association
- hx-counter final-value-only live region (no per-frame announcements)
- hx-radio label association via aria-label
- hx-structured-list accessible label property added
- hx-form error summary receives programmatic focus after validation failure
- select/combobox aria-selected per ARIA spec (single-select omits, multi-select explicit)
- time-picker always renders listbox for stable aria-controls reference
- multiple devWarn additions for missing labels (button-group, table, number-input, divider, badge dot)
