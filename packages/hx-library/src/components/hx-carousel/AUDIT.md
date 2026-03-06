# AUDIT: hx-carousel — T4-07 Antagonistic Quality Review

**Auditor:** Antagonistic quality agent
**Date:** 2026-03-06
**Files reviewed:**
- `hx-carousel.ts`
- `hx-carousel.styles.ts`
- `hx-carousel.test.ts`
- `hx-carousel.stories.ts`
- `hx-carousel-item.ts`
- `index.ts`

**Severity legend:**
- **P0** — Blocks release. Functional breakage or WCAG violation in production.
- **P1** — Must fix before merge. Spec non-compliance or significant accessibility gap.
- **P2** — Should fix before merge. Quality, maintainability, or coverage gap.
- **P3** — Low priority. Nice-to-have improvement.

---

## Accessibility

### P1 — Pagination dot labels missing "of N" total count

**File:** `hx-carousel.ts:435`

```ts
aria-label="Slide ${i + 1}"
```

The feature spec and WCAG best practices both require pagination dot labels to include the total slide count (e.g., `"Slide 1 of 5"`). A screen reader user hearing `"Slide 1, Slide 2, Slide 3"` has no way to know where they are relative to the total. The `hx-carousel-item` correctly uses `"Slide X of Y"` via its `aria-label`, but the pagination buttons do not.

**Expected:** `aria-label="Slide ${i + 1} of ${count}"`

---

### P1 — Hardcoded `aria-label="Carousel"` prevents multi-carousel pages

**File:** `hx-carousel.ts:552`

```ts
aria-label="Carousel"
```

The label is hardcoded. If a page contains two carousels (e.g., "Featured Products" and "Related Articles"), both will be announced as `"Carousel, region"` with zero differentiation. Screen reader users cannot distinguish them from the landmarks list. WCAG 1.3.1 (Info and Relationships) and WCAG 2.4.6 (Headings and Labels) are implicated.

**Required fix:** Expose an `aria-label` component property (e.g., `label: string`) defaulting to `"Carousel"`, reflected to the shadow DOM's `aria-label`. Consumer provides a meaningful label.

---

### P1 — Slide changes are invisible to screen readers (live region is non-functional)

**File:** `hx-carousel.ts:559–565`

```ts
aria-live=${isAutoplayStopped ? 'polite' : 'off'}
```

The `aria-live` region is placed on `.scroll-container`, which contains `.track`. Slide transitions are CSS `transform`-only — no DOM nodes are added, removed, or mutated. Screen reader live regions only announce when DOM *content* changes. The current setup guarantees that slide changes are **never announced** to screen reader users regardless of the `aria-live` value.

**Concrete impact:** A keyboard user presses ArrowRight. The visual slide changes. The screen reader announces nothing. The user has no confirmation that navigation succeeded.

**Required fix:** Maintain a visually hidden `aria-live="polite"` status region (separate from the track) whose text content is updated on every `_currentIndex` change (e.g., `"Slide 2 of 3"`). This is a DOM mutation the live region can detect.

---

### P1 — Missing `prev-btn` and `next-btn` CSS parts on navigation buttons

**File:** `hx-carousel.ts:383–413`, `hx-carousel.styles.ts`

The feature spec explicitly requires CSS parts: `carousel`, `slide`, `prev-btn`, `next-btn`, `pagination`. The current implementation exposes:

| Required Part | Implemented Part |
|---|---|
| `carousel` | `base` (renamed) |
| `slide` | ❌ not exposed |
| `prev-btn` | ❌ not exposed (only container `navigation`) |
| `next-btn` | ❌ not exposed (only container `navigation`) |
| `pagination` | ✅ |

The `play-pause-btn` also has no `part` attribute. Consumer teams cannot style individual navigation buttons without using deep CSS selectors, which violates Shadow DOM encapsulation principles.

**Also note:** JSDoc `@csspart` declarations do not match the spec-required part names, creating CEM inaccuracy.

---

### P2 — `aria-roledescription="carousel"` combined with `role="region"` may confuse screen readers

**File:** `hx-carousel.ts:551–554`

```ts
role="region"
aria-label="Carousel"
aria-roledescription="carousel"
```

