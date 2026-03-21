---
tags: [api]
summary: api implementation decisions and patterns
relevantTo: [api]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 196
  referenced: 40
  successfulFeatures: 40
---
# api

### Tailwind CSS `darkMode: ['selector', ...]` strategy requires >=3.3.0; `peerDependencies` was tightened from `>=3.0.0` to `>=3.3.0` to enforce this at install time. (2026-03-05)
- **Context:** The tailwind-preset uses `darkMode: ['selector', '[data-theme="dark"]']` which is a Tailwind v3.3.0+ API. The original peer range of `>=3.0.0` would have allowed v3.0.x–v3.2.x installs.
- **Why:** Allowing v3.0–3.2 would cause silent failure: Tailwind would ignore the `darkMode` config without throwing an error, making dark mode appear broken with no actionable error message for consumers
- **Rejected:** `>=3.0.0` was rejected because it permits versions that silently ignore the API; a runtime check or warning inside the preset was not considered since peer version enforcement is the standard npm contract for this class of issue
- **Trade-offs:** Tighter peer range reduces compatibility surface but eliminates a class of silent runtime failures; consumers on older Tailwind must upgrade before adopting the preset
- **Breaking if changed:** Reverting to `>=3.0.0` re-opens the silent failure window — consumers on Tailwind <3.3.0 would install successfully but dark mode would silently not work, making the bug extremely hard to diagnose

#### [Gotcha] JSDoc/documentation claiming a console.warn is emitted when `label` is absent, but no actual `console.warn` call exists in the implementation — silent failure instead (2026-03-06)
- **Situation:** hx-icon-button requires a non-empty `label` for accessibility; JSDoc documents a developer warning that was never implemented
- **Root cause:** Documentation was written speculatively or the warn was removed without updating docs
- **How to avoid:** Without the warn, developers using the component in Drupal/Twig get no signal when they omit the required attribute; accessibility failures are silent

### `hx-size` as an HTML attribute name is non-idiomatic — HTML convention prefixes CSS custom properties with component namespace, not HTML attributes; all other attributes on the component use plain names (2026-03-06)
- **Context:** Web component attribute naming conventions when component tag name has a namespace prefix (`hx-`)
- **Why:** The `hx-` prefix on the tag itself provides namespacing; individual attributes on that element do not need re-prefixing, creating verbose and inconsistent API (`hx-button size="sm"` vs `hx-button hx-size="sm"`)
- **Rejected:** Keeping `hx-size` — already a breaking change to fix; it also breaks normal attribute/property correspondence (property is `size`, attribute is `hx-size`)
- **Trade-offs:** Non-breaking status quo preserves backward compat; fixing would require a major version bump and consumer migration across all Drupal Twig templates
- **Breaking if changed:** Changing to `size` attribute is a breaking change for all existing Twig/HTML consumers using `hx-size="sm"`

#### [Gotcha] aria-haspopup="true" is semantically wrong for menu triggers — ARIA 1.2 requires aria-haspopup="menu" to correctly announce popup type to screen readers (2026-03-06)
- **Situation:** Buttons that open role=menu panels must use aria-haspopup="menu", not the boolean shorthand "true" which maps to aria-haspopup="listbox" in some AT implementations
- **Root cause:** ARIA 1.2 expanded aria-haspopup to accept token values (menu, listbox, tree, grid, dialog); "true" is a legacy alias that maps ambiguously and is not equivalent to "menu"
- **How to avoid:** Correct token value improves AT announcement accuracy with no functional cost; changing is a non-breaking aria attribute fix

### hx-menu-item exposes label, icon, and shortcut via slots (default slot, prefix slot, suffix slot) rather than typed properties/attributes (2026-03-06)
- **Context:** Component API design for a menu item that needs to support label text, an icon, keyboard shortcut display, and submenu indicators
- **Why:** Slot-based composition is idiomatic Lit and allows rich HTML content (not just strings) in each slot position
- **Rejected:** Typed properties (label='Edit', shortcut='Ctrl+E') would enable declarative Twig attribute usage in Drupal, richer CEM tooling introspection, and programmatic item construction without HTML templating
- **Trade-offs:** Slot approach enables HTML composition (icons as SVG elements, formatted shortcuts) but prevents Drupal Twig template patterns like `{{ label }}` and blocks usage patterns like document.createElement('hx-menu-item').label = 'Edit'
- **Breaking if changed:** Adding typed properties as aliases would require keeping slots working simultaneously; removing slots would break all existing usage

#### [Gotcha] CSS parts API exported by hx-tile (base, icon, label, description, badge) completely diverges from the feature spec (tile, header, body, footer) (2026-03-06)
- **Situation:** P1-01: Implementation deviated from spec during development with no apparent reconciliation
- **Root cause:** Implementation-driven naming emerged organically from the component's internal structure rather than from the spec's consumer-facing API contract
- **How to avoid:** The current parts API may better reflect the actual DOM structure, but breaks any consumer or documentation written against the spec

#### [Gotcha] Lit properties without `reflect: true` cause CSS attribute selectors and Drupal SSR hydration conflicts — stale DOM attributes after programmatic changes (2026-03-06)
- **Situation:** hx-image properties like loading, fit, ratio, src, alt not reflected to attributes
- **Root cause:** Reflection adds overhead and Lit discourages it by default to keep property/attribute channels separate
- **How to avoid:** Cleaner Lit architecture but breaks `hx-image[loading='lazy']` CSS selectors, DevTools shows wrong values, Drupal SSR-rendered attributes diverge from hydrated state

### CSS shadow parts named 'base' and 'symbol' instead of spec-required 'star' and 'icon' — a permanent breaking API contract deviation (2026-03-06)
- **Context:** The audit spec defined CSS part names (star, icon) for consumer CSS customization. The implementation chose different names (base, symbol). Part names become permanent once consumers adopt them.
- **Why:** Likely a naming preference during implementation without cross-referencing the spec's public API contract section. 'symbol' is more generic/abstract; 'star' is domain-specific.
- **Rejected:** Aligning with spec names (star, icon) — which would have made consumer CSS written to documentation work correctly
- **Trade-offs:** Renaming before adoption is a one-PR fix; renaming after consumers write ::part(star) rules creates silent breakage with no error
- **Breaking if changed:** Any consumer CSS written to the spec (::part(star), ::part(icon)) silently produces no effect. Once renamed to match spec, any CSS written against the current impl (::part(symbol)) breaks.

#### [Gotcha] TypeScript union type precision: 0.5 | 1 provides zero runtime protection for attribute-driven usage from Drupal CMS (2026-03-06)
- **Situation:** Component is consumed in Drupal via HTML attributes in Twig templates. Drupal CMS data can inject arbitrary attribute values like precision='0.3'.
- **Root cause:** Lit coerces attribute strings to Number type as declared, bypassing TypeScript's compile-time union constraint. The invalid value silently propagates through _clampAndSnap producing fractional states.
- **How to avoid:** Runtime validation adds a few lines but catches CMS data errors early with console warnings; omitting it means debugging mysterious fractional star states in Drupal

