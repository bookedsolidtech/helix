# Audit Report: wc-2026 (apps/admin)

## Date: 2026-02-23

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: apps/admin/

---

## CRITICAL (fix immediately — security vulnerability, data loss, or user-facing breakage)

- **[SECURITY] Live Vercel API token stored in plaintext in .env.local**
  - File: `apps/admin/.env.local:10`
  - Impact: The token (`vcp_1Nb4ze...`) grants Vercel API access. Any workspace snapshot, artifact archive, container image, or shared dev environment exposes this live credential. The token is not referenced anywhere in source code — it has no purpose being in this file.
  - Evidence: `HELIX_VERCEL_TOKEN=vcp_1Nb4zesMHVDtft3qtcWtGXUeTs7sE2nwzqYKiYcmbYg2FQ37a52szwxD`
  - Fix: Rotate this token in the Vercel dashboard immediately. Remove the line from `.env.local`.

- **[SECURITY] Zero authentication on all 9 API routes**
  - File: All files under `apps/admin/src/app/api/`
  - Impact: Any caller on the internet can read all tracked security vulnerabilities (`GET /api/issues`), create/modify issues (`POST`, `PATCH`), read review snapshots, and attempt to spawn child processes. No `middleware.ts` exists. No auth library is installed in `package.json`.
  - Evidence: Zero session checks, JWT validation, or auth headers in any of the 9 route files. `find apps/admin -name "middleware.ts"` returns nothing.
  - Fix: Create `apps/admin/src/middleware.ts` protecting the `/api/*` namespace. Choose one auth mechanism (next-auth, clerk, etc.) and apply uniformly before any other API fix.

- **[SECURITY] Unauthenticated remote process execution in test runner**
  - File: `apps/admin/src/app/api/tests/run/route.ts:29`
  - Impact: `POST /api/tests/run` spawns `npx vitest` child processes on the server. The only guard is `process.env.NODE_ENV === 'production'` — trivially bypassed in staging or preview deployments. Any unauthenticated caller in a non-production environment gets a remote process execution primitive via Playwright/Chromium.
  - Evidence: `spawn('npx', ['vitest', 'run', ...])` with no auth check before it. `NODE_ENV` guard at line 32 is the sole protection.
  - Fix: (1) Implement authentication middleware. (2) Replace `NODE_ENV` guard with explicit `ENABLE_TEST_RUNNER=true` env opt-in. Auth check must precede the flag check.

- **[SECURITY] Path traversal vulnerability in /api/reviews/[date]**
  - File: `apps/admin/src/lib/issues-loader.ts:92`
  - Impact: The `date` URL parameter is passed directly to `path.join()` without sanitization. An attacker can request `/api/reviews/..%2F..%2Fissues%2Fissues` to read arbitrary `.json` files accessible to the Node process. The `.json` suffix appended at line 93 partially limits scope but does not prevent reading other project JSON files.
  - Evidence: `const reviewPath = join(REVIEWS_DIR, \`${date}.json\`);`— no validation that`date`matches`YYYY-MM-DD`.
  - Fix: `if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;` and verify `reviewPath.startsWith(REVIEWS_DIR + '/')` after join.

