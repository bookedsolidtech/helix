# @helixui/library

## 0.2.0

### Minor Changes

- Accessibility audit batch — WCAG 2.1 AA compliance across 20+ components, CSS design token audit, infrastructure hardening.

  **Accessibility (WCAG 2.1 AA)**
  - hx-field, hx-progress-bar, hx-action-bar, hx-side-nav, hx-spinner: ARIA roles, keyboard navigation, focus management
  - hx-tag, hx-textarea, hx-toggle-button, hx-button-group, hx-combobox: label associations, describedby wiring
  - hx-pagination, hx-popover, hx-theme, hx-time-picker, hx-alert: live regions, focus traps, landmark roles
  - hx-card, hx-drawer, hx-meter, hx-number-input, hx-split-button: interactive semantics, required indicators
  - hx-skeleton, hx-status-indicator, hx-switch, hx-tabs, hx-avatar: role assignments, state announcements

  **CSS / Design Token Audit**
  - Eliminated hardcoded values across hx-action-bar, hx-container, hx-slider, hx-steps, hx-checkbox-group
  - Token compliance for hx-avatar, hx-link, hx-number-input, hx-status-indicator, hx-time-picker
  - Design system alignment for hx-combobox, hx-field, hx-side-nav, hx-structured-list, hx-textarea

  **Infrastructure**
  - Prettier enforcement: pre-push hook now auto-fixes and commits formatting before every push — formatting drift eliminated permanently
  - VRT baselines: CI is now cache-hit aware — stale baselines auto-regenerate, VRT failures from stale screenshots eliminated
  - Removed DCO workflow — not applicable for private enterprise repos

### Patch Changes

- Updated dependencies
  - @helixui/tokens@0.2.0

## 0.1.3

### Patch Changes

- 553b322: fix: remove manual changeset gating from publish pipeline — let changesets/action handle both version PR creation and npm publish internally
- Updated dependencies [553b322]
  - @helixui/tokens@0.1.3

## 0.1.2

### Patch Changes

- 04a64c8: Launch readiness: accessibility audits, documentation pages, export verification, and quality gates for all 85 custom elements across 73 component directories.
- Updated dependencies [04a64c8]
  - @helixui/tokens@0.1.2
