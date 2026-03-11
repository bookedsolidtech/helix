# hx-theme Antagonistic Quality Audit — T4-01

**Auditor:** Antagonistic Review Agent
**Date:** 2026-03-06
**Severity scale:** P0 = blocking/critical defect | P1 = significant gap | P2 = improvement required

---

## Summary

The `hx-theme` component has a sound architectural concept and clean Lit implementation for its core token injection mechanism. However, it has several serious gaps that block enterprise healthcare use: the high-contrast theme is a stub (no real HC tokens), there is no `color-scheme` CSS property applied for browser-native dark mode adaptation, the token cascade architecture violates the documented three-tier pattern, and the dark theme token override mechanism is subtly broken in a way that the tests do not detect.

**Overall verdict: NOT READY TO SHIP — P0 issues must be resolved.**

---

## 1. TypeScript

### P0 — Dark token override mechanism is architecturally broken

**File:** `hx-theme.ts:118-134`, `packages/hx-tokens/src/index.ts:57-59`

In `_buildTokenCss`, dark tokens from `darkTokenEntries` are merged on top of light tokens in a `Map`. The dark entries are produced by calling `flattenTokens(darkJson)` — where `darkJson` is the object nested under the `"dark"` key in `tokens.json`.

The dark token overrides in `tokens.json` live under `dark.color.text.*`, `dark.color.surface.*`, `dark.body.*`, `dark.shadow.*`. When `flattenTokens` is called with just the `dark` sub-tree (not the full tokens object), the `"dark"` prefix is stripped and tokens flatten to the same names as light tokens — e.g., `--hx-color-text-primary`, `--hx-shadow-sm`.

This appears correct in isolation, but the critical problem is that **only a subset of light tokens have dark overrides.** Semantic tokens like `--hx-color-text-primary` correctly resolve at runtime via `var(--hx-color-neutral-900)`. When dark mode applies, this reference is injected as-is — the dark override sets `--hx-color-text-primary` to `var(--hx-color-neutral-100)`. But primitive tokens like `--hx-color-neutral-900` are **never overridden** in dark mode — they always carry light values. This means dark semantic tokens resolve through `var()` chains that still end at light primitives. The dark surface/text tokens function correctly because they reference neutrals that exist in both modes, but the mechanism relies on the consumer using semantic tokens, not primitives. This is undocumented and fragile.

More critically: the test at line 99-104 asserts that `high-contrast` mode injects `0 1px 2px 0 rgb(0 0 0 / 0.3)` for `--hx-shadow-sm`. It does — because `_buildTokenCss` applies `dark` overrides for both `'dark'` and `'high-contrast'`. The test name says "injects dark token overrides in high-contrast mode" — which silently confirms that high-contrast is not actually a distinct theme. This is a test that passes by confirming a defect.

### P0 — `ThemeName` does not include `'auto'`; `system` prop is untyped workaround

**File:** `hx-theme.ts:7, 48`

The feature spec requires `color-scheme (light/dark/auto)` typed. The component uses a separate boolean `system` prop instead of `ThemeName = 'light' | 'dark' | 'auto' | 'high-contrast'`. This creates a split API where:
- `effectiveTheme` can only return `'light' | 'dark'` when `system=true` (line 87), never `'high-contrast'`
- Consumers cannot serialize or deserialize the full theme state from a single attribute
- The `theme` attribute on the element will be `"light"` even when the actual effective theme is dark via `system=true` — misleading for attribute-based consumers

### P1 — No exported token override types

**File:** `index.ts:1-2`

The feature spec requires "all token override types exported." `TokenEntry` and `TokenDefinition` types exist in `@helix/tokens` but are not re-exported from this component. Consumers wanting to pass partial token overrides have no typed interface to program against.

### P1 — `firstUpdated()` does not call `super.firstUpdated()`

**File:** `hx-theme.ts:55`

`LitElement.firstUpdated` is a lifecycle method. Omitting `super.firstUpdated()` prevents any mixin or base class from running its first-update logic. Standard Lit practice requires the super call. All other lifecycle methods in this file call super (`updated`, `disconnectedCallback`) — this is an inconsistency.

### P2 — `WcTheme` deprecated re-export lacks JSDoc `@deprecated` in `index.ts`

**File:** `index.ts:2`

The `@deprecated` JSDoc comment is only on the declaration in `hx-theme.ts:156`. The `index.ts` re-exports it without the deprecation annotation, so IDEs will not warn consumers who import from the package entry point.

---

## 2. Accessibility

### P0 — High-contrast theme has no true high-contrast token set

**File:** `hx-theme.ts:121`, `packages/hx-tokens/src/tokens.json:360-402`

