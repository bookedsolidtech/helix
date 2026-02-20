# TypeScript Strict Mode Enforcement: Claude Code Hooks & MCP Integrations

**Proposal for wc-2026 TypeScript Automation**
**Date:** 2026-02-20
**Status:** Proposal
**Owner:** TypeScript Specialist

---

## Executive Summary

This document proposes a comprehensive TypeScript automation strategy for wc-2026, combining Git hooks, Claude Code integration points, and Model Context Protocol (MCP) servers to enforce strict mode compliance, maintain type safety, and prevent common TypeScript antipatterns from entering the codebase.

**Goal:** Zero-tolerance enforcement of TypeScript strict mode with automated guardrails that catch violations before they reach code review.

**Current State Analysis:**

- TypeScript strict mode enabled with excellent configuration
- No `any` types found in codebase (verified via grep)
- No `@ts-ignore` directives (clean codebase)
- ESLint configured with `typescript-eslint` strict rules
- Pre-commit hooks already validate type-check and tests
- Declaration files generated via `vite-plugin-dts`
- Custom Elements Manifest (CEM) generated but not validated against types

**Gaps Identified:**

1. No automated enforcement of event type safety (`CustomEvent<T>`)
2. No validation that CEM types match TypeScript implementation
3. No JSDoc coverage enforcement on public APIs
4. No automated generic type signature validation
5. No real-time type checking during development (only at commit time)
6. No declaration file completeness verification

---

## 1. Claude Code Git Hooks

### Hook 1.1: `no-any-types` Hook

**Name:** `no-any-types`
**Trigger:** Pre-commit (Git hook)
**Priority:** P0 (Critical)

**Purpose:**
Prevent any `any` types from being committed. Catch implicit `any` from missing type annotations or explicit `any` usage.

**Workflow:**

1. Triggered on `git commit` for staged TypeScript files
2. Run AST-based analysis using `ts-morph` to detect:
   - Explicit `any` type annotations
   - Implicit `any` from missing return types
   - Implicit `any` from missing parameter types
   - `Function` type (equivalent to `any`)
3. Output violations with file path, line number, and suggested fix
4. Block commit if violations found
5. Provide exception mechanism via `// @typescript-specialist-approved: [ticket-number]`

**Implementation:**

```typescript
// scripts/hooks/no-any-types.ts
import { Project, SyntaxKind, ts } from 'ts-morph';

export async function validateNoAnyTypes(stagedFiles: string[]): Promise<ValidationResult> {
  const project = new Project({
    tsConfigFilePath: './tsconfig.base.json',
  });

  const violations: Violation[] = [];

  for (const filePath of stagedFiles.filter((f) => f.endsWith('.ts'))) {
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Check 1: Explicit 'any' type
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.AnyKeyword) {
        const parent = node.getParent();
        if (!hasApprovedComment(parent)) {
          violations.push({
            file: filePath,
            line: node.getStartLineNumber(),
            message: 'Explicit "any" type detected',
            suggestion: 'Use "unknown" and narrow with type guards',
          });
        }
      }
    });

    // Check 2: Missing return types on public methods
    sourceFile.getClasses().forEach((classDecl) => {
      classDecl.getMethods().forEach((method) => {
        if (
          method.hasModifier(SyntaxKind.PublicKeyword) ||
          !method.hasModifier(SyntaxKind.PrivateKeyword)
        ) {
          if (!method.getReturnTypeNode()) {
            violations.push({
              file: filePath,
              line: method.getStartLineNumber(),
              message: `Public method "${method.getName()}" missing return type`,
              suggestion: 'Add explicit return type annotation',
            });
          }
        }
      });
    });

    // Check 3: Function type (equivalent to any)
    sourceFile.forEachDescendant((node) => {
      if (node.getText() === 'Function') {
        violations.push({
          file: filePath,
          line: node.getStartLineNumber(),
          message: '"Function" type is equivalent to "any"',
          suggestion: 'Use specific function signature: (args) => ReturnType',
        });
      }
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "🔍 Checking for 'any' types..."
npm run hooks:no-any-types
```

---

### Hook 1.2: `event-type-safety` Hook

**Name:** `event-type-safety`
**Trigger:** Pre-commit (Git hook)
**Priority:** P0 (Critical)

**Purpose:**
Enforce that all custom events in components use typed `CustomEvent<T>` with explicit detail interface.

**Workflow:**

1. Triggered on `git commit` for component files
2. Parse component classes for `dispatchEvent` calls
3. Validate that:
   - Event uses `CustomEvent<DetailType>`
   - `DetailType` is defined as an interface
   - `DetailType` is exported for consumer usage
   - Event name matches pattern `hx-[event-name]`
4. Validate JSDoc `@fires` tag matches implementation
5. Block commit if violations found

**Implementation:**

