# Test Agent Workflow — SMART TESTS ONLY

## CRITICAL: Never Run the Full Test Suite

Running `npm run test`, `npm run test:library`, or `npx vitest run` (no filter) runs **all 100+ tests** including broken components (hx-slider, hx-number-input) that timeout at 30s each. This costs $14+ per agent and blocks the pipeline. **This is forbidden.**

## The Smart Test Command

```bash
npm run test:smart
```

This command:
- Diffs your branch against `origin/dev` to find which components you changed
- Runs vitest **only** for those components
- Skips entirely if you only changed styles, stories, Twig files, or changesets
- Completes in seconds instead of minutes

**Use `npm run test:smart` any time you want to verify your tests locally.**

## Correct Workflow

1. **Read the AUDIT.md** for each component to understand what tests are missing
2. **Write the test code** — add missing test cases to `.test.ts` files
3. **Run `npm run verify`** (lint + format:check + type-check — fast, ~30s)
4. **Optionally run `npm run test:smart`** to verify only your changed components pass
5. **Format and commit:**
   ```bash
   npm run format
   git add -u
   git -c core.hooksPath=/dev/null commit -m "test: add coverage for [components]"
   ```
6. **Push and open PR** — CI runs the full suite in a proper environment

## What NOT To Do

- ❌ NEVER run `npm run test` — runs all 100+ tests, costs $14+
- ❌ NEVER run `npm run test:library` — same as above
- ❌ NEVER run `npx vitest run` without a specific filter
- ❌ Do NOT poll `sleep N && cat task.output` in a loop
- ❌ Do NOT run tests multiple times seeking confirmation — commit, push, let CI verify

## One Verify Pass Is Enough

```bash
npm run verify        # lint + format:check + type-check (mandatory)
npm run test:smart    # optional: only tests YOUR changed components
```

Push after verify passes. CI handles the full suite. Done.

## If Tests Fail in CI

CI will report failures on the PR. The agent will be re-run with that context. Do not preemptively fix failures you haven't seen — write the code, push, let CI tell you what's broken.
