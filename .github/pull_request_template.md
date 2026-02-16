# Pull Request

## Description

<!-- Provide a clear and concise description of the changes in this PR -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] chore: Maintenance (deps, config, etc.)
- [ ] docs: Documentation changes
- [ ] test: Test changes
- [ ] refactor: Code refactoring
- [ ] style: Code style/formatting
- [ ] perf: Performance improvements
- [ ] ci: CI/CD changes
- [ ] build: Build system changes

## Related Issues

<!-- Link to related issues using #issue-number -->

Closes #
Refs #

## Changes Made

<!-- List the key changes made in this PR -->

-
-
-

## Quality Checklist

<!-- All items must be checked before merge -->

- [ ] Code follows the project's coding standards (EditorConfig, Prettier, ESLint)
- [ ] TypeScript strict mode passes with zero errors
- [ ] All tests pass locally
- [ ] New tests added for new features/bug fixes
- [ ] Storybook stories updated/added for component changes
- [ ] Custom Elements Manifest (CEM) generated successfully
- [ ] Bundle size budgets respected (<5KB per component, <50KB total)
- [ ] Accessibility requirements met (WCAG 2.1 AA minimum)
- [ ] Documentation updated (if applicable)

## Accessibility

<!-- If this PR affects components, describe accessibility considerations -->

- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG 2.1 AA standards
- [ ] ARIA attributes properly used
- [ ] Focus management implemented correctly

## Testing

<!-- Describe the testing performed -->

### Test Coverage

- [ ] Unit tests
- [ ] Integration tests
- [ ] Browser tests (Vitest browser mode)
- [ ] Manual testing in Storybook

### Browsers Tested

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Screenshots/Videos

<!-- Add screenshots or videos demonstrating the changes (if applicable) -->

## Performance Impact

<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Performance improved
- [ ] Performance impact analyzed and acceptable

## Breaking Changes

<!-- List any breaking changes and migration path -->

- [ ] No breaking changes
- [ ] Breaking changes documented below

<!-- If breaking changes exist, describe them here -->

## Deployment Notes

<!-- Any special deployment considerations -->

## Reviewer Notes

<!-- Additional context for reviewers -->

---

## Pre-Merge Checklist

<!-- Must be completed by reviewer before merge -->

- [ ] Code review completed
- [ ] All CI checks passed (type check, lint, format, tests, build, CEM, bundle size)
- [ ] Matrix tests passed (Node 18/20/22, Ubuntu/macOS/Windows)
- [ ] Changes follow CLAUDE.md guidance
- [ ] Quality gates passed (all 7 gates)
- [ ] No regressions in existing functionality
- [ ] Accessibility verified
- [ ] Documentation is clear and complete

---

**By submitting this PR, I confirm that:**

- I have read and followed the contributing guidelines
- My code follows the project's coding standards
- I have tested my changes thoroughly
- I am willing to address feedback and make necessary changes