#### [Pattern] CEM (Custom Elements Manifest) analyzer surfaces @state()-decorated private fields as undocumented public properties, degrading manifest quality scores (2026-03-06)
- **Problem solved:** Lit's @state() decorator is intended for internal reactive state, but CEM static analysis cannot distinguish private-intent decorated fields from public API fields without explicit annotation.
- **Why this works:** CEM analyzer uses decorator presence as a signal for 'this is a property worth documenting'. Without @private JSDoc tags or explicit --exclude config, _internals, _hoverValue etc. appear as undocumented public API.
- **Trade-offs:** Adding @private JSDoc to all internal @state() fields is low-effort and prevents manifest pollution; without it, doc tooling and IDE integrations show implementation details as public API

#### [Gotcha] ThemeName type is missing 'auto', and effectiveTheme cannot return 'high-contrast' when system=true — the boolean system prop creates an unserializable split API where the attribute surface and the JS property surface are inconsistent (2026-03-06)
- **Situation:** Web components must serialize state to/from HTML attributes; boolean props cannot be expressed as attribute values in a way that composes with the theme string
- **Root cause:** Convenience — boolean is easier to set in markup than theme='system'
- **How to avoid:** Simpler authoring for the common system case, but type system cannot express the full state space and effectiveTheme return type is a lie

#### [Gotcha] Hardcoding strategy:'fixed' in a Floating UI integration breaks popup positioning in scroll-container scenarios where strategy:'absolute' is required (2026-03-06)
- **Situation:** hx-popup hardcoded position strategy to 'fixed' without exposing it as a typed property, making it impossible for consumers to use the component inside overflow:auto/scroll containers
- **Root cause:** 'fixed' strategy works for most viewport-relative popups but is incorrect for scroll-container contexts where the popup should scroll with its container
- **How to avoid:** Hardcoding simplifies the initial implementation but creates a class of layouts where the component cannot be used at all without a fork

#### [Gotcha] Typing flipFallbackPlacements as string[] instead of Placement[] from @floating-ui/core creates a silent type safety hole — invalid placement strings pass TypeScript compilation but cause runtime positioning failures (2026-03-06)
- **Situation:** flipFallbackPlacements accepts the fallback placement order for Floating UI's flip middleware; using string[] instead of the library's own Placement union type means any arbitrary string is accepted
- **Root cause:** Likely took the shortcut of string[] to avoid importing the Placement type from @floating-ui/core
- **How to avoid:** string[] is simpler but provides no IDE autocomplete and no compile-time safety; Placement[] adds an import but catches mistakes at build time

#### [Gotcha] `attribute: 'hx-size'` on a LitElement property created a non-standard HTML attribute name that conflicts with how attribute reflection works and how CSS attribute selectors target it — replaced with standard `size` attribute (2026-03-07)
- **Situation:** P1-4: LitElement's default attribute name derivation (camelCase→kebab-case) would produce `size` naturally; the explicit override to `hx-size` was a namespace prefix cargo-culted from the component name
- **Root cause:** Standard `size` attribute is consistent with native HTML elements (input, select), matches LitElement default behavior, and allows CSS `[size]` selectors to work predictably
- **How to avoid:** Breaking change for any consumer using `hx-size=` in HTML (not JS property binding); 4 test locations and multiple story locations needed updating

### Added `reflect: true` to all key properties (src, alt, loading, fit, ratio, rounded, fallback-src, srcset, sizes, decorative, width, height) so they appear as HTML attributes on the element. (2026-03-07)
- **Context:** P1-04: Default story play function used `getAttribute('alt')` which returned null because `alt` was a Lit property without reflection.
- **Why:** Reflected properties enable: (1) CSS attribute selectors `[loading='lazy']`, (2) testing via `getAttribute()`, (3) Storybook play function assertions, (4) server-side rendering hydration. Without reflection, properties set in JS are invisible to HTML/CSS attribute queries.
- **Rejected:** Not reflecting — simpler, avoids attribute/property sync overhead, but breaks play functions, CSS selectors, and SSR patterns.
- **Trade-offs:** Reflection adds minor overhead (attribute update on every property change) but is essential for Web Component interoperability. Double-representation (attribute + property) can cause confusion about source of truth.
- **Breaking if changed:** Removing reflect would break any CSS attribute selectors, Storybook play functions using getAttribute, and SSR hydration that sets attributes.

### Added a JSON/CSV attribute converter for the `snap` property to support `snap="[25,50,75]"` as an HTML attribute string in Twig templates (2026-03-07)
- **Context:** P1-06: The `snap` property is a number array internally, but Lit does not natively deserialize array attributes from HTML strings
- **Why:** Server-side Twig templates can only emit scalar string attributes; without a custom converter the `snap` array could only be set via JavaScript property assignment, breaking declarative usage in the Drupal component library
- **Rejected:** Requiring JavaScript initialization for snap values — excludes Twig-only usage patterns and breaks the declarative component contract
- **Trade-offs:** Converter adds a small parsing cost per attribute reflection; also requires test coverage for both JSON (`[25,50,75]`) and CSV (`25,50,75`) formats
- **Breaking if changed:** Removing the converter silently breaks `snap` in all Twig/HTML template contexts while JavaScript usage continues to work, creating an invisible discoverability gap

### Use optional chaining (shadowRoot?.querySelector) instead of non-null assertion (shadowRoot!.querySelector) for shadow DOM access in firstUpdated() (2026-03-09)
- **Context:** TypeScript no-non-null-assertion lint rule flagged shadowRoot! access in slot listeners inside firstUpdated()
- **Why:** Optional chaining is safer — if shadowRoot is somehow null (e.g., SSR, declarative shadow DOM edge cases), the code fails silently rather than throwing a runtime TypeError
- **Rejected:** Keeping non-null assertion operator (!) which asserts developer certainty but bypasses TypeScript safety
- **Trade-offs:** Slightly less explicit intent ('I know this exists') but eliminates a class of runtime errors and satisfies lint rules without requiring eslint-disable comments
- **Breaking if changed:** If changed back to !, re-introduces lint warnings and potential runtime throws in edge-case DOM environments

#### [Gotcha] hx-button uses `hx-size` as the HTML attribute name, not `size`, despite the property likely being named `size` internally (2026-03-09)
- **Situation:** Doc page demos were using `size='sm'` which silently did nothing — the component registered the attribute as `hx-size` via `attribute: 'hx-size'` in the property decorator
- **Root cause:** The `hx-` prefix on attributes avoids collisions with native HTML attributes and clearly namespaces component-specific attributes
- **How to avoid:** Attribute names are more verbose in templates/docs but unambiguous and collision-free across the entire hx-* component suite

### ElementInternals.role = 'group' used instead of setting role attribute on host element (2026-03-09)
- **Context:** hx-button-group needs ARIA group semantics without polluting the host element's attribute surface
- **Why:** ElementInternals keeps accessibility semantics in the component internals layer, avoiding attribute conflicts with consumers who might set their own role, and follows the custom elements accessibility API best practices
- **Rejected:** Setting role='group' as a reflected DOM attribute on the host — would conflict if a consumer explicitly sets a different role, and exposes implementation detail as a public attribute
- **Trade-offs:** Cleaner host element API; however ElementInternals.role has slightly less browser support than attribute-based role and is invisible to consumers inspecting the DOM
- **Breaking if changed:** Removing ElementInternals.role without adding a host attribute fallback would silently drop group semantics — axe-core tests would catch this but manual DOM inspection would show no role

