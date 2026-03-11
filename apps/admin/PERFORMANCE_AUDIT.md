# Panopticon Admin Dashboard — Performance Audit

**Date:** 2026-03-11
**Auditor:** Claude Opus (Deep Architecture Audit)
**App Version:** @helixui/admin@0.1.0
**Framework:** Next.js 15.5.12 (App Router)
**Build Time:** 10.5s compile + ~5s static generation

---

## Executive Summary

The Panopticon dashboard is architecturally sound but has **6 critical performance issues** and **8 moderate optimizations** that would significantly improve load times, reduce redundant computation, and prevent future scaling problems as the component library grows from 87 to 200+ components.

**Severity Ratings:**
- P0 (Critical): Blocking or will cause degradation at scale
- P1 (High): Noticeable impact on user experience
- P2 (Medium): Optimization opportunity
- P3 (Low): Nice-to-have improvement

---

## 1. CEM Manifest Re-Parsing (P0 — Critical)

**File:** `src/lib/cem-parser.ts:164-171`

`getManifest()` reads and parses `custom-elements.json` from disk **on every call** with `readFileSync` + `JSON.parse`. This function is called:

- 3 times directly in `cem-parser.ts` (`findDeclaration`, `getAllComponentNames`, `getManifestStats`)
- `findDeclaration` is called once per component by `getComponentData`
- `getAllComponentNames` calls `getManifest` once, then `getManifestStats` calls `getAllComponents` which calls `getAllComponentNames` again + `getComponentData` N times

**On the Dashboard page (`/`):**
- `getManifestStats()` → calls `getAllComponents()` → calls `getAllComponentNames()` (1 parse) → calls `getComponentData()` x N components (N parses) → **N+2 parses**
- `scoreAllComponents()` → calls `getAllComponentNames()` (1 parse) → calls `scoreComponent()` x N → each calls `validateComponent()` which calls `findDeclaration()` (N parses) → **N+1 parses**
- **Total: ~2N+3 file reads and JSON parses per page load** (with 87 components = ~177 parses)

**Fix:** Add module-level caching to `getManifest()`:
```typescript
let _cachedManifest: CemManifest | null = null;
let _cachedMtime: number = 0;

function getManifest(): CemManifest {
  const cemPath = resolve(process.cwd(), '../../packages/hx-library/custom-elements.json');
  if (!existsSync(cemPath)) return { schemaVersion: '', modules: [] } as unknown as CemManifest;
  const mtime = statSync(cemPath).mtimeMs;
  if (_cachedManifest && mtime === _cachedMtime) return _cachedManifest;
  _cachedManifest = JSON.parse(readFileSync(cemPath, 'utf-8'));
  _cachedMtime = mtime;
  return _cachedManifest!;
}
```

**Impact:** Reduces 177 file reads to 1 per request. Estimated savings: 50-200ms per page load.

---

## 2. scoreAllComponents() Called on Every Page Without Caching (P0 — Critical)

**Files:**
- `src/app/page.tsx:36` — Dashboard calls `await scoreAllComponents()`
- `src/app/components/page.tsx:11` — Components page calls `await scoreAllComponents()`
- `src/app/health/page.tsx:14` — Health page calls `await scoreAllComponents()`
- `src/app/api/libraries/[id]/score/route.ts:36` — Score API calls it
- `src/app/components/[tag]/page.tsx:51` — Detail page calls `scoreComponent(tag)`

`scoreAllComponents()` runs **17 analyzers** per component × 87 components = **1,479 analyzer invocations per call**. Each analyzer reads source files from disk. This is the single most expensive operation in the app.

**The Dashboard, Components, and Health pages ALL call it independently**, meaning navigating between these three pages triggers 3 full scoring runs.

Additionally, the Health page (`src/app/health/page.tsx:18`) calls `saveHealthSnapshot(components)` on **every page load**, writing scores to disk as a side-effect of rendering.

