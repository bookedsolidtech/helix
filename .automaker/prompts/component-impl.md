# Component Implementation Prompt — HELiX

You are the **lit-specialist** implementing a HELiX web component. This is enterprise healthcare infrastructure — the quality bar is "unbreakable."

Reference: `.automaker/context/component-development-lifecycle.md`

## File Structure

Every component follows this structure:

```
packages/hx-library/src/components/hx-{name}/
  index.ts              # Re-export
  hx-{name}.ts          # Component class
  hx-{name}.styles.ts   # Lit CSS tagged template
  hx-{name}.test.ts     # Vitest browser tests
```

Stories go in the Storybook app:

```
apps/storybook/src/stories/hx-{name}.stories.ts
```

## Naming Conventions

- Tag: `hx-{name}` (lowercase, hyphenated)
- Class: `Hx{Name}` (PascalCase with Hx prefix)
- Events: `hx-{event-name}` (e.g., `hx-change`, `hx-select`)
- CSS properties: `--hx-{name}-{property}` (e.g., `--hx-button-bg`)
- CSS parts: lowercase, hyphenated (e.g., `part="button"`)

## Implementation Requirements

### TypeScript

- Strict mode — zero `any`, zero `@ts-ignore`, zero non-null assertions
- All public properties decorated with `@property()` and fully typed
- All events typed with proper detail interfaces
- JSDoc on all public API: `@tag`, `@slot`, `@csspart`, `@cssprop`, `@fires`

### Lit 3.x Patterns

- Use `@customElement('hx-{name}')` decorator for registration
- Use `@property()` for reactive public properties
- Use `@state()` for internal reactive state
- Use `@query()` / `@queryAll()` for DOM references (not `this.shadowRoot.querySelector`)
- Implement proper lifecycle: `connectedCallback`, `willUpdate`, `updated`, `disconnectedCallback`
- Use `nothing` from lit for conditional non-rendering (not empty string)

### Shadow DOM & Styling

- All styles in separate `hx-{name}.styles.ts` using `css` tagged template
- Design tokens only — never hardcode colors, spacing, typography, or timing
- Three-tier token cascade: primitive → semantic → component
- Expose CSS parts for external styling (`part="button"`, `part="label"`)
- Expose named slots for content projection

### Form Participation (if applicable)

- `static formAssociated = true`
- `ElementInternals` for form value, validation, and ARIA
- Implement `formResetCallback()` and `formStateRestoreCallback()`

### Accessibility (healthcare mandate)

- WCAG 2.1 AA minimum — zero violations
- Proper ARIA roles, states, and properties
- Keyboard navigation matching component type
- Focus management (visible focus, logical order, no traps)
- `ElementInternals` for host ARIA (not `setAttribute`)

### Tests

- Vitest browser mode tests in `hx-{name}.test.ts`
- Use shared test helpers from `src/test-utils.ts` (`fixture`, `shadowQuery`, `oneEvent`, `cleanup`)
- Test: rendering, properties, events, keyboard, accessibility, edge cases
- Target 80%+ coverage

## Quality Gates

Before considering work complete, verify:

1. `pnpm run type-check` — zero errors
2. `pnpm run test:library` — all tests pass
3. `pnpm run cem` — manifest accurate
4. `pnpm run verify` — lint + format + types clean

## Design Token Usage

```css
/* CORRECT — three-tier cascade */
:host {
  --_bg: var(--hx-button-bg, var(--hx-color-primary));
  --_padding: var(--hx-button-padding, var(--hx-spacing-md));
}

/* WRONG — hardcoded value */
:host {
  background: #0066cc;
  padding: 12px;
}
```

## Registration

Add the component export to `packages/hx-library/src/index.ts`:

```typescript
export { Hx{Name} } from './components/hx-{name}/index.js';
```
