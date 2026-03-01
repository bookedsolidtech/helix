# Audit Report: wc-2026 (apps/docs)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: apps/docs/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

- **[SECURITY] Vercel API token committed to git via unguarded .env.local**
  - File: `apps/docs/.env.local:10`
  - Impact: Credential exposure. The token `vcp_1Nb4zesMHVDtft3qtcWtGXUeTs7sE2nwzqYKiYcmbYg2FQ37a52szwxD` grants Vercel API access. The docs-level `.gitignore` excludes `.env` and `.env.production` but NOT `.env.local`, so git tracked the file.
  - Evidence: `HELIX_VERCEL_TOKEN=vcp_1Nb4zesMHVDtft3qtcWtGXUeTs7sE2nwzqYKiYcmbYg2FQ37a52szwxD` confirmed tracked via `git ls-files`.
  - Fix: Immediately rotate the token in the Vercel dashboard. Run `git filter-repo --path apps/docs/.env.local --invert-paths` to scrub history. Add `.env*.local` to `apps/docs/.gitignore`. Store the token as a GitHub Actions secret and Vercel environment variable only.

- **[SECURITY] No security headers configured in vercel.json**
  - File: `apps/docs/vercel.json:5`
  - Impact: Site is vulnerable to clickjacking (no X-Frame-Options), MIME sniffing attacks (no X-Content-Type-Options), protocol downgrade attacks (no HSTS), and XSS amplification (no CSP). Only `X-Robots-Tag` is set.
  - Evidence: The entire `headers` block contains a single `X-Robots-Tag: noindex, nofollow` rule. X-Frame-Options, Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are all absent.
  - Fix: Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Defer CSP until the inline scrollspy script (Finding 19) is extracted to a static file.

- **[SEO] robots.txt blocks all search engine crawlers site-wide**
  - File: `apps/docs/public/robots.txt:2`
  - Impact: The entire documentation site is invisible to search engines. No pages are indexed. Enterprise teams cannot discover the component library via web search.
  - Evidence: `User-agent: *` / `Disallow: /` — complete crawl block confirmed. Combined with `X-Robots-Tag: noindex, nofollow` in vercel.json, indexing is double-blocked.
  - Fix: If the site is intended to be public, change `Disallow: /` to `Disallow:` (empty = allow all). If intentionally private for now, document this decision explicitly in the file with a comment and a planned public date.

- **[DEPLOYMENT] No automated release or npm publish workflow exists**
  - File: `.github/workflows/` (directory)
  - Impact: The CLAUDE.md release process describes changesets-based automated publishing, but no workflow implements it. Package versions are never published to npm automatically. Releases require manual intervention and are error-prone.
  - Evidence: Only `ci.yml` and `ci-matrix.yml` exist. Neither contains a publish step, changeset release step, or Vercel deploy step.
  - Fix: Create `.github/workflows/release.yml` using `changesets/action` to automate version bumps and `npm publish` on push to `main`.

- **[TYPE_SAFETY] Missing strict TypeScript flags in docs tsconfig.json**
  - File: `apps/docs/tsconfig.json:1`
  - Impact: The docs app does not enforce `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, or `noFallthroughCasesInSwitch` — all required by the monorepo's `tsconfig.base.json`. Several runtime bugs in this audit exist specifically because these flags are inactive.
  - Evidence: `tsconfig.json` only extends `astro/tsconfigs/strict` and adds `baseUrl`/`paths`. It does not extend `tsconfig.base.json` or declare the four additional strict flags.
  - Fix: Add `"noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true, "noImplicitReturns": true, "noFallthroughCasesInSwitch": true` to `compilerOptions` in `apps/docs/tsconfig.json`.

- **[CODE_QUALITY] Header.astro (2,340 lines) and SiteNavbar.astro (2,297 lines) are ~90% duplicate**
  - File: `apps/docs/src/components/Header.astro:1` and `apps/docs/src/components/SiteNavbar.astro:1`
  - Impact: Any change to the mega-menu structure, showcase pages list, or dropdown styles must be made in two places and will inevitably drift. The `showcasePages` data array (6 objects, ~60 lines) is copy-pasted verbatim in both files. Both internal `<style>` blocks are ~2,000 lines each with identical rules.
  - Evidence: Both files contain identical 24 star `<div>` elements (decorative), identical DNA helix markup, identical `showcasePages` constants, and near-identical CSS blocks. `wc -l` confirms 2,340 and 2,297 lines respectively.
  - Fix: Extract `showcasePages` to `src/data/showcase-pages.ts`. Extract the mega-panel HTML to `ShowcaseMegaPanel.astro`. Extract shared styles to `src/styles/dropdown.css`. Both components then become <200 lines.

- **[CODE_QUALITY] StatsBar.astro hardcodes http://localhost:3159 as the Admin Dashboard link**
  - File: `apps/docs/src/components/StatsBar.astro:73`
  - Impact: Every user who clicks "Admin Dashboard" in the stats bar on the production documentation site receives a broken link to their local machine. This is a live production defect.
  - Evidence: `docsUrl: 'http://localhost:3159'` — hardcoded in the component's stats data array, rendered into a `<a>` tag inside a modal dialog.
  - Fix: Replace with `import.meta.env.PUBLIC_ADMIN_URL ?? 'https://admin.helix.example.com'` or remove the link for public builds.

- **[CODE_QUALITY] Hero.astro uses NEXT*PUBLIC* env prefix (Next.js only) — Storybook link always serves localhost:3151**
  - File: `apps/docs/src/components/Hero.astro:19`
  - Impact: Every visitor to the production docs site who clicks "View Storybook" receives an HTTP link to `localhost:3151` — a broken link to their own machine. The env variable can never be populated by Astro's build pipeline.
  - Evidence: `const storybookUrl = import.meta.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL ?? 'http://localhost:3151'` — `NEXT_PUBLIC_` is a Next.js convention; Astro requires `PUBLIC_` prefix for client-exposed variables.
  - Fix: Rename to `PUBLIC_HELIX_STORYBOOK_URL` in `.env.local`, Vercel environment variables, and `Hero.astro:19`. Change the fallback to the actual production Storybook URL.

