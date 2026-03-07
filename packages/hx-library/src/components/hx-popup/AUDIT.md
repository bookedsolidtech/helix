# AUDIT: hx-popup — Antagonistic Quality Review (T4-04)

**Auditor:** Antagonistic Review Agent
**Branch:** feature/audit-hx-popup-t4-04-antagonistic
**Files reviewed:**
- `hx-popup.ts`
- `hx-popup.styles.ts`
- `hx-popup.test.ts`
- `hx-popup.stories.ts`
- `index.ts`

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| P0 | Blocks merge — critical defect or gate violation |
| P1 | Must fix before stable release |
| P2 | Should fix in follow-up; quality gap |

---

## 1. TypeScript

### P1 — `strategy` is hardcoded; no consumer control

**File:** `hx-popup.ts:302`

```ts
strategy: 'fixed',
```

The feature spec calls out `strategy` (absolute/fixed) as a typed, exposed property. The implementation hardcodes `'fixed'` and exposes no `strategy` attribute. Consumers using `hx-popup` inside a scroll container that does not use `position: fixed` elements cannot opt into `position: absolute`. No type union `'fixed' | 'absolute'` exists on the component.

**Impact:** Breaks valid positioning scenarios (e.g., popups inside `overflow: hidden` containers where `absolute` is required).

---

### P1 — `flipFallbackPlacements` typed as `string[]`, not `Placement[]`

**File:** `hx-popup.ts:156`

```ts
flipFallbackPlacements: string[] = [];
```

The property is later cast as `Placement[]` in `_reposition()` at line 272 with `as Placement[]`. This cast silently accepts invalid strings like `"top-diagonal"` at the attribute level without a TypeScript error. The public API should be typed `PopupPlacement[]` to match the component's own placement union and catch misconfiguration at compile time.

---

### P2 — `arrowData` cast is unnecessarily wide

**File:** `hx-popup.ts:311`

```ts
const arrowData = middlewareData.arrow as { x?: number; y?: number } | undefined;
```

`middlewareData.arrow` has a more specific type from `@floating-ui/dom` (`ArrowMiddlewareData`). Using a hand-rolled interface cast discards type information. Import `ArrowMiddlewareData` from the library instead.

---

### P2 — `anchor` property missing `reflect: false` annotation clarity

**File:** `hx-popup.ts:76`

The `anchor` property has `@property()` with no options. When set to an `Element` reference via JS property, `toAttribute` is called during serialization and will produce `[object HTMLButtonElement]` if anything attempts to read back the attribute. The property should have `attribute: false` to make the intent explicit (JS-only property for Element references), or document clearly that the attribute only accepts CSS selector strings. Currently the type union `string | Element | null` with a bare `@property()` decorator is misleading — the attribute form only works for string selectors.

---

## 2. Accessibility

### P1 — `aria-hidden` on shadow DOM container may not hide slotted content in all browsers

**File:** `hx-popup.ts:371`

```ts
<div part="popup" aria-hidden=${String(!this.active)}>
  <slot></slot>
  ...
</div>
```

