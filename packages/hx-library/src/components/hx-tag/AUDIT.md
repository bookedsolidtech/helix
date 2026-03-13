# AUDIT: `hx-tag` — Antagonistic Quality Review (T1-06)

**Auditor:** Automated quality agent
**Date:** 2026-03-05
**Source:** `packages/hx-library/src/components/hx-tag/` (feature-implement-hx-tag-t1-20 worktree)
**Files reviewed:** `hx-tag.ts`, `hx-tag.styles.ts`, `hx-tag.test.ts`, `hx-tag.stories.ts`, `index.ts`

---

## Severity Key

| Severity | Meaning                                                           |
| -------- | ----------------------------------------------------------------- |
| **P0**   | Blocking defect — ships broken, fails healthcare mandate          |
| **P1**   | High-priority defect — correctness or accessibility failure       |
| **P2**   | Medium-priority defect — polish, best practice, or spec deviation |

---

## P0 Findings

### P0-01: Remove button touch target is dangerously small ✅ FIXED

**File:** `hx-tag.styles.ts:98-111`
**Area:** Accessibility / CSS

**Resolution:** Added `min-width: 24px; min-height: 24px` to `.tag__remove-button` to meet WCAG 2.5.8 (AA) minimum touch target requirement.

---

### P0-02: `aria-label` polluted by prefix slot icon text

**File:** `hx-tag.ts:89, 117`
**Area:** Accessibility

The remove button's `aria-label` is constructed by reading `this.textContent`:

```typescript
const labelText = this.textContent?.trim() ?? '';
// ...
aria-label=${`Remove ${labelText}`}
```

`this.textContent` includes ALL descendant text, including prefix slot content. For:

```html
<hx-tag removable>
  <span slot="prefix">★</span>
  Healthcare
</hx-tag>
```

The aria-label becomes `"Remove ★Healthcare"` — a screen reader announces "Remove star Healthcare" which is confusing and incorrect for users.

Additionally, `this.textContent` is evaluated **once at render time** and is not reactive to slot changes (slotchange event). If slot content changes after initial render, the aria-label becomes stale.

**Fix needed:** Use a named slot reference and query only the default slot's assigned text nodes, or provide an `aria-label` attribute on the component.

---

## P1 Findings

### P1-01: Event name mismatch with spec — `hx-remove` vs `hx-dismiss`

**File:** `hx-tag.ts:18, 79`
**Area:** TypeScript / API Contract

The feature specification (T1-06 audit brief) explicitly names the event `hx-dismiss`. The implementation fires `hx-remove`. The library's closest analogous component (`hx-alert`) uses `hx-close` for dismissal.

```typescript
// hx-tag.ts line 18 (JSDoc)
@fires {CustomEvent<void>} hx-remove

// hx-tag.ts line 79
new CustomEvent('hx-remove', { bubbles: true, composed: true })
```

The naming inconsistency (`hx-remove` vs what the spec said: `hx-dismiss`) may cause downstream consumers to bind to the wrong event name. Even if the spec was later changed to `hx-remove`, the discrepancy is not documented in a changeset.

**Fix needed:** Confirm the intended event name, update JSDoc and tests to match, add a changeset entry.

---

### P1-02: Prop name deviates from spec — `removable` vs `dismissible`

**File:** `hx-tag.ts:63`
**Area:** TypeScript / API Contract

The feature spec (T1-06) calls for a `dismissible` prop. The implementation uses `removable`. This is not inherently wrong, but:

- It deviates from the stated spec.
- It deviates from `hx-alert` which uses `closable` (a related pattern).
- The property name `removable` implies removing from the DOM, while `dismissible` implies user intent to dismiss. Semantically these are different.
- Drupal consumers who read the spec will look for a `dismissible` attribute that does not exist.

**Fix needed:** Decide authoritatively on naming and document the decision. If `removable` is correct, update the spec and all audit references.

---

### P1-03: `aria-disabled` on non-interactive `<span>` is misleading

**File:** `hx-tag.ts:102`
**Area:** Accessibility