```typescript
// scripts/hooks/event-type-safety.ts
import { Project, SyntaxKind } from 'ts-morph';

interface EventDefinition {
  name: string;
  detailType: string | null;
  line: number;
  hasJSDoc: boolean;
}

export async function validateEventTypeSafety(stagedFiles: string[]): Promise<ValidationResult> {
  const project = new Project({ tsConfigFilePath: './tsconfig.base.json' });
  const violations: Violation[] = [];

  for (const filePath of stagedFiles.filter(
    (f) => f.includes('/components/') && f.endsWith('.ts'),
  )) {
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Find all dispatchEvent calls
    const events: EventDefinition[] = [];
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKindOrThrow(SyntaxKind.CallExpression);
        const expr = callExpr.getExpression().getText();

        if (expr === 'this.dispatchEvent') {
          const args = callExpr.getArguments();
          if (args.length > 0) {
            const eventArg = args[0];
            const eventText = eventArg.getText();

            // Parse CustomEvent<DetailType>
            const customEventMatch = eventText.match(/CustomEvent(?:<([^>]+)>)?/);
            const detailType = customEventMatch?.[1] ?? null;

            // Extract event name
            const eventNameMatch = eventText.match(/['"`]([^'"`]+)['"`]/);
            const eventName = eventNameMatch?.[1] ?? 'unknown';

            events.push({
              name: eventName,
              detailType,
              line: node.getStartLineNumber(),
              hasJSDoc: false, // Will check JSDoc separately
            });

            // Validation 1: Event name must start with 'hx-'
            if (!eventName.startsWith('hx-')) {
              violations.push({
                file: filePath,
                line: node.getStartLineNumber(),
                message: `Event name "${eventName}" must start with "hx-"`,
                suggestion: `Rename to "hx-${eventName}"`,
              });
            }

            // Validation 2: Must have explicit detail type
            if (!detailType) {
              violations.push({
                file: filePath,
                line: node.getStartLineNumber(),
                message: `Event "${eventName}" missing explicit detail type`,
                suggestion: 'Use CustomEvent<DetailInterface> with explicit interface',
              });
            }

            // Validation 3: Detail type must be an interface (not inline)
            if (detailType && detailType.includes('{')) {
              violations.push({
                file: filePath,
                line: node.getStartLineNumber(),
                message: `Event "${eventName}" uses inline type instead of interface`,
                suggestion: 'Extract to named interface (e.g., HelixClickDetail)',
              });
            }
          }
        }
      }
    });

    // Validation 4: Check JSDoc @fires tags match implementation
    const classDecl = sourceFile.getClasses()[0];
    if (classDecl) {
      const jsDocTags = classDecl
        .getJsDocs()
        .flatMap((doc) => doc.getTags())
        .filter((tag) => tag.getTagName() === 'fires');

      const documentedEvents = jsDocTags.map((tag) => {
        const text = tag.getCommentText();
        const match = text?.toString().match(/['"`]?([a-z-]+)['"`]?/);
        return match?.[1] ?? '';
      });

      events.forEach((event) => {
        if (!documentedEvents.includes(event.name)) {
          violations.push({
            file: filePath,
            line: event.line,
            message: `Event "${event.name}" missing JSDoc @fires tag`,
            suggestion: `Add @fires {CustomEvent<DetailType>} ${event.name} - Description`,
          });
        }
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "🎯 Validating event type safety..."
npm run hooks:event-type-safety
```

---

### Hook 1.3: `jsdoc-coverage` Hook

**Name:** `jsdoc-coverage`
**Trigger:** Pre-commit (Git hook)
**Priority:** P1 (High)

**Purpose:**
Enforce JSDoc comments on all public APIs (classes, methods, properties, events).

**Workflow:**

1. Triggered on `git commit` for component files
2. Parse component classes using `ts-morph`
3. Check that each public member has JSDoc with:
   - `@summary` (for classes)
   - `@description` (for all)
   - `@param` (for method parameters)
   - `@returns` (for methods with return values)
   - `@fires` (for events)
   - `@slot` (for slots)
   - `@csspart` (for CSS parts)
   - `@cssprop` (for CSS custom properties)
4. Calculate coverage percentage
5. Block commit if coverage < 100% for public APIs

**Implementation:**

```typescript
// scripts/hooks/jsdoc-coverage.ts
import { Project, SyntaxKind } from 'ts-morph';

export async function validateJSDocCoverage(stagedFiles: string[]): Promise<ValidationResult> {
  const project = new Project({ tsConfigFilePath: './tsconfig.base.json' });
  const violations: Violation[] = [];

  for (const filePath of stagedFiles.filter(
    (f) => f.includes('/components/') && f.endsWith('.ts'),
  )) {
    const sourceFile = project.addSourceFileAtPath(filePath);

    sourceFile.getClasses().forEach((classDecl) => {
      // Check class-level JSDoc
      const classJsDocs = classDecl.getJsDocs();
      if (classJsDocs.length === 0) {
        violations.push({
          file: filePath,
          line: classDecl.getStartLineNumber(),
          message: `Class "${classDecl.getName()}" missing JSDoc`,
          suggestion: 'Add JSDoc with @summary, @tag, @slot, @fires, @csspart, @cssprop',
        });
      } else {
        const requiredTags = ['summary', 'tag'];
        const foundTags = classJsDocs[0].getTags().map((t) => t.getTagName());
        const missingTags = requiredTags.filter((tag) => !foundTags.includes(tag));

        if (missingTags.length > 0) {
          violations.push({
            file: filePath,
            line: classDecl.getStartLineNumber(),
            message: `Class JSDoc missing required tags: ${missingTags.join(', ')}`,
            suggestion: `Add @${missingTags.join(', @')} tags`,
          });
        }
      }

      // Check public properties
      classDecl.getProperties().forEach((prop) => {
        if (prop.hasDecorator('property')) {
          const propJsDocs = prop.getJsDocs();
          if (propJsDocs.length === 0) {
            violations.push({
              file: filePath,
              line: prop.getStartLineNumber(),
              message: `Property "${prop.getName()}" missing JSDoc`,
              suggestion: 'Add JSDoc with description and @attr tag',
            });
          }
        }
      });

      // Check public methods
      classDecl.getMethods().forEach((method) => {
        if (!method.hasModifier(SyntaxKind.PrivateKeyword)) {
          const methodJsDocs = method.getJsDocs();
          const params = method.getParameters();
          const hasReturnValue = method.getReturnType().getText() !== 'void';

          if (methodJsDocs.length === 0 && !method.getName().startsWith('_')) {
            violations.push({
              file: filePath,
              line: method.getStartLineNumber(),
              message: `Method "${method.getName()}" missing JSDoc`,
              suggestion: 'Add JSDoc with description, @param, and @returns',
            });
          } else if (methodJsDocs.length > 0) {
            const tags = methodJsDocs[0].getTags();
            const paramTags = tags.filter((t) => t.getTagName() === 'param');
            const returnTags = tags.filter((t) => t.getTagName() === 'returns');

            if (params.length > 0 && paramTags.length !== params.length) {
              violations.push({
                file: filePath,
                line: method.getStartLineNumber(),
                message: `Method "${method.getName()}" missing @param for all parameters`,
                suggestion: `Add @param for: ${params.map((p) => p.getName()).join(', ')}`,
              });
            }

            if (hasReturnValue && returnTags.length === 0) {
              violations.push({
                file: filePath,
                line: method.getStartLineNumber(),
                message: `Method "${method.getName()}" missing @returns tag`,
                suggestion: 'Add @returns with description of return value',
              });
            }
          }
        }
      });
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "📝 Checking JSDoc coverage..."
npm run hooks:jsdoc-coverage
```

---

### Hook 1.4: `cem-type-sync` Hook

**Name:** `cem-type-sync`
**Trigger:** Pre-commit (Git hook)
**Priority:** P1 (High)

**Purpose:**
Validate that Custom Elements Manifest (CEM) types match TypeScript implementation. Ensure CEM is regenerated when component types change.

**Workflow:**

1. Triggered on `git commit` for component files
2. Parse TypeScript component definitions
3. Load `custom-elements.json`
4. Compare:
   - Property types (CEM vs TS)
   - Event detail types (CEM vs TS)
   - Attribute/property mapping
   - Default values
5. Regenerate CEM if mismatches found
6. Stage updated CEM file automatically

**Implementation:**

```typescript
// scripts/hooks/cem-type-sync.ts
import { Project } from 'ts-morph';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

interface CEMComponent {
  tagName: string;
  className: string;
  properties: Array<{ name: string; type: { text: string }; default?: string }>;
  events: Array<{ name: string; type: { text: string } }>;
}

export async function validateCEMTypeSync(stagedFiles: string[]): Promise<ValidationResult> {
  const violations: Violation[] = [];

  // Check if any component files changed
  const componentFiles = stagedFiles.filter((f) => f.includes('/components/') && f.endsWith('.ts'));
  if (componentFiles.length === 0) {
    return { passed: true, violations: [] };
  }

  // Load CEM
  const cemPath = 'packages/hx-library/custom-elements.json';
  const cemContent = readFileSync(cemPath, 'utf-8');
  const cem = JSON.parse(cemContent);

  // Parse TypeScript
  const project = new Project({ tsConfigFilePath: './tsconfig.base.json' });

  for (const filePath of componentFiles) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const classDecl = sourceFile.getClasses()[0];
    if (!classDecl) continue;

    const className = classDecl.getName();
    const tagName = classDecl
      .getDecorator('customElement')
      ?.getArguments()[0]
      ?.getText()
      .replace(/['"]/g, '');

    if (!tagName) continue;

    // Find corresponding CEM entry
    const cemModule = cem.modules.find((m: any) =>
      m.declarations.some((d: any) => d.name === className),
    );

    if (!cemModule) {
      violations.push({
        file: filePath,
        line: 1,
        message: `Component "${className}" not found in CEM`,
        suggestion: 'Run npm run cem to regenerate',
      });
      continue;
    }

    const cemComponent = cemModule.declarations.find((d: any) => d.name === className);

    // Compare properties
    classDecl.getProperties().forEach((prop) => {
      if (!prop.hasDecorator('property')) return;

      const propName = prop.getName();
      const tsType = prop.getType().getText();

      const cemProp = cemComponent.members?.find((m: any) => m.name === propName);
      if (!cemProp) {
        violations.push({
          file: filePath,
          line: prop.getStartLineNumber(),
          message: `Property "${propName}" not found in CEM`,
          suggestion: 'Run npm run cem to regenerate',
        });
      } else {
        const cemType = cemProp.type?.text;
        if (cemType !== tsType) {
          violations.push({
            file: filePath,
            line: prop.getStartLineNumber(),
            message: `Property "${propName}" type mismatch: TS="${tsType}" vs CEM="${cemType}"`,
            suggestion: 'Run npm run cem to regenerate',
          });
        }
      }
    });
  }

  // Auto-regenerate CEM if violations found
  if (violations.length > 0) {
    console.log('🔄 Regenerating CEM...');
    execSync('npm run cem', { stdio: 'inherit' });
    execSync('git add packages/hx-library/custom-elements.json');
    console.log('✅ CEM regenerated and staged');
  }

  return {
    passed: true, // Don't block commit, just auto-fix
    violations: [],
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "🔄 Validating CEM type sync..."
npm run hooks:cem-type-sync
```

---

### Hook 1.5: `declaration-file-completeness` Hook

**Name:** `declaration-file-completeness`
**Trigger:** Pre-commit (Git hook)
**Priority:** P2 (Medium)

**Purpose:**
Verify that all public exports have corresponding `.d.ts` declaration files and that declaration maps are generated.

**Workflow:**

1. Triggered on `git commit` for component files
2. Build library to generate declaration files
3. Verify:
   - Each `.ts` source has corresponding `.d.ts`
   - Declaration maps (`.d.ts.map`) exist
   - `HTMLElementTagNameMap` is present in declarations
   - Exported types are complete
4. Block commit if declarations incomplete

**Implementation:**

```typescript
// scripts/hooks/declaration-file-completeness.ts
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

export async function validateDeclarationFiles(stagedFiles: string[]): Promise<ValidationResult> {
  const violations: Violation[] = [];

  // Check if any component source files changed
  const componentSources = stagedFiles.filter(
    (f) =>
      f.includes('packages/hx-library/src/components/') &&
      f.endsWith('.ts') &&
      !f.includes('.test.') &&
      !f.includes('.stories.'),
  );

  if (componentSources.length === 0) {
    return { passed: true, violations: [] };
  }

  // Build library to generate declarations
  console.log('🏗️  Building library to verify declarations...');
  try {
    execSync('npm run build:library', { stdio: 'pipe' });
  } catch (error) {
    violations.push({
      file: 'build',
      line: 0,
      message: 'Build failed, cannot verify declaration files',
      suggestion: 'Fix build errors first',
    });
    return { passed: false, violations };
  }

  // Check each component source file
  for (const sourcePath of componentSources) {
    // Convert src path to dist path
    const distPath = sourcePath.replace('/src/', '/dist/').replace('.ts', '.d.ts');

    // Check 1: Declaration file exists
    if (!existsSync(distPath)) {
      violations.push({
        file: sourcePath,
        line: 0,
        message: 'Missing declaration file',
        suggestion: `Expected: ${distPath}`,
      });
      continue;
    }

    // Check 2: Declaration map exists
    const mapPath = `${distPath}.map`;
    if (!existsSync(mapPath)) {
      violations.push({
        file: sourcePath,
        line: 0,
        message: 'Missing declaration map',
        suggestion: `Expected: ${mapPath}`,
      });
    }

    // Check 3: HTMLElementTagNameMap is present (for components)
    const content = readFileSync(distPath, 'utf-8');
    if (sourcePath.includes('/components/') && !content.includes('HTMLElementTagNameMap')) {
      violations.push({
        file: sourcePath,
        line: 0,
        message: 'Declaration missing HTMLElementTagNameMap',
        suggestion: 'Add: declare global { interface HTMLElementTagNameMap { ... } }',
      });
    }

    // Check 4: No 'any' in declarations
    if (content.includes(': any') || content.includes('<any>')) {
      violations.push({
        file: sourcePath,
        line: 0,
        message: 'Declaration contains "any" type',
        suggestion: 'Fix source types to generate proper declarations',
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "📦 Verifying declaration files..."
npm run hooks:declaration-completeness
```

---

### Hook 1.6: `generic-type-patterns` Hook

**Name:** `generic-type-patterns`
**Trigger:** Pre-commit (Git hook)
**Priority:** P2 (Medium)

**Purpose:**
Validate that generic component patterns follow conventions (e.g., `PropertyValues<this>` instead of `Map<string, unknown>`).

**Workflow:**

1. Triggered on `git commit` for component files
2. Check for common antipatterns:
   - `Map<string, unknown>` instead of `PropertyValues<this>`
   - `Record<string, any>` instead of proper interface
   - Missing generic constraints
   - Incorrect `this` type in lifecycle methods
3. Suggest proper patterns
4. Block commit if antipatterns found

**Implementation:**

```typescript
// scripts/hooks/generic-type-patterns.ts
import { Project, SyntaxKind } from 'ts-morph';

const ANTIPATTERNS = [
  {
    pattern: /Map<string,\s*unknown>/,
    message: 'Use PropertyValues<this> instead of Map<string, unknown>',
    suggestion: 'import { PropertyValues } from "lit"; then use PropertyValues<this>',
  },
  {
    pattern: /Record<string,\s*any>/,
    message: 'Avoid Record<string, any>',
    suggestion: 'Define proper interface with known properties',
  },
  {
    pattern: /\|\s*null\s*\|\s*undefined/,
    message: 'Use "?:" syntax instead of "| null | undefined"',
    suggestion: 'Change "prop: string | null | undefined" to "prop?: string"',
  },
];

export async function validateGenericPatterns(stagedFiles: string[]): Promise<ValidationResult> {
  const project = new Project({ tsConfigFilePath: './tsconfig.base.json' });
  const violations: Violation[] = [];

  for (const filePath of stagedFiles.filter(
    (f) => f.includes('/components/') && f.endsWith('.ts'),
  )) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const content = sourceFile.getFullText();

    // Check for antipatterns
    ANTIPATTERNS.forEach(({ pattern, message, suggestion }) => {
      const matches = content.matchAll(new RegExp(pattern, 'g'));
      for (const match of matches) {
        const position = sourceFile.getLineAndColumnAtPos(match.index ?? 0);
        violations.push({
          file: filePath,
          line: position.line,
          message,
          suggestion,
        });
      }
    });

    // Check Lit lifecycle methods use PropertyValues<this>
    sourceFile.getClasses().forEach((classDecl) => {
      ['update', 'willUpdate', 'updated'].forEach((methodName) => {
        const method = classDecl.getMethod(methodName);
        if (method) {
          const param = method.getParameters()[0];
          if (param) {
            const paramType = param.getType().getText();
            if (paramType !== 'PropertyValues<this>') {
              violations.push({
                file: filePath,
                line: method.getStartLineNumber(),
                message: `Method "${methodName}" should use PropertyValues<this>`,
                suggestion: `Change parameter type to: changedProperties: PropertyValues<this>`,
              });
            }
          }
        }
      });
    });

    // Check for non-null assertions (!)
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.NonNullExpression) {
        // Allow in test files only
        if (!filePath.includes('.test.') && !filePath.includes('test-utils')) {
          violations.push({
            file: filePath,
            line: node.getStartLineNumber(),
            message: 'Non-null assertion (!) not allowed outside tests',
            suggestion: 'Use optional chaining (?.) and nullish coalescing (??)',
          });
        }
      }
    });
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
```

**Integration Point:**
Add to `.husky/pre-commit`:

```bash
echo "🧬 Validating generic type patterns..."
npm run hooks:generic-patterns
```

---

## 2. Model Context Protocol (MCP) Integrations

### MCP 2.1: TypeScript Language Server MCP

**Name:** `typescript-language-server-mcp`
**Priority:** P0 (Critical)

**Purpose:**
Provide real-time TypeScript type checking and IntelliSense during Claude Code interactions.

**Capabilities:**

- Real-time type checking without running `tsc`
- Type information at cursor position
- Signature help for function calls
- Go-to-definition for types
- Find references across monorepo
- Rename symbol refactoring

**Implementation:**

```json
// .mcp/typescript-lsp.json
{
  "mcpServers": {
    "typescript-lsp": {
      "command": "typescript-language-server",
      "args": ["--stdio"],
      "env": {
        "TSSERVER_LOG_FILE": "/tmp/tsserver.log"
      }
    }
  }
}
```

**Claude Code Integration:**

```typescript
// .claude/tools/typescript-check.ts
export async function checkTypeAtPosition(file: string, line: number, column: number) {
  const mcp = await connectMCP('typescript-lsp');
  const typeInfo = await mcp.request('textDocument/hover', {
    textDocument: { uri: `file://${file}` },
    position: { line, character: column },
  });
  return typeInfo;
}
```

**Workflow:**

1. Claude Code reads a TypeScript file
2. Before suggesting changes, query MCP for type information
3. Use type information to generate correct TypeScript
4. Validate changes against language server before writing
5. Show type errors to user immediately

**Priority Justification:**
Real-time type checking prevents Claude from generating invalid TypeScript.

---

### MCP 2.2: ts-morph AST Analysis MCP

**Name:** `ts-morph-ast-mcp`
**Priority:** P0 (Critical)

**Purpose:**
Provide AST-level TypeScript analysis for structural validation and code generation.

**Capabilities:**

- Parse TypeScript files to AST
- Query AST nodes (classes, methods, properties)
- Extract type information
- Generate code snippets
- Validate component structure
- Extract JSDoc metadata

**Implementation:**

```typescript
// .mcp/servers/ts-morph-server.ts
import { Project, SourceFile } from 'ts-morph';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'ts-morph-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const project = new Project({
  tsConfigFilePath: './tsconfig.base.json',
});

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'analyze_component': {
      const sourceFile = project.addSourceFileAtPath(args.filePath);
      const classDecl = sourceFile.getClasses()[0];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                name: classDecl.getName(),
                properties: classDecl.getProperties().map((p) => ({
                  name: p.getName(),
                  type: p.getType().getText(),
                  hasDecorator: p.hasDecorator('property'),
                })),
                methods: classDecl.getMethods().map((m) => ({
                  name: m.getName(),
                  returnType: m.getReturnType().getText(),
                  parameters: m.getParameters().map((p) => ({
                    name: p.getName(),
                    type: p.getType().getText(),
                  })),
                })),
                events: extractEvents(classDecl),
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'validate_types': {
      const sourceFile = project.addSourceFileAtPath(args.filePath);
      const diagnostics = sourceFile.getPreEmitDiagnostics();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              diagnostics.map((d) => ({
                message: d.getMessageText(),
                line: d.getStart() ? sourceFile.getLineAndColumnAtPos(d.getStart()!).line : 0,
              })),
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'extract_exports': {
      const sourceFile = project.addSourceFileAtPath(args.filePath);
      const exports = sourceFile.getExportedDeclarations();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(Array.from(exports.keys()), null, 2),
          },
        ],
      };
    }
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
```

**MCP Configuration:**

```json
// .mcp/config.json
{
  "mcpServers": {
    "ts-morph": {
      "command": "tsx",
      "args": [".mcp/servers/ts-morph-server.ts"],
      "cwd": "/Volumes/Development/wc-2026"
    }
  }
}
```

**Claude Code Usage:**

```typescript
// When analyzing a component
const analysis = await mcp.callTool('ts-morph', 'analyze_component', {
  filePath:
    '/Volumes/Development/wc-2026/packages/hx-library/src/components/hx-button/hx-button.ts',
});
```

**Priority Justification:**
AST analysis enables structural validation that simple regex cannot achieve.

---

### MCP 2.3: TypeScript Documentation MCP

**Name:** `typescript-docs-mcp`
**Priority:** P1 (High)

**Purpose:**
Provide access to TypeScript documentation and best practices during code generation.

**Capabilities:**

- Search TypeScript handbook
- Lookup utility types (Partial, Pick, Omit, etc.)
- Access strict mode documentation
- Query decorator metadata
- Lit framework TypeScript patterns

**Implementation:**

```typescript
// .mcp/servers/typescript-docs-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const TYPESCRIPT_DOCS = {
  'strict-mode': {
    url: 'https://www.typescriptlang.org/tsconfig#strict',
    summary: 'Enables all strict type checking options',
    flags: [
      'noImplicitAny',
      'strictNullChecks',
      'strictFunctionTypes',
      'strictBindCallApply',
      'strictPropertyInitialization',
      'noImplicitThis',
      'alwaysStrict',
    ],
  },
  'utility-types': {
    'Partial<T>': 'Makes all properties optional',
    'Required<T>': 'Makes all properties required',
    'Readonly<T>': 'Makes all properties readonly',
    'Pick<T, K>': 'Constructs type with subset of properties K',
    'Omit<T, K>': 'Constructs type with all properties except K',
    'Record<K, T>': 'Constructs type with keys K and values T',
    'PropertyValues<T>': 'Lit: Map of changed properties',
  },
  'web-components': {
    HTMLElementTagNameMap: 'Global interface for custom element type safety',
    'CustomEvent<T>': 'Typed custom events with detail property',
    ElementInternals: 'Form-associated custom elements API',
  },
};

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;
  const topic = uri.replace('typescript-docs://', '');

  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(TYPESCRIPT_DOCS[topic], null, 2),
      },
    ],
  };
});
```

**Claude Code Usage:**

```typescript
// When generating utility types
const docs = await mcp.readResource('typescript-docs://utility-types');
```

**Priority Justification:**
Documentation access ensures Claude generates idiomatic TypeScript.

---

### MCP 2.4: Custom Elements Manifest MCP

**Name:** `cem-query-mcp`
**Priority:** P1 (High)

**Purpose:**
Query Custom Elements Manifest for component metadata and type information.

**Capabilities:**

- Query component by tag name
- Extract property types
- List events with detail types
- Get CSS custom properties
- Find all components
- Compare CEM vs source

**Implementation:**

```typescript
// .mcp/servers/cem-server.ts
import { readFileSync } from 'fs';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server(
  {
    name: 'cem-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

let cem: any = null;

function loadCEM() {
  if (!cem) {
    const cemPath = 'packages/hx-library/custom-elements.json';
    cem = JSON.parse(readFileSync(cemPath, 'utf-8'));
  }
  return cem;
}

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  const cemData = loadCEM();

  switch (name) {
    case 'get_component': {
      const { tagName } = args;
      const component = cemData.modules
        .flatMap((m: any) => m.declarations)
        .find((d: any) => d.tagName === tagName);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(component, null, 2),
          },
        ],
      };
    }

    case 'list_components': {
      const components = cemData.modules
        .flatMap((m: any) => m.declarations)
        .filter((d: any) => d.tagName)
        .map((d: any) => ({
          tagName: d.tagName,
          className: d.name,
          summary: d.description,
        }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(components, null, 2),
          },
        ],
      };
    }

    case 'get_component_properties': {
      const { tagName } = args;
      const component = cemData.modules
        .flatMap((m: any) => m.declarations)
        .find((d: any) => d.tagName === tagName);

      const properties = component.members
        .filter((m: any) => m.kind === 'field')
        .map((m: any) => ({
          name: m.name,
          type: m.type?.text,
          default: m.default,
          description: m.description,
        }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(properties, null, 2),
          },
        ],
      };
    }

    case 'get_component_events': {
      const { tagName } = args;
      const component = cemData.modules
        .flatMap((m: any) => m.declarations)
        .find((d: any) => d.tagName === tagName);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(component.events, null, 2),
          },
        ],
      };
    }
  }
});

