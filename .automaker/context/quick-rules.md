# Helix Quick Rules

## Hard Constraints
- No `any` types. No `!` assertions. TypeScript strict always.
- No hardcoded colors/spacing/timing — use `@helix/tokens/lit` or `@helix/tokens`.
- Shadow DOM required. No `createRenderRoot()` returning `this`.
- All CSS parts: `@csspart` JSDoc. All CSS props: `@cssprop` JSDoc. All events: `@fires` JSDoc.
- CustomEvent dispatches: `bubbles: true, composed: true`.
- After any component change: `npm run cem` then `npm run type-check` then `npm run test:library`.

## Token Usage
```typescript
import { colorPrimary, spacingMd } from '@helix/tokens/lit';
static styles = css`:host { color: ${colorPrimary}; padding: ${spacingMd}; }`;
```

## MCP Tools (use before and after component changes)
- `scoreComponent(tagName)` — health baseline before/after
- `validateCEMCompleteness(tagName)` — after `npm run cem`
- `getDiagnosticsForComponent(tagName)` — zero TS errors required
- `getHealthDiff(tagName)` — confirm no regression before PR

Servers must be built first: `npm run build:mcp-servers`