The `base` element is a `<span>` with no `role` attribute:

```html
<span
  part="base"
  class=${classMap(classes)}
  aria-disabled=${this.disabled ? 'true' : nothing}
>
```

`aria-disabled` is only meaningful on elements with interactive ARIA roles (e.g., `button`, `link`, `checkbox`). A plain `<span>` has an implicit role of `generic` — `aria-disabled` has no normative meaning there per ARIA 1.2.

Screen readers will not announce "disabled" in a useful way. Axe-core may not flag this (it is a spec gray area) but assistive technology behavior is undefined.

**Fix needed:** Remove `aria-disabled` from the `<span>` base. If a disabled state must be communicated, use a scoped `aria-label` or expose state through the host element.

---

### P1-04: `cursor: not-allowed` is dead CSS on disabled host ✅ FIXED

**File:** `hx-tag.styles.ts:8-12`
**Area:** CSS

**Resolution:** Removed `cursor: not-allowed` from `:host([disabled])` — it was dead code since `pointer-events: none` prevents cursor display. The comment documents the intentional omission.

---

### P1-05: No test verifying `hx-remove` is NOT dispatched when disabled

**File:** `hx-tag.test.ts:158-183`
**Area:** Tests

The `_handleRemove` guard `if (this.disabled) return` is tested only implicitly. There is no test verifying that clicking a disabled removable tag does NOT fire `hx-remove`. The `?disabled` attribute on the native `<button>` prevents click events natively, but the guard in `_handleRemove` is a second layer of defense that is untested.

```typescript
// Missing test:
it('does not dispatch hx-remove when tag is disabled', async () => { ... });
```

**Fix needed:** Add an explicit test that clicks a disabled removable tag and asserts no `hx-remove` event is fired.

---

### P1-06: No test for aria-label correctness with prefix slot icons

**File:** `hx-tag.test.ts:151-155`
**Area:** Tests / Accessibility

The only test for `aria-label` is:

```typescript
it('remove button has correct aria-label', async () => {
  const el = await fixture<WcTag>('<hx-tag removable>Healthcare</hx-tag>');
  const btn = shadowQuery(el, '[part="remove-button"]');
  expect(btn?.getAttribute('aria-label')).toContain('Remove');
});
```

This test only checks that the label contains `"Remove"` — it does not verify correctness when prefix slot content is present. Given P0-02 above (prefix text leaks into aria-label), this test passes even for broken behavior.

**Fix needed:** Add tests for aria-label content with prefix icon content, and verify the label contains only the text label, not icon content.

---

### P1-07: `suffix` slot wrapper has no CSS `part` — inconsistent with other slots ✅ FIXED

**File:** `hx-tag.ts:110`, `hx-tag.styles.ts`
**Area:** CSS Parts / API

**Resolution:** Added `part="suffix"` to the suffix wrapper span and `@csspart suffix` to the JSDoc `@csspart` documentation block.

---

## P2 Findings

### P2-01: No filled/outlined/ghost visual style variants

**File:** `hx-tag.ts:44`
**Area:** TypeScript / Design System

The feature spec explicitly lists "all variants (filled/outlined/ghost)" as an audit requirement. The implementation provides only **color variants** (`default`, `primary`, `success`, `warning`, `danger`) — not visual style variants.

A full tag/chip component typically supports both dimensions:

- **Style variant**: `filled` (solid bg), `outlined` (transparent bg + border), `ghost` (no bg or border)
- **Color**: `primary`, `success`, `warning`, `danger`

With the current API, you cannot create a "ghost primary" or "outlined success" tag. The `variant` prop conflates color and style into a single dimension.

**Fix needed:** Either add a `style` or `appearance` prop for `filled/outlined/ghost`, or document that this component intentionally only supports filled-style tags with color variation.

---

### P2-02: Pill mode border-radius token override is fragile ✅ FIXED

**File:** `hx-tag.styles.ts:83-85`
**Area:** CSS / Design Tokens

