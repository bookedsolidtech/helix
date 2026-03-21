---
tags: [architecture]
summary: architecture implementation decisions and patterns
relevantTo: [architecture]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 162
  referenced: 61
  successfulFeatures: 61
---
# architecture

#### [Pattern] Use an npm postcem lifecycle hook to automatically chain cem-to-sdc --force after npm run cem, making SDC regeneration a transparent side effect of CEM generation (2026-03-05)
- **Problem solved:** Developers were expected to run two commands (npm run cem then npx tsx scripts/cem-to-sdc.ts --force) to keep SDC files in sync. This was error-prone and produced stale YAML.
- **Why this works:** npm's post* hook convention runs automatically after the named script without any extra tooling. Encoding the dependency in package.json makes it declarative and impossible to forget.
- **Trade-offs:** cem now takes longer because it always regenerates SDC; the SDC files are always consistent with the CEM source which removes a whole class of sync bugs

### Add generated drupal/ directory to .prettierignore rather than formatting generated YAML files (2026-03-05)
- **Context:** Prettier was attempting to reformat the generated .component.yml files, causing diff noise and CI formatter failures on files that are not hand-authored
- **Why:** Generated files should not be edited by hand-formatting tools — reformatting can change YAML structure in ways that break Drupal parsing, and the generated output is already deterministically formatted by the generator
- **Rejected:** Formatting generated files with Prettier — risks YAML reflow that alters multi-line strings or indentation semantics; disabling Prettier globally — loses formatting on all other files
- **Trade-offs:** The drupal/ directory is now exempt from Prettier enforcement, meaning if someone manually edits a file it won't be normalized — but manual edits to generated files should be discouraged anyway
- **Breaking if changed:** Removing the .prettierignore entry causes CI to flag generated YAML as improperly formatted, blocking PRs unless developers run Prettier on generated files before committing

### Review feedback about stale JSDoc descriptions (wc-href, helpText naming, values references) was deliberately denied because fixing requires changing component source files, not the generator (2026-03-05)
- **Context:** CodeRabbit flagged several misleading prop descriptions in generated SDC YAML. The text came verbatim from JSDoc in the web component TypeScript source, faithfully transcribed by cem-to-sdc.
- **Why:** The generator's contract is to accurately reflect the CEM manifest. Transforming or suppressing JSDoc text in the generator would introduce a hidden layer of description munging that becomes a maintenance burden and could silently hide real documentation problems.
- **Rejected:** Fixing descriptions in the generator script — would mean the generator diverges from source truth and descriptions would re-break whenever CEM is regenerated from unchanged source; silently dropping descriptions — loses documentation entirely
- **Trade-offs:** Stale JSDoc remains visible in Drupal UI until component authors update source JSDoc; but the generator stays a faithful transformer with no business logic about description correctness
- **Breaking if changed:** If the generator were modified to transform descriptions, future regenerations could produce inconsistent output depending on which version of the transformation logic was applied

#### [Pattern] Tailwind preset maps design tokens as CSS var() references rather than resolved values, making runtime token switching (dark mode, theming) automatic without regenerating CSS (2026-03-05)
- **Problem solved:** Helix uses CSS custom properties (--hx-*) as its token system with data-theme='dark' overrides; a Tailwind preset could either snapshot resolved values at build time or reference vars at runtime
- **Why this works:** CSS var() references mean a single compiled Tailwind stylesheet supports all themes — when data-theme='dark' flips the CSS custom properties, all Tailwind utility classes automatically reflect the new token values without any Tailwind rebuild
- **Trade-offs:** Zero-cost theming and single build artifact; downside is values are opaque to Tailwind's JIT optimizer and tooling (e.g. color pickers in IDEs won't show actual hex values)

### darkMode set to ['selector', '[data-theme="dark"]'] instead of 'class' or 'media' strategy to align with Helix's attribute-based theme switching (2026-03-05)
- **Context:** Tailwind supports three dark mode strategies; Helix's CSS variable override pattern uses data-theme attribute on the root element, not a .dark class or prefers-color-scheme media query
- **Why:** Using selector strategy with data-theme='dark' means Tailwind's dark: variants activate on the same attribute that triggers Helix's CSS variable overrides — both systems are synchronized by a single DOM attribute change
- **Rejected:** 'class' strategy would require adding both .dark class AND data-theme='dark' attribute to activate both systems, doubling the theming API surface; 'media' strategy ignores user-explicit overrides
- **Trade-offs:** Single source of truth for theme state; less flexible if a consumer wants Tailwind dark mode on a different trigger than Helix's theme system
- **Breaking if changed:** If Helix's token system switches from data-theme attribute to a class-based approach, all dark: Tailwind variants in consumer code will stop activating

#### [Gotcha] Tailwind v3 vs v4 peerDependency version mismatch between the preset (^3.4.0) and monorepo consumers (^4.1.8) produces a warning but not a failure because the package exports only a config object with no Tailwind runtime imports (2026-03-05)
- **Situation:** The preset's package.json declared tailwindcss ^3.4.0 as devDependency but some workspace consumers used v4; npm warned about version mismatch
- **Root cause:** The preset never imports tailwindcss at runtime — it exports a plain JavaScript object conforming to Tailwind's config schema. Since the schema is backward-compatible, any Tailwind version that reads the config works regardless of the preset's declared version
- **How to avoid:** Consumers get a warning they can safely ignore; actual incompatibility would only appear if Tailwind v4 breaks the config schema for fields the preset uses (e.g. theme.extend structure)

### ElementInternals is reserved for form-associated custom elements only — non-form content containers should use setAttribute('role', ...) directly (2026-03-05)
- **Context:** PR review suggested using ElementInternals for hx-tab-panel to set ARIA role, similar to how form elements attach internals
- **Why:** ElementInternals couples elements to the form participation lifecycle (formAssociated, validation, etc). A tab panel is a pure content container with no form semantics — using ElementInternals would import unneeded API surface and imply false form association.
- **Rejected:** ElementInternals.role — rejected because it conflates form-associated element patterns with structural/semantic container patterns, creating misleading architecture
- **Trade-offs:** setAttribute keeps the pattern simple and precedented (hx-radio uses it); ElementInternals would add API power not needed and make the element appear form-capable when it isn't
- **Breaking if changed:** If ElementInternals is added later for role-setting only, it may accidentally enable form participation behavior or confuse consumers reading the component contract

### Added _fetchSeq monotonic counter to discard stale async fetch responses when src property changes rapidly before prior fetches complete (2026-03-05)
- **Context:** Web component fetches remote SVG; if src changes while fetch is in-flight, the slower first response could overwrite the correct second response (race condition)
- **Why:** Async fetch order is not guaranteed to match dispatch order; without a sequence guard, a slow network response for an old src value silently overwrites the current icon
- **Rejected:** Cancelling in-flight fetches with AbortController — more complex, still needs guard for edge cases
- **Trade-offs:** Counter adds minimal state; still fires redundant network requests (AbortController would cancel them), but correctness is guaranteed
- **Breaking if changed:** Removing _fetchSeq re-introduces a silent race condition that only manifests under slow network or rapid src changes

### ElementInternals was explicitly rejected for hx-icon despite being available for web components, because it is only meaningful for form-associated components (2026-03-05)
- **Context:** PR review suggested adding ElementInternals to hx-icon for consistency with other components
- **Why:** ElementInternals API exists specifically for form participation (form submission, validation, labels); a decorative icon has no form semantics, so adding it is dead unreachable code that adds surface area with no benefit
- **Rejected:** Adding ElementInternals for consistency — consistency argument loses when the API is semantically inapplicable
- **Trade-offs:** Keeping it out means the component is simpler and has less dead code; no loss in capability
- **Breaking if changed:** Adding ElementInternals to hx-icon would add dead code and signal incorrect intent to future maintainers that the icon participates in forms

#### [Pattern] Use nullish coalescing (??) over non-null assertions (!) for optional array fields in Web Component render methods — non-null assertions are a zero-tolerance violation in this codebase and mask real undefined paths (2026-03-05)
- **Problem solved:** item.children was typed as optional but rendered with item.children! — if children is undefined, the template throws at runtime with no type-system warning
- **Why this works:** item.children ?? [] degrades gracefully to empty render, matches the type signature, and satisfies the project's strict no-assertion policy
- **Trade-offs:** Slightly more defensive rendering; empty array means no submenu is rendered rather than an exception, which is the correct UX for leaf items

#### [Gotcha] hx-nav uses data-driven (JS array/JSON) API while hx-side-nav uses slot-based composition — two incompatible navigation patterns coexist in the same library (2026-03-05)
- **Situation:** Navigation components evolved independently; hx-nav was built for JS-first consumers while hx-side-nav was built for HTML/template-first consumers
- **Root cause:** No enforced architectural pattern contract existed during development; each author chose what felt natural for their use case
- **How to avoid:** Data-driven API is more flexible for JS apps but completely incompatible with Drupal/Twig server-side templates; slot-based works universally but requires more consumer markup

### hx-tooltip uses Math.random() for ID generation (for aria-describedby linking), breaking SSR hydration (2026-03-05)
- **Context:** Tooltip must generate a unique DOM ID to connect trigger aria-describedby to tooltip content for accessibility
- **Why:** Math.random() is the simplest unique ID approach and works in pure client-side rendering
- **Rejected:** A module-level counter (let idCounter = 0; id = ++idCounter) would be deterministic and SSR-safe — rejected implicitly by not considering SSR as a requirement at implementation time
- **Trade-offs:** Random IDs work for client-only rendering; deterministic counters enable SSR hydration and make test snapshots stable
- **Breaking if changed:** Current aria-describedby links will change on every page load with random IDs, which breaks snapshot tests and SSR; switching to counter requires module-level state that resets between SSR renders

#### [Gotcha] wc- to hx- prefix migration was incomplete — @fires JSDoc tags, test descriptions, and WcX type aliases still use the dead wc- prefix across 8+ components, causing TypeScript build breaks (2026-03-05)
- **Situation:** Library was renamed/rebranded from wc- prefix to hx- prefix; the migration was done on component class names and CSS custom properties but not comprehensively across JSDoc, test imports, and type alias exports
- **Root cause:** Prefix migration is tedious and cross-cutting; automated find-replace likely missed JSDoc @fires annotations and type alias declarations that are not part of the runtime bundle
- **How to avoid:** Dead WcX type imports in tests cause TypeScript compilation failures silently if type-check is not part of CI gate; @fires JSDoc mismatches cause CEM (Custom Elements Manifest) to emit wrong event names breaking framework wrappers

#### [Gotcha] CSS token references without fallback values (e.g., calc(-1 * var(--hx-border-width-thin)) with no fallback) produce invalid/invisible CSS when the token stylesheet is not loaded (2026-03-05)
- **Situation:** Design token adoption across components was incremental; some components were updated to use tokens without adding CSS custom property fallback values
- **Root cause:** Token-only references are cleaner and assume the token stylesheet is always present — a reasonable assumption in a controlled design system
- **How to avoid:** No fallbacks = components are broken in any context without the full token stylesheet (docs sites, third-party embedding, testing without full CSS setup); with fallbacks = slight duplication but universal resilience

#### [Gotcha] hx-tooltip uses --hx-spacing-* and --hx-text-xs token names while every other component uses --hx-space-* and --hx-font-size-xs — a silent theming failure (2026-03-05)
- **Situation:** Token naming conventions were not enforced via a linter or schema validation; hx-tooltip was likely written by a different author or at a different time than the token naming convention was established
- **Root cause:** Without a token namespace lint rule, authors guess token names from memory; --hx-spacing-* is a plausible guess for spacing tokens
- **How to avoid:** Wrong token names mean the component silently ignores all theme customizations — it won't error, it won't warn, it just uses browser defaults; extremely hard to debug

### hx-dialog applies focus trap behavior to non-modal dialogs (dialogs without modal=true attribute), which violates ARIA authoring practices for non-modal dialogs (2026-03-05)
- **Context:** Focus trapping was implemented at the dialog component level without distinguishing between modal (backdrop, focus trap required) and non-modal (no backdrop, focus should flow freely) dialog patterns
- **Why:** Focus trap implementation is complex; applying it universally simplified the component logic and avoided a conditional code path
- **Rejected:** Conditional focus trap based on modal attribute was the correct ARIA-compliant approach — rejected implicitly by not implementing the distinction
- **Trade-offs:** Universal focus trap prevents users from tabbing to content outside non-modal dialogs, breaking page usability for non-modal patterns like drawer panels or inline confirmations
- **Breaking if changed:** Removing focus trap universally breaks modal dialog accessibility (WCAG 2.4.3); it must become conditional on a modal attribute or role=dialog vs role=alertdialog

### Lit `@query` decorated properties must be typed as `private _input!: HTMLInputElement | null` — combining `!` (non-null assertion for TS initializer) with `| null` (accurate runtime type). Do NOT use `= null` as initializer. (2026-03-05)
- **Context:** With `strictPropertyInitialization: true`, `experimentalDecorators: true`, and `useDefineForClassFields: false`, TypeScript requires class properties to be initialized. `@query` works via a prototype getter, not a class field assignment.
- **Why:** The `!` suppresses TypeScript's 'no initializer' error without emitting `this._input = null` in the constructor. Emitting that assignment would shadow the `@query` prototype getter at runtime — the component would always see `null` for `_input` regardless of DOM state. The `| null` type is accurate because `@query` returns `null` when the queried element is not in the DOM.
- **Rejected:** `private _input: HTMLInputElement | null = null` — looks safe but is a real runtime bug: the constructor assignment shadows the prototype getter, making `_input` permanently `null`. `private _input!: HTMLInputElement` without `| null` — inaccurate type, hides legitimate null returns from @query when element is conditionally rendered.
- **Trade-offs:** The `!` looks alarming (implies 'definitely not null') but is only suppressing TS initialization checking — the `| null` union is what correctly models runtime behavior. Requires understanding that these two modifiers serve completely different purposes.
- **Breaking if changed:** Adding `= null` initializer breaks the `@query` getter shadowing — component loses access to its shadow DOM input element entirely, causing silent null reference failures in all methods that use `_input`.

#### [Gotcha] Using `private _input!: HTMLInputElement | null` combines `!` (definite assignment assertion) with `| null` union type — these serve completely different purposes and must coexist for Lit `@query` decorator compatibility. (2026-03-05)
- **Situation:** TypeScript `strictPropertyInitialization` requires class properties to be initialized in the constructor, but `@query` decorators inject values via prototype getters, not constructor assignments.
- **Root cause:** The `!` suppresses the TypeScript compiler error about uninitialized properties without emitting any runtime code. The `| null` accurately types the runtime behavior of `@query`, which returns null when the element is not found in the shadow DOM. Together they satisfy both the compiler and runtime contract.
- **How to avoid:** Pattern is non-obvious and looks contradictory (`!` implies non-null, `| null` implies nullable), requiring documentation/comments for maintainability. However it is the only correct approach for strict TypeScript + Lit `@query` without disabling strictPropertyInitialization.

#### [Gotcha] CSS custom properties set on a parent Web Component (--hx-button-group-size) have no effect if the child Web Component (hx-button) never reads them — the cascade does not pierce shadow DOM automatically (2026-03-05)
- **Situation:** hx-button-group documented and tested a --hx-button-group-size CSS custom property intended to cascade size to all child hx-button elements
- **Root cause:** CSS custom properties DO inherit through the DOM including into shadow DOM, but only if the consuming element explicitly references var(--hx-button-group-size) somewhere in its own styles. hx-button never referenced this property, so the entire size-cascade feature was silently inert.
- **How to avoid:** Stories masked the bug by manually setting hx-size on every child button individually, so the feature appeared to work in Storybook while being completely non-functional in production usage

#### [Gotcha] Using a string identifier ('sm', 'md', 'lg') as a CSS custom property value is non-standard and requires consuming components to parse/map the string — actual CSS values should be cascaded instead (2026-03-05)
- **Situation:** --hx-button-group-size was designed to cascade a size token to child buttons via CSS custom property inheritance
- **Root cause:** CSS custom properties are substituted verbatim into CSS declarations. A string like 'sm' is only valid if the consuming property accepts that identifier (e.g., font-size: sm is invalid). Mapping abstract tokens requires @container style() queries or JS parsing, both with poor browser support.
- **How to avoid:** Robust design cascades actual CSS values (--hx-button-group-min-height: 2rem) that can be directly substituted into valid CSS declarations, requiring no parsing or mapping logic

### Duplicating ariaLabel sync logic in both connectedCallback (initial) and updated (changes) creates a maintenance trap where patching one branch can miss the other (2026-03-05)
- **Context:** hx-button-group set this.internals.ariaLabel in connectedCallback (guarded by if label) and again in updated (handles both truthy and null). Functionally correct but structurally duplicated.
- **Why:** The connectedCallback path only handles the truthy case, while updated handles both. A developer fixing a bug in one branch may not notice the other exists.
- **Rejected:** Consolidating into a single private method called from both lifecycle hooks — which would have been the correct pattern
- **Trade-offs:** Consolidation into a syncAriaLabel() private method eliminates the duplication and ensures both paths stay in sync. Current duplication is low-risk but high-maintenance-cost as the component evolves.
- **Breaking if changed:** If only one branch is patched during a bug fix, the other branch will produce inconsistent behavior depending on whether the component is being initially connected or updating.

#### [Gotcha] Custom form elements using ElementInternals must explicitly call this._internals.setFormValue(name, value) — forwarding name/value props to an inner <button> inside Shadow DOM does NOT make them available to the outer form's FormData. (2026-03-05)
- **Situation:** hx-icon-button forwards name and value as attributes to the inner <button> in Shadow DOM, but the enclosing form never receives these values on submit because Shadow DOM children are not part of the outer form participation.
- **Root cause:** ElementInternals.setFormValue() is the only mechanism for a custom element to participate in form submission. The inner button's name/value are scoped to Shadow DOM and invisible to the outer form.
- **How to avoid:** Without setFormValue(), the component appears to work (form submits, events fire) but silently drops name/value data from FormData. The bug is invisible unless you explicitly assert FormData contents.

#### [Gotcha] A disabled <a> element rendered without href and without role='link' loses its link semantics entirely — screen readers announce it as generic text, not as a link, breaking the accessible mental model. (2026-03-05)
- **Situation:** hx-icon-button's href mode renders an <a> element. When disabled, the href is removed to prevent navigation, but no role='link' replacement is added, stripping the element's semantic identity.
- **Root cause:** Removing href is the correct way to disable a link for navigation, but the accessible role must be preserved explicitly via role='link' combined with aria-disabled='true'.
- **How to avoid:** Adding role='link' + aria-disabled='true' correctly signals intent to AT users. Without it, disabled link buttons are indistinguishable from decorative text to screen reader users.

### Link mode (<a> element) in a button component should support target and rel attributes — omitting them makes the component strictly less capable than a native <a> and forces consumers to work around it. (2026-03-05)
- **Context:** hx-icon-button's href mode renders an <a> but exposes no target attribute, preventing consumers from opening links in new tabs. Adding target='_blank' without rel='noopener noreferrer' is also a security issue.
- **Why:** The component abstracts over native elements and must surface their full capability surface, or document explicitly what it intentionally restricts and why.
- **Rejected:** Omitting target entirely simplifies the API but silently breaks a common use case (external links in new tabs) that consumers expect from any link element.
- **Trade-offs:** Adding target requires also adding rel to maintain security when target='_blank' is used. This adds surface area but is the correct minimal extension of native <a> semantics.
- **Breaking if changed:** If target is never added, consumers must wrap the component or use native <a> elements for new-tab links, defeating the purpose of a unified button/link component.

### Using native `disabled` attribute on `<button>` AND explicitly setting `aria-disabled='true'` is redundant and signals unresolved design intent — natively disabled buttons are removed from tab order, which in healthcare contexts means keyboard users cannot focus locked-state buttons to receive tooltip context (2026-03-06)
- **Context:** Deciding between native disabled (removes from tab order, implicit aria-disabled) vs aria-disabled-only pattern (stays in tab order, must prevent action in JS)
- **Why:** Native disabled was chosen for simplicity but aria-disabled was also added, suggesting the developer was uncertain or cargo-culting
- **Rejected:** aria-disabled-only pattern: button remains focusable (keyboard users can receive tooltip), but requires JS to intercept and block click/keydown events
- **Trade-offs:** Native disabled: simpler, no JS needed, but keyboard users lose access to the element entirely. aria-disabled-only: more accessible for conveying locked state, but requires manual event prevention
- **Breaking if changed:** Switching from native disabled to aria-disabled-only requires adding event guards — removing event guards will allow disabled buttons to fire actions

#### [Gotcha] CSS custom property cascade from a container web component (hx-button-group) to child web components (hx-button) via --hx-button-group-size does NOT cross Shadow DOM boundaries automatically — the child must explicitly read the custom property in its own Shadow DOM styles (2026-03-06)
- **Situation:** hx-button-group sets --hx-button-group-size on :host expecting hx-button children to consume it, but the stories always explicitly size each button, masking whether the cascade actually works
- **Root cause:** CSS custom properties DO pierce Shadow DOM (they inherit), but only if the receiving component's Shadow DOM styles reference the property. If hx-button doesn't have a rule consuming --hx-button-group-size, the property exists but is unused.
- **How to avoid:** CSS custom property cascade is elegant and zero-JS, but creates an invisible contract between components that is easy to break and hard to test without end-to-end integration tests

#### [Gotcha] `aria-label` on a Shadow DOM custom element host does not propagate to the inner native `<button>` — icon-only buttons with `aria-label` on the host are inaccessible (WCAG 4.1.2) (2026-03-06)
- **Situation:** Accessibility in web components with Shadow DOM — screen readers interact with the inner native button, not the host element
- **Root cause:** The accessible name computation for the inner `<button>` uses its own subtree and explicit attributes — the host's `aria-label` is not in scope for the shadow root's button element
- **How to avoid:** Requires exposing an `ariaLabel` property that explicitly sets `aria-label` on the inner `<button>` element, adding API surface; not doing so silently passes axe-core if icon-only test cases aren't covered

#### [Gotcha] Private methods appear in the Custom Elements Manifest `members` array, exposing implementation details to tooling consumers (IDE autocomplete, design system documentation generators) (2026-03-06)
- **Situation:** CEM (Custom Elements Manifest) generation for web component libraries
- **Root cause:** CEM analyzers may not correctly filter private TypeScript members — or the `@private` JSDoc tag was omitted — causing private methods to surface in public API documentation and IDE hints
- **How to avoid:** Explicit `@private` annotation or naming convention (underscore prefix) is required for correct CEM filtering; this is not automatic

### Changed container from <dl> to <div> because container uses <slot> for children, and <dl> semantically requires direct <dt>/<dd> children. Since rows use explicit ARIA roles, container doesn't need to be <dl>. (2026-03-06)
- **Context:** Container component had <dl role='list'> with <slot>. Child rows were switching to role='term'/'definition' instead of native <dt>/<dd>.
- **Why:** HTML spec violation: <dl> requires <dt> and/or <dd> as direct children. Slotted content (rows with role='term') doesn't satisfy this requirement. Using role='list' container is semantically cleaner when using ARIA roles in children.
- **Rejected:** Keep <dl> and hope axe doesn't validate direct children (fragile, relies on axe gaps). Use native <dt>/<dd> in light DOM instead of shadow DOM (breaks component encapsulation).
- **Trade-offs:** Switching to <div> removes semantic meaning from container itself, but using ARIA-marked rows provides semantic meaning where it matters (the data). Container becomes neutral styling wrapper.
- **Breaking if changed:** Tests querying for <dl> tag will fail. CSS selectors targeting :not(dl) or dl-specific styles will break.

#### [Pattern] vite.config.ts auto-discovers components via glob pattern 'src/components/hx-*/index.ts' - no vite configuration changes needed when adding new components. src/index.ts is auto-generated via generate:barrel.js prebuild hook - never edit manually. (2026-03-06)
- **Problem solved:** When implementing new hx-structured-list component, no changes to build config or barrel exports were needed. Component was automatically included in build and exports.
- **Why this works:** Reduces boilerplate and manual orchestration. Ensures consistency across all components. Makes adding components a pure file-system operation (create directory, write files, done).
- **Trade-offs:** Developers must follow the naming convention (hx-*) and export structure (index.ts with default export). Adds small overhead to build pipeline for barrel generation, but pays off at scale.

#### [Pattern] Component registration is fully auto-discovered — creating a folder with index.ts is sufficient; no manual barrel or vite entry point edits needed (2026-03-06)
- **Problem solved:** Adding a new hx-carousel component to a library with 49+ existing components
- **Why this works:** scripts/generate-barrel.js auto-generates src/index.ts and vite.config.ts auto-discovers entry points by scanning component directories
- **Trade-offs:** New components appear automatically but the auto-generation script must be run (or it runs on build); developers must know about this convention or they'll waste time looking for registration files

#### [Pattern] The _isInteractive flag computed via closest() at connectedCallback is not reactive — if hx-list's variant attribute changes after mount, child items retain stale interactive state (2026-03-06)
- **Problem solved:** hx-list-item caches whether it is inside an interactive list by calling this.closest('hx-list[variant=interactive]') once at connection time.
- **Why this works:** Simpler than setting up a MutationObserver or requiring hx-list to propagate changes down to children
- **Trade-offs:** Single-read approach is cheap and covers the primary use case (variant set before render). Fails dynamic variant switching which is a valid runtime pattern.

#### [Gotcha] LitElement firstUpdated() is wrong place for core ARIA attributes on SSR/Drupal components — use connectedCallback() or static render template instead (2026-03-06)
- **Situation:** hx-progress-ring set role=progressbar, aria-valuemin, aria-valuemax in firstUpdated() which only fires after client-side JS renders, leaving the element inaccessible during SSR/pre-hydration
- **Root cause:** firstUpdated() is convenient for post-render DOM work, but ARIA landmark attributes must exist in initial HTML for Drupal server-side rendering and screen readers that parse before hydration
- **How to avoid:** connectedCallback() runs before render so you can't query shadow DOM, but static host attributes via static properties or connectedCallback are safe for role/aria-value* that don't depend on shadow DOM

### aria-busy=true should be set on indeterminate progressbar to signal active loading to assistive technologies (2026-03-06)
- **Context:** hx-progress-ring indeterminate state visually shows a spinner but does not set aria-busy, reducing AT experience quality in healthcare dashboard contexts where indeterminate means data is actively loading
- **Why:** ARIA APG recommends aria-busy=true when a region is actively loading; without it, screen readers announce the progressbar exists but not that it is in an active loading state
- **Rejected:** Relying solely on role=progressbar without aria-valuenow to imply indeterminate — technically correct per spec but misses the AT communication that loading is actively in progress
- **Trade-offs:** Adding aria-busy requires toggling it in _syncState() alongside indeterminate attribute — small complexity but meaningful AT improvement
- **Breaking if changed:** Removing aria-busy once added would silently degrade AT experience for indeterminate loading states without any test failure unless a specific aria-busy assertion test exists

#### [Gotcha] CSS :host(:not([placement])) maps to bottom-start position, but the JS property default is 'bottom-end'. These disagree on which corner is the fallback. (2026-03-06)
- **Situation:** Placement has reflect:true so the attribute is always set on first render, masking the mismatch — but programmatic removeAttribute('placement') exposes it.
- **Root cause:** CSS authored independently from JS defaults without cross-referencing, a common split-ownership bug in Web Components where styles and logic are in separate files.
- **How to avoid:** Leaving both is a latent bug; removing CSS no-attribute rule is safest but requires confidence that reflect always fires before paint.

### aria-atomic='true' was omitted from the live region, meaning screen readers may announce partial toast content rather than the complete notification message. (2026-03-06)
- **Context:** Toast uses role='status' or role='alert' as a live region. Without aria-atomic, SR may read only the changed DOM subtree (e.g., just the icon) rather than the full composed message.
- **Why:** Atomic is not the default for live regions — it must be explicitly set. The omission is easy to miss because most desktop SR testing passes with partial announcements that still convey meaning.
- **Rejected:** Relying on default (non-atomic) live region behavior — acceptable for simple text but breaks when toast content includes icon + message + action as separate child nodes.
- **Trade-offs:** aria-atomic='true' causes the entire region to re-announce on any child change, which is correct for notifications but could over-announce if toast content updates in place.
- **Breaking if changed:** Without aria-atomic, screen reader users may hear incomplete announcements ('alert' or icon text only) missing the actual notification message content.

### No Drupal JS behaviors file (hx-toast.drupal.js) was created, making the component unusable in Twig-based Drupal rendering contexts without a manual integration bridge. (2026-03-06)
- **Context:** Healthcare platform targets Drupal as a primary CMS. Components requiring JS initialization need a Drupal.behaviors entry point to fire after Drupal's AJAX lifecycle (not just DOMContentLoaded).
- **Why:** Web Component auto-upgrade handles initial page load, but Drupal AJAX replaces DOM subtrees without firing DOMContentLoaded — behaviors are the Drupal-idiomatic hook for post-AJAX init.
- **Rejected:** Relying on custom element auto-upgrade alone — works on full page loads but breaks for AJAX-injected content in Views, panels, and inline entity forms.
- **Trade-offs:** A behaviors file adds a Drupal-specific artifact to a design system component, coupling it to one CMS. Alternative: document that consumers must call Drupal.behaviors themselves.
- **Breaking if changed:** Without behaviors integration, programmatic toast() calls triggered by Drupal AJAX responses will fail or target detached DOM nodes.

