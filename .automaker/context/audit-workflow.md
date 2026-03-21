# Audit Workflow — HELiX Component Library

## Philosophy

Audits are **intelligence-gathering missions**, not implementation sprints. The output is a structured report and a small number of actionable GitHub Issues — NOT 98 branches, 98 PRs, and 98 board features.

## The 4-Phase Audit Cycle

### Phase 1: AUDIT (local only — zero git operations)

**Goal:** Run specialist agents across all components. Produce a structured findings report.

**How:**
1. Ava delegates to the appropriate specialist agent (e.g., `accessibility-engineer`, `chief-code-reviewer`)
2. The agent reads component source files directly from the working tree (no worktrees, no branches)
3. Agent produces a structured JSON report with findings per component
4. Report is saved to `.automaker/audits/<type>-audit-<date>.json`

**Report schema:**
```json
{
  "auditType": "accessibility",
  "date": "2026-03-19",
  "agent": "accessibility-engineer",
  "model": "opus",
  "summary": {
    "componentsAudited": 98,
    "totalFindings": 42,
    "critical": 5,
    "high": 12,
    "medium": 15,
    "low": 10
  },
  "findings": [
    {
      "component": "hx-popover",
      "severity": "critical",
      "wcagCriteria": "4.1.2",
      "title": "role=\"region\" is semantically incorrect",
      "description": "...",
      "file": "src/components/hx-popover/hx-popover.ts",
      "line": 357,
      "fix": "Change role=\"region\" to role=\"dialog\""
    }
  ]
}
```

**No branches. No commits. No PRs. Just data.**

### Phase 2: SYNTHESIZE (Ava triages findings into batches)

**Goal:** Group findings by pattern/category, not by component. Create 5-10 GitHub Issues.

**Grouping strategy:**
- Group by **fix pattern**, not by component (e.g., "all components missing aria-haspopup" = 1 issue)
- Target **5-10 issues max** per audit wave
- Each issue should be completable in a single agent session (1-4 hours)

**GitHub Issue format:**
```markdown
## [AUDIT] CRITICAL: Focus traps missing in 8 dialog-pattern components

**Audit:** a11y-audit-2026-03-19
**Severity:** critical
**WCAG:** SC 2.4.3, SC 2.1.2
**Components:** hx-popover, hx-dialog, hx-drawer, hx-dropdown, hx-combobox, hx-select, hx-date-picker, hx-color-picker

### Pattern
These components use dialog-like overlays but lack focus trapping. Tab/Shift+Tab escapes the overlay.

### Fix
Implement focus sentinel elements or focus cycling in each component's show/open handler.

### Per-Component Details
- **hx-popover** (line 186): Has `_moveFocusToBody()` but no cycling
- **hx-dialog** (line 95): Missing entirely
[...]
```

**Rules:**
- Label issues with `audit`, severity level, and audit type (e.g., `audit`, `critical`, `a11y`)
- Reference the audit report file in each issue
- Do NOT create issues for findings that are purely informational or low-effort (<5 min fix)
- Low-effort fixes get batched into a single "cleanup" issue

### Phase 3: FIX (epic branch, batched features)

**Goal:** One epic branch, 5-10 child features, one PR to dev.

**Structure:**
```
feature/audit-wave-1-a11y          ← epic branch (single PR to dev)
├── feature/audit-focus-traps      ← fixes 8 components (GitHub Issue #X)
├── feature/audit-aria-haspopup    ← fixes 15 components (GitHub Issue #Y)
├── feature/audit-keyboard-hover   ← fixes 6 components (GitHub Issue #Z)
├── feature/audit-focus-visible    ← fixes 30 components (GitHub Issue #W)
└── feature/audit-a11y-cleanup     ← low-effort fixes across all (GitHub Issue #V)
```

**Each child feature:**
- References its GitHub Issue number in the title and description
- Merges into the epic branch (NOT dev)
- Uses the appropriate specialist agent via delegation
- Runs `pnpm run verify` before committing

**The epic:**
- Accumulates all child merges
- Gets ONE PR to dev when all children are done
- PR description lists all GitHub Issues being closed

### Phase 4: CLOSE (GitHub Issues track completion)

**When the epic PR merges to dev:**
- All referenced GitHub Issues auto-close (use `Closes #X, Closes #Y` in PR body)
- Board features move to done automatically
- Audit report gets archived (rename to `*-completed.json`)

## Audit Types Available

| Type | Agent | Focus |
|---|---|---|
| `accessibility` | `accessibility-engineer` | WCAG 2.1 AA, ARIA, keyboard, focus |
| `code-quality` | `chief-code-reviewer` | TypeScript, patterns, dead code, API design |
| `performance` | `performance-engineer` | Bundle size, render perf, lazy loading |
| `tokens` | `design-system-developer` | Hardcoded values, token coverage, cascade |
| `storybook` | `storybook-specialist` | Story coverage, controls, autodocs |

## Anti-Patterns (DO NOT)

- ❌ One branch per component (98 branches = chaos)
- ❌ One PR per component (98 PRs = review fatigue)
- ❌ One GitHub Issue per finding (200+ issues = noise)
- ❌ Pushing audit branches remotely before synthesis
- ❌ Creating board features before the audit report exists
- ❌ Running audits through auto-mode (audits are read-only intelligence)
