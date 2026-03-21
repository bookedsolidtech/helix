---
tags: [security]
summary: security implementation decisions and patterns
relevantTo: [security]
importance: 0.7
relatedFiles: []
usageStats:
  loaded: 203
  referenced: 89
  successfulFeatures: 89
---
# security

#### [Gotcha] vite-plugin-dts transitively pulls in @microsoft/api-extractor → minimatch@10.2.1 vulnerability; removing it and using tsc --emitDeclarationOnly eliminates the entire vulnerability chain (2026-03-05)
- **Situation:** Adding vite-plugin-dts for type declaration generation introduced a high-severity npm audit finding that blocked the pre-commit hook
- **Root cause:** tsc --emitDeclarationOnly produces identical .d.ts output for a pure TypeScript config package with no framework-specific emit needs; vite-plugin-dts adds value only when declaration map merging or entry-point remapping is required
- **How to avoid:** Simpler dep graph and zero audit findings; lose vite-plugin-dts features (declaration maps, rollup integration for complex multi-entry packages) — acceptable for a single-entry config package

#### [Gotcha] Pre-commit hook severity threshold diverged from CI config after a prior commit changed CI to --severity-threshold=critical while the hook stayed at high; this silently blocks commits on pre-existing dev-only vulns that CI already accepts (2026-03-05)
- **Situation:** Pre-commit hook was failing on transitive high-severity dev dependencies with no production exposure, but CI had already been explicitly relaxed to critical for this exact reason
- **Root cause:** Hook threshold must mirror CI threshold exactly — otherwise the pre-commit gate creates a false-positive barrier that CI would pass, forcing developers to choose between bypassing hooks or reverting legitimate CI policy decisions
- **How to avoid:** Consistent developer experience matching CI; risk is that a high-severity production dep could slip past pre-commit, but audit still runs in CI so it's caught before merge

#### [Gotcha] SVG sanitization must strip on* event attributes from the root <svg> element itself, not just child elements, and must remove <foreignObject> entirely while blocking javascript:/data: URIs in href/xlink:href/src attributes (2026-03-05)
- **Situation:** Fetching remote SVG icons and injecting innerHTML creates XSS vectors; naive sanitizers that only check child nodes miss the root element and exotic embedding vectors
- **Root cause:** Root <svg> can carry onload= or other event handlers that execute immediately on innerHTML injection; <foreignObject> can embed arbitrary HTML; javascript: URIs in href bypass content filtering
- **How to avoid:** More thorough sanitization catches more attack vectors but adds processing overhead per fetch

### SVG sanitizer uses querySelectorAll('script, foreignObject').forEach with block-bodied callback to remove dangerous elements before inlining SVG into Shadow DOM (2026-03-05)
- **Context:** Biome lint rule lint/suspicious/useIterableCallbackReturn flags expression-bodied forEach callbacks as suspicious (implicit undefined return)
- **Why:** Block-bodied forEach is semantically explicit about side-effect-only intent; expression body implies a return value is meaningful, which is misleading for removal operations
- **Rejected:** Expression-bodied arrow: (s) => s.remove() — rejected because Biome flags it as a lint error blocking npm run verify
- **Trade-offs:** Slightly more verbose but unambiguous intent; eliminates a real lint gate failure
- **Breaking if changed:** Reverting to expression body re-introduces Biome lint/suspicious/useIterableCallbackReturn error, blocking CI

### CSS token fallback values (e.g., var(--hx-size-6, 1.5rem)) are intentional defensive programming in component styles, not to be removed (2026-03-05)
- **Context:** PR review questioned rem fallback values in hx-icon .styles.ts as redundant if design tokens are always present
- **Why:** Tokens may not be loaded (CDN failure, token sheet not imported, SSR), causing zero-size icons without fallbacks. Fallbacks ensure graceful degradation.
- **Rejected:** Removing fallbacks — rejected because it makes component rendering dependent on token CSS loading, causing invisible (0px) icons in token-absent environments
- **Trade-offs:** Slightly more verbose CSS; but component is resilient to token loading failures
- **Breaking if changed:** Removing fallbacks causes zero-size icons whenever the token CSS sheet fails to load or hasn't been imported

#### [Gotcha] hx-nav renders NavItem.href directly into <a href> without protocol validation, creating an XSS vector via javascript: URIs (2026-03-05)
- **Situation:** NavItem interface accepts arbitrary string href; component trusts consumer input completely
- **Root cause:** Web components often assume trusted consumer context, but library components are consumed across teams and CMS integrations where data may originate from user input or untrusted CMS fields
- **How to avoid:** Sanitizing to http/https/relative breaks legitimate use of mailto:, tel:, data: URIs unless explicitly allowlisted

#### [Gotcha] `target="_blank"` on anchor-mode buttons without `rel="noopener noreferrer"` exposes reverse tabnapping — opened page can access `window.opener` and redirect the parent tab (2026-03-06)
- **Situation:** Anchor-mode rendering in button components that support `target` attribute
- **Root cause:** The `target` attribute is a passthrough from the component API — developers naturally pass `target="_blank"` without knowing the component must inject the `rel` attribute to be safe
- **How to avoid:** Injecting `rel="noopener noreferrer"` automatically is correct but technically overrides any consumer-supplied `rel` value — needs merge logic if consumers also need `rel` for other reasons

