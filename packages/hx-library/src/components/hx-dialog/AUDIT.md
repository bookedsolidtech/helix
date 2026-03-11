# hx-dialog — Deep Opus-Level Audit

**Audit date:** 2026-03-11
**Auditor:** opus-level deep audit
**Supersedes:** T1-27 antagonistic audit (2026-03-05)

---

## Summary

All 24 defects from the initial T1-27 antagonistic audit have been remediated. The component now meets WCAG 2.1 AA compliance, TypeScript strict mode, design token compliance, and full test/story coverage. This deep audit verified each remediation and added additional test coverage for close button interaction, body scroll lock, and non-modal backdrop behavior.

---

## Initial Audit Defect Resolution (D1–D24)

| ID | Severity | Status | Resolution |
|----|----------|--------|------------|
| D1 | P0 | FIXED | Focus restoration to trigger element on close (WCAG 2.4.3) — `_triggerElement` stored on open, `.focus()` called on close |
| D2 | P0 | FIXED | `WithCustomHeader` story now has `aria-label="Critical Alert"` |
| D3 | P1 | FIXED | Initial focus explicitly set via `_cachedFocusableElements[0]?.focus()` after `updateComplete` |
| D4 | P1 | FIXED | `document.body.style.overflow = 'hidden'` on modal open, restored on close |
| D5 | P1 | FIXED | Dialog element z-index set to `calc(var(--hx-z-index-modal, 100) + 1)` above backdrop |
| D6 | P1 | FIXED | Test added: "D6 — restores focus to trigger element when dialog closes" |
| D7 | P1 | FIXED | Test added: "D7 — sets initial focus on first focusable element when dialog opens" |
| D8 | P2 | FIXED | `description` property with `aria-describedby` and visually-hidden span implemented |
| D9 | P2 | FIXED | `variant` property (`'dialog' \| 'alertdialog'`) sets `role` on native `<dialog>` |
| D10 | P2 | FIXED | `ariaLabel` no longer shadows `ARIAMixin.ariaLabel`; uses `attributeChangedCallback` + `getAttribute` |
| D11 | P2 | FIXED | `close(returnValue?)` forwards to native `dialog.close()`, `returnValue` getter exposed |
| D12 | P2 | FIXED | Tests added for `variant="alertdialog"` role and default variant no-role |
| D13 | P2 | FIXED | Form submission test verifies dialog remains open after form submit |
| D14 | P2 | FIXED | Axe test added for custom header slot with `aria-label` (no heading) |
| D15 | P2 | FIXED | `AlertDialog` Storybook story with `variant="alertdialog"` and `description` |
| D16 | P2 | FIXED | `FormInsideDialog` Storybook story with patient referral form |
| D17 | P2 | FIXED | Built-in close button with `part="close-button"`, always rendered in header |
| D18 | P2 | FIXED | Browser support documented in component JSDoc `@remarks` |
| D19 | P2 | FIXED | Backdrop opacity behavior documented in `@cssprop` JSDoc |
| D20 | P2 | FIXED | Drupal integration pattern documented in component JSDoc |
| D21 | P3 | FIXED | Monotonic counter `_dialogCounter` replaces `Math.random()` |
| D22 | P3 | FIXED | Static `class="dialog"` replaces `classMap` directive |
| D23 | P3 | FIXED | Stories use `document.getElementById()` instead of fragile `closest()` traversal |
| D24 | P3 | FIXED | `TriggerButton` story documents built-in focus restoration behavior |

---

## Deep Audit Findings

### Design Token Compliance

**FIXED** — Close button `font-size` and `line-height` now use design tokens:
- `font-size: var(--hx-font-size-xl, 1.25rem)`
- `line-height: var(--hx-line-height-none, 1)`

All CSS values in `hx-dialog.styles.ts` now use `--hx-*` design tokens with appropriate fallbacks.

### Test Coverage Additions

Added 8 new tests in this deep audit:
- **Close Button**: click closes dialog, aria-label verification
- **Body Scroll Lock**: overflow hidden on open, restored on close
- **Non-Modal Backdrop**: renders for non-modal, absent for modal, click closes dialog

### TypeScript Strict Compliance

- Zero `any` types
- No `@ts-ignore` or non-null assertions
- `ARIAMixin.ariaLabel` not shadowed (uses `attributeChangedCallback` pattern)
- Strict union type for `variant: 'dialog' | 'alertdialog'`

### CEM Accuracy

Component JSDoc includes:
- All 3 slots (`default`, `header`, `footer`)
- All 3 events (`hx-open`, `hx-close`, `hx-cancel`)
- All 6 CSS parts (`dialog`, `backdrop`, `header`, `close-button`, `body`, `footer`)
- All CSS custom properties with defaults documented

### Export Verification

- `index.ts` exports `HelixDialog`
- Main barrel `src/index.ts` re-exports from `./components/hx-dialog/index.js`

### Storybook Coverage

12 stories covering all variants and states:
1. Default (closed)
2. ModalOpen (full modal with footer)
3. NonModal
4. NoBackdropClose
5. WithCustomHeader (aria-label, custom content)
6. WithFooter (three-button pattern)
7. TriggerButton (programmatic open/close)
8. EventFiring (hx-open/hx-close contract)
9. CSSCustomProperties (theming demo)
10. DangerConfirmation (healthcare scenario)
11. AlertDialog (role="alertdialog")
12. FormInsideDialog (patient referral form)

---

## Verdict

**SHIP-READY.** All 24 original defects resolved. Zero P0/P1/P2 issues remaining. Component meets WCAG 2.1 AA, TypeScript strict, design token compliance, and full test/story coverage.
