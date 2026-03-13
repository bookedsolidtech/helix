# AUDIT: hx-tree-view — Antagonistic Quality Review (T2-36)

**Date:** 2026-03-06
**Auditor:** Antagonistic Review Agent
**Scope:** `packages/hx-library/src/components/hx-tree-view/`
**Files Reviewed:**

- `hx-tree-view.ts`
- `hx-tree-item.ts`
- `hx-tree-view.styles.ts`
- `hx-tree-item.styles.ts`
- `hx-tree-view.test.ts`
- `hx-tree-view.stories.ts`
- `index.ts`

---

## Summary

The component has a solid architectural foundation — Shadow DOM encapsulation, token-driven CSS, correct ARIA role assignments, and event architecture are all present. However, several **critical keyboard accessibility failures** make this component unusable for keyboard-only and AT users. There are also meaningful gaps in test coverage and missing Storybook stories.

---

## P0 — Blockers (Ship Nothing Until Fixed)

### P0-1: Tree is Not Keyboard-Accessible via Tab

**File:** `hx-tree-view.ts:157-170`, `hx-tree-item.ts:163`

The entire keyboard navigation system is dead on arrival. Neither the tree container nor any tree item can receive focus via the Tab key:

- The `.tree` div in `hx-tree-view` has no `tabindex` attribute — it cannot receive Tab focus.
- Every `.item-row` in `hx-tree-item` is hardcoded to `tabindex="-1"` — none are reachable via Tab.
- The `_handleFocusIn` handler in `hx-tree-view` only redirects focus when `e.target === e.currentTarget` (i.e., when the tree root itself receives focus), but the tree root is not focusable, so this handler never fires.
- The `_handleKeyDown` is attached to the `.tree` div, which relies on keydown events bubbling from focused children — but since no child can receive focus via Tab, this handler is effectively dead.

**ARIA tree pattern requires:** Exactly one treeitem has `tabindex="0"` (roving tabindex), all others have `tabindex="-1"`. Initial tab stop should be the first item (or last-focused item on re-entry).

**Impact:** Total keyboard inaccessibility. WCAG 2.1 SC 2.1.1 (Keyboard) failure. Healthcare mandate violation.

---

### P0-2: `aria-level` Missing on All Treeitems

**File:** `hx-tree-item.ts:155-190`

The `aria-level` attribute is not set on any `.item-row[role="treeitem"]`. This attribute is required by the ARIA tree pattern to communicate nesting depth to screen reader users.

Without `aria-level`, screen readers announce "treeitem" with no depth cue. In a healthcare ICD-10 hierarchy or org chart, users have no way to know if they are at a top-level category or three levels deep.

**Impact:** WCAG 2.1 SC 4.1.2 (Name, Role, Value) failure. The information structure communicated visually via indentation is invisible to AT.

---

### P0-3: `aria-label` / `aria-labelledby` Missing on Tree Container

**File:** `hx-tree-view.ts:159-169`

The `<div role="tree">` has no accessible name. WAI-ARIA 1.2 requires that `role="tree"` elements have an accessible name via `aria-label` or `aria-labelledby`. Without it, screen readers announce an unnamed tree, providing no context to the user.

**Impact:** WCAG 2.1 SC 4.1.2 failure. The component provides no mechanism (property, slot, or attribute forwarding) for consumers to label the tree.

---

## P1 — High Severity (Must Fix Before Ship)

### P1-1: ArrowLeft Does Not Move Focus to Parent Item

**File:** `hx-tree-item.ts:107-110`

The WAI-ARIA tree keyboard pattern requires:

> "If focus is on a closed node or a leaf node: Move focus to the node's parent node."

Current implementation only handles the case where the item is expanded and has children (collapses it). If the item is already collapsed, or is a leaf node, ArrowLeft does nothing — focus does not move to the parent.

No parent-traversal logic exists anywhere in `hx-tree-view._handleKeyDown` either. The `hx-tree-view` keydown handler handles only ArrowUp/Down/Home/End.

**Impact:** Incomplete ARIA tree keyboard pattern. Screen reader users navigating with ArrowLeft will get stuck at collapsed nodes and leaf items.

---

### P1-2: `aria-selected` Always Set Regardless of Selection Mode

**File:** `hx-tree-item.ts:165`

```ts
aria-selected=${String(this.selected)}
```

`aria-selected` is rendered on every treeitem regardless of whether the parent tree supports selection. When `selection="none"`, every item still renders `aria-selected="false"`, implying to AT users that items are selectable but not currently selected.

