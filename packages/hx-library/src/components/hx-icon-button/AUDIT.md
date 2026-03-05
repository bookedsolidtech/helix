# Antagonistic Quality Audit — `hx-icon-button` (T1-02)

Audit date: 2026-03-05
Auditor: deep-review agent
Scope: All files in `packages/hx-library/src/components/hx-icon-button/`

---

## Summary

The component has a solid foundation: correct Shadow DOM structure, aria-label on the inner element, CSS-part exposure, and axe-core coverage. However, two P0 defects exist that render the component unsuitable for production use as-is: a broken form data contract and keyboard tests that provide false confidence. Several P1 issues around accessibility, visual inconsistency, and specification gaps compound the risk in a healthcare context.

| Severity | Count |
|----------|-------|
| P0       | 2     |
| P1       | 9     |
| P2       | 11    |

---

## P0 — Blocking (must fix before merge)

### P0-1 — Form name/value pair is never submitted via ElementInternals

**File:** `hx-icon-button.ts:84-92`, `hx-icon-button.ts:96-103`, `hx-icon-button.ts:139-145`
**File:** `hx-icon-button.test.ts:368-391`

The component declares `formAssociated = true` and attaches `ElementInternals`, which makes it a form-associated custom element. The `name` and `value` properties are forwarded to the inner `<button name=... value=...>` inside Shadow DOM. However, inner Shadow DOM controls are **not included** in the owning form's `FormData` — only the custom element itself is form-associated.

The component never calls `this._internals.setFormValue(this.name, this.value)`, which is the correct mechanism for a form-associated custom element to contribute its value to form data.

The test at `hx-icon-button.test.ts:368-391` ("submits name/value pair with form data") only verifies that:
1. The HTML attributes are set on the inner button (`btn.getAttribute('name')` / `btn.getAttribute('value')`)
2. The form `submit` event fires

It does **not** verify that `FormData` contains `action=save`. The test passes even though the name/value is not actually submitted. This is a silent contract violation.

**Impact:** Any consumer passing `name`/`value` to use the button as a form submit control with a specific value (e.g., a multi-submit form with different action values) will silently lose the value in submitted form data.

---

### P0-2 — Keyboard activation tests are structurally invalid

**File:** `hx-icon-button.test.ts:295-316`

Both keyboard tests ("Enter activates native button" and "Space activates native button") follow the same broken pattern:

```ts
btn?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
btn?.click();  // <-- this is what actually fires hx-click
const event = await eventPromise;
expect(event).toBeTruthy();
```

The `dispatchEvent(new KeyboardEvent(...))` has zero effect on the outcome — the native `<button>` does not respond to synthetic `keydown` events by activating. The `btn?.click()` call is what fires `hx-click`. The keyboard event dispatch is a no-op that the test then ignores.

These tests provide false assurance that Enter and Space keyboard activation work. They should use `userEvent.keyboard('{Enter}')` or `userEvent.keyboard(' ')` with the element focused, as demonstrated in the `KeyboardActivation` Storybook play function (which does this correctly).

**Impact:** Any keyboard activation regression in the component would go undetected by the test suite.

---

## P1 — High severity

### P1-1 — `loading` state is entirely absent

**File:** `hx-icon-button.ts` (missing)
**File:** `hx-icon-button.test.ts` (missing)
**File:** `hx-icon-button.stories.ts` (missing)

The feature specification explicitly requires testing "all states (default/disabled/loading)" and lists `loading` as a required state. The component has no `loading` property, no loading visual feedback (spinner, `aria-busy`, disabled-during-load), and no tests or stories for it. Five of six comparable libraries ship a loading state on icon buttons; the omission here is a specification gap.

---

### P1-2 — Disabled link loses semantic role

**File:** `hx-icon-button.ts:178-191`

When `href` is set and `disabled` is set, the component renders:
```html
<a aria-disabled="true" tabindex="-1">...</a>
```
The `href` attribute is removed (`ifDefined(this.disabled ? undefined : this.href)`). An `<a>` without `href` has **no implicit ARIA role** — it is a generic element. The element has `aria-disabled="true"` but no role, so screen readers may announce it as "group" or just plain text rather than as a disabled link. The correct pattern is to add `role="link"` explicitly when the href is withheld.

---

### P1-3 — Hover brightness filter conflicts with variant-specific hover backgrounds

**File:** `hx-icon-button.styles.ts:39-45`, `:84-86`, `:94-96`, `:104-106`, `:114-116`

The `.button:hover` rule (line 39) applies `filter: brightness(0.9)` universally. The secondary, tertiary, danger, and ghost variant hover rules additionally override `--hx-icon-button-bg` with a new color. The net result for those variants is that the new color is rendered AND then brightness-filtered — a double-darkening effect.

