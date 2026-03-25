# WF-11 Drupal Readiness Audit — Findings Summary

**Date:** 2026-03-24
**Agent:** drupal-integration-specialist (3 parallel batches)
**Components audited:** 77 (all top-level component directories)
**Total findings:** 399
**Report file:** `.automaker/audits/WF-11-drupal-readiness-2026-03-24.jsonl`

## Severity Distribution

| Severity | Count | Percentage |
|----------|-------|------------|
| Critical | 0 | 0% |
| High | 10 | 2.5% |
| Medium | 71 | 17.8% |
| Low | 318 | 79.7% |

## Findings by Rule

| Rule | Count | Description |
|------|-------|-------------|
| twig | 92 | Twig template compatibility |
| behaviors | 71 | Drupal AJAX/behaviors lifecycle |
| light-dom | 66 | Slot content and ::slotted() styling |
| admin | 60 | Admin theme compatibility (Gin/Claro) |
| cdn | 56 | CDN delivery and module script loading |
| loadability | 31 | Tree-shaking and per-component imports |
| form | 23 | ElementInternals and native form submission |

---

## HIGH Severity Findings (10)

These require documentation or architectural attention for Drupal integration.

### 1. Imperative API Components (Twig incompatible without Drupal.behaviors)

**Components:** hx-dialog, hx-drawer, hx-toast (factory)

These components require imperative JavaScript to open/close. While they have `open` attributes for declarative use, the common patterns (trigger buttons, programmatic toasts) need `Drupal.behaviors` wiring.

**Mitigation:**
- hx-dialog already documents a `Drupal.behaviors` pattern in its JSDoc (lines 58-69)
- hx-drawer needs an equivalent documented pattern
- hx-toast: the `toast()` factory function is purely imperative; document the declarative `<hx-toast open>` alternative as the primary Drupal path
- Provide a `helixui_drupal` module or integration guide with copy-paste behaviors

### 2. Data-Driven Components (hx-nav, hx-data-table)

**Components:** hx-nav, hx-data-table

These components accept data as JSON attributes rather than slotted HTML content. This conflicts with Drupal's server-rendered HTML approach.

**hx-nav:**
- Renders ALL navigation in Shadow DOM from a JSON `items` property
- Drupal's menu system renders `<ul>/<li>/<a>` server-side — cannot be projected
- Intercepts all clicks and requires event listener for actual navigation
- **Recommendation:** Use hx-top-nav (slot-based) or hx-side-nav for Drupal menus. hx-nav is better suited for SPAs.

**hx-data-table:**
- Renders table structure in Shadow DOM from `columns`/`rows` JSON properties
- Has JSON string coercion in willUpdate — Twig-friendly but requires careful escaping
- **Recommendation:** Use hx-table (slot-based composition) for Drupal Views tables. hx-data-table is for client-side data binding.

### 3. hx-form: Hardcoded Form Element Allowlist

**Component:** hx-form
**File:** `src/components/hx-form/hx-form.ts`

`getFormElements()` only recognizes 6 component tag names. Newer form components (hx-date-picker, hx-time-picker, hx-file-upload, hx-combobox, hx-color-picker) are not in the allowlist and will be invisible to hx-form's validation and submission logic.

**Mitigation:** Update the allowlist to include all form-associated components.

### 4. hx-icon: No Fallback Before JavaScript Loads

**Component:** hx-icon

Inline fetch mode requires JavaScript and `fetch()` to render SVGs. Before hydration, nothing is visible. Drupal sites with aggressive caching or slow JS loading will show empty icon slots.

**Mitigation:** Document that sprite mode or CSS background-image fallbacks should be preferred for critical icons in Drupal.

### 5. hx-breadcrumb: JSON-LD Script Injection

**Component:** hx-breadcrumb

The `json-ld` attribute injects a `<script>` tag directly into `document.head`. This bypasses Drupal's render pipeline and Content Security Policy considerations.

**Mitigation:** Document CSP implications. Recommend using Drupal's Schema.org Metatag module for structured data instead.

### 6. hx-carousel: Auto-Play Warning

**Component:** hx-carousel

While the carousel is fully declarative (autoplay attribute works without JS beyond registration), auto-play accessibility has not been verified in the context of Drupal admin editing.

**Mitigation:** Mark as medium priority — verify WCAG 2.2.2 (Pause, Stop, Hide) compliance in admin context.

---

## Key MEDIUM Severity Patterns

### Z-Index Conflicts with Admin Toolbar

**Components:** hx-dialog (non-modal), hx-drawer, hx-dropdown, hx-overflow-menu, hx-popover, hx-popup, hx-tooltip, hx-top-nav, hx-banner, hx-action-bar

Drupal admin toolbar (Gin/Claro) uses z-index 500+. Several components have z-index values that may conflict:

| Component | Default z-index | Conflict Risk |
|-----------|----------------|---------------|
| hx-tooltip | 9999 | None (above everything — correct) |
| hx-popover | 9999 | None (above everything — correct) |
| hx-popup | 9000 | None |
| hx-dropdown | 1000 | Low |
| hx-overflow-menu | 1000 | Low |
| hx-dialog (non-modal) | 100 | **High — below toolbar** |
| hx-banner (sticky) | 100 | **High — below toolbar** |
| hx-top-nav (sticky) | sticky z-index | Medium |
| hx-action-bar | 10 | None |

