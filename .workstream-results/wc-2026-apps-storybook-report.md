# Audit Report: wc-2026 (apps/storybook)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: apps/storybook/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

- **[SECURITY] Vercel API token stored in plaintext in .env.local**
  - File: `apps/storybook/.env.local:10`
  - Impact: Real Vercel API token (`vcp_1Nb4ze...`) in a plaintext file. Though gitignored now, accidental commit on `.gitignore` modification, developer-to-developer file sharing, or editor cloud sync tools can expose it. An attacker with this token can control all Vercel deployments.
  - Evidence: `HELIX_VERCEL_TOKEN=vcp_1Nb4zesMHVDtft3qtcWtGXUeTs7sE2nwzqYKiYcmbYg2FQ37a52szwxD`
  - Fix: Revoke the token immediately in the Vercel dashboard. Store it exclusively in GitHub Actions secrets. Never put CI credentials in local dot-env files.

- **[TESTING] No `test` script in package.json — all play functions never execute in CI**
  - File: `apps/storybook/package.json:7`
  - Impact: `turbo test` skips this package entirely. All Vitest browser interaction tests are effectively dead — the `vitest.config.ts` exists and is properly configured but is never invoked. Form submit, select keyboard navigation, and card click behaviors can silently break with no CI detection.
  - Evidence: `scripts` block has only `dev`, `build`, `build-storybook`, `clean` — no `test` entry. `vitest.config.ts` is unreachable from CI.
  - Fix: Add `"test": "vitest run"` to `package.json` scripts. Add `vitest` and `@vitest/browser` as direct `devDependencies`.

- **[TESTING] `vitest` not declared as direct dependency — phantom resolution from hx-library**
  - File: `apps/storybook/package.json:17`
  - Impact: `vitest` resolves today only because `packages/hx-library` hoists it. Any deduplication, lockfile change, or workspace restructure silently breaks `import { defineConfig } from 'vitest/config'` and all vitest globals. Fails loudly in CI without explanation.
  - Evidence: `devDependencies` has no `vitest` entry. `vitest.config.ts` imports from `vitest/config`; `vitest.setup.ts` uses the `beforeAll` global — both depend on phantom resolution.
  - Fix: Add `"vitest": "^3.0.0"` and `"@vitest/browser": "^3.0.0"` to `devDependencies`.

- **[ACCESSIBILITY] `all: unset` CSS removes focus ring from interactive buttons with no replacement**
  - File: `apps/storybook/stories/tokens/Colors.mdx:41`
  - Impact: Keyboard users activating copy-to-clipboard buttons on token documentation pages receive no visible focus indicator — a direct WCAG 2.1 AA SC 2.4.7 violation. Same pattern exists in `Typography.mdx`.
  - Evidence: `.hx-token-colors button { all: unset; box-sizing: border-box; }` — no `:focus-visible` rule defined anywhere after the reset.
  - Fix: Add after every `all: unset` block: `.hx-token-colors button:focus-visible { outline: 2px solid var(--hx-color-primary-500, #2563EB); outline-offset: 2px; }`

- **[ACCESSIBILITY] Copy-to-clipboard buttons in token pages have no accessible name**
  - File: `apps/storybook/stories/tokens/Colors.mdx:494`
  - Impact: Screen reader users encounter dozens of buttons whose `title` attribute is not reliably read by VoiceOver on macOS. Violates WCAG 4.1.2. Same pattern in `Typography.mdx`.
  - Evidence: `<button title={\`Click to copy: ${token.name}\`} onClick={() => copyToClipboard(token.name)}>`— no`aria-label`, no visually-hidden span.
  - Fix: Replace `title` with `aria-label={\`Copy ${token.name} to clipboard\`}`. Add a `role="status"` live region to announce "Copied!" after successful write.

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

- **[SECURITY] No Content Security Policy or security headers in vercel.json**
  - File: `apps/storybook/vercel.json:5`
  - Impact: No CSP restricts script execution in story iframes. No `X-Frame-Options` prevents clickjacking. No `X-Content-Type-Options` prevents MIME sniffing. The only header is an advisory `X-Robots-Tag`.
  - Evidence: `headers` array contains only `X-Robots-Tag: noindex, nofollow`. Missing: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
  - Fix: Add `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Content-Security-Policy` to the `vercel.json` headers array.

- **[SECURITY] Google Fonts loaded without Subresource Integrity hashes**
  - File: `apps/storybook/.storybook/preview-head.html:3`
  - Impact: If the Google CDN is compromised or DNS is hijacked, malicious CSS or font resources could be delivered to every Storybook session. CSS injection can execute JavaScript in some browser versions. Supply chain risk for healthcare infrastructure tooling.
  - Evidence: `<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" />` — no `integrity` attribute. Identical problem in `manager-head.html`.
  - Fix: Self-host Inter via `@fontsource/inter`. Eliminates SRI, privacy, and air-gapped network issues simultaneously.

- **[SECURITY] Storybook deployed publicly without access control**
  - File: `apps/storybook/vercel.json:1`
  - Impact: MDX documentation describes patient admission forms, MRN field structures, EHR URLs, medication order workflows, and internal system naming conventions. The site is publicly accessible — `robots.txt` and `X-Robots-Tag` are advisory only and provide no real access restriction.
  - Evidence: `vercel.json` has no authentication or password protection field. `manager-head.html` sets `noindex` but no access gate enforces it.
  - Fix: Enable Vercel Password Protection or Vercel SSO. For healthcare organizations, IP allowlisting to internal network ranges is the more robust control.

- **[SECURITY] `debug-storybook.log` with internal filesystem paths committed to repository**
  - File: `apps/storybook/debug-storybook.log:11`
  - Impact: The log exposes the developer's full local filesystem path `/Volumes/Development/wc-2026/`, OS (macOS), volume label, project structure, and internal package names. Debug logs in source control can accumulate env vars or credentials in future sessions.
  - Evidence: `[01:07:10.081] [DEBUG] Getting package.json info for /Volumes/Development/wc-2026/apps/storybook/package.json...`
  - Fix: Delete the log file. Run `git rm --cached apps/storybook/debug-storybook.log`. Add `*.log` and `debug-*.log` to root `.gitignore`. Add a pre-commit hook rejecting staged log files.

