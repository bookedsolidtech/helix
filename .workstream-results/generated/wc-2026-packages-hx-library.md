# Universal Audit Base Template

> This file is assembled by ws-generate-audit.sh. Placeholders are substituted
> from the project profile. Do not edit generated output — edit templates instead.

---

You are conducting a ruthless, evidence-based technical audit of **wc-2026** at `/workspace/packages/hx-library`. This is a Next.js 15.3.3 project using TypeScript (strict mode). Quality, security, and reliability are non-negotiable.

## YOUR MISSION

Find every real issue that could break functionality, compromise security, degrade user experience, or violate best practices. Prioritize by real-world impact. Be thorough. Be specific. No hand-waving.

## PROJECT CONTEXT

- **Framework**: Next.js 15.3.3
- **Language**: TypeScript (strict mode)
- **Monorepo**: turborepo
- **Styling**: tailwind
- **Deployment**: unknown
- **CI/CD**: github-actions
- **Source files**: ~404
- **Components**: ~57
- **API routes**: ~
- **Unit tests**: true | E2E tests: true

## REVIEW SCOPE

ONLY review `/workspace/packages/hx-library`. Do not review files outside this scope unless they are direct imports from shared packages referenced by the target.

## REVIEW METHODOLOGY

You MUST use Task agents to run parallel reviews from different specialist perspectives. Launch ALL specialist reviews simultaneously in Phase 1, then synthesize findings in Phase 2.

### Phase 1: Parallel Specialist Reviews (launch ALL at once via Task tool)

**Agent 1 — Accessibility (WCAG 2.1 AA) Review**

- Check for proper ARIA labels on interactive elements (buttons, links, forms)
- Check for keyboard navigation support (Tab, Enter, Escape for modals/dropdowns)
- Check for focus management (visible focus indicators, focus trapping in modals)
- Check for color contrast ratios (WCAG AA minimum 4.5:1 for text, 3:1 for large text)
- Check for proper form labels and error messages
- Check for screen reader compatibility (semantic HTML, aria-live regions)
- Check for skip navigation links
- Check for proper heading hierarchy
- Check for image alt text (decorative images should have empty alt="")
- Check for touch target sizes (minimum 44x44px for mobile)
- Check for motion/animation respect (prefers-reduced-motion)
- Check for proper language attributes on HTML elements
- Check for table accessibility (headers, captions, scope attributes)

**Agent 2 — TypeScript Code Quality Review**

- Check for `any` types across all TypeScript files (use `unknown` and narrow)
- Check for non-null assertions (`!`) instead of proper null checks
- Check for `||` instead of `??` for nullish coalescing
- Check for `console.log` statements left in production code
- Check for TODO/FIXME/HACK comments indicating unfinished work
- Check for hardcoded URLs, API keys, or secrets in source files
- Check for unused imports, variables, and dead code
- Check for inconsistent error handling patterns
- Check for proper type definitions (interfaces for objects, enums vs unions)
- Check for overly complex functions (cyclomatic complexity, too many parameters)
- Check for duplicated logic that should be extracted into shared utilities
- Check for proper async/await error handling (try/catch, .catch())
- Check for proper use of strict TypeScript features (strictNullChecks implications)

**Agent 3 — Component Quality & UX Review**

- Check for component files over 200 lines (extract logic into hooks/utilities)
- Check for components with more than 3 useState calls (extract to custom hook)
- Check for missing loading states on async operations
- Check for missing error states and error boundaries
- Check for proper form validation (client-side and server-side)
- Check for proper conditional rendering (avoid flash of wrong content)
- Check for missing empty states (what does the user see with no data?)
- Check for proper key props on list items
- Check for accessibility on interactive components (buttons, links, forms, modals)
- Check for proper responsive design (mobile, tablet, desktop)
- Check for browser native dialogs (alert, confirm, prompt) -- use styled modals instead
- Check for prop drilling that should use context or state management
- Check for inline styles that should be in CSS/Tailwind classes

**Agent 4 — Deployment & Configuration Review**

