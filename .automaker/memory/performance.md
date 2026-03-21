---
tags: [performance]
summary: performance implementation decisions and patterns
relevantTo: [performance]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 165
  referenced: 79
  successfulFeatures: 79
---
# performance

#### [Gotcha] Large dataset performance warnings placed inside willUpdate without a changed.has('rows') guard re-evaluate this.rows.length > 500 on EVERY property change, not just when rows change — wasted checks on every sort click, hover state update, or any reactive property mutation (2026-03-06)
- **Situation:** Adding a developer warning for large datasets in a LitElement component
- **Root cause:** willUpdate fires for any property change; without scoping to the specific property, the guard runs unnecessarily on unrelated updates
- **How to avoid:** Adding changed.has('rows') adds one line and eliminates redundant evaluations on every render cycle

#### [Gotcha] `_getFocusableItems()` was called on every keydown event with no caching, recalculating the DOM query each keystroke (2026-03-06)
- **Situation:** Roving tabindex pattern requires knowing the list of focusable items; in a toolbar with many buttons this query runs on every Arrow/Home/End key press
- **Root cause:** Simple implementation; DOM queries are cheap in small toolbars so this was not noticed in development
- **How to avoid:** Correct (always fresh list if DOM changes) but wasteful; in toolbars with many items or on low-power devices this adds measurable keystroke latency

### `tokenStyles` from `@helix/tokens/lit` inlines the full token CSS into every component's shadow root. On pages with many component instances this could significantly exceed the 5KB per-component bundle target. (2026-03-06)
- **Context:** Lit uses CSSStyleSheet adoption (constructable stylesheets) which browsers deduplicate — the same CSSStyleSheet object is shared across instances via adoptedStyleSheets. The key question is whether `tokenStyles` returns the same object reference each import.
- **Why:** If tokenStyles is a module-level singleton (const exported once), browsers adopt the same CSSStyleSheet object across all instances and there is zero per-instance memory cost. If it's constructed per-import, each instance gets its own copy.
- **Rejected:** Scoping token imports to only needed tokens was rejected for DX reasons — it would require per-component token auditing and manual tree-shaking
- **Trade-offs:** Full token import is zero-maintenance but requires verification that Lit's CSS tagging (`css` template literal) produces singleton stylesheets; without verification the assumption of browser deduplication is unvalidated
- **Breaking if changed:** If the token package ever changes from module singleton to factory pattern, all components silently go from O(1) to O(n) style memory cost

#### [Gotcha] Full TokenEntry[] metadata arrays (category, group, key, path, description) are bundled with every import of hx-theme — components that only need {name, value} pairs at runtime pay the cost of all metadata, likely pushing the bundle over the 5KB limit (2026-03-06)
- **Situation:** Token objects were designed for tooling (docs, design system explorers) that needs rich metadata, but the same objects are used at runtime for CSS injection
- **Root cause:** Single source of truth — one token format for both tooling and runtime avoids sync issues
- **How to avoid:** DX simplicity, but runtime consumers pay for metadata they never use; with 29+ findings already, bundle bloat pushes over budget

### A 5 KB per-component bundle budget is extremely tight for any component that imports multiple named exports from @floating-ui/dom, which is the dominant dependency risk for popup/tooltip primitives (2026-03-06)
- **Context:** hx-popup imported 8 named middleware functions from @floating-ui/dom; budget gate was 5 KB per chunk; no bundle analysis was run before the implementation was considered complete
- **Why:** Tree-shaking reduces the bundle but @floating-ui/dom core internals are shared across middleware and cannot be eliminated — 8 imports from a positioning library will almost certainly exceed 5 KB
- **Rejected:** Not measuring and documenting bundle size before marking implementation done — this left a P0 finding unresolved
- **Trade-offs:** Using Floating UI provides robust cross-browser positioning with minimal custom code, but the dependency cost must be verified against budget gates before any positioning component is considered shippable
- **Breaking if changed:** If bundle analysis is skipped, the component can ship violating the size gate and degrade page load performance for all consumers

