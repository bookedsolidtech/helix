# Panopticon Vision Document

> **Universal Web Component Library Intelligence Platform**
> Audit Date: 2026-03-09 | Branch: feature/audit-panopticon-admin-dashboard

---

## 1. Current State Inventory

### 1.1 Admin Dashboard Pages (9 routes)

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Dashboard home | Health scores, library stats |
| `/health` | Health Center — 17-dimension scoring | `scoreAllComponents()`, health snapshots |
| `/components` | Component browser with cards | `getManifestStats()`, health scores, test results |
| `/components/[tag]` | Single component detail | CEM parser, health scorer, tests |
| `/tests` | Verification Suite — test runner UI | `getAllTestResults()`, `getTestCount()` |
| `/tokens` | Design Tokens dashboard | `@helix/tokens` package |
| `/roadmap` | Issue Tracker | `.claude/issues/` filesystem |
| `/audit/[id]` | Single audit report detail | Audit aggregation |
| `/hooks` | Hooks & MCP infrastructure roadmap | Static data (`hooks-data.ts`) |
| `/mcp` | MCP Server health & status | MCP client calls |
| `/integration-test` | Component integration testing | Built component imports |

### 1.2 Analyzers & Scorers (17 analyzers + 5 infrastructure)

#### Core Infrastructure

| File | Purpose | Generic? |
|------|---------|----------|
| `cem-parser.ts` | Reads Custom Elements Manifest JSON | **No** — hardcoded path to `packages/hx-library/custom-elements.json` |
| `cem-validator.ts` | Validates CEM field completeness | Yes — works with any CEM |
| `health-scorer.ts` | Orchestrates 17 dimensions, weighted scoring, enterprise grade gates (A-F) | **No** — Lit/HELIX-specific orchestration, hardcoded paths |
| `health-history-reader.ts` / `writer.ts` | Time-series health snapshots (30-day rolling) | Yes — generic snapshot format |
| `audit-report.ts` | Aggregates results into unified audit (A-F grading) | Yes — works with any audit data |

#### Static Analyzers (14)

| Analyzer | Dimension | Confidence | Generic? |
|----------|-----------|------------|----------|
| `jsdoc-analyzer.ts` | API Documentation | Heuristic | **No** — Lit JSDoc patterns (`@attr`, `@fires`, `@slot`) |
| `type-safety-analyzer.ts` | Type Safety | Heuristic | Yes — any TypeScript |
| `a11y-analyzer.ts` | Accessibility | Heuristic/Verified | Yes — WCAG 2.1 AA checks |
| `bundle-analyzer.ts` | Bundle Size | Verified | Yes — any gzipped output |
| `token-compliance-analyzer.ts` | Token Compliance | Heuristic | **No** — checks `--hx-*` prefix |
| `story-coverage-analyzer.ts` | Story Coverage | Heuristic | Yes — any `.stories.ts` |
| `drupal-readiness-analyzer.ts` | CMS Readiness | Heuristic | Yes — web component CMS compatibility |
| `vrt-analyzer.ts` | Visual Regression | Verified | Yes — generic VRT pattern |
| `code-quality-analyzer.ts` | Code Quality | Heuristic | Yes — any TypeScript |
| `lit-best-practices-analyzer.ts` | Framework Practices | Heuristic | **No** — Lit 3.x specific |
| `security-analyzer.ts` | Security | Heuristic | Yes — any JavaScript |
| `maintainability-analyzer.ts` | Maintainability | Heuristic | Yes — any codebase |
| `dx-analyzer.ts` | Developer Experience | Heuristic | Yes — generic DX checks |
| `test-results-reader.ts` | Test Coverage | Verified | Yes — Vitest JSON + V8 coverage |

#### Data Readers & Utilities

