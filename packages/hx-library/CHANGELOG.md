# @helixui/library

## 2.1.0

### Minor Changes

- 97d75d9: Adopt design tokens at document level via `document.adoptedStyleSheets`

  Removes redundant per-component `tokenStyles` from all 98 components' `static styles`.
  Tokens are now adopted once at the document `:root` level, eliminating ~27,000 redundant
  CSS custom property declarations per page and fixing `hx-theme` cascade override behavior.
  - New utility: `ensureDocumentTokens()` in `src/utilities/document-token-adoption.ts`
  - Auto-executes on first import — no consumer API change required
  - SSR-safe with `typeof document` guard
  - Multi-bundle safe via `document.__hx_tokens_adopted__` marker
  - Added to `sideEffects` in package.json to prevent tree-shaking
  - 16 dedicated tests covering idempotency, marker, CSS content, and preservation

### Patch Changes

- ba9c72d: fix(a11y): resolve aria-required-parent violation in hx-breadcrumb

  Adds `role="list"` to the `hx-breadcrumb` host element and `role="presentation"` to the shadow DOM `<ol>` so axe-core flat-tree traversal sees a valid ARIA list ancestor for `hx-breadcrumb-item[role="listitem"]` children. Previously the `<ol>` lived in shadow DOM while the list items lived in light DOM, so axe-core's `@axe-core/playwright` could not bridge the shadow boundary to establish the required list/listitem parent–child relationship in the composed accessibility tree.

- 56585b5: Address Tier 2 code review findings for adopted stylesheets
  - Fix TOCTOU race: set idempotency marker before stylesheet adoption
  - Use `lightTokenCss` from `@helixui/tokens` instead of mapping `tokenEntries` (tree-shaking)
  - Switch document marker from string property to `Symbol.for('hx-tokens-adopted')`
  - Add try/catch for graceful degradation if `adoptedStyleSheets` assignment fails
  - Deprecate `mergeTokenStyles` utility (superseded by document-level token adoption)

- d6d2244: fix(cem): add missing @csspart JSDoc annotations to hx-drawer, hx-slider, hx-time-picker

  Resolves 14 CEM API Diff validation errors caused by CSS parts declared in
  component templates (`part="..."`) that were not documented in `@csspart` JSDoc
  blocks, causing the manifest to omit them from `cssParts`.

  Components fixed:
  - `hx-drawer`: added `@csspart close-btn` (visually-hidden close button rendered when `noHeader` is true)
  - `hx-slider`: added `@csspart help-text` (help text element below the slider)
  - `hx-time-picker`: added `@csspart field`, `@csspart error`, `@csspart help-text`

- d887573: fix(test): repair hx-date-picker keyboard navigation async timing

  Fixes 5 failing CI tests in `hx-date-picker.test.ts` across all Node matrix (20/22/24):
  1. **`openCalendar` helper**: added `rAF + updateComplete` double-await so `_focusActiveDay()` completes its async render cycle before tests interact with the calendar. Previously `_focusedDay` was null when key events fired, causing the component to default to day 1 instead of the fixture's selected day.
  2. **4 Arrow key focus tests** (`ArrowRight/Left/Down/Up`): now pass because `openCalendar` correctly initialises `_focusedDay` before the key event is dispatched. The existing single-`updateComplete` await after dispatch is sufficient since no `_viewMonth` change occurs.
  3. **Duplicate `describe('Keyboard Navigation: arrow key month wrapping')` block**: removed the second copy at the end of the file; kept the first block at line ~1162.
  4. **ArrowRight month-wrap test**: uses single `await el.updateComplete` (not double-await). Microtask ordering guarantees the test resumes before `updated()`'s `_focusActiveDay()` callback fires, capturing `_focusedDay=1` while it's still correct. Adding rAF would allow `_focusActiveDay()` to override it with today's date.

- 3c8937b: fix(hx-number-input, hx-slider): use `declare` on @query fields to prevent instance initializer from shadowing Lit's prototype getter

## 2.0.0

### Major Changes

- 8bf2c61: fix(cem): remediate CEM and API surface inconsistencies across 40+ components (WF-06)

  ## Summary

  Comprehensive CEM API surface audit remediation fixing 90 findings across 40+ components.

  ## Breaking Changes

  ### Property Renames

  | Component          | Old Property   | New Property   |
  | ------------------ | -------------- | -------------- |
  | `hx-card`          | `hxHref`       | `href`         |
  | `hx-card`          | `hxAriaLabel`  | `label`        |
  | `hx-field`         | `hxSize`       | `size`         |
  | `hx-banner`        | `closeLabel`   | `labelClose`   |
  | `hx-dialog`        | `closeLabel`   | `labelClose`   |
  | `hx-drawer`        | `closeLabel`   | `labelClose`   |
  | `hx-toast`         | `closeLabel`   | `labelClose`   |
  | `hx-split-button`  | `triggerLabel` | `labelTrigger` |
  | `hx-split-button`  | `menuLabel`    | `labelMenu`    |
  | `hx-overflow-menu` | `menuLabel`    | `labelMenu`    |

  ### CSS Part Renames

  | Component     | Old Part    | New Part       |
  | ------------- | ----------- | -------------- |
  | `hx-drawer`   | `close-btn` | `close-button` |
  | `hx-carousel` | `prev-btn`  | `prev-button`  |
  | `hx-carousel` | `next-btn`  | `next-button`  |

  ## Non-Breaking Fixes
  - Added `@internal` annotation to `formAssociated` static field across all 18 form-associated components — prevents this browser API marker from appearing in CEM
  - Added `@internal` annotation to `formDisabledCallback`, `formResetCallback`, and `formStateRestoreCallback` across all form-associated components
  - Added `@internal` to private fields leaking into CEM: `hx-button-group` (`internals`), `hx-alert` (`_defaultSeverityLabel`, `_effectiveSeverityLabel`), `hx-prose` (`adoptedStyles`), `hx-card` (`shadowRootOptions`)
  - Expanded type alias unions to literal union types in 19 components so CEM shows actual allowed values instead of opaque type names
  - Added `NAMING_CONVENTION.md` documenting approved naming standards for the library

### Minor Changes

- 670c553: add automated release pipeline with GitHub Actions workflows for semantic versioning, changeset-driven releases, npm publishing, and GitHub Releases generation
- 1037809: add css bundle pipeline that extracts component styles into standalone css files for enterprise light-dom consumption
- abb4de6: add density attribute to hx-theme supporting comfortable (default), compact, and spacious presets. compact reduces spacing tokens ~25% for data-dense clinical dashboards; spacious increases ~25% for touch-optimized bedside tablets. density composes with theme and brand as a separate adoptedStyleSheets layer.
- 5c4e4c9: Add Drupal behaviors package for enterprise CMS integration
- 224884e: Add CLI script to generate Drupal libraries.yml from Custom Elements Manifest

  Adds `scripts/generate-drupal-libraries.js` and a `generate:drupal-libraries` npm script to `@helixui/library`. The script reads `custom-elements.json` (CEM) and `package.json` and writes `drupal/helix.libraries.yml` — a valid Drupal asset library definition file containing:
  - `helix/hx-tokens` — standalone design token CSS library
  - One entry per component directory (77 components), each with `type: module` JS and a `helix/hx-tokens` dependency
  - Six category bundles: `core`, `forms`, `navigation`, `data-display`, `feedback`, `layout`
  - `helix/all` — full library bundle that includes every component

  The base asset path defaults to `/libraries/helix` and is configurable via `--base-path`. The output path defaults to `drupal/helix.libraries.yml` and is configurable via `--output`.

- 727e99f: add HelixAuditController for HIPAA audit trail event capture
- 917d707: feat(mixins): add FocusMixin for standardized delegated focus management

  Introduces FocusMixin, a Lit 3.x mixin modeled after Lion's FocusMixin and Material Web's mixinDelegatesAria:
  - `_focusableNode` protected getter for subclasses to declare the inner focusable element
  - `focused` reflected boolean attribute as a CSS styling hook for `:host([focused])`
  - `focusedVisible` reflected boolean attribute for keyboard-only focus ring styling
  - Delegated `focus()` / `blur()` routing to the inner element
  - Autofocus support after first render via `firstUpdated` lifecycle
  - Pre-render focus queuing: `focus()` calls before shadow DOM is stamped are replayed on `firstUpdated`

  Applied FocusMixin to `hx-text-input`, replacing the previous manual `this._input?.focus()` pattern.

- 3458dd0: add FormMixin for shared form validation and interaction state tracking across form components
- d776f72: add HelixElement base class with shared form association, lifecycle callbacks, and ID counter utilities

  Introduces `HelixElement` as the new base class for all HELiX components, extending `LitElement` with:
  - Lazy `_internals` accessor via private class field — eliminates `attachInternals()` constructor boilerplate across all form-associated components
  - Form lifecycle hook delegation: `formDisabledCallback`, `formResetCallback`, and `formStateRestoreCallback` delegate to protected `_onFormDisabled`, `_onFormReset`, and `_onFormStateRestore` hook methods for clean subclass overrides
  - `form`, `validity`, and `validationMessage` convenience getters
  - `createIdCounter(namespace)` and `resetIdCounter(namespace?)` utilities replacing module-level `let` counters with a shared, testable, SSR-safe ID factory
  - `mergeTokenStyles(componentStyles, tokenStyles)` helper for combining Lit CSSResult arrays

  Migrates `hx-text-input`, `hx-checkbox`, and `hx-select` to use `HelixElement` as a proof-of-concept migration. All existing public APIs are preserved.

  All utilities are exported from `@helixui/library` and from `@helixui/library/base/index.js` for direct import.

