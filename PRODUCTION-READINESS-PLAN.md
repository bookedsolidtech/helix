# HELiX Production Readiness Remediation Plan

**Date:** 2026-04-15
**Author:** Principal Engineer (Architecture Synthesis of 7 Specialist Audits)
**Status:** ACTIVE
**Scope:** Cross-cutting remediation across 83 components, 7 audit dimensions
**Goal:** Production-ready for first client build-out
**Input:** AUDIT-PLAN.md (PM audit framework), AUDIT-SYNTHESIS.md (81-component scorecard), 7 specialist reports

---

## Executive Summary

The library is 83 components strong with excellent foundations: design token discipline (9.5/10), animation quality (9/10), 100% Storybook coverage with 1,440+ stories, zero TypeScript `any` usage, and 505 axe-core assertions across 82 test files. The gaps are systemic, not scattered. Three cross-cutting issues -- forced-colors support, HelixElement base class migration, and focus-visible standardization -- account for approximately 70% of all audit findings. Fixing these in batch is dramatically more efficient than per-component remediation.

**Current state:** Fleet composite 7.5/10, ~70% production-ready.
**After this plan:** 95%+ production-ready, all HOLD components resolved, systemic gaps closed.

### What is strong

- Design token architecture: near-perfect adoption (9.5/10), 3-tier cascade working
- Animation: 100% prefers-reduced-motion coverage, GPU-accelerated, `transitionend`-aware
- Storybook: 100% coverage (83/83 components), ~1,440 stories, ~1,300 play functions, 57,841 lines
- TypeScript: zero `any`, zero `@ts-ignore`, zero `@ts-expect-error` across entire library
- Event architecture: all events use `bubbles: true, composed: true` -- cross-shadow-DOM by default
- Infrastructure patterns: devWarn, reference-counted scroll lock, `nothing` sentinel, SSR-safe IDs
- CDN build: two strategies (full bundle ~178KB gz, split per-component)
- Form API: 17 formAssociated components with proper `setFormValue` lifecycle

### What needs work

- 3 components crash Firefox (`attachInternals()` without `formAssociated`)
- 76/83 components missing `@media (forced-colors: active)` support (WCAG 1.4.11)
- 89/93 component classes still extend `LitElement` directly instead of `HelixElement`
- ~30 interactive component style files missing `:focus-visible` (WCAG 2.4.7)
- 53/83 components missing Twig templates for Drupal integration
- Key types (`FormMixin`, `mixinDelegatesAria`, `AriaDelegationMixinInterface`) not exported from barrel
- 3 HOLD components (hx-stat, hx-file-upload, hx-phi-field) and 1 SHIP-WITH-BLOCKERS (hx-list)

---

## Summary Table

| Phase | Description | Tasks | Effort (h) | Parallelizable | Calendar |
|-------|-------------|-------|------------|----------------|----------|
| **0** | Critical fixes (browser crashes, HOLD components) | 7 | 10 | Partially | 1.0 day |
| **1** | Systemic patterns (batch cross-cutting fixes) | 7 | 28 | Partially | 1.5 days |
| **2** | Component polish (per-component a11y/behavior) | 9 | 16 | High | 1.0 day |
| **3** | Drupal readiness (templates, reflection, behaviors) | 6 | 14 | High | 1.0 day |
| **4** | DX and documentation (types, CEM, Storybook) | 7 | 10 | High | 0.5 day |
| **Total** | | **36** | **78** | | **5.0 days** |

**Critical path:** Phase 0 --> Phase 1 (HelixElement migration) --> Phase 2 (form component fixes depend on HelixElement) --> Phases 3+4 (independent, parallelizable with each other)

---

## Phase 0: Critical Fixes (Browser Crashes + HOLD Components)

**Goal:** Eliminate Firefox crash conditions and resolve all HOLD-designated components from the audit synthesis.
**Effort:** 10 hours | **Calendar:** 1 day
**Dependencies:** None. This phase gates everything else.

### Tasks

- [ ] **P0-1: hx-button-group -- remove invalid `attachInternals()` call** (1h)
  - `hx-button-group` calls `this.internals = this.attachInternals()` in the constructor (line 76) but never declares `static formAssociated = true`. Firefox throws `InvalidStateError` and the component fails to construct.
  - File: `packages/hx-library/src/components/hx-button-group/hx-button-group.ts`
  - Fix: Remove the `attachInternals()` call. Button-group is a layout component, not a form participant. If internals were used for ARIA role assignment, switch to `this.setAttribute('role', 'group')` in `connectedCallback`.
  - Issues: #1426, #1456
  - Delegate to: **lit-specialist**

- [ ] **P0-2: hx-clinical-status -- remove invalid `attachInternals()` field initializer** (1h)
  - `hx-clinical-status` uses `private readonly _elInternals = this.attachInternals()` as a class field initializer (line 59), without `static formAssociated = true`. Same Firefox crash as P0-1.
  - File: `packages/hx-library/src/components/hx-clinical-status/hx-clinical-status.ts`
  - Fix: This component already extends `HelixElement`. Remove the field initializer. If it needs internals for ARIA, add `static override formAssociated = true` and use the inherited `this._internals` lazy accessor.
  - Issues: #1426, #1456
  - Delegate to: **lit-specialist**

