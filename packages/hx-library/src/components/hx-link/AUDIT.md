# AUDIT: hx-link — T1-05 Antagonistic Quality Review

**Reviewer:** Autonomous audit agent
**Date:** 2026-03-05
**Source branch:** `feature/implement-hx-link-t1-04-hyperlink`
**Files reviewed:**
- `hx-link.ts` — component class
- `hx-link.styles.ts` — Lit CSS
- `hx-link.test.ts` — Vitest browser tests
- `hx-link.stories.ts` — Storybook stories
- `index.ts` — re-export

---

## Summary

The implementation is largely well-structured — uses semantic `<a>`, auto-injects
`noopener noreferrer` on `_blank`, has sr-only new-tab text, and passes axe-core in
tests. However, there are two blocking accessibility bugs and several P1/P2 gaps.

---

## Findings

### P0 — Blocking

#### P0-1: Disabled state is not keyboard accessible

**File:** `hx-link.ts`, `render()` — disabled branch
**Location:** `hx-link.ts:119`

When `disabled=true` the component renders:
```html
<span part="base" role="link" aria-disabled="true">…</span>
```

A `<span>` is not natively focusable. Without `tabindex="0"` the disabled link is
completely invisible to keyboard users — Tab skips over it entirely. This violates
**WCAG 2.1 SC 2.1.1 (Keyboard)**.

The `role="link"` declaration _implies_ the element is reachable, but without a
`tabindex` attribute it is not. Screen readers following keyboard navigation will
never announce it.

**Fix required:** Add `tabindex="0"` to the disabled span.

---

#### P0-2: Disabled click test is trivially vacuous — never fires a click

**File:** `hx-link.test.ts` lines 142–152

```ts
it('does NOT dispatch hx-click when disabled', async () => {
  const el = await fixture<HelixLink>('<hx-link disabled>Link</hx-link>');
  let fired = false;
  el.addEventListener('hx-click', () => { fired = true; });
  await el.updateComplete;
  expect(fired).toBe(false);   // Always passes — nothing was ever clicked
});
```

This test adds a listener and then immediately asserts no event was fired — it
never attempts a click interaction. It would pass even if disabled state was
completely broken. A real assertion requires clicking the disabled span and verifying
the event doesn't fire.

**Fix required:** Click the disabled span element and assert `fired` remains `false`.

---

### P1 — High Priority

#### P1-1: Missing new-tab icon — only sr-only text is present

**File:** `hx-link.ts` `_renderInner()`, `hx-link.styles.ts`
**Feature spec:** "opens-in-new-tab warning (icon + sr-only text)"

The implementation provides the sr-only text `(opens in new tab)` but **no visible
icon**. The feature description explicitly requires both. Sighted users receive no
visual affordance that the link opens in a new tab. This is a significant UX gap in a
healthcare context where unexpected navigation could disorient users mid-task.

**Fix required:** Add a small external-link SVG icon (via slot or inline) that is
visible alongside the sr-only text when `target="_blank"`.

---

#### P1-2: `:visited` pseudo-class silently does not work in Shadow DOM

**File:** `hx-link.styles.ts` line 33

```css
.link:visited {
  color: var(--hx-link-color-visited, var(--hx-color-primary-700, #1d4ed8));
}
```

Browsers restrict the `:visited` selector inside Shadow DOM for privacy reasons
(Chromium, Firefox, Safari all enforce this). The rule compiles and is syntactically
valid but **will never apply at runtime**. Documentation claims visited-state support
that doesn't exist.

This is a known platform limitation but should be:
1. Called out in JSDoc/CEM with a warning.
2. Removed or marked as a non-functional stub so consumers aren't misled.

---

#### P1-3: `download` boolean type is dead code from the attribute API

**File:** `hx-link.ts` lines 65–68

```ts
@property({ type: String })
download: string | boolean | undefined = undefined;
```

The `@property` decorator uses `type: String`, meaning Lit converts the attribute
value to a string before assigning. The boolean `true` branch in `_downloadAttr()`:

```ts
if (this.download === true) return '';
```

…can never be reached via attribute — `<hx-link download>` sets the attribute to
`""` (empty string), not the boolean `true`. Only programmatic JS assignment of
`el.download = true` reaches this branch.

The declared TypeScript type promises something the attribute API cannot deliver.
Either change `type: String` to handle booleans properly (attribute presence →
boolean `true`) or remove the boolean from the type union and narrow to
`string | undefined`.

---

#### P1-4: Story default render function injects empty `href` and `target` attributes

**File:** `hx-link.stories.ts` line 61

```ts
render: (args) => html`
  <hx-link
    href=${args.href ?? ''}
    target=${args.target ?? ''}
    …
  >
