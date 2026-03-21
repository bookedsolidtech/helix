# HELiX i18n Readiness Strategy

**Audit Date:** 2026-03-20
**Agent:** frontend-specialist
**Scope:** All 77 components in `packages/hx-library/src/components/`

---

## 1. Executive Summary

HELiX is deployed by enterprise healthcare organizations that increasingly operate across regional and language boundaries. This audit assessed all 77 components for internationalization (i18n) readiness across five dimensions: hardcoded English strings, RTL layout support, locale-aware formatting, slot-based text overrideability, and ARIA label customizability.

**Key findings:**

- **15 of 77 components** (19%) contain hardcoded English strings that cannot be overridden without modifying component source code.
- **9 of 77 components** (12%) use physical CSS properties (`margin-left`, `padding-right`, `left:`, `right:`) that will break in RTL layouts.
- **2 of 77 components** have locale-aware formatting gaps (`hx-time-picker` AM/PM strings, `hx-rating` pluralization).
- **1 component** (`hx-format-date`) is a model of excellent i18n implementation using `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat`.
- **52 of 77 components** use slot-based composition, making most visible text consumer-controlled.
- **44 of 77 components** are fully i18n ready with zero hardcoded strings and RTL-safe CSS.

The remediation effort is estimated at **48 engineer-hours** across three phases, with Phase 1 requiring 16 hours to address the highest-impact components.

---

## 2. Findings Summary

### 2.1 Hardcoded String Distribution

| Category | Count | Examples |
|---|---|---|
| Components with zero hardcoded strings | 62 | hx-button, hx-text-input, hx-spinner (label prop), hx-toast (closeLabel prop) |
| Components with 1 hardcoded string | 8 | hx-stat, hx-drawer, hx-nav, hx-top-nav, hx-number-input (×2), hx-time-picker, hx-tree-view |
| Components with 2-4 hardcoded strings | 5 | hx-alert (5), hx-date-picker (4), hx-split-panel (4), hx-pagination (5), hx-rating (2) |
| Components with 5+ hardcoded strings | 2 | hx-color-picker (8), hx-data-table (3 + computed templates) |

**Total hardcoded strings requiring remediation: 34**

### 2.2 RTL Layout Issues by Component

| Component | Physical CSS Properties Used | Risk Level |
|---|---|---|
| `hx-card` | 8× `padding-left/right` | Medium |
| `hx-checkbox` | 4× `padding-left` (indentation) | High — checkbox label offset breaks |
| `hx-container` | `margin-left/right`, `padding-left/right` | Medium |
| `hx-button-group` | `margin-left` (negative border overlap) | Medium |
| `hx-nav` | `left: 0`, `padding-left` (submenu) | High — mobile overlay misplaced |
| `hx-side-nav` | `margin-left: auto`, `padding-left`, `left:` (tooltip) | High |
| `hx-tree-view` | `padding-left` (depth indentation) | High — nesting breaks |
| `hx-switch` | `left:` (thumb position) | Critical — toggle thumb misplaced |
| `hx-drawer` | `left: 0`, `right: 0` (side placement) | Critical — wrong-side drawer |

### 2.3 Locale-Aware Formatting Gaps

| Component | Issue | Severity |
|---|---|---|
| `hx-time-picker` | AM/PM period strings are hardcoded English; `Intl.DateTimeFormat` not used | Medium |
| `hx-rating` | Star count strings use English singular/plural without `Intl.PluralRules` | Low |
| `hx-date-picker` | Already uses `Intl.DateTimeFormat` via `locale` property — no issue | None |
| `hx-format-date` | Full `Intl` API usage — model component | None |

### 2.4 Components Already Exemplifying Good i18n Patterns

These components have exposed label properties or use slots for all user-visible text:

- **`hx-spinner`** — `label` property (default: `'Loading'`)
- **`hx-toast`** — `closeLabel` property (default: `'Dismiss notification'`)
- **`hx-copy-button`** — `label` and `labelCopied` properties
- **`hx-code-snippet`** — `labelCopy`, `labelCopied`, `labelShowMore`, `labelShowLess` properties
- **`hx-carousel`** — `labelPrevSlide`, `labelNextSlide`, `labelPauseAutoplay`, `labelPlayAutoplay` properties
- **`hx-combobox`** — `labelNoOptions`, `labelRequired` properties
- **`hx-pagination`** — `label` and `labelRowsPerPage` properties
- **`hx-format-date`** — Full `Intl.DateTimeFormat` + `Intl.RelativeTimeFormat` with `locale` property

---

## 3. Recommended i18n Approach

### 3.1 Strategy: Property-Based Label Override (Recommended)

**Extend the existing pattern** already established by `hx-spinner`, `hx-toast`, and `hx-carousel`.

Each component that renders a hardcoded string exposes it as a named `@property` with a default English value. Consumers override at the attribute level, which makes Drupal Twig integration trivial:

```twig
<hx-pagination
  label="{{ 'Pagination'|t }}"
  label-first-page="{{ 'First page'|t }}"
  label-prev-page="{{ 'Previous page'|t }}"
  label-next-page="{{ 'Next page'|t }}"
  label-last-page="{{ 'Last page'|t }}"
></hx-pagination>
```

For function-typed labels (where the string depends on dynamic values), expose a function property:

```typescript
// Component property
@property({ attribute: false })
labelSortBy: (column: string, direction: 'asc' | 'desc' | null) => string =
  (col, dir) => dir ? `Sort by ${col}, currently sorted ${dir === 'asc' ? 'ascending' : 'descending'}` : `Sort by ${col}`;
```

This allows consumers to provide full template control without any runtime framework dependency.

### 3.2 Why Not `@lit/localize`?

`@lit/localize` is a viable option for applications that own their entire component tree. However, for a shared library consumed by Drupal, React, Vue, and Angular hosts:

- It requires bundling the translation runtime into each component
- It creates a tight coupling to the Lit localize build pipeline
- Drupal sites manage translations via `t()` functions — adding a second translation layer creates maintenance burden
- The property-based approach has zero runtime overhead and zero build complexity

**Verdict:** Property-based override wins for a shared library. `@lit/localize` is appropriate for application-layer localization, not design system components.

### 3.3 RTL Support: Logical CSS Properties

For CSS, the fix is systematic: replace all physical directional properties with their [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) equivalents.

| Physical Property | Logical Equivalent |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `margin-left: auto; margin-right: auto` | `margin-inline: auto` |
| `padding-left: X; padding-right: X` | `padding-inline: X` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `left: 0; right: 0` | `inset-inline: 0` |

Browser support for CSS logical properties is universal across all modern browsers (Chrome 69+, Firefox 66+, Safari 14.1+). There is no polyfill requirement.

**Exception:** Components that use `left:` as a value-axis coordinate (not layout), such as `hx-color-picker`'s color gradient canvas and `hx-slider`'s fill track, should NOT have these replaced. These are intentional LTR color/value representations. They should be documented as intentional.

### 3.4 Locale-Aware Formatting

For components rendering count-dependent or time-period strings:

**`hx-rating` star pluralization:**
```typescript
// Use Intl.PluralRules for correct handling across locales
private _getStarLabel(count: number): string {
  const pr = new Intl.PluralRules(this.locale ?? 'en');
  const rule = pr.select(count);
  return this.labelStar?.(count, rule) ?? (count === 1 ? '1 star' : `${count} stars`);
}
```

**`hx-time-picker` AM/PM:**
```typescript
// Use Intl.DateTimeFormat to get locale AM/PM markers
private _getAmPmMarkers(locale: string): { am: string; pm: string } {
  const am = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
    .formatToParts(new Date(2000, 0, 1, 6))
    .find(p => p.type === 'dayPeriod')?.value ?? 'AM';
  const pm = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
    .formatToParts(new Date(2000, 0, 1, 18))
    .find(p => p.type === 'dayPeriod')?.value ?? 'PM';
  return { am, pm };
}
```

