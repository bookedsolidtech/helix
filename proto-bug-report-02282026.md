# ProtoMaker Bug Report — 2026-02-28

Bugs discovered during sustained auto-mode operation on the `helix` project.
All bugs are in the protoMaker server (`apps/server/`), not project-specific.

---

## Bug 1 — Double ConcurrencyManager Acquire (Root Cause of Infinite Failure Loop)

**Severity:** Critical
**File:** `apps/server/src/services/auto-mode-service.ts` + `auto-mode/execution-service.ts`

### What happens

Every time a feature has an existing `agent-output.md` file, the resume path triggers a
**double ConcurrencyManager acquire** that fails instantly, generating a HITL form, and
then auto-mode picks the feature back up and the loop repeats at ~1 failure per second.

### Exact call chain

```
1. AutoModeService.executeFeature()           [auto-mode-service.ts:1598]
   └─ concurrencyManager.acquire(featureId)   → lease count = 1, returns true ✅

2. ─> ExecutionService.executeFeature()       [execution-service.ts:284]
   └─ runningFeatures.add(featureId)          [line 318]
   └─ contextExists() → true                  [line 399]  ← agent-output.md found
   └─ runningFeatures.delete(featureId)       [line 405]  ← but NOT released from ConcurrencyManager
   └─ callbacks.resumeFeature()               [line 406]  ← handed off

3. ─> AutoModeService.resumeFeature()         [auto-mode-service.ts:1849]
   └─ hasContext = true                       [line 1901]
   └─ executeFeatureWithContext()             [line 1904]

4. ─> AutoModeService.executeFeatureWithContext()  [auto-mode-service.ts:4383]
   └─ this.executeFeature(featureId, ..., { continuationPrompt })  [line 4405]

5. ─> AutoModeService.executeFeature()        [auto-mode-service.ts:1598]  ← OUTER LEASE STILL HELD
   └─ concurrencyManager.acquire(featureId)   → lease count already 1, returns false ❌
   └─ concurrencyManager.release(featureId)   [line 1603]  ← undo increment
   └─ throw "Feature is already running (runtime: 0s)"

6. Error propagates → ESCALATE → new HITL form persisted to disk
7. Feature status → blocked → auto-mode picks it up again → GOTO 1
```

### Root cause

`ExecutionService.executeFeature()` at line 405 removes the feature from its own
`runningFeatures` map before handing off to `resumeFeature()`, but it does NOT release
the `ConcurrencyManager` lease (held by the outer `AutoModeService.executeFeature()`
frame still on the call stack). When `resumeFeature` → `executeFeatureWithContext` →
`executeFeature` is called, it tries to acquire the lease again and fails.

### Fix options

**Option A (recommended):** In `executeFeatureWithContext()` (line 4383), bypass
`this.executeFeature()` and call `this.executionService.executeFeature()` directly with
a `continuationPrompt` option, skipping the ConcurrencyManager acquire since the caller
already holds the lease.

**Option B:** Pass the existing lease token through the callback chain so that
`resumeFeature` can reuse it rather than re-acquiring.

**Option C:** In `ExecutionService.executeFeature()` before calling
`callbacks.resumeFeature()` (line 406), emit a signal that triggers the outer
`AutoModeService.executeFeature()` to release its ConcurrencyManager lease before the
resume path is entered.

### Trigger condition

Any feature that has previously run (i.e., has `agent-output.md` in
`.automaker/features/{featureId}/`) will hit this loop on every subsequent auto-mode
pick-up. This means the problem gets _worse_ the more features have run.

---

## Bug 2 — HITL Form Accumulation OOM

**Severity:** Critical
**Files:** `apps/server/src/services/hitl-form-service.ts`, `apps/server/src/server/websockets.ts`

### What happens

Bug 1 generates one persisted HITL form per failure iteration. The failure loop runs at
~1/second. On WebSocket reconnect (page refresh, client reconnect), the server re-emits
ALL pending forms simultaneously. With enough forms, this spikes the V8 heap past the
OOM threshold and crashes the server.

### Observed quantities

- `wc-mcp` project: **6,234 HITL forms** accumulated before discovery
- After server restart with forms cleared, re-accumulated to **113 forms in minutes**
- Server log: `[HITL] Re-emitted 944 pending HITL form(s) to reconnecting client`
- Server log: `Heap at 91% after cooldown, stopping auto-mode`

### Exact code path

