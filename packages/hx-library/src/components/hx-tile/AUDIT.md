# AUDIT: hx-tile (T3-04) — Antagonistic Quality Review

**Date:** 2026-03-06
**Auditor:** Antagonistic Review Agent
**Branch:** `feature/audit-hx-tile-t3-04-antagonistic`
**Files reviewed:**
- `hx-tile.ts`
- `hx-tile.styles.ts`
- `hx-tile.test.ts`
- `hx-tile.stories.ts`
- `index.ts`

---

## Summary

The implementation is functionally solid for the happy-path use cases (link tile, selectable tile, disabled state). However, there are meaningful gaps in the accessibility contract, CSS part specification, motion safety, test reliability, and Drupal integration. One P0 issue (no static/non-interactive mode) represents a fundamental design gap that affects every consumer who needs a purely decorative tile.

**Severity counts:** 1 P0 · 9 P1 · 13 P2

---

## P0 — Critical / Blockers

### P0-01: No static (non-interactive) mode — every enabled tile is always interactive

**File:** `hx-tile.ts:152-214`

Every enabled tile unconditionally receives `role="button"`, `tabindex="0"`, `aria-pressed`, and click/keyboard handlers. There is no way for a consumer to render a purely decorative or informational tile without the interactive affordance. The feature description explicitly lists "clickable vs static" as a distinct audit area, and no `clickable` (or equivalent) prop exists to gate interactivity.

**Impact:** Consumers cannot compose read-only tile dashboards without every tile being announced as a toggle button. Screen reader users will be given a false interactive affordance on non-interactive tiles. This is an accessibility and semantic correctness failure at the design level.

**Evidence:**
```ts
// hx-tile.ts:154-162 — isInteractive is always !disabled; no static mode
const isInteractive = !this.disabled;
const classes = {
  'tile--interactive': isInteractive,   // always true for enabled tiles
  ...
};
// line 195: tabindex always 0 for enabled tiles
// line 196: aria-pressed always present in non-link mode
```

---

## P1 — High Severity

### P1-01: CSS parts mismatch — spec requires `tile, header, body, footer`; component exposes `base, icon, label, description, badge`

**File:** `hx-tile.ts:22-26`, `hx-tile.styles.ts`

The feature description audit checklist explicitly requires CSS parts: `tile, header, body, footer`. The component exports `base, icon, label, description, badge`. The `base` part does not conform to the `tile` naming, and no `header`, `body`, or `footer` structural parts exist. Consumers relying on the stated API cannot apply part-level styling for structural sections.

**Evidence:**
```ts
// hx-tile.ts:22-26
* @csspart base - The outer tile container element.
* @csspart icon - The icon slot container.
* @csspart label - The label slot container.
* @csspart description - The description slot container.
* @csspart badge - The badge slot container.
```
No `header`, `body`, or `footer` parts are defined or rendered.

---

### P1-02: Missing `prefers-reduced-motion` — CSS uses transitions and transform animations

**File:** `hx-tile.styles.ts:23-27, 51-63`

The `.tile` base styles define `transition` for `box-shadow`, `transform`, `background-color`, and `border-color`. The hover state applies `transform: translateY(-1px)`. There is no `@media (prefers-reduced-motion: reduce)` block suppressing or replacing these animations. In a healthcare context, vestibular disorders are a real patient population concern. WCAG 2.3.3 (AAA) and industry best practice require honoring this preference.

**Evidence:**
```css
/* hx-tile.styles.ts:23-27 — no reduced-motion guard */
transition:
  box-shadow var(--hx-transition-normal, 250ms ease),
  transform var(--hx-transition-normal, 250ms ease),
  background-color var(--hx-transition-normal, 250ms ease),
  border-color var(--hx-transition-normal, 250ms ease);

/* hx-tile.styles.ts:51-54 */
.tile--interactive:hover {
  box-shadow: var(--hx-shadow-md, ...);
  transform: translateY(var(--hx-transform-lift-sm, -1px));
}
```

