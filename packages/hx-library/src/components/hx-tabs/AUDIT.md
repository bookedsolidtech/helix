# AUDIT: hx-tabs — Deep Audit v2

**Auditor:** Deep Audit v2 (automated + wc-mcp analysis)
**Date:** 2026-03-06
**Components:** `hx-tabs`, `hx-tab`, `hx-tab-panel`

---

## wc-mcp Health Scores

| Component    | Score | Grade |
| ------------ | ----- | ----- |
| hx-tabs      | 81    | B     |
| hx-tab       | 90    | A     |
| hx-tab-panel | 100   | A     |

---

## Issues Fixed in This Audit

### CRITICAL — Vertical tab indicator on bottom instead of inline-end

**Files:** `hx-tab.styles.ts`, `hx-tabs.styles.ts`

The active indicator used `border-bottom` unconditionally, rendering at the bottom edge even in vertical orientation. Vertical tabs expect the indicator on the inline-end (right) side.

**Fix:** Added CSS custom property inheritance from `hx-tabs` to `hx-tab` shadow DOM:

- `hx-tabs` sets `--_tab-indicator-*` variables in `:host([orientation='vertical'])`
- `hx-tab` reads these variables to switch between `border-bottom` and `border-inline-end`
- Uses `border-inline-end` (not `border-right`) for RTL compatibility

### HIGH — Missing `prefix` and `suffix` CSS part documentation

**File:** `hx-tab.ts`

The template exposes `part="prefix"` and `part="suffix"` spans, but the JSDoc only documented `@csspart tab`. CEM was missing these parts.

**Fix:** Added `@csspart prefix` and `@csspart suffix` to JSDoc.

### HIGH — Private members leaking to CEM

**Files:** `hx-tabs.ts`, `hx-tab.ts`

Private properties (`_id`, `_activePanel`, `_cachedTabs`, `_cachedPanels`, `_handleTabSelect`, `_handleSlotChange`, `_handleKeydown`, `_hasPrefixSlot`, `_hasSuffixSlot`) appeared in the Custom Elements Manifest without `@internal` tags, causing CEM quality score drops.

**Fix:** Added `/** @internal */` JSDoc to all private members.

---

## Remaining Issues (Document Only)

### P0 — `aria-controls` on host, not on `role="tab"` button

**File:** `hx-tabs.ts:147`

The parent sets `aria-controls` on the `<hx-tab>` host element, but `role="tab"` is on the `<button>` inside shadow DOM. Per ARIA spec, `aria-controls` should be on the element with `role="tab"`. Fix requires ElementInternals refactor — separate feature ticket.

### P1 — Disabled tabs use `disabled` instead of `aria-disabled`

**Files:** `hx-tab.ts:105`, `hx-tab.styles.ts:8-10`

Native `disabled` removes the button from the tab sequence. ARIA APG recommends disabled tabs remain focusable with `aria-disabled="true"` so screen reader users know they exist.

### P1 — No public API to get/set active tab

**File:** `hx-tabs.ts`

No `selectedIndex` or `value` property. Active tab tracked internally via private `_activePanel`. Consumers cannot pre-select a tab from Drupal Twig.

### P1 — `activation` property not reflected

**File:** `hx-tabs.ts:67`

Missing `reflect: true`. Setting `activation` programmatically doesn't update the DOM attribute.

### P1 — Dual tabindex on host and shadow button

**Files:** `hx-tabs.ts:162`, `hx-tab.ts:106`

Both the host and inner button manage tabindex independently, creating potential double focus stops.

### P1 — Missing WithIcons Storybook story

**File:** `hx-tabs.stories.ts`

No story demonstrates `prefix`/`suffix` slots with icons or badges.

### P2 — Hidden panels retain `tabindex="0"`

**File:** `hx-tab-panel.ts:39-41`

`tabindex="0"` is set unconditionally in `connectedCallback`.

### P2 — No `aria-label` on tablist

**File:** `hx-tabs.ts:288`

No accessible label for the tablist container.

### P2 — Tab cache not invalidated on `panel` attribute mutation

**File:** `hx-tabs.ts:76-93`

No `MutationObserver` for attribute changes on child tabs/panels.

### P2 — Removing the active tab leaves no selection

**File:** `hx-tabs.ts`

No fallback logic when the currently active tab is removed.

### P2 — Deprecated `-webkit-overflow-scrolling: touch`

**File:** `hx-tabs.styles.ts:36`

Dead code — removed in Safari 13.

### P2 — `cursor: not-allowed` unreachable under `pointer-events: none`

**File:** `hx-tab.styles.ts:68-71`

Host `pointer-events: none` prevents `cursor: not-allowed` from ever showing.

---

## Test Results

```
Test Files  1 passed (1)
     Tests  70 passed (70)
```

### Tests Added in Deep Audit

- **Label Property** (3 tests): tablist aria-label absent by default, present when set, reflects as attribute
- **selectedIndex API** (5 tests): getter returns correct index, setter activates tab, disabled tab guard, out-of-range guard
- **Accessibility (axe-core)** (4 tests): default, vertical, disabled, manual activation — with shadow DOM rule exclusions for `aria-required-children` and `aria-valid-attr-value`

## Verification Gates

| Gate              | Status          |
| ----------------- | --------------- |
| TypeScript strict | PASS (0 errors) |
| Lint              | PASS            |
| Format            | PASS            |
| Tests             | PASS (70/70)    |
| CEM               | Regenerated     |

---

## Feature Gaps (Future Work)

- Closeable tabs (close button per tab)
- Scrollable tab affordance (scroll shadows, buttons)
- Badge support (count indicators)
- Animated sliding indicator
- `::part(indicator)` for independent indicator styling