`aria-roledescription` overrides the role announcement. Some screen readers will announce `"carousel"` (from `aria-roledescription`) instead of `"region"`. The element will not appear in screen reader landmark navigation as a "region" — it will appear as a custom `"carousel"` role. The combination is non-standard and ARIA Authoring Practices Guide does not recommend `aria-roledescription` on landmark roles. Since the component already has `role="region"` with a meaningful label, `aria-roledescription` adds ambiguity without accessibility value.

---

### P2 — `outline: none` on `slide-group` div removes all focus indication

**File:** `hx-carousel-item.ts:28`

```css
.slide-group {
  outline: none;
}
```

The `.slide-group` div has `tabindex="-1"` (programmatic focus) and `outline: none`. When JavaScript calls `.focus()` on a slide (which could happen via keyboard navigation patterns), no visible focus indicator appears. For a healthcare application under WCAG 2.4.7 (Focus Visible), any element that can receive focus must have a visible indicator. Even `tabindex="-1"` elements can receive programmatic focus and need indicators.

---

### P2 — No touch event support on drag navigation

**File:** `hx-carousel.ts:323–356`

The `mouseDragging` feature handles `mousedown`, `mousemove`, `mouseup`, `mouseleave` but zero touch events (`touchstart`, `touchmove`, `touchend`). Healthcare environments commonly use tablets. Mobile/touch users cannot use drag navigation at all.

---

## TypeScript

### P2 — `_resumeAutoplay` duplicates the timer callback from `_startAutoplay`

**File:** `hx-carousel.ts:244–256`

```ts
private _resumeAutoplay(): void {
  // ...
  this._autoplayTimer = setInterval(() => {
    if (this.loop) {
      this.goTo(this._currentIndex + this.slidesPerMove);
    } else if (this._currentIndex < this._maxIndex) {
      this.goTo(this._currentIndex + this.slidesPerMove);
    } else {
      this.goTo(0);
    }
  }, this.autoplayInterval);
}
```

This is a verbatim copy of the `setInterval` callback in `_startAutoplay`. If the advance logic changes (e.g., for slide-per-move behavior), it must be changed in two places. A missed update creates a split-brain bug where paused-then-resumed carousels behave differently from initially-started ones. Extract to a shared private method.

---

### P3 — `mouseDragging` property not reflected to host

**File:** `hx-carousel.ts:81–82`

```ts
@property({ type: Boolean, attribute: 'mouse-dragging' })
mouseDragging = false;
```

The `loop` and `autoplay` booleans use `reflect: true`, enabling CSS attribute selectors (`:host([loop])`, `:host([autoplay])`). `mouseDragging` silently omits `reflect: true`, creating an inconsistency. Consumer CSS cannot target `:host([mouse-dragging])`.

---

## Tests

### P1 — Pagination dot label test validates insufficient label format

**File:** `hx-carousel.test.ts:75–80`

```ts
it('pagination dots have aria-label="Slide N"', async () => {
  const dot1 = shadowQuery(el, '[part="pagination-item"][aria-label="Slide 1"]');
  expect(dot1).toBeTruthy();
});
```

This test encodes the wrong expected value (`"Slide 1"` instead of `"Slide 1 of 3"`). The test currently passes and acts as a **regression lock for the wrong behavior**. When the P1 accessibility fix is applied (adding "of N"), this test must be updated simultaneously or it will fail. More critically, as written it provides false confidence that the label format is correct.

---

### P2 — No test for `prefers-reduced-motion` blocking autoplay start

**File:** `hx-carousel.test.ts`

`_reducedMotion` is set in `connectedCallback` by `window.matchMedia('(prefers-reduced-motion: reduce)')`. There is no test that mocks this media query to `true` and verifies autoplay does not start. This is an explicit WCAG 2.3.3 (Animation from Interactions) requirement and a documented feature.

---

### P2 — No test verifying `goTo()` same-index no-op (event not fired)

**File:** `hx-carousel.ts:178`

```ts
if (next === this._currentIndex) return;
```

The guard preventing `hx-slide-change` from firing when navigating to the current index is untested. Consumers may rely on this contract (e.g., not re-fetching data if same slide is "selected"). If the guard is accidentally removed, no test catches it.

---

