# AUDIT: hx-tabs — T1-16 Antagonistic Quality Review

**Auditor:** Automated antagonistic review
**Date:** 2026-03-05
**Files reviewed:**
- `hx-tabs.ts`
- `hx-tab.ts`
- `hx-tab-panel.ts`
- `hx-tabs.styles.ts`
- `hx-tab.styles.ts`
- `hx-tab-panel.styles.ts`
- `hx-tabs.test.ts`
- `hx-tabs.stories.ts`
- `index.ts`

---

## Executive Summary

`hx-tabs` is architecturally sound and impressively comprehensive. The keyboard navigation logic, dynamic tab add/remove, and test suite are enterprise-grade. However, three structural issues require immediate attention before this component can be considered production-ready for a healthcare design system:

1. `aria-controls` is placed on the wrong element, breaking the tab-panel ARIA association across shadow boundaries.
2. Disabled tabs use `disabled` (which removes them from tab order) instead of `aria-disabled` (which keeps them announced by screen readers).
3. The active tab indicator (`border-bottom`) is orientation-agnostic — vertical tabs render the indicator at the wrong edge.

---

## Findings

### P0 — Critical / Blockers

---

#### P0-1: `aria-controls` set on `<hx-tab>` host, NOT on `<button role="tab">`

**File:** `hx-tabs.ts:147`
**Area:** Accessibility — ARIA

The parent `_syncTabsAndPanels()` sets `aria-controls` on the `<hx-tab>` custom element host:

```ts
tab.setAttribute('aria-controls', panelId);
```

However, the element that carries `role="tab"` is the `<button>` rendered inside `<hx-tab>`'s Shadow DOM (`hx-tab.ts:103`). Per the ARIA specification, `aria-controls` must be on the element that has `role="tab"`. Assistive technologies resolve `aria-controls` relative to the element that declares it; placing it on a host element with no ARIA role means no AT will wire the association.

**Impact:** Screen readers cannot navigate from a tab to its controlled panel. The tab-panel relationship is invisible to AT. This is a WCAG 2.1 SC 4.1.2 violation (Name, Role, Value).

---

### P1 — High Priority

---

#### P1-1: Disabled tabs use `disabled` attribute — removes them from tab sequence

**Files:** `hx-tab.ts:105`, `hx-tab.styles.ts:8-10`
**Area:** Accessibility

The inner `<button>` receives `?disabled=${this.disabled}`, and the host receives `:host([disabled]) { pointer-events: none }`. Native `disabled` removes the button from the accessibility tree's focusable sequence. The ARIA APG Tabs Pattern specifies that disabled tabs should remain focusable (announce as disabled via `aria-disabled="true"`) so keyboard users know the tab exists but cannot be activated. The current implementation silently skips disabled tabs, giving no AT feedback about their existence.

**Impact:** Screen reader users have no indication that a disabled tab exists. Keyboard users cannot learn the tab is disabled.

---

#### P1-2: Active indicator `border-bottom` is horizontal-only — vertical tabs broken visually

**File:** `hx-tab.styles.ts:24, 53`
**Area:** CSS

The active indicator is implemented as:

```css
.tab {
  border-bottom: var(--hx-tabs-indicator-size, 2px) solid transparent;
}
.tab[aria-selected='true'] {
  border-bottom-color: var(--hx-tabs-indicator-color, ...);
}
```

There is no vertical-orientation variant. When `orientation="vertical"`, the tablist stacks tabs vertically but the indicator still renders at the bottom of each tab button — visually incorrect. A vertical tab list expects a left- or right-side indicator border.

**Impact:** Vertical orientation ships with a broken active tab indicator.

---

#### P1-3: No `::part(indicator)` CSS part

**Files:** `hx-tab.ts`, `hx-tab.styles.ts`
**Area:** CSS / API

The audit specification requires CSS parts `tab`, `panel`, and `indicator`. The indicator is a border on the `.tab` button, not a separate element. There is no way for consumers to target `::part(indicator)` independently from the tab button. This also precludes animated sliding indicator implementations.

**Impact:** Consumers cannot independently customize the active indicator without overriding the entire tab part. Violates the design system extensibility contract.

---

#### P1-4: No public programmatic API to get or set the active tab

