# HELiX Naming Convention — Approved Standard

**Status: APPROVED (WF-06 CTO decision)**
**Date: 2026-03-24**

This document records the naming conventions approved for HELiX component APIs. All conventions
are derived from the dominant patterns already in use across the 98-component library.

---

## JavaScript Property Names

### No `hx-` prefix on JS property names

The `hx-` prefix belongs on HTML **attribute** names only, not on JavaScript property names.
JavaScript property names use bare, idiomatic names.

| Wrong | Correct | Notes |
|-------|---------|-------|
| `hxHref` (property) | `href` (property), `hx-href` (attribute) | Avoids collision with native `href` via `hx-href` attribute |
| `hxAriaLabel` (property) | `ariaLabel` (property), `hx-aria-label` (attribute) | Matches pattern on hx-button, hx-combobox, hx-select |
| `hxSize` (property) | `size` (property), `hx-size` (attribute) | Matches all 31 other components with `size` |

**Affected components (WF-06 fixes):**
- `hx-card`: `hxHref` → `href`, `hxAriaLabel` → `ariaLabel`
- `hx-field`: `hxSize` → `size`

---

## Label Property Naming

### Pattern: `label` + `Subject` (labelX)

The dominant pattern in the library (28 uses) is **label-first**: `labelX`.

| Wrong (xLabel) | Correct (labelX) | Component |
|----------------|------------------|-----------|
| `closeLabel` | `labelClose` | hx-banner, hx-dialog, hx-drawer, hx-toast |
| `triggerLabel` | `labelTrigger` | hx-split-button |
| `menuLabel` | `labelMenu` | hx-split-button, hx-overflow-menu |

**Existing labelX examples (authoritative):**
`labelCopy`, `labelPrevSlide`, `labelNextSlide`, `labelDropzone`, `labelTrigger` (hx-color-picker)

---

## CSS Part Names

### No abbreviations

CSS part names use full words, no abbreviations.

| Wrong | Correct |
|-------|---------|
| `close-btn` | `close-button` |
| `prev-btn` | `prev-button` |
| `next-btn` | `next-button` |

**Affected components (WF-06 fixes):**
- `hx-drawer`: `close-btn` → `close-button`
- `hx-carousel`: `prev-btn` → `prev-button`, `next-btn` → `next-button`

---

## CSS Custom Property Prefixes

### Component-scoped prefix

CSS custom properties must use the full component tag name as prefix.

| Wrong | Correct | Component |
|-------|---------|-----------|
| `--hx-accordion-*` | `--hx-accordion-item-*` | hx-accordion-item |
| `--hx-tabs-panel-padding` | `--hx-tab-panel-padding` | hx-tab-panel |
| `--hx-input-bg` | `--hx-text-input-bg` | hx-text-input |

---

## @internal Markers

### Browser API surface that is not part of the public HELiX API

The following members must be annotated with `/** @internal */` to prevent CEM leakage:

1. `static formAssociated = true` — Required by ElementInternals, not a user-facing API
2. `formDisabledCallback()` — Browser lifecycle, not public API
3. `formResetCallback()` — Browser lifecycle, not public API
4. `formStateRestoreCallback()` — Browser lifecycle, not public API
5. Private class fields and methods (prefix `_` or declared `private`)
6. `static override shadowRootOptions` — Framework implementation detail

---

## Breaking Changes in WF-06

All property renames below are **breaking changes** requiring a `major` changeset bump.
Consumers must update their code when upgrading.

| Component | Old Name | New Name | Type |
|-----------|----------|----------|------|
| hx-card | `hxHref` | `href` | property |
| hx-card | `hxAriaLabel` | `ariaLabel` | property |
| hx-field | `hxSize` | `size` | property |
| hx-banner | `closeLabel` | `labelClose` | property |
| hx-dialog | `closeLabel` | `labelClose` | property |
| hx-drawer | `closeLabel` | `labelClose` | property |
| hx-toast | `closeLabel` | `labelClose` | property |
| hx-split-button | `triggerLabel` | `labelTrigger` | property |
| hx-split-button | `menuLabel` | `labelMenu` | property |
| hx-overflow-menu | `menuLabel` | `labelMenu` | property |
| hx-drawer | `close-btn` (CSS part) | `close-button` | CSS part |
| hx-carousel | `prev-btn` (CSS part) | `prev-button` | CSS part |
| hx-carousel | `next-btn` (CSS part) | `next-button` | CSS part |