### P2 — No test for single-slide carousel (pagination hidden, buttons disabled)

**File:** `hx-carousel.test.ts`

A carousel with one slide should: (a) show no pagination, (b) have both nav buttons disabled when not looping. Neither condition is verified.

---

### P2 — No test for `mouseDragging=false` preventing drag navigation

**File:** `hx-carousel.test.ts`

The drag tests only verify that dragging works when enabled. There is no test confirming that dragging is a no-op when `mouse-dragging` attribute is absent (the default state).

---

### P2 — No test for `disconnectedCallback` cleaning up the autoplay timer

**File:** `hx-carousel.test.ts`

`disconnectedCallback` calls `_stopAutoplay()` which clears the interval. If this is regressed, the component will continue advancing after removal from the DOM, causing memory leaks and unexpected mutations in detached trees. This should be an explicit test.

---

## Storybook

### P2 — All stories use static `render: () => html\`...\`` ignoring `args`

**File:** `hx-carousel.stories.ts:134–253`

All 8 stories use a `render` function that hard-codes values and does not consume the `args` parameter. The `argTypes` in `meta` define controls with correct types, but since `args` is never passed to the render template, every Storybook control is non-functional. Clicking "loop: true" in the controls panel does nothing to the rendered story.

**This makes autodocs controls a visual lie** — they appear interactive but have zero effect. For a component library, this undermines developer trust.

---

### P2 — `ImageCarousel` story uses external picsum.photos URLs

**File:** `hx-carousel.stories.ts:199–217`

```ts
src="https://picsum.photos/seed/a/600/300"
```

Healthcare environments with strict network egress rules or air-gapped deployments will see broken images. Stories should use local asset files or data URIs, not public CDN URLs.

---

### P2 — Unused `_canvas` variable in `Default` story play function

**File:** `hx-carousel.stories.ts:141`

```ts
const _canvas = within(canvasElement);
```

`_canvas` is assigned but never used. This is dead code. Under TypeScript strict mode with `noUnusedLocals`, this should be a type error. Suggests the play function was partially written.

---

### P3 — No story explicitly demonstrating pagination dots as primary navigation

**File:** `hx-carousel.stories.ts`

The spec requests a `WithPagination` story. All stories implicitly have pagination when they have 2+ slides, but no story focuses the user's attention on pagination-only navigation (no nav buttons, pagination prominent). This is a gap in the documentation of the pagination use case.

---

## CSS

### P2 — `scroll-container` CSS part is misnamed relative to semantic meaning

**File:** `hx-carousel.styles.ts:108–111`

The element with `part="scroll-container"` does not actually scroll — it uses `overflow: hidden` and the inner `.track` moves via CSS `transform`. The part name implies scrollable behavior, which could mislead consumers who try to style scrollbar appearance or intercept scroll events on this element. A more accurate name would be `viewport` or `slide-viewport`.

---

### P3 — No component-level CSS custom properties for key layout values

**File:** `hx-carousel.ts:27–28` (JSDoc)

The component exposes only `--hx-carousel-gap` and `--hx-carousel-slide-width`. Consumer teams cannot override navigation button sizing, pagination dot size, or nav button visibility without targeting internal token variables. Other components in the library expose `--hx-[component]-[property]` component-level overrides for these values.

---

## Performance

### P3 — Inline SVG icons increase template parse cost on every render

**File:** `hx-carousel.ts:448–540`

Four inline SVG blocks (`_renderPrevIcon`, `_renderNextIcon`, `_renderPlayIcon`, `_renderPauseIcon`) are each rendered through `html` tagged templates. SVG content is static, so parsing happens on every `render()` call. Promoting these to module-level `html` tag constants (`const prevIcon = html\`...\``) would allow Lit to cache the template result and skip re-parsing.

---

## Drupal Compatibility

### P1 — No Drupal integration file or Twig documentation

**File:** `packages/hx-library/src/components/hx-carousel/`

The feature specification explicitly requires "Drupal — Twig-renderable" as an audit area. The component directory contains no:
- Twig template (`.html.twig`)
- Drupal behaviors file (`hx-carousel.behaviors.js`)
- Integration documentation