**Fix (short-term):** Add a time-based in-memory cache for `scoreAllComponents`:
```typescript
let _scoreCache: { data: ComponentHealth[]; timestamp: number } | null = null;
const SCORE_TTL = 60_000; // 60 seconds

export async function scoreAllComponents(): Promise<ComponentHealth[]> {
  if (_scoreCache && Date.now() - _scoreCache.timestamp < SCORE_TTL) {
    return _scoreCache.data;
  }
  // ... existing scoring logic ...
  _scoreCache = { data: results, timestamp: Date.now() };
  return results;
}
```

**Fix (long-term):** Pre-compute scores on file change (via Turbo task or file watcher) and read from a cached JSON file, similar to how test results work.

**Impact:** Eliminates redundant scoring across page navigations. Estimated savings: 500ms-2s per page load for cached hits.

---

## 3. Bundle Size — Recharts + Shiki Bloat (P1 — High)

**Build output analysis:**

| Route | First Load JS | Concern |
|-------|--------------|---------|
| `/` (Dashboard) | **225 kB** | recharts charts |
| `/components/[tag]` | **223 kB** | shiki syntax highlighting |
| `/tests` | **224 kB** | recharts + test runner |
| `/roadmap` | **234 kB** | recharts + issue tracker |
| Shared chunks | **102 kB** | Base Next.js + React |

**Key bloaters:**
- **recharts** (54.3 kB shared chunk `e898b764`): Used in 7 components across 4 pages. Being loaded globally via shared chunk even on pages that don't use charts.
- **shiki** (loaded on `/components/[tag]`): Full syntax highlighter at ~10+ kB for server-side code highlighting. Only used on component detail pages.
- **lucide-react**: 16 icons imported in layout.tsx alone. Tree-shaking should handle this, but worth verifying.

**Fix:**
1. Lazy-load recharts components with `next/dynamic`:
```typescript
const TestCategoryDonut = dynamic(() => import('@/components/dashboard/TestCategoryDonut'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```
2. Move shiki highlighting to an API route or use a lighter alternative for code display
3. Consider replacing recharts with a lighter charting solution (e.g., CSS-only charts for simple bar/donut displays, or lightweight uPlot)

**Impact:** Could reduce First Load JS on Dashboard from 225 kB to ~140 kB.

---

## 4. No Client-Side Caching Strategy (P1 — High)

**Every API route** uses `export const dynamic = 'force-dynamic'` (18 routes total). This disables Next.js static generation and server-side caching entirely.

While `force-dynamic` is appropriate for mutation endpoints (POST/PUT/DELETE), it's unnecessary for read-only data that changes infrequently:

| Route | Changes | Current | Should Be |
|-------|---------|---------|-----------|
| `GET /api/tokens` | Only on build | `force-dynamic` | Static or ISR (revalidate: 3600) |
| `GET /api/tokens/[category]` | Only on build | `force-dynamic` | Static or ISR |
| `GET /api/issues/stats` | On issue changes | `force-dynamic` | ISR (revalidate: 60) |
| `GET /api/tests/results` | On test run | `force-dynamic` | ISR (revalidate: 30) |
| `GET /api/mcp-health` | MCP server state | `force-dynamic` | ISR (revalidate: 300) |
| `GET /api/reviews` | Infrequently | `force-dynamic` | ISR (revalidate: 300) |

**Fix:** Replace blanket `force-dynamic` with appropriate revalidation:
```typescript
// For mostly-static data
export const revalidate = 3600; // 1 hour

// For semi-dynamic data
export const revalidate = 60; // 1 minute
```

**Impact:** Eliminates redundant server-side computation on repeated requests.

---

## 5. Health Page Side-Effect on Render (P1 — High)

**File:** `src/app/health/page.tsx:18`

```typescript
// Save current snapshot (automatically on every page load for now)
saveHealthSnapshot(components);
```

This writes to disk on every page load of the Health Center. In production, this is:
1. A write-on-read anti-pattern that adds latency to page rendering
2. Creates unnecessary disk I/O
3. Could cause race conditions with concurrent requests

**Fix:** Move snapshot saving to:
- A dedicated API route (`POST /api/health/snapshot`)
- A Turbo task that runs after builds
- A cron job or file-watcher trigger

