# AUDIT: hx-spinner (T1-09) — Deep Audit Review

**Reviewed files:**

- `hx-spinner.ts`
- `hx-spinner.styles.ts`
- `hx-spinner.test.ts`
- `hx-spinner.stories.ts`
- `hx-spinner.twig`
- `index.ts`

**Bundle:** 4,351 bytes raw / 1,603 bytes gzip (within budget)
**Tests:** 37 passing (Vitest browser mode + axe-core)
**CEM:** Accurate — 4 properties, 3 CSS custom properties, 1 CSS part, 4 attributes
**Starlight docs:** Complete (`apps/docs/src/content/docs/component-library/hx-spinner.mdx`)

**Audit status: ALL ISSUES RESOLVED**

---

## P0 — Critical (previously blocked merge)

### P0-1: RESOLVED — Dual announcement removed

**Fix:** Removed `.spinner__sr-text` live region entirely. Component now uses `aria-label` only approach on the `role="status"` container. No duplicate AT announcements.

**Verified by:** Test "does not render .spinner\_\_sr-text (aria-label only approach)"

---

### P0-2: RESOLVED — Decorative mode added

**Fix:** Added `decorative` boolean property (reflected). When `true`, sets `role="presentation"` and removes `aria-label`, suppressing all AT announcements. Use when spinner appears alongside visible loading text.

**Verified by:** 5 tests in "Property: decorative" describe block + axe-core decorative mode test

---

## P1 — High (previously significant quality gaps)

### P1-1: RESOLVED — `--hx-duration-spinner` documented

**Fix:** Added `@cssprop [--hx-duration-spinner]` JSDoc tag to component class. Now appears in CEM output.

**Verified by:** CEM generation confirms 3 CSS custom properties including `--hx-duration-spinner`

---

### P1-2: RESOLVED — Reduced-motion fallback at full opacity

**Fix:** Changed reduced-motion `.spinner__arc` from `opacity: 0.6` to `opacity: 1`. Static arc is now clearly visible alongside the track ring, unambiguously communicating "in progress" without motion.

**Verified by:** CSS stylesheet inspection tests in "Reduced Motion" describe block

---

### P1-3: RESOLVED — `color-mix()` fallback added

**Fix:** Added `@supports (color: color-mix(...))` guard. Unsupported browsers fall back to `rgba(255, 255, 255, 0.3)` via `--hx-overlay-white-30` token. Inverted variant track is visible in all target browsers.

**Verified by:** Styles file review — `@supports` block at line 110

---

### P1-4: RESOLVED — Reduced-motion tests added

**Fix:** Added 2 tests verifying `prefers-reduced-motion` CSS rules exist in adopted stylesheets and target both `.spinner__svg` and `.spinner__arc` with `animation: none`.

**Verified by:** "Reduced Motion" describe block (2 tests passing)

---

### P1-5: RESOLVED — Label reactivity and WCAG guard tested

**Fix:** Added tests for: reactive `aria-label` updates when `label` property changes at runtime, empty string guard (no `aria-label=""` produced), and label attribute reflection.

**Verified by:** "Property: label" describe block — 6 tests including "updates aria-label reactively" and "does not set aria-label when label is empty string (WCAG guard)"

---

## P2 — Medium (previously tech debt / DX gaps)

### P2-1: RESOLVED — TypeScript union documented as intentional

**Fix:** Added JSDoc comment explaining that `'sm' | 'md' | 'lg' | string` intentionally degrades to `string` at the TypeScript level to allow CSS size values as a convenience override.

---

### P2-2: RESOLVED — `label` property now reflected

**Fix:** Added `reflect: true` to label property decorator. Now consistent with `size` and `variant`. Drupal Twig templates work correctly with both attribute-based and property-based setting.

---

### P2-3: RESOLVED — Hardcoded ellipsis removed

**Fix:** Removed `.spinner__sr-text` element entirely (part of P0-1 fix). No hardcoded `...` appended. Consumer controls label punctuation via the `label` property.

---

### P2-4: RESOLVED — Storybook `size` control changed to text

**Fix:** Changed `size` argType from `select` to `text` control. Users can now enter any CSS size value in the Storybook controls panel, testing custom sizes interactively.

---

### P2-5: RESOLVED — SVG dash math documented inline

**Fix:** Added CSS comment explaining the relationship between `r=10`, circumference (2pi x 10 = 62.83), `stroke-dasharray: 56` (~89% visible arc), and `stroke-dashoffset: 14` (gap aesthetic).

---

### P2-6: RESOLVED — Twig template and Drupal integration added

**Fix:** Created `hx-spinner.twig` template with usage examples, variable documentation, and Drupal `.libraries.yml` registration notes. Starlight docs include Drupal integration section with Twig template example and `Drupal.behaviors` pattern.

---

## Summary Matrix

| ID   | Area          | Severity | Status   | Description                                           |
| ---- | ------------- | -------- | -------- | ----------------------------------------------------- |
| P0-1 | Accessibility | P0       | RESOLVED | Dual announcement: removed sr-text, aria-label only   |
| P0-2 | Accessibility | P0       | RESOLVED | Decorative mode: `decorative` property added          |
| P1-1 | CEM/API       | P1       | RESOLVED | `--hx-duration-spinner` documented in JSDoc + CEM     |
| P1-2 | Accessibility | P1       | RESOLVED | Reduced-motion: full opacity static arc               |
| P1-3 | CSS           | P1       | RESOLVED | `color-mix()`: `@supports` guard + rgba fallback      |
| P1-4 | Tests         | P1       | RESOLVED | Reduced-motion CSS rules verified in stylesheet tests |
| P1-5 | Tests         | P1       | RESOLVED | Label reactivity + WCAG empty-string guard tested     |
| P2-1 | TypeScript    | P2       | RESOLVED | `size` union documented as intentional design choice  |
| P2-2 | Drupal/DX     | P2       | RESOLVED | `label` now reflected (`reflect: true`)               |
| P2-3 | DX            | P2       | RESOLVED | Hardcoded ellipsis removed with sr-text element       |
| P2-4 | Storybook     | P2       | RESOLVED | `size` control changed to `text` for custom sizes     |
| P2-5 | CSS           | P2       | RESOLVED | SVG dash math documented with inline CSS comments     |
| P2-6 | Drupal        | P2       | RESOLVED | Twig template + Drupal integration docs added         |

**All 13 issues resolved. Component passes all 7 quality gates.**
