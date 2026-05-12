# @helixui/tokens

**Design tokens for the HELiX component library** — a structured set of CSS custom properties, JavaScript constants, and Lit CSS utilities that power the `@helixui/library` components.

[![npm version](https://img.shields.io/npm/v/@helixui/tokens)](https://www.npmjs.com/package/@helixui/tokens)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

---

## Installation

```bash
npm install @helixui/tokens
```

> **Note:** This package is automatically installed as a dependency of `@helixui/library`. You only need to install it directly if you are consuming tokens without the component library.

---

## Usage

### JavaScript / TypeScript (token constants)

The default entry exports the nested token JSON plus the flattened `tokenEntries` / `darkTokenEntries` / `highContrastTokenEntries` arrays. Look up a value by category path:

```js
import tokens from '@helixui/tokens';

console.log(tokens.color.primary['700'].value); // '#0F6363'
```

Each `tokenEntries[i]` has `{ name, value, category, path }` — useful for documentation tooling and dynamic theming.

### Lit CSS utilities (for Lit component authors)

The Lit export ships pre-composed `CSSResult` blocks (light / dark / high-contrast). Token names themselves are emitted as CSS custom properties — reference them via `var()` in Lit's `css\`\`` template:

```ts
import { css } from 'lit';

const styles = css`
  :host {
    color: var(--hx-color-primary-700);
    padding: var(--hx-space-4);
  }
`;
```

> **Note:** Since `@helixui/library@2.1.0`, tokens are adopted at the document level via `document.adoptedStyleSheets` and inherit through Shadow DOM. The `tokenStyles` / `darkTokenStyles` / `highContrastTokenStyles` exports from `@helixui/tokens/lit` are marked `@deprecated` and remain only for isolated test fixtures and iframe contexts.

### CSS custom properties (global stylesheet)

`@helixui/tokens/css` exports CSS **strings** (`tokensCSS`, `darkMediaCSS`, `darkManualCSS`) — it is not a side-effect entry. For side-effect adoption, load `@helixui/library` (which adopts the document-level stylesheet automatically) or `@import` the raw stylesheet:

```css
@import '@helixui/tokens/tokens.css';

.my-element {
  color: var(--hx-color-primary-700);
  padding: var(--hx-space-4);
}
```

### JSON token source

```js
import tokens from '@helixui/tokens/tokens.json';
```

Useful for build tooling, style dictionaries, or design tool integrations.

### Utility helpers

```js
import { getTokensByPrefix, getColorSubgroups, getTokenStats } from '@helixui/tokens/utils';
import { tokenEntries } from '@helixui/tokens';

const spacing = getTokensByPrefix(tokenEntries, '--hx-space-');
```

The `utils` entry exposes filter/group/stats helpers over `TokenEntry[]` — there are no `toCssVar` / `resolveToken` helpers; emit `var(--hx-…)` literals directly.

---

## Export Paths

| Import path                     | Contents                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `@helixui/tokens`               | Nested token JSON (default) + flattened `tokenEntries` / `darkTokenEntries` / `highContrastTokenEntries`                     |
| `@helixui/tokens/lit`           | `tokenStyles`, `darkTokenStyles`, `highContrastTokenStyles` (Lit `CSSResult`; **deprecated** since `@helixui/library@2.1.0`) |
| `@helixui/tokens/css`           | `tokensCSS`, `darkMediaCSS`, `darkManualCSS` — pre-built CSS strings (no side effects)                                       |
| `@helixui/tokens/tokens.css`    | Raw CSS file with all `--hx-*` custom properties (load via `@import` or `<link>`)                                            |
| `@helixui/tokens/tokens.json`   | Source token definitions as JSON                                                                                             |
| `@helixui/tokens/utils`         | `getTokensByPrefix`, `getColorSubgroups`, `getTokenStats` helpers over `TokenEntry[]`                                        |
| `@helixui/tokens/contrast-data` | Generated AAA contrast report                                                                                                |

Side-effect adoption (`document.adoptedStyleSheets`) lives in `@helixui/library`'s `ensureDocumentTokens` — load the library or `@import` the raw stylesheet to apply tokens globally.

---

## Token Categories

All CSS custom properties use the `--hx-` prefix:

- **Color** — primitives like `--hx-color-primary-{50…900}`, `--hx-color-neutral-*`, plus action-layer semantics like `--hx-color-action-primary-bg`, `--hx-color-text-primary`, `--hx-color-surface-default`
- **Spacing** — `--hx-space-1` through `--hx-space-48` (numeric step scale, `--hx-space-4 = 1rem`)
- **Typography** — `--hx-font-family-sans`, `--hx-font-size-*`, `--hx-font-weight-*`
- **Border** — `--hx-border-radius-*`, `--hx-border-width-*`
- **Shadow** — `--hx-shadow-sm`, `--hx-shadow-md`, `--hx-shadow-lg`
- **Motion** — `--hx-duration-fast`, `--hx-easing-standard`
- **Z-index** — `--hx-z-index-dropdown`, `--hx-z-index-modal`, `--hx-z-index-toast`, `--hx-z-index-popover`, `--hx-z-index-backdrop`, `--hx-z-index-sticky`, `--hx-z-index-fixed`, `--hx-z-index-tooltip`, `--hx-z-index-base`

---

## Theming

Override semantic tokens at the `:root` level to apply a custom theme across all HELiX components:

```css
:root {
  --hx-color-action-primary-bg: #005eb8;
  --hx-color-action-primary-bg-hover: #004f9f;
  --hx-font-family-sans: 'Roboto', sans-serif;
}
```

---

## Documentation

Full token reference and theming guide:

> **Docs site coming soon**

---

## License

MIT
