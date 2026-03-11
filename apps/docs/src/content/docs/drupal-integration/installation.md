---
title: Drupal Installation
description: How to install HELIX web components in your Drupal project
---

## Method 1: CDN (Quickest)

Add the library via CDN in your theme's `.info.yml`:

```yaml
# mytheme.info.yml
libraries:
  - mytheme/helix

# mytheme.libraries.yml
helix:
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@latest/dist/helix.bundled.js:
      type: external
      attributes:
        type: module
```

## Method 2: npm (Recommended)

Install via npm and include in your theme's build process:

```bash
cd web/themes/custom/mytheme
npm install @helixui/library
```

Then import in your theme's JavaScript:

```javascript
// mytheme.js
import '@helixui/library';
```

## Method 3: Drupal Library (Enterprise)

Create a custom module that provides the library:

```yaml
# helix.libraries.yml
components:
  version: 0.0.1
  js:
    /libraries/helix/dist/helix.bundled.js:
      type: module
      preprocess: false
  dependencies:
    - core/drupal
```

## Verification

After installation, verify components render:

```html
<!-- Add to any TWIG template -->
<hx-button variant="primary">Test Button</hx-button>
```

If the button renders with proper styling, the installation is complete.

## Next Steps

- [TWIG Patterns](/drupal-integration/twig/) - Template examples
- [Behaviors](/drupal-integration/behaviors/) - JavaScript integration
- [Troubleshooting](/drupal-integration/troubleshooting/) - Common issues
