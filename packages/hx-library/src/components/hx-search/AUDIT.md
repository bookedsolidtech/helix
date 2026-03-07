# AUDIT: hx-search — T2-31 Antagonistic Quality Review

**Auditor:** Antagonistic QA Agent
**Branch:** feature/audit-hx-search-t2-31-antagonistic
**Source branch audited:** rescue/abandoned-components (PR #175)
**Date:** 2026-03-05
**Files reviewed:**
- `hx-search.ts` (381 lines)
- `hx-search.styles.ts` (199 lines)
- `hx-search.test.ts` (353 lines)
- `hx-search.stories.ts` (776 lines)

---

## Summary

| Severity | Count |
|----------|-------|
| P0       | 1     |
| P1       | 4     |
| P2       | 7     |

---

## P0 — Critical (Must Fix Before Merge)

### P0-1: `aria-labelledby` self-reference overrides native label association

**File:** `hx-search.ts:347-348`

```ts
aria-label=${ifDefined(this.label ? undefined : 'Search')}
aria-labelledby=${ifDefined(this.label ? this._inputId : undefined)}
```

When `label` is provided, the code sets `aria-labelledby` to `this._inputId` — the **input element's own ID**. The label element uses `for="${this._inputId}"` to associate with the input. That native association is sufficient and correct within Shadow DOM.

The problem: `aria-labelledby` takes precedence over the native `<label for>` association in the ARIA accessibility tree. Because `this._inputId` is the **input's own ID**, `aria-labelledby` resolves to the input element itself. The accessible name for the input is then computed from the input element's own content — which yields the current `value` string (or empty string when blank), not the label text.

**Impact:** When a label is provided, the input's accessible name is either empty (when no value typed) or equals the search query (when text is present). Screen reader users hear the wrong accessible name or no name at all. Axe-core does not catch this because the referenced ID exists in the shadow root.

**Fix:** Remove `aria-labelledby` entirely. The `<label for="${_inputId}">` + `<input id="${_inputId}">` pairing within the same shadow root is the correct and sufficient mechanism. No `aria-labelledby` is needed when a visible label element is present.

---

## P1 — High (Required Before Merge)

### P1-1: Missing `role="search"` landmark on wrapper

**File:** `hx-search.ts:317-321`

```ts
<div
  part="field"
  class=${classMap(fieldClasses)}
  aria-busy=${this.loading ? 'true' : nothing}
>
```

The outer wrapper div has no `role="search"`. ARIA landmark roles allow screen reader users to navigate directly to the search region. A component named `hx-search` and used in healthcare applications for patient/medication lookup should expose a search landmark. The audit criteria explicitly requires this.

**Impact:** Assistive technology users cannot navigate to the search region using landmark navigation (e.g., screen reader shortcut keys for landmarks).

**Fix:** Add `role="search"` to the outer `<div part="field">`.

---

### P1-2: Escape key does not clear the input

**File:** `hx-search.ts:192-200`

```ts
private _handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._dispatchSearch();
  }
}
```

The `_handleKeydown` handler processes only `Enter`. Pressing `Escape` does nothing. The audit criteria explicitly requires "Escape clears". This is a standard keyboard UX pattern for search inputs (`type="search"` browsers natively clear on Escape, but `-webkit-appearance: none` suppresses the native cancel button and its associated browser behavior on some browsers).

**Impact:** Keyboard-only users and screen reader users cannot clear the search field using the Escape key. Fails WCAG 2.1 SC 2.1.1 (Keyboard) if the native browser clear via Escape is also suppressed.

**Fix:** Add `else if (e.key === 'Escape' && this.value) { this._handleClear(); }` to `_handleKeydown`.

---

### P1-3: `formStateRestoreCallback` signature is too narrow

**File:** `hx-search.ts:170-172`

```ts
formStateRestoreCallback(state: string): void {
  this.value = state;
}
```

The W3C ElementInternals specification signature is:
```ts
formStateRestoreCallback(
  state: File | string | FormData | null,
  mode: 'restore' | 'autocomplete'
): void
```

Using `string` alone is incorrect. At runtime the browser could call this with `null` (to restore to empty), `File`, or `FormData`. When called with `null`, `this.value = null` would assign a non-string to a `string` property, producing TypeScript runtime behavior inconsistency. TypeScript strict mode does not catch this because the signature is not checked against the ElementInternals spec interface.

**Impact:** Browser form state restoration (back/forward navigation) with a `null` state would set `this.value = null` instead of `''`, breaking the string property invariant and potentially rendering `null` as the input value.

**Fix:** Use the correct signature: `formStateRestoreCallback(state: File | string | FormData | null): void` and handle non-string states: `this.value = typeof state === 'string' ? state : '';`

---

### P1-4: No test coverage for Escape key behavior

**File:** `hx-search.test.ts`

Since Escape key behavior is a required feature per the audit criteria and is absent from the implementation (P1-2), there is also no corresponding test. Even if the feature were implemented, the test suite would not catch regressions.

**Missing test:** Pressing `Escape` when the input has a value should clear the value and dispatch `hx-clear`.

**Impact:** Any future implementation of Escape handling has no safety net.

---

## P2 — Medium (Should Fix)

### P2-1: Missing "with results count" Storybook story

**File:** `hx-search.stories.ts`

The audit criteria explicitly requires a story for "with results count." The `WithSuggestionsSlot` story (story #10) demonstrates rendered suggestions but not a results count indicator (e.g., "5 results found" `aria-live` region). No story shows the pattern for communicating result counts to users.

**Impact:** Consumers have no documented pattern for results count feedback, which is a core healthcare search UX requirement.

---

### P2-2: Hardcoded hex color fallbacks in CSS

**File:** `hx-search.styles.ts` — lines 9, 39, 48-50, 74, 109, 127, 141, 197, and others

Multiple CSS custom property declarations use raw hex values as inner fallbacks:

```css
color: var(--hx-input-label-color, var(--hx-color-neutral-700, #343a40));
background-color: var(--hx-search-bg, var(--hx-color-neutral-0, #ffffff));
```

CLAUDE.md: "No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always." Hardcoded hex fallbacks bypass the design token cascade. If primitive tokens are changed, these hardcoded values become inconsistent stale overrides.

**Impact:** Token cascade breaks if the primitive token (`--hx-color-neutral-0`) is removed; the component falls back to a static hardcoded color instead of failing gracefully in a detectable way.

---

### P2-3: `color-mix()` used without fallback for older browsers

**File:** `hx-search.styles.ts:59-66`

```css
box-shadow: 0 0 0 var(--hx-focus-ring-width, 2px)
  color-mix(
    in srgb,
    var(--hx-search-focus-ring-color, var(--hx-focus-ring-color, #2563eb))
      calc(var(--hx-focus-ring-opacity, 0.25) * 100%),
    transparent
  );
```

`color-mix()` has approximately 93% global browser support (2025). No `@supports` fallback is provided. On unsupported browsers, `box-shadow` will have no color (transparent), effectively removing the focus ring shadow entirely.

**Impact:** In older enterprise browsers (common in healthcare), focus indicators may be degraded. WCAG 2.1 SC 1.4.11 (Non-text Contrast) requires focus indicators to meet contrast ratios.

---

### P2-4: `--hx-opacity-disabled` undocumented in JSDoc

**File:** `hx-search.ts:9` (styles) / `hx-search.styles.ts:9`

```css
:host([disabled]) {
  opacity: var(--hx-opacity-disabled, 0.5);
```

The token `--hx-opacity-disabled` is consumed in CSS but is not listed in the `@cssprop` JSDoc block in `hx-search.ts`. The documented CSS custom properties are: `--hx-search-bg`, `--hx-search-border-color`, `--hx-search-border-radius`, `--hx-search-font-family`, `--hx-search-focus-ring-color`, `--hx-search-icon-color`, `--hx-search-clear-color`. The disabled opacity token is missing.

**Impact:** CEM generation will not include this token, consumers have no documented override path for the disabled opacity.

---

### P2-5: Non-null assertion on `@query` result

**File:** `hx-search.ts:109`

```ts
@query('.field__input')
private _input!: HTMLInputElement;
```

CLAUDE.md states "No non-null assertions." While `!` on `@query` decorated properties is a common Lit convention, the assertion is technically incorrect before `firstUpdated()`. The code guards against this with optional chaining (`this._input?.focus()`), but the type declaration lies — `_input` is typed as `HTMLInputElement` (non-nullable) when it can be `null` before first render.

**Impact:** Low — the optional chaining guards usage correctly. But the type contract is dishonest and violates the project's strict TypeScript policy.

---

### P2-6: No test for `formStateRestoreCallback`

**File:** `hx-search.test.ts`

`formResetCallback` is tested (line 244), but `formStateRestoreCallback` has no test coverage. Back/forward navigation state restoration is a form association feature that should be explicitly tested.

**Missing test:** Call `el.formStateRestoreCallback('restored-value')` and verify `el.value === 'restored-value'`.

---

### P2-7: `aria-busy` on unsemantic div

**File:** `hx-search.ts:320`

```ts
aria-busy=${this.loading ? 'true' : nothing}
```

`aria-busy` is applied to the outer `<div part="field">` which has no ARIA role. `aria-busy` is most meaningful on elements with landmark or widget roles (e.g., `role="region"`, `role="log"`, live regions). On a plain `div`, `aria-busy` provides no semantic benefit to assistive technology. If `role="search"` is added (P1-1 fix), `aria-busy` on that element would be more appropriate, though still not ideal since `role="search"` is a landmark, not a live region.

**Impact:** Screen readers do not announce loading state changes. Users are unaware when search results are being fetched.

**Recommended fix:** Add a visually hidden `<div role="status" aria-live="polite">` to communicate loading state to screen readers.

---

## Areas Passing Review

- **TypeScript:** No `any` types. Generic typing is clean. Lit decorator usage is correct. `ReturnType<typeof setTimeout>` for debounce timer is idiomatic.
- **Event typing:** All three events (`hx-input`, `hx-search`, `hx-clear`) have correct detail shapes documented and implemented. `bubbles: true, composed: true` set on all events.
- **Clear button:** Has `aria-label="Clear search"`, `type="button"` (prevents form submission), hidden when value is empty or component is disabled.
- **Search icon:** `aria-hidden="true"` on all three SVGs (search, spinner, clear). Correct.
- **Input `type="search"`:** Present and correct.
- **Native cancel button suppressed:** `-webkit-appearance: none` on input and `::webkit-search-cancel-button` pseudo-element. Component provides its own clear button.
- **`prefers-reduced-motion`:** Spinner animation is disabled when reduced motion is preferred.
- **Form association:** `static formAssociated = true`, `ElementInternals` properly attached, `setFormValue` called on update, `formResetCallback` implemented.
- **Debounce:** 300ms debounce on keystroke, timer cleared on Enter and disconnect. `disconnectedCallback` correctly clears the timer.
- **CSS parts:** All 7 documented parts (`field`, `label`, `input-wrapper`, `input`, `search-icon`, `clear-button`, `suggestions`) are present in the template.
- **`--hx-*` token prefix:** All component-level custom properties use `--hx-search-*` prefix consistently.
- **Size variants:** `sm`, `md`, `lg` implemented with CSS classes and distinct padding/font-size values.
- **Storybook coverage:** 20+ stories covering default, label, placeholder, value, disabled, loading, all sizes, all states, healthcare scenarios, event verification, clear button, debounce, Enter key, form data participation. Play functions are substantive interaction tests, not just render checks.
- **Drupal GET form compatibility:** `name` attribute passes through to native input, `type="search"` participates in form submission, `type="button"` on clear button prevents accidental form submit.
- **Bundle size:** Component complexity is appropriate. No heavy external dependencies beyond Lit and token imports. Estimated < 5KB min+gz.
- **Test count:** 35 tests across 12 describe blocks. Strong coverage for a component of this scope.
- **Axe-core tests:** 4 axe tests covering default, disabled, loading, and with-value states.
