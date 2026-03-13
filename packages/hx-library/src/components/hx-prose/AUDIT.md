# AUDIT: hx-prose — T4-77 Antagonistic Quality Review

**Component:** `hx-prose`
**Auditor:** Automated antagonistic review
**Audit Date:** 2026-03-05
**Files Reviewed:**

- `hx-prose.ts`
- `hx-prose.styles.ts`
- `hx-prose.test.ts`
- `hx-prose.stories.ts`
- `styles/prose/prose.scoped.css` (800 lines, inlined into `prose.scoped.css`)
- `styles/prose/prose.css` (unscoped barrel)
- `styles/prose/_body.css`, `_headings.css`, `_code.css`, `_lists.css`, `_tables.css`, `_media.css`, `_drupal.css`
- `index.ts`

---

## Summary

_Baseline counts as of audit date (2026-03-05). Findings marked ✅ FIXED have been resolved._

| Severity     | Baseline | Remaining |
| ------------ | -------- | --------- |
| P0 (Blocker) | 2        | 2         |
| P1 (High)    | 8        | 7         |
| P2 (Medium)  | 8        | 5         |

---

## P0 — Blockers

### P0-01: Stale `--wc-*` token namespace in unscoped CSS partials

**File:** `styles/prose/_media.css` (and potentially other unscoped partials not fully audited)
**Lines:** Throughout `_media.css`

`_media.css` uses `--wc-*` token prefixes throughout — `--wc-border-radius-sm`, `--wc-space-6`, `--wc-font-size-sm`, `--wc-line-height-normal`, `--wc-color-text-muted`, `--wc-color-neutral-*`. Every other prose CSS file (`prose.scoped.css`, `_headings.css`, `_body.css`, `_code.css`) uses `--hx-*` tokens. This is a namespace split: `_media.css` was never migrated from the old `wc-*` naming convention.

**Impact:** Any consumer importing `prose.css` (the unscoped barrel) gets `_media.css` with tokens that will never resolve unless the consumer also defines the old `--wc-*` variable set. Images, videos, iframes, figures, and responsive embeds will fall back to raw hardcoded values (`0.25rem`, `1.5rem`, `0.875rem`, `#6c757d`) rather than the design system tokens. In a healthcare context this means theming overrides (e.g., high-contrast mode via `--hx-color-neutral-*`) are silently ignored for all media elements when using the unscoped barrel import.

**Note:** `prose.scoped.css` (what the component actually uses) correctly uses `--hx-*` for all media selectors. The bug is in the unscoped barrel's source partials — the two files have diverged.

---

### P0-02: Test file imports nonexistent type `WcProse`

**File:** `hx-prose.test.ts`
**Line:** 4

```ts
import type { WcProse } from './hx-prose.js';
```

The component exports `HelixProse`, not `WcProse`. This import will produce a TypeScript error under strict mode (`'WcProse' is not exported from './hx-prose.js'`). The tests currently pass because the type is used only as a generic parameter to `fixture<WcProse>()`, and TypeScript may not enforce the import strictly in the test runner context — but it will fail `npm run type-check`. This is a broken type reference that violates the zero-TypeScript-errors gate.

---

## P1 — High Severity

### P1-01: Hardcoded `em` values not using design tokens — `code`, `kbd`, `samp`

**File:** `styles/prose/prose.scoped.css`
**Lines:** ~469, ~473, ~522–523, ~537, ~539

```css
/* inline code */
font-size: 0.875em; /* should be var(--hx-font-size-sm, 0.875em) */
padding: 0.125em var(--hx-space-1, 0.25rem); /* 0.125em is not tokenized */

/* kbd */
font-size: 0.875em; /* same issue */
padding: 0.125em var(--hx-space-2, 0.5rem); /* 0.125em is not tokenized */

/* samp */
font-size: 0.875em; /* same issue */
```

The project rule is "no hardcoded values — colors, spacing, typography use tokens always." The `0.875em` font-size has a token (`--hx-font-size-sm`) but is not using it. The `0.125em` padding value has no token and is hardcoded. A consumer cannot override the `code` font-size via `--hx-font-size-sm` because the CSS bypasses it.