### Intl.DateTimeFormat and Intl.RelativeTimeFormat objects should be memoized across renders because they are expensive to instantiate — creating them on every render is a significant performance issue for components rendered in list/table views (2026-03-06)
- **Context:** hx-format-date creates new Intl formatter instances in every render call, even when format options have not changed
- **Why:** No memoization was implemented, likely because single-instance testing does not surface the cost
- **Rejected:** Per-render instantiation — rejected for list views because N rows × M re-renders creates O(N×M) Intl object allocations
- **Trade-offs:** Memoization adds complexity (cache invalidation when locale or format options change) but is essential for grid/table use cases
- **Breaking if changed:** Removing memoization in a high-frequency-update list (sortable table) causes measurable jank; memoization must be invalidated when lang, timeZone, or format attributes change

### Omitting `will-change: transform, opacity` on animated ripple elements forces browser to decide compositor layer promotion heuristically, causing repaints in constrained Chromium/Electron environments (2026-03-06)
- **Context:** Ripple animation runs transform+opacity simultaneously on dynamically created DOM elements in a healthcare dashboard that may run in kiosk/Electron contexts
- **Why:** will-change hints the browser to promote the element to its own compositor layer before animation starts, avoiding paint during animation
- **Rejected:** Relying on browser heuristics — browser may promote automatically for transform animations, but timing is unpredictable and may cause first-frame jank
- **Trade-offs:** will-change increases GPU memory usage (one compositor layer per active ripple) — acceptable for short-lived ripple spans that are removed on animationend
- **Breaking if changed:** No direct breakage, but removing will-change in high-frequency click scenarios (e.g., table rows) can cause visible repaints on lower-end Chromium builds

#### [Gotcha] Vitest browser mode (Playwright/Chromium) consistently produces zombie processes in this project — processes accumulate, never signal exit, and subsequent test runs add more orphan processes, eventually blocking all test execution. (2026-03-07)
- **Situation:** Multiple agent sessions each spawned Vitest browser mode processes that hung indefinitely. The symptom is zero bytes of new output after the initial browser launch, and ps aux showing 30+ minute old node (vitest) and chrome-headless-shell processes.
- **Root cause:** Root cause is Vitest browser mode spawning Playwright/Chromium per test file with a browser context that hangs on certain component renders, never signaling process exit. The workaround is to kill with pkill -f 'node (vitest)' and fall back to npm run verify + npm run build:library for TypeScript correctness verification.
- **How to avoid:** Skipping full test run means relying on type-check and build for correctness signal. Type-check catches most logic errors but cannot catch runtime DOM behavior bugs.

### Bundle size for hx-help-text verified at 3.9KB raw / 1.46KB gzip despite importing tokenStyles from @helix/tokens/lit (2026-03-07)
- **Context:** Concern that tokenStyles might include the full set of design token CSS custom properties and push per-component bundle beyond the 5KB quality gate
- **Why:** Tree-shaking via Vite library mode ensures only referenced token values are included, not the entire token set
- **Rejected:** Deferring bundle verification or removing tokenStyles import as a precaution
- **Trade-offs:** Using tokenStyles provides consistent design token application across components; the actual bundle impact is minimal (1.46KB gz) making the integration worthwhile
- **Breaking if changed:** Removing tokenStyles would break design token inheritance and theme consistency; adding significantly more token references could eventually push past the 5KB gate

#### [Pattern] Memoize Intl.DateTimeFormat and Intl.RelativeTimeFormat instances in static Map caches keyed by locale|options string to avoid construction on every render (2026-03-07)
- **Problem solved:** Intl formatter construction is expensive and was being called on every LitElement render cycle
- **Why this works:** Intl constructors involve locale negotiation and options validation which are CPU-intensive; formatters are stateless once built so reuse is safe
- **Trade-offs:** Static Map grows unbounded if many unique locale+options combinations are used; in practice the combination space is small for a single app

#### [Pattern] Memoize _buildPageRange() with a composite string key (totalPages+currentPage+siblingCount+boundaryCount) to avoid recomputing page array on every render (2026-03-07)
- **Problem solved:** Page range computation involves array slicing and spread operations across potentially large page counts; called on every render cycle in a LitElement component
- **Why this works:** The result is pure/deterministic given the 4 inputs; caching avoids O(n) array work on re-renders that don't change pagination state (e.g. hover, focus events triggering update())
- **Trade-offs:** Small memory cost for the cached array; invalidation is implicit (new key = new computation). Cache is unbounded — only a concern if totalPages changes frequently across many values

