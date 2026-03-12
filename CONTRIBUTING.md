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

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

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

```
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

A DCO check runs automatically on all pull requests. If any commit is missing a sign-off, the check will fail and the PR cannot be merged until all commits are signed off.

Organization members are exempt from this requirement.

## Getting Started

### Prerequisites

- **Node.js**: >= 20.0.0
- **npm**: 10.8.2 (ships with Node.js)
- **Git**: Latest stable version
- **IDE**: VSCode recommended (with recommended extensions)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/himerus/wc-2026.git
cd wc-2026

# Install dependencies
npm install

# Start development servers
npm run dev
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
npm run type-check

# Lint
npm run lint

# Run tests
npm run test

# Build
npm run build
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
4. Run full test suite: `npm run test`
5. Verify build succeeds: `npm run build`

### Creating a PR

1. Push your branch to GitHub
2. Open a pull request against `main`
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
4. No merge conflicts with `main`

### After Approval

PRs are merged by maintainers using **merge commits** strategy (squash merging is disabled to preserve conventional commit messages for semantic-release).

## Component Development

### Component Generator

Use the generator to scaffold a new component's 5-file structure with correct boilerplate:

```bash
npm run create:component hx-my-component
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

Generated files are pre-formatted and pass `npm run verify` immediately. After scaffolding:

1. Implement logic in `hx-my-component.ts`
2. Add styles in `hx-my-component.styles.ts`
3. Export from `packages/hx-library/src/index.ts`
4. Add Storybook stories in `hx-my-component.stories.ts`
5. Write tests in `hx-my-component.test.ts`
6. Run `npm run cem` to update the Custom Elements Manifest

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

### Test Section Pattern

Every component test file follows this **required section order**. Import from shared utilities:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { page, userEvent } from '@vitest/browser/context';
import { fixture, shadowQuery, oneEvent, cleanup, checkA11y } from '../../test-utils.js';
import type { HelixFoo } from './hx-foo.js';
import './index.js';

afterEach(cleanup);

describe('hx-foo', () => {
  // ─── Rendering ───
  describe('Rendering', () => {
    // Shadow DOM exists, CSS parts exposed, default classes/attributes applied
    it('renders with shadow DOM', async () => {
      const el = await fixture<HelixFoo>('<hx-foo></hx-foo>');
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
    it('dispatches hx-change on interaction', async () => {
      const el = await fixture<HelixFoo>('<hx-foo></hx-foo>');
      const eventPromise = oneEvent(el, 'hx-change');
      // trigger interaction...
      const event = await eventPromise;
      expect(event).toBeTruthy();
    });
  });

  // ─── Keyboard ───
  describe('Keyboard', () => {
    // Enter/Space activation, Tab focus order, Escape dismissal (as applicable)
    it('Enter activates component', async () => {
      const el = await fixture<HelixFoo>('<hx-foo></hx-foo>');
      el.focus();
      await userEvent.keyboard('{Enter}');
      // assert result...
    });
  });

  // ─── Slots ───
  describe('Slots', () => {
    // Default slot, named slots — verify slotted content via el.querySelector
    it('default slot renders text', async () => {
      const el = await fixture<HelixFoo>('<hx-foo>Hello</hx-foo>');
      expect(el.textContent?.trim()).toBe('Hello');
    });
  });

  // ─── CSS Parts ───
  describe('CSS Parts', () => {
    // Each @csspart is accessible via shadowQuery(el, '[part~="name"]')
    it('exposes "root" part', async () => {
      const el = await fixture<HelixFoo>('<hx-foo></hx-foo>');
      expect(shadowQuery(el, '[part~="root"]')).toBeTruthy();
    });
  });

  // ─── Form ─── (only for form-associated components)
  describe('Form', () => {
    it('has formAssociated=true', () => {
      const ctor = customElements.get('hx-foo') as unknown as { formAssociated: boolean };
      expect(ctor.formAssociated).toBe(true);
    });
  });

  // ─── Accessibility (axe-core) ───
  describe('Accessibility (axe-core)', () => {
    // checkA11y(el) for default state and key variants
    // Always call page.screenshot() before checkA11y
    it('has no axe violations in default state', async () => {
      const el = await fixture<HelixFoo>('<hx-foo>Content</hx-foo>');
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
npm run test

# Run library tests only
npm run test:library

# Watch mode
npm run test:watch

# With UI
npm run test:ui
```

## Documentation Requirements

### Code Documentation

- **JSDoc**: All public APIs must have JSDoc
- **TypeScript**: Strict types, no `any`
- **Comments**: Explain "why", not "what"

### Storybook Stories

Required for every component:

- Default story
- All variants
- All states (disabled, loading, error, etc.)
- Interactive controls
- Accessibility documentation

### Starlight Documentation

Required for new features:

- Component guide page
- Usage examples
- API reference (auto-generated from CEM)
- Accessibility notes
- Drupal integration examples

## Questions or Issues?

- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue for discussion first
- **Questions**: Use GitHub Discussions
- **Security**: Email security@example.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License. All contributions require DCO sign-off (see [Developer Certificate of Origin](#developer-certificate-of-origin-dco) above).

---

**Thank you for contributing to HELiX!** Your contributions help build better healthcare experiences for everyone.
