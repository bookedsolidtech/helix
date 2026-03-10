# Helix Quick Rules

## Barrel File (CRITICAL)

**NEVER manually edit `packages/hx-library/src/index.ts`.** It is auto-generated.
Each component only needs its own files in `src/components/hx-foo/`. The barrel
file is regenerated automatically by `npm run generate:barrel` (runs as prebuild).
If you need to verify exports, run `npm run generate:barrel` in the hx-library package.

## Hard Constraints

- No `any` types. No `!` assertions. TypeScript strict always.
- No hardcoded colors/spacing/timing — use `@helixui/tokens/lit` or `@helixui/tokens`.
- Shadow DOM required. No `createRenderRoot()` returning `this`.
- All CSS parts: `@csspart` JSDoc. All CSS props: `@cssprop` JSDoc. All events: `@fires` JSDoc.
- CustomEvent dispatches: `bubbles: true, composed: true`.
- After any component change: `npm run cem` then `npm run type-check` then `npm run test:library`.
- **MANDATORY before ANY git push — NO EXCEPTIONS**: Run `npm run verify` (lint + format:check + type-check). Zero failures required. If it fails, fix it and re-run. Do NOT push until `npm run verify` exits clean. This cannot be skipped. The CI pipeline will catch failures and waste cycles — prevent this at the source.
- Auto-fix helpers: `npx eslint --fix .` for lint, `npm run format` for formatting. Run `npm run verify` again after auto-fixing to confirm clean.
- **Before PR creation**: verify all quality gates pass locally: `npm run verify && npm run test:library`.

## Token Usage

```typescript
import { colorPrimary, spacingMd } from '@helixui/tokens/lit';
static styles = css`:host { color: ${colorPrimary}; padding: ${spacingMd}; }`;
```

## MCP Tools (use before and after component changes)

- `scoreComponent(tagName)` — health baseline before/after
- `validateCEMCompleteness(tagName)` — after `npm run cem`
- `getDiagnosticsForComponent(tagName)` — zero TS errors required
- `getHealthDiff(tagName)` — confirm no regression before PR

Servers must be built first: `npm run build:mcp-servers`