Other components in the system pattern include Drupal integration artifacts. This component is unverified for Drupal CMS compatibility. The web component standard means it *should* be Twig-renderable, but without a template example and behavioral attachment, Drupal consumers have no reference implementation.

---

## Summary Table

| # | File | Severity | Finding |
|---|------|----------|---------|
| 1 | `hx-carousel.ts:435` | **P1** | Pagination dot `aria-label` missing "of N" total count |
| 2 | `hx-carousel.ts:552` | **P1** | Hardcoded `aria-label="Carousel"` blocks multi-carousel pages |
| 3 | `hx-carousel.ts:559` | **P1** | `aria-live` region is non-functional — slide changes invisible to screen readers |
| 4 | `hx-carousel.ts:383` | **P1** | Missing `prev-btn`, `next-btn` CSS parts; `base` vs `carousel` name mismatch |
| 5 | `hx-carousel.test.ts:78` | **P1** | Test locks in wrong pagination label format (`"Slide 1"` not `"Slide 1 of 3"`) |
| 6 | `hx-carousel/` (dir) | **P1** | No Drupal Twig template or integration documentation |
| 7 | `hx-carousel.ts:551` | **P2** | `aria-roledescription="carousel"` + `role="region"` is non-standard |
| 8 | `hx-carousel-item.ts:28` | **P2** | `outline: none` removes focus indicator from focusable slide group |
| 9 | `hx-carousel.ts:323` | **P2** | No touch event support — tablets cannot use drag navigation |
| 10 | `hx-carousel.ts:244` | **P2** | `_resumeAutoplay` duplicates timer callback from `_startAutoplay` |
| 11 | `hx-carousel.test.ts` | **P2** | No test for `prefers-reduced-motion` preventing autoplay |
| 12 | `hx-carousel.test.ts` | **P2** | No test for `goTo()` same-index no-op |
| 13 | `hx-carousel.test.ts` | **P2** | No test for single-slide carousel edge case |
| 14 | `hx-carousel.test.ts` | **P2** | No test for `mouseDragging=false` preventing drag |
| 15 | `hx-carousel.test.ts` | **P2** | No test for `disconnectedCallback` timer cleanup |
| 16 | `hx-carousel.stories.ts` | **P2** | All stories ignore `args` — Storybook controls non-functional |
| 17 | `hx-carousel.stories.ts:199` | **P2** | External picsum.photos URLs fail in air-gapped environments |
| 18 | `hx-carousel.stories.ts:141` | **P2** | Unused `_canvas` variable in Default play function |
| 19 | `hx-carousel.styles.ts:109` | **P2** | `scroll-container` part name is semantically misleading |
| 20 | `hx-carousel.ts:81` | **P3** | `mouseDragging` not reflected to host (inconsistent with `loop`, `autoplay`) |
| 21 | `hx-carousel.ts:448` | **P3** | Inline SVG icons re-parsed on every render — use module-level constants |
| 22 | `hx-carousel.stories.ts` | **P3** | No dedicated `WithPagination` story |
| 23 | `hx-carousel.ts:27` | **P3** | No component-level CSS custom properties for button sizing, dot sizing |

---

## Release Gate Assessment

| Gate | Status | Blocker |
|------|--------|---------|
| TypeScript strict | ✅ Pass | No `any` types, no non-null assertions |
| Tests | ⚠️ Partial | 5 missing coverage scenarios (P2); 1 test validates wrong value (P1) |
| Accessibility WCAG 2.1 AA | ❌ Fail | P1: Live region non-functional; P1: Hardcoded non-distinguishable label; P1: Pagination labels missing context |
| Storybook | ⚠️ Partial | Controls non-functional across all stories (P2) |
| CEM accuracy | ⚠️ Partial | CSS parts in JSDoc don't match spec (`base` vs `carousel`; missing `prev-btn`, `next-btn`) |
| Bundle size | ✅ Likely pass | No external carousel library; self-contained |
| Drupal | ❌ Unverified | No Twig template or Drupal behaviors file |

**Verdict: BLOCKED.** Three P1 accessibility findings (non-functional live region, undifferentiated label, pagination label format) constitute WCAG 2.1 AA violations. One P1 test finding encodes the wrong expected value. Drupal compatibility is unverified against the spec requirement.
