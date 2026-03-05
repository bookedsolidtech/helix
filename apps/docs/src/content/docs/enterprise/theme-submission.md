---
title: Theme Submission & Review
description: How to create, submit, and publish a HELIX theme package to the marketplace
---

This guide covers the full lifecycle of a HELIX theme: scaffolding, development, review, and marketplace publication.

## Prerequisites

- Node.js 20+ and npm 10+
- Familiarity with HELIX [design token tiers](/design-tokens/tiers)
- npm account for publishing

## 1. Scaffold Your Theme

Use the HELIX theme scaffolding tool to generate a valid package structure:

```bash
npx @wc-2026/create-theme my-org-theme
cd my-org-theme
npm install
```

This generates:

```
my-org-theme/
├── src/
│   ├── tokens.css        # Your token overrides
│   └── index.ts          # Optional ESM entry
├── dist/
│   └── theme.css         # Built output (generated)
├── package.json
├── README.md
└── CHANGELOG.md
```

## 2. Define Token Overrides

Edit `src/tokens.css` to override HELIX semantic and component tokens:

```css
:root {
  /* Brand colors */
  --hx-color-primary: #1a6b3c;
  --hx-color-primary-hover: #145530;
  --hx-color-primary-active: #0f4026;

  /* Typography */
  --hx-font-family-base: 'Source Sans Pro', system-ui, sans-serif;

  /* Surfaces */
  --hx-color-surface: #f9fafb;
  --hx-color-surface-raised: #ffffff;

  /* Borders */
  --hx-border-radius-sm: 2px;
  --hx-border-radius-md: 4px;
  --hx-border-radius-lg: 6px;
}
```

**Rule**: Only override tokens prefixed with `--hx-`. Never target internal component CSS or Shadow DOM internals.

## 3. Accessibility Validation

Run the built-in contrast checker before submitting:

```bash
npm run check:contrast
```

This validates all color pairs against WCAG 2.1 AA (minimum 4.5:1 for body text, 3:1 for large text and UI components). Fix any failures before proceeding.

## 4. Test Against the Component Library

Install the HELIX library as a dev dependency and run the visual smoke test:

```bash
npm install --save-dev @wc-2026/library
npm run test:visual
```

The smoke test renders all HELIX components with your theme applied and flags any layout or legibility regressions.

## 5. Package Requirements

Your `package.json` must include:

```json
{
  "name": "@your-org/helix-theme-name",
  "version": "1.0.0",
  "keywords": ["helix-theme", "wc-2026"],
  "main": "dist/theme.css",
  "exports": {
    ".": "./dist/theme.css",
    "./module": "./dist/index.js"
  },
  "peerDependencies": {
    "@wc-2026/library": ">=1.0.0"
  },
  "helix": {
    "themeType": "full",
    "supports": ["light", "dark"],
    "wcagLevel": "AA"
  }
}
```

The `helix` metadata block is required for marketplace listing.

## 6. Submit for Review

Open a pull request to the [HELIX themes registry](https://github.com/wc-2026/themes):

1. Fork the registry repository
2. Add your package entry to `registry.json`:

```json
{
  "name": "@your-org/helix-theme-name",
  "description": "Brief description of your theme",
  "category": "healthcare",
  "author": "Your Name",
  "license": "MIT",
  "commercial": false
}
```

3. Open a PR with the title: `[theme] Add @your-org/helix-theme-name`

## 7. Review Process

The HELIX theme review team evaluates submissions on:

| Criterion | Requirement |
| --- | --- |
| Token scope | Only `--hx-*` properties overridden |
| Contrast compliance | WCAG 2.1 AA on all combinations |
| Dark mode | Present or explicitly documented as light-only |
| Documentation | README with installation and token reference |
| No breaking assumptions | Works without JavaScript changes |

Review typically completes within **5 business days**. The reviewer may request changes via PR comments.

## 8. Publishing

Once approved, publish to npm:

```bash
npm publish --access public
```

The marketplace listing updates automatically within 24 hours after npm publishes.

## Revenue Share Enrollment

To enroll in revenue share for commercial themes, email [themes@wc-2026.dev](mailto:themes@wc-2026.dev) with your npm package name and organization details. A revenue share agreement will be sent within 3 business days.
