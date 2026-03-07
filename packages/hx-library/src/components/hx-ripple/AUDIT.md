# Antagonistic Quality Audit: `hx-ripple` (T4-09)

**Audit Date:** 2026-03-06
**Branch Audited:** `feature/implement-hx-ripple-t4-material-ripple`
**Auditor:** Antagonistic Review Agent
**Verdict:** BLOCKED — 1 P0, 5 P1 findings must be resolved before merge.

---

## Files Reviewed

| File | Lines |
|---|---|
| `hx-ripple.ts` | 103 |
| `hx-ripple.styles.ts` | 41 |
| `hx-ripple.stories.ts` | 150 |
| `hx-ripple.test.ts` | 175 |
| `index.ts` | 1 |

---

## Finding Summary

| ID | Severity | Area | Title |
|---|---|---|---|
| R-01 | **P0** | TypeScript / Feature | `unbounded` property is entirely missing |
| R-02 | **P1** | Accessibility | Keyboard events (Enter/Space) do not trigger ripple |
| R-03 | **P1** | Accessibility | Host element lacks `role="presentation"` / `role="none"` |
| R-04 | **P1** | Tests | No tests for keyboard-triggered ripple |
| R-05 | **P1** | Storybook | No "on icons" story |
| R-06 | **P1** | Storybook | No reduced-motion demo story |
| R-07 | **P2** | Tests | No test verifying ripple DOM cleanup after `animationend` |
| R-08 | **P2** | Tests | No test verifying `color` prop sets `backgroundColor` on ripple element |
| R-09 | **P2** | CSS | Hardcoded `scale(4)` end-state is not a design token |
| R-10 | **P2** | CSS | No `will-change: transform, opacity` hint on `.ripple__wave` |
| R-11 | **P2** | CSS | `:host { overflow: hidden }` may clip tooltips/dropdowns on slotted elements |
| R-12 | **P2** | Drupal | No Twig example or Drupal behavior usage documentation |

---

## Detailed Findings

---

### R-01 — P0 | TypeScript / Feature: `unbounded` property is entirely missing

**File:** `hx-ripple.ts`

The audit requirement explicitly calls out "unbounded prop typed" and tests for "unbounded mode." The `unbounded` property is not present anywhere in the component. In an unbounded ripple the wave expands beyond the component bounds (used for icon buttons where the ripple should exceed the icon hit area). This is a Material Design standard behavior and is explicitly called for in the feature spec.

**Impact:** The component is functionally incomplete. All unbounded-mode Storybook stories and tests are also absent as a direct consequence.

**Evidence:** `hx-ripple.ts` contains no `unbounded` property, no CSS part-level handling of overflow clipping being toggled off, and no story or test exercises this mode.

---

### R-02 — P1 | Accessibility: Keyboard events (Enter/Space) do not trigger ripple

**File:** `hx-ripple.ts`, lines 45–79, 81–88

The component listens only for `pointerdown`. Keyboard users activating a slotted button via Enter or Space will not receive a ripple. This violates the principle that purely visual feedback should still be consistent for keyboard vs. pointer users — and the feature description explicitly requires keyboard triggers.

**Evidence:**
```ts
// hx-ripple.ts:83 — only pointerdown is registered
this.addEventListener('pointerdown', this._handlePointerDown);
```

No `keydown` handler is registered. Pressing Enter/Space on a child button will not trigger the ripple even though a click fires.

---

### R-03 — P1 | Accessibility: Host element lacks `role="presentation"` or `role="none"`

**File:** `hx-ripple.ts`, line 91–96

The `<hx-ripple>` host element wraps a slotted interactive element (e.g., `<hx-button>`) but has no ARIA role. Without `role="presentation"` (or `role="none"` in ARIA 1.1+), screen readers may announce the host as a generic container/group, polluting the accessibility tree with an unnamed, roleless element wrapping the interactive content.

**Evidence:**
```ts
override render() {
  return html`
    <slot></slot>
    <span class="ripple__base" part="base" aria-hidden="true"></span>
  `;
}
```

The host has no `role` set (not in `render()`, not via `connectedCallback`, not as a static host property). While axe-core may not flag it in simple test fixtures, real screen readers (NVDA, VoiceOver) may announce "group" or simply pause on the element, degrading UX.

**Note:** Do NOT set `aria-hidden="true"` on the host — that would hide the slotted button from assistive tech entirely. The fix is `role="presentation"` or `role="none"`.

---

### R-04 — P1 | Tests: No tests for keyboard-triggered ripple

**File:** `hx-ripple.test.ts`

The "Ripple creation" describe block covers pointer events only. There is no test dispatching a `keydown` with `key: 'Enter'` or `key: ' '` and asserting the ripple is created. The audit area explicitly requires "keyboard triggers ripple" coverage.

**Evidence:** Searching `hx-ripple.test.ts` for `keydown`, `keyboard`, `Enter`, or `Space` yields zero matches.

---

### R-05 — P1 | Storybook: No "on icons" story

**File:** `hx-ripple.stories.ts`

The audit requires a story demonstrating the ripple on icon buttons. All 6 stories wrap `<hx-button>` with text labels or a `<div>` card. No story uses an icon-only button or `<hx-icon>`. This is a significant usage gap: icon buttons are a primary ripple use case in Material-style design systems.

**Evidence:** No story in `hx-ripple.stories.ts` contains an icon element.

---

### R-06 — P1 | Storybook: No reduced-motion demo story

**File:** `hx-ripple.stories.ts`

