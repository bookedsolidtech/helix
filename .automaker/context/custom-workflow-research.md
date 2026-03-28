# protoLabs Studio Custom Workflow Research

> **SUPERSEDED (2026-03-27):** Custom workflows implemented in `.automaker/workflows/*.yml` and `.automaker/prompts/*.md`. protoLabs Studio v0.92+ now supports YAML-defined workflow pipelines. This research document is retained for historical context only.

**Date:** 2026-03-26
**Context:** Audit features creating per-component branches/PRs caused CI multiplication (75+ jobs, cascading merge conflicts). Investigated whether protoLabs Studio supports custom workflows that could prevent this.

---

## Executive Summary

**protoLabs Studio does NOT have a custom workflow system today.** The execution pipeline is hardcoded:

```
Feature creation -> Branch/Worktree -> Agent execution -> Git commit/push -> PR creation -> CI -> Merge
```

There is no way to define alternative pipelines (e.g., "read-only audit" or "report-only") per-project or per-feature. However, **per-feature git overrides exist** that can partially mitigate the problem.

---

## What Exists Today

### Context File Injection (WORKS)

`.automaker/context/*.md` files ARE injected into every agent prompt. The `loadContextFiles()` function in `libs/utils/src/context-loader.ts` reads all `.md` and `.txt` files from `{projectPath}/.automaker/context/` and formats them into a "Project Context Files" section with instructions that the agent MUST follow.

**This means our `audit-workflow.md` IS seen by agents.** The problem is that branch creation happens BEFORE the agent starts, so the agent can't prevent it.

### Feature Types (LIMITED)

- `featureType?: 'code' | 'content'` -- Only code vs GTM content
- `complexity?: 'small' | 'medium' | 'large' | 'architectural'` -- Model selection, not execution mode
- `category: string` -- Free-form, display-only
- **No `'audit'`, `'analysis'`, `'read-only'` type exists**

### Per-Feature Git Overrides (PARTIAL WORKAROUND)

`Feature.gitWorkflow?: Partial<GitWorkflowSettings>` can override per feature:
- `autoCommit` -- Skip automatic commit after agent completes
- `autoPush` -- Skip pushing to remote
- `autoCreatePR` -- Skip PR creation
- `autoMergePR` -- Skip auto-merge

**MCP tool:** `update_feature_git_settings` can set these per feature.

**This means we CAN prevent PRs from being created for audit features**, but the agent still runs in a worktree with a branch.

### Worktree Toggle (PROJECT-WIDE)

- `GlobalSettings.useWorktrees` (default: `true`)
- `ProjectSettings.useWorktrees` -- per-project override
- **NOT per-feature** -- affects all features in the project

### Pipeline Phases (NOT SKIPPABLE FOR EXECUTE)

9-phase pipeline: TRIAGE, RESEARCH, SPEC, SPEC_REVIEW, DESIGN, PLAN, EXECUTE, VERIFY, PUBLISH. GTM branch can skip DESIGN and PLAN. **No way to skip EXECUTE or the branch/worktree creation.**

---

## Prompt Assembly Order (How Agents Receive Context)

For auto-mode feature agents, the prompt is assembled in this order:

1. Worktree build environment section (if in worktree)
2. Recovery context (if retry)
3. Planning prefix (lite/spec/full planning instructions)
4. **CONTEXT section** = `.automaker/context/*.md` + `.automaker/memory/*.md` files
5. **Role prompt prefix** (from agent manifest, e.g., `lit-specialist.md`)
6. **FEATURE_HEADER** = Feature ID, title, description
7. SPEC = Feature specification (if present)
8. IMAGES = Context image attachments
9. TRAJECTORY_CONTEXT = Lessons from similar past features
10. CODING_STANDARDS = Implementation instructions
11. VERIFICATION = Test verification instructions

**Key files:**
- `apps/server/src/services/auto-mode/execution-service.ts` -- Lines 301-499 (branch/worktree), 707-776 (prompt assembly)
- `libs/utils/src/context-loader.ts` -- Lines 289+ (context loading)
- `libs/prompts/src/defaults.ts` -- Line 917 (implementation instructions)

---

## What's Missing for "No-Branch Audit" Workflow

To properly support read-only audit workflows, protoMaker would need:

### 1. Feature Execution Mode (NEW)
Add `executionMode?: 'standard' | 'read-only'` to the Feature interface.

### 2. Execution Pipeline Bypass (NEW)
In `ExecutionService.executeFeature()`, when `executionMode === 'read-only'`:
- Skip worktree creation (run agent in main project directory)
- Set `readOnly: true` on provider ExecuteOptions
- Skip post-execution git workflow (no commit, push, PR)
- Write output to feature's data directory only

### 3. Feature Lifecycle Shortcut (NEW)
After read-only agent completion, move directly to `done` (no PR to review).

