# hx-toast Antagonistic Quality Audit (T2-07)

**Audited files:**

- `hx-toast.ts`
- `hx-toast.styles.ts`
- `hx-toast.test.ts`
- `hx-toast.stories.ts`
- `index.ts`

**Audit date:** 2026-03-06
**Auditor:** Antagonistic review agent

---

## Summary

| Severity | Count |
| -------- | ----- |
| P0       | 0     |
| P1       | 5     |
| P2       | 8     |

The implementation is structurally sound — TypeScript is strict, CEM docs are accurate, axe-core passes, and the component renders correctly. However, five P1 issues block ship: the hidden toast is exposed to the accessibility tree, the live region lacks `aria-atomic`, the imperative `toast()` utility is completely untested, Drupal JS behaviors are entirely absent, and the hover-resume timer resets to full duration rather than remaining time.

---

## P1 — High Severity (must fix before merge)

### P1-01: Closed toast is fully exposed to the accessibility tree — **FIXED**

**File:** `hx-toast.ts:197–246`

**Fix:** Added `aria-hidden="true"` management in the `updated()` lifecycle hook. When `open` changes to `false`, `aria-hidden="true"` is set on the host element. When `open` changes to `true`, `aria-hidden` is removed. Tests added verifying `aria-hidden` is set when closed and absent when open.

When `open=false`, the `.toast` div is still rendered in the shadow DOM with `role="status"` (or `role="alert"` for `danger`). It is visually hidden via `opacity: 0` and `pointer-events: none` only. Screen readers traverse the shadow DOM and will encounter the live region and its content regardless of visibility.

**WCAG violation risk:** 4.1.2 Name, Role, Value — hidden content is exposed to assistive technology.

**Expected behavior:** When `open=false`, the host element or the inner base div should carry `aria-hidden="true"`, or the content should be conditionally removed from the DOM (conditional render when closed), or the `hidden` attribute should be applied.

**Current state:** No `aria-hidden` is applied anywhere on the host or inner div when closed. A page with `<hx-toast>Critical alert</hx-toast>` (no `open`) will expose "Critical alert" in a `role="status"` live region to screen readers.

**Healthcare impact:** Critical. In healthcare UIs, ambient invisible live regions can announce stale alerts to screen reader users, causing confusion.

---

### P1-02: `aria-atomic` is missing on the live region — **FIXED**

**File:** `hx-toast.ts:205–206`

**Fix:** Added `aria-atomic="true"` to the `.toast` div in the render template. Test added verifying `aria-atomic="true"` is present on the live region base element.

The `.toast` div has `role="alert"` / `role="status"` and `aria-live="assertive"` / `aria-live="polite"` but lacks `aria-atomic="true"`.

Without `aria-atomic="true"`, screen readers may read only the changed portion of the live region (e.g., just the icon slot text, or just the action button label) rather than the full notification message. This is particularly dangerous for `role="alert"` on the `danger` variant where full announcement is mandatory.

**WCAG violation risk:** 4.1.3 Status Messages — incomplete announcements may not convey the full notification.

**Expected behavior:** `aria-atomic="true"` should be set on the live region container so the entire toast content is announced atomically.

---

### P1-03: `toast()` imperative utility function is completely untested

**File:** `hx-toast.ts:330–366`, `hx-toast.test.ts` (entire file)

The `toast()` function is the primary programmatic API for creating toasts. It handles:

- Finding or creating `hx-toast-stack` on `document.body`
- Stack limit enforcement (hiding oldest toast at capacity)
- Auto-removal of toast element after `hx-after-hide`

None of this logic has a single test. The `hx-toast-stack` tests in `hx-toast.test.ts` only cover basic rendering and axe — they do not exercise the `toast()` utility at all.

**Coverage gap:** The `toast()` function contains meaningful conditional logic (stack creation, limit enforcement, DOM lifecycle cleanup) that is entirely dark from a test perspective. Bugs here would go undetected.

**Expected behavior:** Test coverage for:

- `toast()` creates a `hx-toast-stack` on `document.body` if none exists
- `toast()` reuses an existing `hx-toast-stack` for the same placement
- Stack limit enforcement hides the oldest open toast
- Toast element is removed from DOM after `hx-after-hide`
- `toast()` returns the created `HelixToast` element

---

### ~~P1-04: No Drupal JS behaviors file~~ FIXED

**File:** `hx-toast.drupal.js`

**Resolution:** `hx-toast.drupal.js` added providing `Drupal.behaviors.hxToast` that:
- Attaches to elements with `data-hx-toast` attributes containing JSON-encoded options
- Dynamically imports `toast()` from `@helixui/library` on click (tree-shaking friendly)
- Uses a `dataset.hxToastAttached` guard to prevent double-binding on AJAX/BigPipe updates
- Detaches cleanly on `'unload'` to prevent memory leaks on partial DOM replacement
- Announces parse errors and load failures via `Drupal.announce()` for accessibility

A `DrupalIntegration` story was also added to `hx-toast.stories.ts` documenting the full
`data-hx-toast` trigger pattern, supported options (message, variant, duration, placement,
closable), and `mytheme.libraries.yml` registration including the `.drupal.js` file.

---

### P1-05: Hover-resume restarts timer at full duration, not remaining time

**File:** `hx-toast.ts:161–178`

`_handleMouseLeave()` calls `this._startTimer()` which calls `setTimeout(() => { this.open = false; }, this.duration)` — always using the original full `duration`. There is no tracking of elapsed time before hover.

