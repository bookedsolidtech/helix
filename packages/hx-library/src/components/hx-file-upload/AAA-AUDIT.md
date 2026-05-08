# AAA Audit — HelixFileUpload

**Component:** `hx-file-upload`
**Certified:** 2026-05-08
**Auditor:** Jake Strawn
**WCAG Version:** 2.1
**Conformance Level:** AAA (component-shippable surface)

## SC-by-SC pass/fail

| SC | Title | Level | Method | Status | Evidence |
|---|---|---|---|---|---|
| 1.4.3 | Contrast (Minimum) | AA | axe-core | pass | Dropzone label text uses `--hx-color-text-primary` over `--hx-color-neutral-50` (≥7:1); error text uses `--hx-color-error-text` (≥4.5:1); progress text uses `--hx-color-text-secondary` (verified). |
| 1.4.6 | Contrast (Enhanced) | AAA | matrix harness | pass | All text samples ≥7:1 across 6 brands × 3 themes (18 contexts, 0 fail). Evidence: `.reports/aaa-matrix-evidence.hx-file-upload.md`. |
| 1.4.9 | Images of Text (No Exception) | AAA | structural review | pass | All UI text (dropzone instruction, file names, error messages, progress percentages) is real text. Upload icon is a CSS-painted glyph or SVG with `aria-hidden="true"` paired with a text label. |
| 1.4.11 | Non-text Contrast | AA | matrix harness focus-ring + token review | pass | Dropzone border `--hx-file-upload-dropzone-border-color` (≥3:1 vs surface); drag-active border switches to `--hx-color-primary-600` (≥3:1); focus ring 2px solid `--hx-focus-ring-color`. |
| 1.4.13 | Content on Hover or Focus | AA | manual review | pass | No hover-triggered persistent UI. File-list rendered statically beneath dropzone; remove buttons visible at all times (not hover-revealed). |
| 2.1.1 | Keyboard | A | `hx-file-upload.test.ts` keyboard suite | pass | Dropzone: `tabindex="0"` (`hx-file-upload.ts:691`); Enter/Space activates file picker via `_handleDropzoneKeyDown` (`hx-file-upload.ts:528-530`). Per-file remove buttons are native `<button>` elements with `aria-label` (line 621). |
| 2.1.3 | Keyboard (No Exception) | AAA | manual review + APG conformance | pass | Every interactive surface keyboard-driven: dropzone `role="button"` (Enter/Space → open file picker), per-file remove (Enter/Space — native button), drag-and-drop is a pointer convenience NOT a keyboard exception (clicking the dropzone opens the picker, equivalent to drag). No pointer-only paths. |
| 2.4.7 | Focus Visible | AA | VRT + matrix harness | pass | `.dropzone:focus-visible` paints a 2px solid ring with 2px offset (`hx-file-upload.styles.ts:61-65`). `.file-item__remove:focus-visible` paints matching ring (`hx-file-upload.styles.ts:178-182`). |
| 2.4.12 | Focus Not Obscured (Minimum) | AAA | matrix harness rect-in-viewport | pass | Focused dropzone rect inside viewport across all 18 contexts. Dropzone is a static block-level element, not absolutely positioned. |
| 2.4.13 | Focus Appearance | AAA | matrix harness focus-ring probe | pass | Detected ring on `.dropzone` per matrix harness ringSelectors (extended to include `.dropzone`). 2px solid outline with 2px offset = 4px+ ring area. Verified across all 18 contexts. |
| 2.5.5 | Target Size (Enhanced) | AAA | matrix harness | pass | Dropzone is full-width (1024px+ in default story) and has substantial vertical padding (≥48px). Native `<input type="file">` is visually-hidden 1×1 (canonical "real input + visible label" pattern); the dropzone IS the perceivable hit area. Carve-out documented in `scripts/aaa-matrix-verify.mjs:649-654`. Per-file remove buttons render at 44×44 default. |
| 3.2.5 | Change on Request | AAA | structural review | pass | Selecting files fires `hx-upload`; does NOT auto-submit. File picker opens only on user activation (click / Enter / Space on dropzone). |
| 3.3.6 | Error Prevention (All) | AAA | form-level concern | pass | Validation: `accept` (file types), `max-size`, `multiple`, `max-files` all exposed; invalid files rejected at parse time with `role="alert"` announcement (`hx-file-upload.ts:263, 724`). User can remove files before submit via per-file remove buttons. |
| 4.1.2 | Name, Role, Value | A | axe-core | pass | Dropzone: `role="button"` + `tabindex` + `aria-label`/`aria-labelledby` (`hx-file-upload.ts:690-697`); `aria-describedby` to error region when error present. Native `<input type="file">` hidden via `tabindex="-1"` (`hx-file-upload.ts:711`); the dropzone owns the accessible name. Error region: `role="alert"` (line 724). File list: `<ul aria-label>` (line 609). Per-file remove: native `<button aria-label="Remove ${file.name}">` (line 621). |

## Keyboard contract

`activate=Enter,Space; disabled-suppresses=true`

Full keyboard map per APG button §3.6:
- **Dropzone** (`role="button" tabindex="0"`):
  - Enter → open native file picker
  - Space → open native file picker
- **Per-file remove buttons** (native `<button>`):
  - Enter/Space → remove file from list
- **Disabled state**: `tabindex="-1"` on dropzone + native `disabled` on file input + remove buttons; suppresses all keyboard activation

Drag-and-drop is a POINTER convenience layered on top of the keyboard-equivalent click→file-picker path. The keyboard path (Enter/Space → file picker) is the canonical APG interaction; drag-and-drop is supplementary, NOT a keyboard exception.

Source: `hx-file-upload.ts:528-540, 690-700`.

## ARIA pattern

`button` — https://www.w3.org/WAI/ARIA/apg/patterns/button/

The dropzone implements APG button pattern via `role="button"` + `tabindex="0"` + Enter/Space keydown handler. The native `<input type="file">` is visually-hidden inside the same shadow root and is triggered programmatically by the dropzone's click handler. This is the canonical "real input + styled visible button" pattern recommended by W3C for accessible file uploads.

## Forced-colors mode

Snapshot path: `packages/hx-library/__screenshots__/forced-colors/hx-file-upload/*.png`
System-color-keyword assertions: ButtonText / ButtonFace / Highlight / HighlightText / CanvasText / Canvas.

`hx-file-upload.styles.ts:255-280` — forced-colors block: `.dropzone` border uses `ButtonText`; drag-active state switches to `Highlight`; focus ring switches to 2px solid `Highlight` with 2px offset; per-file remove button uses native button-text. Matrix harness verified non-zero geometry across 18 contexts.

## Notes / carve-outs

- **2.5.5 hidden-input pattern**: native `<input type="file">` is intentionally 1×1 (visually hidden) per the canonical "real input + styled visible button" pattern. The `.dropzone` provides the perceivable ≥44×44 hit area. Documented in `scripts/aaa-matrix-verify.mjs:649-654`.
- **Drag-and-drop is supplementary**: drag-and-drop UX is a layer ON TOP of the keyboard-equivalent click path. NOT an accessibility exception (per WCAG 2.1.1 — equivalent functional path provided).
- **mixinDelegatesAria()**: host uses `mixinDelegatesAria` to forward consumer-supplied `aria-label`/`aria-labelledby`/`aria-describedby` from the host attribute surface to the inner dropzone. This keeps the cross-shadow naming chain intact for AT.
