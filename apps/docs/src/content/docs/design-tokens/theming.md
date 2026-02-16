---
title: Theming
description: How to apply and create themes with HELIX design tokens
---

HELIX supports Light and Dark themes through the design token system. Themes work by swapping Semantic token values while Primitive and Component tokens remain unchanged.

## Light Theme (Default)

The light theme is the default. Semantic tokens point to light Primitive values:

```css
:root {
  --hx-color-text-primary: var(--hx-color-neutral-900);
  --hx-color-text-secondary: var(--hx-color-neutral-600);
  --hx-color-text-muted: var(--hx-color-neutral-500);
  --hx-color-text-link: var(--hx-color-primary-600);

  --hx-color-surface-default: var(--hx-color-neutral-0);
  --hx-color-surface-raised: var(--hx-color-neutral-50);
  --hx-color-surface-sunken: var(--hx-color-neutral-100);

  --hx-color-border-default: var(--hx-color-neutral-200);
  --hx-color-border-subtle: var(--hx-color-neutral-100);

  --hx-body-bg: var(--hx-color-surface-default);
  --hx-body-color: var(--hx-color-text-primary);

  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
```

## Dark Theme

Dark mode overrides swap Semantic tokens to darker Primitive values. HELIX supports two activation methods.

### Method 1: Manual attribute

Apply `data-theme="dark"` to the document root for explicit control:

```html
<html data-theme="dark"></html>
```

```css
:root[data-theme='dark'] {
  --hx-color-text-primary: var(--hx-color-neutral-100);
  --hx-color-text-secondary: var(--hx-color-neutral-300);
  --hx-color-text-muted: var(--hx-color-neutral-400);
  --hx-color-text-link: var(--hx-color-primary-400);

  --hx-color-surface-default: var(--hx-color-neutral-900);
  --hx-color-surface-raised: var(--hx-color-neutral-800);
  --hx-color-surface-sunken: var(--hx-color-neutral-950);

  --hx-color-border-default: var(--hx-color-neutral-700);
  --hx-color-border-subtle: var(--hx-color-neutral-800);

  --hx-body-bg: var(--hx-color-surface-default);
  --hx-body-color: var(--hx-color-text-primary);

  --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
}
```

### Method 2: System preference

Automatic dark mode via `prefers-color-scheme`. This applies unless the user has explicitly opted into light mode:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --hx-color-text-primary: var(--hx-color-neutral-100);
    --hx-color-surface-default: var(--hx-color-neutral-900);
    --hx-color-border-default: var(--hx-color-neutral-700);
    --hx-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    /* ... all dark overrides */
  }
}
```

## Dark Mode Overrides

The dark theme overrides tokens in these categories:

| Category           | What changes                                             |
| ------------------ | -------------------------------------------------------- |
| `color.text`       | Text colors flip to light neutrals (100-400)             |
| `color.surface`    | Surfaces flip to dark neutrals (800-950)                 |
| `color.border`     | Borders use dark-range neutrals (500-800)                |
| `color.focus-ring` | Focus ring stays `--hx-color-primary-400`                |
| `color.selection`  | Selection uses dark primary (800) + light text           |
| `body`             | Background and text color follow surface/text            |
| `shadow`           | Shadows increase opacity for visibility on dark surfaces |

## Theme Toggle Implementation

```js
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}
```

## WCAG Compliance

Both themes are designed to meet **WCAG 2.1 AA** requirements:

- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text and UI components
- Focus indicators visible in both light and dark contexts
- Dark mode surfaces chosen to maintain sufficient contrast between text, borders, and backgrounds

Always verify contrast ratios when overriding color tokens with custom brand values.