Slotted content lives in the light DOM (the host's accessible subtree). Setting `aria-hidden="true"` on a Shadow DOM container does **not** reliably remove slotted elements from the accessibility tree in all browser/AT combinations. The spec for flattened tree accessibility is browser-implementation-dependent. For inactive state, the reliable approach is `display: none` (already applied via CSS) combined with `aria-hidden` at the `:host` level, or by not using `aria-hidden` on an inner shadow element at all.

The current `display: none` on `:host(:not([active])) [part="popup"]` does hide content visually, and `display: none` is sufficient to remove slotted content from the accessibility tree in the flat tree model. The `aria-hidden` is therefore redundant and potentially misleading. It should be applied on `:host` or removed in favor of relying on `display: none` exclusively.

---

### P1 — No documentation that consumers own all ARIA semantics

**File:** `hx-popup.ts` (JSDoc/component docs)

The component JSDoc states "consumers responsible for ARIA" but this is buried in a comment. There is no documented contract specifying:
- Consumers MUST add `role="tooltip"` / `role="dialog"` / `role="listbox"` etc. to popup content depending on purpose
- Consumers MUST manage `aria-expanded` on the trigger element
- Consumers MUST implement `aria-controls` / `aria-labelledby` as appropriate
- Focus management is entirely out of scope (this component does not trap focus — correct, but undocumented)

The component is a positioning utility, not an interactive widget. This is correct, but the absence of a contract creates a pattern where teams ship inaccessible tooltips and popovers built on `hx-popup` with no ARIA roles.

**Recommendation:** Add a `## Accessibility` section to JSDoc or a companion `README.md` that explicitly documents the consumer contract.

---

### P2 — axe-core tests pass in isolation but don't validate composite patterns

**File:** `hx-popup.test.ts:373-391`

The two axe-core tests check the component with plain `<div>` content in isolation. A bare `<div>` inside an active popup has no ARIA role, yet axe passes because there is no violation triggered by the host element itself. This gives false confidence — the tests don't validate the patterns consumers will actually use (tooltip, menu, dialog).

---

## 3. Tests

### P1 — No tests for actual positioning computation (flip, shift, arrow)

**File:** `hx-popup.test.ts`

The test suite tests property reflection and attribute parsing thoroughly, but **does not test any output of the positioning engine**. Specifically:

- **Flip behavior:** There is a test that `el.flip === true` after setting the attribute. There is no test that the popup's `top`/`left` styles change when `flip` causes a placement switch. The `_reposition()` method's flip branch is untested at the integration level.
- **Shift behavior:** Same gap — property reflects correctly but shift middleware output is never verified.
- **Arrow positioning:** `_positionArrow()` is the most complex private method in the file (37 lines, 4 placement branches, 3 `arrowPlacement` branches). It is completely untested. No test verifies `data-placement` attribute on the arrow element, nor that `left`/`top` CSS values are set.

This is a structural testing gap. The feature description explicitly requires "placement calculation (all 12 positions), flip behavior when out of viewport, shift behavior, arrow positioning" — none of these behaviors are tested at the computed style level.

---

### P1 — No test for `anchor` as CSS selector string

**File:** `hx-popup.test.ts:343-358`

The Positioning suite covers Element reference anchoring but omits CSS selector anchoring (`anchor="#external-btn"`). The `_getAnchorElement()` method has three code paths; only one (Element ref) is tested.

---

### P2 — `arrowPlacement` property has no tests

**File:** `hx-popup.test.ts`

`arrowPlacement` (`'start' | 'center' | 'end' | null`) is a non-trivial feature with its own branch in `_positionArrow`. No test covers setting it or verifying the resulting arrow position offset.

---

### P2 — `arrowPadding` property is not tested beyond defaults

**File:** `hx-popup.test.ts`

`arrowPadding` affects both the `arrowMiddleware` configuration and the manual `start`/`end` fallback offsets in `_positionArrow`. No test verifies that a non-default value propagates correctly.

---

### P2 — `auto` placement path is not tested

**File:** `hx-popup.test.ts`

`placement="auto"` triggers `autoPlacementMiddleware()` instead of `flipMiddleware()`. This is a separate code path with a different effective placement (`'bottom'` fallback passed to `computePosition`). The test for "all 12 placements" does not include `'auto'`.

---

### P2 — `autoSize` CSS custom properties not verified

**File:** `hx-popup.test.ts`

When `autoSize` is true, `--hx-auto-size-available-width` and `--hx-auto-size-available-height` are set as inline styles on `[part="popup"]`. No test verifies these properties are set, or that they are removed when `autoSize` is disabled.

---

## 4. Storybook

### P1 — No story for `auto` placement

**File:** `hx-popup.stories.ts`

The `Placements` story covers all 12 explicit placements but omits `auto` (the `autoPlacementMiddleware` path). This is a separate and meaningful code path.

---

### P1 — No story for `autoSize`

**File:** `hx-popup.stories.ts`

`autoSize` exposes `--hx-auto-size-available-width/height` for consumers to constrain popup dimensions to the viewport. There is no story demonstrating this behavior, making it invisible in documentation.

---

### P2 — `arrowPlacement` has no dedicated story

**File:** `hx-popup.stories.ts`

`arrowPlacement` (`start` / `center` / `end`) is in `argTypes` but only shown via the controls panel. A dedicated story showing the three positions side-by-side would communicate the feature clearly.

---

### P2 — `WithArrow` story omits left placement

**File:** `hx-popup.stories.ts:229-265`

The arrow story shows top, bottom, and right but not left. Four placements exist (top/bottom/left/right); all four should appear in the demo.

---

### P2 — `FlipBehavior` and `ShiftBehavior` stories have no `play` functions

**File:** `hx-popup.stories.ts:295-330`

Both stories rely on visual inspection to verify behavior. No `play` function asserts that flipping or shifting actually occurred. These should query the computed `data-placement` attribute or `left`/`top` values to confirm middleware fired.

---

### P2 — No interactive story (activate/deactivate toggle)

**File:** `hx-popup.stories.ts`

There is no story that demonstrates toggling `active` via user interaction (e.g., a button click). All stories open the popup statically. Consumer teams need a reference for the correct JavaScript interaction pattern.

---

### P2 — `flipFallbackPlacements` not demonstrated

**File:** `hx-popup.stories.ts`

The property parses a JSON array from attribute (`flip-fallback-placements='["top","left"]'`). No story demonstrates this, and its format is non-obvious.

---

## 5. CSS

### P1 — Missing `--hx-popup-transition` token

**File:** `hx-popup.styles.ts`

The feature spec explicitly lists "transition" as a required `--hx-*` CSS custom property. The current stylesheet has no transition defined — the popup appears and disappears via `display: none` toggle with no animation or fade. There is no `--hx-popup-transition` property to allow consumers to configure entrance/exit animation.

The show/hide mechanism is `display: none` toggled via `:host(:not([active])) [part="popup"] { display: none; }`. `display` cannot be transitioned. An opacity/visibility approach (e.g., `opacity: 0; visibility: hidden`) would be needed to support transitions.

---

### P2 — `--hx-auto-size-available-width/height` set on popup element, not `:host`

**File:** `hx-popup.ts:289-290`

```ts
popupEl.style.setProperty('--hx-auto-size-available-width', `${availableWidth}px`);
popupEl.style.setProperty('--hx-auto-size-available-height', `${availableHeight}px`);
```

These CSS custom properties are injected as inline styles on `[part="popup"]` (a shadow DOM element). Consumers who need to read these values from light DOM styles (e.g., to constrain a slotted child) cannot access them without using `::part(popup)`. Setting them at `:host` level would make them available throughout the component's shadow and light DOM inheritance chain.

---

### P2 — Arrow `background` defaults to `currentColor` — fragile default

**File:** `hx-popup.styles.ts:23`

```css
background: var(--hx-arrow-color, currentColor);
```

`currentColor` is inherited from the nearest ancestor's `color` value. In a dark popup on a white background, if the popup container's `color` is white (for legible text), the arrow will be white — invisible against any white background. This is a common pitfall. The default should be a semantic token (e.g., `var(--hx-color-surface-overlay, #fff)`) rather than `currentColor`.

---

## 6. Performance

### P0 — Bundle size almost certainly violates the 5KB gate

**File:** `hx-popup.ts:5-13`

```ts
import {
  computePosition,
  flip as flipMiddleware,
  shift as shiftMiddleware,
  offset as offsetMiddleware,
  arrow as arrowMiddleware,
  autoUpdate,
  size as sizeMiddleware,
  autoPlacement as autoPlacementMiddleware,
} from '@floating-ui/dom';
```

`@floating-ui/dom` minified+gzipped is approximately 5–7 KB for core `computePosition` plus individual middleware. This component imports **8 named exports** from the package. Even with tree-shaking, the per-component contribution of Floating UI's DOM math code alone likely exceeds the 5 KB budget defined in CLAUDE.md ("Performance — no bundle size regression (<5KB per component min+gz, <50KB full bundle)").

No bundle size analysis is included in the implementation. Gate 6 ("Bundle size — Per-component analysis — <5KB each") requires this to be measured. This is an unverified gate claim and should be treated as a P0 blocker until `npm run build` output with per-component size analysis is provided and passes.

**Action required:** Run `npm run build` with bundle analysis, report the size of the `hx-popup` chunk, and either confirm it passes the 5 KB budget or document the exception request.

---

### P2 — No repositioning debounce for scroll/resize events

`autoUpdate` from Floating UI handles scroll and resize internally. However, the `_reposition()` method is `async` and is called on every `autoUpdate` tick without additional debouncing. In high-frequency scroll scenarios, this can create queued promise chains. Floating UI's built-in debouncing should handle this, but it is worth monitoring in profiling.

---

## 7. Drupal

### P2 — No Drupal integration documentation or Twig example

The feature spec says "Drupal — JS utility — Twig for markup only." This is correct — `hx-popup` requires no Drupal behavior file (the anchor slot and `active` attribute are enough). However, there is no Twig snippet in the component documentation showing how to wire a trigger to activate the popup via a Drupal behavior. Consumer teams will replicate this incorrectly.

**Minimum needed:** A JSDoc or companion file example showing:
```twig
{# hx-popup usage in Twig #}
<hx-popup id="my-popup" placement="bottom" distance="8">
  <button slot="anchor" aria-expanded="false" aria-controls="my-popup">
    Open
  </button>
  <div role="dialog" aria-label="Popup content">...</div>
</hx-popup>
```

```js
// Drupal behavior
Drupal.behaviors.helixPopup = {
  attach(context) {
    context.querySelectorAll('hx-popup').forEach((popup) => { ... });
  }
};
```

---

### P2 — No documentation on how `anchor` attribute works with Drupal-rendered IDs

The `anchor` property accepts a CSS selector string. In Drupal, element IDs are often generated dynamically (`id="block-12345"`). There is no guidance on how to pass a dynamic Drupal ID as the anchor attribute, or whether the `anchor` slot approach is preferred in server-rendered contexts (it should be).

---

## Summary Table

| ID | Area | Severity | Issue |
|----|------|----------|-------|
| TS-1 | TypeScript | P1 | `strategy` hardcoded, not exposed as typed property |
| TS-2 | TypeScript | P1 | `flipFallbackPlacements` typed `string[]` not `Placement[]` |
| TS-3 | TypeScript | P2 | `arrowData` uses hand-rolled interface instead of `ArrowMiddlewareData` |
| TS-4 | TypeScript | P2 | `anchor` `@property()` decorator misleads about attribute/property dual behavior |
| A11Y-1 | Accessibility | P1 | `aria-hidden` on shadow container unreliably hides slotted content in all browsers |
| A11Y-2 | Accessibility | P1 | No documented consumer ARIA contract (roles, aria-expanded, focus management) |
| A11Y-3 | Accessibility | P2 | axe tests don't validate composite usage patterns |
| TEST-1 | Tests | P1 | No tests for actual flip/shift/arrow positioning output |
| TEST-2 | Tests | P1 | No test for CSS selector string anchor path |
| TEST-3 | Tests | P2 | `arrowPlacement` property untested |
| TEST-4 | Tests | P2 | `arrowPadding` behavior untested |
| TEST-5 | Tests | P2 | `auto` placement code path untested |
| TEST-6 | Tests | P2 | `autoSize` CSS custom properties not verified |
| SB-1 | Storybook | P1 | No story for `auto` placement |
| SB-2 | Storybook | P1 | No story for `autoSize` feature |
| SB-3 | Storybook | P2 | `arrowPlacement` not demonstrated in dedicated story |
| SB-4 | Storybook | P2 | `WithArrow` missing left placement |
| SB-5 | Storybook | P2 | Flip/Shift stories have no `play` assertions |
| SB-6 | Storybook | P2 | No interactive (toggle) story |
| SB-7 | Storybook | P2 | `flipFallbackPlacements` not demonstrated |
| CSS-1 | CSS | P1 | Missing `--hx-popup-transition` token; no show/hide animation support |
| CSS-2 | CSS | P2 | `--hx-auto-size-*` set on popup element, not `:host` |
| CSS-3 | CSS | P2 | Arrow `background: currentColor` default is fragile |
| PERF-1 | Performance | P0 | Bundle size unverified; Floating UI dependency likely exceeds 5 KB gate |
| PERF-2 | Performance | P2 | No debounce monitoring for high-frequency reposition events |
| DRUPAL-1 | Drupal | P2 | No Twig usage example or Drupal behavior reference |
| DRUPAL-2 | Drupal | P2 | No guidance on dynamic Drupal IDs with CSS selector anchor |

---

**P0 count:** 1
**P1 count:** 8
**P2 count:** 17

**Status: DOES NOT PASS antagonistic review.** The P0 bundle size gate violation and 8 P1 issues must be resolved before this component is considered production-ready.