| File | Purpose |
|------|---------|
| `library-registry.ts` | Multi-library CRUD (local, CDN, npm sources) — **already designed for multi-library** |
| `mcp-client.ts` | JSON-RPC 2.0 client for wc-tools subprocess |
| `mcp-constants.ts` | MCP environment setup |
| `mcp-health-writer.ts` | Health snapshot persistence via MCP |
| `mcp-probe.ts` | MCP server health check |
| `issues-loader.ts` | Roadmap issues from filesystem |
| `hooks-data.ts` | Static roadmap data |
| `snippet-generator.ts` | Code snippet generation |
| `syntax-highlighter.ts` | Code display (shiki) |
| `env.ts` | Environment URL helpers |

### 1.3 wc-tools MCP Server (35 tools)

**External server** at `/Volumes/Development/booked/wc-tools/` — the primary MCP integration.

| Category | Tools | Count |
|----------|-------|-------|
| Discovery | `list_components`, `find_component`, `get_library_summary`, `list_events`, `list_slots`, `list_css_parts` | 6 |
| Inspection | `get_component`, `validate_cem`, `suggest_usage`, `generate_import`, `get_component_narrative`, `get_prop_constraints`, `find_components_by_token`, `find_components_using_token`, `get_component_dependencies`, `validate_usage`, `analyze_accessibility` | 11 |
| Health | `score_component`, `score_all_components`, `get_health_trend`, `get_health_diff`, `check_breaking_changes`, `diff_cem` | 6 |
| Composition | `get_composition_example` | 1 |
| Framework | `detect_framework`, `get_design_tokens`, `find_token` | 3 |
| Bundle | `estimate_bundle_size`, `benchmark_libraries` | 2 |
| Docs | `generate_story`, `resolve_cdn_cem` | 2 |
| Validation | `validate_usage`, `validate_cem` | 2 |
| TypeScript | `get_file_diagnostics`, `get_project_diagnostics` | 2 |

### 1.4 Internal MCP Servers (14 tools across 3 servers)

Located at `apps/mcp-servers/` — newer, lighter-weight alternatives:

| Server | Tools |
|--------|-------|
| `cem-analyzer` | `analyzeCEM`, `diffCEM`, `listComponents`, `validateCEMCompleteness` |
| `health-scorer` | `scoreComponent`, `scoreAllComponents`, `getHealthTrend`, `getHealthDiff` |
| `typescript-diagnostics` | `getDiagnostics`, `getDiagnosticsForComponent`, `suggestFix`, `getStrictModeStatus` |
| `shared` | Git ops, file I/O, validation, path security |

---

## 2. Coupling Analysis

### 2.1 HELiX-Specific Code (Must Change for Universal)

| Component | Coupling Point | Required Change |
|-----------|---------------|-----------------|
| `cem-parser.ts` | Hardcoded path: `../../packages/hx-library/custom-elements.json` | Accept `cemPath` parameter from library registry |
| `health-scorer.ts` | Hardcoded component dir: `../../packages/hx-library/src/components/hx-*` | Accept `sourceRoot` + `componentPrefix` from registry |
| `token-compliance-analyzer.ts` | Checks `--hx-*` token prefix | Accept `tokenPrefix` parameter (e.g., `--sl-`, `--mwc-`) |
| `lit-best-practices-analyzer.ts` | Lit 3.x decorators, reactive patterns | Make framework-specific — detect framework first, run matching analyzer |
| `jsdoc-analyzer.ts` | Lit JSDoc conventions (`@attr`, `@fires`, `@slot`) | These are CEM conventions, not Lit-only — mostly generic already |
| `env.ts` | `HELIX_DOCS_URL`, `HELIX_STORYBOOK_URL` | Per-library URL configuration |
| Layout/metadata | "HELIX Component Library" branding | White-label theming |
| `hooks-data.ts` | HELIX-specific roadmap data | Remove or make per-project |

### 2.2 Already Generic Code (Works Today)