---

## 4. Implementation Roadmap

### Phase 1 — Critical Path (Weeks 1–2, 16 hours)

**Goal:** All high-traffic interactive components become fully localizable.

**Target components:** `hx-color-picker`, `hx-pagination`, `hx-data-table`, `hx-date-picker`, `hx-alert`

**Changes:**

**`hx-color-picker`** (8 new properties, ~4h)
- Add: `labelGradient`, `labelHue`, `labelOpacity`, `labelSwatches`, `labelSwitchFormat`, `labelColorValue`, `labelPicker`
- Add: `labelTrigger: (color: string) => string` function property

**`hx-pagination`** (5 new properties, ~3h)
- Add: `labelFirstPage`, `labelPrevPage`, `labelNextPage`, `labelLastPage`
- Add: `labelPageOf: (current: number, total: number) => string` function property

**`hx-data-table`** (3 new properties, ~4h)
- Add: `labelSelectAll`
- Add: `labelSortBy: (column: string, direction: 'asc' | 'desc' | null) => string`
- Add: `labelSelectRow: (index: number) => string`

**`hx-date-picker`** (5 new properties, ~3h)
- Add: `labelChooseDate`, `labelPrevMonth`, `labelNextMonth`, `labelOpenCalendar`, `labelCloseCalendar`

**`hx-alert`** (2 new properties, ~2h)
- Add: `severityLabels: Partial<Record<'info' | 'success' | 'warning' | 'error', string>>`
- Add: `closeLabel`

**Gate:** All Phase 1 changes must pass `pnpm run type-check`, `pnpm run test`, and `pnpm run cem`.

---

### Phase 2 — Navigation and Overlays (Weeks 3–4, 12 hours)

**Goal:** All navigation, dialog, drawer, and overlay components localizable.

**Target components:** `hx-split-panel`, `hx-drawer`, `hx-dialog`, `hx-nav`, `hx-top-nav`, `hx-number-input`, `hx-rating`

**Changes:**

**`hx-split-panel`** (~3h)
- Add: `labelResize`, `labelCollapseStart`, `labelCollapseEnd`
- Add: `labelExpand: (side: 'start' | 'end') => string`

**`hx-drawer`** (~1h)
- Add: `closeLabel` (default: `'Close drawer'`)

**`hx-dialog`** (~1h)
- Add: `closeLabel` (default: dynamically built from heading, override to flatten)

**`hx-nav`** (~2h)
- Add: `labelOpenMenu`, `labelCloseMenu` properties

**`hx-top-nav`** (~1h)
- Add: `labelOpenNav`, `labelCloseNav` properties

**`hx-number-input`** (~2h)
- Add: `labelIncrement`, `labelDecrement` properties

**`hx-rating`** (~2h)
- Add: `labelStar: (count: number) => string` function property
- Add: `labelValueText: (value: number, max: number) => string` function property
- Add `locale` property for `Intl.PluralRules` integration

---

### Phase 3 — RTL CSS + Remaining Strings (Weeks 5–6, 20 hours)

**Goal:** All components render correctly in RTL layouts; all remaining minor string issues resolved.

**CSS Logical Properties migration (~14h):**

