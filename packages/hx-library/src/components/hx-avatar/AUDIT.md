# AUDIT: hx-avatar — Antagonistic Quality Review (T1-21)

**Reviewer:** Automated antagonistic audit agent
**Date:** 2026-03-05
**Component:** `hx-avatar` — `packages/hx-library/src/components/hx-avatar/`
**Files reviewed:** `hx-avatar.ts`, `hx-avatar.styles.ts`, `hx-avatar.stories.ts`, `hx-avatar.test.ts`, `index.ts`

---

## Summary

`hx-avatar` is a well-structured component with good fallback chain logic and clean CSS token usage. However, several issues range from silent functional regressions (P0) to accessibility gaps that violate the healthcare mandate. The critical path: two P0 bugs (image error state not reset; badge clipped by overflow:hidden), one P1 ARIA issue (generic fallback label), and missing test coverage for image error recovery.

---

## Findings

### P0 — Critical

---

#### P0-1: `_imgError` state never resets when `src` changes

**File:** `hx-avatar.ts:72-98`

`_imgError` is a `@state()` that flips to `true` on image load failure, but is never reset when the `src` property changes. If a consumer renders an avatar with a broken URL first and later updates `src` to a valid URL (e.g., after a network retry, or avatar upload), `_imgError` remains `true` and the image is permanently suppressed. The fallback icon or initials will show even when a valid image is now available.

```ts
// No `updated()` lifecycle hook or property setter to reset _imgError on src change
@state()
private _imgError = false;
```

**Impact:** Silent regression in real usage. Healthcare UIs commonly update user avatars after profile completion. The avatar will stay broken indefinitely without a page reload.

**Expected fix:** Reset `_imgError = false` in `updated(changedProperties)` when `src` changes.

---

#### P0-2: Badge slot clipped by `overflow: hidden` on parent

**File:** `hx-avatar.styles.ts:13, 88-94`

The `.avatar` container has `overflow: hidden` (required for circular clipping). The `.avatar__badge` span is positioned `absolute; bottom: 0; right: 0;` inside that same container. Any badge content that bleeds outside the avatar bounds — which is the standard pattern for status indicator dots — will be clipped and invisible.

```css
.avatar {
  overflow: hidden; /* clips the badge */
}

.avatar__badge {
  position: absolute;
  bottom: 0;
  right: 0;
  /* no transform to push badge outside the overflow boundary */
}
```

The `WithBadge` story uses a `0.75rem` dot with a `2px white border`. The white border and any visual overflow beyond the avatar edge are silently cut off.

**Impact:** The badge feature is visually broken in any non-trivial implementation. The story demonstrates it, but the border ring that visually separates the badge from the avatar is clipped.

**Expected fix:** Move `.avatar__badge` outside the `overflow: hidden` container, or restructure using a wrapping element that applies `overflow: hidden` only to the avatar image/initials layer.

---

### P1 — High

---

#### P1-1: Generic `aria-label="Avatar"` hardcoded as fallback — non-descriptive in healthcare

**File:** `hx-avatar.ts:128`

```ts
const ariaLabel = showImage ? this.alt || 'Avatar' : showInitials ? this.initials : 'Avatar';
```

Three cases produce a non-descriptive label:

1. `src` is set but `alt` is `''` (the default) — `ariaLabel = 'Avatar'`
2. Fallback icon mode (no src, no initials) — `ariaLabel = 'Avatar'`
3. `src` fails to load, no initials — `ariaLabel = 'Avatar'`

In a healthcare EHR, an avatar may represent a patient, clinician, or care team member. `'Avatar'` tells a screen reader user nothing. There is no separate `aria-label` property the consumer can pass to override this in fallback mode. The `alt` attribute drives image semantics, but there is no `label` property for non-image states.

**Impact:** WCAG 2.1 SC 1.1.1 (Non-text Content). Assistive technology users cannot identify whose avatar is displayed in fallback states.

---

#### P1-2: `alt` property is not required when `src` is provided — no validation or warning

**File:** `hx-avatar.ts:45-46`

```ts
@property({ type: String })
alt = '';
```

`alt` defaults to empty string. There is no TypeScript enforcement, runtime warning, or Lit `willUpdate()` check that requires a meaningful `alt` when `src` is set. A developer can write `<hx-avatar src="photo.jpg">` and receive zero feedback that they've created an accessibility violation.