---

## 6. N+1 Pattern in Component Detail Page (P1 — High)

**File:** `src/app/components/[tag]/page.tsx:42-79`

The component detail page makes **10+ independent data calls** sequentially:
```typescript
const data = getComponentData(tag);           // 1 CEM parse
const healthRaw = scoreComponent(tag);         // 17 analyzers, each reads files
const validation = validateComponent(tag);     // 1 CEM parse (redundant)
const jsDoc = analyzeJsDoc(tag);              // 1 file read (already done in scoreComponent)
const drift = detectDrift(tag);               // reads files
const source = getSourceInfo(tag);            // reads files
const testResults = getTestResultsForComponent(tag);  // 1 file read (already done in scoreComponent)
const a11y = analyzeAccessibility(tag);       // reads files (already done in scoreComponent)
```

`scoreComponent(tag)` already calls `validateComponent`, `analyzeJsDoc`, `getTestResultsForComponent`, and `analyzeAccessibility` internally. The detail page then calls them **again** independently, doubling the work.

**Fix:** Extract dimension results from the scoreComponent result instead of re-running analyzers:
```typescript
const health = scoreComponent(tag);
// Use health.dimensions to get jsDoc, a11y scores instead of re-analyzing
```

Or, refactor `scoreComponent` to return the raw analyzer results alongside the health score.

**Impact:** Eliminates ~50% of file reads on the component detail page.

---

## 7. Test Results Reader — Repeated File Reads (P2 — Medium)

**File:** `src/lib/test-results-reader.ts`

`getAllTestResults()` reads and parses the test results JSON from disk on every call. On the Dashboard page, it's called directly AND indirectly via `scoreAllComponents` → `getTestResultsForComponent` for each component.

Similar to the CEM parser issue, this should use module-level caching with mtime validation.

---

## 8. No Dynamic Imports for Heavy Client Components (P2 — Medium)

41 files use `'use client'` directive. Several contain heavy dependencies:
- 7 recharts chart components
- TestRunnerPanel (complex state management)
- IssueTrackerShell (full issue management UI)
- HooksPageClient (large data display)

None use `next/dynamic` for code splitting. All are bundled into their parent page chunks.

**Fix:** Use `next/dynamic` with `{ ssr: false }` for chart components and heavy interactive panels that aren't needed for initial render.

---

## 9. MCP Probe Performance (P2 — Medium)

**File:** `src/lib/mcp-probe.ts`

`probeMcpServer()` spawns a child process (`wc-tools`), performs JSON-RPC handshake, lists tools, and runs smoke tests — all with a **15-second timeout**. It's called on:
- `GET /api/mcp-health` route
- MCP page load
- Hooks page (indirectly via cached data)

The MCP client (`mcp-client.ts`) has a proper 5-minute in-memory cache, but `probeMcpServer` itself has **no caching**. Each call spawns a new process.

**Fix:** Add result caching to `probeMcpServer` with a 5-minute TTL, similar to the MCP client pattern.

---

## 10. Static Pages That Should Be Dynamic (P2 — Medium)

The build output shows pages like `/` (Dashboard) and `/components` are marked `○ (Static)`, meaning they're pre-rendered at build time. But these pages call `scoreAllComponents()` which reads live filesystem data.

This works because Next.js statically generates them during build when the source files are present, but the data becomes stale immediately after. The pages need `export const dynamic = 'force-dynamic'` or ISR with revalidation.

**Current state:** The Dashboard shows stale data from build time in production.

**Fix:** Either:
1. Add `export const dynamic = 'force-dynamic'` to Dashboard and Components pages
2. Use ISR: `export const revalidate = 60;`

---

## 11. Large Inline Component Arrays (P3 — Low)

**File:** `src/app/page.tsx:263-330`

The Quality Gates section renders 8 hardcoded hook items as an inline array. While not a performance issue at 8 items, the pattern of inline data in JSX makes the component harder to optimize and cache.

---

## 12. Recharts ResponsiveContainer Overhead (P3 — Low)

