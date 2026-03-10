# HELIX-PLATFORM-PROTO-LESSONS.md

**Comprehensive Lessons Learned Report**
Project: Helix (wc-2026) | Platform: protoLabs Studio
Period: 2026-02-26 through 2026-03-08
Status: Post-mortem — prepared for system upgrade

---

## Purpose

This document collates every documented failure, platform bug, process issue, and hard-won lesson from the Helix project's autonomous development pipeline. It is intended as **mandatory reading for any new system, agent, or automation** that will operate on this codebase or similar Lit/web component monorepos.

The failures are organized by severity and category:
1. **Platform Bugs** — protoLabs Studio issues that caused systemic failures
2. **Code-Level Killer Patterns** — Lit/web component traps that cause silent test failures
3. **CI/CD & Infrastructure Issues** — Build pipeline and tooling failures
4. **Process & Workflow Failures** — Operational mistakes and their fixes
5. **Agent Behavior Anti-Patterns** — How autonomous agents fail and how to prevent it

---

## PART 1: PLATFORM BUGS (protoLabs Studio)

These are bugs in the protoLabs Studio automation platform itself. They caused systemic failures affecting dozens of features simultaneously.

### P-BUG-01: Dependency Thrash Loop (CRITICAL)

**Severity:** Critical — silently blocks ALL auto-mode progress indefinitely
**Status:** Unresolved (workaround in place)
**First observed:** 2026-03-04 | **Version:** protoLabs Studio v0.34.0

**Root cause:** Two services evaluate the same dependency with contradictory rules:
- `loadPendingFeatures` considers a dependency **satisfied** when the dep is in `review` status
- `LeadEngineerService [INTAKE]` considers the same dependency **unmet** when dep is in `review` status

**What happens:** Every 3 seconds, the auto-mode loop unblocks the feature (dep "satisfied"), starts it, then LeadEngineer immediately blocks it (dep "unmet"). This creates an infinite loop: `backlog -> blocked (14ms) -> backlog -> blocked (14ms) -> ...`

**Scale of impact:** Observed 428+ iterations in ~20 minutes on a single feature. During the entire thrash period, **zero other features started** despite 8 eligible features in the pool. The thrashing feature always sorted first.

**Real log evidence:**
```
[loadPendingFeatures] Unblocking feature — all dependencies now satisfied
[LeadEngineerService] [INTAKE] Feature has 1 unmet dependencies
[LeadEngineerService] [ESCALATE] Feature moved to blocked
[TrajectoryStoreService] Saved trajectory (attempt 428)
— 3 seconds later —
[loadPendingFeatures] Unblocking feature — all dependencies now satisfied  ← SAME FEATURE
```

**Workaround:** Assign the thrashing feature to a human (`assignee: "jake"`) — auto-mode skips human-assigned features. Must be manually unassigned after the blocking dependency reaches `done`.

**Lesson for new systems:** Any system with separate "eligibility check" and "execution precondition check" MUST use the same definition for both. If they disagree, you get an infinite retry loop.

---

### P-BUG-02: Plan Validation / Antagonistic Review Loop

**Severity:** High — blocks all `large` complexity features from starting
**Status:** Workaround deployed (use Opus model + set complexity to medium)

**Root cause:** The `requiresPlan()` gate triggers for ALL `large` complexity features. The PLAN phase calls `simpleQuery(sonnet)` which generates concise plans. For audit-type tasks, Sonnet produces ~75-90 character plans. The validation gate requires >= 100 characters. The antagonistic reviewer then rejects it. On the 3rd attempt, the model returns <100 chars, triggering "Plan too short" escalation.

**The catch block** that would use the 500+ character feature description as fallback never fires because `simpleQuery` doesn't throw — it returns short text that fails validation.

**Workaround stack:**
1. Set `defaultFeatureModel: claude-opus` — Opus plans are detailed enough to pass review
2. If Opus still fails: Set feature `complexity: "medium"` — skips `requiresPlan()` entirely
3. For audit tasks specifically: Always use `medium` complexity

**Lesson for new systems:** Validation gates must account for the variance in output length across different task types. A 100-char minimum that works for implementation tasks fails for audit/review tasks. Either make the threshold task-type-aware or remove it.

---

### P-BUG-03: "PR Already Exists" Blocking

**Severity:** Medium — blocks individual features unnecessarily
**Status:** Workaround documented

