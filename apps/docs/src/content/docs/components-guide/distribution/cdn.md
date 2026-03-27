---
title: CDN Distribution
description: Use @helixui/library directly from a CDN with ESM URLs, import maps, and version-pinned production deployments.
---

HELiX components can be used without a build step by loading them directly from a CDN. This is useful for prototypes, CMS environments, Drupal integrations, and sites without a JavaScript bundler.

## ESM CDN URLs

The published `@helixui/library` package is available from unpkg and jsDelivr as native ES modules:

### unpkg

```html
<!-- Full library bundle -->
<script type="module"
  src="https://unpkg.com/@helixui/library@latest/dist/index.js">
</script>

<!-- Individual component -->
<script type="module"
  src="https://unpkg.com/@helixui/library@latest/dist/components/hx-button/index.js">
</script>
```

### jsDelivr

```html
<!-- Full library bundle -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/index.js">
</script>

<!-- Individual component (preferred — smaller payload) -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/components/hx-button/index.js">
</script>
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
          "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js",
          "@helixui/library/components/": "https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/",
          "@helixui/tokens/lit": "https://cdn.jsdelivr.net/npm/@helixui/tokens@latest/dist/lit.js"
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
  href="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/css/helix-tokens.css"
/>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/css/helix-core.css"
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
  src="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js">
</script>

<!-- Latest — fine for prototyping, risky in production -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/index.js">
</script>
```

Update the pinned version intentionally when you are ready to adopt new changes. Use the [CHANGELOG](/components-guide/documentation/api-docs/) to review what changed between versions.

## Bundle vs Individual Component CDN

### Individual Component (Recommended for Sparse Use)

Load only the components you use. Each component's `index.js` imports only its own styles and dependencies:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3.3.2/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3.3.2/",
      "@helixui/tokens/lit": "https://cdn.jsdelivr.net/npm/@helixui/tokens@latest/dist/lit.js"
    }
  }
</script>

<!-- Only hx-button and hx-dialog -->
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-button/index.js';
  import 'https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/components/hx-dialog/index.js';
</script>
```

### Full Bundle (Convenient for Prototyping)

Load everything at once. Use `dist/index.js` which registers all components:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js">
</script>
```

The full bundle is approximately 150 KB gzipped (Lit shared + all components). Prefer individual component loading for production sites where payload matters.

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
  src="https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js"
  integrity="sha384-[hash]"
  crossorigin="anonymous">
</script>
```

Generate SRI hashes with the [jsDelivr SRI tool](https://www.jsdelivr.com/features#sri) or with `openssl`:

```bash
curl -s https://cdn.jsdelivr.net/npm/@helixui/library@1.1.2/dist/index.js \
  | openssl dgst -sha384 -binary \
  | openssl base64 -A
```

## Next Steps

- [Packaging Web Components](/components-guide/distribution/packaging/) — `package.json` exports and `files` field
- [Versioning and Changesets](/components-guide/distribution/versioning/) — semver and the changeset workflow
- [Drupal Integration](/drupal-integration/) — using HELiX via CDN in a Drupal/Twig context
