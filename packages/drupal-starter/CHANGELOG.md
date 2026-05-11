# @helixui/drupal-starter

## 4.0.0

### Patch Changes

- Updated dependencies [7b42779]
- Updated dependencies [2068ed3]
- Updated dependencies [723eec6]
- Updated dependencies [1ea6a14]
  - @helixui/library@4.0.0

## 3.0.1

### Patch Changes

- Updated dependencies [36d5bde]
  - @helixui/library@3.1.0

  Note: the 3.1.0 release cycle initially published this package as `4.0.0` because changesets' default policy treats any peer-dependency update as a major bump. The bump was cosmetic — the peer range `^3.0.0` still satisfies `@helixui/library@3.1.0` and no API changed. `4.0.0` was unpublished from npm and this patch release (`3.0.1`) is the correct version. `.changeset/config.json` now sets `onlyUpdatePeerDependentsWhenOutOfRange: true` to prevent recurrence.

## 3.0.0

### Major Changes

- e4b79be: BREAKING: All SDC templates aligned with `@helixui/library@3.0.0` public API. Consumers who have forked any drupal-starter templates must re-apply their customizations against the new 3.0.0 base.

  Template / attribute changes:
  - `hx-card` — `accessible-label` attribute replaced with `hx-label` (HTML attribute; JS property remains `label`)
  - `hx-nav` — `hx-size="small"` corrected to `hx-size="sm"` (enum value alignment)
  - All ARIA-labelable components (`hx-button`, `hx-text-input`, `hx-form`, etc.) — templates now emit `accessible-label` instead of `aria-label` to match library's new public attribute name
  - `hx-dialog` — templates no longer rely on the default `modal="true"` behavior (library default flipped to `false`); explicit `modal` attribute added where modal semantics are required
  - `hx-date-picker` / `hx-time-picker` — templates updated for the non-modal popup contract (library migrated from native `<dialog>` to non-modal)
  - `::part(error-message)` selectors replaced with `::part(error)` in CSS snippets that style form validation
  - `hx-phi-field` — template no longer renders the `value` attribute in server-rendered HTML (library strips the attribute post-`connectedCallback` for HIPAA DOM-serialization safety)

  See `packages/drupal-starter/CHANGELOG.md` and the 3.0.0 migration guide `docs/UPGRADING-TO-3.md` for the full list of affected components and the recommended codemod for consumer fork reconciliation.

### Patch Changes

- e4b79be: fix(drupal-starter): correct hx-card accessible-label to hx-label attribute in templates

  fix(drupal-starter): fix hx-nav hx-size="small" to hx-size="sm" invalid enum value

- 3d9a4b9: Unblock 3.0.0 release publish and drop Node 20 from all CI matrices.
  - Replace `peerDependencies["@helixui/library"]` in `@helixui/drupal-behaviors` and `@helixui/drupal-starter` with `workspace:^`. pnpm rewrites this to `^3.0.0` at publish time; the old `^2.1.2 || ^3.0.0` range caused `ERR_PNPM_NO_MATCHING_VERSION` during `changesets version && pnpm install --no-frozen-lockfile` because 3.0.0 wasn't on npm yet.
  - Drop Node 20 from `.nvmrc` (→22), root `package.json` engines, `packages/helixui-mcp/package.json` engines, and all GitHub Actions workflows (`ci.yml`, `publish.yml`, `release.yml`, `canary.yml`, `audit-batch-ci.yml`, `cross-browser.yml`). Node 20 reaches upstream EOL on 2026-04-30; this project standardizes on Node 22 LTS and Node 24 as the supported runtimes.

- Updated dependencies [1ae0509]
- Updated dependencies [a610bb7]
- Updated dependencies [aff17e8]
- Updated dependencies [373bf84]
- Updated dependencies [19e966b]
- Updated dependencies [c8a63a0]
- Updated dependencies [61911c1]
- Updated dependencies [50b36a3]
- Updated dependencies [ae1e6e8]
- Updated dependencies [49fdb6c]
- Updated dependencies [196094a]
- Updated dependencies [6d62cc2]
- Updated dependencies [9c8720f]
- Updated dependencies [fce3340]
- Updated dependencies [a0562c4]
- Updated dependencies [20d0129]
- Updated dependencies [700c329]
- Updated dependencies [d3f1d2a]
- Updated dependencies [04ddfae]
- Updated dependencies [2d16e9b]
- Updated dependencies [d830889]
- Updated dependencies [bfca244]
- Updated dependencies [3f6c595]
- Updated dependencies [1fb3e7a]
- Updated dependencies [91e00b4]
- Updated dependencies [9a8cafb]
- Updated dependencies [6b2500d]
- Updated dependencies [edee58a]
- Updated dependencies [5c36408]
  - @helixui/library@3.0.0

