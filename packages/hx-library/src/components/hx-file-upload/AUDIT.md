# AUDIT: hx-file-upload — Deep Review

**Auditor:** Deep Opus-Level Review
**Date:** 2026-03-11
**Status:** PASS — all P0 and P1 issues resolved

---

## Files Reviewed

- `hx-file-upload.ts` — Component implementation (591 lines)
- `hx-file-upload.styles.ts` — Lit CSS styles (237 lines)
- `hx-file-upload.test.ts` — Vitest browser tests (80 tests)
- `hx-file-upload.stories.ts` — Storybook stories (18 stories)
- `index.ts` — Barrel re-export
- `apps/docs/src/content/docs/component-library/hx-file-upload.mdx` — Starlight docs

---

## Quality Gate Results

| Gate | Check             | Status                                    |
| ---- | ----------------- | ----------------------------------------- |
| 1    | TypeScript strict | PASS — zero errors, no `any` types        |
| 2    | Test suite        | PASS — 80 tests covering all features     |
| 3    | Accessibility     | PASS — axe-core, ARIA roles, keyboard nav |
| 4    | Storybook         | PASS — 18 stories covering all variants   |
| 5    | CEM accuracy      | PASS — all exports match public API       |
| 6    | Bundle size       | PASS — component is well within budget    |
| 7    | Code review       | PASS — deep audit complete                |

---

## Findings & Resolutions

### P0 (Critical) — None

No critical issues found.

### P1 (High) — None

No high-priority issues found.

### P2 (Medium) — 3 found, 3 resolved

| #   | Finding                                                       | Resolution                                                |
| --- | ------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `error` CSS part missing from JSDoc `@csspart` annotations    | FIXED — added `@csspart error` to component JSDoc         |
| 2   | No test coverage for `error` CSS part                         | FIXED — added test verifying `[part="error"]` is exposed  |
| 3   | No test coverage for file size display formatting (B, KB, MB) | FIXED — added 3 tests covering all `_formatSize` branches |

### P3 (Low) — 3 found, 1 resolved, 2 acknowledged

| #   | Finding                                                                          | Resolution                                                                                                                        |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No tests for accept validation edge cases (case-insensitive, wildcard MIME)      | FIXED — added 3 tests for extension case, wildcard MIME, and rejection                                                            |
| 2   | `repeat` key function (`name + size`) can collide for same-name, same-size files | ACKNOWLEDGED — extremely unlikely in practice; changing to include index would break Lit's keyed DOM reuse benefit                |
| 3   | `_isAccepted` wildcard check uses `startsWith` without trailing `/` separator    | ACKNOWLEDGED — MIME types always contain `/` so `image` won't match non-image types; matching HTML spec `<input accept>` behavior |

---

## Test Coverage Summary

**80 tests across 14 describe blocks:**

| Category                     | Tests | Coverage                                                               |
| ---------------------------- | ----- | ---------------------------------------------------------------------- |
| Rendering                    | 5     | Shadow DOM, field, dropzone, label                                     |
| Properties                   | 14    | All 8 properties + attribute reflection                                |
| CSS Parts                    | 6     | dropzone, label, file-list, file-item, progress, error                 |
| Dropzone Behavior            | 5     | role, tabindex, aria-disabled                                          |
| File Processing              | 11    | Upload, remove, error events, maxFiles, single/multiple mode, disabled |
| Progress                     | 4     | setProgress update, clamping, out-of-range                             |
| Files Getter                 | 2     | Empty, populated                                                       |
| Form Integration             | 5     | formAssociated, form getter, reset callback                            |
| Form Validation API          | 4     | checkValidity, reportValidity, validity, validationMessage             |
| Error Display                | 6     | Render, role, aria-live, CSS class                                     |
| Keyboard Navigation          | 3     | Enter, Space, disabled                                                 |
| Slots                        | 2     | Default slot, file-list slot                                           |
| File Size Display            | 3     | B, KB, MB formatting                                                   |
| Accept Validation Edge Cases | 3     | Case-insensitive, wildcard, rejection                                  |
| Multiple File Validation     | 2     | Error message content                                                  |
| Accessibility (axe-core)     | 5     | Default, labeled, error, disabled, with files                          |

---

## Storybook Coverage

**18 stories across all component states:**

1. Default
2. WithLabel
3. AcceptImages
4. AcceptDocuments
5. MaxSize
6. Multiple
7. Disabled
8. WithError
9. CustomDropzoneSlot (Drupal context)
10. WithMaxFiles
11. HealthcareLabResults (full Drupal example)
12. AllStates (visual regression baseline)
13. CSSCustomProperties (all 5 custom properties)
14. CSSParts (external styling demo)
15. InAForm (form association with submit/reset)
16. NoLabel (aria-label only)
17. LongErrorMessage
18. MultipleWithSizeAndTypeConstraints

---

## Architecture Review

### Strengths

- **Form association via ElementInternals** — Proper `formAssociated`, `formResetCallback`, `setFormValue` with FormData for multi-file. First-class native form participation.
- **SSR-safe IDs** — Module-level counter avoids `Math.random()` hydration mismatch.
- **Comprehensive validation pipeline** — `_processFiles` handles accept, maxSize, maxFiles with granular error events for each failure type.
- **Design token compliance** — All colors, spacing, typography, border-radius, and transitions use `--hx-*` tokens with fallbacks. Zero hardcoded values in styles.
- **Shadow DOM encapsulation** — All styles scoped. 6 CSS parts exposed for external styling. 2 slots for content customization.
- **Accessibility** — `role="button"` dropzone, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-disabled`, `role="alert"` error, `role="progressbar"` with full ARIA value attributes, `aria-live="assertive"` drag-over announcement, per-file remove button labels.
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables transitions.
- **Drupal-ready** — Works in Twig templates. Events documented for `Drupal.behaviors` + `once()`.

### Design Decisions

- **Single-file mode replaces** — When `multiple` is false, new file replaces previous. This matches native `<input type="file">` behavior.
- **Progress is externally controlled** — `setProgress()` is a public method. The component does not perform uploads itself — it's a presentation layer.
- **No `required` validation** — The component doesn't implement required-field validation via ElementInternals. This is consistent with keeping validation external (via `error` prop).

---

## Documentation Review

The Starlight MDX page at `apps/docs/src/content/docs/component-library/hx-file-upload.mdx` is comprehensive:

- Properties table with all 8 properties
- Events table with detail types
- Slots table
- CSS Parts table (includes `error` part)
- Accessibility table with 12 topics
- Drupal integration with Twig template + Drupal behaviors
- Standalone HTML example with event listeners and progress simulation
- CEM-driven API reference