- [ ] **P0-3: hx-icon-button -- migrate to HelixElement** (1h)
  - `hx-icon-button` extends `LitElement` directly (line 34), calls `attachInternals()` manually (line 107), and declares `static formAssociated = true`. This works but duplicates form lifecycle logic that `HelixElement` provides. This migration establishes the pattern for P1-1.
  - File: `packages/hx-library/src/components/hx-icon-button/hx-icon-button.ts`
  - Fix: Change to `extends HelixElement`, add `static override formAssociated = true`, remove manual `attachInternals()` call, replace hand-written `formResetCallback`/`formDisabledCallback` with `_onFormReset`/`_onFormDisabled` overrides.
  - Issues: #1426, #1452
  - Delegate to: **lit-specialist**

- [ ] **P0-4: hx-phi-field -- fix PHI screen reader exposure (HOLD)** (2h)
  - **CRITICAL SECURITY:** Masked PHI value is readable by screen readers as literal asterisks with partial PHI. Must add `aria-hidden="true"` to masked value span and provide a separate screen-reader-only description like "PHI field, value masked."
  - Also: No forced-colors support -- toggle button invisible in Windows High Contrast Mode.
  - File: `packages/hx-library/src/components/hx-phi-field/hx-phi-field.ts`
  - File: `packages/hx-library/src/components/hx-phi-field/hx-phi-field.styles.ts`
  - Source: AUDIT-SYNTHESIS.md P0-3, hx-phi-field/AUDIT.md B-A1/PHI-S2, B-A2
  - Delegate to: **accessibility-engineer** (primary), **lit-specialist** (implementation)

- [ ] **P0-5: hx-file-upload -- resolve 5 blocking a11y issues (HOLD)** (2h)
  - B-A1: No `aria-invalid="true"` on dropzone when error is set (line 608)
  - B-A2: No forced-colors styles
  - B-A3: Focus not restored after file removal (lines 489-503)
  - B-A4: Remove button touch target ~22x22px, below minimum
  - B-A5: `mixinDelegatesAria` not applied -- host-level `aria-label` not forwarded to dropzone
  - File: `packages/hx-library/src/components/hx-file-upload/hx-file-upload.ts`
  - File: `packages/hx-library/src/components/hx-file-upload/hx-file-upload.styles.ts`
  - Source: AUDIT-SYNTHESIS.md P0-2
  - Delegate to: **accessibility-engineer** + **lit-specialist**

- [ ] **P0-6: hx-stat -- add aria-live and forced-colors (HOLD)** (1.5h)
  - B-A1: No `aria-live` region for dynamic value/trend updates. Healthcare dashboards with real-time data require screen reader announcements when metrics change.
  - B-A2: No forced-colors styles. Trend indicator indistinguishable in Windows High Contrast Mode.
  - File: `packages/hx-library/src/components/hx-stat/hx-stat.ts`
  - File: `packages/hx-library/src/components/hx-stat/hx-stat.styles.ts`
  - Source: AUDIT-SYNTHESIS.md P0-1
  - Delegate to: **accessibility-engineer**

- [ ] **P0-7: hx-list -- enforce accessible name on interactive listbox (SHIP-WITH-BLOCKERS)** (1.5h)
  - B-A1: Interactive listbox can render without accessible name. `label` must be enforced or fallback mechanism added with `devWarn`.
  - B-A2: Zero forced-colors support for selected, hover, and disabled states.
  - File: `packages/hx-library/src/components/hx-list/hx-list.ts`
  - File: `packages/hx-library/src/components/hx-list/hx-list-item.styles.ts`
  - Note: The current branch (`fix/issue-1446-hx-list`) already has commit `a0562c466` addressing this. Verify the fix is complete.
  - Source: AUDIT-SYNTHESIS.md P0-4
  - Delegate to: **accessibility-engineer**

### Phase 0 Parallelization

- P0-1, P0-2, P0-3 are independent Firefox crash fixes -- **run in parallel** (all lit-specialist)
- P0-4 through P0-7 are independent HOLD component fixes -- **run in parallel** after P0-1/2/3
- P0-7 may already be resolved on current branch -- verify first

---

## Phase 1: Systemic Patterns (Batch Fixes)

**Goal:** Apply cross-cutting fixes that touch many components. Highest-leverage changes in the plan.
**Effort:** 28 hours | **Calendar:** 1.5 days
**Dependencies:** Phase 0 must complete first (P0-3 establishes the HelixElement migration pattern).

### Tasks

