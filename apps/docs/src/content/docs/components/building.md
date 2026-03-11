---
title: Building Components
description: How to build new web components for the HELIX library
---

This guide covers the end-to-end process for creating production-quality Lit 3.x components for the HELIX library.

## Component Template

Every HELIX component follows this structure:

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * A description of the component's purpose.
 *
 * @slot - Default slot for content
 * @slot actions - Slot for action buttons
 *
 * @csspart container - The outer container
 *
 * @fires hx-click - Fired when the component is clicked
 */
@customElement('hx-example')
export class HxExample extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Use design tokens */
      font-family: var(--hx-font-family-body);
      color: var(--hx-color-text-primary);
    }
  `;

  /** The variant of the component */
  @property({ type: String, reflect: true })
  variant: 'default' | 'elevated' = 'default';

  render() {
    return html`
      <div part="container" class="container">
        <slot></slot>
        <slot name="actions"></slot>
      </div>
    `;
  }
}
```

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

- [ ] TypeScript strict — zero errors from `npm run type-check`
- [ ] Tests pass — `npm run test` (80%+ coverage)
- [ ] Accessibility — WCAG 2.1 AA (axe-core clean)
- [ ] Storybook — stories for all variants and states
- [ ] CEM — `npm run cem` generates accurate API manifest
- [ ] Bundle size — under 5KB min+gz