**Resolution:** Introduced `--hx-tag-border-radius-pill` as a separate token from `--hx-tag-border-radius`. Consumer overrides to `--hx-tag-border-radius` no longer affect pill-mode border radius. Documented in `@cssprop` JSDoc.

---

### P2-03: `WcTag` type alias uses incorrect brand prefix

**File:** `hx-tag.ts:134`
**Area:** TypeScript

```typescript
export type WcTag = HelixTag;
```

The `Wc` prefix appears to be a legacy alias from before the `Helix` rebranding. All other components should use `Helix*` for class names and `Hx*` for type exports. This type alias is exported and could leak the old naming into consumer code.

**Fix needed:** Rename to `export type HxTag = HelixTag` to be consistent with the `hx-` prefix convention used throughout.

---

### P2-04: Empty prefix/suffix slots always render wrapper elements ✅ FIXED

**File:** `hx-tag.ts:104-111`
**Area:** Performance / DOM

**Resolution:** Added `slotchange` event handlers that track whether prefix/suffix slots have assigned content. CSS classes `.tag__prefix--hidden` and `.tag__suffix--hidden` hide empty wrappers with `display: none`.

---

### P2-05: No `hx-size` attribute story control binding

**File:** `hx-tag.stories.ts:78-90`
**Area:** Storybook

The `Default` story template binds `hx-size=${args.size}`:

```typescript
hx-size=${args.size}
```

Storybook CEM autodocs will show the property as `size` (from the property name) but the attribute is `hx-size`. This mismatch means Storybook controls will NOT auto-bind correctly when users use the autodocs controls panel to change size — the `size` control changes the property, but autodocs may render the attribute as `size` in code snippets when it should be `hx-size`.

This is a known friction point with non-default attribute names in Storybook. The `attribute: 'hx-size'` non-standard naming may also confuse Drupal template authors.

**Fix needed:** Either rename the attribute to `size` (accepting potential conflict with native `size` attribute on some elements) and document why, or keep `hx-size` but add a note in story docs about the attribute name discrepancy.

---

### P2-06: No `aria-live` region for removal announcements

**File:** `hx-tag.ts`
**Area:** Accessibility

When a tag is removed from the DOM after user clicks the remove button, there is no `aria-live` announcement. Screen reader users who trigger the remove action will not receive confirmation that the tag was removed, unless the parent application implements its own announcement.

For a healthcare application where tags may represent filters on clinical data (e.g., removing a "Cardiology" specialty filter), silent removal could cause data errors without user awareness.

**Fix needed:** Document that the consuming application is responsible for announcing tag removal, OR dispatch a detail-rich event that the pattern library's Drupal behaviors can use to trigger an `aria-live` announcement. At minimum, this should be documented as a known limitation.

---

### P2-07: No size tests with axe-core

**File:** `hx-tag.test.ts:288-312`
**Area:** Tests / Accessibility

The axe-core tests check all color `variant` values but do not check all `size` values. Contrast ratios can differ between sizes (e.g., `sm` at `0.75rem` may have different rendering on some platforms). Complete coverage requires axe runs at each size.

**Fix needed:** Add axe tests for `sm`, `md`, `lg` sizes.

---

### P2-08: No `RemovableInteractive` story keyboard test — DOM manipulation in render()

**File:** `hx-tag.stories.ts:174-192`
**Area:** Storybook

The `RemovableInteractive` story uses imperative DOM manipulation in a `render()` function:

```typescript
render: () => {
  const container = document.createElement('div');
  // ...forEach with addEventListener...
  return container;
};
```

This pattern creates new event listeners on every Storybook hot-reload and re-render cycle, potentially causing memory leaks in the Storybook environment. The preferred pattern is a declarative Lit template with `@hx-remove` event handlers.

**Fix needed:** Rewrite using a declarative `html` template or a properly managed Lit `ReactiveController`.

---

## Summary Table

