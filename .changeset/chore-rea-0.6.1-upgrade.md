---
'@helixui/library': patch
---

chore(rea): bump @bookedsolid/rea devDependency 0.4.0 → 0.6.2

Rolls up the 0.5.0 / 0.6.0 / 0.6.1 / 0.6.2 upgrade chain. Highlights:

- **0.5.0** shipped the native git pre-push adapter (BUG-008 upstream fix). Our local `.claude/hooks/push-review-gate.sh` still expects Claude-style JSON stdin, so the consumer-side jq wrapper in `.husky/pre-push` remains load-bearing until a follow-up `rea upgrade` run replaces the hook with the 0.6.x packaged adapter.
- **0.6.0** added the `__rea__health` meta-tool (gateway self-diagnostic callable under HALT) and the `rea doctor` non-git escape hatch via `isGitRepo(baseDir)` for directory / gitlink file / symlink shapes.
- **0.6.1** introduced a cross-repo hook guard in `commit-review-gate.sh` + `push-review-gate.sh`. Did **not** ship the claimed BUG-011 fix — `dist/` was byte-identical to 0.6.0 (see `Projects/rea/Bug Reports/Rea Bug Reports.md` in bst vault for evidence trail).
- **0.6.2** actually ships the BUG-011 fix: `sanitizeHealthSnapshot` wired into the `__rea__health` short-circuit path. Default behavior strips `halt_reason` + `last_error` from the MCP response entirely. Explicit opt-in via new `gateway.health.expose_diagnostics: true` policy knob runs the diagnostic strings through redact + injection-scan with a 4096-char truncation cap (bounds adversary-controlled input before pattern matching). UTF-16 surrogate-pair handling prevents silent U+FFFD replacement on truncation. Policy schema is strict-mode (typos like `gateway.heath` fail loudly). Upstream cites their own Codex review trail (C-11.1 through N-3) in the source comments.

Dev dependency only — no component source touched, no public API surface changes, no CEM regeneration needed.