- Check for environment variable handling (no hardcoded values, proper .env patterns)
- Check for sensitive data exposure in client-side bundles (NEXT*PUBLIC* prefix misuse)
- Check for proper build configuration (production optimizations enabled)
- Check for proper error pages (404, 500) in production
- Check for proper security headers (CSP, X-Frame-Options, etc.)
- Check for proper HTTPS enforcement
- Check for missing health check endpoints
- Check for proper logging configuration (no sensitive data in logs)
- Check for proper dependency management (lockfile committed, no floating versions)
- Check for Docker configuration quality (multi-stage builds, non-root user, layer optimization)
- Check for CI/CD pipeline completeness (lint, type-check, test, build, deploy)
- Check for proper secrets management in CI/CD (no secrets in logs or artifacts)
- Check for proper staging/preview environment configuration

**Agent 5 — General Performance Review**

- Check for large bundle sizes and unnecessary dependencies
- Check for proper lazy loading of images, components, and routes
- Check for efficient DOM operations (avoid layout thrashing, minimize reflows)
- Check for proper caching strategies (HTTP cache headers, service workers)
- Check for render-blocking resources (CSS, JS in head without async/defer)
- Check for efficient API calls (batching, debouncing, pagination)
- Check for memory leaks (event listeners not cleaned up, intervals not cleared)
- Check for proper asset optimization (minification, compression, CDN)
- Check for unnecessary re-renders or re-computations
- Check for efficient state management (global state vs local state)
- Check for proper error boundaries that prevent cascading failures
- Check for responsive image handling (srcset, picture element, or framework equivalents)

**Agent 6 — Next.js Performance Review**

- Check for proper use of Server Components vs Client Components (minimize 'use client')
- Check for unnecessary client-side JavaScript (large bundle impact)
- Check for proper image optimization (next/image with width/height/priority)
- Check for proper font optimization (next/font)
- Check for dynamic imports and code splitting on heavy components
- Check for proper loading.tsx and Suspense boundaries
- Check for efficient data fetching (parallel vs waterfall requests)
- Check for proper caching strategies (revalidate, cache headers)
- Check for router.push vs Link component usage (prefetching)
- Check for proper metadata export (static vs dynamic)
- Check for unnecessary re-renders (missing memo, unstable references)
- Check for large dependencies that could be replaced or tree-shaken
- Check for proper streaming and partial rendering patterns
- Check next.config for proper optimization settings

**Agent 7 — API Security Review**

- Check EVERY API route for authentication enforcement
- Check for auth bypasses: routes missing session checks, routes that check session but not role
- Check for input validation on all POST/PUT/PATCH/DELETE routes (Zod, manual validation, etc.)
- Check for SQL injection vectors in raw SQL queries
- Check for CSRF protection on state-changing endpoints
- Check for rate limiting on sensitive endpoints
- Check for exposed debug or health endpoints that leak internal info
- Check for proper HTTP method restrictions (GET vs POST)
- Check for missing CORS configuration or overly permissive origins
- Check for response data over-exposure (returning more fields than needed)
- Check for path traversal vulnerabilities in file operations
- Check for command injection in any shell exec or child_process calls

**Agent 8 — SEO & Metadata Review**

- Check for proper `<title>` and `<meta description>` on all pages
- Check for Open Graph tags (og:title, og:description, og:image) on public pages
- Check for Twitter Card meta tags
- Check for canonical URLs to prevent duplicate content
- Check for proper heading hierarchy (one h1 per page, sequential h2-h6)
- Check for missing alt text on images
- Check for proper structured data (JSON-LD) where applicable
- Check for robots.txt and sitemap.xml presence and correctness
- Check for proper 404/error page implementation
- Check for dynamic metadata generation (generateMetadata in Next.js, etc.)
- Check for missing favicon and manifest.json
- Check for proper URL structure (clean URLs, no query-string-heavy pages)
- Check for proper noindex/nofollow on non-public pages (admin, staging)

**Agent 9 — Test Coverage & Infrastructure Review**

- Identify critical business logic with ZERO test coverage
- Check existing tests for quality (not just existence — do they test meaningful behavior?)
- Check for flaky test patterns (timeouts, race conditions, external dependencies)
- Check for proper test isolation (no shared state between tests)
- Check for proper mocking patterns (not over-mocking real behavior)
- Check test infrastructure (setup/teardown, fixtures, helpers)
- Check for missing edge case testing (null, empty, boundary values)
- Check for missing error path testing (what happens when things fail?)
- Check for proper async test patterns (awaiting promises, proper done callbacks)
- Check test configuration for proper settings (coverage thresholds, reporters)
- Check for tests that always pass (no assertions, or assertions against mocked values)
- Check for E2E test coverage of critical user flows (if E2E framework exists)
- Identify the 5 most critical untested paths and explain why they need tests