**What happens:** Recovery agent tries to create a PR when one already exists for the branch. Feature gets blocked with reason "git workflow failed".

**Fix:** Move feature to `review` status manually. The PR exists and work is complete — the feature just needs to know about it.

**Lesson for new systems:** Before creating a PR, always check if one already exists for the branch. `gh pr list --head <branch>` is a 1-second check that prevents this entirely.

---

### P-BUG-04: `.automaker-lock` Committed to Tracking (FIXED)

**Severity:** High — caused ALL open PRs to show CONFLICTING on GitHub
**Status:** Fixed 2026-03-06

**Root cause:** The `.automaker-lock` runtime file was committed to dev and propagated to all 52 feature branches. Every branch had a different lock state, so every PR showed merge conflicts.

**Fix applied:**
1. Added `.automaker-lock` to `.gitignore` on dev
2. Ran `git rm --cached .automaker-lock` on dev
3. Looped all 52 feature worktrees and removed from tracking + pushed

**Lesson for new systems:** Runtime lock files, PID files, and any process-specific state files MUST be in `.gitignore` before any agent touches the repo. Audit `.gitignore` as part of project onboarding.

---

### P-BUG-05: `update_settings` MCP Doesn't Persist to Disk (CRITICAL)

**Severity:** Critical — settings silently revert on every server restart
**Status:** Unresolved (workaround in place)

**What happens:** The `update_settings` MCP tool only updates in-memory state. When the protoLabs server restarts, all settings revert to whatever is on disk in `/Volumes/Development/protoMaker/data/settings.json`.

**Impact observed:** Settings reverted from `opus` to `sonnet`, from `lite` to `spec`, from concurrency 2 to 3 — multiple times across multiple server restarts. Each time, agents started failing because they were using the wrong model or hitting the plan validation bug again.

**Workaround:** ALWAYS edit the JSON file directly AND call `update_settings` MCP to apply both. Never trust one without the other.

**Lesson for new systems:** Any settings API must persist to durable storage. In-memory-only settings are a trap in any system that restarts.

---

### P-BUG-06: Retry Counter Not Resetting on Manual Backlog Reset

**Severity:** High — features become permanently stuck
**Status:** Unresolved (no API fix available)

**What happens:** Moving a feature from `blocked` to `backlog` via `update_feature` does NOT reset the internal retry counter. On next auto-mode pickup, the feature immediately hits "Max agent retries exceeded (3)" within 1 second.

**Evidence:** hx-file-upload went `in_progress -> blocked` in 1 second after manual reset, twice. The `update_feature` API has no `failureCount` parameter to clear it.

**Workaround:** Assign to a human to prevent auto-mode pickup. There is no way to reset the counter via the API.

**Lesson for new systems:** Any retry mechanism MUST have an explicit reset path. If an operator manually moves something back to a starting state, all retry counters must clear. Otherwise, the operator's manual intervention is silently undone.

---

### P-BUG-07: Escalation Router Signal Spam

**Severity:** Low — log pollution, wasted CPU
**Status:** Unresolved

**What happens:** The `human_blocked_dependency` signal fires every ~30 seconds for the same feature/blocker pair indefinitely. 50+ log entries in 25 minutes, all marked `deduplicated: true`. Only 1 was actually routed.

**Root cause:** Signal generation is not throttled at the source — only routing is deduplicated. The signals are still generated, logged, and processed before being discarded.

**Lesson for new systems:** Deduplication at the routing layer is insufficient. Throttle signal generation at the source. If you've already generated and discarded 50 signals for the same pair, stop generating them.

---

### P-BUG-08: Max State Transitions Exceeded (Review Polling Loop)

**Severity:** High — mass-blocked 21 features simultaneously
**Status:** Unresolved (workaround in place)

**What happens:** The platform's review polling loop exhausts the state transition limit even with ZERO external events (no CodeRabbit comments, no CI changes). The polling itself counts as state transitions. Feature goes blocked with reason "Max state transitions exceeded".

**Mass incident (2026-03-06):** 21 audit features blocked simultaneously. CodeRabbit config correctly ignored all audit PRs (`ignore_title_keywords` working). Zero reviews were posted. Pure internal polling loop caused the blockage.

**Fix:** Move feature back to `review` status. PR is still open and CI will eventually pass.

