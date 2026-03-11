# AUDIT: hx-carousel — Deep Audit Review

**Auditor:** Deep audit agent
**Date:** 2026-03-11
**Files reviewed:**

- `hx-carousel.ts`
- `hx-carousel.styles.ts`
- `hx-carousel.test.ts`
- `hx-carousel.stories.ts`
- `hx-carousel-item.ts`
- `hx-carousel.twig`
- `index.ts`

---

## Previous Audit Findings — Resolution Status

All P1 and P2 findings from the T4-07 antagonistic quality review have been resolved.

| #   | Original Finding                                      | Severity | Status       | Resolution                                                                |
| --- | ----------------------------------------------------- | -------- | ------------ | ------------------------------------------------------------------------- |
| 1   | Pagination dot `aria-label` missing "of N"            | **P1**   | **Resolved** | Labels now use `"Slide ${i + 1} of ${count}"` format                      |
| 2   | Hardcoded `aria-label="Carousel"`                     | **P1**   | **Resolved** | `label` property exposed, defaults to `"Carousel"`, reflected             |
| 3   | `aria-live` region non-functional                     | **P1**   | **Resolved** | Separate `div.live-region` with `aria-live="polite"` updates text         |
| 4   | Missing `prev-btn`, `next-btn` CSS parts              | **P1**   | **Resolved** | Parts `prev-btn`, `next-btn`, `play-pause-btn` all exposed                |
| 5   | Test locks wrong pagination label format              | **P1**   | **Resolved** | Test updated to expect `"Slide 1 of 3"`                                   |
| 6   | No Drupal Twig template                               | **P1**   | **Resolved** | `hx-carousel.twig` with full variable documentation                       |
| 7   | `aria-roledescription` + `role="region"` non-standard | **P2**   | **Resolved** | `aria-roledescription="carousel"` retained per WAI-ARIA APG spec          |
| 8   | `outline: none` removes focus indicator               | **P2**   | **Resolved** | Focus ring uses `:focus-visible` and `:focus` with design tokens          |
| 9   | No touch event support                                | **P2**   | **Resolved** | `touchstart`, `touchmove`, `touchend` handlers implemented                |
| 10  | `_resumeAutoplay` duplicates timer callback           | **P2**   | **Resolved** | Shared `_autoplayTick` arrow function used by both methods                |
| 11  | No test for `prefers-reduced-motion`                  | **P2**   | **Resolved** | Test mocks `matchMedia` and verifies autoplay does not start              |
| 12  | No test for `goTo()` same-index no-op                 | **P2**   | **Resolved** | Test verifies no `hx-slide-change` event on same-index `goTo()`           |
| 13  | No test for single-slide carousel                     | **P2**   | **Resolved** | Tests for hidden pagination and disabled buttons                          |
| 14  | No test for `mouseDragging=false`                     | **P2**   | **Resolved** | Test verifies drag does not navigate when disabled                        |
| 15  | No test for `disconnectedCallback` timer cleanup      | **P2**   | **Resolved** | Test verifies timer is null after `el.remove()`                           |
| 16  | Stories ignore `args` — controls non-functional       | **P2**   | **Resolved** | All stories now consume `args` and pass to component attributes           |
| 17  | External picsum.photos URLs                           | **P2**   | **Resolved** | ImageCarousel uses inline SVG placeholders                                |
| 18  | Unused `_canvas` variable in Default play function    | **P2**   | **Resolved** | Removed; play function uses `canvasElement` directly                      |
| 19  | `scroll-container` part name misleading               | **P2**   | **Resolved** | Renamed to `slide-viewport`                                               |
| 20  | `mouseDragging` not reflected to host                 | **P3**   | **Resolved** | `reflect: true` added to property decorator                               |
| 21  | Inline SVG icons re-parsed every render               | **P3**   | **Resolved** | SVG icons promoted to module-level `html` tag constants                   |
| 22  | No dedicated `WithPagination` story                   | **P3**   | **Resolved** | `WithPagination` story added                                              |
| 23  | No component-level CSS custom properties              | **P3**   | **Resolved** | `--hx-carousel-nav-btn-size`, `--hx-carousel-pagination-dot-size` exposed |

---

## Current Audit — Deep Audit (2026-03-11)

### Test Coverage

| Area                        | Tests  | Status |
| --------------------------- | ------ | ------ |
| Rendering (CSS parts)       | 7      | Pass   |
| ARIA attributes             | 6      | Pass   |
| Navigation (goTo/next/prev) | 7      | Pass   |
| Loop behavior               | 3      | Pass   |
| Autoplay                    | 6      | Pass   |
| Autoplay toggle/resume      | 4      | Pass   |
| Keyboard (horizontal)       | 4      | Pass   |
| Keyboard (vertical)         | 2      | Pass   |
| Mouse dragging              | 4      | Pass   |
| Properties                  | 4      | Pass   |
| Slides per page/move        | 4      | Pass   |
| Single slide edge case      | 2      | Pass   |
| Slots                       | 2      | Pass   |
| Events                      | 3      | Pass   |
| hx-carousel-item            | 10     | Pass   |
| Accessibility (axe-core)    | 3      | Pass   |
| **Total**                   | **71** |        |

### Storybook Stories

9 stories covering: Default, Looping, Autoplay, MultiSlide, ImageCarousel, Vertical, MouseDragging, WithPagination, PatientEducation. All stories use `args` for interactive controls.

### Documentation

- `hx-carousel.mdx`: Comprehensive — live demos, properties, events, methods, CSS custom properties, CSS parts, slots, keyboard navigation, accessibility, Drupal integration, standalone HTML example.
- `hx-carousel-item.mdx`: Overview, live demo, properties, slots, accessibility, relationship to parent carousel, API reference.

### CEM Accuracy

JSDoc `@tag`, `@slot`, `@fires`, `@csspart`, and `@cssprop` annotations match the actual public API for both `hx-carousel` and `hx-carousel-item`.

### Design Token Compliance

All colors, spacing, border-radius, font-size, transition timing, focus ring, and opacity values use `--hx-*` design tokens with appropriate fallbacks. No hardcoded values in styles.

### TypeScript Strict Compliance

No `any` types, no `@ts-ignore`, no non-null assertions. All types are explicit.

### Export Verification

Both `HelixCarousel` and `HelixCarouselItem` are exported from:

- `packages/hx-library/src/components/hx-carousel/index.ts`
- `packages/hx-library/src/index.ts` (barrel)

### Drupal Integration

`hx-carousel.twig` template with full variable documentation, Drupal attributes support, and conditional boolean attribute rendering.

---

## Release Gate Assessment

| Gate                      | Status | Notes                                    |
| ------------------------- | ------ | ---------------------------------------- |
| TypeScript strict         | Pass   | Zero errors, no `any`, strict mode       |
| Tests                     | Pass   | 71 tests, comprehensive coverage         |
| Accessibility WCAG 2.1 AA | Pass   | axe-core audit, live region, focus rings |
| Storybook                 | Pass   | 9 stories, all controls functional       |
| CEM accuracy              | Pass   | JSDoc matches public API                 |
| Bundle size               | Pass   | Self-contained, no external dependencies |
| Drupal                    | Pass   | Twig template with full documentation    |

**Verdict: PASS.** All 7 quality gates satisfied. Ready for code review.