---

### P1-03: Selected state lacks dedicated component-level CSS custom properties

**File:** `hx-tile.styles.ts:67-71`

The selected state hardcodes `--hx-color-primary-500` and `--hx-color-primary-50` directly without exposing tile-specific override tokens (`--hx-tile-selected-border-color`, `--hx-tile-selected-bg`). This violates the project's three-tier token cascade — component tokens must be the surface exposed to consumers, not raw semantic tokens. The `@cssprop` JSDoc block (lines 28-37 in `hx-tile.ts`) does not document any selected-state tokens.

**Evidence:**
```css
/* hx-tile.styles.ts:67-71 — semantic tokens used directly, no component-level override */
.tile--selected {
  border-color: var(--hx-color-primary-500, #2563eb);
  border-width: var(--hx-border-width-medium, 2px);
  background-color: var(--hx-color-primary-50, #eff6ff);
}
```

---

### P1-04: `aria-pressed` semantic mismatch — used on navigation-intent tiles

**File:** `hx-tile.ts:196`

`aria-pressed` is the semantic indicator of a toggle button state. In the non-link (no-href) mode, the component unconditionally assigns `aria-pressed` to all tiles regardless of intent. When a designer uses the tile for navigation (clicking goes somewhere) without setting `href` — relying on the `hx-select` event — the `aria-pressed` attribute is semantically incorrect and misrepresents the control to assistive technology.

**Evidence:**
```html
<!-- rendered DOM for non-link tile -->
<div role="button" tabindex="0" aria-pressed="false">...</div>
<!-- aria-pressed implies toggle semantics; navigation tiles should NOT have aria-pressed -->
```

---

### P1-05: Test for disabled click uses `el.click()` on host — shadow DOM handler may not fire

**File:** `hx-tile.test.ts:209-220`

The test `does not dispatch hx-select when disabled` calls `el.click()` on the outer host element. The `@click` handler is bound to the shadow root's `[part="base"]` element, not the host. The host-level click event will propagate into the shadow DOM in some browsers/implementations, but this is not guaranteed and depends on shadow DOM event re-targeting. The other event tests correctly use `shadowQuery(el, '[part="base"]')!.click()` — this test is inconsistent and potentially tests the wrong code path.

**Evidence:**
```ts
// hx-tile.test.ts:213-215 — should be shadowQuery(el, '[part="base"]')!.click()
el.addEventListener('hx-select', () => { fired = true; });
el.click();   // fires on host, not shadow base
```

---

### P1-06: Missing keyboard test for disabled state (Space/Enter on disabled tile)

**File:** `hx-tile.test.ts`

There is no test verifying that keyboard activation (Enter or Space) on a disabled tile does NOT fire `hx-select`. The disabled guard at line 125 (`if (this.disabled) return;`) is untested for keyboard paths. Only mouse click on disabled is tested (and that test has reliability issues per P1-05).

---

### P1-07: No test for "static" vs "clickable" tile distinction

**File:** `hx-tile.test.ts`

The feature description audit checklist explicitly requires "clickable vs static" test coverage. No static tile mode exists (P0-01) and no test exercises that boundary. This is a documentation of the gap, not a duplicate of P0-01 — even if the static mode were added, the test suite has no placeholder or structure for it.

---

### P1-08: No Drupal behavior file — `hx-click` and `hx-select` event consumption undocumented

**File:** component directory (missing)

The component directory contains no `hx-tile.behaviors.js` or equivalent Drupal integration file. The primary consumer of this library is Drupal CMS via Twig templates. The `hx-click` event intercepts native anchor navigation (`e.preventDefault()` at line 104) — Drupal consumers must attach a JavaScript behavior to handle this or links will silently fail to navigate. No Twig template example exists either. This is a Drupal-compatibility gap that will cause integration failures.

---

### P1-09: `selected` attribute reflects on host in link mode but visual state is suppressed

**File:** `hx-tile.ts:54-55, 161`