```

When `args.target` is undefined, this renders `target=""` — an empty string which is
invalid and browser-interpreted as `_self`. When `args.href` is undefined, `href=""`
points to the current page.

Both cases silently produce incorrect behavior in Storybook. Should use `ifDefined`:

```ts
href=${ifDefined(args.href)}
target=${ifDefined(args.target)}
```

---

### P2 — Medium Priority

#### P2-1: Variant type `'inline' | 'standalone'` absent — spec mismatch

**Feature spec:** "variant type (inline/standalone)"
**Implementation:** `'default' | 'subtle' | 'danger'`

The feature description specifies an inline/standalone variant system but the
implementation provides a color-based variant system (default/subtle/danger). These
are orthogonal concerns. It's possible the spec was intentionally pivoted, but if
`standalone` was intended as a display-mode variant (e.g. block layout with larger
tap target), it is entirely absent.

**Risk:** If a consuming team builds against the spec doc and expects `variant="standalone"`,
they will get no layout shift warning — the component silently accepts unknown
variants and applies no `link--standalone` class.

---

#### P2-2: No keyboard navigation tests

**File:** `hx-link.test.ts`

The test suite has zero keyboard interaction tests:
- No Tab focus test on the anchor
- No Enter key activation test
- No Tab focus test on disabled span (which, per P0-1, currently can't be focused)

WCAG 2.1 requires keyboard accessibility. Tests must prove it.

---

#### P2-3: No test for `download` with no filename (boolean `true` intent)

**File:** `hx-link.test.ts`

The download tests only cover `download="file.pdf"`. The intended boolean case
(`el.download = true` → empty download attribute) is untested. Given P1-3 above,
this may be intentional, but the gap should be explicit.

---

#### P2-4: `clip: rect()` is deprecated in visually-hidden pattern

**File:** `hx-link.styles.ts` line 75

```css
clip: rect(0, 0, 0, 0);
```

The `clip` property is deprecated. The current standard for visually-hidden content:

```css
clip-path: inset(50%);
overflow: hidden;
white-space: nowrap;
```

Not a functional bug, but flagged by modern CSS linters and worth alignment with
the rest of the design system's visually-hidden utility.

---

#### P2-5: `cursor: not-allowed` declared twice for disabled state

**File:** `hx-link.styles.ts`

```css
/* Line 14 */
:host([disabled]) {
  cursor: not-allowed;
}

/* Line 58 */
.link--disabled {
  cursor: not-allowed;
}
```

Redundant declaration. The `:host([disabled])` cursor is overridden by the inner
`.link--disabled` value anyway (specificity hierarchy). Only one is needed.

---

#### P2-6: Variant union type not exported for TypeScript consumers

**File:** `hx-link.ts`

The variant type `'default' | 'subtle' | 'danger'` is inlined on the property. No
named `LinkVariant` type is exported. External TypeScript consumers who want to
type-check variant values must re-declare the union themselves or use `string`.

---

#### P2-7: No `outline: 0` reset on `.link` base style

**File:** `hx-link.styles.ts`

Without explicitly resetting the native `outline`, some browsers (notably older Safari
and Firefox) can render both the browser-native focus ring AND the custom
`:focus-visible` ring simultaneously. Adding `outline: 0;` to `.link` and relying
solely on `:focus-visible` is the standard approach.

---

#### P2-8: No Drupal Twig usage example

**File:** `hx-link.stories.ts`, documentation

No story or doc block demonstrates Drupal Twig usage (e.g., `{% include ... %}`
pattern with `href`, `target`, `variant` mapped from Twig variables). Given the
primary consumer is Drupal CMS, this is a documentation gap.

---

## Coverage Assessment

| Audit Area              | Status                        | Severity |
|-------------------------|-------------------------------|----------|
| TypeScript strict       | `download` type mismatch      | P1       |
| Accessibility — a11y    | Disabled not keyboard-reachable | P0     |
| Accessibility — new tab | Icon missing                  | P1       |
| Accessibility — axe     | axe-core tests present ✓      | —        |
| Tests — disabled click  | Test is vacuous               | P0       |
| Tests — keyboard        | Absent                        | P2       |
| Tests — download bool   | Absent                        | P2       |
| Storybook — variants    | Default/subtle/danger ✓       | —        |
| Storybook — render fn   | Empty attr injection          | P1       |
| CSS — tokens            | `--hx-*` used correctly ✓     | —        |
| CSS — visited state     | Silently broken in Shadow DOM | P1       |
| CSS — focus ring        | Present, `:focus-visible` ✓   | —        |
| CSS — deprecated clip   | `clip: rect()` deprecated     | P2       |
| Performance             | Bundle should be <5KB ✓       | —        |
| Drupal                  | No Twig example               | P2       |

---

## Issue Count

| Severity | Count |
|----------|-------|
| P0       | 2     |
| P1       | 4     |
| P2       | 8     |
| **Total**| **14**|