#### [Gotcha] Per-component bundle size budget applies only to the component's own chunk — shared dependencies (e.g. @floating-ui/dom) are factored into separate shared chunks by Vite and should NOT be counted against it (2026-03-07)
- **Situation:** PERF-1 P0 audit defect flagged hx-popup bundle size as potentially violating a 5 KB gzip gate
- **Root cause:** Vite's code splitting correctly deduplicates shared libraries across all consumers into a single shared chunk. Attributing the full library weight to one component chunk inflates the apparent cost and produces false P0 violations.
- **How to avoid:** Requires understanding Vite chunk analysis output to correctly attribute costs; the P0 was unverified rather than violated

### 5KB raw / gzip budget enforced per Web Component — hx-structured-list at 3.7KB raw / 1.3KB gzipped is within budget (2026-03-07)
- **Context:** Structured list is a compound component with row children, striped styling, ARIA roles, and CSS custom property tokens
- **Why:** Web Components ship with Shadow DOM CSS encapsulation overhead; a 5KB raw limit prevents scope creep while allowing meaningful styling and behavior
- **Rejected:** No per-component size gate — would allow individual components to bloat without detection until the full library bundle is audited
- **Trade-offs:** Hard size limits require deliberate choices about which features to include in the component vs. composition patterns; keeps the library lean
- **Breaking if changed:** Adding complex animation systems, multiple layout variants, or large default slot content sets could breach the 5KB budget and require architectural refactoring

#### [Pattern] CSS strings for each theme are memoized at module level via _cssCache, so the stylesheet is never rebuilt on repeated theme changes to the same value. (2026-03-07)
- **Problem solved:** Each theme switch previously regenerated the full CSS string from token entries even when switching to the same theme, wasting CPU on expensive string concatenation.
- **Why this works:** Token entries are static at module load time — there is no reason to recompute CSS strings more than once per theme variant. Module-level cache persists across all component instances.
- **Trade-offs:** Easier: fast repeated theme switches, shared benefit across all instances. Harder: if tokens were ever dynamic (runtime-injected), the cache would serve stale values.

### Memoize _slots getter with key-based cache to avoid regenerating 1440 TimeSlot objects on every render call (2026-03-07)
- **Context:** The _slots getter was generating all time slot options (1440 for 1-minute step) from scratch every time it was accessed during Lit render cycles
- **Why:** Lit render() is called on every property change. Regenerating 1440 objects per render is O(n) work that produces identical output unless step/min/max changed. Key-based cache (step+min+max) invalidates only when relevant props change
- **Rejected:** No memoization — functionally correct but creates GC pressure and render latency. Simple boolean dirty flag — less precise, invalidates on any property change not just slot-affecting ones
- **Trade-offs:** Slightly more complex cache logic (key string comparison) but eliminates the dominant render cost for this component
- **Breaking if changed:** Removing memoization silently degrades performance — no functional breakage but measurable render latency increase at scale

### SVG icon markup moved to module-level constants parsed once at import time rather than regenerated as template literal strings per render (2026-03-09)
- **Context:** Each button render call was re-parsing identical SVG strings into DOM nodes; with autoplay and drag events triggering re-renders this created measurable GC pressure in profiling
- **Why:** SVG strings are static — they never change based on component state. Parsing once at module load and cloning the node reference per use is O(1) after initial parse vs O(n) per render
- **Rejected:** Using a separate icon registry or web component for icons — over-engineering for internal SVG that is component-specific and adds a dependency
- **Trade-offs:** Module-level constants increase initial parse time slightly; any future per-instance SVG customization (e.g., custom icons via slot) requires refactoring the constant approach
- **Breaking if changed:** Inlining SVG back into render methods has no functional regression but reintroduces the GC pressure pattern at scale