---

### P1-02: `box-shadow` with raw `rgba()` on `kbd`

**File:** `styles/prose/prose.scoped.css`
**Line:** ~527

```css
hx-prose kbd {
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
}
```

Hardcoded raw `rgba()` color — no token. In high-contrast or dark mode themes this shadow will not adapt. Should use a shadow token (e.g., `var(--hx-shadow-inset-sm, inset 0 -1px 0 rgba(0, 0, 0, 0.25))`).

---

### P1-03: `p:first-child` lead paragraph selector is too aggressive for CMS output

**File:** `styles/prose/prose.scoped.css`
**Lines:** ~134–138

```css
hx-prose p:first-child,
hx-prose p.lead {
  font-size: var(--hx-prose-lead-font-size, var(--hx-font-size-lg, 1.125rem));
  color: var(--hx-prose-lead-color, var(--hx-color-neutral-600, #495057));
}
```

`p:first-child` will promote ANY first paragraph to lead styling, regardless of intent. CKEditor and Drupal WYSIWYG content almost always starts with a `p` element. A medication instruction page, a care plan, or a clinical protocol document will have its first paragraph rendered at `1.125rem` and in a muted color — whether or not the author intended it to be a lead. This is semantically incorrect and could cause readability issues in healthcare content where information density and uniform sizing are critical. There is no opt-out mechanism.

---

### ~~P1-04: `caption-side: bottom` — accessibility regression for data tables~~ ✅ FIXED

**File:** `styles/prose/prose.scoped.css`

Changed `caption-side: bottom` to `caption-side: top` (with explanatory comment) so caption DOM order matches visual order — resolves WCAG H39 AT/visual mismatch for sighted screen-reader users.

---

### P1-05: `white-space: nowrap` on `th` — mobile overflow risk

**File:** `styles/prose/prose.scoped.css`
**Line:** ~424

```css
hx-prose th {
  white-space: nowrap;
}
```

`white-space: nowrap` on all `th` elements prevents text wrapping. For mobile or narrow viewports, long column headers (common in clinical data tables — e.g., "Medication Name", "Dosage Frequency", "Prescribing Physician") will cause horizontal scrolling at the cell level or overflow the table container. The table already has responsive `overflow-x: auto` on mobile, but `nowrap` on headers makes the minimum table width determined by the longest header text rather than content. This is a healthcare readability concern.

---

### P1-06: Test line-height assertion is trivially weak — doesn't enforce the healthcare mandate

**File:** `hx-prose.test.ts`
**Line:** 131

```ts
expect(parseFloat(computed.lineHeight)).toBeGreaterThan(0);
```

The feature description explicitly states: "healthcare-appropriate spacing and readability (min 1.5 line-height for body copy)." This test checks `> 0` — any line-height including `1px` passes. The test should assert `toBeGreaterThanOrEqual(1.5)` to enforce the healthcare mandate. The requirement is documented but the gate is absent.

---

### P1-07: Missing test coverage for key content types

**File:** `hx-prose.test.ts`

The following test cases are absent:

- **`size="lg"` variant**: `size="sm"` is tested (line 40), `size="base"` is tested (line 34), but `size="lg"` is never tested. The `_applySize()` method has a specific branch for `lg` (`var(--hx-font-size-lg, 1.125rem)`) with no coverage.
- **`size` dynamic update via `updated()`**: Tests set `size` only at fixture creation time. No test verifies that changing `el.size = 'sm'` after render calls `_applySize()` and updates the CSS custom property.
- **Blockquote styles**: No computed style test for `blockquote` — margin, border-left, background, font-style.
- **Code block styles**: No computed style test for `pre` or `code` elements.
- **Image/figure rendering**: No test for `img` or `figure` within prose.
- **Empty `maxWidth` reset**: No test verifying that setting `maxWidth = ''` (or removing the attribute) clears the inline `style.maxWidth`.
- **Definition list styles**: `dl`, `dt`, `dd` elements — no test coverage.

