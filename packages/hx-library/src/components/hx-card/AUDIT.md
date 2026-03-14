# AUDIT: hx-card — T2-41 Antagonistic Quality Review

**Reviewer:** Antagonistic Quality Agent
**Date:** 2026-03-05
**Component:** `packages/hx-library/src/components/hx-card/`
**Scope:** TypeScript, Accessibility, Tests, Storybook, CSS, Performance, Drupal

---

## Severity Key

| Level | Meaning |
|-------|---------|
| **P0** | Blocking — breaks functionality, WCAG violation, or data loss |
| **P1** | High — significant quality/usability/correctness issue that must be fixed before release |
| **P2** | Medium/Low — quality improvement, inconsistency, or missing polish |

---

## 1. TypeScript

### P1 — `@fires` JSDoc type mismatch: `originalEvent` typed as `MouseEvent` only

**File:** `hx-card.ts:20`

The `@fires` JSDoc annotation declares:
```ts
@fires {CustomEvent<{href: string, originalEvent: MouseEvent}>} hx-card-click
```

But `_dispatchCardClick` accepts `MouseEvent | KeyboardEvent` (line 92) and keyboard events (`Enter`, `Space`) route through `_handleKeyDown` → `_dispatchCardClick`. The `originalEvent` in the event detail can be a `KeyboardEvent`, not just a `MouseEvent`. The CEM-generated type will be wrong and consumers who type the event detail will miss keyboard-triggered events.

**Expected fix:** `originalEvent: MouseEvent | KeyboardEvent`

---

### P2 — `CustomEvent` dispatch is not generically typed

**File:** `hx-card.ts:100–106`

```ts
this.dispatchEvent(
  new CustomEvent('hx-card-click', {
    ...
    detail: { href: this.hxHref, originalEvent },
  }),
);
```

The `CustomEvent` constructor is not generically typed (`new CustomEvent<{href: string; originalEvent: MouseEvent | KeyboardEvent}>(...)`). This loses compile-time safety on the event detail shape.

---

### P2 — `hxHref` defaults to empty string rather than `string | undefined`

**File:** `hx-card.ts:61`

```ts
hxHref = '';
```

The default is an empty string. `!!this.hxHref` treats both `''` and `undefined` as falsy, so interactive mode works correctly. However, the semantic type `string | undefined = undefined` would better express "no URL set" versus "explicitly set to empty string". As written, if someone passes `hx-href=""` (explicit empty string attribute) the card behaves correctly as non-interactive, but the property type `String` makes this acceptable in practice. Low impact but worth noting for API clarity.

---

## 2. Accessibility

### P1 — Interactive card accessible name exposes raw URL, not content description

**File:** `hx-card.ts:140`

```ts
aria-label=${isInteractive ? `Navigate to ${this.hxHref}` : nothing}
```

When `hx-href="/patient/00-12345"` is set, the card's accessible name becomes `"Navigate to /patient/00-12345"`. Screen readers announce this verbatim. For a healthcare card containing patient name, MRN, and vitals, the announced name tells the user nothing about the content.

WCAG 2.4.6 (Headings and Labels, AA) and 2.4.9 (Link Purpose, AAA) both apply. The `PatientSummaryCard` story demonstrates this: a card about "Margaret Thompson" with critical vitals would be announced as "Navigate to https://ehr.example.com/patient/00-54321".

The correct pattern is to derive the accessible name from slotted heading content, or at minimum allow consumers to provide an explicit `aria-label` property that is not prefixed with "Navigate to". As implemented, the aria-label is formulaic and non-descriptive in every realistic usage.

---

### P1 — Interactive card + actions slot anti-pattern is unguarded and demonstrated in stories

**File:** `hx-card.ts` (render), `hx-card.stories.ts` (PatientSummaryCard, PatientDashboard)