**Lesson for new systems:** Polling-based status checks must NOT count as state transitions. Internal bookkeeping operations should be invisible to state machine limits. The limit should only count transitions caused by actual external events or user/agent actions.

---

### P-BUG-09: HUSKY=0 / --no-verify Bypasses All Project Quality Gates

**Severity:** Medium — agents push code that fails CI
**Status:** Mitigated (context files enforce `npm run verify`)

**What happens:** The git-workflow-service sets `HUSKY: '0'` and uses `git commit --no-verify` on all auto-commits. All project Husky hooks (pre-commit, pre-push) are completely bypassed. Only the server's own Prettier formatting runs.

**Impact:** Agents push code with lint errors, type errors, and format violations. Every such push creates a PR that fails CI, wasting review cycles and blocking the pipeline.

**Mitigation:** Added `npm run verify` as a mandatory step in all context files. Agents are instructed to self-verify before pushing. This is a context-based enforcement, not a system-level gate.

**Lesson for new systems:** If you bypass project hooks for operational reasons, you MUST provide an alternative quality gate. Either run the project's checks yourself before committing, or provide a configurable `preCommitScript` hook.

---

## PART 2: CODE-LEVEL KILLER PATTERNS (Lit / Web Components)

These patterns caused test failures, timeouts, and accessibility violations across dozens of components. Each one was discovered through CI failure, diagnosed, and documented. **Any agent modifying Lit web components MUST know these.**

### C-PATTERN-01: `@query` Decorator with `= null` Initializer (CRITICAL — Test Timeout)

**Impact:** Every test hangs at 30-second timeout. `updateComplete` never resolves.
**Occurrences:** Found in hx-search, hx-radio-group, hx-switch — likely present in more components.

**The trap:** Adding `= null` to a `@query`-decorated field creates an **own property** on the class instance that permanently shadows the decorator's prototype getter. The `@query` getter never runs, so the queried element is always `null`.

```typescript
// WRONG — = null shadows the @query getter; element is ALWAYS null
@query('.switch__track')
private _trackEl: HTMLButtonElement | null = null;

// CORRECT — non-null assertion; @query getter works properly
@query('.switch__track')
private _trackEl!: HTMLButtonElement;
```

**Why this happens:** With `experimentalDecorators: true` and `useDefineForClassFields: false` (our tsconfig), field initializers create own properties via `Object.defineProperty` that shadow the decorator's getter on the prototype.

**Rule:** NEVER add `= null` or any initializer to `@query`, `@queryAll`, or `@queryAsync` decorated fields. Always use `!` (non-null assertion).

**Counter-intuitive warning:** When you see existing `@query` fields using `!`, do NOT "fix" them to `| null = null` even if an audit suggests removing non-null assertions. The `!` on `@query` fields is correct and required.

---

### C-PATTERN-02: `setAttribute()` in Constructor (CRITICAL — Test Timeout)

**Impact:** Every test hangs indefinitely. HTML parser deadlocks when element is created via `innerHTML`.
**Occurrences:** Found in hx-radio (moved setAttribute to constructor during audit fix).

**The trap:** Calling `this.setAttribute()`, `this.role = ...`, or any DOM mutation in a custom element's `constructor()` violates the [custom element spec](https://html.spec.whatwg.org/#custom-element-conformance). When the element is created via `innerHTML` (which our `fixture()` test helper uses), the HTML parser hangs.

```typescript
// WRONG — setAttribute in constructor violates custom element spec
constructor() {
  super();
  this.setAttribute('role', 'radio');
}

// CORRECT — DOM mutations go in connectedCallback
override connectedCallback(): void {
  this.setAttribute('role', 'radio');
  super.connectedCallback();
}
```

**Rule:** Constructor must ONLY call `super()` and `this.attachInternals()`. All other initialization goes in `connectedCallback()` or `firstUpdated()`.

---

### C-PATTERN-03: Axe Violation — `aria-allowed-attr` on Fieldsets

**Impact:** Accessibility test failures.

**Common mistake:** Adding `aria-required` to a `<fieldset>` element. Fieldset has `role="group"` which does NOT support `aria-required`.

```html
<!-- WRONG -->
<fieldset aria-required="true">

<!-- CORRECT — visual indicator + error message, no aria-required on fieldset -->
<fieldset>
  <legend>Group label <span aria-hidden="true">*</span></legend>
```