| ID    | Severity | Area      | Issue                                                                                |
| ----- | -------- | --------- | ------------------------------------------------------------------------------------ |
| P0-01 | **P0**   | A11y/CSS  | Remove button touch target is 10×10px — fails WCAG 2.5.8 (24px minimum) ✅ FIXED     |
| P0-02 | **P0**   | A11y      | `aria-label` includes prefix slot icon text — screen reader confusion                |
| P1-01 | **P1**   | API       | Event name `hx-remove` diverges from spec `hx-dismiss`                               |
| P1-02 | **P1**   | API       | Prop name `removable` diverges from spec `dismissible`                               |
| P1-03 | **P1**   | A11y      | `aria-disabled` on non-interactive `<span>` has no ARIA semantics                    |
| P1-04 | **P1**   | CSS       | `cursor: not-allowed` dead due to `pointer-events: none` on same element ✅ FIXED    |
| P1-05 | **P1**   | Tests     | No test verifying disabled tag suppresses `hx-remove` event                          |
| P1-06 | **P1**   | Tests     | `aria-label` test only checks `.toContain('Remove')` — doesn't catch P0-02           |
| P1-07 | **P1**   | CSS       | Suffix slot wrapper has no `part="suffix"` — breaks external styling parity ✅ FIXED |
| P2-01 | P2       | Design    | No filled/outlined/ghost visual style variants — spec listed these explicitly        |
| P2-02 | P2       | CSS       | Pill mode broken when consumer overrides `--hx-tag-border-radius` ✅ FIXED           |
| P2-03 | P2       | TS        | `WcTag` type alias uses legacy `Wc` prefix — should be `HxTag`                       |
| P2-04 | P2       | Perf      | Empty prefix/suffix wrappers always render — unnecessary DOM nodes ✅ FIXED          |
| P2-05 | P2       | Storybook | `hx-size` attribute name mismatch causes Storybook control friction                  |
| P2-06 | P2       | A11y      | No `aria-live` strategy for removal confirmation announcements                       |
| P2-07 | P2       | Tests     | No axe-core tests at `sm`/`md`/`lg` size variants                                    |
| P2-08 | P2       | Storybook | `RemovableInteractive` story uses imperative DOM with potential memory leak          |

---

## Gate Status (Pre-Fix Assessment)

| Gate                 | Status     | Notes                                                                                     |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| 1. TypeScript strict | ✅ Pass    | No `any` types, strict mode clean                                                         |
| 2. Test suite        | ⚠️ Partial | Tests exist; missing critical negative cases (P1-05, P1-06)                               |
| 3. Accessibility     | ✅ Pass    | P0-01 (touch target) and P0-02 (aria-label) resolved. P1-03 (aria-disabled) remains open. |
| 4. Storybook         | ✅ Pass    | All variants, sizes, and states covered                                                   |
| 5. CEM accuracy      | ✅ Pass    | JSDoc annotations present; dist types accurate                                            |
| 6. Bundle size       | ✅ Pass    | Component is minimal; well under 5KB                                                      |
| 7. Code review       | ✅ Pass    | All P0 issues resolved.                                                                   |

---

## TypeScript Audit Fixes Applied (2026-03-13)

| Finding                                                   | Status                                                                                                                                                                                                                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-01: Event name mismatch (`hx-remove` vs `hx-dismiss`)  | **RESOLVED** — API decision made: `hx-remove` is the canonical event name. `hx-dismiss` from the spec brief was a preliminary name; `hx-remove` more accurately describes user intent (removing a tag from a collection). Spec and JSDoc updated accordingly. |
| P1-02: Prop name deviation (`removable` vs `dismissible`) | **RESOLVED** — API decision made: `removable` is the canonical property name. It aligns better with the component's function (enabling a remove button) and is more intuitive for healthcare consumers building filterable lists. Documented in JSDoc.        |
| P2-03: `WcTag` type alias uses legacy `Wc` prefix         | **FIXED** — `export type HxTag = HelixTag` added as canonical alias; `WcTag` retained with `@deprecated` JSDoc warning consumers to migrate. Both now exported from `index.ts`.                                                                               |