### label property sets ElementInternals.ariaLabel; Drupal/Twig integration uses aria-label HTML attribute directly instead (2026-03-09)
- **Context:** Two consumer paths: JS property API and Twig template attribute API needed to both wire up accessible group labels
- **Why:** HTML attributes on custom elements always reflect into ElementInternals — aria-label attribute takes precedence and works identically to the property path. Documenting both paths prevents Drupal devs from trying to set .label via JS when working in Twig
- **Rejected:** Requiring Drupal consumers to use the label property via JS — impossible in pure Twig server-side rendering without a JS initialization layer
- **Trade-offs:** Two documented paths add surface area but eliminate a real integration failure mode for Drupal consumers
- **Breaking if changed:** If ElementInternals.ariaLabel binding is removed, JS property consumers lose the label path; if attribute reflection is removed, Twig/HTML consumers silently get unlabeled groups

### Type re-exports must be explicitly added to index.ts even when the type is already exported from the component's own .ts file (2026-03-09)
- **Context:** WcContainer type was defined and exported in hx-container.ts but was absent from the barrel index.ts, making it invisible to consumers importing from the package root
- **Why:** TypeScript barrel files do not automatically re-export types from internal module files; each public API surface must be explicitly declared in the index
- **Rejected:** Relying on deep imports (e.g., import type { WcContainer } from '.../hx-container/hx-container') — breaks encapsulation and couples consumers to internal file structure
- **Trade-offs:** Explicit barrel exports require maintenance discipline but guarantee stable public API contracts; missing them is a silent failure (no build error, just inaccessible types)
- **Breaking if changed:** Removing the re-export from index.ts silently breaks any consumer doing `import type { WcContainer } from '@helix/hx-library'` with a TS error only at consumer build time

### CDN bundle filename is dist/index.js, NOT dist/helix.min.js — documentation must use the actual build output path, not an assumed conventional name. (2026-03-09)
- **Context:** PR review caught a CDN URL in Astro docs pointing to dist/helix.min.js which does not exist in the actual build output. The real file is dist/index.js.
- **Why:** Build tooling (likely Vite/Rollup) outputs to index.js by default unless explicitly configured to rename. The 'helix.min.js' name was an assumption based on common library conventions that didn't match reality.
- **Rejected:** Keeping helix.min.js and adding a build alias — would require build config changes and is unnecessary complexity when index.js already exists and is the correct output.
- **Trade-offs:** index.js is less semantically descriptive for CDN users but is the ground-truth filename. Docs accuracy beats naming convention.
- **Breaking if changed:** If build config is changed to output helix.min.js, all CDN documentation would need updating simultaneously.

### Type aliases that don't follow the Helix* naming convention (e.g., WcContainer) must be removed — only the canonical HelixContainer export should exist in index.ts. (2026-03-09)
- **Context:** A WcContainer type alias was added to index.ts as a convenience re-export. PR review flagged it as inconsistent with all other components which only export Helix* named classes.
- **Why:** Consistency in the public API surface prevents confusion about which export is canonical. A WcContainer alias implies web-component-generic naming while the rest of the library uses Helix-prefixed branding.
- **Rejected:** Keeping WcContainer as a deprecated alias — would create two names for the same type, causing ambiguity in consumer code and requiring deprecation tracking overhead.
- **Trade-offs:** Removing the alias is a breaking change for any consumer that imported WcContainer, but since this is a launch-ready (pre-release) feature, no consumers exist yet.
- **Breaking if changed:** Any code importing WcContainer from hx-container will break. Post-launch, this removal would require a major semver bump.

### Components export only the `Helix*` class directly — no secondary type aliases like `WcContainer` (2026-03-09)
- **Context:** hx-container initially exported both `HelixContainer` and a `WcContainer` type alias, inconsistent with all other components
- **Why:** Consistency across the component library — all other components follow the single `Helix*` export pattern, reducing API surface and avoiding consumer confusion about which name to import
- **Rejected:** Keeping `WcContainer` as a convenience alias was rejected because it creates two names for the same thing, doubles the export surface, and diverges from the established library-wide convention
- **Trade-offs:** Cleaner, predictable API; any existing consumers using `WcContainer` import will break and must migrate to `HelixContainer`
- **Breaking if changed:** Any downstream code importing `WcContainer` from hx-container will get a compile error if this export is removed

### hx-form exposes a Public Methods imperative API (checkValidity, reportValidity, getFormData, setErrors, clearErrors, etc.) as a first-class documented surface beyond properties/events (2026-03-09)
- **Context:** Standard component docs cover properties and events; hx-form's validation orchestration requires callers to invoke methods imperatively, especially for server-side error injection
- **Why:** Validation state (especially server errors from Drupal) cannot be modeled purely as reactive properties — the host page must push error state into the component after async submission
- **Rejected:** Event-only API where errors are set via dispatched events would invert control and make Drupal integration awkward
- **Trade-offs:** Imperative API is more powerful for integration but deviates from declarative web component conventions; requires explicit documentation or callers won't discover the API
- **Breaking if changed:** Removing setErrors() would eliminate the only mechanism for server-side validation feedback, breaking Drupal and any async form submission pattern

#### [Gotcha] Boolean attributes in Web Components: modal='false' in HTML evaluates to TRUE because attribute presence is truthy regardless of value (2026-03-10)
- **Situation:** hx-dialog modal property was undocumented regarding this behavior, causing consumer confusion when they tried to conditionally disable modal mode via HTML attribute
- **Root cause:** This is a fundamental Web Components spec behavior — hasAttribute() is the correct boolean check, not getAttribute() === 'true'. The platform has no control over this; it must be documented.
- **How to avoid:** closeOnBackdrop uses a custom converter and correctly handles close-on-backdrop='false'; modal follows native boolean spec. Two different behaviors for visually similar properties is a gotcha itself.

### Dialog variant property controls ARIA role attribute (alertdialog vs dialog), not visual styling (2026-03-10)
- **Context:** Audit found variant was documented only as a string type with no explanation of what it actually changes, leading to misuse for visual theming
- **Why:** The distinction between dialog and alertdialog is an accessibility/AT (assistive technology) concern — screen readers announce alertdialog differently and it implies the user must respond. This is a semantic distinction, not visual.
- **Rejected:** Using variant for visual variants (danger, warning, info) like many component libraries do. Rejected because ARIA role is binary (dialog|alertdialog) and conflating it with visual variants would require mapping logic.
- **Trade-offs:** API is semantically precise but surprising — most developers expect 'variant' to mean visual appearance. The naming creates discoverability friction.
- **Breaking if changed:** If variant is expanded to include visual variants, the ARIA role binding must be separated into a dedicated 'role' or 'dialog-type' property to avoid semantic collision

#### [Gotcha] itemId defaults to empty string for hx-accordion-item elements without an id attribute, producing meaningless event payloads (2026-03-10)
- **Situation:** hx-expand and hx-collapse events include e.detail.itemId but the value is only meaningful if the consumer sets id on each hx-accordion-item
- **Root cause:** Component cannot auto-generate stable IDs without coupling to DOM position or adding hidden state
- **How to avoid:** Simple implementation but consumers must remember to set id attributes or event payloads are useless for multi-item tracking

### Package exports use ./components/* wildcard rather than explicit per-component export entries (2026-03-10)
- **Context:** hx-library exposes 73+ components; explicit entries for each in package.json exports would require manual maintenance
- **Why:** Wildcard pattern covers both hx-accordion and hx-accordion-item from a single index.ts barrel without per-component package.json changes
- **Rejected:** Explicit export entries per component — would require package.json updates every time a new component or sub-component is added
- **Trade-offs:** Simpler maintenance but loses ability to tree-shake at the package.json resolution level; bundlers must rely on source-level tree-shaking instead
- **Breaking if changed:** Removing the wildcard and not adding explicit entries breaks all import '@helix/library/components/hx-*' paths for every component

