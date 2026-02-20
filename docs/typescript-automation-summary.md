# TypeScript Automation: Quick Reference

**One-page summary of TypeScript strict mode enforcement automation**

---

## 6 Claude Code Git Hooks

### P0 (Critical) - Must Have

1. **no-any-types**: Block all `any` types (explicit and implicit)
2. **event-type-safety**: Enforce `CustomEvent<T>` with explicit detail interfaces

### P1 (High) - Should Have

3. **jsdoc-coverage**: Require JSDoc on all public APIs (100% coverage)
4. **cem-type-sync**: Auto-sync CEM when component types change

### P2 (Medium) - Nice to Have

5. **declaration-completeness**: Verify `.d.ts` files generated correctly
6. **generic-patterns**: Enforce `PropertyValues<this>`, no `Record<string, any>`

---

## 5 MCP Integrations

### P0 (Critical)

1. **typescript-lsp-mcp**: Real-time type checking during Claude interactions
2. **ts-morph-ast-mcp**: AST-based structural analysis and validation

### P1 (High)

3. **typescript-docs-mcp**: Access to TS docs and utility type reference
4. **cem-query-mcp**: Query CEM for component metadata

### P2 (Medium)

5. **type-coverage-mcp**: Track type coverage percentage over time

---

## Hook Execution Pipeline

```
Pre-commit Trigger
     |
     v
[1] Static Analysis (parallel)
    - no-any-types
    - event-type-safety
    - jsdoc-coverage
    - generic-patterns
     |
     v
[2] Type Check (npm run type-check)
     |
     v
[3] Build Validation
    - declaration-completeness
     |
     v
[4] CEM Sync (auto-fix)
    - cem-type-sync
     |
     v
[5] Tests (npm run test:library)
     |
     v
✅ Commit allowed
```

**Target: <25 seconds total**

---

## MCP-Enhanced Claude Workflow

```
Claude reads file
     |
     v
Query ts-morph-mcp (AST analysis)
     |
     v
Query typescript-lsp-mcp (type info)
     |
     v
Generate code with type safety
     |
     v
Validate against LSP
     |
     v
Write file → Hooks run automatically
     |
     v
Query cem-query-mcp (verify CEM)
```

---

## Key Antipatterns Blocked

| Antipattern                  | Fix                            |
| ---------------------------- | ------------------------------ |
| `any`                        | `unknown` + type guards        |
| `Map<string, unknown>`       | `PropertyValues<this>`         |
| `Record<string, any>`        | Proper interface               |
| `prop!` (non-null assertion) | Optional chaining `?.`         |
| Missing event detail type    | `CustomEvent<DetailInterface>` |
| Missing JSDoc                | Comprehensive documentation    |
| `Function` type              | Explicit signature             |
| Inline event types           | Named interfaces               |

---

## Success Criteria

- Type coverage: 100% (currently 100%)
- `any` types: 0 (currently 0)
- JSDoc coverage: 100% (currently ~80%)
- CEM accuracy: 100% (currently ~95%)
- Hook execution: <25s (target)
- Pre-commit rejection: <5% (after training)

---

## 6-Week Rollout

- **Week 1-2**: Core hooks (no-any, event-safety)
- **Week 3-4**: Remaining hooks (JSDoc, CEM, declarations)
- **Week 5**: MCP servers (LSP, ts-morph, docs, CEM)
- **Week 6**: Integration, testing, optimization

---

## Quick Start (After Implementation)

### For Developers

```bash
# Hooks run automatically on commit
git commit -m "feat: add component"

# Skip hooks in emergency (MUST fix after)
git commit --no-verify -m "hotfix"

# Check type coverage
npm run hooks:type-coverage
```

### For Claude Code

```typescript
// Claude automatically uses MCP for type checking
// No action needed - works out of the box

// Query component structure
await mcp.callTool('ts-morph', 'analyze_component', { filePath });

// Validate types before writing
await mcp.callTool('typescript-lsp', 'hover', { file, line, column });
```

---

## Configuration Files

- Hooks: `/Volumes/Development/wc-2026/scripts/hooks/`
- MCP servers: `/Volumes/Development/wc-2026/.mcp/servers/`
- MCP config: `/Volumes/Development/wc-2026/.mcp/config.json`
- Hook config: `/Volumes/Development/wc-2026/scripts/hooks/config.ts`

---

## Support

- Documentation: `/docs/typescript-automation-proposal.md`
- Slack: `#typescript-help`
- Owner: TypeScript Specialist
- Office Hours: Tuesdays 2-4pm

---

**Full Proposal:** See `/docs/typescript-automation-proposal.md`
