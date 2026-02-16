# WC-2026 Quick Reference

**Essential commands and workflows for daily development**

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/himerus/wc-2026.git
cd wc-2026
npm install

# Start everything
npm run dev
```

## 🔧 Development Commands

### Dev Servers

```bash
npm run dev              # All apps + library (Turborepo)
npm run dev:library      # Library watch mode only (Vite)
npm run dev:docs         # Docs site only (Astro, port 3150)
npm run dev:storybook    # Storybook only (port 3151)
npm run dev:admin        # Admin dashboard only (port 3159)

npm run kill-ports       # Kill all dev servers
npm run restart          # Kill ports + restart all
```

### Quality Checks

```bash
npm run type-check       # TypeScript strict mode (MUST pass)
npm run type-check:watch # Watch mode for development
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run format:all       # Format entire codebase
```

### Testing

```bash
npm run test             # All tests
npm run test:library     # Library tests only
npm run test:watch       # Watch mode (Vitest)
npm run test:ui          # Vitest UI
```

### Building

```bash
npm run build            # Build all packages
npm run build:library    # Library only
npm run build:docs       # Docs only
npm run build:storybook  # Storybook only
npm run build:admin      # Admin dashboard only
```

### Other

```bash
npm run clean            # Clean all build artifacts
npm run cem              # Generate Custom Elements Manifest
npm run generate-docs    # Generate component docs
```

## 📝 Git Workflow

### Create Branch

```bash
git checkout -b feat/my-feature
# or
git checkout -b fix/my-bug-fix
```

**Branch prefixes**: `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`, `perf/`

### Commit

```bash
# Stage changes
git add .

# Commit (triggers pre-commit hook)
git commit -m "feat(button): add disabled state"
```

**Commit format**: `type(scope): subject`

**Valid types**: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`, `build`

### Push

```bash
# Push (triggers pre-push hook)
git push origin feat/my-feature
```

### Create PR

Open PR on GitHub, fill out the template, request review.

## 🎯 Quality Gates

**All 7 gates must pass before merge:**

| #   | Gate          | Command              | Threshold                   |
| --- | ------------- | -------------------- | --------------------------- |
| 1   | Type check    | `npm run type-check` | Zero errors                 |
| 2   | Tests         | `npm run test`       | 100% pass, 80%+ coverage    |
| 3   | Accessibility | WCAG 2.1 AA          | Zero violations             |
| 4   | Storybook     | Stories              | All variants                |
| 5   | CEM           | `npm run cem`        | Accurate                    |
| 6   | Bundle size   | Check                | <5KB/component, <50KB total |
| 7   | Code review   | PR review            | Approved                    |

## 🔒 Git Hooks

### Pre-Commit (Fast)

Runs on **staged files only**:

- Lint-staged (ESLint + Prettier)
- Type check
- Component tests
- Bundle size check
- CEM validation

**Bypass** (emergency only):

```bash
git commit --no-verify
```

### Pre-Push (Comprehensive)

Runs on **entire codebase**:

- Full type check
- Full test suite
- Lint
- Format check
- Build all packages
- Bundle size budgets
- CEM generation
- Code quality checks

**Bypass** (emergency only):

```bash
git push --no-verify
```

### Commit Message

Enforces conventional commits format.

## 🧪 Testing Quick Reference

### Run Tests

```bash
npm run test             # All tests
npm run test:library     # Library only
npm run test:watch       # Watch mode
```

### Write Tests

```typescript
import { expect, test } from 'vitest';
import { fixture, cleanup } from '../test-utils';
import './hx-button';

test('renders correctly', async () => {
  const el = await fixture('<hx-button>Click me</hx-button>');
  expect(el.textContent).toBe('Click me');
  cleanup();
});
```

## 📦 Component Development

### File Structure

```
packages/hx-library/src/components/hx-button/
├── index.ts              # Re-export
├── hx-button.ts          # Component class
├── hx-button.styles.ts   # Lit CSS
├── hx-button.stories.ts  # Storybook
└── hx-button.test.ts     # Vitest tests
```