### Drupal pagination uses 0-indexed pages internally but hx-pagination exposes 1-based pages to consumers; conversion happens at the integration boundary via `e.detail.page - 1` in the event handler (2026-03-10)
- **Context:** Drupal's query parameter `?page=0` means page 1, conflicting with the human-readable 1-based convention used by the web component's `hx-page-change` event
- **Why:** Keeping the component 1-based makes it intuitive for all non-Drupal consumers; the conversion cost is a single subtraction at the Drupal adapter layer rather than polluting the component API with a CMS-specific convention
- **Rejected:** Making the component 0-indexed to match Drupal natively — rejected because every other integration (standalone HTML, React, Vue) would then need +1 corrections and documentation would be confusing
- **Trade-offs:** Drupal integrators must remember the -1 conversion; non-Drupal integrators get a clean API with no cognitive overhead
- **Breaking if changed:** Removing the -1 offset in Drupal integration sends users to the wrong page (off by one); changing the component to 0-based breaks all existing event listeners expecting 1-based values

#### [Pattern] Page size change event resets `?page` query param to `0` (Drupal first page) atomically in the same history.pushState call (2026-03-10)
- **Problem solved:** When a user changes items-per-page, the current page offset is no longer meaningful — staying on 'page 3' with a new page size shows the wrong data window
- **Why this works:** Resetting to page 0 on size change prevents stale offset bugs; doing it in one pushState avoids a double navigation or race between two separate state updates
- **Trade-offs:** Simpler server logic; but the component integration layer must own the reset responsibility explicitly

#### [Gotcha] hx-split-button uses `hx-size` attribute instead of native `size` attribute for sizing (2026-03-10)
- **Situation:** Web component sizing prop conflicted with native HTML `size` attribute on form elements
- **Root cause:** The native HTML `size` attribute has semantic meaning on input/select elements; using it on a custom element would create ambiguity and potential conflicts when the component is used inside forms or with CSS selectors targeting [size]
- **How to avoid:** Avoids attribute collision at the cost of a non-standard naming convention that developers must learn

### `trigger-label` and `menu-label` are dedicated attributes for localizing ARIA labels on split button sub-controls (2026-03-10)
- **Context:** Split button has two interactive controls (primary action + chevron trigger) that each need accessible names, and those names must be localizable for i18n
- **Why:** Explicit named attributes allow server-side rendering (Drupal Twig) and static HTML to set localized strings without JavaScript; avoids relying on slot text which may not be readable by all AT in all contexts
- **Rejected:** Deriving ARIA labels from slot content or a single `label` attribute — would not support independent labeling of the two sub-controls or clean i18n workflows
- **Trade-offs:** API surface grows (two extra attributes) but localization and accessibility are first-class without JS workarounds
- **Breaking if changed:** Removing these attributes would force consumers to use JavaScript to set aria-label, breaking SSR/Twig integration and Drupal behaviors pattern

#### [Gotcha] Package scope mismatch between @helix/library (in some docs) and @helixui/library (actual published package) is a silent install failure — npm will install a completely different package or error with no clear message (2026-03-11)
- **Situation:** @helix scope is owned by a different npm entity; @helixui is the correct scope. Docs written before the scope decision propagated incorrectly.
- **Root cause:** Scope was changed from @helix to @helixui after discovering @helix was taken, but search-replace was not applied globally across all documentation
- **How to avoid:** Easy to fix with a global search-replace, but every new doc page written without awareness of the issue will reintroduce it — needs a lint/grep CI check

#### [Gotcha] Storybook ?icon binding targets wrong attribute — component uses show-icon attribute but stories bind ?icon (2026-03-11)
- **Situation:** Component property is showIcon with attribute: 'show-icon'. Storybook render template used ?icon=${args.icon} which creates a boolean attribute named 'icon' that the component ignores.
- **Root cause:** Likely authored before the property was renamed, or by someone unfamiliar with the attribute: option in LitElement @property decorator.

#### [Gotcha] AlertVariant union type defined locally but not exported — consumers cannot write type-safe variant handling (2026-03-11)
- **Situation:** type AlertVariant = 'info' | 'success' | 'warning' | 'error' used internally but absent from index.ts re-exports.
- **Root cause:** Common oversight when types are defined close to implementation — they compile fine internally but the export graph is incomplete.

#### [Gotcha] ariaLabel reactive property (@property({ attribute: 'aria-label' })) shadows HTMLElement.prototype.ariaLabel causing dual aria-label in the accessibility tree (2026-03-11)
- **Situation:** LitElement components that use ARIA attributes as reactive properties conflict with the native ARIA reflection API added in modern browsers
- **Root cause:** The pattern was standard practice before browsers implemented ARIAMixin reflection — now it results in the host element and inner toolbar both advertising aria-label
- **How to avoid:** Some screen readers may announce the label twice when navigating by landmark or toolbar role — inconsistent AT behavior across browsers

#### [Pattern] Deprecated type alias `WcContainer` added alongside canonical `HxContainer` type, with `@deprecated` JSDoc, as a backward-compat shim (2026-03-11)
- **Problem solved:** Consumers using the old `WcContainer` name would get type errors after a rename refactor; a hard break would be a semver major change
- **Why this works:** Exporting both names with a deprecation marker allows consumers to migrate at their own pace while type-checking still warns them about the old name
- **Trade-offs:** Dead code in the type exports; deprecated symbols persist in autocomplete until removed in a future major; but migration path is clear and non-breaking

### size property typed as 'sm' | 'md' | 'lg' | string (intentional union degradation) with JSDoc explanation (2026-03-11)
- **Context:** TypeScript collapses 'sm' | 'md' | 'lg' | string to just string, losing autocomplete for the named sizes. This is a known TS limitation, not a bug
- **Why:** Allows consumers to pass arbitrary CSS size values (e.g., '2rem', '48px') as a convenience override without type errors, enabling responsive/custom sizing without subclassing
- **Rejected:** Strict union only ('sm' | 'md' | 'lg') — blocks legitimate custom size use cases. Separate customSize property — API surface bloat
- **Trade-offs:** Autocomplete for named sizes is lost in IDEs; JSDoc comment is the only documentation of valid named values. Type safety for invalid strings is also lost
- **Breaking if changed:** Tightening to strict union breaks any consumer passing CSS size strings

### label property given reflect: true to match size and variant, enabling Drupal Twig attribute-based setting (2026-03-11)
- **Context:** Drupal Twig templates set Web Component properties via HTML attributes. Without reflect:true, setting label as an attribute does not update the property, breaking server-rendered integrations
- **Why:** Consistency across all three consumer-facing properties (size, variant, label). Drupal/SSR pattern requires attribute→property reflection to work correctly
- **Rejected:** reflect: false (default) — works for JS consumers but breaks Twig/SSR patterns where attributes are the only mechanism
- **Trade-offs:** Slightly larger attribute churn on property changes; reflected attributes are visible in DevTools which aids debugging
- **Breaking if changed:** Removing reflect causes Twig template label attribute to have no effect, silently breaking a11y in Drupal