### Suppressed <a> href rendering entirely when hx-list-item is in interactive (listbox) mode (2026-03-07)
- **Context:** ARIA spec prohibits interactive elements (links, buttons) inside role=option. An <a> inside role=option creates an invalid ARIA pattern and can cause AT to announce the item twice or skip the link entirely
- **Why:** When interactive=true, the host element itself is the interactive control (role=option, keyboard-focusable). Adding a nested <a> creates redundant tab stops and violates ARIA authoring practices 1.1
- **Rejected:** Rendering the <a> but removing tabindex=-1 — still produces invalid ARIA (role=option cannot own role=link per ARIA spec ownership rules). Also considered warning-only approach without suppression, but that leaves broken markup in production.
- **Trade-offs:** href data is silently dropped in interactive mode — no visual indicator. Could surprise developers who set both interactive and href. Mitigated by the label warning pattern — could add similar dev-mode warning for ignored href.
- **Breaking if changed:** Re-enabling href in interactive mode produces invalid ARIA that fails automated accessibility audits (axe-core rule aria-required-children) and breaks screen reader announcement

#### [Gotcha] role='alert' and aria-live='polite' are mutually conflicting — role='alert' implies aria-live='assertive', so an explicit aria-live='polite' overrides the implicit value and creates contradictory announcement semantics (2026-03-07)
- **Situation:** hx-textarea error div had both role='alert' and aria-live='polite'. The explicit aria-live='polite' wins over the implicit assertive from role='alert', causing screen readers to politely queue the error instead of immediately announcing it — the opposite of intended error announcement behavior
- **Root cause:** HTML-AAM specifies that role='alert' has an implicit aria-live='assertive'. An explicit aria-live on the same element overrides the implicit value. This means the 'polite' override defeats the purpose of using role='alert'
- **How to avoid:** Removing aria-live makes the ARIA semantics implicit rather than explicit, which requires understanding of role mappings; however it is the correct spec-compliant approach

### External picsum.photos image URLs removed from all Storybook stories and replaced with local or data-URI placeholders (2026-03-09)
- **Context:** Healthcare deployment environments operate air-gapped or with strict CSP that blocks external image domains; stories with external URLs fail silently (broken images) or loudly (CSP violations) in those environments
- **Why:** Component libraries used in regulated healthcare must work offline and under strict CSP by default; external demo assets are a deployment blocker that is invisible in standard dev environments
- **Rejected:** Adding picsum.photos to CSP allowlist in Storybook config — doesn't solve the air-gap case and pushes an environment-specific workaround into shared config
- **Trade-offs:** Local placeholder images are less visually realistic in stories; teams must supply their own realistic demo content
- **Breaking if changed:** Re-adding external URLs to stories will cause silent failures in air-gapped CI environments and CSP-enforced staging environments with no obvious error

### Replaced Math.random() with crypto.randomUUID() for generating unique element IDs (2026-03-09)
- **Context:** hx-field generates unique IDs for aria-describedby linkage between label, control, help text, and error elements. Math.random() has weak entropy (~53 bits) and is not cryptographically unpredictable
- **Why:** crypto.randomUUID() provides 122 bits of cryptographic randomness (RFC 4122 v4 UUID). For ID generation in DOM contexts, collisions with Math.random() are unlikely but not impossible in large apps with many field instances; UUID eliminates this risk entirely
- **Rejected:** Incrementing counter (fieldId++) — rejected because counter-based IDs are predictable and not stable across server/client rendering hydration scenarios; UUID works in both contexts
- **Trade-offs:** crypto.randomUUID() is slightly more verbose and requires the Web Crypto API (available in all modern browsers and Node 15+); trade-off is negligible
- **Breaking if changed:** Reverting to Math.random() reintroduces collision risk in large apps and predictable IDs

### SVG sanitizer must strip style attributes in addition to script tags and event handlers — style attributes are a valid CSS injection vector (e.g. expression(), url() data URIs, @import) (2026-03-09)
- **Context:** Audit found hx-icon's sanitizer blocked <script> but passed through style="background:url(javascript:...)" and similar CSS-based XSS vectors on fetched inline SVGs
- **Why:** Inline SVGs are fetched from arbitrary sprite-url endpoints; if that endpoint is compromised or misconfigured, style attributes become an injection surface that bypasses script-only sanitizers
- **Rejected:** Allowlist specific style properties — too complex to maintain correctly; DOMPurify — adds a large dependency for a small component
- **Trade-offs:** Stripping all style attributes may break intentionally styled SVG artwork; acceptable trade-off since hx-icon is a UI icon component not a general SVG renderer
- **Breaking if changed:** Removing style-strip from sanitizer re-opens CSS injection for any inline SVG source