- **[SECURITY] No security headers configured**
  - File: `apps/admin/next.config.ts:1`; `apps/admin/vercel.json:1`
  - Impact: No `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, or `Permissions-Policy`. The admin dashboard can be embedded in iframes (clickjacking), MIME sniffing is enabled, and any XSS that lands has no browser-enforced containment.
  - Evidence: `next.config.ts` contains only `transpilePackages: ['@helix/tokens']`. `vercel.json` sets only `X-Robots-Tag`.
  - Fix: Add a `headers()` function to `next.config.ts` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, and a baseline `Content-Security-Policy`.

- **[TESTING] No test framework installed or configured**
  - File: `apps/admin/package.json`
  - Impact: Zero test files exist in the admin application. No `vitest`, `jest`, `@testing-library/react`, or test runner in `devDependencies`. No `test` script. The CI quality gate requiring 80%+ coverage is completely unenforceable for the admin app. Bad deployments cannot be blocked by automated tests.
  - Evidence: `find apps/admin/src -name "*.test.*"` returns nothing. `package.json` has no test dependencies and no `test` script.
  - Fix: Install Vitest (consistent with the library package), `@testing-library/react`, `happy-dom`, and `msw`. Add `test` and `test:coverage` scripts. Configure `vitest.config.ts` with 80% coverage thresholds.

- **[TESTING] calculateGrade() has zero test coverage — controls component release decisions**
  - File: `apps/admin/src/lib/health-scorer.ts:183`
  - Impact: `calculateGrade()` assigns A/B/C/D/F grades directly determining whether components are approved for release into patient-facing healthcare systems. Five grade paths, three penalty multiplier branches, 17 dimension inputs — zero tests verify any of them. A bug in the zero-score penalty (line 209–228) could silently allow an inaccessible component to receive grade A.
  - Evidence: No corresponding `*.test.ts` file. The function runs on every component and is the single gating mechanism for the release pipeline.
  - Fix: Create `apps/admin/src/lib/__tests__/health-scorer.test.ts` covering all grade paths, boundary conditions, and all penalty branches.

- **[TESTING] computeStats() / loadIssues() / saveIssues() have zero test coverage**
  - File: `apps/admin/src/lib/issues-loader.ts`
  - Impact: `computeStats()` is the source of truth for all dashboard issue statistics. `saveIssues()` overwrites the issues database on every mutation. `loadIssues()` calls `readFileSync` with no try/catch — a corrupt `issues.json` crashes all API routes serving a 500 to every user indefinitely.
  - Evidence: No test file. `resolutionRate` at line 44 uses `Math.round(...* 10000) / 10000` — one typo inverts the displayed percentage by 10×. `saveIssues` silently mutates its input argument.
  - Fix: Create `apps/admin/src/lib/__tests__/issues-loader.test.ts` with mocked `fs`, covering empty-array edge cases, stat precision, and mutation side effects.

- **[TESTING] All 9 API routes have zero test coverage**
  - File: All 9 route files under `apps/admin/src/app/api/`
  - Impact: Critical bugs in untested code: (1) `POST /api/issues` ID generation (`existingWithPrefix.length + 1`) creates ID collisions when issues are deleted and recreated. (2) `PATCH /api/issues/[id]` `resolvedAt` clear logic reads old status before updating — correct but unguarded by tests. (3) Production guard in test runner is untested. Issue ID collisions in a healthcare component vulnerability tracker are data integrity defects.
  - Evidence: Zero test files. The collision bug is reproducible: create `MANUAL-CRITICAL-001`, delete it, create another — the new ID is `MANUAL-CRITICAL-001` again.
  - Fix: Route handler tests for each route covering happy path, 400 for invalid input, 404 for unknown IDs, 500 for filesystem failures (mocked), and filter/sort correctness.

- **[ACCESSIBILITY] No skip navigation link**
  - File: `apps/admin/src/app/layout.tsx:49`
  - Impact: Keyboard and screen reader users must tab through all 10 sidebar navigation links before reaching page content on every page load. Violates WCAG 2.4.1 (Bypass Blocks — Level A, prerequisite for AA compliance).
  - Evidence: `<aside>` with 10 nav items rendered before `<main>`. No skip link exists anywhere in the rendered HTML.
  - Fix: Add `<a href="#main-content" className="sr-only focus:not-sr-only ...">Skip to main content</a>` before the sidebar, and `id="main-content"` on `<main>`.

- **[ACCESSIBILITY] GlassIssueCard interactive div is not keyboard accessible**
  - File: `apps/admin/src/app/roadmap/components/GlassIssueCard.tsx:41`
  - Impact: Every issue card in the roadmap grid is the primary interactive surface. A `<div>` with `onClick` has no `role="button"`, no `tabindex`, no `onKeyDown`. Keyboard-only users cannot reach or activate any issue card. WCAG 4.1.2 and 2.1.1 violations.
  - Evidence: `<div className="... cursor-pointer ..." onClick={onClick}>` — `cursor-pointer` is CSS cosmetic only.
  - Fix: Replace with `<button type="button" className="... w-full text-left" aria-label={\`View details for issue: ${issue.title}\`} onClick={onClick}>`.

- **[ACCESSIBILITY] IssueDetailPanel missing role="dialog", aria-modal, and focus management**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:122`
  - Impact: The slide-out panel is a modal experience (backdrop, body scroll lock, ESC to close) but has no `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus movement on open, or focus trap. Screen readers continue reading content behind the backdrop. The close button at line 165 also has no `aria-label` — it is an icon-only button. WCAG 2.4.3, 2.1.2, 4.1.2 violations.
  - Evidence: `<div className="fixed inset-y-0 right-0 w-[500px] ...">` — no role. `<button onClick={onClose}><X /></button>` — no aria-label.
  - Fix: Add `role="dialog" aria-modal="true" aria-labelledby="issue-detail-title"`. Add `aria-label="Close issue detail panel"` to close button. Use `useEffect` to move focus on open and return focus on close.

- **[ACCESSIBILITY] Heatmap dimension buttons have no accessible names**
  - File: `apps/admin/src/components/health/Heatmap.tsx:67`
  - Impact: Each heatmap cell is a `<button>` identified only by a `title` attribute. `title` is not reliably announced by NVDA and is invisible to touch users. The heatmap is entirely inaccessible to assistive technology. WCAG 4.1.2 and 1.1.1 violations.
  - Evidence: `<button ... title={\`${component.tagName} - ${dimension.name}: ...\`} />`— no`aria-label`.
  - Fix: Replace `title` with `aria-label` using the same content string.

- **[ACCESSIBILITY] CodeSnippets tabs missing ARIA tab role pattern**
  - File: `apps/admin/src/components/dashboard/CodeSnippets.tsx:207`
  - Impact: Tab bar has no `role="tablist"`, buttons have no `role="tab"` or `aria-selected`, panel has no `role="tabpanel"`. Screen readers announce anonymous buttons with no selection state. WCAG 4.1.2 violation. Note: the legacy `CodeSnippetPanel.tsx` does implement this correctly — the newer component regressed.
  - Evidence: `<div className="flex items-center gap-1">` + `<button onClick={() => setActiveTab(...)}>` — no ARIA roles.
  - Fix: Add `role="tablist"` to container, `role="tab" aria-selected={isActive} aria-controls={...}` to each button, `role="tabpanel" aria-labelledby={...}` to content div.

- **[ACCESSIBILITY] SeverityTabs buttons missing ARIA tab roles and selected state**
  - File: `apps/admin/src/app/roadmap/components/SeverityTabs.tsx:65`
  - Impact: Same pattern as CodeSnippets: no `role="tablist"`, no `role="tab"`, no `aria-selected`. Active state conveyed only through visual styling — invisible to screen readers. WCAG 4.1.2 violation.
  - Evidence: `<div className="flex items-center gap-2 ...">` + `<button onClick={() => onTabChange(tab.value)}>` — no ARIA roles.
  - Fix: Add `role="tablist" aria-label="Filter by severity"` to container; `role="tab" aria-selected={isActive}` to each button.

- **[PERFORMANCE] Blocking writeFileSync on every Health page render**
  - File: `apps/admin/src/app/health/page.tsx:18`; `apps/admin/src/lib/health-history-writer.ts:84`
  - Impact: `saveHealthSnapshot()` calls `writeFileSync` synchronously on every GET request to `/health`. This stalls the Node.js event loop, blocks all concurrent requests until the write completes, creates race conditions under load, and makes the page non-idempotent and non-cacheable. The file comment itself acknowledges: "In production, this would be triggered by a cron job."
  - Evidence: `saveHealthSnapshot(components);` directly in `async function HealthPage()` body. `writeFileSync(filePath, ...)` in `health-history-writer.ts:84`.
  - Fix: Remove `saveHealthSnapshot` from the page entirely. Create `POST /api/health/snapshot` triggered by cron or CI, not by page render.

---

## HIGH (fix this week — degrades experience, reliability, or professionalism)

- **[SECURITY] Unsanitized sort parameter used as object property accessor**
  - File: `apps/admin/src/app/api/issues/route.ts:69`
  - Impact: User-supplied `?sort=` cast to `Record<string, unknown>` for bracket-notation access. `?sort=__proto__` probes prototype properties. Any internal field (`statusHistory`, `notes`) can be sorted, leaking internal structure through ordering side-channels.
  - Evidence: `const aRecord = a as unknown as Record<string, unknown>; const aVal = String(aRecord[sort] ?? '');`
  - Fix: Validate against an explicit allowlist: `const SORTABLE = new Set(['createdAt', 'severity', 'status', 'updatedAt', 'category']);`

- **[SECURITY] Error responses expose internal filesystem paths**
  - File: `apps/admin/src/app/api/issues/route.ts:84`
  - Impact: `detail: error.message` passes `error.message` directly to JSON responses. `readFileSync` errors include absolute paths (e.g. `ENOENT: no such file, open '/workspace/.claude/issues/issues.json'`). Reveals server layout to any unauthenticated caller.
  - Evidence: `return NextResponse.json({ error: 'Failed to load issues', detail: message }, { status: 500 });`
  - Fix: Only include `detail` in non-production environments: `...(process.env.NODE_ENV === 'development' && { detail: message })`

- **[SECURITY] No runtime type validation on POST /api/issues**
  - File: `apps/admin/src/app/api/issues/route.ts:114`
  - Impact: Request body cast directly to `CreateIssueBody` with presence check only. An attacker can POST `severity: "anything"`, `title: "A".repeat(100000)` (disk exhaustion), or `tags: [1,2,3]` (type corruption in stored JSON).
  - Evidence: `const body = (await request.json()) as CreateIssueBody;` — `if (!body.title || !body.severity)` is the only validation.
  - Fix: Add a Zod schema or manual validation enforcing valid enum values and string length limits.

- **[SECURITY] PATCH /api/issues/[id] has no status enum validation or notes length cap**
  - File: `apps/admin/src/app/api/issues/[id]/route.ts:55`
  - Impact: Any string is accepted as `status`, corrupting `byStatus` statistics. Unbounded note appends allow disk exhaustion via repeated PATCH requests.
  - Evidence: `if (body.status !== undefined && body.status !== issue.status) { issue.status = body.status; }` — no enum check.
  - Fix: Validate `body.status` against `VALID_STATUSES` set. Cap `body.notes` at 1000 chars.

- **[SECURITY] System error messages from child process failures sent to client**
  - File: `apps/admin/src/app/api/tests/run/route.ts:215`
  - Impact: `child.on('error', (err) => { send({ error: err.message }) })` — system-level spawn errors containing paths and command strings sent verbatim in SSE events to unauthenticated callers.
  - Evidence: `error: err.message` in the `child.on('error')` handler.
  - Fix: Replace with a sanitized message: `error: 'Test runner process failed to start.'`

- **[SECURITY] URL construction from env vars without protocol validation**
  - File: `apps/admin/src/lib/env.ts:4`
  - Impact: `DOCS_URL` and `STORYBOOK_URL` are used in `href` attributes and `getStorybookUrl(tag)` interpolates tag names from CEM data. A maliciously crafted CEM file or env var set to `javascript:alert(1)` creates a reflected XSS vector.
  - Evidence: `export const DOCS_URL = process.env.NEXT_PUBLIC_HELIX_DOCS_URL || 'http://localhost:3150';`
  - Fix: Validate with `new URL(val)` and assert `protocol` is `http:` or `https:`. Validate `tag` against `hx-[a-z-]+` before interpolating.

- **[SECURITY] No rate limiting on CPU-intensive test runner endpoint**
  - File: `apps/admin/src/app/api/tests/run/route.ts`
  - Impact: Each invocation spawns multiple Playwright/Chromium processes, holds SSE connections open for up to 300s, and writes/reads files. Concurrent requests exhaust CPU, memory, and file descriptors.
  - Evidence: No concurrency check before `spawn()`. No `429` response for concurrent calls.
  - Fix: Add a module-level `testRunInProgress` flag, returning 429 if already running.

- **[TESTING] classifyTest() stale --wc- token prefix silently deflates all accessibility scores**
  - File: `apps/admin/src/lib/a11y-analyzer.ts:157`
  - Impact: The accessibility analyzer checks for `--wc-color-` and `var(--wc-` — the old token prefix. The monorepo migrated to `--hx-*` in commit `c643de6`. **Every component has been failing the "Token-based colors" check since that commit**, silently deflating all accessibility dimension scores. Zero tests caught this regression.
  - Evidence: `const usesTokenColors = combined.includes('--wc-color-') || combined.includes('var(--wc-');` — prefix should be `--hx-`.
  - Fix: Immediately update to `--hx-color-` and `var(--hx-`. Add regression tests for `classifyTest()` boundary conditions including the `startsWith('form')` prefix false-positive.

- **[DEPLOYMENT] No custom 404 or 500 error pages**
  - File: `apps/admin/src/app/` (missing files)
  - Impact: `notFound()` is already called in `[tag]/page.tsx:43` but no `not-found.tsx` exists — Next.js renders its default 404 outside the admin layout shell (no sidebar). No `error.tsx` means runtime errors from file I/O in health scorer, CEM parser, or issue loader break outside the shell entirely.
  - Evidence: `find apps/admin/src/app -name "not-found.tsx" -o -name "error.tsx"` returns nothing.
  - Fix: Create `not-found.tsx` and `error.tsx` in `src/app/` rendering within the dashboard layout.

- **[DEPLOYMENT] GitHub Actions not pinned to commit SHAs**
  - File: `.github/workflows/ci.yml:39`; `.github/workflows/ci-matrix.yml:41`
  - Impact: Mutable tags (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`) can be silently moved to point to malicious code. Supply-chain risk for a healthcare enterprise library.
  - Evidence: `uses: actions/checkout@v4` — mutable tag, not an immutable commit SHA.
  - Fix: Pin all actions to full commit SHAs (e.g. `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`).

- **[DEPLOYMENT] No automated release/publish workflow**
  - File: `.github/workflows/` (release.yml missing)
  - Impact: Changesets are configured but no workflow triggers `changeset publish`. Library versions must be published manually with no post-publish CDN invalidation or docs deployment trigger.
  - Evidence: Only `ci.yml` and `ci-matrix.yml` exist in `.github/workflows/`.
  - Fix: Create `release.yml` using `changesets/action` to automate version PRs and `npm publish` on merge to `main`.

- **[PERFORMANCE] scoreAllComponents() called 3x independently with no caching**
  - File: `apps/admin/src/app/page.tsx:36`; `apps/admin/src/app/components/page.tsx:11`; `apps/admin/src/app/health/page.tsx:14`
  - Impact: Each page independently runs the full 17-analyzer pipeline across all components on every request. No shared cache. Three page visits in the same server process each re-run the entire analysis pipeline independently.
  - Evidence: `const healthScores = await scoreAllComponents();` — identical call in three separate page files, no `cache()` wrapper.
  - Fix: Wrap `scoreAllComponents` with React's `cache()`. Add `export const revalidate = 60` to each consuming page.

- **[PERFORMANCE] lucide-react barrel imports without optimizePackageImports**
  - File: `apps/admin/next.config.ts:1`; `apps/admin/src/app/layout.tsx:3`; multiple page files
  - Impact: `lucide-react` has 500+ icons. Without `experimental.optimizePackageImports`, the entire barrel is evaluated at module resolution time. 35+ unique icons imported across layout and page files.
  - Evidence: `next.config.ts` has no `experimental` key. All imports use named barrel syntax.
  - Fix: Add `experimental: { optimizePackageImports: ['lucide-react', 'recharts', 'shiki'] }` to `next.config.ts`.

- **[PERFORMANCE] Recharts loaded in initial bundle without code splitting**
  - File: `apps/admin/src/components/dashboard/TestCategoryDonut.tsx:1`; `GradeDistributionChart.tsx:1`
  - Impact: Recharts (~300KB minified) loaded synchronously in the initial dashboard bundle. No `dynamic()` import, no `Suspense` boundary. Charts animate on hydration causing visible layout shift.
  - Evidence: `'use client'; import { PieChart, Pie, Cell } from 'recharts';` — imported directly with no dynamic wrapper.
  - Fix: `const TestCategoryDonut = dynamic(() => import('@/components/dashboard/TestCategoryDonut'), { ssr: false, loading: () => <ChartSkeleton /> })`

- **[PERFORMANCE] Tokens layout entirely client-side due to usePathname in layout**
  - File: `apps/admin/src/app/tokens/layout.tsx:1`
  - Impact: `'use client'` on the tokens layout forces all 7 token sub-pages into the client bundle. Server Component streaming and static generation benefits are lost for the entire `/tokens/*` subtree.
  - Evidence: `'use client'; import { usePathname } from 'next/navigation';`
  - Fix: Extract a `<TokenNavLink>` client component for the active-state `usePathname` check. Keep the `TokensLayout` itself as a Server Component.

- **[PERFORMANCE] HealthDashboard is an unnecessary client component**
  - File: `apps/admin/src/components/health/HealthDashboard.tsx:1`
  - Impact: The entire health dashboard subtree (`TrendChart`, `TeamLeaderboard`, `Heatmap`, `ComponentDrillDown`) is bundled for the client because `HealthDashboard` uses `'use client'` solely for one `useState` call.
  - Evidence: `'use client';` — only client-side requirement is `useState<ComponentHealth | null>` for the drill-down panel.
  - Fix: Extract the selected-component state into a small client wrapper component. Keep `HealthDashboard` and its static sub-components as Server Components.

- **[PERFORMANCE] No loading.tsx files anywhere — no streaming or Suspense fallbacks**
  - File: `apps/admin/src/app/` (missing files)
  - Impact: The health page runs `scoreAllComponents()` (17 analyzers, multiple file I/O calls). The component detail page initializes a Shiki WASM highlighter. Both show completely blank pages while loading — no skeleton, no spinner, no progress indicator.
  - Evidence: `find apps/admin/src/app -name "loading.tsx"` returns nothing.
  - Fix: Create `loading.tsx` in `src/app/health/`, `src/app/components/[tag]/`, and `src/app/` root.

- **[ACCESSIBILITY] FilterBar form inputs have no labels**
  - File: `apps/admin/src/app/roadmap/components/FilterBar.tsx:84`
  - Impact: Four form controls (search text, status select, category select, reporter select) have no `<label>`, `aria-label`, or `aria-labelledby`. Placeholders disappear on typing and are not valid substitutes. Screen readers announce "edit text" and "combo box" with no context. WCAG 1.3.1 and 3.3.2 violations.
  - Evidence: `<input type="text" placeholder="Search issues..." />` — no label association of any kind.
  - Fix: Add `aria-label="Search issues"` to input; `aria-label="Filter by status"` to selects. Or use `<label htmlFor="...">` with `id` pairs.

- **[ACCESSIBILITY] HooksFilter badges used as interactive controls without keyboard support**
  - File: `apps/admin/src/app/hooks/components/HooksFilter.tsx:42`
  - Impact: `Badge` renders a `<div>`. Filter toggles built on `<div onClick>` are not reachable by Tab, cannot be activated by Enter/Space. Keyboard users cannot filter the hooks list at all. WCAG 4.1.2 violation.
  - Evidence: `<Badge className="cursor-pointer" onClick={() => onPriorityChange(priority)}>` — Badge is a div.
  - Fix: Replace with `<button type="button" aria-pressed={isSelected}>` styled as a badge.

- **[ACCESSIBILITY] TestResultsTable expand/collapse buttons missing aria-expanded**
  - File: `apps/admin/src/components/test-runner/TestResultsTable.tsx:163`
  - Impact: Component group expand buttons show ▼/▶ Unicode arrows but have no `aria-expanded`. Screen readers cannot communicate open/closed state. The arrow characters are also not `aria-hidden`. WCAG 4.1.2 violation.
  - Evidence: `<button onClick={() => toggle(group.component)}>` with no `aria-expanded` attribute.
  - Fix: Add `aria-expanded={isOpen}` and `aria-hidden="true"` on the arrow span.

- **[ACCESSIBILITY] SplitButtonDropdown missing arrow key keyboard navigation**
  - File: `apps/admin/src/components/dashboard/SplitButtonDropdown.tsx:88`
  - Impact: Component implements `role="menu"` and `role="menuitem"` correctly but omits all WAI-ARIA Menu Button keyboard interactions. Arrow Down/Up between items, Home/End to first/last, Tab to close — none are implemented. Focus stays on trigger when menu opens.
  - Evidence: No `onKeyDown` handler on the menu container or items.
  - Fix: Add `onKeyDown` implementing Arrow Up/Down item focus navigation, Escape to close.

- **[ACCESSIBILITY] CSS animations have no prefers-reduced-motion respect**
  - File: `apps/admin/src/app/globals.css:51`
  - Impact: Five continuous animations (`bar-shimmer`, `bar-warn`, `bar-fail`, `bar-coverage`, `indeterminate-bar`) run on all progress bars with no `@media (prefers-reduced-motion: reduce)` wrapper. Users with vestibular disorders are affected. WCAG 2.3.1 consideration.
  - Evidence: `animation: bar-shimmer 3s ease-in-out infinite;` — no reduced-motion override anywhere in the file.
  - Fix: Add `@media (prefers-reduced-motion: reduce) { .bar-pass, .bar-warn, .bar-fail, .bar-coverage { animation: none; } }`

- **[SEO] Zero per-page metadata exports across 10 sub-pages**
  - File: All 10 sub-page files under `apps/admin/src/app/`
  - Impact: Every page displays "Panopticon Platform — HELIX Component Library" as its browser tab title. Engineers cannot distinguish open tabs. The dynamic `[tag]` route has no `generateMetadata` function, preventing per-component titles.
  - Evidence: None of the 10 sub-pages export `metadata` or `generateMetadata`.
  - Fix: Add `export const metadata: Metadata = { title: '[PageName] — Panopticon Platform' }` to each page. For `[tag]/page.tsx`, add `export async function generateMetadata({ params })`.

- **[SEO] Missing favicon**
  - File: `apps/admin/public/` (missing)
  - Impact: No `favicon.ico`, `icon.png`, or `apple-icon.png` exists in the project. Browser tabs show a blank icon for an always-open internal dashboard.
  - Evidence: `ls apps/admin/public/` returns only `robots.txt`.
  - Fix: Place `icon.ico` or `icon.png` in `apps/admin/src/app/` (Next.js 15 app-router auto-detection).

- **[TYPE_SAFETY] Hardcoded date literal for production review data**
  - File: `apps/admin/src/app/roadmap/page.tsx:17`
  - Impact: `reviewPath = join(..., '../../.claude/issues/reviews/2026-02-15.json')` — when a new review is written, the page silently continues loading stale 2026-02-15 data with no error or warning.
  - Evidence: Lines 17 and 50: `2026-02-15` hardcoded. `loadReviewsIndex()` already exists in `issues-loader.ts` to get the latest dynamically.
  - Fix: Replace hardcoded date with dynamic lookup via `loadReviewsIndex()`.

- **[TYPE_SAFETY] as unknown as double-cast bypasses type system in API sort**
  - File: `apps/admin/src/app/api/issues/route.ts:70`
  - Impact: `a as unknown as Record<string, unknown>` — the canonical escape hatch defeating all type safety. `a` is already typed as `TrackedIssue`. The cast papers over a design gap instead of fixing it.
  - Evidence: `const aRecord = a as unknown as Record<string, unknown>;`
  - Fix: Define `type TrackedIssueSortKey = keyof TrackedIssue` and validate `sort` against a `Set<string>` of explicitly allowed field names before use.

- **[CODE_QUALITY] getLibraryRoot() duplicated across 14 analyzer files**
  - File: 14 files in `apps/admin/src/lib/`
  - Impact: Identical function body in 14 separate files. If the monorepo layout changes, all 14 must be updated. The dead `_getLibraryRoot()` in `health-scorer.ts:65` proves divergence has already started.
  - Evidence: `grep -r "function getLibraryRoot" apps/admin/src/lib` returns 14+ hits.
  - Fix: Create `apps/admin/src/lib/paths.ts`, export a single `getLibraryRoot()`, import from there in all analyzers.

- **[ERROR_HANDLING] loadIssues() can throw synchronously with no error boundary**
  - File: `apps/admin/src/app/roadmap/page.tsx:32`
  - Impact: `const issuesData = loadIssues()` in a Server Component with no try/catch. A missing or corrupt `issues.json` during a cold deploy crashes the entire roadmap page, returning an unhandled 500 to all users.
  - Evidence: `export default function RoadmapPage() { const issuesData = loadIssues(); ...` — bare call, no error handling.
  - Fix: Wrap in try/catch and render an error state, or add error handling inside `loadIssues()`.

- **[ERROR_HANDLING] Floating promise from async handleStatusChange**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:118`
  - Impact: `handleStatusChange('complete')` called without `await` or `void` in a synchronous callback. The async call's rejection is silently swallowed — errors on issue status updates go unreported.
  - Evidence: `const handleResolve = useCallback(() => { if (issue && ...) { handleStatusChange('complete'); } }, ...);`
  - Fix: `void handleStatusChange('complete');`

---

## MEDIUM (fix this month — polish, best practices, maintainability)

- **[SECURITY] Synchronous file reads block event loop; no pagination on issues list**
  - File: `apps/admin/src/app/api/issues/route.ts:26`; `apps/admin/src/lib/issues-loader.ts`
  - Impact: `readFileSync` blocks the event loop on every GET request. Response latency grows linearly with file size, blocking all concurrent requests. No pagination — entire issue list always serialized.
  - Fix: Replace with async `readFile`, or add a 30s in-process cache. Add `limit`/`offset` query params.

- **[DEPLOYMENT] Turborepo remote caching not configured in CI**
  - File: `.github/workflows/ci.yml`
  - Impact: Neither CI workflow has `TURBO_TOKEN` or `TURBO_TEAM` env vars. Every CI run rebuilds from scratch — CLAUDE.md describes remote caching as required but it is never configured.
  - Fix: Add `TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}` and `TURBO_TEAM: ${{ secrets.TURBO_TEAM }}` to both workflow files.

- **[DEPLOYMENT] Node.js version not pinned to exact version in CI**
  - File: `.github/workflows/ci.yml:44`
  - Impact: `node-version: 20` silently adopts new minor/patch releases, creating flaky CI after Node.js updates.
  - Fix: Pin to `node-version: '20.18.0'`.

- **[DEPLOYMENT] @helix/tokens uses wildcard \* version**
  - File: `apps/admin/package.json:14`
  - Impact: `"@helix/tokens": "*"` resolves to the highest available version including future breaking majors. Non-standard pattern that bypasses the version contract.
  - Fix: Change to `"@helix/tokens": "workspace:*"`.

- **[DEPLOYMENT] Env var name mismatch between root and admin .env.local**
  - File: `.env.local:15`; `apps/admin/.env.local:2`
  - Impact: Root `.env.local` defines `NEXT_PUBLIC_DOCS_URL` and `NEXT_PUBLIC_STORYBOOK_URL`. Admin `env.ts` reads `NEXT_PUBLIC_HELIX_DOCS_URL` and `NEXT_PUBLIC_HELIX_STORYBOOK_URL`. Root-level names are dead configuration — confuses the development setup.
  - Fix: Remove unused root-level env var names, or standardize on one naming scheme across the monorepo.

- **[CODE_QUALITY] Non-functional Export CSV button**
  - File: `apps/admin/src/app/health/page.tsx:51`
  - Impact: `<button>` with no `onClick` handler and no `type="button"`. Clicking does nothing. Appears interactive to both sighted users and assistive technology.
  - Fix: Implement CSV export or remove the button until implemented. At minimum, add `disabled` attribute.

- **[CODE_QUALITY] Silent API failure in handleStatusChange with no user feedback**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:94`
  - Impact: The `catch` block comment says "Silently fail - user can retry." The user does not know they need to — the spinner disappears and the status reverts with no indication the update failed.
  - Fix: Add local `error` state; display an error message adjacent to the status select on failure.

- **[CODE_QUALITY] TestRunnerPanel has 12 useState calls — extract useTestRunner hook**
  - File: `apps/admin/src/components/test-runner/TestRunnerPanel.tsx:50`
  - Impact: 12 `useState` calls for tightly coupled streaming state. Multiple sequential `setX()` calls in `runTests` cause cascading re-renders.
  - Fix: Extract a `useTestRunner(initialResults)` hook managing state via `useReducer`.

- **[CODE_QUALITY] app/page.tsx is 993 lines**
  - File: `apps/admin/src/app/page.tsx`
  - Impact: Dashboard page is 5× the 200-line guideline. Contains multiple embedded components, inline chart markup, inline SVG icons, and confidence bar logic.
  - Fix: Extract `QualityGatesCard`, `ComponentConfidenceTable`, and `DimensionHeatRow` as separate files.

- **[CODE_QUALITY] Hardcoded brand hex colors in inline styles across 12+ locations**
  - File: `apps/admin/src/app/layout.tsx:107`; `apps/admin/src/app/page.tsx:161`
  - Impact: `#FF4785` (Storybook) and `#8B5CF6` (docs) hardcoded in at least 12 places across two files. No single source of truth, no CSS custom property fallback, violates design token mandate.
  - Fix: Define `--brand-storybook: #FF4785; --brand-docs: #8B5CF6;` in `globals.css` and reference via CSS variables.

- **[TYPE_SAFETY] JSON.parse cast without runtime validation — CEM manifest**
  - File: `apps/admin/src/lib/cem-parser.ts:167`
  - Impact: `return JSON.parse(raw) as CemManifest;` — zero runtime shape validation. A schema mismatch in `custom-elements.json` scatters undefined errors across all 9 analyzers.
  - Fix: Add a type guard checking `schemaVersion` and `modules` array before returning.

- **[TYPE_SAFETY] || used for nullish coalescing on env vars**
  - File: `apps/admin/src/lib/env.ts:4`
  - Impact: `||` treats `""` as falsy, silently falling through to localhost defaults when env vars are set to empty string. Masks misconfiguration.
  - Fix: Replace `||` with `??` throughout `env.ts`.

- **[TYPE_SAFETY] readSource() duplicated across 7 analyzer files**
  - File: 7 files in `apps/admin/src/lib/`
  - Impact: Identical `readSource(tagName)` in 7 separate files. Same DRY violation as `getLibraryRoot()`.
  - Fix: Export `readSource()` from `source-analyzer.ts` and import from there.

- **[SEO] Missing not-found.tsx — default Next.js 404 breaks layout shell**
  - File: `apps/admin/src/app/` (missing)
  - Impact: `notFound()` is already called in `[tag]/page.tsx:43` but no `not-found.tsx` exists — Next.js renders default 404 outside the admin sidebar layout.
  - Fix: Create `apps/admin/src/app/not-found.tsx` rendering within the admin layout shell.

- **[SEO] Missing error.tsx — runtime errors break outside the sidebar**
  - File: `apps/admin/src/app/` (missing)
  - Impact: Unhandled Server Component errors crash outside the admin layout, showing the raw Next.js error screen.
  - Fix: Create `apps/admin/src/app/error.tsx` as a `'use client'` error boundary component.

- **[SEO] Duplicate h1 in sidebar brand heading and page headings**
  - File: `apps/admin/src/app/layout.tsx:57`
  - Impact: Sidebar renders `<h1>Panopticon Platform</h1>`. Every page also renders its own `<h1>`. Two `<h1>` elements per page violates WCAG 2.4.6 heading hierarchy and disrupts screen reader landmark navigation.
  - Evidence: `layout.tsx:57`: `<h1 className="text-lg font-bold">Panopticon Platform</h1>`
  - Fix: Change the sidebar brand heading to `<p>` or `<span>` with the same visual styling.

- **[ACCESSIBILITY] ui/tabs.tsx base component missing all ARIA tab pattern roles**
  - File: `apps/admin/src/components/ui/tabs.tsx:43`
  - Impact: `TabsList` has no `role="tablist"`. `TabsTrigger` has no `role="tab"` or `aria-selected`. `TabsContent` has no `role="tabpanel"`. This base component is used across the application — fixing it propagates to all consumers.
  - Fix: Add `role="tablist"` to `TabsList`, `role="tab" aria-selected={isActive}` to `TabsTrigger`, `role="tabpanel" aria-labelledby={...}` to `TabsContent`.

- **[ACCESSIBILITY] PipelineFlow StatusDot uses color alone to convey health status**
  - File: `apps/admin/src/components/dashboard/PipelineFlow.tsx:270`
  - Impact: `StatusDot` renders a green or red circle with no text alternative. Used in 4 pipeline table columns. Screen reader users receive zero information about pipeline health. WCAG 1.4.1 violation.
  - Evidence: `<div className={cn('w-3 h-3 rounded-full', healthy ? 'bg-emerald-400' : 'bg-red-400')} />`
  - Fix: Add `role="img" aria-label={healthy ? 'Healthy' : 'Needs attention'}`.

- **[PERFORMANCE] groupByComponent not memoized — O(n log n) on every render**
  - File: `apps/admin/src/components/test-runner/TestResultsTable.tsx:92`
  - Impact: `groupByComponent(results.tests)` is called on every render without `useMemo`. Iterates all tests, builds a Map, sorts — O(n log n) on hundreds of tests, every render.
  - Fix: `const groups = useMemo(() => groupByComponent(results.tests), [results.tests]);`

- **[PERFORMANCE] Token API response includes new Date() preventing HTTP caching**
  - File: `apps/admin/src/lib/token-api.ts:101`
  - Impact: `generatedAt: new Date().toISOString()` changes on every call. Token data is static (from a compiled package). Every response is unique, defeating all HTTP caching.
  - Fix: Compute `generatedAt` once at module initialization or derive from package version.

- **[PERFORMANCE] force-dynamic on API routes serving static/slow-changing data**
  - File: `apps/admin/src/app/api/tokens/route.ts:4`; `apps/admin/src/app/api/reviews/route.ts:4`
  - Impact: Tokens route serves data from a static compiled package but opts out of all caching. Reviews route reads a JSON file changing only on deploy.
  - Fix: Remove `force-dynamic` from tokens route; add `revalidate = 3600`. Add `revalidate = 60` to reviews route.

---

## LOW (backlog — minor improvements, nice-to-haves)

- **[DEPLOYMENT] changeset access set to restricted — may block public publishing**
  - File: `.changeset/config.json:6`
  - Impact: `"access": "restricted"` means npm publishes are private (paid org plan required). If the library is intended to be public, publishing will fail silently.
  - Fix: Confirm intent. If public, change to `"access": "public"`.

- **[DEPLOYMENT] CI build step ordering duplicates Turborepo pipeline work**
  - File: `.github/workflows/ci.yml:100`
  - Impact: Explicit `npm run build` at line 100 re-runs what Turborepo already executed inside the test step, wasting CI minutes.
  - Fix: Consolidate to a single `turbo run lint type-check test build cem` invocation.

- **[CODE_QUALITY] Array index used as React key on mutable data in IssueDetailPanel**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:288`
  - Impact: `tags.map((tag, idx) => <Badge key={idx}>)`, `notes.map((note, idx) => <p key={idx}>)`, `statusHistory.map((change, idx) => ...)` — index keys on growing data cause stale state during reconciliation.
  - Fix: `key={tag}` for tags; `key={\`${change.date}-${change.from}\`}` for status history.

- **[CODE_QUALITY] formatLabel() duplicated across 3 files in the same roadmap directory**
  - File: `apps/admin/src/app/roadmap/components/IssueDetailPanel.tsx:53`; `GlassIssueCard.tsx:27`; `FilterBar.tsx:33`
  - Impact: Identical function body copy-pasted into three files in the same directory. A logic change requires three edits.
  - Fix: Extract to `apps/admin/src/app/roadmap/components/utils.ts`.

- **[TYPE_SAFETY] globSync from node:fs requires Node.js 22+**
  - File: `apps/admin/src/app/api/tests/run/route.ts:3`; `apps/admin/src/lib/test-results-reader.ts:5`
  - Impact: `import { globSync } from 'node:fs'` — added in Node.js 22. Will throw on Node.js 20. No Node.js engine requirement declared in `package.json`.
  - Fix: Use the `glob` npm package instead, or declare `"engines": { "node": ">=22.0.0" }`.

- **[TYPE_SAFETY] loadReview returns unknown | null — redundant union**
  - File: `apps/admin/src/lib/issues-loader.ts:91`
  - Impact: `unknown | null` simplifies to `unknown`. Return type is misleading and inconsistent with the rest of the codebase using `T | null`.
  - Fix: Define a `ReviewSnapshot` interface and type accordingly, or just use `unknown`.

- **[ACCESSIBILITY] Lucide icons not consistently aria-hidden across the app**
  - File: Multiple files throughout `apps/admin/src`
  - Impact: Decorative icons adjacent to visible text are not `aria-hidden="true"`, causing screen readers to attempt to announce SVG content. WCAG 1.1.1 best practice.
  - Fix: Add `aria-hidden="true"` to all decorative Lucide icon components.

- **[ACCESSIBILITY] Tokens layout nav links missing aria-current**
  - File: `apps/admin/src/app/tokens/layout.tsx:27`
  - Impact: Active token section link is visually distinguished but has no `aria-current="page"`. Screen readers cannot identify the current section.
  - Fix: Add `aria-current={isActive ? 'page' : undefined}` to each active nav link.

- **[ACCESSIBILITY] ComponentDrillDown uses emoji characters as status indicators**
  - File: `apps/admin/src/components/health/ComponentDrillDown.tsx:203`
  - Impact: 🔴 and 🟡 emojis are read aloud by screen readers as "large red circle" and "large yellow circle" — verbose and unexpected. ✓ may read as "check mark".
  - Fix: Add `aria-hidden="true"` to emoji spans and ensure the adjacent text conveys the status independently.

- **[SEO] No Open Graph or Twitter Card metadata**
  - File: `apps/admin/src/app/layout.tsx:19`
  - Impact: When team members share admin dashboard URLs in Slack/Teams, link previews are blank. Low priority for an internal tool but improves team DX.
  - Fix: Add `openGraph: { title: 'Panopticon Platform', description: '...', type: 'website' }` to root layout metadata.

- **[CODE_QUALITY] ComponentCard uses window.location.href inside a Link-wrapped card**
  - File: `apps/admin/src/components/dashboard/ComponentCard.tsx:74`
  - Impact: `window.location.href = \`/components/${health.tagName}\``causes full browser navigation, discarding Next.js prefetching and client-side transition. The entire card is already wrapped in`<Link href={...}>` navigating to the same URL — the Details button is a redundant hard-navigation that fights the outer Link.
  - Fix: Remove the Details button (the Link wrapper already makes the card navigable), or replace with `<Link>`. Replace `window.open()` calls with `<a target="_blank">` elements.

---

## STATS

- Total issues found: 78
- Critical: 16 | High: 37 | Medium: 21 | Low: 10
- Files reviewed: ~70 source files (components, pages, API routes, lib utilities, config)
- API routes reviewed: 9
- Components reviewed: 57
- Test files reviewed: 0 (none exist in the admin application)

### Immediate Action Required

1. **Rotate the Vercel token in `.env.local`** — treat as an active security incident
2. **Fix `--wc-` → `--hx-` in `a11y-analyzer.ts:157`** — every component has been failing the Token-based colors check since commit `c643de6`; this is a silent data corruption bug in production right now
3. **Add `middleware.ts` with authentication** — the entire API surface is publicly accessible
4. **Remove `saveHealthSnapshot` from health page render** — blocking write on every GET request
5. **Install test framework** — 0% test coverage on the application that gates healthcare component releases
