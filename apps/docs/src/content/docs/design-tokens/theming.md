---
title: Theming
description: How to apply and create themes with HELIX design tokens
---

HELIX supports multiple themes through the design token system. Themes are applied by swapping Alias token values while keeping Component tokens unchanged.

## Built-in Themes

### Light Theme (Default)

```css
:root {
  --wc-color-primary: var(--wc-blue-600);
  --wc-color-surface: var(--wc-gray-50);
  --wc-color-text-primary: var(--wc-gray-900);
}
```

### Dark Theme

```css
[data-theme='dark'] {
  --wc-color-primary: var(--wc-blue-400);
  --wc-color-surface: var(--wc-gray-900);
  --wc-color-text-primary: var(--wc-gray-50);
}
```

### High Contrast Theme

```css
[data-theme='high-contrast'] {
  --wc-color-primary: var(--wc-blue-900);
  --wc-color-surface: var(--wc-white);
  --wc-color-text-primary: var(--wc-black);
}
```

## Applying Themes

Themes are applied via a `data-theme` attribute on the document root:

```html
<html data-theme="dark"></html>
```

Components automatically respond to theme changes through CSS custom property inheritance.

## Healthcare Compliance

The High Contrast theme meets **WCAG 2.1 AAA** requirements:

- Minimum 7:1 contrast ratio for text
- Minimum 4.5:1 contrast ratio for UI components
- Enhanced focus indicators

## Detailed Specification

See the [Pre-Planning: Design System & Token Architecture](/pre-planning/design-system/) for the complete theming system.