**Other role/attribute mismatches:**
- `role="group"` does NOT support: `aria-required`, `aria-checked`, `aria-selected`
- `role="presentation"` does NOT support any aria-* attributes
- `role="radiogroup"` DOES support `aria-required` (use this instead of bare fieldset)

---

### C-PATTERN-04: Axe Violation — `aria-input-field-name` with `<label for>`

**Impact:** Accessibility test failures on comboboxes, search inputs, and custom ARIA widgets.

**The trap:** Using `<label for="X">` where X is a `<div role="combobox">`. The HTML `for` attribute only works with native form elements — NOT with elements that have ARIA roles.

```typescript
// WRONG — for= doesn't work on div[role=combobox]
html`<label for=${this._triggerId}>Label</label>
     <div id=${this._triggerId} role="combobox">...`

// CORRECT — use aria-labelledby pointing to the label's id
html`<label id=${this._labelId}>Label</label>
     <div role="combobox" aria-labelledby=${this._labelId}>...`
```

---

### C-PATTERN-05: Axe Violation — `list` with Slotted Web Components

**Impact:** Accessibility test failures when custom elements are children of `<ul>` or `<ol>`.

**The trap:** When `hx-*` custom elements are slotted into an `<ol>` or `<ul>`, axe sees them as non-`<li>` direct children — even though the custom element's shadow DOM renders `<li>` internally.

```typescript
// WRONG — <ol><slot></slot></ol> with hx-list-item children fails axe
render() {
  return html`<ol><slot></slot></ol>`;
}

// CORRECT — use div[role="list"] instead
render() {
  return html`<div role="list"><slot></slot></div>`;
}
```

---

### C-PATTERN-06: Async Timing — Event Listeners After Await

**Impact:** Flaky tests that intermittently fail. Events fire before listeners are registered.

**The pattern that kills tests:** Registering event listeners or dispatching events AFTER `await` calls in async `_show()` methods. Tests do `await el.updateComplete` then immediately check — they don't get a second microtask.

```typescript
// WRONG — listener registered after two awaits
async _show() {
  this._visible = true;
  await this.updateComplete;
  await this._updatePosition();                              // test resumes HERE
  document.addEventListener('keydown', this._handleKeydown); // TOO LATE
}

// CORRECT — register synchronously before any await
async _show() {
  this._visible = true;
  document.addEventListener('keydown', this._handleKeydown); // BEFORE any await
  await this.updateComplete;
  this.dispatchEvent(new CustomEvent('hx-after-show', ...));
  await this._updatePosition(); // non-assertion work goes last
}
```

**Rule:** If a test does `await el.updateComplete` then immediately checks something, that thing must be set up either synchronously or in the first microtask after `await this.updateComplete`.

---

### C-PATTERN-07: Shadow DOM Focus — `document.activeElement` vs `shadowRoot.activeElement`

**Impact:** Focus-related tests pass/fail inconsistently.

**The trap:** When a shadow DOM element receives focus, `document.activeElement` returns the shadow host (the custom element itself), NOT the internal focused element.

```typescript
// WRONG
document.activeElement; // returns <hx-dialog>, not <button id="close">

// CORRECT
el.shadowRoot?.activeElement; // returns the actually focused element
```

**Consequence for focus traps:** Including shadow DOM elements in a light DOM focus trap list causes Tab to focus the shadow host, not the internal button. Exclude shadow DOM elements from the trap list.

---

### C-PATTERN-08: Label + Input Double-Click (Event Fires Twice)

**Impact:** `hx-change` events fire twice on label click.

**The trap:** Wrapping `<input>` inside `<label @click=${handler}>`. When the label is clicked:
1. Label click fires -> handler runs -> dispatches event
2. Browser fires a **synthetic click** on `<input>` -> bubbles to label -> handler runs again

```typescript
// WRONG — missing stopPropagation
@click=${(e: Event) => e.preventDefault()}

// CORRECT — prevent AND stop
@click=${(e: Event) => {
  e.preventDefault();
  e.stopPropagation();
}}
```

---

### C-PATTERN-09: Lit `@property({ type: Array })` Returns null on Bad JSON

**Impact:** Runtime crash — `null.map()` or `null.forEach()`.

**The trap:** When a `@property({ type: Array })` attribute receives invalid JSON (e.g. from Drupal CMS), Lit's default converter tries `JSON.parse()` internally and returns `null` on failure — NOT an empty array.

