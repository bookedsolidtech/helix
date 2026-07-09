---
"@helixui/library": patch
---

fix NVDA double-announcement from duplicated `title` on hx-icon-button, hx-copy-button, and hx-color-picker

These components rendered the same string as both `aria-label` (accessible name) and `title` (which maps to the accessible description), so NVDA announced the label twice on every focus — a defect axe-core does not flag. Confirmed by a downstream team on NVDA.

- `hx-icon-button` and `hx-copy-button` — `title` is MOVED off the focusable element onto an aria-hidden internal carrier spanning the button face. The native hover tooltip is preserved; the control's accessible description stays empty, so the label is announced exactly once. For `hx-copy-button` this also fixes a stale-description bug: in the copied state the `aria-label` updated to "label — copied" while the on-button `title` stayed at the idle label, leaving name and description contradicting each other.
- `hx-color-picker` — the preset swatch buttons use the same aria-hidden carrier, so the exact color value stays visible on hover (close shades are otherwise indistinguishable for pointer users) without double-announcing. Only the format-cycle button's `title` is fully removed: its visible text is the format name itself, and `title="Switch format"` was additionally a hardcoded English string that bypassed the i18n `labelSwitchFormat` property.

Accessible names are unchanged (`aria-label` throughout). No API changes.