---

### P1-08: No CSS parts declared — `::part()` theming unavailable

**File:** `hx-prose.ts`

`hx-prose` is a Light DOM component (no Shadow DOM). CSS parts (`::part()`) only work on Shadow DOM elements. The JSDoc comment (line 22–26) documents `@cssprop` entries but no `@csspart` entries. This is correct behavior for Light DOM. However, the component documentation and CEM should explicitly document that there are no CSS parts available (because Light DOM makes them unnecessary), and that theming happens via CSS custom properties on `hx-prose` or via standard CSS descendant selectors.

Currently the CEM will generate no parts, which is correct, but consumers expecting the pattern from other `hx-*` components (which use Shadow DOM) may be confused when `::part()` doesn't work.

---

## P2 — Medium Severity

### P2-01: `prose.css` unscoped barrel exposes global bare-element selectors as a published API

**File:** `styles/prose/prose.css`

The unscoped barrel imports all partials with bare element selectors (`h1`, `p`, `a`, `img`, `table`, etc.). This file is intended for legacy/global-scope use, but it is a footgun — any consumer who imports `prose.css` instead of `prose.scoped.css` will globally restyle every `p`, `a`, `h1`–`h6`, `table`, `img`, etc. on the page. There is no warning in the file header or `README` that this is dangerous. The comment says "for use as global rich text / WYSIWYG styles" which implies it is a supported use case, but without explicit scoping in the consumer stylesheet, this will cause widespread style leakage.

**Recommended action:** Add a prominent `@deprecated` warning or require that consumers wrap content in a selector when using `prose.css`.

---

### P2-02: Token prefix inconsistency in `prose.css` header comments

**File:** `styles/prose/prose.css`
**Lines:** 12–16

```css
/* Override prose custom properties at :root or on any ancestor:
  :root {
    --wc-prose-max-width: 720px;
    --wc-prose-font-size: var(--wc-font-size-md, 1rem);
```

The comment block uses `--wc-prose-*` (old namespace) while the actual CSS custom properties in `prose.scoped.css` and `hx-prose.ts` docs use `--hx-prose-*`. This is documentation rot — a consumer following the barrel file's own instructions will define the wrong variables.

---

### ~~P2-03: `align-left + *` / `align-right + *` sets `clear: none` — float not cleared~~ ✅ FIXED

**Fix:** Changed `clear: none` to `clear: both` in both `styles/prose/_drupal.css` and `styles/prose/prose.scoped.css`. Block-level content (headings, paragraphs) now starts below floated images rather than wrapping beside them. Updated comment explains the behavior and notes consumers can override with `clear: none` if wrap-around is intentional for their layout.

---

### P2-04: `_styles` private member — redundant underscore prefix convention

**File:** `hx-prose.ts`
**Line:** 38

```ts
private _styles = new AdoptedStylesheetsController(this, helixProseScopedCss, document);
```

TypeScript's `private` keyword already enforces access restriction. The underscore prefix (`_styles`) is a JavaScript convention for "pseudo-private" that predates `private`. Using both simultaneously is redundant and inconsistent — other components in the library should be checked for consistency. If the codebase convention is `private` (TypeScript), the underscore prefix should be dropped.

---

### P2-05: Deprecated HTML attribute selectors for table alignment

**File:** `styles/prose/prose.scoped.css`
**Lines:** ~446–454

```css
hx-prose th[align='center'],
hx-prose td[align='center'] {
  text-align: center;
}

hx-prose th[align='right'],
hx-prose td[align='right'] {
  text-align: right;
}
```

The `align` attribute on `th`/`td` is deprecated in HTML5. While CKEditor may still output it, these selectors normalize deprecated presentational HTML. This is intentional for backwards compatibility but should be documented as Drupal CKEditor compatibility shims — not general CSS practice. No `[align='left']` selector exists, which is an inconsistency (left alignment is the default, but the pattern should be complete or documented as intentional).

---

