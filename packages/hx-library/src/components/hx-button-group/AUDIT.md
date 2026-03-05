# hx-button-group — Quality Audit (T1-03)

Auditor: antagonistic review pass
Files reviewed: `hx-button-group.ts`, `hx-button-group.styles.ts`, `hx-button-group.test.ts`, `hx-button-group.stories.ts`, `index.ts`
Cross-referenced: `packages/hx-library/src/components/hx-button/` (for size cascade verification)

---

## P0 — Critical (must fix before merge)

### P0-01: `--hx-button-group-size` cascade is completely non-functional

**File:** `hx-button-group.ts:66`, `hx-button-group.stories.ts`

The component sets `--hx-button-group-size` as a CSS custom property with a string identifier value (`'sm'`, `'md'`, `'lg'`):

```ts
this.style.setProperty('--hx-button-group-size', this.size);
```

A grep of `packages/hx-library/src/components/hx-button/` for `hx-button-group-size` returns **zero matches**. `hx-button` never reads this property. The size cascade the component claims to provide via `--hx-button-group-size` is entirely inert.

**Evidence of workaround:** Every story in `hx-button-group.stories.ts` that sets a size manually applies `hx-size` to both the group element AND each individual child button (e.g., `SmallSize`, `MediumSize`, `LargeSize`). This pattern contradicts the component's stated API and confirms the cascade does not work.

**Impact:** The `hx-size` prop, the `@cssprop` JSDoc for `--hx-button-group-size`, and the corresponding tests (`Property: size`) all document a feature that silently fails at runtime. Consumers who rely on the group-level `hx-size` prop will see no size change on child buttons.

---

### P0-02: `::slotted(:focus-within)` CSS selector is invalid and non-functional

**File:** `hx-button-group.styles.ts:89`

```css
.group ::slotted(:focus-within) {
  z-index: 1;
  position: relative;
}
```

The CSS `::slotted()` pseudo-element argument must be a **simple selector**. `:focus-within` is a relational pseudo-class, not a simple selector, and is not a valid argument inside `::slotted()`. Browsers silently drop invalid `::slotted()` rules.

**Impact:** The mechanism intended to raise focused buttons above their siblings (to prevent shared-border clipping of the focus ring) is completely broken. In a button group, the overlapping negative-margin layout causes the focus ring of a non-last button to be clipped by the z-index of its right/bottom sibling. No browser will apply this rule. This is a direct WCAG 2.4.11 violation (Focus Appearance) in healthcare contexts where keyboard navigation is mandatory.

**Fix direction:** Apply a class or attribute to the focused child from a `focusin`/`focusout` event listener on the host, then use `::slotted(.is-focused)` which is a valid simple selector.

---

## P1 — High (significant quality gaps)

### P1-01: `@media (prefers-reduced-motion)` rule is non-functional across Shadow DOM

**File:** `hx-button-group.styles.ts:96`

```css
@media (prefers-reduced-motion: reduce) {
  .group ::slotted(*) {
    transition: none;
  }
}
```

Shadow DOM encapsulation is bidirectional. The `hx-button-group` shadow root **cannot override styles inside `hx-button`'s shadow root** via `::slotted(*)`. `::slotted()` applies to the slotted element's host-context styles, not to styles inside the child's own shadow tree. Since `hx-button` defines its transitions inside its own shadow DOM, this `transition: none` rule has zero effect.

**Impact:** Users with `prefers-reduced-motion` still see button transition animations when interacting with a grouped button set. This is a WCAG 2.3.3 (Motion from Animation) violation.

**Fix direction:** `hx-button` must respond to `prefers-reduced-motion` internally. The group cannot fix this from outside.

---

### P1-02: No test verifies that `label` property actually sets `internals.ariaLabel`

**File:** `hx-button-group.test.ts:150`

The sole `label` test only asserts:
```ts
expect(el.label).toBe('Form actions');
```

This confirms the DOM property round-trip, not the accessibility effect. There is no assertion that `el.internals.ariaLabel === 'Form actions'` or that the computed accessible name of the group is correct. `ElementInternals` properties are not reflected as DOM attributes, so `getAttribute('aria-label')` will also return `null` — meaning a simple DOM check can't substitute for the missing assertion.

**Impact:** Regression risk. The label mechanism could be silently broken with no failing test.

---

### P1-03: No keyboard navigation tests

**File:** `hx-button-group.test.ts`

The test suite has zero keyboard interaction tests. There is no test for:
- Tab key moving focus through buttons in horizontal orientation
- Tab key moving focus through buttons in vertical orientation
- Shift+Tab reverse traversal
- Disabled children being skipped by Tab

For a `role="group"` container in a healthcare application where keyboard navigation is a WCAG 2.1 AA requirement, the absence of keyboard interaction tests is a material quality gap.

---

### P1-04: No test for disabled child buttons

**File:** `hx-button-group.test.ts`

No test exercises a group containing a `disabled` `hx-button`. Questions that need test coverage:
- Does the border/radius CSS still render correctly with mixed enabled/disabled buttons?
- Does a disabled button at position `:first-child` or `:last-child` correctly affect border-radius?
- Does axe-core pass with a group containing disabled buttons?

---

### P1-05: `label` property missing from Storybook `argTypes`

**File:** `hx-button-group.stories.ts:15`

The `argTypes` object defines controls for `orientation` and `size`, but not `label`. Storybook autodocs will show the prop (from CEM), but the Controls panel will have no widget for it, making it invisible to developers exploring the component interactively.

---

### P1-06: No story demonstrating the `label` property

**File:** `hx-button-group.stories.ts`