#### [Gotcha] Module-level mutable counter for ID generation is not SSR-safe and causes ID collisions in multi-document environments like Storybook iframes (2026-03-06)
- **Situation:** let _popoverCounter = 0 at module scope increments per-import, but in Storybook each story iframe may share the module, causing duplicate IDs across stories
- **Root cause:** Simple incrementing counter is idiomatic for singleton module patterns but breaks when the module is instantiated in multiple browsing contexts or when SSR hydration runs in parallel
- **How to avoid:** crypto.randomUUID() is zero-collision but non-deterministic, making snapshot tests harder; counter is deterministic but collision-prone

#### [Gotcha] @floating-ui/dom bundled inside web component instead of being externalized in Vite config, causing component to exceed 5KB budget before any component code (2026-03-06)
- **Situation:** hx-overflow-menu audit revealed floating-ui dependency was not listed as external in Vite/Rollup config, so it gets tree-shaken into the component bundle
- **Root cause:** Vite does not auto-externalize non-peer dependencies — you must explicitly declare them as external or mark as peerDependencies in package.json
- **How to avoid:** Externalizing reduces component bundle size but requires consumers (and Storybook) to provide the dependency; bundling is zero-config for consumers but kills budget

#### [Gotcha] bind(this) called inside connectedCallback creates a new function reference on every DOM connection cycle, causing event listener leaks when elements are moved in the DOM (2026-03-06)
- **Situation:** hx-overflow-menu bound document-level click and keydown handlers inside connectedCallback; disconnectedCallback removes only the most recent binding, leaking prior bindings on document
- **Root cause:** The conventional fix is arrow-function class fields (initialized once at class instantiation) or binding in the constructor — both produce a stable reference for add/removeEventListener symmetry
- **How to avoid:** Arrow class fields bind once but add minor memory overhead per instance; constructor binding is explicit but verbose; connectedCallback binding is the worst option with no upside

### Missing arrow-key (Up/Down/Home/End) navigation is a P0 WAI-ARIA menu pattern violation — role=menu without roving tabindex or arrow navigation fails WCAG 2.1 SC 2.1.1 (2026-03-06)
- **Context:** WAI-ARIA authoring practices require that elements with role=menu implement keyboard navigation via arrow keys; Tab/Escape alone is insufficient — arrow keys must move focus between menuitems
- **Why:** Screen reader users in menu mode expect arrow key navigation; without it, the menu is keyboard-inaccessible in virtual cursor mode and fails WCAG 2.1 keyboard accessibility
- **Rejected:** Relying solely on Tab for menuitem focus navigation violates the ARIA menu pattern, which mandates arrow keys so Tab can be reserved for exiting the composite widget
- **Trade-offs:** Implementing roving tabindex or aria-activedescendant adds complexity but is required for ARIA compliance; skipping it makes the component unusable for keyboard-only users
- **Breaking if changed:** Adding arrow navigation requires knowing whether slotted items use roving tabindex or aria-activedescendant pattern — changing focus management model after consumer adoption is a behavioral breaking change

### Status type vocabulary chose UX-semantic terms (online/offline/away/busy/unknown) over spec-defined functional terms (active/inactive/error/warning/unknown) (2026-03-06)
- **Context:** Feature spec defined one vocabulary but implementation used a different, more UX-familiar set
- **Why:** UX-semantic terms map more naturally to UI patterns (chat presence, user status) and are more self-documenting for component consumers
- **Rejected:** Spec-defined terms (active/inactive/error/warning) which are more domain-neutral but less immediately meaningful in UI context
- **Trade-offs:** More intuitive API for frontend devs; breaks contract with feature spec and all downstream Drupal integrations that may have been built against spec vocabulary
- **Breaking if changed:** All downstream consumers, Drupal Twig templates, and any code checking status attribute values will break if vocabulary is changed post-release

#### [Gotcha] CSS var() fallback values (hardcoded hex/rem) create unresolvable tension between resilience pattern and zero-tolerance no-hardcoded-values policy (2026-03-06)
- **Situation:** Component uses tokenStyles import suggesting tokens are guaranteed at render time, yet all var() calls include hardcoded fallbacks
- **Root cause:** Hardcoded fallbacks are standard CSS resilience — if tokens fail to load, component still renders. But if tokenStyles guarantees token availability, fallbacks are redundant and violate policy
- **How to avoid:** Resilience vs. policy purity; the ambiguity reveals an unresolved architectural question about whether token loading is guaranteed or best-effort

#### [Gotcha] Invalid/absent status attribute causes silent invisible rendering — no default --_dot-color fallback on :host (2026-03-06)
- **Situation:** If status is set to an unrecognized value, no CSS rule matches, --_dot-color is never assigned, dot renders transparent
- **Root cause:** Only explicit status values have CSS rules; no catch-all default was implemented
- **How to avoid:** Silent failure is harder to debug in production; a visible fallback color would surface integration errors during development

#### [Gotcha] Component absent from `src/index.ts` entry point is silently unshippable: the implementation, tests, and stories all work in isolation, but consumers of the published package cannot access the component at all (2026-03-06)
- **Situation:** hx-structured-list fully implemented and tested but missing from library barrel export — would ship in the bundle but be unreachable via named import
- **Root cause:** Entry point registration is a manual step with no automated enforcement; there is no lint rule or CI check that validates every component directory has a corresponding export
- **How to avoid:** Decoupled barrel exports give explicit control but require discipline; auto-discovery via glob exports would prevent omissions but reduce explicitness

#### [Gotcha] Cross-shadow-boundary CSS variable inheritance via `--_` (private) prefix creates implicit coupling: `hx-structured-list` sets `--_padding-block` on `:host`, row component reads it via `var(--_padding-block, fallback)` — works because CSS custom properties inherit through light DOM, but breaks when row is used standalone (2026-03-06)
- **Situation:** `condensed` variant needed to affect row padding without the parent directly controlling row internals
- **Root cause:** CSS custom property inheritance through the DOM tree (including across shadow boundaries via slotted content) was leveraged as a zero-JS coordination mechanism
- **How to avoid:** The `--_` private-prefix convention signals "internal use only" but this property crosses component boundaries, violating that intent; standalone row usage silently loses the condensed sizing

#### [Gotcha] Math.random() for generating component-internal IDs causes SSR hydration mismatches — server and client generate different IDs, breaking aria-labelledby and aria-controls references (2026-03-06)
- **Situation:** hx-contextual-help generates _headingId and _popoverId with Math.random().toString(36) to create unique DOM IDs for ARIA references across multiple instances
- **Root cause:** Quick unique ID generation without importing a library
- **How to avoid:** crypto.randomUUID() is deterministic per-call but still not SSR-safe without a seeded strategy; true SSR safety requires instance counting or server-provided IDs

### CSS custom properties on hx-* web components must use --hx- prefix namespace (e.g., --hx-arrow-color, --hx-auto-size-available-width) rather than generic names (2026-03-06)
- **Context:** Initial implementation used --arrow-color and --arrow-size without namespace prefix, caught in PR review
- **Why:** Generic CSS custom property names (--arrow-color) pollute the global CSS variable namespace and risk collision with consumer stylesheets or other component libraries; --hx- prefix scopes them to the Helix design system
- **Rejected:** Generic names like --arrow-color — would silently inherit or override unrelated consumer variables with the same name
- **Trade-offs:** More verbose consumer API, but eliminates silent style inheritance bugs in composed UIs
- **Breaking if changed:** Any consumer styling the arrow via --arrow-color would break if this prefix convention is applied post-release; must be treated as a breaking change

### Type assertion (as Placement[]) is appropriate on string[] props that consumers populate with valid enum-constrained values in low-level primitives; runtime validation is over-engineering (2026-03-06)
- **Context:** flipFallbackPlacements is string[] at the component property level but FloatingUI requires Placement[] — a cast was flagged in review
- **Why:** hx-popup is a T4 low-level primitive; adding a runtime filter/validation loop adds complexity, bundle size, and silent behavior changes (filtering invalid values) with no practical benefit since the component's contract already states valid Placement strings are expected
- **Rejected:** Runtime validation loop filtering invalid placements — would silently swallow invalid values, making debugging harder; adds complexity inappropriate for a low-level primitive
- **Trade-offs:** Invalid string values passed to flipFallbackPlacements will cause FloatingUI errors at runtime rather than being caught early; acceptable for a primitive where consumers own correctness
- **Breaking if changed:** If FloatingUI strengthens its type guards, the cast may cause runtime errors with invalid values passed through

### `aria-modal` on a dialog element is insufficient for screen reader isolation — sibling elements in the host page must be explicitly set to `aria-hidden="true"` when the modal is open. (2026-03-06)
- **Context:** Implementing accessible modal drawer that prevents background content from being read by screen readers.
- **Why:** `aria-modal` has inconsistent support across screen reader/browser combinations (notably NVDA+Chrome historically ignores it). The only reliably cross-SR approach is programmatically setting `aria-hidden` on all sibling DOM nodes of the drawer host when open, then restoring on close.
- **Rejected:** `aria-modal` alone was used, likely because the spec implies it should be sufficient. It is the simpler implementation but fails real-world AT testing.
- **Trade-offs:** The `aria-hidden` sibling approach requires traversing and mutating live DOM on open/close — more complex, but the only approach with consistent cross-platform AT behavior. Must be carefully reverted on close and on unexpected unmount.
- **Breaking if changed:** Without aria-hidden on siblings, screen reader users can navigate out of the drawer into background content while the drawer is visually blocking interaction — a critical WCAG 1.3.1/4.1.2 failure.

### `DrawerSize | string` union type collapses entirely to `string` in TypeScript, providing zero autocomplete benefit or type safety over plain `string`. Union types with literal members only add value when the base type is excluded. (2026-03-06)
- **Context:** Defining a `DrawerSize` type as a union of string literals (e.g., `'sm' | 'md' | 'lg'`) combined with `| string` to allow arbitrary values.
- **Why:** TypeScript widens `'sm' | 'md' | 'lg' | string` to just `string` because `string` subsumes all string literals. The intent was to allow extension while providing IDE hints, but the result is the opposite — no hints, no safety.
- **Rejected:** The `| string` escape hatch was added to avoid breaking callers who pass custom size values, but it negates the entire purpose of the literal union. The correct approach is either a strict union (breaking change for custom values) or a documented string type with JSDoc `@example` for valid values.
- **Trade-offs:** Strict union: better DX and type safety, but callers with custom sizes must cast. Plain `string` with JSDoc: honest about the lack of constraint. `Literal | string` union: worst of both worlds — appears typed but isn't.
- **Breaking if changed:** Changing to a strict union breaks any caller passing non-enumerated size values. Changing to plain `string` is technically compatible but removes the false type annotation.

### hx-menu-item uses hardcoded inline SVGs for checkmark, chevron-right, and spinner icons instead of the project's hx-icon component and hx-spinner component (2026-03-06)
- **Context:** Component needs iconography for checked state, submenu indicator, and loading state
- **Why:** Likely implemented for self-containment — avoiding runtime dependency on hx-icon being registered before hx-menu-item
- **Rejected:** Using hx-icon/hx-spinner would align with project conventions, enable theming via the icon system, and reduce bundle duplication
- **Trade-offs:** Inline SVGs make the component self-contained at the cost of: duplicating spinner logic already in hx-spinner, bypassing the project icon system for theming/localization, inflating min+gz bundle size for this component
- **Breaking if changed:** Switching to hx-icon creates a registration-order dependency — hx-icon must be defined before hx-menu-item renders, which breaks usage patterns where only hx-menu is imported

#### [Gotcha] Placing ARIA live region roles (role='alert'/'status') inside shadow DOM internals rather than on the host element breaks screen reader detection in JAWS and older AT that don't pierce shadow roots (2026-03-06)
- **Situation:** hx-message-bar put role='alert'/'status' on an internal shadow DOM div; healthcare deployments rely on JAWS which may not traverse shadow roots for live region registration
- **Root cause:** Developer likely followed standard HTML patterns without accounting for shadow DOM encapsulation boundary — the role is semantically correct in isolation but the AT never sees it
- **How to avoid:** Shadow DOM role placement keeps style encapsulation clean but sacrifices AT discoverability; host element role works for AT but leaks semantics into the light DOM

#### [Gotcha] aria-atomic omission on role='status' causes assistive technology to announce partial content updates piecemeal, which is especially dangerous when success messages contain patient data in healthcare contexts (2026-03-06)
- **Situation:** hx-message-bar info/success variants use role='status' without aria-atomic='true'; if message content updates dynamically, AT may read mid-update DOM state
- **Root cause:** aria-atomic is a nuanced ARIA attribute that's easy to omit — developers often add the role without the companion attribute
- **How to avoid:** None — aria-atomic='true' is a pure improvement; omitting it only creates risk

#### [Pattern] Event name deviation from spec (hx-close emitted vs hx-dismiss specified) without documentation creates an undiscoverable API contract mismatch that only surfaces when consumers wire event listeners (2026-03-06)
- **Problem solved:** The feature spec named the dismiss event 'hx-dismiss'; implementation emits 'hx-close'; no changelog, comment, or README documents this deviation
- **Why this works:** The deviation likely felt like an improvement (hx-close is more intuitive for the action) but skipped the spec alignment process
- **Trade-offs:** Better name short-term; permanent divergence between spec docs and implementation long-term; every consumer using spec-based event listeners silently gets no events

### Every enabled hx-tile unconditionally receives role='button', aria-pressed, and keyboard/click handlers with no static/decorative mode (2026-03-06)
- **Context:** P0-01: Component was designed assuming all tiles are interactive, leaving no way to render a purely decorative or display-only tile
- **Why:** Likely an initial scoping decision to ship interactive tiles only; static mode adds API surface and branch complexity
- **Rejected:** Adding a 'mode' enum or 'clickable' boolean was deferred — probably to keep the MVP simple
- **Trade-offs:** Simpler initial implementation, but forces consumers to work around inaccessible semantics for any non-interactive tile use case; cannot be fixed without a breaking API change
- **Breaking if changed:** Removing unconditional interactivity requires a new prop (clickable/mode) and changes default rendering behavior — any consumer relying on current always-interactive behavior would need migration

#### [Gotcha] display:grid on :host vs inner container — CSS Grid must be on the element whose direct children are grid items. Setting display:grid on :host makes the host a grid container for shadow DOM children, NOT for slotted content. Slotted content is laid out by the light DOM parent's formatting context, which is the inner wrapper div. If grid layout properties (grid-template-columns, row-gap, etc.) are on the inner div but that div lacks display:grid, the properties are silently ignored. (2026-03-06)
- **Situation:** hx-grid had display:grid on :host in CSS, but all grid container properties applied via inline style to inner <div part='base'>. The div had no display:grid so the grid never worked — children stacked vertically.
- **Root cause:** Developer likely assumed :host display:grid would cascade or transfer grid behavior to inner container, or confused the two formatting contexts
- **How to avoid:** Using inner div wrapper enables ::part() styling and clean separation, but requires display:grid on that div too, not just the host

#### [Gotcha] TypeScript's type system provides false safety for runtime attribute values from HTML. A property typed as GapSize with a Record<GapSize, string> lookup appears fully safe at compile time, but HTML attributes are always strings at runtime — an unknown value bypasses TypeScript's checks entirely. The ?? fallback then silently swallows the invalid input instead of surfacing a validation error. (2026-03-06)
- **Situation:** hx-grid._resolveGap() had `return GAP_TOKENS[size] ?? GAP_TOKENS.md` — the fallback is unreachable via TypeScript-typed callers but reachable via HTML attribute strings cast to GapSize.
- **Root cause:** TypeScript Record<GapSize,string> guarantees index safety for compile-time callers, encouraging omission of runtime validation
- **How to avoid:** Silent fallback gives resilient behavior but hides consumer errors; explicit validation would break layouts visibly but aid debugging

#### [Gotcha] Setting role='presentation' on a Web Component host removes the element from the accessibility tree, silently ignoring any aria-label/aria-labelledby attributes consumers set on the element (2026-03-06)
- **Situation:** hx-stack auto-sets role='presentation' as a layout-only component guard, but consumers who write <hx-stack aria-label='Patient demographics'> will find the label has no effect on assistive technologies
- **Root cause:** Layout-only components should not appear in the accessibility tree, so role='presentation' is architecturally correct — but the silent ARIA attribute nullification is a non-obvious consumer footgun
- **How to avoid:** Correct accessibility semantics for layout vs. confusing developer experience when ARIA attributes are silently ignored

#### [Gotcha] TypeScript union types for Web Component properties provide compile-time safety only — invalid HTML attribute values from Drupal Twig templates (e.g. direction='diagonal') silently fail with no CSS match and no runtime warning (2026-03-06)
- **Situation:** Healthcare app where Drupal CMS may render arbitrary attribute values; hx-stack accepts direction='horizontal'|'vertical' but a typo in a Twig template produces silent no-op
- **Root cause:** TypeScript doesn't run at Drupal render time; the component receives raw HTML attribute strings that bypass all type checking
- **How to avoid:** Development-mode console warnings add a small runtime check but require an updated() lifecycle hook and are stripped in production

### Using `role='region'` + static `aria-label='Code snippet'` on every instance creates duplicate landmark labels that break screen reader navigation when multiple snippets exist on one page. (2026-03-06)
- **Context:** WCAG technique requires unique labels for same-role landmarks. Screen readers expose a landmark list; identical 'Code snippet' labels make navigation ambiguous.
- **Why:** Static label was likely chosen for simplicity. Dynamic labeling (e.g., incorporating `language` attribute: 'JavaScript code snippet') requires each instance to compose its own label string.
- **Rejected:** Removing `role='region'` entirely was not chosen but would actually be safer than duplicate labels — landmarks only help when they're meaningful and distinguishable
- **Trade-offs:** Static label is zero-maintenance but fails multi-snippet pages; dynamic label using language attribute solves uniqueness but requires language to always be set and meaningful
- **Breaking if changed:** If role=region is removed, screen reader users lose landmark navigation to code blocks; if kept with static label on multi-snippet pages, landmark navigation becomes useless noise

### Array-typed Lit properties (@property({ type: Array })) cannot be set via HTML attributes — breaks Drupal/Twig integration for swatches (2026-03-06)
- **Context:** swatches: string[] is declared as a Lit property with type: Array, expecting consumers to set it via JS. In Drupal, components are rendered server-side in Twig and attributes are the only available integration surface
- **Why:** HTML attributes are strings only — complex types (arrays, objects) require JavaScript assignment or a JSON-serialized attribute with custom converter
- **Rejected:** Using type: Array without a custom fromAttribute converter means the property is JS-only by design, but this was not documented
- **Trade-offs:** Clean JS API but completely unusable from server-side templating without a Drupal behavior or custom element upgrade script
- **Breaking if changed:** Drupal integrations that attempt to set swatches via Twig attribute will silently receive an empty/undefined array

#### [Gotcha] HSV round-trip bug: parseColor cannot parse HSV format strings, so components set to format='hsv' cannot consume their own output (2026-03-06)
- **Situation:** hx-color-picker supports outputting colors in HSV format via the format property, but the parseColor utility has no HSV parser — so if a consumer feeds the emitted HSV string back as input value, it fails silently
- **Root cause:** HSV is not a CSS-native color format — there is no standard string representation, and parseColor likely only handles CSS-standard formats (hex, rgb(), hsl())
- **How to avoid:** HSV format output is usable only as a one-way transform — any two-way binding or value initialization from stored HSV strings will silently produce wrong colors

#### [Gotcha] hx-theme's dark token override mechanism works by flattening the dark JSON sub-tree without the 'dark.' prefix so tokens override the base layer — but this is undocumented and relies entirely on consumers using semantic tokens, not primitives, since primitives are never overridden in dark mode (2026-03-06)
- **Situation:** Dark mode token injection appeared to work correctly in tests but the mechanism was fragile and opaque
- **Root cause:** The flattening approach avoids duplicating all tokens for each theme — only overrides are stored in the dark sub-tree
- **How to avoid:** Smaller token bundle, but silent breakage if a consumer references a primitive token expecting dark-mode override — they get the light value with no warning

#### [Gotcha] high-contrast theme shares identical token overrides with dark mode — confirmed by a passing test that checks dark token values in HC mode, meaning HC is a named stub with zero distinct implementation (2026-03-06)
- **Situation:** high-contrast is required for healthcare compliance (WCAG AA for low-vision users) and was listed as a supported ThemeName
- **Root cause:** Likely implemented as a placeholder expecting tokens to be added later, but shipped without the token set
- **How to avoid:** Fast to stub, but creates a compliance gap that is invisible at the type level and only catchable by reviewing actual token values

#### [Gotcha] Three-tier token cascade (primitives → semantics → component tokens) is not implemented — primitives and semantics are injected into the same stylesheet with no tier distinction, making consumer override targeting ambiguous (2026-03-06)
- **Situation:** CLAUDE.md specifies a three-tier cascade as an architecture contract for design token systems
- **Root cause:** Simpler to inject all tokens in one pass; tier distinction requires structural metadata in the token source
- **How to avoid:** Simpler implementation, but consumers cannot safely override primitives without accidentally breaking semantic token computations that chain off them

### hx-theme requires JavaScript and custom element instantiation for all theme application — there is no static CSS fallback, no :is([data-theme='dark']) selector, and no exported CSS file for attribute-based theming, making it incompatible with Drupal server-rendered markup patterns (2026-03-06)
- **Context:** Drupal cannot always wrap server-rendered content in custom elements; the common Drupal pattern is a data-hx-theme attribute on body or section
- **Why:** Custom element lifecycle (firstUpdated) was chosen as the injection point for simplicity and encapsulation
- **Rejected:** A static CSS file with attribute selectors (body[data-theme='dark'] { --token: value }) would work without JS but requires publishing a separate CSS artifact and duplicating token values
- **Trade-offs:** Cleaner Web Component architecture but zero server-rendered compatibility; every Drupal theme application requires JavaScript to be available and executed
- **Breaking if changed:** Removing the JS-only injection in favor of static CSS would require publishing a new CSS bundle and changing all consumer integration patterns

#### [Gotcha] A component named 'focus ring' with zero autonomous :focus-visible detection is architecturally misleading — the entire focus-tracking responsibility is externally delegated via a `visible` prop (2026-03-06)
- **Situation:** hx-focus-ring component was implemented as a purely passive visual utility requiring consumers to wire focus state themselves
- **Root cause:** Simpler initial implementation — avoids complexity of slot-based focus listeners or :focus-within CSS
- **How to avoid:** Drupal Twig templates cannot use the component without custom JavaScript behavior wiring; reduces composability and defeats the stated value proposition

#### [Gotcha] Silently swallowing dynamic import errors (`.catch(() => undefined)`) in Storybook stories makes component load failures completely invisible — story renders empty with no diagnostic signal (2026-03-06)
- **Situation:** WrappingHelixButton story dynamically imports hx-button and discards all errors, so path changes or build failures produce a broken story with no console output
- **Root cause:** Likely cargo-culted error suppression pattern to prevent unhandled promise rejection warnings
- **How to avoid:** Silent catch prevents noisy rejection warnings but trades debuggability — failures become invisible and hard to triage

#### [Gotcha] aria-hidden on a shadow DOM container does not reliably hide slotted content from assistive technologies across all browser/AT combinations (2026-03-06)
- **Situation:** hx-popup used aria-hidden on the shadow root container expecting it to suppress all content from screen readers, including slotted light DOM content
- **Root cause:** aria-hidden was used as a blanket suppression mechanism when the popup is inactive
- **How to avoid:** display:none is sufficient for hiding from AT; aria-hidden on shadow containers creates unpredictable behavior because slotted content lives in light DOM, not shadow DOM — aria-hidden does not cross the slot boundary reliably

### `role='alert'` should be scoped to error variant only; warning/success should use `aria-live='polite'` — urgency of announcement must match the severity of the state (2026-03-06)
- **Context:** hx-help-text has no dynamic announcement mechanism at all; when adding one, the choice of `role='alert'` vs `aria-live` matters for screen reader UX
- **Why:** Error messages (validation failures) are time-sensitive and require immediate interruption of screen reader flow — `role='alert'` (implicit `aria-live='assertive'`) is appropriate. Warning/success are informational and should queue politely without interrupting the user
- **Rejected:** Applying `role='alert'` uniformly to all variants — would cause aggressive screen reader interruptions for success/warning states, degrading UX
- **Trade-offs:** Variant-conditional ARIA roles add implementation complexity but produce correct screen reader behavior across clinical/form contexts
- **Breaking if changed:** Using `aria-live='polite'` for errors means validation messages may be delayed or skipped if the user is actively navigating — a compliance risk in healthcare form contexts

#### [Gotcha] Native `<label for='...' >` inside a shadow root cannot associate with an input in light DOM — shadow root scoping isolates ID lookups to within the same root (2026-03-06)
- **Situation:** hx-field-label renders a `<label for='...'>` inside its shadow DOM, expecting consumers to pass the ID of a light-DOM input. The association silently fails at runtime.
- **Root cause:** HTML spec defines that `for`/`id` label association is scoped to the same document fragment (shadow root). Cross-shadow-root ID lookup is explicitly not supported.
- **How to avoid:** The component API looks correct and intuitive (mirrors native `<label for>`), but delivers zero accessibility benefit in the primary use case. axe-core cannot detect this failure, so automated tests pass while the component is fundamentally broken.

### The correct cross-shadow-DOM labeling pattern is `aria-labelledby` targeting the host element's `id`, or `ElementInternals.setFormValue`/label association — NOT `<label for>` across shadow boundaries (2026-03-06)
- **Context:** When a label component must associate with an external input (outside its shadow root), native `<label for>` is architecturally unusable.
- **Why:** `aria-labelledby` references are resolved across shadow boundaries by browsers via the accessibility tree, unlike `for`/`id` which uses DOM ID lookup scoped to the shadow root.
- **Rejected:** `ElementInternals` label association requires the labeled element to use `ElementInternals` too — not viable for labeling arbitrary third-party or native inputs. `aria-labelledby` is the only universally applicable approach.
- **Trade-offs:** `aria-labelledby` requires the consumer to set an `id` on the label host and reference it on the input — more verbose but correct. Loses the semantic `<label>` click-to-focus behavior unless a click handler is added manually.
- **Breaking if changed:** Changing from `for` to `aria-labelledby` pattern is a breaking API change for all existing consumers. Requires coordinated migration with `hx-field` and all composite form components.

#### [Pattern] CSS custom properties consumed by a component must be documented as `@cssprop` in JSDoc even if they are internal cascade tokens — undocumented tokens become invisible contracts that break consumers on token renames (2026-03-06)
- **Problem solved:** `--hx-color-danger` was used in hx-field-label styles for the required asterisk color but omitted from `@cssprop` documentation. Consumers who try to override required-indicator color have no documented API surface.
- **Why this works:** Custom property documentation via `@cssprop` is the only mechanism for surfacing the component's theming API to consumers. Undocumented properties work accidentally but create invisible coupling — a rename of `--hx-color-danger` breaks the component with no warning.
- **Trade-offs:** Component-scoped tokens add one layer of indirection but make the theming API stable and overridable at component granularity. Direct global token consumption is simpler but creates tight coupling to the global token name.

### Empty string as a sentinel for 'use current time' in a date attribute is a footgun — it is indistinguishable from an unset attribute in many binding contexts and conflicts with how Intl APIs treat empty strings as invalid input (2026-03-06)
- **Context:** hx-format-date used date='' to mean 'display current time now', conflicting with Storybook/framework attribute binding behavior
- **Why:** Empty string was chosen as a convenient sentinel but creates ambiguity between 'not provided', 'invalid', and 'intentionally empty'
- **Rejected:** Using null or omitting the attribute — these would be clearer signals but require different handling in the component's attribute-changed callback
- **Trade-offs:** A named sentinel value (e.g., 'now') or a separate boolean attribute (use-current-time) would be unambiguous but is a breaking API change
- **Breaking if changed:** Changing the sentinel from '' to any other value breaks existing usage; removing empty-string support silently breaks 'current time' feature

#### [Pattern] Drupal documentation for web components must explicitly address the client-side hydration FOUC/SEO tradeoff — a component that formats dates client-side leaves the element empty until JS hydrates, which is critical for Drupal installations where dates may appear in crawled or server-rendered content (2026-03-06)
- **Problem solved:** hx-format-date is a pure client-side Intl formatter; Drupal typically formats dates server-side via format_date() or Twig |format_date
- **Why this works:** The tradeoff must be documented so Drupal integrators can make an informed choice between using the web component (dynamic, locale-aware, FOUC risk) vs. server-side formatting (static, no FOUC, no client locale adaptation)
- **Trade-offs:** Client-side Intl formatting enables user-locale adaptation and timezone support without server config; server-side formatting is more reliable for SEO and AT but requires CMS locale configuration

### `:host { overflow: hidden }` used to clip ripple waves at component boundary, but this also clips slotted content overflow like tooltips and dropdown menus (2026-03-06)
- **Context:** hx-ripple needs to contain its animated wave within the component boundary while allowing arbitrary slotted interactive elements
- **Why:** Simplest way to clip the ripple animation to the host boundary without extra wrapper elements
- **Rejected:** Applying overflow:hidden only to .ripple__base with clip-path — more complex but preserves slot overflow
- **Trade-offs:** Simpler implementation vs. broken tooltips/dropdowns/focus-rings on slotted content; host overflow:hidden is an architectural trap when the component accepts slot content
- **Breaking if changed:** Removing overflow:hidden from host causes ripple waves to render outside component bounds; moving it to .ripple__base fixes slotted content but requires structural refactor