#### [Pattern] Module-level fetch cache (Map keyed by URL) deduplicates concurrent SVG fetch requests — if 10 icons with same sprite-url mount simultaneously, only 1 HTTP request is made (2026-03-09)
- **Problem solved:** Icon components frequently render in grids/lists where dozens of identical sprite URLs are requested on the same tick; without caching each instance independently fires a fetch
- **Why this works:** Module-level (singleton) scope means the cache persists across all component instances for the page lifetime; Promise values are stored (not resolved SVG strings) so concurrent requests for the same URL all await the same in-flight promise rather than issuing duplicate requests
- **Trade-offs:** Cache grows unbounded for pages with many unique sprite URLs; acceptable for icon use case where URL count is small

### Use a static counter for JSON-LD instance IDs in hx-breadcrumb rather than Math.random() or crypto.randomUUID(). (2026-03-10)
- **Context:** JSON-LD structured data embedded in the component needs a stable, unique ID per instance for '@id' references. Multiple breadcrumb instances on a page must not collide.
- **Why:** A static class-level counter produces deterministic IDs (e.g., 'hx-breadcrumb-0', 'hx-breadcrumb-1') that are stable across SSR hydration, snapshot tests, and re-renders. Math.random() produces different values on each render, breaking hydration matching and snapshot tests.
- **Rejected:** Math.random() was rejected due to hydration mismatch risk in SSR contexts and non-deterministic snapshot test failures. crypto.randomUUID() has the same hydration problem and is also unavailable in some older browser contexts.
- **Trade-offs:** Deterministic and testable IDs (easier), but the counter resets on page reload — IDs are not stable across sessions, which is fine for JSON-LD @id purposes but means IDs cannot be used as persistent external references (harder).
- **Breaking if changed:** Switching to Math.random() would cause Vitest snapshot tests to fail on every run and would break SSR hydration if the component is ever rendered server-side.

### Individual component export at dist/components/hx-button-group/index.js targeting sub-5KB budget (achieved 0.14 kB) (2026-03-10)
- **Context:** Consumers embedding hx-button-group in Drupal standalone HTML contexts cannot use the full library bundle — they need a minimal standalone file
- **Why:** A 0.14 kB standalone entry means consumers pay near-zero cost for the grouping primitive; Vite auto-discovers the index.ts entry so no manual build config is needed per component
- **Rejected:** Requiring consumers to import from the full library bundle for standalone HTML usage — would force loading all 85 components for a simple button group
- **Trade-offs:** Each component needs its own index.ts entry file (maintenance overhead per component); but enables true à-la-carte loading in non-SPA contexts like Drupal
- **Breaking if changed:** Removing packages/hx-library/src/components/hx-button-group/index.ts breaks standalone HTML and Drupal integration paths; the dist artifact disappears and docs integration examples break

#### [Pattern] Auto-dismiss timer for alerts should be restricted to info/success variants only at the implementation level, not just by convention (2026-03-11)
- **Problem solved:** Healthcare alert context — error and warning alerts must never auto-dismiss for patient safety. A duration property without variant gating could be misused.
- **Why this works:** If duration is a plain number property, nothing stops a caller from setting duration=3000 on a variant='error' alert. The component itself must enforce the safety constraint.
- **Trade-offs:** Easier: safety guarantee regardless of caller. Harder: callers cannot override even if they have a legitimate edge case. Timer must clear on disconnect to prevent memory leaks.

### Intl formatter instances are cached rather than created per-render in hx-format-date (2026-03-11)
- **Context:** Date formatting requires constructing Intl.DateTimeFormat objects which are expensive to instantiate repeatedly
- **Why:** Intl object construction is a known V8 performance bottleneck; caching by locale+options key avoids repeated GC pressure in list/table scenarios with many date cells
- **Rejected:** Creating new Intl.DateTimeFormat on each render is simpler but causes measurable slowdown when hundreds of date components exist on a page
- **Trade-offs:** Faster repeat renders and lower GC pressure; cache must be invalidated or keyed correctly if locale/options change dynamically
- **Breaking if changed:** Removing the cache causes no functional regression but degrades performance in high-density usage scenarios

#### [Gotcha] Component entry points in dist are re-export stubs (~0.13 KB each), not the real component code. Must use esbuild tree-shaking to measure actual per-component bundle sizes. (2026-03-12)
- **Situation:** Trying to measure per-component bundle sizes for a 72-component library
- **Root cause:** Tree-shaking via esbuild resolves the full dependency graph from the entry point and dead-code-eliminates everything not reachable, giving the true shipped size rather than the stub size
- **How to avoid:** Script is slower (runs esbuild per component) but produces accurate data. Fast file-size check would be near-instant but useless.