server.setRequestHandler('resources/list', async () => {
  const cemData = loadCEM();
  const components = cemData.modules
    .flatMap((m: any) => m.declarations)
    .filter((d: any) => d.tagName);

  return {
    resources: components.map((c: any) => ({
      uri: `cem://${c.tagName}`,
      name: c.tagName,
      mimeType: 'application/json',
    })),
  };
});
```

**Claude Code Usage:**

```typescript
// When working with a component
const button = await mcp.callTool('cem-query', 'get_component', {
  tagName: 'hx-button',
});
```

**Priority Justification:**
CEM is source of truth for public API. Claude needs quick access.

---

### MCP 2.5: Type Coverage Reporter MCP

**Name:** `type-coverage-mcp`
**Priority:** P2 (Medium)

**Purpose:**
Report TypeScript type coverage metrics across the codebase.

**Capabilities:**

- Calculate type coverage percentage
- Identify files with implicit `any`
- Track coverage trends
- Generate coverage reports
- Compare coverage before/after changes

**Implementation:**

```typescript
// .mcp/servers/type-coverage-server.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_coverage': {
      const { stdout } = await execAsync('npx type-coverage --detail');
      const lines = stdout.split('\n');
      const coverageLine = lines.find((l) => l.includes('%'));
      const percentage = parseFloat(coverageLine?.match(/[\d.]+%/)?.[0] ?? '0');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                percentage,
                passed: percentage === 100,
                details: stdout,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case 'find_any_types': {
      const { stdout } = await execAsync('npx type-coverage --detail | grep "any"');

      return {
        content: [
          {
            type: 'text',
            text: stdout,
          },
        ],
      };
    }
  }
});
```

**Claude Code Usage:**

```typescript
// Before committing changes
const coverage = await mcp.callTool('type-coverage', 'get_coverage', {});
if (coverage.percentage < 100) {
  console.warn('Type coverage below 100%');
}
```

**Priority Justification:**
Coverage metrics provide visibility into type safety health.

---

## 3. Integration Workflow

### 3.1: Pre-Commit Workflow (Full Pipeline)

```bash
#!/usr/bin/env bash
# .husky/pre-commit