- **[SECURITY] GitHub Actions workflows use floating `@v4` action tags instead of pinned SHA digests**
  - File: `.github/workflows/ci.yml:39`
  - Impact: `@v4` tags are mutable. If upstream repositories are compromised, malicious code can be injected into CI which has access to all repository secrets and deployment credentials. Known supply chain attack vector.
  - Evidence: `uses: actions/checkout@v4`, `uses: actions/setup-node@v4`, `uses: actions/upload-artifact@v4`
  - Fix: Pin all actions to their full commit SHA: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683`. Use Renovate or Dependabot to keep pinned SHAs updated.

- **[ACCESSIBILITY] Hero banner titles use non-semantic `div` elements breaking heading navigation**
  - File: `apps/storybook/stories/components/hx-card.mdx:150`
  - Impact: Screen reader users navigating by headings cannot jump to page titles. No document hierarchy cue for the primary topic of each page. Pattern repeats across `hx-form.mdx`, `hx-select.mdx`, and `BestPractices.mdx`.
  - Evidence: `<div className="hero-title">hx-card Component</div>` — plain `div` with no ARIA role or heading semantics.
  - Fix: Change `.hero-title` divs to `<h1>` elements and `.hero-desc` divs to `<p>` elements across all four MDX files.

- **[ACCESSIBILITY] a11y addon not configured to auto-run — axe scans only on manual panel open**
  - File: `apps/storybook/.storybook/preview.ts:42`
  - Impact: For a healthcare library with a zero-regression mandate, axe violations are only surfaced when a developer manually opens the Accessibility tab. Violations in production components will not be caught during normal story browsing or CI runs.
  - Evidence: `a11y` parameter block only enables `color-contrast` rule. No `initialGlobals.a11y: { manual: false }` configured.
  - Fix: Add `initialGlobals: { a11y: { manual: false } }`. Expand `a11y.config.rules` to cover the full WCAG 2.1 AA ruleset (`label`, `button-name`, `image-alt`, `aria-required-attr`, `landmark-one-main`).

- **[ACCESSIBILITY] No skip navigation link in Storybook preview or manager**
  - File: `apps/storybook/.storybook/preview-head.html:1`
  - Impact: WCAG 2.4.1 (Bypass Blocks) requires a mechanism to skip repeated navigation. Storybook's sidebar and toolbar must be tabbed through before reaching story content. No skip link exists in either head file.
  - Evidence: `preview-head.html` contains only font preconnect links — no skip link.
  - Fix: Add a visually-hidden skip link to `preview-head.html`: `<a class="hx-skip-link" href="#storybook-root">Skip to story content</a>` with CSS positioning visible on focus.

- **[ACCESSIBILITY] No `lang` attribute set on preview document**
  - File: `apps/storybook/.storybook/preview-head.html:1`
  - Impact: WCAG 3.1.1 (Language of Page) requires `lang` on the `html` element. Screen readers rely on `lang` to select the correct speech synthesis engine. In healthcare where clinical terminology must be pronounced correctly, this matters.
  - Evidence: `preview-head.html` contains only font links — no `lang` injection.
  - Fix: Add `<script>document.documentElement.setAttribute('lang', 'en');</script>` to `preview-head.html`.

- **[ACCESSIBILITY] Hero description text fails WCAG 4.5:1 contrast — `rgba(255,255,255,0.45)` on dark background**
  - File: `apps/storybook/stories/Introduction.mdx:356`
  - Impact: WCAG 1.4.3 requires 4.5:1 for normal text. `rgba(255,255,255,0.45)` on `#0a0e27` computes to approximately 3.2:1 — below the minimum for body text at 0.95rem.
  - Evidence: `.hx-intro-hero .hx-intro-hero-desc { color: rgba(255,255,255,0.45) !important; }` on hero background `#0a0e27`.
  - Fix: Raise opacity to `rgba(255,255,255,0.80)` or use `#c8cde8` (approximately 5.1:1 on `#0a0e27`).

- **[ACCESSIBILITY] Feature chip text fails WCAG 4.5:1 contrast — `rgba(255,255,255,0.5)` at 11px**
  - File: `apps/storybook/stories/Introduction.mdx:452`
  - Impact: Chip labels at 0.6875rem require the full 4.5:1 minimum (not the 3:1 large-text threshold). Current ratio approximately 3.0:1.
  - Evidence: `.hx-intro-hero .hx-intro-chip { font-size: 0.6875rem; color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.04); }`
  - Fix: Increase chip text opacity to at least 0.85 or use `#d1d5db` (approximately 7.5:1 on the dark hero background).

- **[ACCESSIBILITY] Manager toolbar text color `#6c757d` fails 4.5:1 contrast on white background**
  - File: `apps/storybook/.storybook/manager.ts:26`
  - Impact: `barTextColor: '#6c757d'` on `barBg: '#ffffff'` yields approximately 4.48:1 — just below WCAG AA minimum. Storybook toolbar text labels fail for developers using assistive technology.
  - Evidence: `const helixTheme = create({ barTextColor: '#6c757d', barBg: '#ffffff' })` — contrast ratio ~4.48:1.
  - Fix: Darken to `#555555` (7:1 on white) or minimum `#616161` (4.54:1 on white).

- **[TYPE_SAFETY] Missing `tsconfig.json` — Storybook TypeScript files excluded from strict type checking**
  - File: `apps/storybook/tsconfig.json` (does not exist)
  - Impact: `main.ts`, `manager.ts`, `preview.ts`, `vitest.setup.ts`, and `vitest.config.ts` are transpiled without `strict: true`, `noUncheckedIndexedAccess`, or `exactOptionalPropertyTypes`. `npm run type-check` cannot verify this workspace. TypeScript errors accumulate silently.
  - Evidence: No `tsconfig.json` present in `apps/storybook/`. Root `tsconfig.base.json` defines strict mode with `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`.
  - Fix: Create `apps/storybook/tsconfig.json` extending `../../tsconfig.base.json`, including `.storybook/**/*.ts`, `vitest.config.ts`, and `stories/**/*.ts` in the `include` array.

