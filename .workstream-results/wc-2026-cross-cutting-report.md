# Audit Report: wc-2026 (Cross-Cutting)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: /workspace/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

---

- **[SECURITY] Live Vercel API token committed in version-tracked .env.local files**
  - File: `apps/admin/.env.local:10` (also `apps/docs/.env.local:10`, `apps/storybook/.env.local:10`)
  - Impact: Credential exposure to any repo cloner, CI runner, or container image; allows Vercel project manipulation
  - Evidence: `HELIX_VERCEL_TOKEN=vcp_1Nb4zesMHVDtft3qtcWtGXUeTs7sE2nwzqYKiYcmbYg2FQ37a52szwxD` present in all three app `.env.local` files; the same token appears in storybook and docs where it is unused
  - Fix: Rotate token immediately at vercel.com/account/tokens; remove from all `.env.local` files; store only in Vercel dashboard environment variables; create committed `.env.local.example` with placeholder values

- **[CODE_QUALITY] hx-form `@fires` JSDoc documents wc-submit/wc-invalid/wc-reset but runtime dispatches hx-\* events**
  - File: `packages/hx-library/src/components/hx-form/hx-form.ts:24-26`
  - Impact: CEM manifest documents three event names that do not exist; Drupal and Storybook consumers listening for `wc-submit`/`wc-invalid`/`wc-reset` receive no events; public API contract is broken
  - Evidence: JSDoc lines 24–26: `@fires wc-submit`, `@fires wc-invalid`, `@fires wc-reset`; runtime `dispatchEvent` at lines 218, 238, 252 uses `hx-invalid`, `hx-submit`, `hx-reset`
  - Fix: Update all three `@fires` tags to `hx-submit`, `hx-invalid`, `hx-reset` to match actual dispatched event names

- **[CODE_QUALITY] hx-card `@fires` JSDoc documents wc-card-click but runtime dispatches hx-card-click**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:20`
  - Impact: CEM manifest documents `wc-card-click` which does not exist; consumers relying on CEM autodocs wire incorrect event listeners
  - Evidence: Line 20 JSDoc: `@fires {CustomEvent<...>} wc-card-click`; line 91 runtime: `new CustomEvent('hx-card-click', ...)`
  - Fix: Change `@fires` annotation on line 20 to `hx-card-click`

- **[CODE_QUALITY] hx-alert `@fires` JSDoc documents wc-after-close but runtime dispatches hx-after-close**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.ts:23`
  - Impact: CEM manifest documents `wc-after-close` which never fires; consumers cannot detect alert dismissal via the documented event name
  - Evidence: Line 23 JSDoc: `@fires {CustomEvent} wc-after-close`; line 163 runtime: `dispatchEvent(new CustomEvent('hx-after-close', ...))`
  - Fix: Update line 23 `@fires` tag to `hx-after-close`

- **[SECURITY] Path traversal vulnerability in review date API via unsanitized date parameter**
  - File: `apps/admin/src/app/api/reviews/[date]/route.ts:18` (root cause: `apps/admin/src/lib/issues-loader.ts:92`)
  - Impact: Unauthenticated path traversal allows reading arbitrary `.json` files outside the reviews directory; e.g., `GET /api/reviews/../../../../../../etc/passwd` resolves to `/etc/passwd.json`
  - Evidence: `loadReview(date)` constructs path as `join(REVIEWS_DIR, \`${date}.json\`)`with no regex validation;`path.join()` does not prevent directory escape
  - Fix: Validate date matches `/^\d{4}-\d{2}-\d{2}$/` before use; use `path.resolve()` and assert result starts with `REVIEWS_DIR`; add authentication to the route

- **[TYPE_SAFETY] Admin tsconfig.json does not extend tsconfig.base.json and is missing strict type flags**
  - File: `apps/admin/tsconfig.json:1`
  - Impact: Entire Next.js admin app has lower type-safety than the component library; `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are not enforced, masking unsafe index access patterns
  - Evidence: `tsconfig.base.json` sets `noUncheckedIndexedAccess:true` and `exactOptionalPropertyTypes:true`; `apps/admin/tsconfig.json` has no `extends` field and is missing both flags
  - Fix: Add `noUncheckedIndexedAccess:true` and `exactOptionalPropertyTypes:true` to `apps/admin/tsconfig.json` and fix resulting type errors

- **[TYPE_SAFETY] hx-card keyboard handler uses `as unknown as MouseEvent` producing structurally incorrect event detail**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:104`
  - Impact: `KeyboardEvent` cast as `MouseEvent` passes `undefined` for `clientX`/`clientY`/`button` properties; consumers of `hx-card-click` `detail.originalEvent` receive an incorrect event object on keyboard activation
  - Evidence: Line 104: `this._handleClick(e as unknown as MouseEvent)` where `e` is `KeyboardEvent`; `_handleClick` types its parameter as `MouseEvent`
  - Fix: Extract `dispatchCardClick()` method with no `MouseEvent` dependency; call from both `_handleClick` and `_handleKeyDown`

- **[ACCESSIBILITY] hx-radio has role=radio on host but no Space or Enter keyboard handler**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.ts:63`
  - Impact: Radio buttons are completely inoperable via keyboard; pressing Space or Enter does nothing; violates WCAG 2.1 SC 2.1.1 Keyboard (Level A); every healthcare form using radio buttons is affected
  - Evidence: `connectedCallback` lines 63–66 set `role=radio` on host; inner div has `@click` handler but no `@keydown`; `tabIndex` management done externally by `hx-radio-group` but Space/Enter are never handled
  - Fix: Add `keydown` listener on host or inner div that calls `_handleClick()` when `key === ' '`; also handle Enter per WAI-ARIA radio pattern

- **[ACCESSIBILITY] IssueDetailPanel overlay missing role=dialog, aria-modal, and focus trap**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:122`
  - Impact: Keyboard users can Tab into background content while overlay is open; screen readers have no modal context; violates WCAG 2.1 SC 2.1.1 (A) and SC 4.1.2 (A)
  - Evidence: Panel renders as `fixed inset-0` overlay with no `role=dialog`, no `aria-modal=true`, no `aria-labelledby`, no focus trap; backdrop `onClick` at line 131 has no keyboard handler
  - Fix: Add `role=dialog`, `aria-modal=true`, `aria-labelledby` to panel div; move focus inside on open; implement Tab/Shift+Tab focus trap; add `onKeyDown` to backdrop for Enter/Space close

