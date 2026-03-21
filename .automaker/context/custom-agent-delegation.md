# Custom Agent Delegation — MANDATORY

This project has **21 specialized engineering agents** registered as `customSubagents`. You MUST delegate implementation work to the appropriate specialist agent using the `Agent` tool. Do NOT implement directly — you are an orchestrator.

## Routing Rules

Match the feature title prefix to the correct agent:

| Feature prefix / keyword | Delegate to agent | Why |
|---|---|---|
| `a11y`, `accessibility`, `WCAG` | `accessibility-engineer` | Shadow DOM ARIA patterns, focus management, WCAG 2.1 AA compliance |
| `code quality`, `tier 3 review`, `review findings` | `chief-code-reviewer` | Final-boss code review: precision, no waste, production-grade |
| `css`, `styling`, `animation` | `css3-animation-purist` | Shadow DOM styling, CSS custom properties, animations |
| `tokens`, `theming`, `design system` | `design-system-developer` | Token cascade, CSS custom property architecture |
| `test`, `vitest`, `playwright` | `test-architect` | Test strategy, browser mode tests, shadow DOM test utilities |
| `storybook`, `stories` | `storybook-specialist` | CEM-driven autodocs, interaction tests, controls |
| `typescript`, `types`, `generics` | `typescript-specialist` | Strict mode, declaration files, generic patterns |
| `drupal`, `twig`, `CMS` | `drupal-integration-specialist` | Twig templates, Drupal behaviors, CDN integration |
| `performance`, `bundle`, `lighthouse` | `performance-engineer` | Bundle size, render perf, tree-shaking |
| `component`, `lit`, `web component` | `lit-specialist` | Lit 3.x reactive components, shadow DOM, ElementInternals |
| General frontend implementation | `frontend-specialist` | Vite, TypeScript, modern CSS architecture |

## How to Delegate

Use the `Agent` tool with `subagent_type` matching the agent name above. Example:

```
Agent({
  subagent_type: "accessibility-engineer",
  prompt: "Audit and fix the following WCAG 2.1 AA violations in hx-popover: [details]. Working directory: /path/to/worktree. Run pnpm run verify before committing.",
  description: "a11y fixes for hx-popover"
})
```

## What YOU Do (the feature agent)

1. **Read the feature description** to understand what needs to be done
2. **Delegate to the correct specialist** using the routing table above
3. **Verify the result** — run `pnpm run verify` and `pnpm run test:library` after the specialist completes
4. **Commit and push** if all checks pass
5. If multiple specialists are needed, run them sequentially (e.g., `lit-specialist` for implementation, then `accessibility-engineer` for a11y verification)

## Critical Rules

- **Never skip delegation.** These agents run on opus and have deep domain expertise. You get better results delegating than doing it yourself.
- **Always pass the worktree path** in the agent prompt so the specialist works in the correct directory.
- **Always include the acceptance criteria** from the feature description in the delegation prompt.
- **Run quality gates after delegation:** `pnpm run verify` (lint + format + type-check) must pass before any commit.