echo "🚀 TypeScript Quality Gate Pipeline"
echo ""

# Stage 1: Static Analysis (parallel)
echo "📊 Stage 1: Static Analysis"
npm run hooks:no-any-types &
npm run hooks:event-type-safety &
npm run hooks:jsdoc-coverage &
npm run hooks:generic-patterns &
wait

# Stage 2: Type Checking
echo ""
echo "📘 Stage 2: Type Checking"
npm run type-check

# Stage 3: Build Validation
echo ""
echo "🏗️  Stage 3: Build Validation"
npm run hooks:declaration-completeness

# Stage 4: CEM Sync
echo ""
echo "🔄 Stage 4: CEM Sync"
npm run hooks:cem-type-sync

# Stage 5: Tests
echo ""
echo "🧪 Stage 5: Tests"
npm run test:library

echo ""
echo "✅ All TypeScript quality gates passed"
```

### 3.2: Claude Code Integration Workflow

When Claude Code works on TypeScript:

1. **Read file** → Query `ts-morph-mcp` for AST analysis
2. **Generate code** → Validate with `typescript-lsp-mcp`
3. **Check patterns** → Query `typescript-docs-mcp` for best practices
4. **Write file** → Trigger hooks automatically
5. **Verify CEM** → Query `cem-query-mcp` for consistency

**Example:**

```typescript
// Claude Code workflow for editing a component

