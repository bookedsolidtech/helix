# Commit Quality Gates — MANDATORY, NO EXCEPTIONS

## ZERO TOLERANCE: Run verify + test:smart before EVERY push. No exceptions.

Pushing code that fails CI is an automatic failure. There is no "CI handles it" — YOU handle it locally.
See agent-push-protocol.md for the exact push sequence.

---

## Commit Message Format — STRICT ENFORCEMENT

Commitlint enforces conventional commits with these rules:

```
<type>(<scope>): <subject>
```

**CRITICAL: Subject must be ALL LOWERCASE — no exceptions.**
- `fix(drupal): css injection guard and audit cleanup`
- `fix(tests): remove duplicate test blocks`
- `fix(drupal): CSS injection guard` -- "CSS" is uppercase, FAILS
- `fix(tests): Remove duplicate tests` -- capital "R", FAILS
- `feat: TypeScript strict mode fixes` -- capital "T", FAILS

**Acronyms, proper nouns, file names — all must be lowercase in the subject:**
- `css` not `CSS`
- `audit` not `AUDIT`
- `typescript` not `TypeScript`
- `drupal` not `Drupal`
- `html` not `HTML`

**Subject max length: 120 characters.** Keep it short and lowercase.

Valid types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `perf`, `ci`, `build`

---

## Prettier Before Every Commit

Run `pnpm run format` before EVERY commit. The pre-commit hook is bypassed
with `HUSKY=0` in this workflow — that means YOU must run prettier manually.
Unformatted code WILL fail CI.

```bash
pnpm run format
git add -u   # re-stage any files prettier changed
HUSKY=0 git commit -m "your message"
```

## Full Verify Before Push — MANDATORY

**FAILURE TO RUN THIS BEFORE PUSH IS AN AUTOMATIC FAILURE.**

```bash
pnpm run verify   # lint + format:check + type-check — must be zero failures
```

This is not optional. This is not "nice to have." If you skip this and CI fails, you have wasted a cycle. Run it. Fix any errors. Then push.

## Smart Tests Before Push — MANDATORY When Component Source Changed

**FAILURE TO RUN THIS BEFORE PUSH IS AN AUTOMATIC FAILURE.**

```bash
pnpm run test:smart   # diffs against origin/dev, runs only changed component tests
```

If this fails: FIX THE TESTS. Do not push. Do not skip.

**NEVER run `pnpm run test` or `pnpm run test:library` — these run the full suite (100+ tests, $14+ cost, minutes of blocking). They are forbidden.**

## Gate 3.5: Targeted Component Tests (pre-push hook, automatic)

The pre-push hook (`scripts/pre-push-check.sh`) includes a targeted test gate that
runs ONLY the `*.test.ts` files for components whose source `.ts` files changed
compared to the base branch.

**What triggers it:** Any change to a file matching
`packages/hx-library/src/components/hx-*/**.ts` that is NOT a `.test.ts`,
`.stories.ts`, `.styles.ts`, or `index.ts` file.

**What does NOT trigger it:** AUDIT.md, README.md, Twig templates, `.stories.ts`,
`.styles.ts`, changeset files, or any non-component-source change. Those pushes skip
the gate entirely for speed.

**Timeout:** 90 seconds total. If exceeded, the gate fails with a clear error and
the manual command to reproduce.

**Manual equivalent:**
```bash
cd packages/hx-library && npx vitest run --reporter=verbose src/components/hx-<name>/hx-<name>.test.ts
```

**Why this exists:** `pnpm run verify` (lint + format + type-check) does not run tests.
The hx-slider `@query` + `= null` field initializer bug passed verify but broke CI.
This gate catches runtime/DOM-level bugs that type-check cannot detect, without
running the full suite (which takes minutes).

## CSS Changes: VRT Baseline Update Required

If you modify ANY `.styles.ts` file or any CSS in a component, you MUST
update the VRT baselines before pushing or CI will fail:

```bash
pnpm run test:vrt:update
git add -A
HUSKY=0 git commit -m "test: update vrt baselines for [component names]"
```

## Pre-Push Checklist (ALL required — no exceptions)

- [ ] `pnpm run format` run and changes re-staged/committed
- [ ] `pnpm run verify` — zero failures
- [ ] If any `.styles.ts` changed: `pnpm run test:vrt:update` committed
- [ ] `pnpm run test:smart` — passes (when component source changed)
