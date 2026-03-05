---
title: Theme Marketplace
description: Community-contributed and commercial theme packages for HELIX on npm
---

The HELIX Theme Marketplace is a curated ecosystem of theme packages published on npm. Themes override HELIX design tokens to provide branded, industry-specific, or accessibility-optimized visual styles without modifying component internals.

## How It Works

Themes are standard npm packages that export CSS custom property overrides targeting `--hx-*` tokens. Install a theme alongside the HELIX library and apply it at the root level:

```bash
npm install @helix-themes/healthcare-blue
```

```html
<link rel="stylesheet" href="node_modules/@helix-themes/healthcare-blue/theme.css" />
```

All HELIX components use the theme automatically — no per-component changes required.

## Token Override Model

Themes operate exclusively through the [three-tier token system](/design-tokens/tiers). Override at the semantic tier for broad changes; override at the component tier for targeted adjustments.

```css
/* healthcare-blue/theme.css */
:root {
  /* Semantic tier — affects all components */
  --hx-color-primary: #005b9a;
  --hx-color-primary-hover: #004578;
  --hx-color-surface: #f0f7ff;

  /* Component tier — targets specific components */
  --hx-button-border-radius: 4px;
  --hx-card-shadow: 0 1px 4px rgba(0, 91, 154, 0.12);
}
```

## Marketplace Categories

| Category | Description | Examples |
| --- | --- | --- |
| **Healthcare** | Clinical and patient-facing interfaces | `@helix-themes/clinical`, `@helix-themes/patient-portal` |
| **Government** | Section 508 and plain-language optimized | `@helix-themes/federal`, `@helix-themes/state-agency` |
| **High Contrast** | Enhanced accessibility variants | `@helix-themes/high-contrast-light`, `@helix-themes/high-contrast-dark` |
| **Brand Kits** | Organization-specific token sets | Published under organization scopes |

## Revenue Share Program

Theme authors who publish to the HELIX marketplace participate in a revenue share program:

- **Free themes** — Listed in the marketplace directory at no cost
- **Commercial themes** — 70% of license revenue goes to the author; 30% supports marketplace infrastructure and HELIX core development
- **Enterprise bundles** — Themes included in enterprise support contracts are negotiated separately

To apply for revenue share, submit your theme through the [theme submission process](/enterprise/theme-submission).

## Quality Standards

All marketplace themes must pass the HELIX theme review checklist:

- Overrides only `--hx-*` custom properties — no component internals
- Passes WCAG 2.1 AA color contrast for all interactive states
- Provides both light and dark mode variants (or explicitly documents light-only)
- Includes a `README.md` with installation and token reference documentation
- Ships a `theme.css` entry point and an optional ESM export for programmatic use

## Finding Themes

Browse available themes on npm using the `helix-theme` keyword:

```bash
npm search helix-theme
```

Or visit the [HELIX theme directory](https://wc-2026.dev/themes) for curated listings with previews.