// Step 1: Analyze existing structure
const analysis = await mcp.callTool('ts-morph', 'analyze_component', {
  filePath: componentPath,
});

// Step 2: Get type information
const typeInfo = await mcp.callTool('typescript-lsp', 'hover', {
  file: componentPath,
  line: 42,
  column: 10,
});

// Step 3: Generate new code with validation
const newCode = generateComponentMethod(analysis, typeInfo);

// Step 4: Validate before writing
const validation = await mcp.callTool('ts-morph', 'validate_types', {
  filePath: componentPath,
});

if (validation.errors.length > 0) {
  throw new Error(`Type errors: ${JSON.stringify(validation.errors)}`);
}

// Step 5: Write file
await writeFile(componentPath, newCode);

// Step 6: Verify CEM updated
await mcp.callTool('cem-query', 'get_component', {
  tagName: 'hx-button',
});
```

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Install `ts-morph` dependency
- [ ] Create hook scripts directory structure
- [ ] Implement `no-any-types` hook (1.1)
- [ ] Implement `event-type-safety` hook (1.2)
- [ ] Add hooks to `.husky/pre-commit`
- [ ] Test on existing codebase (should pass)

### Phase 2: Core Hooks (Week 2)

- [ ] Implement `jsdoc-coverage` hook (1.3)
- [ ] Implement `cem-type-sync` hook (1.4)
- [ ] Implement `declaration-completeness` hook (1.5)
- [ ] Implement `generic-patterns` hook (1.6)
- [ ] Update pre-commit pipeline to run hooks in parallel

### Phase 3: MCP Servers (Week 3)

- [ ] Set up MCP infrastructure
- [ ] Implement `typescript-lsp-mcp` (2.1)
- [ ] Implement `ts-morph-ast-mcp` (2.2)
- [ ] Test MCP servers with Claude Code

### Phase 4: Documentation & Advanced MCP (Week 4)

- [ ] Implement `typescript-docs-mcp` (2.3)
- [ ] Implement `cem-query-mcp` (2.4)
- [ ] Implement `type-coverage-mcp` (2.5)
- [ ] Document MCP usage patterns

### Phase 5: Integration & Testing (Week 5)

- [ ] Integrate MCP with Claude Code workflows
- [ ] Create example workflows
- [ ] Performance testing (hook execution time)
- [ ] Documentation for team
- [ ] Training session with TypeScript Specialist

### Phase 6: Monitoring & Optimization (Week 6)

- [ ] Set up metrics dashboard
- [ ] Monitor hook performance
- [ ] Optimize slow hooks
- [ ] Gather feedback from team
- [ ] Iterate on patterns

---

## 5. Performance Considerations

### Hook Execution Time Targets

| Hook                     | Target Time | Timeout |
| ------------------------ | ----------- | ------- |
| no-any-types             | <2s         | 5s      |
| event-type-safety        | <2s         | 5s      |
| jsdoc-coverage           | <3s         | 10s     |
| cem-type-sync            | <5s         | 15s     |
| declaration-completeness | <10s        | 30s     |
| generic-patterns         | <2s         | 5s      |
| **Total Pipeline**       | **<25s**    | **60s** |

### Optimization Strategies

1. **Parallel Execution**: Run independent hooks in parallel
2. **Incremental Analysis**: Only analyze staged files
3. **Caching**: Cache AST analysis between hooks
4. **Bail Early**: Stop at first violation (optional)
5. **Skip in CI**: Some hooks only run locally

### Caching Strategy

```typescript
// scripts/hooks/cache.ts
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const CACHE_DIR = '.cache/hooks';