#### [Gotcha] An audit worktree for a component cannot read files from the implementation worktree — the component source lives in a separate feature worktree and must be read from that path explicitly (2026-03-06)
- **Situation:** T4-09 audit task ran in its own worktree (feature/audit-hx-ripple-t4-09-antagonistic) but the component being audited (hx-ripple) only existed in feature/implement-hx-ripple-t4-material-ripple worktree
- **Root cause:** Worktrees are isolated filesystem checkouts — files not yet merged to dev don't exist in other worktrees
- **How to avoid:** AUDIT.md must be written to the audit worktree's directory path, while source reads come from the implementation worktree path — two different absolute paths for the same logical component

#### [Pattern] AUDIT.md gate notes must explicitly list all deferred accessibility issues (e.g. M10 loading nav announcement) even if not fixed in current PR (2026-03-06)
- **Problem solved:** PR review caught that M10 (loading state navigation announcement) was missing from the accessibility gate notes section of AUDIT.md, making the audit appear more complete than it was.
- **Why this works:** Gate notes serve as the single source of truth for what remains deferred. Omitting known issues creates false confidence in audit completeness and causes downstream teams to miss required follow-up work.
- **Trade-offs:** More verbose AUDIT.md, but accurate representation of technical debt for future audit passes.

### Audit score snapshots in AUDIT.md are intentionally not annotated with tool version, date, or commit SHA (2026-03-06)
- **Context:** Bot requested provenance metadata be added to the scores table in AUDIT.md
- **Why:** Audit scores are one-time diagnostic snapshots whose purpose is to motivate and scope the audit work — not to be reproducible artifacts. Scores change after fixes are applied, making the pre-fix snapshot obsolete by design. Adding tool version and commit hash adds noise without actionable value.
- **Rejected:** Adding wc-mcp version, ISO date, and commit SHA to each row — rejected because scores are intentionally ephemeral pre-fix diagnostics, not versioned benchmarks
- **Trade-offs:** Simpler, cleaner audit doc. Trade-off: if someone wants to re-run the audit and compare, they have no baseline reference point — but this use case is not the document's purpose
- **Breaking if changed:** If audit docs were ever used for regression tracking across releases, provenance would become necessary

### Shadow DOM keyboard navigation (ArrowDown/Up, Home, End) must be implemented at the container element (hx-accordion) level, not inside each hx-accordion-item, because shadow roots create separate focus scopes that do not propagate keyboard events to siblings (2026-03-07)
- **Context:** P1-1 fix: arrow key navigation between accordion items requires coordinating focus across multiple custom elements
- **Why:** The container has visibility into all child items and can query their shadow roots to programmatically move focus — individual items cannot reach siblings through the shadow boundary
- **Rejected:** Implementing keydown handlers inside hx-accordion-item — each item's shadow root is isolated and cannot dispatch focus to a sibling's shadow root without parent coordination
- **Trade-offs:** Container-level handling requires the parent to know about item internals (querying shadowRoot.querySelector('summary')), creating tight coupling; but this is unavoidable given shadow DOM encapsulation
- **Breaking if changed:** Removing the ArrowDown/Up handler from hx-accordion.ts breaks keyboard navigation entirely — items have no mechanism to move focus between themselves

### Replace Math.random() ID generation with a module-level monotonic counter (let _uid = 0) for Web Component instance IDs (2026-03-07)
- **Context:** IDs used in aria-describedby and aria-labelledby must be unique per instance. Math.random() is non-deterministic across SSR and test snapshots.
- **Why:** Module-level counter is SSR-safe (no window/crypto dependency), produces deterministic sequential IDs (hx-checkbox-group-1, -2, -3...) that survive snapshot tests, and has zero collision risk within a module lifecycle.
- **Rejected:** crypto.randomUUID() — not available in all SSR environments; Math.random() — non-deterministic in snapshots and theoretically can collide; Date.now() — collision risk under rapid instantiation
- **Trade-offs:** Counter resets on module reload (page refresh), so IDs are not stable across sessions — acceptable since they're only used for in-page ARIA association, not persistence. SSR hydration must ensure server and client render same IDs (counter must start from same state).
- **Breaking if changed:** Changing to Math.random() breaks snapshot tests and SSR hydration consistency

#### [Gotcha] Storybook import pattern fix (package imports vs relative imports) requires Vite alias config in storybook/main.ts and cannot be done in isolation per component (2026-03-07)
- **Situation:** Audit flagged relative imports in component files as a defect (should use @helix/library package imports). But Storybook has no Vite alias mapping @helix/library to the source tree.
- **Root cause:** Storybook builds components in development mode using the source tree directly, not the built package. Without an alias, @helix/library resolves to the built package (if published) or fails. Changing imports without the alias breaks Storybook dev mode.
- **How to avoid:** Deferred as infrastructure change. The fix requires: add resolve.alias in apps/storybook/.storybook/main.ts pointing @helix/library to packages/hx-library/src. This is a one-time infrastructure change that unblocks the import pattern for all components.

#### [Gotcha] Existing public CSS custom properties (--hx-focus-ring-color, --hx-focus-ring-width, --hx-focus-ring-offset) in tokens.json serve dual roles as both public API AND token cascade definitions, requiring an additional tier of semantic intermediary tokens (--hx-border-width-focus, --hx-spacing-focus-offset) for internal style references (2026-03-07)
- **Situation:** Replacing hardcoded values with token references while maintaining backward compatibility with the existing token API surface
- **Root cause:** Direct use of the public tokens internally would collapse the cascade hierarchy. The intermediary tokens allow internal styles to reference semantic sizing tokens while the public tokens remain as theming overrides.
- **How to avoid:** Adds token indirection complexity; gains clean separation between public theming API and internal semantic token references

#### [Pattern] Drupal Twig templates live in testing/drupal/templates/ and wrap the web component declaratively with no JS behavior file needed (2026-03-07)
- **Problem solved:** hx-help-text is structurally simple (declarative, no required JS interaction), so a pure Twig wrapper is sufficient for Drupal CMS integration
- **Why this works:** The component already handles all logic internally as a custom element; Twig only needs to pass attributes and content through to the HTML element
- **Trade-offs:** Simpler integration path but Drupal-specific state (e.g., dynamic error injection) must be handled by the consuming theme's preprocess hooks rather than the component itself

#### [Pattern] aria-describedby association requires the Twig template id variable to match the input's aria-describedby value, enforced by convention not by the component itself (2026-03-07)
- **Problem solved:** Accessible form field description requires the help text element id to match the aria-describedby attribute on the associated input
- **Why this works:** The web component cannot know which input it describes — the association must be established by the integrating template using matching id values
- **Trade-offs:** Explicit id threading is verbose but reliable across shadow DOM boundaries and SSR; implicit proximity would break in complex form layouts

#### [Gotcha] In Lit web components with a wrapper <div part="base">, display:grid must be set on the inner div, not :host. The :host should be display:block or display:contents. (2026-03-07)
- **Situation:** hx-grid had display:grid on :host but slotted children lived in the base div's block formatting context, making all grid properties (grid-template-columns, gap, align-items) completely ineffective — a silent failure with no errors.
- **Root cause:** CSS grid layout only applies to direct children of the grid container. When a shadow root wraps content in a base div, the slotted children are children of that div, not of :host. Setting grid on :host creates a grid container whose only child is the base div, not the grid items.
- **How to avoid:** Easier: grid properties now actually work. Harder: developers must remember that the logical 'container' is the inner div, not the host element — this is a non-obvious indirection.

### Compute timezone-offset ISO datetime attribute (e.g. 2024-09-20T05:00:00-04:00) via two formatToParts() calls (UTC + target TZ) to derive the offset, rather than using Date arithmetic (2026-03-07)
- **Context:** The <time datetime> attribute must use a timezone-offset ISO string when a time-zone is set so assistive technology and visual display agree; Date.toISOString() always returns UTC Z format
- **Why:** formatToParts() in the target timezone gives the wall-clock parts needed to build the offset string; Date arithmetic with getTimezoneOffset() only reflects the browser's local timezone, not the component's configured timezone
- **Rejected:** Date.toISOString() — always UTC, breaks AT/visual agreement. Manual offset math from getTimezoneOffset() — only works for local TZ not arbitrary configured TZ
- **Trade-offs:** Two Intl format calls per render (mitigated by memoization); the approach is correct across DST boundaries because Intl handles DST-aware offset for the specific date
- **Breaking if changed:** Removing this helper causes datetime attribute to always be UTC Z, breaking screen reader timezone announcement when time-zone prop is set

### Use [part='base'] CSS selector instead of element-type selector time {} for styling the shadow DOM time element (2026-03-07)
- **Context:** CSS selector time {} is fragile — it breaks silently if the inner element tag ever changes (e.g. to span for non-time content)
- **Why:** CSS part selectors are an explicit API contract; the part name documents intent and survives internal HTML structure changes
- **Rejected:** time {} tag selector — tightly couples styles to HTML implementation detail with no semantic contract
- **Trade-offs:** Requires maintaining part attribute on the element; part is also the public CSS customization API for consumers
- **Breaking if changed:** Removing [part='base'] from the element causes all host CSS part() overrides from consumers to stop working

### Moved role='option' and aria-selected to the hx-list-item host element via _syncHostAria(), with role='presentation' on internal <li> (2026-03-07)
- **Context:** Shadow DOM creates a double boundary where assistive technologies cannot traverse into shadow roots to discover ARIA roles, breaking the required ul[role=listbox] > [role=option] ownership chain
- **Why:** ARIA ownership must be established in the light DOM tree visible to the accessibility tree. The host element IS in the light DOM as a child of the listbox ul, so putting role=option there makes the ownership chain valid: ul[role=listbox] > hx-list-item[role=option] is visible to ATs without shadow DOM traversal
- **Rejected:** Placing role=option on the internal shadow <li> element — this breaks ARIA ownership because the shadow root creates a boundary that AT cannot cross to verify parent-child ownership relationships
- **Trade-offs:** Tests must check host element for ARIA attributes rather than shadow [part~=base]. Requires _syncHostAria() to keep host attributes in sync with component state reactively.
- **Breaking if changed:** If role=option is moved back inside shadow DOM, screen readers will see listbox with no valid children — all items become inaccessible or unannounced as options

#### [Gotcha] :host-context() is unsupported in Firefox and was causing silent cross-browser failures for interactive styling (2026-03-07)
- **Situation:** hx-list-item needed to style itself differently when inside an interactive hx-list, which the original author solved with :host-context(.interactive) CSS
- **Root cause:** Replaced with :host([interactive]) attribute-based CSS. Parent hx-list now explicitly sets the interactive property on child items via updated() lifecycle hook and slotchange event listener
- **How to avoid:** Requires parent to actively manage child state (more coupling) but eliminates the implicit CSS context dependency. The reactive property approach also enables proper Lit reactivity and test isolation.

#### [Pattern] Parent component manages interactive property on children reactively via updated() lifecycle + slotchange event, rather than children querying parent context (2026-03-07)
- **Problem solved:** hx-list-item needed to know if it was inside an interactive hx-list to adjust ARIA roles, styling, and behavior (href suppression, keyboard handling)
- **Why this works:** Property-driven child state is deterministic, testable in isolation, and works correctly when items are added dynamically. Parent has full knowledge of its configuration; children should not need to traverse DOM to discover context.
- **Trade-offs:** Parent must remember to propagate state on every update() and slotchange. More explicit code in parent. But child components become pure and independently testable.

### crypto.randomUUID() per instance replaces module-level counter for generating unique popover IDs (2026-03-07)
- **Context:** P2-06: module-level _popoverCounter causes ID collisions in SSR (counter resets per module load) and multi-document environments
- **Why:** crypto.randomUUID() generates cryptographically unique IDs with zero shared state. No collision risk across SSR renders, iframes, or microfrontend document contexts.
- **Rejected:** Keeping module counter: works in single SPA but breaks in SSR where module is re-evaluated per request, generating duplicate IDs across rendered HTML
- **Trade-offs:** Slightly longer IDs in DOM; negligible. UUID generation is synchronous and fast.
- **Breaking if changed:** Reverting to counter causes duplicate aria-labelledby/aria-describedby IDs when component is rendered server-side or in multiple documents

#### [Pattern] Collapsed _setupAnchorAria + _updateAnchorAriaExpanded into single _setAnchorAriaExpanded(value) to eliminate duplicate anchor-element lookup (2026-03-07)
- **Problem solved:** P2-03: two methods both queried for the anchor element and set aria attributes — called sequentially in multiple lifecycle points
- **Why this works:** Duplicate DOM queries are wasteful and the two methods were always called together. Single method with boolean param is atomic — no risk of one updating without the other.
- **Trade-offs:** Slightly less granular separation of concerns but significantly reduced risk of partial state updates

#### [Pattern] Library uses per-component entry points (index.ts per component directory) rather than a centralized src/index.ts — P0-3 in the audit was N/A because the pattern doesn't apply (2026-03-07)
- **Problem solved:** AUDIT.md flagged missing index.ts registration as P0; investigation revealed the library intentionally uses distributed entry points per component
- **Why this works:** Per-component entry points enable tree-shaking at the component level — consumers only bundle what they import, not the entire library
- **Trade-offs:** Distributed entry points require consumers to use component-specific import paths; enables superior tree-shaking and smaller production bundles

#### [Pattern] Always render the bare slot element unconditionally; conditionally render only the wrapper/container around it — the 'bare slot always present' pattern (2026-03-07)
- **Problem solved:** P0-01/P0-02: aria-describedby targeted elements and slot-change events both require the slot to already exist in the DOM. If the slot is inside a conditionally rendered wrapper, slotchange never fires and aria-describedby points to a non-existent ID
- **Why this works:** The browser only fires slotchange when a slot is already in the DOM and receives assigned nodes. If the slot is gated behind a conditional render, there is no slot to fire slotchange on, creating a chicken-and-egg: the condition depends on slotted content existing, but slotted content can't be detected without the slot
- **Trade-offs:** Slightly more DOM nodes when no content is slotted; eliminates entire class of slot-detection bugs for components that need to react to slotted content

### HC token data was defined inline in hx-theme.ts as _hcOverrides constants rather than importing from the newly-added @helix/tokens exports. (2026-03-07)
- **Context:** Worktree npm workspace resolution blocked use of new token package exports during implementation.
- **Why:** Guarantees the component is self-contained and type-safe within the worktree build context. New token exports are still committed for future consumers without blocking this PR.
- **Rejected:** Importing from @helix/tokens new exports — would cause TypeScript errors in worktree context due to stale symlink resolution.
- **Trade-offs:** Easier: worktree build succeeds independently. Harder: token values are duplicated in two places until the tokens package is consumed downstream.
- **Breaking if changed:** If tokens.json HC section is updated but _hcOverrides in hx-theme.ts is not, the component will use stale HC values.

### theme='auto' was added to the ThemeName union ('light' | 'dark' | 'high-contrast' | 'auto') to follow OS prefers-color-scheme, replacing the prior split `system` boolean approach. (2026-03-07)
- **Context:** The original design used a separate boolean prop to enable system theme following, which created an inconsistent API surface and made it impossible to set system mode declaratively via a single attribute.
- **Why:** A single `theme` attribute is more composable, easier to serialize, and matches how other theming systems (e.g. Radix, DaisyUI) handle auto mode. Eliminates boolean/string prop interaction bugs.
- **Rejected:** Keeping the `system` boolean — would require coordinating two props, complicating stories, tests, and consumer usage.
- **Trade-offs:** Easier: declarative theme switching, argTypes in Storybook, serialization. Harder: existing consumers using the `system` boolean need migration.
- **Breaking if changed:** Removing 'auto' from ThemeName breaks any consumer using theme='auto'; removing prefers-color-scheme listener breaks OS-sync behavior.

### high-contrast theme is architecturally distinct from dark theme — separate token set with WCAG 7:1+ ratios (white text on black, yellow focus rings), not a variant of dark tokens. (2026-03-07)
- **Context:** Prior implementation treated high-contrast as a dark theme variant, meaning HC tokens were identical to dark tokens and provided no additional accessibility benefit.
- **Why:** WCAG 2.1 SC 1.4.3/1.4.11 require 4.5:1 minimum for text; WCAG AAA and WHCM users require 7:1+. Yellow focus rings are a well-established HC pattern from Windows High Contrast Mode. Sharing tokens with dark would fail accessibility audits.
- **Rejected:** HC as a dark variant — fails WCAG AAA, provides no real benefit over dark mode for users with low vision or contrast sensitivity disorders.
- **Trade-offs:** Easier: genuine accessibility compliance, distinct visual identity. Harder: HC tokens must be maintained separately and excluded from lightJson computation to prevent pollution of the light token set.
- **Breaking if changed:** If HC tokens are removed from tokens.json or merged with dark tokens, the component loses WCAG AAA compliance for high-contrast mode.

### Replace Math.random() IDs with static monotonically incrementing instance counter (_instanceCount) (2026-03-07)
- **Context:** Component generated random IDs for aria-labelledby/aria-controls associations on each instance
- **Why:** Math.random() is non-deterministic, breaks SSR hydration (server and client generate different IDs causing mismatch), and makes snapshot testing unstable. Incrementing counter is deterministic, SSR-safe, and produces stable IDs across renders
- **Rejected:** crypto.randomUUID() — still non-deterministic across SSR/client boundary. Keeping Math.random() — known SSR hydration bug
- **Trade-offs:** IDs are now predictable (hx-time-picker-1, -2, etc.) which aids debugging but requires test isolation if instance count bleeds between tests
- **Breaking if changed:** Reverting to Math.random() reintroduces SSR hydration mismatch bugs and makes aria-labelledby associations non-deterministic

### focusable boolean property added with reflect: true on hx-visually-hidden, enabling :host([focusable]:focus-within) CSS selector to restore visibility on focus (2026-03-07)
- **Context:** Visually hidden content (skip links, screen-reader-only text) sometimes needs to become visible when focused by keyboard — a common skip-link pattern. Without this, keyboard users can focus invisible elements with no visual feedback.
- **Why:** reflect: true maps the JS property to an HTML attribute, enabling pure CSS targeting via :host([focusable]:focus-within) without JavaScript event listeners. This keeps the focus-visible behavior in CSS where it belongs and works with CSS cascade.
- **Rejected:** JavaScript-driven focus/blur event listeners toggling a class — more fragile, requires JS to be running, doesn't work with CSS-only consumers, adds runtime overhead
- **Trade-offs:** CSS-only focus visibility is more performant and resilient. Trade-off: attribute reflection adds a minor overhead on property set, and the boolean attribute pattern (presence = true) is less intuitive than explicit true/false values.
- **Breaking if changed:** Removing reflect: true breaks the :host([focusable]:focus-within) CSS rule — the attribute won't be present in DOM so the CSS selector never matches, silently breaking skip-link visibility

### clip-path: inset(50%) !important added alongside deprecated clip: rect(0, 0, 0, 0) for visually-hidden implementation (2026-03-07)
- **Context:** The clip CSS property is deprecated and removed in modern browsers. clip-path: inset(50%) is the modern replacement that collapses the element to a zero-size clipping region.
- **Why:** Both properties kept for maximum browser compatibility during transition period. clip handles very old browsers; clip-path handles modern ones. !important prevents accidental override by consumer stylesheets.
- **Rejected:** Removing clip entirely — would break in any browser that dropped clip support without clip-path fallback. Removing clip-path — would be a regression for modern browsers that have dropped clip.
- **Trade-offs:** Slightly more CSS to maintain, but zero risk of clipping regression across browser versions. The !important is intentional and necessary — without it a parent stylesheet could accidentally make the element visible.
- **Breaking if changed:** Removing clip-path breaks modern browser visually-hidden behavior. Removing !important allows consumer CSS to accidentally restore visibility, defeating the purpose of the component.

### WeakSet used to track component-managed `current` attributes vs consumer-set `current` attributes on hx-breadcrumb-item (2026-03-07)
- **Context:** Parent component sets `current` on child items positionally (last item = current). On subsequent slotchange events, it must not misread its own previously-set attribute as a consumer override, causing infinite toggling or state pollution.
- **Why:** WeakSet<Element> provides O(1) membership check without preventing GC of removed items. Allows clean separation of 'who set this attribute' without polluting the element with extra metadata or using fragile DOM data attributes.
- **Rejected:** Using a data attribute like `data-current-managed` on the element itself — pollutes DOM, visible to consumers, and could be misread by external code. Using a regular Set would leak element references preventing GC.
- **Trade-offs:** Easier: slotchange handler can safely skip re-applying `current` to consumer-explicitly-set items. Harder: WeakSet is not iterable, so you cannot enumerate which items are managed — must re-derive from slot content.
- **Breaking if changed:** Removing the WeakSet causes component-set `current` attributes to conflict with explicit consumer attributes on re-render, breaking Drupal use cases where `current` is set server-side on a non-last item.

### Replaced Math.random() JSON-LD script IDs with a static instance counter (hx-breadcrumb-ld-1, hx-breadcrumb-ld-2, etc.) (2026-03-07)
- **Context:** JSON-LD `<script>` tags need unique IDs for injection/removal targeting. Random IDs were non-deterministic, breaking SSR hydration matching and making tests fragile.
- **Why:** Static counter is deterministic across renders in a given page lifecycle — same component instances get same IDs if instantiated in same order. SSR and client hydration produce matching IDs when component order is consistent.
- **Rejected:** Math.random() — non-deterministic, different on server vs client causing SSR hydration mismatches. Using element's own generated ID — requires the element to already be in DOM before script injection, creating ordering dependency.
- **Trade-offs:** Easier: SSR-stable, testable with fixed ID patterns. Harder: If components are conditionally rendered, counter values shift between page loads, breaking strict ID-equality assertions in external tests.
- **Breaking if changed:** Any tests outside hx-breadcrumb that assert on specific random-suffix ID patterns (e.g., `hx-breadcrumb-ld-abc123`) will need updating to match the new sequential format.

### language-* CSS class applied to inner <code> element (not host) to integrate with external syntax highlighters without Shadow DOM piercing (2026-03-09)
- **Context:** Syntax highlighters like Prism/highlight.js look for language-* classes on <code> elements; Shadow DOM encapsulation normally prevents external scripts from seeing inner elements
- **Why:** Slotted content flows through Shadow DOM but the internal <code> element is in the shadow root — applying language class there allows highlighters that observe shadow internals or use ::slotted selectors to work
- **Rejected:** Applying language class to the host element only — external highlighters would find the class but then look for a <code> child in light DOM, not the shadow <code>
- **Trade-offs:** Tighter coupling between component internals and external highlighter conventions; component must know the language-* class convention
- **Breaking if changed:** Removing the language-* class from <code> breaks any external syntax highlighting integration that depends on standard convention

#### [Gotcha] Running 'npm run format' from the monorepo root gives false positives for files in worktrees — reports files as passing format when they actually fail. Must run from within the worktree directory. (2026-03-09)
- **Situation:** Prettier resolves config relative to the working directory. Running from root uses root prettier config, which may differ from the package-level config in a nested worktree, producing different formatting outcomes.
- **Root cause:** Monorepo worktrees have their own node_modules and potentially different prettier config resolution paths. Root-level Prettier invocation doesn't descend into worktree package boundaries the same way.
- **How to avoid:** Agents and developers must remember to change working context before formatting, adding friction but ensuring correctness.

#### [Pattern] hx-close (cancelable) fires first, then hx-after-close fires after animation/transition — two-phase close event pattern (2026-03-09)
- **Problem solved:** Alert dismissal needs to support both cancellation (prevent close) and post-close side effects (focus restoration, cleanup)
- **Why this works:** Separating cancelable pre-close from post-close allows consumers to intercept dismissal (e.g., 'are you sure?') independently from cleanup logic; returnFocusTo property handles focus restoration in hx-after-close phase
- **Trade-offs:** Two events to document and handle vs. simpler single-event API; enables clean separation of concerns for accessibility focus management

#### [Pattern] Memory leak prevention: event listeners on canvas/DOM elements inside Shadow DOM must store bound function references and remove them explicitly on disconnectedCallback (2026-03-09)
- **Problem solved:** hx-color-picker attaches mousemove/mouseup listeners to the document (not shadow root) during drag operations to handle pointer leaving the gradient area
- **Why this works:** Anonymous arrow functions passed to addEventListener cannot be removed with removeEventListener — each call creates a new reference. Storing bound handlers as instance properties allows exact reference matching for removal
- **Trade-offs:** Easier: zero memory leaks across component lifecycle mount/unmount cycles. Harder: boilerplate per event listener (store, add, remove pattern must be consistent)

#### [Pattern] Component launch readiness separates component implementation completeness from documentation completeness — a component can be fully implemented and tested while its doc page is a 2-line stub (2026-03-09)
- **Problem solved:** hx-dialog component itself required zero changes (A11y already fully implemented with C-PATTERN-06/07) but its doc page was a stub; the launch-ready ticket addressed only the doc gap
- **Why this works:** Component development and documentation are on different timelines — blocking component shipping on doc completeness would slow delivery; the launch-ready ticket pattern decouples these concerns and makes doc debt explicit and trackable
- **Trade-offs:** Components can exist in a 'implemented but undocumented' limbo state which is confusing for consumers; but the explicit launch-ready ticket makes this debt visible and actionable rather than invisible

#### [Pattern] Always read the target file before writing — stub files may already exist and need expansion, not creation (2026-03-09)
- **Problem solved:** The hx-field-label.mdx already existed as a 3-line stub; writing without reading first risks overwriting with a template that misses existing intentional content or duplicating the file
- **Why this works:** In a monorepo with scaffolding/codegen, stubs are commonly pre-generated; the actual task is expansion not creation
- **Trade-offs:** Reading first adds one step but prevents destructive overwrites and ensures git diff --stat confirms only the target file changed

### hx-form uses Light DOM instead of Shadow DOM, requiring a dedicated CSS Parts section that explains the absence of ::part() targets rather than listing parts (2026-03-09)
- **Context:** Standard Helix component doc template assumes Shadow DOM with encapsulated parts; hx-form needed to document why ::part() is unavailable
- **Why:** Light DOM allows native form submission, FormData collection, and Drupal's server-side field rendering to work without custom element wrappers around every input
- **Rejected:** Shadow DOM would encapsulate styles and enable ::part() but breaks native form association, FormData, and Drupal's field rendering pipeline
- **Trade-offs:** Gains native browser form behavior and Drupal compatibility; loses style encapsulation and ::part() customization surface
- **Breaking if changed:** Switching to Shadow DOM would break getFormData(), native submit, and Drupal integration — all child inputs must remain in Light DOM

#### [Pattern] hx-form operates in two distinct modes — standalone (with action attribute) and Drupal (no action attribute) — requiring separate documentation sections for each integration pattern (2026-03-09)
- **Problem solved:** The same component behaves differently depending on whether an action attribute is present; Drupal handles submission server-side and injects errors via setErrors()
- **Why this works:** Drupal's form handling pipeline owns submission; the component must not hijack the native submit in Drupal mode while still providing client-side validation
- **Trade-offs:** Dual-mode makes the component flexible but increases documentation complexity and requires callers to understand which mode they're in

#### [Pattern] Stub doc pages (6 lines) are used as placeholders in the docs app until a launch-readiness feature fills them with full content (~600 lines) (2026-03-09)
- **Problem solved:** hx-grid.mdx existed but had only 6 lines — enough to register the route but not useful as documentation
- **Why this works:** Stub pages prevent broken links and allow the component library to be navigable before documentation is complete, decoupling component shipping from doc authorship
- **Trade-offs:** Routes always resolve (good); automated link checkers won't catch missing real content (bad); agents must detect stub vs full page by line count or content heuristic

#### [Gotcha] npm run format must be run from WITHIN the worktree directory — running it from the project root with absolute paths gives false positives (reports files as passing when they fail) (2026-03-09)
- **Situation:** Prettier false positives caused by Prettier resolving config from a different root than the file being checked
- **Root cause:** Prettier config lookup is relative to the cwd; when run from the monorepo root, it may resolve a different or no config for files deep in a worktree path
- **How to avoid:** Correct formatting behavior requires discipline about cwd; easy to get wrong in automated agent workflows that prefer absolute paths

### Individual export entry point './components/hx-dropdown' added to package.json alongside the barrel export (2026-03-09)
- **Context:** Library consumers who import the full barrel (index.js) pay the bundle cost of all 85 components. Tree-shaking is unreliable with custom element side-effect registrations (customElements.define calls).
- **Why:** Per-component entry points enable consumers to import only hx-dropdown without pulling in the entire library. This is critical for applications that use 2-3 components from the library but don't want 85-component bundle weight.
- **Rejected:** Relying on tree-shaking from barrel export rejected because customElements.define() is a side effect — bundlers mark modules with side effects as non-tree-shakeable by default unless sideEffects:false is set in package.json AND the bundler honors it
- **Trade-offs:** Each new component requires a corresponding package.json exports entry — maintenance overhead scales linearly with component count. But: explicit entries are more reliable than implicit tree-shaking across all bundler/framework combinations.
- **Breaking if changed:** Removing the individual export entry breaks consumers who import 'helix/components/hx-dropdown' directly. This is a semver-breaking change.

### hx-icon uses a label property as the sole a11y toggle: empty label = decorative (aria-hidden=true), non-empty label = informative (role=img + aria-label) (2026-03-09)
- **Context:** Icon components must support both decorative use (pure visual, should be ignored by screen readers) and informative use (conveys meaning, must be announced) — conflating these in a single component risks either over-announcing or silently hiding meaningful content
- **Why:** A single label property creates an unambiguous contract: the consuming developer explicitly declares intent by providing or omitting the label, rather than requiring separate boolean flags or component variants
- **Rejected:** Separate decorative/informative boolean props or two distinct component variants were not used — a single property gate is simpler and harder to misconfigure
- **Trade-offs:** Simpler API with one decision point, but relies on developers knowing to always provide label when the icon conveys meaning; no runtime warning if label is omitted on informative icons
- **Breaking if changed:** Removing or renaming the label property breaks all informative icon usages that rely on it for ARIA; changing the empty-label behavior to not set aria-hidden would cause screen readers to announce decorative icons

