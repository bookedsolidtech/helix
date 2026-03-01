# Helix MCP Servers

Helix ships three custom MCP servers in `apps/mcp-servers/`. Agents should use these tools to query component health and CEM accuracy **before and after** any component changes.

## Prerequisites

Servers must be built before use:

```bash
npm run build:mcp-servers
```

To verify servers are built and ready:

```bash
npm run mcp:health
```

---

## health-scorer

**Purpose:** Comprehensive component health scoring across 17 dimensions.

### Tools

| Tool | Description | Required Args |
|------|-------------|---------------|
| `scoreComponent` | Get health score for a single component | `tagName` (e.g. `hx-button`) |
| `scoreAllComponents` | Health scores for all library components | — |
| `getHealthTrend` | Historical health trend over N days | `tagName`, `days` (default: 7) |
| `getHealthDiff` | Compare health between current branch and base | `tagName`, `baseBranch` (default: `main`) |

### When to Use

- **Before changing a component:** Run `scoreComponent` to establish a baseline score
- **After changing a component:** Run `scoreComponent` again and compare — no regressions allowed
- **Before opening a PR:** Run `getHealthDiff` to confirm health improved or held steady
- **Board/triage work:** Run `scoreAllComponents` to identify lowest-scoring components

---

## cem-analyzer

**Purpose:** Analyze and validate Custom Elements Manifest (CEM) accuracy.

### Tools

| Tool | Description | Required Args |
|------|-------------|---------------|
| `analyzeCEM` | Full CEM analysis for a component | `tagName` |
| `diffCEM` | Detect breaking changes vs base branch | `tagName`, `baseBranch` (default: `main`) |
| `listComponents` | List all registered components | — |
| `validateCEMCompleteness` | Validate properties/events/slots/parts are documented | `tagName` |

### When to Use

- **After adding/changing a component:** Run `validateCEMCompleteness` to ensure all public API is documented
- **Before merging a PR:** Run `diffCEM` to detect any breaking API changes
- **After running `npm run cem`:** Run `analyzeCEM` to confirm output is accurate

---

## typescript-diagnostics

**Purpose:** TypeScript strict-mode diagnostics and quick-fix suggestions.

### Tools

| Tool | Description | Required Args |
|------|-------------|---------------|
| `getDiagnostics` | TS errors for a file or entire project | `filePath` (optional) |
| `getDiagnosticsForComponent` | TS errors for a specific component | `tagName` |
| `suggestFix` | Quick-fix suggestion for an error at a line | `filePath`, `line` |
| `getStrictModeStatus` | Check TS strict mode config | — |

### When to Use

- **Before committing:** Run `getDiagnostics` to catch type errors early
- **When implementing a component:** Run `getDiagnosticsForComponent` to validate zero errors
- **When fixing a type error:** Run `suggestFix` for targeted recommendations

---

## Agent Workflow Checklist

When working on any component, follow this sequence:

```
1. scoreComponent(tagName)           → record baseline health score
2. [make changes]
3. getDiagnosticsForComponent(tagName) → zero TS errors required
4. validateCEMCompleteness(tagName)  → CEM must be complete
5. scoreComponent(tagName)           → score must not regress
6. diffCEM(tagName)                  → no unintentional breaking changes
7. getHealthDiff(tagName)            → confirm improvement or stable
```