**Example:** A 3000ms toast is hovered at 2800ms. The user moves the mouse away. The toast will now stay visible for another 3000ms (full duration) instead of the expected ~200ms.

This is a surprising UX bug: users hovering briefly near end-of-life toasts restart the full countdown, causing toasts to linger far longer than intended.

**Healthcare impact:** Medium. Critical toasts (e.g., medication reminders) may persist unexpectedly long due to incidental mouse movement, reducing urgency signaling.

**Expected behavior:** Track the timestamp when the timer starts (`_timerStartedAt`), compute remaining time on resume, and call `setTimeout` with `remaining` time instead of `this.duration`.

---

## P2 — Medium Severity (should fix in follow-up sprint)

### ~~P2-01: `prefers-reduced-motion` suppresses animation only, not auto-dismiss timer~~ FIXED

**File:** `hx-toast.ts:139–142`

**Resolution:** `_startTimer` now checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at the start and returns early if true, preventing the auto-dismiss timer from firing when the user has requested reduced motion.

---

### P2-02: `hx-toast-stack` `stackLimit` enforcement is untested

**File:** `hx-toast.test.ts:378–424`

The `hx-toast-stack` describe block tests shadow DOM, CSS part, placement attribute, and `stackLimit` attribute parsing — but contains zero tests verifying the actual `stackLimit` enforcement behavior. No test checks that the oldest visible toast is hidden when a new toast causes the count to exceed `stackLimit`.

This is the primary behavioral contract of `hx-toast-stack` and it has no test coverage.

---

### P2-03: `disconnectedCallback` timer cleanup is untested

**File:** `hx-toast.ts:98–101`, `hx-toast.test.ts` (entire file)

`disconnectedCallback` calls `_clearTimer()` to prevent orphaned timers when the element is removed from the DOM. This cleanup path is never tested. If a future refactor accidentally removes or breaks this method, timers will leak silently.

---

### ~~P2-04: Slide animation direction does not vary by placement~~ FIXED

**File:** `hx-toast.styles.ts`

**Resolution:** The `hx-toast-stack` styles now set `--hx-toast-enter-translate` to `calc(var(--hx-space-2, 0.5rem) * -1)` for `top-*` placements via the `::slotted(hx-toast)` selector. Toasts in top-positioned stacks slide downward from above; toasts in bottom-positioned stacks slide upward from below. The `--hx-toast-enter-translate` CSS custom property in `hx-toast.styles.ts` uses the parent-set value as its default.

---

### ~~P2-05: `action` slot wrapper has no CSS part~~ FIXED

**File:** `hx-toast.ts`, JSDoc at lines 33–36

**Resolution:** `part="action"` added to `<span class="toast__action">` and documented in JSDoc `@csspart` block. Consumers can now style the action wrapper via `::part(action)`.

---

### P2-06: Close button `aria-label` is hardcoded English with no i18n support — **FIXED**

**File:** `hx-toast.ts:226`

**Fix:** Added `closeLabel` property (attribute `close-label`) defaulting to `'Dismiss notification'`. The close button now uses `aria-label=${this.closeLabel}`. Test added verifying custom `close-label` attribute value is applied to the button's `aria-label`.

```ts
aria-label="Dismiss notification"
```

The label is hardcoded English. Healthcare applications are frequently multilingual (Spanish, Mandarin, etc.). There is no `close-label` property or slot to override this string.

**Expected improvement:** Add a `closeLabel` property (defaulting to `'Dismiss notification'`) so consuming applications can localize it.

---

### P2-07: `StackTopCenter` Storybook story overrides component's own positioning

**File:** `hx-toast.stories.ts:288`

```html
<hx-toast-stack
  placement="top-center"
  style="position: absolute; left: 0; right: 0; top: 0; transform: none;"
></hx-toast-stack>
```

The story applies inline `transform: none` which overrides the component's `transform: translateX(-50%)` that is responsible for horizontally centering `top-center` and `bottom-center` placements. This story demonstrates the component in a broken state — the `top-center` placement would not be centered in real usage within the story viewport.

The story is misleading to developers evaluating the component.

---

### ~~P2-08: CSS `:host(:not([placement]))` maps to `bottom-start`, conflicting with JS default `bottom-end`~~ FIXED

**File:** `hx-toast.styles.ts`

**Resolution:** The `:host(:not([placement]))` fallback CSS rule has been removed. The styles only contain explicit `:host([placement='...'])` selectors. Because `placement` has `reflect: true` on `HelixToastStack`, the attribute is always present after first render. The JS default `'bottom-end'` and the CSS placement rules are now consistent.

---

## Audit Coverage Summary

| Area                           | Status  | Findings                                   |
| ------------------------------ | ------- | ------------------------------------------ |
| TypeScript (strict, types)     | PASS    | P2-04, P2-08 fixed                         |
| Accessibility (ARIA/axe)       | PARTIAL | P1-01, P1-02                               |
| Tests (coverage/completeness)  | FAIL    | P1-03, P2-02, P2-03                        |
| Storybook (variants/demos)     | PARTIAL | P2-07                                      |
| CSS (tokens, animation, parts) | PASS    | P2-01, P2-04, P2-05, P2-08 all fixed       |
| Performance (bundle size)      | PASS    | ~14KB raw, well under 5KB gzipped estimate |
| Drupal integration             | PASS    | P1-04 FIXED                                |