#### [Gotcha] The anchor property has a dual-mode contract: attribute form accepts CSS selector strings, property form accepts Element references — these must be explicitly documented because the attribute/property reflection asymmetry is invisible to TypeScript consumers (2026-03-11)
- **Situation:** Floating UI needs an actual Element to compute position, but HTML attributes can only carry strings. The component resolves the selector at reposition time, not at set time
- **Root cause:** Web component attributes are always strings; querySelector is the correct bridge for server-rendered HTML (e.g., Drupal/Twig) where element references aren't available. Property form enables framework usage where DOM references are natural
- **How to avoid:** Easier: works in both SSR (Twig/Drupal) and framework contexts. Harder: developers unfamiliar with attribute/property duality may set the attribute to an element reference object (which becomes '[object HTMLElement]') and get silent failures

#### [Gotcha] JSDoc @cssprop default value annotations can silently diverge from actual CSS values, causing CEM to document wrong defaults that mislead consumers (2026-03-11)
- **Situation:** hx-link had --hx-link-color-danger documented as 'var(--hx-color-error-500)' in JSDoc but actual CSS used 'var(--hx-color-error-text)' — two different semantic tokens
- **Root cause:** JSDoc annotations are manually maintained and not validated against actual CSS. When CSS is refactored (e.g., switching from numeric scale tokens to semantic tokens), JSDoc is easily forgotten
- **How to avoid:** Manual auditing catches these but is expensive. The CEM inaccuracy causes consumers to override the wrong token value, a subtle styling bug

#### [Gotcha] formStateRestoreCallback spec signature is (state: string | File | FormData | null, mode: 'restore' | 'autocomplete') — not just (state: string) (2026-03-13)
- **Situation:** hx-slider and hx-toggle-button both had state typed as string-only, causing type errors when the browser passes File or FormData state (e.g. file inputs) or null (cleared state)
- **Root cause:** The ElementInternals spec explicitly allows File and FormData as valid form state types for form-associated custom elements, not just strings
- **How to avoid:** Requires adding a type guard (typeof state === 'string') before string operations, but correctly handles all spec-defined state types

#### [Gotcha] PropertyValues<this> vs bare PropertyValues in Lit's updated() lifecycle hook matters for type-safe changedProperties.has() calls (2026-03-13)
- **Situation:** hx-toggle-button's updated() was typed as updated(changedProperties: PropertyValues) without the generic, causing Lit's type inference to fail when calling changedProperties.has() with component property keys
- **Root cause:** PropertyValues<this> parameterizes the Map with the component's own property keys, enabling TypeScript to validate that only declared reactive properties are passed to .has()
- **How to avoid:** Minor verbosity increase, but catches property name typos at compile time instead of silent runtime bugs

### ElementInternals field uses definite assignment assertion (!) rather than optional chaining or lazy initialization (2026-03-13)
- **Context:** ElementInternals is always assigned in constructor via attachInternals() but TypeScript strict mode flags it as potentially undefined before assignment
- **Why:** ElementInternals is guaranteed by the Web Components lifecycle - it is always assigned in the constructor before any external code can access the field; optional chaining would add false null checks that can never trigger and obscure intent
- **Rejected:** Optional typing (ElementInternals | undefined) with null checks - adds dead code paths that mislead readers; lazy initialization pattern - unnecessary complexity for a lifecycle-guaranteed assignment
- **Trade-offs:** Trusts developer to maintain constructor assignment discipline; removes null-safety net but eliminates noise in downstream usage
- **Breaking if changed:** If constructor assignment is removed or deferred past first external access, runtime error occurs with no TypeScript warning

#### [Gotcha] Lit @property() decorator without explicit type: String still infers String but fails strict TypeScript checks for reflected string properties; explicit type: String required for type-checker compliance (2026-03-13)
- **Situation:** hx-image rounded property had @property() with no type option; P2-02 finding flagged it as insufficiently typed even though Lit's default behavior treats untyped properties as strings
- **Root cause:** Lit uses the type option to determine serialization/deserialization from attributes; omitting it works at runtime but TypeScript strict analysis and custom lint rules flag it as an implicit type assumption
- **How to avoid:** More verbose decorator usage; explicit about serialization contract which aids maintainability

#### [Gotcha] Shadow DOM :visited CSS pseudo-class is a platform constraint that cannot be styled and should be documented via JSDoc rather than attempted as a fix (2026-03-13)
- **Situation:** hx-link P1-2 finding about :visited styling - browsers intentionally restrict :visited styles in Shadow DOM to prevent history sniffing attacks; the finding was pre-fixed by removing :visited rules
- **Root cause:** :visited inside Shadow DOM is blocked by browser security policy regardless of CSS authored; attempting to add :visited styles would be silently ignored; JSDoc documents the constraint so future maintainers don't re-add the rules
- **How to avoid:** Accepts reduced styling capability for security compliance; explicit documentation prevents regression

#### [Gotcha] Lit's updated() lifecycle must use PropertyValues<this> not Map<string, unknown> for changedProperties parameter (2026-03-13)
- **Situation:** hx-switch used Map<string, unknown> which loses type safety on property names and values
- **Root cause:** PropertyValues<this> is a mapped type keyed on the component's own property names, giving TypeScript correct inference for changedProperties.has('myProp') and changedProperties.get('myProp')
- **How to avoid:** None — PropertyValues<this> is strictly better; no runtime difference

### Chose `removable` over `dismissible` as the canonical property name for the tag component's remove button prop (2026-03-13)
- **Context:** API naming decision for hx-tag component property that enables a remove/dismiss button
- **Why:** Better aligns with component function (enabling a remove button) and is more intuitive for healthcare consumers building filterable lists — 'removable' describes the item's capability, while 'dismissible' implies temporary/notification-style UI patterns
- **Rejected:** `dismissible` — already used in notification/alert components and carries connotation of temporary UI elements, not persistent filterable tags
- **Trade-offs:** More explicit and domain-appropriate naming; consumers building filterable lists (a primary healthcare UI pattern) get a prop name that matches their mental model. Downside: diverges from common design system patterns (Material, Carbon) that use 'dismissible'
- **Breaking if changed:** Renaming to `dismissible` later would be a breaking API change requiring a major version bump; `removable` is now the documented canonical name

### formAssociated Web Components must implement formStateRestoreCallback with the full signature (value: string | File | FormData, mode: string) — partial signatures cause TypeScript errors and incomplete form restoration behavior (2026-03-13)
- **Context:** hx-select implemented formStateRestoreCallback with incomplete signature, missing the mode parameter and the full union type for value
- **Why:** The ElementInternals FormAssociated interface contract requires the exact signature; TypeScript strict mode catches mismatches and incomplete implementations silently break form state restoration in browser-native form APIs
- **Rejected:** Partial signature with just string — rejected because File and FormData are valid form values (file inputs, multipart), and omitting them means the component can't restore state from those value types
- **Trade-offs:** Full signature is more verbose but ensures the component works correctly with all native form submission types including file uploads
- **Breaking if changed:** Reverting to partial signature breaks TypeScript type-check and may cause silent form state restoration failures for non-string form values

#### [Gotcha] hx-card fires 'hx-click' event, not 'hx-card-click' — the event name does not follow the component-name prefix convention (2026-03-13)
- **Situation:** Audit finding P2-17 referenced 'hx-card-click' event but the component actually dispatches 'hx-click'
- **Root cause:** Discovered during implementation when mapping event names to Drupal behaviors — the audit finding had the wrong event name
- **How to avoid:** Drupal behaviors wired to 'hx-card-click' would silently never fire; no runtime error, just dead code