- **[ACCESSIBILITY] Admin app layout has no skip-to-main-content link**
  - File: `apps/admin/src/app/layout.tsx:49`
  - Impact: Keyboard users must Tab through all 8 sidebar navigation links on every page load before reaching main content; violates WCAG 2.1 SC 2.4.1 Bypass Blocks (Level A)
  - Evidence: `RootLayout` renders persistent sidebar with 8 navigation links followed by `<main>`; no skip link exists anywhere in the layout
  - Fix: Add visually-hidden skip link as first focusable element: `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>`; add `id="main-content"` to main element

- **[PERFORMANCE] `sideEffects` field marks all component TypeScript source files as side-effectful blocking tree-shaking**
  - File: `packages/hx-library/package.json:7`
  - Impact: Downstream bundlers cannot eliminate unused components; a consumer importing only `hx-button` receives all component code; defeats the per-component <5KB bundle budget
  - Evidence: `"sideEffects": ["**/*.css", "src/components/**/*.ts"]` marks every component `.ts` file as a side effect
  - Fix: Change to `"sideEffects": ["**/*.css"]`; compiled dist files include `customElements.define()` and are correctly tree-shaken by entry point

- **[DEPLOYMENT] Package exports, main, module, and types all point to TypeScript source not compiled dist**
  - File: `packages/hx-library/package.json:11`
  - Impact: External npm consumers receive raw TypeScript with no compiled entry point; package is uninstallable by non-TypeScript bundlers; the `dist/` directory listed in `files` is unreachable via `exports`
  - Evidence: `main`, `module`, `types` all reference `./src/index.ts`; `exports` map also points to `./src/**/*.ts`; `dist/` exists but is not mapped in any export condition
  - Fix: Update all four fields to point to `dist/`: `main=./dist/index.js`, `module=./dist/index.js`, `types=./dist/index.d.ts`; update `exports` to reference `./dist/**/*.js` and `./dist/**/*.d.ts`

- **[DEPLOYMENT] Both publishable packages marked `private:true` permanently blocking npm publish**
  - File: `packages/hx-library/package.json:4`
  - Impact: `npm publish` and `changeset publish` both refuse to publish private packages; the entire release pipeline in CLAUDE.md is dead; no version of the library can ever be published
  - Evidence: `packages/hx-library/package.json:4 private:true`; `packages/hx-tokens/package.json:4 private:true`; no publish workflow exists in `.github/workflows/`
  - Fix: Remove `private:true` from both packages; add `publishConfig:{access:public}`; create `.github/workflows/release.yml` using `changesets/action@v1`

- **[TESTING] `oneEvent()` test utility has no timeout — tests hang indefinitely if event never fires**
  - File: `packages/hx-library/src/test-utils.ts:41`
  - Impact: Any test awaiting an event that never fires blocks CI pipeline indefinitely with no diagnostic output; a hang is harder to debug than a failing test
  - Evidence: `oneEvent()` at lines 51–56 returns a `Promise` with no timeout, no rejection path, no `Promise.race` guard; if event is never dispatched the promise never resolves
  - Fix: Add `Promise.race` with timeout rejection: `Promise.race([eventPromise, new Promise((_, reject) => setTimeout(() => reject(new Error(\`oneEvent: "${eventName}" not fired within ${timeout}ms\`)), timeout))])`

- **[TESTING] `_shadowQueryAll` imported in 3 test files but not exported from test-utils (TypeScript blind to test files)**
  - File: `packages/hx-library/src/components/hx-card/hx-card.test.ts:6`
  - Impact: Test files excluded from `tsconfig.json` so import error is never caught at compile time; name binds to `undefined` at runtime; future callers would get confusing "not a function" error
  - Evidence: `hx-card.test.ts:6`, `hx-radio-group.test.ts:5`, `hx-alert.test.ts:6` all import `_shadowQueryAll`; `test-utils.ts` exports `shadowQueryAll` (no underscore); `tsconfig` excludes `src/**/*.test.ts`
  - Fix: Remove three dead imports; create separate `tsconfig.test.json` that includes `src/**/*.test.ts` so TypeScript validates test file types

- **[PERFORMANCE] Synchronous filesystem write executed on every server render of /health page**
  - File: `apps/admin/src/app/health/page.tsx:18`
  - Impact: `saveHealthSnapshot()` calls `writeFileSync()` synchronously on every navigation to `/health`, blocking the Node.js event loop; React Strict Mode double-invocation means this runs twice per request in development
  - Evidence: Line 18: `saveHealthSnapshot(components)` called directly inside async Server Component render function; comment on line 17 acknowledges: "In production, this would be triggered by a cron job"
  - Fix: Move snapshot writes to a dedicated `POST /api/health/snapshot` Route Handler triggered by a cron job; render functions must be pure

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

---

- **[SECURITY] All admin API routes are completely unauthenticated with no middleware protection**
  - File: `apps/admin/src/app/api/issues/route.ts:26`
  - Impact: Any unauthenticated client can create issues, modify issue status, and spawn child processes running vitest with full filesystem access to the server
  - Evidence: `GET`/`POST /api/issues`, `PATCH /api/issues/[id]`, `POST /api/tests/run`, `GET /api/reviews`, `GET /api/tokens` have zero auth checks; no `middleware.ts` exists; no session validation in any handler
  - Fix: Create `apps/admin/src/middleware.ts` to validate bearer token or session for all `/api/*` routes; gate `POST /api/tests/run` behind deploy-time flag or remove from production

