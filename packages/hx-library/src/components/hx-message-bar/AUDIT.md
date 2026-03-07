# Audit: `hx-message-bar` (T3-02)

**Auditor:** Antagonistic Quality Review Agent
**Date:** 2026-03-06
**Branch:** `feature/audit-hx-message-bar-t3-02-antagonistic`
**Files reviewed:**
- `hx-message-bar.ts` (197 lines)
- `hx-message-bar.styles.ts` (155 lines)
- `hx-message-bar.test.ts` (295 lines)
- `hx-message-bar.stories.ts` (162 lines)
- `index.ts` (1 line)

**Test results:** 39/39 pass
**Coverage:** 90.32% statements | 73.33% branches | 91.66% functions | 87.5% lines
**Bundle (gzip):** ~2.7 KB (well within 5 KB gate)
**TypeScript:** 0 errors (strict mode)

---

## Summary Table

| Area        | Status  | Highest Severity |
|-------------|---------|-----------------|
| TypeScript  | PASS    | P2              |
| Accessibility | WARN  | P1              |
| Tests       | FAIL    | P1              |
| Storybook   | PASS    | P2              |
| CSS / Tokens | PASS   | P2              |
| Performance | PASS    | —               |
| Drupal      | PASS    | P2              |

---

## Findings

### TypeScript

**P2 — `MessageBarVariant` type not exported**
File: `hx-message-bar.ts:8`
The `MessageBarVariant` union type is declared locally and not exported. Consumers who want to type-check their variant prop values or build adapter layers have no way to reference the type without re-declaring it. Every other named union type in the library (e.g., `AlertVariant`, `BadgeVariant`) follows the pattern of exporting the type from the component file.

```ts
// Current — not exported:
type MessageBarVariant = 'info' | 'success' | 'warning' | 'error';

// Required:
export type MessageBarVariant = 'info' | 'success' | 'warning' | 'error';
```

**P2 — Export alias uses stale `Wc` prefix**
File: `hx-message-bar.ts:205`
```ts
export type { HelixMessageBar as WcMessageBar };
```
The alias `WcMessageBar` uses the old `Wc` prefix (inherited from `wc-2026`). The project convention reflected in CLAUDE.md and peer components is `Helix*`. This should be `export type { HelixMessageBar }` with any backwards-compatible alias added only if there is a documented consumer dependency.

---

### Accessibility

**P1 — ARIA live region role placed in shadow DOM — host element carries no ARIA semantics**
File: `hx-message-bar.ts:168`
```html
<div part="base" class=${classMap(classes)} role=${this._role}>
```
The `role="alert"` / `role="status"` is applied to an internal shadow DOM `<div>`. Screen readers that do not pierce shadow roots (particularly JAWS on older Windows builds, which are common in healthcare environments) will announce the host element as a generic container. The live region role and/or `aria-live` attribute must also be present on `:host` itself to guarantee reliable announcement.

Fix requires adding `role` and `aria-live` to the `:host` element:
```ts
// In render():
// Set role on host via this.setAttribute / reflected property, or use:
override connectedCallback() {
  super.connectedCallback();
  this._updateHostRole();
}
```

**P1 — `aria-atomic` missing on live regions**
File: `hx-message-bar.ts:168`
`role="alert"` carries implicit `aria-atomic="true"`, but `role="status"` does NOT. Without `aria-atomic="true"` on the info/success variant, partial updates to message content (e.g., a counter or dynamic text node) may be read piecemeal rather than as a coherent message. In a healthcare context where success messages may contain patient-relevant data, partial reads are a patient-safety concern.

**P2 — Close button `aria-label="Close"` is not contextually descriptive**
File: `hx-message-bar.ts:187`
The label "Close" does not identify what is being closed. WCAG 2.4.6 (Headings and Labels, AA) requires labels to be descriptive. When multiple message bars are visible, screen reader users cannot distinguish which "Close" button corresponds to which message. A label like "Close notification" or a slot-driven label property (e.g., `close-label`) would resolve this.

**P2 — `_handleCloseKeydown` is redundant and misleading**
File: `hx-message-bar.ts:151-156`
A native `<button>` element already natively activates on Enter and Space without any manual keydown handler. Attaching a duplicate handler creates confusion and adds untested code paths (see test coverage finding below). If this is intentional (e.g., to support a future non-button close trigger), it should be documented. If not, it should be removed.