### 4. MCP Tool Updates (NEW)
Add `executionMode` parameter to `create_feature` and `start_agent`.

---

## Workaround for TODAY

Until protoMaker adds proper read-only support, use this approach:

### For Audit Features on the HELiX Board

1. **Create the feature** with `category: "audit"`
2. **Immediately call `update_feature_git_settings`** with:
   ```json
   {
     "autoCommit": false,
     "autoPush": false,
     "autoCreatePR": false
   }
   ```
3. **Agent runs in worktree** but outputs stay local -- no branch pushed, no PR created
4. **Agent should write findings to `.automaker/audits/`** (enforce via context file)
5. **Manually move feature to done** after reviewing local output

### Limitations of This Workaround
- Agent still creates a worktree and branch (wasted git operations)
- Agent has write access to filesystem (could modify source files)
- No enforcement at the platform level -- relies on context file instructions
- Feature still occupies a concurrency slot

### Better Workaround: Use Ava's Native Agent Tool
Instead of protoLabs auto-mode, Ava can:
1. Launch agents via Claude Code's native `Agent` tool (no protoLabs pipeline)
2. Agent reads source code directly, produces JSON report
3. Report saved to `.automaker/audits/`
4. No branches, no worktrees, no PRs, no CI

This is the approach defined in `.automaker/context/audit-workflow.md` Phase 1.

---

## Documentation Findings (docs.protolabs.studio)

### Agent Manifests (`.automaker/agents/*.yml`)
Custom AI agents with specific roles, model overrides, capabilities, and matching rules. Agents inherit from 8 built-in roles and can override capabilities including file modification, bash, commits, PR creation.
- **URL:** https://docs.protolabs.studio/guides/agent-manifests

### Skills (`.automaker/skills/*.md`)
Reusable prompt templates with YAML frontmatter that auto-load based on relevance scoring. Prompt enhancement, not structured data transformation.
- **URL:** https://docs.protolabs.studio/guides/authoring-skills

### Interactive Agents (NO branch/PR)
Stream results via WebSocket WITHOUT the feature lifecycle machinery. Chat-based, no branches or PRs. **This is the closest existing pattern to "read-only" execution.**
- **URL:** https://docs.protolabs.studio/concepts/agent-architecture

### Phase Handoff Documents
Structured data returned between pipeline phases: summary, discoveries, modified files, scope limits, test coverage, verdict. Accessible via `get_feature_handoff` MCP tool.
- **URL:** https://docs.protolabs.studio/concepts/feature-lifecycle

### Key Documentation URLs
- https://docs.protolabs.studio/reference/workflow-settings
- https://docs.protolabs.studio/guides/context-files
- https://docs.protolabs.studio/guides/agent-manifests
- https://docs.protolabs.studio/guides/authoring-skills
- https://docs.protolabs.studio/concepts/feature-lifecycle
- https://docs.protolabs.studio/concepts/agent-architecture
- https://docs.protolabs.studio/concepts/pipeline
- https://docs.protolabs.studio/integrations/mcp-tools-reference

---

## Feature Request for protoLabs Team (Josh)

**Title:** Add read-only execution mode for analysis/audit features

**Problem:** Audit workflows need agents that read code and produce reports WITHOUT creating branches, worktrees, or PRs. The current pipeline forces every feature through branch->worktree->commit->push->PR, which is wrong for intelligence-gathering tasks.

**Impact:** 5 audit features on HELiX caused 75+ CI jobs and cascading merge conflicts on shared files (coverage-config.json, hx-react/index.ts). Multiple hours of conflict resolution. Entire review column blocked.

**Proposed solution:**
1. Add `executionMode: 'read-only'` to Feature interface
2. Skip worktree/branch in execution pipeline when read-only
3. Run agent against main working tree
4. Write output to feature data dir only
5. Move to done automatically (no PR review needed)

**Alternatively:** Add per-feature `useWorktrees` override (currently project-wide only).

---

## Key Source Files in protoMaker

| File | What It Does |
|---|---|
| `apps/server/src/services/auto-mode/execution-service.ts` | Feature execution pipeline, branch/worktree creation, prompt assembly |
| `libs/utils/src/context-loader.ts` | Loads `.automaker/context/` and `.automaker/memory/` files into agent prompts |
| `libs/types/src/feature.ts` | Feature interface, `gitWorkflow` override, `featureType` |
| `libs/types/src/workflow-settings.ts` | Pipeline configuration parameters |
| `libs/types/src/project-settings.ts` | Project-level settings including `useWorktrees` |
| `libs/types/src/global-settings.ts` | Global settings including `useWorktrees` default |
| `libs/prompts/src/defaults.ts` | Default implementation instructions for agents |
| `packages/mcp-server/src/tools/feature-tools.ts` | `create_feature` MCP tool |
| `packages/mcp-server/src/tools/agent-tools.ts` | `start_agent` MCP tool |