- **[SECURITY] Unsafe dynamic property sort enables arbitrary field access in issues API**
  - File: `apps/admin/src/app/api/issues/route.ts:34`
  - Impact: Attacker can request `?sort=statusHistory` to expose nested object arrays not normally visible; no allowlist restricts sort to intended fields
  - Evidence: Line 34: sort parameter from query string used directly as property key `aRecord[sort]` with no allowlist validation
  - Fix: Create allowlist: `const ALLOWED_SORTS = ['id','title','severity','status','createdAt','updatedAt']`; validate `sort` before using as property key

- **[SECURITY] POST and PATCH endpoints accept arbitrary payload sizes with no schema validation**
  - File: `apps/admin/src/app/api/issues/route.ts:89`
  - Impact: Attacker can POST multi-megabyte strings causing DoS; no length limits on `title`/`description`/`notes`; no XSS sanitization on tags
  - Evidence: `CreateIssueBody` and `PatchIssueBody` interfaces have no length constraints; line 114: `(await request.json()) as CreateIssueBody` with no Zod or manual validation
  - Fix: Add Zod schema validation: `const Schema = z.object({title: z.string().min(1).max(255), description: z.string().max(5000), ...})`; validate in POST and PATCH handlers

- **[SECURITY] No security headers configured on any deployment**
  - File: `apps/admin/next.config.ts:1`
  - Impact: Vulnerable to clickjacking, MIME sniffing, and cross-site scripting; missing HSTS means HTTP downgrade attacks possible; direct healthcare platform compliance gap
  - Evidence: `next.config.ts` only sets `transpilePackages`; all three `vercel.json` files only define `X-Robots-Tag`; no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Strict-Transport-Security` anywhere
  - Fix: Add `headers()` function to `next.config.ts` with `X-Frame-Options:DENY`, `X-Content-Type-Options:nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, and `Permissions-Policy`

- **[SECURITY] API error handlers return raw error messages exposing file paths and internal details**
  - File: `apps/admin/src/app/api/issues/route.ts:84`
  - Impact: `ENOENT` errors expose filesystem paths; JSON parse errors expose internal data structure; aids attacker reconnaissance
  - Evidence: Catch block lines 84–85 returns `error.message` directly in `detail` field to client; same pattern in all API route files
  - Fix: Log full error server-side only; return generic: `return NextResponse.json({error:'Internal server error'},{status:500})`

- **[ACCESSIBILITY] hx-checkbox native input has tabindex=-1 with no focusable host or label making it unkeyboardable**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:259`
  - Impact: Checkbox cannot receive keyboard focus through normal Tab navigation; violates WCAG 2.1 SC 2.1.1 Keyboard (Level A)
  - Evidence: Native input at line 280 has `tabindex=-1`; label element at line 261 has no `tabindex`; no equivalent to `hx-radio-group` tabIndex management exists for checkboxes
  - Fix: Add `tabindex=0` to the `label part="control"` element; remove `tabindex=-1` from native input; rely on existing `:focus-visible` CSS sibling combinator

- **[ACCESSIBILITY] hx-alert has redundant role=alert and aria-live; static content on page load is not re-announced**
  - File: `packages/hx-library/src/components/hx-alert/hx-alert.ts:179`
  - Impact: Double announcement on NVDA+Firefox; alerts present at page load are never read by JAWS/NVDA because content was present before the live region was observed; violates WCAG 2.1 SC 4.1.3 (AA)
  - Evidence: Line 179 sets both `role=alert` and `aria-live=assertive`; `role=alert` already implies assertive; content is in DOM even when `open=false`
  - Fix: Remove explicit `aria-live` attribute; conditionally render alert content only when `this.open` is true

- **[ACCESSIBILITY] Interactive hx-card aria-label exposes raw URL path as accessible name**
  - File: `packages/hx-library/src/components/hx-card/hx-card.ts:124`
  - Impact: Screen readers announce "Navigate to /patient/12345/records" instead of meaningful destination; cryptic URLs are not accessible names; violates WCAG 2.1 SC 2.4.4 Link Purpose (A)
  - Evidence: Line 124: `aria-label=\`Navigate to ${this.wcHref}\``where`wcHref` is a raw URL; this overrides slotted heading content
  - Fix: Remove auto-generated URL aria-label; add documented `ariaLabel` property consumers must set when `hx-href` is used; or render native `<a>` when `wcHref` is set

- **[ACCESSIBILITY] 8 component stylesheets missing prefers-reduced-motion override for CSS transitions**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:26`
  - Impact: Vestibular-impaired users requesting reduced motion receive animations on every interactive state change; healthcare mandate requires zero WCAG regressions
  - Evidence: `hx-button`, `hx-card`, `hx-text-input`, `hx-select`, `hx-textarea`, `hx-checkbox`, `hx-radio`, `hx-switch` all have `transition:` without `@media (prefers-reduced-motion: reduce)` blocks; only `hx-badge` implements the guard correctly
  - Fix: Add `@media (prefers-reduced-motion: reduce) { .button { transition: none; } }` to each stylesheet; apply same to `transform` animations in `hx-card`

- **[ACCESSIBILITY] `outline:none` baseline in 4 component stylesheets removes focus indicator without `:focus-visible` guarantee**
  - File: `packages/hx-library/src/components/hx-switch/hx-switch.styles.ts:45`
  - Impact: Browsers or high-contrast modes without `:focus-visible` support show zero focus indicator; violates WCAG 2.1 SC 2.4.7 Focus Visible (AA)
  - Evidence: `hx-switch.styles.ts:45`, `hx-text-input.styles.ts:104`, `hx-select.styles.ts:90`, `hx-textarea.styles.ts:92` all have `outline:none` on base selector; `:focus-visible` adds ring but bare override is the baseline
  - Fix: Remove bare `outline:none`; keep only the `:focus-visible` rule; browser handles non-`:focus-visible` contexts without the override

- **[ACCESSIBILITY] hx-radio-group host role=radiogroup conflicts with inner shadow DOM fieldset**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:128`
  - Impact: Screen readers announce the group twice; `aria-label` on host and `<legend>` in shadow DOM both announce the label; JAWS/NVDA handle this inconsistently
  - Evidence: `connectedCallback` line 128: `this.setAttribute('role','radiogroup')`; `render()` line 331 also renders `<fieldset>`; `updated()` line 148 sets `aria-label` on host
  - Fix: Remove `role=radiogroup` and `aria-label` from host; rely solely on inner `fieldset+legend` in shadow DOM which is the semantically correct pattern