The image element renders `alt=""` (making it decorative to screen readers), while the wrapping div has `role="img" aria-label="Avatar"` — contradictory semantics. The image appears decorative but the container claims to be a meaningful image with a generic label.

**Impact:** Silent accessibility regression at callsite. Healthcare mandate requires WCAG 2.1 AA at all times.

---

#### P1-3: `role="img"` on container + `<img alt="">` inside creates double semantics

**File:** `hx-avatar.ts:140-141, 144-152`

When `src` is provided and `alt=""` (default), the rendered output is:

```html
<div role="img" aria-label="Avatar">
  <img src="..." alt="" />  <!-- treated as decorative -->
</div>
```

Some screen readers (NVDA, JAWS) will announce the `role="img"` container with its `aria-label`, then also process the inner `<img>`. Even with `alt=""`, this double-nesting of image semantics is fragile and non-standard. The conventional approach is either: (a) use only the `<img>` with a proper `alt`, or (b) use the container `role="img"` and mark the inner `<img>` with `aria-hidden="true"`.

---

#### P1-4: No test for image load failure → fallback recovery

**File:** `hx-avatar.test.ts`

The test suite has no test that:
- Sets `src` to a URL that will fail to load and verifies the initials fallback renders
- Sets `src` to a URL that will fail to load (no initials) and verifies the icon fallback renders
- Simulates `_handleImgError()` directly and verifies re-render

The only fallback chain tests are for `src` absent/empty scenarios — not for the actual error path that the `@error` handler is meant to cover. The image error handling code (`_handleImgError`, `_imgError` state) is entirely untested.

---

#### P1-5: No test for `_imgError` reset on `src` change (consequence of P0-1)

**File:** `hx-avatar.test.ts`

Since `_imgError` never resets (P0-1), there is also no regression test that would catch this. A test that: (1) renders with broken src, (2) updates `src` to a valid URL, (3) asserts the image renders — does not exist. The bug would ship silently.

---

#### P1-6: Story `render` function sends `src=""` when `src` is `undefined`

**File:** `hx-avatar.stories.ts:73-81`

```ts
render: (args) => html`
  <hx-avatar
    src=${args.src ?? ''}   // sends empty string, not nothing
    ...
  ></hx-avatar>
`,
```

When `src` is `undefined` (the default), `args.src ?? ''` produces `''`, and `src=""` is rendered as a DOM attribute. The component evaluates `!!src` where `src = ''` is falsy, so it falls through to initials/icon — accidentally correct behavior. However, the browser may still attempt to resolve a resource for `src=""` (a same-origin request to the current page URL in some browsers). This is a latent bug and a misleading render template.

The correct approach is `src=${args.src}` and let Lit omit the attribute natively when the value is `undefined`.

---

#### P1-7: Initials `aria-label` exposes raw initials string — not human-readable

**File:** `hx-avatar.ts:128`

```ts
const ariaLabel = showImage ? this.alt || 'Avatar' : showInitials ? this.initials : 'Avatar';
```

When displaying initials, the `aria-label` is set to `this.initials` (e.g., `"JD"`). A screen reader announces "JD" — initials pronounced as letters, not a name. There is no separate property (e.g., `label` or `full-name`) for providing a human-readable label distinct from the displayed initials string.

In healthcare, a clinician avatar labeled "JD" instead of "Dr. Jane Doe" is a meaningful information gap for AT users.

---

### P2 — Medium

---

#### P2-1: No type-level guard for invalid `size` or `shape` attribute values

**File:** `hx-avatar.ts:59-67`