The `selected` property has `reflect: true`, so `selected` is always reflected as a host attribute regardless of mode. However, the `tile--selected` CSS class is suppressed in link mode (`'tile--selected': this.selected && !isLink`). A consumer who sets `<hx-tile href="/foo" selected>` will see the host attribute present but no visual selected state and no `aria-pressed`. The behavior is silently inconsistent — setting `selected` on a link tile has no visible or accessible effect.

**Evidence:**
```ts
// hx-tile.ts:161
'tile--selected': this.selected && !isLink,
// selected=true on a link tile: attribute reflects, class never applied, no warning
```

---

## P2 — Medium Severity

### P2-01: Test duplication — `applies default variant class` asserted twice

**File:** `hx-tile.test.ts:34-40, 46-51`

Identical assertion appears in both the `Rendering` suite (line 34) and the `Property: variant` suite (line 46). One of these is redundant and adds noise without coverage value.

---

### P2-02: `page.screenshot()` in axe tests is a debug artifact

**File:** `hx-tile.test.ts:379, 385, 392, 403, 412`

Every axe-core test calls `await page.screenshot()` immediately before `checkA11y`. The return value is discarded. This appears to be a debug workaround left in production test code. It slows down the test suite (5 extra screenshot operations) without benefit.

---

### P2-03: Space key on link tiles fires `hx-click` and prevents scroll — undocumented and untested

**File:** `hx-tile.ts:124-148`, `hx-tile.test.ts`

The `_handleKeyDown` handler fires on Space (`' '`) for both button and link modes, calling `e.preventDefault()`. For anchor elements, the browser default for Space is page scroll — the component silently overrides this. There is no test covering Space activation in link mode, and the behavior is not documented in the `@fires` JSDoc.

---

### P2-04: `WithBadge` Storybook story uses hardcoded inline style colors

**File:** `hx-tile.stories.ts:112-131`

The badge in `WithBadge` uses `background: #ef4444; color: white;` as inline styles. This violates the project's zero-hardcoded-values policy and `--hx-*` token convention. The story demonstrates a design-token violation as best practice.

**Evidence:**
```ts
// hx-tile.stories.ts:121-128
style="
  background: #ef4444;
  color: white;
  ...
  font-weight: 600;
"
```

---

### P2-05: `NavigationGrid` story misuses selectable tiles as navigation destinations

**File:** `hx-tile.stories.ts:164-199`

The `NavigationGrid` story uses tiles with labels "Dashboard," "Patients," "Reports," etc. as navigation items but without `href`. These tiles emit `hx-select` (toggle-button) events, not navigation events. The story teaches the wrong usage pattern for navigation grids. Navigation grid tiles should use `href` to render as links.

---

### P2-06: Meta render uses `href=${args.href || ''}` — empty href attribute always set

**File:** `hx-tile.stories.ts:62`

Using `href=${args.href || ''}` passes an empty string when no href is set. Combined with `reflect: true` on the `href` property, this always sets `href=""` on the host element in Storybook's default story, which could confuse parsers that treat `href=""` as a self-referential link. The correct pattern is conditional binding: `${args.href ? `href="${args.href}"` : ''}` or using Lit's `ifDefined` directive.

---

### P2-07: `:host` is `display: inline-block` but tile fills width with `width: 100%`

**File:** `hx-tile.styles.ts:5-6, 30`

`:host { display: inline-block }` combined with `.tile { width: 100% }` creates an implicit sizing dependency where the tile fills its `inline-block` host. In flex/grid layouts this works, but in inline contexts the tile will collapse to its content width while the inner `.tile` tries to be 100%. Block-level display would be more predictable for a tile component that consumers embed in grid layouts.

---

### P2-08: No `aria-label` attribute support for icon-only tiles

**File:** `hx-tile.ts`

No `aria-label` or `aria-labelledby` property is defined. A tile with only an icon slot (no label slot) has no accessible name, failing WCAG 4.1.2 (Name, Role, Value). The `IconOnly` Storybook story includes a label slot, masking this gap. A consumer using only the icon slot would produce an unlabeled interactive control.