**File:** `hx-tabs.ts`
**Area:** TypeScript / API

There is no `selectedIndex: number` or `value: string` property exposed as part of the public API. The active tab is tracked internally via `@state() private _activePanel`. Consumers cannot:
- Read the current active tab index or panel name
- Pre-select a tab from server-rendered HTML (Drupal Twig)
- Set the active tab programmatically after initialization

**Impact:** Cannot drive tab state from outside the component. Drupal integration cannot pre-select a tab. Healthcare workflows that deep-link to a specific tab panel have no supported API.

---

#### P1-5: `activation` property not reflected as attribute

**File:** `hx-tabs.ts:67`
**Area:** TypeScript / Drupal

```ts
@property({ type: String, attribute: 'activation' })
activation: 'manual' | 'automatic' = 'automatic';
```

The `reflect: true` option is absent. Setting `activation` programmatically does not update the DOM attribute. For Drupal Twig templates that set HTML attributes (e.g., `activation="manual"`), this works because Lit reads the attribute on upgrade. But Storybook "Show code" will display incorrect HTML, and imperative consumers who set the property will see no attribute reflection, breaking attribute-based CSS selectors or SSR snapshots.

**Impact:** Minor for basic Drupal use, but a consistency violation. Storybook generated code will not match actual behavior.

---

#### P1-6: Dual tabindex management on host and shadow button creates focus inconsistency

**Files:** `hx-tabs.ts:162`, `hx-tab.ts:106`
**Area:** Accessibility / Keyboard Navigation

The parent sets `tab.tabIndex = isSelected ? 0 : -1` on the `<hx-tab>` host element. The `<hx-tab>` component independently sets `tabindex` on its inner `<button>` via `tabindex=${this.selected ? '0' : '-1'}`. This creates two separate tabindex controllers:

- Native Tab key focuses `<hx-tab>` host (if `tabIndex=0`)
- Arrow key navigation explicitly focuses `targetTab.shadowRoot?.querySelector('button')?.focus()` — the inner button

These produce different focus targets. When Tab-navigating into the tablist, focus lands on the custom element host, not the button with `role="tab"`. Pressing Tab again then focuses into the shadow DOM button, creating a double focus stop.

**Impact:** Keyboard navigation inconsistency. Tab sequence behavior differs from Arrow key behavior. May fail automated accessibility audits.

---

#### P1-7: Storybook missing `WithIcons` story — prefix/suffix slots not demonstrated

**File:** `hx-tabs.stories.ts`
**Area:** Storybook

All seven stories render plain text tab labels. The `<hx-tab>` component exposes `prefix` and `suffix` named slots for icons and badges, but no story demonstrates this capability. The audit specification explicitly calls out `with badges/icons` as a required story variant.

**Impact:** `prefix`/`suffix` slots are untested at the story level. Healthcare consumers need to see icon/badge examples (e.g., a count badge on a "Messages" tab) to understand how to use the feature.

---

### P2 — Medium Priority

---

#### P2-1: Hidden panels retain `tabindex="0"` set in `connectedCallback`

**File:** `hx-tab-panel.ts:39-41`
**Area:** Accessibility

`tabindex="0"` is set unconditionally in `connectedCallback` and never updated when the panel is hidden. While `:host([hidden]) { display: none }` prevents actual focus on hidden panels, the attribute persists and may confuse AT in non-visual browsing modes. The `tabindex` should be managed alongside the `hidden` attribute.

---

#### P2-2: No `aria-label` on the tablist element

**File:** `hx-tabs.ts:288`
**Area:** Accessibility

The `<div role="tablist">` has no accessible label. The APG recommends labeling the tablist (e.g., `aria-label="Patient Overview"` or `aria-labelledby` referencing a heading) so screen reader users know what the tablist controls. No slot or property is provided for this. For healthcare UIs where multiple tab widgets may appear on a single page, unlabeled tablists are ambiguous.

---

#### P2-3: Tab cache not invalidated on `panel` attribute mutation

**File:** `hx-tabs.ts:76-93`
**Area:** TypeScript / Correctness

`_cachedTabs` and `_cachedPanels` are only invalidated in `_handleSlotChange`. If the `panel` attribute on an existing `<hx-tab>` is changed imperatively after initial render, the cache remains stale — `_syncTabsAndPanels` will use the old panel association. No `MutationObserver` watches for attribute changes on children.