Every story that uses an accessible label uses the HTML `aria-label` attribute directly (e.g., `PatientRecord`). No story demonstrates the component's own `label` property. A `WithLabel` story showing both mechanisms (property vs. attribute) is missing.

---

### P1-07: Mixed-variant tests absent from test suite

**File:** `hx-button-group.test.ts`

No test exercises a group with mixed button variants (`primary` + `secondary` + `ghost`). The `MixedVariants` story exists in Storybook but has no corresponding browser test. Mixed variants can produce unexpected border behavior (different border colors from different variants create visible seams at join points).

---

## P2 — Medium (quality debt)

### P2-01: `private internals` should be `#internals` (ES private field)

**File:** `hx-button-group.ts:26`

```ts
private internals: ElementInternals;
```

TypeScript's `private` keyword is compile-time only — it is erased at runtime. Any external code can access `el.internals` at runtime. ES private fields (`#internals`) provide true encapsulation that survives compilation and is enforced by the JavaScript engine. The project uses `LitElement` which uses `#` fields internally; consistency requires `#internals` here.

---

### P2-02: Stories manually set `hx-size` on individual buttons — contradicts stated API

**File:** `hx-button-group.stories.ts:116,130,144`

```ts
// SmallSize story
<hx-button-group hx-size="sm">
  <hx-button variant="secondary" hx-size="sm">Edit</hx-button>
```

If the group is supposed to cascade size via `--hx-button-group-size`, the children should not need `hx-size` set individually. This is both confusing API documentation for consumers and evidence that the cascade (P0-01) was known not to work during story authoring.

---

### P2-03: No `@cssprop` JSDoc for `--hx-button-border-radius`

**File:** `hx-button-group.ts:20`

The component's JSDoc documents `--hx-button-group-size` but not `--hx-button-border-radius`, which is set on slotted children via `::slotted()` rules. This is a public API surface — consumers wrapping a custom element inside a group need to know that this variable will be overridden. CEM will not capture it.

---

### P2-04: `hx-icon-button` documented in slot but never tested or demonstrated

**File:** `hx-button-group.ts:16`, `hx-button-group.test.ts`, `hx-button-group.stories.ts`

The `@slot` JSDoc states the default slot accepts `hx-button and hx-icon-button children`. No test or story includes an `hx-icon-button`. If `hx-icon-button` has a different internal structure (different border properties, different focus behavior), it may not render correctly inside a button group.

---

### P2-05: `_handleSlotChange` calls `requestUpdate` unconditionally

**File:** `hx-button-group.ts:84`

```ts
private _handleSlotChange(): void {
  this.requestUpdate();
}
```

The comment claims this is needed for `::slotted` CSS re-evaluation. However:
1. Lit's reactive update cycle already re-evaluates `::slotted` selectors after slot changes.
2. `requestUpdate()` triggers a full re-render on every slot mutation, including cases where no visual change occurred.
3. This causes a performance cost for dynamic slot manipulation (e.g., adding/removing buttons programmatically).

The comment is a maintenance trap: it implies the re-render is necessary, which future developers will not question.

---

### P2-06: No `WithDisabledButtons` story

**File:** `hx-button-group.stories.ts`

No story renders a group with one or more `disabled` children. The visual result (partial border collapse with a greyed-out button) is a common UX pattern in form toolbars that consumers need to preview.

---

## P3 — Informational / Low

### P3-01: `role="group"` without accessible name is valid but inadvisable in healthcare

**File:** `hx-button-group.ts:57`

The default state (no `label`, no `aria-label`) produces a `role="group"` element with no accessible name. ARIA spec does not require groups to have names, and axe-core does not flag this as a violation. However, the WCAG 2.4.6 success criterion (Headings and Labels) and clinical workflow accessibility guidelines recommend that all landmark/grouping elements have descriptive labels. Given the healthcare mandate, this should be treated as a best-practice requirement and clearly documented.

---

### P3-02: `--hx-button-group-size` uses a string identifier, not a CSS value

**File:** `hx-button-group.ts:66`

CSS custom properties are designed to hold CSS values (lengths, colors, identifiers recognized by CSS properties). Using a string like `'sm'` as a custom property value is non-standard. If the cascade were to work, `hx-button` would need to parse this string and map it to internal tokens via `@container style()` queries or `env()` references — both of which have limited browser support. A more robust design would cascade actual CSS values (e.g., `--hx-button-group-min-height: 2rem`) rather than abstract identifiers.

---

### P3-03: No bundle size data in component directory

**File:** `hx-button-group/` (directory)

No recorded baseline for the component's minified + gzipped bundle size. The quality gate requires `<5KB`. The component is simple and almost certainly passes, but without a recorded baseline, regressions cannot be detected. A `BUNDLE.md` or CI annotation with the measured value is recommended.

---

### P3-04: `connectedCallback` and `updated` both set `ariaLabel` — duplicated logic

**File:** `hx-button-group.ts:69,77`

`ariaLabel` is set in both `connectedCallback` (for initial connection) and `updated` (for property changes). The `connectedCallback` path only fires when `this.label` is truthy. The `updated` path handles both truthy and falsy (sets `null` when empty). This is fine functionally but the duplication increases maintenance risk — a future developer patching one branch may miss the other.

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 2 | Size cascade broken; focus-ring rule uses invalid CSS selector |
| P1 | 7 | Non-functional reduced-motion; missing label/keyboard/disabled tests; Storybook gaps |
| P2 | 6 | Private field convention; story inconsistency; missing JSDoc; unused slot type |
| P3 | 4 | Informational / best-practice observations |

The two P0 findings represent silent functional failures: the size cascade property is documented but inert, and the focus-ring fix for shared-border layout uses an invalid CSS selector that all browsers silently discard. Both must be resolved before this component can be considered production-ready.
