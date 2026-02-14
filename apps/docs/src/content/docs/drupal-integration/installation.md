---
title: Drupal Installation
description: How to install WC-2026 web components in your Drupal project
---

## Method 1: CDN (Quickest)

Add the library via CDN in your theme's `.info.yml`:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/wc-2026

# mytheme.libraries.yml
wc-2026:
  js:
    https://cdn.jsdelivr.net/npm/@wc-2026/library@latest/dist/wc-2026.bundled.js:
      type: external
      attributes:
        type: module
```

## Method 2: npm (Recommended)

Install via npm and include in your theme's build process:

```bash
cd web/themes/custom/mytheme
npm install @wc-2026/library
```

Then import in your theme's JavaScript:

```javascript
// mytheme.js
import '@wc-2026/library';
```

## Method 3: Drupal Library (Enterprise)

Create a custom module that provides the library:

```yaml
# wc_2026.libraries.yml
components:
  version: 0.0.1
  js:
    /libraries/wc-2026/dist/wc-2026.bundled.js:
      type: module
      preprocess: false
  dependencies:
    - core/drupal
```

## Verification

After installation, verify components render:

```html
<!-- Add to any TWIG template -->
<wc-button variant="primary">Test Button</wc-button>
```

If the button renders with proper styling, the installation is complete.

## Next Steps

- [TWIG Patterns](/drupal-integration/twig/) - Template examples
- [Behaviors](/drupal-integration/behaviors/) - JavaScript integration
- [Troubleshooting](/drupal-integration/troubleshooting/) - Common issues