`theme="high-contrast"` applies the same `dark` overrides as `theme="dark"`. There are zero dedicated high-contrast tokens in `tokens.json`. WCAG 2.1 AA requires 4.5:1 contrast for normal text and 3:1 for UI components. True high-contrast themes typically target 7:1+. The dark theme tokens have not been validated against any contrast threshold. In a healthcare application, `high-contrast` is a compliance-critical mode (often required for users with low vision). Shipping a `high-contrast` theme that is identical to `dark` is a defect.

### P1 — No `color-scheme` CSS property applied for theme-aware browser rendering

**File:** `hx-theme.styles.ts`

When `theme="dark"` or `theme="high-contrast"` is active, the browser's built-in dark-mode rendering for form controls, scrollbars, `<input>` backgrounds, and `<select>` elements will not adapt unless `color-scheme: dark` is declared on the containing element. The styles only set `display: contents`. The dynamically injected stylesheet (`_buildTokenCss`) generates `:host { ...tokens... }` but never includes `color-scheme`. This means:
- Browser UI chrome stays light regardless of applied theme
- `<input>` elements inside the themed scope will have white backgrounds in dark mode
- This is a significant visual accessibility regression

### P1 — Axe-core tests do not validate token-driven contrast ratios

**File:** `hx-theme.test.ts:238-265`

The axe-core accessibility tests pass empty `<p>` elements with no visible text styling. They test that the component itself has no structural ARIA violations, but they do not verify that the injected token values produce sufficient contrast. Axe color contrast checks require actual rendered text with foreground/background colors from the token set. These tests provide a false sense of accessibility coverage.

### P2 — No `aria-live` or status announcement when theme changes programmatically

**File:** `hx-theme.ts:136-139`

When `system=true` and the OS switches color scheme, the theme updates silently. Users relying on assistive technology receive no notification that the visual presentation has changed. A `role="status"` region or visually-hidden announcement would address this.

---

## 3. Tests

### P1 — No nested theme test

The test suite has no case for nested `<hx-theme>` components. The component description says it scopes tokens to a subtree — this means nested themes should override the parent. This behavior is entirely untested.

### P1 — No token override validation test

No test verifies that consumer-supplied `--hx-*` custom property overrides take precedence over the injected theme tokens. The component's `_buildTokenCss` sets tokens on `:host` via `adoptedStyleSheets`. If a consumer sets a token inline (e.g., `style="--hx-color-primary-500: red;"`), the override should win. This inheritance chain is not tested.

### P1 — System mode tests do not verify token application

**File:** `hx-theme.test.ts:185-217`

All `System detection` tests only assert `effectiveTheme` string values. None verify that the correct token values are actually injected into `adoptedStyleSheets`. A regression in `_applyEffectiveTheme()` during system mode would not be caught by these tests.

### P2 — `disconnectedCallback` / media query cleanup not tested

**File:** `hx-theme.test.ts`

The `_detachMediaQuery` method is called in `disconnectedCallback`. No test verifies that removing the element cleans up the `MediaQueryList` event listener. A leaked listener is a memory leak vector — critical in long-lived SPA and Drupal page contexts.

### P2 — Token value tests hardcode resolved values

**File:** `hx-theme.test.ts:82, 89, 95, 103, 154, 160, 170`

Tests assert specific hex/rgb values (e.g., `#2563eb`, `0 1px 2px 0 rgb(0 0 0 / 0.3)`). These will break if `tokens.json` values are updated for any reason. Tests should derive expected values from the token source of truth (`tokenEntries`, `darkTokenEntries`) rather than hardcoding resolved values.

### P2 — No coverage threshold enforcement

There is no Vitest `coverage.thresholds` configuration visible for this component. The CLAUDE.md mandates 80%+ coverage but there is no gate preventing a merge with insufficient coverage.

---

## 4. Storybook

### P1 — No contrast checker integration

The feature spec requires "contrast checker integrated." No story uses `@storybook/addon-a11y` contrast panels, no custom contrast overlay, and no story renders a text/background color pair with a visible contrast ratio. The Storybook provides visual demos only — it offers no accessibility verification mechanism for theme variants.

### P1 — No nested theme story

The component's primary use case includes nested theme scoping (a dark sidebar within a light page). There is no story demonstrating nested `<hx-theme>` usage. This is the only way Drupal consumers will understand scope inheritance.

### P2 — `ThemeSwitcherDemo` uses loose cast `as HTMLElement & { theme: string }`

**File:** `hx-theme.stories.ts:175-179`

The inline click handlers cast the element to `HTMLElement & { theme: string }` rather than the correctly typed `HelixTheme`. While this works at runtime, it bypasses TypeScript's type checking and won't surface if the `theme` property is renamed or removed. Should use `import type { HelixTheme }` and cast accordingly.

