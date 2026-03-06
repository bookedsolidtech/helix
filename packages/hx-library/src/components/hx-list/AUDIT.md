# hx-list Antagonistic Audit (T2-03)

Reviewed files:
- `hx-list.ts`
- `hx-list-item.ts`
- `hx-list.styles.ts`
- `hx-list-item.styles.ts`
- `hx-list.stories.ts`
- `hx-list.test.ts`
- `index.ts`

Severity: **P0** = blocking, **P1** = critical, **P2** = significant, **P3** = minor

---

## 1. TypeScript

### P0 — Description list (`<dl>`) type is missing

The feature spec calls for "ordered/unordered/description list" types. The component's `variant` union is `'plain' | 'bulleted' | 'numbered' | 'interactive'` — there is no `description` variant and no `<dl>`/`<dt>`/`<dd>` rendering path. This is a feature gap, not just a typing issue.

**File:** `hx-list.ts:34`

---

### P1 — Unsafe type assertion on event target

In `_handleItemClick`, the event target is immediately cast to `HelixListItem` without a type guard:

```ts
const item = e.target as HelixListItem;
if (!item || item.disabled) return;
```

If a non-`hx-list-item` element fires an `hx-list-item-click` event (e.g. a slotted child that extends from a different base), `item.disabled` will be `undefined` (falsy) and the event will be re-dispatched incorrectly. Should use `instanceof HelixListItem` guard.

**File:** `hx-list.ts:53-54`

---

### P1 — `label` prop not enforced for interactive variant

The JSDoc states `label` is "Required when variant is 'interactive' (listbox role)". There is no TypeScript overload, conditional type, or runtime warning enforcing this. A developer can use `<hx-list variant="interactive">` with no label, producing an unlabeled listbox — a WCAG failure.

**File:** `hx-list.ts:47-48`

---

### P2 — `_isInteractive` computed via `closest()` is not reactive

`hx-list-item` determines its interactive state via `this.closest('hx-list')?.variant`. This is re-evaluated at render time, which works on initial render. However, if the parent list's `variant` attribute changes at runtime, `hx-list-item` will NOT re-render to reflect the change because it has no reactive subscription to the parent's property. Items will continue displaying `role="listitem"` and no `aria-selected` after a variant switch.

**File:** `hx-list-item.ts:67-73`

---

### P2 — `closest()` does not pierce Shadow DOM boundaries

`this.closest('hx-list')` traverses only the current DOM tree scope. If `hx-list-item` elements are slotted into `hx-list` from inside another shadow root, `closest()` will return `null` and all items will behave as non-interactive. This is not the primary use case, but it is a documented fragility in Lit component composition.

**File:** `hx-list-item.ts:68`

---

## 2. Accessibility

### P0 — ARIA listbox pattern is missing required keyboard navigation

Per ARIA Authoring Practices Guide (APG), a `role="listbox"` widget MUST support:
- `ArrowDown` / `ArrowUp` to move focus between options
- `Home` / `End` to jump to first/last option
- (Optionally) `ArrowDown` with selection movement

Currently, `hx-list-item` only handles `Enter` and `Space` (`_handleKeydown`), and there is no roving `tabindex` or `aria-activedescendant` management at the `hx-list` level. Keyboard-only users cannot navigate between options in a listbox — this fails WCAG 2.1 SC 2.1.1 (Keyboard).

**File:** `hx-list-item.ts:151-158`, `hx-list.ts` (missing entirely)

---

### P0 — ARIA ownership does not cross Shadow DOM boundaries

`<ul role="listbox">` exists in `hx-list`'s shadow root. The `<li role="option">` elements exist in each `hx-list-item`'s shadow root. The ARIA specification requires that owned elements of a `listbox` be `option` role elements. Chrome's AOM partially flattens slotted content, and axe-core passes in the current tests, but the formal ARIA ownership chain is broken by the double shadow boundary (`hx-list` shadow → slotted `hx-list-item` host → `hx-list-item` shadow → `<li role="option">`). This is fragile across browsers and AT combinations.

**Files:** `hx-list.ts:68`, `hx-list-item.ts:115`

---

### P1 — `aria-multiselectable` is absent on the listbox

`role="listbox"` defaults to single-select in the ARIA spec, but the attribute `aria-multiselectable` is not set. AT will not reliably announce whether multi-selection is supported. If the design intent is single-select only, `aria-multiselectable="false"` should be explicit.

**File:** `hx-list.ts:84-94`

---

### P1 — `<li>` with `role="option"` wrapping `<a>` is invalid ARIA

When `href` is set on `hx-list-item` and that item is inside an interactive `hx-list`, the rendered output is `<li role="option"><a href="...">...</a></li>`. The ARIA spec prohibits interactive content (focusable elements) as descendants of `role="option"`. The `<a>` element inside an option creates conflicting focus management and will confuse screen readers.

