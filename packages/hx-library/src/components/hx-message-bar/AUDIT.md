# Audit v2: `hx-message-bar` — Deep Audit

**Auditor:** Deep Audit v2 Agent
**Date:** 2026-03-06
**Branch:** `feature/deep-audit-v2-hx-message-bar`
**Prior audit:** T3-02 Antagonistic Quality Review (v1)

## wc-mcp Scores

| Metric              | Score  | Grade                                    |
| ------------------- | ------ | ---------------------------------------- |
| Component Health    | 92/100 | A                                        |
| Accessibility (CEM) | 0/100  | F (CEM docs only — actual impl is solid) |

## Changes Made (This Audit)

### HIGH — Fixed

| ID  | Issue                                                                                                             | Fix                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| H1  | `.message-bar__action:empty` CSS never matches (slot element always present) — action area always takes gap space | Added `slotchange` handler with `@state() _hasActions`; action container uses `?hidden` binding |
| H2  | Missing explicit `aria-live` attribute for screen reader announcements                                            | Added `aria-live` attribute (polite/assertive) matching role semantics                          |
| H3  | Private members `_isAssertive`/`_role` leak into CEM                                                              | Added `@internal` JSDoc tags                                                                    |
| H4  | `_handleCloseKeydown` redundant on native `<button>`                                                              | Removed — `<button>` natively handles Enter/Space                                               |
| H5  | `MessageBarVariant` type not exported (P2 from v1 audit)                                                          | Exported the type                                                                               |

### Tests Added

| Test                                           | Description                                       |
| ---------------------------------------------- | ------------------------------------------------- |
| `aria-live="polite"` for info variant          | Verifies explicit aria-live on status variants    |
| `aria-live="assertive"` for error variant      | Verifies explicit aria-live on assertive variants |
| action container hidden when no action slotted | Verifies action area is hidden without content    |
| action container visible when action slotted   | Verifies action area shows with slotted content   |

### Files Modified

- `hx-message-bar.ts` — aria-live, slotchange, @internal, export type, remove redundant keydown
- `hx-message-bar.styles.ts` — `.message-bar__action[hidden]` replaces broken `:empty`
- `hx-message-bar.test.ts` — 4 new tests (aria-live, action slot visibility)

## Remaining Issues (P2 — Pre-GA)

| ID    | Area          | Description                                                                     |
| ----- | ------------- | ------------------------------------------------------------------------------- |
| P2-1  | TypeScript    | Export alias `WcMessageBar` uses stale `Wc` prefix                              |
| P2-2  | Accessibility | `aria-label="Close"` not contextually descriptive — consider `close-label` prop |
| P2-3  | Accessibility | `aria-atomic="true"` missing on `role="status"` variants                        |
| P2-4  | Tests         | `open="false"` fixture misleading (boolean attribute always truthy)             |
| P2-5  | Tests         | No computed style test for sticky positioning                                   |
| P2-6  | Storybook     | No `Sticky` story with scrollable container demo                                |
| P2-7  | Storybook     | `WithAction` only demos `<a>`, no button variant                                |
| P2-8  | Storybook     | No `ClosedState` story                                                          |
| P2-9  | CSS           | Hardcoded hex fallbacks throughout — `#e8f4fd`, `#1a3a4a`, etc.                 |
| P2-10 | CSS           | Focus ring color `#2563eb` hardcoded                                            |
| P2-11 | CSS           | `color-mix()` may lack support in older healthcare Chromium builds              |
| P2-12 | Drupal        | No Twig usage example documented                                                |

## Verification

- `npm run type-check`: 0 errors
- `npm run test:library`: 3104/3104 pass (including 4 new tests)
- `npm run verify`: PASS (lint + format + type-check)