- **[TESTING] Zero test infrastructure configured for the docs app**
  - File: `apps/docs/package.json:1`
  - Impact: The docs app contains custom TypeScript utilities that power every component API reference table, a custom HTMLElement used on every page, and client-side JavaScript with complex interaction logic. None of it is tested. Bugs ship silently.
  - Evidence: `package.json` has no `test` script. No `vitest.config.*` exists. The Turborepo `test` pipeline excludes `apps/docs`. The root Playwright config targets port 3151 (Storybook), not 3150 (docs).
  - Fix: Add Vitest for `src/lib/` utilities. Add a `test` script to `package.json`. Register the workspace in Turborepo's test pipeline. Create a separate Playwright project targeting `http://localhost:3150` for E2E coverage.

- **[TESTING] wc-input event listener never fires — active production defect after hx- migration**
  - File: `apps/docs/src/components/gallery/GalleryScript.astro:79`
  - Impact: The Component Genome page's gallery search does not clear category filters when a user types. The category filter clearing logic at lines 82–84 is silently dead. This regression was introduced by the `wc-` → `hx-` event prefix migration (commit `c643de6`) but was not caught because there are no tests.
  - Evidence: `searchInput.addEventListener('wc-input', ...)` — the library dispatches `hx-input` (confirmed in `hx-text-input.ts:228`: `new CustomEvent('hx-input', ...)`). The old `wc-input` name is never dispatched.
  - Fix: Change `'wc-input'` to `'hx-input'` on line 79 of `GalleryScript.astro`. Add an E2E test that types into the search input and confirms category filter clearing executes.

