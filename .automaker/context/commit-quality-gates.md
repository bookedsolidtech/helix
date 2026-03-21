# Commit Quality Gates — MANDATORY, NO EXCEPTIONS

## Commit Message Format — STRICT ENFORCEMENT

Commitlint enforces conventional commits with these rules:

```
<type>(<scope>): <subject>
```

**CRITICAL: Subject must be ALL LOWERCASE — no exceptions.**
- ✅ `fix(drupal): css injection guard and audit cleanup`
- ✅ `fix(tests): remove duplicate test blocks`
- ❌ `fix(drupal): CSS injection guard` — "CSS" is uppercase, FAILS
- ❌ `fix(tests): Remove duplicate tests` — capital "R", FAILS
- ❌ `feat: TypeScript strict mode fixes` — capital "T", FAILS

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

Run `npm run format` before EVERY commit. The pre-commit hook is bypassed
with `core.hooksPath=/dev/null` in this workflow — that means YOU must run
prettier manually. Unformatted code WILL fail CI.

```bash
npm run format
git add -u   # re-stage any files prettier changed
git -c core.hooksPath=/dev/null commit -m "your message"
```

## Full Verify Before Push

```bash
npm run verify   # lint + format:check + type-check — must be zero failures
```

Note: `npm run verify` covers lint, format:check, and type-check. Targeted component
tests are run automatically by the pre-push hook (Gate 3.5) — see below.

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

**Why this exists:** `npm run verify` (lint + format + type-check) does not run tests.
The hx-slider `@query` + `= null` field initializer bug passed verify but broke CI.
This gate catches runtime/DOM-level bugs that type-check cannot detect, without
running the full suite (which takes minutes).

## CSS Changes: VRT Baseline Update Required

If you modify ANY `.styles.ts` file or any CSS in a component, you MUST
update the VRT baselines before pushing or CI will fail:

```bash
npm run test:vrt:update
git add -A
git -c core.hooksPath=/dev/null commit -m "test: update VRT baselines for [component names]"
```

## Pre-Push Checklist (all required)

- [ ] `npm run format` run and changes re-staged/committed
- [ ] `npm run verify` — zero failures
- [ ] If any `.styles.ts` changed: `npm run test:vrt:update` committed
- [ ] `npm run test:library` — all tests pass
