---
title: Getting Started with HELiX in Drupal
description: Overview of all three HELiX installation approaches for Drupal — CDN, npm, and module — with a comparison table and decision guide to help you choose the right method.
sidebar:
  order: 1
---

HELiX web components work in any Drupal 10 or 11 site. The library ships as standard ES modules built on Lit, so the only requirement is that your Drupal Libraries API definition loads the script with `attributes: { type: module }`. Everything else — how you source the file — is a choice based on your team's infrastructure and project scale.

This guide explains all three approaches, compares them honestly, and walks you through the fastest path to a working component in five minutes.

---

## The Three Installation Approaches

### 1. CDN Loading

Reference the HELiX bundle directly from jsDelivr or unpkg. You add a URL to your theme's `.libraries.yml` file and Drupal injects a `<script type="module">` tag into every page. No build pipeline, no npm, no compiled assets.

**Best for:** Prototypes, content sites, third-party themes you don't control, teams without Node.js expertise.

**Key constraint:** Your site depends on an external service. Corporate firewalls, HIPAA-compliance requirements, and offline development workflows are all blockers.

### 2. npm with a Build Pipeline

Install `@helixui/library` as a package in your theme's `package.json`, import it in your JavaScript entry point, and compile with Vite or Webpack. The bundler outputs an optimized file that Drupal loads as a local asset.

**Best for:** Custom theme development, performance-critical applications, teams with front-end build experience.

**Key constraint:** Requires Node.js, a bundler, and a build step in your deployment pipeline.

### 3. Drupal Module

Create (or install) a custom Drupal module that owns the HELiX files and registers them as Drupal library definitions. Any theme or module across your site can then attach those libraries by name.

**Best for:** Multi-site installations, enterprise governance, agency distribution to multiple clients.

**Key constraint:** Higher initial setup complexity — you maintain a custom module with install hooks, update hooks, and configuration management.

---

## Comparison Table

| Criterion | CDN | npm | Module |
|---|---|---|---|
| **Setup time** | Minutes | Hours | Days |
| **Developer skill required** | YAML only | npm + bundler | Drupal + Composer |
| **Build pipeline** | None | Required | Optional |
| **Tree-shaking** | No | Yes | No (or manual) |
| **Bundle size control** | Limited | Excellent | Good |
| **Offline development** | No | Yes | Yes |
| **HIPAA / compliance** | Risky | Compliant | Compliant |
| **Multi-site support** | Per-site setup | Per-theme setup | One-time setup |
| **Version locking** | Manual URL update | `package-lock.json` | Module version |
| **Drupal aggregation** | No | Yes | Yes |
| **Cache management** | CDN-controlled | Build-controlled | Drupal-controlled |
| **Deployment complexity** | Minimal | Moderate | High |
| **Maintenance overhead** | Low | Medium | High |

---

## Decision Guide

Work through the following questions to choose your approach.

### Is this a prototype, POC, or demo?

**Yes** → Use **CDN**. Speed to first component matters more than production concerns.

### Is this a HIPAA-compliant or patient-facing application?

**Yes** → Do **not** use CDN. Use **npm** or **Module**.

### Does your team have front-end build expertise (Node.js, Vite/Webpack)?

**No** → Use **Module** approach. Avoids npm complexity while keeping assets local.

**Yes** → Continue to the next question.

### Is this a multi-site deployment (5 or more sites)?

**Yes** → Use **Module** approach. Centralized management scales far better than per-theme npm setups.

**No** → Use **npm** approach for a custom theme, or **Module** if you're working with a contrib or third-party theme.

### Do you need maximum performance (Lighthouse score above 95)?

**Yes** → Use **npm** with tree-shaking. Only the components your theme actually uses will ship to the browser.

---

## Quick 5-Minute Setup via CDN

If you're evaluating HELiX or building a prototype, this is the fastest path.

### What you'll need

- An existing Drupal 10 or 11 site
- A custom theme with a `.libraries.yml` file

### Step 1: Add the library definition

Open your theme's `mytheme.libraries.yml` and add:

```yaml
helix-components:
  version: 1.1.2
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js:
      type: external
      attributes:
        type: module
      preprocess: false
```

**Important:** The `attributes: { type: module }` line is required. HELiX ships as an ES module — without this attribute, browsers will reject the script.

The correct file path for the Drupal `libraries.yml` `js:` entry is `dist/index.js` (the npm entry point). For CDN-loaded integrations see the [Drupal CDN guide](/drupal/installation/cdn) — 3.0.0 ships `dist/cdn/core.js` plus per-component modules for that path.

### Step 2: Attach the library globally

Open your theme's `mytheme.info.yml` and add the library to the `libraries` key:

```yaml
name: My Theme
type: theme
core_version_requirement: ^10 || ^11
base theme: stable9

libraries:
  - mytheme/helix-components
```

This loads HELiX on every page. For selective loading, skip this step and use `{{ attach_library('mytheme/helix-components') }}` inside individual Twig templates instead.

### Step 3: Clear caches

```bash
drush cr
```

### Step 4: Add a component to a template

Open any Twig template and try a button:

```twig
<hx-button variant="primary" hx-size="lg">Get Started</hx-button>
```

Note the `hx-size` attribute — HELiX uses prefixed attribute names to avoid conflicts with native HTML attributes. Use `hx-size` rather than `size`.

### Step 5: Verify in the browser

Open DevTools and check:

1. **Network tab** — `index.js` from `cdn.jsdelivr.net` returns HTTP 200
2. **Elements tab** — `<hx-button>` should have a `#shadow-root (open)` inside it
3. **Console** — No errors referencing `@helixui/library`

If the Shadow DOM is present, installation succeeded.

---

## Current Package Versions

| Package | Version | Purpose |
|---|---|---|
| `@helixui/library` | `1.1.2` | Web components (buttons, cards, inputs, etc.) |
| `@helixui/tokens` | `0.3.4` | Design tokens (colors, spacing, typography) |

All installation guides on this site use these versions.

---

## CDN URLs Reference

| Use case | URL |
|---|---|
| Full bundle | `https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/index.js` |
| CSS bundle | `https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/css/helix-all.css` |
| Single component (example) | `https://cdn.jsdelivr.net/npm/@helixui/library@3.9.0/dist/components/hx-button/index.js` |

---

## Drupal Version Compatibility

HELiX is compatible with Drupal 10 and Drupal 11. Set your theme or module's `core_version_requirement` accordingly:

```yaml
core_version_requirement: ^10 || ^11
```

There are no PHP version dependencies — HELiX is entirely a front-end library loaded as a JavaScript asset.

---

## Next Steps

- [CDN Installation](/drupal/installation/cdn/) — Full guide covering version pinning, SRI hashes, fallback patterns, and per-component loading
- [npm Installation](/drupal/installation/npm/) — Complete build pipeline setup with Vite and Webpack configurations
- [Module Installation](/drupal/installation/module/) — Custom Drupal module scaffolding for enterprise multi-site deployments