- **[ACCESSIBILITY] hx-button--sm minimum height is 32px, below the 44px WCAG touch target minimum**
  - File: `packages/hx-library/src/components/hx-button/hx-button.styles.ts:54`
  - Impact: Small button variant fails WCAG 2.2 SC 2.5.8 Target Size Minimum (AA); on mobile healthcare devices users may mis-tap adjacent controls
  - Evidence: `button--sm` lines 53–57 sets `min-height: var(--hx-size-8, 2rem)` = 32px; WCAG minimum is 44px
  - Fix: Raise `min-height` to `2.75rem` (44px); or use transparent padding to achieve 44px interactive area while maintaining visual size

- **[ACCESSIBILITY] TestResultsTable failed test error row is a non-interactive div with onClick**
  - File: `apps/admin/src/components/test-runner/TestResultsTable.tsx:249`
  - Impact: Failed test detail rows cannot be keyboard-activated; violates WCAG 2.1 SC 2.1.1 (A) and SC 4.1.2 (A)
  - Evidence: Line 249: `<div onClick={() => hasFailed && toggleError(test.fullName)} cursor-pointer>` with no `tabindex`, no `role`, no `onKeyDown`
  - Fix: Replace div with `<button>`; add `aria-expanded={errorOpen}` and `disabled={!hasFailed}` attributes

- **[ACCESSIBILITY] SplitButtonDropdown uses deprecated aria-haspopup=true instead of aria-haspopup=menu**
  - File: `apps/admin/src/components/dashboard/SplitButtonDropdown.tsx:70`
  - Impact: Screen readers may not correctly announce the menu popup; no arrow-key navigation within menu items; focus not returned to trigger on close; violates WCAG 2.1 SC 4.1.2 (A)
  - Evidence: Line 70: `aria-haspopup=true` (deprecated boolean); menu has `role=menu` but no arrow-key navigation and no `aria-controls` linking trigger to menu
  - Fix: Change to `aria-haspopup=menu`; add `id` to menu div and `aria-controls` to button; implement ArrowDown/ArrowUp key navigation within menu

- **[ERROR_HANDLING] No loading.tsx files anywhere in admin app — all async pages block full render**
  - File: `apps/admin/src/app`
  - Impact: Dashboard calls 5+ async data sources before sending any HTML; users see blank page until all data loads; no streaming or progressive loading possible
  - Evidence: Zero `loading.tsx` files found across all `/app` subdirectories; `DashboardPage` awaits `scoreAllComponents()`, `getAllTestResults()`, `getManifestStats()`, `loadIssues()`, `getTokenStats()` before any render
  - Fix: Add `loading.tsx` at `/app/loading.tsx`, `/app/components/loading.tsx`, `/app/health/loading.tsx`; wrap expensive sections in `<Suspense>` for streaming

- **[ERROR_HANDLING] No error.tsx files anywhere in admin app — unhandled data fetch errors crash entire pages**
  - File: `apps/admin/src/app`
  - Impact: If any server data fetch throws, the entire page crashes; stack traces may be visible to users
  - Evidence: Zero `error.tsx` files found; `roadmap/page.tsx:33` calls `loadIssues()` with no try/catch; `scoreAllComponents()` calls in multiple pages are unguarded at page level
  - Fix: Add `error.tsx` as `'use client'` Client Components at app root and per major section; receive `error` and `reset` props per Next.js spec

- **[ERROR_HANDLING] No not-found.tsx for unmatched routes — Next.js shows generic 404 with no branding**
  - File: `apps/admin/src/app`
  - Impact: `notFound()` called in `[tag]/page.tsx` falls back to default Next.js 404 page; exposes framework version; poor UX for an enterprise healthcare tool
  - Evidence: Zero `not-found.tsx` files found in admin app; only `notFound()` call at `apps/admin/src/app/components/[tag]/page.tsx:43`
  - Fix: Create `apps/admin/src/app/not-found.tsx` as a Server Component with branded in-app 404 experience

- **[PERFORMANCE] scoreAllComponents runs 17 file-system analyzers per component uncached on every page request**
  - File: `apps/admin/src/app/page.tsx:36`
  - Impact: ~200 synchronous file reads per dashboard page load; same computation re-runs independently on `/components` and `/health` pages; measurably slow cold loads
  - Evidence: `scoreAllComponents()` called without cache at `page.tsx:36`, `components/page.tsx:11`, `health/page.tsx:14`; runs 17 analyzers × N components including I/O-heavy cem-parser, bundle-analyzer, jsdoc-analyzer
  - Fix: Wrap in `React.cache()` or `unstable_cache` with 60s revalidation; also convert dynamic `import('./cem-parser')` inside function to static top-level import

- **[CODE_QUALITY] Multiple pure display components unnecessarily marked `use client`**
  - File: `apps/admin/src/app/roadmap/components/ReviewHistory.tsx:1`
  - Impact: Client-side JavaScript ships unnecessarily for components with no interactivity; children of client boundaries lose server rendering benefits
  - Evidence: `ReviewHistory.tsx`: `'use client'` with only date formatting; `GlassStatsHero.tsx`: `'use client'` with only icon+styling; `RoadmapTimeline.tsx`: `'use client'` with only list rendering; `tokens/layout.tsx` entire layout is client just for `usePathname`
  - Fix: Remove `'use client'` from display components; extract only the active-tab nav into a small `TokensNavClient` client component

- **[CODE_QUALITY] ComponentCard uses `window.location.href` bypassing Next.js router and prefetching**
  - File: `apps/admin/src/components/dashboard/ComponentCard.tsx:77`
  - Impact: Full page reload on navigation; Next.js prefetching does not apply; SPA navigation model broken; redundant with outer `<Link>` that already handles navigation
  - Evidence: Line 77: `onClick={() => { window.location.href = \`/components/${health.tagName}\`; }}`inside Details button; card is already wrapped in`<Link>` at line 33
  - Fix: Remove the `window.location.href` onClick; let the outer `<Link>` handle navigation

