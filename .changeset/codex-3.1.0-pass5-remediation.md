---
'@helixui/library': patch
---

Close two Codex adversarial-review concerns surfaced in pass 5 of the 3.1.0
staging→main review loop.

- `scripts/hooks/token-registry.json`: regenerate from the current token
  source. The 3.1.0 semantic-token rebinding sweep added
  `--hx-color-text-strong`, `--hx-color-text-placeholder`, and
  `--hx-color-surface-inverse` to `packages/hx-tokens/src/tokens.json` plus
  components consuming them, but the registry that backs the
  `design-token-enforcement` hook's `isSemanticToken()` and `isKnownToken()`
  predicates was never regenerated — so the hook treated the new aliases as
  unknown tokens. Regenerated via `pnpm run hooks:generate-token-registry`.
- `.github/workflows/ci.yml`: extend the changed-component resolver to
  detect shared tests under `packages/hx-library/src/components/__tests__/`.
  The resolver previously filtered to `src/components/hx-*` non-test files
  only, so a PR that changed the new shared `dark-mode-resolution.test.ts`
  (and nothing else) would resolve to zero components and skip the test
  step entirely. When a shared test changes, fall back to the full test
  suite so the regression actually executes.