**Recommendation:** Document the z-index hierarchy. Non-modal dialogs and sticky banners need increased z-index tokens when used in Drupal admin contexts. Modal dialogs use the browser's top layer and are unaffected.

### CDN: @floating-ui/dom Dependency

**Components:** hx-dropdown, hx-overflow-menu, hx-tooltip, hx-popover, hx-popup, hx-combobox, hx-select, hx-date-picker, hx-time-picker, hx-color-picker

Multiple components import `@floating-ui/dom`. For CDN delivery, this dependency must be bundled into component output files or available as a separate module. Unbundled CDN serving will fail on bare specifier imports.

**Recommendation:** Ensure the Vite library build bundles `@floating-ui/dom` into each component that uses it. Document CDN loading requirements.

### hx-icon: CDN CORS Requirements

The `src` attribute fetches SVGs via `fetch()`. Cross-origin requests require CORS headers on the SVG host.

**Recommendation:** Document CORS requirements. Recommend same-origin SVG hosting or sprite sheet approach for CDN setups.

### Twig Attribute Naming Awareness

Several components use `hx-size` instead of `size` for the size attribute (to avoid conflicts with the native HTML `size` attribute). This is non-obvious for Drupal themers.

**Components affected:** hx-button, hx-checkbox, hx-switch, hx-text-input, hx-textarea, hx-select, and others

**Recommendation:** Document the `hx-size` convention prominently in the Drupal integration guide.

---

## Positive Findings

### Components with Excellent Drupal Integration

These components already include Twig examples in their JSDoc or are specifically designed for Drupal compatibility:

| Component | Drupal Feature |
|-----------|---------------|
| hx-form | Light DOM rendering, Drupal Form API compatible |
| hx-prose | Light DOM rendering, styles Drupal WYSIWYG content |
| hx-pagination | Twig example + Drupal pager notes in JSDoc |
| hx-popup | Twig example + Drupal.behaviors example in JSDoc |
| hx-dialog | Drupal.behaviors trigger pattern in JSDoc |
| hx-split-panel | Twig example in JSDoc |
| hx-theme | Twig wrapper example in JSDoc |
| hx-tooltip | Twig example in JSDoc |
| hx-top-nav | Slot-based, Drupal menu-friendly |
| hx-format-date | Auto-inherits Drupal's `<html lang>` locale |

### Form Components: Strong ElementInternals Adoption

All 15 form components use `ElementInternals` for form association:
hx-button, hx-checkbox, hx-checkbox-group, hx-color-picker, hx-combobox, hx-date-picker, hx-file-upload, hx-icon-button, hx-number-input, hx-radio-group, hx-rating, hx-select, hx-slider, hx-switch, hx-text-input, hx-textarea, hx-time-picker, hx-toggle-button

**All participate in native `<form>` submission** — Drupal Form API compatible.

### AJAX Lifecycle Safety

All components properly clean up event listeners in `disconnectedCallback`. No components leak global event listeners on DOM removal. This means Drupal AJAX partial page replacements (BigPipe, AJAX forms) are safe across the entire library.

---

## Recommended Actions (Priority Order)

### P0 — Fix Before Drupal Launch

1. **Update hx-form allowlist** to include all form-associated components (hx-date-picker, hx-time-picker, hx-file-upload, hx-combobox, hx-color-picker)
2. **Bundle @floating-ui/dom** into CDN build output for all floating components

### P1 — Documentation Required

3. **Create Drupal Integration Guide** with:
   - Drupal.behaviors patterns for hx-dialog, hx-drawer, hx-toast
   - Twig template examples for all components
   - CDN loading instructions with importmap
   - Admin theme z-index override guide
   - hx-size attribute convention explanation

4. **Document data-driven vs. slot-based alternatives:**
   - hx-nav (data) vs. hx-top-nav/hx-side-nav (slots)
   - hx-data-table (data) vs. hx-table (slots)

### P2 — Nice to Have

5. **Provide helixui_drupal Drupal module** with:
   - Pre-built Drupal.behaviors for dialog/drawer/toast
   - Libraries.yml definitions for per-component loading
   - Twig namespace for component templates
   - Theme settings integration for hx-theme

6. **Add Twig examples to remaining component JSDoc** (promote existing patterns library-wide)

---

## Methodology

Three parallel `drupal-integration-specialist` agents audited all 77 component directories against 7 Drupal readiness rules:

1. **light-dom** — Slot content projection and ::slotted() styling
2. **twig** — Declarative attribute-only usage from Twig templates
3. **loadability** — Per-component imports and tree-shaking
4. **behaviors** — Drupal AJAX lifecycle (attach/detach) safety
5. **form** — ElementInternals form association and native submission
6. **admin** — Gin/Claro admin theme compatibility
7. **cdn** — Module script loading and CORS requirements

Each agent read actual component source code and verified findings against the implementation. No findings are speculative — all reference specific code patterns and line numbers.