### CI bundle size check changed from hard-fail (--ci) to informational report for initial rollout when existing components already exceed budgets (2026-03-12)
- **Context:** 5 complex components (date-picker, combobox, color-picker, select, time-picker) legitimately exceed the 5 KB per-component budget at the time tracking was introduced
- **Why:** Acceptance criteria said 'alerts on regression' not 'blocks on budget violation'. Making CI fail immediately on known, justified violations would create noise and incentivize removing the check entirely
- **Rejected:** Hard-fail --ci mode from day one — would have blocked CI on every PR until all 5 components were optimized, even for unrelated changes
- **Trade-offs:** Developers won't be automatically blocked from merging when budgets are exceeded, but the data is visible. Switch to --ci when complex components are optimized.
- **Breaking if changed:** If switched back to --ci prematurely (before those 5 components are optimized), CI will fail on every PR regardless of what changed

#### [Pattern] esbuild is available in the project via Vite's dependency tree — no separate install needed for bundle analysis scripts (2026-03-12)
- **Problem solved:** Needed a fast bundler for tree-shaking individual components to measure sizes, considered whether to add a new devDependency
- **Why this works:** Vite already depends on esbuild, so it's always present in node_modules. Using it avoids bloating package.json with a redundant dependency and guarantees version consistency with the build tool.
- **Trade-offs:** Implicit dependency on Vite's esbuild version — if Vite ever stops bundling esbuild (unlikely), the script breaks silently. Explicit dep would be more robust but adds maintenance overhead.

### CSS cache memoization added to hx-theme's dynamic stylesheet generation (2026-03-12)
- **Context:** hx-theme generates stylesheets dynamically (e.g., when tokens change). Without memoization, repeated renders recalculate identical stylesheets
- **Why:** Dynamic stylesheet generation is expensive; same token inputs always produce same CSS output, making it a pure function suitable for memoization
- **Rejected:** Regenerating on every render is simpler but causes unnecessary style recalculations and potential layout thrashing
- **Trade-offs:** Cache must be invalidated when tokens change; adds memory overhead proportional to unique token configurations used
- **Breaking if changed:** Removing memoization causes performance regression on token-heavy pages with frequent re-renders

### Cache ARIA metadata (_level, _posInSet, _setSize, _selectable) as @state properties updated once on connectedCallback and slotchange, replacing per-render DOM traversal methods (_getLevel, _getPosInSet, _getSetSize, _isSelectable) (2026-03-13)
- **Context:** hx-tree-item was performing DOM traversal on every render cycle to compute ARIA positional metadata, causing O(n) DOM queries per render in tree structures
- **Why:** ARIA metadata for tree items only changes when the DOM structure changes (slot content), not on every render. Caching eliminates redundant traversal while slotchange event ensures cache stays fresh
- **Rejected:** Keeping per-render traversal methods — rejected because in a 500-node tree each render triggers 4 DOM traversals per item; caching reduces this to one batch update per structural change
- **Trade-offs:** Cache invalidation is now tied to slotchange events only — if ARIA metadata can change outside of slot mutations (e.g., programmatic attribute changes), cache could go stale. Gain: dramatically lower render cost at scale
- **Breaking if changed:** If _updateAriaMetadata() is removed or slotchange listener is dropped, ARIA positional values will either be stale or missing, breaking screen reader navigation

#### [Pattern] Add `contain: layout` CSS to :host in Web Components as a default performance baseline for layout-heavy components (hx-tree-view, hx-tree-item, hx-container all received this) (2026-03-13)
- **Problem solved:** Browser layout recalculation cascades up and down the DOM tree; without containment, changes inside a component can trigger layout recalculation in ancestor/sibling elements
- **Why this works:** CSS containment tells the browser the component is a layout boundary — changes inside cannot affect outside layout, enabling browser to skip entire subtrees during recalculation. Zero bundle size cost, pure rendering win
- **Trade-offs:** Component cannot use out-of-flow elements that affect ancestor layout (e.g., absolutely positioned children that escape the component boundary). Gain: isolated layout recalculation scope