```typescript
// WRONG — null.map() crashes
@property({ type: Array })
columns: Column[] = [];

// CORRECT — guard in willUpdate
override willUpdate(changed: Map<string, unknown>) {
  if (changed.has('columns')) {
    if (typeof (this.columns as unknown) === 'string') {
      try { this.columns = JSON.parse(this.columns as unknown as string); }
      catch { this.columns = []; }
    } else if (!Array.isArray(this.columns)) {
      this.columns = [];
    }
  }
}
```

---

## PART 3: CI/CD & INFRASTRUCTURE ISSUES

### CI-01: Path-Based Test Filtering Broken on Push Events

**Impact:** 14-minute CI startup regression — all tests ran on every push instead of only changed components.
**Status:** Fixed (commit `a0096ed6`)

**Root cause:** `git diff` returns full paths like `packages/hx-library/src/components/hx-card/...`. The sed pattern `s|src/components/\(hx-[^/]*\)/.*|\1|` doesn't strip the `packages/hx-library/` prefix. Vitest gets `src/components/packages/hx-library/hx-card/` which doesn't exist.

**Fix:** Changed to `s|.*src/components/\(hx-[^/]*\)/.*|\1|` — the `.*` prefix handles any leading path components.

**Lesson:** When writing path transformation patterns in CI, always test with the actual output of `git diff` in the CI environment, not local assumptions.

---

### CI-02: VRT Baselines Missing After Screenshot Git-RM

**Impact:** VRT fails on every dev push
**Status:** Not blocking audit-fix PRs (VRT skipped for those branches)

**Root cause:** After removing `__screenshots__/` from git tracking (to fix the conflict pattern), CI has no VRT baselines to compare against.

**Lesson:** When removing generated/binary files from git tracking, ensure CI has an alternative source for baseline data (artifact storage, separate baseline branch, etc.).

---

### CI-03: Screenshot PNG Conflict Pattern (FIXED)

**Impact:** ALL open PRs showed CONFLICTING on GitHub
**Status:** Fixed 2026-03-07

**Root cause:** `__screenshots__/` was in `.gitignore` but 148 PNGs were still tracked in git (never ran `git rm --cached`). Every branch had slightly different screenshot binaries, causing merge conflicts on every PR.

**Fix:**
1. `git rm --cached` on all 148 screenshot files
2. Pushed to dev
3. `.gitignore` rule now takes effect

**Lesson:** Adding a pattern to `.gitignore` does NOT stop tracking files that are already tracked. You must explicitly `git rm --cached` them. Audit for this pattern during project onboarding.

---

### CI-04: Vitest Browser Mode Zombie Processes

**Impact:** Agent processes accumulate, system memory exhausted, agents stuck in infinite loops
**Status:** Mitigated (agents instructed to not run tests locally)

**Root cause:** Vitest browser mode spawns Playwright/Chromium processes per test file. When a browser context hangs, the process never exits. Each `npm run test` invocation adds more orphan processes.

**Detection:**
```bash
ps aux | grep -E "node (vitest)|chrome-headless-shell" | grep -v grep
```
Processes >30 min old with no associated output = zombies.

**Response protocol:**
1. Send message to stuck agent: "Stop running tests. Run `npm run verify` only."
2. Kill zombies: `pkill -f "node (vitest)"; pkill -f "chrome-headless-shell"`
3. Do NOT kill processes <10 min old (could be active test run)

**Rule for agents:** Do NOT run `npx vitest run` or `npm run test` directly in worktrees. Use `npm run verify` (lint + format + type-check) only. Trust CI to run browser tests.

---

### CI-05: DHCP Lease Change Breaking Dev Server Access

**Impact:** Board UI inaccessible — returns connection error HTML
**Status:** Fixed (one-time)

**Root cause:** `VITE_HOSTNAME` in protoMaker `.env` was set to the old IP. After the machine was off for a day, DHCP assigned a new local IP. The dev server bound to the old IP which no longer existed on the interface.

**Fix:** Updated `VITE_HOSTNAME` in `.env` to the new IP.

**Lesson:** Any system that binds to a specific local IP must handle DHCP lease changes. Use `0.0.0.0` to bind all interfaces, or detect and update the IP on startup.

---

