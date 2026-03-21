# API Consistency: Method and CSS Fixes

**Audit:** api-consistency-audit.json (2026-03-20)
**Priority:** Medium
**Breaking Change:** Partial (method renames in v2.0)
**Components Affected:** 4 components (methods), 43 components (CSS hardcoded values)

---

## Finding 1: show()/hide() vs show()/close() Method Naming (MEDIUM)

### Current State

| Component | Show Method | Hide Method | Pattern |
|---|---|---|---|
| hx-dialog | `show()`, `showModal()` | `close(returnValue?)` | show/close |
| hx-drawer | `show()` | `close()` | show/close |
| hx-color-picker | `show()` | `hide()` | show/hide |
| hx-code-snippet | `show()` | `hide()` | show/hide |

### Analysis

The distinction is actually semantic:

- **show()/close()**: Components that represent a user interaction flow (dialogs, drawers). "Close" implies completing or dismissing an interaction.
- **show()/hide()**: Components that toggle visibility (color-picker dropdown, code snippet expansion).

### Recommendation

Keep the current patterns. They are semantically distinct:

- **Modals/overlays** (dialog, drawer): `show()` / `close()` — matches the HTML `<dialog>` API
- **Visibility toggles** (color-picker, code-snippet): `show()` / `hide()` — simple visibility control

Document this distinction in the component API guidelines. No breaking change needed.

### Code-Snippet Consideration

`show()` and `hide()` on hx-code-snippet control expand/collapse behavior, not visibility. Consider renaming to `expand()` / `collapse()` for clarity in v2.0.

---

## Finding 2: Form Validation API is Consistent

All 9 form-associated components implement the same validation methods:

```typescript
checkValidity(): boolean
reportValidity(): boolean
```

Components: hx-checkbox-group, hx-combobox, hx-date-picker, hx-number-input, hx-radio-group, hx-select, hx-text-input, hx-textarea, hx-time-picker

No action needed. This is a positive finding.

---

## Finding 3: Carousel Navigation API is Well-Designed

```typescript
next(): void
previous(): void
goToSlide(index: number): void
```

No action needed. Navigation methods are intuitive.

---

## Finding 4: Hardcoded CSS Values (MEDIUM — Non-Breaking)

43+ components have hardcoded fallback values in their styles files. Common patterns:

### Hex Colors Found as Fallbacks

| Value | Usage | Should Be |
|---|---|---|
| `#2563eb` | Primary blue (focus, links) | `var(--hx-color-primary-500)` |
| `#dc3545` | Error red | `var(--hx-color-error-500)` |
| `#ffffff` | White backgrounds | `var(--hx-color-neutral-0)` |
| `#0f172a` | Dark text | `var(--hx-color-neutral-900)` |

### RGB/RGBA Found as Fallbacks

| Value | Usage | Should Be |
|---|---|---|
| `rgba(37, 99, 235, 0.25)` | Focus ring | `var(--hx-focus-ring-color)` with opacity |
| `rgba(0, 0, 0, 0.1)` | Shadows | `var(--hx-shadow-color)` |
| `rgba(255, 255, 255, 0.15)` | Ghost hover | Token with opacity |

### Pixel Values Found

| Value | Usage | Should Be |
|---|---|---|
| `2px` | Focus ring width | `var(--hx-focus-ring-width)` |
| `4px` | Border radius | `var(--hx-border-radius-sm)` |
| `8px` | Spacing | `var(--hx-space-2)` |

### Most Affected Components (10+ hardcoded values each)

1. hx-alert
2. hx-button
3. hx-combobox
4. hx-dialog
5. hx-drawer
6. hx-text-input
7. hx-textarea
8. hx-number-input
9. hx-popover
10. hx-toast

### Recommendation

Replace hardcoded fallbacks with token references. This is entirely non-breaking since the visual output stays identical. Should be done as a batch refactor separate from breaking changes.

```css
/* Before */
:host {
  --_focus-color: var(--hx-button-focus-color, rgba(37, 99, 235, 0.25));
}

/* After */
:host {
  --_focus-color: var(--hx-button-focus-color, var(--hx-focus-ring-color));
}
```

---

## Finding 5: --hx- CSS Custom Property Prefix Compliance

100% of CSS custom properties follow the `--hx-` prefix convention. No violations found.

---

## Implementation Checklist

### Methods (v2.0)
- [ ] Rename hx-code-snippet show()/hide() to expand()/collapse()
- [ ] Document show/close vs show/hide semantic distinction in API guidelines

### CSS Token Refactor (non-breaking, any version)
- [ ] Replace hardcoded hex colors with token references in all 43+ components
- [ ] Replace hardcoded rgba values with token references
- [ ] Replace hardcoded pixel values with spacing tokens
- [ ] Verify visual regression tests pass after token swap
- [ ] Update VRT baselines if needed
