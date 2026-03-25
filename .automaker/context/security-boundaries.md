# Security Boundaries — Agent Guardrails

Zero-tolerance rules for all agents operating in this repository.
These are non-negotiable. Violations cause irreversible harm.

---

## Files Agents MUST NEVER Stage or Commit

Regardless of `.gitignore` status, never stage or commit these files:

```
.env
.env.*
.env.local
.env.*.local
.automaker/settings.json
*.pem
*.key
credentials.json
.npmrc
*.p12
*.pfx
id_rsa
id_ed25519
```

**Verification before every commit:**

```bash
# Check staged files for forbidden patterns
git diff --cached --name-only | grep -E '\.env|\.pem|\.key|credentials\.json|\.npmrc|settings\.json'
```

If any match appears: **abort the commit immediately.** Do not proceed.

---

## NEVER Write Credential Values Into Any File

This includes:
- Report files (`.md`, `.json`, `.txt`)
- Analysis output
- Log files
- Commit messages
- PR descriptions
- Discord/Slack messages

If you must reference a credential, token, or key: use `[REDACTED]`.

**Examples:**
- Wrong: `NPM_TOKEN=npm_abc123xyz...`
- Correct: `NPM_TOKEN=[REDACTED]`
- Wrong: `Authorization: Bearer eyJhbGci...`
- Correct: `Authorization: Bearer [REDACTED]`

---

## Pre-Commit Validation — Run Before Every Commit

```bash
# 1. Check for staged secrets (gitleaks)
gitleaks protect --staged --source . 2>/dev/null || echo "gitleaks not installed — skipping local scan (CI will catch)"

# 2. Verify no forbidden files are staged
FORBIDDEN=$(git diff --cached --name-only | grep -E '\.env($|\.|\.local)|\.pem$|\.key$|credentials\.json$|settings\.json$|\.npmrc$')
if [ -n "$FORBIDDEN" ]; then
  echo "BLOCKED: forbidden files staged: $FORBIDDEN"
  exit 1
fi

# 3. Run standard quality gate
pnpm run verify
```

---

## Worktree-Specific Instructions

Agents operate in worktrees under `.worktrees/feature-*`. In worktrees:

- **Husky hooks are bypassed** (`HUSKY=0` is set). There is no pre-commit hook safety net.
- **You are the only gate.** Run the pre-commit validation above manually before every commit.
- **Never use `--no-verify`** — it bypasses commitlint and any remaining hooks.
- The parent repo's `.env` files are NOT visible inside the worktree. Do not try to read them.

---

## CODEOWNERS — Human Review Required

These paths require @himerus review before any PR can merge:

| Path | Reason |
|------|--------|
| `.env*` | Credential files — must never be committed |
| `.gitleaks.toml` | Secret scanning config — weakening it is a security regression |
| `.github/workflows/` | CI pipelines — controls what runs in the build environment |
| `.automaker/settings.json` | Agent autonomy config — controls agent capabilities |
| `packages/*/package.json` | Publishing config — controls what ships to npm |
| `.github/CODEOWNERS` | This file — prevents unauthorized ownership changes |

If your PR touches any of these paths, a human review is **mandatory before merge**. Auto-merge will not proceed until @himerus approves.

---

## npm Package Security

The `files` allowlist in `packages/hx-library/package.json` and `packages/hx-tokens/package.json` controls what ships to npm. Do not modify these fields without explicit authorization:

- `packages/hx-library`: publishes `dist/`, `custom-elements.json`, `fouc.css`
- `packages/hx-tokens`: publishes `dist/`, `src/tokens.json`

Source files, test files, stories, and configuration are excluded. Keep it that way.