## PART 4: PROCESS & WORKFLOW FAILURES

### PROC-01: Prettier Must Run Inside Worktree Directory

**Impact:** Code pushed with formatting violations — CI fails, PR blocked
**Severity:** High — caused repeated CI failures until diagnosed

**The bug:** Running `npm run format` from the project root with absolute paths gives FALSE POSITIVES — Prettier reports the file passes when it actually doesn't match the worktree's config.

**Fix:** ALWAYS run `npm run format` from WITHIN the worktree directory:
```bash
cd .worktrees/feature-xxx && npm run format && git add . && HUSKY=0 git commit && git push
```

Or use `git -C` pattern for all operations:
```bash
git -C .worktrees/feature-xxx ...
```

**Lesson:** Build tools that resolve config relative to CWD will produce wrong results when invoked from a different directory, even with absolute file paths.

---

### PROC-02: Mass Feature Blockage from Agents Running Before Quality Gates

**Impact:** 19 PRs failing CI, 25 features requiring manual reset
**Occurred:** 2026-03-05

**What happened:** Agents ran and created PRs before `quick-rules.md` enforced `npm run verify`. Combined with HUSKY=0 bypassing all hooks, broken code was pushed to every branch.

**Recovery:** Closed 19 failing PRs, reset 25 features to backlog, then deployed the quality gate context files.

**Lesson:** Quality gates must be deployed BEFORE any agent work begins. Never start auto-mode without verifying that context files enforcing quality are present on the branch agents will work from.

---

### PROC-03: Audit Data Extraction — 92.6% Data Loss from Wrong Source

**Impact:** Initial audit defect extraction captured only 7.4% of actual defects

**What happened:** First extraction parsed `agent-output.md` `<summary>` blocks, which contain abbreviated summaries. The real defect data lives in `AUDIT.md` files written into component directories.

**Additional challenge:** AUDIT.md formats vary wildly across agents — 5+ heading patterns, 3+ table formats. The final parser had to handle: `### P0 -`, `#### P1 -`, `### [P0]`, `### Title [P0]`, `### ID - P0 | Area:`, emoji severity, bold text `**P1 -**`, parens `(P0)`, table rows `| P2-01 |`.

**Lesson:** When agents produce structured output, mandate a consistent format. If you can't enforce format, your extraction tooling must be extremely tolerant of variation. Always validate extraction results against a known baseline.

---

### PROC-04: Never Edit Upstream Platform Source

**Rule:** NEVER edit protoMaker source (`/Volumes/Development/protoMaker`). It is upstream infrastructure.

**What to do instead:**
- Report bugs with reproduction steps
- Configure around limitations using `.automaker/context/` files
- Use workarounds documented in this file
- Wait for upstream fixes

---

### PROC-05: Barrel File Is Auto-Generated

**Rule:** NEVER manually edit `packages/hx-library/src/index.ts`. It is auto-generated by `npm run generate:barrel` (runs as prebuild).

**What to do instead:** Each component only needs its own files in `src/components/hx-foo/`. The barrel file regenerates automatically.

---

## PART 5: AGENT BEHAVIOR ANTI-PATTERNS

### AGENT-01: Running Tests Locally Instead of Trusting CI

**Impact:** Zombie processes, stuck agents, wasted compute

Agents should NEVER run `npx vitest run` or `npm run test` in worktrees. The correct pattern:
```bash
npm run verify        # lint + format:check + type-check (always safe)
npm run build:library # build confirmation (safe)
# Push and let CI run browser tests
```

---

### AGENT-02: "Fixing" `@query` Non-Null Assertions

**Impact:** Silent test timeout — every test hangs at 30s

When an audit suggests "remove non-null assertions," agents must NOT apply this to `@query`-decorated fields. The `!` on `@query` fields is correct and required (see C-PATTERN-01).

---

### AGENT-03: Orphaned Work — Agent Completes But Never Commits

**Impact:** Completed work lost, feature stuck in `in_progress`

Observed with hx-container: agent completed all changes (styles + tests) but never committed. Work sat in the worktree's working directory, invisible to the platform.

**Detection:** Check for uncommitted work: `git -C <worktree> status --short`
**Recovery:** Manually commit, format, verify, push, and create PR.

---

### AGENT-04: Agent Stuck in Review Polling Loop

**Impact:** Agent consumes a concurrency slot indefinitely

