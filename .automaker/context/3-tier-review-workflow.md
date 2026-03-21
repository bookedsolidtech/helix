# 3-Tier Code Review Workflow

Every component PR goes through three tiers of review. All three must approve. No shortcuts.

---

## Overview

| Tier | Agent | Role | Model |
|------|-------|------|-------|
| 1 | `code-reviewer` | Standard quality gate | sonnet |
| 2 | `senior-code-reviewer` | Strict enforcer | sonnet |
| 3 | `chief-code-reviewer` | Final boss | opus |

Reviews are sequential: Tier 1 must pass before Tier 2, Tier 2 before Tier 3. Fixing issues at lower tiers prevents wasting higher-tier time.

---

## Tier 1: Standard Quality Gate (`code-reviewer`)

**Agent:** David M. Park
**Focus:** Does the code meet baseline standards?

### Checks

- [ ] TypeScript strict compliance (no `any`, no `@ts-ignore`)
- [ ] Lit 3.x patterns followed (decorators, lifecycle, rendering)
- [ ] Component follows file structure convention
- [ ] Public API documented with JSDoc (`@tag`, `@slot`, `@csspart`, `@cssprop`, `@fires`)
- [ ] CEM generated and accurate
- [ ] All tests present and passing
- [ ] Accessibility basics: roles, labels, keyboard
- [ ] Events follow `hx-` prefix convention
- [ ] CSS custom properties follow `--hx-` prefix convention
- [ ] No hardcoded values (colors, spacing, typography)
- [ ] `pnpm run verify` passes
- [ ] Changeset present with appropriate bump type

### Approval Criteria

All checklist items satisfied. No blocking issues.

### Common Rejections

- Missing test coverage for a public property or event
- CEM not regenerated after API change
- Hardcoded color or spacing value
- Missing ARIA attributes on interactive element

---

## Tier 2: Strict Enforcer (`senior-code-reviewer`)

**Agent:** Catherine R. Volkov
**Focus:** What did Tier 1 miss? Is the API well-designed?

### Checks (in addition to Tier 1)

- [ ] Naming consistency: properties, methods, events, CSS parts
- [ ] Design token usage: correct cascade level, proper fallbacks
- [ ] Lit patterns optimal: no unnecessary re-renders, efficient template expressions
- [ ] Edge cases handled: empty values, null, undefined, rapid state changes
- [ ] API design: intuitive property names, consistent with existing components
- [ ] Event design: correct `bubbles` and `composed` settings, meaningful detail
- [ ] Slot design: appropriate use of default vs named slots
- [ ] CSS part design: right granularity, follows existing patterns
- [ ] Type safety: generic constraints, union types, discriminated unions
- [ ] Shadow DOM encapsulation: no style leaks, proper scoping
- [ ] Form association: `ElementInternals` used correctly for form components
- [ ] Conditional rendering: `nothing` instead of empty string, guard clauses

### Approval Criteria

No issues found beyond what Tier 1 already verified. API design is sound and consistent.

### Common Rejections

- Property named `type` when existing components use `variant`
- Missing fallback in CSS custom property chain
- Event that should bubble but does not
- Unnecessary getter/setter when `@property` decorator suffices
- `disabled` property without matching `:host([disabled])` styles

---

## Tier 3: Final Boss (`chief-code-reviewer`)

**Agent:** Viktor S. Kozlov
**Focus:** Surgical precision. Nothing extraneous ships.

### Checks (in addition to Tiers 1 and 2)

- [ ] No trailing whitespace
- [ ] No unnecessary comments (code should be self-documenting)
- [ ] No wasted abstractions (premature generalization, over-engineering)
- [ ] Import order consistent and minimal
- [ ] No unused imports or variables
- [ ] Template literals: no unnecessary interpolation
- [ ] CSS: no redundant properties, no overrides that cancel each other
- [ ] Test assertions: meaningful, not just "it exists"
- [ ] Story quality: demonstrates real use cases, not just property toggles
- [ ] JSDoc: concise, accurate, no filler words
- [ ] Commit message: clear, imperative, concise
- [ ] Changeset description: user-facing, meaningful

### Approval Criteria

The code is production-ready with zero waste. Every line earns its place.

### Common Rejections

- Comment that restates what the code does (`// set the label` before `this.label = label`)
- Abstraction with only one use site
- Test that asserts `toBeDefined()` without checking actual behavior
- CSS property that is overridden two lines later
- Import that could be more specific

---

## Invoking Reviews

### Automated (via protoMaker)

When a PR is created, protoMaker can route through the review tiers:

1. Feature moves to `review` status
2. Tier 1 agent reviews the PR
3. If approved, Tier 2 agent reviews
4. If approved, Tier 3 agent reviews
5. If all approved, PR is merge-ready

### Manual Invocation

```
# In Claude Code
/code-reviewer — review the changes in PR #123
/senior-code-reviewer — review the changes in PR #123
/chief-code-reviewer — review the changes in PR #123
```

---

## Handling Rejections

### Process

1. Reviewer leaves specific comments on the PR
2. Implementor addresses each comment with code changes
3. Implementor re-requests review from the same tier
4. Reviewer verifies fixes and either approves or adds new comments
5. Only after current tier approves does the next tier begin

### Rules

- Every review comment must be addressed in code (not just acknowledged)
- "Will fix later" is not acceptable -- fix now or explain why it is out of scope
- If a Tier 3 reviewer finds something Tier 1 should have caught, that is a signal to improve Tier 1
- Reviewers should cite the specific standard or convention being violated

---

## Escalation Paths

| Situation | Action |
|-----------|--------|
| Reviewer and implementor disagree on approach | Escalate to `principal-engineer` for architecture decision |
| Review is blocked by unclear requirements | Escalate to `vp-engineering` for clarification |
| Performance concern raised during review | Bring in `performance-engineer` for analysis |
| Accessibility concern raised during review | Bring in `accessibility-engineer` for audit |
| Breaking change detected | Escalate to `cto` for versioning decision |

---

## Quality Metrics

Track review effectiveness:

- **Tier 1 pass rate:** What percentage of PRs pass Tier 1 on first attempt?
- **Tier escape rate:** What percentage of Tier 3 findings should have been caught by Tier 1 or 2?
- **Review cycle time:** How long from PR creation to all-tiers-approved?
- **Rejection categories:** Most common rejection reasons per tier (drives process improvement)