### Drupal pager uses 0-based page index while hx-pagination component uses 1-based — requires explicit conversion in Twig template with inline comment (2026-03-13)
- **Context:** Drupal's pager plugin passes current_page as 0-indexed integer; hx-pagination expects 1-based current-page attribute
- **Why:** Documented conversion inline in Twig ({{ pager.current_page + 1 }}) rather than hiding it in a preprocess function so the off-by-one is visible at the template layer where future developers will look
- **Rejected:** Handling conversion in a Drupal preprocess hook — would hide the impedance mismatch and make the template look correct when it isn't
- **Trade-offs:** Template is slightly noisier but the contract is explicit and auditable; preprocess approach would be cleaner Twig but the mismatch becomes invisible
- **Breaking if changed:** Removing the +1 offset silently shows the wrong page highlighted; no error thrown since both 0 and 1 are valid integers

#### [Gotcha] In Lit components, `updated()` override must use `PropertyValues` (imported from 'lit') not raw `Map<string | symbol, unknown>` or `Map<string, unknown>` even though PropertyValues is a Map subtype (2026-03-13)
- **Situation:** TypeScript strict mode rejected `updated(changedProperties: Map<string | symbol, unknown>)` and `updated(changedProperties: Map<string, unknown>)` as method overrides in Lit web components
- **Root cause:** Lit's strict TypeScript types require `PropertyValues` (or `PropertyValues<this>` for the generic form) because it matches the base class signature exactly. Raw Map types are incompatible under strict override checking even though PropertyValues extends Map.
- **How to avoid:** Using plain `PropertyValues` is less precise than `PropertyValues<this>` but avoids generic resolution issues; type safety is maintained for the Map iteration pattern

### console.warn is emitted at render time (not at property set time) when a required accessibility attribute like label is absent on hx-icon-button (2026-03-13)
- **Context:** Icon buttons require a label for screen readers but the property is optional in TypeScript to allow progressive enhancement patterns
- **Why:** Render-time warning catches the missing label at the moment the component actually appears in the DOM, giving developers immediate feedback in the browser console during development
- **Rejected:** Throwing an error — rejected because it would break rendering entirely; emitting at connectedCallback — rejected because the label may be set after connection via attribute or property binding
- **Trade-offs:** Warn-on-render can fire repeatedly if the component re-renders before label is set; it does not prevent silent failures in production builds that strip console output
- **Breaking if changed:** Removing the warn means missing labels are silent accessibility failures with no developer-facing signal

#### [Pattern] Deprecated type aliases (WcBadge) get @deprecated JSDoc with @since and @removal-target tags alongside a new canonical alias (HxBadge); both are exported during the deprecation window (2026-03-13)
- **Problem solved:** hx-badge had a WcBadge alias from a Web Components naming convention that needed migration to the Hx-prefixed canonical naming scheme
- **Why this works:** Exporting both aliases lets consumers migrate incrementally without a hard breaking change; @removal-target 1.0.0 communicates the deprecation timeline explicitly in tooling (IDE hover, docs generators)
- **Trade-offs:** Both aliases must be maintained and kept in sync until 1.0.0; adds minor surface area to the public API; @deprecated causes IDE warnings for new usage which is the desired behavior

#### [Pattern] All private/underscore-prefixed properties and internal static fields must be annotated with `/** @internal */` to prevent them from surfacing in the CEM and component documentation (2026-03-18)
- **Problem solved:** CEM by default includes all properties it can discover; without @internal markers, private implementation details (bound handler references, query refs, unique ID strings, slot tracking booleans) pollute the public API surface and tank health scores
- **Why this works:** @internal is the standard CEM/TypeDoc convention to exclude properties from generated documentation while keeping them in source; it does not affect runtime behavior
- **Trade-offs:** Adds annotation overhead (~20 `/** @internal */` lines for a complex component), but results in a clean public API surface in the manifest and correct health scores

#### [Gotcha] HTML boolean attributes default to `true` is an unresolvable footgun — `open="false"` is still truthy because attribute presence equals true, absence equals false (2026-03-18)
- **Situation:** hx-alert.open, hx-alert.showIcon, hx-code-snippet.copyable all defaulted to true, making it impossible to turn them off via HTML attributes
- **Root cause:** Web Components reflect boolean properties to attributes using presence/absence semantics. Setting attribute to string 'false' does not set the property to false — the attribute is still present, so the property reads as true.
- **How to avoid:** Changing to false default is a breaking change for consumers relying on implicit defaults; but it aligns with HTML spec semantics and makes the API expressible in pure HTML

### hx-sort event uses `composed: true` so it bubbles through shadow DOM boundaries and can be listened to on hx-table or any ancestor (2026-03-18)
- **Context:** The sort button lives inside hx-th's shadow DOM — without `composed: true`, the event stops at hx-th's shadow root and consumers must add listeners to each hx-th individually
- **Why:** Composed events allow the hx-table to be the single event delegation point, matching how native table events work and simplifying consumer code to one listener
- **Rejected:** Re-dispatching the event from hx-th's host element (non-composed retarget) was rejected as it loses the original target reference and adds boilerplate
- **Trade-offs:** composed events expose internal shadow DOM structure in event.composedPath() — a minor encapsulation leak, but the ergonomic win for consumers outweighs it

### Renamed `attribute: 'size'` to `attribute: 'hx-size'` across all 8 affected components to enforce library-wide attribute naming consistency (2026-03-18)
- **Context:** Mixed naming convention existed: some components used bare `size` attribute, others used prefixed `hx-size`, creating an inconsistent public API surface for web component consumers
- **Why:** Web components share a global attribute namespace with HTML; prefixing with `hx-` prevents collisions with native HTML attributes (e.g., the native `size` attribute on `<input>`, `<select>`) and makes custom attributes immediately identifiable as component-specific
- **Rejected:** Keeping `size` — rejected because it collides with the HTML `size` attribute, causing ambiguity in form elements and breaking CSS attribute selectors that may target native `[size]`
- **Trade-offs:** Easier: attribute scanning/grep is unambiguous; all custom attrs are greppable by `hx-` prefix. Harder: breaking change for any consumer using `size=` in templates — requires a coordinated migration
- **Breaking if changed:** Any consumer template using `size=` attribute on affected components breaks silently (attribute is ignored, component renders default size) — no runtime error, pure behavioral regression

### Renamed slot `name: 'help'` to `name: 'help-text'` across all 4 affected components (hx-checkbox-group, hx-time-picker, hx-date-picker, hx-field) (2026-03-18)
- **Context:** Slot naming was inconsistent across form components — some used `help`, others `help-text` — the canonical pattern established by other library components was `help-text`
- **Why:** `help-text` is more semantically precise (distinguishes from a hypothetical `help` icon or `help` action), aligns with ARIA conventions (`aria-describedby` targets are typically labeled as descriptive text), and matches the established pattern in the rest of the library
- **Rejected:** Keeping `help` — rejected because it would leave form components as outliers; any documentation, Storybook stories, or consumer code would need to know which components used which name
- **Trade-offs:** Easier: uniform slot API means consumers can apply the same pattern across all form components. Harder: breaking change — slotted content using `slot="help"` becomes unslotted (renders in default slot or disappears) with no warning
- **Breaking if changed:** Consumer templates with `slot="help"` on affected components silently fail — the content is no longer projected into the help-text slot, accessibility descriptions disappear from screen readers

