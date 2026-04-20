---
'@helixui/library': patch
---

chore(rea): bump @bookedsolid/rea devDependency 0.4.0 → 0.6.1

0.5.0 shipped the native git pre-push adapter (BUG-008 upstream fix) that consumes `<local-ref> <local-sha> <remote-ref> <remote-sha>` on stdin. Our local `.claude/hooks/push-review-gate.sh` still expects JSON stdin, so the consumer-side jq wrapper in `.husky/pre-push` is load-bearing until a follow-up PR runs `rea upgrade` to replace the hook with the 0.6.x packaged adapter.

0.6.0 added the `__rea__health` meta-tool (gateway self-diagnostic callable during HALT) and `rea doctor` non-git escape hatch via `isGitRepo(baseDir)` supporting directory / gitlink file / symlink shapes.

**Known issue carried forward to 0.6.1:** BUG-011 (`__rea__health` redact/injection middleware bypass — `halt_reason` and downstream `last_error` serialized raw) is **still present** in 0.6.1. Codex adversarial verification confirmed the 0.6.1 `dist/` tree is byte-identical to 0.6.0; the upstream fix did not reach the published tarball. See `Projects/rea/Bug Reports/Rea Bug Reports.md` (bst vault) for the full evidence trail. HELiX does not currently expose `__rea__health` to untrusted callers, so consumer-side impact is limited to operator disclosure via CLI; upgrade proceeds on that basis.

0.6.1 also introduces MEDIUM-severity BUG-012 (cross-repo hook guard trusts `CLAUDE_PROJECT_DIR` as authorization input). Not material to HELiX consumers — rea is a devDependency here, not a commit/push target — but logged for upstream resolution.

Dev dependency only — no component source touched, no public API surface changes, no CEM regeneration needed.