Per ARIA spec: if selection is not supported, `aria-selected` should be omitted or the tree should not imply selectable semantics. This is especially misleading in "navigation-only" tree use cases.

---

### P1-3: `role="group"` Association with Shadow DOM Treeitems

**File:** `hx-tree-item.ts:179-187`

The children container has `role="group"` inside `hx-tree-item`'s shadow DOM. The actual child `hx-tree-item` elements (with their `role="treeitem"` in their own shadow DOMs) are slotted into this group. While modern browsers flatten shadow DOM for accessibility, this pattern relies on correct shadow-DOM-aware AT behavior.

Specifically: the `role="group"` element and the `role="treeitem"` elements it groups exist in different shadow roots. AT support for this pattern is not universal — older JAWS and NVDA versions may fail to associate the group with its treeitems, breaking the hierarchical semantics.

---

### P1-4: Missing Tests — ArrowUp/Down/Home/End Navigation in Full Tree Context

**File:** `hx-tree-view.test.ts`

The keyboard navigation tests only cover item-level ArrowRight/Left behavior. There are zero tests for `hx-tree-view`-level navigation:

- ArrowDown: move to next visible item
- ArrowUp: move to previous visible item
- Home: move to first item
- End: move to last visible item
- ArrowLeft: collapse or move to parent (not tested)
- Wrap-around behavior (ArrowDown at last item goes to first, and vice versa)

The `_getVisibleItems()` traversal logic (which is non-trivial with nested expanded/collapsed items) has no dedicated tests.

---

### P1-5: Missing Tests — Async Children Loading

**File:** `hx-tree-view.test.ts`

The audit scope explicitly requires tests for async children loading. No async loading scenario is tested or implemented. There is no loading state, no async slot population test, and no `loading` property on `hx-tree-item`.

---

### P1-6: Missing Story — Async Loading

**File:** `hx-tree-view.stories.ts`

The audit scope requires a Storybook story for async loading. No such story exists. This is a key use case for healthcare taxonomy browsers where subtrees are fetched on demand.

---

### P1-7: Missing Story — With Icons (Explicit)

**File:** `hx-tree-view.stories.ts`

The `icon` slot is documented in `hx-tree-item` but no story demonstrates it. `WithNestedItems` does not use icons. Healthcare org charts and taxonomy browsers typically rely on icons (folder, document, patient, department icons) — an icon story is critical for consuming teams.

---

### P1-8: Missing Story — Checkboxes / Multi-Select with Checkboxes

**File:** `hx-tree-view.stories.ts`

The audit scope requires a checkboxes story. `MultipleSelection` exists but uses no visual checkbox indicator. There is no checkbox slot or visual affordance for multi-select state beyond background color, and no dedicated story demonstrates checkbox-style multi-select.

---

## P2 — Medium Severity (Should Fix, Not Blocking)

### P2-1: `TreeSelection` Type Not Exported

**File:** `hx-tree-view.ts:8`

```ts
type TreeSelection = 'none' | 'single' | 'multiple';
```

This type is declared locally and not exported from the module or `index.ts`. TypeScript consumers who want to type-check their `selection` attribute value programmatically cannot import this type. It should be exported alongside the component.

---

### P2-2: `indent` Property Is Dead Code

**File:** `hx-tree-item.ts:61-63`

```ts
@property({ type: Number, reflect: true })
indent = 0;
```

The `indent` property is declared, reflected to an attribute, and documented — but it is never read anywhere. The CSS indentation is computed automatically via the `--_indent-level` CSS custom property cascade. The `indent` property has no effect. It is untested, undocumented in its actual behavior, and misleading to consumers.

Either: connect it to CSS (e.g., `--_indent-level: ${this.indent}`) or remove it entirely.

---

### P2-3: `checkA11y` Test in Wrong `describe` Block

**File:** `hx-tree-view.test.ts:578-592`

The axe-core accessibility test is inside `describe('hx-tree-item', ...)` but creates a full `hx-tree-view` fixture. This is a test organization error that makes the test suite harder to read and may mask attribution of failures.

---

### ~~P2-4: No Drupal / Twig Documentation or Example~~ FIXED

