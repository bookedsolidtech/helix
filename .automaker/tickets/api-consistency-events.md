# API Consistency: Event Naming Fixes

**Audit:** api-consistency-audit.json (2026-03-20)
**Priority:** Medium
**Breaking Change:** Partial (v2.0 for open/close rename)
**Components Affected:** 8 components

---

## Finding 1: hx-open/hx-close vs hx-show/hx-hide (MEDIUM)

### Current State

Overlay components use two different event naming conventions:

**Using hx-show/hx-hide (7 components):**
hx-combobox, hx-drawer, hx-dropdown, hx-overflow-menu, hx-popover, hx-toast, hx-tooltip

**Using hx-open/hx-close (1 component):**
hx-dialog

### Target State

All overlay components use hx-show/hx-hide for visibility lifecycle:

| Event | When |
|---|---|
| `hx-show` | Component starts becoming visible |
| `hx-after-show` | Component is fully visible (after animation) |
| `hx-hide` | Component starts becoming hidden |
| `hx-after-hide` | Component is fully hidden (after animation) |

### Migration Path

**v1.x:** Add hx-show/hx-hide as aliases on hx-dialog. Keep hx-open/hx-close working. Log deprecation warning.

```typescript
// hx-dialog v1.x compatibility
show() {
  this.open = true;
  this.dispatchEvent(new CustomEvent('hx-show', { bubbles: true, composed: true }));
  // Deprecated: still fire hx-open for backward compat
  this.dispatchEvent(new CustomEvent('hx-open', { bubbles: true, composed: true }));
}
```

**v2.0:** Remove hx-open/hx-close from hx-dialog.

### Note: hx-cancel Stays

hx-dialog fires `hx-cancel` when dismissed via Escape key. This is a distinct semantic event (user-initiated cancellation) and should NOT be renamed. It is not part of the show/hide lifecycle.

---

## Finding 2: Inconsistent Event Detail Types (MEDIUM)

### hx-remove Event

| Component | Current Detail | Proposed Standard Detail |
|---|---|---|
| hx-badge | `void` | `{ value?: string }` |
| hx-tag | `void` | `{ value?: string }` |
| hx-file-upload | `{ file: File, index: number }` | `{ file: File, index: number }` (keep) |

**Recommendation:** Badge and tag should include their label/value in the event detail so listeners can identify what was removed. File-upload detail is correct.

### hx-error Event

| Component | Current Detail | Proposed Standard Detail |
|---|---|---|
| hx-image | `void` | `{ error: Error }` |
| hx-file-upload | `{ files: File[], errors: string[] }` | Keep (file-specific) |

**Recommendation:** hx-image should include the error object in the detail.

### hx-reposition Event

| Component | Current Detail |
|---|---|
| hx-popup | `void` |
| hx-split-panel | `{ position: number }` |

**Recommendation:** These are semantically different repositions and can keep different details. Document the difference.

---

## Finding 3: Event Naming is Otherwise Exemplary

All 45+ custom events use the `hx-` prefix consistently. Event names are lowercase kebab-case. Bubbles and composed are set correctly for cross-shadow-boundary usage. No additional fixes needed.

---

## Implementation Checklist

- [ ] Add hx-show/hx-hide aliases to hx-dialog (non-breaking)
- [ ] Add detail payload to hx-badge hx-remove event
- [ ] Add detail payload to hx-tag hx-remove event
- [ ] Add error detail to hx-image hx-error event
- [ ] Deprecate hx-open/hx-close on hx-dialog (v1.x warning)
- [ ] Update CEM event documentation
- [ ] Update consuming code examples in Storybook
