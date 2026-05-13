# Contributing to HELiX

Thank you for your interest in contributing to HELiX, an enterprise healthcare web component library! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Developer Certificate of Origin (DCO)](#developer-certificate-of-origin-dco)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Quality Standards](#quality-standards)
- [Git Workflow](#git-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Component Development](#component-development)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
  - [Where does this doc page go?](#where-does-this-doc-page-go)
  - [Canonical-reference table](#canonical-reference-table)
  - [Cross-linking convention](#cross-linking-convention)

## Code of Conduct

This project does not yet ship a formal `CODE_OF_CONDUCT.md`, but participants are expected to be respectful and constructive in all interactions. Aggressive or harassing behavior will be removed at maintainer discretion. (A formal Contributor Covenant–style document is planned; until it lands, the spirit of those guidelines is what we apply.)

## Developer Certificate of Origin (DCO)

This project requires all external contributors to sign off on their commits using the [Developer Certificate of Origin (DCO)](https://developercertificate.org/). The DCO is a lightweight way to certify that you wrote or have the right to submit the code you are contributing.

### How It Works

Every commit in your pull request must include a `Signed-off-by` line with your real name and email address. This certifies that you agree to the [DCO terms](https://developercertificate.org/).

### Signing Off on Commits

Add the `-s` (or `--signoff`) flag when committing:

```bash
git commit -s -m "feat(button): add icon support"
```

This appends a line like the following to your commit message:

```text
Signed-off-by: Your Name <your.email@example.com>
```

### Signing Off on Past Commits

If you forgot to sign off, you can amend the most recent commit:

```bash
git commit --amend -s --no-edit
git push --force-with-lease
```

To sign off on multiple commits, use an interactive rebase:

```bash
git rebase HEAD~N --signoff
git push --force-with-lease
```

Replace `N` with the number of commits to update.

### What Happens on PRs

There is no automated DCO bot wired into this repository yet. External contributors should still include the `Signed-off-by` trailer (via `git commit -s`) so the commit log reflects intent. A formal DCO check workflow is on the roadmap; until it ships, reviewers spot-check sign-offs during PR review.

Organization members typically commit without the trailer and that is fine for now; this stance changes once the automated check is in place.

## Getting Started

### Prerequisites

- **Node.js**: 22 LTS or Node.js 24 (Node 20 reaches upstream EOL on 2026-04-30)
- **pnpm**: 9.15.9 (install via `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **Git**: Latest stable version
- **IDE**: VSCode recommended (with recommended extensions)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/bookedsolidtech/helix.git
cd helix

# Install dependencies
pnpm install

# Start development servers
pnpm run dev
```

This will start:

- Library watch mode (Vite)
- Storybook (port 3151)
- Documentation site (port 3150)
- Admin dashboard (port 3159)

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/my-new-feature
# or
git checkout -b fix/my-bug-fix
```

### 2. Make Changes

Follow the coding standards and conventions outlined in [CLAUDE.md](./CLAUDE.md).

### 3. Test Your Changes

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Run tests
pnpm run test

# Build
pnpm run build
```

### 4. Commit Your Changes

We use Husky hooks to enforce quality standards on commit and push (the active hooks live in `.husky/`):

- **Pre-commit**: Runs `gitleaks protect --staged` against the staged diff (hard-fails if `gitleaks` is not installed) plus a filename block on `.env*` / `.envrc`. Note: `*.pem` and `*.key` are NOT filename-blocked — they're caught only when gitleaks detects credential patterns inside them, so treat the gitleaks pass as the secret guarantee, not the filename list. Lint/format are handled via editor integrations and the `pnpm run preflight` gate before push, not by this hook.
- **Commit-msg**: Blocks structural AI attribution (Co-Authored-By with AI names, "Generated with [Tool]" footers, etc.) per `.rea/policy.yaml`. Conventional Commit format is enforced socially during code review, not by an executable commitlint hook.
- **Pre-push**: Runs the targeted local gate fragments (lint, format:check, type-check, smart test) and the REA push-review gate. The full GitHub-CI-parity suite lives in `pnpm run preflight` — run it explicitly before pushing significant changes.

```bash
git add .
git commit -m "feat(button): add disabled state"
```

## Quality Standards

All code must pass the **7 Quality Gates** before merge:

1. **TypeScript Strict**: Zero errors, no `any` types
2. **Tests**: All tests pass; coverage is reported on every CI run but is not a blocking gate today (tracked as informational pending the [#1556 coverage-config follow-up](https://github.com/bookedsolidtech/helix/issues/1556) before flipping back to blocking)
3. **Accessibility**: WCAG 2.2 AAA on the P0 surface (per `packages/hx-library/aaa-verdicts.json`), AA baseline elsewhere; the CI axe-core regression guard fails on any **critical or serious** violation and surfaces minor/moderate findings as informational
4. **Storybook**: Stories for all component variants
5. **CEM**: Custom Elements Manifest accurately reflects API
6. **Bundle Size**: Aspirational floor of `<5KB per component / <50KB total` (gzipped) tracked in [`.bundle-budget.json`](./.bundle-budget.json); the **CI-enforced ceiling** is **16KB per component / 200KB total** per [`bundle-budgets.json`](./bundle-budgets.json) — exceeding the ceiling is a blocking failure, exceeding only the floor is a regression flag
7. **Code Review**: 3-tier review process

Preflight (`pnpm run preflight`) adds five further infrastructure gates on top of the seven above:

8. **Full test suite**: complete component matrix (catches cross-component regressions)
9. **Docker CI parity**: full GitHub Actions pipeline reproduced locally via `act`. **Best-effort** — preflight skips the gate (without failing) when Docker or `act` is not installed on the contributor machine, so the local pass is not a guarantee that CI will pass; if you need cert-level parity, install Docker + `act` and run preflight there.
10. **AAA cert integrity**: refuses regression to `Partially Supports` or `Does Not Support` in the committed `aaa-verdicts.json` snapshot
11. **Docs version drift**: scans the four currently tracked `@helixui/*` packages — `@helixui/library`, `@helixui/tokens`, `@helixui/icons`, `@helixui/react` — across `apps/docs/`, `apps/storybook/`, and `packages/**/README.md` for stale version pins. Other `@helixui/*` packages (e.g. `@helixui/drupal-behaviors`, `@helixui/drupal-starter`, `@helixui/mcp`, `@helixui/react-starter`) are not in the scanned set yet — extending `PACKAGES` is a tracked follow-up. Bypass with `HELIX_ALLOW_VERSION_DRIFT=1` (emergency only).
12. **Docs claims fact-check**: validates structural claims in `apps/docs/` + `apps/storybook/` against source-of-truth — `<hx-*>` element references against the CEM, `--hx-*` token prefixes against `@helixui/tokens`, `@helixui/*` package references against the workspace + npm, internal `/<slug>/` links against surviving files, stale repo references (the old pre-rename GitHub org), and outdated WCAG conformance claims (current HELiX posture is 2.2 AAA on P0). Runs `scripts/check-docs-claims.mjs`; output goes to `.reports/docs-fact-check/programmatic-findings.md`.

### Pre-Commit Hooks

Our pre-commit hook (`.husky/pre-commit`) currently:

- Runs `gitleaks protect --staged` and refuses commits that contain detected token strings, plus a filename block on `.env*` / `.envrc`. (`*.pem` / `*.key` are not filename-blocked — they're caught only when gitleaks finds credential patterns inside them; do not rely on the filename list alone.)
- Hard-blocks files matching the secrets allow-list

Formatting, linting, and type-checking are run explicitly via `pnpm run verify` / `pnpm run preflight` — they are not wired into the pre-commit hook today.

### Pre-Push Hooks

Our pre-push hook (`.husky/pre-push`) delegates to `rea hook push-gate`. The current REA-installed gate (v4) short-circuits on the `.rea/HALT` kill-switch and then runs the project's configured push-gate chain — what that chain enforces is controlled by `.rea/policy.yaml` and the REA version (recent versions of the gate verify a fresh codex audit entry covers `HEAD`; older 0.10.x hooks ran only verify/test fragments). Inspect `.husky/pre-push` + the policy file to see what's wired locally.

The pre-push gate does **not** run the full test matrix, build every package, enforce the bundle ceiling, or scan for TODO/console.log. For the GitHub-CI-parity sweep — including Docker CI, bundle budgets, AAA cert integrity, and docs version drift — run `pnpm run preflight` before pushing significant changes.

## Git Workflow

### Branch Naming

Use conventional prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation changes
- `test/` - Test changes
- `refactor/` - Code refactoring
- `perf/` - Performance improvements

Examples:

```
feat/add-tooltip-component
fix/button-focus-ring
chore/update-dependencies
docs/accessibility-guide
```

### Keeping Your Branch Updated

```bash
# Update your local main
git checkout main
git pull origin main

# Rebase your feature branch
git checkout feat/my-feature
git rebase main
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope?): subject

body?

footer?
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance (deps, config, etc.)
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `style`: Code style/formatting
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

```bash
# Feature
git commit -m "feat(button): add disabled state"

# Bug fix
git commit -m "fix(card): correct elevation shadow calculation"

# Chore
git commit -m "chore: update Lit to 3.3.2"

# Documentation
git commit -m "docs: add accessibility testing guide"

# With issue reference
git commit -m "fix(input): prevent focus loss on validation #123"
```

### Subject Guidelines

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Keep under 72 characters
- Be descriptive and specific

## Pull Request Process

### Before Opening a PR

1. Ensure all quality gates pass locally
2. Update documentation (if applicable)
3. Add/update tests for new functionality
4. Run full test suite: `pnpm run test`
5. Verify build succeeds: `pnpm run build`

### Creating a PR

1. Push your branch to GitHub
2. Open a pull request against `dev` (feature branches target `dev`; `main` only receives `staging → main` promotion PRs)
3. Fill out the PR template completely
4. Link related issues
5. Request review from appropriate team members

### PR Template

The PR template will guide you through:

- Description of changes
- Type of change
- Quality checklist
- Accessibility considerations
- Testing performed
- Performance impact
- Breaking changes (if any)

### Review Process

All PRs must pass:

1. All 7 quality gates (gates 1–6 are enforced by CI on Node 22, pinned via `.nvmrc`, on Ubuntu; Gate 7 is the manual 3-tier code review below)
2. Code review approval (Gate 7 — manual)
3. No merge conflicts with `main`

The optional CI matrix (`ci-matrix.yml`, Node 22/24 on Ubuntu, `workflow_dispatch` only) is a best-effort diagnostic, not a merge gate — auto-triggers are disabled for the 3.0.0 release window and the job has a history of noise unrelated to library code. Run it manually when a PR touches **build tooling, Vite/Turborepo config, or Node runtime APIs**. Node 24 support is declared in `engines` (`^22.0.0 || ^24.0.0`) but is not exercised by any required check; treat a green matrix run as positive signal, not a guarantee, and a red matrix run as a prompt to investigate, not a blanket block.

### After Approval

PRs are merged by maintainers using a **merge-commit** strategy (squash merging is disabled to preserve the per-commit history that Changesets relies on for release-note generation; the `dev → staging → main` promotion model and release publishing are driven by Changesets, not semantic-release).

## Component Development

### Component Generator

Use the generator to scaffold a new component's 5-file structure with correct boilerplate:

```bash
pnpm run create:component hx-my-component
```

This creates all 5 required files in `packages/hx-library/src/components/hx-my-component/`:

```
hx-my-component/
├── index.ts                    # Re-export
├── hx-my-component.ts          # Component class
├── hx-my-component.styles.ts   # Lit CSS tagged template
├── hx-my-component.stories.ts  # Storybook stories (stub)
└── hx-my-component.test.ts     # Vitest browser tests (stub)
```

Generated files are pre-formatted and pass `pnpm run verify` immediately. After scaffolding:

1. Implement logic in `hx-my-component.ts`
2. Add styles in `hx-my-component.styles.ts`
3. Keep the per-component `hx-my-component/index.ts` re-export accurate (the **root** `packages/hx-library/src/index.ts` barrel is generated — do **not** edit it by hand; run `pnpm --filter=@helixui/library run generate:barrel` to regenerate it from the per-component indexes)
4. Add Storybook stories in `hx-my-component.stories.ts`
5. Write tests in `hx-my-component.test.ts`
6. Run `pnpm run cem` to update the Custom Elements Manifest

### File Structure

Each component follows this structure:

```
packages/hx-library/src/components/hx-button/
├── index.ts              # Re-export
├── hx-button.ts          # Component class
├── hx-button.styles.ts   # Lit CSS tagged template
├── hx-button.stories.ts  # Storybook stories
└── hx-button.test.ts     # Vitest tests
```

### Component Checklist

When creating a new component:

- [ ] Component class with proper JSDoc
- [ ] Reactive properties with decorators
- [ ] Styles using design tokens — see the [Component Token Binding Rule](./apps/docs/src/content/docs/design-tokens/tiers.md#component-token-binding-rule) before authoring CSS: bind surfaces, text, and borders to Semantic tokens (`--hx-color-surface-*`, `--hx-color-text-*`, `--hx-color-border-*`) so the component flips correctly in Dark and High-Contrast modes. Binding to primitives like `--hx-color-neutral-*` on a non-brand surface is a regression.
- [ ] CSS parts for styling API
- [ ] Shadow DOM encapsulation
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Form integration (if applicable)
- [ ] Storybook stories (all variants)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Browser tests
- [ ] Custom Elements Manifest entry
- [ ] Documentation in Starlight

### Naming Conventions

- **Components**: `hx-component-name` (kebab-case)
- **Events**: `hx-event-name` (kebab-case)
- **CSS Custom Properties**: `--hx-<component>-<property>` (kebab-case)
- **CSS Parts**: `part-name` (kebab-case)
- **TypeScript**: PascalCase for classes, camelCase for variables

## Testing Requirements

### Test Coverage

- **Minimum**: 80% coverage
- **Target**: 90%+ coverage
- **Unit tests**: Component logic, utilities
- **Integration tests**: Rendering, events, state
- **Browser tests**: DOM interactions, accessibility

### Test Section Pattern

Every component test file follows this **required section order**. The structure below is illustrated against `hx-button` (a real, shipped component); copy the pattern when adding a new component and swap the tag/type/part names for your own. The `hx-foo` placeholder used in earlier drafts of this guide was never a real component:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-button', () => {
  // ─── Rendering ───
  describe('Rendering', () => {
    // Shadow DOM exists, CSS parts exposed, default classes/attributes applied
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
      expect(el.shadowRoot).toBeTruthy();
    });
  });

  // ─── Properties ───
  // One describe block per public property
  describe('Property: variant', () => {
    // Each property: attribute reflection, class/behavior changes, defaults
  });

  // ─── Events ───
  describe('Events', () => {
    // Each event: fires, bubbles, composed, detail shape
    // Negative cases: does NOT fire when disabled/loading
    it('dispatches hx-click on activation', async () => {
      const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
      const eventPromise = oneEvent(el, 'hx-click');
      el.click();
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Keyboard ───
  describe('Keyboard', () => {
    // Enter/Space activation, Tab focus order, Escape dismissal (as applicable)
    it('Enter activates component', async () => {
      const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
      el.focus();
      await userEvent.keyboard('{Enter}');
      // assert result...
    });
  });

  // ─── Slots ───
  describe('Slots', () => {
    // Default slot, named slots — verify slotted content via el.querySelector
    it('default slot renders text', async () => {
      const el = await fixture<HelixButton>('<hx-button>Hello</hx-button>');
      expect(el.textContent?.trim()).toBe('Hello');
    });
  });

  // ─── CSS Parts ───
  describe('CSS Parts', () => {
    // Each @csspart is accessible via shadowQuery(el, '[part~="name"]')
    it('exposes "button" part', async () => {
      const el = await fixture<HelixButton>('<hx-button>Click</hx-button>');
      expect(shadowQuery(el, '[part~="button"]')).toBeTruthy();
    });
  });

  // ─── Form ─── (only for form-associated components — hx-button is form-associated)
  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-button') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ───
  describe('Accessibility (axe-core)', () => {
    // checkA11y(el) for default state and key variants
    // Always call page.screenshot() before checkA11y
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixButton>('<hx-button>Content</hx-button>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
```

### Test Utilities

| Utility       | Purpose                                                      |
| ------------- | ------------------------------------------------------------ |
| `fixture()`   | Creates element from HTML string, appends to DOM, returns it |
| `shadowQuery` | Queries inside shadow root: `shadowQuery(el, 'button')`      |
| `oneEvent`    | Returns promise that resolves when event fires once          |
| `cleanup`     | Removes all test fixtures — call in `afterEach`              |
| `checkA11y`   | Runs axe-core accessibility audit, returns `{ violations }`  |

### Test Conventions

- `afterEach(cleanup)` — always at top level of `describe`
- Never call `setAttribute` in a custom element constructor — use `connectedCallback()`
- `await el.updateComplete` after triggering reactive property changes
- Use `shadowQuery<HTMLButtonElement>(el, 'button')!` for type-safe shadow DOM queries
- Negative event tests: set `fired = false`, trigger, `await el.updateComplete`, assert `false`
- Positive event tests: call `oneEvent(el, 'hx-event-name')` before triggering, then await

### Writing Tests (simple example)

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { fixture, cleanup } from '../../test-utils.js';
import type { HelixButton } from './hx-button.js';
import './index.js';

afterEach(cleanup);

describe('hx-button', () => {
  it('renders with default variant', async () => {
    const el = await fixture<HelixButton>('<hx-button>Click me</hx-button>');
    expect(el.variant).toBe('primary');
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm run test

# Run library tests only
pnpm run test:library

# Watch mode (library workspace only)
pnpm --filter=@helixui/library run test:watch

# With UI (library workspace only)
pnpm --filter=@helixui/library run test:ui
```

## Documentation Requirements

HELiX docs live across three surfaces. Each surface has a specific job; pages must live in the surface whose job they serve. Surface mismatches create maintenance debt and consumer confusion.

### Where does this doc page go?

Before writing a new doc page, run it through the 3-question boundary test:

1. **Does this page require a live HELiX component to make its point?** → **Storybook** (`apps/storybook/stories/`)
2. **Is this page step-by-step instruction for someone past evaluation?** → **`apps/docs/`** (Astro Starlight)
3. **Is this page first-5-seconds positioning for evaluators?** → **marketing site** (canonical homepage is `helix.bookedsolid.tech`; pure marketing pages may live in a separate marketing-site repo if one is set up — out of this repo regardless)

If two answers apply, the page is too broad — split it. If zero apply, the page doesn't belong in any of our docs surfaces.

### Canonical-reference table

The single source of truth per content type. **Authoring the same fact in two places creates drift; one surface owns it and the other links.**

| Content type                                                               | Canonical home                                                                                                                | Cross-link from the other surface                                                                                      |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Component API (props, events, slots, CSS parts, CSS custom props)          | **Storybook** (CEM-driven autodocs via `HelixDocsPage`)                                                                       | `apps/docs` framework-integration pages link to `storybook.helix.bookedsolid.tech/?path=/docs/components-<name>--docs` |
| Live component demo / playground                                           | **Storybook** (`*.stories.ts`)                                                                                                | `apps/docs` references with static excerpts that link to the live demo                                                 |
| Brand registry (live token swatches + theme switching)                     | **Storybook** (`foundations/BrandRegistry.mdx`)                                                                               | `apps/docs/design-tokens/*` links to the live page                                                                     |
| Foundations (live swatches with brand toolbar)                             | **Storybook** (`foundations/Color`, `Typography`, etc.)                                                                       | `apps/docs/design-tokens/*` for the static token tables; cross-link both ways                                          |
| Iconography (visual catalog)                                               | **Storybook** (`foundations/Iconography.mdx`)                                                                                 | `apps/docs` references it from the `@helixui/icons` integration guide                                                  |
| AAA cert dashboard + per-component AAAConformanceCard                      | **Storybook** (`accessibility/Dashboard.mdx`)                                                                                 | `apps/docs/accessibility/*` links to the dashboard                                                                     |
| Accessibility — VPAT scope, consumer obligations, WCAG SC reference        | **`apps/docs`** (`accessibility/self-cert-scope.mdx`, `accessibility/consumer-obligations.mdx`, `accessibility/vpat-2.5.mdx`) | Storybook `accessibility/Dashboard.mdx` links to the apps/docs prose                                                   |
| Drupal integration (Twig, behaviors, CDN, module install)                  | **`apps/docs`** (`drupal/`)                                                                                                   | No Storybook duplicate (no live components needed)                                                                     |
| Framework integration (React, Next.js, Vue, Angular, Svelte, vanilla HTML) | **`apps/docs`** (`framework-integration/`)                                                                                    | Storybook Overview links back                                                                                          |
| Getting started + migration + release policy                               | **`apps/docs`** (`getting-started/`, `migration/`)                                                                            | Storybook Overview links back                                                                                          |
| Architecture (monorepo, build, testing strategy)                           | **`apps/docs`** (`architecture/`)                                                                                             | Internal reference; no cross-link needed                                                                               |
| AI-agent context (`llms.txt`, `llms-full.txt`)                             | **`apps/docs`** (root, generated from CEM + `aaa-verdicts.json`)                                                              | Generated, not hand-authored                                                                                           |

### Cross-linking convention

- Component reference in `apps/docs/` ⇒ link to the deployed Storybook URL pattern: `https://storybook.helix.bookedsolid.tech/?path=/docs/components-<name>--docs`
- Storybook page that needs framework-specific setup ⇒ link to `apps/docs/framework-integration/<framework>/`
- Storybook page that explains the AAA cert scope ⇒ link to `apps/docs/accessibility/self-cert-scope/`
- **Never duplicate prose across surfaces.** If you find yourself copy-pasting a paragraph from one surface to the other, the page is in the wrong surface — fix the surface, don't duplicate.

### Code Documentation

- **JSDoc**: All public APIs must have JSDoc
- **TypeScript**: Strict types, no `any`
- **Comments**: Explain "why", not "what"

### Storybook Stories

Required for every component (Storybook is the canonical per-component reference):

- Default story
- All variants
- All states (disabled, loading, error, etc.)
- Interactive controls
- Accessibility documentation (`AAAConformanceCard` is auto-rendered from the committed `aaa-verdicts.json` snapshot)

### Starlight Documentation (`apps/docs/`)

Required for new features that consumers integrate into their apps:

- Getting-started + installation if it changes the install contract
- Framework-integration page if a new framework wrapper ships
- Drupal integration page if Drupal-specific guidance changes
- Migration entry if breaking changes ship
- **No per-component reference pages** — Storybook owns those via CEM-driven autodocs

## Questions or Issues?

- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue for discussion first
- **Questions**: Use GitHub Discussions
- **Security**: Report security issues privately through GitHub's [private vulnerability reporting](https://github.com/bookedsolidtech/helix/security/advisories/new); a formal `SECURITY.md` with a dedicated reporting address is on the roadmap. Do not open public issues for security vulnerabilities.

## License

By contributing, you agree that your contributions will be licensed under the MIT License. All contributions require DCO sign-off (see [Developer Certificate of Origin](#developer-certificate-of-origin-dco) above).

---

**Thank you for contributing to HELiX!** Your contributions help build better healthcare experiences for everyone.
