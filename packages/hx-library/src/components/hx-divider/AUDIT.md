# Audit: `hx-divider` (T1-07) — Antagonistic Quality Review

**Status:** BLOCKED — Implementation not found
**Reviewed:** 2026-03-05
**Auditor:** Antagonistic Quality Review Agent
**Branch:** `feature/audit-hx-divider-t1-07-antagonistic`

---

## Executive Summary

**The `hx-divider` component does not exist in the codebase.** The implementation ticket (T1-07 IMPLEMENT) has not completed prior to this audit being picked up. All audit areas below are rated **P0** as there is nothing to review. This audit documents the full specification that MUST be met when implementation runs.

> **Dependency failure note:** This audit ticket was activated before its upstream IMPLEMENT dependency resolved — consistent with the known `loadPendingFeatures` platform bug. The implementation ticket must complete before findings in this document can be verified.

---

## Findings

### 1. Implementation (P0 — BLOCKER)

| Finding | Severity | Detail |
|---------|----------|--------|
| Component directory `hx-divider/` is empty | **P0** | No source files exist: `hx-divider.ts`, `hx-divider.styles.ts`, `hx-divider.stories.ts`, `hx-divider.test.ts`, `index.ts` are all absent |
| Not registered in component library exports | **P0** | `packages/hx-library/src/index.ts` (or equivalent barrel) has no export for `hx-divider` |
| Custom Elements Manifest has no entry | **P0** | `custom-elements.json` has no declaration for `hx-divider` |
| Not registered in Storybook | **P0** | No story file discoverable by Storybook |

---

### 2. TypeScript (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| No component class | **P0** | `hx-divider.ts` must export `HelixDivider extends LitElement` |
| `orientation` not typed | **P0** | Must be `'horizontal' \| 'vertical'`, not `string`. Default: `'horizontal'` |
| `decorative` flag not typed | **P0** | Must be `boolean` with `@property({ type: Boolean, reflect: true })` |
| No `label` property | **P0** | Semantic dividers with visible label need `label?: string` property |
| No global type augmentation | **P0** | `HTMLElementTagNameMap['hx-divider']` must be declared |
| No `WcDivider` type alias export | **P0** | Pattern: `export type WcDivider = HelixDivider` |

**Required component signature:**

```typescript
@customElement('hx-divider')
export class HelixDivider extends LitElement {
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @property({ type: Boolean, reflect: true })
  decorative = false;

  @property({ type: String, reflect: true })
  label?: string;
}
```

---

### 3. Accessibility (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| No `role="separator"` on semantic divider | **P0** | Must be set on the host or inner element |
| No `aria-orientation` | **P0** | Must reflect `orientation` property: `aria-orientation="horizontal"` or `"vertical"` |
| Decorative mode missing `role="presentation"` | **P0** | When `decorative=true`, MUST use `role="presentation"` and suppress `aria-orientation` |
| No axe-core test coverage | **P0** | Test suite must include axe-core pass for default, vertical, and decorative states |
| Label divider — no ARIA labelling strategy | **P0** | When `label` is provided, separator must be labelled via `aria-label` |

**WCAG 2.1 AA requirements specific to divider:**
- `role="separator"` is a landmark-adjacent role; screen readers announce it as "separator"
- `aria-orientation` is required for separators (not just for sliders)
- Decorative dividers (`role="presentation"`) MUST NOT have `aria-orientation` — this is an axe-core violation if present
- `focusable` separators (rare) need tab-stop and keyboard dismiss; this component likely should NOT be focusable

---

### 4. Tests (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| Test file absent | **P0** | `hx-divider.test.ts` does not exist |
| 0% test coverage | **P0** | Minimum 80% branch/line coverage required by quality gate |

**Required test scenarios:**

```
Rendering
  ✗ renders with shadow DOM
  ✗ renders horizontal divider by default
  ✗ renders vertical divider when orientation="vertical"
  ✗ exposes `line` CSS part
  ✗ exposes `label` CSS part when label is present

Property: orientation
  ✗ defaults to "horizontal"
  ✗ reflects "horizontal" to attribute
  ✗ reflects "vertical" to attribute
  ✗ updates DOM when orientation changes

Property: decorative
  ✗ defaults to false
  ✗ reflects to attribute

Property: label
  ✗ renders label text when provided
  ✗ does not render label element when absent

Accessibility — semantic (decorative=false)
  ✗ has role="separator"
  ✗ has aria-orientation="horizontal" by default
  ✗ has aria-orientation="vertical" when orientation is vertical
  ✗ axe-core: no violations in default state
  ✗ axe-core: no violations when orientation="vertical"
  ✗ axe-core: no violations with label

Accessibility — decorative (decorative=true)
  ✗ has role="presentation"
  ✗ does NOT have aria-orientation attribute
  ✗ axe-core: no violations when decorative

CSS Parts
  ✗ exposes `line` part
  ✗ exposes `label` part (when label present)
```