When `hx-href` is set, the `<div part="card">` receives `role="link"`. If the consumer also populates the `actions` slot with `<hx-button>` elements, interactive controls are nested inside a link role. This violates ARIA: [spec prohibits interactive descendants of role=link](https://www.w3.org/TR/wai-aria-1.2/#link).

**Concrete example — `PatientSummaryCard` story (lines 964–1006):**
```html
<hx-card variant="featured" elevation="raised" hx-href="...">
  <!-- ... content ... -->
  <span slot="actions">
    <hx-button>View Chart</hx-button>
    <hx-button variant="secondary">Orders</hx-button>
    <hx-button variant="ghost">Notes</hx-button>
  </span>
</hx-card>
```

This renders as `role="link"` containing focusable buttons. Axe-core will flag this. The component provides no guard, warning, or documentation about this anti-pattern.

The `PatientDashboard` story repeats this pattern six times.

---

### P1 — No `@media (prefers-reduced-motion)` guard on transitions and transforms

**File:** `hx-card.styles.ts:18–21, 59–61, 68–70`

```css
transition:
  box-shadow var(--hx-transition-normal, 250ms ease),
  transform var(--hx-transition-normal, 250ms ease);

.card--interactive:hover {
  transform: translateY(var(--hx-transform-lift-md, -2px));
}
```

Motion is used on every interactive card (hover lift and box-shadow transition) with no `@media (prefers-reduced-motion: reduce)` override. In a healthcare setting this is not optional — vestibular disorders are common among patients and clinical staff. WCAG 2.3.3 (Animation from Interactions, AAA) and EN 301 549 both reference reduced-motion. Enterprise healthcare systems routinely require at least AA compliance, and motion sensitivity is a documented clinical concern.

---

### P2 — Focus tabindex is on inner shadow-DOM div, not the host element

**File:** `hx-card.ts:139`

```ts
tabindex=${isInteractive ? '0' : nothing}
```

The `tabindex` is placed on the internal `<div part="card">` inside shadow DOM. As a result, the custom element `<hx-card>` itself is never in the tab order — only the internal div receives focus. This makes `document.querySelector('hx-card:focus-within')` work but `document.querySelector('hx-card:focus')` never fires. External CSS attempting `:focus` on `hx-card` will not work. Preferred patterns use `delegatesFocus: true` on the shadow root or `tabIndex` on the host element.

This also means `this.focus()` on the component instance focuses the host element (no-op for tab), not the internal focusable div.

---

### P2 — Heading slot provides no semantic heading enforcement

**File:** `hx-card.ts:148–150`, `hx-card.styles.ts:92–100`

The `heading` slot wrapper (`<div class="card__heading">`) applies visual heading styles (font-size, font-weight) but provides no semantic heading role. If consumers pass `<span slot="heading">Title</span>` (as all stories do), the heading has no semantic meaning for screen readers. The component should either:
- Document that consumers MUST use a heading element (`<h2>`, `<h3>`, etc.)
- Provide an internal heading with appropriate ARIA level
- Apply `role="heading"` to the slot wrapper with a configurable `aria-level` prop

Currently all Storybook stories use `<span slot="heading">` — none use semantic heading elements.

---

### P2 — `checkA11y` test does not cover interactive card + actions slot combination

**File:** `hx-card.test.ts:326–333`

The axe-core test for interactive state does not include actions slot content:
```ts
'<hx-card hx-href="https://example.com"><span slot="heading">Title</span><p>Content</p></hx-card>'
```

The combination `hx-href + slot="actions"` — the pattern explicitly documented in stories — is never axe-tested.

---

## 3. Tests

### P2 — No test for `hxHref` property change after initial render

**File:** `hx-card.test.ts`

There is no test verifying that setting `el.hxHref = '/new-path'` after render correctly updates `role`, `tabindex`, `aria-label`, and `card--interactive` class. Lit's reactive properties should handle this, but the interactive/static mode transition is not tested.

---

### P2 — No test for the interactive + actions slot anti-pattern combination

**File:** `hx-card.test.ts`

The most dangerous usage scenario (interactive card with actions) has no test. There should at minimum be a test documenting the behavior — even if just as a known limitation test.

---

### P2 — Stale screenshot names contain `wc-` prefix

**File:** `__screenshots__/hx-card.test.ts/`

Screenshots include:
- `hx-card-Events-dispatches-wc-card-click-when-hx-href---click-1.png`
- `hx-card-Events-dispatches-wc-card-click-when-wc-href---click-1.png`
- `hx-card-Property--wc-href-has-aria-label--Navigate-to--wc-href---when-wc-href-set-1.png`

These filenames contain `wc-card-click` and `wc-href` — the old naming convention. The screenshots are stale artifacts from a naming refactor. They won't cause test failures but indicate the screenshot baseline was not regenerated after the `wc-` → `hx-` rename.

---

## 4. Storybook

### P1 — `InteractiveClickTest` play function checks wrong event detail property

**File:** `hx-card.stories.ts:854–856`

```ts
const callDetail = interactiveClickHandler.mock.calls[0]?.[0]?.detail;
await expect(callDetail?.url).toBe('https://ehr.example.com/patient/67890');
```

The event detail property is `href` (from `_dispatchCardClick`: `detail: { href: this.hxHref, ... }`), not `url`. `callDetail?.url` will always be `undefined`. The assertion `expect(undefined).toBe('https://...')` fails silently if `expect` in Storybook play functions doesn't throw on this specific assertion path (or the `await expect` swallows it). The test passes, but it is not testing what it claims to test — the URL in the event detail is never verified.

---

### P1 — `wcHref` arg name in Storybook does not match the Lit property `hxHref`

**File:** `hx-card.stories.ts:38–47`

```ts
argTypes: {
  wcHref: { ... }
},
args: {
  wcHref: '',
},
```

The arg is named `wcHref` (old `wc-` prefix) while the Lit property is `hxHref` / attribute `hx-href`. Storybook autodocs will show the control as "wcHref" in the UI — a confusing mismatch from the actual API. The render function manually maps it with `hx-href=${args.wcHref || ''}` to paper over the mismatch. CEM-driven autodocs will create a separate `hxHref` control from the component manifest, resulting in two controls for the same property.

---

### P2 — External image URLs will fail in offline/CI environments

**File:** `hx-card.stories.ts:199, 262, 789`

Stories use `https://placehold.co/...` URLs for images. These will fail to load in environments without internet access (CI, offline dev, certain corporate networks). Visual regression tests relying on these stories would produce broken images. Preferred approach is local SVG data URIs or `storybook/assets/`.

---

### P2 — Horizontal layout is missing — audit spec calls it out but component has no such feature

The feature audit description explicitly lists "horizontal/vertical layout" as an audit area. The component has no `orientation`, `layout`, or `horizontal` property, and no CSS for a horizontal card layout. No story demonstrates side-by-side image/content orientation. This is a missing capability rather than a bug, but its absence should be documented as a known gap.

---

## 5. CSS

### P1 — `--hx-card-gap` is documented but never used in the stylesheet

**File:** `hx-card.ts:34`, `hx-card.styles.ts`, `hx-card.stories.ts:736–739`

The `@cssprop` JSDoc documents:
```ts
@cssprop [--hx-card-gap=var(--hx-space-4)] - Gap between card sections.
```

The CSS Custom Properties story shows consumers how to override `--hx-card-gap`. However, searching the stylesheet (`hx-card.styles.ts`) reveals `--hx-card-gap` is never referenced. The `flex` layout on `.card` has no `gap` property — spacing between sections comes only from asymmetric padding (padding-top/bottom on sections). The advertised `--hx-card-gap` token is a broken API surface: consumers who set it will see no effect.

---

### P1 — `.card--compact` only reduces body padding — heading, footer, actions are unchanged

**File:** `hx-card.styles.ts:48–50`

```css
.card--compact .card__body {
  padding: var(--hx-space-3, 0.75rem);
}
```

The compact variant reduces only `card__body` padding. The `card__heading`, `card__footer`, and `card__actions` sections retain their full `var(--hx-card-padding)` spacing. A compact card with heading and actions will have:
- Heading: full 1.5rem padding
- Body: reduced 0.75rem padding
- Actions: full 1.5rem padding

This creates an inconsistent visual rhythm — the compact variant is only half-implemented.

---

### P2 — No image aspect ratio enforcement

**File:** `hx-card.styles.ts:81–90`

```css
.card__image ::slotted(img) {
  width: 100%;
  height: auto;
  object-fit: cover;
}
```

`height: auto` lets slotted images render at their natural height. Cards with different image sources will have different heights, making card grids visually inconsistent. No aspect ratio is set or documented. Consider `aspect-ratio: 16/9` as a default with a CSS custom property override (`--hx-card-image-aspect-ratio`), or at minimum document that consumers are responsible for enforcing consistent image dimensions.

---

### P2 — `--hx-transform-lift-md` token name does not follow project naming conventions

**File:** `hx-card.styles.ts:60`

```css
transform: translateY(var(--hx-transform-lift-md, -2px));
```

All other tokens follow `--hx-{category}-{scale}` naming: `--hx-shadow-lg`, `--hx-space-4`, `--hx-color-primary-500`. The token `--hx-transform-lift-md` uses `transform` as a category — this pattern does not exist elsewhere in the token system. Check whether `--hx-transform-lift-md` is defined in the token layer; if not, it is a one-off naming that won't be discoverable.

---

### P2 — Hardcoded hex fallback values throughout stylesheet

**File:** `hx-card.styles.ts` (multiple lines)

Examples:
- Line 11: `var(--hx-color-neutral-0, #ffffff)`
- Line 12: `var(--hx-color-neutral-800, #212529)`
- Line 14: `var(--hx-color-neutral-200, #dee2e6)`
- Line 44: `var(--hx-color-primary-500, #2563eb)`
- Line 64: `var(--hx-focus-ring-color, #2563eb)`

CLAUDE.md states "No hardcoded values — Colors, spacing, typography, and timing use design tokens. Always." While inline CSS fallbacks are a common pattern for component libraries, this violates the project zero-tolerance policy and means the component renders with hardcoded values if the token stylesheet fails to load. The fallbacks should reference other token variables or be removed if the token system is reliable.

---

## 6. Performance

### P2 — Token stylesheet injected per-instance via `tokenStyles`

**File:** `hx-card.ts:38`

```ts
static override styles = [tokenStyles, helixCardStyles];
```

`tokenStyles` is imported from `@helixui/tokens/lit` and included in every component's static styles. If `tokenStyles` is the full design token CSS (`:root { --hx-color-*: ...; --hx-space-*: ...; }`) it is loaded into every shadow root. Depending on the token file size, this could meaningfully impact bundle size and stylesheet evaluation time in pages with many card instances.

This is a systemic pattern shared with other components — flagging here so the token injection strategy can be audited once across the library.

---

### P2 — Five hidden slot wrapper divs always in the DOM

**File:** `hx-card.ts:144–162`

The render always creates `card__image`, `card__heading`, `card__footer`, `card__actions` wrappers, set to `hidden` when empty. This adds 4 extra DOM nodes to every card instance. For a dashboard with 50+ card instances, this is 200+ unnecessary hidden nodes. A conditional render using `when` directive or `nothing` for empty slots would eliminate this overhead. The current approach simplifies slot-change detection but has a DOM cost.

---

## 7. Drupal Integration

### P2 — No documented Drupal usage example or Twig template

**File:** (missing)

There is no `*.twig`, `*.drupal.md`, or Drupal-specific documentation for `hx-card`. All other documented components should ship with a usage example for the primary consumer. Given that `hx-card` is described as a "content container" and would be used widely in Drupal templates, the absence of a reference Twig template is a gap.

Example of what should exist:
```twig
<hx-card variant="{{ variant|default('default') }}" elevation="{{ elevation|default('flat') }}"
  {% if href %}hx-href="{{ href }}"{% endif %}>
  {% if heading %}
    <span slot="heading">{{ heading }}</span>
  {% endif %}
  {{ body }}
  {% if footer %}
    <span slot="footer">{{ footer }}</span>
  {% endif %}
  {% if actions %}
    <span slot="actions">{{ actions }}</span>
  {% endif %}
</hx-card>
```

---

### P2 — `hx-card-click` event has no Drupal behavior documentation

**File:** (missing)

When the card is used as a linked card (`hx-href`), the navigation is handled via the `hx-card-click` custom event. In Drupal, the default browser navigation does not occur — the consumer must attach a Drupal behavior to listen for `hx-card-click` and perform `window.location.href` assignment or Drupal's `Drupal.ajax` routing. This is non-obvious and undocumented.

---

## Summary Table

| # | Area | Severity | Issue |
|---|------|----------|-------|
| 1 | TypeScript | P1 | `@fires` JSDoc types `originalEvent` as `MouseEvent` only — misses `KeyboardEvent` |
| 2 | TypeScript | P2 | `CustomEvent` not generically typed at dispatch site |
| 3 | TypeScript | P2 | `hxHref` defaults to `''` not `string \| undefined` |
| 4 | Accessibility | P1 | `aria-label="Navigate to <URL>"` — non-descriptive, exposes raw URL to screen readers |
| 5 | Accessibility | P1 | Interactive card + actions slot anti-pattern unguarded; demonstrated in 7 stories |
| 6 | Accessibility | P1 | No `prefers-reduced-motion` guard on transitions/transforms |
| 7 | Accessibility | P2 | `tabindex` on inner shadow div, not host element |
| 8 | Accessibility | P2 | Heading slot provides no semantic heading role or guidance |
| 9 | Accessibility | P2 | axe-core test does not cover interactive + actions combination |
| 10 | Tests | P2 | No test for `hxHref` property change after initial render |
| 11 | Tests | P2 | No test for interactive + actions slot combination |
| 12 | Tests | P2 | Stale screenshot names with `wc-` prefix |
| 13 | Storybook | P1 | `InteractiveClickTest` play function checks `detail.url` — property is `detail.href`; assertion silently no-ops |
| 14 | Storybook | P1 | `wcHref` arg name is stale `wc-` prefix; conflicts with CEM-generated `hxHref` autodoc control |
| 15 | Storybook | P2 | External `placehold.co` image URLs break in offline/CI environments |
| 16 | Storybook | P2 | Horizontal card layout absent — called out in audit spec as expected feature |
| 17 | CSS | P1 | `--hx-card-gap` documented and advertised but never referenced in stylesheet |
| 18 | CSS | P1 | `.card--compact` only reduces body padding — heading/footer/actions retain full padding |
| 19 | CSS | P2 | No image aspect ratio enforcement — cards with different images have inconsistent heights |
| 20 | CSS | P2 | `--hx-transform-lift-md` token name does not follow project naming conventions |
| 21 | CSS | P2 | Hardcoded hex fallback values throughout stylesheet (violates zero-tolerance policy) |
| 22 | Performance | P2 | `tokenStyles` injected per shadow-root instance — systemic concern |
| 23 | Performance | P2 | Five hidden DOM nodes always present per card for empty slots |
| 24 | Drupal | P2 | No Twig template or Drupal usage documentation |
| 25 | Drupal | P2 | `hx-card-click` navigation pattern undocumented for Drupal behaviors |

**P0 count:** 0
**P1 count:** 7
**P2 count:** 18

---

## Drupal Fixes Applied

| Finding | Status |
|---------|--------|
| P2-16: No documented Drupal usage example or Twig template | **FIXED** — `hx-card.twig` template created with variant, elevation, hx-href, slots, and conditional rendering. `README.drupal.md` created with full Drupal integration guide. |
| P2-17: `hx-card-click` event has no Drupal behavior documentation | **FIXED** — `README.drupal.md` includes full Drupal behaviors example for `hx-click` navigation, AJAX navigation, and anti-pattern warning for `hx-href + actions` slot. Renamed event note: the component fires `hx-click` (not `hx-card-click`). |

---

*Audit complete. Do not modify the component source. Fix forward in separate tickets.*