## 2.0.0

### Patch Changes

- Updated dependencies [ba9c72d]
- Updated dependencies [97d75d9]
- Updated dependencies [56585b5]
- Updated dependencies [d6d2244]
- Updated dependencies [d887573]
- Updated dependencies [3c8937b]
  - @helixui/library@2.1.0

## 1.0.0

### Minor Changes

- cddf516: feat(drupal): add 30 SDC compositions for helix component library

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

- 2634cd9: add @helixui/drupal-starter package — composition SDCs for enterprise Drupal sites

  New package providing 30+ pre-built composition SDCs for Drupal using HELiX web components. Each SDC composes multiple HELiX components into production-ready Drupal content patterns including hero banners, provider cards, article layouts, navigation, forms, and more. Ships with Drupal module info, library definitions, and JavaScript behaviors.

### Patch Changes

- 4610f95: feat(drupal): add 13 sdc compositions expanding hx-\* component coverage

  Adds SDC wrappers for hx-breadcrumb (navigation), hx-button, hx-card (core
  content), hx-avatar, hx-badge, hx-tag, hx-stat, hx-status-indicator (data
  display), hx-banner, hx-spinner, hx-progress-bar (feedback), hx-clinical-status
  (healthcare), and hx-checkbox-group (forms). Brings the total hx-\* SDC count
  from 30 to 43.

- 1fca7eb: test: add sdc composition test suite for drupal-starter
- 7aeceeb: Add Twig integration tests for Drupal component rendering
- Updated dependencies [7641ef1]
- Updated dependencies [3bbe6a5]
- Updated dependencies [448c908]
- Updated dependencies [257cf7d]
- Updated dependencies [2d9d739]
- Updated dependencies [23f5f6f]
- Updated dependencies [4d85c91]
- Updated dependencies [bd97a70]
- Updated dependencies [262083c]
- Updated dependencies [8db97bd]
- Updated dependencies [5757017]
- Updated dependencies [0d22fe1]
- Updated dependencies [0a74c8c]
- Updated dependencies [670c553]
- Updated dependencies [923e9d1]
- Updated dependencies [1037809]
- Updated dependencies [2243d3c]
- Updated dependencies [91267a1]
- Updated dependencies [abb4de6]
- Updated dependencies [5c4e4c9]
- Updated dependencies [224884e]
- Updated dependencies [fd65331]
- Updated dependencies [727e99f]
- Updated dependencies [82bd233]
- Updated dependencies [6ceafc0]
- Updated dependencies [ff7bcfd]
- Updated dependencies [1f3791d]
- Updated dependencies [3b6017b]
- Updated dependencies [9c17779]
- Updated dependencies [de9ccbe]
- Updated dependencies [ba21f3f]
- Updated dependencies [5d9ccf7]
- Updated dependencies [917d707]
- Updated dependencies [3458dd0]
- Updated dependencies [d776f72]
- Updated dependencies [be9b080]
- Updated dependencies [984a6f6]
- Updated dependencies [64fd2fc]
- Updated dependencies [dad6c71]
- Updated dependencies [dd58277]
- Updated dependencies [dcf7a9c]
- Updated dependencies [e0ec673]
- Updated dependencies [27e5758]
- Updated dependencies [53ddf75]
- Updated dependencies [e0df165]
- Updated dependencies [87cdd7e]
- Updated dependencies [7f80a77]
- Updated dependencies [184d560]
- Updated dependencies [1f8eef7]
- Updated dependencies [0656b5f]
- Updated dependencies [cf0bc88]
- Updated dependencies [20d502c]
- Updated dependencies [af04577]
- Updated dependencies [4f5af84]
- Updated dependencies [c94a209]
- Updated dependencies [e0adb4e]
- Updated dependencies [281a09e]
- Updated dependencies [181876b]
- Updated dependencies [e89b4b9]
- Updated dependencies [3c48dba]
- Updated dependencies [31bab2a]
- Updated dependencies [9afb9c1]
- Updated dependencies [0660768]
- Updated dependencies [52868cd]
- Updated dependencies [8bf2c61]
- Updated dependencies [a6470e9]
- Updated dependencies [acb6076]
- Updated dependencies [1b587d2]
  - @helixui/library@2.0.0