#### [Pattern] Lit reactive properties + updated() lifecycle should be the single call site for all side effects (setFormValue, _syncRadios, _updateValidity). Event handlers should only mutate reactive state, never call side effects directly. (2026-03-13)
- **Problem solved:** hx-radio-group._handleRadioSelect was calling setFormValue/syncRadios/updateValidity explicitly after setting this.value, which already queues those same calls via updated().
- **Why this works:** Lit's reactive system guarantees updated() fires after any reactive property change. Duplicating side effect calls in the handler creates a double-execution pattern that's invisible at first glance because both paths appear correct in isolation.
- **Trade-offs:** Centralizing in updated() makes the component more resilient to all value-change paths but requires understanding Lit's lifecycle to know effects are guaranteed to run.

### Per-component bundle size gates are enforced via a shared CI gate rather than per-component size checks, relying on rollupOptions.external to externalize Lit core and token deps across all components. (2026-03-13)
- **Context:** Individual components like hx-meter needed verification they weren't exceeding the 5KB min+gz budget, but no per-component CI step existed.
- **Why:** With preserveModules:true and all runtime deps externalized (lit, @lit/*, @helixui/tokens, @floating-ui/*), each component chunk only contains its own source. The shared gate catches any component that accidentally bundles a dep.
- **Rejected:** Per-component size assertions in test suite — would require maintaining expected sizes as components grow and would give false failures on legitimate feature additions.
- **Trade-offs:** Easier to maintain, but the gate catches bundle size problems after the fact rather than preventing them at authorship time.
- **Breaking if changed:** Removing a dep from rollupOptions.external would silently bundle it into every component that imports it, bloating all chunks — the CI gate would catch this but only after the PR is submitted.

#### [Gotcha] @floating-ui/dom must be in both peerDependencies (package.json) AND rollupOptions.external regex (/^@floating-ui/) in vite.config.ts to actually be excluded from the bundle. Either alone is insufficient. (2026-03-13)
- **Situation:** hx-overflow-menu P1-03 finding was that @floating-ui/dom appeared to be bundled rather than externalized, which would add ~50KB to the component chunk.
- **Root cause:** peerDependencies tells npm consumers they must install it, but Rollup/Vite still bundles it unless explicitly excluded via external. The regex pattern /^@floating-ui/ covers all sub-packages (dom, core, utils) with one rule.
- **How to avoid:** Regex external is more resilient but requires the consumer's bundler to correctly resolve the peer dep. SSR/non-bundled consumers must install @floating-ui/dom themselves.

### Bundle size verification requires running an actual build (`npm run build`) and inspecting dist output — source file size estimates are unreliable for audit sign-off (2026-03-13)
- **Context:** AUDIT.md had a P2 finding marked as 'unverifiable' because no dist output existed in the worktree. Source files totaled ~19KB uncompressed, with an estimated 4-5KB gzip — but the estimate alone was insufficient to close the finding.
- **Why:** Minification and tree-shaking produce non-linear size reductions that cannot be accurately estimated from raw source size. Actual build output (17.99 kB minified → 4.85 kB gzip) was needed to formally confirm the <5 kB budget compliance.
- **Rejected:** Accepting the source-size estimate as sufficient evidence — rejected because estimates have no precision guarantee and could mask actual budget violations
- **Trade-offs:** Requires a full build step in the audit workflow, but produces defensible, reproducible evidence for the budget compliance claim
- **Breaking if changed:** If dist output is not regenerated after significant source changes, the audit finding could become stale and misrepresent actual bundle size

### Created a `devWarn()` utility wrapping `console.warn` behind `import.meta.env.DEV` rather than sprinkling conditional checks or eslint-disable comments at each call site (2026-03-18)
- **Context:** 23 console.warn calls across 16 components were leaking into production bundles, adding noise and minor bundle weight
- **Why:** Vite statically replaces `import.meta.env.DEV` with `false` at build time, enabling dead-code elimination to tree-shake the entire warn body — zero runtime cost in production with no per-call boilerplate
- **Rejected:** `process.env.NODE_ENV` checks are unreliable in browser ESM environments where process is not defined; per-call `if (import.meta.env.DEV)` guards work but create 23x repetition and are easy to forget
- **Trade-offs:** All dev warnings are now silenced uniformly in production. The wrapper adds one indirection layer for stack traces during debugging, but the call site tag (component name passed as first arg) compensates
- **Breaking if changed:** Removing `dev-warn.ts` or changing the `import.meta.env.DEV` guard to a runtime check would either break all 16 components at import time or cause warnings to reach production builds again

### Narrowed sideEffects in package.json from ['**/*.css', 'src/components/**/*.ts', 'dist/components/**/*.js', 'dist/shared/**/*.js'] to ['**/*.css'] only (2026-03-19)
- **Context:** hx-library uses barrel exports; bundlers were treating all JS/TS component files as side-effectful, preventing tree-shaking of unused components
- **Why:** Web components self-register via customElements.define() inside module bodies, but listing source/dist JS files as sideEffects tells bundlers they cannot be eliminated even when unused — defeating tree-shaking entirely for barrel import consumers
- **Rejected:** Keeping JS paths in sideEffects was the safe-but-wrong default; some assumed customElements.define() requires sideEffects:true for all component files, but this prevents any dead-code elimination
- **Trade-offs:** Tree-shaking now works for barrel consumers; risk is if any component file truly has imperative side effects beyond customElements.define() that consumers depend on — those would now be stripped
- **Breaking if changed:** If a component file registers global state, patches prototypes, or executes code beyond class definition + customElements.define(), removing it from sideEffects will cause silent runtime breakage for consumers who import via barrel but don't directly reference that component

#### [Pattern] Replace querySelector in render() with @state boolean tracked via connectedCallback + slotchange event (2026-03-19)
- **Problem solved:** hx-table called this.querySelector('[slot="caption"]') on every render() invocation to conditionally render caption markup, causing synchronous DOM traversal on every re-render cycle
- **Why this works:** querySelector in render() is O(n) DOM traversal on every render — for a table component that re-renders on data changes this compounds. connectedCallback runs querySelector once at mount; slotchange fires only when slot content actually changes, keeping state accurate with zero per-render cost
- **Trade-offs:** Slightly more stateful component (extra @state property + two event handlers); gained O(1) caption check per render instead of O(n) DOM traversal

### hx-color-picker pointermove/pointerup listeners added at drag start (pointerdown) and removed at drag end (pointerup), not at picker open/close (2026-03-19)
- **Context:** hx-color-picker was registering global document pointermove/pointerup listeners in connectedCallback, meaning they fired on every pointer move across the entire document even when no drag was active
- **Why:** Moving listeners to drag start/end (rather than picker open/close) works correctly for both inline and popover render modes without mode-specific branching — inline pickers are always 'open' so open/close scoping would still leave listeners always-on in inline mode
- **Rejected:** Scoping to picker open state would fix popover mode but leave inline mode broken (still always-on); removing in disconnectedCallback only is insufficient — leaks during the component's lifetime
- **Trade-offs:** Marginally more event handler registrations/removals (per drag vs per open), but eliminates continuous document-level pointermove firing during normal page interaction
- **Breaking if changed:** If pointermove/pointerup are not removed in _handlePointerUp, a pointer-up outside the component (e.g. user releases outside browser window and re-enters) leaves orphaned listeners that fire on subsequent moves and cause phantom drag behavior

#### [Pattern] Replace CSS width/max-height transitions with transform: scaleX() via CSS custom property ratios (--_value-ratio, --_fill-ratio, --_progress-ratio) set in Lit's updated() lifecycle hook (2026-03-19)
- **Problem solved:** Progress bars, sliders, and meters were using width transitions which trigger layout recalculation on every animation frame, causing jank on low-end devices
- **Why this works:** transform and opacity are the only CSS properties that can be GPU-composited — they don't trigger layout or paint phases. width changes force full layout recalculation on every frame.
- **Trade-offs:** Easier: smooth 60fps animations, no layout thrash. Harder: the element must be 100% wide at all times with transform-origin: left, and a ratio (0–1) must be computed and passed via CSS custom property rather than a percentage width

### Replace hardcoded millisecond timing values (0.15s, 1.5s) with design token references (--hx-transition-fast, --hx-duration-spinner) in animation declarations (2026-03-19)
- **Context:** Hardcoded timing creates drift between components and makes global timing adjustments require touching every component file individually
- **Why:** Token-based timing means a single token change propagates consistently across all components that reference it; also enforces the design system contract that timing is a first-class design decision
- **Rejected:** Keeping hardcoded values was rejected because the CSS audit flagged them as medium-severity findings and they prevent global timing control
- **Trade-offs:** Easier: global timing changes in one place. Harder: tokens must be defined and available in the CSS cascade; components become dependent on token availability
- **Breaking if changed:** If tokens are not defined in the CSS cascade (e.g., tokens package not loaded), transitions fall back to browser default (typically 0s) — components animate instantly instead of smoothly.

### Cache offsetWidth/offsetHeight once on pointerdown, read from cache in pointermove instead of calling _getHostSize() on every event (2026-03-19)
- **Context:** hx-split-panel fires pointermove at ~60fps during drag; each call to offsetWidth/offsetHeight forces a synchronous layout reflow (layout thrash)
- **Why:** Container dimensions do not change during a single drag gesture, so measuring once at drag start is semantically equivalent but eliminates 60+ forced reflows per second
- **Rejected:** Calling _getHostSize() (which reads offsetWidth/offsetHeight) on every pointermove — this was the original approach and caused continuous layout thrash during drag
- **Trade-offs:** Cache must be explicitly cleared on pointerup to avoid stale values if orientation or container resizes between gestures; adds two private fields to the class
- **Breaking if changed:** Removing the cache and reverting to per-event layout reads restores layout thrash at drag time; forgetting to clear cache on pointerup could return stale 0 values on next drag if component is resized

#### [Gotcha] MutationObserver with subtree:true in hx-tabs was observing the entire component subtree for attribute changes, not just direct tab/panel children (2026-03-19)
- **Situation:** hx-tabs needs to detect when tab `name` or panel `panel` attributes change to update its internal state
- **Root cause:** subtree:false restricts observation to direct children only — which is where tabs and panels live — avoiding unnecessary callbacks for attribute mutations deep in slot content
- **How to avoid:** subtree:false is more efficient but requires that tabs/panels are direct children; if the component architecture changes to nest tabs deeper, this breaks

#### [Pattern] Use Lit's repeat() directive with stable identity keys (value, globalIndex) for list rendering in data-table, select, and combobox (2026-03-19)
- **Problem solved:** Without repeat(), Lit's default list rendering diffs by position — reordering or filtering a list causes unnecessary DOM node recreation rather than node reuse
- **Why this works:** repeat() with a stable key allows Lit to move existing DOM nodes when the list reorders/filters rather than destroy and recreate them, preserving focus state and avoiding layout recalculation for unchanged items
- **Trade-offs:** repeat() adds overhead for key-lookup bookkeeping; for very small static lists (<10 items) the overhead may exceed the benefit. For dynamic/filterable/sortable lists the win is significant

#### [Gotcha] Timer IDs from setTimeout in disconnectedCallback-unaware components create leaks when components are removed from DOM before the timer fires (2026-03-19)
- **Situation:** hx-menu typeahead and hx-popover show-delay both used setTimeout without storing the handle, making clearTimeout impossible on disconnect
- **Root cause:** Storing the timer ID in a private field (_typeaheadTimer, _showTimer) enables clearTimeout in disconnectedCallback, which is the LitElement lifecycle hook called when the element leaves the DOM
- **How to avoid:** Requires discipline to always clear stored timers in disconnectedCallback; if a new timer is set without clearing the old handle first, the old timer still fires

#### [Gotcha] hx-popover's focus trap keydown listener was added on show but never removed on hide or disconnect, leaking a document-level event listener per show cycle (2026-03-19)
- **Situation:** Focus trap requires a keydown listener on document to intercept Tab/Shift+Tab; without explicit removeEventListener the listener accumulates with each show call
- **Root cause:** The listener must be removed in disconnectedCallback (and on hide) because document-level listeners are not automatically cleaned up when a custom element is removed from the DOM
- **How to avoid:** The bound function reference must be stored (not recreated inline) so the same reference can be passed to both addEventListener and removeEventListener; arrow class fields satisfy this