- **[CODE_QUALITY] `console.log` in live `<script>` tag in `hx-form.mdx` executes in preview iframe**
  - File: `apps/storybook/stories/components/hx-form.mdx:354`
  - Impact: The inline `<script>` block contains `console.log('Form data:', e.detail.values)` and `console.error('Form submission error:', error)` on executable paths. This is not documentation — it is live JavaScript executing in Storybook's preview iframe.
  - Evidence: Script tag at ~line 540 with `console.log` on live event handlers.
  - Fix: Remove the inline `<script>` block. JavaScript integration examples must live inside fenced code blocks (which are inert), not live `<script>` tags.

- **[CODE_QUALITY] `hx-submit` event detail documents `Record<string, any>` violating no-`any` policy**
  - File: `apps/storybook/stories/components/hx-form.mdx:259`
  - Impact: Public API documentation shows `{ formData: FormData, values: Record<string, any> }`. Consumers who follow this type for event handlers will write untyped code. The zero-`any` mandate applies to documentation examples.
  - Evidence: `| hx-submit | { formData: FormData, values: Record<string, any> } |` in the Events table.
  - Fix: Update to `Record<string, unknown>`. Verify the component implementation uses `unknown` not `any` in its event detail interface.

- **[TESTING] Wrong package for `setProjectAnnotations` in `vitest.setup.ts`**
  - File: `apps/storybook/.storybook/vitest.setup.ts:1`
  - Impact: `@storybook/addon-vitest` documentation requires `setProjectAnnotations` from `@storybook/addon-vitest`, not from `@storybook/web-components`. The framework package may not correctly initialize Vitest-specific lifecycle hooks.
  - Evidence: `import { setProjectAnnotations } from '@storybook/web-components';` — should be from `'@storybook/addon-vitest'`.
  - Fix: Change to `import { setProjectAnnotations } from '@storybook/addon-vitest';`

- **[TESTING] `sleep 5` race condition in CI VRT step — non-deterministic server readiness**
  - File: `.github/workflows/ci.yml:86`
  - Impact: On slow GitHub runners or under load, 5 seconds is insufficient for `http-server` to bind its port. Classic flaky test pattern: passes on fast machines, fails intermittently on loaded CI runners.
  - Evidence: `npx http-server apps/storybook/dist -p 3151 & sleep 5 npm run test:vrt` — bare `sleep` with no readiness probe.
  - Fix: Replace `sleep 5` with `npx wait-on http://localhost:3151 --timeout 30000`. Add `wait-on` as a pinned root devDependency.

- **[TESTING] MDX story files have zero play functions — docs layer entirely untested**
  - File: `apps/storybook/stories/components/hx-card.mdx:3`
  - Impact: All five component and documentation MDX pages contain no `Canvas` or `Story` blocks with `play` functions. The documentation layer has zero automated interaction coverage.
  - Evidence: All component MDX files import only `Meta` from `@storybook/addon-docs/blocks`. No `Canvas`, `Story`, or `play` function references exist in any MDX file.
  - Fix: Embed `Canvas` blocks referencing named story exports with `play` functions, or explicitly document that MDX pages are documentation-only and interaction tests are owned by `.stories.ts` files.

- **[DEPLOYMENT] CI Storybook build output never verified before VRT runs**
  - File: `.github/workflows/ci.yml:80`
  - Impact: If the Storybook build fails or produces incomplete output, the VRT step immediately serves and tests a broken artifact. No step verifies that `dist/index.html` was actually produced.
  - Evidence: `Build Storybook` step has no subsequent verification. `Serve Storybook and run VRT` immediately starts `http-server` against the potentially empty `dist` directory.
  - Fix: Add: `test -f apps/storybook/dist/index.html && test -f apps/storybook/dist/iframe.html || exit 1` between build and VRT steps.

- **[DEPLOYMENT] Turborepo remote caching not configured — CI runs full rebuilds on every push**
  - File: `.github/workflows/ci.yml:1`
  - Impact: Every CI run rebuilds the entire monorepo from scratch. The Storybook Vite build is the most expensive step. Without remote cache, full rebuild time is paid on every PR.
  - Evidence: `ci.yml` has no `TURBO_TOKEN` or `TURBO_TEAM` env vars. `turbo.json` has no `remoteCache` configuration block.
  - Fix: Add `TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}` and `TURBO_TEAM: ${{ secrets.TURBO_TEAM }}` to CI env block.

- **[DEPLOYMENT] `@storybook/blocks@8.6.15` incompatible with Storybook 10.2.8**
  - File: `apps/storybook/debug-storybook.log:269`
  - Impact: Storybook doctor reports package incompatibility. Can cause story rendering failures, broken autodocs, and unpredictable behavior in the docs addon.
  - Evidence: `[WARN] 1 issue found: You are currently using Storybook 10.2.8 but have packages which are incompatible: @storybook/blocks@8.6.15`
  - Fix: Add to root `package.json`: `"overrides": { "@storybook/blocks": "^10.2.8" }`. Run `npm install` and verify with `npx storybook doctor`.

- **[DEPLOYMENT] Orphaned `storybook:build` Turborepo task defined but never invoked**
  - File: `turbo.json:34`
  - Impact: `turbo.json` defines `storybook:build` but all CI and root scripts invoke `turbo build --filter=@helix/storybook` (the generic build task). The intentional config is never utilized.
  - Evidence: `turbo.json: "storybook:build": { dependsOn: ["^build"], outputs: ["dist/**"] }`. `package.json: "build:storybook": "turbo build --filter=@helix/storybook"` — calls `build` task, not `storybook:build`.
  - Fix: Either rename the script to `storybook:build` so `turbo run storybook:build` works, or remove the orphaned `storybook:build` entry from `turbo.json`.

