# Quality Automation Infrastructure

**Phase 0 Implementation: Quality Gate Infrastructure Hardening**

This document describes the comprehensive quality automation infrastructure implemented for WC-2026.

## Overview

The quality automation infrastructure ensures that all code meets enterprise healthcare standards before it reaches production. This is achieved through multiple layers of automated checks at different stages of development.

## Table of Contents

- [Quality Gates](#quality-gates)
- [Git Hooks](#git-hooks)
- [IDE Integration](#ide-integration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Scripts and Tools](#scripts-and-tools)
- [Bypassing Checks](#bypassing-checks)

## Quality Gates

All code must pass **7 Quality Gates** before merge:

| Gate | Check             | Command                  | Threshold                |
| ---- | ----------------- | ------------------------ | ------------------------ |
| 1    | TypeScript strict | `npm run type-check`     | Zero errors              |
| 2    | Test suite        | `npm run test`           | 100% pass, 80%+ coverage |
| 3    | Accessibility     | WCAG 2.1 AA audit        | Zero violations          |
| 4    | Storybook         | Stories for all variants | Complete coverage        |
| 5    | CEM accuracy      | `npm run cem`            | Matches public API       |
| 6    | Bundle size       | Per-component analysis   | <5KB each, <50KB total   |
| 7    | Code review       | 3-tier gate              | All tiers approved       |

## Git Hooks

### Pre-Commit Hook

**Location**: `.husky/pre-commit`
**Script**: `scripts/pre-commit-check.sh`

Runs before every commit to enforce quality on staged files only.

**Checks performed:**

1. **Lint-Staged**: Formats and lints staged files
   - ESLint with auto-fix
   - Prettier formatting

2. **Type Check**: TypeScript strict mode on staged files
   - Only if TypeScript files are staged
   - Fast incremental check

3. **Component Tests**: Tests for modified components
   - Only if component files are staged
   - Targeted test runs

4. **Bundle Size**: Impact analysis
   - Only if component files are staged
   - Prevents bundle bloat

5. **CEM Validation**: Manifest accuracy
   - Only if component files are staged
   - Ensures API documentation is up to date

**To bypass** (NOT recommended):

```bash
git commit --no-verify
```

### Pre-Push Hook

**Location**: `.husky/pre-push`
**Script**: `scripts/pre-push-check.sh`

Runs before every push to enforce comprehensive quality on the entire codebase.

**Checks performed:**

1. **Full Type Check**: Entire codebase
2. **Full Test Suite**: All tests must pass
3. **Lint**: Entire codebase
4. **Format Check**: Entire codebase
5. **Build**: All packages must build successfully
6. **Bundle Size Budgets**: Enforce size limits
7. **CEM Generation**: Full manifest regeneration
8. **Code Quality Checks** (warnings only):
   - TODO/FIXME detection
   - console.log detection in production code

**To bypass** (NOT recommended):

```bash
git push --no-verify
```

### Commit Message Hook

**Location**: `.husky/commit-msg`
**Script**: `scripts/commit-msg-check.sh`

Enforces conventional commit format.

**Format required:**

```
type(scope?): subject

body?

footer?
```

**Valid types:**

- `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`, `build`

**Examples:**

```bash
feat(button): add disabled state
fix(card): correct elevation shadow
chore: update dependencies
docs: add accessibility guide
```

## IDE Integration

### EditorConfig

**Location**: `.editorconfig`

Works across all IDEs (VSCode, Cursor, IntelliJ, Vim, etc.).

**Enforces:**

- UTF-8 encoding
- LF line endings
- 2-space indentation
- Final newline
- Trim trailing whitespace

### VSCode Settings

**Location**: `.vscode/settings.json`

**Features:**

- Auto-format on save
- ESLint auto-fix on save
- TypeScript strict mode warnings
- Prettier integration
- Line rulers at 80/120 characters
- Consistent tab size and spacing

### VSCode Extensions

**Location**: `.vscode/extensions.json`

**Recommended extensions:**

- `astro-build.astro-vscode` - Astro language support
- `dbaeumer.vscode-eslint` - ESLint integration
- `esbenp.prettier-vscode` - Prettier formatting
- `editorconfig.editorconfig` - EditorConfig support
- `ms-vscode.vscode-typescript-next` - Latest TypeScript
- `runem.lit-plugin` - Lit component support
- `formulahendry.auto-rename-tag` - HTML tag renaming
- `streetsidesoftware.code-spell-checker` - Spell checking

## CI/CD Pipeline

### Main CI Workflow

**Location**: `.github/workflows/ci.yml`

Runs on every push and pull request to `main`.

**Jobs:**

1. Quality Gates - Single run on Ubuntu with Node 20
   - Type check
   - Lint
   - Format check
   - Test
   - Build
   - CEM generation
   - Bundle size check

**Required for merge**: All checks must pass

### Matrix CI Workflow

**Location**: `.github/workflows/ci-matrix.yml`

Tests across multiple environments for compatibility.

**Matrix:**

- **Node versions**: 18, 20, 22
- **Operating systems**: Ubuntu, macOS, Windows

**Total combinations**: 9 (3 Node × 3 OS)

**Fail-fast**: Disabled to see all failures

**Required for merge**: All matrix tests must pass

### Pull Request Template

**Location**: `.github/pull_request_template.md`

Comprehensive checklist for PR authors and reviewers:

- Change description
- Type of change
- Quality checklist
- Accessibility requirements
- Testing coverage
- Performance impact
- Breaking changes

## Scripts and Tools

### npm Scripts

**Quality checks:**

```bash
npm run type-check          # TypeScript strict mode
npm run type-check:watch    # Watch mode for development
npm run lint                # ESLint
npm run lint:fix            # ESLint with auto-fix
npm run format              # Format with Prettier
npm run format:check        # Check formatting
npm run format:all          # Format entire codebase
```

**Git hook scripts:**

```bash
npm run pre-commit-check    # Run pre-commit checks manually
npm run pre-push-check      # Run pre-push checks manually
```

**Testing:**

```bash
npm run test                # All tests
npm run test:library        # Library tests only
npm run test:watch          # Watch mode
npm run test:ui             # Vitest UI
```

**Build:**

```bash
npm run build               # Build all packages
npm run build:library       # Library only
npm run build:docs          # Docs only
npm run build:storybook     # Storybook only
npm run build:admin         # Admin only
```

**Custom Elements Manifest:**

```bash
npm run cem                 # Generate CEM
```

### Bash Scripts

**Pre-commit check** (`scripts/pre-commit-check.sh`):

- Checks only staged files
- Fast and targeted
- Prevents bad commits

**Pre-push check** (`scripts/pre-push-check.sh`):

- Full quality gate suite
- Comprehensive validation
- Prevents bad pushes

**Commit message check** (`scripts/commit-msg-check.sh`):

- Validates conventional commit format
- Enforces subject length
- Warns on missing issue references

## CODEOWNERS

**Location**: `.github/CODEOWNERS`

Automatically requests review from designated owners when files change.

**Scope:**

- Component library code
- CI/CD workflows
- Package manifests
- Build configuration
- Documentation
- Quality scripts

**Owner**: @himerus

## Bypassing Checks

### When to Bypass

**NEVER bypass unless:**

- Emergency hotfix (with approval)
- Known CI infrastructure issue
- False positive that blocks merge

### How to Bypass

**Pre-commit hook:**

```bash
git commit --no-verify
```

**Pre-push hook:**

```bash
git push --no-verify
```

**WARNING**: Bypassing checks can introduce bugs, break builds, or violate compliance standards. Use only when absolutely necessary and with team approval.

## Troubleshooting

### Pre-commit hook fails

1. Check which gate failed in the output
2. Fix the issues locally
3. Run `npm run pre-commit-check` to verify
4. Stage and commit again

### Pre-push hook fails

1. Check which gate failed in the output
2. Run the specific command that failed (e.g., `npm run test`)
3. Fix the issues
4. Run `npm run pre-push-check` to verify
5. Push again

### Commit message rejected

1. Review conventional commit format requirements
2. Ensure type is valid (feat, fix, chore, etc.)
3. Keep subject under 72 characters
4. Use imperative mood ("add" not "added")

### Type check fails

1. Run `npm run type-check` locally
2. Fix TypeScript errors
3. Never use `any` type
4. Never use `@ts-ignore` without documentation

### Test failures

1. Run `npm run test:library` locally
2. Check test output for failing tests
3. Fix the code or update tests
4. Ensure 80%+ coverage maintained

### Bundle size exceeded

1. Run `npm run build:library` locally
2. Check which component exceeds budget
3. Optimize imports, reduce dependencies
4. Consider code splitting

## Maintenance

### Updating Node.js Versions

When adding support for a new Node.js version:

1. Update `.github/workflows/ci-matrix.yml`
2. Add new version to matrix.node-version
3. Update `package.json` engines field (if needed)
4. Test locally with new version

### Updating Quality Scripts

When modifying quality check scripts:

1. Test locally before committing
2. Ensure backward compatibility
3. Update documentation
4. Consider impact on developer experience

### Updating CI Workflows

When modifying CI workflows:

1. Test in a feature branch first
2. Ensure all jobs pass
3. Document changes in PR
4. Update this documentation

## Metrics and Monitoring

### CI Performance

Monitor CI pipeline performance:

- Average build time
- Test execution time
- Cache hit rate
- Failure rate

### Quality Metrics

Track quality metrics:

- Test coverage percentage
- Bundle size trends
- Type error count
- Lint violation count

### Developer Experience

Monitor developer friction:

- Hook execution time
- Bypass rate (should be near zero)
- False positive rate
- Developer feedback

## Best Practices

### For Developers

1. **Run checks locally** before committing
2. **Fix issues immediately** rather than bypassing
3. **Keep commits small** for faster checks
4. **Use conventional commits** from the start
5. **Read error messages** carefully

### For Reviewers

1. **Ensure all CI checks pass** before reviewing
2. **Verify test coverage** for new code
3. **Check bundle size impact** for components
4. **Review accessibility** implementation
5. **Validate documentation** is complete

### For Maintainers

1. **Keep hooks fast** (< 30 seconds for pre-commit)
2. **Provide clear error messages** in scripts
3. **Monitor bypass rate** (investigate if increasing)
4. **Update documentation** when changing processes
5. **Balance strictness** with developer productivity

## Summary

The quality automation infrastructure provides:

✅ **Multiple layers of protection** against quality issues
✅ **Fast feedback loops** for developers
✅ **Consistent enforcement** across all environments
✅ **Clear error messages** for quick fixes
✅ **IDE-agnostic** configuration
✅ **Comprehensive CI/CD** coverage
✅ **Healthcare-grade** quality standards

This infrastructure ensures that WC-2026 maintains enterprise healthcare quality standards without compromising developer productivity.