Primary is the only variant whose hover behavior is _only_ the brightness filter (no bg override). This creates visible inconsistency: primary hover looks different from all other variants under the same interaction. For the `danger` variant specifically, `brightness(0.9)` applied on top of `--hx-color-danger-600` makes the danger button visibly darker than intended on hover.

---

### P1-4 — Dead `connectedCallback` override

**File:** `hx-icon-button.ts:112-115`

```ts
override connectedCallback(): void {
  super.connectedCallback();
  // Label validation now happens in render() which enforces it by rendering nothing
}
```

This method does nothing but call `super()`. The comment explains it was once used for label validation. Dead overrides add confusion and maintenance surface — remove it.

---

### P1-5 — `title` tooltip is not keyboard or touch accessible

**File:** `hx-icon-button.ts:184,201` (both render branches)

The `title` attribute is applied to the inner button/anchor to provide a native tooltip. The HTML `title` tooltip has well-documented accessibility failures:
- Not shown on keyboard focus in most browsers (requires hover)
- Not available on touch-only devices
- Screen reader announcement of `title` is inconsistent across AT; `aria-label` takes precedence, so `title` is effectively ignored by most screen readers here

For a component that is explicitly an icon-only button — where the label is the _only_ means of communicating purpose — relying on `title` for tooltip display is insufficient. The component should integrate with `hx-tooltip` or document that callers must pair it with one.

---

### P1-6 — Test suite does not verify FormData content

**File:** `hx-icon-button.test.ts:368-391`

(Related to P0-1 but distinct issue.) The test titled "submits name/value pair with form data" verifies form submission occurred (`submitted = true`) but does not capture and inspect the `FormData`. The correct assertion would use `new FormData(form)` in the submit handler and verify `formData.get('action') === 'save'`. The test name is therefore misleading — it tests "form submits" not "name/value is in the form data."

---

### P1-7 — Stale screenshot filenames reference non-existent test

**File:** `__screenshots__/hx-icon-button.test.ts/hx-icon-button-Property--label-warns-via-console-warn-when-label-is-empty-1.png`

This screenshot filename encodes the test path `Property: label > warns via console.warn when label is empty`. No test with this name or description exists in `hx-icon-button.test.ts`. The closest test is "renders nothing when label is empty" (line 65), which does not test the `console.warn` call. Either:
1. The test was renamed after the screenshot was captured (screenshots are stale), or
2. A `console.warn` assertion test was deleted

The `console.warn` call in `render()` (line 171) is untested.

---

### P1-8 — Whitespace-only `label` triggers warn and silent disappearance but is untested

**File:** `hx-icon-button.ts:150-152`, `hx-icon-button.test.ts` (missing)

The `_normalizedLabel()` method calls `.trim()`, meaning `label="   "` (whitespace only) renders nothing and emits a console warning. This edge case is not tested. In a healthcare UI where a Drupal template might emit whitespace in a label binding, a button that renders nothing silently is a high-risk failure mode.

---

### P1-9 — Kitchen-sink stories use hardcoded color values

**File:** `hx-icon-button.stories.ts:442-462` (AllVariants), `:468-489` (AllSizes), `:493-524` (AllStates), `:536-613` (ToolbarExample), `:615-745` (TableRowActions)

Label/annotation text in kitchen-sink stories uses hardcoded hex values throughout: `#6b7280`, `#374151`, `#111827`, `#065f46`, `#92400e`. Per the project non-negotiable: "No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always." This violation appears in documentation context but stories are compiled code that sets the example pattern for consumers.

---

## P2 — Medium severity

### P2-1 — `label` default `''` provides no TypeScript enforcement of "required"

**File:** `hx-icon-button.ts:41-42`

The JSDoc says `label` is "Required," but the TypeScript type is `string` with a default of `''`. TypeScript callers can omit `label` with no type error. A stricter option would be to make the property required in the constructor or document via a branded type. At minimum, the type should reflect that the empty string is a degenerate case, not a valid default.

---

### P2-2 — `_canvas` in `Default` story play function is declared but never used

**File:** `hx-icon-button.stories.ts:236`

```ts
const _canvas = within(canvasElement);
```

This variable is unused. The underscore prefix suppresses linting, masking dead code. Remove the import of `within` and the variable if unused.

---

### P2-3 — `aria-disabled` on native `<button disabled>` is redundant

**File:** `hx-icon-button.ts:201`

When a native `<button>` element has the `disabled` attribute, it is already represented as disabled in the accessibility tree. Adding `aria-disabled="true"` alongside the native `disabled` is redundant. ARIA attributes should not repeat what native semantics already communicate. The attribute on the button case should be removed; `aria-disabled` is only necessary on non-natively-disableable elements (like `<a>`).

---

### P2-4 — `pointer-events: none` on `:host([disabled])` makes `cursor: not-allowed` invisible

**File:** `hx-icon-button.styles.ts:8-11`, `:132-134`

