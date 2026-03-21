# v2.0 Breaking Change Remediation Roadmap

**Source:** API Consistency Audit (2026-03-20)
**Scope:** All breaking changes identified across 77 HELiX components
**Strategy:** Deprecate in v1.x with compatibility layers, remove in v2.0

---

## Executive Summary

The API consistency audit identified **6 breaking-change patterns** affecting **35+ components**. All changes follow a deprecation-first strategy:

1. **v1.x (now):** Add deprecation warnings and compatibility layers. New APIs available immediately.
2. **v1.x final:** All consumer-facing documentation uses new API names.
3. **v2.0:** Remove deprecated APIs. Clean break.

| Pattern | Severity | Components | Breaking in v2.0 |
|---|---|---|---|
| Size attribute standardization | Critical | 15 | Yes |
| type -> variant rename | High | 2 | Yes |
| Card property naming | High | 1 | Yes |
| Field property naming | High | 1 | Yes |
| Boolean default changes | Medium | 4 | Yes |
| Dialog event rename | Medium | 1 | Yes |

---

## Breaking Change 1: Size Attribute Standardization

**Impact:** 15 components change from `size="md"` to `hx-size="md"`

### Components

hx-action-bar, hx-badge, hx-color-picker, hx-container, hx-counter, hx-drawer, hx-progress-ring, hx-prose, hx-rating, hx-spinner, hx-stat, hx-status-indicator, hx-steps, hx-time-picker, hx-tooltip

### v1.x Deprecation Layer

```typescript
// Add to each affected component
static get observedAttributes() {
  return [...super.observedAttributes, 'size'];
}

attributeChangedCallback(name: string, old: string, value: string) {
  if (name === 'size' && !this.hasAttribute('hx-size')) {
    console.warn(
      `[${this.tagName.toLowerCase()}] The "size" attribute is deprecated. Use "hx-size" instead. ` +
      `This will be removed in v2.0.`
    );
    this.size = value as any;
    return;
  }
  super.attributeChangedCallback(name, old, value);
}
```

### v2.0 Removal

Remove the `attributeChangedCallback` override. Only `hx-size` attribute works.

### Consumer Migration

```html
<!-- Before -->
<hx-badge size="sm">New</hx-badge>
<hx-spinner size="lg"></hx-spinner>

<!-- After -->
<hx-badge hx-size="sm">New</hx-badge>
<hx-spinner hx-size="lg"></hx-spinner>
```

**JavaScript property access is unchanged:** `element.size = 'sm'` works in both v1 and v2.

---

## Breaking Change 2: type -> variant Rename

**Impact:** 2 sub-components

### Components

- hx-list-item: `type` -> `variant`
- hx-menu-item: `type` -> `variant`

### v1.x Deprecation Layer

```typescript
// Add to hx-list-item and hx-menu-item
@property({ type: String, reflect: true })
variant = 'default';

// Deprecated: keep 'type' working
@property({ type: String, reflect: true })
set type(val: string) {
  console.warn(
    `[${this.tagName.toLowerCase()}] The "type" property is deprecated for visual styling. ` +
    `Use "variant" instead. This will be removed in v2.0.`
  );
  this.variant = val;
}
get type() { return this.variant; }
```

### Consumer Migration

```html
<!-- Before -->
<hx-list-item type="danger">Delete</hx-list-item>
<hx-menu-item type="danger">Remove</hx-menu-item>

<!-- After -->
<hx-list-item variant="danger">Delete</hx-list-item>
<hx-menu-item variant="danger">Remove</hx-menu-item>
```

---

## Breaking Change 3: Card Property Naming

**Impact:** 1 component (hx-card)

### Changes

| Before | After |
|---|---|
| `hxHref` / `hx-href` | `href` / `href` |
| `hxAriaLabel` / `hx-aria-label` | `ariaLabel` / `aria-label` |

### v1.x Deprecation Layer

Add `hxHref` and `hxAriaLabel` as deprecated getters/setters that proxy to `href` and `ariaLabel`.

### Consumer Migration

```html
<!-- Before -->
<hx-card hx-href="/details" hx-aria-label="View details">

<!-- After -->
<hx-card href="/details" aria-label="View details">
```

---

## Breaking Change 4: Field Property Naming

**Impact:** 1 component (hx-field)

### Change

Property name changes from `hxSize` to `size`. Attribute stays `hx-size`.

```typescript
// Before
@property({ type: String, reflect: true, attribute: 'hx-size' })
hxSize = 'md';

// After
@property({ type: String, reflect: true, attribute: 'hx-size' })
size = 'md';
```

### Consumer Migration

```javascript
// Before
field.hxSize = 'lg';

// After
field.size = 'lg';
```

HTML attribute is unchanged: `<hx-field hx-size="lg">` works in both versions.

---

## Breaking Change 5: Boolean Default Changes

**Impact:** 4 components

