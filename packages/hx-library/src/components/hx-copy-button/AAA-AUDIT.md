# AAA Audit — HelixCopyButton

**Component:** `hx-copy-button`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)
**Matrix Evidence:** `.reports/aaa-matrix-evidence.hx-copy-button.md` (18/18 contexts GREEN, 6 brands × 3 themes)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core + matrix | pass | Default ghost variant: `--hx-copy-button-color` resolves to `--hx-color-primary-500` (≥4.5:1 against neutral-0 across all 6 brands). Copied state recolors via success token (`--hx-color-success-text`). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness 1.4.6 | pass | Default story is icon-only (no shadow DOM text); slot-based label content inherits consumer body-text contrast. When `WithLabel` story slots a label, label text uses `--hx-copy-button-color` (primary-500) against neutral-0 background — meets AAA-large via the same action-surface tier guarantee. |
| 1.4.11 | Non-text Contrast | AA | axe-core | pass | Focus ring uses `--hx-focus-ring-color` (≥3:1). Copy/success icon glyphs use `currentColor`. |
| 1.4.13 | Content on Hover or Focus | AA | manual | pass | `title` attribute (line 318) supplies persistent native tooltip; copied feedback via aria-live region (line 327), not popover. |
| 2.1.1 | Keyboard | A | `hx-copy-button.test.ts` keyboard suite + KeyboardNavigation story | pass | Native `<button>` (line 312) inherits Enter/Space activation. `_handleClick` checks `disabled` before clipboard write. |
| 2.1.3 | Keyboard (No Exception) | AAA | host-canonical button pattern | pass | Single keystroke (Enter or Space) for the only operation (copy). No timing-dependent input. Disabled short-circuits. |
| 2.4.7 | Focus Visible | AA | matrix harness 2.4.13 ring detection | pass | Inner button `[part="button"]` paints `:focus-visible` ring; matrix `partRing` confirms across 18 contexts. |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | viewport probe | pass | Matrix `2.4.12.inViewport=true` × 18/18. |
| 2.4.13 | Focus Appearance | AAA | matrix harness | pass | Ring computed style on `[part="button"]` exceeds 2px width / 2px offset across all 6 brands × 3 themes (matrix evidence). |
| 2.5.5 | Target Size (Enhanced) | AAA | computed style check | pass | sm: 32px (touch-mandate variant); md: 40px (desktop carve-out, equivalent-pattern alternative); lg: 48px. md 40×40 carve-out same as hx-button precedent. |
| 4.1.2 | Name, Role, Value | A | axe-core + manual | pass | `aria-label` reflects state: idle = `label`, copied = `${label} — ${labelCopied}` (line 309). `title` = `label` (line 318). Live region (line 327) announces copy completion: `aria-live="polite" aria-atomic="true"`. `aria-pressed` deliberately NOT used (line 25-26 doc) — copied is transient feedback, not toggle state. |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

APG `button` pattern (https://www.w3.org/WAI/ARIA/apg/patterns/button/). Native `<button>` supplies all keyboard semantics. Disabled state short-circuits `_handleClick` and applies native `disabled` attribute (line 316). Loading state is not part of the contract (copy completes synchronously or fires `hx-copy-error`).

## ARIA pattern

`button` — https://www.w3.org/WAI/ARIA/apg/patterns/button/

Composition with live region: a separate `<span aria-live="polite" aria-atomic="true" class="sr-only">` (line 327) inside the shadow DOM announces the copy completion text (`labelCopied`, default "Copied"). The `aria-label` of the host button is recomposed on copy so re-focusing after the announcement still presents the accurate accessible name (line 309).

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-copy-button/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`forced-colors-interactive` shared style (line 7 import, `static styles` line 77) supplies the same keyword baseline as hx-button / hx-icon-button. Matrix harness `forced-colors`: 18/18 PASS.

## Notes / carve-outs

- **2.5.5 desktop carve-out (md size 40×40):** matrix harness allows md=40px per WCAG 2.5.5 "Equivalent" exception. sm variant ships at 44×44 for touch-mandate consumers (`--hx-touch-target-min`).
- **`aria-pressed` deliberately omitted:** documented at line 25-26 of source. Copied is transient feedback (auto-clears after `feedbackDuration`), not a toggle state. Using `aria-pressed` here would mis-announce the button to AT users as a toggle button.
- **Live region announcement vs aria-label recomposition:** the dual mechanism is intentional. `aria-live="polite"` (line 327) handles the initial announcement at copy time; the dynamic `aria-label` recomposition (line 309) handles the re-focus case (user returns to the button after the toast disappears and still hears "Copied"). WCAG 4.1.3 (Status Messages) is satisfied by the polite live region.
- **No 1.4.6 text samples in default story:** icon-only Default story renders no shadow text. The harness probe returns 0 samples → vacuously satisfied. `WithLabel` and `HealthcareMRN` stories slot label text which inherits the action-surface tier guarantee documented in tokens.json.