### Adding explicit role=status to aria-live regions is required for unambiguous AT semantics — implicit aria-live without role is handled inconsistently by older screen readers (2026-03-09)
- **Context:** The hx-carousel live region announced slide position changes via aria-live=polite but lacked an explicit role. CodeRabbit flagged this as an accessibility gap.
- **Why:** ARIA spec allows implicit live region roles but older AT implementations (JAWS pre-2019, NVDA pre-2020) do not reliably announce implicit polite regions. role=status is the explicit semantic that maps directly to aria-live=polite with a defined AT behavior contract.
- **Rejected:** role=alert — rejected because alert implies urgency and interrupts user flow. Carousel position changes are not urgent. role=log — rejected because it implies sequential accumulation, not replacement announcements.
- **Trade-offs:** Adding role=status makes AT behavior predictable across the broadest range of screen readers. No functional downside. The only trade-off is marginally more verbose markup.
- **Breaking if changed:** Removing role=status degrades accessibility for users on older AT stacks without breaking modern screen readers — a silent regression that won't appear in automated a11y test suites using modern browser AT simulation

#### [Pattern] hx-icon implements XSS sanitization on SVG content at the component level, not deferred to consumers (2026-03-09)
- **Problem solved:** SVG icons loaded dynamically (e.g., from a registry or external source) can contain malicious script payloads; if sanitization is left to consumers it will be inconsistently applied
- **Why this works:** Centralizing sanitization in the component guarantees every render path is protected regardless of how the component is used or what data is passed to it
- **Trade-offs:** Component is heavier and has a sanitization dependency, but security posture is consistent and auditable in one place

### rel="noopener noreferrer" is set automatically by the component when target="_blank" — consumers cannot forget it (2026-03-10)
- **Context:** Tab-napping attack: a page opened via target=_blank gets a reference to the opener via window.opener and can redirect it to a phishing page
- **Why:** Automating the security attribute at the component level eliminates an entire class of misconfiguration. The consumer declares intent (open in new tab) and security is handled as a consequence, not a separate concern.
- **Rejected:** Documenting the requirement and relying on consumers to set rel manually — audit history across dozens of Drupal templates and SPAs shows this is consistently forgotten
- **Trade-offs:** Easier: zero-configuration security for all external links. Harder: consumers who intentionally need opener access (rare same-origin popup flows) must fork or override at a lower level
- **Breaking if changed:** Removing the auto-rel logic re-exposes all target=_blank links to tab-napping; changing it to only warn (lint rule) moves the burden back to consumers

### hx-icon applies SVG sanitization before injecting fetched SVG content into the DOM, specifically to prevent XSS via malicious sprite/inline SVG sources (2026-03-11)
- **Context:** The component accepts a `src` property for inline SVG fetching and a `sprite-url` for sprite sheets — both are external URLs whose content cannot be trusted
- **Why:** SVG can contain `<script>` tags, `onload` handlers, `<foreignObject>` with HTML, and `href` javascript: links. Sanitizing before `innerHTML` assignment prevents script injection even if the CDN or asset server is compromised
- **Rejected:** Trusting the source URL's origin as safe — CORS same-origin doesn't guarantee content safety if the origin itself serves attacker-controlled files
- **Trade-offs:** Sanitization adds a parsing step per fetch but the module-level cache means it only runs once per unique URL; some legitimate SVG features (e.g., `<use>` cross-document references) may be stripped
- **Breaking if changed:** Removing sanitization re-opens XSS attack surface for any consumer passing untrusted URLs to `src` or `sprite-url`

#### [Pattern] Story templates for link components should explicitly document `rel='noopener noreferrer'` even when the component auto-applies it for `target='_blank'` (2026-03-13)
- **Problem solved:** hx-button link stories lacked `rel` attribute in story templates despite the component auto-applying the security attribute
- **Why this works:** Stories serve as living documentation. Developers copy story templates as usage examples. Without explicit `rel` in the template, consumers who fork or adapt the pattern outside the component (plain anchors, other frameworks) omit the security attribute. The story becomes misleading documentation.
- **Trade-offs:** Slightly more verbose story templates; gains: security requirement is visible and educational, copy-paste safe for developers adapting the pattern

### In healthcare Twig templates, never use `| raw` for user-supplied slot content — auto-escaping is the correct default even when documentation describes the field as 'HTML markup' (2026-03-13)
- **Context:** hx-split-button.twig icon field was documented as accepting 'Icon slot HTML markup', implying callers should pass raw HTML, but `{{ item.icon }}` without `| raw` auto-escapes it — the docs and behavior were contradictory
- **Why:** XSS risk in healthcare context is unacceptable. The correct fix is to update the documentation to match the safe behavior, not to add `| raw` to match the misleading docs. Callers should pass icon class names or text tokens, not HTML strings.
- **Rejected:** Adding `| raw` to match documentation — introduces XSS vector; rejected because security > API convenience
- **Trade-offs:** Callers cannot pass HTML icon markup directly; they must use supported text/token values. This is a breaking API change in documentation only — behavior was always escaping.
- **Breaking if changed:** If `| raw` were added to match old docs, any caller passing untrusted content could inject HTML/JS into rendered output