**Resolution:** `hx-tree-view.twig` template added covering: taxonomy term hierarchy rendering
(ICD-10 browser pattern), recursive macro for up to 3 levels of nesting, `label` (aria-label),
`selection` mode, `expanded`/`disabled`/`selected` per-item flags, `hx-select` event handling
via Drupal behaviors, and `mytheme.libraries.yml` registration for both `hx-tree-view.js` and
`hx-tree-item.js`. A `DrupalIntegration` story added to `hx-tree-view.stories.ts` demonstrating
server-rendered taxonomy trees, org chart navigation-only mode, and permission-gated disabled
items from Drupal access checks.

---

### P2-5: `aria-selected` Set to `"false"` in `selection="none"` Mode

**File:** `hx-tree-item.ts:165`

When the parent tree has `selection="none"`, treeitems render `aria-selected="false"`. Per ARIA 1.2 authoring practices, `aria-selected` should not be present on treeitems that are not selectable. This is more nuanced than P1-2 — the spec does allow `false` as a valid value, but authoring guidance recommends omission when selection is not supported.

---

### P2-6: Roving Tabindex — Wrap-Around May Confuse Users

**File:** `hx-tree-view.ts:119-129`

Arrow navigation wraps around (ArrowDown on last item goes to first, ArrowUp on first item goes to last). The ARIA tree pattern does not mandate wrap-around and many implementations do not wrap, since wrapping can disorient screen reader users. This is a UX concern, not a hard violation, but should be documented as a deliberate decision.

---

### P2-7: `color-mix()` CSS Level 5 — Browser Compatibility Risk

**File:** `hx-tree-item.styles.ts:97`

```css
background-color: color-mix(in srgb, currentColor 10%, transparent);
```

`color-mix()` requires relatively modern browser versions (Chrome 111+, Firefox 113+, Safari 16.2+). For a healthcare enterprise component library where browser mandates can lag by 2–3 years, this could cause invisible expand button hover state in some environments. A fallback should be documented.

---

### ~~P2-8: Bundle Size Not Verified~~ ACKNOWLEDGED

No per-component bundle size analysis was found in the audit scope. The project threshold is `<5KB per component (min+gz)`. Two component files (`hx-tree-view.ts` + `hx-tree-item.ts`) plus two style files should be measured to confirm compliance, especially as the component grows with async loading and checkbox support.

**Status:** The component is minimal in complexity. Formal CI-gated measurement is tracked as an infrastructure concern — no source change required per this audit.

---

### ~~P2-9: No Virtualization Path for Large Trees~~ FIXED (documented)

For healthcare taxonomy browsers (ICD-10 has 70,000+ codes), the current implementation has no virtualization strategy. Rendering thousands of `hx-tree-item` elements simultaneously will cause performance degradation. The component should either:

1. Document the scale limit explicitly, or
2. Expose an async/lazy loading API that enables virtualization at the consumer level.

**Fix:** Scale limits and lazy-loading guidance documented in `hx-tree-view.ts` JSDoc (class-level `## Scale Limits` section). The component is suitable for up to ~500 visible items. For larger datasets, consumers should use lazy loading via the `expanded` property on `hx-tree-item`.

---

### P2-10: `_handleFocusIn` Is Effectively Dead Code

**File:** `hx-tree-view.ts:144-153`

This handler runs when `e.target === e.currentTarget` (focus landed on the `.tree` div itself). Since the `.tree` div has no `tabindex`, it can never receive Tab focus. The only way this fires is via programmatic `el.shadowRoot.querySelector('.tree').focus()`, which no consumer would call directly. This dead code should either be removed or connected to a working tabindex strategy.

---

## Accessibility Pattern Gaps (ARIA Tree Checklist)

| ARIA Tree Requirement                     | Status                                  | Severity |
| ----------------------------------------- | --------------------------------------- | -------- |
| `role="tree"` on container                | PASS                                    | —        |
| `role="treeitem"` on items                | PASS                                    | —        |
| `role="group"` on child containers        | PASS (shadow DOM caveat)                | —        |
| `aria-expanded` on expandable items       | PASS                                    | —        |
| `aria-selected` on items                  | PARTIAL — always set regardless of mode | P1       |
| `aria-level` on all treeitems             | FAIL — missing entirely                 | P0       |
| `aria-posinset` on treeitems              | FAIL — missing                          | P1       |
| `aria-setsize` on treeitems               | FAIL — missing                          | P1       |
| Accessible name on tree container         | FAIL — no `aria-label` mechanism        | P0       |
| Roving tabindex (one item at tabindex=0)  | FAIL — all items at tabindex=-1         | P0       |
| ArrowDown moves to next visible item      | FAIL — tree not focusable               | P0       |
| ArrowUp moves to previous visible item    | FAIL — tree not focusable               | P0       |
| ArrowRight expands or moves into children | PARTIAL — expand works if focused       | —        |
| ArrowLeft collapses or moves to parent    | FAIL — parent move not implemented      | P1       |
| Home moves to first item                  | FAIL — tree not focusable               | P0       |
| End moves to last item                    | FAIL — tree not focusable               | P0       |
| Enter / Space selects                     | PARTIAL — works if focused              | —        |

