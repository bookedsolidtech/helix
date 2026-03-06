# AUDIT: hx-alert — Antagonistic Quality Review (T1-24)

**Reviewer:** Antagonistic audit agent
**Date:** 2026-03-05
**Scope:** `packages/hx-library/src/components/hx-alert/`
**Files reviewed:** `hx-alert.ts`, `hx-alert.styles.ts`, `hx-alert.test.ts`, `hx-alert.stories.ts`, `index.ts`

---

## Summary

| Severity | Count |
|----------|-------|
| P0       | 1     |
| P1       | 7     |
| P2       | 9     |
| P3       | 2     |

---

## P0 — Blocking Defects

### P0-01: Double event dispatch on keyboard activation

**File:** `hx-alert.ts:176-181`, `hx-alert.ts:213-216`

The `_handleCloseKeydown` handler is attached to a native `<button>` element. Native `<button>` elements already synthesize a `click` event when Enter or Space is pressed. This means keyboard activation triggers both the `keydown` handler (which calls `_handleDismiss()`) AND the `click` handler — two full invocations.

Result: `hx-close` and `hx-after-close` are dispatched **twice** on a single keyboard dismiss action. Consumers listening for `hx-close` to perform side effects (navigate, log, update state) will fire their handler twice.

The test suite at lines 208–245 uses `dispatchEvent(new KeyboardEvent('keydown', ...))` directly, which only fires the `keydown` handler and never the synthesized `click`, so the double-dispatch is invisible in tests. No test asserts the event fires exactly once.

**Fix direction:** Remove `_handleCloseKeydown` entirely. Native `<button>` + `@click` is sufficient for keyboard and pointer interaction. The keydown handler is not needed and actively harmful.

---

## P1 — High Severity

### P1-01: ARIA role is on a Shadow DOM internal element, not the host

**File:** `hx-alert.ts:192`

`role="alert"` and `role="status"` are applied to the inner `<div class="alert">` inside the Shadow DOM, not on the host `<hx-alert>` element. ARIA roles placed inside Shadow DOM boundaries have known reliability issues with some screen reader / browser combinations (particularly JAWS on Chrome before 2024, and VoiceOver on Safari). For a healthcare component where live region announcements may be critical to patient safety, this is unacceptable risk.

The host element exposes no ARIA role, so it appears as a generic `div` in the accessibility tree in some AT configurations.

**Fix direction:** Apply `role` to the host via `@property` and `reflect: true` on a host attribute, or use `internals.role` (ElementInternals) which is the Lit-idiomatic approach for shadow DOM components.

### P1-02: Live region announcement reliability for toggled visibility

**File:** `hx-alert.ts:64-66`, `hx-alert.styles.ts:8-10`

Visibility is controlled by `:host(:not([open])) { display: none }`. When an alert transitions from `open=false` to `open=true`, the host reappears in the accessibility tree. However, the `role="alert"` div and its content were already present in the Shadow DOM — only the host's display toggled.

Re-announcing existing content when an element transitions from `display:none` to `display:block` is AT-dependent behavior. NVDA+Firefox and JAWS+Chrome handle this differently. For dynamic alerts injected via `open=true` (the primary interactive use case for dismissible alerts), there is no guarantee the content will be announced.

The comment at line 85-86 acknowledges the JAWS double-announcement concern, but the chosen architecture creates a different class of reliability failure. No test verifies announcement fires on programmatic `open` toggle.

### P1-03: Missing `title` slot

**File:** `hx-alert.ts` (entire render method)

The feature description explicitly lists "title/description slots" as an audit area. The component has only a default slot for message content. No `title` slot exists. Industry-standard alert components (Shoelace `sl-alert`, Carbon `cds-actionable-notification`, Adobe Spectrum `sp-alert-banner`) all provide separate title/headline slots for structured alert content.

Without a `title` slot, consumers must compose their own title structure inside the default slot with no guaranteed styling or semantic structure. The CSS parts schema also exposes no `title` part.

### P1-04: Left border accent variant missing

**File:** `hx-alert.styles.ts` (entire file)

The feature description explicitly lists "left border variant" as an audit area. No left-border decorative accent is implemented. The component uses a uniform full-border (`border: ... solid`). A left-border-only variant (accent stripe) is a common healthcare/enterprise UI pattern that distinguishes alert types at a glance (especially in dashboards with dense information). Multiple peer libraries ship this as a variant modifier.

### P1-05: Touch target uses relative units that break at non-default font sizes

**File:** `hx-alert.styles.ts:72-73`

```css
min-width: 2.75rem; /* 44px */
min-height: 2.75rem; /* 44px */
```