- **[CODE_QUALITY] `globSync` from node:fs requires Node 22 but monorepo engines field allows Node 20**
  - File: `apps/admin/src/app/api/tests/run/route.ts:3`
  - Impact: `POST /api/tests/run` throws `TypeError` at runtime on Node 20; test runner API silently fails on any deployment using Node 20; CI installs Node 20
  - Evidence: Line 3: `import { globSync } from 'node:fs'`; `node:fs.globSync` was added in Node v22.0.0; `package.json` engines: `node>=20.0.0`
  - Fix: Replace with `glob` package already in devDependencies: `import { globSync } from 'glob'`

- **[TYPE_SAFETY] 6 `@query`-decorated fields use `!` non-null assertion instead of nullable type declarations**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:119`
  - Impact: `@query` returns `null` before `firstUpdated`; `!` removes `undefined` from type allowing unsafe access; maintenance trap where future code omitting `?.` guards compiles but crashes
  - Evidence: `hx-checkbox.ts:119`, `hx-select.ts:134`, `hx-radio-group.ts:105`, `hx-switch.ts:180`, `hx-text-input.ts:131`, `hx-textarea.ts:152` all use `@query` with `!`
  - Fix: Remove `!` from all six declarations; type as `HTMLInputElement|null`; update `_updateValidity` calls to use `?? undefined` guard

- **[TYPE_SAFETY] 11 `render()` overrides lack `TemplateResult` return type annotation**
  - File: `packages/hx-library/src/components/hx-button/hx-button.ts:107`
  - Impact: Uncovered conditional branches returning `undefined` not caught by `noImplicitReturns`; Lit rendering contract unenforced at compile time
  - Evidence: `hx-button.ts:107`, `hx-alert.ts:172`, `hx-checkbox.ts:239`, `hx-select.ts:286`, `hx-radio-group.ts:320`, `hx-switch.ts:237`, `hx-text-input.ts:273`, `hx-textarea.ts:315`, `hx-form.ts:280`, `hx-card.ts:110`, `hx-radio.ts:104`
  - Fix: Annotate each as `override render(): TemplateResult`; import `TemplateResult` from `'lit'`

- **[TYPE_SAFETY] 9 Lit lifecycle overrides use `Map<string,unknown>` instead of `PropertyValues<this>`**
  - File: `packages/hx-library/src/components/hx-checkbox/hx-checkbox.ts:132`
  - Impact: Missing compile-time validation that `changedProperties.has()` references real declared property names; typos in property names are silently ignored
  - Evidence: `hx-checkbox.ts:132`, `hx-select.ts:153`, `hx-radio-group.ts:137,154`, `hx-radio.ts:68`, `hx-switch.ts:118`, `hx-prose.ts:66`, `hx-text-input.ts:158`, `hx-textarea.ts:179`
  - Fix: Import `PropertyValues` from `'lit'`; replace all `Map<string,unknown>` parameter types with `PropertyValues<this>`

- **[TYPE_SAFETY] `JSON.parse` result cast without runtime validation in 9 locations**
  - File: `apps/admin/src/lib/issues-loader.ts:60`
  - Impact: Malformed JSON or schema changes produce runtime crashes with no type error; no validation of file contents before assuming shape
  - Evidence: `loadIssues():61`, `loadReviewsIndex():83`, `cem-parser.ts:167`, `health-history-reader.ts:51`, `vrt-analyzer.ts:81`, `test-results-reader.ts:222,279`, `a11y-analyzer.ts:237` all use `as SomeType` directly on `JSON.parse()` output
  - Fix: Use `unknown` as intermediate type; add type guard or Zod schema validation before casting

- **[CODE_QUALITY] `getLibraryRoot()` function body duplicated identically in 14 separate analyzer files**
  - File: `apps/admin/src/lib/token-compliance-analyzer.ts:51`
  - Impact: Library path change requires 14 manual edits; divergence risk is high; maintenance defect violating DRY principle
  - Evidence: `function getLibraryRoot(): string { return resolve(process.cwd(), '../../packages/hx-library'); }` is identically duplicated in all 14 admin lib analyzer files
  - Fix: Create `apps/admin/src/lib/paths.ts` exporting `getLibraryRoot()`; import it in all 14 files; also extract duplicated `readSource()` function present in 6 of the same files

- **[DEPLOYMENT] Astro Hero component reads `NEXT_PUBLIC_` env var prefix that Astro never exposes**
  - File: `apps/docs/src/components/Hero.astro:19`
  - Impact: Storybook link on production docs homepage always renders as `localhost:3151`; the `NEXT_PUBLIC_` prefix is Next.js-specific; Astro requires `PUBLIC_` prefix
  - Evidence: Line 19: `import.meta.env.NEXT_PUBLIC_HELIX_STORYBOOK_URL ?? 'http://localhost:3151'`; `apps/docs/.env.local` also defines `NEXT_PUBLIC_HELIX_STORYBOOK_URL` not `PUBLIC_HELIX_STORYBOOK_URL`
  - Fix: Change to `import.meta.env.PUBLIC_HELIX_STORYBOOK_URL`; rename variable in `.env.local` and Vercel env dashboard

- **[DEPLOYMENT] No npm publish workflow exists in CI**
  - File: `.github/workflows`
  - Impact: Publishing requires manual local execution; no `@next` channel from main; no automated version PR via changesets; CLAUDE.md release pipeline is dead letter
  - Evidence: Only `ci.yml` and `ci-matrix.yml` exist; no `release.yml`, `publish.yml`, or `changeset.yml`; changesets config exists but no automation
  - Fix: Create `.github/workflows/release.yml` using `changesets/action@v1`; configure to create version PR on push to main and publish to npm on merge

- **[PERFORMANCE] Missing `preserveModules:true` in vite.config.ts causes cross-component shared chunks**
  - File: `packages/hx-library/vite.config.ts:42`
  - Impact: Consumer importing only `hx-radio-group` also receives `hx-radio` implementation (13.8KB shared chunk); per-component import isolation is impossible
  - Evidence: `dist/shared/hx-radio-CspCxsJ2.js` bundles both `hx-radio` and `hx-radio-group`; `chunkFileNames` config confirms shared chunks expected; no `preserveModules:true` in output
  - Fix: Add `preserveModules:true` and `preserveModulesRoot:'src'` to `rollupOptions.output`

- **[CODE_QUALITY] Slot-tracking booleans use plain class fields with unconditional `requestUpdate()` instead of `@state`**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:135`
  - Impact: `requestUpdate()` called unconditionally on every `slotchange` even when state did not change; fragile pattern breaks silently if manual call is ever removed; also in `hx-textarea.ts` and `hx-card.ts`
  - Evidence: Lines 135–136: `_hasLabelSlot` and `_hasErrorSlot` are plain private fields; `_handleLabelSlotChange` at line 147 calls `this.requestUpdate()` unconditionally without checking if value changed
  - Fix: Decorate with `@state()`; remove explicit `requestUpdate()` calls; Lit's dirty-checking then only re-renders on actual state changes