---

### 5. Storybook (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| Story file absent | **P0** | `hx-divider.stories.ts` does not exist |

**Required stories:**

```typescript
// Minimum story set:
export const Default            // orientation="horizontal"
export const Vertical           // orientation="vertical"
export const Decorative         // decorative=true
export const WithLabel          // label="Section Title"
export const VerticalDecorative // orientation="vertical" + decorative=true
```

All stories must have:
- `autodocs` enabled via `tags: ['autodocs']`
- Controls wired for `orientation`, `decorative`, `label`
- No hardcoded values in args (use token-aware defaults)

---

### 6. CSS / Design Tokens (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| Style file absent | **P0** | `hx-divider.styles.ts` does not exist |
| No token usage | **P0** | All values must use `--hx-*` tokens with fallbacks |

**Required CSS parts:**

```css
/* ::part(line) — the visual dividing line */
/* ::part(label) — the optional text label */
```

**Required token-based properties (no hardcoded values allowed):**

```css
:host {
  --hx-divider-color: var(--hx-color-neutral-200, #e5e7eb);
  --hx-divider-thickness: var(--hx-border-width-1, 1px);
  --hx-divider-spacing: var(--hx-space-4, 1rem);
  --hx-divider-label-color: var(--hx-color-neutral-500, #6b7280);
  --hx-divider-label-font-size: var(--hx-font-size-sm, 0.875rem);
  --hx-divider-label-gap: var(--hx-space-3, 0.75rem);
}
```

**Anti-patterns to check when implementation arrives:**
- `border: 1px solid #ccc` → HARDCODED, fail P0
- `margin: 16px 0` → HARDCODED, fail P0
- `color: gray` → HARDCODED, fail P0
- Missing `@media (prefers-reduced-motion)` if any transitions exist

---

### 7. Performance (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| Bundle size unknown (component absent) | **P0** | Must be < 5KB min+gz when implemented |

**Expected:** `hx-divider` should be among the smallest components in the library — pure presentational, no JS state beyond property reflection. Target < 1KB min+gz. Any implementation exceeding 2KB warrants investigation.

---

### 8. Drupal Compatibility (P0)

| Finding | Severity | Requirement |
|---------|----------|-------------|
| No Twig template | **P0** | Component does not exist to be rendered in Twig |

**Expected Twig usage patterns (must work without modification):**

```twig
{# Semantic horizontal divider #}
<hx-divider></hx-divider>

{# Vertical divider #}
<hx-divider orientation="vertical"></hx-divider>

{# Decorative (no screen reader announcement) #}
<hx-divider decorative></hx-divider>

{# Section divider with label #}
<hx-divider label="Patient History"></hx-divider>
```

**Drupal-specific considerations:**
- Boolean attributes (`decorative`) must work as presence-only attributes (standard HTML — no Twig special handling needed)
- No JS Drupal behaviors required for a pure presentational component
- CDN script tag delivery must register `hx-divider` custom element before first paint

---

## Severity Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **P0** | 25+ | Implementation entirely absent — all areas blocked |
| **P1** | 0 | Cannot assess until P0 resolved |
| **P2** | 0 | Cannot assess until P0 resolved |

---

## Resolution Path

1. **Upstream dependency:** Run IMPLEMENT ticket for `hx-divider` (T1-07)
2. **Re-run this audit** against the completed implementation
3. All P0 findings above become the acceptance criteria for the implementation

**The implementation ticket must produce:**

```
packages/hx-library/src/components/hx-divider/
├── index.ts              ← re-exports HelixDivider + WcDivider type
├── hx-divider.ts         ← LitElement class, orientation + decorative + label props
├── hx-divider.styles.ts  ← Lit css`` with --hx-* tokens, ::part(line), ::part(label)
├── hx-divider.stories.ts ← Default, Vertical, Decorative, WithLabel stories
└── hx-divider.test.ts    ← All scenarios listed in §4 above, ≥80% coverage
```

---

*This document was generated by the antagonistic quality review process. When implementation is present, re-run with full code inspection.*