| Component | Why Generic |
|-----------|------------|
| `cem-validator.ts` | Validates any CEM JSON structure |
| `a11y-analyzer.ts` | WCAG 2.1 AA — framework-agnostic |
| `bundle-analyzer.ts` | Reads gzip size of any built component |
| `type-safety-analyzer.ts` | Any TypeScript codebase |
| `security-analyzer.ts` | Any JavaScript — innerHTML, eval, CSP |
| `code-quality-analyzer.ts` | Cyclomatic complexity, duplication — language-agnostic |
| `maintainability-analyzer.ts` | File size, test ratio, separation of concerns |
| `dx-analyzer.ts` | Intellisense, error messages, rebuild time |
| `story-coverage-analyzer.ts` | Any `.stories.ts` file |
| `drupal-readiness-analyzer.ts` | Any web component — self-registration, composed events |
| `vrt-analyzer.ts` | Any Playwright screenshot baseline |
| `audit-report.ts` | Aggregation — takes any health results |
| `library-registry.ts` | **Already multi-library** — local, CDN, npm sources |
| `mcp-client.ts` | JSON-RPC 2.0 — protocol-agnostic |

### 2.3 Coupling Score

```
Total analyzers:          17
Already generic:          13  (76%)
Need parameterization:     3  (18%) — cem-parser, health-scorer, token-compliance
Framework-specific:        1  (6%)  — lit-best-practices

Infrastructure files:     ~10
Already generic:            6  (60%)
Need parameterization:      3  (30%) — env, layout, hooks-data
HELiX-only:                1  (10%) — hooks-data (remove for standalone)
```

**Assessment: ~75% of the codebase is already library-agnostic.** The remaining 25% requires parameterization, not rewriting.

---

## 3. Universal Scanner Architecture

### 3.1 Core Principle

> Point Panopticon at any directory containing `custom-elements.json` and get full health scoring, competitive analysis, and actionable recommendations.

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Panopticon Platform                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Health   │  │Component │  │Comparison│  │ Tokens  │ │
│  │  Center   │  │ Browser  │  │  Charts  │  │Dashboard│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │             │              │       │
│  ┌────┴──────────────┴─────────────┴──────────────┴────┐ │
│  │              Unified Scoring Engine                   │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │          Library Registry (multi)            │    │ │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐          │    │ │
│  │  │  │ HELIX  │ │Shoelace│ │Spectrum│ ...       │    │ │
│  │  │  │ local  │ │  CDN   │ │  npm   │          │    │ │
│  │  │  └───┬────┘ └───┬────┘ └───┬────┘          │    │ │
│  │  └──────┼──────────┼──────────┼────────────────┘    │ │
│  │         │          │          │                      │ │
│  │  ┌──────┴──────────┴──────────┴───────────────┐     │ │
│  │  │           CEM Parser (parameterized)        │     │ │
│  │  │  cemPath → parse → ComponentData[]          │     │ │
│  │  └──────────────────┬─────────────────────────┘     │ │
│  │                     │                                │ │
│  │  ┌──────────────────┴─────────────────────────┐     │ │
│  │  │        Analyzer Pipeline (pluggable)        │     │ │
│  │  │                                             │     │ │
│  │  │  ┌─────────┐ ┌─────────┐ ┌──────────────┐ │     │ │
│  │  │  │ Generic │ │Framework│ │  CMS-Specific │ │     │ │
│  │  │  │Analyzers│ │Analyzers│ │  Analyzers    │ │     │ │
│  │  │  │(13)     │ │(detect) │ │  (optional)   │ │     │ │
│  │  │  └─────────┘ └─────────┘ └──────────────┘ │     │ │
│  │  └────────────────────────────────────────────┘     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              MCP Layer (wc-tools)                    │ │
│  │  35 tools — AI agent interface to all analysis       │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow

