---
title: CSS Custom Properties API
description: Expose a public styling API on HELiX components using CSS custom properties with the --hx-{component}-{property} naming pattern.
---

CSS custom properties (also called CSS variables) serve two roles in HELiX: they carry design token values and they form the public styling API of components. Exposing the right custom properties lets consumers customize a component's appearance without fighting shadow DOM encapsulation.

## Custom Properties as Public API

Every CSS custom property a component reads from its `:host` context is implicitly part of its public API. Make this explicit by choosing property names deliberately and documenting them.

The pattern: the component reads `var(--hx-{component}-{property}, fallback)`. Consumers override the property from outside. No `!important`, no deep selectors needed.

```typescript
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';

@customElement('hx-chip')
export class HelixChip extends LitElement {
  static override styles = [
    tokenStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: var(--hx-spacing-xs);
        padding: var(--hx-chip-padding, var(--hx-spacing-xs) var(--hx-spacing-sm));
        border-radius: var(--hx-chip-border-radius, var(--hx-border-radius-full));
        background: var(--hx-chip-bg, var(--hx-color-neutral-100));
        color: var(--hx-chip-color, var(--hx-color-neutral-800));
        border: 1px solid var(--hx-chip-border-color, var(--hx-color-neutral-300));
        font-size: var(--hx-chip-font-size, var(--hx-font-size-sm));
      }
    `,
  ];

  override render() {
    return html`<slot></slot>`;
  }
}
```

## Naming Convention

Component-level custom properties follow `--hx-{component}-{property}`:

```
--hx-button-bg
--hx-button-bg-hover
--hx-button-color
--hx-button-border-radius
--hx-chip-padding
--hx-chip-bg
--hx-input-border-color
--hx-input-border-color-focus
--hx-card-shadow
```

The component name segment matches the tag name without the `hx-` prefix. The property segment is a concise CSS property descriptor.

## Fallback Values

Always supply a fallback that references a HELiX token. This ensures the component looks correct with no consumer overrides and gives the consumer a clear indication of the default value:

```css
/* Structure: var(--hx-{component}-{prop}, var(--hx-{token})) */
background: var(--hx-button-bg, var(--hx-color-primary-500));
color:      var(--hx-button-color, var(--hx-color-neutral-0));
```

Avoid raw values as fallbacks — they circumvent the token system:

```css
/* Wrong — raw fallback bypasses tokens */
background: var(--hx-button-bg, #0f62fe);

/* Correct — fallback is a token */
background: var(--hx-button-bg, var(--hx-color-primary-500));
```

## Documenting with `@cssprop`

Every custom property a component reads should be documented with the `@cssprop` JSDoc tag. This enables documentation generators and IDE tooling to surface the API:

```typescript
/**
 * @cssprop --hx-chip-bg
 *   Background color of the chip.
 *   Default: `--hx-color-neutral-100`
 *
 * @cssprop --hx-chip-color
 *   Text color of the chip.
 *   Default: `--hx-color-neutral-800`
 *
 * @cssprop --hx-chip-border-color
 *   Border color of the chip.
 *   Default: `--hx-color-neutral-300`
 *
 * @cssprop --hx-chip-border-radius
 *   Corner radius of the chip.
 *   Default: `--hx-border-radius-full`
 *
 * @cssprop --hx-chip-padding
 *   Padding inside the chip.
 *   Default: `--hx-spacing-xs --hx-spacing-sm`
 *
 * @cssprop --hx-chip-font-size
 *   Font size of the chip label.
 *   Default: `--hx-font-size-sm`
 */
@customElement('hx-chip')
export class HelixChip extends LitElement { ... }
```

## Consumer Override Example

A consumer overrides chip properties without any knowledge of the component's internals:

```css
/* Global: danger variant */
hx-chip[variant="danger"] {
  --hx-chip-bg:           var(--hx-color-error-50);
  --hx-chip-color:        var(--hx-color-error-800);
  --hx-chip-border-color: var(--hx-color-error-300);
}

/* Scoped: chips inside a status bar */
.status-bar hx-chip {
  --hx-chip-border-radius: var(--hx-border-radius-sm);
  --hx-chip-font-size:     var(--hx-font-size-xs);
}

/* One-off: a specific instance */
#priority-chip {
  --hx-chip-bg:    var(--hx-color-warning-100);
  --hx-chip-color: var(--hx-color-warning-900);
}
```

## Internal vs Public Properties

Not every custom property inside a component stylesheet is part of the public API. Some are internal implementation details:

```css
:host {
  /* Public API — documented with @cssprop */
  background: var(--hx-chip-bg, var(--hx-color-neutral-100));
}

.icon {
  /* Internal — not part of public API, not documented */
  color: var(--_icon-color, currentColor);
}
```

Use the `--_` prefix convention for internal-only custom properties to signal they are not stable API.

## Multi-Value Properties

For shorthand properties like `padding`, expose the whole shorthand as one custom property rather than four individual ones:

```css
padding: var(--hx-button-padding, var(--hx-spacing-sm) var(--hx-spacing-md));
```

This gives consumers flexibility while keeping the API surface manageable.

## Next Steps

- [CSS Parts API](/components-guide/styling/css-parts/) — expose structural hooks for consumer stylesheets
- [Theming](/components-guide/styling/theming/) — global token overrides vs component-level style props
- [Design Tokens](/components-guide/styling/tokens/) — the token vocabulary used in fallbacks
