---
title: Building Components
description: How to build new web components for the HELIX library
---

This guide covers the end-to-end process for creating production-quality Lit 3.x components for the HELIX library.

## Component Template

Every HELIX component follows this structure:

`hx-example` below is a placeholder tag for illustration — replace with the real `hx-<name>` you are building.

```typescript
// hx-example.ts
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { hxExampleStyles } from './hx-example.styles.js';

/**
 * A description of the component's purpose.
 *
 * @slot - Default slot for content
 * @slot actions - Slot for action buttons
 *
 * @csspart container - The outer container
 *
 * @fires {CustomEvent<{ originalEvent: MouseEvent }>} hx-click - Dispatched when the host fires its action.
 */
@customElement('hx-example')
export class HxExample extends LitElement {
  static override styles = [hxExampleStyles];

  /** The variant of the component */
  @property({ type: String, reflect: true })
  variant: 'default' | 'elevated' = 'default';

  render() {
    return html`
      <div part="container" class="container" @click=${this.#emitClick}>
        <slot></slot>
        <slot name="actions"></slot>
      </div>
    `;
  }

  #emitClick = (originalEvent: MouseEvent) => {
    this.dispatchEvent(
      new CustomEvent('hx-click', {
        detail: { originalEvent },
        bubbles: true,
        composed: true,
      }),
    );
  };
}
```

Styles live in a sibling `*.styles.ts` module to keep the component class focused and to play well with the shared style-token cascade — see [Adopted stylesheets](/guides/adopted-stylesheets/).

## File Structure

```
src/components/hx-example/
├── index.ts              # Re-export
├── hx-example.ts         # Component class
├── hx-example.styles.ts  # Lit CSS tagged template
├── hx-example.stories.ts # Storybook stories
└── hx-example.test.ts    # Vitest browser tests
```

## Key Patterns

1. **Always use design tokens** — Never hard-code colors, spacing, or typography
2. **Reflect boolean attributes** — For CSS state selectors (`:host([disabled])`)
3. **Expose CSS Parts** — For external styling customization
4. **Named slots** — For composition flexibility
5. **JSDoc comments** — For Custom Elements Manifest generation
6. **ElementInternals** — For form-associated components

## Quality Checklist

Before marking a component complete:

- [ ] TypeScript strict — zero errors from `pnpm run type-check`
- [ ] Tests pass — `pnpm run test:smart` for changed components; CI runs the full matrix
- [ ] Coverage — meets the blocking threshold in `packages/hx-library/coverage-config.json` (currently 50% lines/branches/functions/statements; aspirational target 95%)
- [ ] Accessibility — covered by the formal AAA audit (`pnpm aaa:audit`); current cert posture is WCAG 2.2 AAA on the P0 surface (44 P0 components, 376 Supports / 109 Not Applicable / 0 Partial / 0 Fail) plus the CI `a11y-audit` AA regression guard
- [ ] Storybook — stories for all variants and states
- [ ] CEM — `pnpm run cem` generates accurate API manifest
- [ ] Bundle size — within the per-component budget defined in `bundle-budgets.json` and `.bundle-budget.json` at the repo root (per-component caps with explicit reviewed budgets for complex components, not a blanket 5KB rule); CI enforces via `pnpm run check:bundle`
