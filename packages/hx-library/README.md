# @helixui/library

**Enterprise Web Component Library** built with [Lit 3.x](https://lit.dev/), TypeScript, and Shadow DOM — designed for healthcare applications where accessibility and reliability are non-negotiable.

[![npm version](https://img.shields.io/npm/v/@helixui/library)](https://www.npmjs.com/package/@helixui/library)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

---

## Installation

```bash
npm install @helixui/library @helixui/icons @floating-ui/dom
```

`@helixui/icons` and `@floating-ui/dom` are declared as **peer dependencies** — every consumer must install them. Design tokens (`@helixui/tokens`) and `lit` ship as runtime dependencies and are installed automatically.

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

### CDN

The published distribution imports `lit` and `@helixui/icons` from bare specifiers, so a CDN load needs an **import map** to resolve them:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "@helixui/icons": "https://cdn.jsdelivr.net/npm/@helixui/icons@1/dist/index.js",
      "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1/+esm"
    }
  }
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@helixui/library@3/dist/index.js"></script>
```

For production loads, pin the major+minor (e.g. `@3.9`) and pair every CDN URL with an [SRI integrity hash](https://www.srihash.org). See the installation guide in the docs site for the full pattern.

---

## Components

`packages/hx-library/src/components/` ships **81 component directories** that register **102 custom elements** (some components — `hx-tabs`, `hx-accordion`, `hx-tree-view`, `hx-data-table`, etc. — register multiple related elements like `hx-tab` + `hx-tab-panel`).

The table below is a curated selection of the most commonly consumed elements; see [`custom-elements.json`](./custom-elements.json) for the authoritative inventory.

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

## Design Tokens

All components consume design tokens from `@helixui/tokens` via CSS custom properties. Override at the semantic level to theme your application:

```css
:root {
  --hx-color-action-primary-bg: #0057b8;
  --hx-color-action-primary-bg-hover: #004a9e;
  --hx-space-4: 1rem;
  --hx-font-family-sans: 'Inter', sans-serif;
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

- **Docs site:** [helixui.dev](https://helixui.dev) (Astro Starlight — prose, integration guides, AAA verdicts)
- **Storybook:** [storybook.helixui.dev](https://storybook.helixui.dev) (CEM-driven autodocs, every variant, interaction tests)

---

## Accessibility — self-certification limits

HELiX claims **WCAG 2.2 Level AAA** on its P0 component surface. That claim is **self-certified
by the project maintainers** via an open-source formal harness whose source, methodology, and
per-component evidence is all in this repository. It is **not** a third-party VPAT 2.5 attestation
signed by an accredited accessibility firm (Deque, TPGi, Level Access, etc.).

What that means in practice:

- **Cert authority.** `scripts/aaa-formal-audit.mjs` is the canonical AAA cert source. It
  sources every success criterion from `scripts/aaa-standards.json` (with verified W3C URLs) and
  produces VPAT 2.5 verdicts (Supports / Partially Supports / Does Not Support / Not Applicable)
  backed by measured evidence per (component × criterion).
- **Scope.** The harness measures each P0 component against its **Default story** in Storybook
  across **11 criteria** — 9 WCAG 2.2 AAA success criteria (1.4.6, 1.4.9, 2.1.3, 2.3.3, 2.4.12,
  2.4.13, 2.5.5, 3.2.5, 3.3.6) plus 2 peer standards (forced-colors mode, APG-aligned keyboard
  contract). Variant coverage (every story state for every component) is asserted by a separate
  visual-rendering harness (`scripts/audit-stories.mjs`).
- **Evidence trail.** Per-component verdicts and the measurements behind them are recorded in
  `packages/hx-library/src/components/<name>/AAA-AUDIT.md`, the verdict matrix in
  `.reports/formal-aaa-audit/audit.matrix.md`, and the full machine-readable JSON in
  `.reports/formal-aaa-audit/audit.json`. The slim verdicts snapshot consumed by the docs site
  ships in this package as `aaa-verdicts.json`.
- **Honest limits.** Where the harness surfaces a real gap, the verdict would be published as
  Partially Supports (or Does Not Support) with the evidence prose explaining what's missing.
  The 3.9.0 release surfaces **0 Partial / 0 Fail** verdicts across the 44 P0 components × 11
  criteria measured — every criterion resolves to Supports or Not Applicable. `hx-slider` and
  `hx-file-upload` previously surfaced WCAG 3.3.6 Partial verdicts; both have since been
  remediated with `ElementInternals` + `setValidity`, and `aaa-verdicts.json` records the
  Supports verdicts with the form-association evidence.
- **axe-core gap.** axe-core PR #5080 (unmerged) means ElementInternals-attached ARIA on
  form-associated components is not visible to axe's rule engine. The harness uses DOM-level
  fallback assertions where this matters. See `apps/docs/src/content/docs/accessibility/axe-element-internals-gap.mdx`
  for the documented policy.
- **When you need a VPAT attestation.** Self-cert is appropriate for an OSS component library;
  it is not appropriate when an enterprise procurement process requires a VPAT signed by an
  external auditor. The harness output and per-component evidence here is the starting evidence
  package — every measurement is reproducible from the repo, every citation links to the W3C
  source, every component's evidence trail is versioned. A third-party auditor reading this would
  have substantial completed work before opening a browser.

---

## License

MIT