```
Input Sources                    Analysis Pipeline              Output
─────────────                    ─────────────────              ──────

┌──────────────┐
│ Local CEM    │──┐
│ (filesystem) │  │
└──────────────┘  │   ┌─────────────────┐   ┌────────────────┐
                  ├──▶│ Library Registry │──▶│  CEM Parser    │
┌──────────────┐  │   │ (multi-library)  │   │ (parameterized)│
│ CDN CEM      │──┤   └─────────────────┘   └───────┬────────┘
│ (jsDelivr)   │  │                                  │
└──────────────┘  │                                  ▼
                  │                          ┌────────────────┐
┌──────────────┐  │                          │  Framework     │
│ NPM CEM      │──┘                          │  Detection     │
│ (registry)   │                             └───────┬────────┘
└──────────────┘                                     │
                                                     ▼
┌──────────────┐                             ┌────────────────┐
│ Source files  │────────────────────────────▶│  Analyzer      │
│ (optional)   │                             │  Pipeline      │──▶ Health Score
└──────────────┘                             │  (17 dims)     │──▶ Grade (A-F)
                                             └───────┬────────┘──▶ Sub-metrics
┌──────────────┐                                     │         ──▶ Recommendations
│ Test results  │────────────────────────────────────┘
│ (optional)    │
└──────────────┘
```

### 3.4 Analyzer Tiers

**Tier 1 — CEM-Only (works with any library, no source access needed):**
- CEM validation & completeness
- API documentation scoring
- Component discovery & metadata
- Bundle size estimation (from CEM or built output)
- Event/slot/CSS part inventory

**Tier 2 — CEM + Source (needs filesystem access):**
- Type safety analysis
- Code quality (complexity, duplication)
- Security scanning
- Maintainability metrics
- Story coverage
- Token compliance

**Tier 3 — CEM + Source + Test Results (full local setup):**
- Test coverage (Vitest/Jest JSON)
- VRT baselines
- Accessibility (axe-core runtime)
- Health trend history

**Tier 4 — Framework-Specific (detected automatically):**
- Lit best practices (if Lit detected)
- Stencil best practices (if Stencil detected)
- FASTElement patterns (if FAST detected)
- Vanilla CE patterns (fallback)

---

## 4. Competitive Analysis Mode

### 4.1 Multi-Library Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  Competitive Analysis: HELIX vs Shoelace vs Spectrum    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Overall Health Score                                    │
│  ┌──────────┬──────────┬──────────┐                     │
│  │ HELIX    │ Shoelace │ Spectrum │                     │
│  │  B+ (82) │  A- (88) │  B (78)  │                     │
│  └──────────┴──────────┴──────────┘                     │
│                                                          │
│  Dimension Comparison (radar chart)                      │
│                                                          │
│         CEM Completeness                                 │
│              100│                                        │
│          ╱─────┼─────╲                                   │
│    A11y ╱      │      ╲ Bundle                           │
│        ╱   ╱───┼───╲   ╲                                │
│       │  ╱     │     ╲  │                                │
│  ─────┼─┤──────┼──────├─┼─────                          │
│       │  ╲     │     ╱  │                                │
│    DX  ╲   ╲───┼───╱   ╱ Types                          │
│         ╲      │      ╱                                  │
│          ╲─────┼─────╱                                   │
│           Tests│                                         │
│                                                          │
│  ── HELIX  ─ ─ Shoelace  ··· Spectrum                   │
│                                                          │
│  Component Coverage                                      │
│  ┌─────────────┬───────┬──────────┬──────────┐          │
│  │ Category    │ HELIX │ Shoelace │ Spectrum  │          │
│  ├─────────────┼───────┼──────────┼──────────┤          │
│  │ Buttons     │  3    │    2     │    4     │          │
│  │ Forms       │  8    │   12     │    9     │          │
│  │ Navigation  │  6    │    5     │    7     │          │
│  │ Data Display│  4    │    6     │    5     │          │
│  │ Total       │ 85    │   78     │   62     │          │
│  └─────────────┴───────┴──────────┴──────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Loading External Libraries