```typescript
// websockets.ts:144 — on every client connect:
services.hitlFormService.reEmitPending();

// hitl-form-service.ts:298 — re-emits ALL pending forms in a tight for-loop:
reEmitPending(): void {
  const pending = this.listPending();
  for (const summary of pending) {  // ← no batching, no rate limiting
    const form = this.forms.get(summary.id);
    this.emitFormRequested(form);   // ← synchronous WebSocket emit per form
  }
}
```

### Fix options

**Option A (required):** Add a hard cap on persisted HITL forms per project (e.g., max
50). When the cap is reached, new forms should be dropped (or the oldest expired first)
rather than appended.

**Option B (required):** Batch/throttle `reEmitPending()` — emit at most N forms per
reconnect, or stagger them with `setImmediate`/small delays instead of a synchronous
for-loop.

**Option C (additional hardening):** Add a duplicate-detection guard — if the same
`featureId` already has a pending HITL form, do not create another one. The current code
creates a new form for every failure even if the previous form is still pending.

---

## Bug 3 — Planning Phase CLAUDE.md Override

**Severity:** High (causes wasted tokens + repeated planning failures)
**File:** `apps/server/src/services/lead-engineer-processors.ts`

### What happens

Features with `complexity=large` or `complexity=architectural` trigger the PLAN phase.
The `PlanProcessor` calls `simpleQuery()` with `cwd: ctx.projectPath`. If the project has
a `CLAUDE.md` file containing strong agent-overriding instructions (e.g., a
"DELEGATION-FIRST MANDATE" that tells Claude to return a delegation response instead of
producing output), Claude ignores the planning system prompt and returns a short
non-plan response. The length validator then rejects it as "Plan too short (<100 chars)",
retries, fails again, and eventually escalates.

### Exact code location

```typescript
// lead-engineer-processors.ts:179 — PlanProcessor.process()
const result = await simpleQuery({
  prompt: `Create a concise implementation plan...`,
  model: resolveModelString(planModel),
  cwd: ctx.projectPath,   // ← THIS LINE — inherits project CLAUDE.md
  systemPrompt: 'You are a senior software engineer creating implementation plans...',
  maxTurns: 1,
  allowedTools: [],
});

// Also at line 340 — antagonisticReview():
const result = await simpleQuery({
  ...
  cwd: ctx.projectPath,   // ← same issue
  ...
});
```

### Trigger condition

- Feature has `complexity: "large"` or `complexity: "architectural"`
- Project has a `CLAUDE.md` with instructions that conflict with planning (e.g., "You are
  a coordinator, not an implementor. Before writing any code, route work to the right
  agent.")

### Fix

Change `cwd` in both `simpleQuery` calls in `PlanProcessor` to a neutral directory that
does not contain any project-specific `CLAUDE.md`. Options:

- Use the protoMaker server's own directory (`__dirname` or similar)
- Use `os.tmpdir()`
- Pass a flag to `simpleQuery` to skip CLAUDE.md inheritance for planning queries

---

## Summary Table

| Bug                               | File                                            | Line          | Severity | Status                    |
| --------------------------------- | ----------------------------------------------- | ------------- | -------- | ------------------------- |
| Double ConcurrencyManager acquire | `auto-mode-service.ts` + `execution-service.ts` | 1598, 405-406 | Critical | **Not fixed in codebase** |
| HITL form OOM on reconnect        | `hitl-form-service.ts`, `websockets.ts`         | 298, 144      | Critical | **Not fixed in codebase** |
| Planning CLAUDE.md override       | `lead-engineer-processors.ts`                   | 194, 340      | High     | **Not fixed in codebase** |

### Workarounds applied (project-level, not permanent)

1. Set affected features to `complexity: "medium"` to skip planning phase
2. Delete `agent-output.md` before each agent run to prevent the resume path
3. Clear `{projectPath}/.automaker/hitl-forms.json` to `[]` before server restart
4. Stop auto-mode on projects with looping features until underlying bugs are fixed

---

## Reproduction Steps (Bug 1 + Bug 2 together)

1. Start any feature in auto-mode on a project that has a non-trivial `CLAUDE.md`
2. Let the agent run to completion (writes `agent-output.md`)
3. Feature gets marked `done` or re-enters backlog for any reason
4. Auto-mode picks it up again — instant "is already running (runtime: 0s)" failure
5. Feature → blocked → HITL form created → auto-mode retries → repeat
6. Refresh the UI — server re-emits all accumulated HITL forms → heap spike → crash

## Environment

- Observed: protoMaker server, macOS, multiple projects (`helix`, `wc-mcp`)
- Reproducible: Yes, deterministically — any feature with `agent-output.md` + auto-mode enabled
- Date observed: 2026-02-28
