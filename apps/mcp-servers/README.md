# MCP Servers

Model Context Protocol (MCP) servers that provide specialized tooling for Claude Code.

## Available Servers

### 1. `cem-analyzer`

- **Purpose:** Analyze and query Custom Elements Manifest
- **Tools:**
  - `get-component-metadata` - Get full metadata for a component
  - `list-components` - List all components in CEM
  - `validate-cem` - Validate CEM structure
- **Location:** `apps/mcp-servers/cem-analyzer`

### 2. `health-scorer`

- **Purpose:** Calculate component health scores
- **Tools:**
  - `score-component` - Calculate health score for a component
  - `score-all-components` - Score all components
  - `get-health-history` - Get historical health data
- **Location:** `apps/mcp-servers/health-scorer`

### 3. `typescript-diagnostics`

- **Purpose:** Run TypeScript compiler diagnostics
- **Tools:**
  - `get-diagnostics` - Get TypeScript errors for a file
  - `get-project-diagnostics` - Get all project diagnostics
  - `check-file` - Type-check a specific file
- **Location:** `apps/mcp-servers/typescript-diagnostics`

## Configuration

MCP servers are configured in `.mcp.json` at the workspace root:

```json
{
  "mcpServers": {
    "cem-analyzer": {
      "command": "node",
      "args": ["/absolute/path/to/apps/mcp-servers/cem-analyzer/build/index.js"],
      "env": { "DEBUG": "mcp:*" }
    }
  }
}
```

**IMPORTANT:** Paths must be absolute, not relative.

## Building MCP Servers

### Initial Setup

```bash
# Build all MCP servers
npm run build:mcp-servers

# Verify health
npm run mcp:health
```

### Development Workflow

```bash
# Build a single server
npm run build --workspace=apps/mcp-servers/cem-analyzer

# Watch mode for development
npm run dev --workspace=apps/mcp-servers/cem-analyzer
```

## Troubleshooting

### MCP Server Won't Start

**Symptom:** Claude Code shows "Failed to start MCP server"

**Diagnosis:**

```bash
# Run health check
npm run mcp:health

# Manually test server startup
node apps/mcp-servers/cem-analyzer/build/index.js
```

**Common Fixes:**

1. **Build artifacts missing**

   ```bash
   npm run build:mcp-servers
   ```

2. **Path in .mcp.json is wrong**
   - Verify paths are absolute
   - Check that `build/index.js` exists

3. **Permissions issue**

   ```bash
   chmod +x apps/mcp-servers/*/build/index.js
   ```

4. **Dependency issue**
   ```bash
   npm install
   ```

### Server Crashes on Startup

**Check logs:**

- MCP servers log to stderr with `DEBUG=mcp:*`
- Look for stack traces in Claude Code console

**Common issues:**

- Missing shared dependency: `npm run build --workspace=apps/mcp-servers/shared`
- File path resolution: MCP servers use `process.cwd()` - ensure paths are absolute

### Server Runs But Tools Don't Work

**Symptom:** Server starts but tools return errors

**Check:**

1. CEM file exists: `packages/hx-library/custom-elements.json`
2. Health history exists: `.claude/health-history/*.json`
3. TypeScript project exists: `tsconfig.base.json`

**Regenerate data:**

```bash
# Regenerate CEM
npm run cem

# Regenerate health scores
npm run build:admin  # Health scorer runs during admin build
```

## Development

### Adding a New MCP Server

1. Create directory: `apps/mcp-servers/my-server/`
2. Copy structure from existing server
3. Add to workspace: Update root `package.json` workspaces
4. Add to `.mcp.json` with absolute path
5. Add to `build:mcp-servers` script
6. Add to `mcp-health-check.sh`

### Testing MCP Servers

```bash
# Unit tests
npm run test --workspace=apps/mcp-servers/cem-analyzer

# Integration test (manual)
node apps/mcp-servers/cem-analyzer/build/index.js
# Then send MCP protocol messages via stdin
```

## Architecture

### Shared Dependencies

All MCP servers depend on `@helixui/mcp-shared`:

- Git utilities
- File operations
- Validation helpers
- Error handling
- MCP SDK helpers

### Build Process

1. TypeScript compilation: `tsc`
2. Output: `build/` directory
3. Entry point: `build/index.js` (must be executable)
4. Source maps: Generated for debugging

### Environment Variables

- `DEBUG=mcp:*` - Enable MCP SDK debug logging
- `NODE_ENV` - Set to `development` or `production`

## Performance

MCP servers should be:

- **Fast:** <100ms for most tool calls
- **Reliable:** Handle errors gracefully
- **Lightweight:** Minimal dependencies

**Performance Budget:**

- Server startup: <500ms
- Tool call (simple): <50ms
- Tool call (complex): <200ms

## Security

MCP servers run with full file system access. They should:

- Validate all inputs
- Use Zod schemas for type safety
- Never execute arbitrary code
- Log security-relevant operations

## License

Private - Internal tooling only