```typescript
// CDN — fetch CEM from jsDelivr
await registry.addLibrary({
  name: 'Shoelace',
  source: 'cdn',
  package: '@shoelace-style/shoelace',
  version: '2.19.0',
  prefix: 'sl',
  tokenPrefix: '--sl-'
});

// NPM — resolve from registry
await registry.addLibrary({
  name: 'Spectrum Web Components',
  source: 'npm',
  package: '@spectrum-web-components/bundle',
  prefix: 'sp',
  tokenPrefix: '--spectrum-'
});

// Local — point at a directory
await registry.addLibrary({
  name: 'HELIX',
  source: 'local',
  cemPath: './packages/hx-library/custom-elements.json',
  sourceRoot: './packages/hx-library/src/components',
  prefix: 'hx',
  tokenPrefix: '--hx-'
});
```

### 4.3 What wc-tools Already Supports

The `resolve_cdn_cem` tool already fetches CEM from jsDelivr/UNPKG. The `benchmark_libraries` tool already compares bundle sizes across libraries. The `library-registry.ts` already supports local/CDN/npm sources with per-library prefixes.

**What's missing for full competitive analysis:**
1. Multi-library health scoring in the UI (only single-library today)
2. Side-by-side radar charts
3. Component category mapping across libraries (sl-button ↔ hx-button)
4. Persistent comparison sessions
5. Export/share comparison reports

---

## 5. Standalone Packaging Plan

### 5.1 Current Monorepo Dependencies

```
@helix/admin depends on:
├── @helix/library (workspace:*)  — only for integration-test page
├── @helix/tokens (workspace:*)   — only for tokens page
├── next (^15.3.3)                — framework
├── react (^19.1.0)               — UI
├── recharts (^2.15.3)            — charts
├── lucide-react (^0.511.0)       — icons
├── shiki (^3.22.0)               — syntax highlighting
└── tailwindcss                    — styling
```

### 5.2 Extraction Strategy

**Phase 1 — Decouple (in-monorepo)**
1. Remove `@helix/library` dependency — integration-test page becomes optional
2. Remove `@helix/tokens` dependency — tokens page reads from CEM or token JSON file
3. Parameterize all hardcoded paths via `library-registry.ts`
4. Replace HELIX branding with white-label theming (CSS custom properties)

**Phase 2 — Extract Core**
```
@panopticon/core                  # Analyzers, scorer, CEM parser
├── src/analyzers/                # All 14 static analyzers
├── src/scoring/                  # Health scorer + grade gates
├── src/cem/                      # CEM parser + validator
├── src/registry/                 # Multi-library registry
└── src/types/                    # Shared TypeScript types
```

**Phase 3 — Extract App**
```
@panopticon/dashboard             # Next.js admin app
├── depends on @panopticon/core
├── src/app/                      # Pages (health, components, comparison)
├── src/components/               # React UI components
└── src/lib/                      # Thin wrappers around core
```

**Phase 4 — Extract MCP**
```
@panopticon/mcp                   # MCP server (wc-tools evolution)
├── depends on @panopticon/core
├── src/tools/                    # 35 MCP tools
└── src/handlers/                 # Tool implementations
```

### 5.3 Package Architecture

```
@panopticon/
├── core          # Zero-dependency analysis engine (npm publishable)
├── dashboard     # Next.js app (standalone or embedded)
├── mcp           # MCP server for AI agent integration
├── cli           # CLI tool: `npx panopticon scan ./my-library`
└── github-action # CI integration: score on every PR
```

### 5.4 Distribution Modes

| Mode | Use Case | How |
|------|----------|-----|
| **CLI** | Quick scan from terminal | `npx @panopticon/cli scan --cem ./custom-elements.json` |
| **Dashboard** | Full UI with trends | `npx @panopticon/dashboard` (starts Next.js on port 3159) |
| **MCP** | AI agent integration | Configure in `.mcp.json` — 35 tools available |
| **GitHub Action** | PR quality gate | Comment health score on every PR |
| **Embedded** | Inside existing admin | `import { scoreComponent } from '@panopticon/core'` |

