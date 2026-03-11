# AUDIT: hx-top-nav — Antagonistic Quality Review (T2-38)

**Reviewer:** Antagonistic Quality Agent
**Date:** 2026-03-05
**Branch audited:** `feature/t2-38-hx-top-nav-top-of-page-navigation` (commit `d198a8d`)
**Severity legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low · ✅ Pass

---

## Executive Summary

`hx-top-nav` is a slot-driven navigation shell component. Its design philosophy (composition over configuration) is sound for Drupal/CMS contexts, but several implementation gaps create real accessibility, architectural, and maintainability risks. The most urgent findings are: nested `<nav>` landmark anti-pattern actively promoted in Storybook examples, absent keyboard navigation within the mobile menu, no `<header>` landmark wrapper, a no-op `prefers-reduced-motion` rule, and a hardcoded 768px breakpoint.

**Total findings: 23**
**Critical: 2 · High: 5 · Medium: 9 · Low: 7**

---

## 1. TypeScript

### 1.1 🔵 No typed API for nav items

`hx-top-nav` is entirely slot-driven — there is no `items` property or TypeScript type for navigation items. By contrast, `hx-nav` exposes a typed `NavItem[]` interface. This is a deliberate architectural choice for the slot pattern, but it means consumers have zero compile-time guidance for slotted content structure. No type guards or documented TypeScript patterns exist to help consumers get this right.

**File:** `hx-top-nav.ts`

### 1.2 🔵 `aria-expanded` as ternary string

```ts
aria-expanded=${this._mobileOpen ? 'true' : 'false'}
```