- **[CODE_QUALITY] globals.css shimmer animations run infinitely with no prefers-reduced-motion override**
  - File: `apps/admin/src/app/globals.css:70`
  - Impact: Vestibular-impaired users with reduced motion preferences receive continuous infinite shimmer animations throughout test runs
  - Evidence: `.bar-pass`, `.bar-warn`, `.bar-fail`, `.bar-coverage`: `animation: bar-shimmer 3s ease-in-out infinite`; `.animate-resolved-shimmer`: `animation: resolved-shimmer 3s infinite`; `TestProgressBar.tsx:61` applies animation via inline style bypassing CSS media query override
  - Fix: Add `@media (prefers-reduced-motion: reduce) { .bar-pass,.bar-warn,.bar-fail,.bar-coverage,.animate-resolved-shimmer { animation: none; } }`; move `TestProgressBar` animation from inline style to CSS class

- **[ERROR_HANDLING] TestRunnerPanel catch blocks silently swallow streaming errors with no user feedback**
  - File: `apps/admin/src/components/test-runner/TestRunnerPanel.tsx:168`
  - Impact: Network failures, server crashes, and CORS errors return UI to idle with no explanation; user cannot distinguish test completion from silent failure; violates "No silent failures" mandate
  - Evidence: Line 168: `catch {}` wrapping entire streaming fetch; line 159: `catch { // Cached results may not be ready yet }`; none set error state or show user message
  - Fix: Add `error` state variable; set user-readable message in outer catch; render error message below progress bar

