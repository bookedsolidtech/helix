# CLAUDE.md — HELiX

Core guidance for Claude Code when working in this monorepo. **Default behavior: ALWAYS delegate to specialized agents.**

---

## Mission Statement

**HELiX is the foundation that enterprise healthcare organizations build their million-dollar design systems on.** This is not a component library — it is infrastructure. Every line of code, every token, every test exists to serve organizations where software failures can impact patient care.

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

**HELiX** is an enterprise healthcare web component library.

```
helix/
├── packages/
│   └── hx-library/          # @helixui/library — Lit 3.x components (CORE)
│       └── src/components/   # hx-button, hx-card, hx-text-input
├── apps/
│   ├── admin/                # Admin Dashboard — health scoring, test theater (Next.js 15, port 3159)
│   ├── docs/                 # Documentation site (Astro Starlight)
│   ├── docs/                 # Documentation site (Astro Starlight, port 3150)
│   └── storybook/            # Component playground (Storybook 10.x, port 3151)
├── turbo.json                # Turborepo task pipeline
├── tsconfig.base.json        # Shared TypeScript strict config
└── .claude/agents/engineering/  # 20 specialized agents
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
  ├── index.ts              # Re-export
  ├── hx-button.ts          # Component class
  ├── hx-button.styles.ts   # Lit CSS tagged template
  ├── hx-button.stories.ts  # Storybook stories
  └── hx-button.test.ts     # Vitest browser tests
  ```

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
```

### Build & Quality

```bash
npm run verify                 # MANDATORY before push: lint + format:check + type-check
npm run build                  # Build everything (Turborepo)
npm run type-check             # TypeScript strict
npm run test                   # Vitest browser mode (112 tests)
npm run test:library           # Tests for @helixui/library only
npm run test:smart             # Smart: only tests changed components vs origin/dev
npm run cem                    # Generate Custom Elements Manifest
npm run lint                   # ESLint
npm run format                 # Auto-fix formatting
```

### Component Development Workflow

1. `lit-specialist` — implements component
2. `accessibility-engineer` — reviews ARIA/keyboard patterns
3. `storybook-specialist` — writes stories
4. `qa-engineer-automation` — writes tests
5. `code-reviewer` — reviews PR
6. `devops-engineer` — releases

---

## Non-Negotiables

1. **Accessibility is not optional** — Healthcare mandate. WCAG 2.1 AA minimum. Zero regressions.
2. **TypeScript strict always** — No `any`. No `@ts-ignore`. No non-null assertions.
3. **Shadow DOM encapsulation** — Styles don't leak. Design tokens (`--hx-*`) are the only theming mechanism.
4. **CEM accuracy** — Custom Elements Manifest must reflect actual public API at all times.
5. **Drupal compatibility** — Components work in Twig templates without modification.
6. **Performance budgets** — <5KB per component (min+gz), <50KB full bundle. Enforced in CI.
7. **Tests before merge** — No component merges without passing test suite.
8. **Semantic versioning** — Breaking changes communicated, versioned, documented via changesets.

---

## Design Token Architecture

Three-tier cascade through Shadow DOM:

```
Primitive (raw values)
  → Semantic (--wc-color-primary, --wc-spacing-md)
    → Component (--wc-button-bg, --wc-card-padding)
```

Consumers override at the semantic level. Components consume at the component level with semantic fallbacks:

```css
:host {
  --_bg: var(--wc-button-bg, var(--wc-color-primary));
}
```

**Rule**: Never hardcode colors, spacing, or typography values. Always use tokens.

---

## Agent Roster (18 agents)

All agents: `.claude/agents/engineering/`

| Category             | Agents                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Leadership**       | `cto`, `vp-engineering`, `principal-engineer`                                                      |
| **Core Specialists** | `lit-specialist`, `typescript-specialist`, `storybook-specialist`, `drupal-integration-specialist` |
| **Frontend**         | `frontend-specialist`, `staff-software-engineer`, `design-system-developer`                        |
| **Styling**          | `css3-animation-purist`, `design-systems-animator`                                                 |
| **Quality**          | `code-reviewer`, `test-architect`, `qa-engineer-automation`                                        |
| **Perf & A11y**      | `accessibility-engineer`, `performance-engineer`                                                   |
| **Infra**            | `devops-engineer`                                                                                  |

---

## Pre-Push Quality Gate — MANDATORY, NO EXCEPTIONS

**Run `npm run verify` before every `git push`. Zero failures required.**

```bash
npm run verify   # runs: lint + format:check + type-check
```

Do NOT push if `npm run verify` fails. Fix the issue first, then re-run.

Auto-fix helpers:
```bash
npx eslint --fix .    # auto-fix lint errors
npm run format        # auto-fix formatting
npm run verify        # confirm clean — must be zero failures before push
```

**Why this matters:** Git hooks are bypassed in the automated workflow (`HUSKY=0`, `--no-verify`). The only guarantee of code quality before CI is running `npm run verify` manually before every push. A PR that fails CI wastes agent cycles and blocks other work. This is not optional.

---

## Git Rules

- `npm run verify` must pass before every `git push` (runs lint + format:check + type-check)
- Never use `--no-verify`
- Never use `git reset --hard` or `git push --force` without explicit permission
- Commit messages: concise, imperative ("Add hx-select component", not "Added")
- Use changesets for version bumps

---

## Key Files

| File                                       | Purpose                                                       |
| ------------------------------------------ | ------------------------------------------------------------- |
| `packages/hx-library/src/components/`      | Component source (delegate to `lit-specialist`)               |
| `packages/hx-library/src/test-utils.ts`    | Shared test helpers (fixture, shadowQuery, oneEvent, cleanup) |
| `packages/hx-library/custom-elements.json` | CEM output (generated, don't edit)                            |
| `apps/admin/src/lib/health-scorer.ts`      | Component health scoring (Admin Dashboard)                    |
| `apps/admin/src/app/tests/page.tsx`        | Test Theater page                                             |
| `turbo.json`                               | Turborepo task pipeline                                       |
| `tsconfig.base.json`                       | Shared TypeScript strict config                               |