#### [Pattern] Added `@deprecated` JSDoc to all remaining `WcFoo` type exports pointing to `HxFoo` equivalents, while keeping the exports live (2026-03-18)
- **Problem solved:** Legacy `WcFoo` type aliases existed from an older naming convention; they needed to be preserved for backward compatibility but consumers should be guided toward `HxFoo`
- **Why this works:** TypeScript `@deprecated` JSDoc causes IDEs to render strikethrough on usage and surfaces deprecation warnings in editor tooling without requiring a compile-time break — gives consumers a migration path without a hard break
- **Trade-offs:** Easier: zero breakage for existing consumers; IDE tooling surfaces the migration nudge organically. Harder: deprecated exports must be maintained indefinitely until a major version drop; dead code accumulates

#### [Gotcha] Class-level JSDoc must be placed immediately before @customElement decorator, not before interfaces or imports earlier in the file (2026-03-18)
- **Situation:** hx-breadcrumb had existing JSDoc but it was attached to the JsonLdListItem interface earlier in the file, not to the class itself — meaning CEM health scoring tools did not associate it with the component class
- **Root cause:** CEM (Custom Elements Manifest) parsers associate JSDoc with the AST node immediately following it; a JSDoc block before an interface is consumed by that interface declaration, leaving the class undocumented
- **How to avoid:** Correct placement means CEM correctly scores the class as documented; incorrect placement silently gives a health penalty with no obvious cause

#### [Pattern] Private properties/getters and internal @state fields require explicit /** @internal */ JSDoc to prevent CEM from counting them as undocumented public API surface (2026-03-18)
- **Problem solved:** CEM health scoring penalizes components for undocumented members; private TypeScript members are still emitted into the manifest unless explicitly marked @internal
- **Why this works:** TypeScript's private keyword is a compile-time construct; CEM static analysis may still surface these as members. @internal is the semantic signal to CEM to exclude them from the public API surface and health score
- **Trade-offs:** Adds minor documentation boilerplate to private members; gains accurate health scores and cleaner public API surface in generated manifests

### @fires JSDoc tag with full typed signature (@fires {CustomEvent} hx-complete) must be on the class JSDoc block, not on the method that dispatches the event (2026-03-18)
- **Context:** hx-progress-bar fires an hx-complete event when progress reaches 100%, but this was undocumented in the CEM manifest, causing health score penalties
- **Why:** CEM aggregates @fires tags from the class-level JSDoc to build the events array in the manifest; @fires on individual methods may not be picked up depending on CEM analyzer version
- **Rejected:** Documenting the event inline at the dispatchEvent call site — not recognized by CEM for manifest generation
- **Trade-offs:** Class-level @fires provides accurate CEM manifest events array and Storybook autodocs; the trade-off is that event documentation is separated from the dispatch site
- **Breaking if changed:** Moving @fires off the class JSDoc block to method-level loses the event from the CEM manifest entirely, breaking any consumer tooling that reads the manifest for event subscriptions

### `@internal` must be placed in a JSDoc block (`/** @internal */`) directly before the decorator or field declaration — not as an inline comment — for the Custom Elements Manifest (CEM) analyzer to recognize and exclude it from the public API surface (2026-03-18)
- **Context:** Private TypeScript fields decorated with @state/@query are still emitted into the CEM as public API surface unless explicitly tagged, which degrades HELiXiR health scores
- **Why:** The CEM analyzer parses JSDoc AST nodes, not TypeScript access modifiers; `private` keyword alone does not suppress CEM emission in the analyzer version used
- **Rejected:** Relying solely on TypeScript `private` keyword — this does not propagate to CEM output and health scores remain low
- **Trade-offs:** Adds JSDoc noise to every internal field but is the only reliable mechanism to exclude them from the generated manifest; no functional code changes required
- **Breaking if changed:** If `@internal` tags are removed, CEM will re-emit all private fields as part of the public API surface, degrading HELiXiR health scores back to B-grade (83/85) and potentially exposing implementation details in downstream tooling

### Private members are documented with `/** @internal */` JSDoc block comments, not `// @internal` inline comments, to satisfy CEM (Custom Elements Manifest) analyzer parsing (2026-03-18)
- **Context:** Health score tooling (CEM) flags undocumented private members; the fix requires annotations CEM can actually parse
- **Why:** CEM's AST parser reads JSDoc block comments attached to declarations; single-line `//` comments are not associated with the following node in the AST and are ignored by the analyzer
- **Rejected:** Inline `// @internal` comments — syntactically valid TypeScript but invisible to JSDoc-based tooling like CEM and TypeDoc
- **Trade-offs:** Slightly more verbose per member; gains machine-readability by doc tooling and consistent IDE hover documentation
- **Breaking if changed:** Switching to inline comments would silently revert the health score regression without any TypeScript errors — the bug would be invisible until the next CEM health audit

### Removed the `execCommand('copy')` fallback from `hx-copy-button` entirely rather than keeping it as a fallback for older browsers (2026-03-18)
- **Context:** `document.execCommand` is deprecated and removed from the spec; its presence alongside the Clipboard API created dual code paths and an associated test that tested deprecated behavior
- **Why:** The Clipboard API (`navigator.clipboard.writeText`) is supported in all modern browsers and in any secure context (HTTPS or localhost). Keeping the execCommand path means maintaining dead code and a test that validates deprecated behavior indefinitely
- **Rejected:** A feature-detect fallback (`try Clipboard API, catch → execCommand`) would maintain broader compatibility but enshrines a deprecated API in the codebase and complicates testing
- **Trade-offs:** Drops support for very old browsers (pre-2018) or insecure HTTP contexts where `navigator.clipboard` is undefined — acceptable given the component library's browser support matrix
- **Breaking if changed:** Removing the fallback means copy silently fails in insecure contexts (non-HTTPS non-localhost) where the Clipboard API is not available; the component should surface an error state if clipboard is unavailable

### Adding `/** @internal */` JSDoc tags to private TypeScript fields (prefixed with `_`) to exclude them from the Custom Elements Manifest (CEM) public API surface (2026-03-18)
- **Context:** HELiXiR health scores for hx-menu (81), hx-accordion (83), hx-dropdown (86) were below A-grade threshold (90+) because private implementation fields were being surfaced in the generated CEM as part of the public API
- **Why:** CEM generators analyze TypeScript source and include all class members unless explicitly marked otherwise. TypeScript's `private` keyword alone does not signal to CEM tooling that a field should be excluded from the public API documentation surface. `@internal` is the semantic tag that CEM analyzers (like `@custom-elements-manifest/analyzer`) recognize to filter out implementation details.
- **Rejected:** Using TypeScript `#` private fields (hard private) was not chosen — likely because the codebase uses `_` prefix convention for private fields and migrating syntax would be a larger refactor with no functional benefit. Using `private` modifier alone was insufficient since it was already in use.
- **Trade-offs:** Easier: Health scores improve without any functional changes, no risk of regression, no test re-runs needed. Harder: Developers must remember to add `@internal` to new private fields or health scores will silently degrade again on future additions.
- **Breaking if changed:** Removing `@internal` tags would re-expose private fields in the CEM output, degrading health scores and potentially polluting API documentation consumers (IDEs, Storybook, design system tooling) with implementation details.