Recharts' `ResponsiveContainer` uses ResizeObserver which can cause layout thrashing on initial render, especially with multiple charts on the same page (Dashboard has 4+ charts).

**Fix:** Set explicit dimensions instead of ResponsiveContainer where chart size is known.

---

## 13. No Virtualization for Component Lists (P3 — Low)

The components page renders all 87 component cards in a grid. At current scale this is fine, but at 200+ components, this will cause:
- Slow initial render
- High memory usage
- Scroll jank

**Fix (when needed):** Add `react-window` or `@tanstack/react-virtual` for component lists exceeding 50 items.

---

## 14. Shiki Initialization Cost (P3 — Low)

**File:** `src/lib/syntax-highlighter.ts`

Shiki requires loading grammar/theme files on first use. On the component detail page, `highlightCode` is called once per snippet tab via `Promise.all`. If Shiki isn't pre-warmed, the first request incurs a cold-start penalty.

**Fix:** Pre-initialize Shiki in a module singleton.

---

## Priority Matrix

| # | Issue | Priority | Effort | Impact |
|---|-------|----------|--------|--------|
| 1 | CEM manifest re-parsing | P0 | Low (1h) | High — 177→1 file reads |
| 2 | scoreAllComponents no cache | P0 | Low (2h) | High — eliminates 1-2s per nav |
| 6 | N+1 in component detail | P1 | Medium (4h) | High — 50% fewer file reads |
| 3 | Recharts/Shiki bundle bloat | P1 | Medium (4h) | Medium — 225→140 kB First Load |
| 4 | Blanket force-dynamic | P1 | Low (2h) | Medium — proper caching |
| 5 | Health page write-on-read | P1 | Low (1h) | Medium — removes side effect |
| 7 | Test results re-parsing | P2 | Low (1h) | Medium — fewer file reads |
| 8 | No dynamic imports | P2 | Medium (3h) | Medium — smaller page bundles |
| 9 | MCP probe no cache | P2 | Low (1h) | Medium — no spawn per request |
| 10 | Static pages with live data | P2 | Low (1h) | Medium — fresh data |
| 11 | Inline data arrays | P3 | Low (30m) | Low |
| 12 | ResponsiveContainer | P3 | Low (30m) | Low |
| 13 | No list virtualization | P3 | Medium (3h) | Low (future) |
| 14 | Shiki cold start | P3 | Low (1h) | Low |

---

## Estimated Total Impact

| Metric | Current | After P0+P1 Fixes | After All Fixes |
|--------|---------|-------------------|-----------------|
| Dashboard load (cold) | ~2-3s | ~0.5-1s | ~0.3-0.5s |
| Dashboard load (warm) | ~1-2s | ~0.1-0.3s | ~0.1s |
| Component detail load | ~1-2s | ~0.5s | ~0.3s |
| First Load JS (Dashboard) | 225 kB | ~160 kB | ~140 kB |
| CEM file reads per dash load | ~177 | 1 | 1 |
| Analyzer runs per nav | 1,479 | 0 (cached) | 0 (cached) |

---

## Architecture Assessment

**Strengths:**
- Clean Next.js App Router structure with proper Server/Client component separation
- 41 client components properly marked with `'use client'`
- MCP client has proper 5-min in-memory cache
- Server components handle data fetching (good for SEO/performance)
- Build succeeds in 10.5s — reasonable for the app's complexity

**Weaknesses:**
- No data caching layer between filesystem and rendering
- CEM manifest parsed from disk on every function call (no memoization)
- Health scoring is the most expensive operation but has zero caching
- Side-effects in render functions (saveHealthSnapshot)
- Blanket `force-dynamic` on all API routes regardless of mutation frequency
- Heavy libraries (recharts, shiki) loaded eagerly instead of lazily

**Overall Grade: B-**
The architecture is solid and well-organized, but the data access layer treats the filesystem as a database without any caching. This is the #1 bottleneck. Adding a simple in-memory cache with mtime validation to the top 3 hot paths (CEM, health scores, test results) would deliver 80% of the possible performance improvement with minimal effort.
