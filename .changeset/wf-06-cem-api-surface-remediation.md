---
'@helixui/library': major
---

fix(cem): remediate CEM and API surface inconsistencies across 40+ components (WF-06)

## Summary

Comprehensive CEM API surface audit remediation fixing 90 findings across 40+ components.

## Breaking Changes

### Property Renames

| Component | Old Property | New Property |
|-----------|-------------|-------------|
| `hx-card` | `hxHref` | `href` |
| `hx-card` | `hxAriaLabel` | `label` |
| `hx-field` | `hxSize` | `size` |
| `hx-banner` | `closeLabel` | `labelClose` |
| `hx-dialog` | `closeLabel` | `labelClose` |
| `hx-drawer` | `closeLabel` | `labelClose` |
| `hx-toast` | `closeLabel` | `labelClose` |
| `hx-split-button` | `triggerLabel` | `labelTrigger` |
| `hx-split-button` | `menuLabel` | `labelMenu` |
| `hx-overflow-menu` | `menuLabel` | `labelMenu` |

### CSS Part Renames

| Component | Old Part | New Part |
|-----------|----------|----------|
| `hx-drawer` | `close-btn` | `close-button` |
| `hx-carousel` | `prev-btn` | `prev-button` |
| `hx-carousel` | `next-btn` | `next-button` |

## Non-Breaking Fixes

- Added `@internal` annotation to `formAssociated` static field across all 18 form-associated components — prevents this browser API marker from appearing in CEM
- Added `@internal` annotation to `formDisabledCallback`, `formResetCallback`, and `formStateRestoreCallback` across all form-associated components
- Added `@internal` to private fields leaking into CEM: `hx-button-group` (`internals`), `hx-alert` (`_defaultSeverityLabel`, `_effectiveSeverityLabel`), `hx-prose` (`adoptedStyles`), `hx-card` (`shadowRootOptions`)
- Expanded type alias unions to literal union types in 19 components so CEM shows actual allowed values instead of opaque type names
- Added `NAMING_CONVENTION.md` documenting approved naming standards for the library
