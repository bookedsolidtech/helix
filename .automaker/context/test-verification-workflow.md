# Test Verification Workflow — MANDATORY BEFORE EVERY PUSH

## ZERO TOLERANCE POLICY

`pnpm run verify` is MANDATORY before every push. No exceptions.
`pnpm run test:smart` is MANDATORY before every push when component source changed. No exceptions.

**If you push code that fails CI, you have failed your task.** The cycle wasted on fixing your broken PR is unacceptable. Run the gates locally. Fix failures locally. Push clean code.

---

## CRITICAL: Storybook Tests Are a Separate Gate

`test:smart` and `pnpm run test` DO NOT run Storybook interaction tests. Story
files (`.stories.ts`) are tested exclusively by `pnpm run test:storybook`, which
runs the dedicated `apps/storybook/vitest.config.ts` suite.

**If you change any `.stories.ts` file, you MUST run `pnpm run test:storybook`
before pushing.** If you skip this step and push, you will fail the CI
`Storybook Tests` job. This has happened repeatedly and costs multiple CI cycles.

`pnpm run preflight` now includes Gate 7.5 which runs this automatically when
story files are detected in your diff.

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

4b. **Run Storybook tests (MANDATORY when `.stories.ts` files changed):**
   ```bash
   pnpm run test:storybook
   ```
   If this fails: **FIX THE STORY ASSERTIONS.** Do not push. Do not skip.
   `test:smart` does NOT run story tests. This is a separate gate.

   Common story test failure patterns and fixes:
   - `getByLabelText('Foo')` fails → labels with `aria-hidden` spans: use `getByLabelText('Foo')` without the `*`
   - `canvas.querySelector()` returns null → shadow DOM: use `within(el.shadowRoot!)` or `el.shadowRoot!.querySelector()`
   - `userEvent.clear(input)` fails → shadow DOM input: focus the host, then use `userEvent.type(host, ...)`
   - `expected 'Error: \n  N' to be 'N'` → slot text includes slot name: use `.shadowRoot.querySelector('[part="value"]')`

5. **Commit and push:**
   ```bash
   HUSKY=0 git commit -m "type(scope): lowercase message"
   HUSKY=0 git push origin <branch>
   ```

---

## What NOT To Do

- NEVER run `npx vitest run` without a specific filter (use `test:smart` or `test:storybook`)
- NEVER push without running `pnpm run verify` first
- NEVER push without running `pnpm run test:smart` when component source changed
- NEVER push without running `pnpm run test:storybook` when `.stories.ts` files changed
- NEVER assume "CI handles it" — YOU handle it locally before pushing
- NEVER assume `test:smart` covers stories — it does NOT, story tests are a separate command
- Do NOT poll `sleep N && cat task.output` in a loop
- Do NOT run tests multiple times seeking confirmation — verify, commit, push, done

---

## The Rules

```bash
pnpm run verify          # MANDATORY — lint + format:check + type-check
pnpm run test:smart      # MANDATORY — when component source (*.ts, not stories) changed
pnpm run test:storybook  # MANDATORY — when *.stories.ts files changed
```

If `pnpm run verify` fails, you do NOT push. Period.
If `pnpm run test:smart` fails, you do NOT push. Period.
If `pnpm run test:storybook` fails on story file changes, you do NOT push. Period.
Fix the errors first. Then push. This is non-negotiable.

**The fastest path to a clean push:**
```bash
pnpm run preflight  # runs all gates including 7.5 (storybook) when stories changed
```

---

## If Tests Fail in CI Despite Following This Workflow

CI will report failures on the PR. Fix the failures, run `pnpm run verify` AND `pnpm run test:smart` again locally, and push the fix. The same rules apply to remediation pushes — verify and test before every push, no exceptions.