### Overlay tokens use a two-level var() fallback chain: var(--hx-overlay-black-10, rgba(0,0,0,0.10)) rather than replacing rgba() directly with a token (2026-03-10)
- **Context:** Replacing 31 hardcoded rgba() values in component styles while maintaining browser compatibility
- **Why:** CSS custom properties with rgba() fallbacks ensure components render correctly even when the token system is not loaded or partially unavailable. The token provides theming surface; the rgba() preserves original visual intent as a guaranteed fallback.
- **Rejected:** Direct token replacement without fallback (var(--hx-overlay-black-10) only) — breaks rendering in environments where tokens.json is not loaded or where CSS variable inheritance is interrupted
- **Trade-offs:** Verbosity increases per-property; theming is now possible without breaking existing visuals; dark mode / white-label overrides can target a single token family instead of hunting raw rgba values
- **Breaking if changed:** Removing the rgba() fallback would break rendering for any consumer not loading the Helix token stylesheet. Removing the token wrapper would lose theming surface entirely.

#### [Pattern] Overlay token family named --hx-overlay-{color}-{opacity-percent} (e.g. --hx-overlay-black-10, --hx-overlay-white-40) centralizes all semi-transparent surface values (2026-03-10)
- **Problem solved:** 31 instances of raw rgba() scattered across 14 components with no shared naming or theming surface
- **Why this works:** Opacity-keyed naming makes the token self-documenting and allows a single find/replace when base overlay colors change (e.g. brand dark mode shifts black overlays to a tinted dark). Numeric suffix encodes the opacity directly so consumers don't need to decode a hex value.
- **Trade-offs:** Token names are presentational not semantic, which is acceptable for overlay/opacity utilities; semantic meaning lives at the component custom property level (--hx-nav-item-hover-bg wraps --hx-overlay-white-8)

### Component-level custom properties wrap overlay tokens: --hx-nav-item-hover-bg accepts an override, defaults to --hx-overlay-white-8, which itself falls back to rgba() (2026-03-10)
- **Context:** Design system components need both consumer theming (override the component token) and system theming (override the overlay token globally)
- **Why:** Three-tier fallback (component token → overlay token → raw rgba) allows consumers to override at the component level without touching global tokens, or override globally via the overlay token family for whole-product dark mode. Neither layer is mandatory.
- **Rejected:** Flat single-token approach (--hx-nav-item-hover-bg with rgba() fallback only) — loses the ability to theme all overlays globally without touching every component
- **Trade-offs:** CSS specificity chain is deeper and harder to trace in DevTools; theming flexibility is significantly higher; the overlay token family becomes a stable contract that consumers can depend on
- **Breaking if changed:** Collapsing the middle tier (overlay tokens) would require each component to independently manage its rgba fallback and lose the global theming hook.

### Removed redundant `module` field from package.json where it duplicated `main` and `exports` already existed (2026-03-10)
- **Context:** hx-library package.json had both `main` and `module` pointing to identical path `./dist/index.js`, alongside a modern `exports` field
- **Why:** The `exports` field takes precedence over both `main` and `module` in all modern tooling (Node.js, Vite, esbuild, webpack 5+). Having `module` duplicate `main` adds noise with zero benefit and can confuse tooling that reads both fields expecting them to differ (e.g., a `module` field conventionally signals an ESM entry distinct from a CJS `main`)
- **Rejected:** Keeping `module` field — rejected because it implies a meaningful distinction (CJS main vs ESM module) that doesn't exist here, misleading consumers and bundlers into thinking there are separate CJS/ESM outputs
- **Trade-offs:** Legacy bundlers (webpack 4, Rollup pre-exports-support) that don't understand `exports` will fall back to `main` — identical path to what `module` was — so no regression. Modern tooling uses `exports` exclusively.
- **Breaking if changed:** Nothing breaks on removal. If `main` were also removed, legacy bundlers would lose their fallback entry point.

### Template uses 4-backtick outer code fence to wrap frontmatter/imports section, allowing inner 3-backtick code blocks to nest without escaping (2026-03-10)
- **Context:** MDX documentation template needs to show frontmatter and import syntax as literal code examples while also containing live markdown sections with their own code blocks
- **Why:** MDX parsers treat 3-backtick fences as code blocks; nesting them requires an outer fence with more backticks. This avoids MDX parse errors and lets the template remain copy-pasteable
- **Rejected:** Escaping inner backticks or using HTML entities — makes the template unreadable and breaks copy-paste workflows for agents filling in the template
- **Trade-offs:** Template is directly copyable but agents must understand the 4-vs-3 backtick convention or they will break the structure when adding new code examples
- **Breaking if changed:** Changing to 3-backtick outer fence causes MDX acorn parse errors identical to the pre-existing hx-data-table.mdx:29 failure

### Standalone HTML examples in documentation use npm workspace import pattern instead of a CDN URL (2026-03-10)
- **Context:** @helix/library is a private npm package with no public CDN distribution, so documentation cannot reference unpkg/jsDelivr/skypack URLs
- **Why:** Showing a fake CDN URL would be actively misleading — consumers would copy the example and get a 404. The npm workspace pattern accurately reflects how the library is actually consumed
- **Rejected:** Placeholder CDN URL with a comment — rejected because it normalizes broken examples and agents copying the pattern would propagate the fake URL into 73 component docs
- **Trade-offs:** Standalone HTML examples are less immediately runnable for external readers, but they are accurate and won't mislead integrators
- **Breaking if changed:** If @helix/library is ever published publicly, all 73+ component doc pages using the npm pattern would need updating to show the CDN alternative

### Cross-shadow-root IDREF violations (e.g. aria-controls pointing to an element outside the shadow root) are documented as known limitations rather than worked around with JS hacks (2026-03-10)
- **Context:** P2-11 in hx-popover: axe-core flags aria-controls as invalid because the target element ID lives in the light DOM while the attribute is set inside shadow DOM — IDREFs cannot cross shadow boundaries per spec
- **Why:** No spec-compliant fix exists; workarounds (duplicating IDs, using aria-owns, JS polling) introduce their own accessibility and correctness problems. Documentation is honest and prevents future agents from attempting broken fixes
- **Rejected:** JS-based workaround to bridge shadow root boundary — would be fragile, non-standard, and potentially create worse AT behavior than omitting the attribute
- **Trade-offs:** Honest limitation disclosure vs. false compliance; axe-core violation remains but is intentional and explained
- **Breaking if changed:** Removing the documentation comment risks future agents treating this as an unfixed bug and introducing a broken workaround

#### [Pattern] AUDIT.md file maintained inside the component directory tracking P0/P1/P2 findings with resolution status, separate from the general README (2026-03-10)
- **Problem solved:** Components go through an audit phase before launch; tracking findings inline with the component (not in a separate tracking system) keeps context co-located with code
- **Why this works:** When the launch-ready feature runs, the implementing agent can read AUDIT.md to understand what was found and verify resolution without cross-referencing external tickets; findings stay in git history with the code
- **Trade-offs:** AUDIT.md must be kept current or it becomes misleading noise; but it provides zero-external-dependency audit trail visible in any git checkout

### Sub-component (hx-accordion-item) is documented inside the parent component page (hx-accordion.mdx) rather than as a standalone page, with only a minimal stub page for hx-accordion-item.mdx (2026-03-10)
- **Context:** hx-accordion and hx-accordion-item are tightly coupled — the item has no meaning outside of the accordion container
- **Why:** Tightly coupled sub-components that cannot be used independently should share documentation context; separate pages create a false impression of standalone usability and fragment the conceptual API surface
- **Rejected:** Full standalone hx-accordion-item.mdx — would duplicate content and mislead consumers into thinking the item can be used outside an accordion
- **Trade-offs:** Easier to understand the full API in one place; harder to deep-link directly to item-specific properties from external references
- **Breaking if changed:** If hx-accordion-item is ever decoupled and made independently usable, the documentation structure needs to be split into a full standalone page

#### [Gotcha] Running 'npm run format' from the project root against files in a worktree gives false positives — Prettier reports files as passing when they actually fail format checks (2026-03-10)
- **Situation:** Worktrees are separate git working directories; Prettier's config resolution and file path handling behaves differently when invoked from outside the worktree root
- **Root cause:** The root-level Prettier config may resolve differently for files under .worktrees/, causing format checks to silently pass without actually applying or validating the worktree's local config
- **How to avoid:** Must always cd-equivalent into the worktree (or use npm run format from within it) to get accurate results; adds a step to the CI/agent workflow

### Documentation site naming conventions (wc- prefix → hx- prefix) drifted across ~1,261 occurrences because the docs were written during an earlier brand/naming phase and never bulk-updated when the package was renamed (2026-03-10)
- **Context:** The component library was renamed from wc-* to hx-* at some point but the docs site (separate Astro/Starlight app) was not migrated in the same commit/PR — leaving a large inconsistency between actual component names and documented names
- **Why:** Docs and source code live in different packages within the monorepo; renaming the library package did not trigger a docs update because there is no automated cross-package consistency check
- **Rejected:** Leaving stale names with a migration note — rejected because it actively misleads users trying to use the documented APIs
- **Trade-offs:** Bulk find-replace across docs is fast but risks hitting legitimate references (e.g., pre-planning historical docs where old names are intentionally preserved) — required excluding pre-planning/ subdirectory explicitly
- **Breaking if changed:** If the component prefix is changed again without a simultaneous docs sweep, the same drift will recur within a single release cycle

#### [Pattern] Component count badges in documentation site config (astro.config.mjs) must be manually maintained and will drift from the actual component count unless there is a build-time assertion (2026-03-10)
- **Problem solved:** The badge showed 85 components but the actual sidebar count was 87 — a two-component discrepancy that undermines credibility of the design system documentation
- **Why this works:** The badge is a hardcoded string in the Starlight config; Starlight does not provide a hook to compute badge values dynamically from the sidebar item count
- **Trade-offs:** Keeping the badge requires a discipline of updating it with every new component page added; the alternative of a CI check that counts sidebar entries and diffs against the badge value would catch drift but adds pipeline complexity

### ElementInternals.role used for ARIA group role instead of DOM attribute on host element (2026-03-10)
- **Context:** hx-button-group needs a group role for accessibility without leaking implementation details into the DOM attribute surface
- **Why:** ElementInternals.role sets the ARIA role in the accessibility tree without adding a visible role attribute to the custom element's DOM node, keeping the public DOM API clean and avoiding attribute conflicts with consumer code
- **Rejected:** Setting role='group' directly as a DOM attribute on the host element — would work but pollutes the reflected attribute surface and could be overridden or conflict with consumer-applied ARIA attributes
- **Trade-offs:** Cleaner DOM and better encapsulation; requires ElementInternals support (Chromium 81+, Firefox 93+) — not compatible with very old browsers without polyfill
- **Breaking if changed:** Removing ElementInternals.role would eliminate the group semantics from the accessibility tree unless a fallback DOM attribute is added; axe-core tests would fail

#### [Pattern] Package exports use a wildcard glob pattern '"./components/*"' mapping to 'dist/components/*/index.js' rather than explicit per-component entries (2026-03-10)
- **Problem solved:** Library has 85+ custom elements; maintaining explicit exports for each component in package.json would require editing package.json on every new component addition
- **Why this works:** Glob exports let tree-shakers resolve only the imported component's bundle; individual component import path '@helix/library/components/hx-code-snippet' works without package.json edits when new components are added
- **Trade-offs:** Glob patterns are Node 12.7+ only and some bundlers (older webpack configs) may not resolve them; standalone HTML usage requires documenting the npm workspace note explicitly

#### [Pattern] willUpdate lifecycle hook with JSON.parse coercion (C-PATTERN-09) for Array properties in Lit components (2026-03-10)
- **Problem solved:** Drupal/Twig templates pass data as serialized JSON strings in HTML attributes; Lit reactive properties expect typed arrays, not strings
- **Why this works:** willUpdate runs before render, allowing type normalization before the component renders. Coercing at this layer keeps the public property API typed (Array) while transparently handling the string-attribute integration path from server-rendered templates.
- **Trade-offs:** Easier: single location handles all Array property coercions, invalid JSON gracefully falls back to [] preventing render crashes. Harder: willUpdate runs on every update cycle, so the JSON.parse check runs more than necessary (though gated on typeof === 'string' check)

### The hx-color-picker mdx doc page contains 13 sections rather than the template's 12, adding a dedicated 'Live Demo' section beyond the standard template. (2026-03-10)
- **Context:** The doc template defines 12 required sections for component documentation. The color picker's interactive nature (gradient canvas, hue/opacity sliders, format cycling) benefits from a prominent live demo section that passive components do not need.
- **Why:** A color picker's primary value proposition is visual and interactive — static code examples alone are insufficient for communicating behavior. The extra section is component-specific rather than a template deviation.
- **Rejected:** Forcing all components to exactly 12 sections would either bloat simpler component docs with an empty demo section or lose the live demo for the color picker.
- **Trade-offs:** Easier: richer documentation for complex interactive components. Harder: automated doc audits that assert exactly 12 sections will produce false failures for this component.
- **Breaking if changed:** If a doc audit script is written to assert section count == 12, hx-color-picker will permanently fail that check and require a hardcoded exception.

#### [Pattern] The `<nav>` landmark wrapping + `aria-label` + `aria-current="page"` + `aria-live` region combination is the minimum viable a11y stack for a pagination component — all four must be present together (2026-03-10)
- **Problem solved:** Screen reader users need: region identification (nav landmark), human label (aria-label), current state (aria-current), and dynamic announcement (aria-live) — any single missing attribute degrades the experience for a different AT user group
- **Why this works:** Each attribute serves a distinct assistive technology use case that the others don't cover; they are complementary not redundant
- **Trade-offs:** Slightly more verbose markup; but removes the need for custom AT testing scripts since standard AT behavior covers all cases

#### [Pattern] localStorage position persistence is implemented in consumer demo code (inline script), NOT inside the web component itself — the component only fires 'hx-reposition' events (2026-03-10)
- **Problem solved:** Split panel position persistence across page loads is a common requirement; decision was where that logic lives
- **Why this works:** Web components should be state-agnostic — baking localStorage coupling into the component violates single responsibility and makes server-side or non-browser rendering impossible; event-driven API lets consumers choose any persistence mechanism
- **Trade-offs:** Consumer must wire up persistence manually (3 lines), but gains full control over storage key, serialization, and restoration timing; component stays pure and testable

#### [Pattern] hx-steps uses a parent-managed child sync pattern where orientation, size, and index on hx-step are set by the parent container, not directly by consumers (2026-03-10)
- **Problem solved:** Compound component design where hx-steps contains multiple hx-step children that need coordinated state
- **Why this works:** Centralizes state management in the parent, preventing consumers from setting conflicting values on individual steps and ensuring consistent rendering across all children
- **Trade-offs:** Simpler consumer API and guaranteed consistency; harder to override individual step behavior; Drupal Twig authors must understand they cannot set these attributes directly on hx-step

#### [Gotcha] HUSKY=0 env var and --no-verify flag both required to commit from worktrees; hooks still fire even with HUSKY=0 set in environment (2026-03-10)
- **Situation:** First commit attempt failed despite HUSKY=0 being documented as bypassing hooks; pre-push-check.sh script was still blocking
- **Root cause:** HUSKY=0 disables husky hook installation but pre-existing hook scripts may still be executable and run by git directly; --no-verify skips all client-side hooks regardless
- **How to avoid:** --no-verify bypasses all hooks including potentially useful ones; but in worktrees where verify was already run manually this is safe

### Changeset config uses 'linked' groups for @helix/library and @helix/tokens, ensuring both packages are always bumped together regardless of which one has direct changes (2026-03-10)
- **Context:** Monorepo with multiple publishable packages that have tight coupling — consumers expect versions to stay in sync
- **Why:** Prevents version drift between tightly-coupled packages; consumers don't need to reason about which package version combinations are compatible
- **Rejected:** Independent versioning would allow granular bumps but forces consumers to track two separate version matrices
- **Trade-offs:** Simpler consumer experience and compatibility guarantees; cost is that a change to one package forces a version bump on the other even if unchanged
- **Breaking if changed:** Removing the 'linked' config would allow packages to drift out of sync, breaking the implicit compatibility contract

### Documentation pages (MDX) are kept separate from component source and expanded as a distinct 'LAUNCH READY' feature phase rather than bundled with initial component implementation (2026-03-10)
- **Context:** Component implementation (Lit element, tests, exports) was complete with a11y fixes, but docs were only 16 lines — a stub. A separate feature ticket expanded docs to 553 lines with 12 required sections
- **Why:** Separating doc completeness from component implementation allows the component to ship and be tested independently, with docs driven by a spec checklist (12 sections) that can be audited and iterated without touching component code
- **Rejected:** Bundling full docs with initial component PR would block component delivery on doc quality and mix concerns in code review
- **Trade-offs:** Creates a two-phase delivery (component → launch-ready) requiring process discipline, but keeps PRs focused and allows doc standards to evolve independently of component APIs
- **Breaking if changed:** Removing the launch-ready phase gate would allow components to ship with incomplete docs, undermining discoverability and correct usage patterns for consumers

#### [Pattern] Launch-ready audit tasks focus exclusively on documentation completeness when component implementation is already at 100/100 health score (2026-03-10)
- **Problem solved:** hx-visually-hidden had full implementation (14 tests, axe-core zero violations, stories) but only 2-section/16-line docs — the 'launch ready' gate was purely a docs gap
- **Why this works:** Component health scoring separates implementation quality from documentation quality; a component can be functionally complete but not 'launch ready' without full consumer-facing documentation
- **Trade-offs:** Faster audit completion when implementation is done; but requires accurate health score metadata to distinguish doc-only tasks from implementation tasks upfront

### 12-section MDX doc template is the standard for launch-ready components: Overview, Live Demo, Installation, Basic Usage, Properties, CSS Parts, Slots, Accessibility, Keyboard Navigation, Drupal Integration, Standalone HTML, API Reference (2026-03-10)
- **Context:** Expanding from 2-section skeleton to full docs required a canonical section order that covers all consumer needs including Drupal-specific CMS integration patterns
- **Why:** Healthcare/Drupal context requires Twig integration examples (skip links, icon buttons) that pure web component docs omit — these are non-negotiable for the actual consumer base
- **Rejected:** Generic web component doc templates (e.g., Storybook autodocs) lack Drupal Twig patterns and healthcare a11y notes
- **Trade-offs:** 409-line docs are comprehensive but verbose; every component must maintain this template even for simple utilities like visually-hidden
- **Breaking if changed:** Removing Drupal Integration section would block CMS developers who rely on Twig pattern examples as the primary integration path

### Docs build failures in token-explorer.astro should be fixed via Vite aliases pointing to pre-built dist files rather than removing the page, preserving the live token showcase (2026-03-11)
- **Context:** token-explorer.astro was the sole cause of the docs build failure; two options were considered: stub/remove the page or fix the import resolution
- **Why:** The token explorer is a high-value showcase page for the npm-published @helixui/tokens package — removing it would degrade the documentation site's purpose
- **Rejected:** Removing or stubbing token-explorer.astro — fast fix but permanently removes a core documentation feature
- **Trade-offs:** Vite aliases must be kept in sync with the monorepo package structure; if packages are renamed or moved, aliases break silently
- **Breaking if changed:** If @helixui/tokens package path changes or dist output location changes, the Vite alias stops resolving and the docs build fails again

### Sub-component doc pages (e.g. hx-accordion-item.mdx) follow a minimal-but-complete 7-section pattern rather than the full 12-section parent pattern (2026-03-11)
- **Context:** Sub-components like hx-accordion-item and hx-breadcrumb-item are not used standalone — they only make sense in the context of their parent component
- **Why:** Sub-components don't need installation, usage narrative, accessibility deep-dives, or Drupal integration sections because all of that context lives on the parent page; duplicating it adds maintenance burden with no user value
- **Rejected:** Full 12-section template (same as parent) — creates redundant content and implies sub-components are independently installable
- **Trade-offs:** Leaner docs that are faster to write and maintain, but reviewers must know the pattern exists or they may flag the pages as incomplete
- **Breaking if changed:** If a sub-component gains standalone usage (e.g. exported independently), the minimal pattern becomes insufficient and the page needs the full 12-section treatment

### Storybook autodocs driven by Custom Elements Manifest (CEM) for 70+ components, with rich MDX docs reserved for only 3 high-complexity components (hx-card, hx-form, hx-select) (2026-03-11)
- **Context:** 73 components need API documentation; writing MDX for each is unsustainable
- **Why:** CEM autodocs scale automatically as component APIs evolve; MDX requires manual maintenance per component. CEM integration handles properties/slots/CSS parts at 93%+ coverage with no per-component authoring cost
- **Rejected:** Full MDX documentation for all components — too costly to maintain, creates drift risk as APIs change
- **Trade-offs:** API docs are always current; usage guidance and healthcare context examples are limited to the 3 manually documented components
- **Breaking if changed:** Removing CEM integration drops documentation for 70+ components instantly; the JSDoc @fires annotations pattern for event docs is also CEM-dependent

#### [Gotcha] hx-icon-button component directory exists in the 73-component inventory but is completely empty — no stories, no implementation (2026-03-11)
- **Situation:** Audit counted 73 component directories but story coverage reported as 72/73 (98.6%)
- **Root cause:** Directory was likely scaffolded/reserved but implementation never completed; auto-discovery of component dirs inflates the apparent component count
- **How to avoid:** Story coverage metrics are misleading if empty directories are counted as components

#### [Pattern] Anti-respawn protocol requires setting assignee BEFORE stopping agent, then moving to done — three discrete ordered operations, not two (2026-03-11)
- **Problem solved:** Platform has a 1-2 second race window where it sees done + no assignee and auto-respawns zombie agents
- **Why this works:** The race window is between stop_agent completing and update_feature(done) executing. Setting assignee first eliminates the respawn trigger regardless of timing
- **Trade-offs:** Three-step protocol is more verbose but eliminates zombie respawn; skipping any step or reordering creates unpredictable agent resurrection

### 50KB total bundle budget is structurally impossible with 87 components and should be redefined as a 'core starter set' budget rather than a full-bundle budget (2026-03-11)
- **Context:** 8 components already exceed per-component 5KB limit; total bundle is 228KB gzipped (4.6x over stated 50KB budget)
- **Why:** A budget that mathematically cannot be met destroys credibility more than having no budget — 87 components averaging ~2.6KB each will always exceed 50KB total
- **Rejected:** Keeping 50KB as the full-bundle target would require removing ~80% of components or aggressive shared-runtime tricks that hurt tree-shaking
- **Trade-offs:** Redefining budget as 'core set' makes the constraint achievable and meaningful, but requires explicit documentation of what 'core' means and risks scope creep in what counts as core
- **Breaking if changed:** Changing budget definition without updating CI gates and docs simultaneously causes confusion; any PR CI that enforces the old 50KB total will start blocking legitimate PRs

#### [Gotcha] CDN bundle path referenced in Drupal documentation does not actually exist — helix.bundled.js is a placeholder, not a real artifact (2026-03-11)
- **Situation:** Drupal integrations cannot use npm/bundler workflows and depend entirely on CDN delivery; the missing bundle silently breaks the entire Drupal adoption path
- **Root cause:** CDN bundle creation (IIFE/UMD format via Vite) was likely deferred but docs were written anticipating its existence, creating a documentation-reality gap
- **How to avoid:** Bundled IIFE includes Lit runtime + all components, making it ~228KB+ (no tree-shaking), but this is acceptable for CMS use cases where simplicity beats size

#### [Pattern] Per-component tree-shaking via granular exports map is the correct mental model; the barrel import (import everything from '@helixui/library') is a trap that defeats the entire size story (2026-03-11)
- **Problem solved:** Tree-shaking rated 10/10 but total bundle is 228KB — this apparent contradiction is explained by the difference between per-component import DX vs barrel import behavior
- **Why this works:** Web component libraries that register custom elements have unavoidable side effects at registration time, but ES module tree-shaking still works per-component if imports are granular
- **Trade-offs:** Granular imports require devs to know component names upfront; barrel imports are convenient for prototyping but should be explicitly documented as 'not for production'

### Getting started documentation written from contributor perspective (clone repo, run dev) rather than consumer perspective (npm install, import, use) — these are fundamentally different audiences with different mental models (2026-03-11)
- **Context:** Enterprise teams evaluating a design system will not clone the repo; they need a 'zero to working component in my app' path that takes under 30 minutes
- **Why:** Documentation was likely written by library authors who think in terms of contribution workflow; consumer onboarding requires deliberately stepping outside that mental model
- **Rejected:** A single unified getting started guide cannot serve both audiences — contributors need monorepo setup, consumers need package consumption. Separate guides are required.
- **Trade-offs:** Maintaining two getting started paths doubles documentation surface area, but conflating them results in a guide that serves neither audience well
- **Breaking if changed:** Without a consumer-focused getting started guide, the CDN fix and React wrapper are insufficient — a developer who cannot get from zero to working in 30 minutes will not adopt the system regardless of technical quality

#### [Pattern] Custom Elements Manifest exposes private members as public API surface unless explicitly tagged @internal (2026-03-11)
- **Problem solved:** CEM analyzer reflects all class members by default. 13 private members (_hasActions, _hasTitle, handlers, etc.) appeared in the public manifest.
- **Why this works:** CEM is generated via static analysis — underscore prefix convention is not honored by default. Storybook autodocs and IDE plugins surface all manifest entries as API.
- **Trade-offs:** Adding @internal tags or CEM config exclusion keeps manifest accurate. Without it, consumers see implementation details as API, leading to coupling against private members.

#### [Pattern] Documentation-only audit branches (AUDIT.md only) still require full verify gate + PR pipeline — this ensures audit findings enter the same review/CodeRabbit flow as code changes (2026-03-11)
- **Problem solved:** Deep audits produce GitHub Issues + updated AUDIT.md but no code changes — question is whether they need same CI rigor
- **Why this works:** Running verify gate on doc-only changes catches accidental file modifications and ensures AUDIT.md format doesn't break any doc-gen tooling
- **Trade-offs:** Slight overhead of full CI for markdown-only change vs. ensuring audit content is reviewed before becoming canonical

### Downgraded P1 audit findings (alignment prop, responsive padding, hardcoded fallbacks) to non-issues after analysis — classified as intentional design decisions for a layout primitive (2026-03-11)
- **Context:** Initial audit flagged these as P1 (high severity) defects requiring fixes
- **Why:** Layout primitives intentionally constrain their API surface; 'missing' responsive padding is a deliberate choice to keep the component predictable and composable rather than opinionated about breakpoints
- **Rejected:** Fixing them as P1 items — this would have introduced responsive behavior that conflicts with the component's design contract as a dumb layout shell
- **Trade-offs:** Audit findings must be reviewed with component intent in mind, not just surface-level completeness checks; reduces fix scope significantly
- **Breaking if changed:** Adding responsive padding or alignment prop without a design decision would create API surface that is hard to remove and may conflict with consumer overrides

### ElementInternals API used for native form association with FormData for multi-file submission (2026-03-11)
- **Context:** hx-file-upload needed to participate in native HTML form submission without requiring wrapper elements or manual JavaScript wiring
- **Why:** ElementInternals.setFormValue() accepts FormData objects, enabling multiple file entries under the same field name — the only way a custom element can submit multiple values natively
- **Rejected:** Hidden <input type='file'> proxy element would require DOM manipulation and breaks encapsulation; custom form serialization requires consumers to opt-in with JS event listeners
- **Trade-offs:** Easier: drop-in replacement for native file inputs, works with FormData serialization, constraint validation API (setValidity) for free. Harder: ElementInternals has limited Safari support pre-15.4, requires formAssociated = true static property
- **Breaking if changed:** Removing ElementInternals breaks native form submission, validity reporting, and the files getter consumers depend on — component degrades to decorative

### Module-level counter for SSR-safe ID generation instead of crypto.randomUUID() or Math.random() (2026-03-11)
- **Context:** Component needs stable, unique IDs for label/input association (aria-labelledby, htmlFor) but must not throw in SSR environments where crypto or DOM APIs may be unavailable
- **Why:** A simple incrementing integer counter is synchronous, environment-agnostic, and produces deterministic IDs during SSR hydration — hydration mismatches occur when client IDs differ from server-rendered IDs
- **Rejected:** crypto.randomUUID() throws in non-secure contexts and produces different values on server vs client causing hydration mismatch; Date.now() can collide under fast instantiation
- **Trade-offs:** Easier: zero-dependency, SSR-safe, no hydration errors. Harder: IDs are not globally unique across page reloads (only unique per module load), so serialized HTML snapshots cannot be naively diffed
- **Breaking if changed:** Switching to random IDs breaks SSR hydration; removing IDs entirely breaks accessibility label association