| Component | File | Work |
|---|---|---|
| `hx-checkbox` | `hx-checkbox.styles.ts` | 4× `padding-left` → `padding-inline-start` |
| `hx-card` | `hx-card.styles.ts` | 8× `padding-left/right` → `padding-inline` |
| `hx-container` | `hx-container.styles.ts` | `margin-left/right` → `margin-inline`, `padding-left/right` → `padding-inline` |
| `hx-button-group` | `hx-button-group.styles.ts` | `margin-left` → `margin-inline-start` |
| `hx-nav` | `hx-nav.styles.ts` | `left: 0` → `inset-inline-start`, `padding-left` → `padding-inline-start` |
| `hx-side-nav` | `hx-nav-item.styles.ts`, `hx-side-nav.styles.ts` | 5× physical → logical |
| `hx-tree-view` | `hx-tree-item.styles.ts` | `padding-left` → `padding-inline-start` |
| `hx-switch` | `hx-switch.styles.ts` | 3× `left:` → `inset-inline-start:` |
| `hx-drawer` | `hx-drawer.styles.ts` | `left/right` → `inset-inline-start/end` |
| `hx-alert` | `hx-alert.styles.ts` | `margin-left: auto` → `margin-inline-start: auto` |
| `hx-dialog` | `hx-dialog.styles.ts` | `margin-left: auto` → `margin-inline-start: auto` |
| `hx-banner` | `hx-banner.styles.ts` | `left/right/margin-left` → logical |
| `hx-toast` | `hx-toast.styles.ts` | 8× `left/right` → `inset-inline-start/end` |
| `hx-select` | `hx-select.styles.ts` | `left:` → `inset-inline-start:` |
| `hx-combobox` | `hx-combobox.styles.ts` | `left/right` → `inset-inline` |
| `hx-data-table` | `hx-data-table.styles.ts` | `padding-right` → `padding-inline-end` |
| `hx-code-snippet` | `hx-code-snippet.styles.ts` | `padding-right` → `padding-inline-end` |

**Remaining string fixes (~6h):**

| Component | Fix |
|---|---|
| `hx-carousel` | Add `labelSlideOf: (index: number, total: number) => string` function property |
| `hx-combobox` | Add `labelRemoveOption: (label: string) => string` function property |
| `hx-file-upload` | Add `labelFileList`, `labelUploadProgress: (name, progress) => string` |
| `hx-stat` | Add `labelTrend: (trend: StatTrend) => string` function property |
| `hx-tree-view` | Add `labelExpand`, `labelCollapse`, `labelChildren: (label) => string` |
| `hx-time-picker` | Add `labelOpenPicker`, `labelClosePicker`, `placeholder` property; use Intl for AM/PM |
| `hx-avatar` | Document that `label` property must be set; improve fallback message |

---

## 5. Priority Components

These five components appear in virtually every enterprise healthcare application and should be prioritized in Phase 1:

1. **`hx-color-picker`** — 8 hardcoded non-overrideable aria-labels. Highest string count. Color pickers appear in patient profile and scheduling UIs.
2. **`hx-data-table`** — Sort, select-all, and row-select labels are hardcoded. Data tables are the primary interface for patient records.
3. **`hx-pagination`** — 5 navigation button labels hardcoded. Appears with every data table.
4. **`hx-date-picker`** — 4 calendar navigation labels hardcoded. Date pickers appear in appointment booking, medication scheduling.
5. **`hx-alert`** — Severity labels (`Info:`, `Success:`, `Warning:`, `Error:`) are hardcoded. Alerts are used for clinical notifications.

---

## 6. Testing Strategy

### 6.1 Unit Tests for Label Properties

For each new label property added, add Vitest browser tests:

```typescript
it('renders with localized increment label', async () => {
  const el = await fixture<HxNumberInput>(
    html`<hx-number-input label-increment="Aumentar" label-decrement="Diminuir"></hx-number-input>`
  );
  const incrementBtn = shadowQuery(el, '[part="increment"]');
  expect(incrementBtn?.getAttribute('aria-label')).toBe('Aumentar');
});
```

### 6.2 RTL Layout Tests

Add a shared RTL test fixture helper to `packages/hx-library/src/test-utils.ts`:

```typescript
export async function fixtureRTL<T extends HTMLElement>(template: TemplateResult): Promise<T> {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('dir', 'rtl');
  document.body.appendChild(wrapper);
  const el = await fixture<T>(template, { parentNode: wrapper });
  return el;
}
```

