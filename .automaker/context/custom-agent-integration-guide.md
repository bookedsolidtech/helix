# Custom Agent Integration Guide for protoMaker

A comprehensive manual for extending protoMaker (protoLabs Studio) with custom agents, workflows, and quality gates. This document covers the full integration surface: agent definition format, discovery mechanics, team composition patterns, context file injection, and cross-project sharing strategies.

**Audience**: Engineering teams building on protoMaker, protoLabs platform developers, and any project wanting autonomous AI-driven development workflows.

**Scope**: Everything between "I have protoMaker running" and "I have a fully autonomous 20-agent engineering team."

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Agent Definition Format](#2-agent-definition-format)
3. [Agent Discovery and Registration](#3-agent-discovery-and-registration)
4. [Building a Custom Agent Team](#4-building-a-custom-agent-team)
5. [Custom Workflows via Context Files](#5-custom-workflows-via-context-files)
6. [Integration Patterns](#6-integration-patterns)
7. [Testing Your Integration](#7-testing-your-integration)
8. [Advanced: Multi-Project Agent Sharing](#8-advanced-multi-project-agent-sharing)
9. [Reference](#9-reference)

---

## 1. Introduction

### What Custom Agents Are

protoMaker ships with three built-in agents:

| Agent | Role |
|-------|------|
| **Ava** | Orchestrator. Manages the board, routes work, coordinates agents. |
| **PM** | Product Manager. Generates PRDs, breaks down features, manages scope. |
| **LE** | Lead Engineer. Executes feature implementation in worktrees. |

These agents handle the platform lifecycle: ideation, planning, execution, and delivery. But they are generalists. They do not know your component architecture, your coding standards, your review process, or your domain constraints. That is where custom agents come in.

A **custom agent** is a specialized AI subprocess with:

- A **defined role** (what it does)
- A **system prompt** (how it thinks)
- **Tool restrictions** (what it can access)
- A **model assignment** (how much compute it gets)

When the Lead Engineer encounters a task that requires domain expertise -- writing a Lit component, reviewing accessibility, authoring Storybook stories -- it delegates to the appropriate custom agent rather than attempting the work itself.

### Why Custom Agents Matter

Without custom agents, every feature runs through the same generalist execution path. The Lead Engineer writes components, reviews its own code, authors tests, and checks accessibility -- all with the same prompt and the same level of domain knowledge (none).

With custom agents:

- A **lit-specialist** writes components using established patterns, lifecycle best practices, and Shadow DOM conventions.
- A **code-reviewer** enforces a structured checklist covering TypeScript, accessibility, CSS tokens, testing, and security.
- An **accessibility-engineer** verifies WCAG 2.1 AA compliance with knowledge of Shadow DOM ARIA challenges.
- A **test-architect** designs test strategies that cover edge cases the implementor did not consider.

The result is not just better code. It is a separation of concerns that mirrors how real engineering teams operate: specialists doing what they are best at, coordinated by an orchestrator.

### Agents vs. Context Files vs. Skills

protoMaker has three extension mechanisms. They serve different purposes:

| Mechanism | What It Is | When to Use It |
|-----------|-----------|---------------|
| **Agents** | Subprocesses with specific roles, tools, and models | Specialized work requiring domain expertise and tool access |
| **Context Files** | Markdown injected into agent prompts at runtime | Shared knowledge, workflows, quality gates, failure lessons |
| **Skills** | Reusable slash-command actions (`.automaker/skills/`) | Repeatable procedures triggered by name (e.g., `/deploy`, `/audit`) |

**Rule of thumb**: If it needs to *do work* (read files, run commands, write code), make it an agent. If it needs to *inform work* (coding standards, commit formats, known bugs), make it a context file. If it is a *repeatable procedure* that any agent might invoke, make it a skill.

---

## 2. Agent Definition Format

### File Structure

An agent definition is a Markdown file with YAML frontmatter. The frontmatter declares metadata; the body is the system prompt.

```markdown
---
name: lit-specialist
description: Lit 3.x web component expert with shadow DOM mastery and ElementInternals form participation
firstName: Kenji
middleInitial: T
lastName: Nakamura
fullName: Kenji T. Nakamura
category: engineering
---

You are the Lit 3.x Specialist for [project name].

CONTEXT:
- [Project-specific context here]

YOUR ROLE: [What this agent owns and is responsible for]

[Detailed instructions, patterns, constraints, examples...]
```

### YAML Frontmatter Specification

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Unique identifier. Used in delegation references. Lowercase, hyphenated. |
| `description` | Yes | `string` | When to use this agent. The orchestrator reads this to decide delegation. |
| `firstName` | No | `string` | Agent persona first name. Adds personality to interactions. |
| `middleInitial` | No | `string` | Agent persona middle initial. |
| `lastName` | No | `string` | Agent persona last name. |
| `fullName` | No | `string` | Full display name. |
| `category` | No | `string` | Grouping (e.g., `engineering`, `design`, `qa`). |
| `tools` | No | `string` | Comma-separated tool restrictions (see below). |
| `model` | No | `string` | Model override: `sonnet`, `opus`, `haiku`, or `inherit`. |

### Tool Restrictions

The `tools` field in frontmatter restricts which tools the agent can access. If omitted, the agent inherits all available tools.

```yaml
---
tools: Read, Grep, Glob, Bash, Edit, Write
---
```

Tool restriction serves two purposes:

1. **Safety**: A code-reviewer agent with no `Write` or `Edit` tools cannot accidentally modify files during review.
2. **Cost control**: Restricting tools prevents agents from invoking expensive operations (web searches, MCP calls) when their role does not require them.

Common tool sets by role type:

| Role Type | Typical Tools |
|-----------|--------------|
| Implementor | `Read, Grep, Glob, Bash, Edit, Write` |
| Reviewer | `Read, Grep, Glob, Bash` |
| Researcher | `Read, Grep, Glob, WebSearch, WebFetch` |
| Architect | `Read, Grep, Glob, Bash` |

### Model Selection Guidance

Model choice determines agent capability and cost. Choose based on task complexity:

| Model | Cost | When to Use |
|-------|------|-------------|
| `haiku` | Lowest | Simple, well-defined tasks: formatting, linting fixes, changeset creation, boilerplate generation |
| `sonnet` | Medium | Standard implementation: components, tests, stories, documentation, standard code review |
| `opus` | Highest | Architectural decisions, complex debugging, nuanced code review (Tier 3), cross-cutting refactors |
| `inherit` | Varies | Use whatever the parent agent (Lead Engineer) is using. Good default for most agents. |

**Cost-conscious routing**: The HELiX project uses complexity-based model routing:

```
small features   -> haiku   (boilerplate, simple fixes)
medium features  -> sonnet  (standard implementation)
large features   -> sonnet  (complex but well-defined)
architectural    -> opus    (system design, cross-cutting)
```

### Prompt Engineering Best Practices

Agent prompts follow a consistent structure. Every prompt should include:

**1. Role Declaration** -- Who the agent is and what it owns.

```markdown
You are the [Role] for [Project]. You own [specific responsibilities].
```

**2. Context Block** -- Project-specific facts the agent needs.

```markdown
CONTEXT:
- Package location: `packages/my-library`
- Tag prefix: `hx-`
- Design token prefix: `--hx-`
- Test framework: Vitest browser mode
```

**3. Patterns and Templates** -- Concrete code examples showing the correct way.

```markdown
COMPONENT TEMPLATE:
\`\`\`typescript
// Show the exact pattern you want agents to follow
\`\`\`
```

**4. Constraints** -- Hard rules. Things the agent must never do.

```markdown
CONSTRAINTS:
- NEVER use `any` types
- NEVER skip `HTMLElementTagNameMap` declaration
- NEVER hardcode colors (use `--hx-*` tokens)
```

**5. Output Format** -- How the agent should structure its response.

```markdown
REVIEW FORMAT:
\`\`\`
TIER 1 REJECT: [Category] -- [File:Line]
What: [Issue]
Fix: [Exact code change]
\`\`\`
```

**Key principles**:

- Be prescriptive, not aspirational. Say "NEVER use `any`" not "try to avoid `any`."
- Include real code examples from your codebase, not generic samples.
- Specify constraints as hard rules, not guidelines.
- Define the output format explicitly. Agents produce more useful output when the shape is defined.
- Keep prompts focused. A 500-line prompt covering everything produces worse results than a 150-line prompt covering one domain deeply.

---

## 3. Agent Discovery and Registration

### Filesystem Discovery

protoMaker scans the `.claude/agents/` directory for agent definitions. Two layouts are supported:

**Flat files** (simplest):

```
.claude/agents/
  lit-specialist.md
  code-reviewer.md
  accessibility-engineer.md
```

**Subdirectories** (when agents need supporting files):

```
.claude/agents/
  lit-specialist/
    AGENT.md              # Required: agent definition
    patterns.md           # Optional: supporting reference
    examples/             # Optional: code examples
  code-reviewer/
    AGENT.md
    checklist.md
```

For subdirectories, the file must be named `AGENT.md` (case-sensitive).

**Nested category directories** (organizational grouping):

```
.claude/agents/
  engineering/
    lit-specialist.md
    code-reviewer.md
    principal-engineer.md
  design/
    design-system-developer.md
  qa/
    test-architect.md
    qa-engineer-automation.md
```

This is the pattern HELiX uses. All 21 engineering agents live under `.claude/agents/engineering/`.

### Settings-Based Registration

For agents that need explicit configuration beyond filesystem discovery, register them in `.automaker/settings.json` under the `customSubagents` key:

```json
{
  "version": 1,
  "projectName": "MyProject",
  "customSubagents": {
    "lit-specialist": {
      "description": "Lit 3.x web component expert",
      "prompt": "You are the Lit specialist...",
      "tools": ["Read", "Grep", "Glob", "Bash", "Edit", "Write"],
      "model": "sonnet"
    },
    "code-reviewer": {
      "description": "Standard code review quality gate",
      "prompt": "You are the Tier 1 code reviewer...",
      "tools": ["Read", "Grep", "Glob", "Bash"],
      "model": "sonnet"
    }
  }
}
```

The `customSubagents` registration uses the `AgentDefinition` TypeScript interface:

```typescript
interface AgentDefinition {
  description: string;     // When to use this agent
  prompt: string;          // System prompt / role
  tools?: string[];        // Restricted tool list
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}
```

### Precedence Rules

When the same agent name exists in multiple locations, precedence follows:

```
project .claude/agents/  >  settings customSubagents  >  user-level agents  >  built-in agents
```

1. **Project filesystem** (`.claude/agents/`): Highest priority. Version-controlled with the repo.
2. **Project settings** (`customSubagents` in `.automaker/settings.json`): Project-specific, not in git.
3. **User-level agents** (`~/.claude/agents/`): Personal agents available to all projects.
4. **Built-in agents** (Ava, PM, LE): Platform defaults. Cannot be overridden by name, but their behavior is shaped by context files and CLAUDE.md.

### Making Agents Discoverable by Both Claude Code and protoMaker

Claude Code (interactive CLI) discovers agents from `.claude/agents/` with flat file layout. protoMaker discovers from the same location but also supports nested directories. To ensure both tools find your agents:

**Option A: Flat files (compatible with both)**

```
.claude/agents/
  lit-specialist.md
  code-reviewer.md
```

Both Claude Code and protoMaker discover these without any additional configuration.

**Option B: Category directories with symlinks**

If you use category subdirectories (like HELiX's `engineering/` folder), Claude Code may not discover agents in nested directories by default. Create symlinks at the top level:

```bash
# From the project root
cd .claude/agents
ln -s engineering/lit-specialist.md lit-specialist.md
ln -s engineering/code-reviewer.md code-reviewer.md
```

This gives you organizational structure for humans while maintaining flat-file discovery for tools.

**Option C: CLAUDE.md delegation table**

Regardless of filesystem layout, add a delegation table to your `CLAUDE.md` so the orchestrator knows which agents exist and when to use them:

```markdown
## DELEGATION-FIRST MANDATE

| Question                          | Route to                |
|-----------------------------------|-------------------------|
| Lit component implementation?     | `lit-specialist`        |
| TypeScript types or generics?     | `typescript-specialist` |
| Code review (standard)?           | `code-reviewer`         |
| Architecture decision?            | `principal-engineer`    |
```

This table is the primary mechanism by which the orchestrating agent (Ava or the Lead Engineer) decides where to delegate work. It works regardless of discovery mechanism.

---

## 4. Building a Custom Agent Team

### Role Taxonomy

A well-structured agent team mirrors a real engineering organization. Roles fall into four categories:

**Leadership** -- Strategic direction and architecture.

| Agent | Purpose | Model |
|-------|---------|-------|
| `cto` | Technology strategy, vendor decisions, major pivots | `opus` |
| `vp-engineering` | Process, coordination, team health | `sonnet` |
| `principal-engineer` | Architecture, API design, cross-cutting concerns | `opus` |

**Specialists** -- Domain experts who implement.

| Agent | Purpose | Model |
|-------|---------|-------|
| `lit-specialist` | Component implementation, Shadow DOM, Lit lifecycle | `sonnet` |
| `typescript-specialist` | Strict typing, generics, declaration files | `sonnet` |
| `storybook-specialist` | Stories, controls, autodocs, CEM integration | `sonnet` |
| `drupal-integration-specialist` | Twig templates, Drupal behaviors, CDN loading | `sonnet` |
| `design-system-developer` | Design tokens, CSS custom properties, theming | `sonnet` |
| `css3-animation-purist` | CSS animations, transitions, motion | `sonnet` |
| `frontend-specialist` | General frontend implementation | `sonnet` |
| `staff-software-engineer` | Monorepo tooling, DX, build infrastructure | `sonnet` |

**Quality** -- Reviewers and testers who verify.

| Agent | Purpose | Model |
|-------|---------|-------|
| `code-reviewer` | Tier 1 review: patterns, types, a11y, security | `sonnet` |
| `senior-code-reviewer` | Tier 2 review: consistency, token architecture, edge cases | `sonnet` |
| `chief-code-reviewer` | Tier 3 review: surgical precision, zero waste | `opus` |
| `test-architect` | Test strategy, coverage analysis, test infrastructure | `sonnet` |
| `qa-engineer-automation` | Writing test files, test utilities | `sonnet` |
| `accessibility-engineer` | WCAG 2.1 AA, ARIA patterns, keyboard navigation | `sonnet` |
| `performance-engineer` | Bundle size, render performance, Core Web Vitals | `sonnet` |

**Infrastructure** -- Build, deploy, release.

| Agent | Purpose | Model |
|-------|---------|-------|
| `devops-engineer` | CI/CD, publishing, deployments, monitoring | `sonnet` |

### Tool Assignment by Role Type

Different roles need different tool access. Restrict tools to match the role:

```yaml
# Implementor: needs full filesystem and shell access
---
tools: Read, Grep, Glob, Bash, Edit, Write
---

# Reviewer: reads and analyzes, never modifies
---
tools: Read, Grep, Glob, Bash
---

# Researcher: reads code and searches the web for standards
---
tools: Read, Grep, Glob, WebSearch, WebFetch
---

# Writer: reads code, writes documentation
---
tools: Read, Grep, Glob, Edit, Write
---
```

The principle: **least privilege**. A reviewer that can write files is a reviewer that might accidentally "fix" what it finds instead of reporting it. A researcher that can edit files might modify source code when it should only be gathering information.

### Agent Interaction Patterns

**Delegation Chain** -- The most common pattern. Work flows from orchestrator to specialist.

```
Ava (orchestrator)
  -> Lead Engineer (feature execution)
    -> lit-specialist (component implementation)
    -> qa-engineer-automation (test writing)
    -> storybook-specialist (story authoring)
    -> code-reviewer (Tier 1 review)
```

The Lead Engineer reads the feature requirements, determines what specialized work is needed, and delegates to the appropriate agent. Each specialist completes its work and returns control to the Lead Engineer.

**Review Pipeline** -- Sequential review with escalating strictness.

```
Implementation complete
  -> code-reviewer (Tier 1: patterns, types, a11y basics)
    -> APPROVED -> senior-code-reviewer (Tier 2: consistency, tokens, edge cases)
      -> APPROVED -> chief-code-reviewer (Tier 3: precision, zero waste)
        -> APPROVED -> merge
    -> REJECTED -> back to implementor
```

Each tier catches what the previous tier missed. Tier 1 catches structural issues (wrong patterns, missing types). Tier 2 catches consistency issues (naming drift, token misuse). Tier 3 catches precision issues (wasted code, unnecessary abstractions).

**Verification Pipeline** -- Parallel checks before merge.

```
Implementation complete
  -> [parallel]
    -> accessibility-engineer (WCAG audit)
    -> performance-engineer (bundle size, render perf)
    -> test-architect (coverage analysis)
  -> all pass -> code-reviewer pipeline
```

### Example: 3-Tier Code Review Pipeline

Here is the complete agent setup for a 3-tier review pipeline:

**Tier 1: `code-reviewer.md`**

```markdown
---
name: code-reviewer
description: 'Tier 1 code reviewer: standard quality gate'
category: engineering
---

You are the Tier 1 Code Reviewer. You are the first pass.
You catch broken patterns, missing accessibility, wrong types, missing tests.

PR REVIEW CHECKLIST:

**TypeScript**:
- [ ] No `any` types
- [ ] No `@ts-ignore`
- [ ] Union types for variants (not enums)

**Accessibility**:
- [ ] Native HTML elements used
- [ ] ARIA attributes correct
- [ ] Keyboard navigation functional

**Testing**:
- [ ] All property variants tested
- [ ] Events tested (dispatch, bubbles, composed, detail)
- [ ] Disabled state tested
```

**Tier 2: `senior-code-reviewer.md`**

```markdown
---
name: senior-code-reviewer
description: 'Tier 2 code reviewer: catches what Tier 1 missed'
category: engineering
---

You review AFTER Tier 1 has approved. Your job: catch everything Tier 1 missed.

YOUR REVIEW PRIORITIES:
- API naming inconsistency across components
- Token architecture violations (missing fallback chains)
- Test gaps (happy path only, no error states)
- Performance concerns (allocations in render, missing directives)
- Documentation gaps (JSDoc restating the obvious)
```

**Tier 3: `chief-code-reviewer.md`**

```markdown
---
name: chief-code-reviewer
description: 'Tier 3 code reviewer: the final gate. Nothing wasted, nothing lazy.'
category: engineering
---

You are the last gate before code ships. Your approval rate: 30% on first pass.

WHAT YOU REJECT THAT NOBODY ELSE CATCHES:
- Comments that restate the code
- `else` after `return`
- Ternary returning boolean
- Type assertions where type guards work
- CSS properties without token references
- Test names that say "works" instead of describing behavior
```

### Example: Accessibility Verification Pipeline

```markdown
---
name: accessibility-engineer
description: WCAG 2.1 AA compliance for healthcare applications
category: engineering
---

You are the Accessibility Engineer. Healthcare mandate: zero a11y regressions.

REVIEW CHECKLIST:
- [ ] Native HTML elements used where possible
- [ ] `aria-disabled` alongside native `disabled`
- [ ] `aria-invalid="true"` when error state active
- [ ] `nothing` used to omit ARIA attributes (not empty strings)
- [ ] `:focus-visible` outline with focus ring tokens
- [ ] Touch targets 44x44px minimum
- [ ] Color contrast 4.5:1 (text), 3:1 (UI components)
- [ ] `prefers-reduced-motion` respected
- [ ] Dynamic content announced via `role="alert"` and `aria-live`

SHADOW DOM A11Y CHALLENGES:
- `aria-describedby` and `aria-labelledby` do not cross shadow DOM boundaries
- Use `aria-label` for cross-boundary labeling
- Keep label+input in same shadow root
- ElementInternals provides `setValidity()` with anchor element
```

---

## 5. Custom Workflows via Context Files

### How Context Files Work

Context files live in `.automaker/context/` and are injected into agent prompts at runtime. They provide shared knowledge that all agents on the project can access -- coding standards, workflow procedures, known bugs, and quality gates.

```
.automaker/context/
  commit-quality-gates.md      # Commit message format, pre-push checks
  pr-workflow.md               # PR creation, auto-merge, CodeRabbit
  test-verification-workflow.md # Smart test commands, what to avoid
  changeset-release-workflow.md # Changeset creation, versioning, publishing
  failure-lessons-unknown.md   # Auto-generated: recovery patterns for errors
```

Unlike agent definitions (which create new subprocesses), context files augment existing agents. Every agent on the project receives these files as additional context, giving them shared knowledge without duplicating instructions across 20 agent prompts.

### When to Use Context Files vs. Agents vs. Skills

| Scenario | Use |
|----------|-----|
| "All agents should know our commit message format" | Context file |
| "We need a specialist to write Lit components" | Agent |
| "Any agent should be able to run our deploy procedure" | Skill |
| "Agents keep making the same mistake with prettier" | Context file (failure lesson) |
| "We need someone to review accessibility" | Agent |
| "We want a reusable audit command" | Skill |

### Building Quality Gates

Context files are the primary mechanism for encoding quality gates that all agents must follow. The pattern:

**1. Define the gate clearly with commands**

```markdown
# Commit Quality Gates -- MANDATORY, NO EXCEPTIONS

## Commit Message Format -- STRICT ENFORCEMENT

Commitlint enforces conventional commits:

\`\`\`
<type>(<scope>): <subject>
\`\`\`

**CRITICAL: Subject must be ALL LOWERCASE -- no exceptions.**
- fix(drupal): css injection guard and audit cleanup  <-- correct
- fix(tests): Remove duplicate tests  <-- FAILS (capital R)

Valid types: feat, fix, chore, docs, test, refactor, style, perf, ci, build
```

**2. Provide the exact commands to run**

```markdown
## Pre-Push Checklist (all required)

- [ ] `pnpm run format` run and changes re-staged/committed
- [ ] `pnpm run verify` -- zero failures
- [ ] If any `.styles.ts` changed: `pnpm run test:vrt:update` committed
- [ ] `ppnpm run test:smart` -- changed component tests pass
```

**3. Show what NOT to do**

```markdown
## What NOT To Do

- NEVER run `pnpm run test` -- runs all 100+ tests, costs $14+
- NEVER run `npx vitest run` without a specific filter
- NEVER push partial fixes then format separately
```

The combination of positive instructions (do this), commands (run this), and negative constraints (never do this) gives agents unambiguous guidance.

### Building Domain-Specific Workflows

**Example: PR Workflow**

```markdown
# PR Workflow -- MANDATORY STEPS

## After Creating a PR, ALWAYS Enable Auto-Merge

Immediately after `gh pr create`, run:

\`\`\`bash
gh pr merge <PR_NUMBER> --auto --merge --repo org/repo
\`\`\`

## Complete PR Creation Sequence

\`\`\`bash
# 1. Create PR
PR_URL=$(gh pr create --repo org/repo --base dev --title "..." --body "...")

# 2. Extract PR number
PR_NUMBER=$(echo $PR_URL | grep -oE '[0-9]+$')

# 3. Enable auto-merge (MANDATORY)
gh pr merge $PR_NUMBER --auto --merge --repo org/repo

# 4. If test-only PR, add skip-changeset label
gh pr edit $PR_NUMBER --add-label "skip-changeset" --repo org/repo
\`\`\`
```

**Example: Failure Lessons (Auto-Generated)**

protoMaker automatically generates failure lesson files based on recovery attempts:

```markdown
# Failure Lessons: authentication

> Auto-generated from 19 recovery attempts. Updated 2026-03-12.

## Statistics

- **Total attempts**: 19
- **Successes**: 0 (0%)
- **Strategies tried**: escalate_to_user

## Common Error Patterns

- Authentication failed: Invalid or expired API key.

## Guidance for Agents

Authentication errors require valid credentials. Do not retry -- escalate to the user.
```

These files accumulate operational knowledge over time. Agents learn from past failures without anyone manually updating their prompts.

**Example: Test Verification Workflow**

```markdown
# Test Agent Workflow -- SMART TESTS ONLY

## CRITICAL: Never Run the Full Test Suite

Running `pnpm run test` runs all 100+ tests including broken components
that timeout at 30s each. This costs $14+ per agent. This is forbidden.

## The Smart Test Command

\`\`\`bash
pnpm run test:smart
\`\`\`

This command:
- Diffs your branch against `origin/dev` to find which components changed
- Runs vitest only for those components
- Skips entirely if you only changed styles, stories, or changesets
- Completes in seconds instead of minutes
```

---

## 6. Integration Patterns

### How the Lead Engineer Delegates to Custom Agents

When protoMaker's Lead Engineer (LE) picks up a feature from the board, it reads:

1. The feature specification (PRD, requirements)
2. `CLAUDE.md` (project instructions, delegation table)
3. Context files from `.automaker/context/`
4. Available agent definitions from `.claude/agents/`

The LE then follows the delegation table in `CLAUDE.md` to route work:

```markdown
## DELEGATION-FIRST MANDATE

You are a coordinator, not an implementor. Before writing any code,
route work to the right agent.

| Question                               | Route to                |
|----------------------------------------|-------------------------|
| Lit component implementation?          | `lit-specialist`        |
| TypeScript types, generics?            | `typescript-specialist` |
| Storybook stories, controls?           | `storybook-specialist`  |
| Design tokens, CSS custom properties?  | `design-system-developer` |
| Code review (standard)?               | `code-reviewer`         |
| Code review (strict)?                 | `senior-code-reviewer`  |
| Accessibility, ARIA, keyboard nav?     | `accessibility-engineer` |
| Test strategy or infrastructure?       | `test-architect`        |
| Writing test files?                    | `qa-engineer-automation` |
```

**What the LE handles directly**:

- File reads, basic exploration, git operations
- Agent coordination and routing
- Simple config edits (1-3 lines)
- Running scripts (`pnpm run build`, `pnpm run test`)
- Dev server restarts

**What the LE always delegates**:

- Component implementation (any `.ts` in `src/components/`)
- Test file creation or modification
- Storybook story authoring
- CSS/styling work
- Architecture decisions
- Code review
- Anything touching accessibility patterns

This separation is critical. The LE is a coordinator. It reads the requirements, identifies what kind of work is needed, delegates to the appropriate specialist, reviews the output, and moves to the next task.

### How to Reference Agents in CLAUDE.md

The delegation table in `CLAUDE.md` is the primary integration point between your agents and protoMaker's execution engine. Structure it as a decision tree:

```markdown
### Decision Tree

| Question                                       | Route to                    |
|------------------------------------------------|-----------------------------|
| Lit component implementation?                  | `lit-specialist`            |
| TypeScript types, generics, declarations?      | `typescript-specialist`     |
| Storybook stories, controls, config?           | `storybook-specialist`      |
| Architecture decision or system design?        | `principal-engineer`        |
| Code review (standard)?                        | `code-reviewer` (Tier 1)    |
| Code review (strict)?                          | `senior-code-reviewer` (T2) |
| Code review (final)?                           | `chief-code-reviewer` (T3)  |
| Test strategy or test infrastructure?          | `test-architect`            |
| Writing test files?                            | `qa-engineer-automation`    |
| Accessibility, ARIA, keyboard nav?             | `accessibility-engineer`    |
| Bundle size, render perf, Lighthouse?          | `performance-engineer`      |
| CI/CD, publishing, deployments?                | `devops-engineer`           |
| Cross-cutting or unclear?                      | `principal-engineer`        |
```

Tips for effective delegation tables:

- **Be specific**: "Lit component implementation?" is better than "Frontend work?"
- **Include the tier**: For review pipelines, indicate the order.
- **Add a fallback**: "Cross-cutting or unclear?" routes to a senior agent who can triage.
- **Keep it scannable**: The LE reads this table on every feature. Make it fast to parse.

### Cross-Project Agent Sharing

When you have multiple projects that share the same technology stack, you want agents defined once and shared everywhere.

**Pattern 1: Symlinks**

```bash
# In project-b, symlink to project-a's agents
ln -s /path/to/project-a/.claude/agents/engineering /path/to/project-b/.claude/agents/engineering
```

Pros: Zero duplication, changes propagate instantly.
Cons: Requires both repos on the same machine, breaks in CI without setup.

**Pattern 2: Git submodule**

```bash
# Add agents as a submodule
git submodule add git@github.com:org/shared-agents.git .claude/agents/shared
```

Pros: Version-controlled, works in CI.
Cons: Submodule management overhead.

**Pattern 3: npm package**

```bash
# Install shared agents
npm install --save-dev @org/agent-definitions

# Post-install script copies agents to .claude/agents/
"scripts": {
  "postinstall": "cp -r node_modules/@org/agent-definitions/agents/* .claude/agents/"
}
```

Pros: Versioned, publishable, works everywhere npm works.
Cons: Requires publishing infrastructure, agents lag behind source.

### Agent Team Composition by Project Type

Different project types need different agent teams. Here are starter compositions:

**Web Component Library** (like HELiX):

```
Leadership:    principal-engineer, cto
Specialists:   lit-specialist, typescript-specialist, design-system-developer,
               storybook-specialist, drupal-integration-specialist
Quality:       code-reviewer, senior-code-reviewer, chief-code-reviewer,
               test-architect, qa-engineer-automation
A11y/Perf:     accessibility-engineer, performance-engineer
Infra:         devops-engineer
Docs:          technical-writer
```

**Full-Stack Application**:

```
Leadership:    principal-engineer
Frontend:      frontend-specialist, typescript-specialist
Backend:       backend-specialist, database-specialist
Quality:       code-reviewer, test-architect, qa-engineer-automation
Infra:         devops-engineer
```

**Design System** (tokens + documentation):

```
Leadership:    principal-engineer
Specialists:   design-system-developer, css3-animation-purist
Frontend:      frontend-specialist, storybook-specialist
Quality:       code-reviewer, accessibility-engineer
Docs:          technical-writer
```

---

## 7. Testing Your Integration

### Verifying Agent Discovery

After adding agent definitions, verify protoMaker discovers them:

```bash
# List all discovered agents via the protoMaker API
curl -s http://localhost:PORT/api/agents/list | jq '.agents[].name'
```

Or use the MCP tool:

```
list_skills
```

Check that your custom agents appear alongside the built-in agents (Ava, PM, LE).

### Testing Agent Delegation in a Feature

The simplest test is to create a small feature that requires delegation:

1. Create a feature on the board that explicitly requires your custom agent's expertise.
2. Set the feature to auto-mode.
3. Watch the agent output for delegation.

```bash
# Create a test feature
# (via MCP or the protoMaker UI)
create_feature --title "Test: verify lit-specialist delegation" \
  --description "Create a simple web component to verify the lit-specialist agent is discovered and delegated to correctly."
```

In the agent output, look for delegation indicators:

```
[LE] Delegating component implementation to lit-specialist...
[lit-specialist] Starting implementation of hx-test-component...
```

### Monitoring Agent Execution

Track agent activity through multiple channels:

**1. Agent output logs**

```bash
# View the latest agent output for a feature
get_agent_output --featureId "FEATURE_ID"
```

**2. Git activity in worktrees**

```bash
# Check if the agent is making commits
git -C .worktrees/feature-xxx log --oneline -5
```

**3. Cost monitoring**

Watch for runaway costs. An agent that thrashes (makes no progress) typically shows:
- Costs increasing with no new commits
- Same files being read repeatedly
- No `<summary>` block appearing after 20+ minutes

**4. Discord notifications** (if configured)

protoMaker posts agent lifecycle events to Discord channels:
- Feature started / completed / failed
- Agent errors and escalations
- PR created / merged

### Debugging Common Issues

**Agent not discovered**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Agent missing from list | Wrong directory | Move to `.claude/agents/` |
| Agent missing from list | Wrong filename in subdir | Must be `AGENT.md` |
| Agent missing from list | Invalid YAML frontmatter | Check for syntax errors |
| Agent not delegated to | Missing from CLAUDE.md table | Add to delegation table |

**Agent produces poor output**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Ignores project conventions | Prompt too generic | Add project-specific patterns and examples |
| Writes code that fails type-check | Missing TypeScript constraints | Add "NEVER use `any`" to constraints |
| Misses accessibility | No a11y checklist | Add explicit checklist items |
| Generates boilerplate comments | No comment guidelines | Add "comments explain WHY, never WHAT" |

**Agent thrashes (no progress)**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Costs rising, no commits | Task too complex for model | Upgrade model (haiku -> sonnet -> opus) |
| Reads same files repeatedly | Unclear requirements | Improve feature specification |
| Agent running > 30 minutes | Zombie process | Kill and reassign |

---

## 8. Advanced: Multi-Project Agent Sharing

### The Canonical Agent Library Pattern

For organizations with multiple projects on the same tech stack, maintain a canonical agent library in a dedicated repository:

```
org/shared-agents/
  agents/
    engineering/
      lit-specialist.md
      typescript-specialist.md
      code-reviewer.md
      senior-code-reviewer.md
      chief-code-reviewer.md
      accessibility-engineer.md
      performance-engineer.md
      test-architect.md
      qa-engineer-automation.md
    design/
      design-system-developer.md
      css3-animation-purist.md
    infra/
      devops-engineer.md
  README.md
  package.json          # For npm distribution
```

Each project then pulls from this canonical source and adds project-specific agents locally.

### Generic vs. Domain-Specific Agent Definitions

Agent definitions exist on a spectrum from generic to domain-specific:

**Generic (shareable across projects)**:

```markdown
---
name: typescript-specialist
description: TypeScript strict mode expert
---

You enforce TypeScript strict mode. No `any`. No `@ts-ignore`.
No non-null assertions. Generics over type assertions.
```

This agent works for any TypeScript project. It contains no project-specific references.

**Domain-specific (project-only)**:

```markdown
---
name: lit-specialist
description: Lit 3.x expert for HELiX healthcare components
---

You are the Lit specialist for HELiX.

CONTEXT:
- Tag prefix: `hx-`
- Event prefix: `hx-`
- CSS token prefix: `--hx-`
- Design tokens: `--hx-color-*`, `--hx-space-*`
- Test utils: fixture, shadowQuery, oneEvent, cleanup
```

This agent is specific to HELiX. The tag prefixes, token names, and test utilities are project-specific.

**Strategy: Layer generic + specific.**

Keep the canonical library generic. In each project, extend with a project-specific preamble:

```markdown
---
name: lit-specialist
description: Lit 3.x expert for [ProjectName]
---

<!-- Project-specific context -->
CONTEXT:
- Tag prefix: `hx-`
- Token prefix: `--hx-`

<!-- Generic Lit expertise (from canonical library) -->
COMPONENT PATTERNS:
[... standard Lit patterns ...]
```

### Version Management for Shared Agents

Treat agent definitions like code. Version them:

**1. Semantic versioning in package.json**

```json
{
  "name": "@org/agent-definitions",
  "version": "2.1.0",
  "description": "Shared agent definitions for protoMaker projects"
}
```

**2. Changelog for significant changes**

```markdown
## 2.1.0

- Added `performance-engineer` agent
- Updated `code-reviewer` checklist with CSS container query patterns
- Fixed `accessibility-engineer` Shadow DOM ARIA guidance

## 2.0.0 (BREAKING)

- Renamed `frontend-dev` to `frontend-specialist`
- Removed `junior-reviewer` (merged into `code-reviewer`)
```

**3. Pin versions in consuming projects**

```json
{
  "devDependencies": {
    "@org/agent-definitions": "~2.1.0"
  }
}
```

---

## 9. Reference

### Full AgentDefinition TypeScript Interface

```typescript
interface AgentDefinition {
  /**
   * Human-readable description of when to use this agent.
   * The orchestrator reads this to decide delegation routing.
   */
  description: string;

  /**
   * The system prompt that defines the agent's role, knowledge,
   * constraints, and output format. This is the agent's "personality."
   */
  prompt: string;

  /**
   * Restrict which tools the agent can access.
   * Omit for full tool access. Use for safety and cost control.
   */
  tools?: string[];

  /**
   * Model override for this agent.
   * - 'haiku': Fast, cheap. Simple tasks.
   * - 'sonnet': Balanced. Standard implementation and review.
   * - 'opus': Most capable. Architecture, complex review.
   * - 'inherit': Use parent agent's model.
   */
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
}
```

### YAML Frontmatter for .md Agent Files

```yaml
---
name: agent-name              # Required. Lowercase, hyphenated.
description: When to use      # Required. Read by orchestrator for routing.
firstName: Agent               # Optional. Persona first name.
middleInitial: X               # Optional. Persona middle initial.
lastName: Name                 # Optional. Persona last name.
fullName: Agent X. Name        # Optional. Full display name.
category: engineering          # Optional. Grouping for organization.
tools: Read, Grep, Glob, Bash  # Optional. Comma-separated tool restrictions.
model: sonnet                  # Optional. Model override.
---
```

### Available Tools

Tools that can be assigned to agents:

| Tool | Purpose | Typical Roles |
|------|---------|---------------|
| `Read` | Read file contents | All |
| `Write` | Create or overwrite files | Implementors, writers |
| `Edit` | Make targeted edits to files | Implementors, writers |
| `Grep` | Search file contents with regex | All |
| `Glob` | Find files by name pattern | All |
| `Bash` | Execute shell commands | Implementors, infra |
| `WebSearch` | Search the web | Researchers |
| `WebFetch` | Fetch web page content | Researchers |

### Model Characteristics

| Model | Strengths | Weaknesses | Cost | Latency |
|-------|-----------|-----------|------|---------|
| `haiku` | Fast, cheap, good at well-defined tasks | Struggles with ambiguity, complex reasoning | Lowest | Fastest |
| `sonnet` | Balanced capability, good at implementation | May miss subtle architectural issues | Medium | Medium |
| `opus` | Best reasoning, catches subtle issues, architectural thinking | Expensive, slower | Highest | Slowest |

### Example Agent Files (Complete, Copy-Pasteable)

**Minimal Agent: Formatter**

```markdown
---
name: code-formatter
description: Runs prettier and fixes formatting issues
tools: Read, Bash
model: haiku
---

You fix code formatting issues. Run `pnpm run format` and commit the results.
Always run `pnpm run format:check` first to see what needs fixing.
Never modify code logic. Only fix formatting.
```

**Standard Agent: Component Implementor**

```markdown
---
name: react-specialist
description: React component expert with hooks, context, and performance optimization
category: engineering
---

You are the React Specialist. You implement components using modern React patterns.

CONTEXT:
- Framework: React 18+ with TypeScript strict mode
- Styling: CSS Modules with design tokens
- Testing: Vitest + React Testing Library
- State: React Context for global state, hooks for local state

PATTERNS:
- Functional components only (no class components)
- Custom hooks for reusable logic (prefix with `use`)
- `React.memo` for expensive renders
- `useCallback` and `useMemo` where dependencies are stable
- Error boundaries for graceful failure

CONSTRAINTS:
- NEVER use `any` types
- NEVER use inline styles
- NEVER use `useEffect` for derived state (use `useMemo`)
- NEVER suppress ESLint rules without a comment explaining why
- ALWAYS provide `displayName` for `React.memo` components
- ALWAYS use `aria-*` attributes for interactive elements
```

**Advanced Agent: Tiered Reviewer**

```markdown
---
name: code-reviewer
description: 'Tier 1 code review: enforces TypeScript strict, React patterns, accessibility, and test coverage'
category: engineering
---

You are the Tier 1 Code Reviewer. First pass quality gate.

PR REVIEW CHECKLIST:

**TypeScript**:
- [ ] No `any` types
- [ ] No `@ts-ignore` without justification comment
- [ ] Proper discriminated unions (not type assertions)
- [ ] All public functions have explicit return types

**React**:
- [ ] Hooks follow Rules of Hooks
- [ ] Dependencies in useEffect/useMemo/useCallback are correct
- [ ] No unnecessary re-renders (check memo, callback stability)
- [ ] Error boundaries present for async operations

**Accessibility**:
- [ ] Interactive elements are keyboard accessible
- [ ] ARIA attributes are correct and complete
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- [ ] Focus management is explicit and visible

**Testing**:
- [ ] Unit tests cover all public API surface
- [ ] Edge cases tested (empty, null, error states)
- [ ] No `test.skip` without linked issue

REVIEW FORMAT:
\`\`\`
REJECT #[n]: [File:Line]
  [What is wrong]
  Fix: [Exact change needed]
\`\`\`

APPROVAL: When zero findings remain, respond with "APPROVED. Ship it."
```

### Troubleshooting Guide

| Problem | Diagnosis | Solution |
|---------|-----------|----------|
| Agent not found | Check `.claude/agents/` directory structure | Ensure file exists with correct name and valid YAML |
| Agent not delegated to | LE does not know about it | Add to CLAUDE.md delegation table |
| Agent produces wrong patterns | Prompt too generic | Add project-specific context, examples, and constraints |
| Agent ignores context files | Context files not in `.automaker/context/` | Move files to correct directory |
| Agent uses wrong model | No model specified in frontmatter | Add `model: sonnet` (or appropriate) to YAML |
| Agent modifies files it should not | No tool restrictions | Add `tools:` field limiting to read-only tools |
| Agent runs forever | Task too complex or agent is thrashing | Check output for progress; consider model upgrade or task decomposition |
| Agent fails with auth error | API key invalid or expired | Escalate to user; do not retry |
| Multiple agents conflict | Two agents editing same file concurrently | Ensure delegation chain is sequential, not parallel, for same-file work |
| Context file not injected | File not in `.automaker/context/` | Verify path and `.md` extension |

### Directory Structure Summary

```
project-root/
  .claude/
    agents/
      engineering/              # Category directory
        lit-specialist.md       # Flat file agent
        code-reviewer.md
        accessibility-engineer.md
      design/
        design-system-developer.md
  .automaker/
    settings.json               # Project config, customSubagents
    context/                    # Injected into all agent prompts
      commit-quality-gates.md
      pr-workflow.md
      test-verification-workflow.md
    skills/                     # Reusable slash-command procedures
      deploy.md
      audit.md
  CLAUDE.md                     # Project instructions, delegation table
```

---

## Appendix: HELiX Agent Roster

The HELiX project maintains 21 custom agents across one category directory. This is the full roster as a reference for teams building their own agent teams:

| Agent | Role | Category |
|-------|------|----------|
| `accessibility-engineer` | WCAG 2.1 AA, ARIA patterns, keyboard nav | Quality |
| `chief-code-reviewer` | Tier 3 review: zero waste, surgical precision | Quality |
| `code-reviewer` | Tier 1 review: patterns, types, a11y, security | Quality |
| `css3-animation-purist` | CSS animations, transitions, motion | Specialist |
| `cto` | Technology strategy, vendor decisions | Leadership |
| `design-system-developer` | Design tokens, CSS custom properties, theming | Specialist |
| `design-systems-animator` | Animation systems for design systems | Specialist |
| `devops-engineer` | CI/CD, publishing, deployments | Infrastructure |
| `drupal-integration-specialist` | Twig templates, Drupal behaviors, CDN | Specialist |
| `frontend-specialist` | General frontend implementation | Specialist |
| `lit-specialist` | Lit 3.x components, Shadow DOM, ElementInternals | Specialist |
| `performance-engineer` | Bundle size, render perf, Core Web Vitals | Quality |
| `principal-engineer` | Architecture, API design, cross-cutting concerns | Leadership |
| `qa-engineer-automation` | Writing test files, test utilities | Quality |
| `senior-code-reviewer` | Tier 2 review: consistency, tokens, edge cases | Quality |
| `staff-software-engineer` | Monorepo tooling, Turborepo, DX | Specialist |
| `storybook-specialist` | Stories, controls, autodocs, CEM integration | Specialist |
| `technical-writer` | Documentation, guides, integration manuals | Specialist |
| `test-architect` | Test strategy, coverage analysis, infrastructure | Quality |
| `typescript-specialist` | Strict typing, generics, declaration files | Specialist |
| `vp-engineering` | Process, coordination, team health | Leadership |

Each agent has a persona (name, personality), a focused prompt (100-200 lines), and project-specific context (tag prefixes, token names, test utilities). The full definitions live in `.claude/agents/engineering/` and serve as templates for other projects adopting the same pattern.