- [ ] **P1-1: HelixElement migration for 14 form components** (6h)
  - **The single highest-impact task in this plan.** Migrate 14 form-associated components from `extends LitElement` + manual `attachInternals()` to `extends HelixElement` + `static override formAssociated = true`.
  - Components (confirmed via grep, all have `this._internals = this.attachInternals()` in constructor):
    1. `hx-button` (hx-button.ts:60)
    2. `hx-textarea` (hx-textarea.ts:66)
    3. `hx-checkbox-group` (hx-checkbox-group.ts:62)
    4. `hx-toggle-button` (hx-toggle-button.ts:57)
    5. `hx-rating` (hx-rating.ts:92)
    6. `hx-combobox` (hx-combobox.ts:85)
    7. `hx-number-input` (hx-number-input.ts:66)
    8. `hx-switch` (hx-switch.ts:62)
    9. `hx-radio-group` (hx-radio-group.ts:57)
    10. `hx-slider` (hx-slider.ts:75)
    11. `hx-file-upload` (hx-file-upload.ts:61)
    12. `hx-date-picker` (hx-date-picker.ts:72)
    13. `hx-time-picker` (hx-time-picker.ts:192)
    14. `hx-checkbox` (extends LitElement via FormMixin chain)
  - Per-component migration checklist:
    - Change import from `LitElement` to `HelixElement` (from `../../base/helix-element.js`)
    - Change `extends LitElement` to `extends HelixElement`
    - Add `static override formAssociated = true`
    - Remove constructor `this._internals = this.attachInternals()` call
    - Remove `_internals` field declaration (now inherited as lazy accessor from HelixElement)
    - Remove manual `formResetCallback`, `formDisabledCallback`, `formStateRestoreCallback`
    - Add `_onFormReset`, `_onFormDisabled`, `_onFormStateRestore` override methods
    - Run component test file to verify zero regressions
  - Reference implementations: `hx-select` and `hx-color-picker` already extend HelixElement correctly.
  - Estimated ~600 lines of boilerplate eliminated across the 14 components.
  - Issues: #1452, #1426, #1456
  - **Sequential execution required** -- each migration committed and tested before the next.
  - Delegate to: **lit-specialist**

- [ ] **P1-2: FormMixin and mixin barrel exports** (2h)
  - `FormMixin` and `FormMixinInterface` are defined in `packages/hx-library/src/mixins/FormMixin.ts` but not exported from either barrel:
    - `packages/hx-library/src/mixins/index.ts` -- currently only exports `mixinDelegatesAria`, `AriadDelegationMixinInterface`, `FocusMixin`, `FocusMixinInterface`
    - `packages/hx-library/src/index.ts` -- currently only exports `FocusMixin` and `FocusMixinInterface` from mixins
  - `mixinDelegatesAria` is exported from the mixins barrel but NOT from the root barrel `packages/hx-library/src/index.ts`.
  - Add exports for: `FormMixin`, `FormMixinInterface`, `mixinDelegatesAria`, `AriaDelegationMixinInterface` (renamed, see P1-6)
  - Check for `AdoptedStylesheetsController` and add to barrel if it exists as a standalone module.
  - Issues: #1439
  - **Can parallelize** with P1-1 (different files).
  - Delegate to: **typescript-specialist**

- [ ] **P1-3: Forced-colors support across all components** (8h)
  - Only 7 style files have `@media (forced-colors: active)` rules (confirmed via grep):
    - `hx-list-item.styles.ts`, `hx-slider.styles.ts`, `hx-progress-bar.styles.ts`, `hx-pagination.styles.ts`, `hx-date-picker.styles.ts`, `hx-button.styles.ts`, `hx-avatar.styles.ts`
  - Remaining 76 components need forced-colors rules. Prioritize by interaction level:
    - **Batch A -- Form controls (~16 files):** text-input, textarea, select, checkbox, checkbox-group, radio-group, switch, combobox, number-input, file-upload, color-picker, toggle-button, rating, phi-field, time-picker, icon-button
    - **Batch B -- Interactive widgets (~14 files):** dialog, drawer, popover, tooltip, dropdown, overflow-menu, tabs, accordion, menu, split-button, carousel, data-table, tree-view, breadcrumb
    - **Batch C -- Display/layout (remaining ~46 files):** card, alert, banner, toast, badge, tag, stat, etc.
  - Standard pattern per component:
    ```css
    @media (forced-colors: active) {
      :host { border: 1px solid ButtonText; }
      :host([disabled]) { border-color: GrayText; color: GrayText; }
      :host(:focus-visible) { outline-color: Highlight; }
    }
    ```
  - For components using `box-shadow` for focus rings: add supplemental `outline` in forced-colors mode (box-shadow is suppressed).
  - Files: Every `*.styles.ts` in `packages/hx-library/src/components/`
  - Issues: #1448, #1424 (S1 in AUDIT-SYNTHESIS.md -- flagged by 81/81 audits)
  - **Can parallelize** with P1-1 (style files only, no TS logic changes).
  - Delegate to: **css3-animation-purist**

- [ ] **P1-4: Focus-visible standardization** (4h)
  - 53 component style files already have `:focus-visible` (confirmed via grep). Approximately 30 interactive component style files are missing it.
  - Audit every interactive component and add `:focus-visible` rules where absent.
  - Standard pattern:
    ```css
    :host(:focus-visible),
    [part]:focus-visible {
      outline: var(--hx-focus-ring-width, 2px) solid var(--hx-focus-ring-color, var(--hx-color-primary-500));
      outline-offset: var(--hx-focus-ring-offset, 2px);
    }
    ```
  - Files: All `*.styles.ts` missing `:focus-visible`
  - Issues: #1449 (S7 subset in AUDIT-SYNTHESIS.md)
  - **Can parallelize** with P1-3 (different CSS blocks in same files, or different files entirely).
  - Delegate to: **css3-animation-purist**

