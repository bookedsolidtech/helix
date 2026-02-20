# TypeScript Automation Architecture

Visual architecture diagrams for TypeScript strict mode enforcement system.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         wc-2026 Monorepo                            │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  packages/       │  │  apps/           │  │  scripts/        │ │
│  │  hx-library/     │  │  docs/           │  │  hooks/          │ │
│  │  (TypeScript)    │  │  storybook/      │  │  (Validation)    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │       Developer Commits Changes           │
        │       git commit -m "feat: ..."           │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Husky Pre-Commit Hook                          │
│                      (.husky/pre-commit)                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │     Stage 1: Format & Lint                │
        │     lint-staged (Prettier, ESLint)        │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│               Stage 2: TypeScript Hooks (Parallel)                  │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ no-any-types   │  │ event-type-    │  │ jsdoc-coverage │       │
│  │                │  │ safety         │  │                │       │
│  │ Blocks: any    │  │ Blocks:        │  │ Warns: missing │       │
│  │ types          │  │ untyped events │  │ JSDoc          │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐       │
│  │ cem-type-sync  │  │ declaration-   │  │ generic-       │       │
│  │                │  │ completeness   │  │ patterns       │       │
│  │ Auto-fix: CEM  │  │ Blocks: missing│  │ Blocks: bad    │       │
│  │ regeneration   │  │ .d.ts files    │  │ patterns       │       │
│  └────────────────┘  └────────────────┘  └────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │     Stage 3: TypeScript Compiler          │
        │     npm run type-check                    │
        │     (tsc --noEmit)                        │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │     Stage 4: Test Suite                   │
        │     npm run test:library                  │
        │     (Vitest browser mode)                 │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │          ✅ Commit Allowed                │
        │   or  ❌ Commit Blocked (Fix Required)    │
        └───────────────────────────────────────────┘
```

---

## Hook Architecture (Detailed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Individual Hook Architecture                    │
│                     (Example: no-any-types)                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Input: Staged TypeScript Files                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ git diff --cached --name-only --diff-filter=ACM              │   │
│  │ → src/components/hx-button/hx-button.ts                     │   │
│  │ → src/components/hx-card/hx-card.ts                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Cache Check                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Hash files → Check .cache/hooks/no-any-types-{hash}.json    │   │
│  │ If cached and valid → Return cached result                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  AST Parsing (ts-morph)                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ const project = new Project({                                │   │
│  │   tsConfigFilePath: './tsconfig.base.json'                  │   │
│  │ });                                                          │   │
│  │                                                              │   │
│  │ const sourceFile = project.addSourceFileAtPath(file);       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Validation Checks (Parallel)                                       │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ Check 1:         │  │ Check 2:         │  │ Check 3:         │ │
│  │ Explicit 'any'   │  │ Function Type    │  │ Missing Return   │ │
│  │                  │  │                  │  │ Types            │ │
│  │ forEachDescendant│  │ Find "Function"  │  │ getMethods()     │ │
│  │ → AnyKeyword     │  │ TypeReference    │  │ no ReturnTypeNode│ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                     │
│  ┌──────────────────┐                                              │
│  │ Check 4:         │                                              │
│  │ Missing Param    │                                              │
│  │ Types            │                                              │
│  │                  │                                              │
│  │ getParameters()  │                                              │
│  │ no TypeNode      │                                              │
│  └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Approval Check                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ For each violation:                                          │   │
│  │   Check for: // @typescript-specialist-approved: TICKET-123 │   │
│  │   If found → Skip violation                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Severity Filtering                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Critical violations → Block commit                           │   │
│  │ Warning violations → Allow commit, show warnings             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Result                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ {                                                            │   │
│  │   passed: boolean,                                           │   │
│  │   violations: Violation[],                                   │   │
│  │   stats: {                                                   │   │
│  │     filesChecked: 2,                                         │   │
│  │     totalViolations: 0,                                      │   │
│  │     criticalViolations: 0                                    │   │
│  │   }                                                          │   │
│  │ }                                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │ Cache result for future runs              │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │ Exit: 0 (pass) or 1 (fail)                │
        └───────────────────────────────────────────┘
```

---

## MCP Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Claude Code (Main Process)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Task: Modify TypeScript component                           │  │
│  │  File: src/components/hx-button/hx-button.ts                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Step 1: Read existing file               │
        │  (Read tool)                              │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 2: Query ts-morph MCP for AST analysis                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MCP Request:                                                 │  │
