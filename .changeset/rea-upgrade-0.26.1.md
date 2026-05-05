---
'@helixui/library': patch
---

Upgrade @bookedsolid/rea 0.23.0 → 0.26.1 — closes helix-024 + helix-028

**helix-024 P1 × 3 closed** (round-24 fix landed in rea 0.26.0):
- cwd-relative kill-switch defeat (`cd .rea && echo > HALT`)
- Doubly-nested eval bypass (`eval "eval \"...\""`)
- Symlink-alias-write bypass (`ln -sf .rea/HALT /tmp/x && echo > /tmp/x`)

**helix-028 P1 closed** (rea 0.26.1):
- Multiline payload awk bypass in `_lib/cmd-segments.sh:193`
- Fix uses `\x1c\x1d` (FS+GS control bytes) as RS instead of default newline-RS, so multiline `bash -lc $'cmd1\\ncmd2'` payloads process as single record
- Bonus: ANSI-C `$'...'` quoted span recognition (mode 3) closes additional bypass classes

SHA verification:
- `_lib/cmd-segments.sh`: `32879325...` (0.23.0/0.24.0/0.25.0) → `7ca44ef02937...` (0.26.1)
- `blocked-paths-bash-gate.sh`, `protected-paths-bash-gate.sh`, `settings-protection.sh`: unchanged (didn't need fixing)

**New rea-managed agents added:**
- `platform-architect`, `principal-engineer`, `principal-product-engineer`, `release-captain`, `security-architect`, `data-architect`, `devex-architect`

**New hook:** `local-review-gate.sh` (PreToolUse:Bash chain).

`REA_SKIP_PUSH_GATE=1` standing risk-accept can be retired for routine pushes once this lands. The helix-side filter at `scripts/helix-push-gate-filter.mjs` (helix-029) remains as the durable workaround for any future rea-managed-finding cases.