| Component | Property | v1.x Default | v2.0 Default |
|---|---|---|---|
| hx-banner | `open` | `true` | `false` |
| hx-table | `fullWidth` | `true` | `false` |
| hx-code-snippet | `copyable` | `true` | `false` |
| hx-rating | `interactive` | `true` | `false` |

### v1.x Deprecation Layer

No code change in v1.x. Document the upcoming default change prominently in:
- Storybook story descriptions
- Migration guide
- CHANGELOG entry for the v1.x release that announces this

### Consumer Migration

```html
<!-- Before (v1.x implicit defaults) -->
<hx-banner>Message</hx-banner>        <!-- open by default -->
<hx-rating value="3"></hx-rating>      <!-- interactive by default -->

<!-- After (v2.0 explicit opt-in) -->
<hx-banner open>Message</hx-banner>
<hx-rating value="3" interactive></hx-rating>
```

---

## Breaking Change 6: Dialog Event Rename

**Impact:** 1 component (hx-dialog)

### Changes

| v1.x Event | v2.0 Event | When |
|---|---|---|
| `hx-open` | `hx-show` | Dialog begins opening |
| `hx-close` | `hx-hide` | Dialog begins closing |

`hx-cancel` is NOT renamed (it's a distinct user action event).

### v1.x Deprecation Layer

Fire both old and new events. Warn on old event listeners.

### Consumer Migration

```javascript
// Before
dialog.addEventListener('hx-open', handler);
dialog.addEventListener('hx-close', handler);

// After
dialog.addEventListener('hx-show', handler);
dialog.addEventListener('hx-hide', handler);
```

---

## Non-Breaking Changes (Any Version)

These changes can ship in any v1.x release without deprecation:

### CSS Token Hardcode Cleanup

Replace hardcoded hex/rgb/px values with token references in 43+ component style files. Visual output is identical — only the fallback chain changes.

### Event Detail Enrichment

Add detail payloads to events that currently fire void:
- hx-badge `hx-remove`: add `{ value }`
- hx-tag `hx-remove`: add `{ value }`
- hx-image `hx-error`: add `{ error }`

These are additive (new data in event detail) and do not break existing listeners.

### Slot Additions

- Add `suffix` slot to hx-select
- Add `error` CSS part alias to hx-checkbox-group and hx-radio-group

Additive changes. No consumer code breaks.

---

## External Constraints (No Change)

These naming patterns are constrained by upstream specs and cannot be changed:

| Component | Pattern | Constraint |
|---|---|---|
| hx-button | `type` property | HTML `<button>` type attribute (submit/reset/button) |
| hx-text-input | `type` property | HTML `<input>` type attribute |
| hx-icon-button | `type` property | HTML `<button>` type attribute |
| hx-toggle-button | `type` property | HTML `<button>` type attribute |
| hx-image | `sizes` property | HTML `<img>` sizes attribute |
| hx-dialog | `showModal()` method | HTML `<dialog>` showModal() API |

---

## Approved Exceptions (No Change)

These boolean-true defaults are intentional design decisions:

| Component | Property | Rationale |
|---|---|---|
| hx-dialog.modal | `true` | WAI-ARIA best practice |
| hx-dialog.closable | `true` | UX: close button expected |
| hx-drawer.closable | `true` | UX: close button expected |
| hx-drawer.overlay | `true` | UX: overlay standard for drawers |
| hx-side-nav.collapsible | `true` | UX: responsive behavior expected |
| hx-toast.closable | `true` | UX: close button expected |
| hx-skeleton.animated | `true` | Universal skeleton convention |
| hx-pagination.showFirstLast | `true` | UX: navigation completeness |

---

## Rollout Timeline

### Phase 1: v1.x Deprecation Release

1. Add compatibility layers to all 15 size-attribute components
2. Add variant alias to hx-list-item and hx-menu-item
3. Add new property names to hx-card and hx-field
4. Add hx-show/hx-hide event aliases to hx-dialog
5. Ship non-breaking changes (token cleanup, event details, slot additions)
6. Update all documentation to show new APIs as primary
7. Console.warn on all deprecated API usage

### Phase 2: v2.0 Migration Guide

1. Publish comprehensive migration guide
2. Provide codemod script for HTML attribute changes (`size` -> `hx-size`)
3. Provide codemod for event listener changes (`hx-open` -> `hx-show`)
4. Document all boolean default changes with before/after examples

### Phase 3: v2.0 Release

1. Remove all deprecation layers
2. Remove all compatibility aliases
3. Change boolean defaults
4. Run full test suite
5. Publish with major version bump

---

## Coordination Required

| Change | Stakeholders |
|---|---|
| Size attribute standardization | Drupal team (Twig templates), documentation team |
| Boolean default changes | All consumers, Storybook docs |
| Dialog event rename | Any app using hx-dialog event listeners |
| Card property rename | Any app using hx-card with links |