---

### Tests

**P1 — Branch coverage 73.33% — below mandatory 80% gate**
File: `hx-message-bar.test.ts`
Coverage report: `hx-message-bar.ts | 90.32 | 73.33 | 91.66 | 87.5 | uncovered: 152-154`
Lines 152-154 are the body of `_handleCloseKeydown`. No test exercises the close button via keyboard events. This is a blocking gate failure per CLAUDE.md: "100% pass, 80%+ coverage."

Missing test cases needed to close the gap:
- Keydown `Enter` on close button dispatches `hx-close` event
- Keydown `Space` on close button dispatches `hx-close` event
- Keydown of other key on close button does NOT dispatch `hx-close`

**P2 — `open="false"` fixture creates misleading test**
File: `hx-message-bar.test.ts:94`
```ts
const el = await fixture<WcMessageBar>('<hx-message-bar open="false">Test</hx-message-bar>');
el.open = false;
```
The HTML attribute `open="false"` is parsed as a boolean attribute — presence of any value sets the Lit boolean property to `true`. The fixture therefore starts in an open state and the test immediately sets it closed programmatically. The first line of the fixture is dead setup that misrepresents the starting state and could mislead future test authors. The fixture should simply be `<hx-message-bar>Test</hx-message-bar>`.

**P2 — No test verifying `sticky` CSS position behavior**
File: `hx-message-bar.test.ts:114`
The existing sticky test only asserts the class is present. No test verifies that `position: sticky` and `top: 0` are actually applied as computed styles. Given the sticky behavior depends on z-index management (`--hx-z-index-sticky`), a computed style assertion would provide stronger coverage.

**P2 — No test for `hx-dismiss` event (spec named it `hx-dismiss`; impl uses `hx-close`)**
The feature description specifically audits for "hx-dismiss event." The implementation fires `hx-close`. The test suite correctly tests `hx-close`. However, the discrepancy between the spec (`hx-dismiss`) and implementation (`hx-close`) means the design spec name was not honored. Documenting this as an intentional deviation (or aligning to spec) is required before GA.

---

### Storybook

**P2 — No `Sticky` story**
File: `hx-message-bar.stories.ts`
The `sticky` property is in `argTypes` and `args` but there is no dedicated `Sticky` story that demonstrates the behavior in context (inside a scrollable container). Without a visible demo, the behavior cannot be visually verified in Storybook or screenshot-tested.

**P2 — `WithAction` story uses `<a>` only; no button-in-action story**
File: `hx-message-bar.stories.ts:124-131`
The action slot is designed for a "CTA button or link." The only demo uses an anchor. A story demonstrating an `<hx-button>` or `<button>` in the action slot would improve coverage and catch styling regressions for both use cases.

**P2 — No `ClosedState` story**
The `open=false` state is available as an arg control but has no dedicated story. Reviewers cannot visually verify the hidden state in isolation, and screenshot regression cannot catch "message bar should be invisible" regressions.

---

### CSS / Design Tokens

**P2 — Hardcoded hex color fallbacks throughout styles**
File: `hx-message-bar.styles.ts:25-27, 48, 123-154`
Every `var(--hx-*)` declaration includes a hex fallback value, e.g.:
```css
background-color: var(--hx-message-bar-bg, var(--hx-color-info-50, #e8f4fd));
```
CLAUDE.md states: "Never hardcode colors, spacing, or typography values. Always use tokens." The second-level fallbacks (`#e8f4fd`, `#1a3a4a`, `#b3d9ef`, etc.) are hardcoded hex values. These values will not update if the design token system changes and create a maintenance burden. The fallbacks should either be removed (trusting the consumer to provide tokens) or point to a lower-level primitive token.

**P2 — Focus ring color has hardcoded fallback**
File: `hx-message-bar.styles.ts:108`
```css
outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, #2563eb);
```
`#2563eb` is a hardcoded color. This violates the zero-hardcoded-values rule.

**P2 — CSS part naming diverges from audit spec**
The feature description specifies parts: `bar, icon, message, actions, close`. The implementation uses: `base, icon, message, action, close-button`. Three of five part names differ from spec. While the chosen names (`base`, `action`, `close-button`) are arguably clearer and consistent with library conventions (e.g., `hx-alert` uses `part="base"`), the deviation was not documented and creates a mismatch with design handoff artifacts.

