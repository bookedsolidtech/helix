---
'@helixui/library': patch
---

Upgrade `@bookedsolid/rea` to 0.9.2 (exact) + local backports of six 0.9.3 fixes (three security, three correctness).

## Upstream bump

- 0.9.2 fixes the push-review and commit-review hook cache-check invocation — `node_modules/.bin/rea` is a POSIX shell shim (pnpm) or symlink (npm), never a plain JS file, so prefixing it with `node` produced a SyntaxError and both gates silently fell back to `{"hit":false}` (upstream bookedsolidtech/rea#53).
- Synced `.claude/hooks/_lib/push-review-core.sh` and `.claude/hooks/commit-review-gate.sh` from the 0.9.2 package so both local hooks match the fixed invocation. Both carried the identical `node <shim>` bug — without the second sync the commit gate would keep silently falling back to cache-miss on every agent commit.
- Removed legacy `review.push_review` key from `.rea/policy.yaml` (carried from 0.9.1 upgrade) — the 0.9.x policy schema only recognizes `review.codex_required`.

## Local 0.9.3 backports (CodeRabbit findings on PR #1506)

Six findings in the upstream-synced `push-review-core.sh`. All filed upstream for 0.9.3 and patched locally as a mitigation:

- **Legacy `push_review: false` grep bypass** — removed. The raw-grep check ran before the strict schema validator, so any agent could disarm the gate by adding `push_review: false` to `.rea/policy.yaml`. Upstream: [rea#56](https://github.com/bookedsolidtech/rea/issues/56).
- **Protected-paths gap** — the matcher now also guards `.rea/` and `.husky/`. Previously an agent could flip autonomy level or neuter `.husky/pre-push` without tripping Codex review. Upstream: [rea#56](https://github.com/bookedsolidtech/rea/issues/56).
- **Mixed-push deletion bypass** — the deletion guard now fires whenever any refspec is a deletion, regardless of whether a non-delete refspec is also present in the same push. Pre-0.9.3 the check was gated on `SOURCE_SHA` being empty, so a mixed push like `safe:safe :protected-branch` silently allowed the deletion. Upstream: [rea#61](https://github.com/bookedsolidtech/rea/issues/61).
- **LINE_COUNT/FILE_COUNT "0\n0" misrender** — `grep -c ... || echo "0"` captures both grep's own `0` (printed before its non-zero exit on no-match) AND the fallback `echo "0"`, producing `0\n0` in the user-facing `PUSH REVIEW GATE` scope banner. Fixed by swapping to `|| true` plus `${VAR:-0}` bash fallback. Upstream: [rea#62](https://github.com/bookedsolidtech/rea/issues/62).
- **PUSH_SHA portability / silent cache disarm** — the gate hashed the push diff with `shasum -a 256`, which is not installed on Alpine, distroless, or most minimal Linux CI images. The pipeline failed silently (`|| echo ""`), `PUSH_SHA` became empty, and the cache lookup was skipped with no signal — every push from a minimal-image runner burned a full codex review. Fixed with a portable hasher chain (`sha256sum` → `shasum` → `openssl dgst -sha256`), no-hasher stderr WARN, and hex-digest validation. openssl form uses `awk '{print $NF}'` without `-r` so it works on OpenSSL 1.1.x (Debian 11, Ubuntu 20.04, RHEL8, AL2). Upstream: [rea#63](https://github.com/bookedsolidtech/rea/issues/63).
- **SKIP_METADATA stringifies numeric os_pid/os_ppid** — the `REA_SKIP_PUSH_REVIEW` audit record used `jq --arg` for `$$` and `$PPID`, yielding string-typed fields in the JSONL audit log. Downstream auditors querying `.metadata.os_identity.pid == 1234` silently got zero matches. Fixed by switching those two fields to `jq --argjson` (safe — bash internals are guaranteed non-empty numeric). Upstream: [rea#64](https://github.com/bookedsolidtech/rea/issues/64).

Full rea defect catalog tracked in internal bug-report notes; local backport patches preserved for re-application on the next `rea upgrade` once 0.9.3 lands.

No consumer-facing API changes. Internal governance infra only.
