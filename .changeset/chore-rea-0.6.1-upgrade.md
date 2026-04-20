---
'@helixui/library': patch
---

chore(rea): bump @bookedsolid/rea devDependency 0.4.0 → 0.6.1

0.5.0 shipped the native git pre-push adapter (BUG-008 upstream fix) that consumes `<local-ref> <local-sha> <remote-ref> <remote-sha>` on stdin. Our local `.claude/hooks/push-review-gate.sh` still expects JSON stdin, so the consumer-side jq wrapper in `.husky/pre-push` is load-bearing until a follow-up PR runs `rea upgrade` to replace the hook with the 0.6.x packaged adapter.

0.6.0 added the `__rea__health` meta-tool (gateway self-diagnostic callable during HALT) and `rea doctor` non-git escape hatch via `isGitRepo(baseDir)` supporting directory / gitlink file / symlink shapes.

0.6.1 patches the HIGH-severity `__rea__health` redact/injection middleware bypass identified by Codex adversarial review on the 0.6.0 PR (logged as BUG-011).

Dev dependency only — no component source touched, no public API surface changes, no CEM regeneration needed.