### Phase 2: Synthesize & Prioritize

After ALL agents complete, synthesize their findings into a single prioritized report. Deduplicate overlapping findings. Validate severity — do not inflate. If a finding is borderline between two severities, choose the lower one.

## OUTPUT FORMAT

You MUST produce TWO output files:

### 1. JSONL Issues File (REQUIRED)

Write to: `/workspace/.workstream-results/wc-2026-packages-hx-library-issues.jsonl`

Each line is ONE valid JSON object with this schema:

```
{"severity":"CRITICAL","category":"SECURITY","title":"Unauthenticated API endpoint","file_path":"src/app/api/foo/route.ts","line_number":26,"impact":"Public access to sensitive data","evidence":"No auth check in GET handler","fix_suggestion":"Add authentication guard"}
```

Rules for the JSONL file:

- One JSON object per line, NO trailing commas, NO array wrapper
- EVERY issue in the markdown report MUST also appear in the JSONL (and vice versa)
- `title` must be unique per audit (no exact duplicate titles)
- `severity` must be one of: CRITICAL, HIGH, MEDIUM, LOW
- `category` should be one of: SECURITY, PERFORMANCE, ACCESSIBILITY, CODE_QUALITY, TYPE_SAFETY, ERROR_HANDLING, DATA_INTEGRITY, DEPLOYMENT, SEO, TESTING
- `file_path` and `line_number` can be null if not applicable
- `impact`, `evidence`, `fix_suggestion` can be null but SHOULD be populated

### 2. Markdown Report (REQUIRED)

Write to: `/workspace/.workstream-results/wc-2026-packages-hx-library-report.md` using this exact format:

```markdown
# Audit Report: wc-2026 (packages/hx-library)

## Date: [current date]

## Reviewer: Multi-Agent Technical Audit (9 specialists)

## Scope: packages/hx-library/

---

## CRITICAL (fix immediately -- security vulnerability, data loss, or user-facing breakage)

For each issue:

- **[CATEGORY] Issue title**
  - File: exact/file/path.tsx:line
  - Impact: What breaks or what risk exists
  - Evidence: What you found (code snippet or description)
  - Fix: Specific recommended action

## HIGH (fix this week -- degrades experience, reliability, or professionalism)

[same format]

## MEDIUM (fix this month -- polish, best practices, maintainability)

[same format]

## LOW (backlog -- minor improvements, nice-to-haves)

[same format]

## STATS

- Total issues found: N
- Critical: N | High: N | Medium: N | Low: N
- Files reviewed: N
- API routes reviewed: N
- Components reviewed: N
- Test files reviewed: N
```

## RULES

1. EVERY finding MUST include the exact file path and line number
2. EVERY finding MUST include concrete evidence (what you actually saw in the code)
3. Do NOT report theoretical issues -- only report what you FOUND in the actual source
4. Do NOT suggest "nice to have" features -- only report actual problems
5. If you find ZERO critical issues, say so explicitly (do not inflate severity)
6. Prioritize by REAL-WORLD IMPACT, not code aesthetics

## Next.js-Specific Rules

7. When reviewing Next.js code, check for:
   - Proper Server vs Client Component separation (minimize `'use client'`)
   - `next/image` usage with width, height, and priority where needed
   - `next/font` for font loading optimization
   - Proper `loading.tsx` and `error.tsx` boundary files
   - Dynamic `generateMetadata()` for SEO on dynamic pages
   - Proper API route method exports (GET, POST, etc. — not default export)
   - `next/link` instead of `<a>` for internal navigation
   - Proper middleware.ts for auth/redirect logic
   - Potential for parallel data fetching (avoid request waterfalls)
   - Proper use of `cache()`, `revalidatePath()`, `revalidateTag()`
   - Environment variable naming (NEXT*PUBLIC* prefix only for client-safe values)
   - Route handlers returning proper NextResponse with status codes

## PROJECT-PROVIDED CONTEXT (from CLAUDE.md)