The audit requires a story that demonstrates or documents reduced-motion behavior. There is no story with a note, decorator, or CSS override (`prefers-reduced-motion: reduce`) to show Storybook consumers what the component looks like (or doesn't look like) under that media query. This is important for accessibility documentation in a healthcare design system context.

**Evidence:** No story references `prefers-reduced-motion` or includes any accessibility behavior demo.

---

### R-07 — P2 | Tests: No test verifying ripple DOM cleanup after `animationend`

**File:** `hx-ripple.test.ts`

The component removes the ripple span on `animationend` (hx-ripple.ts:72–78). There is no test that fires the `animationend` event and asserts the ripple element is removed from the DOM. Without this test a regression that leaks ripple spans (e.g., if the `once: true` listener is removed or the event name changes) would go undetected.

**Evidence:** No `animationend` dispatch in test file.

---

### R-08 — P2 | Tests: No test verifying `color` prop sets `backgroundColor` on ripple element

**File:** `hx-ripple.test.ts`

The `color` property is documented to override the ripple element's `backgroundColor` (hx-ripple.ts:61–63). There is no test that sets `color="#ff0000"` and asserts the created ripple span has `style.backgroundColor` matching the provided value. A future refactor could silently break color application.

**Evidence:** No test in the "Properties" or "Ripple creation" describe blocks checks ripple background color.

---

### R-09 — P2 | CSS: Hardcoded `scale(4)` end-state is not a design token

**File:** `hx-ripple.styles.ts`, line 30

The `@keyframes hx-ripple-expand` animation scales the ripple to `scale(4)`. For very wide containers this may not reach the far corners; for small containers it is excessive. There is no `--hx-ripple-scale` token to allow consumers to tune this. Consistent with the library's "no hardcoded values" policy, this should be a CSS custom property.

**Evidence:**
```css
@keyframes hx-ripple-expand {
  to {
    transform: scale(4);   /* hardcoded */
    opacity: 0;
  }
}
```

---

### R-10 — P2 | CSS: No `will-change: transform, opacity` on `.ripple__wave`

**File:** `hx-ripple.styles.ts`

The ripple wave animates `transform` and `opacity`. Not hinting the browser with `will-change: transform, opacity` means the browser may not promote the element to its own compositor layer, causing repaints during animation. For an animation-heavy component in a healthcare dashboard context (potentially rendering in Chromium via Electron or a constrained kiosk), this is a meaningful omission.

---

### R-11 — P2 | CSS: `:host { overflow: hidden }` may clip tooltips or dropdowns on slotted elements

**File:** `hx-ripple.styles.ts`, line 7

`:host { overflow: hidden }` clips the ripple wave at the component boundary. However, it also clips any overflow from the slotted element — including tooltips, dropdown menus, or focus rings that extend beyond the element's bounding box. If `<hx-button>` with a tooltip is slotted, the tooltip may be clipped.

The fix is to apply `overflow: hidden` only to `.ripple__base`, not the host, and ensure `.ripple__base` is clipped via `clip-path` or similar without affecting slotted content overflow. This requires `position: relative` on the host but not `overflow: hidden` on it.

---

### R-12 — P2 | Drupal: No Twig example or Drupal behavior usage documentation

**File:** N/A (absent)

The feature description requires documenting `hx-ripple` as applicable as an enhancement on interactive elements for Drupal consumers. There is no Twig template example, no Drupal behavior snippet, and no note in the stories or docs about how Drupal integrators should apply the component to existing interactive elements. Drupal is the primary consumer of this library.

---

## Audit Area Compliance Matrix

| Area | Requirement | Status |
|---|---|---|
| TypeScript | Strict, color typed | PASS |
| TypeScript | disabled prop typed | PASS |
| TypeScript | unbounded prop typed | **FAIL — R-01** |
| Accessibility | Purely decorative, `aria-hidden` on elements | PASS |
| Accessibility | `prefers-reduced-motion` completely disables effect | PASS (JS + CSS) |
| Accessibility | Does not interfere with focus management | PARTIAL — R-03 |
| Accessibility | Keyboard triggers ripple | **FAIL — R-02** |
| Accessibility | axe-core pass | PASS (2 tests) |
| Tests | Click triggers ripple | PASS (pointerdown) |
| Tests | Reduced motion disables | PASS |
| Tests | Keyboard triggers ripple | **FAIL — R-04** |
| Tests | Unbounded mode | **FAIL — R-01** |
| Tests | Disabled state | PASS |
| Tests | 80%+ coverage | UNKNOWN (not verified) |
| Storybook | On buttons | PASS |
| Storybook | On icons | **FAIL — R-05** |
| Storybook | Bounded/unbounded | **FAIL — R-01** |
| Storybook | Reduced motion demo | **FAIL — R-06** |
| CSS | `--hx-*` tokens for color/opacity | PASS |
| CSS | CSS animation (not JS) | PASS |
| CSS | CSS parts (ripple) | PASS |
| Performance | Bundle < 5KB | LIKELY PASS (not measured) |
| Performance | CSS-only animation (no rAF) | PASS |
| Drupal | Applicable as enhancement | UNDOCUMENTED — R-12 |

---

## Blocking Verdict

**This PR is blocked from merging.** The following must be resolved:

- **R-01 (P0):** Implement `unbounded` property with typed declaration, CSS handling (toggle `overflow: hidden` on/off), a Storybook story, and tests.
- **R-02 (P1):** Add `keydown` handler for Enter/Space keys to trigger ripple on keyboard interaction.
- **R-03 (P1):** Add `role="presentation"` (or `role="none"`) to the `<hx-ripple>` host to prevent screen reader pollution.
- **R-04 (P1):** Add tests covering keyboard-triggered ripple (Enter, Space).
- **R-05 (P1):** Add a Storybook story demonstrating ripple on icon-only buttons.
- **R-06 (P1):** Add a Storybook story demonstrating reduced-motion behavior.

P2 findings should be addressed before `main` promotion but are not individually blocking for `dev` merge.
