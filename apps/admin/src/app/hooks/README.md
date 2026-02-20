# Hooks & MCP Servers Dashboard

**Route**: `/hooks`
**Purpose**: Comprehensive visualization of Claude Code hooks and MCP servers proposed by specialist agents

---

## Overview

This dashboard displays the complete automation infrastructure for the wc-2026 monorepo, including:

- **24 unique hooks** organized by priority (P0/P1/P2)
- **15 unique MCP servers** for specialized analysis
- **4-phase implementation roadmap** (8 weeks)
- **Resource allocation** (320 hours across 11 specialists)
- **Success metrics** (12x faster pre-commit, 269% ROI)
- **Risk mitigation strategies**

---

## Data Source

All data is defined in `/apps/admin/src/lib/hooks-data.ts`:

```typescript
import { hooks, mcpServers, phases, metrics, risks } from '@/lib/hooks-data';
```

### Data Structures

#### Hook

```typescript
interface Hook {
  id: string; // H01-H24
  name: string; // e.g., "type-check-strict"
  owner: string; // Specialist agent name
  priority: 'P0' | 'P1' | 'P2';
  purpose: string; // What it does
  workflow: string; // How it executes
  executionBudget: string; // Time budget (e.g., "<5s")
  phase: 1 | 2 | 3 | 4;
  dependencies?: string[]; // Optional hook dependencies
}
```

#### MCP Server

```typescript
interface McpServer {
  id: string; // M01-M15
  name: string; // e.g., "cem-analyzer"
  owner: string; // Specialist agent name
  function: string; // What it provides
  dependencies?: string[]; // Optional server dependencies
  phase: 1 | 2 | 3 | 4;
}
```

---

## Features

### 1. Top-level KPIs

- Total hooks count with P0 breakdown
- Total MCP servers with phase count
- Speedup metric (12x)
- Resource allocation (320 hours)

### 2. Implementation Roadmap Timeline

Visual 4-phase timeline showing:

- Phase name and duration (weeks)
- Focus area description
- Hooks and servers assigned to each phase
- Effort estimate per phase

### 3. Hooks by Priority

Three-column grid showing:

- P0 (Critical Priority) - 10 hooks
- P1 (High Priority) - 12 hooks
- P2 (Standard Priority) - 2 hooks

Each card displays hook ID, name, purpose, owner, phase, and execution budget.

### 4. Interactive Hooks & Servers Tables (Client Component)

Located in `./components/HooksPageClient.tsx`, this provides:

**Filtering**:

- Priority filter (P0/P1/P2)
- Phase filter (1-4)
- Owner filter (dropdown with all specialists)
- Search across name, purpose, ID, and owner

**Tabbed View**:

- Hooks tab with filterable table
- MCP Servers tab with filterable table

**Table Features**:

- Sortable columns
- Color-coded priority badges
- Execution time budgets
- Dependency tracking (for servers)
- Empty state messaging when no results
- Clear filters button

### 5. Success Metrics Card

Displays:

- 12x pre-commit speed improvement
- 269% ROI
- 320 hours total investment
- Breakdown of benefits

### 6. Risk Mitigation Card

Lists 4 identified risks with:

- Risk description
- Mitigation strategy
- Responsible owner

### 7. Hook Workflow Examples

Shows first 6 hooks with detailed workflow explanations.

---

## Design Patterns

### Color Coding

**Priorities**:

- P0 (Critical): Red (`text-red-400`, `border-red-500/30`)
- P1 (High): Amber (`text-amber-400`, `border-amber-500/30`)
- P2 (Standard): Blue (`text-blue-400`, `border-blue-500/30`)

**Components**:

- Hooks: Blue gradient (`text-blue-400`)
- MCP Servers: Purple gradient (`text-purple-400`)

**Metrics**:

- Success/Performance: Emerald (`text-emerald-400`)
- Time budgets: Amber (`text-amber-400`)
- Risks: Red (`text-red-400`)

### Layout

**Grid System**:

- 2/4 column grid for KPIs (responsive)
- 3 column grid for priority cards (responsive to 1 column)
- 2 column grid for metrics/risks (responsive to 1 column)

**Card Style**:

- Glass morphism: `bg-white/[0.02] border border-white/[0.04]`
- Hover transitions: `hover:bg-white/[0.04] transition-colors`
- Accent borders on hover: `hover:border-{color}-500/30`

---

## Adding New Hooks or Servers

1. **Update `/apps/admin/src/lib/hooks-data.ts`**:

```typescript
// Add to hooks array
{
  id: 'H25',
  name: 'new-hook-name',
  owner: 'Owner Name',
  priority: 'P1',
  purpose: 'Description of what this hook does',
  workflow: 'Detailed execution workflow',
  executionBudget: '<5s',
  phase: 2,
  dependencies: ['H01', 'H04']
}

// Or add to mcpServers array
{
  id: 'M16',
  name: 'new-server-name',
  owner: 'Owner Name',
  function: 'Description of server function',
  dependencies: ['M01'],
  phase: 3
}
```

2. **Update phase assignments** in `phases` array if needed

3. The dashboard will automatically pick up the new data

---

## Navigation

The dashboard is accessible via:

- Sidebar link: "Hooks & MCP"
- Direct URL: `http://localhost:3159/hooks`
- Breadcrumb: Home > Hooks & MCP Servers

---

## Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui (Card, Badge, Table)
- **Icons**: Lucide React
- **State**: React useState/useMemo for client filtering
- **TypeScript**: Strict mode with full type safety

---

## Performance Considerations

- Server-side rendering for initial dashboard load
- Client components only for interactive filtering/search
- Memoized filter logic using `useMemo`
- No external API calls (all data is static)

---

## Maintenance

**When to Update**:

- VP Engineering synthesizes new hooks/servers
- Specialist agents propose new automation
- Phase timeline changes
- Resource allocation updates
- Success metrics change

**Files to Update**:

1. `/apps/admin/src/lib/hooks-data.ts` - Core data
2. `/apps/admin/src/app/hooks/page.tsx` - Dashboard layout (if needed)
3. `/apps/admin/src/app/hooks/components/HooksPageClient.tsx` - Filtering logic (if needed)

---

## Future Enhancements

Potential improvements:

- [ ] Hook execution logs and history
- [ ] Real-time hook status (enabled/disabled)
- [ ] Dependency graph visualization
- [ ] Phase progress tracking
- [ ] Integration with CI/CD pipeline metrics
- [ ] Hook performance benchmarks
- [ ] MCP server health monitoring
- [ ] Export to CSV/JSON
- [ ] Printable roadmap view

---

**Last Updated**: 2026-02-20
**Maintainer**: Frontend Specialist
