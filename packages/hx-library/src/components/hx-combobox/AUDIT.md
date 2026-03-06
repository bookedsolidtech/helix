# AUDIT: hx-combobox — Deep Component Audit v2

**Reviewer:** Deep audit v2 (automated)
**Branch:** `feature/deep-audit-v2-hx-combobox`

---

## Fixed in This Audit

### P0-1: Multiple selection unimplemented — FIXED (removed)

The `multiple` property was declared but entirely unimplemented. Rather than ship a broken feature, the property, its ARIA attributes (`aria-multiselectable`), and the misleading `Multiple` Storybook story have been removed. Multi-select should be implemented as a separate feature with proper chip rendering and multi-value form submission.

### P1-1: Home/End keyboard navigation — FIXED

Added `Home` and `End` key handlers to `_handleKeydown`. Home focuses the first enabled option; End focuses the last.

### P1-2: `aria-multiselectable` on `role="combobox"` — FIXED

Removed `aria-multiselectable` from both the input (where it was invalid per ARIA 1.2 spec) and the listbox (since `multiple` was removed).

### P1-3: Clear button not keyboard accessible — FIXED

Removed `tabindex="-1"` from the clear button. Native `<button>` elements are focusable by default, so the clear button is now in the tab order and keyboard accessible per WCAG 2.1 SC 2.1.1.

### P1-4: Cross-shadow-DOM ARIA references — FALSE POSITIVE

The original audit claimed `aria-controls` and `aria-activedescendant` break across shadow DOM boundaries. This is incorrect: both the input (with `aria-controls`) and the listbox (with `id`) are rendered in the **same** shadow root. Shadow-scoped IDs work correctly when referencing elements within the same shadow tree.

### P1-5: `role="alert"` + `aria-live="polite"` conflict — FIXED

Removed the conflicting `aria-live="polite"` from the error div. `role="alert"` implicitly sets `aria-live="assertive"`, which is the correct behavior for form validation errors. The explicit override was removed so the implicit semantics apply correctly.

### P1-6: `formStateRestoreCallback` wrong signature — FIXED

Updated signature from `(state: string)` to `(state: string | File | FormData, _mode: 'restore' | 'autocomplete')` per the WHATWG HTML spec. Added type guard to only restore string state.

### P1-7: `ComboboxOption` interface not exported — FIXED

Exported `ComboboxOption` interface from both `hx-combobox.ts` and `index.ts`. TypeScript consumers can now reference the option type.

### P1-8: No `aria-busy` for loading state — FIXED

Added `aria-busy="true"` on the combobox input when `loading` is true. Screen readers now announce the loading state per WCAG 2.1 SC 4.1.3.

### P2-6: `Math.random()` for ID generation — FIXED

Replaced `Math.random().toString(36).slice(2, 9)` with a module-level counter (`_comboboxCounter`). IDs are now deterministic and collision-free: `hx-combobox-1`, `hx-combobox-2`, etc.

### P2-13: Size union type not exported — FIXED

Exported `HxComboboxSize` type (`'sm' | 'md' | 'lg'`) from both `hx-combobox.ts` and `index.ts`.

### Test Coverage Gaps — FIXED

Added tests for:

- `hx-hide` event dispatch (P2-9)
- `ArrowUp` keyboard navigation (P2-11)
- `Home` key navigation to first option
- `End` key navigation to last option
- Disabled option skipping during keyboard navigation (P2-12)
- `aria-busy` presence/absence for loading state (P1-8)

---

## Remaining P2 Items (Documented, Not Fixed)

### P2-1: Storybook argTypes camelCase vs kebab-case

`helpText` and `filterDebounce` in argTypes use camelCase while HTML attributes are `help-text` and `filter-debounce`. Works via manual mapping in render but Storybook autodocs may show wrong property names.

### P2-2: `Multiple` story removed

Story was removed along with the `multiple` property. To be re-added when multi-select is properly implemented.

### P2-3: No story for prefix/suffix slots

`prefix` and `suffix` slots are documented and styled but have no demonstration story.

### P2-4: No story for empty-label slot

The `empty-label` slot has no dedicated story. Only visible when typing a non-matching string.

### P2-5: Async story is misleading

Shows `loading=true` with static options but no actual async behavior. Needs an `@input` handler to toggle loading.

### P2-7: `color-mix()` browser support

`color-mix()` requires Chrome 111+. Enterprise healthcare environments may run older browsers. No CSS fallback is provided for the focus ring.

### P2-8: Hardcoded hex fallbacks in CSS

Hex values like `#ffffff`, `#dc3545` serve as last-resort fallbacks. These bypass theming but are acceptable as final fallbacks when tokens are not loaded.

### P2-10: No test for filterDebounce

Timer-based debounce logic is untested. Requires `vi.useFakeTimers()` approach.

### P2-14: Listbox `position: absolute` may clip

Dropdown may be clipped by `overflow: hidden` parents. A portal or popover approach would be more robust.

### P2-15: Bundle size not verified

No per-component bundle analysis was run. The `tokenStyles` import may include the full token set.

### P2-16: No Drupal progressive enhancement pattern

No documented Twig template or `<select>` fallback strategy for Drupal.

---

## Summary

| Severity  | Original Count | Fixed  | Remaining |
| --------- | -------------- | ------ | --------- |
| P0        | 1              | 1      | 0         |
| P1        | 8              | 7      | 0         |
| P2        | 16             | 3      | 13        |
| **Total** | **25**         | **11** | **13**    |

**P1-4 reclassified as false positive** (same shadow root, IDs work correctly).

All P0 and P1 issues are resolved. Remaining P2 items are cosmetic, story coverage, or architectural improvements suitable for future work.
