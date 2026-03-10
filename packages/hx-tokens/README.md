# @helixui/tokens

[![npm version](https://img.shields.io/npm/v/@helixui/tokens)](https://www.npmjs.com/package/@helixui/tokens)
[![npm downloads](https://img.shields.io/npm/dm/@helixui/tokens)](https://www.npmjs.com/package/@helixui/tokens)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)

Design tokens for the HELiX enterprise healthcare component library.

---

## Installation

```bash
npm install @helixui/tokens
```

---

## Usage

### CSS custom properties

```js
import '@helixui/tokens/css';
```

Injects all `--hx-*` custom properties into the document. Then use them anywhere in your CSS:

```css
.my-element {
  color: var(--hx-color-primary-500);
  padding: var(--hx-spacing-md);
}
```

### Lit (Shadow DOM)

```ts
import { tokenStyles } from '@helixui/tokens/lit';

class MyComponent extends LitElement {
  static styles = [tokenStyles, css`...`];
}
```

Provides a `CSSResult` containing all `--hx-*` custom properties — ready for Shadow DOM adoption.

### JavaScript / TypeScript

```ts
import { tokens } from '@helixui/tokens';

console.log(tokens.color.primary[500].value); // '#2563EB'
```

Fully typed token objects — no magic strings.

### JSON

```js
import tokens from '@helixui/tokens/tokens.json';
```

Raw token definitions for build tooling, style dictionaries, or design tool integrations.

---

## Export Paths

| Import path                   | Contents                                           |
| ----------------------------- | -------------------------------------------------- |
| `@helixui/tokens`             | TypeScript token objects                           |
| `@helixui/tokens/lit`         | Lit `CSSResult` for Shadow DOM adoption            |
| `@helixui/tokens/css`         | Side-effect import — injects CSS custom properties |
| `@helixui/tokens/tokens.css`  | Raw CSS file with all `--hx-*` custom properties   |
| `@helixui/tokens/tokens.json` | Source token definitions as JSON                   |

---

## Token Categories

All CSS custom properties use the `--hx-` prefix:

| Category       | Example tokens                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Color**      | `--hx-color-primary-500`, `--hx-color-neutral-100`, `--hx-color-error-500`                                        |
| **Spacing**    | `--hx-spacing-xs`, `--hx-spacing-sm`, `--hx-spacing-md`, `--hx-spacing-lg`, `--hx-spacing-xl`, `--hx-spacing-2xl` |
| **Typography** | `--hx-font-family-base`, `--hx-font-size-sm`, `--hx-font-weight-medium`                                           |
| **Border**     | `--hx-border-radius-sm`, `--hx-border-radius-md`, `--hx-border-width-base`                                        |
| **Shadow**     | `--hx-shadow-sm`, `--hx-shadow-md`, `--hx-shadow-lg`                                                              |
| **Motion**     | `--hx-duration-fast`, `--hx-duration-base`, `--hx-easing-standard`                                                |
| **Z-index**    | `--hx-z-dropdown`, `--hx-z-modal`, `--hx-z-toast`                                                                 |

---

## Dark Mode

Two dark mode strategies are available:

```js
// Auto — respects prefers-color-scheme
import '@helixui/tokens/tokens-dark-auto.css';

// Manual — activate by adding class="dark" to <html>
import '@helixui/tokens/tokens-dark-manual.css';
```

---

## Drupal / Twig Integration

HELiX tokens ship as CSS custom properties, making them compatible with any Twig template. After loading the token stylesheet via a Drupal library, use the `--hx-*` variables directly:

```twig
{# my-block.html.twig #}
<div class="my-block" style="color: var(--hx-color-primary-500);">
  {{ content }}
</div>
```

Or override tokens per-theme in your Drupal theme CSS:

```css
:root {
  --hx-color-primary-500: #005eb8;
}
```

---

## Companion Package

This package provides the design token foundation for the HELiX component library:

- **[`@helixui/library`](https://www.npmjs.com/package/@helixui/library)** — Pre-built Lit 3.x web components for enterprise healthcare UIs

---

## Links

- [GitHub](https://github.com/bookedsolidtech/helix)
- [Documentation](https://helix.bookedsolid.com)
- [npm](https://www.npmjs.com/package/@helixui/tokens)
- [Issues](https://github.com/bookedsolidtech/helix/issues)

---

## License

MIT
