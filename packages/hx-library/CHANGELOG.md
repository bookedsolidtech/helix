# @helixui/library

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