---

## 6. Data Model Evolution

### 6.1 Current `library-registry.ts`

Already supports multi-library with this shape:
```typescript
interface LibraryConfig {
  id: string;
  name: string;
  source: 'local' | 'cdn' | 'npm';
  cemPath?: string;       // local
  package?: string;       // cdn/npm
  version?: string;       // cdn/npm
  prefix: string;         // tag prefix (hx, sl, mwc)
  tokenPrefix?: string;   // CSS token prefix (--hx-, --sl-)
  isDefault?: boolean;
}
```

### 6.2 Required Evolution

```typescript
interface LibraryConfig {
  // Existing fields (keep)
  id: string;
  name: string;
  source: 'local' | 'cdn' | 'npm';
  cemPath?: string;
  package?: string;
  version?: string;
  prefix: string;
  tokenPrefix?: string;
  isDefault?: boolean;

  // New fields for universal scanning
  sourceRoot?: string;          // Path to component source (enables Tier 2 analysis)
  testResultsPath?: string;     // Path to test JSON (enables Tier 3 analysis)
  coveragePath?: string;        // Path to coverage JSON
  storybookPath?: string;       // Path to stories directory
  framework?: 'lit' | 'stencil' | 'fast' | 'vanilla' | 'auto';  // Auto-detected
  buildOutputPath?: string;     // For verified bundle analysis
  healthSnapshotDir?: string;   // Per-library trend storage

  // Comparison metadata
  categories?: Record<string, string[]>;  // { "Buttons": ["hx-button"], "Forms": ["hx-text-input"] }
  componentMapping?: Record<string, string>;  // Map to canonical names for cross-library comparison
}
```

### 6.3 Pluggable Analyzer Interface

```typescript
interface Analyzer {
  id: string;
  name: string;
  dimension: string;
  tier: 1 | 2 | 3 | 4;         // What data it needs
  framework?: string;            // null = generic, 'lit' = Lit-only
  analyze(component: ComponentContext): Promise<AnalyzerResult>;
}

interface ComponentContext {
  tagName: string;
  cem: ComponentDeclaration;     // From CEM JSON
  sourceFiles?: string[];        // Tier 2+
  testResults?: TestResult;      // Tier 3+
  coverage?: CoverageData;       // Tier 3+
  library: LibraryConfig;        // Parent library config
}

interface AnalyzerResult {
  score: number;                 // 0-100
  confidence: 'verified' | 'heuristic' | 'untested';
  subMetrics?: Record<string, number>;
  issues?: Issue[];
  recommendations?: string[];
}
```

---

## 7. MCP Integration

### 7.1 What wc-tools Already Enables

wc-tools (35 tools) already provides the full AI agent interface:
- **Discovery**: List, find, and browse components from any CEM
- **Scoring**: 17-dimension health analysis with grades
- **Comparison**: `benchmark_libraries`, `diff_cem`, `get_health_diff`
- **CDN Loading**: `resolve_cdn_cem` fetches CEM from jsDelivr/UNPKG
- **Framework Detection**: `detect_framework` identifies Lit/Stencil/FAST/vanilla

### 7.2 What's Missing for Universal Scanning

| Gap | Current State | Required |
|-----|--------------|----------|
| Multi-library scoring | Single library at a time | `score_across_libraries` tool — run all analyzers on N libraries |
| Component mapping | No cross-library mapping | `map_components` tool — identify equivalent components across libraries |
| Comparative report | No comparison output | `generate_comparison_report` tool — markdown/JSON comparison |
| Library onboarding | Manual config | `onboard_library` tool — auto-detect CEM, framework, prefix, source root |
| Health aggregation | Per-component only | `get_library_health_summary` with breakdowns by category |
| Analyzer plugin | Fixed 17 dimensions | `register_analyzer` — add custom dimensions at runtime |