---

#### P2-4: Removing the active tab leaves the component in a broken state

**File:** `hx-tabs.ts`, `hx-tabs.test.ts:683-692`
**Area:** Tests / Correctness

The dynamic remove test removes the *last* tab (non-active). If the *active* tab is removed, `_activePanel` still holds its panel name, no other tab is selected, and no fallback logic re-activates another tab. The component will show no content. No test covers this edge case, and there is no recovery logic.

---

#### P2-5: No test for Home/End keys in manual activation mode

**File:** `hx-tabs.test.ts`
**Area:** Tests

Manual activation tests cover `ArrowRight` (no activation), `Space`, and `Enter`. Home and End in manual mode are not tested — it is unclear whether they should focus-only or activate the target tab.

---

#### P2-6: Keyboard test focus simulation may not reliably set `document.activeElement`

**File:** `hx-tabs.test.ts` (multiple keyboard tests)
**Area:** Tests / Reliability

Tests simulate keyboard focus via `btn.focus()` then check `document.activeElement` in the keydown handler. In the Vitest browser environment (Playwright/Chromium), programmatic `.focus()` should work, but the test dispatches keydown on the `hx-tabs` element while focus is on a shadow DOM `<button>`. The handler uses `enabledTabs.find((tab) => tab === document.activeElement)`. Since focus is on the inner button (not the host), and `document.activeElement` returns the shadow host in cross-shadow scenarios, there is a subtle mismatch risk that makes these tests fragile.

---

#### P2-7: `subcomponents` in Storybook meta uses string tag names instead of class references

**File:** `hx-tabs.stories.ts:15`
**Area:** Storybook

```ts
subcomponents: { 'hx-tab': 'hx-tab', 'hx-tab-panel': 'hx-tab-panel' },
```

Storybook's `subcomponents` expects class constructors (e.g., `{ 'hx-tab': HelixTab }`) to pull CEM autodocs for sub-components. Passing string tag names will silently fail to generate sub-component API documentation in the Docs tab.

---

#### P2-8: Scrollable overflow (ManyTabs story) not visually constrained

**File:** `hx-tabs.stories.ts:385`
**Area:** Storybook

The `ManyTabs` story renders 8 tabs in an unconstrained viewport, so horizontal overflow may not trigger in Storybook canvas. The story should constrain the container width to demonstrate scrollable tab behavior explicitly. No visual affordance or scroll shadow indicates that tabs are scrollable.

---

#### P2-9: Deprecated `-webkit-overflow-scrolling: touch` retained

**File:** `hx-tabs.styles.ts:36`
**Area:** CSS

`-webkit-overflow-scrolling: touch` is deprecated and has no effect in modern Safari (removed in Safari 13). Dead code — can be removed.

---

#### P2-10: Disabled tab `cursor: not-allowed` is unreachable under `pointer-events: none`

**File:** `hx-tab.styles.ts:68-71`
**Area:** CSS

```css
:host([disabled]) {
  pointer-events: none; /* on host */
}
.tab[disabled] {
  cursor: not-allowed; /* never visible */
}
```

`pointer-events: none` on the host prevents any pointer interaction from reaching the inner button, so the `cursor: not-allowed` rule on `.tab[disabled]` is never rendered. The rules conflict with each other.

---

## Coverage Summary

| Area           | Status          | Key Gaps |
| -------------- | --------------- | -------- |
| TypeScript     | Mostly clean    | No public `selectedIndex`/`value`, `activation` not reflected |
| Accessibility  | P0 blocker      | `aria-controls` on wrong element; disabled handling wrong |
| Tests          | Strong baseline | Missing: active-tab removal, Home/End manual mode, icons |
| Storybook      | Good coverage   | Missing: WithIcons story; `subcomponents` wrong type |
| CSS            | Mostly clean    | Vertical indicator broken; no `::part(indicator)` |
| Performance    | Acceptable      | Bundle size not measured; caching is correct |
| Drupal         | Partial         | No `value` attr for pre-selection; `activation` not reflected |

---

## DO NOT FIX — Document Only

All findings are documented here. No source files were modified. Fixes should be implemented as a follow-up feature ticket with full test coverage.