export function getCachedResult(key: string, files: string[]): any | null {
  const hash = hashFiles(files);
  const cachePath = `${CACHE_DIR}/${key}-${hash}.json`;

  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, 'utf-8'));
  }

  return null;
}

export function setCachedResult(key: string, files: string[], result: any) {
  const hash = hashFiles(files);
  const cachePath = `${CACHE_DIR}/${key}-${hash}.json`;
  writeFileSync(cachePath, JSON.stringify(result, null, 2));
}

function hashFiles(files: string[]): string {
  const content = files.map((f) => readFileSync(f, 'utf-8')).join('');
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}
```

---

## 6. Success Metrics

### Quantitative Metrics

| Metric                        | Current | Target |
| ----------------------------- | ------- | ------ |
| Type coverage                 | 100%    | 100%   |
| `any` types in codebase       | 0       | 0      |
| `@ts-ignore` directives       | 0       | 0      |
| JSDoc coverage (public APIs)  | ~80%    | 100%   |
| CEM accuracy                  | ~95%    | 100%   |
| Declaration file completeness | 100%    | 100%   |
| Hook execution time           | N/A     | <25s   |
| Pre-commit rejection rate     | N/A     | <5%    |

### Qualitative Metrics

- Developer satisfaction with hooks (survey)
- Time saved catching type errors pre-commit vs in review
- Reduction in type-related bugs in production
- Claude Code type safety in generated code
- Team confidence in TypeScript patterns

---

## 7. Rollout Plan

### Soft Launch (Week 1-2)

- Deploy hooks in warning mode (don't block commits)
- Collect metrics on violations
- Fix existing violations
- Tune thresholds

### Hard Launch (Week 3-4)

- Enable commit blocking for P0 hooks
- Monitor rejection rate
- Quick-fix common issues
- Update documentation

### MCP Rollout (Week 5-6)

- Deploy MCP servers to dev environments
- Train Claude Code on MCP usage
- Collect feedback from specialists
- Iterate on MCP capabilities

---

## 8. Maintenance & Support

### Ongoing Maintenance

- **Weekly**: Review hook metrics dashboard
- **Monthly**: Update TypeScript patterns based on team feedback
- **Quarterly**: Review and optimize hook performance
- **Annually**: Audit TypeScript best practices against industry standards

### Support Channels

- **Slack**: `#typescript-help` for hook issues
- **Documentation**: `/docs/typescript-automation.md`
- **Office Hours**: TypeScript Specialist available Tuesdays 2-4pm
- **Emergency**: Override with `--no-verify` + post-commit fix (tracked)

