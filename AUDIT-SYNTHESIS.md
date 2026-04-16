# HELiX 3.0.0 Audit Synthesis Report

**Generated:** 2026-04-12
**Scope:** 81 components across @helixui/library
**Methodology:** Deep production readiness audit per AUDIT-PLAN.md scoring rubric
**Dimensions:** Accessibility (3x), Flexibility (2x), Extensibility (1x), Drupal Readiness (2x), Developer Experience (1x)

---

## Executive Summary

81 components were audited against the 5-dimension scoring rubric defined in AUDIT-PLAN.md. The weighted composite formula is `(a11y*3 + flex*2 + ext*1 + drupal*2 + dx*1) / 9`.

**Overall Results:**

| Category | Count | Components |
|---|---|---|
| SHIP (>= 7.0) | 68 | See full scorecard |
| SHIP-WITH-WARNINGS (5.0-6.9) | 13 | hx-counter, hx-stat, hx-structured-list, hx-button-group, hx-list, hx-nav, hx-file-upload, hx-split-panel, hx-combobox, hx-date-picker, hx-phi-field, hx-rating, hx-split-button |
| BLOCK (< 5.0) | 0 | None |
| **HOLD (explicit)** | **3** | **hx-stat, hx-file-upload, hx-phi-field** |
| SHIP-WITH-BLOCKERS | 1 | hx-list |

**Fleet Composite Score:** 7.5/10 (mean across 81 components)

**Key Finding:** No component scores below 5.0 (BLOCK threshold). However, 3 components carry explicit HOLD designations due to accessibility and security blockers that must be resolved before 3.0.0 ships. An additional component (hx-list) is flagged SHIP-WITH-BLOCKERS. The remaining 10 SHIP-WITH-WARNINGS components (5.7-6.9 range) are shippable but carry tracked debt.