- **[ACCESSIBILITY] All StatsBar modal dialogs have broken aria-labelledby (target IDs don't exist)**
  - File: `apps/docs/src/components/StatsBar.astro:105`
  - Impact: Every stats bar dialog is announced to screen readers with no accessible name. The `aria-labelledby` attribute references `stat-modal-title-${i}` but no element in the modal has that id. All screen reader users receive an unlabelled dialog.
  - Evidence: `aria-labelledby={`stat-modal-title-${i}`}` — no element with `id="stat-modal-title-0"` (or any index) exists anywhere in the component template.
  - Fix: Add `id={`stat-modal-title-${i}`}` to the `<div>` containing `{stat.label}` at line 120. Simultaneously wrapping it in an `<h2>` or `<h3>` would also fix the heading structure.

- **[ACCESSIBILITY] PageTitle.astro source-path copy pill is a div+onclick — completely keyboard inaccessible**
  - File: `apps/docs/src/components/PageTitle.astro:11`
  - Impact: The source-path copy control appears on every Starlight documentation page. Keyboard-only users, switch-access users, and screen reader users cannot activate it. It has no `role`, no `tabindex`, no keyboard handler.
  - Evidence: `<div class="source-path" id="source-path-pill" onclick={`...48 lines of interpolated JS...`}>` — a `<div>` with an `onclick` attribute and no ARIA semantics.
  - Fix: Replace the `<div>` with `<button type="button" aria-label="Copy source path">`. Move the 48-line onclick string to a `<script>` block using `addEventListener`.

- **[PERFORMANCE] ComponentLoader eagerly imports all 13 library components (171 KB) on every docs page**
  - File: `apps/docs/src/components/ComponentLoader.astro:13`
  - Impact: A user visiting the `hx-button` documentation page downloads and parses 12 additional component definitions they will never use. The built output is 171 KB (30 KB gzipped).
  - Evidence: 13 static `import` statements for all library components in a single `<script>` block. This file is included in 30 MDX pages including single-component pages like `hx-button.mdx`.
  - Fix: Replace the monolithic loader with per-page targeted imports. Each MDX page imports only the component(s) it demonstrates. The `/component-genome/` page that needs all 13 can retain the full list.

- **[PERFORMANCE] 172 KB global CSS (custom.css, 3,873 lines) loaded on every documentation page**
  - File: `apps/docs/src/styles/custom.css:1` / `apps/docs/astro.config.mjs:52`
  - Impact: Simple documentation pages like `getting-started/installation` receive the full hero, particle, glassmorphic, and animation CSS payload. Repeat visitors cannot benefit from caching this alongside more frequently-changing page content.
  - Evidence: `custom.css` is 85,589 bytes injected globally via `astro.config.mjs:52` (`customCss: ['./src/styles/custom.css']`). The built CSS bundle totals 172 KB raw / 30 KB gzipped.
  - Fix: Split into layers: hero/splash rules → `home-hero.css` (imported only on index page); showcase rules → `showcase.css` (already partially started in `src/styles/showcase/`). Keep only truly global resets/tokens in `custom.css`.

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

- **[SECURITY] DOM XSS pattern in PageTitle.astro onclick handler**
  - File: `apps/docs/src/components/PageTitle.astro:11`
  - Impact: The `filePath` variable is interpolated directly into a template literal that becomes an `onclick` attribute string. A content file with special characters in its path (e.g., a quote or parenthesis) can break out of the JS context. Safe today; dangerous as a pattern.
  - Evidence: `onclick={`(function(el) { var path = '${filePath}'; ... })(this)`}` — `filePath` is `route.entry.id` joined with a prefix string, unescaped.
  - Fix: Replace inline onclick with a `<script>` block using `addEventListener`. Pass `filePath` via a `data-filepath` attribute: `<button data-filepath={filePath}>`. Read it in JS via `el.dataset.filepath`.

- **[SEO] Missing og:image and twitter:image on all pages**
  - File: `apps/docs/astro.config.mjs:42`
  - Impact: When any documentation page is shared on LinkedIn, Twitter/X, Slack, or other platforms, no image preview appears. The share card shows only text against a blank background, significantly reducing click-through rates.
  - Evidence: Starlight config defines `title` and `description` but no `og:image` or `twitter:image`. Verified in built `dist/index.html`: og:title, og:description, og:url, og:locale present — og:image completely absent.
  - Fix: Add to the `head` array in Starlight config: `{ tag: 'meta', attrs: { property: 'og:image', content: 'https://wc-2026.dev/og-image.png' } }` and the Twitter equivalent. Create a branded OG image asset.

- **[DEPLOYMENT] Docs app excluded from CI pipeline (astro check never runs in CI)**
  - File: `.github/workflows/ci.yml:1`
  - Impact: TypeScript errors in `.astro` files and Astro-specific type violations go undetected until a developer runs `astro check` locally. The docs app can have failing type checks committed to `main`.
  - Evidence: `ci.yml` runs `turbo build` which invokes `astro check && astro build` for the docs, but only as a build step — not as a separate gated type-check step. The `type-check` pipeline task in Turborepo only covers `packages/hx-library`.
  - Fix: Add an explicit `npm run type-check:docs` step to `ci.yml` that runs `astro check` in isolation, separate from the build step.

- **[DEPLOYMENT] Turborepo remote cache not configured — every CI run rebuilds from scratch**
  - File: `.github/workflows/ci.yml:1` / `turbo.json:1`
  - Impact: Every CI run performs a full cold build of the entire monorepo regardless of what changed. Build times are maximized, wasting CI minutes and slowing developer feedback loops.
  - Evidence: `turbo.json` has no `remoteCache` configuration. Neither workflow file references `TURBO_TOKEN` or `TURBO_TEAM` environment variables.
  - Fix: Add `TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}` and `TURBO_TEAM: ${{ secrets.TURBO_TEAM }}` to the `ci.yml` env block. Configure the tokens via Vercel dashboard Remote Cache.

- **[DEPLOYMENT] Inline scrollspy script in astro.config.mjs prevents CSP enforcement**
  - File: `apps/docs/astro.config.mjs:95`
  - Impact: The 75-line inline scrollspy script injected via `{ tag: 'script', content: ... }` requires `'unsafe-inline'` in the Content-Security-Policy, making the entire CSP substantially weaker. This blocks the security headers fix (Finding 2) from being maximally effective.
  - Evidence: 75-line `(function() { ... })()` IIFE injected as an inline script in every page's `<head>`. No nonce or hash is set.
  - Fix: Extract to `public/scrollspy.js` and reference as `{ tag: 'script', attrs: { src: '/scrollspy.js', defer: true } }`. This enables a strict `script-src 'self'` CSP.

- **[ACCESSIBILITY] StatsBar modal dialogs missing focus trap — keyboard escapes to background**
  - File: `apps/docs/src/components/StatsBar.astro:150`
  - Impact: When a keyboard user opens a stats modal, Tab moves focus past the close button and into the obscured background document, violating WCAG 2.1 SC 2.1.2 and the ARIA dialog pattern. Users cannot stay within the dialog by keyboard alone.
  - Evidence: `closeBtn?.focus()` on open is correct, but there is no event listener intercepting Tab/Shift+Tab to cycle within the modal's focusable descendants.
  - Fix: Implement a focus trap in the open handler, or replace the `<div role="dialog">` with a native `<dialog>` element which provides built-in focus trapping in all modern browsers.

- **[ACCESSIBILITY] Token Explorer tablist missing arrow key navigation and roving tabindex**
  - File: `apps/docs/src/pages/token-explorer.astro:553`
  - Impact: Keyboard users cannot navigate between tabs using Arrow keys as required by the ARIA Authoring Practices Guide (APG) tab pattern. All inactive tabs are in the tab order, forcing Tab-through rather than Arrow navigation. The `TabSwitchScript.astro` component implements this correctly but is not used here.
  - Evidence: The inline tab script at line 964 handles only `click` events. No `ArrowLeft`, `ArrowRight`, `Home`, or `End` handling. No `tabindex="-1"` on inactive tabs.
  - Fix: Add arrow key + roving tabindex logic matching the APG keyboard pattern. Use `TabSwitchScript.astro` or replicate its implementation.

- **[ACCESSIBILITY] Token Explorer copy rows are div+click — keyboard inaccessible**
  - File: `apps/docs/src/pages/token-explorer.astro:606`
  - Impact: Dozens of token copy rows are `<div>` elements with JavaScript click listeners. They are invisible to keyboard navigation, have no `role`, and cannot be activated without a pointer device. Every design token in the explorer is inaccessible to keyboard users.
  - Evidence: `<div class="te-copy-row" data-copy={t.tokenPath} title={...}>` — no `role`, no `tabindex`, no keyboard handler. JavaScript click listener attached in the inline script at line 986.
  - Fix: Replace each `<div class="te-copy-row">` with `<button type="button" class="te-copy-row" aria-label={`Copy token: ${t.tokenPath}`}>`.

- **[ACCESSIBILITY] Gradient text (-webkit-text-fill-color: transparent) is invisible in Windows High Contrast Mode**
  - File: `apps/docs/src/components/GalleryBanner.astro:154` and multiple files
  - Impact: Users who rely on Windows High Contrast Mode (a common accessibility accommodation for low-vision users) see completely invisible headline text wherever gradient text is used. This affects the primary headings on showcase pages.
  - Evidence: `-webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text` pattern appears in `GalleryBanner.astro:154`, `SiteNavbar.astro:413`, `Header.astro:1745`, `A11yBusinessCase.astro:115,124,133,142`, and other showcase pages. No `@media (forced-colors: active)` override exists in any file.
  - Fix: Add `@media (forced-colors: active) { .gradient-text { -webkit-text-fill-color: ButtonText; background: none; } }` to each affected component.

- **[TYPE_SAFETY] topBtn dereferenced without null guard in component-genome.astro**
  - File: `apps/docs/src/pages/component-genome.astro:542`
  - Impact: `document.getElementById` returns `HTMLElement | null`. Both `topBtn.classList.add()` and `topBtn.addEventListener()` are called without a null check. This crashes with a TypeError if the element is absent (e.g., during hydration timing, template refactoring, or SSR scenarios).
  - Evidence: `var topBtn = document.getElementById('back-to-top'); ... topBtn.classList.add('visible')` — no null guard between the assignment and the dereference.
  - Fix: Add `if (!topBtn) return;` immediately after the `getElementById` call.

- **[TYPE_SAFETY] Starlight virtual modules typed as JSX.Element instead of AstroComponentFactory**
  - File: `apps/docs/src/env.d.ts:17`
  - Impact: TypeScript will not flag incorrect usage of Starlight's overridden components (Search, LanguageSelect, SiteTitle, etc.) since they are typed as rendered values, not callable components. Prop-type errors in component usage go undetected at compile time.
  - Evidence: `declare module 'virtual:starlight/components/Search' { const Search: astroHTML.JSX.Element; }` — `astroHTML.JSX.Element` is a rendered expression type, not a component factory type.
  - Fix: Import `AstroComponentFactory` from `'astro/runtime/server/index.js'` and use it as the type for all five virtual module declarations.

- **[TYPE_SAFETY] Unsafe as CemManifest cast on JSON import in cem-utils.ts**
  - File: `apps/docs/src/lib/cem-utils.ts:129`
  - Impact: If the CEM format changes after `npm run cem` regenerates the manifest, no compile-time error occurs. Runtime errors surface only when rendering API tables for all 14 component documentation pages.
  - Evidence: `const manifest = cemJson as CemManifest;` — `cemJson` is typed as `unknown` from the JSON import; the cast bypasses structural validation entirely.
  - Fix: Implement a type guard `isCemManifest(v: unknown): v is CemManifest` that validates `schemaVersion` and `modules` array presence before the cast.

- **[PERFORMANCE] orb-pulse keyframe animates filter:blur() on 4 hero elements — continuous GPU repaint**
  - File: `apps/docs/src/styles/custom.css:340`
  - Impact: Four hero orb elements each run `orb-pulse` (animating `filter: blur(100px)` → `blur(120px)`) simultaneously and infinitely. `filter: blur()` cannot be composited on the GPU — it forces full repaint on the main thread for the entire page lifecycle. This is the single most expensive performance defect on the homepage.
  - Evidence: `@keyframes orb-pulse { 0%, 100% { filter: blur(100px); } 50% { filter: blur(120px); } }` applied to `.hero-orb-1` through `.hero-orb-4` with `infinite` iteration.
  - Fix: Animate only `opacity` in `orb-pulse`. Set a static `filter: blur(100px)` as a non-animated CSS property on `.hero-orb`. The visual result is nearly identical but eliminates all paint frames.

- **[PERFORMANCE] scroll-reveal transitions filter:blur() on every scroll-triggered element**
  - File: `apps/docs/src/styles/custom.css:510`
  - Impact: Every element with `.scroll-reveal` (dozens across GalleryBanner, FeatureGrid, StatsBar, etc.) triggers a `filter: blur(4px)` → `blur(0)` transition on reveal. `filter` transitions force repaint on every frame of the 0.8s animation. This causes visible jank on low-end devices during scrolling.
  - Evidence: `.scroll-reveal { filter: blur(4px); transition: opacity, transform, filter 0.8s; } .scroll-reveal.is-visible { filter: blur(0); }` — filter transition on a site-wide class.
  - Fix: Remove `filter` from the transition list and remove the `filter: blur(4px)` initial state. Keep only `opacity` and `transform`, both of which are GPU-composited.

- **[PERFORMANCE] Font Awesome all.min.css (~70 KB) loaded twice; only 3 of 6 icon families used**
  - File: `apps/docs/astro.config.mjs:87` and `apps/docs/src/layouts/ShowcaseLayout.astro:39`
  - Impact: The full Font Awesome CSS is loaded globally via `astro.config.mjs` (all Starlight pages) AND again from `ShowcaseLayout.astro` (all standalone showcase pages). Pages using both receive it twice. Only `fa-solid`, `fa-regular`, and `fa-brands` are used; `fa-light`, `fa-thin`, and `fa-duotone` are wasted payload.
  - Evidence: `href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css'` in both files. Grep confirms only three icon families are used across the entire codebase.
  - Fix: Remove the `ShowcaseLayout.astro` duplicate. Replace `all.min.css` with `solid.min.css`, `regular.min.css`, and `brands.min.css` (~25 KB total vs ~70 KB). Or use a kit with only used icons.

- **[PERFORMANCE] getBoundingClientRect() inside mousemove handler forces layout reflow on every pixel**
  - File: `apps/docs/src/components/showcase/ScrollRevealScript.astro:72`
  - Impact: `getBoundingClientRect()` is a layout-reading API that forces a synchronous style recalculation. Calling it inside `mousemove` — which fires on every pixel of mouse movement — causes dozens of forced reflows per second. This pattern is duplicated in 4 additional showcase pages.
  - Evidence: `card.addEventListener('mousemove', function(e) { var rect = card.getBoundingClientRect(); ... })` — also present in `developer-experience.astro:369`, `enterprise-architecture.astro:652`, `detailed-pitch.astro:753`, `full-presentation.astro:1054`.
  - Fix: Cache `rect` outside the handler. Invalidate using a `ResizeObserver` on the card element.

- **[PERFORMANCE] WcShowcaseDropdown attaches permanent document click listener with no disconnectedCallback**
  - File: `apps/docs/src/scripts/wc-showcase-dropdown.ts:40`
  - Impact: The document-level click listener is registered in the constructor with no cleanup. On Astro sites using view transitions, repeated navigations accumulate listeners indefinitely. Each listener holds a closure reference to the element, preventing garbage collection.
  - Evidence: `document.addEventListener('click', (e) => { ... })` in the constructor. `grep disconnectedCallback` returns no matches in the file — the lifecycle method is entirely absent.
  - Fix: Store the handler as a class field arrow function. Add `connectedCallback()` to attach and `disconnectedCallback()` to remove via `document.removeEventListener`.

- **[PERFORMANCE] No Cache-Control headers for hashed /\_astro/ static assets in vercel.json**
  - File: `apps/docs/vercel.json:1`
  - Impact: Astro's build output places all JS/CSS in `/_astro/` with content-hash filenames. Without `Cache-Control: immutable`, Vercel applies short-lived default caching. Repeat visitors re-download all JS and CSS on every visit.
  - Evidence: `vercel.json` has one header rule (`X-Robots-Tag`) applied to `/(.*)`; no rule exists for `/_astro/(.*)` assets with long-lived caching.
  - Fix: Add `{ "source": "/_astro/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }` to the headers array.

- **[TESTING] No Playwright E2E tests target the docs app (port 3150)**
  - File: `playwright.config.ts:5`
  - Impact: All interactive pages (Component Genome, Token Explorer, showcase dropdown keyboard navigation, skip links) have zero automated browser testing. Client-side JavaScript bugs ship without detection.
  - Evidence: `playwright.config.ts` sets `baseURL: 'http://localhost:3151'` (Storybook) and `testDir: './packages/hx-library/e2e'`. No test files exist under `apps/docs/`.
  - Fix: Add a Playwright project entry targeting `http://localhost:3150`. Create E2E tests for: Component Genome search/filter, showcase dropdown keyboard navigation, token explorer tab switching, and skip link functionality.

---

## MEDIUM (fix this month — polish, best practices, maintainability)

- **[ACCESSIBILITY] ApiTable `<th>` missing scope="col" on every component API reference table**
  - File: `apps/docs/src/components/ApiTable.astro:32`
  - Impact: Screen readers cannot programmatically associate header cells with data cells in any component API table. This violates WCAG 2.1 SC 1.3.1 and affects every component documentation page.
  - Evidence: `{columns.map((col) => (<th>{col}</th>))}` — no `scope` attribute on any column header.
  - Fix: Change to `<th scope="col">{col}</th>`.

- **[ACCESSIBILITY] Comparison.astro ARIA table pattern missing role="rowgroup"**
  - File: `apps/docs/src/components/Comparison.astro:108`
  - Impact: The ARIA table pattern (`role="table"`, `role="row"`, `role="columnheader"`, `role="cell"`) requires `role="rowgroup"` to distinguish header rows from data rows. Without it, some screen reader implementations cannot correctly identify the table structure.
  - Evidence: `<div role="table">` directly contains `<div class="comparison-header" role="row">` with no intermediate `role="rowgroup"` container.
  - Fix: Wrap the header row in `<div role="rowgroup">` and wrap data rows in a separate `<div role="rowgroup">`. Or replace the entire pattern with a native `<table>` with `<thead>` and `<tbody>`.

- **[ACCESSIBILITY] ShowcaseLayout pages missing skip navigation link**
  - File: `apps/docs/src/layouts/ShowcaseLayout.astro:26`
  - Impact: Token Explorer, Component Genome, Elevator Pitch, and other standalone showcase pages have no skip link. Keyboard users must Tab through the entire fixed navbar before reaching page content.
  - Evidence: `ShowcaseLayout.astro` renders `<SiteNavbar>` but has no skip link element. Starlight-based pages have the overridden `SkipLink.astro`; showcase pages do not inherit it.
  - Fix: Add a visually-hidden skip link as the first focusable element in `ShowcaseLayout.astro` targeting the main content area, using the same pattern as `SkipLink.astro`.

- **[ACCESSIBILITY] WcShowcaseDropdown does not move focus to first menu item on open**
  - File: `apps/docs/src/scripts/wc-showcase-dropdown.ts:163`
  - Impact: When a keyboard user activates the "Showcase pages" trigger, the dropdown opens but focus remains on the trigger button. The user must Tab to reach any menu item, violating the ARIA menu button authoring pattern.
  - Evidence: `open()` sets `aria-expanded="true"` and `panel.style.display = 'flex'` but never calls `.focus()` on a menu item.
  - Fix: After the `requestAnimationFrame` that adds `is-open`, call `this.panel.querySelector('.showcase-item')?.focus()`.

- **[ACCESSIBILITY] Token Explorer tabpanels missing aria-labelledby association to tab buttons**
  - File: `apps/docs/src/pages/token-explorer.astro:572`
  - Impact: Screen readers announce each tabpanel as an unlabelled region when it receives focus. The APG requires tabpanels to be labelled by their controlling tab via `aria-labelledby`.
  - Evidence: `<div class="te-panel active" id="panel-colors" role="tabpanel">` — tabs have `aria-controls="panel-colors"` but no corresponding `id` on tab buttons and no `aria-labelledby` on panels.
  - Fix: Add `id="tab-{tab.id}"` to each `<button role="tab">`. Add `aria-labelledby="tab-{tab.id}"` to each `<div role="tabpanel">`.

- **[SECURITY] document.execCommand('copy') deprecated API used in two locations**
  - File: `apps/docs/src/components/PageTitle.astro:34` and `apps/docs/src/pages/token-explorer.astro:1022`
  - Impact: `execCommand('copy')` was removed from the Web spec. In `token-explorer.astro`, the failure is explicitly silenced with a `/* silently fail */` comment. Users receive no feedback when copy fails.
  - Evidence: `document.execCommand('copy')` in both files as a fallback after `navigator.clipboard.writeText`. All modern browsers (Chrome 66+, Firefox 63+, Safari 13.1+) support the Clipboard API.
  - Fix: Remove the `execCommand` fallback entirely. In the `catch` block, show a visible error state to the user (e.g., change the button icon for 2 seconds).

- **[SEO] Missing Apple-specific meta tags (apple-touch-icon, theme-color)**
  - File: `apps/docs/astro.config.mjs:42`
  - Impact: iOS browsers use the SVG favicon as a fallback, but Apple-specific touch icons are preferred for home screen icons. Missing `theme-color` means the browser chrome color does not match the site theme on mobile.
  - Evidence: No `apple-touch-icon` link or `theme-color` meta tag found in built `dist/index.html`.
  - Fix: Add `{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } }` and `{ tag: 'meta', attrs: { name: 'theme-color', content: '#0f172a' } }` to the Starlight head config.

- **[TYPE_SAFETY] WcShowcaseDropdown registered with deprecated wc- prefix instead of hx-**
  - File: `apps/docs/src/scripts/wc-showcase-dropdown.ts:187`
  - Impact: The custom element is registered as `wc-showcase-dropdown` in violation of the project's `hx-` tag prefix convention (CLAUDE.md: "Tag prefix: `hx-`"). This causes confusion for contributors and is inconsistent with all other project naming.
  - Evidence: `customElements.define('wc-showcase-dropdown', WcShowcaseDropdown)` — and in `GallerySection.astro:35`: `const shortName = tagName.replace('wc-', '')` which never matches `hx-` tags.
  - Fix: Rename to `hx-showcase-dropdown` and update all HTML/template references. Fix `GallerySection.astro:35` to `replace('hx-', '')`.

- **[TYPE_SAFETY] Class fields lack definite assignment assertions in WcShowcaseDropdown**
  - File: `apps/docs/src/scripts/wc-showcase-dropdown.ts:2`
  - Impact: Under `strictPropertyInitialization` (part of `--strict`), `trigger`, `panel`, and `canvas` fields must be assigned at declaration or use `!`. Currently TypeScript may or may not flag this depending on control flow analysis through the `throw` guard.
  - Evidence: `trigger: HTMLButtonElement; panel: HTMLElement; canvas: HTMLCanvasElement;` declared without definite assignment assertions or inline initialization.
  - Fix: Add `!` assertions or initialize with a helper method. Document why the constructor throw guarantees initialization.

- **[PERFORMANCE] 10+ simultaneous infinite CSS animations on homepage including non-compositable properties**
  - File: `apps/docs/src/styles/custom.css:855`
  - Impact: Four hero orbs each run two animations; `particle-drift` runs a 60-second animation; `grid-breathe` runs a 20-second opacity animation. Multiple animations use `filter: blur()` (see Critical finding #14). This is the worst-case scenario for mobile devices and low-end hardware.
  - Evidence: `.hero-orb-1 { animation: float-slow 20s infinite, orb-pulse 8s infinite; }` through `.hero-orb-4` plus `particle-drift` and `grid-breathe`.
  - Fix: Consolidate `float-slow` + `orb-pulse` into a single keyframe per orb. Remove `grid-breathe` opacity animation (use static opacity). Fix `orb-pulse` to animate only `opacity` (see Critical finding #14).

- **[PERFORMANCE] lit and shiki declared as direct dependencies but never directly imported**
  - File: `apps/docs/package.json:20`
  - Impact: `lit` is resolved transitively through `@helix/library`; the explicit declaration can create version conflicts. `shiki` is managed internally by `@astrojs/starlight` — the explicit `^3.22.0` declaration may conflict with Starlight's bundled version.
  - Evidence: Zero `import ... from 'lit'` or `import ... from 'shiki'` statements in any `apps/docs/src/` file. Both are in `dependencies`, not `devDependencies`.
  - Fix: Remove `lit` and `shiki` from `apps/docs/package.json`. Keep `sharp` (required by Astro's image optimization service).

- **[PERFORMANCE] Vercel Analytics injected on every page via SkipLink.astro without deferred loading**
  - File: `apps/docs/src/components/SkipLink.astro:7`
  - Impact: The analytics beacon script loads synchronously on every page, including pages that signal `noindex, nofollow` via both robots.txt and X-Robots-Tag. Analytics on a site explicitly marked as non-public is a contradiction.
  - Evidence: `import Analytics from '@vercel/analytics/astro'; ... <Analytics />` in `SkipLink.astro`. The component is rendered in Starlight's `<head>` area.
  - Fix: Move Analytics to a layout-level component with `strategy="afterInteractive"`. If the site is intended to remain private/development, remove analytics entirely.

- **[PERFORMANCE] Inter variable font loads full optical-size and italic axes — approximately 2x larger than needed**
  - File: `apps/docs/astro.config.mjs:80`
  - Impact: The Inter variable font request includes both italic (`ital`) and optical size (`opsz`) axes across the full weight range `100..900`. Italic is not used in any rendered content. The optical size axis is unused (`font-optical-sizing` is not set in CSS).
  - Evidence: `family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap` — full axis range with italic. Used weights are: 300, 400, 500, 600, 700, 800, 900.
  - Fix: Narrow to `family=Inter:wght@300;400;500;600;700;800;900&display=swap`. No italic, no optical size. This approximately halves the font payload.

- **[DEPLOYMENT] docs .gitignore missing .env.local pattern**
  - File: `apps/docs/.gitignore:1`
  - Impact: Future contributors who add credentials to `.env.local` may believe it is protected by the docs-level `.gitignore`. It is not — only `.env` and `.env.production` are excluded. The root `.gitignore` has `.env*.local` but cannot protect already-tracked files (as demonstrated by Finding 1).
  - Evidence: `apps/docs/.gitignore` lists `.env` and `.env.production`. `.env.local`, `.env.development.local`, `.env.test.local` are not listed.
  - Fix: Add `.env*.local` to `apps/docs/.gitignore`.

- **[DEPLOYMENT] crossorigin: true (boolean) instead of 'anonymous' in astro.config.mjs**
  - File: `apps/docs/astro.config.mjs:73`
  - Impact: Astro serializes `crossorigin: true` as `crossorigin="true"` in HTML. This is not a valid `crossorigin` attribute value. Browsers treat the preconnect as a non-CORS request, defeating its purpose for the Gstatic font CDN.
  - Evidence: `{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }` — line 90 correctly uses `crossorigin: 'anonymous'`.
  - Fix: Change `crossorigin: true` to `crossorigin: 'anonymous'` on line 73.

- **[DEPLOYMENT] Node.js version not pinned to patch level in CI**
  - File: `.github/workflows/ci.yml:44`
  - Impact: `node-version: 20` allows any Node.js 20.x.x patch release. Patch updates can introduce behavior changes in native modules, causing non-deterministic build failures.
  - Evidence: `node-version: 20` in `actions/setup-node` — major version only.
  - Fix: Pin to a specific patch: `node-version: '20.19.0'`. Or use a `.nvmrc` file and `node-version-file: '.nvmrc'`.

- **[DEPLOYMENT] VRT server startup uses fragile `sleep 5` before running tests**
  - File: `.github/workflows/ci.yml:85`
  - Impact: `sleep 5` assumes the HTTP server starts in under 5 seconds. On slow CI runners, cold starts, or large builds, VRT tests begin before the server is ready, producing flaky non-deterministic failures.
  - Evidence: `npx http-server apps/storybook/dist -p 3151 & sleep 5 && npm run test:vrt`.
  - Fix: Replace `sleep 5` with `npx wait-on http://localhost:3151 --timeout 30000`.

- **[DEPLOYMENT] --wc- token prefix still used in 553 locations in docs styles after library migrated to --hx-**
  - File: `apps/docs/src/styles/custom.css:40`
  - Impact: The library completed the `--wc-` → `--hx-` token prefix migration (commit `c643de6`), but the docs app still defines and consumes 553 `--wc-*` custom properties. This creates an inconsistent presentation layer that will confuse consumers reading the docs.
  - Evidence: `grep -r 'var(--wc-'` returns 553 matches across docs `src/`. Example: `--wc-accent`, `--wc-cyan`, `--wc-amber` defined in `custom.css:40–46`.
  - Fix: Migrate `custom.css` and all affected `.astro` files to use `--hx-` prefixed tokens. This is a docs-only presentation layer and will not break the library.

- **[CODE_QUALITY] GallerySection.astro replace('wc-', '') never matches hx- tags — Storybook URLs broken**
  - File: `apps/docs/src/components/gallery/GallerySection.astro:35`
  - Impact: Every Storybook link generated from the Component Genome gallery page uses a broken URL. `'hx-button'.replace('wc-', '')` returns `'hx-button'` unchanged, producing `components-hx-button--docs` instead of `components-button--docs`.
  - Evidence: `const shortName = tagName.replace('wc-', '');` — tag names have `hx-` prefix; `wc-` never matches.
  - Fix: Change to `tagName.replace('hx-', '')`.

- **[CODE_QUALITY] StatsBar.astro hardcodes "Last Updated: 2026-02-16" date — stale immediately**
  - File: `apps/docs/src/components/StatsBar.astro:67`
  - Impact: Users see an incorrect last-updated date in perpetuity without a manual edit. The description "last updated February 16, 2026" is already stale.
  - Evidence: `{ value: '2026-02-16', label: 'Last Updated', description: 'Documentation and component library last updated February 16, 2026.' }` — static string.
  - Fix: Derive dynamically at build time: `new Date().toISOString().split('T')[0]`.

- **[CODE_QUALITY] Copy failures silently swallowed in CodeBlock.astro and token-explorer.astro**
  - File: `apps/docs/src/components/CodeBlock.astro:238` and `apps/docs/src/pages/token-explorer.astro:1022`
  - Impact: When `navigator.clipboard.writeText()` fails (denied permissions, no document focus), users receive no feedback. The copy button does not change state. In token-explorer, the error is explicitly commented as `/* silently fail */`.
  - Evidence: `catch (err) { console.error('Failed to copy code:', err); }` in CodeBlock. `catch (err) { /* silently fail */ }` in token-explorer.
  - Fix: Show a visible error state — change the button icon to a failure indicator for 2 seconds, or display a tooltip "Copy failed — try Ctrl+C".

- **[TESTING] hexToRgba() returns NaN for 3-digit hex inputs — no validation, no tests**
  - File: `apps/docs/src/pages/token-explorer.astro:29`
  - Impact: A 3-digit hex color like `#abc` produces `rgba(171, 12, NaN, 1)` — an invalid CSS color. Token swatches render incorrectly for any design token using shorthand hex values.
  - Evidence: `parseInt(clean.substring(4, 6), 16)` — for a 3-digit hex, `substring(4,6)` returns `''`; `parseInt('', 16)` returns `NaN`.
  - Fix: Add a guard: `if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');` to expand 3-digit hex before parsing.

- **[TESTING] getComponentData() drives all API tables but has zero test coverage**
  - File: `apps/docs/src/lib/cem-utils.ts:145`
  - Impact: This function powers every component API reference table across 14 MDX pages. A bug in the member filter (line 151: `m.attribute &&`) silently drops members from the rendered table. No test validates correct output, null tagName handling, or edge cases in the CEM schema.
  - Evidence: Zero test files reference `cem-utils`. The member filter `m.kind === 'field' && m.attribute && m.privacy !== 'private' && !m.static && !m.readonly` is complex and untested.
  - Fix: Create `src/lib/__tests__/cem-utils.test.ts` with fixture-based tests for: happy path, unknown tag, empty arrays, private/static/readonly filtering, and CEM schema variations.

---

## LOW (backlog — minor improvements, nice-to-haves)

- **[ACCESSIBILITY] Hero scroll button missing :focus-visible style**
  - File: `apps/docs/src/components/Hero.astro:64`
  - Impact: The `role="button"` scroll indicator can receive keyboard focus but has no visible focus indicator, violating WCAG 2.4.7 (Focus Visible). The keydown handler is correctly implemented.
  - Evidence: `.hero-scroll-btn` and `.mouse-scroll-wrap` have no `:focus-visible` CSS rule in Hero.astro or custom.css.
  - Fix: Add `.hero-scroll-btn:focus-visible { outline: 2px solid var(--wc-accent); outline-offset: 2px; }`.

- **[ACCESSIBILITY] source-path pill touch target is ~28px on desktop (below 44px minimum)**
  - File: `apps/docs/src/components/PageTitle.astro:141`
  - Impact: The `min-height: 44px` rule exists but only in the `@media (max-width: 768px)` breakpoint. Desktop users have a smaller tap/click target than the WCAG 2.5.5 minimum.
  - Evidence: `.source-path { padding: 0.3rem 0.65rem; }` on desktop — approximately 28px tall at 16px root font size. `min-height: 44px` only in mobile media query at line 306.
  - Fix: Move `min-height: 44px` outside the mobile breakpoint to apply unconditionally.

- **[ACCESSIBILITY] Font size 0.5625rem (9px) on token-explorer copy row labels**
  - File: `apps/docs/src/pages/token-explorer.astro:292`
  - Impact: 9px text in an interactive UI element is extremely difficult to read for users with low vision who have not yet needed to activate OS zoom settings.
  - Evidence: `.te-copy-row-label { font-size: 0.5625rem; }` — 9px at 16px root font size.
  - Fix: Set a minimum of `0.75rem` (12px) for visible text in interactive elements.

- **[ACCESSIBILITY] Token Explorer tab icon `<i>` elements missing aria-hidden="true"**
  - File: `apps/docs/src/pages/token-explorer.astro:561`
  - Impact: Screen readers may attempt to announce Font Awesome icon glyph characters or class names when tabbing to tab buttons if the Font Awesome CSS does not properly suppress them.
  - Evidence: `<i class={`fa-solid ${tab.icon}`}></i>` — no `aria-hidden="true"` attribute.
  - Fix: Add `aria-hidden="true"` to each `<i>` element in tab buttons.

- **[TYPE_SAFETY] Double canvas.width/height assignment erases ctx.scale(dpr,dpr) transform**
  - File: `apps/docs/src/scripts/wc-showcase-dropdown.ts:144`
  - Impact: Setting `canvas.width` resets the 2D context state. Lines 144–145 re-assign canvas dimensions after `ctx.scale(dpr, dpr)` on line 143, erasing the DPR scale transform. Particle animation renders at 1x resolution on HiDPI displays.
  - Evidence: `this.ctx.scale(dpr, dpr); this.canvas.width = rect.width * dpr; this.canvas.height = rect.height * dpr;` — the scale is set then immediately cleared by the dimension reassignment.
  - Fix: Remove lines 144–145. Canvas dimensions are already set at lines 137–138 before `getContext('2d')` is called.

- **[TYPE_SAFETY] GallerySection.astro Storybook map uses wc- prefix keys — dead code**
  - File: `apps/docs/src/components/gallery/GallerySection.astro:41`
  - Impact: `storybookMap['wc-container']` and `storybookMap['wc-radio']` will never match since all `tagName` values have `hx-` prefix. These entries are dead code.
  - Evidence: `const storybookMap: Record<string, string> = { 'wc-container': 'layout-container', 'wc-radio': 'components-radio-group' }` — keys use old `wc-` prefix.
  - Fix: Update keys to `'hx-container'` and `'hx-radio'`, or remove if the default pattern covers them.

- **[SEO] Missing web app manifest.json**
  - File: `apps/docs/public/` (directory)
  - Impact: No installability metadata for browsers that support PWA installation. No custom theme color, display mode, or app name for home-screen pinning.
  - Evidence: No `manifest.json` or `site.webmanifest` found in `public/`.
  - Fix: Create `public/manifest.json` with basic PWA metadata: name, short_name, start_url, display, theme_color, background_color, icons.

- **[PERFORMANCE] Duplicate @keyframes definitions in custom.css and animations.css**
  - File: `apps/docs/src/styles/custom.css:256` and `apps/docs/src/styles/showcase/animations.css:5`
  - Impact: `fadeInUp`, `fadeIn`, `float-slow`, and `float-drift` are defined in both files. Pages that load both (showcase pages) receive duplicate keyframe declarations, adding to the CSS payload. The browser discards duplicates but still parses them.
  - Evidence: `@keyframes fadeInUp` at `custom.css:256` and `animations.css:5`; same for `fadeIn`, `float-slow`, `float-drift`.
  - Fix: Remove the four duplicate keyframe definitions from `animations.css`. `custom.css` is the authoritative source.

- **[PERFORMANCE] 23 img elements missing loading="lazy" attribute**
  - File: `apps/docs/src/pages/tech-stack.astro:568` and showcase components
  - Impact: 23 `<img>` tags across showcase components (StackVisualization, StackIntegrationMap, StackComparisons) are fetched eagerly on page load even when below the fold.
  - Evidence: `grep -r 'loading=' apps/docs/src/` returns no matches on `<img>` tags. `grep -r '<img'` returns 23+ instances in showcase components.
  - Fix: Add `loading="lazy"` to all below-fold images. Add `fetchpriority="high"` to the most prominent above-fold hero image.

- **[DEPLOYMENT] No npm security audit in CI pipeline**
  - File: `.github/workflows/ci.yml:1`
  - Impact: Dependency vulnerabilities go undetected until they are manually discovered or exploited. For a healthcare-grade library, this is a notable gap.
  - Evidence: Neither `ci.yml` nor `ci-matrix.yml` contains an `npm audit` step.
  - Fix: Add `- name: Security audit / run: npm audit --audit-level=high` to `ci.yml` after `npm ci`.

- **[DEPLOYMENT] No staging/preview environment configuration for PRs**
  - File: `apps/docs/vercel.json:1` / `.github/workflows/` (directory)
  - Impact: Pull requests have no preview deployment. Reviewers cannot visually inspect documentation changes without running the site locally.
  - Evidence: No `pull_request` trigger workflow exists. `vercel.json` has no environment-specific configuration.
  - Fix: Create `.github/workflows/preview.yml` using the Vercel CLI to deploy preview environments on `pull_request` events.

- **[CODE_QUALITY] Vercel Analytics coupled to accessibility SkipLink component**
  - File: `apps/docs/src/components/SkipLink.astro:7`
  - Impact: Analytics injection is semantically unrelated to skip link functionality. If the skip link override is removed or refactored, analytics silently stops loading site-wide with no indication.
  - Evidence: `import Analytics from '@vercel/analytics/astro'; ... <Analytics />` in `SkipLink.astro`.
  - Fix: Move analytics to a dedicated layout-level component or directly into the Starlight layout override.

- **[ACCESSIBILITY] aria-live="assertive" on copy toast should be "polite"**
  - File: `apps/docs/src/components/PageTitle.astro:62`
  - Impact: `assertive` interrupts any ongoing screen reader speech immediately. For a low-urgency clipboard confirmation, this is unnecessarily disruptive. `polite` waits for the current utterance to finish.
  - Evidence: `<div class="copy-toast" id="copy-toast" aria-live="assertive">` — clipboard confirmation does not qualify as an emergency announcement.
  - Fix: Change to `aria-live="polite"`. Add `aria-atomic="true"` to ensure the full "Copied!" message is read as a unit.

---

## STATS

- Total issues found: 70
- Critical: 14 | High: 19 | Medium: 24 | Low: 13
- Files reviewed: ~200
- API routes reviewed: 0 (Astro SSG — no runtime API routes)
- Components reviewed: 57
- Test files reviewed: 0 (none exist)
- Agents run: 9 (Accessibility, TypeScript, Component Quality, Deployment, General Performance, Astro Performance, Security, SEO, Test Coverage)