The `:host([disabled])` rule sets `pointer-events: none`, which prevents the browser from processing any pointer events (including `mousemove`). The `.button[disabled]` rule sets `cursor: not-allowed`, but because pointer events are blocked at the host boundary, the cursor never changes. Users hovering over a disabled icon button see the default cursor rather than the `not-allowed` indicator. Consider using `cursor: not-allowed` on `:host([disabled])` instead.

---

### P2-5 — Missing `box-sizing: border-box` on `.button`

**File:** `hx-icon-button.styles.ts:13-31`

The button has explicit `width` and `height` set per size variant, but no `box-sizing: border-box`. If the border is thickened (e.g., via consumer token override for `--hx-border-width-thin`), the total rendered size grows beyond the declared width/height. This breaks the "square button" invariant. Best practice for any fixed-size element is explicit `box-sizing: border-box`.

---

### P2-6 — Danger variant hover uses a primitive color token directly

**File:** `hx-icon-button.styles.ts:104-106`

```css
.button--danger:hover {
  --hx-icon-button-bg: var(--hx-color-danger-600);
}
```

Per the design token architecture: components should consume at the component level with semantic fallbacks, not reach to primitive tokens directly. `--hx-color-danger-600` is a primitive. The correct approach is a semantic token like `--hx-color-danger-hover` or a component-level token `--hx-icon-button-bg-danger-hover`.

---

### P2-7 — `--hx-filter-brightness-hover` / `--hx-filter-brightness-active` are non-standard tokens

**File:** `hx-icon-button.styles.ts:40-44`

```css
filter: brightness(var(--hx-filter-brightness-hover, 0.9));
filter: brightness(var(--hx-filter-brightness-active, 0.8));
```

These token names do not appear in the project's design token system. They are effectively local CSS variables with hardcoded fallbacks dressed up as tokens. Either register them in the token system or use the hardcoded values directly.

---

### P2-8 — Link mode has no `target` attribute support

**File:** `hx-icon-button.ts:77-78`, `:178-191`

The `href` mode renders an `<a>` element but offers no `target` attribute. Consumers cannot open the link in a new tab or named frame. This is a missing capability relative to what a native `<a>` element provides. At minimum, `target` (and `rel` for security when `target="_blank"`) should be supported.

---

### P2-9 — `_handleClick` disabled guard is dead code for the button case

**File:** `hx-icon-button.ts:119-125`

The native `<button disabled>` element does not fire `click` events. The `:host([disabled]) { pointer-events: none }` style additionally blocks mouse clicks at the host boundary. The `if (this.disabled) { e.preventDefault(); e.stopPropagation(); return; }` guard in `_handleClick` cannot be reached via normal user interaction when the button is disabled. It could intercept a programmatic `el.click()` call, but that path is untested.

---

### P2-10 — `AsLink` story uses non-null assertion

**File:** `hx-icon-button.stories.ts:428`

```ts
href=${args.href!}
```

Non-null assertions (`!`) are a project zero-tolerance violation per "No `any` types" and broader strict-mode intent. Even in story files this sets a bad example. `ifDefined(args.href)` should be used instead, consistent with the `Default` render function.

---

### P2-11 — No test for `el.form` returning the associated form element

**File:** `hx-icon-button.test.ts:340-344`

The test "has ElementInternals attached (form getter returns null outside form)" only verifies the null case. There is no test that places the element inside a `<form>` and asserts `el.form` returns that form. Without this, the `form` getter could be broken and the tests would not catch it.

---

## Files Reviewed

| File | LOC | Notes |
|------|-----|-------|
| `hx-icon-button.ts` | 218 | Component implementation |
| `hx-icon-button.styles.ts` | 143 | Styles |
| `hx-icon-button.test.ts` | 453 | Vitest browser tests |
| `hx-icon-button.stories.ts` | 884 | Storybook stories |
| `index.ts` | 1 | Re-export |

---

## Recommended Fix Priority

1. **P0-1** — Implement `this._internals.setFormValue(this.name, this.value)` and fix the form data test assertion.
2. **P0-2** — Replace fake keyboard tests with real `userEvent.keyboard` activation tests.
3. **P1-1** — Define and implement `loading` state (property, aria-busy, spinner, test, story).
4. **P1-2** — Add `role="link"` to the disabled anchor element.
5. **P1-3** — Resolve hover filter + bg-color conflict; pick one mechanism per variant and apply consistently.
6. **P1-4** — Remove dead `connectedCallback` override.
7. **P1-5** — Document tooltip limitation; add guidance for pairing with `hx-tooltip`.
8. **P1-6** — Fix form data test to assert `FormData` contents.
9. **P1-7** — Delete stale screenshot; add `console.warn` assertion test.
10. **P1-8** — Add whitespace-only label test.
11. **P1-9** — Replace hardcoded hex colors in stories with design tokens.
