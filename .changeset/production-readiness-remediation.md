---
'@helixui/library': patch
---

Production readiness remediation: HelixElement migration, forced-colors, focus-visible, accessibility fixes

- Migrate 14 form components to HelixElement base class (lazy _internals, form lifecycle hooks)
- Fix hx-button-group invalid attachInternals() crash (P0-1)
- Fix hx-icon-button LitElement→HelixElement migration (P0-3)
- Add forced-colors @media rules to 64 component style files for Windows High Contrast
- Add focus-visible styles to form components
- Replace ad-hoc ID counters with createIdCounter factory across 22 components
- Export mixins from barrel and fix AriadDelegationMixinInterface typo
- Fix HelixElement convenience getters (form, validity, validationMessage) lazy init
- Add roving tabindex keyboard navigation to hx-data-table sortable headers
- Fix hx-textarea counter aria-hidden/aria-describedby conflict
- Replace hx-drawer setTimeout with transitionend for animation events
- Enforce 44px minimum touch targets on sm size variants
- Add PropertyValues<this> generic to lifecycle methods