### 7.3 MCP as the Universal Integration Layer

```
Any AI Agent (Claude, GPT, Gemini, local LLM)
        │
        ▼
   MCP Protocol (JSON-RPC 2.0)
        │
        ▼
   @panopticon/mcp
        │
        ├── Discovery tools (list, find, browse)
        ├── Scoring tools (single, bulk, trend)
        ├── Comparison tools (diff, benchmark, map)
        ├── Documentation tools (narrative, usage, import)
        └── Validation tools (CEM, usage, a11y)
        │
        ▼
   @panopticon/core (analyzer engine)
        │
        ▼
   Any CEM-compliant library
```

---

## 8. Concrete Next Steps

### Immediate (Phase 0 — In-Monorepo Cleanup)

1. **Parameterize `cem-parser.ts`** — Accept `cemPath` from library registry instead of hardcoded path
2. **Parameterize `health-scorer.ts`** — Accept `sourceRoot` and `prefix` from library registry
3. **Parameterize `token-compliance-analyzer.ts`** — Accept `tokenPrefix` parameter
4. **Make `lit-best-practices-analyzer.ts` conditional** — Only run when `detect_framework()` returns `lit`
5. **White-label the layout** — Replace "HELIX" branding with library name from registry

### Short-Term (Phase 1 — Multi-Library UI)

6. **Library picker UI** — Dropdown to switch between registered libraries
7. **Side-by-side comparison page** — `/comparison` route with radar charts
8. **CDN library quick-add** — UI to paste npm package name, auto-fetch CEM
9. **Component category mapping** — UI to group components by function across libraries

### Medium-Term (Phase 2 — Standalone Extract)

10. **Extract `@panopticon/core`** — All analyzers, scorer, CEM parser as independent package
11. **Extract `@panopticon/dashboard`** — Next.js app depending on core
12. **CLI tool** — `npx @panopticon/cli scan` for terminal usage
13. **GitHub Action** — Score components on every PR

### Long-Term (Phase 3 — Ecosystem)

14. **Plugin API** — Third-party analyzers (Angular Elements, Stencil-specific, etc.)
15. **Cloud dashboard** — Hosted version with team accounts, historical trends
16. **CI badge** — `![Health Score](https://panopticon.dev/badge/my-library)`
17. **Marketplace** — Community analyzer plugins

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| CEM format inconsistency across libraries | High — analyzers may break on non-standard CEM | Validate CEM against schema before analysis; graceful degradation per field |
| Source analysis without source access (CDN libraries) | Medium — Tier 2+ analysis unavailable | Clearly communicate Tier 1-only results; don't penalize missing data |
| Framework detection false positives | Low — wrong analyzer applied | Framework detection confidence score; manual override in config |
| Performance with large libraries (200+ components) | Medium — analysis takes minutes | Incremental analysis; cache aggressively; background workers |
| Breaking existing HELIX admin users | High — current team depends on it | Incremental migration; feature flags; maintain backwards compatibility through Phase 1 |

---

## 10. Summary

**Panopticon is 75% ready to be a universal web component intelligence platform.** The analyzer architecture is sound, the multi-library registry already exists, and the MCP integration provides a natural AI agent interface.

The critical path is:
1. **Parameterize 4 files** (cem-parser, health-scorer, token-compliance, lit-best-practices)
2. **Add multi-library UI** (library picker, comparison page)
3. **Extract to standalone packages** (@panopticon/core, dashboard, mcp, cli)

The investment is modest relative to the value: a universal web component quality scanner that works with Shoelace, Spectrum, Lion, Material Web, FAST, or any CEM-compliant library — with 17-dimension health scoring, competitive analysis, and AI agent integration via MCP.