### P2 — `SideBySide` story mixes token references with hardcoded fallback values

**File:** `hx-theme.stories.ts:244-252`

The dark column uses `var(--hx-color-border-default, #374151)` and `var(--hx-color-surface-default, #111827)` — hardcoded fallback colors that don't belong in a story file. The entire point of the component is to inject these tokens, so the fallbacks should not exist (or at most reference neutral design system values, not magic hex strings).

---

## 5. CSS

### P0 — Three-tier token cascade is not implemented

**Architecture reference:** `CLAUDE.md` — "Three-tier cascade: Primitive → Semantic → Component"

The `hx-theme` component only implements two tiers: it injects both primitive tokens (`--hx-color-primary-500`) and semantic tokens (`--hx-color-text-primary`) directly onto `:host`. Component-tier tokens (e.g., `--hx-button-bg`, `--hx-card-padding`) are not in scope for `hx-theme`, but the component makes no distinction between tiers in its injection strategy. Primitives and semantics are dumped together from `tokenEntries` with no tier separation. This means:
- Consumers cannot override only semantic tokens without also overriding primitives
- The component token tier (`--wc-*` prefix per CLAUDE.md examples) is not represented
- The documented cascade pattern is implemented differently than specified

### P1 — No `color-scheme` property in dynamic stylesheet

**File:** `hx-theme.ts:132-133`

The `_buildTokenCss` method generates `:host { ...tokens... }`. For dark and high-contrast themes, it should include `color-scheme: dark` in the `:host` block. Without it, embedded form controls and browser-native UI will render in light mode regardless of the applied theme.

### P2 — Redundant `display: contents` on `.theme-base`

**File:** `hx-theme.styles.ts:8-10`

Both `:host` and `.theme-base` are set to `display: contents`. Since `:host` is already `display: contents`, the inner `.theme-base` div is layout-invisible. The wrapper `<div part="base" class="theme-base">` adds a node to the Shadow DOM that provides no layout or semantic value. The `[part="base"]` CSS part is exposed but has no styling surface area — it exists only as a targeting hook. This is defensible for theming overrides, but the CSS comment should explain the intent.

### P2 — Token name flattening discards hierarchy information

**File:** `packages/hx-tokens/src/index.ts:10-33`

The `flattenTokens` function joins all path segments with `-`. This means `font.family.sans` → `--hx-font-family-sans` and `font.size.md` → `--hx-font-size-md`. The original JSON structure (`font.family` vs `font.size`) is lost in the flat CSS custom property names. This is consistent within the codebase, but it means tokens are ambiguously named — `--hx-font-family-sans` looks like a subcategory of `font-family`, not `font.family.sans`.

---

## 6. Performance

### P0 — Bundle size almost certainly exceeds 5KB limit

**File:** `hx-theme.ts:3`

The component imports `tokenEntries` and `darkTokenEntries` from `@helix/tokens`. These are fully materialized JavaScript arrays containing all token entries with metadata (`name`, `value`, `category`, `group`, `key`, `path`, `description`). The full token array spans ~360 entries (based on `tokens.json`). Each `TokenEntry` has 6-7 fields. The entire `tokens.json` (non-minified) is ~14KB; the JS arrays will be comparable. The CLAUDE.md and feature spec both mandate `<5KB per component (min+gz)`. This component will exceed that budget at import time with near certainty.

The `_buildTokenCss` implementation only needs `name` and `value` fields. Importing the full `TokenEntry` metadata array (with `category`, `group`, `key`, `path`, `description`) is pure bundle overhead.

### P1 — No memoization of generated CSS strings

**File:** `hx-theme.ts:118-134`

`_buildTokenCss(theme)` generates the full CSS string from scratch on every call. With `~360` tokens and string interpolation, this is a non-trivial allocation per theme change. For the `system` mode, this also fires on every `prefers-color-scheme` change event. The result should be memoized per `ThemeName` since tokens are static at runtime.

### P1 — `CSSStyleSheet.replaceSync()` is synchronous

**File:** `hx-theme.ts:138`

`CSSStyleSheet.replaceSync()` is a synchronous CSSOM operation. For large token sets this blocks the main thread. The async alternative `replace()` is available and should be used. This is especially impactful in Drupal contexts where multiple `<hx-theme>` instances may initialize simultaneously.

### P2 — All tokens eagerly loaded regardless of active theme

**File:** `packages/hx-tokens/src/index.ts:54-59`

`tokenEntries` and `darkTokenEntries` are module-level constants that materialize when the module loads — before any `<hx-theme>` element is instantiated. A page using only `theme="light"` still loads and materializes the full dark token array. Lazy initialization would reduce parse time for the common case.

---

## 7. Drupal