`2.75rem` equals 44px only at the default browser font size of 16px. If the user or OS has set a larger base font size (common for accessibility users, especially in healthcare settings), `2.75rem` will compute to a value larger than 44px — which sounds fine but means the comment "44px" is misleading. More critically, if a consumer resets `font-size` on the document root (common in CMS integrations), `2.75rem` could compute to anything.

Should use `44px` directly or a component token `--hx-touch-target-size` that defaults to `44px` in absolute units. Mixed rem/absolute concerns apply to a healthcare component where accessibility compliance is a mandate.

### P1-06: Focus management is caller responsibility with no component mechanism

**File:** `hx-alert.ts:149-174`, `hx-alert.test.ts:250-278`

After dismiss, focus is left on the now-hidden close button. Browser AT behavior varies: some move focus to `body`, some leave it on the element. The focus management tests (lines 251-278) are misleading:

- Test at line 252: asserts only `document.activeElement !== closeBtn` — this passes if the browser naturally moves focus anywhere, even to `body`. It does not verify focus went somewhere meaningful.
- Test at line 262: manually calls `trigger.focus()` inside the test body. This doesn't test component behavior — it tests that JavaScript can focus a button. The comment "component signals via hx-after-close" acknowledges the component delegates this entirely to callers.

For a healthcare component, leaving focus management to callers with no built-in mechanism (no `returnFocusTo` property, no focus-trap utility, no default behavior) is a P1 gap. Every caller must independently implement the pattern.

### P1-07: Stale screenshot artifacts from incomplete rename (closable → dismissible)

**File:** `__screenshots__/hx-alert.test.ts/` (multiple files)

Screenshot filenames include `closable` in multiple test names:
- `hx-alert-Accessibility--axe-core--has-no-axe-violations-when-closable-1.png`
- `hx-alert-Property--closable-defaults-to-false-1.png`
- `hx-alert-Property--closable-renders-close-button-when-closable-1.png`
- `hx-alert-Property--closable-does-not-render-close-button-when-not-closable-1.png`

The current test file uses `dismissible` throughout. Screenshots are generated from test descriptions, so these stale screenshots indicate the property was renamed from `closable` to `dismissible` but the screenshot baselines were never regenerated. This means:

1. The screenshot baseline directory contains artifacts from a deleted API surface.
2. CI visual regression tests (if any) are comparing against the wrong baseline.
3. If screenshots are referenced in documentation, they show a property name that no longer exists.

---

## P2 — Medium Severity

### P2-01: `icon` property name collides with `icon` slot name

**File:** `hx-alert.ts:71-73`, JSDoc line 19

Both the boolean property (`icon: boolean`) and the named slot (`slot="icon"`) are called "icon". In CEM-generated documentation and Storybook autodocs, a property and a slot with the same name creates confusion. The property controls whether the icon container renders at all; the slot allows custom icon content. If `icon=false`, the slot is silently discarded — no component in the slot hierarchy can override the property's behavior. Consider renaming: `showIcon` for the property or `custom-icon` for the slot.

### P2-02: `WcAlert` type alias does not follow naming convention

**File:** `hx-alert.ts:232`

```ts
export type { HelixAlert as WcAlert };
```

`WcAlert` does not follow either established naming convention: not `hx-` prefixed (DOM convention), not `Helix`-prefixed (class naming convention). The test file imports it as `WcAlert`. This creates confusion between `HelixAlert` (the class), `hx-alert` (the tag), and `WcAlert` (the type alias). Should be `HxAlert` for consistency with other type exports in the library.

### P2-03: `color-mix()` is CSS Color Level 5 — browser support caveat undocumented

**File:** `hx-alert.styles.ts:91`

```css
background-color: color-mix(in srgb, currentColor 10%, transparent);
```

`color-mix()` has good support in modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+) but is not supported in any version of IE and some older enterprise browser deployments common in healthcare IT. No browser support note or fallback is documented. If the component's browser support matrix includes anything below these versions, this will silently fail (the hover background will be transparent).

### P2-04: Actions container always renders with margin-top even when empty

**File:** `hx-alert.ts:202-204`, `hx-alert.styles.ts:57-62`

```html
<div part="actions" class="alert__actions">
  <slot name="actions"></slot>
</div>
```

```css
.alert__actions {
  margin-top: var(--hx-space-2, 0.5rem);
}
```

The actions container always renders. When no content is slotted, the `margin-top: 0.5rem` creates invisible spacing below the message content. This adds unexpected vertical padding inside the alert that cannot be overridden without targeting the shadow DOM. Should use `display: contents` fallback or CSS `:slotchange` detection, or use `display: none` when empty (requires JS slot monitoring or CSS `:has()` on the slot).