Should prefer `${String(this._mobileOpen)}` or `.aria-expanded=${this._mobileOpen}` (Lit's `.prop` binding). Not a bug — both render correctly — but inconsistent with Lit idioms and the rest of the library.

**File:** `hx-top-nav.ts:120`

### 1.3 🔵 `label` defaults conflict with `hx-nav`

`hx-top-nav` defaults `label` to `'Site Navigation'`; `hx-nav` defaults to `'Main navigation'`. No naming convention or token system governs these strings. A Drupal page could render both components with different landmark labels, creating a confusing accessibility tree without intentional design.

**File:** `hx-top-nav.ts:51`

### 1.4 ✅ `@property` decorators correct

All properties are properly decorated, reflected where appropriate (`sticky`), and documented with JSDoc. TypeScript strict is satisfied.

### 1.5 ✅ Custom event typing

`hx-mobile-toggle` is typed as `CustomEvent<{ open: boolean }>`. Correct.

---

## 2. Accessibility

### 2.1 🔴 Nested `<nav>` landmark actively promoted in Storybook

Every Storybook story renders a `<nav style="display: contents;">` inside the default slot of `<hx-top-nav>`. Since `hx-top-nav`'s Shadow DOM contains `<nav part="nav" aria-label=${this.label}>`, this creates **two nested `<nav>` landmarks in the composed accessibility tree**. Screen readers (NVDA, VoiceOver, JAWS) will present two separate navigation landmarks to users, one of which is unlabeled.

This is not just a test artifact — the pattern is taught to consumers via Storybook. Every documentation example actively demonstrates an accessibility violation.

```html
<!-- BAD — promoted in every story -->
<hx-top-nav>
  <nav style="display: contents;">  <!-- ← second nav landmark in a11y tree -->
    <a href="/dashboard">Dashboard</a>
  </nav>
</hx-top-nav>
```

**Fix required:** Stories must use `<div style="display: contents;">` or remove the wrapper entirely. The component must document that consumers MUST NOT place a `<nav>` element in the default slot.

**Files:** `hx-top-nav.stories.ts` (all stories)

### 2.2 🔴 No `<header>` landmark wrapper

WCAG 1.3.6 and ARIA Landmarks best practice requires page-level navigation bars to be wrapped in `<header role="banner">`. The component renders only a `<nav>` element, with no `<header>` ancestor. Users of landmarks-based navigation (screen reader users, keyboard users using landmark shortcuts) cannot jump to the banner region.

A site's main nav bar is a canonical `<header>` use case. The component should either:
1. Render `:host { display: block; }` with a `<header>` wrapping the `<nav>`, or
2. Document that consumers MUST wrap `<hx-top-nav>` in a `<header>` element.

Currently neither approach is implemented nor documented.

**File:** `hx-top-nav.ts:106` (render method)

### 2.3 🟠 No keyboard navigation within the mobile menu

When the mobile menu is open, there is no arrow key navigation, Home/End support, or Escape-to-close keyboard handling within the slotted content. `hx-nav` implements comprehensive keyboard navigation (ArrowUp, ArrowDown, Escape, Enter, Space). `hx-top-nav` provides zero keyboard navigation structure for the mobile menu items.

A keyboard-only user who opens the mobile menu via Enter on the hamburger button has no way to:
- Navigate between menu items with arrow keys
- Close the menu with Escape
- Know where focus has landed after opening

**WCAG 2.1.1 (Level A) violation risk.** The component's slot-driven design makes this the consumer's responsibility, but there is no documentation of this obligation.

**File:** `hx-top-nav.ts`

### 2.4 🟠 No focus management on mobile menu open

When `_handleMobileToggle()` opens the menu, focus remains on the hamburger button. Best practice (and ARIA Authoring Practices for Disclosure Navigation Menus) requires focus to move to the first menu item when the menu opens, or at minimum the menu container. No `focus()` call or `updateComplete.then()` pattern exists.

**File:** `hx-top-nav.ts:64`

### 2.5 🟠 No `aria-current` documentation or pattern

The component provides no guidance for marking the current page item. `hx-nav` handles this internally via its `NavItem.current` property. With `hx-top-nav`, consumers must add `aria-current="page"` to their slotted links manually, with no documentation anywhere in the component, stories, or CEM about how to do so.

A Drupal consumer using the Drupal menu system would need to know to pass `aria-current` via Twig. This is undocumented.

**File:** `hx-top-nav.stories.ts` (no example with `aria-current`)

### 2.6 🟡 Skip link target not provided

The component lacks a target ID that skip links can point to. Standard pattern is `<a href="#main-content">Skip to content</a>` pointing to the main content area past the nav. While the component's job is the nav itself (not to be skipped into), it should document the skip link integration pattern and not use its internal IDs (`#nav-menu`) for this purpose.

The `id="nav-menu"` on `.nav__collapsible` is an ARIA relationship target for `aria-controls`, not a navigation landmark target.

**File:** `hx-top-nav.ts:122` (`id="nav-menu"` on collapsible)

### 2.7 🟡 Touch target marginally compliant

The hamburger button has:
```css
padding: var(--hx-space-2, 0.5rem);  /* 8px */
```
With a 24×24px icon, this gives a 40×40px touch target. WCAG 2.5.5 recommends 44×44px; WCAG 2.5.8 (2.2 AA) requires 24×24px minimum. Currently meets the floor but does not meet the recommended target size. In a healthcare context (gloved users, accessibility mandates), this should be 44×44px.

**File:** `hx-top-nav.styles.ts:44`

### 2.8 ✅ `aria-label` on `<nav>` landmark

The `label` property correctly binds to `aria-label` on the `<nav>` element. Landmark is distinguishable from other `<nav>` elements on the page.

### 2.9 ✅ `aria-expanded` / `aria-controls` on hamburger

Correctly set. `aria-controls="nav-menu"` points to `id="nav-menu"` within the same Shadow DOM, which is valid for intra-shadow IDREF relationships.

### 2.10 ✅ `aria-hidden="true"` on hamburger SVG

Hamburger icon SVG has `aria-hidden="true"`. Button has `aria-label="Toggle navigation"`.

---

## 3. Tests

### 3.1 🟠 No keyboard navigation tests in `.test.ts`

The Storybook story file includes a `MobileToggleKeyboard` interaction test (Enter + Space). The Vitest test file (`hx-top-nav.test.ts`) has **no keyboard tests**. If Storybook interaction tests are not run in CI, keyboard activation is untested.

**File:** `hx-top-nav.test.ts` (absent)

### 3.2 🟠 No Escape-key-to-close test

No test verifies that pressing Escape while the mobile menu is open closes it. This behavior is not even implemented in the component (further evidence of missing keyboard nav), but it is an expected UX behavior that should be tested.

**File:** `hx-top-nav.test.ts` (absent)

### 3.3 🟡 No focus management test

No test verifies focus behavior when the mobile menu opens or closes. Where does focus go after toggle? This is unspecified and untested.

**File:** `hx-top-nav.test.ts` (absent)

### 3.4 🟡 No mobile/desktop layout verification test

No test checks that `.mobile-toggle` is hidden at desktop viewport widths or visible at mobile widths. CSS breakpoint behavior is entirely untested.

**File:** `hx-top-nav.test.ts` (absent)

### 3.5 🟡 axe-core tests use minimal content

The two axe-core tests pass a single `<a>` and `<button>`. They would not catch the nested `<nav>` violation promoted by Storybook stories because the test fixtures don't use a `<nav>` wrapper in the default slot.

```ts
// Does not catch nested nav landmark violation
const el = await fixture<HelixTopNav>(
  '<hx-top-nav><a href="/home">Home</a>...</hx-top-nav>'
);
```

**File:** `hx-top-nav.test.ts:157`

### 3.6 ✅ Core rendering, property, and slot tests

18 tests cover shadow DOM, CSS parts, sticky reflection, label property, mobile toggle events, and slot content. Well-structured and passing.

### 3.7 ✅ Event detail testing

`hx-mobile-toggle` event detail (`open: true/false`) is verified for both toggle directions. ✅

---

## 4. Storybook

### 4.1 🟠 Nested `<nav>` in every story (repeats §2.1)

All 9 stories demonstrate the nested `<nav>` anti-pattern. See §2.1 for full analysis. This is the single most damaging documentation error in the component — it teaches consumers to create accessibility violations.

**File:** `hx-top-nav.stories.ts` (all stories)

### 4.2 🟡 No mobile viewport story

The component's primary behavioral difference (hamburger menu, collapsible panel) only appears below 768px. No story demonstrates this with a narrow viewport. The `Responsive` story label (`Responsive` is not present — only `Default`, `WithLogoSlot`, etc.) is missing entirely.

Consumers cannot see mobile behavior in Storybook without manually resizing their browser.

**File:** `hx-top-nav.stories.ts` (absent)

### 4.3 🟡 No `aria-current` usage example

No story shows how to mark the active/current nav item with `aria-current="page"`. This is the most important accessibility pattern for navigation and is absent.

**File:** `hx-top-nav.stories.ts` (absent)

### 4.4 🟡 No dedicated search story

Feature description calls for "with search" story. The `WithActionsSlot` story includes a search input but is not labeled/exported as a search story. No story has `name: 'With Search'` or demonstrates a search-focused layout.

**File:** `hx-top-nav.stories.ts`

### 4.5 🔵 Inline styles throughout stories

Stories use extensive inline `style` attributes instead of demonstrating design token usage. While stories are not production code, they model consumer patterns. Consumers seeing inline styles will replicate them.

**File:** `hx-top-nav.stories.ts` (throughout)

### 4.6 ✅ Interaction tests present and complete

`MobileToggleOpen`, `MobileToggleClose`, `AriaLabelApplied`, `StickyAttribute`, `MobileToggleKeyboard` — five interaction tests with good coverage of happy paths.

### 4.7 ✅ CSS parts and CSS custom properties stories

`CSSParts` and `CSSCustomProperties` stories demonstrate theming. Dark theme and branded teal examples are clear.

---

## 5. CSS

### 5.1 🟠 Hardcoded 768px breakpoint (violates no-hardcoded-values rule)

```css
@media (min-width: 768px) { ... }
```

The CLAUDE.md and project standards explicitly prohibit hardcoded values. This breakpoint should be a design token such as `--hx-breakpoint-md` or `var(--hx-screen-md, 768px)`. If a consumer's design system uses 960px as their "medium" breakpoint, they cannot change this without forking the component.

**File:** `hx-top-nav.styles.ts:106`

### 5.2 🟠 `prefers-reduced-motion` rule is a no-op

```css
@media (prefers-reduced-motion: reduce) {
  .nav__collapsible {
    transition: none;
  }
}
```

There is **no `transition` defined anywhere on `.nav__collapsible`**. The reduced-motion rule targets a property that doesn't exist. The mobile menu open/close is a `display: none` → `display: flex` toggle with zero animation. The motion preference rule is dead code that misleads future maintainers into believing there was once (or should be) an animation.

**Fix options:**
1. Add a real animation (height or opacity transition) and make the reduced-motion rule meaningful, OR
2. Remove the dead media query.

**File:** `hx-top-nav.styles.ts:152`

### 5.3 🟡 No smooth mobile menu transition

The mobile menu uses `display: none` → `display: flex` toggling with no animation. The transition is jarring. Both `hx-nav` and `hx-side-nav` (post-fix) implement smooth transitions. A height or max-height transition with the `prefers-reduced-motion` fallback would be appropriate here.

**File:** `hx-top-nav.styles.ts`

### 5.4 🟡 `--hx-z-index-sticky` fallback of `100` is too low

```css
z-index: var(--hx-top-nav-z-index, var(--hx-z-index-sticky, 100));
```

A z-index of `100` is very low for a sticky navigation bar. Common values for sticky navbars are 1000–1100 (below modal at 1300, above content at 0). If the token `--hx-z-index-sticky` is undefined, the nav will be buried behind any element with `z-index > 100`. This is a safe-default failure.

**File:** `hx-top-nav.styles.ts:18`

### 5.5 🟡 No hover/focus styles on hamburger in non-focus-visible state

The hamburger button only has `focus-visible` styling. There is no `hover` style. On desktop (where it should be hidden, but if breakpoint is overridden), or on touch devices where hover is intermittent, the button gives no visual feedback on hover.

**File:** `hx-top-nav.styles.ts:48`

### 5.6 🔵 `.nav__collapsible` has `padding-block` on mobile but none on desktop

Mobile adds `padding-block: var(--hx-space-3)`. Desktop resets this to `0`. This is correct, but it means there's no dedicated custom property for the mobile menu padding, reducing consumer customization options.

**File:** `hx-top-nav.styles.ts:72,120`

### 5.7 ✅ All color, spacing, and typography values use `--hx-*` tokens

Semantic fallbacks (`var(--hx-color-neutral-0, #ffffff)`) use hex only as a last resort. The token cascade is correct throughout.

### 5.8 ✅ Focus ring uses design tokens

```css
outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, ...);
outline-offset: var(--hx-focus-ring-offset, 2px);
```

Correct token usage for focus indicators.

---

## 6. Performance

### 6.1 ✅ Bundle size under limit

Component-specific code: `hx-top-nav.ts` (~153 lines) + `hx-top-nav.styles.ts` (~162 lines of CSS). No external dependencies beyond Lit (shared) and `@helixui/tokens/lit` (shared). Estimated component-specific bundle contribution: **~1.2KB min+gz**, well under the 5KB gate.

### 6.2 🔵 Inline SVG rendered on every update

The hamburger/close icon SVG is re-rendered via `_renderHamburgerIcon()` on every `_mobileOpen` state change. For a simple boolean toggle this is acceptable, but a `TemplateResult` cached reference or `choose()` directive would be more efficient.

**File:** `hx-top-nav.ts:76`

---

## 7. Drupal Integration

### 7.1 🟠 No Twig template provided

No `.html.twig` template or Drupal behavior (`.js` behaviors file) exists for `hx-top-nav`. Drupal consumers have no reference implementation. `hx-nav` similarly lacks a Twig template. This is a gap across the navigation component family.

### 7.2 🟡 Slot-driven design requires Twig loop — no JSON attribute fallback

Unlike `hx-nav` (which accepts `items='[{"label":"...","href":"..."}]'` from a Drupal menu field), `hx-top-nav` requires consumers to loop over menu items in Twig to generate slot content:

```twig
{# Required Twig pattern — not documented anywhere #}
<hx-top-nav>
  {% for item in menu_items %}
    <a href="{{ item.url }}"
       {% if item.in_active_trail %}aria-current="page"{% endif %}>
      {{ item.title }}
    </a>
  {% endfor %}
</hx-top-nav>
```

This pattern is not documented in the component, stories, or CEM. Drupal developers will have to discover it independently.

### 7.3 🟡 `aria-current` in Drupal requires manual `in_active_trail` check

Drupal's Menu API provides `in_active_trail` and `is_active` on menu items. The Twig pattern to emit `aria-current="page"` requires knowing this. See §2.5. No documentation exists.

### 7.4 🔵 CDN import path undocumented

No reference to `@wc-2026/library` CDN import path exists in the component or stories. Drupal teams using CDN delivery cannot self-service the import.

### 7.5 ✅ Works in Twig without modification

The component is a standard custom element with no framework dependencies. It renders correctly when included as `<hx-top-nav>` in a Twig template with appropriate CDN script import.

---

## 8. hx-nav Overlap Analysis

### Architectural Problem

Both `hx-nav` and `hx-top-nav` address "top-of-page site navigation" but with opposite philosophies:

| Dimension | `hx-nav` | `hx-top-nav` |
|---|---|---|
| **API** | Data-driven (`items` JSON array) | Slot-driven (full composition) |
| **Nav item rendering** | Internal (component renders `<li>/<a>`) | External (consumer provides slot content) |
| **Keyboard navigation** | Built-in (ArrowUp/Down/Left/Right, Escape) | None (consumer's responsibility) |
| **Submenu support** | Yes (nested `NavItem.children`) | No (consumers must provide) |
| **Active item** | `NavItem.current` → `aria-current="page"` | Consumer sets `aria-current` manually |
| **Orientation** | `horizontal` + `vertical` | Horizontal only |
| **Default theme** | Dark (`--hx-color-neutral-900` background) | Light (`--hx-color-neutral-0` background) |
| **Drupal suitability** | Complex (JSON serialization from Twig) | High (slot maps to Twig blocks) |
| **React/Vue suitability** | High (data binding via property) | Moderate (slot works with JSX) |

### Naming Confusion

`hx-nav` with `orientation="horizontal"` is visually indistinguishable in purpose from `hx-top-nav`. A developer choosing between them has no guidance. Both render a horizontal nav bar. The name `hx-nav` suggests it is **the** navigation component, while `hx-top-nav` is a separate component for the same use case.

### Duplication Risk

Both components:
- Render a `<nav>` landmark with `aria-label`
- Render a hamburger button with `aria-expanded`/`aria-controls`
- Toggle mobile menu visibility
- Dispatch custom events on toggle
- Use nearly identical hamburger SVG code (duplicated, not shared)

The hamburger icon is copy-pasted between the two components. Any SVG change must be made twice.

### Recommendation (document only, do not fix)

1. **Designate `hx-top-nav` as the canonical top-navigation shell** — it is better suited to Drupal CMS use cases due to its slot-driven design.
2. **Position `hx-nav` as a utility navigation component** — better for sidebars, breadcrumb-level navigation, and programmatic/React/Vue use cases.
3. **Extract hamburger icon to a shared internal utility** — eliminates SVG duplication.
4. **Document the distinction explicitly** in Storybook and docs — consumers need guidance on which to use.
5. **Consider deprecating `hx-nav`'s horizontal mode** in favor of `hx-top-nav` + `hx-side-nav` for clarity.

---

## Findings Summary

| # | Area | Severity | Issue |
|---|---|---|---|
| 2.1 | Accessibility | 🔴 Critical | Nested `<nav>` promoted in all Storybook stories |
| 2.2 | Accessibility | 🔴 Critical | No `<header>` landmark wrapper |
| 2.3 | Accessibility | 🟠 High | No keyboard navigation in mobile menu |
| 2.4 | Accessibility | 🟠 High | No focus management on mobile menu open |
| 2.5 | Accessibility | 🟠 High | No `aria-current` documentation or pattern |
| 3.1 | Tests | 🟠 High | No keyboard tests in Vitest suite |
| 3.2 | Tests | 🟠 High | Escape-to-close not implemented or tested |
| 4.1 | Storybook | 🟠 High | Nested `<nav>` in all stories (same as 2.1) |
| 5.1 | CSS | 🟠 High | Hardcoded 768px breakpoint (violates standards) |
| 5.2 | CSS | 🟠 High | `prefers-reduced-motion` is a no-op (dead code) |
| 2.6 | Accessibility | 🟡 Medium | Skip link target not provided or documented |
| 2.7 | Accessibility | 🟡 Medium | Touch target below recommended 44×44px |
| 3.3 | Tests | 🟡 Medium | No focus management test |
| 3.4 | Tests | 🟡 Medium | No mobile/desktop layout test |
| 3.5 | Tests | 🟡 Medium | axe-core tests don't catch nested nav violation |
| 4.2 | Storybook | 🟡 Medium | No mobile viewport story |
| 4.3 | Storybook | 🟡 Medium | No `aria-current` usage example |
| 4.4 | Storybook | 🟡 Medium | No dedicated search story |
| 5.3 | CSS | 🟡 Medium | No smooth mobile menu transition |
| 5.4 | CSS | 🟡 Medium | z-index fallback of 100 is too low |
| 5.5 | CSS | 🟡 Medium | No hover style on hamburger button |
| 7.1 | Drupal | 🟠 High | No Twig template provided |
| 7.2 | Drupal | 🟡 Medium | No documented Twig loop pattern |
| 1.1 | TypeScript | 🔵 Low | No typed API for nav items (by design, undocumented) |
| 1.2 | TypeScript | 🔵 Low | `aria-expanded` ternary string vs Lit idiom |
| 1.3 | TypeScript | 🔵 Low | `label` default conflicts with `hx-nav` |
| 4.5 | Storybook | 🔵 Low | Inline styles throughout stories |
| 5.6 | CSS | 🔵 Low | No custom property for mobile menu padding |
| 6.2 | Performance | 🔵 Low | SVG re-rendered on every toggle |
| 7.4 | Drupal | 🔵 Low | CDN import path undocumented |

---

## Priority Fix Order

1. **[BLOCKER]** Fix nested `<nav>` in all Storybook stories → use `<div style="display: contents;">` (§2.1 / §4.1)
2. **[BLOCKER]** Wrap `<nav>` in `<header>` or document the requirement (§2.2)
3. **[HIGH]** Implement keyboard navigation for mobile menu (Escape to close at minimum) (§2.3)
4. **[HIGH]** Move focus to first menu item or menu container on mobile menu open (§2.4)
5. **[HIGH]** Replace hardcoded `768px` with design token (§5.1)
6. **[HIGH]** Remove dead `prefers-reduced-motion` rule or add an actual transition (§5.2)
7. **[HIGH]** Create Twig template with documented `aria-current` pattern (§7.1 / §7.2)
8. **[HIGH]** Add keyboard tests to Vitest suite (§3.1 / §3.2)
9. **[MEDIUM]** Add mobile viewport story (§4.2)
10. **[MEDIUM]** Add `aria-current` example story (§4.3)