### P1 — No attribute-based (non-custom-element) application pattern documented or supported

The feature spec states: "applicable as body/section attribute." In Drupal, server-rendered markup often cannot wrap content in custom elements. The typical Drupal pattern would be to apply a `data-hx-theme="dark"` attribute to `<body>` or `<section>` and have CSS respond. The current implementation **requires** the custom element to be instantiated — it cannot be applied as a plain HTML attribute. There is no static CSS fallback, no `:is([data-theme="dark"])` selector, and no exported CSS file for attribute-based theming. This is a fundamental gap for Drupal use.

### P1 — No Drupal Twig example or documentation

The component's JSDoc does not include a Drupal usage example. Enterprise Drupal consumers need to know:
- Whether to use `<hx-theme>` as a block-level wrapper in Twig templates
- How to pass the `theme` attribute from Drupal's theme configuration
- Whether JavaScript is required for theme application (it is — `firstUpdated` triggers token injection)

### P2 — `system` mode requires JavaScript and `window.matchMedia`

**File:** `hx-theme.ts:87, 103-108`

`system` mode depends on `window.matchMedia`. In Drupal server-side rendering or pre-rendering contexts, this will be unavailable. The component does not gracefully degrade — it will throw if `window` is not available. There is no `typeof window !== 'undefined'` guard anywhere in the component.

---

## Findings Summary Table

| # | Area | Severity | Finding |
|---|------|----------|---------|
| 1 | TypeScript | P0 | Dark token override mechanism relies on undocumented `var()` chain semantics; `high-contrast` confirming a defect via passing test |
| 2 | TypeScript | P0 | `ThemeName` missing `'auto'`; `system` boolean creates split unserializable API |
| 3 | TypeScript | P1 | No exported token override types |
| 4 | TypeScript | P1 | `firstUpdated()` missing `super.firstUpdated()` |
| 5 | TypeScript | P2 | `WcTheme` deprecated alias not annotated in `index.ts` |
| 6 | Accessibility | P0 | `theme="high-contrast"` is `theme="dark"` with no distinct token set; HC is a healthcare compliance requirement |
| 7 | Accessibility | P1 | No `color-scheme` CSS property; browser form controls stay light in dark/HC mode |
| 8 | Accessibility | P1 | Axe-core tests test structure only, not contrast ratios |
| 9 | Accessibility | P2 | No AT announcement when theme changes via system mode |
| 10 | Tests | P1 | No nested theme test |
| 11 | Tests | P1 | No token override / consumer override test |
| 12 | Tests | P1 | System mode tests verify `effectiveTheme` string only, not actual token injection |
| 13 | Tests | P2 | `disconnectedCallback` / listener cleanup not tested |
| 14 | Tests | P2 | Token value assertions hardcode resolved values, not derived from token source |
| 15 | Tests | P2 | No coverage threshold enforcement |
| 16 | Storybook | P1 | No contrast checker integration (spec requirement) |
| 17 | Storybook | P1 | No nested theme story |
| 18 | Storybook | P2 | `ThemeSwitcherDemo` uses loose element cast instead of `HelixTheme` type |
| 19 | Storybook | P2 | `SideBySide` story uses hardcoded fallback hex values |
| 20 | CSS | P0 | Three-tier token cascade not implemented (primitives and semantics injected together with no tier distinction) |
| 21 | CSS | P1 | `color-scheme` property missing from dynamic token stylesheet |
| 22 | CSS | P2 | Redundant `display: contents` on `.theme-base` wrapper — intent undocumented |
| 23 | Performance | P0 | Bundle almost certainly exceeds 5KB — full `TokenEntry[]` arrays (with metadata) bundled |
| 24 | Performance | P1 | No memoization of generated CSS strings per theme |
| 25 | Performance | P1 | `CSSStyleSheet.replaceSync()` is synchronous; `replace()` async API should be used |
| 26 | Performance | P2 | All tokens eagerly loaded at module parse time |
| 27 | Drupal | P1 | No attribute-based (non-custom-element) application pattern; Drupal `body`/`section` use case unsupported |
| 28 | Drupal | P1 | No Twig example or server-rendered usage documentation |
| 29 | Drupal | P2 | `system` mode has no `window` guard for SSR/pre-render contexts |

---

## P0 Issues Requiring Immediate Action Before Merge

1. **High-contrast theme is a stub** — must have distinct token set or be removed from `ThemeName` until implemented
2. **`ThemeName` missing `'auto'`** — creates unserializable split API
3. **Three-tier token cascade not implemented** — primitives and semantics are indistinguishable in injection
4. **Bundle size** — verify with `npm run build` + bundlesize check; `TokenEntry[]` metadata arrays will blow the 5KB budget
