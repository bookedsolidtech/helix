# @helixui/library

[![npm version](https://img.shields.io/npm/v/@helixui/library.svg)](https://www.npmjs.com/package/@helixui/library)
[![npm downloads](https://img.shields.io/npm/dm/@helixui/library.svg)](https://www.npmjs.com/package/@helixui/library)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@helixui/library)](https://bundlephobia.com/package/@helixui/library)

Enterprise healthcare web component library built with Lit 3.x.

## Installation

```bash
npm install @helixui/library
```

## Quick Start

```html
<!doctype html>
<html lang="en">
  <head>
    <script type="module">
      import '@helixui/library/components/hx-button';
      import '@helixui/library/components/hx-alert';
    </script>
  </head>
  <body>
    <hx-alert variant="success">Patient record saved.</hx-alert>
    <hx-button variant="primary">Confirm</hx-button>
  </body>
</html>
```

## Usage

### Full Bundle

```js
import '@helixui/library';
```

### Per-Component (Tree-Shaking)

Import only what you need for optimal bundle size:

```js
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-dialog';
```

### CDN (jsDelivr)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@helixui/library/dist/index.js"></script>
```

### CDN (unpkg)

```html
<script type="module" src="https://unpkg.com/@helixui/library/dist/index.js"></script>
```

## Framework Compatibility

`@helixui/library` components are standard Custom Elements — they work anywhere HTML works.

| Framework   | Support |
| ----------- | ------- |
| Vanilla JS  | ✅      |
| React 19+   | ✅      |
| Vue 3       | ✅      |
| Angular     | ✅      |
| Svelte      | ✅      |
| Drupal/Twig | ✅      |

**React (< 19):** Use `ref` to access the element and set properties programmatically, or wrap with `@lit/react`.

**Drupal/Twig:**

```twig
<hx-button variant="primary">{{ label }}</hx-button>
```

## Components

| Component        | Tag                     | Description                                            |
| ---------------- | ----------------------- | ------------------------------------------------------ |
| Accordion        | `<hx-accordion>`        | Collapsible content sections                           |
| Action Bar       | `<hx-action-bar>`       | Toolbar for contextual actions                         |
| Alert            | `<hx-alert>`            | Inline status messages (info, success, warning, error) |
| Avatar           | `<hx-avatar>`           | User or entity representation with image or initials   |
| Badge            | `<hx-badge>`            | Small count or status indicator                        |
| Breadcrumb       | `<hx-breadcrumb>`       | Hierarchical navigation trail                          |
| Button           | `<hx-button>`           | Primary interaction element with multiple variants     |
| Button Group     | `<hx-button-group>`     | Grouped set of related buttons                         |
| Card             | `<hx-card>`             | Surface container for grouped content                  |
| Carousel         | `<hx-carousel>`         | Scrollable slideshow of content items                  |
| Checkbox         | `<hx-checkbox>`         | Single boolean form control                            |
| Checkbox Group   | `<hx-checkbox-group>`   | Collection of related checkboxes                       |
| Code Snippet     | `<hx-code-snippet>`     | Formatted inline or block code display                 |
| Color Picker     | `<hx-color-picker>`     | Visual color selection control                         |
| Combobox         | `<hx-combobox>`         | Filterable select with autocomplete                    |
| Container        | `<hx-container>`        | Max-width layout wrapper                               |
| Copy Button      | `<hx-copy-button>`      | One-click clipboard copy trigger                       |
| Data Table       | `<hx-data-table>`       | Sortable, paginated tabular data display               |
| Date Picker      | `<hx-date-picker>`      | Calendar-based date selection control                  |
| Dialog           | `<hx-dialog>`           | Modal overlay with focus trapping                      |
| Divider          | `<hx-divider>`          | Horizontal or vertical separator                       |
| Drawer           | `<hx-drawer>`           | Side panel overlay (start/end)                         |
| Dropdown         | `<hx-dropdown>`         | Anchored floating content panel                        |
| Field            | `<hx-field>`            | Form field wrapper with label and validation           |
| Field Label      | `<hx-field-label>`      | Accessible label for form controls                     |
| File Upload      | `<hx-file-upload>`      | Drag-and-drop or click-to-browse file input            |
| Format Date      | `<hx-format-date>`      | Locale-aware date formatter                            |
| Form             | `<hx-form>`             | Form wrapper with validation coordination              |
| Grid             | `<hx-grid>`             | CSS grid layout primitive                              |
| Help Text        | `<hx-help-text>`        | Descriptive hint text for form fields                  |
| Icon             | `<hx-icon>`             | SVG icon renderer                                      |
| Image            | `<hx-image>`            | Lazy-loading image with fallback                       |
| Link             | `<hx-link>`             | Accessible anchor with consistent styling              |
| List             | `<hx-list>`             | Ordered and unordered list component                   |
| Menu             | `<hx-menu>`             | Navigational or action menu                            |
| Meter            | `<hx-meter>`            | Scalar measurement within a range                      |
| Nav              | `<hx-nav>`              | Generic navigation landmark                            |
| Number Input     | `<hx-number-input>`     | Numeric form control with step controls                |
| Overflow Menu    | `<hx-overflow-menu>`    | Collapsed actions behind a trigger                     |
| Pagination       | `<hx-pagination>`       | Page navigation for long lists                         |
| Popover          | `<hx-popover>`          | Anchored informational overlay                         |
| Popup            | `<hx-popup>`            | Low-level floating positioning primitive               |
| Progress Bar     | `<hx-progress-bar>`     | Linear task completion indicator                       |
| Progress Ring    | `<hx-progress-ring>`    | Circular task completion indicator                     |
| Prose            | `<hx-prose>`            | Styled long-form rich text container                   |
| Radio Group      | `<hx-radio-group>`      | Mutually exclusive option selection                    |
| Rating           | `<hx-rating>`           | Star-based rating input                                |
| Select           | `<hx-select>`           | Native-style single/multi option picker                |
| Side Nav         | `<hx-side-nav>`         | Vertical navigation sidebar                            |
| Skeleton         | `<hx-skeleton>`         | Loading placeholder with shimmer animation             |
| Slider           | `<hx-slider>`           | Range value selection control                          |
| Spinner          | `<hx-spinner>`          | Indeterminate loading indicator                        |
| Split Button     | `<hx-split-button>`     | Primary action with secondary dropdown                 |
| Split Panel      | `<hx-split-panel>`      | Resizable two-pane layout divider                      |
| Stack            | `<hx-stack>`            | Vertical or horizontal flexbox layout primitive        |
| Status Indicator | `<hx-status-indicator>` | Color-coded operational status dot                     |
| Steps            | `<hx-steps>`            | Multi-step process progress indicator                  |
| Structured List  | `<hx-structured-list>`  | Label/value pair display list                          |
| Switch           | `<hx-switch>`           | Toggle on/off boolean control                          |
| Tabs             | `<hx-tabs>`             | Tabbed panel navigation                                |
| Tag              | `<hx-tag>`              | Removable label or category chip                       |
| Text             | `<hx-text>`             | Typography primitive with semantic variants            |
| Text Input       | `<hx-text-input>`       | Single-line text form control                          |
| Textarea         | `<hx-textarea>`         | Multi-line text form control                           |
| Theme            | `<hx-theme>`            | Design token theme scope provider                      |
| Time Picker      | `<hx-time-picker>`      | Clock-based time selection control                     |
| Toast            | `<hx-toast>`            | Non-blocking transient notification                    |
| Toggle Button    | `<hx-toggle-button>`    | Pressed/unpressed stateful button                      |
| Tooltip          | `<hx-tooltip>`          | Hover or focus contextual label                        |
| Top Nav          | `<hx-top-nav>`          | Primary horizontal navigation bar                      |
| Tree View        | `<hx-tree-view>`        | Hierarchical expandable data tree                      |
| Visually Hidden  | `<hx-visually-hidden>`  | Accessible-only content, invisible to sighted users    |

## Design Tokens

Components are styled via CSS custom properties from the companion [`@helixui/tokens`](https://www.npmjs.com/package/@helixui/tokens) package. Install it to apply the Helix design system theme:

```bash
npm install @helixui/tokens
```

```js
import '@helixui/tokens';
```

Override tokens at any scope:

```css
:root {
  --hx-color-primary: #0055cc;
  --hx-spacing-md: 1rem;
}
```

Use `<hx-theme>` to scope overrides to a subtree:

```html
<hx-theme class="dark-theme">
  <hx-button>Themed Button</hx-button>
</hx-theme>
```

## Links

- [Documentation](https://helix.bookedsolid.com)
- [Storybook](https://helix.bookedsolid.com/storybook)
- [GitHub](https://github.com/bookedsolidtech/helix)
- [npm — @helixui/library](https://www.npmjs.com/package/@helixui/library)
- [npm — @helixui/tokens](https://www.npmjs.com/package/@helixui/tokens)
- [Contributing Guide](https://github.com/bookedsolidtech/helix/blob/main/CONTRIBUTING.md)
- [Issue Tracker](https://github.com/bookedsolidtech/helix/issues)

## License

MIT © [Booked Solid Tech](https://github.com/bookedsolidtech)