**File:** `hx-list-item.ts:117-131`

---

### P1 — Numbered list axe-core test is missing

The test suite checks axe violations for `plain`, `bulleted`, and `interactive` variants, but NOT for `numbered`. An `<ol role="list">` with `<hx-list-item>` children has not been validated for accessibility violations.

**File:** `hx-list.test.ts:380-428`

---

### P2 — `<ol>` with `role="list"` suppresses ordered list semantics in some AT

Safari + VoiceOver and some other AT combinations will not announce item count or list type when `role="list"` is explicitly applied to an `<ol>` (same as the known CSS `list-style: none` VoiceOver issue). The numbered variant would be announced as a generic list rather than "ordered list, N items". The `role="list"` attribute on `<ol>` is redundant at best and harmful to AT in practice.

**File:** `hx-list.ts:71-81`

---

## 3. Tests

### P1 — No tests for nested lists

The feature spec explicitly requires "nested list support" and 80%+ coverage of this pattern. There are zero tests for an `hx-list` nested inside another `hx-list-item`, or for hierarchical list structures.

**File:** `hx-list.test.ts` (missing entirely)

---

### P1 — No keyboard navigation tests

The `_handleKeydown` handler in `hx-list-item` is completely untested. No test verifies that pressing `Enter` or `Space` on a focused list item dispatches `hx-list-item-click`. No test verifies that arrow keys do (or explicitly do not) navigate between items.

**File:** `hx-list.test.ts` (missing entirely)

---

### P1 — No test for `href` + `disabled` combination

When `disabled` is `true` and `href` is set, `hx-list-item.ts:117` uses `if (this.href !== undefined && !this.disabled)` to decide the render branch — so a disabled+href item renders as a plain `<li>` (correct). But this combination has no test coverage.

**File:** `hx-list.test.ts` (missing)

---

### P1 — Non-firing event assertion is unreliable

The test "does not dispatch hx-select in plain mode" sets a flag in a listener then calls `await el.updateComplete` to assert the flag is still false. `updateComplete` resolves synchronously in most cases, but this does not guarantee the event loop has flushed all microtasks. A `await new Promise(resolve => setTimeout(resolve, 0))` or similar async tick is needed for reliable negative event assertions.

**File:** `hx-list.test.ts:133-148`

---

### P2 — No test for `description` slot content rendering

The slot is declared and the CSS part exists, but there is no test asserting that content slotted into `description` is accessible or renders below the label.

**File:** `hx-list.test.ts` (missing)

---

### P2 — No test for `hx-list` with `label` prop setting `aria-label`

The `label` prop is tested only implicitly in the axe-core interactive story fixture. There is no explicit test asserting that `aria-label` on the inner `<ul>` equals the `label` property value.

**File:** `hx-list.test.ts` (missing)

---

## 4. Storybook

### P1 — `Interactive` story has no `label` attribute

The primary `Interactive` story renders `<hx-list variant="interactive">` without setting the `label` prop. This means the rendered listbox has no `aria-label` or `aria-labelledby`, which is a WCAG 2.1 SC 4.1.2 failure. Storybook's a11y addon will flag this.

**File:** `hx-list.stories.ts:100-115`

---

### P2 — No nested list story

The feature spec requests "all list types and nesting demos" in Storybook. There is no story demonstrating a list within a list (e.g. a numbered list containing bulleted sub-items, or hierarchical navigation). The 12 existing stories cover variants, states, and slots but not composition/nesting.

**File:** `hx-list.stories.ts` (missing)

---

### P2 — No description list story

Consistent with the missing `<dl>` variant in the component — there is no story or example demonstrating a description list pattern.

**File:** `hx-list.stories.ts` (missing, blocked on component gap)

---

### P3 — `console.log` in story render function

The `Interactive` story's `@hx-select` handler calls `console.log`. Storybook actions should use the `action()` helper from `@storybook/addon-actions` or `fn()` from `@storybook/test` for testable event capture.

**File:** `hx-list.stories.ts:105`

---

## 5. CSS

### P0 — `:host-context()` is deprecated and unsupported in Firefox

All interactive item styling — `cursor: pointer`, hover background, and `focus-visible` ring — is gated behind `:host-context(hx-list[variant='interactive'])`. This pseudo-class:
- Was removed from the CSS Scoping Level 1 spec
- Has **never been supported in Firefox** (or Safari)
- Is supported only in Chromium (and may be removed in future versions)

In Firefox, interactive `hx-list-item` elements render with default cursor, no hover highlight, and no focus ring. This is a critical cross-browser regression that breaks both visual design and accessibility.

**File:** `hx-list-item.styles.ts:31-45`

---

### P1 — `--hx-list-item-description-color` token is missing