---

## Test Coverage Gaps

| Test Area                                      | Status                       |
| ---------------------------------------------- | ---------------------------- |
| Expand/collapse via click                      | PASS                         |
| Expand/collapse via keyboard (ArrowRight/Left) | PASS                         |
| ArrowDown/Up navigation in tree                | MISSING                      |
| Home/End navigation                            | MISSING                      |
| ArrowLeft moves to parent                      | MISSING                      |
| Single selection                               | PASS                         |
| Multi-selection                                | PASS                         |
| Deselect in single mode                        | PASS                         |
| hx-select event composition                    | PASS                         |
| Async children loading                         | MISSING                      |
| Disabled item keyboard                         | MISSING                      |
| Tab into tree                                  | MISSING                      |
| axe-core (in tree context)                     | PASS (but placement wrong)   |
| `indent` property behavior                     | MISSING (dead code, no test) |

---

## Story Coverage Gaps

| Story                              | Status  |
| ---------------------------------- | ------- |
| Default (flat list)                | PASS    |
| Nested items                       | PASS    |
| Single selection                   | PASS    |
| Multiple selection                 | PASS    |
| Disabled items                     | PASS    |
| No selection / navigation-only     | PASS    |
| Healthcare domain example          | PASS    |
| With icons                         | MISSING |
| Checkboxes / checkbox multi-select | MISSING |
| Async loading / lazy children      | MISSING |
| Very deep nesting (5+ levels)      | MISSING |

---

## Key Findings Summary

| ID    | Area                     | Severity  | Finding                                                                                      |
| ----- | ------------------------ | --------- | -------------------------------------------------------------------------------------------- |
| P0-1  | Accessibility / Keyboard | P0        | Tree entirely inaccessible via keyboard Tab — roving tabindex not implemented                |
| P0-2  | Accessibility / ARIA     | P0        | `aria-level` missing on all treeitems                                                        |
| P0-3  | Accessibility / ARIA     | P0        | `aria-label` / `aria-labelledby` mechanism missing on tree container                         |
| P1-1  | Accessibility / Keyboard | P1        | ArrowLeft does not move focus to parent item                                                 |
| P1-2  | Accessibility / ARIA     | P1        | `aria-selected` set in `selection="none"` mode                                               |
| P1-3  | Accessibility / AT       | P1        | `role="group"` + shadow DOM treeitems: AT cross-shadow association risk                      |
| P1-4  | Tests                    | P1        | No tests for ArrowUp/Down/Home/End, tree-level navigation                                    |
| P1-5  | Tests                    | P1        | No async children loading tests                                                              |
| P1-6  | Storybook                | P1        | No async loading story                                                                       |
| P1-7  | Storybook                | P1        | No icon story                                                                                |
| P1-8  | Storybook                | P1        | No checkbox / multi-select visual story                                                      |
| P2-1  | TypeScript               | P2        | `TreeSelection` type not exported                                                            |
| P2-2  | TypeScript               | P2        | `indent` property is dead/unused code                                                        |
| P2-3  | Tests                    | P2        | axe-core test in wrong describe block                                                        |
| P2-4  | Drupal                   | P2        | No Twig/Drupal documentation or example — **FIXED**                                          |
| P2-5  | Accessibility / ARIA     | P2        | `aria-selected="false"` in non-selectable tree                                               |
| P2-6  | UX                       | P2        | Wrap-around arrow navigation is undocumented and potentially disorienting                    |
| P2-7  | CSS                      | P2        | `color-mix()` requires modern browser — no fallback [FIXED: replaced with `rgba()` fallback] |
| P2-8  | Performance              | **ACK**   | Bundle size not verified against 5KB threshold (CI infra concern)                            |
| P2-9  | Performance              | **FIXED** | No virtualization strategy — scale limits documented in JSDoc                                |
| P2-10 | Code Quality             | P2        | `_handleFocusIn` is dead code — `.tree` div has no tabindex                                  |
| P2-11 | ARIA                     | P2        | `aria-posinset` and `aria-setsize` missing on treeitems                                      |