**P2 — `color-mix()` in close button hover state**
File: `hx-message-bar.styles.ts:104`
```css
background-color: color-mix(in srgb, currentColor 10%, transparent);
```
`color-mix()` is a CSS Level 5 feature with limited support in enterprise IE-adjacent environments. While Baseline 2023 marks it as widely available, some healthcare organizations mandate compatibility with older Chromium builds or WebKit used in embedded patient portal apps. Consider whether the project's browser support matrix explicitly includes this feature, or replace with a `rgba()`-based token.

---

### Performance

**PASS — Bundle well within budget**
Bundle: 8,940 bytes raw, ~2,666 bytes gzip. Comfortably under the 5 KB per-component gate.

---

### Drupal

**P2 — No Twig usage example documented**
The component has no accompanying Twig template example, no comment referencing Drupal behavior integration, and no documentation of how `open`, `closable`, and `variant` map to Drupal field values or template variables. For a healthcare enterprise primary consumer (Drupal), this gap means every Drupal team must independently discover the integration pattern. A minimal Twig snippet in a README or Storybook docs page would close this gap.

**PASS — Component is Twig-renderable**
No JS-only initialization is required. The component registers itself via `@customElement` and is activated by the CDN bundle. All properties are HTML attribute-based and `reflect: true`. A Drupal Twig template can render the component with no additional JS:
```twig
<hx-message-bar variant="{{ variant }}" {% if closable %}closable{% endif %}>
  {{ message }}
  {% if action_label %}<a slot="action" href="{{ action_url }}">{{ action_label }}</a>{% endif %}
</hx-message-bar>
```

---

## P0 Issues

None.

---

## P1 Issues (Blocking)

| ID | Area | File | Description |
|----|------|------|-------------|
| A1 | Accessibility | `hx-message-bar.ts:168` | `role="alert"/"status"` is in shadow DOM only — host element carries no ARIA semantics; unreliable for JAWS/older screen readers |
| A2 | Accessibility | `hx-message-bar.ts:168` | `aria-atomic` not set on `role="status"` — partial content updates may be read piecemeal |
| T1 | Tests | `hx-message-bar.test.ts` | Branch coverage 73.33% — below mandatory 80% gate; `_handleCloseKeydown` (lines 152-154) never tested |

---

## P2 Issues (Non-Blocking, Must Resolve Before GA)

| ID | Area | File | Description |
|----|------|------|-------------|
| TS1 | TypeScript | `hx-message-bar.ts:8` | `MessageBarVariant` not exported |
| TS2 | TypeScript | `hx-message-bar.ts:205` | Export alias uses stale `Wc` prefix |
| A3 | Accessibility | `hx-message-bar.ts:187` | `aria-label="Close"` not contextually descriptive |
| A4 | Accessibility | `hx-message-bar.ts:151` | `_handleCloseKeydown` redundant on native `<button>` |
| T2 | Tests | `hx-message-bar.test.ts:94` | `open="false"` fixture start state is misleading |
| T3 | Tests | `hx-message-bar.test.ts` | No computed style test for `sticky` behavior |
| T4 | Tests | `hx-message-bar.test.ts` | Spec named event `hx-dismiss`; impl uses `hx-close` — deviation undocumented |
| S1 | Storybook | `hx-message-bar.stories.ts` | No `Sticky` story |
| S2 | Storybook | `hx-message-bar.stories.ts` | `WithAction` only demos `<a>`, no button |
| S3 | Storybook | `hx-message-bar.stories.ts` | No `ClosedState` story |
| C1 | CSS | `hx-message-bar.styles.ts:25-154` | Hardcoded hex fallbacks throughout — violates zero-hardcoded-values rule |
| C2 | CSS | `hx-message-bar.styles.ts:108` | Focus ring color `#2563eb` hardcoded |
| C3 | CSS | multiple | CSS part names diverge from design spec (`base` vs `bar`, `action` vs `actions`, `close-button` vs `close`) |
| C4 | CSS | `hx-message-bar.styles.ts:104` | `color-mix()` may not be supported in all target environments |
| D1 | Drupal | — | No Twig usage example documented |
