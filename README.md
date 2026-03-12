<div align="center">

<!-- Hero Banner -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/docs/src/assets/logos/helix-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="apps/docs/src/assets/logos/helix-logo-light.svg">
  <img alt="HELiX — Enterprise Healthcare Web Component Library" src="apps/docs/src/assets/logos/helix-logo-light.svg" width="400">
</picture>

### Enterprise Healthcare Web Component Library

A production-ready Web Component library built with Lit 3.x and TypeScript for healthcare organizations that demand accessibility compliance, design token theming, and Drupal CMS integration.

<!-- Badge Row -->

[![npm version](https://img.shields.io/npm/v/@helixui/library?logo=npm&label=npm)](https://www.npmjs.com/package/@helixui/library)
[![CI Status](https://img.shields.io/github/actions/workflow/status/bookedsolidtech/helix/ci.yml?branch=main&label=CI&logo=github)](https://github.com/bookedsolidtech/helix/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-%3C50KB%20gzip-success)](packages/hx-library)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](tsconfig.base.json)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG%202.1-AA%20compliant-success)](https://www.w3.org/TR/WCAG21/)

[Documentation](https://helix.bookedsolid.tech) · [Storybook](https://helix.bookedsolid.tech/storybook/) · [NPM Package](https://www.npmjs.com/package/@helixui/library) · [Contributing](CONTRIBUTING.md)

</div>

---

## Quick Start

```bash
npm install @helixui/library
```

Then use components in your HTML:

```html
<script type="module">
  import '@helixui/library';
</script>

<hx-button variant="primary">Get Started</hx-button>

<hx-card variant="outlined" elevation="raised">
  <span slot="heading">Patient Portal</span>
  <p>Accessible, themeable components for healthcare UIs.</p>
  <hx-button slot="footer" variant="primary">Learn More</hx-button>
</hx-card>
```

Or import individual components for optimal tree-shaking:

```js
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-card';
```

---

## Why HELiX?

- **Healthcare accessibility built in** — WCAG 2.1 AA compliant out of the box, meeting the [HHS mandate (May 2026)](https://www.hhs.gov/civil-rights/for-providers/compliance-enforcement/digital-accessibility/). Every component is keyboard-navigable, screen reader compatible, and tested with axe-core.

- **Framework-agnostic Web Components** — Built on Lit 3.x and the Web Components standard. Works in React, Angular, Vue, Drupal, or plain HTML. No framework lock-in, no adapter libraries.

- **Design token theming** — Three-tier token architecture (primitive → semantic → component) with CSS custom properties. Theme entire applications by overriding `--hx-*` tokens — light mode, dark mode, and high contrast modes included.

- **Enterprise-grade quality** — TypeScript strict mode, 73 components, 3-tier code review, automated accessibility testing, and <5KB per component (gzipped). Built for organizations where software failures impact patient care.

---

## Components

HELiX ships **73 production components** spanning the full spectrum of UI needs:

| Category         | Components                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Actions**      | `hx-button`, `hx-button-group`, `hx-copy-button`, `hx-action-bar`                                                           |
| **Forms**        | `hx-text-input`, `hx-checkbox`, `hx-radio-group`, `hx-select`, `hx-combobox`, `hx-date-picker`, `hx-file-upload`, `hx-form` |
| **Data Display** | `hx-card`, `hx-data-table`, `hx-list`, `hx-tree-view`, `hx-badge`, `hx-avatar`, `hx-tag`                                    |
| **Feedback**     | `hx-alert`, `hx-toast`, `hx-progress-bar`, `hx-spinner`, `hx-skeleton`                                                      |
| **Navigation**   | `hx-breadcrumb`, `hx-tabs`, `hx-pagination`, `hx-sidebar`, `hx-menu`                                                        |
| **Layout**       | `hx-grid`, `hx-container`, `hx-divider`, `hx-header`, `hx-stack`                                                            |
| **Overlays**     | `hx-dialog`, `hx-drawer`, `hx-tooltip`, `hx-popover`, `hx-dropdown`                                                         |

[Browse all components in Storybook →](https://helix.bookedsolid.tech/storybook/)

---

## Documentation

Full documentation is available at **[helix.bookedsolid.tech](https://helix.bookedsolid.tech)**:

- **Getting Started** — Installation, setup, and first component
- **Component API Reference** — Auto-generated from Custom Elements Manifest
- **Design Tokens** — Token architecture, theming guide, and token reference
- **Drupal Integration** — Twig templates, Drupal behaviors, and CDN delivery
- **Accessibility** — WCAG compliance guide and testing procedures

---

## Drupal Integration

HELiX is designed for seamless Drupal CMS integration:

```twig
{# node--article--teaser.html.twig #}
<hx-card variant="outlined" elevation="raised" href="{{ url }}">
  <img slot="image" src="{{ image_url }}" alt="{{ image_alt }}">
  <span slot="heading">{{ node.label }}</span>
  {{ node.body.summary }}
</hx-card>
```

See the [Drupal Integration Guide](https://helix.bookedsolid.tech/guides/drupal/) for complete setup instructions, Twig patterns, and JavaScript behaviors.

---

## Development

### Prerequisites

- Node.js 20+
- Git

### Setup

```bash
git clone https://github.com/bookedsolidtech/helix.git
cd helix
npm install
npm run dev        # Start library + Storybook + docs
```

### Commands

```bash
npm run dev            # All apps + library (Turborepo)
npm run dev:storybook  # Storybook on port 3151
npm run dev:docs       # Documentation site on port 3150
npm run build          # Build everything
npm run test           # Run all tests (Vitest browser mode)
npm run type-check     # TypeScript strict check
npm run verify         # Lint + format + type-check (required before push)
```

---

## Tech Stack

| Layer      | Technology                                                          |
| ---------- | ------------------------------------------------------------------- |
| Components | [Lit 3.x](https://lit.dev), Shadow DOM, CSS Parts, ElementInternals |
| Language   | TypeScript (strict mode)                                            |
| Build      | Vite library mode, per-component entry points                       |
| Testing    | Vitest browser mode + Playwright                                    |
| API Docs   | Custom Elements Manifest (CEM)                                      |
| Stories    | [Storybook 10.x](https://storybook.js.org)                          |
| Docs       | [Astro Starlight](https://starlight.astro.build)                    |
| Monorepo   | [Turborepo](https://turbo.build) + npm workspaces                   |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. All contributions must:

- Pass TypeScript strict mode (`npm run type-check`)
- Include tests with 80%+ coverage
- Meet WCAG 2.1 AA accessibility standards
- Include Storybook stories for all variants

---

## License

[MIT](LICENSE)

---

<div align="center">

**[Documentation](https://helix.bookedsolid.tech)** · **[Storybook](https://helix.bookedsolid.tech/storybook/)** · **[NPM](https://www.npmjs.com/package/@helixui/library)** · **[Issues](https://github.com/bookedsolidtech/helix/issues)**

Built with care for healthcare.

</div>
