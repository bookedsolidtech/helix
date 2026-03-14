---
'@helixui/library': patch
---

fix(a11y): resolve WCAG 2.1 AA findings for hx-text-input and hx-tooltip

- hx-text-input (P0-01): Confirmed aria-describedby correctly references error/help-text containers; slotted help-text tracked via _hasHelpTextSlot so aria-describedby includes slot content; role="alert" on error container without redundant aria-live
- hx-tooltip (P1-02): Confirmed focusout on trigger wrapper schedules tooltip hide; light DOM aria-describedby pattern resolves cross-shadow-DOM boundary; mouse hover on tooltip prevents WCAG 1.4.13 dismiss

Closes #825
Closes #831