- **[ERROR_HANDLING] IssueDetailPanel status update PATCH failure is silently swallowed**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:107`
  - Impact: When PATCH to `/api/issues/{id}` fails, UI reverts visually but user receives zero feedback; no toast, no inline error, no retry affordance
  - Evidence: Lines 107–109: `catch { // Silently fail - user can retry }`
  - Fix: Add `error` state to panel; display inline error message below status select when PATCH fails

- **[TESTING] `vitest.config.ts` has no coverage thresholds enforcing the 80% mandate**
  - File: `packages/hx-library/vitest.config.ts:1`
  - Impact: `npm run test` exits 0 even if coverage drops to 0%; the CLAUDE.md mandate of 80%+ coverage is documented but unenforced; developers can remove tests and CI still passes
  - Evidence: `coverage` config has no `thresholds` key; current 94.85% line coverage is healthy but could regress without gate
  - Fix: Add `thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }` to the coverage config

---

## MEDIUM (fix this month — polish, best practices, maintainability)

---

- **[ACCESSIBILITY] `aria-describedby` in hx-text-input includes helpTextId when help element is not rendered during error state**
  - File: `packages/hx-library/src/components/hx-text-input/hx-text-input.ts:283`
  - Impact: `aria-describedby` references non-existent DOM element; AT treats broken reference as no description; help text silently lost when error shown; same pattern in `hx-textarea.ts:325` and `hx-select.ts:301`
  - Fix: `[hasError ? this._errorId : null, this.helpText && !hasError ? this._helpTextId : null].filter(Boolean).join(' ') || undefined`

- **[ACCESSIBILITY] SVG resolution progress circle in admin dashboard has no accessible label**
  - File: `apps/admin/src/app/page.tsx:416`
  - Impact: Screen reader users cannot determine resolution rate from the SVG ring; violates WCAG 2.1 SC 1.1.1 (A)
  - Fix: Add `aria-hidden=true` to SVG; add `<span className="sr-only">Resolution rate: {resolutionPct}%</span>` adjacent to the visual

- **[ACCESSIBILITY] Health score progress bars convey status by color alone**
  - File: `apps/admin/src/app/page.tsx:510`
  - Impact: Color-only status indication; users who cannot perceive color cannot determine component health; violates WCAG 2.1 SC 1.4.1 Use of Color (A)
  - Fix: Add `role=progressbar`, `aria-valuenow={h.overallScore}`, `aria-valuemin=0`, `aria-valuemax=100`, `aria-label='{h.tagName} health score: {h.overallScore}%'`

- **[ACCESSIBILITY] Recharts RadarChart SVG has no accessible text alternative**
  - File: `apps/admin/src/components/dashboard/HealthRadar.tsx:30`
  - Impact: Screen reader users cannot access radar chart data; violates WCAG 2.1 SC 1.1.1 (A)
  - Fix: Wrap in `<figure>` with `aria-label`; add `<figcaption className="sr-only">` containing a data table of dimensions and scores

- **[ACCESSIBILITY] hx-switch `aria-labelledby` can reference an empty element when no label or slot content provided**
  - File: `packages/hx-library/src/components/hx-switch/hx-switch.ts:262`
  - Impact: Switch with no label has no accessible name; violates WCAG 2.1 SC 4.1.2 (A)
  - Fix: Only set `aria-labelledby` when label or slotted content exists; add console warning when neither is present

- **[ACCESSIBILITY] Admin sidebar nav element has no aria-label**
  - File: `apps/admin/src/app/layout.tsx:63`
  - Impact: Screen reader users navigating by landmarks encounter an unlabeled navigation region
  - Fix: Add `aria-label="Main navigation"` to the nav element

- **[ACCESSIBILITY] External `target=_blank` links give no warning of new tab behavior**
  - File: `apps/admin/src/app/layout.tsx:100`
  - Impact: Unexpected context changes must be communicated in advance; screen reader users may be disoriented
  - Fix: Add `<span className="sr-only">(opens in new tab)</span>` or `aria-label="... (opens in new tab)"` to each external link

- **[ACCESSIBILITY] Docs site skip link targets `#_top` (page top) not main content area**
  - File: `apps/docs/src/components/SkipLink.astro:9`
  - Impact: Skip link sends keyboard users to page top not past navigation; violates WCAG 2.1 SC 2.4.1 (A)
  - Fix: Change `PAGE_TITLE_ID` to reference Starlight main content ID or add `id="main-content"` to main element

- **[SEO] Public docs site marked noindex preventing search engine indexing**
  - File: `apps/docs/astro.config.mjs:57`
  - Impact: Public documentation is invisible to search engines; developers cannot find the library via web search; contradicts the purpose of public docs
  - Fix: Remove `noindex, nofollow` meta tag from Starlight head config in `astro.config.mjs`

- **[SEO] robots.txt blocks all crawlers on both admin and docs sites**
  - File: `apps/admin/public/robots.txt:1`
  - Impact: Admin blocking is appropriate but docs blocking prevents all SEO; docs site content cannot be discovered via web search
  - Fix: Keep admin `Disallow: /`; change docs `robots.txt` to `Allow: /`

- **[SEO] 25+ empty `alt=""` on technology logos in docs showcase serving as content identifiers**
  - File: `apps/docs/src/components/showcase/stack/StackBundleSize.astro:179`
  - Impact: Technology logos marked as decorative; screen reader users miss technology stack information
  - Fix: Add descriptive alt: `alt="Lit 3.x logo"`, `alt="Vitest testing framework logo"`, etc. for all content-bearing logos

- **[SEO] No per-page metadata on any admin route except root layout**
  - File: `apps/admin/src/app/health/page.tsx:1`
  - Impact: Every admin sub-page shares generic root layout title; browser tabs, history, and bookmarks show no page-specific information
  - Fix: Add `export const metadata: Metadata = { title: '...' }` to each page; use `generateMetadata` for dynamic `[tag]` pages

- **[CODE_QUALITY] Dashboard page.tsx is 992 lines with inline helper components**
  - File: `apps/admin/src/app/page.tsx:1`
  - Impact: File difficult to test, code-split, or review; data loading, presentation logic, and three helper components co-located
  - Fix: Extract `KpiCard`, `SectionCard`, and CTA blocks into `/src/components/dashboard/` files; aim for <300 lines

- **[CODE_QUALITY] Hardcoded brand hex color values in admin dashboard violate design token requirement**
  - File: `apps/admin/src/app/page.tsx:160`
  - Impact: Six hardcoded hex values create multiple sources of truth; repeated verbatim in `layout.tsx`; violates zero-tolerance "no hardcoded values" policy
  - Fix: Extract to Tailwind CSS variables or shared constants; apply via `className`; remove `@design-system-approved` comment workaround

- **[CODE_QUALITY] hx-radio-group `hasError` ignores `_hasErrorSlot` state**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:321`
  - Impact: Slot-only errors do not apply `fieldset--error` class or `aria-invalid`; error slot pattern silently broken
  - Fix: Change to `const hasError = !!this.error || this._hasErrorSlot`

- **[PERFORMANCE] TrendChart SVG `linearGradient` uses static `id="gradient"` causing DOM collision**
  - File: `apps/admin/src/components/health/TrendChart.tsx:89`
  - Impact: Multiple TrendChart instances share the same gradient definition; whichever rendered last wins; charts display wrong colors
  - Fix: Use React 18 `useId()` to generate unique gradient ID per instance

- **[PERFORMANCE] 100ms `setInterval` triggers 10 React re-renders per second during test runs**
  - File: `apps/admin/src/components/test-runner/TestRunnerPanel.tsx:87`
  - Impact: Unnecessary CPU overhead; display has 1 decimal second precision so 250ms updates are indistinguishable from 100ms updates
  - Fix: Increase interval to 250ms (4 updates/sec vs 10 — 60% fewer re-renders)

- **[PERFORMANCE] `getTestResultsForComponent()` called N times in render loop re-reading same file**
  - File: `apps/admin/src/app/components/page.tsx:43`
  - Impact: 12 components × 1 file read = 12 unnecessary disk reads of the same `test-results.json` per page load
  - Fix: Call `getAllTestResults()` once before the map; look up per-component data from pre-loaded results

- **[DEPLOYMENT] Changeset `access` set to `restricted` blocking public npm publish**
  - File: `.changeset/config.json:8`
  - Impact: Combined with `private:true` on packages, publishing is blocked at two layers; `restricted` requires paid npm org membership
  - Fix: Change to `access:public`; add `ignore` list for private app packages

- **[DEPLOYMENT] CI VRT step uses `sleep 5` instead of readiness check**
  - File: `.github/workflows/ci.yml:84`
  - Impact: On loaded runners Storybook server may not be ready; VRT tests fail with connection refused producing false-negative CI failures
  - Fix: Replace `sleep 5` with `npx wait-on http://localhost:3151 --timeout 30000`

- **[DEPLOYMENT] CI matrix tests Node 18 which violates the engines field declaring Node >=20**
  - File: `.github/workflows/ci-matrix.yml:33`
  - Impact: Testing unsupported runtime creates false confidence; Node 18 reached end-of-life April 2025
  - Fix: Remove `18` from matrix; or update `engines` to `>=18.0.0` if Node 18 support is intentional

- **[TESTING] 21 instances of `setTimeout(r, 50)` as async synchronization creating flaky test risk**
  - File: `packages/hx-library/src/components/hx-button/hx-button.test.ts:175`
  - Impact: On loaded CI machines 50ms may be insufficient for Chromium focus events or slot changes; also adds ~1 second of artificial delay
  - Fix: Replace with `await el.updateComplete` for Lit property changes; `oneEvent(slot, 'slotchange')` for slot events; `page.waitForFunction` for focus state

- **[TESTING] Admin app has zero test coverage — health scorer and grading algorithm completely untested**
  - File: `apps/admin`
  - Impact: `calculateGrade()` multi-branch penalty logic, `mergeResults()` test aggregation, `parseVitestJson()` schema parsing all untested; a bug silently mis-grades all components
  - Fix: Add `vitest.config.ts` to admin app; write unit tests for `calculateGrade()`, `parseVitestJson()`, `getCoverageForComponent()`, `mergeResults()`

- **[TESTING] hx-button keyboard tests call `btn.click()` manually defeating keyboard behavior verification**
  - File: `packages/hx-library/src/components/hx-button/hx-button.test.ts:183`
  - Impact: Tests pass even if keyboard handler is broken; `btn.click()` is what fires `hx-click`, not the keyboard event
  - Fix: Remove `btn.click()`; dispatch keyboard event only and await `el.updateComplete`; test should verify keyboard event alone triggers `hx-click`

---

## LOW (backlog — minor improvements, nice-to-haves)

---

- **[CODE_QUALITY] hx-radio internal ID uses stale `wc-radio-` prefix (missed in token migration)**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio.ts:79`
  - Fix: Change to `hx-radio-${Math.random().toString(36).slice(2, 9)}`

- **[CODE_QUALITY] hx-radio-group JSDoc references `<wc-radio>` and `<wc-radio-group>` tag names**
  - File: `packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts:9`
  - Fix: Replace `<wc-radio>` with `<hx-radio>` and `<wc-radio-group>` with `<hx-radio-group>` in lines 9 and 15; same fix in `hx-radio.ts:8`

- **[CODE_QUALITY] `@keyframes wc-badge-pulse` uses old `wc-` prefix in hx-badge stylesheet**
  - File: `packages/hx-library/src/components/hx-badge/hx-badge.styles.ts:92`
  - Fix: Rename to `hx-badge-pulse` in both `@keyframes` declaration and `animation` property reference

- **[CODE_QUALITY] Magic number `550` used as estimated test count with no constant or explanation**
  - File: `apps/admin/src/components/test-runner/TestRunnerPanel.tsx:188`
  - Fix: Extract to `const ESTIMATED_TEST_COUNT = 550` with comment; actual count is now 563 and will continue growing

- **[TYPE_SAFETY] `as unknown as Node` double-cast in test-utils for axe-core bypasses type safety**
  - File: `packages/hx-library/src/test-utils.ts:77`
  - Fix: Replace with `@ts-expect-error` with explanatory comment linking to axe-core issue; safer because it fails if incompatibility is ever fixed

- **[DEPLOYMENT] Husky `prepare` script uses legacy `require()` syntax that fails silently in ESM context**
  - File: `package.json:72`
  - Impact: `npm ci` always silently throws; git hooks may not install for new developers
  - Fix: Replace with `"prepare": "husky"` which is the correct husky v9 command

- **[DEPLOYMENT] GitHub Actions pinned to mutable major version tags not immutable SHAs**
  - File: `.github/workflows/ci.yml:39`
  - Fix: Pin all actions to full commit SHAs; add `.github/dependabot.yml` with `package-ecosystem: github-actions` for automated updates

- **[DEPLOYMENT] Docs and Storybook apps have no `lint` script — turbo lint silently skips them**
  - File: `apps/docs/package.json`
  - Fix: Add `"lint": "eslint src/"` to both `apps/docs/package.json` and `apps/storybook/package.json`

- **[DEPLOYMENT] `storybook:build` turbo task is dead code — no package defines this script**
  - File: `turbo.json:34`
  - Fix: Remove the `storybook:build` task definition from `turbo.json` lines 34–37

- **[SEO] Docs site title inconsistency — config uses `HELiX` instead of `HELIX`**
  - File: `apps/docs/astro.config.mjs:42`
  - Fix: Standardize to `'HELIX Documentation'` throughout config

- **[TESTING] CLAUDE.md test count is wildly outdated — says 112 tests, actual is 563**
  - File: `CLAUDE.md`
  - Fix: Update to reflect 563 tests across 14 components with `hx-` prefix naming

- **[TESTING] hx-prose `lg` size variant has no test coverage**
  - File: `packages/hx-library/src/components/hx-prose/hx-prose.test.ts:40`
  - Fix: Add test for `size="lg"` attribute reflection and `--hx-prose-font-size` custom property application

---

## STATS

- Total issues found: 91
- Critical: 16 | High: 35 | Medium: 25 | Low: 15
- Files reviewed: ~404 source files across 4 apps and 2 packages
- API routes reviewed: 8 (issues, issues/[id], tests/run, reviews, reviews/[date], tokens, tokens/[category], health)
- Components reviewed: 57 (11 Lit components + 46 React/Astro components)
- Test files reviewed: 14 (hx-library component test suite)

---

## TOP 10 PRIORITY FIXES

1. **Rotate Vercel API token immediately** — live credential in version-tracked files
2. **Fix hx-form/hx-card/hx-alert @fires JSDoc mismatches** — CEM documents non-existent events; Drupal consumers get nothing
3. **Add authentication to all admin API routes** — unauthenticated write endpoints including child process spawning
4. **Remove `private:true` and fix `exports` to point to `dist/`** — publishing and npm consumption are both broken
5. **Fix hx-radio keyboard handler** — Space/Enter do nothing on radio buttons; critical healthcare form accessibility
6. **Fix path traversal in review API** — unauthenticated file read outside intended directory
7. **Fix `sideEffects` field** — unblocks all tree-shaking for downstream consumers; zero-risk change
8. **Add `loading.tsx`, `error.tsx`, `not-found.tsx` to admin** — pages crash silently with no recovery
9. **Fix Astro Hero env var prefix** — Storybook link is broken in production right now
10. **Add coverage thresholds to vitest.config.ts** — 80% mandate is documented but completely unenforced