- **[PERFORMANCE] Google Fonts loaded as render-blocking synchronous stylesheet in both frames**
  - File: `apps/storybook/.storybook/preview-head.html:3`
  - Impact: The font `<link rel="stylesheet">` is synchronous and render-blocking in both the preview iframe and manager UI. On slow connections this blocks story rendering entirely. 6 weight variants loaded when only 4 are needed.
  - Evidence: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />` — no `rel="preload"` with `onload` pattern.
  - Fix: Self-host Inter via `@fontsource/inter`. If external loading is retained, use the preload/`onload` non-blocking pattern and narrow weights to `400;500;600;700`.

- **[PERFORMANCE] No Vite chunk splitting or optimization configured in `viteFinal`**
  - File: `apps/storybook/.storybook/main.ts:29`
  - Impact: Without `manualChunks` configuration, Vite may bundle all MDX story content into a single large chunk. No `optimizeDeps.include` forces pre-bundling of `@helix/tokens`.
  - Evidence: `viteFinal` returns config after only adding two `define` entries — no `build.rollupOptions.output.manualChunks`, no `optimizeDeps`, no `build.sourcemap` setting.
  - Fix: Extend `viteFinal` to add `manualChunks` splitting `@helix/tokens` into its own chunk. Set `build.sourcemap: false`. Add `optimizeDeps.include` for `@helix/tokens`.

- **[CODE_QUALITY] 11 component MDX overview documentation pages missing**
  - File: `apps/storybook/stories/components/` (directory)
  - Impact: 14 components exist in the library but only 3 have MDX overview pages (`hx-card`, `hx-form`, `hx-select`). 11 components have no usage guidelines, accessibility notes, CSS parts reference, or Drupal integration documentation.
  - Evidence: `ls apps/storybook/stories/components/` returns only 3 files. 11 component directories confirmed in `packages/hx-library/src/components/` with no corresponding MDX docs.
  - Fix: Create MDX overview pages for: `hx-button`, `hx-text-input`, `hx-alert`, `hx-badge`, `hx-checkbox`, `hx-radio-group`, `hx-switch`, `hx-textarea`, `hx-container`, `hx-prose`, `hx-radio`.

- **[CODE_QUALITY] Broken anchor links `[Drupal Integration Guide](#)` in three component MDX files**
  - File: `apps/storybook/stories/components/hx-card.mdx:562`
  - Impact: Users clicking the cross-reference links navigate nowhere — bare `#` keeps them on the same page. Appears in `hx-card.mdx`, `hx-form.mdx`, and `hx-select.mdx`.
  - Evidence: `See the [Drupal Integration Guide](#) in the HELIX documentation for comprehensive coverage` — non-functional bare hash anchor in all three files.
  - Fix: Replace with the actual docs site URL using `import.meta.env.HELIX_DOCS_URL`, or replace with plain text until the target page exists.

- **[CODE_QUALITY] Deprecated `drupal_set_message()` in `hx-form.mdx` PHP integration example**
  - File: `apps/storybook/stories/components/hx-form.mdx:730`
  - Impact: `drupal_set_message()` was removed in Drupal 9 and is unavailable in Drupal 10/11 (the stated target platform). Developers copying this example will get a fatal PHP error.
  - Evidence: `drupal_set_message(t('Medication order submitted successfully.'));`
  - Fix: Replace with: `\Drupal::messenger()->addStatus(t('Medication order submitted successfully.'));`

- **[SEO] Missing `charset` and `viewport` meta tags in `preview-head.html`**
  - File: `apps/storybook/.storybook/preview-head.html:1`
  - Impact: Without `charset`, browsers may misinterpret multi-byte characters in component labels. Without `viewport`, the preview canvas renders with desktop defaults on mobile devices, breaking responsive component testing.
  - Evidence: `preview-head.html` contains only three Google Fonts link elements — no `<meta charset="utf-8">` and no `<meta name="viewport">`.
  - Fix: Prepend `<meta charset="utf-8" />` and `<meta name="viewport" content="width=device-width, initial-scale=1" />` as the first tags.

- **[CODE_QUALITY] `hx-card.mdx` uses wrong attribute `size="sm"` instead of `hx-size="sm"`**
  - File: `apps/storybook/stories/components/hx-card.mdx:278`
  - Impact: Both card documentation examples show `<hx-button size="sm">` — the wrong attribute name. Consumers copying these examples get buttons rendered at default `md` size, silently ignoring the intended `sm` size.
  - Evidence: `<hx-button size="sm">View Floor Plan</hx-button>` at line 278 and `<hx-button size="sm" variant="secondary">Read More</hx-button>` at line 362.
  - Fix: Replace both occurrences with `hx-size="sm"`. Apply the same attribute naming check to all other component MDX files.

---

## MEDIUM (fix this month — polish, best practices, maintainability)

- **[SECURITY] Production URLs committed in `.env.local` comments revealing all deployment hostnames**
  - File: `apps/storybook/.env.local:6`
  - Impact: Commented-out values expose `https://docs.helix.himer.us`, `https://storybook.helix.himer.us`, and `https://admin.helix.himer.us` — all production hostnames. Combined with the Vercel token on line 10, an attacker has both targets and credentials.
  - Evidence: `# NEXT_PUBLIC_HELIX_DOCS_URL=https://docs.helix.himer.us`, `# NEXT_PUBLIC_HELIX_ADMIN_URL=https://admin.helix.himer.us`
  - Fix: Remove the commented-out production block from `.env.local`. Store production configuration in Vercel's environment variables UI only.

- **[SECURITY] `NEXT_PUBLIC_` environment variable prefix misused in Vite/Storybook context**
  - File: `apps/storybook/.storybook/main.ts:33`
  - Impact: `NEXT_PUBLIC_` is a Next.js-specific prefix. Vite uses `VITE_` for automatic browser exposure. This naming creates a trap: developers accessing `import.meta.env.NEXT_PUBLIC_*` without the `viteFinal` `define` block get `undefined`.
  - Evidence: `process.env.NEXT_PUBLIC_HELIX_DOCS_URL ?? 'http://localhost:3150'` — `NEXT_PUBLIC_` prefix in Vite context.
  - Fix: Rename to `STORYBOOK_HELIX_DOCS_URL` and `STORYBOOK_HELIX_ADMIN_URL` (Storybook natively exposes `STORYBOOK_*` vars). Update `.env.local` and any CI environment variable configuration.

- **[SECURITY] `preview-head.html` missing `noindex` meta tag present in `manager-head.html`**
  - File: `apps/storybook/.storybook/preview-head.html:1`
  - Impact: The preview iframe is a separate HTML document. If the preview iframe URL is directly linked or discovered, it will not carry the `noindex` signal — a defense-in-depth gap.
  - Evidence: `manager-head.html` line 1: `<meta name="robots" content="noindex, nofollow" />`. `preview-head.html`: no equivalent.
  - Fix: Add `<meta name="robots" content="noindex, nofollow" />` as the first line of `preview-head.html`.

- **[ACCESSIBILITY] Token page CSS transitions have no `prefers-reduced-motion` override**
  - File: `apps/storybook/stories/tokens/Colors.mdx:193`
  - Impact: `Colors.mdx`, `Shadows.mdx`, `Typography.mdx`, and `Borders.mdx` all use CSS transitions on hover without `@media (prefers-reduced-motion: reduce)` overrides. Only `Introduction.mdx` correctly handles this media query.
  - Evidence: `.hx-token-colors .hx-colors-swatch { transition: transform 0.2s ease, box-shadow 0.2s ease !important; } .hx-colors-swatch:hover { transform: translateY(-2px) !important; }` — no reduced-motion block.
  - Fix: Add a global reduced-motion block to `preview-head.html`: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }`

- **[ACCESSIBILITY] Infinite DNA helix animation has no pause or stop mechanism**
  - File: `apps/storybook/stories/Introduction.mdx:170`
  - Impact: WCAG 2.2.2 (Pause, Stop, Hide) requires controls for animations lasting more than 5 seconds. The `helixDnaRotate` (20s infinite) and `helixOrbDrift` animations run continuously with no in-page pause control. `prefers-reduced-motion` stops them correctly but users without that OS setting have no mechanism.
  - Evidence: `.hx-intro-dna-rotator { animation: helixDnaRotate 20s linear infinite; will-change: transform; }` — no pause button, no user control.
  - Fix: Add `aria-hidden="true"` to all animated decorative elements. Add a 'Pause animations' button or apply `animation-play-state: paused` on focus.

- **[ACCESSIBILITY] `Borders.mdx` matrix table has no `scope` attributes and an empty `<th>` element**
  - File: `apps/storybook/stories/tokens/Borders.mdx:496`
  - Impact: WCAG 1.3.1. Screen readers cannot associate table cells with column/row headers without `scope` attributes. The combination matrix is inaccessible to NVDA, JAWS, and VoiceOver users.
  - Evidence: `<th className="hx-borders-matrix-th"></th>` — empty, no `aria-label`. Column and row headers lack `scope="col"` and `scope="row"`.
  - Fix: Add `scope="col"` to header `th` elements, `scope="row"` to row header cells, and `aria-label="Border width vs radius"` to the empty corner `th`.

- **[ACCESSIBILITY] "Read More" button example demonstrates inaccessible pattern**
  - File: `apps/storybook/stories/components/hx-card.mdx:323`
  - Impact: Generic "Read More" with no contextual `aria-label`. Screen reader users navigating a list of cards hear "Read More, Read More, Read More" with no differentiation — violates WCAG 2.4.6. Healthcare teams copy documentation examples verbatim.
  - Evidence: `<hx-button size="sm">Read More</hx-button>` in card footer slot — no `aria-label` contextualizing which card.
  - Fix: Update example to demonstrate: `<hx-button size="sm" aria-label="Read more about {{ node.label }}">Read More</hx-button>` with a documentation note explaining why `aria-label` is required.

- **[TYPE_SAFETY] `Colors.mdx` exported functions have untyped parameters — implicit `any`**
  - File: `apps/storybook/stories/tokens/Colors.mdx:24`
  - Impact: `resolveHex(token)`, `findSubgroup(label)`, `copyToClipboard(text)` — all three parameters are implicitly `any`. If the token data shape changes, these functions fail at runtime without compile-time warning.
  - Evidence: `export function resolveHex(token) { ... }` — no type annotations.
  - Fix: Annotate with types from `@helix/tokens`: `resolveHex(token: TokenEntry): string`, `findSubgroup(label: string): TokenSubgroup | undefined`, `copyToClipboard(text: string): void`.

- **[ERROR_HANDLING] `copyToClipboard` swallows clipboard errors silently with empty catch handler**
  - File: `apps/storybook/stories/tokens/Colors.mdx:35`
  - Impact: If the Clipboard API is unavailable (HTTP context, permissions denied, Safari), the function fails silently. The user clicks a token name and nothing happens. Same pattern in `Typography.mdx`.
  - Evidence: `navigator.clipboard.writeText(text).catch(() => {});` — empty catch handler.
  - Fix: Show a fallback toast or status message when clipboard write fails. At minimum add a comment explaining the deliberate silent failure.

- **[CODE_QUALITY] `console.log` examples in component MDX establish bad patterns for healthcare consumers**
  - File: `apps/storybook/stories/components/hx-select.mdx:558`
  - Impact: Healthcare teams copy documentation examples verbatim. `console.log` calls become production code in clinical Drupal applications.
  - Evidence: `console.log(\`Select ${name} changed to: ${value}\`);`in`hx-select.mdx`. `console.log('Card clicked:', e.detail);`in`BestPractices.mdx` lines 361, 365.
  - Fix: Replace all `console.log` in documentation examples with commented alternatives or structured logging patterns.

- **[CODE_QUALITY] `manager.ts` hardcoded hex colors violate design token mandate**
  - File: `apps/storybook/.storybook/manager.ts:12`
  - Impact: Raw hex values in the manager theme are not synchronized with `@helix/tokens`. When the design system updates its primary brand color, the Storybook manager chrome will not update.
  - Evidence: `colorPrimary: '#2563EB', colorSecondary: '#8b5cf6', appBg: '#f8f9fa', barTextColor: '#6c757d'` — all raw hex literals.
  - Fix: Create a `theme-constants.ts` file mirroring primitive token values from `@helix/tokens` as JavaScript constants; reference those here as the single source of truth.

- **[PERFORMANCE] `addon-links` registered globally but unused across all story and MDX files**
  - File: `apps/storybook/.storybook/main.ts:16`
  - Impact: `@storybook/addon-links` registers a global decorator and panel in every story, adding runtime overhead. Zero uses of `linkTo`, `hrefTo`, or `LinkTo` found across all story and MDX files.
  - Evidence: `getAbsolutePath('@storybook/addon-links')` in `addons` array — no file imports or calls `linkTo` or `hrefTo`.
  - Fix: Remove `addon-links` from `addons` array in `main.ts` and from `devDependencies` in `package.json`.

- **[PERFORMANCE] `addon-vitest` bundled in production Storybook static site deployment**
  - File: `apps/storybook/.storybook/main.ts:15`
  - Impact: `@storybook/addon-vitest` registers test runner UI, Playwright bindings, and vitest adapter code. Including it in the production build inflates the static site with code that serves no purpose in read-only deployment.
  - Evidence: `getAbsolutePath('@storybook/addon-vitest')` in `addons` array. `vercel.json` deploys the built `dist/` — test runner code ships to production.
  - Fix: Conditionally load: `...(process.env.NODE_ENV !== 'production' ? [getAbsolutePath('@storybook/addon-vitest')] : [])`

- **[PERFORMANCE] `lit` listed as `devDependency` — risk of dual Lit instantiation**
  - File: `apps/storybook/package.json:24`
  - Impact: `@helix/library` already provides Lit as its own dependency. A duplicate Lit instance breaks the element registry (`customElements.define` throws on duplicate registration), causes `instanceof` checks to fail across shadow boundaries, and inflates the bundle.
  - Evidence: `dependencies: { '@helix/library': '*' }` includes Lit. `devDependencies: { 'lit': '^3.3.2' }` — redundant.
  - Fix: Remove `lit` from `devDependencies`. The `import { html } from 'lit'` in `preview.ts` should resolve through the workspace to the single hoisted Lit instance.

- **[PERFORMANCE] ~530 lines of duplicated inline CSS across four component MDX files**
  - File: `apps/storybook/stories/components/hx-card.mdx:7`
  - Impact: `hx-card.mdx`, `hx-form.mdx`, `hx-select.mdx`, and `BestPractices.mdx` each contain ~130-150 lines of nearly identical CSS. Any visual update requires editing four files.
  - Evidence: Lines 7-144 in `hx-card.mdx`, lines 7-157 in `hx-form.mdx`, etc. — byte-for-byte identical `hero-banner`, `info-box`, `warning-box`, `table`, `code-block` rules.
  - Fix: Create `stories/styles/docs-shared.css`. Import once in `preview.ts`. Remove per-file style blocks.

- **[TESTING] No coverage configuration in Storybook `vitest.config.ts`**
  - File: `apps/storybook/vitest.config.ts:8`
  - Impact: No coverage thresholds, collection config, or reporter output. The CLAUDE.md quality gate mandates 80%+ coverage but there is no equivalent gate for the Storybook interaction layer.
  - Evidence: `test` block has no `coverage` block, no `outputFile`, no `reporters`, no `thresholds`.
  - Fix: Add `reporters: ['verbose', 'json'], outputFile: { json: '.cache/test-results.json' }, coverage: { provider: 'v8', thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 } }`

- **[TESTING] 5 critical untested interaction paths across component story files**
  - File: `packages/hx-library/src/components/hx-form/hx-form.stories.ts`
  - Impact: (1) `hx-form` native form reset with `ElementInternals` — `formStateRestoreCallback` not verified. (2) `hx-select` arrow key navigation — no `ArrowDown`/`ArrowUp` test. (3) `hx-text-input` focus on first invalid field during validation. (4) `hx-card` click not swallowed by child element clicks. (5) `hx-checkbox` indeterminate state with `aria-checked="mixed"`.
  - Evidence: Grep across all story files for `indeterminate`, `ArrowDown`, `formStateRestore`, `firstInvalid`, `scrollIntoView` returns no results in any `play` function body.
  - Fix: Delegate to `qa-engineer-automation` to author the 5 missing interaction test stories.

- **[TESTING] MDX component pages have no `Canvas` or `Controls` live story embeds**
  - File: `apps/storybook/stories/components/hx-card.mdx:3`
  - Impact: All three component overview MDX pages are static documentation with no interactive `Canvas` blocks. Consumers see only prose and code blocks — they cannot interact with live story examples inline.
  - Evidence: No imports of `Canvas` or `Controls` from `@storybook/addon-docs/blocks` in any component MDX file.
  - Fix: Import named story exports and embed: `<Canvas of={CardStories.Default} />` with `<Controls of={CardStories.Default} />`

- **[DEPLOYMENT] `turbo.json` `globalDependencies` pattern invalidates entire cache on any env change**
  - File: `turbo.json:3`
  - Impact: `globalDependencies: ['**/.env.*local']` causes Turborepo to invalidate the cache for every task in the entire monorepo whenever any `.env.local` file changes.
  - Evidence: `"globalDependencies": ["**/.env.*local"]` in `turbo.json` line 3.
  - Fix: Move env var injection to task-level `env` arrays. Declare only the specific env vars each task actually consumes.

- **[DEPLOYMENT] Duplicate `build` and `build-storybook` scripts with identical bodies**
  - File: `apps/storybook/package.json:9`
  - Impact: Two scripts execute identical commands: `"build": "storybook build -o dist"` and `"build-storybook": "storybook build -o dist"`. A future change to build flags applied to one will not propagate to the other.
  - Evidence: Both entries are byte-for-byte identical.
  - Fix: Make `build-storybook` delegate to `build`: `"build-storybook": "npm run build"`.

- **[SEO] No URL rewrite rule for SPA routing in `vercel.json` — deep links return 404**
  - File: `apps/storybook/vercel.json:1`
  - Impact: Storybook's client-side routing requires all requests to fall through to `index.html`. Without a catch-all rewrite, direct URL navigation to story URLs fails with 404 in production deployment.
  - Evidence: `vercel.json` has no `rewrites` or `redirects` array — only `headers` and build config.
  - Fix: Add `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]` to `vercel.json`.

- **[CODE_QUALITY] CDN loading examples use placeholder `@1.0.0` version that doesn't match actual library version**
  - File: `apps/storybook/stories/components/hx-card.mdx:474`
  - Impact: All Drupal integration examples load from `cdn.jsdelivr.net/npm/@helix/library@1.0.0/dist/index.js`. The library's actual version is `0.0.1`. Developers copying these examples attempt to load a nonexistent version — silent 404, no components load.
  - Evidence: `https://cdn.jsdelivr.net/npm/@helix/library@1.0.0/dist/index.js` — same pattern in `hx-form.mdx`, `hx-select.mdx`, and `BestPractices.mdx`.
  - Fix: Replace `@1.0.0` with the actual current library version or use a version placeholder comment.

- **[CODE_QUALITY] `hx-text-input.stories.ts` `helpText` argType key mismatches CEM attribute `help-text`**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.stories.ts:79`
  - Impact: The argType key `helpText` (camelCase) does not match the CEM attribute `help-text` (kebab-case), creating a double-entry in the Controls panel.
  - Evidence: `argTypes: { helpText: { control: 'text', ... } }` — CEM attribute is `help-text`.
  - Fix: Rename argType key to `'help-text'` with bracket notation.

- **[CODE_QUALITY] `hx-card.stories.ts` `wcHref` argType key mismatches CEM attribute `hx-href`**
  - File: `packages/hx-library/src/components/hx-card/hx-card.stories.ts:39`
  - Impact: argType key `wcHref` does not match component attribute `hx-href`. CEM autodocs generates an `hx-href` row separately, producing a confusing double-entry.
  - Evidence: `argTypes: { wcHref: { control: 'text', ... } }` — rendered as `hx-href=${args.wcHref}`.
  - Fix: Rename `wcHref` to `'hx-href'` (bracket notation) throughout the story file.

- **[CODE_QUALITY] Missing viewport breakpoint parameters in `preview.ts` for responsive testing**
  - File: `apps/storybook/.storybook/preview.ts:14`
  - Impact: Without viewport parameters, engineers must manually resize the browser for responsive testing. Healthcare dashboards used on clinical tablets must be verified at common breakpoints.
  - Evidence: `parameters` object has `controls`, `docs`, `options`, `a11y`, `backgrounds` — no `viewport` key.
  - Fix: Add `viewport` parameters with clinical breakpoint presets (768px tablet, 1280px clinical desktop).

---

## LOW (backlog — minor improvements, nice-to-haves)

- **[ACCESSIBILITY] `crossorigin` attribute on Google Fonts preconnect should be explicit `crossorigin="anonymous"`**
  - File: `apps/storybook/.storybook/preview-head.html:3`
  - Impact: Bare `crossorigin` attribute is spec-ambiguous in some proxy configurations — preconnect may fail silently.
  - Evidence: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` — bare attribute without explicit value.
  - Fix: Use `crossorigin="anonymous"`.

- **[ACCESSIBILITY] `Shadows.mdx` interactive card hover demo has no keyboard-accessible equivalent**
  - File: `apps/storybook/stories/tokens/Shadows.mdx:445`
  - Impact: WCAG 1.4.13 (Content on Hover or Focus) requires hover-triggered effects to also be available on focus. The shadow transition demonstration is mouse-only.
  - Evidence: `.hx-shadows-interactive-card:hover { box-shadow: ...; transform: ...; }` — no `:focus-visible` equivalent. Hint text says "Hover over the card".
  - Fix: Add `:focus-visible` rule mirroring the `:hover` state. Add `tabindex="0"` to the card element.

- **[ACCESSIBILITY] Decorative SVG icons in `Introduction.mdx` heading elements lack `aria-hidden="true"`**
  - File: `apps/storybook/stories/Introduction.mdx:808`
  - Impact: Screen readers may announce SVG path data when navigating by headings. These SVGs are purely decorative.
  - Evidence: `<h3 id="sidebar-navigation"><svg width="20" height="20" viewBox="0 0 24 24" ...>...</svg> Sidebar Navigation</h3>` — no `aria-hidden="true"` on SVG.
  - Fix: Add `aria-hidden="true"` to every decorative SVG in `Introduction.mdx` headings and card headers.

- **[ACCESSIBILITY] New-tab links in `Introduction.mdx` CTA buttons do not announce new-tab behavior**
  - File: `apps/storybook/stories/Introduction.mdx:698`
  - Impact: WCAG 2.4.4 and SC 3.2.2. Screen reader users may become disoriented when a new tab opens unexpectedly.
  - Evidence: `<a href={import.meta.env.HELIX_DOCS_URL} target="_blank" rel="noopener noreferrer">Documentation</a>` — no `aria-label` or visually-hidden span announcing "(opens in new tab)".
  - Fix: Add `aria-label="Documentation (opens in new tab)"` to new-tab links.

- **[TYPE_SAFETY] `Borders.mdx` uses `||` instead of `??` for object map lookup**
  - File: `apps/storybook/stories/tokens/Borders.mdx:480`
  - Impact: `widthDescriptions[token.key] || 'General purpose border width.'` treats empty string as falsy. Project convention uses `??` for nullish coalescing.
  - Evidence: `{widthDescriptions[token.key] || 'General purpose border width.'}`
  - Fix: Change to `{widthDescriptions[token.key as BorderWidthKey] ?? 'General purpose border width.'}` and type the map keys explicitly.

- **[DEPLOYMENT] Package scope `@helix/` inconsistent with documented `@wc-2026/` convention in `CLAUDE.md`**
  - File: `apps/storybook/package.json:2`
  - Impact: `CLAUDE.md` documents packages as `@wc-2026/library` but actual package names use `@helix/`. Creates confusion in Turborepo filter commands and error messages for new team members.
  - Evidence: `"name": "@helix/storybook"`. `CLAUDE.md` states `@wc-2026/library`.
  - Fix: Align `CLAUDE.md` documentation with actual package names (`@helix/*`), or vice versa. Choose one convention.

- **[DEPLOYMENT] `vercel.json` missing cache-control headers for content-hashed static assets**
  - File: `apps/storybook/vercel.json:1`
  - Impact: Storybook build output includes content-hashed JS/CSS chunks safe to cache aggressively. Without cache headers, browsers re-download these assets on every visit.
  - Evidence: `headers` array only has `X-Robots-Tag` applied globally — no cache-control for hashed assets.
  - Fix: Add: `{ "source": "/(.*)\.(js|css|woff2)(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }`

- **[SEO] No favicon configured for the Storybook manager**
  - File: `apps/storybook/.storybook/manager-head.html:1`
  - Impact: Browser tab displays the generic Storybook icon. On shared bookmark bars or shared links, the site is visually indistinguishable from other Storybook instances.
  - Evidence: `public/` directory contains only `robots.txt`. No favicon. No `<link rel="icon">` in `manager-head.html`.
  - Fix: Add a branded SVG favicon to `public/favicon.svg` and reference it in `manager-head.html`.

- **[SEO] `manager-head.html` missing descriptive `<title>` tag — browser tab shows generic "Storybook"**
  - File: `apps/storybook/.storybook/manager-head.html:1`
  - Impact: Browser tab, bookmarks, and history all display "Storybook" rather than "HELIX Design System". `brandTitle` in `manager.ts` controls only the sidebar logo, not the browser tab.
  - Evidence: `manager-head.html` contains only meta robots tag and Google Fonts links — no `<title>` tag.
  - Fix: Add `<title>HELIX Design System — Component Playground</title>` to `manager-head.html`.

- **[CODE_QUALITY] `vitest.setup.ts` `annotations.beforeAll` not guarded against `undefined`**
  - File: `apps/storybook/.storybook/vitest.setup.ts:6`
  - Impact: `setProjectAnnotations` returns an object where `beforeAll` may be `undefined`. Calling `beforeAll(undefined)` throws or silently no-ops depending on Vitest version.
  - Evidence: `const annotations = setProjectAnnotations([previewAnnotations]); beforeAll(annotations.beforeAll);` — no null guard.
  - Fix: Add: `if (annotations.beforeAll) { beforeAll(annotations.beforeAll); }`

- **[CODE_QUALITY] `storySort` in `preview.ts` explicitly orders only 3 of 13 library components**
  - File: `apps/storybook/.storybook/preview.ts:36`
  - Impact: `order: ['Components', ['Button', 'Card', 'Text Input', '*'], '*']` — 10 components sort alphabetically via wildcard, producing a non-designed sidebar order.
  - Evidence: Only 3 components explicitly ordered in the sort array.
  - Fix: Add all component names to the sort order to produce a deterministic sidebar reflecting the designed information architecture.

- **[CODE_QUALITY] `hx-select.mdx` uses hardcoded hex values in priority color coding example**
  - File: `apps/storybook/stories/components/hx-select.mdx:378`
  - Impact: Documentation shows `style="--hx-select-border-color: #dc2626"` — hardcoded hex values presented to consumers in official documentation as the recommended approach, directly violating the design token mandate.
  - Evidence: `<hx-select label="Order Priority" name="priority" style="--hx-select-border-color: #dc2626; --hx-select-label-color: #991b1b;">`
  - Fix: Replace with token references: `style="--hx-select-border-color: var(--hx-color-error-600); --hx-select-label-color: var(--hx-color-error-800);"`

- **[SEO] `Introduction.mdx` missing getting-started or installation section**
  - File: `apps/storybook/stories/Introduction.mdx:1`
  - Impact: The introduction page covers navigation and architecture but provides no installation path for new developers. No `npm install @helix/library` or CDN loading instructions visible on the landing page.
  - Evidence: Four Quick Links cards cover Design Tokens, Component API, Platform Documentation, Admin Dashboard — no Getting Started or Installation card.
  - Fix: Add a Getting Started section with all three installation paths: npm, CDN, and Drupal `libraries.yml`.

- **[CODE_QUALITY] `BestPractices.mdx` Support section contains placeholder contact information**
  - File: `apps/storybook/stories/drupal/BestPractices.mdx:824`
  - Impact: Final section lists GitHub Issues, Slack Channel `#helix-drupal`, and Documentation without any actual URLs or team identifiers — worse than omitting the section entirely.
  - Evidence: `**GitHub Issues**: Report bugs or request features` — no repository URL. `**Slack Channel**: Join #helix-drupal for community support` — no workspace link.
  - Fix: Replace with actual links to the project repository, or remove the section until the information is ready.

---

## STATS

- Total issues found: 73
- Critical: 5 | High: 29 | Medium: 24 | Low: 15
- Files reviewed: 18
- API routes reviewed: 0 (Storybook static site — no API routes)
- Components reviewed: 3 MDX component docs + 3 referenced library components
- Test files reviewed: 2 (vitest.config.ts, vitest.setup.ts)

### Top Priority Actions (in order)

1. **Immediately**: Revoke the Vercel API token found in `.env.local`. Even though it is gitignored now, the token is a live credential that must be rotated.
2. **Today**: Add `"test": "vitest run"` to `package.json` scripts. The entire Storybook interaction test layer is currently unreachable from CI.
3. **Today**: Add `vitest` and `@vitest/browser` as direct `devDependencies` — phantom resolution is a ticking time bomb.
4. **Today**: Fix the `all: unset` focus ring destruction on token page buttons — active WCAG violation visible to every keyboard user.
5. **This week**: Add `tsconfig.json` to `apps/storybook` — TypeScript strict mode is not enforced on any Storybook config file today.
6. **This week**: Fix the three WCAG contrast failures in `Introduction.mdx` (hero description, feature chips, manager toolbar).
7. **This week**: Add security headers to `vercel.json` (CSP, X-Frame-Options, X-Content-Type-Options).
8. **This week**: Delete `debug-storybook.log` from source control.
9. **This month**: Self-host the Inter font — eliminates the SRI, privacy, render-blocking, and offline issues simultaneously.
10. **This month**: Create MDX overview pages for the 11 undocumented components.