**Systemic Gap:** The dominant cross-cutting finding is the near-universal absence of `@media (forced-colors: active)` styles (81/81 audits flag this, ref #1424). This is not a WCAG 2.1 AA violation per se, but it is a healthcare-mandate gap that affects every component. A single systemic fix addressing forced-colors across the library would raise 60+ component scores by 0.3-0.5 points.

---

## HOLD Components (P0 -- Must Fix Before 3.0.0)

These components have explicit HOLD designations in their audits. They must not ship in 3.0.0 without remediation.

### hx-stat (Composite: 6.4, Tier 2)

**Ship Decision:** HOLD

**Blocking Issues:**
- B-A1: No `aria-live` region for dynamic value/trend updates. Healthcare dashboards with real-time data require screen reader announcements when metrics change.
- B-A2: No `@media (forced-colors: active)` styles. Trend indicator indistinguishable in Windows High Contrast Mode.

**Source:** `packages/hx-library/src/components/hx-stat/AUDIT.md`

### hx-file-upload (Composite: 6.8, Tier 2)

**Ship Decision:** HOLD

**Blocking Issues:**
- B-A1: No `aria-invalid="true"` on dropzone when error is set. (`hx-file-upload.ts` line 608)
- B-A2: No forced-colors styles. (`hx-file-upload.styles.ts`)
- B-A3: Focus not restored after file removal. (`hx-file-upload.ts` lines 489-503)
- B-A4: Remove button touch target ~22x22px, below WCAG 2.1 AA 24x24px minimum. (`hx-file-upload.styles.ts` line 165)
- B-A5: `mixinDelegatesAria` not applied -- host-level `aria-label` not forwarded to dropzone. (`hx-file-upload.ts` line 47)

**Source:** `packages/hx-library/src/components/hx-file-upload/AUDIT.md`

### hx-phi-field (Composite: 6.9, Healthcare-Specific)

**Ship Decision:** HOLD

**Blocking Issues:**
- B-A1 / PHI-S2 (CRITICAL): Masked value readable by screen readers as literal asterisks with partial PHI. Must add `aria-hidden="true"` to masked value span. This is a PHI exposure risk.
- B-A2: No forced-colors support -- toggle button invisible in Windows High Contrast Mode.

**Source:** `packages/hx-library/src/components/hx-phi-field/AUDIT.md`

### hx-list (Composite: 6.6, Tier 2)

**Ship Decision:** SHIP-WITH-BLOCKERS (must resolve before 3.0.0)

**Blocking Issues:**
- B-A1: Interactive listbox can render without accessible name. `label` must be enforced or fallback mechanism added.
- B-A2: Zero forced-colors support. Selected, hover, and disabled states invisible in Windows High Contrast Mode.

**Source:** `packages/hx-library/src/components/hx-list/AUDIT.md`

---

## Systemic Issues (Cross-Cutting Findings)

These findings appear across 10+ components and should be addressed as single systemic tickets rather than per-component fixes.

### S1: Forced-Colors / High Contrast Mode (81/81 components)

**Reference:** #1424
**Priority:** P1
**Impact:** Every component audit flags missing or incomplete `@media (forced-colors: active)` styles. Only hx-progress-bar has partial coverage. Button boundaries, focus rings using `box-shadow`, selected states using `background-color`, and interactive indicators become invisible in Windows High Contrast Mode.

**Pattern:** Focus rings implemented via `box-shadow` (which is suppressed in forced-colors mode) need supplemental `outline` fallbacks. State differentiation via color alone needs border or outline supplements.

**Affected:** All 81 components. Components with interactive states (buttons, inputs, selects, checkboxes, toggles) are highest priority.

**Recommended Fix:** Create a shared forced-colors stylesheet or mixin in HelixElement that provides baseline forced-colors rules. Apply per-component overrides for state-specific styles.

### S2: All-Private Methods Blocking Extensibility (69/81 components)

**Reference:** #1427
**Priority:** P2
**Impact:** 69 audits flag that all internal methods are `private` with zero `protected` hooks. Extensibility scores are uniformly 5/10 across most components. Enterprise consumers cannot create specialized subclasses (e.g., a PHI-aware text input, a clinical variant of a select) without forking.

**Pattern:** Methods like `renderContent()`, `handleClick()`, `handleKeyDown()`, and lifecycle hooks should be `protected` to enable safe subclassing. The `PropertyValues` generic parameter should use the component type (e.g., `PropertyValues<HxButton>`) rather than bare `PropertyValues`.

**Affected:** 69 components (all except those already using some protected methods like hx-checkbox, hx-text-input, hx-select, hx-button, hx-slider, and a handful of others).

**Recommended Fix:** Audit each component for safe-to-expose extension points. Promote key render and event handler methods from `private` to `protected`. Add `@override` JSDoc tags.

### S3: HelixElement Base Class Migration (19/81 components still on LitElement)

**Priority:** P2
**Impact:** 62 components have migrated to HelixElement, but 19 still extend LitElement directly. These miss base-class features: devWarn(), forced-colors base styles (when added), and shared lifecycle patterns.

**Affected (still on LitElement):** hx-alert, hx-card, hx-carousel, hx-checkbox, hx-code-snippet, hx-counter, hx-form, hx-grid, hx-list, hx-menu, hx-nav, hx-stat, hx-structured-list, hx-style-scope, hx-table, hx-tabs, hx-tag, hx-theme, hx-toggle-button

**Recommended Fix:** Migrate remaining 19 components to extend HelixElement. This is a prerequisite for systemic forced-colors support (S1) if implemented at the base class level.

### S4: Missing devWarn() for Misuse Patterns (81/81 audits reference)

**Priority:** P2
**Impact:** All 81 audits flag missing or insufficient developer-time warnings. Common gaps: no warning when interactive components lack accessible names, no warning for invalid property combinations, no warning when required slots are empty.

**Pattern:** Components like hx-counter, hx-stat, hx-list, and hx-button-group silently accept configurations that produce inaccessible output (e.g., listbox without label, counter without label, button group without accessible name).

**Recommended Fix:** Add `devWarn()` calls (from HelixElement) for: (1) missing accessible name on interactive components, (2) invalid variant/size combinations, (3) empty required slots. This is gated on S3 (HelixElement migration) for the 19 remaining LitElement components.

### S5: Missing mixinDelegatesAria (64/81 audits reference)

**Priority:** P2
**Impact:** 64 audits note that `mixinDelegatesAria` is not applied. Host-level ARIA attributes (aria-label, aria-describedby, aria-expanded) set by consumers are not forwarded to the internal interactive element in Shadow DOM. This forces consumers to use non-standard patterns to label components.

**Affected:** Majority of components. Most impactful on form components (hx-select, hx-combobox, hx-file-upload, hx-date-picker) where Drupal/CMS integration requires host-level attribute forwarding.

**Recommended Fix:** Apply mixinDelegatesAria to all components with internal interactive elements. Prioritize Tier 1 form components first.

### S6: Undocumented CSS Custom Properties (80/81 audits reference)

**Priority:** P2
**Impact:** 80 audits flag CSS custom properties used in `.styles.ts` files that are not declared in JSDoc `@cssprop` tags. This means CEM (Custom Elements Manifest) does not reflect the actual theming surface, and consumers cannot discover available customization points.

**Pattern:** Common missing tokens include focus-ring colors, internal spacing, animation durations, and component-specific overrides. Many components have 2-5 undocumented properties.

**Recommended Fix:** Audit all `.styles.ts` files. For each `var(--hx-*)` reference, ensure a corresponding `@cssprop` JSDoc tag exists on the component class. Run CEM generation to verify.

### S7: Touch Target Compliance (74/81 audits reference)

**Reference:** #1436
**Priority:** P2
**Impact:** 74 audits flag touch targets below the 44px project standard. While most meet the WCAG 2.1 AA Level A minimum of 24px, the project standard is 44px for healthcare usability. Most violations are on `sm` size variants.

**Pattern:** Button sm variants, icon buttons, close buttons on dialogs/drawers/tags, and slider thumbs are the most common offenders.

**Recommended Fix:** Increase minimum touch target padding on `sm` variants across the library. Consider a shared mixin or CSS utility for minimum 44px touch target enforcement.

### S8: FormMixin Lifecycle Gaps (66/81 audits reference)

**Reference:** #1426
**Priority:** P2
**Impact:** 66 audits reference FormMixin. Key gaps: `formResetCallback` and `formStateRestoreCallback` inconsistencies, missing `formAssociated` static flag on some form components, and ElementInternals state not synchronized on all value change paths.

**Affected:** All form-participating components (hx-checkbox, hx-select, hx-combobox, hx-text-input, hx-textarea, hx-number-input, hx-switch, hx-radio-group, hx-slider, hx-date-picker, hx-time-picker, hx-file-upload, hx-color-picker, hx-rating).

**Recommended Fix:** Standardize FormMixin lifecycle across all form components. Ensure `formResetCallback` restores default values, `formStateRestoreCallback` handles browser autofill, and `setFormValue` is called on every value mutation path.

### S9: `nothing` vs Empty String Inconsistency (51/81 audits reference)

**Reference:** #1428
**Priority:** P3
**Impact:** 51 audits flag inconsistent handling of absent/optional attributes. Some components render `aria-label=""` (empty string) instead of omitting the attribute via Lit's `nothing` sentinel. Empty string attributes can override accessible name computation.

**Recommended Fix:** Audit all optional ARIA attribute bindings. Replace `${this.label || ''}` patterns with `${this.label || nothing}` to ensure attributes are omitted when not set.

### S10: Missing Twig Templates for Drupal (81/81 audits reference)

**Priority:** P3
**Impact:** All 81 audits reference Twig template status. Many components lack dedicated `.twig` template files for Drupal integration. While web components work in Twig via raw HTML tags, purpose-built Twig templates with Drupal conventions (attributes bag, BEM class fallbacks, preprocess variable mapping) are needed for enterprise Drupal adoption.

**Recommended Fix:** Generate Twig template stubs for all Tier 1 components first (23 components). Templates should accept an `attributes` Drupal bag and map component properties to Twig variables.

### S11: ::slotted() Styling Fragility (6/81 audits reference)

**Reference:** #1441
**Priority:** P3
**Impact:** 6 audits specifically flag `::slotted()` fragility. Components that style slotted content with `::slotted()` selectors break when consumers wrap slotted elements in additional containers, as `::slotted()` only matches direct children of slots.

**Affected:** hx-button-group, hx-breadcrumb, hx-tabs, hx-accordion, hx-menu, hx-structured-list

**Recommended Fix:** Document the constraint for consumers. Where feasible, use CSS Parts or host-level custom properties instead of `::slotted()` for styling.

---

## Per-Dimension Summary

### Accessibility (Weight: 3x)

| Score Range | Count | Components |
|---|---|---|
| 9/10 | 5 | hx-breadcrumb, hx-container, hx-skeleton, hx-stack, hx-style-scope, hx-visually-hidden |
| 8/10 | 24 | hx-action-bar, hx-alert, hx-avatar, hx-banner, hx-button, hx-card, hx-checkbox, hx-dialog, hx-drawer, hx-field, hx-format-date, hx-help-text, hx-icon, hx-icon-button, hx-pagination, hx-progress-bar, hx-radio-group, hx-select, hx-slider, hx-switch, hx-tabs, hx-text-input, hx-textarea, hx-theme, hx-time-picker |
| 7/10 | 40 | Majority of remaining components |
| 6/10 | 10 | hx-clinical-status, hx-file-upload, hx-list, hx-split-button, hx-split-panel, hx-stat, hx-structured-list, hx-table, hx-tag, hx-text |
| 5/10 | 2 | hx-counter, hx-rating (at-risk for Tier 1 BLOCK threshold) |

**Key Gap:** The 5/10 scores on hx-counter and hx-rating approach the BLOCK threshold (A11y < 5 on Tier 1 = BLOCK per AUDIT-PLAN.md). hx-counter is Tier 3 so the Tier 1 rule does not apply, but the A11y < 4 universal BLOCK would.

**Dominant Issues:**
1. Forced-colors support (S1) -- universal gap, 81/81 components
2. Missing accessible name enforcement -- interactive components accept empty labels silently
3. Focus management gaps -- focus not restored after dynamic operations (removal, close, collapse)

### Flexibility (Weight: 2x)

| Score Range | Count | Components |
|---|---|---|
| 9/10 | 15 | hx-alert, hx-breadcrumb, hx-button, hx-clinical-status, hx-container, hx-dialog, hx-number-input, hx-patient-banner, hx-popup, hx-select, hx-slider, hx-switch, hx-tabs, hx-text, hx-text-input, hx-theme, hx-time-picker, hx-top-nav |
| 8/10 | 45 | Majority |
| 7/10 | 14 | hx-avatar, hx-copy-button, hx-icon, hx-icon-button, hx-phi-field, hx-rating, hx-side-nav, hx-stack, hx-structured-list, hx-split-panel, hx-style-scope, hx-visually-hidden, hx-nav |
| 6/10 | 5 | hx-button-group, hx-counter, hx-format-date, hx-list |
| < 6 | 0 | None |

**Key Gap:** Low flexibility scores cluster around components missing CSS custom property documentation (S6), limited slot options, and missing size/density variants. hx-counter (6/10) and hx-button-group (6/10) are the weakest.

**Dominant Issues:**
1. Undocumented CSS custom properties (S6) -- tokens exist in styles but not in JSDoc
2. Missing size/density variants on layout components
3. Limited slot options for composition patterns

### Extensibility (Weight: 1x)

| Score Range | Count | Components |
|---|---|---|
| 8/10 | 2 | hx-checkbox, hx-text-input |
| 7/10 | 2 | hx-button, hx-select |
| 6/10 | 18 | hx-alert, hx-avatar, hx-banner, hx-carousel, hx-clinical-status, hx-color-picker, hx-dialog, hx-drawer, hx-dropdown, hx-field, hx-slider, hx-spinner, hx-stack, hx-switch, hx-table, hx-tabs, hx-text, hx-textarea, hx-theme, hx-toggle-button, hx-top-nav, hx-visually-hidden |
| 5/10 | 59 | Majority of components |
| < 5 | 2 | hx-combobox (4), hx-date-picker (4) |

**Key Gap:** Extensibility is the weakest dimension fleet-wide. 59 components score 5/10, indicating the all-private methods pattern (S2) is the dominant bottleneck. Only hx-checkbox and hx-text-input demonstrate the target pattern with protected render/handler methods.

**Dominant Issues:**
1. All-private methods (S2) -- 69/81 components have zero protected hooks
2. Missing PropertyValues generic parameter (#1427) -- bare PropertyValues instead of typed
3. No component factory or registration customization pattern

### Drupal Readiness (Weight: 2x)

| Score Range | Count | Components |
|---|---|---|
| 9/10 | 18 | hx-alert, hx-breadcrumb, hx-card, hx-code-snippet, hx-container, hx-copy-button, hx-form, hx-icon-button, hx-pagination, hx-progress-bar, hx-prose, hx-skeleton, hx-slider, hx-switch, hx-tabs, hx-text-input, hx-theme, hx-toggle-button, hx-top-nav |
| 8/10 | 27 | Middle tier |
| 7/10 | 26 | Lower mid |
| 6/10 | 6 | hx-counter, hx-nav, hx-stat |
| < 6 | 0 | None |

**Key Gap:** Low Drupal scores correlate with missing Twig templates (S10), missing document-token-adoption.js integration, and components that require JavaScript initialization patterns incompatible with Drupal behaviors.

**Dominant Issues:**
1. Missing Twig templates (S10) -- no dedicated .twig files for Drupal
2. Missing adopted stylesheets documentation
3. Components requiring JS initialization without Drupal behavior wrappers

### Developer Experience (Weight: 1x)

| Score Range | Count | Components |
|---|---|---|
| 9/10 | 22 | hx-breadcrumb, hx-button, hx-checkbox, hx-clinical-status, hx-container, hx-dialog, hx-field, hx-form, hx-number-input, hx-pagination, hx-patient-banner, hx-radio-group, hx-select, hx-slider, hx-spinner, hx-switch, hx-tabs, hx-text-input, hx-textarea, hx-theme, hx-time-picker, hx-avatar |
| 8/10 | 42 | Majority |
| 7/10 | 13 | hx-code-snippet, hx-color-picker, hx-counter, hx-date-picker, hx-meter, hx-phi-field, hx-prose, hx-split-button, hx-stat, hx-structured-list, hx-style-scope, hx-tooltip |
| < 7 | 0 | None |

**Key Gap:** DX is the strongest dimension overall. Lowest scores (7/10) correlate with missing IDE autocompletion support (incomplete CEM), complex configuration without guard rails, and missing Storybook story coverage for edge cases.

---

## Recommended GitHub Tickets

### P0 -- Must Fix Before 3.0.0 Ship

| Ticket | Title | Components | Source |
|---|---|---|---|
| P0-1 | fix: hx-stat -- add aria-live region for dynamic value updates, add forced-colors styles | hx-stat | hx-stat/AUDIT.md B-A1, B-A2 |
| P0-2 | fix: hx-file-upload -- add aria-invalid, restore focus after removal, fix touch targets, apply mixinDelegatesAria | hx-file-upload | hx-file-upload/AUDIT.md B-A1 through B-A5 |
| P0-3 | fix: hx-phi-field -- hide masked value from screen readers (PHI exposure), add forced-colors support | hx-phi-field | hx-phi-field/AUDIT.md B-A1/PHI-S2, B-A2 |
| P0-4 | fix: hx-list -- enforce accessible name on interactive listbox, add forced-colors support | hx-list | hx-list/AUDIT.md B-A1, B-A2 |
| P0-5 | fix: hx-counter -- add semantic role and accessible name enforcement | hx-counter | hx-counter/AUDIT.md B-A1, B-A2 |

### P1 -- Required for 3.0.0 Quality Bar

| Ticket | Title | Components | Source |
|---|---|---|---|
| P1-1 | feat: add forced-colors support across all components (#1424) | All 81 | S1; every AUDIT.md flags this |
| P1-2 | fix: components with blocking a11y issues (non-HOLD) | hx-data-table, hx-dropdown, hx-color-picker, hx-menu, hx-image, hx-table, hx-badge, hx-meter, hx-progress-ring, hx-prose, hx-side-nav, hx-spinner, hx-split-button, hx-status-indicator, hx-structured-list, hx-tag, hx-text, hx-toast, hx-tooltip | 27 components have blocking issues per audits |
| P1-3 | fix: touch targets below 44px project standard on sm variants (#1436) | 74 components | S7; hx-split-panel (4px), hx-file-upload (22px), hx-rating (20px) are worst |

### P2 -- Post-3.0.0 / Fast Follow

| Ticket | Title | Components | Source |
|---|---|---|---|
| P2-1 | refactor: promote private methods to protected for extension points (#1427) | 69 components | S2; extensibility scores 5/10 |
| P2-2 | chore: migrate remaining 19 components to HelixElement base class | hx-alert, hx-card, hx-carousel, hx-checkbox, hx-code-snippet, hx-counter, hx-form, hx-grid, hx-list, hx-menu, hx-nav, hx-stat, hx-structured-list, hx-style-scope, hx-table, hx-tabs, hx-tag, hx-theme, hx-toggle-button | S3 |
| P2-3 | feat: add devWarn() for missing accessible names on interactive components | All interactive components | S4 |
| P2-4 | feat: apply mixinDelegatesAria to components with internal interactive elements | 64 components | S5 |
| P2-5 | docs: add @cssprop JSDoc tags for all undocumented CSS custom properties | 80 components | S6 |
| P2-6 | fix: standardize FormMixin lifecycle across all form components (#1426) | 14 form components | S8 |

### P3 -- Backlog

| Ticket | Title | Components | Source |
|---|---|---|---|
| P3-1 | fix: replace empty string ARIA attributes with Lit nothing sentinel (#1428) | 51 components | S9 |
| P3-2 | feat: generate Twig templates for Tier 1 components | 23 Tier 1 components | S10 |
| P3-3 | docs: document ::slotted() constraints and workarounds (#1441) | 6 components | S11 |

---

## Full Scorecard

All 81 components sorted by composite score ascending. Dimension columns: A11y / Flex / Ext / Drupal / DX.

| # | Component | Tier | A11y | Flex | Ext | Drupal | DX | Composite | Grade | Ship Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | hx-counter | 3 | 5 | 6 | 5 | 6 | 7 | 5.7 | D | SHIP-WITH-WARNINGS |
| 2 | hx-stat | 2 | 6 | 8 | 5 | 6 | 7 | 6.4 | D+ | **HOLD** |
| 3 | hx-structured-list | 2 | 6 | 7 | 5 | 7 | 7 | 6.4 | D+ | SHIP-WITH-WARNINGS (conditional) |
| 4 | hx-button-group | 2 | 7 | 6 | 5 | 7 | 7 | 6.6 | C+ | SHIP-WITH-WARNINGS |
| 5 | hx-list | 2 | 6 | 7 | 5 | 7 | 8 | 6.6 | C | SHIP-WITH-BLOCKERS |
| 6 | hx-nav | 1 | 7 | 7 | 5 | 6 | 8 | 6.6 | C | SHIP-WITH-WARNINGS |
| 7 | hx-file-upload | 2 | 6 | 8 | 5 | 7 | 8 | 6.8 | C | **HOLD** |
| 8 | hx-split-panel | 3 | 6 | 7 | 5 | 8 | 8 | 6.8 | D | SHIP-WITH-WARNINGS |
| 9 | hx-combobox | 1 | 7 | 8 | 4 | 7 | 7 | 6.9 | D | SHIP-WITH-WARNINGS |
| 10 | hx-date-picker | 1 | 7 | 8 | 4 | 7 | 7 | 6.9 | D | SHIP-WITH-WARNINGS |
| 11 | hx-phi-field | -- | 7 | 7 | 5 | 7 | 8 | 6.9 | C+ | **HOLD** |
| 12 | hx-rating | 2 | 7 | 7 | 5 | 7 | 8 | 6.9 | C+ | SHIP-WITH-WARNINGS |
| 13 | hx-split-button | 2 | 6 | 8 | 5 | 8 | 7 | 6.9 | C+ | SHIP-WITH-WARNINGS |
| 14 | hx-grid | 2 | 7 | 8 | 5 | 7 | 7 | 7.0 | C+ | SHIP-WITH-WARNINGS |
| 15 | hx-popover | 2 | 7 | 8 | 5 | 7 | 7 | 7.0 | C+ | SHIP-WITH-WARNINGS |
| 16 | hx-tag | 2 | 7 | 8 | 5 | 7 | 8 | 7.0 | C+ | SHIP-WITH-WARNINGS |
| 17 | hx-toast | 1 | 7 | 8 | 5 | 7 | 8 | 7.0 | C+ | SHIP-WITH-WARNINGS |
| 18 | hx-accordion | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 19 | hx-badge | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 20 | hx-divider | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 21 | hx-field-label | -- | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 22 | hx-image | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 23 | hx-link | 1 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 24 | hx-menu | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 25 | hx-progress-ring | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 26 | hx-side-nav | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 27 | hx-status-indicator | 2 | 7 | 8 | 5 | 7 | 8 | 7.1 | C+ | SHIP-WITH-WARNINGS |
| 28 | hx-checkbox-group | 1 | 7 | 8 | 5 | 8 | 8 | 7.2 | C | SHIP-WITH-WARNINGS |
| 29 | hx-color-picker | 2 | 7 | 8 | 6 | 7 | 8 | 7.2 | C+ | SHIP-WITH-WARNINGS |
| 30 | hx-dropdown | 2 | 7 | 8 | 6 | 7 | 8 | 7.2 | B- | SHIP-WITH-WARNINGS |
| 31 | hx-format-date | 3 | 8 | 6 | 5 | 8 | 8 | 7.2 | C | SHIP-WITH-WARNINGS |
| 32 | hx-meter | 2 | 7 | 8 | 5 | 8 | 7 | 7.2 | C+ | SHIP-WITH-WARNINGS |
| 33 | hx-tooltip | 2 | 7 | 8 | 5 | 8 | 7 | 7.2 | B- | SHIP-WITH-WARNINGS |
| 34 | hx-carousel | 3 | 7 | 8 | 5 | 8 | 8 | 7.3 | C | SHIP-WITH-WARNINGS |
| 35 | hx-copy-button | 3 | 7 | 7 | 5 | 9 | 8 | 7.3 | C | SHIP-WITH-WARNINGS |
| 36 | hx-data-table | 2 | 7 | 8 | 5 | 8 | 8 | 7.3 | -- | SHIP-WITH-WARNINGS |
| 37 | hx-overflow-menu | 2 | 7 | 8 | 5 | 8 | 8 | 7.3 | B- | SHIP-WITH-WARNINGS |
| 38 | hx-popup | -- | 7 | 9 | 5 | 7 | 8 | 7.3 | C+ | SHIP-WITH-WARNINGS |
| 39 | hx-spinner | 1 | 7 | 8 | 6 | 7 | 9 | 7.3 | C+ | SHIP-WITH-WARNINGS |
| 40 | hx-steps | 2 | 7 | 8 | 5 | 8 | 8 | 7.3 | C+ | SHIP-WITH-WARNINGS |
| 41 | hx-tree-view | 3 | 7 | 8 | 5 | 8 | 8 | 7.3 | C | SHIP-WITH-WARNINGS |
| 42 | hx-action-bar | 3 | 8 | 8 | 5 | 7 | 8 | 7.4 | C | SHIP-WITH-WARNINGS |
| 43 | hx-clinical-status | 1 | 6 | 9 | 6 | 8 | 9 | 7.4 | -- | SHIP-WITH-WARNINGS |
| 44 | hx-help-text | 2 | 8 | 7 | 5 | 8 | 8 | 7.4 | C+ | SHIP-WITH-WARNINGS |
| 45 | hx-icon | 1 | 8 | 7 | 5 | 8 | 8 | 7.4 | C+ | SHIP-WITH-WARNINGS |
| 46 | hx-number-input | 1 | 7 | 9 | 5 | 8 | 9 | 7.4 | -- | SHIP-WITH-WARNINGS |
| 47 | hx-prose | 2 | 7 | 8 | 5 | 9 | 7 | 7.4 | C+ | SHIP-WITH-WARNINGS |
| 48 | hx-banner | 2 | 8 | 8 | 6 | 7 | 8 | 7.6 | B- | SHIP-WITH-WARNINGS |
| 49 | hx-code-snippet | 3 | 7 | 8 | 6 | 9 | 7 | 7.6 | C | SHIP-WITH-WARNINGS |
| 50 | hx-radio-group | 1 | 8 | 8 | 5 | 8 | 9 | 7.6 | -- | SHIP-WITH-WARNINGS |
| 51 | hx-text | 2 | 7 | 9 | 6 | 8 | 8 | 7.67 | B- | SHIP-WITH-WARNINGS |
| 52 | hx-alert | 1 | 7 | 9 | 6 | 9 | 8 | 7.7 | B- | SHIP-WITH-WARNINGS |
| 53 | hx-avatar | 2 | 8 | 8 | 6 | 7 | 9 | 7.7 | B | SHIP-WITH-WARNINGS |
| 54 | hx-icon-button | 1 | 8 | 7 | 5 | 9 | 8 | 7.7 | B | SHIP-WITH-WARNINGS |
| 55 | hx-patient-banner | 1 | 7 | 9 | 5 | 8 | 9 | 7.7 | -- | SHIP-WITH-WARNINGS |
| 56 | hx-stack | -- | 9 | 7 | 6 | 7 | 8 | 7.7 | B- | SHIP-WITH-WARNINGS |
| 57 | hx-toggle-button | 2 | 7 | 8 | 6 | 9 | 8 | 7.7 | B | SHIP-WITH-WARNINGS |
| 58 | hx-drawer | 1 | 8 | 8 | 6 | 8 | 8 | 7.8 | B | SHIP-WITH-WARNINGS |
| 59 | hx-top-nav | 1 | 7 | 9 | 6 | 9 | 8 | 7.8 | B- | SHIP-WITH-WARNINGS |
| 60 | hx-visually-hidden | -- | 9 | 7 | 6 | 7 | 8 | 7.8 | B | SHIP-WITH-WARNINGS |
| 61 | hx-field | 1 | 8 | 8 | 6 | 8 | 9 | 7.9 | B | SHIP-WITH-WARNINGS |
| 62 | hx-style-scope | -- | 9 | 7 | 5 | 9 | 7 | 7.9 | B | SHIP-WITH-WARNINGS |
| 63 | hx-textarea | 1 | 8 | 8 | 6 | 8 | 9 | 7.9 | -- | SHIP-WITH-WARNINGS |
| 64 | hx-card | 1 | 8 | 8 | 6 | 9 | 8 | 8.0 | B | SHIP-WITH-WARNINGS |
| 65 | hx-pagination | 2 | 8 | 8 | 5 | 9 | 9 | 8.0 | B | SHIP-WITH-WARNINGS |
| 66 | hx-switch | 1 | 8 | 9 | 6 | 8 | 9 | 8.0 | B | SHIP-WITH-WARNINGS |
| 67 | hx-time-picker | 1 | 8 | 9 | 5 | 8 | 9 | 8.0 | -- | SHIP-WITH-WARNINGS |
| 68 | hx-dialog | 1 | 8 | 9 | 6 | 8 | 9 | 8.1 | B | SHIP-WITH-WARNINGS |
| 69 | hx-form | 1 | 8 | 8 | 6 | 9 | 9 | 8.1 | B | SHIP-WITH-WARNINGS |
| 70 | hx-tabs | 1 | 8 | 9 | 6 | 9 | 9 | 8.1 | B | SHIP-WITH-WARNINGS |
| 71 | hx-button | 1 | 8 | 9 | 7 | 8 | 9 | 8.2 | B | SHIP-WITH-WARNINGS |
| 72 | hx-progress-bar | 2 | 9 | 8 | 5 | 9 | 8 | 8.2 | B+ | SHIP-WITH-WARNINGS |
| 73 | hx-select | 1 | 8 | 9 | 7 | 8 | 9 | 8.2 | B | SHIP-WITH-WARNINGS |
| 74 | hx-skeleton | 3 | 9 | 8 | 5 | 9 | 8 | 8.2 | B | SHIP |
| 75 | hx-slider | 2 | 8 | 9 | 6 | 9 | 9 | 8.3 | B+ | SHIP-WITH-WARNINGS |
| 76 | hx-checkbox | 1 | 8 | 9 | 8 | 9 | 9 | 8.56 | B | SHIP-WITH-WARNINGS |
| 77 | hx-breadcrumb | 2 | 9 | 9 | 6 | 9 | 9 | 8.6 | A | SHIP-WITH-WARNINGS |
| 78 | hx-container | -- | 9 | 9 | 6 | 9 | 9 | 8.6 | A- | SHIP |
| 79 | hx-text-input | 1 | 8 | 9 | 8 | 9 | 9 | 8.6 | B | SHIP-WITH-WARNINGS |
| 80 | hx-theme | -- | 9 | 9 | 6 | 9 | 8 | 8.6 | B+ | SHIP-WITH-WARNINGS |
| 81 | hx-table | 2 | 6 | 8 | 6 | 8 | 8 | 7.1 | B- | SHIP-WITH-WARNINGS |

**Legend:**
- Tier 1: Critical path (23 components) -- highest quality bar
- Tier 2: Core (35 components)
- Tier 3: Specialized (23 components)
- "--" in Tier column: utility/infrastructure components not explicitly tiered in AUDIT-PLAN.md

---

## Appendix: Component Count by Ship Decision

| Decision | Count |
|---|---|
| SHIP | 2 (hx-container, hx-skeleton) |
| SHIP-WITH-WARNINGS | 75 |
| SHIP-WITH-BLOCKERS | 1 (hx-list) |
| HOLD | 3 (hx-stat, hx-file-upload, hx-phi-field) |
| BLOCK | 0 |

## Appendix: Ticket Summary

| Priority | Tickets | Description |
|---|---|---|
| P0 | 5 | HOLD component fixes (must resolve before ship) |
| P1 | 3 | Forced-colors systemic fix, remaining blocking a11y issues, touch targets |
| P2 | 6 | Private-to-protected, HelixElement migration, devWarn, mixinDelegatesAria, CSS docs, FormMixin |
| P3 | 3 | nothing sentinel, Twig templates, ::slotted docs |
| **Total** | **17** | Covering all 81 components via systemic grouping |
