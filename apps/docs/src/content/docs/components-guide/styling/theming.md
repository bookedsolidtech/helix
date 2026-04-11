---
title: Theming
description: Override HELiX design tokens at the root or component level to create custom themes without touching component internals.
---

HELiX components are styled entirely through CSS custom properties. This makes theming straightforward: override the relevant tokens and every component that uses them updates immediately. No component source code needs to change.

## Global Theme via `:root`

Set token overrides on `:root` to change the look of every HELiX component on the page:

```css
:root {
  /* Replace the primary palette */
  --hx-color-primary-500: #7c3aed;
  --hx-color-primary-600: #6d28d9;
  --hx-color-primary-50:  #ede9fe;

  /* Adjust the base font family */
  --hx-font-family-sans: 'Inter', system-ui, sans-serif;

  /* Tighten corner radii */
  --hx-border-radius-sm: 2px;
  --hx-border-radius-md: 4px;
  --hx-border-radius-lg: 6px;
}
```

Because `@helixui/library` adopts tokens via `document.adoptedStyleSheets`, any CSS rule with higher specificity (including `:root` overrides) will cascade correctly.

## Component-Level Theming via Style Props

Many HELiX components expose component-specific CSS custom properties as a public styling API. These are sometimes called "style props" and follow the `--hx-{component}-{property}` naming pattern.

```css
/* Override just this one button's background */
hx-button.danger {
  --hx-button-bg: var(--hx-color-error-600);
  --hx-button-bg-hover: var(--hx-color-error-700);
  --hx-button-color: var(--hx-color-neutral-0);
}
```

Inside the component, those props cascade in over a token fallback:

```typescript
static override styles = css`
  button {
    background: var(--hx-button-bg, var(--hx-color-primary-500));
    color: var(--hx-button-color, var(--hx-color-neutral-0));
  }

  button:hover {
    background: var(--hx-button-bg-hover, var(--hx-color-primary-600));
  }
`;
```

## Documenting Style Props with `@cssprop`

Document every component-level custom property using the `@cssprop` JSDoc tag. Tooling and automated documentation generators pick this up:

```typescript
/**
 * @cssprop --hx-button-bg - Background color of the button.
 *   Defaults to `--hx-color-primary-500`.
 * @cssprop --hx-button-bg-hover - Background color on hover.
 *   Defaults to `--hx-color-primary-600`.
 * @cssprop --hx-button-color - Text color of the button.
 *   Defaults to `--hx-color-neutral-0`.
 * @cssprop --hx-button-border-radius - Corner radius.
 *   Defaults to `--hx-border-radius-sm`.
 */
@customElement('hx-button')
export class HelixButton extends LitElement { ... }
```

## Semantic Token Layer

HELiX tokens operate as a semantic layer over raw primitives. This means you never need to reference a raw hex value — you reference a semantic token whose value may itself be a reference to a lower-level primitive.

```
Consumer CSS override
  ↓
Component style prop  (--hx-button-bg)
  ↓
HELiX semantic token  (--hx-color-primary-500)
  ↓
Primitive value       (#0f62fe)
```

Overriding a semantic token in `:root` changes the meaning everywhere that semantic is used, which is powerful for brand-level theming.

## Theme Switching at Runtime

Toggle between themes by swapping a class or data attribute on the root element. Components re-style without a page reload because CSS custom properties are live.

```typescript
// Set a data attribute to activate an alternate theme
function setTheme(theme: 'default' | 'high-contrast' | 'brand-purple') {
  document.documentElement.dataset.theme = theme;
}

// Trigger theme change
setTheme('brand-purple');
```

Define the alternate tokens scoped to the attribute selector:

```css
[data-theme="brand-purple"] {
  --hx-color-primary-500: #7c3aed;
  --hx-color-primary-600: #6d28d9;
  --hx-color-primary-50:  #ede9fe;
  --hx-font-family-sans:  'Inter', system-ui, sans-serif;
}

[data-theme="high-contrast"] {
  --hx-color-primary-500: #000000;
  --hx-color-neutral-900: #000000;
  --hx-color-neutral-0:   #ffffff;
  --hx-border-width-sm:   2px;
}
```

## Scoping Themes to a Subtree

Themes do not have to be global. Apply overrides to any ancestor element to scope the theme to that subtree only:

```html
<div class="purple-section">
  <hx-button>Themed button</hx-button>
  <hx-card>Themed card</hx-card>
</div>

<hx-button>Default button</hx-button>
```

```css
.purple-section {
  --hx-color-primary-500: #7c3aed;
  --hx-color-primary-600: #6d28d9;
}
```

CSS custom properties inherit through the DOM tree, including across shadow DOM boundaries, so the override reaches inside every component nested within `.purple-section`.

## Next Steps

- [Design Tokens](/components-guide/styling/tokens/) — token categories and naming conventions
- [CSS Custom Properties API](/components-guide/styling/css-custom-properties/) — expose style props on your own components
- [Dark Mode](/components-guide/styling/dark-mode/) — light and dark theme implementation
