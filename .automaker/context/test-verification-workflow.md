# Test Verification Workflow — MANDATORY BEFORE EVERY PUSH

## ZERO TOLERANCE POLICY

`pnpm run verify` is MANDATORY before every push. No exceptions.
`pnpm run test:smart` is MANDATORY before every push when component source changed. No exceptions.

**If you push code that fails CI, you have failed your task.** The cycle wasted on fixing your broken PR is unacceptable. Run the gates locally. Fix failures locally. Push clean code.

---

## CRITICAL: Never Run the Full Test Suite

Running `pnpm run test`, `pnpm run test:library`, or `npx vitest run` (no filter) runs **all 100+ tests** including broken components (hx-slider, hx-number-input) that timeout at 30s each. This costs $14+ per agent and blocks the pipeline. **This is forbidden.**

---

## The Smart Test Command

```bash
pnpm run test:smart
```

This command:
- Diffs your branch against `origin/dev` to find which components you changed
- Runs vitest **only** for those components
- Skips entirely if you only changed styles, stories, Twig files, or changesets
- Completes in seconds instead of minutes

---

## Required Workflow

1. **Write your code changes** — component source, tests, styles, etc.
2. **Format:**
   ```bash
   pnpm run format
   git add -u
   ```
3. **Run verify (MANDATORY):**
   ```bash
   pnpm run verify
   ```
   If this fails: **FIX THE ERRORS.** Do not push. Do not skip.

4. **Run smart tests (MANDATORY when component source changed):**
   ```bash
   pnpm run test:smart
   ```
   If this fails: **FIX THE TESTS.** Do not push. Do not skip.
   If no component source files changed, this step is skipped automatically by the command.

5. **Commit and push:**
   ```bash
   HUSKY=0 git commit -m "type(scope): lowercase message"
   HUSKY=0 git push origin <branch>
   ```

---

## What NOT To Do

- NEVER run `pnpm run test` — runs all 100+ tests, costs $14+
- NEVER run `pnpm run test:library` — same as above
- NEVER run `npx vitest run` without a specific filter
- NEVER push without running `pnpm run verify` first
- NEVER push without running `pnpm run test:smart` when component source changed
- NEVER assume "CI handles it" — YOU handle it locally before pushing
- Do NOT poll `sleep N && cat task.output` in a loop
- Do NOT run tests multiple times seeking confirmation — verify, commit, push, done

---

## The Rules

```bash
pnpm run verify        # MANDATORY — lint + format:check + type-check
pnpm run test:smart    # MANDATORY — when component source changed
```

If `pnpm run verify` fails, you do NOT push. Period.
If `pnpm run test:smart` fails, you do NOT push. Period.
Fix the errors first. Then push. This is non-negotiable.

---

## If Tests Fail in CI Despite Following This Workflow

CI will report failures on the PR. Fix the failures, run `pnpm run verify` AND `pnpm run test:smart` again locally, and push the fix. The same rules apply to remediation pushes — verify and test before every push, no exceptions.