│  │  {                                                            │  │
│  │    tool: "ts-morph",                                          │  │
│  │    method: "analyze_component",                               │  │
│  │    args: { filePath: "..." }                                  │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                 ↓                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ts-morph-server.ts (MCP Server)                              │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ const project = new Project();                          │  │  │
│  │  │ const sourceFile = project.addSourceFileAtPath(file);   │  │  │
│  │  │ const classDecl = sourceFile.getClasses()[0];           │  │  │
│  │  │                                                          │  │  │
│  │  │ return {                                                 │  │  │
│  │  │   name: "HelixButton",                                   │  │  │
│  │  │   properties: [...],                                     │  │  │
│  │  │   methods: [...],                                        │  │  │
│  │  │   events: [...]                                          │  │  │
│  │  │ }                                                        │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                 ↓                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MCP Response:                                                │  │
│  │  {                                                            │  │
│  │    name: "HelixButton",                                       │  │
│  │    properties: [                                              │  │
│  │      { name: "variant", type: "'primary' | 'secondary'" },    │  │
│  │      { name: "size", type: "'sm' | 'md' | 'lg'" }            │  │
│  │    ],                                                         │  │
│  │    methods: [                                                 │  │
│  │      { name: "_handleClick", returnType: "void" }            │  │
│  │    ]                                                          │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Step 3: Query typescript-lsp MCP         │
        │  for type information at cursor           │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  typescript-language-server (stdio)                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Request: textDocument/hover                                  │  │
│  │  Position: { line: 42, character: 10 }                        │  │
│  │                                                               │  │
│  │  Response:                                                    │  │
│  │  {                                                            │  │
│  │    contents: {                                                │  │
│  │      kind: "markdown",                                        │  │
│  │      value: "(property) variant: 'primary' | 'secondary'"     │  │
│  │    }                                                          │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Step 4: Generate new code with           │
        │  type-safe modifications                  │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 5: Validate before writing                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MCP Request:                                                 │  │
│  │  {                                                            │  │
│  │    tool: "ts-morph",                                          │  │
│  │    method: "validate_types",                                  │  │
│  │    args: { filePath: "..." }                                  │  │
│  │  }                                                            │  │
│  │                                                               │  │
│  │  Response:                                                    │  │
│  │  {                                                            │  │
│  │    diagnostics: []  // No errors!                            │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Step 6: Write file (Edit tool)           │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  Step 7: Git hooks run automatically      │
        │  (All 6 TypeScript hooks)                 │
        └───────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Step 8: Query CEM MCP to verify component metadata                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MCP Request:                                                 │  │
│  │  {                                                            │  │
│  │    tool: "cem-query",                                         │  │
│  │    method: "get_component",                                   │  │
│  │    args: { tagName: "hx-button" }                             │  │
│  │  }                                                            │  │
│  │                                                               │  │
│  │  Response:                                                    │  │
│  │  {                                                            │  │
│  │    tagName: "hx-button",                                      │  │
│  │    className: "HelixButton",                                  │  │
│  │    properties: [...],                                         │  │
│  │    events: [...]                                              │  │
│  │  }                                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │  ✅ Task complete with type safety        │
        │  guaranteed at every step                 │
        └───────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────┐
│  Developer   │
│  Workflow    │
└──────┬───────┘
       │
       │ (1) Edit TypeScript file
       ↓
┌──────────────────────┐
│  IDE / Editor        │
│  (VS Code)           │
└──────┬───────────────┘
       │
       │ (2) Save file
       ↓
┌──────────────────────┐
│  File System         │
│  (Staged changes)    │
└──────┬───────────────┘
       │
       │ (3) git commit
       ↓
┌──────────────────────────────────┐
│  Husky Hook Trigger              │
│  .husky/pre-commit               │
└──────┬───────────────────────────┘
       │
       │ (4) Execute hooks
       ↓
┌────────────────────────────────────────────────────┐
│  TypeScript Hooks (6 hooks)                        │
│                                                    │
│  Each hook:                                        │
│  ┌────────────────────────────────────────────┐   │
│  │ 1. Read staged files                       │   │
│  │ 2. Parse with ts-morph                     │   │
│  │ 3. Run validation checks                   │   │
│  │ 4. Collect violations                      │   │
│  │ 5. Return pass/fail                        │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Data structures:                                  │
│  ┌────────────────────────────────────────────┐   │
│  │ interface Violation {                      │   │
│  │   file: string;                            │   │
│  │   line: number;                            │   │
│  │   message: string;                         │   │
│  │   suggestion: string;                      │   │
│  │ }                                          │   │
│  │                                            │   │
│  │ interface ValidationResult {               │   │
│  │   passed: boolean;                         │   │
│  │   violations: Violation[];                 │   │
│  │   stats: Record<string, number>;           │   │
│  │ }                                          │   │
│  └────────────────────────────────────────────┘   │
└────────┬───────────────────────────────────────────┘
         │
         │ (5) All hooks pass
         ↓
┌──────────────────────┐
│  npm run type-check  │
│  (tsc --noEmit)      │
└──────┬───────────────┘
       │
       │ (6) Types valid
       ↓
┌──────────────────────┐
│  npm run test        │
│  (Vitest)            │
└──────┬───────────────┘
       │
       │ (7) Tests pass
       ↓
┌──────────────────────┐
│  Commit Created      │
│  ✅ Quality Gate     │
└──────┬───────────────┘
       │
       │ (8) Push to remote
       ↓
┌──────────────────────┐
│  CI/CD Pipeline      │
│  (Re-run all checks) │
└──────────────────────┘
```

---

## Component Type Safety Flow

```
┌─────────────────────────────────────────────────────────────┐
│  TypeScript Component Source                                │
│  src/components/hx-button/hx-button.ts                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ @customElement('hx-button')                         │    │
│  │ export class HelixButton extends LitElement {       │    │
│  │   @property() variant: 'primary' | 'secondary';     │    │
│  │   private _handleClick(e: MouseEvent): void { ... } │    │
│  │ }                                                   │    │
│  │                                                     │    │
│  │ declare global {                                    │    │
│  │   interface HTMLElementTagNameMap {                 │    │
│  │     'hx-button': HelixButton;                       │    │
│  │   }                                                 │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  TypeScript Compiler (tsc)          │
        │  + vite-plugin-dts                  │
        └─────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Declaration File Output                                    │
│  dist/components/hx-button/hx-button.d.ts                   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ export declare class HelixButton extends LitElement{│    │
│  │   variant: 'primary' | 'secondary';                 │    │
│  │   private _handleClick;                             │    │
│  │   render(): TemplateResult<1>;                      │    │
│  │ }                                                   │    │
│  │                                                     │    │
│  │ declare global {                                    │    │
│  │   interface HTMLElementTagNameMap {                 │    │
│  │     'hx-button': HelixButton;                       │    │
│  │   }                                                 │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  Custom Elements Manifest Analyzer  │
        │  (CEM CLI)                          │
        └─────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Custom Elements Manifest                                   │
│  custom-elements.json                                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "modules": [{                                     │    │
│  │     "path": "src/components/hx-button/...",         │    │
│  │     "declarations": [{                              │    │
│  │       "kind": "class",                              │    │
│  │       "name": "HelixButton",                        │    │
│  │       "tagName": "hx-button",                       │    │
│  │       "members": [{                                 │    │
│  │         "name": "variant",                          │    │
│  │         "type": { "text": "'primary'|'secondary'" } │    │
│  │       }],                                           │    │
│  │       "events": [...]                               │    │
│  │     }]                                              │    │
│  │   }]                                                │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  TypeScript Hooks Validation        │
        │  (cem-type-sync)                    │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  Compare:                           │
        │  - TS source types                  │
        │  - Declaration file types           │
        │  - CEM types                        │
        │                                     │
        │  Ensure consistency across all 3    │
        └─────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │  Consumers (Storybook, Docs, Drupal)│
        │  Use type-safe component            │
        └─────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Consumer TypeScript Code                                   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ const button = document.querySelector('hx-button'); │    │
│  │ // TypeScript knows: button is HelixButton | null  │    │
│  │                                                     │    │
│  │ if (button) {                                       │    │
│  │   button.variant = 'primary'; // ✅ Type-safe       │    │
│  │   button.variant = 'invalid'; // ❌ Type error     │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance & Caching

```
┌─────────────────────────────────────────────────────────────┐
│  Hook Execution with Caching                                │
└─────────────────────────────────────────────────────────────┘

Pre-commit triggered
        ↓
Get staged files
        ↓
┌──────────────────────┐
│ Hash staged files    │
│ SHA256(file contents)│
│ → abc123def          │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Check cache                      │
│ .cache/hooks/no-any-abc123def.json│
└──────┬───────────────────────────┘
       │
       ├─ Cache hit (80% of commits)
       │     ↓
       │  Return cached result (0.1s)
       │     ↓
       │  Skip analysis
       │
       └─ Cache miss (20% of commits)
             ↓
       Run full analysis (2s)
             ↓
       Cache result for next time
             ↓
       Return result

Performance Impact:
- Without cache: ~2s per hook × 6 = 12s
- With cache: ~0.1s per hook × 6 = 0.6s
- Speedup: 20x faster for unchanged files
```

---

## Error Handling & Recovery

```
┌─────────────────────────────────────────────────────────────┐
│  Hook Failure Handling                                      │
└─────────────────────────────────────────────────────────────┘

Hook execution
        ↓
Try {
  Run validation
}
        ↓
┌──────────────────────────────────────┐
│ Success                              │
│ ├─ No violations                     │
│ │    → Exit 0 (pass)                 │
│ ├─ Warnings only                     │
│ │    → Show warnings, Exit 0 (pass)  │
│ └─ Critical violations               │
│      → Exit 1 (fail)                 │
└──────────────────────────────────────┘

Catch (error) {
        ↓
┌──────────────────────────────────────┐
│ Error Types                          │
├──────────────────────────────────────┤
│ 1. Parse error (invalid TypeScript)  │
│    → Show error, suggest fix         │
│    → Exit 1                          │
├──────────────────────────────────────┤
│ 2. Timeout (hook > 60s)              │
│    → Show warning                    │
│    → Skip hook, Exit 0               │
├──────────────────────────────────────┤
│ 3. ts-morph crash                    │
│    → Log error                       │
│    → Skip hook, Exit 0               │
├──────────────────────────────────────┤
│ 4. Out of memory                     │
│    → Clear cache, retry once         │
│    → If still fails, Skip hook       │
└──────────────────────────────────────┘
}

Finally {
  Log metrics to .cache/hooks/metrics.json
  Clean up temporary files
}
```

---

**Last Updated**: 2026-02-20
**Maintainer**: TypeScript Specialist
