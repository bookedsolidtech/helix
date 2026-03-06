# AUDIT: hx-checkbox-group (T1-10) — Antagonistic Quality Review

**Date:** 2026-03-05
**Auditor:** qa-engineer-automation (automated deep review)
**Scope:** All files in `packages/hx-library/src/components/hx-checkbox-group/` (via PR #175 branch `rescue/abandoned-components`)
**Verdict:** BLOCKED — P0 and P1 defects require remediation before merge

> **Note:** PR #175 (`rescue/abandoned-components`) was open but not yet merged to `dev` at audit time. Files were reviewed directly from the PR branch. Findings apply to the current state of those files.

---

## Summary

`hx-checkbox-group` is a well-structured form-associated custom element that correctly uses `<fieldset>` + `<legend>` semantics, implements `ElementInternals`, and ships a comprehensive 40-test suite. The basic architecture is sound. However, one P0 accessibility defect (slotted error content is completely invisible to assistive technology), one P1 ARIA semantics conflict, and a fragile event-deduplication mechanism block merge. Several P2 issues reduce maintainability and edge-case correctness.

---

## P0 — Critical (Block Release)

### P0-01: Slotted error content is not reachable via `aria-describedby`

**File:** `hx-checkbox-group.ts`, lines 230–235 (render method, `describedBy` computation)

**Description:**
The `describedBy` binding on `<fieldset>` is computed as:

```ts
const describedBy =
  [this.error ? this._errorId : null, this._helpTextId].filter(Boolean).join(' ') || undefined;
```

This includes `this._errorId` only when `this.error` (the **property**) is truthy. When a consumer uses the `error` slot instead of the `error` property, `_hasErrorSlot` becomes `true` but `this.error` remains `''`. Consequently:

- The slotted error is visible in the DOM (slot content renders).
- `this._errorId` is **not** included in `describedBy`.
- The slotted content has no `id`, so there is no other way for AT to reach it.
- A screen reader user will hear no error description when tabbing to or from the group.

This mirrors the identical defect found in `hx-textarea` (P0-01, AUDIT 2026-03-05).

**Impact:** Screen readers cannot associate the error message with the group. Violates WCAG 2.1 SC 1.3.1 (Info and Relationships) and SC 4.1.3 (Status Messages). Direct risk in form-heavy clinical workflows.

**Fix direction:** When `_hasErrorSlot` is true, assign a stable `id` to the error slot's wrapper and include that ID in `describedBy`. Alternatively, always render the error container with `this._errorId` and slot content into it.

**Severity:** P0

---

## P1 — High (Block Release)

### P1-01: `role="alert"` combined with `aria-live="polite"` creates conflicting ARIA semantics

**File:** `hx-checkbox-group.ts`, lines ~250–258 (error div in render)

**Description:**
The error `<div>` is rendered with both `role="alert"` and `aria-live="polite"`:

```html
<div
  part="error-message"
  class="fieldset__error"
  id=${this._errorId}
  role="alert"
  aria-live="polite"
>
```

`role="alert"` implicitly sets `aria-live="assertive"` and `aria-atomic="true"`. Overriding `aria-live` to `"polite"` creates ambiguous semantics: some screen readers honour the explicit `aria-live="polite"` (softening the alert urgency) while others honour the role's implicit `assertive` value. The resulting behavior is inconsistent across NVDA, JAWS, and VoiceOver. For a healthcare error message, the correct urgency is either `role="alert"` alone or `aria-live="assertive"` without `role="alert"`.

**Impact:** Inconsistent screen reader announcement behavior in production. In some environments the error message may be read too late or out of turn; in others it may interrupt the user mid-sentence.

**Fix direction:** Remove `aria-live="polite"` and rely on `role="alert"` alone.

**Severity:** P1

---

### P1-02: `required` state is not programmatically determinable on the `<fieldset>`

**File:** `hx-checkbox-group.ts`, lines 223–229 (render, fieldset element); `hx-checkbox-group.styles.ts`, line 70 (`.fieldset__required-marker`)

**Description:**
The `required` property reflects to the host (`@property({ reflect: true })`), but the underlying `<fieldset>` element has no `aria-required` attribute. The required asterisk (`*`) is rendered as `aria-hidden="true"`, which is correct, but nothing communicates the required state programmatically to the fieldset or its legend. `<fieldset>` does not have a native `required` IDL attribute. AT users therefore cannot determine the field is required unless the legend text itself mentions it.

WCAG 2.1 SC 1.3.1 requires that required state be programmatically determinable. The standard pattern is `aria-required="true"` on the fieldset (which is valid per ARIA 1.2).

**Fix direction:** Add `aria-required=${this.required || nothing}` to the `<fieldset>` element.

**Severity:** P1

---

### P1-03: `_suppressNextChildChange` double-fire guard can silently swallow rapid legitimate events

**File:** `hx-checkbox-group.ts`, lines 152–164 (`_handleCheckboxChange`)

**Description:**
The guard uses a boolean flag reset via `Promise.resolve().then()` (a microtask):

```ts
if (this._suppressNextChildChange) {
  this._suppressNextChildChange = false;
  return;  // ← event silently dropped
}
this._suppressNextChildChange = true;
void Promise.resolve().then(() => {
  this._suppressNextChildChange = false;
});
```

The intent is to deduplicate a label-click → input-click double-fire. However, if a user clicks two different checkboxes in rapid succession within the same microtask queue flush, the second event is swallowed — no `hx-change` is dispatched and the form value is not updated. The problem is that `hx-checkbox` itself already stops label double-fire internally; the group-level guard may be addressing a now-fixed upstream behavior, or it may be reacting to a specific browser bug that needs a targeted test instead of a blanket suppression mechanism.

**Impact:** Under rapid multi-checkbox selection, the group's `hx-change` event count may be lower than the actual number of state changes, leading to stale form values.

**Fix direction:** Remove the `_suppressNextChildChange` mechanism entirely and verify via test whether `hx-checkbox` dispatches duplicate events. If it does, fix the upstream component; do not suppress in the parent.

**Severity:** P1

---

### P1-04: `aria-describedby` always includes `_helpTextId` even when the help slot is empty

**File:** `hx-checkbox-group.ts`, lines 230–235 (render, `describedBy` computation)

**Description:**
The `describedBy` value unconditionally includes `this._helpTextId`:

```ts
const describedBy =
  [this.error ? this._errorId : null, this._helpTextId].filter(Boolean).join(' ') || undefined;
```

The help-text `<div>` is always rendered (even when empty), so the `id` always exists. AT will always attempt to read `_helpTextId` when describing the fieldset. When no help content is provided, the referenced element is empty and screen readers may announce it as blank text or skip it unpredictably, adding noise to the reading experience.

**Fix direction:** Track whether the `help` slot has content (similar to `_hasErrorSlot`) and include `_helpTextId` in `describedBy` only when non-empty.

**Severity:** P1

---

## P2 — Medium (Should Fix Before Merge)

### P2-01: `Math.random()` for ID generation is non-deterministic

**File:** `hx-checkbox-group.ts`, line ~67

```ts
private _groupId = `hx-checkbox-group-${Math.random().toString(36).slice(2, 9)}`;
```

`Math.random()` produces different IDs on every instantiation. This breaks:
- SSR hydration (server and client IDs won't match)
- Snapshot testing (IDs change per test run, making golden files useless)
- Storybook's `--storybook-test` mode (non-deterministic DOM output)

**Fix direction:** Use a module-level monotonic counter: `let _uid = 0; private _groupId = \`hx-checkbox-group-\${++_uid}\``.

**Severity:** P2

---

### P2-02: `querySelectorAll('hx-checkbox')` traverses all descendants, not just direct slotted children

**File:** `hx-checkbox-group.ts`, line ~109 (`_getCheckboxes`)

```ts
private _getCheckboxes(): HelixCheckbox[] {
  return Array.from(this.querySelectorAll('hx-checkbox')) as HelixCheckbox[];
}
```

This query searches all light DOM descendants. If a consumer wraps some checkboxes in a `<div>` or another custom element, all nested `hx-checkbox` elements will still be found and have `disabled`/`name` synced and their values collected. This is likely unintentional for cases like:

```html
<hx-checkbox-group name="outer">
  <hx-checkbox value="a"></hx-checkbox>
  <some-widget>
    <hx-checkbox value="inner"></hx-checkbox>  <!-- unintentionally included -->
  </some-widget>
</hx-checkbox-group>
```

**Fix direction:** Use `Array.from(this.children).filter(c => c.tagName === 'HX-CHECKBOX')` for direct children only, or document that nested checkboxes are intentionally included.

**Severity:** P2

---

### P2-03: `:host([disabled])` uses `pointer-events: none` — prevents disabled cursor

**File:** `hx-checkbox-group.styles.ts`, lines 9–12

```css
:host([disabled]) {
  opacity: var(--hx-opacity-disabled);
  pointer-events: none;
}
```

`pointer-events: none` prevents the `not-allowed` cursor from displaying on hover over a disabled group. Users hovering over the area see the default cursor instead of a visual affordance that interaction is blocked. This is a minor UX issue but inconsistent with how `hx-checkbox` handles individual disabled states.

**Fix direction:** Use `cursor: not-allowed` on the host and handle `pointer-events: none` on child inputs/controls only, or remove `pointer-events: none` and rely on the individual checkbox's disabled handling.

**Severity:** P2

---

### P2-04: `_updateValidity()` anchor element is the items container, not a focusable control

**File:** `hx-checkbox-group.ts`, lines ~200–209

```ts
this._internals.setValidity(
  { valueMissing: true },
  this.error || 'Please select at least one option.',
  this._itemsEl ?? undefined,  // ← .fieldset__items div
);
```

The third argument to `setValidity()` is the "anchor" element used for the browser's native validation bubble position. Using a non-focusable `<div>` as the anchor may cause the bubble to appear in an unexpected location and is not keyboard-accessible. The anchor should be the first interactive child (i.e., the first `hx-checkbox`), or omitted to fall back to the host element.

**Severity:** P2

---

### P2-05: Missing test coverage for `formStateRestoreCallback`, `validationMessage`, and `validity` getters

**File:** `hx-checkbox-group.test.ts`

The following public API surface has no test coverage:

| API | Risk |
|-----|------|
| `formStateRestoreCallback(state: FormData)` | State restoration from back/forward navigation untested |
| `formStateRestoreCallback(state: string \| File)` | Non-FormData branches silently no-op — should have coverage |
| `validationMessage` getter | Delegates to `_internals.validationMessage`; never tested |
| `validity` getter | Delegates to `_internals.validity`; only indirectly tested |
| Pre-checked initial state | No test verifies that form value is set on first render when checkboxes have `checked` attribute |

**Severity:** P2

---

### P2-06: No test for `_suppressNextChildChange` guard behavior under rapid clicks

**File:** `hx-checkbox-group.test.ts`

The `_suppressNextChildChange` guard (see P1-03) has zero test coverage. The existing "stops propagation" test verifies that exactly one `hx-change` arrives for a single checkbox click but does not exercise the deduplication path or rapid multi-checkbox scenarios. If the guard is retained, it must have an explicit regression test.

**Severity:** P2

---

### P2-07: Storybook stories import component directly instead of via package entry point

**File:** `hx-checkbox-group.stories.ts`, line 1

```ts
import './hx-checkbox-group.js';
import '../hx-checkbox/hx-checkbox.js';
```

Production stories should import via the package entry (`@wc-2026/library`) to validate the public import path. Direct relative imports bypass the built distribution and can mask missing or broken exports. The `hx-textarea` stories (post-audit) use the package entry point as the correct pattern.

**Severity:** P2

---

### P2-08: No Drupal Twig usage example or documentation

**File:** Component directory (no `.twig` or docs file)

The feature description explicitly calls out "Drupal — form-associated, Twig-renderable with slotted checkboxes" as an audit area. There is no Twig usage example, no Drupal behavior snippet, and no comment in the component documenting how `name` propagation works in a Drupal form context. Other components in this library include a `@drupal` JSDoc tag or a sidebar in their Storybook stories. This is a documentation gap — not a runtime defect — but it increases integration risk for the primary consumer.

**Severity:** P2

---

## Checklist Summary

| Area | Gate | Status | Findings |
|------|------|--------|----------|
| TypeScript | Strict, no `any`, correct types | ✅ Pass | No `any`, strict mode clean |
| Accessibility | WCAG 2.1 AA, ARIA patterns | ❌ **FAIL** | P0-01, P1-01, P1-02, P1-04 |
| Tests | 80%+ coverage, all scenarios | ⚠️ Partial | P2-05, P2-06 — missing paths |
| Storybook | All variants, all controls | ✅ Pass | Extensive (1093 lines); P2-07 import pattern |
| CSS | `--hx-*` tokens, CSS parts | ✅ Pass | P2-03 cursor minor |
| Performance | < 5KB min+gz | ✅ Pass | ~347 LoC component + 80 LoC styles; within budget |
| Drupal | Form-associated, Twig-renderable | ⚠️ Partial | P2-08 — no Twig docs |

**Overall verdict: BLOCKED — resolve P0-01, P1-01, P1-02, P1-03 before requesting re-review.**