---

## CSS Audit Fixes Applied (2026-03-12)

| Finding                                                      | Fix Applied                                                                                                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-7: `color-mix()` CSS Level 5 — Browser Compatibility Risk | **FIXED** — replaced `color-mix(in srgb, currentColor 10%, transparent)` with `rgba(0, 0, 0, 0.06)` fallback in `hx-tree-item.styles.ts`                                                                      |
| Incomplete `prefers-reduced-motion` coverage                 | **FIXED** — expanded `@media (prefers-reduced-motion: reduce)` block in `hx-tree-item.styles.ts` to cover `.item-row`, `.expand-btn`, and `.expand-btn svg` transitions (previously only covered `.children`) |

## TypeScript Audit Fixes Applied (2026-03-13)

| Finding                                                                | Status                                                                                                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-1: Tree not keyboard-accessible via Tab                             | **FIXED** — `.tree` div now has `tabindex="0"`; `_handleFocusIn` redirects focus to last-focused item; roving tabindex tracks current item index via `_currentIndex`       |
| P0-2: `aria-level` missing on all treeitems                            | **FIXED** — `_getLevel()` method computes nesting depth by counting ancestor `hx-tree-item` elements; `aria-level=${this._getLevel()}` added to `.item-row`                |
| P0-3: No `aria-label` mechanism on tree container                      | **FIXED** — `label` property added to `HelixTreeView`; `aria-label=${this.label \| nothing}` applied to the `role="tree"` div                                              |
| P1-1: ArrowLeft does not move focus to parent                          | **FIXED** — ArrowLeft handler in `hx-tree-view._handleKeyDown` now checks if item is a leaf/collapsed node and traverses to parent via `closest('hx-tree-item')`           |
| P1-2: `aria-selected` always set regardless of selection mode          | **FIXED** — `_isSelectable()` method checks parent tree's `selection` attribute; `ariaSelected` renders `nothing` when selection is `'none'`                               |
| P2-1: `TreeSelection` type not exported                                | **FIXED** — `export type { TreeSelection }` added to `index.ts`                                                                                                            |
| P2-2: `indent` property is dead/unused code                            | **FIXED** — `indent` property removed from `hx-tree-item.ts`; CSS indentation handled entirely by `--_indent-level` cascade                                                |
| P2-10: `_handleFocusIn` dead code (tree div not focusable)             | **FIXED** — resolved by adding `tabindex="0"` to the tree container (P0-1 fix); `_handleFocusIn` is now functional                                                         |
| P2-11: `aria-posinset` and `aria-setsize` missing                      | **FIXED** — `_getPosInSet()` and `_getSetSize()` methods added; `aria-posinset` and `aria-setsize` applied to all treeitems                                                |
| `WcTreeView`/`WcTreeItem` use legacy `Wc` prefix without `@deprecated` | **FIXED** — `HxTreeView` and `HxTreeItem` canonical type aliases added; `WcTreeView` and `WcTreeItem` retained with `@deprecated` JSDoc; all four exported from `index.ts` |

## Performance Audit Fixes Applied (2026-03-13)

| Finding                                                                 | Status                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-8: Bundle size not verified                                          | **ACKNOWLEDGED** — CI-level bundle measurement is a separate infrastructure concern; no source change warranted                                                                                                                                                            |
| P2-9: No virtualization strategy for large trees                        | **FIXED (documented)** — Scale limits and lazy-loading guidance documented in `hx-tree-view.ts` JSDoc (`## Scale Limits` section); component suitable for ~500 items, consumers should use `expanded` property for on-demand loading of larger datasets                    |
| Render-time DOM traversal in `_getLevel`, `_getPosInSet`, `_getSetSize` | **FIXED** — Refactored `hx-tree-item.ts`: methods replaced by `@state` cached values (`_level`, `_posInSet`, `_setSize`, `_selectable`); single `_updateAriaMetadata()` pass on `connectedCallback` and `slotchange`; DOM traversal no longer occurs on every render cycle |
| No `contain` declaration on `:host`                                     | **FIXED** — `contain: layout style` added to `:host` in `hx-tree-view.styles.ts` and `hx-tree-item.styles.ts`; enables browser layout isolation and reduces cascading recalculation scope                                                                                  |
