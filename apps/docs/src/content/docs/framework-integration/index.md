---
title: 'Framework Integration'
description: 'How to use HELIX web components in React, Vue, Angular, plain HTML, and Drupal.'
sidebar:
  order: 1
---

# Framework Integration

HELIX components are standard custom elements — they work in any framework or no framework at all. This section covers the specific patterns and gotchas for each environment.

## Why Framework-Specific Guides?

Web components are framework-agnostic by design, but frameworks differ in:

- **Event binding** — React uses synthetic events; Vue/Angular have their own binding syntax
- **Boolean attributes** — Frameworks handle `disabled`, `required`, etc. differently
- **Form integration** — React Controlled Components don't interop with `ElementInternals` the same way
- **TypeScript types** — JSX type declarations differ from Angular template types
- **SSR** — Custom element registration is browser-only; each framework handles SSR differently

## Choose Your Guide

| Framework | Use Case |
|-----------|----------|
| [React](/framework-integration/react) | React 18+, Next.js |
| [Vue](/framework-integration/vue) | Vue 3, Nuxt |
| [Angular](/framework-integration/angular) | Angular 16+ |
| [Plain HTML](/framework-integration/html) | CDN / no-build setup |
| [Drupal](/framework-integration/drupal) | Drupal CMS / Twig templates |

## Installation

All guides assume the library is installed via npm:

```bash
npm install @helix/library
```

Or loaded via CDN — see the [Plain HTML guide](/framework-integration/html).
