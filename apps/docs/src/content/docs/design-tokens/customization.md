---
title: Customization
description: How to customize HELIX design tokens for your brand
---

HELIX is designed for easy brand customization. Override tokens at any tier to match your organization's visual identity.

## Quick Customization

Override Alias tokens to change the entire look:

```css
:root {
  /* Your brand colors */
  --wc-color-primary: #1a73e8;
  --wc-color-primary-light: #4285f4;
  --wc-color-primary-dark: #1557b0;

  /* Your brand typography */
  --wc-font-family-heading: 'Your Brand Font', sans-serif;
  --wc-font-family-body: 'Your Body Font', sans-serif;

  /* Your spacing scale */
  --wc-space-md: 1.25rem;
  --wc-space-lg: 2rem;
}
```

## Per-Component Overrides

Override Component tokens for specific components:

```css
/* Customize only buttons */
wc-button {
  --wc-button-bg: var(--your-brand-primary);
  --wc-button-border-radius: 4px;
}

/* Customize only cards */
wc-card {
  --wc-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --wc-card-border-radius: 8px;
}
```

## Terrazzo Configuration

For build-time token generation, modify the Terrazzo config:

```json
{
  "tokens": {
    "color": {
      "primary": {
        "$value": "#1a73e8",
        "$type": "color"
      }
    }
  }
}
```

## Best Practices

1. **Override Alias tokens** for global brand changes
2. **Override Component tokens** for component-specific tweaks
3. **Never modify Global tokens** unless creating a new color palette
4. **Test all themes** after customization (light, dark, high-contrast)
5. **Verify WCAG compliance** with custom colors

## Detailed Guide

See the [Pre-Planning: Design System & Token Architecture](/pre-planning/design-system/) for the complete customization system.