---

## 9. Appendix

### A. Hook Configuration

```typescript
// scripts/hooks/config.ts
export const HOOK_CONFIG = {
  enabled: {
    'no-any-types': true,
    'event-type-safety': true,
    'jsdoc-coverage': true,
    'cem-type-sync': true,
    'declaration-completeness': true,
    'generic-patterns': true,
  },
  blocking: {
    'no-any-types': true,
    'event-type-safety': true,
    'jsdoc-coverage': false, // Warning only initially
    'cem-type-sync': false, // Auto-fix
    'declaration-completeness': true,
    'generic-patterns': true,
  },
  thresholds: {
    jsdocCoverage: 100,
    executionTimeout: 60000, // 60s
  },
};
```

### B. MCP Server URLs

- TypeScript LSP: `npm:typescript-language-server`
- ts-morph Server: `.mcp/servers/ts-morph-server.ts`
- TypeScript Docs: `.mcp/servers/typescript-docs-server.ts`
- CEM Query: `.mcp/servers/cem-server.ts`
- Type Coverage: `.mcp/servers/type-coverage-server.ts`

### C. Package Dependencies

```json
{
  "devDependencies": {
    "ts-morph": "^21.0.0",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "typescript-language-server": "^4.3.0",
    "type-coverage": "^2.27.0"
  }
}
```

---

## 10. Conclusion

This proposal provides a comprehensive TypeScript automation strategy that:

1. **Enforces strict mode** with zero-tolerance hooks
2. **Provides real-time type checking** via MCP integration
3. **Maintains type safety** across the monorepo
4. **Prevents antipatterns** before they reach code review
5. **Empowers Claude Code** with TypeScript intelligence

**Expected Outcomes:**

- Zero type-related bugs in production
- Faster code reviews (less focus on type issues)
- Higher developer confidence in refactoring
- Better Claude Code output quality
- Self-documenting codebase via JSDoc

**Next Steps:**

1. Review and approve proposal (TypeScript Specialist + Principal Engineer)
2. Create implementation tasks in backlog
3. Assign Phase 1 tasks
4. Schedule kickoff meeting
5. Begin implementation

---

**Document Version:** 1.0
**Last Updated:** 2026-02-20
**Owner:** TypeScript Specialist
**Reviewers:** Principal Engineer, Staff Software Engineer, DevOps Engineer