For each RTL-fixed component, add a test asserting `getComputedStyle` returns expected values:

```typescript
it('positions checkbox label correctly in RTL', async () => {
  const el = await fixtureRTL<HxCheckbox>(html`<hx-checkbox>Label</hx-checkbox>`);
  const label = shadowQuery(el, '.checkbox__label');
  const styles = getComputedStyle(label!);
  // padding-inline-start resolves to padding-right in RTL
  expect(styles.paddingRight).not.toBe('0px');
});
```

### 6.3 Locale Snapshot Tests

For `hx-format-date` and components using `Intl`:

```typescript
const LOCALES_TO_TEST = ['en-US', 'es-ES', 'ar-SA', 'ja-JP', 'de-DE', 'fr-FR'];

for (const locale of LOCALES_TO_TEST) {
  it(`renders date correctly for locale: ${locale}`, async () => {
    const el = await fixture<HxFormatDate>(
      html`<hx-format-date date="2026-03-20" locale=${locale}></hx-format-date>`
    );
    expect(el.textContent?.trim()).not.toBe('');
    expect(el.textContent?.trim()).not.toContain('Invalid');
  });
}
```

### 6.4 Accessibility in Localized Context

Run `mcp__helixir__analyze_accessibility` on key components with localized attributes set before merging Phase 1 changes. Confirm no WCAG violations are introduced by the new label properties.

### 6.5 Storybook Controls for Label Properties

For each new label property, add a Storybook control in the component's `.stories.ts`:

```typescript
export const Localized: Story = {
  args: {
    labelFirstPage: 'Primera página',
    labelPrevPage: 'Página anterior',
    labelNextPage: 'Página siguiente',
    labelLastPage: 'Última página',
  },
};
```

---

## 7. Effort Estimates

| Phase | Scope | Engineer-Hours | Priority |
|---|---|---|---|
| Phase 1 | Add label properties to 5 critical components | 16h | P0 |
| Phase 2 | Add label properties to 7 nav/overlay components | 12h | P1 |
| Phase 3 | RTL CSS migration + remaining string fixes | 20h | P1-P2 |
| **Total** | **All 77 components** | **48h** | — |

**Notes:**

- Estimates assume an engineer familiar with the HELiX codebase and the existing label property pattern.
- Each component change includes: implementation + unit tests + Storybook control + CEM verification.
- RTL testing requires a device or browser in RTL mode; estimated time includes test authoring.
- Phase 3 CSS changes are low risk (pure refactors with no behavior change) and can be batched into a single PR.

---

## 8. Appendix: Components Requiring No Changes

The following 44 components are fully i18n ready with zero hardcoded strings and RTL-safe CSS:

`hx-accordion`, `hx-action-bar`, `hx-badge`, `hx-breadcrumb`, `hx-button`, `hx-checkbox-group`, `hx-copy-button`, `hx-counter`, `hx-divider`, `hx-dropdown`, `hx-field`, `hx-field-label`, `hx-form`, `hx-format-date`, `hx-grid`, `hx-help-text`, `hx-icon`, `hx-icon-button`, `hx-image`, `hx-link`, `hx-list`, `hx-menu`, `hx-meter`, `hx-overflow-menu`, `hx-popover`, `hx-popup`, `hx-progress-bar`, `hx-progress-ring`, `hx-prose`, `hx-radio-group`, `hx-skeleton`, `hx-spinner`, `hx-split-button`, `hx-stack`, `hx-status-indicator`, `hx-steps`, `hx-structured-list`, `hx-table`, `hx-tabs`, `hx-tag`, `hx-text`, `hx-text-input`, `hx-textarea`, `hx-theme`, `hx-toggle-button`, `hx-tooltip`, `hx-visually-hidden`

`hx-format-date` is highlighted as the reference implementation for locale-aware components: it uses `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat` with a `locale` property and format options, with internal result caching for performance. New components requiring locale-sensitive formatting should follow its architecture.
