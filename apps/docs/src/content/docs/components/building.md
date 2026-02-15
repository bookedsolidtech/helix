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
 * @fires wc-click - Fired when the component is clicked
 */
@customElement('wc-example')
export class WcExample extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Use design tokens */
      font-family: var(--wc-font-family-body);
      color: var(--wc-color-text-primary);
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

## Key Patterns

1. **Always use design tokens** - Never hard-code colors, spacing, or typography
2. **Reflect boolean attributes** - For CSS state selectors
3. **Expose CSS Parts** - For external styling customization
4. **Named slots** - For composition flexibility
5. **JSDoc comments** - For Custom Elements Manifest generation
6. **ElementInternals** - For form-associated components

## Detailed Guide

For the complete component building guide (80,000+ words), see the [Pre-Planning: Component Building Guide](/pre-planning/building-guide/).

## Next Steps

- [Component API](/components/api/) - API conventions and patterns
- [Examples](/components/examples/) - Working component examples