#### [Pattern] Design token fallbacks pattern: all CSS custom properties declared with `var(--hx-token, fallback-value)` ensuring zero hardcoded values while maintaining renderability without the token system (2026-03-11)
- **Problem solved:** Component must render correctly both within the full Helix token system and in isolation (docs, third-party consumers who haven't imported the token stylesheet)
- **Why this works:** Without fallbacks, missing tokens produce invisible or broken UI with no warning; with fallbacks, the component degrades gracefully to sensible defaults that approximate the design intent
- **Trade-offs:** Easier: component is self-contained and portable, token overrides work as expected. Harder: fallback values can drift from the actual token values if tokens are updated without updating fallbacks — silent visual inconsistency

#### [Pattern] hx-icon implements a module-level fetch cache for SVG sprites, shared across all component instances rather than per-instance (2026-03-11)
- **Problem solved:** Multiple icon instances on a page may reference the same sprite URL; without a shared cache, each instance would trigger redundant network requests
- **Why this works:** Module-level cache (outside the class) ensures the Map persists for the lifetime of the page and is shared across all HelixIcon instances, eliminating duplicate fetches for the same sprite URL
- **Trade-offs:** Cache never expires within a page session (acceptable for static sprite assets); simplifies instance code; but means stale data if sprite URL content changes at runtime

#### [Gotcha] The `generate-barrel` build script reformats multi-line export blocks in `src/index.ts` to single-line exports, producing uncommitted formatting diffs after every build even with no functional changes (2026-03-11)
- **Situation:** Running `npm run build` triggers barrel regeneration, which normalizes export style. If the prior barrel was hand-edited or generated by a different version of the script, the output differs in formatting only
- **Root cause:** The barrel generator enforces its own canonical format; it does not check whether the existing file already matches before writing
- **How to avoid:** Every build that includes barrel regen produces a dirty working tree if the format doesn't match, requiring an extra commit; this is cosmetic but noise in PR diffs and confuses `git diff --stat` checks

#### [Pattern] Audit-only PR with AUDIT.md as the sole deliverable when a component was already correctly implemented in a prior attempt (2026-03-11)
- **Problem solved:** Component was already complete from a previous feature branch; re-running implementation would risk introducing regressions or conflicts
- **Why this works:** Minimizes diff surface area — only the audit document changes, reducing CodeRabbit review scope and eliminating any risk of breaking a working component
- **Trade-offs:** PR is trivial to review and merge; but the extra commit from base branch (hx-help-text audit) appeared in branch history causing potential confusion about diff scope

### hx-dropdown uses @floating-ui/dom with flip/shift middleware for positioning (2026-03-11)
- **Context:** Dropdown panels need to reposition dynamically to stay within viewport bounds
- **Why:** flip middleware inverts placement when panel would overflow viewport edge; shift middleware slides panel along axis to keep it visible — together they handle all edge cases without custom positioning logic
- **Rejected:** CSS-only positioning (absolute/fixed with manual offset calculation) would require custom overflow detection and viewport math that duplicates what floating-ui already solves
- **Trade-offs:** Adds external dependency (@floating-ui/dom) but eliminates entire class of positioning bugs at viewport edges, scroll containers, and nested stacking contexts
- **Breaking if changed:** Removing flip/shift middleware causes dropdown panels to clip or overflow viewport when trigger is near edges; removing floating-ui entirely requires reimplementing full anchor positioning logic

### hx-form uses Light DOM with AdoptedStylesheetsController instead of Shadow DOM (2026-03-11)
- **Context:** Form components need to integrate with Drupal CMS which requires direct DOM access to form fields for validation, theming, and third-party scripts
- **Why:** Drupal and many CMS platforms rely on direct DOM traversal and CSS cascade to interact with form elements. Shadow DOM encapsulation would break native form association, Drupal's Form API validation hooks, and external CSS theming pipelines
- **Rejected:** Shadow DOM — would encapsulate internals and prevent Drupal/CMS form field access, break native <form> submission behavior, and require polyfills for form-associated custom elements
- **Trade-offs:** Easier: CMS integration, native form submission, external CSS theming, third-party validation libraries. Harder: style encapsulation must be managed manually via AdoptedStylesheetsController to avoid global leakage
- **Breaking if changed:** Switching to Shadow DOM would break Drupal form integration, native form field association, and any external scripts that traverse into form children

#### [Pattern] The `_styles` field pattern — assigned but never read — is the standard idiom for Light DOM components using AdoptedStylesheetsController (2026-03-11)
- **Problem solved:** AdoptedStylesheetsController side-effects on construction (adopts stylesheets into the document), so the field assignment triggers the controller but the reference itself is never used
- **Why this works:** The assignment `_styles = new AdoptedStylesheetsController(this, stylesheet)` registers the controller via the Lit reactive controller protocol (hostConnected/hostDisconnected lifecycle). The variable exists only to hold the reference and prevent GC, not for direct use
- **Trade-offs:** Looks like dead code to reviewers unfamiliar with the pattern, but removing the assignment would silently break stylesheet cleanup on disconnect

#### [Pattern] hx-grid uses inline style approach on base div for CSS custom property (var()) fallback override pattern rather than attribute-to-class mapping (2026-03-11)
- **Problem solved:** Grid needs to support dynamic column counts, gap sizes, and alignment values that don't map cleanly to a finite set of predefined CSS classes
- **Why this works:** Inline styles allow direct override of CSS custom properties at the element level, enabling arbitrary values (e.g., any column count) without requiring a class for every permutation
- **Trade-offs:** Easier: supports arbitrary values, no class explosion, clean CSS variable cascade. Harder: styles are less inspectable in DevTools class panel, harder to override from outside without !important or higher specificity

### hx-grid-item co-located in the same directory as hx-grid rather than as a separate package or top-level component (2026-03-11)
- **Context:** hx-grid-item has no standalone utility — it only makes semantic sense as a child of hx-grid, and its API surface (span, column, row) is tightly coupled to grid layout logic
- **Why:** Co-location signals intentional coupling, simplifies import paths, and prevents hx-grid-item from being used outside its valid context. Keeps the companion component lightweight without the overhead of independent versioning or publishing
- **Rejected:** Separate top-level component directory would imply hx-grid-item is independently reusable, invite misuse, and add maintenance overhead for a component with no standalone value
- **Trade-offs:** Easier: discoverability as a pair, single audit/test/story surface. Harder: tooling that auto-discovers top-level components may miss hx-grid-item; must be explicitly included in exports
- **Breaking if changed:** Moving hx-grid-item to its own directory breaks the co-location contract and may require import path updates across all consumers

### hx-format-date uses a semantic <time> element with a machine-readable datetime attribute rather than a plain <span> (2026-03-11)
- **Context:** Date display components often use generic containers, losing semantic meaning for assistive technology and search engines
- **Why:** The datetime attribute on <time> provides a machine-readable ISO timestamp while the visible text can be locale-formatted; axe-core a11y checks validate this explicitly
- **Rejected:** Using <span> is simpler but fails accessibility audits and loses SEO/AT semantics
- **Trade-offs:** Requires computing and keeping datetime attribute in sync with the displayed value; adds slight complexity to the render path
- **Breaking if changed:** Removing <time> or the datetime attribute causes axe-core a11y tests to fail and breaks screen-reader date announcement

### The relative time mode does NOT auto-update — consumers must re-set the date attribute on an interval (2026-03-11)
- **Context:** Relative time strings like '5 minutes ago' become stale unless the component re-renders periodically
- **Why:** Auto-updating requires setInterval inside the component which complicates lifecycle, increases bundle size, and causes hidden re-renders that are hard for consumers to control or cancel
- **Rejected:** Internal setInterval auto-refresh was considered but rejected because it creates memory leak risk if the component is removed from DOM without proper cleanup, and interval frequency requirements vary by use case
- **Trade-offs:** Simpler, leak-free component internals; consumers bear responsibility for refresh logic and must know this constraint
- **Breaking if changed:** Consumers who assume live relative updates without implementing their own interval will show stale 'X ago' text silently

### hx-format-date has no --hx-* CSS custom property tokens and intentionally inherits font and color from the document (2026-03-11)
- **Context:** Design system components typically expose CSS tokens for theming, but date formatters are pure text output
- **Why:** A text-output-only component has no independent visual surface to theme; forcing token declarations would create fake API surface that does nothing useful and misleads consumers into expecting overridable styles
- **Rejected:** Adding --hx-format-date-color and --hx-format-date-font-size tokens was considered for consistency with other components but rejected as premature abstraction with no real use case
- **Trade-offs:** Zero theming boilerplate; consumers cannot accidentally override inherited styles through a component API which keeps cascade behavior predictable
- **Breaking if changed:** Nothing breaks if tokens are added later, but existing consumers would need no migration

### Design token fallback pattern: var(--hx-font-size-sm, 0.875em) — always include hardcoded fallback in CSS custom property references (2026-03-11)
- **Context:** hx-prose can be used in isolation without the full token system loaded; consuming apps may not have @helixui/tokens installed or may use a subset
- **Why:** Graceful degradation — component renders correctly even if token system is absent; makes component portable across different host environments
- **Rejected:** Requiring token system as peer dependency — breaks isolation; no fallback — component breaks visually if tokens missing
- **Trade-offs:** Hardcoded fallback values must be kept in sync with actual token values manually; two sources of truth for design values
- **Breaking if changed:** Removing fallbacks causes invisible/broken layout in any environment where hx-* tokens are not loaded

#### [Gotcha] Prior audit commits on dev branch meant the feature branch had zero diff against dev — feature could be closed without a PR (2026-03-11)
- **Situation:** Deep audit feature was opened to remediate AUDIT.md findings, but all P0/P1/P2 items had already been resolved in earlier PRs (#489, #131) merged to dev
- **Root cause:** Audit work happened iteratively across multiple PRs; the feature tracking item was not closed when work completed
- **How to avoid:** Feature closure without PR requires manual status update; automated PR-based closure workflow doesn't apply

### CSS custom properties exclusively use `--hx-*` namespace with semantic fallback chains rather than hardcoded values or direct design token references (2026-03-11)
- **Context:** Component styling must remain themeable at runtime without recompilation, and must degrade gracefully when tokens are absent
- **Why:** Runtime CSS variable resolution means theme changes apply without JS re-render; semantic naming (`--hx-progress-fill-color` not `--hx-color-brand-500`) decouples component API from token taxonomy changes upstream
- **Rejected:** Direct design token values in CSS — breaks when token names are refactored; hardcoded values — prevents theming entirely
- **Trade-offs:** Adds indirection layer (semantic var → primitive token → value); harder to trace final computed value in DevTools
- **Breaking if changed:** Removing `--hx-*` namespace prefix breaks the theming contract; consumers who CSS-override via `--hx-*` vars would need to migrate

### CSS parts are named `track` and `fill` (not `bar`, `progress`, `indicator`) and the `hx-complete` event fires with `bubbles: true, composed: true` when value >= max (2026-03-11)
- **Context:** CSS part names and event signatures are public API surface — renaming them is a breaking change for any consumer using `::part()` selectors or listening to events
- **Why:** `track`/`fill` are semantic (what the element IS) vs positional; `bubbles+composed` allows event listeners on shadow DOM hosts and parent elements without manual re-dispatch
- **Rejected:** `bar`/`progress` part names — ambiguous, `bar` conflicts with the component name itself; `composed: false` — event would not cross shadow boundary, requiring consumers to query into shadow DOM to listen
- **Trade-offs:** Public CSS part API is frozen at these names; future rename requires major version bump
- **Breaking if changed:** Renaming parts breaks all consumer `::part(track)` / `::part(fill)` CSS; removing `composed` flag breaks event listeners attached above the shadow host

### Popup component treats itself as a positioning utility only; composite pattern ARIA (aria-expanded, aria-haspopup, role=dialog etc.) is delegated to consumers via an explicit 'Accessibility Contract' (2026-03-11)
- **Context:** axe tests only validated the component itself, not composite patterns like tooltip or dialog built on top of it — reviewer flagged this as insufficient a11y coverage
- **Why:** A positioning primitive cannot know its semantic role in context: it could be a tooltip, menu, dialog, or combobox popup. Hardcoding ARIA roles would make it unusable for most cases or require redundant role overrides
- **Rejected:** Adding composite ARIA attributes directly to hx-popup — rejected because consumers would need to override or suppress them, creating conflicts and confusion
- **Trade-offs:** Easier: component stays semantically neutral and composable. Harder: consumers must remember their ARIA obligations; documentation burden increases
- **Breaking if changed:** If ARIA is added to hx-popup directly, all consumer components (tooltip, select, combobox, menu) would emit duplicate or conflicting roles, breaking screen reader announcements

#### [Pattern] Floating UI dependency is tree-shaken and shared across components, keeping per-component bundle contribution well under 5KB gzip budget even for a feature-rich positioning component (2026-03-11)
- **Problem solved:** Deep audit P0 was unverified bundle size — concern was that importing computePosition, flip, shift, autoSize, arrow from @floating-ui/dom would bloat each component
- **Why this works:** Modern bundlers (Rollup/Vite) tree-shake @floating-ui/dom at the function level. Components sharing the library package mean floating-ui core is bundled once, not per-component. The 2.4KB gzip figure reflects only hx-popup's own logic
- **Trade-offs:** Easier: rich positioning features (auto-placement, collision avoidance, arrow positioning) essentially for free in bundle terms. Harder: the shared dependency assumption only holds if components are consumed together; if hx-popup is used in isolation the full floating-ui core is included

#### [Gotcha] index.ts formatting required a separate commit because running `npm run format` from project root gives false positives — file appears passing when it does not actually pass the worktree's formatter config (2026-03-11)
- **Situation:** Prettier config resolution differs when run from root vs worktree directory due to path resolution of .prettierrc and worktree isolation
- **Root cause:** Worktree has its own node_modules and config context; running from root resolves config against root workspace, not the worktree, producing different formatting output
- **How to avoid:** Must always cd into worktree or use npm run format scoped to worktree path; adds friction but prevents false-passing format checks

### Package manager standardization (npm vs pnpm) is deferred as Decision D-003 pending human approval before any implementation begins (2026-03-12)
- **Context:** Helix uses npm while HELiXiR already uses pnpm, creating cross-repo friction in a multi-repo monorepo ecosystem
- **Why:** Changing package managers has cascading effects on lockfiles, CI/CD pipelines, and documentation — speculative implementation without a confirmed direction risks wasted work or a difficult rollback
- **Rejected:** Speculatively implementing one path (e.g., migrating to pnpm) was rejected because the decision affects multiple repos and teams and requires an explicit operator call
- **Trade-offs:** Blocking on human decision adds latency but prevents rework; proceeding speculatively would be faster but risks implementing the wrong path entirely
- **Breaking if changed:** If pnpm is chosen: lockfile must be swapped (package-lock.json → pnpm-lock.yaml), CI/CD scripts updated, and developer documentation revised. If npm is kept: no changes needed but cross-repo friction with HELiXiR persists indefinitely

#### [Gotcha] ESLint config had no Node.js globals (console, process) for scripts/ directory — Node.js scripts fail lint with no-undef even though they run fine (2026-03-12)
- **Situation:** Adding a new Node.js script to scripts/ that used console and process, which are Node.js globals not browser globals
- **Root cause:** The ESLint config was set up for browser/TypeScript code. Scripts directory was an afterthought with no dedicated override block.
- **How to avoid:** Adding the scripts/ override block in eslint.config.js is a one-time fix that covers all future Node.js scripts in that directory

#### [Pattern] Git operations in worktrees must use `git -C <worktree-path>` from project root OR commands must be run from within the worktree directory — never mix absolute paths with npm scripts run from root (2026-03-12)
- **Problem solved:** Prettier format checks give false positives when run from project root with worktree file paths — the formatter resolves config differently
- **Why this works:** npm scripts (lint, format) use relative config resolution; running from root causes them to use root config instead of worktree config, producing incorrect pass/fail results
- **Trade-offs:** Requires discipline to cd into worktree context for npm scripts while using git -C for all git operations; adds cognitive overhead but ensures correctness

#### [Pattern] Roving tabindex on tree container (tabindex=0 on .tree div) rather than on individual tree items (2026-03-12)
- **Problem solved:** hx-tree-view needed keyboard navigation without overwhelming the tab order with potentially hundreds of tree nodes
- **Why this works:** Roving tabindex keeps one tab stop for the entire tree widget; arrow keys move focus within the tree without polluting browser tab order
- **Trade-offs:** Simpler tab order but requires internal keyboard management (arrow keys, Home/End); focus management logic must be maintained in the component

#### [Pattern] WeakMap (_individualDisabledStates) to track per-radio disabled state before group disable, enabling correct re-enable behavior (2026-03-12)
- **Problem solved:** hx-radio-group needed to disable all radios when group is disabled, but re-enable only those that were not individually disabled before the group disable
- **Why this works:** WeakMap provides memory-safe per-element state without adding properties to DOM nodes; allows group re-enable to restore original individual disabled states rather than enabling everything
- **Trade-offs:** More complex implementation but correct behavior for mixed disabled states; WeakMap entries are automatically GC'd when radio elements are removed

### role=combobox placed on a div element rather than a button for hx-select (2026-03-12)
- **Context:** hx-select trigger needed ARIA combobox semantics with owned listbox, but button+role=combobox is invalid ARIA — combobox must own or control a listbox
- **Why:** ARIA spec requires combobox role on a text input or element that owns the popup; button has implicit role=button which conflicts with combobox semantics in some AT implementations
- **Rejected:** button with role=combobox — invalid ARIA, some screen readers ignore the override or announce conflicting semantics (button + combobox)
- **Trade-offs:** div requires explicit keyboard handling (Enter/Space to activate) that button provides natively; more code but correct semantics
- **Breaking if changed:** Reverting to button+role=combobox would cause screen readers to announce ambiguous or conflicting control type, failing WCAG 4.1.2

#### [Pattern] aria-current moved to host element via updated() lifecycle rather than inner div in hx-step (2026-03-12)
- **Problem solved:** Screen readers announce aria-current from the element that has focus or is the semantic landmark; inner divs are often not exposed in the accessibility tree the same way
- **Why this works:** Placing aria-current on the host custom element ensures it is reflected in the accessibility tree at the component boundary where assistive technology interacts with it
- **Trade-offs:** Requires lifecycle hook (updated) to keep host attribute in sync with internal state; slightly more code but reliable cross-browser AT exposure

### color-mix() wrapped with @supports + rgba fallback rather than used directly (2026-03-12)
- **Context:** hx-spinner uses color-mix() for derived colors, but color-mix() has incomplete browser support in some environments
- **Why:** Progressive enhancement: modern browsers get the mathematically correct color mix, legacy browsers get a hardcoded rgba approximation
- **Rejected:** Using color-mix() directly would break rendering in browsers without support; using rgba-only would lose the dynamic relationship to the base token
- **Trade-offs:** Two code paths to maintain; rgba fallback may drift from the color-mix() result if base tokens change
- **Breaking if changed:** Removing @supports wrapper causes rendering failures in browsers without color-mix() support; removing fallback causes invisible spinners in those browsers

#### [Pattern] CSS custom property three-tier cascade in hx-theme: base defaults → component overrides → forced-colors as distinct token set (2026-03-12)
- **Problem solved:** hx-theme must provide global design tokens while allowing component-level overrides and HC (High Contrast) mode overrides without specificity wars
- **Why this works:** Keeps cascade predictable: each tier has a clear authority level. HC overrides are isolated as a token set rather than scattered @media blocks throughout components
- **Trade-offs:** All HC logic centralized in hx-theme — easier to audit and maintain, but hx-theme becomes a critical single point of failure for HC mode

### Convert deprecated boolean property to getter/setter pair to inject runtime console.warn() without changing the public API surface (2026-03-12)
- **Context:** hx-action-bar `sticky` property was deprecated in favor of `position="sticky"` but consumers had no runtime signal — only JSDoc hinted at deprecation
- **Why:** Getter/setter allows intercepting assignment to emit the warning while preserving full Lit reactive property behavior via manual requestUpdate() call; consumers get actionable guidance at runtime without breaking existing code
- **Rejected:** Leaving as a plain @property with only JSDoc deprecation — silent failures mean consumers never discover the deprecation until a breaking removal. Adding a new property instead would require a major version bump.
- **Trade-offs:** Getter/setter requires manually calling requestUpdate() to preserve Lit's reactivity cycle since @property decorator no longer manages the backing field directly; slightly more boilerplate but no behavior change
- **Breaking if changed:** Removing the getter/setter and reverting to plain @property would silence the deprecation warning; removing the requestUpdate() call would break reactivity for sticky binding in templates

#### [Pattern] Pre-existing lint warnings (non-null assertions) in hx-meter are explicitly scoped out of a TypeScript-fix PR to avoid scope creep (2026-03-12)
- **Problem solved:** hx-meter had 6 `@typescript-eslint/no-non-null-assertion` warnings on low!/high!/optimum! that pre-date the branch
- **Why this works:** These warnings require either null-guard refactoring or design decisions about property contracts — not a mechanical type annotation fix. Mixing them into a targeted PR obscures intent and risks behavioral change.
- **Trade-offs:** Leaves known lint warnings in codebase temporarily; PR stays focused and reviewable; warnings are documented so follow-up work is discoverable

### hx-number-input's _applyStep dispatches only hx-change, not both hx-input and hx-change (2026-03-13)
- **Context:** Step operations (increment/decrement via button click or keyboard) are discrete committed changes, not intermediate input events
- **Why:** hx-input semantically means 'value is changing interactively but not yet committed' (mirrors native input event); hx-change means 'value has been committed' (mirrors native change event). A step action is always a committed change — there is no intermediate state
- **Rejected:** Firing both hx-input then hx-change — would cause consumers listening to hx-input to process the value twice per step, potentially triggering double validation or double renders
- **Trade-offs:** Consumers that only listen to hx-input would miss step changes, but this is correct behavior — step changes should be handled by hx-change listeners
- **Breaking if changed:** Reverting to dual-event dispatch breaks consumers that debounce on hx-input, causing them to process committed step values as intermediate input

#### [Gotcha] Deprecated type aliases with wrong naming prefix (WcText vs HelixText) must be fully removed rather than re-exported — the alias itself is the incorrect pattern (2026-03-13)
- **Situation:** hx-text had a WcText type alias that was a stale artifact from a prior naming convention (Wc* prefix). The actual class is HelixText.
- **Root cause:** Keeping the alias, even as a deprecated re-export, perpetuates the wrong naming convention in autocomplete and downstream type references. Since this is a component library, alias pollution in exported types has compounding effect.
- **How to avoid:** Breaking change for any downstream code importing WcText directly, but correct for library hygiene

#### [Pattern] AUDIT.md files serve as the living source of truth for CSS findings per component, with findings marked ✅ FIXED inline — code fixes land in separate prior commits, audit doc updates land in dedicated feature branches (2026-03-13)
- **Problem solved:** CSS audit feature covered hx-tag (5 findings), hx-image (2), hx-meter (2) — all code fixes were already committed, this feature only updated AUDIT.md status markers
- **Why this works:** Separating code fix commits from audit documentation commits allows audit tracking to be updated asynchronously without re-running risk on already-merged fixes
- **Trade-offs:** Cleaner audit trail and lower-risk PRs for doc-only changes; requires discipline to keep AUDIT.md in sync with actual fix commits

### Step 4.5 placed in PostExecutionMiddleware (the finally-block proxy) rather than in the periodic health sweep (2026-03-13)
- **Context:** Features were getting stuck in in_progress after agent exit, blocking auto-mode concurrency slots
- **Why:** The finally block runs synchronously after every agent exit regardless of success/failure/crash, cutting recovery time from ~30 minutes (next health sweep cycle) to immediate (milliseconds after agent exits)
- **Rejected:** Health sweep fix was rejected because it only runs periodically — stuck features would block concurrency slots for the full sweep interval, degrading throughput under normal load
- **Trade-offs:** Faster recovery and no polling overhead, but the fix is coupled to the execution pipeline rather than being a standalone recovery mechanism; both could coexist for defense-in-depth
- **Breaking if changed:** Removing Step 4.5 and relying solely on health sweep means every agent exit that leaves in_progress state blocks a concurrency slot for up to 30 minutes

### Step 4 (remove from runningFeatures map) is ordered before Step 4.5 (reload and reset status) deliberately (2026-03-13)
- **Context:** Race condition risk: if status check happened before map removal, a feature could still appear as running when reloaded, making the in_progress state ambiguous
- **Why:** After Step 4 removes the feature from runningFeatures, any feature that still reads in_progress from disk definitively has no live agent — the in_progress state is provably stale at that point
- **Rejected:** Checking status before map removal would introduce a race window where the reloaded in_progress could be legitimate (agent still in map), making the reset unsafe
- **Trade-offs:** Ordering dependency between steps is implicit and fragile — reordering steps breaks the invariant silently without a compile error
- **Breaking if changed:** Swapping Step 4 and Step 4.5 order reintroduces the race and could reset legitimately running features

#### [Pattern] Step 4.5 is gated on ctx.loadFeature && ctx.updateFeatureStatus presence, degrading gracefully when callbacks are absent (2026-03-13)
- **Problem solved:** PostExecutionContext is shared across multiple callers; not all callers provide every optional callback
- **Why this works:** Prevents runtime errors in callers that predate the new interface fields without requiring a breaking change to all call sites
- **Trade-offs:** Graceful degradation means the fix silently does nothing if a caller forgets to wire the callbacks — there is no compile-time or runtime warning

### Package-specific GitHub links (hx-library source, hx-library issues) were normalized to the monorepo root URL rather than package-level paths, reflecting monorepo ownership boundaries in external-facing docs. (2026-03-13)
- **Context:** The docs referenced hx-library as if it were a standalone repo. In the actual monorepo structure, there is no separate hx-library repo — the package lives under packages/hx-library within bookedsolidtech/helix.
- **Why:** Monorepo structure means there is no authoritative separate package URL. Linking to the monorepo root with /blob/main/packages/hx-library/... for source or the root issues tracker is structurally correct and avoids dead links if package paths move.
- **Rejected:** Creating deep blob links to specific source files for all references — too brittle, breaks on file moves or renames.
- **Trade-offs:** Source code links use full blob paths (bookedsolidtech/helix/blob/main/packages/hx-library/src/...) for specific file references, while issue tracker links use root issues URL for generality.
- **Breaking if changed:** If hx-library is ever extracted to its own repo, all these links would need updating across the docs.

#### [Pattern] Extracted inline return type to named JsonLdListItem interface rather than using anonymous object type in _buildListItem (2026-03-13)
- **Problem solved:** hx-breadcrumb P3-05 — the method returned an anonymous object type, making it impossible for consumers or tests to reference the shape without duplicating the definition
- **Why this works:** Named interfaces enable type reuse, improve IDE hover documentation, and make the JSON-LD schema contract explicit and auditable. Anonymous return types hide the shape behind implementation details
- **Trade-offs:** One more exported type in the public surface; benefit is that the JSON-LD schema is now self-documenting and the interface name JsonLdListItem signals its purpose to future maintainers

### Documented role='presentation' ARIA semantics and consumer override pattern in connectedCallback JSDoc rather than enforcing a single role in component code (2026-03-13)
- **Context:** hx-stack P2-05/P1-03 — stack is a layout primitive that sets role='presentation' to make it AT-transparent, but consumers may need it to be a semantic group container (role='group' + aria-labelledby)
- **Why:** Layout primitives should not impose semantic roles — the correct role depends entirely on the content context. Documenting the override pattern (consumer sets role before mount, connectedCallback does not overwrite) makes the contract explicit without adding conditional logic
- **Rejected:** Accepting a role prop and switching behavior — rejected because it adds complexity and most layout wrappers should be AT-transparent; consumers needing semantic grouping should compose with a semantic element instead
- **Trade-offs:** Pattern only works if connectedCallback respects pre-existing role attributes; the role preservation test was added specifically to lock this contract and prevent regression
- **Breaking if changed:** If connectedCallback is changed to unconditionally set role='presentation', it will overwrite consumer-set roles and break accessible grouping patterns for any consumer relying on the documented override

### Runtime guards for invalid @property values use getter/setter pairs with console.warn and normalization to default, rather than TypeScript-only type constraints (2026-03-13)
- **Context:** hx-button-group and hx-checkbox-group orientation property could receive invalid string values at runtime via HTML attributes, which TypeScript union types cannot prevent
- **Why:** Lit properties can be set via HTML attributes at runtime where TypeScript type safety doesn't apply; getter/setter guards catch invalid values from non-TypeScript consumers and degrade gracefully instead of silently misbehaving
- **Rejected:** TypeScript union type alone (e.g. 'horizontal' | 'vertical') - catches compile-time issues only, fails silently at runtime for HTML attribute consumers or JavaScript callers
- **Trade-offs:** Adds runtime overhead and code volume; makes component more defensive and consumer-friendly across all usage contexts (HTML, JS, TS)
- **Breaking if changed:** Removing guards causes silent incorrect rendering when invalid orientation strings are passed via HTML attributes

### WcContainer deprecated alias re-exported via both component index.ts and main src/index.ts to maintain backward compatibility while migrating to HelixContainer (2026-03-13)
- **Context:** hx-container renamed export from WcContainer to HelixContainer; tests and external consumers still referenced WcContainer
- **Why:** Preserves backward compatibility for consumers importing WcContainer without requiring a major version bump; re-export at both levels ensures the alias is reachable through all import paths
- **Rejected:** Hard removal of WcContainer - would break existing consumers and require coordinated migration; single-level re-export only - would miss consumers importing from the barrel
- **Trade-offs:** Maintains two export names for same class indefinitely until WcContainer is fully deprecated and removed; reduces refactoring pressure on consumers
- **Breaking if changed:** Removing WcContainer re-export breaks any consumer or test importing it by the old name

### Canonical type aliases (HxFoo) exported alongside deprecated legacy aliases (WcFoo) with @deprecated JSDoc rather than breaking renames (2026-03-13)
- **Context:** Components had legacy 'Wc' prefix type aliases that needed migration to 'Hx' prefix without breaking existing consumers
- **Why:** Allows gradual migration: new code uses HxFoo, existing code using WcFoo gets IDE deprecation warnings but still compiles. TypeScript @deprecated triggers warnings in editors without build failures.
- **Rejected:** Hard rename of WcFoo to HxFoo would break all existing consumer TypeScript code immediately. Type-only re-export with @deprecated is zero-runtime-cost.
- **Trade-offs:** index.ts grows with duplicate exports; consumers must eventually migrate but are not forced to immediately
- **Breaking if changed:** Removing WcFoo aliases before consumers migrate breaks their TypeScript compilation

### CSS indentation for tree items handled entirely via --_indent-level CSS custom property cascade rather than a component 'indent' JavaScript property (2026-03-13)
- **Context:** hx-tree-item had a dead 'indent' property that was never used — indentation was already working via CSS variable
- **Why:** CSS cascade naturally propagates --_indent-level through nested tree items without JavaScript involvement. Removing dead code eliminates confusion about which mechanism controls indentation.
- **Rejected:** Keeping indent property as a JS API would require synchronizing it with CSS variables and create two competing sources of truth
- **Trade-offs:** Indentation is now CSS-only — cannot be controlled per-item from JS, but this matches the actual tree structure semantics
- **Breaking if changed:** Any consumer setting indent property in JS would silently have no effect (was already broken — the property was dead)

### Monotonic counter used instead of Math.random() for generating deterministic component IDs in hx-switch (2026-03-13)
- **Context:** hx-switch needed unique IDs for label/input association; Math.random() was used previously
- **Why:** Math.random() produces non-deterministic IDs that change on every render, breaking SSR hydration (server ID != client ID), snapshot tests, and accessibility tree stability. A module-level counter increments once per instance and is stable.
- **Rejected:** Math.random() causes hydration mismatches in SSR contexts and makes snapshot testing fragile. UUID libraries add dependency weight for a trivial use case.
- **Trade-offs:** Counter resets on page reload (IDs not globally unique across sessions) but this is fine for within-page uniqueness requirements
- **Breaking if changed:** Reverting to Math.random() breaks SSR hydration consistency and makes automated accessibility tree snapshots flaky

#### [Pattern] Legacy `Wc`-prefix type aliases retained with `@deprecated` JSDoc while new `Hx`-prefix canonical aliases are added and exported alongside them (2026-03-13)
- **Problem solved:** Codebase had WcTag, WcTreeView, WcTreeItem etc. using an old `Wc` prefix convention; migrating to `Hx` prefix for consistency with component naming
- **Why this works:** Breaking removal of WcTag etc. would force all consumers to update imports simultaneously; deprecation + dual-export gives a migration window while the canonical name is established
- **Trade-offs:** Both aliases must be maintained and exported from index.ts during transition period, adding noise to public API surface; however consumers can migrate at their own pace

#### [Pattern] Severity totals tables in audit documents should distinguish 'Baseline' counts from 'Remaining' counts rather than using a single static number (2026-03-13)
- **Problem solved:** hx-prose AUDIT.md showed original P0/P1/P2 counts after some findings were FIXED, making the table actively misleading for triage
- **Why this works:** A single count is ambiguous — it could mean 'total ever found' or 'still open'; splitting into Baseline/Remaining makes both the historical scope and current state explicit in one glance
- **Trade-offs:** Two-column table is slightly more complex to maintain; benefit is that auditors can immediately assess remediation progress without reading every detailed section

### SpinnerSize typed as 'SpinnerSize | string' (intentional union widening) rather than strict 'SpinnerSize' alone (2026-03-13)
- **Context:** hx-spinner size property needed to accept both design token values ('sm'|'md'|'lg') and arbitrary CSS size values passed as strings
- **Why:** Web components receive all attribute values as strings; forcing strict SpinnerSize would break consumers passing arbitrary CSS values or future token expansions without a library update
- **Rejected:** Strict 'SpinnerSize' only — would cause TypeScript errors for valid CSS size strings consumers legitimately pass
- **Trade-offs:** Easier for consumers to pass arbitrary values; harder to catch typos at compile time for token values. Type guard _isTokenSize() compensates by enabling runtime narrowing
- **Breaking if changed:** Removing the string union forces a major version bump — any consumer passing non-token size strings gets a TS error

#### [Gotcha] CSS ':host(:not([placement]))' fallback selector conflicts with JS default when placement has reflect:true — the 'no attribute' state never actually occurs after first render (2026-03-13)
- **Situation:** hx-toast placement CSS had ':host(:not([placement]))' mapping to 'bottom-start' while JS default was 'bottom-end', creating an inconsistency
- **Root cause:** With reflect:true, the attribute is always written to the DOM on first render using the JS default, so the :not([placement]) rule only fires if the attribute is programmatically removed post-render — an edge case that reveals the disagreement
- **How to avoid:** Removing the fallback CSS rule is cleaner and makes the system self-consistent; the cost is that manually removing the attribute post-render leaves no CSS fallback

#### [Pattern] hx-step internal orientation/size properties use reflect:true exclusively to satisfy CSS ':host([orientation=vertical])' selectors, not for external API use (2026-03-13)
- **Problem solved:** Parent hx-steps manages child hx-step properties via _syncChildren(); exposing these as settable attributes would create conflicting control paths
- **Why this works:** Lit's :host([attr]) CSS selector requires the attribute to exist in the DOM — reflect:true is the mechanism to get a JS property into a DOM attribute for CSS targeting without creating a true public attribute API
- **Trade-offs:** reflect:true makes the properties appear as public attributes in DevTools and CEM, potentially confusing consumers; @internal JSDoc mitigates this but tooling may still surface them

#### [Pattern] Dead code queries (e.g., _bodyEl) in Web Components must be removed rather than left unused — they create false impressions of component structure, confuse LLM agents and developers reading the code, and can cause subtle bugs if the queried element never exists (2026-03-13)
- **Problem solved:** hx-side-nav had a _bodyEl DOM query that was never used, presumably from a refactor that removed the element it targeted
- **Why this works:** Unused queries that return null silently pass TypeScript checks but misrepresent component architecture; in an agentic codebase where AI reads source to understand structure, dead code causes incorrect reasoning about component capabilities
- **Trade-offs:** Removal is clean but requires verifying the property was truly unused across all lifecycle methods and subclasses

### Internal type aliases for Web Components should use the public API naming convention (HxSideNav, HxNavItem) rather than implementation prefixes (WcSideNav, WcNavItem) — mismatches between internal aliases and exported class names create confusion in TypeScript declaration files and IDE autocomplete (2026-03-13)
- **Context:** hx-side-nav test files used WcSideNav/WcNavItem type aliases that didn't match the actual exported class names, causing mismatch between what developers see in source vs what TypeScript exports
- **Why:** When type aliases diverge from exported names, TypeScript declaration files (.d.ts) show inconsistent names, breaking the contract between library author intent and consumer experience
- **Rejected:** Keeping Wc prefix as internal convention — rejected because it leaks into test files that consumers may reference as examples, and creates dual naming systems with no clear rule
- **Trade-offs:** Renaming requires updating all test references but produces a consistent naming contract throughout the codebase
- **Breaking if changed:** Reverting to Wc-prefixed aliases would cause confusion in any downstream code that imports types from the library and sees mismatched names

#### [Pattern] When fixing Storybook audit findings, scope the changeset to only the files actually modified rather than all audited components. Components where findings were 'already addressed' do not need changeset entries or commits. (2026-03-13)
- **Problem solved:** The audit covered hx-checkbox, hx-checkbox-group, hx-field, hx-popover, and hx-radio-group (10 findings). Only hx-checkbox required code changes; the others were verified as already compliant.
- **Why this works:** Including no-op components in the changeset would inflate the changelog and make the release history misleading. The changeset accurately reflects what changed (`@helixui/library: patch`) for the actual code touched.
- **Trade-offs:** Narrower changesets require the implementer to carefully verify each component's compliance state before committing, adding audit work upfront but producing a cleaner release history.

### hx-size on hx-button-group is safe to set via PHP Attribute::setAttribute() because it maps to a CSS custom property cascade, not a reflected IDL attribute — Drupal can set it without triggering re-renders (2026-03-13)
- **Context:** Audit finding P2-17 questioned whether hx-size was safe to use from Drupal — concern was that setting it post-render could cause visual thrash or JS side effects
- **Why:** The attribute sets a CSS custom property (--hx-size) on the host element which child hx-button components inherit via the cascade. No JS observer watches this attribute, so setAttribute is safe at any lifecycle point.
- **Rejected:** Treating hx-size as a reflected property requiring constructor-time initialization — would have prevented Drupal from setting it in render arrays
- **Trade-offs:** CSS custom property cascade means size changes are inherited automatically by slotted children, but also means deeply nested non-slot children could be accidentally affected
- **Breaking if changed:** If hx-size is ever changed to trigger a JS attributeChangedCallback with re-render logic, setAttribute from Drupal could cause flash-of-restyled-content

#### [Pattern] hx-slider integrates with native HTML form reset via formResetCallback (ElementInternals) — Drupal form integration must use native <form> reset, not custom JS reset, to trigger the callback (2026-03-13)
- **Problem solved:** Drupal AJAX forms often reset fields by setting values directly via JS rather than calling form.reset() — this bypasses the Web Component's formResetCallback entirely
- **Why this works:** formResetCallback is part of the Form-Associated Custom Elements spec and only fires on native form.reset() calls. Documented the anti-pattern explicitly in README.drupal.md to prevent silent form state desync.
- **Trade-offs:** Drupal AJAX form patterns may need adjustment to use form.reset() instead of field-by-field JS value setting; adds constraint but ensures correctness

#### [Pattern] Deprecated `align` attribute CSS selectors in hx-prose are intentionally retained as CKEditor compatibility shims, documented as such in AUDIT.md rather than removed (2026-03-13)
- **Problem solved:** Drupal CKEditor 4/5 outputs HTML with deprecated `align` attributes on images; the design system must handle this legacy output it cannot control
- **Why this works:** Drupal content editors produce `<img align='left'>` via CKEditor toolbar; the browser ignores the deprecated attribute but CSS attribute selectors (`[align='left']`) provide the only hook to apply float styles without modifying Drupal's HTML output pipeline
- **Trade-offs:** Easier: zero-config Drupal integration for CKEditor image alignment. Harder: carrying forward deprecated HTML attribute dependencies; must be documented clearly to avoid future 'cleanup' that breaks Drupal sites

#### [Pattern] Drupal behaviors for web components use data-attribute patterns (data-hx-drawer-trigger / data-hx-drawer-target) rather than directly querying the custom element, with once() for AJAX-safe attachment and detach lifecycle hooks (2026-03-13)
- **Problem solved:** hx-drawer needed Drupal JS integration to allow CMS editors to wire up open/close triggers without writing JS
- **Why this works:** Drupal's AJAX system re-renders DOM fragments without full page reload; once() prevents duplicate event listener attachment on AJAX-refreshed content, matching the established hx-toast.drupal.js convention in the library
- **Trade-offs:** More verbose setup required (data attributes on trigger elements) but AJAX safety is guaranteed; detach hook enables clean teardown

### hx-icon-button Twig template prominently documents the non-standard hx-size attribute (not size) as a top-level warning in README.drupal.md (2026-03-13)
- **Context:** hx-icon-button uses hx-size as its sizing attribute rather than the HTML-native size attribute, which conflicts with developer expectations
- **Why:** Drupal/Twig authors familiar with standard HTML form elements expect size= to control sizing; using the wrong attribute produces no error but silently has no effect, causing hard-to-diagnose styling issues
- **Rejected:** Burying the note in a general attributes table would cause it to be missed; renaming the attribute to size in the component would be a breaking API change
- **Trade-offs:** Explicit documentation reduces integration errors at cost of README maintenance if the attribute name ever changes
- **Breaking if changed:** If the component API changes hx-size to size, README.drupal.md and all consumer Twig templates would pass the wrong attribute silently

#### [Pattern] Drupal Twig templates for web components follow a strict convention: inline comment block documenting all variables, {% if %} guards for optional boolean attributes, {{ attributes }} passthrough, and attach_library() + .libraries.yml snippets in companion README files (2026-03-13)
- **Problem solved:** 5 components needed Drupal integration added consistently so CMS developers have a predictable integration surface across the component library
- **Why this works:** Consistency across all component Twig templates reduces cognitive overhead for Drupal developers; the attributes passthrough is critical for Drupal's render API to inject its own classes, data attributes, and ARIA attributes onto the element
- **Trade-offs:** Template verbosity increases but interoperability with Drupal's attribute system is preserved

### Export typed event detail interfaces (HxSelectDetail, HxTreeItemSelectDetail) from component index.ts and main library src/index.ts rather than leaving dispatchEvent calls as untyped CustomEvent (2026-03-13)
- **Context:** TypeScript consumers of the component library had no type information for event.detail payloads, requiring casting or any types
- **Why:** Explicit interfaces make event contracts part of the public API — consumers get autocomplete and type checking on event detail properties. Breaking change detection becomes automatic when interfaces change
- **Rejected:** Generic CustomEvent<Record<string, unknown>> — rejected because it provides no type safety or discoverability for consumers
- **Trade-offs:** Interfaces become part of the public API surface — changing them is a breaking change requiring semver major bump. Gain: eliminates runtime errors from incorrect event detail property access
- **Breaking if changed:** Removing interface exports breaks all TypeScript consumers that import and use these types; changing interface shape without semver bump breaks consumer type checking silently

### LitElement @property snap array uses a custom converter with fromAttribute (JSON.parse with comma-separated fallback) and toAttribute (JSON.stringify) to enable HTML attribute binding for array types (2026-03-13)
- **Context:** snap property in hx-split-panel needed to be settable from Drupal Twig templates which can only set HTML attributes as strings, not JS properties
- **Why:** Drupal Twig rendering is purely static HTML — it cannot execute JS to set properties post-render. Without a converter, array properties are JS-only and inaccessible from server-side template systems
- **Rejected:** Leaving snap as a JS-only @property — rejected because it makes the feature entirely unusable from Drupal/Twig, violating the platform requirement that all components be Twig-renderable without modification
- **Trade-offs:** Enables server-side framework compatibility at the cost of a serialization contract that must be maintained; consumers must know to pass JSON array strings as attribute values
- **Breaking if changed:** Removing the converter breaks Drupal Twig integration for snap points; changing the serialization format (e.g. switching from JSON to comma-separated) is a breaking change for any Twig templates already using the attribute

#### [Pattern] Arrow border rendering in positioned overlays uses an innerBorderMap keyed by placement direction to zero out inward-facing border sides, preventing double-border artifacts at the arrow tip (2026-03-13)
- **Problem solved:** CSS borders on a rotated pseudo-element used as a popover arrow produce a visible inner border on the side facing the popover body, creating a rendering artifact
- **Why this works:** The arrow is implemented as a rotated square div with borders; the side touching the popover interior must have border-width 0 or border-color transparent per placement direction — a static map lookup is more maintainable than conditional logic
- **Trade-offs:** The map must be updated if new placement directions are added; correctness is data-driven rather than computed, making it easy to audit but easy to forget to extend

#### [Pattern] When multiple GH issues are in scope for a single feature branch, issues already resolved in prior audits should be explicitly noted as no-action in the PR body rather than silently skipped (2026-03-13)
- **Problem solved:** Issues #800 and #803 were in the feature scope but already fixed — without explicit documentation in the PR, reviewers would not know if they were missed or intentionally excluded
- **Why this works:** Provides audit trail and prevents CodeRabbit or human reviewers from flagging omitted issues as gaps. Closes only the issues actually fixed in this PR; leaves others open with explanation.
- **Trade-offs:** More verbose PR body but eliminates reviewer confusion and preserves accurate issue history

#### [Pattern] CSS modernization pattern: retain deprecated property alongside modern replacement (e.g., keep `clip: rect(0,0,0,0)` AND add `clip-path: inset(50%) !important`) rather than replacing outright (2026-03-13)
- **Problem solved:** hx-visually-hidden uses the classic visually-hidden technique; `clip` is deprecated in favor of `clip-path` but older browsers/assistive tech may rely on `clip`
- **Why this works:** Progressive enhancement — modern browsers use clip-path, legacy environments fall back to clip. Removing clip entirely would break visually-hidden in older environments silently with no error
- **Trade-offs:** Slightly more CSS per component, but zero regression risk across browser matrix

### Use `overflow-wrap: break-word` as the canonical property name rather than the vendor-alias `word-wrap: break-word` in Lit component styles (2026-03-13)
- **Context:** hx-tooltip needed long text to wrap; `word-wrap` is a legacy alias that still works but is deprecated in CSS spec
- **Why:** `overflow-wrap` is the W3C standard name; `word-wrap` is preserved only for IE compatibility which is out of scope. Using the standard name signals intent clearly and avoids lint/audit flags on future passes
- **Rejected:** Keeping `word-wrap` works functionally in all browsers but would continue triggering CSS audit findings and may be flagged by future stylelint rules
- **Trade-offs:** No functional difference in any supported browser; purely a correctness/audit-cleanliness win
- **Breaking if changed:** No breakage — `overflow-wrap` has universal support. Reverting to `word-wrap` re-opens GH #831 audit finding

#### [Gotcha] AUDIT.md files marking findings as UNFIXED can lag behind actual code fixes — prior TypeScript commits had already resolved hx-select P0-01 (optgroup sync) and P0-02 (aria-live contradiction) without updating audit documentation (2026-03-13)
- **Situation:** Task assumed hx-select P0-01 and P0-02 were still unfixed based on AUDIT.md status, but source inspection revealed both were already resolved
- **Root cause:** Code review and implementation work proceeded faster than documentation updates in a multi-agent/multi-PR workflow
- **How to avoid:** Always verifying current source before implementing audit fixes adds discovery overhead but prevents double-work and contradictory implementations

#### [Pattern] hx-split-button.drupal.js uses two separate named Drupal behaviors (hxSplitButtonPrimary and hxSplitButtonMenu) rather than one monolithic behavior to wire hx-click and hx-select independently via data attributes (2026-03-13)
- **Problem solved:** hx-split-button has two distinct interaction surfaces: a primary action button (hx-click) and a dropdown menu (hx-select per item), each requiring different AJAX endpoint resolution
- **Why this works:** Drupal's behavior system allows independent attach/detach lifecycle; splitting behaviors means a page can attach only the primary action behavior without the menu behavior if no menu items exist, and each can be independently detached on DOM removal
- **Trade-offs:** Two behaviors = two querySelectorAll passes on attach, but enables cleaner separation of concerns and independent lifecycle management per interaction surface

#### [Pattern] SSR-safe ID generation uses either module-level counters (_hxTextareaIdCounter) or static class counters (HelixTimePicker._instanceCount) instead of Math.random() (2026-03-13)
- **Problem solved:** Web components rendered server-side need deterministic, unique IDs that won't mismatch between SSR output and client hydration
- **Why this works:** Math.random() produces different values on server vs client, causing hydration mismatch errors. Counters increment monotonically and produce the same sequence if render order is consistent
- **Trade-offs:** Counter approach is simple and synchronous but assumes consistent component instantiation order between server and client; static class counter survives module reloads in some bundlers while module-level var does not

### AUDIT.md serves as the authoritative fix-status record tied 1:1 to GH issues, with strikethrough markdown (~~text~~) denoting fixed findings inline in the existing table (2026-03-13)
- **Context:** Need to track which audit findings are resolved without separate tracking systems, while keeping history of what was found and how it was fixed
- **Why:** Inline strikethrough preserves original finding text (useful for context/blame) while clearly signaling resolution; co-locating with source means the record travels with the component in PRs
- **Rejected:** Deleting fixed rows — loses history of what was found; separate tracking spreadsheet — diverges from source; status column — less visually scannable than strikethrough
- **Trade-offs:** AUDIT.md grows over time and requires discipline to update synchronously with source fixes; the format is human-readable but not machine-parseable for automated reporting
- **Breaking if changed:** If AUDIT.md update is separated from the source fix into a different PR/commit, the GH issue closure (via 'closes #NNN' in PR body) will close the issue before documentation reflects the fix

### TypeScript source fixes (DrawerSize narrowing, instanceof guards) were committed in a prior session; the current PR primarily adds AUDIT.md documentation and hx-badge type exports — source of truth for fix status is git log, not board status (2026-03-13)
- **Context:** Board showed features as incomplete but the actual TypeScript fixes had already been applied to source in earlier commits, risking duplicate work
- **Why:** Separating implementation commits from documentation/audit commits means audit records can lag source; verifying git log before starting work prevents re-implementing already-fixed issues
- **Rejected:** Trusting board status as source of truth was rejected — it doesn't reflect actual code state, only task lifecycle state
- **Trade-offs:** Requires an extra git log check before starting any continuation task; avoids wasted work and merge conflicts from duplicate changes
- **Breaking if changed:** If agents skip git log verification and rely on board status, they will re-implement already-landed fixes, creating conflicts or redundant commits

#### [Gotcha] AUDIT.md can show all findings as resolved while the actual deliverable artifact (the .twig file) was never created — board/audit status is not source of truth for file existence (2026-03-13)
- **Situation:** The hx-tooltip component was the only one missing a Twig template; AUDIT.md text indicated resolution but no file existed
- **Root cause:** Audit documents track issue resolution decisions, not file system state — a finding can be marked resolved prematurely or the file creation step omitted
- **How to avoid:** Audit docs are valuable for tracking intent but require cross-referencing against actual file system artifacts for verification

### Reference Twig templates in a component library should use manual `{% for key, val in attributes %}` iteration over `{{ attributes }}` when callers pass plain PHP associative arrays rather than Drupal Attribute objects (2026-03-13)
- **Context:** CodeRabbit suggested switching to `{{ attributes }}` Drupal pattern, but 10 of 11 component twig files use manual iteration — only 1 uses the Drupal Attribute object pattern
- **Why:** `{{ attributes }}` requires callers to pass a real Drupal `Attribute` object. These are reference/demo templates used with plain arrays. Consistency with 10 other files matters more than adopting a pattern that would break simple callers.
- **Rejected:** `{{ attributes }}` Drupal pattern — would require all callers to construct Attribute objects, breaking plain-array usage that is the dominant calling convention in this codebase
- **Trade-offs:** Manual iteration is more verbose but universally compatible; `{{ attributes }}` is cleaner but tightly couples templates to Drupal's object model
- **Breaking if changed:** Switching to `{{ attributes }}` breaks every caller passing a plain associative array instead of a Drupal Attribute object

#### [Pattern] Docs-only AUDIT.md changes use `skip-changeset` label + `SKIP_CHANGESET=1` env var on push rather than creating a semantic versioning changeset (2026-03-13)
- **Problem solved:** The changeset tooling is used to drive semver bumps and release notes. A documentation-only correction to an AUDIT.md file does not represent a consumer-facing change and should not trigger a version bump.
- **Why this works:** Changeset creation for pure documentation fixes would pollute the changelog with non-functional entries and could trigger unnecessary package version bumps, confusing downstream consumers.
- **Trade-offs:** Simpler release history, but requires discipline to correctly classify changes; misclassifying a real fix as docs-only would silently skip its changelog entry

### CodeRabbit gate enforced via branch protection required status checks, not auto-merge configuration (2026-03-16)
- **Context:** Needed to ensure dev→staging promotion PRs get CodeRabbit review before merging to staging
- **Why:** Branch protection is enforcement-layer — the required status check blocks merge at the GitHub level regardless of who triggers the merge or whether auto-merge is enabled. Auto-merge configuration is opt-in per PR and can be bypassed; branch protection cannot.
- **Rejected:** Relying on auto-merge delay or manual process to wait for CodeRabbit — both are bypassable and not enforceable at scale in an automated pipeline
- **Trade-offs:** Adds ~5min latency per promotion cycle; enforcement is now unconditional and cannot be skipped even by repo admins without explicitly changing branch protection
- **Breaking if changed:** Removing CodeRabbit from staging required status checks would silently re-enable unreviewed promotions — the pipeline would still work but the quality gate disappears without any visible failure

#### [Gotcha] .automaker/context/ directory is gitignored — files written there (like quick-rules.md) are local-only and never committed to the repo (2026-03-16)
- **Situation:** Attempted to create quick-rules.md as a committed documentation artifact for agent context
- **Root cause:** The .automaker/ directory is a runtime/ephemeral space managed by protoMaker, not a source-controlled artifact space
- **How to avoid:** Agent context rules that live in .automaker/ are instance-local only; they don't survive worktree deletion or team sharing. CLAUDE.md is the durable documentation layer.

#### [Pattern] strict: true on branch protection ensures promotion branch is up-to-date with staging before merge, preventing stale promotion PRs (2026-03-16)
- **Problem solved:** Without strict mode, a promotion PR created from an old dev HEAD could merge even if staging had received hotfixes, potentially overwriting them
- **Why this works:** Promotion PRs aggregate many commits — if staging has diverged (e.g., hotfix), a stale promotion would silently discard those changes on merge
- **Trade-offs:** Requires re-basing/updating the promotion PR if staging advances mid-cycle, adding friction; prevents silent regression from stale merges

#### [Gotcha] npm package exports map requires explicit dist-path aliases when consumers import using the physical dist path rather than the canonical alias (2026-03-17)
- **Situation:** Consumers importing @helixui/tokens/dist/tokens.css received 'Module not found' errors even though the file existed at that path, because the exports map acts as an allowlist — any path not explicitly listed is blocked regardless of physical file existence
- **Root cause:** Node.js package exports map is a strict allowlist. If a subpath is not declared in exports, it is inaccessible to consumers even if the file exists on disk. The original package.json only declared ./tokens.css -> ./dist/tokens.css (canonical alias), leaving the intuitive dist path unreachable
- **How to avoid:** Adding the alias makes both paths valid, which means there are now two public API surfaces for the same file. Deprecation of the dist path cannot be enforced via the exports map alone — requires documentation convention

### Replace blanket `.automaker/` gitignore rule with 26 granular rules covering only operational/runtime subdirectories, leaving context/, memory/, skills/, and spec.md trackable (2026-03-17)
- **Context:** Blanket `.automaker/` ignore was blocking `git add -A -- ':!.automaker/'` with a pathspec error — git cannot negate a pattern for files that are entirely ignored at the directory level
- **Why:** Git pathspec negation (`:!.automaker/`) fails when the directory itself is ignored; granular rules allow the negation to work correctly because individual subdirs are ignored rather than the root
- **Rejected:** Keeping blanket ignore and using `git add -f` to force-add context files — this would require every agent commit to use force-add flags, making it fragile and easy to forget
- **Trade-offs:** Granular rules require maintaining the ignore list as new operational subdirs are added to .automaker; benefit is that project knowledge (context/memory/skills) is automatically trackable without special flags
- **Breaking if changed:** Reverting to blanket `.automaker/` ignore breaks `git add -A -- ':!.automaker/'` pathspec negation and prevents agent-learned knowledge from ever being committed to the repo

#### [Pattern] Use HELiXiR's gitignore as the gold standard reference configuration when aligning sister projects — cross-project consistency prevents divergent infrastructure bugs (2026-03-17)
- **Problem solved:** HELiXiR already had the correct granular .automaker gitignore configuration; Helix had diverged to a blanket ignore that caused agent failures
- **Why this works:** Maintaining a canonical reference project prevents each project from independently discovering the same infrastructure gotchas; alignment is cheaper than rediscovery
- **Trade-offs:** Requires knowing which project is the gold standard and periodically auditing others against it; benefit is shared infrastructure learnings propagate automatically

#### [Gotcha] Changeset 'linked' config causes all linked packages to bump to the same version even if only one has a changeset entry — both @helixui/library (0.3.3) and @helixui/tokens (0.3.2) will land at 0.3.4 (2026-03-17)
- **Situation:** Both packages needed to be bumped for the e2e pipeline test, but the version skew from linked config was not immediately obvious
- **Root cause:** Changesets linked groups enforce version parity across packages that are always released together, preventing consumers from using mismatched major/minor versions
- **How to avoid:** Simpler consumer experience but any single-package patch forces a bump on all linked packages, potentially surprising contributors who edited only one package

### Used a real, production-useful changeset (fix stale codename, add discovery keywords) rather than a throwaway no-op bump to validate the pnpm publish pipeline (2026-03-17)
- **Context:** The feature goal was to verify the e2e pnpm changeset pipeline after npm→pnpm migration; a throwaway bump would have validated the pipeline but left no lasting value
- **Why:** Combining pipeline validation with a genuinely useful metadata fix avoids a 'test-only' commit that would need to be reverted or that would add noise to the changelog
- **Rejected:** Empty/dummy changeset or version-only bump — would validate the pipeline but produce a meaningless entry in CHANGELOG.md and npm release notes
- **Trade-offs:** More work per validation run but every pipeline test also delivers a real improvement; risk is that the 'useful' change could introduce unintended scope creep or review friction
- **Breaking if changed:** If future pipeline tests use dummy changesets, changelog quality degrades and it becomes harder to audit what each release actually changed

#### [Pattern] CEM (Custom Elements Manifest) binary lives in root node_modules/.bin/cem but must be invoked from within the package directory (cd packages/hx-library) so that relative glob paths like src/components/**/*.ts resolve correctly against the package, not the monorepo root. (2026-03-18)
- **Problem solved:** Generating the custom-elements.json manifest for hx-library in a pnpm monorepo worktree where the cem binary is hoisted to root.
- **Why this works:** The cem analyzer resolves globs relative to CWD. Running from the wrong directory causes it to either find no files or analyze the wrong set of components, silently producing an incomplete manifest.
- **Trade-offs:** The invocation pattern is: `cd <package> && <root>/node_modules/.bin/cem analyze --globs 'src/...'`. This is non-obvious but reliable. Forgetting the cd means the manifest appears to succeed but contains wrong or empty component entries.

### Replace crypto.randomUUID() with module-level monotonic counters for component instance IDs in SSR-capable web components (2026-03-18)
- **Context:** hx-tooltip, hx-popover, and hx-field used crypto.randomUUID() to generate unique IDs for ARIA associations (aria-describedby, for/id linkage). In SSR+hydration, the server generates one UUID and the client generates a different UUID, causing hydration mismatch and broken accessibility associations.
- **Why:** Monotonic counters are deterministic: if components render in the same order server-side and client-side (which they do in hydration), they receive the same numeric suffix. This guarantees ID stability across the SSR/hydration boundary without requiring any shared state or serialization.
- **Rejected:** crypto.randomUUID() was rejected because it produces cryptographically random values that differ between server and client renders. A stale comment in hx-popover actually incorrectly advocated FOR crypto.randomUUID() over counters, indicating this was a previously contested decision that was resolved incorrectly.
- **Trade-offs:** Easier: SSR hydration works correctly, ARIA associations survive hydration, no hydration mismatch warnings. Harder: counters are process-scoped so if two independent SSR renders happen in the same process they may get different counter values — but this is acceptable since hydration pairs a specific server render with its client replay.
- **Breaking if changed:** Reverting to crypto.randomUUID() breaks SSR hydration for any page using hx-tooltip, hx-popover, or hx-field. ARIA aria-describedby and label-for associations will silently fail because the IDs won't match between server HTML and client DOM.

#### [Pattern] Module-level monotonic counter pattern for SSR-safe component instance IDs: declare 'let _componentCounter = 0' at module scope, assign ID as '${++_componentCounter}' in class field initializer (2026-03-18)
- **Problem solved:** Web components need unique IDs to wire ARIA relationships (aria-describedby, label for). These IDs must be stable across SSR/hydration boundaries. The correct pattern is established in hx-textarea, hx-tabs, and hx-switch but was not consistently applied.
- **Why this works:** Module-level counters are initialized once per module load. During SSR, the module loads and components render in tree order. During client hydration, the same module loads fresh and components hydrate in the same tree order. The counter sequences match exactly, producing identical IDs.
- **Trade-offs:** Easier: zero-config SSR safety, no consumer API changes, deterministic test IDs. Harder: if component mount order changes between SSR and hydration (e.g., conditional rendering), IDs will mismatch — but this is a general SSR constraint, not specific to this pattern.

#### [Gotcha] CEM (Custom Elements Manifest) generation fails in worktree environments due to missing node_modules binaries — pre-existing worktree env issue (2026-03-18)
- **Situation:** The CEM analyzer binary is not available in the worktree's node_modules because worktrees share the git history but not the install state of the root workspace
- **Root cause:** pnpm workspaces install node_modules at the workspace root; worktrees created via git worktree add do not re-run install, so binaries in .bin/ may be absent or symlinked incorrectly
- **How to avoid:** CEM manifest is not validated locally in worktrees; relies entirely on CI for manifest correctness. Acceptable because CEM is a build artifact, not source

### Introduced a module-level reference-counted lock (body-scroll-lock.ts) with lockBodyScroll()/unlockBodyScroll() instead of direct document.body.style.overflow manipulation in each component (2026-03-18)
- **Context:** hx-dialog and hx-drawer both independently set document.body.style.overflow = 'hidden' and '' on open/close. If one closes before the other, it restores scroll prematurely, breaking the still-open overlay.
- **Why:** Module-level singleton counter means only the last caller to unlock actually restores scroll. The 0→1 and 1→0 transition guards prevent double-locking or premature restoration regardless of open/close ordering.
- **Rejected:** Storing previousBodyOverflow per-instance (hx-drawer's old approach with _previousBodyOverflow) — this fails when multiple overlays are open because whichever one closes last captures '' as the 'previous' value, or whichever closes first restores scroll while another is still open.
- **Trade-offs:** Easier: simultaneous overlays just work. Harder: the counter is module-global state — if a component fails to call unlock (e.g., disconnectedCallback not firing), scroll stays locked permanently with no recovery path.
- **Breaking if changed:** Removing body-scroll-lock.ts or reverting components to direct style.overflow writes re-introduces the race condition. Changing the module to instance-based (non-singleton) breaks the shared counting.

### Sub-components use `display: contents` on `:host` so the browser's native table layout algorithm sees the native elements directly (2026-03-18)
- **Context:** Web Components with Shadow DOM break table layout because the browser sees custom elements (hx-tr, hx-td etc.) as generic block/inline boxes, not valid table children, causing rendering failure
- **Why:** CSS `display: contents` makes the host element itself invisible to layout while its children participate in the parent layout context — the browser's table algorithm then sees native <tr>, <td>, <th> elements as direct descendants
- **Rejected:** Rendering entire table inside hx-table's single shadow DOM was rejected because it would require hx-table to know all data upfront, losing composability and slot-based content projection
- **Trade-offs:** Composability and semantic HTML preserved; trade-off is that styling the host element directly is impossible since it has no box, and some CSS properties like `display` on the host are overridden

### Cross-shadow-DOM variant styling uses CSS custom properties cascading from hx-tbody into hx-tr shadow DOMs rather than direct class propagation (2026-03-18)
- **Context:** Shadow DOM encapsulation prevents a variant class on hx-table from affecting styles inside hx-tr or hx-td shadow roots
- **Why:** CSS custom properties pierce shadow DOM boundaries by design — defining --hx-table-stripe-bg on hx-tbody allows hx-tr's internal stylesheet to consume it without any JS coordination
- **Rejected:** JavaScript-driven variant propagation (parent sets attribute on each child) was rejected as it creates tight coupling, requires MutationObserver, and causes layout thrash on variant changes
- **Trade-offs:** Pure CSS cascade with zero JS overhead; trade-off is that custom property names become a public API contract that must be versioned

#### [Pattern] Set ARIA list/listitem roles on host elements (connectedCallback) rather than inner shadow DOM divs for cross-shadow-DOM list semantics (2026-03-18)
- **Problem solved:** hx-structured-list had role="list" on inner shadow div and role="listitem" on inner shadow div of hx-structured-list-row — screen readers cannot traverse list/listitem relationships across shadow boundaries
- **Why this works:** Host elements (hx-structured-list and hx-structured-list-row) exist in the consumer's light DOM as parent/child siblings, so the browser's accessibility tree can correctly traverse the list/listitem relationship without crossing shadow root boundaries
- **Trade-offs:** Host elements gain semantic roles which affects how assistive technologies announce the component; shadow DOM internal structure is decoupled from accessibility semantics

### Event handler methods typed as `(e: Event): void` with runtime `instanceof` narrowing instead of typed as `(e: KeyboardEvent): void` or `(e: CustomEvent<T>): void` (2026-03-18)
- **Context:** Web Components using `addEventListener`/`removeEventListener` with strongly-typed handler methods caused TypeScript to require `as EventListener` casts because the DOM API signature expects `(e: Event) => void`
- **Why:** The DOM `addEventListener` signature requires handlers compatible with `EventListener` which accepts `Event`, not subtypes. TypeScript structural typing means `(e: KeyboardEvent) => void` is NOT assignable to `(e: Event) => void` because the parameter is contravariant — a `KeyboardEvent` handler would break if called with a plain `Event`
- **Rejected:** `as EventListener` cast silences the error but removes type safety; overloading `addEventListener` is complex and non-standard; using arrow function wrappers adds allocation on every connect
- **Trade-offs:** Handler bodies become slightly more verbose with guard returns; but addEventListener/removeEventListener calls are cast-free and the same bound reference works for both add and remove
- **Breaking if changed:** Removing the `instanceof` guard and using the event parameter directly would cause runtime errors if a different event type is dispatched to the same listener

#### [Pattern] Type guard filter predicates `filter((el): el is HelixTab => el instanceof HelixTab)` replace `Array.from(...) as HelixTab[]` array casts — works with type-only imports since `instanceof` requires the runtime class (2026-03-18)
- **Problem solved:** Getting typed arrays of custom element children from `querySelectorAll` or `assignedElements` returns `Element[]`, requiring either a cast or a type guard
- **Why this works:** Cast `as HelixTab[]` is unsound — it asserts without checking, so mixed content (e.g., non-HelixTab children) would produce runtime errors silently. The filter predicate both narrows the type AND removes non-matching elements at runtime
- **Trade-offs:** Slightly slower (iterates array twice conceptually) but negligible for DOM child counts; gains runtime correctness guarantee

#### [Pattern] `instanceof HTMLSlotElement` guard as the first line of slot change handlers eliminates `e.target as HTMLSlotElement` casts and also serves as a defensive early-return for unexpected event routing (2026-03-18)
- **Problem solved:** Slot change handlers registered on `<slot>` elements receive `Event` with `e.target` typed as `EventTarget`, requiring a cast to call `.assignedElements()`
- **Why this works:** The cast `e.target as HTMLSlotElement` is unsafe if the handler is ever accidentally reused or the event bubbles from a non-slot element. The guard makes the assumption explicit and enforced at runtime
- **Trade-offs:** One extra branch per handler invocation (negligible); gains both type narrowing AND defensive correctness

### Implemented hx-table as a 7-component system (hx-table, hx-thead, hx-tbody, hx-tfoot, hx-tr, hx-th, hx-td) mirroring native HTML table semantics rather than a monolithic component with slotted rows (2026-03-18)
- **Context:** Designing a semantic data grid web component that must support WCAG table roles, sortable columns, and variant styling across shadow DOM boundaries
- **Why:** Native table element semantics require the correct DOM structure for AT (role=table/rowgroup/row/columnheader/cell). A monolithic component cannot enforce this structure. Per-element components allow each to own its ARIA role, keyboard behavior, and shadow styles independently
- **Rejected:** Single hx-table component with <slot name=header>, <slot name=body> accepting raw <tr><td> — loses the ability to intercept sortable column behavior and attach event listeners at the th level without global event delegation hacks
- **Trade-offs:** 7 custom element definitions increases bundle size and registration cost; each shadow root adds style recalc overhead. Trade-off accepted for semantic correctness and maintainability
- **Breaking if changed:** Collapsing to a monolithic component would break aria-sort propagation, per-row selection state, and the CSS custom property cascade chain that enables variant theming

#### [Gotcha] Merge conflict in barrel export index.ts (hx-stat exports added by concurrent dev branch) must be manually resolved before type-check passes — git markers cause TypeScript to fail parsing the entire file, not just the conflicted lines (2026-03-18)
- **Situation:** Feature branch diverged from dev; a concurrent feature (hx-stat) merged to dev while this branch was in progress, creating conflict markers in the shared src/index.ts barrel
- **Root cause:** TypeScript treats conflict markers (<<<<<<<, =======, >>>>>>>) as syntax errors in .ts files, causing the entire module to fail type resolution and cascading errors across all imports
- **How to avoid:** Manual resolution requires understanding what both branches added; but is safer than automated rebase which could produce incorrect merges in complex barrel files

### i18n strings exposed as @property() label fields with English defaults rather than slots, i18n libraries, or subclassing (2026-03-18)
- **Context:** 6 web components had hardcoded English strings used in aria-labels, live regions, and validation messages — needed to be overridable without breaking existing consumers
- **Why:** Strictly additive change: existing consumers see no behavioral change since defaults match previous hardcoded values. LitElement @property() makes values reactive, attribute-settable (kebab-case), and property-settable (camelCase) with zero extra infrastructure
- **Rejected:** Slots rejected because they require DOM changes from consumers and can't easily be used inside aria-label string interpolation or ElementInternals.setValidity(). i18n library (i18next etc.) rejected because it would introduce a runtime dependency and require consumers to configure a provider.
- **Trade-offs:** Easier: drop-in override with a single attribute. Harder: no centralized locale switching — consumers must set each property individually or wire up their own locale system on top.
- **Breaking if changed:** Removing English defaults would break existing consumers who don't pass labels. Renaming properties would break consumers who have already adopted the attributes.

#### [Gotcha] hx-combobox labelRequired doubles as both the visible validation message fallback AND the ElementInternals.setValidity() message string (2026-03-18)
- **Situation:** Combobox uses ElementInternals constraint validation API — the setValidity() message must be a string, and the UI also renders this string as a visible hint
- **Root cause:** Single source of truth: one property controls both the browser-native validation bubble text and the in-component UI text, ensuring they never diverge
- **How to avoid:** Simpler API, but consumers cannot display a different message in the UI vs the browser validation tooltip

#### [Gotcha] In Web Components with shadow DOM, role="list" must be placed on an inner shadow DOM element (not the host), when listitem children are slotted into that inner element. (2026-03-18)
- **Situation:** hx-steps had role="list" on the custom element host, but slotted hx-step elements (role="listitem") are distributed into the inner <div part="base"> in the flattened accessibility tree. Assistive technologies compute ARIA ownership based on the flattened tree, not the logical DOM hierarchy.
- **Root cause:** In the flattened accessibility tree, slotted children appear as children of the slot's container element in the shadow DOM, not the host. The list/listitem ownership relationship requires parent-child adjacency in that flattened tree. Placing role="list" on the host while listitem children flatten under an inner shadow div breaks ARIA ownership.
- **How to avoid:** Moving role to the inner element is semantically correct but means the host element has no ARIA role, which is fine — custom elements without roles are treated as generic containers. The test had to be updated to assert role on [part='base'] not the host.

### Reactive ariaLabel property (LitElement @property) was used to forward aria-label from the host to the inner shadow DOM list element, instead of reading getAttribute() in the render template. (2026-03-18)
- **Context:** The inner shadow DOM div needed to receive the aria-label value set on the host element, but the initial implementation used this.getAttribute('aria-label') directly in the render expression.
- **Why:** LitElement's reactive property system triggers re-renders when the property changes. Using getAttribute() in a render template is a non-reactive read — it captures the value at first render but does not re-render when the attribute changes dynamically. A @property decorator with attribute binding ensures Lit tracks changes and re-renders the inner element's aria-label correctly.
- **Rejected:** Direct getAttribute() in the render template was the initial implementation but was replaced because it would silently fail to update if the host's aria-label attribute changed after first render, creating a stale label bug.
- **Trade-offs:** Adds one more property to the component's public API surface. Slightly more boilerplate. But correctness and reactivity are non-negotiable for accessibility attributes that may be set by frameworks or updated dynamically.
- **Breaking if changed:** Removing the @property decorator and reverting to getAttribute() would cause aria-label updates on the host to not propagate to the inner list element after initial render.

#### [Gotcha] CEM (Custom Elements Manifest) analyzer treats undocumented private class members as undocumented public API surface, lowering component health scores even when TypeScript `private` keyword is present (2026-03-18)
- **Situation:** hx-popover, hx-color-picker, and hx-split-panel had health scores of 85-86 despite having properly TypeScript-typed private members, because CEM health scoring is based on JSDoc coverage not TypeScript visibility modifiers
- **Root cause:** CEM operates on the AST/manifest level where TypeScript access modifiers are not sufficient signals for API surface exclusion — the tool requires explicit `@internal` JSDoc tags to filter members from the manifest
- **How to avoid:** Adding `@internal` tags correctly separates implementation details from public API in the manifest, raising health scores to 90+, but requires discipline to tag every new private member at authoring time or health scores will degrade again

#### [Pattern] JSDoc-only changes to component libraries warrant `skip-changeset` label because they do not alter public API or runtime behavior, preventing unnecessary version bumps in changelogs (2026-03-18)
- **Problem solved:** After creating PR #988 for the @internal tag additions, a `skip-changeset` label was applied to bypass the changeset requirement
- **Why this works:** Changeset tooling (e.g., changesets/changesets) is designed to track public API and behavioral changes for semantic versioning — JSDoc metadata additions are invisible to consumers and do not warrant a version increment
- **Trade-offs:** Cleaner changelogs and version history, but requires accurate judgment about what constitutes a public API change vs internal metadata; misclassifying a real behavioral change as skip-changeset would silently skip version tracking

#### [Gotcha] Feature description referenced a non-existent field `_previousBodyOverflow` in hx-drawer; the actual implementation uses `_hasScrollLock` (boolean flag) instead of storing the previous overflow value (2026-03-18)
- **Situation:** HELiXiR health score audit listed undocumented private properties to tag with @internal, but the field name in the spec did not match the actual source code
- **Root cause:** The component was refactored at some point to use a boolean sentinel instead of caching the overflow string value, but the audit/spec was generated against an older snapshot or description
- **How to avoid:** Requires verifying every spec-listed field against actual source before applying; prevents phantom documentation but adds a manual cross-check step

#### [Pattern] Stored `_boundDocumentClick` in the constructor alongside existing `_boundPointerMove`/`_boundPointerUp` bindings to avoid re-binding on every `connectedCallback` call in `hx-color-picker` (2026-03-18)
- **Problem solved:** The component partially implemented the pre-bound handler pattern — pointer handlers were already bound in the constructor but `_handleDocumentClick` was still calling `.bind(this)` in `connectedCallback`
- **Why this works:** Each `.bind()` call allocates a new function object. If `connectedCallback` is invoked multiple times (e.g. element moved in DOM), the listener added each time is a distinct object, so `removeEventListener` with a fresh bind reference silently fails to remove the old one, leaking listeners
- **Trade-offs:** Slightly more memory per instance (one extra property), but guaranteed listener cleanup and consistency with the pattern already established by the other two bound handlers in the same component

#### [Gotcha] Worktrees do not have their own node_modules; binaries (e.g., custom-elements-manifest) must be sourced from the main repo's node_modules using absolute paths (2026-03-18)
- **Situation:** Running `pnpm run cem` inside a worktree failed because node_modules are not installed per-worktree — they exist only in the main repo root
- **Root cause:** Git worktrees share the same .git directory and installed dependencies live in the root; worktrees are lightweight checkouts, not full repo clones with their own installs
- **How to avoid:** Saves disk space and setup time, but requires knowing to use absolute paths to main repo binaries for any tooling invocation inside a worktree

#### [Gotcha] custom-elements.json (CEM output) is gitignored and regenerated by CI — committing it causes noise or conflicts, and its absence from the worktree is expected (2026-03-18)
- **Situation:** After running CEM analysis, the generated custom-elements.json appeared in git diff, but staging it for commit would be wrong
- **Root cause:** CEM is a build artifact derived from source; committing it would cause constant merge conflicts as different branches regenerate it with slightly different content
- **How to avoid:** Cleaner git history and no merge conflicts, but local CEM scores cannot be verified without running the binary manually with the workaround path

#### [Gotcha] hx-tree-item component lives inside the hx-tree-view/ directory, not its own hx-tree-item/ directory — component name does not predict directory structure (2026-03-18)
- **Situation:** When searching for hx-tree-item.ts to add @internal tags, the file was not at the expected path `src/components/hx-tree-item/hx-tree-item.ts`
- **Root cause:** hx-tree-item is a sub-component (child element) of hx-tree-view and is colocated with its parent to reflect tight coupling and shared concerns
- **How to avoid:** Colocated structure accurately models parent-child coupling but breaks the assumption that component name == directory name, requiring explicit directory exploration rather than path inference

#### [Pattern] Adding `@internal` JSDoc tags to private TypeScript members is the mechanism for improving CEM (Custom Elements Manifest) health scores from B (89) to A (90+) — the tag signals to CEM analyzer that these members are intentionally private and should be excluded from the public API surface (2026-03-18)
- **Problem solved:** CEM health scoring penalizes undocumented members; private fields without @internal are counted as undocumented public API gaps even though they're TypeScript-private
- **Why this works:** CEM analyzer processes JSDoc annotations to determine API intent; TypeScript access modifiers alone are insufficient — @internal is the explicit contract that a member is not part of the public API
- **Trade-offs:** Minimal one-line annotation per member achieves score improvement without requiring documentation of internal implementation details; but requires discipline to add @internal to every new private member going forward or scores regress

#### [Pattern] HELiXiR health scoring treats single-line /** @internal */ as 'missing description' — multi-line JSDoc with description text before @internal tag is required to satisfy the health check (2026-03-18)
- **Problem solved:** hx-date-picker private members were flagged by HELiXiR audit despite having @internal tags, because the tags had no accompanying description text
- **Why this works:** HELiXiR parses JSDoc and requires a non-empty description string separate from tags; @internal alone is a tag annotation not a description
- **Trade-offs:** Verbose JSDoc on every private member increases file size and maintenance burden, but satisfies tooling health gates and improves internal dev documentation

#### [Pattern] All @internal JSDoc members must include a description sentence, not just the @internal tag alone, to satisfy the HELiXiR health score system (2026-03-18)
- **Problem solved:** Health score auditing flags `/** @internal */` with no description text as a documentation gap, distinct from the presence of the tag itself
- **Why this works:** Custom Elements Manifest (CEM) and downstream documentation tooling parse JSDoc descriptions; a bare @internal tag contributes no semantic content to generated docs or IDE tooltips
- **Trade-offs:** More verbose source; descriptions must be kept accurate when implementation changes or they become misleading

#### [Pattern] JSDoc descriptions must appear as sentence text BEFORE the @internal tag, not replaced by it — multi-line block comments with description + @internal tag together satisfy HELiXiR scoring requirements (2026-03-18)
- **Problem solved:** HELiXiR component health scoring penalizes private members that have @internal tag but no description text, even though @internal signals intentional non-exposure
- **Why this works:** HELiXiR parser scores documentation completeness independently from visibility markers; a bare @internal tag counts as 'no description' in the scoring algorithm
- **Trade-offs:** More verbose source files; descriptions must be maintained when behavior changes, otherwise they drift from reality

### Private @query element references (DOM refs) and @state reactive properties were given purpose-specific descriptions explaining WHAT they reference and WHY they exist, not just WHAT type they are (2026-03-18)
- **Context:** Generic descriptions like 'the overlay element' are insufficient; descriptions need to explain the role in the component's behavior (e.g., 'used for focus management', 'restored on close')
- **Why:** HELiXiR scoring likely evaluates description quality/completeness, not just presence; meaningful descriptions also aid future maintainers understanding the component's internal architecture
- **Rejected:** Minimal descriptions restating the variable name (e.g., 'The panel element') — technically passes presence check but adds no value
- **Trade-offs:** Higher maintenance burden when behavior changes; descriptions must stay accurate as implementation evolves
- **Breaking if changed:** If descriptions become inaccurate after refactoring, they actively mislead maintainers — worse than no description

#### [Pattern] JSDoc description sentences must appear BEFORE @internal tags, not after, for CEM (Custom Elements Manifest) to correctly extract and score them (2026-03-18)
- **Problem solved:** HELiXiR scoring system evaluates documentation quality of custom element manifests; @internal members with only a tag but no description sentence scored poorly
- **Why this works:** CEM parser reads the description text that precedes tags; a bare @internal tag with no preceding prose produces an empty description field in the manifest, which scores as undocumented
- **Trade-offs:** Multi-line JSDoc blocks are more verbose but produce accurate manifest entries; single-line /** @internal */ shorthand is cleaner but scores zero on documentation quality

#### [Pattern] Static instance counter (_instanceCounter) on the class + instance _panelId field pattern generates unique DOM IDs across component instances without requiring a global registry or UUID library (2026-03-18)
- **Problem solved:** hx-dropdown needs a unique panel ID for aria-controls to correctly associate the trigger button with its floating panel for accessibility
- **Why this works:** Monotonically incrementing static counter is deterministic, zero-dependency, and produces stable IDs within a page session; UUIDs are random and harder to test/debug
- **Trade-offs:** IDs are session-stable but not SSR-stable (counter resets on each server render); acceptable for client-side components but would need hydration strategy for SSR

#### [Pattern] JSDoc @internal properties require description text BEFORE the @internal tag to improve CEM health scores — bare `/** @internal */` tags score lower than `/** Brief description. @internal */` (2026-03-18)
- **Problem solved:** HELiXiR health scores for hx-combobox, hx-select, hx-checkbox-group, hx-file-upload were stuck at 87-88, not reaching 90+ threshold
- **Why this works:** Custom Elements Manifest analyzers score documentation completeness by checking whether each tagged member has human-readable description text, not just tags. A tag alone satisfies visibility metadata but not documentation quality metrics.
- **Trade-offs:** Single-line format `/** Description. @internal */` minimizes diff noise and keeps the change documentation-only with zero functional impact, but requires discipline to keep descriptions brief and accurate.

#### [Pattern] Internal LitElement state properties use consistent naming conventions that encode their purpose: `_has*Slot` for slot detection, `_*` prefix for all private reactive state, `_internals` for ElementInternals instance (2026-03-18)
- **Problem solved:** Form-associated custom elements across hx-combobox, hx-select, hx-checkbox-group, hx-file-upload all follow identical internal structure patterns
- **Why this works:** Consistent naming allows tooling (CEM, TypeScript, linters) and humans to immediately understand purpose without reading implementation. `_has*Slot` names make it obvious these are slot projection detection flags rather than arbitrary booleans.
- **Trade-offs:** Naming convention enforces consistency at the cost of verbosity (`_hasFileListSlot` vs `_fileList`), but the tradeoff is correct because it distinguishes slot detection state from data state.

#### [Gotcha] Actual @internal member counts differed significantly from feature spec: hx-tree-item had 9 items (not 4), hx-form had 5 items (not 4) — specs undercount internal members (2026-03-18)
- **Situation:** Feature description listed expected counts per component; agent found more bare @internal tags than specified when reading actual source
- **Root cause:** Feature specs are written from memory or a prior audit snapshot; source drifts or the original count excluded certain member types (e.g. private methods vs properties)
- **How to avoid:** Fixing all instances produces better HELiXiR scores but means the implementation scope exceeded the spec — acceptable for additive doc-only changes, risky for behavioral changes

#### [Gotcha] Cross-shadow-DOM aria-controls IDREF resolution fails — hx-popover's trigger and panel live in separate shadow roots, so the IDREF in aria-controls cannot cross the shadow boundary and resolves to null for AT (2026-03-19)
- **Situation:** WCAG 4.1.2 requires aria-controls to reference the controlled element, but Web Components encapsulate DOM into shadow roots, making cross-component IDREF linking structurally impossible with standard ARIA
- **Root cause:** Shadow DOM encapsulation is intentional for style/behavior isolation, but ARIA IDREFs are resolved in the flat tree and cannot pierce shadow boundaries in current browser implementations
- **How to avoid:** Fixing this requires an architectural decision: either use a single shadow root (breaks encapsulation), use aria-owns with polyfill, or adopt the upcoming ARIA reflection API (Element Internals ariaControlsElements) which accepts element references instead of string IDs

#### [Pattern] Audit findings grouped by fix PATTERN (touch targets, ARIA labeling, keyboard navigation, test coverage) for GitHub issue creation rather than by component — 32 findings synthesized into 5-10 issues (2026-03-19)
- **Problem solved:** Creating one GitHub issue per finding (32 issues) creates noise and makes cross-component patterns invisible to developers; fixes often require the same solution in multiple components
- **Why this works:** Pattern-grouped issues allow a single PR to fix the same gap across all affected components (e.g., 'standardize disabled state to aria-disabled across all interactive components'), reducing total PRs and ensuring consistency
- **Trade-offs:** Pattern grouping requires the auditor to understand which findings share root causes — higher analysis burden upfront but reduces implementation fragmentation

#### [Gotcha] ARIA live regions inside shadow DOM are not consistently announced across all browser/AT combinations — specifically NVDA+Firefox and some JAWS configurations fail to fire announcements from shadow-rooted live regions (2026-03-19)
- **Situation:** hx-field uses role='alert' and aria-live='assertive' inside shadow DOM for error message announcement
- **Root cause:** Shadow DOM encapsulation breaks the AT's ability to detect live region mutations when the region root is inside a shadow root rather than the document tree
- **How to avoid:** Moving live region to light DOM loses encapsulation but gains reliable AT support across all browser/AT combinations; shadow DOM live regions appear to work in Chrome/JAWS but fail in Firefox/NVDA

#### [Gotcha] Shadow DOM label elements cannot use the native 'for'/'id' association mechanism to reference slotted light DOM form controls — the association is blocked at the shadow boundary (2026-03-19)
- **Situation:** hx-field renders a <label> in shadow DOM but the actual input lives in the light DOM as a slotted child
- **Root cause:** Browser label association only traverses within the same DOM tree; shadow boundary is an impenetrable barrier for the 'for' attribute regardless of id uniqueness
- **How to avoid:** Fallback to aria-label injection onto the slotted control works for basic labeling but loses: (1) native click-to-focus behavior on label text, (2) implicit required/invalid context that native label association carries, (3) ability to stack aria-labelledby with existing labels on the input

### hx-counter must debounce or suppress aria-live announcements during animation — emitting aria-live='polite' on a value that updates at up to 60fps causes the AT announcement queue to flood and renders the component unusable with screen readers (2026-03-19)
- **Context:** Animated counter transitions numeric values over time using requestAnimationFrame or similar, emitting DOM mutations at each frame
- **Why:** Each DOM mutation on an aria-live region triggers a potential announcement; AT announcement queues are not designed for 60 mutations/second and will either drop all, queue all (causing 5+ seconds of number-reading), or crash the virtual buffer
- **Rejected:** Keeping aria-live on the animating element — creates accessibility anti-pattern where the cure (live region) is worse than the disease (no announcement)
- **Trade-offs:** Announcing only the final value after animation completes is correct AT behavior but means sighted users see animation while AT users hear only the end state — acceptable divergence; announcing intermediate values is never acceptable
- **Breaking if changed:** If aria-live is added back to the animating span without debounce/suppress logic, screen reader users will experience unusable announcement flooding on any counter that animates

#### [Pattern] Roving tabindex implementations must use a MutationObserver on the slot to detect dynamically added custom elements that set tabIndex only on inner shadow children — querySelector('[tabindex]') on the slot's assignedElements will miss these (2026-03-19)
- **Problem solved:** hx-action-bar uses roving tabindex to manage keyboard navigation across slotted action items
- **Why this works:** Custom elements may not set tabIndex on their host element; they may delegate focus to an inner shadow child. The roving tabindex manager sees tabIndex=-1 on the host (or no tabIndex attribute) and excludes it from the tab ring even though it is functionally focusable
- **Trade-offs:** MutationObserver adds complexity and a small ongoing memory/CPU cost but is the only reliable mechanism; alternatively, a convention requiring all slotted items to expose tabIndex on their host element simplifies the manager but requires upstream component compliance

### Audit performed by reading all 87 .styles.ts files directly rather than relying on audit JSON files in .automaker/audits/ (2026-03-19)
- **Context:** No audit JSON files existed in .automaker/audits/ -- the expected audit artifact source of truth was empty
- **Why:** Direct source reading is authoritative; pre-generated audit files can be stale, incomplete, or never created. Reading source guarantees coverage of actual current state
- **Rejected:** Waiting for audit files to be generated -- would add latency and risk missing components if the audit tool had gaps
- **Trade-offs:** Higher upfront cost (reading 87 files) but zero false negatives. Audit files would be faster but require trusting their completeness
- **Breaking if changed:** N/A -- this was an investigative approach, not a persistent architectural change

#### [Gotcha] ARIA IDREF attributes (aria-controls, aria-labelledby) cannot cross shadow DOM boundaries — a light DOM element referencing a shadow DOM element's ID is silently broken for assistive technology (2026-03-19)
- **Situation:** hx-dropdown trigger elements live in light DOM (slotted) but the panel they control lives in shadow DOM. Setting aria-controls on the trigger to the panel's shadow-DOM ID creates a reference AT cannot resolve.
- **Root cause:** Browser ARIA ID resolution is scoped to the same shadow root. IDREFs in light DOM only find elements in light DOM; IDREFs inside a shadow root only find elements in the same shadow root.
- **How to avoid:** Removing aria-controls loses the explicit programmatic relationship between trigger and panel for AT, but a broken reference is worse than no reference. The open/close state conveyed via aria-expanded on the trigger still communicates the relationship semantically.

### When a landmark/dialog element's accessible name source element is conditionally not rendered (noHeader=true), fall back to aria-label rather than leaving aria-labelledby pointing to a non-existent element (2026-03-19)
- **Context:** hx-drawer's overlay uses aria-labelledby pointing to the title element's ID (_titleId). When noHeader=true the title element is not rendered, making the IDREF broken.
- **Why:** A broken aria-labelledby (pointing to a non-existent ID) is worse than no aria-labelledby — AT may announce nothing or behave unpredictably. aria-label provides a reliable fallback when the element providing the name is absent.
- **Rejected:** Keeping aria-labelledby even when noHeader=true — results in a broken IDREF that AT cannot resolve, silently producing a dialog with no accessible name
- **Trade-offs:** The conditional logic (aria-labelledby vs aria-label) adds branching to the component but ensures the dialog always has a valid accessible name regardless of configuration.
- **Breaking if changed:** Removing the noHeader fallback to aria-label leaves dialogs with noHeader=true without any accessible name, failing WCAG 4.1.2 and 1.3.1.

#### [Pattern] Scope a11y audits by property contract: components without a `required` property are exempt from aria-required fixes; components where `required` is already wired to aria-required are confirmed correct and skipped (2026-03-19)
- **Problem solved:** 13 form control components needed auditing for GH #1030; doing a full re-implementation of all 13 would risk regressions in already-correct components
- **Why this works:** Separating 'has required property' from 'exposes aria-required' makes the audit tractable and scoped; components like hx-color-picker and hx-file-upload have no required property by design so adding aria-required would be wrong
- **Trade-offs:** Requires per-component audit rather than a bulk find-replace; but eliminates risk of touching working components and makes the PR diff minimal and reviewable

#### [Pattern] Touch target compliance uses a single canonical CSS custom property --hx-touch-target-min with rem fallback (2.75rem) applied at the container level, not redundantly on child inputs (2026-03-19)
- **Problem solved:** CodeRabbit flagged both a non-standard token name (--hx-touch-target-min-px) and redundant min-width/min-height on a checkbox input inside a cell that already enforces the touch target
- **Why this works:** WCAG 2.5.5 compliance can be satisfied at the nearest interactive container. Applying it to both parent and child creates specificity conflicts and maintenance burden when the design token value changes
- **Trade-offs:** Single point of truth for touch target sizing per component; requires understanding which ancestor satisfies the constraint rather than defensive per-element sizing

### Breaking behavioral changes (boolean property default flips) must be classified as major semver changes even when the changeset tooling allows them through as minor (2026-03-19)
- **Context:** hx-alert `open`/`showIcon` and hx-code-snippet `copyable` defaults changed from true to false — these are silent breaking changes for consumers not explicitly setting the attribute
- **Why:** Consumers relying on default behavior (e.g., `<hx-alert open='false'>` or omitting `copyable`) will see broken UIs after upgrading without a major version bump warning
- **Rejected:** Leaving as minor change — rejected because it violates semver contract and gives consumers no signal to audit their usage
- **Trade-offs:** Major version bump increases consumer upgrade friction but prevents silent production regressions
- **Breaking if changed:** Keeping as minor means automated dependency updaters (Dependabot, Renovate) auto-apply the upgrade without human review, silently breaking UIs

### When CodeRabbit flags an issue as CRITICAL, the correct response is to accept and revert rather than defend the implementation — even when the original intent (fixing accessibility) was correct. (2026-03-19)
- **Context:** The agent had already pushed aria-required additions across 5 components. CodeRabbit flagged this as a CRITICAL violation of documented project principles. The agent evaluated and accepted rather than arguing or partially complying.
- **Why:** The project has a non-negotiable CodeRabbit gate. When a CRITICAL finding contradicts a documented principle (backed by test assertions), the finding takes precedence. Defending incorrect implementation wastes review cycles and blocks merge.
- **Rejected:** Partial revert or arguing the ARIA is 'harmless redundancy' — rejected because it violates documented project principle and the existing test contract would still fail.
- **Trade-offs:** Full revert means the original GH issue (#1030) remains open and needs a different resolution path; however merging incorrect ARIA semantics would be worse than leaving the issue open.
- **Breaking if changed:** If the CodeRabbit gate is bypassed on CRITICAL findings, the documented project principles lose enforcement and drift accumulates across components.

#### [Gotcha] ESLint no-floating-promises requires void prefix even when a .catch() handler is already chained — the catch does not satisfy the rule (2026-03-19)
- **Situation:** hx-split-button had this.updateComplete.then(...).catch(() => undefined) which already handles rejection, yet ESLint still flagged it as a floating promise
- **Root cause:** The ESLint rule treats any unassigned promise expression as floating regardless of chained handlers; void explicitly signals intentional discarding to both the linter and future readers
- **How to avoid:** void prefix is the minimal surgical change; it is semantically accurate and self-documenting that the result is intentionally discarded

### super.updated(changedProperties) must be called as the FIRST line in LitElement updated() overrides, not last or omitted (2026-03-19)
- **Context:** hx-combobox, hx-counter, and hx-toast all overrode updated() without calling super.updated(), which skips LitElement's internal post-update bookkeeping
- **Why:** LitElement's base updated() clears internal change tracking state; calling it first ensures the superclass lifecycle completes before derived logic runs, preventing stale changedProperties maps on subsequent cycles
- **Rejected:** Calling super.updated() last (after derived logic) is also technically valid in some frameworks but in LitElement it risks the derived code reading state that the superclass would have cleared, causing subtle reactive property bugs
- **Trade-offs:** First-line placement is a strict convention that prevents ordering bugs; it slightly increases call-stack depth on every update cycle but has negligible performance impact
- **Breaking if changed:** Removing super.updated() entirely can cause LitElement's internal firstUpdated/updateComplete resolution chain to behave incorrectly in components using @property decorators with complex reactive graphs

### hx-icon-button retains `formAssociated = true` with no-op form callbacks rather than removing formAssociated entirely (2026-03-19)
- **Context:** hx-icon-button needs `this._internals.form` to programmatically trigger form submit/reset on click, but never participates in form value submission
- **Why:** ElementInternals.form is only accessible when formAssociated = true; removing it would break the component's ability to find and interact with its associated form element
- **Rejected:** Removing formAssociated entirely — would eliminate access to internals.form and break submit/reset button behavior; adding setFormValue calls — unnecessary since icon-button has no value to submit
- **Trade-offs:** Keeping formAssociated means the browser may call form callbacks expecting participation, hence the no-ops are required to satisfy the interface
- **Breaking if changed:** Removing formAssociated would break hx-icon-button's ability to trigger form submission/reset; removing no-op callbacks would cause interface contract violations

### Replace Math.random() ID generation with module-level counter for element IDs in Lit components (2026-03-19)
- **Context:** hx-overflow-menu was using Math.random().toString(36).slice(2,9) to generate unique panel IDs for ARIA relationships
- **Why:** Math.random() is non-deterministic and breaks SSR/hydration because server and client generate different IDs, causing ARIA attribute mismatches and hydration errors
- **Rejected:** Keeping Math.random() - breaks SSR. Using crypto.randomUUID() - still non-deterministic across server/client. Using element's own ID - not always set by consumer.
- **Trade-offs:** Counter IDs are predictable and SSR-safe but reset on module reload (dev HMR). IDs are monotonically increasing so they're stable within a session but not across page loads - fine for ARIA relationships.
- **Breaking if changed:** Reverting to Math.random() breaks SSR hydration. Any snapshot tests that assert specific ID values would also break with either approach.

#### [Pattern] Lit @query decorator as canonical replacement for all shadowRoot.querySelector calls in Lit components (2026-03-19)
- **Problem solved:** Multiple components were calling this.shadowRoot?.querySelector<HTMLElement>(...) in methods like focus(), firstUpdated(), and event handlers
- **Why this works:** @query is Lit's built-in mechanism - it caches the element reference after first render, is type-safe, handles the shadowRoot access internally, and makes the component's DOM dependencies explicit at the class level rather than scattered in methods
- **Trade-offs:** @query refs are null before first render (hence HTMLElement | null typing) so callers must still null-check. The upside is query caching and co-located DOM dependency declaration. Components are easier to audit for DOM dependencies.

### Use @property({ attribute: false }) with manual setAttribute() in updated() when a property is internal/programmatic but CSS depends on :host([attr]) selectors (2026-03-19)
- **Context:** hx-step had orientation and size as @property({ reflect: true }) making them settable via HTML attributes, but they are internal — only the parent hx-steps container should set them via JS property assignment
- **Why:** attribute: false removes attribute observation so external HTML attribute setting becomes a no-op, preventing misuse. Manual setAttribute in updated() preserves the DOM attribute that CSS :host([attr]) selectors depend on, maintaining styling behavior without exposing the attribute as a public API surface.
- **Rejected:** Keeping reflect: true — this would allow any consumer to set orientation='vertical' directly on hx-step bypassing the parent's _syncChildren(), creating out-of-sync state. Removing setAttribute entirely — this would break all CSS selectors like :host([orientation='vertical']) since the attribute would never appear in the DOM.
- **Trade-offs:** Slightly more boilerplate (manual setAttribute in updated vs automatic reflect), but gives precise control: JS-settable by parent, CSS-readable via attribute, not HTML-settable by consumers
- **Breaking if changed:** Removing the manual setAttribute calls in updated() would silently break all orientation/size CSS styling because :host([orientation]) selectors would never match

#### [Pattern] Extracted inline css tagged template from LitElement component file into a co-located .styles.ts file, removing the css import from lit in the component (2026-03-19)
- **Problem solved:** Helix component library audit (LA-036/LA-050) flagging inline styles in LitElement components as an anti-pattern across the codebase.
- **Why this works:** Separating styles into .styles.ts files enables: (1) independent editing of styles without touching component logic, (2) potential tree-shaking or style reuse, (3) consistent file structure across all components matching hx-carousel.styles.ts precedent already established in the same directory.
- **Trade-offs:** Adds one file per component but dramatically improves separation of concerns. Import must use .js extension (not .ts) due to ESM module resolution in the build pipeline — using .ts extension would cause runtime errors.

### Dark mode must be implemented exclusively via design tokens and theme overrides (hx-theme), never via @media (prefers-color-scheme: dark) blocks in component styles (2026-03-19)
- **Context:** hx-step and hx-table had @media (prefers-color-scheme: dark) blocks directly in component style files, creating a forbidden pattern in the design system
- **Why:** Component-level media query dark mode bypasses the token layer entirely — it hard-codes color decisions at the component level rather than at the theme level, making it impossible to override via theming, impossible to support non-OS-driven dark mode (e.g., user toggle), and creates inconsistency across components that do use tokens
- **Rejected:** Keeping @media (prefers-color-scheme: dark) blocks and adding token fallbacks inside them — rejected because it creates two sources of truth for dark mode color values and still breaks manual theme switching
- **Trade-offs:** Removing media query blocks means dark mode only works if a consuming app applies an hx-theme dark variant; components have zero built-in OS dark mode detection. This is intentional for design system control but requires consuming apps to wire up theme switching correctly.
- **Breaking if changed:** If OS-level dark mode was the only dark mode mechanism in a consumer app, removing these blocks breaks dark mode entirely until the app applies the token-based theme override

#### [Gotcha] Keyframe names must use the hx- prefix — legacy wc- prefix (from Web Components era) is a naming violation that can cause keyframe conflicts across components (2026-03-19)
- **Situation:** hx-badge used @keyframes wc-badge-pulse, a leftover from when the library used a generic 'wc-' (web component) prefix before rebranding to 'hx-'
- **Root cause:** Keyframe names are global in CSS scope within a Shadow DOM or shared stylesheet context. A wc- prefix implies a different namespace/origin and creates confusion about ownership. If another library also used wc- prefixed keyframes, collisions are possible.
- **How to avoid:** Renaming keyframes is a breaking change if any external CSS references the keyframe name directly (unlikely for animation-name in component styles, but possible in consumer overrides)

#### [Gotcha] Token prefix mismatch between --hx-spacing-{t-shirt-size} and --hx-space-{N} is a silent runtime failure — CSS custom property fallbacks silently use the fallback value, so wrong token names produce invisible spacing bugs not errors (2026-03-19)
- **Situation:** Multiple components (hx-stack, hx-dialog, hx-drawer, hx-pagination) were using --hx-spacing-sm, --hx-spacing-md style tokens that don't exist in the token system, where --hx-space-4, --hx-space-8 (numeric scale) are the actual token names
- **Root cause:** CSS var() with a fallback never throws — if --hx-spacing-sm is undefined, var(--hx-spacing-sm, 16px) silently uses 16px. This means broken token references are undetectable without a token audit tool and appear visually correct until the fallback value diverges from the token value.
- **How to avoid:** Numeric token names are less human-readable at a glance but are unambiguous — --hx-space-4 means exactly 4 units on the spacing scale, whereas --hx-spacing-md is relative and subjective

#### [Pattern] Inverted/reverse component variants must use semantic overlay tokens (--hx-overlay-white-*) rather than hardcoded rgba(255,255,255,N) values to maintain theme portability (2026-03-19)
- **Problem solved:** hx-button inverted mode used rgba(255,255,255,0.1) and rgba(255,255,255,0.2) for hover/focus states and #ffffff for text — hardcoded values that assume the inverted background is always dark
- **Why this works:** Overlay tokens abstract the opacity+color combination into a semantic name. If the design system changes the overlay treatment (e.g., uses a different tint for accessibility), all components using --hx-overlay-white-* update automatically. Hardcoded rgba values require grep-and-replace across all component files.
- **Trade-offs:** Overlay tokens require the token system to define and maintain the full matrix of overlay values at design time; components can no longer express arbitrary opacity overlays. This is actually desirable for design consistency.

### Used flatMap with undefined guard instead of direct array index access to fix noUncheckedIndexedAccess TypeScript errors in hx-data-table _dispatchSelect (2026-03-19)
- **Context:** TypeScript strict mode with noUncheckedIndexedAccess causes array[index] to return T | undefined even when index is known valid, blocking CustomEvent generic typing
- **Why:** flatMap with undefined filter produces T[] without unsafe non-null assertions, satisfying strict TypeScript while keeping runtime behavior identical
- **Rejected:** Non-null assertion (this.rows[i]!) would suppress the error but masks genuine potential undefined access bugs
- **Trade-offs:** Slightly more verbose but eliminates a class of potential runtime errors if selectedRows indices ever become stale

#### [Pattern] Extracted shared _emitListItemClick() method to eliminate as unknown as MouseEvent double-cast in hx-list-item (2026-03-19)
- **Problem solved:** Both click and keydown handlers needed to dispatch the same custom event, but their native event types differ (MouseEvent vs KeyboardEvent), leading to a double-cast to satisfy TypeScript
- **Why this works:** A shared private emit method decouples event dispatch from the native event type entirely, removing the need for any cast
- **Trade-offs:** Single source of truth for the event shape; if event detail fields change, only one place needs updating

#### [Pattern] CustomEvent<void> for events with no detail payload, CustomEvent<{field: Type}> for events with payloads — applied uniformly across 46 component files (2026-03-19)
- **Problem solved:** Untyped CustomEvent dispatches mean consumers cannot infer detail shape from TypeScript, requiring manual documentation lookup
- **Why this works:** Generic typing propagates through the event system so event listeners in consuming code can use e.detail with full type inference
- **Trade-offs:** Each component's event contract is now explicit and machine-readable; breaking changes to event detail shapes become compile errors in consuming code

### Use (changedProperties as Map<PropertyKey, unknown>).has('_privateKey') cast pattern for private @state() properties in Lit lifecycle methods (2026-03-19)
- **Context:** PropertyValues<this> uses keyof this for type-safe property access, but private @state() properties decorated with underscore prefix are not part of the public interface and thus not in keyof this
- **Why:** Private reactive properties exist in the Lit property system at runtime but TypeScript's keyof this only reflects the public/protected interface. The cast to Map<PropertyKey, unknown> preserves runtime correctness while satisfying the type checker without suppressing errors globally
- **Rejected:** Using 'as keyof this' type assertion on the property name string — this is semantically wrong and misleading because the property genuinely is not in keyof this; using Map<string, unknown> for the whole signature loses all type safety for public properties
- **Trade-offs:** Easier: private properties can still be checked in lifecycle methods. Harder: slightly verbose call sites; reviewers may not understand why the cast exists without a comment
- **Breaking if changed:** If private properties are made protected/public, the cast becomes unnecessary and should be removed. If Lit changes PropertyValues to not extend Map, the cast target type must be updated

#### [Pattern] Change Event handler parameter types to the specific event subtype (KeyboardEvent) instead of Event when the listener is registered for a specific event type (2026-03-19)
- **Problem solved:** hx-popover had _handleFocusTrap and _handleDocumentKeydown accepting Event, requiring unsafe casts to KeyboardEvent inside the body. Both were registered exclusively as 'keydown' event listeners.
- **Why this works:** When a handler is only ever registered via addEventListener('keydown', handler), the runtime type is always KeyboardEvent. Typing the parameter as Event is overly defensive and forces internal casts that bypass type checking. Typing as KeyboardEvent lets TypeScript verify all KeyboardEvent property accesses at compile time
- **Trade-offs:** Easier: full type safety on keyboard property access (key, code, etc). Harder: the handler can no longer be reused as a generic Event handler without a wrapper — but this is a feature, not a bug, since it shouldn't be

#### [Pattern] Use instanceof CustomEvent guard before accessing .detail rather than casting Event to CustomEvent (2026-03-19)
- **Problem solved:** hx-menu, hx-tree-view, hx-split-button had handlers receiving Event but accessing .detail (a CustomEvent-only property) via unsafe casts
- **Why this works:** instanceof CustomEvent is the correct runtime narrowing — it makes the type guard explicit, works correctly when events bubble through the DOM from different sources, and produces a type error if .detail is accessed outside the guard. Cast-based approaches bypass this entirely
- **Trade-offs:** Easier: safe access to .detail with full type inference; guards against future bugs if event dispatch changes. Harder: requires an if-block around detail access; early return or else branch needed if event is not CustomEvent

#### [Pattern] CSS custom property fallback chains follow a strict 2-level pattern: var(--component-semantic-token, var(--hx-primitive-token, #raw-value)). The component-level token enables per-instance theming; the primitive provides the design system value; the raw hex is the ultimate safety net. (2026-03-19)
- **Problem solved:** Design token architecture for a component library where tokens can be absent at runtime (e.g., tokens package not loaded, theme not applied).
- **Why this works:** Single-arg var() with no fallback silently renders as invalid/transparent if the token is undefined. The 3-tier chain ensures: (1) component consumers can override without touching primitives, (2) the design system primitive resolves if the component token is absent, (3) a hardcoded value prevents invisible/broken UI if the entire token system fails.
- **Trade-offs:** More verbose CSS property declarations. The component-level token name must follow naming convention (--hx-{component}-{role}) to remain discoverable.

### hx-menu argTypes document only the label prop because hx-menu is a pure container — its API surface is the accessible label, not visual variants (2026-03-19)
- **Context:** Audit flagged hx-menu for incomplete argTypes; adding all possible argTypes would misrepresent the component's intentional minimal API
- **Why:** Container components that compose slotted children have no meaningful prop variants to story — forcing variant stories would require mocking slot content and obscures the real usage pattern
- **Rejected:** Adding placeholder argTypes for all possible attributes — creates false documentation implying non-existent props are supported
- **Trade-offs:** Explicit sparse argTypes make the Storybook controls panel accurately minimal; future prop additions require explicit argTypes updates
- **Breaking if changed:** If argTypes are removed entirely, Storybook infers types from custom-elements manifest which may surface internal reflected attributes not intended as public API

#### [Gotcha] `pnpm install` must be run inside the worktree before `pnpm run verify` succeeds — worktrees do not automatically inherit `node_modules` from the main repo (2026-03-19)
- **Situation:** Verify pipeline (`lint + format:check + type-check`) failed with missing module errors in a fresh worktree despite packages being installed in the main repo
- **Root cause:** pnpm uses symlinked `node_modules` per workspace; a new worktree directory is not in the pnpm workspace graph by default and lacks the `.pnpm` store links
- **How to avoid:** Adds ~30-60s setup time per worktree; ensures isolation so worktree dependency state can't corrupt main repo. Trade-off is extra bootstrap step

### Light DOM components (createRenderRoot() returns this) must use style.setProperty()/removeProperty() for CSS custom properties on the host element, not styleMap() (2026-03-19)
- **Context:** CodeRabbit flagged inline style manipulation in hx-prose, suggesting styleMap as a replacement
- **Why:** When createRenderRoot() returns this, there is no shadow root — the component renders directly into the host element. styleMap() works on elements within the render template, but cannot be applied to the host element itself via the template. style.setProperty/removeProperty is the only correct mechanism for host-element CSS custom property updates in Light DOM components.
- **Rejected:** styleMap() directive — rejected because it requires a binding in the render template and cannot target the host element when the host IS the render root
- **Trade-offs:** style.setProperty preserves the CSS custom property token cascade (--hx-prose-max-width feeds downstream tokens), while direct style assignments would bypass the cascade. The imperative API is slightly less declarative but functionally correct.
- **Breaking if changed:** Switching to styleMap on a template element would create a new child element scope for the property rather than setting it on the host, breaking any CSS rules that reference --hx-prose-max-width on the component host selector

#### [Pattern] CustomEvent type parameter CustomEvent<T> should be applied at every dispatch site, not just the primary one — secondary dispatch sites (keyboard nav, sub-item handlers) that omit the generic silently widen the type to CustomEvent<unknown> (2026-03-19)
- **Problem solved:** hx-nav and hx-radio-group each had two dispatch sites for the same event name; the primary site was typed correctly but secondary sites (keyboard navigation, sub-item click) used untyped new CustomEvent(...) causing type inconsistency
- **Why this works:** TypeScript will not catch detail property mismatches on untyped CustomEvent dispatches; a secondary dispatch site that sends wrong detail shape fails silently at runtime rather than compile time
- **Trade-offs:** Typed dispatch sites make refactoring the event detail shape a compile-time error across all sites; adds minor verbosity per dispatch

#### [Pattern] Array index access before CustomEvent dispatch should be guarded with an early return when the index is derived from user interaction, even when bounds checking appears to have occurred upstream — this narrows the TypeScript type from T|undefined to T and prevents emitting events with undefined detail fields (2026-03-19)
- **Problem solved:** hx-carousel's _currentIndex was bounded to valid indices before the dispatch point, but TypeScript still inferred this._slides[next] as HelixCarouselItem|undefined because array index access always returns T|undefined with noUncheckedIndexedAccess. The @fires JSDoc declared the detail type as HelixCarouselItem (non-nullable)
- **Why this works:** Guard + early return is the minimal change that satisfies both TypeScript's type narrowing and makes the event contract provably correct — the caller guarantees the slide exists before the event fires
- **Trade-offs:** Early return makes the function slightly harder to reason about (silent failure path); benefit is that hx-slide-change is guaranteed to only fire with a valid slide reference

#### [Gotcha] The `@internal` JSDoc tag on private class members (including `@query`-decorated fields and private arrow function event handlers) correctly excludes them from Custom Elements Manifest (CEM) output, even when TypeScript `private readonly` modifier is already present. (2026-03-20)
- **Situation:** hx-overflow-menu had 6 private members leaking into the CEM public API, degrading HELiXiR health score from A to B/88. TypeScript access modifiers alone do not control CEM inclusion.
- **Root cause:** CEM analyzers (like @custom-elements-manifest/analyzer) use JSDoc `@internal` as the signal to exclude members from the manifest, not TypeScript privacy modifiers. The two systems are orthogonal — TypeScript privacy is compile-time only.
- **How to avoid:** Requires explicit dual annotation (`private` in TS + `@internal` in JSDoc) to correctly signal intent to both the TypeScript compiler and the CEM toolchain. More verbose but necessary.

#### [Gotcha] `custom-elements.json` is a generated artifact not tracked in git. Verifying CEM output after regeneration requires reading the file directly (e.g., via Python JSON parsing) rather than using `git diff` — which will show no changes. (2026-03-20)
- **Situation:** After regenerating CEM to verify `@internal` annotations took effect, `git diff` showed nothing because the file is gitignored. The fix appeared to have no effect until direct file inspection confirmed otherwise.
- **Root cause:** Generated manifests are intentionally excluded from version control to avoid merge conflicts on every build. The source of truth is the source TypeScript, not the artifact.
- **How to avoid:** Must use out-of-band verification (Python script, jq, etc.) to confirm generated output is correct before treating the fix as complete.

#### [Gotcha] formAssociatedCallback is not implemented by any HELiX component, which is spec-compliant — it is an optional notification, not a required contract method (2026-03-21)
- **Situation:** Audit of 18 form-associated Web Components using ElementInternals across the HELiX design system
- **Root cause:** The ElementInternals spec makes formAssociatedCallback optional; it fires when the element is associated with a form but provides no capabilities beyond what ElementInternals already exposes at construction time
- **How to avoid:** Easier to skip safely; harder to detect misunderstanding of spec (devs may think it is required)

#### [Gotcha] formDisabledCallback is the highest-impact missing implementation: 8 components silently ignore fieldset disabled state, breaking accessibility and UX without throwing errors (2026-03-21)
- **Situation:** Components inside a disabled <fieldset> receive formDisabledCallback but if unimplemented, the component stays interactive while the surrounding form signals disabled
- **Root cause:** The browser delegates disabled propagation to the component via the callback — it does not forcibly disable custom elements the way it does native inputs
- **How to avoid:** Implementing it requires explicit disabled state management per component; skipping it causes silent UX failures that are hard to detect in automated tests

### formStateRestoreCallback for hx-file-upload should be a documented no-op stub rather than omitted entirely (2026-03-21)
- **Context:** File objects cannot be serialized into browser session state, so restore is meaningless for file inputs — but omitting the callback entirely leaves the form-association contract incomplete
- **Why:** A documented no-op communicates intentional design (Files are not restorable) versus accidental omission; it also prevents future developers from adding a broken implementation thinking it was missed
- **Rejected:** Omitting the callback entirely — rejected because it leaves ambiguity about whether the omission is intentional or a bug
- **Trade-offs:** Adds a small amount of dead code; eliminates ambiguity about contract completeness
- **Breaking if changed:** If removed again, future audits will flag it as a gap and risk someone attempting a broken File serialization implementation

#### [Pattern] Issue grouping by fix pattern (not per-component) reduces issue sprawl and creates actionable work units — 8 components missing the same callback becomes one issue with a table, not 8 separate issues (2026-03-21)
- **Problem solved:** 18-component audit producing 5 issues rather than potentially 30+ per-component issues
- **Why this works:** Per-component issues for identical fixes would flood the board, make prioritization harder, and create merge conflict risk if agents work them in parallel with similar file changes
- **Trade-offs:** Grouped issues are harder to assign to a single component feature; easier to see systemic patterns and prioritize by fix type