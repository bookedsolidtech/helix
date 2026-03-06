# hx-button Audit

Audited files: `hx-button.ts`, `hx-button.styles.ts`, `hx-button.test.ts`, `hx-button.stories.ts`

---

## TypeScript Compliance

- [P2] `_renderSpinner()` and `_renderInner()` private helpers lack explicit return type annotations. Should be typed as `TemplateResult<1>` (from `lit`) to satisfy strict mode and document intent.
- [P2] `target` and `href` are typed `string | undefined` rather than `string | undefined` via optional `?` (`target?: string`). Either form is valid TypeScript, but the inconsistency with `name`/`value` (same pattern) departs from idiomatic Lit property declarations and can confuse consumers reading the interface.
- [P2] Deprecated alias `export type WcButton = HelixButton` (line 253) has no `@since` or removal-target note. Tracking when this alias was introduced and when it will be removed is not documented.

---

## Accessibility

- [P1] **No `aria-label` passthrough to inner `<button>`.** The `IconOnly` story sets `aria-label="Close dialog"` on the `<hx-button>` host element. Because the accessible name is on the host (a generic element), it is NOT forwarded to the shadow-DOM `<button>`. Screen readers will announce an unlabelled button. The component must expose an `ariaLabel`/`label` property and forward it via `aria-label=${...}` on the inner `<button>` or `<a>` element, or adopt `ElementInternals.ariaLabel`.
- [P2] Loading state transitions have no screen reader announcement. When `loading` toggles to `true`, `aria-busy="true"` is set on the inner button, which suppresses announcements. However there is no `aria-live` region or status role notifying users that the operation is in progress. For async submission flows in healthcare UIs this is a meaningful gap.
- [P2] The inner native `<button>` is the correct ARIA role carrier. However, the host `<hx-button>` element itself has no `role` attribute and no ARIA reflection via `ElementInternals` (e.g., `internals.role = 'button'`). In browsers/AT combinations that flatten custom elements before shadow DOM, the host may be exposed as a generic container wrapping a button rather than as the button itself. Consider setting `internals.role = 'button'` so the host participates correctly in the AOM in all environments.

---

## Test Coverage Gaps

- [P1] **`name` + `value` + `setFormValue` not tested.** The `_handleClick` method calls `this._internals.setFormValue(this.value)` when `name !== undefined && value !== undefined`. No test exercises this code path; the branch is untested.
- [P1] **`form` getter only tested for `null`.** The `form` getter test verifies it returns `null` when not inside a form. There is no test confirming it returns the actual `HTMLFormElement` when the button IS inside one. This means the `ElementInternals.form` linkage is partially verified.
- [P2] **Anchor + `loading` combination not tested.** No test checks that an anchor-mode button (`href` set) with `loading=true` still suppresses the `hx-click` event and sets `aria-busy` on the `<a>`.
- [P2] **Anchor + disabled + loading combined state not tested.** The interaction of all three blocking conditions (`href`, `disabled`, `loading` simultaneously) is untested.
- [P2] **`target` without `_blank` missing explicit test.** There is a test that `rel` is NOT set when target is not `_blank`, but no test that `rel` is absent when `target` is set to a named frame (e.g., `"_self"` or a frame name). Current test only covers the no-target case.
- [P2] **Loading state interaction tests in Storybook but not in Vitest.** The `Loading` and `LoadingSubmissionFlow` Storybook play functions verify loading suppression visually, but there is no Vitest browser test for loading + `type="submit"` not triggering form submission.

---

## CSS Token Usage

- [P0] **Double opacity on disabled state.** `:host([disabled])` (line 8-11 of `hx-button.styles.ts`) sets `opacity: var(--hx-opacity-disabled, 0.5)` on the host element. `.button[disabled]` (line 133-136) sets the same opacity on the inner `<button>`. When `disabled` is true, both rules apply simultaneously, compounding to an effective opacity of `0.5 × 0.5 = 0.25`. This is a visual defect — the button appears far more faded than intended. One of the two opacity rules must be removed. The `:host([disabled])` + `pointer-events: none` rule is sufficient; the `.button[disabled]` opacity override is redundant and harmful.
- [P2] **Hover/active states use `filter: brightness()` rather than explicit token-driven colors.** The base `.button:hover { filter: brightness(0.9) }` and `.button:active { filter: brightness(0.8) }` rules apply globally. Several variants (secondary, tertiary, danger, ghost, outline) override `:hover` with a token-based `--hx-button-bg` change, but the base `filter` rule still applies on top of those, creating a double-darken on hover for those variants. Consumers cannot customise hover brightness via tokens; `--hx-filter-brightness-hover` and `--hx-filter-brightness-active` are undocumented in `@cssprop` JSDoc.
- [P2] **Hardcoded hex fallback values.** All `var(--hx-*, #hex)` fallbacks embed raw hex literals (e.g., `#2563eb`, `#0f172a`). If the upstream token file changes a primitive value, these hardcoded fallbacks will silently diverge. Fallbacks should reference a lower-level token or be sourced from a shared constants file, not inlined hex.

---

## Storybook / CEM Consistency

- [P1] **`argTypes` key `size` does not match the actual attribute `hx-size` or property `hxSize`.** The meta `argTypes` (line 25) registers the control as `size`, but the component property is `hxSize` (attribute `hx-size`). The render function manually bridges this (`hx-size=${args.size}`), masking the mismatch. CEM autodocs will generate docs from the actual property name (`hxSize` / `hx-size`), producing duplicate or conflicting entries. The argType key should be `hxSize` to align with CEM output.
- [P2] **`EmergencyAction` story bypasses the variant system** by using `style="--hx-button-bg: #dc2626"` on a `variant="primary"` button instead of `variant="danger"`. This documents an anti-pattern (raw hex override vs. semantic variant) as a first-class example. The story should use `variant="danger"` and customise via a `danger`-scoped token if a stronger red is required.
- [P2] **`IconOnly` story is inaccessible as written.** `aria-label="Close dialog"` on the host does not reach the inner `<button>` (see Accessibility section). The story as written would fail an axe scan if the icon SVG is `aria-hidden`, leaving the button with no accessible name. The story should either be removed until the passthrough is implemented, or should include a note explaining the limitation.

---

## Summary

| Severity | Count | Items |
|----------|-------|-------|
| P0 (Critical) | 1 | Double opacity on disabled — visible defect, effective opacity 0.25 |
| P1 (Major) | 4 | No `aria-label` passthrough; `name`/`value`/`setFormValue` untested; `form` getter only half-tested; `argTypes.size` vs `hx-size` CEM mismatch |
| P2 (Minor) | 9 | Return types on render helpers; `string \| undefined` style; deprecated alias; `aria-live`; `internals.role`; anchor+loading untested; combined disabled+loading untested; `filter` double-darken; hardcoded hex fallbacks; `EmergencyAction` anti-pattern; inaccessible `IconOnly` story |

**Total findings: 14** (1 P0, 4 P1, 9 P2)

### Recommended Fix Order

1. **P0 first**: Remove the `opacity` declaration from `.button[disabled]` — the `:host([disabled])` rule is sufficient.
2. **P1 accessibility**: Add `ariaLabel` property forwarded to inner element via `ElementInternals.ariaLabel` or explicit attribute binding.
3. **P1 tests**: Add Vitest tests for `setFormValue` path and `form` getter with an actual form element.
4. **P1 CEM**: Rename `argTypes.size` → `argTypes.hxSize` to align with the real property name.
