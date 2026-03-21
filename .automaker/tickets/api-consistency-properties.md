# API Consistency: Property Naming Fixes

**Audit:** api-consistency-audit.json (2026-03-20)
**Priority:** Critical
**Breaking Change:** Yes (v2.0)
**Components Affected:** 32+ components

---

## Pattern 1: Size Attribute Split (CRITICAL)

### Current State

32 components have a `size` property. They are split between two attribute conventions:

**Using `hx-size` attribute (21 components):**
hx-avatar, hx-button, hx-button-group, hx-checkbox, hx-combobox, hx-copy-button, hx-date-picker, hx-field, hx-icon, hx-icon-button, hx-number-input, hx-overflow-menu, hx-progress-bar, hx-select, hx-slider, hx-split-button, hx-switch, hx-tag, hx-text-input, hx-textarea, hx-toggle-button

**Using standard `size` attribute (15 components — NEEDS FIX):**
hx-action-bar, hx-badge, hx-color-picker, hx-container, hx-counter, hx-drawer, hx-progress-ring, hx-prose, hx-rating, hx-spinner, hx-stat, hx-status-indicator, hx-steps, hx-time-picker, hx-tooltip

### Target State

All 32 components use `hx-size` as the HTML attribute:

```typescript
@property({ type: String, reflect: true, attribute: 'hx-size' })
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
```

### Migration Path (v1.x Deprecation + v2.0 Removal)

**v1.x:** Add `hx-size` as the primary attribute. Keep `size` working via `attributeChangedCallback` override that maps `size` to `hx-size` and emits a console.warn deprecation notice.

```typescript
// Compatibility layer for v1.x
attributeChangedCallback(name: string, old: string, value: string) {
  if (name === 'size') {
    console.warn(`[hx-${this.tagName}] The "size" attribute is deprecated. Use "hx-size" instead.`);
    this.setAttribute('hx-size', value);
    return;
  }
  super.attributeChangedCallback(name, old, value);
}
```

**v2.0:** Remove `size` attribute support. Only `hx-size` works.

### Consumer Impact

- **HTML authors:** Change `<hx-badge size="sm">` to `<hx-badge hx-size="sm">`
- **Drupal/Twig:** Update Twig templates with `size` attribute
- **JS authors:** No change needed (property name `size` stays the same)

---

## Pattern 2: `type` vs `variant` Naming (HIGH)

### Current State

21 components use `variant` for visual style. 2 sub-components incorrectly use `type` for the same purpose:

| Component | Property | Values | Should Be |
|---|---|---|---|
| hx-list-item | `type` | 'default' | `variant` |
| hx-menu-item | `type` | 'default' | `variant` |

Note: hx-button, hx-text-input, hx-icon-button, hx-toggle-button correctly use `type` for HTML-native button/input type. These are NOT affected.

### Target State

```typescript
// hx-list-item, hx-menu-item
@property({ type: String, reflect: true })
variant: 'default' | 'danger' | 'success' = 'default';
```

### Migration Path

**v1.x:** Accept both `type` and `variant`. Log deprecation warning when `type` is used for visual styling.

**v2.0:** Remove `type` from hx-list-item and hx-menu-item.

---

## Pattern 3: Boolean Properties Defaulting to True (MEDIUM)

### Components Needing Change

| Component | Property | Current Default | Proposed Default | Rationale |
|---|---|---|---|---|
| hx-banner | `open` | `true` | `false` | Banners should opt-in to visibility |
| hx-table | `fullWidth` | `true` | `false` | Tables should not assume full width |
| hx-code-snippet | `copyable` | `true` | `false` | Copy should be opt-in |
| hx-rating | `interactive` | `true` | `false` | Display-only should be default |

### Approved Exceptions (No Change)

| Component | Property | Default | Rationale |
|---|---|---|---|
| hx-dialog | `modal` | `true` | WAI-ARIA: dialogs should be modal by default |
| hx-dialog | `closable` | `true` | UX: close button expected |
| hx-drawer | `closable` | `true` | UX: close button expected |
| hx-drawer | `overlay` | `true` | UX: overlay expected for drawers |
| hx-side-nav | `collapsible` | `true` | UX: responsive collapse expected |
| hx-toast | `closable` | `true` | UX: close button expected |
| hx-skeleton | `animated` | `true` | Universal convention |
| hx-pagination | `showFirstLast` | `true` | UX: first/last navigation expected |

### Migration Path

**v1.x:** Document the upcoming default changes. Add deprecation notice in Storybook docs.

**v2.0:** Change defaults to `false`. Consumers must add the attribute explicitly.

---

## Pattern 4: Non-Standard Property/Attribute Naming (HIGH)

### Components Needing Fix

| Component | Current Property | Current Attribute | Fix Property | Fix Attribute |
|---|---|---|---|---|
| hx-card | `hxHref` | `hx-href` | `href` | `href` |
| hx-card | `hxAriaLabel` | `hx-aria-label` | `ariaLabel` | `aria-label` |
| hx-field | `hxSize` | `hx-size` | `size` | `hx-size` |
| hx-breadcrumb-item | `dataBcLast` | `data-bc-last` | internal state | removed |

### Target State

```typescript
// hx-card
@property({ type: String }) href = '';
@property({ type: String, attribute: 'aria-label' }) ariaLabel = '';

// hx-field (property is 'size', attribute is 'hx-size')
@property({ type: String, reflect: true, attribute: 'hx-size' }) size = 'md';

// hx-breadcrumb-item: dataBcLast should be internal @state(), not a public property
@state() private _isLast = false;
```

### Migration Path

**v1.x:** Add new property names as aliases. Deprecate old names.

**v2.0:** Remove old property names.

---

## Implementation Checklist

- [ ] Add `hx-size` attribute to 15 components missing it (with deprecation layer)
- [ ] Rename `type` to `variant` on hx-list-item and hx-menu-item (with deprecation layer)
- [ ] Fix hx-card property names (hxHref -> href, hxAriaLabel -> ariaLabel)
- [ ] Fix hx-field property name (hxSize -> size with hx-size attribute)
- [ ] Convert hx-breadcrumb-item dataBcLast to internal state
- [ ] Document all boolean default changes for v2.0
- [ ] Update CEM after all changes
- [ ] Update Storybook stories to use new attribute names