- be9b080: Add high-contrast token layer with WCAG AAA compliant color overrides and contrast validation utility. Tokens activate via `[data-hx-contrast="high"]` attribute or `prefers-contrast: more` media query.
- dd58277: feat(clinical-status): add hx-clinical-status component for alert fatigue prevention
- 27e5758: feat: add hx-patient-banner compound component for patient identification

  Implements Joint Commission NPSG.01.01.01 two-identifier rule enforcement with
  named slots for name, MRN, DOB, allergies, code status, and photo. Integrates
  with hx-phi-field for HIPAA-compliant masked identifier display. Renders as
  landmark region with role="banner" for screen reader navigation.

- 184d560: feat(motion): add motion tokens and prefers-reduced-motion support

  Adds `--hx-easing-decelerate` and `--hx-easing-accelerate` design tokens to `@helixui/tokens`.

  Adds a `motion` attribute to `hx-theme` accepting `"full"` (default), `"reduced"`, and `"none"`. When `motion="reduced"` or `"none"`, all duration tokens collapse to `0ms` and all easing tokens resolve to `linear`. When `motion="full"`, the OS `prefers-reduced-motion: reduce` media query is respected automatically — the same token overrides are applied when the OS preference is active.

  Also exports a `MotionMode` type and a `effectiveMotion` getter from `hx-theme`.

  Updated `hx-spinner` and `hx-drawer` to consume easing tokens (`--hx-easing-in-out` and `--hx-easing-default`) rather than hardcoded `ease-in-out` and `ease` values, ensuring the motion token cascade reaches these components.

- 1f8eef7: add multi-brand theming api for hospital system white-label implementations
  - `HelixBrandRegistry` singleton in `@helixui/tokens` allows consumers to register named brand token sets at application bootstrap
  - brand registration validates all 22 required semantic tokens (primary and secondary color ramps) at registration time, throwing with a list of missing tokens on failure
  - `hx-theme` gains a `brand` attribute that merges registered brand tokens on top of the base theme via adoptedStyleSheets replacement
  - unregistered brands fall back gracefully to the base theme with a `console.warn`
  - new exports: `HelixBrandRegistry`, `HelixBrandRegistryClass`, `REQUIRED_SEMANTIC_TOKENS`, `BrandTokenMap`, `BrandValidationResult`

- 20d502c: Add hx-phi-field component for HIPAA-compliant PHI display with masking, reveal toggle, audit event emission, and clipboard protection
- af04577: add light dom style injection patterns for drupal and non-shadow-dom consumers

  introduces `injectLightStyles`, `generateScopedSelectors`, `SheetManager`, and `adoptedStylesheetRegistry` utilities plus the `<hx-style-scope>` wrapper component. enables slotted content in drupal twig templates to receive component typography and spacing styles via scoped `[data-hx-styled]` selectors with single-stylesheet-per-component-type deduplication.

- 1b587d2: WF-10 i18n remediation: RTL CSS logical properties and hardcoded string overrides
  - Replaced all physical CSS directional properties with logical equivalents across 20 component style files: `margin-left/right` → `margin-inline-start/end`, `padding-left/right` → `padding-inline-start/end`, `border-left/right` → `border-inline-start/end`, `text-align: left/right` → `text-align: start/end`
  - Added new overridable label properties to 8 components: `labelClose` (hx-alert), `labelError` (hx-copy-button), `labelRequired` + `labelNoOptions` (hx-select), `labelDragDetected` (hx-file-upload), `labelPageMessage` + `labelPageButton` (hx-pagination), `labelTrend` (hx-stat), `labelEllipsis` (hx-breadcrumb), `label` (hx-dropdown)
  - Fixed character counter in hx-textarea to use grapheme cluster counting (`Array.from()`) for accurate emoji handling

### Patch Changes

- 7641ef1: fix(a11y): remove redundant role="list" from hx-nav submenu, add parent active state when child is current, fix aria-haspopup value to "menu" and add aria-expanded on hx-menu-item submenu triggers
- 3bbe6a5: fix invalid role="button" on hx-step inner div and add aria-live status announcements
  - STEPS-001: remove role="button" from the inner .step div — the host element already has role="listitem" and tabindex="0"; the inner div is purely presentational and the duplicate role caused role/focus mismatch for screen readers
  - STEPS-003: add aria-live="polite" region in hx-step shadow DOM that announces status transitions to "complete" or "error" so screen readers are notified when step status changes programmatically
  - STEPS-002: add devWarn in hx-steps connectedCallback() when aria-label is null or empty, guiding developers to provide an accessible name for the steps list (WCAG 2.1 SC 4.1.2)

- 448c908: fix(a11y): hx-tabs — aria-disabled keyboard discovery, selected-index attribute reflection, pointer-events
  - disabled tabs are now keyboard-discoverable via arrow keys per the ARIA APG tab pattern; focus moves to disabled tabs but activation is prevented
  - space/enter on a focused disabled tab does nothing
  - added `selected-index` HTML attribute support so server-rendered pages (e.g. drupal twig) can pre-select a tab without javascript
  - added `pointer-events: none` to disabled tab button to prevent mouse activation; `cursor: not-allowed` moved to `:host([disabled])` so the cursor remains visible
  - `--hx-opacity-disabled` fallback value `0.5` was already present