Agents that complete work and enter review can get stuck if the review polling exhausts state transitions (see P-BUG-08). The agent holds a concurrency slot while doing nothing.

**Detection:** Running agent with no new output for >30 min + feature in review/blocked.
**Fix:** Stop the agent, move feature to review manually, let CI finish.

---

## PART 6: OPERATIONAL RULES (HARD CONSTRAINTS)

These rules were learned through failure and must NEVER be violated:

| # | Rule | Why |
|---|------|-----|
| 1 | Run `npm run verify` before every `git push` | HUSKY=0 bypasses all hooks — this is the only quality gate |
| 2 | Never `cd` into worktree directories | Use `git -C <path>` always — prevents CWD confusion |
| 3 | Never run vitest directly in worktrees | Creates zombie Playwright processes that never exit |
| 4 | Never restart the dev server (agents) | Only the operator restarts infrastructure |
| 5 | Constructor: only `super()` + `attachInternals()` | Everything else goes in `connectedCallback()` or `firstUpdated()` |
| 6 | `@query` fields use `!`, never `= null` | Initializer shadows the decorator getter permanently |
| 7 | Edit settings JSON on disk AND via MCP | MCP-only changes are lost on server restart |
| 8 | Deploy context files BEFORE starting auto-mode | Agents on old branches won't have new rules |
| 9 | `git rm --cached` after adding to `.gitignore` | `.gitignore` doesn't untrack already-tracked files |
| 10 | Token-only styling — no hardcoded values | Enterprise healthcare mandate — WCAG 2.1 AA minimum |

---

## PART 7: STATISTICS & TIMELINE

### Board Scale
- **Total features processed:** 84+ (deep audit) + 71 (audit fix) = 155+ features
- **Total defects identified:** 1,395 across 74 components (109 P0, 484 P1, 749 P2, 42 P3)
- **Average defects per component:** 19.6

### Key Incidents
| Date | Incident | Impact | Recovery Time |
|------|----------|--------|---------------|
| 2026-03-04 | Dependency thrash loop | All auto-mode blocked | 2 hours (workaround) |
| 2026-03-05 | 19 PRs failing CI (no verify) | 25 features reset | 4 hours |
| 2026-03-06 | 21 features blocked (polling loop) | Mass manual reset | 1 hour |
| 2026-03-06 | Settings revert on restart | Wrong model, wrong mode | 30 min (per occurrence) |
| 2026-03-06 | Screenshot conflicts all PRs | 52 branches conflicting | 3 hours |
| 2026-03-07 | Zombie vitest processes | System memory pressure | Ongoing monitoring |
| 2026-03-08 | @query = null pattern | 3 components timing out | 2 hours |
| 2026-03-08 | CI path filtering broken | 14-min test startup | 30 min |

### Platform Bug Status Summary
| Bug | Status | Workaround? |
|-----|--------|-------------|
| P-BUG-01: Dependency thrash | Unresolved | Assign to human |
| P-BUG-02: Plan validation | Workaround | Use Opus + medium complexity |
| P-BUG-03: PR already exists | Workaround | Manual move to review |
| P-BUG-04: Lock file conflict | **FIXED** | N/A |
| P-BUG-05: Settings not persisting | Unresolved | Dual write (file + MCP) |
| P-BUG-06: Retry counter stuck | Unresolved | Assign to human |
| P-BUG-07: Signal spam | Unresolved | Log noise only |
| P-BUG-08: Polling state transitions | Unresolved | Manual move to review |
| P-BUG-09: HUSKY bypass | Mitigated | Context-based verify |

---

## APPENDIX A: File Locations

| File | Purpose |
|------|---------|
| `.automaker/context/audit-fix-known-failure-patterns.md` | 11 CI failure patterns for agents |
| `.automaker/context/quick-rules.md` | Hard constraints for all agents |
| `.automaker/context/manual-steps-required.md` | Protocol for manual config steps |
| `.automaker/context/failure-lessons-unknown.md` | Auto-generated recovery stats |
| `CLAUDE.md` | Project-level agent instructions |
| `~/.claude/projects/.../memory/MEMORY.md` | Ava's persistent operational memory |

---

*Generated 2026-03-08 by Ava (Autonomous Virtual Agency) from operational logs, context files, notes tabs, and session memory. For the system upgrade on 2026-03-09.*