### Add /** @internal */ JSDoc tags to formAssociated (static), _internals (ElementInternals), @state private, and @query private fields in Lit web components to exclude them from CEM public API (2026-03-18)
- **Context:** HELiXiR health scoring system penalizes components that expose internal implementation details in the Custom Elements Manifest without @internal tags, causing scores of 87-88 instead of 90+
- **Why:** CEM generation tools (custom-elements-manifest analyzer) use @internal tags to filter fields from the public API surface. Without them, private decorated fields appear as public API, inflating the manifest and confusing consumers/tooling
- **Rejected:** Making fields truly private via # (JS private fields) was not viable because Lit decorators (@state, @query) do not work with native private fields in all target environments
- **Trade-offs:** Easier: health scores improve, CEM is cleaner for consumers, IDE tooling correctly hides internal fields. Harder: must remember to tag every decorated private field; easy to miss in new components
- **Breaking if changed:** Removing @internal tags causes CEM to re-expose these fields as public API, dropping health scores and potentially generating incorrect type definitions for consumers

#### [Gotcha] Private handler methods named after one trigger (e.g., _handleRowClick) may be invoked by multiple code paths (keyboard Enter/Space, not just pointer clicks), making narrow names technically inaccurate as internal documentation. (2026-03-18)
- **Situation:** JSDoc for _handleRowClick said 'when the item row is clicked' but the method was also called from _handleKeyDown's Enter/Space branch at line 220, making the description misleading for future maintainers.
- **Root cause:** The method name was written from the perspective of its primary UI affordance (clicking a row) but the implementation reused it for keyboard activation to avoid duplication — a common DRY pattern in interactive widget components.
- **How to avoid:** Reusing one handler for both input modalities keeps code DRY and ensures consistent event dispatch behavior, but creates a naming/documentation mismatch that misleads readers about when the method fires.

#### [Pattern] JSDoc for keyboard handlers on interactive components should enumerate ALL responsibilities (expand/collapse, activation, navigation delegation) rather than describing only the most prominent one, because tree/listbox widgets handle multiple key interactions in a single handler. (2026-03-18)
- **Problem solved:** _handleKeyDown was documented as only handling navigation delegation to the parent tree, omitting that it also handles activation (Enter/Space → _handleRowClick) and expand/collapse — the two higher-priority interaction branches.
- **Why this works:** ARIA tree widget keyboard interaction (WAI-ARIA 1.2) concentrates all key handling in one listener; documenting only one concern implies the others don't exist, creating a false mental model of the component's keyboard contract.
- **Trade-offs:** Single consolidated handler is easier to reason about event ordering and default prevention, but demands thorough documentation to communicate all handled keys; partial docs are worse than none because they actively mislead.

#### [Pattern] Both JSDoc annotation AND HTML attribute must be added together for CSS parts: @csspart in JSDoc + part="<name>" on the actual DOM element in render() (2026-03-19)
- **Problem solved:** hx-carousel-item was missing the slide csspart — the .slide-group div had no part attribute and no JSDoc annotation
- **Why this works:** The CEM analyzer extracts cssparts from JSDoc @csspart tags, but the part only actually works at runtime when the part attribute exists on the DOM element. One without the other creates a docs/runtime mismatch — documented but non-functional, or functional but undiscoverable
- **Trade-offs:** Requires keeping JSDoc and template in sync; a future refactor that renames the class must also update both the @csspart tag and the part attribute value

#### [Gotcha] formStateRestoreCallback must accept `string | File | FormData | null` as its first parameter, not just `string`, and requires a second `_mode: 'restore' | 'autocomplete'` parameter (2026-03-19)
- **Situation:** Lit form-associated custom elements had narrowed the callback signature to only `string`, causing TypeScript type errors and potential runtime failures when the browser passes File or FormData state
- **Root cause:** The ElementInternals spec defines formStateRestoreCallback with the full union type because browsers can store any of these types as form state depending on how setFormValue was called
- **How to avoid:** Requires `typeof state === 'string'` guard before string operations, adding a branch; but correctly models the browser API contract

### hx-date-picker.formResetCallback calls `setFormValue(null)` instead of `setFormValue('')` to signal absence of value (2026-03-19)
- **Context:** Date picker has no default value — on reset it should signal 'no value' not 'empty string value' to the browser's form restoration mechanism
- **Why:** null explicitly signals to the browser that the element has no form value, which is semantically different from an empty string. Browsers use this distinction for form state restoration and constraint validation
- **Rejected:** setFormValue('') — rejected because empty string is a valid (if unusual) string value, not the same as no value; could cause incorrect form restoration behavior
- **Trade-offs:** null correctly participates in form validation (element omitted from submission vs. submitting empty string)
- **Breaking if changed:** Changing back to '' would cause the date picker to submit an empty string on forms instead of being omitted, potentially breaking server-side form processing

#### [Pattern] hx-rating.formResetCallback resets to numeric 0 (not null) because rating values are always numeric (2026-03-19)
- **Problem solved:** Rating component must define what 'reset' means for its value type — null would be ambiguous for a numeric rating scale
- **Why this works:** A rating with no stars selected is semantically 0, not absent. Using null would require consumers to handle null separately from 0, complicating value handling. setFormValue('0') keeps the form value as a string (required by the API) while the internal value is numeric
- **Trade-offs:** Consumers receive '0' on form submission after reset rather than the field being omitted; this is acceptable for rating semantics

#### [Gotcha] CEM (Custom Elements Manifest) annotation correctness matters: `@cssproperty` is not a valid CEM decorator — the correct tag is `@cssprop`. Using the wrong tag silently produces a malformed or missing manifest entry with no build error. (2026-03-19)
- **Situation:** The feature was titled 'CEM annotation fixes — @cssproperty→@cssprop' indicating the wrong decorator had been used across components, producing broken or absent CSS property entries in the published manifest.
- **Root cause:** The CEM analyzer uses exact tag matching; `@cssproperty` is not recognized and the property is silently dropped from the manifest. Downstream tooling (Storybook, IDEs, documentation generators) that consumes the manifest will show no CSS custom properties for the component, breaking the developer experience without any runtime error.
- **How to avoid:** Fixing requires auditing all component files for the wrong tag; easy to miss in large codebases. The correct approach is a lint rule or CEM validation step in CI to catch future regressions.

#### [Gotcha] @query-decorated private fields in LitElement components are treated as public class members by CEM unless explicitly annotated with `/** @internal */`. Without this annotation they appear as exposed private API in the manifest, polluting the public surface and potentially degrading documentation health scores. (2026-03-20)
- **Situation:** hx-tooltip had 5 `@query`-decorated fields (`_defaultSlot`, `_contentSlot`, `_triggerWrapper`, `_tooltipEl`, `_arrowEl`) with underscore-prefixed names (TypeScript convention for private) but no `private` keyword or TSDoc tag, so CEM surfaced them as public members.
- **Root cause:** CEM does not interpret underscore naming convention as private. It respects `private`/`protected` TypeScript access modifiers and the `@internal` JSDoc tag. Since `@query` fields cannot easily be made `private` without breaking Lit's decorator behavior in some configurations, `/** @internal */` is the least-invasive suppression mechanism.
- **How to avoid:** Adding `/** @internal */` cleanly removes fields from the CEM public manifest without any runtime impact. The trade-off is that developers must remember to add it to every new `@query` private field; there is no lint rule enforcing this.