The project includes a CLAUDE.md file with these instructions. Use this context to inform your audit:

```
# CLAUDE.md — wc-2026

Core guidance for Claude Code when working in this monorepo. **Default behavior: ALWAYS delegate to specialized agents.**

---

## Mission Statement

**wc-2026 is the foundation that enterprise healthcare organizations build their million-dollar design systems on.** This is not a component library — it is infrastructure. Every line of code, every token, every test exists to serve organizations where software failures can impact patient care.

We build the factory, not the furniture. The quality bar is not "good enough" — it is "unbreakable."

**Principles:**

- **Foundation before expansion** — No new components until existing ones are bulletproof
- **Zero broken windows** — A failing test, an orphaned import, a hardcoded value: these are not tech debt, they are defects
- **Measure everything** — If it isn't tested, monitored, and gated, it doesn't exist
- **Enterprise-grade or nothing** — Half-measures ship to no one

---

## Engineering Standards

### Zero-Tolerance Policy

- **No broken builds** — `main` must always be green. A red CI pipeline is a stop-the-line event.
- **No untested code** — Every component, every utility, every public API has tests. No exceptions.
- **No hardcoded values** — Colors, spacing, typography, and timing use design tokens. Always.
- **No `any` types** — TypeScript strict mode is not a suggestion. It is a requirement.
- **No orphaned code** — If it's imported nowhere, it doesn't belong. If it's dead, delete it.
- **No silent failures** — Every error path is handled. Every edge case is considered.

### Definition of Done

A feature is done when:

1. Implementation is complete and follows all conventions
2. All 7 quality gates pass (see below)
3. Code has been through 3-tier review
4. Documentation is updated (Storybook stories, Starlight docs, CEM)
5. No regressions in existing tests or functionality

---

## Release Quality Gate

**Nothing ships without passing ALL gates. No exceptions. No overrides.**

| Gate | Check             | Command                  | Threshold                |
| ---- | ----------------- | ------------------------ | ------------------------ |
| 1    | TypeScript strict | `npm run type-check`     | Zero errors              |
| 2    | Test suite        | `npm run test`           | 100% pass, 80%+ coverage |
| 3    | Accessibility     | WCAG 2.1 AA audit        | Zero violations          |
| 4    | Storybook         | Stories for all variants | Complete coverage        |
| 5    | CEM accuracy      | `npm run cem`            | Matches public API       |
| 6    | Bundle size       | Per-component analysis   | <5KB each, <50KB total   |
| 7    | Code review       | 3-tier gate              | All tiers approved       |

If any gate fails, the release is blocked. Fix forward, never skip.

---

## DELEGATION-FIRST MANDATE

**You are a coordinator, not an implementor.** Before writing any code, route work to the right agent.

### Decision Tree

| Question                                       | Route to                                            |
| ---------------------------------------------- | --------------------------------------------------- |
| Lit component implementation?                  | `lit-specialist`                                    |
| TypeScript types, generics, declarations?      | `typescript-specialist`                             |
| Storybook stories, controls, config?           | `storybook-specialist`                              |
| Drupal integration (Twig, behaviors, CDN)?     | `drupal-integration-specialist`                     |
| Design tokens, CSS custom properties, theming? | `design-system-developer`                           |
| CSS animation, transitions, motion?            | `css3-animation-purist` + `design-systems-animator` |
| Architecture decision or system design?        | `principal-engineer`                                |
| Code review (standard)?                        | `code-reviewer` (Tier 1)                            |
| Code review (strict)?                          | `senior-code-reviewer` (Tier 2)                     |
| Code review (final boss)?                      | `chief-code-reviewer` (Tier 3)                      |
| Test strategy or test infrastructure?          | `test-architect`                                    |
| Writing test files?                            | `qa-engineer-automation`                            |
| Accessibility, ARIA, keyboard nav?             | `accessibility-engineer`                            |
| Bundle size, render perf, Lighthouse?          | `performance-engineer`                              |
| CI/CD, publishing, deployments?                | `devops-engineer`                                   |
| Monorepo tooling, Turborepo, DX?               | `staff-software-engineer`                           |
| Feature implementation (general)?              | `frontend-specialist`                               |
| Cross-cutting or unclear?                      | `principal-engineer` (triage)                       |
| Strategic or vendor decisions?                 | `cto`                                               |
| Team coordination or process?                  | `vp-engineering`                                    |

### Dev Server Management (PRIORITY)

**If `npm run dev` is running in the background and you make changes that affect it (new files, config changes, dependency installs), YOU restart it. Do not tell the user to restart.**

1. Run `npm run kill-ports` to kill all dev server processes
2. Run `npm run dev` in the background
3. Verify the servers come up

This applies to ANY change that would require a restart: new story files, config edits, package installs, build output changes. When in doubt, restart.

### What YOU Handle Directly

- File reads, basic exploration, git operations
- Agent coordination and routing
- Simple config edits (1-3 lines)
- Running scripts (`npm run build`, `npm run test`, etc.)
- **Dev server restarts** (see above)

### What You ALWAYS Delegate

- Component implementation (any `.ts` in `src/components/`)
- Test file creation or modification
- Storybook story authoring
- CSS/styling work
- Architecture decisions
- Code review
- Anything touching accessibility patterns
- Anything requiring domain expertise

---

## Project Overview

**wc-2026** is an enterprise healthcare web component library.

```