- [ ] **P1-5: ID counter standardization** (2h)
  - Only 4 components use `createIdCounter()` from `packages/hx-library/src/base/id-counter.ts` (hx-clinical-status, hx-text-input, hx-select, hx-checkbox). At least 1 component (`hx-overflow-menu`) uses bare `let _counter = 0` at module scope (line 8).
  - Module-scoped counters break test isolation: Vitest runs tests in the same process and counter state persists between test files, causing flaky ID-dependent assertions.
  - Audit all components that generate IDs. Migrate to `createIdCounter()` with `resetIdCounter()` in test teardown.
  - Issues: Part of Lit architecture audit findings, contributes to #1452
  - Delegate to: **lit-specialist** (after P1-1)

- [ ] **P1-6: Fix `AriadDelegationMixinInterface` typo** (1h)
  - `AriadDelegationMixinInterface` (extra "d") is exported from:
    - `packages/hx-library/src/mixins/aria-delegation.ts` (line 74, interface declaration)
    - `packages/hx-library/src/mixins/index.ts` (line 2, re-export)
  - Also: `AriadDelegationMixin` class name (line 156) has the same typo.
  - Fix approach:
    1. Rename interface to `AriaDelegationMixinInterface`
    2. Rename class to `AriaDelegationMixin`
    3. Add deprecated re-export: `/** @deprecated Use AriaDelegationMixinInterface */ export type AriadDelegationMixinInterface = AriaDelegationMixinInterface;`
    4. Create changeset documenting the rename
  - Issues: #1439
  - Delegate to: **typescript-specialist** (after P1-2)

- [ ] **P1-7: TypeScript tsconfig hardening** (1h)
  - Add two flags to `packages/hx-library/tsconfig.json`:
    - `noImplicitReturns: true`
    - `noFallthroughCasesInSwitch: true`
  - Run `pnpm run type-check` and fix any new errors. Expected: 0-5 errors based on current strict compliance.
  - Issues: TypeScript audit findings
  - Delegate to: **typescript-specialist** (after P1-6)

### Phase 1 Parallelization Map

```
Day 1 afternoon + Day 2:

lit-specialist:     P1-1 (HelixElement migration) ████████████████████████ 6h  [sequential per component]
                    P1-5 (ID counters)             ████ 2h                     [after P1-1]

css-specialist:     P1-3 (forced-colors)  ████████████████████████████████ 8h  [parallel with P1-1]
                    P1-4 (focus-visible)  ████████████████ 4h                  [after or parallel with P1-3]

ts-specialist:      P1-2 (barrel exports)  ████ 2h                            [parallel with P1-1]
                    P1-6 (typo fix)        ██ 1h                              [after P1-2]
                    P1-7 (tsconfig)        ██ 1h                              [after P1-6]
```

---

## Phase 2: Component Polish

**Goal:** Fix per-component issues identified across multiple audits.
**Effort:** 16 hours | **Calendar:** 1 day
**Dependencies:** P1-1 (HelixElement migration) should complete before touching form components here.

### Tasks

- [ ] **P2-1: hx-button `disabled` vs `aria-disabled` pattern** (3h)
  - Native `disabled` attribute removes the element from the tab order. In healthcare UX, disabled buttons should remain focusable so screen reader users can discover them and understand why they cannot act. Use `aria-disabled="true"` instead, preventing activation via click/keydown interception.
  - File: `packages/hx-library/src/components/hx-button/hx-button.ts`
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts`
  - **Architecture decision:** This establishes the pattern for all interactive components. Document the decision and apply to hx-icon-button, hx-toggle-button in follow-up.
  - Issues: #1449
  - Delegate to: **accessibility-engineer** (pattern design), **lit-specialist** (implementation)

- [ ] **P2-2: hx-data-table roving tabindex and keyboard navigation** (3h)
  - Missing roving tabindex pattern. Row-click keyboard activation broken.
  - File: `packages/hx-library/src/components/hx-data-table/hx-data-table.ts`
  - Implement: Arrow-key navigation between rows, Enter/Space to activate row-click handler, Home/End for first/last row, `tabindex="0"` on active row and `tabindex="-1"` on all others.
  - Issues: #1449
  - Delegate to: **accessibility-engineer**

- [ ] **P2-3: hx-carousel `aria-live` region management** (1h)
  - Currently `aria-live="off"` during autoplay (correct). Must switch to `aria-live="polite"` when autoplay stops or user interacts manually.
  - File: `packages/hx-library/src/components/hx-carousel/hx-carousel.ts`
  - Issues: #1449
  - Delegate to: **accessibility-engineer**

- [ ] **P2-4: hx-card accessible name fallback** (1h)
  - No mechanism to derive an accessible name from slotted heading content.
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts`
  - Fix: Listen for `slotchange` on heading slot. When heading is slotted, auto-generate ID and set `aria-labelledby`. If no heading and no `aria-label`, emit `devWarn`.
  - Issues: #1449
  - Delegate to: **accessibility-engineer**

