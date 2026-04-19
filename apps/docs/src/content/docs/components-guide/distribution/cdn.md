---
title: CDN Distribution
description: Use @helixui/library directly from a CDN with ESM URLs, import maps, and version-pinned production deployments.
---

HELiX components can be used without a build step by loading them directly from a CDN. This is useful for prototypes, CMS environments, Drupal integrations, and sites without a JavaScript bundler.

:::tip[Strategy B is the recommended 3.0.0 path]
Load `dist/cdn/core.js` (registry + tokens, ~8.4KB min+gz) once, then load only the per-component modules your page uses (~2KB each). The single-file bundle remains available for prototyping but is **not recommended for production**.
:::

## Strategy B (recommended) — core + per-component

```html
<!-- Core: registry + tokens, loaded once -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/core.js"
></script>

<!-- Per-component modules — only what the page uses -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/hx-button.js"
></script>
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/cdn/hx-card.js"
></script>
```

unpkg mirror (identical paths):

```html
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/core.js"></script>
<script type="module" src="https://unpkg.com/@helixui/library@3.0.0/dist/cdn/hx-button.js"></script>
```

## Strategy A (prototyping / back-compat) — single-file bundle

The full library bundle at `dist/index.js` is still published for prototyping and backwards compatibility. It ships every component whether you use it or not (~150KB gzipped) and is not recommended for production.

```html
<!-- Not recommended for production — loads every component -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js"
></script>
```

## Import Maps for CDN Usage

Import maps let browsers resolve bare specifiers like `'lit'` and `'@helixui/library'` to CDN URLs without a bundler. Add an `<importmap>` before any `<script type="module">` that uses bare imports:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>HELiX CDN Demo</title>
    <script type="importmap">
      {
        "imports": {
          "lit": "https://cdn.jsdelivr.net/npm/lit@3.3.2/index.js",
          "lit/": "https://cdn.jsdelivr.net/npm/lit@3.3.2/",
          "lit/decorators.js": "https://cdn.jsdelivr.net/npm/lit@3.3.2/decorators.js",
          "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js",
          "@helixui/library/components/": "https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/",
          "@helixui/tokens/lit": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.0.0/dist/lit.js"
        }
      }
    </script>
  </head>
  <body>
    <hx-button variant="primary">Save</hx-button>

    <script type="module">
      import '@helixui/library/components/hx-button';
    </script>
  </body>
</html>
```

Import maps are supported in all modern browsers (Chrome 89+, Firefox 108+, Safari 16.4+) without a polyfill.

## CSS from CDN

Load the HELiX token stylesheet and component CSS bundles from CDN:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-tokens.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/css/helix-core.css"
/>
```

Available CSS bundles:

| Bundle | Contents |
|---|---|
| `helix-all.css` | Everything (tokens + all component styles) |
| `helix-tokens.css` | Design tokens only |
| `helix-core.css` | Core interactive components (button, badge, tag, etc.) |
| `helix-forms.css` | Form components (input, select, checkbox, etc.) |
| `helix-navigation.css` | Nav, tabs, breadcrumb, pagination |
| `helix-overlay.css` | Dialog, drawer, tooltip, popover |
| `helix-data.css` | Data table, structured list |

## Version Pinning for Production

Never use `@latest` in production CDN URLs. Pinning to a specific version prevents unexpected breakage from new releases:

```html
<!-- Pinned — safe for production -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js">
</script>

<!-- Latest — fine for prototyping, risky in production -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/index.js">
</script>
```

Update the pinned version intentionally when you are ready to adopt new changes. Use the [CHANGELOG](/components-guide/documentation/api-docs/) to review what changed between versions.

## Bundler-driven sites — deep component imports

When you're loading HELiX via a bundler (Vite, Webpack, Rollup) but still want CDN-delivered source for one or two components, you can import per-component entry points directly:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3.3.2/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3.3.2/",
      "@helixui/tokens/lit": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.0.0/dist/lit.js"
    }
  }
</script>

<!-- Import per-component source (not the CDN-optimized output) -->
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-button/index.js';
  import 'https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/components/hx-dialog/index.js';
</script>
```

For production pages that don't use a bundler, prefer the Strategy B pattern above — it is pre-built for CDN delivery and handles token adoption automatically.

## CDN Provider Comparison

| Provider | URL format | CORS | HTTP/2 push | SRI support |
|---|---|---|---|---|
| jsDelivr | `cdn.jsdelivr.net/npm/` | Yes | Yes | Yes |
| unpkg | `unpkg.com/` | Yes | No | No |
| Skypack | `cdn.skypack.dev/` | Yes | No | No |

jsDelivr is recommended for production use: it has the best uptime SLA, HTTP/2 multiplexing, and supports Subresource Integrity (SRI) hashes for tamper-detection.

### Subresource Integrity

Generate an SRI hash and add it to the script tag for additional security:

```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js"
  integrity="sha384-[hash]"
  crossorigin="anonymous">
</script>
```

Generate SRI hashes with the [jsDelivr SRI tool](https://www.jsdelivr.com/features#sri) or with `openssl`:

```bash
curl -s https://cdn.jsdelivr.net/npm/@helixui/library@3.0.0/dist/index.js \
  | openssl dgst -sha384 -binary \
  | openssl base64 -A
```

## Next Steps

- [Packaging Web Components](/components-guide/distribution/packaging/) — `package.json` exports and `files` field
- [Versioning and Changesets](/components-guide/distribution/versioning/) — semver and the changeset workflow
- [Drupal Integration](/drupal-integration/) — using HELiX via CDN in a Drupal/Twig context
