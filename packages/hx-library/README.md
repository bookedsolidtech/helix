# @helixui/library

**Enterprise Web Component Library** built with [Lit 3.x](https://lit.dev/), TypeScript, and Shadow DOM — designed for healthcare applications where accessibility and reliability are non-negotiable.

[![npm version](https://img.shields.io/npm/v/@helixui/library)](https://www.npmjs.com/package/@helixui/library)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
npm install @helixui/library
```

Design tokens are included automatically as a dependency via `@helixui/tokens`.

---

## Usage

### Barrel import (all components)

```js
import '@helixui/library';
```

### Per-component import (recommended for tree-shaking)

```js
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
import '@helixui/library/components/hx-text-input';
```

### HTML / Twig (after script load)

```html
<hx-button variant="primary">Save</hx-button>

<hx-text-input label="Patient Name" required></hx-text-input>

<hx-alert variant="warning">Please review before submitting.</hx-alert>
```

### CDN (placeholder — coming soon)

```html
<script type="module" src="https://cdn.example.com/@helixui/library/dist/index.js"></script>
```

---

## Components

73 component directories, 85 custom elements total.

| Component        | Tag                     |
| ---------------- | ----------------------- |
| Accordion        | `<hx-accordion>`        |
| Action Bar       | `<hx-action-bar>`       |
| Alert            | `<hx-alert>`            |
| Avatar           | `<hx-avatar>`           |
| Badge            | `<hx-badge>`            |
| Breadcrumb       | `<hx-breadcrumb>`       |
| Button           | `<hx-button>`           |
| Button Group     | `<hx-button-group>`     |
| Card             | `<hx-card>`             |
| Carousel         | `<hx-carousel>`         |
| Checkbox         | `<hx-checkbox>`         |
| Checkbox Group   | `<hx-checkbox-group>`   |
| Code Snippet     | `<hx-code-snippet>`     |
| Color Picker     | `<hx-color-picker>`     |
| Combobox         | `<hx-combobox>`         |
| Container        | `<hx-container>`        |
| Copy Button      | `<hx-copy-button>`      |
| Data Table       | `<hx-data-table>`       |
| Date Picker      | `<hx-date-picker>`      |
| Dialog           | `<hx-dialog>`           |
| Divider          | `<hx-divider>`          |
| Drawer           | `<hx-drawer>`           |
| Dropdown         | `<hx-dropdown>`         |
| Field            | `<hx-field>`            |
| Field Label      | `<hx-field-label>`      |
| File Upload      | `<hx-file-upload>`      |
| Form             | `<hx-form>`             |
| Format Date      | `<hx-format-date>`      |
| Grid             | `<hx-grid>`             |
| Help Text        | `<hx-help-text>`        |
| Icon             | `<hx-icon>`             |
| Image            | `<hx-image>`            |
| Link             | `<hx-link>`             |
| List             | `<hx-list>`             |
| Menu             | `<hx-menu>`             |
| Meter            | `<hx-meter>`            |
| Nav              | `<hx-nav>`              |
| Number Input     | `<hx-number-input>`     |
| Overflow Menu    | `<hx-overflow-menu>`    |
| Pagination       | `<hx-pagination>`       |
| Popover          | `<hx-popover>`          |
| Popup            | `<hx-popup>`            |
| Progress Bar     | `<hx-progress-bar>`     |
| Progress Ring    | `<hx-progress-ring>`    |
| Prose            | `<hx-prose>`            |
| Radio Group      | `<hx-radio-group>`      |
| Rating           | `<hx-rating>`           |
| Select           | `<hx-select>`           |
| Side Nav         | `<hx-side-nav>`         |
| Skeleton         | `<hx-skeleton>`         |
| Slider           | `<hx-slider>`           |
| Spinner          | `<hx-spinner>`          |
| Split Button     | `<hx-split-button>`     |
| Split Panel      | `<hx-split-panel>`      |
| Stack            | `<hx-stack>`            |
| Status Indicator | `<hx-status-indicator>` |
| Steps            | `<hx-steps>`            |
| Structured List  | `<hx-structured-list>`  |
| Switch           | `<hx-switch>`           |
| Tabs             | `<hx-tabs>`             |
| Tag              | `<hx-tag>`              |
| Text             | `<hx-text>`             |
| Text Input       | `<hx-text-input>`       |
| Textarea         | `<hx-textarea>`         |
| Theme            | `<hx-theme>`            |
| Time Picker      | `<hx-time-picker>`      |
| Toast            | `<hx-toast>`            |
| Toggle Button    | `<hx-toggle-button>`    |
| Tooltip          | `<hx-tooltip>`          |
| Top Nav          | `<hx-top-nav>`          |
| Tree View        | `<hx-tree-view>`        |
| Visually Hidden  | `<hx-visually-hidden>`  |

---

## FOUC Prevention

Web components are unstyled until their JavaScript registers. To prevent the flash of unstyled content (FOUC), load the included CSS in your `<head>` before any JS:

```html
<link rel="stylesheet" href="@helixui/library/fouc.css" />
<script type="module" src="@helixui/library"></script>
```

Or import it in your bundler entry point:

```js
import '@helixui/library/fouc.css';
```

This hides all `hx-*` elements with `opacity: 0` until they are defined, then fades them in with a 150ms transition. It also provides structural fallbacks (`display: block`, `min-height`) for layout-critical components like `hx-top-nav`, `hx-container`, and `hx-side-nav` to prevent layout shift.

**Size:** ~1.4KB minified, ~554 bytes gzipped.

---

## Design Tokens

All components consume design tokens from `@helixui/tokens` via CSS custom properties. Override at the semantic level to theme your application:

```css
:root {
  --hx-color-primary: #0057b8;
  --hx-color-primary-hover: #004a9e;
  --hx-spacing-md: 1rem;
  --hx-font-family-base: 'Inter', sans-serif;
}
```

See the [@helixui/tokens](../hx-tokens/README.md) package for the full token reference.

---

## Framework Support

Components are standard Custom Elements and work in any framework:

- **Vanilla HTML / Twig** — drop in `<script type="module">` and use tags directly
- **React** — use via `@lit/react` wrappers or directly in JSX
- **Vue** — works out of the box with `compilerOptions.isCustomElement`
- **Angular** — add `CUSTOM_ELEMENTS_SCHEMA` to your module
- **Drupal** — attach via Drupal behaviors; compatible with Twig templates

---

## Documentation

Full component docs, API reference, and Storybook playground:

> **Docs site coming soon**

---

## License

MIT
