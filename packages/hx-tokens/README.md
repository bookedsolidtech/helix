# @helix/tokens

**Design tokens for the HELiX component library** — a structured set of CSS custom properties, JavaScript constants, and Lit CSS utilities that power the `@helix/library` components.

[![npm version](https://img.shields.io/npm/v/@helix/tokens)](https://www.npmjs.com/package/@helix/tokens)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
npm install @helix/tokens
```

> **Note:** This package is automatically installed as a dependency of `@helix/library`. You only need to install it directly if you are consuming tokens without the component library.

---

## Usage

### JavaScript / TypeScript (token constants)

```js
import { tokens } from '@helix/tokens';

console.log(tokens.colorPrimary); // '#0057b8'
```

### Lit CSS utilities (for Lit component authors)

```ts
import { css } from 'lit';
import { colorPrimary, spacingMd } from '@helix/tokens/lit';

const styles = css`
  :host {
    color: ${colorPrimary};
    padding: ${spacingMd};
  }
`;
```

### CSS custom properties (global stylesheet)

```js
import '@helix/tokens/css';
```

Or in CSS:

```css
@import '@helix/tokens/tokens.css';

.my-element {
  color: var(--hx-color-primary);
  padding: var(--hx-spacing-md);
}
```

### JSON token source

```js
import tokens from '@helix/tokens/tokens.json';
```

Useful for build tooling, style dictionaries, or design tool integrations.

### Utility helpers

```js
import { toCssVar, resolveToken } from '@helix/tokens/utils';

toCssVar('color-primary'); // 'var(--hx-color-primary)'
```

---

## Export Paths

| Import path | Contents |
|---|---|
| `@helix/tokens` | JavaScript token constants (default export) |
| `@helix/tokens/lit` | Lit CSS tagged template values |
| `@helix/tokens/css` | Side-effect import — injects CSS custom properties |
| `@helix/tokens/tokens.css` | Raw CSS file with all `--hx-*` custom properties |
| `@helix/tokens/tokens.json` | Source token definitions as JSON |
| `@helix/tokens/utils` | Helper utilities (`toCssVar`, etc.) |

---

## Token Categories

All CSS custom properties use the `--hx-` prefix:

- **Color** — `--hx-color-primary`, `--hx-color-neutral-*`, `--hx-color-error`, etc.
- **Spacing** — `--hx-spacing-xs` through `--hx-spacing-2xl`
- **Typography** — `--hx-font-family-base`, `--hx-font-size-*`, `--hx-font-weight-*`
- **Border** — `--hx-border-radius-*`, `--hx-border-width-*`
- **Shadow** — `--hx-shadow-sm`, `--hx-shadow-md`, `--hx-shadow-lg`
- **Motion** — `--hx-duration-fast`, `--hx-easing-standard`
- **Z-index** — `--hx-z-dropdown`, `--hx-z-modal`, `--hx-z-toast`

---

## Theming

Override semantic tokens at the `:root` level to apply a custom theme across all HELiX components:

```css
:root {
  --hx-color-primary: #005eb8;
  --hx-color-primary-hover: #004f9f;
  --hx-font-family-base: 'Roboto', sans-serif;
}
```

---

## Documentation

Full token reference and theming guide:

> **Docs site coming soon**

---

## License

MIT