wc-2026/
├── packages/
│ └── hx-library/ # @wc-2026/library — Lit 3.x components (CORE)
│ └── src/components/ # hx-button, hx-card, hx-text-input
├── apps/
│ ├── admin/ # Admin Dashboard — health scoring, test theater (Next.js 15, port 3159)
│ ├── docs/ # Documentation site (Astro Starlight)
│ ├── docs/ # Documentation site (Astro Starlight, port 3150)
│ └── storybook/ # Component playground (Storybook 10.x, port 3151)
├── turbo.json # Turborepo task pipeline
├── tsconfig.base.json # Shared TypeScript strict config
└── .claude/agents/engineering/ # 20 specialized agents

```

### Tech Stack

| Layer            | Technology                                       |
| ---------------- | ------------------------------------------------ |
| Components       | Lit 3.x, Shadow DOM, CSS Parts, ElementInternals |
| Language         | TypeScript (strict mode, zero `any`)             |
| Build            | Vite library mode, per-component entry points    |
| Testing          | Vitest browser mode + Playwright (Chromium)      |
| API Docs         | Custom Elements Manifest (CEM)                   |
| Stories          | Storybook 10.x with CEM-driven autodocs          |
| Docs Site        | Astro Starlight                                  |
| Admin            | Next.js 15 (Admin Dashboard dashboard)           |
| Monorepo         | Turborepo + npm workspaces                       |
| Primary Consumer | Drupal CMS (Twig templates, Drupal behaviors)    |

### Conventions

- **Tag prefix**: `hx-` (e.g., `hx-button`, `hx-card`)
- **Event prefix**: `hx-` (e.g., `hx-click`, `hx-input`, `hx-change`)
- **CSS custom property prefix**: `--hx-` (e.g., `--hx-color-primary`)
- **CSS parts**: lowercase, hyphenated (e.g., `part="button"`, `part="input-wrapper"`)
- **File structure per component**:
```

src/components/hx-button/
├── index.ts # Re-export
├── hx-button.ts # Component class
├── hx-button.styles.ts # Lit CSS tagged template
├── hx-button.stories.ts # Storybook stories
└── hx-button.test.ts # Vitest browser tests

````

---

## Quality Gates

Every component must pass ALL gates before merge:

1. `npm run type-check` — zero errors (TypeScript strict, no `any`)
2. `npm run test` — all Vitest browser tests pass, 80%+ coverage
3. Accessibility — WCAG 2.1 AA verified (healthcare mandate, zero regressions)
4. Storybook — stories for all variants, controls for all public properties
5. CEM — `npm run cem` generates accurate Custom Elements Manifest
6. Performance — no bundle size regression (<5KB per component min+gz, <50KB full bundle)
7. Code review — 3-tier review gate (`code-reviewer` → `senior-code-reviewer` → `chief-code-reviewer`)

---

## Quick Reference

### Dev Servers

```bash
npm run dev                    # All apps + library (Turborepo)
npm run dev:library            # Library watch mode only
npm run dev:docs               # Astro Starlight docs
npm run dev:storybook          # Storybook 10.x on port 3151
npm run dev:admin              # Admin Dashboard on port 3159
````

```

```