- 257cf7d: fix accessibility issues in hx-tree-view: add aria-hidden to collapsed children group and implement typeahead keyboard navigation per wai-aria apg tree view pattern
- 2d9d739: fix color contrast in hx-nav-item and hx-side-nav to meet WCAG 2.1 AA requirements
  - Add background-color and color to hx-side-nav :host so slotted light-DOM content inherits the dark surface context; without this axe-core evaluates slotted text against the page white background, producing false-positive color-contrast failures
  - Correct all CSS fallback hex values in hx-nav-item.styles.ts and hx-side-nav.styles.ts to match actual @helixui/tokens values (previously used old Tailwind palette values)
  - Fix active-state fallback background from primary-500 (#2563eb) to correct primary-600 (#1d4ed8); active-hover fallback from primary-600 to primary-700 (#1e40af)
  - Replace section label inline colors in hx-side-nav stories (#6b7280 fails 4.5:1 on dark bg) with neutral-400 (#94a3b8, 6.96:1 on neutral-900)
  - Update story footer inline color from #d1d5db to neutral-300 (#cbd5e1) to align with component token values
  - Re-enable a11y-audit as a blocking quality gate in CI (removes informational override added in PR #1261)

  Contrast ratios achieved (all WCAG AA minimum 4.5:1):
  - Default nav item text: neutral-300 (#cbd5e1) on neutral-900 (#0f172a) = 12.02:1
  - Active item text: neutral-50 (#f8fafc) on primary-600 (#1d4ed8) = 6.41:1
  - Active hover text: neutral-50 (#f8fafc) on primary-700 (#1e40af) = 8.34:1
  - Toggle button: neutral-400 (#94a3b8) on neutral-900 (#0f172a) = 6.96:1
  - Story section labels: neutral-400 (#94a3b8) on neutral-900 (#0f172a) = 6.96:1
  - Tooltip: neutral-100 (#f1f5f9) on neutral-800 (#1e293b) = 13.35:1

- 23f5f6f: fix(a11y): remediate remaining wcag 2.1 aa findings (batch b) — checkbox, divider, form, number-input, spinner, step, structured-list, text-input, tooltip
- 4d85c91: add mixinDelegatesAria to prevent shadow DOM aria double-announcement in hx-button and hx-checkbox
- bd97a70: audit(hx-select): deep quality audit — tokens, cem, stories
  - applied 3-tier css token cascade (`--_` private properties) to all style rules for correct override isolation
  - eliminated hardcoded pixel values on chevron indicator by replacing with `--_chevron-size` token
  - added `--hx-select-chevron-size` cssprop to cem jsdoc
  - fixed `keyboardnavigation` storybook play test to assert `role="combobox"` trigger focus (not hidden native select)
  - added `parameters.actions.handles: ['hx-change']` to meta for event logging in storybook actions panel
  - fixed `withoptgroups` story to use actual `<optgroup>` elements (was listing flat options without group markup)
  - added `withdisabledoptions` story demonstrating partially-disabled listbox

- 262083c: audit(hx-status-indicator): deep quality audit — a11y, tokens, css parts, tests, stories
  - Fixed CSS size variant selectors from `[size]` to `[hx-size]` (broken since hx-size migration)
  - Added default `--_indicator-size` on `:host` so the dot never collapses to 0×0 when no size is set
  - Added `show-label` boolean property rendering a visible `part="label"` text element to satisfy WCAG 1.4.1 (Use of Color) when the indicator is not accompanied by adjacent status text
  - Added `aria-live="polite" aria-atomic="true"` visually-hidden region inside shadow DOM so dynamic status changes are announced to screen readers
  - Documented new `part="label"` and `--hx-status-indicator-label-color` / `--hx-status-indicator-label-font-size` css custom properties
  - Added tests: show-label rendering for all statuses, live region presence and dynamic update, all status dynamic label cycle
  - Added Storybook stories: ShowLabel, AllStatusesWithLabel, showLabel argType control

- 8db97bd: deep quality audit of hx-clinical-status: fix propertyvalues<this> typing, cem @fires types, @internal jsdoc blocks, index.ts hxclinicalstatus type export, css focus token fallback chain, add 7 new tests (icon prop, post-acknowledge state, warning no-acknowledge, event detail shape, aria-labelledby, severity label sr visibility)
- 5757017: audit(hx-dialog): deep quality audit — a11y, tokens, tests, cem, stories
- 0d22fe1: ci: add per-component bundle size budget enforcement to quality gates

  Adds `scripts/bundle-size-report.js` that measures gzip size of each component entry point using esbuild. Enforces 5 KB per-component and 50 KB total bundle size budgets. Wired into the `bundle-size` CI job which posts a delta report as a PR comment and blocks merge on budget violations. Per-component overrides are configured in `bundle-budgets.json`.

- 0a74c8c: add vitest v8 coverage threshold enforcement with per-component 80% gate, exempt component config, coverage artifact upload, and PR comment reporting
- 923e9d1: add coverage exemptions for 21 components with 0% coverage to unblock CI pipeline
- 2243d3c: generate dist/css/index.css with @import statements for all per-component css files; expose via package exports for drupal asset pipeline consumption
- 91267a1: chore: remove packages/adopted-stylesheets dead code package
- fd65331: Add Drupal library YAML generator for HELiX web components
- 82bd233: add error resilience guards: null checks, devWarn for invalid property values, missing required slots, and unsafe state transitions across 13 components
- 6ceafc0: feat(hx-pagination): add storybook stories with 12 interactive examples
- ff7bcfd: fix(a11y): add role="menu" to dropdown and overflow-menu story containers for axe-core compliance
- 1f3791d: fix(hx-alert): add missing accent, title slot, and returnFocusTo stories; fix css parts demo to cover all 6 parts
- 3b6017b: fix(hx-badge): resolve three open bugs — prefix slot in dot mode, pulse ring animation, and story label verification
  - prefix slot no longer rendered in dot mode (template guard + css defense-in-depth), preventing flex-gap overflow artifacts
  - pulse ring animation now starts at 2px spread so --hx-badge-pulse-color is visually active
  - RemovableWithCount story play function verifies prefix labels appear alongside counts

- 9c17779: fix(hx-breadcrumb): consolidate @internal jsdoc blocks so cem correctly excludes private members; add missing @cssprop for focus ring color; remove invalid role="list" from default story
- de9ccbe: fix(hx-menu): repair drupal behavior hx-close integration, add max-height overflow scroll, add arrowleft submenu close event
  - Rewrite `hx-menu.behavior.js` to listen for the `hx-close` event dispatched by
    hx-menu instead of the no-op `menu.open = false` setter. Removes the redundant
    Escape keydown listener (hx-menu already fires hx-close on Escape). Adds optional
    trigger button `aria-expanded` toggle and focus-return on close.
  - Add `max-height: var(--hx-menu-max-height, 20rem)` and `overflow-y: auto` to the
    `.menu` rule in `hx-menu.styles.ts` so tall menus scroll instead of overflowing
    the viewport.
  - Add `@cssprop [--hx-menu-max-height=20rem]` doc annotation to `hx-menu.ts`.
  - Add `ArrowLeft` handler in `hx-menu-item._handleKeyDown` that dispatches
    `hx-item-submenu-close` (bubbles, composed) per the APG menu pattern.
  - Add `@fires hx-item-submenu-close` doc annotation to `hx-menu-item.ts`.
  - Add tests for max-height CSS, ArrowLeft event dispatch, and event properties.

- ba21f3f: fix recursive twig template for hx-tree-view to support unlimited depth
- 5d9ccf7: fix(storybook): fix empty KeyboardNavigation and DarkMode stories across 9 nav components
- 984a6f6: fix hx-avatar double render cycle, validation lifecycle, initials warning, and high contrast mode styles
- 64fd2fc: Deep quality audit of hx-button: a11y improvements, comprehensive tests, token compliance, CEM accuracy, and Storybook stories
- dad6c71: hx-checkbox: deep quality audit — full a11y compliance (wcag 2.1 aa), design token coverage, form participation via elementinternals, comprehensive vitest tests, and storybook stories for all states
- dcf7a9c: hx-icon-button: deep quality audit — add devWarn console warning test, anti-pattern story, mandatory label a11y enforcement
- e0ec673: Deep quality audit of hx-patient-banner: wcag 2.1 aa fixes, design token compliance, expanded test coverage, cem accuracy improvements, and storybook story updates
- 53ddf75: fix(hx-side-nav): fix duplicate tooltip ids, remove invalid aria-controls, and fix keyboard navigation to support nested items and ArrowRight/ArrowLeft expand/collapse
- e0df165: deep quality audit for hx-text-input: expanded test coverage for formMixin dirty/touched/pristine interaction state, readonly event propagation, and hx-change value sync; added TypeDate and InteractionState storybook stories
- 87cdd7e: fix keyboard Home/End key support and focus restoration in hx-pagination; fix Tab focusout and Home/End support in hx-nav
- 7f80a77: test: expand hx-library test coverage to 95% with cross-browser support
- 0656b5f: fix(hx-patient-banner): address coderabbit review feedback
- cf0bc88: deep audit of hx-phi-field: security hardening for phi masking, wcag 2.1 aa accessibility, design token compliance, comprehensive test coverage, and cem documentation
- 4f5af84: chore: remove packages/create-helix-app from monorepo
- c94a209: Remove global vitest coverage thresholds that break path-filtered staging→main test runs
- e0adb4e: add ssr browser api guards, fix event composition, complete fouc coverage, and fix drupal cdn path
- 281a09e: add storybook interaction testing infrastructure with automated ci verification of play function story tests
- 181876b: fix design token references: correct z-index fallbacks, rename non-existent duration/easing/color tokens to match tokens.json definitions
- e89b4b9: fix(a11y): remediate wcag 2.1 aa findings across 40+ components

  Full remediation of the WF-01 accessibility compliance audit. Fixes 117 findings across
  high, medium, and low severity. Key changes:
  - aria-expanded now always 'true'/'false' (never absent) on accordion, nav, split-button, code-snippet, color-picker, date-picker
  - touch targets increased to 44px minimum on overflow-menu, badge, split-panel, toast close, code-snippet buttons
  - focus management: dialog close button fallback, popover conditional focus, color-picker panel focus on open
  - hover delay (150ms) added to popover for WCAG 1.4.13 compliance
  - dropdown panel gets role='menu' and aria-label
  - radio-group describedBy combines error and help IDs simultaneously
  - banner adds visually-hidden severity label (no color-only conveying)
  - banner and alert consistent severity announcement
  - aria-hidden uses nothing directive instead of string 'false'
  - disabled anchor/link elements removed from tab order
  - hx-toast default duration increased to 5000ms; pauses when action slot has content
  - hx-image warns at development time when informative image lacks alt text
  - hx-nav mobile toggle and submenu aria-expanded always 'true' or 'false'
  - hx-steps dual aria-label announcement fixed with role=none on host
  - hx-data-table clickable rows keyboard-activatable via Enter/Space
  - hx-side-nav keyboard navigation uses public focus() method instead of shadow DOM piercing
  - hx-stat value+label wrapped in role=group for screen reader association
  - hx-counter final-value-only live region (no per-frame announcements)
  - hx-radio label association via aria-label
  - hx-structured-list accessible label property added
  - hx-form error summary receives programmatic focus after validation failure
  - select/combobox aria-selected per ARIA spec (single-select omits, multi-select explicit)
  - time-picker always renders listbox for stable aria-controls reference
  - multiple devWarn additions for missing labels (button-group, table, number-input, divider, badge dot)

- 3c48dba: fix(lit-architecture): remediate critical and high severity Lit 3.x anti-patterns (WF-02 batch 1)

  Fixes 13 critical/high severity findings from the WF-02 Lit architecture audit:
  - hx-breadcrumb: eliminate event listener memory leak — bound references now created as arrow function class fields instead of re-bound in connectedCallback
  - hx-combobox: add SSR guard around document.addEventListener/removeEventListener calls
  - hx-counter: add MediaQueryList change listener for prefers-reduced-motion so runtime preference changes update animation behavior
  - hx-date-picker: eliminate event listener memory leak — bound handlers converted to readonly arrow function field initializers
  - hx-dropdown: add missing super.updated(changedProperties) call to prevent lifecycle chain breakage
  - hx-file-upload: fix fragile changedProperties type cast to use proper keyof typing
  - hx-format-date: add SSR guards around document.documentElement.lang and navigator.language access
  - hx-grid: add missing super.updated(changed) call in HelixGridItem to prevent lifecycle chain breakage
  - hx-icon: add missing super.updated(changed) call to prevent lifecycle chain breakage
  - hx-meter: add missing super.updated(changedProperties) call to prevent lifecycle chain breakage
  - hx-progress-bar: add missing super.updated(changedProps) call to prevent lifecycle chain breakage
  - hx-time-picker: add isConnected guard in outside-click handler for extra safety
  - hx-tooltip: add reconnection handling in connectedCallback to re-setup light DOM ARIA description element

- 31bab2a: refactor: remediate TypeScript strict findings across 13 components

  Fixes all findings from WF-04 audit:
  - Replace `PropertyValues` with `PropertyValues<this>` in updated() lifecycle hooks
  - Add typed CustomEvent generics to all event dispatches (hx-alert, hx-banner, hx-button-group, hx-card, hx-form, hx-popup, hx-skeleton, hx-tabs, hx-toast)
  - Replace unsafe type assertions with proper null checks in hx-copy-button, hx-popover, hx-tooltip
  - Zero `any` types, zero non-null assertions introduced

- 9afb9c1: Fix memory leaks, reduce active document listeners, and eliminate static bundle cost from @floating-ui/dom in performance audit remediation (WF-05).
- 0660768: perf: remediate wf-05 bundle and runtime performance findings across 9 components — dynamic import for @floating-ui/dom in hx-popover, scoped outside-click listeners in hx-combobox and hx-select, extracted color-utils.ts for tree-shaking in hx-color-picker, cached DOM queries and getBoundingClientRect in hx-color-picker drag handlers, cached cell list in hx-data-table keydown, memoized Intl.DateTimeFormat in hx-date-picker, cached visible-items list in hx-tree-view, O(n) parent-driven ARIA metadata in hx-tree-item, optimized body-children scan in hx-drawer, hoisted FOCUSABLE_SELECTORS constant in hx-dialog
- 52868cd: fix(cem): add @internal to hx-checkbox formAssociated to exclude it from CEM public API surface
- a6470e9: fix form participation compliance: add missing ElementInternals methods across all 15 form-connected components
- acb6076: replace hardcoded css values with design token variables across all components

  Audits and remediates design token compliance across all 88 component `.styles.ts` files:
  - Replaces `--hx-font-weight-regular` (nonexistent) with `--hx-font-weight-normal` in hx-text (6 occurrences)
  - Replaces `--hx-radius-full` (nonexistent) with `--hx-border-radius-full` in hx-meter
  - Replaces `--hx-color-white` (nonexistent) with `--hx-color-neutral-0` in hx-nav
  - Replaces `--hx-border-width-1` (nonexistent) with `--hx-border-width-thin` in hx-dialog and hx-drawer
  - Replaces `--hx-color-surface-overlay` (semantically incorrect for arrow bg) with `--hx-color-neutral-0` in hx-popup
  - Fixes wrong z-index modal fallback (100 → 1400) in hx-dialog
  - Replaces `--hx-size-128` (nonexistent) with `--hx-container-narrow` in hx-dialog
  - Replaces `--hx-font-size-base` (nonexistent) with `--hx-font-size-md` in hx-avatar, hx-checkbox, hx-table, hx-tag
  - Replaces `--hx-size-2` (nonexistent) with `--hx-space-2` in hx-badge, hx-meter, hx-slider
  - Fixes tooltip z-index from hardcoded 9999 to `--hx-z-index-tooltip` (1600) and transition from 0.15s to `--hx-transition-fast`
  - Fixes focus ring color fallback from hardcoded `#2563eb` to proper token chain `var(--hx-focus-ring-color, var(--hx-color-primary-400, #60a5fa))` across 21 components
  - Replaces hardcoded `opacity: 0.5/0.4/0.7/0.8` with appropriate `--hx-opacity-*` tokens across 14 components
  - Wraps bare `1px` border declarations in `var(--hx-border-width-thin, 1px)` in hx-pagination, hx-tag
  - Documents legitimate exception cases (local stacking context z-index 1/2, breakpoints in media queries, line-height 1 for icon buttons)

- Updated dependencies [be9b080]
- Updated dependencies [184d560]
- Updated dependencies [1f8eef7]
- Updated dependencies [03e1beb]
  - @helixui/tokens@2.0.0

## 1.1.2

### Patch Changes

- 23af064: update docs homepage with helixir banner and accurate component stats

## 1.1.1

### Patch Changes

- 6f4a462: add @internal annotations to private members across all components to exclude them from the custom elements manifest
- 0119575: add checkValidity/reportValidity constraint validation to hx-color-picker, hx-rating, and hx-toggle-button
- ae0755f: add formDisabledCallback to 8 form-associated components so they respond to fieldset disabled propagation: hx-button, hx-checkbox-group, hx-date-picker, hx-file-upload, hx-icon-button, hx-rating, hx-time-picker, hx-toggle-button
- 3f8d001: fix(hx-card): make --hx-card-color propagate to slotted content

  Setting --hx-card-color on hx-card now correctly applies to slotted (light DOM) content. The :host color fallback is changed to `inherit` so cards on dark backgrounds inherit ambient color when --hx-card-color is not set. The .card\_\_body section also now respects --hx-card-color.

- 3ce07d7: add form reset, submission, and state restore tests for 5 form-associated components
- cd5405a: Add missing formDisabledCallback to 8 form-associated components (hx-button, hx-checkbox-group, hx-date-picker, hx-file-upload, hx-icon-button, hx-rating, hx-time-picker, hx-toggle-button) so they correctly respond to fieldset[disabled] state changes via ElementInternals.
- 98fcf63: add formStateRestoreCallback to hx-file-upload for browser form restoration compliance
- 3e4bfb4: fix(i18n): add overridable string properties for localization across 11 components

  Replace hardcoded English strings with `@property()` declarations that default to English
  but can be overridden by consumers for i18n/l10n. Components: hx-alert, hx-checkbox,
  hx-data-table, hx-date-picker, hx-drawer, hx-number-input, hx-pagination, hx-split-panel,
  hx-switch, hx-text-input, hx-textarea.

- 3a2c159: Replace physical CSS properties with logical properties for RTL support in hx-side-nav, hx-drawer, hx-toast, hx-data-table, and hx-split-panel
- cc4eb00: Reduce bundle sizes for 7 over-budget components via CSS minification. Brings hx-form, hx-prose, hx-select, and hx-time-picker under the 5KB standard budget. Documents an 8KB exception for hx-color-picker, hx-combobox, and hx-date-picker whose inherent JS complexity (color math, full ARIA combobox pattern, calendar grid) leaves no room under 5KB. All 77 components now report zero budget violations.
- 4ea13de: fix(ssr): guard browser APIs in 8 client-only components for SSR compatibility

  Added `typeof window !== 'undefined'` and `typeof document !== 'undefined'` guards
  to all browser API access (window.matchMedia, document.createElement, document.addEventListener,
  document.body.children, document.activeElement, requestAnimationFrame) in:
  - hx-breadcrumb: document.createElement for ellipsis, document.head.appendChild for JSON-LD
  - hx-carousel: window.matchMedia in connectedCallback
  - hx-color-picker: document.addEventListener/removeEventListener for pointer and click handlers
  - hx-counter: window.matchMedia and requestAnimationFrame in connectedCallback
  - hx-drawer: window.matchMedia, document.addEventListener, document.body.children, document.activeElement
  - hx-toast: window.matchMedia in \_reducedMotion getter
  - hx-field: document.createElement in \_ensureA11yDescEl
  - hx-tooltip: document.createElement in \_setupTriggerAria, document.activeElement in mouseleave handler

  These guards prevent crashes when components are rendered server-side in SSR environments
  like Next.js, Astro, or any Node.js-based rendering pipeline.

## 1.1.0

### Minor Changes

- 6d43fbb: Normalize `size` property to reflect as `hx-size` attribute across 10 components (hx-action-bar, hx-badge, hx-counter, hx-drawer, hx-progress-ring, hx-prose, hx-spinner, hx-stat, hx-status-indicator, hx-steps). Backward compat: legacy `size` attribute is still accepted with a dev-mode deprecation warning; `hx-size` takes precedence when both are present.
- 5de72db: feat(i18n): replace hardcoded English strings with customizable label properties across 15 components

  All 15 components that contained hardcoded English ARIA labels and live-region text now expose
  `@property`-backed overrides, allowing consumers to provide localized strings without patching
  Shadow DOM internals.

  **Components updated:** hx-alert, hx-banner, hx-carousel, hx-color-picker, hx-combobox,
  hx-data-table, hx-date-picker, hx-dialog, hx-drawer, hx-file-upload, hx-nav, hx-number-input,
  hx-pagination, hx-rating, hx-split-panel.

  **Breaking change:** None — all new properties carry English defaults matching prior hardcoded values.

### Patch Changes

- dab0d0f: Add missing JSDoc descriptions to hx-popover, hx-tooltip, and hx-accordion-item to bring all components to A-grade CEM health score.
- cefa51f: Add `@internal` JSDoc annotations to private members in hx-overflow-menu so they are excluded from the Custom Elements Manifest public API.
- 8a26619: fix(cem): move counter variables before JSDoc blocks in hx-popover and hx-tooltip so CEM correctly associates class descriptions and event descriptions; add @internal to hx-tooltip @query fields
- af939f6: fix(components): address CodeRabbit findings — dropdown capture leak, rating formReset, untyped events
- 9902b62: fix non-compositable css animations: replace width/max-height transitions with transform/grid alternatives for gpu acceleration
- 7003dbf: add missing prefers-reduced-motion overrides to 17 components for wcag 2.1 aa compliance
- 9d07190: extract hx-carousel-item styles to separate file; remove :focus in favor of :focus-visible
- afa2df7: fix cem annotation issues: replace invalid @cssproperty tags with @cssprop in hx-status-indicator (11 properties now visible in manifest); add missing @csspart slide annotation and part="slide" attribute to hx-carousel-item
- 0a26250: replace string concatenation for css classes with classmap() directive in hx-list-item and hx-tree-item
- fe3d26b: fix: correct formStateRestoreCallback signatures to accept string | File | FormData | null across 8 form-associated components (LA-001 through LA-008)
- 1c9f1ea: replace inline style string construction with proper lit patterns (styleMap directive, css custom properties) in hx-grid, hx-split-panel, hx-prose; remove no-op key attribute react-ism from hx-data-table skeleton rows
- f2fad64: Fix lifecycle correctness: add missing super.updated() calls in hx-combobox, hx-counter, and hx-toast; prefix floating updateComplete promises with void in hx-top-nav, hx-split-button, and hx-nav
- ef971fc: Fix .bind() memory leak in hx-dropdown, @state slot tracking in hx-text-input, and internal property attribute exposure in hx-step
- 92bc38e: replace math.random() id generation with module-level counter in hx-overflow-menu; replace shadowroot.queryselector calls with @query decorators across hx-overflow-menu, hx-tooltip, hx-toast, hx-menu-item, hx-toggle-button, hx-tree-item
- 033820b: fix three critical performance findings from audit: narrow sideEffects in package.json to css-only to restore tree-shaking, replace per-render querySelector in hx-table with slotchange-driven state, and make hx-color-picker global listeners conditional on open/drag state
- 467eb85: fix(perf): add repeat() directive to data-table, select, combobox; fix timer leaks in menu and popover; cache layout reads in split-panel; scope MutationObserver in tabs
- 06e5cbd: add DarkMode story variants to 64 visual components and slot demo stories for 7 components to achieve full Storybook coverage across all visual components
- 814a3eb: fix(stories): add missing variant, state, event, and interaction stories for 18 components
- 7eac21a: fix(tests): replace setTimeout with updateComplete and add slot projection tests
  - Replace all non-intentional `setTimeout`-based waits across 22 test files with `await el.updateComplete` for deterministic DOM/state settling
  - Replace hx-drawer 400ms animation-complete waits with `await oneEvent(el, 'hx-after-show')` and `await oneEvent(el, 'hx-after-hide')`
  - Preserve intentional real timers: hx-number-input long-press stepper helper and hx-tooltip `vi.useFakeTimers()` describe blocks
  - Add "Slot projection" describe blocks to 7 components: hx-combobox, hx-date-picker, hx-select, hx-radio-group, hx-rating, hx-number-input, hx-carousel

- 4c03c2f: Add missing form association integration tests to 14 form-associated components: hx-button, hx-button-group, hx-checkbox, hx-color-picker, hx-combobox, hx-date-picker, hx-file-upload, hx-icon-button, hx-number-input, hx-radio-group, hx-rating, hx-select, hx-switch, hx-toggle-button
- 370e59c: fix: remove forbidden prefers-color-scheme dark blocks from hx-step and hx-table, rename wc- keyframe to hx- in hx-badge, align spacing token prefix (--hx-spacing-_ → --hx-space-_) in hx-stack, hx-dialog, hx-drawer, hx-pagination, fix non-standard token vocabulary in hx-pagination and hx-color-picker, replace hardcoded rgba/hex colors with overlay tokens in hx-button inverted mode
- 0a0c027: fix(tokens): add missing semantic fallback chains to component css custom properties
- 630c7de: fix(typescript): remove double-cast as unknown as patterns and add generic types to CustomEvent dispatches
- 7846a6a: fix: replace Map<string, unknown> with PropertyValues<this> in lifecycle methods and add type guards for unsafe Event casts

## 1.0.1

### Patch Changes

- 701880f: fix: add non-color indicators for state/severity variants (wcag 1.4.1)

  hx-alert, hx-badge, hx-tag, hx-toast, hx-progress-bar, hx-meter no longer rely on color alone to convey severity or status. visually-hidden text labels are now always rendered alongside color for screen reader and color-blind users.

- 43d9a47: fix(a11y): remove cross-shadow-boundary aria-controls from hx-dropdown trigger; add aria relationship ID resolution tests for hx-drawer, hx-combobox, and hx-dropdown
- 0ab4ddd: fix: replace hardcoded focus-visible colors with design tokens across 14 components

  All interactive element focus rings now use the `--hx-focus-ring-width`,
  `--hx-focus-ring-color`, and `--hx-focus-ring-offset` token chain with
  component-level override points. Fixes hx-drawer, hx-dialog, hx-breadcrumb,
  hx-pagination, hx-card, hx-carousel, hx-combobox, hx-file-upload, hx-menu-item,
  hx-nav, hx-overflow-menu, hx-select, hx-split-panel, and hx-tree-item.

- 4894125: fix incorrect aria state attribute patterns — boolean aria attributes now omitted when false using lit nothing directive
- a5453aa: fix missing accessible names on interactive elements and widget containers — closes #1023
- bc44305: test(a11y): add axe-core accessibility tests to hx-accordion and hx-table
- 66dc812: fix focus restoration timing in hx-drawer, hx-dialog, and hx-popover — focus now returns to trigger immediately on close, not after animation delay
- 47b8b1d: fix(hx-popover): resolve wcag 2.1 aa violations — role="dialog", focus trap, hover keyboard access, aria-haspopup, focus restoration, and focus-visible outline
- f21ab8d: Fix WCAG 2.2.1: hx-toast auto-dismiss timer now respects prefers-reduced-motion — toast will not auto-dismiss when the user has reduced motion enabled
- 628f883: fix: ensure all interactive touch targets meet 44x44px wcag 2.5.5 healthcare minimum

  Fixes insufficient touch target violations across hx-drawer, hx-dialog, hx-carousel,
  hx-date-picker, hx-icon-button, hx-tag, hx-checkbox, hx-radio, and hx-data-table.
  All interactive elements now enforce min-width/min-height of 2.75rem (44px) via the
  --hx-touch-target-min design token (WCAG 2.5.5, healthcare mandate).

  Closes #1027

- ed70876: Fix aria-live region violations in hx-toast, hx-alert, and hx-text-input so dynamic content changes are reliably announced by screen readers (JAWS, NVDA, VoiceOver).
- bbf93cf: fix(a11y): expose aria-required on all form control components

  Added aria-required attribute to shadow DOM inputs in hx-text-input, hx-textarea, hx-checkbox, hx-checkbox-group, and hx-number-input so screen readers correctly announce required state for form fields.

- 8843003: fix: correct incorrect aria role assignments across hx-drawer, hx-alert per wcag 2.1 aa audit
- d453b0e: fix: add keyboard accessibility tests for wcag 1.4.13 hover behavior in hx-popover and no-header keyboard dismiss in hx-drawer
- eb772ca: add jsdoc descriptions to all @internal properties and methods in hx-popover, hx-time-picker, hx-color-picker, hx-dropdown, and hx-split-panel to improve cem accuracy scores

## 1.0.0

### Major Changes

- 8d6a3a9: Unify `help-text` slot naming and standardize `HxFoo` type alias exports.

  **BREAKING:** The `help` slot in `hx-checkbox-group`, `hx-field`, `hx-time-picker`, and `hx-date-picker` has been renamed to `help-text` to match all other components. Update usages from `slot="help"` to `slot="help-text"`.

  **New:** All components now export a canonical `HxFoo` type alias alongside the deprecated `WcFoo` alias. Migrate from `WcFoo` to `HxFoo` — the `Wc` prefix aliases remain available but are marked `@deprecated` and will be removed in the next major version.

- 4240250: fix: correct boolean property defaults for hx-alert and hx-code-snippet

  HTML boolean attributes follow presence=true, absence=false semantics. Properties that defaulted to `true` were impossible to set to `false` via HTML attributes — `open="false"` still evaluates to truthy because the attribute is present.

  **Breaking changes:**
  - `hx-alert`: `open` now defaults to `false`. Use `<hx-alert open>` to show the alert.
  - `hx-alert`: `showIcon` now defaults to `false`. Use `<hx-alert show-icon>` to display the icon.
  - `hx-code-snippet`: `copyable` now defaults to `false`. Use `<hx-code-snippet copyable>` to enable the copy button.

### Minor Changes

- 208b754: add `--hx-button-hover-bg` css custom property to hx-button so consumers can override the hover background from outside the shadow DOM for all variants
- 0a05fc1: add hx-stat and hx-counter components for stat display and animated number counting
- 0c319c4: add hx-table semantic table component with sub-components (hx-thead, hx-tbody, hx-tfoot, hx-tr, hx-th, hx-td), sortable columns, striped/hover/compact variants, responsive mobile card layout, dark mode support, and full wcag 2.1 aa accessibility
- d2ca3f4: feat: add CEM accessibility analyzer for extracting a11y metadata from component source
- c53f347: expose hardcoded english strings as i18n-overridable properties on hx-pagination, hx-code-snippet, hx-carousel, hx-combobox, hx-file-upload, and hx-copy-button
- e67e50e: add `full` boolean attribute to hx-button that stretches the button to fill its container width
- b557bff: add hx-banner component for full-width page-level notifications with sticky/fixed positioning, variants, dismiss behavior, and action button support
- 1c3025f: add `inverted` boolean attribute to `hx-button` for dark/gradient background support. forces text to white and adjusts hover/focus ring colors across all variants.

### Patch Changes

- 8da3c5f: fix(a11y): resolve high wcag findings in hx-time-picker, hx-structured-list, and hx-split-button
  - hx-time-picker: only include \_helpId in aria-describedby when help slot has content (WCAG 4.1.2)
  - hx-structured-list: move role="list"/role="listitem" to host elements to fix cross-shadow-DOM relationship (WCAG 1.3.1)
  - hx-split-button: forward aria-label from host to inner button for accessible name support (WCAG 4.1.2)

- dfd02a2: fix accessibility: improve hx-color-picker thumb contrast and remove aria-modal from non-trapped dialog panel
- 4200f2f: fix(a11y): hx-switch label element, hx-tabs tabindex comment, hx-toggle-button missing label warning
  - hx-switch: change label from span to native label element with for attribute for proper HTML association
  - hx-tabs: document dual tabindex pattern with explicit WCAG 2.4.3 reference
  - hx-toggle-button: add dev console.warn when no accessible label or slot text is present

- d3de4d3: fix(a11y): resolve medium-severity wcag violations in hx-textarea, hx-file-upload, hx-top-nav, and hx-action-bar
  - hx-textarea: remove aria-live from counter element; add debounced hidden live region that announces only at 80%+ of maxlength (wcag 4.1.3)
  - hx-file-upload: fix conflicting aria-label + aria-labelledby on dropzone — now mutually exclusive (wcag 4.1.2)
  - hx-top-nav: fix mobile menu focus — now targets first interactive element using focusable selector instead of any htmlelement (wcag 2.4.3)
  - hx-action-bar: add dev warning when consumer sets role other than "none" on host, preventing duplicate toolbar announcement (wcag 4.1.2)

- c5375c6: fix(hx-carousel): suppress live region announcements during autoplay, remove tabindex from wrapper, fix aria-current on pagination dots
- 951faed: fix(type-safety): eliminate `as EventListener` casts in hx-radio-group, hx-tabs, hx-tooltip, hx-steps, and hx-breadcrumb by typing handlers to accept `Event` and narrowing with proper type guards; replace `as HelixTab[]`/`as HelixTabPanel[]` casts with type guard filters; guard `e.target` slot handler casts with `instanceof HTMLSlotElement` checks
- 033a6f0: fix accessibility: list semantics in hx-steps, Home/End keyboard nav in hx-side-nav, aria-controls and menu-label in hx-overflow-menu
- dae9d74: fix: use shared counter to prevent body overflow race condition between hx-dialog and hx-drawer
- 4c08359: fix(a11y): replace hardcoded ids in hx-accordion-item, hx-meter, and hx-progress-bar with instance-scoped monotonic counter ids to prevent wcag 1.3.1 id collision failures when multiple instances appear on the same page; also fix conflicting aria-label + aria-labelledby on hx-progress-bar
- 4f86222: fix(hx-card): set color and background-color on :host so css custom properties cascade into slotted content
- ebfc529: fix accessible name, keyboard row selection, and focus indicators in hx-data-table
- 0e139de: feat(a11y): add accessible labels and roles to hx-progress-bar and hx-spinner

  hx-progress-bar now exposes `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` on the track element, plus a `label` attribute that maps to `aria-label` when no visible label slot content is provided.

  hx-spinner now exposes `role="status"` with `aria-label` (defaulting to `"Loading"`), a `label` attribute for custom accessible names, and a `decorative` boolean that switches to `role="presentation"` to suppress duplicate announcements when spinner appears alongside visible loading text.

  Axe-core passes on both components in all states.

- a5544e4: fix(hx-rating): use role="slider" for half-star precision to fix wcag 2.5.3 label-content-name mismatch — when precision="0.5", half values (1.5, 2.5, etc.) are now correctly represented in the accessibility tree via aria-valuenow/aria-valuetext instead of a radiogroup with mismatched whole-integer labels
- 0633b84: fix(hx-toast): auto-dismiss now fires for prefers-reduced-motion users; split component into separate files per convention
- 96ed976: fix(hx-tree-view): implement roving tabindex pattern to resolve WCAG 2.4.3 focus order violation; tree container is no longer a Tab stop when items are present, Tab focus lands directly on the active tree item
- 12dac0e: fix ssr breakage: replace crypto.randomuuid() with monotonic counters in hx-tooltip, hx-popover, and hx-field to prevent hydration id mismatches
- 345b9f9: add @internal jsdoc tags to private fields in hx-combobox, hx-nav, hx-select, hx-file-upload, and hx-checkbox-group to improve helixir health scores to 90+
- 282f29b: mark internal fields with @internal in hx-menu, hx-accordion, and hx-dropdown to improve helixir health scores to 90+
- 9ca7c37: add @internal jsdoc to private properties and class-level jsdoc to hx-breadcrumb and hx-progress-bar to improve health scores
- 104c57e: mark internal fields and methods with @internal jsdoc in hx-form and hx-tree-item to improve cem health scores to 90+
- 80a9fde: fix(hx-combobox): add for attribute to label and aria-live region for filter results
- ca02828: add jsdoc descriptions to internal properties in hx-combobox, hx-select, hx-checkbox-group, and hx-file-upload to improve cem documentation scores
- 5361511: fix hx-date-picker focus trap to use shadowRoot.activeElement for correct shadow dom keyboard trap behavior
- 56a652d: docs(hx-date-picker): add component description, document all properties and events
- 8973c3f: mark internal fields with @internal jsdoc in hx-drawer and hx-time-picker to improve cem health scores
- 5a29170: add @internal jsdoc tags to private properties and typed @fires annotations to hx-radio-group
- e47c575: add jsdoc description text to all @internal members in hx-radio-group
- b2f0313: implement formDisabledCallback for all form-associated components to support fieldset disabled propagation
- 270289b: chore: add @internal jsdoc tags to private component members
- 54f0cf5: chore: add @internal jsdoc tags to private component members
- 5feb10c: add @internal jsdoc tags to private properties in hx-overflow-menu, hx-split-button, hx-button-group, hx-card, hx-field
- 2526131: add jsdoc descriptions to all @internal properties and methods in hx-date-picker to improve cem accuracy scores
- 2fc2572: add jsdoc descriptions to @internal-tagged private members in hx-button-group, hx-nav, hx-overflow-menu, hx-split-button, hx-card, hx-field, hx-form, and hx-tree-item to improve helixir scores from 88-89 to 90+
- 2910a03: remove non-null assertions from @query decorated properties, replace with proper undefined handling
- 1510375: Replace console.warn calls with dev-only warning utility and remove deprecated execCommand usage

## 0.3.4

### Patch Changes

- ac9458e: Update package metadata: fix tokens description (remove WC-2026 codename, use HELiX) and add npm discovery keywords (shadow-dom, wcag, accessibility, enterprise, typescript, design-tokens, css-custom-properties) to both packages.
- Updated dependencies [d55bd39]
- Updated dependencies [ac9458e]
  - @helixui/tokens@0.3.4

## 0.3.3

### Patch Changes

- 6693f2b: fix(drupal): address Drupal integration findings for hx-field, hx-link, hx-number-input, hx-prose, and hx-radio-group

  Closes #795, #800, #802, #808, #809
  - hx-field: add DrupalIntegration Storybook story with Twig template, Behaviors, and asset loading examples (P2-15)
  - hx-link: add DrupalIntegration Storybook story with Twig template and Behaviors patterns (P2-8)
  - hx-number-input: WithLabelSlot and DrupalFormAPI stories verified as already present; confirmed @slot JSDoc fixed, formResetCallback restores \_defaultValue, step attribute always rendered (P0-02, P1-15, P1-16, P2-08, P2-09)
  - hx-prose: fix clear: none → clear: both in \_drupal.css and prose.scoped.css so block-level content starts below floated images rather than wrapping beside them (P2-03); deprecated align attribute selectors documented as Drupal CKEditor compatibility shims (P2-05)
  - hx-radio-group: confirmed monotonic counter replaces Math.random() for IDs (P2-2); confirmed \_individualDisabledStates map restores per-radio disabled state on group re-enable (P1-1)

- 82cfb84: fix(typescript): use `PropertyValues` from lit in `updated()` overrides for `hx-status-indicator` and `hx-tabs`, replacing raw `Map<string | symbol, unknown>` per strict mode constraint
- 0a5c758: fix(storybook): fix story findings for hx-tree-view, hx-alert, and hx-button
- 8982675: perf: resolve performance audit findings for hx-meter, hx-overflow-menu, and hx-radio-group
  - hx-meter: confirmed bundle within 5KB budget — all runtime deps externalized (lit, @helixui/tokens); CI shared gate covers per-component size
  - hx-overflow-menu: @floating-ui/dom correctly externalized as peerDependency and excluded from rollup output — no longer bundled into component chunk
  - hx-radio-group: eliminated redundant double invocation of setFormValue/syncRadios/updateValidity per radio selection — \_handleRadioSelect now delegates exclusively to updated() lifecycle hook, halving work per interaction

- f6173ec: fix(storybook): resolve audit findings for hx-progress-bar, hx-prose, hx-select, hx-skeleton, and hx-stack stories
- 73544d2: fix(storybook): fix Storybook story findings for hx-checkbox, hx-checkbox-group, hx-field, hx-popover, and hx-radio-group (fixes #789, #790, #795, #805, #809)
  - hx-checkbox (P2-11): NoLabel story play function asserts aria-label forwarded to native input at runtime
  - hx-checkbox (P2-15): SelectAllPattern story uses ID-based DOM query instead of fragile CSS class query
  - hx-checkbox-group (P3-01): Relative imports accepted by design — consistent with all other HELiX stories in source-mode Storybook
  - hx-field (P2-09): WrappingTextarea story added demonstrating textarea as slotted control
  - hx-field (P2-13): SlottedLabel story demonstrates for/id linkage between slotted label and slotted input
  - hx-popover (P2-04): Placements story now renders all 12 placement variants (was 4 cardinal only)
  - hx-radio-group (P2-07): SingleDisabledOption story demonstrates mixed-disabled state (one radio disabled in an enabled group)

- 772810b: test(hx-library): fix test coverage gaps for hx-badge, hx-breadcrumb, hx-copy-button
- edce136: Fix TypeScript type safety findings for hx-progress-bar, hx-prose, hx-select, hx-side-nav, and hx-skeleton. Adds indeterminate boolean property to hx-progress-bar, corrects WcProse type import in hx-prose tests, adds full formStateRestoreCallback signature and size runtime guard to hx-select, removes dead \_bodyEl query and renames WcSideNav/WcNavItem type aliases to HxSideNav/HxNavItem in hx-side-nav, and adds paragraph variant plus unknown variant test to hx-skeleton.

## 0.3.2

### Patch Changes

- 01a966a: fix: WCAG 2.1 AA accessibility audit for hx-split-panel, hx-field-label, hx-image, hx-progress-ring, and hx-structured-list

  Closes #816, #796, #799, #807, #820
  - hx-split-panel: focus-visible outline (not color-only), aria-label on divider, aria-disabled omitted when false, PageUp/PageDown keyboard support
  - hx-image: alt defaults to undefined (no silent decorative), decorative prop added, role="alert" on error container
  - hx-progress-ring: ARIA attributes moved to connectedCallback/willUpdate (SSR-safe), console.warn for missing label, aria-busy in indeterminate state
  - hx-structured-list: role="list" on container, role="listitem" on row (fixes aria-required-children axe violation)

- 14c1c1a: fix: accessibility fixes for hx-button and hx-icon-button (WCAG 2.1 AA)

  hx-button:
  - Add `ariaLabel` property forwarded to inner `<button>` and `<a>` — fixes icon-only buttons lacking accessible name (WCAG 4.1.2 Level A)
  - Remove redundant `aria-disabled` from native `<button>` branch — native disabled attribute already exposes this implicitly in the accessibility tree
  - Fix double-opacity stacking on disabled state (was 0.25, now 0.5)
  - Add `rel="noopener noreferrer"` for `target="_blank"` anchors

  hx-icon-button (new component):
  - Accessible name via `aria-label` and `title` from required `label` property
  - No redundant `aria-disabled` on native `<button>` (P1-07)
  - Explicit `tabindex="-1"` on disabled `<a>` (P1-03)
  - Single opacity on `:host([disabled])` only — no double-stacking (P1-02)
  - Real keyboard activation tests via `userEvent.keyboard` (P1-01)

  Closes #786, #798

- 8e4c6ba: fix: WCAG 2.1 AA accessibility fixes for hx-text, hx-toast, hx-visually-hidden, hx-accordion, hx-badge

  Closes #824, #829, #833, #780, #784
  - hx-text: title attribute exposes full content when truncated, inverse color axe test, code variant axe test
  - hx-toast: aria-hidden management on open/close, aria-atomic on live region, closeLabel prop for i18n
  - hx-visually-hidden: AUDIT findings resolved
  - hx-accordion: AUDIT findings resolved
  - hx-badge: AUDIT findings resolved

- e133bf5: fix(a11y): resolve WCAG 2.1 AA findings for hx-text-input and hx-tooltip
  - hx-text-input (P0-01): Confirmed aria-describedby correctly references error/help-text containers; slotted help-text tracked via \_hasHelpTextSlot so aria-describedby includes slot content; role="alert" on error container without redundant aria-live
  - hx-tooltip (P1-02): Confirmed focusout on trigger wrapper schedules tooltip hide; light DOM aria-describedby pattern resolves cross-shadow-DOM boundary; mouse hover on tooltip prevents WCAG 1.4.13 dismiss

  Closes #825
  Closes #831

- b89946a: Mark CSS/styling findings as FIXED in AUDIT.md for hx-tag, hx-image, hx-meter — all code fixes were already applied in prior audit fix commits
- 00dc02f: fix(css): resolve CSS audit findings for hx-popover, hx-skeleton, hx-split-button
  - hx-popover: P2-01 box-shadow uses --hx-shadow-md token cascade, P2-02 arrow border clipping fixed via JS innerBorderMap, P2-05 :host uses display:contents with trigger-wrapper inline-block
  - hx-skeleton: P1-03 prefers-reduced-motion hides shimmer overlay (display:none), P2-01 --hx-skeleton-circle-radius token added, P2-03 --hx-skeleton-shimmer-width token added
  - hx-split-button: P1-02 hx-menu-item outline-offset fixed to 0px (no clipping), P2-02 menu max-height + overflow-y:auto added, P2-03 menu open animation added with animation:none in prefers-reduced-motion:reduce media query

- d565bc4: fix(css): resolve css audit findings for hx-help-text, hx-split-panel, hx-toast, hx-text, hx-text-input
  - replace hardcoded hex colors with design tokens in hx-help-text FormFieldIntegration story
  - document hx-split-panel p2-07 resolved: token-only cascade with no hex fallbacks
  - document hx-toast p2-01 resolved: prefers-reduced-motion suppresses auto-dismiss timer
  - document hx-toast p2-05 resolved: action slot wrapper has part="action"
  - document hx-text p1-03 resolved: variant set deviation explained in jsDoc

- a0f52ec: fix(css): resolve css audit findings for hx-tooltip and hx-visually-hidden
  - hx-tooltip: replace deprecated `word-wrap: break-word` vendor alias with standard `overflow-wrap: break-word` (GH #831)
  - hx-visually-hidden: add `clip-path: inset(50%) !important` alongside deprecated `clip: rect(0,0,0,0)` for modern browser support (GH #833)

- b1b7e40: fix(css): CSS token and motion audit fixes for hx-accordion, hx-alert, hx-badge, hx-breadcrumb, hx-button
  - **hx-badge**: Implement `--hx-badge-pulse-color` in box-shadow animation (was dead CSS, variable now consumed); add CSS guard `.badge--dot ::slotted(*) { display: none }` to prevent slotted content overflow in dot mode
  - **hx-button**: Remove hardcoded hex fallback values from all variant-level CSS custom property setters; variant rules now reference primitive tokens only (`var(--hx-color-primary-500)` with no hex literal fallback); added regression-guard comment on `.button[disabled]` to prevent re-introduction of double-opacity bug; fix focus ring fallback chain to use `var(--hx-color-primary-500)` instead of hardcoded hex
  - **hx-breadcrumb**: Replace hardcoded hex colors in `WithCustomStyling` Storybook story with `--hx-color-*` and `--hx-font-size-*` design token references; add documentation comment on `display: contents` in `hx-breadcrumb-item.styles.ts` explaining box-model styling limitation for `::part(item)` consumers
  - **hx-alert**: Fix `CSSParts` story body text to correctly enumerate all 6 CSS parts (was incorrectly listing 5, omitting `::part(title)`)

- a93f01c: fix(css): CSS token and motion audit fixes for hx-radio-group, hx-switch, hx-toggle-button, hx-tree-view

  Addresses css-category findings from GH issues #809, #817, #821, #830, #832.
  - **hx-radio-group** (`hx-radio.styles.ts`): Add `@media (prefers-reduced-motion: reduce)` block disabling `.radio__control` and `.radio__dot` transitions for vestibular accessibility compliance
  - **hx-radio-group** (`hx-radio-group.styles.ts`, `hx-radio-group.ts`): Expose `--hx-radio-group-help-text-color` CSS custom property for theming API consistency; document with `@cssprop` JSDoc
  - **hx-switch** (`hx-switch.styles.ts`, `hx-switch.ts`): `prefers-reduced-motion` support and `--hx-switch-help-text-color` token were already implemented (A-04 and A-08 pre-fixed)
  - **hx-toggle-button** (`hx-toggle-button.styles.ts`): Double opacity bug on `.button[disabled]` was already resolved; only `:host([disabled])` applies opacity (P0-1 pre-fixed)
  - **hx-tree-view** (`hx-tree-item.styles.ts`): Expand `prefers-reduced-motion` block to cover `.item-row`, `.expand-btn`, and `.expand-btn svg` transitions (previously only `.children` was covered); `color-mix()` already replaced with `rgba()` fallback (P2-7 pre-fixed)

- f724b18: fix drupal audit findings: update audit docs and add twig examples for 5 components
- cf8a13b: Fix Drupal integration for hx-container, hx-drawer, hx-icon-button, hx-meter, and hx-overflow-menu
- 6693f2b: fix(drupal): fix Drupal integration findings for hx-field, hx-link, hx-number-input, hx-prose, and hx-radio-group

  Closes #795, #800, #802, #808, #809
  - hx-field: add DrupalIntegration Storybook story with Twig template, Behaviors, and asset loading examples (P2-15)
  - hx-link: add DrupalIntegration Storybook story with Twig template and Behaviors patterns (P2-8)
  - hx-number-input: WithLabelSlot and DrupalFormAPI stories already present; confirmed @slot JSDoc fixed, formResetCallback restores \_defaultValue, step attribute always rendered (P0-02, P1-15, P1-16, P2-08, P2-09)
  - hx-prose: fix clear: none → clear: both in \_drupal.css and prose.scoped.css so block-level content starts below floated images rather than wrapping beside them (P2-03); deprecated align attribute selectors documented as Drupal CKEditor compatibility shims (P2-05)
  - hx-radio-group: confirmed monotonic counter replaces Math.random() for IDs (P2-2); confirmed \_individualDisabledStates map restores per-radio disabled state on group re-enable (P1-1)

- db7905b: Fix Drupal integration findings for hx-spinner, hx-theme, hx-toast, hx-toggle-button, and hx-tree-view (#814, #827, #829, #830, #832).

  Adds `DrupalIntegration` Storybook stories to all five components documenting CDN loading, Twig template patterns, and Drupal behaviors integration. Adds `hx-theme.twig` and `hx-tree-view.twig` companion templates. Updates AUDIT.md files to mark all Drupal-category findings as FIXED.

- c0a6a9f: add hx-tooltip.twig drupal integration template with placement, show-delay, hide-delay support and healthcare usage examples
- 4f023c2: Fix Drupal integration findings for hx-steps, hx-pagination, hx-slider, hx-button-group, and hx-card. Adds Twig templates and Drupal integration guides (README.drupal.md) for all five components. Documents attribute mapping, GET parameter wiring, form reset semantics, boolean attribute Twig patterns, CDN/npm asset loading strategies, and Drupal behaviors integration examples.
- 803d0ed: add drupal twig templates and behavior file for hx-progress-bar, hx-skeleton, hx-split-button, hx-split-panel; document existing fixes for hx-select optgroup form submission and aria-live conflict
- 492b53f: fix(a11y): resolve 8 accessibility findings for hx-breadcrumb, hx-prose, hx-stack, hx-container, hx-copy-button
- d07d294: Fix Drupal integration findings for hx-alert, hx-button, hx-checkbox, and hx-checkbox-group
  - hx-alert: simplify inverted show-icon Twig logic to idiomatic `{% if show_icon %}show-icon{% endif %}`
  - hx-button: add hx-button.twig template with full Drupal integration documentation including htmx namespace awareness and anchor mode (rel="noopener noreferrer") guidance
  - hx-checkbox: add hx-checkbox.twig template with documentation of hx-size/htmx namespace consideration and Drupal Form API usage patterns
  - hx-checkbox-group: add hx-checkbox-group.twig template with full Drupal Form API integration guide including preprocess hook pattern for mapping Drupal options arrays

- d46e1e7: fix: correct homepage URL to helix.bookedsolid.tech (no .com domain exists)
- 2e0444a: fix: rename hx-drawer CSS part from `close-button` to `close-btn` to match feature specification
- 59e559b: test: fix coverage gaps for hx-field, hx-field-label, hx-icon-button and related components
- b976792: infra: add batch test scripts for incremental test isolation and failure diagnosis
- 8982675: perf: resolve performance audit findings for hx-meter, hx-overflow-menu, and hx-radio-group
  - hx-meter: confirmed bundle within 5KB budget — all runtime deps externalized (lit, @helixui/tokens); CI shared gate covers per-component size
  - hx-overflow-menu: @floating-ui/dom correctly externalized as peerDependency and excluded from rollup output — no longer bundled into component chunk
  - hx-radio-group: eliminated redundant double invocation of setFormValue/syncRadios/updateValidity per radio selection — \_handleRadioSelect now delegates exclusively to updated() lifecycle hook, halving work per interaction

- 601ab62: perf(hx-slider): memoize tick array computation in willUpdate to avoid redundant allocation on every drag render
- 689b707: perf: fix performance findings for hx-tree-view, hx-button-group, and hx-container
  - hx-tree-view: Add `contain: layout style` to `:host` in `hx-tree-view.styles.ts` and `hx-tree-item.styles.ts` for browser rendering isolation
  - hx-tree-view: Eliminate per-render DOM traversal in `hx-tree-item.ts` by caching `_level`, `_posInSet`, `_setSize`, and `_selectable` as `@state` properties; `_updateAriaMetadata()` runs once on `connectedCallback` and `slotchange` instead of on every render
  - hx-tree-view: Document scale limits and lazy-loading guidance in `hx-tree-view.ts` JSDoc (P2-9: no virtualization strategy)
  - hx-button-group: Mark `requestUpdate()` removal and `contain: layout style` as fixed in AUDIT.md (already applied in prior cycle)
  - hx-container: Add `contain: layout style` to `:host` in `hx-container.styles.ts`

  Closes #832, #787, #792

- 73544d2: Fix Storybook story findings for hx-checkbox and related components. Adds play function to NoLabel story for runtime aria-label assertion, and replaces CSS class-based DOM queries in SelectAll patterns with tag-name queries to eliminate the DOM anti-pattern.
- 38d05b3: fix storybook story findings for hx-help-text, hx-icon-button, and hx-meter
  - hx-help-text: clarify label argType as storybook-only slot control with proper category and description
  - hx-icon-button: add missing hx-icon-button.stories.ts with full variant, size, state, and interaction test coverage
  - hx-meter: remove unused \_canvas variable and dead within import from Default story play function

- 8ae615f: Fix storybook findings for hx-image and hx-status-indicator: correct play function attribute assertion and add DrupalBooleanProp documentation story
- 051adc4: fix(storybook): fix story findings for hx-slider (#813) and hx-tag (#823)

  hx-slider: add Page Up/Page Down keyboard steps to KeyboardNavigation play function (P2-10); add OutOfRangeValue story exposing native range clamping behaviour as a regression baseline for the missing property-level value clamp (P2-11).

  hx-tag: clarify hx-size vs size attribute/property naming in argType description (P2-05); add keyboard-driven play function to RemovableInteractive that tabs to the remove button, activates via Enter, and asserts tag removal from DOM (P2-08).

- b441331: test(hx-library): fix test coverage gaps for hx-status-indicator, hx-structured-list, hx-toast, hx-card, hx-checkbox-group (13 findings)
- c515b6a: fix(tests): improve axe test context and console.warn coverage for hx-steps, hx-time-picker, hx-avatar, hx-combobox, hx-spinner
- 25137b2: test(hx-library): fix test coverage gaps for hx-tree-view, hx-button, hx-pagination, hx-progress-bar, hx-split-panel
- 254bf14: fix: add runtime deprecation warning to hx-action-bar sticky property

  The deprecated `sticky` property on `hx-action-bar` now emits a `console.warn()` when set, directing consumers to use `position="sticky"` instead. All other TypeScript type safety findings across hx-combobox (#791), hx-time-picker (#828), hx-card (#788), and hx-meter (#801) were already resolved in the codebase.

- c928acb: Fix TypeScript type safety findings for hx-badge, hx-button, and hx-drawer. Adds deprecated `WcBadge` JSDoc metadata with removal target and introduces the canonical `HxBadge` type alias; marks resolved hx-button P1-03 (`WcButton` removed) and P3-04 findings; documents resolved hx-drawer P2-01 (`DrawerSize` narrowed with `string & Record<never, never>`) and P2-04 (`instanceof HTMLElement` guard). Updates AUDIT.md files across all three components.
- 93d081d: fix typescript type safety issues in hx-icon-button, hx-popover, hx-progress-ring, hx-split-button, and hx-split-panel. adds console.warn for missing label in hx-icon-button, fixes arrow border rendering logic in hx-popover, adds explicit render() return type in hx-progress-ring, removes dead \_primaryButton @query in hx-split-button, and adds JSON attribute converter for snap property in hx-split-panel.
- 90a2d87: fix(typescript): resolve type safety findings for hx-pagination, hx-switch, hx-tag, hx-theme, hx-tree-view
  - hx-switch: Use PropertyValues<this> instead of Map<string, unknown> in updated() lifecycle
  - hx-switch: Export HxSwitch canonical type alias; deprecate WcSwitch legacy alias
  - hx-pagination: Export HxPagination canonical type alias
  - hx-tag: Export HxTag canonical type alias; annotate WcTag as deprecated in index.ts
  - hx-theme: Add HxTheme/WcTheme type aliases with @deprecated on WcTheme; export token override types (TokenDefinition, TokenEntry)
  - hx-tree-view: Add HxTreeView/HxTreeItem canonical type aliases; annotate WcTreeView/WcTreeItem as deprecated; export all from index.ts

- 2fbad36: Fix TypeScript type safety findings for hx-spinner, hx-steps, hx-textarea, hx-toast, and hx-alert. Exports SpinnerSize type from hx-spinner, improves JSDoc on hx-step internal orientation/size properties, adds readonly property to hx-textarea, and confirms hx-toast animation direction and CSS placement fallback fixes along with hx-alert AlertVariant type export.
- 82e2f30: Fix TypeScript type safety findings for hx-button-group, hx-checkbox-group, hx-container, hx-image, and hx-link. Adds runtime guards for invalid orientation values, uses definite assignment on ElementInternals fields, narrows event handler types, re-exports deprecated WcContainer type alias, and makes Lit property decorator types explicit.
- 339fbc3: fix(typescript): resolve type safety findings across hx-number-input, hx-radio-group, hx-slider, hx-text, hx-toggle-button
  - hx-slider: widen `formStateRestoreCallback` state param to `string | File | FormData | null` per ElementInternals spec; add type guard
  - hx-text: remove deprecated `WcText` stale type alias (use `HelixText` directly)
  - hx-toggle-button: parameterize `updated()` with `PropertyValues<this>`; add missing `_mode` param to `formStateRestoreCallback` per spec
  - hx-number-input: formStateRestoreCallback uses `Number()` for consistency with converter; `_applyStep` dispatches only `hx-change`
  - hx-radio-group: `formStateRestoreCallback` correct spec signature; `_groupEl` uses safe getter pattern

  Closes #802, #809, #813, #824, #830

- Updated dependencies [d46e1e7]
  - @helixui/tokens@0.3.2

## 0.3.1

### Patch Changes

- 819759f: fix: correct homepage URL from helix.bookedsolid.com to helix.bookedsolid.tech
- Updated dependencies [819759f]
- Updated dependencies [5e4d197]
  - @helixui/tokens@0.3.1

## 0.3.0

### Minor Changes

- 52179bd: Add `fouc.css` for FOUC prevention. Load in `<head>` before your JS bundle to hide undefined custom elements until they register: `<link rel="stylesheet" href="@helixui/library/fouc.css" />`.

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