The description text uses `var(--hx-color-neutral-500, #64748b)` directly without a component-level custom property. All other customizable colors in the component have an `--hx-list-item-*` token (padding, color, bg-hover, bg-selected, color-selected). Description color cannot be themed without overriding the semantic token globally.

**File:** `hx-list-item.styles.ts:99`

---

### P2 — Hardcoded hex fallbacks may drift from token values

Multiple CSS custom property fallbacks use hardcoded hex values (e.g. `#0f172a`, `#f8fafc`, `#eff6ff`, `#1d4ed8`, `#64748b`, `#2563eb`). If the `--hx-*` token values change, the fallbacks silently diverge, creating inconsistency in environments where tokens aren't loaded. Fallbacks should either reference a higher-level token or document the sync requirement.

**Files:** `hx-list-item.styles.ts:20-44`, `hx-list.styles.ts:41-43`

---

### P2 — No `--hx-*` token for custom marker/bullet customization

The `bulleted` and `numbered` variants rely on native `list-style: disc` and `list-style: decimal`. There is no `--hx-list-marker-*` token allowing consumers to change bullet style, color, or position. The design token architecture specifies that all visual properties must be overridable via `--hx-*` tokens.

**Files:** `hx-list.styles.ts:19-29`

---

### P3 — `outline: none` on interactive items may suppress default focus in unsupported browsers

`:host-context(hx-list[variant='interactive']) .list-item { outline: none; }` removes the browser default focus indicator. Since `:host-context()` doesn't work in Firefox, the `outline: none` also won't apply there — meaning Firefox users get the browser default outline (acceptable), but the intent is inconsistent across browsers.

**File:** `hx-list-item.styles.ts:35`

---

## 6. Performance

### P2 — No bundle size measurement on record

No bundle size data is available from this audit. Based on code volume (two components, ~150 lines combined, minimal dependencies), the bundle is estimated to be within the 5KB per-component limit. This must be verified with `npm run build` and the per-component analysis gate.

---

## 7. Drupal

### P2 — No Twig template or Drupal behaviors example provided

The component is declarative and can be rendered via Twig (`<hx-list variant="bulleted">...</hx-list>`). However, there is no provided Twig template, Drupal behavior, or documentation verifying this. The `hx-select` event (critical for interactive mode) requires JavaScript and cannot be handled via Twig alone — a Drupal behavior file is needed for interactive mode consumers.

---

## Summary Table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | P0 | TypeScript | Description list (`<dl>`) variant missing |
| 2 | P0 | CSS | `:host-context()` unsupported in Firefox — interactive styles broken |
| 3 | P0 | Accessibility | Listbox pattern missing arrow key navigation (WCAG 2.1.1) |
| 4 | P0 | Accessibility | ARIA ownership broken across double Shadow DOM boundary |
| 5 | P1 | TypeScript | Unsafe `as HelixListItem` cast without `instanceof` guard |
| 6 | P1 | TypeScript | `label` not enforced for interactive variant |
| 7 | P1 | Accessibility | `aria-multiselectable` absent on listbox |
| 8 | P1 | Accessibility | `<a>` inside `role="option"` — invalid ARIA |
| 9 | P1 | Accessibility | Numbered list not covered by axe-core test |
| 10 | P1 | TypeScript | `_isInteractive` not reactive to parent variant changes |
| 11 | P1 | Tests | No tests for nested lists |
| 12 | P1 | Tests | No keyboard navigation tests (`Enter`/`Space`/arrow keys) |
| 13 | P1 | Tests | `href` + `disabled` combination untested |
| 14 | P1 | Tests | Negative event assertion uses unreliable timing |
| 15 | P1 | CSS | `--hx-list-item-description-color` token missing |
| 16 | P1 | Storybook | Interactive story missing `label` attribute (WCAG failure) |
| 17 | P2 | Accessibility | `<ol role="list">` suppresses ordered semantics in VoiceOver |
| 18 | P2 | TypeScript | `closest()` not reactive and doesn't pierce Shadow DOM |
| 19 | P2 | Tests | Description slot rendering untested |
| 20 | P2 | Tests | `label` → `aria-label` binding untested |
| 21 | P2 | Storybook | No nested list story |
| 22 | P2 | Storybook | No description list story |
| 23 | P2 | CSS | Hardcoded hex fallbacks may drift from token values |
| 24 | P2 | CSS | No `--hx-list-marker-*` token for bullet/number customization |
| 25 | P2 | Performance | Bundle size not measured/verified |
| 26 | P2 | Drupal | No Twig template or Drupal behavior for interactive mode |
| 27 | P3 | Storybook | `console.log` should be replaced with Storybook `fn()`/`action()` |
| 28 | P3 | CSS | `outline: none` intent inconsistent across browsers |

**P0 count: 4 — RELEASE BLOCKED**