### P2-05: Missing test for initial-render `icon=false` state

**File:** `hx-alert.test.ts:120-138`

The `icon` property tests only test setting `icon=false` programmatically after render (line 131). There is no test for `<hx-alert icon="false">` as an HTML attribute at initial render. The property defaults to `true` and uses `reflect: true`, so `<hx-alert icon="false">` would set the boolean attribute, but Boolean property/attribute mapping for `false` in HTML attributes (empty string presence/absence vs explicit "false") is a known footgun in Lit. No test validates initial HTML attribute state.

### P2-06: Redundant `_shadowQueryAll` import in tests

**File:** `hx-alert.test.ts:7`

```ts
import { fixture, shadowQuery, _shadowQueryAll, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
```

`_shadowQueryAll` (note the leading underscore indicating internal/private) is imported but never used in the test file. This is a dead import.

### P2-07: No `aria-live` tests beyond role assignment

**File:** `hx-alert.test.ts:344-368`

The accessibility tests verify `role` attribute assignment but do not verify `aria-live` region behavior. The component explicitly avoids setting `aria-live` to prevent JAWS double-announcement (justified in comments). However, there is no test that verifies the live region actually announces when content changes dynamically — no integration-level announcement test exists. In a healthcare context, an untested live region is an untested patient safety feature.

### P2-08: No Drupal Twig template or integration test

**File:** component directory

No `hx-alert.twig` template or Drupal behavior JS exists in the component directory. Per project architecture, the primary consumer is Drupal CMS. Static alert rendering via Twig (for server-side-rendered, SEO-visible alerts like form validation summaries) is undocumented and untested from the Drupal integration layer.

### P2-09: Missing bundle size verification in component documentation

No documented bundle size measurement exists for `hx-alert`. The component inlines 5 SVG path definitions and uses Lit decorators. Bundle size gate requires <5KB min+gz per component. Without a recorded measurement, there is no evidence this gate has been verified against the current implementation (post-SVG addition).

---

## P3 — Low Severity / Informational

### P3-01: WCAG criterion citation in CSS comment is inaccurate

**File:** `hx-alert.styles.ts:65`

```css
/* Minimum 44x44px touch target per WCAG 2.5.5 (healthcare mandate). */
```

WCAG 2.5.5 (Target Size) is a **Level AAA** criterion at 44x44px. The project targets **WCAG 2.1 AA**. The AA-relevant criterion for touch targets is WCAG 2.5.8 (Target Size Minimum) in WCAG 2.2, which specifies 24x24px at AA level. The 44x44px target is good practice (and aligns with Apple HIG / Google Material), but the citation of WCAG 2.5.5 as the mandate is technically incorrect. This could cause confusion during external accessibility audits.

### P3-02: Close icon SVG path produces non-standard X shape

**File:** `hx-alert.ts:140-145`

The close icon SVG path generates an X from four `l` commands through a center point. Visual inspection suggests the path computes correctly, but the path data does not follow the more readable multi-path or polyline approach used in most icon libraries. Minor maintainability concern — if the icon is ever modified, the single-path approach makes it harder to adjust individual arms of the X independently.

---

## Coverage Matrix

| Audit Area       | Status         | Key Gaps                                      |
|------------------|----------------|-----------------------------------------------|
| TypeScript       | Mostly clean   | `WcAlert` alias naming, stale rename artifacts|
| Accessibility    | Gaps present   | Role placement, live region reliability, focus |
| Tests            | Gaps present   | Double-dispatch, announcement, dead import     |
| Storybook        | Appears complete | Could not fully verify (file truncated)      |
| CSS              | Gaps present   | No left-border variant, `color-mix()` caveat  |
| Performance      | Unverified     | No bundle size measurement on record           |
| Drupal           | Untested       | No Twig template or Drupal behavior test       |

---

## Verdict

The component is structurally sound with correct token usage, well-typed properties, and good axe-core coverage. However, **P0-01 (double event dispatch) is a functional correctness bug that affects any consumer using keyboard to dismiss alerts**, and **P1-01/P1-02 (ARIA role reliability in Shadow DOM) are healthcare-mandate compliance risks**. Neither should ship without remediation.

The missing `title` slot (P1-03) and left-border variant (P1-04) represent gaps against peer library feature parity that the feature description explicitly flagged. These are implementation omissions, not bugs, but they reduce the component's viability for real-world healthcare dashboard usage patterns.
