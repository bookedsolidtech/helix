---
'@helixui/drupal-starter': minor
---

feat(drupal): add 30 SDC compositions for helix component library

Expands drupal-starter SDC coverage from 29 to 59 compositions by adding
primitive component wrappers for all major hx-library components.

New SDCs added:

**Form components (11):**
- hx-text-input — form-associated text input with label, validation, and help text
- hx-select — custom select with label, error, and slotted native option elements
- hx-checkbox — checkbox with label, indeterminate state, and consent label slot
- hx-radio-group — radio group managing hx-radio children with keyboard navigation
- hx-textarea — multi-line text area with character count and resize control
- hx-date-picker — date picker with calendar popover accepting ISO 8601 values
- hx-time-picker — time picker with 12h/24h format and step interval support
- hx-file-upload — drag-and-drop file upload with client-side validation
- hx-number-input — numeric input with stepper controls and unit suffix slot
- hx-slider — range slider for pain scales, ratings, and numeric ranges
- hx-switch — toggle switch for boolean settings and feature flags
- hx-combobox — searchable select with multi-select and remote data loading

**Navigation components (5):**
- hx-tabs — tabbed content with horizontal/vertical orientations and ARIA tablist
- hx-side-nav — collapsible side navigation panel for clinical portals
- hx-top-nav — site-level navigation bar with logo, nav, and actions slots
- hx-pagination — page navigation mapped to Drupal Views pager (0-based offset documented)
- hx-steps — multi-step wizard progress indicator for intake and onboarding workflows

**Data display components (4):**
- hx-data-table — enterprise data table with sorting, selection, and JSON column/row props
- hx-tree-view — hierarchical tree for menu trees, taxonomy, and document navigation
- hx-accordion — collapsible content sections for FAQ and structured reference content
- hx-list — styled list with plain, bulleted, numbered, description, and interactive variants
- hx-carousel — primitive carousel wrapper (use views-carousel for Views layouts)

**Feedback components (6):**
- hx-alert — status messages with variants mapped to Drupal message types
- hx-toast — transient notifications with auto-dismiss and ARIA live regions
- hx-dialog — modal/non-modal dialog with alertdialog variant for clinical alerts
- hx-drawer — slide-in panel from any viewport edge for off-canvas navigation
- hx-popover — floating content panel anchored to a trigger element
- hx-tooltip — contextual help text with smart positioning

**Healthcare-specific components (2):**
- hx-patient-banner — Joint Commission NPSG.01.01.01 two-identifier rule enforcement
- hx-phi-field — HIPAA-compliant masked PHI display with audit event firing

All SDCs follow the established 3-file pattern (.component.yml, .twig, .css).
Every .twig template uses attach_library() and passes only non-default attribute
values to keep rendered HTML minimal. Healthcare SDCs include inline security
and compliance guidance in comments.