### P2-06: No base-level styles on `hx-prose` container in scoped CSS

**File:** `styles/prose/prose.scoped.css`

The scoped CSS has no rule targeting `hx-prose` itself for base font-family, color, or other inheritable properties. The container's `display: block` is set via inline style in `connectedCallback()` (JavaScript), not CSS. There is no `:host` equivalent for Light DOM. This means:

1. If `hx-prose` is placed inside a container with `font-family: serif`, all prose content inherits that font — the prose styles don't establish a font-family baseline on the wrapper itself.
2. The `display: block` is set via JavaScript (in `connectedCallback`), meaning there is a brief FOUC window where the element may render inline before the lifecycle fires.

A CSS rule like `hx-prose { display: block; font-family: var(--hx-font-family-sans, sans-serif); }` in the scoped stylesheet would make display declarative and predictable.

---

### ~~P2-07: Axe tests do not cover images without `alt` attribute~~ ✅ FIXED

**File:** `hx-prose.test.ts`

The accessibility test suite tests headings, tables, and lists with axe-core. There is no axe test for image content:

```html
<hx-prose>
  <img src="chart.png" />
  <!-- no alt — axe violation -->
  <img src="chart.png" alt="" />
  <!-- decorative — should be valid -->
</hx-prose>
```

The feature description notes: "images have alt." This is partially a consumer responsibility, but the test suite should include:

1. A test verifying that `img` without `alt` produces an axe violation (to confirm axe CAN detect this in Light DOM).
2. A test verifying that `img` with `alt=""` (decorative) passes.
3. A test verifying that `img` with descriptive `alt` text passes.

This is important because the audit area note says "axe may not scan slot content through Shadow DOM — verify test approach." Since `hx-prose` uses Light DOM, axe CAN scan children directly. The current tests confirm this works for headings/tables/lists but the image case is unverified.

---

### ~~P2-08: Storybook does not appear to have stories for all HTML element types~~ ✅ FIXED

**File:** `hx-prose.stories.ts`

The `AllContentTypes` story now covers all required HTML element types:

- Blockquote with `<cite>` — covered
- `<pre><code>` code blocks — covered
- `<kbd>`, `<samp>`, `<var>` elements — added `<samp>` and `<var>` to "Keyboard and Technical Text" section
- Definition lists (`<dl>`, `<dt>`, `<dd>`) — covered
- `<figure>` with `<figcaption>` — covered
- `<mark>`, `<del>`, `<ins>`, `<abbr title="">`, `<sub>`, `<sup>` — covered
- Tables with `<caption>`, `<tfoot>`, and `scope` attributes — added `<tfoot>` and `scope` on all `<th>` elements
- Drupal-specific markup classes — covered in `DrupalCKEditor` story

---

## Architectural Notes (Not Defects)

### Light DOM Design — Correct but Requires Consumer Discipline

`hx-prose` intentionally uses Light DOM (no Shadow DOM) via `createRenderRoot() { return this; }`. This is the right choice for a CMS content wrapper because:

- Axe-core can scan child content (Shadow DOM creates a boundary axe historically struggles with)
- Global heading hierarchy is preserved across page sections
- CMS-injected styles can still target content within the wrapper

However, the trade-off is that `hx-prose` styles WILL affect any matching descendant regardless of whether those descendants were placed by the consumer or injected by the Drupal CMS. There is no encapsulation. Consumers placing `hx-prose` inside other styled containers must be aware that prose styles bleed through to all descendants, not just CMS content.

This is documented implicitly via the `prose.scoped.css` approach but should be called out explicitly in docs.

### `AdoptedStylesheetsController` Cleanup

The `stylesheet is removed on disconnect` test (line 87–110) tests that the sheet count decreases by exactly 1 on `el.remove()`. This assumes the controller deregisters exactly one sheet. The test would fail (false pass) if: (a) multiple prose instances exist, (b) the controller does not properly deregister, or (c) the test cleanup runs before the assertion. The test logic is sound for single-instance scenarios but may be fragile in parallel test runs.
