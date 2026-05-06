---
'@helixui/library': patch
---

Upgrade @bookedsolid/rea 0.26.1 → 0.28.0 — closes helix-031 + ships verify-claim CLI

**helix-031 closed** (0.27.0): `# shellcheck disable=SC1078` directives at L165 + L535 of `cmd-segments.sh`. Helix-side `--exclude=SC1078` workaround retired from `.husky/pre-push.d/10-helix-quality-gates`.

**0.28.0 highlights:**
- New `rea verify-claim <claim-id>` CLI replays canonical PoC battery against `dist/cli/index.js` — kills the SHA-of-shims methodology error class permanently
- 6 new specialist agents: `adversarial-test-specialist`, `ast-parser-specialist`, `figma-dx-specialist`, `mcp-protocol-specialist`, `observability-specialist`, `shell-scripting-specialist`
- Hook updates: `cmd-segments.sh`, `blocked-paths-bash-gate.sh`, `protected-paths-bash-gate.sh` auto-updated
- Manifest updates: codex-adversarial.md, rea-orchestrator.md, codex-review.md command

`REA_SKIP_PUSH_GATE=1` standing risk-accept can be retired for routine pushes once this lands. The local-first `rea review` flow remains the canonical path.