TypeScript typing is correct at the class level (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`), but attributes are stringly-typed at the HTML boundary. If a Twig template passes `hx-size="xxl"` or `shape="rounded"`, the component silently renders with broken CSS classes (e.g., `avatar--xxl` matches no CSS rule). No console warning, no validation, no fallback to `md`.

---

#### P2-2: Empty badge `<span>` always present in DOM even without badge content

**File:** `hx-avatar.ts:158-160`

```ts
<span part="badge" class="avatar__badge">
  <slot name="badge"></slot>
</span>
```

The badge wrapper span is always rendered regardless of whether the badge slot has content. An empty `<span>` positioned `absolute` at bottom-right is present in every avatar. This adds unnecessary DOM nodes and the absolutely-positioned empty element may interfere with hit-testing or AT tree in some environments.

---

#### P2-3: `Sizes` and `Shapes` stories render avatars with no meaningful `alt` text

**File:** `hx-avatar.stories.ts:171-195, 205-218`

The `Sizes` and `Shapes` composite stories render `<hx-avatar initials="XS">` etc. with no `alt` attribute. The component's `ariaLabel` falls through to `this.initials` ("XS", "SM", etc.) — abbreviated labels, not descriptive names. Stories serve as documentation; demonstrating accessibility violations in documented examples is harmful to adopters.

---

#### P2-4: No story demonstrating image load failure / broken `src` fallback

**File:** `hx-avatar.stories.ts`

The `FallbackChain` story demonstrates three states (image loaded, initials, icon), but does not demonstrate the image-error-recovery path: a broken `src` that falls back to initials, or a broken `src` with no initials that falls back to the icon. This is the most important fallback behavior for developers to understand, and is the path with zero test coverage (P1-4).

---

#### P2-5: No `:host([hidden])` rule

**File:** `hx-avatar.styles.ts`

`:host { display: inline-block; }` is set, but there is no `:host([hidden]) { display: none !important; }` rule. Custom elements with an explicit `display` style ignore the standard HTML `hidden` attribute, making it impossible for consumers to conditionally hide the avatar via the standard DOM mechanism.

---

#### P2-6: Missing Drupal integration documentation or Twig example

**File:** component directory

There is no README, Twig template example, or Drupal behavior stub. For a component with Drupal as a primary consumer, the `hx-size` attribute name (with hyphen) is unusual in Twig attribute maps and requires explicit quoting (`{ 'hx-size': 'lg' }`). No guidance is provided. The `initials` and `alt` attributes are server-side-renderable — this should be documented, including how to handle the fallback chain server-side (compute initials from name, pass `alt` as the full name).

---

#### P2-7: `setTimeout(50)` timing-based waits in tests are fragile

**File:** `hx-avatar.test.ts:42, 68, 144, 165`

Multiple tests use `await new Promise((r) => setTimeout(r, 50))` to wait for slot change detection. This is timing-based and may be flaky on slow CI runners or pass incorrectly on fast ones. The `slotchange` event fires after the browser assigns slot content. The correct approach is to await `el.updateComplete` after the `slotchange` event fires, or use `oneEvent(el, 'slotchange')` from test-utils if available.

---

#### P2-8: `axe-core` tests cover only 2 of 5 avatar rendering modes

**File:** `hx-avatar.test.ts:209-226`

The axe-core tests cover:
- ✅ Default (fallback icon)
- ✅ Initials

Not covered:
- ❌ Image mode (`src` with valid `alt`)
- ❌ Image mode with `alt=""` (the dangerous default — would catch P1-2)
- ❌ Slotted content mode
- ❌ Badge slot with content

---

## Findings Summary Table

| ID   | Severity | Area          | Title                                                          |
|------|----------|---------------|----------------------------------------------------------------|
| P0-1 | P0       | TypeScript/UX | `_imgError` never resets on `src` change — permanent breakage  |
| P0-2 | P0       | CSS           | Badge clipped by `overflow: hidden` on avatar container        |
| P1-1 | P1       | Accessibility | Generic `aria-label="Avatar"` — non-descriptive in healthcare  |
| P1-2 | P1       | Accessibility | `alt` not required when `src` provided — silent a11y failure   |
| P1-3 | P1       | Accessibility | `role="img"` + inner `<img alt="">` = double semantics         |
| P1-4 | P1       | Tests         | No test for image load failure → fallback recovery             |
| P1-5 | P1       | Tests         | No test for `_imgError` reset on `src` change                  |
| P1-6 | P1       | Storybook     | Story render sends `src=""` instead of omitting attribute      |
| P1-7 | P1       | Accessibility | Initials `aria-label` exposes raw initials, not a full name    |
| P2-1 | P2       | TypeScript    | No runtime guard for invalid `size`/`shape` values             |
| P2-2 | P2       | CSS/DOM       | Empty badge `<span>` always in DOM                             |
| P2-3 | P2       | Storybook     | `Sizes`/`Shapes` stories have no meaningful `alt` text         |
| P2-4 | P2       | Storybook     | No story for broken `src` → fallback recovery path             |
| P2-5 | P2       | CSS           | No `:host([hidden])` display:none rule                         |
| P2-6 | P2       | Drupal        | No Twig integration example or documentation                   |
| P2-7 | P2       | Tests         | `setTimeout(50)` timing-based waits are fragile                |
| P2-8 | P2       | Tests         | axe-core covers only 2 of 5 avatar rendering modes             |
