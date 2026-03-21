---
tags: [ui]
summary: ui implementation decisions and patterns
relevantTo: [ui]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 3
  referenced: 0
  successfulFeatures: 0
---
# ui

### hx-dialog does NOT use attachInternals() despite ElementInternals being referenced in the project tech stack (2026-03-05)
- **Context:** Reviewer suggested adding attachInternals() for ARIA/form participation; project CLAUDE.md references ElementInternals
- **Why:** hx-dialog is not a form-associated element; native <dialog> element handles ARIA labelling natively via aria-labelledby wired in render(); adding attachInternals() without consuming any of its APIs is dead code
- **Rejected:** attachInternals() — rejected because it provides no functional benefit for a non-form-associated dialog component and violates the no-dead-code policy
- **Trade-offs:** Keeps component minimal and policy-compliant; means form association must be explicitly added if ever needed later
- **Breaking if changed:** Adding attachInternals() without consuming its APIs violates project policy (CLAUDE.md: no orphaned/dead code) and adds byte weight with zero benefit

### CSS custom property var() chains must include literal fallbacks (e.g., var(--hx-font-size, 1rem)) — removing fallbacks breaks resilience even when tokens are expected to be present (2026-03-05)
- **Context:** PR review questioned why literal values like '2px', '1rem', 'sans-serif' appeared as fallbacks in var() chains, suggesting they were redundant if tokens were always set
- **Why:** Design tokens may not be injected in all consumer environments (SSR, email, non-standard builds, test harnesses). Fallbacks guarantee the component renders correctly in isolation with no token sheet present.
- **Rejected:** Relying solely on token presence — rejected because it creates an invisible hard dependency on the token stylesheet being loaded, which breaks component portability
- **Trade-offs:** Fallbacks add slight verbosity to CSS; the payoff is zero-dependency rendering and component portability across environments
- **Breaking if changed:** Removing fallbacks causes invisible rendering failures in any context where the token stylesheet isn't loaded — components become unstyled with no error

#### [Gotcha] display:contents on a flex/inline child removes that element from the accessibility tree in most browsers, breaking ARIA semantics for screen readers (2026-03-05)
- **Situation:** Trying to make a wrapper element visually transparent (not adding box to layout) using display:contents for an inline SVG icon wrapper
- **Root cause:** display:contents causes the element to be skipped in the accessibility tree — any ARIA attributes on it become invisible to assistive technology; inline-flex preserves both layout intent and ARIA semantics
- **How to avoid:** inline-flex adds a layout box but keeps ARIA attributes visible to assistive technology

#### [Gotcha] Empty string src (src="") must not be treated the same as a URL — it must fall through to sprite mode, not trigger an empty fetch or inline mode (2026-03-05)
- **Situation:** Component has three rendering modes: fetch (src URL), sprite (#id), inline (SVG string); the condition `src !== undefined` incorrectly treats src="" as a fetch URL
- **Root cause:** Empty string is a valid attribute reset but semantically means 'no URL'; checking only for undefined caused src="" to dispatch an empty fetch request rather than falling back to sprite/no-op behavior
- **How to avoid:** Stricter check (typeof src === 'string' && src.trim().length > 0) correctly gates on meaningful values at cost of slightly more verbose condition

### ifDefined() helper must be used in Lit/Storybook templates for optional URL attributes — passing empty string instead of undefined activates different code paths in the component (2026-03-05)
- **Context:** Storybook story was binding src=${args.src ?? ''} which passed empty string when src was unset in controls
- **Why:** The component uses empty-string detection to differentiate 'no src given' from 'src is a URL'; passing '' from stories caused the empty-src-triggers-inline-mode bug to manifest in Storybook even with no user action
- **Rejected:** Nullish coalescing to empty string (?? '') — semantically wrong for URL attributes that have distinct undefined vs empty behavior
- **Trade-offs:** ifDefined() requires importing the helper but correctly maps undefined args to absent attributes
- **Breaking if changed:** Reverting to ?? '' causes Storybook default story to exercise the wrong code path, masking bugs and producing misleading visual output

#### [Gotcha] In shadow DOM, :first-of-type always matches because each shadow root is an isolated scoping context — use :host(:first-child) .item instead (2026-03-05)
- **Situation:** hx-accordion-item used .item:first-of-type to style the topmost accordion item differently (e.g. remove top border), but the selector always matched every item
- **Root cause:** :first-of-type resolves relative to the shadow root's internal DOM, not the light DOM siblings. Every shadow root contains exactly one .item div, so :first-of-type is always true. :host(:first-child) checks whether the custom element itself is the first child in the light DOM, which is the correct scoping level.
- **How to avoid:** Requires thinking about two DOM layers (light and shadow) when writing nth-child/first-of-type selectors inside components

#### [Gotcha] font-family on a shadow DOM container class (.accordion) does not inherit into slotted light DOM content — must be set on :host (2026-03-05)
- **Situation:** font-family was set on .accordion div inside the shadow root; slotted children (light DOM) did not inherit it
- **Root cause:** CSS custom properties and inherited properties like font-family do cross the shadow boundary via :host, but only if set on :host itself. Setting them on internal shadow elements does not propagate to slotted content because slotted nodes remain in the light DOM and inherit from their light DOM ancestors, not shadow DOM internals.
- **How to avoid:** Font-family must be managed at :host level for any property that needs to cascade into slotted content

### Omit aria-hidden entirely when content is visible rather than setting aria-hidden='false' (2026-03-05)
- **Context:** Accordion panel content was toggled with aria-hidden='false' when visible and aria-hidden='true' when hidden
- **Why:** aria-hidden='false' is a WCAG anti-pattern: the attribute's presence can confuse some AT implementations, and the spec defines 'false' as equivalent to the attribute being absent. Setting it explicitly 'false' may cause double-announcement or inconsistent behavior across screen readers. Omitting the attribute entirely when content should be exposed is the correct and unambiguous pattern.
- **Rejected:** aria-hidden='false' — technically valid per spec but causes inconsistent AT behavior and violates authoring best practices
- **Trade-offs:** Template logic must conditionally include/exclude the attribute rather than toggling its value; slightly more complex template binding
- **Breaking if changed:** Re-adding aria-hidden='false' when visible risks regression on screen reader announcement consistency

### Add side-effect import './hx-accordion-item.js' in hx-accordion.ts alongside the type-only import to guarantee child element registration (2026-03-05)
- **Context:** hx-accordion uses hx-accordion-item as a child element in its template. Only a 'import type' was present, which TypeScript strips entirely at compile time.
- **Why:** Custom elements must be registered via customElements.define() before the browser parses them. A type-only import is erased by the TypeScript compiler and never executes the side-effecting module code that calls define(). Any consumer importing only hx-accordion would get undefined custom element behavior for hx-accordion-item slots.
- **Rejected:** Relying on consumers to import hx-accordion-item separately — fragile, non-obvious, causes silent failures in isolation
- **Trade-offs:** Slightly increases bundle for consumers who only need hx-accordion (they also get hx-accordion-item), but this is correct behavior since the two are inseparable
- **Breaking if changed:** Removing the side-effect import causes hx-accordion-item to render as HTMLUnknownElement in any context that imports only hx-accordion

### role='list' removed from accordion container because accordion items are not listitem-role children — incorrect ARIA semantics (2026-03-05)
- **Context:** The accordion container div had role='list' in an attempt to communicate structure to AT
- **Why:** role='list' requires children with role='listitem'. Accordion items use button+region/heading patterns per ARIA Accordion pattern, not listitem. Mismatched role hierarchies produce AT warnings and mislead screen reader users about the content structure. The accordion WAI-ARIA pattern does not call for a list wrapper.
- **Rejected:** Keeping role='list' as a grouping hint — violates ARIA required owned elements contract
- **Trade-offs:** No grouping role on the container; AT understands the accordion through the heading/button/region pattern instead, which is the specified approach
- **Breaking if changed:** Re-adding role='list' creates an ARIA validation error and may cause screen readers to announce incorrect structural information

#### [Gotcha] Use `previousElementSibling` check before inserting programmatic elements into slotted content to prevent infinite slotchange loops (2026-03-05)
- **Situation:** When inserting hx-bc-ellipsis item into slotted content, the DOM mutation triggers another slotchange event, which would re-trigger the insertion logic indefinitely
- **Root cause:** Guard `this._ellipsisItem.previousElementSibling !== firstItem` short-circuits the handler when the ellipsis is already correctly positioned, breaking the infinite loop
- **How to avoid:** Slightly more complex slotchange handler; prevents catastrophic re-render loops

#### [Pattern] Use `::slotted([data-bc-hidden])` with a data attribute to hide shadow-DOM-managed slotted elements from within shadow styles (2026-03-05)
- **Problem solved:** Shadow DOM cannot directly apply styles to slotted light-DOM children except via `::slotted()`. Need to hide middle items in collapse behavior without removing them from DOM.
- **Why this works:** `::slotted([data-bc-hidden]) { display: none }` lets the shadow component control visibility of light-DOM children declaratively without JavaScript style mutation per-element
- **Trade-offs:** Requires consumers to know this data attribute exists if they inspect DOM; cleaner than inline style manipulation

#### [Pattern] Use `display: contents` on a CSS `part` wrapper element to make it layout-transparent while still being targetable for styling (2026-03-05)
- **Problem solved:** hx-breadcrumb-item needed an `item` CSS part for external styling customization, but adding a wrapper `<span>` would break flex/grid layout of the existing link/text content
- **Why this works:** `display: contents` makes the span invisible to the layout algorithm — children participate in parent's layout directly — while the element still exists as a targetable `::part(item)`
- **Trade-offs:** Less browser support in very old browsers (IE has no support, but modern browsers fine); `display: contents` has some known a11y edge cases in older Chrome

### Keep both `class='separator'` and `part='separator'` on the separator element simultaneously (2026-03-05)
- **Context:** Existing Vitest tests query the separator by class name (`.separator`). Adding a `part` attribute enables external CSS customization but must not break existing test selectors.
- **Why:** Dual attribute is backward-compatible — existing tests query by class, new CSS part API uses `part`. Zero cost to have both.
- **Rejected:** Replace `class` with `part` only — breaks all existing tests that use `querySelector('.separator')`
- **Trade-offs:** Slight redundancy in markup; avoids a breaking change to test suite and any consumer CSS targeting `.separator`
- **Breaking if changed:** Removing the `class` attribute breaks existing Vitest browser tests; removing `part` removes the external CSS customization surface

#### [Pattern] Inject JSON-LD structured data into `document.head` from a custom element and clean up in `disconnectedCallback` (2026-03-05)
- **Problem solved:** hx-breadcrumb needed to emit BreadcrumbList schema for SEO without requiring consumers to manually manage a separate script tag
- **Why this works:** Custom element lifecycle guarantees cleanup — `disconnectedCallback` removes the script tag when the component is removed from DOM, preventing orphaned structured data
- **Trade-offs:** Component reaches outside its shadow root into `document.head` (breaks strict encapsulation); acceptable for SEO metadata which is inherently document-level

#### [Gotcha] CSS :nth-child() selector is meaningless for nested shadow DOM submenu targeting when the nth-child index is derived from a parent array index — the DOM nesting levels don't align (2026-03-05)
- **Situation:** _handleSubKeydown used .nav__submenu:nth-child(parentIndex+1) to target the active submenu, but nth-child counts siblings at the same DOM level, not logical nav item position
- **Root cause:** Replace with .nav__submenu:not([hidden]) which targets the currently-visible submenu regardless of DOM position — only one submenu should be visible at a time by design
- **How to avoid:** Relies on the invariant that only one submenu is open at a time; if multi-open submenus were added, this selector would need revision

#### [Gotcha] Shadow DOM keyboard navigation breaks when querySelectorAll for focusable items includes nested submenu links — submenu links pollute the index array causing arrow key jumps to skip items or land in wrong positions (2026-03-05)
- **Situation:** Top-level keyboard handler used a broad [part='link'] selector that matched both top-level nav links and submenu child links, corrupting the currentIdx arithmetic
- **Root cause:** Scope the selector with :scope > nav > [part='list'] > [part='item'] > [part='link'] to capture only direct top-level links, keeping the index array aligned with visible items
- **How to avoid:** Selector is tightly coupled to the shadow DOM structure; any structural refactor must update this selector

### prefers-reduced-motion blocks must include both transition: none AND animation: none — omitting animation: none is a WCAG compliance gap even if no keyframe animations exist today (2026-03-05)
- **Context:** Reduced-motion block only had transition: none; CSS animations added later would bypass the accessibility guard
- **Why:** Proactively include animation: none so future animation additions are automatically suppressed without requiring a second accessibility audit
- **Rejected:** Only transition: none — would miss any @keyframes animations added to the same selectors
- **Trade-offs:** Minor — two properties instead of one; future animators must be aware that animation is intentionally suppressed for reduced-motion users
- **Breaking if changed:** Removing animation: none causes any future keyframe animations on .nav__link, .nav__chevron, or [part='toggle'] to play for users who have requested reduced motion, failing WCAG 2.3 AAA

### CSS custom property (--hx-*) token conventions apply to component .styles.ts files only, NOT to Storybook story render() wrapper divs (2026-03-05)
- **Context:** PR reviewer misapplied component token convention to inline styles on demo wrapper divs in Story render functions
- **Why:** Story wrapper divs are demo scaffolding, not component internals. Applying token-only rule to story wrappers would prohibit any story layout that needs explicit pixel/rem values for demonstration purposes.
- **Rejected:** Applying --hx-* token rule universally to all styles in repo — rejected because it conflates component API surface with demo presentation layer
- **Trade-offs:** Requires clear team understanding of which layer the token convention governs; but keeps story flexibility intact
- **Breaking if changed:** If enforced on stories, Storybook stories lose ability to use standard CSS for wrapper/layout demos

### CSS custom property fallbacks like `var(--hx-size-6, 1.5rem)` are intentional defensive fallbacks, not violations of the no-hardcoded-values rule (2026-03-05)
- **Context:** hx-icon component uses rem fallbacks in CSS token cascade chains to ensure sensible rendering in consumer environments that haven't loaded the design token CSS
- **Why:** Without fallbacks, icons would render at zero size in token-absent environments. The fallback is the last resort in a cascade chain, not a hardcoded assignment bypassing the token system.
- **Rejected:** Removing fallbacks to enforce pure token-only values — rejected because it would cause invisible (zero-size) icons when tokens aren't loaded
- **Trade-offs:** Component is resilient across varied consumer setups; trade-off is that if a token value changes, the fallback may drift from the intended size over time
- **Breaking if changed:** Removing fallbacks breaks icon rendering in any environment where `--hx-*` token CSS hasn't been loaded (e.g., isolated test harnesses, partial token adoption consumers)

### Inline styles in Storybook story render callbacks are exempt from the `--hx-*` CSS token convention (2026-03-05)
- **Context:** Story wrapper divs used `gap: 0.5rem; display: flex` as layout scaffolding — a PR review thread flagged these as violations of the token convention
- **Why:** The `--hx-*` token convention governs component source files (`.styles.ts`), not demo scaffold wrappers in Storybook render callbacks. Story wrappers are ephemeral display helpers, not shipped UI.
- **Rejected:** Replacing all story wrapper inline styles with `--hx-*` tokens — rejected because it reduces readability with zero end-user benefit and conflates component API surface with documentation scaffolding
- **Trade-offs:** Cleaner separation between component theming layer and story presentation layer; risk is inconsistent application of the rule if not clearly documented
- **Breaking if changed:** Nothing breaks by keeping inline styles in stories; enforcing tokens there would create false positives in code review for future component authors

#### [Gotcha] Applying filter: brightness() on hover for ALL button variants combined with explicit background-color overrides on hover for secondary/tertiary/danger/ghost variants causes double-darkening — the bg-color AND the brightness filter both darken the result simultaneously. (2026-03-05)
- **Situation:** hx-icon-button's hover styles applied a global brightness filter, then variant-specific CSS rules also changed background-color on hover. Only the primary variant was designed around filter-only darkening.
- **Root cause:** The filter was likely added globally as a convenience mechanism, then variant-specific bg overrides were added later without recognizing the conflict.
- **How to avoid:** The double-darkening bug is subtle — buttons still respond to hover, so QA may not catch it. But it means the actual hover color is not controlled by any single token and cannot be precisely specified by design.

#### [Gotcha] pointer-events: none on :host([disabled]) masks cursor: not-allowed — the not-allowed cursor requires pointer events to be active to display; when pointer-events is none the cursor never renders. (2026-03-05)
- **Situation:** hx-icon-button sets pointer-events: none on the disabled host to block interaction, then sets cursor: not-allowed on the inner button. The cursor style is never visible because pointer events are blocked before the cursor can change.
- **Root cause:** pointer-events: none was added to prevent click propagation on disabled elements. cursor: not-allowed was added to provide the expected disabled visual feedback. The two are mutually exclusive.
- **How to avoid:** pointer-events: none is a convenient guard against all pointer interaction, but it prevents any pointer-state-dependent CSS from working, including cursors and :hover styles.

#### [Gotcha] aria-label on a custom element host does NOT propagate into Shadow DOM inner elements — the inner <button> remains unlabeled for screen readers despite aria-label being present on the host (2026-03-05)
- **Situation:** Icon-only buttons use aria-label on the custom element host expecting screen readers to announce it, but Shadow DOM encapsulation breaks this — axe-core tests still pass because axe tests the host element, not the inner shadow button
- **Root cause:** Shadow DOM creates a boundary that ARIA attributes do not cross automatically — the accessible name computation algorithm does not pierce shadow roots for aria-label
- **How to avoid:** Fix requires either: explicit ariaLabel property setter that sets it on the inner button, ElementInternals, or delegatesFocus approach — all add component complexity

#### [Gotcha] aria-disabled='true' on an anchor element does NOT remove it from tab order — <a aria-disabled='true'> without tabindex='-1' remains keyboard-focusable, violating WCAG 2.1.1 (2026-03-05)
- **Situation:** Disabled anchor-mode buttons (href + disabled) use aria-disabled to communicate disabled state semantically, but unlike native <button disabled>, anchor elements have no native mechanism to suppress focus
- **Root cause:** aria-disabled is the correct semantic signal for disabled state on non-button elements, but it only affects the accessibility tree — not browser focus behavior
- **How to avoid:** Must pair aria-disabled with tabindex='-1' to fully disable; forgetting one of the two creates a partial fix that either blocks mouse but not keyboard, or removes focus but not semantics

### Form association via formAssociated=true and attachInternals() is the correct pattern for custom element buttons — native <button disabled> is used in button mode (not aria-disabled) for correct ARIA semantics (2026-03-05)
- **Context:** Custom elements participating in forms need ElementInternals for setFormValue(), setValidity(), and form submission — aria-disabled is explicitly avoided in button mode in favor of native disabled attribute
- **Why:** Native <button disabled> is automatically excluded from form submission and keyboard focus without additional code; aria-disabled requires manual handling of both. ARIA spec recommends native semantics over ARIA equivalents when available
- **Rejected:** aria-disabled on inner button — would require manual tabindex management, form submission prevention, and would not integrate with native form validation APIs
- **Trade-offs:** ElementInternals is well-supported in modern browsers but requires polyfill for older targets; native disabled precludes certain styling flexibility
- **Breaking if changed:** Switching to aria-disabled on inner button would require reimplementing form submission gating (currently implicit) and focus management

#### [Gotcha] Double opacity stacking occurs when both `:host([disabled])` and `.button[disabled]` apply the same opacity token — the values multiply (e.g., 0.5 × 0.5 = 0.25) instead of applying once (2026-03-06)
- **Situation:** Disabled state styling was applied at both the host element level and the internal button element level
- **Root cause:** Developers applying defensive CSS at multiple levels without realizing CSS opacity is multiplicative across the DOM tree
- **How to avoid:** Double application causes visually broken disabled state at ~25% opacity instead of intended ~50%

#### [Gotcha] CSS hover strategy is inconsistent across variants: base `.button:hover` applies `filter: brightness(0.9)`, but some variants also override `--hx-icon-button-bg` on hover — causing double-darkening on those variants (2026-03-06)
- **Situation:** Multiple developers adding hover states at different abstraction levels without a unified strategy
- **Root cause:** The filter approach was added globally as a quick solution; per-variant color overrides were added later without removing the global filter
- **How to avoid:** Danger variant hover shows danger-600 color at 90% brightness (double-darkened), creating visual inconsistency that's hard to debug

#### [Pattern] Exposing CSS custom properties (tokens) for internal styling without first-class shape variants forces consumers to reach into internal implementation details — `--hx-icon-button-border-radius` exists but no `shape='circle'` property, coupling consumer code to internal token names (2026-03-06)
- **Problem solved:** Circular icon buttons are a common healthcare UI toolbar pattern; without a shape prop, consumers must know the internal token name
- **Why this works:** Token exposure was treated as sufficient configurability, avoiding the need to define and maintain shape variants
- **Trade-offs:** Token-only approach: flexible but leaks internals. Shape prop approach: cleaner API, enables documentation and validation, but requires maintaining variant definitions

#### [Gotcha] ::slotted() CSS rules and prefers-reduced-motion targeting slotted elements are no-ops for transitions defined inside the slotted element's own Shadow DOM (2026-03-06)
- **Situation:** hx-button-group has a prefers-reduced-motion rule targeting ::slotted(*) to suppress button transitions, but hx-button defines its transitions inside its own Shadow DOM
- **Root cause:** ::slotted() selectors only match the top-level slotted element itself, not its Shadow DOM internals. The transition property on ::slotted(*) is overridden by hx-button's own shadow styles.
- **How to avoid:** Shadow DOM encapsulation is a security/isolation benefit but makes cross-component style coordination impossible without deliberate API exposure (custom properties or parts)

#### [Gotcha] :first-child:last-child CSS specificity collision: when two rules target the same element (one for :first-child, one for :last-child), the last rule in source order wins, producing incorrect border-radius on a solo button (2026-03-06)
- **Situation:** hx-button-group needs full border-radius on a single button but uses separate :first-child and :last-child selectors with different border-radius values
- **Root cause:** The :first-child:last-child combined selector (or :only-child) must be used to create a higher-specificity rule that overrides both individual rules, or the single-child case must be handled with an :only-child selector placed after both
- **How to avoid:** Easy fix with :only-child, but the bug is invisible in most stories because they always use 2+ buttons

### role=group vs role=toolbar is a meaningful ARIA distinction: toolbar requires roving tabindex and arrow-key navigation per WAI-ARIA spec, while group does not — choosing the wrong one either over-promises (toolbar without keyboard nav) or under-delivers (group misses expected keyboard UX) (2026-03-06)
- **Context:** hx-button-group uses role=group but the component is semantically a toolbar (a container of interactive controls)
- **Why:** WAI-ARIA recommends role=toolbar for groups of interactive controls; AT users expect arrow-key navigation within toolbars. role=group is correct for non-interactive groupings.
- **Rejected:** Keeping role=group: technically valid but fails AT user expectations for keyboard navigation; screen readers announce it differently
- **Trade-offs:** role=toolbar requires implementing roving tabindex (significant JS complexity); role=group requires no keyboard management but disappoints power users and fails strict a11y audits
- **Breaking if changed:** Switching to role=toolbar without implementing roving tabindex creates an accessibility regression — AT announces toolbar but arrow keys don't work, which is worse than role=group

#### [Gotcha] CSS selector `:host(:not([orientation]))` is dead code when the attribute has `reflect: true` and a default value (2026-03-06)
- **Situation:** hx-divider had a fallback CSS rule for when `orientation` attribute was absent, but the property was defined with `reflect: true` and default `'horizontal'`
- **Root cause:** When a LitElement property has `reflect: true`, the attribute is written to the DOM on initialization, meaning the attribute is always present — the `:not([orientation])` selector can never match
- **How to avoid:** Removing it makes the CSS simpler and honest, but requires trusting that LitElement's reflect mechanism works correctly on initialization

#### [Pattern] Use `firstUpdated()` lifecycle hook alongside `slotchange` event to detect initial slotted content (2026-03-06)
- **Problem solved:** `slotchange` only fires when slot content changes after render — it does not fire for content that exists on initial render
- **Why this works:** Without `firstUpdated()`, a slot that has content from the start would never trigger the handler, leading to incorrect initial state
- **Trade-offs:** Adds a lifecycle method but makes slot detection reliable across both initial and dynamic content scenarios

### Use `e.target as HTMLSlotElement` in slotchange handler instead of `querySelector` to find the slot (2026-03-06)
- **Context:** Original `_slotChangeHandler` called `this.renderRoot.querySelector('slot')` to find the slot element
- **Why:** `e.target` is the exact slot element that fired the event — no DOM query needed. Using `querySelector` is fragile (finds first slot regardless of which fired), slower, and ignores the event's built-in reference
- **Rejected:** Keeping `querySelector` — rejected because it would break for components with multiple named slots where different slots need different handling
- **Trade-offs:** Using `e.target` is more correct and performant, but requires casting to `HTMLSlotElement` which needs developer awareness
- **Breaking if changed:** If the handler is ever called outside a slotchange event context (e.g., manually), `e.target` would be wrong — but that's an anti-pattern anyway

### Hardcoded pixel fallbacks in three-tier CSS `var()` cascade are intentional last-resort values, not laziness (2026-03-06)
- **Context:** PR review questioned hardcoded values like `var(--hx-divider-thickness, var(--hx-border-width, 1px))` in the styles
- **Why:** The three-tier cascade provides: (1) component-level override token, (2) system-wide design token, (3) absolute hardcoded fallback. The hardcoded value ensures the component renders correctly even when the design token system hasn't loaded or tokens are missing
- **Rejected:** Removing the hardcoded fallback — rejected because it would cause invisible or broken dividers in environments where tokens aren't loaded (SSR, token load failures, storybook without theme provider)
- **Trade-offs:** Hardcoded fallbacks create a maintenance burden if the design system changes defaults, but provide resilience against token system failures
- **Breaking if changed:** Removing hardcoded fallbacks means the component has undefined appearance when neither component-level nor system-level tokens are present

### Exposed CSS parts (base, label, value, actions) and design tokens (--hx-structured-list-* custom properties) instead of relying on CSS inheritance. Parts allow styling from outside component. (2026-03-06)
- **Context:** Component needed to be styled to match design system while maintaining encapsulation. Multiple story variants (Bordered, Condensed, Striped) required independent styling hooks.
- **Why:** CSS parts break encapsulation wall in controlled way - consumers can target specific internal elements without relying on assumptions about DOM structure. Design tokens allow theme consistency without hardcoding colors/spacing.
- **Rejected:** Pure shadow DOM encapsulation (no external styling hooks - difficult for consumers to customize). Slots for entire styled sections (reduces flexibility, increases component complexity).
- **Trade-offs:** CSS parts are more flexible but create a public contract - changing internal DOM structure breaks consumer styles. Design tokens add setup overhead but enable theme switching.
- **Breaking if changed:** If CSS parts are renamed or internal elements removed, all consumer CSS targeting those parts breaks. If design tokens default values change, themes relying on old defaults break.

### WCAG 2.2.2 compliance implemented via explicit play/pause toggle button rather than relying solely on hover/focus pause (2026-03-06)
- **Context:** Autoplay carousels must give users a mechanism to pause, stop, or hide moving content per WCAG Success Criterion 2.2.2
- **Why:** Hover and focus pausing are interaction-dependent — keyboard-only and motor-impaired users may not be able to hover; the toggle button provides a persistent, always-visible control
- **Rejected:** Hover/focus-only pausing — fails WCAG 2.2.2 for users who cannot trigger hover or cannot maintain focus on the carousel
- **Trade-offs:** Adds a UI element to the navigation bar that must be styled; increases DOM complexity
- **Breaking if changed:** Removing the toggle button without an alternative pause mechanism would make the component WCAG non-compliant

#### [Gotcha] :host-context() CSS pseudo-class is unsupported in Firefox and removed from CSS spec — any component using it for parent-context styling is silently broken in non-Chromium browsers (2026-03-06)
- **Situation:** hx-list-item used :host-context(hx-list[variant='interactive']) to apply hover/focus/cursor styles when inside an interactive list. Works in Chrome/Safari but completely absent in Firefox.
- **Root cause:** Developer likely used :host-context() because it's the 'standard' way to style a shadow DOM child based on ancestor context without JS
- **How to avoid:** CSS-only approach is simpler but browser-incompatible. JS-based attribute propagation adds coordination logic but works everywhere.

#### [Gotcha] ARIA ownership (role=listbox owning role=option) cannot cross a double Shadow DOM boundary — screen readers cannot associate options with their listbox parent (2026-03-06)
- **Situation:** hx-list renders role=listbox in its shadow root; hx-list-item renders role=option in its own separate shadow root. ARIA requires formal ownership but the DOM boundary prevents it.
- **Root cause:** Composing list and list-item as separate custom elements is natural for encapsulation, but ARIA accessibility tree doesn't respect shadow boundaries for ownership relationships
- **How to avoid:** Separate elements = better composability and encapsulation. Single shadow = better ARIA but loses consumer flexibility to slot custom items.

### CSS custom property fallbacks using hardcoded hex values instead of higher-level token references will silently drift when token values change (2026-03-06)
- **Context:** hx-list-item.styles.ts uses fallbacks like var(--hx-color-text-primary, #0f172a). If the design token system updates --hx-color-text-primary to a different value, the fallback stays at the old hex.
- **Why:** Hardcoded hex fallbacks are the path of least resistance and work in environments where tokens aren't loaded
- **Rejected:** Reference a guaranteed-present base token as fallback; or document that components require token stylesheet to be loaded and have no fallback
- **Trade-offs:** Hex fallbacks ensure something renders in token-less environments but create hidden drift risk. No fallback is more honest about the dependency.
- **Breaking if changed:** In token-less environments (e.g. isolated component testing, email renders) removing hex fallbacks causes invisible/unstyled text

#### [Gotcha] Placing <a> inside role=option creates invalid ARIA — interactive content (links) cannot be children of option roles, causing AT behavior to be undefined (2026-03-06)
- **Situation:** hx-list-item supports an href prop that renders an anchor tag inside the shadow DOM while the host element has role=option for listbox pattern.
- **Root cause:** Combining link navigation and list selection seems like a reasonable UX pattern — click to navigate, but also selectable in listbox context
- **How to avoid:** Native anchor gives free keyboard focus, right-click/open-in-new-tab behavior. But it creates an ARIA validity violation that screen readers handle inconsistently.

#### [Gotcha] CSS indeterminate spinner keyframe values hardcoded against a specific SVG geometry break visually when strokeWidth is changed by users (2026-03-06)
- **Situation:** hx-progress-ring animation uses gap value 200 against circumference ~301 (strokeWidth=4 default). At strokeWidth=20, radius shrinks to ~40, circumference drops to ~251, making gap 200 < circumference — the repeating arc becomes prominent and incorrect
- **Root cause:** Hardcoded keyframe values are simpler but only correct for one geometry; the CSS @keyframes block cannot reference component properties or CSS custom properties for stroke-dasharray values
- **How to avoid:** Pure CSS animation is performant and respects prefers-reduced-motion natively, but cannot adapt to property-driven SVG geometry changes

#### [Gotcha] Storybook number controls cannot produce null — a required variant (indeterminate state) is unreachable interactively from the Default story (2026-03-06)
- **Situation:** hx-progress-ring value prop is null for indeterminate state; the Storybook control is type:number which always produces a numeric value, making the ?? null fallback dead code in the controls panel
- **Root cause:** Storybook's built-in number control has no concept of null/undefined — it always coerces to a number or empty string
- **How to avoid:** Fix requires either a separate boolean override control (indeterminate: true/false) or changing control type with documentation, adding UI complexity to stories

#### [Gotcha] Hidden toast components (open=false) remain fully exposed to the accessibility tree because role='status'/'alert' div is always rendered. No aria-hidden is applied when closed. (2026-03-06)
- **Situation:** Web component with boolean 'open' property uses CSS display:none to visually hide, but SR still reads stale content.
- **Root cause:** CSS-only hiding is insufficient for ARIA live regions — the DOM node remains discoverable and its content can be read by screen readers traversing the tree.
- **How to avoid:** Conditional rendering fixes AT exposure but complicates animation (element must exist to animate in). aria-hidden attribute is the minimal-impact fix.

#### [Gotcha] Hover-resume timer resets to full duration instead of remaining duration. A 3000ms toast hovered at 2800ms restarts a full 3000ms on mouseleave. (2026-03-06)
- **Situation:** Auto-dismiss toast pauses on hover/focus to allow user interaction, then resumes on leave.
- **Root cause:** Naive implementation calls _startTimer() with this.duration rather than tracking elapsed time and computing remaining = duration - elapsed.
- **How to avoid:** Tracking _timerStartedAt adds minimal state but requires careful reset on each new open cycle to avoid stale elapsed calculations.

#### [Gotcha] StackTopCenter Storybook story applies inline transform:none, overriding the component's own transform:translateX(-50%) that centers top-center/bottom-center placements. The story demonstrates the component in a broken state. (2026-03-06)
- **Situation:** Story author needed to position the stack within the story viewport and overrode transforms to prevent overflow, unintentionally breaking the centering transform.
- **Root cause:** The component's centering relies on a CSS transform which conflicts with story viewport containment strategies. No story-level abstraction existed to scope positioning without clobbering component transforms.
- **How to avoid:** Inline style overrides in stories are invisible to lint/type-check and can silently misrepresent component behavior to developers evaluating the component.

#### [Gotcha] Shadow DOM cross-root IDREF limitation means aria-controls cannot reference elements across shadow boundaries — intentionally omitted with code comment (2026-03-06)
- **Situation:** hx-popover body has an ID but aria-controls on the trigger cannot reference it because axe-core and AT cannot resolve IDREFs across shadow root boundaries
- **Root cause:** The Shadow DOM spec isolates ID namespaces per root; aria-controls value is an IDREF that must resolve within the same document scope, which it cannot when trigger and body are in different shadow roots
- **How to avoid:** Loses explicit programmatic association between trigger and popover body; gains spec compliance and avoids misleading accessibility tree

#### [Gotcha] role=dialog on popover body requires focus management (focus trap + focus move on open); using it without focus management causes AT to announce a dialog that keyboard users cannot navigate into (2026-03-06)
- **Situation:** hx-popover uses role=dialog universally for all trigger modes including hover, even though dialog semantics imply modal-like focus behavior
- **Root cause:** role=dialog was likely chosen to give the popover semantic weight, but it carries an implicit contract: screen readers instruct users to navigate 'into the dialog', which requires programmatic focus movement
- **How to avoid:** role=tooltip or role=region with aria-label would be semantically weaker but correct; role=dialog with full focus trap is correct but complex and inappropriate for hover/focus trigger modes

#### [Gotcha] Escape key listener on the host element instead of document means it won't fire when focus is elsewhere — e.g., user opens popover via hover, moves mouse away, popover stays open, pressing Escape does nothing (2026-03-06)
- **Situation:** The keydown listener was attached to the custom element host, which only receives keyboard events when it or a descendant has focus
- **Root cause:** Attaching to host is the naive approach; document-level listener with cleanup on disconnect is required for keyboard shortcuts that should work regardless of focus location
- **How to avoid:** Document-level listener requires careful cleanup in disconnectedCallback to avoid memory leaks; must also check if the popover is open before acting

#### [Gotcha] Hidden popover body must use the inert attribute, not just CSS display:none or visibility:hidden, to prevent keyboard Tab traversal into hidden content (2026-03-06)
- **Situation:** hx-popover hides the body visually but without inert, keyboard users can Tab into interactive elements inside the hidden popover — they become invisible but focusable
- **Root cause:** CSS hiding removes visual presence but not DOM presence in the tab order; inert removes both focusability and AT discoverability in one attribute
- **How to avoid:** inert is now broadly supported (Chrome 102+, Firefox 112+, Safari 15.5+); adds one attribute toggle to show/hide logic

#### [Gotcha] Arrow element rendered as rotated square needs border sides facing the popover body zeroed out per placement; failing to do so shows a visible inner border line cutting through the popover edge (2026-03-06)
- **Situation:** CSS arrow trick uses rotate(45deg) on a square div with border; the two sides facing inward toward the popover body must be transparent or the diamond outline is fully visible
- **Root cause:** The rotation maps different physical border sides to visual positions depending on placement direction; each placement requires a different pair of border sides set to transparent
- **How to avoid:** Rotated square arrow is visually richer (can inherit box-shadow) but requires placement-aware border side suppression logic that must be kept in sync with Floating UI placement values

### CSS part names (button, panel) diverge from feature spec (trigger, menu), creating a public API mismatch that silently breaks consumer stylesheets targeting ::part(trigger) or ::part(menu) (2026-03-06)
- **Context:** CSS parts are a published component contract — once consumers write ::part(trigger) selectors against documented API, renaming parts is a breaking change
- **Why:** Part names should be locked to the spec before any consumer adoption; the mismatch suggests implementation proceeded without cross-checking the spec's public API surface
- **Rejected:** Keeping mismatched names avoids a code change but permanently diverges implementation from spec, making documentation misleading
- **Trade-offs:** Renaming to spec names (trigger/menu) is a breaking change for any consumers who adopted the wrong names; fixing early (pre-release) is free
- **Breaking if changed:** Any consumer stylesheet using ::part(button) or ::part(panel) breaks if renamed to match spec; any consumer targeting ::part(trigger) or ::part(menu) currently silently fails

#### [Gotcha] outline-offset: -2px on slotted focus-visible menu items draws focus ring inside the element border box, making it invisible where adjacent items share the same background — WCAG 1.4.11 risk (2026-03-06)
- **Situation:** In a vertical menu list, items are stacked flush; an inset focus outline is obscured by the border of the item above/below, making the focus indicator non-perceivable
- **Root cause:** Negative outline-offset is commonly used inside containers with overflow:hidden to avoid clipping, but in menu item context it trades clipping avoidance for indicator invisibility
- **How to avoid:** Negative offset prevents overflow clipping but fails contrast/perceivability requirements on stacked items; zero offset is the WCAG-safe default

#### [Gotcha] Lit boolean attribute pattern (pulse presence = true) is a footgun for Drupal/Twig authors who expect pulse='false' to disable the feature (2026-03-06)
- **Situation:** Lit boolean attributes follow HTML spec: attribute presence enables, absence disables. pulse='false' in HTML still sets the attribute as present, enabling pulse
- **Root cause:** This is correct Lit/HTML behavior — boolean attributes work by presence, not value
- **How to avoid:** Correct Web Component behavior vs. Drupal author ergonomics; pulse='false' silently enables pulse rather than disabling it, a non-obvious failure mode

### role='img' placed on shadow DOM child div rather than host element via ElementInternals.role (2026-03-06)
- **Context:** Component needed ARIA role for screen reader announcement of status indicator
- **Why:** Direct attribute assignment on shadow child is simpler and works without ElementInternals API support checks
- **Rejected:** ElementInternals.role on the host element — more robust (ARIA role exposed on the custom element itself, not buried in shadow DOM), but requires feature detection and polyfill consideration
- **Trade-offs:** Shadow child role works but is less accessible-tree-robust; ElementInternals approach exposes semantics at the custom element level which assistive technologies can more reliably traverse
- **Breaking if changed:** Changing to ElementInternals requires refactoring property initialization and adds browser support considerations for older AT combinations

#### [Gotcha] Using <span slot="label"> without a corresponding `label` attribute on the host element causes the accessible name to fall back to the numeric value (e.g., '45 of 200') instead of the visible slot text, violating WCAG 2.5.3. (2026-03-06)
- **Situation:** hx-meter component supports both a `label` attribute and a named slot for label content. When only the slot is used, the aria-label computation ignores slot content and falls back to the numeric aria-valuenow/aria-valuemax string.
- **Root cause:** Shadow DOM slots are not traversed by the accessible name computation algorithm in the same way visible text is — the browser's accName algorithm does not pierce shadow roots for slotted content unless explicitly mapped.
- **How to avoid:** Slot-based labels give flexible visual rendering but break accessible name computation; attribute-based labels are less flexible visually but reliably surfaced to AT.

#### [Gotcha] Storybook story controls that are declared in `argTypes` but not destructured and bound in the render function silently do nothing — the UI shows interactive controls that have zero effect on the rendered component. (2026-03-06)
- **Situation:** hx-meter Default story declared `low`, `high`, and `optimum` in argTypes but the render function did not spread or bind these args to the component element.
- **Root cause:** Storybook does not warn when declared args are unused in the render function; the controls panel renders based on argTypes metadata alone, independent of render function consumption.
- **How to avoid:** Explicit render functions give full control but create a silent failure mode where argTypes and render can desync without any build or lint error.

### Exposing CSS parts as `part="indicator"` when the audit contract specifies `fill` creates a documented naming divergence that is not a blocker but must be an explicit decision, not an oversight. (2026-03-06)
- **Context:** The hx-meter audit requirements listed expected CSS parts as (track, fill, label). The implementation used `part="indicator"` for the fill bar. The track div had no part attribute at all.
- **Why:** Component authors likely chose `indicator` as a more semantically neutral term (works for both progress and meter semantics), but this diverges from the documented public API contract.
- **Rejected:** Silent non-compliance — if the naming divergence is not documented, consumers building against the spec will get `::part(fill)` selectors that simply fail silently with no error.
- **Trade-offs:** Using spec-matching names (`fill`) aligns with documentation but may be less semantically accurate; using `indicator` is more precise but breaks the documented customization contract.
- **Breaking if changed:** Any consumer stylesheet using `::part(fill)` or `::part(track)` will silently fail — no browser warning, no build error, just unapplied styles.

#### [Pattern] Semantic meter state (optimum/suboptimal/danger) must be communicated via `aria-valuetext` to screen readers — setting only `aria-valuenow` surfaces the number but not the clinical meaning, which is the primary information in healthcare contexts. (2026-03-06)
- **Problem solved:** hx-meter computes a _resolveState() result used for visual color coding (CSS data-state attribute) but never exposes this semantic state through ARIA. Screen readers announce '45 of 200' with no indication of whether this is good, warning, or critical.
- **Why this works:** ARIA meter role only mandates aria-valuenow, aria-valuemin, aria-valuemax — the semantic meaning of the value relative to optimum is not part of the base ARIA spec and must be authored explicitly via aria-valuetext.
- **Trade-offs:** Generating aria-valuetext automatically from the component state removes authoring burden but couples the component's SR output to its internal state logic; authors lose control over the exact SR announcement wording.

### Audit branch reads implementation files via `git show <commit>:path` rather than checking out the implementation branch, preserving the clean separation between audit and implementation branches (2026-03-06)
- **Context:** Antagonistic review must not be contaminated by the implementation branch's git history or working tree state; audit branch was created before implementation merged
- **Why:** Using `git show` to read files from another commit/branch is non-destructive and keeps the audit branch history clean — the AUDIT.md commit log shows only audit work, not implementation code
- **Rejected:** Checking out the implementation branch and then switching back would mix concerns in git history and risk accidentally committing implementation code on the audit branch
- **Trade-offs:** Read-only cross-branch file access is slightly less ergonomic (no editor tooling, no local file navigation) but maintains strict separation of concerns in the PR graph
- **Breaking if changed:** If the implementation commit SHA is not pinned in the audit, future rebases or force-pushes on the implementation branch would make the audit results impossible to reproduce

#### [Gotcha] aria-modal="false" on a dialog element is semantically incorrect — screen readers interpret this as 'not a modal' and won't restrict virtual cursor navigation, defeating the dialog pattern (2026-03-06)
- **Situation:** Component implemented role="dialog" with aria-modal="false" thinking this was a non-modal popover, but the aria-modal attribute controls screen reader virtual cursor containment, not visual modality
- **Root cause:** Developer likely confused visual modality (does it block background interaction?) with the aria-modal semantic (should AT restrict navigation to this region?)
- **How to avoid:** Setting aria-modal="true" requires a working focus trap or screen reader users can navigate outside while AT thinks they cannot

### aria-controls should always be present on a trigger button regardless of popover open/closed state, referencing a persistently-rendered (but hidden) controlled element (2026-03-06)
- **Context:** Component removes aria-controls when popover is closed because the popover element is conditionally rendered (returns nothing when closed), making the reference invalid
- **Why:** ARIA spec intends aria-controls to describe a persistent relationship between controller and region. Conditional rendering breaks this contract.
- **Rejected:** Current approach: conditionally set aria-controls only when element exists in DOM — technically avoids broken reference but diverges from sibling component patterns and requires re-explanation in every review
- **Trade-offs:** Always rendering the popover element (with hidden/inert) increases DOM size slightly but enables persistent aria-controls and simplifies ARIA relationship maintenance
- **Breaking if changed:** If popover stays conditionally rendered, aria-controls pattern cannot be fixed without architectural change to rendering strategy

#### [Gotcha] CMS-driven attribute values (e.g. from Drupal editors) bypass TypeScript union type safety entirely — invalid placement/size values are silently passed to Floating UI which exhibits undefined behavior (2026-03-06)
- **Situation:** placement and size props typed as union literals in TypeScript, but HTML attributes set from Drupal CMS templates are strings that arrive at runtime with no type checking
- **Root cause:** TypeScript types only protect JavaScript consumers; HTML attribute consumption path has no runtime guard
- **How to avoid:** Runtime validation with console.warn adds a small overhead and code size but prevents silent layout failures in production CMS environments

#### [Pattern] Storybook FormFieldDemo stories that use inline styles with hardcoded hex colors actively teach wrong patterns to implementors who use stories as reference implementations (2026-03-06)
- **Problem solved:** Demo story used inline style attributes with raw hex colors (#111827, #374151) and pixel values to create a realistic-looking form field context around the component
- **Why this works:** Fastest way to create a realistic demo without setting up the full token infrastructure in Storybook
- **Trade-offs:** Inline style demos are faster to write but become anti-pattern documentation; implementors copy the pattern into production code

### Focus trap is architecturally required when aria-modal="true" is set on a dialog — without it, sighted keyboard users can Tab out while screen readers think focus is contained, creating divergent experiences (2026-03-06)
- **Context:** hx-contextual-help popover has no focus trap. Combined with the aria-modal semantics issue, keyboard and screen reader users get different navigation behaviors.
- **Why:** Focus trap was not implemented — likely deemed unnecessary for a 'tooltip-like' component, but the dialog role demands it per APG patterns
- **Rejected:** Relying on Escape key alone for keyboard dismissal — insufficient; Tab must also be intercepted or wrapped
- **Trade-offs:** Focus trap implementation requires intercepting Tab/Shift+Tab and cycling through focusable elements inside shadow DOM, which is non-trivial with shadow DOM slot content
- **Breaking if changed:** If aria-modal is corrected to true without adding focus trap, keyboard users are trapped in the AT's virtual perception but can physically Tab out — worse than current state

#### [Gotcha] CSS transform-only slide transitions make aria-live regions non-functional across all screen readers (2026-03-06)
- **Situation:** hx-carousel uses CSS transform to move slides into view without any DOM mutations — the aria-live region never fires because screen readers only observe DOM changes, not visual repositioning
- **Root cause:** Performance optimization — CSS transforms are GPU-accelerated and avoid layout reflow, but this silently breaks all screen reader announcements
- **How to avoid:** Smooth animation is preserved but requires a separate visually-hidden aria-live span whose textContent is imperatively updated on every slide change to compensate

#### [Gotcha] Hardcoded aria-label='Carousel' makes multiple carousel instances on the same page indistinguishable to screen readers (2026-03-06)
- **Situation:** When two or more carousels exist on a page, assistive technology landmark navigation lists them both as 'Carousel' with no differentiator — violates WCAG 1.3.1
- **Root cause:** Simpler initial implementation — a static label avoids requiring consumers to pass a label prop
- **How to avoid:** A defaulted property (label = 'Carousel') with host binding allows opt-in override without breaking change, but the default itself is still inaccessible in multi-carousel layouts

#### [Pattern] Inline SVG icons re-parsed on every render call instead of being hoisted to module-level constants (2026-03-06)
- **Problem solved:** hx-carousel.ts inlines SVG strings inside the render/template method, causing the browser to re-parse identical SVG markup on every re-render triggered by property changes
- **Why this works:** Convenience during initial development — co-locating markup with the template is readable
- **Trade-offs:** Negligible cost for low-frequency renders but compounds in animated/autoplay carousels where renders fire on every slide transition tick

### CSS parts exported as 'base' and 'scroll-container' don't match the spec-required 'carousel', 'prev-btn', 'next-btn' names — breaking the public styling API contract (2026-03-06)
- **Context:** Consumers who follow the component spec to style ::part(carousel) get no style application; the actual part is named 'base', silently failing with no error
- **Why:** Implementation diverged from spec during development without a validation step comparing exported parts against the API contract
- **Rejected:** No automated CEM (Custom Elements Manifest) validation against a spec schema was in place
- **Trade-offs:** Renaming parts to match spec is a breaking change for any consumers already using the wrong names; a deprecation alias period would be needed
- **Breaking if changed:** Any rename of 'base' → 'carousel' immediately breaks consumers who adopted the undocumented but functional 'base' part name

### void this._reposition() is the correct fire-and-forget pattern for calling async methods from synchronous event handlers in Lit web components (2026-03-06)
- **Context:** PR review flagged the void keyword usage as potentially suspicious; was evaluated and confirmed correct
- **Why:** Event handlers in Lit (e.g., slotchange) are synchronous; awaiting an async method from them is not possible without making the handler async (which has no effect on event dispatch). Explicitly discarding the promise with void signals intentional fire-and-forget and silences TypeScript/linting warnings about unhandled promises
- **Rejected:** Making the handler async — has no practical effect since the event system doesn't await handlers; just adds noise
- **Trade-offs:** Promise rejection in _reposition() becomes unhandled; must ensure _reposition() has its own internal error handling
- **Breaking if changed:** Nothing breaks if void is removed, but TypeScript/eslint will flag the floating promise

#### [Gotcha] aria-current='step' must be placed on the role='listitem' host element, not on an inner indicator div inside shadow DOM (2026-03-06)
- **Situation:** hx-step component placed aria-current on an inner decorative div within the shadow DOM template rather than on the custom element host itself
- **Root cause:** Screen readers traverse the accessibility tree which maps to the DOM's ARIA roles. The listitem role is on the host element — aria-current on a shadow-DOM-internal div is not associated with the listitem in the AT's view, producing incorrect or missing announcement
- **How to avoid:** Placing aria-current on the host means CSS must use :host([aria-current]) selector instead of a class/attribute on inner elements — slightly more verbose but semantically correct

#### [Gotcha] Internal parent-managed props (orientation, size) reflected as public attributes on child component create Drupal SSR hydration flash and unintended public API surface (2026-03-06)
- **Situation:** hx-steps parent syncs orientation/size to hx-step children via _syncChildren(). Those props use reflect:true, making them settable via HTML attributes by external authors
- **Root cause:** reflect:true was likely used so CSS :host([orientation='vertical']) selectors work inside hx-step's shadow DOM — a common Lit pattern
- **How to avoid:** reflect:true enables clean CSS attribute selectors but exposes internal props in public attribute API, pollutes CEM docs, and allows Drupal templates to set values that get immediately overridden by parent sync — causing a flash of incorrect layout during hydration before upgrade

### Two-component architecture (hx-steps + hx-step) where parent manages all child state via _syncChildren() rather than having children self-manage or use CSS inheritance (2026-03-06)
- **Context:** Steps component needs coordinated state: active index, orientation, size must be consistent across all children
- **Why:** Centralizing state in the parent prevents children from being used incorrectly in isolation and ensures single source of truth for active step index — a child cannot know its own index without parent cooperation
- **Rejected:** CSS custom property inheritance would allow children to inherit orientation/size without explicit sync, but cannot communicate index position. Slotted children could observe context via event bubbling but that adds complexity. Self-managed children would require consumers to set index/orientation on every child manually
- **Trade-offs:** Parent-managed sync is simple for consumers but creates a hidden contract: hx-step is not usable standalone, internal props are overridden post-upgrade (hydration risk), and the sync must handle dynamic slot changes (which this implementation tested incompletely)
- **Breaking if changed:** Removing _syncChildren() breaks orientation/size/index propagation to all children; children would render with default values

#### [Gotcha] cursor:pointer unconditionally applied to interactive steps with no disabled/non-clickable state creates a false affordance and WCAG 2.1.1 violation when no keyboard handler exists (2026-03-06)
- **Situation:** hx-step shows pointer cursor and fires click events but has no tabindex, no keydown handler, and no role='button' — it appears interactive but is keyboard-inaccessible
- **Root cause:** Visual interactivity (cursor, click) was implemented without the paired keyboard accessibility layer, likely because the custom event dispatch (hx-step-click) worked visually before keyboard requirements were tested
- **How to avoid:** Adding tabindex='0' + keydown handler + role='button' on the host is the minimal fix; a clickable property/attribute gate is needed to distinguish navigable vs display-only steps and conditionally apply cursor and tabindex

#### [Gotcha] Status vocabulary mismatch between spec (current/upcoming) and implementation (active/pending) is a silent consumer-facing API break risk, especially for Drupal field mappings (2026-03-06)
- **Situation:** The component spec documents status values as 'current' and 'upcoming' but the TypeScript implementation uses 'active' and 'pending' as the accepted attribute values
- **Root cause:** Likely the spec was written or updated after implementation, or implementation deviated from spec without updating it — a common drift in multi-developer component libraries
- **How to avoid:** Fixing to match spec requires a breaking attribute value change for any existing consumers; fixing spec to match implementation avoids breakage but perpetuates non-semantic naming ('active' vs 'current' has different connotations in step-flow UX)

### Inline SVG strings in Lit template literals for checkmark/X-mark icons rather than icon slot or external asset reference (2026-03-06)
- **Context:** Complete and error states need iconographic indicators; implementation uses hardcoded SVG path strings directly in the template literal
- **Why:** Inline SVGs guarantee the icon is always present without external asset loading, no flash of missing icon, and no slot complexity for internal state indicators
- **Rejected:** A slot for custom icons was partially implemented (WithCustomIcon story) but the default state icons are still inline. An icon component/token import would centralize icon management
- **Trade-offs:** Inline SVG paths are not tree-shakeable — every consumer bundles the SVG bytes even if they override with a slot. The bytes are small but not zero. The SVGs are aria-hidden with no fallback text, meaning status is visually-only for AT users — a separate P1 finding
- **Breaking if changed:** Removing aria-hidden from SVGs without adding proper labels would cause screen readers to announce raw SVG title/desc or path data; adding visually-hidden status text is the correct fix alongside aria-hidden

#### [Gotcha] shadowRoot.activeElement returns the actually-focused element (e.g., a sort <button> inside a <th>), not the cell ancestor — grid keyboard navigation that calls cells.indexOf(shadowRoot.activeElement) silently returns -1 and navigation no-ops entirely (2026-03-06)
- **Situation:** Implementing arrow-key grid navigation in a Web Component where sortable column headers render a <button> inside <th>
- **Root cause:** The DOM focus model is precise: activeElement is the button, not the th. indexOf fails because the cells NodeList contains th/td elements only, not their descendants
- **How to avoid:** Walking up the DOM (element.closest('th, td')) adds a traversal step but correctly resolves focus regardless of internal cell complexity

#### [Gotcha] aria-sort must be OMITTED entirely from non-sortable column headers, not set to aria-sort='none' — setting aria-sort='none' on non-sortable headers misrepresents their semantic role and violates WAI-ARIA spec (2026-03-06)
- **Situation:** Applying aria-sort to all <th> elements uniformly for simplicity
- **Root cause:** WAI-ARIA spec: aria-sort is only valid on columns that ARE sortable. Applying aria-sort='none' incorrectly signals to AT that the column CAN be sorted but currently isn't
- **How to avoid:** Conditional aria-sort adds a branch in rendering but produces correct AT announcements

#### [Gotcha] CSS part names in implementation (tr/td/th) differed from spec (row/cell/header) — consumer style overrides written against the spec will silently fail because ::part() selectors are exact-match only (2026-03-06)
- **Situation:** Naming CSS exported parts in a Web Component — developer used HTML element names as part names instead of semantic names from the design spec
- **Root cause:** CSS ::part() selectors require exact name match; there is no fallback or fuzzy matching. A mismatch between documented and implemented part names means all consumer overrides written against documentation silently do nothing
- **How to avoid:** Semantic part names decouple the CSS API from internal markup, allowing internal HTML changes without breaking consumer overrides

#### [Gotcha] JSDoc token fallback value (neutral-400) disagreed with actual CSS fallback (neutral-600) — Custom Elements Manifest and generated design token docs will advertise the wrong default, causing visual surprises when consumers omit the token (2026-03-06)
- **Situation:** Documenting CSS custom property fallback values in JSDoc for CEM generation
- **Root cause:** CEM tooling reads JSDoc annotations to generate component API docs; the CSS source of truth and the doc annotation can drift independently with no compile-time check
- **How to avoid:** Automated CEM generation from JSDoc is efficient but creates a two-source-of-truth problem for CSS values

#### [Pattern] JSON string coercion in willUpdate is the correct mechanism for passing complex data (arrays/objects) to Web Components from Drupal Twig templates — HTML attributes are strings only, so JSON.parse in willUpdate enables attribute-based data passing without JS glue code (2026-03-06)
- **Problem solved:** Drupal Twig cannot set JS array/object properties on Web Components; it can only set HTML attribute strings
- **Why this works:** Drupal renders server-side HTML; it cannot call element.rows = [...] imperatively. Serializing to JSON and deserializing in willUpdate bridges the server-render/client-component gap without requiring a Drupal behavior for data passing
- **Trade-offs:** JSON coercion adds parse overhead and requires graceful error handling (fallback to []); without documentation, Drupal developers won't know this is the integration path

#### [Gotcha] CSS `[hidden]` attribute relies on UA stylesheet `display: none` which modern CSS resets (Tailwind preflight, modern-normalize) remove globally. Inside Shadow DOM the UA stylesheet still applies — making it 'currently safe but fragile' — until shadow-piercing resets are added by the host page. (2026-03-06)
- **Situation:** Conditionally hiding the drawer footer slot using `?hidden=${!this._hasFooterSlot}` without an explicit CSS rule.
- **Root cause:** Shadow DOM isolates styles, so the UA `[hidden] { display: none }` rule applies inside shadow roots even when the host page uses a CSS reset. This creates a false sense of safety.
- **How to avoid:** Adding `[hidden] { display: none !important; }` to component styles is a one-liner that eliminates the fragility permanently. The `!important` is necessary to beat any specificity from host page styles that might pierce shadow DOM.

#### [Gotcha] hx-menu-divider uses role=separator which WAI-ARIA requires to be a direct child of role=menu, role=menubar, or role=listbox. When rendered in isolation (Storybook stories, unit tests), axe-core will report required-context-role violations that are false positives in isolation but real violations if the component is used outside a menu context. (2026-03-06)
- **Situation:** WCAG 2.1 AA compliance validation in healthcare application where accessibility failures carry regulatory risk
- **Root cause:** Component was designed assuming it would always be used inside hx-menu, but the required ARIA parent context is not enforced or documented
- **How to avoid:** Simpler component implementation vs. risk of misuse and CI accessibility failures in isolated story/test contexts

### CSS part names diverged from design spec (base/action/close-button vs bar/actions/close) without documentation, creating a permanent mismatch between implementation and design handoff artifacts (2026-03-06)
- **Context:** Design spec named parts: bar, icon, message, actions, close. Implementation chose base, icon, message, action, close-button — arguably more consistent with library conventions (hx-alert uses part='base')
- **Why:** Library-internal consistency was prioritized over spec fidelity — 'base' as the root part name is the library convention, 'close-button' is more descriptive than 'close'
- **Rejected:** Following the spec exactly would have created inconsistency with other components in the library
- **Trade-offs:** Library consistency wins short-term developer familiarity; spec deviation means design tokens, CSS custom property docs, and Figma annotations pointing to ::part(bar) will silently fail
- **Breaking if changed:** Any consumer CSS using ::part(bar), ::part(actions), or ::part(close) will not match — zero error, silent visual regression

#### [Gotcha] Hardcoded hex fallbacks in CSS custom property declarations (var(--token, #hexvalue)) create a maintenance trap: the fallback silently masks missing tokens and diverges from the actual design system values when tokens change (2026-03-06)
- **Situation:** 17 hardcoded hex values used as fallbacks throughout hx-message-bar.styles.ts, violating the component library's zero-hardcoded-values rule
- **Root cause:** Fallbacks feel defensive and helpful during development but become permanent technical debt — they hide misconfigured token environments instead of surfacing them
- **How to avoid:** With fallbacks: component 'works' in poorly-configured environments but displays wrong colors silently; without fallbacks: missing tokens cause obvious visual breakage that forces fixes

### color-mix() in CSS introduces a Baseline 2023 feature that may not work in enterprise-embedded Chromium or WebKit used in patient portal apps, with no fallback (2026-03-06)
- **Context:** close button hover uses color-mix(in srgb, currentColor 10%, transparent) — elegant one-liner that dynamically tints any foreground color for hover, but requires modern browser support
- **Why:** color-mix() elegantly solves the problem of hover tinting arbitrary theme colors without knowing the specific color value at authoring time
- **Rejected:** rgba()-based token alternative — rejected because it requires knowing the color channel values ahead of time, which breaks with dynamic theming
- **Trade-offs:** color-mix() enables true dynamic theming but requires browser support verification; rgba() fallback is universally supported but requires static color knowledge
- **Breaking if changed:** In environments without color-mix() support, the hover state silently loses its background tint — no error, degraded but functional UX

#### [Gotcha] aria-pressed is applied to all non-link tiles regardless of semantic intent, creating false toggle semantics for navigation-intent tiles (2026-03-06)
- **Situation:** P1-04 / P2-05: NavigationGrid story tiles emit hx-select toggle events but are visually presented as navigation items; screen readers announce them as toggle buttons
- **Root cause:** Single implementation path was chosen for all interactive tiles rather than branching on semantic intent (toggle vs navigate vs action)
- **How to avoid:** Less code complexity, but incorrect ARIA semantics for non-toggle use cases — fails WCAG 4.1.2 for any tile not used as a literal toggle button

#### [Gotcha] Using href=${args.href || ''} in Storybook always renders href='' on host element due to reflect:true on href property, making every default story tile a self-referential link (2026-03-06)
- **Situation:** P2-06: The empty string fallback combined with property reflection means href='' is always present in DOM even when no href is intended
- **Root cause:** Defensive fallback pattern used to prevent 'undefined' attribute value, but did not account for reflect:true behavior
- **How to avoid:** Simpler template authoring, but produces semantically incorrect HTML that can confuse parsers and AT

#### [Gotcha] ':host { display: inline-block }' combined with '.tile { width: 100% }' creates implicit sizing dependency that collapses in inline contexts (2026-03-06)
- **Situation:** P2-07: The tile appears to fill its container in flex/grid layouts masking the inline-block host, but in inline contexts the host collapses to content width while inner tile attempts 100%
- **Root cause:** inline-block was chosen to allow natural inline flow, but tile content needs to fill available space — these two goals conflict
- **How to avoid:** Works silently in the dominant flex/grid use case but produces confusing layout bugs in inline contexts

#### [Pattern] Hardcoded hex fallbacks (#eff6ff, #bfdbfe) inside CSS custom property var() declarations leak default brand colors into custom themes when token resolution fails (2026-03-06)
- **Problem solved:** P2-13: In a multi-tenant healthcare design system where primary color may not be blue, fallback hex values represent a 'default blue' assumption embedded in component styles
- **Why this works:** Fallback values ensure visible styling even without a theme — common CSS pattern — but the specific values encode brand assumptions
- **Trade-offs:** Guaranteed visual output in unthemed contexts vs incorrect brand color leaking into custom themes

#### [Gotcha] Home key handler in roving tabindex called `_moveFocus('prev')` then immediately overrode with `items[0].focus()`, causing a spurious `.focus()` on the last item before landing on the first (2026-03-06)
- **Situation:** Keyboard navigation implementation for toolbar roving tabindex — Home key should move focus to first item
- **Root cause:** The two-step sequence (move prev + direct focus) was likely a copy-paste error or misunderstanding of the helper's return value; the intermediate focus call fires real browser focus events that assistive technology announces
- **How to avoid:** End visual result is correct (focus lands on first item) but AT users hear an incorrect announcement for the last item before the first — a WCAG 2.1 AA failure invisible to sighted testers

#### [Gotcha] A documented public `overflow` slot API was permanently hidden via a hardcoded `hidden` attribute with zero show/hide logic ever implemented (2026-03-06)
- **Situation:** hx-action-bar exposes an `overflow` slot in its API docs and CEM manifest but the slot wrapper has `hidden` unconditionally in the template
- **Root cause:** Feature was stubbed/scaffolded during initial build but never completed; CEM and docs were generated from the stub, making it appear functional
- **How to avoid:** Consumers who wire up the overflow slot get silent content discard with no error — the API contract is broken but no runtime warning exists

#### [Gotcha] `aria-label` was read via `getAttribute` inside `render()` rather than declared as a Lit `@property`, making it non-reactive to attribute changes after first render (2026-03-06)
- **Situation:** Lit's reactivity system only tracks properties declared with `@property()` or `@state()`; raw `getAttribute` calls in render are not observed by the update lifecycle
- **Root cause:** Developer likely copied a pattern from a non-Lit component or misunderstood Lit's observation model
- **How to avoid:** Works correctly on initial render; silently breaks when any framework (Angular, React wrapper, or dynamic JS) updates the attribute after mount — a subtle defect only visible in dynamic contexts

#### [Gotcha] Roving tabindex focusable-item selector used standard CSS attribute selectors that cannot discover custom elements like `hx-button` whose focusable behavior is internal to their shadow DOM (2026-03-06)
- **Situation:** Components like `hx-button` render their actual `<button>` inside shadow DOM; from the light DOM they appear as a non-focusable custom element tag
- **Root cause:** Standard `:focus`, `[tabindex]`, `button`, `input` selectors only reach light DOM; shadow DOM internals are not pierced by the host component's querySelector
- **How to avoid:** Works perfectly for native HTML interactive elements placed in slots; silently excludes all design-system custom elements from keyboard navigation

### Used `sticky: boolean` property instead of `position: 'top' | 'bottom' | 'sticky'` enum, making bottom-sticky bars architecturally impossible (2026-03-06)
- **Context:** Spec required a `position` property to support both top and bottom sticky positioning for different form layouts in the healthcare app
- **Why:** Likely a simplification during initial implementation — boolean is simpler than an enum when only the top-sticky case was being built
- **Rejected:** Three-value enum `'top' | 'bottom' | 'sticky'` (or `'top' | 'bottom' | 'top-sticky' | 'bottom-sticky'`) which would support all layout contexts
- **Trade-offs:** Simpler initial API; but bottom-of-form action bars (common in multi-step healthcare forms) require a different component or a breaking API change later
- **Breaking if changed:** Changing `sticky: boolean` to `position: string` is a breaking change for all consumers; requires a deprecation cycle

### No `scroll-padding-top` compensation was documented or provided as a CSS custom property for the sticky action bar, causing anchor navigation to scroll content behind the bar (2026-03-06)
- **Context:** Healthcare forms use section anchor links for navigation; when a sticky bar sits at `top: 0`, browser scroll-to-anchor positions content exactly at the viewport top, hidden behind the bar
- **Why:** The sticky positioning was implemented without considering the downstream scroll context effect
- **Rejected:** Documenting a `--hx-action-bar-height` CSS custom property that consumers apply as `scroll-padding-top` on their scroll container, or providing a JS utility to auto-compensate
- **Trade-offs:** Simple implementation; but every consumer in an anchor-linked form context silently gets broken navigation with no guidance
- **Breaking if changed:** Adding a documented CSS custom property for height compensation is non-breaking additive change; but consumers must actively adopt it — silent breakage continues until they do

#### [Gotcha] CSS Grid explicit placement (grid-column, grid-row) on child items allows consumers to create visual/DOM order mismatch that violates WCAG 1.3.2 Meaningful Sequence — and Web Components that expose this capability without documentation or guardrails are implicitly accepting the accessibility liability on behalf of consumers. (2026-03-06)
- **Situation:** hx-grid-item exposes column and row attributes that map to grid-column/grid-row. No JSDoc, no story, and no documentation warned that using these can decouple visual order from DOM/tab order.
- **Root cause:** The component correctly doesn't reorder the DOM itself, but by exposing placement attributes it delegates the reordering capability to consumers without guardrails
- **How to avoid:** Full placement flexibility is powerful but transfers accessibility risk to consumers; span-only is safer but limits use cases like magazine layouts

### Hardcoding a default gap value in the :host base CSS rule (pre-hydration fallback) in addition to the :host([gap='md']) rule creates a maintenance hazard: if the default property changes, the base fallback creates a flash of incorrect spacing (2026-03-06)
- **Context:** hx-stack has gap: var(--hx-spacing-md) in the base [part='base'] rule AND a :host([gap='md']) rule — the base rule handles the window before Lit reflects the default attribute
- **Why:** Without the base rule, there's a brief flash of no gap during SSR/pre-hydration before Lit's property reflection sets the attribute and triggers the correct CSS selector
- **Rejected:** Removing the base gap and accepting the pre-hydration flash — simpler but causes visible layout shift on SSR-rendered pages
- **Trade-offs:** No flash vs. silent maintenance hazard: if default gap changes from 'md' to something else, two places must be updated or the flash shows wrong spacing
- **Breaking if changed:** Removing base rule causes visible layout flash in SSR contexts; leaving it undocumented means future developers don't know why both rules exist and may remove one thinking it's a duplicate

### Using display:inline-block on :host([inline]) with display:flex on the inner [part='base'] rather than display:inline-flex is functional but unconventional — the host shrink-wraps correctly but the pattern obscures intent (2026-03-06)
- **Context:** hx-stack's inline mode needed the host to behave as inline while the inner container remained a flex context
- **Why:** inline-block on host + flex on inner achieves the shrink-wrap behavior; inline-flex on host directly would also work but requires CSS cascade handling for the base flex rules
- **Rejected:** inline-flex on [part='base'] when inline — would require an additional attribute-based override of the base display property, more selectors
- **Trade-offs:** Fewer selectors vs. unconventional pattern that confuses future maintainers unfamiliar with the host/inner split
- **Breaking if changed:** Changing to inline-flex on host requires auditing all base flex rules to ensure they still apply correctly under Shadow DOM encapsulation

#### [Gotcha] Web Component `alt` defaulting to empty string makes all images silently decorative — WCAG 1.1.1 violation with no runtime warning (2026-03-06)
- **Situation:** hx-image defined `alt = ''` as default property value in LitElement component
- **Root cause:** Developer likely chose empty string to avoid TypeScript undefined errors and prevent broken attribute rendering
- **How to avoid:** TypeScript stays clean but every consumer who omits alt ships inaccessible images with no warning from browser, linter, or runtime

### `:host { display: inline-block }` is wrong default for block-level image components — causes 4px baseline alignment gap with adjacent text nodes (2026-03-06)
- **Context:** hx-image shadow host styled as inline-block, but production usage is overwhelmingly block-level (heroes, card thumbnails, content images)
- **Why:** inline-block was likely chosen to mirror `<img>` native display, but CSS resets universally change img to block
- **Rejected:** display: block as default with inline-block as opt-in override
- **Trade-offs:** inline-block matches raw HTML img spec but contradicts every CSS reset and causes invisible layout bugs in real usage
- **Breaking if changed:** Changing to block would shift layout for any consumer relying on inline-block baseline alignment behavior

#### [Gotcha] Empty `src` skips error handling path entirely — browser renders img without src attribute but never fires onerror, leaving component in broken non-error state (2026-03-06)
- **Situation:** hx-image used Lit `nothing` to omit src attribute when empty, but _handleError relies on onerror event which never fires on missing src
- **Root cause:** Omitting src attribute when empty seems correct (no broken-image request) but the component has no code path to transition to error/fallback state without the onerror event
- **How to avoid:** Avoids spurious network request but silently renders an invisible broken image with no fallback activation

#### [Pattern] Image components need srcset/sizes as first-class API — not addable later without breaking responsive image contracts (2026-03-06)
- **Problem solved:** hx-image designed for Drupal as primary consumer; Drupal responsive image styles generate srcset/sizes HTML natively
- **Why this works:** Drupal's image rendering pipeline outputs srcset with multiple breakpoints as its default; a component wrapping img without srcset passthrough cannot serve as a drop-in replacement
- **Trade-offs:** Adding srcset/sizes as typed properties later requires a minor version bump and Drupal template changes for all existing usages

#### [Gotcha] Error container without min-height collapses to zero when ratio and height are both unset — fallback slot content becomes invisible (2026-03-06)
- **Situation:** hx-image error state container had no intrinsic height, relying entirely on ratio or height props to size the container
- **Root cause:** Component assumed consumers would always set ratio or explicit height, matching design system grid assumptions
- **How to avoid:** Zero-height default is predictable for consumers who provide their own fallback sizing, but invisible error states are a silent UX failure in production

#### [Gotcha] CSS box-shadow with slash opacity modifier (e.g. box-shadow: 0 0 0 3px rgba(x,y,z) / 0.2) is invalid syntax — focus ring silently never renders (2026-03-06)
- **Situation:** hx-color-picker applied a focus ring to .color-input:focus using invalid box-shadow shorthand mixing the slash opacity syntax (valid in background/gradient) into box-shadow
- **Root cause:** The slash notation for alpha is valid in color() and gradient functions but NOT in box-shadow — browsers silently ignore the entire declaration
- **How to avoid:** Zero visual indication of failure; passes linting and type-checking; only caught by manual DevTools inspection or antagonistic review

### Using @change instead of @input on color text field means no real-time color preview while typing — only updates on blur or Enter (2026-03-06)
- **Context:** The color input field uses @change event binding, which fires on commit (blur/enter), not on each keystroke like @input
- **Why:** Likely chosen to avoid parsing every intermediate keypress (e.g. '#ff' mid-type), but this creates a poor UX where the picker doesn't respond until the user leaves the field
- **Rejected:** @input with debounce + validity check before parsing would provide real-time feedback without parsing invalid intermediates
- **Trade-offs:** @change is simpler and avoids partial-parse errors, but breaks the expected color picker UX contract where typing updates the preview live
- **Breaking if changed:** Changing to @input without a validity guard will trigger parseColor on every character, causing errors on partial hex strings like '#f'

#### [Gotcha] Readonly aria-label generated as 'X out of 5' without 'stars' unit — screen reader users lose semantic context when focus is not on radiogroup (2026-03-06)
- **Situation:** In readonly mode the component renders role='img' with a computed aria-label. Some AT combinations announce only the img label without re-reading surrounding context.
- **Root cause:** The label was computed from value/max integers without appending the unit. 'stars' seems implicit but screen reader users navigating out of context (e.g., virtual cursor) hear '3 out of 5' with no indication of what is being rated.
- **How to avoid:** Adding 'stars' is a one-character fix; omitting it degrades screen reader UX specifically for non-sighted users navigating rating displays in feeds or cards

#### [Gotcha] overflow: hidden !important on :host clips focus outlines of slotted focusable children in visually-hidden components (2026-03-06)
- **Situation:** hx-visually-hidden uses !important on all :host rules to enforce the clipping technique, but this prevents focus outline visibility for skip-link pattern
- **Root cause:** The visually-hidden CSS technique requires clipping overflow to 1px, but this physically clips the browser-rendered focus ring on child elements
- **How to avoid:** Strong encapsulation via !important prevents all consumer overrides, making the focusable escape hatch impossible without a dedicated :host([focusable]:focus-within) rule

### Visually-hidden components must expose a focusable boolean prop with :host([focusable]:focus-within) CSS override to support skip-link patterns (2026-03-06)
- **Context:** Skip links (e.g. 'Skip to main content') must be visually hidden by default but visible on keyboard focus — the base visually-hidden technique actively fights this requirement
- **Why:** Without the focusable variant, implementing WCAG 2.4.1 Bypass Blocks with this component is impossible. The prop creates a semantic escape hatch in the component contract
- **Rejected:** Consumers wrapping the component in a focusable container — rejected because :host !important rules still clip the inner content regardless of outer focus
- **Trade-offs:** Adds prop surface area and CSS complexity; gains WCAG compliance and explicit API contract for skip-link usage
- **Breaking if changed:** Removing focusable prop forces consumers back to raw HTML skip links, bypassing the design system component

#### [Gotcha] clip: rect(0,0,0,0) is deprecated and must be paired with clip-path: inset(50%) for modern browser compatibility (2026-03-06)
- **Situation:** The CSS clip property is deprecated in favor of clip-path; visually-hidden implementations that only use clip will eventually break in browsers that drop the property
- **Root cause:** clip only works on absolutely positioned elements and is removed from CSS spec; clip-path: inset(50%) is the modern equivalent and should coexist during transition period
- **How to avoid:** Two CSS properties instead of one; future-proofs the implementation

#### [Gotcha] Hardcoded hex/pixel fallbacks in CSS custom property chains (#2563eb, 2px) violate design token rules even when the primary value IS a token — the fallback itself is a violation (2026-03-06)
- **Situation:** CSS vars like `color: var(--hx-focus-ring-color, #2563eb)` — the token is used but the fallback bypasses the token system
- **Root cause:** Developer likely added hex as a 'safe' fallback for environments where tokens aren't loaded
- **How to avoid:** Hardcoded fallback provides visual output in token-missing environments but at the cost of theme consistency and WCAG compliance in dark mode

#### [Gotcha] CEM @cssprop doc comments that advertise hardcoded defaults become actively misleading after token migration — documentation debt is created at the moment of the token fix, not before (2026-03-06)
- **Situation:** After replacing hardcoded fallbacks with token fallbacks, `@cssprop [--hx-focus-ring-color=#2563eb]` describes behavior that no longer exists
- **Root cause:** Docs were written to reflect the initial implementation and not updated as part of the token fix
- **How to avoid:** Token-name docs are more meaningful to consumers but require token package knowledge; hardcoded-value docs are concrete but stale after migration

### Using styleMap's falsy branch instead of Lit's `nothing` sentinel emits `style=""` into the DOM rather than removing the attribute — `nothing` must be explicitly used to suppress attribute rendering (2026-03-06)
- **Context:** When no inline styles are needed, `styleMap({})` or a conditional returning empty string leaves `style=""` on the element
- **Why:** Developer may not have known about `nothing` from lit, or used a conditional that returns empty string instead
- **Rejected:** Returning `nothing` from lit in the falsy branch completely removes the attribute from DOM, keeping HTML clean
- **Trade-offs:** Empty `style=""` is harmless functionally but adds DOM noise, complicates DevTools inspection, and can break strict attribute-presence assertions in tests
- **Breaking if changed:** Changing to `nothing` could affect any CSS selectors or test assertions that target `[style]` attribute presence

#### [Pattern] Web components using the anchor slot pattern (slot='anchor') are preferred over CSS-selector-based anchor references in server-rendered/Drupal contexts because SSR-generated IDs are dynamic and unpredictable (2026-03-06)
- **Problem solved:** hx-popup supported both a slot-based anchor and a CSS selector string anchor attribute; Drupal generates dynamic IDs like 'block-12345' making selector-based wiring fragile
- **Why this works:** Slot-based anchor puts the trigger element inside the component, making the relationship structural and independent of IDs; selector-based anchor requires stable IDs that CMS systems rarely guarantee
- **Trade-offs:** Slot-based anchor is self-contained but changes component markup structure; selector anchor is flexible for external triggers but ID-dependent

### The fix for color-only state (P0) and the missing CSS parts (P1) are tightly coupled and must be addressed in a single PR — adding icon elements creates the parts that need to be exposed (2026-03-06)
- **Context:** Audit found 3 separate P0 violations (color-only state per variant) and a P1 for missing `icon`/`text` CSS parts; these appear independent but share the same root cause
- **Why:** You cannot expose `icon` and `text` CSS parts until icon elements exist in the shadow DOM template; fixing color-only state requires adding those icon elements; the two issues share one structural change
- **Rejected:** Fixing P0 color issues with CSS pseudo-elements or background patterns without adding real icon elements — would technically satisfy color differentiation but forgo the CSS parts API
- **Trade-offs:** Batching the fix reduces PR count and avoids a half-implemented parts API; risk is a larger atomic change
- **Breaking if changed:** Implementing CSS parts without the color-only fix leaves the accessibility violation; implementing icon elements without exposing parts breaks the encapsulation contract consumers expect

#### [Gotcha] Storybook `label` argType injected via render function appears in autodocs as a real component property, misleading consumers into treating it as a valid HTML attribute (2026-03-06)
- **Situation:** hx-help-text Storybook meta defined a fabricated `label` arg not in the component's CEM or class, used only to populate the default slot in the render function
- **Root cause:** Developer needed a UI control for slotted text content but chose the simplest approach (fake arg) rather than the standard `slot` argType pattern
- **How to avoid:** The fabricated arg works functionally but corrupts autodocs; living documentation becomes misleading documentation for the primary consumer (Drupal integrators)

#### [Pattern] FormFieldIntegration Storybook stories must use design tokens (CSS custom properties) rather than hardcoded hex values — stories serve as authoritative integration documentation for Drupal consumers (2026-03-06)
- **Problem solved:** Integration story used `#dc2626`, `#15803d`, `#d1d5db` inline instead of `--hx-color-error-600`, `--hx-color-success-700`, neutral border tokens
- **Why this works:** The primary consumer is Drupal CMS. Storybook is the contract document. Teaching hex values in integration examples propagates the wrong pattern into production Drupal themes, breaking token-based theming
- **Trade-offs:** Token-based stories require consumers to have the token system set up, but this is already a prerequisite for using the library — not an additional burden

#### [Gotcha] Hiding the required asterisk with `aria-hidden='true'` without a visually-hidden text supplement violates WCAG 1.3.1 (Info and Relationships, Level A) when the associated input lacks its own `required` attribute (2026-03-06)
- **Situation:** hx-field-label renders `<span aria-hidden='true'>*</span>` for the required indicator. Screen reader users receive no signal that the field is required unless the `<input required>` attribute is also present — which is a separate concern the label component cannot control.
- **Root cause:** Visual-only required indicators fail WCAG 1.3.1 because the information (this field is required) is conveyed purely visually. The accessible alternative is either `aria-hidden` + visually-hidden supplementary text (e.g. `<span class='sr-only'>required</span>`), or exposing `required` state via `aria-required` on the host.
- **How to avoid:** Adding visually-hidden text increases DOM size marginally. Not adding it leaves AT users without required-field information at the label level, which is the first point of context when navigating a form.

#### [Gotcha] The datetime attribute on <time> elements should reflect the machine-readable UTC value, but the visible text shows the timezone-adjusted display — assistive technologies read the datetime attribute for time announcements, creating a mismatch where AT announces a different time than what is visually displayed (2026-03-06)
- **Situation:** hx-format-date supports time-zone attribute that shifts the displayed time, but the underlying datetime attribute may remain in UTC
- **Root cause:** The datetime attribute was set to the ISO string of the original date, not adjusted to the display timezone — common oversight when adding timezone support after initial implementation
- **How to avoid:** UTC datetime is semantically correct for machine parsing; timezone-local datetime matches user perception — the right choice depends on use case but must be documented

#### [Gotcha] CSS element selectors like `time {}` in shadow DOM component stylesheets are fragile — they style any <time> element including those added by slot content or future internal refactors; `[part='base']` is the correct pattern for stable component-internal styling (2026-03-06)
- **Situation:** hx-format-date used `time {}` selector to style its internal <time> element
- **Root cause:** Direct element selector is the quickest approach but violates the web component CSS encapsulation contract for exposed parts
- **How to avoid:** Using `[part='base']` requires the template to explicitly set part='base' on the element, but enables external CSS customization via ::part() and documents the component's styling API

#### [Gotcha] Web component host elements without explicit role pollute the accessibility tree as unnamed container elements — hx-ripple hosts need role='presentation' or role='none' since they are purely decorative (2026-03-06)
- **Situation:** Screen readers encounter the hx-ripple host in the DOM tree and announce it as an unnamed element, adding noise to the accessibility tree
- **Root cause:** Custom elements default to no implicit ARIA role, but they still appear in the accessibility tree unlike purely presentational elements
- **How to avoid:** role='presentation' removes the host from the accessibility tree entirely which is correct for a decorator component, but must be verified it doesn't suppress slotted content announcements

#### [Gotcha] Hardcoded scale(4) keyframe end-state fails to reach corners in wide containers and is excessive in small ones — must be a CSS custom property (--hx-ripple-scale) per library's no-hardcoded-values policy (2026-03-06)
- **Situation:** hx-ripple expand animation scales ripple circle to 4x, but ripple origin is at click point so coverage depends on container aspect ratio and size
- **Root cause:** scale(4) was likely chosen empirically for a medium-sized button but not validated against the full range of host element sizes in the design system
- **How to avoid:** CSS custom property allows consumer tuning but adds API surface; mathematical correct approach (scale to cover diagonal) requires JS measurement

### Radio mutual exclusion logic placed inside the hx-menu component (parent), not the hx-menu-item component (child) (2026-03-06)
- **Context:** WAI-ARIA requires menuitemradio groups to have mutual exclusion — only one item checked at a time. Initial implementation left this to consumers.
- **Why:** The menu component has the full sibling context needed to uncheck other radio items. A child item cannot reliably know about its siblings without reaching up to the parent, which violates encapsulation.
- **Rejected:** Consumer-side coordination (RadioGroupItems story previously used an @hx-select handler to manually uncheck siblings) — this pushes WAI-ARIA compliance burden onto every consumer and is error-prone.
- **Trade-offs:** Component is now opinionated about radio group behavior which is correct for WAI-ARIA compliance, but means consumers cannot opt out of mutual exclusion for custom grouping logic.
- **Breaking if changed:** Removing parent-level mutual exclusion would allow dual aria-checked='true' states, violating WAI-ARIA menuitemradio spec and breaking screen reader behavior.

#### [Gotcha] Space key must be excluded from keyboard typeahead buffers in menu components (2026-03-06)
- **Situation:** Typeahead navigation in menus buffers keypresses to match menu item labels by first characters. Space is a special key (activates focused item) but is also a valid character in item labels.
- **Root cause:** Including Space in the typeahead buffer corrupts it — e.g. typing 'H' then Space would buffer 'H ' and fail to match 'High Priority', while also triggering item activation simultaneously.
- **How to avoid:** Items whose labels start with a space character cannot be typeahead-navigated to, but this is an edge case that should never occur in practice for menu labels.

#### [Gotcha] CSS-only responsive auto-collapse via @media queries creates ARIA/state mismatch when component tracks collapsed state internally (2026-03-07)
- **Situation:** hx-side-nav had @media max-width:768px that visually collapsed the nav, but the JS @state and aria-expanded remained unchanged
- **Root cause:** ARIA attributes must reflect actual component state. If CSS hides the nav without JS knowing, screen readers still announce it as expanded — a real accessibility violation
- **How to avoid:** Consumers who relied on CSS-only mobile collapse now must add JS-based collapse logic; accessibility correctness requires this burden shift

#### [Pattern] Use MutationObserver to make externally-set DOM attributes reactive in Lit components when @property decorator cannot be used (2026-03-07)
- **Problem solved:** hx-nav-item needed to react to data-collapsed attribute set by parent hx-side-nav, but the attribute was set directly on the DOM element, not through Lit's property system
- **Why this works:** @property({ attribute: 'data-collapsed' }) would require the parent to go through Lit's property binding; MutationObserver lets the child component self-observe external attribute changes and trigger re-render via @state
- **Trade-offs:** MutationObserver adds lifecycle overhead and must be disconnected in disconnectedCallback to avoid leaks; but it's the only non-breaking way to make external attribute mutations trigger reactive updates

### Tooltip role=tooltip requires explicit id on tooltip element and aria-describedby on the triggering element — implicit proximity is insufficient (2026-03-07)
- **Context:** hx-nav-item tooltip was visually near the trigger but had no programmatic ARIA linkage
- **Why:** ARIA spec requires aria-describedby to point to the tooltip's id; screen readers do not infer tooltip association from DOM proximity or CSS positioning
- **Rejected:** aria-label on the trigger element — loses the tooltip element as a visible text node and duplicates content
- **Trade-offs:** Requires generating unique ids per nav-item instance (e.g. using Lit's this.id or a counter); adds minor complexity
- **Breaking if changed:** Removing aria-describedby makes the tooltip invisible to assistive technology even if visually correct

#### [Gotcha] Reading slot text via textContent on the slot's assigned nodes picks up text from ALL descendant elements (badges, icons), garbling the tooltip label (2026-03-07)
- **Situation:** hx-nav-item tooltip label was built from slot.assignedNodes() textContent, which included badge numbers and icon aria labels
- **Root cause:** Tooltip should show only the human-readable nav item label. Descendants like badge counts or icons are supplementary and corrupt the tooltip string
- **How to avoid:** Must filter assignedNodes to only TEXT_NODE types from the default slot; loses any rich text intentionally in the slot label

### Removed dual screen reader announcement pattern (aria-label + .sr-text live region span) in favor of role='status' + aria-label only (2026-03-07)
- **Context:** hx-spinner had both an aria-label on the host element AND a visually-hidden .sr-text span inside, causing screen readers to announce the loading state twice
- **Why:** Single announcement mechanism is sufficient; role='status' already creates a live region, aria-label provides the accessible name — adding a redundant text node inside causes double-announcement on NVDA/JAWS
- **Rejected:** Keeping the .sr-text span as the sole mechanism (removing aria-label instead) — rejected because aria-label on host is more portable and works across Shadow DOM boundaries without relying on slot projection
- **Trade-offs:** Simpler DOM, no redundant announcements; but loses the ability to dynamically update announcement text without property changes
- **Breaking if changed:** Removing aria-label and relying solely on inner text would break if the component is used in frameworks that query accessible names via aria-label attribute

### Added 'decorative' boolean property that switches to role='presentation' and removes aria-label entirely (2026-03-07)
- **Context:** Spinners used alongside text like 'Loading...' create redundant announcements — the spinner's own aria-label fires in addition to the adjacent text
- **Why:** The decorative prop follows the Web Components pattern for accessibility-silent visuals (same concept as aria-hidden but works correctly through Shadow DOM encapsulation — aria-hidden on host doesn't propagate into shadow root in all browsers)
- **Rejected:** Using aria-hidden on the host element — rejected because aria-hidden propagation into shadow DOM is inconsistent across browsers and assistive technologies; role='presentation' on the shadow root container is more reliable
- **Trade-offs:** Easier to use in compound UI patterns; but developers must explicitly opt-in, creating a documentation/discoverability burden
- **Breaking if changed:** Removing the decorative prop would force consumers to use aria-hidden with unpredictable cross-browser shadow DOM behavior

#### [Gotcha] wc-mcp a11y health score of 35/100 is a false negative for status indicator components — form association, keyboard events, focus, and disabled dimensions don't apply to spinners (2026-03-07)
- **Situation:** Automated component health tooling penalizes spinners for missing form-related and interactive a11y features that are categorically irrelevant to a decorative/status indicator
- **Root cause:** Health scoring tools apply generic web component rubrics that assume interactive components; purely visual status indicators have a fundamentally different a11y contract
- **How to avoid:** Can't trust aggregate health scores for non-interactive components; need to interpret dimension scores individually

#### [Pattern] Added @supports guard around color-mix() for inverted variant track color, with rgba() fallback (2026-03-07)
- **Problem solved:** Inverted spinner variant uses color-mix() to derive a semi-transparent white track color — color-mix() is unsupported in older Chromium versions still present in enterprise healthcare environments
- **Why this works:** Healthcare enterprise deployments often run locked-down browsers (older Chrome/Edge on clinical workstations) that lack color-mix() support; without the fallback, the inverted track renders incorrectly or falls back to browser defaults
- **Trade-offs:** Slightly more verbose CSS; but ensures correct rendering across the full browser matrix for the target healthcare audience

### Added reflect: true to the 'label' property to enable Drupal Twig template compatibility (2026-03-07)
- **Context:** Without attribute reflection, setting label via JavaScript property works but Twig templates (which render HTML attributes server-side) cannot set the initial value — the attribute wouldn't sync to the property on upgrade
- **Why:** Drupal's Twig layer generates static HTML; custom element properties are only accessible post-JS-upgrade. Reflected attributes are present in the initial HTML, so the component reads its initial state correctly on connectedCallback before any framework hydration
- **Rejected:** Requiring Drupal integrators to use JavaScript to set the label post-mount — rejected because it breaks no-JS usage and creates a Twig/PHP complexity burden for CMS teams
- **Trade-offs:** Attribute reflection adds minor overhead (attribute mutation triggers attributeChangedCallback); but the DX and SSR compatibility gains outweigh this for a CMS-first platform
- **Breaking if changed:** Removing reflect: true would break all Drupal Twig templates that pass label as an HTML attribute and expect it to be read as the accessible label

### Used :host([focusable]:focus-within) CSS selector to reveal visually-hidden content on focus, rather than JavaScript-driven class toggling (2026-03-07)
- **Context:** Skip-link pattern requires visually-hidden content to become visible when a child element receives keyboard focus
- **Why:** Pure CSS approach via :focus-within is zero-JavaScript, works before hydration, and responds instantly to keyboard navigation without event listener overhead
- **Rejected:** JavaScript focus/blur event listeners that add/remove a 'focused' class — adds complexity, can miss focus events during rapid tabbing, and requires cleanup
- **Trade-offs:** Easier: no JS state management, works in SSR/pre-hydration. Harder: no programmatic control over visibility from outside the component
- **Breaking if changed:** Removing the :host([focusable]:focus-within) rule breaks the skip-link pattern entirely — focused skip links become invisible to sighted keyboard users

#### [Gotcha] wc-mcp accessibility score of 5/100 is expected and correct for utility components like hx-visually-hidden — the scoring model assumes interactive components (2026-03-07)
- **Situation:** Audit tooling flagged near-zero accessibility score, which could be misread as a failure requiring remediation
- **Root cause:** The accessibility scoring checks for ARIA roles, form association, and focus delegation — none of which apply to a CSS utility wrapper component. Low score is semantically correct.
- **How to avoid:** Tooling scores become misleading for utility/structural components; requires human judgment to interpret audit results correctly

### Added clip-path: inset(50%) !important alongside the deprecated clip: rect(0,0,0,0) property rather than replacing it (2026-03-07)
- **Context:** clip property is deprecated in CSS but still needed for older browser compatibility in enterprise component libraries
- **Why:** Modern browsers require clip-path for correct visually-hidden behavior; older browsers (IE11-era) only understand clip. Both must coexist during the transition period.
- **Rejected:** Replacing clip with clip-path entirely — would break rendering in any browser or webview that doesn't support clip-path
- **Trade-offs:** Slightly more CSS to maintain; ensures cross-browser correctness without a flag day migration
- **Breaking if changed:** Removing the legacy clip property breaks visually-hidden in older browser targets; removing clip-path breaks it in modern browsers that have dropped clip support

### Single-mode accordion enforcement must run in firstUpdated() to collapse extra pre-expanded items on initial connect, not only on user interaction (2026-03-07)
- **Context:** P1-4: if markup has multiple items with expanded attribute, single-mode was not enforced until a user clicked
- **Why:** LitElement's firstUpdated() fires after first render when children are in DOM — this is the earliest safe point to query child items and enforce the constraint without causing update loops
- **Rejected:** Enforcing in connectedCallback() — children may not be upgraded yet; enforcing only on click events — leaves invalid initial state visible to the user
- **Trade-offs:** firstUpdated() runs once, so dynamically added pre-expanded items after connect are not auto-collapsed; acceptable tradeoff since dynamic mutations should go through the component API
- **Breaking if changed:** Removing firstUpdated() enforcement means server-rendered or statically authored markup with multiple expanded items will render incorrectly in single mode until first user interaction

#### [Gotcha] Double opacity stacking on disabled elements is a subtle visual bug: if both :host([disabled]) { opacity: 0.5 } and an inner .trigger[disabled] { opacity: 0.5 } exist, the rendered opacity becomes 0.25 (0.5 × 0.5), not 0.5 (2026-03-07)
- **Situation:** P1-2: disabled accordion items appeared more faded than designed — root cause was opacity applied at both host and trigger levels
- **Root cause:** CSS opacity is multiplicative across stacking contexts — shadow DOM does not flatten opacity inheritance, so host opacity and inner element opacity compound
- **How to avoid:** Single :host([disabled]) rule is simpler and correct; the only tradeoff is that inner elements cannot independently control their disabled opacity

### Added `dotLabel` prop that conditionally switches dot indicator to `role="img"` + `aria-label` instead of using a static aria-label on the badge container (2026-03-07)
- **Context:** Dot mode badge had no accessible name — WCAG 4.1.2 violation. The badge container aria-label would conflict with text-mode badges that have visible text.
- **Why:** role=img scoped to the dot element isolates the accessible name to just the indicator, avoiding double-announcing when badge also has visible text
- **Rejected:** Static aria-label on outer badge element — would override or conflict with slot text content in non-dot modes
- **Trade-offs:** Requires authors to always pass dot-label when using dot mode; easier screen reader experience but adds required prop discipline
- **Breaking if changed:** Removing dotLabel and role=img on dot element breaks WCAG 4.1.2 for dot-only badges with no visible text

#### [Gotcha] Phantom `danger` variant existed in stories argTypes, story objects, and `as const` arrays but never existed in the component implementation — causing TypeScript types derived from stories to diverge from runtime behavior (2026-03-07)
- **Situation:** Deep Audit v2 flagged this as P0. The variant was present in 6 locations across stories but the component CSS and logic never had a danger variant.
- **Root cause:** Likely added to stories speculatively or copied from a sibling component (e.g. hx-alert which does have danger) without implementing the corresponding component logic
- **How to avoid:** Removing it creates a breaking change for any consumer passing variant='danger' (silently renders without styling), but leaving it creates false documentation

### Combined P0-2 (count/max props) and P1-3 (aria-live for count updates) into a single implementation: `aria-live="polite"` is added conditionally only when `count` prop is set, not unconditionally on the badge span (2026-03-07)
- **Context:** aria-live on every badge would cause screen readers to announce ALL badge content changes including initial render, which is noisy
- **Why:** Conditional aria-live means only dynamically-updated numeric badges announce changes; static text badges remain silent on re-render
- **Rejected:** Always-on aria-live='polite' on badge span — would announce every slot change including initial paint and non-count text badges
- **Trade-offs:** Count badges get live region announcement; static text badges don't. Requires count prop to be set for live region to activate.
- **Breaking if changed:** Removing the conditional check and making aria-live unconditional causes screen reader noise on all badge renders

#### [Gotcha] CSS custom properties for secondary and info variants were declared in the component's public API but never consumed in the `.badge--secondary` and `.badge--info` rules — the cascade override points were dead code (2026-03-07)
- **Situation:** P1-1: Authors following the documented theming API (`--hx-badge-secondary-bg: red`) would see no effect. The variant classes used hardcoded values instead of `var(--hx-badge-secondary-bg)`.
- **Root cause:** Likely the custom property declarations were added to the API docs/design tokens without updating the actual CSS rule to consume them — a documentation-implementation drift
- **How to avoid:** Fix is trivially correct but represents a silent theming failure that existed since the component was created — any consumer who tried to theme these variants got no feedback that it wasn't working

### `removeLabel` prop (default: `"Remove"`) replaces hardcoded `aria-label="Remove"` on the remove button, allowing consumers to provide contextual labels like `"Remove urgent badge"` for screen reader disambiguation when multiple badges appear (2026-03-07)
- **Context:** P1-2: Generic 'Remove' aria-label on multiple badge remove buttons creates screen reader confusion — VoiceOver/NVDA read all buttons as identical with no badge context
- **Why:** Default value maintains backward compatibility for consumers who don't need disambiguation; explicit prop gives full control without requiring slot restructuring
- **Rejected:** Deriving aria-label automatically from badge text content — rejected because dot-mode and count-mode badges have non-text content that's unreliable to auto-compose into a label
- **Trade-offs:** Consumers must opt-in to contextual labels by passing remove-label; default 'Remove' is still ambiguous in multi-badge scenarios but prevents a breaking change
- **Breaking if changed:** Hardcoding 'Remove' back into the template removes consumer ability to provide context — accessibility regression for multi-badge use cases

### Wrap slotted error content in a div with the error ID (role='alert') rather than putting the ID directly on the slot element (2026-03-07)
- **Context:** ARIA aria-describedby association with slotted Web Component content — the fieldset needed to reference an ID, but slot elements themselves are not in the composed accessibility tree in a way that aria-describedby can resolve
- **Why:** aria-describedby resolves IDs in the flat DOM tree. A bare <slot> element doesn't get the ID associated with projected content. Wrapping in a div with the ID ensures the referenced element exists in the composed tree and contains the error text at the time screen readers read it.
- **Rejected:** Placing id directly on <slot> — this doesn't work because the slot element itself is shadow DOM and the projected content is light DOM; aria-describedby can't traverse the boundary this way
- **Trade-offs:** Slightly more DOM nesting; but correct WCAG 1.3.1 and 4.1.3 compliance. The wrapper div must be conditionally rendered (only when hasError) to avoid empty nodes in the accessibility tree.
- **Breaking if changed:** Removing the wrapper div breaks aria-describedby association for slotted error content — programmatic error text (via errorText prop) would still work but slot-projected error nodes would be unreachable

#### [Gotcha] aria-live='polite' combined with role='alert' causes inconsistent behavior across NVDA, JAWS, and VoiceOver — role='alert' alone is correct (2026-03-07)
- **Situation:** Error div had both role='alert' (implicit aria-live=assertive) and explicit aria-live='polite', creating conflicting live region semantics
- **Root cause:** role='alert' implicitly sets aria-live=assertive. Adding an explicit aria-live='polite' overrides the implicit value differently across screen reader implementations — some honor role, some honor the explicit attribute, some get confused and announce twice or not at all.
- **How to avoid:** Removing aria-live='polite' makes announcements assertive (interrupting), which is correct for errors but may feel aggressive for warnings. This is the ARIA spec-correct behavior.

#### [Gotcha] aria-describedby should only reference IDs of elements that currently have content — conditionally include _helpTextId only when help slot has content via _hasHelpSlot state (2026-03-07)
- **Situation:** Help slot had no slotchange handler, so _hasHelpSlot was never tracked. aria-describedby always included _helpTextId even when the slot was empty, causing screen readers to announce an empty region or nothing.
- **Root cause:** Screen readers read aria-describedby targets even if empty. An empty referenced element causes a brief pause or empty announcement. Conditional inclusion requires tracking slot content state explicitly.
- **How to avoid:** Requires adding a @slotchange handler specifically for the help slot (previously omitted). Each slot needs its own change handler if its presence affects aria attributes.

#### [Gotcha] _suppressNextChildChange boolean flag silently swallows legitimate rapid checkbox events — removing it is required for correctness (2026-03-07)
- **Situation:** The flag was added to prevent double-firing of mutation observer callbacks during programmatic checkbox state changes, but it also suppressed user-initiated rapid consecutive changes
- **Root cause:** A single boolean flag cannot distinguish between 'this change was triggered by our own code' and 'user clicked two checkboxes fast'. The suppression fires once and clears, but rapid user interactions arrive before it clears, causing the second event to be dropped.
- **How to avoid:** Removing the flag may cause double-processing in some edge cases where the component mutates checkboxes itself. Those cases need to be handled by making the event handler idempotent rather than suppressing events.

### Use Array.from(this.children).filter(c => c.tagName === 'HX-CHECKBOX') for _getCheckboxes() instead of querySelectorAll('hx-checkbox') (2026-03-07)
- **Context:** querySelectorAll traverses all descendants including nested groups. A checkbox inside a nested hx-checkbox-group would be found by the parent group's query.
- **Why:** Direct children only (this.children) ensures each group only manages its own immediate checkboxes. Nested groups are responsible for their own children. This is the correct ownership model for composite Web Components.
- **Rejected:** querySelectorAll('hx-checkbox') — finds all descendants, breaking nested group scenarios; querySelector in shadow root — only finds shadow DOM, not light DOM slotted children
- **Trade-offs:** Requires tagName comparison (case-sensitive, always uppercase) rather than CSS selector. Custom elements are always uppercase in tagName. Slightly less flexible if hx-checkbox is renamed.
- **Breaking if changed:** Reverting to querySelectorAll causes parent groups to double-process checkboxes that belong to nested child groups

### Capture document.body.style.overflow before mutating it, store in private field, restore exact value on close (2026-03-07)
- **Context:** Implementing body scroll lock for a drawer component that may be used in apps that already set body overflow
- **Why:** Host applications may have their own overflow value set; clobbering it by always restoring to '' would break their layout
- **Rejected:** Always restoring overflow to empty string '' on close — simpler but destructive to host app state
- **Trade-offs:** Slightly more state to track; correctly handles nested/sequential drawer scenarios and host app styles
- **Breaking if changed:** Removing the capture-before-mutate pattern would silently break any host app that sets body overflow independently

### Gate scroll lock behind `contained !== true` check — skip body scroll lock entirely when drawer is contained within a parent element (2026-03-07)
- **Context:** hx-drawer supports two modes: full-viewport overlay and container-scoped overlay (contained=true)
- **Why:** When contained=true, the drawer is visually and functionally scoped to a parent container, not the viewport — locking body scroll would be user-hostile with no visual justification
- **Rejected:** Always locking body scroll regardless of contained mode — would cause confusing UX where the page freezes even though only a sub-region has a drawer
- **Trade-offs:** Contained drawers don't prevent background scroll, which is intentional and correct for that use case
- **Breaking if changed:** Removing the contained check would lock body scroll even for contained drawers, breaking host layouts and user expectations

#### [Pattern] Call scroll lock restoration in disconnectedCallback() in addition to the normal close path (2026-03-07)
- **Problem solved:** Web components can be removed from the DOM programmatically while open, bypassing the normal hide/close lifecycle
- **Why this works:** If the element is removed while open, _closeDrawer() never fires, leaving body overflow permanently hidden — an orphaned lock that survives page interaction until refresh
- **Trade-offs:** Minimal overhead; disconnectedCallback is a well-defined lifecycle hook making this the correct place for cleanup

#### [Gotcha] Shadow DOM activeElement returns the focused child element (e.g. a sort <button>) not the shadow host <th> cell, breaking grid keyboard navigation logic that expects a cell reference. (2026-03-07)
- **Situation:** Arrow-key grid navigation in hx-data-table expected the focused element to be a <th>, but when focus lands inside a sort button, activeElement is the <button>, which has no row/col index attributes.
- **Root cause:** The fix was an ancestor walk from the focused element up to the nearest <th> to recover the grid cell context. This is the correct approach because shadow DOM encapsulation means the button IS the activeElement from the shadow root's perspective.
- **How to avoid:** Ancestor walk adds a small traversal cost per keydown, but keeps all grid navigation in one handler. Avoids duplicated event handler surface area.

### aria-sort attribute must be conditionally omitted entirely on non-sortable columns rather than set to 'none', per WAI-ARIA 1.1 spec. (2026-03-07)
- **Context:** The original implementation unconditionally rendered aria-sort on all column headers, including non-sortable ones, violating WAI-ARIA 1.1 which reserves aria-sort for sortable columns only.
- **Why:** Screen readers announce aria-sort='none' as interactable sort affordance even when the column cannot be sorted, creating false affordances for AT users. Omitting the attribute entirely is spec-compliant and avoids the false affordance.
- **Rejected:** Keeping aria-sort='none' was rejected because it is a P0 accessibility bug — AT users receive incorrect interactive cues.
- **Trade-offs:** Conditional attribute rendering requires a ternary in the template but produces correct AT output. No consumer-visible breaking change since non-sortable columns never had functional sort anyway.
- **Breaking if changed:** Reverting to unconditional aria-sort='none' reintroduces a WAI-ARIA 1.1 violation and causes screen readers to announce all columns as sortable.

### Used JS focusin/focusout event listeners with _keyboardVisible state and ring--keyboard-visible class to implement keyboard-only focus ring visibility (2026-03-07)
- **Context:** Focus ring should only appear for keyboard navigation (`:focus-visible` behavior), not mouse clicks
- **Why:** CSS-only `:focus-within` fires on both mouse clicks and keyboard focus, making it impossible to discriminate. JS event listeners allow tracking of keyboard-initiated focus separately from pointer-initiated focus.
- **Rejected:** CSS `:focus-within` pseudo-class — would show ring on mouse clicks, defeating the purpose of a keyboard-only focus indicator
- **Trade-offs:** Adds JS event listener overhead and component state; gains precise keyboard-vs-pointer discrimination that CSS alone cannot achieve
- **Breaking if changed:** Removing the JS listener approach and reverting to CSS-only would cause focus ring to appear on mouse clicks, violating WCAG focus indicator intent

#### [Gotcha] darkTokenStyles utility is available in the tokens package but is NOT used by components for dark mode; dark mode is instead handled via explicit CSS blocks (@media prefers-color-scheme: dark and [data-theme='dark'] selectors) consistent with components like hx-step (2026-03-07)
- **Situation:** Adding dark mode contrast support to hx-focus-ring during audit fix
- **Root cause:** Component-level dark mode handling via explicit CSS blocks is the established pattern in this codebase. Using darkTokenStyles would introduce an inconsistent pattern and potentially break the theming cascade used by other components.
- **How to avoid:** More verbose CSS; consistent with existing component patterns and theming architecture

#### [Pattern] Used nothing from lit instead of empty string '' for absent optional CSS custom property values, eliminating empty style="" attribute in DOM (2026-03-07)
- **Problem solved:** Component conditionally applies inline style attribute based on optional color/width/offset props
- **Why this works:** Empty string produces a style='' attribute in the DOM which is semantically wrong and can interfere with CSS specificity. Lit's nothing sentinel completely removes the attribute binding.
- **Trade-offs:** Requires lit nothing import; produces cleaner DOM with no spurious attributes

#### [Pattern] Used ifDefined(args['color'] || undefined) instead of args['color'] ?? '' in Storybook stories for optional CSS custom property controls (2026-03-07)
- **Problem solved:** Story controls for optional color/width/offset props that should not render the attribute when empty
- **Why this works:** The ?? '' pattern passes an empty string which sets the attribute to an empty value in the DOM. ifDefined with || undefined ensures the attribute is completely absent when no value is provided, matching the component's own nothing pattern.
- **Trade-offs:** Requires ifDefined import from lit; stories more accurately represent real usage and valid component states

#### [Pattern] Replace hardcoded hex colors in Storybook story helpers with CSS custom property references using var(--hx-color-*, #hex-fallback) syntax to maintain design token traceability while preserving visual output. (2026-03-07)
- **Problem solved:** Story grid item helper used raw hex strings (#dbeafe, #fef9c3, etc.) disconnected from the design token system, making it impossible to trace color usage back to tokens or update colors systematically.
- **Why this works:** var(--token, #fallback) gives token semantics in environments that support them and identical visual output in environments that don't — zero visual regression risk with full token alignment.
- **Trade-offs:** Easier: colors now participate in the design token system. Harder: story code is slightly more verbose and the token-name-to-color mapping must be maintained.

#### [Gotcha] In Storybook render functions, using ifDefined() from lit/directives/if-defined.js for optional control attributes is required — passing undefined as a string attribute passes the literal string 'undefined' to the Intl constructor (2026-03-07)
- **Situation:** Storybook canvas was crashing because undefined format options from controls were being serialized as the string 'undefined' and passed to Intl
- **Root cause:** Lit attribute binding coerces undefined to the string 'undefined' unless ifDefined() is used; ifDefined omits the attribute entirely when value is undefined
- **How to avoid:** Requires importing ifDefined in every story file that has optional controls

### Added explicit `decorative` boolean prop instead of relying on `alt=""` pattern to signal decorative images. Sets `alt=""` + `role="presentation"` internally. (2026-03-07)
- **Context:** P0 audit defect: images with no `alt` were silently hiding from screen readers — intent was ambiguous between 'forgot alt' and 'intentionally decorative'.
- **Why:** Explicit semantic intent in the component API prevents misuse. `alt=""` is valid HTML but invisible as a code pattern — a `decorative` prop is self-documenting and tooling can lint for it.
- **Rejected:** Keeping implicit `alt=""` pattern — backward compatible but doesn't distinguish accidental omission from intentional decoration, making accessibility audits unreliable.
- **Trade-offs:** Additive change preserves backward compat, but now two valid patterns exist (`alt=""` and `decorative`) which could cause inconsistency across a codebase.
- **Breaking if changed:** Removing `decorative` prop would force consumers back to `alt=""` pattern, losing explicit decorative intent and breaking any consumers using the prop.

### Caption is implemented as a named slot (`<span slot='caption'>`) rather than a string property, using `slotchange` event to toggle figcaption visibility via CSS class. (2026-03-07)
- **Context:** P1 audit defect: no caption support. Choice was between a string property (simpler API) or a slot (richer content).
- **Why:** Slot-based caption allows rich content (links, icons, formatted text) inside the caption without requiring HTML-as-string props. `slotchange` detection avoids rendering an empty figcaption in the DOM when unused.
- **Rejected:** String `caption` property — simpler API but limits caption to plain text, forces consumers to escape HTML entities, and blocks rich content patterns.
- **Trade-offs:** Slot pattern is more flexible but less discoverable — developers must know to use `<span slot='caption'>`. A string prop would be immediately obvious from TypeScript types.
- **Breaking if changed:** Changing to a string prop would break all consumers using slot-based rich captions.

### Changed `:host { display: inline-block }` to `display: block` for hx-image host element. (2026-03-07)
- **Context:** P2 audit defect: inline-block causes image components to sit in text flow, creating unexpected baseline alignment gaps and making full-width layouts require explicit `width: 100%` on consumers.
- **Why:** Image components are almost always used as block-level layout elements. `inline-block` is the Web Component default but creates whitespace/baseline issues in flex/grid contexts.
- **Rejected:** Keeping `inline-block` — maintains parity with native `<img>` default, but native `<img>` is a replaced element with special rendering rules that don't apply to custom elements.
- **Trade-offs:** Block display is better for layout but could break consumers who rely on inline-block behavior for text-adjacent image placement.
- **Breaking if changed:** Consumers placing hx-image inline within text content would need to add `display: inline-block` override.

### Storybook argTypes keys must use HTML attribute names (kebab-case) not JavaScript property names (camelCase) for web components; argTypes, args, and render must all be updated consistently (2026-03-07)
- **Context:** hx-number-input stories had argTypes keyed as helpText, hxSize, noStepper — these matched the JS property names but not the HTML attribute names. Storybook autodocs controls were broken/mismatched.
- **Why:** Storybook reads attribute names from web component custom element manifests (CEM). The CEM uses attribute names (help-text, hx-size, no-stepper). When argTypes keys don't match, the controls panel shows disconnected controls that don't affect the rendered component.
- **Rejected:** Keeping camelCase keys — simpler but causes autodocs to show duplicate/mismatched controls and args passed to render don't map to the actual DOM attributes
- **Trade-offs:** Kebab-case keys are less ergonomic in JS object literals but required for correct Storybook<->web component integration. All three of argTypes/args/render must change atomically or controls break.
- **Breaking if changed:** If argTypes and args use different key formats, the control binding breaks silently — the control appears but doesn't drive the component

#### [Pattern] Use :focus:not(:focus-visible) { outline: none } instead of bare outline: none on interactive elements to suppress mouse-click focus rings while preserving keyboard and programmatic focus rings (2026-03-07)
- **Problem solved:** Stepper buttons had outline: none on :focus — this suppressed ALL focus indicators including keyboard navigation, failing WCAG 2.4.7 (Focus Visible).
- **Why this works:** :focus-visible is set by the browser only when focus was received via keyboard or programmatic means, not mouse click. The :not(:focus-visible) selector targets only mouse-initiated focus where suppressing the ring is acceptable UX.
- **Trade-offs:** Slightly more complex CSS selector. Browser support is excellent (all modern browsers). Mouse users get cleaner UI; keyboard users retain required focus indicators.

### Escape key listener moved from host element to document so it fires regardless of where focus is (2026-03-07)
- **Context:** P1-03: popover with role=dialog — once focus enters the popover body, the host element no longer receives keydown events
- **Why:** After focus management places focus inside the popover body (P0-02), the host's keydown handler never fires for Escape. Document-level listener is the only reliable approach for modal/dialog close-on-escape.
- **Rejected:** Keeping keydown on host; fails silently when focus is inside popover content — hard to debug because it works in simple cases
- **Trade-offs:** Must add/remove document listener on show/hide to avoid leaks; adds lifecycle complexity
- **Breaking if changed:** Reverting to host keydown breaks Escape-to-close for all popovers once focus enters their content

### tabindex="-1" on popover body + programmatic focus on show + restore previous focus on hide for ARIA dialog focus management (2026-03-07)
- **Context:** P0-02: role=dialog requires focus to move into the dialog on open and return to trigger on close
- **Why:** ARIA dialog spec requires focus to be trapped/moved. Without tabindex=-1, the body element is not focusable programmatically. Without restoring _previousFocus, keyboard users lose their place in the page.
- **Rejected:** Auto-focusing first interactive child: more complex, fails if dialog has no focusable content
- **Trade-offs:** Body itself receives focus, not first child — consumers wanting first-child focus must handle it via slot content
- **Breaking if changed:** Removing tabindex=-1 causes bodyEl.focus() to silently fail in most browsers

### ?inert binding on hidden popover body prevents Tab traversal into invisible content (2026-03-07)
- **Context:** P1-02: without inert, keyboard users can Tab into focusable elements inside a closed popover
- **Why:** CSS visibility/display:none alone doesn't prevent focus in all cases with Floating UI's position:fixed body. inert attribute is the only reliable way to exclude an entire subtree from the accessibility tree and tab order.
- **Rejected:** tabindex=-1 on all child elements: fragile, doesn't cover dynamically added slot content
- **Trade-offs:** inert is a modern attribute — supported in all current browsers but not legacy. Acceptable for enterprise modern-browser library.
- **Breaking if changed:** Removing inert allows keyboard users to Tab into closed popover content, a WCAG failure

### :host changed to display:contents removing vestigial position:relative (2026-03-07)
- **Context:** P2-05: :host had position:relative which was leftover from before Floating UI migration; popover body uses position:fixed via Floating UI
- **Why:** display:contents makes the host element itself invisible to layout — children participate directly in parent layout. position:relative on host was creating an unintended containing block that interfered with Floating UI's fixed positioning calculations in some stacking contexts.
- **Rejected:** Keeping position:relative: creates subtle z-index/stacking context bugs in portals or fixed-position ancestors
- **Trade-offs:** display:contents has known edge cases with some CSS features (e.g., transitions on host itself) — acceptable since host has no visual presentation
- **Breaking if changed:** Reverting to position:relative can cause popover to misposition when host is inside a transformed or fixed ancestor

### Removed `reflect: true` from `currentPage` property to eliminate DOM attribute writes on every navigation event (2026-03-07)
- **Context:** currentPage was reflected to attribute on every page change, causing unnecessary DOM mutations and potential layout thrash in high-frequency pagination interactions
- **Why:** reflect:true is only needed when external CSS selectors or other components query the attribute value; currentPage is consumed internally and via JS property access only
- **Rejected:** Keep reflect:true for consistency with other props — rejected because it causes a DOM write on every single page navigation with no consumer benefit
- **Trade-offs:** Attribute inspection via DevTools or CSS attribute selectors on [current-page] no longer works; JS property access still works fine
- **Breaking if changed:** Any CSS like [current-page='3'] or external code reading element.getAttribute('current-page') to track state would break

#### [Gotcha] Safari VoiceOver drops list semantics when list-style:none is applied — requires explicit role="list" on <ul> (2026-03-07)
- **Situation:** Pagination uses <ul> with CSS list-style:none for visual styling; Safari VoiceOver interprets this as the author intentionally making it not a list and removes list role
- **Root cause:** Safari's heuristic: if you remove bullet styling you probably don't want list semantics announced. This is intentional Safari behavior, not a bug.
- **How to avoid:** role=list is redundant on non-Safari browsers but harmless; the attribute is necessary for cross-browser screen reader parity

### Collapsed redundant .button--active CSS class; active state driven exclusively by [aria-current='page'] attribute selector (2026-03-07)
- **Context:** Component had both .button--active class AND aria-current='page' attribute on active pages, with duplicate style rules for each
- **Why:** aria-current='page' is the semantic truth source for the active state — it's what screen readers announce. Tying styles to the same attribute eliminates the dual-write synchronization risk
- **Rejected:** Keep both class and attribute — rejected because it creates a synchronization bug risk (styles applied via class, semantics via attribute; they could diverge)
- **Trade-offs:** CSS is now coupled to ARIA attribute presence; any refactor that changes aria-current usage must also account for styling implications
- **Breaking if changed:** Any external CSS overriding .button--active will stop working; must use [aria-current='page'] in downstream theme overrides

#### [Pattern] Drupal/Twig integration requires explicit 0-vs-1 indexing documentation: Drupal pagination is 0-indexed, hx-pagination current-page is 1-indexed (2026-03-07)
- **Problem solved:** Server-rendered frameworks like Drupal pass page=0 in GET params for the first page; the component uses 1-based page numbering internally
- **Why this works:** The off-by-one error is silent — component renders page 0 as valid input but displays incorrectly; no error is thrown
- **Trade-offs:** Server integration requires a +1 offset in the template binding; documented in JSDoc but easy to miss

#### [Gotcha] Storybook fn() spy leaks state between story renders when created at module scope — must create fresh fn() per render inside the play function or args factory (2026-03-07)
- **Situation:** EventHandling story created a single fn() spy at module initialization; spy call history accumulated across all story interactions and hot-reloads
- **Root cause:** Storybook reuses module-scope variables across renders in the same session; a spy created once accumulates all calls from all story visits
- **How to avoid:** Creating fn() inside args/render means the spy reference changes each render; action panel shows fresh results but you can't hold a reference for external assertions

### aria-live='polite' region with aria-atomic='true' announces 'Page N of M' on navigation using a visually-hidden DOM node, not dynamic ARIA on the active button (2026-03-07)
- **Context:** WCAG 4.1.3 requires status changes to be programmatically determinable; updating aria-label on the active page button doesn't reliably trigger announcements in all screen readers
- **Why:** aria-live polite region is the most universally supported pattern for announcing non-modal status updates; aria-atomic ensures the full string is read not just the changed portion
- **Rejected:** Update aria-label on the active page button to 'Page 3, current' — rejected because button label changes don't trigger live region announcements in NVDA/JAWS
- **Trade-offs:** Extra DOM node required; must be kept in sync with currentPage/totalPages state; visually-hidden CSS must use clip-path not display:none (which suppresses announcements)
- **Breaking if changed:** If the visually-hidden class uses display:none or visibility:hidden instead of clip-path/position:absolute approach, the live region will be silenced by screen readers

### Use `inert` attribute instead of `aria-hidden` on shadow DOM inner container elements for popup hiding (2026-03-07)
- **Context:** hx-popup needed to hide floating panel content from assistive technology when inactive
- **Why:** `aria-hidden` on an inner shadow element doesn't reliably propagate to slotted content (light DOM nodes projected via slots are not semantically owned by the shadow tree). `inert` removes elements from the AT and blocks interaction regardless of slot boundaries.
- **Rejected:** `aria-hidden` on shadow container — doesn't reliably hide slotted content across browsers; `aria-hidden` on `:host` — would hide both the anchor slot AND popup content, breaking the component's dual-slot pattern
- **Trade-offs:** More reliable AT hiding across all browsers; existing tests needed updating since they checked for `aria-hidden`; `inert` also blocks pointer/keyboard interaction (desired for inactive popup)
- **Breaking if changed:** Removing `inert` in favor of `aria-hidden` on shadow container would cause slotted popup content to remain accessible to screen readers when popup is closed

#### [Pattern] Set autoSize CSS custom properties on `:host` rather than on internal shadow popup element (2026-03-07)
- **Problem solved:** @floating-ui autoSize middleware sets CSS variables for available width/height so consumers can constrain scrollable content
- **Why this works:** CSS custom properties set on `:host` cascade into shadow DOM (available inside) AND are accessible from light DOM via CSS inheritance. Properties set on an inner shadow element are scoped to shadow DOM only — light DOM consumers cannot read or override them.
- **Trade-offs:** `:host` approach enables both shadow and light DOM consumers; properties must be cleaned up on `:host` explicitly when popup goes inactive or autoSize is disabled (shadow element cleanup was also needed)

### Type `flipFallbackPlacements` as `PopupPlacement[]` instead of `string[]` (2026-03-07)
- **Context:** The property accepts an array of placement strings for @floating-ui flip middleware fallback sequence
- **Why:** Using the domain-specific union type `PopupPlacement[]` catches invalid placement strings at compile time and provides IDE autocomplete. `string[]` accepts any value and defers errors to runtime inside floating-ui.
- **Rejected:** `string[]` — passes type-check but silently accepts invalid placements that produce no-op fallback behavior at runtime with no error
- **Trade-offs:** Stricter API surface; consumers must use valid placement values; type is coupled to the `PopupPlacement` union definition
- **Breaking if changed:** If `PopupPlacement` union is later narrowed (placements removed), existing consumer code passing those placements would get type errors at their call sites

#### [Gotcha] Shadow DOM radio input with tabindex='-1' and aria-hidden='true' makes :focus-visible on the input element permanently dead — the host element must drive focus ring CSS via :host(:focus-visible) (2026-03-07)
- **Situation:** Focus ring CSS used selector `.radio__input:focus-visible ~ .radio__control` but the input had tabindex='-1' and aria-hidden='true', so it never received focus and the ring never appeared
- **Root cause:** In Shadow DOM custom elements, the host element is what receives focus from the browser's focus management system. Internal inputs set to aria-hidden cannot receive focus events, so any :focus-visible on them is unreachable
- **How to avoid:** Host-based :focus-visible is simpler and more correct, but requires understanding that Shadow DOM focus piercing works differently than regular DOM

#### [Gotcha] aria-live='polite' on a role='alert' element creates an implicit ARIA conflict — role='alert' already sets aria-live='assertive' implicitly; explicit polite overrides it silently in some browsers and creates undefined behavior (2026-03-07)
- **Situation:** Error message element had both role='alert' and aria-live='polite' which are contradictory — alert demands immediate interruption, polite queues the announcement
- **Root cause:** Removing aria-live='polite' lets the role='alert' semantic work as specified — screen readers use assertive live region behavior automatically
- **How to avoid:** Simpler markup, correct behavior; no tradeoffs

### Moved role='radio' setAttribute from connectedCallback to constructor in custom element to eliminate the brief upgrade gap where element exists in DOM with no role (2026-03-07)
- **Context:** Between element construction and connectedCallback, the element exists in the DOM without role='radio', creating a window where AT could encounter an unrecognized element type
- **Why:** Constructor runs synchronously during element upgrade. connectedCallback fires asynchronously after insertion. Any AT scan between insertion and connectedCallback sees a roleless element
- **Rejected:** Keeping role in connectedCallback — simpler but leaves a race condition window, especially during server-side rendering or hydration where elements may be scanned before connection completes
- **Trade-offs:** Constructor-set attributes persist even if element is moved between documents; connectedCallback would re-apply on each connection. For static role attributes this is irrelevant
- **Breaking if changed:** Moving back to connectedCallback reintroduces the AT race window — low probability in practice but a real WCAG failure under audit

#### [Gotcha] WeakMap is the correct structure for storing per-radio individual disabled state before group-level disable — not a regular Map or array index — because radios can be dynamically slotted in/out (2026-03-07)
- **Situation:** When group is disabled, individual radio disabled states must be preserved so re-enabling the group restores correct per-radio state rather than enabling all radios uniformly
- **Root cause:** WeakMap keys on the element objects themselves — when a radio is removed from the slot, its entry is automatically garbage collected with no manual cleanup required
- **How to avoid:** WeakMap cannot be iterated (no .forEach, no size), but that's not needed here — only per-element lookup is required

#### [Gotcha] Math.random() for generating element IDs breaks SSR and hydration frameworks (Drupal, Next.js) — server and client generate different IDs causing hydration mismatch; monotonic counter produces deterministic sequences (2026-03-07)
- **Situation:** hx-radio-group generated IDs for legend/fieldset aria-labelledby association using Math.random() which produces different values on server vs client render
- **Root cause:** Monotonic counter (module-level incrementing integer) produces the same sequence assuming components mount in the same order on server and client — which is the normal case for SSR frameworks
- **How to avoid:** Counter assumes stable component mount order — parallel async rendering could produce different sequences, but radio groups are typically sequential DOM elements

### Removed redundant setFormValue/_syncRadios/_updateValidity calls from _handleRadioSelect event handler — Lit's updated() lifecycle already calls these when reactive properties change (2026-03-07)
- **Context:** The event handler was calling state-sync functions directly after dispatching a select event, but the same functions were already called by the Lit updated() lifecycle triggered by the resulting property changes
- **Why:** Lit's reactive update cycle guarantees updated() runs after any property change. Calling these functions twice per interaction causes double DOM mutations and double ARIA attribute updates — observable as flickering in some AT
- **Rejected:** Keeping explicit calls in the event handler as 'defensive programming' — the double-call pattern is actually harmful because it runs synchronously before Lit batches updates, causing inconsistent intermediate state
- **Trade-offs:** Relying on Lit lifecycle means understanding that property changes are async-batched — but this is the correct Lit mental model; fighting it with imperative sync calls creates bugs
- **Breaking if changed:** If updated() lifecycle hook is ever removed or the reactive property change no longer triggers it, the sync functions would need to be re-added to the event handler

### Required validation must be initialized in firstUpdated() not connectedCallback or updated() — firstUpdated runs once after first render when children are available, making it the earliest safe point to check child radio state (2026-03-07)
- **Context:** Required groups were failing silently — checkValidity() returned true before any user interaction because _updateValidity was never called until a radio was clicked
- **Why:** connectedCallback fires before children are slotted (slots not populated yet); updated() on every change is correct for ongoing validation but doesn't cover initial state; firstUpdated is the Lit-idiomatic initialization point
- **Rejected:** Calling _updateValidity in connectedCallback — slotted children not yet available, would always see empty radio list and set invalid state incorrectly
- **Trade-offs:** firstUpdated only fires once; dynamic slot changes still need updated() to re-validate — both hooks are needed for complete correctness
- **Breaking if changed:** Removing firstUpdated call means forms using hx-radio-group with required attribute will pass constraint validation on page load, allowing form submission before any radio is selected

### Collapse buttons rendered as siblings of separator inside a `.divider-track` wrapper, NOT as children of the separator/divider element itself (2026-03-07)
- **Context:** Adding collapse/expand buttons to a resizable split panel divider while passing axe accessibility validation
- **Why:** Nesting interactive elements (buttons) inside another interactive element (the draggable divider) triggers the `nested-interactive` axe violation. Wrapping both in a non-interactive `.divider-track` container keeps them siblings at the same DOM level, satisfying axe rules while preserving visual co-location.
- **Rejected:** Placing collapse buttons as children of the focusable divider element — structurally simpler but fails axe nested-interactive rule
- **Trade-offs:** Requires additional wrapper element and associated styles; layout complexity increases slightly but accessibility compliance is maintained
- **Breaking if changed:** Removing the `.divider-track` wrapper and nesting buttons inside the divider restores the axe nested-interactive violation, failing automated a11y gates

#### [Gotcha] `positionInPixels` setter was bypassing `_setPosition()`, directly setting internal state without applying snap logic or firing the `hx-reposition` event (2026-03-07)
- **Situation:** P1-04 defect: programmatic position changes via the public property were inconsistent with drag-based repositioning
- **Root cause:** The setter likely evolved independently from the drag path and was never wired through the canonical position-setting method
- **How to avoid:** After fix, all position changes (drag, keyboard, programmatic) are consistent; there is now only one code path for position mutation

#### [Pattern] Collapse/expand uses `updated()` lifecycle to save pre-collapse position and restore it on expand, rather than storing position in a separate reactive property updated in the collapse handler (2026-03-07)
- **Problem solved:** Implementing collapsible panels where the user expects their drag position to be remembered across collapse/expand cycles
- **Why this works:** `updated()` fires after Lit re-renders with new property values, ensuring the saved position captures the committed state rather than a transient value during handler execution. Handlers may fire before render, making the saved value unreliable.
- **Trade-offs:** Logic spread across handler (toggle `collapsed`) and `updated()` (side-effect on state transition) is less obvious to read, but is reliable across all state transition paths

#### [Pattern] `aria-disabled` uses Lit `nothing` sentinel when false to omit the attribute entirely, rather than setting `aria-disabled="false"` (2026-03-07)
- **Problem solved:** P2-04: Screen readers and AT have inconsistent behavior when `aria-disabled="false"` is present vs absent — some treat presence of the attribute as disabled regardless of value
- **Why this works:** `aria-disabled="false"` is technically valid but causes confusion with some AT implementations. Omitting the attribute entirely is the unambiguous signal that the element is enabled, matching the ARIA spec's intent.
- **Trade-offs:** Requires Lit `nothing` pattern knowledge; slightly less obvious in template code but produces cleaner, more compatible DOM output

### color-scheme: dark CSS property is applied to the dynamic stylesheet for dark and high-contrast themes so browser-native form controls (inputs, scrollbars, selects) adapt to the active theme. (2026-03-07)
- **Context:** Without color-scheme declaration, browser-native controls render in light mode regardless of custom token application, creating visual inconsistency (e.g. white scrollbars on a dark background).
- **Why:** The CSS color-scheme property is the only standard mechanism to signal to the browser UA stylesheet which rendering mode to use for native controls — custom tokens alone cannot affect them.
- **Rejected:** Not setting color-scheme — native controls would remain visually incorrect in dark/HC themes.
- **Trade-offs:** Easier: fully consistent dark mode including native controls. Harder: none significant; scoped to dynamic stylesheet so no bleed.
- **Breaking if changed:** Removing color-scheme causes browser-native form controls and scrollbars to revert to light appearance in dark/HC modes.

#### [Gotcha] ARIA 1.2 combobox requires role='combobox' on the focusable <input> element, NOT on a wrapper div (2026-03-07)
- **Situation:** hx-time-picker had role='combobox', aria-expanded, aria-haspopup on wrapper div instead of the input element
- **Root cause:** ARIA 1.2 spec mandates the combobox role be on the focusable element. Tests querying [role='combobox'] were returning the wrapper div instead of the input, causing incorrect event targeting and accessibility tree misrepresentation
- **How to avoid:** Tests that previously queried [role='combobox'] now correctly return the input element, which may break old test selectors that assumed div

#### [Gotcha] role='alert' combined with aria-live='polite' is contradictory — role='alert' already implies aria-live='assertive' (2026-03-07)
- **Situation:** Error div had both role='alert' and aria-live='polite' — the polite live region conflicts with alert's assertive announcement behavior
- **Root cause:** role='alert' is defined by ARIA spec as equivalent to aria-live='assertive' + aria-atomic='true'. Adding aria-live='polite' overrides this, causing browsers to either ignore the polite attribute or behave inconsistently across AT implementations
- **How to avoid:** Removing aria-live='polite' means error messages announce immediately/assertively rather than waiting for idle — correct for errors but more interruptive

### Add CSS logical properties (inset-inline-start/end, border-inline-start) alongside or replacing directional properties for RTL support (2026-03-07)
- **Context:** Listbox used left/right: 0 and toggle button used border-left — both break in RTL layouts
- **Why:** Logical properties automatically flip in RTL/LTR contexts without media queries or [dir='rtl'] selectors. Single declaration handles both directions
- **Rejected:** [dir='rtl'] CSS selector overrides — duplicates declarations, easy to forget to update both, more maintenance burden
- **Trade-offs:** Safari < 16.2 has partial logical property support — mitigated by also adding color-mix() fallbacks in the same pass. Modern browser support is now sufficient for production use
- **Breaking if changed:** Reverting to physical properties (left/right) breaks RTL layout without additional [dir='rtl'] overrides being added

#### [Pattern] Add CSS fallback value before color-mix() for Safari < 16.2 browser compatibility (2026-03-07)
- **Problem solved:** Component used color-mix() for shadow colors without fallback, breaking on Safari < 16.2 (released late 2022)
- **Why this works:** CSS cascade means the fallback property declared first is overridden by color-mix() in supporting browsers, while non-supporting browsers simply ignore the color-mix() declaration and use the fallback
- **Trade-offs:** Requires declaring box-shadow twice (fallback + color-mix version) — minor duplication but zero runtime cost

### aria-current='page' moved from host `<li>` (listitem) element to inner `<span part='text'>` element rendered by hx-breadcrumb-item (2026-03-07)
- **Context:** WAI-ARIA APG breadcrumb pattern specifies aria-current should be on the link or text element representing the current page, not on the list item wrapper.
- **Why:** Screen readers announce aria-current in context of the interactive/text element. On a listitem, some AT implementations either miss it or announce it redundantly with the list role. Moving it to the inner element matches the canonical APG example.
- **Rejected:** Keeping aria-current on the host element (listitem) — technically valid HTML but diverges from WAI-ARIA APG reference implementation, causing inconsistent screen reader behavior across AT/browser combinations.
- **Trade-offs:** Easier: axe-core passes cleanly, APG-compliant. Harder: CSS selectors targeting `[aria-current]` on the host element in consumer stylesheets will break.
- **Breaking if changed:** Consumer CSS like `hx-breadcrumb-item[aria-current='page'] { ... }` will no longer match. Must use `hx-breadcrumb-item::part(text)[aria-current='page']` or similar.

#### [Pattern] Explicit `current` attribute on hx-breadcrumb-item with positional fallback maintains backward compatibility while enabling server-side (Drupal) current-page marking (2026-03-07)
- **Problem solved:** Drupal's breadcrumb block renders the current page item — which may not always be the last item in the trail. Positional last-item detection fails for Drupal's non-linear breadcrumbs.
- **Why this works:** Explicit attribute takes precedence; absence falls back to positional detection. Existing consumers with no attribute set get identical behavior. Drupal templates can set `current` on any item server-side.
- **Trade-offs:** Easier: backward compatible, Drupal-compatible. Harder: two code paths for current detection must be kept in sync; edge case where consumer explicitly sets current on a non-last item while also having the last item auto-detected requires WeakSet to resolve.

### Adding a `header` CSS part shifts copy button from position:absolute (floating over code) to flex layout above the code block (2026-03-09)
- **Context:** Audit required a `header` CSS part wrapping the copy button to enable external styling customization
- **Why:** CSS parts expose shadow DOM internals for theming; without a named part, consumers cannot restyle the copy button container
- **Rejected:** Keeping the button absolutely positioned — this prevents external customization and fails audit requirement for CSS part coverage
- **Trade-offs:** Breaking visual change in block mode — button moves from floating overlay position to a distinct header row above the code, changing the component's visual footprint
- **Breaking if changed:** Any screenshots/VRT baselines or consumer CSS relying on the copy button's absolute positioning will break — this is a layout-affecting change

#### [Pattern] aria-live='polite' region for copy confirmation must be in shadow DOM before interaction, not injected on copy action (2026-03-09)
- **Problem solved:** Screen readers require the aria-live region to exist in DOM before content changes to announce — dynamically injecting the region on click doesn't trigger announcements
- **Why this works:** Screen reader live region announcement requires the element to be present and registered before content updates; late injection is silently ignored by most SRs
- **Trade-offs:** Slightly more DOM weight at all times; .sr-only CSS utility required to hide the region visually

#### [Gotcha] aria-live on a scroll container is non-functional; a separate visually-hidden element is required for live region announcements (2026-03-09)
- **Situation:** The original hx-carousel placed aria-live='polite' directly on the scroll container element, which produced zero screen reader announcements on slide change
- **Root cause:** Browser accessibility APIs only pick up text content changes in aria-live regions; a scrolling container's text content doesn't change when slides scroll — only the viewport position changes. A dedicated hidden div whose textContent is imperatively set to 'Slide N of M' triggers the announcement correctly.
- **How to avoid:** Adds one extra DOM node per carousel instance; announcement timing must be managed manually to avoid double-firing on rapid navigation

### label property replaces hardcoded aria-label='Carousel' to support multiple carousel instances per page (2026-03-09)
- **Context:** A static aria-label means every carousel on the page is announced identically, violating WCAG 1.3.1 and making keyboard navigation ambiguous when landmarks are listed
- **Why:** Consumers must be able to differentiate carousels ('Product images', 'Related articles') — the component cannot know the semantic context it is placed in
- **Rejected:** aria-labelledby pointing to an external heading — creates tight DOM coupling and breaks when the carousel is used in isolation or in a shadow DOM context
- **Trade-offs:** Consumers must now supply a label prop (breaking for existing usages that relied on the default); adds a required-in-practice attribute that is technically optional
- **Breaking if changed:** Removing the label property and hardcoding aria-label reverts the multi-carousel accessibility regression; any consumer that set label will have their value silently dropped

#### [Gotcha] Placing aria-label on pagination dots as 'Slide 1' instead of 'Slide 1 of N' fails WCAG 1.3.1 — context is missing for non-visual users (2026-03-09)
- **Situation:** Original dots said only 'Slide 1', giving no indication of total count, so a user couldn't know if there were 2 slides or 20
- **Root cause:** 'Slide 1 of 3' satisfies the informative relationship requirement; the total is available at render time from the observed children count and must be embedded in the label, not inferred
- **How to avoid:** Label must be regenerated whenever slides are added/removed dynamically; static generation at connectedCallback is insufficient for dynamic carousels

### scroll-container part renamed to slide-viewport to expose semantically accurate CSS part names for consumer styling (2026-03-09)
- **Context:** scroll-container described the implementation mechanism (CSS overflow scroll) rather than the user-facing concept; consumers styling 'scroll-container' would be confused about whether changing overflow was safe
- **Why:** Part names are public API — they should describe what the element IS in the component's mental model, not how it works internally. 'slide-viewport' communicates that this is the visible window into the slide track
- **Rejected:** Keeping scroll-container for backward compatibility — no external consumers existed yet (caught at audit phase before release); backward compat cost would be permanent API pollution
- **Trade-offs:** Any documentation or early adopter code referencing ::part(scroll-container) breaks; worth the cost before GA
- **Breaking if changed:** External stylesheets using ::part(scroll-container) silently stop applying after this rename with no warning

#### [Pattern] _autoplayTick() extracted as shared method to eliminate _resumeAutoplay duplication — autoplay interval setup lived in two places with divergent timeout values (2026-03-09)
- **Problem solved:** The original code had the autoplay setInterval call duplicated in both startAutoplay and resumeAutoplay with a subtle difference in delay values, causing inconsistent autoplay speed after user interaction
- **Why this works:** Single source of truth for the tick logic ensures pause/resume/start all use identical timing; extracting to _autoplayTick() makes the interval callback independently testable
- **Trade-offs:** Adds one more private method to the class surface; slightly increases indirection when tracing autoplay flow

#### [Gotcha] role="alert" carries implicit aria-live="assertive" — never add an explicit aria-live attribute to an element with role="alert" (2026-03-09)
- **Situation:** hx-field error div had both role="alert" and aria-live="polite" which creates a conflict — the browser receives contradictory live region signals
- **Root cause:** ARIA spec defines role="alert" as equivalent to aria-live="assertive" aria-atomic="true". Adding aria-live="polite" overrides the implicit assertive behavior in some browsers, meaning errors may not be announced immediately or may be announced twice
- **How to avoid:** Simpler markup, correct screen reader announcement timing; trade-off is developers must know the implicit ARIA mappings

#### [Gotcha] Shadow DOM label for/id association cannot cross shadow boundaries — requires a JS click handler on the shadow <label> to manually focus the slotted control (2026-03-09)
- **Situation:** hx-field renders a <label> in shadow DOM but the actual form control is slotted (light DOM). The HTML for attribute only resolves IDs within the same tree scope
- **Root cause:** Browser label-for resolution is tree-scoped by spec. There is no native mechanism to link a shadow DOM label to a light DOM input. A click handler on the shadow label that calls .focus() on the slotted control is the only reliable cross-boundary approach
- **How to avoid:** Requires JS to be functional; click handler must find the correct slotted control dynamically; but this is the only correct solution

#### [Gotcha] Slotted content inside a shadow DOM live region is NOT announced by screen readers — the aria-live container must be in shadow DOM wrapping the slot element, not on the slotted content itself (2026-03-09)
- **Situation:** hx-field had an error <slot> but dynamically injected error content was never read by screen readers because the live region observation doesn't cross slot boundaries in all AT implementations
- **Root cause:** AT implementations observe mutations on the live region element's shadow-tree subtree. Slotted content lives in the light DOM and mutations there are not reliably observed. Wrapping the <slot> itself in an aria-live container in shadow DOM ensures the shadow DOM subtree mutation is what triggers the announcement
- **How to avoid:** The component owns the announcement behavior (good for consistency); consumers cannot suppress announcements without the data-aria-managed opt-out

### Added data-aria-managed opt-out attribute so third-party custom elements can signal they handle their own ARIA — prevents hx-field from injecting aria-invalid, aria-describedby etc. onto elements that don't expect external ARIA mutation (2026-03-09)
- **Context:** hx-field's ARIA management automatically sets aria-invalid and aria-describedby on slotted controls, but some third-party web components treat unexpected attribute mutations as errors or have their own internal ARIA management
- **Why:** Provides an escape hatch without removing the default helpful behavior. Opt-out via data attribute is discoverable and explicit
- **Rejected:** Opt-in model (require explicit data-aria-managed to enable ARIA injection) — rejected because it breaks the default helpful case and requires all existing consumers to update
- **Trade-offs:** Defaults are correct for 95% of use cases; the 1% with conflicts have a documented workaround; but requires docs to be discoverable
- **Breaking if changed:** Removing the opt-out check will cause runtime errors or double-ARIA in components that rely on the escape hatch

### Changed .field__control wrapper from display:contents to display:block to make ::part(control) styleable (2026-03-09)
- **Context:** display:contents removes the element from the box model entirely — it becomes invisible to the cascade for layout purposes, which means consumers using ::part(control) to apply layout styles (width, margin, flex) get no effect
- **Why:** CSS ::part() selectors can only style the element they target if that element generates a box. display:contents prevents box generation so the part is effectively un-styleable. display:block restores box generation while keeping the element as a wrapper
- **Rejected:** display:flex or display:grid — rejected as more opinionated about consumer layout; display:block is the least-surprising default that just restores box generation
- **Trade-offs:** Correct fix but is a layout-breaking change — any consumer who relied on display:contents pass-through behavior (where children collapse directly into parent flow) will see a new block wrapper appear in their layout
- **Breaking if changed:** Reverting to display:contents re-breaks ::part(control) styling for all consumers

### aria-label must be updated dynamically to reflect the copied state (e.g., 'Copied!' vs 'Copy') rather than relying solely on visual feedback, to satisfy WCAG 1.3.1 (Info and Relationships). (2026-03-09)
- **Context:** Original hx-copy-button only changed visual state on copy success but left aria-label static, meaning screen reader users received no feedback that the copy action succeeded.
- **Why:** WCAG 1.3.1 requires that information conveyed through presentation also be available programmatically. A static aria-label fails assistive technology users who cannot perceive the visual 'copied' state change.
- **Rejected:** Using aria-live region as alternative — rejected because aria-label update on the button itself is more semantically direct and doesn't require additional DOM nodes.
- **Trade-offs:** Requires timer-synchronized aria-label reset alongside the visual state reset, adding coupling between the two state machines.
- **Breaking if changed:** If aria-label update is removed, screen reader users lose confirmation of copy success, violating WCAG 1.3.1.

### Silent clipboard failure must dispatch a custom 'hx-copy-error' event with error detail rather than swallowing the error, enabling consuming applications to implement fallback UX. (2026-03-09)
- **Context:** Original implementation caught clipboard API errors silently, leaving the UI in an ambiguous state with no way for the host application to know the copy failed or provide user feedback.
- **Why:** Custom element API contract should surface failures through events, not hide them. Consumers need the error signal to show toast notifications, retry logic, or degrade gracefully to manual selection.
- **Rejected:** Throwing the error — rejected because uncaught promise rejections in web components cause unhandled rejection warnings and break event loop predictability. Event dispatch is the web component idiomatic pattern.
- **Trade-offs:** Consumers must add event listeners to handle errors; the component itself has no built-in fallback UI, keeping it composable but requiring consumer effort for full error handling.
- **Breaking if changed:** Removing the error event breaks any consumer that has wired up hx-copy-error handlers for fallback UX.

#### [Gotcha] Double-opacity bug on disabled custom elements: applying both CSS 'opacity: 0.5' on the host :host([disabled]) AND inheriting opacity from a parent wrapper that also reduces opacity compounds to visually near-invisible (~0.25 opacity). (2026-03-09)
- **Situation:** hx-copy-button disabled state appeared far more faded than intended — root cause was opacity applied at both host and internal element levels.
- **Root cause:** CSS opacity is multiplicative in the stacking context. Applying it at multiple levels in a shadow DOM component tree compounds rather than overrides.
- **How to avoid:** Fixed by removing redundant inner opacity, leaving only the host-level rule. Trade-off: must audit all state styles to ensure no double-application when modifying disabled styles.

### Success state requires a non-color visual indicator (border-color change) in addition to color change to satisfy WCAG 1.4.1 (Use of Color). (2026-03-09)
- **Context:** Original success state only changed text/icon color to green, which fails WCAG 1.4.1 because color alone cannot be the sole differentiator of state for users with color vision deficiencies.
- **Why:** WCAG 1.4.1 explicitly prohibits using color as the only visual means of conveying information. Adding a border-color change provides a second, non-color visual cue (shape/outline change) distinguishable without color perception.
- **Rejected:** Adding an icon change only — while icons help, border-color is a lower-cost addition that works alongside the existing icon slot pattern.
- **Trade-offs:** Border-color in success state must be carefully chosen to not clash with focus ring styles and must reset properly when the timer expires.
- **Breaking if changed:** Removing the border-color change means the success state is no longer WCAG 1.4.1 compliant for color-blind users.

### aria-labelledby pattern adopted as canonical cross-shadow-DOM labeling approach; `for` attribute retained only for same-shadow-root use cases (2026-03-09)
- **Context:** hx-field-label `for` attribute cannot cross shadow DOM boundaries to associate with light DOM inputs in Drupal/consumer contexts
- **Why:** The HTML `for`/`id` association requires both elements in the same DOM tree; shadow DOM creates a boundary that breaks native label association
- **Rejected:** Renaming `for` to `htmlFor` (P2-03 deferred) — breaking API change not appropriate for audit fix branch
- **Trade-offs:** aria-labelledby works across shadow boundaries but requires consumers to manage IDs manually; `for` remains functional only within the same shadow root
- **Breaking if changed:** Removing `for` attribute support breaks any existing consumer using same-root label association

#### [Gotcha] Moving `aria-hidden` from outer required indicator wrapper to inner visual span required simultaneous test updates — failing to do so produces false test failures (2026-03-09)
- **Situation:** Required indicator restructuring for WCAG 1.3.1: asterisk must be aria-hidden while a visually-hidden span provides AT announcement
- **Root cause:** Test queries targeting the old aria-hidden location break immediately when template structure changes
- **How to avoid:** Tests must stay in sync with template structure changes; easy to miss when splitting work across agents

#### [Pattern] CSS component token `--hx-field-label-required-color` introduced with 3-level fallback chain to `--hx-color-danger` → `--hx-color-error-500` → `#ef4444` (2026-03-09)
- **Problem solved:** Required indicator color was hardcoded; consumers had no override surface without full CSS part overrides
- **Why this works:** Component tokens provide a stable override API; fallback chain ensures the token works even if upper-level semantic tokens are not defined in consumer's theme
- **Trade-offs:** 3-level fallback is verbose but resilient; consumers only need to set the component token for targeted overrides without touching global tokens

### P2-03 (`for` → `htmlFor` rename) explicitly deferred to a dedicated breaking-change PR with changeset (2026-03-09)
- **Context:** Audit fix branch is not the appropriate vehicle for breaking public API changes
- **Why:** Bundling breaking renames in audit fixes makes semver versioning impossible, breaks consumers without warning, and contaminates the audit fix scope
- **Rejected:** Implementing the rename in the audit fix — would require a major version bump and consumer migration guide not appropriate for this PR
- **Trade-offs:** Technical debt remains on the `for` attribute naming but consumers are not broken; dedicated breaking-change PR can include proper migration docs
- **Breaking if changed:** If `for` is renamed without a changeset and major version bump, all existing consumers silently break

#### [Pattern] ARIA live region attributes (role, aria-live, aria-atomic) must be stamped on the host element via connectedCallback AND updated() — not just in shadow DOM — for compatibility with JAWS on older Windows (2026-03-09)
- **Problem solved:** Screen readers like JAWS on older Windows do not pierce shadow roots to discover ARIA semantics defined inside shadow DOM
- **Why this works:** Host element attributes are part of the light DOM and visible to all AT without shadow-piercing. Belt-and-suspenders: inner shadow div also gets aria-atomic for spec-compliant implementations
- **Trade-offs:** Requires lifecycle hooks to keep host attributes in sync with component state; slightly more code but dramatically broader AT compatibility

#### [Gotcha] color-mix() in CSS has limited enterprise browser support — avoid for hover/focus states in design system components (2026-03-09)
- **Situation:** Audit flagged use of color-mix() for hover background color computation; enterprise users may be on older Chromium or IE-era Edge forks
- **Root cause:** Design system components must work in locked-down enterprise environments where browser versions lag by 2-4 years; color-mix() was only broadly available in 2023
- **How to avoid:** Replaced with opacity-only hover state which is universally supported; slight visual difference but zero compatibility risk

#### [Gotcha] Inline SVGs fetched from external sources carry their own role and aria-* attributes that conflict with the host element's ARIA management; inner svg role must be stripped and focusable="false" added (2026-03-09)
- **Situation:** hx-icon sets role=img and aria-label on :host, but the injected inner <svg> often has role=img too, creating duplicate landmark announcements in screen readers; IE11/old-Edge also follow focusable attribute on SVGs, causing tab-stop insertion
- **Root cause:** The host element owns the ARIA contract; inner SVG content is presentational. Screen readers announce the outermost role first — a nested identical role causes double-announcement or role conflict depending on the AT
- **How to avoid:** Stripping aria-* from inner SVG means any embedded SVG accessibility metadata is lost; acceptable since hx-icon controls the label via its own label attribute

#### [Gotcha] Storybook number controls cannot produce null values — use a boolean 'indeterminate' toggle with property binding `.value=${indeterminate ? null : value}` instead of trying to make the number control emit null (2026-03-09)
- **Situation:** Need to allow Storybook users to toggle between determinate (value=65) and indeterminate (value=null) states of a progress ring
- **Root cause:** Storybook's number argType always produces a number, never null. A separate boolean control that conditionally passes null to the property binding is the only reliable pattern.
- **How to avoid:** Adds an extra control to the panel, but gives explicit named state; the `.value=` property binding (not `value=` attribute binding) is required to pass null since attribute binding stringifies to 'null'

### Move static ARIA attributes (role, aria-valuemin, aria-valuemax) from firstUpdated() to connectedCallback() and call super.connectedCallback() first (2026-03-09)
- **Context:** Component was setting ARIA attributes only after first Lit render cycle, meaning SSR-rendered or Drupal-hydrated DOM had no accessibility attributes before JS executed
- **Why:** connectedCallback fires when element is inserted into DOM, before any render. Attributes set here survive disconnect/reconnect cycles and are present for screen readers even if hydration is delayed.
- **Rejected:** Keeping in firstUpdated() — this only fires once per component lifetime after first render, so server-rendered components have an accessibility gap window and reconnected elements lose attributes
- **Trade-offs:** Must remember to call super.connectedCallback() before setting attributes (Lit requirement) or Lit's own setup is skipped, breaking reactivity
- **Breaking if changed:** Removing super.connectedCallback() call causes Lit reactive properties and observers to not initialize, silently breaking all property-based updates

#### [Pattern] aria-busy='true' must be set in indeterminate state and explicitly removed (not just absent) when returning to determinate state (2026-03-09)
- **Problem solved:** Progress ring in indeterminate/spinner mode has no meaningful value to expose to AT — screen readers need to know content is loading
- **Why this works:** aria-busy=true signals to assistive technology that the region is updating and announced values should be held. Without explicit removal, a previously-set aria-busy persists after value is restored.
- **Trade-offs:** Requires coordinating aria-busy toggle in the same _syncState() method that handles value/indeterminate logic, keeping state changes atomic

#### [Pattern] max property must update aria-valuemax in both connectedCallback (initial render) AND updated() lifecycle hook (on subsequent changes) — one location is insufficient (2026-03-09)
- **Problem solved:** Added max property to allow non-100% progress rings (e.g. steps completed out of 5)
- **Why this works:** connectedCallback handles the initial attribute-present-before-render requirement; updated() handles reactive changes when max is set programmatically after connection. Missing either breaks ARIA in that scenario.
- **Trade-offs:** Duplicates the setAttribute call in two lifecycle hooks; acceptable because the logic is trivial and the alternative (a shared method) adds indirection for minimal gain

#### [Gotcha] Cross-shadow aria-controls IDREF references are unresolvable by assistive technologies and must be removed (2026-03-09)
- **Situation:** Toggle button used aria-controls='side-nav-body' to reference the collapsible body element, but the target lived in a different shadow root
- **Root cause:** IDREF-based ARIA relationships (aria-controls, aria-labelledby, aria-describedby) require both elements to exist in the same DOM tree scope — shadow DOM creates a separate scope, so ATs cannot resolve the reference across the boundary
- **How to avoid:** Losing aria-controls means ATs won't announce the controlled region on toggle button focus, but this is better than a broken/misleading reference

### Use @state + attributeChangedCallback to make external attribute changes reactive in Lit without declaring @property (2026-03-09)
- **Context:** hx-side-nav needed to react to data-collapsed being set externally (e.g., by parent orchestrators), but the attribute was not a @property declaration
- **Why:** @property auto-generates observedAttributes and attributeChangedCallback, but using it here would have forced camelCase/kebab-case mapping and type coercion that conflicted with the data-* attribute convention. Manual observedAttributes + attributeChangedCallback with @state gives full control over reactivity without exposing a typed property
- **Rejected:** @property decorator — would work but changes the public API surface, forcing consumers to use the property name instead of data-collapsed attribute, breaking existing HTML usage
- **Trade-offs:** More boilerplate than @property, but preserves the data-* attribute convention and keeps the property private/internal
- **Breaking if changed:** Removing @state would break re-rendering when data-collapsed changes externally; removing attributeChangedCallback would silently ignore external attribute mutations

#### [Gotcha] textContent on a custom element host captures all descendant text including slotted child hx-nav-item labels, corrupting tooltip text (2026-03-09)
- **Situation:** Tooltip label was extracted via this.textContent?.trim() on the hx-nav-item host, but slotted children (nested hx-nav-item elements) contributed their text to the result
- **Root cause:** textContent traverses the entire subtree including shadow-slotted content in some browsers, causing parent nav items with children to show concatenated labels of all descendants as their tooltip
- **How to avoid:** Filtering to TEXT_NODE children only is more brittle if authors insert non-text nodes between the tag and their label text, but this matches the expected usage pattern

#### [Gotcha] Responsive media queries that change visual collapsed state without updating ARIA attributes create an accessibility inversion bug (2026-03-09)
- **Situation:** A @media (max-width: 768px) rule collapsed the sidebar visually to icon-only width, but ARIA expanded/collapsed state was driven by the data-collapsed attribute which was never set by CSS
- **Root cause:** CSS cannot set HTML attributes or element properties — so visual state and ARIA state diverged at the breakpoint, causing screen readers to announce the wrong state
- **How to avoid:** Removing the media query means responsive behavior must be JS-driven (parent sets data-collapsed attribute), which is more explicit but requires consumers to implement breakpoint logic

#### [Pattern] max-height transition instead of display:none toggle for expand/collapse animations (2026-03-09)
- **Problem solved:** Sub-navigation children needed smooth expand/collapse animation, but display:none cannot be transitioned in CSS
- **Why this works:** max-height: 0 with overflow:hidden is visually equivalent to display:none for hiding, but is interpolatable by CSS transitions. Setting max-height to a sufficiently large value (62.5rem) allows content to expand to natural height
- **Trade-offs:** The max-height trick causes a non-linear animation easing when content height is much smaller than the max-height ceiling — the transition appears to 'snap' near the end of collapse. Also, the magic number (62.5rem) must be larger than any realistic content height

### aria-hidden added to host element when open=false, removed when open=true via updated() lifecycle hook (2026-03-09)
- **Context:** Closed toasts must be hidden from the accessibility tree so screen readers don't announce stale notifications
- **Why:** aria-hidden on the host is the correct approach for custom elements — it gates the entire shadow DOM from AT without requiring role manipulation. updated() is the right LitElement lifecycle since it fires after every property change including open.
- **Rejected:** Using display:none or visibility:hidden — these are visual-only and don't remove from AT in all cases. Using role='none' — loses the live region semantics entirely.
- **Trade-offs:** Simpler than managing aria-live region removal; but must ensure aria-hidden is explicitly removed (not just toggled) to avoid stale attribute on re-open
- **Breaking if changed:** Removing aria-hidden management means closed toasts remain announced by screen readers, violating WCAG 4.1.2

#### [Gotcha] hover/focus resume must use _timerRemaining (elapsed subtracted from duration) not restart from full duration (2026-03-09)
- **Situation:** Auto-dismiss timer paused on hover/focus was restarting at full duration on mouse-leave, giving users infinite time by hovering briefly
- **Root cause:** _timerStartedAt is recorded when timer begins, _pauseTimer() computes elapsed = Date.now() - _timerStartedAt and stores remaining = original - elapsed before clearTimeout. Resume calls _startTimer(this._timerRemaining).
- **How to avoid:** Adds two instance fields (_timerStartedAt, _timerRemaining) and a _pauseTimer() method; complexity justified by accessibility compliance

### prefers-reduced-motion media query check inside _startTimer() causes early return, suppressing auto-dismiss entirely (2026-03-09)
- **Context:** Users with vestibular disorders or motion sensitivity should not have time-limited toasts auto-dismiss as it creates urgency and motion
- **Why:** Checking at timer-start rather than at render time means the preference is evaluated at the moment of interaction, respecting system settings changed after page load. Suppressing entirely (not just slowing) is the safest interpretation.
- **Rejected:** CSS-only animation suppression — handles visual motion but not the JS auto-dismiss timer. Slowing animation duration — still dismisses, still creates urgency for affected users.
- **Trade-offs:** Toasts never auto-dismiss for reduced-motion users, requiring manual close action; tradeoff accepted for accessibility
- **Breaking if changed:** Removing the check means toasts auto-dismiss for users with prefers-reduced-motion, potentially causing lost content and WCAG 2.3.3 violation

#### [Gotcha] CSS :host(:not([placement])) fallback incorrectly mapped to bottom-start position instead of the JS default bottom-end (2026-03-09)
- **Situation:** When placement attribute is absent, the CSS fallback should match the JS property default (bottom-end) but the selector was placed inside the bottom-start rule block
- **Root cause:** Since placement reflects to an attribute in LitElement, :host(:not([placement])) only fires if the attribute is manually removed after render — an edge case. The selector being in the wrong block caused incorrect positioning in that edge case.
- **How to avoid:** Removing the selector means truly attribute-less hosts get no position CSS, but JS always sets the attribute so this is a non-issue in practice

### Slide animation direction controlled via CSS custom property --hx-toast-enter-translate with top placements using negative value via ::slotted(hx-toast) (2026-03-09)
- **Context:** Toasts at top of screen should slide down (positive Y), bottom toasts should slide up (negative Y) — hardcoded single transform direction was wrong for top placements
- **Why:** CSS custom property set on the stack container and inherited by slotted children avoids duplicating keyframe definitions. ::slotted(hx-toast) with placement-specific overrides on the stack host is the only way to reach light DOM children from shadow CSS.
- **Rejected:** Separate @keyframes per placement — doubles CSS, harder to maintain. JS-driven animation class — breaks CSS encapsulation and adds runtime overhead.
- **Trade-offs:** Requires understanding that ::slotted styles from stack container affect child toast animations; indirection makes the relationship non-obvious
- **Breaking if changed:** Removing --hx-toast-enter-translate override means top-placement toasts animate in wrong direction (upward away from screen)

### Drupal behaviors file created as hx-toast.drupal.js with dynamic import of toast() utility to avoid bundling the full component into Drupal assets (2026-03-09)
- **Context:** Drupal CMS consumers need a JS behaviors integration that wires data-hx-toast elements to the toast() utility without requiring a full Drupal module
- **Why:** Dynamic import of the component defers loading until first interaction, keeping initial page weight minimal. Parsing JSON options from data attributes follows Drupal's established data-* configuration pattern.
- **Rejected:** Static import — loads full component on page init regardless of whether any toasts exist. Inline script tag approach — not reusable, not detachable on AJAX page updates.
- **Trade-offs:** Dynamic import adds one extra network round-trip on first toast trigger; acceptable since toasts are user-triggered
- **Breaking if changed:** Removing the detach behavior causes memory leaks on Drupal AJAX page transitions where behaviors are re-attached

### Internal <img> carries aria-hidden="true" while the outer container owns role="img" + aria-label, rather than relying on the img's native alt attribute for accessibility announcements (2026-03-09)
- **Context:** Avatar component needs accessible labeling across three states: image, initials, and icon fallback — each needing consistent announcement behavior
- **Why:** Centralizing the accessible label on the container element creates a single, consistent announcement point regardless of which visual state is active. If the img's alt were used directly, switching states (image→initials→icon) would require coordinating aria across multiple elements and could produce silent gaps
- **Rejected:** Using native img alt for accessibility — rejected because initials and icon states have no img element, so the pattern wouldn't generalize; also would require aria-label on img which conflicts with the container's role
- **Trade-offs:** Easier: uniform a11y behavior across all three render states; consistent label source. Harder: developers must remember that setting alt on the host (not img) populates the accessible name — counterintuitive
- **Breaking if changed:** Removing aria-hidden from the internal img would cause double-announcement: screen readers would read both the container role+label and the img alt, producing redundant or conflicting output

#### [Gotcha] Screen readers announce initials letter-by-letter ('J D') unless a full label attribute is provided; the label attribute overrides initials for the aria-label value (2026-03-09)
- **Situation:** Healthcare UX requirement — clinicians and patients need meaningful name announcements, not spelled-out initials
- **Root cause:** The label attribute ('Dr. Jane Doe') populates aria-label on the container, completely replacing what would otherwise be the raw initials string. This is a non-obvious indirection: the visual display shows 'JD' but the a11y tree announces the full name
- **How to avoid:** Easier: rich accessible names without changing visual design. Harder: developers must supply both initials (visual) and label (a11y) — omitting label silently degrades to letter-by-letter announcement with no warning

#### [Pattern] role="img" is conditionally removed from the container when content is slotted into the default slot, delegating semantics entirely to slotted content (2026-03-09)
- **Problem solved:** Custom slot content may have its own semantic structure (e.g., a custom avatar component) that would conflict with the host's role="img" + aria-label wrapper
- **Why this works:** When a developer slots arbitrary content, the component cannot know the correct accessible semantics for that content. Removing role and aria-label from the host prevents the wrapper from asserting incorrect semantics over content it doesn't control
- **Trade-offs:** Easier: safe composition with arbitrary slotted content. Harder: developers slotting content must handle their own a11y entirely — the component provides no scaffolding

### Dot indicator pattern uses empty default slot + pulse attribute + dot-label, applying role="img" and aria-label to inner span only when dot-label is set (2026-03-09)
- **Context:** Badge needed to serve dual purpose: text/count display and purely visual pulse dot indicator
- **Why:** Separating the dot mode into a slot-empty + pulse combination avoids a separate component while still allowing semantic differentiation via aria; role=img is only added when meaningful label exists, avoiding spurious ARIA on decorative elements
- **Rejected:** A dedicated dot-indicator boolean attribute would have been cleaner API but would duplicate pulse animation logic and require separate CSS path
- **Trade-offs:** Simpler component surface but implicit behavior — empty slot + pulse = dot mode is non-obvious to consumers; dot-label requirement for a11y must be documented explicitly
- **Breaking if changed:** Removing the empty-slot detection logic would cause pulse+empty to render as a zero-width text badge instead of a dot indicator; removing dot-label guard would apply role=img to decorative dots

#### [Gotcha] Attribute in docs was hx-size="sm" but correct attribute is size="sm" — the hx- prefix does NOT apply to property/attribute names on hx-* custom elements (2026-03-09)
- **Situation:** The hx- prefix is a tag name namespace convention, not an attribute prefix convention
- **Root cause:** Custom element tag names use hx- to avoid collision with native HTML elements, but attributes follow standard HTML naming without namespace prefix
- **How to avoid:** Consistent with HTML conventions but creates confusion because the component name (hx-badge) implies attributes might also be prefixed

### pulse animation is suppressed via prefers-reduced-motion: reduce in component CSS, not via a JS attribute check (2026-03-09)
- **Context:** The pulse animation is a CSS keyframe animation on the badge's ::before or wrapper element
- **Why:** CSS media query approach is zero-JS, works even before component upgrades, and respects system-level user preference automatically without requiring consumers to pass a prop
- **Rejected:** A no-animation boolean attribute would require consumers to detect prefers-reduced-motion themselves and pass it down — violates the principle that accessibility defaults should be automatic
- **Trade-offs:** Consumers cannot override reduced-motion suppression if they need to for some reason, but this is the correct behavior per WCAG 2.3.3
- **Breaking if changed:** Removing the prefers-reduced-motion rule would cause the pulse animation to play for users with vestibular disorders, violating WCAG 2.3.3 (AAA) and potentially causing accessibility audit failures

#### [Pattern] aria-live="polite" is applied to the count display span, not the host element, scoping live region to just the count value (2026-03-09)
- **Problem solved:** Badge count can update dynamically (e.g. notification count incrementing) and screen readers must announce changes
- **Why this works:** Applying aria-live to the host custom element would cause the entire badge content to be re-read on any DOM change including variant or size updates; scoping to the count span announces only meaningful numeric changes
- **Trade-offs:** Requires careful template structure to ensure count value is isolated in its own span; but produces much cleaner screen reader UX

#### [Pattern] hx-breadcrumb-item detects its parent in connectedCallback() and conditionally sets role='listitem' only when inside an hx-breadcrumb ancestor (2026-03-09)
- **Problem solved:** ARIA list/listitem hierarchy requires listitem roles to be children of list roles. The breadcrumb nav uses role='list' internally, so items need role='listitem' — but only when properly nested, not when used standalone.
- **Why this works:** Positional role-guarding prevents invalid ARIA semantics when sub-components are used outside their intended parent. A static role='listitem' on a standalone element with no list ancestor would be an ARIA violation.
- **Trade-offs:** Easier: ARIA compliance is automatic and context-aware. Harder: role is set asynchronously after connection, not at parse time — though this is fine for ARIA.

### aria-current='page' is placed on the inner <span> (the text element) rather than the hx-breadcrumb-item host element itself (2026-03-09)
- **Context:** WAI-ARIA APG breadcrumb pattern specifies where aria-current='page' should live. Two options: on the custom element host or on the inner rendered element.
- **Why:** Canonical WAI-ARIA APG placement is on the element that represents the link or text content, not the wrapper. Screen readers announce aria-current on the focusable/readable element — the inner span is what gets read, not the shadow host.
- **Rejected:** aria-current on the host element — technically works in some AT but is non-canonical and may be missed by AT that don't traverse shadow DOM boundaries for ARIA attribute inheritance
- **Trade-offs:** Easier: WCAG 2.1 AA compliance, correct AT announcement. Harder: consumers cannot style [aria-current='page'] from outside shadow DOM without ::part() targeting.
- **Breaking if changed:** Moving aria-current to the host would be semantically incorrect per APG and could cause AT to announce it on the wrong element or miss it entirely.

#### [Gotcha] The last-item trailing separator is hidden via a data-bc-last attribute managed by the parent, not by CSS :last-child or :last-of-type (2026-03-09)
- **Situation:** Breadcrumb separators should not appear after the final item. Shadow DOM encapsulation prevents the parent from using CSS :last-child to target slotted children's internal shadow parts.
- **Root cause:** Shadow DOM slot content is not addressable via :last-child from the parent's stylesheet. The parent must communicate 'you are last' to the child via an attribute that the child's own shadow styles can react to.
- **How to avoid:** Easier: works correctly regardless of slot reordering or dynamic item insertion as long as parent re-runs last-item detection. Harder: parent must observe slot changes and update data-bc-last on every mutation; consumers must not set this attribute manually.

### Native `<button>` element rendered inside shadow DOM instead of a host element with `role='button'` (2026-03-09)
- **Context:** A11y audit required verifying role exposure — native button was already present so no explicit ARIA role needed
- **Why:** Native `<button>` provides implicit role, keyboard activation (Enter/Space), form association, and focus behavior for free — no JS needed to replicate what the browser already does
- **Rejected:** Host element + `role='button'` + manual keydown handlers — more code, more failure modes, harder to maintain WCAG conformance
- **Trade-offs:** Shadow DOM encapsulation means form association requires `formAssociated = true` and ElementInternals; slightly more complex but correct
- **Breaking if changed:** Switching to a div-based host with role=button would require reimplementing keyboard activation, form association, and disabled state handling manually

### `aria-disabled` is only applied in anchor (`<a>`) mode, not on native disabled buttons (2026-03-09)
- **Context:** Disabled state handling differs between anchor and button elements — native `<button disabled>` suppresses events and AT announcement automatically
- **Why:** `<button disabled>` already communicates disabled state to assistive technology and prevents interaction natively; adding `aria-disabled` redundantly on a native disabled button is unnecessary and potentially confusing
- **Rejected:** Uniform `aria-disabled` on all disabled states — would be redundant on native buttons and could cause double-announcement in some screen readers
- **Trade-offs:** Two separate code paths for disabled (native attribute vs aria attribute) — slightly more complex logic but semantically correct for each element type
- **Breaking if changed:** If anchor mode loses `aria-disabled` when disabled, screen readers won't announce the disabled state since `<a>` has no native disabled semantics

#### [Pattern] Focused child buttons get z-index: 1 elevation to ensure full focus ring visibility when buttons share a border (2026-03-09)
- **Problem solved:** Adjoining buttons in a group share collapsed borders — without z-index elevation the focus ring is clipped by the sibling element's stacking context
- **Why this works:** CSS border-collapse on inline elements clips the focus outline on the non-elevated side; raising the focused element above siblings ensures the full 360° ring is visible, meeting WCAG 2.4.7
- **Trade-offs:** z-index on focused child is invisible to consumers and requires no consumer CSS; downside is it creates a new stacking context that could clip absolutely-positioned children inside a button

### Interactive card uses role="link" + tabindex="0" on inner container rather than wrapping entire card in an <a> tag (2026-03-09)
- **Context:** Making an entire card surface clickable/navigable while maintaining semantic HTML and avoiding nested interactive element violations
- **Why:** A native <a> wrapping block-level content with nested buttons/links creates invalid HTML and WCAG 4.1.2 violations. role="link" on a div allows the card surface to be interactive without nesting constraint violations
- **Rejected:** Native <a> element wrapping card content — rejected because it would make any nested action buttons unreachable (nested interactive elements) and is invalid HTML5 when wrapping block elements in some contexts
- **Trade-offs:** Keyboard activation requires explicit Enter/Space handler since div doesn't natively handle those; but gains clean slot composition and avoids nested-anchor violations
- **Breaking if changed:** Removing tabindex="0" breaks keyboard reachability; removing role="link" breaks screen reader announcement as navigable element

#### [Gotcha] Combining hx-href (interactive card) with the actions slot creates unreachable focusable elements — component issues a console warning but does not prevent the markup (2026-03-09)
- **Situation:** WCAG 4.1.2 forbids nesting focusable controls inside role="link". A developer might naturally want both a clickable card surface AND action buttons inside the same card.
- **Root cause:** The warning is defensive a11y behavior — it cannot structurally prevent the consumer from passing both props, so a runtime console warning is the only enforcement mechanism short of silently dropping the slot content
- **How to avoid:** Warning approach keeps developer informed but still renders broken markup if ignored; a hard enforcement (not rendering actions) would be more correct but more surprising

#### [Pattern] CSS custom properties scoped with --hx-card-* prefix expose all visual customization points (bg, color, border, radius, padding, gap, image-aspect-ratio) without needing variant proliferation (2026-03-09)
- **Problem solved:** Design systems need to balance variant enum flexibility vs consumer customization. Too few variants = consumers hack the DOM; too many = combinatorial explosion.
- **Why this works:** Token-based theming via CSS custom properties allows consumers to override specific values per-instance or via cascade without forking the component. The --hx-card-image-aspect-ratio token is particularly non-obvious — it handles responsive image containment without requiring JS or separate image-wrapper components
- **Trade-offs:** Easier: per-context theming, dark mode, white-labeling. Harder: no design-time guardrails — consumers can produce off-brand cards by overriding tokens freely

### prefers-reduced-motion media query suppresses hover lift and shadow transition animations at the component level rather than relying on global CSS resets (2026-03-09)
- **Context:** WCAG 2.3.3 (Animation from Interactions) requires that motion triggered by interaction can be disabled. Many projects include a global * { transition: none } for reduced-motion but this is not reliable across shadow DOM boundaries.
- **Why:** Web components with shadow DOM do not inherit external stylesheet rules by default. A global reduced-motion reset in the consumer's CSS would not penetrate the shadow root, so the component must handle it internally
- **Rejected:** Relying on consumer's global prefers-reduced-motion CSS — rejected because shadow DOM encapsulation means those styles don't reach component internals
- **Trade-offs:** Component is self-contained and correct by default; but component authors must remember to audit every animation/transition and add reduced-motion overrides internally — it won't be caught by external audits
- **Breaking if changed:** Removing the internal reduced-motion handling means the component fails WCAG 2.3.3 for users with vestibular disorders, even if the consuming app has a global motion preference reset

### aria-roledescription="carousel" is required on the root element in addition to role="region" per WAI-ARIA APG carousel pattern (2026-03-09)
- **Context:** Component had role="region" and aria-label but was missing aria-roledescription, making it non-compliant with the WAI-ARIA Authoring Practices Guide carousel pattern
- **Why:** role="region" alone only marks a landmark; aria-roledescription provides the semantic meaning 'carousel' to screen readers so they announce it correctly rather than just 'region'
- **Rejected:** Relying solely on role="region" with a descriptive aria-label was considered sufficient but fails the APG spec — screen readers need the explicit roledescription to trigger carousel-specific behavior and announcements
- **Trade-offs:** Adding aria-roledescription makes the ARIA tree more expressive but means the component is now tied to the WAI-ARIA carousel pattern semantics — deviation from that pattern (e.g. removing role="group" on items) would create inconsistent screen reader behavior
- **Breaking if changed:** Removing aria-roledescription would cause screen readers to announce the component as a generic 'region' landmark, losing the 'carousel' semantic context and breaking WCAG 2.1 pattern compliance

#### [Gotcha] aria-relevant is non-standard and harmful on live regions for slide announcements — aria-live="polite" + aria-atomic="true" is the correct and sufficient pairing (2026-03-09)
- **Situation:** The live region that announces slide changes (e.g. 'Slide 2 of 3') had aria-relevant="additions text" added, which is a commonly misused attribute
- **Root cause:** aria-live="polite" already controls when announcements fire; aria-atomic="true" ensures the whole region content is read as a unit rather than just the changed node. aria-relevant further restricts what mutations trigger announcements, which can suppress valid announcements or create inconsistent behavior across screen readers
- **How to avoid:** Removing aria-relevant simplifies the ARIA contract and improves cross-screen-reader consistency but means any DOM mutation inside the live region will trigger an announcement — acceptable here since the region content is intentionally replaced on each slide change

#### [Pattern] Autoplay must check prefers-reduced-motion via a computed getter (allowAutoplay) rather than a one-time init check so that system preference changes mid-session are respected (2026-03-09)
- **Problem solved:** Users can change their OS reduced-motion setting at runtime; a one-time check at component connectedCallback would miss these changes
- **Why this works:** The matchMedia API result is live — evaluating it in a getter means every autoplay timer tick re-evaluates the preference, automatically pausing if the user enables reduced-motion after page load without requiring event listener cleanup
- **Trade-offs:** The getter approach has negligible perf overhead (matchMedia.matches is a fast property read) and zero lifecycle complexity, but couples the autoplay logic to the getter — any refactor that caches the result breaks reduced-motion compliance

#### [Pattern] hx-checkbox uses a native <input type='checkbox'> inside Shadow DOM rather than a fully custom ARIA role implementation (2026-03-09)
- **Problem solved:** Building an accessible checkbox web component that works with assistive technology across all browsers
- **Why this works:** Native input carries implicit ARIA role='checkbox' for free — no role= attribute needed, no keyboard handler needed (Space toggles natively), and form participation via ElementInternals delegates to the browser's built-in validity engine
- **Trade-offs:** Easier: a11y compliance, form submission, browser autofill, checkValidity/reportValidity. Harder: styling requires ::part() or CSS custom properties since native input is in shadow DOM and reset stylesheets don't apply

#### [Pattern] C-PATTERN-08: label click double-fire prevention — the <label> wraps the input, but label click is handled once to avoid the native label+input double-fire event pattern (2026-03-09)
- **Problem solved:** When a <label> wraps an <input>, clicking the label fires click on label then re-fires on the underlying input, causing change events to fire twice
- **Why this works:** The hx-change custom event would fire twice per click without this guard — once from the label click propagating to input, once from the input's own change event
- **Trade-offs:** Wrapping approach keeps label+input association entirely within Shadow DOM without generated IDs. Double-fire prevention is a mandatory companion pattern whenever this label structure is used

### aria-describedby is wired to error container when error is set, falling back to help-text container — not both simultaneously (2026-03-09)
- **Context:** The checkbox can have both help text and an error message, but aria-describedby should surface the most actionable information to screen readers
- **Why:** When an error exists it is higher priority than help text — a screen reader user needs to hear the validation failure, not supplemental guidance. Switching describedby target ensures the error is announced on focus without the help text diluting the message
- **Rejected:** Pointing aria-describedby at both containers simultaneously (space-separated IDs) — this would announce both strings but creates a verbose experience and the help text may contradict or confuse the error message
- **Trade-offs:** Simpler screen reader experience in error state. Help text is visually present but not announced when error exists — acceptable because error message is more actionable
- **Breaking if changed:** Wiring both IDs simultaneously would degrade screen reader UX; removing aria-describedby entirely would fail WCAG 4.1.3 (Status Messages)

#### [Gotcha] The indeterminate state must be set via the input.indeterminate JS property, not via an HTML attribute — there is no indeterminate HTML attribute on <input type='checkbox'> (2026-03-09)
- **Situation:** Implementing a tri-state checkbox (checked/unchecked/indeterminate) as a web component with a reflected attribute API
- **Root cause:** The HTML spec does not define an indeterminate content attribute — it only exists as a DOM property. The component must observe the attribute on the host element and then imperatively set input.indeterminate = true in the property setter
- **How to avoid:** The attribute reflection pattern (host attribute → JS property setter → inner input.indeterminate) adds one extra layer but is the only correct approach

#### [Pattern] Use native <fieldset>+<legend> for checkbox groups instead of ARIA role='group' + aria-labelledby (2026-03-09)
- **Problem solved:** hx-checkbox-group needs an accessible group label announced before each child checkbox by screen readers
- **Why this works:** Native <fieldset>/<legend> provides implicit group role AND label association without extra ARIA wiring. Screen readers announce the legend text before each checkbox automatically, which aria-labelledby on a div[role=group] does not guarantee across all AT combinations.
- **Trade-offs:** Easier: disabled propagation to children is automatic via fieldset[disabled]; legend announced universally. Harder: fieldset has legacy browser styling quirks (flex/grid layout bugs in Safari) requiring CSS resets

### C-PATTERN-03: aria-required is NOT placed on the <fieldset>; only ElementInternals signals invalidity (2026-03-09)
- **Context:** Required state must be communicated accessibly without creating duplicate or incorrect ARIA signals on the group container
- **Why:** aria-required on a fieldset is not semantically meaningful per ARIA spec — required applies to form controls, not groups. ElementInternals.setValidity() correctly marks the component invalid at the form level. Visual asterisk uses aria-hidden='true' to avoid redundant announcement.
- **Rejected:** aria-required='true' on fieldset — AT behavior is inconsistent and spec-undefined for group roles; some screen readers announce 'required' on every child checkbox which creates noise
- **Trade-offs:** Easier: clean AT experience with no duplicate required announcements. Harder: developers can't detect required state via standard aria-required attribute inspection — must use ElementInternals or the host's required property
- **Breaking if changed:** Adding aria-required to the fieldset would cause screen readers to announce 'required' before every individual checkbox in the group, creating severe UX noise

#### [Pattern] Error messages use role='alert' region linked via aria-describedby on the fieldset, NOT aria-live on a wrapper (2026-03-09)
- **Problem solved:** Error messages injected after user interaction must be announced immediately by screen readers
- **Why this works:** role='alert' triggers immediate announcement on content injection without requiring focus movement. aria-describedby on the fieldset means the error is associated at the group level, so it's available to AT when focus is anywhere within the group.
- **Trade-offs:** Easier: zero-delay error announcement improves form correction speed for AT users. Harder: assertive live regions can interrupt other ongoing AT announcements — acceptable tradeoff for validation errors

#### [Gotcha] name attribute on hx-checkbox-group must propagate automatically to all child hx-checkbox elements; without this Drupal/FormData integrations silently break (2026-03-09)
- **Situation:** Drupal integration relies on FormData collecting checkbox values by name; each checkbox must carry the group name for new FormData(form).getAll('channels') to work
- **Root cause:** Custom elements don't inherit name from a parent container — each checkbox must explicitly have name set. The group component observes its own name attribute and propagates it to children on connect and on mutation.
- **How to avoid:** Easier: Drupal integration works with zero extra Twig logic. Harder: group must watch for dynamically added child checkboxes (MutationObserver) to propagate name to late-appended items

#### [Gotcha] Array-type properties (like `swatches`) cannot be serialized as HTML attributes and must be set via JavaScript property assignment after element upgrades (2026-03-09)
- **Situation:** hx-color-picker needed to accept a list of preset swatch colors configurable from HTML templates (Drupal Twig, static HTML)
- **Root cause:** HTML attributes are always strings; arrays require JSON serialization. Setting el.swatches = [...] after DOM ready is the only reliable cross-framework approach
- **How to avoid:** Easier: clean JS API with native array type. Harder: Drupal/CMS integrators must add a Behavior/script to bridge data-swatches attribute to the JS property — two-step setup instead of pure declarative HTML

### Gradient grid uses `role='slider'` (not `role='grid'` or custom role) with dual-axis aria-valuetext announcing both saturation AND value percentages in a single announcement (2026-03-09)
- **Context:** A 2D color gradient picker has no native ARIA equivalent — it controls two independent values (saturation, value/brightness) simultaneously via arrow keys
- **Why:** role='slider' is the closest semantic match for a draggable range control; screen readers already know how to announce slider state changes. Dual-axis announcements via aria-valuetext give context without requiring two separate focusable elements
- **Rejected:** Two separate sliders (one for saturation, one for value/brightness) were rejected because they would destroy the direct-manipulation UX of dragging within a 2D gradient space
- **Trade-offs:** Easier: single focus stop, natural drag interaction preserved. Harder: aria-valuetext must encode both axes in one string, and the keyboard mapping (Left/Right = saturation, Up/Down = value) is non-obvious and must be documented
- **Breaking if changed:** Removing aria-valuetext or switching to a custom role would break screen reader announcements and likely fail WCAG 2.1 SC 1.3.1 (Info and Relationships)

#### [Pattern] aria-label dynamically updates from 'Copy to clipboard' to '${label} — Copied' combined with aria-live='polite' aria-atomic='true' live region for screen reader feedback (2026-03-09)
- **Problem solved:** Copy buttons need to communicate state change (copy success) to screen readers without visual-only feedback
- **Why this works:** Two-pronged approach: aria-label update handles the button's accessible name state while aria-live region ensures the state change is announced even if focus doesn't move to the button
- **Trade-offs:** Slightly more complex implementation; ensures maximum screen reader compatibility across AT/browser combinations

#### [Gotcha] Storybook build failure was pre-existing and unrelated to component changes — confirmed by stashing changes and re-running build (2026-03-09)
- **Situation:** Build failure appeared during verify step, creating ambiguity about whether the component implementation caused it
- **Root cause:** Isolating pre-existing failures from new regressions prevents false blame and wasted debugging time
- **How to avoid:** Requires extra diagnostic step (stash + build + pop) but prevents rabbit-hole debugging of unrelated issues

### WCAG 1.4.1 compliance implemented via border on success state as non-color indicator, not just color change (2026-03-09)
- **Context:** Success state (checkmark icon replacing copy icon) must be distinguishable by users who cannot perceive color
- **Why:** WCAG 1.4.1 requires information conveyed by color also be available through other means — border provides the non-color indicator
- **Rejected:** Color-only success indication (e.g., green icon) which fails WCAG 1.4.1 for color-blind users
- **Trade-offs:** Slightly more complex CSS for success state; achieves AAA-level robustness for color-blind accessibility
- **Breaking if changed:** Removing the border from success state creates a WCAG 1.4.1 violation affecting ~8% of users with color vision deficiency

#### [Pattern] Slot-based icon injection (copy-icon, success-icon slots) rather than hardcoded SVG icons inside the component (2026-03-09)
- **Problem solved:** Healthcare and enterprise UIs need icon flexibility — different icon libraries (Lucide, Heroicons, custom) per product
- **Why this works:** Slots let consumers inject any SVG or icon component without forking the web component; the component owns state/behavior, consumers own visual assets
- **Trade-offs:** Consumers must provide icon markup in every usage (more verbose HTML); gains complete icon system agnosticism

#### [Gotcha] hx-copy-error event must fire with both value and error in detail to be useful — value identifies which copy attempt failed when multiple copy buttons exist on page (2026-03-09)
- **Situation:** Healthcare UIs like MRN copy buttons may have 10+ copy buttons per page (one per data field); error handlers need to know which value failed to show contextual fallback
- **Root cause:** Without value in error detail, consumer error handlers cannot display 'Please manually copy: MRN-2026-7823-HD' — they only know something failed somewhere
- **How to avoid:** Slightly larger event payload; enables self-contained error recovery UX without external state

### CSS custom property --hx-carousel-gap on the host element is the canonical API for controlling inter-slide spacing; applying margin hacks to inner content divs is an antipattern that documentation must never demonstrate (2026-03-09)
- **Context:** The Multiple Slides Per Page demo used `margin: 0 0.25rem` on inner content divs to create visual spacing between slides. CodeRabbit flagged this as incorrect — it bypasses the component's own layout API and produces different behavior (content margin vs layout gap).
- **Why:** Exposing --hx-carousel-gap as a CSS custom property on the host is the intentional API surface. Documentation examples are canonical references — if the docs show margin hacks, consumers will copy that pattern and lose the ability to control gap uniformly via the token.
- **Rejected:** Keeping margin on inner divs — rejected because it couples spacing to content structure rather than layout, breaks when content varies, and undermines the design token system
- **Trade-offs:** Using the CSS custom property API requires consumers to know the token name. Easier to restyle globally; harder to discover without docs. The fix itself makes the docs the discovery mechanism.
- **Breaking if changed:** If --hx-carousel-gap token is removed or renamed from the component internals, all documented usage and consumer code using the token breaks silently with no TypeScript error

### Use CSS custom property `--hx-carousel-gap` on the carousel host element instead of margin hacks on inner content divs for multi-slide layouts (2026-03-09)
- **Context:** Multiple Slides Per Page demo needed spacing between slides without breaking the carousel's internal layout calculations
- **Why:** CSS custom properties on the host element flow through the shadow DOM boundary cleanly and keep layout responsibility inside the component; margin hacks on slotted/inner content divs fight against the carousel's own layout engine and can cause overflow or miscalculation of slide positions
- **Rejected:** `margin: 0 0.25rem` on inner content divs — this leaks layout concerns outside the component boundary and can cause double-margin at edges, misaligned snap points, and unpredictable behavior when gap changes
- **Trade-offs:** Easier: gap is a single source of truth, responds to CSS cascade normally, no side effects on slide width calculations. Harder: consumers must know the custom property name exists; not self-documenting in HTML
- **Breaking if changed:** Removing `--hx-carousel-gap` support from the component's internal CSS would silently break all multi-slide demos and any consumer using that property, with no error — layout would collapse to zero gap

#### [Gotcha] aria-live regions in custom elements require an explicit `role='status'` attribute to be announced reliably across screen readers (2026-03-09)
- **Situation:** hx-carousel had an aria-live region for announcing current slide position but it was missing `role='status'`
- **Root cause:** `aria-live='polite'` alone is not consistently honored by all screen reader + browser combos (especially NVDA+Chrome and VoiceOver+Safari); `role='status'` is the implicit role that maps to `aria-live='polite'` and adding it explicitly ensures the accessibility tree is correctly constructed before dynamic updates fire
- **How to avoid:** Easier: consistent screen reader announcement across AT combinations. Harder: redundancy between role and aria-live must stay in sync if live region politeness ever changes

### decorative boolean attribute triggers role='presentation' instead of role='separator', suppressing screen reader announcement entirely (2026-03-09)
- **Context:** hx-divider needs to support both semantic separators (announced by screen readers) and purely visual dividers (decorative lines between metadata fields)
- **Why:** WCAG 2.1 distinguishes between meaningful separators that convey document structure and decorative lines that would create noise for AT users. Using role='presentation' is the correct semantic override rather than aria-hidden because it works with the existing role='separator' baseline without requiring aria attribute toggling
- **Rejected:** aria-hidden='true' was an alternative but role='presentation' is semantically more precise for replaced roles and plays better with polite live regions
- **Trade-offs:** Simpler consumer API (one boolean vs managing aria attributes manually), but requires the component to own the full ARIA role switching logic internally
- **Breaking if changed:** Removing decorative support forces consumers to manage aria-hidden manually, creating inconsistent AT behavior across implementations

#### [Gotcha] aria-orientation must reflect the orientation property dynamically, not just set it at construction time (2026-03-09)
- **Situation:** Vertical dividers in flex rows require aria-orientation='vertical' to be correct — defaulting to 'horizontal' without reflecting the property would cause screen readers to announce incorrect orientation
- **Root cause:** Custom element property reflection must stay in sync with the DOM attribute. If aria-orientation is set once in connectedCallback and not updated on property changes, programmatic orientation changes (e.g., responsive layout switches) would leave stale ARIA state
- **How to avoid:** Requires a property setter/attribute changed callback for orientation, adding component complexity, but ensures AT correctness across all usage patterns

#### [Gotcha] Code sample label 'no build tool required' was misleading — the library still must be loaded via CDN or bundle even for minimal markup examples (2026-03-09)
- **Situation:** A documentation code snippet was labeled to imply zero dependencies, when in fact the custom element requires the Helix library script to be present on the page
- **Root cause:** Custom elements are inert HTML until their defining script registers them; labeling a snippet 'no build tool required' implies the markup alone is sufficient, which causes broken demos for new users
- **How to avoid:** More accurate label ('requires the library to be loaded') sets correct expectations at the cost of slightly more verbose copy

### hx-field injects a visually-hidden <span> into light DOM as the aria-describedby anchor for slotted controls, rather than using shadow DOM for the description element (2026-03-09)
- **Context:** Slotted native inputs need aria-describedby to point to help text and error messages, but shadow DOM IDs are not referenceable from light DOM elements
- **Why:** ARIA attributes that cross shadow boundaries (aria-describedby, aria-labelledby, aria-controls) require IDs to exist in the same DOM tree as the referencing element. Injecting the span into light DOM makes the ID visible to the slotted input's accessibility tree computation.
- **Rejected:** Placing the description span inside shadow DOM — this would make aria-describedby on slotted native inputs non-functional because shadow DOM IDs are scoped and not referenceable from light DOM
- **Trade-offs:** Easier: native input accessibility works without JS hacks or ARIA reflection API. Harder: the injected span is part of light DOM and could be accidentally removed or styled by consumers
- **Breaking if changed:** Removing or relocating the injected description span breaks screen reader announcement of help text and error messages for all slotted native inputs

#### [Gotcha] hx-field must NOT be used to wrap checkbox groups or radio groups — a fieldset/legend pattern is required instead (2026-03-09)
- **Situation:** Multiple controls sharing one logical label is a different ARIA pattern than single-input labeling
- **Root cause:** ARIA requires that grouped controls use role=group (fieldset) with an accessible name (legend), not individual label associations. Wrapping a radio group in hx-field would create incorrect label associations and break group semantics for screen readers.
- **How to avoid:** Correct semantics for all input types. Trade-off: developers must know which wrapper to use per input type, increasing cognitive load

### Error state is set programmatically via a property (field.error = '...') rather than through a slotted error element or CSS class toggling (2026-03-09)
- **Context:** Form validation errors need to be announced immediately by screen readers when they appear
- **Why:** Setting error as a property allows the component to internally manage role=alert on the error container, ensuring the announcement fires reliably on every assignment. Consumer doesn't need to manage live region markup or timing.
- **Rejected:** Slotted error element — consumer would need to inject/remove a live region element, risking double-announcement or missed announcements if element is reused. CSS class toggle — no announcement without JS to also update live region content.
- **Trade-offs:** Easier: guaranteed screen reader announcement, single API for all error states. Harder: error state lives in JS property not HTML attribute, slightly less inspectable in DevTools
- **Breaking if changed:** Bypassing the property API (e.g., directly injecting error markup into the slot) will not trigger role=alert announcement

#### [Pattern] disabled must be set on BOTH hx-field AND the slotted native control — hx-field[disabled] handles visual treatment only, the native control's disabled attribute prevents interaction (2026-03-09)
- **Problem solved:** Web component wrappers cannot automatically disable slotted native elements because slot content is in light DOM and not under the component's control
- **Why this works:** The disabled IDL attribute and form submission exclusion only work on the native element itself. The component can apply opacity/pointer-events via CSS for visual feedback, but cannot prevent the native input from being interacted with or submitted unless the native disabled attribute is present.
- **Trade-offs:** More explicit consumer API (two attributes to set). Prevents unexpected behavior where the component silently mutates consumer-provided DOM.

#### [Gotcha] hx-field's label slot requires manual for/id wiring when used with rich label content — aria-label is NOT applied automatically in the rich label slot case (2026-03-09)
- **Situation:** The component cannot know the slotted control's ID when consumers provide a custom label element via slot rather than the label attribute
- **Root cause:** When using the label attribute (string), the component generates and wires the for/id relationship internally. When a label slot is used, the consumer provides arbitrary markup and the component cannot introspect or auto-wire the association without violating slot encapsulation.
- **How to avoid:** Flexible rich label content support. Trade-off: consumers must understand the dual-mode API and manually wire accessibility when using the slot variant

### hx-grid doc page uses a healthcare patient dashboard (12-column, vitals cards, care summary + alerts sidebar) as the primary live demo pattern rather than a generic layout example (2026-03-09)
- **Context:** Grid components need realistic demos that show practical column-spanning — generic 'col 1 / col 2' examples don't communicate real-world value
- **Why:** Helix is a healthcare design system; domain-specific examples reduce the cognitive distance between the demo and the actual use case, making adoption faster for healthcare frontend developers
- **Rejected:** Generic e-commerce or blog layout demos are common but irrelevant to the target audience
- **Trade-offs:** More relevant to the target domain; less reusable as a generic reference for non-healthcare consumers
- **Breaking if changed:** If the library expands beyond healthcare, the demo examples would need updating to avoid confusing new consumers

#### [Gotcha] hx-help-text default variant intentionally has NO ARIA role — only error gets role=alert, warning/success get aria-live=polite (2026-03-09)
- **Situation:** A11y audit of hx-help-text variants during launch readiness review
- **Root cause:** Static hint text (default variant) should not interrupt screen reader flow. role=alert triggers assertive interruption which is disruptive for non-critical hints. Only time-sensitive or error states warrant live region semantics.
- **How to avoid:** Correct WCAG semantics per variant type; requires consumers to understand that default variant is intentionally inert for screen readers

#### [Pattern] Component id + consumer aria-describedby is the canonical linking pattern — the component itself does not auto-inject aria-describedby (2026-03-09)
- **Problem solved:** hx-help-text accessibility integration with form inputs
- **Why this works:** Web component cannot reach outside its own DOM to set aria-describedby on a sibling input. The consumer must wire the relationship. This keeps the component self-contained and composable.
- **Trade-offs:** Simpler component internals; shifts linking responsibility to the consumer; works with any host element type (input, select, textarea, custom elements)

### APG Menu Button pattern used for hx-dropdown: aria-haspopup='menu', aria-controls linking trigger to menu, aria-expanded toggling on open/close state (2026-03-09)
- **Context:** Dropdown components are frequently implemented with incorrect ARIA roles — using aria-haspopup='listbox' (for selects) or aria-haspopup='true' (generic) instead of the semantically correct 'menu' value for interactive menu items
- **Why:** APG Menu Button pattern is the W3C-blessed pattern for trigger+menu combos where menu items are actions (not options). 'menu' value on aria-haspopup signals to AT that descendants are menuitem roles, enabling proper AT reading modes and keyboard interaction expectations
- **Rejected:** aria-haspopup='listbox' rejected because that implies selection semantics (combobox pattern); aria-haspopup='true' rejected as it loses semantic specificity for screen reader virtual cursor modes
- **Trade-offs:** Requires all child interactive elements to use role='menuitem' (or menuitemcheckbox/menuitemradio) — mixing in role='option' or plain buttons breaks AT expectations. More opinionated API surface but correct semantics.
- **Breaking if changed:** Removing aria-haspopup='menu' or changing to 'true' breaks screen reader announcement of popup type. Removing aria-controls breaks the programmatic association between trigger and menu panel — AT can no longer navigate directly to the menu.

#### [Pattern] Arrow key navigation + Escape-to-close implemented in hx-dropdown to meet WCAG 2.1 AA keyboard interaction requirements for menu widgets (2026-03-09)
- **Problem solved:** Custom web component dropdowns that rely solely on Tab navigation fail WCAG 2.1 Success Criterion 2.1.1 (Keyboard) for menu widgets, which require arrow key traversal per APG Menu Button pattern
- **Why this works:** APG specifies that menus must support: ArrowDown/ArrowUp to move focus between items, Home/End to jump to first/last item, Escape to close and return focus to trigger, Enter/Space to activate. Tab should close the menu (not traverse items). This matches native OS menu behavior AT users expect.
- **Trade-offs:** Keyboard handler complexity increases significantly. Must intercept keydown on the menu container and manually manage focus with querySelector/focus() calls. But: passes axe-core automated checks AND manual AT testing.

#### [Pattern] 793-line MDX doc page with 12 mandatory sections including Drupal Integration and Standalone HTML sections alongside the standard component API sections (2026-03-09)
- **Problem solved:** Helix is a design system used in both Drupal CMS contexts (where components are dropped into Twig templates) and standalone HTML/JS contexts — single-framework docs miss half the user base
- **Why this works:** Drupal consumers don't use npm imports or ES module syntax — they need script tag CDN usage and data-attribute-driven initialization patterns. Without a dedicated Drupal Integration section, Drupal developers reverse-engineer usage from framework-centric docs or give up and use a different component.
- **Trade-offs:** Doc pages are significantly longer and require maintaining two usage paradigms. But: reduces support burden from Drupal teams who otherwise file 'how do I use this in Twig' tickets.

#### [Pattern] CodeRabbit review threads marked as INFO/Trivial Nitpick with empty bodies should be denied without code changes (2026-03-09)
- **Problem solved:** PR review thread PRRT_kwDORRAfU85zJynu had no actionable feedback content despite being flagged — empty body with only a severity label
- **Why this works:** Resolving empty feedback threads without changes avoids unnecessary churn and preserves intentional documentation patterns that were correctly authored
- **Trade-offs:** Faster PR throughput; risk is ignoring a thread that had implied intent, but empty body is unambiguous

#### [Gotcha] Docs that show optional attributes in both 'with' and 'without' examples must explicitly label WHY each form is used, or they appear contradictory (2026-03-09)
- **Situation:** hx-icon MDX docs showed 'no sprite-url needed' comment followed immediately by an example WITH sprite-url, creating the impression the doc contradicted itself
- **Root cause:** Users scanning examples pattern-match on code not comments; two code blocks showing the same component with and without an attribute look like an error unless the distinction is labeled in the code comment itself
- **How to avoid:** Verbose inline comments add noise but are necessary when optional attributes change behavior mode (inline vs external sprite) rather than just tweaking appearance

#### [Gotcha] Installation code blocks that show both bash install AND import statements make any subsequent standalone import block redundant and confusing (2026-03-09)
- **Situation:** hx-icon docs had a bash block showing npm install + import, then a separate 'Then register the component' section with the identical import repeated
- **Root cause:** Docs authors often write setup steps sequentially (install → then import) without recognizing the bash block already contains the import, creating duplication
- **How to avoid:** Single combined block is more scannable but loses the explicit 'registration' framing that helps users understand the import is a side-effect registration call, not just a module dependency

#### [Gotcha] Lit's string interpolation aria-hidden=${String(false)} sets aria-hidden="false" which browsers treat as truthy (element IS hidden), not falsy. Must use boolean directive ?aria-hidden=${!visible} which removes the attribute entirely when false. (2026-03-10)
- **Situation:** Popover P0-06: element was always announced as hidden to screen readers even when visible because aria-hidden="false" is not equivalent to aria-hidden absence.
- **Root cause:** The ARIA spec defines aria-hidden as a token attribute where any string value including 'false' makes it present/truthy in some AT implementations. Removing the attribute entirely is the only safe way to mark something as not-hidden.
- **How to avoid:** Boolean directive is Lit-specific syntax; readers unfamiliar with Lit may not recognize ?attr= removes the attribute on falsy values.

### Popover host element role changed from 'dialog' to 'region' to prevent nested dialog ARIA violation when popover opens inside hx-dialog. (2026-03-10)
- **Context:** P1-08: ARIA spec forbids nested dialog roles. Popover inside hx-dialog created dialog-within-dialog, breaking AT navigation and causing undefined behavior in screen readers.
- **Why:** role='region' is a landmark role that provides named section semantics without modal/dialog constraints, making it safe to nest anywhere including inside dialogs. aria-modal='false' was also made redundant and removed since region has no modal semantics.
- **Rejected:** Keeping role='dialog' with aria-modal='false' - doesn't resolve the nested dialog violation at the role level, just clarifies it's non-modal. Some ATs still error on nested dialog regardless of aria-modal value.
- **Trade-offs:** Region is a weaker semantic than dialog - loses implicit 'this is an interactive overlay' signal. But popovers are supplementary content (tooltips/hints), not true dialogs, so region is semantically more accurate.
- **Breaking if changed:** Reverting to role='dialog' re-introduces nested dialog ARIA violation. Any popover opened from within a dialog context will break AT navigation flow.

#### [Pattern] Menu typeahead must filter disabled items at the search predicate level, not at the focus/activation level. Guard: if (item.disabled || item.hasAttribute('disabled')) return false in findIndex callback. (2026-03-10)
- **Problem solved:** P1-09: Typeahead was landing focus on disabled items, making them keyboard-reachable via character search even though they should be skipped per ARIA authoring practices for listbox/menu patterns.
- **Why this works:** Disabled items must be invisible to the typeahead algorithm entirely - not just prevented from activating. If findIndex returns a disabled item's index, focus lands there before any disabled-check can intercept. Filtering at the predicate is the only reliable prevention point.
- **Trade-offs:** Dual check (item.disabled property AND hasAttribute) is required because Web Components may reflect disabled state via either mechanism depending on implementation timing. Redundant but safe.

### CSS part names should reflect the element's semantic role within the component, not generic structural names like 'base' (2026-03-10)
- **Context:** hx-toast had part='base' on both the toast item and the stack container, making external CSS targeting ambiguous and non-descriptive
- **Why:** Semantic part names (toast, toast-stack, box) allow consumers to target exactly what they intend without guessing which 'base' they're targeting. Two sibling components sharing 'base' creates collision risk in stylesheets.
- **Rejected:** Keeping 'base' as a universal root-element convention (used by some design systems like Shoelace). Rejected because Helix has multi-root components where 'base' is ambiguous.
- **Trade-offs:** Part names are now self-documenting and unambiguous; trade-off is breaking all existing consumer stylesheets using ::part(base)
- **Breaking if changed:** Any consumer CSS using hx-toast::part(base) or hx-checkbox::part(checkbox) for the visual box silently stops applying — no error thrown, style just disappears

#### [Gotcha] hx-checkbox had a naming inversion: part='checkbox' was on the visual box span, but the semantically correct mapping is part='checkbox' on the outer container and part='box' on the visual element (2026-03-10)
- **Situation:** Audit found that external developers trying to style the checkbox container had to use the wrong semantic name, and the visual box name didn't match common convention
- **Root cause:** The outer container IS the checkbox component boundary — it should carry the component name as its part. The inner visual box is a sub-element and deserves a more specific name.
- **How to avoid:** Correct semantics going forward; one-time breaking change for any consumer who targeted ::part(checkbox) expecting the visual box

### Slot presence detection changed from assignedNodes() to assignedElements() across 14 components to detect only element nodes, not text nodes (2026-03-10)
- **Context:** 16 handlers used assignedNodes({flatten:true}) to check if a slot has content — but this returns text nodes (whitespace, newlines) as truthy, causing false positives where an 'empty' slot with only whitespace was treated as populated
- **Why:** assignedElements() filters to Element nodes only, matching developer intent: 'is there actual content in this slot?' Whitespace between tags should not trigger slot-populated logic.
- **Rejected:** Trimming text node content and checking length. Rejected as more complex, error-prone, and inconsistent with how the rest of the platform handles slot detection.
- **Trade-offs:** assignedElements() is cleaner but ignores intentional text-only slot content (e.g., a slot receiving only a text string without a wrapper element). Components that legitimately accept raw text nodes in slots would need assignedNodes() back.
- **Breaking if changed:** Any slot that intentionally receives unwrapped text content (not wrapped in a span/p/etc.) will now appear 'empty' to presence detection, hiding conditional UI that depends on slot population

#### [Pattern] In hx-dropdown, aria-expanded fallback must be set in BOTH _setupTriggerAria() AND updated() lifecycle hook to keep host aria-expanded in sync across all state changes (2026-03-10)
- **Problem solved:** When trigger slot is empty, aria-expanded on the host element must reflect the open state both on initial setup and on every subsequent open/close toggle
- **Why this works:** Lit's updated() fires after every property change but _setupTriggerAria() runs on slot change events — missing either means the attribute drifts out of sync after the first state change
- **Trade-offs:** Slightly more code paths to maintain but guarantees correctness across all state transitions; host attribute must also be removed when a real trigger IS present to avoid duplicate aria-expanded signals

### Use Lit's `nothing` sentinel for aria-checked='mixed' so the attribute is completely absent (not aria-checked='false') when checkbox is not indeterminate (2026-03-10)
- **Context:** Native <input type='checkbox'> already communicates checked/unchecked state via the checked property and checked attribute — adding aria-checked='false' or aria-checked='true' redundantly overrides browser semantics
- **Why:** ARIA spec says aria-checked on a native checkbox only needs to be present for the 'mixed' state; browser handles true/false natively. Using `nothing` lets the browser remain authoritative for binary states while AT gets explicit mixed state signal
- **Rejected:** Ternary that outputs 'true'/'false'/'mixed' — would override browser-native checked state reporting and potentially cause double-announcement or conflicts in some screen readers
- **Trade-offs:** Cleaner AT experience for the common case; the indeterminate=true path is the only one where aria-checked adds value beyond native semantics
- **Breaking if changed:** Switching to explicit 'true'/'false' values risks screen reader double-reporting or semantic conflict with the native checked IDL attribute

### role="alert" (assertive) for error/warning variants, role="status" (polite) for info/success variants (2026-03-10)
- **Context:** hx-alert needed screen reader live region behavior appropriate to urgency level of message
- **Why:** Assertive interrupts immediately for critical errors/warnings; polite waits for idle for non-urgent info/success — matches healthcare urgency semantics
- **Rejected:** Single role for all variants would either over-interrupt for informational messages or under-announce for critical errors
- **Trade-offs:** Requires variant-aware role assignment logic in component; simpler single-role approach sacrifices UX correctness
- **Breaking if changed:** Swapping roles would cause screen readers to either miss critical alerts or disruptively interrupt for informational messages

### Explicit aria-live attribute intentionally omitted despite using live region roles (2026-03-10)
- **Context:** JAWS and other screen readers double-announce when both role (alert/status) and aria-live are present
- **Why:** ARIA roles alert and status already imply aria-live=assertive and aria-live=polite respectively per spec; adding explicit aria-live causes JAWS to announce twice
- **Rejected:** Adding explicit aria-live=assertive/polite for clarity — rejected because it causes double-announcement in JAWS
- **Trade-offs:** Less explicit markup, but correct single-announcement behavior across screen readers
- **Breaking if changed:** Adding aria-live to the element would cause double-announcements in JAWS, degrading healthcare screen reader UX

### aria-hidden="true" set on host element when alert is closed/hidden (2026-03-10)
- **Context:** Hidden live regions that remain in DOM can still announce content to screen readers if not properly hidden
- **Why:** Setting aria-hidden on the host completely removes the element from accessibility tree when not visible, preventing stale or phantom announcements
- **Rejected:** display:none or visibility:hidden alone — CSS hiding doesn't always suppress ARIA live region announcements in all browsers/AT combinations
- **Trade-offs:** Requires programmatic toggling of aria-hidden in sync with visual state; adds imperative attribute management
- **Breaking if changed:** Removing aria-hidden management would allow closed alerts to still announce content changes to screen readers

#### [Pattern] Focus return managed via returnFocusTo CSS selector prop or caller via hx-after-close event rather than automatic focus management (2026-03-10)
- **Problem solved:** When a dismissible alert closes, focus must return somewhere meaningful — but the component cannot know the correct target in all contexts
- **Why this works:** CSS selector prop allows declarative focus return for simple cases; event-based allows callers to implement complex focus logic without component coupling
- **Trade-offs:** Requires caller awareness for complex focus flows; simpler cases work declaratively without JS

#### [Gotcha] Doc pages must use .mdx extension (not .md) to use the ComponentDoc MDX component for API reference sections (2026-03-10)
- **Situation:** Astro docs component library pages use a custom ComponentDoc MDX component that cannot be imported in plain .md files
- **Root cause:** MDX allows JSX/component imports; plain Markdown does not — ComponentDoc renders structured API tables that would require manual HTML in .md
- **How to avoid:** MDX requires build tooling awareness; .md is simpler but cannot leverage component-driven doc sections

### aria-expanded on <summary> element is intentionally redundant with native <details> semantics (2026-03-10)
- **Context:** hx-accordion-item uses native <details>/<summary> HTML elements which already provide built-in open/closed state semantics
- **Why:** Cross-browser safety net — some browsers/AT combinations don't consistently expose the native <details> open state via accessibility tree, so explicit aria-expanded ensures screen readers reliably announce state
- **Rejected:** Relying solely on native <details> semantics without aria-expanded
- **Trade-offs:** Slight HTML verbosity but guaranteed AT compatibility across all browser/screenreader combinations
- **Breaking if changed:** Removing aria-expanded breaks accessibility in browsers where native <details> AT exposure is inconsistent (Safari+VoiceOver historically unreliable)

#### [Pattern] Drupal.behaviors event listeners must be wrapped in once() utility to prevent duplicate bindings during AJAX attach cycles (2026-03-10)
- **Problem solved:** Drupal's AJAX system re-calls all behaviors.attach() on every AJAX response, meaning event listeners accumulate on elements that persist across requests
- **Why this works:** once() is a Drupal core utility (no import needed) that marks elements as processed, preventing the same behavior from attaching multiple times to the same element
- **Trade-offs:** Zero-cost idiomatic Drupal pattern; the once() key string ('helixAccordion') must be unique per behavior to avoid cross-contamination

### Badge slot is positioned on the outer wrapper element, not inside the overflow:hidden container (2026-03-10)
- **Context:** hx-avatar has an inner container with overflow:hidden to clip the avatar image/initials, but needs to support overlay badge elements
- **Why:** overflow:hidden on the inner container would clip absolutely-positioned badge overlays, making them invisible or partially hidden
- **Rejected:** Placing badge slot inside the clipping container — would cause badge to be clipped at component boundaries
- **Trade-offs:** Outer wrapper placement keeps badge fully visible at cost of slightly more complex DOM structure
- **Breaking if changed:** Moving badge slot inside the overflow:hidden container would silently clip badges, especially corner-positioned ones

### Separate `label` property for accessible name in initials/icon mode, distinct from `name` and `initials` display properties (2026-03-10)
- **Context:** Avatar component renders in multiple modes: image, initials, icon. In initials/icon mode there is no img alt attribute available for screen readers
- **Why:** The `name` property drives initials generation and display logic; conflating it with aria-label creates coupling between visual rendering and accessibility semantics. A dedicated `label` prop allows the accessible name to diverge from display values
- **Rejected:** Reusing `name` as aria-label — would force developers to use display-formatted strings as accessible labels, or break initials generation when label needs different text
- **Trade-offs:** More explicit API surface; developers must set both `name` and `label` in some cases — but semantics are correct and unambiguous
- **Breaking if changed:** Removing `label` in favor of reusing `name` would break screen reader announcements when accessible name must differ from the displayed initials source

#### [Pattern] aria-hidden='true' placed on inner <img> element, with a separate 'label' property providing the human-readable name for screen readers (2026-03-10)
- **Problem solved:** Avatar components that render an image need accessible names, but putting alt text on the img creates duplicate announcements when the component also has a label
- **Why this works:** Separating visual rendering (img) from semantic meaning (label property → aria-label on host) avoids screen readers announcing 'image: John Doe' then 'John Doe' twice; the img is decorative from AT perspective
- **Trade-offs:** Simpler AT experience, but developers must remember to set 'label' not 'alt'; console.warn added when src set without alt as a dev-time guard

#### [Gotcha] Drupal.behaviors JS block intentionally omitted from component docs when component dispatches no events (2026-03-10)
- **Situation:** Documentation template has 13 sections including Drupal Integration, but static/display-only components have nothing to wire up in Drupal.behaviors
- **Root cause:** Including an empty or no-op Drupal.behaviors block would mislead Drupal integrators into thinking event wiring is needed; omission signals the component works declaratively via attributes alone
- **How to avoid:** Docs stay accurate and minimal, but reviewers may flag the omission as a gap without knowing the convention

#### [Gotcha] MDX parse errors occur when <script> tags containing JSX-incompatible syntax (e.g., inline JS with JSON.parse calls) are embedded inside MDX component demos — the MDX compiler treats script content as JSX and chokes on it (2026-03-10)
- **Situation:** hx-data-table.mdx had pre-existing build errors blocking the entire docs site (240 pages) because demo scripts used document.getElementById + JSON.parse to set Web Component properties imperatively
- **Root cause:** MDX uses a JSX-based parser that cannot handle raw HTML script tags with JavaScript that contains characters like < or unescaped braces — the script content is parsed as JSX expressions
- **How to avoid:** JSON string attributes in the markup are simpler and eliminate the need for imperative DOM manipulation, but lose the ability to attach event listeners (e.g., hx-select handler was dropped) and require the Web Component to reflect JSON-parseable string attributes

#### [Pattern] Use a WeakSet for Drupal explicit-current-page detection in hx-breadcrumb rather than checking a property on each render cycle. (2026-03-10)
- **Problem solved:** Drupal can set an explicit 'current' page indicator on breadcrumb items that overrides the default last-item heuristic. Needed a way to track which items were explicitly marked without leaking memory or causing stale state.
- **Why this works:** WeakSet holds object references without preventing garbage collection. When an hx-breadcrumb-item element is removed from the DOM, its WeakSet entry is automatically eligible for GC — no manual cleanup needed. This avoids the stale-reference bug common with Map/Set patterns.
- **Trade-offs:** Zero memory leak risk and clean parent/child decoupling (easier), but WeakSet is not iterable — you cannot enumerate which items are currently marked current (harder to debug).

### Render hx-breadcrumb-item as '<a>' when href is present and '<span>' when it is the current page or has no href, with aria-current='page' on the inner element rather than the host element. (2026-03-10)
- **Context:** WAI-ARIA APG breadcrumb pattern requires aria-current='page' on the link representing the current page. Custom elements add a layer of indirection — the host element is not the semantic anchor.
- **Why:** Placing aria-current on the inner '<a>' or '<span>' (not the custom element host) ensures screen readers encounter the attribute on the actual interactive/semantic element, matching APG spec behavior. The host element is just a container.
- **Rejected:** Placing aria-current on the host hx-breadcrumb-item element was rejected — assistive technologies may not correctly expose ARIA attributes on custom element hosts depending on their role computation, and APG examples show the attribute on the native element.
- **Trade-offs:** Correct AT behavior and APG compliance (easier), but developers inspecting the host element in DevTools won't see aria-current there, which can be confusing during debugging (harder).
- **Breaking if changed:** If aria-current is moved to the host element, axe-core and screen reader tests will likely fail or produce incorrect announcements for the current page item.

#### [Pattern] prefers-reduced-motion support included in component styles at initial implementation, not added reactively (2026-03-10)
- **Problem solved:** Button groups often include transition animations for active/selected state indicators; reduced-motion is frequently skipped until a11y audit flags it
- **Why this works:** Adding reduced-motion support upfront means it is validated by axe-core and design review at component creation time rather than retrofitted under accessibility pressure; it is also trivially cheap to add during initial CSS authoring
- **Trade-offs:** Minimal upfront CSS overhead; avoids a dedicated remediation PR later

### aria-live='polite' is placed on the copy feedback element rather than being injected dynamically, and aria-expanded is on the expand button with language-qualified role='region' labels for the code block container (2026-03-10)
- **Context:** Code snippet has three interactive behaviors: copy-to-clipboard feedback, truncation expand/collapse, and line number display — all need screen reader announcements
- **Why:** Static aria-live regions are announced by screen readers when their content changes; dynamic injection of live regions is unreliable across AT/browser combos because the region must exist in DOM before content changes. aria-expanded on the expand button gives AT users the collapsed/expanded state without inspecting child content
- **Rejected:** Dynamically appending a live region on copy action — this is a known AT bug magnet where NVDA/JAWS miss the announcement if the region wasn't in the initial DOM
- **Trade-offs:** Slightly more DOM always present, but zero risk of missed announcements
- **Breaking if changed:** Removing aria-live or making it dynamic would cause screen readers to silently ignore copy confirmation feedback, breaking WCAG 4.1.3 (Status Messages)

#### [Pattern] hx-checkbox-group uses native <fieldset>+<legend> HTML elements to achieve implicit ARIA group role, avoiding explicit role='group' attribute (2026-03-10)
- **Problem solved:** Checkbox groups require an accessible group label; multiple implementation approaches exist (role=group div, fieldset, aria-labelledby on a div)
- **Why this works:** Native <fieldset>+<legend> provides the group role implicitly and is the most semantically correct HTML pattern; screen readers have the most consistent support for this native element pairing vs ARIA role overrides
- **Trade-offs:** Fieldset has limited CSS flexibility (browser-specific default styling quirks) but provides unambiguous semantics; also C-PATTERN-03 compliance means no aria-required on fieldset which avoids duplicate announcements in some screen readers

#### [Gotcha] role='alert' must NOT have an aria-live override on the same element — adding aria-live='polite' or 'assertive' alongside role='alert' causes duplicate announcements in some screen readers (2026-03-10)
- **Situation:** Error message slot in hx-checkbox-group needed to be announced to screen reader users when validation state changes
- **Root cause:** role='alert' implicitly sets aria-live='assertive' per the ARIA spec; explicitly setting aria-live on the same element creates conflicting or doubled announcements in NVDA/JAWS
- **How to avoid:** role='alert' alone is correct and minimal; tradeoff is that the element must be in the DOM before content is injected (late DOM insertion of alert elements can be missed by some ATs)

### Use role='grid' instead of role='table' for data tables with keyboard navigation (2026-03-10)
- **Context:** WCAG 2.1 SC 2.1.1 requires full keyboard operability; data tables need ArrowUp/Down/Left/Right, Home, End, Space navigation
- **Why:** role='grid' signals to AT that the widget supports composite keyboard navigation patterns (grid interaction model), enabling arrow key traversal between cells. role='table' is a static structure role with no keyboard interaction model.
- **Rejected:** role='table' — would require users to tab through every interactive element sequentially, violating WCAG 2.1 keyboard trap/navigation requirements for complex widgets
- **Trade-offs:** Easier: screen readers announce keyboard affordances correctly, full grid navigation works out of box. Harder: must implement all keyboard handlers manually (ArrowUp/Down/Left/Right/Home/End/Space) — missing any breaks the interaction contract AT expects
- **Breaking if changed:** Removing role='grid' or downgrading to role='table' breaks keyboard navigation contract, causes WCAG 2.1 SC 2.1.1 failure, and breaks axe-core audits

#### [Gotcha] aria-sort must be completely omitted on non-sortable columns, NOT set to 'none' (2026-03-10)
- **Situation:** WAI-ARIA spec for aria-sort; failing to follow this causes screen readers to announce non-sortable columns as having sort state
- **Root cause:** Setting aria-sort='none' on non-sortable headers tells AT the column CAN be sorted but currently has no sort applied — misleading. Omitting the attribute entirely signals the column has no sort capability.
- **How to avoid:** Slightly more conditional logic in rendering (must check sortable flag before emitting attribute), but correct semantic communication to screen readers

#### [Pattern] Skeleton loading rows require aria-hidden='true' even when aria-busy='true' is set on the parent table (2026-03-10)
- **Problem solved:** Loading states in data tables need to communicate busy state without exposing meaningless placeholder content to AT
- **Why this works:** aria-busy='true' on the table tells AT to wait before reading content, but screen readers may still traverse into child elements depending on implementation. aria-hidden='true' on skeleton rows provides a belt-and-suspenders guarantee that placeholder content is never announced.
- **Trade-offs:** More verbose markup, but consistent zero-noise experience across all screen readers. No functional trade-off.

#### [Pattern] The hx-color-picker component stores a completed AUDIT.md file inside the component directory itself, documenting prior P0/P1/P2 findings and their fixes as a permanent artifact. (2026-03-10)
- **Problem solved:** Multiple agents may audit the same component across different feature branches. Without a persistent artifact, each agent repeats the same audit work and may reach different conclusions.
- **Why this works:** Colocating AUDIT.md with the component source makes the audit history discoverable during code review and future agent runs, preventing redundant work and providing a paper trail for compliance.
- **Trade-offs:** Easier: future agents and developers immediately know the component has been audited and what was fixed. Harder: AUDIT.md must be kept up to date if the component changes; a stale AUDIT.md could create false confidence.

#### [Gotcha] In Lit web components, SVG child elements rendered via interpolated tagged templates must use the `svg` tagged template literal (not `html`) to ensure correct namespace assignment (2026-03-10)
- **Situation:** Hamburger icon <line> elements were invisible because `html`<line>` creates HTMLUnknownElement in the HTML namespace, which SVG renderers ignore
- **Root cause:** SVG elements require SVG namespace (http://www.w3.org/2000/svg) to be recognized by the browser's rendering engine. The `html` tag creates elements in the HTML namespace regardless of their tag name. Lit's `svg` tag explicitly sets the SVG namespace for all elements within the template
- **How to avoid:** Requires importing both `html` and `svg` from lit; developers must consciously choose the correct tag per template context. Easier: SVG renders correctly without any runtime workaround. Harder: developers unfamiliar with Lit's namespace-aware template tags will repeat this mistake

### Disabled links render as <span role="link" aria-disabled="true"> instead of <a disabled> (2026-03-10)
- **Context:** HTML anchor elements do not support the disabled attribute natively — adding disabled to <a> has no effect on behavior or AT announcements
- **Why:** A <span> with role=link and aria-disabled=true correctly communicates disabled state to screen readers while preventing navigation. The element remains focusable via tabindex=0 so keyboard users can still discover it.
- **Rejected:** Using <a href> with pointer-events:none and aria-disabled — still navigable via keyboard Enter and still fires click events; using <a> without href — loses link semantics and focus styling
- **Trade-offs:** Easier: correct AT announcement ('link, dimmed/unavailable'), no accidental navigation. Harder: :visited pseudo-class never applies (moot since disabled), CSS must target both a[part=link] and span[part=link]
- **Breaking if changed:** Reverting to <a disabled> breaks keyboard navigation prevention and AT semantics; removing tabindex=0 from the span makes disabled links undiscoverable by keyboard-only users

#### [Pattern] External links inject a visually hidden <span class="sr-only">(opens in new tab)</span> alongside an aria-hidden SVG icon (2026-03-10)
- **Problem solved:** Screen reader users cannot see the external-link icon and have no way to know a link will open a new tab, which is a WCAG 2.1 AA failure (Success Criterion 3.2.2)
- **Why this works:** The SR-only span provides the textual announcement while aria-hidden on the decorative SVG prevents double-announcement. This is the canonical accessible pattern for communicating link behavior changes.
- **Trade-offs:** Easier: WCAG 2.1 AA compliance, works with all major screen readers. Harder: slightly larger DOM per external link; CSS must ensure .sr-only is truly visually hidden but not display:none

#### [Pattern] hx-menu-divider uses role='separator' with aria-orientation='horizontal' set automatically, and is explicitly skipped by hx-menu keyboard navigation logic (2026-03-10)
- **Problem solved:** Divider must be present in the DOM for screen reader sequential reading but must be invisible to keyboard navigation (Arrow key traversal)
- **Why this works:** WAI-ARIA APG Menu pattern requires separators to be announced by screen readers for context but not be focusable stops in the keyboard nav flow
- **Trade-offs:** Requires hx-menu to actively filter out divider elements when building its focusable item list; adds coupling between hx-menu and hx-menu-divider

#### [Pattern] hx-menu-item supports role variants menuitem, menuitemcheckbox, and menuitemradio via a single component with conditional aria-checked attribute (2026-03-10)
- **Problem solved:** Menus can contain mixed interaction models (actions, toggles, exclusive selections) within the same list
- **Why this works:** WAI-ARIA requires distinct roles for these interaction types so AT can announce affordances correctly; a single component handles all three to avoid API fragmentation
- **Trade-offs:** Single component is simpler to use but requires role to be set correctly by the consumer; incorrect role assignment silently breaks accessibility without visual indication

### Known medium-priority a11y items (roving tabindex M2, focus ring M3, aria-label prop M13) were documented in AUDIT.md as future work rather than blocking launch readiness (2026-03-10)
- **Context:** Audit identified these as improvements over the current compliant-but-suboptimal implementation
- **Why:** Items are WAI-ARIA APG compliant at current implementation level; roving tabindex is an enhancement over current focus management, not a compliance failure
- **Rejected:** Blocking launch on all a11y improvements regardless of severity — would delay shipping for non-critical enhancements that don't affect current users
- **Trade-offs:** Ships faster with documented known debt; risk is that M2/M3/M13 get deprioritized indefinitely if not tracked actively
- **Breaking if changed:** Not breaking technically, but omitting roving tabindex means focus management is less robust for complex menu interactions with many items

#### [Gotcha] hx-pagination was already fully WCAG 2.1 AA compliant and library-exported before the launch-ready audit — the entire deliverable was documentation, not implementation (2026-03-10)
- **Situation:** Launch-ready audit tasks can appear to require component work but the component may be production-ready; the audit surface is the doc page completeness, not code gaps
- **Root cause:** Auditing doc pages separately from component implementation means a component can ship code-complete but be blocked on documentation for discoverability
- **How to avoid:** Separating doc completeness from code completeness as a launch gate ensures consumer-facing docs are always present, but creates audit tasks that are pure writing work with no code risk

### meter element uses dual-layer approach: semantic native <meter aria-hidden> plus outer host element with role='meter' and aria-valuetext containing human-readable state (2026-03-10)
- **Context:** Native <meter> element has poor screen reader support — browsers announce raw numeric values without semantic context like 'Low', 'Critical', 'Good'
- **Why:** aria-hidden on the native element suppresses its redundant announcement while the host element's aria-valuetext provides meaningful state labels; this gives both semantic HTML structure and quality screen reader output
- **Rejected:** Pure ARIA meter with no native element — loses native browser styling hooks and form semantics; native-only meter — poor screen reader UX with raw number announcements
- **Trade-offs:** Two elements to keep in sync (value, min, max); but users get both native meter semantics and meaningful announcements
- **Breaking if changed:** Removing aria-hidden from native <meter> causes double-announcement in screen readers; removing aria-valuetext from host degrades to raw number announcement failing WCAG 2.1 AA

### hx-select uses C-PATTERN-04: aria-labelledby on the combobox trigger div (not label[for] pointing to a native input), because the visible control is a custom div with tabindex=0, not a native input element. (2026-03-10)
- **Context:** Select components often use a hidden native select for form submission and a custom div for display. Naive accessibility implementation puts label[for] on the native input, but screen readers then announce the hidden element, not the visible combobox.
- **Why:** The combobox role is on the div, so aria-labelledby must reference that div. label[for] only works with labelable HTML elements — div is not labelable, so the association would be ignored by assistive technology.
- **Rejected:** label[for] pointing to native input was rejected because it associates the label with the hidden element, not the visible combobox trigger, breaking the accessible name computation for the custom control.
- **Trade-offs:** aria-labelledby is more explicit and robust for custom controls but requires careful ID management. Every trigger div needs a stable ID that the aria-labelledby on the combobox references.
- **Breaking if changed:** Removing aria-labelledby or moving it to the native select breaks WCAG 2.1 AA compliance and fails screen reader announcement of the field label when focus lands on the combobox trigger.

#### [Gotcha] role=alert combined with aria-live=polite creates a conflict: role=alert implies aria-live=assertive, so adding aria-live=polite produces undefined/browser-dependent behavior. Use role=alert alone. (2026-03-10)
- **Situation:** Developers often add aria-live=polite to role=alert elements thinking it softens the interruption, but the implicit ARIA semantics of role=alert already include aria-live=assertive.
- **Root cause:** ARIA spec defines role=alert as a live region with aria-live=assertive and aria-atomic=true. Adding aria-live=polite creates an attribute conflict that browsers resolve inconsistently — some honor the explicit attribute, some honor the implicit role semantics.
- **How to avoid:** Using role=alert alone means all announcements are assertive (interrupt current speech). If polite announcement is needed, use role=status instead of role=alert.

#### [Pattern] optgroup children must be cloned into the native (hidden) select to preserve form submission data. Custom rendering of optgroup display in the custom UI is separate from the native select clone. (2026-03-10)
- **Problem solved:** Custom select components render their own visual list but need a native select for form participation. optgroup elements contain option children that must appear in the native select for their values to be submitted with the form.
- **Why this works:** The native select drives form data. If only the top-level options are cloned but optgroup children are not, selecting an option inside a group writes nothing to the form payload — silent data loss.
- **Trade-offs:** Cloning adds DOM mutation complexity and must be kept in sync when options change dynamically. The benefit is correct form submission without custom form data serialization.

### Keyboard resize increments follow a tiered model: Arrow keys ±1%, PageUp/Down ±10%, Home/End to 0%/100% — matching ARIA splitter authoring practice exactly (2026-03-10)
- **Context:** Resizable panel dividers need keyboard operability for accessibility; increment sizes needed to balance precision vs. usability
- **Why:** The ARIA authoring practices specification defines exactly these increments for the splitter pattern — deviating would create inconsistent AT behavior across implementations
- **Rejected:** Fixed pixel increments would break at different viewport sizes; single increment size (e.g. 5% always) loses the coarse/fine control that makes keyboard resize usable
- **Trade-offs:** Implementing all 5 key bindings adds complexity but ensures compliance and consistent UX; the percentage-based model works correctly at any panel size
- **Breaking if changed:** Removing PageUp/Down or Home/End support would drop below ARIA splitter spec compliance and fail axe-core checks

#### [Pattern] hx-split-button is a composite pattern: primary `<button>` + chevron trigger `<button>` + `[role="menu"]` panel + `hx-menu-item` children (2026-03-10)
- **Problem solved:** ARIA menu button pattern requires specific role/relationship structure for screen reader compatibility
- **Why this works:** Two-button split design is required for accessibility — primary action must be independently activatable without opening the menu, and the dropdown trigger must be a separate focusable element with aria-haspopup
- **Trade-offs:** More complex DOM structure and keyboard nav logic, but achieves WCAG 2.1 AA compliance and proper ARIA menu button pattern

### hx-switch uses role='switch' on internal <button> element rather than a custom div or input[type=checkbox] (2026-03-10)
- **Context:** Toggle/switch pattern has multiple valid implementations; native checkbox gives free semantics but limited styling; div requires full ARIA manual wiring
- **Why:** Button element gives native keyboard interaction (Tab focus, Space activation) for free; role='switch' plus aria-checked satisfies ARIA APG Switch Pattern without extra JS; disabled attribute works natively
- **Rejected:** input[type=checkbox] — harder to style track/thumb anatomy consistently across browsers; custom div — requires manual tabindex, keydown handlers, and full ARIA wiring
- **Trade-offs:** Space toggles, Enter does NOT (per APG spec for switches vs buttons) — this is correct but surprises devs expecting Enter to work
- **Breaking if changed:** Changing to div would break keyboard navigation and require reimplementing all native button behaviors; changing to input[type=checkbox] would break the CSS parts/custom property theming architecture

#### [Pattern] Error container uses role='alert' for immediate screen reader announcement rather than aria-live='polite' (2026-03-10)
- **Problem solved:** Form validation errors on toggle switches need to be announced immediately when they appear, not queued
- **Why this works:** role='alert' implies aria-live='assertive' — announces immediately on DOM insertion without user having to navigate to the element; critical for validation feedback
- **Trade-offs:** Assertive interrupts current AT speech which can be jarring; acceptable tradeoff for error states which are high-priority

### @query('.switch__track') uses ! non-null assertion (C-PATTERN-01) rather than optional chaining on the private _trackEl reference (2026-03-10)
- **Context:** LitElement @query decorator returns element or null; without assertion TypeScript requires null checks everywhere _trackEl is used
- **Why:** The track element is always present in the component's render() output — it is not conditionally rendered; null is structurally impossible after connectedCallback; the ! assertion documents this contract and eliminates defensive null checks throughout the class
- **Rejected:** Optional chaining (_trackEl?.focus()) throughout — adds noise, hides bugs if template accidentally changes, gives false sense of safety
- **Trade-offs:** If template is refactored to conditionally render the track, TypeScript won't catch the breakage — runtime null errors instead of compile errors
- **Breaking if changed:** Removing ! and using optional chaining everywhere would technically work but violates C-PATTERN-01 project convention; adding conditional rendering of track without updating the assertion would cause silent runtime failures

#### [Pattern] aria-controls and aria-labelledby between tab triggers and panels are wired dynamically at runtime via _syncTabsAndPanels() rather than requiring authors to manually set IDs in markup (2026-03-10)
- **Problem solved:** WAI-ARIA Tabs Pattern requires programmatic association between tab elements and their panels via aria-controls/aria-labelledby
- **Why this works:** Dynamic wiring eliminates author error — manually maintained ID pairs in HTML are a common source of a11y bugs when panels are added, removed, or reordered
- **Trade-offs:** Dynamic sync adds a small initialization cost and requires the parent component to own synchronization logic; gains are eliminated human error and resilience to DOM order changes

### Sub-component doc pages (hx-tab.mdx, hx-tab-panel.mdx) were kept as lightweight stubs with quick-reference snippets and cross-links to the parent hx-tabs.mdx rather than duplicating full documentation (2026-03-10)
- **Context:** A 3-element component system (hx-tabs, hx-tab, hx-tab-panel) needs documentation — each element could have its own full page or share a single canonical page
- **Why:** Users always use these elements together; duplicating usage, accessibility, and Drupal integration docs across 3 pages creates maintenance drift and inconsistency
- **Rejected:** Full per-element doc pages would surface individually in search but would require keeping 3 copies of examples and accessibility tables in sync
- **Trade-offs:** Discoverability of sub-components is slightly reduced (users must follow a link); maintenance burden and consistency risk are significantly reduced
- **Breaking if changed:** If hx-tab or hx-tab-panel are ever decoupled to work standalone, the stub-only doc pages would be insufficient and mislead developers expecting full API coverage

### hx-top-nav wraps default slot content in a <nav> landmark at the component level, not delegating landmark responsibility to consumers (2026-03-10)
- **Context:** Nav landmark placement — should the component or the consumer own the <nav> element?
- **Why:** Encapsulating the landmark inside the component ensures every usage is accessible without requiring consumers to remember to add it; aria-label is driven by the label prop so screen readers get a meaningful name automatically
- **Rejected:** Exposing a bare slot and expecting consumers to wrap in <nav> — rejected because it creates an a11y footgun: consumers can forget or add duplicate nested <nav> elements
- **Trade-offs:** Consumers lose flexibility to use non-nav semantics (e.g., a toolbar role); but for a top navigation component this is the right constraint
- **Breaking if changed:** Removing the internal <nav> breaks landmark navigation for screen reader users; changing to a div would require all consumers to add their own landmark

#### [Gotcha] Consumers MUST use bare <a> links or <div style='display: contents'> in the default slot — wrapping in a <nav> creates invalid nested landmark structure (2026-03-10)
- **Situation:** Drupal and other CMS integrations naturally wrap menu items in a <nav> element via menu block templates
- **Root cause:** The component already provides the <nav> landmark; a second <nav> inside it creates duplicate nested landmarks which confuse screen readers and fail WCAG 1.3.1
- **How to avoid:** Slightly less intuitive for Drupal integrators used to rendering menu blocks that include their own nav wrapper; documented explicitly in the Drupal integration section

#### [Pattern] Mobile toggle button carries both aria-expanded and aria-controls pointing to the collapsible menu container, and Escape key returns focus explicitly to the toggle button (2026-03-10)
- **Problem solved:** Mobile hamburger menus are a common a11y failure point — focus management after close is frequently omitted
- **Why this works:** WCAG 2.1 SC 2.1.2 (No Keyboard Trap) and the ARIA Authoring Practices disclosure pattern both require that closing a disclosure widget returns focus to the trigger; without this keyboard users lose their place in the page
- **Trade-offs:** Slightly more complex state management in the component; benefit is full keyboard operability without consumer intervention

#### [Gotcha] Running npm run format from project root against worktree files gives false positives — the file appears to pass when it actually has violations (2026-03-10)
- **Situation:** Prettier config resolution when running from a different directory than the file being formatted
- **Root cause:** Prettier resolves its config relative to the CWD, not the target file path; the root prettier config may differ from the worktree's config, or the root config does not apply the same ignores/rules
- **How to avoid:** Must always cd into the worktree directory (or use git -C to run npm scripts from within it) before running format; slightly more verbose workflow

### aria-describedby via light DOM <span slot='content'> bridges Shadow DOM boundary for tooltip accessibility (2026-03-10)
- **Context:** Web components with Shadow DOM encapsulation break native aria-describedby when the referenced element is inside the shadow root, since ARIA IDREFs cannot cross shadow boundaries
- **Why:** Slotted light DOM content remains in the host document's accessibility tree, so aria-describedby on the trigger element can reference a <span> that is slotted into the shadow root without crossing the boundary — the ID lives in the light DOM
- **Rejected:** Putting the tooltip content directly inside the shadow root with an ID would break aria-describedby since the IDREF cannot cross the shadow boundary to reach the trigger element in light DOM
- **Trade-offs:** Slotted approach requires consumers to provide semantic <span slot='content'> rather than a plain string attribute, adding slight authoring overhead but maintaining full a11y compliance without polyfills
- **Breaking if changed:** Moving tooltip content into shadow DOM internals would silently break screen reader announcement of tooltip text, failing WCAG 2.1 SC 1.3.1 and 4.1.3

#### [Pattern] hx-tooltip follows WCAG 2.1 SC 1.4.13 (Content on Hover or Focus) by making tooltip content hoverable, persistent until dismissed, and Escape-dismissable (2026-03-10)
- **Problem solved:** Many tooltip implementations dismiss on mouse-out from the trigger, making it impossible to move the pointer to the tooltip to read long content or click links — violating 1.4.13
- **Why this works:** WCAG 1.4.13 requires that tooltip content can be hovered without disappearing (so users can move cursor to it), persists without a timeout, and can be dismissed with Escape without moving focus
- **Trade-offs:** Requires JS-driven show/hide logic instead of pure CSS, adding complexity, but enables rich tooltip content and passes accessibility audits

#### [Gotcha] React integration with Web Components requires manual event binding because React's synthetic event system does not map to custom events dispatched by Web Components — this is not a HELiX bug but a fundamental React/WC interop gap that requires @helixui/react wrapper package (2026-03-11)
- **Situation:** React is the dominant frontend framework; without a @lit/react wrapper generating proper React components with JSX types, React developers face undocumented friction on every interactive component
- **Root cause:** Lit's @lit/react package exists specifically to solve this — it generates React wrappers that map custom events to React prop callbacks and adds proper TypeScript JSX declarations
- **How to avoid:** @helixui/react is an additional package to publish and maintain; it must be kept in sync with @helixui/library component API changes, adding maintenance burden

### ARIA role placed on host element (hx-alert) rather than internal shadow DOM div (2026-03-11)
- **Context:** Screen readers need to announce the alert region. Initial implementation placed role='alert' or role='status' on an internal shadow div.
- **Why:** Host-level role is discoverable by AT without shadow DOM piercing. Shadow internals are opaque to most AT — role on internal divs may not be announced at all depending on browser/AT pair.
- **Rejected:** role on shadow internal div — rejected because AT cannot reliably pierce shadow root to discover roles on internal elements
- **Trade-offs:** Easier: AT compatibility across browser/screen reader pairs. Harder: Storybook tests that query shadow internals for role assertions all break.
- **Breaking if changed:** Moving role back to shadow internal div would silently break AT announcement in JAWS/NVDA without test failures — tests would pass, accessibility would regress.

### aria-live intentionally omitted from hx-alert to avoid JAWS double-announcements (2026-03-11)
- **Context:** Alert elements with both role='alert' (which implies aria-live='assertive') and an explicit aria-live attribute cause JAWS to announce content twice.
- **Why:** role='alert' already implies aria-live='assertive' per ARIA spec. Adding aria-live explicitly is redundant and triggers JAWS double-announcement bug.
- **Rejected:** Explicit aria-live='polite' on status variant — rejected because role='status' already implies aria-live='polite'
- **Trade-offs:** Eliminates JAWS double-announcement. Creates implicit contract: tests asserting aria-live will fail even though behavior is correct, misleading future developers.
- **Breaking if changed:** Adding aria-live back would fix misleading test failures but reintroduce JAWS double-announcement for users — a silent regression harder to catch than a test failure.

#### [Gotcha] _initRovingTabindex ternary sets ALL items to tabindex=-1 when hasActive is true, making toolbar keyboard-inaccessible after any dynamic slot change (2026-03-11)
- **Situation:** WCAG 2.1 AA failure in hx-action-bar roving tabindex implementation — P1 finding
- **Root cause:** The logic intended to preserve the active item but the ternary incorrectly evaluates: when hasActive=true, every item gets -1 instead of preserving the one item that had tabindex=0
- **How to avoid:** The fix is ~5 lines: check if current item already has tabindex=0 and preserve it rather than clearing all items

### CSS part='overflow' is missing from the overflow slot container despite overflow being a documented reactive API (_hasOverflow state, overflow slot) (2026-03-11)
- **Context:** Shadow DOM encapsulation prevents consumers from styling internal elements without explicit ::part() exposure
- **Why:** The overflow slot was implemented reactively but its container was not exposed as a CSS part — likely an oversight during initial implementation
- **Rejected:** Exposing via CSS custom properties would require pre-defined style hooks; ::part() gives full styling flexibility
- **Trade-offs:** Without part='overflow', consumers cannot style the overflow container (position, visibility, transitions) from outside the shadow root — blocks customization for mobile overflow menus
- **Breaking if changed:** Adding the part later is non-breaking (additive), but consumers who worked around the gap with ::slotted() or host-context hacks would need migration

### Use ElementInternals.setValidity() instead of aria-required on fieldset elements for form-associated checkbox groups (2026-03-11)
- **Context:** hx-checkbox-group needed to communicate required/invalid state to both the browser form validation system and assistive technologies
- **Why:** The ARIA 1.2 spec explicitly does not permit aria-required on the 'group' role — axe-core correctly flags this as an aria-allowed-attr violation. ElementInternals.setValidity() communicates invalidity programmatically through the browser's native constraint validation API, which AT can consume without invalid ARIA attributes.
- **Rejected:** aria-required='true' on the wrapping fieldset element — rejected because axe-core (and the ARIA spec) do not allow aria-required on role=group, which is what fieldset maps to semantically
- **Trade-offs:** ElementInternals approach is more correct and spec-compliant but requires the component to be a form-associated custom element (formAssociated=true). Programmatic validation is less visually obvious than a declarative attribute but more robust.
- **Breaking if changed:** Removing ElementInternals.setValidity() would silently break native form validation integration — the browser would no longer treat the field as invalid even when it is, breaking form submission gating and AT announcements for invalid state

### Implemented formDisabledCallback lifecycle method on hx-checkbox for form-associated custom element support (2026-03-11)
- **Context:** Web Components using ElementInternals must explicitly handle formDisabledCallback to respond to ancestor <fieldset disabled> — the disabled state is NOT automatically propagated like native inputs
- **Why:** Healthcare UIs commonly use <fieldset disabled> to bulk-disable form sections (e.g., read-only patient records). Without formDisabledCallback, the checkbox appears interactive but ignores the disabled state, creating an a11y and UX bug that's invisible in unit tests
- **Rejected:** Relying on CSS :disabled pseudo-class or attribute observer — neither fires for form-associated disabled propagation; only formDisabledCallback receives the signal from the form internals system
- **Trade-offs:** Requires maintaining parity between formDisabledCallback and the direct disabled property setter; two code paths must stay in sync
- **Breaking if changed:** Removing formDisabledCallback silently breaks <fieldset disabled> containment — checkboxes inside disabled fieldsets will appear enabled and accept interaction

#### [Gotcha] prefers-reduced-motion media query is easily missed on subtle transitions like checkbox box animations (2026-03-11)
- **Situation:** Checkbox border/fill transitions are short-duration and subtle, making them easy to overlook during a11y audits — but they still cause vestibular issues for motion-sensitive users
- **Root cause:** WCAG 2.3.3 (AAA) and user preference: users with vestibular disorders can be affected even by small UI animations. The fix is a single @media block disabling transition
- **How to avoid:** None meaningful — the motion-reduced experience is functionally identical, just instant

#### [Gotcha] `repeat` key function using `name + size` concatenation can produce collisions for identical files uploaded twice (2026-03-11)
- **Situation:** Lit's `repeat` directive requires a key function to efficiently diff list updates; files in a FileList don't have stable unique identifiers
- **Root cause:** name+size is a reasonable proxy for identity and covers the common case where users accidentally select the same file — the collision causes the duplicate to be visually deduplicated which is arguably correct UX
- **How to avoid:** Easier: prevents duplicate file display, simple implementation. Harder: if a user legitimately needs two files with identical names and sizes (e.g., same template filled differently), the second is silently dropped from the rendered list

### Error variant uses role="alert" (assertive) while warning/success use aria-live="polite" for ARIA announcements (2026-03-11)
- **Context:** WCAG 4.1.3 compliance for status messages in a help-text component with four variants
- **Why:** Errors require immediate user attention and must interrupt screen reader flow; warnings and success confirmations are informational and should not disrupt the user's current reading context
- **Rejected:** Using role="alert" for all non-default variants would cause excessive interruption for warnings/success; using aria-live="polite" for errors would delay critical feedback
- **Trade-offs:** More complex conditional ARIA rendering logic, but correct accessibility semantics per WCAG intent levels
- **Breaking if changed:** Swapping assertive/polite for error vs warning would break WCAG 4.1.3 compliance and degrade screen reader UX for error states

### Non-default variants render inline SVG icons alongside color changes so color is never the sole visual indicator (2026-03-11)
- **Context:** WCAG 1.4.1 (Use of Color) requires that information conveyed by color also has a non-color indicator
- **Why:** Without icons, a user with color blindness cannot distinguish error from warning from success states solely from the color token change
- **Rejected:** Color-only differentiation is simpler but fails WCAG 1.4.1; using text labels (e.g., 'Error:') would be verbose and alter the component's content contract
- **Trade-offs:** Adds SVG icon rendering logic and icon CSS part; icons must be aria-hidden to avoid redundant screen reader announcements since ARIA roles already convey state
- **Breaking if changed:** Removing icons without adding another non-color indicator would cause WCAG 1.4.1 failure

#### [Pattern] SVG icons use currentColor inheritance so they automatically adopt the CSS token-driven color of the variant without explicit icon color tokens (2026-03-11)
- **Problem solved:** Each variant (error/warning/success) has a distinct color via --hx-color-* tokens; icons must match without duplicating color declarations
- **Why this works:** currentColor propagates the computed color from the parent element into SVG fill/stroke, eliminating the need for separate icon color tokens or hardcoded values
- **Trade-offs:** Icon color is tightly coupled to text color — if a design requirement emerged for icon and text to have different colors in a variant, this pattern would require refactoring

### 0.375rem for --hx-help-text-icon-gap is a component-specific default rather than a semantic spacing token (2026-03-11)
- **Context:** The design token system uses --hx-spacing-* semantic tokens, but no semantic spacing token exists at this exact granularity for icon-text gaps
- **Why:** Forcing the value into a semantic token that doesn't exist would require either creating a one-off semantic token (polluting the token system) or rounding to the nearest existing token (visual inaccuracy)
- **Rejected:** Nearest semantic spacing token would introduce visual discrepancy; creating a new semantic token for a single component use-case adds maintenance burden to the token system
- **Trade-offs:** Component-specific default is acceptable but means the value won't automatically update if the design system's spatial scale changes
- **Breaking if changed:** If the design system adopts a standard icon-gap token at this scale, the component should be updated to reference it for consistency

#### [Pattern] hx-icon implements dual ARIA modes based on whether a `label` attribute is present: decorative icons get `aria-hidden="true"`, informative icons get `role="img"` + `aria-label` (2026-03-11)
- **Problem solved:** Icons serve two semantic purposes — purely decorative (adjacent to visible text) and informative (standalone meaning). WCAG 2.1 requires different markup for each to avoid screen reader verbosity or missing information
- **Why this works:** A single aria strategy fails both cases: always hiding icons breaks standalone informative icons; always exposing them pollutes the accessibility tree with redundant announcements when beside visible labels
- **Trade-offs:** Requires consumers to explicitly provide `label` for informative icons — easy to forget, but the default (decorative/hidden) is the safer failure mode since omitting a label hides rather than misleads

### ARIA grid pattern chosen for calendar UI with full keyboard navigation and focus trap implementation (2026-03-11)
- **Context:** Date pickers require complex keyboard interaction (arrow keys, page up/down, home/end for date navigation) and must trap focus when open to be accessible
- **Why:** WCAG 2.1 AA compliance requires keyboard operability; ARIA grid is the established pattern for two-dimensional navigation widgets like calendars
- **Rejected:** ARIA listbox or custom role — would lose semantic date grid navigation semantics and fail WCAG 2.1 criterion 2.1.1
- **Trade-offs:** 927 lines of implementation and 412 lines of styles; high complexity but necessary for accessibility compliance in healthcare contexts
- **Breaking if changed:** Removing focus trap or ARIA grid roles would break WCAG 2.1 AA compliance and screen reader usability, critical for healthcare applications

#### [Pattern] Focus management traverses shadow DOM via slot.assignedElements() to navigate focusable children (2026-03-11)
- **Problem solved:** Keyboard navigation (arrow keys, tab) must move focus through slotted content inside shadow DOM, which is opaque to standard DOM traversal methods like querySelectorAll
- **Why this works:** slot.assignedElements() returns the light DOM nodes projected into the slot, allowing the component to enumerate and focus them without requiring consumers to expose internal structure
- **Trade-offs:** Focus logic is tightly coupled to slot structure — works correctly for standard slot usage but requires additional handling if consumers nest slots or use multiple named slots

### CSS custom properties must use --hx-* design tokens with fallbacks, never hardcoded values (2026-03-11)
- **Context:** Deep audit found 2 hardcoded values in close button (font-size, line-height) that survived initial T1-27 audit remediation
- **Why:** Design token compliance ensures theming works correctly — hardcoded values break when consumers override the design system tokens
- **Rejected:** Leaving hardcoded values as 'close enough' — rejected because token drift accumulates and theming/white-labeling breaks silently
- **Trade-offs:** Slightly more verbose CSS; gains full theme-ability and passes automated token compliance audits
- **Breaking if changed:** Removing token fallbacks breaks rendering in environments where CSS custom properties are not supported or tokens are not loaded

### Custom combobox trigger uses div[tabindex='0'][role='combobox'] instead of native <button> element (2026-03-11)
- **Context:** Implementing APG select-only combobox pattern for a custom styled select component
- **Why:** ARIA spec for select-only combobox pattern requires role='combobox' on the trigger; placing this role on a native <button> is invalid per APG — button has implicit role='button' which conflicts with the combobox role semantics
- **Rejected:** Native <button> element with role='combobox' override — rejected because layering combobox role on button creates conflicting implicit/explicit role semantics and breaks AT announcement
- **Trade-offs:** div requires explicit tabindex='0' and manual keyboard event handling that button provides natively; gains correct AT behavior and spec compliance
- **Breaking if changed:** Reverting to <button> breaks screen reader announcement of the combobox pattern — ATs would announce it as a button not a combobox, losing expand/collapse state communication

#### [Gotcha] role='alert' and aria-live='polite' must never appear on the same element — role='alert' already implies aria-live='assertive' (2026-03-11)
- **Situation:** Error message div was decorated with both role='alert' AND aria-live='polite' simultaneously
- **Root cause:** role='alert' implicitly sets aria-live='assertive' and aria-atomic='true'; adding aria-live='polite' creates a conflicting live region politeness setting — behavior becomes browser/AT-dependent and unpredictable
- **How to avoid:** Removing aria-live='polite' simplifies markup and guarantees assertive announcement for errors, which is the correct behavior for validation feedback

#### [Gotcha] optgroup children are silently dropped when cloning slot content to hidden native <select> if the traversal only walks top-level slot children (2026-03-11)
- **Situation:** Hidden native <select> for form participation must mirror all option/optgroup structure from the custom slot
- **Root cause:** Single-pass traversal that only looks at direct slot children misses <option> elements nested inside <optgroup> wrappers — they are children of optgroup, not direct slot children
- **How to avoid:** Single-pass walk that handles both option and optgroup children adds complexity to the slotchange handler but guarantees correctness for all valid select content structures

### Tab key must explicitly close the dropdown in a custom combobox; not handling Tab leaves the listbox open as focus moves away (2026-03-11)
- **Context:** Custom keyboard event handler for combobox dropdown — Tab is not naturally handled by custom event listeners
- **Why:** When user presses Tab in an open custom listbox, focus moves to next focusable element but the custom dropdown div remains visible (display:block) because no code closes it — native <select> handles this automatically
- **Rejected:** Relying on focusout/blur events to close the dropdown — rejected because blur fires after focus moves, creating a flash of open dropdown; also blur-based close is unreliable with nested focusable elements inside the panel
- **Trade-offs:** Explicit Tab handler closes dropdown before focus moves, giving clean UX; requires maintaining Tab in the keydown switch alongside ArrowUp/Down/Enter/Escape/Home/End
- **Breaking if changed:** Removing Tab handler leaves dropdown visually open after tabbing away — sighted keyboard users see stale open state

#### [Pattern] Typeahead implemented as default case in keydown switch — single printable character jumps to first matching option (2026-03-11)
- **Problem solved:** APG combobox pattern requires typeahead for keyboard accessibility (WCAG 2.1 AA)
- **Why this works:** Default case in the switch catches any key not explicitly handled; testing event.key.length === 1 and !event.ctrlKey/!event.metaKey filters to printable characters only, preventing modifier keys from triggering typeahead
- **Trade-offs:** Piggybacks on existing keydown handler cleanly; limitation is single-character typeahead only (no multi-character buffer) which is acceptable for select-only pattern but not for editable combobox

#### [Gotcha] :focus-visible alone is insufficient as a focus style — :focus fallback is required for keyboard accessibility in all browsers (2026-03-11)
- **Situation:** Custom combobox trigger (div[tabindex='0']) needed focus ring styling
- **Root cause:** :focus-visible is a progressive enhancement; older browsers and some AT+browser combinations still use :focus for keyboard focus indication. Using only :focus-visible with outline:none on :focus means some users see no focus indicator at all
- **How to avoid:** Dual :focus + :focus-visible rules add a few lines of CSS but guarantee visible focus for all keyboard users; :focus-visible still provides the enhancement of suppressing focus ring on mouse click in supporting browsers

### Sizes Storybook story demonstrates --hx-rating-size CSS custom property at discrete named breakpoints (small/medium/large/extra-large) rather than arbitrary pixel values (2026-03-11)
- **Context:** hx-rating uses a CSS custom property for sizing, meaning consumers can set any value; the audit gap was absence of any visual documentation of the sizing system
- **Why:** Named size tokens (sm/md/lg/xl) align with the design system token vocabulary and give Storybook consumers a reference for expected visual scale without exposing magic numbers
- **Rejected:** Single ArgTypes control with free-form pixel input — rejected because it gives no guidance on intended scale steps and doesn't document the token-based design intent
- **Trade-offs:** Story is opinionated about 4 sizes; consumers using non-standard values must discover behavior themselves, but the common cases are fully documented
- **Breaking if changed:** If the CSS custom property is renamed or the token scale changes, the Sizes story becomes misleading without an update

### Removed `.spinner__sr-text` element entirely; aria-label on host element is the sole AT announcement vector (2026-03-11)
- **Context:** Spinner had both an aria-label on the host AND a visually-hidden `.spinner__sr-text` element containing '...', causing dual announcements in screen readers
- **Why:** Single source of truth for AT text eliminates double-announcement. aria-label on the host element is the semantically correct pattern for a status widget; a separate SR-only text node is redundant and harmful
- **Rejected:** Keeping sr-text but hiding it conditionally — fragile, still risks dual announcement depending on AT/browser combo
- **Trade-offs:** Simpler DOM, no hidden text nodes to maintain; consumer loses ability to put arbitrary punctuation in sr-text but gains predictable AT behavior
- **Breaking if changed:** Removing aria-label from host without replacement leaves spinner completely silent to screen readers

### Added `decorative` boolean reflected property that sets role='presentation' and removes aria-label entirely (2026-03-11)
- **Context:** Spinners co-located with visible loading text (e.g., 'Saving...') must not announce independently — the visible text is the announcement
- **Why:** Without decorative mode, AT users hear both the visible text AND the spinner's aria-label, creating redundant announcements. role=presentation suppresses the element from the accessibility tree entirely
- **Rejected:** Leaving aria-label removal to consumers via attribute override — not ergonomic, not documented, breaks CEM contract
- **Trade-offs:** Explicit opt-in required for decorative usage (correct), but developers must know to use it; forgetting it causes duplicate announcements in common UI patterns
- **Breaking if changed:** Removing decorative mode forces consumers to manually manage aria-label removal in every co-located-text scenario

#### [Gotcha] Reduced-motion fallback arc was at opacity: 0.6, making the static 'in progress' indicator ambiguous (2026-03-11)
- **Situation:** prefers-reduced-motion disables the spinning animation, substituting a static arc. At 60% opacity the arc looked like a disabled or errored state rather than an active loading state
- **Root cause:** Full opacity (1.0) unambiguously communicates 'in progress' — the static arc contrasts clearly against the track ring. The reduced opacity was likely a visual design accident during initial implementation
- **How to avoid:** Static arc at full opacity is less visually interesting but accessible-correct; some designers may want the softer look

#### [Pattern] @supports (color: color-mix(...)) guard wraps color-mix() usage with rgba() fallback via design token (2026-03-11)
- **Problem solved:** color-mix() has ~92% browser support as of implementation date; inverted variant track color would be invisible in unsupported browsers without a fallback
- **Why this works:** Progressive enhancement: modern browsers get the computed color-mix value, legacy browsers get a hardcoded rgba fallback. Using a design token (--hx-overlay-white-30) for the fallback keeps it within the token system
- **Trade-offs:** Two declarations to maintain; fallback value must be manually kept in sync with what color-mix() would produce

#### [Pattern] SVG dash math documented inline: r=10 → circumference=62.83 → stroke-dasharray:56 (~89% arc) → stroke-dashoffset:14 (gap aesthetic) (2026-03-11)
- **Problem solved:** Magic numbers in SVG stroke-dash calculations are completely opaque to future maintainers; changing radius requires recalculating all three values in concert
- **Why this works:** The relationship between radius, circumference, dasharray, and dashoffset is non-obvious. A future developer changing the SVG viewBox or radius would break the arc shape without understanding the math
- **Trade-offs:** Comment must be kept in sync with actual values; if values drift from the comment the comment becomes misleading

### prefers-reduced-motion removes shimmer animation entirely via `display: none` on `::after` pseudo-element rather than reducing it (2026-03-11)
- **Context:** Skeleton shimmer is a CSS animation on a pseudo-element; accessibility requires respecting motion preferences
- **Why:** Shimmer is purely decorative — removing it entirely is safer than slowing it down, avoids any residual motion for users with vestibular disorders, and pseudo-element `display: none` is the most reliable cross-browser way to fully suppress it
- **Rejected:** Reducing animation duration or using `animation: none` — `animation: none` can leave the pseudo-element visible as a static overlay; duration reduction still causes motion
- **Trade-offs:** Easier: full a11y compliance, zero axe-core violations. Harder: no graceful 'slow pulse' fallback for users who might still want subtle feedback
- **Breaking if changed:** Removing this media query causes motion for users with prefers-reduced-motion: reduce, violating WCAG 2.3.3 and potentially failing CI a11y gates

### aria-hidden set on host element in connectedCallback, not via static HTML attribute or CSS (2026-03-11)
- **Context:** Web component skeleton loader should be invisible to screen readers since it conveys no semantic content — but the host element is the custom element itself
- **Why:** connectedCallback is the reliable lifecycle hook where the element is in the DOM and attributes can be set programmatically; static attribute in template doesn't work for the host element in LitElement/native web components since the host is outside shadow DOM
- **Rejected:** Setting aria-hidden in the shadow root template — shadow DOM attributes don't propagate to the host; setting it in constructor — element may not be connected to ARIA tree yet
- **Trade-offs:** Easier: host is correctly hidden from AT on every mount including dynamic insertion. Harder: requires awareness that host vs shadow root are separate ARIA contexts
- **Breaking if changed:** Removing connectedCallback aria-hidden means screen readers announce the shimmer container, creating noise for AT users on every page with skeleton loaders

#### [Pattern] hx-loaded event + aria-busy pattern: component fires `hx-loaded` event when `loaded` property transitions true, enabling consumers to update a parent aria-busy live region rather than embedding live region inside the skeleton itself (2026-03-11)
- **Problem solved:** Screen readers need to announce when content has loaded, but skeleton loaders are aria-hidden and cannot contain live regions
- **Why this works:** A live region inside an aria-hidden element is never announced; the event-based pattern delegates announcement responsibility to the consumer who has the semantic context (knows what loaded), keeping the skeleton purely presentational
- **Trade-offs:** Easier: skeleton stays purely decorative, consumers control announcement text and timing. Harder: consumers must wire up the event and manage their own live region — adds integration burden

#### [Pattern] paragraph variant uses flex-column layout with no internal skeleton lines — consumers nest `hx-skeleton variant='text'` children inside it for multi-line text blocks (2026-03-11)
- **Problem solved:** A paragraph skeleton needs N lines of varying width; hardcoding line count inside the component creates inflexibility
- **Why this works:** Composition over configuration: consumer knows how many lines their paragraph has; the variant just provides the correct flex container layout. This avoids a `lines` property that would need to handle width arrays, gap config, etc.
- **Trade-offs:** Easier: consumers have full control over line count/widths/gaps without new API surface. Harder: more verbose consumer markup; CEM doesn't document the composition pattern so developers may not discover it without docs

### Removed p:first-child lead selector from prose CSS to prevent unintended CMS content styling (2026-03-11)
- **Context:** CMS-injected content often wraps prose in containers where first-child assumptions break, causing incorrect font-size/weight on paragraphs that aren't actually leads
- **Why:** CMS safety — content editors cannot control DOM structure; first-child is fragile when prose is nested or preceded by invisible elements (comments, scripts)
- **Rejected:** Keeping p:first-child with higher specificity guard — still fragile; using :is(p:first-child) — same root problem
- **Trade-offs:** Loss of automatic lead paragraph styling; developers must explicitly apply lead class if needed
- **Breaking if changed:** Any prose usage relying on automatic lead styling for first paragraph will lose that style silently

#### [Gotcha] caption-side:top is required for WCAG H39 compliance, not just a stylistic choice — removing it fails accessibility audit (2026-03-11)
- **Situation:** Table captions must be programmatically associated AND visually positioned above the table per WCAG H39; some CSS resets or Tailwind bases set caption-side:bottom
- **Root cause:** Screen readers announce caption before table data; visual position must match reading order expectation; caption-side:bottom breaks this for sighted users
- **How to avoid:** Explicitly setting caption-side:top in component means consuming apps cannot override to bottom without !important

### Event name kept as `hx-remove` (not `hx-dismiss`) and prop as `removable` (not `dismissible`) — these are intentional API design decisions documented in JSDoc, not audit defects (2026-03-11)
- **Context:** AUDIT.md flagged naming mismatch between implementation (`hx-remove`/`removable`) and spec (`hx-dismiss`/`dismissible`)
- **Why:** Changing public event names or prop names is a breaking API change for consumers already using `removable` and listening for `hx-remove`; the JSDoc @note documents the divergence from spec as a deliberate choice
- **Rejected:** Renaming to match spec — would break all existing consumers and require a semver major bump
- **Trade-offs:** Spec drift is documented but preserved; avoids consumer breakage at the cost of spec fidelity
- **Breaking if changed:** Renaming `hx-remove` → `hx-dismiss` or `removable` → `dismissible` without a major version bump breaks any consuming application listening to the remove event

### aria-live region for remove announcements is explicitly delegated to the consuming application, not implemented in the component itself (2026-03-11)
- **Context:** P2-06 audit finding: hx-tag remove action has no screen reader announcement of removal
- **Why:** The component cannot know the semantic context of removal — whether it's filtering chips, dismissing alerts, or clearing selections. The application layer owns the live region and can announce with appropriate context ('Filter removed', 'Tag cleared', etc.)
- **Rejected:** Embedding aria-live='polite' directly in the shadow DOM — would produce generic, context-free announcements and potentially conflict with the application's own live region
- **Trade-offs:** Accessibility is correct but requires consuming app discipline; component is not self-contained for a11y without app cooperation
- **Breaking if changed:** If aria-live is added to the component shadow DOM without removing responsibility from the application contract, double-announcements will occur for screen reader users

### triggerLabel and menuLabel properties set aria-label on trigger button and menu panel respectively for localization support (2026-03-11)
- **Context:** Split buttons have two interactive regions (primary action button and dropdown trigger) that need distinct accessible names, especially in non-English locales
- **Why:** Hardcoding English strings in shadow DOM makes localization impossible; properties allow consumers to pass translated labels without overriding internal structure
- **Rejected:** Hardcoded English aria-labels in component template — blocks i18n and forces consumers to patch shadow DOM
- **Trade-offs:** Consumers must pass explicit labels for full a11y compliance; component works without them but screen reader experience degrades in non-default-language contexts
- **Breaking if changed:** Removing these properties forces consumers to use CSS ::part() or ::slotted() workarounds that don't exist for aria-label, making proper a11y impossible for non-English deployments

#### [Pattern] Sizes story renders all three size variants (sm/md/lg) side-by-side with labels using inline flex layout rather than Storybook Controls (2026-03-11)
- **Problem solved:** Size variants need visual regression baseline and design review across all values simultaneously; individual stories require clicking through each size
- **Why this works:** Side-by-side comparison reveals spacing/proportion inconsistencies between sizes that are invisible when reviewing sizes individually; also serves as a single VRT snapshot covering all sizes
- **Trade-offs:** Static story cannot be used for interactive controls-based testing; requires separate Default story for that purpose

### alt property defaults to undefined (not empty string) to distinguish developer omission from intentional decorative intent (2026-03-11)
- **Context:** WCAG requires decorative images to have alt='' with role=presentation, but accidentally empty alt hides content from screen readers
- **Why:** undefined forces a deliberate choice: either provide meaningful alt text or explicitly set decorative=true; empty string default silently swallows accessibility intent
- **Rejected:** alt defaults to '' — would make all images without explicit alt silently decorative, masking developer oversights and WCAG violations
- **Trade-offs:** Slightly more explicit API; developers must consciously handle both cases; tooling/linting can warn on missing alt
- **Breaking if changed:** Changing default to '' would cause images without alt to be treated as decorative, removing them from the accessibility tree without developer intent

#### [Pattern] Console warning is emitted at runtime when a progress bar renders without an accessible label (no aria-label, aria-labelledby, or aria-describedby), rather than throwing or silently failing (2026-03-11)
- **Problem solved:** Missing accessible labels on progressbar role elements are a WCAG failure but cannot be caught at compile time since label association is runtime DOM state
- **Why this works:** Silent failure leaves inaccessible components in production; hard throw breaks consumer apps; console warning surfaces the issue in development without breaking functionality
- **Trade-offs:** Warning only fires in development if console is monitored; production apps could ship unlabeled progress bars if dev testing is skipped

#### [Pattern] Slot-only label accessible name solved via _hasSlotContent reactive state + aria-labelledby rather than relying on the slot's text content directly (2026-03-11)
- **Problem solved:** WCAG 2.5.3 requires accessible name to match visible label. When label comes from a slot, the component cannot read slot text synchronously during render for aria attributes
- **Why this works:** Tracking slot occupancy as reactive state (_hasSlotContent) lets the component conditionally wire aria-labelledby to the slot container only when a slot label exists, keeping accessible name computation in the browser's accessibility tree rather than duplicating text in JS
- **Trade-offs:** Easier: accessible name stays in sync automatically with slot content changes. Harder: requires slotchange event listener and reactive boolean state; slightly more wiring than a simple aria-label string

#### [Gotcha] Storybook build fails due to missing @storybook/addon-vitest but this is pre-existing and unrelated to component work — library build and Vitest browser tests still pass independently (2026-03-11)
- **Situation:** Deep audit needed to verify all quality gates but npm run build exits non-zero due to Storybook addon gap
- **Root cause:** Storybook and Vitest are separate build targets; hx-library builds via its own workspace script. The missing addon only affects Storybook static site generation, not component correctness
- **How to avoid:** Easier: component work proceeds unblocked. Harder: full build (npm run build from root) cannot be used as a pass/fail gate; must scope to npm run build --workspace=packages/hx-library

#### [Pattern] aria-valuetext computed for all semantic threshold states (suboptimum, critical, optimum) rather than just exposing raw numeric value (2026-03-11)
- **Problem solved:** role=meter conveys a measurement with semantic meaning (e.g. battery level, score). Screen readers announcing '72' give no context; announcing 'Suboptimum: 72 of 100' is actionable
- **Why this works:** ARIA spec for role=meter requires aria-valuenow but strongly recommends aria-valuetext when the numeric value alone is insufficient for comprehension. Threshold state (low/high/optimum ranges) is exactly that case
- **Trade-offs:** Easier: screen reader users immediately understand state without mental math against min/max. Harder: requires computing threshold state twice (once for visual indicator class, once for aria-valuetext string) — coupling display logic to ARIA output

#### [Gotcha] CSS custom properties for autoSize (--hx-auto-size-available-width/height) must be set via this.style.setProperty() on :host, NOT on an internal shadow DOM element (2026-03-11)
- **Situation:** Properties were initially set on the internal popup panel element inside shadow DOM, making them inaccessible to light DOM consumers who need to constrain slotted content
- **Root cause:** CSS custom properties do inherit through shadow DOM boundaries, but only downward — setting them on an internal element means they are scoped inside the shadow root and unavailable to slotted content or external stylesheets referencing the host
- **How to avoid:** Easier: consumers can use the properties in their own stylesheets without any special penetration tricks. Harder: the host element's inline style is mutated at runtime, which could conflict with external styles targeting hx-popup directly

### Arrow color default uses semantic token with safe fallback: var(--hx-color-surface-overlay, #ffffff) instead of currentColor (2026-03-11)
- **Context:** Arrow element had background: currentColor which means it inherits text color — on dark text contexts the arrow becomes black, clashing with overlay/surface panels which are almost always white or near-white
- **Why:** The arrow is part of a floating overlay panel. Its color should match the panel surface, not the text color of whatever element happens to be its color context. Semantic token conveys intent; hardcoded fallback ensures correctness even without a design token system
- **Rejected:** currentColor — rejected because it ties arrow color to an unrelated property (text color) which is semantically wrong and produces wrong results in most real contexts; also rgba(0,0,0,0) transparent — rejected because arrow becomes invisible
- **Trade-offs:** Easier: correct appearance out of the box across themes. Harder: consumers who want currentColor behavior must explicitly override --hx-arrow-color
- **Breaking if changed:** Reverting to currentColor would cause arrow color regressions in any context where text color differs from surface color (i.e., nearly everywhere)

### Removed aria-haspopup='menu' from nav submenu triggers in favor of disclosure pattern (aria-expanded only) (2026-03-11)
- **Context:** hx-nav used aria-haspopup='menu' on submenu triggers but submenus used role='list' not role='menu', creating an ARIA role contract mismatch that screen readers would misinterpret
- **Why:** The menubar/menu ARIA pattern requires strict keyboard interaction contracts (Home/End/arrow navigation within role='menu' children). Since submenus are lists of links not menu items, the disclosure pattern (aria-expanded only) is semantically correct and avoids confusing screen reader announcements about a menu that doesn't behave like one
- **Rejected:** Full menubar pattern with role='menu' and role='menuitem' — rejected because nav links are not actions/commands, they are navigation destinations; menubar pattern implies application menu semantics
- **Trade-offs:** Easier: screen readers announce submenus accurately; consumers no longer need to implement menubar keyboard contract. Harder: existing consumers relying on aria-haspopup='menu' announcements will hear different screen reader output
- **Breaking if changed:** Removing aria-expanded would break the disclosure pattern entirely — screen readers would have no way to announce submenu open/closed state

#### [Gotcha] lit-html repeat() key functions must produce unique keys — using item.label as key causes silent rendering bugs with duplicate labels (2026-03-11)
- **Situation:** The repeat() directive key function used item.label, which causes keying collisions when two nav items share the same label, leading to incorrect DOM recycling and potential state bleed between items
- **Root cause:** lit-html uses keys to efficiently reuse DOM nodes; non-unique keys cause the wrong node to be reused for the wrong data, producing subtle rendering corruption that is hard to detect
- **How to avoid:** Index-based keys lose the reuse efficiency benefit of repeat() for reordering scenarios, but navigation lists rarely reorder dynamically so this is an acceptable trade-off

#### [Pattern] The focusable property on visually-hidden components implements the skip-link pattern: content is visually hidden at rest but becomes visible on focus via focus-visible CSS, enabling keyboard navigation without cluttering the visual UI (2026-03-11)
- **Problem solved:** Skip links (e.g., 'Skip to main content') must be reachable by keyboard users but invisible to sighted mouse users — a boolean focusable prop toggles this behavior
- **Why this works:** Separating focusable from the default visually-hidden behavior keeps the component composable: default usage hides decorative/redundant text for screen readers, while focusable=true serves an entirely different UX pattern for keyboard accessibility
- **Trade-offs:** The focusable prop adds complexity to an otherwise simple component and requires explicit test coverage of focus-visible behavior (which requires browser mode testing, not jsdom)

### Mobile toggle emits typed custom event `HxMobileToggleEvent` rather than mutating internal state directly, with `aria-expanded` and `aria-controls` wired to the toggle button (2026-03-11)
- **Context:** Top nav mobile menu open/close state needs to be observable by parent application and meet WCAG 2.1 AA keyboard nav requirements
- **Why:** Custom event allows host app to respond to menu state changes without polling or MutationObserver; aria-expanded on the button + aria-controls pointing to menu panel is the only WCAG-compliant pattern for disclosure widgets
- **Rejected:** Exposing a public `open` property with reflect would require parent to set it back after toggle, creating a two-way binding anti-pattern for Web Components
- **Trade-offs:** Event-driven pattern is one-directional and clean but requires consumer to manage open state if they need to close programmatically
- **Breaking if changed:** Removing HxMobileToggleEvent breaks any consumer listening for menu state; changing aria-controls target id breaks screen reader association

#### [Pattern] All visual properties exposed exclusively via `--hx-*` CSS custom properties with no hardcoded values in component styles, using `<header>` as landmark element with nested `<nav aria-label>` (2026-03-11)
- **Problem solved:** Design token system requires components to be themeable without CSS overrides; WCAG requires navigation landmarks to be properly labelled when multiple exist on page
- **Why this works:** CSS custom properties allow token overrides at any cascade level without !important or specificity battles; `<header>` provides implicit `banner` ARIA landmark while inner `<nav>` with aria-label distinguishes this nav from others on the page
- **Trade-offs:** All-token approach requires token documentation discipline; dual landmark pattern (`banner` + `nav`) gives maximum accessibility info but requires aria-label to avoid generic 'navigation' label

#### [Pattern] sr-only spans for Complete/Error state announcement in hx-step rather than aria-label on the indicator (2026-03-12)
- **Problem solved:** Step indicators use icons (check, X) that are visually meaningful but need text alternatives for screen readers announcing step completion/error state
- **Why this works:** sr-only text is read in document flow at the correct position; aria-label on a decorative container overrides all child content which can suppress other meaningful text
- **Trade-offs:** Slightly more DOM nodes but precise control over what gets announced and when in the reading order

#### [Gotcha] hx-prose p:first-child `.lead` style changed from automatic to opt-in via explicit .lead class (2026-03-12)
- **Situation:** hx-prose was automatically styling the first paragraph as a lead paragraph, affecting all prose content regardless of intent
- **Root cause:** Automatic p:first-child lead styling breaks prose blocks that don't intend a visual lead — e.g., documentation blocks, card descriptions
- **How to avoid:** Existing content relying on automatic lead styling will lose that styling without adding .lead class — a breaking visual change for consumers

### hx-card --hx-transform-lift-md token renamed to --hx-lift-md for consistency with token naming convention (2026-03-12)
- **Context:** The token was named --hx-transform-lift-md suggesting it was transform-specific, but the convention is property-agnostic shorthand names
- **Why:** Token names should describe the design concept (lift elevation) not the CSS property used to implement it (transform) — allows implementation to change without breaking token API
- **Rejected:** Keeping --hx-transform-lift-md is safer for backward compatibility but encodes implementation detail in public token API
- **Trade-offs:** Breaking change for any consumer who referenced --hx-transform-lift-md directly in their own CSS overrides
- **Breaking if changed:** Any external CSS that references --hx-transform-lift-md will silently get no value (CSS custom property undefined = empty = no effect) after this rename

#### [Gotcha] CSS custom properties declared as public API in docs can be entirely dead code — never consumed in the actual keyframe/rule that would use them (2026-03-13)
- **Situation:** --hx-badge-pulse-color was documented as a public token and appeared in component API surface, but the @keyframes wc-badge-pulse box-shadow values were hardcoded, making the variable a no-op
- **Root cause:** The variable was likely added to the API docs first (or in a separate pass) without updating the keyframe implementation, creating a silent contract violation
- **How to avoid:** Implementing the token makes the animation themeable but requires the token to be defined; unthemed environments now show no pulse ring unless a fallback is added

#### [Gotcha] Slot content in fixed-size dot-mode containers overflows silently — no browser warning, just visual breakage (2026-03-13)
- **Situation:** hx-badge dot mode uses a fixed 0.5rem container; any slotted prefix content renders inside it and overflows, but this is invisible in normal dev flow because the slot is typically empty in dot usage
- **Root cause:** Added .badge--dot ::slotted(*) { display: none } as a CSS guard because the component cannot prevent consumers from accidentally passing slot content into dot-mode badges
- **How to avoid:** Silently hides slot content which could surprise developers debugging why their content disappeared; a console.warn in connectedCallback would be more debuggable but adds JS overhead

### Variant-level CSS custom property setters should reference primitive tokens only with NO hardcoded hex fallbacks; only the base .button rule gets a last-resort fallback (2026-03-13)
- **Context:** hx-button had hardcoded hex fallbacks like var(--hx-color-primary-500, #3b82f6) in variant rules, meaning a partially-loaded or unthemed state would silently render with stale hardcoded colors rather than failing visibly
- **Why:** Hex fallbacks in variant rules mask token-load failures and make it impossible to detect missing tokens in production. Base rule fallback is acceptable as a true last-resort for completely unthemed environments
- **Rejected:** Keeping hex fallbacks everywhere for safety — rejected because it creates silent mismatches when tokens are updated but fallbacks are not, and makes the component appear to work when the token system is broken
- **Trade-offs:** Without fallbacks, broken token loading is now visibly broken (wrong/missing colors) rather than silently using stale hex — this is intentional; easier to detect, harder to silently ship bad themes
- **Breaking if changed:** If primitive tokens fail to load, variant buttons now show no color rather than a stale hardcoded color — this is the desired failure mode

#### [Pattern] Add regression-guard comments on CSS rules that previously had bugs to prevent re-introduction, documenting the exact bug and where the correct implementation lives (2026-03-13)
- **Problem solved:** hx-button had a double-opacity bug where both :host([disabled]) and .button[disabled] applied opacity, resulting in 25% opacity (0.5 * 0.5). After fix, only :host([disabled]) applies opacity
- **Why this works:** Without the comment, future developers editing .button[disabled] may re-add opacity thinking it was accidentally omitted. The comment serves as a permanent code review artifact
- **Trade-offs:** Comments can go stale if the implementation changes, but the explicit reference to the double-opacity percentage makes staleness detectable

#### [Gotcha] display:contents on a custom element host breaks ALL box-model styling (width, height, padding, margin, background) for the host element, and this must be explicitly documented or consumers will waste time debugging (2026-03-13)
- **Situation:** hx-breadcrumb-item uses display:contents intentionally so the item participates in the parent breadcrumb's flex layout as if it weren't there, but this means ::part(item) styling for box-model properties silently has no effect
- **Root cause:** display:contents is the correct approach for transparent wrapper components in flex/grid layouts, but it's a non-obvious CSS behavior that causes hours of debugging
- **How to avoid:** Consumers must use ::part(link) or ::part(text) for box-model styling instead of ::part(item); this is less intuitive but architecturally correct

#### [Gotcha] Storybook stories that hardcode hex colors instead of design tokens create a maintenance liability — token palette updates won't affect stories, causing visual drift between documented and actual component behavior (2026-03-13)
- **Situation:** hx-breadcrumb WithCustomStyling story used #7c3aed, #5b21b6 etc. — these are the hex values of secondary color tokens but are now disconnected from any future token palette changes
- **Root cause:** Stories should demonstrate the token API surface, not bypass it. Using --hx-color-secondary-600 in the story validates that consumers can actually use the token system for customization
- **How to avoid:** Token-based stories require tokens to be loaded to display correctly in isolation — but this is the correct constraint since the component itself requires token loading

### hx-popover arrow border clipping required BOTH CSS reset AND JS innerBorderMap in _updatePosition() — neither alone was sufficient (2026-03-13)
- **Context:** Popover arrows rendered with visible inner borders on the side facing the trigger, creating a visual artifact regardless of CSS-only fixes
- **Why:** CSS resets the border declarations, but the JS placement logic dynamically applies inline border styles per placement direction. Without clearing the inward-facing border in the JS map, the CSS fix is overridden at runtime
- **Rejected:** CSS-only fix via :host([placement]) selectors — overridden by JS inline styles applied after render
- **Trade-offs:** Fix is split across two files (styles.ts and component.ts), increasing maintenance surface but correctly handles all dynamic placement cases
- **Breaking if changed:** Removing the innerBorderMap from _updatePosition() re-introduces arrow border artifacts on the inward-facing side regardless of CSS declarations

### hx-popover :host changed from display:inline-block to display:contents with display:inline-block moved to .trigger-wrapper child (2026-03-13)
- **Context:** Host element using display:inline-block created layout side effects — the shadow host itself participated in layout in unexpected ways when composed into other flex/grid containers
- **Why:** display:contents makes the host element transparent to layout so it doesn't create an extra block-formatting context; only the inner .trigger-wrapper participates in layout, giving consumers predictable composition behavior
- **Rejected:** Keeping display:inline-block on :host — causes the host to create its own layout context which breaks flex gap, grid alignment, and inline flow in parent containers
- **Trade-offs:** display:contents has reduced browser support for certain pseudo-elements and accessibility roles on the host element; mitigated by moving interactive content into named child wrappers
- **Breaking if changed:** Any CSS targeting the host element as a layout participant (flex children expecting inline-block behavior) will break if display:contents is reverted

#### [Gotcha] prefers-reduced-motion shimmer in hx-skeleton requires display:none not animation:none — the two have different behavior (2026-03-13)
- **Situation:** animation:none stops the animation but leaves the shimmer element in the DOM still painting as a static gradient overlay, which still creates visual noise for motion-sensitive users
- **Root cause:** display:none removes the shimmer element from rendering entirely, satisfying both WCAG 2.3.3 intent and eliminating the static gradient artifact
- **How to avoid:** display:none means the skeleton shows no shimmer at all in reduced-motion contexts (just a flat background), which is the correct accessible behavior

#### [Gotcha] hx-menu-item focus-visible outline-offset:-2px clips the outline on rounded corners — must be 0px (2026-03-13)
- **Situation:** Negative outline-offset pulls the outline inward so it renders inside the border-radius curve, causing the corners of the focus ring to be clipped by the element's own border
- **Root cause:** 0px offset keeps the outline flush with the element boundary, ensuring the full focus ring is visible at all corner radii without clipping
- **How to avoid:** 0px offset means the focus ring sits exactly on the element edge rather than inside it — slightly different visual treatment but fully compliant

#### [Pattern] CSS custom property token cascade pattern: var(--hx-shadow-md, 0 4px 16px var(--hx-overlay-black-12, rgba(0,0,0,0.12))) — nested fallbacks from semantic token to primitive token to hardcoded value (2026-03-13)
- **Problem solved:** Components need to consume design tokens while remaining functional when tokens are not yet defined or when used outside the token system
- **Why this works:** Three-level fallback ensures: (1) semantic token takes precedence enabling theming, (2) primitive color token as intermediate fallback, (3) hardcoded value as final backstop for zero-dependency rendering
- **Trade-offs:** Verbose CSS declarations but maximum compatibility across token adoption stages; also self-documents the token hierarchy in the source

#### [Pattern] hx-split-button menu animation uses @keyframes with prefers-reduced-motion guard disabling it — animation is defined in normal styles, not inside a motion media query (2026-03-13)
- **Problem solved:** Open/close animation improves spatial awareness for users who can handle motion, but must not fire for reduced-motion users
- **Why this works:** Defining animation normally then overriding with animation:none inside prefers-reduced-motion is the correct WCAG pattern — it means animation is opt-out rather than opt-in, so users with no media query support still get the animation
- **Trade-offs:** Normal-first pattern is the recommended WCAG approach but requires remembering to add the override block; opt-in pattern is safer to audit but less universally supported

### Changed CSS caption-side from 'bottom' to 'top' in prose.scoped.css to fix WCAG H39 violation (2026-03-13)
- **Context:** hx-prose P1-04 — caption-side: bottom causes AT/visual mismatch: screen readers announce caption before table data (DOM order) but sighted users see it below, creating a disconnect in comprehension flow
- **Why:** WCAG H39 requires table captions to be programmatically associated AND positionally consistent with reading order; bottom captions violate this when AT reads top-to-bottom DOM order but visual order is inverted
- **Rejected:** CSS visual reordering tricks to keep caption visually at bottom while DOM-first — rejected because it doesn't fix the AT announcement order mismatch, only the visual position
- **Trade-offs:** Visual design change (captions now appear above tables) — may require design sign-off; improves screen reader comprehension flow significantly
- **Breaking if changed:** Reverting to caption-side: bottom reintroduces P1 WCAG H39 violation affecting all table captions in hx-prose

#### [Gotcha] _handleFocusIn was dead code because the tree container div lacked tabindex, making it unfocusable and never triggering focusin events (2026-03-13)
- **Situation:** hx-tree-view had focus management code that never ran because the container element was not in the tab order
- **Root cause:** Without tabindex='0' the div cannot receive focus, so focusin never fires on it. The fix (adding tabindex) was required for keyboard navigation (P0-1) and had the side effect of making existing focus handler code live.
- **How to avoid:** tabindex='0' adds the tree container to tab order which may affect page tab flow — consumers may need to manage tabindex=-1 externally for roving tabindex patterns

### aria-selected renders 'nothing' (omitted entirely) when tree selection mode is 'none', rather than rendering aria-selected='false' (2026-03-13)
- **Context:** ARIA spec: aria-selected should only be present on elements that participate in selection. Trees with selection='none' have no selectable items.
- **Why:** Presence of aria-selected='false' implies the item could be selected but currently isn't. Omitting it entirely correctly signals that selection is not applicable to these items, avoiding misleading AT announcements.
- **Rejected:** Always rendering aria-selected='false' would cause screen readers to announce items as 'not selected' implying selection is possible when it isn't
- **Trade-offs:** Requires _isSelectable() check on every render; adds branch in render logic
- **Breaking if changed:** Removing _isSelectable() check causes aria-selected to always render, misleading assistive technologies about selection capability

#### [Pattern] AUDIT.md severity tables should use Total/Fixed/Open columns rather than original-count with a separate Fixed column (2026-03-13)
- **Problem solved:** hx-prose AUDIT.md had inconsistent severity table where individual findings were marked FIXED inline but the summary table still showed original counts without tracking resolution status
- **Why this works:** Total/Fixed/Open (e.g., P0: 2/1/1) gives immediate triage visibility — reviewers can see both scope and completion percentage at a glance without counting inline FIXED markers
- **Trade-offs:** Requires updating two places (table + inline finding) when a finding is resolved; but provides unambiguous summary for PR reviewers and future auditors

#### [Pattern] readonly boolean property added to hx-textarea wired via Lit's '?readonly' binding to native textarea element (2026-03-13)
- **Problem solved:** Healthcare applications frequently display non-editable patient data in textarea-like UI — readonly differs from disabled in that readonly fields are still focusable and their values are submitted with forms
- **Why this works:** ?readonly binding in Lit correctly sets/removes the readonly attribute (falsy removes it entirely) matching native HTML behavior; a reflect:true property enables :host([readonly]) CSS targeting for visual styling
- **Trade-offs:** Readonly textareas are still tab-focusable and value-submittable which is the correct healthcare pattern; consumers must style :host([readonly]) explicitly if they want visual differentiation

### Multi-select tree views should use slotted checkbox inputs rather than relying solely on `selection='multiple'` attribute for explicit user affordance (2026-03-13)
- **Context:** hx-tree-view CheckboxMultiSelect story needed to demonstrate accessible multi-selection in a healthcare ICD-10 code selection scenario
- **Why:** Implicit multi-select (click/modifier keys) has no visual affordance — users cannot discover it without documentation. Slotted checkboxes make the selection capability visually self-evident, critical in healthcare UIs where missing a selection has clinical consequence.
- **Rejected:** Pure `selection='multiple'` without visual checkbox affordance — works technically but fails discoverability; users must already know multi-select is possible
- **Trade-offs:** Slotted checkboxes add DOM complexity and require explicit slot management; gain: zero-discovery-cost UX, screen reader clarity, keyboard navigation consistency
- **Breaking if changed:** If checkboxes are removed and only attribute used, the component still functions but clinical users in high-stakes workflows lose the affordance needed to confidently use multi-select

### DynamicAddRemove Storybook stories for accordion use render() with external state mutation + storybook's play API rather than trying to use framework reactivity — buttons directly call component DOM API (appendChild/removeChild) and update a counter display element (2026-03-13)
- **Context:** Needed to demonstrate programmatic item insertion/removal in a framework-agnostic Storybook HTML story without React/Vue state
- **Why:** hx-accordion is a Web Component — its API is DOM-based. Storybook HTML stories have no framework reactivity, so the only correct approach is direct DOM manipulation mirroring how a vanilla JS consumer would use the component
- **Rejected:** Using args/argTypes with controls to drive item count — would require a custom render function that destroys/recreates the component on each arg change, losing component state and not demonstrating the actual add/remove API
- **Trade-offs:** Story is more realistic (shows real usage pattern) but cannot be driven by Storybook controls panel; it's an interactive demo, not a configurable story
- **Breaking if changed:** If hx-accordion changes its item insertion API (e.g., requires a custom element instead of slot children), the story's DOM manipulation pattern would silently stop working

#### [Pattern] Boolean attributes in Twig templates require conditional rendering ({% if condition %}attr{% endif %}) rather than value assignment because HTML boolean attributes have no false-value equivalent (2026-03-13)
- **Problem solved:** hx-pagination and hx-button-group have boolean attributes (e.g., disabled, hide-first-last) that must be present or absent — not set to 'false'
- **Why this works:** Setting boolean-attr='false' in HTML does not disable the attribute — the attribute's presence alone triggers the behavior regardless of value. Twig conditional emission is the only correct pattern.
- **Trade-offs:** Template verbosity increases but correctness is guaranteed; the pattern is non-obvious enough to warrant documentation in README.drupal.md

#### [Gotcha] Combining hx-href and an actions slot on hx-card creates an accessibility anti-pattern — the entire card becomes a link AND contains interactive slot content, creating nested interactive elements (2026-03-13)
- **Situation:** hx-card supports both hx-href (makes card clickable as a link) and an actions slot (for buttons/links). Using both simultaneously violates WCAG 4.1.2 and creates ambiguous click targets.
- **Root cause:** Web Components don't prevent this combination at the API level — both attributes are valid individually. The failure mode is silent (no error) but creates an a11y violation that screen readers and keyboard users encounter.
- **How to avoid:** The component API remains flexible but the constraint is contractual (documented) rather than enforced; a runtime warning in dev mode would be stronger but requires component source changes

### Changed hx-spinner size argType from select control with fixed token options to text control, explicitly documenting both token values and arbitrary CSS sizes (2026-03-13)
- **Context:** select control implied size was an enum, hiding the fact that the property accepts any CSS size value (e.g., '3rem', '48px') not just design tokens
- **Why:** Text control accurately models the property's actual type contract and enables exploratory testing of custom sizes directly in Storybook controls panel
- **Rejected:** Keeping select control — rejected because it creates a false API contract in documentation and prevents consumers from discovering custom size capability without reading source
- **Trade-offs:** Text control loses the discoverability of the canonical token values ('sm','md','lg') as a dropdown; mitigated by adding them explicitly in the description field
- **Breaking if changed:** Reverting to select control would re-hide custom size capability and make the Storybook docs inaccurate relative to the component's actual API

### hx-theme Drupal integration uses a wrapper element approach rather than body data-attribute theming (2026-03-13)
- **Context:** Applying theme tokens globally in Drupal when hx-theme is a Shadow DOM web component
- **Why:** Shadow DOM scoping prevents body data-attribute from cascading CSS custom properties into shadow roots; wrapper element keeps theming scoped and SSR-safe
- **Rejected:** Pure body data-attribute approach — would fail to penetrate Shadow DOM boundaries for nested components
- **Trade-offs:** Wrapper element approach limits full-page theming flexibility but ensures token inheritance works correctly across component tree
- **Breaking if changed:** Switching to body data-attribute would silently break theme inheritance for any component using Shadow DOM encapsulation

#### [Pattern] Drupal integration requires both a .twig template AND a DrupalIntegration Storybook story as paired deliverables (2026-03-13)
- **Problem solved:** Component audit findings classified as Drupal-category were being partially fixed with only one artifact
- **Why this works:** The .twig template solves the server-rendering gap; the story documents the integration contract for developers and validates the pattern works end-to-end
- **Trade-offs:** More artifacts per component but provides both implementation and documentation in a single PR

#### [Gotcha] hx-toggle-button.twig and hx-toast.drupal.js already existed from prior passes, making those two components story-only gaps (2026-03-13)
- **Situation:** Audit findings appeared as open/unfixed but prior agent passes had already created the Twig templates
- **Root cause:** Board status and audit markdown were not updated to reflect partial prior work, causing the agent to audit source files rather than trust ticket status
- **How to avoid:** Extra verification step required per component but prevents duplicate/conflicting template creation

#### [Pattern] Healthcare-domain examples (ICD-10 taxonomy, patient data hierarchies, permission-gated disabled items) used in Twig templates and stories (2026-03-13)
- **Problem solved:** Generic placeholder data in Drupal integration examples would be low-signal for the actual use case
- **Why this works:** This codebase targets healthcare applications; domain-specific examples make integration patterns immediately applicable and expose edge cases (e.g., access-controlled tree nodes) relevant to real usage
- **Trade-offs:** Examples are more meaningful but couple documentation to domain assumptions

#### [Gotcha] CSS `clear: none` in _drupal.css and prose.scoped.css caused block content to overlap floated CKEditor images; fix was `clear: both` (2026-03-13)
- **Situation:** hx-prose Drupal integration — CKEditor outputs floated images using deprecated `align` attribute; block-level content after floated images was not clearing the float
- **Root cause:** CKEditor 4/5 legacy output uses `float: left/right` on images via the `align` attribute shim; without `clear: both` on subsequent block elements, content wraps alongside the image instead of starting below it
- **How to avoid:** Easier: block content reliably renders below floated images in Drupal CKEditor output. Harder: `clear: both` prevents intentional side-by-side float layouts within prose, but such layouts are not a supported pattern

### Replace hardcoded CSS values (colors, spacing, font sizes, weights, families) in Storybook stories with --hx- design tokens (2026-03-13)
- **Context:** OutOfRangeValue story used literal values like #6c757d, 2rem, 0.75rem, monospace directly in inline styles rather than consuming the design system tokens
- **Why:** Hardcoded values drift from the design system when tokens are updated, making stories inaccurate as living documentation; token usage also validates that tokens cover the needed design range
- **Rejected:** Keeping hardcoded values — simpler to write but stories become misleading when token values change and the story does not update
- **Trade-offs:** Stories now accurately reflect what the design system provides; stories break if a token is renamed or removed (desired — surfaces breaking changes)
- **Breaking if changed:** If --hx- tokens are renamed or removed, stories fail visually — this is the correct behavior as it surfaces design system breaking changes

### Storybook stories must use CSS custom property tokens (e.g. `--hx-space-8`, `--hx-font-size-xs`, `--hx-color-neutral-500`) with literal fallbacks rather than hardcoded values (2026-03-13)
- **Context:** hx-slider OutOfRangeValue story had inline styles with raw values like `2rem`, `0.75rem`, `#6c757d`, `monospace`, `600`
- **Why:** Token usage ensures stories visually adapt when the design token values change and documents the intended token mapping. Literal fallbacks (e.g. `var(--hx-space-8, 2rem)`) preserve rendering if tokens are not loaded in an isolated environment
- **Rejected:** Pure hardcoded values — rejected because they decouple the story from the token system, masking token changes and providing no documentation value
- **Trade-offs:** Stories require the token stylesheet to be loaded for correct rendering; fallbacks mitigate this but add verbosity
- **Breaking if changed:** Removing fallbacks breaks story rendering in environments where tokens CSS is not injected (e.g. isolated iframe without global styles)

#### [Gotcha] Inverted boolean Twig conditional `{% if not show_icon %}{% else %}show-icon{% endif %}` was used instead of idiomatic `{% if show_icon %}show-icon{% endif %}` for web component boolean attributes (2026-03-13)
- **Situation:** hx-alert.twig was passing the show-icon boolean attribute to the web component using a negated conditional with an else branch, which is logically equivalent but semantically inverted and harder to read
- **Root cause:** The correct pattern for boolean web component attributes in Twig is to conditionally output the attribute name itself — the presence of the attribute enables the feature, absence disables it. No value is needed.
- **How to avoid:** Simpler template logic with direct intent expression; slightly harder to handle cases where default-true attributes need opt-out semantics

#### [Pattern] Drupal Form API preprocess hook pattern maps `#options` arrays to per-item checked/disabled state before passing to hx-checkbox-group.twig (2026-03-13)
- **Problem solved:** Drupal's Form API represents checkbox groups as a single form element with an `#options` array, but the web component needs individual hx-checkbox children with their own checked/disabled/value attributes
- **Why this works:** Twig templates cannot easily iterate over Drupal's keyed `#options` format and cross-reference with `#default_value` arrays to determine checked state — this logic belongs in PHP preprocess where typed Drupal APIs are available
- **Trade-offs:** Cleaner templates with flat, pre-resolved data; requires Drupal developers to add a preprocess hook rather than dropping in a template directly

### hx-button.twig explicitly documents htmx namespace awareness: the `hx-size` prop is a HELiX component API attribute, not an htmx directive, requiring documentation to prevent developer confusion (2026-03-13)
- **Context:** htmx uses `hx-*` attribute prefixes for its AJAX directives (hx-get, hx-post, hx-swap, etc.). HELiX web components also use `hx-` prefixes for their own props (hx-size, hx-variant). In Drupal projects using both libraries simultaneously, developers may misinterpret component props as htmx directives or vice versa.
- **Why:** Without explicit documentation, Drupal/htmx developers will assume any `hx-` attribute on a component triggers htmx behavior, leading to debugging sessions when hx-size has no htmx effect or when htmx tries to intercept component events
- **Rejected:** Renaming component attributes to avoid the hx- prefix — this would be a breaking API change across the entire library and would require migrating all existing consumers
- **Trade-offs:** Keeps component API stable and consistent; shifts burden to documentation rather than naming; requires all Twig templates and integration guides to call out the namespace distinction explicitly
- **Breaking if changed:** If this documentation is removed, Drupal developers integrating htmx alongside HELiX will encounter silent misconfigurations where they add hx-size expecting htmx routing behavior or remove it thinking it conflicts with their htmx setup

#### [Gotcha] Shadow DOM aria-describedby cross-boundary resolution requires light DOM intermediary span pattern (2026-03-13)
- **Situation:** hx-tooltip needed to provide aria-describedby on trigger elements, but shadow DOM encapsulation prevents ARIA attribute IDs from resolving across shadow boundaries
- **Root cause:** Browsers resolve ARIA ID references only within the same DOM tree (light or shadow). Placing the tooltip text in a light DOM span with a stable ID allows aria-describedby on the trigger to resolve correctly per WCAG 4.1.3
- **How to avoid:** Light DOM span is visible to accessibility tree but must be visually hidden; adds slight DOM overhead; requires careful cleanup to avoid orphaned nodes

#### [Pattern] role='alert' on error container without aria-live is the correct pattern for form validation errors in web components (2026-03-13)
- **Problem solved:** hx-text-input needed to announce validation errors to screen readers without double-announcement
- **Why this works:** role='alert' implicitly carries aria-live='assertive' and aria-atomic='true'. Adding explicit aria-live on top creates duplicate announcements in NVDA/JAWS. The role alone is sufficient and WCAG 2.1 AA compliant
- **Trade-offs:** Simpler markup; relies on implicit ARIA role semantics which are well-supported but less visually obvious to developers reading the code

### focusout on trigger wrapper (not blur on trigger element) is required for tooltip keyboard dismiss (2026-03-13)
- **Context:** hx-tooltip must hide when keyboard focus leaves the trigger, but focus may move between elements inside a wrapper
- **Why:** blur fires when focus leaves a specific element, even if focus moves to a child inside the same wrapper. focusout bubbles, so a single handler on the wrapper correctly detects when focus truly leaves the trigger zone without false positives from internal focus movement
- **Rejected:** blur event on trigger element — fires prematurely when focus moves to interactive children within the same wrapper, causing tooltip to flicker or close unexpectedly
- **Trade-offs:** Requires a wrapper element to catch bubbled focusout; slightly more DOM structure, but correct behavior across all keyboard navigation patterns
- **Breaking if changed:** Switching to blur breaks tooltip for any trigger that contains focusable children; removing the handler entirely violates WCAG 2.4.3 focus management

#### [Pattern] WCAG 1.4.13 hoverable tooltip requires mouseenter on the tooltip element itself to cancel hide timer (2026-03-13)
- **Problem solved:** Tooltips that dismiss when mouse moves off trigger but before reaching the tooltip violate WCAG 1.4.13 (Content on Hover or Focus)
- **Why this works:** WCAG 1.4.13 requires that content appearing on hover can be hovered without disappearing. A scheduled hide timeout must be cancelled when the mouse enters the tooltip popup itself
- **Trade-offs:** Requires coordinated timeout management between trigger and tooltip elements; slightly more complex event wiring

#### [Gotcha] In hx-badge, when using a `count` attribute/slot, it replaces the default slot entirely — labels intended to appear alongside the count must be placed in the `prefix` slot (`<span slot="prefix">Label</span>`), not as default slot children. (2026-03-13)
- **Situation:** The `RemovableWithCount` Storybook story had labels silently dropped because they were placed in the default slot, which `count` overwrites.
- **Root cause:** The component's slot architecture uses `count` as a replacement for the default content area, not an addition to it. The `prefix` slot is a separate render target that coexists with `count`.
- **How to avoid:** The `prefix` slot pattern correctly renders label+count together, but requires authors to know the slot architecture; default slot usage gives no warning when overridden.

#### [Gotcha] AUDIT.md findings can become desynchronized from actual story implementation — stories may already be implemented in prior commits but AUDIT.md still shows them as UNFIXED, requiring a reconciliation pass. (2026-03-13)
- **Situation:** hx-button-group (3 findings) and hx-toggle-button (1 finding) had their stories already implemented in prior commits, but AUDIT.md still reflected them as open P2 findings.
- **Root cause:** When implementation work and AUDIT.md updates are done in separate commits or by separate agents, the audit document can lag behind actual code state.
- **How to avoid:** Splitting implementation from audit-doc updates allows faster iteration but creates a reconciliation debt that must be resolved before PR close.

#### [Pattern] For icon-only interactive elements in web components, the accessible name must be provided via a `label` attribute that forwards to the inner `<button>`, with SVG icons carrying `aria-hidden="true"` — not via alt text or title on the SVG. (2026-03-13)
- **Problem solved:** hx-toggle-button `IconOnly` story needed to demonstrate the most challenging accessibility case: toggle buttons with no visible text.
- **Why this works:** Shadow DOM encapsulation means screen readers cannot traverse into the component's internals to find aria labels on inner elements; the label must be surfaced through the component's public API (`label` attribute) which the component itself forwards to the native button.
- **Trade-offs:** Requires component authors to explicitly implement label forwarding in the component definition; consumers must know to use `label` not `aria-label` on the host element.

### For Drupal server-rendering patterns (like `hx-breadcrumb` explicit `current` attribute), Storybook stories must include both a non-last-item example AND the recommended last-item pattern to fully document the feature. (2026-03-13)
- **Context:** The `ExplicitCurrent` story for hx-breadcrumb needed to demonstrate the `current` attribute as used when Drupal sets it server-side, which can appear on any item — not just the last.
- **Why:** Server-rendered HTML cannot rely on component logic to auto-detect the current item based on DOM position; an explicit `current` attribute is required. Showing only the last-item case would mislead implementers into thinking position determines current state.
- **Rejected:** A single example showing only the last breadcrumb as current — this would hide the non-last-item edge case that Drupal integrators specifically need.
- **Trade-offs:** More comprehensive stories increase cognitive load but prevent integration bugs from Drupal teams who encounter the non-last-item case in real CMS page hierarchies.
- **Breaking if changed:** Removing the explicit `current` attribute support from the component would break all Drupal server-rendered breadcrumbs that cannot rely on client-side current-detection logic.

#### [Gotcha] Storybook argType label controls must use name: 'default (slot)' with table.category: 'Slots' to distinguish slot controls from component properties in autodocs (2026-03-13)
- **Situation:** hx-help-text had a label argType categorized under 'Content' with no indication it was a slot, not a component property — causing developer confusion in Storybook autodocs
- **Root cause:** Storybook has no native concept of 'slot' in its controls table; the only way to communicate this distinction is via argType metadata overrides. Without this, autodocs falsely implies label is a standard prop/attribute.
- **How to avoid:** Easier: developer understanding of component API boundary. Harder: argType must be kept in sync manually if slot name changes

#### [Gotcha] AUDIT.md can report a stories file as reviewed even when the file was never created — the audit documents intent, not existence (2026-03-13)
- **Situation:** hx-icon-button AUDIT.md listed storybook findings as if a stories file existed, but the file was entirely absent from the codebase
- **Root cause:** Audits are written based on what should exist; when the implementation task is not completed the audit record becomes stale/misleading
- **How to avoid:** Catching this requires actually checking the filesystem, not just audit status. The recreation from scratch using the component TypeScript API was accurate but required more effort.

#### [Gotcha] Storybook argTypes key must exactly match the HTML attribute name (e.g., 'hx-size' not 'size') for CEM autodocs alignment (2026-03-13)
- **Situation:** hx-progress-bar audit found argTypes.size key mismatching the actual HTML attribute hx-size, causing controls table to be out of sync with autodocs
- **Root cause:** CEM (Custom Elements Manifest) autodocs reads attribute names directly from component metadata; if the argTypes key uses a camelCase or shortened alias, the control appears orphaned from the documented attribute
- **How to avoid:** Using the full hyphenated attribute name is more verbose but guarantees controls and autodocs stay in sync without manual overrides

#### [Pattern] aria-labelledby story should use visible label slot instead of redundant label attribute to demonstrate canonical accessible labeling pattern (2026-03-13)
- **Problem solved:** hx-progress-bar audit required a story showing aria-labelledby usage; naive approach would duplicate label in both attribute and slot
- **Why this works:** The correct accessible pattern is to reference an existing visible element via aria-labelledby rather than adding a hidden or duplicate label attribute — this demonstrates real-world usage to consumers
- **Trade-offs:** Slightly more complex story setup, but story becomes a canonical reference implementation that prevents misuse

#### [Pattern] Loading-to-loaded skeleton transition story should include aria-live region to demonstrate full accessible state transition, not just visual change (2026-03-13)
- **Problem solved:** hx-skeleton audit required a story showing loading to loaded transition; purely visual demos miss the accessibility contract
- **Why this works:** Skeleton components serve as placeholders for screen reader users too — the transition must announce content availability via aria-live='polite', otherwise the loaded state is invisible to AT users
- **Trade-offs:** More complex story with JS interaction, but serves as the definitive accessible implementation reference

### hx-select multi-select limitation documented via a SingleValueOnly story referencing hx-checkbox-group as the correct alternative (2026-03-13)
- **Context:** hx-select does not support multi-select; audit finding P2-02 required documenting this constraint in Storybook
- **Why:** Rather than just adding a warning comment, a dedicated story with hx-checkbox-group shown as the alternative teaches consumers the correct pattern at the point of discovery — they find it in Storybook before making the wrong choice
- **Rejected:** Adding a code comment or prop deprecation warning only — these are invisible in Storybook autodocs and don't guide consumers to the correct component
- **Trade-offs:** Requires importing hx-checkbox-group into hx-select stories (cross-component dependency in stories only, not in component code)
- **Breaking if changed:** If SingleValueOnly story is removed, consumers lose the only Storybook-visible documentation of this limitation and may attempt to implement multi-select with hx-select

### Full-width button uses :host([full]) { display: block; width: 100% } on the shadow host plus .button { width: 100%; justify-content: center } on the inner element — two separate CSS rules targeting two separate DOM layers (2026-03-18)
- **Context:** Web Components shadow DOM architecture requires controlling both the custom element host display model AND the internal button element width independently
- **Why:** Custom elements default to inline display, so setting width: 100% on .button alone has no effect if :host remains inline. The host must become block-level first to establish a block formatting context that width: 100% can fill against.
- **Rejected:** Setting only width: 100% on .button — rejected because inline host elements size to content, not container; the inner 100% would be 100% of the inline content width, not the container
- **Trade-offs:** Easier: consumers just add the attribute and get expected full-width behavior without wrapper divs. Harder: the host display model change could affect layouts where hx-button is inline in text flow — it's a breaking layout change for that usage
- **Breaking if changed:** Removing :host([full]) { display: block } would cause width: 100% on .button to do nothing visible, silently breaking the feature

#### [Pattern] Use `var(--hx-button-hover-bg, <variant-default>)` as the fallback in every hover rule rather than introducing a single override point or a separate hover-specific property. (2026-03-18)
- **Problem solved:** Needed to allow consumers to override hover background from outside the shadow DOM for all button variants without breaking existing default styling.
- **Why this works:** CSS custom properties inherit through shadow DOM boundaries — setting the property on the host element is picked up by var() inside the shadow root. Using the existing variant color as the fallback means zero behavior change when the property is unset, making this purely additive.
- **Trade-offs:** Easier: consumers can target all variants with one property. Harder: `filter: brightness()` from `.button:hover` still stacks on top of the custom color — consumers wanting a precise hover color must also reset the filter via `::part(button):hover { filter: none; }`.

#### [Gotcha] The primary variant was missing a `:hover` rule entirely — it was only getting a hover effect via the inherited `filter: brightness()` on `.button:hover`, not via a `--hx-button-bg` override. A new `.button--primary:hover` rule had to be added explicitly to make `--hx-button-hover-bg` work for primary. (2026-03-18)
- **Situation:** When auditing all variant hover rules to add `var(--hx-button-hover-bg, ...)`, primary had no `:hover` CSS rule in the stylesheet, so the new property would have had no effect on primary hovers.
- **Root cause:** The primary variant used `filter: brightness()` as its sole hover mechanism, which is not a `--hx-button-bg` assignment — so a new rule explicitly setting `--hx-button-bg` was required for the override property to take effect.
- **How to avoid:** Now primary is consistent with other variants. However the new rule means primary hover now has both a `--hx-button-bg` assignment AND the inherited `filter: brightness()` stacking, which could produce a slightly different visual than before if the filter compounds with the new bg value.

### Implemented inverted mode via a single boolean host attribute with :host([inverted]) CSS overrides per variant rather than a separate inverted variant enum value (2026-03-18)
- **Context:** hx-button needed to render legibly on dark/gradient backgrounds across all existing variants (primary, secondary, tertiary, ghost, outline)
- **Why:** A cross-cutting boolean attribute orthogonal to variant avoids a combinatorial explosion of variant+context enum values (e.g. 'primary-inverted', 'secondary-inverted'). CSS attribute selectors on :host allow all variant overrides in one block without duplicating variant logic
- **Rejected:** Adding inverted as a variant option — rejected because it would require consumers to know both the visual intent (inverted) and the button role (primary/secondary/etc.) independently, and would double the variant surface area
- **Trade-offs:** The :host([inverted]) block must be maintained in sync with each variant's normal styles; a new variant added later must also get inverted coverage or the attribute silently does nothing for that variant
- **Breaking if changed:** Changing inverted from a reflected boolean property to a CSS-only approach (e.g. a CSS custom property) would break consumers using JavaScript to read or set the inverted state programmatically via element.inverted

### Use a reactive boolean state (_livePolite) to dynamically toggle aria-live between 'polite' and 'off' rather than conditionally rendering/removing the live region element (2026-03-18)
- **Context:** WCAG 2.2.2: autoplay carousels flooding screen readers with announcements every tick — users cannot follow content and the announcements become noise
- **Why:** Toggling aria-live attribute value on a persistent DOM node is the correct ARIA pattern. Removing/re-adding the element resets the live region and can cause missed announcements. A single state boolean cleanly separates autoplay (silent) from manual navigation (announced) without duplicating markup.
- **Rejected:** Debouncing/throttling the live region text updates — rejected because the announcements should be suppressed entirely during autoplay, not just rate-limited. A debounce still announces every N seconds which is still disruptive.
- **Trade-offs:** Easier: clean separation of autoplay vs manual intent. Harder: any new navigation path (keyboard shortcuts, swipe gestures, programmatic goTo calls) must explicitly set _livePolite=true or announcements will be silently suppressed.
- **Breaking if changed:** If _livePolite is removed and aria-live is hardcoded to 'polite', autoplay carousels will announce every slide change to screen reader users — a WCAG 2.2.2 failure. If hardcoded to 'off', manual navigation will never announce slide changes — a WCAG 4.1.3 failure.

#### [Gotcha] aria-current='false' on inactive pagination dots causes screen readers to announce 'not current' for every inactive dot — worse UX than omitting the attribute entirely (2026-03-18)
- **Situation:** Pagination dot buttons where only the active dot should convey 'current' state. Developers often set aria-current='false' thinking it's the correct paired opposite of aria-current='true'.
- **Root cause:** aria-current is a state indicator for the ACTIVE item. The ARIA spec does not require false-value counterparts — absence of the attribute means 'not current'. Screen readers vocalize the false value as 'not current' which adds noise per-dot.
- **How to avoid:** Easier: cleaner screen reader output. Harder: CSS attribute selectors using [aria-current='false'] will break — selectors must use :not([aria-current]) or [aria-current='true'] instead.

### Add a _goToManual() wrapper around goTo() for user-initiated navigation instead of setting _livePolite inline at call sites (2026-03-18)
- **Context:** Pagination dot click handlers needed to set _livePolite=true before calling goTo(). Multiple call sites (dots, next(), previous()) all needed the same behavior.
- **Why:** Centralizing the intent (user-initiated = announce) in a named method makes the distinction between programmatic and manual navigation explicit and self-documenting. If a new navigation trigger is added, the developer sees _goToManual() and understands the pattern rather than having to know to set a state flag.
- **Rejected:** Setting _livePolite=true directly inside goTo() based on a parameter flag — rejected because it would conflate the navigation logic with the announcement policy and make the method signature ambiguous.
- **Trade-offs:** Easier: future navigation triggers have a clear pattern to follow. Harder: two navigation entry points exist; developers must know to use _goToManual() for user-initiated navigation and goTo() for programmatic navigation.
- **Breaking if changed:** If _goToManual() is removed and pagination dots call goTo() directly, pagination dot clicks will no longer announce slide changes to screen readers during autoplay mode.

#### [Gotcha] tabindex='0' on a role='region' wrapper creates an unnecessary focus stop that traps keyboard users in the carousel before reaching interactive controls (2026-03-18)
- **Situation:** The carousel wrapper div had tabindex='0' presumably to make the region programmatically focusable for scripted focus management, but it creates a dead focus stop since the region element itself has no interactive affordance.
- **Root cause:** WCAG 2.1 (keyboard) requires that focus order only includes elements with interactive purpose. A region wrapper with no keyboard handler is not interactive — focus should go directly to the navigation buttons inside it.
- **How to avoid:** Easier: cleaner tab order, one fewer focus stop. Harder: programmatic focus() calls targeting the wrapper (e.g., after dialog close returning focus to carousel) will silently lose focus since non-focusable elements ignore focus() calls.

### Use Lit's `nothing` sentinel (not empty string or null) to conditionally omit aria-label attribute entirely when label prop is unset (2026-03-18)
- **Context:** Adding aria-label to <table role="grid"> — an empty string aria-label is worse than no aria-label because screen readers announce it as unlabeled
- **Why:** Lit's `nothing` removes the attribute from the DOM entirely, whereas binding `''` or `undefined` still renders the attribute with empty value, which can cause screen readers to announce the element as having an empty label rather than falling back to other labeling mechanisms
- **Rejected:** Conditional ternary returning empty string — would render aria-label="" which is technically worse than omitting the attribute, as some AT treat it as an intentional empty label
- **Trade-offs:** Cleaner DOM output, correct AT behavior; requires importing `nothing` from lit explicitly
- **Breaking if changed:** Replacing `nothing` with empty string or null would cause screen readers to announce unlabeled tables as having an empty label, defeating WCAG 4.1.2 compliance

#### [Gotcha] Roving tabindex grids require ALL interactive cells — including checkbox <td> cells — to carry tabindex="-1" and positional index attributes, not just data cells (2026-03-18)
- **Situation:** Keyboard row selection was broken: Space key could not toggle rows when navigating via arrow keys because checkbox cells were excluded from the roving tabindex system
- **Root cause:** The roving tabindex pattern works by programmatically setting tabindex="0" on the focused cell and "-1" on all others. If checkbox cells lack tabindex="-1", the grid navigation logic skips them entirely — arrow keys jump past them and Space key has no registered handler for those positions
- **How to avoid:** Slightly more attributes in the DOM; enables full keyboard operability for row selection per WCAG 2.1.1

#### [Pattern] Emit a dev-time console.warn in willUpdate when a grid/table component has columns but no accessible label, rather than throwing or silently failing (2026-03-18)
- **Problem solved:** WCAG 4.1.2 requires every data table to have an accessible name, but enforcement at component level can't be done at compile time — it depends on consumer usage
- **Why this works:** willUpdate fires before each render and has access to current property values, making it the right lifecycle hook for invariant checks. A console.warn surfaces the omission during development without breaking production or throwing for consumers who haven't yet added a label
- **Trade-offs:** Warning is visible only if devtools are open; can be missed in CI. But it correctly follows the 'fail loud in dev, degrade gracefully in prod' principle

### Extend focus-visible CSS rules to include both element selectors (td, th) AND part selectors ([part~='td'], [part~='th']) for Shadow DOM components (2026-03-18)
- **Context:** hx-data-table renders inside Shadow DOM; header cells had no visible focus ring because only td:focus-visible was defined, missing th and the part-based selectors that consumers use for external styling
- **Why:** In Shadow DOM, ::part() piercing selectors from outside cannot reach the interior without explicit part attributes. Internal styles must target both the native element name AND the part attribute to cover all focus scenarios — including when cells are styled or targeted via part selectors in consumer CSS
- **Rejected:** Only td:focus-visible — misses header cells entirely. Only part selectors — fails for cells that don't have explicit part attributes set
- **Trade-offs:** Slightly more CSS rules; ensures focus ring appears regardless of whether cell is targeted by tag name or part name
- **Breaking if changed:** Removing th:focus-visible leaves header cells without keyboard focus indicators, violating WCAG 2.4.7 for sortable column headers navigable via keyboard

### role='gridcell' and aria-selected must be placed on the interactive element (button) itself, not on a wrapper div containing the button. (2026-03-18)
- **Context:** The original markup placed role='gridcell' and aria-selected on a <div> wrapper around the <button>. Screen readers (JAWS, NVDA) would announce both the gridcell role on the div and the button role on the inner element, producing double or confusing announcements.
- **Why:** ARIA semantics should live on the same node as the interactive affordance. When a role and its associated states (aria-selected) are on a parent container while interaction happens on a child button, the role/state relationship becomes ambiguous and screen readers can mis-sequence announcements or lose the association entirely.
- **Rejected:** Keeping role on wrapper div — rejected because it violates the ARIA authoring practices requirement that interactive widget roles and their states co-reside on the element that receives keyboard focus and fires events.
- **Trade-offs:** Slightly unconventional to have a <button role='gridcell'> but this is explicitly sanctioned by WAI-ARIA for calendar grid patterns. The div wrapper becomes a pure layout element with no semantic weight.
- **Breaking if changed:** Moving role back to the wrapper div re-introduces the double-announcement problem and breaks the semantic association between aria-selected and the focusable element.

#### [Pattern] Add a redundant Escape key handler directly on the calendar container's keydown handler (with stopPropagation) in addition to any document-level handler, as a belt-and-suspenders close path. (2026-03-18)
- **Problem solved:** A document-level keydown handler for Escape existed, but shadow DOM event propagation is not guaranteed — descendants can call stopPropagation before the event escapes the shadow root, and some browser/AT combinations retarget or swallow events at shadow boundaries.
- **Why this works:** Defense in depth: the calendar container's @keydown fires reliably regardless of what inner shadow DOM children do with the event. If a day button or month nav calls stopPropagation, the document-level handler never fires. The container-level handler catches it first.
- **Trade-offs:** Two handlers means Escape logic must be kept in sync if close behavior changes. stopPropagation on the container handler also means no other document listener sees this Escape, which is intentional (prevents double-close side effects) but could surprise future developers.

### hx-counter checks `prefers-reduced-motion` at connectedCallback time rather than at animation start, immediately rendering the final value and skipping the requestAnimationFrame loop entirely for users with reduced motion preferences. (2026-03-18)
- **Context:** Animated number counter component that triggers on mount and on value property changes — needs to be accessible without disabling the feature entirely.
- **Why:** Checking at connectedCallback (not at each rAF tick) means the decision is made once per lifecycle attach, avoiding per-frame media query checks which are expensive. Users get the correct static value without flash of intermediate states.
- **Rejected:** CSS animation approach (counter-increment / @keyframes) — rejected because CSS counters cannot format numbers with prefixes, suffixes, decimal places, or custom easing curves. JavaScript rAF gives full control over easing and formatting.
- **Trade-offs:** Animation re-triggers on every `value` property change (not just mount), making it usable as a live counter. The tradeoff is that rapid value changes cause rapid animation restarts; no debounce is implemented.
- **Breaking if changed:** If prefers-reduced-motion check is moved from connectedCallback to the animation loop, users with that preference would see a flash of animated intermediate values before settling.

### Replace single white border on color picker thumbs with double-ring box-shadow pattern (0 0 0 2px white, 0 0 0 3px dark) to meet WCAG 1.4.11 non-text contrast (2026-03-18)
- **Context:** Gradient picker thumbs and slider thumbs were invisible on light hue backgrounds (yellow, cyan) because a white border against a white/light background fails the 3:1 contrast ratio requirement
- **Why:** A double-ring pattern creates contrast against BOTH light and dark backgrounds simultaneously — the inner white ring separates the thumb from dark backgrounds, and the outer dark ring separates it from light backgrounds. No single color can satisfy this requirement across the full hue range.
- **Rejected:** Single white border (original): fails on light hues. Single dark border: fails on dark hues. Changing thumb color dynamically based on hue lightness: complex JS, breaks in edge cases.
- **Trade-offs:** Slightly more visual weight on the thumb; no JS required; works for any background color without computation
- **Breaking if changed:** Removing either ring breaks contrast on half the color space. Switching back to a single border will fail WCAG 1.4.11 on yellow/cyan hue ranges.

#### [Gotcha] aria-modal="true" without a programmatic focus trap causes JAWS and NVDA to hide all out-of-panel content, stranding keyboard users who Tab out (2026-03-18)
- **Situation:** The color picker panel had role="dialog" aria-modal="true" but no actual Tab-trapping infrastructure, meaning keyboard users could Tab past panel elements into hidden (to screen reader) page content
- **Root cause:** aria-modal is a promise to AT that the modal manages focus. When that promise is broken, screen reader virtual cursors are restricted to the panel DOM while Tab physically moves outside it, creating an irrecoverable keyboard trap in AT perception without being a real focus trap.
- **How to avoid:** role="group" with aria-label is less semantically rich than dialog but is honest about the interaction model; AT users get accurate information about what they can interact with

#### [Gotcha] A 2D gradient slider (saturation+value axes) cannot accurately report aria-valuenow for both axes simultaneously; aria-valuenow should report one axis while aria-valuetext compensates by announcing both (2026-03-18)
- **Situation:** The hx-color-picker 2D grid slider maps X to saturation and Y to value, but aria-valuenow is a single numeric value. Reporting only one axis is semantically misleading without explanation.
- **Root cause:** aria-valuetext overrides the spoken value for screen readers and can include both axes as a human-readable string (e.g., 'Saturation 80%, Brightness 60%'), making aria-valuenow a machine-readable approximation while aria-valuetext provides full context
- **How to avoid:** Screen reader users hear the full value via aria-valuetext; programmatic consumers of aria-valuenow get only one axis unless they also read aria-valuetext

### Tree container uses tabindex="0" only when empty; tabindex="-1" when items exist. Active item row holds the sole tabindex="0" (roving tabindex pattern). (2026-03-18)
- **Context:** hx-tree-view had div[role="tree"] permanently at tabindex="0", creating a double-Tab scenario: Tab landed on container, then focus was redirected to first item via _handleFocusIn — screen readers announced the container as a separate focusable element, violating WCAG 2.4.3.
- **Why:** WAI-ARIA tree view spec mandates roving tabindex so the widget has exactly one Tab stop at all times. The empty-tree fallback to tabindex="0" preserves keyboard discoverability when no items exist.
- **Rejected:** Keeping container at tabindex="0" with JS focus redirect (_handleFocusIn) — rejected because screen readers still announce the container as interactive before the redirect fires, causing double-announcement and confusing focus order.
- **Trade-offs:** Adds complexity: slot initialization must set first item active synchronously before first Tab; _updateRovingTabindex must be called on every navigation event. Removes need for _handleFocusIn redirect logic.
- **Breaking if changed:** Removing the empty-tree tabindex="0" fallback makes empty trees unreachable by keyboard. Removing _handleSlotChange initialization means first Tab into a populated tree lands on the container (tabindex="-1" catches no Tab focus), making the tree unreachable.

#### [Pattern] Parent component drives child tabindex state via a public setRovingActive(boolean) method on hx-tree-item, rather than passing tabindex as a property/attribute from the parent template. (2026-03-18)
- **Problem solved:** hx-tree-view manages which item is the active Tab stop, but each hx-tree-item lives in light DOM and renders its interactive row in shadow DOM — the parent cannot directly data-bind into the child's shadow DOM.
- **Why this works:** Encapsulates shadow DOM internals inside hx-tree-item. The parent calls setRovingActive() as an imperative command; the child owns the _rovingActive reactive state and binds it to the row's tabindex. This keeps the public API clean and avoids exposing internal DOM structure.
- **Trade-offs:** Imperative API (method call) vs declarative (property binding). Method calls are harder to track in devtools vs attribute changes. However it correctly models the one-at-a-time exclusive activation semantics.

### Live region announcement deferred behind existing filterDebounce timer rather than firing immediately on input (2026-03-18)
- **Context:** aria-live region for filter results needed to announce after filtering completes, not mid-keystroke on every character typed
- **Why:** Announcing mid-keystroke creates chatty, interruptive screen reader output; deferring behind the debounce ensures the announcement fires once after the user pauses, matching the actual filtered state
- **Rejected:** Firing announcement synchronously on every input event — would announce stale counts during rapid typing and overwhelm screen reader users
- **Trade-offs:** Announcement is slightly delayed (debounce interval) after typing stops, but the announced count is always accurate and non-disruptive
- **Breaking if changed:** If filterDebounce timer is removed or replaced with a different async mechanism, the announcement wiring must be updated or announcements will fire before filtering completes

#### [Gotcha] hx-combobox had label with id but no for attribute — screen reader association via aria-labelledby worked, but native click-to-focus behavior was silently broken (2026-03-18)
- **Situation:** Component used aria-labelledby for programmatic label association, which satisfies screen reader requirements, but the missing for/id pairing means clicking visible label text does not focus the input
- **Root cause:** aria-labelledby and for are not equivalent: aria-labelledby only provides name computation for AT, while for creates the native browser focus delegation behavior
- **How to avoid:** Adding for requires the input to have a stable id (_id) that matches; the id was already present, so the fix was surgical

#### [Pattern] Visually-hidden live region using clip-rect .field__sr-only pattern added to component shadow DOM styles rather than relying on global utility class (2026-03-18)
- **Problem solved:** Shadow DOM encapsulation means global CSS utility classes like sr-only from Tailwind or design system base styles are not available inside the component
- **Why this works:** Shadow DOM blocks external stylesheet penetration; the clip-rect visually-hidden pattern must be defined inside the component's own styles to be effective
- **Trade-offs:** Each component that needs visually-hidden content must define the utility locally, causing minor CSS duplication across components; this is unavoidable with shadow DOM

### aria-atomic="true" set on the live region alongside aria-live="polite" (2026-03-18)
- **Context:** The live region content is a complete short sentence (e.g. '3 options available') that updates as a whole on each filter
- **Why:** aria-atomic=true tells AT to announce the entire region content as one atomic unit when it changes, preventing partial reads if the DOM update is batched or the announcement is interrupted mid-update
- **Rejected:** Omitting aria-atomic — AT might read only the changed text node rather than the full sentence, producing fragmented announcements like just a number without context
- **Trade-offs:** No meaningful downside for short single-sentence announcements; would be wrong choice for a region containing multiple independent pieces of information
- **Breaking if changed:** Removing aria-atomic could cause screen readers to announce only the numeral change rather than the full contextual sentence, degrading comprehension

#### [Gotcha] CSS custom properties cascade across shadow DOM boundaries to slotted content, but computed properties (color, background-color) do NOT unless explicitly set on :host (2026-03-18)
- **Situation:** hx-card used --hx-card-bg and --hx-card-color custom props on .card (shadow DOM div), but slotted light DOM content couldn't inherit the resolved color/background-color values
- **Root cause:** Slotted content lives in the light DOM tree and inherits CSS from its light DOM ancestors (body → hx-card[host] → slotted-child). The shadow DOM .card div is NOT an ancestor of slotted content in the inheritance chain, so properties set only on .card never reach slotted elements
- **How to avoid:** Setting color on :host makes ALL slotted content inherit it by default, which is correct for theming but means consumers cannot easily opt specific slotted children out of the card color without overriding explicitly. background-color does not CSS-inherit but setting it on :host makes the host visually carry the background beneath transparent slotted content

### background-color set on :host achieves visual cascading for slotted content even though background-color is a non-inherited CSS property (2026-03-18)
- **Context:** background-color does not propagate via CSS inheritance, yet consumers expect --hx-card-bg to affect the visual background behind slotted content
- **Why:** Slotted elements are transparent by default; setting background-color on :host means the host element itself renders the background, and slotted content (transparent) sits visually on top — achieving the same practical effect as inheritance without actually using CSS inheritance
- **Rejected:** Using CSS Parts or explicit ::slotted() rules to apply background — rejected because ::slotted() only targets direct slotted children (not deep descendants) and requires consumers to not override background themselves
- **Trade-offs:** Simpler implementation with no ::slotted() complexity, but relies on slotted content remaining visually transparent. If a slotted element has its own opaque background, the card background is occluded — which is expected behavior
- **Breaking if changed:** If :host background-color is removed, the host element loses its background and the visual theming contract via --hx-card-bg breaks for slotted content scenarios

### ARIA role is dynamically assigned per variant: role="alert" for error/warning, role="status" for info/success (2026-03-18)
- **Context:** Page-level banner component needs to communicate urgency to screen readers without over-announcing routine notifications
- **Why:** role="alert" triggers immediate interruption by screen readers (appropriate for errors/warnings), while role="status" is polite and non-interruptive (appropriate for info/success). Using a single role for all variants would either flood users with interruptions or silently fail to announce critical errors
- **Rejected:** Using role="alert" for all variants — would cause screen reader interruption on every info/success banner, degrading UX for frequent low-urgency notifications
- **Trade-offs:** Requires variant-aware role assignment logic in the component; simpler static role assignment would break a11y semantics for at least half the variant space
- **Breaking if changed:** Flattening to a single role breaks WCAG 2.1 SC 4.1.3 (Status Messages) — screen reader users either miss critical errors or get interrupted by routine messages

### Action link only renders when BOTH action-label AND action-href are set, not either alone (2026-03-18)
- **Context:** Banner supports an optional CTA that must be both labeled and navigable to be useful
- **Why:** A link without href is not a valid interactive element (degrades to non-focusable span in most browsers); a link without a label fails WCAG 2.4.6. Requiring both as a pair prevents half-configured states that would silently produce inaccessible markup
- **Rejected:** Rendering the element when either attribute is present — would produce unlabeled links or non-navigable anchors depending on which attribute is missing
- **Trade-offs:** Slightly stricter API contract; consumer must set both attributes together, but the component never produces invalid accessible markup
- **Breaking if changed:** Loosening to either-or breaks a11y: labelless links fail WCAG 2.4.6, hrefless anchors are not keyboard-reachable

#### [Pattern] Component exposes a programmatic dismiss() method AND fires an hx-dismiss custom event, keeping dismiss behavior dual-mode (imperative + declarative) (2026-03-18)
- **Problem solved:** Consumers may need to react to user dismissal (e.g., persist preference to localStorage) or programmatically close banners on route change
- **Why this works:** Custom events alone require DOM listeners which don't compose well with framework state management; a dismiss() method alone gives no way for external code to react. The dual pattern matches the Helix component contract established by other interactive components (e.g., hx-modal)
- **Trade-offs:** Slightly larger API surface; both paths must be kept in sync. The event must always fire whether dismissed by user click or programmatic dismiss() call to avoid listener-miss bugs

#### [Gotcha] toast-factory.ts must append to document.body rather than near the call site — CSS overflow:hidden, transform, or filter on any ancestor creates a new stacking context that breaks fixed positioning (2026-03-18)
- **Situation:** Drupal BigPipe/AJAX behaviors can re-attach the document body without removing toast stacks. The querySelector check before creation is the only guard against duplicate stacks on re-attach cycles.
- **Root cause:** Fixed-position elements are positioned relative to the nearest ancestor that establishes a containing block. overflow:hidden, transform, and filter all create containing blocks, clipping or misplacing fixed overlays.
- **How to avoid:** Body-level append works universally but couples the toast system to document.body lifecycle. The querySelector dedup guard is load-bearing in Drupal environments where body content can be replaced/re-attached.

#### [Pattern] Responsive table collapse to stacked card layout uses `data-label` attributes on hx-td cells, read via CSS `content: attr(data-label)` pseudo-elements at 768px breakpoint (2026-03-18)
- **Problem solved:** Tables are notoriously unresponsive on mobile — horizontal scrolling is poor UX for data-dense healthcare tables
- **Why this works:** `data-label` is a zero-JS approach that keeps the semantic table structure intact for assistive technologies while visually transforming to cards on small screens; each cell self-labels using the column header text stored in the attribute
- **Trade-offs:** Requires authors to set `data-label` on every hx-td matching its column header — adds authoring burden but zero runtime cost

#### [Pattern] Track slot occupancy with @state() _hasHelpSlot + slotchange handler; only include aria-describedby ID when slot has assigned nodes (2026-03-18)
- **Problem solved:** hx-time-picker always emitted aria-describedby pointing to a help element ID even when the help slot was empty, causing screen readers to announce 'described by nothing'
- **Why this works:** aria-describedby with a valid ID pointing to an empty/absent element triggers an AT announcement of the referenced element's text content (empty string), which is announced confusingly or causes errors in some screen readers
- **Trade-offs:** Adds reactive state and a DOM event listener per instance; correctly handles dynamic slot insertion/removal at runtime

#### [Pattern] Forward ARIAMixin this.ariaLabel to inner shadow button via aria-label=${this.ariaLabel ?? this.label ?? nothing} for icon-only split button accessible name (2026-03-18)
- **Problem solved:** hx-split-button's primary button had no accessible name when label prop was undefined and consumer provided icon-only slot — WCAG 4.1.2 violation
- **Why this works:** ARIAMixin (part of ElementInternals spec) reflects the host element's aria-label attribute as this.ariaLabel, providing a standard mechanism for consumers to set accessible names on custom elements whose inner buttons are in shadow DOM
- **Trade-offs:** Consumers must set aria-label on the host element for icon-only usage — not self-evident from component API; Lit's nothing sentinel correctly removes the attribute when both values are nullish

### Switch hx-rating from role='radiogroup' to role='slider' when precision='0.5' to fix WCAG 2.5.3 label-content-name mismatch (2026-03-18)
- **Context:** Half-precision values (1.5, 2.5, etc.) were represented as radio inputs, but radio labels were whole integers ('3 stars') while the checked value was a half (2.5) — violating WCAG 2.5.3 because the accessible name didn't match the visual label
- **Why:** role='slider' with aria-valuenow/aria-valuetext correctly expresses a continuous numeric value without requiring discrete label-per-option mapping; aria-valuetext can express '2.5 out of 5 stars' precisely. Existing keyboard handlers (ArrowLeft/Right, Home, End) already matched slider keyboard interaction spec with no changes needed.
- **Rejected:** Keeping radiogroup with fractional-value radio labels — rejected because WCAG 2.5.3 requires the accessible name to match the visible label text; a radio labeled '3 stars' being checked for value 2.5 is semantically incorrect and unresolvable within the radiogroup model
- **Trade-offs:** Slider mode star spans must be aria-hidden='true' (decorative) since the slider role itself carries the value; keydown focus restoration logic must be gated to radiogroup mode only to avoid interfering with slider behavior
- **Breaking if changed:** Removing the precision branch and reverting to radiogroup for all precisions would reintroduce WCAG 2.5.3 violations for half-star values; tests asserting slider ARIA attributes would fail

#### [Pattern] hx-spinner exposes a `decorative` boolean that switches `role` from `status` to `presentation`, suppressing AT announcements when spinner appears alongside visible loading text. (2026-03-18)
- **Problem solved:** Screen readers would announce both the spinner's aria-label and adjacent visible text, causing duplicate announcements for users.
- **Why this works:** ARIA spec allows `role=presentation` to remove semantic meaning from an element — using it as an opt-in `decorative` prop lets the consumer control whether the spinner is semantically meaningful or purely visual.
- **Trade-offs:** Adds a prop API surface that consumers must understand, but gives precise control over the accessibility tree without requiring consumers to manipulate ARIA attributes directly.

#### [Pattern] hx-progress-bar emits a WCAG console warning when no label is provided (neither `label` attribute nor visible slot content), rather than silently failing accessibility. (2026-03-18)
- **Problem solved:** Inaccessible progress bars are a common WCAG 1.3.1/4.1.2 failure — components without labels pass visual QA but fail axe-core audits.
- **Why this works:** Surfacing the warning at development time catches the missing label before it reaches production or an audit, without breaking the component's rendering.
- **Trade-offs:** Console warnings add noise if a consumer intentionally omits a label (e.g., when label is provided by an external `aria-labelledby`), but the explicit warning is preferable to silent inaccessibility.

#### [Gotcha] CSS `::slotted()` selectors cannot target nested descendants — only direct slot assignees. `::slotted(hx-tr)` inside `hx-table` never matches because `hx-tr` elements are slotted into `hx-tbody`/`hx-thead`, not directly into `hx-table`. (2026-03-18)
- **Situation:** Attempting to style `hx-tr`, `hx-th`, `hx-td` from the `hx-table` shadow DOM using `::slotted()` selectors for variant-based styling (striped, hover, compact).
- **Root cause:** The Shadow DOM spec limits `::slotted()` to direct slot assignees only. Nested elements distributed through intermediate shadow roots are not reachable. CSS custom properties (variables) DO inherit across shadow boundaries, so setting vars on `hx-tbody`/`hx-thead` is sufficient — they cascade down to `hx-tr`/`hx-td` descendants naturally.
- **How to avoid:** Variant logic must be expressed as CSS custom properties set on intermediate containers (`hx-tbody`, `hx-thead`) rather than direct style rules on leaf elements. Adds one level of indirection but keeps encapsulation.

#### [Gotcha] Conditional striping in Web Components requires CSS custom property gating, not direct `nth-child` selectors. Using `::slotted(hx-tr:nth-child(even))` inside `hx-tbody` causes always-on striping regardless of parent variant. (2026-03-18)
- **Situation:** `hx-tbody` needs to stripe rows only when the parent `hx-table` has `variant='striped'`. The component does not have direct access to parent state.
- **Root cause:** CSS custom properties cascade through shadow DOM boundaries. Parent `hx-table` sets `--_hx-table-row-stripe-bg` only for `variant='striped'`. `hx-tbody` uses `--_hx-table-row-bg: var(--_hx-table-row-stripe-bg, transparent)` — the stripe color is only non-transparent when the parent explicitly provides it.
- **How to avoid:** Variant behavior is controlled entirely through CSS variable cascading — no JS communication between parent and child. Clean but requires careful variable naming conventions.

### Mobile accessibility: hide table headers visually using the visually-hidden CSS pattern (`position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0)`) on the inner `<th>`, NOT `display: none` on the host element. (2026-03-18)
- **Context:** On mobile, `hx-table` switches to a card layout where column headers should not be visible. The naive fix of `display: none` on `<hx-th>` completely removes it from the accessibility tree.
- **Why:** `display: none` removes elements from both visual rendering AND the accessibility tree, breaking screen reader association between `<th scope='col'>` and `<td>` cells. The visually-hidden pattern keeps the element in the a11y tree while making it invisible. Screen readers can still resolve `columnheader` relationships for card-layout cells.
- **Rejected:** `display: none` on `:host` — removes header from a11y tree entirely. `visibility: hidden` — also removes from a11y tree. `aria-hidden='true'` — same problem.
- **Trade-offs:** The thead row collapses to zero visible height on mobile (intended). The `position: absolute` on inner `<th>` is safe because mobile card layout already overrides block display. Consumers MUST still set `data-label` on each `hx-td` for the visual card labels to render.
- **Breaking if changed:** If changed back to `display: none`, screen readers lose column context on mobile. Users relying on `scope='col'` associations will get unlabeled data cells.

#### [Gotcha] Sortable Web Component table headers must NOT have `tabindex` or `@keydown` on the `<th>` wrapper when a `<button>` child handles interaction. The `<th>` + `<button>` creates a double tab stop. (2026-03-18)
- **Situation:** An `hx-th` with `sortable` attribute rendered a `<button>` inside `<th tabindex='0'>`. Both elements are keyboard-focusable, creating two sequential tab stops for a single logical action.
- **Root cause:** Native `<button>` elements handle Enter/Space keyboard activation and are inherently focusable. Adding `tabindex` and `@keydown` to the parent `<th>` duplicates focus management. WCAG requires a single tab stop per interactive element. The `<button>` alone is the correct and complete interactive element.
- **How to avoid:** Removing `tabindex` and `_handleKeydown` from `<th>` simplifies the component significantly. The `th:focus-visible` CSS rule becomes dead code and must also be removed.

### Mobile card layout requires `data-label` forwarding from Web Component attribute to inner `<td>` element via an explicit `@property({ attribute: 'data-label' })` and property setter. CSS `attr(data-label)` in `::before` pseudo-elements reads from the actual DOM element, not the host. (2026-03-18)
- **Context:** `hx-td` uses a mobile card layout where `::before { content: attr(data-label) }` on the inner `<td>` provides visual column labels. The `data-label` attribute set on `<hx-td>` is on the host element, not the inner `<td>` inside the shadow root.
- **Why:** CSS `attr()` resolves against the element the rule applies to. The `::before` pseudo-element is on the inner `<td>`, so `attr(data-label)` reads from the inner `<td>`'s attributes. Attributes on the `<hx-td>` host are invisible to the inner shadow DOM element's CSS. The fix requires a `@property` declaration and explicit forwarding in the render/updated lifecycle.
- **Rejected:** CSS-only solution: `::slotted()` cannot reach into shadow roots. Using `host-context()`: non-standard and deprecated. Expecting `attr()` to traverse shadow boundary: not part of the spec.
- **Trade-offs:** The `dataLabel` property becomes part of the public CEM (Custom Elements Manifest) API surface. Requires `pnpm run cem` after merge to update the manifest. Adds a small property reflection overhead but is the only correct approach.
- **Breaking if changed:** If `data-label` forwarding is removed, all mobile card layouts lose their column label `::before` content — cells appear as bare values with no labels on mobile, breaking the UX silently.

#### [Gotcha] ::slotted() CSS selectors in Web Components can only target direct slot assignees, not nested descendants (2026-03-18)
- **Situation:** hx-table styles were using ::slotted(hx-tr), ::slotted(hx-th), ::slotted(hx-td) expecting to style nested elements inside slotted children
- **Root cause:** CSS ::slotted() pseudo-element has a spec limitation: it only matches elements directly assigned to a slot, not their descendants. Selectors like ::slotted(hx-tbody hx-tr) are silently ignored by browsers.
- **How to avoid:** Fixing to target direct slot assignees (hx-tbody, hx-thead, hx-tfoot) means inner styling must be handled by those child components' own shadow styles, not the parent

### Use CSS custom property with transparent fallback (var(--_hx-table-row-stripe-bg, transparent)) for opt-in row striping instead of always-on striping (2026-03-18)
- **Context:** hx-tbody was unconditionally applying striped row backgrounds via nth-child, so striping could not be disabled without removing the component
- **Why:** Parent hx-table sets --_hx-table-row-stripe-bg when striping is desired; without it the variable resolves to transparent, effectively a no-op. This avoids adding a boolean property to hx-tbody and keeps the parent as the single source of truth for table appearance.
- **Rejected:** Adding a `striped` boolean attribute/property to hx-tbody directly — would require parent to pass attribute down and creates tight coupling; also rejected always-on striping which removes consumer control
- **Trade-offs:** Pattern is implicit/invisible — developers inspecting hx-tbody alone won't see why striping appears/disappears; requires understanding the CSS custom property signaling convention
- **Breaking if changed:** Removing the transparent fallback causes striping to always apply regardless of parent configuration

#### [Gotcha] display:none on mobile table headers removes them from the accessibility tree, breaking screen reader column header association (2026-03-18)
- **Situation:** hx-th was using display:none to hide column headers on mobile card layout (≤768px viewport), which is a common responsive table pattern
- **Root cause:** WCAG 2.1 AA requires that table column headers remain programmatically associated with data cells. display:none removes the element from both visual and accessibility trees, so screen readers lose the ability to announce column context when reading td cells in card layout.
- **How to avoid:** Visually-hidden pattern (position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0)) keeps element in AT but requires careful CSS to prevent layout impact; clip is deprecated in favor of clip-path but clip has broader support

### Sortable hx-th puts tabindex and keydown only on nested <button class='sort-btn'>, not on the <th> element itself (2026-03-18)
- **Context:** Prior implementation duplicated keyboard interaction on both the <th> host and the inner sort button, causing double focus stops and potential double-fire of sort events
- **Why:** A <button> already has native keyboard semantics (Enter/Space activation, tab stop) per HTML spec. Adding tabindex and keydown to the parent <th> creates redundant focus management that violates the single-focus-point principle and confuses AT which announce both elements.
- **Rejected:** Making <th> itself the interactive element without a button — loses native button semantics and requires full ARIA role/keyboard reimplementation; rejected keeping both interactive as it creates two tab stops per column header
- **Trade-offs:** Button-only approach means the <th> is non-interactive from AT perspective, which is correct table semantics; however CSS :focus-visible styling must target the button, not the th
- **Breaking if changed:** Adding tabindex back to <th> creates duplicate tab stops; removing the button and using th directly loses native keyboard activation without explicit keydown handlers

#### [Gotcha] Shadow DOM ::slotted() only matches direct slot assignees — CSS custom properties for variants must be set on hx-tbody/hx-thead host elements, not on hx-tr/hx-th/hx-td which are nested one shadow boundary deeper (2026-03-18)
- **Situation:** Implementing striped/hover/compact variants across a multi-component table system where each sub-component has its own shadow DOM
- **Root cause:** ::slotted() cannot pierce nested shadow boundaries; only the immediately slotted element is matched. CSS custom properties (vars) cascade through shadow boundaries, so setting --hx-* vars on the container host (hx-tbody) allows child shadow DOMs (hx-tr, hx-td) to consume them
- **How to avoid:** CSS var cascade approach works cleanly but requires every sub-component to define and consume the same --hx-* token contracts; adding a new variant requires updates across all sub-components

#### [Gotcha] Sortable hx-th must use the nested <button> as the sole keyboard/focus target; adding tabindex to the <th> host element as well creates a double tab-stop violating WCAG 2.1 Focus Order (SC 2.4.3) (2026-03-18)
- **Situation:** Implementing keyboard-accessible sortable column headers in a web component where the host element is <th> and interaction is delegated to a child <button>
- **Root cause:** The <button> already receives focus and handles Enter/Space — the <th> host should have tabindex=-1 or none. Screen readers announce the button label and aria-sort correctly without the host being in the tab sequence
- **How to avoid:** Button-only focus is cleaner for keyboard nav but requires ensuring the button fills the visual header cell area so click targets are not reduced

#### [Gotcha] CSS attr() for mobile card layout data-label requires the attribute to be explicitly mirrored to the inner <td> element inside hx-td's shadow DOM — the attribute on the custom element host is not visible inside shadow DOM via CSS attr() (2026-03-18)
- **Situation:** Responsive table collapsing to stacked cards at 768px using ::before { content: attr(data-label) } to show column headers alongside each cell value
- **Root cause:** CSS attr() reads attributes from the element the rule is applied to. Inside hx-td's shadow DOM, ::before is on the inner <td>, not the hx-td host. The host's data-label attribute is not accessible from inside the shadow root via CSS
- **How to avoid:** Requires hx-td to explicitly mirror data-label to its inner <td> in connectedCallback/attributeChangedCallback, adding attribute observation overhead; but this is the only cross-browser reliable approach

#### [Pattern] label-* attribute naming convention (kebab-case) maps to labelXxx camelCase properties — all i18n overridable strings follow this prefix (2026-03-18)
- **Problem solved:** Need a discoverable, consistent API surface for i18n consumers to find all overridable strings across components
- **Why this works:** LitElement automatically converts camelCase property names to kebab-case attributes. Using a label- prefix makes all i18n properties grep-discoverable and signals their purpose vs functional properties
- **Trade-offs:** Consistent discoverability and HTML-settable. Verbose API surface grows linearly with number of strings per component.

#### [Pattern] For Web Component menu/panel pairs requiring aria-controls, a stable instance-level _panelId (not a shared module constant) must be used so multiple instances on the same page each have unique IDs. (2026-03-18)
- **Problem solved:** hx-overflow-menu needed aria-controls on the trigger button pointing to the menu panel element. A naive implementation might use a static string ID or a module-level counter.
- **Why this works:** aria-controls requires the value to be an IDREF matching exactly one element's id in the document. If multiple hx-overflow-menu instances share the same hardcoded panel ID, aria-controls on all but one will reference the wrong panel, breaking the association for all but the first instance.
- **Trade-offs:** Instance-level stable IDs (generated once in the constructor or as a class field initializer) are stable across renders, unique per instance, and have no runtime cost after initialization.

### Apply role='list' to inner <div part='base'> shadow DOM element rather than the host element for hx-steps (2026-03-18)
- **Context:** Shadow DOM ARIA ownership rules prevent browsers from recognizing ARIA roles on host elements when the semantic content lives inside the shadow root
- **Why:** ARIA ownership in shadow DOM requires the role to be on the element that directly contains the list items within the same shadow root; placing role='list' on the host creates a broken ownership chain across shadow boundaries
- **Rejected:** Adding role='list' to the host element — browsers cannot resolve ARIA ownership across shadow DOM boundaries so assistive technologies would not recognize the list semantics
- **Trade-offs:** Inner element approach correctly satisfies WCAG 1.3.1 but requires forwarding ariaLabel from host to the inner element separately, adding a small binding layer
- **Breaking if changed:** Reverting to host-level role breaks WCAG 1.3.1 for any AT that traverses shadow DOM; removing the ariaLabel forwarding breaks accessible naming of the list

#### [Pattern] Add stable _panelId field to hx-overflow-menu for aria-controls linkage rather than generating IDs dynamically per render (2026-03-18)
- **Problem solved:** aria-controls must reference a stable, persistent element ID; dynamic or per-render IDs break AT association when the DOM updates
- **Why this works:** Stable IDs generated once at construction time (e.g., via crypto.randomUUID or a counter) persist across re-renders and open/close cycles, keeping the aria-controls → panel relationship intact throughout the component lifecycle
- **Trade-offs:** Slightly more component state to manage; gains robust AT support and survives framework re-render cycles

### Replace hardcoded aria-label on hx-overflow-menu trigger with a reflected menuLabel property defaulting to 'Actions' (2026-03-18)
- **Context:** Hardcoded aria-label strings prevent localization and reuse across different contexts where the menu's purpose differs
- **Why:** Exposing menuLabel as a reflected attribute (menu-label) allows consuming apps to provide context-appropriate labels while the safe default 'Actions' covers the common case without requiring explicit configuration
- **Rejected:** Keeping hardcoded 'Actions' — fails internationalization and prevents semantic differentiation when multiple overflow menus exist on one page
- **Trade-offs:** Adds a public API surface that must be documented and maintained; consumers must know to set menu-label for non-English or context-specific deployments
- **Breaking if changed:** Removing the property reverts to hardcoded label, breaking localized implementations; changing the default from 'Actions' is a breaking change for consumers relying on the implicit label

#### [Pattern] Implement Home/End keyboard handlers in hx-side-nav _handleKeydown jumping to index 0 and navItems.length-1 (2026-03-18)
- **Problem solved:** WCAG 2.1.1 requires keyboard operability; ARIA authoring practices for navigation patterns mandate Home/End keys in composite widgets for efficient navigation across large nav sets
- **Why this works:** Without Home/End, keyboard-only users must arrow-key through every nav item to reach the first or last item — O(n) navigation. Home/End provides O(1) jumps, matching AT user expectations from the ARIA navigation pattern spec
- **Trade-offs:** Minimal implementation cost; must ensure focus management and scroll-into-view are also applied at the target index to be fully useful

### hx-switch label changed from <span @click> to native <label for=${id}> pointing to the inner button's id (2026-03-18)
- **Context:** Screen readers and assistive tech require proper HTML label association for interactive controls; span with click handler is not semantically a label
- **Why:** Native <label for> association provides click forwarding, implicit accessibility semantics, and proper AT announcement without any JavaScript; browser handles the event delegation natively
- **Rejected:** Keeping <span @click> — rejected because span has no semantic meaning to AT, requires manual event handling, and does not satisfy WCAG 4.1.2 Name/Role/Value which requires a programmatic label association
- **Trade-offs:** Simpler code (removed @click handler), better AT support, but requires managing a stable button id (_switchId) to target with the for attribute
- **Breaking if changed:** If _switchId is removed or the button loses its id, the <label for> association breaks silently — label clicks stop forwarding and AT loses the association

#### [Gotcha] Dual tabindex in hx-tabs (host element + inner button) is intentional for roving tabindex pattern, not an accessibility bug (2026-03-18)
- **Situation:** Static analysis tools and code reviewers flag dual tabindex as a violation; the pattern looks wrong without context
- **Root cause:** document.activeElement comparisons require the host to have tabindex so the framework's roving tabindex logic can identify focus state; the inner button is the only focusable element in shadow DOM so no actual focus trap or duplicate focus stop is created
- **How to avoid:** Pattern is safe and WCAG 2.4.3 compliant but requires explicit documentation to prevent future developers from 'fixing' it incorrectly

#### [Pattern] hx-toggle-button emits console.warn in firstUpdated when neither label attribute nor slot text is present, rather than throwing or silently failing (2026-03-18)
- **Problem solved:** Components that render as buttons must have an accessible name per WCAG 4.1.2; no runtime enforcement existed, leading to silent violations in consuming apps
- **Why this works:** firstUpdated fires after initial render when slot assignedNodes are populated and queryable; warn (not error/throw) because the component still functions, and developers must be guided not blocked; checking both label prop and slot text covers all valid usage patterns
- **Trade-offs:** Dev-time guidance with zero runtime cost in production if warning is suppressed; requires slot.assignedNodes({flatten:true}) traversal which adds minimal overhead on first render only

### Replaced <details>/<summary> native HTML elements with <button type='button'> wrapped in configurable <h*> heading element for accordion trigger (2026-03-19)
- **Context:** hx-accordion-item was using native <details>/<summary> which provides built-in disclosure semantics but deviates from ARIA APG Accordion pattern
- **Why:** ARIA APG Accordion pattern requires explicit aria-expanded state on a button, which <details>/<summary> cannot provide. Screen readers announce <details> as 'disclosure triangle' not 'accordion', breaking user expectations. The button+heading pattern allows aria-expanded, aria-controls, and proper heading hierarchy all to coexist.
- **Rejected:** <details>/<summary> — native semantics seem accessible but AT announces wrong role and pattern; no way to add aria-expanded to summary element that AT will respect alongside native open attribute
- **Trade-offs:** Loses native browser open/close behavior for free; must now manually manage expanded state, animations, and keyboard interactions. Gains full WCAG 2.1 AA compliance and correct AT announcement pattern.
- **Breaking if changed:** Reverting to <details>/<summary> breaks screen reader announcement of accordion role, removes aria-expanded state communication, and breaks any downstream consumer relying on proper accordion ARIA pattern

### Used ?hidden attribute on collapsed content panel instead of aria-hidden to remove it from accessibility tree when collapsed (2026-03-19)
- **Context:** Need to hide collapsed accordion panels from assistive technology while still allowing CSS animation on open/close transition
- **Why:** aria-hidden=true hides from AT but panel remains in DOM layout flow and can still receive focus. The HTML hidden attribute removes from AT and layout, but can be overridden in CSS with .content[hidden] { display: block } to allow animations. This gives correct AT behavior while preserving animation capability.
- **Rejected:** aria-hidden — hides from AT but focusable children inside can still be tabbed to; display:none — removes from AT but kills CSS transitions entirely; visibility:hidden — still occupies layout space
- **Trade-offs:** CSS must explicitly override hidden attribute with display:block to re-enable animations — non-obvious CSS pattern that future maintainers could accidentally remove, re-hiding content visually while it animates
- **Breaking if changed:** Removing the CSS override .content[hidden] { display: block } would cause collapsed panels to have display:none, breaking the open animation. Switching to aria-hidden would leave collapsed panels focusable by keyboard.

### Added headingLevel property (1–6, default 3) to hx-accordion-item so consumers control the document heading hierarchy (2026-03-19)
- **Context:** Accordion trigger must be wrapped in a heading element for screen reader landmark navigation, but the correct heading level depends entirely on surrounding page context which the component cannot know
- **Why:** Hard-coding a heading level (e.g., always h3) would break document outline whenever accordions appear at different nesting depths. Defaulting to 3 covers the most common case (accordion inside a section with h2) while allowing override.
- **Rejected:** Hard-coded heading level — breaks document outline in non-standard page structures; no heading wrapper — loses screen reader heading navigation landmark entirely
- **Trade-offs:** Adds API surface to the component that consumers must understand and set correctly. Wrong headingLevel from consumer is still better than wrong hard-coded level from component.
- **Breaking if changed:** Removing headingLevel property and hard-coding a level would break document outline for any consumer not at the assumed nesting depth, causing WCAG 1.3.1 (Info and Relationships) failure

### Set delegatesFocus: true on shadow root so hx-accordion arrow-key navigation can focus hx-accordion-item host elements directly (2026-03-19)
- **Context:** hx-accordion manages arrow-key navigation between items. With shadow DOM, focusing the host element of hx-accordion-item would not move focus inside to the <button>, breaking keyboard navigation.
- **Why:** delegatesFocus:true causes the browser to automatically redirect focus from the host element to the first focusable element inside the shadow root. This lets the parent accordion's keyboard handler focus item hosts without needing to pierce shadow DOM to target inner buttons.
- **Rejected:** Targeting inner <summary> or <button> directly from parent accordion — requires piercing shadow DOM which is brittle; using tabindex manipulation — complex state management across multiple components
- **Trade-offs:** delegatesFocus changes focus behavior globally for the component — any external code calling .focus() on the host will now land on the inner button, which is actually the desired behavior but could surprise developers expecting host-level focus
- **Breaking if changed:** Removing delegatesFocus:true breaks arrow-key navigation between accordion items since the parent accordion's focus() calls on item hosts would not propagate into shadow DOM

#### [Gotcha] focus-visible outline-offset of -2px causes the focus ring to be obscured by the button's own background, making keyboard focus invisible (2026-03-19)
- **Situation:** The original hx-accordion-item had :focus-visible with outline-offset: -2px, intended to draw the focus ring inside the button boundary
- **Root cause:** Negative outline-offset pulls the outline inside the element, but when the element has a solid background color, the inset outline is painted beneath the background fill, making it completely invisible to sighted keyboard users — a WCAG 2.4.7 failure
- **How to avoid:** Positive offset (2px) draws focus ring outside the button boundary, which may extend slightly outside containing elements. This is universally preferred over invisible focus indicators.

### restoreFocus=false for click-outside dismissal; only Escape/programmatic close restores focus to trigger (2026-03-19)
- **Context:** WCAG 2.1 AA requires focus management on popover dismiss, but click-outside has two valid targets: the element clicked and the trigger
- **Why:** When user clicks outside, the browser naturally moves focus to the clicked element. Forcing focus back to the trigger would steal focus from where the user intentionally navigated, violating WCAG 3.2.2 (On Input). Escape/programmatic close has no natural focus destination, so restoring to trigger is correct.
- **Rejected:** Restore focus on all dismiss paths — would cause focus theft when user clicks a link or button outside the popover
- **Trade-offs:** Correct WCAG behavior; slightly more complex API with restoreFocus parameter; developers must know which dismiss path to use
- **Breaking if changed:** Removing this distinction causes screen reader users to lose their place when clicking outside; audit failure on WCAG 3.2.2

#### [Pattern] focusin/focusout on anchor element to open/close hover-trigger popovers for keyboard users, with relatedTarget check to keep popover open when focus moves into popover body (2026-03-19)
- **Problem solved:** Hover-triggered popovers are inaccessible to keyboard-only users who cannot mouse over elements; mouseenter/mouseleave have no keyboard equivalent
- **Why this works:** focusin bubbles and fires when any descendant gains focus, making it suitable for detecting keyboard entry. relatedTarget check on focusout determines if focus is moving INTO the popover vs away from both elements entirely — only close on true focus departure.
- **Trade-offs:** Handles both mouse and keyboard; adding mouseenter/mouseleave on popover body prevents cursor movement into content from dismissing it — required for WCAG 1.4.13 (Content on Hover or Focus)

#### [Gotcha] Focus trap must include the popover body element itself as a focusable cycle target when no interactive children exist (2026-03-19)
- **Situation:** Standard focus trap implementations collect interactive children (buttons, inputs, links) and cycle Tab/Shift+Tab between them. Popovers with only text content have zero interactive children.
- **Root cause:** If the focusable list is empty, Tab would escape the popover immediately, making it impossible for screen reader users to read the content. Including the body itself (which has role=dialog and is thus focusable) provides a valid single-item cycle target.
- **How to avoid:** Content-only popovers become readable by keyboard; slight oddity where Tab appears to do nothing (cycles body→body), but this is standard dialog behavior per ARIA Authoring Practices

### Changed popover body role from region to dialog (2026-03-19)
- **Context:** hx-popover was using role=region which is a landmark for page sections, not for ephemeral overlay content
- **Why:** role=dialog correctly conveys to AT that this is an interactive overlay requiring attention. It enables expected AT behavior: announcing the dialog on open, trapping virtual cursor within the dialog bounds, and providing expected keyboard patterns (Escape to close). role=region has none of these AT behaviors.
- **Rejected:** role=tooltip — too restrictive (non-interactive, no focus management); role=region — landmark semantics wrong for overlay content; no role — loses all AT context
- **Trade-offs:** AT announces dialog on open (desired); requires aria-label or aria-labelledby for accessible name (additional requirement); enables expected Escape-to-close keyboard pattern
- **Breaking if changed:** Reverting to role=region loses dialog AT announcement, virtual cursor trapping, and expected keyboard dismissal behavior — WCAG 4.1.2 failure

### Changed popover body role from 'region' to 'dialog' for WCAG 2.1 AA compliance (2026-03-19)
- **Context:** hx-popover was using role='region' which is a landmark role, not appropriate for interactive overlay content that traps focus
- **Why:** role='dialog' semantically communicates an interactive overlay requiring user action, triggers AT announcement of dialog context, and pairs correctly with focus trap and aria-haspopup='dialog' on the trigger
- **Rejected:** role='region' — landmark role intended for static sectioning, not interactive overlays; role='tooltip' — no interaction/focus trap; role='alertdialog' — implies urgent interruption
- **Trade-offs:** Easier: screen readers correctly announce dialog context and exit instructions. Harder: must implement full focus trap and focus restoration (expected by dialog role semantics)
- **Breaking if changed:** Removing dialog role breaks AT user mental model, makes focus trap unexpected, and breaks aria-haspopup='dialog' contract on the anchor element

#### [Pattern] Differentiated focus restoration behavior: Escape restores focus to trigger, click-outside does not (2026-03-19)
- **Problem solved:** A11y specs require focus restoration when dialogs close, but click-outside implies the user has intentionally moved their pointer/focus elsewhere
- **Why this works:** Escape is a keyboard-initiated dismiss — user has no pointing device to establish new focus context, so restoring to trigger maintains keyboard navigation flow. Click-outside means the user clicked somewhere specific, so restoring to trigger would override their intentional navigation
- **Trade-offs:** Correctly handles both keyboard and pointer modalities at the cost of needing a restoreFocus parameter threaded through _hide()

#### [Gotcha] Hover-mode popovers need focusin/focusout listeners AND mouseenter/mouseleave on the body to prevent premature close when pointer transitions from anchor into content (2026-03-19)
- **Situation:** In hover mode, moving the pointer from the anchor element into the popover body briefly triggers a mouseleave on the anchor, which would close the popover before the user reaches the content
- **Root cause:** The anchor and popover body are separate DOM elements with a gap between them in some layouts. Without body mouseenter/mouseleave tracking, the popover closes the moment the pointer leaves the anchor hitbox
- **How to avoid:** Hover mode now correctly stays open during pointer transit and keyboard navigation into content, at the cost of additional event listener management on the body element

### Applied :focus-visible outline using --hx-focus-ring-* design tokens on [part='body'] rather than hardcoded values (2026-03-19)
- **Context:** WCAG 2.1 AA requires visible focus indicators; popover body can receive programmatic focus during focus trap, needing a visible outline
- **Why:** Design tokens ensure the focus ring matches the system-wide focus style and respects any theme overrides. [part='body'] exposes the element to ::part() styling from outside the shadow root for further customization
- **Rejected:** Hardcoded outline values — breaks theme consistency. outline: none — WCAG violation. Relying on browser default — inconsistent across browsers and doesn't match design system
- **Trade-offs:** Token-based focus ring is themeable and consistent; requires that --hx-focus-ring-* tokens are always defined in the token system
- **Breaking if changed:** Removing the :focus-visible rule causes keyboard users to lose visual focus indication when focus is programmatically moved into the popover body

#### [Gotcha] aria-controls pointing to a conditionally-rendered element (removed from DOM when closed) causes an aria-controls validation error, but removing aria-controls when closed prevents AT from announcing 'has popup, controls [menu name]' — creating an unsolvable tension with conditional rendering via LitElement's `nothing`. (2026-03-19)
- **Situation:** hx-overflow-menu conditionally renders the panel with `${this._open ? html`...` : nothing}`, making the target element non-existent in the DOM when closed.
- **Root cause:** ARIA requires aria-controls to reference an existing element ID; pointing to a non-existent ID fails validation. But omitting aria-controls when closed breaks AT discovery of the controlled region.
- **How to avoid:** Conditional rendering is simpler and performant but fundamentally incompatible with persistent aria-controls. Always-rendered panel (using hidden/inert) solves both problems but adds DOM weight and requires inert polyfill for older browsers.

#### [Gotcha] Math.random() used for generating element IDs is SSR-unsafe — IDs generated server-side won't match those generated client-side during hydration, breaking aria-controls associations silently. (2026-03-19)
- **Situation:** hx-overflow-menu used Math.random() to generate a unique panel ID for aria-controls linkage.
- **Root cause:** Random IDs seem like a simple uniqueness solution but produce non-deterministic output that differs between server render and client hydration passes.
- **How to avoid:** A deterministic ID strategy (counter-based, host element attribute-derived, or crypto.randomUUID with stable seed) solves hydration but requires a singleton counter or ID registry to avoid collisions across component instances.

### aria-haspopup should use specific token 'menu' rather than boolean 'true' even though 'true' is spec-valid — TalkBack and some mobile AT don't correctly map 'true' to the menu role, causing inconsistent announcements. (2026-03-19)
- **Context:** hx-menu-item used aria-haspopup='true' for submenu indicators, which is technically valid per ARIA spec where 'true' aliases 'menu'.
- **Why:** Spec compliance alone is insufficient — real-world AT (especially TalkBack on Android) interprets specific role tokens differently from the generic boolean alias, leading to inconsistent mobile screen reader announcements.
- **Rejected:** Keeping aria-haspopup='true' — spec-valid but causes TalkBack to not distinguish popup type, reducing semantic fidelity on mobile.
- **Trade-offs:** One-character change with zero behavioral impact but measurable improvement in mobile AT compatibility. No downside.
- **Breaking if changed:** Nothing breaks — 'menu' is strictly more specific than 'true' and all AT that supports 'true' also supports 'menu'.

#### [Gotcha] hx-overflow-menu missing type-ahead keyboard navigation creates an inconsistency with hx-menu which implements full character-buffered type-ahead — users of hx-overflow-menu get a degraded keyboard experience versus hx-menu, violating the APG menu pattern's MUST requirement for type-ahead. (2026-03-19)
- **Situation:** Two menu-family components (hx-menu and hx-overflow-menu) handle keyboard navigation differently — hx-menu has type-ahead, hx-overflow-menu only handles ArrowDown/Up/Home/End/Escape/Tab.
- **Root cause:** The components were likely developed independently without enforcing a shared keyboard behavior contract across the menu family.
- **How to avoid:** Adding type-ahead requires slotted item text content access (may need slot change listeners + textContent extraction), plus a character buffer with timeout. Adds complexity but unifies the menu family keyboard contract.

#### [Gotcha] A disabled interactive element implemented as a span (instead of a button with disabled attribute) requires an explicit Enter keydown handler — the browser's native button activation on Enter/Space doesn't fire for spans, creating a complete keyboard failure for the disabled-link pattern. (2026-03-19)
- **Situation:** hx-link's disabled state renders as a span to avoid navigation, but the span has no keyboard activation handler, making it unreachable for keyboard-only users as a keyboard-interactive element.
- **Root cause:** The span approach avoids the href triggering navigation when disabled, but spans are not natively keyboard-interactive — they need tabindex AND explicit keydown handling to behave like interactive elements.
- **How to avoid:** Span + tabindex + explicit keydown handler gives full control but requires manually reimplementing all keyboard behavior that native elements provide for free. Missing any keyboard event (e.g., Space) creates partial keyboard failure.

### hx-menu-item should validate it exists within a menu context (role='menu', role='menubar', hx-menu, or hx-split-button) in connectedCallback and emit a devWarn if orphaned — mirrors hx-menu's slot-change validator pattern for invalid children. (2026-03-19)
- **Context:** hx-menu-item renders role='menuitem' unconditionally, but ARIA requires menuitem roles to exist within a menu/menubar owner. Standalone use creates an invalid ARIA tree with no runtime warning.
- **Why:** Web component consumers frequently misuse components in isolation during prototyping. Without a runtime guard, the ARIA tree violation is invisible until an accessibility audit — devWarn on connectedCallback surfaces the error at development time.
- **Rejected:** Throwing an error — too disruptive for production. Silent failure — leaves invalid ARIA trees undetected. Only Storybook documentation warning — not seen by developers using the component in their own projects.
- **Trade-offs:** connectedCallback ancestor traversal adds a small cost per mount but is negligible. The pattern creates a consistent self-validation contract across the component family (hx-menu validates children, hx-menu-item validates parent context).
- **Breaking if changed:** If hx-split-button's internal menu slot div doesn't have the expected role or tag, the connectedCallback guard would false-positive warn for valid hx-split-button usage — the ancestor check must account for shadow DOM boundaries.

#### [Gotcha] hx-time-picker conditionally removes the listbox from the DOM when closed (`this._open ? html... : nothing`), which breaks aria-controls IDREF resolution — the referenced element literally does not exist in the DOM (2026-03-19)
- **Situation:** ARIA 1.1 combobox pattern requires aria-controls to always reference the owned listbox, but the implementation also conditionally omits aria-controls when closed, compounding the problem
- **Root cause:** Conditional rendering was likely chosen for performance (no hidden DOM nodes) and to avoid styling edge cases with invisible but present listboxes
- **How to avoid:** Conditional render = smaller DOM and no hidden element to accidentally interact with; always-present = correct ARIA ownership, JAWS/NVDA can enumerate options before opening, AT-specific navigation commands (JAWS Ctrl+Alt+Down) work correctly

#### [Gotcha] hx-drawer places role='dialog' on the wrong element — the outer host/wrapper rather than the visible panel — causing JAWS to switch to application/document mode at the wrong DOM boundary, affecting all content within the outer element rather than just the modal panel (2026-03-19)
- **Situation:** Screen readers use role='dialog' to trigger mode switches and establish the modal boundary for virtual cursor trapping; if applied to a wrapper that includes backdrop/overlay elements, the modal region is larger than intended
- **Root cause:** Likely applied to the outermost element for convenience or because the component's host element is the most accessible entry point from outside the shadow DOM
- **How to avoid:** Wrong element = JAWS mode switch fires too early, role='document' on inner panel compounds the issue by triggering a second nested mode switch; correct element = AT mode switch aligns with visual modal boundary

#### [Gotcha] hx-dropdown's floating panel declares no ARIA role despite its trigger using aria-haspopup='menu' — AT expects a role='menu' element to appear when the trigger is activated, but the panel renders as an unsemantic div (2026-03-19)
- **Situation:** aria-haspopup='menu' is a contract with AT: it promises that activating the control will open a menu. If the opened element has no role='menu', AT cannot fulfill the expected interaction pattern (arrow key navigation, menuitem roles, etc.)
- **Root cause:** The panel likely started as a generic container before a11y requirements were considered, and aria-haspopup was added to satisfy a linting rule without ensuring the referenced popup actually implements the menu role
- **How to avoid:** Mismatched haspopup value vs actual panel role = AT announces wrong interaction model, keyboard navigation shortcuts for menus don't work; fixing requires auditing all child items to ensure they use correct role (menuitem, menuitemcheckbox, menuitemradio)

#### [Gotcha] hx-date-picker declares aria-haspopup='dialog' on its input but has no keyboard handler to open the calendar — keyboard-only users can see the promise (AT announces 'has popup dialog') but cannot fulfill it without mouse interaction (2026-03-19)
- **Situation:** aria-haspopup creates an AT-announced affordance; if no keyboard handler exists to open the referenced popup, the affordance is a dead end for keyboard users, violating WCAG 2.1 (keyboard accessibility) and 4.1.2 (name/role/value)
- **Root cause:** The trigger button likely handles opening via click, and aria-haspopup was added to the input for semantic completeness without verifying keyboard parity
- **How to avoid:** Missing keyboard handler = critical blocker for keyboard/AT users; adding it requires careful focus management to ensure focus moves into the calendar on open and returns to the input on close

#### [Pattern] Locale-safe weekday abbreviation: use Intl.DateTimeFormat with weekday:'narrow' for display and weekday:'long' for aria-label, rather than string.slice(0,2) on the short name (2026-03-19)
- **Problem solved:** hx-date-picker slices weekday short names to 2 characters for column headers, which fails for non-Latin scripts and locales where the short name doesn't abbreviate meaningfully at position 2
- **Why this works:** Intl.DateTimeFormat with 'narrow' produces the locale-appropriate single-character abbreviation (or minimal unique identifier) that the locale's conventions define, rather than a mechanical string slice
- **Trade-offs:** Intl.DateTimeFormat calls have a small performance cost but produce correct output; slice is O(1) but wrong for non-English locales

#### [Gotcha] Dynamic role='alert' injection fails VoiceOver — 6 components affected across the form input suite (2026-03-19)
- **Situation:** Components conditionally insert a node with role='alert' into the DOM only when an error occurs, assuming this will announce to screen readers
- **Root cause:** Conditional injection feels logical: only add the alert when there's something to announce. But VoiceOver (and some JAWS configurations) only monitor live regions that exist in the DOM at page load time. Dynamically inserted role='alert' nodes are not reliably picked up.
- **How to avoid:** Persistent live region containers add minimal DOM weight but guarantee cross-AT announcement reliability. Dynamic injection is lighter but non-deterministic across AT combinations.

#### [Gotcha] Shadow DOM inputs require explicit aria-required on the native input element — the host attribute does not propagate (2026-03-19)
- **Situation:** hx-text-input, hx-textarea, hx-number-input, hx-checkbox all expose a 'required' property but fail to reflect it as aria-required on the shadow DOM native input
- **Root cause:** The required attribute on a custom element host does not automatically reflect into shadow DOM children. AT reads the native input's aria-required, not the host's. Without explicit reflection, the form field appears optional to screen readers regardless of the required prop.
- **How to avoid:** Explicit reflection via property watchers adds boilerplate per component but is the only reliable cross-AT approach

#### [Gotcha] hx-radio shadow DOM label is not computed as accessible name by Firefox/JAWS — component appears nameless (2026-03-19)
- **Situation:** The radio component renders a label inside shadow DOM. Browser accessible name computation (accName algorithm) does not cross shadow boundaries in all AT/browser combinations, particularly Firefox+JAWS.
- **Root cause:** Chrome's accessibility tree flattens shadow DOM for name computation, masking the bug. Firefox+JAWS follows the spec more strictly and sees the native input without a computed name because the label is shadow-encapsulated.
- **How to avoid:** Shadow-internal labels maintain encapsulation but sacrifice cross-AT name computation. External aria-labelledby breaks encapsulation but is universally supported.

#### [Gotcha] hx-file-upload uses label[for] pointing to a div[role='button'] — invalid HTML, click behavior broken for sighted keyboard users (2026-03-19)
- **Situation:** The component wires a <label for=dropzoneId> to a div with role='button'. Labels only natively activate labelable HTML elements (input, select, textarea, etc.), not ARIA roles.
- **Root cause:** The aria-labelledby association correctly provides the accessible name to AT, so screen reader testing passes. But sighted users clicking the label text expect it to activate the dropzone, which it does not — the for association is silently ignored by browsers for non-labelable elements.
- **How to avoid:** Removing for and adding an explicit click handler to the label loses the native HTML wiring but gains correct behavior across all users

### hx-file-upload validation errors require an internal aria-live='assertive' region rather than relying on consumer handling hx-error events (2026-03-19)
- **Context:** File validation errors (wrong type, oversized) dispatch an hx-error event. The component only shows the error div when the consumer sets the error property — meaning AT gets no notification if the app doesn't handle the event.
- **Why:** Web components cannot guarantee consumer event handling. An internal assertive live region ensures the error is announced immediately at the component level, independent of integration quality. This is the component contract: the component owns its own error announcement.
- **Rejected:** Delegating error announcement entirely to consumers via hx-error event — rejected because it creates an invisible dependency: silent failure when consumers don't wire up the event, with no indication to the developer that AT is broken
- **Trade-offs:** Internal live region may double-announce if the consumer also sets error property and renders its own alert. This is acceptable — double announcement is better than silence.
- **Breaking if changed:** Without internal live region, any integration that doesn't explicitly handle hx-error silently breaks WCAG 4.1.3 for all file validation errors

#### [Gotcha] hx-slider needs accessible name fallback even when label prop is omitted — no label = AT announces unlabeled range input (2026-03-19)
- **Situation:** hx-slider renders a native range input in shadow DOM. When the label prop is not provided, no aria-label is set on the native input, resulting in an unlabeled range control that AT announces as just 'slider' with no context.
- **Root cause:** Unlike visible UI where a nearby heading or context provides implicit labeling, AT requires explicit programmatic association. There is no implicit label inheritance in shadow DOM from surrounding page context.
- **How to avoid:** A required label prop causes build-time errors but guarantees compliance. A fallback aria-label (e.g., the component's id or a generic 'Slider') is weaker but prevents silent AT failure.

#### [Gotcha] CSS list-style decimal numbers are purely presentational and invisible to assistive technology — screen readers announce 'list item' not step numbers even when visual numbering is present (2026-03-19)
- **Situation:** hx-list numbered variant uses div with role='list' and CSS list-style:decimal for visual numbering of clinical procedure steps
- **Root cause:** AT interprets ARIA roles and native semantics, not CSS visual presentation. Only native ol elements or aria-posinset/aria-setsize provide ordinal position to screen readers
- **How to avoid:** CSS approach gives full visual control but loses semantic ordinal information; native ol approach is less flexible visually but provides implicit AT numbering

### Carousel autoplay suppresses aria-live announcements (aria-live='off') during autoplay ticks to prevent announcement floods, relying on pagination dots with aria-current='true' as the alternative AT position signal (2026-03-19)
- **Context:** WCAG 4.1.3 requires status messages be programmatically determinable, but rapid autoplay ticks would flood screen readers with slide-change announcements
- **Why:** Flooding AT with rapid announcements is worse UX than silence; pagination dots provide a navigable fallback for position awareness
- **Rejected:** aria-live='polite' during autoplay would cause announcement storms on rapid transitions; aria-live='assertive' would be even worse
- **Trade-offs:** Autoplay position is not passively announced (user must navigate to pagination), but manual navigation gets polite announcements — acceptable asymmetry
- **Breaking if changed:** If pagination dots lose aria-current='true', autoplay users have zero AT mechanism to determine current slide position

#### [Gotcha] Carousel arrow key handler intercepts events globally without checking if the event originated from interactive widgets inside slides — breaks select, radio group, date picker keyboard navigation within slides (2026-03-19)
- **Situation:** hx-carousel _handleKeydown calls e.preventDefault() on ArrowLeft/Right/Up/Down regardless of event target, so child interactive elements cannot use arrow keys
- **Root cause:** Global arrow key capture was simpler to implement but didn't account for composed/nested interactive content within slides
- **How to avoid:** Simple global handler is easy to implement but breaks composability; target-checking guard restores composability at cost of complexity

#### [Gotcha] role='list' on a Shadow DOM container does not provide the same screen reader experience as a native ul/ol, and some screen readers apply list-suppression heuristics from CSS list-style:none that may also affect role='list' elements (2026-03-19)
- **Situation:** hx-list bulleted variant uses div with role='list' and CSS list-style:disc rather than native ul element
- **Root cause:** ARIA role correctly communicates list semantics, but browser/AT heuristics designed for native elements can bleed onto role-based elements in unpredictable ways across AT combinations
- **How to avoid:** div+role='list' gives styling flexibility; native ul+role='list' is more robust across AT but slightly more constrained in styling

### Audit-only PRs (no code changes) use skip-changeset label to bypass changeset requirement in CI, enabling the audit JSON artifact to merge without triggering a version bump (2026-03-19)
- **Context:** The changeset workflow requires a changeset file for every PR; pure audit/documentation PRs don't represent a publishable change
- **Why:** skip-changeset label is the established project mechanism to exempt non-code PRs from the changeset gate without disabling the gate globally
- **Rejected:** Adding a fake changeset would pollute the changelog with non-release entries; disabling the check entirely would break the gate for real feature PRs
- **Trade-offs:** Clean changelog maintained; requires discipline to only apply skip-changeset to genuinely non-publishable PRs
- **Breaking if changed:** If skip-changeset label is removed from the audit PR, CI will block merge until a changeset is added

#### [Gotcha] hx-structured-list uses role='list' without term-to-definition association, making it structurally identical to a plain list — screen readers cannot distinguish label cells from value cells in healthcare data panels (2026-03-19)
- **Situation:** Structured lists display label:value pairs (e.g., patient name, DOB, diagnosis) but lack dl/dt/dd or aria-describedby associations to convey the relationship
- **Root cause:** The visual layout communicates structure through position/styling, but AT has no programmatic hook to understand which cell is the label and which is the value
- **How to avoid:** Current approach is visually flexible but semantically opaque to AT; dl/dt/dd approach constrains styling but provides reliable semantics

#### [Gotcha] Web component live regions (role='status', aria-live) must be on the host element, not inner shadow DOM elements, to catch dynamic insertion announcements (2026-03-19)
- **Situation:** hx-toast and hx-spinner both placed role='status' on inner shadow div elements instead of the custom element host. When AT tools observe the DOM, they register live regions at mount time — shadow DOM internals that appear after host insertion are often missed
- **Root cause:** Screen readers (JAWS/NVDA) register live regions when they first appear in the accessibility tree. If the live region is inside shadow DOM and the host element is dynamically inserted, the AT may have already processed the insertion event before it traverses into the shadow root, causing announcements to be silently dropped
- **How to avoid:** Host-level role='status' is visible to AT immediately on insertion but limits shadow DOM encapsulation; inner shadow placement is cleaner architecturally but functionally broken for dynamic toast/spinner patterns

#### [Gotcha] Toggling aria-hidden on a live region that was never active before the toggle may fail to trigger re-announcement in some screen readers (2026-03-19)
- **Situation:** hx-alert and hx-banner use aria-hidden toggling on their live region container to show/hide. If the live region was already aria-hidden=true when first parsed by AT, the region is never registered as live — removing aria-hidden later does not retroactively register it
- **Root cause:** AT builds its accessibility tree incrementally. A region hidden at parse time is excluded from the live region registry. Unhiding it changes visibility but does not replay the registration step, so content changes inside it remain silent
- **How to avoid:** DOM insertion/removal on open guarantees AT always sees a fresh live region registration but has higher DOM cost; aria-hidden toggle is cheaper but semantically broken for dynamic announcement use cases

### Roving tabindex in radiogroup must guarantee exactly one star always has tabindex='0' — edge cases with fractional values or empty state can produce an inaccessible all-tabindex='-1' state (2026-03-19)
- **Context:** hx-rating radiogroup sets tabindex conditionally per star via isActiveTabStop logic. If value is fractional in precision=1 mode or _isChecked logic fails, all stars may end up with tabindex='-1', making the entire widget unreachable by keyboard Tab
- **Why:** The roving tabindex pattern for radiogroups requires exactly one focusable element at all times. When no element has tabindex='0', keyboard Tab skips the entire widget silently — no error, no indication to the user that content was skipped
- **Rejected:** Trusting component logic to always produce a valid tabindex='0' star — rejected because fractional values and edge case value states proved this assumption fails
- **Trade-offs:** Adding an invariant fallback (force i=1 to tabindex='0' if none exists) adds a safety net but masks logic bugs that should be fixed at the source
- **Breaking if changed:** Removing the fallback invariant in roving tabindex leaves a keyboard accessibility hole that is silent and hard to detect — no visual difference, only affects keyboard-only users

#### [Gotcha] Arrow key navigation and Enter/Space activation are separate concerns in radiogroup — implementing only arrow navigation leaves stars mouse-only selectable (2026-03-19)
- **Situation:** hx-rating implemented ArrowLeft/Right/Up/Down and Home/End for navigation between stars but omitted Enter/Space handlers for activation. WAI-ARIA radiogroup pattern requires Space to select (check) the currently focused option
- **Root cause:** Arrow keys move focus (roving tabindex), Space/Enter confirm selection. These are distinct interactions. Implementing navigation without activation creates a widget where keyboard users can highlight stars but cannot commit their selection
- **How to avoid:** Explicit Space/Enter activation allows preview-then-confirm UX but requires two keyboard actions; auto-select on arrow removes the two-step but eliminates exploration

### Non-interactive ARIA roles (role='meter') should not receive tabindex='0' unless a :focus-visible style is simultaneously provided — adding one without the other creates an invisible focus trap (2026-03-19)
- **Context:** hx-meter added tabindex='0' to the meter div (making it a Tab stop) but the stylesheet had no :focus-visible rule, creating a component that receives keyboard focus with no visible indicator — a direct WCAG 2.4.7 violation
- **Why:** tabindex='0' and :focus-visible are a coupled pair for any focusable element. Adding tabindex without focus style is always a violation. For non-interactive roles like meter, the preferred fix is removing tabindex entirely since AT can read meter values via virtual cursor without Tab focus
- **Rejected:** Keeping tabindex='0' and adding :focus-visible — acceptable if keyboard exploration of the meter is a design requirement, but unnecessary since screen readers reach meter via virtual cursor navigation without Tab
- **Trade-offs:** Removing tabindex reduces keyboard reachability (only via virtual cursor, not Tab) but eliminates the focus indicator violation; keeping it requires maintaining a :focus-visible style in sync with the component's focus behavior
- **Breaking if changed:** tabindex='0' without :focus-visible always fails WCAG 2.4.7 (AA) — removing tabindex from non-interactive roles is the safer default; adding it back requires simultaneous focus style implementation

#### [Gotcha] Auto-dismiss timers in toast components must be paused or cancelled when prefers-reduced-motion is active — the timer itself (not just animation) causes vestibular disturbance (2026-03-19)
- **Situation:** hx-toast auto-dismiss fires after a timeout regardless of the user's prefers-reduced-motion setting. WCAG 2.2.1 requires that auto-dismissing UI either be stoppable, extendable, or turned off — reduced-motion users often need more time or no auto-dismiss at all
- **Root cause:** prefers-reduced-motion is commonly misunderstood as only affecting CSS transitions/animations. But auto-dismiss is a time-based change that can be disorienting for vestibular disorder users even without motion — content disappearing unexpectedly is itself a reduced-motion concern
- **How to avoid:** Disabling auto-dismiss for reduced-motion users requires a persistent close button to be always available and discoverable; pausing/extending timeout adds state management complexity

#### [Gotcha] Custom element registration is not guaranteed by the existence of a styles file — hx-toast-stack had only a styles export with no customElements.define(), causing it to render as HTMLUnknownElement (2026-03-19)
- **Situation:** hx-toast-stack.styles.ts existed and was presumably imported, but no hx-toast-stack.ts component class with customElements.define('hx-toast-stack', ...) was present, meaning the element registered as an unknown HTML element with no ARIA semantics or shadow DOM
- **Root cause:** Web component authoring splits style authoring from element registration. A styles file can be created and exported without any corresponding component class, and the browser will silently accept the unknown tag with no warning in production
- **How to avoid:** Separating styles from registration enables style reuse across components but makes it possible to ship styles for non-existent elements; co-locating or requiring both files together prevents this silent failure

### Swatch button accessible names using raw color strings (e.g., 'rgb(59 130 246)') are technically valid programmatic names but are not human-meaningful — aria-pressed or aria-current must supplement color-only selection indication (2026-03-19)
- **Context:** hx-color-picker swatch buttons had aria-label set to color string values and no visual or programmatic indicator of selected state beyond background color, violating WCAG 1.4.1 (color as only means of conveying information)
- **Why:** Color strings satisfy the accessible name requirement technically but fail the usability requirement — screen reader users hear 'rgb(59 130 246)' which is not meaningful. More critically, selected state was conveyed only via visual color difference, which fails in high-contrast mode and for color-blind users
- **Rejected:** aria-label alone as the complete accessible solution — rejected because it only solves programmatic naming, not selection state communication (aria-pressed/aria-current) or high-contrast visual indication
- **Trade-offs:** Human-readable color names require a color-to-name mapping library or API; aria-pressed toggles add state management but make selection semantics unambiguous to AT; visual checkmark adds DOM complexity but solves high-contrast cases
- **Breaking if changed:** Without aria-pressed/aria-current, swatch selection state is invisible to AT users; without a non-color visual indicator, selection is invisible in high-contrast mode — both are independent WCAG failures that require independent fixes

#### [Gotcha] hx-pagination uses inconsistent disabled state patterns: prev/next use native `disabled` attribute (removes from AT in some screen readers) while current page button uses `aria-disabled='true'` (keeps focusable) — the CSS already styles `[aria-disabled='true']` but the HTML doesn't use it consistently (2026-03-19)
- **Situation:** Native `disabled` and `aria-disabled` have fundamentally different AT behavior — native disabled removes the element from the tab order and accessibility tree entirely in some screen readers
- **Root cause:** Likely native `disabled` was used first as the obvious HTML pattern, then `aria-disabled` was added later for the current page button without standardizing
- **How to avoid:** Using `aria-disabled` everywhere requires JS to intercept click/keyboard events since the browser no longer blocks them natively — slightly more implementation complexity but consistent AT behavior

### hx-tree-item expand button uses generic `aria-label='Collapse'/'Expand'` with no node context, requiring screen reader users to remember which node they're on when hearing the button announced (2026-03-19)
- **Context:** Screen readers read interactive elements in isolation when navigating by control type — hearing 'Expand, button' 20 times in a large tree gives no indication of which node each button belongs to
- **Why:** The simpler implementation doesn't require slot observation or caching label text — functional but incomplete for AT users
- **Rejected:** No aria-label at all — even worse, button would announce as unlabeled
- **Trade-offs:** Caching label text from default slot requires a `slotchange` listener and a `_labelText` property — adds lifecycle complexity but is the only way to provide context-aware labels in Shadow DOM where the button can't reference external text directly
- **Breaking if changed:** If `_labelText` caching is removed and aria-label reverts to generic 'Expand'/'Collapse', large trees become unusable for screen reader users navigating by button

#### [Gotcha] hx-steps uses `role='listitem'` + `tabindex='0'` which makes steps focusable but gives screen readers no activation affordance — AT users hear a focusable list item with no indication it can be clicked or what interaction is expected (2026-03-19)
- **Situation:** WCAG 2.4.3 requires focus order to make sense; giving `tabindex` to non-interactive roles creates a focus trap that misleads AT users into thinking something interactive exists
- **Root cause:** tabindex was added to enable keyboard navigation to steps (visual focus ring), but the semantic role was never updated to reflect interactivity
- **How to avoid:** Proper fix requires either `role='button'` (if steps are activatable) or `role='listitem'` with no tabindex and arrow-key roving tabindex at the list level — both require behavioral changes, not just ARIA attribute changes

#### [Gotcha] Unicode triangle/arrow characters used as button labels render inconsistently across OS/font combinations and lose visual distinction in Windows High Contrast Mode — SVG icons with aria-hidden are the correct replacement (2026-03-19)
- **Situation:** hx-split-panel collapse buttons use '◀' and '▶' Unicode characters as visible content with aria-label for the accessible name
- **Root cause:** Unicode geometric shapes depend on font glyph availability; in high-contrast mode the symbol may become invisible against the forced background color because it's treated as text rather than an icon with fill/stroke CSS properties
- **How to avoid:** SVG icons require additional asset management but provide: consistent rendering, scalable crisp display at all sizes, proper high-contrast adaptation via currentColor fill, and no font dependency

### WCAG 2.2 SC 2.5.8 sets 24x24px as the minimum touch target — components at 20x20px are non-compliant and require either increasing the hit area or adding a transparent padding/pseudo-element overlay to reach minimum (2026-03-19)
- **Context:** hx-split-panel collapse buttons are 20x20px in CSS, 4px below the 24x24px WCAG 2.2 AA minimum
- **Why:** Clinical/EHR interfaces frequently use touch devices; a 20px button is the most common failure point because it appears 'close enough' visually but fails the 24px floor
- **Rejected:** Increasing visual size to 24px only — misses the higher-value WCAG 2.5.5 recommendation of 44x44px; pseudo-element approach achieves 44x44px clickable area while keeping the 20px visual design
- **Trade-offs:** Pseudo-element overlay for touch target expansion requires position:relative on the button and z-index management; it invisibly expands the clickable area without changing layout flow
- **Breaking if changed:** If touch target size is reduced back to 20px, the component fails WCAG 2.2 AA SC 2.5.8 which is now a required conformance level for new healthcare interface procurement

#### [Pattern] Error summary components must provide both a live region announcement AND focus management with navigational links to errored fields — live region alone is insufficient for complex forms (2026-03-19)
- **Problem solved:** hx-form injects an error summary with role='alert' when validation fails but does not move focus or provide links to the fields in error
- **Why this works:** Live region announces errors but focus stays on submit button; screen reader users must then manually navigate backward through the form to find which field failed. In long clinical forms (20+ fields) this can require 30+ keystrokes
- **Trade-offs:** Adding anchor links in the error summary requires stable IDs on all form fields and JS focus management with setTimeout to allow DOM update before focus move; adds implementation complexity but dramatically improves usability for all keyboard/AT users

#### [Pattern] Three-tier CSS custom property chain for focus rings: var(--hx-focus-ring-width, 2px) solid var(--hx-[component]-focus-ring-color, var(--hx-focus-ring-color, var(--hx-color-primary-500))) (2026-03-19)
- **Problem solved:** 14 components had hardcoded focus ring values (px sizes, hex colors) or used non-existent tokens like --hx-color-focus, making theming impossible and failing WCAG contrast in custom themes
- **Why this works:** Three tiers allow: (1) global system override, (2) component-family override, (3) safe primitive fallback. Consumer can override one ring globally or per-component without touching source
- **Trade-offs:** Verbose CSS but each tier serves a distinct consumer use case. Breaking the chain at any tier silently falls through to next, which is actually desirable behavior

#### [Gotcha] Cross-shadow-boundary aria-labelledby fails in Web Components — aria-label set programmatically is the correct fix for hx-tab-panel (2026-03-19)
- **Situation:** hx-tab-panel used aria-labelledby pointing to a tab element in a different shadow root, which screen readers cannot resolve across shadow DOM boundaries
- **Root cause:** The ARIA spec requires aria-labelledby targets to be in the same accessibility tree scope; shadow DOM creates separate scopes, so the reference is invisible to AT
- **How to avoid:** aria-label requires hx-tabs.ts to explicitly sync the tab text into each panel's aria-label property at runtime; more coupling but the only reliable cross-shadow solution

#### [Gotcha] In Lit templates, using empty string '' as an aria-label fallback is worse than using nothing — it results in an empty accessible name rather than no name, which AT announces as a nameless element (2026-03-19)
- **Situation:** hx-split-button was falling back to empty string instead of Lit's nothing sentinel when no aria-label prop was provided
- **Root cause:** nothing removes the attribute entirely from the DOM, allowing AT to derive the name from content or other sources; '' sets an explicit empty name which overrides all other naming mechanisms and is announced as blank
- **How to avoid:** Using nothing means developers get no explicit label attribute in the DOM to inspect, but AT behavior is correct; easier debugging with '' but broken a11y

#### [Pattern] devWarn as a developer-facing accessibility enforcement mechanism — fire a console warning when required accessible name props are absent rather than silently rendering inaccessible markup (2026-03-19)
- **Problem solved:** Multiple components (hx-slider, hx-card, hx-menu, hx-tree-view, hx-tabs) require a label from the consuming developer but cannot enforce it at the type level for all use cases
- **Why this works:** TypeScript cannot enforce that a string prop is non-empty at compile time; runtime devWarn surfaces the violation immediately in development without breaking production rendering
- **Trade-offs:** devWarn only fires in dev mode and requires developers to check the console; it does not prevent deployment of inaccessible markup, but provides fallback label so AT still gets something

### hx-accordion-item was given a new level prop (1-6, default 3) to wrap the trigger button in a heading element per APG accordion pattern, rather than using aria-level on a div (2026-03-19)
- **Context:** WCAG and APG accordion pattern requires accordion headers to be real heading elements or buttons inside headings for correct document structure and screen reader navigation
- **Why:** Real heading elements (h1-h6) appear in AT heading navigation lists; aria-level on a non-heading role is not widely supported and does not surface in heading navigation
- **Rejected:** role='heading' with aria-level — poor AT support; flat button with no heading wrapper — fails document structure requirements; hardcoded h3 — inflexible for pages with different heading hierarchies
- **Trade-offs:** New public API surface (level prop) that must be maintained; consuming developers must now think about heading hierarchy, but this is the correct architectural responsibility
- **Breaking if changed:** Removing the heading wrapper would break screen reader heading navigation for accordion components; changing the default from 3 would be a breaking change for existing implementations that rely on the heading level for visual or AT hierarchy

#### [Gotcha] Boolean ARIA attributes rendered as the string 'false' are functionally different from being absent — both 'true' and 'false' string values are treated as truthy by some assistive technologies, meaning aria-selected='false' may still signal selection to screen readers depending on the AT implementation. (2026-03-19)
- **Situation:** 13 components across the helix library were rendering boolean ARIA state attributes with a ternary that always produced a string: `aria-expanded=${this._open ? 'true' : 'false'}`. The 'false' string is a valid attribute value but the correct pattern for boolean ARIA attributes is omission when the state is false.
- **Root cause:** ARIA spec for boolean attributes like aria-selected, aria-expanded, aria-pressed, aria-checked treats the absence of the attribute differently from presence with value 'false' in certain role contexts. Omitting the attribute is the authoritative way to signal 'not in this state' for elements where the attribute is not applicable or the state is inactive.
- **How to avoid:** Easier: cleaner DOM output, correct AT interpretation, passes automated a11y audits. Harder: developers must remember that omission = false for these attributes, which is non-obvious compared to explicit 'false'.

#### [Pattern] In Lit-based web components, use the `nothing` sentinel value from the 'lit' package to conditionally omit attributes entirely rather than rendering an empty or false string value. Pattern: `attr=${condition ? 'true' : nothing}` removes the attribute from the DOM when condition is false. (2026-03-19)
- **Problem solved:** Lit's template system does not have a built-in way to conditionally exclude an attribute using a simple ternary returning undefined or null — those get serialized as strings. The `nothing` sentinel is the correct Lit primitive for attribute removal.
- **Why this works:** Lit serializes `undefined`, `null`, and `false` differently depending on context. For attribute bindings, `nothing` is the only value that causes Lit to remove the attribute node from the DOM entirely, which is required for correct ARIA boolean attribute semantics.
- **Trade-offs:** Easier: correct DOM output with single import. Harder: requires `nothing` to be imported from 'lit' in every component file; easy to accidentally use null/undefined instead and get subtle bugs.

#### [Gotcha] Only hx-drawer had the focus-in-limbo violation; hx-dialog and hx-popover were already restoring focus before animation timeouts despite the bug report claiming all three were affected. (2026-03-19)
- **Situation:** GH #1031 reported focus restoration delayed by animation in hx-drawer, hx-dialog, and hx-popover. Audit and code review revealed only hx-drawer was actually violating WCAG 2.4.3.
- **Root cause:** Reading source files before editing prevented unnecessary changes to compliant components and narrowed the actual blast radius of the bug.
- **How to avoid:** Smaller diff, lower regression risk, faster review; but requires trusting code-read over the bug report's component list.

#### [Pattern] Separate focus restoration from animation cleanup by placing focus() synchronously after the state change and dispatching hx-hide, then letting setTimeout handle only hx-after-hide and DOM teardown. (2026-03-19)
- **Problem solved:** WCAG 2.4.3 requires focus never to reside on invisible or inert content. A 300ms animation timeout was the barrier between close() being called and focus returning to the trigger.
- **Why this works:** Focus is a synchronous browser concern; animation is asynchronous. Keeping them in the same setTimeout callback couples a user-perceivable correctness requirement to an implementation detail (animation duration), making the a11y contract fragile.
- **Trade-offs:** Focus returns before the drawer finishes animating out, which is the correct UX (user is done with the drawer); the only downside is the trigger briefly receives focus while the drawer is still mid-animation, which is imperceptible to sighted users and correct for AT users.

#### [Gotcha] AT (JAWS, NVDA, VoiceOver) only announces content *injected into a pre-existing live region*, not content already present when the region becomes visible via aria-hidden removal or dynamic container creation (2026-03-19)
- **Situation:** hx-toast, hx-alert, and hx-text-input were using aria-hidden toggling or dynamically creating the live region container with content already inside it — screen readers silently ignored these announcements
- **Root cause:** WCAG and AT browser implementations require a DOM mutation (new text nodes inserted) inside a live region that already exists in the accessibility tree; toggling visibility or creating the container+content simultaneously does not trigger the announcement pipeline
- **How to avoid:** Live region containers must always be rendered in the shadow DOM even when empty/inactive, adding minor DOM overhead; benefit is 100% reliable cross-AT announcement

#### [Pattern] For initially-visible-then-hidden-then-reshown alerts, use a separate sr-only polite live region with a clear-then-repopulate microtask chain rather than toggling aria-hidden on the host element (2026-03-19)
- **Problem solved:** hx-alert needed to re-announce content when transitioning open=false→true, but JAWS produces double-announcements if both role=alert on host AND a live region fire simultaneously
- **Why this works:** Chained microtasks (clear → repopulate in next microtask) force the AT to process a genuine content mutation cycle; the host role=alert/status handles initially-visible cases, the sr-only region handles re-announcement cycles without collision
- **Trade-offs:** Slightly more complex render logic; requires understanding of microtask timing; solves the JAWS-specific double-announcement bug that affects ~50% of enterprise screen reader users

### Use CSS custom property var(--hx-touch-target-min, 2.75rem) as a design token with rem fallback rather than hardcoded px values for WCAG 2.5.5 touch targets (2026-03-19)
- **Context:** 9 components had interactive elements below the 44x44px healthcare mandate minimum. Need a single source of truth that can be overridden per-theme or per-density.
- **Why:** Design token approach allows theme-level override (e.g., desktop-only modes can reduce to 32px without touching component code). rem unit respects user font scaling preferences, making it more accessible than px. Single token name means a global audit/change only requires one token update.
- **Rejected:** Hardcoded 44px or 2.75rem inline — rejected because it would scatter the magic number across 9+ files and make density/theme overrides impossible without mass find-replace. Using padding expansion instead of min-width/min-height was rejected because it would alter layout geometry and potentially break tight-fitting designs.
- **Trade-offs:** Easier: theme-level touch target density control, single token audit, font-size scaling support. Harder: token must be defined in the token package or components fall back to literal 2.75rem which may drift if base font size changes.
- **Breaking if changed:** Removing --hx-touch-target-min token from the token package silently falls back to 2.75rem — not a breakage but a silent decoupling. Changing the fallback value affects all components that rely on it without a token override.

#### [Pattern] Apply min-height (not fixed height) to row-level containers like .checkbox__control and .radio for touch target compliance, while applying both min-width and min-height to icon-only buttons (2026-03-19)
- **Problem solved:** Checkbox and radio controls are inline-flex rows containing both an input and a label — setting a fixed height would clip label text on multiline labels. Icon-only buttons like close/remove need square enforcement.
- **Why this works:** min-height on row containers preserves vertical growth for wrapped or multiline label text while still satisfying the 44px touch target in the tap-axis. Icon buttons have no content to grow, so both axes need enforcement.
- **Trade-offs:** Easier: label text wraps naturally, layout remains stable. Harder: the actual clickable input inside the row may still be visually smaller than 44px; the row height satisfies 2.5.5 but the precise clickable rect is controlled by the input element itself.

#### [Gotcha] hx-data-table checkbox column required TWO separate fixes: the column width (th/td) AND the input element itself, because CSS column width does not constrain the input's own touch target (2026-03-19)
- **Situation:** The checkbox column was 40px wide. Simply widening the column to 44px is insufficient — the input[type=checkbox] inside it has its own width/height that CSS table layout does not automatically stretch to fill the cell.
- **Root cause:** Table cell sizing and input sizing are independent in CSS. A 44px-wide td does not make the checkbox input 44px — the input keeps its explicit width/height unless overridden. Both must be fixed independently.
- **How to avoid:** Easier: complete WCAG compliance for the data table checkbox. Harder: two properties to maintain in sync; a future token change to --hx-touch-target-min must be reflected in both the column width (--hx-touch-target-min-px, 44px) and the input (--hx-touch-target-min, 2.75rem).

#### [Gotcha] A separate --hx-touch-target-min-px token (in px) was needed for the data-table column width alongside the rem-based --hx-touch-target-min, because CSS table column sizing does not respond reliably to rem values in the same way as flex/grid (2026-03-19)
- **Situation:** Table column widths (width: / min-width: on th/td) are resolved in the table layout algorithm which can behave differently from flex sizing. Using 2.75rem worked fine for flex containers but the data-table column needed the px equivalent token.
- **Root cause:** Table layout algorithm treats column width constraints differently — using a px value ensures deterministic column sizing that matches the input's min-size. rem values in table columns can be inconsistent across browsers when the table has auto layout.
- **How to avoid:** Easier: predictable table column sizing. Harder: two tokens to keep in sync (44px and 2.75rem represent the same physical size but must be updated together if the standard changes).

### Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` at timer-start time via a getter, not at component initialization or via a stored listener (2026-03-19)
- **Context:** WCAG 2.2.1 (Timing Adjustable) violation: hx-toast auto-dismissed regardless of user motion preference
- **Why:** A getter re-reads the media query on every invocation, so it reflects the user's current preference at the moment the timer would start — not a stale value cached at mount time. This handles cases where the user changes their OS setting while the page is open.
- **Rejected:** Storing the matchMedia result at connectedCallback or as a class field. This would cache a stale value and miss runtime preference changes. Adding a `change` event listener on the MediaQueryList was also considered but adds teardown complexity for minimal gain.
- **Trade-offs:** Slightly more overhead per show() call (one matchMedia lookup), but eliminates stale-state bugs and listener teardown complexity. The overhead is negligible for a toast component.
- **Breaking if changed:** If changed to a cached value at init, the component would mis-fire timers for users who toggle reduced-motion after page load. If the guard is removed entirely, WCAG 2.2.1 violation reintroduces.

### hx-meter uses a visible state label below the track (aria-hidden="true") rather than a visually-hidden label for WCAG 1.4.1 compliance (2026-03-19)
- **Context:** hx-meter conveys optimum/warning/danger states through fill color alone, violating WCAG 1.4.1
- **Why:** Meter state is inherently visual/quantitative — a visible label below the track serves both sighted color-blind users AND provides redundancy. aria-hidden is safe because aria-valuetext already includes the state string for assistive technology, avoiding duplicate announcements
- **Rejected:** Visually-hidden-only label (sr-only) was rejected because it would only fix AT users, not sighted color-blind users who can see the meter but cannot distinguish fill colors
- **Trade-offs:** Visible label adds visual weight to the component but provides genuine dual-modality (color + text) for all users including those not using AT
- **Breaking if changed:** Removing aria-hidden from the label would cause screen readers to announce the state twice — once from aria-valuetext and once from the visible label text

#### [Pattern] Visually-hidden severity prefix labels injected as first child of content slots in hx-alert, hx-badge, hx-tag, hx-toast — rendered unconditionally for semantic variants (2026-03-19)
- **Problem solved:** Components used color + icon (or color alone) to convey severity, but icons can be hidden and color is insufficient per WCAG 1.4.1
- **Why this works:** A visually-hidden text prefix (e.g. 'Error:') is announced by screen readers as part of the element's accessible name/content without changing visual layout. Rendering unconditionally (not gated on showIcon or other props) ensures the fix cannot be accidentally disabled by prop combinations
- **Trade-offs:** Slightly more DOM nodes; visually-hidden text must be carefully styled to avoid affecting layout (must use position:absolute + clip pattern)

### hx-progress-bar injects variant state into aria-valuetext (e.g. '75% — Danger') rather than relying on a separate aria-label or role change (2026-03-19)
- **Context:** Progress bars already use aria-valuetext for percentage; adding variant information there is the least-invasive AT fix
- **Why:** aria-valuetext replaces the default value announcement entirely, so appending '— Danger' to the percentage string gives AT users complete state information in a single announcement without restructuring the component's ARIA role or adding redundant attributes
- **Rejected:** Adding aria-label with variant info was rejected because aria-label on a progressbar overrides the implicit label from the surrounding context, potentially dropping the component's user-visible label from the AT announcement
- **Trade-offs:** aria-valuetext must be kept in sync with both the numeric value and the variant prop; a visually-hidden label is added as a belt-and-suspenders fallback for AT that may not fully support aria-valuetext on progressbar role
- **Breaking if changed:** If aria-valuetext generation logic is refactored to only include the percentage, the variant state information disappears from AT announcements

#### [Pattern] hx-toast adds both a visually-hidden severity label AND relies on icon shape as dual non-color cues — two independent non-color indicators (2026-03-19)
- **Problem solved:** Toast notifications use color + icon to convey severity, but icon shape alone (without visible label) is also not always sufficient for users unfamiliar with icon conventions
- **Why this works:** Providing two independent non-color cues (text label + icon shape) creates defense-in-depth: even if a user cannot distinguish icon shapes (low vision, unfamiliar iconography), the text label still conveys severity. This exceeds WCAG 1.4.1 minimum requirement
- **Trade-offs:** Slightly more content in the AT announcement but the tradeoff favors accessibility robustness

### aria-required must be placed on the focusable native element (input/textarea/fieldset) inside shadow DOM, not on the custom element host (2026-03-19)
- **Context:** Web components with shadow DOM encapsulate native form controls; screen readers interact with the accessibility tree which sees the shadow DOM internals, not the host element attributes
- **Why:** Assistive technologies traverse the accessibility tree and need aria-required on the element that receives focus and has the implicit form role, not on the custom element wrapper which may have no meaningful ARIA role
- **Rejected:** Setting aria-required on the host element — this would be ignored by screen readers since the host is a generic custom element, not a form control
- **Trade-offs:** Requires understanding shadow DOM accessibility semantics per element type; fieldset elements need aria-required for groups while individual inputs need it for single controls
- **Breaking if changed:** Moving aria-required back to the host element would silently break screen reader announcements with no lint/type errors — purely a runtime accessibility regression

### Use Lit's `nothing` sentinel (not empty string or false) to conditionally omit aria-required when required=false (2026-03-19)
- **Context:** Lit template rendering: setting an attribute to an empty string still renders the attribute in the DOM; aria-required='false' is valid but aria-required='' is not meaningful and aria-required presence without value can confuse some ATs
- **Why:** Lit's `nothing` removes the attribute from the DOM entirely when the condition is false, which is semantically correct — an element that is not required should have no aria-required attribute rather than aria-required='false'
- **Rejected:** Conditional string like `required ? 'true' : 'false'` — aria-required='false' is technically valid ARIA but adds noise; empty string is invalid; boolean false in Lit removes the attribute but `nothing` is the idiomatic pattern
- **Trade-offs:** Slightly less obvious to developers unfamiliar with Lit; but results in cleaner DOM output and avoids aria-required='false' being present on every non-required field
- **Breaking if changed:** Replacing `nothing` with empty string or omitting the conditional would result in aria-required always being present or always absent, breaking required state announcement

#### [Gotcha] Parent container touch target does NOT cascade to child input elements — setting min-width/min-height on a checkbox input overrides its explicit width/height, making the visual element 44px instead of the intended 16px (2026-03-19)
- **Situation:** hx-data-table checkbox column: parent col-checkbox cell was already 44px, but a redundant min-width/min-height was also added to the input[type='checkbox'] itself
- **Root cause:** WCAG 2.5.5 requires 44x44px touch target, but the target can be the parent container — the interactive element itself does not need to be 44px visually
- **How to avoid:** Satisfying WCAG 2.5.5 via parent container preserves visual design; the trade-off is that the approach is non-obvious and easy to re-introduce the mistake during maintenance

#### [Gotcha] A component can have multiple interactive controls where only some are fixed in a single pass — hx-carousel play-pause button was fixed for touch target but nav-btn (prev/next) was overlooked in the same PR (2026-03-19)
- **Situation:** Feature targeted insufficient touch targets across multiple components; the carousel had two distinct button types (.play-pause-btn and .nav-btn) using the same 2.5rem (40px) base size
- **Root cause:** Both button types share the same root cause but are styled independently; fixing one does not propagate to the other
- **How to avoid:** Systematic per-component audits catch all controls but are slower; targeted single-fix approaches risk partial remediation

### Use CSS custom property --hx-touch-target-min with rem fallback (2.75rem) as the canonical touch target token across all components, not pixel-based variants like --hx-touch-target-min-px (2026-03-19)
- **Context:** hx-data-table was using --hx-touch-target-min-px with a 44px fallback — a token that does not exist in the design system, while all other components used --hx-touch-target-min with 2.75rem
- **Why:** rem-based tokens respect user font size preferences (accessibility), are consistent with the design token system, and allow global override via the single --hx-touch-target-min variable
- **Rejected:** --hx-touch-target-min-px with px fallback — rejected because it ignores user font scaling, is inconsistent with all other components, and references a non-existent token
- **Trade-offs:** rem requires understanding the base font size to reason about pixel equivalence (2.75rem = 44px at 16px base); px is more explicit but less accessible
- **Breaking if changed:** Using --hx-touch-target-min-px breaks the ability to override touch targets globally via --hx-touch-target-min CSS variable, and at non-16px base font sizes the px value may not meet WCAG minimums

### Touch target enforcement uses a canonical CSS custom property `--hx-touch-target-min` (not `--hx-touch-target-min-px`) applied via `min-width`/`min-height` on interactive elements like `.nav-btn` and col-checkbox controls (2026-03-19)
- **Context:** WCAG 2.5.5 requires touch targets of at least 44x44px; multiple components (hx-carousel, hx-data-table) had interactive elements below this threshold
- **Why:** Canonical token name without `-px` suffix aligns with design token naming conventions where the unit is implied by context, preventing token proliferation and ensuring single source of truth for the touch target minimum value
- **Rejected:** Inline pixel values or per-component hardcoded sizes were rejected because they create drift risk when the design system token changes; a `-px` suffixed variant was also rejected as redundant
- **Trade-offs:** Easier: global resizing of touch targets by changing one token value; Harder: developers must know to use the canonical token name rather than deriving a px-suffixed variant
- **Breaking if changed:** If `--hx-touch-target-min` token is removed or renamed, all components referencing it silently lose touch target enforcement with no compile-time error

#### [Gotcha] Redundant `min-width`/`min-height` declarations on `input[type='checkbox']` inside hx-data-table conflicted with the higher-level col-checkbox container enforcement, requiring removal of the inner declarations (2026-03-19)
- **Situation:** Both the checkbox input element and its col-checkbox wrapper had independent touch target size rules, creating specificity and redundancy issues
- **Root cause:** Touch target sizing should be applied at the outermost interactive container, not on native input elements which have browser-default sizing behavior that can conflict
- **How to avoid:** Easier: clear single point of truth for sizing; Harder: future developers may re-add inner sizing thinking it was an omission

#### [Pattern] Inset focus rings (-2px offset) and flush focus rings (0px offset) on list options must use component-level CSS custom property overrides with hardcoded fallbacks rather than direct hardcoded values, even when the value is intentional and unlikely to change (2026-03-19)
- **Problem solved:** hx-combobox and hx-select use -2px inset rings so the outline doesn't overflow the option container; hx-menu-item uses 0px flush ring because the menu context visually requires it. Both were initially hardcoded.
- **Why this works:** Consumer customizability: downstream themes or high-contrast modes may need to adjust per-component ring offsets independently of the global --hx-focus-ring-offset token. The three-tier cascade (component override → global override → hardcoded fallback) preserves intentional defaults while exposing override surface.
- **Trade-offs:** Adds one CSS variable per component to the public API surface, increasing documentation burden; gains full consumer control and consistency with the rest of the design system

### CHANGELOG.md auto-generated by changesets must never be manually edited even when a code review tool flags it — the correct response is to reject the review comment, not patch the file (2026-03-19)
- **Context:** CodeRabbit flagged CHANGELOG.md content that arrived via a merge from origin/main predating the PR. The entries were not authored in this PR.
- **Why:** Manual edits to auto-generated files create drift between the changeset source-of-truth and the generated output. On the next changeset run the file would be regenerated, overwriting the manual edit or producing a conflict.
- **Rejected:** Accepting the review thread and patching the CHANGELOG manually: would fix the review but introduce drift and a future merge conflict
- **Trade-offs:** Rejecting the thread requires a written justification so reviewers understand why it was dismissed; avoids file drift
- **Breaking if changed:** Manually editing CHANGELOG.md breaks the changeset → changelog pipeline integrity and will cause conflicts on the next release cycle

#### [Gotcha] Focusable element selectors in trap/cycle utilities (like _getFocusableElements) diverge silently between dialog-like components over time; hx-popover and hx-dialog had different selectors despite identical UX contracts (2026-03-19)
- **Situation:** hx-popover._getFocusableElements was missing area[href] and details > summary that hx-dialog already included, meaning Tab cycling inside a popover would skip those elements
- **Root cause:** The fix aligns both components to the same selector string, reducing maintenance surface — one canonical focusable selector to update rather than two that drift
- **How to avoid:** Copy-alignment is fragile — if hx-dialog's selector is updated in the future, hx-popover must also be updated manually. The real fix is a shared focusableSelector constant.

#### [Pattern] Every component that renders a focus-visible ring must expose three CSS custom property tiers: component-level color, component-level width, component-level offset — each falling back to the global token, which falls back to a hardcoded value (2026-03-19)
- **Problem solved:** hx-popover initially had the global --hx-focus-ring-color fallback chain but was missing the component-level --hx-popover-focus-ring-color override slot, making it inconsistent with every other component modified in the same PR
- **Why this works:** The three-tier pattern (--hx-[component]-focus-ring-color → --hx-focus-ring-color → #hardcoded) lets consumers theme globally, override per-component, or fall back safely without any CSS specificity battles
- **Trade-offs:** Three CSS variables per component per ring property multiplies the token surface area; the payoff is zero-specificity consumer override at any granularity level

#### [Gotcha] Native HTML form elements (input, textarea, checkbox) with `required` attribute already map implicitly to `aria-required=true` per HTML-AAM spec. Adding explicit `aria-required` is redundant and violates the project's 'prefer native semantics' principle. (2026-03-19)
- **Situation:** GH #1030 attempted to fix missing aria-required on form controls by adding explicit aria-required attributes to native elements across 5 components.
- **Root cause:** HTML Accessibility API Mappings (HTML-AAM) spec defines that the `required` attribute on native form elements is automatically exposed as `aria-required=true` to assistive technologies without any additional ARIA markup.
- **How to avoid:** Native semantics approach is leaner and browser-maintained; downside is it's non-obvious to developers who may assume ARIA must be explicit, leading to repeat mistakes like this one.

#### [Gotcha] Shadow DOM content is invisible to `this.textContent` — only light DOM text is captured, causing AT announcements to omit shadow-rendered severity labels like 'Error:' or 'Warning:' (2026-03-19)
- **Situation:** hx-alert sr-only announcer was reading `this.textContent?.trim()` to populate the live region, but the severity prefix ('Error:', 'Warning:', etc.) is rendered inside the shadow DOM, not the light DOM
- **Root cause:** The host element's textContent only traverses assigned light DOM nodes. Shadow DOM content is encapsulated and not part of the composed text content accessible via `this.textContent` on the host
- **How to avoid:** Explicit composition is more maintainable and predictable but requires keeping the severity label map in sync between render() and updated() — a duplication risk if variants are ever added

### aria-live politeness is bound dynamically to component variant: `assertive` for error, `polite` for all others — matching the existing `_isAssertive` boolean already used for role assignment (2026-03-19)
- **Context:** Hardcoded `aria-live='polite'` on the sr-only announcer div meant error alerts (which need to interrupt AT immediately) were queued behind other announcements, causing missed or delayed announcements in healthcare contexts
- **Why:** WCAG requires assertive interruption for critical/error-level information; polite live regions are appropriate for informational/success/warning variants that should not interrupt the user's current AT reading flow
- **Rejected:** Using a single `role='alert'` element for all variants was rejected because `role='alert'` implies assertive for everything, which would cause warning/info variants to unnecessarily interrupt users — degrading the AT experience for non-critical messages
- **Trade-offs:** Dynamic `aria-live` is less common and may have edge-case browser/AT support differences; the simpler single-role approach is more widely tested but semantically wrong for non-error variants
- **Breaking if changed:** Removing the dynamic binding and reverting to hardcoded `polite` would cause error alerts to fail WCAG 4.1.3 in healthcare/critical-notification contexts where immediate interruption is required

#### [Pattern] Double-microtask flush pattern for sr-only live region updates: first microtask clears content, second microtask re-injects — guaranteeing AT sees a genuine content mutation rather than a no-op when the same message is re-announced (2026-03-19)
- **Problem solved:** AT implementations cache live region content and suppress re-announcements when content does not change. If an alert closes and re-opens with the same message, a single-step content set may be treated as a no-op
- **Why this works:** Two sequential `Promise.resolve().then()` calls create two separate microtask checkpoints. The DOM mutation from the clear fires before the re-injection, giving the AT a blank→content transition it cannot suppress as a no-op
- **Trade-offs:** Microtask double-flush is not immediately obvious to future maintainers and could be mistakenly 'simplified' to a single assignment; requires a comment explaining why both steps are necessary

#### [Pattern] Use Lit's classMap() directive instead of template literal string concatenation for conditional CSS classes in web components (2026-03-19)
- **Problem solved:** Lit components were using string interpolation like `class="list-item ${this.disabled ? 'list-item--disabled' : ''}"` which leaves trailing spaces and is harder to read/maintain when multiple conditions exist
- **Why this works:** classMap() produces cleaner DOM output (no trailing spaces), is the idiomatic Lit approach, enables better diffing by Lit's renderer since it tracks class changes as a map rather than re-evaluating the full string, and scales gracefully when adding more conditional classes
- **Trade-offs:** classMap requires an explicit import from 'lit/directives/class-map.js' and an object literal syntax instead of inline ternaries — slightly more verbose for single conditions but significantly cleaner for multiple conditions

#### [Gotcha] Components with multiple render code paths (term dt, definition dd, interactive li, default li) each require independent classMap updates — missing any one path leaves inconsistent behavior (2026-03-19)
- **Situation:** hx-list-item has 4 distinct render branches depending on component type (term, definition, interactive, non-interactive), each building the class attribute independently
- **Root cause:** Each render path returns its own template literal independently — there is no shared class-building step, so the refactor must touch every branch or the fix is incomplete and inconsistent
- **How to avoid:** More edit locations per component means higher risk of missing a path; upside is each path remains independently readable without shared state complexity

### Light DOM components (createRenderRoot returns this) must use style.setProperty() for CSS custom properties instead of styleMap directive (2026-03-19)
- **Context:** hx-prose uses Light DOM rendering, so there is no shadow root template element to bind styleMap to
- **Why:** styleMap directive binds to a template literal element in render(); Light DOM components render into the host element itself, making styleMap on a template child incorrect. setProperty feeds values through the CSS custom property cascade instead of bypassing it
- **Rejected:** styleMap on a template element - would not correctly bind to the host element's style in Light DOM; direct style.maxWidth assignment - bypasses the token/CSS custom property cascade
- **Trade-offs:** CSS custom properties allow external overrides and cascade correctly; direct style assignment has higher specificity and breaks theming
- **Breaking if changed:** Switching hx-prose back to shadow DOM would require re-evaluating this pattern; removing the CSS custom property from the stylesheet would make the property have no effect

#### [Gotcha] key=${i} attribute on Lit template elements is a React-ism with zero effect in Lit's rendering system (2026-03-19)
- **Situation:** hx-data-table skeleton rows had key=${i} attributes, presumably cargo-culted from React patterns
- **Root cause:** Lit uses its own DOM diffing via lit-html; the key attribute is not a recognized Lit directive and does not influence reconciliation or list rendering performance
- **How to avoid:** Removing it has no runtime behavior change but reduces HTML attribute noise and removes false signal

#### [Pattern] Inline style string construction (array.join('; ')) must be replaced with styleMap(Record<string,string>) for dynamic styles in Lit shadow DOM components (2026-03-19)
- **Problem solved:** hx-grid and hx-split-panel built style strings by joining arrays, which is error-prone and bypasses Lit's style binding optimizations
- **Why this works:** styleMap directive uses Lit's CSSStyleDeclaration bindings - it sets/removes individual style properties rather than replacing the entire style attribute, preventing accidental overrides of externally-set inline styles and enabling proper dirty-checking
- **Trade-offs:** styleMap requires importing the directive and using Record<string,string> return type; gains type-safety, proper incremental updates, and compatibility with other style sources

### Removed .slide-group:focus selector, keeping only .slide-group:focus-visible for carousel item focus ring (2026-03-19)
- **Context:** hx-carousel-item uses tabindex=-1 for programmatic focus from JS carousel navigation. Original code had both :focus and :focus-visible with a comment explaining that :focus-visible alone may not trigger in all browsers for programmatically focused elements.
- **Why:** Project convention standardizes on :focus-visible only. Modern browsers (Chrome 86+, Firefox 85+, Safari 15.4+) now correctly apply :focus-visible to programmatically focused elements when the user has not recently used a pointing device, aligning with expected behavior.
- **Rejected:** Keeping both :focus and :focus-visible selectors. This was the original approach specifically to handle the tabindex=-1 programmatic focus case where :focus-visible historically would not trigger.
- **Trade-offs:** Simpler, more maintainable CSS aligned with project convention. Risk: older browsers or certain assistive technology interactions may lose visible focus ring when carousel item receives focus programmatically via .focus() calls.
- **Breaking if changed:** If this change is reverted, the :focus selector must be re-added alongside :focus-visible AND the explanatory comment restored — removing the comment without the selector would leave future developers confused about the historical reason.

#### [Gotcha] Components with existing prefers-reduced-motion blocks often missed secondary/interactive child elements — close buttons, clear buttons, sort icons, chip-remove buttons required explicit transition:none even when the parent container was already covered (2026-03-19)
- **Situation:** Audit found 12 components had partial gaps: existing @media blocks covered primary animated elements but left secondary interactive elements (e.g. .drawer-close-button, .side-nav__toggle, .progress-bar__fill for deterministic state) without overrides
- **Root cause:** CSS specificity and selector scope mean a parent element having transition:none does NOT cascade to children that have their own transition declarations — each element with a CSS transition property needs its own override inside the media query
- **How to avoid:** More verbose CSS but precise control; audit tooling (grep for transition:/animation: without matching prefers-reduced-motion in same file) becomes the enforcement mechanism

#### [Pattern] The audit strategy was: grep all *.styles.ts for files containing transition: or animation: but NOT containing prefers-reduced-motion, giving a definitive zero-false-positive list of violating files (2026-03-19)
- **Problem solved:** 17 components needed fixes across a large component library — manual audit would be error-prone and miss files
- **Why this works:** Shell one-liner using grep -rl for positive match then filtering with ! grep -q for negative match produces an exact diff set; deterministic and repeatable as new components are added
- **Trade-offs:** Grep-based audit is fast but only catches files with NO block at all; partial gaps (missing selectors within an existing block) require a second-pass human review of each file — this was the harder problem in this feature

### For hx-progress-bar, the deterministic (non-indeterminate) fill transition:none was added separately from the existing indeterminate animation:none block rather than consolidating into one selector (2026-03-19)
- **Context:** hx-progress-bar had an existing reduced-motion block for the indeterminate animation case (animation: none; width: 100%; opacity: 0.4) but was missing transition:none for the normal fill width transition
- **Why:** The indeterminate state requires fallback visual values (width:100%, opacity:0.4) to remain visible when animation is disabled — merging selectors would require those fallback properties on the deterministic fill too, which are incorrect for that state
- **Rejected:** Combining .progress-bar__fill and .progress-bar--indeterminate .progress-bar__fill into one block — rejected because the fallback opacity/width values only make sense for indeterminate state and would incorrectly override the data-driven width on the standard fill
- **Trade-offs:** Two separate rules inside the media query is slightly more verbose but semantically correct; each selector carries only the properties appropriate to its state
- **Breaking if changed:** Merging these would cause the normal progress bar fill to display at 100% width with reduced opacity regardless of actual progress value when reduced-motion is enabled

#### [Pattern] Replace max-height transitions with CSS grid 0fr/1fr pattern for expand/collapse animations (nav-item children, accordion, tree-item) (2026-03-19)
- **Problem solved:** max-height transitions require guessing or hardcoding a max value — too small clips content, too large creates slow/janky easing because the transition runs the full max-height range even if actual content is short
- **Why this works:** CSS grid row height transitioning from 0fr to 1fr is content-aware, compositable-friendly, and eliminates the need for JS height measurement or arbitrary max-height values
- **Trade-offs:** Easier: natural easing relative to actual content size, no magic numbers. Harder: requires an inner wrapper element (nav-item__children-inner) with overflow: hidden; grid layout cannot be applied to elements that also need display:block/flex semantics directly

#### [Gotcha] Shadow DOM internal elements require el.shadowRoot!.querySelector() inside play functions — standard canvas querySelector misses slotted/internal content (2026-03-19)
- **Situation:** hx-nav and other Web Components render interactive elements inside shadow DOM; play functions targeting these elements fail if querying from document root
- **Root cause:** Shadow DOM creates an encapsulated subtree; Storybook's canvas root cannot pierce it with standard querySelector
- **How to avoid:** Direct shadowRoot access works but couples tests to internal DOM structure; changes to shadow DOM markup break play functions

### Custom form element formResetCallback must capture _defaultValue in firstUpdated() not in the constructor or connectedCallback, because property values set via HTML attributes/bindings are not yet reflected at construction time (2026-03-19)
- **Context:** hx-rating was hardcoding 0 in formResetCallback instead of restoring the original authored value, breaking native form reset behavior for any rating component initialized with a non-zero value
- **Why:** firstUpdated() fires after the first render when all reflected properties have been resolved from attributes and declarative bindings; constructor fires before attribute upgrade, connectedCallback may fire before LitElement property reflection completes
- **Rejected:** Capturing in constructor — rejected because property initializers from HTML (e.g. value='3') haven't been applied yet. Capturing in connectedCallback — rejected because element may reconnect mid-session with a different value
- **Trade-offs:** Correctly mirrors native input reset semantics; requires understanding LitElement lifecycle ordering to maintain
- **Breaking if changed:** Moving _defaultValue capture to constructor causes formResetCallback to always reset to the TypeScript class default (0), ignoring the authored initial value