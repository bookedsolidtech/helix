# Helix + rea MCP gateway

`@bookedsolid/rea@^0.3.0` ships `rea serve` — an MCP stdio gateway that proxies
downstream MCP servers through the 11-layer middleware chain (audit →
kill-switch → tier → policy → blocked-paths → rate-limit → circuit-breaker →
injection → redact → result-size-cap → terminal).

This repo routes `obsidian` and `helixir` through the gateway. `discord-ops`
stays in `.mcp.json` directly — see [Known gap](#known-gap) below.

## How it works

```text
Claude Code (MCP client)
  └── .mcp.json
        ├── rea-gateway  ── stdio ──▶  node_modules/@bookedsolid/rea serve
        │                                    │
        │                                    ├── reads .rea/policy.yaml
        │                                    ├── reads .rea/registry.yaml
        │                                    └── spawns downstream children:
        │                                          ├── obsidian-mcp
        │                                          └── helixir
        │
        └── discord-ops  ── stdio ──▶  npx discord-ops@latest
                                            (direct; token forwarding gap)
```

Tools from downstream servers are surfaced to Claude Code with a
`<serverName>__<toolName>` prefix, so `obsidian-mcp`'s `list-available-vaults`
tool becomes `obsidian__list-available-vaults`.

Every tool call through the gateway writes a hash-chained entry to
`.rea/audit.jsonl`. Verify with:

```bash
pnpm exec rea audit verify
```

## Add a new MCP to the gateway

1. Add an entry under `servers:` in `.rea/registry.yaml`:

   ```yaml
   - name: my-server           # lowercase-kebab, becomes the tool prefix
     command: npx
     args: ['-y', 'my-mcp-server']
     env:
       SOME_PATH: /abs/path
     enabled: true
   ```

2. Do NOT also list the server in `.mcp.json` — that would double-register the
   catalog.
3. Restart Claude Code so `rea serve` re-loads the registry.
4. Verify:

   ```bash
   node .helix-gateway-smoke.mjs
   ```

## Known gap

`rea@0.3.0` refuses to silently forward env vars whose name matches
`/(TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL)/i` via `env_passthrough` — a
security posture that prevents a malicious registry entry from exfiltrating
operator secrets through a child process's `process.env`. Explicit
`env:` mappings are allowed but take literal values (no `${VAR}` interpolation
in 0.3.0).

`discord-ops` therefore stays in `.mcp.json` because its `BOOKED_DISCORD_BOT_TOKEN`
and `CLARITY_DISCORD_BOT_TOKEN` must be shell-interpolated at startup. Future
`rea` versions are expected to add explicit `${VAR}` interpolation with a
redact-by-default contract so token-bearing MCPs can also route through the
gateway.

## Operational commands

- `pnpm exec rea check` — autonomy level, HALT status, recent audit entries
- `pnpm exec rea doctor` — verify install (hooks, agents, commands, registry parses)
- `pnpm exec rea freeze --reason "..."` — write `.rea/HALT` to halt agent operations
- `pnpm exec rea unfreeze` — remove HALT (interactive)
- `pnpm exec rea audit verify` — re-hash the chain; exit 0 on clean
- `pnpm exec rea audit rotate` — force-rotate the audit log now

## Files in this directory

| File                    | Source          | Purpose                                |
|-------------------------|-----------------|----------------------------------------|
| `policy.yaml`           | committed       | autonomy, blocked-paths, AI attribution |
| `registry.yaml`         | committed       | downstream MCPs routed through gateway |
| `audit.jsonl`           | gitignored      | hash-chained append-only audit         |
| `HALT`                  | gitignored      | emergency freeze marker                |
| `install-manifest.json` | committed       | drift tracking for `rea upgrade`       |