### Naming Conventions

- **Components**: `hx-component-name` (kebab-case)
- **Events**: `hx-event-name` (kebab-case)
- **CSS vars**: `--hx-component-property` (kebab-case)
- **CSS parts**: `part-name` (kebab-case)
- **TypeScript**: PascalCase (classes), camelCase (variables)

## 🎨 Storybook

### Start Storybook

```bash
npm run dev:storybook    # Dev mode (port 3151)
npm run build:storybook  # Build static site
```

### Write Stories

```typescript
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-button';

const meta: Meta = {
  title: 'Components/Button',
  component: 'hx-button',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  render: () => html`<hx-button>Click me</hx-button>`,
};
```

## 📚 Documentation

### Starlight Docs

```bash
npm run dev:docs         # Dev mode (port 3150)
npm run build:docs       # Build static site
npm run preview:docs     # Preview build
```

### Custom Elements Manifest

```bash
npm run cem              # Generate CEM
```

Location: `packages/hx-library/custom-elements.json`

## 🐛 Troubleshooting

### Pre-commit fails

```bash
npm run pre-commit-check    # Run manually
npm run lint:fix            # Auto-fix lint issues
npm run format              # Format code
npm run type-check          # Check types
```

### Pre-push fails

```bash
npm run pre-push-check      # Run manually
npm run test                # Run tests
npm run build               # Try building
```

### Tests fail

```bash
npm run test:library        # Run library tests
npm run test:watch          # Watch mode for debugging
npm run test:ui             # Vitest UI for debugging
```

### Build fails

```bash
npm run clean               # Clean build artifacts
npm run build:library       # Try building library
```

### Type errors

```bash
npm run type-check          # Check types
# Fix TypeScript errors
# Never use 'any' type
```

### Dev server issues

```bash
npm run kill-ports          # Kill all servers
npm run restart             # Restart everything
```

## 🔍 Common Tasks

### Add new component

1. Create component directory in `packages/hx-library/src/components/`
2. Add component files (component, styles, stories, tests)
3. Export from `index.ts`
4. Add Storybook story
5. Add tests (80%+ coverage)
6. Generate CEM: `npm run cem`
7. Update docs if needed

### Update dependencies

```bash
npm update                  # Update dependencies
npm run build               # Verify build
npm run test                # Verify tests
```

### Run quality checks

```bash
npm run type-check          # TypeScript
npm run lint                # ESLint
npm run format:check        # Prettier
npm run test                # Tests
npm run build               # Build
```

## 📖 Documentation Links

- **Build Plan**: `./build-plan/index.md`
- **Component Guide**: `./build-plan/05-component-building-guide.md`
- **Drupal Integration**: `./build-plan/06-drupal-integration-guide.md`
- **Quality Automation**: `./docs/quality-automation.md`
- **Contributing**: `./CONTRIBUTING.md`
- **CLAUDE.md**: Project instructions for AI agents

## 🆘 Getting Help

- **Issues**: Open GitHub issue
- **Questions**: GitHub Discussions
- **Bugs**: Include reproduction steps
- **Features**: Discuss before implementing

## 🎓 Learning Resources

### Lit

- [Lit.dev](https://lit.dev)
- [Lit Docs](https://lit.dev/docs/)
- [Lit Playground](https://lit.dev/playground/)

### Storybook

- [Storybook.js.org](https://storybook.js.org)
- [Web Components Storybook](https://storybook.js.org/docs/web-components/get-started/introduction)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)

### Testing

- [Vitest](https://vitest.dev)
- [Playwright](https://playwright.dev)

### Accessibility

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

**Pro Tips:**

- Run `npm run type-check` frequently during development
- Use `npm run test:watch` for TDD workflow
- Format code before committing: `npm run format`
- Read error messages carefully - they're helpful!
- Check Storybook for component examples
- Follow the Component Building Guide for patterns

**Remember**: All 7 quality gates must pass before merge. No exceptions!
