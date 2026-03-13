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

### ~~P1 — No public API to get/set active tab~~ FIXED

**File:** `hx-tabs.ts`

**Resolution:** `selectedIndex` getter/setter added to `HelixTabs`. The getter returns the zero-based index of the currently active tab. The setter activates the tab at the given index (disabled-tab guard and out-of-range guard included). 5 tests cover the API.

#### Drupal Twig Integration — `hx-tabs` with `selected-index`

```twig
{# Load component library via CDN #}
{# <script type="module" src="https://cdn.example.com/@helixui/library/dist/hx-tabs.js"></script> #}

{# Pre-select a tab from Drupal server-side context.
   selected-index is a 0-based integer attribute. The default (0) selects the first tab.
   Pass a Drupal variable (e.g., from a route parameter or user preference) to pre-open a tab. #}
<hx-tabs
  selected-index="{{ active_tab_index|default(0) }}"
  orientation="{{ orientation|default('horizontal') }}"
  label="{{ tablist_label|default('Record sections') }}"
>
  <hx-tab slot="tab" panel="demographics">Demographics</hx-tab>
  <hx-tab slot="tab" panel="vitals">Vitals</hx-tab>
  <hx-tab slot="tab" panel="medications">Medications</hx-tab>

  <hx-tab-panel name="demographics">
    {{ content.demographics }}
  </hx-tab-panel>
  <hx-tab-panel name="vitals">
    {{ content.vitals }}
  </hx-tab-panel>
  <hx-tab-panel name="medications">
    {{ content.medications }}
  </hx-tab-panel>
</hx-tabs>
```

**Drupal Behaviors integration (for programmatic control):**

```javascript
(function (Drupal, once) {
  Drupal.behaviors.hxTabsSelection = {
    attach(context) {
      once('hx-tabs-init', 'hx-tabs', context).forEach((tabs) => {
        // Respond to tab changes and persist selection
        tabs.addEventListener('hx-tab-change', (e) => {
          const { index } = e.detail;
          sessionStorage.setItem('activeTabIndex', String(index));
        });

        // Restore persisted selection on page load
        const saved = sessionStorage.getItem('activeTabIndex');
        if (saved !== null) {
          tabs.selectedIndex = parseInt(saved, 10);
        }
      });
    },
  };
})(Drupal, once);
```

**Key Drupal integration notes:**
- `selected-index` is a reflected attribute — set it in Twig as an integer string (e.g., `"1"` to open the second tab on load).
- The `hx-tab-change` CustomEvent fires with `detail: { tabId: string, index: number }` — use in Drupal Behaviors for analytics or AJAX panel loading.
- Disabled tabs are skipped by the setter; setting `selected-index` to a disabled tab's index is a no-op.

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