- [ ] **P2-5: hx-popover hardcoded values** (1h)
  - z-index `9999` instead of design token. Also hardcoded opacity and gap values.
  - File: `packages/hx-library/src/components/hx-popover/hx-popover.styles.ts`
  - Replace with `var(--hx-popover-z-index, var(--hx-z-index-popover, 9999))` and tokenize opacity/gap.
  - Issues: CSS audit findings
  - Delegate to: **css3-animation-purist**

- [ ] **P2-6: hx-drawer hardcoded animation duration in JS** (1h)
  - JS `setTimeout` uses hardcoded millisecond duration instead of reading CSS property or listening for `transitionend`.
  - File: `packages/hx-library/src/components/hx-drawer/hx-drawer.ts`
  - Fix: Replace `setTimeout` with `transitionend` event listener, with safety timeout as fallback.
  - Issues: #1432
  - Delegate to: **css3-animation-purist**

- [ ] **P2-7: hx-radio-group error slot `aria-describedby`** (1h)
  - Error slot detection broken in `aria-describedby` computation.
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts`
  - Issues: #1430
  - Delegate to: **accessibility-engineer**

- [ ] **P2-8: hx-textarea character counter `aria-hidden` conflict** (1h)
  - `aria-hidden="true"` on character counter element conflicts with `aria-describedby` reference pointing to that same element. An element cannot be both hidden from and referenced by assistive technology.
  - File: `packages/hx-library/src/components/hx-textarea/hx-textarea.ts`
  - Fix: Remove `aria-hidden` from counter, or use separate visually-hidden element for SR description.
  - Issues: #1429
  - Delegate to: **accessibility-engineer**

- [ ] **P2-9: Touch target enforcement on `sm` variants** (4h)
  - All components with `hx-size="sm"` variant need minimum 44x44px touch targets (WCAG 2.5.8, project standard).
  - Affected: hx-button, hx-icon-button, hx-toggle-button, hx-checkbox, hx-radio (inside radio-group), hx-switch, hx-tag (dismissible), close buttons on dialog/drawer/toast.
  - Pattern: Use padding or `::before`/`::after` pseudo-element to expand touch target to 44x44px while maintaining visual `sm` size.
  - Issues: #1450, #1436 (S7 in AUDIT-SYNTHESIS.md -- flagged by 74/81 audits)
  - Delegate to: **css3-animation-purist** (CSS pattern), **accessibility-engineer** (verification)

### Phase 2 Parallelization

P2-1 through P2-8 are fully independent. P2-9 should wait for P1-3 (forced-colors may touch the same style blocks).

- **accessibility-engineer:** P2-1, P2-2, P2-3, P2-4, P2-7, P2-8
- **css3-animation-purist:** P2-5, P2-6, P2-9

---

## Phase 3: Drupal Readiness

**Goal:** Make the library deployable in Drupal with zero friction for the first client.
**Effort:** 14 hours | **Calendar:** 1 day
**Dependencies:** P1-1 (HelixElement migration) must complete before P3-1. Otherwise independent of Phase 2.

### Tasks

- [ ] **P3-1: Form component `reflect: true` on key properties** (3h)
  - Form component properties (`name`, `value`, `disabled`, `required`, `type`) must have `reflect: true` in `@property()` decorators for Drupal theme CSS attribute selectors to work (e.g., `hx-text-input[disabled]`, `hx-select[required]`).
  - hx-select and hx-text-input already reflect most properties -- confirmed via grep. Use as reference pattern.
  - Audit all 17 form-associated components. Add `reflect: true` where missing.
  - Files: All form component `.ts` files in `packages/hx-library/src/components/`
  - Issues: Drupal integration audit findings (attribute reflection gap)
  - Delegate to: **drupal-integration-specialist**

- [ ] **P3-2: Regenerate `helix.libraries.yml`** (2h)
  - Generator outputs v1.1.2 metadata while library is at v2.1.2. Component list stale, missing 4 healthcare components (hx-patient-banner, hx-clinical-status, hx-phi-field, and one other).
  - Add FOUC prevention CSS entry to libraries definition.
  - Update CDN path references to current version.
  - Issues: Drupal specialist audit findings
  - Delegate to: **drupal-specialist**

- [ ] **P3-3: Twig templates for Tier 1 form components** (4h)
  - 29 Twig templates exist (confirmed via glob). 53 components missing templates. All form components are missing except hx-checkbox, hx-checkbox-group, and hx-slider.
  - Create templates for: hx-text-input, hx-textarea, hx-select, hx-combobox, hx-number-input, hx-date-picker, hx-time-picker, hx-file-upload, hx-color-picker, hx-switch, hx-radio-group, hx-rating, hx-phi-field
  - Pattern: Follow existing templates (e.g., `hx-checkbox.twig`). Each template accepts component properties as Twig variables and renders the custom element with attributes bag.
  - Files: New `*.twig` files in each component directory under `packages/hx-library/src/components/`
  - Issues: #1458
  - Delegate to: **drupal-integration-specialist**

- [ ] **P3-4: Twig templates for Tier 2 interactive/display components** (3h)
  - Missing templates for key display and interactive components: hx-dialog, hx-data-table, hx-tabs, hx-nav, hx-side-nav, hx-clinical-status, hx-patient-banner, hx-stat, hx-list, hx-structured-list, hx-tag, hx-badge, hx-avatar, hx-image, hx-link, hx-text, hx-divider
  - Issues: #1458
  - Delegate to: **drupal-integration-specialist**

- [ ] **P3-5: Create `helix.behaviors.js` Drupal behaviors file** (1h)
  - Drupal expects a behaviors JS file for AJAX/BigPipe integration. When Drupal inserts new DOM via AJAX, behaviors re-initialize components.
  - For web components this is mostly a no-op (custom elements auto-upgrade on DOM connection), but the behaviors file should call `ensureDocumentTokens()` and handle edge cases.
  - File: New file at `packages/hx-library/src/drupal/helix.behaviors.js`
  - Issues: Drupal specialist audit findings
  - Delegate to: **drupal-specialist**

- [ ] **P3-6: Validate BigPipe/AJAX `disconnectedCallback` coverage** (1h)
  - 36/81 components have proper `disconnectedCallback`. Verify the remaining 45 are safe-by-design (no timers, observers, global event listeners, or other resources needing cleanup).
  - Produce a checklist. File follow-up tickets for any component that has cleanup needs but lacks `disconnectedCallback`.
  - Issues: Drupal integration audit findings
  - Delegate to: **drupal-specialist**

### Phase 3 Parallelization

- P3-1 depends on P1-1 (HelixElement migration)
- P3-2, P3-3, P3-4, P3-5, P3-6 are independent of each other
- **drupal-integration-specialist:** P3-1, P3-3, P3-4 (highest effort items)
- **drupal-specialist:** P3-2, P3-5, P3-6

---

## Phase 4: DX and Documentation

**Goal:** Polish the consumer developer experience for framework integrators and CEM accuracy.
**Effort:** 10 hours | **Calendar:** Half day
**Dependencies:** P1-2 (barrel exports) should complete first. Otherwise independent of Phases 2 and 3.

### Tasks

- [ ] **P4-1: Event map type declarations** (3h)
  - Create TypeScript event map interfaces (e.g., `HxButtonEventMap`, `HxTextInputEventMap`) mapping event names to `CustomEvent<T>` detail types.
  - Declare on each component via `HTMLElementEventMap` augmentation for full `addEventListener` autocomplete and type safety.
  - File: Per-component type additions or centralized `packages/hx-library/src/events.ts`
  - Issues: TypeScript audit findings
  - Delegate to: **typescript-specialist**

- [ ] **P4-2: CSS Parts documentation** (2h)
  - `part=` attributes exist in component templates but are undocumented. Consumers cannot discover styling hooks.
  - Add `@csspart` JSDoc tags to every component that exposes parts. Run `pnpm run cem` and verify parts appear in `custom-elements.json`.
  - Issues: Related to #1455, CSS audit findings (S6 in AUDIT-SYNTHESIS.md)
  - Delegate to: **design-system-developer**

- [ ] **P4-3: CSS custom property JSDoc tags** (2h)
  - Add `@cssprop` JSDoc tags for all undocumented CSS custom properties across components. 80/81 audits flagged undocumented `--hx-*` properties used in `.styles.ts` files.
  - Issues: #1455 (S6 in AUDIT-SYNTHESIS.md)
  - Delegate to: **design-system-developer**

- [ ] **P4-4: Storybook high-contrast theme in preview config** (1h)
  - Add Windows High Contrast / forced-colors simulation theme option to Storybook preview toolbar. Enables manual verification of P1-3 changes.
  - File: `apps/storybook/.storybook/preview.ts` or equivalent
  - Issues: Storybook audit findings
  - Delegate to: **storybook-specialist**

- [ ] **P4-5: Storybook viewport addon** (0.5h)
  - Add viewport addon for responsive testing in Storybook.
  - File: `apps/storybook/.storybook/main.ts`
  - Issues: Storybook audit findings
  - Delegate to: **storybook-specialist**

- [ ] **P4-6: Empty string ARIA attribute cleanup** (1h)
  - Replace empty string ARIA attribute values with Lit's `nothing` sentinel across components. Empty strings render as `aria-label=""` which confuses assistive technology.
  - Issues: #1457 (S9 in AUDIT-SYNTHESIS.md -- flagged by 51/81 audits)
  - Delegate to: **lit-specialist**

- [ ] **P4-7: Missing `firstUpdated` PropertyValues parameter** (0.5h)
  - Several components declare `firstUpdated()` without the `PropertyValues` parameter, preventing subclasses from accessing changed properties.
  - Issues: #1427
  - Delegate to: **lit-specialist**

### Phase 4 Parallelization

All tasks are independent. Full parallel execution:

- **typescript-specialist:** P4-1
- **design-system-developer:** P4-2, P4-3
- **storybook-specialist:** P4-4, P4-5
- **lit-specialist:** P4-6, P4-7

---

## Issue Cross-Reference

| GH Issue | Title | Phase/Task | Priority |
|----------|-------|------------|----------|
| #1424 | Forced-colors support across components | P1-3 | P1 |
| #1425 | Reformat minified CSS stylesheets | Deferred | P3 |
| #1426 | Standardize form-associated on FormMixin | P0-1, P0-2, P0-3, P1-1 | P0 |
| #1427 | Add missing firstUpdated PropertyValues | P4-7 | P2 |
| #1429 | hx-textarea counter aria conflict | P2-8 | P1 |
| #1430 | hx-radio-group error slot aria-describedby | P2-7 | P1 |
| #1432 | hx-drawer hardcoded animation duration | P2-6 | P1 |
| #1433 | hx-dropdown panel slot validation | Deferred | P3 |
| #1435 | hx-steps/stat deprecated size attr | Deferred | P3 |
| #1436 | Touch target enforcement small elements | P2-9 | P1 |
| #1438 | hx-form hardcoded form element allowlist | Deferred | P2 |
| #1439 | Export missing type aliases | P1-2, P1-6 | P1 |
| #1441 | Replace fragile ::slotted() selectors | Deferred | P2 |
| #1448 | Add forced-colors support | P1-3 | P1 |
| #1449 | Resolve blocking a11y issues | P1-4, P2-1..P2-8 | P1 |
| #1450 | Touch targets below 44px on sm | P2-9 | P1 |
| #1451 | Promote private to protected methods | Deferred | P2 |
| #1452 | Migrate remaining to HelixElement | P1-1 | P1 |
| #1453 | Add devWarn for missing accessible names | Deferred | P2 |
| #1454 | Apply mixinDelegatesAria | Deferred | P2 |
| #1455 | Add @cssprop JSDoc tags | P4-2, P4-3 | P2 |
| #1456 | Standardize FormMixin lifecycle | P0-1, P0-2, P1-1 | P0 |
| #1457 | Replace empty ARIA attrs with nothing | P4-6 | P2 |
| #1458 | Generate Twig templates Tier 1 | P3-3, P3-4 | P2 |
| #1459 | Document ::slotted() constraints | Deferred | P3 |

---

## Deduplicated Cross-Audit Findings

Multiple audits independently flagged the same issues. This table maps to canonical tasks to prevent duplicate work.

| Finding | Reported By (Audits) | Canonical Task |
|---------|---------------------|----------------|
| Forced-colors missing on 76+ components | CSS/Animation, Accessibility, Drupal Specialist, Drupal Integration | P1-3 |
| HelixElement migration needed (89 classes) | Lit Architecture, TypeScript, Drupal Integration | P0-1/2/3, P1-1 |
| `attachInternals()` without `formAssociated` crashes Firefox | Lit Architecture, TypeScript | P0-1, P0-2 |
| FormMixin not exported from barrel | TypeScript, Lit Architecture | P1-2 |
| Focus-visible gaps (~30 style files) | Accessibility, CSS/Animation | P1-4 |
| ID counter inconsistency (test isolation) | Lit Architecture, TypeScript | P1-5 |
| `AriadDelegationMixinInterface` typo | TypeScript, Lit Architecture | P1-6 |
| Form property `reflect: true` for Drupal | Drupal Specialist, Drupal Integration | P3-1 |
| Missing Twig templates (53 components) | Drupal Specialist, Drupal Integration | P3-3, P3-4 |
| Touch target size on sm variants | Accessibility, CSS/Animation | P2-9 |
| CSS Parts undocumented | CSS/Animation, TypeScript | P4-2 |
| CSS custom properties undocumented | CSS/Animation, TypeScript, Storybook | P4-3 |
| HOLD: hx-phi-field PHI exposure | Accessibility, Lit Architecture | P0-4 |

---

## Specialist Assignment Matrix

| Specialist | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total Hours |
|-----------|---------|---------|---------|---------|---------|-------------|
| **lit-specialist** | P0-1, P0-2, P0-3 (3h) | P1-1, P1-5 (8h) | -- | -- | P4-6, P4-7 (1.5h) | **12.5h** |
| **css3-animation-purist** | -- | P1-3, P1-4 (12h) | P2-5, P2-6, P2-9 (6h) | -- | -- | **18h** |
| **typescript-specialist** | -- | P1-2, P1-6, P1-7 (4h) | -- | -- | P4-1 (3h) | **7h** |
| **accessibility-engineer** | P0-4, P0-5, P0-6, P0-7 (7h) | -- | P2-1..P2-4, P2-7, P2-8 (10h) | -- | -- | **17h** |
| **drupal-integration-specialist** | -- | -- | -- | P3-1, P3-3, P3-4 (10h) | -- | **10h** |
| **drupal-specialist** | -- | -- | -- | P3-2, P3-5, P3-6 (4h) | -- | **4h** |
| **storybook-specialist** | -- | -- | -- | -- | P4-4, P4-5 (1.5h) | **1.5h** |
| **design-system-developer** | -- | -- | -- | -- | P4-2, P4-3 (4h) | **4h** |

---

## Daily Execution Schedule

Assumes 3-4 specialists working in parallel, 8-hour days.

| Day | Morning (4h) | Afternoon (4h) | Gate Check |
|-----|-------------|----------------|------------|
| **Day 1** | P0-1, P0-2, P0-3 (lit, parallel) then P0-4..P0-7 (a11y, parallel) | P1-1 begins (lit); P1-2 + P1-6 (ts); P1-3 begins (css) | Phase 0 green: type-check + test:smart on all 7 components |
| **Day 2** | P1-1 continues (lit); P1-3 continues (css); P1-4 begins (css) | P1-1 finishes; P1-5 (lit); P1-7 (ts); P1-3 finishes | Phase 1 green: full test suite + CEM regen |
| **Day 3** | P2-1, P2-2 (a11y); P2-5, P2-6 (css); P3-1, P3-2 (drupal) | P2-3, P2-4, P2-7, P2-8 (a11y); P3-3 begins (drupal-int) | Phase 2 green: affected test files + axe assertions |
| **Day 4** | P2-9 (css); P3-3 finish, P3-4 (drupal-int); P3-5, P3-6 (drupal) | P4-1 (ts); P4-2, P4-3 (design); P4-4, P4-5 (storybook); P4-6, P4-7 (lit) | Phases 3+4 green: CEM + Storybook build |
| **Day 5** | **Buffer:** Overflow, integration testing, CEM final regen | Full `pnpm run preflight` | Ship decision |

---

## Deferred Items (Post-Launch Backlog)

Real findings that do not block production readiness for the first client.

| Item | Issue | Reason Deferred |
|------|-------|-----------------|
| CSS reformatting (minified stylesheets) | #1425 | Cosmetic, no functional impact |
| hx-dropdown slot validation false positive | #1433 | Warning is incorrect, component works |
| Deprecated size attr in stories | #1435 | Stories only, not library source |
| hx-form hardcoded element allowlist | #1438 | Works for current 17 form components |
| Fragile ::slotted() positional selectors | #1441 | Fragile but functional, documented |
| Promote private methods to protected | #1451 | API enhancement (S2 in synthesis, 69 components, ~40h effort -- post-launch workstream) |
| devWarn for missing accessible names | #1453 | Enhancement, existing components are labeled |
| mixinDelegatesAria expansion | #1454 | Enhancement (S5 in synthesis, 64 components -- post-launch workstream) |
| ::slotted() documentation | #1459 | Docs, not code |
| Visual regression CI (Chromatic/Percy) | -- | Infrastructure investment, not blocking code quality |
| CKEditor integration improvements | -- | Not needed for Twig/Drupal consumption |
| SDC showcase expansion | -- | 3 production patterns already exist |
| hx-* prefix collision with htmx | -- | Document only if client uses htmx |
| Non-form HelixElement migration (remaining ~70 display components) | -- | S3 in synthesis, beneficial but not blocking |

---

## Quality Gates Per Phase

Each phase completion requires passing these gates before proceeding:

1. `pnpm run type-check` -- zero errors
2. `pnpm run test:smart` -- all affected component tests pass
3. `pnpm run cem` -- regenerate and verify CEM accuracy
4. Manual spot-check of 3 representative components per phase
5. `pnpm run preflight` on the final commit of each phase (mandatory, per CLAUDE.md)

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| HelixElement migration breaks existing tests | High | Medium | Migrate one component at a time. Run test suite after each. hx-select/hx-color-picker prove the pattern works. |
| Forced-colors CSS increases bundle size | Low | Certain | ~200 bytes/component x 76 = ~15KB uncompressed, ~3KB gzipped. Well within 50KB budget. |
| `reflect: true` additions change observed behavior | Medium | Low | Only adding reflection to properties that already exist. Test attribute selectors in isolation. |
| AriadDelegationMixinInterface rename breaks consumers | Low | Low | Deprecated alias ensures backward compatibility. |
| Phase 1 takes longer than estimated | Medium | Medium | Day 5 buffer absorbs 8h overflow. P3-4 (Tier 2 Twig) can defer to post-launch if needed. |
| `aria-disabled` pattern on hx-button changes click behavior | High | Medium | Extensive test coverage for click prevention. Document behavioral change in changeset. |
| HOLD component fixes interact with Phase 1 systemic changes | Medium | Low | Phase 0 completes before Phase 1 starts. File-level isolation between HOLD fixes and systemic work. |

---

## Acceptance Criteria for Production Readiness

This plan is complete when:

1. Zero HOLD components remain (hx-stat, hx-file-upload, hx-phi-field resolved)
2. Zero Firefox crash conditions (attachInternals fixed)
3. All 83 components have forced-colors support (#1448/#1424 closed)
4. All interactive components have `:focus-visible` (#1449 partially closed)
5. All 14 form components extend HelixElement (#1452 closed)
6. `FormMixin`, `mixinDelegatesAria`, `AriaDelegationMixinInterface` exported from barrel (#1439 closed)
7. All form components reflect key properties for Drupal (#1458 Twig templates shipped)
8. `pnpm run preflight` passes with zero failures
9. Fleet composite score moves from 7.5 to 8.0+ (estimated)
