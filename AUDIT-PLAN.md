# HELiX 3.0.0 Production Readiness Audit Plan

**Author:** Senior PM, Platform
**Date:** 2026-04-12
**Status:** ACTIVE
**Scope:** 81 components across 5 audit dimensions
**Target:** Ship/no-ship decision for @helixui/library 3.0.0

---

## Table of Contents

1. [AUDIT.md Template](#1-auditmd-template)
2. [Scoring Rubric](#2-scoring-rubric)
3. [Component Tier List](#3-component-tier-list)
4. [Execution Strategy](#4-execution-strategy)
5. [Ship/No-Ship Criteria](#5-shipno-ship-criteria)
6. [Known Issues Reference](#6-known-issues-reference)
7. [Questions for Principal Engineer](#7-questions-for-principal-engineer)

---

## 1. AUDIT.md Template

Every component audit produces a file at:
`packages/hx-library/src/components/<hx-component>/AUDIT.md`

These files are gitignored -- they are local working documents that feed the release decision.

````markdown
# AUDIT: <hx-component>

**Auditor:** <agent-type>
**Date:** YYYY-MM-DD
**Component version:** 3.0.0-rc
**Tier:** <1|2|3>

---

## Summary

| Dimension           | Score | Grade   |
|---------------------|-------|---------|
| Accessibility       | _/10  | _       |
| Flexibility         | _/10  | _       |
| Extensibility       | _/10  | _       |
| Drupal Readiness    | _/10  | _       |
| Developer Experience | _/10 | _       |
| **Composite**       | _/10  | _       |

**Ship Decision:** SHIP / SHIP-WITH-WARNINGS / BLOCK

---

## 1. Accessibility (Weight: 3x)

### 1.1 axe-core Automated Results
- Violations: <count>
- Incomplete: <count>
- Details: <list each violation with impact level>

### 1.2 Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Activation via Enter and/or Space (as appropriate)
- [ ] Escape closes overlays/popups
- [ ] Arrow keys for composite widgets (tabs, menus, radio groups)
- [ ] No keyboard traps
- [ ] Focus visible indicator on all interactive states

### 1.3 Screen Reader
- [ ] Announces role correctly
- [ ] Announces name/label
- [ ] Announces state changes (expanded, selected, checked, disabled)
- [ ] Announces value changes (sliders, inputs)
- [ ] Live regions used for dynamic content (alerts, toasts)

### 1.4 Focus Management
- [ ] Focus trap in modal patterns (dialog, drawer)
- [ ] Focus restore on close
- [ ] Focus delegation to internal input (where applicable)
- [ ] No orphaned focus on dynamic content removal

### 1.5 High Contrast / forced-colors
- [ ] All interactive boundaries visible in forced-colors mode
- [ ] Icons/indicators use currentColor or forced-colors-aware values
- [ ] Focus indicators visible
- [ ] Selected/active states distinguishable

### 1.6 ARIA Patterns
- [ ] Correct WAI-ARIA pattern implemented (reference: APG)
- [ ] Required roles present
- [ ] Required states/properties present
- [ ] aria-delegation used correctly (if applicable)
- [ ] No redundant or conflicting ARIA

### 1.7 Touch Targets
- [ ] Interactive elements meet 44x44px minimum
- [ ] Adequate spacing between adjacent targets

**Score:** _/10
**Blocking Issues:** <list or "None">
**Warnings:** <list or "None">

---

## 2. Flexibility (Weight: 2x)

### 2.1 CSS Custom Properties
- Token count: <N> --hx-<component>-* properties
- [ ] All visual properties tokenized (colors, spacing, typography, borders, radii)
- [ ] Semantic fallback chain (component -> semantic -> primitive)
- [ ] Documented in JSDoc or CEM

### 2.2 CSS ::part() Exposure
- Parts exposed: <list>
- [ ] All meaningful internal elements have parts
- [ ] Part names follow convention (lowercase, hyphenated)
- [ ] Parts documented in CEM

### 2.3 Slot Architecture
- Slots: <list named slots + default>
- [ ] Default slot for primary content
- [ ] Named slots for structured content areas
- [ ] Slot fallback content where appropriate
- [ ] slotchange events handled correctly

### 2.4 Property/Attribute API
- Public properties: <count>
- [ ] All configurable behaviors exposed as properties
- [ ] Reflected attributes where appropriate
- [ ] Boolean attributes follow HTML convention
- [ ] No missing configuration that forces consumer workarounds

### 2.5 Event API
- Custom events: <list>
- [ ] Events use hx- prefix
- [ ] Events bubble and are composed (cross shadow DOM)
- [ ] Event detail typed
- [ ] Cancelable where appropriate (e.g., hx-close on dialog)

**Score:** _/10
**Blocking Issues:** <list or "None">
**Warnings:** <list or "None">

---

## 3. Extensibility (Weight: 1x)

### 3.1 Class Inheritance
- Base class: <HelixElement | FormMixin(HelixElement) | etc.>
- [ ] Class can be extended without errors
- [ ] No sealed/frozen patterns that prevent subclassing
- [ ] Protected methods available for override

### 3.2 Mixin Composition
- Mixins used: <list or "None">
- [ ] FormMixin applied (if form-associated)
- [ ] FocusMixin applied (if applicable)
- [ ] Mixin order is correct

### 3.3 API Surface
- [ ] Clear separation of public vs protected vs private
- [ ] Protected hooks for lifecycle customization
- [ ] No unnecessary private members that block extension

### 3.4 Registry Safety
- [ ] Uses customElements.define() safely
- [ ] No double-registration errors
- [ ] Scoped registry compatible (or path to compatibility)

**Score:** _/10
**Blocking Issues:** <list or "None">
**Warnings:** <list or "None">

---

## 4. Drupal Readiness (Weight: 2x)

### 4.1 Twig Compatibility
- [ ] Component works when rendered server-side in Twig
- [ ] Attributes pass through correctly
- [ ] No JavaScript-required initial content (progressive enhancement)
- [ ] .twig template exists (if applicable)

### 4.2 Light DOM / Shadow DOM
- Rendering mode: <Shadow DOM | Light DOM | Hybrid>
- [ ] Mode is appropriate for the component type
- [ ] Form components participate in native form submission
- [ ] Content queryable by Drupal behaviors (where needed)

### 4.3 Adopted Stylesheets
- [ ] Uses adopted-stylesheets controller (or documents why not)
- [ ] Token adoption works with document-level injection
- [ ] No style leakage

### 4.4 Form Participation
- Form-associated: <Yes (formAssociated=true) | No | N/A>
- [ ] ElementInternals used correctly
- [ ] setFormValue() called on value change
- [ ] Validation state reported via setValidity()
- [ ] Form reset handled (_onFormReset)
- [ ] Form disabled handled (_onFormDisabled)
- [ ] Form state restore handled (_onFormStateRestore)

### 4.5 Progressive Enhancement
- [ ] Meaningful content visible without JavaScript
- [ ] Server-rendered HTML is not blank/broken before hydration
- [ ] FOUC mitigated

**Score:** _/10
**Blocking Issues:** <list or "None">
**Warnings:** <list or "None">

---

## 5. Developer Experience (Weight: 1x)

### 5.1 API Consistency
- [ ] Property naming follows library conventions
- [ ] Event naming follows hx- prefix convention
- [ ] Slot naming is intuitive and documented
- [ ] Consistent with sibling components (e.g., all form fields share patterns)

### 5.2 Error Handling
- [ ] devWarn() used for dev-time guidance
- [ ] Invalid prop combinations handled gracefully
- [ ] No silent failures

### 5.3 TypeScript Types
- [ ] All public properties typed (no any)
- [ ] Event detail types exported
- [ ] Component class exported for type narrowing

### 5.4 CEM Completeness
- [ ] Component appears in custom-elements.json
- [ ] All public properties documented
- [ ] All events documented
- [ ] All slots documented
- [ ] All CSS custom properties documented
- [ ] All CSS parts documented

### 5.5 Storybook Coverage
- [ ] Story file exists
- [ ] Default story present
- [ ] All variants covered
- [ ] Controls wired for all public properties
- [ ] Docs page renders correctly

### 5.6 JSDoc Quality
- [ ] Class-level JSDoc with @summary
- [ ] All public properties have JSDoc
- [ ] All public methods have JSDoc
- [ ] @fires tags for custom events
- [ ] @slot tags for slots
- [ ] @csspart tags for parts
- [ ] @cssproperty tags for custom properties

**Score:** _/10
**Blocking Issues:** <list or "None">
**Warnings:** <list or "None">

---

## Action Items

### Blockers (must fix before 3.0.0)
1. <item>

### Warnings (should fix, can ship with tracking issue)
1. <item>

### Improvements (post-3.0.0 backlog)
1. <item>

---

## Related Issues
- <link to any filed issues>
````

---

## 2. Scoring Rubric

Scores are absolute, not curved. A 7 means the same thing on hx-button as on hx-tree-view.

### Accessibility (Weight: 3x in composite)

| Score | Grade | Criteria |
|-------|-------|----------|
| 10 | Exemplary | Zero axe violations. Full keyboard support. Screen reader tested and polished. forced-colors complete. Touch targets verified. Could be used as a reference implementation. |
| 9 | Excellent | Zero axe violations. Full keyboard. Screen reader works correctly. Minor forced-colors polish needed (cosmetic only). |
| 8 | Good | Zero critical/serious axe violations. Keyboard complete. Screen reader functional with minor announcement gaps. |
| 7 | Acceptable | Zero critical axe violations. Keyboard mostly complete (1 minor gap). Screen reader announces role and name. |
| 6 | Marginal | 1-2 serious axe violations OR keyboard navigation has a gap that requires workaround. Screen reader usable but rough. |
| 5 | Below Standard | Multiple serious axe violations OR missing keyboard pattern for a composite widget. Screen reader missing state announcements. |
| 4 | Poor | Critical axe violation (e.g., missing label, no role). Keyboard partially broken. Screen reader confusing. |
| 3 | Failing | Multiple critical violations. Major keyboard gaps. Screen reader unusable for core task. |
| 2 | Broken | Component is not keyboard accessible. No ARIA roles. axe flags critical on every test. |
| 1 | Absent | No accessibility consideration at all. Div soup. |

### Flexibility (Weight: 2x in composite)

| Score | Grade | Criteria |
|-------|-------|----------|
| 10 | Exemplary | Full token coverage. All internal elements exposed via ::part(). Rich slot architecture. Complete property/event API. Consumer can achieve any reasonable customization without forking. |
| 9 | Excellent | Near-complete token coverage. Key parts exposed. Good slots. Minor gap (e.g., one missing token). |
| 8 | Good | Strong token coverage (>80% of visual properties). Primary parts exposed. Slots adequate. |
| 7 | Acceptable | Core visual properties tokenized. At least 1 part exposed. Default slot works. Events cover primary interactions. |
| 6 | Marginal | Some tokens present but gaps in spacing or color. Parts missing for commonly styled elements. |
| 5 | Below Standard | Tokens exist but incomplete (<50% visual coverage). No parts. Minimal slot support. |
| 4 | Poor | Few tokens. No parts. Slot architecture missing or broken. |
| 3 | Failing | Hardcoded values dominate. No customization path without forking. |
| 2 | Broken | Completely hardcoded. No tokens, no parts, no slots. |
| 1 | Absent | No consideration for consumer customization. |

### Extensibility (Weight: 1x in composite)

| Score | Grade | Criteria |
|-------|-------|----------|
| 10 | Exemplary | Clean class hierarchy. Documented protected hooks. Mixin-ready. Registry-safe. Static configuration points for subclasses. |
| 9 | Excellent | Extends cleanly. Protected methods available. Registry-safe. Minor doc gap. |
| 8 | Good | Can be extended. Key lifecycle hooks protected. No double-registration issues. |
| 7 | Acceptable | Extension works. Some protected API. Registry safety handled. |
| 6 | Marginal | Extension possible but fragile (relies on private internals). |
| 5 | Below Standard | Extension requires workarounds. Private members block common extension patterns. |
| 4 | Poor | Difficult to extend. Most internals private with no protected alternatives. |
| 3 | Failing | Extension breaks the component. |
| 2 | Broken | Cannot be extended at all. |
| 1 | Absent | Sealed or monolithic with no extension points. |

### Drupal Readiness (Weight: 2x in composite)

| Score | Grade | Criteria |
|-------|-------|----------|
| 10 | Exemplary | Works in Twig templates. Progressive enhancement complete. Form participation verified. Adopted stylesheets integrated. .twig template provided. |
| 9 | Excellent | Twig compatible. Form participation correct. Adopted stylesheets work. No .twig template but not needed. |
| 8 | Good | Works in server-rendered HTML. Form participation correct (if applicable). Minor progressive enhancement gap. |
| 7 | Acceptable | Renders correctly in Twig. Core functionality works without JS-dependent initial state. |
| 6 | Marginal | Works in Twig but requires JS for meaningful content. Form participation incomplete. |
| 5 | Below Standard | Requires JavaScript for any visible content. Form participation broken or missing. |
| 4 | Poor | Breaks in server-rendered contexts. Form values not submitted. |
| 3 | Failing | Incompatible with Twig rendering. |
| 2 | Broken | Component fails entirely outside SPA context. |
| 1 | Absent | No consideration for server-side rendering or CMS integration. |

### Developer Experience (Weight: 1x in composite)

| Score | Grade | Criteria |
|-------|-------|----------|
| 10 | Exemplary | Perfect API consistency. Full CEM coverage. Complete Storybook stories with controls. Comprehensive JSDoc. devWarn() for all misuse patterns. Exported types complete. |
| 9 | Excellent | Consistent API. CEM complete. Stories cover all variants. JSDoc thorough. Minor gap (e.g., one missing @cssproperty tag). |
| 8 | Good | API consistent. CEM mostly complete. Stories exist with controls. JSDoc covers public API. |
| 7 | Acceptable | API follows conventions. CEM has the component. Default story exists. JSDoc on class and key properties. |
| 6 | Marginal | Minor API inconsistencies. CEM missing some entries. Story exists but incomplete controls. |
| 5 | Below Standard | API naming inconsistent with library. CEM gaps. Story minimal. JSDoc sparse. |
| 4 | Poor | API confusing. CEM inaccurate. No story or broken story. |
| 3 | Failing | API contradicts library conventions. No CEM entry. |
| 2 | Broken | Unusable API. No documentation of any kind. |
| 1 | Absent | No consideration for developer experience. |

### Composite Score Calculation

```
composite = (a11y * 3 + flexibility * 2 + extensibility * 1 + drupal * 2 + dx * 1) / 9
```

Weights reflect the priorities: accessibility is 3x because of the healthcare mandate, flexibility and Drupal readiness are 2x because they drive adoption, extensibility and DX are 1x as they affect long-term maintenance.

### Grade Mapping

| Score Range | Grade | Meaning |
|-------------|-------|---------|
| 9.0 - 10.0 | A | Exemplary. Reference implementation. |
| 8.0 - 8.9 | B | Production ready. Minor polish items only. |
| 7.0 - 7.9 | C | Acceptable for release. Known gaps tracked. |
| 5.0 - 6.9 | D | Below standard. Requires remediation plan. |
| 3.0 - 4.9 | F | Failing. Must fix before release. |
| 1.0 - 2.9 | X | Broken. Critical defects. |

---

## 3. Component Tier List

### Tier 1 -- Critical Path (23 components)

These are the components consumers interact with first, appear in every project, or handle sensitive healthcare data. Audit FIRST.

**Form Controls (13)** -- The backbone of every healthcare application:
| Component | Notes |
|-----------|-------|
| hx-button | Primary CTA. formAssociated. |
| hx-text-input | Most used form field. FormMixin + FocusMixin. |
| hx-textarea | Multi-line input. formAssociated. |
| hx-select | Dropdown. formAssociated. Known issue #1426. |
| hx-checkbox | Toggle. FormMixin + aria-delegation. |
| hx-checkbox-group | Group container. formAssociated. |
| hx-radio-group | Selection group. formAssociated. |
| hx-switch | Toggle control. formAssociated. |
| hx-combobox | Autocomplete. formAssociated. Complex ARIA. |
| hx-date-picker | Date entry. formAssociated. Complex ARIA. |
| hx-time-picker | Time entry. formAssociated. Complex ARIA. |
| hx-number-input | Numeric. formAssociated. |
| hx-form | Form wrapper. Light DOM rendering. |

**Layout and Navigation (5)** -- Structural components in every app:
| Component | Notes |
|-----------|-------|
| hx-dialog | Modal. Focus trap critical. |
| hx-drawer | Side panel. Focus trap. |
| hx-tabs | Tab pattern. Complex ARIA. |
| hx-nav | Primary navigation. |
| hx-top-nav | App header navigation. |

**Feedback (3)** -- User communication:
| Component | Notes |
|-----------|-------|
| hx-alert | Status messages. Live regions. |
| hx-toast | Notifications. Live regions + auto-dismiss. |
| hx-spinner | Loading state. aria-live. |

**Healthcare-Specific (2)**:
| Component | Notes |
|-----------|-------|
| hx-patient-banner | PHI display. Highest compliance bar. |
| hx-clinical-status | Clinical status indicator. |

### Tier 2 -- Core Library (35 components)

Standard components that complete the library. Audit after Tier 1 is done.

**Interactive Controls (10)**:
| Component | Notes |
|-----------|-------|
| hx-icon-button | Button variant. formAssociated. |
| hx-toggle-button | Toggle. formAssociated. |
| hx-split-button | Compound button. |
| hx-button-group | Group container. Known issue #1441. |
| hx-dropdown | Popup menu trigger. |
| hx-menu | Menu widget. Complex ARIA. |
| hx-overflow-menu | Responsive menu. |
| hx-popover | Popup content. |
| hx-tooltip | Tooltip. ARIA-described. |
| hx-link | Anchor wrapper. |

**Data Display (8)**:
| Component | Notes |
|-----------|-------|
| hx-data-table | Table. Complex keyboard. |
| hx-table | Simple table. |
| hx-structured-list | List layout. Known issue #1441. |
| hx-list | List container. Known issue #1441. |
| hx-card | Content container. |
| hx-stat | Metric display. |
| hx-badge | Count/label indicator. |
| hx-tag | Categorization label. |

**Form Support (5)**:
| Component | Notes |
|-----------|-------|
| hx-field | Form field wrapper. |
| hx-field-label | Label component. |
| hx-help-text | Hint/error text. |
| hx-slider | Range input. formAssociated. |
| hx-file-upload | File input. formAssociated. |

**Navigation (4)**:
| Component | Notes |
|-----------|-------|
| hx-breadcrumb | Breadcrumb nav. |
| hx-side-nav | Sidebar navigation. |
| hx-pagination | Page navigation. |
| hx-steps | Multi-step indicator. |

**Feedback/Status (4)**:
| Component | Notes |
|-----------|-------|
| hx-banner | Page-level message. |
| hx-progress-bar | Progress indicator. |
| hx-progress-ring | Circular progress. |
| hx-status-indicator | Status dot/label. |

**Content (4)**:
| Component | Notes |
|-----------|-------|
| hx-accordion | Expandable sections. |
| hx-icon | Icon rendering. |
| hx-image | Image with fallback. |
| hx-avatar | User representation. |

### Tier 3 -- Specialized (23 components)

Niche, internal, or utility components. Audit last.

**Utility/Infrastructure (8)**:
| Component | Notes |
|-----------|-------|
| hx-theme | Token provider. |
| hx-style-scope | Style scoping wrapper. |
| hx-container | Layout container. |
| hx-grid | CSS grid wrapper. |
| hx-stack | Flex stack layout. |
| hx-divider | Visual separator. |
| hx-visually-hidden | SR-only content. |
| hx-popup | Positioning primitive. |

**Specialized Input (4)**:
| Component | Notes |
|-----------|-------|
| hx-color-picker | Color selection. formAssociated. |
| hx-rating | Star rating. formAssociated. |
| hx-phi-field | PHI-masked input. |
| hx-copy-button | Clipboard action. |

**Specialized Display (6)**:
| Component | Notes |
|-----------|-------|
| hx-code-snippet | Code display. |
| hx-prose | Rich text container. |
| hx-text | Typography wrapper. |
| hx-meter | Gauge display. |
| hx-counter | Animated number. |
| hx-format-date | Date formatting. |

**Complex Widgets (3)**:
| Component | Notes |
|-----------|-------|
| hx-carousel | Content slider. |
| hx-split-panel | Resizable panels. |
| hx-tree-view | Tree widget. Complex ARIA. |

**Layout/Action (2)**:
| Component | Notes |
|-----------|-------|
| hx-action-bar | Contextual actions bar. |
| hx-skeleton | Loading placeholder. |

---

## 4. Execution Strategy

### Agent Assignment Per Dimension

| Dimension | Primary Agent | Backup Agent |
|-----------|--------------|--------------|
| Accessibility | `accessibility-engineer` | `qa-engineer` |
| Flexibility | `design-system-developer` | `frontend-specialist` |
| Extensibility | `staff-engineer-platform` | `senior-frontend-engineer` |
| Drupal Readiness | `drupal-specialist` | `senior-backend-engineer` |
| Developer Experience | `qa-engineer` | `frontend-specialist` |

### Parallelism Model

**Within a single component:** Dimensions 1-5 CAN run in parallel. Each dimension reads the component source but does not modify it. Each agent writes to its own section of the AUDIT.md. However, to avoid file conflicts:

- **Option A (Recommended): Sequential per component, parallel across components.**
  - One agent audits all 5 dimensions for a single component, writing the complete AUDIT.md.
  - Multiple components can be audited simultaneously (up to concurrency limit).
  - Simplest coordination. No merge conflicts on AUDIT.md.

- **Option B: Parallel dimensions, sequential assembly.**
  - 5 agents each audit their dimension across a batch of components.
  - A coordinator assembles the per-dimension results into the final AUDIT.md.
  - Higher throughput but requires assembly step and consistent scoring.

**Recommendation: Option A.** Use the `accessibility-engineer` as the primary auditor for Tier 1 components (a11y is the dominant concern). Use a generalist agent (route through orchestrator) for Tier 2 and Tier 3.

### Batch Schedule

| Phase | Components | Count | Agent Concurrency | Est. Time per Component |
|-------|-----------|-------|-------------------|------------------------|
| Phase 1 | Tier 1: Form Controls | 13 | 2 agents | 15-20 min each |
| Phase 2 | Tier 1: Layout + Nav + Feedback + Healthcare | 10 | 2 agents | 15-20 min each |
| Phase 3 | Tier 2: Interactive + Data Display | 18 | 2 agents | 10-15 min each |
| Phase 4 | Tier 2: Remaining | 17 | 2 agents | 10-15 min each |
| Phase 5 | Tier 3: All | 23 | 2 agents | 8-12 min each |

**Total estimated time:** ~20-25 hours of agent compute, ~10-12 hours wall clock at concurrency 2.

### Execution Order Within Phases

Within each phase, order by complexity (most complex first, so blockers surface early):

**Phase 1 order:** hx-combobox, hx-date-picker, hx-time-picker, hx-select, hx-text-input, hx-textarea, hx-number-input, hx-checkbox, hx-checkbox-group, hx-radio-group, hx-switch, hx-button, hx-form

**Phase 2 order:** hx-dialog, hx-drawer, hx-tabs, hx-nav, hx-top-nav, hx-alert, hx-toast, hx-spinner, hx-patient-banner, hx-clinical-status

### Audit Agent Instructions (per component)

Each agent invocation receives:
1. This plan document (for rubric and template)
2. The component source files (*.ts, *.styles.ts, *.stories.ts, *.test.ts)
3. The component's CEM entry from custom-elements.json
4. The known issues list (section 6) to reference, not re-discover

The agent must:
1. Read all source files for the component
2. Evaluate each of the 5 dimensions against the rubric
3. Fill in the AUDIT.md template with specific findings, not generalities
4. Compute scores per dimension and the weighted composite
5. Render a SHIP / SHIP-WITH-WARNINGS / BLOCK decision
6. List concrete action items categorized as Blockers / Warnings / Improvements

### Quality Control

After each phase completes:
1. **Score distribution check** -- If >50% of components score identically on any dimension, the auditor is likely not differentiating. Re-audit a sample.
2. **Known-issue cross-reference** -- Verify that components affected by known issues (#1441, #1424, etc.) have those issues reflected in their scores.
3. **Composite threshold check** -- Flag any Tier 1 component with composite < 7.0 for immediate attention.

---

## 5. Ship/No-Ship Criteria

### Per-Component Decision

| Composite Score | Decision | Action |
|----------------|----------|--------|
| >= 7.0 | SHIP | Component is production ready. |
| 5.0 - 6.9 | SHIP-WITH-WARNINGS | Ship but file tracking issues for every Warning-level finding. Publicly document known limitations. |
| < 5.0 | BLOCK | Component must not ship in 3.0.0 until score reaches 5.0+. |

### Per-Dimension Overrides (regardless of composite)

These override the composite score:

| Condition | Decision | Rationale |
|-----------|----------|-----------|
| Accessibility < 5 on ANY Tier 1 component | BLOCK | Healthcare mandate. Non-negotiable. |
| Accessibility < 4 on ANY component | BLOCK | Liability risk. |
| Drupal Readiness < 4 on ANY form component | BLOCK | Primary consumer cannot use it. |
| Flexibility < 3 on ANY Tier 1 component | BLOCK | Consumers cannot customize core components. |

### Release-Level Decision

The 3.0.0 release ships when:

1. **Zero BLOCK decisions** across all 81 components (or blocked components are excluded from the release with clear documentation).
2. **All Tier 1 components score composite >= 7.0.**
3. **All Tier 1 components score Accessibility >= 7.**
4. **No unresolved P1 issues** from the known issues list.
5. **All SHIP-WITH-WARNINGS components** have tracking issues filed in GitHub.

### Exclusion Policy

If a component cannot reach the minimum threshold in time:
1. Remove it from the 3.0.0 public API (unexport from index.ts).
2. Mark it as `@alpha` or `@experimental` in JSDoc.
3. Document the exclusion in the release notes.
4. File an issue for the 3.1.0 release.

---

## 6. Known Issues Reference

These are already ticketed. Auditors should REFERENCE them in the relevant component audit, not re-discover or re-file them.

| Issue | Priority | Components Affected | Dimension |
|-------|----------|-------------------|-----------|
| #1441 | P1 | hx-button-group, hx-structured-list, hx-tbody, hx-list | Flexibility (::slotted() fragility) |
| #1424 | P2 | 9 components (TBD which) | Accessibility (forced-colors) |
| #1426 | P2 | hx-select | Extensibility / Drupal (FormMixin lifecycle) |
| #1425 | P2 | Multiple | DX (minified CSS readability) |
| #1427 | P2 | Multiple | Extensibility (missing PropertyValues param) |
| #1428 | P2 | Multiple | DX (use `nothing` vs empty string) |
| #1436 | P2 | Multiple | Accessibility (touch target enforcement) |

---

## 7. Questions for Principal Engineer

These need answers before Phase 1 execution begins:

1. **Extensibility evaluation in Lit 3.x:** What constitutes a "correct" extension pattern? Specifically: should we test that every component can be subclassed and re-registered with a new tag name? Or is mixin composition the expected extension path?

2. **ARIA pattern correctness:** For compound widgets (combobox, date-picker, tree-view), should we audit against the current APG 1.2 patterns or the emerging 1.3 drafts?

3. **Shadow DOM trade-offs for form components:** The hx-form uses light DOM rendering. Should other form components (hx-field, hx-field-label, hx-help-text) also consider light DOM for Drupal compatibility?

4. **Performance implications of audit recommendations:** If we identify that a component needs additional ARIA attributes or DOM structure for accessibility, what is the acceptable performance budget impact? Should we establish a per-component re-render budget?

5. **adopted-stylesheets controller:** Is it expected that ALL 81 components integrate the adopted-stylesheets controller, or only those that render visible UI (excluding utility components like hx-visually-hidden, hx-format-date)?

---

## Appendix: Component Inventory (81)

For reference, the complete list with form association status:

**Form-Associated (formAssociated=true):** hx-button, hx-checkbox, hx-checkbox-group, hx-color-picker, hx-combobox, hx-date-picker, hx-file-upload, hx-icon-button, hx-number-input, hx-radio-group, hx-rating, hx-select, hx-slider, hx-switch, hx-text-input, hx-textarea, hx-time-picker, hx-toggle-button (18 total)

**Non-Form (63):** hx-accordion, hx-action-bar, hx-alert, hx-avatar, hx-badge, hx-banner, hx-breadcrumb, hx-button-group, hx-card, hx-carousel, hx-clinical-status, hx-code-snippet, hx-container, hx-copy-button, hx-counter, hx-data-table, hx-dialog, hx-divider, hx-drawer, hx-dropdown, hx-field, hx-field-label, hx-form, hx-format-date, hx-grid, hx-help-text, hx-icon, hx-image, hx-link, hx-list, hx-menu, hx-meter, hx-nav, hx-number-input (duplicate check needed), hx-overflow-menu, hx-pagination, hx-patient-banner, hx-phi-field, hx-popover, hx-popup, hx-progress-bar, hx-progress-ring, hx-prose, hx-side-nav, hx-skeleton, hx-spinner, hx-split-button, hx-split-panel, hx-stack, hx-stat, hx-status-indicator, hx-steps, hx-structured-list, hx-style-scope, hx-table, hx-tabs, hx-tag, hx-text, hx-theme, hx-toast, hx-top-nav, hx-tree-view, hx-visually-hidden
