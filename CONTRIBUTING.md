# Contributing to WC-2026

Thank you for your interest in contributing to WC-2026, an enterprise healthcare web component library! This document provides guidelines and best practices for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [AI Agent Workflow](#ai-agent-workflow)
- [Quality Standards](#quality-standards)
- [Branch Strategy](#branch-strategy)
- [Git Workflow](#git-workflow)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Component Development](#component-development)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0 (install via `npm install -g pnpm` or `corepack enable`)
- **Git**: Latest stable version
- **IDE**: VSCode recommended (with recommended extensions)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/himerus/wc-2026.git
cd wc-2026

# Install pnpm (if not already installed)
corepack enable
# or: npm install -g pnpm

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

We use Husky hooks to enforce quality standards on commit and push:

- **Pre-commit**: Runs lint-staged (ESLint, Prettier) and quick quality checks
- **Commit-msg**: Enforces conventional commit format
- **Pre-push**: Runs full quality gate suite

```bash
git add .
git commit -m "feat(button): add disabled state"
```

## AI Agent Workflow

This project uses [Automaker](https://automaker.ai) to autonomously implement backlog features using AI agents. Understanding how agents work helps you review their output effectively.

### How It Works

- Features on the Linear board are picked up by agents in dependency order
- Agents open PRs against `dev` with the feature ID in the branch name (e.g., `feat/helix-123-button-component`)
- All agent PRs require human review before merge — no autonomous push to `dev` or beyond

### Reviewing Agent PRs

When reviewing an agent-generated PR:

- Verify the implementation matches the Linear feature description exactly
- Confirm all 7 quality gates pass in CI
- Watch for **scope creep** — agents should implement only what the feature specifies
- Check that no files outside the feature scope were modified

### Escalate vs. Retry

| Situation | Action |
|-----------|--------|
| Build or test failure | Comment with the error; agent will retry (up to 3 attempts) |
| Wrong scope or over-engineering | Comment with specific corrections for agent retry |
| Fundamental design flaw | Escalate to `principal-engineer` or human contributor |
| Accessibility violation | Block merge; escalate to `accessibility-engineer` |
| Security concern | Block merge immediately; contact maintainers |

## Quality Standards

All code must pass the **7 Quality Gates** before merge:

1. **TypeScript Strict**: Zero errors, no `any` types
2. **Tests**: All tests pass, 80%+ coverage
3. **Accessibility**: WCAG 2.1 AA compliant (zero violations)
4. **Storybook**: Stories for all component variants
5. **CEM**: Custom Elements Manifest accurately reflects API
6. **Bundle Size**: <5KB per component (gzipped), <50KB total
7. **Code Review**: 3-tier review process

### Pre-Commit Hooks

Our pre-commit hook will:

- Format code with Prettier
- Lint code with ESLint
- Type-check staged TypeScript files
- Run tests for modified components
- Check bundle size impact
- Validate Custom Elements Manifest

### Pre-Push Hooks

Our pre-push hook will:

- Run full TypeScript type check
- Run complete test suite
- Lint entire codebase
- Check code formatting
- Build all packages
- Verify bundle size budgets
- Generate Custom Elements Manifest
- Check for TODO/FIXME (warning only)
- Check for console.log (warning only)

## Branch Strategy

This repository uses a three-branch promotion flow:

```
feature/* → dev → staging → main
```

| Branch | Purpose |
|--------|---------|
| `feature/*` | Individual features (agent and human); all PRs target `dev` |
| `dev` | Active development — the default integration branch |
| `staging` | QA and integration testing before production release |
| `main` | Stable, production-ready — never pushed directly |

**Promotion rules:**
- `dev → staging`: Requires all P1 milestone features merged and CI green
- `staging → main`: Requires full QA sign-off and zero open blocking issues

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
# Update your local dev branch
git checkout dev
git pull origin dev

# Rebase your feature branch
git checkout feat/my-feature
git rebase dev
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope?): subject
```

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`, `build`

### Examples

```bash
git commit -m "feat(button): add disabled state"
git commit -m "fix(card): correct elevation shadow calculation"
git commit -m "docs: add accessibility testing guide"
```

### Subject Guidelines

- Use imperative mood: "add" not "added"
- No period at the end, keep under 72 characters

## Pull Request Process

### Before Opening a PR

1. Ensure all quality gates pass locally
2. Update documentation (if applicable)
3. Add/update tests for new functionality
4. Run full test suite: `pnpm run test`
5. Verify build succeeds: `pnpm run build`

### Creating a PR

1. Push your branch to GitHub
2. Open a pull request against `dev`
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

1. Automated CI checks (all 7 quality gates)
2. Matrix tests (Node 18/20/22, Ubuntu/macOS/Windows)
3. Code review approval
4. No merge conflicts with `dev`

### After Approval

PRs are merged by maintainers using **squash and merge** strategy.

## Component Development

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
- [ ] Styles using design tokens
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
- **CSS Custom Properties**: `--hx-component-property` (kebab-case)
- **CSS Parts**: `part-name` (kebab-case)
- **TypeScript**: PascalCase for classes, camelCase for variables

## Testing Requirements

### Test Coverage

- **Minimum**: 80% coverage
- **Target**: 90%+ coverage
- **Unit tests**: Component logic, utilities
- **Integration tests**: Rendering, events, state
- **Browser tests**: DOM interactions, accessibility

### Writing Tests

```typescript
import { expect, test } from 'vitest';
import { fixture, cleanup } from '../test-utils';
import './hx-button';

test('renders with default variant', async () => {
  const el = await fixture('<hx-button>Click me</hx-button>');
  expect(el.variant).toBe('primary');
  cleanup();
});
```

### Running Tests

```bash
# Run all tests
pnpm run test

# Run library tests only
pnpm run test:library

# Visual regression tests
pnpm run test:vrt
```

## Documentation Requirements

### Code Documentation

- **JSDoc**: All public APIs must have JSDoc
- **TypeScript**: Strict types, no `any`
- **Comments**: Explain "why", not "what"

### Storybook Stories

Required for every component: default story, all variants, all states, interactive controls, and accessibility documentation.

### Starlight Documentation

Required for new features: component guide page, usage examples, API reference (auto-generated from CEM), accessibility notes, and Drupal integration examples.

## Questions or Issues?

- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue for discussion first
- **Questions**: Use GitHub Discussions
- **Security**: Email security@example.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to WC-2026!** Your contributions help build better healthcare experiences for everyone.