---

### P2-09: `InteractiveEvents` Storybook play function tests click only, not keyboard

**File:** `hx-tile.stories.ts:236-241`

The `InteractiveEvents` play function validates click interaction only. No play-function test exercises Enter/Space keyboard activation, leaving the Storybook interaction test coverage incomplete.

---

### P2-10: No Twig template example in component directory

**File:** component directory (missing)

No `hx-tile.twig` or equivalent Drupal rendering example exists. Per the project's Drupal compatibility requirement, components should ship with a Twig template demonstrating usage.

---

### P2-11: `isInteractive` variable name is misleading

**File:** `hx-tile.ts:154`

`const isInteractive = !this.disabled` is used to apply the `tile--interactive` class. The name implies a broader concept (is the tile meant to be interactive?) but only tests `disabled`. Combined with P0-01, this naming obscures the missing static-mode concept.

---

### P2-12: Disabled link mode does not set `tabindex="-1"` on `<a>` explicitly

**File:** `hx-tile.ts:165-186`

When `disabled` is true, the `<a>` element loses its `href` attribute (correctly), making it non-focusable in most browsers. However, `tabindex="-1"` is not explicitly set, and `aria-disabled="true"` is placed on a non-focusable element that screen readers may not reach. While href removal is a correct pattern, the explicit tabindex guards against browser variance and makes intent clear.

---

### P2-13: `.tile--filled` and `.tile--selected` use hardcoded hex fallbacks for primary color tokens

**File:** `hx-tile.styles.ts:41-43, 68-70`

Multiple style rules use `#eff6ff` and `#bfdbfe` as hardcode fallbacks. While these live inside `var(--hx-color-primary-50, #eff6ff)`, they represent "default blue" assumptions. In a multi-tenant healthcare design system, themes may map primary to non-blue palettes, and the hardcoded fallback will leak the default brand color into custom themes if token resolution fails.

---

## Findings by Audit Area

| Area | P0 | P1 | P2 |
|------|----|----|-----|
| TypeScript | 0 | 1 (P1-09) | 1 (P2-11) |
| Accessibility | 0 | 2 (P1-04, P1-08) | 3 (P2-08, P2-12, P2-05) |
| Tests | 0 | 3 (P1-05, P1-06, P1-07) | 2 (P2-01, P2-02, P2-03) |
| Storybook | 0 | 0 | 4 (P2-04, P2-05, P2-06, P2-09) |
| CSS | 0 | 3 (P1-02, P1-03, P1-01) | 3 (P2-07, P2-13, P2-11) |
| Performance | 0 | 0 | 0 |
| Drupal | 0 | 1 (P1-08) | 1 (P2-10) |
| Design (general) | 1 (P0-01) | 1 (P1-09) | 0 |

> Note: some findings span multiple areas; they are listed under their primary concern.

---

## Prioritized Fix Order

1. **P0-01** — Add static mode prop (e.g., `clickable: boolean`) so non-interactive tiles are possible
2. **P1-01** — Align CSS parts to spec (`tile`, `header`, `body`, `footer`) or update spec to match implementation
3. **P1-02** — Add `@media (prefers-reduced-motion: reduce)` block removing transitions and transform
4. **P1-04** — Decouple `aria-pressed` from always-on; only apply for explicit toggle/selectable mode
5. **P1-03** — Add `--hx-tile-selected-border-color` and `--hx-tile-selected-bg` component tokens
6. **P1-05** — Fix disabled-click test to use `shadowQuery(el, '[part="base"]')!.click()`
7. **P1-06** — Add keyboard-disabled test (Enter/Space on disabled tile should not fire)
8. **P1-08** — Add Drupal behavior example (`.behaviors.js` or `.twig`)
9. **P1-09** — Document or guard `selected` in link mode (warn, no-op, or prevent reflect)
10. **P2-\*** — Address remaining medium-severity items in priority order
